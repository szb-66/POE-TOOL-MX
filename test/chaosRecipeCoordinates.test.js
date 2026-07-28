import test from 'node:test'
import assert from 'node:assert/strict'
import { enrichPlanCoordinates, itemGridBounds } from '../electron/modules/chaosRecipe/coordinates.js'
import {
  missingCalibrationKeys,
  resolveStashGridLayout
} from '../electron/modules/chaosRecipe/layout.js'

test('普通仓库按 12x12 换算物品范围和点击中心', () => {
  assert.deepEqual(
    itemGridBounds({ x: 2, y: 3, width: 2, height: 3 }, { left: -1200, top: 100, right: 0, bottom: 1300 }, 12),
    { x: -1000, y: 400, width: 200, height: 300, clickX: -900, clickY: 550 }
  )
})

test('大型仓库在共用区域内使用 24x24 网格', () => {
  const plan = enrichPlanCoordinates({
    tabs: [{
      tabType: 'quad',
      items: [{ x: 23, y: 23, width: 1, height: 1 }]
    }]
  }, { root: { left: 0, top: 0, right: 2400, bottom: 2400 } })
  assert.equal(plan.tabs[0].items[0].screen.clickX, 2350)
  assert.equal(plan.tabs[0].items[0].screen.clickY, 2350)
})

test('普通和大型仓库按目录层级共用两套区域并保持各自网格密度', () => {
  const calibration = {
    root: { left: 0, top: 0, right: 1200, bottom: 1200 },
    folder: { left: 200, top: 200, right: 1400, bottom: 1400 }
  }
  const layouts = [
    resolveStashGridLayout({ type: 'normal', inFolder: false }, calibration),
    resolveStashGridLayout({ type: 'quad', inFolder: false }, calibration),
    resolveStashGridLayout({ type: 'normal', inFolder: true }, calibration),
    resolveStashGridLayout({ type: 'quad', inFolder: true }, calibration)
  ]

  assert.deepEqual(layouts.map(({ calibrationKey, columns, region }) => [
    calibrationKey, columns, region.left
  ]), [
    ['root', 12, 0],
    ['root', 24, 0],
    ['folder', 12, 200],
    ['folder', 24, 200]
  ])
})

test('混合仓库计划缺少任一对应校准时拒绝坐标换算', () => {
  const tabs = [
    { tabType: 'normal', inFolder: false },
    { tabType: 'quad', inFolder: true }
  ]
  assert.deepEqual(missingCalibrationKeys(tabs, {
    root: { left: 0, top: 0, right: 1200, bottom: 1200 }
  }), ['folder'])

  assert.throws(() => enrichPlanCoordinates({
    tabs: [{
      ...tabs[1],
      items: [{ x: 0, y: 0, width: 1, height: 1 }]
    }]
  }, {
    root: { left: 0, top: 0, right: 1200, bottom: 1200 }
  }), { code: 'CALIBRATION_REQUIRED' })
})
