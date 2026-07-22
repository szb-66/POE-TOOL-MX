import { createEligibleModifierTierResolver, createInitialCraftState, createTargetMatcher, qualifyingCraftedOptions, validateCraftRequest } from './craftState.js'
import { createDefaultActionRegistry } from './actionProviders.js'

export function createSeededRandom(seed = 0x9e3779b9) {
  let state = Number(seed) >>> 0 || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 0x100000000
  }
}

export function weightedTargetProbability(entries, predicate) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.weight) || 0), 0)
  if (!(total > 0)) return 0
  const success = entries.filter(predicate).reduce((sum, entry) => sum + Math.max(0, Number(entry.weight) || 0), 0)
  return success / total
}

export function wilsonInterval(successes, samples, z = 1.96) {
  if (!samples) return { low: 0, high: 1 }
  const p = successes / samples
  const denominator = 1 + (z * z) / samples
  const centre = (p + (z * z) / (2 * samples)) / denominator
  const margin = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * samples)) / samples)) / denominator
  return { low: Math.max(0, centre - margin), high: Math.min(1, centre + margin) }
}

function sumCosts(costs) {
  const resources = new Map()
  costs.flat().forEach((entry) => {
    const current = resources.get(entry.resourceId) ?? { ...entry, amount: 0 }
    current.amount += Number(entry.amount) || 0
    resources.set(entry.resourceId, current)
  })
  return [...resources.values()]
}

function chaosCost(resources, priceMap) {
  const missing = []
  let total = 0
  resources.forEach((entry) => {
    const price = Number(priceMap[entry.resourceId])
    if (!(price > 0)) missing.push(entry)
    else total += entry.amount * price
  })
  return { valid: missing.length === 0, total, missing }
}

function coreCost(key, name, amount = 1) {
  return [{ resourceId: `currency:${key}`, resourceName: name, amount }]
}

function findCraft(dataset, effectKind, tag = null) {
  return dataset.crafts.find((craft) => craft.effectKind === effectKind
    && (tag === null || craft.params?.tag === tag)
    && craft.cost?.length)
}

function targetTags(request, dataset) {
  return [...new Set(request.targets.flatMap((target) => dataset.modifiers.find((entry) => entry.goalId === target.goalId)?.tags ?? []))]
    .filter((tag) => tag && tag !== 'default')
}

function buildCandidate({ id, name, steps, initialCosts = [], attemptCosts = [], retryCosts = [], successCosts = [], run }) {
  const nodes = steps.map((step, index) => ({ id: `${id}:step:${index + 1}`, ...step }))
  const edges = nodes.flatMap((node, index) => [
    { from: node.id, to: nodes[index + 1]?.id || 'success', outcome: 'success' },
    { from: node.id, to: /重置|重新准备|回到/.test(node.failure) ? nodes[0].id : node.id, outcome: /停止|不可执行/.test(node.failure) ? 'stop' : 'retry' }
  ])
  return {
    id, name, steps, initialCosts, attemptCosts, retryCosts, successCosts,
    costs: attemptCosts, setupCosts: initialCosts, run,
    graph: { start: nodes[0]?.id || 'success', nodes, edges, terminal: 'success' }
  }
}

function cloneSimulationState(state) {
  return {
    rarity: state.rarity,
    prefixes: state.prefixes.map((affix) => ({ ...affix })),
    suffixes: state.suffixes.map((affix) => ({ ...affix })),
    influences: [...state.influences],
    implicits: [...state.implicits],
    meta: { ...state.meta }
  }
}

export function generateStrategyCandidates(request, dataset, registry = createDefaultActionRegistry()) {
  const validation = validateCraftRequest(request, dataset)
  if (!validation.valid) return { validation, candidates: [] }
  request = validation.request
  const { base, initialState } = validation
  const naturalTargets = request.targets.filter((target) => dataset.modifiers.find((entry) => entry.goalId === target.goalId)?.source !== 'crafted')
  const targetsByType = naturalTargets.reduce((counts, target) => {
    const modifier = dataset.modifiers.find((entry) => entry.goalId === target.goalId)
    counts[modifier.affixType] += 1
    return counts
  }, { prefix: 0, suffix: 0 })
  const candidates = []
  const resolveEligibleModifierTiers = createEligibleModifierTierResolver(dataset, base, request.itemLevel, request.variant)
  const context = (state, rng) => ({ state, dataset, base, request, rng, resolveEligibleModifierTiers })

  if (initialState.rarity === 'normal' && naturalTargets.length <= 2 && targetsByType.prefix <= 1 && targetsByType.suffix <= 1) {
    candidates.push(buildCandidate({
      id: 'alteration-spam', name: '改造石循环',
      steps: [
        { name: '蜕变为魔法物品', success: '获得魔法底材', failure: '无' },
        { name: '反复使用改造石', success: '所有目标词缀达到最低阶级', failure: '继续使用改造石' }
      ],
      initialCosts: coreCost('transmutation', '蜕变石'),
      retryCosts: coreCost('alteration', '改造石'),
      run: (rng) => registry.apply('currency:transmutation', context(cloneSimulationState(initialState), rng))
    }))
  }

  candidates.push(buildCandidate({
    id: 'chaos-spam', name: '混沌石重铸循环',
    steps: initialState.rarity === 'normal'
      ? [{ name: '使用点金石变为稀有物品', success: '所有目标满足', failure: '使用混沌石继续重铸' }]
      : [{ name: '使用混沌石重铸稀有物品', success: '所有目标满足', failure: '继续使用混沌石' }],
    initialCosts: initialState.rarity === 'normal' ? coreCost('alchemy', '点金石') : [],
    attemptCosts: initialState.rarity === 'rare' ? coreCost('chaos', '混沌石') : [],
    retryCosts: initialState.rarity === 'normal' ? coreCost('chaos', '混沌石') : [],
    run: (rng) => registry.apply(initialState.rarity === 'normal' ? 'currency:alchemy' : 'currency:chaos', context(cloneSimulationState(initialState), rng))
  }))

  if (initialState.rarity === 'normal') {
    candidates.push(buildCandidate({
      id: 'alchemy-scour', name: '点金石与重铸石循环',
      steps: [{ name: '使用点金石生成稀有物品', success: '所有目标满足', failure: '使用重铸石后重新点金' }],
      initialCosts: coreCost('alchemy', '点金石'),
      retryCosts: sumCosts([coreCost('scouring', '重铸石'), coreCost('alchemy', '点金石')]),
      run: (rng) => registry.apply('currency:alchemy', context(cloneSimulationState(initialState), rng))
    }))
  }

  for (const tag of targetTags(request, dataset).slice(0, 8)) {
    const craft = findCraft(dataset, 'reforge_tag', tag)
    if (!craft) continue
    candidates.push(buildCandidate({
      id: `harvest-reforge-${tag}`, name: `花园 ${tag} 标签重铸`,
      steps: [
        ...(initialState.rarity === 'normal' ? [{ name: '使用点金石准备稀有底材', success: '可以使用花园工艺', failure: '停止' }] : []),
        { name: `使用带 ${tag} 标签的花园重铸`, success: '所有目标满足', failure: '继续重铸' }
      ],
      initialCosts: initialState.rarity === 'normal' ? coreCost('alchemy', '点金石') : [],
      attemptCosts: craft.cost,
      run: (rng) => {
        const state = cloneSimulationState(initialState)
        if (state.rarity === 'normal') registry.apply('currency:alchemy', context(state, rng))
        return registry.apply('harvest:reforge-tag', { ...context(state, rng), tag })
      }
    }))
  }

  const craftedTargets = request.targets.map((target) => {
    const modifier = dataset.modifiers.find((entry) => entry.goalId === target.goalId)
    const requiredTier = modifier?.tiers.find((tier) => tier.id === target.minTierId)
    const option = requiredTier ? qualifyingCraftedOptions(modifier, requiredTier, base, request.itemLevel)[0] : null
    return option ? { target, modifier, option } : null
  }).filter(Boolean)
  if (craftedTargets.length && craftedTargets.length <= 2) {
    const needsMultimod = craftedTargets.length > 1
    const multimodCraft = needsMultimod ? findCraft(dataset, 'multimod') : null
    if (!needsMultimod || multimodCraft) {
      candidates.push(buildCandidate({
        id: 'bench-finish', name: craftedTargets.length > 1 ? '点金/重铸准备 + 多大师收尾' : '点金/重铸准备 + 工艺台收尾',
        steps: [
          ...(initialState.rarity === 'normal' ? [{ name: '使用点金石准备稀有底材', success: '目标工艺均有空位', failure: '重铸后重新点金' }] : []),
          ...(needsMultimod ? [{ name: '工艺台添加“可以拥有最多 3 个工艺词缀”', success: '占用一条后缀并开启多大师', failure: '后缀不足则重新准备' }] : []),
          ...craftedTargets.map(({ modifier, option }) => ({ name: `工艺台添加 ${option.text || modifier.name}`, success: '添加目标工艺词缀', failure: '词缀位、工艺数量或 Mod Group 不合法则重新准备' }))
        ],
        initialCosts: initialState.rarity === 'normal' ? coreCost('alchemy', '点金石') : [],
        retryCosts: initialState.rarity === 'normal' ? sumCosts([coreCost('scouring', '重铸石'), coreCost('alchemy', '点金石')]) : [],
        successCosts: sumCosts([multimodCraft?.cost ?? [], craftedTargets.flatMap(({ option }) => option.cost)]),
        run: (rng) => {
          const state = cloneSimulationState(initialState)
          try {
            if (state.rarity === 'normal') registry.apply('currency:alchemy', context(state, rng))
            if (needsMultimod) registry.apply('bench:multimod', context(state, rng))
            craftedTargets.forEach(({ modifier, option }) => registry.apply('bench:add-crafted', { ...context(state, rng), modifier, option }))
            return state
          } catch {
            return { state, valid: false }
          }
        }
      }))
    }
  }

  return { validation, candidates: [...new Map(candidates.map((candidate) => [candidate.id, candidate])).values()] }
}

function geometricQuantile(probability, quantile) {
  if (!(probability > 0)) return Infinity
  if (probability >= 1) return 1
  return Math.max(1, Math.ceil(Math.log(1 - quantile) / Math.log(1 - probability)))
}

export function createSimulationAccumulator(candidate, request, dataset, { seed = 1, signal = null } = {}) {
  return {
    candidate,
    rng: createSeededRandom(seed),
    signal,
    matchesTargets: createTargetMatcher(request, dataset),
    samples: 0,
    successes: 0
  }
}

export function advanceSimulationAccumulator(accumulator, targetSamples) {
  while (accumulator.samples < targetSamples) {
    if (accumulator.signal?.aborted) throw new Error('计算已取消')
    const outcome = accumulator.candidate.run(accumulator.rng)
    const state = outcome?.state ?? outcome
    if (outcome?.valid !== false && accumulator.matchesTargets(state)) accumulator.successes += 1
    accumulator.samples += 1
  }
  return accumulator
}

function scaleCosts(costs, multiplier) {
  return costs.map((entry) => ({ ...entry, amount: entry.amount * multiplier }))
}

function resourcesForAttempts(candidate, attempts) {
  return sumCosts([
    candidate.initialCosts,
    scaleCosts(candidate.attemptCosts, attempts),
    scaleCosts(candidate.retryCosts, Math.max(0, attempts - 1)),
    candidate.successCosts
  ])
}

function pricedCostForAttempts(candidate, attempts, priceMap) {
  return chaosCost(resourcesForAttempts(candidate, attempts), priceMap)
}

export function simulationAccumulatorResult(accumulator, priceMap) {
  const { candidate, samples, successes } = accumulator
  const probability = successes / samples
  const confidence95 = wilsonInterval(successes, samples)
  if (!successes) return { candidateId: candidate.id, name: candidate.name, samples, successes, reliable: false, successProbability: 0, confidence95, unpriced: false }
  const expectedAttempts = 1 / probability
  const resources = resourcesForAttempts(candidate, expectedAttempts)
  const priced = chaosCost(resources, priceMap)
  const expectedChaos = priced.valid ? priced.total : null
  const lowerPrice = confidence95.high > 0 ? pricedCostForAttempts(candidate, 1 / confidence95.high, priceMap) : null
  const upperPrice = confidence95.low > 0 ? pricedCostForAttempts(candidate, 1 / confidence95.low, priceMap) : null
  const p50Price = pricedCostForAttempts(candidate, geometricQuantile(probability, 0.5), priceMap)
  const p90Price = pricedCostForAttempts(candidate, geometricQuantile(probability, 0.9), priceMap)
  return {
    candidateId: candidate.id, name: candidate.name, samples, successes, reliable: true,
    successProbability: probability, expectedAttempts, confidence95,
    expectedChaos, p50Chaos: p50Price.valid ? p50Price.total : null,
    p90Chaos: p90Price.valid ? p90Price.total : null,
    expectedChaosConfidence95: { low: lowerPrice?.valid ? lowerPrice.total : null, high: upperPrice?.valid ? upperPrice.total : null }, resources,
    unpriced: !priced.valid, missingPrices: priced.missing,
    steps: candidate.steps, strategyGraph: candidate.graph, scopeNotice: '在当前支持的工艺与策略中最优'
  }
}

export function simulateCandidate(candidate, request, dataset, priceMap, { samples, seed = 1, signal = null } = {}) {
  const accumulator = createSimulationAccumulator(candidate, request, dataset, { seed, signal })
  advanceSimulationAccumulator(accumulator, samples)
  return simulationAccumulatorResult(accumulator, priceMap)
}

async function advanceSimulationInBatches(accumulator, targetSamples, batchSize = 10_000) {
  while (accumulator.samples < targetSamples) {
    advanceSimulationAccumulator(accumulator, Math.min(targetSamples, accumulator.samples + batchSize))
    if (accumulator.samples < targetSamples) await new Promise((resolve) => setImmediate(resolve))
  }
}

function rankResults(results) {
  return results.filter((result) => result.reliable && !result.unpriced && Number.isFinite(result.expectedChaos))
    .sort((a, b) => a.expectedChaos - b.expectedChaos || b.successProbability - a.successProbability)
}

export async function optimizeCrafting(requestInput, dataset, priceMap, options = {}) {
  const registry = options.registry ?? createDefaultActionRegistry()
  const generated = generateStrategyCandidates(requestInput, dataset, registry)
  if (!generated.validation.valid) return { valid: false, errors: generated.validation.errors, phase: 'validation', plans: [], unpriced: [] }
  const request = generated.validation.request
  const quickSamples = Math.max(100, options.quickSamples ?? 10000)
  const refineMinimum = Math.max(quickSamples, options.refineMinimum ?? 100000)
  const refineMaximum = Math.max(refineMinimum, options.refineMaximum ?? 500000)
  const confidenceRelativeWidth = Math.max(0.01, Math.min(0.2, options.confidenceRelativeWidth ?? 0.05))
  const seed = options.seed ?? 0x51f15e
  const quick = []
  const accumulators = []
  for (let index = 0; index < generated.candidates.length; index += 1) {
    const candidate = generated.candidates[index]
    const accumulator = createSimulationAccumulator(candidate, request, dataset, { seed: seed + index * 7919, signal: options.signal })
    accumulators.push(accumulator)
    await advanceSimulationInBatches(accumulator, quickSamples)
    quick.push(simulationAccumulatorResult(accumulator, priceMap))
    options.onProgress?.({ phase: 'quick', completed: index + 1, total: generated.candidates.length })
    if (index % 2 === 1) await new Promise((resolve) => setImmediate(resolve))
  }
  const quickRanked = rankResults(quick).slice(0, 3).map((plan, index) => ({ ...plan, rank: index + 1, phase: 'quick', datasetVersion: dataset.manifest.patch, priceTime: options.priceTime || 'unknown' }))
  options.onResult?.({ valid: true, phase: 'quick', plans: quickRanked, unpriced: quick.filter((entry) => entry.unpriced), unreliable: quick.filter((entry) => !entry.reliable) })

  const rankedQuick = rankResults(quick)
  const bestQuickCost = rankedQuick[0]?.expectedChaos ?? Infinity
  const lowerBoundById = new Map(generated.candidates.map((candidate) => {
    const priced = pricedCostForAttempts(candidate, 1, priceMap)
    return [candidate.id, priced.valid ? priced.total : Infinity]
  }))
  const leadingIds = new Set(rankedQuick
    .filter((entry) => lowerBoundById.get(entry.candidateId) <= bestQuickCost * 3)
    .slice(0, 8)
    .map((entry) => entry.candidateId))
  const refined = []
  for (let index = 0; index < generated.candidates.length; index += 1) {
    const candidate = generated.candidates[index]
    if (!leadingIds.has(candidate.id)) continue
    const accumulator = accumulators[index]
    let samples = refineMinimum
    await advanceSimulationInBatches(accumulator, samples)
    let result = simulationAccumulatorResult(accumulator, priceMap)
    while (result.reliable && samples < refineMaximum) {
      const width = result.confidence95.high - result.confidence95.low
      const relativeWidth = result.successProbability > 0 ? width / result.successProbability : Infinity
      if (relativeWidth <= confidenceRelativeWidth) break
      samples = Math.min(refineMaximum, samples + 50000)
      await advanceSimulationInBatches(accumulator, samples)
      result = simulationAccumulatorResult(accumulator, priceMap)
    }
    refined.push(result)
    options.onProgress?.({ phase: 'refined', completed: refined.length, total: leadingIds.size, samples })
  }
  const refinedRanked = rankResults(refined).slice(0, 3).map((plan, index) => ({ ...plan, rank: index + 1, phase: 'refined', datasetVersion: dataset.manifest.patch, priceTime: options.priceTime || 'unknown' }))
  const final = { valid: true, phase: 'refined', plans: refinedRanked, unpriced: [...quick, ...refined].filter((entry) => entry.unpriced), unreliable: [...quick, ...refined].filter((entry) => !entry.reliable), candidates: generated.candidates.length }
  options.onResult?.(final)
  return final
}
