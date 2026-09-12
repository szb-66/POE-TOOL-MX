// Preserve stored names/unknown IDs without making them available for new selections.
export function afflictionOptions(catalog = [], selected = []) {
  const options = catalog.map(entry => ({ ...entry, disabled: selected.includes(entry.label) && !selected.includes(entry.id) }))
  for (const value of new Set(selected)) {
    if (options.some(option => option.id === value)) continue
    const known = catalog.find(entry => entry.label === value)
    options.push({ id: value, label: known?.label || value, descriptions: known?.descriptions || [] })
  }
  return options
}

export function canAddStrategyWeight(strategy, group, key, options) {
  return Boolean(key && !['__proto__', 'constructor', 'prototype'].includes(key)
    && strategy[group] && !Object.hasOwn(strategy[group], key)
    && (!options || options.some(option => option.id === key)))
}
