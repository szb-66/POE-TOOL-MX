import { ATLAS_MAP_AFFIX_SUGGESTIONS } from '../../data/mapAffixSuggestionsData.js'
import { compileCompactExpressions, escapeRegexText } from './compactExpression.js'
import { finalizeRegex, quotedToken, REGEX_LENGTH_LIMIT } from './regexResult.js'

export { REGEX_LENGTH_LIMIT }

const RAW_MAP_STATS = [
  { id: 'rarity', label: '物品稀有度', sample: '物品稀有度: +80%' },
  { id: 'quantity', label: '物品数量', sample: '物品数量: +80%' },
  { id: 'packSize', label: '怪物群大小', sample: '怪物群大小: +80%' },
  { id: 'scarabs', label: '更多圣甲虫', sample: '更多圣甲虫: +80%' },
  { id: 'currency', label: '更多通货', sample: '更多通货: +80%' },
  { id: 'quality', label: '地图品质', sample: '地图品质: +80%' }
]

const RAW_MAP_RARITIES = [
  { id: 'normal', label: '普通', text: '稀有度: 普通' },
  { id: 'magic', label: '魔法', text: '稀有度: 魔法' },
  { id: 'rare', label: '稀有', text: '稀有度: 稀有' }
]

const T17_MARKERS = [
  '3 次连锁', '额外随机元素伤害', '淹没法球', '焚界者符文', '迷宫陷阱',
  '药剂效果总降', '格挡攻击伤害', '血痕锯刃魔', '塑界者触碰',
  '虚空忆境首领', '缓速藤蔓', '无常之核', '贤主会干涉', '陨石的目标',
  '不稳定的恶魔触手', '随机印记', '稀有怪物死亡时暂时复活'
]

const rawAffixes = ATLAS_MAP_AFFIX_SUGGESTIONS.map((entry) => {
  const text = `${entry.value} ${entry.example} ${(entry.variants || []).join(' ')}`
  return {
    id: entry.value,
    value: entry.value,
    example: entry.example,
    variants: entry.variants || [entry.example],
    affixType: entry.affixType,
    tags: entry.tags || [],
    regions: T17_MARKERS.some(marker => text.includes(marker)) ? ['t17'] : ['normal']
  }
})

const mapCorpusEntries = [
  ...RAW_MAP_STATS.map(item => ({ id: `stat:${item.id}`, source: item.label, variants: [item.sample], fallbackExpression: item.label })),
  ...RAW_MAP_RARITIES.map(item => ({ id: `rarity:${item.id}`, source: item.text, variants: [item.text], fallbackExpression: escapeRegexText(item.text) })),
  { id: 'state:corrupted', source: '已腐化', variants: ['已腐化'], fallbackExpression: '已腐化' },
  ...rawAffixes.map(item => ({ id: `affix:${item.id}`, source: item.example, variants: item.variants, fallbackExpression: escapeRegexText(item.value) }))
]
const compactExpressions = compileCompactExpressions(mapCorpusEntries)

export const MAP_COMPACT_EXPRESSIONS = Object.freeze(Object.fromEntries(compactExpressions))

export const MAP_REGEX_CORPUS = Object.freeze(mapCorpusEntries.map(entry => Object.freeze({
  id: entry.id,
  variants: Object.freeze([...entry.variants])
})))

export const MAP_REGEX_STATS = Object.freeze(RAW_MAP_STATS.map(item => Object.freeze({
  id: item.id,
  label: item.label,
  expression: `${compactExpressions.get(`stat:${item.id}`)}.*`,
  compactExpression: compactExpressions.get(`stat:${item.id}`),
  suffix: '%'
})))

export const MAP_RARITY_OPTIONS = Object.freeze(RAW_MAP_RARITIES.map(item => Object.freeze({
  id: item.id,
  label: item.label,
  expression: compactExpressions.get(`rarity:${item.id}`)
})))

export const MAP_CORRUPTED_EXPRESSION = compactExpressions.get('state:corrupted')

export const MAP_PRICE_CURRENCIES = Object.freeze([
  { id: 'ex', label: '崇高石' },
  { id: 'div', label: '神圣石' },
  { id: 'ch', label: '混沌石' },
  { id: 'al', label: '点金石' },
  { id: 're', label: '富豪石' },
  { id: 'va', label: '瓦尔宝珠' }
].map(item => Object.freeze(item)))

export const MAP_REGEX_AFFIXES = Object.freeze(rawAffixes.map(item => Object.freeze({
  id: item.id,
  value: item.value,
  example: item.example,
  variants: Object.freeze([...item.variants]),
  compactExpression: compactExpressions.get(`affix:${item.id}`),
  affixType: item.affixType,
  tags: Object.freeze([...item.tags]),
  regions: Object.freeze([...item.regions])
})))

const affixIds = new Set(MAP_REGEX_AFFIXES.map(item => item.id))
const rarityIds = new Set(MAP_RARITY_OPTIONS.map(item => item.id))
const priceCurrencyIds = new Set(MAP_PRICE_CURRENCIES.map(item => item.id))
const clampNumber = value => Math.max(0, Math.min(999, Math.trunc(Number(value) || 0)))
const optionalInteger = value => value === '' || value == null || !Number.isInteger(Number(value)) ? null : Number(value)
const uniqueKnown = (value, allowed) => Array.isArray(value) ? [...new Set(value.filter(id => allowed.has(id)))] : []
const mode = value => value === 'exclude' ? 'exclude' : 'include'

export function createDefaultMapRegexConfig() {
  return {
    statMatch: 'all',
    numericMode: 'optimized',
    stats: Object.fromEntries(MAP_REGEX_STATS.map(stat => [stat.id, { enabled: false, value: 0 }])),
    rarity: { mode: 'include', selectedIds: [] },
    corrupted: { enabled: false, mode: 'include' },
    priceRange: { min: null, max: null, currencies: [] },
    affixMatch: 'any',
    region: 'normal',
    affixTypes: ['prefix', 'suffix'],
    includeAffixIds: [],
    excludeAffixIds: []
  }
}

export function cleanMapRegexConfig(value) {
  const source = value && typeof value === 'object' ? value : {}
  return {
    statMatch: source.statMatch === 'any' ? 'any' : 'all',
    numericMode: source.numericMode === 'exact' ? 'exact' : 'optimized',
    stats: Object.fromEntries(MAP_REGEX_STATS.map(stat => [stat.id, {
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
    region: source.region === 't17' ? 't17' : 'normal',
    affixTypes: uniqueKnown(source.affixTypes, new Set(['prefix', 'suffix'])),
    includeAffixIds: uniqueKnown(source.includeAffixIds, affixIds),
    excludeAffixIds: uniqueKnown(source.excludeAffixIds, affixIds)
  }
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

export function generateMapRegex(rawConfig) {
  const config = cleanMapRegexConfig(rawConfig)
  const tokens = []
  let includeCount = 0
  let excludeCount = 0
  const statExpressions = MAP_REGEX_STATS.filter(stat => config.stats[stat.id].enabled).map(stat => {
    includeCount += 1
    return `${stat.expression}${numericAtLeastPattern(config.stats[stat.id].value, config.numericMode)}${stat.suffix}`
  })
  if (statExpressions.length) {
    if (config.statMatch === 'any') tokens.push(quotedToken(statExpressions.join('|')))
    else tokens.push(...statExpressions.map(expression => quotedToken(expression)))
  }

  const rarityExpressions = MAP_RARITY_OPTIONS.filter(item => config.rarity.selectedIds.includes(item.id)).map(item => item.expression)
  if (rarityExpressions.length) {
    tokens.push(quotedToken(rarityExpressions.join('|'), config.rarity.mode === 'exclude'))
    if (config.rarity.mode === 'exclude') excludeCount += rarityExpressions.length
    else includeCount += rarityExpressions.length
  }
  if (config.corrupted.enabled) {
    tokens.push(quotedToken(MAP_CORRUPTED_EXPRESSION, config.corrupted.mode === 'exclude'))
    if (config.corrupted.mode === 'exclude') excludeCount += 1
    else includeCount += 1
  }


  const priceExpression = generateMapPriceExpression(config.priceRange)
  if (priceExpression) {
    tokens.push(quotedToken(priceExpression))
    includeCount += 1
  }

  const expressionForIds = ids => ids.map(id => MAP_REGEX_AFFIXES.find(item => item.id === id)?.compactExpression).filter(Boolean)
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
  return finalizeRegex(tokens, { includeCount, excludeCount })
}
