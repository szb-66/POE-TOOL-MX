import { createHash } from 'node:crypto'
import { readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import OpenCC from 'opencc-js'
import { SEASON_BASELINE } from '../shared/seasonBaseline.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '..')
const outputFile = path.join(projectRoot, 'electron', 'assets', 'item-footprints.json')
const craftingFile = path.join(projectRoot, 'electron', 'assets', 'crafting-data', 'dataset.json')
const EXPECTED_CRAFTING_BASES = 995
const REPOE_ROOT = 'https://repoe-fork.github.io'
const SOURCES = Object.freeze({
  repoeIndex: `${REPOE_ROOT}/Traditional%20Chinese/`,
  repoeBases: `${REPOE_ROOT}/base_items.min.json`,
  localizedBases: `${REPOE_ROOT}/Traditional%20Chinese/base_items.min.json`,
  localizedClasses: `${REPOE_ROOT}/Traditional%20Chinese/item_classes.min.json`,
  officialItems: 'https://poe.game.qq.com/api/trade/data/items'
})

const compact = (value) => String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ')
const decodeIdentity = (value) => {
  try { return decodeURIComponent(String(value || '')) } catch { return String(value || '') }
}
const identity = (value) => compact(decodeIdentity(value)).toLocaleLowerCase('en').replace(/[^a-z0-9]/g, '')
const dimensionKey = ({ width, height }) => `${width}x${height}`
const sha256 = (value) => createHash('sha256').update(value).digest('hex')

function validDimension(value) {
  const width = Number(value?.inventory_width ?? value?.width)
  const height = Number(value?.inventory_height ?? value?.height)
  return Number.isInteger(width) && Number.isInteger(height) && width >= 1 && width <= 12 && height >= 1 && height <= 12
    ? { width, height }
    : null
}

function humanizeItemClass(value) {
  return compact(value).replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}

function exactRepoKey(name, itemClass) {
  return `${identity(name)}\u001f${identity(itemClass)}`
}

function addCandidate(target, name, record) {
  const key = compact(name)
  if (!key) return
  const values = target.get(key) || []
  values.push(record)
  target.set(key, values)
}

function uniqueDimension(records) {
  const dimensions = new Map()
  for (const record of records) {
    const value = validDimension(record)
    if (value) dimensions.set(dimensionKey(value), value)
  }
  return dimensions.size === 1 ? dimensions.values().next().value : null
}

function officialNames(payload) {
  if (!Array.isArray(payload?.result)) throw new Error('腾讯官方物品目录响应结构无效')
  return new Set(payload.result.flatMap((group) => group?.entries || [])
    .flatMap((entry) => [entry?.type, entry?.name])
    .map(compact).filter(Boolean))
}

export function parseRepoeVersion(html) {
  const match = String(html || '').match(/PoE version\s+(\d+\.\d+(?:\.\d+)*)/i)
  if (!match) throw new Error('无法识别 RePoE 游戏版本')
  return match[1]
}

export function validateItemFootprintCatalog(catalog, expectedCraftingBases = EXPECTED_CRAFTING_BASES) {
  if (catalog?.schemaVersion !== 1 || catalog?.game !== 'poe1' || !/^\d+\.\d+$/.test(catalog?.gameVersion || '')) {
    throw new Error('物品占位目录版本元数据无效')
  }
  if (!Number.isFinite(Date.parse(catalog.generatedAt)) || !Array.isArray(catalog.sources) || !catalog.sources.length) {
    throw new Error('物品占位目录来源元数据无效')
  }
  if (catalog.sources.some((source) => !compact(source?.id) || !/^[a-f0-9]{64}$/.test(source?.sha256 || ''))) {
    throw new Error('物品占位目录来源哈希无效')
  }
  if (!Array.isArray(catalog.categories) || !Array.isArray(catalog.items)) throw new Error('物品占位目录记录结构无效')
  if (catalog.audit?.craftingBases !== expectedCraftingBases || catalog.audit?.craftingResolved !== expectedCraftingBases) {
    throw new Error(`做装基底占位覆盖不足：${catalog.audit?.craftingResolved || 0}/${expectedCraftingBases}`)
  }
  const itemNames = new Set()
  for (const entry of catalog.items) {
    const name = compact(entry?.baseName || entry?.name)
    if (!name || !validDimension(entry)) throw new Error(`无效物品占位：${name || '<空名称>'}`)
    const key = name.toLocaleLowerCase('zh-CN')
    if (itemNames.has(key)) throw new Error(`重复物品占位：${name}`)
    itemNames.add(key)
  }
  const aliases = new Set()
  for (const entry of catalog.categories) {
    if (!validDimension(entry) || !Array.isArray(entry?.aliases) || !entry.aliases.length) throw new Error('无效类别占位')
    for (const alias of entry.aliases.map(compact).filter(Boolean)) {
      const key = alias.toLocaleLowerCase('zh-CN')
      if (aliases.has(key)) throw new Error(`重复类别占位：${alias}`)
      aliases.add(key)
    }
  }
  return catalog
}

export function buildItemFootprintCatalog({
  gameVersion,
  repoeVersion,
  craftingDataset,
  repoeBaseItems,
  localizedBaseItems,
  localizedItemClasses,
  officialItemsPayload,
  toSimplified = (value) => value,
  generatedAt = new Date().toISOString(),
  sources = [],
  expectedCraftingBases = EXPECTED_CRAFTING_BASES
}) {
  if (gameVersion !== craftingDataset?.manifest?.patch) throw new Error('做装目录与目标游戏版本不一致')
  if (!(repoeVersion === gameVersion || repoeVersion.startsWith(`${gameVersion}.`))) throw new Error('RePoE 与目标游戏版本不一致')
  if (!repoeBaseItems || !localizedBaseItems || !localizedItemClasses) throw new Error('RePoE 数据不完整')
  const craftingBases = Array.isArray(craftingDataset.bases) ? craftingDataset.bases : []
  if (craftingBases.length !== expectedCraftingBases) {
    throw new Error(`做装基底数量异常：${craftingBases.length}/${expectedCraftingBases}`)
  }

  const repoByIdentity = new Map()
  for (const [sourceId, record] of Object.entries(repoeBaseItems)) {
    const footprint = validDimension(record)
    if (!footprint || !record?.name || !record?.item_class) continue
    const key = exactRepoKey(record.name, record.item_class)
    const values = repoByIdentity.get(key) || []
    values.push({ sourceId, ...footprint })
    repoByIdentity.set(key, values)
  }

  const candidatesByName = new Map()
  let craftingResolved = 0
  for (const base of craftingBases) {
    const matches = repoByIdentity.get(exactRepoKey(base.sourceId, base.itemClass)) || []
    const footprint = uniqueDimension(matches)
    if (!footprint) throw new Error(`做装基底无法唯一关联尺寸：${base.name} (${base.sourceId}/${base.itemClass})`)
    craftingResolved += 1
    addCandidate(candidatesByName, base.name, { ...footprint, source: 'poedb-repoe-identity', local: true })
  }

  const names = officialNames(officialItemsPayload)
  const localizedByName = new Map()
  for (const [sourceId, record] of Object.entries(localizedBaseItems)) {
    const footprint = validDimension(record)
    const name = compact(toSimplified(record?.name || ''))
    if (!footprint || !name || !names.has(name)) continue
    addCandidate(localizedByName, name, { sourceId, ...footprint, source: 'repoe-cn-official' })
  }

  let officialMatched = 0
  let officialAmbiguous = 0
  for (const [name, records] of localizedByName) {
    const footprint = uniqueDimension(records)
    if (!footprint) {
      officialAmbiguous += 1
      continue
    }
    officialMatched += 1
    addCandidate(candidatesByName, name, { ...footprint, source: 'repoe-cn-official', local: false })
  }

  const items = []
  for (const [name, records] of candidatesByName) {
    const footprint = uniqueDimension(records)
    if (!footprint) {
      if (records.some((record) => record.local)) throw new Error(`做装基底中文名称存在尺寸冲突：${name}`)
      officialAmbiguous += 1
      continue
    }
    items.push({ name, ...footprint, source: records.some((record) => record.local) ? 'poedb-repoe-identity' : 'repoe-cn-official' })
  }
  items.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))

  const classDimensions = new Map()
  for (const record of Object.values(repoeBaseItems)) {
    if (record?.release_state === 'unreleased') continue
    const footprint = validDimension(record)
    const itemClass = compact(record?.item_class)
    if (!footprint || !itemClass) continue
    const values = classDimensions.get(itemClass) || new Map()
    values.set(dimensionKey(footprint), footprint)
    classDimensions.set(itemClass, values)
  }
  const aliasDimensions = new Map()
  for (const [itemClass, dimensions] of classDimensions) {
    const localized = localizedItemClasses[itemClass] || {}
    const aliases = [itemClass, humanizeItemClass(itemClass), localized.name, localized.category, localized.category_id]
      .map((value) => compact(toSimplified(value || ''))).filter(Boolean)
    for (const alias of aliases) {
      const values = aliasDimensions.get(alias) || new Map()
      for (const [key, footprint] of dimensions) values.set(key, footprint)
      aliasDimensions.set(alias, values)
    }
  }
  const safeClasses = []
  for (const [itemClass, dimensions] of classDimensions) {
    if (dimensions.size !== 1) continue
    const localized = localizedItemClasses[itemClass] || {}
    const aliases = [itemClass, humanizeItemClass(itemClass), localized.name, localized.category, localized.category_id]
      .map((value) => compact(toSimplified(value || '')))
      .filter((alias) => alias && aliasDimensions.get(alias)?.size === 1)
    if (aliases.length) safeClasses.push({ aliases: [...new Set(aliases)], ...dimensions.values().next().value })
  }
  const parents = safeClasses.map((_, index) => index)
  const find = (index) => parents[index] === index ? index : (parents[index] = find(parents[index]))
  const owners = new Map()
  safeClasses.forEach((entry, index) => {
    for (const alias of entry.aliases) {
      if (owners.has(alias)) parents[find(index)] = find(owners.get(alias))
      else owners.set(alias, index)
    }
  })
  const categoryGroups = new Map()
  safeClasses.forEach((entry, index) => {
    const root = find(index)
    const group = categoryGroups.get(root) || { aliases: [], width: entry.width, height: entry.height }
    group.aliases.push(...entry.aliases)
    categoryGroups.set(root, group)
  })
  const categories = [...categoryGroups.values()].map((entry) => ({
    ...entry,
    aliases: [...new Set(entry.aliases)].sort((left, right) => left.localeCompare(right, 'zh-CN'))
  })).sort((left, right) => left.width - right.width || left.height - right.height || left.aliases[0].localeCompare(right.aliases[0], 'zh-CN'))

  return validateItemFootprintCatalog({
    schemaVersion: 1,
    game: 'poe1',
    gameVersion,
    generatedAt,
    sources,
    audit: {
      craftingBases: craftingBases.length,
      craftingResolved,
      officialNames: names.size,
      officialMatched,
      officialAmbiguous,
      itemRecords: items.length,
      categoryAliases: categories.reduce((sum, entry) => sum + entry.aliases.length, 0)
    },
    categories,
    items
  }, expectedCraftingBases)
}

async function fetchBuffer(url, headers = {}) {
  let lastError
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'ExileHelper/1.0 item-footprint-refresh', ...headers },
        signal: AbortSignal.timeout(60000)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      lastError = error
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
    }
  }
  throw new Error(`数据抓取失败：${url}：${lastError?.message || '网络错误'}`)
}

function sourceRecord(id, url, buffer, version = '') {
  return { id, url, ...(version ? { version } : {}), sha256: sha256(buffer) }
}

export async function generateItemFootprints(args = process.argv.slice(2)) {
  const versionIndex = args.indexOf('--game-version')
  const gameVersion = versionIndex >= 0 ? args[versionIndex + 1] : ''
  if (!/^\d+\.\d+$/.test(gameVersion || '')) throw new Error('必须使用 --game-version <主版本.次版本>，例如 3.29')
  if (gameVersion !== SEASON_BASELINE.patch) throw new Error(`当前项目基线为 ${SEASON_BASELINE.patch}，拒绝生成 ${gameVersion} 目录`)

  const craftingBuffer = await readFile(craftingFile)
  const [indexBuffer, repoBuffer, localizedBuffer, classesBuffer, officialBuffer] = await Promise.all([
    fetchBuffer(SOURCES.repoeIndex),
    fetchBuffer(SOURCES.repoeBases),
    fetchBuffer(SOURCES.localizedBases),
    fetchBuffer(SOURCES.localizedClasses),
    fetchBuffer(SOURCES.officialItems, { Origin: 'https://poe.game.qq.com', 'X-Requested-With': 'XMLHttpRequest' })
  ])
  const repoeVersion = parseRepoeVersion(indexBuffer.toString('utf8'))
  const catalog = buildItemFootprintCatalog({
    gameVersion,
    repoeVersion,
    craftingDataset: JSON.parse(craftingBuffer),
    repoeBaseItems: JSON.parse(repoBuffer),
    localizedBaseItems: JSON.parse(localizedBuffer),
    localizedItemClasses: JSON.parse(classesBuffer),
    officialItemsPayload: JSON.parse(officialBuffer),
    toSimplified: OpenCC.Converter({ from: 'tw', to: 'cn' }),
    sources: [
      { id: 'poedb-crafting-dataset', file: 'electron/assets/crafting-data/dataset.json', version: gameVersion, sha256: sha256(craftingBuffer) },
      sourceRecord('repoe-version-index', SOURCES.repoeIndex, indexBuffer, repoeVersion),
      sourceRecord('repoe-base-items', SOURCES.repoeBases, repoBuffer, repoeVersion),
      sourceRecord('repoe-zh-tw-base-items', SOURCES.localizedBases, localizedBuffer, repoeVersion),
      sourceRecord('repoe-zh-tw-item-classes', SOURCES.localizedClasses, classesBuffer, repoeVersion),
      sourceRecord('tencent-trade-items', SOURCES.officialItems, officialBuffer, gameVersion)
    ]
  })
  const temporary = `${outputFile}.tmp-${process.pid}-${Date.now()}`
  await writeFile(temporary, `${JSON.stringify(catalog, null, 2)}\n`)
  await rename(temporary, outputFile)
  return catalog.audit
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateItemFootprints().then((audit) => {
    process.stdout.write(`物品占位目录生成完成：${audit.itemRecords} 条物品 / ${audit.categoryAliases} 个类别别名 / 做装 ${audit.craftingResolved}/${audit.craftingBases}\n`)
  }).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
