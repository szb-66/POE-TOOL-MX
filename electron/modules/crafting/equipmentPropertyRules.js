export const SOCKET_MODEL_VERSION = 'poe1-3.28-community-v1'
export const SOCKET_COUNT_BASE_WEIGHTS = Object.freeze([100, 90, 80, 30, 5, 1])
export const LINK_SIZE_BASE_WEIGHTS = Object.freeze([100, 80, 30, 10, 2, 0.2])
export const BASE_DEFENCE_LABEL_PATTERN = /^(护甲|闪避值|能量护盾|结界)$/

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function rollRange(range, rng = Math.random) {
  const min = finite(range?.min)
  const max = Math.max(min, finite(range?.max, min))
  if (min === max) return min
  const precision = Number.isInteger(min) && Number.isInteger(max) ? 1 : 100
  return Math.round((min + rng() * (max - min)) * precision) / precision
}

export function renderRangeText(text, values = []) {
  let index = 0
  return String(text || '').replace(/\([+-]?\d+(?:\.\d+)?\s*[—–-]\s*[+-]?\d+(?:\.\d+)?\)|[+-]?\d+(?:\.\d+)?\s*[—–-]\s*[+-]?\d+(?:\.\d+)?/g, () => String(values[index++] ?? '#'))
}

export function rollBaseEntries(definitions = [], rng = Math.random) {
  return definitions.map((entry) => baseEntryInstance(entry, (entry.values ?? []).map((range) => rollRange(range, rng))))
}

function baseEntryInstance(entry, rolledValues) {
  const valueRanges = structuredClone(entry.values ?? entry.valueRanges ?? [])
  return {
    id: String(entry.id), label: String(entry.label || entry.text), kind: String(entry.kind || 'property'),
    text: String(entry.text), valueRanges, rolledValues, displayTags: structuredClone(entry.displayTags ?? []), rolledText: renderRangeText(entry.text, rolledValues)
  }
}

export function isBaseDefenceEntry(entry) {
  return BASE_DEFENCE_LABEL_PATTERN.test(String(entry?.label || ''))
}

function variableDefenceRanges(entries = [], rangeField = 'valueRanges') {
  return entries.flatMap((entry) => isBaseDefenceEntry(entry)
    ? (entry[rangeField] ?? []).map((range, index) => ({ entry, index, range, span: finite(range.max) - finite(range.min) })).filter((candidate) => candidate.span > 0)
    : [])
}

function rollSharedDefencePercentile(entries, rangeField, rng) {
  const candidates = variableDefenceRanges(entries, rangeField)
  if (!candidates.length) return null
  const anchor = candidates.reduce((best, candidate) => candidate.span > best.span ? candidate : best)
  const outcomes = Math.max(1, Math.floor(anchor.span) + 1)
  const index = Math.min(outcomes - 1, Math.floor(rng() * outcomes))
  return { ratio: outcomes === 1 ? 0 : index / (outcomes - 1), percentile: Math.round(index / (outcomes - 1) * 100) }
}

function valuesAtDefencePercentile(ranges, ratio) {
  return ranges.map((range) => Math.round(finite(range.min) + (finite(range.max) - finite(range.min)) * ratio))
}

export function rollBaseEntriesWithDefencePercentile(definitions = [], rng = Math.random) {
  const roll = rollSharedDefencePercentile(definitions, 'values', rng)
  const entries = definitions.map((entry) => {
    const values = entry.values ?? []
    const rolledValues = roll && isBaseDefenceEntry(entry)
      ? valuesAtDefencePercentile(values, roll.ratio)
      : values.map((range) => rollRange(range, rng))
    return baseEntryInstance(entry, rolledValues)
  })
  return { entries, percentile: roll?.percentile ?? null }
}

export function rerollBaseDefences(entries = [], rng = Math.random) {
  const roll = rollSharedDefencePercentile(entries, 'valueRanges', rng)
  if (!roll) return { entries: structuredClone(entries), percentile: null }
  const result = structuredClone(entries)
  result.forEach((entry) => {
    if (!isBaseDefenceEntry(entry)) return
    entry.rolledValues = valuesAtDefencePercentile(entry.valueRanges ?? [], roll.ratio)
    entry.rolledText = renderRangeText(entry.text, entry.rolledValues)
  })
  return { entries: result, percentile: roll.percentile }
}

export function inferBaseDefencePercentile(entries = []) {
  const candidates = variableDefenceRanges(entries, 'valueRanges')
  if (!candidates.length) return null
  const anchor = candidates.reduce((best, candidate) => candidate.span > best.span ? candidate : best)
  const value = finite(anchor.entry.rolledValues?.[anchor.index], finite(anchor.range.min))
  return Math.max(0, Math.min(100, Math.round((value - finite(anchor.range.min)) / anchor.span * 100)))
}

export function hasVariableBaseDefences(entries = []) {
  return variableDefenceRanges(entries, 'valueRanges').length > 0
}

export function qualityGainForItemLevel(itemLevel, rng = Math.random) {
  const raw = Math.max(1, Math.min(20, 30 * Math.exp(-Math.max(1, finite(itemLevel, 1)) / 30) - 0.3))
  const lower = Math.floor(raw)
  return lower + (rng() < raw - lower ? 1 : 0)
}

export function displayedBaseStats(state, base) {
  const quality = Math.max(0, finite(state?.quality))
  const affected = base?.qualityType === 'weapon'
    ? (entry) => /物理伤害/.test(entry.label)
    : base?.qualityType === 'armour'
      ? (entry) => /护甲|闪避|能量护盾|结界/.test(entry.label)
      : () => false
  return (state?.baseStats ?? []).map((entry) => {
    const values = entry.rolledValues.map((value) => affected(entry) ? Math.floor(value * (1 + quality / 100)) : value)
    return { ...structuredClone(entry), displayValues: values, displayText: renderRangeText(entry.text, values) }
  })
}

export function itemLevelSocketLimit(itemLevel) {
  const level = Math.max(1, Math.trunc(finite(itemLevel, 1)))
  if (level >= 50) return 6
  if (level >= 35) return 5
  if (level >= 25) return 4
  if (level >= 2) return 3
  return 2
}

export function naturalSocketLimit(base, itemLevel) {
  return Math.max(0, Math.min(Math.trunc(finite(base?.socketLimit)), itemLevelSocketLimit(itemLevel)))
}

export function socketColorWeights(requirements = {}) {
  const strength = Math.max(0, finite(requirements.strength))
  const dexterity = Math.max(0, finite(requirements.dexterity))
  const intelligence = Math.max(0, finite(requirements.intelligence))
  if (strength + dexterity + intelligence === 0) return { R: 1, G: 1, B: 1 }
  return { R: 10 + strength, G: 10 + dexterity, B: 10 + intelligence }
}

function pickWeighted(entries, rng) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, finite(entry.weight)), 0)
  let target = rng() * total
  for (const entry of entries) {
    target -= Math.max(0, finite(entry.weight))
    if (target <= 0) return entry
  }
  return entries.at(-1)
}

export function rollSocketColor(requirements, rng = Math.random) {
  const weights = socketColorWeights(requirements)
  return pickWeighted(Object.entries(weights).map(([color, weight]) => ({ color, weight })), rng).color
}

export function createSockets(count, requirements = {}, rng = Math.random) {
  return Array.from({ length: Math.max(0, Math.trunc(count)) }, (_, index) => ({ id: `socket:${index + 1}`, color: rollSocketColor(requirements, rng) }))
}

export function singletonLinks(sockets = []) {
  return sockets.map((socket) => [socket.id])
}

export function fullLinks(sockets = []) {
  return sockets.length ? [sockets.map((socket) => socket.id)] : []
}

export function socketCountWeights(maximum, quality = 0, excludedCount = null) {
  const max = Math.max(0, Math.min(6, Math.trunc(maximum)))
  const factor = 1 + Math.max(0, finite(quality)) / 100
  return Array.from({ length: max }, (_, index) => ({ count: index + 1, weight: SOCKET_COUNT_BASE_WEIGHTS[index] * factor ** index }))
    .filter((entry) => entry.count !== excludedCount)
}

export function rollSocketCount(maximum, quality = 0, currentCount = null, rng = Math.random) {
  return pickWeighted(socketCountWeights(maximum, quality, currentCount), rng)?.count ?? 0
}

export function linkSizeWeights(socketCount, quality = 0) {
  const count = Math.max(0, Math.min(6, Math.trunc(socketCount)))
  const factor = 1 + Math.max(0, finite(quality)) / 100
  return Array.from({ length: count }, (_, index) => ({ size: index + 1, weight: LINK_SIZE_BASE_WEIGHTS[index] * factor ** index }))
}

export function rollLinks(sockets = [], quality = 0, rng = Math.random) {
  if (sockets.length < 2) return singletonLinks(sockets)
  const largest = pickWeighted(linkSizeWeights(sockets.length, quality), rng)?.size ?? 1
  return largest > 1 ? [sockets.slice(0, largest).map((socket) => socket.id), ...sockets.slice(largest).map((socket) => [socket.id])] : singletonLinks(sockets)
}

export function rerollEntriesDifferent(entries = [], rng = Math.random) {
  const result = structuredClone(entries)
  const mutable = []
  result.forEach((entry) => entry.valueRanges.forEach((range, index) => {
    if (finite(range.max) > finite(range.min)) mutable.push({ entry, index, range })
  }))
  if (!mutable.length) return { changed: false, entries: result }
  mutable.forEach(({ entry, index, range }) => { entry.rolledValues[index] = rollRange(range, rng) })
  let changed = result.some((entry, entryIndex) => entry.rolledValues.some((value, index) => value !== entries[entryIndex].rolledValues[index]))
  if (!changed) {
    const { entry, index, range } = mutable[0]
    entry.rolledValues[index] = entry.rolledValues[index] === finite(range.min) ? finite(range.max) : finite(range.min)
    changed = true
  }
  result.forEach((entry) => { entry.rolledText = renderRangeText(entry.text, entry.rolledValues) })
  return { changed, entries: result }
}
