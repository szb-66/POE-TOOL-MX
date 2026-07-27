const MODES = new Set(['alteration', 'chaos', 'alchemy'])

let localIdSequence = 0

export function createAffixConfigId(prefix = 'affix') {
  localIdSequence += 1
  return `${prefix}_${Date.now().toString(36)}_${localIdSequence.toString(36)}`
}

function text(value) {
  return String(value ?? '').trim()
}

function positiveTier(value) {
  const tier = Math.trunc(Number(value))
  return tier > 0 ? tier : null
}

function normalizeTierOptions(values) {
  if (!Array.isArray(values)) return []
  return [...new Map(values.map((entry) => {
    const tier = positiveTier(typeof entry === 'object' ? entry.tier : entry)
    return tier ? [tier, {
      tier,
      name: text(typeof entry === 'object' ? entry.name : `T${tier}`) || `T${tier}`,
      requiredLevel: Math.max(1, Math.trunc(Number(typeof entry === 'object' ? entry.requiredLevel : 1) || 1)),
      text: text(typeof entry === 'object' ? entry.text : '')
    }] : null
  }).filter(Boolean)).values()].sort((a, b) => a.tier - b.tier)
}

export function normalizeAffixCondition(input, fallbackId = createAffixConfigId('condition')) {
  if (typeof input === 'string') {
    const keyword = text(input)
    return keyword ? {
      id: fallbackId,
      kind: 'keyword',
      keyword,
      displayName: keyword,
      effectPattern: '',
      source: '',
      sourceLabel: '',
      profileId: '',
      applicableLabel: '',
      minTier: null,
      tiers: []
    } : null
  }
  if (!input || typeof input !== 'object') return null
  const effectPattern = text(input.effectPattern)
  const keyword = text(input.keyword || input.displayName || effectPattern)
  if (!keyword && !effectPattern) return null
  const kind = input.kind === 'catalog' && effectPattern ? 'catalog' : 'keyword'
  return {
    id: text(input.id) || fallbackId,
    kind,
    keyword,
    displayName: text(input.displayName) || keyword || effectPattern,
    effectPattern: kind === 'catalog' ? effectPattern : '',
    source: text(input.source),
    sourceLabel: text(input.sourceLabel),
    profileId: text(input.profileId),
    applicableLabel: text(input.applicableLabel),
    minTier: positiveTier(input.minTier),
    tiers: normalizeTierOptions(input.tiers)
  }
}

function uniqueConditions(values, groupId, kind) {
  const seen = new Set()
  return (Array.isArray(values) ? values : []).map((entry, index) => normalizeAffixCondition(entry, `${groupId}_${kind}_${index + 1}`))
    .filter((entry) => {
      if (!entry) return false
      const key = `${entry.kind}:${entry.kind === 'catalog' ? entry.effectPattern : entry.keyword}`.toLocaleLowerCase('zh-CN')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export function normalizeAffixGroup(input = {}, index = 0) {
  const id = text(input.id) || `affix_group_${index + 1}`
  const requiredAffixes = uniqueConditions(input.requiredAffixes, id, 'required')
  const selectedAffixes = uniqueConditions(input.selectedAffixes, id, 'selected')
  const selectedCount = selectedAffixes.length
    ? Math.max(1, Math.min(selectedAffixes.length, Math.trunc(Number(input.selectedCount) || 1)))
    : 1
  return {
    id,
    name: text(input.name) || `组合 ${index + 1}`,
    requiredAffixes,
    selectedAffixes,
    selectedCount
  }
}

export function createDefaultAffixGroup(index = 0) {
  return normalizeAffixGroup({ id: createAffixConfigId('group'), name: `组合 ${index + 1}` }, index)
}

export function normalizeModuleTwo(input = {}) {
  const sourceGroups = Array.isArray(input.affixGroups)
    ? input.affixGroups
    : [{
        id: 'affix_group_1',
        name: '组合 1',
        requiredAffixes: input.requiredAffixes ?? [],
        selectedAffixes: input.selectedAffixes ?? [],
        selectedCount: input.selectedCount
      }]
  const affixGroups = sourceGroups.map(normalizeAffixGroup)
  return {
    enabled: input.enabled !== false,
    mode: MODES.has(input.mode) ? input.mode : 'alteration',
    affixGroups: affixGroups.length ? affixGroups : [createDefaultAffixGroup(0)],
    enableAugmentation: Boolean(input.enableAugmentation),
    enableRegal: Boolean(input.enableRegal),
    enableExalted: Boolean(input.enableExalted)
  }
}

export function createDefaultModuleTwo() {
  return normalizeModuleTwo({ enabled: true, mode: 'alteration', affixGroups: [createDefaultAffixGroup(0)] })
}

export function cloneAffixGroup(group, index) {
  const cloneCondition = (condition, kind, conditionIndex) => ({
    ...condition,
    id: `${createAffixConfigId('condition')}_${kind}_${conditionIndex + 1}`,
    tiers: condition.tiers.map((tier) => ({ ...tier }))
  })
  return {
    ...normalizeAffixGroup(group, index),
    id: createAffixConfigId('group'),
    name: `${text(group.name) || `组合 ${index + 1}`} 副本`,
    requiredAffixes: group.requiredAffixes.map((condition, conditionIndex) => cloneCondition(condition, 'required', conditionIndex)),
    selectedAffixes: group.selectedAffixes.map((condition, conditionIndex) => cloneCondition(condition, 'selected', conditionIndex))
  }
}

export function hasEffectiveAffixGroups(moduleTwo) {
  return normalizeModuleTwo(moduleTwo).affixGroups.some((group) => group.requiredAffixes.length || group.selectedAffixes.length)
}
