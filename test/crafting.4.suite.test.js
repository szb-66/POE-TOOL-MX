import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { matchAffixes as _m0_matchAffixes } from '../electron/modules/item/matcher.js'
import { affixConditionItemLevelRequirement as _m0_affixConditionItemLevelRequirement, affixGroupItemLevelRequirement as _m0_affixGroupItemLevelRequirement, cloneAffixGroup as _m0_cloneAffixGroup, enabledAffixGroupItemLevelRequirements as _m0_enabledAffixGroupItemLevelRequirements, hasEffectiveAffixGroups as _m0_hasEffectiveAffixGroups, normalizeModuleTwo as _m0_normalizeModuleTwo } from '../src/domains/items/affixConfig.js'
import { validateCraftingConfig as _m0_validateCraftingConfig } from '../src/utils/validation.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { CraftingDataRepository as _m1_CraftingDataRepository } from '../electron/modules/crafting/dataRepository.js'
import { LocalizationRuntime as _m1_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { getServer as _m1_getServer } from '../shared/serverMode.js'
import { matchAffixes as _m1_matchAffixes } from '../electron/modules/item/matcher.js'
import { normalizeAffixCondition as _m1_normalizeAffixCondition, normalizeModuleTwo as _m1_normalizeModuleTwo, affixConditionItemLevelRequirement as _m1_affixConditionItemLevelRequirement } from '../src/domains/items/affixConfig.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { readFileSync as _m2_readFileSync } from 'node:fs'
import { restartCraftingWithLatestConfig as _m2_restartCraftingWithLatestConfig, retryAutomationWithLatestConfig as _m2_retryAutomationWithLatestConfig } from '../src/utils/craftingRestart.js'
import { createItemCraftingRunPreset as _m2_createItemCraftingRunPreset } from '../src/utils/itemPreset.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { applyManualBenchCraft as _m3_applyManualBenchCraft, applyManualCurrency as _m3_applyManualCurrency, applyManualEssence as _m3_applyManualEssence, applyManualFossils as _m3_applyManualFossils, applyManualHarvestCraft as _m3_applyManualHarvestCraft, createManualSession as _m3_createManualSession, inspectManualCurrencies as _m3_inspectManualCurrencies, listManualBeastcrafts as _m3_listManualBeastcrafts, listManualBenchCrafts as _m3_listManualBenchCrafts, listManualEssences as _m3_listManualEssences, listManualFossils as _m3_listManualFossils, listManualHarvestCrafts as _m3_listManualHarvestCrafts, previewManualCurrency as _m3_previewManualCurrency, redoManualAction as _m3_redoManualAction, resetManualSession as _m3_resetManualSession, undoManualAction as _m3_undoManualAction } from '../electron/modules/crafting/manualCrafting.js'
import { CURRENT_EQUIPMENT_CURRENCIES as _m3_CURRENT_EQUIPMENT_CURRENCIES } from '../electron/modules/crafting/seasonalRules.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { applyManualEldritchCraft as _m4_applyManualEldritchCraft, createManualSession as _m4_createManualSession, listManualEldritchCrafts as _m4_listManualEldritchCrafts, redoManualAction as _m4_redoManualAction, resetManualSession as _m4_resetManualSession, undoManualAction as _m4_undoManualAction } from '../electron/modules/crafting/manualCrafting.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { readFileSync as _m5_readFileSync } from 'node:fs'
import { ATLAS_MAP_AFFIX_CATALOG_META as _m5_ATLAS_MAP_AFFIX_CATALOG_META, ATLAS_MAP_AFFIX_SUGGESTIONS as _m5_ATLAS_MAP_AFFIX_SUGGESTIONS } from '../src/data/mapAffixSuggestionsData.js'
import { FRAGMENT_CHART_MODS as _m5_FRAGMENT_CHART_MODS } from '../src/data/chartModsData.js'
import { matchMapRequirements as _m5_matchMapRequirements } from '../electron/modules/item/matcher.js'
import { CHART_AFFIX_SUGGESTIONS as _m5_CHART_AFFIX_SUGGESTIONS, affixSuggestionsForKind as _m5_affixSuggestionsForKind, buildChartAffixSuggestions as _m5_buildChartAffixSuggestions, searchMapAffixSuggestions as _m5_searchMapAffixSuggestions } from '../src/utils/mapAffixSuggestions.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { createHash as _m6_createHash } from 'node:crypto'
import { readFileSync as _m6_readFileSync } from 'node:fs'
import { LocalizationRuntime as _m6_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { matchMapRequirements as _m6_matchMapRequirements } from '../electron/modules/item/matcher.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { readFile as _m7_readFile } from 'node:fs/promises'
import { CURRENT_EQUIPMENT_CURRENCIES as _m7_CURRENT_EQUIPMENT_CURRENCIES, CURRENT_RULESET as _m7_CURRENT_RULESET } from '../electron/modules/crafting/seasonalRules.js'
import { createManualSession as _m7_createManualSession, inspectManualCurrencies as _m7_inspectManualCurrencies } from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset as _m7_normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { familySelectionState as _m8_familySelectionState, tierSelectionKey as _m8_tierSelectionKey, toggleFamilySelection as _m8_toggleFamilySelection, toggleTierSelection as _m8_toggleTierSelection } from '../src/domains/crafting/modSelection.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { readFile as _m9_readFile } from 'node:fs/promises'
import _m9_path from 'node:path'
import { applyManualBenchCraft as _m9_applyManualBenchCraft, applyManualCurrency as _m9_applyManualCurrency, createManualSession as _m9_createManualSession, inspectManualCurrencies as _m9_inspectManualCurrencies, listManualBenchCrafts as _m9_listManualBenchCrafts, redoManualAction as _m9_redoManualAction, resetManualSession as _m9_resetManualSession, undoManualAction as _m9_undoManualAction } from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset as _m9_normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import { TAINTED_CURRENCIES as _m10_TAINTED_CURRENCIES, applyTaintedFusing as _m10_applyTaintedFusing, applyTaintedJewellers as _m10_applyTaintedJewellers, largestLinkSize as _m10_largestLinkSize, rerollTaintedSocketColours as _m10_rerollTaintedSocketColours, taintedCommonReason as _m10_taintedCommonReason } from '../electron/modules/crafting/taintedRules.js'
import { CORRUPTED_BENCH_RECIPES as _m10_CORRUPTED_BENCH_RECIPES, applyCorruptedBenchRecipe as _m10_applyCorruptedBenchRecipe } from '../electron/modules/crafting/corruptedBenchRules.js'
import _m11_test from 'node:test'
import _m11_assert from 'node:assert/strict'
import { readFileSync as _m11_readFileSync } from 'node:fs'
import { fileURLToPath as _m11_fileURLToPath } from 'node:url'
import _m11_path from 'node:path'
import { normalizeCraftingDataset as _m11_normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import _m12_test from 'node:test'
import _m12_assert from 'node:assert/strict'
import { readFileSync as _m12_readFileSync } from 'node:fs'
import { fileURLToPath as _m12_fileURLToPath } from 'node:url'
import _m12_path from 'node:path'
import { applyManualCurrency as _m12_applyManualCurrency, createManualSession as _m12_createManualSession, createSeededRng as _m12_createSeededRng, inspectManualCurrencies as _m12_inspectManualCurrencies, redoManualAction as _m12_redoManualAction, resetManualSession as _m12_resetManualSession, undoManualAction as _m12_undoManualAction } from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset as _m12_normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { rollVaalOutcome as _m12_rollVaalOutcome } from '../electron/modules/crafting/vaalRules.js'

// === Merged from itemAffixGroups.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const matchAffixes = _m0_matchAffixes
  const affixConditionItemLevelRequirement = _m0_affixConditionItemLevelRequirement
  const affixGroupItemLevelRequirement = _m0_affixGroupItemLevelRequirement
  const cloneAffixGroup = _m0_cloneAffixGroup
  const enabledAffixGroupItemLevelRequirements = _m0_enabledAffixGroupItemLevelRequirements
  const hasEffectiveAffixGroups = _m0_hasEffectiveAffixGroups
  const normalizeModuleTwo = _m0_normalizeModuleTwo
  const validateCraftingConfig = _m0_validateCraftingConfig
const itemInfo = {
  implicitMods: [],
  explicitMods: ['+89 最大生命', '+35% 火焰抗性', '物理伤害提高 76%', '+183 命中值'],
  craftedMods: [],
  modifiers: [
    { type: 'prefix', name: '健壮的', tier: 2, text: '+89 最大生命', lines: ['+89 最大生命'] },
    { type: 'suffix', name: '焰火之', tier: 4, text: '+35% 火焰抗性', lines: ['+35% 火焰抗性'] },
    { type: 'prefix', name: '帝王的', tier: 1, text: '物理伤害提高 76%\n+183 命中值', lines: ['物理伤害提高 76%', '+183 命中值'] }
  ]
}

const catalog = (id, effectPattern, minTier = null) => ({
  id,
  kind: 'catalog',
  keyword: effectPattern,
  displayName: effectPattern,
  effectPattern,
  minTier
})

test('词缀组合物等要求按阶级门槛和全部条件最高值派生', () => {
  const tiered = (id, minTier, tiers) => ({
    ...catalog(id, `效果 ${id}`, minTier),
    tiers
  })
  assert.deepEqual(affixConditionItemLevelRequirement(tiered('不限', null, [
    { tier: 1, requiredLevel: 84 }, { tier: 3, requiredLevel: 60 }, { tier: 7, requiredLevel: 1 }
  ])), { level: 1, hasUnknown: false, effective: true })
  assert.deepEqual(affixConditionItemLevelRequirement(tiered('最低T3', 3, [
    { tier: 1, requiredLevel: 84 }, { tier: 3, requiredLevel: 60 }, { tier: 7, requiredLevel: 1 }
  ])), { level: 60, hasUnknown: false, effective: true })
  assert.deepEqual(affixConditionItemLevelRequirement(tiered('稀疏', 3, [
    { tier: 1, requiredLevel: 82 }, { tier: 5, requiredLevel: 20 }
  ])), { level: 82, hasUnknown: false, effective: true })

  const requirement = affixGroupItemLevelRequirement({
    requiredAffixes: [tiered('生命', 3, [{ tier: 3, requiredLevel: 60 }])],
    selectedAffixes: [tiered('速度', 1, [{ tier: 1, requiredLevel: 84 }]), '自定义词缀'],
    selectedCount: 1
  })
  assert.deepEqual(requirement, { level: 84, hasUnknown: true, hasEffectiveConditions: true })
  assert.deepEqual(affixGroupItemLevelRequirement({ requiredAffixes: [], selectedAffixes: [] }), {
    level: null, hasUnknown: false, hasEffectiveConditions: false
  })
})

test('运行物等要求只返回启用且可计算的非空组合', () => {
  const known = { ...catalog('生命', '+# 最大生命'), tiers: [{ tier: 1, requiredLevel: 82 }] }
  const groups = [
    { id: 'enabled', name: '启用', enabled: true, requiredAffixes: [known], selectedAffixes: [] },
    { id: 'disabled', name: '停用', enabled: false, requiredAffixes: [known], selectedAffixes: [] },
    { id: 'unknown', name: '未知', enabled: true, requiredAffixes: ['自定义'], selectedAffixes: [] },
    { id: 'empty', name: '空', enabled: true, requiredAffixes: [], selectedAffixes: [] }
  ]
  assert.deepEqual(enabledAffixGroupItemLevelRequirements(groups), [{
    id: 'enabled', name: '启用', level: 82, hasUnknown: false, hasEffectiveConditions: true
  }])
})

test('旧单组字符串配置迁移为组合并清理空条件', () => {
  const migrated = normalizeModuleTwo({
    enabled: true,
    mode: 'alteration',
    requiredAffixes: ['生命', ''],
    selectedAffixes: ['火焰', '冰霜'],
    selectedCount: 9
  })
  assert.equal(migrated.affixGroups.length, 1)
  assert.equal(migrated.affixGroups[0].name, '组合 1')
  assert.deepEqual(migrated.affixGroups[0].requiredAffixes.map((entry) => entry.keyword), ['生命'])
  assert.equal(migrated.affixGroups[0].selectedCount, 2)
  assert.equal(hasEffectiveAffixGroups(migrated), true)
  assert.equal(Object.hasOwn(migrated, 'checkInitialAffixes'), false)
})

test('最低 T 接受更好或相同阶级并拒绝更差阶级', () => {
  const group = (minTier) => [{
    id: 'life',
    name: '生命',
    requiredAffixes: [catalog('life', '+# 最大生命', minTier)],
    selectedAffixes: [],
    selectedCount: 1
  }]
  assert.equal(matchAffixes(itemInfo, group(3)).isMatch, true)
  assert.equal(matchAffixes(itemInfo, group(2)).isMatch, true)
  assert.equal(matchAffixes(itemInfo, group(1)).isMatch, false)
  assert.equal(matchAffixes(itemInfo, group(null)).isMatch, true)
  const missingTier = structuredClone(itemInfo)
  missingTier.modifiers[0].tier = null
  assert.equal(matchAffixes(missingTier, group(3)).isMatch, false)
})

test('多行目录效果必须由同一详细词缀完整匹配', () => {
  const valid = [{
    id: 'hybrid',
    name: '复合物理',
    requiredAffixes: [catalog('hybrid', '物理伤害提高 #%\n+# 命中值', 1)],
    selectedAffixes: [],
    selectedCount: 1
  }]
  assert.equal(matchAffixes(itemInfo, valid).isMatch, true)
  const split = structuredClone(itemInfo)
  split.modifiers = [
    { type: 'prefix', name: '物理', tier: 1, text: '物理伤害提高 76%' },
    { type: 'suffix', name: '命中', tier: 1, text: '+183 命中值' }
  ]
  assert.equal(matchAffixes(split, valid).isMatch, false)
})

test('组内必选与挑选按 AND/N-of-M，组间按 OR 并报告命中组', () => {
  const groups = [
    {
      id: 'cold-plan',
      name: '冰霜方案',
      requiredAffixes: ['冰霜伤害'],
      selectedAffixes: ['生命', '火焰抗性'],
      selectedCount: 2
    },
    {
      id: 'life-plan',
      name: '生命方案',
      requiredAffixes: ['最大生命'],
      selectedAffixes: ['火焰抗性', '冰霜抗性'],
      selectedCount: 1
    }
  ]
  const result = matchAffixes(itemInfo, groups)
  assert.equal(result.isMatch, true)
  assert.equal(result.matchedGroupId, 'life-plan')
  assert.equal(result.matchedGroupName, '生命方案')
  assert.equal(result.groupResults.length, 2)
  assert.ok(result.matchedModTexts.includes('+89 最大生命'))
})

test('空组合被忽略且不产生无条件成功', () => {
  const result = matchAffixes(itemInfo, [{ id: 'empty', name: '空', requiredAffixes: [], selectedAffixes: [], selectedCount: 1 }])
  assert.equal(result.isMatch, false)
  assert.deepEqual(result.groupResults, [])
})

test('复制组合生成新的稳定 ID，并允许跨组复用相同词缀', () => {
  const original = normalizeModuleTwo({
    affixGroups: [{
      id: 'original',
      name: '原方案',
      requiredAffixes: ['最大生命'],
      selectedAffixes: ['火焰抗性'],
      selectedCount: 1
    }]
  }).affixGroups[0]
  const copied = cloneAffixGroup(original, 1)
  assert.notEqual(copied.id, original.id)
  assert.notEqual(copied.requiredAffixes[0].id, original.requiredAffixes[0].id)
  assert.equal(copied.requiredAffixes[0].keyword, original.requiredAffixes[0].keyword)
  assert.equal(copied.name, '原方案 副本')
})

test('启用词缀模块但所有组合为空时启动校验拒绝运行', () => {
  const result = validateCraftingConfig({
    itemPosition: { x: 100, y: 100 },
    currencyPositions: { wisdom: { x: 2, y: 2 }, alteration: { x: 1, y: 1 } },
    preset: {
      moduleTwo: { enabled: true, mode: 'alteration', affixGroups: [] },
      moduleThree: { enabled: false }
    }
  })
  assert.equal(result.isValid, false)
  assert.ok(result.errors.includes('词缀制作至少需要配置一个有效的达标组合'))
})

test('非古灵物品制作启动配置要求知识卷轴坐标', () => {
  const result = validateCraftingConfig({
    itemPosition: { x: 100, y: 100 },
    currencyPositions: { alteration: { x: 1, y: 1 } },
    preset: {
      moduleTwo: {
        enabled: true,
        mode: 'alteration',
        affixGroups: [{ id: 'life', name: '生命', requiredAffixes: ['最大生命'] }]
      },
      moduleThree: { enabled: false }
    }
  })
  assert.match(result.errors.join('\n'), /知识卷轴 \(wisdom\)/)
})

test('停用的组合不参与匹配且不出现在诊断中', () => {
  const groups = [
    {
      id: 'disabled-plan',
      name: '停用方案',
      enabled: false,
      requiredAffixes: ['最大生命'],
      selectedAffixes: [],
      selectedCount: 1
    },
    {
      id: 'active-plan',
      name: '启用方案',
      requiredAffixes: ['冰霜伤害'],
      selectedAffixes: ['生命', '火焰抗性'],
      selectedCount: 1
    }
  ]
  const result = matchAffixes(itemInfo, groups)
  assert.equal(result.isMatch, false)
  assert.equal(result.matchedGroupId, null)
  assert.deepEqual(result.groupResults.map((group) => group.id), ['active-plan'])
})

test('旧预设组合默认启用，停用值被规范化保留', () => {
  const migrated = normalizeModuleTwo({
    enabled: true,
    mode: 'alteration',
    affixGroups: [
      { id: 'legacy', name: '旧方案', requiredAffixes: ['生命'] },
      { id: 'off', name: '停用', enabled: false, requiredAffixes: ['火焰'] }
    ]
  })
  assert.equal(migrated.affixGroups[0].enabled, true)
  assert.equal(migrated.affixGroups[1].enabled, false)
  assert.equal(hasEffectiveAffixGroups(migrated), true)
  assert.equal(hasEffectiveAffixGroups({ ...migrated, affixGroups: [migrated.affixGroups[1]] }), false)
})

test('复制组合继承启用状态', () => {
  const original = normalizeModuleTwo({
    affixGroups: [{
      id: 'off',
      name: '停用方案',
      enabled: false,
      requiredAffixes: ['最大生命']
    }]
  }).affixGroups[0]
  const copied = cloneAffixGroup(original, 1)
  assert.equal(copied.enabled, false)
})

test('全部组合停用时启动校验拒绝运行', () => {
  const result = validateCraftingConfig({
    itemPosition: { x: 100, y: 100 },
    currencyPositions: { wisdom: { x: 2, y: 2 }, alteration: { x: 1, y: 1 } },
    preset: {
      moduleTwo: {
        enabled: true,
        mode: 'alteration',
        affixGroups: [{ id: 'off', name: '停用', enabled: false, requiredAffixes: ['最大生命'] }]
      },
      moduleThree: { enabled: false }
    }
  })
  assert.equal(result.isValid, false)
  assert.ok(result.errors.includes('词缀制作至少需要配置一个有效的达标组合'))
})
})()

// === Merged from itemAffixSuggestions.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const CraftingDataRepository = _m1_CraftingDataRepository
  const LocalizationRuntime = _m1_LocalizationRuntime
  const getServer = _m1_getServer
  const matchAffixes = _m1_matchAffixes
  const normalizeAffixCondition = _m1_normalizeAffixCondition
  const normalizeModuleTwo = _m1_normalizeModuleTwo
  const affixConditionItemLevelRequirement = _m1_affixConditionItemLevelRequirement
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

test('国际服汉化未应用或已失效时，简繁中文与英文联想仍可用且中文候选可直接匹配', async () => {
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => [], revision: () => '' })
  const repository = new CraftingDataRepository({ server: getServer('international'), localizationRuntime: runtime })
  await repository.initialize()

  for (const query of ['最大生命', '火焰抗性', '移动速度', '移動速度']) {
    const { items } = repository.searchAffixSuggestions({ query, limit: 100 })
    assert.ok(items.length, `中文查询应返回候选：${query}`)
    assert.ok(items.every(row => row.effectPattern && !/[\u3400-\u9fff]/u.test(row.effectPattern)), `候选应保留规范效果模式：${query}`)
    assert.ok(items.some(row => /[\u3400-\u9fff]/u.test(row.displayPattern)), `中文候选应保留可见文本模式：${query}`)
  }
  const movement = repository.searchAffixSuggestions({ query: '移动速度', limit: 100 }).items
    .find(row => row.effectPattern === '#% increased Movement Speed')
  assert.ok(movement)
  const condition = normalizeAffixCondition({ ...movement, kind: 'catalog', effectPattern: movement.displayPattern, minTier: 1 })
  const visibleText = movement.displayPattern.replaceAll('#', '20')
  assert.equal(matchAffixes({ modifiers: [{ text: visibleText, tier: 1 }] }, [{ requiredAffixes: [condition] }]).isMatch, true)
  const alias = repository.affixAliasesForTexts(['#% increased Movement Speed'])[0]
  assert.ok(alias.displayText.includes('移动速度'))
  assert.ok(repository.searchAffixSuggestions({ query: 'maximum Life', limit: 100 }).items
    .some(row => row.effectPattern === '+# to maximum Life'))
})

test('词缀联想包含星团珠宝核心天赋（其中 1 个增加的天赋为XXX）且支持中英匹配与跨服转换', async () => {
  const cnRepo = new CraftingDataRepository()
  await cnRepo.initialize()
  const cnSuggestion = cnRepo.searchAffixSuggestions({ query: '复兴', limit: 50 }).items
    .find(row => row.effectPattern === '其中 1 个增加的天赋为复兴')
  assert.ok(cnSuggestion, '国服词缀联想应包含“其中 1 个增加的天赋为复兴”')
  assert.equal(cnSuggestion.source, 'clusterNotable')
  assert.equal(cnSuggestion.canonicalPattern, '1 Added Passive Skill is Renewal')
  assert.equal(cnSuggestion.affixType, 'prefix')
  assert.equal(cnSuggestion.tiers.length, 1)
  assert.equal(cnSuggestion.tiers[0].requiredLevel, 50)

  const cnCondition = normalizeAffixCondition({ ...cnSuggestion, kind: 'catalog' })
  assert.deepEqual(affixConditionItemLevelRequirement(cnCondition), { level: 50, hasUnknown: false, effective: true })
  assert.equal(
    matchAffixes({ modifiers: [{ text: '其中 1 个增加的天赋为复兴 — 数值不可调整', tier: 1 }] }, [{ requiredAffixes: [cnCondition] }]).isMatch,
    true
  )
  assert.equal(
    matchAffixes({ modifiers: [{ text: '1 Added Passive Skill is Renewal — Unscalable Value', tier: 1 }] }, [{ requiredAffixes: [cnCondition] }]).isMatch,
    true
  )

  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => [], revision: () => '' })
  const intRepo = new CraftingDataRepository({ server: getServer('international'), localizationRuntime: runtime })
  await intRepo.initialize()
  const intByZh = intRepo.searchAffixSuggestions({ query: '复兴', limit: 50 }).items
    .find(row => row.effectPattern === '1 Added Passive Skill is Renewal')
  assert.ok(intByZh, '国际服中文搜索应能联想到 Renewal 核心天赋')
  assert.equal(intByZh.displayName, '其中 1 个增加的天赋为复兴')
  assert.equal(intByZh.displayPattern, '其中 1 个增加的天赋为复兴')

  const intByEn = intRepo.searchAffixSuggestions({ query: 'Renewal', limit: 50 }).items
    .find(row => row.effectPattern === '1 Added Passive Skill is Renewal')
  assert.ok(intByEn, '国际服英文搜索应能联想到 Renewal 核心天赋')
  assert.equal(intByEn.displayName, '1 Added Passive Skill is Renewal')

  const intChineseCondition = normalizeAffixCondition({
    ...intByZh,
    kind: 'catalog',
    keyword: intByZh.displayName,
    effectPattern: intByZh.displayPattern
  })
  const reloadedInt = intRepo.resolveCrossServerConditions({ affixConditions: [intChineseCondition] })
  assert.equal(reloadedInt.affixConditions[0].effectPattern, '其中 1 个增加的天赋为复兴')
  assert.equal(reloadedInt.affixConditions[0].displayName, '其中 1 个增加的天赋为复兴')
  assert.equal(reloadedInt.affixConditions[0].canonicalPattern, '1 Added Passive Skill is Renewal')

  const intEnglishCondition = normalizeAffixCondition({
    ...intByEn,
    kind: 'catalog',
    keyword: intByEn.displayName,
    effectPattern: intByEn.effectPattern
  })
  const reloadedEn = intRepo.resolveCrossServerConditions({ affixConditions: [intEnglishCondition] })
  assert.equal(reloadedEn.affixConditions[0].effectPattern, '1 Added Passive Skill is Renewal')

  const cnResolved = cnRepo.resolveCrossServerConditions({ affixConditions: [intEnglishCondition] })
  assert.equal(cnResolved.affixConditions[0].effectPattern, '其中 1 个增加的天赋为复兴')
})
})()

// === Merged from itemCraftingRestart.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const readFileSync = _m2_readFileSync
  const restartCraftingWithLatestConfig = _m2_restartCraftingWithLatestConfig
  const retryAutomationWithLatestConfig = _m2_retryAutomationWithLatestConfig
  const createItemCraftingRunPreset = _m2_createItemCraftingRunPreset
function source(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

test('物品制作完成浮窗提供重新开始按钮且地图完成态不受影响', () => {
  const view = source('../src/domains/overlay/OverlayView.vue')
  const content = source('../src/domains/overlay/components/OverlayContent.vue')

  assert.match(content, /defineEmits\(\[[^\]]*'confirm'[^\]]*'restart'[^\]]*'retry'[^\]]*'close'[^\]]*\]\)/)
  assert.match(content, /重新开始/)
  assert.match(content, /\$emit\('restart'\)/)
  assert.match(content, /:loading="isRestarting"/)
  assert.match(view, /@restart="handleRestart"/)
  assert.match(view, /restartCraftingWithLatestConfig\(\{ presetStore, settingsStore, startCrafting, craftingKind: stopCraftingKind\.value \}\)/)
  assert.match(view, /function restoreCompletedState\(snapshot, error\)[\s\S]*itemInfo\.value = snapshot\.itemInfo/)
  assert.match(view, /if \(!result\?\.success\)[\s\S]*restoreCompletedState\(completedSnapshot, result\?\.error\)/)

  const mapCompletion = content.match(/<!-- 地图制作流程停止后的确认按钮 -->([\s\S]*?)<!-- 制作停止后的关闭按钮 -->/)?.[1] || ''
  assert.doesNotMatch(mapCompletion, /重新开始|\$emit\('restart'\)/)
})

test('运行中的物品和地图制作隐藏关闭按钮，停止与等待状态仍保留关闭入口', () => {
  const content = source('../src/domains/overlay/components/OverlayContent.vue')

  const stoppedCloseMatches = content.match(/v-if="isStopped && !isCompleted && !stopReason"/g) || []
  assert.equal(stoppedCloseMatches.length, 2)
  assert.match(content, /v-else class="overlay-placeholder"[\s\S]*v-else-if="!stopReason"/)
  assert.match(content, /defineEmits\(\[[^\]]*'confirm'[^\]]*'restart'[^\]]*'retry'[^\]]*'close'[^\]]*\]\)/)
  assert.match(content, /v-if="canRetry"[\s\S]*\$emit\('retry'\)/)
})

test('浮窗重新开始重载最新预设和设置，删除的组合不进入新任务', async () => {
  let activePreset = {
    moduleTwo: {
      affixGroups: [
        { id: 'group-1', name: '组合 1' },
        { id: 'group-4', name: '组合 4' }
      ]
    }
  }
  let activeSettings = { itemPosition: { x: 1, y: 1 } }
  const persistedPreset = {
    moduleTwo: { affixGroups: [{ id: 'group-1', name: '组合 1' }] }
  }
  const persistedSettings = { itemPosition: { x: 9, y: 9 } }
  const calls = []

  const result = await restartCraftingWithLatestConfig({
    presetStore: {
      loadPresets() {
        calls.push('preset')
        activePreset = structuredClone(persistedPreset)
      }
    },
    settingsStore: {
      loadSettings() {
        calls.push('settings')
        activeSettings = structuredClone(persistedSettings)
      }
    },
    startCrafting() {
      calls.push('start')
      return {
        success: true,
        preset: structuredClone(activePreset),
        settings: structuredClone(activeSettings)
      }
    }
  })

  assert.deepEqual(calls, ['preset', 'settings', 'start'])
  assert.deepEqual(result.preset.moduleTwo.affixGroups.map(group => group.name), ['组合 1'])
  assert.deepEqual(result.settings.itemPosition, { x: 9, y: 9 })
})

test('配置未修改仍重新加载并生成任务，失败结果原样返回且不触发旧快照旁路', async () => {
  let reloads = 0
  let starts = 0
  const unchanged = await restartCraftingWithLatestConfig({
    presetStore: { loadPresets: () => { reloads += 1 } },
    settingsStore: { loadSettings: () => { reloads += 1 } },
    startCrafting: () => { starts += 1; return { success: true } }
  })
  const invalid = await restartCraftingWithLatestConfig({
    presetStore: { loadPresets: () => { reloads += 1 } },
    settingsStore: { loadSettings: () => { reloads += 1 } },
    startCrafting: () => { starts += 1; return { success: false, error: '词缀制作至少需要配置一个有效的达标组合' } }
  })

  assert.equal(unchanged.success, true)
  assert.deepEqual(invalid, { success: false, error: '词缀制作至少需要配置一个有效的达标组合' })
  assert.equal(reloads, 4)
  assert.equal(starts, 2)
})

test('旧物品制作快照重启 IPC 已删除且浮窗仍阻止重复点击', () => {
  const ipc = source('../electron/modules/ipc/python.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const view = source('../src/domains/overlay/OverlayView.vue')
  const service = source('../src/utils/scriptService.js')

  assert.doesNotMatch(ipc, /lastSuccessfulItemConfig|restart-last-item-script/)
  assert.doesNotMatch(preload, /restartLastItemScript|restart-last-item-script/)
  assert.doesNotMatch(api, /restartLastItem|restartLastItemScript/)
  assert.match(view, /if \(isRestarting\.value\) return/)
  assert.match(view, /async function handleRetry\(\)[\s\S]*if \(isRestarting\.value \|\| !canRetry\.value\) return[\s\S]*isRestarting\.value = true[\s\S]*retryAutomationWithLatestConfig/)
  assert.match(view, /function restoreStoppedState\(snapshot, error\)[\s\S]*recoveryCheckpoint\.value = snapshot\.recovery[\s\S]*stopReason\.value = error/)
  assert.match(service, /return \{ success: false, error \}/)
  assert.match(service, /return \{ \.\.\.result, success: true \}/)
  assert.match(service, /createItemCraftingRunPreset\(currentPreset, \{ forceInitialCheck, singleItemOnly \}\)/)
  assert.match(ipc, /termination: 'manual'[\s\S]*termination,[\s\S]*errorCode: termination === 'abnormal'/)
})


test('异常恢复重载最新配置，装备只对本次强制首次判断，地图携带检查点', async () => {
  const calls = []
  const stores = {
    presetStore: { loadPresets: () => calls.push('preset') },
    settingsStore: { loadSettings: () => calls.push('settings') }
  }
  const itemResult = await retryAutomationWithLatestConfig({
    mode: 'items',
    usageSessionId: 'usage-items',
    ...stores,
    startCrafting: options => { calls.push(['items', options]); return { success: true } },
    startMapRolling: () => { throw new Error('地图启动不应执行') }
  })
  const recovery = { targetKind: 'chart', col: 1, row: 2, processedCount: 3, qualifiedCount: 2, blacklistStats: {}, whitelistStats: {} }
  const mapResult = await retryAutomationWithLatestConfig({
    mode: 'map',
    recovery,
    usageSessionId: 'usage-map',
    ...stores,
    startCrafting: () => { throw new Error('装备启动不应执行') },
    startMapRolling: options => { calls.push(['map', options]); return { success: true } }
  })
  const batchRecovery = { usageSessionId: 'usage-batch', targets: [{ id: 'target-2' }], completedIds: ['target-1'] }
  const batchResult = await retryAutomationWithLatestConfig({
    mode: 'items',
    batchRecovery,
    usageSessionId: 'ignored-usage',
    ...stores,
    startCrafting: options => { calls.push(['batch', options]); return { success: true } },
    startMapRolling: () => { throw new Error('地图启动不应执行') }
  })

  assert.equal(itemResult.success, true)
  assert.equal(mapResult.success, true)
  assert.equal(batchResult.success, true)
  assert.deepEqual(calls, [
    'preset', 'settings', ['items', { craftingKind: 'general', forceInitialCheck: true, usageSessionId: 'usage-items', continueCurrencyUsage: true, configurationGuideBypass: true, singleItemOnly: true }],
    'preset', 'settings', ['map', { recovery, usageSessionId: 'usage-map', continueCurrencyUsage: true, configurationGuideBypass: true }],
    'preset', 'settings', ['batch', { craftingKind: 'general', forceInitialCheck: true, usageSessionId: 'usage-batch', continueCurrencyUsage: true, configurationGuideBypass: true, batchRecovery }]
  ])
})

test('单件异常重试仅在本次运行副本中关闭最新预设的批量模式', () => {
  const preset = {
    checkInitialItem: false,
    batchCrafting: { enabled: true, categoryIds: ['jewel'] },
    moduleTwo: { enabled: true, groups: [{ id: 'latest-group' }] }
  }

  const effectivePreset = createItemCraftingRunPreset(preset, {
    forceInitialCheck: true,
    singleItemOnly: true
  })

  assert.equal(effectivePreset.checkInitialItem, true)
  assert.equal(effectivePreset.batchCrafting.enabled, false)
  assert.deepEqual(effectivePreset.batchCrafting.categoryIds, ['jewel'])
  assert.deepEqual(effectivePreset.moduleTwo.groups, [{ id: 'latest-group' }])
  assert.equal(preset.batchCrafting.enabled, true)
})

test('批量异常优先读取主进程检查点续作，同时保留主动重新扫描入口', () => {
  const overlay = source('../src/domains/overlay/OverlayView.vue')
  const content = source('../src/domains/overlay/components/OverlayContent.vue')
  const runtime = source('../src/features/installFeatureRuntime.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const ipc = source('../electron/modules/ipc/window.js')
  const restart = source('../src/utils/craftingRestart.js')

  const retryBody = overlay.slice(overlay.indexOf('async function handleRetry'), overlay.indexOf('async function handleBatchResume'))
  assert.doesNotMatch(retryBody, /batchRecovery/)
  assert.match(content, /v-if="canResumeBatch"[^>]*\$emit\('resume-batch'\)[\s\S]*继续批量制作/)
  assert.match(content, /返回重新扫描/)
  assert.match(overlay, /const canRetry = computed\([\s\S]*!batchRecoveryCheckpoint\.value/)
  assert.match(overlay, /async function refreshBatchRecovery\(\)[\s\S]*batchCrafting\.getRecovery\(\)/)
  assert.match(overlay, /async function handleBatchResume\(\)[\s\S]*refreshBatchRecovery\(\)[\s\S]*retryAutomationWithLatestConfig\(\{[\s\S]*batchRecovery: checkpoint/)
  assert.match(overlay, /async function handleBatchRescan\(\)[\s\S]*batchCrafting\.returnToScan\(\)/)
  assert.match(runtime, /batchCrafting\.onScanRequested[\s\S]*router\.push\('\/items'\)/)
  assert.match(preload, /returnToBatchCraftingScan[\s\S]*crafting-batch-return-to-scan/)
  assert.match(api, /returnToScan:\s*\(\) => window\.electronAPI\.returnToBatchCraftingScan/)
  assert.match(restart, /batchRecovery \? \{[\s\S]*batchRecovery[\s\S]*singleItemOnly: true/)
  assert.match(preload, /getBatchCraftingRecovery[\s\S]*crafting-batch-recovery-get/)
  assert.match(api, /getRecovery:\s*\(\) => window\.electronAPI\.getBatchCraftingRecovery/)
  assert.match(ipc, /overlay\.webContents !== event\.sender/)
  assert.match(ipc, /mainWindow\.webContents\.send\('crafting-batch-scan-requested'/)
  assert.match(ipc, /ipcMain\.handle\('crafting-batch-return-to-scan'/)
})
})()

// === Merged from manualCrafting.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const applyManualBenchCraft = _m3_applyManualBenchCraft
  const applyManualCurrency = _m3_applyManualCurrency
  const applyManualEssence = _m3_applyManualEssence
  const applyManualFossils = _m3_applyManualFossils
  const applyManualHarvestCraft = _m3_applyManualHarvestCraft
  const createManualSession = _m3_createManualSession
  const inspectManualCurrencies = _m3_inspectManualCurrencies
  const listManualBeastcrafts = _m3_listManualBeastcrafts
  const listManualBenchCrafts = _m3_listManualBenchCrafts
  const listManualEssences = _m3_listManualEssences
  const listManualFossils = _m3_listManualFossils
  const listManualHarvestCrafts = _m3_listManualHarvestCrafts
  const previewManualCurrency = _m3_previewManualCurrency
  const redoManualAction = _m3_redoManualAction
  const resetManualSession = _m3_resetManualSession
  const undoManualAction = _m3_undoManualAction
  const CURRENT_EQUIPMENT_CURRENCIES = _m3_CURRENT_EQUIPMENT_CURRENCIES
const seasonalBoundaryCurrencyIds = new Set(CURRENT_EQUIPMENT_CURRENCIES.map((entry) => entry.id))

const dataset = {
  bases: [{ id: 'base:wand', name: '测试法杖', displayName: '测试法杖', itemClass: 'Wand', categoryPath: ['单手武器', '法杖'], modifierProfileId: 'Wands', requiredLevel: 1, requirements: { level: 1, strength: 0, dexterity: 0, intelligence: 0 }, qualityType: 'weapon', socketLimit: 3, baseStats: [], implicitModifiers: [], tags: ['wand'], maxAffixes: { prefix: 3, suffix: 3 }, allowedVariants: ['normal'] }],
  modifiers: [
    { id: 'mod:spell', goalId: 'goal:spell', familyId: 'family:spell', modifierProfileId: 'Wands', groupId: 'spell', name: '术士的', affixType: 'prefix', source: 'natural', tags: ['caster'], displayTags: [{ id: 'caster', label: '法术' }], spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences: [], tiers: [
      { id: 'tier:spell-high', tier: 1, name: 'T1 术士的', requiredLevel: 80, weight: 100000, text: '法术伤害提高 (100—120)%', values: [{ min: 100, max: 120 }], displayTags: [{ id: 'caster', label: '法术' }] },
      { id: 'tier:spell', tier: 2, name: 'T2 术士的', requiredLevel: 1, weight: 1000, text: '法术伤害提高 (10—20)%', values: [{ min: 10, max: 20 }], displayTags: [{ id: 'caster', label: '法术' }] }
    ] },
    { id: 'mod:speed', goalId: 'goal:speed', familyId: 'family:speed', modifierProfileId: 'Wands', groupId: 'speed', name: '欢快之', affixType: 'suffix', source: 'natural', tags: ['speed'], displayTags: [{ id: 'speed', label: '速度' }], spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences: [], tiers: [{ id: 'tier:speed', tier: 1, name: 'T1 欢快之', requiredLevel: 1, weight: 1000, text: '施法速度提高 (5—10)%', values: [{ min: 5, max: 10 }], displayTags: [{ id: 'speed', label: '速度' }] }] },
    { id: 'mod:essence-woe', goalId: 'goal:essence-woe', familyId: 'family:essence-woe', modifierProfileId: 'Wands', groupId: 'essence-spell', name: '精华法术伤害', affixType: 'prefix', source: 'essence', tags: ['caster'], displayTags: [{ id: 'caster', label: '法术' }], spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences: [], tiers: [
      { id: 'tier:woe-low', tier: 1, name: 'T1 悲痛之低语精华', requiredLevel: 2, weight: 0, text: '法术伤害提高 (10—19)%', values: [{ min: 10, max: 19 }], displayTags: [{ id: 'caster', label: '法术' }], sourceItem: { id: 'Whispering_Essence_of_Woe', name: '悲痛之低语精华', tier: 1, minimumItemLevel: 1, randomModifierLevelCap: 35, canReforgeRare: false } },
      { id: 'tier:woe-high', tier: 2, name: 'T7 悲痛之破空精华', requiredLevel: 82, weight: 0, text: '法术伤害提高 (83—94)%', values: [{ min: 83, max: 94 }], displayTags: [{ id: 'caster', label: '法术' }], sourceItem: { id: 'Deafening_Essence_of_Woe', name: '悲痛之破空精华', tier: 7, minimumItemLevel: 65, randomModifierLevelCap: null, canReforgeRare: true } }
    ] },
    { id: 'mod:bench-life', goalId: 'goal:bench-life', familyId: 'family:bench-life', modifierProfileId: 'Wands', groupId: 'life', name: '最大生命', affixType: 'prefix', source: 'crafted', tags: ['life'], displayTags: [{ id: 'life', label: '生命' }], spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences: [], tiers: [], craftedOptions: [
      { id: 'crafted:life', optionId: 'crafted:life', craftId: 'craft:life', tier: 1, name: '工艺台', requiredLevel: 1, weight: 0, text: '+(20—30) 最大生命', values: [{ min: 20, max: 30 }], displayTags: [{ id: 'life', label: '生命' }], itemClasses: ['单手远程'], cost: [{ resourceId: 'currency:transmutation', resourceName: '蜕变石', amount: 2 }], unlock: '默认' },
      { id: 'crafted:life-high', optionId: 'crafted:life-high', craftId: 'craft:life-high', tier: 2, name: '工艺台', requiredLevel: 85, weight: 0, text: '+(50—60) 最大生命', values: [{ min: 50, max: 60 }], displayTags: [{ id: 'life', label: '生命' }], itemClasses: ['单手远程'], cost: [{ resourceId: 'currency:chaos', resourceName: '混沌石', amount: 2 }], unlock: '终局地图' }
    ] },
    { id: 'mod:bench-resist', goalId: 'goal:bench-resist', familyId: 'family:bench-resist', modifierProfileId: 'Wands', groupId: 'fire-resist', name: '火焰抗性', affixType: 'suffix', source: 'crafted', tags: ['fire'], displayTags: [{ id: 'fire', label: '火焰' }], spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences: [], tiers: [], craftedOptions: [
      { id: 'crafted:fire-resist', optionId: 'crafted:fire-resist', craftId: 'craft:fire-resist', tier: 1, name: '工艺台', requiredLevel: 1, weight: 0, text: '+(15—20)% 火焰抗性', values: [{ min: 15, max: 20 }], displayTags: [{ id: 'fire', label: '火焰' }], itemClasses: ['单手远程'], cost: [{ resourceId: 'currency:transmutation', resourceName: '蜕变石', amount: 1 }], unlock: '默认' }
    ] }
  ]
}

test('手动通货创建可复现的实际词缀并支持撤销重做重置', () => {
  const initial = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 42 })
  const first = applyManualCurrency(dataset, initial, 'currency:transmutation')
  const repeated = applyManualCurrency(dataset, createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 42 }), 'currency:transmutation')
  assert.deepEqual(first.session.state, repeated.session.state)
  assert.equal(first.session.state.rarity, 'magic')
  assert.ok([...first.session.state.prefixes, ...first.session.state.suffixes].every((entry) => entry.rolledValues.length && !entry.rolledText.includes('—')))
  const undone = undoManualAction(dataset, first.session)
  assert.equal(undone.session.state.rarity, 'normal')
  const redone = redoManualAction(dataset, undone.session)
  assert.deepEqual(redone.session.state, first.session.state)
  assert.equal(resetManualSession(dataset, redone.session).session.history.length, 0)
})

test('通货拒绝非法状态并提供同源原因', () => {
  const session = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' } })
  const chaos = inspectManualCurrencies(dataset, session).find((entry) => entry.id === 'currency:chaos')
  assert.equal(chaos.canApply, false)
  assert.equal(chaos.unavailableReason, '混沌石仅能重铸稀有物品')
  assert.throws(() => applyManualCurrency(dataset, session, 'currency:chaos'), /仅能重铸稀有物品/)
})

test('核心普通通货统一拒绝腐化和镜像物品', () => {
  for (const flag of ['corrupted', 'mirrored']) {
    const current = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 112 })
    current.state[flag] = true
    const actions = inspectManualCurrencies(dataset, current).filter((entry) =>
      !seasonalBoundaryCurrencyIds.has(entry.id) &&
      !entry.id.startsWith('currency:catalyst-') &&
      (flag !== 'corrupted' || !entry.id.startsWith('currency:tainted-')))
    for (const action of actions) {
      assert.equal(action.canApply, false, `${flag} 不应允许 ${action.id}`)
      assert.match(action.unavailableReason, flag === 'corrupted' ? /腐化/ : /镜像/)
    }
  }
})

test('卡兰德之镜保留原件并创建不推进随机状态的完整镜像副本', () => {
  let original = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 412 })
  original = applyManualCurrency(dataset, original, 'currency:alchemy').session
  original.state.split = true
  original.state.enchanted = true
  original.state.quality = 20
  original.variant = { kind: 'synthesized', influences: [], fracturedTierId: null, implicits: ['测试综合隐式'] }
  const sourceState = structuredClone(original.state)
  const sourceVariant = structuredClone(original.variant)
  const sourceId = original.activeItemId
  const rngBefore = original.rngState
  const mirror = inspectManualCurrencies(dataset, original).find((entry) => entry.id === 'currency:mirror-of-kalandra')
  assert.equal(mirror.canApply, true)
  assert.deepEqual(mirror.cost, [{ resourceId: 'currency:mirror-of-kalandra', resourceName: '卡兰德之镜', amount: 1 }])

  const result = applyManualCurrency(dataset, original, mirror.id)
  assert.equal(result.session.rngState, rngBefore)
  assert.equal(result.session.state.mirrored, true)
  assert.notEqual(result.session.activeItemId, sourceId)
  assert.deepEqual(result.event.sourceItem, { itemId: sourceId, baseId: original.baseId, itemLevel: 84, state: sourceState, variant: sourceVariant })
  assert.deepEqual(result.event.createdMirrorItem.state, result.session.state)
  assert.deepEqual({ ...result.session.state, mirrored: false }, sourceState)
  assert.deepEqual(result.event.createdMirrorItem.variant, sourceVariant)
  assert.match(result.event.summary, /原件未改变.*镜像副本/)
  assert.ok(result.currencies.every((entry) => !entry.canApply && /镜像/.test(entry.unavailableReason)))
  assert.ok(result.essences.items.every((entry) => !entry.canApply && /镜像/.test(entry.unavailableReason)))
  assert.ok(result.benchCrafts.items.every((entry) => !entry.canApply && /镜像/.test(entry.unavailableReason)))
  assert.throws(() => applyManualEssence(dataset, result.session, 'Deafening_Essence_of_Woe'), /镜像/)
})

test('卡兰德之镜支持预见、撤销重做与重置并拒绝腐化或二次复制', () => {
  const initial = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 413 })
  initial.foreseeing = true
  const beforePreview = structuredClone(initial)
  const preview = previewManualCurrency(dataset, initial, 'currency:mirror-of-kalandra')
  assert.deepEqual(initial, beforePreview)
  assert.equal(preview.state.mirrored, true)
  const copied = applyManualCurrency(dataset, initial, 'currency:mirror-of-kalandra')
  assert.deepEqual(copied.session.state, preview.state)
  assert.equal(copied.session.foreseeing, false)
  assert.equal(copied.session.rngState, initial.rngState)

  const undone = undoManualAction(dataset, copied.session)
  assert.equal(undone.session.state.mirrored, false)
  assert.equal(undone.session.activeItemId, initial.activeItemId)
  assert.equal(undone.session.foreseeing, true)
  const redone = redoManualAction(dataset, undone.session)
  assert.equal(redone.session.state.mirrored, true)
  assert.equal(redone.event.createdMirrorItem.state.mirrored, true)
  const reset = resetManualSession(dataset, redone.session)
  assert.equal(reset.session.state.mirrored, false)
  assert.equal(reset.session.activeItemId, initial.activeItemId)

  assert.match(inspectManualCurrencies(dataset, copied.session).find((entry) => entry.id === 'currency:mirror-of-kalandra').unavailableReason, /不能再次复制/)
  const corrupted = structuredClone(initial)
  corrupted.state.corrupted = true
  assert.match(inspectManualCurrencies(dataset, corrupted).find((entry) => entry.id === 'currency:mirror-of-kalandra').unavailableReason, /腐化/)
})

test('神圣石只重骰实际数值不改变词缀阶级', () => {
  let session = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 9 })
  session = applyManualCurrency(dataset, session, 'currency:transmutation').session
  const before = [...session.state.prefixes, ...session.state.suffixes].map(({ tierId, rolledValues, valueRanges }) => ({ tierId, rolledValues, valueRanges }))
  const after = applyManualCurrency(dataset, session, 'currency:divine').session
  const next = [...after.state.prefixes, ...after.state.suffixes].map(({ tierId, rolledValues }) => ({ tierId, rolledValues }))
  assert.deepEqual(next.map((entry) => entry.tierId), before.map((entry) => entry.tierId))
  assert.ok(next.every((entry, index) => entry.rolledValues.every((value, valueIndex) => value >= before[index].valueRanges[valueIndex].min && value <= before[index].valueRanges[valueIndex].max)))
})

test('精华保证词缀、限制低阶随机池并支持确定性历史', () => {
  const initial = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 17 })
  const catalog = listManualEssences(dataset, initial)
  assert.equal(catalog.items.length, 2)
  assert.equal(catalog.items.find((entry) => entry.id === 'Whispering_Essence_of_Woe').canReforgeRare, false)
  const first = applyManualEssence(dataset, initial, 'Whispering_Essence_of_Woe')
  const repeated = applyManualEssence(dataset, initial, 'Whispering_Essence_of_Woe')
  assert.deepEqual(first.session.state, repeated.session.state)
  assert.equal(first.session.state.rarity, 'rare')
  assert.equal(first.event.poolItemLevel, 35)
  assert.ok([...first.session.state.prefixes, ...first.session.state.suffixes].some((entry) => entry.sourceItemId === 'Whispering_Essence_of_Woe'))
  const naturalTierIds = [...first.session.state.prefixes, ...first.session.state.suffixes].filter((entry) => entry.source === 'natural').map((entry) => entry.tierId)
  assert.equal(naturalTierIds.includes('tier:spell-high'), false)
  assert.throws(() => applyManualEssence(dataset, first.session, 'Whispering_Essence_of_Woe'), /只能用于普通物品/)
  const reforged = applyManualEssence(dataset, first.session, 'Deafening_Essence_of_Woe')
  assert.ok([...reforged.session.state.prefixes, ...reforged.session.state.suffixes].some((entry) => entry.sourceItemId === 'Deafening_Essence_of_Woe'))
  assert.deepEqual(undoManualAction(dataset, reforged.session).session.state, first.session.state)
})

test('精华拒绝等级不足和任意元工艺状态', () => {
  const lowLevel = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 20, variant: { kind: 'normal' }, seed: 2 })
  assert.match(listManualEssences(dataset, lowLevel).items.find((entry) => entry.id === 'Deafening_Essence_of_Woe').unavailableReason, /至少为 65/)
  const meta = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 2 })
  meta.state.meta.cannotRollCaster = true
  assert.match(listManualEssences(dataset, meta).items[0].unavailableReason, /元工艺/)
})

test('魔法物品每侧最多一条词缀', () => {
  const initial = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 7 })
  const session = applyManualBenchCraft(dataset, initial, 'craft:life').session
  const augmented = applyManualCurrency(dataset, session, 'currency:augmentation').session.state
  assert.equal(augmented.prefixes.length, 1)
  assert.equal(augmented.suffixes.length, 1)
})

test('工艺台目录、普通升级、固定数值与唯一工艺替换', () => {
  const initial = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 31 })
  const catalog = listManualBenchCrafts(dataset, initial)
  assert.ok(catalog.items.some((entry) => entry.id === 'craft:life' && entry.canApply && entry.unlock === '默认'))
  assert.match(catalog.items.find((entry) => entry.id === 'craft:life-high').unavailableReason, /至少为 85/)
  const crafted = applyManualBenchCraft(dataset, initial, 'craft:life')
  assert.equal(crafted.session.state.rarity, 'magic')
  assert.match(crafted.session.state.prefixes[0].rolledText, /最大生命/)
  assert.deepEqual(crafted.session.state, applyManualBenchCraft(dataset, initial, 'craft:life').session.state)
  const replacement = crafted.benchCrafts.items.find((entry) => entry.id === 'craft:fire-resist')
  assert.equal(replacement.replacesExisting, true)
  assert.deepEqual(replacement.replacementCost, [{ resourceId: 'currency:scouring', resourceName: '重铸石', amount: 1 }])
  const replaced = applyManualBenchCraft(dataset, crafted.session, 'craft:fire-resist')
  assert.equal(replaced.session.state.prefixes.length, 0)
  assert.equal(replaced.session.state.suffixes[0].groupId, 'fire-resist')
  assert.equal(replaced.event.costs.some((entry) => entry.resourceName === '重铸石'), true)
})

test('五种元工艺占位、多大师上限、移除和历史联动', () => {
  const initial = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 44 })
  const lockSuffixes = applyManualBenchCraft(dataset, initial, 'bench:lock-suffixes')
  assert.equal(lockSuffixes.session.state.prefixes[0].metaCraft, true)
  assert.equal(lockSuffixes.session.state.meta.suffixesLocked, true)
  assert.deepEqual(redoManualAction(dataset, undoManualAction(dataset, lockSuffixes.session).session).session.state, lockSuffixes.session.state)
  initial.state.rarity = 'rare'
  let session = applyManualBenchCraft(dataset, initial, 'bench:multimod').session
  session = applyManualBenchCraft(dataset, session, 'craft:life').session
  session = applyManualBenchCraft(dataset, session, 'craft:fire-resist').session
  assert.equal([...session.state.prefixes, ...session.state.suffixes].filter((entry) => entry.source === 'crafted').length, 3)
  assert.match(listManualBenchCrafts(dataset, session).items.find((entry) => entry.id === 'bench:cannot-roll-attack').unavailableReason, /最多允许三条/)
  const removed = applyManualBenchCraft(dataset, session, 'bench:remove-crafted')
  assert.equal([...removed.session.state.prefixes, ...removed.session.state.suffixes].filter((entry) => entry.source === 'crafted').length, 0)
  assert.equal(Object.values(removed.session.state.meta).some(Boolean), false)
  assert.deepEqual(removed.event.costs, [{ resourceId: 'currency:scouring', resourceName: '重铸石', amount: 1 }])
})

test('化石目录、共振器校验、组合重铸和纠缠揭示可复现', () => {
  const initial = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 73 })
  assert.equal(listManualFossils(dataset, initial).items.length, 25)
  assert.equal(listManualFossils(dataset, initial).resonators.length, 4)
  assert.match(listManualFossils(dataset, initial).items[0].unavailableReason, /稀有物品/)
  // 此最小测试数据没有腐化固定词缀池，因此溅血化石仍按候选门禁安全禁用。
  assert.equal(listManualFossils(dataset, initial).items.find((entry) => entry.id === 'bloodstained').selectable, false)
  const rare = applyManualCurrency(dataset, initial, 'currency:alchemy').session
  assert.throws(() => applyManualFossils(dataset, rare, { sockets: 2, fossilIds: ['aetheric'] }), /恰好装入 2/)
  assert.throws(() => applyManualFossils(dataset, rare, { sockets: 2, fossilIds: ['aetheric', 'aetheric'] }), /重复化石/)
  const input = { sockets: 2, fossilIds: ['aetheric', 'tangled'] }
  const first = applyManualFossils(dataset, rare, input)
  const repeated = applyManualFossils(dataset, rare, input)
  assert.deepEqual(first.session.state, repeated.session.state)
  assert.deepEqual(first.event.tangled, repeated.event.tangled)
  assert.notEqual(first.event.tangled.moreTag, first.event.tangled.blockedTag)
  assert.equal(first.event.costs.length, 3)
  assert.deepEqual(undoManualAction(dataset, first.session).session.state, rare.state)
})

test('镂空、雕刻、圣洁、镶金和 3.29 随机破裂结果进入装备状态', () => {
  const specialDataset = structuredClone(dataset)
  specialDataset.modifiers.push(
    { id: 'mod:hollow', goalId: 'goal:hollow', familyId: 'family:hollow', modifierProfileId: 'Wands', groupId: 'AbyssJewelSocket', name: '深渊插槽', affixType: 'suffix', source: 'delve', tags: [], displayTags: [], spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences: [], tiers: [{ id: 'tier:hollow', tier: 1, name: 'T1 地下之', requiredLevel: 1, weight: 100, text: '拥有 1 个深渊插槽', values: [{ min: 1, max: 1 }], displayTags: [] }] },
    { id: 'mod:glyphic', goalId: 'goal:glyphic', familyId: 'family:glyphic', modifierProfileId: 'Wands', groupId: 'GlyphicDamage', name: '腐化精华属性', affixType: 'prefix', source: 'essence', tags: ['fire'], displayTags: [{ id: 'fire', label: '火焰' }], spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences: [], tiers: [{ id: 'tier:glyphic', tier: 1, name: 'T8 浮夸精华', requiredLevel: 1, weight: 0, text: '击中施放 20 级火焰爆破', values: [], displayTags: [{ id: 'fire', label: '火焰' }], sourceItem: { id: 'Essence_of_Hysteria', name: '浮夸精华', tier: 8, minimumItemLevel: 1, randomModifierLevelCap: null, canReforgeRare: true } }] }
  )
  let rare = createManualSession(specialDataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 99 })
  rare = applyManualCurrency(specialDataset, rare, 'currency:alchemy').session
  const result = applyManualFossils(specialDataset, rare, { sockets: 4, fossilIds: ['hollow', 'glyphic', 'sanctified', 'gilded'] })
  const affixes = [...result.session.state.prefixes, ...result.session.state.suffixes]
  assert.ok(affixes.some((entry) => entry.groupId === 'AbyssJewelSocket'))
  assert.ok(affixes.some((entry) => entry.sourceItemId === 'Essence_of_Hysteria'))
  assert.ok(result.session.state.implicits.includes('物品会被商贩高价购买'))
  const split = applyManualFossils(specialDataset, result.session, { sockets: 1, fossilIds: ['fractured'] })
  assert.equal(split.session.state.split, false)
  assert.equal([...split.session.state.prefixes, ...split.session.state.suffixes].filter((entry) => entry.fractured).length, 1)
  assert.equal(split.event.createdItem, null)
  assert.ok(split.event.fracturedModifier)
  assert.equal(split.session.variant.kind, 'fractured')
  assert.throws(() => applyManualFossils(specialDataset, split.session, { sockets: 1, fossilIds: ['fractured'] }), /已有破裂|不能.*分裂化石/)
})

function harvestDataset() {
  const result = structuredClone(dataset)
  result.bases[0].allowedVariants.push('influenced')
  const modifier = (id, groupId, name, effectKey, affixType, tags, source = 'natural', influences = []) => ({
    id, goalId: `goal:${id}`, familyId: `family:${id}`, modifierProfileId: 'Wands', groupId, name, effectKey,
    affixType, source, tags, displayTags: tags.map((tag) => ({ id: tag, label: tag })), spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences,
    tiers: [{ id: `tier:${id}`, tier: 2, name: `T2 ${name}`, requiredLevel: 1, weight: 1000, text: effectKey.replace('#%', '(20—30)%').replace('#', '(20—30)'), values: [{ min: 20, max: 30 }], displayTags: tags.map((tag) => ({ id: tag, label: tag })) }]
  })
  result.modifiers.push(
    modifier('mod:natural-life', 'natural-life', '健壮的', '# 最大生命', 'prefix', ['life']),
    modifier('mod:fire-resistance', 'fire-resistance', '焰火之', '#% 火焰抗性', 'suffix', ['fire', 'resistance']),
    modifier('mod:cold-resistance', 'cold-resistance', '冰河之', '#% 冰霜抗性', 'suffix', ['cold', 'resistance']),
    modifier('mod:lightning-resistance', 'lightning-resistance', '雷霆之', '#% 闪电抗性', 'suffix', ['lightning', 'resistance']),
    modifier('mod:fire-damage', 'fire-damage', '灼热的', '火焰伤害提高 #%', 'prefix', ['fire', 'elemental', 'damage']),
    modifier('mod:cold-damage', 'cold-damage', '冰冷的', '冰霜伤害提高 #%', 'prefix', ['cold', 'elemental', 'damage']),
    modifier('mod:shaper-life', 'shaper-life', '塑界者的', '# 最大生命', 'prefix', ['life', 'influence_mod'], 'shaper', ['shaper'])
  )
  const cost = [{ resourceId: 'resource:harvest:wild', resourceName: '狂野紫晶命能', amount: 75 }]
  result.crafts = [
    { id: 'harvest:life', provider: 'harvest', name: '重铸一件带随机词缀的稀有物品，其中包括一个生命词缀', effectKind: 'reforge_tag', itemClasses: [], cost, params: { tag: 'life' } },
    { id: 'harvest:more', provider: 'harvest', name: '重铸一件稀有物品，大概率会得到相同词缀类型', effectKind: 'reforge_more_likely', itemClasses: [], cost, params: {} },
    { id: 'harvest:cold-to-fire-resistance', provider: 'harvest', name: '将冰霜抗性变为火焰抗性', effectKind: 'convert_resistance', itemClasses: [], cost, params: { fromTag: 'cold', toTag: 'fire' } },
    { id: 'harvest:remove-add-life', provider: 'harvest', name: '添加生命词缀并去掉另一个随机词缀', effectKind: 'remove_add_tag', itemClasses: [], cost, params: { tag: 'life' } },
    { id: 'harvest:reforge-influence', provider: 'harvest', name: '重铸势力稀有物品并包含势力词缀', effectKind: 'reforge_influence', itemClasses: [], cost, params: {} },
    { id: 'harvest:randomize-influence', provider: 'harvest', name: '随机化势力类型并重铸', effectKind: 'randomize_influence', itemClasses: [], cost, params: {} },
    { id: 'harvest:weapon-quality', provider: 'harvest', name: '附魔一件武器，品质改为增加元素伤害', effectKind: 'quality_enchant', itemClasses: [], cost, params: { itemScope: 'weapon', qualityEffect: '品质每 2% 使元素伤害提高 1%' } },
    { id: 'harvest:synth', provider: 'harvest', name: '合成一件物品', effectKind: 'synthesize_item', itemClasses: [], cost, params: {} }
  ]
  return result
}

test('花园目录与保证标签、同类倾向和品质附魔使用确定性状态', () => {
  const current = harvestDataset()
  let session = createManualSession(current, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 321 })
  session = applyManualCurrency(current, session, 'currency:alchemy').session
  const catalog = listManualHarvestCrafts(current, session)
  assert.equal(catalog.total, 8)
  assert.equal(catalog.items.find((entry) => entry.id === 'harvest:life').canApply, true)
  assert.match(catalog.items.find((entry) => entry.id === 'harvest:synth').unavailableReason, /追忆固定词缀结果池/)
  const life = applyManualHarvestCraft(current, session, 'harvest:life')
  assert.ok([...life.session.state.prefixes, ...life.session.state.suffixes].some((entry) => current.modifiers.find((modifier) => modifier.id === entry.modifierId)?.tags.includes('life')))
  assert.deepEqual(life.session.state, applyManualHarvestCraft(current, session, 'harvest:life').session.state)
  const more = applyManualHarvestCraft(current, life.session, 'harvest:more')
  assert.equal(more.event.weightMultiplier, 10)
  const enchanted = applyManualHarvestCraft(current, more.session, 'harvest:weapon-quality')
  assert.equal(enchanted.session.state.qualityEffect, '品质每 2% 使元素伤害提高 1%')
  assert.equal(enchanted.session.state.enchanted, true)
  assert.deepEqual(undoManualAction(current, enchanted.session).session.state, more.session.state)
})

test('移除附魔固定消耗三枚重铸石并只清空腐化装备的附魔层', () => {
  const current = harvestDataset()
  let session = createManualSession(current, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 322 })
  const unavailable = listManualBenchCrafts(current, session).items.find((entry) => entry.id === 'bench:remove-enchantments')
  assert.equal(unavailable.canApply, false)
  assert.match(unavailable.unavailableReason, /没有可移除的附魔/)
  assert.deepEqual(unavailable.cost, [{ resourceId: 'currency:scouring', resourceName: '重铸石', amount: 3 }])
  assert.equal(unavailable.unlock, '默认解锁')

  session = applyManualCurrency(current, session, 'currency:alchemy').session
  session.state.quality = 20
  session = applyManualHarvestCraft(current, session, 'harvest:weapon-quality').session
  session.state.corrupted = true
  session.foreseeing = true
  const before = structuredClone(session.state)
  const action = listManualBenchCrafts(current, session).items.find((entry) => entry.id === 'bench:remove-enchantments')
  assert.equal(action.canApply, true)
  const removed = applyManualBenchCraft(current, session, action.id)
  assert.deepEqual(removed.session.state, { ...before, enchanted: false, qualityEffect: '' })
  assert.equal(removed.session.state.corrupted, true)
  assert.equal(removed.session.state.quality, 20)
  assert.equal(removed.session.foreseeing, false)
  assert.equal(removed.event.foreseeingConsumed, true)
  assert.equal(removed.event.removedEnchantment, before.qualityEffect)
  assert.deepEqual(removed.event.costs, [{ resourceId: 'currency:scouring', resourceName: '重铸石', amount: 3 }])

  const undone = undoManualAction(current, removed.session)
  assert.deepEqual(undone.session.state, before)
  assert.equal(undone.session.foreseeing, true)
  const redone = redoManualAction(current, undone.session)
  assert.equal(redone.session.state.enchanted, false)
  assert.equal(redone.event.removedEnchantment, before.qualityEffect)
  assert.equal(resetManualSession(current, redone.session).session.state.enchanted, false)
})

test('3.29 魔符破裂保持禁用且镜像装备不能通过工艺台移除附魔', () => {
  const current = harvestDataset()
  let session = createManualSession(current, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 323 })
  session = applyManualCurrency(current, session, 'currency:alchemy').session
  session = applyManualHarvestCraft(current, session, 'harvest:weapon-quality').session
  assert.match(listManualBeastcrafts(current, session).items.find((entry) => entry.id === 'fracture-talisman-one').unavailableReason, /3\.29.*魔符/)
  session.state.mirrored = true
  const action = listManualBenchCrafts(current, session).items.find((entry) => entry.id === 'bench:remove-enchantments')
  assert.equal(action.canApply, false)
  assert.match(action.unavailableReason, /镜像/)
  assert.throws(() => applyManualBenchCraft(current, session, action.id), /镜像/)
})

test('花园元素转换与移除添加保持词缀侧并记录实际变化', () => {
  const current = harvestDataset()
  const session = createManualSession(current, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 654 })
  session.state.rarity = 'rare'
  const cold = current.modifiers.find((entry) => entry.id === 'mod:cold-resistance')
  session.state.suffixes.push({ goalId: cold.goalId, modifierId: cold.id, tierId: cold.tiers[0].id, groupId: cold.groupId, source: 'natural', affixType: 'suffix', name: cold.name, tierName: cold.tiers[0].name, text: cold.tiers[0].text, rolledText: '+25% 冰霜抗性', valueRanges: cold.tiers[0].values, rolledValues: [25], displayTags: cold.displayTags, weight: 1000 })
  const converted = applyManualHarvestCraft(current, session, 'harvest:cold-to-fire-resistance')
  assert.equal(converted.session.state.suffixes.some((entry) => entry.modifierId === 'mod:fire-resistance'), true)
  assert.equal(converted.event.convertedFrom.modifierId, 'mod:cold-resistance')
  const augmented = applyManualHarvestCraft(current, converted.session, 'harvest:remove-add-life')
  assert.ok(augmented.event.removedModifier)
  assert.ok([...augmented.session.state.prefixes, ...augmented.session.state.suffixes].some((entry) => current.modifiers.find((modifier) => modifier.id === entry.modifierId)?.tags.includes('life')))
})

test('花园势力重铸保证势力词缀并在撤销重做时同步变体', () => {
  const current = harvestDataset()
  let session = createManualSession(current, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'influenced', influences: ['shaper'] }, seed: 987 })
  session.state.rarity = 'rare'
  const reforged = applyManualHarvestCraft(current, session, 'harvest:reforge-influence')
  assert.ok([...reforged.session.state.prefixes, ...reforged.session.state.suffixes].some((entry) => entry.source === 'shaper'))
  const randomized = applyManualHarvestCraft(current, reforged.session, 'harvest:randomize-influence')
  assert.notDeepEqual(randomized.session.variant.influences, ['shaper'])
  assert.deepEqual(randomized.session.variant.influences, randomized.session.state.influences)
  const undone = undoManualAction(current, randomized.session)
  assert.deepEqual(undone.session.variant.influences, ['shaper'])
  assert.deepEqual(redoManualAction(current, undone.session).session.variant.influences, randomized.session.variant.influences)
})
})()

// === Merged from manualEldritchCrafting.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const applyManualEldritchCraft = _m4_applyManualEldritchCraft
  const createManualSession = _m4_createManualSession
  const listManualEldritchCrafts = _m4_listManualEldritchCrafts
  const redoManualAction = _m4_redoManualAction
  const resetManualSession = _m4_resetManualSession
  const undoManualAction = _m4_undoManualAction
const makeModifier = (id, affixType, tags) => ({
  id: `mod:${id}`, goalId: `goal:${id}`, familyId: `family:${id}`, modifierProfileId: 'Gloves', groupId: id,
  name: id, affixType, source: 'natural', tags, displayTags: tags.map((tag) => ({ id: tag, label: tag })),
  spawnTags: ['gloves'], requiredTags: [], itemClasses: ['Gloves'], influences: [],
  tiers: [{ id: `tier:${id}`, tier: 1, name: 'T1', requiredLevel: 1, weight: 1000, text: `${id} (1—10)`, values: [{ min: 1, max: 10 }], displayTags: tags.map((tag) => ({ id: tag, label: tag })) }]
})
const makeEldritchFamily = (source, id) => ({
  id: `eldritch:${source}:${id}`, source, effectKey: `${id} #`, name: id, itemClasses: ['Gloves'], tags: [id], displayTags: [{ id, label: id }],
  tiers: Array.from({ length: 6 }, (_, index) => ({
    id: `eldritch:${source}:${id}:t${index + 1}`, tier: index + 1, name: `T${index + 1}`, requiredLevel: 1,
    text: `${id} (${index + 1}—${index + 2})`, values: [{ min: index + 1, max: index + 2 }], displayTags: [{ id, label: id }], weights: { Gloves: 1000 }
  }))
})
const dataset = {
  bases: [{ id: 'base:gloves', name: '测试手套', displayName: '测试手套', itemClass: 'Gloves', categoryPath: ['防具', '手套'], modifierProfileId: 'Gloves', requiredLevel: 1, requirements: { level: 1, strength: 0, dexterity: 0, intelligence: 0 }, qualityType: 'armour', socketLimit: 4, baseStats: [], implicitModifiers: [], tags: ['gloves'], maxAffixes: { prefix: 3, suffix: 3 }, allowedVariants: ['normal', 'fractured', 'influenced'] }],
  modifiers: [makeModifier('attack', 'prefix', ['attack']), makeModifier('life', 'prefix', ['life']), makeModifier('speed', 'suffix', ['speed']), makeModifier('cold', 'suffix', ['cold'])],
  modifierFamilies: [], crafts: [], eldritchImplicitFamilies: [makeEldritchFamily('exarch', 'fire'), makeEldritchFamily('eater', 'cold')]
}

function session(seed = 7) {
  return createManualSession(dataset, { baseId: 'base:gloves', itemLevel: 84, variant: { kind: 'normal' }, seed })
}

test('八种直接通货生成真实阶级、替换同侧并保留对侧', () => {
  let current = session()
  current.state.implicits = ['底材固定词缀']
  const first = applyManualEldritchCraft(dataset, current, 'eldritch:grand-eldritch-ember')
  assert.equal(first.session.state.eldritchImplicits.exarch.tier, 3)
  assert.deepEqual(first.session.state.implicits, [])
  const second = applyManualEldritchCraft(dataset, first.session, 'eldritch:exceptional-eldritch-ichor')
  assert.equal(second.session.state.eldritchImplicits.exarch.tier, 3)
  assert.equal(second.session.state.eldritchImplicits.eater.tier, 4)
  assert.equal(second.eldritch.dominance.source, 'eater')
  assert.deepEqual(undoManualAction(dataset, second.session).session.state, first.session.state)
  assert.deepEqual(redoManualAction(dataset, undoManualAction(dataset, second.session).session).session.state, second.session.state)
  assert.equal(resetManualSession(dataset, second.session).session.state.eldritchImplicits.exarch, null)
})

test('直接古灵通货拒绝非护甲、势力、腐化与空候选', () => {
  const influenced = session()
  influenced.state.influences = ['shaper']
  assert.match(listManualEldritchCrafts(dataset, influenced).items[0].unavailableReason, /势力/)
  const corrupted = session()
  corrupted.state.corrupted = true
  assert.match(listManualEldritchCrafts(dataset, corrupted).items[0].unavailableReason, /腐化/)
  const low = session()
  low.itemLevel = 0
  assert.match(listManualEldritchCrafts(dataset, low).items[0].unavailableReason, /没有可用/)
})

test('支配崇高和无效定向修改显式并遵守标签元工艺', () => {
  let current = applyManualEldritchCraft(dataset, session(19), 'eldritch:exceptional-eldritch-ember').session
  current.state.rarity = 'rare'
  current.state.meta.cannotRollAttack = true
  const exalted = applyManualEldritchCraft(dataset, current, 'eldritch:exalted')
  assert.equal(exalted.session.state.prefixes.length, 1)
  assert.equal(exalted.session.state.prefixes[0].modifierId, 'mod:life')
  exalted.session.state.prefixes.push({ ...exalted.session.state.prefixes[0], modifierId: 'mod:attack', goalId: 'goal:attack', tierId: 'tier:attack', groupId: 'attack', name: 'attack', displayTags: [{ id: 'attack', label: 'attack' }] })
  exalted.session.state.meta.cannotRollAttack = true
  const annulled = applyManualEldritchCraft(dataset, exalted.session, 'eldritch:annulment')
  assert.equal(annulled.event.removedModifier.modifierId, 'mod:life')
  assert.ok(annulled.session.state.prefixes.some((entry) => entry.modifierId === 'mod:attack'))
  const locked = structuredClone(exalted.session)
  locked.state.meta.prefixesLocked = true
  assert.match(listManualEldritchCrafts(dataset, locked).items.find((entry) => entry.id === 'eldritch:annulment').unavailableReason, /可移除/)
})

test('古灵混沌只重铸支配侧，冲突石处理 T1 删除与 T6 浪费升级', () => {
  let current = applyManualEldritchCraft(dataset, session(31), 'eldritch:exceptional-eldritch-ember').session
  current = applyManualEldritchCraft(dataset, current, 'eldritch:lesser-eldritch-ichor').session
  current.state.rarity = 'rare'
  current.state.prefixes = [{ goalId: 'old', modifierId: 'old', tierId: 'old', groupId: 'old', source: 'natural', affixType: 'prefix', name: 'old', tierName: 'T1', text: 'old', rolledText: 'old', valueRanges: [], rolledValues: [], displayTags: [], weight: 1, fractured: false, metaCraft: false }]
  current.state.suffixes = [{ goalId: 'keep', modifierId: 'keep', tierId: 'keep', groupId: 'keep', source: 'natural', affixType: 'suffix', name: 'keep', tierName: 'T1', text: 'keep', rolledText: 'keep', valueRanges: [], rolledValues: [], displayTags: [], weight: 1, fractured: false, metaCraft: false }]
  assert.equal(listManualEldritchCrafts(dataset, current).items.find((entry) => entry.id === 'eldritch:chaos').canApply, true)
  const chaos = applyManualEldritchCraft(dataset, current, 'eldritch:chaos')
  assert.equal(chaos.session.state.suffixes[0].modifierId, 'keep')
  assert.equal(chaos.session.state.prefixes.some((entry) => entry.modifierId === 'old'), false)

  const conflictInput = structuredClone(current)
  conflictInput.state.eldritchImplicits.exarch = { ...conflictInput.state.eldritchImplicits.exarch, tier: 6, tierId: 'eldritch:exarch:fire:t6' }
  conflictInput.state.eldritchImplicits.eater = { ...conflictInput.state.eldritchImplicits.eater, tier: 1, tierId: 'eldritch:eater:cold:t1' }
  conflictInput.rngState = 1
  const conflict = applyManualEldritchCraft(dataset, conflictInput, 'eldritch:conflict')
  assert.equal(conflict.session.state.eldritchImplicits.exarch.tier, 6)
  assert.equal(conflict.session.state.eldritchImplicits.eater, null)
  assert.equal(conflict.event.conflict.upgradeSource, 'exarch')
})
})()

// === Merged from mapAffixSuggestions.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const readFileSync = _m5_readFileSync
  const ATLAS_MAP_AFFIX_CATALOG_META = _m5_ATLAS_MAP_AFFIX_CATALOG_META
  const ATLAS_MAP_AFFIX_SUGGESTIONS = _m5_ATLAS_MAP_AFFIX_SUGGESTIONS
  const FRAGMENT_CHART_MODS = _m5_FRAGMENT_CHART_MODS
  const matchMapRequirements = _m5_matchMapRequirements
  const CHART_AFFIX_SUGGESTIONS = _m5_CHART_AFFIX_SUGGESTIONS
  const affixSuggestionsForKind = _m5_affixSuggestionsForKind
  const buildChartAffixSuggestions = _m5_buildChartAffixSuggestions
  const searchMapAffixSuggestions = _m5_searchMapAffixSuggestions
function assertCatalogContract(kind, catalog) {
  assert.ok(catalog.length > 0, `${kind} 候选不应为空`)
  assert.equal(new Set(catalog.map(entry => entry.value)).size, catalog.length, `${kind} value 应唯一`)
  for (const entry of catalog) {
    assert.ok(entry.value.trim(), `${kind} value 不应为空`)
    assert.doesNotMatch(entry.value, /\d/, `${kind} value 不应包含可变数值`)
    assert.ok(entry.example.includes(entry.value), `${kind} 示例应包含 value: ${entry.value}`)
    assert.ok(['prefix', 'suffix', 'mixed'].includes(entry.affixType), `${kind} 词缀类型无效`)
    assert.ok(Array.isArray(entry.tags), `${kind} tags 应为数组`)
    assert.ok(entry.variants.length > 0, `${kind} variants 不应为空`)
    assert.ok(entry.variants.every(variant => variant.includes(entry.value)), `${kind} value 应命中全部档位: ${entry.value}`)
  }
}

test('异界地图与航海海图候选满足稳定子串契约', () => {
  assert.equal(ATLAS_MAP_AFFIX_CATALOG_META.game, 'poe1')
  assert.equal(ATLAS_MAP_AFFIX_CATALOG_META.gameVersion, '3.30.0')
  assert.equal(ATLAS_MAP_AFFIX_CATALOG_META.locale, 'zh-CN')
  assert.equal(ATLAS_MAP_AFFIX_CATALOG_META.sourceUrl, 'https://poedb.tw/cn/Maps_uber_tier')
  assert.deepEqual(ATLAS_MAP_AFFIX_CATALOG_META.sourceUrls, [
    'https://poedb.tw/cn/Maps_low_tier',
    'https://poedb.tw/cn/Maps_mid_tier',
    'https://poedb.tw/cn/Maps_top_tier',
    'https://poedb.tw/cn/Maps_uber_tier'
  ])
  assert.equal(ATLAS_MAP_AFFIX_SUGGESTIONS.length, 131, '3.30.0 低、中、高阶及 Uber 地图快照应覆盖 131 个稳定语义行')
  assertCatalogContract('atlas', ATLAS_MAP_AFFIX_SUGGESTIONS)
  assertCatalogContract('chart', CHART_AFFIX_SUGGESTIONS)
  assert.equal(CHART_AFFIX_SUGGESTIONS.length, 45)
  assert.ok(CHART_AFFIX_SUGGESTIONS.every(entry => ['prefix', 'suffix'].includes(entry.affixType)))

  const physicalThorns = ATLAS_MAP_AFFIX_SUGGESTIONS.find(entry => entry.value === '稀有怪物带有物理荆棘')
  assert.deepEqual(physicalThorns?.variants, [
    '稀有怪物带有物理荆棘，反射 400 点物理伤害',
    '稀有怪物带有物理荆棘，反射 600 点物理伤害',
    '稀有怪物带有物理荆棘，反射 800 点物理伤害',
    '稀有怪物带有物理荆棘，反射 1500 点物理伤害'
  ])
  assert.ok(ATLAS_MAP_AFFIX_SUGGESTIONS.every(entry => (
    !/^(该区域物品掉落数量提高|该地图的物品稀有度提高|怪物群规模扩大|区域内找到的(?:地图|通货|圣甲虫)总增|map )/.test(entry.value)
  )))
})

test('Uber 地图专属词缀完整并入异界地图候选', () => {
  const uberOnlyValues = [
    '怪物的投射物击中地形时产生连锁', '怪物的暴击球上限', '怪物的狂怒球上限',
    '怪物的耐力球上限', '怪物被击中时获得一个耐力球', '怪物的所有击中伤害造成中毒状态',
    '怪物的中毒时间提高', '格挡攻击伤害', '玩家从偷取中获得的每秒最大生命、魔力和能量护盾总回复量降低',
    '每个稀有怪物额外具有', '随机神龛增益', '缓速藤蔓', '稀有怪物有无常之核',
    '额外随机元素伤害', '玩家会受到血痕锯刃魔的袭击', '玩家使用药剂时成为陨石的目标',
    '玩家的防御属性总降', '区域内有淹没法球', '所有怪物的伤害都可以点燃、冻结和感电',
    '怪物击中时造成点燃、冻结和感电', '召唤生物的伤害穿透', '区域包含不稳定的恶魔触手',
    '区域内的稀有怪物被塑界者触碰', '地图首领伴随着一个虚空忆境首领',
    '怪物受到的减益效果消减速度加快', '区域内包含焚界者符文', '贤主会干涉玩家',
    '的几率分裂', '影响友军的玩家光环技能同样影响敌人', '区域内的稀有怪物死亡时暂时复活',
    '区域内包含迷宫陷阱', '玩家受到的药剂效果总降', '区域内有移动的印记地面，施加随机印记'
  ]
  const actualValues = new Set(ATLAS_MAP_AFFIX_SUGGESTIONS.map(entry => entry.value))
  assert.deepEqual(uberOnlyValues.filter(value => !actualValues.has(value)), [])

  assert.ok(searchMapAffixSuggestions('atlas', '无常之核').some(entry => entry.value === '稀有怪物有无常之核'))
  assert.ok(searchMapAffixSuggestions('atlas', '额外随机元素伤害').some(entry => entry.value === '额外随机元素伤害'))
  assert.equal(searchMapAffixSuggestions('chart', '无常之核').length, 0)
  assert.ok(ATLAS_MAP_AFFIX_SUGGESTIONS.every(entry => entry.variants.every(variant => (
    !/^区域内找到的(?:地图|通货|圣甲虫)总增/.test(variant)
  ))))
})

test('海图构建器合并数值档位并排除奖励行、传奇和未揭示说明', () => {
  const suggestions = buildChartAffixSuggestions([
    {
      affixType: 'prefix', tags: ['伤害'],
      lines: ['怪物伤害提高 10%', '相邻区域中找到的亡者硫磺提高 30%']
    },
    {
      affixType: 'prefix', tags: ['伤害'],
      lines: ['怪物伤害提高 30%', '相邻区域中找到的亡者硫磺提高 45%']
    },
    { affixType: 'legendary', tags: [], lines: ['传奇边框词缀'] },
    { affixType: '', tags: [], lines: ['空标签词缀'] },
    { affixType: 'unknown', tags: [], lines: ['未知标签词缀'] },
    { affixType: 'prefix', tags: [], lines: ['航行词缀将在完成测绘后揭示'] }
  ])

  assert.equal(suggestions.length, 1)
  assert.equal(suggestions[0].value, '怪物伤害提高')
  assert.deepEqual(suggestions[0].variants, ['怪物伤害提高 10%', '怪物伤害提高 30%'])
  assert.ok(CHART_AFFIX_SUGGESTIONS.every(entry => entry.affixType !== 'legendary'))
  assert.ok(CHART_AFFIX_SUGGESTIONS.every(entry => entry.value !== '航行词缀将在完成测绘后揭示'))
  assert.ok(CHART_AFFIX_SUGGESTIONS.every(entry => !entry.value.startsWith('相邻区域中找到的亡者硫磺提高')))
})

test('海图快照保留来源空标签，联想仅接受明确前后缀', () => {
  const legendaryIndex = FRAGMENT_CHART_MODS.findIndex(entry => entry.affixType === 'legendary')
  assert.equal(legendaryIndex, 81)
  assert.deepEqual(
    FRAGMENT_CHART_MODS.slice(0, legendaryIndex).reduce((counts, entry) => {
      counts[entry.affixType] = (counts[entry.affixType] || 0) + 1
      return counts
    }, {}),
    { suffix: 32, prefix: 49 }
  )
  assert.equal(FRAGMENT_CHART_MODS.slice(legendaryIndex + 1).length, 68)
  assert.ok(FRAGMENT_CHART_MODS.slice(legendaryIndex + 1).every(entry => entry.affixType === ''))

  const ambiguous = buildChartAffixSuggestions([
    { affixType: 'prefix', tags: [], lines: ['相同稳定词缀 10%'] },
    { affixType: 'suffix', tags: [], lines: ['相同稳定词缀 20%'] }
  ])
  assert.deepEqual(ambiguous, [], '跨前后缀的相同稳定文本不应生成 mixed 候选')
  assert.deepEqual(searchMapAffixSuggestions('chart', '额外被囚禁的怪物'), [])
  assert.deepEqual(searchMapAffixSuggestions('chart', '友善水母'), [])
})

test('联想搜索严格隔离地图与海图，支持关键词、示例和标签', () => {
  assert.equal(affixSuggestionsForKind('atlas'), ATLAS_MAP_AFFIX_SUGGESTIONS)
  assert.equal(affixSuggestionsForKind('chart'), CHART_AFFIX_SUGGESTIONS)
  assert.deepEqual(affixSuggestionsForKind('unknown'), [])

  assert.ok(searchMapAffixSuggestions('atlas', '物理荆棘').some(entry => entry.value === '稀有怪物带有物理荆棘'))
  assert.equal(searchMapAffixSuggestions('chart', '物理荆棘').length, 0)
  assert.ok(searchMapAffixSuggestions('chart', '80% 的几率避免元素异常状态').some(entry => entry.value.includes('避免元素异常状态')))
  assert.equal(searchMapAffixSuggestions('atlas', '80% 的几率避免元素异常状态').length, 0)
  assert.ok(searchMapAffixSuggestions('atlas', '稀有怪物').length > 0, '应可按标签搜索')
  assert.ok(searchMapAffixSuggestions('atlas', '转化为额外能量护盾').length > 0, '应可按示例文本搜索')
  assert.deepEqual(searchMapAffixSuggestions('atlas', '  '), [])
  assert.deepEqual(searchMapAffixSuggestions('unknown', '伤害'), [])
  assert.equal(searchMapAffixSuggestions('chart', '怪物', 2).length, 2)
})

test('国际服使用回退词库时地图联想保存并匹配用户看到的中文', () => {
  const entry = affixSuggestionsForKind('atlas', 'en')[0]
  const displayText = '测试用中文地图词缀 #%'
  const fallback = new Map([[entry.pattern, { displayText, aliases: [displayText] }]])
  const [suggestion] = searchMapAffixSuggestions('atlas', '测试用中文', 50, 'en', fallback)
  assert.ok(suggestion)
  assert.equal(suggestion.value, displayText)
  assert.equal(suggestion.canonicalValue, entry.value)
  assert.equal(suggestion.displayText, displayText)
  const visibleItemText = displayText.replace('#', '25')
  assert.equal(matchMapRequirements({ category: '异界地图', explicitMods: [visibleItemText] }, { match: { blacklist: [displayText], whitelist: [] } }).reason, 'blacklist')
})

test('地图黑白名单界面使用可自由编辑的分类自动完成', () => {
  const panel = readFileSync(new URL('../src/domains/map/components/MapRollingProfilePanel.vue', import.meta.url), 'utf8')
  const view = readFileSync(new URL('../src/domains/map/MapView.vue', import.meta.url), 'utf8')
  assert.equal((panel.match(/<el-autocomplete/g) || []).length, 2)
  assert.match(panel, /v-model="profile\.match\.blacklist\[index\]"/)
  assert.match(panel, /v-model="profile\.match\.whitelist\[index\]"/)
  assert.match(panel, /:fetch-suggestions="fetchSuggestions"/)
  assert.match(panel, /:trigger-on-focus="false"/)
  assert.match(panel, /searchMapAffixSuggestions\(props\.targetKind, query, 50, undefined, suggestionCatalog\(\)\)/)
  assert.match(panel, /electronApi\.crafting\.searchAffixAliases/)
  assert.match(panel, /item\.displayText \|\| item\.value/)
  assert.match(panel, /map-affix-suggestion-popper/)
  assert.match(panel, /item\.value/)
  assert.match(panel, /item\.example/)
  assert.match(view, /:target-kind="activeKind"/)
})
})()

// === Merged from mapCraftingLocalization.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const createHash = _m6_createHash
  const readFileSync = _m6_readFileSync
  const LocalizationRuntime = _m6_LocalizationRuntime
  const matchMapRequirements = _m6_matchMapRequirements
const catalog = JSON.parse(readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)))
const hash = value => createHash('sha256').update(String(value)).digest('hex')
const signed = entry => ({ ...entry, sourceHash: hash(entry.en) })

const entries = [
  // 1. 怪物免疫诅咒: Hexproof (in trade catalog) vs Immune to Curses (not in trade catalog)
  signed({
    kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
    id: 'map_monsters_are_hexproof', field: 'variant:0',
    en: 'Monsters are Hexproof', cn: '怪物免疫诅咒', tw: '怪物不能受到詛咒'
  }),
  signed({
    kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
    id: 'map_monsters_are_immune_to_curses', field: 'variant:0',
    en: 'Monsters are Immune to Curses', cn: '怪物免疫诅咒', tw: '怪物免疫詛咒'
  }),
  // 2. 怪物生命总增 #%
  signed({
    kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
    id: 'map_monsters_life_+%', field: 'variant:0',
    en: '{0}% more Monster Life', cn: '怪物生命总增 {0}%', tw: '{0}% 更多怪物生命'
  }),
  signed({
    kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
    id: 'map_heist_monster_life_+%_final_from_sextant', field: 'variant:0',
    en: 'Monsters have {0}% more Life', cn: '怪物生命总增 {0}%', tw: '怪物有 {0}% 更多生命'
  }),
  // 3. 魔法怪物数量提高 #%
  signed({
    kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
    id: 'map_number_of_magic_packs_+% chart_magic_monsters_voyage_display_stat', field: 'variant:0',
    en: '{0}% increased Magic Monsters', cn: '魔法怪物数量提高 {0}%', tw: '魔法怪物增加 {0}%'
  }),
  signed({
    kind: 'stat', table: 'metadata/statdescriptions/expedition_relic_stat_descriptions.csd',
    id: 'map_number_of_magic_packs_+% chart_magic_monsters_voyage_display_stat', field: 'variant:0',
    en: '{0}% increased number of Magic Monsters', cn: '魔法怪物数量提高 {0}%', tw: '增加 {0}% 魔法怪物的數量'
  }),
  // 4. 怪物可以发射 # 个额外投射物
  signed({
    kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
    id: 'map_monsters_additional_number_of_projecitles map_players_additional_number_of_projectiles', field: 'variant:0',
    en: 'Monsters fire {0} additional Projectiles', cn: '怪物可以发射 {0} 个额外投射物', tw: '怪物發射 {0} 額外投射物'
  }),
  signed({
    kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
    id: 'map_monsters_additional_number_of_projecitles map_players_additional_number_of_projectiles', field: 'variant:1',
    en: 'Players fire {1} additional Projectiles', cn: '怪物可以发射 {1} 个额外投射物', tw: '玩家發射 {1} 額外投射物'
  }),
  // 5. 怪物击中时致盲 + 双重 remindertext (与用户报错一致)
  signed({
    kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
    id: 'map_monsters_chance_to_blind_on_hit_%', field: 'variant:0',
    en: 'Monsters Blind on Hit', cn: '怪物击中时致盲', tw: '怪物擊中時致盲'
  }),
  signed({
    kind: 'dat', table: 'remindertext', id: 'ReminderTextBlindNoDuration', field: 'Text',
    en: '(Being Blinded causes 20% less Accuracy Rating and Evasion Rating)',
    cn: '（被致盲时命中和闪避在接下来 4 秒总降 20%）',
    tw: '（ 被致盲有20%更少命中率和閃避值 ）'
  }),
  signed({
    kind: 'dat', table: 'remindertext', id: 'ReminderTextBlind', field: 'Text',
    en: '(Being Blinded causes 20% less Accuracy Rating and Evasion Rating, for 4 seconds)',
    cn: '（被致盲时命中和闪避在接下来 4 秒总降 20%）',
    tw: '（ 被致盲有20%更少命中率和閃避值，持續4秒 ）'
  }),
  signed({
    kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
    id: 'map_area_contains_mirage', field: 'variant:0',
    en: 'Area contains a Mirage', cn: '区域内有一个沙海幻境', tw: '區域內含有一座蜃景'
  })
]

const makeMap = modLines => [
  '物品类别: 异界地图',
  '稀有度: 稀有',
  '测试魔境',
  '地图(16 阶)',
  '--------',
  '地图阶级: 16',
  '物品数量: +105% (增幅)',
  '物品稀有度: +62% (增幅)',
  '怪物群大小: +34% (增幅)',
  '--------',
  '物品等级: 83',
  '--------',
  ...modLines
].join('\n')

test('地图制作接入官方目录消歧高频多候选词缀，并保留中文别名用于黑白名单匹配', () => {
  const runtime = new LocalizationRuntime({
    serverId: 'international',
    entries: () => entries,
    revision: () => 'fixture',
    catalog: () => catalog
  })
  const item = runtime.parseItem(makeMap([
    '怪物免疫诅咒',
    '怪物生命总增 25%',
    '魔法怪物数量提高 25%',
    '怪物可以发射 2 个额外投射物'
  ]), 'fixture')

  assert.deepEqual(item.explicitMods, [
    'Monsters are Hexproof',
    '25% more Monster Life',
    '25% increased Magic Monsters',
    'Monsters fire 2 additional Projectiles'
  ])
  assert.ok(item.modTextAliases['Monsters are Hexproof'].includes('怪物免疫诅咒'))
  assert.ok(item.modTextAliases['25% more Monster Life'].includes('怪物生命总增 25%'))
  assert.ok(item.modTextAliases['25% increased Magic Monsters'].includes('魔法怪物数量提高 25%'))
  assert.ok(item.modTextAliases['Monsters fire 2 additional Projectiles'].includes('怪物可以发射 2 个额外投射物'))

  for (const term of ['怪物免疫诅咒', '怪物生命总增', '魔法怪物数量提高', '额外投射物']) {
    const result = matchMapRequirements(item, { targetKind: 'atlas', match: { blacklist: [term] } })
    assert.equal(result.isMatch, false, `黑名单 "${term}" 应命中并拒绝`)
    assert.equal(result.reason, 'blacklist')
  }
})

test('地图制作自动剥离已核实的括号提醒文本（兼容全半角括号），并继续阻断未知括号文本', () => {
  const runtime = new LocalizationRuntime({
    serverId: 'international',
    entries: () => entries,
    revision: () => 'fixture'
  })

  for (const reminder of [
    '（被致盲时命中和闪避在接下来 4 秒总降 20%）',
    '(被致盲时命中和闪避在接下来 4 秒总降 20%)'
  ]) {
    const item = runtime.parseItem(makeMap(['怪物击中时致盲', reminder]), 'fixture')
    assert.deepEqual(item.explicitMods, ['Monsters Blind on Hit'])
  }

  assert.throws(
    () => runtime.parseItem(makeMap(['怪物击中时致盲', '（未知的提醒文本）']), 'fixture'),
    error => error.code === 'LOCALIZATION_UNRESOLVED'
  )
})

test('目录无法唯一消歧时仍严格抛出 LOCALIZATION_AMBIGUOUS', () => {
  const runtime = new LocalizationRuntime({
    serverId: 'international',
    entries: () => [
      ...entries,
      signed({
        kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
        id: 'ambiguous_a', field: 'variant:0',
        en: 'Players cannot Regenerate Life, Mana or Energy Shield', cn: '自定义歧义词缀'
      }),
      signed({
        kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
        id: 'ambiguous_b', field: 'variant:0',
        en: 'Monsters are Hexproof', cn: '自定义歧义词缀'
      })
    ],
    revision: () => 'fixture',
    catalog: () => catalog
  })

  assert.throws(
    () => runtime.parseItem(makeMap(['自定义歧义词缀']), 'fixture'),
    error => error.code === 'LOCALIZATION_AMBIGUOUS'
  )
})

test('支持 稀有限定 / Rare-only 及新增详细词缀头，并归入显性词缀参与黑白名单匹配', () => {
  const runtime = new LocalizationRuntime({
    serverId: 'international',
    entries: () => entries,
    revision: () => 'fixture',
    catalog: () => catalog
  })
  for (const header of ['{ 稀有限定 (等阶：1) }', '{ Rare-only (Tier: 1) }']) {
    const item = runtime.parseItem(makeMap([header, '区域内有一个沙海幻境']), 'fixture')
    assert.deepEqual(item.explicitMods, ['Area contains a Mirage'])
    assert.equal(item.modifiers[0].type, 'explicit')
    assert.equal(item.modifiers[0].tier, 1)
    assert.equal(
      matchMapRequirements(item, { targetKind: 'atlas', match: { whitelist: ['沙海幻境'] } }).isMatch,
      true
    )
    assert.equal(
      matchMapRequirements(item, { targetKind: 'atlas', match: { blacklist: ['沙海幻境'] } }).isMatch,
      false
    )
  }

  for (const header of [
    '{ 亵渎的 前缀属性 "测试" (等阶：1) }',
    '{ 已褻瀆 前綴 "測試" (階層：1) }',
    '{ 天灾词缀 }',
    '{ 怪物属性 }'
  ]) {
    const item = runtime.parseItem(makeMap([header, '怪物免疫诅咒']), 'fixture')
    assert.ok(item.canonicalText.includes('Monsters are Hexproof'), header)
  }
})
})()

// === Merged from mirageCrafting.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const readFile = _m7_readFile
  const CURRENT_EQUIPMENT_CURRENCIES = _m7_CURRENT_EQUIPMENT_CURRENCIES
  const CURRENT_RULESET = _m7_CURRENT_RULESET
  const createManualSession = _m7_createManualSession
  const inspectManualCurrencies = _m7_inspectManualCurrencies
  const normalizeCraftingDataset = _m7_normalizeCraftingDataset
const dataset = normalizeCraftingDataset(JSON.parse(await readFile('electron/assets/crafting-data/dataset.json', 'utf8')))

test('S30 装备通货公开真实作用且在缺少专属物品模型时安全禁用', () => {
  assert.equal(CURRENT_RULESET.patch, '3.29')
  assert.equal(CURRENT_RULESET.season, 'S30')
  assert.deepEqual(CURRENT_EQUIPMENT_CURRENCIES.map((entry) => entry.id), [
    'currency:volatile-vaal-orb', 'currency:scrying-orb',
    'currency:enshrouding-crystal', 'currency:allflame-ducat'
  ])
  const base = dataset.bases.find((entry) => entry.name === '大型星团珠宝') ?? dataset.bases[0]
  const session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 328 })
  const catalog = inspectManualCurrencies(dataset, session)
  for (const definition of CURRENT_EQUIPMENT_CURRENCIES) {
    const item = catalog.find((entry) => entry.id === definition.id)
    assert.ok(item, `${definition.name} 未进入手动通货目录`)
    assert.equal(item.canApply, false)
    assert.equal(item.description, definition.effect)
    assert.equal(item.unavailableReason, definition.unsupportedReason)
    assert.match(item.unavailableReason, /当前模拟器|当前.*状态模型/)
  }
})
})()

// === Merged from modSelection.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const familySelectionState = _m8_familySelectionState
  const tierSelectionKey = _m8_tierSelectionKey
  const toggleFamilySelection = _m8_toggleFamilySelection
  const toggleTierSelection = _m8_toggleTierSelection
const tier = (id, modifierId, available = true) => ({ id, modifierId, available })

test('稳定选择键隔离不同 modifier 下的同名阶级 ID', () => {
  assert.notEqual(tierSelectionKey(tier('tier:1', 'modifier:a')), tierSelectionKey(tier('tier:1', 'modifier:b')))
  assert.throws(() => tierSelectionKey({ id: 'tier:1' }), /缺少稳定标识/)
})

test('单项切换不会选择不可用阶级', () => {
  const available = tier('tier:1', 'modifier:a')
  const unavailable = tier('tier:2', 'modifier:a', false)
  const selected = toggleTierSelection(new Set(), available, true)
  assert.equal(selected.has(tierSelectionKey(available)), true)
  assert.equal(toggleTierSelection(selected, unavailable, true).has(tierSelectionKey(unavailable)), false)
  assert.equal(toggleTierSelection(selected, available, false).size, 0)
})

test('Family 批量切换只处理合法阶级并报告全选和半选', () => {
  const first = tier('tier:1', 'modifier:a')
  const second = tier('tier:2', 'modifier:a')
  const unavailable = tier('tier:3', 'modifier:a', false)
  const family = { tiers: [first, second, unavailable] }
  const partial = toggleTierSelection(new Set(), first, true)
  assert.deepEqual(familySelectionState(partial, family), { checked: false, indeterminate: true, selectedCount: 1, selectableCount: 2 })
  const all = toggleFamilySelection(partial, family, true)
  assert.deepEqual(familySelectionState(all, family), { checked: true, indeterminate: false, selectedCount: 2, selectableCount: 2 })
  assert.equal(all.has(tierSelectionKey(unavailable)), false)
  assert.equal(toggleFamilySelection(all, family, false).size, 0)
})
})()

// === Merged from taintedCrafting.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const readFile = _m9_readFile
  const path = _m9_path
  const applyManualBenchCraft = _m9_applyManualBenchCraft
  const applyManualCurrency = _m9_applyManualCurrency
  const createManualSession = _m9_createManualSession
  const inspectManualCurrencies = _m9_inspectManualCurrencies
  const listManualBenchCrafts = _m9_listManualBenchCrafts
  const redoManualAction = _m9_redoManualAction
  const resetManualSession = _m9_resetManualSession
  const undoManualAction = _m9_undoManualAction
  const normalizeCraftingDataset = _m9_normalizeCraftingDataset
const dataset = normalizeCraftingDataset(JSON.parse(await readFile(path.resolve('electron/assets/crafting-data/dataset.json'), 'utf8')))
const body = dataset.bases.find((base) => base.itemClass === 'BodyArmour' && base.socketLimit === 6 && base.requiredLevel <= 1)
assert.ok(body)

function session(seed = 71, itemLevel = 1) {
  const current = createManualSession(dataset, { baseId: body.id, itemLevel, variant: { kind: 'normal' }, seed })
  current.state.corrupted = true
  return current
}

test('腐化装备启用三种污秽孔位通货，未知概率项保留准确禁用原因', () => {
  const items = inspectManualCurrencies(dataset, session())
  for (const id of ['currency:tainted-chromatic', 'currency:tainted-jewellers']) assert.equal(items.find((entry) => entry.id === id).canApply, true)
  assert.equal(items.find((entry) => entry.id === 'currency:tainted-fusing').canApply, false)
  for (const id of ['currency:tainted-armourers-scrap', 'currency:tainted-exalted', 'currency:tainted-chaos', 'currency:tainted-divine-teardrop', 'currency:tainted-mythic']) {
    const item = items.find((entry) => entry.id === id)
    assert.equal(item.canApply, false)
    assert.match(item.unavailableReason, /暂不|无法准确/)
  }
  const uncorrupted = session(); uncorrupted.state.corrupted = false
  assert.match(inspectManualCurrencies(dataset, uncorrupted).find((entry) => entry.id === 'currency:tainted-chromatic').unavailableReason, /已腐化/)
})

test('污秽孔位动作写入成本和历史并支持撤销重做重置', () => {
  const initial = session(72, 100)
  const coloured = applyManualCurrency(dataset, initial, 'currency:tainted-chromatic')
  assert.deepEqual(coloured.event.costs, [{ resourceId: 'currency:tainted-chromatic', resourceName: '污秽幻色石', amount: 1 }])
  const socketed = applyManualCurrency(dataset, coloured.session, 'currency:tainted-jewellers')
  assert.notEqual(socketed.session.state.sockets.length, coloured.session.state.sockets.length)
  const undone = undoManualAction(dataset, socketed.session)
  assert.deepEqual(undone.session.state, coloured.session.state)
  assert.deepEqual(redoManualAction(dataset, undone.session).session.state, socketed.session.state)
  assert.deepEqual(resetManualSession(dataset, socketed.session).session.state, socketed.session.initialState)
})

test('腐化工艺台忽略物品等级设置六孔并以双成本设置六连', () => {
  let current = session(73, 1)
  const catalog = listManualBenchCrafts(dataset, current)
  const sixSockets = catalog.items.find((entry) => entry.id === 'corrupted-bench:sockets:6')
  assert.equal(sixSockets.canApply, true)
  assert.deepEqual(sixSockets.cost.map((entry) => entry.amount), [350, 350])
  const socketed = applyManualBenchCraft(dataset, current, sixSockets.id)
  assert.equal(socketed.session.state.sockets.length, 6)
  const sixLinks = socketed.benchCrafts.items.find((entry) => entry.id === 'corrupted-bench:links:6')
  assert.equal(sixLinks.canApply, true)
  assert.deepEqual(sixLinks.cost.map((entry) => entry.amount), [1500, 1500])
  const linked = applyManualBenchCraft(dataset, socketed.session, sixLinks.id)
  assert.equal(Math.max(...linked.session.state.links.map((group) => group.length)), 6)
  assert.deepEqual(linked.event.costs, sixLinks.cost)
  assert.deepEqual(undoManualAction(dataset, linked.session).session.state, socketed.session.state)
})

test('腐化定色保证配方颜色且不改变孔数和连接', () => {
  let current = applyManualBenchCraft(dataset, session(74, 1), 'corrupted-bench:sockets:6').session
  current = applyManualBenchCraft(dataset, current, 'corrupted-bench:links:6').session
  const links = structuredClone(current.state.links)
  const result = applyManualBenchCraft(dataset, current, 'corrupted-bench:colours:2b1r')
  assert.deepEqual(result.session.state.sockets.slice(0, 3).map((socket) => socket.color), ['B', 'B', 'R'])
  assert.equal(result.session.state.sockets.length, 6)
  assert.deepEqual(result.session.state.links, links)
})
})()

// === Merged from taintedRules.test.js ===
await (async () => {
  const test = _m10_test
  const assert = _m10_assert
  const TAINTED_CURRENCIES = _m10_TAINTED_CURRENCIES
  const applyTaintedFusing = _m10_applyTaintedFusing
  const applyTaintedJewellers = _m10_applyTaintedJewellers
  const largestLinkSize = _m10_largestLinkSize
  const rerollTaintedSocketColours = _m10_rerollTaintedSocketColours
  const taintedCommonReason = _m10_taintedCommonReason
  const CORRUPTED_BENCH_RECIPES = _m10_CORRUPTED_BENCH_RECIPES
  const applyCorruptedBenchRecipe = _m10_applyCorruptedBenchRecipe
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
})()

// === Merged from vaalCorruptionData.test.js ===
await (async () => {
  const test = _m11_test
  const assert = _m11_assert
  const readFileSync = _m11_readFileSync
  const fileURLToPath = _m11_fileURLToPath
  const path = _m11_path
  const normalizeCraftingDataset = _m11_normalizeCraftingDataset
const dirname = path.dirname(fileURLToPath(import.meta.url))
const dataset = normalizeCraftingDataset(JSON.parse(readFileSync(path.join(dirname, '..', 'electron', 'assets', 'crafting-data', 'dataset.json'), 'utf8')))

test('真实快照包含受支持装备的瓦尔腐化隐式且排除专属对象', () => {
  assert.ok(dataset.corruptedImplicitFamilies.length >= 180)
  assert.ok(dataset.corruptedImplicitFamilies.reduce((sum, family) => sum + family.tiers.length, 0) >= 200)
  const classes = new Set(dataset.corruptedImplicitFamilies.flatMap((family) => family.itemClasses))
  for (const itemClass of ['Ring', 'Amulet', 'Belt', 'Wand', 'Bow', 'Quiver', 'Helmet', 'Gloves', 'Boots', 'BodyArmour', 'Shield']) assert.ok(classes.has(itemClass), `缺少 ${itemClass}`)
  for (const unsupported of ['Jewel', 'AbyssJewel', 'Map', 'FishingRod']) assert.equal(classes.has(unsupported), false)
})

test('腐化隐式阶级保存等级、文本、数值、类别权重和稳定引用', () => {
  for (const family of dataset.corruptedImplicitFamilies) {
    assert.ok(family.id && family.effectKey && family.itemClasses.length && family.tiers.length)
    for (const tier of family.tiers) {
      assert.ok(tier.id && tier.requiredLevel >= 1 && tier.text)
      assert.ok(family.itemClasses.some((itemClass) => tier.weights[itemClass] > 0))
      assert.ok(Array.isArray(tier.values) && Array.isArray(tier.displayTags))
    }
  }
})
})()

// === Merged from vaalCrafting.test.js ===
await (async () => {
  const test = _m12_test
  const assert = _m12_assert
  const readFileSync = _m12_readFileSync
  const fileURLToPath = _m12_fileURLToPath
  const path = _m12_path
  const applyManualCurrency = _m12_applyManualCurrency
  const createManualSession = _m12_createManualSession
  const createSeededRng = _m12_createSeededRng
  const inspectManualCurrencies = _m12_inspectManualCurrencies
  const redoManualAction = _m12_redoManualAction
  const resetManualSession = _m12_resetManualSession
  const undoManualAction = _m12_undoManualAction
  const normalizeCraftingDataset = _m12_normalizeCraftingDataset
  const rollVaalOutcome = _m12_rollVaalOutcome
const dirname = path.dirname(fileURLToPath(import.meta.url))
const dataset = normalizeCraftingDataset(JSON.parse(readFileSync(path.join(dirname, '..', 'electron', 'assets', 'crafting-data', 'dataset.json'), 'utf8')))
const wand = dataset.bases.find((base) => base.itemClass === 'Wand' && base.requiredLevel <= 84)
const jewel = dataset.bases.find((base) => /Jewel/.test(base.itemClass))
assert.ok(wand && jewel)

function seedFor(outcome) {
  for (let index = 1; index < 10000; index += 1) {
    const seed = Math.imul(index, 0x9e3779b1) >>> 0
    if (rollVaalOutcome(createSeededRng(seed)) === outcome) return seed
  }
  throw new Error(`找不到 ${outcome} 种子`)
}

function sessionFor(outcome) {
  return createManualSession(dataset, { baseId: wand.id, itemLevel: 84, variant: { kind: 'normal' }, seed: seedFor(outcome) })
}

test('真实法杖快照可复现四种等权瓦尔结果', () => {
  for (const outcome of ['implicit', 'white-sockets', 'rare-reforge', 'no-change']) {
    const initial = sessionFor(outcome)
    const first = applyManualCurrency(dataset, initial, 'currency:vaal')
    const repeated = applyManualCurrency(dataset, sessionFor(outcome), 'currency:vaal')
    assert.equal(first.session.state.corrupted, true)
    assert.equal(first.session.state.corruptionOutcome, outcome)
    assert.deepEqual(first.session.state, repeated.session.state)
    assert.equal(first.event.corruptionOutcome, outcome)
    if (outcome === 'implicit') assert.ok(first.session.state.vaalImplicit)
    if (outcome === 'white-sockets') assert.ok(first.session.state.sockets.some((socket) => socket.color === 'W'))
    if (outcome === 'rare-reforge') {
      assert.equal(first.session.state.rarity, 'rare')
      assert.equal(first.session.state.prefixes.length, 3)
      assert.equal(first.session.state.suffixes.length, 3)
    }
  }
})

test('瓦尔宝珠拒绝腐化、镜像和珠宝并提供具体原因', () => {
  const corrupted = sessionFor('no-change')
  corrupted.state.corrupted = true
  assert.match(inspectManualCurrencies(dataset, corrupted).find((entry) => entry.id === 'currency:vaal').unavailableReason, /已经腐化/)
  const mirrored = sessionFor('no-change')
  mirrored.state.mirrored = true
  assert.match(inspectManualCurrencies(dataset, mirrored).find((entry) => entry.id === 'currency:vaal').unavailableReason, /镜像/)
  const jewelSession = createManualSession(dataset, { baseId: jewel.id, itemLevel: Math.max(84, jewel.requiredLevel), variant: { kind: 'normal' }, seed: 1 })
  assert.match(inspectManualCurrencies(dataset, jewelSession).find((entry) => entry.id === 'currency:vaal').unavailableReason, /珠宝具有专属腐化/)
})

test('瓦尔结果参与撤销、重做、重置与预见', () => {
  const initial = sessionFor('implicit')
  initial.foreseeing = true
  const preview = inspectManualCurrencies(dataset, initial).find((entry) => entry.id === 'currency:vaal').preview
  assert.equal(initial.state.corrupted, false)
  const applied = applyManualCurrency(dataset, initial, 'currency:vaal')
  assert.deepEqual(applied.session.state, preview.state)
  const undone = undoManualAction(dataset, applied.session)
  assert.equal(undone.session.state.corrupted, false)
  const redone = redoManualAction(dataset, undone.session)
  assert.deepEqual(redone.session.state, applied.session.state)
  assert.equal(resetManualSession(dataset, redone.session).session.state.corrupted, false)
})

test('瓦尔稀有重铸保留锁定前缀并补足六条显式', () => {
  let current = sessionFor('rare-reforge')
  current = applyManualCurrency(dataset, current, 'currency:alchemy').session
  const kept = structuredClone(current.state.prefixes)
  assert.ok(kept.length)
  current.state.meta.prefixesLocked = true
  current.rngState = seedFor('rare-reforge')
  const result = applyManualCurrency(dataset, current, 'currency:vaal').session.state
  assert.deepEqual(result.prefixes.slice(0, kept.length), kept)
  assert.equal(result.prefixes.length, 3)
  assert.equal(result.suffixes.length, 3)
})
})()
