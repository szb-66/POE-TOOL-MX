import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { validateTradeCatalog } from '../electron/modules/priceCheck/catalog.js'

export function parseNdjson(text) {
  return String(text || '').split(/\r?\n/).filter((line) => line.trim()).map((line, index) => {
    try { return JSON.parse(line) } catch { throw new Error(`NDJSON 第 ${index + 1} 行无效`) }
  })
}

export function generateTradeCatalog({ items = [], stats = [], gameVersion, generatedAt }) {
  const normalizedStats = stats.flatMap((entry) => {
    const matchers = (entry.matchers || []).map((matcher) => matcher?.string).filter((text) => text?.includes('#'))
    const rawIds = entry.trade?.ids || entry.ids || {}
    const ids = Object.fromEntries(Object.entries(rawIds).flatMap(([type, values]) => {
      const id = Array.isArray(values) ? values[0] : values
      return id ? [[type, id]] : []
    }))
    if (!entry.ref || !matchers.length || !Object.keys(ids).length) return []
    return [{ key: entry.ref, label: entry.ref, matchers, ids }]
  }).sort((a, b) => a.key.localeCompare(b.key, 'en'))
  const normalizedItems = items.map((entry) => ({
    key: entry.refName || entry.name,
    name: entry.name,
    refName: entry.refName || '',
    tradeTag: entry.tradeTag || ''
  })).filter((entry) => entry.key && entry.name).sort((a, b) => a.key.localeCompare(b.key, 'zh-CN'))
  return validateTradeCatalog({
    schemaVersion: 1,
    game: 'poe1',
    locale: 'zh-CN',
    gameVersion: String(gameVersion || ''),
    generatedAt: generatedAt || new Date().toISOString(),
    sources: ['generated NDJSON'],
    items: normalizedItems,
    stats: normalizedStats
  })
}

async function main() {
  const [itemsFile, statsFile, outputFile, gameVersion] = process.argv.slice(2)
  if (!itemsFile || !statsFile || !outputFile || !gameVersion) {
    throw new Error('用法: node scripts/generateTradeCatalog.js <items.ndjson> <stats.ndjson> <output.json> <gameVersion>')
  }
  const catalog = generateTradeCatalog({
    items: parseNdjson(await readFile(itemsFile, 'utf8')),
    stats: parseNdjson(await readFile(statsFile, 'utf8')),
    gameVersion
  })
  await writeFile(outputFile, `${JSON.stringify(catalog, null, 2)}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1 })
}
