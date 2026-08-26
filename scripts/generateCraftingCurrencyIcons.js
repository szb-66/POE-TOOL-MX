import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CRAFTING_CURRENCY_CATALOG } from '../shared/craftingCurrencyCatalog.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const outputRoot = path.resolve(dirname, '..', 'src', 'assets', 'images', 'crafting-currency')
const staticDataUrl = 'https://www.pathofexile.com/api/trade/data/static'
const requestOptions = {
  headers: { 'user-agent': 'PoE-CN-Helper/1.2.0 currency-art-snapshot' },
  signal: AbortSignal.timeout(60000)
}

async function fetchChecked(url, label) {
  const response = await fetch(url, requestOptions)
  if (!response.ok) throw new Error(`${label}抓取失败：HTTP ${response.status}`)
  return response
}

const staticData = await (await fetchChecked(staticDataUrl, '官方通货目录')).json()
const currencyGroup = staticData.result?.find((group) => group.id === 'Currency')
if (!currencyGroup?.entries) throw new Error('官方通货目录缺少 Currency 分组')

const entriesById = new Map(currencyGroup.entries.map((entry) => [entry.id, entry]))
await mkdir(outputRoot, { recursive: true })

for (const currency of CRAFTING_CURRENCY_CATALOG) {
  const source = entriesById.get(currency.tradeId)
  if (!source?.image) throw new Error(`官方通货目录缺少 ${currency.key} (${currency.tradeId}) 图标`)
  const imageUrl = new URL(source.image, staticDataUrl)
  if (imageUrl.protocol !== 'https:' || imageUrl.hostname !== 'www.pathofexile.com' || !imageUrl.pathname.startsWith('/gen/image/')) {
    throw new Error(`拒绝抓取非白名单通货图标：${imageUrl}`)
  }
  const response = await fetchChecked(imageUrl, currency.name)
  const contentType = response.headers.get('content-type') || ''
  const buffer = Buffer.from(await response.arrayBuffer())
  if (!contentType.startsWith('image/png') || buffer.length < 64 || !buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error(`${currency.name}图标不是有效 PNG`)
  }
  await writeFile(path.join(outputRoot, currency.iconFile), buffer)
  console.log(`已更新 ${currency.iconFile} (${buffer.length} bytes)`)
}
