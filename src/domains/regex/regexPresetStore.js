import { cleanBeastRegexPresets, createDefaultBeastRegexPreset } from './beastRegex.js'
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
  beastPresets: 'beastRegexPresets',
  beastCurrent: 'currentBeastRegexPresetId',
  mapPresets: 'mapRegexPresets',
  mapCurrent: 'currentMapRegexPresetId'
})

const currentFrom = (presets, requested) => presets.some(preset => preset.id === requested) ? requested : 'default'

export const useRegexPresetStore = defineStore('regexPresets', () => {
  const vendorPresets = ref([createDefaultVendorPreset()])
  const mapRegexPresets = ref([createDefaultMapRegexPreset()])
  const beastRegexPresets = ref([createDefaultBeastRegexPreset()])
  const currentBeastRegexPresetId = ref('default')
  const currentBeastRegexPreset = computed(() => beastRegexPresets.value.find(item => item.id === currentBeastRegexPresetId.value) || beastRegexPresets.value[0])
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
    try {
      localStorage.setItem(REGEX_STORAGE_KEYS.beastPresets, JSON.stringify(beastRegexPresets.value))
      localStorage.setItem(REGEX_STORAGE_KEYS.beastCurrent, currentBeastRegexPresetId.value)
    } catch {}
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

  function stateFor(kind) {
    if (kind === 'beast') return { presets: beastRegexPresets, currentId: currentBeastRegexPresetId, create: createDefaultBeastRegexPreset }
    if (kind === 'map') return { presets: mapRegexPresets, currentId: currentMapRegexPresetId, create: createDefaultMapRegexPreset }
    if (kind === 'vendor') return { presets: vendorPresets, currentId: currentVendorPresetId, create: createDefaultVendorPreset }
    throw new Error(`未知正则预设类型：${kind}`)
  }

  function add(kind, name) {
    const state = stateFor(kind)
    const created = state.create(`${kind}_regex_${crypto.randomUUID()}`, name || `预设${state.presets.value.length}`)
    state.presets.value.push(created)
    state.currentId.value = created.id
    save()
    return created
  }

  function remove(kind, id) {
    if (id === 'default') return false
    const state = stateFor(kind)
    const index = state.presets.value.findIndex(item => item.id === id)
    if (index < 0) return false
    state.presets.value.splice(index, 1)
    if (state.currentId.value === id) state.currentId.value = 'default'
    save()
    return true
  }

  function switchTo(kind, id) {
    const state = stateFor(kind)
    if (!state.presets.value.some(item => item.id === id)) return false
    state.currentId.value = id
    save()
    return true
  }

  function update(kind, data) {
    const state = stateFor(kind)
    const current = state.presets.value.find(item => item.id === state.currentId.value)
    if (!current) return
    Object.assign(current, data)
    save()
  }

  try {
    const saved = localStorage.getItem(REGEX_STORAGE_KEYS.beastPresets)
    beastRegexPresets.value = cleanBeastRegexPresets(saved ? JSON.parse(saved) : null)
    currentBeastRegexPresetId.value = currentFrom(beastRegexPresets.value, localStorage.getItem(REGEX_STORAGE_KEYS.beastCurrent))
  } catch {
    beastRegexPresets.value = [createDefaultBeastRegexPreset()]
  }

  loadVendor()
  loadMap()

  return {
    beastRegexPresets,
    currentBeastRegexPresetId,
    currentBeastRegexPreset,
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
