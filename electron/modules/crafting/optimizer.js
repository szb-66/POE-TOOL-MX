import { stableCraftingId } from './model.js'
import { allTargetsSatisfied, createInitialCraftState, qualifyingCraftedOptions, validateCraftRequest } from './craftState.js'
import { createDefaultActionRegistry, rollItem } from './actionProviders.js'

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

function findCraftCost(dataset, effectKind, tag, fallback) {
  const candidates = dataset.crafts.filter((craft) => craft.effectKind === effectKind && (!tag || !craft.params?.tag || craft.params.tag === tag))
  return candidates.find((craft) => craft.cost.length)?.cost ?? fallback
}

function harvestFallback(tag) {
  const resourceName = ['cold', 'physical', 'chaos', 'speed'].includes(tag) ? '活性黄晶命能' : ['lightning', 'defences', 'caster', 'critical', 'minion'].includes(tag) ? '原始蓝晶命能' : '狂野紫晶命能'
  return [{ resourceId: stableCraftingId('resource', resourceName), resourceName, amount: 100 }]
}

function targetTags(request, dataset) {
  return [...new Set(request.targets.flatMap((target) => dataset.modifiers.find((entry) => entry.goalId === target.goalId)?.tags ?? []))]
    .filter((tag) => !['damage', 'attack', 'caster', 'default'].includes(tag))
}

function buildCandidate({ id, name, steps, costs, setupCosts = [], run }) {
  const nodes = steps.map((step, index) => ({ id: `${id}:step:${index + 1}`, ...step }))
  const edges = nodes.flatMap((node, index) => [
    { from: node.id, to: nodes[index + 1]?.id || 'success', outcome: 'success' },
    { from: node.id, to: /重置|重新准备|回到/.test(node.failure) ? nodes[0].id : node.id, outcome: /停止|不可执行/.test(node.failure) ? 'stop' : 'retry' }
  ])
  return { id, name, steps, costs, setupCosts, run, graph: { start: nodes[0]?.id || 'success', nodes, edges, terminal: 'success' } }
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
  const context = (state, rng) => ({ state, dataset, base, request, rng })

  if (naturalTargets.length <= 2 && targetsByType.prefix <= 1 && targetsByType.suffix <= 1) {
    candidates.push(buildCandidate({
      id: 'alteration-spam', name: '改造石循环',
      steps: [
        { name: '蜕变为魔法物品', success: '获得魔法底材', failure: '无' },
        { name: '反复使用改造石', success: '所有目标词缀达到最低阶级', failure: '继续使用改造石' }
      ],
      setupCosts: coreCost('transmutation', '蜕变石'), costs: coreCost('alteration', '改造石'),
      run: (rng) => { const state = structuredClone(initialState); state.rarity = 'magic'; return rollItem(context(state, rng), 'magic') }
    }))
  }

  candidates.push(buildCandidate({
    id: 'chaos-spam', name: '混沌石重铸循环',
    steps: [{ name: '反复使用混沌石', success: '所有目标词缀同时达到最低阶级', failure: '继续使用混沌石' }],
    costs: coreCost('chaos', '混沌石'),
    run: (rng) => { const state = structuredClone(initialState); state.rarity = 'rare'; return rollItem(context(state, rng), 'rare') }
  }))

  candidates.push(buildCandidate({
    id: 'alchemy-scour', name: '点金石与重铸石循环',
    steps: [
      { name: '使用点金石生成稀有物品', success: '所有目标满足', failure: '使用重铸石后重新点金' }
    ],
    costs: sumCosts([coreCost('alchemy', '点金石'), coreCost('scouring', '重铸石')]),
    run: (rng) => { const state = structuredClone(initialState); state.rarity = 'rare'; return rollItem(context(state, rng), 'rare') }
  }))

  for (const tag of targetTags(request, dataset).slice(0, 8)) {
    candidates.push(buildCandidate({
      id: `harvest-reforge-${tag}`, name: `花园 ${tag} 标签重铸`,
      steps: [{ name: `使用带 ${tag} 标签的花园重铸`, success: '所有目标满足', failure: '继续重铸' }],
      costs: findCraftCost(dataset, 'reforge_tag', tag, harvestFallback(tag)),
      run: (rng) => { const state = structuredClone(initialState); state.rarity = 'rare'; return rollItem(context(state, rng), 'rare', { requiredTag: tag }) }
    }))
  }

  if (naturalTargets.length === 1) {
    candidates.push(buildCandidate({
      id: 'exalted-finish', name: '崇高石补词缀',
      steps: [{ name: '为有空位的稀有底材使用崇高石', success: '补出目标词缀', failure: '重置底材后重试' }],
      costs: coreCost('exalted', '崇高石'),
      run: (rng) => {
        const state = structuredClone(initialState)
        state.rarity = 'rare'
        try { return registry.apply('currency:exalted', context(state, rng)) } catch { return state }
      }
    }))
  }

  const craftedTargets = request.targets.map((target) => {
    const modifier = dataset.modifiers.find((entry) => entry.goalId === target.goalId)
    const requiredTier = modifier?.tiers.find((tier) => tier.id === target.minTierId)
    const option = requiredTier ? qualifyingCraftedOptions(modifier, requiredTier, base, request.itemLevel)[0] : null
    return option ? { target, modifier, option } : null
  }).filter(Boolean)
  if (craftedTargets.length && craftedTargets.length <= 3) {
    const needsMultimod = craftedTargets.length > 1
    candidates.push(buildCandidate({
      id: 'bench-finish', name: craftedTargets.length > 1 ? '多大师工艺收尾' : '工艺台收尾',
      steps: [
        ...(needsMultimod ? [{ name: '工艺台添加“可以拥有多个工艺词缀”', success: '允许继续添加多个工艺词缀', failure: '没有空后缀则不可执行' }] : []),
        ...craftedTargets.map(({ modifier, option }) => ({ name: `工艺台添加 ${option.text || modifier.name}`, success: '添加目标工艺词缀', failure: '词缀位不足则不可执行' }))
      ],
      costs: sumCosts([needsMultimod ? coreCost('divine', '神圣石', 2) : [], craftedTargets.flatMap(({ option }) => option.cost)]),
      run: () => {
        const state = structuredClone(initialState)
        state.rarity = 'rare'
        if (needsMultimod) registry.apply('bench:multimod', context(state, () => 0))
        craftedTargets.forEach(({ modifier, option }) => {
          try { registry.apply('bench:add-crafted', { ...context(state, () => 0), modifier, option }) } catch {}
        })
        return state
      }
    }))
  }

  for (const tag of targetTags(request, dataset).slice(0, 4)) {
    candidates.push(buildCandidate({
      id: `harvest-remove-add-${tag}`, name: `花园移除并添加 ${tag} 词缀`,
      steps: [
        { name: '先获得可继续加工的稀有物品', success: '存在可移除词缀', failure: '重置后重试' },
        { name: `移除一个随机词缀并添加 ${tag} 词缀`, success: '所有目标满足', failure: '重新准备底材' }
      ],
      costs: sumCosts([coreCost('chaos', '混沌石'), findCraftCost(dataset, 'remove_add_tag', tag, [{ ...harvestFallback(tag)[0], amount: 15000 }])]),
      run: (rng) => {
        const state = structuredClone(initialState); state.rarity = 'rare'
        rollItem(context(state, rng), 'rare')
        try { return registry.apply('harvest:remove-add-tag', { ...context(state, rng), tag }) } catch { return state }
      }
    }))
  }

  const conversionPairs = { fire: ['cold', 'lightning'], cold: ['fire', 'lightning'], lightning: ['fire', 'cold'] }
  for (const toTag of targetTags(request, dataset).filter((tag) => conversionPairs[tag]).slice(0, 3)) {
    for (const fromTag of conversionPairs[toTag]) {
      candidates.push(buildCandidate({
        id: `harvest-convert-${fromTag}-${toTag}`, name: `花园将 ${fromTag} 转换为 ${toTag}`,
        steps: [{ name: `先重铸出 ${fromTag} 词缀`, success: `获得可转换的 ${fromTag} 词缀`, failure: '重新重铸' }, { name: `转换为 ${toTag} 词缀`, success: '所有目标满足', failure: '重新准备底材' }],
        costs: sumCosts([findCraftCost(dataset, 'reforge_tag', fromTag, harvestFallback(fromTag)), findCraftCost(dataset, 'convert_tag', toTag, [{ ...harvestFallback(toTag)[0], amount: 500 }])]),
        run: (rng) => {
          const state = structuredClone(initialState); state.rarity = 'rare'
          rollItem(context(state, rng), 'rare', { requiredTag: fromTag })
          try { return registry.apply('harvest:convert-tag', { ...context(state, rng), fromTag, toTag }) } catch { return state }
        }
      }))
    }
  }

  if (request.variant.kind === 'influenced') {
    candidates.push(buildCandidate({
      id: 'harvest-reforge-influence', name: '花园势力词缀重铸',
      steps: [{ name: '重铸势力稀有物品并保证一个势力词缀', success: '所有目标满足', failure: '继续重铸' }],
      costs: findCraftCost(dataset, 'reforge_influence', null, [{ resourceId: stableCraftingId('resource', '原始蓝晶命能'), resourceName: '原始蓝晶命能', amount: 5000 }]),
      run: (rng) => { const state = structuredClone(initialState); state.rarity = 'rare'; return rollItem(context(state, rng), 'rare') }
    }))
  }

  const fracturedAffixes = [...initialState.prefixes, ...initialState.suffixes]
  if (fracturedAffixes.length && naturalTargets.length > 1) {
    const fractureType = initialState.prefixes.some((entry) => entry.fractured) ? 'prefix' : 'suffix'
    for (const tag of targetTags(request, dataset).slice(0, 3)) {
      const lockId = fractureType === 'prefix' ? 'bench:lock-prefixes' : 'bench:lock-suffixes'
      const lockName = fractureType === 'prefix' ? '前缀无法被变更' : '后缀无法被变更'
      candidates.push(buildCandidate({
        id: `meta-lock-${fractureType}-${tag}`, name: `${lockName}后花园重铸`,
        steps: [{ name: `工艺台添加${lockName}`, success: '保护已完成词缀', failure: '无法添加则停止' }, { name: `花园 ${tag} 标签重铸`, success: '完成剩余目标', failure: '重新添加元工艺后重试' }],
        costs: sumCosts([coreCost('divine', '神圣石', 2), findCraftCost(dataset, 'reforge_tag', tag, harvestFallback(tag))]),
        run: (rng) => {
          const state = structuredClone(initialState); state.rarity = 'rare'
          registry.apply(lockId, context(state, rng))
          return registry.apply('harvest:reforge-tag', { ...context(state, rng), tag })
        }
      }))
    }
    candidates.push(buildCandidate({
      id: `meta-annul-${fractureType}`, name: `保护${fractureType === 'prefix' ? '前缀' : '后缀'}后无效清理`,
      steps: [{ name: '混沌石生成候选稀有物品', success: '保留部分目标', failure: '重新重铸' }, { name: `锁定${fractureType === 'prefix' ? '前缀' : '后缀'}并使用无效石`, success: '移除非目标词缀后保留继续加工空间', failure: '回到重铸步骤' }],
      costs: sumCosts([coreCost('chaos', '混沌石'), coreCost('divine', '神圣石', 2), coreCost('annulment', '无效石')]),
      run: (rng) => {
        const state = structuredClone(initialState); state.rarity = 'rare'
        rollItem(context(state, rng), 'rare')
        registry.apply(fractureType === 'prefix' ? 'bench:lock-prefixes' : 'bench:lock-suffixes', context(state, rng))
        try { return registry.apply('currency:annulment', context(state, rng)) } catch { return state }
      }
    }))
  }

  return { validation, candidates: [...new Map(candidates.map((candidate) => [candidate.id, candidate])).values()] }
}

function geometricQuantile(probability, quantile) {
  if (!(probability > 0)) return Infinity
  if (probability >= 1) return 1
  return Math.max(1, Math.ceil(Math.log(1 - quantile) / Math.log(1 - probability)))
}

export function simulateCandidate(candidate, request, dataset, priceMap, { samples, seed = 1, signal = null } = {}) {
  const rng = createSeededRandom(seed)
  let successes = 0
  for (let index = 0; index < samples; index += 1) {
    if (signal?.aborted) throw new Error('计算已取消')
    const state = candidate.run(rng)
    if (allTargetsSatisfied(request, state, dataset)) successes += 1
  }
  const probability = successes / samples
  const confidence95 = wilsonInterval(successes, samples)
  if (!successes) return { candidateId: candidate.id, name: candidate.name, samples, successes, reliable: false, successProbability: 0, confidence95, unpriced: false }
  const expectedAttempts = 1 / probability
  const repeated = candidate.costs.map((entry) => ({ ...entry, amount: entry.amount * expectedAttempts }))
  const resources = sumCosts([candidate.setupCosts, repeated])
  const priced = chaosCost(resources, priceMap)
  const perAttemptPrice = chaosCost(candidate.costs, priceMap)
  const setupPrice = chaosCost(candidate.setupCosts, priceMap)
  const attemptCost = perAttemptPrice.valid ? perAttemptPrice.total : 0
  const fixedCost = setupPrice.valid ? setupPrice.total : 0
  const expectedChaos = priced.valid ? priced.total : null
  const lowerExpected = confidence95.high > 0 ? fixedCost + attemptCost / confidence95.high : null
  const upperExpected = confidence95.low > 0 ? fixedCost + attemptCost / confidence95.low : null
  return {
    candidateId: candidate.id, name: candidate.name, samples, successes, reliable: true,
    successProbability: probability, expectedAttempts, confidence95,
    expectedChaos, p50Chaos: priced.valid ? fixedCost + geometricQuantile(probability, 0.5) * attemptCost : null,
    p90Chaos: priced.valid ? fixedCost + geometricQuantile(probability, 0.9) * attemptCost : null,
    expectedChaosConfidence95: { low: lowerExpected, high: upperExpected }, resources,
    unpriced: !priced.valid, missingPrices: priced.missing,
    steps: candidate.steps, strategyGraph: candidate.graph, scopeNotice: '在当前支持的工艺与策略中最优'
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
  for (let index = 0; index < generated.candidates.length; index += 1) {
    const candidate = generated.candidates[index]
    quick.push(simulateCandidate(candidate, request, dataset, priceMap, { samples: quickSamples, seed: seed + index * 7919, signal: options.signal }))
    options.onProgress?.({ phase: 'quick', completed: index + 1, total: generated.candidates.length })
    if (index % 2 === 1) await new Promise((resolve) => setImmediate(resolve))
  }
  const quickRanked = rankResults(quick).slice(0, 3).map((plan, index) => ({ ...plan, rank: index + 1, phase: 'quick', datasetVersion: dataset.manifest.patch, priceTime: options.priceTime || 'unknown' }))
  options.onResult?.({ valid: true, phase: 'quick', plans: quickRanked, unpriced: quick.filter((entry) => entry.unpriced), unreliable: quick.filter((entry) => !entry.reliable) })

  const rankedQuick = rankResults(quick)
  const bestQuickCost = rankedQuick[0]?.expectedChaos ?? Infinity
  const lowerBoundById = new Map(generated.candidates.map((candidate) => {
    const priced = chaosCost(sumCosts([candidate.setupCosts, candidate.costs]), priceMap)
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
    let samples = refineMinimum
    let result = simulateCandidate(candidate, request, dataset, priceMap, { samples, seed: seed + index * 7919, signal: options.signal })
    while (result.reliable && samples < refineMaximum) {
      const width = result.confidence95.high - result.confidence95.low
      const relativeWidth = result.successProbability > 0 ? width / result.successProbability : Infinity
      if (relativeWidth <= confidenceRelativeWidth) break
      samples = Math.min(refineMaximum, samples + 50000)
      result = simulateCandidate(candidate, request, dataset, priceMap, { samples, seed: seed + index * 7919, signal: options.signal })
      await new Promise((resolve) => setImmediate(resolve))
    }
    refined.push(result)
    options.onProgress?.({ phase: 'refined', completed: refined.length, total: leadingIds.size, samples })
  }
  const refinedRanked = rankResults(refined).slice(0, 3).map((plan, index) => ({ ...plan, rank: index + 1, phase: 'refined', datasetVersion: dataset.manifest.patch, priceTime: options.priceTime || 'unknown' }))
  const final = { valid: true, phase: 'refined', plans: refinedRanked, unpriced: [...quick, ...refined].filter((entry) => entry.unpriced), unreliable: [...quick, ...refined].filter((entry) => !entry.reliable), candidates: generated.candidates.length }
  options.onResult?.(final)
  return final
}
