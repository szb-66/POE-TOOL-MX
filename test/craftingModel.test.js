import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeBaseItem,
  normalizeCraftDefinition,
  normalizeCraftPlan,
  normalizeCraftRequest,
  normalizeCraftState,
  normalizeCraftingDataset,
  normalizeDatasetManifest,
  normalizeModifierFamily,
  normalizeModifierFamilyGroup,
  normalizeModifierTier,
  normalizePriceRecord,
  stableCraftingId
} from '../electron/modules/crafting/model.js'

const manifest = {
  schemaVersion: 3,
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
  imageId: 'ring', requiredLevel: 1, tags: ['ring'], maxAffixes: { prefix: 3, suffix: 3 },
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

test('做装数据模型规范化所有公开结构', () => {
  assert.equal(normalizeDatasetManifest(manifest).league, 'Mirage')
  assert.equal(normalizeBaseItem(base).name, '珊瑚戒指')
  assert.equal(normalizeModifierTier(modifier.tiers[0]).weight, 1000)
  assert.equal(normalizeModifierFamily(modifier).affixType, 'prefix')
  assert.equal(normalizeModifierFamilyGroup(modifierFamily).entries[0].goalId, modifier.id)
  assert.equal(normalizeCraftDefinition(craft).provider, 'currency')
  assert.equal(normalizePriceRecord({ resourceId: 'currency:chaos', item_name: '混沌石', sell_avg: 1, currency_unit: 'c', latest_datetime: '2026-07-21 10:00:00' }).sellAverage, 1)
  assert.equal(normalizeCraftRequest({ baseId: base.id, itemLevel: 84, variant: { kind: 'normal' }, targets: [{ goalId: modifier.id, minTierId: modifier.tiers[0].id }] }).targets.length, 1)
  assert.equal(normalizeCraftState({ rarity: 'rare' }).rarity, 'rare')
  assert.equal(normalizeCraftPlan({ id: 'plan', name: '混沌重洗', phase: 'quick', expectedChaos: 10, successProbability: 0.1, expectedAttempts: 10, p50Chaos: 7, p90Chaos: 22, confidence95: { low: 0.09, high: 0.11 }, datasetVersion: '3.28' }).scopeNotice, '在当前支持的工艺与策略中最优')
})

test('完整数据集校验图片引用和重复 ID', () => {
  const valid = normalizeCraftingDataset({ manifest, bases: [base], modifierFamilies: [modifierFamily], crafts: [craft], images: { ring: 'images/ring.png' } })
  assert.equal(valid.bases.length, 1)
  assert.equal(valid.modifierFamilies.length, 1)
  assert.throws(() => normalizeCraftingDataset({ manifest, bases: [{ ...base, imageId: 'missing' }], modifierFamilies: [modifierFamily], crafts: [craft], images: {} }), /图片 missing 不存在/)
  assert.throws(() => normalizeCraftingDataset({ manifest, bases: [base, base], modifierFamilies: [modifierFamily], crafts: [craft], images: { ring: 'images/ring.png' } }), /重复 ID/)
})

test('无效枚举和空目标被拒绝，稳定 ID 可复现', () => {
  assert.throws(() => normalizeCraftRequest({ baseId: base.id, itemLevel: 84, targets: [] }), /至少需要一个目标词缀/)
  assert.throws(() => normalizeModifierFamily({ ...modifier, affixType: 'implicit' }), /prefix 或 suffix/)
  assert.equal(stableCraftingId('base', 'Ring1'), stableCraftingId('base', 'Ring1'))
  assert.notEqual(stableCraftingId('base', 'Ring1'), stableCraftingId('base', 'Ring2'))
  assert.throws(() => normalizeCraftingDataset({ manifest: { ...manifest, schemaVersion: 2 }, bases: [base], modifierFamilies: [modifierFamily], crafts: [craft], images: { ring: 'images/ring.png' } }), /不支持的 schema 2/)
})
