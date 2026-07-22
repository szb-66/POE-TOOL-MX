import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TAINTED_CURRENCIES, applyTaintedFusing, applyTaintedJewellers, largestLinkSize,
  rerollTaintedSocketColours, taintedCommonReason
} from '../electron/modules/crafting/taintedRules.js'
import { CORRUPTED_BENCH_RECIPES, applyCorruptedBenchRecipe } from '../electron/modules/crafting/corruptedBenchRules.js'

const sockets = (colors) => colors.map((color, index) => ({ id: `socket:${index + 1}`, color }))

test('当前污秽目录区分可执行、未知概率和缺失模型，且不包含已移除祝福', () => {
  assert.equal(TAINTED_CURRENCIES.length, 9)
  assert.equal(TAINTED_CURRENCIES.filter((entry) => entry.supportLevel === 'supported').length, 3)
  assert.equal(TAINTED_CURRENCIES.filter((entry) => entry.supportLevel === 'known-effect-unknown-odds').length, 5)
  assert.equal(TAINTED_CURRENCIES.filter((entry) => entry.supportLevel === 'missing-item-model').length, 1)
  assert.equal(TAINTED_CURRENCIES.some((entry) => /祝福/.test(entry.name)), false)
})

test('污秽幻色等权骰色且不改变孔标识和连接', () => {
  const state = { sockets: sockets(['W', 'R', 'G']), links: [['socket:1', 'socket:2'], ['socket:3']] }
  const links = structuredClone(state.links)
  rerollTaintedSocketColours(state, (() => { const values = [0, 0.34, 0.99]; return () => values.shift() })())
  assert.deepEqual(state.sockets.map((socket) => socket.color), ['R', 'G', 'B'])
  assert.deepEqual(state.sockets.map((socket) => socket.id), ['socket:1', 'socket:2', 'socket:3'])
  assert.deepEqual(state.links, links)
})

test('污秽工匠和链结在中间状态按 50% 增减并在边界强制合法方向', () => {
  const base = { socketLimit: 6, requirements: {} }
  let state = { sockets: sockets(['R', 'G', 'B']), links: [['socket:1'], ['socket:2'], ['socket:3']] }
  assert.equal(applyTaintedJewellers(state, base, 100, () => 0.1).direction, 'add')
  assert.equal(state.sockets.length, 4)
  assert.equal(applyTaintedJewellers(state, base, 100, () => 0.9).direction, 'remove')
  assert.equal(state.sockets.length, 3)

  state.links = state.sockets.map((socket) => [socket.id])
  assert.equal(applyTaintedFusing(state, () => 0.9).direction, 'add')
  assert.equal(largestLinkSize(state), 2)
  assert.equal(applyTaintedFusing(state, () => 0.9).direction, 'remove')
  assert.equal(largestLinkSize(state), 1)
  state.links = [state.sockets.map((socket) => socket.id)]
  assert.equal(applyTaintedFusing(state, () => 0).direction, 'remove')
  assert.equal(largestLinkSize(state), 2)
})

test('腐化工艺台定义包含 5 定孔、5 定连、18 定色及等量瓦尔成本', () => {
  assert.equal(CORRUPTED_BENCH_RECIPES.length, 28)
  for (const recipe of CORRUPTED_BENCH_RECIPES) {
    assert.equal(recipe.cost.length, 2)
    assert.equal(recipe.cost[0].amount, recipe.cost[1].amount)
    assert.equal(recipe.cost[1].resourceId, 'currency:vaal')
  }
  const base = { socketLimit: 6, requirements: { strength: 100 } }
  const state = { sockets: sockets(['G', 'B']), links: [['socket:1'], ['socket:2']] }
  applyCorruptedBenchRecipe(state, base, CORRUPTED_BENCH_RECIPES.find((entry) => entry.id === 'corrupted-bench:sockets:6'), () => 0)
  assert.equal(state.sockets.length, 6)
  applyCorruptedBenchRecipe(state, base, CORRUPTED_BENCH_RECIPES.find((entry) => entry.id === 'corrupted-bench:links:6'), () => 0)
  assert.equal(largestLinkSize(state), 6)
  applyCorruptedBenchRecipe(state, base, CORRUPTED_BENCH_RECIPES.find((entry) => entry.id === 'corrupted-bench:colours:2b1r'), () => 0)
  assert.deepEqual(state.sockets.slice(0, 3).map((socket) => socket.color), ['B', 'B', 'R'])
})

test('污秽通货公共门禁区分未腐化与镜像', () => {
  assert.match(taintedCommonReason({ state: { corrupted: false, mirrored: false } }), /已腐化/)
  assert.match(taintedCommonReason({ state: { corrupted: true, mirrored: true } }), /镜像/)
  assert.equal(taintedCommonReason({ state: { corrupted: true, mirrored: false } }), '')
})

