import { defineStore } from 'pinia'
import { ref } from 'vue'
import { electronApi } from '../api/electron.js'
import { createDefaultBagSettings, normalizeBagSettings } from '../utils/bagConfig.js'

const STORAGE_KEY = 'interfaceDetectionSettings'

function loadInitial() {
  const defaults = createDefaultBagSettings()
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const source = saved ? JSON.parse(saved) : JSON.parse(localStorage.getItem('bagSettings') || '{}')
    const normalized = normalizeBagSettings(source)
    return { templates: normalized.templates, matchThreshold: normalized.matchThreshold }
  } catch {
    return { templates: defaults.templates, matchThreshold: defaults.matchThreshold }
  }
}

export const useInterfaceDetectionStore = defineStore('interfaceDetection', () => {
  const initial = loadInitial()
  const templates = ref(initial.templates)
  const matchThreshold = ref(initial.matchThreshold)

  function runtime() {
    return {
      templates: JSON.parse(JSON.stringify(templates.value)),
      matchThreshold: matchThreshold.value
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runtime()))
    electronApi.bag.updateInterfaceConfig(runtime())?.catch(() => {})
    electronApi.chaosRecipe.updateDetectionConfig(runtime())?.catch(() => {})
  }

  function setTemplate(type, value) {
    templates.value[type] = String(value || '')
    templates.value[type === 'stashTitle' ? 'stashCapture' : 'inventoryCapture'] = null
    save()
  }

  function setTemplateRegion(type, region) {
    templates.value[type === 'stashTitle' ? 'stashRegion' : 'inventoryRegion'] = { ...region }
    templates.value[type === 'stashTitle' ? 'stashCapture' : 'inventoryCapture'] = null
    save()
  }

  function applyTemplateCapture(type, result) {
    const regionKey = type === 'stashTitle' ? 'stashRegion' : 'inventoryRegion'
    const captureKey = type === 'stashTitle' ? 'stashCapture' : 'inventoryCapture'
    templates.value = {
      ...templates.value,
      [type]: String(result.path || ''),
      [regionKey]: { ...result.region },
      [captureKey]: result.metadata ? { ...result.metadata } : null
    }
    save()
  }

  function clearCaptureMetadata(type) {
    templates.value[type === 'stashTitle' ? 'stashCapture' : 'inventoryCapture'] = null
  }

  function setMatchThreshold(value) {
    const number = Number(value)
    matchThreshold.value = Number.isFinite(number) ? Math.min(1, Math.max(0.1, number)) : 0.8
    save()
  }

  function reset() {
    const defaults = createDefaultBagSettings()
    templates.value = defaults.templates
    matchThreshold.value = defaults.matchThreshold
    save()
  }

  save()

  return {
    templates,
    matchThreshold,
    runtime,
    save,
    setTemplate,
    setTemplateRegion,
    applyTemplateCapture,
    clearCaptureMetadata,
    setMatchThreshold,
    reset
  }
})
