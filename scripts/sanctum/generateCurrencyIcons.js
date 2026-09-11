// Reuse checked-in art; missing assets come from the saved PoEDB reward list.
// Runtime recognition and rendering never access the network.
import fs from 'node:fs/promises'
import { load } from 'cheerio'
import { createHash } from 'node:crypto'
const root = new URL('../../', import.meta.url)
const directory = new URL('electron/assets/sanctum/currency/', root)
const manifestPath = new URL('manifest.json', directory)
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
const $ = load(await fs.readFile(new URL('.cache/sanctum-catalog/source.html', root), 'utf8'))
const links = $('#Rewards a.StackableCurrency').toArray()
if (links.length < 25) throw new Error('奖励通货来源不完整')
const entries = []
for (const link of links) {
  const name = $(link).text().trim(), image = $(link).find('img').attr('src')
  const existing = manifest.entries.find(entry => entry.name === name)
  const key = existing?.key || $(link).attr('href').toLowerCase().replaceAll('_', '-')
  if (!image?.startsWith('https://cdn.poedb.tw/image/Art/2DItems/')) throw new Error('图标来源无效')
  const sourceUrl = image.replace('https://cdn.poedb.tw/', 'https://web.poecdn.com/').replace(/\.webp$/, '.png')
  const iconFile = existing?.iconFile || `${key}.png`
  const file = new URL(iconFile, directory)
  try { await fs.access(file) } catch {
    if (!process.argv.includes('--fetch-missing')) throw new Error(`缺少 ${name} 图标，请使用 --fetch-missing`)
    const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(`图标下载失败：${name} ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error('图标不是 PNG')
    await fs.writeFile(file, bytes)
  }
  entries.push({ ...existing, key, name, iconFile, order: entries.length + 1,
    sourceUrl: existing?.sourceUrl || sourceUrl, pageUrl: `https://poedb.tw/cn/${$(link).attr('href')}`,
    sha256: createHash('sha256').update(await fs.readFile(file)).digest('hex') })
}
await fs.writeFile(manifestPath, JSON.stringify({ source: 'PoEDB Sanctum Rewards; existing official crafting art reused',
  sourceUrl: 'https://poedb.tw/cn/Sanctum_league#Rewards', entries }, null, 2) + '\n')
console.log(`通货模板：${entries.length}`)
