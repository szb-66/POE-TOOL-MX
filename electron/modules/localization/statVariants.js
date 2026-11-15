const parameters = /\{(\d+)(?::([^}]+))?\}|#/g

export function statNumber(value) {
  const text = String(value).replaceAll('（', '(').replaceAll('）', ')')
  const match = text.match(/^([+-]?\d+(?:\.\d+)?)(?:\(([+-]?\d+(?:\.\d+)?)[—–-]([+-]?\d+(?:\.\d+)?)\))?$/)
  if (!match || !Number.isFinite(Number(match[1]))) return null
  const number = Number(match[1])
  if (match[2] !== undefined) {
    const bounds = [Number(match[2]), Number(match[3])]
    if (!bounds.every(Number.isFinite) || number < Math.min(...bounds) || number > Math.max(...bounds)) return null
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
  const stem = value => String(value).replace(parameters, '#').replace(/\b([A-Za-z]{2,})s\b/g, '$1')
  return stem(left.en) === stem(right.en)
}
