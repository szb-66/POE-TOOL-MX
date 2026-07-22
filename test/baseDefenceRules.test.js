import test from 'node:test'
import assert from 'node:assert/strict'
import {
  inferBaseDefencePercentile,
  isBaseDefenceEntry,
  rerollBaseDefences,
  rollBaseEntriesWithDefencePercentile
} from '../electron/modules/crafting/equipmentPropertyRules.js'

const definitions = [
  { id: 'armour', label: '护甲', text: '护甲: #', values: [{ min: 100, max: 130 }] },
  { id: 'evasion', label: '闪避值', text: '闪避值: #', values: [{ min: 50, max: 60 }] },
  { id: 'movement', label: '移动速度', text: '移动速度: #%', values: [{ min: -3, max: -1 }] }
]

test('基础防御识别只包含护甲、闪避、能盾和结界', () => {
  for (const label of ['护甲', '闪避值', '能量护盾', '结界']) assert.equal(isBaseDefenceEntry({ label }), true)
  for (const label of ['移动速度', '格挡几率', '物理伤害']) assert.equal(isBaseDefenceEntry({ label }), false)
})

test('混合防具使用同一个基础防御百分比并保持整数范围', () => {
  const low = rollBaseEntriesWithDefencePercentile(definitions, () => 0)
  assert.equal(low.percentile, 0)
  assert.deepEqual(low.entries.map((entry) => entry.rolledValues[0]), [100, 50, -3])

  const high = rollBaseEntriesWithDefencePercentile(definitions, () => 0.999999)
  assert.equal(high.percentile, 100)
  assert.deepEqual(high.entries.map((entry) => entry.rolledValues[0]), [130, 60, -1])

  const middle = rollBaseEntriesWithDefencePercentile(definitions, () => 0.5)
  assert.equal(middle.entries[0].rolledValues[0], 115)
  assert.equal(middle.entries[1].rolledValues[0], 55)
  assert.equal(inferBaseDefencePercentile(middle.entries), middle.percentile)
})

test('重骰基础防御不会修改非防御属性', () => {
  const initial = rollBaseEntriesWithDefencePercentile(definitions, () => 0).entries
  const rerolled = rerollBaseDefences(initial, () => 0.999999)
  assert.equal(rerolled.percentile, 100)
  assert.deepEqual(rerolled.entries.slice(0, 2).map((entry) => entry.rolledValues[0]), [130, 60])
  assert.deepEqual(rerolled.entries[2], initial[2])
  assert.notStrictEqual(rerolled.entries[2], initial[2])
})

test('没有可变基础防御时不设置百分比', () => {
  const fixed = [{ id: 'block', label: '格挡几率', text: '格挡几率: #%', values: [{ min: 24, max: 24 }] }]
  const result = rollBaseEntriesWithDefencePercentile(fixed, () => 0.5)
  assert.equal(result.percentile, null)
  assert.equal(inferBaseDefencePercentile(result.entries), null)
})
