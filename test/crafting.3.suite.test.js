import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { ELDRITCH_CURRENCY_DEFINITIONS as _m0_ELDRITCH_CURRENCY_DEFINITIONS, conflictUpgradeChance as _m0_conflictUpgradeChance, eldritchDominance as _m0_eldritchDominance, eldritchImplicitCandidates as _m0_eldritchImplicitCandidates, replaceEldritchTier as _m0_replaceEldritchTier, rolledEldritchImplicit as _m0_rolledEldritchImplicit } from '../electron/modules/crafting/eldritchRules.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFile as _m1_readFile } from 'node:fs/promises'
import _m1_path from 'node:path'
import { normalizeCraftingDataset as _m1_normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { applyManualCurrency as _m1_applyManualCurrency, applyManualEldritchCraft as _m1_applyManualEldritchCraft, createManualSession as _m1_createManualSession, listManualEldritchCrafts as _m1_listManualEldritchCrafts } from '../electron/modules/crafting/manualCrafting.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { readFile as _m2_readFile } from 'node:fs/promises'
import _m2_path from 'node:path'
import { applyManualBeastcraft as _m2_applyManualBeastcraft, applyManualCurrency as _m2_applyManualCurrency, createManualSession as _m2_createManualSession, listManualBeastcrafts as _m2_listManualBeastcrafts, inspectManualCurrencies as _m2_inspectManualCurrencies, previewManualCurrency as _m2_previewManualCurrency, redoManualAction as _m2_redoManualAction, resetManualSession as _m2_resetManualSession, undoManualAction as _m2_undoManualAction } from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset as _m2_normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { isBaseDefenceEntry as _m2_isBaseDefenceEntry } from '../electron/modules/crafting/equipmentPropertyRules.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { SOCKET_MODEL_VERSION as _m3_SOCKET_MODEL_VERSION, createSockets as _m3_createSockets, displayedBaseStats as _m3_displayedBaseStats, fullLinks as _m3_fullLinks, itemLevelSocketLimit as _m3_itemLevelSocketLimit, linkSizeWeights as _m3_linkSizeWeights, naturalSocketLimit as _m3_naturalSocketLimit, qualityGainForItemLevel as _m3_qualityGainForItemLevel, rerollEntriesDifferent as _m3_rerollEntriesDifferent, rollBaseEntries as _m3_rollBaseEntries, rollLinks as _m3_rollLinks, rollSocketCount as _m3_rollSocketCount, socketColorWeights as _m3_socketColorWeights, socketCountWeights as _m3_socketCountWeights } from '../electron/modules/crafting/equipmentPropertyRules.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { createHash as _m4_createHash } from 'node:crypto'
import { readFile as _m4_readFile } from 'node:fs/promises'
import { gunzip as _m4_gunzip } from 'node:zlib'
import { promisify as _m4_promisify } from 'node:util'
import _m4_path from 'node:path'
import { parsePoedbModifiers as _m4_parsePoedbModifiers } from '../electron/modules/crafting/poedbParser.js'
import { CraftingDataRepository as _m4_CraftingDataRepository } from '../electron/modules/crafting/dataRepository.js'
import { LocalizationRuntime as _m4_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { getServer as _m4_getServer } from '../shared/serverMode.js'
import { normalizeAffixCondition as _m4_normalizeAffixCondition } from '../src/domains/items/affixConfig.js'
import { matchAffixes as _m4_matchAffixes } from '../electron/modules/item/matcher.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { CHAOTIC_RESONATORS as _m5_CHAOTIC_RESONATORS, FOSSIL_DEFINITIONS as _m5_FOSSIL_DEFINITIONS, createFossilCrafts as _m5_createFossilCrafts, createFossilPoolTransform as _m5_createFossilPoolTransform, fossilWeightMultiplier as _m5_fossilWeightMultiplier } from '../electron/modules/crafting/fossilRules.js'
import { normalizeCraftDefinition as _m5_normalizeCraftDefinition } from '../electron/modules/crafting/model.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { readFile as _m6_readFile } from 'node:fs/promises'
import _m6_path from 'node:path'
import { applyManualCurrency as _m6_applyManualCurrency, createManualSession as _m6_createManualSession, inspectManualCurrencies as _m6_inspectManualCurrencies, redoManualAction as _m6_redoManualAction, resetManualSession as _m6_resetManualSession, undoManualAction as _m6_undoManualAction } from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset as _m6_normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { HARVEST_LESS_MULTIPLIER as _m7_HARVEST_LESS_MULTIPLIER, HARVEST_MORE_MULTIPLIER as _m7_HARVEST_MORE_MULTIPLIER, HARVEST_TAGS as _m7_HARVEST_TAGS, createSameTypePoolTransform as _m7_createSameTypePoolTransform, harvestCraftCategory as _m7_harvestCraftCategory, harvestUnavailableExplanation as _m7_harvestUnavailableExplanation, qualityEffectMatchesBase as _m7_qualityEffectMatchesBase } from '../electron/modules/crafting/harvestRules.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { readFile as _m8_readFile } from 'node:fs/promises'
import { rolledAffix as _m8_rolledAffix } from '../electron/modules/crafting/actionProviders.js'
import { eligibleModifierTiers as _m8_eligibleModifierTiers } from '../electron/modules/crafting/craftState.js'
import { HARVEST_TAGS as _m8_HARVEST_TAGS } from '../electron/modules/crafting/harvestRules.js'
import { applyManualCurrency as _m8_applyManualCurrency, applyManualHarvestCraft as _m8_applyManualHarvestCraft, createManualSession as _m8_createManualSession, listManualHarvestCrafts as _m8_listManualHarvestCrafts } from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset as _m8_normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { readFileSync as _m9_readFileSync } from 'node:fs'
import { HEIST_AFFIX_CATALOG_META as _m9_HEIST_AFFIX_CATALOG_META, HEIST_AFFIX_SUGGESTIONS as _m9_HEIST_AFFIX_SUGGESTIONS } from '../src/data/heistAffixSuggestionsData.js'
import { affixSuggestionsForKind as _m9_affixSuggestionsForKind, searchMapAffixSuggestions as _m9_searchMapAffixSuggestions } from '../src/utils/mapAffixSuggestions.js'
import { parseHeistAffixes as _m9_parseHeistAffixes, SOURCE_URLS as _m9_SOURCE_URLS } from '../scripts/generateHeistAffixSuggestions.js'
import { parseItemInfo as _m9_parseItemInfo } from '../electron/modules/item/parser.js'
import { matchMapRequirements as _m9_matchMapRequirements } from '../electron/modules/item/matcher.js'
import { createDefaultHeistConfig as _m9_createDefaultHeistConfig } from '../src/utils/mapPresetMigration.js'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import { readFile as _m10_readFile } from 'node:fs/promises'
import _m10_path from 'node:path'
import { rolledAffix as _m10_rolledAffix } from '../electron/modules/crafting/actionProviders.js'
import { applyManualInfluenceCraft as _m10_applyManualInfluenceCraft, configureManualAwakenerDonor as _m10_configureManualAwakenerDonor, createManualSession as _m10_createManualSession, createSeededRng as _m10_createSeededRng, listManualAwakenerDonorCandidates as _m10_listManualAwakenerDonorCandidates, listManualInfluenceCrafts as _m10_listManualInfluenceCrafts, redoManualAction as _m10_redoManualAction, resetManualSession as _m10_resetManualSession, undoManualAction as _m10_undoManualAction } from '../electron/modules/crafting/manualCrafting.js'
import { dominanceCandidates as _m10_dominanceCandidates } from '../electron/modules/crafting/influenceRules.js'
import { normalizeCraftingDataset as _m10_normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { modifierMatchesBase as _m10_modifierMatchesBase } from '../electron/modules/crafting/variantRules.js'
import _m11_test from 'node:test'
import _m11_assert from 'node:assert/strict'
import { mkdtemp as _m11_mkdtemp, mkdir as _m11_mkdir, readFile as _m11_readFile, writeFile as _m11_writeFile, rm as _m11_rm } from 'node:fs/promises'
import _m11_path from 'node:path'
import _m11_os from 'node:os'
import { CraftingDataRepository as _m11_CraftingDataRepository } from '../electron/modules/crafting/dataRepository.js'
import { getServer as _m11_getServer } from '../shared/serverMode.js'
import { generateInternationalCraftingData as _m11_generateInternationalCraftingData } from '../scripts/generateInternationalCraftingData.js'
import { parseBaseRequirements as _m11_parseBaseRequirements, parsePoedbBases as _m11_parsePoedbBases, inferCraftEffectKind as _m11_inferCraftEffectKind } from '../electron/modules/crafting/poedbParser.js'
import _m12_test from 'node:test'
import _m12_assert from 'node:assert/strict'
import { createHash as _m12_createHash } from 'node:crypto'
import { LocalizationRuntime as _m12_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { matchAffixes as _m12_matchAffixes } from '../electron/modules/item/matcher.js'
import { ItemFootprintRegistry as _m12_ItemFootprintRegistry, loadServerFootprintCatalog as _m12_loadServerFootprintCatalog } from '../electron/modules/items/footprintRegistry.js'
import _m13_test from 'node:test'
import _m13_assert from 'node:assert/strict'
import { createHash as _m13_createHash } from 'node:crypto'
import { LocalizationRuntime as _m13_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { matchAffixes as _m13_matchAffixes, matchEldritchImplicits as _m13_matchEldritchImplicits } from '../electron/modules/item/matcher.js'

// === Merged from eldritchRules.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const ELDRITCH_CURRENCY_DEFINITIONS = _m0_ELDRITCH_CURRENCY_DEFINITIONS
  const conflictUpgradeChance = _m0_conflictUpgradeChance
  const eldritchDominance = _m0_eldritchDominance
  const eldritchImplicitCandidates = _m0_eldritchImplicitCandidates
  const replaceEldritchTier = _m0_replaceEldritchTier
  const rolledEldritchImplicit = _m0_rolledEldritchImplicit
const family = {
  id: 'eldritch:exarch:attack-speed:gloves', source: 'exarch', effectKey: 'attack speed #%', name: '攻击速度',
  itemClasses: ['Gloves'], tags: ['speed'], displayTags: [{ id: 'speed', label: '速度' }],
  tiers: Array.from({ length: 6 }, (_, index) => ({
    id: `eldritch:exarch:attack-speed:gloves:t${index + 1}`, tier: index + 1,
    name: `T${index + 1}`, requiredLevel: index + 1, text: `攻击速度加快 (${index + 5}—${index + 6})%`,
    values: [{ min: index + 5, max: index + 6 }], displayTags: [{ id: 'speed', label: '速度' }], weights: { Gloves: 1000 }
  }))
}
const dataset = { eldritchImplicitFamilies: [family] }
const base = { itemClass: 'Gloves' }

test('古灵通货定义和支配方映射完整', () => {
  assert.equal(ELDRITCH_CURRENCY_DEFINITIONS.length, 12)
  assert.equal(ELDRITCH_CURRENCY_DEFINITIONS.filter((entry) => entry.kind === 'implicit').length, 8)
  assert.deepEqual(eldritchDominance({ eldritchImplicits: { exarch: { tier: 1 }, eater: null } }), {
    source: 'exarch', affixType: 'prefix', label: '焚界者支配', exarchTier: 1, eaterTier: 0
  })
  assert.equal(eldritchDominance({ eldritchImplicits: { exarch: { tier: 4 }, eater: { tier: 4 } } }).source, null)
  assert.equal(eldritchDominance({ eldritchImplicits: { exarch: { tier: 2 }, eater: { tier: 3 } } }).affixType, 'suffix')
})

test('冲突石概率按阶级差计算并限制边界', () => {
  assert.equal(conflictUpgradeChance(4, 4), 0.5)
  assert.equal(conflictUpgradeChance(5, 3), 0.28)
  assert.equal(conflictUpgradeChance(3, 5), 0.72)
  assert.equal(conflictUpgradeChance(100, 1), 0.05)
  assert.equal(conflictUpgradeChance(1, 100), 0.95)
})

test('古灵候选按类别、物品等级和阶级过滤并可确定掷值', () => {
  assert.equal(eldritchImplicitCandidates(dataset, base, 3, 'exarch', 3).length, 1)
  assert.equal(eldritchImplicitCandidates(dataset, base, 2, 'exarch', 3).length, 0)
  assert.equal(eldritchImplicitCandidates(dataset, { itemClass: 'Helmet' }, 100, 'exarch', 3).length, 0)
  const rolled = rolledEldritchImplicit(family, family.tiers[2], base, () => 0)
  assert.equal(rolled.rolledValues[0], 7)
  assert.match(rolled.rolledText, /7/)
  assert.equal(replaceEldritchTier(dataset, rolled, 4, base, () => 0).tier, 4)
  assert.equal(replaceEldritchTier(dataset, rolled, 0, base, () => 0), null)
})
})()

// === Merged from eldritchSnapshot.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFile = _m1_readFile
  const path = _m1_path
  const normalizeCraftingDataset = _m1_normalizeCraftingDataset
  const applyManualCurrency = _m1_applyManualCurrency
  const applyManualEldritchCraft = _m1_applyManualEldritchCraft
  const createManualSession = _m1_createManualSession
  const listManualEldritchCrafts = _m1_listManualEldritchCrafts
const dataset = normalizeCraftingDataset(JSON.parse(await readFile(path.resolve('electron/assets/crafting-data/dataset.json'), 'utf8')))

test('内置快照包含两来源、四类护甲和完整六阶古灵家族', () => {
  const families = dataset.eldritchImplicitFamilies
  assert.ok(families.length >= 600)
  assert.deepEqual(new Set(families.map((family) => family.source)), new Set(['exarch', 'eater']))
  assert.deepEqual(new Set(families.flatMap((family) => family.itemClasses)), new Set(['Helmet', 'Gloves', 'Boots', 'BodyArmour']))
  assert.ok(families.every((family) => family.tiers.length === 6 && family.tiers.every((tier, index) => tier.tier === index + 1)))
  assert.ok(families.some((family) => family.tiers[0].weights[family.itemClasses[0]] === 0 && family.tiers.some((tier) => tier.weights[family.itemClasses[0]] > 0)))
})

test('真实快照八种直接古灵通货在四类护甲均有候选', () => {
  for (const itemClass of ['Helmet', 'Gloves', 'Boots', 'BodyArmour']) {
    const base = dataset.bases.find((entry) => entry.itemClass === itemClass && entry.allowedVariants.includes('normal'))
    assert.ok(base, `缺少 ${itemClass} 底材`)
    const session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 20260722 })
    const direct = listManualEldritchCrafts(dataset, session).items.filter((entry) => entry.kind === 'implicit')
    assert.equal(direct.length, 8)
    assert.ok(direct.every((entry) => entry.canApply && entry.candidateCount > 0), `${itemClass} 有直接通货空池`)
  }
})

test('真实手套快照执行直接隐式、三种支配通货与冲突石', () => {
  const base = dataset.bases.find((entry) => entry.itemClass === 'Gloves' && entry.allowedVariants.includes('normal'))
  let session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 9917 })
  session = applyManualEldritchCraft(dataset, session, 'eldritch:exceptional-eldritch-ember').session
  session = applyManualEldritchCraft(dataset, session, 'eldritch:lesser-eldritch-ichor').session
  assert.equal(listManualEldritchCrafts(dataset, session).dominance.source, 'exarch')
  session = applyManualCurrency(dataset, session, 'currency:alchemy').session

  const annulled = applyManualEldritchCraft(dataset, session, 'eldritch:annulment')
  assert.equal(annulled.event.targetAffixType, 'prefix')
  const exalted = applyManualEldritchCraft(dataset, annulled.session, 'eldritch:exalted')
  assert.equal(exalted.event.targetAffixType, 'prefix')
  const chaos = applyManualEldritchCraft(dataset, exalted.session, 'eldritch:chaos')
  assert.equal(chaos.event.targetAffixType, 'prefix')
  assert.deepEqual(chaos.session.state.suffixes, exalted.session.state.suffixes)
  const conflict = applyManualEldritchCraft(dataset, chaos.session, 'eldritch:conflict')
  assert.ok(['exarch', 'eater'].includes(conflict.event.conflict.upgradeSource))
  assert.equal(conflict.event.conflict.basis, '社区实测估计')
})
})()

// === Merged from equipmentCurrencies.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const readFile = _m2_readFile
  const path = _m2_path
  const applyManualBeastcraft = _m2_applyManualBeastcraft
  const applyManualCurrency = _m2_applyManualCurrency
  const createManualSession = _m2_createManualSession
  const listManualBeastcrafts = _m2_listManualBeastcrafts
  const inspectManualCurrencies = _m2_inspectManualCurrencies
  const previewManualCurrency = _m2_previewManualCurrency
  const redoManualAction = _m2_redoManualAction
  const resetManualSession = _m2_resetManualSession
  const undoManualAction = _m2_undoManualAction
  const normalizeCraftingDataset = _m2_normalizeCraftingDataset
  const isBaseDefenceEntry = _m2_isBaseDefenceEntry
const dataset = normalizeCraftingDataset(JSON.parse(await readFile(path.resolve('electron/assets/crafting-data/dataset.json'), 'utf8')))

function findBase(predicate, message) {
  const base = dataset.bases.find(predicate)
  assert.ok(base, message)
  return base
}

function sessionFor(base, { itemLevel = 100, seed = 1 } = {}) {
  return createManualSession(dataset, { baseId: base.id, itemLevel: Math.max(base.requiredLevel, itemLevel), variant: { kind: 'normal' }, seed })
}

function currency(current, id) {
  return inspectManualCurrencies(dataset, current).find((entry) => entry.id === id)
}

test('磨刀石与护甲片遵守类型、随机品质增量、20% 上限和不可变门禁', () => {
  const weapon = findBase((base) => base.qualityType === 'weapon', '缺少武器底材')
  let current = sessionFor(weapon, { itemLevel: 100, seed: 10 })
  assert.match(currency(current, 'currency:armourers-scrap').unavailableReason, /护甲/)
  const first = applyManualCurrency(dataset, current, 'currency:blacksmith-whetstone')
  assert.ok(first.session.state.quality >= 1 && first.session.state.quality <= 20)
  assert.deepEqual(first.event.qualityChange, { before: 0, after: first.session.state.quality })
  current = first.session
  while (current.state.quality < 20) current = applyManualCurrency(dataset, current, 'currency:blacksmith-whetstone').session
  assert.equal(current.state.quality, 20)
  assert.match(currency(current, 'currency:blacksmith-whetstone').unavailableReason, /20%/)
  current.state.corrupted = true
  assert.match(currency(current, 'currency:blacksmith-whetstone').unavailableReason, /腐化/)
})

test('珠宝匠、幻色与链接石分别维护孔位不变量及各自不应改变的部分', () => {
  const body = findBase((base) => base.itemClass === 'BodyArmour' && base.socketLimit === 6, '缺少六孔胸甲')
  let current = sessionFor(body, { itemLevel: 100, seed: 20 })
  const jewelled = applyManualCurrency(dataset, current, 'currency:jewellers')
  assert.notEqual(jewelled.session.state.sockets.length, current.state.sockets.length)
  assert.ok(jewelled.session.state.sockets.length <= 6)
  assert.equal(new Set(jewelled.session.state.links.flat()).size, jewelled.session.state.sockets.length)

  current = jewelled.session
  const linksBefore = structuredClone(current.state.links)
  const idsBefore = current.state.sockets.map((socket) => socket.id)
  const chromatic = applyManualCurrency(dataset, current, 'currency:chromatic')
  assert.deepEqual(chromatic.session.state.links, linksBefore)
  assert.deepEqual(chromatic.session.state.sockets.map((socket) => socket.id), idsBefore)

  current = chromatic.session
  current.state.links = current.state.sockets.map((socket) => [socket.id])
  const colorsBefore = current.state.sockets.map((socket) => socket.color)
  const fused = applyManualCurrency(dataset, current, 'currency:fusing')
  assert.deepEqual(fused.session.state.sockets.map((socket) => socket.color), colorsBefore)
  assert.equal(new Set(fused.session.state.links.flat()).size, fused.session.state.sockets.length)
  assert.equal(currency(fused.session, 'currency:jewellers').probabilityModel, 'poe1-3.29-community-v1')
  assert.equal(currency(fused.session, 'currency:fusing').probabilityModel, 'poe1-3.29-community-v1')
})

test('祝福石重掷可变普通固有词缀且不改变种类', () => {
  const base = findBase((entry) => entry.implicitModifiers.some((implicit) => implicit.values.some((range) => range.max > range.min)), '缺少可变固有词缀底材')
  const current = sessionFor(base, { seed: 30 })
  const ids = current.state.baseImplicits.map((entry) => entry.id)
  const values = current.state.baseImplicits.map((entry) => entry.rolledValues)
  const result = applyManualCurrency(dataset, current, 'currency:blessed')
  assert.deepEqual(result.session.state.baseImplicits.map((entry) => entry.id), ids)
  assert.notDeepEqual(result.session.state.baseImplicits.map((entry) => entry.rolledValues), values)
  assert.ok(result.event.implicitChange)
})

test('圣玉只重骰共享基础防御并公开准确门禁与历史', () => {
  const hybrid = findBase((base) => base.qualityType === 'armour' && base.baseStats.filter((entry) => isBaseDefenceEntry(entry) && entry.values.some((range) => range.max > range.min)).length >= 2, '缺少混合防御底材')
  const current = sessionFor(hybrid, { seed: 31 })
  assert.ok(Number.isInteger(current.state.baseDefencePercentile))
  const preserved = {
    quality: current.state.quality,
    sockets: structuredClone(current.state.sockets), links: structuredClone(current.state.links),
    baseImplicits: structuredClone(current.state.baseImplicits),
    prefixes: structuredClone(current.state.prefixes), suffixes: structuredClone(current.state.suffixes),
    nonDefences: structuredClone(current.state.baseStats.filter((entry) => !isBaseDefenceEntry(entry)))
  }
  const result = applyManualCurrency(dataset, current, 'currency:sacred')
  assert.equal(result.event.costs[0].resourceName, '圣玉')
  assert.equal(result.event.baseDefenceChange.percentileBefore, current.state.baseDefencePercentile)
  assert.equal(result.event.baseDefenceChange.percentileAfter, result.session.state.baseDefencePercentile)
  assert.deepEqual({
    quality: result.session.state.quality,
    sockets: result.session.state.sockets, links: result.session.state.links,
    baseImplicits: result.session.state.baseImplicits,
    prefixes: result.session.state.prefixes, suffixes: result.session.state.suffixes,
    nonDefences: result.session.state.baseStats.filter((entry) => !isBaseDefenceEntry(entry))
  }, preserved)

  const weapon = sessionFor(findBase((base) => base.qualityType === 'weapon', '缺少武器底材'))
  assert.match(currency(weapon, 'currency:sacred').unavailableReason, /只能用于护甲/)
  const fixed = structuredClone(current)
  fixed.state.baseStats.forEach((entry) => { if (isBaseDefenceEntry(entry)) entry.valueRanges = entry.valueRanges.map((range) => ({ min: range.min, max: range.min })) })
  fixed.state.baseDefencePercentile = null
  assert.match(currency(fixed, 'currency:sacred').unavailableReason, /没有可重骰/)
  const corrupted = structuredClone(current); corrupted.state.corrupted = true
  assert.match(currency(corrupted, 'currency:sacred').unavailableReason, /腐化/)
  const mirrored = structuredClone(current); mirrored.state.mirrored = true
  assert.match(currency(mirrored, 'currency:sacred').unavailableReason, /镜像/)
})

test('圣玉结果可复现并参与预见、撤销、重做和重置', () => {
  const base = findBase((entry) => entry.qualityType === 'armour' && entry.baseStats.some((stat) => isBaseDefenceEntry(stat) && stat.values.some((range) => range.max > range.min)), '缺少可变基础防御护甲')
  const first = sessionFor(base, { seed: 32 })
  const second = structuredClone(first)
  assert.deepEqual(applyManualCurrency(dataset, first, 'currency:sacred').session.state, applyManualCurrency(dataset, second, 'currency:sacred').session.state)

  let foreseen = applyManualCurrency(dataset, first, 'currency:transmutation').session
  foreseen = applyManualBeastcraft(dataset, foreseen, 'apply-hinekora-lock').session
  const beforePreview = structuredClone(foreseen)
  const preview = previewManualCurrency(dataset, foreseen, 'currency:sacred')
  assert.deepEqual(foreseen, beforePreview)
  const applied = applyManualCurrency(dataset, foreseen, 'currency:sacred')
  assert.deepEqual(applied.session.state, preview.state)
  const undone = undoManualAction(dataset, applied.session)
  assert.deepEqual(undone.session.state, foreseen.state)
  assert.deepEqual(redoManualAction(dataset, undone.session).session.state, applied.session.state)
  assert.deepEqual(resetManualSession(dataset, applied.session).session.state, applied.session.initialState)
})

test('束缚石升级普通物品并生成不超过类型上限的完整四连', () => {
  const body = findBase((base) => base.itemClass === 'BodyArmour' && base.requiredLevel === 1, '缺少一级胸甲')
  const current = sessionFor(body, { itemLevel: 1, seed: 40 })
  const result = applyManualCurrency(dataset, current, 'currency:binding')
  assert.equal(result.session.state.rarity, 'rare')
  assert.equal(result.session.state.sockets.length, 4)
  assert.deepEqual(result.session.state.links, [result.session.state.sockets.map((socket) => socket.id)])
  assert.ok(result.session.state.prefixes.length + result.session.state.suffixes.length >= 4)
})

test('黑莫里根最大孔/最大连接复用孔位规则，并随历史、重置和预见完整流转', () => {
  const body = findBase((base) => base.itemClass === 'BodyArmour' && base.socketLimit === 6, '缺少六孔胸甲')
  let current = sessionFor(body, { itemLevel: 35, seed: 50 })
  assert.equal(listManualBeastcrafts(dataset, current).items.find((entry) => entry.id === 'maximum-sockets').canApply, true)
  const socketed = applyManualBeastcraft(dataset, current, 'maximum-sockets')
  assert.equal(socketed.session.state.sockets.length, 5)
  const linked = applyManualBeastcraft(dataset, socketed.session, 'maximum-links')
  assert.deepEqual(linked.session.state.links, [linked.session.state.sockets.map((socket) => socket.id)])

  const undone = undoManualAction(dataset, linked.session)
  assert.notDeepEqual(undone.session.state.links, linked.session.state.links)
  assert.deepEqual(redoManualAction(dataset, undone.session).session.state, linked.session.state)
  assert.deepEqual(resetManualSession(dataset, linked.session).session.state, linked.session.initialState)

  current = applyManualCurrency(dataset, socketed.session, 'currency:transmutation').session
  current = applyManualBeastcraft(dataset, current, 'apply-hinekora-lock').session
  current.state.links = current.state.sockets.map((socket) => [socket.id])
  const before = structuredClone(current)
  const preview = previewManualCurrency(dataset, current, 'currency:fusing')
  assert.deepEqual(current, before)
  assert.deepEqual(applyManualCurrency(dataset, current, 'currency:fusing').session.state, preview.state)
})
})()

// === Merged from equipmentPropertyRules.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const SOCKET_MODEL_VERSION = _m3_SOCKET_MODEL_VERSION
  const createSockets = _m3_createSockets
  const displayedBaseStats = _m3_displayedBaseStats
  const fullLinks = _m3_fullLinks
  const itemLevelSocketLimit = _m3_itemLevelSocketLimit
  const linkSizeWeights = _m3_linkSizeWeights
  const naturalSocketLimit = _m3_naturalSocketLimit
  const qualityGainForItemLevel = _m3_qualityGainForItemLevel
  const rerollEntriesDifferent = _m3_rerollEntriesDifferent
  const rollBaseEntries = _m3_rollBaseEntries
  const rollLinks = _m3_rollLinks
  const rollSocketCount = _m3_rollSocketCount
  const socketColorWeights = _m3_socketColorWeights
  const socketCountWeights = _m3_socketCountWeights
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
  assert.match(SOCKET_MODEL_VERSION, /3\.29/)
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
})()

// === Merged from flaskAffixCatalog.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const createHash = _m4_createHash
  const readFile = _m4_readFile
  const gunzip = _m4_gunzip
  const promisify = _m4_promisify
  const path = _m4_path
  const parsePoedbModifiers = _m4_parsePoedbModifiers
  const CraftingDataRepository = _m4_CraftingDataRepository
  const LocalizationRuntime = _m4_LocalizationRuntime
  const getServer = _m4_getServer
  const normalizeAffixCondition = _m4_normalizeAffixCondition
  const matchAffixes = _m4_matchAffixes
const gunzipAsync = promisify(gunzip)
const snapshotRoot = path.resolve('electron/assets/crafting-raw/3.28')

async function rawPage(manifest, id) {
  const entry = manifest.sources.find((source) => source.id === id)
  assert.ok(entry, `缺少 ${id}`)
  assert.equal(entry.category, 'modifier')
  assert.equal(entry.status, 200)
  assert.match(entry.sha256, /^[a-f0-9]{64}$/)
  const html = (await gunzipAsync(await readFile(path.join(snapshotRoot, entry.file)))).toString('utf8')
  assert.equal(createHash('sha256').update(html).digest('hex'), entry.sha256)
  return html
}

test('3.28 原始快照包含四类药剂来源并能解析三类词缀载荷', async () => {
  const manifest = JSON.parse(await readFile(path.join(snapshotRoot, 'manifest.json'), 'utf8'))
  for (const profile of ['Life_Flasks', 'Mana_Flasks', 'Utility_Flasks']) {
    const html = await rawPage(manifest, `modifier:${profile}`)
    const modifiers = parsePoedbModifiers(html, { profileId: profile })
    assert.ok(modifiers.some((entry) => entry.affixType === 'prefix'))
    assert.ok(modifiers.some((entry) => entry.affixType === 'suffix'))
    assert.ok(modifiers.every((entry) => entry.source === 'natural'))
    assert.ok(modifiers.every((entry) => entry.tiers.every((tier) => tier.tier > 0 && tier.requiredLevel > 0 && tier.text)))
  }
  const hybrid = await rawPage(manifest, 'modifier:Hybrid_Flasks')
  assert.match(hybrid, /复合药剂\s*物品\s*\/\s*\d+/)
  assert.equal(parsePoedbModifiers(hybrid, { profileId: 'Hybrid_Flasks' }).length, 0)
})

test('全库联想返回药剂与珠宝且药剂不进入做装底材', async () => {
  const repository = new CraftingDataRepository()
  await repository.initialize()
  const flask = repository.searchAffixSuggestions({ query: '回复速度', limit: 100 }).items
  assert.ok(flask.some((entry) => /药剂/.test(entry.applicableLabel)))
  assert.ok(flask.some((entry) => entry.tiers.length > 1))
  const jewel = repository.searchAffixSuggestions({ query: '最大生命', limit: 100 }).items
  assert.ok(jewel.some((entry) => /赤红珠宝|翠绿珠宝|钴蓝珠宝|三相珠宝/.test(entry.applicableLabel)))
  assert.ok(jewel.some((entry) => /之凝珠宝/.test(entry.applicableLabel)))
  assert.ok(jewel.some((entry) => /星团珠宝/.test(entry.applicableLabel)))
  assert.equal(repository.getDataset().bases.some((base) => /Flask/.test(base.itemClass)), false)
})

async function localizedFlaskRepository() {
  const entries = JSON.parse(await readFile(new URL('./fixtures/flask-affix-suggestion-entries.json', import.meta.url), 'utf8'))
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'flask-suggestions' })
  const repository = new CraftingDataRepository({ server: getServer('international'), localizationRuntime: runtime })
  await repository.initialize()
  return repository
}

const effectFlaskPattern = '#% reduced Duration\n#% increased effect'

test('国际服药剂多行词缀按任一行的中文效果联想，保存英文匹配条件', async () => {
  const repository = await localizedFlaskRepository()
  for (const query of ['效果提高', '生效时间缩短', '增加 #% 效果', 'reduced Duration']) {
    const suggestion = repository.searchAffixSuggestions({ query, limit: 50 }).items.find(row => row.effectPattern === effectFlaskPattern)
    assert.ok(suggestion, `缺少药剂联想：${query}`)
    assert.equal(suggestion.displayName, '生效时间缩短 #%\n效果提高 #%')
    assert.match(suggestion.exampleText, /效果提高 25%/)
    assert.equal(suggestion.tiers.length, 3)
    const condition = normalizeAffixCondition({ ...suggestion, kind: 'catalog' })
    assert.equal(condition.effectPattern, effectFlaskPattern)
    const group = { requiredAffixes: [condition] }
    assert.equal(matchAffixes({ modifiers: [{ text: '26% reduced Duration\n25% increased effect', tier: 1 }] }, [group]).isMatch, true)
    assert.equal(matchAffixes({ modifiers: [{ text: '26% reduced Duration', tier: 1 }] }, [group]).isMatch, false)
  }
})

test('国际服药剂阶级名称的简繁译名可联想同一效果组', async () => {
  const repository = await localizedFlaskRepository()
  for (const query of ['启蒙师', '业余者', '炼金的', '初學者', '涉獵者', '鍊金的', "Alchemist's"]) {
    const { items } = repository.searchAffixSuggestions({ query })
    assert.ok(items.some(row => row.effectPattern === effectFlaskPattern), `缺少药剂名称联想：${query}`)
  }
})

test('药剂三行效果中的连续两行译文也能联想，候选保留完整效果', async () => {
  const repository = await localizedFlaskRepository()
  const cases = [
    ['#% reduced Amount Recovered\nEffect is not removed when Unreserved Mana is Filled\nEffect does not Queue',
      ['未保留的魔力充满时', '效果不会堆叠']],
    ['#% less Duration\nImmunity to Ignite during Effect\nRemoves Burning on use',
      ['药剂持续期间免疫点燃', '使用时移除燃烧效果']]
  ]
  for (const [pattern, queries] of cases) {
    for (const query of queries) {
      const suggestion = repository.searchAffixSuggestions({ query, limit: 50 }).items.find(row => row.effectPattern === pattern)
      assert.ok(suggestion, `缺少药剂组合译文联想：${query}`)
      assert.ok(suggestion.displayName.includes(query))
      assert.equal(suggestion.displayName.split('\n').length, 3)
      assert.equal(normalizeAffixCondition({ ...suggestion, kind: 'catalog' }).effectPattern, pattern)
    }
  }
})
})()

// === Merged from fossilRules.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const CHAOTIC_RESONATORS = _m5_CHAOTIC_RESONATORS
  const FOSSIL_DEFINITIONS = _m5_FOSSIL_DEFINITIONS
  const createFossilCrafts = _m5_createFossilCrafts
  const createFossilPoolTransform = _m5_createFossilPoolTransform
  const fossilWeightMultiplier = _m5_fossilWeightMultiplier
  const normalizeCraftDefinition = _m5_normalizeCraftDefinition
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
})()

// === Merged from fracturingOrb.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const readFile = _m6_readFile
  const path = _m6_path
  const applyManualCurrency = _m6_applyManualCurrency
  const createManualSession = _m6_createManualSession
  const inspectManualCurrencies = _m6_inspectManualCurrencies
  const redoManualAction = _m6_redoManualAction
  const resetManualSession = _m6_resetManualSession
  const undoManualAction = _m6_undoManualAction
  const normalizeCraftingDataset = _m6_normalizeCraftingDataset
const dataset = normalizeCraftingDataset(JSON.parse(await readFile(path.resolve('electron/assets/crafting-data/dataset.json'), 'utf8')))
const base = dataset.bases.find((entry) => entry.itemClass === 'Helmet' && entry.allowedVariants.includes('normal') && entry.allowedVariants.includes('fractured'))

function rareSession(seed = 100) {
  const session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed })
  return applyManualCurrency(dataset, session, 'currency:alchemy').session
}

function allAffixes(session) {
  return [...session.state.prefixes, ...session.state.suffixes]
}

function fracturingEntry(session) {
  return inspectManualCurrencies(dataset, session).find((entry) => entry.id === 'currency:fracturing')
}

test('破溃宝珠固定随机选择一条词缀并只增加破裂标记', () => {
  const session = rareSession(201)
  const before = structuredClone(session.state)
  const first = applyManualCurrency(dataset, session, 'currency:fracturing')
  const repeated = applyManualCurrency(dataset, session, 'currency:fracturing')
  assert.deepEqual(first.session.state, repeated.session.state)
  assert.equal(allAffixes(first.session).filter((affix) => affix.fractured).length, 1)
  assert.equal(first.event.fracturedModifier.fractured, true)
  const afterWithoutFlag = structuredClone(first.session.state)
  const selected = [...afterWithoutFlag.prefixes, ...afterWithoutFlag.suffixes].find((affix) => affix.fractured)
  selected.fractured = false
  assert.deepEqual(afterWithoutFlag, before)
  assert.equal(first.session.variant.kind, 'fractured')
  assert.equal(first.session.variant.fracturedTierId, first.event.fracturedModifier.tierId)
})

test('破溃宝珠忽略位置锁且工艺元工艺同样参与等概率候选', () => {
  const session = rareSession(202)
  session.rngState = 1
  const first = session.state.prefixes[0]
  first.source = 'crafted'
  first.metaCraft = true
  first.modifierId = 'bench-meta:lock-prefixes'
  first.goalId = first.modifierId
  first.groupId = first.modifierId
  session.state.meta.prefixesLocked = true
  const result = applyManualCurrency(dataset, session, 'currency:fracturing')
  assert.equal(result.event.fracturedModifier.modifierId, 'bench-meta:lock-prefixes')
  assert.equal(result.event.fracturedModifier.source, 'crafted')
  assert.equal(result.event.fracturedModifier.metaCraft, true)
  assert.equal(result.session.state.meta.prefixesLocked, true)
})

test('破溃宝珠拒绝稀有度、数量、腐化、势力、综合、已有破裂和未揭露状态', () => {
  const normal = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 301 })
  assert.match(fracturingEntry(normal).unavailableReason, /稀有/)
  normal.state.rarity = 'rare'
  assert.match(fracturingEntry(normal).unavailableReason, /至少有 4 条/)

  const cases = [
    ['腐化', (session) => { session.state.corrupted = true }],
    ['势力', (session) => { session.state.influences = ['shaper']; session.variant = { kind: 'influenced', influences: ['shaper'], fracturedTierId: null, implicits: [] } }],
    ['综合', (session) => { session.variant = { kind: 'synthesized', influences: [], fracturedTierId: null, implicits: [] } }],
    ['破裂', (session) => { allAffixes(session)[0].fractured = true }],
    ['揭露', (session) => { allAffixes(session)[0].veiled = true; allAffixes(session)[0].source = 'veiled-pending' }]
  ]
  for (const [message, mutate] of cases) {
    const session = rareSession(302)
    mutate(session)
    const entry = fracturingEntry(session)
    assert.equal(entry.canApply, false)
    assert.match(entry.unavailableReason, new RegExp(message))
  }
})

test('Split 与古灵隐式在破裂后完整保留', () => {
  const session = rareSession(401)
  session.state.split = true
  session.variant = { kind: 'eldritch', influences: [], fracturedTierId: null, implicits: [] }
  session.state.eldritchImplicits.exarch = {
    source: 'exarch', familyId: 'test', tierId: 'test:t1', tier: 1, name: 'T1',
    text: '测试古灵隐式', rolledText: '测试古灵隐式', valueRanges: [], rolledValues: [], displayTags: [], weight: 100
  }
  assert.equal(fracturingEntry(session).canApply, true)
  const result = applyManualCurrency(dataset, session, 'currency:fracturing')
  assert.equal(result.session.state.split, true)
  assert.deepEqual(result.session.state.eldritchImplicits, session.state.eldritchImplicits)
})

test('破裂动作撤销、重做和重置同步恢复装备变体', () => {
  const session = rareSession(501)
  const result = applyManualCurrency(dataset, session, 'currency:fracturing')
  const undone = undoManualAction(dataset, result.session)
  assert.deepEqual(undone.session.state, session.state)
  assert.deepEqual(undone.session.variant, session.variant)
  const redone = redoManualAction(dataset, undone.session)
  assert.deepEqual(redone.session.state, result.session.state)
  assert.deepEqual(redone.session.variant, result.session.variant)
  const reset = resetManualSession(dataset, redone.session)
  assert.equal(reset.session.variant.kind, 'normal')
  assert.equal(allAffixes(reset.session).length, 0)
})
})()

// === Merged from harvestRules.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const HARVEST_LESS_MULTIPLIER = _m7_HARVEST_LESS_MULTIPLIER
  const HARVEST_MORE_MULTIPLIER = _m7_HARVEST_MORE_MULTIPLIER
  const HARVEST_TAGS = _m7_HARVEST_TAGS
  const createSameTypePoolTransform = _m7_createSameTypePoolTransform
  const harvestCraftCategory = _m7_harvestCraftCategory
  const harvestUnavailableExplanation = _m7_harvestUnavailableExplanation
  const qualityEffectMatchesBase = _m7_qualityEffectMatchesBase
test('当前花园标签和分类规则完整', () => {
  assert.equal(HARVEST_TAGS.length, 16)
  assert.deepEqual(HARVEST_TAGS.map((entry) => entry.id), [
    'fire', 'cold', 'lightning', 'physical', 'life', 'defences', 'chaos', 'attack',
    'caster', 'speed', 'critical', 'minion', 'elemental', 'attribute', 'mana', 'drop'
  ])
  assert.equal(harvestCraftCategory('reforge_tag'), 'reforge')
  assert.equal(harvestCraftCategory('convert_damage'), 'conversion')
  assert.equal(harvestCraftCategory('quality_enchant'), 'enchant')
  assert.match(harvestUnavailableExplanation('synthesize_item'), /追忆固定词缀结果池/)
})

test('同类更多和更少只变换与原词缀相交的候选权重', () => {
  const pool = [
    { modifier: { tags: ['life', 'resource'] }, weight: 100 },
    { modifier: { tags: ['caster'] }, weight: 200 }
  ]
  const more = createSameTypePoolTransform(['life'], 'more')(pool)
  const less = createSameTypePoolTransform(['life'], 'less')(pool)
  assert.equal(HARVEST_MORE_MULTIPLIER, 10)
  assert.equal(HARVEST_LESS_MULTIPLIER, 0.1)
  assert.deepEqual(more.map((entry) => entry.weight), [1000, 200])
  assert.deepEqual(less.map((entry) => entry.weight), [10, 200])
})

test('品质效果严格按胸甲、近战武器和全部武器适用', () => {
  assert.equal(qualityEffectMatchesBase('body_armour', { itemClass: 'BodyArmour' }), true)
  assert.equal(qualityEffectMatchesBase('body_armour', { itemClass: 'Helmet' }), false)
  assert.equal(qualityEffectMatchesBase('melee_weapon', { itemClass: 'Bow' }), false)
  assert.equal(qualityEffectMatchesBase('melee_weapon', { itemClass: 'Sceptre' }), true)
  assert.equal(qualityEffectMatchesBase('weapon', { itemClass: 'Wand' }), true)
  assert.equal(qualityEffectMatchesBase('weapon', { itemClass: 'Shield' }), false)
})
})()

// === Merged from harvestSnapshot.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const readFile = _m8_readFile
  const rolledAffix = _m8_rolledAffix
  const eligibleModifierTiers = _m8_eligibleModifierTiers
  const HARVEST_TAGS = _m8_HARVEST_TAGS
  const applyManualCurrency = _m8_applyManualCurrency
  const applyManualHarvestCraft = _m8_applyManualHarvestCraft
  const createManualSession = _m8_createManualSession
  const listManualHarvestCrafts = _m8_listManualHarvestCrafts
  const normalizeCraftingDataset = _m8_normalizeCraftingDataset
const dataset = normalizeCraftingDataset(JSON.parse(await readFile('electron/assets/crafting-data/dataset.json', 'utf8')))
const harvestCrafts = dataset.crafts.filter((craft) => craft.provider === 'harvest')

function naturalPool(base, variant = { kind: 'normal', influences: [], fracturedTierId: null, implicits: [] }) {
  return eligibleModifierTiers(dataset, base, 100, variant, { rarity: 'rare', prefixes: [], suffixes: [], influences: variant.influences, meta: {} }, { sources: ['natural'] })
}

test('内置快照保存当前花园配方、全部消耗与十六标签覆盖', () => {
  assert.ok(harvestCrafts.length >= 60)
  assert.equal(harvestCrafts.some((craft) => craft.effectKind === 'synthesize_item'), false)
  assert.ok(harvestCrafts.filter((craft) => craft.effectKind === 'reforge_tag').length >= 12)
  assert.ok(harvestCrafts.filter((craft) => craft.effectKind === 'convert_resistance' || craft.effectKind === 'convert_damage').length >= 10)
  assert.ok(harvestCrafts.filter((craft) => craft.effectKind === 'remove_add_tag').length >= 10)
  assert.ok(harvestCrafts.filter((craft) => craft.effectKind === 'quality_enchant').length >= 10)
  assert.equal(harvestCrafts.some((craft) => !craft.cost.length), false)

  const coverage = new Map(HARVEST_TAGS.map(({ id }) => [id, 0]))
  for (const base of dataset.bases) {
    const tags = new Set(naturalPool(base).flatMap((entry) => entry.modifier.tags))
    for (const { id } of HARVEST_TAGS) if (tags.has(id)) coverage.set(id, coverage.get(id) + 1)
  }
  for (const [tag, count] of coverage) assert.ok(count > 0, `${tag} 标签在全部底材中没有候选`)

  const dropCraft = harvestCrafts.find((craft) => craft.name.includes('掉落'))
  assert.equal(dropCraft.params.tag, 'drop')
  assert.deepEqual(dropCraft.cost.map(({ resourceName, amount }) => [resourceName, amount]), [['活性黄晶命能', 200], ['憎恨结晶', 1]])
})

test('3.28 憎恨结晶的十一项装备工艺与有向参数完整且不重复', () => {
  const rancourCrafts = harvestCrafts.filter((craft) => craft.cost.some((cost) => cost.resourceName === '憎恨结晶'))
  const equipmentCrafts = rancourCrafts.filter((craft) => ['reforge_tag', 'convert_damage'].includes(craft.effectKind))
  assert.equal(rancourCrafts.length, 12)
  assert.equal(equipmentCrafts.length, 11)
  assert.equal(new Set(rancourCrafts.map((craft) => craft.id)).size, 12)
  assert.deepEqual(
    equipmentCrafts.filter((craft) => craft.effectKind === 'reforge_tag').map((craft) => craft.params.tag).sort(),
    ['attribute', 'drop', 'elemental', 'mana', 'minion']
  )
  assert.deepEqual(
    equipmentCrafts.filter((craft) => craft.effectKind === 'convert_damage').map((craft) => `${craft.params.fromTag}->${craft.params.toTag}`).sort(),
    ['cold->fire', 'cold->lightning', 'fire->cold', 'fire->lightning', 'lightning->cold', 'lightning->fire']
  )
  assert.ok(equipmentCrafts.every((craft) => craft.cost.length >= 2 && craft.cost.some((cost) => cost.resourceId === 'resource:harvest:crystallised-rancour')))
  assert.equal(rancourCrafts.filter((craft) => craft.effectKind === 'gem_transform').length, 1)
})

test('掉落标签重铸保证掉落词缀而非普通属性词缀', () => {
  const base = dataset.bases.find((entry) => naturalPool(entry).some(({ modifier }) => modifier.tags.includes('drop')))
  assert.ok(base, '当前快照应至少有一种支持掉落标签的底材')
  const session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 328 })
  session.state.rarity = 'rare'
  const craft = listManualHarvestCrafts(dataset, session).items.find((entry) => entry.effectKind === 'reforge_tag' && entry.params.tag === 'drop')
  assert.equal(craft.canApply, true)
  const result = applyManualHarvestCraft(dataset, session, craft.id)
  assert.ok([...result.session.state.prefixes, ...result.session.state.suffixes].some((affix) => dataset.modifiers.find((modifier) => modifier.id === affix.modifierId)?.tags.includes('drop')))
  assert.equal(result.event.guaranteedTag, 'drop')
})

test('3.28 元素伤害转换替换同侧近似词缀并支持撤销重做', async () => {
  const base = dataset.bases.find((entry) => entry.id === 'base:32db338832c23209')
  const source = naturalPool(base).find(({ modifier, tier }) => modifier.id === 'goal:657eb7d67e3773cb' && tier.id === 'tier:4e6430cba06b6b6c')
  assert.ok(base && source, '快照中的拳钉应保留火焰点伤转换哨兵')
  const session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 328 })
  session.state.rarity = 'rare'
  const original = rolledAffix(source.modifier, source.tier, () => 0.5)
  session.state.prefixes.push(original)
  const craft = listManualHarvestCrafts(dataset, session).items.find((entry) => entry.effectKind === 'convert_damage' && entry.params.fromTag === 'fire' && entry.params.toTag === 'cold')
  assert.equal(craft.canApply, true)
  const converted = applyManualHarvestCraft(dataset, session, craft.id)
  assert.equal(converted.event.convertedFrom.modifierId, original.modifierId)
  assert.equal(converted.event.convertedTo.affixType, original.affixType)
  assert.ok(dataset.modifiers.find((modifier) => modifier.id === converted.event.convertedTo.modifierId)?.tags.includes('cold'))
  const { undoManualAction, redoManualAction } = await import('../electron/modules/crafting/manualCrafting.js')
  const undone = undoManualAction(dataset, converted.session)
  assert.deepEqual(undone.session.state, session.state)
  assert.deepEqual(redoManualAction(dataset, undone.session).session.state, converted.session.state)
})

test('真实快照完成保证标签、同类倾向和品质附魔流程', () => {
  const ring = dataset.bases.find((base) => base.itemClass === 'Ring' && naturalPool(base).some((entry) => entry.modifier.tags.includes('life')))
  let session = createManualSession(dataset, { baseId: ring.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 20260722 })
  session = applyManualCurrency(dataset, session, 'currency:alchemy').session
  const lifeCraft = harvestCrafts.find((craft) => craft.effectKind === 'reforge_tag' && craft.params.tag === 'life')
  session = applyManualHarvestCraft(dataset, session, lifeCraft.id).session
  assert.ok([...session.state.prefixes, ...session.state.suffixes].some((affix) => dataset.modifiers.find((modifier) => modifier.id === affix.modifierId)?.tags.includes('life')))
  const tendency = harvestCrafts.find((craft) => craft.effectKind === 'reforge_more_likely')
  const tended = applyManualHarvestCraft(dataset, session, tendency.id)
  assert.equal(tended.event.weightMultiplier, 10)

  const wand = dataset.bases.find((base) => base.itemClass === 'Wand' && naturalPool(base).length)
  const wandSession = createManualSession(dataset, { baseId: wand.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 42 })
  const enchant = listManualHarvestCrafts(dataset, wandSession).items.find((craft) => craft.effectKind === 'quality_enchant' && craft.canApply)
  const enchanted = applyManualHarvestCraft(dataset, wandSession, enchant.id)
  assert.equal(enchanted.session.state.qualityEffect, enchant.params.qualityEffect)
  assert.equal(enchanted.session.state.enchanted, true)
})

test('真实快照完成元素转换、移除添加及两种势力流程', () => {
  const base = dataset.bases.find((entry) => entry.itemClass === 'Ring' && naturalPool(entry).length)
  const pool = naturalPool(base)
  let conversionCase = null
  for (const candidate of pool) {
    const session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 77 })
    session.state.rarity = 'rare'
    const affix = rolledAffix(candidate.modifier, candidate.tier, () => 0.5)
    session.state[affix.affixType === 'prefix' ? 'prefixes' : 'suffixes'].push(affix)
    const craft = listManualHarvestCrafts(dataset, session).items.find((entry) => ['convert_resistance', 'convert_damage'].includes(entry.effectKind) && entry.canApply)
    if (craft) { conversionCase = { session, craft }; break }
  }
  assert.ok(conversionCase, '真实戒指词缀池应存在可转换元素词缀')
  const converted = applyManualHarvestCraft(dataset, conversionCase.session, conversionCase.craft.id)
  assert.ok(converted.event.convertedFrom && converted.event.convertedTo)

  const augmentCraft = listManualHarvestCrafts(dataset, converted.session).items.find((craft) => craft.effectKind === 'remove_add_tag' && craft.canApply)
  assert.ok(augmentCraft, '转换后的真实装备应存在可执行的移除并添加工艺')
  const augmented = applyManualHarvestCraft(dataset, converted.session, augmentCraft.id)
  assert.ok(augmented.event.removedModifier && augmented.event.addedModifier)

  const shaperVariant = { kind: 'influenced', influences: ['shaper'], fracturedTierId: null, implicits: [] }
  const influencedBase = dataset.bases.find((entry) => entry.allowedVariants.includes('influenced') && eligibleModifierTiers(dataset, entry, 100, shaperVariant, { rarity: 'rare', prefixes: [], suffixes: [], influences: ['shaper'], meta: {} }, { sources: ['natural', 'shaper'] }).some((candidate) => candidate.modifier.influences.includes('shaper')))
  let influenced = createManualSession(dataset, { baseId: influencedBase.id, itemLevel: 100, variant: { kind: 'influenced', influences: ['shaper'] }, seed: 99 })
  influenced.state.rarity = 'rare'
  const influenceCraft = listManualHarvestCrafts(dataset, influenced).items.find((craft) => craft.effectKind === 'reforge_influence')
  assert.equal(influenceCraft.canApply, true)
  influenced = applyManualHarvestCraft(dataset, influenced, influenceCraft.id).session
  const randomize = listManualHarvestCrafts(dataset, influenced).items.find((craft) => craft.effectKind === 'randomize_influence')
  const randomized = applyManualHarvestCraft(dataset, influenced, randomize.id)
  assert.notDeepEqual(randomized.session.state.influences, ['shaper'])
  assert.deepEqual(randomized.session.variant.influences, randomized.session.state.influences)
})
})()

// === Merged from heistAffixSuggestions.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const readFileSync = _m9_readFileSync
  const HEIST_AFFIX_CATALOG_META = _m9_HEIST_AFFIX_CATALOG_META
  const HEIST_AFFIX_SUGGESTIONS = _m9_HEIST_AFFIX_SUGGESTIONS
  const affixSuggestionsForKind = _m9_affixSuggestionsForKind
  const searchMapAffixSuggestions = _m9_searchMapAffixSuggestions
  const parseHeistAffixes = _m9_parseHeistAffixes
  const SOURCE_URLS = _m9_SOURCE_URLS
  const parseItemInfo = _m9_parseItemInfo
  const matchMapRequirements = _m9_matchMapRequirements
  const createDefaultHeistConfig = _m9_createDefaultHeistConfig
test('契约蓝图快照来源完整且每个候选可命中全部数值档位', () => {
  assert.deepEqual(HEIST_AFFIX_CATALOG_META.sourceUrls, SOURCE_URLS)
  assert.equal(HEIST_AFFIX_SUGGESTIONS.length, 98)
  assert.equal(new Set(HEIST_AFFIX_SUGGESTIONS.map(entry => entry.value)).size, 98)
  for (const entry of HEIST_AFFIX_SUGGESTIONS) {
    assert.doesNotMatch(entry.value, /\d|[<>]|heist |map /)
    assert.ok(['prefix', 'suffix'].includes(entry.affixType))
    assert.ok(entry.example.includes(entry.value))
    assert.ok(entry.variants.every(line => line.includes(entry.value)))
  }
  const chain = searchMapAffixSuggestions('heist', '连锁弹射')[0]
  assert.equal(chain.variants.length, 2)
  assert.ok(chain.variants.every(line => line.includes(chain.value)))
})

test('契约搜索隔离，支持示例和标签，空输入和限额保持一致', () => {
  assert.equal(affixSuggestionsForKind('heist'), HEIST_AFFIX_SUGGESTIONS)
  assert.ok(searchMapAffixSuggestions('heist', '巡逻队').length > 0)
  assert.deepEqual(searchMapAffixSuggestions('atlas', '巡逻队'), [])
  assert.deepEqual(searchMapAffixSuggestions('chart', '巡逻队'), [])
  assert.deepEqual(searchMapAffixSuggestions('heist', '贤主会干涉玩家'), [])
  assert.ok(searchMapAffixSuggestions('heist', '警报').length > 0)
  assert.ok(searchMapAffixSuggestions('heist', '异常状态').length > 0)
  assert.ok(searchMapAffixSuggestions('heist', '附加 1 次').length > 0)
  assert.deepEqual(searchMapAffixSuggestions('heist', '   '), [])
  assert.deepEqual(searchMapAffixSuggestions('heist', '不存在的关键词'), [])
  assert.equal(searchMapAffixSuggestions('heist', '怪物', 2).length, 2)
  assert.ok(searchMapAffixSuggestions('heist', '怪物').length <= 50)
})

test('快照解析拆分多行，剔除隐藏统计、零权重和非前后缀', () => {
  const mod = { DropChance: 1000, ModGenerationTypeID: '1', str: '怪物伤害提高 10%<br>怪物生命总增 20%<br><span class="secondary">map item drop quantity +% [10]</span>', mod_no: ['<span>伤害</span>'] }
  const html = `new ModsView(${JSON.stringify({ opt: { ModDomainsID: 22 }, normal: [mod, { ...mod, DropChance: 0 }, { ...mod, ModGenerationTypeID: '3' }] })})`
  assert.deepEqual(parseHeistAffixes(html), [{ affixType: 'prefix', lines: ['怪物伤害提高 10%', '怪物生命总增 20%'], tags: ['伤害'] }])
  assert.throws(() => parseHeistAffixes('<html></html>'), /ModsView/)
})

test('联想选择值在真实蓝图文本上触发白名单和黑名单', () => {
  const text = readFileSync(new URL('./fixtures/heistBlueprintCn.txt', import.meta.url), 'utf8')
  for (const category of ['契约', '蓝图']) {
    const item = parseItemInfo(text.replace('物品类别: 蓝图', `物品类别: ${category}`))
    for (const query of ['连锁弹射', '腐化地面', '怪物生命总增', '稀有怪物的数量']) {
      const suggestion = searchMapAffixSuggestions('heist', query)[0]
      assert.ok(suggestion, query)
      const config = { ...createDefaultHeistConfig(), targetKind: 'heist' }
      config.match.whitelist = [suggestion.value]
      assert.equal(matchMapRequirements(item, config).isMatch, true, query)
      config.match.blacklist = [suggestion.value]
      assert.equal(matchMapRequirements(item, config).reason, 'blacklist', query)
    }
  }
})
})()

// === Merged from influenceCrafting.test.js ===
await (async () => {
  const test = _m10_test
  const assert = _m10_assert
  const readFile = _m10_readFile
  const path = _m10_path
  const rolledAffix = _m10_rolledAffix
  const applyManualInfluenceCraft = _m10_applyManualInfluenceCraft
  const configureManualAwakenerDonor = _m10_configureManualAwakenerDonor
  const createManualSession = _m10_createManualSession
  const createSeededRng = _m10_createSeededRng
  const listManualAwakenerDonorCandidates = _m10_listManualAwakenerDonorCandidates
  const listManualInfluenceCrafts = _m10_listManualInfluenceCrafts
  const redoManualAction = _m10_redoManualAction
  const resetManualSession = _m10_resetManualSession
  const undoManualAction = _m10_undoManualAction
  const dominanceCandidates = _m10_dominanceCandidates
  const normalizeCraftingDataset = _m10_normalizeCraftingDataset
  const modifierMatchesBase = _m10_modifierMatchesBase
const dataset = normalizeCraftingDataset(JSON.parse(await readFile(path.resolve('electron/assets/crafting-data/dataset.json'), 'utf8')))
const influences = ['shaper', 'elder', 'crusader', 'redeemer', 'hunter', 'warlord']
const helmet = dataset.bases.find((entry) => entry.itemClass === 'Helmet' && entry.allowedVariants.includes('normal'))

function matchingModifiers(influence) {
  const variant = { kind: 'influenced', influences: [influence] }
  return dataset.modifiers.filter((modifier) => modifier.influences.includes(influence) && modifierMatchesBase(modifier, helmet, variant))
}

function influencedSession(influence, seed = 1) {
  const session = createManualSession(dataset, { baseId: helmet.id, itemLevel: 100, variant: { kind: 'influenced', influences: [influence] }, seed })
  session.state.rarity = 'rare'
  return session
}

function addAffix(session, modifier, tier, seed = 10) {
  const affix = rolledAffix(modifier, tier, createSeededRng(seed), { source: modifier.influences[0] })
  session.state[modifier.affixType === 'prefix' ? 'prefixes' : 'suffixes'].push(affix)
  return affix
}

test('真实快照六势力内部标签均能匹配并执行势力崇高石', () => {
  for (const influence of influences) {
    const session = createManualSession(dataset, { baseId: helmet.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 20260722 })
    session.state.rarity = 'rare'
    const entry = listManualInfluenceCrafts(dataset, session).items.find((item) => item.influence === influence)
    assert.equal(entry.canApply, true, `${influence}: ${entry.unavailableReason}`)
    assert.ok(entry.candidateCount > 0, `${influence} 候选池为空`)
    const first = applyManualInfluenceCraft(dataset, session, entry.id)
    const repeated = applyManualInfluenceCraft(dataset, session, entry.id)
    assert.deepEqual(first.session.state, repeated.session.state)
    assert.deepEqual(first.session.state.influences, [influence])
    const added = [...first.session.state.prefixes, ...first.session.state.suffixes].find((affix) => affix.modifierId === first.event.addedInfluenceModifier.modifierId)
    assert.ok(dataset.modifiers.find((modifier) => modifier.id === added.modifierId).influences.includes(influence))
  }
})

test('势力崇高石拒绝非法状态并让元属性过滤候选', () => {
  const normal = createManualSession(dataset, { baseId: helmet.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 8 })
  assert.match(listManualInfluenceCrafts(dataset, normal).items[0].unavailableReason, /稀有/)
  normal.state.rarity = 'rare'
  normal.state.corrupted = true
  assert.match(listManualInfluenceCrafts(dataset, normal).items[0].unavailableReason, /腐化/)
  normal.state.corrupted = false
  normal.state.meta.cannotRollAttack = true
  const result = applyManualInfluenceCraft(dataset, normal, 'influence:shaper-exalted')
  const modifier = dataset.modifiers.find((entry) => entry.id === result.event.addedInfluenceModifier.modifierId)
  assert.equal(modifier.tags.includes('attack'), false)
})

test('统御宝珠移除一条势力词缀并升为尊崇 T1', () => {
  const session = influencedSession('shaper', 301)
  const candidates = matchingModifiers('shaper').filter((modifier) => modifier.tiers.some((tier) => tier.tier === 1 && tier.weight === 0) && modifier.tiers.some((tier) => tier.tier === 2 && tier.weight > 0))
  const first = candidates[0]
  const second = candidates.find((entry) => entry.groupId !== first.groupId)
  addAffix(session, first, first.tiers.find((tier) => tier.tier === 2), 1)
  addAffix(session, second, second.tiers.find((tier) => tier.tier === 2), 2)
  assert.equal(dominanceCandidates(dataset, session).length, 2)
  const result = applyManualInfluenceCraft(dataset, session, 'influence:orb-of-dominance')
  assert.equal([...result.session.state.prefixes, ...result.session.state.suffixes].length, 1)
  assert.equal(result.event.upgradedTo.weight, 0)
  assert.match(result.event.upgradedTo.tierName, /T1/)
  assert.ok(result.event.removedModifier)
})

test('统御宝珠重骰已有尊崇词缀并遵守前后缀保护', () => {
  const session = influencedSession('elder', 404)
  const elevated = matchingModifiers('elder').filter((modifier) => modifier.tiers.some((tier) => tier.tier === 1 && tier.weight === 0))
  const first = elevated[0]
  const second = elevated.find((entry) => entry.groupId !== first.groupId && entry.affixType === first.affixType)
  addAffix(session, first, first.tiers.find((tier) => tier.tier === 1), 3)
  addAffix(session, second, second.tiers.find((tier) => tier.tier === 1), 4)
  const result = applyManualInfluenceCraft(dataset, session, 'influence:orb-of-dominance')
  assert.equal(result.event.rerolledElevated, true)
  assert.match(result.event.upgradedTo.tierName, /T1/)

  const locked = structuredClone(session)
  locked.state.meta[first.affixType === 'prefix' ? 'prefixesLocked' : 'suffixesLocked'] = true
  const entry = listManualInfluenceCrafts(dataset, locked).items.find((item) => item.kind === 'dominance')
  assert.equal(entry.canApply, false)
  assert.match(entry.unavailableReason, /至少需要两条/)
})

test('觉醒者供体配置、合并、销毁及撤销重做保持完整双装备状态', () => {
  const receiver = influencedSession('shaper', 505)
  const receiverModifier = matchingModifiers('shaper').find((modifier) => modifier.tiers.some((tier) => tier.weight > 0))
  addAffix(receiver, receiverModifier, receiverModifier.tiers.find((tier) => tier.weight > 0), 5)
  receiver.state.meta.cannotRollAttack = true

  const options = listManualAwakenerDonorCandidates(dataset, receiver, { baseId: helmet.id, itemLevel: 100, influence: 'elder' })
  const selected = options.candidates.find((entry) => entry.weight > 0 && entry.modifierId !== receiverModifier.id)
  const configured = configureManualAwakenerDonor(dataset, receiver, {
    baseId: helmet.id, itemLevel: 100, influence: 'elder', modifierId: selected.modifierId, tierId: selected.tierId, seed: 606
  })
  assert.equal(configured.session.awakenerDonor.state.rarity, 'magic')
  assert.equal(listManualInfluenceCrafts(dataset, configured.session).items.find((item) => item.kind === 'awakener').canApply, true)

  const result = applyManualInfluenceCraft(dataset, configured.session, 'influence:awakeners-orb')
  assert.deepEqual(result.session.state.influences, ['shaper', 'elder'])
  assert.equal(result.session.state.rarity, 'rare')
  assert.equal(result.session.state.meta.cannotRollAttack, false)
  assert.equal(result.session.awakenerDonor, null)
  assert.equal(result.event.donorConsumed, true)
  assert.equal(result.event.inheritedModifiers.length, 2)
  assert.ok(result.event.inheritedModifiers.every(({ modifier }) => [...result.session.state.prefixes, ...result.session.state.suffixes].some((entry) => entry.modifierId === modifier.modifierId && entry.tierId === modifier.tierId)))

  const undone = undoManualAction(dataset, result.session)
  assert.deepEqual(undone.session.awakenerDonor, configured.session.awakenerDonor)
  assert.deepEqual(undone.session.state, configured.session.state)
  const redone = redoManualAction(dataset, undone.session)
  assert.equal(redone.session.awakenerDonor, null)
  assert.deepEqual(redone.session.state, result.session.state)
  assert.equal(resetManualSession(dataset, redone.session).session.awakenerDonor, null)
})

test('觉醒者之石在继承词缀 ModGroup 冲突时固定随机保留一条', () => {
  const shaper = matchingModifiers('shaper').find((modifier) => matchingModifiers('elder').some((entry) => entry.groupId === modifier.groupId))
  const elder = matchingModifiers('elder').find((modifier) => modifier.groupId === shaper.groupId)
  const receiver = influencedSession('shaper', 707)
  const donor = influencedSession('elder', 808)
  addAffix(receiver, shaper, shaper.tiers.find((tier) => tier.weight > 0) ?? shaper.tiers[0], 7)
  addAffix(donor, elder, elder.tiers.find((tier) => tier.weight > 0) ?? elder.tiers[0], 8)
  receiver.awakenerDonor = donor
  const first = applyManualInfluenceCraft(dataset, receiver, 'influence:awakeners-orb')
  const repeated = applyManualInfluenceCraft(dataset, receiver, 'influence:awakeners-orb')
  assert.deepEqual(first.session.state, repeated.session.state)
  assert.equal(first.event.inheritedModifiers.length, 1)
  assert.ok(first.event.discardedConflict)
})

test('觉醒者之石从双方多条势力词缀中按固定种子各选一条', () => {
  const receiver = influencedSession('shaper', 812)
  const donor = influencedSession('elder', 813)
  const shaperMods = matchingModifiers('shaper').filter((modifier) => modifier.tiers.some((tier) => tier.weight > 0))
  const elderMods = matchingModifiers('elder').filter((modifier) => modifier.tiers.some((tier) => tier.weight > 0))
  const shaperSecond = shaperMods.find((modifier) => modifier.groupId !== shaperMods[0].groupId)
  const elderSecond = elderMods.find((modifier) => modifier.groupId !== elderMods[0].groupId)
  for (const [index, modifier] of [shaperMods[0], shaperSecond].entries()) addAffix(receiver, modifier, modifier.tiers.find((tier) => tier.weight > 0), 20 + index)
  for (const [index, modifier] of [elderMods[0], elderSecond].entries()) addAffix(donor, modifier, modifier.tiers.find((tier) => tier.weight > 0), 30 + index)
  receiver.awakenerDonor = donor
  const first = applyManualInfluenceCraft(dataset, receiver, 'influence:awakeners-orb')
  const repeated = applyManualInfluenceCraft(dataset, receiver, 'influence:awakeners-orb')
  assert.deepEqual(first.event.inheritedModifiers, repeated.event.inheritedModifiers)
  assert.equal(first.event.inheritedModifiers.some((entry) => entry.influence === 'shaper'), true)
  assert.equal(first.event.inheritedModifiers.some((entry) => entry.influence === 'elder'), true)
})

test('觉醒者之石拒绝同势力、不同装备类型与缺少所属势力词缀', () => {
  const receiver = influencedSession('shaper', 909)
  const shaper = matchingModifiers('shaper').find((modifier) => modifier.tiers.some((tier) => tier.weight > 0))
  addAffix(receiver, shaper, shaper.tiers.find((tier) => tier.weight > 0), 9)
  receiver.awakenerDonor = influencedSession('shaper', 910)
  addAffix(receiver.awakenerDonor, shaper, shaper.tiers.find((tier) => tier.weight > 0), 10)
  let awakener = listManualInfluenceCrafts(dataset, receiver).items.find((item) => item.kind === 'awakener')
  assert.match(awakener.unavailableReason, /势力必须不同/)
  receiver.awakenerDonor = influencedSession('elder', 911)
  awakener = listManualInfluenceCrafts(dataset, receiver).items.find((item) => item.kind === 'awakener')
  assert.match(awakener.unavailableReason, /没有可继承/)
})
})()

// === Merged from internationalCraftingData.test.js ===
await (async () => {
  const test = _m11_test
  const assert = _m11_assert
  const mkdtemp = _m11_mkdtemp
  const mkdir = _m11_mkdir
  const readFile = _m11_readFile
  const writeFile = _m11_writeFile
  const rm = _m11_rm
  const path = _m11_path
  const os = _m11_os
  const CraftingDataRepository = _m11_CraftingDataRepository
  const getServer = _m11_getServer
  const generateInternationalCraftingData = _m11_generateInternationalCraftingData
  const parseBaseRequirements = _m11_parseBaseRequirements
  const parsePoedbBases = _m11_parsePoedbBases
  const inferCraftEffectKind = _m11_inferCraftEffectKind
test('国际服当前制作快照具有独立来源、英文底材词缀和完整古灵阶级', async () => {
  const repository = new CraftingDataRepository({ server: getServer('international') })
  const status = await repository.initialize()
  assert.equal(status.server, 'international')
  assert.equal(status.locale, 'en')
  assert.equal(status.patch, '3.30.0')
  assert.ok(status.sources.length >= 80)
  assert.ok(status.sources.every(source => source.url.startsWith('https://poedb.tw/us/') && /^[a-f0-9]{64}$/.test(source.sha256)))
  const dataset = repository.getDataset()
  const ironHat = dataset.bases.find(base => base.name === 'Iron Hat')
  assert.deepEqual(ironHat.requirements, { level: 1, strength: 9, dexterity: 0, intelligence: 0 })
  assert.ok(ironHat.tags.includes('str_armour'))
  assert.ok(dataset.bases.some(base => base.name === 'Divine Life Flask'))
  assert.ok(repository.searchAffixSuggestions({ query: 'maximum Life', limit: 5 }).total > 0)
  const clusterEnchant = repository.searchAffixSuggestions({ query: '召唤生物攻击和施法速度', limit: 20 }).items
    .find(item => item.effectPattern === 'Added Small Passive Skills also grant: Minions have #% increased Attack and Cast Speed')
  assert.ok(clusterEnchant, '大星团的召唤生物攻击和施法速度附魔应可联想')
  assert.equal(clusterEnchant.sourceLabel, '附魔')
  assert.equal(clusterEnchant.applicableLabel, '大型星团珠宝')
  assert.ok(dataset.crafts.some(craft => craft.effectKind === 'lock_prefixes_partial'))
  const partialLock = dataset.crafts.find(craft => craft.effectKind === 'lock_prefixes_partial')
  assert.ok(partialLock.itemClasses.includes('单手近战'))
  assert.ok(partialLock.itemClasses.includes('戒指'))
  const fullArmourLock = dataset.crafts.find(craft => craft.effectKind === 'lock_prefixes' && craft.itemClasses.includes('护甲'))
  assert.deepEqual(fullArmourLock.cost.map(cost => [cost.resourceName, cost.amount]), [['Divine Orb', 4], ['Blessed Orb', 4]])
  assert.ok(dataset.crafts.some(craft => craft.effectKind === 'reforge_tag' && craft.params.tag === 'life'))
  assert.ok(dataset.crafts.some(craft => craft.effectKind === 'reforge_tag' && craft.params.tag === 'defences'))
  assert.ok(dataset.crafts.every(craft => !['reforge_tag', 'remove_add_tag'].includes(craft.effectKind) || craft.params.tag))
  assert.ok(dataset.crafts.some(craft => craft.effectKind === 'convert_resistance' && craft.params.fromTag === 'cold' && craft.params.toTag === 'fire'))
  assert.ok(dataset.crafts.some(craft => craft.effectKind === 'quality_enchant' && craft.params.itemScope === 'melee_weapon'))
  assert.ok(dataset.eldritchImplicitFamilies.every(family => family.tiers.length === 6))
})

test('国际服活动数据若指向中文快照必须回退本服内置，不能串服', async t => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'international-crafting-'))
  t.after(() => rm(temporary, { recursive: true, force: true }))
  await mkdir(path.join(temporary, 'wrong-server'))
  const chinese = await readFile('electron/assets/crafting-data/dataset.json', 'utf8')
  await writeFile(path.join(temporary, 'wrong-server/dataset.json'), chinese)
  await writeFile(path.join(temporary, 'active.json'), JSON.stringify({ directory: 'wrong-server' }))
  const repository = new CraftingDataRepository({ server: getServer('international'), userDataRoot: temporary })
  const status = await repository.initialize()
  assert.equal(status.source, 'builtin')
  assert.equal(status.server, 'international')
  assert.match(status.warning, /服务器或语言/)
})

test('英文来源解析保留需求、属性和部分锁工艺语义', () => {
  assert.deepEqual(parseBaseRequirements('Requires Level 68, 89 Str, 76 Dex, 12 Int'), { level: 68, strength: 89, dexterity: 76, intelligence: 12 })
  const html = '<div class="card"><div class="card-header">Body Armours Item / 1</div><div class="col"><a class="whiteitem BodyArmour" href="/us/Example"><img src="image.webp"></a><a class="whiteitem">Example</a><span class="requirements">Requires Level 68, 100 Str</span><span class="property">Armour: 1200</span></div></div>'
  const [base] = parsePoedbBases(html)
  assert.equal(base.sourceId, 'Example')
  assert.equal(base.requiredLevel, 68)
  assert.ok(base.tags.includes('str_armour'))
  assert.equal(inferCraftEffectKind('1 Prefix Modifiers cannot be changed', 'bench'), 'lock_prefixes_partial')
  assert.equal(inferCraftEffectKind('Prefix Modifiers cannot be changed', 'bench'), 'lock_prefixes')
})

test('生成器拒绝无版本或国服输出，验证失败前不写活动数据', async () => {
  await assert.rejects(generateInternationalCraftingData(), /显式指定/)
  await assert.rejects(generateInternationalCraftingData({ patch: '3.30.0', output: path.resolve('electron/assets/crafting-data') }), /禁止覆盖国服/)
})

test('英文来源刷新失败保留已有活动文件', async t => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'international-crafting-refresh-'))
  t.after(() => rm(temporary, { recursive: true, force: true }))
  const output = path.join(temporary, 'international')
  await mkdir(output)
  const active = path.join(output, 'dataset.json')
  await writeFile(active, 'existing-active-dataset')
  await assert.rejects(generateInternationalCraftingData({
    patch: '3.30.0', refresh: true, output, cacheRoot: path.join(temporary, 'cache'),
    fetchImpl: async () => new Response('unavailable', { status: 503 })
  }), /HTTP 503/)
  assert.equal(await readFile(active, 'utf8'), 'existing-active-dataset')
})
})()

// === Merged from internationalCraftingEquivalence.test.js ===
await (async () => {
  const test = _m12_test
  const assert = _m12_assert
  const createHash = _m12_createHash
  const LocalizationRuntime = _m12_LocalizationRuntime
  const matchAffixes = _m12_matchAffixes
  const ItemFootprintRegistry = _m12_ItemFootprintRegistry
  const loadServerFootprintCatalog = _m12_loadServerFootprintCatalog
const entry = (en, cn, kind = 'dat') => ({ kind, table: kind === 'dat' ? 'baseitemtypes' : 'stat', id: en, field: 'Text', en, cn, tw: cn, sourceHash: createHash('sha256').update(en).digest('hex') })
const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => [entry('Coral Ring', '珊瑚戒指'), entry('{0:+d} to maximum Life', '{0:+d} 最大生命', 'stat')], revision: () => 'r1' })
const item = (body, header = '{ Prefix Modifier "Healthy" (Tier: 1) }') => `Item Class: Rings\nRarity: Rare\nDoom Circle\nCoral Ring\n--------\nItem Level: 84\n--------\n${header}\n${body}`
const matches = value => matchAffixes(value, [{ requiredAffixes: [{ kind: 'catalog', effectPattern: '+# to maximum Life', minTier: 1 }], selectedAffixes: [] }]).isMatch

test('中英混合详细数值的连字符和全角括号不影响实际数值、Tier及制作目录条件', () => {
  for (const dash of ['-', '–', '—']) for (const [open, close] of [['(', ')'], ['（', '）']]) for (const effect of ['to maximum Life', '最大生命']) {
    const text = item(`+89${open}80${dash}99${close} ${effect}`)
    const parsed = runtime.parseItem(text, 'r1')
    assert.equal(parsed.modifiers[0].text, '+89 to maximum Life', text)
    assert.equal(parsed.modifiers[0].tier, 1)
    assert.equal(parsed.originalText, text)
    assert.equal(matches(parsed), true, text)
  }
})

test('英文、汉化与混合文本的未知或冲突详细头都停止，不可绕过结构校验', () => {
  for (const effect of ['to maximum Life', '最大生命']) for (const header of ['{ UnknownOrigin Prefix Modifier "Healthy" (Tier: 1) }', '{ Prefix Modifier "Healthy" (Tier: 1, Tier: 2) }']) {
    assert.throws(() => runtime.parseItem(item(`+89 ${effect}`, header), 'r1'), error => error.code === 'LOCALIZATION_HEADER_UNRESOLVED')
  }
})

test('无汉化启动沿真实国际服已知物品目录下发精华身份，不需要候选词库', () => {
  const registry = new ItemFootprintRegistry(loadServerFootprintCatalog({ serverId: 'international' }))
  const names = Object.keys(registry.snapshot().items).map(key => key.split('\u001f')[1]).filter(Boolean)
  const snapshot = new LocalizationRuntime({ serverId: 'international', baseNames: () => names }).snapshot()
  assert.equal(snapshot.revision, '')
  assert.ok(snapshot.canonicalEssenceNames.some(name => name.toLowerCase() === 'deafening essence of greed'))
  assert.ok(snapshot.canonicalEssenceNames.length > 50)
  assert.deepEqual(snapshot.essenceNames, [])
  assert.equal(snapshot.canonicalEssenceNames.some(name => name.includes('DefinitelyNotAnEssence')), false)
})
})()

// === Merged from internationalModifierHeaders.test.js ===
await (async () => {
  const test = _m13_test
  const assert = _m13_assert
  const createHash = _m13_createHash
  const LocalizationRuntime = _m13_LocalizationRuntime
  const matchAffixes = _m13_matchAffixes
  const matchEldritchImplicits = _m13_matchEldritchImplicits
// Verbatim stable fields and source hashes from the signed 3.30.0b export.
const field = (id, en, cn, tw, sourceHash, kind = 'dat') => ({ table: kind === 'stat' ? 'metadata/statdescriptions/stat_descriptions.csd' : 'clientstrings', field: kind === 'stat' ? 'variant:0' : 'Text', kind, id, en, cn, tw, sourceHash })
const entries = [
  field('ModDescriptionLinePrefix', 'Prefix Modifier "{0}"', '前缀属性 "{0}"', '前綴 "{0}"', '956b41feb2c3ddb7a243688f1bd144885a110cd39c9c2cb0ea7e40e62677e8df'),
  field('ModDescriptionLineSuffix', 'Suffix Modifier "{0}"', '后缀属性 "{0}"', '後綴 "{0}"', '2591fa206faf19220fe9bbc53a1703529e22ab60fb614607ababbd5bc98245d3'),
  field('ModDescriptionLineTier', ' (Tier: {0})', ' (等阶：{0})', '(階層：{0})', 'cd26635271592d76cebe08b275097349a7fcdd94d7ee89c77da2f4711efdc5e3'),
  field('ModDescriptionLineTierLevel', ' (Tier: {0}, Lvl: {1})', ' （位阶：{0}，等级：{1}）', ' (階級: {0}, 等級: {1})', '82976c7378ff4147307eec64bbb4e9fa12ec71f177f25d65918a0ff9fbeddba8'),
  field('ModDescriptionLineLevel', ' (Lvl: {0})', ' （等级：{0}）', ' (等級: {0})', '517fdb3e14dc691f6ac0d76d347c8a4a75850fbf96703af1c0ebd5d5821bbddc'),
  field('ModDescriptionLineCrafted', 'Master Crafted {0}', '大师级 {0}', '已大師工藝 {0}', '01ba9446dfac48e45db5e69d85492969a43aaa9ae56372bb7d62712b7599680f'),
  field('ModDescriptionLineFractured', 'Fractured {0}', '破碎的 {0}', '已破裂 {0}', '48553f09dafff3b8cb94958145572757314877712c7b52c818b1d8e0fbbeaf62'),
  field('ModDescriptionLineCleansingFireImplicit', 'Searing Exarch Implicit Modifier ({0})', '焚界者基底词缀（{0}）', '灼烙總督固定詞綴 ({0})', '2b0ebb2f3673bfab8cf757602dedbedb8c08fa7c9ab5b5dd9e92e6f086db304a'),
  field('ModDescriptionLineGreatTangleImplicit', 'Eater of Worlds Implicit Modifier ({0})', '灭界者基底词缀（{0}）', '吞噬天地固定詞綴 ({0})', 'e570d3c068ddc9f438a746c33644fc02c1790341a53bf229aee1a19e5ac1a57c'),
  field('EldritchCurrencyTier1', 'Lesser', '次级', '低階', '3bd2e8b6d8d3cf97edba247acb3c6f871ecaf11090f26e739321be118351a9f0'),
  field('EldritchCurrencyTier2', 'Greater', '高级', '高階', '600422f0c79947a6241d8a822c989bbb083e120af412f3c5f8708e48139d4a19'),
  field('EldritchCurrencyTier3', 'Grand', '顶级', '宏偉', '464e1d466885e60e4958a764324fb65e37937dfa006e43d9ba5c01967ab09e3b'),
  field('EldritchCurrencyTier4', 'Exceptional', '卓越', '卓越', 'd8d5a6a2f9edeaac2cbbca230d82367b8d8537a26d439ccb577f5c706a6ac565'),
  field('EldritchCurrencyTier5', 'Exquisite', '精美的', '精緻', 'c65ab0e104f6e60563aced680dcf93739d3a50a747763a09a80105f5279af466'),
  field('EldritchCurrencyTier6', 'Perfect', '完美的', '完美', 'b7b5d051e8cb163147fc8923644983c239c890cb55800bb6031ad2fc155a8a75'),
  field('base_maximum_life', '{0:+d} to maximum Life', '{0:+d} 最大生命', '{0:+d} 最大生命', '1ce6941d397159fd1a49856855968b0c309dbed4dc2dad2d98a598a501cfb067', 'stat')
]
const byId = new Map(entries.map(entry => [entry.id, entry]))
const render = (id, locale, values = []) => byId.get(id)[locale].replaceAll('\\"', '"').replace(/\{(\d+)(?::[^}]+)?\}/g, (_, index) => values[Number(index)])
const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'modifier-headers-3.30.0b' })
const parse = (header, body = '+120 最大生命') => runtime.parseItem(`Item Class: Helmets\nRarity: Rare\nDoom Crown\nRoyal Burgonet\n--------\nItem Level: 86\n--------\n{ ${header} }\n${body}`, 'modifier-headers-3.30.0b')
const target = { kind: 'catalog', effectPattern: '+# to maximum Life', minTier: 1 }
const matches = item => matchAffixes(item, [{ requiredAffixes: [target], selectedAffixes: [] }]).isMatch

test('真实详细头保留原始源文hash，Tier不误读为物品需求等级', () => {
  for (const entry of entries) assert.equal(createHash('sha256').update(entry.en).digest('hex'), entry.sourceHash, entry.id)
  for (const locale of ['en', 'cn', 'tw']) for (const role of ['Prefix', 'Suffix']) for (const tier of [1, 2]) for (const detail of ['ModDescriptionLineTier', 'ModDescriptionLineTierLevel']) {
    const item = parse(render(`ModDescriptionLine${role}`, locale, ['Healthy']) + render(detail, locale, [tier, 80]))
    assert.equal(item.modifiers[0].tier, tier, `${locale}:${role}:${detail}`)
    assert.equal(item.modifiers[0].type, role.toLowerCase())
    assert.equal(matches(item), tier === 1)
    assert.deepEqual(item.explicitMods, ['+120 to maximum Life'])
  }
  for (const locale of ['en', 'cn', 'tw']) {
    const levelOnly = parse(render('ModDescriptionLinePrefix', locale, ['Healthy']) + render('ModDescriptionLineLevel', locale, [80]))
    assert.equal(levelOnly.modifiers[0].tier, 0)
    assert.equal(matches(levelOnly), false)
  }
})

test('EN/CN/TW及混合详细头保持工艺与破碎语义、位置和阶级，最终条件判断一致', () => {
  for (const locale of ['en', 'cn', 'tw']) for (const [wrapper, type] of [['ModDescriptionLineCrafted', 'crafted'], ['ModDescriptionLineFractured', 'fractured']]) for (const mixed of [false, true]) {
    const inner = render('ModDescriptionLinePrefix', mixed ? 'en' : locale, ['Healthy']) + render('ModDescriptionLineTierLevel', locale, [1, 80])
    const item = parse(render(wrapper, locale, [inner]), mixed ? '+120 to maximum Life' : '+120 最大生命')
    const modifier = item.modifiers[0]
    assert.equal(modifier.type, type, `${locale}:${type}:${mixed}`)
    assert.equal(modifier.affixType, 'prefix')
    assert.equal(modifier.tier, 1)
    assert.equal(matches(item), true)
    if (type === 'crafted') assert.deepEqual(item.craftedMods, ['+120 to maximum Life'])
    else assert.equal(item.isFractured, true)
  }
})

test('古灵两来源六级别的真实中文与繁体头转成同一规范隐式，不能退化为天然底材', () => {
  for (const locale of ['en', 'cn', 'tw']) for (const [id, source, canonical] of [
    ['ModDescriptionLineCleansingFireImplicit', 'searing-exarch', 'Searing Exarch'],
    ['ModDescriptionLineGreatTangleImplicit', 'eater-of-worlds', 'Eater of Worlds']
  ]) for (let tier = 1; tier <= 6; tier++) for (const mixed of [false, true]) {
    const grade = render(`EldritchCurrencyTier${tier}`, mixed ? 'en' : locale)
    const item = parse(render(id, locale, [grade]))
    assert.equal(item.modifiers[0].type, 'implicit', `${locale}:${id}:${tier}`)
    assert.equal(item.modifiers[0].sourceSubtype, source)
    assert.ok(item.canonicalText.includes(`${canonical} Implicit Modifier (${byId.get(`EldritchCurrencyTier${tier}`).en})`))
    assert.equal(matchEldritchImplicits(item, [{ effectPattern: '+# to maximum Life' }]).isMatch, true)
  }
})

test('结构归一不猜译引用词缀名与标签，未知来源、级别或冲突结构拒绝解析', () => {
  const name = '吞噬天地的完美階層: 99'
  const item = parse(render('ModDescriptionLinePrefix', 'tw', [name]) + render('ModDescriptionLineTier', 'tw', [1]) + ' — 生命, 灼烙總督')
  assert.equal(item.modifiers[0].name, name)
  assert.deepEqual(item.modifiers[0].tags, ['生命', '灼烙總督'])
  assert.equal(item.modifiers[0].tier, 1)
  assert.equal(item.modifiers[0].sourceSubtype, null)
  for (const header of [
    '未知来源 Prefix Modifier "Healthy" (Tier: 1)',
    'UnknownOrigin Prefix Modifier "Healthy" (Tier: 1)',
    '焚界者基底词缀（未知等级）',
    '灼烙總督固定詞綴 (UnknownGrade)',
    '吞噬天地固定詞綴 (Perfect) Searing Exarch Implicit Modifier',
    '前缀属性 "A" 后缀属性 "B" (等阶: 1)',
    '前綴 "Healthy" (階層: 1, Tier: 2)'
  ]) assert.throws(() => parse(header), error => error.code === 'LOCALIZATION_HEADER_UNRESOLVED', header)
})
})()
