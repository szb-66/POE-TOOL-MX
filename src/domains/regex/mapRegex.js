import { ATLAS_MAP_AFFIX_SUGGESTIONS } from '../../data/mapAffixSuggestionsData.js'
import internationalMapData from '../../data/internationalMapData.js'
import { currentServer } from '../../utils/serverContext.js'
import { catalogSearchText } from '../../utils/localizedCatalog.js'
import { compileCompactExpressions, escapeRegexText } from './compactExpression.js'
import { finalizeRegex, quotedToken, REGEX_LENGTH_LIMIT } from './regexResult.js'
import { finalizeLocalizedResult, localizedExpression } from './localizedRegex.js'

export { REGEX_LENGTH_LIMIT }

const RAW_MAP_STATS = [
  { id: 'rarity', label: '物品稀有度', sample: '物品稀有度: +80%' },
  { id: 'atlasDrops', label: '异界掉落', sample: '异界掉落: +80%' },
  { id: 'packSize', label: '怪物群大小', sample: '怪物群大小: +80%' },
  { id: 'threads', label: '更多丝线', sample: '更多丝线: +80%' },
  { id: 'maps', label: '更多地图', sample: '更多地图: +80%' },
  { id: 'currency', label: '更多通货', sample: '更多通货: +80%' },
  { id: 'quality', label: '地图品质', sample: '地图品质: +80%' }
]

const RAW_MAP_RARITIES = [
  { id: 'normal', label: '普通', text: '稀有度: 普通' },
  { id: 'magic', label: '魔法', text: '稀有度: 魔法' },
  { id: 'rare', label: '稀有', text: '稀有度: 稀有' }
]

const rawAffixes = ATLAS_MAP_AFFIX_SUGGESTIONS.map((entry) => ({
    id: entry.canonicalId || entry.value,
    canonicalId: entry.canonicalId || entry.value,
    canonicalIds: entry.canonicalIds || (entry.canonicalId ? [entry.canonicalId] : [entry.value]),
    value: entry.value,
    example: entry.example,
    variants: entry.variants || [entry.example],
    affixType: entry.affixType,
    tags: entry.tags || [],
    regions: ['atlas']
}))

const LEGACY_MAP_REGEX_AFFIX_ID_MAP = new Map()
for (const entry of rawAffixes) {
  LEGACY_MAP_REGEX_AFFIX_ID_MAP.set(entry.value, entry.id)
  LEGACY_MAP_REGEX_AFFIX_ID_MAP.set(entry.id, entry.id)
  for (const cid of entry.canonicalIds) LEGACY_MAP_REGEX_AFFIX_ID_MAP.set(cid, entry.id)
}
for (const entry of internationalMapData.atlas) {
  if (!LEGACY_MAP_REGEX_AFFIX_ID_MAP.has(entry.id)) LEGACY_MAP_REGEX_AFFIX_ID_MAP.set(entry.id, entry.id)
  if (!LEGACY_MAP_REGEX_AFFIX_ID_MAP.has(entry.value)) LEGACY_MAP_REGEX_AFFIX_ID_MAP.set(entry.value, entry.id)
}

export function normalizeMapRegexAffixId(id) {
  const key = String(id || '').trim()
  if (!key) return ''
  return LEGACY_MAP_REGEX_AFFIX_ID_MAP.get(key) || key
}

const mapCorpusEntries = [
  ...RAW_MAP_STATS.map(item => ({ id: `stat:${item.id}`, source: item.label, variants: [item.sample], fallbackExpression: item.label })),
  ...RAW_MAP_RARITIES.map(item => ({ id: `rarity:${item.id}`, source: item.text, variants: [item.text], fallbackExpression: escapeRegexText(item.text) })),
  { id: 'state:corrupted', source: '已腐化', variants: ['已腐化'], fallbackExpression: '已腐化' },
  ...rawAffixes.map(item => ({ id: `affix:${item.id}`, source: item.example, variants: item.variants, fallbackExpression: escapeRegexText(item.value) }))
]
const compactExpressions = compileCompactExpressions(mapCorpusEntries)

const CN_MAP_COMPACT_EXPRESSIONS = Object.freeze(Object.fromEntries(compactExpressions))

const CN_MAP_REGEX_CORPUS = Object.freeze(mapCorpusEntries.map(entry => Object.freeze({
  id: entry.id,
  variants: Object.freeze([...entry.variants])
})))

const CN_MAP_REGEX_STATS = Object.freeze(RAW_MAP_STATS.map(item => Object.freeze({
  id: item.id,
  label: item.label,
  expression: `${compactExpressions.get(`stat:${item.id}`)}.*`,
  compactExpression: compactExpressions.get(`stat:${item.id}`),
  suffix: '%'
})))

const CN_MAP_RARITY_OPTIONS = Object.freeze(RAW_MAP_RARITIES.map(item => Object.freeze({
  id: item.id,
  label: item.label,
  expression: compactExpressions.get(`rarity:${item.id}`)
})))

const CN_MAP_CORRUPTED_EXPRESSION = compactExpressions.get('state:corrupted')

export const MAP_PRICE_CURRENCIES = Object.freeze([
  { id: 'ex', label: '崇高石' },
  { id: 'div', label: '神圣石' },
  { id: 'ch', label: '混沌石' },
  { id: 'al', label: '点金石' },
  { id: 're', label: '富豪石' },
  { id: 'va', label: '瓦尔宝珠' }
].map(item => Object.freeze(item)))

const CN_MAP_REGEX_AFFIXES = Object.freeze(rawAffixes.map(item => Object.freeze({
  id: item.id,
  value: item.value,
  example: item.example,
  variants: Object.freeze([...item.variants]),
  compactExpression: compactExpressions.get(`affix:${item.id}`),
  affixType: item.affixType,
  tags: Object.freeze([...item.tags]),
  regions: Object.freeze([...item.regions])
})))

const catalogs = new Map([['zh-CN', { expressions: CN_MAP_COMPACT_EXPRESSIONS, corpus: CN_MAP_REGEX_CORPUS, stats: CN_MAP_REGEX_STATS, rarities: CN_MAP_RARITY_OPTIONS, corrupted: CN_MAP_CORRUPTED_EXPRESSION, affixes: CN_MAP_REGEX_AFFIXES }]])

export function mapRegexCatalog(language = currentServer.language) {
  if (catalogs.has(language)) return catalogs.get(language)
  if (language !== 'en') throw new Error('不支持的客户端语言')
  const stats = [
    ['rarity', '物品稀有度', 'Item Rarity'], ['atlasDrops', '星界掉落', 'Atlas Drops'],
    ['packSize', '怪物群大小', 'Monster Pack Size'], ['threads', '更多丝线', 'More Threads'],
    ['maps', '更多地图', 'More Maps'], ['currency', '更多通货', 'More Currency'], ['quality', '地图品质', 'Quality']
  ].map(([id, label, text]) => ({ id, label, text, sample: `${text}: +80%` }))
  const rarities = [['normal', '普通', 'Normal'], ['magic', '魔法', 'Magic'], ['rare', '稀有', 'Rare']].map(([id, label, name]) => ({ id, label, text: `Rarity: ${name}` }))
  const numericShape = text => text.replace(/\(-([\d.]+)[—–-]-([\d.]+)\)/g, '-($1—$2)').replace(/\(?\d+(?:\.\d+)?(?:\s*[—–-]\s*\d+(?:\.\d+)?)?\)?/g, '#')
  const numericToken = '\\(?[+\\-]?\\d+(?:\\.\\d+)?(?:[—–-][+\\-]?\\d+(?:\\.\\d+)?)?\\)?'
  const entries = [
    ...stats.map(stat => ({ id: `stat:${stat.id}`, source: `${stat.text}:`, variants: [stat.sample], fallbackExpression: escapeRegexText(`${stat.text}:`) })),
    ...rarities.map(item => ({ id: `rarity:${item.id}`, source: item.text, variants: [item.text], fallbackExpression: `^${escapeRegexText(item.text)}$` })),
    { id: 'state:corrupted', source: 'Corrupted', variants: ['Corrupted'], fallbackExpression: '^Corrupted$' },
    ...internationalMapData.atlas.map(item => ({ id: `affix:${item.id}`, source: item.example, variants: item.variants, fallbackExpression: `^${numericShape(item.example).split('#').map(escapeRegexText).join(numericToken)}$` }))
  ]
  const expressions = compileCompactExpressions(entries, { language: 'en' })
  const catalog = {
    expressions: Object.freeze(Object.fromEntries(expressions)), corpus: entries.map(entry => ({ id: entry.id, variants: entry.variants })),
    stats: stats.map(stat => ({ id: stat.id, label: stat.label, text: stat.text, expression: `${escapeRegexText(stat.text)}:[ \\t+]*`, compactExpression: expressions.get(`stat:${stat.id}`), suffix: '%' })),
    rarities: rarities.map(item => ({ ...item, expression: expressions.get(`rarity:${item.id}`) })),
    corrupted: expressions.get('state:corrupted'),
    affixes: internationalMapData.atlas.map(item => ({ ...item, regions: ['atlas'], compactExpression: expressions.get(`affix:${item.id}`) }))
  }
  catalogs.set(language, catalog)
  return catalog
}

const currentCatalog = mapRegexCatalog()
export const MAP_COMPACT_EXPRESSIONS = currentCatalog.expressions
export const MAP_REGEX_CORPUS = currentCatalog.corpus
export const MAP_REGEX_STATS = currentCatalog.stats
export const MAP_RARITY_OPTIONS = currentCatalog.rarities
export const MAP_CORRUPTED_EXPRESSION = currentCatalog.corrupted
export const MAP_REGEX_AFFIXES = currentCatalog.affixes

const rarityIds = new Set(['normal', 'magic', 'rare'])
const priceCurrencyIds = new Set(MAP_PRICE_CURRENCIES.map(item => item.id))
const clampNumber = value => Math.max(0, Math.min(999, Math.trunc(Number(value) || 0)))
const optionalInteger = value => value === '' || value == null || !Number.isInteger(Number(value)) ? null : Number(value)
const uniqueKnown = (value, allowed) => Array.isArray(value) ? [...new Set(value.filter(id => allowed.has(id)))] : []
const mode = value => value === 'exclude' ? 'exclude' : 'include'

export function createDefaultMapRegexConfig(language = currentServer.language) {
  return {
    statMatch: 'all',
    numericMode: 'optimized',
    stats: Object.fromEntries(mapRegexCatalog(language).stats.map(stat => [stat.id, { enabled: false, value: 0 }])),
    rarity: { mode: 'include', selectedIds: [] },
    corrupted: { enabled: false, mode: 'include' },
    priceRange: { min: null, max: null, currencies: [] },
    affixMatch: 'any',
    region: 'atlas',
    affixTypes: ['prefix', 'suffix'],
    includeAffixIds: [],
    excludeAffixIds: []
  }
}

const ALL_VALID_MAP_REGEX_AFFIX_IDS = new Set([
  ...rawAffixes.map(item => item.id),
  ...internationalMapData.atlas.map(item => item.id)
])

const uniqueNormalizedAffixIds = (value) => Array.isArray(value)
  ? [...new Set(value.map(normalizeMapRegexAffixId).filter(id => ALL_VALID_MAP_REGEX_AFFIX_IDS.has(id)))]
  : []

export function cleanMapRegexConfig(value, language = currentServer.language) {
  const source = value && typeof value === 'object' ? value : {}
  const catalog = mapRegexCatalog(language)
  const excludeAffixIds = uniqueNormalizedAffixIds(source.excludeAffixIds)
  const excludeSet = new Set(excludeAffixIds)
  const includeAffixIds = uniqueNormalizedAffixIds(source.includeAffixIds).filter(id => !excludeSet.has(id))
  return {
    statMatch: source.statMatch === 'any' ? 'any' : 'all',
    numericMode: source.numericMode === 'exact' ? 'exact' : 'optimized',
    stats: Object.fromEntries(catalog.stats.map(stat => [stat.id, {
      enabled: Boolean(source.stats?.[stat.id]?.enabled),
      value: clampNumber(source.stats?.[stat.id]?.value)
    }])),
    rarity: { mode: mode(source.rarity?.mode), selectedIds: uniqueKnown(source.rarity?.selectedIds, rarityIds) },
    corrupted: { enabled: Boolean(source.corrupted?.enabled), mode: mode(source.corrupted?.mode) },
    priceRange: {
      min: optionalInteger(source.priceRange?.min),
      max: optionalInteger(source.priceRange?.max),
      currencies: uniqueKnown(source.priceRange?.currencies, priceCurrencyIds)
    },
    affixMatch: source.affixMatch === 'all' ? 'all' : 'any',
    // Legacy normal/t17 presets retain their conditions in the unified catalog.
    region: 'atlas',
    affixTypes: uniqueKnown(source.affixTypes, new Set(['prefix', 'suffix'])),
    includeAffixIds,
    excludeAffixIds
  }
}

export function filterMapRegexAffixes(config, query = '', language = currentServer.language, aliases = null) {
  const keyword = query.trim().toLocaleLowerCase('zh-CN')
  const types = config?.affixTypes || ['prefix', 'suffix']
  return mapRegexCatalog(language).affixes
    .filter(item => item.affixType === 'mixed' || types.includes(item.affixType))
    .filter(item => !keyword || catalogSearchText([item.value, item.example, ...(item.variants || []), ...(item.tags || [])], aliases).includes(keyword))
}

export function createDefaultMapRegexPreset(id = 'default', name = '默认预设') {
  return { id, name, mapRegex: createDefaultMapRegexConfig() }
}

export function cleanMapRegexPresets(value) {
  if (!Array.isArray(value)) return [createDefaultMapRegexPreset()]
  const ids = new Set()
  const presets = value.map((raw, index) => ({
    id: typeof raw?.id === 'string' && raw.id ? raw.id : `map_regex_${index + 1}`,
    name: typeof raw?.name === 'string' && raw.name.trim() ? raw.name.trim() : `预设${index + 1}`,
    mapRegex: cleanMapRegexConfig(raw?.mapRegex)
  })).filter(preset => !ids.has(preset.id) && ids.add(preset.id))
  if (!presets.some(preset => preset.id === 'default')) presets.unshift(createDefaultMapRegexPreset())
  return presets.length ? presets : [createDefaultMapRegexPreset()]
}

function compressNumberStrings(values) {
  if (!values.length) return ''
  if (values.every(value => value === '')) return ''
  const grouped = new Map()
  for (const value of values) {
    const head = value[0]
    const list = grouped.get(head) || []
    list.push(value.slice(1))
    grouped.set(head, list)
  }
  const bySuffix = new Map()
  for (const [digit, tails] of grouped) {
    const suffix = compressNumberStrings(tails)
    const digits = bySuffix.get(suffix) || []
    digits.push(digit)
    bySuffix.set(suffix, digits)
  }
  const parts = [...bySuffix].map(([suffix, digits]) => {
    const numericDigits = [...new Set(digits.map(Number))].sort((left, right) => left - right)
    const ranges = []
    for (let index = 0; index < numericDigits.length;) {
      let end = index
      while (end + 1 < numericDigits.length && numericDigits[end + 1] === numericDigits[end] + 1) end += 1
      const size = end - index + 1
      ranges.push(size >= 3 ? `${numericDigits[index]}-${numericDigits[end]}` : numericDigits.slice(index, end + 1).join(''))
      index = end + 1
    }
    const prefix = numericDigits.length === 10 ? '\\d' : numericDigits.length === 1 ? String(numericDigits[0]) : `[${ranges.join('')}]`
    return `${prefix}${suffix}`
  })
  return parts.length === 1 ? parts[0] : `(?:${parts.join('|')})`
}

function compressNumbersByLength(values) {
  const groups = new Map()
  for (const value of values) {
    const sameLength = groups.get(value.length) || []
    sameLength.push(value)
    groups.set(value.length, sameLength)
  }
  const patterns = [...groups.values()].map(compressNumberStrings)
  return patterns.length === 1 ? patterns[0] : `(?:${patterns.join('|')})`
}

export function numericAtLeastPattern(value, numericMode = 'optimized') {
  const minimum = clampNumber(value)
  const values = Array.from({ length: 1000 - minimum }, (_, index) => String(minimum + index))
  const bounded = numericMode === 'exact' ? values.join('|') : compressNumbersByLength(values)
  return `(?:${bounded}|[1-9]\\d{3,})`
}

export function numericRangePattern(minimum, maximum) {
  const min = optionalInteger(minimum)
  const max = optionalInteger(maximum)
  if (min == null || max == null || min < 1 || max > 999 || min > max) return ''
  return compressNumbersByLength(Array.from({ length: max - min + 1 }, (_, index) => String(min + index)))
}

export function validateMapPriceRange(priceRange) {
  const min = optionalInteger(priceRange?.min)
  const max = optionalInteger(priceRange?.max)
  const currencies = uniqueKnown(priceRange?.currencies, priceCurrencyIds)
  const active = min != null || max != null || currencies.length > 0
  if (!active) return { active: false, valid: false, message: '' }
  if (min == null || max == null) return { active: true, valid: false, message: '请同时填写最低价和最高价' }
  if (min < 1 || max > 999) return { active: true, valid: false, message: '价格范围必须在 1 到 999 之间' }
  if (min > max) return { active: true, valid: false, message: '最低价不能高于最高价' }
  if (!currencies.length) return { active: true, valid: false, message: '请至少选择一种货币' }
  return { active: true, valid: true, message: '' }
}

export function generateMapPriceExpression(priceRange) {
  if (!validateMapPriceRange(priceRange).valid) return ''
  const currencies = uniqueKnown(priceRange.currencies, priceCurrencyIds)
  const currencyExpression = currencies.length === 1 ? currencies[0] : `(${currencies.join('|')})`
  return `~b/o ${numericRangePattern(priceRange.min, priceRange.max)} ${currencyExpression}`
}

export function mapRegexLocalizationTexts() {
  const catalog = mapRegexCatalog('en')
  return [...catalog.stats.map(stat => `${stat.text}:`), ...catalog.rarities.map(item => item.text), 'Corrupted', ...catalog.affixes.flatMap(item => [item.value, item.example, ...(item.variants || [])])]
}

export function generateMapRegex(rawConfig, language = currentServer.language, aliases = null) {
  const config = cleanMapRegexConfig(rawConfig, language)
  const catalog = mapRegexCatalog(language)
  const tokens = []
  let includeCount = 0
  let excludeCount = 0
  const missing = []
  const statExpressions = catalog.stats.filter(stat => config.stats[stat.id].enabled).map(stat => {
    includeCount += 1
    const localized = localizedExpression(stat.expression, [`${stat.text}:`], aliases, { suffix: '[ \\t+]*' })
    if (aliases && !localized.mapped) missing.push(stat.label)
    return `${localized.expression}${numericAtLeastPattern(config.stats[stat.id].value, config.numericMode)}${stat.suffix}`
  })
  if (statExpressions.length) {
    if (config.statMatch === 'any') tokens.push(quotedToken(statExpressions.join('|')))
    else tokens.push(...statExpressions.map(expression => quotedToken(expression)))
  }

  const rarityExpressions = catalog.rarities.filter(item => config.rarity.selectedIds.includes(item.id)).map(item => {
    const localized = localizedExpression(item.expression, [item.text], aliases)
    if (aliases && !localized.mapped) missing.push(item.label)
    return localized.expression
  })
  if (rarityExpressions.length) {
    tokens.push(quotedToken(rarityExpressions.join('|'), config.rarity.mode === 'exclude'))
    if (config.rarity.mode === 'exclude') excludeCount += rarityExpressions.length
    else includeCount += rarityExpressions.length
  }
  if (config.corrupted.enabled) {
    const localized = localizedExpression(catalog.corrupted, ['Corrupted'], aliases)
    if (aliases && !localized.mapped) missing.push('腐化状态')
    tokens.push(quotedToken(localized.expression, config.corrupted.mode === 'exclude'))
    if (config.corrupted.mode === 'exclude') excludeCount += 1
    else includeCount += 1
  }


  const priceExpression = generateMapPriceExpression(config.priceRange)
  if (priceExpression) {
    tokens.push(quotedToken(priceExpression))
    includeCount += 1
  }

  const expressionForIds = ids => ids.map(id => {
    const item = catalog.affixes.find(item => item.id === id)
    if (!item) return null
    const localized = localizedExpression(item.compactExpression, [item.value, item.example, ...(item.variants || [])], aliases)
    if (aliases && !localized.mapped) missing.push(item.value)
    return localized.expression
  }).filter(Boolean)
  const included = expressionForIds(config.includeAffixIds)
  const excluded = expressionForIds(config.excludeAffixIds)
  if (included.length) {
    if (config.affixMatch === 'all') tokens.push(...included.map(expression => quotedToken(expression)))
    else tokens.push(quotedToken(included.join('|')))
    includeCount += included.length
  }
  if (excluded.length) {
    tokens.push(quotedToken(excluded.join('|'), true))
    excludeCount += excluded.length
  }
  return finalizeLocalizedResult(finalizeRegex(tokens, { includeCount, excludeCount }), missing, Boolean(aliases))
}
