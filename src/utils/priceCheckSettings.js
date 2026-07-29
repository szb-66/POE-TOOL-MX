export const DEFAULT_PRICE_CHECK_SETTINGS = Object.freeze({
  enabled: false,
  status: 'available',
  listed: 'any',
  currency: 'any',
  collapseListings: false,
  valueRange: 'down20',
  initialSelection: 'auto'
})

const allowed = {
  status: new Set(['available', 'instant', 'any']),
  listed: new Set(['any', '1day', '3days', '1week', '2weeks', '1month', '2months']),
  currency: new Set(['any', 'chaos', 'divine', 'chaos_divine']),
  valueRange: new Set(['original', 'down10', 'down20', 'unlimited']),
  initialSelection: new Set(['auto', 'all', 'none'])
}

export function normalizePriceCheckSettings(raw = {}) {
  const normalized = {
    ...DEFAULT_PRICE_CHECK_SETTINGS,
    enabled: raw.enabled === true,
    collapseListings: raw.collapseListings === true
  }
  for (const key of Object.keys(allowed)) {
    if (allowed[key].has(raw[key])) normalized[key] = raw[key]
  }
  return normalized
}
