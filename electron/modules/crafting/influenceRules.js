import { rolledAffix } from './actionProviders.js'
import { eligibleModifierTiers } from './craftState.js'
import { modifierMatchesBase } from './variantRules.js'

export const INFLUENCE_LABELS = Object.freeze({
  shaper: '塑界者', elder: '裂界者', crusader: '圣战者', redeemer: '救赎者', hunter: '狩猎者', warlord: '督军'
})

const EXALTED_NAMES = Object.freeze({
  shaper: '塑界者的崇高石', elder: '裂界者的崇高石', crusader: '圣战者的崇高石',
  redeemer: '救赎者的崇高石', hunter: '狩猎者的崇高石', warlord: '督军的崇高石'
})

export const INFLUENCE_CURRENCY_DEFINITIONS = Object.freeze([
  ...Object.keys(INFLUENCE_LABELS).map((influence) => ({
    id: `influence:${influence}-exalted`, name: EXALTED_NAMES[influence], kind: 'exalted', influence,
    description: `为未受势力影响的稀有装备添加${INFLUENCE_LABELS[influence]}势力及一条${INFLUENCE_LABELS[influence]}词缀。`,
    requirements: '未腐化、未分裂、非破裂/综合/异界底材的无势力稀有装备，且有词缀位与合法候选',
    consequences: `保留现有词缀，装备变为${INFLUENCE_LABELS[influence]}势力并随机增加一条对应势力词缀。`,
    destructive: false,
    cost: [{ resourceId: `currency:${influence}-exalted`, resourceName: EXALTED_NAMES[influence], amount: 1 }]
  })),
  {
    id: 'influence:orb-of-dominance', name: '统御宝珠', kind: 'dominance',
    description: '随机移除一条势力词缀，并将另一条势力词缀升一阶；最高普通阶可升为尊崇词缀。',
    requirements: '魔法或稀有头盔、胸甲、手套、鞋子，且至少有两条未受保护并可升阶的势力词缀',
    consequences: '一条势力词缀被永久移除；另一条升阶并重骰数值。尊崇 T1 再次被选中时仅重骰数值。',
    destructive: true,
    cost: [{ resourceId: 'currency:orb-of-dominance', resourceName: '统御宝珠', amount: 1 }]
  },
  {
    id: 'influence:awakeners-orb', name: '觉醒者之石', kind: 'awakener',
    description: '销毁一件单势力供体，把供体与受体各一条随机势力词缀合并到受体底材。',
    requirements: '同装备类型、各恰有一种且势力不同的未腐化装备；双方各至少一条所属势力词缀',
    consequences: '供体被销毁；受体保留底材和物品等级，变为双势力稀有装备，继承词缀数值及其他词缀全部重骰。',
    destructive: true,
    cost: [{ resourceId: 'currency:awakeners-orb', resourceName: '觉醒者之石', amount: 1 }]
  }
])

export const DOMINANCE_ITEM_CLASSES = Object.freeze(['Helmet', 'BodyArmour', 'Gloves', 'Boots'])

export function itemInfluences(session) {
  return [...new Set([...(session?.state?.influences ?? []), ...(session?.variant?.influences ?? [])])]
}

export function influenceAffixes(dataset, session, influence = null) {
  return [...session.state.prefixes, ...session.state.suffixes].flatMap((affix) => {
    const modifier = dataset.modifiers.find((entry) => entry.id === affix.modifierId)
    const matches = modifier?.influences?.filter((entry) => !influence || entry === influence) ?? []
    return matches.length ? [{ affix, modifier, influence: matches[0] }] : []
  })
}

function filteredByRollMeta(entries, state) {
  return entries.filter(({ modifier }) => {
    if (state.meta?.cannotRollAttack && (modifier.tags.includes('attack') || modifier.tags.includes('攻击'))) return false
    if (state.meta?.cannotRollCaster && (modifier.tags.includes('caster') || modifier.tags.includes('法术'))) return false
    return true
  })
}

export function influenceExaltedCandidates(dataset, session, influence) {
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) return []
  const variant = { kind: 'influenced', influences: [influence], fracturedTierId: null, implicits: [] }
  const entries = eligibleModifierTiers(dataset, base, session.itemLevel, variant, session.state, { sources: ['natural'] })
    .filter(({ modifier }) => modifier.influences?.includes(influence))
  return filteredByRollMeta(entries, session.state)
}

export function influenceExaltedUnavailableReason(dataset, session, influence) {
  if (!INFLUENCE_LABELS[influence]) return '未知势力'
  if (session.state.corrupted) return '已腐化物品不能使用势力崇高石'
  if (session.state.split) return '已分裂物品不能添加势力'
  if (session.state.rarity !== 'rare') return '势力崇高石只能用于稀有物品'
  if (itemInfluences(session).length || session.variant.kind === 'influenced') return '已有势力的物品不能再次使用势力崇高石'
  if (session.variant.kind === 'fractured') return '破裂物品不能添加势力'
  if (session.variant.kind === 'synthesized') return '综合物品不能添加势力'
  if (session.variant.kind === 'eldritch' || session.state.eldritchImplicits?.exarch || session.state.eldritchImplicits?.eater) return '带异界固定词缀的物品不能添加势力'
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) return '所选底材不存在'
  const hasPrefix = session.state.prefixes.length < base.maxAffixes.prefix
  const hasSuffix = session.state.suffixes.length < base.maxAffixes.suffix
  if (!hasPrefix && !hasSuffix) return '该稀有物品没有可添加的词缀位'
  const candidates = influenceExaltedCandidates(dataset, session, influence).filter(({ modifier }) => modifier.affixType === 'prefix' ? hasPrefix : hasSuffix)
  if (!candidates.length) return `当前底材、物品等级和元属性下没有可生成的${INFLUENCE_LABELS[influence]}词缀`
  return ''
}

function dominanceUpgrade(dataset, affix, modifier) {
  const current = modifier.tiers.find((tier) => tier.id === affix.tierId)
  if (!current) return null
  if (current.tier === 1 && current.weight === 0) return { modifier, tier: current, rerollOnly: true }
  const tier = modifier.tiers.find((entry) => entry.tier === current.tier - 1)
  return tier ? { modifier, tier, rerollOnly: false } : null
}

export function dominanceCandidates(dataset, session) {
  const locked = { prefix: Boolean(session.state.meta?.prefixesLocked), suffix: Boolean(session.state.meta?.suffixesLocked) }
  return influenceAffixes(dataset, session).flatMap(({ affix, modifier, influence }) => {
    if (affix.fractured || locked[affix.affixType]) return []
    const upgrade = dominanceUpgrade(dataset, affix, modifier)
    return upgrade ? [{ affix, modifier, influence, upgrade }] : []
  })
}

export function dominanceUnavailableReason(dataset, session) {
  const base = dataset.bases.find((entry) => entry.id === session.baseId)
  if (!base) return '所选底材不存在'
  if (session.state.corrupted) return '已腐化物品不能使用统御宝珠'
  if (!DOMINANCE_ITEM_CLASSES.includes(base.itemClass)) return '统御宝珠只能用于头盔、胸甲、手套或鞋子'
  if (!['magic', 'rare'].includes(session.state.rarity)) return '统御宝珠只能用于魔法或稀有物品'
  if (dominanceCandidates(dataset, session).length < 2) return '至少需要两条未受前后缀保护且可升阶的势力词缀'
  return ''
}

export function donorTierCandidates(dataset, receiverSession, { baseId, itemLevel = 100, influence } = {}) {
  const receiverBase = dataset.bases.find((entry) => entry.id === receiverSession.baseId)
  const base = dataset.bases.find((entry) => entry.id === baseId)
  if (!receiverBase || !base || receiverBase.itemClass !== base.itemClass || !INFLUENCE_LABELS[influence]) return []
  const level = Math.max(base.requiredLevel, Math.min(100, Math.trunc(Number(itemLevel) || 1)))
  const variant = { kind: 'influenced', influences: [influence], fracturedTierId: null, implicits: [] }
  return dataset.modifiers.flatMap((modifier) => {
    if (!modifier.influences?.includes(influence) || !modifierMatchesBase(modifier, base, variant)) return []
    return modifier.tiers.filter((tier) => tier.requiredLevel <= level && (tier.weight > 0 || (tier.tier === 1 && tier.weight === 0))).map((tier) => ({
      modifier, tier, modifierId: modifier.id, tierId: tier.id, affixType: modifier.affixType,
      name: modifier.name, tierName: tier.name, text: tier.text, displayTags: tier.displayTags, weight: tier.weight
    }))
  })
}

export function awakenersOrbUnavailableReason(dataset, receiver, donor) {
  if (!donor) return '请先配置觉醒者之石供体'
  const receiverBase = dataset.bases.find((entry) => entry.id === receiver.baseId)
  const donorBase = dataset.bases.find((entry) => entry.id === donor.baseId)
  if (!receiverBase || !donorBase) return '供体或受体底材不存在'
  if (receiverBase.itemClass !== donorBase.itemClass) return '供体与受体必须属于相同装备类型'
  if (receiver.state.corrupted || donor.state.corrupted) return '已腐化装备不能使用觉醒者之石'
  if (receiver.state.split || donor.state.split) return '已分裂装备不能使用觉醒者之石'
  if (['fractured', 'synthesized', 'eldritch'].includes(receiver.variant.kind) || ['fractured', 'synthesized', 'eldritch'].includes(donor.variant.kind)) return '破裂、综合或异界底材不能用于觉醒者之石'
  const receiverInfluences = itemInfluences(receiver)
  const donorInfluences = itemInfluences(donor)
  if (receiverInfluences.length !== 1 || donorInfluences.length !== 1) return '供体与受体必须各自恰好具有一种势力'
  if (receiverInfluences[0] === donorInfluences[0]) return '供体与受体的势力必须不同'
  if (!influenceAffixes(dataset, receiver, receiverInfluences[0]).length) return '受体没有可继承的所属势力词缀'
  if (!influenceAffixes(dataset, donor, donorInfluences[0]).length) return '供体没有可继承的所属势力词缀'
  return ''
}

export function createDonorAffix(modifier, tier, rng) {
  return rolledAffix(modifier, tier, rng, { source: modifier.influences?.[0] ?? 'natural' })
}
