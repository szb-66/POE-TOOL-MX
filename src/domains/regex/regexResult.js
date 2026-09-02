export const REGEX_LENGTH_LIMIT = 250

export function finalizeRegex(tokens, counts = {}) {
  const regex = [...new Set((tokens || []).filter(Boolean))].join(' ')
  const overLimit = regex.length > REGEX_LENGTH_LIMIT
  return {
    regex,
    length: regex.length,
    overLimit,
    warnings: overLimit ? [`正则长度超过搜索框建议上限 ${REGEX_LENGTH_LIMIT} 字符`] : [],
    includeCount: Number(counts.includeCount) || 0,
    excludeCount: Number(counts.excludeCount) || 0
  }
}

export function quotedToken(expression, excluded = false) {
  const text = String(expression || '').replaceAll('"', '').trim()
  return text ? `"${excluded ? '!' : ''}${text}"` : ''
}
