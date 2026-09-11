import test from 'node:test'
import assert from 'node:assert/strict'
import { CraftingDataRepository } from '../electron/modules/crafting/dataRepository.js'
import { matchAffixes } from '../electron/modules/item/matcher.js'
import { normalizeAffixCondition, normalizeModuleTwo, affixConditionItemLevelRequirement } from '../src/domains/items/affixConfig.js'

const modifier = (id, overrides = {}) => ({
  id, name: id, effectKey: '每秒再生 # 魔力', affixType: 'suffix', source: 'natural',
  modifierProfileId: id, tiers: [
    { tier: 1, requiredLevel: 80, name: '高阶', text: '每秒再生 (6–8) 魔力' },
    { tier: 2, requiredLevel: 60, name: '低阶', text: '每秒再生 (3–5) 魔力' }
  ], ...overrides
})
function repositoryFor(modifiers) {
  const repository = new CraftingDataRepository()
  repository.getDataset = () => ({ bases: modifiers.map(entry => ({ modifierProfileId: entry.modifierProfileId, categoryPath: ['装备', entry.id] })), modifiers })
  return repository
}
const members = () => [modifier('头盔', { influences: ['shaper'] }), modifier('鞋子', {
  influences: ['redeemer'], tiers: [
    { tier: 1, requiredLevel: 80, name: '另一名称', text: '每秒再生 (8–10) 魔力' },
    { tier: 2, requiredLevel: 60, name: '低阶', text: '每秒再生 5 魔力' }
  ]
})]

test('跨来源与数值合并，搜索任一成员返回完整组且限制按合并后计算', () => {
  const repository = repositoryFor([...members(), modifier('其他效果', { effectKey: '每秒再生 #% 魔力' })])
  const merged = repository.searchAffixSuggestions({ query: '头盔' }).items[0]
  assert.equal(merged.sourceLabel, '塑界者 / 救赎者')
  assert.equal(merged.applicableLabel, '装备 / 头盔 / 鞋子')
  assert.equal(merged.displayName, '每秒再生 # 魔力')
  for (const query of ['鞋子', '救赎者', '另一名称', '(8–10)']) {
    assert.deepEqual(repository.searchAffixSuggestions({ query }).items, [merged])
  }
  const limited = repository.searchAffixSuggestions({ query: '每秒再生', limit: 1 })
  assert.equal(limited.total, 2)
  assert.equal(limited.items.length, 1)
  assert.equal('searchable' in merged, false)
})

test('百分比、多行、前后缀、阶级和物等差异均不误合并', () => {
  const original = modifier('原始')
  const variants = [
    { effectKey: '每秒再生 #% 魔力' },
    { effectKey: '每秒再生 # 魔力\n最大魔力提高 #%' },
    { affixType: 'prefix' },
    { tiers: [original.tiers[0]] },
    { tiers: original.tiers.map(t => ({ ...t, requiredLevel: t.requiredLevel + 1 })) },
    { tiers: original.tiers.map(t => ({ ...t, text: `${t.text}\n最大魔力提高 5%` })) }
  ]
  const result = repositoryFor([original, ...variants.map((v, i) => modifier(`变体${i}`, v))]).searchAffixSuggestions()
  assert.equal(result.total, 7)
  assert.ok(result.items.some(row => row.displayName === '每秒再生 #% 魔力'))
})

test('合并项保存重载、T 门槛匹配和物等检查与各原始项一致', () => {
  const merged = repositoryFor(members()).searchAffixSuggestions().items[0]
  for (const minTier of [null, 1, 2]) {
    const condition = normalizeAffixCondition({ ...merged, kind: 'catalog', minTier })
    const config = normalizeModuleTwo({ affixGroups: [{ requiredAffixes: [condition] }] })
    const reloaded = normalizeModuleTwo(JSON.parse(JSON.stringify(config)))
    assert.deepEqual(reloaded, config)
    for (const member of members()) {
      const old = normalizeAffixCondition({ ...repositoryFor([member]).searchAffixSuggestions().items[0], kind: 'catalog', minTier })
      assert.deepEqual(affixConditionItemLevelRequirement(condition), affixConditionItemLevelRequirement(old))
      for (const tier of [0, 1, 2, 3]) {
        const item = { modifiers: [{ text: '每秒再生 7 魔力', tier }] }
        const oldConfig = normalizeModuleTwo({ affixGroups: [{ requiredAffixes: [old] }] })
        assert.equal(matchAffixes(item, reloaded.affixGroups).isMatch, matchAffixes(item, oldConfig.affixGroups).isMatch)
        assert.equal(matchAffixes(item, reloaded.affixGroups).isMatch, minTier === null || (tier > 0 && tier <= minTier))
      }
    }
  }
})

test('内置每秒再生候选保留完整信息且不重复', async () => {
  const repository = new CraftingDataRepository()
  await repository.initialize()
  const { items } = repository.searchAffixSuggestions({ query: '每秒再生', limit: 100 })
  assert.ok(items.some(row => row.sourceLabel.includes(' / ')))
  assert.ok(items.some(row => row.displayName.includes('%')))
  assert.ok(items.some(row => !row.displayName.includes('%')))
  assert.ok(items.every(row => row.exampleText && row.tiers.length))
})

