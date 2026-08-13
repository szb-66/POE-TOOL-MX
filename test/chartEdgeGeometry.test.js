import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BORDER_EDGE_IDS,
  DEFAULT_EDGE_OFFSET_PX,
  computeBorderEdgeTargets
} from '../src/utils/chartEdgeGeometry.js'

const REGION = { left: 100, top: 200, right: 700, bottom: 800 }

test('返回 12 段外边缘且顺序为 N/E/S/W', () => {
  const edges = computeBorderEdgeTargets(REGION)
  assert.deepEqual(edges.map(edge => edge.id), BORDER_EDGE_IDS)
  assert.equal(edges.length, 12)
})

test('北侧边缘在中点上方偏移默认像素', () => {
  const edges = computeBorderEdgeTargets(REGION)
  const north = edges.filter(edge => edge.direction === 'north')
  assert.deepEqual(north.map(edge => edge.x), [200, 400, 600])
  assert.deepEqual(north.map(edge => edge.y), [200 - DEFAULT_EDGE_OFFSET_PX, 200 - DEFAULT_EDGE_OFFSET_PX, 200 - DEFAULT_EDGE_OFFSET_PX])
  assert.equal(DEFAULT_EDGE_OFFSET_PX, 50)
})

test('南侧边缘在中点下方偏移默认像素', () => {
  const edges = computeBorderEdgeTargets(REGION)
  const south = edges.filter(edge => edge.direction === 'south')
  assert.deepEqual(south.map(edge => edge.y), [800 + DEFAULT_EDGE_OFFSET_PX, 800 + DEFAULT_EDGE_OFFSET_PX, 800 + DEFAULT_EDGE_OFFSET_PX])
  assert.deepEqual(south.map(edge => edge.x), [200, 400, 600])
})

test('西侧与东侧边缘在段中点外侧偏移默认像素', () => {
  const edges = computeBorderEdgeTargets(REGION)
  const west = edges.filter(edge => edge.direction === 'west')
  const east = edges.filter(edge => edge.direction === 'east')
  assert.deepEqual(west.map(edge => edge.x), [100 - DEFAULT_EDGE_OFFSET_PX, 100 - DEFAULT_EDGE_OFFSET_PX, 100 - DEFAULT_EDGE_OFFSET_PX])
  assert.deepEqual(west.map(edge => edge.y), [300, 500, 700])
  assert.deepEqual(east.map(edge => edge.x), [700 + DEFAULT_EDGE_OFFSET_PX, 700 + DEFAULT_EDGE_OFFSET_PX, 700 + DEFAULT_EDGE_OFFSET_PX])
  assert.deepEqual(east.map(edge => edge.y), [300, 500, 700])
})

test('超出屏幕边界时钳制到屏幕内', () => {
  const screenBounds = { x: 0, y: 0, width: 500, height: 400 }
  const edges = computeBorderEdgeTargets(REGION, 20, screenBounds)
  for (const edge of edges) {
    assert.ok(edge.x >= 0 && edge.x < 500, `${edge.id} x 越界: ${edge.x}`)
    assert.ok(edge.y >= 0 && edge.y < 400, `${edge.id} y 越界: ${edge.y}`)
  }
  const north = edges.find(edge => edge.id === 'N0')
  assert.equal(north.y, 180)
  const west = edges.find(edge => edge.id === 'W0')
  assert.equal(west.x, 80)
})

test('无效区域返回空数组', () => {
  assert.deepEqual(computeBorderEdgeTargets(null), [])
  assert.deepEqual(computeBorderEdgeTargets({ left: 10, top: 10, right: 10, bottom: 20 }), [])
})

test('自定义偏移量生效', () => {
  const edges = computeBorderEdgeTargets(REGION, 40)
  const north = edges.find(edge => edge.id === 'N0')
  assert.equal(north.y, 200 - 40)
})
