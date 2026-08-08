const SOURCES = new Set(['exarch', 'eater'])
const CURRENCY_BY_SOURCE = {
  exarch: ['lesser-eldritch-ember', 'greater-eldritch-ember', 'grand-eldritch-ember', 'exceptional-eldritch-ember'],
  eater: ['lesser-eldritch-ichor', 'greater-eldritch-ichor', 'grand-eldritch-ichor', 'exceptional-eldritch-ichor']
}

function text(value) {
  return String(value ?? '').trim()
}

export function normalizeEldritchTarget(input = {}) {
  if (!input || typeof input !== 'object') return null
  const familyId = text(input.familyId || input.id)
  const effectPattern = text(input.effectPattern)
  if (!familyId || !effectPattern) return null
  return {
    familyId,
    displayName: text(input.displayName) || effectPattern.replaceAll('#', '').replace(/\s+/g, ' ').trim(),
    effectPattern,
    applicableLabel: text(input.applicableLabel),
    source: SOURCES.has(input.source) ? input.source : ''
  }
}

export function normalizeEldritchModule(input = {}) {
  const source = SOURCES.has(input.source) ? input.source : 'exarch'
  const rawTier = Math.trunc(Number(input.tier))
  const tier = rawTier >= 1 && rawTier <= 4 ? rawTier : 1
  const targets = [...new Map((Array.isArray(input.targets) ? input.targets : [])
    .map(normalizeEldritchTarget)
    .filter(Boolean)
    .map((target) => [target.familyId, { ...target, source }])).values()]
  return { enabled: Boolean(input.enabled), source, tier, targets }
}

export function createDefaultEldritchModule() {
  return normalizeEldritchModule()
}

export function hasEffectiveEldritchTargets(input) {
  return normalizeEldritchModule(input).targets.length > 0
}

export function eldritchCurrencyType(input) {
  const module = normalizeEldritchModule(input)
  return CURRENCY_BY_SOURCE[module.source][module.tier - 1]
}
