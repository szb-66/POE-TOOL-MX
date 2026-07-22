import { eligibleModifierTiers } from './craftState.js'
import { craftedOptionMatchesBase, modifierMatchesBase } from './variantRules.js'

export const HARVEST_TAGS = Object.freeze([
  ['fire', '火焰'], ['cold', '冰霜'], ['lightning', '闪电'], ['physical', '物理'],
  ['life', '生命'], ['defences', '防御'], ['chaos', '混沌'], ['attack', '攻击'],
  ['caster', '施法'], ['speed', '速度'], ['critical', '暴击'], ['minion', '召唤生物'],
  ['elemental', '元素'], ['attribute', '属性'], ['mana', '魔力'], ['drop', '掉落']
].map(([id, label]) => ({ id, label })))

export const HARVEST_TAG_LABELS = Object.freeze(Object.fromEntries(HARVEST_TAGS.map(({ id, label }) => [id, label])))
export const HARVEST_MORE_MULTIPLIER = 10
export const HARVEST_LESS_MULTIPLIER = 0.1
export const HARVEST_INFLUENCES = Object.freeze(['shaper', 'elder', 'crusader', 'redeemer', 'hunter', 'warlord'])

export const HARVEST_CATEGORY_LABELS = Object.freeze({
  reforge: '标签重铸', tendency: '同类倾向', conversion: '元素转换', augment: '移除并添加',
  influence: '势力制作', enchant: '品质附魔', unavailable: '暂不可执行', other: '非装备配方'
})

const MELEE_WEAPON_CLASSES = new Set([
  'Claw', 'Dagger', 'RuneDagger', 'OneHandSword', 'ThrustingOneHandSword', 'OneHandAxe',
  'OneHandMace', 'Sceptre', 'Staff', 'Warstaff', 'TwoHandSword', 'TwoHandAxe', 'TwoHandMace'
])
const WEAPON_CLASSES = new Set([...MELEE_WEAPON_CLASSES, 'Wand', 'Bow'])

export function harvestCraftCategory(effectKind) {
  if (effectKind === 'reforge_tag') return 'reforge'
  if (['reforge_more_likely', 'reforge_less_likely'].includes(effectKind)) return 'tendency'
  if (['convert_resistance', 'convert_damage'].includes(effectKind)) return 'conversion'
  if (effectKind === 'remove_add_tag') return 'augment'
  if (['reforge_influence', 'randomize_influence'].includes(effectKind)) return 'influence'
  if (effectKind === 'quality_enchant') return 'enchant'
  if (['synthesize_item', 'white_socket'].includes(effectKind)) return 'unavailable'
  return 'other'
}

export function isEquipmentHarvestCraft(craft) {
  return harvestCraftCategory(craft.effectKind) !== 'other'
}

export function qualityEffectMatchesBase(scope, base) {
  if (scope === 'body_armour') return base.itemClass === 'BodyArmour'
  if (scope === 'melee_weapon') return MELEE_WEAPON_CLASSES.has(base.itemClass)
  if (scope === 'weapon') return WEAPON_CLASSES.has(base.itemClass)
  return false
}

export function modifierTags(dataset, affix) {
  return dataset.modifiers.find((entry) => entry.id === affix.modifierId)?.tags ?? affix.displayTags?.map((entry) => entry.id) ?? []
}

export function existingHarvestTags(dataset, state) {
  return [...new Set([...state.prefixes, ...state.suffixes].flatMap((affix) => modifierTags(dataset, affix)))]
}

export function createSameTypePoolTransform(tags, direction) {
  const current = new Set(tags)
  const multiplier = direction === 'more' ? HARVEST_MORE_MULTIPLIER : HARVEST_LESS_MULTIPLIER
  return (pool) => pool.map((entry) => ({
    ...entry,
    weight: entry.weight * (entry.modifier.tags.some((tag) => current.has(tag)) ? multiplier : 1)
  })).filter((entry) => entry.weight > 0)
}

export function blockedByRollMeta(state, modifier) {
  if (state.meta.cannotRollAttack && modifier.tags.includes('attack')) return true
  if (state.meta.cannotRollCaster && modifier.tags.includes('caster')) return true
  return false
}

function normalizedElementEffect(value) {
  return String(value || '')
    .replaceAll('火焰', '{element}').replaceAll('冰霜', '{element}').replaceAll('闪电', '{element}')
    .replace(/\b(?:fire|cold|lightning)\b/gi, '{element}')
}

function isCriticalMultiplier(modifier, tier) {
  return modifier.tags.includes('critical') && /暴击伤害加成|critical strike multiplier/i.test(`${modifier.effectKey} ${tier.text}`)
}

function isConversionKind(modifier, tier, kind, element) {
  if (!modifier.tags.includes(element)) return false
  if (kind === 'resistance') return modifier.tags.includes('resistance')
  return modifier.tags.includes('damage') && !modifier.tags.includes('resistance') && !isCriticalMultiplier(modifier, tier)
}

export function conversionSources(dataset, state, { fromTag, kind }) {
  return [...state.prefixes, ...state.suffixes].flatMap((affix) => {
    if (affix.fractured || affix.metaCraft) return []
    if (affix.affixType === 'prefix' && state.meta.prefixesLocked) return []
    if (affix.affixType === 'suffix' && state.meta.suffixesLocked) return []
    const modifier = dataset.modifiers.find((entry) => entry.id === affix.modifierId)
    const tier = modifier?.tiers.find((entry) => entry.id === affix.tierId)
      ?? modifier?.craftedOptions?.find((entry) => entry.id === affix.tierId || entry.optionId === affix.optionId)
    return modifier && tier && isConversionKind(modifier, tier, kind, fromTag) ? [{ affix, modifier, tier }] : []
  })
}

export function conversionTargets(dataset, base, itemLevel, variant, state, source, { toTag, kind }) {
  const stateWithoutSource = structuredClone(state)
  const key = source.affix.affixType === 'prefix' ? 'prefixes' : 'suffixes'
  stateWithoutSource[key] = stateWithoutSource[key].filter((entry) => entry !== source.affix && entry.tierId !== source.affix.tierId)
  const naturalPool = source.affix.source === 'crafted' ? [] : eligibleModifierTiers(dataset, base, itemLevel, variant, stateWithoutSource, {
    sources: [source.modifier.source], affixType: source.affix.affixType
  })
  const craftedPool = source.affix.source === 'crafted' ? dataset.modifiers.flatMap((modifier) => {
    if (!modifier.craftedOptions?.length || modifier.affixType !== source.affix.affixType || !modifierMatchesBase(modifier, base, variant)) return []
    return modifier.craftedOptions.filter((option) => option.requiredLevel <= itemLevel && craftedOptionMatchesBase(option, base))
      .map((tier) => ({ modifier, tier, weight: 1, crafted: true }))
  }) : []
  const occupiedGroups = new Set([...stateWithoutSource.prefixes, ...stateWithoutSource.suffixes].map((entry) => entry.groupId))
  const pool = [...naturalPool, ...craftedPool].filter(({ modifier, tier }) => {
    if (occupiedGroups.has(modifier.groupId) || !isConversionKind(modifier, tier, kind, toTag)) return false
    return normalizedElementEffect(modifier.effectKey) === normalizedElementEffect(source.modifier.effectKey)
  })
  const distance = (entry) => Math.abs(Number(entry.tier.tier) - Number(source.tier.tier))
  const bestDistance = pool.length ? Math.min(...pool.map(distance)) : Infinity
  return pool.filter((entry) => distance(entry) === bestDistance)
}

export function harvestUnavailableExplanation(effectKind) {
  if (effectKind === 'synthesize_item') return '当前快照缺少可审计的追忆固定词缀结果池，不能准确生成结果'
  if (effectKind === 'white_socket') return '当前装备状态尚未保存插槽颜色，不能准确生成白色插槽结果'
  return '此配方作用于地图、宝石、物品堆叠或其他非当前装备输入，不能在本装备模拟器中执行'
}
