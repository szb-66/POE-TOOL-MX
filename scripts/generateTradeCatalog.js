import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import {
  createLocalizedOfficialTradeCatalog,
  officialCurrencyLabels,
  validateTradeCatalog
} from '../electron/modules/priceCheck/catalog.js'

const SIDEKICK_COMMIT = 'deb2455264929447748f1d3d25a1f8d9f5e10628'
const SIDEKICK_POE1_ZH_STATS_URL = `https://raw.githubusercontent.com/Sidekick-Poe/Sidekick/${SIDEKICK_COMMIT}/data/poe1/zh/stats.json`
const compactMatcher = (value) => String(value || '').replace(/\s+/g, ' ').trim()
const isUsableMatcher = (value) => Boolean(value) && !/<[A-Z]{2}\d+>|}}/.test(value)

export function parseNdjson(text) {
  return String(text || '').split(/\r?\n/).filter((line) => line.trim()).map((line, index) => {
    try { return JSON.parse(line) } catch { throw new Error(`NDJSON 第 ${index + 1} 行无效`) }
  })
}

export function generateTradeCatalog({ items = [], stats = [], gameVersion, generatedAt }) {
  const statsByIdentity = new Map()
  for (const entry of stats) {
    const matchers = [...new Set((entry.matchers || []).map((matcher) => matcher?.string?.trim()).filter(Boolean))]
    const rawIds = entry.trade?.ids || entry.ids || {}
    if (!entry.ref || !matchers.length) continue
    for (const [type, values] of Object.entries(rawIds)) {
      for (const id of [...new Set((Array.isArray(values) ? values : [values]).filter(Boolean))]) {
        const identity = `${type}\u0000${id}`
        const existing = statsByIdentity.get(identity)
        if (existing) {
          existing.matchers = [...new Set([...existing.matchers, ...matchers])]
          continue
        }
        statsByIdentity.set(identity, {
          key: `generated-${type}-${String(id).replace(/[^a-z0-9]+/gi, '-')}`,
          label: entry.label || entry.ref,
          matchers,
          ids: { [type]: id },
          ...(entry.categories?.length ? { categories: [...new Set(entry.categories)] } : {}),
          ...(entry.merge ? { merge: entry.merge } : {}),
          ...(entry.resolve ? { resolver: structuredClone(entry.resolve) } : {})
        })
      }
    }
  }
  const normalizedStats = [...statsByIdentity.values()].sort((a, b) => a.key.localeCompare(b.key, 'en'))

  const localizedBaseByRef = new Map(items
    .filter((entry) => entry.namespace !== 'UNIQUE' && entry.refName && entry.name)
    .map((entry) => [entry.refName, entry.name]))
  const itemsByIdentity = new Map()
  for (const entry of items) {
    const baseRef = entry.unique?.base
    const baseType = entry.base || entry.type || localizedBaseByRef.get(baseRef) || baseRef || entry.name
    const unique = entry.namespace === 'UNIQUE' || entry.unique === true || Boolean(entry.unique?.base)
    if (!entry.name || !baseType) continue
    const identity = `${entry.namespace || 'ITEM'}\u0000${entry.refName || entry.name}\u0000${baseType}`
    if (itemsByIdentity.has(identity)) continue
    itemsByIdentity.set(identity, {
      key: [entry.namespace || 'ITEM', entry.refName || entry.name, baseType].join(':'),
      name: entry.name,
      refName: entry.refName || '',
      baseType,
      tradeTag: entry.tradeTag || '',
      unique
    })
  }
  const normalizedItems = [...itemsByIdentity.values()].sort((a, b) => a.key.localeCompare(b.key, 'zh-CN'))
  return validateTradeCatalog({
    schemaVersion: 2,
    game: 'poe1',
    locale: 'zh-CN',
    gameVersion: String(gameVersion || ''),
    generatedAt: generatedAt || new Date().toISOString(),
    sources: ['Awakened PoE Trade 简体中文 NDJSON'],
    items: normalizedItems,
    stats: normalizedStats
  })
}

export function mergeClipboardStatMatchers(catalog, definitions, convertText = (text) => text) {
  if (!Array.isArray(definitions)) throw new Error('当前游戏描述目录响应结构无效')
  const next = structuredClone(catalog)
  const byIdentity = new Map(next.stats.flatMap((entry) => Object.entries(entry.ids || {}).flatMap(([type, value]) =>
    (Array.isArray(value) ? value : [value]).map((id) => [`${type}\u0000${id}`, entry])
  )))
  const missingOfficialIds = new Set()
  let linked = 0
  let aliasesAdded = 0
  let unusableMatchers = 0
  for (const definition of definitions) {
    const matcher = compactMatcher(convertText(definition?.text))
    if (!isUsableMatcher(matcher)) {
      unusableMatchers += 1
      continue
    }
    let hasOfficialId = false
    for (const id of definition?.tradeIds || []) {
      const type = String(id).split('.')[0]
      const entry = byIdentity.get(`${type}\u0000${id}`)
      if (!entry) {
        missingOfficialIds.add(`${type}\u0000${id}`)
        continue
      }
      hasOfficialId = true
      if (!entry.matchers.includes(matcher)) {
        entry.matchers.push(matcher)
        aliasesAdded += 1
      }
    }
    if (hasOfficialId) linked += 1
  }
  const source = `Sidekick 当前 POE1 游戏描述 ${SIDEKICK_COMMIT.slice(0, 12)}（繁中经 OpenCC 转简中）`
  if (!next.sources.includes(source)) next.sources.push(source)
  return {
    catalog: validateTradeCatalog(next),
    audit: {
      definitions: definitions.length,
      linked,
      aliasesAdded,
      missingOfficialIds: missingOfficialIds.size,
      unusableMatchers
    }
  }
}

export async function refreshOfficialTradeCatalog({ baseCatalog, gameVersion, now = Date.now(), fetchImpl = fetch }) {
  const requestJson = async (url, headers, validate = (payload) => Array.isArray(payload?.result)) => {
    let response = null
    let networkError = null
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await fetchImpl(url, { headers })
        break
      } catch (error) {
        networkError = error
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
      }
    }
    if (!response) throw new Error(`交易目录请求失败：${url}：${networkError?.message || '网络连接失败'}`)
    if (!response.ok) throw new Error(`官方交易目录请求失败：HTTP ${response.status} ${url}`)
    const payload = await response.json()
    if (!validate(payload)) throw new Error(`官方交易目录响应无效：${url}`)
    return payload
  }
  const [internationalStats, clipboardStats] = await Promise.all([
    requestJson('https://www.pathofexile.com/api/trade/data/stats', {
      Accept: 'application/json',
      'User-Agent': 'PoePriceCheckerDev/1.0'
    }),
    requestJson(SIDEKICK_POE1_ZH_STATS_URL, {
      Accept: 'application/json',
      'User-Agent': 'PoePriceCheckerDev/1.0'
    }, Array.isArray)
  ])
  const cnHeaders = {
    Accept: 'application/json',
    Origin: 'https://poe.game.qq.com',
    'User-Agent': 'Mozilla/5.0',
    'X-Requested-With': 'XMLHttpRequest'
  }
  const cnStats = await requestJson('https://poe.game.qq.com/api/trade/data/stats', cnHeaders)
  const cnItems = await requestJson('https://poe.game.qq.com/api/trade/data/items', cnHeaders)
  const cnStatic = await requestJson('https://poe.game.qq.com/api/trade/data/static', cnHeaders)
  const official = createLocalizedOfficialTradeCatalog(
    baseCatalog,
    internationalStats,
    cnStats,
    now,
    cnItems
  )
  official.catalog.currencyLabels = officialCurrencyLabels(cnStatic)
  official.catalog.sources.push('腾讯国服官方 /api/trade/data/static')
  const OpenCC = (await import('opencc-js')).default
  const toSimplified = OpenCC.Converter({ from: 'tw', to: 'cn' })
  const bridge = mergeClipboardStatMatchers(official.catalog, clipboardStats, toSimplified)
  const result = {
    catalog: bridge.catalog,
    status: {
      ...official.status,
      clipboardCoverage: bridge.audit
    }
  }
  result.catalog.gameVersion = String(gameVersion || baseCatalog.gameVersion || '')
  result.catalog.generatedAt = new Date(now).toISOString()
  result.status = {
    ...result.status,
    gameVersion: result.catalog.gameVersion,
    generatedAt: result.catalog.generatedAt,
    counts: {
      items: result.catalog.items.length,
      stats: result.catalog.stats.length,
      currencies: Object.keys(result.catalog.currencyLabels || {}).length
    },
    sources: [...result.catalog.sources]
  }
  return result
}

async function main() {
  const [itemsFile, statsFile, outputFile, gameVersion] = process.argv.slice(2)
  if (itemsFile === '--official') {
    const inputOutputFile = statsFile
    const officialGameVersion = outputFile
    if (!inputOutputFile || !officialGameVersion) {
      throw new Error('用法: node scripts/generateTradeCatalog.js --official <catalog.json> <gameVersion>')
    }
    const baseCatalog = JSON.parse(await readFile(inputOutputFile, 'utf8'))
    const { catalog, status } = await refreshOfficialTradeCatalog({ baseCatalog, gameVersion: officialGameVersion })
    await writeFile(inputOutputFile, `${JSON.stringify(catalog, null, 2)}\n`)
    console.log(JSON.stringify(status))
    return
  }
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
