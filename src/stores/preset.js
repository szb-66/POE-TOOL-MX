/**
 * Purpose: 预设管理 Store，负责物品和地图预设的存储、加载和保存
 * Inputs: 通过函数调用传入预设数据
 * Outputs: 预设对象、操作结果
 * Preconditions: localStorage 可用
 * Edge cases: localStorage 不可用时静默失败；预设不存在时返回默认预设
 * Errors: 保存失败时静默处理，不抛出异常
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  cleanMigratedChartConfig,
  cleanMigratedMapConfig,
  createDefaultChartConfig,
  createDefaultMapConfig
} from '../utils/mapPresetMigration.js'
import { cleanShopPresets, createDefaultShopPreset } from '../domains/shop/vendorConfig.js'
import { createDefaultModuleTwo, normalizeModuleTwo } from '../domains/items/affixConfig.js'
import { createDefaultEldritchModule, normalizeEldritchModule } from '../domains/items/eldritchConfig.js'

function defaultModuleThree() {
  return {
    enabled: false,
    socket: { enabled: false, count: 0 },
    link: { enabled: false, count: 0 },
    color: { enabled: false, red: 0, green: 0, blue: 0 }
  }
}

function normalizeItemPreset(preset = {}) {
  const checkInitialItem = typeof preset.checkInitialItem === 'boolean'
    ? preset.checkInitialItem
    : preset.moduleTwo?.checkInitialAffixes !== false
  const moduleEldritch = normalizeEldritchModule(preset.moduleEldritch)
  const moduleTwo = normalizeModuleTwo(preset.moduleTwo)
  const defaults = defaultModuleThree()
  const sourceThree = preset.moduleThree || {}
  const moduleThree = {
    ...defaults,
    ...sourceThree,
    socket: { ...defaults.socket, ...(sourceThree.socket || {}) },
    link: { ...defaults.link, ...(sourceThree.link || {}) },
    color: { ...defaults.color, ...(sourceThree.color || {}) }
  }
  if (moduleEldritch.enabled) {
    moduleTwo.enabled = false
    moduleThree.enabled = false
  }
  return { ...preset, checkInitialItem, moduleTwo, moduleThree, moduleEldritch }
}

export const usePresetStore = defineStore('preset', () => {
  // 物品预设
  const itemPresets = ref([
    {
      id: 'default',
      name: '默认预设',
      checkInitialItem: true,
      moduleTwo: createDefaultModuleTwo(),
      moduleThree: defaultModuleThree(),
      moduleEldritch: createDefaultEldritchModule()
    }
  ])

  // 地图预设
  const mapPresets = ref([
    {
      id: 'default',
      name: '默认预设',
      map: createDefaultMapConfig()
    }
  ])

  // 航海海图预设与异界地图预设完全独立
  const chartPresets = ref([
    {
      id: 'default',
      name: '默认预设',
      chart: createDefaultChartConfig()
    }
  ])

  const shopPresets = ref([createDefaultShopPreset()])
  
  const currentItemPresetId = ref('default')
  const currentMapPresetId = ref('default')
  const currentChartPresetId = ref('default')
  const mapRollingKind = ref('atlas')
  const currentShopPresetId = ref('default')

  const currentItemPreset = computed(() => {
    return itemPresets.value.find(p => p.id === currentItemPresetId.value) || itemPresets.value[0]
  })

  const currentMapPreset = computed(() => {
    return mapPresets.value.find(p => p.id === currentMapPresetId.value) || mapPresets.value[0]
  })

  const currentChartPreset = computed(() => {
    return chartPresets.value.find(p => p.id === currentChartPresetId.value) || chartPresets.value[0]
  })

  const currentShopPreset = computed(() => {
    return shopPresets.value.find(p => p.id === currentShopPresetId.value) || shopPresets.value[0]
  })

  // 统一的 currentPreset 访问器 (为了保持部分向后兼容性或根据上下文切换)
  // 但最好在视图层明确使用 currentItemPreset 或 currentMapPreset
  
  function addItemPreset(name) {
    const newPreset = {
      id: `preset_${Date.now()}`,
      name: name || `预设${itemPresets.value.length}`,
      checkInitialItem: true,
      moduleTwo: createDefaultModuleTwo(),
      moduleThree: defaultModuleThree(),
      moduleEldritch: createDefaultEldritchModule()
    }
    itemPresets.value.push(newPreset)
    currentItemPresetId.value = newPreset.id
    savePresets()
    return newPreset
  }

  function addMapPreset(name) {
    const newPreset = {
      id: `map_preset_${Date.now()}`,
      name: name || `预设${mapPresets.value.length}`,
      map: createDefaultMapConfig()
    }
    mapPresets.value.push(newPreset)
    currentMapPresetId.value = newPreset.id
    savePresets()
    return newPreset
  }

  function addChartPreset(name) {
    const newPreset = {
      id: `chart_preset_${Date.now()}`,
      name: name || `预设${chartPresets.value.length}`,
      chart: createDefaultChartConfig()
    }
    chartPresets.value.push(newPreset)
    currentChartPresetId.value = newPreset.id
    savePresets()
    return newPreset
  }

  function addShopPreset(name) {
    const newPreset = createDefaultShopPreset(`shop_preset_${Date.now()}`, name || `预设${shopPresets.value.length}`)
    shopPresets.value.push(newPreset)
    currentShopPresetId.value = newPreset.id
    savePresets()
    return newPreset
  }

  function deleteItemPreset(id) {
    if (id === 'default') return false
    const index = itemPresets.value.findIndex(p => p.id === id)
    if (index > -1) {
      itemPresets.value.splice(index, 1)
      if (currentItemPresetId.value === id) {
        currentItemPresetId.value = 'default'
      }
      savePresets()
      return true
    }
    return false
  }

  function deleteMapPreset(id) {
    if (id === 'default') return false
    const index = mapPresets.value.findIndex(p => p.id === id)
    if (index > -1) {
      mapPresets.value.splice(index, 1)
      if (currentMapPresetId.value === id) {
        currentMapPresetId.value = 'default'
      }
      savePresets()
      return true
    }
    return false
  }

  function deleteChartPreset(id) {
    if (id === 'default') return false
    const index = chartPresets.value.findIndex(p => p.id === id)
    if (index > -1) {
      chartPresets.value.splice(index, 1)
      if (currentChartPresetId.value === id) currentChartPresetId.value = 'default'
      savePresets()
      return true
    }
    return false
  }

  function deleteShopPreset(id) {
    if (id === 'default') return false
    const index = shopPresets.value.findIndex(p => p.id === id)
    if (index > -1) {
      shopPresets.value.splice(index, 1)
      if (currentShopPresetId.value === id) currentShopPresetId.value = 'default'
      savePresets()
      return true
    }
    return false
  }

  function switchItemPreset(id) {
    const preset = itemPresets.value.find(p => p.id === id)
    if (preset) {
      currentItemPresetId.value = id
      savePresets()
      return true
    }
    return false
  }

  function switchMapPreset(id) {
    const preset = mapPresets.value.find(p => p.id === id)
    if (preset) {
      currentMapPresetId.value = id
      savePresets()
      return true
    }
    return false
  }

  function switchChartPreset(id) {
    const preset = chartPresets.value.find(p => p.id === id)
    if (preset) {
      currentChartPresetId.value = id
      savePresets()
      return true
    }
    return false
  }

  function setMapRollingKind(kind) {
    mapRollingKind.value = kind === 'chart' ? 'chart' : 'atlas'
    savePresets()
  }

  function switchShopPreset(id) {
    const preset = shopPresets.value.find(p => p.id === id)
    if (!preset) return false
    currentShopPresetId.value = id
    savePresets()
    return true
  }

  function updateCurrentItemPreset(data) {
    const preset = currentItemPreset.value
    if (preset) {
      const next = { ...preset, ...data }
      if (data.moduleEldritch?.enabled) {
        next.moduleTwo = { ...next.moduleTwo, enabled: false }
        next.moduleThree = { ...next.moduleThree, enabled: false }
      } else if (data.moduleTwo?.enabled || data.moduleThree?.enabled) {
        next.moduleEldritch = { ...next.moduleEldritch, enabled: false }
      }
      Object.assign(preset, normalizeItemPreset(next))
      savePresets()
    }
  }

  function updateCurrentMapPreset(data) {
    const preset = currentMapPreset.value
    if (preset) {
      Object.assign(preset, data)
      savePresets()
    }
  }

  function updateCurrentChartPreset(data) {
    const preset = currentChartPreset.value
    if (preset) {
      Object.assign(preset, data)
      savePresets()
    }
  }

  function updateCurrentShopPreset(data) {
    const preset = currentShopPreset.value
    if (preset) {
      Object.assign(preset, data)
      savePresets()
    }
  }

  function savePresets() {
    try {
      localStorage.setItem('itemPresets', JSON.stringify(itemPresets.value))
      localStorage.setItem('currentItemPresetId', currentItemPresetId.value)
      localStorage.setItem('mapPresets', JSON.stringify(mapPresets.value))
      localStorage.setItem('currentMapPresetId', currentMapPresetId.value)
      localStorage.setItem('chartPresets', JSON.stringify(chartPresets.value))
      localStorage.setItem('currentChartPresetId', currentChartPresetId.value)
      localStorage.setItem('mapRollingKind', mapRollingKind.value)
      localStorage.setItem('shopPresets', JSON.stringify(shopPresets.value))
      localStorage.setItem('currentShopPresetId', currentShopPresetId.value)
    } catch (error) {
      // 保存预设失败
    }
  }

  function loadPresets() {
    try {
      const savedItemPresets = localStorage.getItem('itemPresets')
      const savedCurrentItemId = localStorage.getItem('currentItemPresetId')
      const savedMapPresets = localStorage.getItem('mapPresets')
      const savedCurrentMapId = localStorage.getItem('currentMapPresetId')
      const savedChartPresets = localStorage.getItem('chartPresets')
      const savedCurrentChartId = localStorage.getItem('currentChartPresetId')
      const savedMapRollingKind = localStorage.getItem('mapRollingKind')
      
      // 旧数据迁移
      const oldPresets = localStorage.getItem('presets')
      const oldCurrentId = localStorage.getItem('currentPresetId')

      if (savedItemPresets) {
        itemPresets.value = JSON.parse(savedItemPresets)
      } else if (oldPresets) {
        // 如果没有新格式的预设但有旧的，迁移旧数据到物品预设
        const loaded = JSON.parse(oldPresets)
        // 清理旧数据结构
        loaded.forEach(preset => {
          if (preset.map) delete preset.map
          if (preset.moduleOne) delete preset.moduleOne
          if (preset.shortcuts) delete preset.shortcuts
        })
        itemPresets.value = loaded
      }
      itemPresets.value = itemPresets.value.map(normalizeItemPreset)

      if (savedCurrentItemId) {
        currentItemPresetId.value = savedCurrentItemId
      } else if (oldCurrentId && itemPresets.value.find(p => p.id === oldCurrentId)) {
        currentItemPresetId.value = oldCurrentId
      }

      let loadedMapPresets = null
      if (savedMapPresets) {
        loadedMapPresets = JSON.parse(savedMapPresets)
        const loaded = loadedMapPresets.map(preset => {
          const rawMap = preset.map || {}
          if (rawMap.chisel) delete rawMap.chisel
          return { ...preset, map: cleanMigratedMapConfig(rawMap) }
        })
        mapPresets.value = loaded
      }
      
      if (savedCurrentMapId) {
        currentMapPresetId.value = savedCurrentMapId
      }

      if (savedChartPresets) {
        chartPresets.value = JSON.parse(savedChartPresets).map(preset => ({
          ...preset,
          chart: cleanMigratedChartConfig(preset.chart || {})
        }))
      } else if (loadedMapPresets?.some(preset => preset.map?.chart)) {
        chartPresets.value = loadedMapPresets.map(preset => ({
          id: preset.id,
          name: preset.name,
          chart: cleanMigratedChartConfig(preset.map?.chart || {}, preset.map?.grid || {})
        }))
      }

      if (!chartPresets.value.length) {
        chartPresets.value = [{ id: 'default', name: '默认预设', chart: createDefaultChartConfig() }]
      }
      if (savedCurrentChartId && chartPresets.value.some(preset => preset.id === savedCurrentChartId)) {
        currentChartPresetId.value = savedCurrentChartId
      } else if (!savedChartPresets && chartPresets.value.some(preset => preset.id === currentMapPresetId.value)) {
        currentChartPresetId.value = currentMapPresetId.value
      }
      const legacyActiveKind = loadedMapPresets
        ?.find(preset => preset.id === currentMapPresetId.value)?.map?.activeKind
      mapRollingKind.value = savedMapRollingKind === 'chart' || (!savedMapRollingKind && legacyActiveKind === 'chart')
        ? 'chart'
        : 'atlas'

      if (!mapPresets.value.some(preset => preset.id === currentMapPresetId.value)) currentMapPresetId.value = 'default'
      if (!chartPresets.value.some(preset => preset.id === currentChartPresetId.value)) currentChartPresetId.value = 'default'

      if (!savedChartPresets || loadedMapPresets?.some(preset => preset.map?.chart || preset.map?.activeKind)) {
        savePresets()
      }
    } catch (error) {
      // 加载预设失败
    }
  }

  function loadShopPresets() {
    try {
      const savedPresets = localStorage.getItem('shopPresets')
      const savedCurrentId = localStorage.getItem('currentShopPresetId')
      shopPresets.value = savedPresets ? cleanShopPresets(JSON.parse(savedPresets)) : [createDefaultShopPreset()]
      currentShopPresetId.value = shopPresets.value.some(preset => preset.id === savedCurrentId)
        ? savedCurrentId
        : 'default'
    } catch (error) {
      shopPresets.value = [createDefaultShopPreset()]
      currentShopPresetId.value = 'default'
    }
  }

  // 初始化时加载
  loadPresets()
  loadShopPresets()

  return {
    itemPresets,
    mapPresets,
    chartPresets,
    shopPresets,
    currentItemPresetId,
    currentMapPresetId,
    currentChartPresetId,
    mapRollingKind,
    currentShopPresetId,
    currentItemPreset,
    currentMapPreset,
    currentChartPreset,
    currentShopPreset,
    // 兼容旧代码的别名，逐步替换
    presets: itemPresets,
    currentPresetId: currentItemPresetId,
    currentPreset: currentItemPreset,
    addPreset: addItemPreset,
    deletePreset: deleteItemPreset,
    switchPreset: switchItemPreset,
    updateCurrentPreset: updateCurrentItemPreset,
    
    // 新方法
    addItemPreset,
    addMapPreset,
    addChartPreset,
    addShopPreset,
    deleteItemPreset,
    deleteMapPreset,
    deleteChartPreset,
    deleteShopPreset,
    switchItemPreset,
    switchMapPreset,
    switchChartPreset,
    setMapRollingKind,
    switchShopPreset,
    updateCurrentItemPreset,
    updateCurrentMapPreset,
    updateCurrentChartPreset,
    updateCurrentShopPreset,
    savePresets,
    loadPresets,
    loadShopPresets
  }
})
