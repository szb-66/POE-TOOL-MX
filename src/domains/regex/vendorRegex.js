import { finalizeRegex, quotedToken, REGEX_LENGTH_LIMIT } from './regexResult.js'
import { cleanVendorConfig } from './vendorConfig.js'
import { VENDOR_GROUPS } from './vendorData.js'

export { REGEX_LENGTH_LIMIT }
export const VENDOR_REGEX_LIMIT = REGEX_LENGTH_LIMIT
export const exceedsVendorRegexLimit = regex => String(regex || '').length > VENDOR_REGEX_LIMIT

export function buildVendorTokens(rawConfig) {
  const config = cleanVendorConfig(rawConfig)
  const tokens = []
  let includeCount = 0
  let excludeCount = 0
  for (const group of VENDOR_GROUPS) {
    const state = config[group.id]
    const selected = new Set(state.selectedIds)
    const expressions = group.options.filter(item => selected.has(item.id)).map(item => item.compactExpression)
    if (!expressions.length) continue
    tokens.push(quotedToken([...new Set(expressions)].join('|'), state.mode === 'exclude'))
    if (state.mode === 'exclude') excludeCount += expressions.length
    else includeCount += expressions.length
  }
  return { tokens, includeCount, excludeCount }
}

export function generateVendorRegex(rawConfig) {
  const result = buildVendorTokens(rawConfig)
  return finalizeRegex(result.tokens, result)
}
