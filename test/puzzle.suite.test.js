import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { createPinia as _m0_createPinia, setActivePinia as _m0_setActivePinia } from 'pinia'
import { usePuzzleStore as _m0_usePuzzleStore } from '../src/stores/puzzle.js'
import { electronApi as _m0_electronApi } from '../src/api/electron.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { existsSync as _m1_existsSync, mkdtempSync as _m1_mkdtempSync, readFileSync as _m1_readFileSync, rmSync as _m1_rmSync, writeFileSync as _m1_writeFileSync } from 'node:fs'
import { tmpdir as _m1_tmpdir } from 'node:os'
import _m1_path from 'node:path'
import { PuzzleCalibrationRepository as _m1_PuzzleCalibrationRepository, PUZZLE_CALIBRATION_FEATURE_LENGTH as _m1_PUZZLE_CALIBRATION_FEATURE_LENGTH, PUZZLE_CALIBRATION_FEATURE_VERSION as _m1_PUZZLE_CALIBRATION_FEATURE_VERSION, PUZZLE_CALIBRATION_SCHEMA_VERSION as _m1_PUZZLE_CALIBRATION_SCHEMA_VERSION } from '../electron/modules/puzzle/calibrationRepository.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { counterClockwiseTurns as _m2_counterClockwiseTurns, gridCellCenter as _m2_gridCellCenter, normalizePuzzleTabPoints as _m2_normalizePuzzleTabPoints, normalizePuzzleOrientation as _m2_normalizePuzzleOrientation, normalizePuzzleSettings as _m2_normalizePuzzleSettings, validatePuzzleTabPoint as _m2_validatePuzzleTabPoint, validatePuzzleRegionEnvironment as _m2_validatePuzzleRegionEnvironment } from '../src/utils/puzzleConfig.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { createHash as _m3_createHash, randomUUID as _m3_randomUUID } from 'node:crypto'
import { mkdtemp as _m3_mkdtemp, mkdir as _m3_mkdir, readdir as _m3_readdir, writeFile as _m3_writeFile } from 'node:fs/promises'
import _m3_os from 'node:os'
import _m3_path from 'node:path'
import { PUZZLE_FAILURE_EVIDENCE_RETENTION_MS as _m3_PUZZLE_FAILURE_EVIDENCE_RETENTION_MS, PuzzleFailureEvidenceRepository as _m3_PuzzleFailureEvidenceRepository, validatePuzzleFailureEvidenceManifest as _m3_validatePuzzleFailureEvidenceManifest } from '../electron/modules/puzzle/failureEvidenceRepository.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { PuzzleFailureEvidenceSession as _m4_PuzzleFailureEvidenceSession } from '../electron/modules/puzzle/failureEvidenceSession.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { readFileSync as _m5_readFileSync } from 'node:fs'
import { CHART_SHAPES as _m5_CHART_SHAPES, chartShapeAliasesByPuzzleType as _m5_chartShapeAliasesByPuzzleType, parseCopiedChartFragment as _m5_parseCopiedChartFragment } from '../electron/modules/priceCheck/chartRegions.js'
import { finalizeInventoryAnalysisResult as _m5_finalizeInventoryAnalysisResult, resolveFragmentCopy as _m5_resolveFragmentCopy } from '../electron/modules/puzzle/fragmentRecognition.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { readFileSync as _m6_readFileSync } from 'node:fs'
import { createPinia as _m6_createPinia, setActivePinia as _m6_setActivePinia } from 'pinia'
import { usePuzzleStore as _m6_usePuzzleStore } from '../src/stores/puzzle.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { readFileSync as _m7_readFileSync } from 'node:fs'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { createPinia as _m8_createPinia, setActivePinia as _m8_setActivePinia } from 'pinia'
import { electronApi as _m8_electronApi } from '../src/api/electron.js'
import { usePuzzleStore as _m8_usePuzzleStore } from '../src/stores/puzzle.js'

// === Merged from puzzleAutomaticMods.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const createPinia = _m0_createPinia
  const setActivePinia = _m0_setActivePinia
  const usePuzzleStore = _m0_usePuzzleStore
  const electronApi = _m0_electronApi
const matched = { status: 'matched', mod: { lines: ['词缀'] }, confidence: 1 }
test('自动识别保留未知形状词缀，校准及重启不丢失', async t => {
  const originalStorage = globalThis.localStorage
  const originalSave = electronApi.puzzle.saveCalibration
  let data = null
  globalThis.localStorage = { getItem: () => data, setItem: (_, value) => { data = value } }
  electronApi.puzzle.saveCalibration = async () => []
  t.after(() => { globalThis.localStorage = originalStorage; electronApi.puzzle.saveCalibration = originalSave })
  setActivePinia(createPinia())
  const store = usePuzzleStore()
  store.applyAnalysis({ success: true, page: 1, slots: [{ row: 0, column: 0, candidate: true,
    uncertain: true, typeSource: 'copy-unknown', mods: matched,
    tileDataUrl: 'data:image/png;base64,test', calibrationFeature: Array(128).fill(0.1), featureVersion: 2 }] })
  await store.saveCalibrationItem('1:0:0', { type: 'tee', orientation: 270 })
  setActivePinia(createPinia())
  assert.equal(usePuzzleStore().inventoryPages[1].slots[0].mods.status, 'matched')
})

const source = readFileSync(new URL('../electron/modules/puzzle/service.js', import.meta.url), 'utf8')
const method = source.slice(source.indexOf('  async probeFragmentMods('), source.indexOf('  // 无锁的边缘 OCR'))
const createProbe = new Function('gridCellCenter', 'unknownFragmentMod', 'MOD_PROBE_OWNER',
  'finalizeInventoryAnalysisResult', 'resolveFragmentCopy', 'matchFragmentMods', `return ({${method}}).probeFragmentMods`)
const probe = createProbe(() => ({ x: 0, y: 0 }), () => ({ status: 'unknown' }), 'probe', () => {},
  (slot, text) => ({ ...slot, type: text.includes('shape') ? 'tee' : null }),
  lines => lines.join('').includes('mod') ? matched : { status: 'unknown' })

for (const retryFails of [false, true]) test(`自动阶段只重试未知词缀，保留首次形状；重试异常=${retryFails}`, async () => {
  const slots = [{ candidate: true, row: 0, column: 0 }, { candidate: true, row: 0, column: 1 }]
  let calls = 0
  const service = {
    stopGeneration: 0, emptyProbeStats: () => ({ matched: 0, unknown: 0, unveiled: 0 }),
    assertCurrentGeneration(value) { assert.equal(value, this.stopGeneration) },
    async runProbe(config) {
      calls++
      if (calls === 1) return { success: true, texts: { '1:0:0': 'shape', '1:0:1': 'mod' } }
      assert.deepEqual(config.pages[0].cells.map(cell => cell.key), ['1:0:0'])
      if (retryFails) throw new Error('复制失败')
      return { success: true, texts: { '1:0:0': 'mod' } }
    }
  }
  const response = await probe.call(service, { inventoryMetadata: { selectedRegion: {} },
    tabPoints: {}, analysisResults: [{ page: 1, slots }] })
  assert.equal(calls, 2)
  assert.equal(slots[0].type, 'tee')
  assert.equal(slots[1].type, null)
  assert.equal(response.fragmentMods['1:0:1'].status, 'matched')
  assert.equal(response.fragmentMods['1:0:0'].status, retryFails ? 'unknown' : 'matched')
  assert.equal(response.fragmentProbe.matched, retryFails ? 1 : 2)
})
})()

// === Merged from puzzleCalibrationRepository.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const existsSync = _m1_existsSync
  const mkdtempSync = _m1_mkdtempSync
  const readFileSync = _m1_readFileSync
  const rmSync = _m1_rmSync
  const writeFileSync = _m1_writeFileSync
  const tmpdir = _m1_tmpdir
  const path = _m1_path
  const PuzzleCalibrationRepository = _m1_PuzzleCalibrationRepository
  const PUZZLE_CALIBRATION_FEATURE_LENGTH = _m1_PUZZLE_CALIBRATION_FEATURE_LENGTH
  const PUZZLE_CALIBRATION_FEATURE_VERSION = _m1_PUZZLE_CALIBRATION_FEATURE_VERSION
  const PUZZLE_CALIBRATION_SCHEMA_VERSION = _m1_PUZZLE_CALIBRATION_SCHEMA_VERSION
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
const vector = Array.from({ length: PUZZLE_CALIBRATION_FEATURE_LENGTH }, (_, index) => index / 128)

test('海图校准素材保存、同图覆盖、删除和重置', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'puzzle-calibration-'))
  try {
    const repository = new PuzzleCalibrationRepository(root)
    const first = repository.save({ tileDataUrl: png, labelMask: 1, featureVector: vector,
      featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION, page: 1, row: 2, column: 3 })
    const second = repository.save({ tileDataUrl: png, labelMask: 10, featureVector: vector,
      featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION, page: 2, row: 4, column: 5 })
    assert.equal(first.id, second.id)
    assert.equal(repository.list().length, 1)
    assert.equal(repository.list()[0].labelMask, 10)
    assert.equal(repository.list()[0].kind, 'fragment')
    assert.equal(repository.list()[0].type, 'straight')
    assert.match(repository.listWithImages()[0].tileDataUrl, /^data:image\/png;base64,/)
    assert.equal(repository.remove(first.id), true)
    assert.equal(repository.list().length, 0)
    repository.save({ tileDataUrl: png, labelMask: 0, featureVector: vector,
      featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION })
    repository.reset()
    assert.deepEqual(repository.list(), [])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('海图校准素材拒绝非法输入并忽略损坏、越界和路径逃逸记录', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'puzzle-calibration-invalid-'))
  try {
    const repository = new PuzzleCalibrationRepository(root)
    assert.throws(() => repository.save({ tileDataUrl: 'bad', labelMask: 1, featureVector: vector,
      featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION }), /PNG/)
    assert.throws(() => repository.save({ tileDataUrl: png, labelMask: 16, featureVector: vector,
      featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION }), /标签/)
    assert.throws(() => repository.save({ tileDataUrl: png, labelMask: 1, featureVector: [1],
      featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION }), /特征/)
    repository.ensure()
    writeFileSync(repository.indexPath, '{bad json', 'utf8')
    assert.deepEqual(repository.list(), [])
    writeFileSync(repository.indexPath, JSON.stringify({ samples: [
      { id: 'escape', kind: 'fragment', type: 'endpoint', labelMask: 1, featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION, featureVector: vector, relativePath: '..\\outside.png' },
      { id: 'label', kind: 'fragment', type: 'endpoint', labelMask: 20, featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION, featureVector: vector, relativePath: 'samples\\missing.png' },
      { id: 'vector', kind: 'fragment', type: 'endpoint', labelMask: 1, featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION, featureVector: [1], relativePath: 'samples\\missing.png' }
    ], schemaVersion: PUZZLE_CALIBRATION_SCHEMA_VERSION }), 'utf8')
    assert.deepEqual(repository.list(), [])
    assert.doesNotThrow(() => JSON.parse(readFileSync(repository.indexPath, 'utf8')))
    assert.equal(existsSync(path.join(root, 'outside.png')), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('海图校准仓储首次读取时清空全部 v1 素材并建立空 v2 索引', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'puzzle-calibration-v1-'))
  try {
    const repository = new PuzzleCalibrationRepository(root)
    repository.ensure()
    const legacyImage = path.join(repository.sampleRoot, 'legacy.png')
    writeFileSync(legacyImage, Buffer.from(png.split(',')[1], 'base64'))
    writeFileSync(repository.indexPath, JSON.stringify({
      schemaVersion: 1,
      samples: [{
        id: 'legacy', labelMask: 1, featureVersion: 1, featureVector: vector,
        relativePath: path.join('samples', 'legacy.png')
      }]
    }), 'utf8')

    assert.deepEqual(repository.list(), [])
    assert.equal(existsSync(legacyImage), false)
    assert.deepEqual(JSON.parse(readFileSync(repository.indexPath, 'utf8')), {
      schemaVersion: PUZZLE_CALIBRATION_SCHEMA_VERSION,
      samples: []
    })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
})()

// === Merged from puzzleConfig.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const counterClockwiseTurns = _m2_counterClockwiseTurns
  const gridCellCenter = _m2_gridCellCenter
  const normalizePuzzleTabPoints = _m2_normalizePuzzleTabPoints
  const normalizePuzzleOrientation = _m2_normalizePuzzleOrientation
  const normalizePuzzleSettings = _m2_normalizePuzzleSettings
  const validatePuzzleTabPoint = _m2_validatePuzzleTabPoint
  const validatePuzzleRegionEnvironment = _m2_validatePuzzleRegionEnvironment
const metadata = region => ({
  displayId: '1', scaleFactor: 1.5,
  displayPhysicalBounds: { x: -1920, y: 0, width: 1920, height: 1080 },
  selectedRegion: region,
  capturedAt: '2026-08-03T00:00:00.000Z'
})

test('旧海图区域配置迁移为仓库配置并保留新增海图区', () => {
  const inventory = metadata({ left: -700, top: 20, right: -100, bottom: 1020 })
  const atlas = metadata({ left: -1500, top: 100, right: -900, bottom: 700 })
  assert.deepEqual(normalizePuzzleSettings({ regionMetadata: inventory }).inventoryRegionMetadata, inventory)
  assert.deepEqual(normalizePuzzleSettings({ inventoryRegionMetadata: inventory, atlasRegionMetadata: atlas }), {
    inventoryRegionMetadata: inventory,
    atlasRegionMetadata: atlas,
    inventoryTabPoints: { 1: null, 2: null },
    autoProbeBorderMods: true,
    rewardStrategy: 'balanced'
  })
})

test('旧配置中的识别强度被静默忽略', () => {
  const inventory = metadata({ left: -700, top: 20, right: -100, bottom: 1020 })
  assert.deepEqual(normalizePuzzleSettings({ inventoryRegionMetadata: inventory }), {
    inventoryRegionMetadata: inventory,
    atlasRegionMetadata: null,
    inventoryTabPoints: { 1: null, 2: null },
    autoProbeBorderMods: true,
    rewardStrategy: 'balanced'
  })
  assert.equal(Object.hasOwn(normalizePuzzleSettings({ inventoryRegionMetadata: inventory, recognition: { strength: 'sensitive' } }), 'recognition'), false)
  assert.equal(Object.hasOwn(normalizePuzzleSettings({ inventoryRegionMetadata: inventory, recognition: { strength: 'unknown' } }), 'recognition'), false)
})

test('完成后自动识别默认开启且可显式关闭', () => {
  const inventory = metadata({ left: -700, top: 20, right: -100, bottom: 1020 })
  assert.equal(normalizePuzzleSettings({ inventoryRegionMetadata: inventory }).autoProbeBorderMods, true)
  assert.equal(normalizePuzzleSettings({ inventoryRegionMetadata: inventory, autoProbeBorderMods: false }).autoProbeBorderMods, false)
  assert.equal(normalizePuzzleSettings({ rewardStrategy: 'rare' }).rewardStrategy, 'rare')
  assert.equal(normalizePuzzleSettings({ rewardStrategy: 'auto' }).rewardStrategy, 'auto')
  assert.equal(normalizePuzzleSettings({ rewardStrategy: 'invalid' }).rewardStrategy, 'balanced')
})

test('双页页签坐标规范化并限制在仓库正上方安全带', () => {
  const inventory = metadata({ left: -800, top: 100, right: -200, bottom: 1000 })
  assert.deepEqual(normalizePuzzleTabPoints({ 1: { x: -650.4, y: 50.6 }, 2: { x: -550, y: 51 } }), {
    1: { x: -650, y: 51 }, 2: { x: -550, y: 51 }
  })
  assert.equal(validatePuzzleTabPoint({ x: -650, y: 50 }, inventory, 1, { x: -550, y: 50 }).valid, true)
  assert.equal(validatePuzzleTabPoint({ x: -650, y: 250 }, inventory, 1).code, 'TAB_POINT_OUTSIDE_SAFE_BAND')
  assert.equal(validatePuzzleTabPoint({ x: -650, y: 50 }, inventory, 2, { x: -650, y: 50 }).code, 'TAB_POINTS_DUPLICATE')
})

test('仓库和海图区使用物理区域等分中心并支持负坐标', () => {
  assert.deepEqual(gridCellCenter({ left: -600, top: 20, right: 0, bottom: 1020 }, 'inventory', 9, 5), { x: -50, y: 970 })
  assert.deepEqual(gridCellCenter({ left: -900, top: 90, right: -300, bottom: 690 }, 'atlas', 1, 1), { x: -600, y: 390 })
})

test('逆时针次数遵守角度和旋转对称性', () => {
  assert.equal(counterClockwiseTurns('corner', 90, 0), 1)
  assert.equal(counterClockwiseTurns('corner', 0, 90), 3)
  assert.equal(counterClockwiseTurns('straight', 90, 270), 0)
  assert.equal(counterClockwiseTurns('cross', 270, 90), 0)
  assert.equal(normalizePuzzleOrientation('straight', 270), 90)
})

test('海图区按 3×3 最小尺寸独立校验', () => {
  const result = validatePuzzleRegionEnvironment(metadata({ left: 0, top: 0, right: 59, bottom: 59 }), [], 'atlas')
  assert.equal(result.code, 'REGION_TOO_SMALL')
  assert.match(result.message, /3×3/)
})
})()

// === Merged from puzzleFailureEvidenceRepository.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const createHash = _m3_createHash
  const randomUUID = _m3_randomUUID
  const mkdtemp = _m3_mkdtemp
  const mkdir = _m3_mkdir
  const readdir = _m3_readdir
  const writeFile = _m3_writeFile
  const os = _m3_os
  const path = _m3_path
  const PUZZLE_FAILURE_EVIDENCE_RETENTION_MS = _m3_PUZZLE_FAILURE_EVIDENCE_RETENTION_MS
  const PuzzleFailureEvidenceRepository = _m3_PuzzleFailureEvidenceRepository
  const validatePuzzleFailureEvidenceManifest = _m3_validatePuzzleFailureEvidenceManifest
function completeFile({ body = Buffer.from('png'), attempt = 1, page = 1, kind = 'crop', fileName = 'page-1-attempt-1-crop.png' } = {}) {
  return {
    attempt, page, kind, fileName, encoding: kind === 'crop' ? 'png' : 'jpeg', width: 600, height: 1000,
    bytes: body.length, sha256: createHash('sha256').update(body).digest('hex'), status: 'complete'
  }
}

function manifest(evidenceId, overrides = {}) {
  return {
    schemaVersion: 1,
    evidenceId,
    occurredAt: new Date('2026-08-26T01:02:03Z').toISOString(),
    completeness: { status: 'partial', reasons: ['WINDOW_BOUNDS_UNAVAILABLE'] },
    attempts: [{
      attempt: 1, page: 1, capturedAt: '2026-08-26T01:02:03Z', stage: 'GRID_ANALYSIS',
      monitorBounds: { left: 0, top: 0, width: 2560, height: 1440 },
      windowBounds: { left: 100, top: 40, width: 1920, height: 1080 },
      configuredRegion: { left: 240, top: 100, width: 600, height: 1000 },
      actualCrop: { left: 140, top: 60, width: 600, height: 1000 },
      grid: { candidateVerticalLines: [100, 200], candidateHorizontalLines: [80, 160], spacing: { x: 100, y: 80 }, deviation: { mean: 1.2, max: 3 }, confidence: 0.42 },
      occupiedCount: 0, warnings: ['GRID_ALIGNMENT_LOW'], errorCode: 'EMPTY_GRID_UNCERTAIN'
    }],
    files: [completeFile(), { attempt: 1, page: 1, kind: 'window', encoding: 'jpeg', status: 'missing', omissionReason: 'WINDOW_BOUNDS_UNAVAILABLE' }],
    omittedFiles: [],
    ...overrides
  }
}

test('证据清单固定随机标识、相对文件名、逐次指标、图片元数据和省略原因', () => {
  const id = randomUUID()
  const value = validatePuzzleFailureEvidenceManifest(manifest(id))
  assert.equal(value.evidenceId, id)
  assert.equal(value.attempts[0].grid.candidateVerticalLines.length, 2)
  assert.equal(value.files[0].sha256.length, 64)
  assert.equal(value.files[1].omissionReason, 'WINDOW_BOUNDS_UNAVAILABLE')
  assert.throws(() => validatePuzzleFailureEvidenceManifest(manifest(id, { files: [{ ...completeFile(), fileName: '../secret.png' }] })), /文件元数据|图片元数据/)
  const sanitized = validatePuzzleFailureEvidenceManifest(manifest(id, { completeness: { status: 'partial', reasons: ['C:\\Users\\Private\\secret'] } }))
  assert.deepEqual(sanitized.completeness.reasons, [])
  assert.doesNotMatch(JSON.stringify(sanitized), /Private|C:\\\\Users/)
})

test('仓库原子提交、读取摘要和新证据替换不留下旧目录', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'puzzle-evidence-'))
  const repository = new PuzzleFailureEvidenceRepository({ root, now: () => Date.parse('2026-08-26T01:02:03Z') })
  const first = await repository.createWorkspace()
  await writeFile(path.join(first.directory, 'page-1-attempt-1-crop.png'), 'png')
  assert.equal((await repository.commit(first, manifest(first.evidenceId))).success, true)
  assert.equal((await repository.getSummary()).evidence.attemptCount, 1)
  const second = await repository.createWorkspace()
  await writeFile(path.join(second.directory, 'page-1-attempt-1-crop.png'), 'png')
  assert.equal((await repository.commit(second, manifest(second.evidenceId))).success, true)
  const entries = await readdir(root, { withFileTypes: true })
  assert.equal(entries.some(item => item.isDirectory() && item.name === first.evidenceId), false)
  assert.equal((await repository.getSummary()).evidence.referenceId, second.evidenceId)
})

test('反馈失败保留、成功或用户取消只清理对应证据且不暴露完整路径', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'puzzle-evidence-clear-'))
  const repository = new PuzzleFailureEvidenceRepository({ root, now: () => Date.parse('2026-08-26T01:02:03Z') })
  const workspace = await repository.createWorkspace()
  await writeFile(path.join(workspace.directory, 'page-1-attempt-1-crop.png'), 'png')
  await repository.commit(workspace, manifest(workspace.evidenceId))
  const summary = await repository.getSummary()
  assert.equal(JSON.stringify(summary).includes(root), false)
  assert.equal((await repository.getSummary()).evidence.referenceId, workspace.evidenceId)
  assert.equal((await repository.clear(randomUUID())).cleared, false)
  assert.equal((await repository.clear(workspace.evidenceId)).cleared, true)
  assert.equal((await repository.getSummary()).evidence, null)
})

test('七天过期和异常退出孤立暂存目录在访问时恢复清理', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'puzzle-evidence-expiry-'))
  let now = Date.parse('2026-08-26T01:02:03Z')
  const repository = new PuzzleFailureEvidenceRepository({ root, now: () => now })
  const workspace = await repository.createWorkspace()
  await writeFile(path.join(workspace.directory, 'page-1-attempt-1-crop.png'), 'png')
  await repository.commit(workspace, manifest(workspace.evidenceId))
  await mkdir(path.join(root, `.staging-${randomUUID()}`))
  now += PUZZLE_FAILURE_EVIDENCE_RETENTION_MS + 1
  assert.equal((await repository.getSummary()).evidence, null)
  assert.equal((await readdir(root)).some(name => name.startsWith('.staging-')), false)
})

test('读取摘要不会删除当前进程仍在写入的活动暂存目录', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'puzzle-evidence-active-'))
  const repository = new PuzzleFailureEvidenceRepository({ root })
  const active = await repository.createWorkspace()
  const orphanId = randomUUID()
  await mkdir(path.join(root, `.staging-${orphanId}`))
  await repository.getSummary()
  const entries = await readdir(root)
  assert.equal(entries.includes(`.staging-${active.evidenceId}`), true)
  assert.equal(entries.includes(`.staging-${orphanId}`), false)
  await repository.discardWorkspace(active)
})

test('不可写或损坏目录安全降级为内部完整性状态', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'puzzle-evidence-broken-'))
  const repository = new PuzzleFailureEvidenceRepository({ root, logger: { warn() {} } })
  const workspace = await repository.createWorkspace()
  const result = await repository.commit(workspace, manifest(workspace.evidenceId))
  assert.equal(result.success, false)
  assert.equal(repository.integrityStatus().status, 'unavailable')
  assert.equal(JSON.stringify(result).includes(root), false)
})
})()

// === Merged from puzzleFailureEvidenceSession.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const PuzzleFailureEvidenceSession = _m4_PuzzleFailureEvidenceSession
function evidence(page, status = 'complete') {
  return {
    schemaVersion: 1,
    evidenceId: '11111111-1111-4111-8111-111111111111',
    occurredAt: `2026-08-26T01:02:0${page}Z`,
    completeness: { status, reasons: status === 'complete' ? [] : ['IMAGE_ENCODING_FAILED'] },
    attempts: [{ attempt: 1, page }],
    files: [{ attempt: 1, page, kind: 'crop', fileName: `page-${page}-attempt-1-crop.png` }],
    omittedFiles: []
  }
}

function repository(overrides = {}) {
  const calls = { created: 0, committed: [], discarded: [] }
  return {
    calls,
    async createWorkspace() { calls.created += 1; return { evidenceId: '11111111-1111-4111-8111-111111111111', directory: 'internal-only' } },
    async commit(workspace, manifest) { calls.committed.push({ workspace, manifest }); return { success: true } },
    async discardWorkspace(workspace) { calls.discarded.push(workspace); return { success: true } },
    ...overrides
  }
}

test('海图服务消费并剥离内部证据且最终失败合并双页后提交', async () => {
  const store = repository()
  const session = new PuzzleFailureEvidenceSession(store)
  await session.start()
  const first = session.consume({ success: true, occupiedCount: 2, _failureEvidence: evidence(1) })
  const second = session.consume({ success: false, error: { code: 'EMPTY_GRID_UNCERTAIN' }, _failureEvidence: evidence(2, 'partial') })
  assert.deepEqual(first, { success: true, occupiedCount: 2 })
  assert.deepEqual(second, { success: false, error: { code: 'EMPTY_GRID_UNCERTAIN' } })
  assert.equal(JSON.stringify(first).includes('_failureEvidence'), false)
  await session.commitFailure()
  assert.equal(store.calls.committed.length, 1)
  assert.deepEqual(store.calls.committed[0].manifest.attempts.map(item => item.page), [1, 2])
  assert.equal(store.calls.committed[0].manifest.completeness.status, 'partial')
})

test('后续尝试恢复、离线成功和紧急停止只丢弃本次暂存且不提交失败证据', async () => {
  for (const result of [
    { success: true, occupiedCount: 3, _failureEvidence: evidence(1) },
    { success: false, canceled: true, error: { code: 'EMERGENCY_STOPPED' } }
  ]) {
    const store = repository()
    const session = new PuzzleFailureEvidenceSession(store)
    await session.start()
    const publicResult = session.consume(result)
    await session.discard()
    assert.equal(publicResult.error?.code || 'SUCCESS', result.error?.code || 'SUCCESS')
    assert.equal(store.calls.committed.length, 0)
    assert.equal(store.calls.discarded.length, 1)
  }
})

test('证据仓库故障只记录内部完整性状态且不改变原公开结果', async () => {
  const store = repository({ async commit() { throw Object.assign(new Error('private path'), { code: 'EACCES' }) } })
  const warnings = []
  const session = new PuzzleFailureEvidenceSession(store, { warn: (...items) => warnings.push(items) })
  await session.start()
  const publicResult = session.consume({ success: false, error: { code: 'EMPTY_GRID_UNCERTAIN', message: '原错误' }, _failureEvidence: evidence(1) })
  const committed = await session.commitFailure()
  assert.deepEqual(publicResult, { success: false, error: { code: 'EMPTY_GRID_UNCERTAIN', message: '原错误' } })
  assert.equal(committed.success, false)
  assert.equal(warnings.length, 1)
  assert.equal(JSON.stringify(committed).includes('private path'), false)
})
})()

// === Merged from puzzleFragmentCopy.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const readFileSync = _m5_readFileSync
  const CHART_SHAPES = _m5_CHART_SHAPES
  const chartShapeAliasesByPuzzleType = _m5_chartShapeAliasesByPuzzleType
  const parseCopiedChartFragment = _m5_parseCopiedChartFragment
  const finalizeInventoryAnalysisResult = _m5_finalizeInventoryAnalysisResult
  const resolveFragmentCopy = _m5_resolveFragmentCopy
const copied = (shape, colon = ':') => `物品类别${colon} 海图
稀 有 度: 稀有
金沙海床海图
--------
海图形状${colon} ${shape}
--------
物品等级: 83`

test('复制文本以共享别名表解析五种国服海图形状', () => {
  const expected = {
    endpoint: '端点',
    corner: '角落',
    straight: '直线',
    tee: '节点',
    cross: '交叉'
  }
  for (const [type, label] of Object.entries(expected)) {
    const result = parseCopiedChartFragment(copied(label))
    assert.deepEqual([result.isChart, result.type, result.shapeLabel], [true, type, label])
  }
  assert.deepEqual(Object.keys(chartShapeAliasesByPuzzleType()).sort(), Object.keys(expected).sort())
  assert.ok(CHART_SHAPES.every(shape => shape.aliases.length >= 1))
})

test('复制文本兼容全角冒号、NFKC 空白和交易别名', () => {
  const result = parseCopiedChartFragment(copied('  交 汇  ', '：'))
  assert.equal(result.isChart, true)
  assert.equal(result.type, 'tee')
  assert.equal(result.shapeLabel, '交 汇')
})

test('未知形状保持海图身份但不产生内部类型', () => {
  const result = parseCopiedChartFragment(copied('未来形状'))
  assert.deepEqual({ isChart: result.isChart, type: result.type, shapeLabel: result.shapeLabel }, {
    isChart: true,
    type: null,
    shapeLabel: '未来形状'
  })
})

test('非海图文本即使包含形状字段也不得定型', () => {
  const result = parseCopiedChartFragment(copied('端点').replace('物品类别: 海图', '物品类别: 地图碎片'))
  assert.equal(result.isChart, false)
  assert.equal(result.type, null)
})

const candidateSlot = (overrides = {}) => ({
  row: 0,
  column: 0,
  candidate: true,
  occupied: false,
  type: null,
  mask: 0,
  directionCandidates: {
    endpoint: { mask: 2, orientation: 90, confidence: 0.82, uncertain: false, calibrated: false },
    straight: { mask: 5, orientation: 0, confidence: 0.4, uncertain: false, calibrated: false },
    corner: { mask: 3, orientation: 0, confidence: 0.3, uncertain: true, calibrated: false },
    tee: { mask: 11, orientation: 0, confidence: 0.7, uncertain: false, calibrated: false },
    cross: { mask: 15, orientation: 0, confidence: 0.9, uncertain: false, calibrated: false }
  },
  emptyCalibration: { matched: false, similarity: 0 },
  ...overrides
})

test('复制类型强约束最终方向且保留同次词缀文本之外的证据', () => {
  const resolved = resolveFragmentCopy(candidateSlot(), copied('端点'))
  assert.deepEqual([
    resolved.occupied,
    resolved.type,
    resolved.typeSource,
    resolved.shapeLabel,
    resolved.mask,
    resolved.orientation,
    resolved.directionConfidence,
    resolved.uncertain
  ], [true, 'endpoint', 'copy', '端点', 2, 90, 0.82, false])
})

test('复制失败保持未知，只有无文本时空格素材才能抑制假阳性', () => {
  const evidence = candidateSlot({ emptyCalibration: { matched: true, similarity: 0.99 } })
  const empty = resolveFragmentCopy(evidence, '')
  assert.deepEqual([empty.candidate, empty.occupied, empty.typeSource, empty.uncertain], [false, false, 'calibration-empty', false])

  const unknownShape = resolveFragmentCopy(evidence, copied('未来形状'))
  assert.deepEqual([unknownShape.candidate, unknownShape.type, unknownShape.typeSource, unknownShape.uncertain], [true, null, 'copy-unknown', true])

  const nonChart = resolveFragmentCopy(evidence, '物品类别: 地图碎片\n海图形状: 端点')
  assert.deepEqual([nonChart.type, nonChart.typeSource, nonChart.uncertain], [null, 'copy-invalid', true])
})

test('未知类型与缺失方向不进入库存计数和求解输入', () => {
  const known = resolveFragmentCopy(candidateSlot(), copied('端点'))
  const missingDirection = resolveFragmentCopy(candidateSlot({ directionCandidates: {} }), copied('端点'))
  const result = finalizeInventoryAnalysisResult({ slots: [known, missingDirection, candidateSlot()] })
  assert.equal(result.occupiedCount, 1)
  assert.equal(result.candidateCount, 3)
  assert.equal(result.counts.endpoint, 1)
  assert.equal(missingDirection.uncertain, true)
})

test('双页服务只复制视觉候选并在词缀解析前应用复制定型', () => {
  const source = readFileSync(new URL('../electron/modules/puzzle/service.js', import.meta.url), 'utf8')
  const probe = source.match(/async probeFragmentMods\([\s\S]*?\n  \}/)?.[0] || ''
  assert.match(probe, /if \(!slot\.candidate\) continue/)
  assert.match(probe, /Object\.assign\(cell\.slot, resolveFragmentCopy\(cell\.slot, text\)\)/)
  assert.match(probe, /matchFragmentMods\(text\.split/)
  assert.doesNotMatch(probe, /if \(!cell\.slot\.type\) fragmentStats\.unknown/)
  assert.match(probe, /if \(match\.status === 'matched'\) fragmentStats\.matched/)
  assert.match(source, /candidateTotal[\s\S]*filter\(slot => slot\?\.candidate\)/)
  assert.match(source, /calibrationSamples\(\)[\s\S]*kind: sample\.kind[\s\S]*type: sample\.type/)
})
})()

// === Merged from puzzleInventoryTabs.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const readFileSync = _m6_readFileSync
  const createPinia = _m6_createPinia
  const setActivePinia = _m6_setActivePinia
  const usePuzzleStore = _m6_usePuzzleStore
const source = relativePath => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

const slot = (type, orientation = 0) => ({
  row: 0, column: 0, candidate: true, occupied: true, type, typeSource: 'copy', shapeLabel: type, orientation,
  confidence: 0.9, uncertain: false, corrected: false
})

test('双页识别只替换目标页并聚合计数', async () => {
  setActivePinia(createPinia())
  const store = usePuzzleStore()
  assert.equal(store.applyAnalysis({ success: true, page: 1, slots: [slot('corner')], warnings: [], gridConfidence: 0.9 }), true)
  assert.equal(store.applyAnalysis({ success: true, page: 2, slots: [slot('tee', 90)], warnings: [], gridConfidence: 0.8 }), true)
  assert.equal(store.inventoryPages[1].recognized, true)
  assert.equal(store.inventoryPages[2].recognized, true)
  assert.equal(store.allSlots.length, 120)
  assert.equal(store.counts.corner, 1)
  assert.equal(store.counts.tee, 1)
  await store.clearInventoryPage(2)
  assert.equal(store.inventoryPages[1].recognized, true)
  assert.equal(store.inventoryPages[2].recognized, false)
  assert.equal(store.counts.corner, 1)
  store.applyAnalysis({ success: true, page: 2, slots: [slot('tee')], warnings: [], gridConfidence: 0.8 })
  await store.clearInventoryPages()
  assert.equal(store.inventoryPages[1].recognized, false)
  assert.equal(store.inventoryPages[2].recognized, false)
  assert.equal(store.allSlots.length, 0)
})

test('完全相同的第二页识别结果被拒绝且不覆盖原页', () => {
  setActivePinia(createPinia())
  const store = usePuzzleStore()
  const result = { success: true, slots: [slot('corner')], warnings: [], gridConfidence: 0.9 }
  assert.equal(store.applyAnalysis({ ...result, page: 1 }), true)
  assert.equal(store.applyAnalysis({ ...result, page: 2 }), false)
  assert.equal(store.error.code, 'DUPLICATE_INVENTORY_PAGE')
  assert.equal(store.inventoryPages[2].recognized, false)
})

test('双页批次仅在结果完整且可区分时原子替换', () => {
  setActivePinia(createPinia())
  const store = usePuzzleStore()
  store.applyAnalysis({ success: true, page: 1, slots: [slot('corner')], warnings: [], gridConfidence: 0.9 })
  store.applyAnalysis({ success: true, page: 2, slots: [slot('tee')], warnings: [], gridConfidence: 0.9 })
  assert.equal(store.applyAnalysisBatch({
    success: true,
    pages: [{ success: true, page: 1, slots: [slot('cross')], warnings: [], gridConfidence: 1 }]
  }), false)
  assert.equal(store.inventoryPages[1].slots[0].type, 'corner')
  assert.equal(store.inventoryPages[2].slots[0].type, 'tee')

  assert.equal(store.applyAnalysisBatch({
    success: true,
    pages: [
      { success: true, page: 1, slots: [slot('straight')], warnings: [], gridConfidence: 1 },
      { success: true, page: 2, slots: [slot('endpoint')], warnings: [], gridConfidence: 1 }
    ]
  }), true)
  assert.equal(store.inventoryPages[1].slots[0].type, 'straight')
  assert.equal(store.inventoryPages[2].slots[0].type, 'endpoint')
})

test('仓库重识别保留已有边缘词缀结果', () => {
  setActivePinia(createPinia())
  const store = usePuzzleStore()
  store.applyAnalysis({
    success: true,
    page: 1,
    slots: [slot('corner')],
    warnings: [],
    gridConfidence: 0.9,
    borderMods: {
      N0: { status: 'matched', mod: { lines: ['已有边缘词缀'] }, confidence: 0.9, rawTexts: [] }
    }
  })

  assert.equal(store.edges.N0.mod.lines[0], '已有边缘词缀')
  assert.equal(store.applyAnalysisBatch({
    success: true,
    pages: [
      { success: true, page: 1, slots: [slot('straight')], warnings: [], gridConfidence: 1 },
      { success: true, page: 2, slots: [slot('endpoint')], warnings: [], gridConfidence: 1 }
    ],
    borderMods: null,
    borderProbe: { skipped: true, reason: 'SKIPPED_BY_REQUEST' }
  }), true)
  assert.equal(store.edges.N0.mod.lines[0], '已有边缘词缀')
})

test('未知边缘 rawTexts 通过 borderMods 保留，重新识别后替换且不残留上一次文本', () => {
  setActivePinia(createPinia())
  const store = usePuzzleStore()
  store.applyAnalysis({
    success: true,
    page: 1,
    slots: [slot('corner')],
    warnings: [],
    gridConfidence: 0.9,
    borderMods: {
      E0: { status: 'unknown', mod: null, confidence: 0, rawTexts: ['相邻区域包含', '8个额外的海兽群'] }
    }
  })
  assert.deepEqual(store.edges.E0.rawTexts, ['相邻区域包含', '8个额外的海兽群'])
  assert.equal(store.edges.E0.status, 'unknown')

  store.applyAnalysis({
    success: true,
    page: 1,
    slots: [slot('corner')],
    warnings: [],
    gridConfidence: 0.9,
    borderMods: {
      E0: { status: 'matched', mod: { lines: ['相邻区域包含 8 个额外的海兽群'] }, confidence: 1, rawTexts: ['相邻区域包含8个额外的海兽群'] }
    }
  })
  assert.equal(store.edges.E0.status, 'matched')
  assert.equal(store.edges.E0.mod.lines[0], '相邻区域包含 8 个额外的海兽群')
  assert.deepEqual(store.edges.E0.rawTexts, ['相邻区域包含8个额外的海兽群'])
})

test('页面、IPC 与执行负载携带双页及页签协议', () => {
  const store = source('src/stores/puzzle.js')
  const view = source('src/domains/puzzle/PuzzleView.vue')
  const service = source('electron/modules/puzzle/service.js')
  assert.match(store, /inventoryPages = ref\(loaded\.inventoryPages\)/)
  assert.match(store, /async function analyze\(\{ page = null, configurationGuideBypass = false \}/)
  assert.match(store, /inventoryTabPoints: inventoryTabPoints\.value/)
  assert.match(store, /applyAnalysisBatch/)
  assert.match(view, /第1页[\s\S]*第2页/)
  assert.match(view, /@click="clearAllInventoryPages">清空两页结果/)
  assert.match(view, /第 \{\{ page \}\} 页页签/)
  assert.ok(view.indexOf('<el-radio-group') > view.indexOf('class="inventory-card"'))
  assert.match(view, /class="inventory-card-heading"[\s\S]*<strong>碎片仓库<\/strong>[\s\S]*查看碎片仓库操作说明[\s\S]*清空两页结果[\s\S]*class="inventory-card-toolbar"/)
  assert.match(view, /class="inventory-toolbar-group"[\s\S]*本机校准[\s\S]*保存后立即更新仓库并用于后续识别[\s\S]*校准本机素材[\s\S]*素材管理/)
  assert.match(view, /class="inventory-toolbar-group"[\s\S]*识别结果[\s\S]*自动识别两页[\s\S]*class="inventory-page-tabs"/)
  assert.doesNotMatch(view, /碎片仓库第 \{\{ selectedInventoryPage \}\} 页/)
  assert.match(view, /\.inventory-page-tabs \{[^}]*flex-direction: row;[^}]*flex-wrap: nowrap;/)
  assert.match(view, /analysisProgressText[\s\S]*'自动识别两页'/)
  const analysisProgress = view.match(/const analysisProgressText = computed\([\s\S]*?\n\}\)/)?.[0] || ''
  assert.match(analysisProgress, /正在复制碎片/)
  assert.doesNotMatch(analysisProgress, /边缘词缀/)
  assert.match(service, /allowEmpty: true/)
  assert.match(service, /validatePuzzleTabPoint/)
  assert.match(service, /\[1, 2\][\s\S]*for \(const currentPage of requestedPages\)[\s\S]*tabPoint: tabPoints\[currentPage\]/)
})
})()

// === Merged from puzzleRecognitionFeedbackIntegration.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const readFileSync = _m7_readFileSync
const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('识别反馈窗口不在启动时预热、注入服务并随服务退出销毁', () => {
  const main = source('../electron/main.js')
  const service = source('../electron/modules/puzzle/service.js')
  assert.match(main, /new RecognitionFeedbackOverlayManager\(\{ BrowserWindowClass: BrowserWindow, screenApi: screen \}\)/)
  assert.doesNotMatch(main, /recognitionFeedbackOverlay\.prime\(\)/)
  assert.match(main, /feedbackOverlay: recognitionFeedbackOverlay/)
  assert.match(service, /this\.feedbackOverlay\?\.close\?\.\(\)/)
  assert.match(service, /this\.overlay\?\.close\?\.\(\)[\s\S]*this\.feedbackOverlay\?\.close/)
})

test('碎片识别在基础校验后开始并发布逐页、准备和逐格进度', () => {
  const service = source('../electron/modules/puzzle/service.js')
  const analyze = service.slice(service.indexOf('async analyze('), service.indexOf('\n  cleanup()', service.indexOf('async analyze(')))
  const validationIndex = analyze.indexOf('validatePuzzleTabPoint')
  const runningIndex = analyze.indexOf('feedbackOverlay?.showRunning')
  const analyzerIndex = analyze.indexOf('await this.runAnalyzer')
  assert.ok(validationIndex >= 0 && validationIndex < runningIndex && runningIndex < analyzerIndex)
  assert.match(analyze, /stage: 'shape'[\s\S]*current: pageIndex \+ 1[\s\S]*total: requestedPages\.length/)
  assert.match(analyze, /candidateTotal[\s\S]*stage: 'copy'[\s\S]*feedbackSessionId/)
  assert.match(service, /event\?\.event === 'cell-copied'[\s\S]*stage: 'copy'/)
  assert.match(service, /updateProgress\?\.\(feedbackSessionId,[\s\S]*current: progress\.index/)
})

test('边缘识别的独立与自动入口共用服务内 12 段单次结果吐司', () => {
  const service = source('../electron/modules/puzzle/service.js')
  const store = source('../src/stores/puzzle.js')
  const method = service.slice(service.indexOf('async probeBorderMods('), service.indexOf('\n  async analyze(', service.indexOf('async probeBorderMods(')))
  assert.match(method, /stage: 'border',[\s\S]*current: 0,[\s\S]*total: 12/)
  assert.equal((method.match(/showResult\?\./g) || []).length, 1)
  assert.match(method, /runBorderProbe\(normalizeAtlas, feedbackSessionId, \(\) => \{ automationStarted = true \}\)/)
  assert.match(store, /if \(autoProbeBorderMods\.value\)[\s\S]*await probeBorderMods\(\)/)
  assert.doesNotMatch(store, /showImmediateResult|showResult|recognitionFeedback/)
})

test('校验、锁、子进程失败和紧急停止均结束运行反馈', () => {
  const service = source('../electron/modules/puzzle/service.js')
  assert.match(service, /showFeedbackFailure\(\{ sessionId = null, displayBounds = null, error, canceled = false \}\)/)
  assert.match(service, /if \(!gate\.success\)[\s\S]*codedError\('AUTOMATION_LOCKED'[\s\S]*showFeedbackFailure/)
  assert.match(service, /copyError[\s\S]*canceled: probeGeneration !== this\.stopGeneration/)
  assert.match(service, /const canceled = stopGeneration !== this\.stopGeneration \|\| error\.code === 'EMERGENCY_STOPPED'/)
  assert.match(service, /this\.showFeedbackFailure\(\{ sessionId: feedbackSessionId, displayBounds, error, canceled \}\)/)
  assert.match(source('../electron/modules/puzzle/recognitionFeedback.js'), /status: 'stopped'[\s\S]*未完成结果未保存/)
})

test('碎片完整、部分、失败和停止终态共用自动化后的单一前台恢复路径', () => {
  const service = source('../electron/modules/puzzle/service.js')
  const analyze = service.slice(service.indexOf('async analyze('), service.indexOf('\n  cleanup()', service.indexOf('async analyze(')))
  const publish = service.match(/publish\(payload\) \{([\s\S]*?)\n  \}/)?.[1] || ''
  assert.match(analyze, /let automationStarted = false[\s\S]*validateRegion[\s\S]*runAnalyzer\([\s\S]*automationStarted = true/)
  assert.match(analyze, /fragmentRecognitionResult\(mods\.fragmentProbe, candidateTotal\)/)
  assert.match(analyze, /recognitionFailureResult|showFeedbackFailure/)
  assert.match(analyze, /finally \{[\s\S]*if \(automationStarted\) await this\.windowActivation\?\.activateMain/)
  assert.equal((analyze.match(/windowActivation\?\.activateMain/g) || []).length, 1)
  assert.doesNotMatch(publish, /restoreMainWindowToForeground/)
})

test('反馈路由、预加载桥接和视图覆盖运行与四类结果状态', () => {
  const router = source('../src/router/index.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const view = source('../src/domains/puzzle/ChartRecognitionFeedbackView.vue')
  assert.match(router, /path: '\/chart-recognition-feedback'[\s\S]*noLayout: true/)
  assert.match(preload, /chart-recognition-feedback-updated/)
  assert.match(api, /onRecognitionFeedbackUpdated/)
  for (const status of ['success', 'partial', 'failure', 'stopped']) assert.match(view, new RegExp(`${status}:`))
  assert.match(view, /请勿移动鼠标/)
})
})()

// === Merged from puzzleRewardStrategy.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const createPinia = _m8_createPinia
  const setActivePinia = _m8_setActivePinia
  const electronApi = _m8_electronApi
  const usePuzzleStore = _m8_usePuzzleStore
function confirmedSlot(type, index = 0) {
  return {
    row: Math.floor(index / 6), column: index % 6,
    candidate: true, occupied: true, type, typeSource: 'copy', shapeLabel: type,
    orientation: 0, confidence: 1
  }
}

function atlasMetadata() {
  return {
    displayId: '1', scaleFactor: 1,
    displayPhysicalBounds: { x: 0, y: 0, width: 1920, height: 1080 },
    selectedRegion: { left: 900, top: 100, right: 1500, bottom: 700 },
    capturedAt: '2026-08-30T00:00:00.000Z'
  }
}

test('切换收益策略会持久化并触发方案重算', async () => {
  const originalLocalStorage = globalThis.localStorage
  let saved = null
  globalThis.localStorage = {
    getItem: () => null,
    setItem: (_key, value) => { saved = JSON.parse(value) }
  }
  try {
    setActivePinia(createPinia())
    const store = usePuzzleStore()
    store.setRewardStrategy('rare')
    await new Promise(resolve => setTimeout(resolve, 40))
    assert.equal(store.rewardStrategy, 'rare')
    assert.equal(saved.rewardStrategy, 'rare')
    assert.equal(store.result.strategy, 'rare')
    assert.equal(store.setRewardStrategy('invalid'), true)
    assert.equal(store.rewardStrategy, 'balanced')
  } finally {
    globalThis.localStorage = originalLocalStorage
  }
})

test('自动收益模式保持持久化并随词缀重选实际策略', async () => {
  const originalLocalStorage = globalThis.localStorage
  let saved = null
  globalThis.localStorage = {
    getItem: () => null,
    setItem: (_key, value) => { saved = JSON.parse(value) }
  }
  const batch = line => ({
    success: true,
    pages: [
      { page: 1, slots: Array.from({ length: 9 }, (_, index) => confirmedSlot('cross', index)) },
      { page: 2, slots: [confirmedSlot('corner')] }
    ],
    fragmentMods: { '1:0:0': { status: 'matched', mod: { lines: [line] }, confidence: 1 } }
  })
  try {
    setActivePinia(createPinia())
    const store = usePuzzleStore()
    store.setRewardStrategy('auto')
    store.applyAnalysisBatch(batch('相邻区域包含 3 个额外奥术师的保险箱'))
    await new Promise(resolve => setTimeout(resolve, 900))
    assert.equal(store.rewardStrategy, 'auto')
    assert.equal(saved.rewardStrategy, 'auto')
    assert.equal(store.result.strategy, 'auto')
    assert.equal(store.result.effectiveStrategy, 'strongbox')

    store.applyAnalysisBatch(batch('所有航行区域中找到的亡者硫磺提高 25%'))
    await new Promise(resolve => setTimeout(resolve, 900))
    assert.equal(store.rewardStrategy, 'auto')
    assert.equal(store.result.effectiveStrategy, 'sulphur')
  } finally {
    globalThis.localStorage = originalLocalStorage
  }
})

test('边缘词缀识别成功后按新边缘收益重算', async () => {
  const original = electronApi.puzzle.probeBorderMods
  electronApi.puzzle.probeBorderMods = async () => ({
    success: true,
    borderMods: { N0: { status: 'matched', mod: { lines: ['相邻区域中找到的通货总增 100%'] } } }
  })
  try {
    setActivePinia(createPinia())
    const store = usePuzzleStore()
    store.applyAnalysisBatch({
      success: true,
      pages: [
        { page: 1, slots: Array.from({ length: 9 }, (_, index) => confirmedSlot('cross', index)) },
        { page: 2, slots: [confirmedSlot('corner')] }
      ]
    })
    const response = await store.probeBorderMods({ configurationGuideBypass: true })
    assert.equal(response.success, true)
    assert.equal(store.result.rewardDataAvailable, true)
    assert.ok(store.result.rewardScore > 0)
  } finally {
    electronApi.puzzle.probeBorderMods = original
  }
})

function chartInventory(borderMods) {
  return {
    success: true,
    pages: [
      {
        page: 1,
        slots: Array.from({ length: 9 }, (_, index) => confirmedSlot('cross', index))
      },
      { page: 2, slots: [confirmedSlot('corner')] }
    ],
    borderMods
  }
}

test('完成海图且关闭自动识别时清空旧边缘词缀且不调用 OCR', async () => {
  const originalComplete = electronApi.puzzle.completeChart
  const originalProbe = electronApi.puzzle.probeBorderMods
  let probeCalls = 0
  electronApi.puzzle.completeChart = async () => ({ success: true })
  electronApi.puzzle.probeBorderMods = async () => {
    probeCalls += 1
    return { success: true, borderMods: {} }
  }
  try {
    setActivePinia(createPinia())
    const store = usePuzzleStore()
    store.setAutoProbeBorderMods(false)
    store.applyAnalysisBatch(chartInventory({
      N0: {
        status: 'matched',
        mod: { lines: ['旧海图边缘词缀'] },
        confidence: 1,
        rawTexts: ['旧海图 OCR 原文']
      }
    }))
    await new Promise(resolve => setTimeout(resolve, 40))

    const response = await store.completeCurrentChart()

    assert.equal(response.success, true)
    assert.equal(probeCalls, 0)
    assert.equal(store.edgesRecognized, false)
    assert.equal(store.edges.N0.status, 'unknown')
    assert.equal(store.edges.N0.mod, null)
    assert.deepEqual(store.edges.N0.rawTexts, [])
  } finally {
    electronApi.puzzle.completeChart = originalComplete
    electronApi.puzzle.probeBorderMods = originalProbe
  }
})

test('完成海图且开启自动识别时先清空旧词缀再应用新结果', async () => {
  const originalComplete = electronApi.puzzle.completeChart
  const originalProbe = electronApi.puzzle.probeBorderMods
  let clearedBeforeProbe = false
  electronApi.puzzle.completeChart = async () => ({ success: true })
  try {
    setActivePinia(createPinia())
    const store = usePuzzleStore()
    store.atlasRegionMetadata = atlasMetadata()
    electronApi.puzzle.probeBorderMods = async () => {
      clearedBeforeProbe = !store.edgesRecognized
        && store.edges.N0.status === 'unknown'
        && store.edges.N0.mod === null
        && store.edges.N0.rawTexts.length === 0
      return {
        success: true,
        borderProbe: { attempted: 12, matched: 1, unknown: 11, skipped: false },
        borderMods: {
          N0: { status: 'matched', mod: { lines: ['新海图边缘词缀'] }, confidence: 1, rawTexts: ['新海图 OCR 原文'] }
        }
      }
    }
    store.setAutoProbeBorderMods(true)
    store.applyAnalysisBatch(chartInventory({
      N0: { status: 'matched', mod: { lines: ['旧海图边缘词缀'] }, confidence: 1, rawTexts: ['旧海图 OCR 原文'] }
    }))
    await new Promise(resolve => setTimeout(resolve, 40))

    const response = await store.completeCurrentChart()

    assert.equal(response.success, true)
    assert.equal(clearedBeforeProbe, true)
    assert.equal(store.edgesRecognized, true)
    assert.equal(store.edges.N0.mod.lines[0], '新海图边缘词缀')
    assert.deepEqual(store.edges.N0.rawTexts, ['新海图 OCR 原文'])
  } finally {
    electronApi.puzzle.completeChart = originalComplete
    electronApi.puzzle.probeBorderMods = originalProbe
  }
})

test('完成海图后的自动识别失败时保持边缘词缀清空', async () => {
  const originalComplete = electronApi.puzzle.completeChart
  const originalProbe = electronApi.puzzle.probeBorderMods
  electronApi.puzzle.completeChart = async () => ({ success: true })
  electronApi.puzzle.probeBorderMods = async () => ({
    success: false,
    borderProbe: { skipped: true, reason: 'OCR_FAILED' },
    error: { code: 'BORDER_PROBE_FAILED', message: '边缘词缀识别失败' }
  })
  try {
    setActivePinia(createPinia())
    const store = usePuzzleStore()
    store.atlasRegionMetadata = atlasMetadata()
    store.applyAnalysisBatch(chartInventory({
      N0: { status: 'matched', mod: { lines: ['旧海图边缘词缀'] }, confidence: 1, rawTexts: ['旧海图 OCR 原文'] }
    }))
    await new Promise(resolve => setTimeout(resolve, 40))

    const response = await store.completeCurrentChart()

    assert.equal(response.success, true)
    assert.equal(response.borderProbe.skipped, true)
    assert.equal(store.edgesRecognized, false)
    assert.equal(store.edges.N0.mod, null)
    assert.deepEqual(store.edges.N0.rawTexts, [])
  } finally {
    electronApi.puzzle.completeChart = originalComplete
    electronApi.puzzle.probeBorderMods = originalProbe
  }
})

test('独立边缘识别期间拒绝完成当前海图并保留库存', async () => {
  const originalProbe = electronApi.puzzle.probeBorderMods
  let finishProbe
  electronApi.puzzle.probeBorderMods = () => new Promise(resolve => { finishProbe = resolve })
  try {
    setActivePinia(createPinia())
    const store = usePuzzleStore()
    store.applyAnalysisBatch(chartInventory())
    await new Promise(resolve => setTimeout(resolve, 40))
    const occupiedBefore = store.inventoryPages[1].slots.filter(slot => slot.occupied).length

    const probing = store.probeBorderMods({ configurationGuideBypass: true })
    assert.equal(store.probingBorder, true)
    const response = await store.completeCurrentChart()

    assert.equal(response.success, false)
    assert.equal(store.inventoryPages[1].slots.filter(slot => slot.occupied).length, occupiedBefore)
    finishProbe({ success: false, error: { code: 'BORDER_PROBE_FAILED', message: '测试结束' } })
    await probing
  } finally {
    electronApi.puzzle.probeBorderMods = originalProbe
  }
})
})()
