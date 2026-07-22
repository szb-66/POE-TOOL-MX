import { renderRangeText, rollRange } from './equipmentPropertyRules.js'

export const VAAL_MODEL_VERSION = 'poe1-3.28-vaal-v1'
export const VAAL_OUTCOMES = Object.freeze(['implicit', 'white-sockets', 'rare-reforge', 'no-change'])
export const VAAL_OUTCOME_LABELS = Object.freeze({
  implicit: '腐化隐式', 'white-sockets': '白色插槽', 'rare-reforge': '六词缀稀有重铸', 'no-change': '仅腐化'
})

export function rollVaalOutcome(rng = Math.random) {
  return VAAL_OUTCOMES[Math.min(VAAL_OUTCOMES.length - 1, Math.floor(rng() * VAAL_OUTCOMES.length))]
}

export function corruptedImplicitCandidates(dataset, base, itemLevel) {
  return (dataset.corruptedImplicitFamilies ?? []).flatMap((family) => {
    if (!family.itemClasses.includes(base.itemClass)) return []
    return family.tiers.filter((tier) => tier.requiredLevel <= itemLevel && Number(tier.weights?.[base.itemClass]) > 0)
      .map((tier) => ({ family, tier, weight: Number(tier.weights[base.itemClass]) }))
  })
}

function pickWeighted(entries, rng) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.weight) || 0), 0)
  if (!(total > 0)) return null
  let target = rng() * total
  for (const entry of entries) {
    target -= Math.max(0, Number(entry.weight) || 0)
    if (target <= 0) return entry
  }
  return entries.at(-1)
}

export function rollCorruptedImplicit(dataset, base, itemLevel, rng = Math.random) {
  const selected = pickWeighted(corruptedImplicitCandidates(dataset, base, itemLevel), rng)
  if (!selected) return null
  const valueRanges = structuredClone(selected.tier.values ?? [])
  const rolledValues = valueRanges.map((range) => rollRange(range, rng))
  return {
    source: 'vaal', familyId: selected.family.id, tierId: selected.tier.id, tier: selected.tier.tier,
    name: selected.family.name, text: selected.tier.text, rolledText: renderRangeText(selected.tier.text, rolledValues),
    valueRanges, rolledValues, displayTags: structuredClone(selected.tier.displayTags ?? selected.family.displayTags ?? []),
    weight: selected.weight
  }
}

export function replaceImplicitWithVaal(state, implicit, rng = Math.random) {
  const replaceable = [
    ...(state.baseImplicits ?? []).map((entry, index) => ({ source: 'base', index, entry })),
    ...(state.implicits ?? []).map((entry, index) => ({
      source: entry === '物品会被商贩高价购买' ? 'gilded' : 'synthesized',
      index,
      entry: { id: String(entry), rolledText: String(entry) }
    })),
    ...['exarch', 'eater'].filter((source) => state.eldritchImplicits?.[source]).map((source) => ({ source, entry: state.eldritchImplicits[source] }))
  ]
  let replaced = null
  if (replaceable.length) {
    const selected = replaceable[Math.min(replaceable.length - 1, Math.floor(rng() * replaceable.length))]
    replaced = { source: selected.source, id: selected.entry.id ?? selected.entry.tierId, text: selected.entry.rolledText ?? selected.entry.text }
    if (selected.source === 'base') state.baseImplicits.splice(selected.index, 1)
    else if (['synthesized', 'gilded'].includes(selected.source)) state.implicits.splice(selected.index, 1)
    else state.eldritchImplicits[selected.source] = null
  }
  state.vaalImplicit = structuredClone(implicit)
  return replaced
}

export function whitenSockets(state, rng = Math.random) {
  if (!state.sockets.length) return []
  const candidates = state.sockets.map((socket, index) => ({ socket, index })).filter(({ socket }) => socket.color !== 'W')
  if (!candidates.length) return []
  const first = candidates[Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))]
  const changed = [first.index]
  first.socket.color = 'W'
  state.sockets.forEach((socket, index) => {
    if (index !== first.index && socket.color !== 'W' && rng() < 0.1) { socket.color = 'W'; changed.push(index) }
  })
  return changed
}
