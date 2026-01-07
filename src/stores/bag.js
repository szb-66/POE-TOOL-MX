import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBagStore = defineStore('bag', () => {
  // 模块开关
  const moduleEnabled = ref(false)

// 模板配置
const templates = ref({
  stashTitle: '',        // 仓库标题模板路径
  inventoryTitle: '',    // 背包道具标题模板路径
  stashRegion: {         // 仓库标题匹配区域
    left: 0,
    top: 0,
    right: 1920,
    bottom: 1080
  },
  inventoryRegion: {     // 道具标题匹配区域
    left: 0,
    top: 0,
    right: 1920,
    bottom: 1080
  }
})

  // 匹配阈值
  const matchThreshold = ref(0.8)


  // 按钮位置配置
  const buttonPosition = ref({
    x: 3600,
    y: 1000
  })

  // 运行状态
  const isDetecting = ref(false)
  const isStashing = ref(false)
  const stashProgress = ref(0)

  // 操作方法
  function setModuleEnabled(enabled) {
    moduleEnabled.value = enabled
    saveSettings()
  }

  function setTemplate(type, path) {
    templates.value[type] = path
    saveSettings()
  }

  function setTemplates(newTemplates) {
    templates.value = { ...templates.value, ...newTemplates }
    saveSettings()
  }

function setTemplateRegion(type, region) {
  templates.value[`${type}Region`] = { ...region }
  saveSettings()
}

  function setMatchThreshold(threshold) {
    matchThreshold.value = threshold
    saveSettings()
  }


  function setButtonPosition(position) {
    buttonPosition.value = { ...buttonPosition.value, ...position }
    saveSettings()
  }

  function setDetectionStatus(status) {
    isDetecting.value = status
  }

  function setStashingStatus(status, progress = 0) {
    isStashing.value = status
    stashProgress.value = progress
  }

function saveSettings() {
  try {
    const settings = {
      moduleEnabled: moduleEnabled.value,
      templates: templates.value,
      matchThreshold: matchThreshold.value,
      buttonPosition: buttonPosition.value
    }
    localStorage.setItem('bagSettings', JSON.stringify(settings))
  } catch (error) {
    // 保存设置失败
    console.error('保存背包设置失败:', error)
  }
}

  function loadSettings() {
    try {
      const saved = localStorage.getItem('bagSettings')
      if (saved) {
        const data = JSON.parse(saved)
        if (data.moduleEnabled !== undefined) {
          moduleEnabled.value = data.moduleEnabled
        }
        if (data.templates) {
          templates.value = { ...templates.value, ...data.templates }
        }
        if (data.matchThreshold !== undefined) {
          matchThreshold.value = data.matchThreshold
        }
        if (data.buttonPosition) {
          buttonPosition.value = { ...buttonPosition.value, ...data.buttonPosition }
        }
      }
    } catch (error) {
      // 加载设置失败
      console.error('加载背包设置失败:', error)
    }
  }

  // 默认值（用于重置）
const defaultSettings = {
  moduleEnabled: false,
  templates: {
    stashTitle: '',
    inventoryTitle: '',
    stashRegion: {
      left: 0,
      top: 0,
      right: 1920,
      bottom: 1080
    },
    inventoryRegion: {
      left: 0,
      top: 0,
      right: 1920,
      bottom: 1080
    }
  },
  matchThreshold: 0.8,
  buttonPosition: {
    x: 3600,
    y: 1000
  }
}

function resetSettings() {
  moduleEnabled.value = defaultSettings.moduleEnabled
  templates.value = { ...defaultSettings.templates }
  matchThreshold.value = defaultSettings.matchThreshold
  buttonPosition.value = { ...defaultSettings.buttonPosition }
  isDetecting.value = false
  isStashing.value = false
  stashProgress.value = 0
  saveSettings()
}

  // 初始化时加载设置
  loadSettings()

  return {
    // 状态
    moduleEnabled,
    templates,
    matchThreshold,
    buttonPosition,
    isDetecting,
    isStashing,
    stashProgress,

// 方法
setModuleEnabled,
setTemplate,
setTemplates,
setTemplateRegion,
setMatchThreshold,
setButtonPosition,
    setDetectionStatus,
    setStashingStatus,
    saveSettings,
    loadSettings,
    resetSettings
  }
})