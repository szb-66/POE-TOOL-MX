import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { enrichOfficialItemsWithImages } from './uniqueItemSnapshot.js'
import {
  CHART_BASE_TYPES,
  CHART_REGION_ALIASES_VERSION,
  chartRegionByType
} from './chartRegions.js'

export const TRADE_CATALOG_SCHEMA_VERSION = 4
export const TRADE_CATALOG_STALE_MS = 180 * 24 * 60 * 60 * 1000

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

const compact = (value) => String(value || '').replace(/\s+/g, ' ').trim()
const isUsableMatcher = (value) => {
  const matcher = compact(value)
  return Boolean(matcher) && !/<[A-Z]{2}\d+>|}}/.test(matcher)
}
const officialMatcherAliases = (value) => {
  const matcher = compact(value)
  const clipboard = matcher.replace(/\s*(?:\((?:Local|区域)\)|（区域）)\s*$/i, '').trim()
  return [...new Set([matcher, clipboard].filter(isUsableMatcher))]
}
const matcherIndexKey = (value) => compact(value)
  .replace(/\d+(?:\.\d+)?/g, '#')
  .replace(/[+-]#/g, '#')
// These are the stat namespaces currently exposed by the official PoE 1 trade API.
// Keep the universal namespace set independent from client language.
const SUPPORTED_STAT_TYPES = new Set([
  'crafted', 'crucible', 'delve', 'enchant', 'explicit', 'fractured', 'imbued',
  'implicit', 'mercenary', 'pseudo', 'sanctum', 'scourge', 'ultimatum', 'veiled'
])
const MERGE_STRATEGIES = new Set(['sum', 'max'])
const RESOLVER_ARRAY_FIELDS = ['categories', 'modifierNames', 'tagsAny', 'tagsAll', 'textIncludes']
const catalogMatcherIndexes = new WeakMap()
const LOCAL_ITEM_CATEGORY_PATTERN = /(?:弓|剑|斧|锤|权杖|法杖|匕首|爪|长杖|战杖|钓竿|胸甲|头盔|手套|鞋子|盾|药剂|Bow|Sword|Axe|Mace|Sceptre|Wand|Dagger|Claw|Staff|Warstaff|Fishing Rod|Body Armour|Helmet|Gloves|Boots|Shield|Flask)/i

export function isTradeStatId(id, type = '') {
  const value = compact(id)
  const expectedType = compact(type)
  if (expectedType && !SUPPORTED_STAT_TYPES.has(expectedType)) return false
  if (!/^[a-z][a-z0-9_]*\.[a-z0-9_]+(?:\|\d+)*$/.test(value)) return false
  return !expectedType || value.startsWith(`${expectedType}.`)
}

function statIds(entry) {
  return Object.entries(entry?.ids || {}).flatMap(([type, value]) => {
    const ids = Array.isArray(value) ? value : [value]
    return ids.map(compact).filter(Boolean).map((id) => ({ type, id }))
  })
}

function assertUnique(values, label) {
  const seen = new Set()
  for (const value of values) {
    if (seen.has(value)) throw new Error(`交易目录存在重复${label}：${value}`)
    seen.add(value)
  }
}

function chartDisplayName(entry) {
  return compact(entry?.text).match(/Chart\s*[（(](.+?)[）)]/)?.[1] || ''
}

export function enrichTradeCatalogChartRegions(catalog) {
  const next = structuredClone(catalog)
  next.chartRegionAliasesVersion = CHART_REGION_ALIASES_VERSION
  next.items = (next.items || []).map((entry) => {
    const type = compact(entry.baseType || entry.type)
    const region = entry.discriminator === 'chart' ? chartRegionByType(type) : null
    if (region) {
      return {
        ...entry,
        category: 'chart',
        displayName: region.displayName || chartDisplayName(entry),
        aliases: [...new Set([...region.aliases, chartDisplayName(entry)].map(compact).filter(Boolean))]
      }
    }
    if (CHART_BASE_TYPES.includes(type)) return { ...entry, category: 'chart' }
    return entry
  })
  return next
}

export function resolveChartRegion(catalog, value) {
  const key = compact(value).replace(/\s+/g, '')
  if (!key) return null
  const matches = (catalog?.items || []).filter((entry) => (
    entry.category === 'chart' && entry.discriminator === 'chart' &&
    [entry.displayName, ...(entry.aliases || [])].some((alias) => compact(alias).replace(/\s+/g, '') === key)
  ))
  if (matches.length !== 1) return null
  const entry = matches[0]
  return {
    type: compact(entry.baseType || entry.type),
    displayName: compact(entry.displayName),
    aliases: [...(entry.aliases || [])]
  }
}

export function validateTradeCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object') throw new Error('交易目录不是对象')
  if (catalog.chartRegionAliasesVersion !== CHART_REGION_ALIASES_VERSION) {
    catalog = enrichTradeCatalogChartRegions(catalog)
  }
  if (catalog.schemaVersion !== TRADE_CATALOG_SCHEMA_VERSION) {
    throw new Error(`交易目录 schema 不兼容：${catalog.schemaVersion}`)
  }
  if (catalog.game !== 'poe1' || catalog.locale !== 'zh-CN') throw new Error('交易目录游戏或语言无效')
  if (!catalog.gameVersion || !Number.isFinite(Date.parse(catalog.generatedAt))) throw new Error('交易目录版本元数据缺失')
  if (!Array.isArray(catalog.items) || !Array.isArray(catalog.stats) || !Array.isArray(catalog.pseudoRules)) {
    throw new Error('交易目录记录结构无效')
  }
  if (!compact(catalog.pseudoRuleVersion) || !compact(catalog.pseudoRuleSource?.commit) || !compact(catalog.pseudoRuleSource?.file)) {
    throw new Error('交易目录综合规则版本元数据缺失')
  }

  assertUnique(catalog.items.map((entry) => compact(entry.key || `${entry.name}:${entry.baseType || entry.type || ''}:${entry.discriminator || ''}`)), '物品键')
  for (const entry of catalog.items) {
    if (!compact(entry.name) || !compact(entry.baseType || entry.type)) throw new Error('交易目录物品缺少名称或底材')
    if (entry.aliases != null && (!Array.isArray(entry.aliases) || entry.aliases.some((alias) => !compact(alias)))) {
      throw new Error(`交易目录物品 ${entry.key} 的别名无效`)
    }
    if (entry.discriminator === 'chart' && (
      entry.category !== 'chart' || !compact(entry.displayName) || !entry.aliases?.length
    )) throw new Error(`交易目录海图区域 ${entry.key} 元数据无效`)
  }
  const chartAliases = catalog.items.flatMap((entry) => entry.discriminator === 'chart'
    ? (entry.aliases || []).map((alias) => compact(alias).replace(/\s+/g, ''))
    : [])
  assertUnique(chartAliases, '海图区域别名')
  assertUnique(catalog.stats.map((entry) => compact(entry.key)), '词缀键')
  const statIdentities = []
  for (const entry of catalog.stats) {
    if (!entry.key || !Array.isArray(entry.matchers) || !entry.matchers.length) throw new Error('交易目录词缀缺少 matcher')
    if (entry.negatedMatchers != null && (
      !Array.isArray(entry.negatedMatchers) ||
      entry.negatedMatchers.some((matcher) => !compact(matcher))
    )) throw new Error(`交易目录词缀 ${entry.key} 的负向 matcher 无效`)
    if (entry.negatedMatchers && entry.negatedMatchers.length !== new Set(entry.negatedMatchers.map(compact)).size) {
      throw new Error(`交易目录词缀 ${entry.key} 的负向 matcher 重复`)
    }
    const matcherSet = new Set(entry.matchers.map(compact))
    if ((entry.negatedMatchers || []).some((matcher) => !matcherSet.has(compact(matcher)))) {
      throw new Error(`交易目录词缀 ${entry.key} 的负向 matcher 必须属于同一词缀的 matcher 集合`)
    }
    const ids = statIds(entry)
    if (!ids.length || ids.some(({ type, id }) => !SUPPORTED_STAT_TYPES.has(type) || !isTradeStatId(id, type))) {
      throw new Error(`交易目录词缀 ${entry.key} 的 stat ID 无效`)
    }
    if (entry.categories != null && (!Array.isArray(entry.categories) || entry.categories.some((value) => !compact(value)))) {
      throw new Error(`交易目录词缀 ${entry.key} 的类别无效`)
    }
    if (entry.refs != null && (!Array.isArray(entry.refs) || entry.refs.some((value) => !compact(value)))) {
      throw new Error(`交易目录词缀 ${entry.key} 的稳定 ref 无效`)
    }
    if (entry.refs && entry.refs.length !== new Set(entry.refs).size) throw new Error(`交易目录词缀 ${entry.key} 的稳定 ref 重复`)
    if (entry.merge != null && !MERGE_STRATEGIES.has(entry.merge)) {
      throw new Error(`交易目录词缀 ${entry.key} 的合并策略无效`)
    }
    if (entry.resolver != null && (
      typeof entry.resolver !== 'object' || Array.isArray(entry.resolver) ||
      RESOLVER_ARRAY_FIELDS.some((field) => entry.resolver[field] != null && (
        !Array.isArray(entry.resolver[field]) || entry.resolver[field].some((value) => !compact(value))
      ))
    )) throw new Error(`交易目录词缀 ${entry.key} 的 resolver 无效`)
    statIdentities.push(...ids.map(({ type, id }) => `${type}\u0000${id}`))
    for (const matcher of entry.matchers) {
      const key = compact(matcher)
      if (!key) throw new Error(`交易目录 matcher 无效：${matcher}`)
    }
  }
  assertUnique(statIdentities, '词缀类型 ID')
  assertUnique(catalog.pseudoRules.map((rule) => compact(rule?.target)), '综合规则目标')
  for (const [index, rule] of catalog.pseudoRules.entries()) {
    if (!compact(rule?.target) || !Array.isArray(rule?.sources) || !rule.sources.length) {
      throw new Error(`交易目录综合规则 ${index + 1} 结构无效`)
    }
    if (rule.sources.some((source) => !compact(source?.ref) || (
      source.multiplier != null && !Number.isFinite(source.multiplier)
    ))) throw new Error(`交易目录综合规则 ${rule.target} 的来源无效`)
  }
  return catalog
}

export function auditPseudoRules(catalog) {
  const refs = new Map()
  for (const entry of catalog.stats || []) {
    for (const ref of entry.refs || []) {
      const records = refs.get(ref) || []
      records.push(...statIds(entry).map(({ type, id }) => ({ type, id, key: entry.key })))
      refs.set(ref, records)
    }
  }
  const missingTargets = []
  const ambiguousTargets = []
  const invalidTargetNamespaces = []
  const missingSources = []
  const rules = []
  for (const rule of catalog.pseudoRules || []) {
    const allTargets = refs.get(rule.target) || []
    const targets = allTargets.filter(({ type }) => type === 'pseudo')
    const targetIds = [...new Set(targets.map(({ id }) => id))]
    const absentSources = rule.sources.map(({ ref }) => ref).filter((ref) => !refs.has(ref))
    if (!targetIds.length) missingTargets.push(rule.target)
    if (targetIds.length > 1) ambiguousTargets.push(rule.target)
    if (!targets.length && allTargets.some(({ type }) => type !== 'pseudo')) invalidTargetNamespaces.push(rule.target)
    missingSources.push(...absentSources)
    rules.push({ target: rule.target, targetId: targetIds.length === 1 ? targetIds[0] : null, missingSources: absentSources })
  }
  return {
    version: catalog.pseudoRuleVersion,
    total: (catalog.pseudoRules || []).length,
    usable: rules.filter(({ targetId }) => targetId).length,
    missingTargets: [...new Set(missingTargets)],
    ambiguousTargets: [...new Set(ambiguousTargets)],
    invalidTargetNamespaces: [...new Set(invalidTargetNamespaces)],
    missingSources: [...new Set(missingSources)],
    rules
  }
}

export function tradeCatalogStatus(catalog, now = Date.now()) {
  const generatedAt = Date.parse(catalog.generatedAt)
  return {
    schemaVersion: catalog.schemaVersion,
    gameVersion: catalog.gameVersion,
    locale: catalog.locale,
    generatedAt: catalog.generatedAt,
    stale: now - generatedAt > TRADE_CATALOG_STALE_MS,
    counts: { items: catalog.items.length, stats: catalog.stats.length, currencies: Object.keys(catalog.currencyLabels || {}).length },
    sources: [...(catalog.sources || [])]
  }
}

export function officialCurrencyLabels(payload) {
  if (!Array.isArray(payload?.result)) throw new Error('腾讯官方静态交易目录响应结构无效')
  const labels = new Map()
  for (const group of payload.result) {
    for (const entry of group?.entries || []) {
      const id = compact(entry?.id)
      const label = compact(entry?.text)
      if (id && label && !labels.has(id)) labels.set(id, label)
    }
  }
  return Object.fromEntries([...labels].sort(([a], [b]) => a.localeCompare(b, 'en')))
}

export async function loadTradeCatalog(file = path.join(moduleDir, 'catalog.json'), now = Date.now()) {
  const catalog = validateTradeCatalog(JSON.parse(await readFile(file, 'utf8')))
  return { catalog, status: tradeCatalogStatus(catalog, now) }
}

function officialItems(payload, uniqueItemCatalog = null) {
  if (!payload) return []
  if (!Array.isArray(payload?.result)) throw new Error('腾讯官方物品目录响应结构无效')
  const items = []
  const seen = new Set()
  for (const group of payload.result) {
    const category = compact(group?.id)
    for (const entry of group?.entries || []) {
      const baseType = compact(entry?.type)
      const unique = entry?.flags?.unique === true
      const name = compact(entry?.name) || (unique ? '' : baseType)
      if (!name || !baseType) continue
      const discriminator = compact(entry?.disc)
      const identity = `${unique ? 'unique' : 'base'}\u0000${name}\u0000${baseType}\u0000${discriminator}`
      if (seen.has(identity)) continue
      seen.add(identity)
      items.push({
        key: `official-item-${items.length + 1}`,
        name,
        baseType,
        text: compact(entry?.text),
        discriminator,
        category,
        unique
      })
    }
  }
  const enrichedItems = enrichTradeCatalogChartRegions({ items }).items
  return enrichOfficialItemsWithImages(enrichedItems, uniqueItemCatalog)
}

export function createOfficialTradeCatalog(baseCatalog, payload, now = Date.now(), itemsPayload = null, uniqueItemCatalog = null) {
  if (!Array.isArray(payload?.result)) throw new Error('腾讯官方词缀目录响应结构无效')
  const stats = []
  const byIdentity = new Map()
  for (const group of payload.result) {
    for (const entry of group?.entries || []) {
      const matcher = compact(entry?.text)
      const type = compact(entry?.type || group?.id)
      const id = compact(entry?.id)
      if (!matcher || !SUPPORTED_STAT_TYPES.has(type)) continue
      if (!isTradeStatId(id, type)) continue
      const aliases = officialMatcherAliases(matcher)
      if (!aliases.length) continue
      const identity = `${type}\u0000${id}`
      const existing = byIdentity.get(identity)
      if (existing) {
        existing.matchers = [...new Set([...existing.matchers, ...aliases])]
        existing.local ||= /(?:\((?:Local|区域)\)|（区域）)$/i.test(matcher)
        continue
      }
      const record = {
        key: `official-${type}-${id.replace(/[^a-z0-9]+/gi, '-')}`,
        label: matcher.replaceAll('#', '数值'),
        // “(Local)/(区域)” is official trade UI metadata and is absent from
        // the game's detailed clipboard text. Keep both forms under the same ID.
        matchers: aliases,
        ids: { [type]: id },
        ...(/(?:\((?:Local|区域)\)|（区域）)$/i.test(matcher) ? { local: true } : {}),
        availability: 'cn'
      }
      byIdentity.set(identity, record)
      stats.push(record)
    }
  }
  for (const entry of baseCatalog.stats) {
    const missingIds = {}
    for (const { type, id } of statIds(entry)) {
      const official = byIdentity.get(`${type}\u0000${id}`)
      if (official) {
        official.matchers = [...new Set([
          ...official.matchers,
          ...entry.matchers.map(compact).filter(isUsableMatcher)
        ])]
        if (entry.negatedMatchers?.length) {
          official.negatedMatchers = [...new Set([
            ...(official.negatedMatchers || []),
            ...entry.negatedMatchers.map(compact).filter((matcher) => official.matchers.includes(matcher))
          ])]
        }
        official.local ||= Boolean(entry.local)
        if (entry.availability === 'international' || entry.availability === 'both') official.availability = 'both'
        if (entry.categories) official.categories = structuredClone(entry.categories)
        if (entry.merge) official.merge = entry.merge
        if (entry.resolver) official.resolver = structuredClone(entry.resolver)
        if (entry.refs?.length) official.refs = [...new Set([...(official.refs || []), ...entry.refs.map(compact).filter(Boolean)])]
      } else if (entry.availability === 'international' || entry.availability === 'both') {
        missingIds[type] = id
      }
    }
    if (Object.keys(missingIds).length) {
      const matchers = entry.matchers.map(compact).filter(isUsableMatcher)
      if (matchers.length) {
        const { negatedMatchers: _negatedMatchers, ...clonedEntry } = structuredClone(entry)
        const negatedMatchers = entry.negatedMatchers?.map(compact).filter((matcher) => matchers.includes(matcher)) || []
        stats.push({
          ...clonedEntry,
          matchers,
          ...(negatedMatchers.length ? { negatedMatchers } : {}),
          availability: 'international',
          ids: missingIds
        })
      }
    }
  }
  if (stats.length < 100) throw new Error('腾讯官方词缀目录记录数异常')
  const catalog = validateTradeCatalog(enrichTradeCatalogChartRegions({
    ...structuredClone(baseCatalog),
    schemaVersion: TRADE_CATALOG_SCHEMA_VERSION,
    generatedAt: new Date(now).toISOString(),
    sources: ['腾讯国服官方 /api/trade/data/stats', ...(baseCatalog.sources || [])],
    itemCoverage: itemsPayload ? 'all' : baseCatalog.itemCoverage,
    items: itemsPayload
      ? officialItems(itemsPayload, uniqueItemCatalog)
      : enrichOfficialItemsWithImages(structuredClone(baseCatalog.items), uniqueItemCatalog),
    stats
  }))
  return {
    catalog,
    status: {
      ...tradeCatalogStatus(catalog, now),
      provider: 'official',
      degraded: false,
      coverage: auditOfficialTradeCatalog(payload, catalog)
    }
  }
}

export function createLocalizedOfficialTradeCatalog(
  baseCatalog,
  internationalStatsPayload,
  cnStatsPayload,
  now = Date.now(),
  cnItemsPayload = null,
  uniqueItemCatalog = null
) {
  const international = createOfficialTradeCatalog(baseCatalog, internationalStatsPayload, now)
  for (const entry of international.catalog.stats) entry.availability = 'international'
  international.catalog.sources = ['Path of Exile official /api/trade/data/stats']

  const localized = createOfficialTradeCatalog(
    international.catalog,
    cnStatsPayload,
    now,
    cnItemsPayload,
    uniqueItemCatalog
  )
  localized.catalog.sources = [
    'Path of Exile official /api/trade/data/stats',
    '腾讯国服官方 /api/trade/data/stats',
    ...(cnItemsPayload ? ['腾讯国服官方 /api/trade/data/items'] : [])
  ]
  localized.status = {
    ...tradeCatalogStatus(localized.catalog, now),
    provider: 'official-localized',
    degraded: false,
    coverage: {
      international: auditOfficialTradeCatalog(internationalStatsPayload, localized.catalog),
      cn: auditOfficialTradeCatalog(cnStatsPayload, localized.catalog)
    }
  }
  return localized
}

export function matcherToRegExp(matcher) {
  const escaped = compact(matcher)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replaceAll('#', '([-+]?\\d+(?:\\.\\d+)?)')
    .replace(/\\ /g, '\\s*')
  return new RegExp(`^${escaped}$`)
}

function buildMatcherIndex(catalog) {
  let index = catalogMatcherIndexes.get(catalog)
  if (index) return index
  index = new Map()
  for (const entry of catalog.stats || []) {
    for (const matcher of entry.matchers || []) {
      const key = matcherIndexKey(matcher)
      const candidates = index.get(key) || []
      candidates.push({ entry, matcher })
      index.set(key, candidates)
    }
  }
  catalogMatcherIndexes.set(catalog, index)
  return index
}

function candidateLabel(entry, id) {
  const suffix = String(id).split('.').at(-1)
  return `${entry.label || entry.matchers?.[0] || '词缀'} · ${suffix}`
}

function matchesResolver(entry, normalized, context) {
  const resolver = entry.resolver || {}
  const category = compact(context.category)
  const modifierName = compact(context.name)
  const tags = new Set((context.tags || []).map(compact).filter(Boolean))
  const categories = entry.categories || resolver.categories || []
  if (categories.length && category && !categories.includes(category)) return false
  if (resolver.modifierNames?.length && modifierName && !resolver.modifierNames.includes(modifierName)) return false
  if (resolver.tagsAny?.length && tags.size && !resolver.tagsAny.some((tag) => tags.has(tag))) return false
  if (resolver.tagsAll?.length && tags.size && !resolver.tagsAll.every((tag) => tags.has(tag))) return false
  if (resolver.textIncludes?.length && !resolver.textIncludes.every((text) => normalized.includes(text))) return false
  return true
}

export function resolveCatalogStat(catalog, text, type = 'explicit', context = {}) {
  const normalized = compact(text)
  const index = buildMatcherIndex(catalog)
  const key = matcherIndexKey(normalized)
  const candidates = []
  let textMatchedOtherType = false
  for (const { entry, matcher } of index.get(key) || []) {
    const match = normalized.match(matcherToRegExp(matcher))
    if (!match) continue
    const rawIds = entry.ids?.[type]
    if (!rawIds) {
      textMatchedOtherType = true
      continue
    }
    if (!matchesResolver(entry, normalized, context)) continue
    const multiplier = entry.negatedMatchers?.includes(matcher) ? -1 : 1
    const values = match.slice(1).map(Number).filter(Number.isFinite).map((value) => value * multiplier)
    for (const id of Array.isArray(rawIds) ? rawIds : [rawIds]) {
      candidates.push({
        key: entry.key,
        label: candidateLabel(entry, id),
        id,
        matcher,
        values,
        valueMultiplier: multiplier,
        type,
        refs: [...(entry.refs || [])],
        ref: entry.refs?.length === 1 ? entry.refs[0] : null,
        categories: [...(entry.categories || [])],
        merge: entry.merge || null,
        local: Boolean(entry.local)
      })
    }
  }
  const unique = [...new Map(candidates.map((candidate) => [candidate.id, candidate])).values()]
    .sort((a, b) => a.id.localeCompare(b.id, 'en'))
  const hasLocalVariant = unique.some((candidate) => candidate.local)
  const hasGlobalVariant = unique.some((candidate) => !candidate.local)
  const category = compact(context.category)
  const hasLocalContext = context.localItem != null || Boolean(category)
  const localItem = context.localItem == null
    ? LOCAL_ITEM_CATEGORY_PATTERN.test(category)
    : Boolean(context.localItem)
  const contextualCandidates = unique.length > 1 && hasLocalVariant && hasGlobalVariant && hasLocalContext
    ? unique.filter((candidate) => candidate.local === localItem)
    : []
  const resolved = contextualCandidates.length === 1 ? contextualCandidates : unique
  return {
    match: resolved.length === 1 ? resolved[0] : null,
    candidates: resolved,
    reason: resolved.length > 1 ? 'ambiguous' : textMatchedOtherType ? 'type-mismatch' : 'not-found'
  }
}

export function matchCatalogStat(catalog, text, type = 'explicit', context = {}) {
  return resolveCatalogStat(catalog, text, type, context).match
}

export function auditOfficialTradeCatalog(payload, catalog) {
  if (!Array.isArray(payload?.result)) throw new Error('腾讯官方词缀目录响应结构无效')
  const retained = new Set(catalog.stats.flatMap(statIds).map(({ type, id }) => `${type}\u0000${id}`))
  const valid = []
  let rejected = 0
  let filteredMatchers = 0
  for (const group of payload.result) {
    for (const entry of group?.entries || []) {
      const matcher = compact(entry?.text)
      const type = compact(entry?.type || group?.id)
      const id = compact(entry?.id)
      if (!matcher || !SUPPORTED_STAT_TYPES.has(type) || !isTradeStatId(id, type)) {
        rejected += 1
        continue
      }
      // Mirror createOfficialTradeCatalog: unusable matchers (old translation
      // control codes) are dropped there, so they are not a retention error.
      if (!officialMatcherAliases(matcher).length) {
        filteredMatchers += 1
        continue
      }
      valid.push({ matcher, type, id })
    }
  }
  const identities = new Set(valid.map(({ type, id }) => `${type}\u0000${id}`))
  const silentDropped = [...identities].filter((identity) => !retained.has(identity))
  const groups = new Map()
  for (const entry of valid) {
    const group = groups.get(`${entry.matcher}\u0000${entry.type}`) || new Set()
    group.add(entry.id)
    groups.set(`${entry.matcher}\u0000${entry.type}`, group)
  }
  const ambiguous = [...groups.values()].filter((ids) => ids.size > 1)
  const report = {
    valid: identities.size,
    retained: identities.size - silentDropped.length,
    unique: identities.size - ambiguous.reduce((sum, ids) => sum + ids.size, 0),
    ambiguous: ambiguous.reduce((sum, ids) => sum + ids.size, 0),
    rejected,
    filteredMatchers,
    silentDropped: silentDropped.length
  }
  if (report.silentDropped) throw new Error(`腾讯官方词缀目录静默丢弃 ${report.silentDropped} 条有效记录`)
  return report
}
