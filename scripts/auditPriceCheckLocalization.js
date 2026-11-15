import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { LocalizationDownloader } from '../electron/modules/localization/downloader.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const visible = value => String(value || '').replace(/\\r\\n|\\n|\\r/g, '\n')
  .replace(/\[([^\]|]+)\|([^\]]*)\]/g, '$2').replace(/\[([^\]]+)\]/g, '$1')
  .replace(/<[^<>]+>\{([^{}]*)\}/g, '$1').replace(/\s+/g, ' ').trim()
const pattern = value => visible(value).replace(/\{\d+(?::[^}]+)?\}/g, '#')
  .replace(/[+-]#/g, '#')
const add = (map, key, value) => map.set(key, [...(map.get(key) || []), value])
const unique = values => [...new Set(values)]

// This audit reads signed resources and the catalog; it never changes or publishes them.
export function auditPriceCheckLocalization(entries, catalog) {
  const byEnglish = new Map()
  const allAliases = new Map()
  const statPatterns = new Map()
  for (const entry of entries) {
    add(byEnglish, visible(entry.en), entry)
    if (entry.kind === 'stat') add(statPatterns, pattern(entry.en), entry)
    for (const locale of ['cn', 'tw']) if (entry[locale]) add(allAliases, visible(entry[locale]), visible(entry.en))
  }
  const categories = {}
  const missingIdentities = []
  const missingCnNames = []
  const collisions = []
  const catalogNamesByCategory = new Map()
  for (const item of catalog.items) {
    const name = item.unique ? item.name : item.baseType
    add(catalogNamesByCategory, item.category, visible(name))
  }
  for (const item of catalog.items) {
    const name = visible(item.unique ? item.name : item.baseType)
    const summary = categories[item.category] ||= { rows: 0, internalIdentifiers: 0, translatedNames: 0, missingNames: 0, missingCnOnly: 0, globalCollisionRows: 0, categoryCollisionRows: 0 }
    summary.rows++
    // Official numeric map keys and chart region codes are API discriminators, not clipboard names.
    if (/^\d+$/.test(name) || item.discriminator === 'mercenary_warrant' || (item.category === 'chart' && !name.includes(' '))) {
      summary.internalIdentifiers++
      continue
    }
    const table = item.category === 'monster' ? 'monstervarieties' : item.unique ? 'words' : 'baseitemtypes'
    const records = (byEnglish.get(name) || []).filter(entry => entry.table === table)
    const translated = records.filter(entry => entry.cn || entry.tw)
    if (!translated.length) {
      summary.missingNames++
      missingIdentities.push({ category: item.category, name, table, sourceRows: records.length, catalogKey: item.key })
      continue
    }
    summary.translatedNames++
    if (!translated.some(entry => entry.cn)) {
      summary.missingCnOnly++
      missingCnNames.push({ category: item.category, name, tw: unique(translated.map(entry => entry.tw).filter(Boolean)) })
    }
    let globalCollision = false
    let categoryCollision = false
    const candidateNames = new Set(catalogNamesByCategory.get(item.category))
    for (const locale of ['cn', 'tw']) for (const alias of unique(translated.map(entry => visible(entry[locale])).filter(Boolean))) {
      const globalNames = unique(allAliases.get(alias) || [])
      if (globalNames.length > 1) globalCollision = true
      const scopedNames = globalNames.filter(english => candidateNames.has(english) && (byEnglish.get(english) || [])
        .some(entry => entry.table === table && visible(entry[locale]) === alias))
      if (scopedNames.length > 1) {
        categoryCollision = true
        collisions.push({ category: item.category, table, locale, alias, names: scopedNames.sort() })
      }
    }
    if (globalCollision) summary.globalCollisionRows++
    if (categoryCollision) summary.categoryCollisionRows++
  }
  const tradeStats = { rows: catalog.stats.length, matchedTemplateRows: 0, translatedTemplateRows: 0, missingCnOnly: [], missingTwOnly: [], missingBoth: [], unmatched: [] }
  for (const stat of catalog.stats) {
    if (stat.ids?.pseudo) continue
    const templates = unique((stat.matchers || []).map(pattern))
    const records = templates.flatMap(template => statPatterns.get(template) || [])
    if (!records.length) { tradeStats.unmatched.push({ key: stat.key, matchers: stat.matchers }); continue }
    tradeStats.matchedTemplateRows++
    const cn = records.some(entry => entry.cn)
    const tw = records.some(entry => entry.tw)
    const row = { key: stat.key, matchers: stat.matchers, ids: unique(records.flatMap(entry => entry.stats?.ids || [entry.id])) }
    if (!cn && !tw) tradeStats.missingBoth.push(row)
    else {
      tradeStats.translatedTemplateRows++
      if (!cn) tradeStats.missingCnOnly.push(row)
      if (!tw) tradeStats.missingTwOnly.push(row)
    }
  }
  const stats = entries.filter(entry => entry.kind === 'stat')
  const clipboard = entries.filter(entry => /^clientstrings\d*$/.test(entry.table) &&
    /^(ItemDisplay|ItemDescription|Experience$|MonsterLevelPopup|MapOverlayMonsterLevel)/.test(entry.id))
  return {
    categories,
    missingIdentities,
    missingCnNames,
    scopedNameCollisions: [...new Map(collisions.map(row => [JSON.stringify(row), row])).values()],
    resourceStats: { rows: stats.length, missingCn: stats.filter(row => !row.cn).length, missingTw: stats.filter(row => !row.tw).length, missingBoth: stats.filter(row => !row.cn && !row.tw).length },
    clipboardStrings: { rows: clipboard.length, missingCn: clipboard.filter(row => !row.cn).map(({ id, en, tw }) => ({ id, en, tw })), missingBoth: clipboard.filter(row => !row.cn && !row.tw).map(({ id, en }) => ({ id, en })) },
    tradeStats,
    limitations: ['Counts describe catalog rows and may include legacy aliases.', 'Template matching is a conservative text comparison; unmatched trade stats do not prove missing translations.', 'A same-category name collision requires further item context or candidate selection, not an invented translation.', 'Gem tags, skill descriptions, quality sections and experience are clipboard structure, not trade modifier filters.']
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--self-check')) {
    const report = auditPriceCheckLocalization([
      { kind: 'dat', table: 'baseitemtypes', en: 'A Support', cn: '甲(辅)', tw: '甲輔助' },
      { kind: 'dat', table: 'passiveskills', en: 'Another', cn: '甲(辅)' },
      { kind: 'stat', en: '{0}% increased Life', tw: '生命增加 {0}%' }
    ], { items: [{ category: 'gem', baseType: 'A Support' }, { category: 'map', baseType: '10021' }], stats: [{ key: 'life', matchers: ['#% increased Life'], ids: { explicit: 'explicit.life' } }] })
    assert.equal(report.categories.gem.globalCollisionRows, 1)
    assert.equal(report.categories.gem.categoryCollisionRows, 0)
    assert.equal(report.categories.map.internalIdentifiers, 1)
    assert.equal(report.tradeStats.missingCnOnly.length, 1)
    assert.equal(visible('[foo|Visible]'), 'Visible')
    console.log('Localization audit self-check passed')
    return
  }
  const value = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined
  const storageRoot = value('--storage-root')
  if (!storageRoot) throw new Error('Pass --storage-root with the existing signed localization directory')
  const downloader = new LocalizationDownloader({ storageRoot, publicKeyFile: path.join(root, 'electron/assets/localization-public-key.pem') })
  const bundle = downloader.load(value('--index') || 'ready.json')
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'electron/modules/priceCheck/catalog.international.json'), 'utf8'))
  const report = { releaseId: bundle.manifest.releaseId, entryCount: bundle.entries.length, catalogGeneratedAt: catalog.generatedAt, ...auditPriceCheckLocalization(bundle.entries, catalog) }
  const output = path.resolve(value('--output') || path.join(root, '.cache/price-check-localization-audit.json'))
  fs.mkdirSync(path.dirname(output), { recursive: true })
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify({ output, releaseId: report.releaseId, entryCount: report.entryCount, categories: report.categories, missingIdentityRows: report.missingIdentities.length, scopedNameCollisions: report.scopedNameCollisions.length, resourceStats: report.resourceStats, clipboardStrings: Object.fromEntries(Object.entries(report.clipboardStrings).map(([key, val]) => [key, Array.isArray(val) ? val.length : val])), tradeStats: Object.fromEntries(Object.entries(report.tradeStats).map(([key, val]) => [key, Array.isArray(val) ? val.length : val])) }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main()
