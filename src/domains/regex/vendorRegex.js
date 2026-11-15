import { finalizeRegex, quotedToken, REGEX_LENGTH_LIMIT } from './regexResult.js'
import { cleanVendorConfig } from './vendorConfig.js'
import { VENDOR_GROUPS } from './vendorData.js'
import { localizeVendorGroups } from './vendorLanguage.js'
import { currentServer } from '../../utils/serverContext.js'

export { REGEX_LENGTH_LIMIT }
export const VENDOR_REGEX_LIMIT = REGEX_LENGTH_LIMIT
export const exceedsVendorRegexLimit = regex => String(regex || '').length > VENDOR_REGEX_LIMIT

export function buildVendorTokens(rawConfig, language = currentServer.language) {
  const config = cleanVendorConfig(rawConfig)
  const tokens = []
  let includeCount = 0
  let excludeCount = 0
  for (const group of localizeVendorGroups(VENDOR_GROUPS, language)) {
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

export function generateVendorRegex(rawConfig, language = currentServer.language) {
  const result = buildVendorTokens(rawConfig, language)
  return finalizeRegex(result.tokens, result)
}
