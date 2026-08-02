import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '../api/electron.js'
import {
  PUZZLE_TYPES,
  assignSourceSlots,
  countsFromSlots,
  solvePuzzle
} from '../domains/puzzle/solver.js'
import { normalizePuzzleRegionMetadata } from '../utils/puzzleConfig.js'

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

function loadRegion() {
  if (typeof localStorage === 'undefined') return null
  try {
    return normalizePuzzleRegionMetadata(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').regionMetadata)
  } catch {
    return null
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
      orientation: Math.round(Number(slot?.orientation) || 0) % 360,
      confidence: Math.max(0, Math.min(1, Number(slot?.confidence) || 0)),
      corrected: Boolean(slot?.corrected),
      uncertain: Boolean(slot?.uncertain)
    }
  })
}

export const usePuzzleStore = defineStore('puzzle', () => {
  const regionMetadata = ref(loadRegion())
  const slots = ref(emptySlots())
  const warnings = ref([])
  const requiredExits = ref([])
  const solutionIndex = ref(0)
  const solving = ref(false)
  const analyzing = ref(false)
  const error = ref(null)
  const result = ref({ score: null, totalOptimalCount: 0, solutions: [], truncated: false, error: '' })

  const counts = computed(() => countsFromSlots(slots.value))
  const currentSolution = computed(() => result.value.solutions[solutionIndex.value] || null)
  const currentSourceSlots = computed(() => currentSolution.value?.sourceSlots || [])
  const hasInventory = computed(() => slots.value.some(slot => slot.occupied))

  function persistRegion() {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ regionMetadata: regionMetadata.value }))
  }

  function recompute() {
    solving.value = true
    try {
      const solved = solvePuzzle({
        counts: counts.value,
        requiredExits: requiredExits.value,
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

  async function pickInventoryRegion() {
    error.value = null
    const response = await electronApi.puzzle.pickInventoryRegion()
    if (response?.canceled) return response
    const normalized = normalizePuzzleRegionMetadata(response)
    if (!normalized) {
      error.value = { code: 'REGION_INVALID', message: '框选区域无效，请重新框选完整仓库' }
      return { success: false, error: error.value }
    }
    regionMetadata.value = normalized
    persistRegion()
    return { success: true, regionMetadata: normalized }
  }

  function applyAnalysis(response, { resetConstraints = true } = {}) {
    if (!response?.success) {
      error.value = response?.error || { code: 'PUZZLE_ANALYSIS_FAILED', message: '九宫格识别失败' }
      return false
    }
    if (response.regionMetadata) {
      regionMetadata.value = normalizePuzzleRegionMetadata(response.regionMetadata) || regionMetadata.value
      persistRegion()
    }
    slots.value = normalizeSlots(response.slots)
    warnings.value = Array.isArray(response.warnings) ? response.warnings : []
    error.value = null
    if (resetConstraints) requiredExits.value = []
    solutionIndex.value = 0
    recompute()
    return true
  }

  async function analyze() {
    if (!regionMetadata.value) {
      error.value = { code: 'REGION_REQUIRED', message: '请先框选完整的 6×10 碎片仓库区域' }
      return { success: false, error: error.value }
    }
    if (analyzing.value) {
      return { success: false, error: { code: 'ANALYSIS_BUSY', message: '九宫格识别正在进行，请稍候' } }
    }
    analyzing.value = true
    error.value = null
    try {
      const response = await electronApi.puzzle.analyze({
        regionMetadata: regionMetadata.value
      })
      applyAnalysis(response)
      return response
    } catch (caught) {
      error.value = { code: 'PUZZLE_ANALYSIS_FAILED', message: caught?.message || String(caught) }
      return { success: false, error: error.value }
    } finally {
      analyzing.value = false
    }
  }

  function updateSlot(row, column, type) {
    const index = Number(row) * 6 + Number(column)
    if (!slots.value[index]) return
    const occupied = PUZZLE_TYPES.includes(type)
    slots.value[index] = {
      ...slots.value[index],
      occupied,
      type: occupied ? type : null,
      orientation: 0,
      confidence: occupied ? 1 : 0,
      corrected: true,
      uncertain: false
    }
    solutionIndex.value = 0
    recompute()
  }

  function toggleRequiredExit(exitId) {
    requiredExits.value = requiredExits.value.includes(exitId)
      ? requiredExits.value.filter(value => value !== exitId)
      : [...requiredExits.value, exitId]
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

  return {
    regionMetadata,
    slots,
    warnings,
    requiredExits,
    solutionIndex,
    solving,
    analyzing,
    error,
    result,
    counts,
    currentSolution,
    currentSourceSlots,
    hasInventory,
    pickInventoryRegion,
    analyze,
    applyAnalysis,
    updateSlot,
    toggleRequiredExit,
    previousSolution,
    nextSolution,
    recompute,
    listen
  }
})
