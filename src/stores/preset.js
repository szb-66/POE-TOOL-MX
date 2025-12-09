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

export const usePresetStore = defineStore('preset', () => {
  // 物品预设
  const itemPresets = ref([
    {
      id: 'default',
      name: '默认预设',
      moduleTwo: {
        enabled: true,
        mode: 'alteration', // alteration, chaos, alchemy
        requiredAffixes: [],
        selectedAffixes: [],
        selectedCount: 1,
        enableAugmentation: false,
        enableRegal: false,
        enableExalted: false
      },
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
      map: {
        method: 'alchemy',
        strategy: 'normal',
        chisel: { enabled: true },
        vaal: { enabled: true, checkAfter: false },
        autoStash: true,
        match: {
          blacklist: [],
          whitelist: [],
          mandatoryStats: {},
          optionalStats: {}
        },
        tiers: { t16_5: false, t17: false }
      }
    }
  ])
  
  const currentItemPresetId = ref('default')
  const currentMapPresetId = ref('default')

  const currentItemPreset = computed(() => {
    return itemPresets.value.find(p => p.id === currentItemPresetId.value) || itemPresets.value[0]
  })

  const currentMapPreset = computed(() => {
    return mapPresets.value.find(p => p.id === currentMapPresetId.value) || mapPresets.value[0]
  })

  // 统一的 currentPreset 访问器 (为了保持部分向后兼容性或根据上下文切换)
  // 但最好在视图层明确使用 currentItemPreset 或 currentMapPreset
  
  function addItemPreset(name) {
    const newPreset = {
      id: `preset_${Date.now()}`,
      name: name || `预设${itemPresets.value.length}`,
      moduleTwo: {
        enabled: true,
        mode: 'alteration',
        requiredAffixes: [],
        selectedAffixes: [],
        selectedCount: 1,
        enableAugmentation: false,
        enableRegal: false,
        enableExalted: false
      },
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
      map: {
        method: 'alchemy',
        strategy: 'normal',
        chisel: { enabled: true },
        vaal: { enabled: true, checkAfter: false },
        autoStash: true,
        match: {
          blacklist: [],
          whitelist: [],
          mandatoryStats: {},
          optionalStats: {}
        },
        tiers: { t16_5: false, t17: false }
      }
    }
    mapPresets.value.push(newPreset)
    currentMapPresetId.value = newPreset.id
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

  function updateCurrentItemPreset(data) {
    const preset = currentItemPreset.value
    if (preset) {
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

  function savePresets() {
    try {
      localStorage.setItem('itemPresets', JSON.stringify(itemPresets.value))
      localStorage.setItem('currentItemPresetId', currentItemPresetId.value)
      localStorage.setItem('mapPresets', JSON.stringify(mapPresets.value))
      localStorage.setItem('currentMapPresetId', currentMapPresetId.value)
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

      if (savedCurrentItemId) {
        currentItemPresetId.value = savedCurrentItemId
      } else if (oldCurrentId && itemPresets.value.find(p => p.id === oldCurrentId)) {
        currentItemPresetId.value = oldCurrentId
      }

      if (savedMapPresets) {
        const loaded = JSON.parse(savedMapPresets)
        // 确保结构完整
        loaded.forEach(preset => {
          if (!preset.map) preset.map = {}
          const map = preset.map
          if (!map.method) map.method = 'alchemy'
          if (!map.strategy) map.strategy = 'normal'
          if (!map.chisel) map.chisel = { enabled: true }
          if (!map.vaal) map.vaal = { enabled: true, checkAfter: false }
          if (map.autoStash === undefined) map.autoStash = true
          if (!map.grid) map.grid = { startX: 0, startY: 0, offsetX: 0, offsetY: 0, rows: 5, cols: 12 }
          if (!map.match) map.match = { blacklist: [], whitelist: [], mandatoryStats: {}, optionalStats: {} }
          if (!map.tiers) map.tiers = { t16_5: false, t17: false }
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

  // 初始化时加载
  loadPresets()

  return {
    itemPresets,
    mapPresets,
    currentItemPresetId,
    currentMapPresetId,
    currentItemPreset,
    currentMapPreset,
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
    deleteItemPreset,
    deleteMapPreset,
    switchItemPreset,
    switchMapPreset,
    updateCurrentItemPreset,
    updateCurrentMapPreset,
    savePresets,
    loadPresets
  }
})

