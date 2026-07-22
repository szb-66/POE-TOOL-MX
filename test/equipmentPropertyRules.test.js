import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SOCKET_MODEL_VERSION, createSockets, displayedBaseStats, fullLinks, itemLevelSocketLimit, linkSizeWeights,
  naturalSocketLimit, qualityGainForItemLevel, rerollEntriesDifferent, rollBaseEntries, rollLinks,
  rollSocketCount, socketColorWeights, socketCountWeights
} from '../electron/modules/crafting/equipmentPropertyRules.js'

test('基础范围和品质公式可复现', () => {
  const definitions = [{ id: 'armour', label: '护甲', kind: 'property', text: '护甲: 10—20', values: [{ min: 10, max: 20 }] }]
  assert.deepEqual(rollBaseEntries(definitions, () => 0.5)[0].rolledValues, [15])
  assert.equal(qualityGainForItemLevel(1, () => 0), 20)
  assert.equal(qualityGainForItemLevel(100, () => 0.99), 1)
  const state = { quality: 20, baseStats: rollBaseEntries(definitions, () => 0.5) }
  assert.deepEqual(displayedBaseStats(state, { qualityType: 'armour' })[0].displayValues, [18])
})

test('物品等级和类型共同限制孔数', () => {
  assert.deepEqual([1, 2, 24, 25, 35, 50].map(itemLevelSocketLimit), [2, 3, 3, 4, 5, 6])
  assert.equal(naturalSocketLimit({ socketLimit: 6 }, 24), 3)
  assert.equal(naturalSocketLimit({ socketLimit: 4 }, 100), 4)
  assert.equal(naturalSocketLimit({ socketLimit: 0 }, 100), 0)
})

test('孔色按属性需求偏向且无需求等权', () => {
  assert.deepEqual(socketColorWeights({}), { R: 1, G: 1, B: 1 })
  const weights = socketColorWeights({ strength: 100, dexterity: 0, intelligence: 0 })
  assert.ok(weights.R > weights.G && weights.G === weights.B)
  assert.equal(createSockets(2, { strength: 100 }, () => 0)[0].color, 'R')
})

test('珠宝匠和链接经验模型版本化且品质单调改善高结果权重', () => {
  assert.match(SOCKET_MODEL_VERSION, /3\.28/)
  assert.ok(socketCountWeights(6, 20).at(-1).weight > socketCountWeights(6, 0).at(-1).weight)
  assert.ok(linkSizeWeights(6, 20).at(-1).weight > linkSizeWeights(6, 0).at(-1).weight)
  assert.notEqual(rollSocketCount(4, 0, 1, () => 0), 1)
  const sockets = createSockets(4, {}, () => 0)
  assert.deepEqual(fullLinks(sockets), [['socket:1', 'socket:2', 'socket:3', 'socket:4']])
  assert.equal(rollLinks(sockets, 0, () => 0).flat().length, 4)
})

test('祝福重掷保证可变固有词缀至少一值变化', () => {
  const source = rollBaseEntries([{ id: 'implicit', label: '固有', kind: 'implicit', text: '+(10—15)% 抗性', values: [{ min: 10, max: 15 }] }], () => 0)
  const result = rerollEntriesDifferent(source, () => 0)
  assert.equal(result.changed, true)
  assert.notDeepEqual(result.entries[0].rolledValues, source[0].rolledValues)
})
