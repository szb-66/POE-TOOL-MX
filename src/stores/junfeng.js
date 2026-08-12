import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '@/api/electron'
import { useInterfaceDetectionStore } from './interfaceDetection'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { normalizeJunfengSettings } from '@/utils/junfengConfig'

const STORAGE_KEY = 'junfengHighlightSettings'
const TRAINING_STORAGE_KEY = 'highlightTrainingRegions'

function load() {
  try { return normalizeJunfengSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')) } catch { return normalizeJunfengSettings() }
}

function unwrap(response) {
  if (response?.success) return response.data
  throw new Error(response?.error?.message || '君锋镇操作失败')
}

export const useJunfengStore = defineStore('junfeng', () => {
  const interfaceStore = useInterfaceDetectionStore()
  const settings = ref(load())
  const state = ref({ status: 'idle', candidateItems: 0, remainingItems: 0, pickedItems: 0, uncertainCells: 0, reason: '', modelVersion: '' })
  const preview = ref(null)
  const previewLabels = ref({})
  const corrections = ref([])
  const busy = ref(false)
  const trainingBusy = ref(false)
  const trainingPreview = ref(null)
  const trainingLabels = ref({})
  const trainingSessions = ref([])
  const reviewingSessionId = ref('')
  const trainingStatus = ref({ status: 'idle', stage: '', reason: '', report: null,
    summary: { samples: 0, sessions: 0, domains: {}, labels: {} }, available: false })
  const trainingRegions = ref((() => {
    try { return JSON.parse(localStorage.getItem(TRAINING_STORAGE_KEY) || '{}') } catch { return {} }
  })())
  const running = computed(() => state.value.status === 'running')

  function runtime(overrides = {}) {
    const general = useSettingsStore()
    return {
      ...JSON.parse(JSON.stringify(settings.value)),
      templates: JSON.parse(JSON.stringify(interfaceStore.templates)),
      matchThreshold: interfaceStore.matchThreshold,
      operationDelayMs: general.operationDelayMs,
      adaptiveTiming: general.adaptiveTiming,
      adaptiveTimeoutMs: general.adaptiveTimeoutMs,
      fixedTiming: general.fixedTiming,
      ...overrides
    }
  }

  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value)) }

  async function sync(overrides = {}) {
    state.value = { ...state.value, ...unwrap(await electronApi.junfeng.updateRuntime(runtime(overrides))) }
    return state.value
  }

  async function setEnabled(value) {
    const enabled = Boolean(value)
    await sync({ enabled })
    settings.value.enabled = enabled
    persist()
  }

  async function calibrateGrid() {
    const result = unwrap(await electronApi.junfeng.pickGridRegion())
    if (!result?.canceled) {
      settings.value = normalizeJunfengSettings({ ...settings.value, gridRegion: result })
      persist()
      if (settings.value.enabled) await sync()
    }
    return result
  }

  async function runPreview() {
    busy.value = true
    try {
      if (settings.value.enabled) await sync()
      preview.value = unwrap(await electronApi.junfeng.preview())
      previewLabels.value = {}
      return preview.value
    } finally { busy.value = false }
  }

  async function start() { state.value = { ...state.value, ...unwrap(await electronApi.junfeng.start()) } }
  async function stop() { state.value = { ...state.value, ...unwrap(await electronApi.junfeng.stop()) } }

  async function loadCorrections() { corrections.value = unwrap(await electronApi.highlightCalibration.list()); return corrections.value }
  function setPreviewLabel(cell, label) {
    previewLabels.value = { ...previewLabels.value, [`${cell.column}:${cell.row}`]: label }
  }
  async function savePreviewCorrections() {
    const entries = Object.entries(previewLabels.value)
    if (!entries.length) return 0
    const cells = new Map((preview.value?.cells || []).map(cell => [`${cell.column}:${cell.row}`, cell]))
    await Promise.all(entries.map(([key, label]) => {
      const cell = cells.get(key)
      if (!cell?.tileDataUrl) throw new Error('校准图块缺失，请重新运行检测预览')
      return electronApi.highlightCalibration.save({ ...cell, label, domain: 'junfeng', columns: 12, rows: 11 })
        .then(unwrap)
    }))
    await loadCorrections()
    await runPreview()
    return entries.length
  }
  async function correct(cell, label) {
    setPreviewLabel(cell, label)
    return savePreviewCorrections()
  }
  async function removeCorrection(id) { unwrap(await electronApi.highlightCalibration.remove(id)); return loadCorrections() }
  async function resetCorrections() { corrections.value = unwrap(await electronApi.highlightCalibration.reset()); return corrections.value }
  async function rebuildCorrections() { corrections.value = unwrap(await electronApi.junfeng.rebuildCorrections()); return corrections.value }

  async function pickTrainingRegion(domain) {
    const result = unwrap(await electronApi.junfeng.pickTrainingRegion())
    if (!result?.canceled) {
      trainingRegions.value = { ...trainingRegions.value, [domain]: result }
      localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(trainingRegions.value))
    }
    return result
  }

  async function captureTraining(domain, partition = 'train') {
    const gridRegion = trainingRegions.value[domain]
    if (!gridRegion) throw new Error('请先框选该来源的训练网格')
    trainingBusy.value = true
    try {
      trainingPreview.value = unwrap(await electronApi.junfeng.previewTraining({ domain, gridRegion, partition }))
      trainingLabels.value = Object.fromEntries(trainingPreview.value.cells.map(cell => [`${cell.column}:${cell.row}`, cell.label]))
      reviewingSessionId.value = ''
      return trainingPreview.value
    } finally { trainingBusy.value = false }
  }

  function setTrainingLabel(cell, label) {
    trainingLabels.value = { ...trainingLabels.value, [`${cell.column}:${cell.row}`]: label }
  }

  function setAllTrainingLabels(label) {
    if (!trainingPreview.value) return
    trainingLabels.value = Object.fromEntries(trainingPreview.value.cells.map(cell => [`${cell.column}:${cell.row}`, label]))
  }

  async function saveTrainingSession() {
    if (!trainingPreview.value) throw new Error('请先采集训练预览')
    const savedPreview = trainingPreview.value
    const summary = reviewingSessionId.value
      ? unwrap(await electronApi.junfeng.updateTrainingSession({ id: reviewingSessionId.value,
        labels: trainingLabels.value, partition: trainingPreview.value.partition }))
      : unwrap(await electronApi.junfeng.saveTrainingSession({ previewId: trainingPreview.value.previewId,
        labels: trainingLabels.value, partition: trainingPreview.value.partition }))
    trainingStatus.value = { ...trainingStatus.value, summary }
    await loadTrainingSessions()
    if (trainingPreview.value === savedPreview) {
      trainingPreview.value = null
      trainingLabels.value = {}
      reviewingSessionId.value = ''
    }
    return summary
  }


  async function loadTrainingSessions() {
    trainingSessions.value = unwrap(await electronApi.junfeng.listTrainingSessions())
    return trainingSessions.value
  }

  async function reviewTrainingSession(id) {
    trainingPreview.value = unwrap(await electronApi.junfeng.getTrainingSession(id))
    if (trainingPreview.value.partition === 'legacy') trainingPreview.value.partition = 'train'
    trainingLabels.value = Object.fromEntries(trainingPreview.value.cells.map(cell => [`${cell.column}:${cell.row}`, cell.label]))
    reviewingSessionId.value = String(id)
    return trainingPreview.value
  }

  async function deleteTrainingSession(id) {
    const summary = unwrap(await electronApi.junfeng.deleteTrainingSession(id))
    trainingStatus.value = { ...trainingStatus.value, summary }
    if (reviewingSessionId.value === String(id)) {
      reviewingSessionId.value = ''; trainingPreview.value = null; trainingLabels.value = {}
    }
    await loadTrainingSessions()
    return summary
  }

  async function loadTrainingStatus() {
    trainingStatus.value = unwrap(await electronApi.junfeng.getTrainingStatus())
    return trainingStatus.value
  }

  async function trainModel(epochs = 100) {
    trainingBusy.value = true
    try { trainingStatus.value = unwrap(await electronApi.junfeng.trainModel({ epochs })); return trainingStatus.value }
    finally { trainingBusy.value = false }
  }

  async function evaluateModel() {
    trainingBusy.value = true
    try { trainingStatus.value = unwrap(await electronApi.junfeng.evaluateModel()); return trainingStatus.value }
    finally { trainingBusy.value = false }
  }

  function listen() {
    const removePickup = electronApi.junfeng.onEvent(event => { state.value = { ...state.value, ...event } })
    const removeTraining = electronApi.junfeng.onTrainingEvent(event => { trainingStatus.value = event })
    return () => { removePickup(); removeTraining() }
  }

  async function initializeRuntime() {
    try { await sync(); await loadCorrections(); await loadTrainingStatus(); await loadTrainingSessions() } catch {
      settings.value.enabled = false
      persist()
      try { await electronApi.junfeng.updateRuntime(runtime({ enabled: false })) } catch {}
    }
  }

  return { settings, state, preview, previewLabels, corrections, busy, running, trainingBusy, trainingPreview, trainingLabels,
    trainingStatus, trainingRegions, trainingSessions, reviewingSessionId, setEnabled, calibrateGrid, runPreview, start, stop,
    loadCorrections, setPreviewLabel, savePreviewCorrections, correct,
    removeCorrection, resetCorrections, rebuildCorrections, pickTrainingRegion, captureTraining, setTrainingLabel,
    setAllTrainingLabels, saveTrainingSession, loadTrainingSessions, reviewTrainingSession, deleteTrainingSession,
    loadTrainingStatus, trainModel, evaluateModel, listen, initializeRuntime, sync }
})
