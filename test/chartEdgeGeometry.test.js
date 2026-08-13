import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BORDER_EDGE_IDS,
  DEFAULT_EDGE_OFFSET_RATIO,
  computeBorderEdgeTargets
} from '../src/utils/chartEdgeGeometry.js'

const REGION = { left: 100, top: 200, right: 925, bottom: 1028 }

test('返回 12 段外边缘且顺序为 N/E/S/W', () => {
  const edges = computeBorderEdgeTargets(REGION)
  assert.deepEqual(edges.map(edge => edge.id), BORDER_EDGE_IDS)
  assert.equal(edges.length, 12)
})

test('825×828 标定区域沿对应方向外移 6% 后仍为 50 像素', () => {
  const edges = computeBorderEdgeTargets(REGION)
  const north = edges.filter(edge => edge.direction === 'north')
  const south = edges.filter(edge => edge.direction === 'south')
  const west = edges.filter(edge => edge.direction === 'west')
  const east = edges.filter(edge => edge.direction === 'east')

  assert.equal(DEFAULT_EDGE_OFFSET_RATIO, 0.06)
  assert.deepEqual(north.map(edge => edge.y), [150, 150, 150])
  assert.deepEqual(south.map(edge => edge.y), [1078, 1078, 1078])
  assert.deepEqual(west.map(edge => edge.x), [50, 50, 50])
  assert.deepEqual(east.map(edge => edge.x), [975, 975, 975])
})

test('不同海图区尺寸按宽高的 6% 缩放热点', () => {
  const cases = [
    { width: 550, height: 552, offsetX: 33, offsetY: 33 },
    { width: 688, height: 690, offsetX: 41, offsetY: 41 },
    { width: 1100, height: 1104, offsetX: 66, offsetY: 66 }
  ]
  for (const entry of cases) {
    const region = { left: 200, top: 300, right: 200 + entry.width, bottom: 300 + entry.height }
    const edges = computeBorderEdgeTargets(region)
    assert.equal(edges.find(edge => edge.id === 'N0').y, region.top - entry.offsetY)
    assert.equal(edges.find(edge => edge.id === 'S0').y, region.bottom + entry.offsetY)
    assert.equal(edges.find(edge => edge.id === 'W0').x, region.left - entry.offsetX)
    assert.equal(edges.find(edge => edge.id === 'E0').x, region.right + entry.offsetX)
  }
})

test('非正方形区域分别按宽度和高度计算横纵偏移', () => {
  const region = { left: 100, top: 200, right: 1100, bottom: 700 }
  const edges = computeBorderEdgeTargets(region)
  assert.equal(edges.find(edge => edge.id === 'N0').y, 170)
  assert.equal(edges.find(edge => edge.id === 'S0').y, 730)
  assert.equal(edges.find(edge => edge.id === 'W0').x, 40)
  assert.equal(edges.find(edge => edge.id === 'E0').x, 1160)
})

test('超出包含负坐标的显示器边界时钳制到屏幕内', () => {
  const screenBounds = { x: -1000, y: 0, width: 1000, height: 800 }
  const region = { left: -990, top: 10, right: -90, bottom: 790 }
  const edges = computeBorderEdgeTargets(region, screenBounds)
  for (const edge of edges) {
    assert.ok(edge.x >= -1000 && edge.x < 0, `${edge.id} x 越界: ${edge.x}`)
    assert.ok(edge.y >= 0 && edge.y < 800, `${edge.id} y 越界: ${edge.y}`)
  }
  assert.equal(edges.find(edge => edge.id === 'N0').y, 0)
  assert.equal(edges.find(edge => edge.id === 'S0').y, 799)
  assert.equal(edges.find(edge => edge.id === 'W0').x, -1000)
  assert.equal(edges.find(edge => edge.id === 'E0').x, -36)
})

test('无效区域返回空数组', () => {
  assert.deepEqual(computeBorderEdgeTargets(null), [])
  assert.deepEqual(computeBorderEdgeTargets({ left: 10, top: 10, right: 10, bottom: 20 }), [])
})

test('自定义偏移比例生效', () => {
  const edges = computeBorderEdgeTargets(REGION, null, 0.1)
  assert.equal(edges.find(edge => edge.id === 'N0').y, 117)
  assert.equal(edges.find(edge => edge.id === 'W0').x, 17)
})
