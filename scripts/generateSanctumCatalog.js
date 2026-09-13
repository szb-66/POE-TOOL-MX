import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSanctumCatalogHtml, SANCTUM_CATALOG_URL } from './sanctum/catalogParser.js'
import { applySanctumCatalogReviews } from './sanctum/catalogReview.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const args = process.argv.slice(2)
if (args.some(arg => arg !== '--refresh')) throw new Error('支持无参数离线生成或 --refresh 刷新来源')
const cache = path.join(root, '.cache/sanctum-catalog')
const output = path.join(root, 'electron/assets/sanctum/catalog.json')
await fs.mkdir(cache, { recursive: true })
if (args.includes('--refresh')) {
  for (const [id, url] of [['source', SANCTUM_CATALOG_URL]]) {
    let lastError
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
        if (!response.ok) throw new Error(`目录下载失败：${response.status}`)
        const html = await response.text(), fetchedAt = new Date().toISOString()
        if (id === 'source') parseSanctumCatalogHtml(html, { fetchedAt })
        await fs.writeFile(path.join(cache, `${id}.html`), html)
        await fs.writeFile(path.join(cache, `${id}.json`), JSON.stringify({ url, fetchedAt }))
        lastError = null
        break
      } catch (error) { lastError = error }
    }
    if (lastError) throw new Error(`无法刷新 ${id}，保留已发布目录：${lastError.message}`)
  }
}
const [html, metadata] = await Promise.all([fs.readFile(path.join(cache, 'source.html'), 'utf8'), fs.readFile(path.join(cache, 'source.json'), 'utf8')])
let catalog = parseSanctumCatalogHtml(html, JSON.parse(metadata))
const reviews = JSON.parse(await fs.readFile(path.join(root, 'scripts/sanctum/catalogReviews.json'), 'utf8'))
catalog = applySanctumCatalogReviews(catalog, reviews)
catalog.notes = ['正式站数据表与社区历史正文分开；条目内容匹配本赛季审核指纹后才启用，刷新不会自动批准变化的条目。']
await fs.mkdir(path.dirname(output), { recursive: true })
const temporary = `${output}.tmp`
try { await fs.writeFile(temporary, `${JSON.stringify(catalog, null, 2)}\n`); await fs.rename(temporary, output) }
finally { await fs.rm(temporary, { force: true }) }
console.log(`圣所目录：${catalog.entries.length} 条，其中 ${catalog.entries.filter(entry => entry.applicability === 'current').length} 条通过本赛季内容核对`)
