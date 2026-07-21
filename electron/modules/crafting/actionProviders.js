import {
  clearMutableAffixes,
  cloneCraftState,
  eligibleModifierTiers,
  mutableAffixes,
  removeAffix
} from './craftState.js'

export class CraftActionRegistry {
  constructor() { this.providers = new Map() }
  register(provider) {
    if (!provider?.id || typeof provider.apply !== 'function') throw new TypeError('Provider 必须包含 id 和 apply')
    if (this.providers.has(provider.id)) throw new Error(`Provider ${provider.id} 已注册`)
    this.providers.set(provider.id, provider)
    return this
  }
  get(id) { return this.providers.get(id) }
  list() { return [...this.providers.values()] }
  apply(id, context) {
    const provider = this.get(id)
    if (!provider) throw new Error(`未知工艺 Provider：${id}`)
    if (provider.canApply && !provider.canApply(context)) throw new Error(`${provider.name || id} 不适用于当前状态`)
    return provider.apply(context)
  }
}

export function pickWeighted(entries, rng = Math.random) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.weight) || 0), 0)
  if (!(total > 0)) return null
  let target = rng() * total
  for (const entry of entries) {
    target -= Math.max(0, Number(entry.weight) || 0)
    if (target <= 0) return entry
  }
  return entries.at(-1)
}

export function bucketModifierFamilies(entries) {
  const families = new Map()
  entries.forEach((entry) => {
    const familyId = entry.modifier.familyId || `${entry.modifier.modifierProfileId}:${entry.modifier.affixType}:${entry.modifier.groupId}`
    const bucket = families.get(familyId) ?? { id: familyId, weight: 0, entries: [] }
    bucket.weight += Math.max(0, Number(entry.weight) || 0)
    bucket.entries.push(entry)
    families.set(familyId, bucket)
  })
  return [...families.values()]
}

function canAdd(state, base, affixType) {
  const key = affixType === 'prefix' ? 'prefixes' : 'suffixes'
  return state[key].length < base.maxAffixes[affixType]
}

function addRandomAffix(context, { tag = null, forcedType = null } = {}) {
  const { state, dataset, base, request, rng } = context
  const types = ['prefix', 'suffix'].filter((type) => canAdd(state, base, type))
  if (!types.length) return false
  const affixType = forcedType && types.includes(forcedType) ? forcedType : types[Math.floor(rng() * types.length)]
  let pool = eligibleModifierTiers(dataset, base, request.itemLevel, request.variant, state, { source: 'natural', tag, affixType })
  if (state.meta.cannotRollAttack) pool = pool.filter((entry) => !entry.modifier.tags.includes('attack') && !entry.modifier.tags.includes('攻击'))
  if (state.meta.cannotRollCaster) pool = pool.filter((entry) => !entry.modifier.tags.includes('caster') && !entry.modifier.tags.includes('法术'))
  const selectedFamily = pickWeighted(bucketModifierFamilies(pool), rng)
  const selected = selectedFamily ? pickWeighted(selectedFamily.entries, rng) : null
  if (!selected) return false
  state[affixType === 'prefix' ? 'prefixes' : 'suffixes'].push({
    goalId: selected.modifier.goalId,
    modifierId: selected.modifier.id, tierId: selected.tier.id, groupId: selected.modifier.groupId,
    source: 'natural', fractured: false
  })
  return true
}

function rollAffixCount(rarity, rng) {
  if (rarity === 'magic') return rng() < 0.5 ? 1 : 2
  const roll = rng()
  return roll < 0.4 ? 4 : roll < 0.75 ? 5 : 6
}

export function rollItem(context, rarity, { requiredTag = null } = {}) {
  const state = context.state
  clearMutableAffixes(state)
  state.rarity = rarity
  const targetCount = Math.min(rollAffixCount(rarity, context.rng), context.base.maxAffixes.prefix + context.base.maxAffixes.suffix)
  if (requiredTag) addRandomAffix(context, { tag: requiredTag })
  let guard = 0
  while (state.prefixes.length + state.suffixes.length < targetCount && guard++ < 20) {
    if (!addRandomAffix(context)) break
  }
  state.meta = { prefixesLocked: false, suffixesLocked: false, cannotRollAttack: false, cannotRollCaster: false, multimod: false }
  return state
}

function currencyProvider(id, name, canApply, apply) {
  return { id: `currency:${id}`, name, category: 'currency', canApply, apply }
}

export function createCurrencyProviders() {
  return [
    currencyProvider('transmutation', '蜕变石', ({ state }) => state.rarity === 'normal', (context) => rollItem(context, 'magic')),
    currencyProvider('alteration', '改造石', ({ state }) => state.rarity === 'magic', (context) => rollItem(context, 'magic')),
    currencyProvider('augmentation', '增幅石', ({ state, base }) => state.rarity === 'magic' && state.prefixes.length + state.suffixes.length < 2 && (canAdd(state, base, 'prefix') || canAdd(state, base, 'suffix')), (context) => { addRandomAffix(context); return context.state }),
    currencyProvider('regal', '富豪石', ({ state }) => state.rarity === 'magic', (context) => { context.state.rarity = 'rare'; addRandomAffix(context); return context.state }),
    currencyProvider('alchemy', '点金石', ({ state }) => state.rarity === 'normal', (context) => rollItem(context, 'rare')),
    currencyProvider('chaos', '混沌石', ({ state }) => state.rarity === 'rare', (context) => rollItem(context, 'rare')),
    currencyProvider('scouring', '重铸石', ({ state }) => state.rarity !== 'normal', (context) => { clearMutableAffixes(context.state); context.state.rarity = context.state.prefixes.length + context.state.suffixes.length ? 'rare' : 'normal'; return context.state }),
    currencyProvider('exalted', '崇高石', ({ state, base }) => state.rarity === 'rare' && (canAdd(state, base, 'prefix') || canAdd(state, base, 'suffix')), (context) => { addRandomAffix(context); return context.state }),
    currencyProvider('annulment', '无效石', ({ state }) => mutableAffixes(state).length > 0, (context) => { const pool = mutableAffixes(context.state); removeAffix(context.state, pool[Math.floor(context.rng() * pool.length)]); return context.state }),
    currencyProvider('divine', '神圣石', ({ state }) => state.prefixes.length + state.suffixes.length > 0, ({ state }) => state)
  ]
}

function metaProvider(id, name, flag) {
  return {
    id: `bench:${id}`, name, category: 'bench',
    canApply: ({ state }) => state.rarity === 'rare',
    apply: ({ state }) => { state.meta[flag] = true; return state }
  }
}

export function createBenchProviders() {
  return [
    metaProvider('lock-prefixes', '前缀无法被变更', 'prefixesLocked'),
    metaProvider('lock-suffixes', '后缀无法被变更', 'suffixesLocked'),
    metaProvider('cannot-roll-attack', '无法骰出攻击词缀', 'cannotRollAttack'),
    metaProvider('cannot-roll-caster', '无法骰出法术词缀', 'cannotRollCaster'),
    metaProvider('multimod', '可以拥有多个工艺词缀', 'multimod'),
    {
      id: 'bench:add-crafted', name: '添加工艺词缀', category: 'bench',
      canApply: ({ state, base, modifier, option }) => Boolean(option) && canAdd(state, base, modifier.affixType),
      apply: ({ state, modifier, option }) => {
        state[modifier.affixType === 'prefix' ? 'prefixes' : 'suffixes'].push({ goalId: modifier.goalId, modifierId: modifier.id, optionId: option.optionId, tierId: option.id, groupId: modifier.groupId, source: 'crafted', fractured: false })
        return state
      }
    }
  ]
}

export function createHarvestProviders() {
  return [
    {
      id: 'harvest:reforge-tag', name: '花园标签重铸', category: 'harvest',
      canApply: ({ state, tag }) => state.rarity === 'rare' && Boolean(tag),
      apply: (context) => rollItem(context, 'rare', { requiredTag: context.tag })
    },
    {
      id: 'harvest:reforge-more-likely', name: '更可能保留同类词缀重铸', category: 'harvest',
      canApply: ({ state }) => state.rarity === 'rare',
      apply: (context) => {
        const existingTags = [...context.state.prefixes, ...context.state.suffixes].flatMap((affix) => context.dataset.modifiers.find((entry) => entry.id === affix.modifierId)?.tags ?? [])
        return rollItem(context, 'rare', { requiredTag: existingTags[0] || null })
      }
    },
    {
      id: 'harvest:reforge-less-likely', name: '更不可能保留同类词缀重铸', category: 'harvest',
      canApply: ({ state }) => state.rarity === 'rare', apply: (context) => rollItem(context, 'rare')
    },
    {
      id: 'harvest:remove-add-tag', name: '移除并添加标签词缀', category: 'harvest',
      canApply: ({ state, tag }) => state.rarity === 'rare' && Boolean(tag) && mutableAffixes(state).length > 0,
      apply: (context) => {
        const pool = mutableAffixes(context.state)
        removeAffix(context.state, pool[Math.floor(context.rng() * pool.length)])
        addRandomAffix(context, { tag: context.tag })
        return context.state
      }
    },
    {
      id: 'harvest:convert-tag', name: '转换抗性或元素伤害', category: 'harvest',
      canApply: ({ state, fromTag, toTag, dataset }) => Boolean(fromTag && toTag) && [...state.prefixes, ...state.suffixes].some((affix) => dataset.modifiers.find((entry) => entry.id === affix.modifierId)?.tags.includes(fromTag)),
      apply: (context) => {
        const selected = mutableAffixes(context.state).find(({ entry }) => context.dataset.modifiers.find((modifier) => modifier.id === entry.modifierId)?.tags.includes(context.fromTag))
        if (!selected) return context.state
        const type = selected.type
        removeAffix(context.state, selected)
        addRandomAffix(context, { tag: context.toTag, forcedType: type })
        return context.state
      }
    },
    {
      id: 'harvest:reforge-influence', name: '势力词缀重铸', category: 'harvest',
      canApply: ({ state }) => state.rarity === 'rare' && state.influences.length > 0,
      apply: (context) => rollItem(context, 'rare')
    }
  ]
}

export function createDefaultActionRegistry() {
  const registry = new CraftActionRegistry()
  ;[...createCurrencyProviders(), ...createBenchProviders(), ...createHarvestProviders()].forEach((provider) => registry.register(provider))
  return registry
}

export function applyAction(registry, id, context) {
  return registry.apply(id, { ...context, state: cloneCraftState(context.state), rng: context.rng ?? Math.random })
}
