import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '../api/electron.js'
import {
  PUZZLE_TYPES,
  countsFromSlots,
  maskForType,
  solvePuzzle
} from '../domains/puzzle/solver.js'
import {
  normalizePuzzleOrientation,
  normalizePuzzleRegionMetadata,
  normalizePuzzleSettings,
  normalizePuzzleTabPoints,
  validatePuzzleTabPoint
} from '../utils/puzzleConfig.js'
import { BORDER_EDGE_IDS } from '../utils/chartEdgeGeometry.js'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from '../utils/diagnostics.js'
import { OPERATION_DELAY } from '../utils/operationDelay.js'
import { isEmergencyCancellation } from '../utils/emergencyStopResult.js'
import { normalizeVoyageRewardMode } from '../domains/puzzle/voyageRewards.js'

const STORAGE_KEY = 'puzzleSettings'
const SLOT_COUNT = 60

function slotKey(slot) {
  return `${Number(slot?.page)}:${Number(slot?.row)}:${Number(slot?.column)}`
}

function normalizeLockedSlots(value) {
  const unique = new Map()
  for (const candidate of Array.isArray(value) ? value : []) {
    const page = Number(candidate?.page)
    const row = Number(candidate?.row)
    const column = Number(candidate?.column)
    if (![page, row, column].every(Number.isInteger)) continue
    if (![1, 2].includes(page) || row < 0 || row >= 10 || column < 0 || column >= 6) continue
    unique.set(`${page}:${row}:${column}`, { page, row, column })
  }
  return [...unique.values()].sort((left, right) => (
    left.page - right.page || left.row - right.row || left.column - right.column
  ))
}

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
    uncertain: false,
    mods: null
  }))
}

function emptyEdges() {
  return Object.fromEntries(BORDER_EDGE_IDS.map(id => [id, { id, status: 'unknown', mod: null, confidence: 0, rawTexts: [] }]))
}

function normalizeRecognizedMod(value) {
  if (!value || !Array.isArray(value.lines)) return null
  const lines = value.lines.filter(line => typeof line === 'string')
  if (!lines.length) return null
  const mod = { lines }
  if (Number.isFinite(Number(value.tier))) mod.tier = Number(value.tier)
  if (['prefix', 'suffix', 'legendary'].includes(value.affixType)) mod.affixType = value.affixType
  if (Array.isArray(value.tags)) mod.tags = value.tags.filter(tag => typeof tag === 'string')
  return mod
}

function normalizeSlotMods(value) {
  if (!value) return null
  const mod = normalizeRecognizedMod(value.mod)
  const status = value.status === 'unveiled' ? 'unveiled' : value.status === 'matched' && mod ? 'matched' : 'unknown'
  return {
    status,
    mod,
    confidence: Math.max(0, Math.min(1, Number(value.confidence) || 0)),
    rawText: typeof value.rawText === 'string' ? value.rawText.slice(0, 600) : ''
  }
}

function normalizeBorderMods(value) {
  const edges = emptyEdges()
  if (!value || typeof value !== 'object') return edges
  for (const id of BORDER_EDGE_IDS) {
    const entry = value[id]
    if (!entry) continue
    const mod = normalizeRecognizedMod(entry.mod)
    edges[id] = {
      id,
      status: entry.status === 'matched' && mod ? 'matched' : 'unknown',
      mod,
      confidence: Math.max(0, Math.min(1, Number(entry.confidence) || 0)),
      rawTexts: Array.isArray(entry.rawTexts)
        ? entry.rawTexts.filter(line => typeof line === 'string').slice(0, 20).map(line => line.slice(0, 600))
        : []
    }
  }
  return edges
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
  return { score: null, rewardScore: null, rewardDataAvailable: false, strategy: 'balanced', effectiveStrategy: null, totalOptimalCount: 0, solutions: [], truncated: false, error: '' }
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
  if (typeof localStorage === 'undefined') return {
    ...normalizePuzzleSettings(),
    inventoryPages: normalizeInventoryPages(),
    lockedSlots: [],
    edges: emptyEdges(),
    edgesRecognized: false
  }
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const hasStoredEdges = value?.edges && typeof value.edges === 'object' &&
      BORDER_EDGE_IDS.every(id => Object.hasOwn(value.edges, id))
    return {
      ...normalizePuzzleSettings(value),
      inventoryPages: normalizeInventoryPages(value?.inventoryPages),
      lockedSlots: normalizeLockedSlots(value?.lockedSlots),
      edges: normalizeBorderMods(value?.edges),
      edgesRecognized: Boolean(value?.edgesRecognized && hasStoredEdges)
    }
  } catch {
    return {
      ...normalizePuzzleSettings(),
      inventoryPages: normalizeInventoryPages(),
      lockedSlots: [],
      edges: emptyEdges(),
      edgesRecognized: false
    }
  }
}

function normalizeSlots(value, page = 1) {
  const byPosition = new Map((Array.isArray(value) ? value : []).map(slot => [`${slot.row}:${slot.column}`, slot]))
  return emptySlots(page).map(fallback => {
    const slot = byPosition.get(`${fallback.row}:${fallback.column}`)
    const occupied = Boolean(slot?.occupied && PUZZLE_TYPES.includes(slot.type))
    const orientation = occupied ? normalizePuzzleOrientation(slot.type, slot?.orientation) : 0
    return {
      page,
      row: fallback.row,
      column: fallback.column,
      occupied,
      type: occupied ? slot.type : null,
      orientation,
      mask: occupied ? maskForType(slot.type, orientation) : 0,
      confidence: Math.max(0, Math.min(1, Number(slot?.confidence) || 0)),
      calibrated: Boolean(slot?.calibrated),
      calibrationSimilarity: Math.max(0, Math.min(1, Number(slot?.calibrationSimilarity) || 0)),
      corrected: Boolean(slot?.corrected),
      uncertain: Boolean(slot?.uncertain),
      mods: occupied ? normalizeSlotMods(slot?.mods) : null
    }
  })
}

function normalizeInventoryPage(value, page) {
  if (!value || value.recognized !== true || !Array.isArray(value.slots)) return emptyInventoryPage(page)
  const gridConfidence = value.gridConfidence == null ? null : Number(value.gridConfidence)
  return {
    page,
    recognized: true,
    slots: normalizeSlots(value.slots, page),
    warnings: Array.isArray(value.warnings)
      ? value.warnings.flatMap(warning => typeof warning === 'string'
        ? [warning.slice(0, 300)]
        : typeof warning?.message === 'string' ? [{ message: warning.message.slice(0, 300) }] : []).slice(0, SLOT_COUNT)
      : [],
    gridConfidence: Number.isFinite(gridConfidence) ? Math.max(0, Math.min(1, gridConfidence)) : null
  }
}

function normalizeInventoryPages(value = {}) {
  return Object.fromEntries([1, 2].map(page => [page, normalizeInventoryPage(value?.[page] ?? value?.[String(page)], page)]))
}

export const usePuzzleStore = defineStore('puzzle', () => {
  const loaded = loadSettings()
  const inventoryRegionMetadata = ref(loaded.inventoryRegionMetadata)
  const atlasRegionMetadata = ref(loaded.atlasRegionMetadata)
  const regionMetadata = inventoryRegionMetadata
  const inventoryTabPoints = ref(normalizePuzzleTabPoints(loaded.inventoryTabPoints))
  const autoProbeBorderMods = ref(loaded.autoProbeBorderMods !== false)
  const rewardStrategy = ref(loaded.rewardStrategy || 'balanced')
  const selectedInventoryPage = ref(1)
  const inventoryPages = ref(loaded.inventoryPages)
  const lockedSlots = ref(normalizeLockedSlots(loaded.lockedSlots))
  const calibrationSamples = ref([])
  const captureCells = ref({})
  const pendingCorrections = ref({})
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
  const lockedSlotKeys = computed(() => new Set(lockedSlots.value.map(slotKey)))
  const availableSlots = computed(() => allSlots.value.filter(slot => !lockedSlotKeys.value.has(slotKey(slot))))
  const requiredExits = ref([])
  const forbiddenExits = ref([])
  const edges = ref(loaded.edges)
  const edgesRecognized = ref(loaded.edgesRecognized)
  const probingBorder = ref(false)
  const analysisProgress = ref({ stage: null, index: 0, total: 0 })
  const solutionIndex = ref(0)
  const solving = ref(false)
  const analyzing = ref(false)
  const error = ref(null)
  const result = ref(emptyResult())
  const execution = ref({ status: 'idle', currentIndex: -1, total: 9, completed: 0, reason: '', error: null })
  let regionClearGeneration = 0
  let solveRequestId = 0
  let activeSolve = null

  const counts = computed(() => countsFromSlots(availableSlots.value))
  const currentSolution = computed(() => result.value.solutions[solutionIndex.value] || null)
  const currentSourceSlots = computed(() => currentSolution.value?.sourceSlots || [])
  const hasInventory = computed(() => availableSlots.value.some(slot => slot.occupied))
  const lockedCount = computed(() => lockedSlots.value.length)
  const occupiedCount = computed(() => PUZZLE_TYPES.reduce((sum, type) => sum + counts.value[type], 0))
  const hasExitConstraints = computed(() => Boolean(requiredExits.value.length || forbiddenExits.value.length))
  const executing = computed(() => ['validating', 'running'].includes(execution.value.status))
  const resumeIndex = computed(() => (
    ['error', 'stopped'].includes(execution.value.status) && execution.value.completed > 0 && execution.value.completed < 9
      ? Number(execution.value.completed)
      : 0
  ))
  const remainingSourceSlots = computed(() => currentSolution.value
    ? currentSolution.value.sourceSlots.slice(resumeIndex.value)
    : [])
  const autoPlaceBlockedReason = computed(() => {
    if (executing.value) return '海图自动放入正在执行'
    if (analyzing.value) return '海图识别正在进行'
    if (probingBorder.value) return '边缘词缀识别正在进行'
    if (solving.value) return '正在按最新仓库状态计算方案'
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
    if (remainingSourceSlots.value.some(source => lockedSlotKeys.value.has(slotKey(source)))) return '方案来源包含已锁定格，请重新计算'
    const missingTabPage = [...new Set(remainingSourceSlots.value.map(source => Number(source.page || 1)))]
      .find(page => !validatePuzzleTabPoint(inventoryTabPoints.value[page], inventoryRegionMetadata.value, page, inventoryTabPoints.value[page === 1 ? 2 : 1]).valid)
    if (missingTabPage) return `请先标定第 ${missingTabPage} 页仓库页签坐标`
    return ''
  })
  const canAutoPlace = computed(() => !autoPlaceBlockedReason.value)
  const pendingCorrectionCount = computed(() => Object.keys(pendingCorrections.value).length)
  const savableCorrectionCount = computed(() => Object.keys(pendingCorrections.value)
    .filter(key => captureCells.value[key]?.tileDataUrl).length)

  function persistRegions() {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      regionMetadata: inventoryRegionMetadata.value,
      inventoryRegionMetadata: inventoryRegionMetadata.value,
      atlasRegionMetadata: atlasRegionMetadata.value,
      inventoryTabPoints: inventoryTabPoints.value,
      autoProbeBorderMods: autoProbeBorderMods.value,
      rewardStrategy: rewardStrategy.value,
      inventoryPages: inventoryPages.value,
      lockedSlots: lockedSlots.value,
      edges: edges.value,
      edgesRecognized: edgesRecognized.value
    }))
  }
  persistRegions()
  if ([1, 2].some(page => inventoryPages.value[page].recognized)) void recompute()

  function invalidatePendingSolve() {
    solveRequestId += 1
    activeSolve?.cancel()
    activeSolve = null
    solving.value = false
  }

  function solveWithWorker(requestId, input) {
    if (typeof Worker !== 'function') return Promise.resolve(solvePuzzle(input))
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../domains/puzzle/solverWorker.js', import.meta.url), { type: 'module' })
      let settled = false
      const finish = (callback, value) => {
        if (settled) return
        settled = true
        worker.terminate()
        if (activeSolve?.requestId === requestId) activeSolve = null
        callback(value)
      }
      activeSolve = {
        requestId,
        cancel: () => finish(resolve, null)
      }
      worker.onmessage = ({ data }) => {
        if (Number(data?.requestId) !== requestId) return
        if (data?.error) finish(reject, new Error(data.error))
        else finish(resolve, data?.result || null)
      }
      worker.onerror = event => finish(reject, new Error(event?.message || '海图求解 Worker 运行失败'))
      try {
        worker.postMessage({ requestId, input })
      } catch (caught) {
        finish(reject, caught)
      }
    })
  }

  async function recompute() {
    if (executing.value) {
      invalidatePendingSolve()
      return null
    }
    const requestId = ++solveRequestId
    activeSolve?.cancel()
    activeSolve = null
    solving.value = true
    try {
      // 先绘制 loading，再把可序列化快照交给 Worker；Node 测试环境走同步适配。
      await waitForNextPaint()
      if (requestId !== solveRequestId || executing.value) return null
      const input = JSON.parse(JSON.stringify({
        counts: counts.value,
        slots: availableSlots.value,
        edges: edges.value,
        strategy: rewardStrategy.value,
        requiredExits: requiredExits.value,
        forbiddenExits: forbiddenExits.value,
        solutionLimit: 100
      }))
      const solved = await solveWithWorker(requestId, input)
      if (!solved || requestId !== solveRequestId || executing.value) return null
      result.value = solved
      if (error.value?.code === 'PUZZLE_SOLVER_FAILED') error.value = null
      solutionIndex.value = Math.min(solutionIndex.value, Math.max(0, result.value.solutions.length - 1))
      return solved
    } catch (caught) {
      if (requestId !== solveRequestId) return null
      result.value = emptyResult()
      error.value = { code: 'PUZZLE_SOLVER_FAILED', message: caught?.message || '海图方案计算失败' }
      return null
    } finally {
      if (requestId === solveRequestId) solving.value = false
    }
  }

  async function loadConfiguration() {
    const [response, samples] = await Promise.all([
      electronApi.puzzle.getConfiguration?.({
        inventoryRegionMetadata: inventoryRegionMetadata.value,
        atlasRegionMetadata: atlasRegionMetadata.value
      }),
      electronApi.puzzle.listCalibration?.()
    ])
    if (Array.isArray(samples)) calibrationSamples.value = samples
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
    if (response?.success === false || response?.error) {
      const failure = response?.error
      error.value = typeof failure === 'object' && failure
        ? failure
        : { code: 'REGION_CAPTURE_FAILED', message: String(failure || '框选区域失败') }
      void reportDiagnosticFailure('puzzle', 'region_capture', error.value, 'screen_capture_failed', error.value.details)
      return { success: false, error: error.value }
    }
    const normalized = normalizePuzzleRegionMetadata(response)
    if (!normalized) {
      error.value = { code: 'REGION_INVALID', message: '框选区域无效，请重新框选完整仓库' }
      return { success: false, error: error.value }
    }
    if (type === 'atlas') {
      atlasRegionMetadata.value = normalized
      resetBorderAnalysisState()
      void recompute()
    } else {
      inventoryRegionMetadata.value = normalized
      inventoryTabPoints.value = normalizePuzzleTabPoints()
      regionClearGeneration += 1
      resetInventoryAnalysisState()
    }
    if (response.previewDataUrl) previews.value[type] = response.previewDataUrl
    persistRegions()
    await loadConfiguration()
    void reportDiagnosticRecovery('puzzle', 'region_capture')
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
      resetBorderAnalysisState()
      void recompute()
    } else {
      inventoryRegionMetadata.value = null
      inventoryTabPoints.value = normalizePuzzleTabPoints()
      regionClearGeneration += 1
      resetInventoryAnalysisState()
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

  function applyAnalysis(response, { resetConstraints = false } = {}) {
    if (!response?.success) {
      error.value = response?.error || { code: 'PUZZLE_ANALYSIS_FAILED', message: '海图识别失败' }
      void reportDiagnosticFailure('puzzle', 'analysis', error.value, 'unknown_failure')
      return false
    }
    if (!Array.isArray(response.slots)) {
      error.value = { code: 'INVENTORY_PAGE_INCOMPLETE', message: '识别结果不完整，已保留原仓库结果' }
      return false
    }
    const page = [1, 2].includes(Number(response.page)) ? Number(response.page) : selectedInventoryPage.value
    const incomingSlots = normalizeSlots(response.slots, page)
    for (const slot of incomingSlots) {
      const probed = response.fragmentMods?.[`${page}:${slot.row}:${slot.column}`]
      slot.mods = probed ? normalizeSlotMods(probed) : null
    }
    const otherPage = page === 1 ? 2 : 1
    if (inventoryPages.value[otherPage].recognized && slotSignature(incomingSlots) === slotSignature(inventoryPages.value[otherPage].slots)) {
      error.value = { code: 'DUPLICATE_INVENTORY_PAGE', message: `第 ${page} 页与第 ${otherPage} 页识别结果完全相同，请确认游戏仓库页已经切换` }
      return false
    }
    rememberCaptureCells(page, response.slots)
    inventoryPages.value[page] = {
      page,
      recognized: true,
      slots: incomingSlots,
      gridConfidence: Number.isFinite(Number(response.gridConfidence)) ? Math.max(0, Math.min(1, Number(response.gridConfidence))) : 1,
      warnings: Array.isArray(response.warnings) ? response.warnings : []
    }
    if (response.regionMetadata) {
      inventoryRegionMetadata.value = normalizePuzzleRegionMetadata(response.regionMetadata) || inventoryRegionMetadata.value
    }
    applyBorderMods(response.borderMods)
    persistRegions()
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

  function applyAnalysisBatch(response, { resetConstraints = false } = {}) {
    if (!response?.success) {
      error.value = response?.error || { code: 'PUZZLE_ANALYSIS_FAILED', message: '海图双页识别失败' }
      void reportDiagnosticFailure('puzzle', 'analysis', error.value, 'unknown_failure')
      return false
    }
    const responses = Array.isArray(response.pages) ? response.pages : []
    const byPage = new Map(responses.map(item => [Number(item?.page), item]))
    if (!byPage.has(1) || !byPage.has(2) || [1, 2].some(page => byPage.get(page)?.success === false || !Array.isArray(byPage.get(page)?.slots))) {
      error.value = { code: 'INVENTORY_PAGES_INCOMPLETE', message: '双页识别结果不完整，已保留原仓库结果' }
      return false
    }
    const nextPages = Object.fromEntries([1, 2].map(page => {
      const pageResponse = byPage.get(page)
      const slots = normalizeSlots(pageResponse.slots, page)
      if (response.fragmentMods) {
        for (const slot of slots) {
          slot.mods = normalizeSlotMods(response.fragmentMods[`${page}:${slot.row}:${slot.column}`])
        }
      }
      return [page, {
        page,
        recognized: true,
        slots,
        gridConfidence: Number.isFinite(Number(pageResponse.gridConfidence)) ? Math.max(0, Math.min(1, Number(pageResponse.gridConfidence))) : 1,
        warnings: Array.isArray(pageResponse.warnings) ? pageResponse.warnings : []
      }]
    }))
    if (slotSignature(nextPages[1].slots) === slotSignature(nextPages[2].slots)) {
      error.value = { code: 'DUPLICATE_INVENTORY_PAGE', message: '第 1 页与第 2 页识别结果完全相同，请检查两个页签标定是否正确' }
      return false
    }
    for (const page of [1, 2]) rememberCaptureCells(page, byPage.get(page).slots)
    if (response.regionMetadata) {
      inventoryRegionMetadata.value = normalizePuzzleRegionMetadata(response.regionMetadata) || inventoryRegionMetadata.value
    }
    inventoryPages.value = nextPages
    applyBorderMods(response.borderMods)
    persistRegions()
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

  function applyBorderMods(borderMods) {
    if (!borderMods || typeof borderMods !== 'object') return
    const hasBorderResults = BORDER_EDGE_IDS.some(id => Object.hasOwn(borderMods, id))
    edges.value = hasBorderResults ? normalizeBorderMods(borderMods) : emptyEdges()
    edgesRecognized.value = hasBorderResults
  }

  function captureCellKey(page, row, column) {
    return `${Number(page)}:${Number(row)}:${Number(column)}`
  }

  function rememberCaptureCells(page, rawSlots) {
    const prefix = `${Number(page)}:`
    const retained = Object.fromEntries(Object.entries(captureCells.value).filter(([key]) => !key.startsWith(prefix)))
    for (const slot of rawSlots || []) {
      const key = captureCellKey(page, slot.row, slot.column)
      retained[key] = {
        tileDataUrl: typeof slot.tileDataUrl === 'string' ? slot.tileDataUrl : '',
        featureVector: Array.isArray(slot.calibrationFeature) ? slot.calibrationFeature : [],
        featureVersion: Number(slot.featureVersion) || 0
      }
    }
    captureCells.value = retained
    pendingCorrections.value = Object.fromEntries(Object.entries(pendingCorrections.value)
      .filter(([key]) => !key.startsWith(prefix)))
  }

  function resetInventoryAnalysisState() {
    invalidatePendingSolve()
    inventoryPages.value = { 1: emptyInventoryPage(1), 2: emptyInventoryPage(2) }
    requiredExits.value = []
    forbiddenExits.value = []
    analysisProgress.value = { stage: null, index: 0, total: 0 }
    solutionIndex.value = 0
    result.value = emptyResult()
    execution.value = { status: 'idle', currentIndex: -1, total: 9, completed: 0, reason: '', error: null }
    error.value = null
    captureCells.value = {}
    pendingCorrections.value = {}
  }

  function resetBorderAnalysisState() {
    edges.value = emptyEdges()
    edgesRecognized.value = false
  }

  function resetAnalysisState() {
    resetInventoryAnalysisState()
    resetBorderAnalysisState()
    persistRegions()
  }

  async function analyze({ page = null } = {}) {
    if (!inventoryRegionMetadata.value) {
      error.value = { code: 'REGION_REQUIRED', message: '请先框选完整的 6×10 碎片仓库区域' }
      return { success: false, error: error.value }
    }
    if (analyzing.value) {
      return { success: false, error: { code: 'ANALYSIS_BUSY', message: '海图识别正在进行，请稍候' } }
    }
    analyzing.value = true
    error.value = null
    analysisProgress.value = { stage: null, index: 0, total: 0 }
    const clearGeneration = regionClearGeneration
    try {
      const response = await electronApi.puzzle.analyze({
        regionMetadata: inventoryRegionMetadata.value,
        inventoryTabPoints: inventoryTabPoints.value,
        page,
        resetExecution: true,
        probeMods: true
      })
      if (regionClearGeneration !== clearGeneration) {
        return { success: false, error: { code: 'REGION_CLEARED', message: '识别期间已清空碎片仓库，本次结果已忽略' } }
      }
      if (isEmergencyCancellation(response)) return response
      const applied = Array.isArray(response?.pages)
        ? applyAnalysisBatch(response)
        : applyAnalysis(response)
      return applied ? response : { success: false, error: error.value, page }
    } catch (caught) {
      error.value = { code: 'PUZZLE_ANALYSIS_FAILED', message: caught?.message || String(caught) }
      void reportDiagnosticFailure('puzzle', 'analysis', caught, 'unknown_failure')
      return { success: false, error: error.value }
    } finally {
      analyzing.value = false
    }
  }

  async function completeCurrentChart() {
    if (executing.value || analyzing.value || probingBorder.value || solving.value) {
      return { success: false, error: { code: 'PUZZLE_BUSY', message: '海图任务进行中，暂不能完成当前海图' } }
    }
    if (!currentSolution.value) {
      return { success: false, error: { code: 'NO_SOLUTION', message: '请先识别碎片并生成海图方案' } }
    }
    if (currentSolution.value.sourceSlots.some(source => isSlotLocked(source))) {
      return { success: false, error: { code: 'INVENTORY_CHANGED', message: '方案来源包含已锁定格，请重新计算后再完成当前海图' } }
    }
    const changedSlot = currentSolution.value.sourceSlots.find(source => {
      const slot = inventoryPages.value[Number(source.page || 1)]?.slots[Number(source.row) * 6 + Number(source.column)]
      return slot?.occupied && slot.type !== source.type
    })
    if (changedSlot) {
      return { success: false, error: { code: 'INVENTORY_CHANGED', message: '仓库内容已变化，请重新识别后再完成当前海图' } }
    }
    for (const source of currentSolution.value.sourceSlots) {
      const page = Number(source.page || 1)
      const index = Number(source.row) * 6 + Number(source.column)
      if (inventoryPages.value[page]?.slots[index]) {
        inventoryPages.value[page].slots[index] = { ...emptySlots(page)[index] }
      }
    }
    requiredExits.value = []
    forbiddenExits.value = []
    execution.value = { status: 'idle', currentIndex: -1, total: 9, completed: 0, reason: '', error: null }
    solutionIndex.value = 0
    edges.value = emptyEdges()
    edgesRecognized.value = false
    result.value = emptyResult()
    persistRegions()
    await recompute()
    try {
      await electronApi.puzzle.completeChart?.()
    } catch {
      // 主进程执行状态同步失败不影响本地完成结果
    }
    let borderProbe = null
    let borderMods = null
    if (autoProbeBorderMods.value) {
      const probeResponse = await probeBorderMods()
      if (isEmergencyCancellation(probeResponse)) return probeResponse
      borderProbe = probeResponse?.borderProbe || null
      borderMods = probeResponse?.borderMods || null
    }
    return { success: true, borderProbe, borderMods }
  }

  async function probeBorderMods() {
    if (probingBorder.value || executing.value || analyzing.value || resumeIndex.value > 0) {
      return { success: false, error: { code: 'PUZZLE_BUSY', message: '海图任务进行中，暂不能识别边缘词缀' } }
    }
    probingBorder.value = true
    try {
      const response = await electronApi.puzzle.probeBorderMods?.({
        atlasRegionMetadata: atlasRegionMetadata.value
      })
      if (isEmergencyCancellation(response)) return response
      if (!response?.success) {
        if (response?.error) error.value = response.error
        return response || { success: false }
      }
      if (response.borderMods) {
        applyBorderMods(response.borderMods)
        persistRegions()
      }
      error.value = null
      await recompute()
      return response
    } catch (caught) {
      error.value = { code: 'BORDER_PROBE_FAILED', message: caught?.message || String(caught) }
      return { success: false, error: error.value }
    } finally {
      probingBorder.value = false
    }
  }

  function setAutoProbeBorderMods(enabled) {
    autoProbeBorderMods.value = Boolean(enabled)
    persistRegions()
  }

  function setRewardStrategy(strategy) {
    if (resumeIndex.value > 0) return false
    rewardStrategy.value = normalizeVoyageRewardMode(strategy)
    persistRegions()
    solutionIndex.value = 0
    void recompute()
    return true
  }

  function selectInventoryPage(page) {
    const normalized = Number(page)
    if ([1, 2].includes(normalized)) selectedInventoryPage.value = normalized
  }

  async function clearInventoryPage(page = selectedInventoryPage.value) {
    if (executing.value) return { success: false, error: { code: 'PUZZLE_BUSY', message: '海图自动放入进行中，暂不能清空页面' } }
    const normalized = [1, 2].includes(Number(page)) ? Number(page) : selectedInventoryPage.value
    inventoryPages.value[normalized] = emptyInventoryPage(normalized)
    const prefix = `${normalized}:`
    captureCells.value = Object.fromEntries(Object.entries(captureCells.value).filter(([key]) => !key.startsWith(prefix)))
    pendingCorrections.value = Object.fromEntries(Object.entries(pendingCorrections.value).filter(([key]) => !key.startsWith(prefix)))
    solutionIndex.value = 0
    error.value = null
    persistRegions()
    await recompute()
    return { success: true, page: normalized }
  }

  async function clearInventoryPages() {
    if (executing.value) return { success: false, error: { code: 'PUZZLE_BUSY', message: '海图自动放入进行中，暂不能清空页面' } }
    inventoryPages.value = { 1: emptyInventoryPage(1), 2: emptyInventoryPage(2) }
    captureCells.value = {}
    pendingCorrections.value = {}
    solutionIndex.value = 0
    error.value = null
    persistRegions()
    await recompute()
    return { success: true, pages: [1, 2] }
  }

  async function pickInventoryTabPoint(page) {
    const normalized = Number(page)
    if (![1, 2].includes(normalized)) return { success: false, error: { code: 'TAB_PAGE_INVALID', message: '仓库页码无效' } }
    if (!inventoryRegionMetadata.value) return { success: false, error: { code: 'REGION_REQUIRED', message: '请先框选碎片仓库区域' } }
    const response = await electronApi.puzzle.pickInventoryTabPoint?.(normalized)
    if (!response || response.canceled) return response || { canceled: true }
    if (response.success === false) {
      error.value = response.error || { code: 'PICKER_FAILED', message: '坐标选取失败' }
      return { success: false, error: error.value }
    }
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
      calibrated: false,
      calibrationSimilarity: 0,
      corrected: true,
      uncertain: false,
      mods: occupied ? pageState.slots[index].mods : null
    }
    const correctionKey = captureCellKey(selectedInventoryPage.value, row, column)
    pendingCorrections.value = { ...pendingCorrections.value, [correctionKey]: true }
    solutionIndex.value = 0
    persistRegions()
    recompute()
  }

  function updateSlotOrientation(row, column, orientation) {
    const index = Number(row) * 6 + Number(column)
    const slot = inventoryPages.value[selectedInventoryPage.value].slots[index]
    if (!slot?.occupied) return
    const normalized = normalizePuzzleOrientation(slot.type, orientation)
    inventoryPages.value[selectedInventoryPage.value].slots[index] = {
      ...slot, orientation: normalized, mask: maskForType(slot.type, normalized),
      confidence: 1, calibrated: false, calibrationSimilarity: 0, corrected: true, uncertain: false
    }
    const correctionKey = captureCellKey(selectedInventoryPage.value, row, column)
    pendingCorrections.value = { ...pendingCorrections.value, [correctionKey]: true }
    persistRegions()
    void recompute()
  }

  function isSlotLocked(slot) {
    return lockedSlotKeys.value.has(slotKey({
      page: Number(slot?.page || selectedInventoryPage.value),
      row: slot?.row,
      column: slot?.column
    }))
  }

  function toggleSlotLock(slot) {
    if (executing.value || resumeIndex.value > 0) return false
    const candidate = normalizeLockedSlots([{
      page: Number(slot?.page || selectedInventoryPage.value),
      row: Number(slot?.row),
      column: Number(slot?.column)
    }])[0]
    if (!candidate) return false
    const key = slotKey(candidate)
    lockedSlots.value = lockedSlotKeys.value.has(key)
      ? lockedSlots.value.filter(item => slotKey(item) !== key)
      : normalizeLockedSlots([...lockedSlots.value, candidate])
    solutionIndex.value = 0
    persistRegions()
    void recompute()
    return true
  }

  function executionPayload() {
    if (!currentSolution.value) return null
    const sourceSlots = currentSolution.value.sourceSlots.map(source => {
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
      inventoryTabPoints: inventoryTabPoints.value,
      sourceSlots,
      targets: currentSolution.value.cells.map(cell => ({
        index: cell.index, row: cell.row, column: cell.column,
        type: cell.type, mask: cell.mask, orientation: cell.orientation
      })),
      resume: resumeIndex.value > 0
    }
  }

  function applyExecutionState(response) {
    if (!response?.status) return
    const changed = ['status', 'currentIndex', 'completed', 'reason']
      .some(key => response[key] !== execution.value[key])
    execution.value = response
    if (changed) invalidatePendingSolve()
  }

  async function startAutoPlacement(timing = { operationDelayMs: OPERATION_DELAY.default }) {
    if (!canAutoPlace.value) return { success: false, error: { code: 'ATLAS_NOT_READY', message: '请完成两项区域配置并确认全部来源碎片' } }
    const response = await electronApi.puzzle.startAutoPlacement?.({ ...executionPayload(), ...timing })
    applyExecutionState(response)
    if (!response?.success && response?.error) error.value = response.error
    if (response?.success) void reportDiagnosticRecovery('puzzle', 'auto_placement')
    else void reportDiagnosticFailure('puzzle', 'auto_placement', response?.error, 'automation_failed')
    return response
  }

  async function savePendingCorrections() {
    const items = Object.keys(pendingCorrections.value).flatMap(key => {
      const [page, row, column] = key.split(':').map(Number)
      const capture = captureCells.value[key]
      const slot = inventoryPages.value[page]?.slots[row * 6 + column]
      if (!capture?.tileDataUrl || !slot) return []
      return [{ ...capture, page, row, column, labelMask: Number(slot.mask || 0) }]
    })
    if (!items.length) throw new Error('当前修正缺少截图图块，请重新识别后再保存')
    calibrationSamples.value = await electronApi.puzzle.saveCalibration(items)
    const saved = new Set(items.map(item => captureCellKey(item.page, item.row, item.column)))
    pendingCorrections.value = Object.fromEntries(Object.entries(pendingCorrections.value)
      .filter(([key]) => !saved.has(key)))
    return items.length
  }

  async function removeCalibration(id) {
    calibrationSamples.value = await electronApi.puzzle.removeCalibration(id)
    return calibrationSamples.value
  }

  async function resetCalibration() {
    calibrationSamples.value = await electronApi.puzzle.resetCalibration()
    return calibrationSamples.value
  }

  async function stopAutoPlacement(reason = 'user') {
    const response = await electronApi.puzzle.stopAutoPlacement?.(reason)
    applyExecutionState(response)
    return response
  }

  async function refreshExecutionStatus() {
    const response = await electronApi.puzzle.getAutoPlacementStatus?.()
    applyExecutionState(response)
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
    return electronApi.puzzle.onAnalysisUpdated(response => {
      if (response?.event === 'mods-progress') {
        analysisProgress.value = {
          stage: response.stage || null,
          index: Number(response.index) || 0,
          total: Number(response.total) || 0
        }
      }
      onUpdated?.(response)
    })
  }

  function listenExecution(onUpdated) {
    return electronApi.puzzle.onAutoPlacementUpdated?.(response => {
      applyExecutionState(response)
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
    lockedSlots,
    calibrationSamples,
    pendingCorrections,
    pendingCorrectionCount,
    savableCorrectionCount,
    gridConfidence,
    previews,
    configurationStates,
    slots,
    allSlots,
    availableSlots,
    warnings,
    requiredExits,
    forbiddenExits,
    edges,
    edgesRecognized,
    probingBorder,
    autoProbeBorderMods,
    rewardStrategy,
    analysisProgress,
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
    lockedCount,
    hasInventory,
    executing,
    canAutoPlace,
    autoPlaceBlockedReason,
    loadConfiguration,
    savePendingCorrections,
    removeCalibration,
    resetCalibration,
    pickInventoryRegion,
    pickAtlasRegion,
    pickInventoryTabPoint,
    clearRegion,
    clearInventoryPage,
    clearInventoryPages,
    selectInventoryPage,
    analyze,
    resetAnalysisState,
    applyAnalysis,
    applyAnalysisBatch,
    updateSlot,
    updateSlotOrientation,
    isSlotLocked,
    toggleSlotLock,
    toggleRequiredExit,
    toggleForbiddenExit,
    clearExitConstraints,
    previousSolution,
    nextSolution,
    recompute,
    startAutoPlacement,
    stopAutoPlacement,
    completeCurrentChart,
    probeBorderMods,
    setAutoProbeBorderMods,
    setRewardStrategy,
    refreshExecutionStatus,
    listen,
    listenExecution
  }
})
