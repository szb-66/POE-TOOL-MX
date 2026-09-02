import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  cleanVendorPresets,
  createDefaultVendorPreset,
  migrateLegacyVendorPresets
} from './vendorConfig.js'
import { cleanMapRegexPresets, createDefaultMapRegexPreset } from './mapRegex.js'

export const REGEX_STORAGE_KEYS = Object.freeze({
  vendorPresets: 'vendorRegexPresets',
  vendorCurrent: 'currentVendorRegexPresetId',
  mapPresets: 'mapRegexPresets',
  mapCurrent: 'currentMapRegexPresetId'
})

const currentFrom = (presets, requested) => presets.some(preset => preset.id === requested) ? requested : 'default'

export const useRegexPresetStore = defineStore('regexPresets', () => {
  const vendorPresets = ref([createDefaultVendorPreset()])
  const mapRegexPresets = ref([createDefaultMapRegexPreset()])
  const currentVendorPresetId = ref('default')
  const currentMapRegexPresetId = ref('default')

  const currentVendorPreset = computed(() => vendorPresets.value.find(item => item.id === currentVendorPresetId.value) || vendorPresets.value[0])
  const currentMapRegexPreset = computed(() => mapRegexPresets.value.find(item => item.id === currentMapRegexPresetId.value) || mapRegexPresets.value[0])

  function saveVendor() {
    try {
      localStorage.setItem(REGEX_STORAGE_KEYS.vendorPresets, JSON.stringify(vendorPresets.value))
      localStorage.setItem(REGEX_STORAGE_KEYS.vendorCurrent, currentVendorPresetId.value)
    } catch {}
  }

  function saveMap() {
    try {
      localStorage.setItem(REGEX_STORAGE_KEYS.mapPresets, JSON.stringify(mapRegexPresets.value))
      localStorage.setItem(REGEX_STORAGE_KEYS.mapCurrent, currentMapRegexPresetId.value)
    } catch {}
  }

  function save() {
    saveVendor()
    saveMap()
  }

  function loadVendor() {
    try {
      const saved = localStorage.getItem(REGEX_STORAGE_KEYS.vendorPresets)
      if (saved) {
        vendorPresets.value = cleanVendorPresets(JSON.parse(saved))
        currentVendorPresetId.value = currentFrom(vendorPresets.value, localStorage.getItem(REGEX_STORAGE_KEYS.vendorCurrent))
        return
      }
      const legacy = localStorage.getItem('shopPresets')
      vendorPresets.value = legacy ? migrateLegacyVendorPresets(JSON.parse(legacy)) : [createDefaultVendorPreset()]
      currentVendorPresetId.value = currentFrom(vendorPresets.value, localStorage.getItem('currentShopPresetId'))
      saveVendor()
    } catch {
      vendorPresets.value = [createDefaultVendorPreset()]
      currentVendorPresetId.value = 'default'
    }
  }

  function loadMap() {
    try {
      const saved = localStorage.getItem(REGEX_STORAGE_KEYS.mapPresets)
      mapRegexPresets.value = saved ? cleanMapRegexPresets(JSON.parse(saved)) : [createDefaultMapRegexPreset()]
      currentMapRegexPresetId.value = currentFrom(mapRegexPresets.value, localStorage.getItem(REGEX_STORAGE_KEYS.mapCurrent))
    } catch {
      mapRegexPresets.value = [createDefaultMapRegexPreset()]
      currentMapRegexPresetId.value = 'default'
    }
  }

  function add(kind, name) {
    const isMap = kind === 'map'
    const presets = isMap ? mapRegexPresets : vendorPresets
    const created = isMap
      ? createDefaultMapRegexPreset(`map_regex_${Date.now()}`, name || `预设${presets.value.length}`)
      : createDefaultVendorPreset(`vendor_regex_${Date.now()}`, name || `预设${presets.value.length}`)
    presets.value.push(created)
    if (isMap) currentMapRegexPresetId.value = created.id
    else currentVendorPresetId.value = created.id
    save()
    return created
  }

  function remove(kind, id) {
    if (id === 'default') return false
    const isMap = kind === 'map'
    const presets = isMap ? mapRegexPresets : vendorPresets
    const index = presets.value.findIndex(item => item.id === id)
    if (index < 0) return false
    presets.value.splice(index, 1)
    if (isMap && currentMapRegexPresetId.value === id) currentMapRegexPresetId.value = 'default'
    if (!isMap && currentVendorPresetId.value === id) currentVendorPresetId.value = 'default'
    save()
    return true
  }

  function switchTo(kind, id) {
    const isMap = kind === 'map'
    const presets = isMap ? mapRegexPresets.value : vendorPresets.value
    if (!presets.some(item => item.id === id)) return false
    if (isMap) currentMapRegexPresetId.value = id
    else currentVendorPresetId.value = id
    save()
    return true
  }

  function update(kind, data) {
    const current = kind === 'map' ? currentMapRegexPreset.value : currentVendorPreset.value
    if (!current) return
    Object.assign(current, data)
    save()
  }

  loadVendor()
  loadMap()

  return {
    vendorPresets,
    mapRegexPresets,
    currentVendorPresetId,
    currentMapRegexPresetId,
    currentVendorPreset,
    currentMapRegexPreset,
    add,
    remove,
    switchTo,
    update,
    save
  }
})
