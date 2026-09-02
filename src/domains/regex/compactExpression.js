const HAN_CHARACTER = /^\p{Script=Han}$/u

export function escapeRegexText(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function expressionMatches(expression, value) {
  try {
    return new RegExp(expression, 'u').test(String(value || ''))
  } catch {
    return false
  }
}

export function hasMinimumHanFragment(expression, minimum = 2) {
  let run = 0
  for (const character of Array.from(String(expression || ''))) {
    run = HAN_CHARACTER.test(character) ? run + 1 : 0
    if (run >= minimum) return true
  }
  return false
}

function hanFragments(source, minimum) {
  const characters = Array.from(String(source || ''))
  const fragments = []
  const seen = new Set()
  for (let length = minimum; length <= characters.length; length += 1) {
    for (let start = 0; start + length <= characters.length; start += 1) {
      const slice = characters.slice(start, start + length)
      if (!slice.every(character => HAN_CHARACTER.test(character))) continue
      const text = slice.join('')
      if (seen.has(text)) continue
      seen.add(text)
      fragments.push({ text, start, end: start + length })
    }
  }
  return fragments
}

function isSafe(expression, positives, negatives) {
  return positives.length > 0
    && positives.every(value => expressionMatches(expression, value))
    && negatives.every(value => !expressionMatches(expression, value))
}

function withRequiredPattern(expression, requiredPattern) {
  return requiredPattern ? `${expression}.*${requiredPattern}` : expression
}

export function shortestSafeExpression({
  source,
  positives,
  negatives,
  fallbackExpression,
  requiredPattern = '',
  minimumHanLength = 2
}) {
  const positiveValues = [...new Set((positives || []).map(String).filter(Boolean))]
  const negativeValues = [...new Set((negatives || []).map(String).filter(Boolean))]
  const fragments = hanFragments(source, minimumHanLength)

  for (const fragment of fragments) {
    const expression = withRequiredPattern(escapeRegexText(fragment.text), requiredPattern)
    if (isSafe(expression, positiveValues, negativeValues)) return expression
  }

  for (const fragment of fragments) {
    for (const expression of [
      withRequiredPattern(`^${escapeRegexText(fragment.text)}`, requiredPattern),
      withRequiredPattern(`${escapeRegexText(fragment.text)}$`, requiredPattern)
    ]) {
      if (isSafe(expression, positiveValues, negativeValues)) return expression
    }
  }

  let shortestPair = ''
  for (const first of fragments) {
    for (const second of fragments) {
      if (first.end > second.start) continue
      const expression = withRequiredPattern(
        `${escapeRegexText(first.text)}.*${escapeRegexText(second.text)}`,
        requiredPattern
      )
      if (!isSafe(expression, positiveValues, negativeValues)) continue
      if (!shortestPair || expression.length < shortestPair.length) shortestPair = expression
    }
  }

  const fallback = String(fallbackExpression || escapeRegexText(source))
  return shortestPair && shortestPair.length < fallback.length ? shortestPair : fallback
}

export function compileCompactExpressions(entries, options = {}) {
  const list = Array.isArray(entries) ? entries : []
  const variantsById = new Map(list.map(entry => [entry.id, entry.variants || []]))
  return new Map(list.map(entry => {
    const positiveIds = new Set([entry.id, ...(entry.matchIds || [])])
    const positives = [...positiveIds].flatMap(id => variantsById.get(id) || [])
    const negatives = list.filter(candidate => !positiveIds.has(candidate.id)).flatMap(candidate => candidate.variants || [])
    return [entry.id, shortestSafeExpression({
      source: entry.source,
      positives,
      negatives,
      fallbackExpression: entry.fallbackExpression,
      requiredPattern: entry.requiredPattern,
      minimumHanLength: options.minimumHanLength || 2
    })]
  }))
}
