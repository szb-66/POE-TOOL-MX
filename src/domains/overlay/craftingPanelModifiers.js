const DISPLAYED_MODIFIER_TYPES = new Set(['prefix', 'suffix', 'fractured'])

export function craftingPanelModifiers(itemInfo = {}) {
  const modifiers = Array.isArray(itemInfo.modifiers)
    ? itemInfo.modifiers.filter((modifier) => DISPLAYED_MODIFIER_TYPES.has(modifier?.type))
    : []
  if (modifiers.length) return modifiers
  return Array.isArray(itemInfo.detailedMods) ? itemInfo.detailedMods : []
}

export function craftingModifierAffixType(modifier = {}) {
  if (modifier.type === 'prefix' || modifier.type === 'suffix') return modifier.type
  return modifier.affixType === 'prefix' || modifier.affixType === 'suffix'
    ? modifier.affixType
    : ''
}

export function craftingModifierTierLabel(modifier = {}) {
  const affixType = craftingModifierAffixType(modifier)
  const prefix = affixType === 'prefix' ? 'P' : affixType === 'suffix' ? 'S' : 'F'
  const tier = Number(modifier.tier)
  return tier > 0 ? `${prefix}${tier}` : prefix
}
