import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { fixedMarketRules, pseudoMarketTranslations } from './market-localization/fixedTranslations.js'
import { canonicalJson, validateDataset } from '../shared/localizationProtocol.js'
import { LocalizationDownloader } from '../electron/modules/localization/downloader.js'
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

function generateStats(international, cnCatalog, entries, rules, report) {
  const current = new Map(), cn = new Map(), gameText = statTranslations(entries)
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
    const sourcePatterns = new Set(stats.flatMap(stat => stat.matchers || []).map(marketTemplate))
    for (const en of sourcePatterns) {
      const patternTargets = { cn: new Set(), tw: new Set() }
      const game = gameText.get(en)
      for (const locale of ['cn', 'tw']) if (sole(game?.[locale])) patternTargets[locale].add(sole(game[locale]))
      const curated = pseudoMarketTranslations[id]
      if (curated && marketTemplate(curated.en) === en) {
        for (const locale of ['cn', 'tw']) if (compatibleMarketTemplate(en, curated[locale])) patternTargets[locale].add(curated[locale])
      }
      // The older CN catalog is only a candidate: same ID, exact English semantics, compatible parameters.
      if (!patternTargets.cn.size) for (const candidate of cn.get(id) || []) {
        if (!(candidate.refs || []).some(ref => marketTemplate(ref) === en)) continue
        const target = localized(candidate.matchers?.[0])
        if (target && compatibleMarketTemplate(en, target)) patternTargets.cn.add(target)
      }
      for (const locale of ['cn', 'tw']) for (const target of patternTargets[locale]) targets[locale].add(target)
    }
    const cnText = sole(targets.cn), twText = sole(targets.tw)
    if (!cnText && !twText) { report.statsSkipped++; continue }
    if (targets.cn.size > 1 || targets.tw.size > 1) report.statsAmbiguous++
    for (const field of ['text', 'label']) rules.push({ section: 'stats', field, id, ...(cnText ? { cn: cnText } : {}), ...(twText ? { tw: twText } : {}) })
    if (cnText) report.statsCn++
    if (twText) report.statsTw++
  }
  report.statsTotal = current.size
}

function generateItems(international, officialNames, entries, rules, report) {
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
    if (base && (!item.unique || unique)) report.itemsComplete++
  }
  report.itemsTotal = international.items.length
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
  if (catalog.schemaVersion !== 1 || catalog.game !== 'poe1' || catalog.sourceLocale !== 'fr' || catalog.gameVersion !== '3.30.0b' || catalog.buildId !== '26673341'
    || catalog.executableSha256 !== 'c86e4b153a93e573e7d800dcdf01a79b3392a52f73e29ca48d2bd8297ad28031'
    || !Array.isArray(catalog.rules) || !catalog.rules.length || catalog.rules.length > 100000) throw new Error('市集词库结构、游戏版本或条目数量无效')
  const seen = new Set()
  for (const rule of catalog.rules) {
    if (!['filters', 'stats', 'items'].includes(rule.section) || !['title', 'text', 'label', 'type', 'name', 'placeholder'].includes(rule.field)
      || (rule.field === 'type' && rule.section !== 'items') || (!rule.id && !rule.source && !(rule.scope && rule.defaultOption === true)) || (!rule.cn && !rule.tw)) throw new Error('市集词库条目缺少可靠身份或译文')
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

export function generateMarketLocalizationCatalog({ international, cnCatalog, localization, officialNames }) {
  if (!Array.isArray(international.items) || !Array.isArray(international.stats) || !Array.isArray(cnCatalog.stats) || !Array.isArray(localization.entries)
    || officialNames.schemaVersion !== 1 || officialNames.locale !== 'fr' || !Array.isArray(officialNames.entries)
    || officialNames.gameVersion !== localization.gameVersion || officialNames.buildId !== '26673341') throw new Error('市集词库来源结构或游戏版本不一致')
  const entries = validateDataset(localization).entries
  const rules = fixedMarketRules.map(rule => {
    const localizedCurrency = rule.section === 'filters' && rule.scope === 'price' && rule.id ? cnCatalog.currencyLabels?.[rule.id] : ''
    return { ...rule, ...(typeof localizedCurrency === 'string' && cjk.test(localizedCurrency) ? { cn: localizedCurrency } : {}) }
  })
  const report = { statsTotal: 0, statsCn: 0, statsTw: 0, statsSkipped: 0, statsAmbiguous: 0, itemsTotal: 0, itemsMatched: 0, itemsSkipped: 0,
    itemBaseFieldsMatched: 0, itemNameFieldsMatched: 0, itemsComplete: 0, itemSourceEntriesAligned: 0 }
  generateStats(international, cnCatalog, entries, rules, report)
  generateItems(international, officialNames, entries, rules, report)
  const catalog = { schemaVersion: 1, game: 'poe1', gameVersion: officialNames.gameVersion, buildId: officialNames.buildId, sourceLocale: 'fr',
    executableSha256: officialNames.executableSha256,
    ...(localization.releaseId ? { localizationReleaseId: localization.releaseId } : {}),
    sources: { internationalCatalog: sha256(canonicalJson(international)), cnCatalog: sha256(canonicalJson(cnCatalog)),
      localization: sha256(canonicalJson(localization)), officialFrenchNames: sha256(canonicalJson(officialNames)), officialFilters: officialFilterSource.sha256 },
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
  if (value('--game-directory')) {
    await runFile('pwsh', ['-NoProfile', '-File', path.join(root, 'scripts/exportMarketLocalizationNames.ps1'), '-GameDirectory', value('--game-directory'), '-OutputPath', officialPath], { windowsHide: true, maxBuffer: 1024 * 1024, timeout: 180000 })
  }
  const read = async filename => JSON.parse(await fs.readFile(filename, 'utf8'))
  let localization
  if (value('--localization-storage')) {
    const storageRoot = path.resolve(value('--localization-storage'))
    const bundle = new LocalizationDownloader({ storageRoot, publicKeyFile: path.join(root, 'electron/assets/localization-public-key.pem') }).load()
    const transaction = await read(path.join(storageRoot, 'transaction-active.json'))
    if (!bundle || bundle.manifest.releaseId !== transaction.releaseId) throw new Error('当前受管词库验签失败或未与真实应用状态对应')
    localization = { protocolVersion: 1, engineVersion: 1, gameVersion: bundle.manifest.gameVersion, cnGameVersion: bundle.manifest.cnGameVersion,
      releaseId: bundle.manifest.releaseId, entries: bundle.entries }
  } else localization = await read(value('--localization') || path.join(root, '.cache/localization-build/official-translations-names.json'))
  const input = {
    international: await read(path.join(root, 'electron/modules/priceCheck/catalog.international.json')),
    cnCatalog: await read(path.join(root, 'electron/modules/priceCheck/catalog.json')),
    localization,
    officialNames: await read(officialPath)
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
