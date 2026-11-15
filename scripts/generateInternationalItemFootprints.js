import { createHash } from 'node:crypto'
import { readFile, writeFile, rename } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseRepoeVersion } from './generateItemFootprints.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const compact = text => String(text || '').normalize('NFKC').trim().replace(/\s+/g, ' ')

export function buildInternationalItemFootprints({ gameVersion, repoeVersion, baseItems, officialCatalog, sources, generatedAt = new Date().toISOString() }) {
  if (gameVersion !== '3.30.0') throw new Error('国际服占位目录必须显式指定 3.30.0')
  if (!/^\d+\.\d+(?:\.\d+)*$/.test(repoeVersion || '')) throw new Error('缺少真实尺寸来源版本')
  if (officialCatalog?.manifest?.server !== 'international' || officialCatalog.locale !== 'en' || !Array.isArray(officialCatalog.items)) throw new Error('必须使用独立国际服官方英文目录')
  const names = new Set(officialCatalog.items.map(item => compact(item.baseType || item.name)).filter(Boolean))
  const byName = new Map()
  for (const record of Object.values(baseItems || {})) {
    const name = compact(record.name)
    if (!name || !names.has(name) || record.release_state === 'unreleased') continue
    const width = record.inventory_width, height = record.inventory_height
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 12 || height > 12) continue
    const dimensions = byName.get(name) || new Map()
    dimensions.set(`${width}x${height}`, { width, height })
    byName.set(name, dimensions)
  }
  const items = [...byName].filter(([, dimensions]) => dimensions.size === 1)
    .map(([name, dimensions]) => ({ name, ...dimensions.values().next().value, source: 'known-repoe-official-intersection' }))
    .sort((left, right) => left.name.localeCompare(right.name, 'en'))
  if (!items.length) throw new Error('国际服已知尺寸交集为空，保留原目录')
  if (!Array.isArray(sources) || sources.length < 2 || sources.some(source => !/^[a-f0-9]{64}$/.test(source.sha256 || ''))) throw new Error('尺寸来源与哈希不完整')
  return {
    schemaVersion: 1, game: 'poe1', server: 'international', locale: 'en', gameVersion,
    dimensionSourceVersion: repoeVersion, compatibilityMode: 'known-items-only', generatedAt, sources,
    audit: { itemRecords: items.length, ambiguousNames: [...byName.values()].filter(value => value.size !== 1).length,
      unknownNames: names.size - items.length, categoryAliases: 0 },
    // 旧版本只能复用已知名称的尺寸；不把新物品按大类猜成相同占位。
    categories: [], items
  }
}

async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) })
  if (!response.ok) throw new Error(`尺寸来源 HTTP ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

export async function generateInternationalItemFootprints(gameVersion) {
  if (gameVersion !== '3.30.0') throw new Error('国际服占位目录必须显式指定 3.30.0')
  const versionUrl = 'https://repoe-fork.github.io/Traditional%20Chinese/'
  const baseUrl = 'https://repoe-fork.github.io/base_items.min.json'
  const officialFile = path.join(root, 'electron/modules/priceCheck/catalog.international.json')
  const [versionBytes, baseBytes, officialBytes] = await Promise.all([download(versionUrl), download(baseUrl), readFile(officialFile)])
  const repoeVersion = parseRepoeVersion(versionBytes.toString('utf8'))
  const catalog = buildInternationalItemFootprints({ gameVersion, repoeVersion,
    baseItems: JSON.parse(baseBytes), officialCatalog: JSON.parse(officialBytes), sources: [
      { id: 'repoe-version-index', url: versionUrl, version: repoeVersion, sha256: sha256(versionBytes) },
      { id: 'repoe-known-base-dimensions', url: baseUrl, version: repoeVersion, sha256: sha256(baseBytes) },
      { id: 'international-official-identities', file: 'electron/modules/priceCheck/catalog.international.json', version: 'live', sha256: sha256(officialBytes) }
    ] })
  const output = path.join(root, 'electron/assets/item-footprints.international.json')
  const temporary = `${output}.${process.pid}.tmp`
  await writeFile(temporary, `${JSON.stringify(catalog, null, 2)}\n`)
  await rename(temporary, output)
  return catalog
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf('--game-version')
  generateInternationalItemFootprints(index < 0 ? '' : process.argv[index + 1]).then(catalog => {
    console.log(`国际服 ${catalog.gameVersion} 已知尺寸 ${catalog.items.length} 条；兼容尺寸来源 ${catalog.dimensionSourceVersion}，未知物品无类别兜底`)
  }).catch(error => { console.error(error.message); process.exitCode = 1 })
}
