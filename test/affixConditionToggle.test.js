import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeAffixCondition, normalizeAffixGroup, normalizeModuleTwo, cloneAffixGroup, affixGroupItemLevelRequirement, hasEffectiveAffixGroups } from '../src/domains/items/affixConfig.js'
import { matchAffixes } from '../electron/modules/item/matcher.js'
import { createPresetSectionData, planPresetImport } from '../src/domains/settings/configTransfer/presets.js'
import { createConfigBundle, serializeConfigBundle, parseConfigBundle } from '../src/domains/settings/configTransfer/core.js'

const item = { modifiers: [{ type: 'prefix', name: '生命', text: '+89 最大生命', tier: 2 }, { type: 'suffix', name: '抗性', text: '+35% 火焰抗性', tier: 3 }] }
const condition = (keyword, enabled = true) => normalizeAffixCondition({ keyword, enabled })

test('旧词缀默认开启，关闭状态经过保存及复制保留', () => {
  assert.equal(normalizeAffixCondition('生命').enabled, true)
  assert.equal(normalizeAffixCondition({ keyword: '生命' }).enabled, true)
  const original = normalizeModuleTwo({ affixGroups: [{ requiredAffixes: [condition('生命', false)] }] })
  const restored = normalizeModuleTwo(JSON.parse(JSON.stringify(original)))
  assert.deepEqual(restored, original)
  const copy = cloneAffixGroup(restored.affixGroups[0], 1)
  assert.equal(copy.requiredAffixes[0].enabled, false)
  assert.notEqual(copy.requiredAffixes[0].id, original.affixGroups[0].requiredAffixes[0].id)
})

test('关闭词缀不参与必选、挑选及高亮，重新开启恢复要求', () => {
  const group = { requiredAffixes: [condition('最大生命'), condition('冰霜抗性', false)], selectedAffixes: [condition('火焰抗性', false)], selectedCount: 1 }
  const result = matchAffixes(item, [group])
  assert.equal(result.isMatch, true)
  assert.equal(result.groupResults[0].requiredCount, 1)
  assert.equal(result.groupResults[0].selectedCount, 0)
  assert.equal(result.matchedModTexts.some(text => text.includes('火焰抗性')), false)
  group.requiredAffixes[1].enabled = true
  assert.equal(matchAffixes(item, [group]).isMatch, false)
})

test('包含数下调持久化，重新开启不自动调高', () => {
  const group = normalizeAffixGroup({ selectedAffixes: ['生命', '火焰抗性', '冰霜抗性'], selectedCount: 3 })
  group.selectedAffixes[2].enabled = false
  const reduced = normalizeAffixGroup(group)
  assert.equal(reduced.selectedCount, 2)
  assert.equal(matchAffixes(item, [group]).isMatch, true)
  reduced.selectedAffixes[2].enabled = true
  assert.equal(normalizeAffixGroup(reduced).selectedCount, 2)
})

test('全部关闭忽略该组，其他组合仍可命中，组开关仍生效', () => {
  const empty = normalizeAffixGroup({ requiredAffixes: [condition('生命', false)], selectedAffixes: [condition('抗性', false)] })
  assert.equal(empty.selectedCount, 1)
  assert.equal(hasEffectiveAffixGroups({ affixGroups: [empty] }), false)
  assert.equal(matchAffixes(item, [empty]).isMatch, false)
  assert.deepEqual(matchAffixes(item, [empty]).groupResults, [])
  const active = normalizeAffixGroup({ requiredAffixes: ['生命'] })
  assert.equal(matchAffixes(item, [empty, active]).isMatch, true)
  active.enabled = false
  assert.equal(matchAffixes(item, [empty, active]).isMatch, false)
})

test('最低物等及未知提示均忽略关闭条件', () => {
  const high = normalizeAffixCondition({ kind: 'catalog', effectPattern: '+# 最大生命', enabled: false, tiers: [{ tier: 1, requiredLevel: 84 }] })
  const group = { requiredAffixes: [high, condition('自定义', false)] }
  assert.deepEqual(affixGroupItemLevelRequirement(group), { level: null, hasUnknown: false, hasEffectiveConditions: false })
  high.enabled = true
  assert.equal(affixGroupItemLevelRequirement(group).level, 84)
})

for (const kind of ['item', 'essence', 'harvest']) {
  test(`${kind} 预设导出导入保留关闭词条和阶级`, () => {
    const group = normalizeAffixGroup({ requiredAffixes: [{ kind: 'catalog', keyword: '生命', effectPattern: '+# 最大生命', enabled: false, minTier: 2, tiers: [{ tier: 2, requiredLevel: 60 }] }] })
    const preset = { id: 'test', name: '开关测试', ...(kind === 'item' ? { moduleTwo: { affixGroups: [group] } } : { affixGroups: [group] }) }
    const sectionId = `preset.${kind}`
    const bundle = createConfigBundle({ sections: { [sectionId]: { data: createPresetSectionData(sectionId, [preset]) } } })
    const parsed = parseConfigBundle(serializeConfigBundle(bundle))
    const imported = planPresetImport(sectionId, parsed.bundle.sections[sectionId].data).imported[0]
    const actual = (kind === 'item' ? imported.moduleTwo : imported).affixGroups[0].requiredAffixes[0]
    assert.equal(actual.enabled, false)
    assert.equal(actual.minTier, 2)
    assert.deepEqual(actual.tiers, group.requiredAffixes[0].tiers)
  })
}
