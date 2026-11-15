import { BEAST_NAMES } from './beastData.js'
import internationalMapData from '../../data/internationalMapData.js'
import { currentServer } from '../../utils/serverContext.js'
import { compileCompactExpressions, escapeRegexText } from './compactExpression.js'
import { cleanMapRegexConfig, generateMapPriceExpression } from './mapRegex.js'
import { finalizeRegex, quotedToken } from './regexResult.js'

const chineseExpressions = compileCompactExpressions(BEAST_NAMES.map(name => ({
  id: name, source: name, variants: [name], fallbackExpression: `^${escapeRegexText(name)}$`
})), { minimumHanLength: 1 })
const catalogs = new Map([['zh-CN', BEAST_NAMES.map(name => ({ id: name, name, expression: chineseExpressions.get(name) }))]])
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
const cleanIds = (value, knownIds) => [...new Set(Array.isArray(value) ? value.filter(id => knownIds.has(id)) : [])]

export function createDefaultBeastRegexConfig() {
  return { priceRange: { min: null, max: null, currencies: [] }, includeIds: [], excludeIds: [] }
}

export function cleanBeastRegexConfig(value, language = currentServer.language) {
  const source = value && typeof value === 'object' ? value : {}
  const knownIds = new Set(beastRegexOptions(language).map(beast => beast.id))
  const excludeIds = cleanIds(source.excludeIds, knownIds)
  return {
    priceRange: cleanMapRegexConfig(source, language).priceRange,
    includeIds: cleanIds(source.includeIds, knownIds).filter(id => !excludeIds.includes(id)),
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

export function generateBeastRegex(value, language = currentServer.language) {
  const config = cleanBeastRegexConfig(value, language)
  const expressions = new Map(beastRegexOptions(language).map(beast => [beast.id, beast.expression]))
  const price = generateMapPriceExpression(config.priceRange)
  return finalizeRegex([
    quotedToken(price),
    quotedToken(config.includeIds.map(id => expressions.get(id)).join('|')),
    quotedToken(config.excludeIds.map(id => expressions.get(id)).join('|'), true)
  ], { includeCount: config.includeIds.length + Number(Boolean(price)), excludeCount: config.excludeIds.length })
}
