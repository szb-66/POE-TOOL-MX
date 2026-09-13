import { DATA } from 'cn-poe-utils/data/poe'

const singleLine = text => text.replace(/\s+/gu, ' ').trim()
const skeleton = text => text.replace(/[{}\d.+-]/gu, '')

// Upstream's generic template parser accepts empty/non-numeric stat parameters.
// Validate those captures before rendering so missing values cannot silently become
// an empty string, and distinct numeric values cannot collapse into one capture.
export function guardStatTemplates(basic) {
  const original = basic.doTransMod.bind(basic)
  const patterns = new WeakMap()
  basic.doTransMod = (stat, text) => {
    let pattern = patterns.get(stat)
    if (!pattern) {
      const parts = stat.zh.split(/(\{\d+\})/)
      const seen = new Set()
      pattern = new RegExp('^' + parts.map(part => {
        const match = part.match(/^\{(\d+)\}$/)
        if (!match) return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const id = match[1]
        if (seen.has(id)) return `\\k<p${id}>`
        seen.add(id)
        return `(?<p${id}>${stat.refs?.[id] ? '.+?' : '[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)'})`
      }).join('') + '$', 'u')
      patterns.set(stat, pattern)
    }
    if (!pattern.test(text)) return undefined
    const result = original(stat, text)
    // A partly translated reference is not a valid English modifier. Returning
    // no match makes the JSON translator preserve the complete original text.
    return stat.refs && /\p{Script=Han}/u.test(result || '') ? undefined : result
  }
  // Official item descriptions may flatten line breaks or retain a different
  // amount of whitespace. Match the complete source template before a trade
  // alias which sometimes translates only its first line.
  const multiline = new Map()
  for (const stat of DATA.stats) {
    if (!stat.zh.includes('\n') || !stat.en.includes('\n')) continue
    const normalized = { ...stat, zh: singleLine(stat.zh) }
    const key = skeleton(normalized.zh)
    if (!multiline.has(key)) multiline.set(key, [])
    multiline.get(key).push(normalized)
  }
  const transMod = basic.transMod.bind(basic)
  basic.transMod = text => {
    const normalized = singleLine(text)
    const candidates = multiline.get(skeleton(normalized))
    if (candidates) {
      const matches = new Map()
      for (const stat of candidates) {
        const result = basic.doTransMod(stat, normalized)
        if (result) matches.set(singleLine(result), result)
      }
      if (matches.size === 1) return [...matches.values()][0]
      if (matches.size > 1) return undefined
    }
    return transMod(text)
  }
  return basic
}
