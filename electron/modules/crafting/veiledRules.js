import { bucketModifierFamilies, pickWeighted } from './actionProviders.js'
import { clearMutableAffixes, eligibleModifierTiers, mutableAffixes } from './craftState.js'
import { normalizeCraftState } from './model.js'
import { modifierMatchesBase } from './variantRules.js'

export const VEILED_CURRENCY_DEFINITIONS = Object.freeze([
  {
    id: 'veiled:exalted', name: '加密崇高石', kind: 'exalted',
    description: '随机移除一条词缀，再添加一个未揭露的加密词缀。',
    requirements: '未腐化稀有装备；没有加密词缀或其工艺版本；存在完整的移除、占位与三选一结果',
    consequences: '受前后缀无法改变保护的词缀不会被移除；攻击/施法生成限制不保护移除，也不限制揭露选项。',
    destructive: true,
    cost: [{ resourceId: 'currency:veiled-exalted-orb', resourceName: '加密崇高石', amount: 1 }]
  },
  {
    id: 'veiled:chaos', name: '加密混沌石', kind: 'chaos',
    description: '重铸一件稀有装备，并保证一个未揭露的加密词缀。',
    requirements: '未腐化稀有装备；位置锁不得保留已有加密词缀；至少一个位置拥有完整揭露池',
    consequences: '前后缀无法改变会保留对应侧；普通新词缀遵守操作开始时的攻击/施法限制，揭露选项不受影响。',
    destructive: true,
    cost: [{ resourceId: 'currency:veiled-chaos-orb', resourceName: '加密混沌石', amount: 1 }]
  }
])

const PENDING_IDS = Object.freeze({
  prefix: 'veiled-pending:prefix',
  suffix: 'veiled-pending:suffix'
})

export function createVeiledPlaceholder(affixType) {
  if (!PENDING_IDS[affixType]) throw new Error('未揭露词缀位置无效')
  const id = PENDING_IDS[affixType]
  return {
    goalId: id, modifierId: id, tierId: id, groupId: id,
    source: 'veiled-pending', affixType, veiled: true,
    name: affixType === 'prefix' ? '未揭露的加密前缀' : '未揭露的加密后缀',
    tierName: '未揭露', text: '尚未揭露', rolledText: '尚未揭露',
    valueRanges: [], rolledValues: [], displayTags: [], weight: 0,
    fractured: false, metaCraft: false
  }
}

export function createVeiledGuaranteedAffix(affixType) {
  const placeholder = createVeiledPlaceholder(affixType)
  return {
    modifier: {
      id: placeholder.modifierId, goalId: placeholder.goalId, groupId: placeholder.groupId,
      source: placeholder.source, affixType, name: placeholder.name, displayTags: [], influences: [], tags: []
    },
    tier: {
      id: placeholder.tierId, tier: 1, name: placeholder.tierName, requiredLevel: 1,
      weight: 0, text: placeholder.text, displayTags: [], values: []
    },
    source: placeholder.source,
    veiled: true
  }
}

export function pendingVeiledAffix(state) {
  const entries = [
    ...state.prefixes.map((affix, index) => ({ affix, affixType: 'prefix', index })),
    ...state.suffixes.map((affix, index) => ({ affix, affixType: 'suffix', index }))
  ]
  return entries.find(({ affix }) => affix.veiled || affix.source === 'veiled-pending') ?? null
}

export function veiledCandidateTiers(dataset, session, affixType, state = session.state) {
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base || !PENDING_IDS[affixType]) return []
  return eligibleModifierTiers(dataset, base, session.itemLevel, session.variant, state, {
    sources: ['veiled'], affixType
  })
}

export function sampleVeiledOptions(dataset, session, rng) {
  const pending = pendingVeiledAffix(session.state)
  if (!pending) return []
  let remaining = veiledCandidateTiers(dataset, session, pending.affixType)
  const selected = []
  while (selected.length < 3 && remaining.length) {
    const family = pickWeighted(bucketModifierFamilies(remaining), rng)
    const entry = family ? pickWeighted(family.entries, rng) : null
    if (!entry) break
    selected.push(entry)
    remaining = remaining.filter(({ modifier }) => {
      const familyId = modifier.familyId || `${modifier.modifierProfileId}:${modifier.affixType}:${modifier.groupId}`
      return familyId !== family.id
    })
  }
  return selected
}

export function veiledOptionView(entry) {
  return {
    modifierId: entry.modifier.id,
    tierId: entry.tier.id,
    affixType: entry.modifier.affixType,
    name: entry.modifier.name,
    tierName: entry.tier.name,
    text: entry.tier.text,
    displayTags: structuredClone(entry.tier.displayTags ?? entry.modifier.displayTags ?? []),
    requiredLevel: entry.tier.requiredLevel,
    weight: entry.tier.weight,
    groupId: entry.modifier.groupId
  }
}

function hasVeiledOrCraftedVersion(dataset, session) {
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) return false
  const affixes = [...session.state.prefixes, ...session.state.suffixes]
  if (affixes.some((affix) => affix.veiled || affix.source === 'veiled-pending' || affix.source === 'veiled')) return true
  const veiledGroups = new Set(dataset.modifiers
    .filter((modifier) => modifier.source === 'veiled' && modifierMatchesBase(modifier, base, session.variant))
    .map((modifier) => modifier.groupId))
  return affixes.some((affix) => affix.source === 'crafted' && veiledGroups.has(affix.groupId))
}

function availablePositions(dataset, session, state) {
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) return []
  return ['prefix', 'suffix'].filter((affixType) => {
    const key = affixType === 'prefix' ? 'prefixes' : 'suffixes'
    return state[key].length < base.maxAffixes[affixType]
      && veiledCandidateTiers(dataset, session, affixType, state).length >= 3
  })
}

export function veiledExaltedOutcomes(dataset, session) {
  if (hasVeiledOrCraftedVersion(dataset, session)) return []
  return mutableAffixes(session.state, { respectMeta: true }).flatMap((selected) => {
    const state = normalizeCraftState(session.state)
    const key = selected.type === 'prefix' ? 'prefixes' : 'suffixes'
    const index = session.state[key].indexOf(selected.entry)
    if (index < 0) return []
    state[key].splice(index, 1)
    const positions = availablePositions(dataset, session, state)
    return positions.length ? [{ removeType: selected.type, removeIndex: index, positions }] : []
  })
}

export function veiledExaltedUnavailableReason(dataset, session, outcomes = null) {
  if (session.state.corrupted) return '已腐化物品不能使用加密崇高石'
  if (session.state.rarity !== 'rare') return '加密崇高石只能用于稀有物品'
  if (hasVeiledOrCraftedVersion(dataset, session)) return '已有加密词缀、未揭露词缀或对应工艺版本，不能再次使用加密崇高石'
  if (!mutableAffixes(session.state, { respectMeta: true }).length) return '当前装备没有未受前后缀保护的可移除词缀'
  if (!(outcomes ?? veiledExaltedOutcomes(dataset, session)).length) return '移除后没有可容纳且至少有三个揭露候选的位置'
  return ''
}

export function veiledChaosPositions(dataset, session) {
  const state = normalizeCraftState(session.state)
  clearMutableAffixes(state)
  state.rarity = 'rare'
  return availablePositions(dataset, session, state)
}

export function veiledChaosUnavailableReason(dataset, session, positions = null) {
  if (session.state.corrupted) return '已腐化物品不能使用加密混沌石'
  if (session.state.rarity !== 'rare') return '加密混沌石只能用于稀有物品'
  const protectedAffixes = [
    ...(session.state.meta.prefixesLocked ? session.state.prefixes : []),
    ...(session.state.meta.suffixesLocked ? session.state.suffixes : [])
  ]
  if (protectedAffixes.some((affix) => affix.veiled || affix.source === 'veiled-pending' || affix.source === 'veiled')) {
    return '前后缀锁会保留已有加密词缀，不能再保证第二条加密词缀'
  }
  if (!(positions ?? veiledChaosPositions(dataset, session)).length) return '重铸后没有可容纳且至少有三个揭露候选的位置'
  return ''
}
