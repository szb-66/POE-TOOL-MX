import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { resolveCatalogStat } from './catalog.js'

const require = createRequire(import.meta.url)
let simplifyConverter = null
const simplify = value => {
  if (!simplifyConverter) simplifyConverter = require('opencc-js').Converter({ from: 't', to: 'cn' })
  return simplifyConverter(value)
}
const normalize = value => simplify(String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim())
const localized = /[\u3400-\u9fff]/u
const warrant = 'mercenary_warrant'
const sourceTypes = {
  mercenarybuilds: { field: 'Name', type: 'build' },
  activeskills: { field: 'DisplayedName', type: 'skill' },
  mercenarysupports: { field: 'Name', type: 'support' }
}

const englishBuild = name => `Mercenary Warrant (${name})`
const chineseBuild = name => `佣兵凭证（${name}）`
const englishSupport = (name, tier) => `${name} (Tier ${tier})`
const chineseSupport = (name, tier) => `${name} （等阶 ${tier}）`

function addCandidate(index, key, candidate) {
  const matches = index.get(key) || new Set()
  matches.add(candidate)
  index.set(key, matches)
}

// A translated name is eligible only in its clipboard role and when the active catalog confirms it.
export function createMercenaryWarrantResolver(entries, referenceCatalog) {
  const names = new Map()
  const buildNames = new Map()
  for (const entry of entries) {
    const type = sourceTypes[entry?.table]
    if (!type || entry.kind !== 'dat' || entry.field !== type.field || typeof entry.en !== 'string' ||
        entry.sourceHash !== createHash('sha256').update(entry.en).digest('hex')) continue
    for (const alias of [entry.cn, entry.tw].filter(Boolean)) {
      const name = normalize(alias)
      if (type.type === 'build') addCandidate(buildNames, name, `${entry.id}\0${englishBuild(entry.en)}`)
      else addCandidate(names, `${type.type}\0${name}`, entry.en)
    }
  }
  const referenceBuilds = new Map()
  for (const item of referenceCatalog?.items || []) {
    if (item.discriminator === warrant && item.baseType) addCandidate(referenceBuilds, normalize(item.text), item.baseType)
  }
  const referenceStats = new Map()
  for (const row of referenceCatalog?.stats || []) {
    const id = row.ids?.mercenary
    if (typeof id !== 'string' || !/^mercenary\.(?:skill|support)_/.test(id)) continue
    const matchers = row.matchers.filter(text => !localized.test(text))
    if (!matchers.length) continue
    const entry = { id, matchers }
    for (const text of row.matchers.filter(text => localized.test(text))) addCandidate(referenceStats, normalize(text), entry)
  }

  function build(catalog, name) {
    const items = (catalog.items || []).filter(item => item.discriminator === warrant && item.baseType)
    const direct = items.filter(item => item.text === englishBuild(name))
    if (direct.length) return direct.map(item => item.baseType)
    const translatedNames = buildNames.get(normalize(name))
    const translated = items.filter(item => translatedNames?.has(`${item.baseType}\0${item.text}`))
    if (translated.length) return translated.map(item => item.baseType)
    const referenceIds = referenceBuilds.get(normalize(chineseBuild(name)))
    return items.filter(item => referenceIds?.has(item.baseType)).map(item => item.baseType)
  }

  function stat(catalog, name, type, tier) {
    const prefix = `mercenary.${type}_`
    const queryText = text => type === 'support' && tier ? englishSupport(text, tier) : text
    const statIds = text => resolveCatalogStat(catalog, text, 'mercenary').candidates.map(match => match.id).filter(id => id.startsWith(prefix))
    const direct = statIds(queryText(name))
    if (direct.length || !localized.test(name)) return direct
    const translations = names.get(`${type}\0${normalize(name)}`) || []
    const ids = new Set([...translations].flatMap(text => statIds(queryText(text))))
    if (ids.size) return [...ids]
    const referenceText = normalize(type === 'support' && tier ? chineseSupport(name, tier) : name)
    for (const { id, matchers } of referenceStats.get(referenceText) || []) {
      if (matchers.some(matcher => statIds(matcher).includes(id))) ids.add(id)
    }
    return [...ids]
  }

  return { build, stat }
}
