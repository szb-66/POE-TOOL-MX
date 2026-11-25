const parameters = /\{(\d+)(?::([^}]+))?\}|#/g
const singularize = value => value.replace(/\b([A-Za-z]{2,})s\b/g, '$1')

export function statNumber(value) {
  const text = String(value).replaceAll('（', '(').replaceAll('）', ')')
  const match = text.match(/^([+-]?\d+(?:\.\d+)?)(?:\(([+-]?\d+(?:\.\d+)?)[—–-]([+-]?\d+(?:\.\d+)?)\))?$/)
  if (!match || !Number.isFinite(Number(match[1]))) return null
  const number = Number(match[1])
  if (match[2] !== undefined) {
    // Detailed tooltips print the unmodified base tier range in parentheses;
    // mirrored/reflected, catalyzed, enchanted, and legacy rolls can legitimately sit outside it.
    const bounds = [Number(match[2]), Number(match[3])]
    if (!bounds.every(Number.isFinite)) return null
  }
  return number
}

function metadata(entry) {
  if (entry?.kind !== 'stat' || !Array.isArray(entry.stats?.ids) || !Array.isArray(entry.stats?.variants)) return null
  const field = String(entry.field).match(/^variant:(\d+)$/)
  if (!field || !entry.stats.variants[Number(field[1])]) return null
  return { index: Number(field[1]), ...entry.stats }
}

function conditionTokens(condition, count) {
  const tokens = String(condition).trim().split(/\s+/)
  const supported = token => /^(?:#|!?-?\d+(?:\.\d+)?)$/.test(token) || /^(?:#|-?\d+(?:\.\d+)?)\|(?:#|-?\d+(?:\.\d+)?)$/.test(token)
  return tokens.length === count && tokens.every(supported) ? tokens : null
}

function matches(token, value) {
  if (token === '#') return true
  if (value === undefined) return null
  if (token.startsWith('!')) return value !== Number(token.slice(1))
  const range = token.split('|')
  if (range.length === 1) return value === Number(token)
  return (range[0] === '#' || value >= Number(range[0])) && (range[1] === '#' || value <= Number(range[1]))
}

function evaluate(tokens, values) {
  if (!tokens) return null
  const result = tokens.map((token, index) => matches(token, values.get(index)))
  return result.includes(false) ? false : result.includes(null) ? null : true
}

function rawNumbers(captured, handlers) {
  const result = new Map()
  for (const [key, text] of captured) {
    const number = statNumber(text)
    if (number === null) return null
    result.set(Number(key), number)
  }
  const tokens = String(handlers || '').split(/\s+/).filter(Boolean)
  const transforms = []
  for (let index = 0; index < tokens.length; index++) {
    const handler = tokens[index]
    if (handler === 'reminderstring') { index++; continue }
    if (['canonical_line', 'markup'].includes(handler)) continue
    const position = Number(tokens[++index]) - 1
    if (!Number.isInteger(position) || position < 0) return null
    let factor
    if (handler === 'negate') factor = -1
    else if (handler === 'double') factor = 0.5
    else if (handler === 'negate_and_double') factor = -0.5
    else if (/^divide_by_one_hundred(?:_|$)/.test(handler)) factor = 100
    else if (/^divide_by_ten(?:_|$)/.test(handler)) factor = 10
    else if (/^milliseconds_to_seconds(?:_|$)/.test(handler)) factor = 1000
    else if (handler === 'per_minute_to_per_second') factor = 60
    else if (handler === 'locations_to_metres') factor = 10
    else return null
    transforms.push({ position, factor })
  }
  for (const { position, factor } of transforms.reverse()) if (result.has(position)) result.set(position, result.get(position) * factor)
  return result
}

// null preserves uncertainty for metadata needing undisplayed state or unknown handlers.
export function statVariantApplies(entry, captured = new Map()) {
  const info = metadata(entry)
  if (!info) return true
  const own = conditionTokens(info.variants[info.index].condition, info.ids.length)
  if (!own) return null
  const values = rawNumbers(captured, info.variants[info.index].handlers)
  if (!values) return null
  // Constant, undisplayed switches are implied by this variant's literal text.
  own.forEach((token, index) => {
    if (!values.has(index) && /^-?\d+(?:\.\d+)?$/.test(token)) values.set(index, Number(token))
  })
  const applicable = evaluate(own, values)
  if (applicable !== true) return applicable
  for (const previous of info.variants.slice(0, info.index)) {
    const selected = evaluate(conditionTokens(previous.condition, info.ids.length), values)
    if (selected === true) return false
    if (selected === null) return null
  }
  return true
}

export function sameStatPluralFamily(left, right) {
  const a = metadata(left), b = metadata(right)
  if (!a || !b || left.table !== right.table || left.id !== right.id || a.variants[a.index].handlers !== b.variants[b.index].handlers) return false
  const keys = value => [...String(value).matchAll(parameters)].map((match, index) => `${match[1] ?? index}:${match[2] || ''}`).join(',')
  if (keys(left.en) !== keys(right.en)) return false
  const stem = value => singularize(String(value).replace(parameters, '#'))
  return stem(left.en) === stem(right.en)
}

// A literal trade filter can represent the same game stat without exposing its amount.
export function sameStatPresenceFamily(source, literal, amount) {
  const a = metadata(source), b = metadata(literal)
  if (!a || !b || source.fragmentOf || literal.fragmentOf || source.table !== literal.table || source.id !== literal.id ||
      a.ids.length !== 1 || b.ids.length !== 1 || a.ids[0] !== b.ids[0] || !(amount > 0)) return false
  const from = a.variants[a.index]
  const to = b.variants[b.index]
  if (from.placeholders?.length !== 1 || from.placeholders[0] !== '{0}' || to.placeholders?.length !== 0 ||
      /[{}#]/.test(literal.en)) return false

  const wording = singularize(source.en)
  const target = singularize(literal.en)
  if (to.condition === '1000' && from.handlers === 'milliseconds_to_seconds 1' && !to.handlers) {
    return /\b(?:every|each) \{0\} second\b/.test(wording) && wording.replace('{0} ', '') === target
  }
  if (to.condition !== '1' || !Number.isInteger(amount) ||
      !/^(?:reminderstring \S+)?$/.test(from.handlers) || from.handlers !== to.handlers) return false
  return ['a', 'an', '1'].some(one => wording.replace('{0}', one) === target)
}

// The clipboard guarantees the effect. The trade filter can express that threshold as min 100.
export function sameGuaranteedChanceFamily(literal, numeric) {
  const a = metadata(literal), b = metadata(numeric)
  if (!a || !b || literal.fragmentOf || numeric.fragmentOf || literal.table !== numeric.table || literal.id !== numeric.id ||
      a.ids.length !== 1 || b.ids.length !== 1 || a.ids[0] !== b.ids[0]) return false
  const source = a.variants[a.index]
  const target = b.variants[b.index]
  if (source.condition !== '100|#' || target.condition !== '1|99' || source.handlers || target.handlers ||
      source.placeholders?.length !== 0 || target.placeholders?.length !== 2 ||
      !target.placeholders.includes('%') || !target.placeholders.includes('{0}')) return false
  const wording = numeric.en.match(/^(.+) have \{0\}% chance to (.+)$/)
  return Boolean(wording && `${wording[1]} ${wording[2]}` === literal.en)
}
