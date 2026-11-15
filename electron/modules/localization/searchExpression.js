import { escapeRegexText, shortestSafeExpression, shortestEnglishExpression } from '../../../shared/compactExpression.js'
import { readFileSync } from 'node:fs'

const tokens = /\{(\d+)(?::([^}]+))?\}|#/g
const han = /[\u3400-\u9fff]/u
const caches = new WeakMap()
const keys = text => {
  let sequential = 0
  return [...new Set([...String(text).matchAll(tokens)].map(match => match[1] ?? String(sequential++)))].sort().join(',')
}
const shape = text => String(text).replace(tokens, '#').replace(/\(?[+\-]?\d+(?:\.\d+)?\s*[—–-]\s*[+\-]?\d+(?:\.\d+)?\)?/g, '#')
  .replace(/[+\-]?\d+(?:\.\d+)?/g, '#').replace(/[+\-]#/g, '#').replace(/\s+/g, ' ').trim().toLowerCase()
let itemPatterns
function itemStatPatterns() {
  if (itemPatterns) return itemPatterns
  // Merchant searches operate on the international equipment catalogue, not monster/skill/map descriptions.
  const dataset = JSON.parse(readFileSync(new URL('../../assets/crafting-data-international/dataset.json', import.meta.url), 'utf8'))
  const texts = dataset.modifierFamilies.flatMap(family => family.entries.flatMap(entry => [entry.effectKey, ...entry.tiers.map(tier => tier.text)]))
  for (const family of [...dataset.eldritchImplicitFamilies, ...dataset.corruptedImplicitFamilies]) texts.push(family.effectKey, ...family.tiers.map(tier => tier.text))
  itemPatterns = new Set(texts.filter(Boolean).map(shape))
  return itemPatterns
}

function render(text, values = new Map(), sample = '987654') {
  let sequential = 0
  return text.replace(tokens, (token, key, format) => {
    const value = values.get(token === '#' ? String(sequential++) : key) ?? sample
    return format?.includes('+') && !/^[+-]/.test(value) ? `+${value}` : value
  })
}

function fixedSpans(text, values) {
  const spans = []
  let cursor = 0
  let outputLength = 0
  let sequential = 0
  for (const match of text.matchAll(tokens)) {
    outputLength += match.index - cursor
    const key = match[0] === '#' ? String(sequential++) : match[1]
    const value = values.get(key) ?? '987654'
    const length = value.length + (match[2]?.includes('+') ? 1 : 0)
    if (values.has(key)) spans.push({ start: outputLength, end: outputLength + length })
    outputLength += length
    cursor = match.index + match[0].length
  }
  return spans
}

// Only parameters actually covered by the English condition become fixed numbers.
function conditionValues(en, query) {
  const numbers = query.match(/\d+(?:\.\d+)?/g) || []
  if (!numbers.length) return en.toLowerCase().includes(query.toLowerCase()) ? new Map() : null
  const unique = [...new Set(numbers)]
  // Vendor conditions currently contain a single fixed quantity. Refuse unsupported shapes.
  if (unique.length !== 1) return null
  const sample = render(en, new Map(), unique[0])
  const at = sample.toLowerCase().indexOf(query.toLowerCase())
  if (at < 0 || (at > 0 && /\d/.test(sample[at - 1]) && /^\d/.test(query))) return null
  const values = new Map()
  let sequential = 0
  let cursor = 0
  let renderedCursor = 0
  for (const match of en.matchAll(tokens)) {
    renderedCursor += match.index - cursor
    const key = match[0] === '#' ? String(sequential++) : match[1]
    const value = match[2]?.includes('+') ? `+${unique[0]}` : unique[0]
    if (renderedCursor < at + query.length && renderedCursor + value.length > at) values.set(key, unique[0])
    renderedCursor += value.length
    cursor = match.index + match[0].length
  }
  return values
}

function aliasExpression(alias, fixed) {
  let sequential = 0
  const parts = []
  let cursor = 0
  for (const match of alias.matchAll(tokens)) {
    parts.push(escapeRegexText(alias.slice(cursor, match.index)).replaceAll('\n', '\\n'))
    const key = match[0] === '#' ? String(sequential++) : match[1]
    const value = fixed.get(key)
    parts.push(value == null ? '[+\\-]?\\d+(?:\\.\\d+)?' : `${match.index === 0 && !match[2]?.includes('+') ? '(^|[^0-9])' : ''}${match[2]?.includes('+') ? '\\+' : ''}${escapeRegexText(value)}(?![0-9])`)
    cursor = match.index + match[0].length
  }
  parts.push(escapeRegexText(alias.slice(cursor)).replaceAll('\n', '\\n'))
  return parts.join('')
}

function compactFragment(source, negativeText) {
  const candidates = new Set()
  for (const word of source.match(/[\u3400-\u9fff]+/gu) || []) {
    for (let length = 2; length <= Math.min(word.length, 24); length++) {
      for (let start = 0; start + length <= word.length; start++) candidates.add(word.slice(start, start + length))
    }
  }
  return [...candidates].sort((a, b) => a.length - b.length || a.localeCompare(b, 'en')).find(value => !negativeText.includes(value))
}

function compactFixed(item, negatives) {
  const { source, spans } = item
  if (!spans.length) return null
  const startLimit = Math.min(...spans.map(span => span.start))
  const endLimit = Math.max(...spans.map(span => span.end))
  const candidates = []
  for (let start = 0; start <= startLimit; start++) for (let end = endLimit; end <= source.length; end++) {
    const text = source.slice(start, end)
    if (!/[\u3400-\u9fff]{2}/u.test(text) || text.includes('987654')) continue
    const expression = `${/^\d/.test(text) ? '(^|[^0-9.])' : ''}${escapeRegexText(text)}${/\d$/.test(text) ? '(?![0-9.])' : ''}`
    candidates.push(expression)
  }
  return candidates.sort((a, b) => a.length - b.length).find(expression => {
    const regex = new RegExp(expression, 'iu')
    return regex.test(source) && negatives.every(value => !regex.test(value))
  })
}

function exactExpression(aliases) {
  const fields = aliases.map(alias => alias.match(/^([^:：]+)[:：]\s*(.*)$/u))
  if (fields.length && fields.every(Boolean)) {
    const labels = [...new Set(fields.map(field => escapeRegexText(field[1])))].join('|')
    const values = [...new Set(fields.map(field => escapeRegexText(field[2])))].join('|')
    return `(?:${labels})[:：] ?(?:${values})`
  }
  return aliases.map(alias => aliasExpression(alias, new Map())).join('|')
}

/** Compile against all trusted stat translations, including negatives, rather than OR-ing thousands of full lines. */
export function localizedSearchExpression(dictionary, query) {
  if (!dictionary) return { expression: '', mapped: false, complete: false }
  let cache = caches.get(dictionary)
  if (!cache) {
    cache = { corpus: [...dictionary.searchTemplates().filter(row => itemStatPatterns().has(shape(row.en))), ...dictionary.searchEquipmentNotes()], results: new Map() }
    caches.set(dictionary, cache)
  }
  if (cache.results.has(query)) return cache.results.get(query)
  const positive = []
  const negative = []
  let incompatible = false
  const fixedQuery = /\d/.test(query)
  for (const row of cache.corpus) {
    const fixed = conditionValues(row.en, query)
    for (const alias of row.aliases) {
      if (!han.test(alias)) continue
      if (keys(alias) !== keys(row.en)) { if (fixed) incompatible = true; continue }
      if (fixed) {
        positive.push({ source: render(alias, fixed), spans: fixedSpans(alias, fixed), expression: aliasExpression(alias, fixed) })
        // A fixed-value condition must reject the same stat with a different value.
        for (const [key, value] of fixed) {
          for (const other of [String(Number(value) + 1), `1${value}`]) negative.push(render(alias, new Map([...fixed, [key, other]])))
        }
      } else {
        negative.push(render(alias))
        if (fixedQuery) negative.push(render(alias, new Map(), query.match(/\d+(?:\.\d+)?/)[0]))
      }
    }
  }
  // Headers and exact names use the same trusted dictionary, without stat expansion.
  if (!positive.length) {
    const aliases = dictionary.aliasesFor(query).filter(value => han.test(value))
    const result = { expression: exactExpression(aliases), mapped: aliases.length > 0, complete: !incompatible }
    cache.results.set(query, result)
    return result
  }
  const negativeText = negative.join('\n')
  let remaining = [...new Map(positive.map(item => [item.source, item])).values()].sort((a, b) => a.source.length - b.source.length)
  const expressions = new Set()
  while (remaining.length && !incompatible) {
    const item = remaining[0]
    const fragments = [...item.source].slice(1).map((_, index) => item.source.slice(index, index + 2)).filter(value => /^[\u3400-\u9fff]{2}$/u.test(value))
    const relevantNegatives = negative.filter(value => fragments.some(fragment => value.includes(fragment)))
    let candidate = (fixedQuery ? compactFixed(item, negative) : compactFragment(item.source, negativeText)) || (fixedQuery ? `^${item.expression}$` : shortestSafeExpression({ source: item.source, positives: [item.source], negatives: relevantNegatives, fallbackExpression: `^${item.expression}$` }))
    // Clipboard modifier states can follow a displayed stat (for example "(crafted)").
    // Revalidate the relaxed boundary against negatives before accepting it.
    if (candidate.endsWith('$')) candidate = candidate.slice(0, -1) + '(?:[ （(]|$)'
    const regex = new RegExp(candidate, 'iu')
    if (!regex.test(item.source) || negative.some(value => regex.test(value))) { incompatible = true; break }
    expressions.add(candidate)
    remaining = remaining.filter(value => !regex.test(value.source))
  }
  const result = { expression: [...expressions].join('|'), mapped: positive.length > 0, complete: !incompatible && !remaining.length }
  if (!fixedQuery && result.complete) {
    const positives = cache.corpus.filter(row => conditionValues(row.en, query)).map(row => row.en)
    const negatives = cache.corpus.filter(row => !conditionValues(row.en, query)).map(row => row.en)
    result.englishExpression = shortestEnglishExpression(query, positives, negatives, escapeRegexText(query))
  }
  cache.results.set(query, result)
  return result
}
