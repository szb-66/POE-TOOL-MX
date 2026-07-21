import { BASE_VARIANTS } from './model.js'

const INFLUENCES = new Set(['shaper', 'elder', 'crusader', 'redeemer', 'hunter', 'warlord'])

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

export function modifierCanSpawn(modifier, base, itemLevel, variant = { kind: 'normal' }) {
  const classKey = (value) => String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  if (modifier.itemClasses?.length && !modifier.itemClasses.some((itemClass) => classKey(itemClass) === classKey(base.itemClass))) return false
  const baseTags = new Set(base.tags)
  if (modifier.requiredTags?.length && !modifier.requiredTags.every((tag) => baseTags.has(tag))) return false
  const specificSpawnTags = modifier.spawnTags.filter((tag) => tag !== 'default')
  const hasSpawnTag = !specificSpawnTags.length || specificSpawnTags.some((tag) => baseTags.has(tag))
  if (!hasSpawnTag) return false
  if (!modifier.tiers.some((tier) => tier.requiredLevel <= itemLevel && tier.weight > 0)) return false
  if (modifier.influences.length) {
    if (variant.kind !== 'influenced') return false
    if (!modifier.influences.some((influence) => variant.influences?.includes(influence))) return false
  }
  if (modifier.source === 'fractured' && variant.kind !== 'fractured') return false
  return true
}

export function legalModifierTiers(modifier, itemLevel) {
  return modifier.tiers.filter((tier) => tier.requiredLevel <= itemLevel && (tier.weight > 0 || modifier.source === 'crafted'))
}
