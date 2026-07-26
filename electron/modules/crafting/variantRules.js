import { BASE_VARIANTS } from './model.js'

export const INFLUENCE_SPAWN_TAGS = Object.freeze({
  shaper: 'shaper',
  elder: 'elder',
  crusader: 'crusader',
  redeemer: 'eyrie',
  hunter: 'basilisk',
  warlord: 'adjudicator'
})
const INFLUENCES = new Set(Object.keys(INFLUENCE_SPAWN_TAGS))
const BENCH_CLASS_GROUPS = {
  Claw: '单手近战', Dagger: '单手近战', RuneDagger: '单手近战', OneHandSword: '单手近战',
  ThrustingOneHandSword: '单手近战', OneHandAxe: '单手近战', OneHandMace: '单手近战', Sceptre: '单手近战',
  Wand: '单手远程', TwoHandSword: '双手近战', TwoHandAxe: '双手近战', TwoHandMace: '双手近战',
  Staff: '双手近战', Warstaff: '双手近战', Bow: '双手远程', BodyArmour: '护甲', Gloves: '手套',
  Boots: '鞋子', Helmet: '头盔', Shield: '盾', Ring: '戒指', Amulet: '项链', Belt: '腰带', Quiver: '箭袋'
}
export const BENCH_SUPPORTED_ITEM_CLASSES = [...new Set(Object.values(BENCH_CLASS_GROUPS))]
export const EQUIPMENT_ITEM_CLASSES = Object.freeze(Object.keys(BENCH_CLASS_GROUPS))
export const HOLLOW_FOSSIL_ITEM_CLASSES = Object.freeze(EQUIPMENT_ITEM_CLASSES.filter((itemClass) => !['Shield', 'Ring', 'Amulet', 'Belt', 'Quiver'].includes(itemClass)))

export function craftedOptionMatchesBase(option, base) {
  if (!option.itemClasses?.length) return true
  const group = BENCH_CLASS_GROUPS[base.itemClass]
  return Boolean(group && option.itemClasses.includes(group))
}

export function validateBaseVariant(base, variant = { kind: 'normal' }) {
  const errors = []
  const kind = String(variant.kind || 'normal')
  if (!BASE_VARIANTS.has(kind)) errors.push({ code: 'unknown_variant', message: `未知底材状态：${kind}` })
  if (!base.allowedVariants.includes(kind)) errors.push({ code: 'variant_not_allowed', message: `${base.name} 不支持${kind}状态` })
  const influences = [...new Set(variant.influences ?? [])]
  if (kind === 'influenced') {
    if (influences.length < 1 || influences.length > 2) errors.push({ code: 'influence_count', message: '势力底材必须选择 1 至 2 种势力' })
    const invalid = influences.filter((entry) => !INFLUENCES.has(entry))
    if (invalid.length) errors.push({ code: 'invalid_influence', message: `未知势力：${invalid.join('、')}` })
  } else if (influences.length) {
    errors.push({ code: 'unexpected_influence', message: '只有势力底材可以设置势力' })
  }
  if (kind === 'fractured' && !variant.fracturedTierId) {
    errors.push({ code: 'fracture_required', message: '破裂底材必须选择一条破裂词缀' })
  }
  if (kind !== 'fractured' && variant.fracturedTierId) {
    errors.push({ code: 'unexpected_fracture', message: '非破裂底材不能设置破裂词缀' })
  }
  const implicits = variant.implicits ?? []
  if (!['synthesized', 'eldritch'].includes(kind) && implicits.length) {
    errors.push({ code: 'unexpected_implicits', message: '只有追忆或异能底材可以设置特殊固定词缀' })
  }
  return { valid: errors.length === 0, errors }
}

export function modifierMatchesBase(modifier, base, variant = { kind: 'normal' }) {
  if (modifier.modifierProfileId && modifier.modifierProfileId !== 'default' && base.modifierProfileId && modifier.modifierProfileId !== base.modifierProfileId) return false
  const classKey = (value) => String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  if (modifier.itemClasses?.length && !modifier.itemClasses.some((itemClass) => classKey(itemClass) === classKey(base.itemClass))) return false
  const baseTags = new Set(base.tags)
  // POEDB 的智慧盾词缀仍以 int_armour/focus 标识，底材页则使用 int_shield。
  if (baseTags.has('int_shield')) baseTags.add('int_armour')
  // 势力词缀的 Spawn Weight 使用 ring_shaper、str_armour_hunter 等组合标签。
  // 底材页只提供 ring、str_armour 等基础标签，因此按当前势力补齐组合标签。
  if (variant.kind === 'influenced') {
    const plainTags = [...baseTags]
    for (const influence of variant.influences ?? []) {
      const spawnTag = INFLUENCE_SPAWN_TAGS[influence] ?? influence
      for (const tag of plainTags) baseTags.add(`${tag}_${spawnTag}`)
    }
  }
  if (modifier.requiredTags?.length && !modifier.requiredTags.every((group) => String(group).split(',').some((tag) => baseTags.has(tag.trim())))) return false
  // POEDB payload 中的 spawn_no 表示物品已获得某标签后该词缀禁止继续生成，
  // 不是底材必须具备的正向 Spawn Weight 标签。底材适用范围已经由
  // modifierProfileId、itemClasses 和页面 requiredTags 限定，不能再用
  // spawn_no 过滤目录，否则会漏掉页面中的合法词缀并缩小概率分母。
  if (modifier.influences.length) {
    if (variant.kind !== 'influenced') return false
    if (!modifier.influences.some((influence) => variant.influences?.includes(influence))) return false
  }
  if (modifier.source === 'fractured' && variant.kind !== 'fractured') return false
  return true
}

export function modifierCanSpawn(modifier, base, itemLevel, variant = { kind: 'normal' }) {
  if (!modifierMatchesBase(modifier, base, variant)) return false
  const hasNaturalTier = modifier.tiers.some((tier) => tier.requiredLevel <= itemLevel && tier.weight > 0)
  const hasCraftedTier = modifier.craftedOptions?.some((tier) => tier.requiredLevel <= itemLevel && craftedOptionMatchesBase(tier, base))
  return hasNaturalTier || hasCraftedTier
}

export function legalModifierTiers(modifier, itemLevel) {
  return modifier.tiers.filter((tier) => tier.requiredLevel <= itemLevel && (tier.weight > 0 || modifier.source === 'crafted'))
}
