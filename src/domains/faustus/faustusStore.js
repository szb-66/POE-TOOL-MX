import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '@/api/electron.js'
import { createFaustusConfigRepository, createFaustusRunSnapshot } from '@/utils/faustusConfig.js'
import { createFaustusBandReorderTransaction, moveFaustusBand } from '@/utils/faustusBandReorder.js'
import { FAUSTUS_CURRENCY, normalizeFaustusConfig, validateFaustusConfig } from '@/utils/faustusPricing.js'

function unwrap(response, fallback = '浮士德操作失败') {
  if (response?.success) return response.data
  throw Object.assign(new Error(response?.error?.message || fallback), { code: response?.error?.code || 'FAUSTUS_ERROR' })
}

function bandId() {
  return globalThis.crypto?.randomUUID?.() || `band-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function newBand() {
  return {
    id: bandId(), start: '', end: '', rangeCurrency: FAUSTUS_CURRENCY.chaos,
    discountPercent: '10', outputCurrency: FAUSTUS_CURRENCY.chaos
  }
}

export const useFaustusStore = defineStore('faustus', () => {
  const repository = createFaustusConfigRepository()
  const config = ref(repository.load())
  const state = ref({ status: 'idle', reasonCode: '', processed: 0, total: 0 })
  const logs = ref([])
  const busy = ref(false)
  let unsubscribe = null

  const validation = computed(() => validateFaustusConfig(config.value))
  const running = computed(() => state.value.status === 'running' || state.value.status === 'stopping')

  const bandReorder = createFaustusBandReorderTransaction({
    getBands: () => config.value.bands,
    preview: bands => { config.value = { ...config.value, bands } },
    commit: bands => updateConfig({ bands }),
    locked: () => running.value
  })

  function persist(value = config.value) {
    config.value = repository.save(value)
  }

  function updateConfig(patch) {
    persist(normalizeFaustusConfig({ ...config.value, ...patch }))
  }

  function updateBand(index, patch) {
    const bands = config.value.bands.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
    updateConfig({ bands })
  }

  function addBand() {
    updateConfig({ bands: [...config.value.bands, newBand()] })
  }

  function removeBand(index) {
    updateConfig({ bands: config.value.bands.filter((_item, itemIndex) => itemIndex !== index) })
  }

  function moveBand(index, offset) {
    if (running.value) return false
    const bands = moveFaustusBand(config.value.bands, index, offset)
    if (!bands) return false
    updateConfig({ bands })
    return true
  }

  function beginBandReorder(bandId) { return bandReorder.begin(bandId) }
  function previewBandReorder(bandId) { return bandReorder.preview(bandId) }
  function commitBandReorder() { return bandReorder.commit() }
  function cancelBandReorder() { return bandReorder.cancel() }

  async function calibrateGrid() {
    busy.value = true
    try {
      const result = unwrap(await electronApi.faustus.pickGridRegion(), '市集网格校准失败')
      if (!result?.canceled) updateConfig({ gridCalibration: result })
      return result
    } finally { busy.value = false }
  }

  async function start() {
    cancelBandReorder()
    const snapshot = createFaustusRunSnapshot(config.value)
    if (!snapshot.gridCalibration) throw Object.assign(new Error('请先校准市集网格'), { code: 'MISSING_GRID_CALIBRATION' })
    busy.value = true
    logs.value = []
    try {
      state.value = unwrap(await electronApi.faustus.start({ config: snapshot }), '启动浮士德改价失败')
      return state.value
    } finally { busy.value = false }
  }

  async function stop() {
    state.value = { ...state.value, status: 'stopping' }
    state.value = unwrap(await electronApi.faustus.stop('user'), '停止浮士德改价失败')
    return state.value
  }

  function handleEvent(event) {
    if (!event || typeof event !== 'object') return
    if (event.type === 'state') state.value = { ...state.value, ...event.state }
    if (event.type === 'item') logs.value = [event.item, ...logs.value].slice(0, 500)
  }

  async function connect() {
    unsubscribe?.()
    unsubscribe = electronApi.faustus.onEvent(handleEvent)
    try { state.value = unwrap(await electronApi.faustus.getStatus()) } catch { /* Electron 初始化稍后由事件同步 */ }
  }

  function disconnect() {
    unsubscribe?.()
    unsubscribe = null
  }

  return {
    config, state, logs, busy, validation, running,
    updateConfig, updateBand, addBand, removeBand, moveBand,
    beginBandReorder, previewBandReorder, commitBandReorder, cancelBandReorder,
    calibrateGrid, start, stop, connect, disconnect
  }
})
