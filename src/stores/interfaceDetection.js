import { defineStore } from 'pinia'
import { ref } from 'vue'
import { electronApi } from '../api/electron.js'
import { createDefaultBagSettings, normalizeBagSettings } from '../utils/bagConfig.js'
import {
  migrateStashGridCalibration,
  normalizeStashGridCalibration,
  normalizeStashGridRegion
} from '../utils/stashGridCalibration.js'

const STORAGE_KEY = 'interfaceDetectionSettings'

function loadInitial() {
  const defaults = createDefaultBagSettings()
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const source = saved ? JSON.parse(saved) : JSON.parse(localStorage.getItem('bagSettings') || '{}')
    const normalized = normalizeBagSettings(source)
    let legacyCalibration = {}
    try { legacyCalibration = JSON.parse(localStorage.getItem('chaosRecipeSettings') || '{}').calibration || {} } catch {}
    return {
      templates: normalized.templates,
      matchThreshold: normalized.matchThreshold,
      stashGridCalibration: migrateStashGridCalibration(source.stashGridCalibration, legacyCalibration)
    }
  } catch {
    return { templates: defaults.templates, matchThreshold: defaults.matchThreshold, stashGridCalibration: normalizeStashGridCalibration() }
  }
}

export const useInterfaceDetectionStore = defineStore('interfaceDetection', () => {
  const initial = loadInitial()
  const templates = ref(initial.templates)
  const matchThreshold = ref(initial.matchThreshold)
  const stashGridCalibration = ref(initial.stashGridCalibration)

  function runtime() {
    return {
      templates: JSON.parse(JSON.stringify(templates.value)),
      matchThreshold: matchThreshold.value,
      stashGridCalibration: JSON.parse(JSON.stringify(stashGridCalibration.value))
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runtime()))
    electronApi.bag.updateInterfaceConfig(runtime())?.catch(() => {})
    electronApi.chaosRecipe.updateDetectionConfig(runtime())?.catch(() => {})
    electronApi.stashPickup.updateRuntime({
      ...runtime(),
      calibration: JSON.parse(JSON.stringify(stashGridCalibration.value))
    })?.catch(() => {})
    electronApi.junfeng.updateRuntime(runtime())?.catch(() => {})
  }

  function setTemplate(type, value) {
    templates.value[type] = String(value || '')
    templates.value[templateKeys(type).capture] = null
    save()
  }

  function setTemplateRegion(type, region) {
    const keys = templateKeys(type)
    templates.value[keys.region] = { ...region }
    templates.value[keys.capture] = null
    save()
  }

  function templateKeys(type) {
    if (type === 'stashTitle') return { region: 'stashRegion', capture: 'stashCapture' }
    if (type === 'junfengRewardTitle') return { region: 'junfengRewardRegion', capture: 'junfengRewardCapture' }
    return { region: 'inventoryRegion', capture: 'inventoryCapture' }
  }

  function applyTemplateCapture(type, result) {
    const { region: regionKey, capture: captureKey } = templateKeys(type)
    templates.value = {
      ...templates.value,
      [type]: String(result.path || ''),
      [regionKey]: { ...result.region },
      [captureKey]: result.metadata ? { ...result.metadata } : null
    }
    save()
  }

  function clearCaptureMetadata(type) {
    templates.value[templateKeys(type).capture] = null
  }

  function setMatchThreshold(value) {
    const number = Number(value)
    matchThreshold.value = Number.isFinite(number) ? Math.min(1, Math.max(0.1, number)) : 0.8
    save()
  }

  function setStashGridCalibration(type, value) {
    if (!['root', 'folder'].includes(type)) return
    stashGridCalibration.value = { ...stashGridCalibration.value, [type]: normalizeStashGridRegion(value) }
    save()
  }

  function reset() {
    const defaults = createDefaultBagSettings()
    templates.value = defaults.templates
    matchThreshold.value = defaults.matchThreshold
    stashGridCalibration.value = normalizeStashGridCalibration()
    save()
  }

  save()

  return {
    templates,
    matchThreshold,
    stashGridCalibration,
    runtime,
    save,
    setTemplate,
    setTemplateRegion,
    applyTemplateCapture,
    clearCaptureMetadata,
    setMatchThreshold,
    setStashGridCalibration,
    reset
  }
})
