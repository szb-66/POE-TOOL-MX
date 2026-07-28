import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { electronApi } from '@/api/electron'
import { createDefaultCombatAssist, normalizeCombatAssist } from '@/utils/combatConfig'
import { DEFAULT_GLOBAL_SHORTCUTS, mergeGlobalShortcutSettings } from '@/utils/shortcutConfig'
import { OPERATION_DELAY, migrateOperationDelay, normalizeOperationDelay } from '@/utils/operationDelay'
import { EMPTY_SLOT_THRESHOLD, normalizeEmptySlotThreshold } from '@/utils/inventorySettings'
import {
  DEFAULT_STORY_OVERLAY_OPACITY,
  DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL,
  normalizeStoryOverlayOpacity,
  normalizeStoryShowSkillRequiredLevel
} from './storySkillSettings'
import {
  DPI_MODE_AUTO,
  DPI_MODE_MANUAL,
  loadDpiSettings,
  normalizeDpiScale,
  resolveEffectiveDpi
} from '@/utils/dpiSettings'

function sanitizeCurrencyPositions(positions = {}) {
  const { chisel, ...rest } = positions
  return rest
}

export const useSettingsStore = defineStore('settings', () => {
  const globalShortcuts = ref({ ...DEFAULT_GLOBAL_SHORTCUTS })
  const shortcutHealth = ref({ status: 'pending', error: '', failed: [] })

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
    slotSize: { w: 100, h: 100 },        // 单格宽高
    emptySlotThreshold: EMPTY_SLOT_THRESHOLD.default
  })

  const operationDelayMs = ref(OPERATION_DELAY.default)

  const itemPosition = ref({
    x: 636,
    y: 930
  })

  const dpiMode = ref(DPI_MODE_AUTO)
  const manualDpiScale = ref(1)
  const lastDetectedDpiScale = ref(null)
  const detectedDpiScale = ref(null)
  const primaryDpiScale = ref(1)
  const dpiDetectionStatus = ref('idle')
  const dpiWindowTitle = ref('')
  const dpiDetectionError = ref('')
  const effectiveDpi = computed(() => resolveEffectiveDpi({
    mode: dpiMode.value,
    manualScale: manualDpiScale.value,
    detectedScale: detectedDpiScale.value,
    lastDetectedScale: lastDetectedDpiScale.value,
    primaryScale: primaryDpiScale.value
  }))
  const dpiScale = computed(() => effectiveDpi.value.scaleFactor)
  const dpiSource = computed(() => effectiveDpi.value.source)
  const debugMode = ref(false)

  // 覆盖层设置
  const overlaySettings = ref({
    backgroundPath: '',      // 文件路径
    blur: 4,                 // 模糊像素
    maskOpacity: 0.5         // 遮罩透明度 (0-1)
  })
  const storyOverlayWidth = ref(560)
  const storyOverlayOpacity = ref(DEFAULT_STORY_OVERLAY_OPACITY)
  const storyShowSkillRequiredLevel = ref(DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL)

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
    inventory.value = {
      ...inventory.value,
      ...settings,
      emptySlotThreshold: normalizeEmptySlotThreshold(
        settings?.emptySlotThreshold ?? inventory.value.emptySlotThreshold
      )
    }
    saveSettings()
    if ('emptySlotThreshold' in (settings || {})) {
      electronApi.bag.updateEmptySlotThreshold(inventory.value.emptySlotThreshold)?.catch(() => {})
    }
    return inventory.value
  }

  function updateShortcutHealth(result = {}) {
    shortcutHealth.value = {
      status: result.success === true ? 'ready' : 'error',
      error: String(result.error || ''),
      failed: Array.isArray(result.failed) ? result.failed : []
    }
  }

  function updateOperationDelay(value) {
    operationDelayMs.value = normalizeOperationDelay(value)
    saveSettings()
    electronApi.bag.updateOperationDelay(operationDelayMs.value)?.catch(() => {})
    return operationDelayMs.value
  }

  function updateCombatAssist(config) {
    combatAssist.value = normalizeCombatAssist(config)
    saveSettings()
  }

  function updateItemPosition(position) {
    itemPosition.value = { ...position }
    saveSettings()
  }

  function updateManualDpiScale(scale) {
    manualDpiScale.value = normalizeDpiScale(scale, manualDpiScale.value)
    saveSettings()
  }

  function updateDpiMode(mode) {
    dpiMode.value = mode === DPI_MODE_MANUAL ? DPI_MODE_MANUAL : DPI_MODE_AUTO
    if (dpiMode.value === DPI_MODE_MANUAL) {
      detectedDpiScale.value = null
      dpiDetectionStatus.value = 'idle'
      dpiDetectionError.value = ''
    }
    saveSettings()
  }

  async function refreshDpiScale() {
    if (dpiMode.value !== DPI_MODE_AUTO) {
      return { success: true, skipped: true, scaleFactor: dpiScale.value, source: dpiSource.value }
    }
    dpiDetectionStatus.value = 'detecting'
    dpiDetectionError.value = ''
    try {
      const result = await electronApi.system.detectGameDpi()
      primaryDpiScale.value = normalizeDpiScale(result?.primaryScaleFactor, primaryDpiScale.value)
      const detected = result?.found ? normalizeDpiScale(result.scaleFactor, null) : null
      if (detected != null) {
        detectedDpiScale.value = detected
        lastDetectedDpiScale.value = detected
        dpiWindowTitle.value = String(result.windowTitle || '')
        dpiDetectionStatus.value = 'success'
        saveSettings()
        return { success: true, scaleFactor: dpiScale.value, source: dpiSource.value, windowTitle: dpiWindowTitle.value }
      }
      detectedDpiScale.value = null
      dpiWindowTitle.value = ''
      dpiDetectionStatus.value = 'error'
      dpiDetectionError.value = result?.error || '未找到游戏窗口'
    } catch (error) {
      detectedDpiScale.value = null
      dpiWindowTitle.value = ''
      dpiDetectionStatus.value = 'error'
      dpiDetectionError.value = error?.message || '识别游戏 DPI 失败'
    }
    saveSettings()
    return { success: false, scaleFactor: dpiScale.value, source: dpiSource.value, error: dpiDetectionError.value }
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
        operationDelayMs: operationDelayMs.value,
        itemPosition: itemPosition.value,
        dpiScale: dpiScale.value,
        dpiMode: dpiMode.value,
        manualDpiScale: manualDpiScale.value,
        lastDetectedDpiScale: lastDetectedDpiScale.value,
        debugMode: debugMode.value,
        overlaySettings: overlaySettings.value,
        storyOverlayWidth: storyOverlayWidth.value,
        storyOverlayOpacity: storyOverlayOpacity.value,
        storyShowSkillRequiredLevel: storyShowSkillRequiredLevel.value,
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
      const data = saved ? JSON.parse(saved) : {}
      let legacyBagSettings = {}
      try { legacyBagSettings = JSON.parse(localStorage.getItem('bagSettings') || '{}') } catch (_error) { /* ignore invalid legacy data */ }
      operationDelayMs.value = migrateOperationDelay(data, legacyBagSettings)
      if (saved) {
        if (data.globalShortcuts) {
          globalShortcuts.value = mergeGlobalShortcutSettings(data.globalShortcuts)
        } else {
          globalShortcuts.value = mergeGlobalShortcutSettings()
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
          inventory.value = {
            ...inventory.value,
            ...data.inventory,
            emptySlotThreshold: normalizeEmptySlotThreshold(data.inventory.emptySlotThreshold)
          }
        }
        if (data.itemPosition) {
          itemPosition.value = { ...data.itemPosition }
        }
        const dpiSettings = loadDpiSettings(data)
        dpiMode.value = dpiSettings.mode
        manualDpiScale.value = dpiSettings.manualScale
        lastDetectedDpiScale.value = dpiSettings.lastDetectedScale
        if (typeof data.debugMode === 'boolean') {
          debugMode.value = data.debugMode
        }
        if (data.overlaySettings) {
          overlaySettings.value = { ...overlaySettings.value, ...data.overlaySettings }
        }
        if (data.backgroundHistory) {
          backgroundHistory.value = data.backgroundHistory
        }
        if (data.storyOverlayWidth != null) {
          storyOverlayWidth.value = Math.max(360, Math.min(1200, Math.round(Number(data.storyOverlayWidth) || 560)))
        }
        storyOverlayOpacity.value = normalizeStoryOverlayOpacity(data.storyOverlayOpacity)
        storyShowSkillRequiredLevel.value = normalizeStoryShowSkillRequiredLevel(data.storyShowSkillRequiredLevel)
        combatAssist.value = normalizeCombatAssist(data.combatAssist)
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

  const updateStoryOverlayWidth = (width) => {
    storyOverlayWidth.value = Math.max(360, Math.min(1200, Math.round(Number(width) || 560)))
    saveSettings()
    electronApi.storyOverlay.resize({ width: storyOverlayWidth.value })
  }

  const updateStoryShowSkillRequiredLevel = (visible) => {
    storyShowSkillRequiredLevel.value = Boolean(visible)
    saveSettings()
  }

  const updateStoryOverlayOpacity = (opacity) => {
    storyOverlayOpacity.value = normalizeStoryOverlayOpacity(opacity)
    saveSettings()
    electronApi.storyOverlay.setOpacity(storyOverlayOpacity.value)
  }

  const defaultInventory = {
    startPos: { x: 2658, y: 1199 },
    slotSize: { w: 100, h: 100 },
    emptySlotThreshold: EMPTY_SLOT_THRESHOLD.default
  }

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
    operationDelayMs.value = OPERATION_DELAY.default
    itemPosition.value = { ...defaultItemPosition }
    dpiMode.value = DPI_MODE_AUTO
    manualDpiScale.value = 1
    lastDetectedDpiScale.value = null
    detectedDpiScale.value = null
    primaryDpiScale.value = 1
    dpiDetectionStatus.value = 'idle'
    dpiWindowTitle.value = ''
    dpiDetectionError.value = ''
    debugMode.value = false
    overlaySettings.value = { ...defaultOverlaySettings }
    storyOverlayWidth.value = 560
    storyOverlayOpacity.value = DEFAULT_STORY_OVERLAY_OPACITY
    storyShowSkillRequiredLevel.value = DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL
    backgroundHistory.value = []
    combatAssist.value = createDefaultCombatAssist()
    saveSettings()
    electronApi.bag.updateOperationDelay(operationDelayMs.value)?.catch(() => {})
    electronApi.bag.updateEmptySlotThreshold(inventory.value.emptySlotThreshold)?.catch(() => {})
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
    shortcutHealth,
    combatAssist,
    currencyPositions,
    inventory,
    operationDelayMs,
    itemPosition,
    dpiScale,
    dpiMode,
    manualDpiScale,
    lastDetectedDpiScale,
    detectedDpiScale,
    primaryDpiScale,
    dpiSource,
    dpiDetectionStatus,
    dpiWindowTitle,
    dpiDetectionError,
    debugMode,
    overlaySettings,
    storyOverlayWidth,
    storyOverlayOpacity,
    storyShowSkillRequiredLevel,
    backgroundHistory,
    updateGlobalShortcuts,
    updateShortcutHealth,
    updateCombatAssist,
    updateCurrencyPosition,
    updateInventorySettings,
    updateOperationDelay,
    updateItemPosition,
    updateManualDpiScale,
    updateDpiMode,
    refreshDpiScale,
    updateDebugMode,
    updateOverlaySettings,
    updateStoryOverlayWidth,
    updateStoryOverlayOpacity,
    updateStoryShowSkillRequiredLevel,
    removeHistoryItem,
    saveSettings,
    loadSettings,
    resetSettings
  }
})
