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
import {
  createDefaultItemPreset,
  normalizeItemPreset
} from '../utils/itemPreset.js'
import {
  createDefaultSpecializedPreset,
  normalizeCraftingInitialChecks,
  normalizeItemCraftingKind,
  normalizeSpecializedPreset
} from '../utils/specializedCraftingPreset.js'

let specializedPresetIdSequence = 0

export const usePresetStore = defineStore('preset', () => {
  // 物品预设
  const itemPresets = ref([createDefaultItemPreset()])
  const essencePresets = ref([createDefaultSpecializedPreset('essence')])
  const harvestPresets = ref([createDefaultSpecializedPreset('harvest')])

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

  const currentItemPresetId = ref('default')
  const currentEssencePresetId = ref('default')
  const currentHarvestPresetId = ref('default')
  const itemCraftingKind = ref('general')
  const craftingInitialChecks = ref(normalizeCraftingInitialChecks())
  const currentMapPresetId = ref('default')
  const currentChartPresetId = ref('default')
  const mapRollingKind = ref('atlas')

  const currentItemPreset = computed(() => {
    return itemPresets.value.find(p => p.id === currentItemPresetId.value) || itemPresets.value[0]
  })
  const currentEssencePreset = computed(() => essencePresets.value.find(p => p.id === currentEssencePresetId.value) || essencePresets.value[0])
  const currentHarvestPreset = computed(() => harvestPresets.value.find(p => p.id === currentHarvestPresetId.value) || harvestPresets.value[0])

  const currentMapPreset = computed(() => {
    return mapPresets.value.find(p => p.id === currentMapPresetId.value) || mapPresets.value[0]
  })

  const currentChartPreset = computed(() => {
    return chartPresets.value.find(p => p.id === currentChartPresetId.value) || chartPresets.value[0]
  })

  // 统一的 currentPreset 访问器 (为了保持部分向后兼容性或根据上下文切换)
  // 但最好在视图层明确使用 currentItemPreset 或 currentMapPreset
  
  function addItemPreset(name) {
    const newPreset = {
      ...createDefaultItemPreset('', ''),
      id: `preset_${Date.now()}`,
      name: name || `预设${itemPresets.value.length}`
    }
    itemPresets.value.push(newPreset)
    currentItemPresetId.value = newPreset.id
    savePresets()
    return newPreset
  }

  function addSpecializedPreset(kind, name) {
    const collection = kind === 'essence' ? essencePresets : harvestPresets
    const currentId = kind === 'essence' ? currentEssencePresetId : currentHarvestPresetId
    const newPreset = createDefaultSpecializedPreset(
      kind,
      `${kind}_preset_${Date.now()}_${++specializedPresetIdSequence}`,
      name || `预设${collection.value.length}`
    )
    collection.value.push(newPreset)
    currentId.value = newPreset.id
    savePresets()
    return newPreset
  }

  const addEssencePreset = name => addSpecializedPreset('essence', name)
  const addHarvestPreset = name => addSpecializedPreset('harvest', name)

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

  function deleteSpecializedPreset(kind, id) {
    if (id === 'default') return false
    const collection = kind === 'essence' ? essencePresets : harvestPresets
    const currentId = kind === 'essence' ? currentEssencePresetId : currentHarvestPresetId
    const index = collection.value.findIndex(preset => preset.id === id)
    if (index < 0) return false
    collection.value.splice(index, 1)
    if (currentId.value === id) currentId.value = 'default'
    savePresets()
    return true
  }

  const deleteEssencePreset = id => deleteSpecializedPreset('essence', id)
  const deleteHarvestPreset = id => deleteSpecializedPreset('harvest', id)

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

  function switchItemPreset(id) {
    const preset = itemPresets.value.find(p => p.id === id)
    if (preset) {
      currentItemPresetId.value = id
      savePresets()
      return true
    }
    return false
  }

  function switchSpecializedPreset(kind, id) {
    const collection = kind === 'essence' ? essencePresets : harvestPresets
    const currentId = kind === 'essence' ? currentEssencePresetId : currentHarvestPresetId
    if (!collection.value.some(preset => preset.id === id)) return false
    currentId.value = id
    savePresets()
    return true
  }

  const switchEssencePreset = id => switchSpecializedPreset('essence', id)
  const switchHarvestPreset = id => switchSpecializedPreset('harvest', id)

  function setItemCraftingKind(kind) {
    itemCraftingKind.value = normalizeItemCraftingKind(kind)
    savePresets()
  }

  function updateCraftingInitialCheck(kind, value) {
    const normalizedKind = normalizeItemCraftingKind(kind)
    craftingInitialChecks.value = { ...craftingInitialChecks.value, [normalizedKind]: Boolean(value) }
    savePresets()
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

  function updateCurrentSpecializedPreset(kind, data) {
    const preset = kind === 'essence' ? currentEssencePreset.value : currentHarvestPreset.value
    if (!preset) return
    Object.assign(preset, normalizeSpecializedPreset(kind, { ...preset, ...data }))
    savePresets()
  }

  const updateCurrentEssencePreset = data => updateCurrentSpecializedPreset('essence', data)
  const updateCurrentHarvestPreset = data => updateCurrentSpecializedPreset('harvest', data)

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

  function savePresets() {
    try {
      localStorage.setItem('itemPresets', JSON.stringify(itemPresets.value))
      localStorage.setItem('currentItemPresetId', currentItemPresetId.value)
      localStorage.setItem('essencePresets', JSON.stringify(essencePresets.value))
      localStorage.setItem('currentEssencePresetId', currentEssencePresetId.value)
      localStorage.setItem('harvestPresets', JSON.stringify(harvestPresets.value))
      localStorage.setItem('currentHarvestPresetId', currentHarvestPresetId.value)
      localStorage.setItem('itemCraftingKind', itemCraftingKind.value)
      localStorage.setItem('craftingInitialChecks', JSON.stringify(craftingInitialChecks.value))
      localStorage.setItem('mapPresets', JSON.stringify(mapPresets.value))
      localStorage.setItem('currentMapPresetId', currentMapPresetId.value)
      localStorage.setItem('chartPresets', JSON.stringify(chartPresets.value))
      localStorage.setItem('currentChartPresetId', currentChartPresetId.value)
      localStorage.setItem('mapRollingKind', mapRollingKind.value)
    } catch (error) {
      // 保存预设失败
    }
  }

  function loadPresets() {
    try {
      const savedItemPresets = localStorage.getItem('itemPresets')
      const savedCurrentItemId = localStorage.getItem('currentItemPresetId')
      const savedEssencePresets = localStorage.getItem('essencePresets')
      const savedCurrentEssenceId = localStorage.getItem('currentEssencePresetId')
      const savedHarvestPresets = localStorage.getItem('harvestPresets')
      const savedCurrentHarvestId = localStorage.getItem('currentHarvestPresetId')
      const savedItemCraftingKind = localStorage.getItem('itemCraftingKind')
      const savedInitialChecks = localStorage.getItem('craftingInitialChecks')
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
      if (savedCurrentItemId) {
        currentItemPresetId.value = savedCurrentItemId
      } else if (oldCurrentId && itemPresets.value.find(p => p.id === oldCurrentId)) {
        currentItemPresetId.value = oldCurrentId
      }
      const legacyCurrentPreset = itemPresets.value.find(preset => preset.id === currentItemPresetId.value) || itemPresets.value[0]
      const legacyInitialCheck = typeof legacyCurrentPreset?.checkInitialItem === 'boolean'
        ? legacyCurrentPreset.checkInitialItem
        : legacyCurrentPreset?.moduleTwo?.checkInitialAffixes !== false
      craftingInitialChecks.value = normalizeCraftingInitialChecks(
        savedInitialChecks ? JSON.parse(savedInitialChecks) : {},
        legacyInitialCheck
      )
      itemPresets.value = itemPresets.value.map(normalizeItemPreset)
      if (!itemPresets.value.some(preset => preset.id === currentItemPresetId.value)) currentItemPresetId.value = 'default'

      essencePresets.value = savedEssencePresets
        ? JSON.parse(savedEssencePresets).map(preset => normalizeSpecializedPreset('essence', preset))
        : [createDefaultSpecializedPreset('essence')]
      harvestPresets.value = savedHarvestPresets
        ? JSON.parse(savedHarvestPresets).map(preset => normalizeSpecializedPreset('harvest', preset))
        : [createDefaultSpecializedPreset('harvest')]
      if (!essencePresets.value.length) essencePresets.value = [createDefaultSpecializedPreset('essence')]
      if (!harvestPresets.value.length) harvestPresets.value = [createDefaultSpecializedPreset('harvest')]
      currentEssencePresetId.value = essencePresets.value.some(preset => preset.id === savedCurrentEssenceId)
        ? savedCurrentEssenceId
        : essencePresets.value[0].id
      currentHarvestPresetId.value = harvestPresets.value.some(preset => preset.id === savedCurrentHarvestId)
        ? savedCurrentHarvestId
        : harvestPresets.value[0].id
      itemCraftingKind.value = normalizeItemCraftingKind(savedItemCraftingKind)

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

      if (!savedChartPresets || !savedEssencePresets || !savedHarvestPresets || !savedInitialChecks || loadedMapPresets?.some(preset => preset.map?.chart || preset.map?.activeKind)) {
        savePresets()
      }
    } catch (error) {
      // 加载预设失败
    }
  }

  // 初始化时加载
  loadPresets()

  return {
    itemPresets,
    essencePresets,
    harvestPresets,
    mapPresets,
    chartPresets,
    currentItemPresetId,
    currentEssencePresetId,
    currentHarvestPresetId,
    itemCraftingKind,
    craftingInitialChecks,
    currentMapPresetId,
    currentChartPresetId,
    mapRollingKind,
    currentItemPreset,
    currentEssencePreset,
    currentHarvestPreset,
    currentMapPreset,
    currentChartPreset,
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
    addEssencePreset,
    addHarvestPreset,
    addMapPreset,
    addChartPreset,
    deleteItemPreset,
    deleteEssencePreset,
    deleteHarvestPreset,
    deleteMapPreset,
    deleteChartPreset,
    switchItemPreset,
    switchEssencePreset,
    switchHarvestPreset,
    setItemCraftingKind,
    updateCraftingInitialCheck,
    switchMapPreset,
    switchChartPreset,
    setMapRollingKind,
    updateCurrentItemPreset,
    updateCurrentEssencePreset,
    updateCurrentHarvestPreset,
    updateCurrentMapPreset,
    updateCurrentChartPreset,
    savePresets,
    loadPresets
  }
})
