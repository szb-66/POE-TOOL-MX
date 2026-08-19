import { isTradeStatId } from './catalog.js'

const firstValue = (values) => (Array.isArray(values) ? values.find(Number.isFinite) : undefined)
const pseudoTargetIndexes = new WeakMap()

function statRefs(stat) {
  return new Set([
    ...(stat.refs || []),
    ...((stat.sources || []).flatMap((source) => source.refs || (source.ref ? [source.ref] : [])))
  ].filter(Boolean))
}

function uniquePseudoTarget(catalog, ref) {
  if (!catalog) return null
  let index = pseudoTargetIndexes.get(catalog)
  if (!index) {
    index = new Map()
    for (const entry of catalog.stats || []) {
      const values = entry.ids?.pseudo
      const validIds = (Array.isArray(values) ? values : [values]).filter((id) => id && isTradeStatId(id, 'pseudo'))
      if (!validIds.length) continue
      for (const refValue of entry.refs || []) {
        const target = index.get(refValue) || { ids: new Set(), record: entry }
        for (const id of validIds) target.ids.add(id)
        index.set(refValue, target)
      }
    }
    pseudoTargetIndexes.set(catalog, index)
  }
  const target = index.get(ref)
  return target?.ids.size === 1 ? { id: [...target.ids][0], record: target.record } : null
}

function collectRuleSources(rule, stats) {
  const contributions = []
  for (const sourceRule of rule.sources) {
    for (const stat of stats) {
      if (!statRefs(stat).has(sourceRule.ref)) continue
      const value = firstValue(stat.values)
      if (!Number.isFinite(value)) continue
      contributions.push({
        key: stat.key,
        id: stat.id,
        type: stat.type,
        ref: sourceRule.ref,
        text: stat.text,
        value: value * (sourceRule.multiplier ?? 1),
        multiplier: sourceRule.multiplier ?? 1
      })
    }
  }
  if (rule.sources.some(({ required, ref }) => required && !contributions.some((source) => source.ref === ref))) return []
  return contributions
}

function applyGroups(candidates) {
  let result = [...candidates]
  for (const candidate of candidates) {
    if (!candidate.rule.replaces) continue
    result = result.filter((entry) => entry === candidate || entry.rule.group !== candidate.rule.replaces)
  }
  const resistance = result.filter(({ rule }) => rule.group === 'to_x_ele_res')
    .sort((a, b) => b.value - a.value)
  if (resistance.length) {
    const keep = resistance[0]?.value === resistance[1]?.value ? null : resistance[0]
    result = result.filter((entry) => entry.rule.group !== 'to_x_ele_res' || entry === keep)
  }
  const attributes = result.filter(({ rule }) => rule.group === 'to_x_attr').sort((a, b) => b.value - a.value)
  if (attributes.length === 3) {
    const toAll = result.filter(({ rule }) => rule.group === 'to_all_attrs')
    if (attributes.every((entry) => entry.value === attributes[0].value) && toAll.length) {
      result = result.filter((entry) => entry.rule.group !== 'to_x_attr')
    } else {
      result = result.filter((entry) => entry.rule.group !== 'to_all_attrs')
      if (attributes[0].value && attributes[2].value / attributes[0].value < 0.3) {
        const hidden = attributes[1].value === attributes[2].value ? attributes.slice(1) : attributes.slice(2)
        result = result.filter((entry) => !hidden.includes(entry))
      }
    }
  }
  return result
}

export function createPseudoStats(stats, catalog, options, valueBounds) {
  const candidates = []
  for (const rule of catalog?.pseudoRules || []) {
    const target = uniquePseudoTarget(catalog, rule.target)
    if (!target) continue
    const sources = collectRuleSources(rule, stats)
    if (!sources.length) continue
    const value = sources.reduce((sum, source) => sum + source.value, 0)
    const onlyCrafted = sources.every(({ type }) => type === 'crafted')
    const enabled = options.initialSelection === 'all' || (
      (options.initialSelection || 'auto') === 'auto' && rule.defaultEnabled === true &&
      !(rule.disableWhenOnlyCrafted && onlyCrafted)
    )
    candidates.push({ rule, target, sources, value, enabled })
  }
  const selected = applyGroups(candidates)
  const absorbedKeys = new Set(selected.filter(({ enabled }) => enabled).flatMap(({ sources }) => sources.map(({ key }) => key)))
  return {
    stats: selected.map(({ rule, target, sources, value, enabled }) => ({
      key: `pseudo:${target.id}`,
      id: target.id,
      label: target.record?.label || rule.target.replaceAll('#', '数值'),
      text: target.record?.matchers?.[0] || rule.target,
      type: 'pseudo',
      refs: [rule.target],
      ref: rule.target,
      tier: null,
      tags: [],
      values: [value],
      merge: 'sum',
      sources: sources.map((source) => ({ ...source, refs: [source.ref], values: [source.value] })),
      enabled,
      ...valueBounds([value])
    })),
    absorbedKeys
  }
}
