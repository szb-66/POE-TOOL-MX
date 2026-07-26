import test from 'node:test'
import assert from 'node:assert/strict'
import { affixTierSummary, effectLines, formatProbability, rolledTextWithRanges } from '../src/domains/crafting/displayFormat.js'

test('词缀效果逐行且阶级摘要包含所有范围', () => {
  const affix = { tier: 1, tierName: 'T1 女皇的', text: '效果一\n效果二', valueRanges: [{ min: 1, max: 2 }, { min: 3, max: 4 }] }
  assert.deepEqual(effectLines(affix), ['效果一', '效果二'])
  assert.equal(affixTierSummary(affix), 'T1 女皇的 [1-2] 到 [3-4]')
  assert.equal(formatProbability(0.01256), '1.256%')
  assert.equal(formatProbability(0.05), '5.000%')
  assert.equal(formatProbability(0), '0.000%')
})

test('固有词缀当前值后显示可变范围且不重复固定范围', () => {
  assert.equal(rolledTextWithRanges({ rolledText: '法术伤害提高 12%', rolledValues: [12], valueRanges: [{ min: 12, max: 14 }] }), '法术伤害提高 12(12-14)%')
  assert.equal(rolledTextWithRanges({ rolledText: '+8 最大生命', rolledValues: [8], valueRanges: [{ min: 8, max: 8 }] }), '+8 最大生命')
})
