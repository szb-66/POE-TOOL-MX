import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInternationalSanctumCatalog } from './sanctum/internationalCatalog.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const args = process.argv.slice(2)
if (args.some(arg => arg !== '--refresh')) throw new Error('支持无参数离线生成或 --refresh 刷新来源')
const cache = path.join(root, '.cache/sanctum-catalog-international/3.30.0')
await fs.mkdir(cache, { recursive: true })
let sources
if (args.includes('--refresh')) {
  const values = await Promise.all(['us', 'cn'].map(async language => {
    const response = await fetch(`https://poedb.tw/${language}/Sanctum_league`, { signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(`圣所目录下载失败：${response.status}`)
    return response.text()
  }))
  sources = { englishHtml: values[0], chineseHtml: values[1], fetchedAt: new Date().toISOString() }
  createInternationalSanctumCatalog(sources)
  await fs.writeFile(path.join(cache, 'sources.json'), JSON.stringify(sources))
} else sources = JSON.parse(await fs.readFile(path.join(cache, 'sources.json'), 'utf8'))
const catalog = createInternationalSanctumCatalog(sources)
const output = path.join(root, 'electron/assets/sanctum/catalog.international.json')
const temporary = `${output}.tmp`
try { await fs.writeFile(temporary, `${JSON.stringify(catalog, null, 2)}\n`); await fs.rename(temporary, output) }
finally { await fs.rm(temporary, { force: true }) }
console.log(`国际服圣所 ${catalog.patch}：${catalog.entries.length} 条；${catalog.entries.filter(entry => entry.rules?.length && entry.rules.every(Boolean)).length} 条规则可计算`)
