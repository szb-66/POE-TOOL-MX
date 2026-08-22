import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  createDefaultBagSettings,
  normalizeBagBlacklist,
  normalizeBagSettings,
  normalizeInventoryLayout
} from '@/utils/bagConfig'
import { useInterfaceDetectionStore } from './interfaceDetection.js'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from '@/utils/diagnostics.js'

const emptyStats = () => ({
  scannedSlots: 0,
  stashedSlots: 0,
  skippedOccupiedSlots: 0,
  blacklistedSlots: 0,
  emptySlots: 0,
  unreadableSlots: 0,
  progress: 0
})

export const useBagStore = defineStore('bag', () => {
  const defaults = createDefaultBagSettings()
  const interfaceDetectionStore = useInterfaceDetectionStore()
  const moduleEnabled = ref(defaults.moduleEnabled)
  const forceUniqueStash = ref(defaults.forceUniqueStash)
  const templates = computed(() => interfaceDetectionStore.templates)
  const matchThreshold = computed(() => interfaceDetectionStore.matchThreshold)
  const blacklist = ref(defaults.blacklist)
  const inventoryLayout = ref(defaults.inventoryLayout)
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
        forceUniqueStash: forceUniqueStash.value,
        blacklist: blacklist.value,
        inventoryLayout: inventoryLayout.value
      }))
    } catch (error) {
      console.error('保存背包设置失败:', error)
    }
  }

  function applySettings(raw) {
    const normalized = normalizeBagSettings(raw)
    moduleEnabled.value = normalized.moduleEnabled
    forceUniqueStash.value = normalized.forceUniqueStash
    blacklist.value = normalized.blacklist
    inventoryLayout.value = normalized.inventoryLayout
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
  function setForceUniqueStash(enabled) { forceUniqueStash.value = Boolean(enabled); saveSettings() }
  function clearCaptureMetadata(type) { interfaceDetectionStore.clearCaptureMetadata(type) }
  function setTemplate(type, path) {
    interfaceDetectionStore.setTemplate(type, path)
  }
  function setTemplateRegion(type, region) {
    interfaceDetectionStore.setTemplateRegion(type, region)
  }
  function applyTemplateCapture(type, result) {
    interfaceDetectionStore.applyTemplateCapture(type, result)
  }
  function setMatchThreshold(value) { interfaceDetectionStore.setMatchThreshold(value) }
  function setBlacklist(rules) { blacklist.value = normalizeBagBlacklist(rules); saveSettings() }
  function setInventoryLayout(layout) {
    inventoryLayout.value = normalizeInventoryLayout({ ...inventoryLayout.value, ...layout })
    saveSettings()
  }
  function setDetectionStatus(status) { isDetecting.value = Boolean(status) }
  function setMatchedStatus(status) { isMatched.value = Boolean(status) }
  function setStashingStatus(status, payload = {}) {
    isStashing.value = Boolean(status)
    if (typeof payload === 'number') stashProgress.value = payload
    else {
      stashStats.value = {
        scannedSlots: Number(payload.scannedSlots ?? stashStats.value.scannedSlots),
        stashedSlots: Number(payload.stashedSlots ?? stashStats.value.stashedSlots),
        skippedOccupiedSlots: Number(payload.skippedOccupiedSlots ?? stashStats.value.skippedOccupiedSlots),
        blacklistedSlots: Number(payload.blacklistedSlots ?? stashStats.value.blacklistedSlots),
        emptySlots: Number(payload.emptySlots ?? stashStats.value.emptySlots),
        unreadableSlots: Number(payload.unreadableSlots ?? stashStats.value.unreadableSlots),
        progress: Number(payload.progress ?? stashStats.value.progress)
      }
      stashProgress.value = Number(payload.progress ?? stashProgress.value)
    }
  }
  function setStopReason(reason = '') {
    lastStopReason.value = String(reason)
    if (['', 'user-stopped', 'process-ended'].includes(lastStopReason.value)) {
      void reportDiagnosticRecovery('bag', 'script_runtime')
    } else {
      void reportDiagnosticFailure('bag', 'script_runtime', {}, 'process_exit')
    }
  }
  function resetRunStats() { stashProgress.value = 0; stashStats.value = emptyStats(); lastStopReason.value = '' }
  function resetStates() {
    isDetecting.value = false
    isMatched.value = false
    isStashing.value = false
    resetRunStats()
  }
  function resetSettings() { applySettings(defaults); resetStates(); saveSettings() }

  loadSettings()
  saveSettings()

  return {
    moduleEnabled, forceUniqueStash, templates, matchThreshold, blacklist, inventoryLayout,
    isDetecting, isMatched, isStashing, stashProgress, stashStats, lastStopReason,
    setModuleEnabled, setForceUniqueStash,
    setTemplate, setTemplateRegion, applyTemplateCapture, clearCaptureMetadata, setMatchThreshold, setBlacklist, setInventoryLayout,
    setDetectionStatus, setMatchedStatus, setStashingStatus, setStopReason,
    resetRunStats, resetStates, saveSettings, loadSettings, resetSettings
  }
})
