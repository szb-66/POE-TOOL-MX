import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const TRADE_CATALOG_SCHEMA_VERSION = 1
export const TRADE_CATALOG_STALE_MS = 180 * 24 * 60 * 60 * 1000

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

const compact = (value) => String(value || '').replace(/\s+/g, ' ').trim()
const matcherIndexKey = (value) => compact(value)
  .replace(/\d+(?:\.\d+)?/g, '#')
  .replace(/[+-]#/g, '#')
const SUPPORTED_STAT_TYPES = new Set(['explicit', 'implicit', 'fractured', 'crafted', 'enchant', 'pseudo'])
const catalogMatcherIndexes = new WeakMap()

function assertUnique(values, label) {
  const seen = new Set()
  for (const value of values) {
    if (seen.has(value)) throw new Error(`交易目录存在重复${label}：${value}`)
    seen.add(value)
  }
}

export function validateTradeCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object') throw new Error('交易目录不是对象')
  if (catalog.schemaVersion !== TRADE_CATALOG_SCHEMA_VERSION) {
    throw new Error(`交易目录 schema 不兼容：${catalog.schemaVersion}`)
  }
  if (catalog.game !== 'poe1' || catalog.locale !== 'zh-CN') throw new Error('交易目录游戏或语言无效')
  if (!catalog.gameVersion || !Number.isFinite(Date.parse(catalog.generatedAt))) throw new Error('交易目录版本元数据缺失')
  if (!Array.isArray(catalog.items) || !Array.isArray(catalog.stats)) throw new Error('交易目录记录结构无效')

  assertUnique(catalog.items.map((entry) => compact(entry.key || entry.name)), '物品键')
  assertUnique(catalog.stats.map((entry) => compact(entry.key)), '词缀键')
  const matcherKeys = []
  for (const entry of catalog.stats) {
    if (!entry.key || !Array.isArray(entry.matchers) || !entry.matchers.length) throw new Error('交易目录词缀缺少 matcher')
    const ids = Object.values(entry.ids || {})
    if (!ids.length || ids.some((id) => !/^(explicit|implicit|fractured|crafted|enchant)\.stat_\d+$|^pseudo\.[a-z0-9_]+$/.test(id))) {
      throw new Error(`交易目录词缀 ${entry.key} 的 stat ID 无效`)
    }
    for (const matcher of entry.matchers) {
      const key = compact(matcher)
      if (!key) throw new Error(`交易目录 matcher 无效：${matcher}`)
      matcherKeys.push(key)
    }
  }
  assertUnique(matcherKeys, '词缀 matcher')
  return catalog
}

export function tradeCatalogStatus(catalog, now = Date.now()) {
  const generatedAt = Date.parse(catalog.generatedAt)
  return {
    schemaVersion: catalog.schemaVersion,
    gameVersion: catalog.gameVersion,
    locale: catalog.locale,
    generatedAt: catalog.generatedAt,
    stale: now - generatedAt > TRADE_CATALOG_STALE_MS,
    counts: { items: catalog.items.length, stats: catalog.stats.length },
    sources: [...(catalog.sources || [])]
  }
}

export async function loadTradeCatalog(file = path.join(moduleDir, 'catalog.json'), now = Date.now()) {
  const catalog = validateTradeCatalog(JSON.parse(await readFile(file, 'utf8')))
  return { catalog, status: tradeCatalogStatus(catalog, now) }
}

export function createOfficialTradeCatalog(baseCatalog, payload, now = Date.now()) {
  if (!Array.isArray(payload?.result)) throw new Error('腾讯官方词缀目录响应结构无效')
  const grouped = new Map()
  for (const group of payload.result) {
    for (const entry of group?.entries || []) {
      const matcher = compact(entry?.text)
      const type = compact(entry?.type || group?.id)
      const id = compact(entry?.id)
      if (!matcher || !SUPPORTED_STAT_TYPES.has(type)) continue
      const validId = type === 'pseudo'
        ? /^pseudo\.[a-z0-9_]+$/.test(id)
        : new RegExp(`^${type}\\.stat_\\d+$`).test(id)
      if (!validId) continue
      const record = grouped.get(matcher) || { matcher, byType: new Map() }
      const ids = record.byType.get(type) || new Set()
      ids.add(id)
      record.byType.set(type, ids)
      grouped.set(matcher, record)
    }
  }
  const stats = []
  for (const record of grouped.values()) {
    const ids = {}
    for (const [type, candidates] of record.byType) {
      if (candidates.size === 1) ids[type] = [...candidates][0]
    }
    if (!Object.keys(ids).length) continue
    stats.push({
      key: `official-${stats.length + 1}`,
      label: record.matcher.replaceAll('#', '数值'),
      matchers: [record.matcher],
      ids
    })
  }
  const knownMatchers = new Set(stats.flatMap((entry) => entry.matchers.map(compact)))
  for (const entry of baseCatalog.stats) {
    if (!entry.matchers.some((matcher) => knownMatchers.has(compact(matcher)))) stats.push(structuredClone(entry))
  }
  if (stats.length < 100) throw new Error('腾讯官方词缀目录记录数异常')
  const catalog = validateTradeCatalog({
    ...structuredClone(baseCatalog),
    generatedAt: new Date(now).toISOString(),
    sources: ['腾讯国服官方 /api/trade/data/stats', ...(baseCatalog.sources || [])],
    stats
  })
  return {
    catalog,
    status: {
      ...tradeCatalogStatus(catalog, now),
      provider: 'official',
      degraded: false
    }
  }
}

export function matcherToRegExp(matcher) {
  const escaped = compact(matcher)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replaceAll('#', '([-+]?\\d+(?:\\.\\d+)?)')
    .replace(/\\ /g, '\\s*')
  return new RegExp(`^${escaped}$`)
}

export function matchCatalogStat(catalog, text, type = 'explicit') {
  const normalized = compact(text)
  let index = catalogMatcherIndexes.get(catalog)
  if (!index) {
    index = new Map()
    for (const entry of catalog.stats) {
      for (const matcher of entry.matchers) {
        const key = matcherIndexKey(matcher)
        const candidates = index.get(key) || []
        candidates.push({ entry, matcher })
        index.set(key, candidates)
      }
    }
    catalogMatcherIndexes.set(catalog, index)
  }
  const key = matcherIndexKey(normalized)
  for (const { entry, matcher } of index.get(key) || []) {
    const id = entry.ids?.[type] || entry.ids?.explicit
    if (!id) continue
    const match = normalized.match(matcherToRegExp(matcher))
    if (!match) continue
    const values = match.slice(1).map(Number).filter(Number.isFinite)
    return { key: entry.key, label: entry.label, id, matcher, values }
  }
  return null
}
