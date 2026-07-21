import { defineStore } from 'pinia'
import { ref } from 'vue'
import { captureKeyForTemplate, createDefaultBagSettings, normalizeBagBlacklist, normalizeBagSettings } from '@/utils/bagConfig'

const emptyStats = () => ({
  scannedSlots: 0,
  stashedSlots: 0,
  blacklistedSlots: 0,
  emptySlots: 0,
  unreadableSlots: 0,
  progress: 0
})

export const useBagStore = defineStore('bag', () => {
  const defaults = createDefaultBagSettings()
  const moduleEnabled = ref(defaults.moduleEnabled)
  const templates = ref(defaults.templates)
  const matchThreshold = ref(defaults.matchThreshold)
  const blacklist = ref(defaults.blacklist)
  const isDetecting = ref(false)
  const isMatched = ref(false)
  const isStashing = ref(false)
  const stashProgress = ref(0)
  const stashStats = ref(emptyStats())
  const lastStopReason = ref('')

  function saveSettings() {
    try {
      localStorage.setItem('bagSettings', JSON.stringify({
        moduleEnabled: moduleEnabled.value,
        templates: templates.value,
        matchThreshold: matchThreshold.value,
        blacklist: blacklist.value
      }))
    } catch (error) {
      console.error('保存背包设置失败:', error)
    }
  }

  function applySettings(raw) {
    const normalized = normalizeBagSettings(raw)
    moduleEnabled.value = normalized.moduleEnabled
    templates.value = normalized.templates
    matchThreshold.value = normalized.matchThreshold
    blacklist.value = normalized.blacklist
  }

  function loadSettings() {
    try {
      applySettings(JSON.parse(localStorage.getItem('bagSettings') || '{}'))
    } catch (error) {
      applySettings({})
      console.error('加载背包设置失败:', error)
    }
  }

  function setModuleEnabled(enabled) { moduleEnabled.value = Boolean(enabled); saveSettings() }
  function clearCaptureMetadata(type) { templates.value[captureKeyForTemplate(type)] = null }
  function setTemplate(type, path) {
    templates.value[type] = String(path || '')
    clearCaptureMetadata(type)
    saveSettings()
  }
  function setTemplateRegion(type, region) {
    templates.value[`${type.replace('Title', '')}Region`] = { ...region }
    clearCaptureMetadata(type)
    saveSettings()
  }
  function applyTemplateCapture(type, result) {
    const regionKey = `${type.replace('Title', '')}Region`
    templates.value = {
      ...templates.value,
      [type]: String(result.path || ''),
      [regionKey]: { ...result.region },
      [captureKeyForTemplate(type)]: result.metadata ? { ...result.metadata } : null
    }
    saveSettings()
  }
  function setMatchThreshold(value) { matchThreshold.value = Number(value); saveSettings() }
  function setBlacklist(rules) { blacklist.value = normalizeBagBlacklist(rules); saveSettings() }
  function setDetectionStatus(status) { isDetecting.value = Boolean(status) }
  function setMatchedStatus(status) { isMatched.value = Boolean(status) }
  function setStashingStatus(status, payload = {}) {
    isStashing.value = Boolean(status)
    if (typeof payload === 'number') stashProgress.value = payload
    else {
      stashStats.value = {
        scannedSlots: Number(payload.scannedSlots ?? stashStats.value.scannedSlots),
        stashedSlots: Number(payload.stashedSlots ?? stashStats.value.stashedSlots),
        blacklistedSlots: Number(payload.blacklistedSlots ?? stashStats.value.blacklistedSlots),
        emptySlots: Number(payload.emptySlots ?? stashStats.value.emptySlots),
        unreadableSlots: Number(payload.unreadableSlots ?? stashStats.value.unreadableSlots),
        progress: Number(payload.progress ?? stashStats.value.progress)
      }
      stashProgress.value = Number(payload.progress ?? stashProgress.value)
    }
  }
  function setStopReason(reason = '') { lastStopReason.value = String(reason) }
  function resetRunStats() { stashProgress.value = 0; stashStats.value = emptyStats(); lastStopReason.value = '' }
  function resetStates() {
    isDetecting.value = false
    isMatched.value = false
    isStashing.value = false
    resetRunStats()
  }
  function resetSettings() { applySettings(defaults); resetStates(); saveSettings() }

  loadSettings()

  return {
    moduleEnabled, templates, matchThreshold, blacklist,
    isDetecting, isMatched, isStashing, stashProgress, stashStats, lastStopReason,
    setModuleEnabled, setTemplate, setTemplateRegion, applyTemplateCapture, clearCaptureMetadata, setMatchThreshold, setBlacklist,
    setDetectionStatus, setMatchedStatus, setStashingStatus, setStopReason,
    resetRunStats, resetStates, saveSettings, loadSettings, resetSettings
  }
})
