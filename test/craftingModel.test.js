import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CRAFTING_SCHEMA_VERSION,
  normalizeBaseItem,
  normalizeCraftDefinition,
  normalizeCraftPlan,
  normalizeCraftRequest,
  normalizeCraftState,
  normalizeCraftingDataset,
  normalizeCorruptedImplicitFamily,
  normalizeDatasetManifest,
  normalizeEldritchImplicitFamily,
  normalizeModifierFamily,
  normalizeModifierFamilyGroup,
  normalizeModifierTier,
  normalizePriceRecord,
  stableCraftingId
} from '../electron/modules/crafting/model.js'

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
