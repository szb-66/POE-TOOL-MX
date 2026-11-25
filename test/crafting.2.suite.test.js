import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { LocalizationRuntime as _m0_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { buildCraftingAffixPayload as _m0_buildCraftingAffixPayload } from '../electron/modules/item/craftingAffixPayload.js'
import { matchAffixes as _m0_matchAffixes } from '../electron/modules/item/matcher.js'
import { userLifeFlask as _m0_userLifeFlask, equivalentEnglishLifeFlask as _m0_equivalentEnglishLifeFlask, equivalentTraditionalLifeFlask as _m0_equivalentTraditionalLifeFlask } from './fixtures/priceCheckFlask.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { CRAFTING_SCHEMA_VERSION as _m1_CRAFTING_SCHEMA_VERSION, normalizeBaseItem as _m1_normalizeBaseItem, normalizeCraftDefinition as _m1_normalizeCraftDefinition, normalizeCraftPlan as _m1_normalizeCraftPlan, normalizeCraftRequest as _m1_normalizeCraftRequest, normalizeCraftState as _m1_normalizeCraftState, normalizeCraftingDataset as _m1_normalizeCraftingDataset, normalizeCorruptedImplicitFamily as _m1_normalizeCorruptedImplicitFamily, normalizeDatasetManifest as _m1_normalizeDatasetManifest, normalizeEldritchImplicitFamily as _m1_normalizeEldritchImplicitFamily, normalizeModifierFamily as _m1_normalizeModifierFamily, normalizeModifierFamilyGroup as _m1_normalizeModifierFamilyGroup, normalizeModifierTier as _m1_normalizeModifierTier, normalizePriceRecord as _m1_normalizePriceRecord, stableCraftingId as _m1_stableCraftingId } from '../electron/modules/crafting/model.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { readFileSync as _m2_readFileSync } from 'node:fs'
import { LocalizationRuntime as _m2_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { readFile as _m3_readFile } from 'node:fs/promises'
import { appendCraftingOperation as _m3_appendCraftingOperation, createCraftingOperationState as _m3_createCraftingOperationState, visibleCraftingOperations as _m3_visibleCraftingOperations } from '../src/domains/overlay/craftingOperationLog.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { readFileSync as _m4_readFileSync } from 'node:fs'
import _m4_vm from 'node:vm'
import { EventEmitter as _m4_EventEmitter } from 'node:events'
import { computed as _m4_computed, ref as _m4_ref, watch as _m4_watch, effectScope as _m4_effectScope, nextTick as _m4_nextTick } from 'vue'
import { parse as _m4_parse } from '@vue/compiler-sfc'
import { createOverlayOutsideClickCloser as _m4_createOverlayOutsideClickCloser } from '../electron/modules/window/overlayOutsideClickClose.js'
import * as _m4_operationLog from '../src/domains/overlay/craftingOperationLog.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { EventEmitter as _m5_EventEmitter } from 'node:events'
import { readFileSync as _m5_readFileSync } from 'node:fs'
import { prepareCraftingOverlay as _m5_prepareCraftingOverlay } from '../electron/modules/window/craftingOverlayLifecycle.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { parseItemInfo as _m6_parseItemInfo } from '../electron/modules/item/parser.js'
import { buildCraftingAffixPayload as _m6_buildCraftingAffixPayload } from '../electron/modules/item/craftingAffixPayload.js'
import { craftingModifierAffixType as _m6_craftingModifierAffixType, craftingModifierTierLabel as _m6_craftingModifierTierLabel, craftingPanelModifiers as _m6_craftingPanelModifiers } from '../src/domains/overlay/craftingPanelModifiers.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import _m7_fs from 'node:fs'
import { getCraftingOverlayBounds as _m7_getCraftingOverlayBounds } from '../electron/modules/window/craftingOverlayPosition.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { readFileSync as _m8_readFileSync } from 'node:fs'
import { fileURLToPath as _m8_fileURLToPath } from 'node:url'
import _m8_path from 'node:path'
import { createCoreCurrencyCrafts as _m8_createCoreCurrencyCrafts, extractModsViewPayload as _m8_extractModsViewPayload, familySummary as _m8_familySummary, finalizePoedbBases as _m8_finalizePoedbBases, groupModifierFamilies as _m8_groupModifierFamilies, inferCraftEffectKind as _m8_inferCraftEffectKind, mergeModifierGoals as _m8_mergeModifierGoals, modifierEffectKey as _m8_modifierEffectKey, parseEssenceSource as _m8_parseEssenceSource, parseBaseRequirements as _m8_parseBaseRequirements, parsePoedbBases as _m8_parsePoedbBases, parsePoedbCrafts as _m8_parsePoedbCrafts, parsePoedbCorruptedImplicits as _m8_parsePoedbCorruptedImplicits, parsePoedbEldritchImplicits as _m8_parsePoedbEldritchImplicits, parsePoedbModifiers as _m8_parsePoedbModifiers } from '../electron/modules/crafting/poedbParser.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { createHash as _m9_createHash } from 'node:crypto'
import { parseItemInfo as _m9_parseItemInfo } from '../electron/modules/item/parser.js'
import { parseItemInfo as _m9_parseFrontendItem } from '../src/utils/clipboard.js'
import { matchAffixes as _m9_matchAffixes, matchMapRequirements as _m9_matchMapRequirements } from '../electron/modules/item/matcher.js'
import { LocalizationRuntime as _m9_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { normalizeItemTextLanguage as _m9_normalizeItemTextLanguage } from '../shared/itemTextLanguage.js'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import { mkdtemp as _m10_mkdtemp } from 'node:fs/promises'
import _m10_os from 'node:os'
import _m10_path from 'node:path'
import { CraftingPriceService as _m10_CraftingPriceService, convertPricesToChaos as _m10_convertPricesToChaos, estimateResources as _m10_estimateResources, filterCraftingPrices as _m10_filterCraftingPrices, normalizeSummaryPrices as _m10_normalizeSummaryPrices, priceHealth as _m10_priceHealth } from '../electron/modules/crafting/priceService.js'
import _m11_test from 'node:test'
import _m11_assert from 'node:assert/strict'
import { mkdtemp as _m11_mkdtemp, readFile as _m11_readFile, rm as _m11_rm } from 'node:fs/promises'
import _m11_os from 'node:os'
import _m11_path from 'node:path'
import { loadRawSnapshot as _m11_loadRawSnapshot, readRawManifest as _m11_readRawManifest, snapshotPatchRoot as _m11_snapshotPatchRoot, synchronizeRawSnapshot as _m11_synchronizeRawSnapshot } from '../scripts/craftingRawSnapshot.js'
import _m12_test from 'node:test'
import _m12_assert from 'node:assert/strict'
import { readFileSync as _m12_readFileSync } from 'node:fs'
import { validateMapRecovery as _m12_validateMapRecovery } from '../src/utils/craftingRecovery.js'
import _m13_test from 'node:test'
import _m13_assert from 'node:assert/strict'
import { EventEmitter as _m13_EventEmitter } from 'node:events'
import { readFileSync as _m13_readFileSync } from 'node:fs'
import { resolveCraftingPython as _m13_resolveCraftingPython, startPythonProcess as _m13_startPythonProcess } from '../electron/modules/python/launcher.js'
import { waitForScriptStartup as _m13_waitForScriptStartup } from '../electron/modules/python/scriptEvents.js'
import { isSuccessfulScriptStart as _m13_isSuccessfulScriptStart } from '../src/utils/scriptStartResult.js'
import { dispatchShortcutAction as _m13_dispatchShortcutAction } from '../src/utils/shortcutConfig.js'

// === Merged from craftingLocalization.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const LocalizationRuntime = _m0_LocalizationRuntime
  const buildCraftingAffixPayload = _m0_buildCraftingAffixPayload
  const matchAffixes = _m0_matchAffixes
  const userLifeFlask = _m0_userLifeFlask
  const equivalentEnglishLifeFlask = _m0_equivalentEnglishLifeFlask
  const equivalentTraditionalLifeFlask = _m0_equivalentTraditionalLifeFlask
const read = file => readFileSync(new URL(`./fixtures/${file}`, import.meta.url), 'utf8')
// Signed current game rows plus the reported clipboard text, captured without running automation.
const entries = [...JSON.parse(read('price-check-flask-entries.json')), ...JSON.parse(read('crafting-diamond-flask-entries.json'))]
const runtime = () => new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'fixture' })

test('截图中的丰富的宝钻药剂不因词缀名称歧义停机，效果、阶级及中文显示保留', () => {
  const item = runtime().parseItem(read('crafting-diamond-flask.txt'), 'fixture')
  assert.equal(item.baseName, 'Diamond Flask')
  assert.equal(item.displayName, '丰富的僵固之宝钻药剂')
  assert.equal(item.displayBaseName, '宝钻药剂')
  assert.equal(item.modifiers[0].name, '丰富的')
  assert.equal(item.modifiers[0].text, '+23 to Maximum Charges')
  assert.equal(item.modifiers[0].displayText, '最大充能 +23(20-23)')
  assert.equal(item.modifiers[1].displayText, '生效期间，格挡及晕眩回复提高 54(51-56)%')
  assert.equal(item.modifiers[0].tier, 4)
  assert.equal(matchAffixes(item, [{ requiredAffixes: [{ kind: 'catalog', effectPattern: '+# to Maximum Charges', minTier: 4 }], selectedAffixes: [] }]).isMatch, true)
  assert.equal(matchAffixes(item, [{ requiredAffixes: [{ kind: 'catalog', effectPattern: '最大充能 +#', minTier: 4 }], selectedAffixes: [] }]).isMatch, true)
  assert.equal(matchAffixes(item, [{ requiredAffixes: ['of the Bounty'], selectedAffixes: [] }]).isMatch, false)
  const payload = buildCraftingAffixPayload(item)
  assert.equal(payload.displayName, item.displayName)
  assert.equal(payload.displayBaseName, item.displayBaseName)
  assert.deepEqual(payload.displayExplicitMods, ['最大充能 +23(20-23)', '生效期间，格挡及晕眩回复提高 54(51-56)%'])
})

test('英简繁药剂显示复制原文与完整范围，规范英文效果和多行阶级匹配一致', () => {
  for (const [source, name, base, effect] of [
    [userLifeFlask, '丰富的封闭之不朽生命药剂', '不朽生命药剂', '最大充能 +22(20-23)'],
    [equivalentTraditionalLifeFlask, '豐產的密封之不朽生命藥劑', '不朽生命藥劑', '+22(20-23) 最大充能'],
    [equivalentEnglishLifeFlask, 'Plentiful Divine Life Flask of Sealing', 'Divine Life Flask', '+22(20-23) to Maximum Charges']
  ]) {
    const item = runtime().parseItem(source, 'fixture')
    assert.equal(item.baseName, 'Divine Life Flask')
    assert.equal(item.displayName, name)
    assert.equal(item.displayBaseName, base)
    assert.equal(item.modifiers[0].displayText, effect)
    assert.equal(item.modifiers[1].displayText.split('\n').length, 2)
    assert.equal(item.modifiers[1].text.includes('(6-8)'), false)
    assert.equal(item.modifiers[1].displayText.includes('7(6-8)'), true)
    assert.equal(matchAffixes(item, [{ requiredAffixes: [{ kind: 'catalog', effectPattern: '+# to Maximum Charges' }], selectedAffixes: [] }]).isMatch, true)
  }
})

test('名称容错不放行未知效果、歧义效果和过期词库', () => {
  const text = read('crafting-diamond-flask.txt')
  assert.throws(() => runtime().parseItem(text.replace('最大充能', '未知充能'), 'fixture'), /未匹配/)
  assert.throws(() => runtime().parseItem(text, 'old-fixture'), /汉化资源已更改/)
  const ambiguous = new LocalizationRuntime({ serverId: 'international', revision: () => 'fixture', entries: () => [...entries,
    { kind: 'stat', table: 'fixture', id: 'ambiguous', field: 'variant:0', en: '{0:+d} to Other Charges', cn: '最大充能 {0:+d}' }]
  })
  assert.throws(() => ambiguous.parseItem(text, 'fixture'), error => error.code === 'LOCALIZATION_AMBIGUOUS')
})

test('真实九头蛇之宝钻药剂不把已知后缀内部的尸体名称当作底材', () => {
  const actualEntries = [...entries, ...JSON.parse(read('crafting-hydra-flask-entries.json'))]
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => actualEntries, revision: () => 'fixture' })
  const item = runtime.parseItem(read('crafting-hydra-flask.txt'), 'fixture')
  assert.equal(item.baseName, 'Diamond Flask')
  assert.equal(item.displayName, '九头蛇之宝钻药剂')
  assert.equal(item.displayBaseName, '宝钻药剂')
  assert.equal(item.modifiers[0].tier, 1)
  assert.equal(item.modifiers[0].lines.length, 3)
  assert.match(item.modifiers[0].displayText, /持续时间总降 38\(39-35\)%/)
  assert.match(item.modifiers[0].displayText, /药剂持续期间免疫点燃/)
})
})()

// === Merged from craftingModel.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const CRAFTING_SCHEMA_VERSION = _m1_CRAFTING_SCHEMA_VERSION
  const normalizeBaseItem = _m1_normalizeBaseItem
  const normalizeCraftDefinition = _m1_normalizeCraftDefinition
  const normalizeCraftPlan = _m1_normalizeCraftPlan
  const normalizeCraftRequest = _m1_normalizeCraftRequest
  const normalizeCraftState = _m1_normalizeCraftState
  const normalizeCraftingDataset = _m1_normalizeCraftingDataset
  const normalizeCorruptedImplicitFamily = _m1_normalizeCorruptedImplicitFamily
  const normalizeDatasetManifest = _m1_normalizeDatasetManifest
  const normalizeEldritchImplicitFamily = _m1_normalizeEldritchImplicitFamily
  const normalizeModifierFamily = _m1_normalizeModifierFamily
  const normalizeModifierFamilyGroup = _m1_normalizeModifierFamilyGroup
  const normalizeModifierTier = _m1_normalizeModifierTier
  const normalizePriceRecord = _m1_normalizePriceRecord
  const stableCraftingId = _m1_stableCraftingId
const manifest = {
  schemaVersion: CRAFTING_SCHEMA_VERSION,
  game: 'poe1',
  locale: 'zh-CN',
  league: 'Mirage',
  patch: '3.28',
  generatedAt: '2026-07-21T00:00:00.000Z',
  checksum: 'test',
  sources: [{ id: 'items', url: 'https://poedb.tw/cn/Items' }]
}

const base = {
  id: 'base:ring', sourceId: 'Ring1', name: '珊瑚戒指', category: '首饰', itemClass: '戒指',
  imageId: 'ring', requiredLevel: 1, requirements: { level: 1, strength: 0, dexterity: 0, intelligence: 0 },
  qualityType: 'none', socketLimit: 0, baseStats: [], implicitModifiers: [{ id: 'implicit:life', label: '最大生命', kind: 'implicit', text: '+(20—30) 最大生命', values: [{ min: 20, max: 30 }], displayTags: [{ id: 'life', label: '生命' }] }],
  tags: ['ring'], maxAffixes: { prefix: 3, suffix: 3 },
  allowedVariants: ['normal', 'influenced', 'fractured', 'synthesized']
}

const modifier = {
  id: 'mod:life', sourceId: 'IncreasedLife', modifierProfileId: '戒指', groupId: 'IncreasedLife', name: '最大生命', affixType: 'prefix',
  source: 'natural', tags: ['生命'], spawnTags: ['ring'], influences: [],
  tiers: [{ id: 'mod:life:t1', tier: 1, name: 'T1', requiredLevel: 81, weight: 1000, text: '+(70—79) 最大生命', values: [{ min: 70, max: 79 }] }]
}

const craft = {
  id: 'craft:chaos', provider: 'currency', name: '混沌石', effectKind: 'reforge_rare', itemClasses: [],
  cost: [{ resourceId: 'currency:chaos', resourceName: '混沌石', amount: 1 }], params: {}
}
const modifierFamily = { id: 'family:life', modifierProfileId: '戒指', groupId: 'IncreasedLife', name: '最大生命', affixType: 'prefix', source: 'natural', influences: [], entries: [modifier] }
const eldritchFamily = {
  id: 'eldritch:exarch:test', source: 'exarch', effectKey: 'test #', name: '测试古灵隐式', itemClasses: ['Gloves'], tags: ['speed'],
  tiers: Array.from({ length: 6 }, (_, index) => ({ id: `eldritch:exarch:test:t${index + 1}`, tier: index + 1, requiredLevel: 1, text: `效果 ${index + 1}`, weights: { Gloves: 1000 } }))
}
const corruptedImplicitFamily = {
  id: 'corrupted:life', source: 'vaal', effectKey: '+# 最大生命', name: '最大生命', itemClasses: ['Ring'], tags: ['life'],
  tiers: [{ id: 'corrupted:life:t1', tier: 1, requiredLevel: 1, text: '+(10—20) 最大生命', values: [{ min: 10, max: 20 }], weights: { Ring: 1000 } }]
}

test('做装数据模型规范化所有公开结构', () => {
  assert.equal(normalizeDatasetManifest(manifest).league, 'Mirage')
  assert.equal(normalizeBaseItem(base).name, '珊瑚戒指')
  assert.equal(normalizeBaseItem(base).implicitModifiers[0].values[0].max, 30)
  assert.deepEqual(normalizeBaseItem(base).implicitModifiers[0].displayTags, [{ id: 'life', label: '生命' }])
  assert.equal(normalizeModifierTier(modifier.tiers[0]).weight, 1000)
  assert.equal(normalizeModifierFamily(modifier).affixType, 'prefix')
  assert.equal(normalizeModifierFamilyGroup(modifierFamily).entries[0].goalId, modifier.id)
  assert.equal(normalizeCraftDefinition(craft).provider, 'currency')
  assert.equal(normalizeEldritchImplicitFamily(eldritchFamily).tiers.length, 6)
  assert.equal(normalizeCorruptedImplicitFamily(corruptedImplicitFamily).tiers[0].weights.Ring, 1000)
  assert.equal(normalizePriceRecord({ resourceId: 'currency:chaos', item_name: '混沌石', sell_avg: 1, currency_unit: 'c', latest_datetime: '2026-07-21 10:00:00' }).sellAverage, 1)
  assert.equal(normalizeCraftRequest({ baseId: base.id, itemLevel: 84, variant: { kind: 'normal' }, targets: [{ goalId: modifier.id, minTierId: modifier.tiers[0].id }] }).targets.length, 1)
  assert.equal(normalizeCraftState({ rarity: 'rare' }).rarity, 'rare')
  assert.equal(normalizeCraftState({ rarity: 'rare', split: true }).split, true)
  assert.equal(normalizeCraftState({ rarity: 'rare', mirrored: true }).mirrored, true)
  assert.equal(normalizeCraftState({ rarity: 'rare', enchanted: true }).enchanted, true)
  assert.equal(normalizeCraftState({ rarity: 'rare', qualityEffect: '品质每 2% 增加 1% 元素伤害' }).qualityEffect, '品质每 2% 增加 1% 元素伤害')
  assert.equal(normalizeCraftState({ rarity: 'rare', qualityEffect: '品质每 2% 增加 1% 元素伤害' }).enchanted, true)
  assert.deepEqual(normalizeCraftState({ rarity: 'rare' }).catalystQuality, { type: null, amount: 0 })
  assert.deepEqual(normalizeCraftState({ rarity: 'rare', catalystQuality: { type: 'life-mana', amount: 20 } }).catalystQuality, { type: 'life-mana', amount: 20 })
  assert.deepEqual(normalizeCraftState({ rarity: 'rare' }).eldritchImplicits, { exarch: null, eater: null })
  assert.equal(normalizeCraftState({ rarity: 'rare', eldritchImplicits: { exarch: { familyId: eldritchFamily.id, tierId: eldritchFamily.tiers[0].id, tier: 1, text: '效果 1' } } }).eldritchImplicits.exarch.source, 'exarch')
  assert.equal(normalizeCraftPlan({ id: 'plan', name: '混沌重洗', phase: 'quick', expectedChaos: 10, successProbability: 0.1, expectedAttempts: 10, p50Chaos: 7, p90Chaos: 22, confidence95: { low: 0.09, high: 0.11 }, datasetVersion: '3.28' }).scopeNotice, '在当前支持的工艺与策略中最优')
})

test('完整数据集校验图片引用和重复 ID', () => {
  const valid = normalizeCraftingDataset({ manifest, bases: [base], modifierFamilies: [modifierFamily], crafts: [craft], eldritchImplicitFamilies: [eldritchFamily], corruptedImplicitFamilies: [corruptedImplicitFamily], images: { ring: 'images/ring.png' } })
  assert.equal(valid.bases.length, 1)
  assert.equal(valid.modifierFamilies.length, 1)
  assert.equal(valid.eldritchImplicitFamilies.length, 1)
  assert.equal(valid.corruptedImplicitFamilies.length, 1)
  assert.throws(() => normalizeCraftingDataset({ manifest, bases: [{ ...base, imageId: 'missing' }], modifierFamilies: [modifierFamily], crafts: [craft], images: {} }), /图片 missing 不存在/)
  assert.throws(() => normalizeCraftingDataset({ manifest, bases: [base, base], modifierFamilies: [modifierFamily], crafts: [craft], images: { ring: 'images/ring.png' } }), /重复 ID/)
})

test('无效枚举和空目标被拒绝，稳定 ID 可复现', () => {
  assert.throws(() => normalizeCraftRequest({ baseId: base.id, itemLevel: 84, targets: [] }), /至少需要一个目标词缀/)
  assert.throws(() => normalizeModifierFamily({ ...modifier, affixType: 'implicit' }), /prefix 或 suffix/)
  assert.equal(stableCraftingId('base', 'Ring1'), stableCraftingId('base', 'Ring1'))
  assert.notEqual(stableCraftingId('base', 'Ring1'), stableCraftingId('base', 'Ring2'))
  assert.throws(() => normalizeCraftingDataset({ manifest: { ...manifest, schemaVersion: 2 }, bases: [base], modifierFamilies: [modifierFamily], crafts: [craft], images: { ring: 'images/ring.png' } }), /不支持的 schema 2/)
  assert.throws(() => normalizeBaseItem({ ...base, requirements: undefined }), /requirements/)
  assert.throws(() => normalizeBaseItem({ ...base, socketLimit: undefined }), /socketLimit/)
  assert.throws(() => normalizeBaseItem({ ...base, requiredLevel: 2 }), /requirements.level/)
  assert.throws(() => normalizeCraftState({ rarity: 'rare', catalystQuality: { type: 'unknown', amount: 1 } }), /未知催化剂品质/)
})
})()

// === Merged from craftingNameCollisions.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const readFileSync = _m2_readFileSync
  const LocalizationRuntime = _m2_LocalizationRuntime
const entries = JSON.parse(readFileSync(new URL('./fixtures/crafting-name-collision-entries.json', import.meta.url)))
const runtime = () => new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'signed-fixture' })
const item = (name, affixes = []) => `Item Class: Daggers\nRarity: Magic\n${name}\n--------\nItem Level: 84\n--------\n${affixes.map(name => `{ ${name.startsWith('of ') ? 'Suffix' : 'Prefix'} Modifier "${name}" (Tier: 1) }\n+10 to maximum Life`).join('\n')}`

test('英文魔法词缀与其他底材同名时保留真实底材，不能全局取最长名称', () => {
  for (const [name, affixes] of [
    ["Warlord's Skean", ["Warlord's"]],
    ['Skean of Frostbite', ['of Frostbite']],
    ['Skean of Precision', ['of Precision']],
    ['Skean of Despair', ['of Despair']],
    ["Warlord's Skean of Frostbite", ["Warlord's", 'of Frostbite']]
  ]) {
    const parsed = runtime().parseItem(item(name, affixes), 'signed-fixture')
    assert.equal(parsed.baseName, 'Skean', name)
    assert.equal(parsed.displayName, name)
  }
})

test('独立多个英文底材保持歧义，不得以最长名称悄悄选错', () => {
  for (const name of ['Skean and Warlord', 'Skean and Precision', 'Skean of Frostbite']) {
    assert.throws(() => runtime().parseItem(item(name), 'signed-fixture'), error => error.code === 'LOCALIZATION_AMBIGUOUS', name)
  }
})

test('魔法物品有独立底材行时，不再从该行剥离同名词缀', () => {
  for (const [base, affix] of [['Cerulean Ring', 'Cerulean'], ['Honed Cleaver', 'Honed']]) {
    const source = item(`${affix} ${base}`, [affix]).replace(`${affix} ${base}\n--------`, `${affix} ${base}\n${base}\n--------`)
    assert.equal(runtime().parseItem(source, 'signed-fixture').baseName, base)
  }
})
})()

// === Merged from craftingOperationLog.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const readFile = _m3_readFile
  const appendCraftingOperation = _m3_appendCraftingOperation
  const createCraftingOperationState = _m3_createCraftingOperationState
  const visibleCraftingOperations = _m3_visibleCraftingOperations
const operation = (index, mode = 'items', sessionId = 'session-1') => ({
  event: 'crafting-operation',
  mode,
  sessionId,
  timestamp: 1_700_000_000_000 + index,
  phase: 'input',
  action: `action-${index}`,
  outcome: index % 2 ? 'success' : 'started',
  code: '',
  summary: `步骤 ${index}`
})

test('制作和地图操作日志分别保留最近100条并拒绝旧会话迟到事件', () => {
  let state = createCraftingOperationState()
  state = appendCraftingOperation(state, { ...operation(0), phase: 'session', action: 'start' })
  for (let index = 1; index <= 105; index += 1) state = appendCraftingOperation(state, operation(index))
  assert.equal(visibleCraftingOperations(state, 'items').length, 100)
  assert.equal(visibleCraftingOperations(state, 'items')[0].action, 'action-6')

  state = appendCraftingOperation(state, { ...operation(200, 'map', 'map-session'), phase: 'session', action: 'start' })
  state = appendCraftingOperation(state, operation(201, 'map', 'map-session'))
  assert.equal(visibleCraftingOperations(state, 'map').length, 2)
  assert.equal(visibleCraftingOperations(state, 'items').length, 100)

  state = appendCraftingOperation(state, operation(999, 'items', 'old-session'))
  assert.equal(visibleCraftingOperations(state, 'items').at(-1).action, 'action-105')
})

test('操作日志只接受安全规范字段且界面提供底部日志模块', async () => {
  let state = createCraftingOperationState()
  state = appendCraftingOperation(state, {
    ...operation(1),
    phase: 'session',
    action: 'start',
    clipboard: '完整物品文本',
    path: 'C:/private/file',
    token: 'secret'
  })
  assert.deepEqual(Object.keys(visibleCraftingOperations(state, 'items')[0]).sort(), [
    'action', 'code', 'mode', 'outcome', 'phase', 'sessionId', 'summary', 'timestamp'
  ])

  const [view, content] = await Promise.all([
    readFile(new URL('../src/domains/overlay/OverlayView.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/domains/overlay/components/OverlayContent.vue', import.meta.url), 'utf8')
  ])
  assert.match(view, /visibleCraftingOperations/)
  assert.match(content, /操作日志/)
  assert.match(content, /operation-log/)
})

test('操作日志默认收起且按需展开，新会话和重置会恢复收起状态', async () => {
  const [view, content] = await Promise.all([
    readFile(new URL('../src/domains/overlay/OverlayView.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/domains/overlay/components/OverlayContent.vue', import.meta.url), 'utf8')
  ])
  assert.match(view, /const operationLogExpanded = ref\(false\)/)
  assert.match(view, /:operation-log-expanded="operationLogExpanded"/)
  assert.match(view, /@toggle-operation-log="operationLogExpanded = !operationLogExpanded"/)
  assert.match(view, /function resetOverlayState[\s\S]*operationLogExpanded\.value = false/)
  assert.match(view, /event\.phase === 'session'[\s\S]*operationLogExpanded\.value = false/)
  assert.match(content, /v-if="operationLogExpanded"[\s\S]*class="operation-log-list"/)
  assert.match(content, /operationLogExpanded \? '收起' : '展开'/)
  assert.match(content, /\.overlay-content \{[\s\S]*padding-bottom: 38px/)
  assert.match(content, /\.operation-log-expanded \.overlay-content \{[\s\S]*padding-bottom: 170px/)
})

test('装备与地图脚本会产生同一会话下的操作日志事件', async () => {
  const [itemTemplate, mapTemplate] = await Promise.all([
    readFile(new URL('../src/assets/scripts/crafting_template.py', import.meta.url), 'utf8'),
    readFile(new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url), 'utf8')
  ])

  for (const template of [itemTemplate, mapTemplate]) {
    assert.match(template, /"event": "crafting-operation"/)
    assert.match(template, /emit_crafting_operation\("session", "start", "started"/)
    assert.match(template, /emit_crafting_operation\("input", currency_type, "started"/)
    assert.match(template, /emit_crafting_operation\([\s\S]*"input", currency, "dispatched"/)
    assert.match(template, /operation_logger\("confirmation", "read-current-item", "confirmed"/)
  }
})
})()

// === Merged from craftingOverlayCompletion.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const readFileSync = _m4_readFileSync
  const vm = _m4_vm
  const EventEmitter = _m4_EventEmitter
  const computed = _m4_computed
  const ref = _m4_ref
  const watch = _m4_watch
  const effectScope = _m4_effectScope
  const nextTick = _m4_nextTick
  const parse = _m4_parse
  const createOverlayOutsideClickCloser = _m4_createOverlayOutsideClickCloser
  const operationLog = _m4_operationLog
const source = readFileSync(new URL('../src/domains/overlay/OverlayView.vue', import.meta.url), 'utf8')
const body = parse(source).descriptor.scriptSetup.content.replace(/^import[\s\S]*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
const eventLine = (event, data = {}) => `EVENT ${JSON.stringify({ event, mode: 'items', ...data })}\n`

async function harness(t) {
  const scope = effectScope()
  const handlers = {}
  const children = []
  let mounted
  let closed = false
  let checkpoint = null
  const win = { isDestroyed: () => closed, getBounds: () => ({ x: 100, y: 100, width: 100, height: 100 }) }
  const closer = createOverlayOutsideClickCloser({
    onClose: () => { closed = true; closer.disarm() },
    pythonPath: 'fake', scriptPath: 'fake', getCursorPoint: () => ({ x: 0, y: 0 }),
    spawnImpl: () => {
      const child = new EventEmitter()
      child.stdout = new EventEmitter()
      child.kill = () => {}
      children.push(child)
      return child
    }
  })
  const api = {
    window: { armOverlayOutsideClickClose: () => closer.arm(win), disarmOverlayOutsideClickClose: closer.disarm },
    batchCrafting: { getRecovery: async () => ({ success: true, checkpoint }) },
    events: {
      onUpdateOverlay: callback => { handlers.update = callback },
      onScriptStopped: callback => { handlers.stop = callback },
      onPythonOutput: callback => { handlers.output = callback }
    }
  }
  const state = scope.run(() => vm.runInNewContext(`${body}\n;({isCompleted,isStopped,batchProgress,canResumeBatch,handleBatchResume})`, {
    computed, ref, watch, onMounted: callback => { mounted = callback },
    electronApi: api, useSettingsStore: () => ({ overlaySettings: {} }), usePresetStore: () => ({}),
    normalizeCurrencyUsage: value => value, isCorrectableConfigurationFailure: () => false,
    ...operationLog,
    retryAutomationWithLatestConfig: async () => { handlers.update({ reset: true }); return { success: true } },
    startCrafting: () => {}, startMapRolling: () => {}
  }))
  t.after(() => { scope.stop(); closer.disarm() })
  await mounted()
  return {
    state, closer, handlers,
    setCheckpoint: value => { checkpoint = value },
    closed: () => closed,
    click: () => children.at(-1)?.stdout.emit('data', '{"event":"click"}\n'),
    output: async data => { handlers.output({ type: 'stdout', data }); await nextTick() }
  }
}

test('首件和阶段完成后点击下一件不关闭浮窗，整批完成后才关闭', async t => {
  const h = await harness(t)
  await h.output('[开始] 制作流程\n' + eventLine('crafting-batch-item-started', { total: 2, completed: 0, remaining: 2 }))
  for (const message of ['[完成] 词缀制作完成！', '[完成] 插槽制作完成！', '[完成] 首次识别已满足词缀目标，未执行制作']) {
    await h.output(message + '\n')
    h.click()
    assert.equal(h.state.isCompleted.value, false)
    assert.equal(h.closer.isArmed(), false)
    assert.equal(h.closed(), false)
  }
  await h.output(eventLine('crafting-batch-item-completed', { total: 2, completed: 1, remaining: 1 }) + eventLine('crafting-batch-item-started', { total: 2, completed: 1, remaining: 1, currentItem: { id: 'second' } }))
  h.click()
  assert.equal(h.state.batchProgress.value.currentItem.id, 'second')
  assert.equal(h.closed(), false)
  await h.output(eventLine('crafting-batch-completed', { total: 2, completed: 2, remaining: 0 }))
  assert.equal(h.state.isCompleted.value, true)
  assert.equal(h.closer.isArmed(), true)
  h.click()
  assert.equal(h.closed(), true)
})

test('开始与完成同块按顺序处理，分块事件保留到完整行后解析', async t => {
  const h = await harness(t)
  const complete = eventLine('crafting-completed')
  await h.output('[开始] 制作流程\n' + complete.slice(0, 15))
  assert.equal(h.closer.isArmed(), false)
  await h.output(complete.slice(15, -1))
  assert.equal(h.closer.isArmed(), false)
  await h.output('\n')
  assert.equal(h.closer.isArmed(), true)
  h.handlers.update({ reset: true })
  await nextTick()
  assert.equal(h.closer.isArmed(), false)
  await h.output('[开始] 制作流程\n[完成] 词缀制作完成！\n' + complete)
  assert.equal(h.closer.isArmed(), true)
})

for (const termination of ['abnormal', 'manual', 'completed']) {
  test(`停止结果 ${termination} 不受单件匹配属性或缺失 mapStats 干扰`, async t => {
    const h = await harness(t)
    h.handlers.update({ name: '首件', affixMatch: true, socketMatch: true, eldritchImplicitMatch: true })
    await h.output(eventLine('crafting-completed'))
    await h.handlers.stop({ mode: 'items', termination })
    await nextTick()
    assert.equal(h.state.isCompleted.value, termination === 'completed')
    assert.equal(h.state.isStopped.value, termination !== 'completed')
    assert.equal(h.closer.isArmed(), termination === 'completed')
  })
}

test('物品停止消息携带空地图统计时，单件达标也不能覆盖异常终止', async t => {
  const h = await harness(t)
  h.handlers.update({ name: '首件', affixMatch: true, socketMatch: true, eldritchImplicitMatch: true })
  await h.handlers.stop({ mode: 'items', termination: 'abnormal', mapStats: null })
  await nextTick()
  assert.equal(h.state.isCompleted.value, false)
  assert.equal(h.state.isStopped.value, true)
  assert.equal(h.closer.isArmed(), false)
})

test('异常批次保留续作入口，续作重置后下一件完成不布防', async t => {
  const h = await harness(t)
  h.setCheckpoint({ recoverable: true, targets: [{ id: 'second' }], completedIds: ['first'], currentItemId: 'second' })
  await h.handlers.stop({ mode: 'items', termination: 'abnormal', mapStats: null })
  await nextTick()
  assert.equal(h.state.canResumeBatch.value, true)
  await h.state.handleBatchResume()
  await h.output('[开始] 制作流程\n[完成] 词缀制作完成！\n')
  assert.equal(h.state.isStopped.value, false)
  assert.equal(h.closer.isArmed(), false)
})

test('地图单张完成继续运行，地图整体结束仍布防', async t => {
  const h = await harness(t)
  h.handlers.update({ category: '地图', mapStats: { processedCount: 1 } })
  await h.output('[完成] 地图处理完成，移动到下一个格子\n')
  assert.equal(h.closer.isArmed(), false)
  await h.output('[完成] 地图洗练结束，共处理 2 张\n')
  await h.handlers.stop({ mode: 'map', mapStats: { processedCount: 2 } })
  await nextTick()
  assert.equal(h.state.isCompleted.value, true)
  assert.equal(h.closer.isArmed(), true)
})
})()

// === Merged from craftingOverlayLifecycle.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const EventEmitter = _m5_EventEmitter
  const readFileSync = _m5_readFileSync
  const prepareCraftingOverlay = _m5_prepareCraftingOverlay
class FakeWebContents extends EventEmitter {
  constructor({ loading = false, calls }) {
    super()
    this.loading = loading
    this.calls = calls
  }

  isLoadingMainFrame() {
    return this.loading
  }

  send(channel, payload) {
    this.calls.push(['send', channel, payload])
  }
}

class FakeOverlayWindow {
  constructor({ loading = false } = {}) {
    this.calls = []
    this.destroyed = false
    this.visible = false
    this.webContents = new FakeWebContents({ loading, calls: this.calls })
  }

  isDestroyed() {
    return this.destroyed
  }

  isVisible() {
    return this.visible
  }

  showInactive() {
    this.calls.push(['showInactive'])
    this.visible = true
  }
}

function overlayHarness(options = {}) {
  let current = null
  const created = []
  return {
    created,
    current: () => current,
    setCurrent: (window) => { current = window },
    manager: {
      createOverlayWindow() {
        current = new FakeOverlayWindow(options)
        created.push(current)
        return current
      }
    }
  }
}

test('制作浮窗收到本次状态后才显示且不抢游戏焦点', async () => {
  const harness = overlayHarness()
  const window = await prepareCraftingOverlay(harness.manager, harness.current, { usageSessionId: 'session-1' })

  assert.equal(window.isVisible(), true)
  assert.deepEqual(window.calls, [
    ['send', 'update-overlay', { reset: true, usageSessionId: 'session-1' }],
    ['showInactive']
  ])
})

test('制作浮窗关闭后再次启动会创建并显示新实例', async () => {
  const harness = overlayHarness()
  const first = await prepareCraftingOverlay(harness.manager, harness.current, {})
  first.destroyed = true

  const second = await prepareCraftingOverlay(harness.manager, harness.current, {})

  assert.notEqual(second, first)
  assert.equal(harness.created.length, 2)
  assert.equal(second.isVisible(), true)
})

test('再次启动会重新显示仍存在但被隐藏的制作浮窗', async () => {
  const harness = overlayHarness()
  const existing = new FakeOverlayWindow()
  harness.setCurrent(existing)

  const returned = await prepareCraftingOverlay(harness.manager, harness.current, {})

  assert.equal(returned, existing)
  assert.equal(existing.isVisible(), true)
  assert.equal(harness.created.length, 0)
})

test('新建制作浮窗等待页面加载后再发送状态并显示', async () => {
  const harness = overlayHarness({ loading: true })
  const preparing = prepareCraftingOverlay(harness.manager, harness.current, {})
  const window = harness.current()
  assert.deepEqual(window.calls, [])

  window.webContents.loading = false
  window.webContents.emit('did-finish-load')
  await preparing

  assert.deepEqual(window.calls.map(call => call[0]), ['send', 'showInactive'])
})

test('制作浮窗管理器拒绝复用销毁实例且旧关闭回调不污染新实例', () => {
  const manager = readFileSync(new URL('../electron/modules/window/manager.js', import.meta.url), 'utf8')

  assert.match(manager, /if \(overlayWindow && !overlayWindow\.isDestroyed\(\)\) return overlayWindow\s+overlayWindow = null/)
  assert.match(manager, /const craftingWindow = overlayWindow\s+if \(!craftingWindow\) return\s+overlayWindow = null[\s\S]*if \(!craftingWindow\.isDestroyed\(\)\) craftingWindow\.close\(\)/)
  assert.match(manager, /craftingWindow\.on\('closed', \(\) => \{\s+clearTimeout\(saveTimer\)\s+if \(overlayWindow !== craftingWindow\) return\s+overlayWindow = null\s+craftingOverlayDragPassthrough\.stop\(\)/)
})
})()

// === Merged from craftingOverlayModifiers.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const parseItemInfo = _m6_parseItemInfo
  const buildCraftingAffixPayload = _m6_buildCraftingAffixPayload
  const craftingModifierAffixType = _m6_craftingModifierAffixType
  const craftingModifierTierLabel = _m6_craftingModifierTierLabel
  const craftingPanelModifiers = _m6_craftingPanelModifiers
test('制造面板同时显示破碎词缀和可变词缀', () => {
  const parsed = parseItemInfo([
    '物品类别: 珠宝',
    '稀 有 度: 魔法',
    '劈砍的威胁之赤红珠宝',
    '赤红珠宝',
    '--------',
    '物品等级: 83',
    '--------',
    '{ 破碎的 ▲ 前缀词缀 "劈砍的" (等阶：1)— 攻击, 速度 }',
    '斧类攻击的攻击速度加快 6%',
    '{ ▽ 后缀词缀 "威胁之" (等阶：1)— 暴击 }',
    '全域暴击率提高 10%'
  ].join('\n'))
  const itemInfo = { ...parsed, ...buildCraftingAffixPayload(parsed) }

  const displayed = craftingPanelModifiers(itemInfo)

  assert.deepEqual(displayed.map((modifier) => modifier.type), ['fractured', 'suffix'])
  assert.equal(displayed[0].text, '斧类攻击的攻击速度加快 6%')
  assert.equal(craftingModifierAffixType(displayed[0]), 'prefix')
  assert.equal(craftingModifierTierLabel(displayed[0]), 'P1')
})

test('旧数据没有完整 modifiers 时继续显示 detailedMods', () => {
  const detailedMods = [{ type: 'prefix', tier: 2, text: '+70 最大生命' }]
  assert.deepEqual(craftingPanelModifiers({ detailedMods }), detailedMods)
})
})()

// === Merged from craftingOverlayPosition.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const fs = _m7_fs
  const getCraftingOverlayBounds = _m7_getCraftingOverlayBounds
function source(path) {
  return fs.readFileSync(new URL(path, import.meta.url), 'utf8')
}

const size = Object.freeze({ width: 300, height: 400 })
const displays = [
  {
    id: 1,
    primary: true,
    workArea: { x: 0, y: 0, width: 1920, height: 1040 }
  },
  {
    id: 2,
    primary: false,
    workArea: { x: -1280, y: -100, width: 1280, height: 1024 }
  }
]

test('制作悬浮窗恢复主屏和负坐标副屏内的有效位置并保持规范尺寸', () => {
  assert.deepEqual(getCraftingOverlayBounds({ x: 120, y: 80, width: 999, height: 999 }, displays, size), {
    x: 120,
    y: 80,
    ...size
  })
  assert.deepEqual(getCraftingOverlayBounds({ x: -1200, y: -80 }, displays, size), {
    x: -1200,
    y: -80,
    ...size
  })
})

test('制作悬浮窗忽略损坏位置并回退到主屏工作区右上角', () => {
  const expected = { x: 1600, y: 20, ...size }
  assert.deepEqual(getCraftingOverlayBounds(null, displays, size), expected)
  assert.deepEqual(getCraftingOverlayBounds({ x: 'invalid', y: 20 }, displays, size), expected)
  assert.deepEqual(getCraftingOverlayBounds({ x: 20, y: Number.NaN }, displays, size), expected)
})

test('制作悬浮窗在原显示器移除或保存位置不完整可见时回退', () => {
  const primaryOnly = [displays[0]]
  const expected = { x: 1600, y: 20, ...size }
  assert.deepEqual(getCraftingOverlayBounds({ x: -1200, y: -80 }, primaryOnly, size), expected)
  assert.deepEqual(getCraftingOverlayBounds({ x: 1800, y: 900 }, displays, size), expected)
})

test('制作悬浮窗缺少显示器信息时使用安全默认工作区', () => {
  assert.deepEqual(getCraftingOverlayBounds(undefined, [], size), {
    x: 1600,
    y: 20,
    ...size
  })
})

test('制作悬浮窗创建时恢复位置、移动后防抖保存并在关闭前刷新', () => {
  const manager = source('../electron/modules/window/manager.js')
  assert.match(manager, /getCraftingOverlayBounds\(\s*loadWindowState\(\)\.craftingOverlayBounds,\s*displays,\s*CRAFTING_OVERLAY_SIZE\s*\)/)
  assert.match(manager, /craftingWindow\.on\('move',[\s\S]*setTimeout\(savePosition, 250\)/)
  assert.match(manager, /craftingWindow\.on\('close', savePosition\)/)
  assert.match(manager, /saveWindowState\(\{ craftingOverlayBounds: \{ x, y \} \}\)/)
})

test('窗口状态保存继续合并已有字段且制作拖拽 IPC 契约保持不变', () => {
  const state = source('../electron/modules/window/state.js')
  const ipc = source('../electron/modules/ipc/window.js')
  assert.match(state, /const newState = \{ \.\.\.currentState, \.\.\.state \}/)
  assert.match(ipc, /ipcMain\.on\('crafting-overlay-move', \(event, point = \{\}\) => \{/)
  assert.match(ipc, /overlay\.webContents !== event\.sender/)
  assert.match(ipc, /window\.moveCraftingOverlayTo\(requested\)/)
})
})()

// === Merged from craftingParser.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const readFileSync = _m8_readFileSync
  const fileURLToPath = _m8_fileURLToPath
  const path = _m8_path
  const createCoreCurrencyCrafts = _m8_createCoreCurrencyCrafts
  const extractModsViewPayload = _m8_extractModsViewPayload
  const familySummary = _m8_familySummary
  const finalizePoedbBases = _m8_finalizePoedbBases
  const groupModifierFamilies = _m8_groupModifierFamilies
  const inferCraftEffectKind = _m8_inferCraftEffectKind
  const mergeModifierGoals = _m8_mergeModifierGoals
  const modifierEffectKey = _m8_modifierEffectKey
  const parseEssenceSource = _m8_parseEssenceSource
  const parseBaseRequirements = _m8_parseBaseRequirements
  const parsePoedbBases = _m8_parsePoedbBases
  const parsePoedbCrafts = _m8_parsePoedbCrafts
  const parsePoedbCorruptedImplicits = _m8_parsePoedbCorruptedImplicits
  const parsePoedbEldritchImplicits = _m8_parsePoedbEldritchImplicits
  const parsePoedbModifiers = _m8_parsePoedbModifiers
const dirname = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name) => readFileSync(path.join(dirname, 'fixtures', 'crafting', name), 'utf8')

test('解析底材、普通/势力词缀和阶级权重', () => {
  const bases = parsePoedbBases(fixture('items.html'), { category: '首饰与珠宝' })
  const modifiers = parsePoedbModifiers(fixture('modifiers.html'))
  assert.equal(bases[0].name, '珊瑚戒指')
  assert.equal(bases[0].implicitModifiers[0].values[0].max, 30)
  assert.equal(bases[1].allowedVariants.includes('influenced'), false)
  assert.deepEqual(bases[1].maxAffixes, { prefix: 2, suffix: 2 })
  assert.equal(modifiers[0].tiers[0].requiredLevel, 81)
  assert.equal(modifiers[0].tiers[0].values[0].max, 79)
  assert.deepEqual(modifiers[1].influences, ['shaper'])
})

test('瓦尔腐化隐式按效果、等级、装备类别和权重聚合', () => {
  const families = parsePoedbCorruptedImplicits(fixture('vaal.html'))
  assert.equal(families.length, 1)
  assert.deepEqual(families[0].itemClasses, ['Belt', 'Ring'])
  assert.equal(families[0].tiers.length, 2)
  assert.equal(families[0].tiers[0].requiredLevel, 75)
  assert.equal(families[0].tiers[0].weights.Ring, 500)
  assert.deepEqual(families[0].displayTags.map((tag) => tag.id), ['life'])
})

test('底材需求按标签解析并保留基础属性与固有词缀', () => {
  assert.deepEqual(parseBaseRequirements('需求 9 力量'), { level: 1, strength: 9, dexterity: 0, intelligence: 0 })
  assert.deepEqual(parseBaseRequirements('需求 等级 20, 30 力量, 30 智慧'), { level: 20, strength: 30, dexterity: 0, intelligence: 30 })
  const html = `<section class="card"><h5 class="card-header">头部 物品 /2</h5>
    <div class="col"><a class="whiteitem Helmet" href="Iron_Hat"><img src="helmet.webp"></a><a class="whiteitem Helmet" href="Iron_Hat">粗铁盔</a><div class="property">护甲: <span>9—13</span></div><div class="requirements">需求 <span>9</span> 力量</div></div>
    <div class="col"><a class="whiteitem Helmet" href="Hybrid_Helmet"><img src="hybrid.webp"></a><a class="whiteitem Helmet" href="Hybrid_Helmet">混合测试盔</a><div class="property">护甲: <span>40—50</span></div><div class="property">能量护盾: <span>12—16</span></div><div class="property">物理伤害: <span>6—12</span></div><div class="requirements">需求 等级 <span>20</span>, <span>30</span> 力量, <span>30</span> 智慧</div><div class="implicitMod">+(10—15)% 火焰抗性</div></div>
  </section>`
  const bases = parsePoedbBases(html, { category: '装备' })
  const iron = bases.find((entry) => entry.sourceId === 'Iron_Hat')
  const hybrid = bases.find((entry) => entry.sourceId === 'Hybrid_Helmet')
  assert.equal(iron.requiredLevel, 1)
  assert.deepEqual(iron.requirements, { level: 1, strength: 9, dexterity: 0, intelligence: 0 })
  assert.equal(iron.baseStats[0].values[0].max, 13)
  assert.deepEqual(hybrid.requirements, { level: 20, strength: 30, dexterity: 0, intelligence: 30 })
  assert.equal(hybrid.baseStats.length, 3)
  assert.deepEqual(hybrid.baseStats[2].values, [{ min: 6, max: 6 }, { min: 12, max: 12 }])
  assert.equal(hybrid.baseStats[2].text, '物理伤害: 6—12'.replace('6—12', '#—#'))
  assert.equal(hybrid.implicitModifiers[0].values[0].min, 10)
  assert.deepEqual(hybrid.implicitModifiers[0].displayTags.map((tag) => tag.id), ['resistance', 'elemental'])
  assert.equal(hybrid.qualityType, 'armour')
  assert.equal(hybrid.socketLimit, 4)
})

test('底材过滤 Royale、隔离召集法杖配置并区分合法同名项', () => {
  const makeBase = (sourceId, name, requiredLevel) => ({ id: `base:${sourceId}`, sourceId, name, category: '单手武器', itemClass: 'Wand', requiredLevel, tags: ['wand'], maxAffixes: { prefix: 3, suffix: 3 }, allowedVariants: ['normal'] })
  const bases = finalizePoedbBases([
    makeBase('Driftwood_Wand', '朽木法杖', 1),
    makeBase('Royale_Driftwood_Wand', '朽木法杖', 1),
    makeBase('Convening_Wand', '召集法杖', 50),
    makeBase('Convoking_Wand', '召集法杖', 72)
  ], [{ page: 'Convoking_Wand', sourceIds: ['Convoking_Wand'], categoryPath: ['特殊', '召集法杖'] }])
  assert.equal(bases.some((base) => base.sourceId.startsWith('Royale_')), false)
  assert.equal(bases.filter((base) => base.name === '朽木法杖').length, 1)
  const special = bases.find((base) => base.sourceId === 'Convoking_Wand')
  assert.deepEqual(special.categoryPath, ['特殊', '召集法杖'])
  assert.equal(special.modifierProfileId, 'Convoking_Wand')
  assert.notEqual(special.displayName, bases.find((base) => base.sourceId === 'Convening_Wand').displayName)
})

test('共享 Mod Family 保持父项并在内部区分效果、等级与权重', () => {
  const raw = parsePoedbModifiers(fixture('shared-family.html'), { profileId: 'Wands' })
  const crafts = parsePoedbCrafts(fixture('bench-linked.html'), { provider: 'bench' })
  const goals = mergeModifierGoals(raw, crafts)
  assert.equal(goals.length, 4)
  const families = groupModifierFamilies(goals)
  assert.equal(families.length, 1)
  assert.equal(families[0].entries.length, 4)
  assert.equal(families[0].entries.reduce((sum, entry) => sum + entry.tiers.length, 0), 5)
  assert.equal(families[0].name, '法术 / 火焰 / 冰霜 / 闪电伤害提高')
  const totalAt = (level) => families[0].entries.flatMap((entry) => entry.tiers).filter((tier) => tier.requiredLevel <= level).reduce((sum, tier) => sum + tier.weight, 0)
  assert.equal(totalAt(80), 1500)
  assert.equal(totalAt(84), 1576)
  assert.deepEqual(new Set(goals.map((goal) => goal.groupId)), new Set(['WeaponCasterDamagePrefix']))
  const spell = goals.find((goal) => goal.name.includes('法术伤害'))
  assert.equal(spell.tiers.length, 2)
  assert.equal(spell.tiers[0].weight, 40)
  assert.deepEqual(spell.tiers[0].displayTags.map((tag) => tag.label), ['伤害', '施法'])
  assert.equal(spell.craftedOptions[0].cost[0].amount, 4)
  assert.equal(spell.craftedOptions[0].unlock, '测试区域')
  assert.equal(mergeModifierGoals(raw, []).find((goal) => goal.name.includes('法术伤害')).craftedOptions.length, 0)
  assert.equal(modifierEffectKey('法术伤害提高 <b>(10—20)</b>%'), '法术伤害提高 #%')
  assert.equal(familySummary([{ name: '该装备附加 # - # 基础火焰伤害' }]), '附加基础火焰伤害')
})

test('解析工艺台、花园和核心通货语义', () => {
  const bench = parsePoedbCrafts(fixture('bench.html'), { provider: 'bench' })
  const harvest = parsePoedbCrafts(fixture('harvest.html'), { provider: 'harvest' })
  assert.equal(bench[1].effectKind, 'lock_prefixes')
  assert.equal(bench[0].cost[0].amount, 4)
  assert.equal(harvest[0].effectKind, 'reforge_tag')
  assert.equal(harvest[1].cost.length, 2)
  assert.equal(createCoreCurrencyCrafts().length, 10)
  assert.equal(inferCraftEffectKind('后缀无法被变更', 'bench'), 'lock_suffixes')
  assert.equal(inferCraftEffectKind('将物品上一个随机插槽颜色重铸为白色', 'harvest'), 'white_socket')
  assert.equal(inferCraftEffectKind('重铸一件稀有物品，其中包括一个生命词缀', 'harvest'), 'reforge_tag')
  assert.equal(inferCraftEffectKind('重铸一件稀有物品，大概率不会得到相同词缀类型', 'harvest'), 'reforge_less_likely')
})

test('当前花园表格保留未知行并解析资源名在前的多资源成本', () => {
  const html = `<table><thead><tr><th>描述</th><th>消耗</th></tr></thead><tbody>
    <tr><td><span>重铸</span>一件带随机词缀的稀有物品，其中包括一个<span>召唤生物</span>词缀</td><td><a class="item_currency" href="Primal_Crystallised_Lifeforce">原始蓝晶命能</a> x200<br><a class="item_currency" href="Crystallised_Rancour">憎恨结晶</a> x3</td></tr>
    <tr><td><span>重铸</span>一件带随机词缀的稀有物品，其中包括一个<span>掉落</span> 属性</td><td><a class="item_currency" href="Vivid_Crystallised_Lifeforce">活性黄晶命能</a> x200<br><a class="item_currency" href="Crystallised_Rancour">憎恨结晶</a> x1</td></tr>
    <tr><td>将一个提供冰霜抗性的词缀变为近似位阶，但提供火焰抗性的词缀</td><td><a class="item_currency" href="Wild_Crystallised_Lifeforce">狂野紫晶命能</a> x500</td></tr>
    <tr><td>未来新增且尚未识别的花园效果</td><td><a class="item_currency" href="Vivid_Crystallised_Lifeforce">活性黄晶命能</a> x123</td></tr>
  </tbody></table>`
  const crafts = parsePoedbCrafts(html, { provider: 'harvest' })
  assert.equal(crafts.length, 4)
  assert.equal(crafts[0].effectKind, 'reforge_tag')
  assert.equal(crafts[0].params.tag, 'minion')
  assert.deepEqual(crafts[0].cost.map(({ resourceName, amount }) => [resourceName, amount]), [['原始蓝晶命能', 200], ['憎恨结晶', 3]])
  assert.equal(crafts[1].params.tag, 'drop')
  assert.deepEqual(crafts[1].cost.map(({ resourceName, amount }) => [resourceName, amount]), [['活性黄晶命能', 200], ['憎恨结晶', 1]])
  assert.equal(crafts[2].effectKind, 'convert_resistance')
  assert.deepEqual(crafts[2].params, { fromTag: 'cold', toTag: 'fire', hover: '', unlock: '' })
  assert.equal(crafts[3].effectKind, 'unsupported')
  assert.equal(crafts[3].cost[0].amount, 123)
})

test('古灵隐式表按来源、效果和类别聚合六个阶级', () => {
  const rows = (label, tag, extra = '') => Array.from({ length: 6 }, (_, index) => {
    const tier = index + 1
    return `<tr><td>75</td><td><span class="implicitMod">${label} <span class="mod-value">${tier + 7}</span>%</span><span data-tag="${tag}">${tag}</span></td><td><i>no_tier_${7 - tier}_eldritch_implicit</i> 0<br><i>gloves</i> 1000<br>${extra}<i>default</i> 0</td></tr>`
  }).join('')
  const html = `<table data-eldritch-source="exarch"><tbody>${rows('攻击速度加快', 'speed')}</tbody></table>
    <table data-eldritch-source="eater"><tbody>${rows('法术伤害压制率', 'defences', '<i>amulet</i> 1000<br>')}</tbody></table>`
  const families = parsePoedbEldritchImplicits(html)
  assert.equal(families.length, 2)
  assert.deepEqual(families.map((family) => family.source).sort(), ['eater', 'exarch'])
  assert.ok(families.every((family) => family.tiers.length === 6))
  assert.deepEqual(families[0].tiers.map((tier) => tier.tier), [1, 2, 3, 4, 5, 6])
  assert.deepEqual(families[0].itemClasses, ['Gloves'])
  assert.equal(families[0].tiers[0].weights.Gloves, 1000)
  assert.equal(families[0].tiers[0].weights.Amulet, undefined)
})

test('古灵 T1 零权重行保留为冲突石可降阶结果', () => {
  const rows = Array.from({ length: 6 }, (_, index) => `<tr><td>75</td><td><span class="implicitMod">效果 ${index + 1}%</span></td><td><i>no_tier_${6 - index}_eldritch_implicit</i> 0<br><i>gloves</i> ${index ? 500 : 0}</td></tr>`).join('')
  const families = parsePoedbEldritchImplicits(`<table data-eldritch-source="exarch"><tbody>${rows}</tbody></table><table data-eldritch-source="eater"><tbody>${rows}</tbody></table>`)
  assert.equal(families.length, 2)
  assert.ok(families.every((family) => family.tiers.length === 6 && family.tiers[0].weights.Gloves === 0))
})

test('古灵 T6 的百分百命中文案与 T1–T5 几率文案归为同一家族', () => {
  const rows = [1, 2, 3, 4, 5].map((tier) => `<tr><td>75</td><td><span class="implicitMod">攻击击中时有 ${70 + tier * 5}% 的几率造成瘫痪</span></td><td><i>no_tier_${7 - tier}_eldritch_implicit</i> 0<br><i>gloves</i> 120</td></tr>`).join('')
  const perfect = '<tr><td>75</td><td><span class="implicitMod">攻击击中造成瘫痪</span></td><td><i>no_tier_1_eldritch_implicit</i> 0<br><i>gloves</i> 120</td></tr>'
  const html = `<table data-eldritch-source="exarch"><tbody>${rows}${perfect}</tbody></table><table data-eldritch-source="eater"><tbody>${rows}${perfect}</tbody></table>`
  const families = parsePoedbEldritchImplicits(html)
  assert.equal(families.length, 2)
  assert.ok(families.every((family) => family.tiers.length === 6 && family.tiers[5].text === '攻击击中造成瘫痪'))
})

test('古灵家族六阶全零权重时不进入可执行目录', () => {
  const rows = Array.from({ length: 6 }, (_, index) => `<tr><td>75</td><td><span class="implicitMod">无效效果 ${index + 1}%</span></td><td><i>no_tier_${6 - index}_eldritch_implicit</i> 0<br><i>gloves</i> 0</td></tr>`).join('')
  assert.deepEqual(parsePoedbEldritchImplicits(`<table data-eldritch-source="exarch"><tbody>${rows}</tbody></table><table data-eldritch-source="eater"><tbody>${rows}</tbody></table>`), [])
})

test('ModsView JSON 边界解析不执行脚本', () => {
  const html = '<script>new ModsView({"gen":{"1":"前缀"},"normal":[]}); alert("ignored")</script>'
  assert.deepEqual(extractModsViewPayload(html).normal, [])
  assert.throws(() => extractModsViewPayload('<script>new ModsView({"normal":[])</script>'), /未闭合|Unexpected/)
})

test('ModsView 对象映射来源不会丢失势力与特殊词缀', () => {
  const record = (name, family) => ({
    Name: name, Level: '68', ModGenerationTypeID: '1', ModFamilyList: [family],
    DropChance: '100', str: '法术伤害提高 (10—20)%', spawn_no: ['wand'], mod_no: [], fossil_no: []
  })
  const payload = {
    opt: { ItemClassesCode: 'Wand', BaseItemName: 'Test Wand', tags: 'wand' },
    baseitem: { Code: 'Test_Wand' }, normal: [record('术士的', 'EssenceSpell')],
    shaper: { 1: record('塑界者的', 'ShaperSpell') },
    delve: { 2: record('地下的', 'DelveSpell') },
    incursion: { 3: record('神庙的', 'IncursionSpell') },
    veiled: { 4: record('天选的', 'VeiledSpell') },
    essence: { 5: record('精华的', 'EssenceSpell') }
  }
  const modifiers = parsePoedbModifiers(`<script>new ModsView(${JSON.stringify(payload)})</script>`, { profileId: 'Wands' })
  assert.deepEqual(new Set(modifiers.map((entry) => entry.source)), new Set(['natural', 'delve', 'incursion', 'veiled', 'essence']))
  assert.deepEqual(modifiers.find((entry) => entry.influences.length).influences, ['shaper'])
  assert.notEqual(modifiers.find((entry) => entry.source === 'essence').goalId, modifiers.find((entry) => entry.source === 'natural' && !entry.influences.length).goalId)
})

test('精华来源解析为纯文本名称和准确阶级规则', () => {
  const ordinary = parseEssenceSource('<a href="Deafening_Essence_of_Greed"><img src="Greed7.webp">贪婪之破空精华</a>')
  assert.deepEqual(ordinary, {
    id: 'Deafening_Essence_of_Greed', name: '贪婪之破空精华', tier: 7,
    minimumItemLevel: 65, randomModifierLevelCap: null, canReforgeRare: true
  })
  const low = parseEssenceSource('<a href="/cn/Whispering_Essence_of_Woe">悲痛之低语精华</a>')
  assert.equal(low.randomModifierLevelCap, 35)
  assert.equal(low.canReforgeRare, false)
  const special = parseEssenceSource('<a href="Essence_of_Desolation">哀恸精华</a>')
  assert.equal(special.tier, 8)
  assert.equal(special.canReforgeRare, true)
  assert.equal(parseEssenceSource('精华名称缺少资源链接'), null)
})

test('精华 ModsView 阶级不向名称泄漏 HTML', () => {
  const record = {
    Name: '<a href="Whispering_Essence_of_Woe"><img src="Woe1.webp">悲痛之低语精华</a>',
    Level: '2', ModGenerationTypeID: '1', ModFamilyList: ['CasterDamage'], DropChance: '0',
    str: '法术伤害提高 (10—19)%', spawn_no: ['wand'], mod_no: [], fossil_no: []
  }
  const payload = { opt: { ItemClassesCode: 'Wand', BaseItemName: 'Test Wand', tags: 'wand' }, baseitem: { Code: 'Test_Wand' }, essence: { 1: record } }
  const modifier = parsePoedbModifiers(`<script>new ModsView(${JSON.stringify(payload)})</script>`, { profileId: 'Wands' })[0]
  assert.equal(modifier.tiers[0].name, 'T1 悲痛之低语精华')
  assert.equal(modifier.tiers[0].sourceItem.id, 'Whispering_Essence_of_Woe')
  const mergedTier = mergeModifierGoals([modifier], [])[0].tiers[0]
  assert.equal(mergedTier.tier, 1)
  assert.equal(mergedTier.name, 'T1 悲痛之低语精华')
})

test('短杖底材最终化时补齐词缀池所需标签', () => {
  const [base] = finalizePoedbBases([{ id: 'base:sceptre', sourceId: 'Sceptre1', name: '测试短杖', category: '武器', itemClass: 'Sceptre', tags: ['default'], requiredLevel: 1 }])
  assert.equal(base.modifierProfileId, 'Sceptres')
  assert.ok(base.tags.includes('sceptre'))
})

test('星团珠宝附魔表补全 ModsView 未提供的增加小天赋词缀', () => {
  const row = (text, weight, level, affix) => `<tr><td><span data-tag="attack">Attack</span>${text}</td><td>${weight}</td><td>${level}</td><td>${affix}</td></tr>`
  const html = `<div class="card"><h5 class="card-header">Large Cluster Jewel Enchantment Modifiers /17</h5><table>
    ${row('Added Small Passive Skills also grant: Minions have 1% increased Attack and Cast Speed', 350, 1, 'Suffix')}
    ${row('Added Small Passive Skills also grant: Minions have 2% increased Attack and Cast Speed', 350, 68, 'Suffix')}
    ${row('Added Small Passive Skills also grant: Minions have 3% increased Attack and Cast Speed', 250, 84, 'Suffix')}
  </table></div>`
  const [goal] = parsePoedbModifiers(html, { profileId: 'Large_Cluster_Jewel' })
  assert.equal(goal.source, 'enchant')
  assert.equal(goal.effectKey, 'Added Small Passive Skills also grant: Minions have #% increased Attack and Cast Speed')
  assert.equal(goal.requiredTags[0], 'expansion_jewel_large')
  assert.deepEqual(goal.tiers.map(tier => [tier.tier, tier.requiredLevel, tier.weight]), [[1, 84, 250], [2, 68, 350], [3, 1, 350]])

  const chinese = `<div class="card"><h5 class="card-header">大型星团珠宝 附魔 词缀 /17</h5><table>
    ${row('增加的小天赋还获得：召唤生物的攻击和施法速度加快 1%', 350, 1, '后缀')}
  </table></div>`
  const [chineseGoal] = parsePoedbModifiers(chinese, { profileId: 'Large_Cluster_Jewel' })
  assert.equal(chineseGoal.source, 'enchant')
  assert.equal(chineseGoal.effectKey, '增加的小天赋还获得：召唤生物的攻击和施法速度加快 #%')
  assert.equal(chineseGoal.affixType, 'suffix')
})
})()

// === Merged from craftingParserStateBoundaries.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const createHash = _m9_createHash
  const parseItemInfo = _m9_parseItemInfo
  const parseFrontendItem = _m9_parseFrontendItem
  const matchAffixes = _m9_matchAffixes
  const matchMapRequirements = _m9_matchMapRequirements
  const LocalizationRuntime = _m9_LocalizationRuntime
  const normalizeItemTextLanguage = _m9_normalizeItemTextLanguage
const item = (body, detailed = true) => `物品类别: 异界地图
稀 有 度: 稀有
灾厄之域
堡垒地图
--------
物品等级: 84
--------
${detailed ? '{ 后缀属性 "丰饶的" (等阶：1) }\n' : ''}${body}`

// Verbatim CN effects in the current signed game resources; these describe other items.
const effects = [
  '地图首领掉落的物品已腐化',
  '身上未装备已腐化的物品时，最大生命提高 20%',
  '未鉴定的地图中找到的物品数量提高 20%'
]

test('制作解析不把词缀句子中的已腐化或未鉴定误认为当前物品状态', () => {
  for (const body of effects) for (const detailed of [true, false]) {
    const parsed = parseItemInfo(item(body, detailed))
    assert.equal(parsed.isCorrupted, false, body)
    assert.equal(parsed.isUnidentified, false, body)
    assert.deepEqual(parsed.explicitMods, [body], body)
    assert.equal(parsed.affixFormatUnsupported, false, body)
    if (detailed) assert.equal(parsed.modifiers[0].tier, 1)
    assert.equal(matchAffixes(parsed, [{ requiredAffixes: [body], selectedAffixes: [] }]).isMatch, true)
    assert.equal(matchMapRequirements(parsed, { match: { blacklist: [body] } }).reason, 'blacklist')
  }
})

test('独立状态行仍更新真实状态，且不能被并入前一条详细词缀', () => {
  const states = [
    ['已腐化', 'isCorrupted'], ['未鉴定', 'isUnidentified'], ['已复制', 'isMirrored'], ['镜像复制', 'isMirrored'],
    ['已分裂', 'isSplit'], ['分裂物品', 'isSplit'], ['不可改变', 'isUnmodifiable']
  ]
  for (const [state, flag] of states) {
    const parsed = parseItemInfo(item(`+90 最大生命\n${state}`))
    assert.equal(parsed[flag], true, state)
    assert.equal(parsed.modifiers[0].text, '+90 最大生命', state)
    assert.deepEqual(parsed.explicitMods, ['+90 最大生命'], state)
  }
})

test('英文独立状态归一后仍被识别，引用 Corrupted 的英文效果不改变状态', () => {
  const english = state => `Item Class: Rings\nRarity: Rare\nDoom Circle\nCoral Ring\n--------\nItem Level: 84\n--------\n{ Prefix Modifier "Corrupted" (Tier: 1) }\n20% increased Maximum Life if no Equipped Items are Corrupted\n${state}`
  const parsed = parseItemInfo(english(''))
  assert.equal(parsed.isCorrupted, false)
  assert.equal(parsed.modifiers[0].name, 'Corrupted')
  assert.equal(parsed.modifiers[0].text, '20% increased Maximum Life if no Equipped Items are Corrupted')
  assert.equal(parseItemInfo(english('Corrupted')).isCorrupted, true)
  assert.equal(parseItemInfo(english('Unidentified')).isUnidentified, true)
  const runtime = new LocalizationRuntime({ serverId: 'international' })
  for (const marker of ['Corrupted', '已腐化', '已汙染', '已污染']) {
    assert.equal(runtime.parseItem(english(marker), '').isCorrupted, true, marker)
  }
  for (const marker of ['Unidentified', '未鉴定', '未鑑定']) {
    assert.equal(runtime.parseItem(english(marker), '').isUnidentified, true, marker)
  }
})

test('原生国服详细头分清词缀位阶与需求等级，名称和标签不能伪造阶级或来源', () => {
  const parse = header => parseItemInfo(item(`{ ${header} }\n+90 最大生命`, false))
  for (const tier of [1, 2]) for (const marker of ['等阶', '位阶', '等階', '位階', '階級', '階層', 'Tier']) {
    const parsed = parse(`前缀属性 "健壮的" （${marker}：${tier}，等级：80）`)
    assert.equal(parsed.modifiers[0].tier, tier, marker)
    const condition = { kind: 'catalog', effectPattern: '+# 最大生命', minTier: 1 }
    assert.equal(matchAffixes(parsed, [{ requiredAffixes: [condition], selectedAffixes: [] }]).isMatch, tier === 1)
  }
  for (const level of ['等级', '等級', 'Lvl']) {
    assert.equal(parse(`前缀属性 "健壮的" （${level}：80）`).modifiers[0].tier, 0, level)
    assert.equal(parse(`大师级 前缀属性 "升级的" （${level}：3）`).modifiers[0].tier, 3, level)
    assert.equal(parse(`大师级 前缀属性 "升级的" （等阶：1，${level}：80）`).modifiers[0].tier, 1, level)
  }
  const poisoned = parse('后缀属性 "Prefix Modifier 等阶: 99" (等阶: 1) — Searing Exarch, 等阶: 88')
  assert.equal(poisoned.modifiers[0].tier, 1)
  assert.equal(poisoned.modifiers[0].affixType, 'suffix')
  assert.equal(poisoned.modifiers[0].sourceSubtype, null)
})

test('带阶级的未鉴定状态行在简繁英文、制作回译及前后解析器均置位未鉴定且不混入词缀', () => {
  const variants = [
    '未鉴定 (4 阶)', '未鉴定（4 阶）', '未鉴定(4阶)', '未鉴定 (阶级 4)', '## 未鉴定 (4 阶)',
    '未鑑定 (4 階)', '未鑑定（4階）', '未鑑定 (階級 4)', '未鑑定 (等階: 4)',
    'Unidentified (Tier 4)', 'Unidentified (Tier: 4)', 'Unidentified（Tier 4）'
  ]
  for (const state of variants) {
    const parsed = parseItemInfo(item(`+90 最大生命\n${state}`))
    assert.equal(parsed.isUnidentified, true, state)
    assert.equal(parsed.modifiers[0].text, '+90 最大生命', state)
    assert.deepEqual(parsed.explicitMods, ['+90 最大生命'], state)
    assert.equal(parseFrontendItem(item(state, false)).isUnidentified, true, state)
  }

  const graniteEntry = {
    kind: 'dat', table: 'baseitemtypes', id: 'Metadata/Items/Flasks/FlaskUtility6', field: 'Name',
    en: 'Granite Flask', cn: '刚玉药剂', tw: '堅岩藥劑',
    sourceHash: createHash('sha256').update('Granite Flask').digest('hex')
  }
  const runtime = new LocalizationRuntime({
    serverId: 'international',
    entries: () => [graniteEntry],
    revision: () => 'tiered-unidentified',
    baseNames: () => ['Granite Flask']
  })
  const flask = (cls, rarity, base, levelLabel, state) =>
    `${cls}\n${rarity}\n${base}\n--------\n${levelLabel}: 85\n--------\n${state}`
  for (const text of [
    flask('物品类别: 功能药剂', '稀 有 度: 魔法', '刚玉药剂', '物品等级', '未鉴定 (4 阶)'),
    flask('物品类别: 功能药剂', '稀 有 度: 魔法', '刚玉药剂', '物品等级', '未鉴定（4阶）'),
    flask('物品種類: 功能藥劑', '稀有度: 魔法', '堅岩藥劑', '物品等級', '未鑑定 (4 階)'),
    flask('物品種類: 功能藥劑', '稀有度: 魔法', '堅岩藥劑', '物品等級', '未鑑定 (階級 4)'),
    flask('Item Class: Utility Flasks', 'Rarity: Magic', 'Granite Flask', 'Item Level', 'Unidentified (Tier 4)')
  ]) {
    const parsed = runtime.parseItem(text, 'tiered-unidentified')
    assert.equal(parsed.isUnidentified, true, text)
    assert.equal(parsed.affixFormatUnsupported, false, text)
    assert.equal(parsed.baseName, 'Granite Flask', text)
    assert.deepEqual(parsed.explicitMods, [], text)
    assert.match(parsed.canonicalText, /^Unidentified \(Tier 4\)$/m, text)
  }

  const englishNormalized = normalizeItemTextLanguage(
    flask('Item Class: Utility Flasks', 'Rarity: Magic', 'Granite Flask', 'Item Level', 'Unidentified (Tier 4)\nFoil Unique (Voidborn)')
  )
  assert.match(englishNormalized, /^未鉴定 \(4 阶\)$/m)
  assert.match(englishNormalized, /^烫金传奇$/m)

  for (const invalid of ['未鉴定 (未知说明)', '未鉴定 (0 阶)', '未鑑定 (未知)']) {
    assert.throws(
      () => runtime.parseItem(flask('物品类别: 功能药剂', '稀 有 度: 魔法', '刚玉药剂', '物品等级', invalid), 'tiered-unidentified'),
      error => error.code === 'LOCALIZATION_UNRESOLVED',
      invalid
    )
    assert.equal(parseItemInfo(item(invalid, false)).isUnidentified, false, invalid)
    assert.equal(parseFrontendItem(item(invalid, false)).isUnidentified, false, invalid)
  }
  assert.equal(parseFrontendItem(item('未鉴定的地图中找到的物品数量提高 20%', false)).isUnidentified, false)
})
})()

// === Merged from craftingPrice.test.js ===
await (async () => {
  const test = _m10_test
  const assert = _m10_assert
  const mkdtemp = _m10_mkdtemp
  const os = _m10_os
  const path = _m10_path
  const CraftingPriceService = _m10_CraftingPriceService
  const convertPricesToChaos = _m10_convertPricesToChaos
  const estimateResources = _m10_estimateResources
  const filterCraftingPrices = _m10_filterCraftingPrices
  const normalizeSummaryPrices = _m10_normalizeSummaryPrices
  const priceHealth = _m10_priceHealth
const now = Date.parse('2026-07-21T12:00:00+08:00')
const payload = [{ category_label: '通货', items: [
  { item_name: '混沌石', engname: 'Chaos Orb', sell_avg: 1, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' },
  { item_name: '神圣石', engname: 'Divine Orb', sell_avg: 150, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' },
  { item_name: '高价资源', engname: 'Expensive', sell_avg: 2, currency_unit: 'd', latest_datetime: '2026-07-21 11:00:00' },
  { item_name: '异常资源', engname: 'Broken', sell_avg: 10, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00', error: true, error_info: 'OCR 故障' }
]}]

test('做装价格只保留实际工艺会消耗的物品', () => {
  const records = normalizeSummaryPrices([
    ...payload,
    { category_label: '圣甲虫', items: [{ item_name: '丰沛之仪式圣甲虫', sell_avg: 2, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' }] },
    { category_label: '文身', items: [{ item_name: '好战者的文身', sell_avg: 3, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' }] },
    { category_label: '碎片仓库', items: [{ item_name: '奉献碎片', sell_avg: 4, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' }] }
  ])
  const filtered = filterCraftingPrices(records, [
    { resourceId: 'currency:chaos', resourceName: '混沌石' },
    { resourceId: 'currency:divine', resourceName: '神圣石' }
  ])
  assert.deepEqual(filtered.map((record) => record.itemName), ['混沌石', '神圣石'])
})

test('工艺数据中的非核心耗材按名称保留并兼容成本文本的 x1 后缀', () => {
  const records = normalizeSummaryPrices([{ category_label: '通货仓库', items: [
    { item_name: '神圣白晶命能', engname: 'Sacred Crystallised Lifeforce', sell_avg: 20, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' },
    { item_name: '原始蓝晶命能', engname: 'Primal Crystallised Lifeforce', sell_avg: 1, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' }
  ] }])
  const filtered = filterCraftingPrices(records, [{ resourceId: 'resource:test', resourceName: '神圣白晶命能 x1' }])
  assert.deepEqual(filtered.map((record) => record.itemName), ['神圣白晶命能'])
})

test('公开 sell_avg 和 d 单位统一换算为混沌石', () => {
  const records = normalizeSummaryPrices(payload)
  const converted = convertPricesToChaos(records, {}, now)
  assert.equal(converted.find((entry) => entry.itemName === '高价资源').chaosValue, 300)
  const abnormal = converted.find((entry) => entry.itemName === '异常资源')
  assert.equal(abnormal.valid, true)
  assert.equal(abnormal.chaosValue, 10)
  assert.equal(abnormal.warning, 'OCR 故障')
  assert.equal(records[0].resourceId, 'currency:chaos')
})

test('超过 24 小时的价格被拒用，OCR 异常价格保留并警告', () => {
  assert.equal(priceHealth({ sellAverage: 1, error: false, observedAt: '2026-07-20 10:00:00' }, now).valid, false)
  const abnormal = priceHealth({ sellAverage: 1, error: true, errorInfo: '坏数据', observedAt: '2026-07-21 11:00:00' }, now)
  assert.equal(abnormal.valid, true)
  assert.equal(abnormal.warning, '坏数据')
})

test('单条价格缺少时间时标记无效但不阻断整批刷新', () => {
  const records = normalizeSummaryPrices([{ items: [
    { item_name: '混沌石', engname: 'Chaos Orb', sell_avg: 1, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' },
    { item_name: '缺时间资源', engname: 'No Time', sell_avg: 2, currency_unit: 'c' }
  ] }])
  assert.equal(records.length, 2)
  const invalid = convertPricesToChaos(records).find((entry) => entry.itemName === '缺时间资源')
  assert.equal(invalid.valid, false)
  assert.equal(invalid.reason, '价格时间缺失')
})

test('缺失均价和未知单位同样只拒用单条记录', () => {
  const records = normalizeSummaryPrices([{ items: [
    { item_name: '正常资源', sell_avg: 1, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' },
    { item_name: '格式损坏资源', sell_avg: null, currency_unit: 'x', latest_datetime: '2026-07-21 11:00:00' }
  ] }])
  const converted = convertPricesToChaos(records, {}, now)
  assert.equal(converted.find((entry) => entry.itemName === '正常资源').valid, true)
  assert.equal(converted.find((entry) => entry.itemName === '格式损坏资源').valid, false)
})

test('卖方均价为 0 时回退到正数买方均价并标记来源', () => {
  const records = normalizeSummaryPrices([{ items: [
    { item_name: '增幅石', engname: 'Orb of Augmentation', sell_avg: 0, buy_avg: 0.08, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' }
  ] }])
  const converted = convertPricesToChaos(records, {}, now)
  assert.equal(converted[0].valid, true)
  assert.equal(converted[0].chaosValue, 0.08)
  assert.equal(converted[0].source, 'remote-buy-fallback')
})

test('今日均价全零时按卖方、买方顺序回退昨日均价', () => {
  const records = normalizeSummaryPrices([{ items: [
    { item_name: '神圣石', engname: 'Divine Orb', sell_avg: 0, buy_avg: 0, sell_avg_yesterday: 150, buy_avg_yesterday: 160, currency_unit: 'c', latest_datetime: '2026-07-21 23:00:00' },
    { item_name: '增幅石', engname: 'Orb of Augmentation', sell_avg: 0, buy_avg: 0, sell_avg_yesterday: 0, buy_avg_yesterday: 0.08, currency_unit: 'c', latest_datetime: '2026-07-21 23:00:00' }
  ] }])
  const converted = convertPricesToChaos(records)
  assert.equal(converted.find((entry) => entry.itemName === '神圣石').chaosValue, 150)
  assert.equal(converted.find((entry) => entry.itemName === '神圣石').source, 'remote-yesterday-sell')
  assert.equal(converted.find((entry) => entry.itemName === '增幅石').chaosValue, 0.08)
  assert.equal(converted.find((entry) => entry.itemName === '增幅石').source, 'remote-yesterday-buy')
})

test('今日和昨日均价全零时继续回退最新卖一或买一', () => {
  const records = normalizeSummaryPrices([{ items: [
    { item_name: '最新卖价资源', sell_avg: 0, buy_avg: 0, sell_avg_yesterday: 0, buy_avg_yesterday: 0, latest_sell1: 0.002857, latest_buy1: 0.003, currency_unit: 'c', latest_datetime: '2026-07-21 23:00:00' },
    { item_name: '最新买价资源', sell_avg: 0, buy_avg: 0, sell_avg_yesterday: 0, buy_avg_yesterday: 0, latest_sell1: 0, latest_buy1: 0.0008, currency_unit: 'c', latest_datetime: '2026-07-21 23:00:00' }
  ] }])
  const converted = convertPricesToChaos(records)
  assert.equal(converted.find((entry) => entry.itemName === '最新卖价资源').chaosValue, 0.002857)
  assert.equal(converted.find((entry) => entry.itemName === '最新卖价资源').source, 'remote-latest-sell')
  assert.equal(converted.find((entry) => entry.itemName === '最新买价资源').chaosValue, 0.0008)
  assert.equal(converted.find((entry) => entry.itemName === '最新买价资源').source, 'remote-latest-buy')
})

test('存在价格但时间缺失时保留展示值但不参与计算', () => {
  const records = normalizeSummaryPrices([{ items: [
    { item_name: '时间未知资源', sell_avg: 0, buy_avg: 0, latest_sell1: 0.0012, currency_unit: 'c', latest_datetime: '' }
  ] }])
  const [converted] = convertPricesToChaos(records)
  assert.equal(converted.valid, false)
  assert.equal(converted.chaosValue, 0.0012)
  assert.match(converted.reason, /价格时间缺失/)
})

test('昨日均价最多允许使用 48 小时', () => {
  assert.equal(priceHealth({ sellAverage: 1, error: false, observedAt: '2026-07-19 11:00:00', source: 'remote-yesterday-sell' }, now).valid, false)
  assert.equal(priceHealth({ sellAverage: 1, error: false, observedAt: '2026-07-20 11:00:00', source: 'remote-yesterday-sell' }, now).valid, true)
})

test('混沌石远程价格缺失时固定为 1C', () => {
  const records = normalizeSummaryPrices([{ items: [
    { item_name: '混沌石', engname: 'Chaos Orb', sell_avg: 0, buy_avg: 0, currency_unit: 'c', latest_datetime: '' }
  ] }])
  const [chaos] = convertPricesToChaos(records)
  assert.equal(chaos.valid, true)
  assert.equal(chaos.chaosValue, 1)
  assert.equal(chaos.source, 'fixed-chaos')
})

test('新版中文剥离石映射到无效通货资源', () => {
  const [record] = normalizeSummaryPrices([{ items: [
    { item_name: '剥离石', sell_avg: 1, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' }
  ] }])
  assert.equal(record.resourceId, 'currency:annulment')
})

test('本地覆盖优先，资源估价不包含底材成本', () => {
  const records = normalizeSummaryPrices(payload)
  const estimate = estimateResources([{ resourceId: 'currency:chaos', resourceName: '混沌石', amount: 5 }], records, { 'currency:chaos': 2 })
  assert.equal(estimate.totalChaos, 10)
  assert.equal(estimate.baseCostChaos, 0)
  assert.equal(estimate.details[0].source, 'override')
})

test('价格服务缓存一小时并持久化覆盖', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-price-'))
  let calls = 0
  const fetchImpl = async () => ({ ok: true, json: async () => { calls += 1; return payload } })
  const service = new CraftingPriceService({ storageRoot: root, fetchImpl, now: () => now })
  await service.initialize()
  await service.refresh()
  await service.refresh()
  assert.equal(calls, 1)
  await service.setOverride('currency:chaos', 1.5)
  assert.equal(service.getSnapshot().overrides['currency:chaos'], 1.5)
  await service.removeOverride('currency:chaos')
  assert.equal(service.getSnapshot().overrides['currency:chaos'], undefined)
})

test('异常刷新不会覆盖已有有效价格缓存', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-price-'))
  let responsePayload = payload
  let currentTime = now
  const fetchImpl = async () => ({ ok: true, json: async () => responsePayload })
  const service = new CraftingPriceService({ storageRoot: root, fetchImpl, now: () => currentTime })
  await service.initialize()
  await service.refresh()
  const previous = service.getSnapshot()

  currentTime += 2 * 60 * 60 * 1000
  responsePayload = [{ items: [{ item_name: '神圣石', sell_avg: 0, buy_avg: 0, currency_unit: 'c', latest_datetime: '' }] }]
  await assert.rejects(service.refresh({ force: true }), /有效价格异常/)

  const preserved = service.getSnapshot()
  assert.equal(preserved.fetchedAt, previous.fetchedAt)
  assert.equal(preserved.records.find((entry) => entry.resourceId === 'currency:divine').chaosValue, 150)
})
})()

// === Merged from craftingRawSnapshot.test.js ===
await (async () => {
  const test = _m11_test
  const assert = _m11_assert
  const mkdtemp = _m11_mkdtemp
  const readFile = _m11_readFile
  const rm = _m11_rm
  const os = _m11_os
  const path = _m11_path
  const loadRawSnapshot = _m11_loadRawSnapshot
  const readRawManifest = _m11_readRawManifest
  const snapshotPatchRoot = _m11_snapshotPatchRoot
  const synchronizeRawSnapshot = _m11_synchronizeRawSnapshot
const sources = [
  { id: 'base:Helmets', page: 'Helmets', url: 'https://example.test/Helmets', category: 'base' },
  { id: 'modifier:Helmets_str', page: 'Helmets_str', url: 'https://example.test/Helmets_str', category: 'modifier' }
]

async function withTempRoot(operation) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-raw-'))
  try {
    return await operation(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

const fixedNow = () => '2026-07-22T00:00:00.000Z'

test('离线重建只读取本地压缩快照且不调用网络', async () => withTempRoot(async (root) => {
  await synchronizeRawSnapshot({
    root, patch: '3.28', sources, mode: 'full', now: fixedNow,
    fetcher: async (url) => ({ text: `<html>${url}</html>`, status: 200 })
  })
  let networkCalls = 0
  const snapshot = await synchronizeRawSnapshot({
    root, patch: '3.28', sources, mode: 'offline',
    fetcher: async () => { networkCalls += 1; throw new Error('离线模式不得联网') }
  })
  assert.equal(networkCalls, 0)
  assert.equal(snapshot.texts.get('base:Helmets'), '<html>https://example.test/Helmets</html>')
  assert.equal(snapshot.manifest.sources[0].status, 200)
  assert.match(snapshot.manifest.sources[0].sha256, /^[a-f0-9]{64}$/)
  assert.equal(snapshot.manifest.sources[0].category, 'base')
}))

test('补缺模式只抓取 manifest 中缺失的来源页', async () => withTempRoot(async (root) => {
  await synchronizeRawSnapshot({
    root, patch: '3.28', sources: sources.slice(0, 1), mode: 'full', now: fixedNow,
    fetcher: async () => ({ text: 'existing', status: 200 })
  })
  const fetched = []
  const snapshot = await synchronizeRawSnapshot({
    root, patch: '3.28', sources, mode: 'missing', now: fixedNow,
    fetcher: async (url, source) => { fetched.push(source.id); return { text: `new:${url}`, status: 200 } }
  })
  assert.deepEqual(fetched, ['modifier:Helmets_str'])
  assert.equal(snapshot.texts.get('base:Helmets'), 'existing')
  assert.equal(snapshot.texts.get('modifier:Helmets_str'), 'new:https://example.test/Helmets_str')
}))

test('定向刷新仅替换指定来源并保留其他来源内容与哈希', async () => withTempRoot(async (root) => {
  await synchronizeRawSnapshot({
    root, patch: '3.28', sources, mode: 'full', now: fixedNow,
    fetcher: async (url, source) => ({ text: `old:${source.id}`, status: 200 })
  })
  const before = await readRawManifest(root, '3.28')
  const fetched = []
  const snapshot = await synchronizeRawSnapshot({
    root, patch: '3.28', sources, mode: 'refresh', refresh: ['Helmets_str'],
    now: () => '2026-07-23T00:00:00.000Z',
    fetcher: async (url, source) => { fetched.push(source.id); return { text: `refreshed:${source.id}`, status: 200 } }
  })
  const after = snapshot.manifest
  assert.deepEqual(fetched, ['modifier:Helmets_str'])
  assert.equal(after.sources[0].sha256, before.sources[0].sha256)
  assert.equal(after.sources[0].fetchedAt, before.sources[0].fetchedAt)
  assert.equal(snapshot.texts.get('base:Helmets'), 'old:base:Helmets')
  assert.equal(snapshot.texts.get('modifier:Helmets_str'), 'refreshed:modifier:Helmets_str')
}))

test('不同补丁使用独立目录且刷新新版本不改变旧版本', async () => withTempRoot(async (root) => {
  await synchronizeRawSnapshot({
    root, patch: '3.28', sources, mode: 'full', now: fixedNow,
    fetcher: async (url, source) => ({ text: `3.28:${source.id}`, status: 200 })
  })
  const oldManifestFile = path.join(snapshotPatchRoot(root, '3.28'), 'manifest.json')
  const oldManifestBytes = await readFile(oldManifestFile)
  await synchronizeRawSnapshot({
    root, patch: '3.29', sources, mode: 'full', now: fixedNow,
    fetcher: async (url, source) => ({ text: `3.29:${source.id}`, status: 200 })
  })
  assert.deepEqual(await readFile(oldManifestFile), oldManifestBytes)
  assert.equal((await loadRawSnapshot({ root, patch: '3.28', sources })).texts.get('base:Helmets'), '3.28:base:Helmets')
  assert.equal((await loadRawSnapshot({ root, patch: '3.29', sources })).texts.get('base:Helmets'), '3.29:base:Helmets')
}))
})()

// === Merged from craftingRecovery.test.js ===
await (async () => {
  const test = _m12_test
  const assert = _m12_assert
  const readFileSync = _m12_readFileSync
  const validateMapRecovery = _m12_validateMapRecovery
const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

const validCheckpoint = {
  targetKind: 'atlas',
  col: 2,
  row: 3,
  processedCount: 9,
  qualifiedCount: 6,
  blacklistStats: { 反射: 2 },
  whitelistStats: { 额外怪物: 1 }
}

test('地图和海图恢复检查点保留失败格及已提交统计', () => {
  assert.deepEqual(validateMapRecovery(null, { targetKind: 'atlas', rows: 5, cols: 12 }), {
    valid: true,
    value: null
  })
  assert.deepEqual(validateMapRecovery(validCheckpoint, { targetKind: 'atlas', rows: 5, cols: 12 }), {
    valid: true,
    value: validCheckpoint
  })
  assert.deepEqual(validateMapRecovery({
    ...validCheckpoint,
    targetKind: 'chart',
    blacklistStats: {},
    whitelistStats: {}
  }, { targetKind: 'chart', rows: 5, cols: 12 }).value.targetKind, 'chart')
})

test('恢复检查点目标不匹配、越界或统计无效时拒绝启动', () => {
  const invalidValues = [
    { ...validCheckpoint, targetKind: 'chart' },
    { ...validCheckpoint, col: 12 },
    { ...validCheckpoint, row: 5 },
    { ...validCheckpoint, processedCount: -1 },
    { ...validCheckpoint, qualifiedCount: 10 },
    { ...validCheckpoint, blacklistStats: { 反射: -1 } }
  ]
  for (const recovery of invalidValues) {
    const result = validateMapRecovery(recovery, { targetKind: 'atlas', rows: 5, cols: 12 })
    assert.equal(result.valid, false)
    assert.match(result.error, /恢复检查点无效/)
  }
})

test('地图启动在 DPI 刷新和脚本输入前校验恢复检查点并注入脚本', () => {
  const service = source('../src/utils/scriptService.js')
  const generator = source('../src/utils/pythonScriptGenerator.js')
  const validation = service.indexOf('const recoveryValidation = validateMapRecovery(recovery')
  const dpiRefresh = service.indexOf('await refreshDpiForAutomation(settingsStore)', validation)
  const config = service.indexOf('const generationConfig = {', validation)
  const generation = service.indexOf('generateMapRollingScript(generationConfig)', config)
  assert.ok(validation >= 0 && dpiRefresh > validation && config > dpiRefresh && generation > config)
  assert.match(service.slice(config, generation), /recovery: recoveryValidation\.value/)
  assert.match(service.slice(generation), /generationConfig: JSON\.parse\(JSON\.stringify\(generationConfig\)\)/)
  assert.match(generator, /'\{\{RECOVERY_CONFIG\}\}': jsonToPython\(JSON\.stringify\(recovery \|\| \{\}\)\)/)
})
})()

// === Merged from craftingScriptStartup.test.js ===
await (async () => {
  const test = _m13_test
  const assert = _m13_assert
  const EventEmitter = _m13_EventEmitter
  const readFileSync = _m13_readFileSync
  const resolveCraftingPython = _m13_resolveCraftingPython
  const startPythonProcess = _m13_startPythonProcess
  const waitForScriptStartup = _m13_waitForScriptStartup
  const isSuccessfulScriptStart = _m13_isSuccessfulScriptStart
  const dispatchShortcutAction = _m13_dispatchShortcutAction
const fakeChild = (pid = 321) => {
  const child = new EventEmitter()
  child.pid = pid
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  return child
}

test('制作启动只选择同时具备 pynput 和 pyperclip 的解释器', () => {
  const calls = []
  const pythonPath = resolveCraftingPython({
    detectPythonPathWithModules(modules) {
      calls.push(modules)
      return 'compatible-python'
    },
    detectPythonPath() {
      throw new Error('不应回退到未验证依赖的解释器')
    }
  })

  assert.equal(pythonPath, 'compatible-python')
  assert.deepEqual(calls, [['pynput', 'pyperclip']])
  assert.equal(resolveCraftingPython({
    detectPythonPathWithModules: () => null,
    detectPythonPath: () => 'incompatible-python'
  }), null)
})

test('开启仓库页识别时制作启动追加离线 OCR 依赖', () => {
  const calls = []
  resolveCraftingPython({
    detectPythonPathWithModules(modules) {
      calls.push(modules)
      return 'compatible-python'
    }
  }, true)
  assert.deepEqual(calls, [[
    'pynput', 'pyperclip', 'rapidocr', 'onnxruntime', 'cv2', 'mss', 'numpy'
  ]])
})

test('Python 子进程异步启动失败时启动 Promise 拒绝且不会假成功', async () => {
  const child = fakeChild(undefined)
  const started = startPythonProcess({
    pythonPath: 'python',
    scriptPath: 'crafting.py',
    spawnProcess: () => child
  })
  child.emit('error', new Error('spawn failed'))
  await assert.rejects(started, /spawn failed/)
})

test('Python 子进程确认 spawn 后返回真实进程并禁用 shell 转发', async () => {
  const child = fakeChild(456)
  let options
  const started = startPythonProcess({
    pythonPath: 'C:\\Program Files\\Python\\python.exe',
    scriptPath: 'C:\\Program Files\\流放助手\\crafting.py',
    spawnProcess(_command, _args, receivedOptions) {
      options = receivedOptions
      return child
    }
  })
  child.emit('spawn')
  assert.equal(await started, child)
  assert.equal(options.shell, false)
  assert.deepEqual(options.stdio, ['ignore', 'pipe', 'pipe'])
})

test('制作进程完成仓库选择和通货预检后才确认启动成功', async () => {
  const child = fakeChild(456)
  const startup = waitForScriptStartup(child, { timeoutMs: 100 })
  child.stdout.emit('data', 'EVENT {"event":"crafting-startup-succeeded","mode":"items"}\n')
  assert.deepEqual(await startup, {
    event: 'crafting-startup-succeeded',
    mode: 'items'
  })
})

test('制作进程在启动门禁前失败或退出时不得假报成功', async () => {
  const structured = fakeChild(456)
  const structuredStartup = waitForScriptStartup(structured, { timeoutMs: 100 })
  structured.stdout.emit('data', 'EVENT {"event":"stash-tab-selection-failed","reason":"没有找到通货页"}\n')
  await assert.rejects(structuredStartup, /没有找到通货页/)

  const exited = fakeChild(456)
  const exitedStartup = waitForScriptStartup(exited, { timeoutMs: 100 })
  exited.emit('close', 0)
  await assert.rejects(exitedStartup, /启动完成前已退出/)
})

test('IPC 在浮层就绪后启动进程，并等待脚本启动门禁成功', () => {
  const ipc = readFileSync(new URL('../electron/modules/ipc/python.js', import.meta.url), 'utf8')
  const overlayReady = ipc.indexOf('await prepareCraftingOverlay(')
  const processCreated = ipc.indexOf('const launch = createPythonProcess(')
  const startupWait = ipc.indexOf('waitForScriptStartup(', processCreated)
  const reportsRunning = ipc.indexOf("status: 'running'", processCreated)

  assert.ok(overlayReady > 0 && overlayReady < processCreated, '必须先让浮层完成加载，避免丢失启动错误')
  assert.ok(startupWait > processCreated && startupWait < reportsRunning, '必须先通过脚本启动门禁再报告运行中')

  for (const filename of ['crafting_template.py', 'map_rolling_template.py']) {
    const template = readFileSync(new URL(`../src/assets/scripts/${filename}`, import.meta.url), 'utf8')
    const preflight = template.indexOf('if not preflight_required_currencies():')
    const ready = template.indexOf('"crafting-startup-succeeded"', preflight)
    assert.ok(ready > preflight, `${filename} 必须在通货预检成功后报告启动就绪`)
  }
})

test('renderer 只有在成功结果包含有效进程标识时才进入运行态', () => {
  assert.equal(isSuccessfulScriptStart({ success: true, processId: 123 }), true)
  assert.equal(isSuccessfulScriptStart({ success: true }), false)
  assert.equal(isSuccessfulScriptStart({ success: true, processId: 0 }), false)
  assert.equal(isSuccessfulScriptStart({ success: false, processId: 123 }), false)
})

test('物品与地图快捷键分别只分发一次公共启动动作，制作入口覆盖通用与专用分支', () => {
  const calls = []
  const handlers = {
    itemStart: () => calls.push('item'),
    mapStart: () => calls.push('map')
  }
  assert.equal(dispatchShortcutAction('itemStart', handlers), true)
  assert.equal(dispatchShortcutAction('mapStart', handlers), true)
  assert.deepEqual(calls, ['item', 'map'])

  const service = readFileSync(new URL('../src/utils/scriptService.js', import.meta.url), 'utf8')
  assert.equal((service.match(/isSuccessfulScriptStart\(result\)/g) || []).length, 3)
})
})()
