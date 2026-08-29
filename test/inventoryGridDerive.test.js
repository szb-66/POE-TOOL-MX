import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveInventoryGridFromRegion } from '../src/utils/inventorySettings.js'

test('框选区域换算首格中心与单格宽高', () => {
  const grid = deriveInventoryGridFromRegion({ left: 2004, top: 1055, right: 3204, bottom: 1555 })
  assert.deepEqual(grid, {
    startPos: { x: 2054, y: 1105 },
    slotSize: { w: 100, h: 100 }
  })
})

test('非整除区域按四舍五入取整换算', () => {
  const grid = deriveInventoryGridFromRegion({ left: 2004, top: 1055, right: 3210, bottom: 1561 })
  assert.deepEqual(grid.slotSize, { w: 101, h: 101 })
  assert.deepEqual(grid.startPos, { x: Math.round(2004 + 101 / 2), y: Math.round(1055 + 101 / 2) })
})

test('反向拖动矩形被规范化后换算', () => {
  const grid = deriveInventoryGridFromRegion({ left: 3204, top: 1555, right: 2004, bottom: 1055 })
  assert.deepEqual(grid, {
    startPos: { x: 2054, y: 1105 },
    slotSize: { w: 100, h: 100 }
  })
})

test('区域无效或过小时返回 null', () => {
  assert.equal(deriveInventoryGridFromRegion(null), null)
  assert.equal(deriveInventoryGridFromRegion({ left: 100, top: 100, right: 100, bottom: 100 }), null)
  assert.equal(deriveInventoryGridFromRegion({ left: 100, top: 100, right: 200, bottom: 100 }), null)
  assert.equal(deriveInventoryGridFromRegion({ left: 100, top: 100, right: 100, bottom: 200 }), null)
})
