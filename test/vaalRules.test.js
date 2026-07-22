import test from 'node:test'
import assert from 'node:assert/strict'
import {
  VAAL_OUTCOMES, corruptedImplicitCandidates, replaceImplicitWithVaal,
  rollCorruptedImplicit, rollVaalOutcome, whitenSockets
} from '../electron/modules/crafting/vaalRules.js'

test('四种瓦尔主结果使用等宽区间', () => {
  assert.deepEqual(VAAL_OUTCOMES.map((_, index) => rollVaalOutcome(() => (index + 0.1) / 4)), VAAL_OUTCOMES)
})

test('腐化隐式按类别、等级和权重过滤并掷值', () => {
  const dataset = { corruptedImplicitFamilies: [{
    id: 'family:life', name: '生命', itemClasses: ['Ring'], displayTags: [{ id: 'life', label: '生命' }],
    tiers: [
      { id: 'tier:high', tier: 1, requiredLevel: 80, text: '+(20—30) 最大生命', values: [{ min: 20, max: 30 }], weights: { Ring: 500 } },
      { id: 'tier:low', tier: 2, requiredLevel: 1, text: '+(10—15) 最大生命', values: [{ min: 10, max: 15 }], weights: { Ring: 1000 } }
    ]
  }] }
  assert.equal(corruptedImplicitCandidates(dataset, { itemClass: 'Ring' }, 79).length, 1)
  assert.equal(corruptedImplicitCandidates(dataset, { itemClass: 'Wand' }, 100).length, 0)
  const rolled = rollCorruptedImplicit(dataset, { itemClass: 'Ring' }, 79, () => 0.5)
  assert.equal(rolled.tierId, 'tier:low')
  assert.ok(rolled.rolledValues[0] >= 10 && rolled.rolledValues[0] <= 15)
})

test('腐化隐式只替换一个既有隐式槽', () => {
  const state = {
    baseImplicits: [{ id: 'base:a', rolledText: '基础 A' }],
    implicits: ['synth:a'],
    eldritchImplicits: { exarch: { tierId: 'exarch:a', rolledText: '焚界 A' }, eater: null },
    vaalImplicit: null
  }
  const replaced = replaceImplicitWithVaal(state, { familyId: 'vaal:a' }, () => 0)
  assert.deepEqual(replaced, { source: 'base', id: 'base:a', text: '基础 A' })
  assert.equal(state.baseImplicits.length, 0)
  assert.equal(state.eldritchImplicits.exarch.tierId, 'exarch:a')
  assert.equal(state.vaalImplicit.familyId, 'vaal:a')
  const synthesized = { baseImplicits: [], implicits: ['synth:a'], eldritchImplicits: { exarch: null, eater: null }, vaalImplicit: null }
  assert.equal(replaceImplicitWithVaal(synthesized, { familyId: 'vaal:b' }, () => 0).source, 'synthesized')
  assert.deepEqual(synthesized.implicits, [])
  const gilded = { baseImplicits: [], implicits: ['物品会被商贩高价购买'], eldritchImplicits: { exarch: null, eater: null }, vaalImplicit: null }
  assert.equal(replaceImplicitWithVaal(gilded, { familyId: 'vaal:c' }, () => 0).source, 'gilded')
  assert.deepEqual(gilded.implicits, [])
})

test('白孔保证一个非白孔并对其余插槽逐个判定', () => {
  const state = { sockets: ['R', 'G', 'B'].map((color, index) => ({ id: `socket:${index + 1}`, color })) }
  const rolls = [0.5, 0.05, 0.5]
  const changed = whitenSockets(state, () => rolls.shift())
  assert.deepEqual(changed, [1, 0])
  assert.deepEqual(state.sockets.map((socket) => socket.color), ['W', 'W', 'B'])
  assert.deepEqual(whitenSockets({ sockets: [] }, () => 0), [])
})
