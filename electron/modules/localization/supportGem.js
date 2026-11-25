import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { stripFixedValueAnnotation } from '../../../shared/itemModifierText.js'
import { statNumber } from './statVariants.js'
import { isTradeStatId, resolveCatalogStat } from '../priceCheck/catalog.js'

const require = createRequire(import.meta.url)
let simplifyConverter = null
const simplify = value => {
  if (!simplifyConverter) simplifyConverter = require('opencc-js').Converter({ from: 'tw', to: 'cn' })
  return simplifyConverter(value)
}
const clean = value => String(value || '').replace(/\\r\\n|\\n/g, '\n').replace(/[\u200b-\u200d\ufeff]/gu, '')
  .split(/\r?\n/).map(line => line.replace(/\s+/g, ' ').trim()).join('\n').trim()
const compact = value => clean(value).replace(/\s+/g, ' ').trim()
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const tableName = value => String(value).replace(/^.*[/\\]/, '').replace(/\.datc?64$/i, '').toLowerCase()
const verified = entry => typeof entry?.en === 'string' && entry.sourceHash === createHash('sha256').update(entry.en).digest('hex')
const unusedSkill = value => /^\[(?:DNT|DO NOT USE|UNUSED)\]|(?:\(NOT CURRENTLY USED\)|\[DNT\]|\[UNUSED\])$/i.test(value)

function nameTableForEntry(entry) {
  if (entry.kind !== 'dat' || !entry.en || /[{}\r\n]/.test(entry.en)) return null
  const table = tableName(entry.table)
  if ((entry.field === 'SupportName' && table === 'grantedeffects') ||
      (entry.field === 'Name' && table === 'baseitemtypes' && /^Metadata\/Items\/Gems\/SupportGem/.test(entry.id))) {
    return / Support$/.test(entry.en) ? 'support' : null
  }
  if (entry.field === 'DisplayedName' && table === 'activeskills' && !unusedSkill(entry.en)) return 'skill'
  if (entry.field === 'Name' && table === 'passiveskills' && !unusedSkill(entry.en)) return 'passive'
  if (entry.field === 'CitadelName' && table === 'atlasexiles') return 'citadel'
  if (entry.field === 'Name' && table === 'elderguardians') return 'elderGuardian'
  if (entry.field === 'Name' && table === 'miniondoublingstattypes') return 'minionDoubling'
  if (entry.field === 'Text' && table === 'clientstrings' && /^JewelRadius(?:Small|Medium|Large|VeryLarge|Massive)$/.test(entry.id)) return 'ringRadius'
  return null
}

function templateKeys(entry) {
  if (entry.kind === 'dat' && tableName(entry.table) === 'clientstrings' && entry.field === 'Text') {
    if (entry.id === 'ModGrantsSupportEffectWithLevel' && entry.en === 'Socketed Gems are Supported by Level {1} {0}') {
      return { kind: 'support-level', table: 'support', level: 1, name: 0, extra: ['镶嵌的宝石被 {1} 级 {0} 辅助'] }
    }
    if (entry.id === 'ItemDisplayBuiltInSupport' && entry.en === 'Supported by Level 1 {0}') {
      return { kind: 'built-in-support', table: 'support', name: 0, extra: ['被等级 1 的{0}辅助', '被等級1的{0}輔助'] }
    }
    if (entry.id === 'ModGrantsEffectWithLevel' && entry.en === 'Grants Level {1} {0}') {
      return { kind: 'skill-level', table: 'skill', level: 1, name: 0, prefix: 'Grants Level', extra: ['赋予 {1} 级 {0}', '賦予等級 {1} 的 {0}'] }
    }
    if (entry.id === 'ModGrantsEffect' && entry.en === 'Grants {0}') {
      return { kind: 'single', table: 'skill', name: 0, render: name => `Grants ${name}`, extra: ['赋予 {0}', '賦予 {0}'] }
    }
    if (entry.id === 'BrequelGraftSkillString' && entry.en === 'Uses level {1} {0}') {
      return { kind: 'skill-level', table: 'skill', level: 1, name: 0, prefix: 'Uses level', extra: ['使用等级 {1} 的 {0}', '使用等級 {1} 的 {0}'] }
    }
    return null
  }
  if (entry.kind !== 'stat' || !/^metadata[/\\]statdescriptions[/\\]/i.test(entry.table)) return null
  const index = String(entry.field).match(/^variant:(\d+)$/)?.[1]
  const variant = entry.stats?.variants?.[Number(index)]
  if (index === undefined || !variant) return null
  const condition = compact(variant.condition)
  const handlers = compact(variant.handlers)
  if (entry.en === 'Socketed Gems are Supported by Level {0} {1}' && entry.stats?.ids?.length === 2 &&
      /^local_random_support_gem_level(?:_\d+)?$/.test(entry.stats.ids[0]) &&
      /^local_random_support_gem_index(?:_\d+)?$/.test(entry.stats.ids[1]) &&
      condition === '# #' && handlers === 'display_indexable_support 2 1') {
    return { kind: 'support-level', table: 'support', level: 0, name: 1 }
  }
  if (/^[+-]\{0\} to Level of all \{1\} Gems$/.test(entry.en) && entry.stats?.ids?.length === 2 &&
      entry.stats.ids[0] === 'random_skill_gem_level_+_level' &&
      entry.stats.ids[1] === 'random_skill_gem_level_+_index' &&
      /^display_indexable_skill 2 [01]$/.test(handlers)) {
    return { kind: 'all-skill-gems-level', table: 'skill', level: 0, name: 1, sign: entry.en[0] }
  }
  if (condition === '#' && /^passive_hash 1\b/.test(handlers)) {
    if (entry.en === 'Allocates {0}') return { kind: 'single', table: 'passive', name: 0, render: name => `Allocates ${name}` }
    if (entry.en === 'Allocates {0} if you have the matching modifier on Forbidden Flesh') {
      return { kind: 'single', table: 'passive', name: 0, render: name => `Allocates ${name} if you have the matching modifier on Forbidden Flesh` }
    }
    if (entry.en === 'Allocates {0} if you have the matching modifier on Forbidden Flame') {
      return { kind: 'single', table: 'passive', name: 0, render: name => `Allocates ${name} if you have the matching modifier on Forbidden Flame` }
    }
    if (entry.en === '1 added passive skill is {0}') {
      return { kind: 'single', table: 'passive', name: 0, render: name => `1 added passive skill is ${name}` }
    }
    if (entry.id === 'local_unique_jewel_disconnected_passives_can_be_allocated_around_keystone_hash') {
      return { kind: 'single', table: 'passive', name: 0, render: name => `Passive Skills in Radius of ${name} can be Allocated\nwithout being connected to your tree\nPassage` }
    }
  }
  if (entry.id === 'map_contains_citadel' && entry.en === 'Map contains {0}' && handlers === 'atlas_exile_citadel_index 1') {
    return { kind: 'single', table: 'citadel', name: 0, render: name => `Map contains ${name}` }
  }
  if (entry.id === 'map_elder_boss_variation' && entry.en === 'Map is occupied by {0}' && handlers === 'elder_guardian_index 1') {
    return { kind: 'single', table: 'elderGuardian', name: 0, render: name => `Map is occupied by ${name}`, extra: ['Map is occupied by {0}'] }
  }
  if (entry.id === 'local_jewel_variable_ring_radius_value' && entry.en === 'Only affects Passives in {0} Ring' && /^passive_jewel_radius 1\b/.test(handlers)) {
    return { kind: 'single', table: 'ringRadius', name: 0, render: name => `Only affects Passives in ${name} Ring`, extra: ['Only affects Passives in {0} Ring', '只影响{0}环内的天赋', '僅影響{0}環內的天賦'] }
  }
  if (entry.id === 'maximum_number_of_X_minion_type_doubled' && /^minion_doubling_type 1\b/.test(handlers)) {
    return { kind: 'single', table: 'minionDoubling', name: 0, render: name => `Maximum number of ${name} is Doubled\nCannot have Minions other than ${name}`, extra: ['Maximum number of {0} is Doubled\nCannot have Minions other than {0}'] }
  }
  return null
}

function expression(value, keys) {
  const text = clean(value).replace(/\{\}/g, '{0}')
  if (keys.level !== undefined) {
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
  const tokens = [...text.matchAll(/\{(0)\}/g)]
  if (!tokens.length) return null
  let cursor = 0
  let result = ''
  tokens.forEach((token, index) => {
    result += escape(text.slice(cursor, token.index))
    result += index === 0 ? '(?<name>.+?)' : '\\k<name>'
    cursor = token.index + token[0].length
  })
  result += escape(text.slice(cursor))
  return /[{}]/.test(text.replace(/\{0\}/g, '')) ? null : new RegExp(`^${result}$`, 'u')
}

/** Expand only verified support/skill/passive templates; the active trade catalog decides the English spelling. */
export function createSupportGemResolver(entries = []) {
  const trusted = entries.filter(entry => entry && (nameTableForEntry(entry) || templateKeys(entry)) && verified(entry))
  const nameTables = new Map(['support', 'skill', 'passive', 'citadel', 'elderGuardian', 'minionDoubling', 'ringRadius'].map(key => [key, new Map()]))
  for (const entry of trusted) {
    const table = nameTableForEntry(entry)
    if (!table) continue
    const map = nameTables.get(table)
    for (const value of [entry.en, entry.cn, entry.tw, entry.tw && simplify(entry.tw)].filter(Boolean)) {
      const alias = compact(value)
      if (!map.has(alias)) map.set(alias, new Set())
      map.get(alias).add(entry.en)
    }
  }
  const templates = []
  const seen = new Set()
  for (const entry of trusted) {
    const keys = templateKeys(entry)
    if (!keys) continue
    for (const value of [entry.cn, entry.tw, entry.tw && simplify(entry.tw), ...(keys.extra || [])].filter(Boolean)) {
      const pattern = expression(value, keys)
      const dedupeKey = `${keys.kind}:${keys.sign || ''}:${keys.prefix || ''}:${pattern?.source || ''}`
      if (pattern && !seen.has(dedupeKey)) { templates.push({ pattern, keys }); seen.add(dedupeKey) }
    }
  }
  return {
    resolve(value, { catalog = null, type = 'explicit' } = {}) {
      if (!catalog) return null
      const text = clean(stripFixedValueAnnotation(value))
      const candidates = new Set()
      for (const { pattern, keys } of templates) {
        const match = text.match(pattern)
        if (!match) continue
        const englishNames = nameTables.get(keys.table)?.get(compact(match.groups.name))
        if (!englishNames?.size) continue
        if (keys.kind === 'support-level') {
          if (englishNames.size !== 1 || !Number.isSafeInteger(statNumber(match.groups.level)) || statNumber(match.groups.level) <= 0) continue
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
          continue
        }
        if (keys.kind === 'built-in-support') {
          if (englishNames.size !== 1) continue
          const name = englishNames.values().next().value
          const checkType = catalog.stats?.some(row => row.ids?.[type]) ? type : 'imbued'
          for (const spelling of [name, name.replace(/ Support$/, '')]) {
            const candidate = `Supported by Level 1 ${spelling}`
            if (!catalog.stats?.some(row => (row.ids?.[type] || row.ids?.imbued) && row.matchers?.includes(candidate))) continue
            const resolved = resolveCatalogStat(catalog, candidate, checkType).match
            if (resolved && isTradeStatId(resolved.id, checkType)) candidates.add(candidate)
            break
          }
          continue
        }
        if (keys.kind === 'skill-level' || keys.kind === 'all-skill-gems-level') {
          const level = statNumber(match.groups.level)
          if (englishNames.size !== 1 || !Number.isSafeInteger(level) || level <= 0) continue
          const name = englishNames.values().next().value
          const formattedLevel = match.groups.level.replaceAll('（', '(').replaceAll('）', ')')
          const matcher = keys.kind === 'skill-level' ? `${keys.prefix} # ${name}` : `+# to Level of all ${name} Gems`
          const lookup = keys.kind === 'skill-level' ? `${keys.prefix} ${level} ${name}` : `${keys.sign}${level} to Level of all ${name} Gems`
          const rendered = keys.kind === 'skill-level' ? `${keys.prefix} ${formattedLevel} ${name}` : `${keys.sign}${formattedLevel} to Level of all ${name} Gems`
          if (!catalog.stats?.some(row => row.ids?.[type] && row.matchers?.includes(matcher))) continue
          const resolved = resolveCatalogStat(catalog, lookup, type).match
          if (resolved && isTradeStatId(resolved.id, type)) candidates.add(rendered)
          continue
        }
        if (keys.kind === 'single') {
          for (const name of englishNames) {
            const rendered = keys.render(name)
            const lookup = compact(rendered)
            if (!catalog.stats?.some(row => row.ids?.[type] && row.matchers?.includes(lookup))) continue
            const resolved = resolveCatalogStat(catalog, lookup, type).match
            if (resolved && isTradeStatId(resolved.id, type)) candidates.add(rendered)
          }
        }
      }
      return candidates.size === 1 ? candidates.values().next().value : null
    }
  }
}
