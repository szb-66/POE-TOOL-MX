import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '../api/electron.js'
import { normalizeStashPickupSettings } from '../utils/stashPickupConfig.js'
import { useInterfaceDetectionStore } from './interfaceDetection.js'

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
    status: 'idle', layout: 0, method: 'variance', candidateCells: 0,
    remainingCells: 0, pickedItems: 0, currentIndex: 0, reason: ''
  })
  const preview = ref(null)
  const busy = ref(false)
  const running = computed(() => state.value.status === 'running')

  function runtime(overrides = {}) {
    return {
      ...JSON.parse(JSON.stringify(settings.value)),
      calibration: JSON.parse(JSON.stringify(interfaceStore.stashGridCalibration)),
      ...interfaceStore.runtime(),
      operationDelayMs: 80,
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
    settings.value.profiles[layout] = normalizeStashPickupSettings({
      profiles: { [layout]: { ...settings.value.profiles[layout], ...patch } }
    }).profiles[layout]
    save()
    if (settings.value.enabled) await syncRuntime()
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
      return preview.value
    } finally { busy.value = false }
  }

  async function start() {
    if (settings.value.enabled) await syncRuntime()
    state.value = { ...state.value, ...unwrap(await electronApi.stashPickup.start()) }
  }

  async function stop() {
    state.value = { ...state.value, ...unwrap(await electronApi.stashPickup.stop()) }
  }

  function listen() {
    return electronApi.stashPickup.onEvent(event => { state.value = { ...state.value, ...event } })
  }

  async function initializeRuntime() {
    try { await syncRuntime() } catch {
      settings.value.enabled = false
      save()
    }
  }

  return {
    settings, state, preview, busy, running,
    setEnabled, updateProfile, calibrate, runPreview, start, stop, listen, initializeRuntime, syncRuntime
  }
})

