import test from 'node:test'
import assert from 'node:assert/strict'
import {
  counterClockwiseTurns,
  gridCellCenter,
  normalizePuzzleOrientation,
  normalizePuzzleSettings,
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
    atlasRegionMetadata: atlas
  })
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
