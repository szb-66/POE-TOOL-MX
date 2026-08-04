import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '../api/electron.js'
import {
  PUZZLE_TYPES,
  assignSourceSlots,
  countsFromSlots,
  maskForType,
  solvePuzzle
} from '../domains/puzzle/solver.js'
import {
  normalizePuzzleOrientation,
  normalizePuzzleRegionMetadata,
  normalizePuzzleSettings
} from '../utils/puzzleConfig.js'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from '../utils/diagnostics.js'

const STORAGE_KEY = 'puzzleSettings'
const SLOT_COUNT = 60

function emptySlots() {
  return Array.from({ length: SLOT_COUNT }, (_, index) => ({
    row: Math.floor(index / 6),
    column: index % 6,
    occupied: false,
    type: null,
    orientation: 0,
    confidence: 0,
    corrected: false,
    uncertain: false
  }))
}

function emptyResult() {
  return { score: null, totalOptimalCount: 0, solutions: [], truncated: false, error: '' }
}

function loadSettings() {
  if (typeof localStorage === 'undefined') return normalizePuzzleSettings()
  try {
    return normalizePuzzleSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'))
  } catch {
    return normalizePuzzleSettings()
  }
}

function normalizeSlots(value) {
  const byPosition = new Map((Array.isArray(value) ? value : []).map(slot => [`${slot.row}:${slot.column}`, slot]))
  return emptySlots().map(fallback => {
    const slot = byPosition.get(`${fallback.row}:${fallback.column}`)
    const occupied = Boolean(slot?.occupied && PUZZLE_TYPES.includes(slot.type))
    return {
      ...fallback,
      ...slot,
      row: fallback.row,
      column: fallback.column,
      occupied,
      type: occupied ? slot.type : null,
      orientation: occupied ? normalizePuzzleOrientation(slot.type, slot?.orientation) : 0,
      mask: occupied ? Number(slot?.mask || maskForType(slot.type, slot?.orientation)) & 15 : 0,
      confidence: Math.max(0, Math.min(1, Number(slot?.confidence) || 0)),
      corrected: Boolean(slot?.corrected),
      uncertain: Boolean(slot?.uncertain)
    }
  })
}

export const usePuzzleStore = defineStore('puzzle', () => {
  const loaded = loadSettings()
  const inventoryRegionMetadata = ref(loaded.inventoryRegionMetadata)
  const atlasRegionMetadata = ref(loaded.atlasRegionMetadata)
  const regionMetadata = inventoryRegionMetadata
  const previews = ref({ inventory: '', atlas: '' })
  const configurationStates = ref({
    inventory: { configured: Boolean(loaded.inventoryRegionMetadata), valid: false, message: '等待环境校验' },
    atlas: { configured: Boolean(loaded.atlasRegionMetadata), valid: false, message: '等待环境校验' }
  })
  const slots = ref(emptySlots())
  const warnings = ref([])
  const requiredExits = ref([])
  const forbiddenExits = ref([])
  const solutionIndex = ref(0)
  const solving = ref(false)
  const analyzing = ref(false)
  const error = ref(null)
  const result = ref(emptyResult())
  const execution = ref({ status: 'idle', currentIndex: -1, total: 9, completed: 0, reason: '', error: null })

  const counts = computed(() => countsFromSlots(slots.value))
  const currentSolution = computed(() => result.value.solutions[solutionIndex.value] || null)
  const currentSourceSlots = computed(() => currentSolution.value?.sourceSlots || [])
  const hasInventory = computed(() => slots.value.some(slot => slot.occupied))
  const occupiedCount = computed(() => PUZZLE_TYPES.reduce((sum, type) => sum + counts.value[type], 0))
  const hasExitConstraints = computed(() => Boolean(requiredExits.value.length || forbiddenExits.value.length))
  const executing = computed(() => ['validating', 'running'].includes(execution.value.status))
  const resumeIndex = computed(() => (
    ['error', 'stopped'].includes(execution.value.status) && execution.value.completed > 0 && execution.value.completed < 9
      ? Number(execution.value.completed)
      : 0
  ))
  const remainingSourceSlots = computed(() => currentSolution.value
    ? assignSourceSlots({ cells: currentSolution.value.cells.slice(resumeIndex.value) }, slots.value)
    : [])
  const autoPlaceBlockedReason = computed(() => {
    if (executing.value) return '海图自动放入正在执行'
    if (!configurationStates.value.inventory?.valid) return '碎片仓库配置无效'
    if (!configurationStates.value.atlas?.valid) return '海图区配置无效'
    if (!currentSolution.value) {
      if (result.value.error === 'INSUFFICIENT_FRAGMENTS') {
        return `可用碎片不足 9 块，还差 ${Math.max(0, 9 - occupiedCount.value)} 块`
      }
      if (result.value.error === 'NO_SOLUTION' && hasExitConstraints.value) {
        return '当前碎片无法满足出口限制，请清空出口状态'
      }
      if (result.value.error === 'NO_SOLUTION') return '现有碎片类型组合无法拼成完整九宫格'
      return '请先识别碎片并生成海图方案'
    }
    const expected = 9 - resumeIndex.value
    if (remainingSourceSlots.value.length !== expected) return '仓库内容已变化，请重新识别后继续'
    return ''
  })
  const canAutoPlace = computed(() => !autoPlaceBlockedReason.value)

  function persistRegions() {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      regionMetadata: inventoryRegionMetadata.value,
      inventoryRegionMetadata: inventoryRegionMetadata.value,
      atlasRegionMetadata: atlasRegionMetadata.value
    }))
  }
  persistRegions()

  function recompute() {
    if (executing.value) return
    solving.value = true
    try {
      const solved = solvePuzzle({
        counts: counts.value,
        requiredExits: requiredExits.value,
        forbiddenExits: forbiddenExits.value,
        solutionLimit: 100
      })
      result.value = {
        ...solved,
        solutions: solved.solutions.map(solution => ({
          ...solution,
          sourceSlots: assignSourceSlots(solution, slots.value)
        }))
      }
      solutionIndex.value = Math.min(solutionIndex.value, Math.max(0, result.value.solutions.length - 1))
    } finally {
      solving.value = false
    }
  }

  async function loadConfiguration() {
    const response = await electronApi.puzzle.getConfiguration?.({
      inventoryRegionMetadata: inventoryRegionMetadata.value,
      atlasRegionMetadata: atlasRegionMetadata.value
    })
    if (response?.previews) previews.value = { ...previews.value, ...response.previews }
    if (response?.states) configurationStates.value = { ...configurationStates.value, ...response.states }
    return response
  }

  async function pickRegion(type = 'inventory') {
    error.value = null
    const response = type === 'atlas'
      ? await electronApi.puzzle.pickAtlasRegion?.()
      : await electronApi.puzzle.pickInventoryRegion()
    if (response?.canceled) return response
    const normalized = normalizePuzzleRegionMetadata(response)
    if (!normalized) {
      error.value = { code: 'REGION_INVALID', message: '框选区域无效，请重新框选完整仓库' }
      return { success: false, error: error.value }
    }
    if (type === 'atlas') atlasRegionMetadata.value = normalized
    else inventoryRegionMetadata.value = normalized
    if (response.previewDataUrl) previews.value[type] = response.previewDataUrl
    persistRegions()
    await loadConfiguration()
    return { success: true, regionMetadata: normalized }
  }

  const pickInventoryRegion = () => pickRegion('inventory')
  const pickAtlasRegion = () => pickRegion('atlas')

  function applyAnalysis(response, { resetConstraints = true, preserveSolution = false } = {}) {
    if (!response?.success) {
      error.value = response?.error || { code: 'PUZZLE_ANALYSIS_FAILED', message: '海图识别失败' }
      void reportDiagnosticFailure('puzzle', 'analysis', error.value, 'unknown_failure')
      return false
    }
    if (response.regionMetadata) {
      inventoryRegionMetadata.value = normalizePuzzleRegionMetadata(response.regionMetadata) || inventoryRegionMetadata.value
      persistRegions()
    }
    slots.value = normalizeSlots(response.slots)
    warnings.value = Array.isArray(response.warnings) ? response.warnings : []
    error.value = null
    void reportDiagnosticRecovery('puzzle', 'analysis')
    if (!preserveSolution) {
      if (resetConstraints) {
        requiredExits.value = []
        forbiddenExits.value = []
      }
      solutionIndex.value = 0
      recompute()
    }
    return true
  }

  function resetAnalysisState() {
    slots.value = emptySlots()
    warnings.value = []
    requiredExits.value = []
    forbiddenExits.value = []
    solutionIndex.value = 0
    result.value = emptyResult()
    execution.value = { status: 'idle', currentIndex: -1, total: 9, completed: 0, reason: '', error: null }
    error.value = null
  }

  async function analyze({ preserveSolution = false } = {}) {
    if (!inventoryRegionMetadata.value) {
      error.value = { code: 'REGION_REQUIRED', message: '请先框选完整的 6×10 碎片仓库区域' }
      return { success: false, error: error.value }
    }
    if (analyzing.value) {
      return { success: false, error: { code: 'ANALYSIS_BUSY', message: '海图识别正在进行，请稍候' } }
    }
    if (!preserveSolution) resetAnalysisState()
    analyzing.value = true
    error.value = null
    try {
      const response = await electronApi.puzzle.analyze({
        regionMetadata: inventoryRegionMetadata.value,
        resetExecution: !preserveSolution
      })
      applyAnalysis(response, { preserveSolution })
      return response
    } catch (caught) {
      error.value = { code: 'PUZZLE_ANALYSIS_FAILED', message: caught?.message || String(caught) }
      void reportDiagnosticFailure('puzzle', 'analysis', caught, 'unknown_failure')
      return { success: false, error: error.value }
    } finally {
      analyzing.value = false
    }
  }

  async function refreshInventoryAfterExecution() {
    if (executing.value || analyzing.value || !currentSolution.value) return null
    return analyze({ preserveSolution: true })
  }

  function updateSlot(row, column, type, orientation = 0) {
    const index = Number(row) * 6 + Number(column)
    if (!slots.value[index]) return
    const occupied = PUZZLE_TYPES.includes(type)
    slots.value[index] = {
      ...slots.value[index],
      occupied,
      type: occupied ? type : null,
      orientation: occupied ? normalizePuzzleOrientation(type, orientation) : 0,
      mask: occupied ? maskForType(type, orientation) : 0,
      confidence: occupied ? 1 : 0,
      corrected: true,
      uncertain: false
    }
    solutionIndex.value = 0
    recompute()
  }

  function updateSlotOrientation(row, column, orientation) {
    const index = Number(row) * 6 + Number(column)
    const slot = slots.value[index]
    if (!slot?.occupied) return
    const normalized = normalizePuzzleOrientation(slot.type, orientation)
    slots.value[index] = {
      ...slot, orientation: normalized, mask: maskForType(slot.type, normalized),
      confidence: 1, corrected: true, uncertain: false
    }
    recompute()
  }

  function executionPayload() {
    if (!currentSolution.value) return null
    return {
      inventoryRegionMetadata: inventoryRegionMetadata.value,
      atlasRegionMetadata: atlasRegionMetadata.value,
      targets: currentSolution.value.cells.map(cell => ({
        index: cell.index, row: cell.row, column: cell.column,
        type: cell.type, mask: cell.mask, orientation: cell.orientation
      })),
      resume: resumeIndex.value > 0
    }
  }

  async function startAutoPlacement(operationDelayMs = 80) {
    if (!canAutoPlace.value) return { success: false, error: { code: 'ATLAS_NOT_READY', message: '请完成两项区域配置并确认全部来源碎片' } }
    const response = await electronApi.puzzle.startAutoPlacement?.({ ...executionPayload(), operationDelayMs })
    if (response?.status) execution.value = response
    if (!response?.success && response?.error) error.value = response.error
    if (response?.success) void reportDiagnosticRecovery('puzzle', 'auto_placement')
    else void reportDiagnosticFailure('puzzle', 'auto_placement', response?.error, 'automation_failed')
    return response
  }

  async function stopAutoPlacement(reason = 'user') {
    const response = await electronApi.puzzle.stopAutoPlacement?.(reason)
    if (response?.status) execution.value = response
    return response
  }

  async function refreshExecutionStatus() {
    const response = await electronApi.puzzle.getAutoPlacementStatus?.()
    if (response?.status) execution.value = response
    return response
  }

  function toggleRequiredExit(exitId) {
    const wasRequired = requiredExits.value.includes(exitId)
    forbiddenExits.value = forbiddenExits.value.filter(value => value !== exitId)
    requiredExits.value = wasRequired
      ? requiredExits.value.filter(value => value !== exitId)
      : [...requiredExits.value, exitId]
    solutionIndex.value = 0
    recompute()
  }

  function toggleForbiddenExit(exitId) {
    const wasForbidden = forbiddenExits.value.includes(exitId)
    requiredExits.value = requiredExits.value.filter(value => value !== exitId)
    forbiddenExits.value = wasForbidden
      ? forbiddenExits.value.filter(value => value !== exitId)
      : [...forbiddenExits.value, exitId]
    solutionIndex.value = 0
    recompute()
  }

  function clearExitConstraints() {
    if (!requiredExits.value.length && !forbiddenExits.value.length) return
    requiredExits.value = []
    forbiddenExits.value = []
    solutionIndex.value = 0
    recompute()
  }

  function previousSolution() {
    if (solutionIndex.value > 0) solutionIndex.value -= 1
  }

  function nextSolution() {
    if (solutionIndex.value + 1 < result.value.solutions.length) solutionIndex.value += 1
  }

  function listen(onUpdated) {
    return electronApi.puzzle.onAnalysisUpdated(response => onUpdated?.(response))
  }

  function listenExecution(onUpdated) {
    return electronApi.puzzle.onAutoPlacementUpdated?.(response => {
      if (response?.status) execution.value = response
      onUpdated?.(response)
    }) || (() => {})
  }

  return {
    regionMetadata,
    inventoryRegionMetadata,
    atlasRegionMetadata,
    previews,
    configurationStates,
    slots,
    warnings,
    requiredExits,
    forbiddenExits,
    solutionIndex,
    solving,
    analyzing,
    error,
    result,
    execution,
    counts,
    currentSolution,
    currentSourceSlots,
    remainingSourceSlots,
    resumeIndex,
    hasInventory,
    executing,
    canAutoPlace,
    autoPlaceBlockedReason,
    loadConfiguration,
    pickInventoryRegion,
    pickAtlasRegion,
    analyze,
    resetAnalysisState,
    applyAnalysis,
    updateSlot,
    updateSlotOrientation,
    toggleRequiredExit,
    toggleForbiddenExit,
    clearExitConstraints,
    previousSolution,
    nextSolution,
    recompute,
    startAutoPlacement,
    stopAutoPlacement,
    refreshInventoryAfterExecution,
    refreshExecutionStatus,
    listen,
    listenExecution
  }
})
