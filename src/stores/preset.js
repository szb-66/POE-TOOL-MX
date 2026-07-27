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
import { cleanMigratedMapConfig, createDefaultMapConfig } from '../utils/mapPresetMigration.js'
import { cleanShopPresets, createDefaultShopPreset } from '../domains/shop/vendorConfig.js'
import { createDefaultModuleTwo, normalizeModuleTwo } from '../domains/items/affixConfig.js'

export const usePresetStore = defineStore('preset', () => {
  // 物品预设
  const itemPresets = ref([
    {
      id: 'default',
      name: '默认预设',
      moduleTwo: createDefaultModuleTwo(),
      moduleThree: {
        enabled: false,
        socket: { enabled: false, count: 0 },
        link: { enabled: false, count: 0 },
        color: { enabled: false, red: 0, green: 0, blue: 0 }
      }
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

  const shopPresets = ref([createDefaultShopPreset()])
  
  const currentItemPresetId = ref('default')
  const currentMapPresetId = ref('default')
  const currentShopPresetId = ref('default')

  const currentItemPreset = computed(() => {
    return itemPresets.value.find(p => p.id === currentItemPresetId.value) || itemPresets.value[0]
  })

  const currentMapPreset = computed(() => {
    return mapPresets.value.find(p => p.id === currentMapPresetId.value) || mapPresets.value[0]
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
      moduleTwo: createDefaultModuleTwo(),
      moduleThree: {
        enabled: false,
        socket: { enabled: false, count: 0 },
        link: { enabled: false, count: 0 },
        color: { enabled: false, red: 0, green: 0, blue: 0 }
      }
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
      if (data.moduleTwo) data = { ...data, moduleTwo: normalizeModuleTwo(data.moduleTwo) }
      Object.assign(preset, data)
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
      itemPresets.value = itemPresets.value.map((preset) => ({
        ...preset,
        moduleTwo: normalizeModuleTwo(preset.moduleTwo),
        moduleThree: preset.moduleThree || {
          enabled: false,
          socket: { enabled: false, count: 0 },
          link: { enabled: false, count: 0 },
          color: { enabled: false, red: 0, green: 0, blue: 0 }
        }
      }))

      if (savedCurrentItemId) {
        currentItemPresetId.value = savedCurrentItemId
      } else if (oldCurrentId && itemPresets.value.find(p => p.id === oldCurrentId)) {
        currentItemPresetId.value = oldCurrentId
      }

      if (savedMapPresets) {
        const loaded = JSON.parse(savedMapPresets)
        loaded.forEach(preset => {
          const rawMap = preset.map || {}
          if (rawMap.chisel) delete rawMap.chisel
          preset.map = cleanMigratedMapConfig(rawMap)
        })
        mapPresets.value = loaded
      }
      
      if (savedCurrentMapId) {
        currentMapPresetId.value = savedCurrentMapId
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
    shopPresets,
    currentItemPresetId,
    currentMapPresetId,
    currentShopPresetId,
    currentItemPreset,
    currentMapPreset,
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
    addShopPreset,
    deleteItemPreset,
    deleteMapPreset,
    deleteShopPreset,
    switchItemPreset,
    switchMapPreset,
    switchShopPreset,
    updateCurrentItemPreset,
    updateCurrentMapPreset,
    updateCurrentShopPreset,
    savePresets,
    loadPresets,
    loadShopPresets
  }
})
