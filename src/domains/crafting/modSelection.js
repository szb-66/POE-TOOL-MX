export function tierSelectionKey(tier) {
  if (!tier?.modifierId || !tier?.id) throw new Error('词缀阶级缺少稳定标识')
  return `${tier.modifierId}:${tier.id}`
}

export function selectableFamilyTiers(family) {
  return (family?.tiers ?? []).filter((tier) => tier.available)
}

export function familySelectionState(selectedKeys, family) {
  const keys = selectableFamilyTiers(family).map(tierSelectionKey)
  const selectedCount = keys.filter((key) => selectedKeys.has(key)).length
  return {
    checked: keys.length > 0 && selectedCount === keys.length,
    indeterminate: selectedCount > 0 && selectedCount < keys.length,
    selectedCount,
    selectableCount: keys.length
  }
}

export function toggleTierSelection(selectedKeys, tier, checked) {
  const next = new Set(selectedKeys)
  const key = tierSelectionKey(tier)
  if (checked && tier.available) next.add(key)
  else next.delete(key)
  return next
}

export function toggleFamilySelection(selectedKeys, family, checked) {
  const next = new Set(selectedKeys)
  selectableFamilyTiers(family).forEach((tier) => {
    const key = tierSelectionKey(tier)
    if (checked) next.add(key)
    else next.delete(key)
  })
  return next
}
