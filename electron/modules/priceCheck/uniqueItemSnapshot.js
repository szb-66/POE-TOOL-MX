import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { load } from 'cheerio'

export const UNIQUE_ITEM_SNAPSHOT_SCHEMA_VERSION = 1
export const UNIQUE_ITEM_PLACEHOLDER_ID = 'placeholder'
export const UNIQUE_ITEM_IMAGE_SCHEME = 'price-check-image'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRoot = path.resolve(moduleDir, '..', '..', 'assets', 'unique-items')
const cleanText = (value) => String(value || '').replace(/\s+/g, ' ').trim()
const identityKey = (name, baseType) => `${cleanText(name)}\u0000${cleanText(baseType)}`

export function uniqueItemImageId(imageUrl) {
  const hash = createHash('sha256').update(String(imageUrl || '')).digest('hex').slice(0, 20)
  return `unique-${hash}`
}

export function uniqueItemImageUrl(imageId = UNIQUE_ITEM_PLACEHOLDER_ID) {
  return `${UNIQUE_ITEM_IMAGE_SCHEME}://snapshot/${encodeURIComponent(imageId)}`
}

export function safeUniqueItemImageId(value) {
  return /^(?:placeholder|unique-[a-f0-9]{20})$/.test(String(value || ''))
    ? String(value)
    : UNIQUE_ITEM_PLACEHOLDER_ID
}

export function parsePoedbUniqueItems(html) {
  const $ = load(String(html || ''))
  const records = []
  $('a.UniqueItem').each((_, anchor) => {
    const node = $(anchor)
    const name = cleanText(node.find('.uniqueName').first().text())
    const baseType = cleanText(node.find('.uniqueTypeLine').first().text())
    if (!name && !baseType) return
    const column = node.closest('.col')
    const imageUrl = cleanText(column.find('a.UniqueItems img, a.UniqueItem img').first().attr('src'))
    records.push({
      key: identityKey(name, baseType),
      name,
      baseType,
      imageId: imageUrl ? uniqueItemImageId(imageUrl) : '',
      imageUrl
    })
  })
  return records
}

export function validateUniqueItemRecords(records, { requireSentinels = true, requireImageUrl = true } = {}) {
  if (!Array.isArray(records) || !records.length) throw new Error('传奇快照解析结果为空')
  const identities = new Set()
  for (const record of records) {
    if (!cleanText(record.name) || !cleanText(record.baseType)) throw new Error('传奇快照存在名称或底材缺失的记录')
    if (
      !/^unique-[a-f0-9]{20}$/.test(record.imageId || '') ||
      (requireImageUrl && !/^https:\/\/cdn\.poedb\.tw\/image\//i.test(record.imageUrl || ''))
    ) {
      throw new Error(`传奇 ${record.name} 缺少可信图片`)
    }
    const key = identityKey(record.name, record.baseType)
    if (identities.has(key)) throw new Error(`传奇快照存在重复身份：${record.name} ${record.baseType}`)
    identities.add(key)
  }
  if (requireSentinels) {
    for (const name of ['猎首', '法师之血']) {
      if (!records.some((record) => record.name === name)) throw new Error(`传奇快照缺少哨兵：${name}`)
    }
  }
  return records
}

export function validateUniqueItemCatalog(catalog, { requireSentinels = true } = {}) {
  if (!catalog || catalog.schemaVersion !== UNIQUE_ITEM_SNAPSHOT_SCHEMA_VERSION) throw new Error('传奇图片目录 schema 不兼容')
  if (catalog.game !== 'poe1' || catalog.locale !== 'zh-CN' || !catalog.patch) throw new Error('传奇图片目录版本元数据无效')
  validateUniqueItemRecords(catalog.items, { requireImageUrl: false, requireSentinels })
  if (!catalog.images || catalog.images[UNIQUE_ITEM_PLACEHOLDER_ID] !== 'images/placeholder.svg') {
    throw new Error('传奇图片目录缺少占位图')
  }
  for (const record of catalog.items) {
    if (!catalog.images[record.imageId]) throw new Error(`传奇 ${record.name} 的图片未写入目录`)
  }
  return catalog
}

export async function loadUniqueItemCatalog(root = defaultRoot) {
  const catalog = validateUniqueItemCatalog(JSON.parse(await readFile(path.join(root, 'catalog.json'), 'utf8')))
  return { root, catalog }
}

export function enrichOfficialItemsWithImages(items, catalog) {
  const imageByIdentity = new Map((catalog?.items || []).map((entry) => [
    identityKey(entry.name, entry.baseType),
    entry.imageId
  ]))
  const hasCurrentPatchCoverage = Boolean(catalog?.patch && catalog.patch !== 'fallback')
  return (items || []).map((entry) => {
    const imageId = imageByIdentity.get(identityKey(entry.name, entry.baseType)) || UNIQUE_ITEM_PLACEHOLDER_ID
    return {
      ...entry,
      legacy: entry.unique === true && hasCurrentPatchCoverage && imageId === UNIQUE_ITEM_PLACEHOLDER_ID,
      imageId,
      imageUrl: uniqueItemImageUrl(imageId)
    }
  })
}

export class UniqueItemImageRepository {
  constructor(root = defaultRoot) {
    this.root = root
    this.catalog = null
  }

  async load() {
    const loaded = await loadUniqueItemCatalog(this.root)
    this.catalog = loaded.catalog
    return this.catalog
  }

  useFallback() {
    this.catalog = {
      schemaVersion: UNIQUE_ITEM_SNAPSHOT_SCHEMA_VERSION,
      game: 'poe1',
      locale: 'zh-CN',
      patch: 'fallback',
      generatedAt: new Date(0).toISOString(),
      sources: [],
      items: [],
      images: { [UNIQUE_ITEM_PLACEHOLDER_ID]: 'images/placeholder.svg' }
    }
    return this.catalog
  }

  imageInfo(imageId) {
    if (!this.catalog || safeUniqueItemImageId(imageId) !== imageId) return null
    const relativeFile = this.catalog.images[imageId]
    if (!relativeFile) return null
    const file = path.resolve(this.root, relativeFile)
    const imageRoot = path.resolve(this.root, 'images')
    if (file !== imageRoot && !file.startsWith(`${imageRoot}${path.sep}`)) return null
    return { file, url: pathToFileURL(file).toString() }
  }
}

export function registerUniqueItemImageProtocol({ protocol, net, repository }) {
  protocol.handle(UNIQUE_ITEM_IMAGE_SCHEME, async (request) => {
    try {
      const url = new URL(request.url)
      if (url.hostname !== 'snapshot' || url.search || url.hash) return new Response('Bad request', { status: 400 })
      const imageId = decodeURIComponent(url.pathname.replace(/^\//, ''))
      const info = repository.imageInfo(imageId)
      if (!info) return new Response('Not found', { status: 404 })
      return net.fetch(info.url)
    } catch {
      return new Response('Bad request', { status: 400 })
    }
  })
}
