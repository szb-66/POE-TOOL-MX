import test from 'node:test'
import assert from 'node:assert/strict'
import { affixTierItemLevelLabel, normalizeAffixCondition, affixConditionItemLevelRequirement } from '../src/domains/items/affixConfig.js'

const catalog = { kind: 'catalog', keyword: '生命', effectPattern: '+# 最大生命', tiers: [
  { tier: 7, requiredLevel: 1 }, { tier: 2, requiredLevel: 60 }, { tier: 1, requiredLevel: 82 }, { tier: 3, requiredLevel: 40 }
] }

test('阶级标签覆盖指定、不限、清空和未知数据', () => {
  assert.equal(affixTierItemLevelLabel(catalog, 2), '最低 T2 (60)')
  assert.equal(affixTierItemLevelLabel(catalog, 1), '最低 T1 (82)')
  assert.equal(affixTierItemLevelLabel(catalog, 3), '最低 T3 (40)')
  assert.equal(affixTierItemLevelLabel(catalog), '不限 T (1)')
  assert.equal(affixTierItemLevelLabel(catalog, ''), '不限 T (1)')
  const unknown = normalizeAffixCondition({ ...catalog, tiers: [{ tier: 2 }] })
  assert.equal(affixTierItemLevelLabel(unknown, 2), '最低 T2 (未知)')
  assert.equal(affixTierItemLevelLabel(unknown), '不限 T (未知)')
  assert.equal(affixTierItemLevelLabel({ ...catalog, tiers: [] }), '不限 T (未知)')
})

test('完整目录数据的阶级标签等级与制作物等校验一致', () => {
  for (const minTier of [1, 2, 3, 7, null, '']) {
    const condition = normalizeAffixCondition({ ...catalog, minTier })
    const requirement = affixConditionItemLevelRequirement(condition)
    assert.equal(requirement.hasUnknown, false)
    assert.ok(affixTierItemLevelLabel(condition, minTier).endsWith(`(${requirement.level})`))
  }
})

test('保存恢复清理关键词的旧阶级，重新选择目录后恢复等级标签', () => {
  const keyword = normalizeAffixCondition({ ...catalog, kind: 'keyword', minTier: 2 })
  assert.equal(keyword.minTier, null)
  assert.deepEqual(keyword.tiers, [])
  assert.equal(affixTierItemLevelLabel(keyword, 2), '')
  assert.equal(affixConditionItemLevelRequirement(keyword).level, null)
  const restored = normalizeAffixCondition(JSON.parse(JSON.stringify(keyword)))
  assert.deepEqual(restored, keyword)
  assert.equal(affixTierItemLevelLabel(normalizeAffixCondition({ ...catalog, minTier: null })), '不限 T (1)')
})
