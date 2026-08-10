import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '../api/electron.js'
import { normalizeStashPickupSettings } from '../utils/stashPickupConfig.js'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { useInterfaceDetectionStore } from './interfaceDetection.js'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from '../utils/diagnostics.js'

const STORAGE_KEY = 'stashPickupSettings'

function loadSettings() {
  try { return normalizeStashPickupSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')) } catch {
    return normalizeStashPickupSettings()
  }
}

function unwrap(response) {
  if (response?.success) return response.data
  throw new Error(response?.error?.message || '仓库自动取件操作失败')
}

export const useStashPickupStore = defineStore('stashPickup', () => {
  const interfaceStore = useInterfaceDetectionStore()
  const settings = ref(loadSettings())
  const state = ref({
    status: 'idle', layout: 0, method: 'highlight-model', candidateCells: 0,
    remainingCells: 0, pickedItems: 0, currentIndex: 0, uncertainCells: 0,
    modelVersion: '', calibration: '', reason: ''
  })
  const preview = ref(null)
  const previewLabels = ref({})
  const busy = ref(false)
  let settingsRevision = 0
  let settingsCommitQueue = Promise.resolve()
  const running = computed(() => state.value.status === 'running')

  function runtime(overrides = {}) {
    const settingsStore = useSettingsStore()
    return {
      ...JSON.parse(JSON.stringify(settings.value)),
      calibration: JSON.parse(JSON.stringify(interfaceStore.stashGridCalibration)),
      ...interfaceStore.runtime(),
      operationDelayMs: settingsStore.operationDelayMs,
      adaptiveTiming: settingsStore.adaptiveTiming,
      adaptiveTimeoutMs: settingsStore.adaptiveTimeoutMs,
      fixedTiming: settingsStore.fixedTiming,
      ...overrides
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
  }

  async function syncRuntime(overrides = {}) {
    state.value = { ...state.value, ...unwrap(await electronApi.stashPickup.updateRuntime(runtime(overrides))) }
    return state.value
  }

  async function setEnabled(value) {
    const enabled = Boolean(value)
    await syncRuntime({ enabled })
    settings.value.enabled = enabled
    save()
  }

  async function updateProfile(layout, patch) {
    const commit = async () => {
      const candidate = normalizeStashPickupSettings({
        ...settings.value,
        profiles: {
          ...settings.value.profiles,
          [layout]: { ...settings.value.profiles[layout], ...patch }
        }
      })
      if (settings.value.enabled) await syncRuntime(candidate)
      settings.value = candidate
      settingsRevision += 1
      save()
      return { success: true, revision: settingsRevision }
    }
    settingsCommitQueue = settingsCommitQueue.then(commit, commit)
    return settingsCommitQueue
  }

  async function calibrate(type) {
    const result = unwrap(await electronApi.stashPickup.pickGridRegion())
    if (!result?.canceled) {
      interfaceStore.setStashGridCalibration(type, result)
      if (settings.value.enabled) await syncRuntime()
    }
    return result
  }

  async function runPreview() {
    busy.value = true
    try {
      if (settings.value.enabled) await syncRuntime()
      preview.value = unwrap(await electronApi.stashPickup.preview())
      previewLabels.value = {}
      void reportDiagnosticRecovery('stashPickup', 'detection')
      return preview.value
    } catch (error) {
      void reportDiagnosticFailure('stashPickup', 'detection', error, 'automation_failed')
      throw error
    } finally { busy.value = false }
  }

  async function start() {
    try {
      if (settings.value.enabled) await syncRuntime()
      state.value = { ...state.value, ...unwrap(await electronApi.stashPickup.start()) }
      void reportDiagnosticRecovery('stashPickup', 'pickup')
    } catch (error) {
      void reportDiagnosticFailure('stashPickup', 'pickup', error, 'automation_failed')
      throw error
    }
  }

  function setPreviewLabel(cell, label) {
    previewLabels.value = { ...previewLabels.value, [`${cell.column}:${cell.row}`]: label }
  }

  async function savePreviewCorrections() {
    const entries = Object.entries(previewLabels.value)
    if (!entries.length) return 0
    const cells = new Map((preview.value?.cells || []).map(cell => [`${cell.column}:${cell.row}`, cell]))
    const layout = Number(preview.value?.layout || 0)
    const domain = layout === 24 ? 'large-stash' : 'small-stash'
    await Promise.all(entries.map(([key, label]) => {
      const cell = cells.get(key)
      if (!cell?.tileDataUrl) throw new Error('校准图块缺失，请重新运行检测预览')
      return electronApi.highlightCalibration.save({ ...cell, label, domain, columns: layout, rows: layout }).then(unwrap)
    }))
    await runPreview()
    return entries.length
  }

  async function stop() {
    state.value = { ...state.value, ...unwrap(await electronApi.stashPickup.stop()) }
  }

  function listen() {
    return electronApi.stashPickup.onEvent(event => {
      state.value = { ...state.value, ...event }
      if (event?.event === 'error' || event?.status === 'error') {
        void reportDiagnosticFailure('stashPickup', 'pickup', event, 'automation_failed')
      }
      if (event?.event === 'completed' || event?.status === 'completed') {
        void reportDiagnosticRecovery('stashPickup', 'pickup')
      }
    })
  }

  async function initializeRuntime() {
    try { await syncRuntime() } catch {
      settings.value.enabled = false
      save()
    }
  }

  return {
    settings, state, preview, previewLabels, busy, running,
    setEnabled, updateProfile, calibrate, runPreview, setPreviewLabel, savePreviewCorrections,
    start, stop, listen, initializeRuntime, syncRuntime
  }
})
