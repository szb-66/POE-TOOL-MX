import { renderRolledText, rollTierValues } from './actionProviders.js'

export const ELDRITCH_ITEM_CLASSES = Object.freeze(['Helmet', 'Gloves', 'Boots', 'BodyArmour'])
export const ELDRITCH_SOURCE_LABELS = Object.freeze({ exarch: '焚界者', eater: '灭界者' })
export const ELDRITCH_TIER_LABELS = Object.freeze({ 1: '次级', 2: '高级', 3: '上级', 4: '卓越', 5: '精美', 6: '完美' })

const direct = (source, tier, id, name) => ({
  id: `eldritch:${id}`, resourceId: `currency:${id}`, name, kind: 'implicit', source, tier,
  cost: [{ resourceId: `currency:${id}`, resourceName: name, amount: 1 }],
  description: `添加一个${ELDRITCH_TIER_LABELS[tier]}${ELDRITCH_SOURCE_LABELS[source]}基底词缀`,
  requirements: '未腐化、非六势力的头盔、手套、鞋子或身体护甲',
  consequences: `替换${ELDRITCH_SOURCE_LABELS[source]}一侧及全部普通固定词缀，保留另一侧古灵隐式`
})

export const ELDRITCH_CURRENCY_DEFINITIONS = Object.freeze([
  direct('exarch', 1, 'lesser-eldritch-ember', '次级古灵余烬'),
  direct('exarch', 2, 'greater-eldritch-ember', '高级古灵余烬'),
  direct('exarch', 3, 'grand-eldritch-ember', '上级古灵余烬'),
  direct('exarch', 4, 'exceptional-eldritch-ember', '卓越古灵余烬'),
  direct('eater', 1, 'lesser-eldritch-ichor', '次级古灵溶液'),
  direct('eater', 2, 'greater-eldritch-ichor', '高级古灵溶液'),
  direct('eater', 3, 'grand-eldritch-ichor', '上级古灵溶液'),
  direct('eater', 4, 'exceptional-eldritch-ichor', '卓越古灵溶液'),
  {
    id: 'eldritch:chaos', resourceId: 'currency:eldritch-chaos', name: '古灵混沌石', kind: 'chaos',
    cost: [{ resourceId: 'currency:eldritch-chaos', resourceName: '古灵混沌石', amount: 1 }],
    description: '焚界者支配时重置前缀；灭界者支配时重置后缀', requirements: '具有唯一支配方的稀有物品', consequences: '只重铸支配方对应的显式词缀侧'
  },
  {
    id: 'eldritch:exalted', resourceId: 'currency:eldritch-exalted', name: '古灵崇高石', kind: 'exalted',
    cost: [{ resourceId: 'currency:eldritch-exalted', resourceName: '古灵崇高石', amount: 1 }],
    description: '焚界者支配时添加前缀；灭界者支配时添加后缀', requirements: '具有唯一支配方且目标侧有空位的稀有物品', consequences: '只向支配方对应侧添加一条合法显式词缀'
  },
  {
    id: 'eldritch:annulment', resourceId: 'currency:eldritch-annulment', name: '古灵无效石', kind: 'annulment',
    cost: [{ resourceId: 'currency:eldritch-annulment', resourceName: '古灵无效石', amount: 1 }],
    description: '焚界者支配时移除前缀；灭界者支配时移除后缀', requirements: '具有唯一支配方且目标侧有合法可移除词缀的魔法或稀有物品', consequences: '只从支配方对应侧随机移除一条合法显式词缀'
  },
  {
    id: 'eldritch:conflict', resourceId: 'currency:orb-of-conflict', name: '冲突石', kind: 'conflict',
    cost: [{ resourceId: 'currency:orb-of-conflict', resourceName: '冲突石', amount: 1 }],
    description: '随机提高一侧古灵隐式阶级，同时降低另一侧', requirements: '同时具有焚界者和灭界者隐式的非腐化装备', consequences: 'T1 被降低时移除；T6 被选中升级时升级被浪费'
  }
])

export function eldritchDominance(state) {
  const exarchTier = Number(state.eldritchImplicits?.exarch?.tier) || 0
  const eaterTier = Number(state.eldritchImplicits?.eater?.tier) || 0
  if (exarchTier === eaterTier) return { source: null, affixType: null, label: '无支配', exarchTier, eaterTier }
  const source = exarchTier > eaterTier ? 'exarch' : 'eater'
  return { source, affixType: source === 'exarch' ? 'prefix' : 'suffix', label: `${ELDRITCH_SOURCE_LABELS[source]}支配`, exarchTier, eaterTier }
}

export function conflictUpgradeChance(upgradeTier, otherTier) {
  return Math.max(0.05, Math.min(0.95, Number((0.5 - 0.11 * (upgradeTier - otherTier)).toFixed(4))))
}

export function eldritchImplicitCandidates(dataset, base, itemLevel, source, tier) {
  return (dataset.eldritchImplicitFamilies ?? []).flatMap((family) => {
    if (family.source !== source || !family.itemClasses.includes(base.itemClass)) return []
    const selectedTier = family.tiers.find((entry) => entry.tier === tier && entry.requiredLevel <= itemLevel && Number(entry.weights?.[base.itemClass]) > 0)
    return selectedTier ? [{ family, tier: selectedTier, weight: Number(selectedTier.weights[base.itemClass]) }] : []
  })
}

export function rolledEldritchImplicit(family, tier, base, rng = Math.random) {
  const rolledValues = rollTierValues(tier, rng)
  return {
    source: family.source, familyId: family.id, tierId: tier.id, tier: tier.tier,
    name: `${ELDRITCH_TIER_LABELS[tier.tier]}${ELDRITCH_SOURCE_LABELS[family.source]}隐式`,
    text: tier.text, rolledText: renderRolledText(tier.text, rolledValues),
    valueRanges: structuredClone(tier.values), rolledValues,
    displayTags: structuredClone(tier.displayTags?.length ? tier.displayTags : family.displayTags),
    weight: Number(tier.weights?.[base.itemClass]) || 0
  }
}

export function replaceEldritchTier(dataset, instance, nextTier, base, rng = Math.random) {
  if (!instance || nextTier < 1) return null
  const family = dataset.eldritchImplicitFamilies.find((entry) => entry.id === instance.familyId)
  const tier = family?.tiers.find((entry) => entry.tier === Math.min(6, nextTier))
  if (!family || !tier) throw new Error('古灵隐式家族缺少目标阶级')
  return rolledEldritchImplicit(family, tier, base, rng)
}
