import test from 'node:test'
import assert from 'node:assert/strict'
import { createDefaultActionRegistry, pickWeighted } from '../electron/modules/crafting/actionProviders.js'
import { createInitialCraftState, validateCraftRequest } from '../electron/modules/crafting/craftState.js'
import { normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { createSeededRandom, generateStrategyCandidates, optimizeCrafting, weightedTargetProbability, wilsonInterval } from '../electron/modules/crafting/optimizer.js'

const makeModifier = (id, groupId, name, affixType, weight, tags = [], source = 'natural') => ({
  id, sourceId: id, groupId, name, affixType, source, tags, spawnTags: ['ring'], influences: [],
  tiers: [{ id: `${id}:t1`, tier: 1, name: 'T1', requiredLevel: 1, weight, text: name, values: [{ min: 1, max: 1 }] }]
})

const dataset = normalizeCraftingDataset({
  manifest: { schemaVersion: 1, game: 'poe1', locale: 'zh-CN', league: 'Test', patch: 'test', generatedAt: '2026-07-21T00:00:00Z', checksum: 'test', sources: [] },
  bases: [{ id: 'base:ring', sourceId: 'Ring', name: '测试戒指', category: '首饰', itemClass: '戒指', imageId: 'placeholder', requiredLevel: 1, tags: ['ring'], maxAffixes: { prefix: 3, suffix: 3 }, allowedVariants: ['normal', 'fractured', 'influenced', 'synthesized', 'eldritch'] }],
  modifiers: [
    makeModifier('mod:life', 'life', '生命', 'prefix', 1, ['life']),
    makeModifier('mod:mana', 'mana', '魔力', 'prefix', 9, ['mana']),
    makeModifier('mod:fire', 'fire', '火焰抗性', 'suffix', 1, ['fire']),
    makeModifier('mod:cold', 'cold', '冰霜抗性', 'suffix', 9, ['cold']),
    makeModifier('mod:crafted-life', 'crafted-life', '工艺生命', 'prefix', 0, ['life'], 'crafted')
  ],
  crafts: [], images: { placeholder: 'images/placeholder.svg' }
})

const request = { baseId: 'base:ring', itemLevel: 84, variant: { kind: 'normal' }, targets: [{ modifierId: 'mod:life', minTier: 1, sourcePolicy: 'natural' }] }

test('请求校验检测 Mod Group 冲突、容量和破裂参数', () => {
  assert.equal(validateCraftRequest(request, dataset).valid, true)
  const conflictDataset = structuredClone(dataset)
  conflictDataset.modifiers[1].groupId = 'life'
  const conflict = validateCraftRequest({ ...request, targets: [...request.targets, { modifierId: 'mod:mana', minTier: 1, sourcePolicy: 'natural' }] }, conflictDataset)
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
  const interval = wilsonInterval(100, 1000)
  assert.ok(interval.low < 0.1 && interval.high > 0.1)
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
  assert.ok(influenced.candidates.some((entry) => entry.id === 'harvest-reforge-influence'))

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
