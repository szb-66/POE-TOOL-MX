import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { compatibleMarketTemplate, loadOfficialTradeStats, marketTemplate, validateMarketCatalog } from './generateMarketLocalizationCatalog.js'

const root = new URL('../', import.meta.url)
export function auditMarketPseudoCoverage(catalog, officialTradeStats, international) {
  validateMarketCatalog(catalog)
  const english = new Map(officialTradeStats.en.result.find(group => group.id === 'pseudo').entries.map(row => [row.id, row.text]))
  const current = new Map(international.stats.flatMap(stat => Object.values(stat.ids || {}).flat().map(id => [id, stat.matchers.map(marketTemplate)])))
  const rows = officialTradeStats.fr.result.find(group => group.id === 'pseudo').entries.map(row => {
    const en = english.get(row.id)
    const rules = catalog.rules.filter(rule => rule.section === 'stats' && rule.field === 'text' && rule.id === row.id && rule.source === row.text)
    const reason = locale => rules.some(rule => rule[locale]) ? 'covered'
      : !en || !current.get(row.id)?.includes(marketTemplate(en)) ? 'english-source-missing-or-drifted'
        : rules.length ? `missing-${locale}-translation`
          : !compatibleMarketTemplate(en, row.text) ? 'parameter-spelling-not-covered-by-catalog'
            : 'exact-french-source-or-translation-not-covered'
    return { id: row.id, en, source: row.text, cn: reason('cn'), tw: reason('tw') }
  })
  const coverage = locale => ({ covered: rows.filter(row => row[locale] === 'covered').length,
    missing: rows.filter(row => row[locale] !== 'covered').length,
    reasons: Object.fromEntries([...new Set(rows.map(row => row[locale]))].sort().map(reason => [reason, rows.filter(row => row[locale] === reason).length])) })
  return { schemaVersion: 1, game: 'poe1', sourceLocale: 'fr', total: rows.length,
    sources: officialTradeStats.sources, coverage: { cn: coverage('cn'), tw: coverage('tw') }, rows }
}

async function main() {
  const args = process.argv.slice(2), value = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined
  const catalogPath = value('--catalog') || fileURLToPath(new URL('electron/assets/market-localization/catalog.json', root))
  const bytes = await fs.readFile(catalogPath)
  const officialTradeStats = await loadOfficialTradeStats()
  const international = JSON.parse(await fs.readFile(new URL('electron/modules/priceCheck/catalog.international.json', root), 'utf8'))
  const result = { catalogSha256: createHash('sha256').update(bytes).digest('hex'), ...auditMarketPseudoCoverage(JSON.parse(bytes), officialTradeStats, international) }
  if (value('--output')) await fs.writeFile(value('--output'), `${JSON.stringify(result, null, 2)}\n`)
  console.log(JSON.stringify({ total: result.total, catalogSha256: result.catalogSha256, coverage: result.coverage }))
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error.message); process.exitCode = 1 })
