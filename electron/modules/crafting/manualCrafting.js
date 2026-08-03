import { BENCH_META_CRAFTS, addRandomAffix, bucketModifierFamilies, craftedAffixes, createDefaultActionRegistry, pickWeighted, rebuildMetaState, removeCraftedAffixes, rollItem, rolledAffix } from './actionProviders.js'
import { clearMutableAffixes, createEligibleModifierTierResolver, eligibleModifierTiers, mutableAffixes, removeAffix } from './craftState.js'
import { CHAOTIC_RESONATORS, FOSSIL_DEFINITIONS, FOSSIL_TAG_LABELS, createFossilPoolTransform, fossilPoolStats } from './fossilRules.js'
import { ELDRITCH_CURRENCY_DEFINITIONS, ELDRITCH_SOURCE_LABELS, conflictUpgradeChance, eldritchDominance, eldritchImplicitCandidates, replaceEldritchTier, rolledEldritchImplicit } from './eldritchRules.js'
import { HARVEST_CATEGORY_LABELS, HARVEST_INFLUENCES, HARVEST_LESS_MULTIPLIER, HARVEST_MORE_MULTIPLIER, HARVEST_TAG_LABELS, blockedByRollMeta, conversionSources, conversionTargets, createSameTypePoolTransform, existingHarvestTags, harvestCraftCategory, harvestUnavailableExplanation, isEquipmentHarvestCraft, qualityEffectMatchesBase } from './harvestRules.js'
import { INFLUENCE_CURRENCY_DEFINITIONS, INFLUENCE_LABELS, awakenersOrbUnavailableReason, createDonorAffix, dominanceCandidates, dominanceUnavailableReason, donorTierCandidates, influenceAffixes, influenceExaltedCandidates, influenceExaltedUnavailableReason, itemInfluences } from './influenceRules.js'
import { normalizeCraftState } from './model.js'
import { BENCH_SUPPORTED_ITEM_CLASSES, EQUIPMENT_ITEM_CLASSES, HOLLOW_FOSSIL_ITEM_CLASSES, craftedOptionMatchesBase, modifierMatchesBase, validateBaseVariant } from './variantRules.js'
import { VEILED_CURRENCY_DEFINITIONS, createVeiledGuaranteedAffix, createVeiledPlaceholder, pendingVeiledAffix, sampleVeiledOptions, veiledChaosPositions, veiledChaosUnavailableReason, veiledExaltedOutcomes, veiledExaltedUnavailableReason, veiledOptionView } from './veiledRules.js'
import { BEASTCRAFT_RECIPES, BEAST_ASPECT_RECIPES, BEAST_INFLUENCE_RECIPES, beastRecipeView, createAspectAffix } from './beastcraftRules.js'
import { applyCorruptedBenchRecipe, corruptedBenchCatalog } from './corruptedBenchRules.js'
import { createSockets, fullLinks, isBaseDefenceEntry, naturalSocketLimit, rollBaseEntries, rollBaseEntriesWithDefencePercentile, rollLinks, singletonLinks } from './equipmentPropertyRules.js'
import { CATALYST_LABELS } from './catalystRules.js'
import { VAAL_OUTCOME_LABELS, corruptedImplicitCandidates, replaceImplicitWithVaal, rollCorruptedImplicit } from './vaalRules.js'
import { SEASON_BASELINE } from '../../../shared/seasonBaseline.js'

const SCOURING_COST = { resourceId: 'currency:scouring', resourceName: '重铸石', amount: 1 }

export const MANUAL_SOURCE_GROUPS = [
  ['base', '基础'], ['shaper', '塑界者'], ['elder', '裂界者'], ['crusader', '圣战'],
  ['redeemer', '救赎者'], ['hunter', '狩猎者'], ['warlord', '督军'], ['delve', '地心探险'],
  ['incursion', '穿越'], ['veiled', '隐匿'], ['crafted', '工艺台'], ['essence', '精华']
].map(([id, label]) => ({ id, label }))

export function createSeededRng(seed = 1) {
  let value = (Number(seed) >>> 0) || 1
  const rng = () => {
    value ^= value << 13
    value ^= value >>> 17
    value ^= value << 5
    return (value >>> 0) / 0x100000000
  }
  rng.state = () => value >>> 0
  return rng
}

function normalizeVariant(value = {}) {
  return {
    kind: String(value.kind || 'normal'),
    influences: Array.isArray(value.influences) ? value.influences.map(String) : [],
    fracturedTierId: value.fracturedTierId ? String(value.fracturedTierId) : null,
    implicits: Array.isArray(value.implicits) ? value.implicits.map(String) : []
  }
}

export function createManualSession(dataset, input) {
  const base = dataset.bases.find((entry) => entry.id === input?.baseId)
  if (!base) throw new Error('所选底材不存在')
  const itemLevel = Math.max(1, Math.min(100, Math.trunc(Number(input.itemLevel) || 1)))
  if (itemLevel < base.requiredLevel) throw new Error(`物品等级不能低于底材需求等级 ${base.requiredLevel}`)
  const variant = normalizeVariant(input.variant)
  const validity = validateBaseVariant(base, variant)
  if (!validity.valid) throw new Error(validity.errors.map((entry) => entry.message).join('；'))
  const seed = (Number(input.seed) >>> 0) || 1
  const initialRng = createSeededRng(seed ^ 0x9e3779b9)
  const sockets = naturalSocketLimit(base, itemLevel) ? createSockets(1, base.requirements, initialRng) : []
  const baseDefence = rollBaseEntriesWithDefencePercentile(base.baseStats, initialRng)
  const initialState = normalizeCraftState({
    rarity: 'normal', influences: variant.influences, implicits: variant.implicits, quality: 0,
    baseDefencePercentile: baseDefence.percentile, baseStats: baseDefence.entries, baseImplicits: rollBaseEntries(base.implicitModifiers, initialRng),
    sockets, links: singletonLinks(sockets)
  })
  return {
    baseId: base.id,
    base: {
      id: base.id, name: base.name, displayName: base.displayName, itemClass: base.itemClass, categoryPath: base.categoryPath,
      maxAffixes: base.maxAffixes, requiredLevel: base.requiredLevel, requirements: base.requirements,
      qualityType: base.qualityType, socketLimit: base.socketLimit
    },
    itemLevel,
    variant,
    initialVariant: structuredClone(variant),
    seed,
    rngState: seed,
    state: structuredClone(initialState),
    initialState,
    awakenerDonor: null,
    initialAwakenerDonor: null,
    activeItemId: `item:${((Number(input.seed) >>> 0) || 1).toString(16)}:0`,
    pendingSplitResults: [],
    imprint: null,
    foreseeing: false,
    beastLevel: 83,
    history: [],
    future: []
  }
}

function normalizeSessionAux(session) {
  session.activeItemId = String(session.activeItemId || `item:${(Number(session.seed) >>> 0).toString(16)}:0`)
  session.pendingSplitResults = Array.isArray(session.pendingSplitResults) ? session.pendingSplitResults.map((entry) => ({
    itemId: String(entry.itemId), state: normalizeCraftState(entry.state), variant: normalizeVariant(entry.variant ?? session.variant)
  })) : []
  session.imprint = session.imprint && typeof session.imprint === 'object' ? {
    itemId: String(session.imprint.itemId), state: normalizeCraftState(session.imprint.state), variant: normalizeVariant(session.imprint.variant)
  } : null
  session.foreseeing = Boolean(session.foreseeing)
  session.beastLevel = Math.max(68, Math.min(100, Math.trunc(Number(session.beastLevel) || 83)))
  return session
}

function captureSessionAux(session) {
  normalizeSessionAux(session)
  return structuredClone({
    activeItemId: session.activeItemId,
    pendingSplitResults: session.pendingSplitResults,
    imprint: session.imprint,
    foreseeing: session.foreseeing
  })
}

function restoreSessionAux(session, snapshot) {
  const value = snapshot ?? {}
  session.activeItemId = value.activeItemId
  session.pendingSplitResults = value.pendingSplitResults
  session.imprint = value.imprint
  session.foreseeing = value.foreseeing
  return normalizeSessionAux(session)
}

function pendingSplitReason(session) {
  return session.pendingSplitResults?.length ? '请先选择一件分裂产物继续制作' : ''
}

function consumeForeseeing(session) {
  const consumed = Boolean(session.foreseeing)
  session.foreseeing = false
  return consumed
}

function beginItemMutation(inputSession) {
  const session = normalizeSessionAux(structuredClone(inputSession))
  const reason = pendingSplitReason(session)
  if (reason) throw new Error(reason)
  if (session.state.mirrored) throw new Error('镜像物品不能被修改')
  const auxBefore = captureSessionAux(session)
  consumeForeseeing(session)
  return { session, auxBefore }
}

function beastRollSources(session) {
  return ['natural']
}

function affixCapacity(state, base, affixType) {
  const key = affixType === 'prefix' ? 'prefixes' : 'suffixes'
  return state.rarity === 'rare' ? base.maxAffixes[affixType] - state[key].length : 1 - state[key].length
}

function beastAddCandidates(dataset, base, session, state, affixType, itemLevel = session.itemLevel, sources = beastRollSources(session)) {
  return eligibleModifierTiers(dataset, base, itemLevel, session.variant, state, { sources, affixType })
    .filter(({ modifier }) => !blockedByRollMeta(state, modifier))
}

function addRemoveOutcomes(dataset, base, session, addType, beastLevel) {
  if (affixCapacity(session.state, base, addType) <= 0) return []
  const removeType = addType === 'prefix' ? 'suffix' : 'prefix'
  const removeKey = removeType === 'prefix' ? 'prefixes' : 'suffixes'
  const locked = removeType === 'prefix' ? session.state.meta.prefixesLocked : session.state.meta.suffixesLocked
  const removable = locked ? [] : session.state[removeKey].filter((entry) => !entry.fractured)
  const removalChoices = removable.length ? removable : [null]
  return removalChoices.flatMap((removed) => {
    const state = normalizeCraftState(session.state)
    if (removed) removeAffix(state, state[removeKey].find((entry) => entry === removed || entry.tierId === removed.tierId && entry.modifierId === removed.modifierId))
    return beastAddCandidates(dataset, base, session, state, addType, beastLevel).map((candidate) => ({ removed, state, candidate }))
  })
}

function influenceCandidates(dataset, base, session, influence) {
  if (!session.state.influences.includes(influence)) return []
  return eligibleModifierTiers(dataset, base, session.itemLevel, session.variant, session.state, { sources: ['natural'] })
    .filter(({ modifier }) => modifier.influences?.includes(influence) && !blockedByRollMeta(session.state, modifier))
}

function randomMetaCandidates(session, base, registry) {
  const context = { state: session.state, base }
  return BENCH_META_CRAFTS.filter((definition) => registry.inspect(`bench:${definition.id}`, context).canApply)
}

function commonBeastReason(session) {
  return pendingSplitReason(session) || (session.state.corrupted ? '已腐化物品不能使用该野兽工艺' : '') || (session.state.mirrored ? '镜像物品不能使用该野兽工艺' : '')
}

function splitUnavailableReason(session, count) {
  const common = pendingSplitReason(session)
  if (common) return common
  const state = session.state
  const affixes = [...state.prefixes, ...state.suffixes]
  if (state.rarity !== 'rare') return '野兽分裂只能用于稀有物品'
  if (state.corrupted) return '已腐化物品不能分裂'
  if (state.mirrored) return '镜像物品不能分裂'
  if (state.enchanted) return '带附魔的物品不能分裂'
  if (state.split) return '已分裂物品不能再次分裂'
  if (state.influences.length || session.variant.kind === 'influenced') return '势力物品不能分裂'
  if (session.variant.kind === 'synthesized') return '综合物品不能分裂'
  if (session.variant.kind === 'fractured' || affixes.some((entry) => entry.fractured)) return '破裂物品不能分裂'
  if (count === 3 && affixes.length !== 6) return '三分配方要求物品恰好有 6 条显式词缀'
  if (count === 2 && affixes.length < 2) return '二分配方要求至少有 2 条显式词缀'
  return ''
}

function imprintUnavailableReason(session, restore = false) {
  const common = pendingSplitReason(session)
  if (common) return common
  if (!restore) {
    if (session.state.corrupted) return '已腐化物品不能创建拓印'
    if (session.state.rarity !== 'magic') return '只能为魔法物品创建拓印'
    return ''
  }
  if (!session.imprint) return '当前会话没有可用拓印'
  if (session.imprint.itemId !== session.activeItemId) return '拓印只绑定创建时的原物品'
  if (session.variant.kind === 'fractured' || [...session.state.prefixes, ...session.state.suffixes].some((entry) => entry.fractured)) return '拓印不能恢复到破裂物品'
  return ''
}

function hinekoraUnavailableReason(session) {
  const common = pendingSplitReason(session)
  if (common) return common
  if (session.state.rarity !== 'magic') return '该野兽配方只能对魔法物品应用希内科拉之锁'
  if (session.state.corrupted) return '已腐化魔法物品不能应用希内科拉之锁'
  if (session.state.mirrored) return '镜像物品不能应用希内科拉之锁'
  if (session.foreseeing) return '当前物品已经处于预见状态'
  return ''
}

function beastRecipeReason(dataset, base, session, recipe, registry, beastLevel) {
  if (!recipe.supported) return recipe.unsupportedReason
  const common = commonBeastReason(session)
  if (common && !['restore-imprint'].includes(recipe.id)) return common
  if (recipe.id === 'add-prefix-remove-suffix') return session.state.rarity !== 'rare' ? '该配方只能用于稀有物品' : addRemoveOutcomes(dataset, base, session, 'prefix', beastLevel).length ? '' : '当前状态没有可完成的合法新增前缀结果'
  if (recipe.id === 'add-suffix-remove-prefix') return session.state.rarity !== 'rare' ? '该配方只能用于稀有物品' : addRemoveOutcomes(dataset, base, session, 'suffix', beastLevel).length ? '' : '当前状态没有可完成的合法新增后缀结果'
  const influence = BEAST_INFLUENCE_RECIPES.find((entry) => entry.id === recipe.id)?.influence
  if (influence) {
    if (!session.state.influences.includes(influence)) return `仅能用于${recipe.label}物品`
    return influenceCandidates(dataset, base, session, influence).length ? '' : `当前状态没有可添加的${recipe.label}词缀`
  }
  if (recipe.id === 'add-random-meta') return randomMetaCandidates(session, base, registry).length ? '' : '五种元工艺中没有可正常添加的候选'
  if (recipe.category === 'aspect') {
    if ([...session.state.prefixes, ...session.state.suffixes].some((entry) => entry.groupId === 'beast-aspect')) return '当前装备已经拥有势技能词缀'
    if (affixCapacity(session.state, base, 'suffix') <= 0) return '当前装备后缀位已满'
    return ''
  }
  if (recipe.id === 'split-two') return splitUnavailableReason(session, 2)
  if (recipe.id === 'split-three') return splitUnavailableReason(session, 3)
  if (recipe.id === 'create-imprint') return imprintUnavailableReason(session, false)
  if (recipe.id === 'restore-imprint') return imprintUnavailableReason(session, true)
  if (recipe.id === 'apply-hinekora-lock') return hinekoraUnavailableReason(session)
  if (recipe.id === 'maximum-sockets') {
    const maximum = naturalSocketLimit(base, session.itemLevel)
    if (!maximum) return '该底材不能拥有彩色插槽'
    return session.state.sockets.length >= maximum ? `该物品已经拥有自然上限 ${maximum} 个插槽` : ''
  }
  if (recipe.id === 'maximum-links') {
    if (session.state.sockets.length < 2) return '最大连接配方要求物品至少有 2 个插槽'
    return session.state.links.length === 1 && session.state.links[0].length === session.state.sockets.length ? '当前物品的全部插槽已经连接' : ''
  }
  return '该配方尚未实现准确模拟'
}

export function listManualBeastcrafts(dataset, inputSession, input = {}, registry = createDefaultActionRegistry()) {
  const session = normalizeSessionAux(structuredClone(inputSession))
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) throw new Error('所选底材不存在')
  const beastLevel = Math.max(68, Math.min(100, Math.trunc(Number(input.beastLevel ?? session.beastLevel) || 83)))
  const items = BEASTCRAFT_RECIPES.map((recipe) => beastRecipeView(recipe, beastRecipeReason(dataset, base, session, recipe, registry, beastLevel)))
  return {
    ruleset: { game: SEASON_BASELINE.game, patch: SEASON_BASELINE.patch, locale: SEASON_BASELINE.locale }, beastLevel,
    items, total: items.length, executableCount: items.filter((entry) => entry.canApply).length,
    pendingSplitResults: structuredClone(session.pendingSplitResults), imprint: structuredClone(session.imprint), foreseeing: session.foreseeing
  }
}

function pickBeastCandidate(entries, rng) {
  const family = pickWeighted(bucketModifierFamilies(entries), rng)
  return family ? pickWeighted(family.entries, rng) : null
}

function rarityForSplitState(state) {
  const total = state.prefixes.length + state.suffixes.length
  if (total === 0) return 'normal'
  if (state.prefixes.length <= 1 && state.suffixes.length <= 1) return 'magic'
  return 'rare'
}

function shuffle(entries, rng) {
  const result = [...entries]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const selected = Math.floor(rng() * (index + 1))
    ;[result[index], result[selected]] = [result[selected], result[index]]
  }
  return result
}

function createSplitResults(session, count, rng) {
  const affixes = shuffle([...session.state.prefixes, ...session.state.suffixes], rng)
  const states = Array.from({ length: count }, () => normalizeCraftState({ ...session.state, prefixes: [], suffixes: [], split: true, eldritchImplicits: { exarch: null, eater: null } }))
  affixes.forEach((affix, index) => states[index % count][affix.affixType === 'prefix' ? 'prefixes' : 'suffixes'].push(structuredClone(affix)))
  const eldritch = [session.state.eldritchImplicits.exarch, session.state.eldritchImplicits.eater].filter(Boolean)
  eldritch.forEach((implicit, index) => { states[index % count].eldritchImplicits[implicit.source] = structuredClone(implicit) })
  states.forEach((state) => { state.rarity = rarityForSplitState(state); rebuildMetaState(state) })
  return states.map((state, index) => ({
    itemId: index === 0 ? session.activeItemId : `${session.activeItemId}:split:${session.rngState}:${index}`,
    state: normalizeCraftState(state), variant: structuredClone(session.variant)
  }))
}

export function applyManualBeastcraft(dataset, inputSession, recipeId, input = {}, registry = createDefaultActionRegistry()) {
  const session = normalizeSessionAux(structuredClone(inputSession))
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) throw new Error('所选底材不存在')
  const beastLevel = Math.max(68, Math.min(100, Math.trunc(Number(input.beastLevel ?? session.beastLevel) || 83)))
  session.beastLevel = beastLevel
  const catalog = listManualBeastcrafts(dataset, session, { beastLevel }, registry)
  const recipe = catalog.items.find((entry) => entry.id === recipeId)
  if (!recipe) throw new Error('未知野兽工艺')
  if (!recipe.canApply) throw new Error(recipe.unavailableReason)

  const before = normalizeCraftState(session.state)
  const variantBefore = structuredClone(session.variant)
  const auxBefore = captureSessionAux(session)
  const rng = createSeededRng(session.rngState)
  const context = actionContext(dataset, session, rng)
  const details = { operation: 'beastcraft', beastLevel, beast: recipe.beast, secondaryBeast: recipe.secondaryBeast || '' }
  const foreseeingConsumed = consumeForeseeing(session)

  if (recipe.id === 'add-prefix-remove-suffix' || recipe.id === 'add-suffix-remove-prefix') {
    const addType = recipe.id === 'add-prefix-remove-suffix' ? 'prefix' : 'suffix'
    const outcomes = addRemoveOutcomes(dataset, base, session, addType, beastLevel)
    const groups = new Map()
    outcomes.forEach((outcome) => {
      const key = outcome.removed ? `${outcome.removed.modifierId}:${outcome.removed.tierId}` : 'none'
      const group = groups.get(key) ?? { removed: outcome.removed, state: outcome.state, candidates: [] }
      group.candidates.push(outcome.candidate)
      groups.set(key, group)
    })
    const selectedGroup = selectByIndex([...groups.values()], rng)
    context.state = normalizeCraftState(selectedGroup.state)
    const selected = pickBeastCandidate(selectedGroup.candidates, rng)
    context.state[addType === 'prefix' ? 'prefixes' : 'suffixes'].push(rolledAffix(selected.modifier, selected.tier, rng))
    if (context.state.rarity === 'normal') context.state.rarity = 'magic'
    rebuildMetaState(context.state)
    session.state = normalizeCraftState(context.state)
    details.removedModifier = selectedGroup.removed ? structuredClone(selectedGroup.removed) : null
    details.addedModifier = structuredClone(session.state[addType === 'prefix' ? 'prefixes' : 'suffixes'].at(-1))
    details.poolItemLevel = beastLevel
  } else {
    const influence = BEAST_INFLUENCE_RECIPES.find((entry) => entry.id === recipe.id)?.influence
    if (influence) {
      const selected = pickBeastCandidate(influenceCandidates(dataset, base, session, influence), rng)
      const added = rolledAffix(selected.modifier, selected.tier, rng)
      context.state[selected.modifier.affixType === 'prefix' ? 'prefixes' : 'suffixes'].push(added)
      if (context.state.rarity === 'normal') context.state.rarity = 'magic'
      session.state = normalizeCraftState(context.state)
      details.addedModifier = structuredClone(added)
      details.influence = influence
    } else if (recipe.id === 'add-random-meta') {
      const candidates = randomMetaCandidates(session, base, registry)
      const selected = selectByIndex(candidates, rng)
      registry.apply(`bench:${selected.id}`, context)
      session.state = normalizeCraftState(context.state)
      details.addedModifier = structuredClone([...session.state.prefixes, ...session.state.suffixes].find((entry) => entry.modifierId === `bench-meta:${selected.id}`))
    } else if (recipe.category === 'aspect') {
      if (context.state.rarity === 'normal') context.state.rarity = 'magic'
      const affix = createAspectAffix(BEAST_ASPECT_RECIPES.find((entry) => entry.id === recipe.id))
      context.state.suffixes.push(affix)
      session.state = normalizeCraftState(context.state)
      details.addedModifier = structuredClone(affix)
    } else if (recipe.id === 'split-two' || recipe.id === 'split-three') {
      const count = recipe.id === 'split-two' ? 2 : 3
      session.pendingSplitResults = createSplitResults(session, count, rng)
      details.createdItems = structuredClone(session.pendingSplitResults)
    } else if (recipe.id === 'create-imprint') {
      session.imprint = { itemId: session.activeItemId, state: normalizeCraftState(session.state), variant: structuredClone(session.variant) }
      details.imprintCreated = true
    } else if (recipe.id === 'restore-imprint') {
      session.state = normalizeCraftState(session.imprint.state)
      session.variant = structuredClone(session.imprint.variant)
      session.imprint = null
      details.imprintRestored = true
    } else if (recipe.id === 'apply-hinekora-lock') {
      session.foreseeing = true
      details.foreseeingApplied = true
    } else if (recipe.id === 'maximum-sockets') {
      const count = naturalSocketLimit(base, session.itemLevel)
      context.state.sockets = createSockets(count, base.requirements, rng)
      context.state.links = rollLinks(context.state.sockets, context.state.quality, rng)
      session.state = normalizeCraftState(context.state)
      details.socketCount = count
    } else if (recipe.id === 'maximum-links') {
      context.state.links = fullLinks(context.state.sockets)
      session.state = normalizeCraftState(context.state)
      details.linkCount = context.state.sockets.length
    }
  }

  session.rngState = rng.state()
  const action = { id: `beast:${recipe.id}`, name: recipe.name }
  const event = { ...summarize(before, session.state, action), ...details, foreseeingConsumed }
  session.history.push({
    before, after: structuredClone(session.state), rngBefore: inputSession.rngState, rngAfter: session.rngState,
    variantBefore, variantAfter: structuredClone(session.variant), auxBefore, auxAfter: captureSessionAux(session), event
  })
  session.future = []
  return { session, event, ...manualCatalogs(dataset, session, registry) }
}

export function selectManualSplitResult(dataset, inputSession, itemId, registry = createDefaultActionRegistry()) {
  const session = normalizeSessionAux(structuredClone(inputSession))
  const selected = session.pendingSplitResults.find((entry) => entry.itemId === itemId)
  if (!selected) throw new Error('所选分裂产物不存在或已经选择完毕')
  const before = normalizeCraftState(session.state)
  const variantBefore = structuredClone(session.variant)
  const auxBefore = captureSessionAux(session)
  session.activeItemId = selected.itemId
  session.state = normalizeCraftState(selected.state)
  session.variant = structuredClone(selected.variant)
  session.pendingSplitResults = []
  const action = { id: 'beast:select-split-result', name: '选择分裂产物' }
  const event = { ...summarize(before, session.state, action), operation: 'split-select', selectedItemId: itemId }
  session.history.push({
    before, after: structuredClone(session.state), rngBefore: session.rngState, rngAfter: session.rngState,
    variantBefore, variantAfter: structuredClone(session.variant), auxBefore, auxAfter: captureSessionAux(session), event
  })
  session.future = []
  return { session, event, ...manualCatalogs(dataset, session, registry) }
}

function summarize(before, after, action) {
  const beforeAffixes = [...before.prefixes, ...before.suffixes]
  const afterAffixes = [...after.prefixes, ...after.suffixes]
  const beforeIds = new Set(beforeAffixes.map((entry) => `${entry.tierId}:${entry.rolledValues?.join(',')}`))
  const afterIds = new Set(afterAffixes.map((entry) => `${entry.tierId}:${entry.rolledValues?.join(',')}`))
  const socketSignature = (state) => state.sockets.map((socket) => socket.color).join('-') || '无孔'
  const linkSignature = (state) => state.links.map((group) => group.length).join('+') || '无连接'
  const implicitSignature = (state) => [
    ...state.baseImplicits.map((entry) => entry.rolledText),
    ...['exarch', 'eater'].map((source) => state.eldritchImplicits[source]?.rolledText).filter(Boolean),
    state.vaalImplicit?.rolledText
  ]
  const baseDefenceSignature = (state) => state.baseStats.filter(isBaseDefenceEntry).map((entry) => ({ label: entry.label, values: entry.rolledValues, text: entry.rolledText }))
  const baseDefenceBefore = baseDefenceSignature(before)
  const baseDefenceAfter = baseDefenceSignature(after)
  const baseDefenceRolled = action.id === 'currency:sacred'
  const baseDefenceChanged = before.baseDefencePercentile !== after.baseDefencePercentile || JSON.stringify(baseDefenceBefore) !== JSON.stringify(baseDefenceAfter)
  const changes = []
  const catalystLabel = (quality) => quality?.type ? `${CATALYST_LABELS[quality.type] || quality.type} ${quality.amount}%` : '无催化剂品质'
  if (before.rarity !== after.rarity) changes.push(`${before.rarity} → ${after.rarity}`)
  if (before.corrupted !== after.corrupted) changes.push(after.corrupted ? '物品已腐化' : '腐化已移除')
  if (before.corruptionOutcome !== after.corruptionOutcome && after.corruptionOutcome) changes.push(`结果：${VAAL_OUTCOME_LABELS[after.corruptionOutcome]}`)
  if (before.quality !== after.quality) changes.push(`品质 ${before.quality}% → ${after.quality}%`)
  if (baseDefenceRolled || baseDefenceChanged) changes.push(`基础防御 ${before.baseDefencePercentile ?? '无'}% → ${after.baseDefencePercentile ?? '无'}%`)
  if (JSON.stringify(before.catalystQuality) !== JSON.stringify(after.catalystQuality)) changes.push(`催化剂品质 ${catalystLabel(before.catalystQuality)} → ${catalystLabel(after.catalystQuality)}`)
  if (socketSignature(before) !== socketSignature(after)) changes.push(`孔色 ${socketSignature(before)} → ${socketSignature(after)}`)
  if (linkSignature(before) !== linkSignature(after)) changes.push(`连接 ${linkSignature(before)} → ${linkSignature(after)}`)
  if (JSON.stringify(implicitSignature(before)) !== JSON.stringify(implicitSignature(after))) changes.push('固有词缀数值已重掷')
  if (beforeAffixes.length !== afterAffixes.length) changes.push(`词缀 ${beforeAffixes.length} → ${afterAffixes.length}`)
  return {
    actionId: action.id,
    actionName: action.name,
    rarityBefore: before.rarity,
    rarityAfter: after.rarity,
    corruptionOutcome: after.corruptionOutcome,
    corruptionOutcomeLabel: after.corruptionOutcome ? VAAL_OUTCOME_LABELS[after.corruptionOutcome] : '',
    corruptionReplacedImplicit: structuredClone(after.corruptionReplacedImplicit),
    added: afterAffixes.filter((entry) => !beforeIds.has(`${entry.tierId}:${entry.rolledValues?.join(',')}`)),
    removed: beforeAffixes.filter((entry) => !afterIds.has(`${entry.tierId}:${entry.rolledValues?.join(',')}`)),
    qualityChange: before.quality === after.quality ? null : { before: before.quality, after: after.quality },
    baseDefenceChange: baseDefenceRolled || baseDefenceChanged ? {
      percentileBefore: before.baseDefencePercentile, percentileAfter: after.baseDefencePercentile,
      before: baseDefenceBefore, after: baseDefenceAfter
    } : null,
    catalystQualityChange: JSON.stringify(before.catalystQuality) === JSON.stringify(after.catalystQuality) ? null : {
      before: structuredClone(before.catalystQuality), after: structuredClone(after.catalystQuality),
      beforeLabel: catalystLabel(before.catalystQuality), afterLabel: catalystLabel(after.catalystQuality)
    },
    socketChange: socketSignature(before) === socketSignature(after) ? null : { before: socketSignature(before), after: socketSignature(after) },
    linkChange: linkSignature(before) === linkSignature(after) ? null : { before: linkSignature(before), after: linkSignature(after) },
    implicitChange: JSON.stringify(implicitSignature(before)) === JSON.stringify(implicitSignature(after)) ? null : { before: implicitSignature(before), after: implicitSignature(after) },
    summary: `${action.name}：${changes.join('，') || '状态未改变'}`
  }
}

function actionContext(dataset, session, rng, poolItemLevel = session.itemLevel) {
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  const request = { baseId: session.baseId, itemLevel: poolItemLevel, variant: session.variant, targets: [] }
  return { dataset, base, request, state: session.state, rng, rollValueRng: rng, resolveEligibleModifierTiers: createEligibleModifierTierResolver(dataset, base, poolItemLevel, session.variant) }
}

function hasMetaCraft(state) {
  return [...state.prefixes, ...state.suffixes].some((entry) => entry.metaCraft) || Object.values(state.meta ?? {}).some(Boolean)
}

function essenceUnavailableReason(session, sourceItem) {
  if (session.state.corrupted) return '已腐化物品不能使用精华'
  if (hasMetaCraft(session.state)) return '带有大师元工艺的物品不能使用精华'
  if (session.itemLevel < sourceItem.minimumItemLevel) return `该精华要求装备物品等级至少为 ${sourceItem.minimumItemLevel}`
  if (session.state.rarity === 'magic') return '精华只能用于普通或稀有物品'
  if (session.state.rarity === 'rare' && !sourceItem.canReforgeRare) return `T${sourceItem.tier} 精华只能用于普通物品`
  return ''
}

export function listManualEssences(dataset, session) {
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) throw new Error('所选底材不存在')
  const grouped = new Map()
  let unresolvedCount = 0
  dataset.modifiers.filter((modifier) => modifier.source === 'essence' && modifierMatchesBase(modifier, base, session.variant)).forEach((modifier) => {
    modifier.tiers.forEach((tier) => {
      if (!tier.sourceItem) { unresolvedCount += 1; return }
      const rows = grouped.get(tier.sourceItem.id) ?? []
      rows.push({ modifier, tier, sourceItem: tier.sourceItem })
      grouped.set(tier.sourceItem.id, rows)
    })
  })
  const items = []
  for (const rows of grouped.values()) {
    if (rows.length !== 1) { unresolvedCount += rows.length; continue }
    const { modifier, tier, sourceItem } = rows[0]
    const unavailableReason = essenceUnavailableReason(session, sourceItem)
    items.push({
      id: sourceItem.id,
      name: sourceItem.name,
      category: 'essence',
      essenceTier: sourceItem.tier,
      minimumItemLevel: sourceItem.minimumItemLevel,
      randomModifierLevelCap: sourceItem.randomModifierLevelCap,
      canReforgeRare: sourceItem.canReforgeRare,
      description: `重铸为稀有物品，并保证获得：${tier.text}`,
      requirements: sourceItem.canReforgeRare ? `普通或稀有装备，物品等级至少 ${sourceItem.minimumItemLevel}` : `仅普通装备，物品等级至少 ${sourceItem.minimumItemLevel}`,
      consequences: `替换全部可变显式词缀；保证一条${modifier.affixType === 'prefix' ? '前缀' : '后缀'}，其余词缀随机生成`,
      destructive: true,
      canApply: !unavailableReason,
      unavailableReason,
      guaranteedModifier: {
        modifierId: modifier.id,
        tierId: tier.id,
        affixType: modifier.affixType,
        name: modifier.name,
        tierName: tier.name,
        text: tier.text,
        displayTags: tier.displayTags
      }
    })
  }
  items.sort((a, b) => b.essenceTier - a.essenceTier || a.name.localeCompare(b.name, 'zh-CN'))
  return { items, unresolvedCount }
}

function benchEvaluationState(session) {
  const state = normalizeCraftState(session.state)
  const existing = craftedAffixes(state)
  if (existing.length === 1 && !state.meta.multimod && !existing[0].fractured) {
    removeCraftedAffixes(state)
    return { state, replacement: true, replacedAffix: existing[0] }
  }
  return { state, replacement: false, replacedAffix: null }
}

function benchUnavailableReason(session, base, candidate) {
  if (session.state.corrupted) return { reason: '已腐化物品不能使用工艺台显式词缀', replacement: false, replacedAffix: null }
  if (session.itemLevel < candidate.requiredLevel) return { reason: `该工艺要求装备物品等级至少为 ${candidate.requiredLevel}`, replacement: false, replacedAffix: null }
  const existing = craftedAffixes(session.state)
  if (existing.length === 1 && !session.state.meta.multimod && existing[0].fractured) {
    return { reason: '现有破裂工艺词缀无法被替换，并会占用唯一工艺名额', replacement: false, replacedAffix: null }
  }
  const evaluation = benchEvaluationState(session)
  const allAffixes = [...evaluation.state.prefixes, ...evaluation.state.suffixes]
  if (allAffixes.some((entry) => entry.groupId === candidate.groupId)) {
    return { ...evaluation, reason: '装备已有相同 Mod Group 的词缀' }
  }
  const key = candidate.affixType === 'prefix' ? 'prefixes' : 'suffixes'
  const limit = evaluation.state.rarity === 'rare' ? base.maxAffixes[candidate.affixType] : 1
  if (evaluation.state[key].length >= limit) {
    return { ...evaluation, reason: `${candidate.affixType === 'prefix' ? '前缀' : '后缀'}位已满` }
  }
  const currentCrafts = craftedAffixes(evaluation.state)
  if (evaluation.state.meta.multimod && currentCrafts.length >= 3) return { ...evaluation, reason: '多大师最多允许三条工艺词缀，且自身计入一条' }
  if (!evaluation.state.meta.multimod && currentCrafts.length > 0) {
    return { ...evaluation, reason: existing.length > 1 ? '装备拥有多条工艺词缀，必须先移除全部工艺' : '装备已经拥有一条工艺词缀' }
  }
  return { ...evaluation, reason: '' }
}

function benchCatalogItem(session, base, candidate) {
  const evaluation = benchUnavailableReason(session, base, candidate)
  const baseCost = structuredClone(candidate.cost ?? [])
  const cost = evaluation.replacement ? [...baseCost, { ...SCOURING_COST }] : baseCost
  return {
    ...candidate,
    baseCost,
    cost,
    replacementCost: evaluation.replacement ? [{ ...SCOURING_COST }] : [],
    replacesExisting: evaluation.replacement,
    replacedAffix: evaluation.replacedAffix ? { name: evaluation.replacedAffix.name, text: evaluation.replacedAffix.rolledText || evaluation.replacedAffix.text } : null,
    canApply: !evaluation.reason,
    unavailableReason: evaluation.reason
  }
}

export function listManualBenchCrafts(dataset, session) {
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) throw new Error('所选底材不存在')
  const grouped = new Map()
  dataset.modifiers.forEach((modifier) => {
    for (const option of modifier.craftedOptions ?? []) {
      if (!craftedOptionMatchesBase(option, base)) continue
      const rows = grouped.get(option.craftId) ?? []
      rows.push({ modifier, option })
      grouped.set(option.craftId, rows)
    }
  })
  const items = []
  let unresolvedCount = 0
  for (const [craftId, rows] of grouped) {
    const signatures = new Set(rows.map(({ modifier, option }) => JSON.stringify({ groupId: modifier.groupId, affixType: modifier.affixType, text: option.text, itemClasses: option.itemClasses, cost: option.cost, unlock: option.unlock })))
    if (signatures.size !== 1) { unresolvedCount += rows.length; continue }
    const { modifier, option } = rows.find((row) => modifierMatchesBase(row.modifier, base, session.variant)) ?? rows[0]
    items.push(benchCatalogItem(session, base, {
      id: craftId, kind: 'modifier', providerActionId: 'bench:add-crafted', modifierId: modifier.id,
      optionId: option.optionId, name: modifier.name, effect: option.text, affixType: modifier.affixType,
      groupId: modifier.groupId, requiredLevel: option.requiredLevel, displayTags: option.displayTags,
      cost: option.cost, unlock: option.unlock || '默认解锁', isMeta: false,
      description: `添加确定性的工艺${modifier.affixType === 'prefix' ? '前缀' : '后缀'}：${option.text}`,
      consequences: '保留现有词缀并添加所选工艺词缀；普通物品会升级为魔法物品'
    }))
  }
  const supportsExplicitBench = craftedOptionMatchesBase({ itemClasses: BENCH_SUPPORTED_ITEM_CLASSES }, base)
  if (supportsExplicitBench) {
    BENCH_META_CRAFTS.forEach((definition) => {
      items.push(benchCatalogItem(session, base, {
        id: `bench:${definition.id}`, kind: 'meta', providerActionId: `bench:${definition.id}`,
        modifierId: `bench-meta:${definition.id}`, optionId: `bench:${definition.id}`,
        name: definition.name, effect: definition.name, affixType: definition.affixType,
        groupId: `bench-meta:${definition.id}`, requiredLevel: 1, displayTags: [{ id: 'meta', label: '元工艺' }],
        cost: [{ resourceId: 'currency:divine', resourceName: '神圣石', amount: definition.cost }],
        unlock: '特殊地图配方', isMeta: true, description: definition.name, consequences: definition.consequences
      }))
    })
  }
  const removable = craftedAffixes(session.state).filter((entry) => !entry.fractured)
  if (supportsExplicitBench || removable.length) items.push({
    id: 'bench:remove-crafted', kind: 'remove', providerActionId: 'bench:remove-crafted', name: '移除工艺词缀',
    effect: '移除装备上的全部可移除工艺词缀', affixType: '', groupId: '', requiredLevel: 1,
    displayTags: [{ id: 'remove', label: '移除' }], baseCost: [{ ...SCOURING_COST }], cost: [{ ...SCOURING_COST }],
    replacementCost: [], replacesExisting: false, replacedAffix: null, unlock: '默认解锁', isMeta: false,
    description: '一次移除全部未破裂工艺词缀，包括元工艺。', consequences: '天然、精华、势力和破裂词缀不受影响；相关元工艺状态同步清空',
    canApply: !session.state.corrupted && removable.length > 0,
    unavailableReason: session.state.corrupted ? '已腐化物品不能使用工艺台' : removable.length ? '' : '当前装备没有可移除的工艺词缀'
  })
  const removableEnchantment = Boolean(session.state.enchanted || session.state.qualityEffect)
  const removeEnchantmentReason = session.state.mirrored ? '镜像物品不能被修改' : removableEnchantment ? '' : '当前装备没有可移除的附魔'
  items.push({
    id: 'bench:remove-enchantments', kind: 'remove-enchantment', providerActionId: 'bench:remove-enchantments', name: '移除附魔',
    effect: '移除装备上的全部附魔', affixType: '', groupId: '', requiredLevel: 1,
    displayTags: [{ id: 'enchantment', label: '附魔' }], baseCost: [{ ...SCOURING_COST, amount: 3 }], cost: [{ ...SCOURING_COST, amount: 3 }],
    replacementCost: [], replacesExisting: false, replacedAffix: null, unlock: '默认解锁', isMeta: false,
    description: '移除当前装备的附魔，并恢复品质的默认作用。', consequences: '普通品质数值、底材、词缀、隐式、腐化状态和孔位保持不变',
    canApply: !removeEnchantmentReason, unavailableReason: removeEnchantmentReason
  })
  if (base.socketLimit > 0) items.push(...corruptedBenchCatalog(session.state, base))
  items.sort((a, b) => a.kind === 'remove' ? -1 : b.kind === 'remove' ? 1 : Number(b.isMeta) - Number(a.isMeta) || a.affixType.localeCompare(b.affixType) || a.name.localeCompare(b.name, 'zh-CN') || a.requiredLevel - b.requiredLevel)
  return { items, unresolvedCount }
}

function emptyRareState(session) {
  return normalizeCraftState({
    rarity: 'rare', influences: session.variant.influences, implicits: session.state.implicits,
    eldritchImplicits: session.state.eldritchImplicits
  })
}

function hollowCandidates(dataset, base, session, state = emptyRareState(session)) {
  if (!HOLLOW_FOSSIL_ITEM_CLASSES.includes(base.itemClass)) return []
  return eligibleModifierTiers(dataset, base, session.itemLevel, session.variant, state, { sources: ['delve'] })
    .filter(({ modifier }) => modifier.groupId === 'AbyssJewelSocket')
}

function glyphicCandidates(dataset, base, session, state = emptyRareState(session)) {
  const occupied = new Set([...state.prefixes, ...state.suffixes].map((entry) => entry.groupId))
  return dataset.modifiers.flatMap((modifier) => {
    if (modifier.source !== 'essence' || occupied.has(modifier.groupId) || !modifierMatchesBase(modifier, base, session.variant)) return []
    const key = modifier.affixType === 'prefix' ? 'prefixes' : 'suffixes'
    if (state[key].length >= base.maxAffixes[modifier.affixType]) return []
    return modifier.tiers.filter((tier) => tier.requiredLevel <= session.itemLevel && tier.sourceItem?.tier === 8)
      .map((tier) => ({ modifier, tier, weight: Math.max(1, tier.weight || 1) }))
  })
}

function fossilCommonUnavailableReason(session, base, naturalPool = null) {
  if (!EQUIPMENT_ITEM_CLASSES.includes(base.itemClass)) return '共振器不能用于该底材类别'
  if (Array.isArray(naturalPool) && !naturalPool.length) return '当前数据快照没有该底材的天然词缀池，已禁用共振器以避免生成错误结果'
  if (session.state.mirrored) return '镜像物品不能使用共振器'
  if (session.state.corrupted) return '已腐化物品不能使用共振器'
  if (session.state.rarity !== 'rare') return '混乱共振器只能重铸稀有物品'
  if (hasMetaCraft(session.state)) return '带有任意元工艺的物品不能使用共振器'
  return ''
}

function fossilSpecialUnavailableReason(dataset, session, base, definition) {
  if (!definition.supported) return definition.unsupportedReason
  if (definition.special === 'bloodstained' && !corruptedImplicitCandidates(dataset, base, session.itemLevel).length) return '当前底材和物品等级没有已验证的腐化固定词缀候选'
  if (definition.special === 'hollow' && !hollowCandidates(dataset, base, session).length) return '该底材不能生成深渊插槽词缀'
  if (definition.special === 'glyphic' && !glyphicCandidates(dataset, base, session).length) return '当前底材没有可用的 T8 腐化精华词缀'
  if (definition.special === 'fractured') {
    if ([...session.state.prefixes, ...session.state.suffixes].some((entry) => entry.fractured)) return '已有破裂词缀的物品不能再次使用分裂化石'
    if (['influenced', 'synthesized', 'fractured'].includes(session.variant.kind)) return '分裂化石不能用于势力、追忆或破裂底材'
  }
  return ''
}

export function listManualFossils(dataset, session) {
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) throw new Error('所选底材不存在')
  const state = emptyRareState(session)
  const naturalPool = eligibleModifierTiers(dataset, base, session.itemLevel, session.variant, state, { sources: ['natural'] })
  const facetedPool = eligibleModifierTiers(dataset, base, session.itemLevel, session.variant, state, { sources: ['natural', 'delve'] })
  const commonReason = fossilCommonUnavailableReason(session, base, naturalPool)
  const items = FOSSIL_DEFINITIONS.map((definition) => {
    const specialReason = fossilSpecialUnavailableReason(dataset, session, base, definition)
    const stats = fossilPoolStats(definition.special === 'faceted' ? facetedPool : naturalPool, definition)
    const candidateCount = definition.special === 'bloodstained' ? corruptedImplicitCandidates(dataset, base, session.itemLevel).length : 0
    return {
      id: definition.id, name: definition.name, category: 'fossil', description: definition.description,
      rules: structuredClone(definition.rules), special: definition.special ?? '', supported: definition.supported,
      selectable: definition.supported && !specialReason,
      canApply: !commonReason && !specialReason,
      unavailableReason: commonReason || specialReason,
      unsupportedReason: definition.unsupportedReason,
      candidateCount,
      consequences: definition.special === 'bloodstained'
        ? `先重铸显式词缀，再从 ${candidateCount} 条候选中生成一条腐化固定词缀并永久腐化装备`
        : definition.rules.length
        ? `当前底材命中：更多 ${stats.moreCount} 项、更少 ${stats.lessCount} 项、禁止 ${stats.blockedCount} 项`
        : definition.description.replaceAll('\n', '；'),
      stats
    }
  })
  const resonators = CHAOTIC_RESONATORS.map((entry) => ({
    ...entry, canApply: !commonReason, unavailableReason: commonReason,
    cost: [{ resourceId: `resonator:${entry.id}`, resourceName: entry.name, amount: 1 }]
  }))
  return { items, resonators, supportedCount: items.filter((entry) => entry.supported).length }
}

function validateFossilSelection(dataset, session, input) {
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) throw new Error('所选底材不存在')
  const sockets = Math.trunc(Number(input?.sockets))
  if (sockets < 1 || sockets > 4) throw new Error('共振器孔数必须为 1 至 4')
  const fossilIds = Array.isArray(input?.fossilIds) ? input.fossilIds.map(String) : []
  if (fossilIds.length !== sockets) throw new Error(`${sockets} 孔共振器必须恰好装入 ${sockets} 枚化石`)
  if (new Set(fossilIds).size !== fossilIds.length) throw new Error('同一共振器不能装入重复化石')
  const fossils = fossilIds.map((id) => FOSSIL_DEFINITIONS.find((entry) => entry.id === id))
  if (fossils.some((entry) => !entry)) throw new Error('包含未知化石')
  const naturalPool = eligibleModifierTiers(dataset, base, session.itemLevel, session.variant, emptyRareState(session), { sources: ['natural'] })
  const reason = fossilCommonUnavailableReason(session, base, naturalPool) || fossils.map((entry) => fossilSpecialUnavailableReason(dataset, session, base, entry)).find(Boolean)
  if (reason) throw new Error(reason)
  return { base, sockets, fossils }
}

function selectByIndex(entries, rng) {
  return entries[Math.min(entries.length - 1, Math.floor(rng() * entries.length))]
}

export function applyManualFossils(dataset, inputSession, input, registry = createDefaultActionRegistry()) {
  const { session, auxBefore } = beginItemMutation(inputSession)
  session.state = normalizeCraftState(session.state)
  const { base, sockets, fossils } = validateFossilSelection(dataset, session, input)
  const before = normalizeCraftState(session.state)
  const rng = createSeededRng(session.rngState)
  const context = actionContext(dataset, session, rng)
  const guaranteedAffixes = []
  const occupiedState = normalizeCraftState({ ...session.state, prefixes: session.state.prefixes.filter((entry) => entry.fractured), suffixes: session.state.suffixes.filter((entry) => entry.fractured) })

  if (fossils.some((entry) => entry.special === 'hollow')) {
    const selected = selectByIndex(hollowCandidates(dataset, base, session, occupiedState), rng)
    if (!selected) throw new Error('该底材没有合法的深渊插槽词缀')
    guaranteedAffixes.push({ modifier: selected.modifier, tier: selected.tier, source: 'delve' })
    occupiedState[selected.modifier.affixType === 'prefix' ? 'prefixes' : 'suffixes'].push({ ...selected.modifier, ...selected.tier, groupId: selected.modifier.groupId })
  }
  if (fossils.some((entry) => entry.special === 'glyphic')) {
    const selected = selectByIndex(glyphicCandidates(dataset, base, session, occupiedState), rng)
    if (!selected) throw new Error('保证词缀发生冲突，无法同时容纳腐化精华词缀')
    guaranteedAffixes.push({ modifier: selected.modifier, tier: selected.tier, source: 'essence', sourceItem: selected.tier.sourceItem })
  }

  let tangled = null
  if (fossils.some((entry) => entry.special === 'tangled')) {
    const rawPool = context.resolveEligibleModifierTiers(occupiedState, { sources: ['natural'] })
    const availableTags = Object.keys(FOSSIL_TAG_LABELS).filter((tag) => !['ailment_physical_chaos', 'tagless'].includes(tag) && rawPool.some(({ modifier }) => modifier.tags.includes(tag)))
    if (availableTags.length < 2) throw new Error('当前底材没有足够的不同标签来揭示纠缠化石效果')
    const moreTag = selectByIndex(availableTags, rng)
    const blockedTag = selectByIndex(availableTags.filter((tag) => tag !== moreTag), rng)
    tangled = { moreTag, blockedTag, moreLabel: FOSSIL_TAG_LABELS[moreTag], blockedLabel: FOSSIL_TAG_LABELS[blockedTag] }
  }

  const sources = fossils.some((entry) => entry.special === 'faceted') ? ['natural', 'delve'] : ['natural']
  rollItem(context, 'rare', {
    guaranteedAffixes, sources, poolTransform: createFossilPoolTransform(fossils, tangled),
    luckyValues: fossils.some((entry) => entry.special === 'sanctified')
  })
  if (fossils.some((entry) => entry.special === 'gilded') && !context.state.implicits.includes('物品会被商贩高价购买')) context.state.implicits.push('物品会被商贩高价购买')
  let corruptedImplicit = null
  let corruptionReplacedImplicit = null
  if (fossils.some((entry) => entry.special === 'bloodstained')) {
    corruptedImplicit = rollCorruptedImplicit(dataset, base, session.itemLevel, rng)
    if (!corruptedImplicit) throw new Error('当前底材和物品等级没有已验证的腐化固定词缀候选')
    corruptionReplacedImplicit = replaceImplicitWithVaal(context.state, corruptedImplicit, rng)
    context.state.corruptionOutcome = 'implicit'
    context.state.corruptionReplacedImplicit = structuredClone(corruptionReplacedImplicit)
    context.state.corrupted = true
  }
  let fracturedModifier = null
  if (fossils.some((entry) => entry.special === 'fractured')) {
    fracturedModifier = selectByIndex([...context.state.prefixes, ...context.state.suffixes], rng)
    if (!fracturedModifier) throw new Error('分裂化石重铸后没有可破裂的显式词缀')
    fracturedModifier.fractured = true
    context.state.split = false
    session.variant = { kind: 'fractured', influences: [], fracturedTierId: fracturedModifier.tierId, implicits: [] }
  }
  session.state = normalizeCraftState(context.state)
  session.rngState = rng.state()
  const resonator = CHAOTIC_RESONATORS.find((entry) => entry.sockets === sockets)
  const costs = [
    { resourceId: `resonator:${resonator.id}`, resourceName: resonator.name, amount: 1 },
    ...fossils.map((entry) => ({ resourceId: `fossil:${entry.id}`, resourceName: entry.name, amount: 1 }))
  ]
  const action = { id: `fossil:${resonator.id}:${fossils.map((entry) => entry.id).join('+')}`, name: `${resonator.name}（${fossils.map((entry) => entry.name).join(' + ')}）` }
  const event = {
    ...summarize(before, session.state, action), operation: 'fossil', costs,
    resonator: { id: resonator.id, name: resonator.name, sockets },
    fossils: fossils.map(({ id, name, description }) => ({ id, name, description })),
    guaranteedModifiers: guaranteedAffixes.map(({ modifier, tier, sourceItem }) => ({ name: modifier.name, text: tier.text, sourceItemName: sourceItem?.name ?? '' })),
    tangled, createdItem: null, fracturedModifier: structuredClone(fracturedModifier),
    corruptedImplicit: structuredClone(corruptedImplicit),
    corruptionReplacedImplicit: structuredClone(corruptionReplacedImplicit),
    corrupted: session.state.corrupted
  }
  session.history.push({ before, after: structuredClone(session.state), rngBefore: inputSession.rngState, rngAfter: session.rngState, auxBefore, auxAfter: captureSessionAux(session), event })
  session.future = []
  return { session, event, ...manualCatalogs(dataset, session, registry) }
}

function harvestRollSources(session) {
  return ['natural', ...new Set(session.state.influences ?? session.variant.influences ?? [])]
}

function harvestReforgeState(session) {
  const state = normalizeCraftState(session.state)
  clearMutableAffixes(state)
  return state
}

function candidateFitsState(entry, state, base) {
  const key = entry.modifier.affixType === 'prefix' ? 'prefixes' : 'suffixes'
  const limit = state.rarity === 'magic' ? 1 : base.maxAffixes[entry.modifier.affixType]
  return state[key].length < limit && !blockedByRollMeta(state, entry.modifier)
}

function harvestTagCandidates(dataset, base, session, tag, state = harvestReforgeState(session), sources = harvestRollSources(session)) {
  return eligibleModifierTiers(dataset, base, session.itemLevel, session.variant, state, { sources })
    .filter((entry) => entry.modifier.tags.includes(tag) && candidateFitsState(entry, state, base))
}

function viableAugmentOptions(dataset, base, session, tag) {
  if (!tag) return []
  return mutableAffixes(session.state).flatMap((selected) => {
    const state = normalizeCraftState(session.state)
    const key = selected.type === 'prefix' ? 'prefixes' : 'suffixes'
    state[key] = state[key].filter((entry) => entry.modifierId !== selected.entry.modifierId || entry.tierId !== selected.entry.tierId)
    const candidates = eligibleModifierTiers(dataset, base, session.itemLevel, session.variant, state, { sources: ['natural'] })
      .filter((entry) => entry.modifier.tags.includes(tag) && candidateFitsState(entry, state, base))
    return candidates.length ? [{ selected, candidates }] : []
  })
}

function influenceReforgeCandidates(dataset, base, session) {
  const state = harvestReforgeState(session)
  const influences = new Set(session.state.influences)
  return eligibleModifierTiers(dataset, base, session.itemLevel, session.variant, state, { sources: harvestRollSources(session) })
    .filter((entry) => entry.modifier.influences.some((influence) => influences.has(influence)) && candidateFitsState(entry, state, base))
}

function influenceSets(count, current) {
  const values = []
  if (count === 1) HARVEST_INFLUENCES.forEach((entry) => values.push([entry]))
  else for (let index = 0; index < HARVEST_INFLUENCES.length; index += 1) {
    for (let other = index + 1; other < HARVEST_INFLUENCES.length; other += 1) values.push([HARVEST_INFLUENCES[index], HARVEST_INFLUENCES[other]])
  }
  const oldKey = [...current].sort().join('+')
  return values.filter((entry) => [...entry].sort().join('+') !== oldKey)
}

function randomizeInfluenceBlockedReason(dataset, session) {
  if (!session.state.influences.length) return '只有势力物品能随机化势力类型'
  if (session.state.influences.length > 2) return '势力数量必须为一至二种'
  const lockedInfluenced = [...session.state.prefixes, ...session.state.suffixes].some((affix) => {
    const modifier = dataset.modifiers.find((entry) => entry.id === affix.modifierId)
    const locked = affix.affixType === 'prefix' ? session.state.meta.prefixesLocked : session.state.meta.suffixesLocked
    return locked && modifier?.influences?.length
  })
  if (lockedInfluenced) return '锁定侧含有势力词缀，随机势力会产生非法保留结果'
  return ''
}

function harvestCommonReason(session, base) {
  if (!EQUIPMENT_ITEM_CLASSES.includes(base.itemClass)) return '该配方不能用于当前底材类别'
  if (session.state.corrupted) return '已腐化物品不能使用此花园工艺'
  return ''
}

function harvestCraftAvailability(dataset, session, base, craft) {
  if (!isEquipmentHarvestCraft(craft)) return { canApply: false, reason: harvestUnavailableExplanation(craft.effectKind), candidateCount: 0 }
  if (['synthesize_item', 'white_socket'].includes(craft.effectKind)) return { canApply: false, reason: harvestUnavailableExplanation(craft.effectKind), candidateCount: 0 }
  const common = harvestCommonReason(session, base)
  if (common) return { canApply: false, reason: common, candidateCount: 0 }

  if (craft.effectKind === 'reforge_tag') {
    if (session.state.rarity !== 'rare') return { canApply: false, reason: '保证标签重铸只能用于稀有物品', candidateCount: 0 }
    if (!craft.params.tag) return { canApply: false, reason: '配方缺少可执行标签参数', candidateCount: 0 }
    const candidates = harvestTagCandidates(dataset, base, session, craft.params.tag)
    return { canApply: candidates.length > 0, reason: candidates.length ? '' : `当前状态没有可生成的${HARVEST_TAG_LABELS[craft.params.tag] ?? craft.params.tag}保证词缀`, candidateCount: candidates.length }
  }
  if (['reforge_more_likely', 'reforge_less_likely'].includes(craft.effectKind)) {
    if (session.state.rarity !== 'rare') return { canApply: false, reason: '同类倾向重铸只能用于稀有物品', candidateCount: 0 }
    const state = harvestReforgeState(session)
    const count = eligibleModifierTiers(dataset, base, session.itemLevel, session.variant, state, { sources: harvestRollSources(session) }).filter((entry) => candidateFitsState(entry, state, base)).length
    return { canApply: count > 0, reason: count ? '' : '当前状态没有可生成的天然词缀', candidateCount: count }
  }
  if (['convert_resistance', 'convert_damage'].includes(craft.effectKind)) {
    const kind = craft.effectKind === 'convert_resistance' ? 'resistance' : 'damage'
    const sources = conversionSources(dataset, session.state, { ...craft.params, kind })
    const options = sources.flatMap((source) => conversionTargets(dataset, base, session.itemLevel, session.variant, session.state, source, { ...craft.params, kind }).map((target) => ({ source, target })))
    const reason = sources.length ? '目标元素没有同侧、近似阶级且无 Mod Group 冲突的词缀' : `当前装备没有可转换的${HARVEST_TAG_LABELS[craft.params.fromTag] ?? ''}${kind === 'resistance' ? '抗性' : '伤害'}词缀`
    return { canApply: options.length > 0, reason: options.length ? '' : reason, candidateCount: options.length }
  }
  if (craft.effectKind === 'remove_add_tag') {
    if (!['magic', 'rare'].includes(session.state.rarity)) return { canApply: false, reason: '移除并添加只能用于魔法或稀有物品', candidateCount: 0 }
    if (session.state.influences.length) return { canApply: false, reason: '移除并添加标签工艺只能用于非势力物品', candidateCount: 0 }
    const options = viableAugmentOptions(dataset, base, session, craft.params.tag)
    return { canApply: options.length > 0, reason: options.length ? '' : '没有同时满足锁定保护、可移除词缀和合法新增候选的结果', candidateCount: options.reduce((sum, entry) => sum + entry.candidates.length, 0) }
  }
  if (craft.effectKind === 'reforge_influence') {
    if (session.state.rarity !== 'rare' || !session.state.influences.length) return { canApply: false, reason: '保证势力词缀重铸只能用于稀有势力物品', candidateCount: 0 }
    const candidates = influenceReforgeCandidates(dataset, base, session)
    return { canApply: candidates.length > 0, reason: candidates.length ? '' : '当前势力和锁定状态没有可生成的势力词缀', candidateCount: candidates.length }
  }
  if (craft.effectKind === 'randomize_influence') {
    const reason = randomizeInfluenceBlockedReason(dataset, session)
    const count = reason ? 0 : influenceSets(session.state.influences.length, session.state.influences).length
    return { canApply: !reason && count > 0, reason: reason || (count ? '' : '没有其他合法势力组合'), candidateCount: count }
  }
  if (craft.effectKind === 'quality_enchant') {
    const applies = qualityEffectMatchesBase(craft.params.itemScope, base)
    return { canApply: applies, reason: applies ? '' : '该品质附魔不适用于当前底材类别', candidateCount: applies ? 1 : 0 }
  }
  return { canApply: false, reason: harvestUnavailableExplanation(craft.effectKind), candidateCount: 0 }
}

export function listManualHarvestCrafts(dataset, session) {
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) throw new Error('所选底材不存在')
  const items = (dataset.crafts ?? []).filter((craft) => craft.provider === 'harvest').map((craft) => {
    const availability = harvestCraftAvailability(dataset, session, base, craft)
    const category = harvestCraftCategory(craft.effectKind)
    return {
      ...structuredClone(craft), category, categoryLabel: HARVEST_CATEGORY_LABELS[category],
      canApply: availability.canApply, selectable: availability.canApply,
      unavailableReason: availability.reason, candidateCount: availability.candidateCount,
      tagLabel: HARVEST_TAG_LABELS[craft.params.tag] ?? '',
      consequences: availability.canApply ? `当前状态有 ${availability.candidateCount} 个合法候选结果` : availability.reason
    }
  })
  return {
    items,
    categories: Object.entries(HARVEST_CATEGORY_LABELS).map(([id, label]) => ({ id, label, count: items.filter((entry) => entry.category === id).length })),
    total: items.length,
    executableCount: items.filter((entry) => entry.canApply).length
  }
}

function eldritchCommonUnavailableReason(session, base) {
  if (!['Helmet', 'Gloves', 'Boots', 'BodyArmour'].includes(base.itemClass)) return '古灵通货只能用于头盔、手套、鞋子或身体护甲'
  if (session.state.corrupted) return '已腐化物品不能使用古灵通货'
  if (session.state.influences.length || session.variant.influences?.length) return '塑界、裂界或征服者势力物品不能使用古灵通货'
  return ''
}

function eldritchNaturalPool(dataset, session, base, affixType) {
  const context = actionContext(dataset, session, () => 0.5)
  return context.resolveEligibleModifierTiers(session.state, { sources: ['natural'], affixType })
    .filter(({ modifier }) => !blockedByRollMeta(session.state, modifier))
}

function eldritchAnnulCandidates(dataset, state, affixType) {
  if ((affixType === 'prefix' && state.meta.prefixesLocked) || (affixType === 'suffix' && state.meta.suffixesLocked)) return []
  const key = affixType === 'prefix' ? 'prefixes' : 'suffixes'
  return state[key].filter((affix) => {
    if (affix.fractured) return false
    const modifier = dataset.modifiers.find((entry) => entry.id === affix.modifierId)
    const tags = modifier?.tags ?? affix.displayTags?.map((entry) => entry.id) ?? []
    return !blockedByRollMeta(state, { tags })
  })
}

function eldritchAvailability(dataset, session, base, definition) {
  const commonReason = eldritchCommonUnavailableReason(session, base)
  if (commonReason) return { reason: commonReason, candidateCount: 0 }
  if (definition.kind === 'implicit') {
    const candidates = eldritchImplicitCandidates(dataset, base, session.itemLevel, definition.source, definition.tier)
    return { reason: candidates.length ? '' : '当前底材、物品等级和阶级没有可用古灵隐式', candidateCount: candidates.length }
  }
  if (definition.kind === 'conflict') {
    const both = session.state.eldritchImplicits.exarch && session.state.eldritchImplicits.eater
    return { reason: both ? '' : '冲突石需要装备同时拥有焊界者和灭界者隐式', candidateCount: both ? 2 : 0 }
  }
  const dominance = eldritchDominance(session.state)
  if (!dominance.source) return { reason: '当前没有唯一支配方：两侧同阶时不能使用支配通货', candidateCount: 0 }
  if (definition.kind === 'chaos' && session.state.rarity !== 'rare') return { reason: '古灵混沌石只能重铸稀有物品', candidateCount: 0 }
  if (definition.kind === 'exalted' && session.state.rarity !== 'rare') return { reason: '古灵崇高石只能用于稀有物品', candidateCount: 0 }
  if (definition.kind === 'annulment' && !['magic', 'rare'].includes(session.state.rarity)) return { reason: '古灵无效石只能用于魔法或稀有物品', candidateCount: 0 }
  if (definition.kind === 'annulment') {
    const candidates = eldritchAnnulCandidates(dataset, session.state, dominance.affixType)
    return { reason: candidates.length ? '' : '目标侧没有符合元工艺保护规则的可移除词缀', candidateCount: candidates.length, dominance }
  }
  let poolSession = session
  if (definition.kind === 'chaos') {
    poolSession = structuredClone(session)
    const key = dominance.affixType === 'prefix' ? 'prefixes' : 'suffixes'
    poolSession.state[key] = poolSession.state[key].filter((entry) => entry.fractured)
    rebuildMetaState(poolSession.state)
  }
  const candidates = eldritchNaturalPool(dataset, poolSession, base, dominance.affixType)
  if (definition.kind === 'exalted') {
    const key = dominance.affixType === 'prefix' ? 'prefixes' : 'suffixes'
    if (session.state[key].length >= base.maxAffixes[dominance.affixType]) return { reason: `目标${dominance.affixType === 'prefix' ? '前缀' : '后缀'}位已满`, candidateCount: 0, dominance }
  }
  return { reason: candidates.length ? '' : '目标侧没有符合底材、物品等级和元工艺的天然词缀', candidateCount: candidates.length, dominance }
}

export function listManualEldritchCrafts(dataset, session) {
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) throw new Error('所选底材不存在')
  const dominance = eldritchDominance(session.state)
  const items = ELDRITCH_CURRENCY_DEFINITIONS.map((definition) => {
    const availability = eldritchAvailability(dataset, session, base, definition)
    const conflictProbabilities = definition.kind === 'conflict' && session.state.eldritchImplicits.exarch && session.state.eldritchImplicits.eater ? {
      exarch: conflictUpgradeChance(session.state.eldritchImplicits.exarch.tier, session.state.eldritchImplicits.eater.tier),
      eater: conflictUpgradeChance(session.state.eldritchImplicits.eater.tier, session.state.eldritchImplicits.exarch.tier),
      basis: '社区实测估计'
    } : null
    return {
      ...structuredClone(definition), canApply: !availability.reason, selectable: !availability.reason,
      unavailableReason: availability.reason, candidateCount: availability.candidateCount,
      targetAffixType: availability.dominance?.affixType ?? (definition.kind === 'implicit' ? '隐式' : null),
      dominance: availability.dominance ?? dominance, conflictProbabilities
    }
  })
  return { items, total: items.length, executableCount: items.filter((entry) => entry.canApply).length, dominance }
}

function rollEldritchTargetCount(rng, preservedCount) {
  const roll = rng()
  const total = roll < 8 / 12 ? 4 : roll < 11 / 12 ? 5 : 6
  return Math.max(1, Math.min(3, total - preservedCount))
}

export function applyManualEldritchCraft(dataset, inputSession, actionId, registry = createDefaultActionRegistry()) {
  const { session, auxBefore } = beginItemMutation(inputSession)
  session.state = normalizeCraftState(session.state)
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) throw new Error('所选底材不存在')
  const definition = ELDRITCH_CURRENCY_DEFINITIONS.find((entry) => entry.id === actionId)
  if (!definition) throw new Error('未知古灵通货')
  const availability = eldritchAvailability(dataset, session, base, definition)
  if (availability.reason) throw new Error(availability.reason)

  const before = normalizeCraftState(session.state)
  const rng = createSeededRng(session.rngState)
  const dominanceBefore = eldritchDominance(before)
  const details = { operation: definition.kind, costs: structuredClone(definition.cost), eldritchBefore: structuredClone(before.eldritchImplicits) }

  if (definition.kind === 'implicit') {
    const selected = pickWeighted(eldritchImplicitCandidates(dataset, base, session.itemLevel, definition.source, definition.tier), rng)
    if (!selected) throw new Error('当前状态没有可用古灵隐式')
    session.state.implicits = []
    session.state.eldritchImplicits[definition.source] = rolledEldritchImplicit(selected.family, selected.tier, base, rng)
    details.implicitSource = definition.source
  } else if (definition.kind === 'chaos') {
    const affixType = dominanceBefore.affixType
    const key = affixType === 'prefix' ? 'prefixes' : 'suffixes'
    const oppositeKey = affixType === 'prefix' ? 'suffixes' : 'prefixes'
    session.state[key] = session.state[key].filter((entry) => entry.fractured)
    rebuildMetaState(session.state)
    const targetCount = rollEldritchTargetCount(rng, session.state[oppositeKey].length)
    const context = actionContext(dataset, session, rng)
    while (session.state[key].length < targetCount && addRandomAffix(context, { forcedType: affixType, sources: ['natural'] })) {}
    details.targetAffixType = affixType
    details.targetCount = targetCount
  } else if (definition.kind === 'exalted') {
    const context = actionContext(dataset, session, rng)
    if (!addRandomAffix(context, { forcedType: dominanceBefore.affixType, sources: ['natural'] })) throw new Error('目标侧没有合法可添加词缀')
    details.targetAffixType = dominanceBefore.affixType
  } else if (definition.kind === 'annulment') {
    const candidates = eldritchAnnulCandidates(dataset, session.state, dominanceBefore.affixType)
    const affix = selectByIndex(candidates, rng)
    const key = dominanceBefore.affixType === 'prefix' ? 'prefixes' : 'suffixes'
    session.state[key] = session.state[key].filter((entry) => entry !== affix)
    rebuildMetaState(session.state)
    details.targetAffixType = dominanceBefore.affixType
    details.removedModifier = structuredClone(affix)
  } else if (definition.kind === 'conflict') {
    const exarch = session.state.eldritchImplicits.exarch
    const eater = session.state.eldritchImplicits.eater
    const exarchChance = conflictUpgradeChance(exarch.tier, eater.tier)
    const upgradeSource = rng() < exarchChance ? 'exarch' : 'eater'
    const downgradeSource = upgradeSource === 'exarch' ? 'eater' : 'exarch'
    const upgrade = session.state.eldritchImplicits[upgradeSource]
    const downgrade = session.state.eldritchImplicits[downgradeSource]
    session.state.eldritchImplicits[upgradeSource] = replaceEldritchTier(dataset, upgrade, Math.min(6, upgrade.tier + 1), base, rng)
    session.state.eldritchImplicits[downgradeSource] = replaceEldritchTier(dataset, downgrade, downgrade.tier - 1, base, rng)
    details.conflict = { upgradeSource, downgradeSource, exarchUpgradeChance: exarchChance, eaterUpgradeChance: 1 - exarchChance, basis: '社区实测估计' }
  }

  session.state = normalizeCraftState(session.state)
  session.rngState = rng.state()
  const action = { id: definition.id, name: definition.name }
  const event = {
    ...summarize(before, session.state, action), ...details,
    dominanceBefore, dominanceAfter: eldritchDominance(session.state), eldritchAfter: structuredClone(session.state.eldritchImplicits)
  }
  session.history.push({ before, after: structuredClone(session.state), rngBefore: inputSession.rngState, rngAfter: session.rngState, auxBefore, auxAfter: captureSessionAux(session), event })
  session.future = []
  return { session, event, ...manualCatalogs(dataset, session, registry) }
}

function pickHarvestTier(entries, rng) {
  const family = pickWeighted(bucketModifierFamilies(entries), rng)
  return family ? pickWeighted(family.entries, rng) : null
}

export function applyManualHarvestCraft(dataset, inputSession, craftId, registry = createDefaultActionRegistry()) {
  const { session, auxBefore } = beginItemMutation(inputSession)
  session.state = normalizeCraftState(session.state)
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) throw new Error('所选底材不存在')
  const craft = dataset.crafts.find((entry) => entry.provider === 'harvest' && entry.id === craftId)
  if (!craft) throw new Error('未知花园工艺')
  const availability = harvestCraftAvailability(dataset, session, base, craft)
  if (!availability.canApply) throw new Error(availability.reason)

  const before = normalizeCraftState(session.state)
  const variantBefore = structuredClone(session.variant)
  const rng = createSeededRng(session.rngState)
  let context = actionContext(dataset, session, rng)
  const details = {}

  if (craft.effectKind === 'reforge_tag') {
    rollItem(context, 'rare', { requiredTag: craft.params.tag, sources: harvestRollSources(session) })
    details.guaranteedTag = craft.params.tag
  } else if (['reforge_more_likely', 'reforge_less_likely'].includes(craft.effectKind)) {
    const tags = existingHarvestTags(dataset, session.state)
    const direction = craft.effectKind === 'reforge_more_likely' ? 'more' : 'less'
    rollItem(context, 'rare', { sources: harvestRollSources(session), poolTransform: createSameTypePoolTransform(tags, direction) })
    details.originalTags = tags
    details.weightMultiplier = direction === 'more' ? HARVEST_MORE_MULTIPLIER : HARVEST_LESS_MULTIPLIER
  } else if (['convert_resistance', 'convert_damage'].includes(craft.effectKind)) {
    const kind = craft.effectKind === 'convert_resistance' ? 'resistance' : 'damage'
    const pairs = conversionSources(dataset, session.state, { ...craft.params, kind }).flatMap((source) => conversionTargets(dataset, base, session.itemLevel, session.variant, session.state, source, { ...craft.params, kind }).map((target) => ({ source, target })))
    const pair = selectByIndex(pairs, rng)
    if (!pair) throw new Error('当前状态没有合法转换结果')
    const selected = pair.source.affix.affixType === 'prefix'
      ? { type: 'prefix', entry: session.state.prefixes.find((entry) => entry.modifierId === pair.source.affix.modifierId && entry.tierId === pair.source.affix.tierId) }
      : { type: 'suffix', entry: session.state.suffixes.find((entry) => entry.modifierId === pair.source.affix.modifierId && entry.tierId === pair.source.affix.tierId) }
    removeAffix(session.state, selected)
    const target = pair.target
    const affix = rolledAffix(target.modifier, target.tier, rng, {
      source: pair.source.affix.source,
      optionId: target.crafted ? target.tier.optionId : null
    })
    session.state[affix.affixType === 'prefix' ? 'prefixes' : 'suffixes'].push(affix)
    rebuildMetaState(session.state)
    details.convertedFrom = structuredClone(pair.source.affix)
    details.convertedTo = structuredClone(affix)
  } else if (craft.effectKind === 'remove_add_tag') {
    const options = viableAugmentOptions(dataset, base, session, craft.params.tag)
    const option = selectByIndex(options, rng)
    const selected = option?.selected
    if (!selected) throw new Error('当前状态没有合法移除并添加结果')
    details.removedModifier = structuredClone(selected.entry)
    removeAffix(session.state, selected)
    const prefixCount = session.state.prefixes.length
    const suffixCount = session.state.suffixes.length
    context.state = session.state
    if (!addRandomAffix(context, { tag: craft.params.tag, sources: ['natural'] })) throw new Error('移除后没有合法的目标标签词缀')
    rebuildMetaState(session.state)
    details.addedModifier = session.state.prefixes[prefixCount] ?? session.state.suffixes[suffixCount] ?? null
  } else if (craft.effectKind === 'reforge_influence') {
    const selected = pickHarvestTier(influenceReforgeCandidates(dataset, base, session), rng)
    if (!selected) throw new Error('当前势力没有合法保证词缀')
    rollItem(context, 'rare', { guaranteedAffix: selected, sources: harvestRollSources(session) })
    details.guaranteedInfluenceModifier = { name: selected.modifier.name, text: selected.tier.text, source: selected.modifier.source }
  } else if (craft.effectKind === 'randomize_influence') {
    const oldInfluences = [...session.state.influences]
    const newInfluences = selectByIndex(influenceSets(oldInfluences.length, oldInfluences), rng)
    if (!newInfluences) throw new Error('没有其他合法势力组合')
    session.state.influences = [...newInfluences]
    session.variant = { ...session.variant, kind: 'influenced', influences: [...newInfluences] }
    context = actionContext(dataset, session, rng)
    rollItem(context, 'rare', { sources: ['natural', ...newInfluences] })
    details.influenceChange = { before: oldInfluences, after: [...newInfluences] }
  } else if (craft.effectKind === 'quality_enchant') {
    details.replacedQualityEffect = session.state.qualityEffect
    session.state.qualityEffect = craft.params.qualityEffect || craft.name
    session.state.enchanted = true
    details.qualityEffect = session.state.qualityEffect
  } else {
    throw new Error(harvestUnavailableExplanation(craft.effectKind))
  }

  session.state = normalizeCraftState(context.state)
  session.rngState = rng.state()
  const action = { id: `harvest:${craft.id}`, name: craft.name }
  const event = { ...summarize(before, session.state, action), operation: craft.effectKind, costs: structuredClone(craft.cost), harvestCraft: { id: craft.id, name: craft.name }, ...details }
  const record = {
    before, after: structuredClone(session.state), rngBefore: inputSession.rngState, rngAfter: session.rngState,
    variantBefore, variantAfter: structuredClone(session.variant), auxBefore, auxAfter: captureSessionAux(session), event
  }
  session.history.push(record)
  session.future = []
  return { session, event, ...manualCatalogs(dataset, session, registry) }
}

function influencePoolTransform(influence) {
  return (entries) => entries.filter(({ modifier }) => modifier.influences?.includes(influence))
}

export function listManualInfluenceCrafts(dataset, session) {
  const items = INFLUENCE_CURRENCY_DEFINITIONS.map((definition) => {
    let unavailableReason = ''
    let candidateCount = 0
    if (definition.kind === 'exalted') {
      unavailableReason = influenceExaltedUnavailableReason(dataset, session, definition.influence)
      candidateCount = influenceExaltedCandidates(dataset, session, definition.influence).length
    } else if (definition.kind === 'dominance') {
      unavailableReason = dominanceUnavailableReason(dataset, session)
      candidateCount = dominanceCandidates(dataset, session).length
    } else {
      unavailableReason = awakenersOrbUnavailableReason(dataset, session, session.awakenerDonor ?? null)
      const receiverInfluence = itemInfluences(session)[0]
      const donorInfluence = itemInfluences(session.awakenerDonor ?? {})[0]
      candidateCount = receiverInfluence && donorInfluence
        ? influenceAffixes(dataset, session, receiverInfluence).length * influenceAffixes(dataset, session.awakenerDonor, donorInfluence).length
        : 0
    }
    return { ...definition, canApply: !unavailableReason, unavailableReason, candidateCount }
  })
  return {
    items, total: items.length, executableCount: items.filter((entry) => entry.canApply).length,
    donor: session.awakenerDonor ?? null,
    influenceLabels: INFLUENCE_LABELS
  }
}

export function listManualAwakenerDonorCandidates(dataset, receiverSession, input = {}) {
  const receiverBase = dataset.bases.find((entry) => entry.id === receiverSession.baseId)
  if (!receiverBase) throw new Error('受体底材不存在')
  const bases = dataset.bases.filter((entry) => entry.itemClass === receiverBase.itemClass).map((entry) => ({
    id: entry.id, name: entry.name, displayName: entry.displayName, itemClass: entry.itemClass, requiredLevel: entry.requiredLevel
  }))
  const receiverInfluences = new Set(itemInfluences(receiverSession))
  const influences = Object.entries(INFLUENCE_LABELS).filter(([id]) => !receiverInfluences.has(id)).map(([id, label]) => ({ id, label }))
  const candidates = input.baseId && input.influence ? donorTierCandidates(dataset, receiverSession, input).map((entry) => ({
    modifierId: entry.modifierId, tierId: entry.tierId, affixType: entry.affixType, name: entry.name,
    tierName: entry.tierName, text: entry.text, displayTags: entry.displayTags, weight: entry.weight,
    requiredLevel: entry.tier.requiredLevel
  })) : []
  return { bases, influences, candidates }
}

export function configureManualAwakenerDonor(dataset, inputSession, input) {
  const session = structuredClone(inputSession)
  const options = donorTierCandidates(dataset, session, input)
  const selected = options.find((entry) => entry.modifierId === input.modifierId && entry.tierId === input.tierId)
  if (!selected) throw new Error('所选供体词缀不适用于当前底材、势力或物品等级')
  const donor = createManualSession(dataset, {
    baseId: input.baseId, itemLevel: input.itemLevel,
    variant: { kind: 'influenced', influences: [input.influence] },
    seed: (Number(input.seed) >>> 0) || session.rngState || 1
  })
  const rng = createSeededRng(donor.rngState)
  const affix = createDonorAffix(selected.modifier, selected.tier, rng)
  donor.state.rarity = 'magic'
  donor.state[affix.affixType === 'prefix' ? 'prefixes' : 'suffixes'].push(affix)
  donor.state = normalizeCraftState(donor.state)
  donor.initialState = structuredClone(donor.state)
  donor.rngState = rng.state()
  session.awakenerDonor = donor
  session.future = []
  return { session, event: { actionId: 'influence:configure-donor', actionName: '配置觉醒者供体', summary: `已配置${INFLUENCE_LABELS[input.influence]}供体：${affix.tierName} ${affix.rolledText}` }, ...manualCatalogs(dataset, session) }
}

export function clearManualAwakenerDonor(dataset, inputSession, registry = createDefaultActionRegistry()) {
  const session = structuredClone(inputSession)
  session.awakenerDonor = null
  session.future = []
  return { session, event: { actionId: 'influence:clear-donor', actionName: '清除觉醒者供体', summary: '已清除觉醒者之石供体' }, ...manualCatalogs(dataset, session, registry) }
}

export function applyManualInfluenceCraft(dataset, inputSession, actionId, registry = createDefaultActionRegistry()) {
  const { session, auxBefore } = beginItemMutation(inputSession)
  session.state = normalizeCraftState(session.state)
  session.awakenerDonor ??= null
  const definition = INFLUENCE_CURRENCY_DEFINITIONS.find((entry) => entry.id === actionId)
  if (!definition) throw new Error('未知势力制作通货')
  const catalog = listManualInfluenceCrafts(dataset, session)
  const availability = catalog.items.find((entry) => entry.id === actionId)
  if (!availability?.canApply) throw new Error(availability?.unavailableReason || '当前状态不能使用该势力通货')

  const before = normalizeCraftState(session.state)
  const variantBefore = structuredClone(session.variant)
  const donorBefore = structuredClone(session.awakenerDonor)
  const rng = createSeededRng(session.rngState)
  const details = { operation: definition.kind, costs: structuredClone(definition.cost) }

  if (definition.kind === 'exalted') {
    session.variant = { kind: 'influenced', influences: [definition.influence], fracturedTierId: null, implicits: [] }
    session.state.influences = [definition.influence]
    const context = actionContext(dataset, session, rng)
    const prefixCount = session.state.prefixes.length
    const suffixCount = session.state.suffixes.length
    if (!addRandomAffix(context, { sources: ['natural'], poolTransform: influencePoolTransform(definition.influence) })) {
      throw new Error(`没有可添加的${INFLUENCE_LABELS[definition.influence]}词缀`)
    }
    details.influenceChange = { before: [], after: [definition.influence] }
    details.addedInfluenceModifier = structuredClone(session.state.prefixes[prefixCount] ?? session.state.suffixes[suffixCount])
  } else if (definition.kind === 'dominance') {
    const candidates = dominanceCandidates(dataset, session)
    const upgrade = selectByIndex(candidates, rng)
    const removal = selectByIndex(candidates.filter((entry) => entry.affix !== upgrade.affix), rng)
    removeAffix(session.state, { type: removal.affix.affixType, entry: removal.affix })
    removeAffix(session.state, { type: upgrade.affix.affixType, entry: upgrade.affix })
    const upgradedAffix = rolledAffix(upgrade.upgrade.modifier, upgrade.upgrade.tier, rng, { source: upgrade.influence })
    session.state[upgradedAffix.affixType === 'prefix' ? 'prefixes' : 'suffixes'].push(upgradedAffix)
    rebuildMetaState(session.state)
    details.removedModifier = structuredClone(removal.affix)
    details.upgradedFrom = structuredClone(upgrade.affix)
    details.upgradedTo = structuredClone(upgradedAffix)
    details.rerolledElevated = upgrade.upgrade.rerollOnly
  } else {
    const donor = session.awakenerDonor
    const receiverInfluence = itemInfluences(session)[0]
    const donorInfluence = itemInfluences(donor)[0]
    const receiverPick = selectByIndex(influenceAffixes(dataset, session, receiverInfluence), rng)
    const donorPick = selectByIndex(influenceAffixes(dataset, donor, donorInfluence), rng)
    let inherited = [receiverPick, donorPick]
    let discardedConflict = null
    if (receiverPick.modifier.groupId === donorPick.modifier.groupId) {
      const keepIndex = rng() < 0.5 ? 0 : 1
      discardedConflict = inherited[1 - keepIndex]
      inherited = [inherited[keepIndex]]
    }
    const influences = [receiverInfluence, donorInfluence]
    session.variant = { kind: 'influenced', influences, fracturedTierId: null, implicits: [] }
    session.state = normalizeCraftState({
      ...session.state, rarity: 'rare', prefixes: [], suffixes: [], influences,
      eldritchImplicits: { exarch: null, eater: null },
      meta: { prefixesLocked: false, suffixesLocked: false, cannotRollAttack: false, cannotRollCaster: false, multimod: false }
    })
    const context = actionContext(dataset, session, rng)
    rollItem(context, 'rare', {
      guaranteedAffixes: inherited.map(({ modifier, affix, influence }) => ({
        modifier, tier: modifier.tiers.find((entry) => entry.id === affix.tierId), source: influence
      })),
      sources: ['natural']
    })
    session.state = context.state
    session.awakenerDonor = null
    details.inheritedModifiers = inherited.map(({ affix, influence }) => ({ influence, modifier: structuredClone(affix) }))
    details.discardedConflict = discardedConflict ? { influence: discardedConflict.influence, modifier: structuredClone(discardedConflict.affix) } : null
    details.influenceChange = { before: [receiverInfluence], after: influences }
    details.donorConsumed = true
  }

  session.state = normalizeCraftState(session.state)
  session.rngState = rng.state()
  const action = { id: definition.id, name: definition.name }
  const event = { ...summarize(before, session.state, action), ...details }
  session.history.push({
    before, after: structuredClone(session.state), rngBefore: inputSession.rngState, rngAfter: session.rngState,
    variantBefore, variantAfter: structuredClone(session.variant), donorBefore, donorAfter: structuredClone(session.awakenerDonor), auxBefore, auxAfter: captureSessionAux(session), event
  })
  session.future = []
  return { session, event, ...manualCatalogs(dataset, session, registry) }
}

function veiledRollPoolTransform(meta) {
  return (entries) => entries.filter(({ modifier }) => {
    if (meta.cannotRollAttack && (modifier.tags.includes('attack') || modifier.tags.includes('攻击'))) return false
    if (meta.cannotRollCaster && (modifier.tags.includes('caster') || modifier.tags.includes('法术'))) return false
    return true
  })
}

export function listManualVeiledCrafts(dataset, session) {
  const pending = pendingVeiledAffix(session.state)
  const optionEntries = pending ? sampleVeiledOptions(dataset, session, createSeededRng(session.rngState)) : []
  const options = optionEntries.map(veiledOptionView)
  const exaltedOutcomes = veiledExaltedOutcomes(dataset, session)
  const chaosPositions = veiledChaosPositions(dataset, session)
  const items = VEILED_CURRENCY_DEFINITIONS.map((definition) => {
    const unavailableReason = definition.kind === 'exalted'
      ? veiledExaltedUnavailableReason(dataset, session, exaltedOutcomes)
      : veiledChaosUnavailableReason(dataset, session, chaosPositions)
    const candidateCount = definition.kind === 'exalted'
      ? exaltedOutcomes.length
      : chaosPositions.length
    return { ...definition, canApply: !unavailableReason, unavailableReason, candidateCount }
  })
  return {
    items,
    total: items.length,
    executableCount: items.filter((entry) => entry.canApply).length,
    pending: pending ? { affixType: pending.affixType, index: pending.index, affix: structuredClone(pending.affix) } : null,
    options,
    canUnveil: Boolean(pending && options.length === 3),
    unveilUnavailableReason: pending && options.length < 3 ? '当前 ModGroup 阻断后不足三个合法揭露候选' : ''
  }
}

export function applyManualVeiledCraft(dataset, inputSession, actionId, registry = createDefaultActionRegistry()) {
  const { session, auxBefore } = beginItemMutation(inputSession)
  session.state = normalizeCraftState(session.state)
  const definition = VEILED_CURRENCY_DEFINITIONS.find((entry) => entry.id === actionId)
  if (!definition) throw new Error('未知加密制作通货')
  const catalog = listManualVeiledCrafts(dataset, session)
  const availability = catalog.items.find((entry) => entry.id === actionId)
  if (!availability?.canApply) throw new Error(availability?.unavailableReason || '当前状态不能使用该加密通货')

  const before = normalizeCraftState(session.state)
  const rng = createSeededRng(session.rngState)
  const details = { operation: definition.kind, costs: structuredClone(definition.cost) }

  if (definition.kind === 'exalted') {
    const outcome = selectByIndex(veiledExaltedOutcomes(dataset, session), rng)
    const key = outcome.removeType === 'prefix' ? 'prefixes' : 'suffixes'
    const [removed] = session.state[key].splice(outcome.removeIndex, 1)
    rebuildMetaState(session.state)
    const affixType = selectByIndex(outcome.positions, rng)
    const placeholder = createVeiledPlaceholder(affixType)
    session.state[affixType === 'prefix' ? 'prefixes' : 'suffixes'].push(placeholder)
    details.removedModifier = structuredClone(removed)
    details.pendingVeil = structuredClone(placeholder)
  } else {
    const startingMeta = structuredClone(session.state.meta)
    const affixType = selectByIndex(veiledChaosPositions(dataset, session), rng)
    const context = actionContext(dataset, session, rng)
    rollItem(context, 'rare', {
      guaranteedAffix: createVeiledGuaranteedAffix(affixType),
      sources: harvestRollSources(session),
      poolTransform: veiledRollPoolTransform(startingMeta)
    })
    session.state = context.state
    details.pendingVeil = structuredClone(pendingVeiledAffix(session.state)?.affix)
    details.respectedRollMeta = {
      cannotRollAttack: startingMeta.cannotRollAttack,
      cannotRollCaster: startingMeta.cannotRollCaster
    }
  }

  session.state = normalizeCraftState(session.state)
  session.rngState = rng.state()
  const action = { id: definition.id, name: definition.name }
  const event = { ...summarize(before, session.state, action), ...details }
  session.history.push({ before, after: structuredClone(session.state), rngBefore: inputSession.rngState, rngAfter: session.rngState, auxBefore, auxAfter: captureSessionAux(session), event })
  session.future = []
  return { session, event, ...manualCatalogs(dataset, session, registry) }
}

export function selectManualVeiledOption(dataset, inputSession, modifierId, tierId, registry = createDefaultActionRegistry()) {
  const { session, auxBefore } = beginItemMutation(inputSession)
  session.state = normalizeCraftState(session.state)
  const pending = pendingVeiledAffix(session.state)
  if (!pending) throw new Error('当前装备没有未揭露词缀')
  const optionEntries = sampleVeiledOptions(dataset, session, createSeededRng(session.rngState))
  if (optionEntries.length !== 3) throw new Error('当前状态不足三个合法揭露候选')
  const selected = optionEntries.find((entry) => entry.modifier.id === modifierId && entry.tier.id === tierId)
  if (!selected) throw new Error('所选词缀不在当前三个揭露选项中')

  const before = normalizeCraftState(session.state)
  const rng = createSeededRng(session.rngState)
  const key = pending.affixType === 'prefix' ? 'prefixes' : 'suffixes'
  const revealed = rolledAffix(selected.modifier, selected.tier, rng, { source: 'veiled' })
  session.state[key].splice(pending.index, 1, revealed)
  rebuildMetaState(session.state)
  session.state = normalizeCraftState(session.state)
  session.rngState = rng.state()
  const action = { id: 'veiled:unveil', name: '揭露加密词缀' }
  const event = {
    ...summarize(before, session.state, action), operation: 'unveil',
    unveilOptions: optionEntries.map(veiledOptionView),
    selectedModifier: structuredClone(revealed)
  }
  session.history.push({ before, after: structuredClone(session.state), rngBefore: inputSession.rngState, rngAfter: session.rngState, auxBefore, auxAfter: captureSessionAux(session), event })
  session.future = []
  return { session, event, ...manualCatalogs(dataset, session, registry) }
}

function manualCatalogs(dataset, session, registry) {
  const catalogs = {
    currencies: inspectManualCurrencies(dataset, session, registry),
    essences: listManualEssences(dataset, session),
    benchCrafts: listManualBenchCrafts(dataset, session),
    fossils: listManualFossils(dataset, session),
    harvest: listManualHarvestCrafts(dataset, session),
    eldritch: listManualEldritchCrafts(dataset, session),
    influence: listManualInfluenceCrafts(dataset, session),
    veiled: listManualVeiledCrafts(dataset, session),
    beastcraft: listManualBeastcrafts(dataset, session, { beastLevel: session.beastLevel }, registry)
  }
  const reason = pendingSplitReason(session)
  const blockingReason = reason || (session.state.mirrored ? '镜像物品不能被修改' : '')
  if (!blockingReason) return catalogs
  for (const [name, catalog] of Object.entries(catalogs)) {
    if (['currencies', 'beastcraft'].includes(name)) continue
    if (Array.isArray(catalog?.items)) catalog.items = catalog.items.map((entry) => ({ ...entry, canApply: false, selectable: false, unavailableReason: blockingReason }))
    if (Array.isArray(catalog?.resonators)) catalog.resonators = catalog.resonators.map((entry) => ({ ...entry, canApply: false, unavailableReason: blockingReason }))
    if ('executableCount' in (catalog ?? {})) catalog.executableCount = 0
    if ('canUnveil' in (catalog ?? {})) { catalog.canUnveil = false; catalog.unveilUnavailableReason = blockingReason }
  }
  return catalogs
}

export function inspectManualCurrencies(dataset, session, registry = createDefaultActionRegistry()) {
  normalizeSessionAux(session)
  const context = actionContext(dataset, session, () => 0.5)
  const pendingReason = pendingSplitReason(session)
  return registry.list().filter((entry) => entry.category === 'currency').map((entry) => {
    const inspected = registry.inspect(entry.id, context)
    if (session.state.mirrored) return {
      ...inspected, canApply: false,
      unavailableReason: entry.id === 'currency:mirror-of-kalandra' ? '镜像副本不能再次复制' : '镜像物品不能被修改',
      preview: null
    }
    if (pendingReason) return { ...inspected, canApply: false, unavailableReason: pendingReason, preview: null }
    if (!session.foreseeing || !inspected.canApply) return { ...inspected, preview: null }
    try {
      const simulated = performManualCurrency(dataset, session, entry.id, registry)
      return { ...inspected, preview: { state: structuredClone(simulated.session.state), variant: structuredClone(simulated.session.variant) } }
    } catch { return { ...inspected, preview: null } }
  })
}

function performManualCurrency(dataset, inputSession, actionId, registry) {
  const session = normalizeSessionAux(structuredClone(inputSession))
  const pendingReason = pendingSplitReason(session)
  if (pendingReason) throw new Error(pendingReason)
  const rng = createSeededRng(session.rngState)
  const context = actionContext(dataset, session, rng)
  const action = registry.get(actionId)
  if (!action || action.category !== 'currency') throw new Error('未知通货动作')
  const mirrorSourceItem = actionId === 'currency:mirror-of-kalandra' ? {
    itemId: session.activeItemId, baseId: session.baseId, itemLevel: session.itemLevel,
    state: normalizeCraftState(session.state), variant: structuredClone(session.variant)
  } : null
  registry.apply(actionId, context)
  session.state = normalizeCraftState(context.state)
  let mirrorCreatedItem = null
  if (mirrorSourceItem) {
    const itemId = `${session.activeItemId}:mirror:${session.history.length + 1}`
    session.activeItemId = itemId
    mirrorCreatedItem = {
      itemId, baseId: session.baseId, itemLevel: session.itemLevel,
      state: structuredClone(session.state), variant: structuredClone(session.variant)
    }
  }
  let fracturedModifier = null
  if (actionId === 'currency:fracturing') {
    fracturedModifier = [...session.state.prefixes, ...session.state.suffixes].find((affix) => affix.fractured)
    session.variant = {
      kind: 'fractured', influences: [], fracturedTierId: fracturedModifier.tierId, implicits: []
    }
  }
  session.rngState = rng.state()
  consumeForeseeing(session)
  return { session, action, fracturedModifier, mirrorSourceItem, mirrorCreatedItem }
}

export function previewManualCurrency(dataset, inputSession, actionId, registry = createDefaultActionRegistry()) {
  const session = normalizeSessionAux(structuredClone(inputSession))
  if (!session.foreseeing) throw new Error('当前物品没有希内科拉预见状态')
  const result = performManualCurrency(dataset, session, actionId, registry)
  return { actionId, state: structuredClone(result.session.state), variant: structuredClone(result.session.variant) }
}

export function applyManualCurrency(dataset, inputSession, actionId, registry = createDefaultActionRegistry()) {
  const sourceSession = normalizeSessionAux(structuredClone(inputSession))
  const before = normalizeCraftState(sourceSession.state)
  const variantBefore = structuredClone(sourceSession.variant)
  const auxBefore = captureSessionAux(sourceSession)
  const { session, action, fracturedModifier, mirrorSourceItem, mirrorCreatedItem } = performManualCurrency(dataset, sourceSession, actionId, registry)
  const event = mirrorCreatedItem ? {
    actionId: action.id, actionName: action.name,
    summary: '卡兰德之镜：原件未改变，已生成镜像副本并切换为当前装备',
    costs: structuredClone(action.cost ?? []), operation: 'mirror-copy',
    sourceItem: mirrorSourceItem, createdMirrorItem: mirrorCreatedItem
  } : { ...summarize(before, session.state, action), costs: structuredClone(action.cost ?? []), ...(fracturedModifier ? { fracturedModifier: structuredClone(fracturedModifier) } : {}) }
  session.history.push({
    before, after: structuredClone(session.state), rngBefore: inputSession.rngState, rngAfter: session.rngState,
    variantBefore, variantAfter: structuredClone(session.variant), auxBefore, auxAfter: captureSessionAux(session), event
  })
  session.future = []
  return { session, event, ...manualCatalogs(dataset, session, registry) }
}

export function applyManualEssence(dataset, inputSession, essenceId, registry = createDefaultActionRegistry()) {
  const { session, auxBefore } = beginItemMutation(inputSession)
  const catalog = listManualEssences(dataset, session)
  const option = catalog.items.find((entry) => entry.id === essenceId)
  if (!option) throw new Error('该底材没有可识别的精华保证词缀')
  if (!option.canApply) throw new Error(option.unavailableReason)
  const modifier = dataset.modifiers.find((entry) => entry.id === option.guaranteedModifier.modifierId)
  const tier = modifier?.tiers.find((entry) => entry.id === option.guaranteedModifier.tierId)
  if (!modifier || !tier?.sourceItem || tier.sourceItem.id !== essenceId) throw new Error('精华保证词缀数据不完整')
  const before = normalizeCraftState(session.state)
  const rng = createSeededRng(session.rngState)
  const poolItemLevel = Math.min(session.itemLevel, option.randomModifierLevelCap ?? session.itemLevel)
  const context = actionContext(dataset, session, rng, poolItemLevel)
  rollItem(context, 'rare', { guaranteedAffix: { modifier, tier, sourceItem: tier.sourceItem } })
  session.state = normalizeCraftState(context.state)
  session.rngState = rng.state()
  const action = { id: `essence:${essenceId}`, name: option.name }
  const event = { ...summarize(before, session.state, action), guaranteedModifier: option.guaranteedModifier, poolItemLevel }
  session.history.push({ before, after: structuredClone(session.state), rngBefore: inputSession.rngState, rngAfter: session.rngState, auxBefore, auxAfter: captureSessionAux(session), event })
  session.future = []
  return { session, event, ...manualCatalogs(dataset, session, registry) }
}

export function applyManualBenchCraft(dataset, inputSession, benchCraftId, registry = createDefaultActionRegistry()) {
  const { session, auxBefore } = beginItemMutation(inputSession)
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) throw new Error('所选底材不存在')
  const catalog = listManualBenchCrafts(dataset, session)
  const selected = catalog.items.find((entry) => entry.id === benchCraftId)
  if (!selected) throw new Error('该底材没有此工艺台动作')
  if (!selected.canApply) throw new Error(selected.unavailableReason)
  const before = normalizeCraftState(session.state)
  const rng = createSeededRng(session.rngState)
  const context = actionContext(dataset, session, rng)
  const removedEnchantment = selected.kind === 'remove-enchantment'
    ? (session.state.qualityEffect || '未结构化附魔')
    : null
  const foreseeingConsumed = Boolean(auxBefore.foreseeing)
  if (selected.replacesExisting) removeCraftedAffixes(context.state)
  if (selected.kind.startsWith('corrupted-')) {
    applyCorruptedBenchRecipe(context.state, base, selected, rng)
  } else if (selected.kind === 'modifier') {
    const modifier = dataset.modifiers.find((entry) => entry.id === selected.modifierId)
    const option = modifier?.craftedOptions.find((entry) => entry.optionId === selected.optionId)
    if (!modifier || !option) throw new Error('工艺台词缀数据不完整')
    registry.apply('bench:add-crafted', { ...context, modifier, option })
  } else {
    registry.apply(selected.providerActionId, context)
  }
  session.state = normalizeCraftState(context.state)
  session.rngState = rng.state()
  const action = { id: `bench-action:${selected.id}`, name: selected.name }
  const event = {
    ...summarize(before, session.state, action), costs: structuredClone(selected.cost),
    baseCosts: structuredClone(selected.baseCost), replacementCost: structuredClone(selected.replacementCost),
    replacedCraft: selected.replacedAffix, operation: selected.kind,
    ...(removedEnchantment ? { removedEnchantment } : {}),
    ...(foreseeingConsumed ? { foreseeingConsumed: true } : {})
  }
  session.history.push({ before, after: structuredClone(session.state), rngBefore: inputSession.rngState, rngAfter: session.rngState, auxBefore, auxAfter: captureSessionAux(session), event })
  session.future = []
  return { session, event, ...manualCatalogs(dataset, session, registry) }
}

export function undoManualAction(dataset, inputSession, registry = createDefaultActionRegistry()) {
  const session = normalizeSessionAux(structuredClone(inputSession))
  const record = session.history.pop()
  if (!record) return { session, ...manualCatalogs(dataset, session, registry) }
  session.state = record.before
  session.rngState = record.rngBefore
  if (record.variantBefore) session.variant = structuredClone(record.variantBefore)
  if ('donorBefore' in record) session.awakenerDonor = structuredClone(record.donorBefore)
  if (record.auxBefore) restoreSessionAux(session, record.auxBefore)
  session.future.unshift(record)
  return { session, event: { summary: `已撤销：${record.event.actionName}` }, ...manualCatalogs(dataset, session, registry) }
}

export function redoManualAction(dataset, inputSession, registry = createDefaultActionRegistry()) {
  const session = normalizeSessionAux(structuredClone(inputSession))
  const record = session.future.shift()
  if (!record) return { session, ...manualCatalogs(dataset, session, registry) }
  session.state = record.after
  session.rngState = record.rngAfter
  if (record.variantAfter) session.variant = structuredClone(record.variantAfter)
  if ('donorAfter' in record) session.awakenerDonor = structuredClone(record.donorAfter)
  if (record.auxAfter) restoreSessionAux(session, record.auxAfter)
  session.history.push(record)
  return { session, event: { ...structuredClone(record.event), summary: `已重做：${record.event.actionName}` }, ...manualCatalogs(dataset, session, registry) }
}

export function resetManualSession(dataset, inputSession, registry = createDefaultActionRegistry()) {
  const session = normalizeSessionAux(structuredClone(inputSession))
  session.state = structuredClone(session.initialState)
  if (session.initialVariant) session.variant = structuredClone(session.initialVariant)
  session.awakenerDonor = structuredClone(session.initialAwakenerDonor ?? null)
  session.activeItemId = `item:${(Number(session.seed) >>> 0).toString(16)}:0`
  session.pendingSplitResults = []
  session.imprint = null
  session.foreseeing = false
  session.beastLevel = 83
  session.rngState = session.seed
  session.history = []
  session.future = []
  return { session, event: { summary: '已重置为初始底材' }, ...manualCatalogs(dataset, session, registry) }
}
