import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { getServer } from '../shared/serverMode.js'
import { createInternationalTradeCatalog, validateTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { refreshOfficialTradeCatalog } from './generateTradeCatalog.js'

export async function generateServerTradeCatalog({ server: id, gameVersion, baseCatalog, fetchImpl = fetch, now = Date.now() }) {
  const server = getServer(id)
  // 实时交易目录没有官方补丁号字段；live 明确表示在线快照，不能用于离线规则或 PoB 版本推断。
  if (!(id === 'international' && gameVersion === 'live') && !/^\d+\.\d+(?:\.\d+)?$/.test(gameVersion || '')) throw new Error('必须指定有效的游戏补丁版本')
  if (id === 'cn') {
    const sources = []
    const fetchWithManifest = async (url, options) => {
      const response = await fetchImpl(url, options)
      const body = await response.text()
      sources.push({ url, sha256: createHash('sha256').update(body).digest('hex') })
      return new Response(body, { status: response.status, headers: response.headers })
    }
    const result = await refreshOfficialTradeCatalog({ baseCatalog, gameVersion, fetchImpl: fetchWithManifest, now })
    result.catalog.manifest = { server: id, language: server.language, gameVersion, sources }
    return result
  }
  const sources = []
  const payloads = []
  for (const endpoint of ['stats', 'items', 'static']) {
    const url = `${server.origin}/api/trade/data/${endpoint}`
    const response = await fetchImpl(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000) })
    if (!response.ok) throw new Error(`国际服 ${endpoint} 目录不可用：HTTP ${response.status}`)
    const body = await response.text()
    const payload = JSON.parse(body)
    if (!Array.isArray(payload?.result) || !payload.result.length) throw new Error(`国际服 ${endpoint} 目录为空或结构无效`)
    sources.push({ url, sha256: createHash('sha256').update(body).digest('hex') })
    payloads.push(payload)
  }
  const result = createInternationalTradeCatalog(baseCatalog, ...payloads, gameVersion, now)
  if (result.catalog.items.length < 100 || !Object.keys(result.catalog.currencyLabels).length) throw new Error('国际服物品或通货目录覆盖不足')
  result.catalog.manifest = { server: id, language: server.language, gameVersion, generatedAt: new Date(now).toISOString(), sources }
  return result
}

export async function writeServerTradeCatalog(output, catalog) {
  validateTradeCatalog(catalog)
  if (!catalog.manifest?.server) throw new Error('数据缺少服务器清单')
  if (catalog.manifest.server === 'international' && !path.basename(output).includes('international')) throw new Error('国际服输出文件名必须包含 international，避免覆盖国服目录')
  if (catalog.manifest.server === 'cn' && path.basename(output).includes('international')) throw new Error('国服目录不能覆盖国际服输出文件')
  await mkdir(path.dirname(output), { recursive: true })
  await writeFile(`${output}.next`, `${JSON.stringify(catalog, null, 2)}\n`)
  await rename(`${output}.next`, output)
}

async function main() {
  const args = process.argv.slice(2)
  const value = key => args.includes(key) ? args[args.indexOf(key) + 1] : undefined
  const server = getServer(args.includes('--server') ? value('--server') : 'cn')
  const baseCatalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.json', import.meta.url), 'utf8'))
  const result = await generateServerTradeCatalog({ server: server.id, gameVersion: value('--game-version'), baseCatalog })
  const output = args.includes('--output') ? value('--output') : `electron/modules/priceCheck/catalog${server.id === 'cn' ? '' : '.international'}.json`
  await writeServerTradeCatalog(output, result.catalog)
  console.log(JSON.stringify({ server: server.id, gameVersion: result.catalog.gameVersion, stats: result.catalog.stats.length, items: result.catalog.items.length }))
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error.message); process.exitCode = 1 })
