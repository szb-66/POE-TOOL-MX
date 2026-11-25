import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { normalizeAffixCondition as _m0_normalizeAffixCondition, normalizeAffixGroup as _m0_normalizeAffixGroup, normalizeModuleTwo as _m0_normalizeModuleTwo, cloneAffixGroup as _m0_cloneAffixGroup, affixGroupItemLevelRequirement as _m0_affixGroupItemLevelRequirement, hasEffectiveAffixGroups as _m0_hasEffectiveAffixGroups } from '../src/domains/items/affixConfig.js'
import { matchAffixes as _m0_matchAffixes } from '../electron/modules/item/matcher.js'
import { createPresetSectionData as _m0_createPresetSectionData, planPresetImport as _m0_planPresetImport } from '../src/domains/settings/configTransfer/presets.js'
import { createConfigBundle as _m0_createConfigBundle, serializeConfigBundle as _m0_serializeConfigBundle, parseConfigBundle as _m0_parseConfigBundle } from '../src/domains/settings/configTransfer/core.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { affixTierItemLevelLabel as _m1_affixTierItemLevelLabel, normalizeAffixCondition as _m1_normalizeAffixCondition, affixConditionItemLevelRequirement as _m1_affixConditionItemLevelRequirement } from '../src/domains/items/affixConfig.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { inferBaseDefencePercentile as _m2_inferBaseDefencePercentile, isBaseDefenceEntry as _m2_isBaseDefenceEntry, rerollBaseDefences as _m2_rerollBaseDefences, rollBaseEntriesWithDefencePercentile as _m2_rollBaseEntriesWithDefencePercentile } from '../electron/modules/crafting/equipmentPropertyRules.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { readFileSync as _m3_readFileSync } from 'node:fs'
import { createBatchRecoveryStore as _m3_createBatchRecoveryStore, normalizeBatchRecoveryCheckpoint as _m3_normalizeBatchRecoveryCheckpoint } from '../electron/modules/crafting/batchRecovery.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { BEAST_REGEX_OPTIONS as _m4_BEAST_REGEX_OPTIONS, cleanBeastRegexConfig as _m4_cleanBeastRegexConfig, createDefaultBeastRegexConfig as _m4_createDefaultBeastRegexConfig, generateBeastRegex as _m4_generateBeastRegex } from '../src/domains/regex/beastRegex.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { BEAST_ASPECT_RECIPES as _m5_BEAST_ASPECT_RECIPES, BEASTCRAFT_RECIPES as _m5_BEASTCRAFT_RECIPES, BEASTCRAFT_RULESET as _m5_BEASTCRAFT_RULESET, BEAST_INFLUENCE_RECIPES as _m5_BEAST_INFLUENCE_RECIPES, beastRecipeView as _m5_beastRecipeView, createAspectAffix as _m5_createAspectAffix } from '../electron/modules/crafting/beastcraftRules.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { readFile as _m6_readFile } from 'node:fs/promises'
import _m6_path from 'node:path'
import { applyManualBeastcraft as _m6_applyManualBeastcraft, applyManualCurrency as _m6_applyManualCurrency, createManualSession as _m6_createManualSession, listManualBeastcrafts as _m6_listManualBeastcrafts, previewManualCurrency as _m6_previewManualCurrency, redoManualAction as _m6_redoManualAction, resetManualSession as _m6_resetManualSession, undoManualAction as _m6_undoManualAction } from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset as _m6_normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { readFile as _m7_readFile } from 'node:fs/promises'
import { applyManualCurrency as _m7_applyManualCurrency, applyManualFossils as _m7_applyManualFossils, createManualSession as _m7_createManualSession, listManualFossils as _m7_listManualFossils, redoManualAction as _m7_redoManualAction, resetManualSession as _m7_resetManualSession, undoManualAction as _m7_undoManualAction } from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset as _m7_normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { corruptedImplicitCandidates as _m7_corruptedImplicitCandidates } from '../electron/modules/crafting/vaalRules.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { readFile as _m8_readFile } from 'node:fs/promises'
import _m8_path from 'node:path'
import { applyManualBeastcraft as _m8_applyManualBeastcraft, applyManualCurrency as _m8_applyManualCurrency, applyManualFossils as _m8_applyManualFossils, createManualSession as _m8_createManualSession, inspectManualCurrencies as _m8_inspectManualCurrencies, previewManualCurrency as _m8_previewManualCurrency, redoManualAction as _m8_redoManualAction, resetManualSession as _m8_resetManualSession, undoManualAction as _m8_undoManualAction } from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset as _m8_normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { displayedCatalystEntry as _m8_displayedCatalystEntry } from '../electron/modules/crafting/catalystRules.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { CATALYST_DEFINITIONS as _m9_CATALYST_DEFINITIONS, NON_TAINTED_CATALYST_TYPES as _m9_NON_TAINTED_CATALYST_TYPES, applyCatalystQuality as _m9_applyCatalystQuality, catalysedValue as _m9_catalysedValue, catalystMatchesEntry as _m9_catalystMatchesEntry, displayedCatalystEntry as _m9_displayedCatalystEntry, inferCatalystDisplayTags as _m9_inferCatalystDisplayTags, rollTaintedCatalyst as _m9_rollTaintedCatalyst } from '../electron/modules/crafting/catalystRules.js'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import { mkdtemp as _m10_mkdtemp, mkdir as _m10_mkdir, readFile as _m10_readFile, writeFile as _m10_writeFile } from 'node:fs/promises'
import _m10_os from 'node:os'
import _m10_path from 'node:path'
import { CraftingDataRepository as _m10_CraftingDataRepository } from '../electron/modules/crafting/dataRepository.js'
import { modifierCanSpawn as _m10_modifierCanSpawn, validateBaseVariant as _m10_validateBaseVariant } from '../electron/modules/crafting/variantRules.js'
import _m11_test from 'node:test'
import _m11_assert from 'node:assert/strict'
import { affixTierSummary as _m11_affixTierSummary, effectLines as _m11_effectLines, formatProbability as _m11_formatProbability, rolledTextWithRanges as _m11_rolledTextWithRanges } from '../src/domains/crafting/displayFormat.js'
import _m12_test from 'node:test'
import _m12_assert from 'node:assert/strict'
import _m13_test from 'node:test'
import _m13_assert from 'node:assert/strict'
import { bucketModifierFamilies as _m13_bucketModifierFamilies, createDefaultActionRegistry as _m13_createDefaultActionRegistry, pickWeighted as _m13_pickWeighted } from '../electron/modules/crafting/actionProviders.js'
import { allTargetsSatisfied as _m13_allTargetsSatisfied, createEligibleModifierTierResolver as _m13_createEligibleModifierTierResolver, createInitialCraftState as _m13_createInitialCraftState, createTargetMatcher as _m13_createTargetMatcher, eligibleModifierTiers as _m13_eligibleModifierTiers, qualifyingCraftedOptions as _m13_qualifyingCraftedOptions, validateCraftRequest as _m13_validateCraftRequest, valuesMeetThreshold as _m13_valuesMeetThreshold } from '../electron/modules/crafting/craftState.js'
import { CRAFTING_SCHEMA_VERSION as _m13_CRAFTING_SCHEMA_VERSION, normalizeCraftingDataset as _m13_normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { advanceSimulationAccumulator as _m13_advanceSimulationAccumulator, createSeededRandom as _m13_createSeededRandom, createSimulationAccumulator as _m13_createSimulationAccumulator, generateStrategyCandidates as _m13_generateStrategyCandidates, optimizeCrafting as _m13_optimizeCrafting, simulateCandidate as _m13_simulateCandidate, simulationAccumulatorResult as _m13_simulationAccumulatorResult, weightedTargetProbability as _m13_weightedTargetProbability, wilsonInterval as _m13_wilsonInterval } from '../electron/modules/crafting/optimizer.js'
import { modifierMatchesBase as _m13_modifierMatchesBase } from '../electron/modules/crafting/variantRules.js'

// === Merged from affixConditionToggle.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const normalizeAffixCondition = _m0_normalizeAffixCondition
  const normalizeAffixGroup = _m0_normalizeAffixGroup
  const normalizeModuleTwo = _m0_normalizeModuleTwo
  const cloneAffixGroup = _m0_cloneAffixGroup
  const affixGroupItemLevelRequirement = _m0_affixGroupItemLevelRequirement
  const hasEffectiveAffixGroups = _m0_hasEffectiveAffixGroups
  const matchAffixes = _m0_matchAffixes
  const createPresetSectionData = _m0_createPresetSectionData
  const planPresetImport = _m0_planPresetImport
  const createConfigBundle = _m0_createConfigBundle
  const serializeConfigBundle = _m0_serializeConfigBundle
  const parseConfigBundle = _m0_parseConfigBundle
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
})()

// === Merged from affixTierItemLevelLabel.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const affixTierItemLevelLabel = _m1_affixTierItemLevelLabel
  const normalizeAffixCondition = _m1_normalizeAffixCondition
  const affixConditionItemLevelRequirement = _m1_affixConditionItemLevelRequirement
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
})()

// === Merged from baseDefenceRules.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const inferBaseDefencePercentile = _m2_inferBaseDefencePercentile
  const isBaseDefenceEntry = _m2_isBaseDefenceEntry
  const rerollBaseDefences = _m2_rerollBaseDefences
  const rollBaseEntriesWithDefencePercentile = _m2_rollBaseEntriesWithDefencePercentile
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
})()

// === Merged from batchCraftingRecovery.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const readFileSync = _m3_readFileSync
  const createBatchRecoveryStore = _m3_createBatchRecoveryStore
  const normalizeBatchRecoveryCheckpoint = _m3_normalizeBatchRecoveryCheckpoint
function source(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

function target(id, x) {
  return {
    id,
    categoryId: 'jewel',
    baseType: `珠宝${id}`,
    displayName: `目标${id}`,
    x,
    y: 0,
    width: 1,
    height: 1,
    footprintSource: 'catalog',
    position: { x: 9999, y: 9999 },
    secret: 'discard-me'
  }
}

function checkpoint(overrides = {}) {
  return {
    batchId: 'batch-1',
    scanId: 'scan-1',
    snapshotFingerprint: 'fingerprint-1',
    usageSessionId: 'usage-1',
    targets: [target('a', 0), target('b', 1), target('c', 2)],
    completedIds: ['a'],
    currentItemId: 'b',
    recoverable: true,
    ...overrides
  }
}

test('批量恢复检查点只保留最小身份字段并验证完成集合', () => {
  const result = normalizeBatchRecoveryCheckpoint(checkpoint(), { requireRecoverable: true })
  assert.equal(result.valid, true)
  assert.deepEqual(result.value.targets[0], {
    id: 'a', categoryId: 'jewel', baseType: '珠宝a', displayName: '目标a',
    x: 0, y: 0, width: 1, height: 1, footprintSource: 'catalog'
  })
  assert.equal(Object.hasOwn(result.value.targets[0], 'position'), false)
  assert.equal(Object.hasOwn(result.value.targets[0], 'secret'), false)
  assert.equal(normalizeBatchRecoveryCheckpoint(checkpoint({ completedIds: ['missing'] })).valid, false)
  assert.equal(normalizeBatchRecoveryCheckpoint(checkpoint({ targets: [target('a', 0), target('a', 1)] })).valid, false)
  assert.equal(normalizeBatchRecoveryCheckpoint(checkpoint({ currentItemId: 'missing' })).valid, false)
})

test('批量恢复生命周期在异常时保留并按完成事件推进', () => {
  const store = createBatchRecoveryStore()
  const begun = store.begin(checkpoint({ completedIds: ['a'], recoverable: false }), 'usage-1')
  assert.equal(begun.valid, true)
  assert.equal(store.snapshot({ requireRecoverable: true }), null)

  store.applyEvent({ event: 'crafting-batch-item-started', batchId: 'batch-1', currentItem: { id: 'b' } })
  let stopped = store.markAbnormal({ reason: '读取失败', code: 'ITEM_READ_FAILED' })
  assert.equal(stopped.recoverable, true)
  assert.equal(stopped.currentItemId, 'b')
  assert.deepEqual(stopped.completedIds, ['a'])

  store.applyEvent({ event: 'crafting-batch-item-completed', batchId: 'batch-1', currentItem: { id: 'b' } })
  store.applyEvent({ event: 'crafting-batch-item-started', batchId: 'batch-1', currentItem: { id: 'c' } })
  stopped = store.markAbnormal({ reason: '再次失败' })
  assert.deepEqual(stopped.completedIds, ['a', 'b'])
  assert.equal(stopped.currentItemId, 'c')

  store.applyEvent({ event: 'crafting-batch-completed', batchId: 'batch-1' })
  assert.equal(store.snapshot(), null)

  store.begin(checkpoint({ completedIds: ['a'], recoverable: false }), 'usage-1')
  store.markAbnormal({ reason: '等待用户处理' })
  store.clear()
  assert.equal(store.snapshot(), null)
})

test('主进程在启动前建立检查点并按脚本终态推进或清除', () => {
  const ipc = source('../electron/modules/ipc/python.js')
  const windowIpc = source('../electron/modules/ipc/window.js')

  assert.match(ipc, /batchRecoveryStore\.begin\(config\.batchRecoveryContext, config\.usageSessionId\)/)
  assert.match(ipc, /scriptEvent\?\.event\?\.startsWith\('crafting-batch-'\)[\s\S]*batchRecoveryStore\.applyEvent\(scriptEvent\)/)
  assert.match(ipc, /termination === 'abnormal'[\s\S]*batchRecoveryStore\.markAbnormal/)
  assert.match(ipc, /scriptEvent\?\.event === 'crafting-manual-stopped'[\s\S]*batchRecoveryStore\.clear\(\)/)
  assert.match(ipc, /scriptEvent\?\.event === 'crafting-completed'[\s\S]*batchRecoveryStore\.clear\(\)/)
  assert.match(windowIpc, /crafting-batch-return-to-scan[\s\S]*activateMain[\s\S]*crafting-batch-scan-requested[\s\S]*batchRecoveryStore\.clear\(\)/)
  assert.match(ipc, /const stopScript = async \(\) =>[\s\S]*mode === 'items'[\s\S]*batchRecoveryStore\.clear\(\)/)
})

test('批量恢复 IPC 仅向主窗口和当前制作浮窗开放', () => {
  const ipc = source('../electron/modules/ipc/python.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')

  assert.match(ipc, /trustedBatchRecoverySender[\s\S]*event\.sender === mainWindow\.webContents[\s\S]*event\.sender === overlayWindow\.webContents/)
  assert.match(ipc, /crafting-batch-recovery-get[\s\S]*trustedBatchRecoverySender\(event\)/)
  assert.match(ipc, /crafting-batch-recovery-clear[\s\S]*trustedBatchRecoverySender\(event\)/)
  assert.match(preload, /getBatchCraftingRecovery[\s\S]*crafting-batch-recovery-get/)
  assert.match(preload, /clearBatchCraftingRecovery[\s\S]*crafting-batch-recovery-clear/)
  assert.match(api, /getRecovery:[\s\S]*getBatchCraftingRecovery/)
  assert.match(api, /clearRecovery:[\s\S]*clearBatchCraftingRecovery/)
})
})()

// === Merged from beastRegex.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const BEAST_REGEX_OPTIONS = _m4_BEAST_REGEX_OPTIONS
  const cleanBeastRegexConfig = _m4_cleanBeastRegexConfig
  const createDefaultBeastRegexConfig = _m4_createDefaultBeastRegexConfig
  const generateBeastRegex = _m4_generateBeastRegex
test('野兽空配置与价格独立生成', () => {
  assert.equal(generateBeastRegex(createDefaultBeastRegexConfig()).regex, '')
  assert.equal(generateBeastRegex({ priceRange: { min: 10, max: 19, currencies: ['ch'] } }).regex, '"~b/o 1\\d ch"')
  for (const priceRange of [{ min: 20, max: 10, currencies: ['ch'] }, { min: 1, max: null, currencies: ['ch'] }, { min: 1, max: 10, currencies: [] }]) {
    assert.equal(generateBeastRegex({ priceRange }).regex, '')
  }
})

test('每个野兽短表达式只命中全目录中的自身', () => {
  for (const item of BEAST_REGEX_OPTIONS) {
    const regex = new RegExp(item.expression)
    assert.ok(regex.test(item.name), item.name)
    for (const other of BEAST_REGEX_OPTIONS) {
      if (item.id !== other.id) assert.equal(regex.test(other.name), false, `${item.name}: ${other.name}`)
    }
  }
})

test('野兽包括排除互斥、去重，名称和价格使用独立条件', () => {
  const [a, b, c] = BEAST_REGEX_OPTIONS
  const config = cleanBeastRegexConfig({ includeIds: [a.id, a.id, b.id, c.id, 'unknown'], excludeIds: [c.id], priceRange: { min: 1, max: 9, currencies: ['ch', 'div'] } })
  assert.deepEqual(config.includeIds, [a.id, b.id])
  const result = generateBeastRegex(config)
  assert.equal(result.includeCount, 3)
  assert.equal(result.excludeCount, 1)
  assert.ok(result.regex.includes(`"${a.expression}|${b.expression}"`))
  assert.ok(result.regex.includes(`"!${c.expression}"`))
  assert.ok(result.regex.includes('(ch|div)'))
})

test('大量名称超长时保留完整正则并提示', () => {
  const result = generateBeastRegex({ includeIds: BEAST_REGEX_OPTIONS.map(item => item.id) })
  assert.ok(result.overLimit)
  assert.equal(result.length, result.regex.length)
  assert.equal(result.includeCount, BEAST_REGEX_OPTIONS.length)
  assert.ok(result.warnings.length)
})
})()

// === Merged from beastcraftRules.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const BEAST_ASPECT_RECIPES = _m5_BEAST_ASPECT_RECIPES
  const BEASTCRAFT_RECIPES = _m5_BEASTCRAFT_RECIPES
  const BEASTCRAFT_RULESET = _m5_BEASTCRAFT_RULESET
  const BEAST_INFLUENCE_RECIPES = _m5_BEAST_INFLUENCE_RECIPES
  const beastRecipeView = _m5_beastRecipeView
  const createAspectAffix = _m5_createAspectAffix
test('3.29 野兽装备目录移除旧分裂并准确禁用魔符破裂配方', () => {
  assert.deepEqual(BEASTCRAFT_RULESET, { game: 'poe1', patch: '3.29', locale: 'zh-CN' })
  assert.equal(BEAST_INFLUENCE_RECIPES.length, 6)
  assert.equal(BEAST_ASPECT_RECIPES.length, 8)
  assert.equal(BEASTCRAFT_RECIPES.filter((entry) => entry.supported).length, 22)
  assert.equal(BEASTCRAFT_RECIPES.filter((entry) => !entry.supported).length, 5)
  assert.equal(BEASTCRAFT_RECIPES.some((entry) => ['split-two', 'split-three'].includes(entry.id)), false)
  for (const id of ['fracture-talisman-one', 'fracture-talisman-two']) {
    const recipe = BEASTCRAFT_RECIPES.find((entry) => entry.id === id)
    assert.equal(recipe.supported, false)
    assert.match(recipe.unsupportedReason, /3\.29.*魔符/)
  }
  assert.equal(new Set(BEASTCRAFT_RECIPES.map((entry) => entry.id)).size, BEASTCRAFT_RECIPES.length)
  assert.deepEqual(Object.fromEntries(BEAST_INFLUENCE_RECIPES.map((entry) => [entry.influence, entry.beast])), {
    shaper: 'Fenumal Devourer', elder: 'Saqawine Blood Viper', crusader: 'Farric Goliath',
    redeemer: 'Fenumal Queen', hunter: 'Craicic Watcher', warlord: 'Fenumal Scrabbler'
  })
  assert.ok(BEAST_INFLUENCE_RECIPES.every((entry) => entry.secondaryBeast === 'Craicic Maw'))
})

test('势技能定义覆盖猫鸟蟹蛛的 20 与 30 级且作为共享互斥后缀', () => {
  for (const label of ['猫之势', '鸟之势', '蟹之势', '蛛之势']) {
    const recipes = BEAST_ASPECT_RECIPES.filter((entry) => entry.label === label)
    assert.deepEqual(recipes.map((entry) => entry.level), [20, 30])
    for (const recipe of recipes) {
      assert.equal(recipe.effect, `获得 ${recipe.level} 级的主动技能${label}`)
      const affix = createAspectAffix(recipe)
      assert.equal(affix.affixType, 'suffix')
      assert.equal(affix.groupId, 'beast-aspect')
      assert.equal(affix.source, 'beast')
      assert.equal(affix.metaCraft, false)
    }
  }
})

test('数据不足配方始终禁用并暴露具体边界', () => {
  for (const recipe of BEASTCRAFT_RECIPES.filter((entry) => !entry.supported)) {
    const view = beastRecipeView(recipe)
    assert.equal(view.canApply, false)
    assert.ok(view.unavailableReason.length > 8)
  }
})
})()

// === Merged from beastcrafting.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const readFile = _m6_readFile
  const path = _m6_path
  const applyManualBeastcraft = _m6_applyManualBeastcraft
  const applyManualCurrency = _m6_applyManualCurrency
  const createManualSession = _m6_createManualSession
  const listManualBeastcrafts = _m6_listManualBeastcrafts
  const previewManualCurrency = _m6_previewManualCurrency
  const redoManualAction = _m6_redoManualAction
  const resetManualSession = _m6_resetManualSession
  const undoManualAction = _m6_undoManualAction
  const normalizeCraftingDataset = _m6_normalizeCraftingDataset
const dataset = normalizeCraftingDataset(JSON.parse(await readFile(path.resolve('electron/assets/crafting-data/dataset.json'), 'utf8')))
const base = dataset.bases.find((entry) => entry.itemClass === 'Helmet' && entry.requiredLevel <= 20 && entry.allowedVariants.includes('normal'))

function session(seed = 1, variant = { kind: 'normal' }, itemLevel = 100) {
  return createManualSession(dataset, { baseId: base.id, itemLevel: Math.max(base.requiredLevel, itemLevel), variant, seed })
}

function rareSession(seed = 1) {
  return applyManualCurrency(dataset, session(seed), 'currency:alchemy').session
}

function affixes(state) { return [...state.prefixes, ...state.suffixes] }
function recipe(current, id, beastLevel = 83) { return listManualBeastcrafts(dataset, current, { beastLevel }).items.find((entry) => entry.id === id) }

test('野兽目录按当前状态计算 27 条配方的可执行性', () => {
  const catalog = listManualBeastcrafts(dataset, session(10))
  assert.equal(catalog.total, 27)
  assert.equal(catalog.ruleset.patch, '3.29')
  assert.equal(catalog.items.filter((entry) => !entry.supported).length, 5)
  assert.equal(catalog.items.some((entry) => ['split-two', 'split-three'].includes(entry.id)), false)
  assert.match(recipe(session(10), 'fracture-talisman-one').unavailableReason, /3\.29.*魔符/)
  assert.match(recipe(session(10), 'add-prefix-remove-suffix').unavailableReason, /稀有/)
  assert.match(recipe(session(10), 'add-shaper-mod').unavailableReason, /塑界者/)
})

test('加前删后使用兽级词缀池，后缀锁存在时只添加不删除', () => {
  const current = rareSession(20)
  current.state.prefixes = []
  current.state.suffixes = current.state.suffixes.slice(0, 1)
  current.state.meta.suffixesLocked = true
  const suffixBefore = structuredClone(current.state.suffixes)
  const result = applyManualBeastcraft(dataset, current, 'add-prefix-remove-suffix', { beastLevel: 100 })
  assert.equal(result.event.poolItemLevel, 100)
  assert.deepEqual(result.session.state.suffixes, suffixBefore)
  assert.equal(result.session.state.prefixes.length, 1)
  assert.equal(result.event.removedModifier, null)
})

test('无法骰出攻击限制新增池但不会保护已有攻击词缀免于删除', () => {
  const current = rareSession(25)
  const sample = affixes(current.state)[0]
  current.state.prefixes = []
  current.state.suffixes = [
    { ...structuredClone(sample), modifierId: 'test-attack', goalId: 'test-attack', tierId: 'test-attack-tier', groupId: 'test-attack-group', affixType: 'suffix', displayTags: [{ id: 'attack', label: '攻击' }] },
    { ...structuredClone(sample), modifierId: 'bench-meta:cannot-roll-attack', goalId: 'bench-meta:cannot-roll-attack', tierId: 'bench:cannot-roll-attack', groupId: 'bench-meta:cannot-roll-attack', affixType: 'suffix', source: 'crafted', metaCraft: true }
  ]
  current.state.meta.cannotRollAttack = true
  let result
  for (let rngState = 1; rngState < 100; rngState += 1) {
    current.rngState = rngState
    const candidate = applyManualBeastcraft(dataset, current, 'add-prefix-remove-suffix', { beastLevel: 100 })
    if (candidate.event.removedModifier?.modifierId === 'test-attack') { result = candidate; break }
  }
  assert.ok(result, '已有攻击词缀应进入随机删除池')
  const addedDefinition = dataset.modifiers.find((entry) => entry.id === result.event.addedModifier.modifierId)
  assert.equal(addedDefinition.tags.includes('attack') || addedDefinition.tags.includes('攻击'), false)
})

test('六势力配方只添加对应势力词缀', () => {
  const influencedBase = dataset.bases.find((entry) => entry.itemClass === 'Helmet' && entry.allowedVariants.includes('influenced'))
  const current = createManualSession(dataset, { baseId: influencedBase.id, itemLevel: 100, variant: { kind: 'influenced', influences: ['shaper'] }, seed: 30 })
  const result = applyManualBeastcraft(dataset, current, 'add-shaper-mod')
  assert.equal(affixes(result.session.state).length, 1)
  assert.equal(result.session.state.rarity, 'magic')
  assert.equal(affixes(result.session.state)[0].source, 'shaper')
  assert.match(recipe(result.session, 'add-elder-mod').unavailableReason, /裂界者/)
})

test('随机元工艺和八种势技能使用正常词缀位规则', () => {
  const meta = applyManualBeastcraft(dataset, session(40), 'add-random-meta')
  assert.equal(affixes(meta.session.state).length, 1)
  assert.equal(affixes(meta.session.state)[0].metaCraft, true)
  assert.ok(['prefixesLocked', 'suffixesLocked', 'cannotRollAttack', 'cannotRollCaster', 'multimod'].some((flag) => meta.session.state.meta[flag]))

  const aspect = applyManualBeastcraft(dataset, session(41), 'aspect-spider-30')
  assert.equal(aspect.session.state.rarity, 'magic')
  assert.equal(aspect.session.state.suffixes[0].source, 'beast')
  assert.equal(aspect.session.state.suffixes[0].rolledText, '获得 30 级的主动技能蛛之势')
  assert.match(recipe(aspect.session, 'aspect-cat-20').unavailableReason, /已经拥有势技能/)
})

test('3.29 旧二分三分不可调用且魔符破裂保持安全禁用', () => {
  const current = rareSession(50)
  assert.throws(() => applyManualBeastcraft(dataset, current, 'split-two'), /未知野兽工艺/)
  assert.throws(() => applyManualBeastcraft(dataset, current, 'split-three'), /未知野兽工艺/)
  assert.throws(() => applyManualBeastcraft(dataset, current, 'fracture-talisman-one'), /3\.29.*魔符/)
})

test('拓印绑定原物品并可一次性恢复魔法状态', () => {
  const magic = applyManualCurrency(dataset, session(70), 'currency:transmutation').session
  const imprinted = applyManualBeastcraft(dataset, magic, 'create-imprint').session
  const snapshot = structuredClone(imprinted.state)
  const changed = applyManualCurrency(dataset, imprinted, 'currency:alteration').session
  const restored = applyManualBeastcraft(dataset, changed, 'restore-imprint')
  assert.deepEqual(restored.session.state, snapshot)
  assert.equal(restored.session.imprint, null)
  assert.match(recipe(restored.session, 'restore-imprint').unavailableReason, /没有可用拓印/)
})

test('希内科拉预览不改状态且实际通货结果完全一致', () => {
  const magic = applyManualCurrency(dataset, session(80), 'currency:transmutation').session
  const locked = applyManualBeastcraft(dataset, magic, 'apply-hinekora-lock').session
  const before = structuredClone(locked)
  const preview = previewManualCurrency(dataset, locked, 'currency:alteration')
  assert.deepEqual(locked, before)
  const repeated = previewManualCurrency(dataset, locked, 'currency:alteration')
  assert.deepEqual(repeated, preview)
  const applied = applyManualCurrency(dataset, locked, 'currency:alteration')
  assert.deepEqual(applied.session.state, preview.state)
  assert.equal(applied.session.foreseeing, false)
})

test('非通货野兽动作会消费预见且撤销可恢复预见状态', () => {
  const magic = applyManualCurrency(dataset, session(85), 'currency:transmutation').session
  magic.state.suffixes = []
  magic.state.rarity = 'magic'
  const locked = applyManualBeastcraft(dataset, magic, 'apply-hinekora-lock').session
  const changed = applyManualBeastcraft(dataset, locked, 'aspect-cat-20')
  assert.equal(changed.session.foreseeing, false)
  assert.equal(changed.event.foreseeingConsumed, true)
  const undone = undoManualAction(dataset, changed.session)
  assert.equal(undone.session.foreseeing, true)
})

test('拓印与预见辅助状态参与撤销重做和重置', () => {
  let current = applyManualCurrency(dataset, session(90), 'currency:transmutation').session
  current = applyManualBeastcraft(dataset, current, 'apply-hinekora-lock').session
  const changed = applyManualCurrency(dataset, current, 'currency:alteration')
  const undone = undoManualAction(dataset, changed.session)
  assert.equal(undone.session.foreseeing, true)
  const redone = redoManualAction(dataset, undone.session)
  assert.equal(redone.session.foreseeing, false)
  const reset = resetManualSession(dataset, redone.session)
  assert.equal(reset.session.pendingSplitResults.length, 0)
  assert.equal(reset.session.imprint, null)
  assert.equal(reset.session.foreseeing, false)
})
})()

// === Merged from bloodstainedFossil.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const readFile = _m7_readFile
  const applyManualCurrency = _m7_applyManualCurrency
  const applyManualFossils = _m7_applyManualFossils
  const createManualSession = _m7_createManualSession
  const listManualFossils = _m7_listManualFossils
  const redoManualAction = _m7_redoManualAction
  const resetManualSession = _m7_resetManualSession
  const undoManualAction = _m7_undoManualAction
  const normalizeCraftingDataset = _m7_normalizeCraftingDataset
  const corruptedImplicitCandidates = _m7_corruptedImplicitCandidates
const dataset = normalizeCraftingDataset(JSON.parse(await readFile('electron/assets/crafting-data/dataset.json', 'utf8')))
const wand = dataset.bases.find((base) => base.itemClass === 'Wand' && base.implicitModifiers.length > 0 && corruptedImplicitCandidates(dataset, base, 84).length > 0)
const jewel = dataset.bases.find((base) => /Jewel/.test(base.itemClass) && !corruptedImplicitCandidates(dataset, base, 84).length)
assert.ok(wand && jewel)

function rareSession(seed = 731) {
  const initial = createManualSession(dataset, { baseId: wand.id, itemLevel: 84, variant: { kind: 'normal' }, seed })
  return applyManualCurrency(dataset, initial, 'currency:alchemy').session
}

test('真实 3.29 快照启用溅血化石并公开候选与永久腐化后果', () => {
  const rare = rareSession()
  const bloodstained = listManualFossils(dataset, rare).items.find((entry) => entry.id === 'bloodstained')
  assert.equal(bloodstained.supported, true)
  assert.equal(bloodstained.selectable, true)
  assert.equal(bloodstained.canApply, true)
  assert.equal(bloodstained.candidateCount, corruptedImplicitCandidates(dataset, wand, 84).length)
  assert.match(bloodstained.consequences, /重铸显式词缀.*腐化固定词缀.*永久腐化/)
})

test('溅血化石先重铸显式再替换底材隐式并支持确定性历史', () => {
  const before = rareSession(912)
  const first = applyManualFossils(dataset, before, { sockets: 1, fossilIds: ['bloodstained'] })
  const repeated = applyManualFossils(dataset, rareSession(912), { sockets: 1, fossilIds: ['bloodstained'] })
  assert.deepEqual(first.session.state, repeated.session.state)
  assert.deepEqual(first.event.corruptedImplicit, repeated.event.corruptedImplicit)
  assert.equal(first.session.state.corrupted, true)
  assert.equal(first.session.state.corruptionOutcome, 'implicit')
  assert.ok(first.session.state.vaalImplicit)
  assert.equal(first.session.state.baseImplicits.length, 0)
  assert.equal(first.event.corruptionReplacedImplicit.source, 'base')
  assert.equal(first.event.corrupted, true)
  assert.deepEqual(first.event.costs.map((entry) => entry.resourceId), ['resonator:primitive', 'fossil:bloodstained'])

  const undone = undoManualAction(dataset, first.session)
  assert.deepEqual(undone.session.state, before.state)
  assert.deepEqual(redoManualAction(dataset, undone.session).session.state, first.session.state)
  assert.equal(resetManualSession(dataset, first.session).session.state.corrupted, false)
})

test('溅血与镶金组合只替换一个隐式并保留未命中项', () => {
  const result = applyManualFossils(dataset, rareSession(1307), { sockets: 2, fossilIds: ['bloodstained', 'gilded'] })
  const replacedSource = result.event.corruptionReplacedImplicit.source
  assert.ok(['base', 'gilded'].includes(replacedSource))
  assert.equal(result.session.state.vaalImplicit.familyId, result.event.corruptedImplicit.familyId)
  if (replacedSource === 'base') {
    assert.equal(result.session.state.baseImplicits.length, 0)
    assert.ok(result.session.state.implicits.includes('物品会被商贩高价购买'))
  } else {
    assert.equal(result.session.state.baseImplicits.length, 1)
    assert.equal(result.session.state.implicits.includes('物品会被商贩高价购买'), false)
  }
})

test('其他化石只改变显式池，不会过滤腐化固定词缀', () => {
  const elemental = corruptedImplicitCandidates(dataset, wand, 84)
    .find(({ tier }) => tier.displayTags.some((tag) => tag.id === 'elemental'))
  assert.ok(elemental, '当前瓦尔隐式池应包含元素标签候选')
  const focusedDataset = {
    ...dataset,
    corruptedImplicitFamilies: [{ ...structuredClone(elemental.family), tiers: [structuredClone(elemental.tier)] }]
  }
  let session = createManualSession(focusedDataset, { baseId: wand.id, itemLevel: 84, variant: { kind: 'normal' }, seed: 2 })
  session = applyManualCurrency(focusedDataset, session, 'currency:alchemy').session
  const result = applyManualFossils(focusedDataset, session, { sockets: 2, fossilIds: ['bloodstained', 'corroded'] })
  const explicitModifiers = [...result.session.state.prefixes, ...result.session.state.suffixes]
    .map((affix) => focusedDataset.modifiers.find((modifier) => modifier.id === affix.modifierId))
  assert.equal(explicitModifiers.some((modifier) => modifier?.tags.includes('elemental')), false)
  assert.ok(result.session.state.vaalImplicit.displayTags.some((tag) => tag.id === 'elemental'))
})

test('内置数据目录保存可执行溅血化石定义', () => {
  const craft = dataset.crafts.find((entry) => entry.id === 'craft:fossil:bloodstained')
  assert.equal(craft.params.supported, true)
  assert.equal(craft.params.special, 'bloodstained')
  assert.match(craft.params.description, /腐化固定词缀/)
})

test('溅血化石和共振器拒绝无腐化候选、镜像及已腐化状态', () => {
  const missingPoolDataset = { ...dataset, corruptedImplicitFamilies: [] }
  let missingPool = createManualSession(missingPoolDataset, { baseId: wand.id, itemLevel: 84, variant: { kind: 'normal' }, seed: 1 })
  missingPool = applyManualCurrency(missingPoolDataset, missingPool, 'currency:alchemy').session
  const missingBloodstained = listManualFossils(missingPoolDataset, missingPool).items.find((entry) => entry.id === 'bloodstained')
  assert.equal(missingBloodstained.selectable, false)
  assert.match(missingBloodstained.unavailableReason, /没有已验证的腐化固定词缀候选/)

  const jewelSession = createManualSession(dataset, { baseId: jewel.id, itemLevel: 84, variant: { kind: 'normal' }, seed: 1 })
  assert.match(listManualFossils(dataset, jewelSession).items.find((entry) => entry.id === 'bloodstained').unavailableReason, /不能用于该底材类别/)

  const mirrored = rareSession(2)
  mirrored.state.mirrored = true
  assert.match(listManualFossils(dataset, mirrored).items.find((entry) => entry.id === 'bloodstained').unavailableReason, /镜像/)
  assert.throws(() => applyManualFossils(dataset, mirrored, { sockets: 1, fossilIds: ['bloodstained'] }), /镜像/)

  const corrupted = rareSession(3)
  corrupted.state.corrupted = true
  assert.throws(() => applyManualFossils(dataset, corrupted, { sockets: 1, fossilIds: ['bloodstained'] }), /已腐化/)
})
})()

// === Merged from catalystCrafting.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const readFile = _m8_readFile
  const path = _m8_path
  const applyManualBeastcraft = _m8_applyManualBeastcraft
  const applyManualCurrency = _m8_applyManualCurrency
  const applyManualFossils = _m8_applyManualFossils
  const createManualSession = _m8_createManualSession
  const inspectManualCurrencies = _m8_inspectManualCurrencies
  const previewManualCurrency = _m8_previewManualCurrency
  const redoManualAction = _m8_redoManualAction
  const resetManualSession = _m8_resetManualSession
  const undoManualAction = _m8_undoManualAction
  const normalizeCraftingDataset = _m8_normalizeCraftingDataset
  const displayedCatalystEntry = _m8_displayedCatalystEntry
const dataset = normalizeCraftingDataset(JSON.parse(await readFile(path.resolve('electron/assets/crafting-data/dataset.json'), 'utf8')))
const coralRing = dataset.bases.find((base) => base.name === '珊瑚戒指')
assert.ok(coralRing, '真实快照缺少珊瑚戒指')

function session(seed = 1) {
  return createManualSession(dataset, { baseId: coralRing.id, itemLevel: 100, variant: { kind: 'normal' }, seed })
}

function currency(current, id) {
  return inspectManualCurrencies(dataset, current).find((item) => item.id === id)
}

test('十三种催化剂进入目录并执行同类型累加与类型替换', () => {
  let current = session(10)
  const catalysts = inspectManualCurrencies(dataset, current).filter((item) => item.id.includes('catalyst-'))
  assert.equal(catalysts.length, 13)
  const fertile = applyManualCurrency(dataset, current, 'currency:catalyst-fertile')
  assert.deepEqual(fertile.event.catalystQualityChange.before, { type: null, amount: 0 })
  assert.equal(fertile.session.state.catalystQuality.type, 'life-mana')
  current = fertile.session
  const intrinsic = applyManualCurrency(dataset, current, 'currency:catalyst-intrinsic')
  assert.equal(intrinsic.session.state.catalystQuality.type, 'attribute')
  assert.equal(intrinsic.session.state.catalystQuality.amount, 1)
})

test('真实珊瑚戒指隐式受丰沃品质增强且原值不变', () => {
  const current = session(20)
  current.state.catalystQuality = { type: 'life-mana', amount: 20 }
  const implicit = current.state.baseImplicits[0]
  assert.ok(implicit.displayTags.some((tag) => tag.id === 'life'))
  const displayed = displayedCatalystEntry(implicit, current.state.catalystQuality)
  assert.equal(displayed.displayValues[0], Math.floor(implicit.rolledValues[0] * 1.2))
  assert.deepEqual(current.state.baseImplicits[0].rolledValues, implicit.rolledValues)
})

test('常规与污秽催化剂门禁准确区分腐化、镜像和首饰类型', () => {
  const current = session(30)
  assert.match(currency(current, 'currency:catalyst-tainted').unavailableReason, /已腐化/)
  current.state.corrupted = true
  assert.match(currency(current, 'currency:catalyst-fertile').unavailableReason, /已腐化/)
  assert.equal(currency(current, 'currency:catalyst-tainted').canApply, true)
  const tainted = applyManualCurrency(dataset, current, 'currency:catalyst-tainted')
  assert.ok(tainted.session.state.catalystQuality.amount >= 1 && tainted.session.state.catalystQuality.amount <= 20)
  tainted.session.state.mirrored = true
  assert.match(currency(tainted.session, 'currency:catalyst-tainted').unavailableReason, /镜像/)
})

test('催化品质参与历史、重置与希内科拉确定性预见', () => {
  let current = session(40)
  current = applyManualCurrency(dataset, current, 'currency:transmutation').session
  current = applyManualBeastcraft(dataset, current, 'apply-hinekora-lock').session
  const preview = previewManualCurrency(dataset, current, 'currency:catalyst-fertile')
  const applied = applyManualCurrency(dataset, current, 'currency:catalyst-fertile')
  assert.deepEqual(applied.session.state, preview.state)
  assert.deepEqual(redoManualAction(dataset, undoManualAction(dataset, applied.session).session).session.state, applied.session.state)
  assert.deepEqual(resetManualSession(dataset, applied.session).session.state.catalystQuality, { type: null, amount: 0 })
})

test('催化品质在 3.29 分裂化石破裂后保留并由拓印恢复', () => {
  let fracturedSource = session(45)
  fracturedSource = applyManualCurrency(dataset, fracturedSource, 'currency:alchemy').session
  fracturedSource = applyManualCurrency(dataset, fracturedSource, 'currency:catalyst-fertile').session
  const fractured = applyManualFossils(dataset, fracturedSource, { sockets: 1, fossilIds: ['fractured'] })
  assert.equal(fractured.session.state.catalystQuality.type, 'life-mana')
  assert.equal([...fractured.session.state.prefixes, ...fractured.session.state.suffixes].filter((entry) => entry.fractured).length, 1)

  let imprinted = session(46)
  imprinted = applyManualCurrency(dataset, imprinted, 'currency:transmutation').session
  imprinted = applyManualCurrency(dataset, imprinted, 'currency:catalyst-fertile').session
  imprinted = applyManualBeastcraft(dataset, imprinted, 'create-imprint').session
  const originalQuality = structuredClone(imprinted.state.catalystQuality)
  imprinted = applyManualCurrency(dataset, imprinted, 'currency:catalyst-intrinsic').session
  assert.notDeepEqual(imprinted.state.catalystQuality, originalQuality)
  const restored = applyManualBeastcraft(dataset, imprinted, 'restore-imprint')
  assert.deepEqual(restored.session.state.catalystQuality, originalQuality)
})

test('催化品质不改变相同种子下词缀生成且制作后不会被消耗', () => {
  const plain = session(50)
  const quality = session(50)
  quality.state.catalystQuality = { type: 'life-mana', amount: 20 }
  const plainRare = applyManualCurrency(dataset, plain, 'currency:alchemy').session
  const qualityRare = applyManualCurrency(dataset, quality, 'currency:alchemy').session
  assert.deepEqual(qualityRare.state.prefixes, plainRare.state.prefixes)
  assert.deepEqual(qualityRare.state.suffixes, plainRare.state.suffixes)
  assert.deepEqual(qualityRare.state.catalystQuality, { type: 'life-mana', amount: 20 })
})
})()

// === Merged from catalystRules.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const CATALYST_DEFINITIONS = _m9_CATALYST_DEFINITIONS
  const NON_TAINTED_CATALYST_TYPES = _m9_NON_TAINTED_CATALYST_TYPES
  const applyCatalystQuality = _m9_applyCatalystQuality
  const catalysedValue = _m9_catalysedValue
  const catalystMatchesEntry = _m9_catalystMatchesEntry
  const displayedCatalystEntry = _m9_displayedCatalystEntry
  const inferCatalystDisplayTags = _m9_inferCatalystDisplayTags
  const rollTaintedCatalyst = _m9_rollTaintedCatalyst
const entry = (affixType, ids, values = [79], text = '+(70—79) 最大生命') => ({
  affixType, displayTags: ids.map((id) => ({ id, label: id })), rolledValues: values, text
})

test('3.28 催化剂定义包含十二种非污秽类型且 ID 唯一', () => {
  assert.equal(CATALYST_DEFINITIONS.length, 12)
  assert.equal(NON_TAINTED_CATALYST_TYPES.length, 12)
  assert.equal(new Set(CATALYST_DEFINITIONS.map((item) => item.id)).size, 12)
  assert.ok(CATALYST_DEFINITIONS.some((item) => item.type === 'prefix' && item.name === '左旋催化剂'))
  assert.ok(CATALYST_DEFINITIONS.some((item) => item.type === 'suffix' && item.name === '右旋催化剂'))
})

test('催化标签要求伤害复合标签并区分前后缀', () => {
  assert.equal(catalystMatchesEntry('life-mana', entry('prefix', ['life'])), true)
  assert.equal(catalystMatchesEntry('physical-chaos-damage', entry('suffix', ['chaos', 'resistance'])), false)
  assert.equal(catalystMatchesEntry('physical-chaos-damage', entry('prefix', ['chaos', 'damage'])), true)
  assert.equal(catalystMatchesEntry('elemental-damage', entry('prefix', ['elemental', 'damage'])), true)
  assert.equal(catalystMatchesEntry('prefix', entry('prefix', [])), true)
  assert.equal(catalystMatchesEntry('prefix', entry('suffix', [])), false)
})

test('催化数值按幅度和原精度向下取整且不覆盖原掷值', () => {
  assert.equal(catalysedValue(79, 20), 94)
  assert.equal(catalysedValue(-7, 20), -8)
  assert.equal(catalysedValue(1.2, 20), 1.4)
  const original = entry('prefix', ['life'], [79])
  const displayed = displayedCatalystEntry(original, { type: 'life-mana', amount: 20 })
  assert.deepEqual(original.rolledValues, [79])
  assert.deepEqual(displayed.displayValues, [94])
  assert.match(displayed.displayText, /94/)
})

test('催化展示支持 Vue 响应式代理且不修改原词缀', () => {
  const original = entry('prefix', ['life'], [79])
  const reactiveEntry = new Proxy(original, {})
  const displayed = displayedCatalystEntry(reactiveEntry, { type: 'life-mana', amount: 20 })

  assert.deepEqual(displayed.displayValues, [94])
  assert.equal(displayed.catalystMatched, true)
  assert.deepEqual(original.rolledValues, [79])
})

test('同类型累加、换类型归零重加且污秽结果可复现', () => {
  assert.deepEqual(applyCatalystQuality({ type: 'life-mana', amount: 10 }, 'life-mana', 1, () => 0), { type: 'life-mana', amount: 20 })
  assert.deepEqual(applyCatalystQuality({ type: 'life-mana', amount: 20 }, 'attribute', 100, () => 0), { type: 'attribute', amount: 1 })
  assert.deepEqual(rollTaintedCatalyst(() => 0), { type: NON_TAINTED_CATALYST_TYPES[0], amount: 1 })
  assert.deepEqual(rollTaintedCatalyst(() => 0.999999), { type: NON_TAINTED_CATALYST_TYPES.at(-1), amount: 20 })
})

test('普通底材隐式转换为结构化催化标签', () => {
  assert.deepEqual(inferCatalystDisplayTags('+(20—30) 最大生命').map((tag) => tag.id), ['life'])
  assert.deepEqual(inferCatalystDisplayTags('+(20—30)% 混沌抗性').map((tag) => tag.id), ['chaos', 'resistance'])
  assert.deepEqual(inferCatalystDisplayTags('元素伤害提高 (15—25)%').map((tag) => tag.id), ['elemental', 'damage'])
  assert.equal(inferCatalystDisplayTags('(4—6)% 额外物理伤害减免').some((tag) => tag.id === 'damage'), false)
})
})()

// === Merged from craftingDataRepository.test.js ===
await (async () => {
  const test = _m10_test
  const assert = _m10_assert
  const mkdtemp = _m10_mkdtemp
  const mkdir = _m10_mkdir
  const readFile = _m10_readFile
  const writeFile = _m10_writeFile
  const os = _m10_os
  const path = _m10_path
  const CraftingDataRepository = _m10_CraftingDataRepository
  const modifierCanSpawn = _m10_modifierCanSpawn
  const validateBaseVariant = _m10_validateBaseVariant
const builtinRoot = path.resolve('electron/assets/crafting-data')

test('内置快照可离线查询底材、分类和合法词缀', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  const status = await repository.initialize()
  assert.equal(status.patch, '3.30.0')
  assert.equal(status.league, 'Covens of Umbra')
  assert.equal(status.stale, false)
  assert.ok(status.counts.bases > 0)
  const categories = repository.listCategories()
  assert.ok(categories.length > 0)
  const claws = categories.find((category) => category.name === '单手武器')?.children.find((item) => item.itemClass === 'Claws')
  assert.equal(claws.name, '爪')
  assert.ok(claws.count > 0)
  const clawBases = repository.searchBases({ category: '单手武器', itemClass: 'Claws', pageSize: 100 })
  assert.ok(clawBases.items.some((base) => base.name === '拳钉'))
  assert.ok(clawBases.items.every((base) => base.category === '单手武器' && base.itemClass === 'Claw'))
  const bases = repository.searchBases({ query: '', pageSize: 1 })
  assert.equal(bases.items.length, 1)
  const modifiers = repository.searchModifiers({ baseId: bases.items[0].id, itemLevel: 100, variant: { kind: 'normal' } })
  assert.ok(Array.isArray(modifiers.items))
  assert.ok(status.counts.bases >= 900)
  assert.ok(status.counts.modifiers > 0)
  assert.ok(status.counts.modifierEntries >= 1900)
  assert.equal(status.sources.length, new Set(status.sources.map((source) => source.id)).size)
  assert.ok(status.sources.some((source) => source.url === 'https://www.poewiki.net/wiki/Version_history'))
  const ironHat = repository.getDataset().bases.find((base) => base.name === '粗铁盔')
  assert.deepEqual(ironHat.requirements, { level: 1, strength: 9, dexterity: 0, intelligence: 0 })
  assert.equal(ironHat.qualityType, 'armour')
  assert.equal(ironHat.socketLimit, 4)
  assert.ok(ironHat.baseStats.some((entry) => entry.label === '护甲'))
})

test('护甲属性、深渊类型和星团尺寸使用隔离的词缀候选池', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  const dataset = repository.getDataset()
  const queryIds = (name) => {
    const base = dataset.bases.find((entry) => entry.name === name)
    assert.ok(base, `缺少底材 ${name}`)
    return new Set(dataset.modifiers.filter((modifier) => modifierCanSpawn(modifier, base, 100, { kind: 'normal' })).map((entry) => entry.id))
  }
  const iron = dataset.bases.find((entry) => entry.name === '粗铁盔')
  const leather = dataset.bases.find((entry) => entry.name === '皮帽')
  assert.ok(iron.tags.includes('str_armour'))
  assert.ok(leather.tags.includes('dex_armour'))
  assert.notDeepEqual(queryIds('粗铁盔'), queryIds('皮帽'))
  assert.notDeepEqual(queryIds('凶残之凝珠宝'), queryIds('锐利之凝珠宝'))
  assert.notDeepEqual(queryIds('大型星团珠宝'), queryIds('小型星团珠宝'))
})

test('手套展示六种中文属性分类，法杖共享词缀保留等级不足记录', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  assert.equal(repository.getDataset().modifierFamilies.some((family) => family.name === '该装备附加'), false)
  assert.ok(repository.getDataset().modifierFamilies.some((family) => family.name === '附加基础火焰伤害'))
  const armour = repository.listCategories().find((entry) => entry.name === '护甲')
  const gloves = armour?.children?.find((entry) => entry.name === '手套')
  assert.deepEqual(new Set(gloves.children.map((entry) => entry.name)), new Set(['力量', '敏捷', '智慧', '力量敏捷', '力量智慧', '敏捷智慧']))

  const wand = repository.getDataset().bases.find((entry) => entry.modifierProfileId === 'Wands')
  const result = repository.searchModifiers({ baseId: wand.id, itemLevel: 80, variant: { kind: 'normal' }, affixType: 'prefix', pageSize: 100 })
  const casterDamage = result.items.find((family) => family.groupId === 'WeaponCasterDamagePrefix' && family.entries.some((entry) => entry.name.includes('法术伤害')))
  assert.equal(casterDamage.entries.length, 4)
  assert.deepEqual(new Set(casterDamage.displayTags.map((tag) => tag.label)), new Set(['伤害', '元素', '施法', '火焰', '冰霜', '闪电']))
  assert.equal(casterDamage.subitemCount, 32)
  assert.ok(casterDamage.entries.flatMap((entry) => entry.tiers).some((tier) => tier.requiredLevel === 84 && tier.available === false))
  assert.equal(casterDamage.totalWeight, casterDamage.entries.flatMap((entry) => entry.tiers).filter((tier) => tier.available).reduce((sum, tier) => sum + tier.weight, 0))
})

test('活动指针越界或损坏时回退内置快照', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-repo-'))
  await writeFile(path.join(root, 'active.json'), JSON.stringify({ directory: '..\\outside' }))
  const repository = new CraftingDataRepository({ builtinRoot, userDataRoot: root })
  const status = await repository.initialize()
  assert.equal(status.source, 'builtin')
  assert.match(status.warning, /越界/)
})

test('不受支持的 schema 快照回退到内置当前版本且不改写来源', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-schema-unsupported-'))
  const unsupportedDir = path.join(root, 'version-unsupported')
  await mkdir(unsupportedDir)
  const unsupported = JSON.parse(await readFile(path.join(builtinRoot, 'dataset.json'), 'utf8'))
  unsupported.manifest.schemaVersion = 4
  unsupported.manifest.checksum = 'test'
  await writeFile(path.join(unsupportedDir, 'dataset.json'), JSON.stringify(unsupported))
  await writeFile(path.join(root, 'active.json'), JSON.stringify({ directory: 'version-unsupported' }))
  const repository = new CraftingDataRepository({ builtinRoot, userDataRoot: root })
  const status = await repository.initialize()
  assert.equal(status.source, 'builtin')
  assert.match(status.warning, /schema 4/)
  assert.equal(JSON.parse(await readFile(path.join(unsupportedDir, 'dataset.json'), 'utf8')).manifest.schemaVersion, 4)
})

test('特殊底材状态互斥并要求必要参数', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  const base = repository.getDataset().bases.find((entry) => entry.allowedVariants.includes('fractured'))
  assert.equal(validateBaseVariant(base, { kind: 'fractured' }).valid, false)
  assert.equal(validateBaseVariant(base, { kind: 'fractured', fracturedTierId: 'tier:test' }).valid, true)
  assert.equal(validateBaseVariant(base, { kind: 'normal', influences: ['shaper'] }).valid, false)
})

test('三级词缀目录固定返回十二种来源并审计缺失覆盖', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  const base = repository.getDataset().bases.find((entry) => entry.modifierProfileId === 'Wands')
  const result = repository.searchModifierCatalog({ baseId: base.id, itemLevel: 80 })
  assert.equal(result.groups.length, 12)
  assert.deepEqual(result.groups.map((entry) => entry.label), ['基础', '塑界者', '裂界者', '圣战', '救赎者', '狩猎者', '督军', '地心探险', '穿越', '隐匿', '工艺台', '精华'])
  const baseGroup = result.groups[0]
  assert.equal(baseGroup.covered, true)
  assert.ok([...baseGroup.prefix, ...baseGroup.suffix].every((family) => family.subitemCount >= family.availableCount && family.tiers.every((tier) => 'modifierName' in tier && 'sourceDomain' in tier)))
  const essenceGroup = result.groups.find((entry) => entry.id === 'essence')
  const essenceTiers = [...essenceGroup.prefix, ...essenceGroup.suffix].flatMap((family) => family.tiers)
  assert.ok(essenceTiers.some((tier) => tier.available && tier.sourceItem?.id === 'Deafening_Essence_of_Woe'))
  assert.ok(essenceTiers.every((tier) => !/[<>]/.test(tier.name) && tier.sourceItem?.name && !/[<>]/.test(tier.sourceItem.name)))
  assert.ok(essenceTiers.every((tier) => tier.tier === tier.sourceItem.tier && tier.name.startsWith(`T${tier.sourceItem.tier} `)))
  assert.ok(result.groups.slice(1, 7).every((entry) => entry.covered), '六种势力词缀都应在法杖目录中有覆盖')
  const missing = result.groups.find((entry) => !entry.covered)
  if (missing) assert.equal(missing.coverageMessage, '当前数据快照未覆盖此来源')
})

test('召集法杖保留全部技能石词缀并以全局池计算概率', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  const base = repository.getDataset().bases.find((entry) => entry.modifierProfileId === 'Convoking_Wand')
  const catalog = repository.searchModifierCatalog({ baseId: base.id, itemLevel: 100 })
  const families = catalog.groups.flatMap((group) => [...group.prefix, ...group.suffix])
  const family = families.find((entry) => entry.name.includes('所有火焰法术主动技能石等级') && entry.sourceDomain === 'base')
  assert.ok(family)
  assert.equal(family.entries.length, 6)
  assert.ok(family.entries.some((entry) => entry.name.includes('召唤生物主动技能石等级')))
  assert.equal(family.globalTotalWeight, 100206)
  assert.equal(catalog.groups.find((entry) => entry.id === 'base').suffix[0].globalTotalWeight, 113342)
  assert.equal(family.probability, family.totalWeight / family.globalTotalWeight)
  assert.ok(family.tiers.every((tier) => tier.probability === tier.weight / family.globalTotalWeight))

  const searched = repository.searchModifierCatalog({ baseId: base.id, itemLevel: 60, query: '召唤生物主动技能石等级' })
  const searchedFamily = searched.groups.flatMap((group) => [...group.prefix, ...group.suffix])
    .find((entry) => entry.familyId === family.familyId && entry.sourceDomain === family.sourceDomain)
  assert.equal(searchedFamily.globalTotalWeight, family.globalTotalWeight, '搜索与物品等级不得改变 POEDB 页面全局分母')
  assert.equal(searchedFamily.totalWeight, family.totalWeight)
})
})()

// === Merged from craftingDisplayFormat.test.js ===
await (async () => {
  const test = _m11_test
  const assert = _m11_assert
  const affixTierSummary = _m11_affixTierSummary
  const effectLines = _m11_effectLines
  const formatProbability = _m11_formatProbability
  const rolledTextWithRanges = _m11_rolledTextWithRanges
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
})()

// === Merged from craftingElectronApi.test.js ===
await (async () => {
  const test = _m12_test
  const assert = _m12_assert
test('手动做装 IPC 会把 Vue Proxy 参数转换为可克隆的普通数据', async () => {
  const received = []
  globalThis.window = {
    electronAPI: {
      createManualCraftingSession(input) {
        received.push(input)
        return Promise.resolve({ session: null })
      },
      applyManualCraftingCurrency(session, actionId) {
        received.push(session, actionId)
        return Promise.resolve({ session: null })
      },
      searchCraftingAffixSuggestions(input) {
        received.push(input)
        return Promise.resolve({ items: [] })
      }
    }
  }

  try {
    const { electronApi } = await import(`../src/api/electron.js?ipc-proxy-regression=${Date.now()}`)
    const variant = new Proxy({ kind: 'normal', influences: [] }, {})
    const session = new Proxy({ baseId: 'base:convoking-wand', state: { prefixes: [], suffixes: [] } }, {})

    await electronApi.crafting.createManualSession({ baseId: 'base:convoking-wand', itemLevel: 86, variant })
    await electronApi.crafting.applyManualCurrency(session, 'currency:transmutation')
    await electronApi.crafting.searchAffixSuggestions({ query: '生命', limit: 50 })

    assert.doesNotThrow(() => structuredClone(received[0]))
    assert.doesNotThrow(() => structuredClone(received[1]))
    assert.doesNotThrow(() => structuredClone(received[3]))
    assert.deepEqual(received[0].variant, { kind: 'normal', influences: [] })
    assert.deepEqual(received[1], { baseId: 'base:convoking-wand', state: { prefixes: [], suffixes: [] } })
    assert.deepEqual(received[3], { query: '生命', limit: 50 })
  } finally {
    delete globalThis.window
  }
})

test('仓库取件 IPC 会把 Vue Proxy 运行配置转换为可克隆的普通数据', async () => {
  let received
  globalThis.window = {
    electronAPI: {
      updateStashPickupRuntime(runtime) {
        received = runtime
        return Promise.resolve({ success: true, data: { status: 'idle' } })
      }
    }
  }

  try {
    const { electronApi } = await import(`../src/api/electron.js?stash-pickup-ipc-proxy=${Date.now()}`)
    const fixedTiming = new Proxy({ patchVerifyMs: 550 }, {})
    const runtime = new Proxy({ enabled: true, fixedTiming }, {})

    await electronApi.stashPickup.updateRuntime(runtime)

    assert.doesNotThrow(() => structuredClone(received))
    assert.deepEqual(received, { enabled: true, fixedTiming: { patchVerifyMs: 550 } })
  } finally {
    delete globalThis.window
  }
})
})()

// === Merged from craftingEngine.test.js ===
await (async () => {
  const test = _m13_test
  const assert = _m13_assert
  const bucketModifierFamilies = _m13_bucketModifierFamilies
  const createDefaultActionRegistry = _m13_createDefaultActionRegistry
  const pickWeighted = _m13_pickWeighted
  const allTargetsSatisfied = _m13_allTargetsSatisfied
  const createEligibleModifierTierResolver = _m13_createEligibleModifierTierResolver
  const createInitialCraftState = _m13_createInitialCraftState
  const createTargetMatcher = _m13_createTargetMatcher
  const eligibleModifierTiers = _m13_eligibleModifierTiers
  const qualifyingCraftedOptions = _m13_qualifyingCraftedOptions
  const validateCraftRequest = _m13_validateCraftRequest
  const valuesMeetThreshold = _m13_valuesMeetThreshold
  const CRAFTING_SCHEMA_VERSION = _m13_CRAFTING_SCHEMA_VERSION
  const normalizeCraftingDataset = _m13_normalizeCraftingDataset
  const advanceSimulationAccumulator = _m13_advanceSimulationAccumulator
  const createSeededRandom = _m13_createSeededRandom
  const createSimulationAccumulator = _m13_createSimulationAccumulator
  const generateStrategyCandidates = _m13_generateStrategyCandidates
  const optimizeCrafting = _m13_optimizeCrafting
  const simulateCandidate = _m13_simulateCandidate
  const simulationAccumulatorResult = _m13_simulationAccumulatorResult
  const weightedTargetProbability = _m13_weightedTargetProbability
  const wilsonInterval = _m13_wilsonInterval
  const modifierMatchesBase = _m13_modifierMatchesBase
const makeModifier = (id, groupId, name, affixType, weight, tags = [], source = 'natural') => ({
  id, sourceId: id, modifierProfileId: 'Ring', groupId, name, affixType, source, tags, spawnTags: ['ring'], influences: [],
  tiers: [{ id: `${id}:t1`, tier: 1, name: 'T1', requiredLevel: 1, weight, text: name, values: [{ min: 1, max: 1 }] }]
})

const family = (modifier) => ({ id: `family:${modifier.id}`, modifierProfileId: 'Ring', groupId: modifier.groupId, name: modifier.name, affixType: modifier.affixType, source: modifier.source, influences: modifier.influences, entries: [modifier] })

const modifierEntries = [
  makeModifier('mod:life', 'life', '生命', 'prefix', 1, ['life']),
  makeModifier('mod:mana', 'mana', '魔力', 'prefix', 9, ['mana']),
  makeModifier('mod:fire', 'fire', '火焰抗性', 'suffix', 1, ['fire']),
  makeModifier('mod:cold', 'cold', '冰霜抗性', 'suffix', 9, ['cold']),
  makeModifier('mod:crafted-life', 'crafted-life', '工艺生命', 'prefix', 0, ['life'], 'crafted')
]

const dataset = normalizeCraftingDataset({
  manifest: { schemaVersion: CRAFTING_SCHEMA_VERSION, game: 'poe1', locale: 'zh-CN', league: 'Test', patch: 'test', generatedAt: '2026-07-21T00:00:00Z', checksum: 'test', sources: [] },
  bases: [{ id: 'base:ring', sourceId: 'Ring', name: '测试戒指', category: '首饰', itemClass: '戒指', modifierProfileId: 'Ring', imageId: 'placeholder', requiredLevel: 1, requirements: { level: 1, strength: 0, dexterity: 0, intelligence: 0 }, qualityType: 'none', socketLimit: 0, baseStats: [], implicitModifiers: [], tags: ['ring'], maxAffixes: { prefix: 3, suffix: 3 }, allowedVariants: ['normal', 'fractured', 'influenced', 'synthesized', 'eldritch'] }],
  modifierFamilies: modifierEntries.map(family),
  crafts: [], images: { placeholder: 'images/placeholder.svg' }
})

const request = { baseId: 'base:ring', itemLevel: 84, variant: { kind: 'normal' }, targets: [{ goalId: 'mod:life', minTierId: 'mod:life:t1' }] }

test('逗号分隔的需求标签表示同组任一标签可满足', () => {
  const modifier = { ...dataset.modifiers[0], modifierProfileId: 'Shields_str', itemClasses: ['Shield'], requiredTags: ['str_armour,str_shield'], spawnTags: ['shield'] }
  const shield = { ...dataset.bases[0], modifierProfileId: 'Shields_str', itemClass: 'Shield', tags: ['default', 'shield', 'str_shield'] }
  assert.equal(modifierMatchesBase(modifier, shield), true)
  assert.equal(modifierMatchesBase(modifier, { ...shield, tags: ['default', 'shield'] }), false)
  const intelligenceShieldModifier = { ...modifier, modifierProfileId: 'Shields_int', requiredTags: ['int_armour,focus'] }
  const intelligenceShield = { ...shield, modifierProfileId: 'Shields_int', tags: ['default', 'shield', 'int_shield'] }
  assert.equal(modifierMatchesBase(intelligenceShieldModifier, intelligenceShield), true)
  const shaperRingModifier = { ...dataset.modifiers[0], spawnTags: ['ring_shaper'], influences: ['shaper'] }
  assert.equal(modifierMatchesBase(shaperRingModifier, dataset.bases[0], { kind: 'influenced', influences: ['shaper'] }), true)
  assert.equal(modifierMatchesBase(shaperRingModifier, dataset.bases[0], { kind: 'normal', influences: [] }), false)
})

test('请求校验检测 Mod Group 冲突、容量和破裂参数', () => {
  assert.equal(validateCraftRequest(request, dataset).valid, true)
  const conflictDataset = structuredClone(dataset)
  conflictDataset.modifiers[1].groupId = 'life'
  const conflict = validateCraftRequest({ ...request, targets: [...request.targets, { goalId: 'mod:mana', minTierId: 'mod:mana:t1' }] }, conflictDataset)
  assert.equal(conflict.valid, false)
  assert.ok(conflict.errors.some((entry) => entry.code === 'mod_group_conflict'))
  const fractured = validateCraftRequest({ ...request, variant: { kind: 'fractured' } }, dataset)
  assert.ok(fractured.errors.some((entry) => entry.code === 'fracture_required'))
})

test('核心通货与元工艺保护破裂词缀并遵守稀有度', () => {
  const registry = createDefaultActionRegistry()
  const fracturedRequest = { ...request, variant: { kind: 'fractured', fracturedTierId: 'mod:life:t1' } }
  const state = createInitialCraftState(fracturedRequest, dataset)
  registry.apply('bench:lock-prefixes', { state, dataset, base: dataset.bases[0], request: fracturedRequest, rng: () => 0 })
  registry.apply('currency:chaos', { state, dataset, base: dataset.bases[0], request: fracturedRequest, rng: createSeededRandom(7) })
  assert.ok(state.prefixes.some((entry) => entry.fractured && entry.modifierId === 'mod:life'))
  assert.equal(state.meta.prefixesLocked, false)
  registry.apply('currency:annulment', { state, dataset, base: dataset.bases[0], request: fracturedRequest, rng: () => 0 })
  assert.ok(state.prefixes.some((entry) => entry.fractured))
})

test('加权概率、随机数与置信区间可复现', () => {
  const entries = [{ weight: 1, id: 'a' }, { weight: 9, id: 'b' }]
  assert.equal(weightedTargetProbability(entries, (entry) => entry.id === 'a'), 0.1)
  const first = createSeededRandom(42)
  const second = createSeededRandom(42)
  assert.deepEqual([first(), first(), first()], [second(), second(), second()])
  assert.equal(pickWeighted(entries, () => 0).id, 'a')
  const buckets = bucketModifierFamilies([
    { modifier: { familyId: 'family:caster' }, weight: 1500 },
    { modifier: { familyId: 'family:caster' }, weight: 12 },
    { modifier: { familyId: 'family:mana' }, weight: 1000 }
  ])
  assert.deepEqual(buckets.map(({ id, weight }) => ({ id, weight })), [{ id: 'family:caster', weight: 1512 }, { id: 'family:mana', weight: 1000 }])
  const interval = wilsonInterval(100, 1000)
  assert.ok(interval.low < 0.1 && interval.high > 0.1)
})

test('工艺选项按全部数值分量的最低值满足目标', () => {
  const required = { values: [{ min: 40, max: 50 }, { min: 20, max: 30 }] }
  assert.equal(valuesMeetThreshold([{ min: 40, max: 41 }, { min: 20, max: 21 }], required.values), true)
  assert.equal(valuesMeetThreshold([{ min: 39, max: 60 }, { min: 20, max: 21 }], required.values), false)
  assert.equal(valuesMeetThreshold([{ min: 40, max: 60 }, { min: 19, max: 40 }], required.values), false)
  const goal = { craftedOptions: [
    { id: 'ok', requiredLevel: 1, values: [{ min: 40, max: 45 }, { min: 20, max: 25 }], itemClasses: [] },
    { id: 'high-roll-only', requiredLevel: 1, values: [{ min: 39, max: 60 }, { min: 20, max: 25 }], itemClasses: [] }
  ] }
  assert.deepEqual(qualifyingCraftedOptions(goal, required, null, 84).map((entry) => entry.id), ['ok'])
})

test('统一目标自动生成使用真实成本的工艺台收尾方案', () => {
  const benchDataset = structuredClone(dataset)
  benchDataset.modifiers.push(
    makeModifier('mod:extra-prefix', 'extra-prefix', '额外前缀', 'prefix', 10, ['damage']),
    makeModifier('mod:extra-suffix', 'extra-suffix', '额外后缀', 'suffix', 10, ['resistance'])
  )
  const goal = benchDataset.modifiers.find((entry) => entry.id === 'mod:life')
  goal.craftedOptions = [{ id: 'crafted:life', optionId: 'crafted:life', craftId: 'craft:life', tier: 1, name: '工艺', requiredLevel: 1, weight: 0, text: '+10 最大生命', values: [{ min: 10, max: 10 }], displayTags: [{ id: 'life', label: '生命' }], itemClasses: [], cost: [{ resourceId: 'currency:alchemy', resourceName: '点金石', amount: 2 }], unlock: '' }]
  const result = generateStrategyCandidates(request, benchDataset)
  const bench = result.candidates.find((candidate) => candidate.id === 'bench-finish')
  assert.ok(bench)
  assert.deepEqual(bench.initialCosts, [{ resourceId: 'currency:alchemy', resourceName: '点金石', amount: 1 }])
  assert.deepEqual(bench.retryCosts, [
    { resourceId: 'currency:scouring', resourceName: '重铸石', amount: 1 },
    { resourceId: 'currency:alchemy', resourceName: '点金石', amount: 1 }
  ])
  assert.deepEqual(bench.successCosts, [{ resourceId: 'currency:alchemy', resourceName: '点金石', amount: 2 }])
  const simulated = simulateCandidate(bench, result.validation.request, benchDataset, { 'currency:alchemy': 0.2, 'currency:scouring': 0.5 }, { samples: 2000, seed: 12 })
  assert.ok(simulated.successes > 0)
  assert.equal(simulated.resources.find((entry) => entry.resourceId === 'currency:alchemy').amount >= 2, true)
})

test('元工艺占用正确词缀位且多大师最多允许三条工艺词缀', () => {
  const registry = createDefaultActionRegistry()
  const state = createInitialCraftState(request, dataset)
  state.rarity = 'rare'
  const context = { state, dataset, base: dataset.bases[0], request, rng: () => 0 }
  registry.apply('bench:multimod', context)
  assert.equal(state.suffixes.length, 1)
  assert.equal(state.suffixes[0].metaCraft, true)
  const option = { id: 'crafted:test', optionId: 'crafted:test' }
  registry.apply('bench:add-crafted', { ...context, modifier: { goalId: 'goal:a', id: 'a', groupId: 'a', affixType: 'prefix' }, option })
  registry.apply('bench:add-crafted', { ...context, modifier: { goalId: 'goal:b', id: 'b', groupId: 'b', affixType: 'prefix' }, option })
  assert.throws(() => registry.apply('bench:add-crafted', { ...context, modifier: { goalId: 'goal:c', id: 'c', groupId: 'c', affixType: 'suffix' }, option }), /不适用/)
  const lockState = createInitialCraftState(request, dataset)
  lockState.rarity = 'rare'
  registry.apply('bench:lock-suffixes', { ...context, state: lockState })
  assert.equal(lockState.prefixes[0].metaCraft, true)
  assert.equal(lockState.meta.suffixesLocked, true)
})

test('缓存词缀池和目标查询保持原有筛选语义', () => {
  const base = dataset.bases[0]
  const variant = { kind: 'normal', influences: [], implicits: [] }
  const resolvePool = createEligibleModifierTierResolver(dataset, base, 84, variant)
  const state = createInitialCraftState(request, dataset)
  const options = [
    { source: 'natural' },
    { source: 'natural', affixType: 'prefix' },
    { source: 'natural', affixType: 'suffix', tag: 'fire' }
  ]
  for (const poolOptions of options) {
    assert.deepEqual(
      resolvePool(state, poolOptions),
      eligibleModifierTiers(dataset, base, 84, variant, state, poolOptions)
    )
  }
  state.prefixes.push({ goalId: 'mod:life', modifierId: 'mod:life', optionId: null, tierId: 'mod:life:t1', groupId: 'life', source: 'natural', fractured: false })
  assert.deepEqual(resolvePool(state), eligibleModifierTiers(dataset, base, 84, variant, state))
  assert.equal(createTargetMatcher(request, dataset)(state), allTargetsSatisfied(request, state, dataset))
})

test('模拟累加器续算时只追加样本且结果等同一次性模拟', () => {
  const prices = { 'currency:transmutation': 0.1, 'currency:alteration': 0.2 }
  const candidate = generateStrategyCandidates(request, dataset).candidates.find((entry) => entry.id === 'alteration-spam')
  let calls = 0
  const counted = { ...candidate, run: (rng) => { calls += 1; return candidate.run(rng) } }
  const accumulator = createSimulationAccumulator(counted, request, dataset, { seed: 123 })
  advanceSimulationAccumulator(accumulator, 100)
  assert.equal(calls, 100)
  advanceSimulationAccumulator(accumulator, 500)
  assert.equal(calls, 500)
  assert.deepEqual(
    simulationAccumulatorResult(accumulator, prices),
    simulateCandidate(candidate, request, dataset, prices, { samples: 500, seed: 123 })
  )
})

test('优化器发布快速和精算结果并按期望成本排序', async () => {
  const startedAt = performance.now()
  const phases = []
  const prices = {
    'currency:transmutation': 0.1, 'currency:alteration': 0.2, 'currency:chaos': 1,
    'currency:alchemy': 0.2, 'currency:scouring': 0.5, 'currency:exalted': 10,
    'currency:divine': 150
  }
  const result = await optimizeCrafting(request, dataset, prices, {
    quickSamples: 1000, refineMinimum: 2000, refineMaximum: 2000, seed: 123,
    onResult: (value) => phases.push(value.phase)
  })
  assert.deepEqual(phases, ['quick', 'refined'])
  assert.equal(result.valid, true)
  assert.ok(result.plans.length > 0)
  assert.equal(result.plans[0].rank, 1)
  assert.equal(result.plans[0].scopeNotice, '在当前支持的工艺与策略中最优')
  assert.ok(result.plans.every((plan, index, list) => index === 0 || list[index - 1].expectedChaos <= plan.expectedChaos))
  assert.ok(result.plans.every((plan) => plan.strategyGraph?.edges.some((edge) => edge.outcome === 'retry')))
  assert.deepEqual(result.plans.map(({ candidateId, samples, successes, successProbability, expectedChaos }) => ({ candidateId, samples, successes, successProbability, expectedChaos })), [
    { candidateId: 'chaos-spam', samples: 2000, successes: 2000, successProbability: 1, expectedChaos: 0.2 },
    { candidateId: 'alchemy-scour', samples: 2000, successes: 2000, successProbability: 1, expectedChaos: 0.2 },
    { candidateId: 'alteration-spam', samples: 2000, successes: 151, successProbability: 0.0755, expectedChaos: 2.5490066225165564 }
  ])
  assert.ok(performance.now() - startedAt < 5000)
})

test('普通、势力、破裂、追忆/异能与珠宝请求生成受支持的黄金候选', () => {
  const variants = [
    { kind: 'normal' },
    { kind: 'fractured', fracturedTierId: 'mod:life:t1' },
    { kind: 'synthesized', implicits: ['implicit:test'] },
    { kind: 'eldritch', implicits: ['implicit:test'] }
  ]
  for (const variant of variants) {
    const generated = generateStrategyCandidates({ ...request, variant }, dataset)
    assert.equal(generated.validation.valid, true, variant.kind)
    assert.ok(generated.candidates.some((entry) => entry.id === 'chaos-spam'))
  }

  const influencedDataset = structuredClone(dataset)
  influencedDataset.modifiers[0].influences = ['shaper']
  const influenced = generateStrategyCandidates({ ...request, variant: { kind: 'influenced', influences: ['shaper'] } }, influencedDataset)
  assert.equal(influenced.validation.valid, true)
  assert.equal(influenced.candidates.some((entry) => entry.id === 'harvest-reforge-influence'), false)

  const jewelDataset = structuredClone(dataset)
  jewelDataset.bases[0].itemClass = 'Jewel'
  jewelDataset.bases[0].tags = ['default', 'jewel', 'expansion_jewel_large']
  jewelDataset.bases[0].maxAffixes = { prefix: 2, suffix: 2 }
  jewelDataset.modifiers.forEach((modifier) => {
    modifier.spawnTags = ['jewel']
    modifier.itemClasses = ['Jewel']
    modifier.requiredTags = []
  })
  const jewel = generateStrategyCandidates(request, jewelDataset)
  assert.equal(jewel.validation.valid, true)
  assert.ok(jewel.candidates.some((entry) => entry.id === 'alteration-spam'))
})

test('花园候选只使用带精确标签和真实成本的数据', () => {
  const invalid = structuredClone(dataset)
  invalid.crafts = [{ id: 'white-socket', effectKind: 'reforge_tag', params: {}, cost: [{ resourceId: 'resource:white', resourceName: '神圣白晶命能', amount: 12500 }] }]
  assert.equal(generateStrategyCandidates(request, invalid).candidates.some((entry) => entry.id === 'harvest-reforge-life'), false)

  const valid = structuredClone(dataset)
  valid.crafts = [{ id: 'life-reforge', effectKind: 'reforge_tag', params: { tag: 'life' }, cost: [{ resourceId: 'resource:life', resourceName: '狂野紫晶命能', amount: 75 }] }]
  const candidate = generateStrategyCandidates(request, valid).candidates.find((entry) => entry.id === 'harvest-reforge-life')
  assert.ok(candidate)
  assert.deepEqual(candidate.attemptCosts, valid.crafts[0].cost)
})
})()
