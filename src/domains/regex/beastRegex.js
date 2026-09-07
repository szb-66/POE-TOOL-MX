import { BEAST_NAMES } from './beastData.js'
import { compileCompactExpressions, escapeRegexText } from './compactExpression.js'
import { cleanMapRegexConfig, generateMapPriceExpression } from './mapRegex.js'
import { finalizeRegex, quotedToken } from './regexResult.js'

const expressions = compileCompactExpressions(BEAST_NAMES.map(name => ({
  id: name, source: name, variants: [name], fallbackExpression: `^${escapeRegexText(name)}$`
})), { minimumHanLength: 1 })
export const BEAST_REGEX_OPTIONS = BEAST_NAMES.map(name => ({ id: name, name, expression: expressions.get(name) }))
const knownIds = new Set(BEAST_NAMES)
const cleanIds = value => [...new Set(Array.isArray(value) ? value.filter(id => knownIds.has(id)) : [])]

export function createDefaultBeastRegexConfig() {
  return { priceRange: { min: null, max: null, currencies: [] }, includeIds: [], excludeIds: [] }
}

export function cleanBeastRegexConfig(value) {
  const source = value && typeof value === 'object' ? value : {}
  const excludeIds = cleanIds(source.excludeIds)
  return {
    priceRange: cleanMapRegexConfig(source).priceRange,
    includeIds: cleanIds(source.includeIds).filter(id => !excludeIds.includes(id)),
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

export function generateBeastRegex(value) {
  const config = cleanBeastRegexConfig(value)
  const price = generateMapPriceExpression(config.priceRange)
  return finalizeRegex([
    quotedToken(price),
    quotedToken(config.includeIds.map(id => expressions.get(id)).join('|')),
    quotedToken(config.excludeIds.map(id => expressions.get(id)).join('|'), true)
  ], { includeCount: config.includeIds.length + Number(Boolean(price)), excludeCount: config.excludeIds.length })
}
