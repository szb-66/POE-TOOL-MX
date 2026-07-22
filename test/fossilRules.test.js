import test from 'node:test'
import assert from 'node:assert/strict'
import { CHAOTIC_RESONATORS, FOSSIL_DEFINITIONS, createFossilCrafts, createFossilPoolTransform, fossilWeightMultiplier } from '../electron/modules/crafting/fossilRules.js'
import { normalizeCraftDefinition } from '../electron/modules/crafting/model.js'

const entry = (tags, requiredLevel = 1, weight = 100) => ({ modifier: { source: 'natural', tags }, tier: { requiredLevel }, weight })
const fossil = (id) => FOSSIL_DEFINITIONS.find((item) => item.id === id)

test('当前化石和混乱共振器定义完整且可进入数据模型', () => {
  assert.equal(FOSSIL_DEFINITIONS.length, 25)
  assert.equal(new Set(FOSSIL_DEFINITIONS.map((item) => item.id)).size, 25)
  assert.deepEqual(CHAOTIC_RESONATORS.map((item) => item.sockets), [1, 2, 3, 4])
  assert.equal(FOSSIL_DEFINITIONS.find((item) => item.id === 'bloodstained').supported, true)
  assert.equal(createFossilCrafts().length, 29)
  assert.equal(normalizeCraftDefinition(createFossilCrafts()[0]).provider, 'fossil')
})

test('更多、更少、禁止和复合标签按乘数叠加', () => {
  assert.equal(fossilWeightMultiplier(entry(['fire']).modifier, entry(['fire']).tier, [fossil('scorched')]), 10)
  assert.equal(fossilWeightMultiplier(entry(['attack']).modifier, entry(['attack']).tier, [fossil('aetheric')]), 0.15)
  assert.equal(fossilWeightMultiplier(entry(['fire', 'cold']).modifier, entry(['fire', 'cold']).tier, [fossil('scorched')]), 0)
  assert.equal(fossilWeightMultiplier(entry(['physical', 'ailment']).modifier, entry([]).tier, [fossil('corroded')]), 10)
  assert.equal(fossilWeightMultiplier(entry(['physical']).modifier, entry([]).tier, [fossil('corroded')]), 1)
  assert.equal(fossilWeightMultiplier(entry(['elemental']).modifier, entry([]).tier, [fossil('prismatic')]), 6)
  assert.equal(fossilWeightMultiplier(entry(['caster', 'speed']).modifier, entry([]).tier, [fossil('aetheric'), fossil('shuddering')]), 100)
})

test('禁止优先、非标签和圣洁等级权重准确变换', () => {
  const blockedPool = createFossilPoolTransform([fossil('scorched'), fossil('frigid')])([entry(['fire'])])
  assert.equal(blockedPool.length, 0)
  assert.equal(createFossilPoolTransform([fossil('opulent')])([entry([])]).length, 0)
  assert.equal(fossilWeightMultiplier(entry(['life'], 80).modifier, entry([], 80).tier, [fossil('sanctified')]), 1.4)
  assert.equal(fossilWeightMultiplier(entry(['life'], 20).modifier, entry([], 20).tier, [fossil('sanctified')]), 0.8)
})
