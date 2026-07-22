import test from 'node:test'
import assert from 'node:assert/strict'
import { bucketModifierFamilies, createDefaultActionRegistry, pickWeighted } from '../electron/modules/crafting/actionProviders.js'
import { allTargetsSatisfied, createEligibleModifierTierResolver, createInitialCraftState, createTargetMatcher, eligibleModifierTiers, qualifyingCraftedOptions, validateCraftRequest, valuesMeetThreshold } from '../electron/modules/crafting/craftState.js'
import { CRAFTING_SCHEMA_VERSION, normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { advanceSimulationAccumulator, createSeededRandom, createSimulationAccumulator, generateStrategyCandidates, optimizeCrafting, simulateCandidate, simulationAccumulatorResult, weightedTargetProbability, wilsonInterval } from '../electron/modules/crafting/optimizer.js'
import { modifierMatchesBase } from '../electron/modules/crafting/variantRules.js'

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
