import test from 'node:test'
import assert from 'node:assert/strict'
import {
  counterClockwiseTurns,
  gridCellCenter,
  normalizePuzzleTabPoints,
  normalizePuzzleOrientation,
  normalizePuzzleSettings,
  validatePuzzleTabPoint,
  validatePuzzleRegionEnvironment
} from '../src/utils/puzzleConfig.js'

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
    recognition: { strength: 'standard' },
    inventoryTabPoints: { 1: null, 2: null },
    autoProbeBorderMods: true
  })
})

test('旧配置缺少识别强度时默认标准档', () => {
  const inventory = metadata({ left: -700, top: 20, right: -100, bottom: 1020 })
  assert.deepEqual(normalizePuzzleSettings({ inventoryRegionMetadata: inventory }), {
    inventoryRegionMetadata: inventory,
    atlasRegionMetadata: null,
    recognition: { strength: 'standard' },
    inventoryTabPoints: { 1: null, 2: null },
    autoProbeBorderMods: true
  })
  assert.deepEqual(normalizePuzzleSettings({ inventoryRegionMetadata: inventory, recognition: { strength: 'sensitive' } }).recognition, { strength: 'sensitive' })
  assert.deepEqual(normalizePuzzleSettings({ inventoryRegionMetadata: inventory, recognition: { strength: 'unknown' } }).recognition, { strength: 'standard' })
})

test('完成后自动识别默认开启且可显式关闭', () => {
  const inventory = metadata({ left: -700, top: 20, right: -100, bottom: 1020 })
  assert.equal(normalizePuzzleSettings({ inventoryRegionMetadata: inventory }).autoProbeBorderMods, true)
  assert.equal(normalizePuzzleSettings({ inventoryRegionMetadata: inventory, autoProbeBorderMods: false }).autoProbeBorderMods, false)
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
