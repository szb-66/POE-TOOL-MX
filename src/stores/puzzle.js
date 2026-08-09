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
  normalizePuzzleRecognition,
  normalizePuzzleOrientation,
  normalizePuzzleRegionMetadata,
  normalizePuzzleSettings,
  normalizePuzzleTabPoints,
  validatePuzzleTabPoint
} from '../utils/puzzleConfig.js'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from '../utils/diagnostics.js'

const STORAGE_KEY = 'puzzleSettings'
const SLOT_COUNT = 60

function emptySlots(page = 1) {
  return Array.from({ length: SLOT_COUNT }, (_, index) => ({
    page,
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

function emptyInventoryPage(page) {
  return { page, recognized: false, slots: emptySlots(page), warnings: [], gridConfidence: null }
}

function slotSignature(slots = []) {
  return slots.map(slot => slot?.occupied
    ? `${slot.type}:${Number(slot.orientation || 0)}`
    : '-').join('|')
}

function emptyResult() {
  return { score: null, totalOptimalCount: 0, solutions: [], truncated: false, error: '' }
}

function waitForNextPaint() {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    } else {
      setTimeout(resolve, 16)
    }
  })
}

function loadSettings() {
  if (typeof localStorage === 'undefined') return normalizePuzzleSettings()
  try {
    return normalizePuzzleSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'))
  } catch {
    return normalizePuzzleSettings()
  }
}

function normalizeSlots(value, page = 1) {
  const byPosition = new Map((Array.isArray(value) ? value : []).map(slot => [`${slot.row}:${slot.column}`, slot]))
  return emptySlots(page).map(fallback => {
    const slot = byPosition.get(`${fallback.row}:${fallback.column}`)
    const occupied = Boolean(slot?.occupied && PUZZLE_TYPES.includes(slot.type))
    return {
      ...fallback,
      ...slot,
      page,
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

function mergeCorrectedSlots(existing, incoming) {
  if (!existing || !existing.length) return incoming
  return incoming.map((slot, index) => {
    const previous = existing[index]
    if (!previous?.corrected) return slot
    return {
      ...slot,
      occupied: previous.occupied,
      type: previous.type,
      orientation: previous.orientation,
      mask: previous.mask,
      confidence: previous.confidence,
      corrected: true,
      uncertain: false
    }
  })
}

export const usePuzzleStore = defineStore('puzzle', () => {
  const loaded = loadSettings()
  const inventoryRegionMetadata = ref(loaded.inventoryRegionMetadata)
  const atlasRegionMetadata = ref(loaded.atlasRegionMetadata)
  const regionMetadata = inventoryRegionMetadata
  const recognition = ref(loaded.recognition || { strength: 'standard' })
  const inventoryTabPoints = ref(normalizePuzzleTabPoints(loaded.inventoryTabPoints))
  const selectedInventoryPage = ref(1)
  const inventoryPages = ref({ 1: emptyInventoryPage(1), 2: emptyInventoryPage(2) })
  const previews = ref({ inventory: '', atlas: '' })
  const configurationStates = ref({
    inventory: { configured: Boolean(loaded.inventoryRegionMetadata), valid: false, message: '等待环境校验' },
    atlas: { configured: Boolean(loaded.atlasRegionMetadata), valid: false, message: '等待环境校验' }
  })
  const slots = computed(() => inventoryPages.value[selectedInventoryPage.value].slots)
  const warnings = computed(() => inventoryPages.value[selectedInventoryPage.value].warnings)
  const gridConfidence = computed(() => inventoryPages.value[selectedInventoryPage.value].gridConfidence)
  const allSlots = computed(() => [1, 2]
    .filter(page => inventoryPages.value[page].recognized)
    .flatMap(page => inventoryPages.value[page].slots))
  const requiredExits = ref([])
  const forbiddenExits = ref([])
  const solutionIndex = ref(0)
  const solving = ref(false)
  const analyzing = ref(false)
  const error = ref(null)
  const result = ref(emptyResult())
  const execution = ref({ status: 'idle', currentIndex: -1, total: 9, completed: 0, reason: '', error: null })
  let regionClearGeneration = 0

  const counts = computed(() => countsFromSlots(allSlots.value))
  const currentSolution = computed(() => result.value.solutions[solutionIndex.value] || null)
  const currentSourceSlots = computed(() => currentSolution.value?.sourceSlots || [])
  const hasInventory = computed(() => allSlots.value.some(slot => slot.occupied))
  const occupiedCount = computed(() => PUZZLE_TYPES.reduce((sum, type) => sum + counts.value[type], 0))
  const hasExitConstraints = computed(() => Boolean(requiredExits.value.length || forbiddenExits.value.length))
  const executing = computed(() => ['validating', 'running'].includes(execution.value.status))
  const resumeIndex = computed(() => (
    ['error', 'stopped'].includes(execution.value.status) && execution.value.completed > 0 && execution.value.completed < 9
      ? Number(execution.value.completed)
      : 0
  ))
  const remainingSourceSlots = computed(() => currentSolution.value
    ? assignSourceSlots({ cells: currentSolution.value.cells.slice(resumeIndex.value) }, allSlots.value)
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
    const missingTabPage = [...new Set(remainingSourceSlots.value.map(source => Number(source.page || 1)))]
      .find(page => !validatePuzzleTabPoint(inventoryTabPoints.value[page], inventoryRegionMetadata.value, page, inventoryTabPoints.value[page === 1 ? 2 : 1]).valid)
    if (missingTabPage) return `请先标定第 ${missingTabPage} 页仓库页签坐标`
    return ''
  })
  const canAutoPlace = computed(() => !autoPlaceBlockedReason.value)

  function persistRegions() {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      regionMetadata: inventoryRegionMetadata.value,
      inventoryRegionMetadata: inventoryRegionMetadata.value,
      atlasRegionMetadata: atlasRegionMetadata.value,
      recognition: recognition.value,
      inventoryTabPoints: inventoryTabPoints.value
    }))
  }
  persistRegions()

  async function recompute() {
    if (executing.value) return
    solving.value = true
    try {
      // 等一帧真正绘制完成，确保“正在计算”状态先显示出来，再执行同步求解
      await waitForNextPaint()
      if (executing.value) return
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
          sourceSlots: assignSourceSlots(solution, allSlots.value)
        }))
      }
      solutionIndex.value = Math.min(solutionIndex.value, Math.max(0, result.value.solutions.length - 1))
    } finally {
      solving.value = false
    }
  }

  function refreshSourceAssignments() {
    const index = solutionIndex.value
    const solution = result.value.solutions[index]
    if (!solution) return
    result.value = {
      ...result.value,
      solutions: result.value.solutions.map((candidate, candidateIndex) => (
        candidateIndex === index
          ? { ...candidate, sourceSlots: assignSourceSlots(candidate, allSlots.value) }
          : candidate
      ))
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
    else {
      inventoryRegionMetadata.value = normalized
      inventoryTabPoints.value = normalizePuzzleTabPoints()
      regionClearGeneration += 1
      resetAnalysisState()
    }
    if (response.previewDataUrl) previews.value[type] = response.previewDataUrl
    persistRegions()
    await loadConfiguration()
    return { success: true, regionMetadata: normalized }
  }

  const pickInventoryRegion = () => pickRegion('inventory')
  const pickAtlasRegion = () => pickRegion('atlas')

  async function clearRegion(type = 'inventory') {
    if (executing.value) {
      return { success: false, error: { code: 'PUZZLE_BUSY', message: '海图自动放入进行中，暂不能清空区域' } }
    }
    if (type === 'atlas') {
      atlasRegionMetadata.value = null
    } else {
      inventoryRegionMetadata.value = null
      inventoryTabPoints.value = normalizePuzzleTabPoints()
      regionClearGeneration += 1
      resetAnalysisState()
    }
    previews.value[type] = ''
    persistRegions()
    try {
      await electronApi.puzzle.clearRegion?.(type)
    } catch {
      // 预览文件清理失败不影响本地状态
    }
    try {
      await loadConfiguration()
    } catch {
      // 配置刷新失败不影响本地清空结果
    }
    // 即使主进程接口未更新或预览文件清理失败，也不允许旧截图复活
    previews.value[type] = ''
    return { success: true }
  }

  function applyAnalysis(response, { resetConstraints = false, preserveSolution = false } = {}) {
    if (!response?.success) {
      error.value = response?.error || { code: 'PUZZLE_ANALYSIS_FAILED', message: '海图识别失败' }
      void reportDiagnosticFailure('puzzle', 'analysis', error.value, 'unknown_failure')
      return false
    }
    if (response.regionMetadata) {
      inventoryRegionMetadata.value = normalizePuzzleRegionMetadata(response.regionMetadata) || inventoryRegionMetadata.value
      persistRegions()
    }
    const page = [1, 2].includes(Number(response.page)) ? Number(response.page) : selectedInventoryPage.value
    const incomingSlots = normalizeSlots(response.slots, page)
    const otherPage = page === 1 ? 2 : 1
    if (!preserveSolution && inventoryPages.value[otherPage].recognized && slotSignature(incomingSlots) === slotSignature(inventoryPages.value[otherPage].slots)) {
      error.value = { code: 'DUPLICATE_INVENTORY_PAGE', message: `第 ${page} 页与第 ${otherPage} 页识别结果完全相同，请确认游戏仓库页已经切换` }
      return false
    }
    inventoryPages.value[page] = {
      page,
      recognized: true,
      slots: mergeCorrectedSlots(preserveSolution ? inventoryPages.value[page].slots : null, incomingSlots),
      gridConfidence: Number.isFinite(Number(response.gridConfidence)) ? Math.max(0, Math.min(1, Number(response.gridConfidence))) : 1,
      warnings: Array.isArray(response.warnings) ? response.warnings : []
    }
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

  function applyAnalysisBatch(response, { resetConstraints = false } = {}) {
    if (!response?.success) {
      error.value = response?.error || { code: 'PUZZLE_ANALYSIS_FAILED', message: '海图双页识别失败' }
      void reportDiagnosticFailure('puzzle', 'analysis', error.value, 'unknown_failure')
      return false
    }
    const responses = Array.isArray(response.pages) ? response.pages : []
    const byPage = new Map(responses.map(item => [Number(item?.page), item]))
    if (!byPage.has(1) || !byPage.has(2) || [1, 2].some(page => byPage.get(page)?.success === false)) {
      error.value = { code: 'INVENTORY_PAGES_INCOMPLETE', message: '双页识别结果不完整，已保留原仓库结果' }
      return false
    }
    const nextPages = Object.fromEntries([1, 2].map(page => {
      const pageResponse = byPage.get(page)
      return [page, {
        page,
        recognized: true,
        slots: normalizeSlots(pageResponse.slots, page),
        gridConfidence: Number.isFinite(Number(pageResponse.gridConfidence)) ? Math.max(0, Math.min(1, Number(pageResponse.gridConfidence))) : 1,
        warnings: Array.isArray(pageResponse.warnings) ? pageResponse.warnings : []
      }]
    }))
    if (slotSignature(nextPages[1].slots) === slotSignature(nextPages[2].slots)) {
      error.value = { code: 'DUPLICATE_INVENTORY_PAGE', message: '第 1 页与第 2 页识别结果完全相同，请检查两个页签标定是否正确' }
      return false
    }
    if (response.regionMetadata) {
      inventoryRegionMetadata.value = normalizePuzzleRegionMetadata(response.regionMetadata) || inventoryRegionMetadata.value
      persistRegions()
    }
    inventoryPages.value = nextPages
    error.value = null
    void reportDiagnosticRecovery('puzzle', 'analysis')
    if (resetConstraints) {
      requiredExits.value = []
      forbiddenExits.value = []
    }
    solutionIndex.value = 0
    recompute()
    return true
  }

  function resetAnalysisState() {
    inventoryPages.value = { 1: emptyInventoryPage(1), 2: emptyInventoryPage(2) }
    requiredExits.value = []
    forbiddenExits.value = []
    solutionIndex.value = 0
    result.value = emptyResult()
    execution.value = { status: 'idle', currentIndex: -1, total: 9, completed: 0, reason: '', error: null }
    error.value = null
  }

  async function analyze({ preserveSolution = false, page = null } = {}) {
    if (!inventoryRegionMetadata.value) {
      error.value = { code: 'REGION_REQUIRED', message: '请先框选完整的 6×10 碎片仓库区域' }
      return { success: false, error: error.value }
    }
    if (analyzing.value) {
      return { success: false, error: { code: 'ANALYSIS_BUSY', message: '海图识别正在进行，请稍候' } }
    }
    analyzing.value = true
    error.value = null
    const clearGeneration = regionClearGeneration
    try {
      const response = await electronApi.puzzle.analyze({
        regionMetadata: inventoryRegionMetadata.value,
        recognition: recognition.value,
        inventoryTabPoints: inventoryTabPoints.value,
        page,
        resetExecution: !preserveSolution
      })
      if (regionClearGeneration !== clearGeneration) {
        return { success: false, error: { code: 'REGION_CLEARED', message: '识别期间已清空碎片仓库，本次结果已忽略' } }
      }
      const applied = Array.isArray(response?.pages)
        ? applyAnalysisBatch(response)
        : applyAnalysis(response, { preserveSolution })
      return applied ? response : { success: false, error: error.value, page }
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
    const page = Number(execution.value.source?.page || selectedInventoryPage.value)
    return analyze({ preserveSolution: true, page })
  }

  function selectInventoryPage(page) {
    const normalized = Number(page)
    if ([1, 2].includes(normalized)) selectedInventoryPage.value = normalized
  }

  async function clearInventoryPage(page = selectedInventoryPage.value) {
    if (executing.value) return { success: false, error: { code: 'PUZZLE_BUSY', message: '海图自动放入进行中，暂不能清空页面' } }
    const normalized = [1, 2].includes(Number(page)) ? Number(page) : selectedInventoryPage.value
    inventoryPages.value[normalized] = emptyInventoryPage(normalized)
    solutionIndex.value = 0
    error.value = null
    await recompute()
    return { success: true, page: normalized }
  }

  async function pickInventoryTabPoint(page) {
    const normalized = Number(page)
    if (![1, 2].includes(normalized)) return { success: false, error: { code: 'TAB_PAGE_INVALID', message: '仓库页码无效' } }
    if (!inventoryRegionMetadata.value) return { success: false, error: { code: 'REGION_REQUIRED', message: '请先框选碎片仓库区域' } }
    const response = await electronApi.puzzle.pickInventoryTabPoint?.(normalized)
    if (!response || response.canceled) return response || { canceled: true }
    const otherPage = normalized === 1 ? 2 : 1
    const validation = validatePuzzleTabPoint(response, inventoryRegionMetadata.value, normalized, inventoryTabPoints.value[otherPage])
    if (!validation.valid) {
      error.value = { code: validation.code, message: validation.message }
      return { success: false, error: error.value }
    }
    inventoryTabPoints.value = { ...inventoryTabPoints.value, [normalized]: validation.point }
    persistRegions()
    error.value = null
    return { success: true, page: normalized, point: validation.point }
  }

  function updateSlot(row, column, type, orientation = 0) {
    const index = Number(row) * 6 + Number(column)
    const pageState = inventoryPages.value[selectedInventoryPage.value]
    if (!pageState.slots[index]) return
    const occupied = PUZZLE_TYPES.includes(type)
    pageState.recognized = true
    pageState.slots[index] = {
      ...pageState.slots[index],
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
    const slot = inventoryPages.value[selectedInventoryPage.value].slots[index]
    if (!slot?.occupied) return
    const normalized = normalizePuzzleOrientation(slot.type, orientation)
    inventoryPages.value[selectedInventoryPage.value].slots[index] = {
      ...slot, orientation: normalized, mask: maskForType(slot.type, normalized),
      confidence: 1, corrected: true, uncertain: false
    }
    refreshSourceAssignments()
  }

  function executionPayload() {
    if (!currentSolution.value) return null
    const completed = resumeIndex.value
    const reassigned = assignSourceSlots({ cells: currentSolution.value.cells.slice(completed) }, allSlots.value)
    const planned = currentSolution.value.sourceSlots.map((source, index) => index < completed ? source : reassigned[index - completed])
    const sourceSlots = planned.filter(Boolean).map(source => {
      const page = Number(source.page || 1)
      const slot = inventoryPages.value[page]?.slots[Number(source.row) * 6 + Number(source.column)]
      return {
        page,
        row: source.row,
        column: source.column,
        type: source.type,
        orientation: slot?.orientation ?? 0,
        corrected: Boolean(slot?.corrected)
      }
    })
    return {
      inventoryRegionMetadata: inventoryRegionMetadata.value,
      atlasRegionMetadata: atlasRegionMetadata.value,
      recognition: recognition.value,
      inventoryTabPoints: inventoryTabPoints.value,
      sourceSlots,
      targets: currentSolution.value.cells.map(cell => ({
        index: cell.index, row: cell.row, column: cell.column,
        type: cell.type, mask: cell.mask, orientation: cell.orientation
      })),
      resume: resumeIndex.value > 0
    }
  }

  async function startAutoPlacement(operationDelayMs = 80, adaptiveTiming = true, adaptiveTimeoutMs = 1000) {
    if (!canAutoPlace.value) return { success: false, error: { code: 'ATLAS_NOT_READY', message: '请完成两项区域配置并确认全部来源碎片' } }
    const response = await electronApi.puzzle.startAutoPlacement?.({ ...executionPayload(), operationDelayMs, adaptiveTiming, adaptiveTimeoutMs })
    if (response?.status) execution.value = response
    if (!response?.success && response?.error) error.value = response.error
    if (response?.success) void reportDiagnosticRecovery('puzzle', 'auto_placement')
    else void reportDiagnosticFailure('puzzle', 'auto_placement', response?.error, 'automation_failed')
    return response
  }

  function setRecognitionStrength(strength) {
    recognition.value = normalizePuzzleRecognition({ strength })
    persistRegions()
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
      if (response?.event === 'step-completed' && response.source) {
        const page = Number(response.source.page || 1)
        const index = Number(response.source.row) * 6 + Number(response.source.column)
        const slot = inventoryPages.value[page]?.slots[index]
        if (slot) inventoryPages.value[page].slots[index] = { ...emptySlots(page)[index] }
      }
      onUpdated?.(response)
    }) || (() => {})
  }

  return {
    regionMetadata,
    inventoryRegionMetadata,
    atlasRegionMetadata,
    inventoryTabPoints,
    selectedInventoryPage,
    inventoryPages,
    recognition,
    gridConfidence,
    previews,
    configurationStates,
    slots,
    allSlots,
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
    setRecognitionStrength,
    pickInventoryRegion,
    pickAtlasRegion,
    pickInventoryTabPoint,
    clearRegion,
    clearInventoryPage,
    selectInventoryPage,
    analyze,
    resetAnalysisState,
    applyAnalysis,
    applyAnalysisBatch,
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
