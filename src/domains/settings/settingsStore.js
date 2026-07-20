import { defineStore } from 'pinia'
import { ref } from 'vue'
import { electronApi } from '@/api/electron'
import { createDefaultCombatAssist, normalizeCombatAssist } from '@/utils/combatConfig'
import { DEFAULT_GLOBAL_SHORTCUTS, mergeGlobalShortcutSettings } from '@/utils/shortcutConfig'

function sanitizeCurrencyPositions(positions = {}) {
  const { chisel, ...rest } = positions
  return rest
}

export const useSettingsStore = defineStore('settings', () => {
  const normalizeDelays = (raw = {}) => {
    const mouseMove = raw.mouseMove ?? 260
    const action = raw.action ?? Math.max(raw.mouseClick ?? 0, raw.keyPress ?? 0, 65)
    const clipboardRead = raw.clipboardRead ?? 100

    return {
      mouseMove,
      action,
      clipboardRead
    }
  }

  const globalShortcuts = ref({ ...DEFAULT_GLOBAL_SHORTCUTS })

  const combatAssist = ref(createDefaultCombatAssist())

  const currencyPositions = ref({
    alteration: { x: 210, y: 561 },      // 改造石
    augmentation: { x: 425, y: 663 },    // 增幅石
    regal: { x: 830, y: 555 },           // 富豪石
    chaos: { x: 1040, y: 567 },          // 混沌石
    exalted: { x: 570, y: 567 },         // 崇高石
    alchemy: { x: 933, y: 567 },         // 点金石
    scouring: { x: 822, y: 1000 },       // 重铸石
    transmutation: { x: 110, y: 567 },   // 蜕变石
    jewellers: { x: 209, y: 797 },       // 工匠石
    fusing: { x: 323, y: 797 },          // 链结石
    chromic: { x: 428, y: 798 },         // 幻色石
    vaal: { x: 1158, y: 1017 },          // 瓦尔宝珠
    wisdom: { x: 210, y: 430 }           // 知识卷轴
  })

  // 背包设置
  const inventory = ref({
    startPos: { x: 2658, y: 1199 },      // 首格坐标
    slotSize: { w: 100, h: 100 }         // 单格宽高
  })

  const delays = ref(normalizeDelays())

  const itemPosition = ref({
    x: 636,
    y: 930
  })

  const dpiScale = ref(1.0)
  const debugMode = ref(false)

  // 覆盖层设置
  const overlaySettings = ref({
    backgroundPath: '',      // 文件路径
    blur: 4,                 // 模糊像素
    maskOpacity: 0.5         // 遮罩透明度 (0-1)
  })

  // 背景历史记录
  const backgroundHistory = ref([])

  function updateGlobalShortcuts(shortcuts) {
    globalShortcuts.value = { ...globalShortcuts.value, ...shortcuts }
    saveSettings()
  }

  function updateCurrencyPosition(currency, position) {
    currencyPositions.value[currency] = { ...position }
    saveSettings()
  }

  function updateInventorySettings(settings) {
    inventory.value = { ...inventory.value, ...settings }
    saveSettings()
  }

  function updateDelays(newDelays) {
    delays.value = normalizeDelays({ ...delays.value, ...newDelays })
    saveSettings()
  }

  function updateCombatAssist(config) {
    combatAssist.value = normalizeCombatAssist(config)
    saveSettings()
  }

  function updateItemPosition(position) {
    itemPosition.value = { ...position }
    saveSettings()
  }

  function updateDpiScale(scale) {
    dpiScale.value = scale
    saveSettings()
  }

  function updateOverlaySettings(settings) {
    overlaySettings.value = { ...overlaySettings.value, ...settings }
    
    // Add to history if path is valid and not already at the top
    if (settings.backgroundPath) {
      addToHistory({
        path: settings.backgroundPath
      })
    }

    saveSettings()
    // 通知 Overlay 窗口更新
    if (electronApi && electronApi.overlay && electronApi.overlay.updateSettings) {
      // 使用 JSON.parse(JSON.stringify()) 去除 Proxy 包装，确保 IPC 通信正常
      electronApi.overlay.updateSettings(JSON.parse(JSON.stringify(overlaySettings.value)))
    }
  }

  function addToHistory(item) {
    // Remove existing entry if present (to move to top)
    const index = backgroundHistory.value.findIndex(h => h.path === item.path)
    if (index !== -1) {
      backgroundHistory.value.splice(index, 1)
    }
    
    // Add to beginning
    backgroundHistory.value.unshift(item)
    
    // Limit to 6 items
    if (backgroundHistory.value.length > 6) {
      backgroundHistory.value = backgroundHistory.value.slice(0, 6)
    }
  }

  function removeHistoryItem(index) {
    backgroundHistory.value.splice(index, 1)
    saveSettings()
  }

  function saveSettings() {
    try {
      localStorage.setItem('settings', JSON.stringify({
        globalShortcuts: globalShortcuts.value,
        currencyPositions: sanitizeCurrencyPositions(currencyPositions.value),
        inventory: inventory.value,
        delays: delays.value,
        itemPosition: itemPosition.value,
        dpiScale: dpiScale.value,
        debugMode: debugMode.value,
        overlaySettings: overlaySettings.value,
        backgroundHistory: backgroundHistory.value,
        combatAssist: combatAssist.value
      }))
    } catch (error) {
      // 保存设置失败
    }
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem('settings')
      if (saved) {
        const data = JSON.parse(saved)
        if (data.globalShortcuts) {
          let legacyBag = {}
          try {
            legacyBag = JSON.parse(localStorage.getItem('bagSettings') || '{}')
          } catch {}
          globalShortcuts.value = mergeGlobalShortcutSettings(data.globalShortcuts, legacyBag)
        } else {
          let legacyBag = {}
          try {
            legacyBag = JSON.parse(localStorage.getItem('bagSettings') || '{}')
          } catch {}
          globalShortcuts.value = mergeGlobalShortcutSettings({}, legacyBag)
        }
        if (data.currencyPositions) {
          currencyPositions.value = {
            ...currencyPositions.value,
            ...sanitizeCurrencyPositions(data.currencyPositions)
          }
        } else {
          currencyPositions.value = sanitizeCurrencyPositions(currencyPositions.value)
        }
        if (data.inventory) {
          inventory.value = { ...inventory.value, ...data.inventory }
        }
        if (data.delays) {
          delays.value = normalizeDelays(data.delays)
        }
        if (data.itemPosition) {
          itemPosition.value = { ...data.itemPosition }
        }
        if (data.dpiScale) {
          dpiScale.value = data.dpiScale
        }
        if (typeof data.debugMode === 'boolean') {
          debugMode.value = data.debugMode
        }
        if (data.overlaySettings) {
          overlaySettings.value = { ...overlaySettings.value, ...data.overlaySettings }
          // 移除旧数据中的 backgroundType（如果存在）
          if (overlaySettings.value.backgroundType) {
            delete overlaySettings.value.backgroundType
          }
        }
        if (data.backgroundHistory) {
          backgroundHistory.value = data.backgroundHistory
        }
        combatAssist.value = normalizeCombatAssist(data.combatAssist)
      } else {
        let legacyBag = {}
        try {
          legacyBag = JSON.parse(localStorage.getItem('bagSettings') || '{}')
        } catch {}
        globalShortcuts.value = mergeGlobalShortcutSettings({}, legacyBag)
      }
    } catch (error) {
      // 加载设置失败
    }
  }

  // 默认值（用于重置）
  const defaultGlobalShortcuts = DEFAULT_GLOBAL_SHORTCUTS

  const defaultCurrencyPositions = {
    alteration: { x: 210, y: 561 },
    augmentation: { x: 425, y: 663 },
    regal: { x: 830, y: 555 },
    chaos: { x: 1040, y: 567 },
    exalted: { x: 570, y: 567 },
    alchemy: { x: 933, y: 567 },
    scouring: { x: 822, y: 1000 },
    transmutation: { x: 110, y: 567 },
    jewellers: { x: 209, y: 797 },
    fusing: { x: 323, y: 797 },
    chromic: { x: 428, y: 798 },
    vaal: { x: 1158, y: 1017 },
    wisdom: { x: 210, y: 430 }
  }

  const defaultInventory = {
    startPos: { x: 2658, y: 1199 },
    slotSize: { w: 100, h: 100 }
  }

  const defaultDelays = normalizeDelays()

  const defaultItemPosition = {
    x: 636,
    y: 930
  }

  const defaultOverlaySettings = {
    backgroundPath: '',
    blur: 4,
    maskOpacity: 0.5
  }

  function resetSettings() {
    globalShortcuts.value = { ...defaultGlobalShortcuts }
    currencyPositions.value = { ...defaultCurrencyPositions }
    inventory.value = { ...defaultInventory }
    delays.value = { ...defaultDelays }
    itemPosition.value = { ...defaultItemPosition }
    debugMode.value = false
    overlaySettings.value = { ...defaultOverlaySettings }
    backgroundHistory.value = []
    combatAssist.value = createDefaultCombatAssist()
    saveSettings()
    // 同步重置后的设置
    if (electronApi && electronApi.overlay && electronApi.overlay.updateSettings) {
      // 使用 JSON.parse(JSON.stringify()) 去除 Proxy 包装，确保 IPC 通信正常
      electronApi.overlay.updateSettings(JSON.parse(JSON.stringify(overlaySettings.value)))
    }
    electronApi.window.setDevToolsVisible(false)
  }

  function updateDebugMode(enabled) {
    debugMode.value = Boolean(enabled)
    saveSettings()
  }

  // 初始化时加载
  loadSettings()

  return {
    globalShortcuts,
    combatAssist,
    currencyPositions,
    inventory,
    delays,
    itemPosition,
    dpiScale,
    debugMode,
    overlaySettings,
    backgroundHistory,
    updateGlobalShortcuts,
    updateCombatAssist,
    updateCurrencyPosition,
    updateInventorySettings,
    updateDelays,
    updateItemPosition,
    updateDpiScale,
    updateDebugMode,
    updateOverlaySettings,
    removeHistoryItem,
    saveSettings,
    loadSettings,
    resetSettings
  }
})
