import { defineStore } from 'pinia'
import { ref } from 'vue'
import { electronApi } from '@/api/electron'

export const useSettingsStore = defineStore('settings', () => {
  const globalShortcuts = ref({
    itemStart: 'Alt+1',    // 物品开始快捷键
    mapStart: 'Alt+2',     // 地图开始快捷键
    end: 'Alt+3'           // 结束快捷键（全局）
  })

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
    chisel: { x: 1158, y: 426 },         // 制图钉
    vaal: { x: 1158, y: 1017 },          // 瓦尔宝珠
    wisdom: { x: 210, y: 430 }           // 知识卷轴
  })

  // 背包设置
  const inventory = ref({
    startPos: { x: 2658, y: 1199 },      // 首格坐标
    slotSize: { w: 100, h: 100 }         // 单格宽高
  })

  const delays = ref({
    mouseMove: 300,        // 鼠标移动延迟（毫秒）
    mouseClick: 80,        // 鼠标点击延迟
    keyPress: 50,          // 按键延迟
    clipboardRead: 50,    // 读取剪切板延迟
    currencyRightClick: 300, // 右键通货延迟
    itemLeftClick: 300     // 左键物品延迟
  })

  const itemPosition = ref({
    x: 636,
    y: 930
  })

  const dpiScale = ref(1.0)

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
    delays.value = { ...delays.value, ...newDelays }
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
        currencyPositions: currencyPositions.value,
        inventory: inventory.value,
        delays: delays.value,
        itemPosition: itemPosition.value,
        dpiScale: dpiScale.value,
        overlaySettings: overlaySettings.value,
        backgroundHistory: backgroundHistory.value
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
          globalShortcuts.value = data.globalShortcuts
        }
        if (data.currencyPositions) {
          currencyPositions.value = { ...currencyPositions.value, ...data.currencyPositions }
        }
        if (data.inventory) {
          inventory.value = { ...inventory.value, ...data.inventory }
        }
        if (data.delays) {
          delays.value = { ...delays.value, ...data.delays }
        }
        if (data.itemPosition) {
          itemPosition.value = { ...data.itemPosition }
        }
        if (data.dpiScale) {
          dpiScale.value = data.dpiScale
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
      }
    } catch (error) {
      // 加载设置失败
    }
  }

  // 默认值（用于重置）
  const defaultGlobalShortcuts = {
    itemStart: 'Alt+1',
    mapStart: 'Alt+2',
    end: 'Alt+3'
  }

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
    chisel: { x: 1158, y: 426 },
    vaal: { x: 1158, y: 1017 },
    wisdom: { x: 210, y: 430 }
  }

  const defaultInventory = {
    startPos: { x: 2658, y: 1199 },
    slotSize: { w: 100, h: 100 }
  }

  const defaultDelays = {
    mouseMove: 300,
    mouseClick: 80,
    keyPress: 50,
    clipboardRead: 50,
    currencyRightClick: 300,
    itemLeftClick: 300
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
    delays.value = { ...defaultDelays }
    itemPosition.value = { ...defaultItemPosition }
    overlaySettings.value = { ...defaultOverlaySettings }
    backgroundHistory.value = []
    saveSettings()
    // 同步重置后的设置
    if (electronApi && electronApi.overlay && electronApi.overlay.updateSettings) {
      // 使用 JSON.parse(JSON.stringify()) 去除 Proxy 包装，确保 IPC 通信正常
      electronApi.overlay.updateSettings(JSON.parse(JSON.stringify(overlaySettings.value)))
    }
  }

  // 初始化时加载
  loadSettings()

  return {
    globalShortcuts,
    currencyPositions,
    inventory,
    delays,
    itemPosition,
    dpiScale,
    overlaySettings,
    backgroundHistory,
    updateGlobalShortcuts,
    updateCurrencyPosition,
    updateInventorySettings,
    updateDelays,
    updateItemPosition,
    updateDpiScale,
    updateOverlaySettings,
    removeHistoryItem,
    saveSettings,
    loadSettings,
    resetSettings
  }
})
