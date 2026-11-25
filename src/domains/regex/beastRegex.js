import { BEAST_CROSS_SERVER_ENTRIES, BEAST_NAMES } from './beastData.js'
import internationalMapData from '../../data/internationalMapData.js'
import { currentServer } from '../../utils/serverContext.js'
import { compileCompactExpressions, escapeRegexText } from './compactExpression.js'
import { cleanMapRegexConfig, generateMapPriceExpression } from './mapRegex.js'
import { finalizeRegex, quotedToken } from './regexResult.js'
import { finalizeLocalizedResult, localizedExpression } from './localizedRegex.js'

const CN_NAME_TO_CANONICAL_ID = new Map(BEAST_CROSS_SERVER_ENTRIES.map(entry => [entry.cnName, entry.id]))
const EN_NAME_TO_CANONICAL_ID = new Map(BEAST_CROSS_SERVER_ENTRIES.map(entry => [entry.enName, entry.id]))

export function normalizeBeastRegexId(id) {
  const key = String(id || '').trim()
  if (!key) return ''
  return CN_NAME_TO_CANONICAL_ID.get(key) || EN_NAME_TO_CANONICAL_ID.get(key) || key
}

const chineseExpressions = compileCompactExpressions(BEAST_NAMES.map(name => ({
  id: CN_NAME_TO_CANONICAL_ID.get(name) || name,
  source: name,
  variants: [name],
  fallbackExpression: `^${escapeRegexText(name)}$`
})), { minimumHanLength: 1 })
const catalogs = new Map([['zh-CN', BEAST_NAMES.map(name => {
  const id = CN_NAME_TO_CANONICAL_ID.get(name) || name
  return { id, name, expression: chineseExpressions.get(id) }
})]])
export function beastRegexOptions(language = currentServer.language) {
  if (catalogs.has(language)) return catalogs.get(language)
  if (language !== 'en') throw new Error('不支持的客户端语言')
  const expressions = compileCompactExpressions(internationalMapData.beasts.map(beast => ({
    id: beast.id, source: beast.name, variants: [beast.name], fallbackExpression: `^${escapeRegexText(beast.name)}$`
  })), { language: 'en' })
  const options = internationalMapData.beasts.map(beast => ({ ...beast, expression: expressions.get(beast.id) }))
  catalogs.set(language, options)
  return options
}
export const BEAST_REGEX_OPTIONS = beastRegexOptions()
const ALL_VALID_BEAST_IDS = new Set([
  ...BEAST_NAMES.map(name => CN_NAME_TO_CANONICAL_ID.get(name) || name),
  ...internationalMapData.beasts.map(beast => beast.id)
])
const uniqueNormalizedIds = value => [...new Set(Array.isArray(value) ? value.map(normalizeBeastRegexId).filter(id => ALL_VALID_BEAST_IDS.has(id)) : [])]

export function createDefaultBeastRegexConfig() {
  return { priceRange: { min: null, max: null, currencies: [] }, includeIds: [], excludeIds: [] }
}

export function cleanBeastRegexConfig(value, language = currentServer.language) {
  const source = value && typeof value === 'object' ? value : {}
  const excludeIds = uniqueNormalizedIds(source.excludeIds)
  return {
    priceRange: cleanMapRegexConfig(source, language).priceRange,
    includeIds: uniqueNormalizedIds(source.includeIds).filter(id => !excludeIds.includes(id)),
    excludeIds
  }
}

export function createDefaultBeastRegexPreset(id = 'default', name = '默认预设') {
  return { id, name, beastRegex: createDefaultBeastRegexConfig() }
}

export function cleanBeastRegexPresets(value) {
  const ids = new Set()
  const presets = (Array.isArray(value) ? value : []).filter(raw => raw && typeof raw === 'object').map((raw, index) => ({
    id: typeof raw.id === 'string' && raw.id ? raw.id : `beast_regex_${index}`,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : '预设',
    beastRegex: cleanBeastRegexConfig(raw.beastRegex)
  })).filter(preset => !ids.has(preset.id) && ids.add(preset.id))
  if (!ids.has('default')) presets.unshift(createDefaultBeastRegexPreset())
  return presets
}

export function generateBeastRegex(value, language = currentServer.language, aliases = null) {
  const config = cleanBeastRegexConfig(value, language)
  const options = beastRegexOptions(language)
  const missing = []
  const expressions = new Map(options.map(beast => {
    const localized = localizedExpression(beast.expression, [beast.name], aliases)
    if (aliases && !localized.mapped && [...config.includeIds, ...config.excludeIds].includes(beast.id)) missing.push(beast.name)
    return [beast.id, localized.expression]
  }))
  const includedExprs = config.includeIds.map(id => expressions.get(id)).filter(Boolean)
  const excludedExprs = config.excludeIds.map(id => expressions.get(id)).filter(Boolean)
  const price = generateMapPriceExpression(config.priceRange)
  return finalizeLocalizedResult(finalizeRegex([
    quotedToken(price),
    quotedToken(includedExprs.join('|')),
    quotedToken(excludedExprs.join('|'), true)
  ], { includeCount: includedExprs.length + Number(Boolean(price)), excludeCount: excludedExprs.length }), missing, Boolean(aliases))
}
