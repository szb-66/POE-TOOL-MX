import { createHash } from 'node:crypto'
import { readFile, writeFile, rename } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { load } from 'cheerio'

const PAGES = [['atlas', 'Maps_low_tier', 5], ['atlas', 'Maps_mid_tier', 5], ['atlas', 'Maps_top_tier', 5], ['atlas', 'Maps_uber_tier', 5], ['heist', 'Contracts', 22], ['heist', 'Blueprints', 22]]
const hash = value => createHash('sha256').update(value).digest('hex')
const shape = value => value.replace(/\(-([\d.]+)[—–-]-([\d.]+)\)/g, '-($1—$2)').replace(/\(?\d+(?:\.\d+)?(?:\s*[—–-]\s*\d+(?:\.\d+)?)?\)?/g, '#')
const reward = /^(?:\+?\(?[\d. —–-]+\)?%\s+)?(?:increased (?:Atlas Drops in this Area|Rarity of Items found in this Area|Pack size)|more (?:Maps|Threads|Currency) found in Area)$/i

export function englishDescriptionLines(html) {
  const q = load(html || '')
  q('.secondary,.badge').remove()
  q('br').replaceWith('\n')
  return q.root().text().split('\n').map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean)
}

export function parseInternationalMods(html, domain) {
  const raw = html.match(/new ModsView\((\{[^\n]+\})\)/)?.[1]
  if (!raw) throw new Error('英文页面缺少 ModsView 数据')
  const data = JSON.parse(raw)
  if (data.opt?.ModDomainsID !== domain || !Array.isArray(data.normal)) throw new Error('英文词缀域不匹配')
  return data.normal.filter(mod => Number(mod.DropChance) > 0 && ['1', '2'].includes(String(mod.ModGenerationTypeID))).map(mod => ({
    affixType: String(mod.ModGenerationTypeID) === '1' ? 'prefix' : 'suffix',
    lines: englishDescriptionLines(mod.str).filter(line => domain !== 5 || !reward.test(line)),
    tags: (mod.mod_no || []).map(tag => englishDescriptionLines(tag).join(' ')).filter(Boolean)
  }))
}

export function parseInternationalChart(html) {
  const q = load(html)
  const table = q('table').filter((_, node) => q(node).find('thead').text().replace(/\s/g, '') === 'LevelPre/SufDescription').first()
  return table.find('tbody tr').toArray().map(row => {
    const cells = q(row).children('td')
    return {
      affixType: cells.eq(1).text().trim() === 'Prefix' ? 'prefix' : cells.eq(1).text().trim() === 'Suffix' ? 'suffix' : '',
      // One source tier omits its numeric Chaos Resistance value ("+%").
      // Other tiers cover that family; do not invent a copied-client number.
      lines: englishDescriptionLines(cells.eq(2).html()).filter(line => !/in adjacent Areas|Voyage Modifier will be revealed once Charted|\+\s*%/i.test(line)),
      tags: []
    }
  }).filter(mod => mod.affixType && mod.lines.length)
}

// Keep each explicit line as a numeric template. Actor and effect can be separated
// by a number, so a single continuous text fragment can match the wrong modifier.
export function buildInternationalSuggestions(records, kind) {
  const groups = new Map()
  for (const { mods, region } of records) for (const mod of mods) for (const line of mod.lines) {
    const template = shape(line)
    const group = groups.get(template) || { types: new Set(), variants: new Set(), regions: new Set(), tags: new Set() }
    group.types.add(mod.affixType)
    group.variants.add(line)
    if (region) group.regions.add(region)
    for (const tag of mod.tags) group.tags.add(tag)
    groups.set(template, group)
  }
  return [...groups].map(([template, group]) => {
    const variants = [...group.variants]
    // Include range endpoints as copied-client examples, not just the PoEDB range notation.
    for (const variant of [...variants]) for (const endpoint of [1, 2]) variants.push(variant.replace(/\(([+\-]?\d+(?:\.\d+)?)[—–-]([+\-]?\d+(?:\.\d+)?)\)/g, (...match) => match[endpoint]))
    return { id: `${kind}:${hash(template).slice(0, 16)}`, value: template, pattern: template, example: [...group.variants][0], variants: [...new Set(variants)], affixType: group.types.size === 1 ? [...group.types][0] : 'mixed', tags: [...group.tags], regions: [...group.regions] }
  }).sort((a, b) => a.value.localeCompare(b.value, 'en'))
}

export function parseCurrentBeasts(html, catalog) {
  const q = load(html)
  const available = new Set(catalog.items.filter(item => item.category === 'monster').map(item => item.name || item.baseType))
  const beasts = q('#LegendaryBestiary a[data-hover]').toArray().map(node => ({
    id: decodeURIComponent(q(node).attr('href').split('/').at(-1)), name: q(node).text().trim()
  })).filter(beast => available.has(beast.name))
  if (beasts.length < 40 || new Set(beasts.map(beast => beast.name)).size !== beasts.length) throw new Error('红兽／首领目录覆盖不足或身份重复')
  return beasts
}

export async function generateInternationalMapData({ gameVersion, catalog, fetchImpl = fetch, now = new Date() }) {
  if (!/^3\.30(?:\.\d+)?$/.test(gameVersion || '')) throw new Error('必须显式指定已适配的国际服 3.30 补丁版本')
  if (catalog.locale !== 'en' || catalog.manifest?.server !== 'international') throw new Error('必须使用国际服英文官方物品快照')
  const officialItemsSource = catalog.manifest.sources?.find(source => source.url === 'https://www.pathofexile.com/api/trade/data/items')
  if (!/^[a-f0-9]{64}$/.test(officialItemsSource?.sha256 || '')) throw new Error('国际服官方物品快照缺少原始来源哈希')
  const sources = []
  async function get(page) {
    const url = `https://poedb.tw/us/${page}`
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
    const html = await response.text()
    sources.push({ url, sha256: hash(html) })
    return html
  }
  const records = { atlas: [], chart: [], heist: [] }
  let currentMapSentinel = false
  for (const [kind, page, domain] of PAGES) {
    const html = await get(page)
    if (kind === 'atlas' && html.includes('Atlas Drops')) currentMapSentinel = true
    const mods = parseInternationalMods(html, domain)
    if (mods.length < 30) throw new Error(`${page}: 英文普通词缀覆盖不足`)
    records[kind].push({ mods, region: page === 'Maps_uber_tier' ? 't17' : 'normal' })
  }
  if (!currentMapSentinel) throw new Error('英文地图来源缺少 3.30 Atlas Drops 哨兵')
  const chart = parseInternationalChart(await get('Sandy_Seabed_Chart'))
  if (chart.length < 70) throw new Error('英文海图普通前后缀覆盖不足')
  records.chart.push({ mods: chart })
  const beasts = parseCurrentBeasts(await get('Bestiary_league'), catalog)
  const result = {
    manifest: { server: 'international', language: 'en', gameVersion, generatedAt: now.toISOString(), sources,
      beastSource: { ...officialItemsSource, catalogItemsSha256: hash(JSON.stringify(catalog.items)), generatedAt: catalog.generatedAt, filter: 'PoEDB Legendary Bestiary intersect official tradable monsters; excludes yellow beasts' },
      warnings: ['PoEDB chart Chaos Resistance row without a numeric value is omitted; the same condition remains covered by valid source tiers.'] },
    atlas: buildInternationalSuggestions(records.atlas, 'atlas'), chart: buildInternationalSuggestions(records.chart, 'chart'), heist: buildInternationalSuggestions(records.heist, 'heist'), beasts
  }
  if (result.atlas.length < 70 || result.chart.length < 20 || result.heist.length < 70) throw new Error('生成的英文地图／海图／契约目录覆盖不足')
  return result
}

async function main() {
  const index = process.argv.indexOf('--game-version')
  const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
  const data = await generateInternationalMapData({ gameVersion: index < 0 ? undefined : process.argv[index + 1], catalog })
  const target = new URL('../src/data/internationalMapData.js', import.meta.url)
  const candidate = new URL(`${target.href}.next`)
  await writeFile(candidate, `// Generated by scripts/generateInternationalMapData.js; do not edit.\nexport default ${JSON.stringify(data, null, 2)}\n`)
  await rename(candidate, target)
  console.log(JSON.stringify({ version: data.manifest.gameVersion, atlas: data.atlas.length, chart: data.chart.length, heist: data.heist.length, beasts: data.beasts.length }))
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error.message); process.exitCode = 1 })
