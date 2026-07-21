import { normalizeCraftRequest, normalizeCraftState } from './model.js'
import { legalModifierTiers, modifierCanSpawn, validateBaseVariant } from './variantRules.js'

export function createInitialCraftState(requestInput, dataset) {
  const request = normalizeCraftRequest(requestInput)
  const state = normalizeCraftState({ rarity: 'normal', influences: request.variant.influences, implicits: request.variant.implicits })
  if (request.variant.kind === 'fractured') {
    const located = findTier(dataset, request.variant.fracturedTierId)
    if (!located) throw new Error('破裂词缀阶级不存在')
    const affix = {
      goalId: located.modifier.goalId,
      modifierId: located.modifier.id,
      tierId: located.tier.id,
      groupId: located.modifier.groupId,
      source: 'natural',
      fractured: true
    }
    state[located.modifier.affixType === 'prefix' ? 'prefixes' : 'suffixes'].push(affix)
    state.rarity = 'rare'
  }
  return state
}

export function cloneCraftState(state) {
  return normalizeCraftState(structuredClone(state))
}

export function findTier(dataset, tierId) {
  for (const modifier of dataset.modifiers) {
    const tier = modifier.tiers.find((entry) => entry.id === tierId)
    if (tier) return { modifier, tier }
  }
  return null
}

export function targetSatisfied(target, state, dataset) {
  const modifier = dataset.modifiers.find((entry) => entry.goalId === target.goalId)
  if (!modifier) return false
  const requiredTier = modifier.tiers.find((entry) => entry.id === target.minTierId)
  if (!requiredTier) return false
  const entries = modifier.affixType === 'prefix' ? state.prefixes : state.suffixes
  return entries.some((affix) => {
    if ((affix.goalId ?? affix.modifierId) !== modifier.goalId) return false
    const tier = modifier.tiers.find((entry) => entry.id === affix.tierId) ?? modifier.craftedOptions?.find((entry) => entry.id === affix.tierId || entry.optionId === affix.optionId)
    return tier && valuesMeetThreshold(tier.values, requiredTier.values)
  })
}

export function valuesMeetThreshold(actual = [], required = []) {
  return actual.length === required.length && required.every((range, index) => Number(actual[index]?.min) >= Number(range.min))
}

export function qualifyingCraftedOptions(modifier, requiredTier, base = null, itemLevel = 100) {
  return (modifier.craftedOptions ?? []).filter((option) => {
    if (option.requiredLevel > itemLevel || !valuesMeetThreshold(option.values, requiredTier.values)) return false
    if (!base || !option.itemClasses?.length) return true
    return option.itemClasses.some((itemClass) => base.categoryPath.includes(itemClass) || itemClass === base.itemClass)
  })
}

export function allTargetsSatisfied(request, state, dataset) {
  return request.targets.every((target) => targetSatisfied(target, state, dataset))
}

export function validateCraftRequest(requestInput, dataset) {
  let request
  try { request = normalizeCraftRequest(requestInput) } catch (error) { return { valid: false, request: null, errors: [{ code: 'schema', message: error.message }] } }
  const errors = []
  const base = dataset.bases.find((entry) => entry.id === request.baseId)
  if (!base) return { valid: false, request, errors: [{ code: 'base_missing', message: '所选底材不存在' }] }
  if (request.itemLevel < base.requiredLevel) errors.push({ code: 'item_level_below_base', message: `物品等级不能低于底材需求等级 ${base.requiredLevel}` })
  errors.push(...validateBaseVariant(base, request.variant).errors)
  const initialState = (() => { try { return createInitialCraftState(request, dataset) } catch (error) { errors.push({ code: 'initial_state', message: error.message }); return normalizeCraftState() } })()
  const groups = new Map()
  const counts = { prefix: initialState.prefixes.length, suffix: initialState.suffixes.length }

  request.targets.forEach((target, index) => {
    const modifier = dataset.modifiers.find((entry) => entry.goalId === target.goalId)
    if (!modifier) {
      errors.push({ code: 'modifier_missing', targetIndex: index, message: `目标词缀 ${target.goalId} 不存在` })
      return
    }
    const requiredTier = modifier.tiers.find((tier) => tier.id === target.minTierId)
    const tiers = requiredTier ? legalModifierTiers(modifier, request.itemLevel).filter((tier) => valuesMeetThreshold(tier.values, requiredTier.values)) : []
    if (!requiredTier || (!tiers.length && !qualifyingCraftedOptions(modifier, requiredTier, base, request.itemLevel).length)) errors.push({ code: 'tier_unavailable', targetIndex: index, message: `${modifier.name} 在物品等级 ${request.itemLevel} 无法达到所选等级` })
    const naturalAllowed = modifier.source !== 'crafted' && modifierCanSpawn(modifier, base, request.itemLevel, request.variant)
    const craftedAllowed = requiredTier && qualifyingCraftedOptions(modifier, requiredTier, base, request.itemLevel).length > 0
    if (!naturalAllowed && !craftedAllowed) errors.push({ code: 'goal_unavailable', targetIndex: index, message: `${modifier.name} 无法在当前底材上获得` })
    if (groups.has(modifier.groupId) && groups.get(modifier.groupId) !== modifier.goalId) {
      errors.push({ code: 'mod_group_conflict', targetIndex: index, message: `${modifier.name} 与另一目标属于互斥词缀组 ${modifier.groupId}` })
    }
    groups.set(modifier.groupId, modifier.goalId)
    const alreadyPresent = [...initialState.prefixes, ...initialState.suffixes].some((affix) => (affix.goalId ?? affix.modifierId) === modifier.goalId)
    if (!alreadyPresent) counts[modifier.affixType] += 1
  })

  if (counts.prefix > base.maxAffixes.prefix) errors.push({ code: 'prefix_capacity', message: `目标需要 ${counts.prefix} 条前缀，但底材最多 ${base.maxAffixes.prefix} 条` })
  if (counts.suffix > base.maxAffixes.suffix) errors.push({ code: 'suffix_capacity', message: `目标需要 ${counts.suffix} 条后缀，但底材最多 ${base.maxAffixes.suffix} 条` })
  return { valid: errors.length === 0, request, base, initialState, errors }
}

export function eligibleModifierTiers(dataset, base, itemLevel, variant, state, { source = 'natural', tag = null, affixType = null } = {}) {
  const occupiedGroups = new Set([...state.prefixes, ...state.suffixes].map((affix) => affix.groupId))
  const pools = []
  dataset.modifiers.forEach((modifier) => {
    if (modifier.source !== source || occupiedGroups.has(modifier.groupId)) return
    if (affixType && modifier.affixType !== affixType) return
    if (tag && !modifier.tiers.some((tier) => tier.displayTags.some((entry) => entry.id === tag))) return
    if (!modifierCanSpawn(modifier, base, itemLevel, variant)) return
    legalModifierTiers(modifier, itemLevel).forEach((tier) => {
      if ((tier.weight > 0 || source === 'crafted') && (!tag || tier.displayTags.some((entry) => entry.id === tag))) pools.push({ modifier, tier, weight: Math.max(1, tier.weight) })
    })
  })
  return pools
}

export function mutableAffixes(state, { respectMeta = true } = {}) {
  return [
    ...(respectMeta && state.meta.prefixesLocked ? [] : state.prefixes.filter((entry) => !entry.fractured).map((entry) => ({ type: 'prefix', entry }))),
    ...(respectMeta && state.meta.suffixesLocked ? [] : state.suffixes.filter((entry) => !entry.fractured).map((entry) => ({ type: 'suffix', entry })))
  ]
}

export function removeAffix(state, selected) {
  const key = selected.type === 'prefix' ? 'prefixes' : 'suffixes'
  const index = state[key].indexOf(selected.entry)
  if (index >= 0) state[key].splice(index, 1)
}

export function clearMutableAffixes(state) {
  if (!state.meta.prefixesLocked) state.prefixes = state.prefixes.filter((entry) => entry.fractured)
  if (!state.meta.suffixesLocked) state.suffixes = state.suffixes.filter((entry) => entry.fractured)
  state.meta = { prefixesLocked: false, suffixesLocked: false, cannotRollAttack: false, cannotRollCaster: false, multimod: false }
  return state
}
