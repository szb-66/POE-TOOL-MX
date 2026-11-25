import { createLocalizationDictionary } from '../localization/text.js'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { sanctumCatalogSummary } from './catalog.js'

const rewardDefinitions = JSON.parse(readFileSync(new URL('../../assets/sanctum/reward-text-templates.json', import.meta.url), 'utf8')).templates

const structure = ['Resolve', 'Inspiration', 'Aureus', 'Aureus Coins', 'Minor Boons', 'Major Boons', 'Minor Afflictions', 'Major Afflictions', 'Area Level', 'Item Class', 'Rarity']
const compact = text => String(text).normalize('NFKC').replace(/\s+/g, '').toLowerCase()
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function rewardPattern(text, definition) {
  const source = compact(text), tokens = [], parts = []
  let cursor = 0
  for (const match of source.matchAll(/\{(\d+)\}/g)) {
    const parameter = Number(match[1])
    if (![definition.quantityParameter, definition.currencyParameter].includes(parameter) || tokens.includes(parameter)) return null
    parts.push(escape(source.slice(cursor,match.index)), parameter === definition.quantityParameter ? '(\\d{1,12})' : '(.{1,100}?)')
    tokens.push(parameter); cursor = match.index + match[0].length
  }
  const expected = definition.quantityParameter === null ? [definition.currencyParameter] : [definition.quantityParameter,definition.currencyParameter]
  if (tokens.length !== expected.length || expected.some(parameter => !tokens.includes(parameter))) return null
  parts.push(escape(source.slice(cursor)))
  return { definition, tokens, expression: new RegExp(`^${parts.join('')}$`,'u') }
}

function rewardPatterns(activeEntries) {
  return rewardDefinitions.flatMap(definition => {
    const source = activeEntries.filter(entry => entry?.kind === 'dat' && entry.table?.toLowerCase() === 'clientstrings'
      && entry.id === definition.id && entry.field === 'Text')
    const valid = source.length === 1 && source[0].en === definition.en && source[0].sourceHash === definition.sourceHash
      && createHash('sha256').update(source[0].en).digest('hex') === definition.sourceHash
    return [definition.en, ...(valid ? [source[0].cn,source[0].tw] : [])].filter(value => typeof value === 'string' && value.length <= 1000)
      .map(text => rewardPattern(text,definition)).filter(Boolean)
  })
}

// The catalog keeps English identities; only aliases from the currently active,
// verified managed dictionary can reach those identities.
export function createLocalizedSanctumCatalog(base, { entriesProvider = () => [], revisionProvider = () => '' } = {}) {
  let revision, dictionary, entries, rewards
  function refresh() {
    const current = String(revisionProvider() || '')
    if (dictionary && current === revision) return
    const activeEntries = current ? entriesProvider() : []
    dictionary = createLocalizationDictionary(activeEntries)
    rewards = rewardPatterns(activeEntries)
    revision = current
    entries = base.entries.map(entry => ({ ...entry, aliases: [...new Set([...(entry.aliases || []), ...dictionary.aliasesFor(entry.name)])].filter(text => text !== entry.name),
      descriptionAliases: (entry.descriptions || []).flatMap(text => dictionary.aliasesFor(text)) }))
  }
  function parseReward(text) {
    refresh()
    if (typeof text !== 'string' || text.length > 2000) return null
    const matches = [], rejected = []
    for (const pattern of rewards) {
      const match = pattern.expression.exec(compact(text))
      if (!match) continue
      const values = new Map(pattern.tokens.map((parameter,index) => [parameter,match[index+1]]))
      const quantity = pattern.definition.quantityParameter === null ? 1 : Number(values.get(pattern.definition.quantityParameter))
      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1e6) { rejected.push('奖励数量无效');continue }
      let name
      try { name = dictionary.toEnglish(values.get(pattern.definition.currencyParameter),{strict:true}) }
      catch { rejected.push('奖励通货未匹配当前资源或存在歧义');continue }
      const candidates = entries.filter(entry => entry.kind === 'reward' && compact(entry.name) === compact(name))
      if (candidates.length !== 1) { rejected.push('奖励通货未匹配唯一的国际服目录条目');continue }
      matches.push({status:'matched',quantity,currency:candidates[0].name,timing:pattern.definition.timing,sourceId:pattern.definition.id,
        text:pattern.definition.en.replace(/\{(\d+)\}/g,(_,parameter) => Number(parameter) === pattern.definition.currencyParameter ? candidates[0].name : String(quantity))})
    }
    if (!matches.length) return rejected.length ? {status:'unknown',reason:rejected[0]} : null
    const unique = new Map(matches.map(match => [JSON.stringify([match.quantity,match.currency,match.timing]),match]))
    return unique.size === 1 && !rejected.length ? unique.values().next().value : {status:'unknown',reason:'奖励文本存在多个不一致候选'}
  }
  const result = { ...base }
  // Status summaries only use original identities, so they do not need the translation dictionary.
  Object.defineProperty(result, 'summary', { get() { return sanctumCatalogSummary(result, base.entries) } })
  Object.defineProperty(result, 'localizationRevision', { get() { refresh(); return revision } })
  Object.defineProperty(result, 'entries', { enumerable: true, get() { refresh(); return entries } })
  Object.defineProperty(result, 'parseReward', { value:parseReward })
  Object.defineProperty(result, 'normalizeText', { value(text) {
    refresh()
    const reward = parseReward(text)
    if (reward) return reward.status === 'matched' ? reward.text : text
    let translated = dictionary.toEnglish(String(text))
    if (translated !== text) return translated
    // UI counters append actual values to a translated label.
    for (const label of structure) {
      for (const alias of dictionary.aliasesFor(label)) {
        if (alias === label) continue
        translated = translated.replace(new RegExp(`^${escape(alias)}(?=[\\s:：\\d])`, 'u'), label)
      }
    }
    return translated
  } })
  Object.defineProperty(result, 'nativeText', { value() {
    refresh()
    return { offers: dictionary.aliasesFor('Offers Items on Completion'), resolve: dictionary.aliasesFor('Resolve'), inspiration: dictionary.aliasesFor('Inspiration') }
  } })
  return result
}

export function normalizeSanctumText(text, catalog) {
  if (!catalog?.normalizeText) return text
  try { return catalog.normalizeText(text) }
  catch { return text } // Ambiguous managed aliases stay unmatched evidence.
}

export function isUnconfirmedSanctumReward(text, catalog) {
  if (catalog?.server !== 'international' || !catalog.parseReward || !/^(?:receive|gain|immediatelygain|onfloorcompletion|onsanctumcompletion)/.test(compact(text))) return false
  // Actual boon descriptions can also start with Gain. An exact catalog effect
  // remains an effect; an unparsed reward sentence must retain an evidence gap.
  return !catalog.entries.some(entry => ['boon','affliction'].includes(entry.kind)
    && [entry.name,...(entry.aliases || []),...(entry.descriptions || []),...(entry.descriptionAliases || [])].some(value => compact(value) === compact(text)))
}

export function normalizeSanctumEvidence(evidence, catalog) {
  if (catalog?.server !== 'international') return evidence
  const normalize = text => normalizeSanctumText(text, catalog)
  const currency = name => {
    const canonical = normalize(name)
    return catalog.entries.find(entry => entry.kind === 'reward' && [entry.name, ...(entry.aliases || [])].some(alias => compact(alias) === compact(canonical)))?.name || canonical
  }
  const iconCurrency = icon => icon.key ? catalog.entries.find(entry => entry.kind === 'reward' && entry.name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-') === icon.key)?.name || currency(icon.currency) : currency(icon.currency)
  return { ...evidence, originalTexts: evidence.originalTexts || evidence.texts,
    texts: evidence.texts?.map(normalize), titleTexts: evidence.titleTexts?.map(normalize),
    ocrLines: evidence.ocrLines?.map(line => ({ ...line, originalText: line.originalText || line.text, text: normalize(line.text) })),
    ocrBlocks: evidence.ocrBlocks?.map(line => ({ ...line, originalText: line.originalText || line.text, text: normalize(line.text) })),
    currencyIcons: evidence.currencyIcons?.map(icon => ({ ...icon, currency: iconCurrency(icon) })) }
}
