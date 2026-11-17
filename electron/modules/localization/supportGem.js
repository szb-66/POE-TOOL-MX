import { createHash } from 'node:crypto'
import * as OpenCC from 'opencc-js'
import { stripFixedValueAnnotation } from '../../../shared/itemModifierText.js'
import { statNumber } from './statVariants.js'
import { isTradeStatId, resolveCatalogStat } from '../priceCheck/catalog.js'

const simplify = OpenCC.Converter({ from: 'tw', to: 'cn' })
const compact = value => String(value || '').replace(/[\u200b-\u200d\ufeff]/gu, '').replace(/\s+/g, ' ').trim()
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const tableName = value => String(value).replace(/^.*[/\\]/, '').replace(/\.datc?64$/i, '').toLowerCase()
const verified = entry => typeof entry?.en === 'string' && entry.sourceHash === createHash('sha256').update(entry.en).digest('hex')

function supportNameEntry(entry) {
  return entry.kind === 'dat' && ((entry.field === 'SupportName' && tableName(entry.table) === 'grantedeffects') ||
    (entry.field === 'Name' && tableName(entry.table) === 'baseitemtypes' && /^Metadata\/Items\/Gems\/SupportGem/.test(entry.id)))
}

function templateKeys(entry) {
  if (entry.kind === 'dat' && tableName(entry.table) === 'clientstrings' && entry.field === 'Text' && entry.id === 'ModGrantsSupportEffectWithLevel' &&
      entry.en === 'Socketed Gems are Supported by Level {1} {0}') return { level: 1, name: 0 }
  if (entry.kind !== 'stat' || !/^metadata[/\\]statdescriptions[/\\]/i.test(entry.table) ||
      entry.en !== 'Socketed Gems are Supported by Level {0} {1}') return null
  const index = String(entry.field).match(/^variant:(\d+)$/)?.[1]
  const variant = entry.stats?.variants?.[Number(index)]
  return index !== undefined && entry.stats?.ids?.length === 2 &&
    /^local_random_support_gem_level(?:_\d+)?$/.test(entry.stats.ids[0]) &&
    /^local_random_support_gem_index(?:_\d+)?$/.test(entry.stats.ids[1]) &&
    compact(variant?.condition) === '# #' && compact(variant?.handlers) === 'display_indexable_support 2 1'
    ? { level: 0, name: 1 } : null
}

function expression(value, keys) {
  const text = compact(value)
  const tokens = [...text.matchAll(/\{([01])\}/g)]
  if (tokens.length !== 2 || new Set(tokens.map(match => match[1])).size !== 2) return null
  let cursor = 0
  let result = ''
  for (const token of tokens) {
    result += escape(text.slice(cursor, token.index))
    result += Number(token[1]) === keys.level ? '(?<level>\\d+(?:[（(]\\d+[-–—]\\d+[）)])?)' : '(?<name>.+?)'
    cursor = token.index + token[0].length
  }
  result += escape(text.slice(cursor))
  return /[{}]/.test(text.replace(/\{[01]\}/g, '')) ? null : new RegExp(`^${result}$`, 'u')
}

/** Expand only verified support-name templates; the active trade catalog decides the English spelling. */
export function createSupportGemResolver(entries = []) {
  const trusted = entries.filter(entry => entry && (supportNameEntry(entry) || templateKeys(entry)) && verified(entry))
  const names = new Map()
  for (const entry of trusted) {
    if (!supportNameEntry(entry) || !/ Support$/.test(entry.en) || /[{}\r\n]/.test(entry.en)) continue
    for (const value of [entry.en, entry.cn, entry.tw, entry.tw && simplify(entry.tw)].filter(Boolean)) {
      const alias = compact(value)
      if (!names.has(alias)) names.set(alias, new Set())
      names.get(alias).add(entry.en)
    }
  }
  const templates = []
  const seen = new Set()
  for (const entry of trusted) {
    const keys = templateKeys(entry)
    if (!keys) continue
    for (const value of [entry.cn, entry.tw, entry.tw && simplify(entry.tw)].filter(Boolean)) {
      const pattern = expression(value, keys)
      if (pattern && !seen.has(pattern.source)) { templates.push(pattern); seen.add(pattern.source) }
    }
  }
  return {
    resolve(value, { catalog = null, type = 'explicit' } = {}) {
      if (!catalog) return null
      const text = compact(stripFixedValueAnnotation(value))
      const candidates = new Set()
      for (const pattern of templates) {
        const match = text.match(pattern)
        if (!match || !Number.isSafeInteger(statNumber(match.groups.level)) || statNumber(match.groups.level) <= 0) continue
        const englishNames = names.get(compact(match.groups.name))
        if (!englishNames || englishNames.size !== 1) continue
        const name = englishNames.values().next().value
        for (const spelling of [name, name.replace(/ Support$/, '')]) {
          const matcher = `Socketed Gems are Supported by Level # ${spelling}`
          if (!catalog.stats?.some(row => row.ids?.[type] && row.matchers?.includes(matcher))) continue
          const candidate = `Socketed Gems are Supported by Level ${statNumber(match.groups.level)} ${spelling}`
          const resolved = resolveCatalogStat(catalog, candidate, type).match
          if (resolved && isTradeStatId(resolved.id, type) && !(resolved.queryVariants?.length > 1)) {
            candidates.add(`Socketed Gems are Supported by Level ${match.groups.level.replaceAll('（', '(').replaceAll('）', ')')} ${spelling}`)
          }
          // Prefer the source name; shortened spellings belong to older trade catalogs.
          break
        }
      }
      return candidates.size === 1 ? candidates.values().next().value : null
    }
  }
}
