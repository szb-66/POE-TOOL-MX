import fs from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { gunzipSync } from 'node:zlib'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { fixedMarketRules, pseudoMarketTranslations } from './market-localization/fixedTranslations.js'
import { isFixedMarketLabel } from '../shared/marketCompatibilityProfile.js'
import { canonicalJson, validateDataset } from '../shared/localizationProtocol.js'
import { LocalizationDownloader } from '../electron/modules/localization/downloader.js'
import { resolveInstalledLocalizationRoot } from '../electron/modules/localization/installedState.js'
import { auditOfficialFilterCoverage, officialFilterSchema, officialFilterSource } from './market-localization/officialFilterTranslations.js'

const runFile = promisify(execFile)
const root = fileURLToPath(new URL('../', import.meta.url))
const sha256 = text => createHash('sha256').update(text).digest('hex')
const cjk = /[\u3400-\u9fff]/u
const keyOf = entry => `${entry.table}\0${entry.id}\0${entry.field}`
const idsOf = stat => Object.values(stat.ids || {}).flat().filter(id => typeof id === 'string')
const sole = values => values?.size === 1 ? [...values][0] : ''
const visible = value => String(value || '').replace(/\\r\\n|\\n/g, '\n').replace(/\\r/g, '\n')
  .replace(/\[([^\]|]+)\|([^\]]*)\]/g, '$2').replace(/\[([^\]]+)\]/g, '$1').replace(/<[^<>]+>\{([^{}]*)\}/g, '$1')
  .split(/\r?\n/).map(line => line.replace(/\s+/g, ' ').trim()).join('\n').trim()

export const marketTemplate = value => visible(value).replace(/\{\d+(?::([^}]+))?\}/g, (_, format) => `${format?.includes('+') ? '+' : ''}#`)
const parameters = value => JSON.stringify({
  count: (value.match(/#/g) || []).length,
  percent: (value.match(/%/g) || []).length,
  fixed: (value.match(/[+-]?\d+(?:\.\d+)?/g) || []).sort()
})
export const compatibleMarketTemplate = (source, target) => parameters(source) === parameters(target) && !/[{}\0]/.test(target)

async function loadOfficialTradeData(kind, directory = path.join(root, 'scripts/market-localization')) {
  const manifest = JSON.parse(await fs.readFile(path.join(directory, `official-trade-${kind}.source.json`), 'utf8'))
  if (manifest.schemaVersion !== 1 || manifest.game !== 'poe1') throw new Error('官方交易数据来源清单无效')
  const result = { sources: manifest.sources }
  for (const locale of ['en', 'fr']) {
    const source = manifest.sources?.[locale]
    const filename = `official-trade-${kind}.${locale}.json.gz`
    if (source?.file !== filename || source.url !== `https://${locale === 'fr' ? 'fr' : 'www'}.pathofexile.com/api/trade/data/${kind}`
      || !Number.isFinite(Date.parse(source.recordedAt))) throw new Error('官方交易数据来源地址或时间无效')
    const raw = gunzipSync(await fs.readFile(path.join(directory, filename)))
    if (sha256(raw) !== source.sha256) throw new Error('官方交易数据快照哈希不一致')
    result[locale] = JSON.parse(raw.toString('utf8'))
  }
  return result
}
export const loadOfficialTradeStats = directory => loadOfficialTradeData('stats', directory)
export const loadOfficialTradeItems = directory => loadOfficialTradeData('items', directory)

function tradeStatRows(snapshot) {
  if (!Array.isArray(snapshot?.result) || !snapshot.result.length) throw new Error('官方交易词缀快照结构无效')
  const result = new Map()
  for (const group of snapshot.result) {
    if (!Array.isArray(group.entries)) throw new Error('官方交易词缀分组结构无效')
    for (const row of group.entries) {
      if (typeof row.id !== 'string' || !row.id || typeof row.text !== 'string' || !row.text || row.text.includes('\0')) throw new Error('官方交易词缀条目结构无效')
      if (!result.has(row.id)) result.set(row.id, new Set())
      result.get(row.id).add(row.text)
    }
  }
  return result
}

// These reviewed exact official FR rows spell the single numeric placeholder as X.
// Keep the original source for runtime equality; never treat arbitrary X as a placeholder.
const officialParameterSpellingSource = JSON.parse(readFileSync(new URL('./market-localization/official-pseudo-parameter-spellings.json', import.meta.url), 'utf8'))
const officialParameterSpellings = new Map(officialParameterSpellingSource.entries.map(row => [row.id, row]))
function compatibleOfficialTradeTemplate(id, en, fr) {
  const spelling = officialParameterSpellings.get(id)
  return compatibleMarketTemplate(en, fr) || Boolean(spelling && spelling.en === en && spelling.fr === fr)
}

function localized(text) { const value = marketTemplate(text); return value && cjk.test(value) ? value : '' }
function statTranslations(entries) {
  const result = new Map()
  for (const entry of entries) {
    if (entry.kind !== 'stat') continue
    const en = marketTemplate(entry.en)
    if (!result.has(en)) result.set(en, { cn: new Set(), tw: new Set() })
    for (const locale of ['cn', 'tw']) {
      const target = localized(entry[locale])
      if (target && compatibleMarketTemplate(en, target)) result.get(en)[locale].add(target)
    }
  }
  return result
}

function generateStats(international, cnCatalog, entries, officialStats, officialTradeStats, rules, report) {
  const current = new Map(), cn = new Map(), gameText = statTranslations(entries), french = new Map()
  const tradeEn = officialTradeStats ? tradeStatRows(officialTradeStats.en) : new Map()
  const tradeFr = officialTradeStats ? tradeStatRows(officialTradeStats.fr) : new Map()
  for (const entry of officialStats.entries) {
    const en = marketTemplate(entry.en), source = marketTemplate(entry.fr)
    if (!en || !source || !compatibleMarketTemplate(en, source)) continue
    if (!french.has(en)) french.set(en, new Set())
    french.get(en).add(source)
  }
  for (const stat of international.stats) for (const id of idsOf(stat)) {
    if (!current.has(id)) current.set(id, [])
    current.get(id).push(stat)
  }
  for (const stat of cnCatalog.stats) for (const id of idsOf(stat)) {
    if (!cn.has(id)) cn.set(id, [])
    cn.get(id).push(stat)
  }
  for (const [id, stats] of current) {
    const targets = { cn: new Set(), tw: new Set() }
    const candidates = new Map()
    const sourcePatterns = new Set(stats.flatMap(stat => stat.matchers || []).map(marketTemplate))
    for (const en of sourcePatterns) {
      const patternTargets = { cn: new Set(), tw: new Set() }
      const curated = pseudoMarketTranslations[id]
      if (curated && marketTemplate(curated.en) === en) {
        for (const locale of ['cn', 'tw']) if (compatibleMarketTemplate(en, curated[locale])) patternTargets[locale].add(curated[locale])
      }
      const game = gameText.get(en)
      for (const locale of ['cn', 'tw']) if (!patternTargets[locale].size && sole(game?.[locale])) patternTargets[locale].add(sole(game[locale]))
      // The older CN catalog is only a candidate: same ID, exact English semantics, compatible parameters.
      if (!patternTargets.cn.size) for (const candidate of cn.get(id) || []) {
        if (!(candidate.refs || []).some(ref => marketTemplate(ref) === en)) continue
        const target = localized(candidate.matchers?.[0])
        if (target && compatibleMarketTemplate(en, target)) patternTargets.cn.add(target)
      }
      for (const locale of ['cn', 'tw']) for (const target of patternTargets[locale]) targets[locale].add(target)
      candidates.set(en, patternTargets)
    }
    const cnText = sole(targets.cn), twText = sole(targets.tw)
    if (!cnText && !twText) { report.statsSkipped++; continue }
    const proven = []
    for (const [en, translations] of candidates) {
      const cn = cnText && sole(translations.cn) === cnText ? cnText : ''
      const tw = twText && sole(translations.tw) === twText ? twText : ''
      if (!cn && !tw) continue
      const sources = new Set()
      const apiEnglish = tradeEn.get(id), apiFrench = tradeFr.get(id)
      // A current official ID with changed/ambiguous English must not reuse older CSD evidence.
      const englishConfirmed = !apiEnglish || (apiEnglish.size === 1 && marketTemplate(sole(apiEnglish)) === en)
      if (!englishConfirmed) { report.statsEnglishDrift++; continue }
      if (apiEnglish?.size === 1 && apiFrench?.size === 1) {
        const source = sole(apiFrench)
        if (compatibleOfficialTradeTemplate(id, en, source)) { sources.add(source); report.statsApiPatterns++ }
      }
      // Preserve independently proven local variants as well: runtime still requires exact source equality.
      for (const source of french.get(en) || []) sources.add(source)
      for (const source of sources) proven.push({ source, ...(cn ? { cn } : {}), ...(tw ? { tw } : {}) })
    }
    if (!proven.length) { report.statsSourceMissing++; report.statsSkipped++; continue }
    if (targets.cn.size > 1 || targets.tw.size > 1) report.statsAmbiguous++
    for (const candidate of proven) for (const field of ['text', 'label']) rules.push({ section: 'stats', field, id, ...candidate })
    if (proven.some(rule => rule.cn)) report.statsCn++
    if (proven.some(rule => rule.tw)) report.statsTw++
  }
  report.statsTotal = current.size
}

const gemVariantKey = item => `${item.baseType || item.name}\0${item.discriminator}\0${item.text}`
const requiresGemVariantText = item => item.category === 'gem' && item.discriminator && item.text && item.text !== (item.baseType || item.name)
function generateItems(international, officialNames, entries, rules, report, gemVariants) {
  const localizedById = new Map(entries.filter(entry => entry.kind === 'dat').map(entry => [keyOf(entry), entry]))
  const names = new Map()
  for (const source of officialNames.entries) {
    const entry = localizedById.get(keyOf(source))
    if (!entry || entry.en !== source.en || !source.fr || /[{}\0]/.test(source.fr)) continue
    const cn = localized(entry.cn), tw = localized(entry.tw)
    if (!cn && !tw) continue
    if (!names.has(source.en)) names.set(source.en, [])
    names.get(source.en).push({ ...source, cn, tw })
    report.itemSourceEntriesAligned++
  }
  function select(en, base) {
    const candidates = (names.get(en) || []).filter(row => base ? row.table === 'baseitemtypes' : row.table !== 'baseitemtypes')
    if (!candidates.length) return null
    const priority = row => row.table === 'baseitemtypes' ? 0 : row.table === 'words' && row.field === 'Text2' ? 1 : row.table === 'achievementitems' ? 2 : 3
    const best = Math.min(...candidates.map(priority))
    const matching = candidates.filter(row => priority(row) === best)
    const source = sole(new Set(matching.map(row => visible(row.fr))))
    const cn = sole(new Set(matching.map(row => row.cn).filter(Boolean)))
    const tw = sole(new Set(matching.map(row => row.tw).filter(Boolean)))
    return source && (cn || tw) ? { source, ...(cn ? { cn } : {}), ...(tw ? { tw } : {}) } : null
  }
  function append(field, entry, reverse) { if (entry) rules.push({ section: 'items', field, ...entry, reverse }) }
  for (const item of international.items) {
    const base = select(item.baseType || item.name, true)
    const unique = item.name && item.name !== item.baseType ? select(item.name, false) : null
    append('type', base, ['type', 'term'])
    append('name', unique, ['name', 'term'])
    if (unique && base && item.text === `${item.name} ${item.baseType}`) {
      append('text', { source: `${unique.source} ${base.source}`,
        ...(unique.cn && base.cn ? { cn: `${unique.cn} ${base.cn}` } : {}),
        ...(unique.tw && base.tw ? { tw: `${unique.tw} ${base.tw}` } : {}) }, ['term'])
    } else if (base && !unique && (!item.text || item.text === item.baseType || item.text === item.name)) append('text', base, ['term'])
    if (base || unique) report.itemsMatched++
    else report.itemsSkipped++
    if (base) report.itemBaseFieldsMatched++
    if (unique) report.itemNameFieldsMatched++
    if (base && (!item.unique || unique) && (!requiresGemVariantText(item) || gemVariants.has(gemVariantKey(item)))) report.itemsComplete++
  }
  report.itemsTotal = international.items.length
}

function generateGemVariants(international, officialNames, entries, officialItems, rules, report) {
  const matched = new Set()
  if (!officialItems) return matched
  const gemRows = snapshot => {
    const groups = snapshot?.result?.filter(group => group.id === 'gem')
    if (groups?.length !== 1 || !Array.isArray(groups[0].entries)) throw new Error('官方宝石目录结构无效')
    return groups[0].entries.filter(row => ['type', 'text', 'disc'].every(key => typeof row[key] === 'string' && row[key] && !row[key].includes('\0')))
  }
  const english = gemRows(officialItems.en), french = gemRows(officialItems.fr)
  const pairKey = (type, disc) => `${type}\0${disc}`
  const grouped = rows => {
    const result = new Map()
    for (const row of rows) {
      const key = pairKey(row.type, row.disc)
      if (!result.has(key)) result.set(key, [])
      result.get(key).push(row)
    }
    return result
  }
  const enPairs = grouped(english), frPairs = grouped(french)
  const dat = new Map(entries.filter(row => row.kind === 'dat').map(row => [keyOf(row), row]))
  const bases = new Map(), names = new Map()
  for (const row of officialNames.entries.filter(row => row.table === 'baseitemtypes' && row.field === 'Name')) {
    const translation = dat.get(keyOf(row))
    if (!translation || translation.en !== row.en || !row.fr || /[{}\0]/.test(row.fr)) continue
    if (!bases.has(row.en)) bases.set(row.en, [])
    bases.get(row.en).push({ source: visible(row.fr), cn: localized(translation.cn), tw: localized(translation.tw) })
  }
  for (const row of entries) {
    if (row.kind !== 'dat' || !(row.table === 'activeskills' && row.field === 'DisplayedName') && !(row.table === 'gemeffects' && row.field === 'Name')) continue
    if (!names.has(row.en)) names.set(row.en, { cn: new Set(), tw: new Set() })
    for (const locale of ['cn', 'tw']) {
      const target = localized(row[locale])
      if (target) names.get(row.en)[locale].add(target)
    }
  }
  const localVariants = international.items.filter(item => item.category === 'gem' && item.discriminator && item.text)
  const localKeys = new Set(localVariants.map(gemVariantKey))
  const untracked = english.filter(row => !localKeys.has(gemVariantKey({ baseType: row.type, discriminator: row.disc, text: row.text })))
  // A current official variant may precede the older international catalog. It still needs
  // the same unique bilingual pair, proven base identity and exact managed English name.
  const variants = [...localVariants, ...untracked.map(row => ({ category: 'gem', name: row.type, baseType: row.type, discriminator: row.disc, text: row.text }))]
  const audit = report.gemVariants = { officialTotal: english.length, currentCatalogTotal: localVariants.length, total: 0, matched: 0, cn: 0, tw: 0, compound: 0, skipped: 0, reasons: {},
    officialOnly: untracked.map(({ type, text, disc }) => ({ type, text, disc })) }
  const skip = reason => { audit.skipped++; audit.reasons[reason] = (audit.reasons[reason] || 0) + 1 }
  for (const item of variants) {
    audit.total++
    const type = item.baseType || item.name, en = enPairs.get(pairKey(type, item.discriminator))
    if (en?.length !== 1 || en[0].text !== item.text) { skip('english-missing-ambiguous-or-drifted'); continue }
    const baseRows = bases.get(type), baseSource = sole(new Set((baseRows || []).map(row => row.source)))
    if (!baseSource) { skip('base-french-source-missing-or-ambiguous'); continue }
    const fr = frPairs.get(pairKey(baseSource, item.discriminator))
    if (fr?.length !== 1) { skip('french-pair-missing-or-ambiguous'); continue }
    let translation = names.get(item.text), compound = false
    const prefix = `${type} (`
    if (!translation && item.text.startsWith(prefix) && item.text.endsWith(')')) {
      const inner = item.text.slice(prefix.length, -1), variant = names.get(inner)
      // English states the compound explicitly; French is always the complete raw API text.
      if (variant && english.filter(row => row.disc === item.discriminator && row.text === inner).length === 1) {
        translation = { cn: new Set(), tw: new Set() }
        for (const locale of ['cn', 'tw']) {
          const base = sole(new Set(baseRows.map(row => row[locale]).filter(Boolean))), suffix = sole(variant[locale])
          if (base && suffix) translation[locale].add(`${base} (${suffix})`)
        }
        compound = true
      }
    }
    const cn = sole(translation?.cn), tw = sole(translation?.tw)
    if (!cn && !tw) { skip('managed-translation-missing-or-ambiguous'); continue }
    rules.push({ section: 'items', field: 'text', source: fr[0].text, ...(cn ? { cn } : {}), ...(tw ? { tw } : {}), reverse: ['term'] })
    matched.add(gemVariantKey(item))
    audit.matched++; if (cn) audit.cn++; if (tw) audit.tw++; if (compound) audit.compound++
  }
  return matched
}

function finalizeRules(input) {
  const unique = new Map()
  for (const rule of input) {
    if (!rule.cn && !rule.tw) continue
    const identity = `${rule.section}\0${rule.field}\0${rule.scope || ''}\0${Boolean(rule.defaultOption)}\0${rule.id || ''}\0${rule.source || ''}`
    if (!unique.has(identity)) unique.set(identity, [])
    unique.get(identity).push(rule)
  }
  const result = []
  for (const group of unique.values()) {
    const first = group[0]
    const cn = sole(new Set(group.map(rule => rule.cn).filter(Boolean))), tw = sole(new Set(group.map(rule => rule.tw).filter(Boolean)))
    if (!cn && !tw) continue
    const reverse = [...new Set(group.flatMap(rule => rule.reverse || []))].sort()
    result.push({ section: first.section, field: first.field, ...(first.scope ? { scope: first.scope } : {}), ...(first.defaultOption ? { defaultOption: true } : {}),
      ...(first.id ? { id: first.id } : {}), ...(first.source ? { source: first.source } : {}),
      ...(cn ? { cn } : {}), ...(tw ? { tw } : {}), ...(reverse.length ? { reverse } : {}) })
  }
  const key = rule => `${rule.section}\0${rule.field}\0${rule.scope || ''}\0${Boolean(rule.defaultOption)}\0${rule.id || ''}\0${rule.source || ''}`
  return result.sort((a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0)
}

export function validateMarketCatalog(catalog) {
  if (catalog.schemaVersion !== 1 || catalog.game !== 'poe1' || catalog.sourceLocale !== 'fr' || catalog.gameVersion !== '3.30.0b' || catalog.buildId !== '26694821'
    || catalog.executableSha256 !== '7f762cadbe0a7315091e105121010d2f35296db8046294e0bf49aacfff67db3c'
    || !Array.isArray(catalog.rules) || !catalog.rules.length || catalog.rules.length > 100000) throw new Error('市集词库结构、游戏版本或条目数量无效')
  const seen = new Set()
  for (const rule of catalog.rules) {
    if (!['filters', 'stats', 'items'].includes(rule.section) || !['title', 'text', 'label', 'type', 'name', 'placeholder'].includes(rule.field)
      || (rule.field === 'type' && rule.section !== 'items') || (!rule.id && !rule.source && !(rule.scope && rule.defaultOption === true)) || (!rule.cn && !rule.tw)) throw new Error('市集词库条目缺少可靠身份或译文')
    if (['stats', 'items'].includes(rule.section) && !isFixedMarketLabel(rule) && !rule.source) throw new Error('动态市集词库条目缺少已核实法语原文')
    for (const [key, value] of Object.entries(rule)) if (!['reverse', 'defaultOption'].includes(key) && (typeof value !== 'string' || !value || value.includes('\0') || value.length > (key === 'id' ? 512 : 65536))) throw new Error('市集词库字符串无效')
    if (rule.scope && (rule.section !== 'filters' || rule.field !== 'text')) throw new Error('市集选项范围无效')
    if ('defaultOption' in rule && (rule.defaultOption !== true || rule.section !== 'filters' || rule.field !== 'text' || !rule.scope || rule.id)) throw new Error('市集默认选项身份无效')
    if (rule.reverse && (rule.section !== 'items' || !rule.source || !Array.isArray(rule.reverse) || rule.reverse.some(field => !['name', 'type', 'term'].includes(field)))) throw new Error('市集反向查询映射无效')
    const key = `${rule.section}\0${rule.field}\0${rule.scope || ''}\0${Boolean(rule.defaultOption)}\0${rule.id || ''}\0${rule.source || ''}`
    if (seen.has(key)) throw new Error('市集词库存在重复身份')
    seen.add(key)
  }
  if (Buffer.byteLength(JSON.stringify(catalog.rules)) > 16 * 1024 * 1024 - 4096) throw new Error('市集词库超过原生控制通道限制')
  return catalog
}

export function generateMarketLocalizationCatalog({ international, cnCatalog, localization, officialNames, officialStats, officialTradeStats, officialTradeItems }) {
  if (!Array.isArray(international.items) || !Array.isArray(international.stats) || !Array.isArray(cnCatalog.stats) || !Array.isArray(localization.entries)
    || officialNames.schemaVersion !== 1 || officialNames.locale !== 'fr' || !Array.isArray(officialNames.entries)
    || officialStats?.schemaVersion !== 1 || officialStats.game !== 'poe1' || officialStats.locale !== 'fr' || !Array.isArray(officialStats.entries)
    || officialStats.buildId !== officialNames.buildId
    || officialNames.gameVersion !== localization.gameVersion || officialNames.buildId !== '26694821') throw new Error('市集词库来源结构或游戏版本不一致')
  const entries = validateDataset(localization).entries
  const rules = fixedMarketRules.map(rule => {
    const localizedCurrency = rule.section === 'filters' && rule.scope === 'price' && rule.id ? cnCatalog.currencyLabels?.[rule.id] : ''
    return { ...rule, ...(typeof localizedCurrency === 'string' && cjk.test(localizedCurrency) ? { cn: localizedCurrency } : {}) }
  })
  const report = { statsTotal: 0, statsCn: 0, statsTw: 0, statsSkipped: 0, statsAmbiguous: 0, statsSourceMissing: 0, statsApiPatterns: 0, statsEnglishDrift: 0, itemsTotal: 0, itemsMatched: 0, itemsSkipped: 0,
    itemBaseFieldsMatched: 0, itemNameFieldsMatched: 0, itemsComplete: 0, itemSourceEntriesAligned: 0 }
  generateStats(international, cnCatalog, entries, officialStats, officialTradeStats, rules, report)
  const gemVariants = generateGemVariants(international, officialNames, entries, officialTradeItems, rules, report)
  generateItems(international, officialNames, entries, rules, report, gemVariants)
  const catalog = { schemaVersion: 1, game: 'poe1', gameVersion: officialNames.gameVersion, buildId: officialNames.buildId, sourceLocale: 'fr',
    executableSha256: officialNames.executableSha256,
    ...(localization.releaseId ? { localizationReleaseId: localization.releaseId } : {}),
    sources: { internationalCatalog: sha256(canonicalJson(international)), cnCatalog: sha256(canonicalJson(cnCatalog)),
      localization: sha256(canonicalJson(localization)), officialFrenchNames: sha256(canonicalJson(officialNames)), officialFrenchStats: sha256(canonicalJson(officialStats)),
      ...(officialTradeStats ? { officialTradeEnglishStats: sha256(canonicalJson(officialTradeStats.en)), officialTradeFrenchStats: sha256(canonicalJson(officialTradeStats.fr)),
        officialPseudoParameterSpellings: sha256(canonicalJson(officialParameterSpellingSource)) } : {}), officialFilters: officialFilterSource.sha256 },
    ...(officialTradeStats?.sources ? { officialTradeStatsSources: officialTradeStats.sources } : {}),
    ...(officialTradeItems ? { officialTradeItemsSources: officialTradeItems.sources,
      officialTradeItemsHashes: { en: sha256(canonicalJson(officialTradeItems.en)), fr: sha256(canonicalJson(officialTradeItems.fr)) } } : {}),
    report, rules: finalizeRules(rules) }
  report.rules = catalog.rules.length
  report.ruleCounts = Object.fromEntries(['filters', 'stats', 'items'].map(section => [section, catalog.rules.filter(rule => rule.section === section).length]))
  report.filterCoverage = auditOfficialFilterCoverage(catalog.rules, officialFilterSchema)
  if (report.filterCoverage.missing.length) throw new Error(`市集筛选目录仍缺少 ${report.filterCoverage.missing.length} 项展示映射`)
  return validateMarketCatalog(catalog)
}

async function main() {
  const args = process.argv.slice(2), value = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined
  const officialPath = path.resolve(value('--official-names') || path.join(root, '.cache/native-market/official-names.fr.json'))
  const officialStatsPath = path.resolve(value('--official-stats') || path.join(root, '.cache/native-market/official-stat-templates.fr.json'))
  if (value('--game-directory')) {
    await runFile('pwsh', ['-NoProfile', '-File', path.join(root, 'scripts/exportMarketLocalizationNames.ps1'), '-GameDirectory', value('--game-directory'), '-OutputPath', officialPath], { windowsHide: true, maxBuffer: 1024 * 1024, timeout: 180000 })
    await runFile('pwsh', ['-NoProfile', '-File', path.join(root, 'scripts/exportMarketStatTemplates.ps1'), '-GameDirectory', value('--game-directory'), '-OutputPath', officialStatsPath], { windowsHide: true, maxBuffer: 1024 * 1024, timeout: 180000 })
  }
  const read = async filename => JSON.parse(await fs.readFile(filename, 'utf8'))
  let localization
  if (value('--localization-storage')) {
    const storageRoot = path.resolve(value('--localization-storage'))
    let gameDirectory = value('--game-directory')
    if (!gameDirectory) {
      try { gameDirectory = (await read(path.join(storageRoot, 'settings.json'))).gameDirectory }
      catch (error) { if (error.code !== 'ENOENT') throw error }
    }
    const transactionRoot = gameDirectory ? resolveInstalledLocalizationRoot(storageRoot, gameDirectory) : storageRoot
    const transaction = await read(path.join(transactionRoot, 'transaction-active.json'))
    const downloader = new LocalizationDownloader({ storageRoot, publicKeyFile: path.join(root, 'electron/assets/localization-public-key.pem') })
    const bundle = downloader.loadRevision(transaction.releaseId) || downloader.load()
    if (!bundle || bundle.manifest.releaseId !== transaction.releaseId) throw new Error('当前受管词库验签失败或未与真实应用状态对应')
    localization = { protocolVersion: 1, engineVersion: 1, gameVersion: bundle.manifest.gameVersion, cnGameVersion: bundle.manifest.cnGameVersion,
      releaseId: bundle.manifest.releaseId, entries: bundle.entries }
  } else localization = await read(value('--localization') || path.join(root, '.cache/localization-build/official-translations-names.json'))
  const input = {
    international: await read(path.join(root, 'electron/modules/priceCheck/catalog.international.json')),
    cnCatalog: await read(path.join(root, 'electron/modules/priceCheck/catalog.json')),
    localization,
    officialNames: await read(officialPath),
    officialStats: await read(officialStatsPath),
    officialTradeStats: await loadOfficialTradeStats(value('--official-trade-stats-directory') || undefined),
    officialTradeItems: await loadOfficialTradeItems(value('--official-trade-items-directory') || undefined)
  }
  const catalog = generateMarketLocalizationCatalog(input)
  const output = path.resolve(value('--output') || path.join(root, 'electron/assets/market-localization/catalog.json'))
  const text = `${JSON.stringify(catalog, null, 2)}\n`
  if (args.includes('--check')) {
    if (await fs.readFile(output, 'utf8') !== text) throw new Error('市集词库与当前来源不一致，请重新生成')
  } else {
    await fs.mkdir(path.dirname(output), { recursive: true })
    await fs.writeFile(`${output}.next`, text)
    await fs.rename(`${output}.next`, output)
  }
  console.log(JSON.stringify({ output, ...catalog.report }))
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error.message); process.exitCode = 1 })
