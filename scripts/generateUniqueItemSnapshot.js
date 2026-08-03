import { createHash } from 'node:crypto'
import { access, copyFile, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  parsePoedbUniqueItems,
  UNIQUE_ITEM_PLACEHOLDER_ID,
  UNIQUE_ITEM_SNAPSHOT_SCHEMA_VERSION,
  validateUniqueItemCatalog,
  validateUniqueItemRecords
} from '../electron/modules/priceCheck/uniqueItemSnapshot.js'
import { synchronizeRawSnapshot } from './craftingRawSnapshot.js'
import { SEASON_BASELINE, S30_UNIQUE_SENTINELS } from '../shared/seasonBaseline.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '..')
const outputRoot = path.join(projectRoot, 'electron', 'assets', 'unique-items')
const rawRoot = path.join(projectRoot, 'electron', 'assets', 'unique-items-raw')
const fixtureRoot = path.join(projectRoot, 'test', 'fixtures', 'unique-items')
const CURRENT_PATCH = SEASON_BASELINE.patch
const PAGE_SOURCE = {
  id: 'unique-items',
  page: 'Unique_item',
  url: 'https://poedb.tw/cn/Unique_item',
  category: 'unique-items'
}

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')
const imageFileStem = (url) => createHash('sha256').update(url).digest('hex').slice(0, 24)
const imageFileName = (url, extension = '.webp') => `${imageFileStem(url)}${extension}`

async function pathExists(target) {
  try { await access(target); return true } catch { return false }
}

async function fetchWithRetry(url, label) {
  let lastError
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'ExileHelper/1.0 personal-data-refresh' },
        signal: AbortSignal.timeout(60000)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response
    } catch (error) {
      lastError = error
      if (attempt < 8) await new Promise((resolve) => setTimeout(resolve, Math.min(15000, attempt * 1500)))
    }
  }
  throw new Error(`${label}抓取失败：${lastError?.message || '网络错误'}`, { cause: lastError })
}

async function fetchText(url) {
  const response = await fetchWithRetry(url, '传奇页面')
  return { status: response.status, text: await response.text() }
}

async function fetchImage(url) {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'cdn.poedb.tw' || !parsed.pathname.startsWith('/image/')) {
    throw new Error(`拒绝抓取非白名单传奇图片：${url}`)
  }
  let response
  try {
    response = await fetch(url, {
      headers: { 'user-agent': 'ExileHelper/1.0 personal-data-refresh' },
      signal: AbortSignal.timeout(60000)
    })
  } catch {
    response = await fetchWithRetry(url, '传奇图片')
  }
  let extension = '.webp'
  if (response.status === 403 || response.status === 404) {
    const fallbackUrl = new URL(url)
    fallbackUrl.hostname = 'web.poecdn.com'
    fallbackUrl.pathname = fallbackUrl.pathname.replace(/^\/image\//, '/image/').replace(/\.webp$/i, '.png')
    response = await fetchWithRetry(fallbackUrl.toString(), '官方传奇图片')
    extension = '.png'
  } else if (!response.ok) {
    response = await fetchWithRetry(url, '传奇图片')
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length < 32) throw new Error(`传奇图片内容异常：${url}`)
  return { buffer, extension }
}

function parseArguments(args) {
  const fixture = args.includes('--fixture')
  const modes = [args.includes('--live'), args.includes('--fetch-missing'), args.includes('--refresh')].filter(Boolean)
  if (!fixture && modes.length > 1) throw new Error('--live、--fetch-missing 与 --refresh 只能选择一个')
  const patchIndex = args.indexOf('--patch')
  const patch = patchIndex >= 0 ? args[patchIndex + 1] : CURRENT_PATCH
  if (!/^\d+\.\d+(?:\.\d+)?$/.test(patch || '')) throw new Error(`非法补丁版本：${patch}`)
  return {
    fixture,
    patch,
    pageMode: fixture ? 'fixture' : args.includes('--fetch-missing') ? 'missing' : (args.includes('--live') || args.includes('--refresh')) ? 'full' : 'offline',
    imageMode: fixture ? 'fixture' : args.includes('--fetch-missing') ? 'missing' : (args.includes('--live') || args.includes('--refresh')) ? 'full' : 'offline'
  }
}

async function readImageManifest(patchRoot) {
  const file = path.join(patchRoot, 'images.json')
  if (!await pathExists(file)) return { schemaVersion: 1, images: [] }
  const value = JSON.parse(await readFile(file, 'utf8'))
  if (value.schemaVersion !== 1 || !Array.isArray(value.images)) throw new Error('传奇原始图片 manifest 无效')
  return value
}

async function validateRawImage(patchRoot, entry) {
  const file = path.resolve(patchRoot, entry.file)
  const imageRoot = path.resolve(patchRoot, 'images')
  if (!file.startsWith(`${imageRoot}${path.sep}`)) throw new Error(`传奇原始图片路径越界：${entry.file}`)
  const buffer = await readFile(file)
  if (sha256(buffer) !== entry.sha256) throw new Error(`传奇原始图片哈希不匹配：${entry.url}`)
  return buffer
}

async function synchronizeRawImages({ patchRoot, records, mode, concurrency = 6 }) {
  const existing = await readImageManifest(patchRoot)
  const entries = new Map(existing.images.map((entry) => [entry.url, entry]))
  const urls = [...new Set(records.map((record) => record.imageUrl))]
  const pending = []
  for (const url of urls) {
    let entry = entries.get(url)
    if (!entry) {
      for (const extension of ['.webp', '.png']) {
        const relativeFile = `images/${imageFileName(url, extension)}`
        const file = path.join(patchRoot, relativeFile)
        if (await pathExists(file)) {
          const buffer = await readFile(file)
          entry = {
            url,
            file: relativeFile,
            sha256: sha256(buffer),
            fetchedAt: (await stat(file)).mtime.toISOString()
          }
          entries.set(url, entry)
          break
        }
      }
    }
    let valid = false
    if (entry) {
      try { await validateRawImage(patchRoot, entry); valid = true } catch { valid = false }
    }
    if (mode === 'full' || (mode === 'missing' && !valid)) pending.push(url)
    else if (!valid) throw new Error(`缺少传奇原始图片；请运行 --fetch-missing：${url}`)
  }
  let cursor = 0
  let completed = 0
  async function worker() {
    while (cursor < pending.length) {
      const url = pending[cursor++]
      const { buffer, extension } = await fetchImage(url)
      const relativeFile = `images/${imageFileName(url, extension)}`
      const file = path.join(patchRoot, relativeFile)
      await mkdir(path.dirname(file), { recursive: true })
      const temporary = `${file}.tmp-${process.pid}`
      await writeFile(temporary, buffer)
      await rename(temporary, file)
      entries.set(url, {
        url,
        file: relativeFile,
        sha256: sha256(buffer),
        fetchedAt: new Date().toISOString()
      })
      completed += 1
      if (completed % 100 === 0 || completed === pending.length) {
        process.stdout.write(`已抓取传奇图片 ${completed}/${pending.length}\n`)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, () => worker()))
  const manifest = {
    schemaVersion: 1,
    patch: path.basename(patchRoot),
    images: urls.sort().map((url) => entries.get(url))
  }
  const manifestFile = path.join(patchRoot, 'images.json')
  const temporary = `${manifestFile}.tmp-${process.pid}`
  await writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`)
  await rename(temporary, manifestFile)
  return { manifest, entries }
}

async function buildOutput({ patch, records, rawImages, generatedAt, targetRoot, requireSentinels = true }) {
  const imagesRoot = path.join(targetRoot, 'images')
  await mkdir(imagesRoot, { recursive: true })
  await copyFile(path.join(fixtureRoot, 'placeholder.svg'), path.join(imagesRoot, 'placeholder.svg'))
  const images = { [UNIQUE_ITEM_PLACEHOLDER_ID]: 'images/placeholder.svg' }
  const copied = new Set()
  for (const record of records) {
    const raw = rawImages.entries.get(record.imageUrl)
    if (!raw) throw new Error(`传奇 ${record.name} 缺少原始图片`)
    const targetName = `${record.imageId}-${raw.sha256.slice(0, 12)}${path.extname(raw.file)}`
    if (!copied.has(record.imageId)) {
      await copyFile(path.join(rawImages.patchRoot, raw.file), path.join(imagesRoot, targetName))
      copied.add(record.imageId)
    }
    images[record.imageId] = `images/${targetName}`
  }
  const catalog = validateUniqueItemCatalog({
    schemaVersion: UNIQUE_ITEM_SNAPSHOT_SCHEMA_VERSION,
    game: 'poe1',
    locale: 'zh-CN',
    patch,
    generatedAt,
    sources: [PAGE_SOURCE.url],
    items: records.map(({ key, name, baseType, imageId }) => ({ key, name, baseType, imageId })),
    images
  }, { requireSentinels })
  await writeFile(path.join(targetRoot, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`)
}

async function publishOutput(stagingRoot) {
  const catalog = JSON.parse(await readFile(path.join(stagingRoot, 'catalog.json'), 'utf8'))
  const imageFiles = [...new Set(Object.values(catalog.images))]
  await mkdir(path.join(outputRoot, 'images'), { recursive: true })
  for (const relativeFile of imageFiles) {
    const source = path.join(stagingRoot, relativeFile)
    const target = path.join(outputRoot, relativeFile)
    if (await pathExists(target)) continue
    const temporary = `${target}.tmp-${process.pid}`
    await copyFile(source, temporary)
    await rename(temporary, target)
  }
  const catalogTarget = path.join(outputRoot, 'catalog.json')
  const catalogTemporary = `${catalogTarget}.tmp-${process.pid}`
  await copyFile(path.join(stagingRoot, 'catalog.json'), catalogTemporary)
  await rename(catalogTemporary, catalogTarget)
  const referenced = new Set(imageFiles.map((relativeFile) => path.basename(relativeFile)))
  for (const fileName of await readdir(path.join(outputRoot, 'images'))) {
    if (!referenced.has(fileName)) await rm(path.join(outputRoot, 'images', fileName), { force: true })
  }
}

export async function generateUniqueItemSnapshot(args = process.argv.slice(2)) {
  const options = parseArguments(args)
  let html
  let generatedAt
  let patchRoot
  if (options.fixture) {
    html = await readFile(path.join(fixtureRoot, 'unique-items.html'), 'utf8')
    generatedAt = new Date().toISOString()
    patchRoot = fixtureRoot
  } else {
    const raw = await synchronizeRawSnapshot({
      root: rawRoot,
      patch: options.patch,
      sources: [PAGE_SOURCE],
      mode: options.pageMode,
      fetcher: fetchText,
      onFetch: () => process.stdout.write('正在抓取传奇物品页面\n')
    })
    html = raw.texts.get(PAGE_SOURCE.id)
    generatedAt = raw.manifest.sources[0].fetchedAt
    patchRoot = path.join(rawRoot, options.patch)
  }
  const records = validateUniqueItemRecords(parsePoedbUniqueItems(html), { requireSentinels: !options.fixture })
  if (!options.fixture && options.patch === SEASON_BASELINE.patch) {
    const missing = S30_UNIQUE_SENTINELS.filter((name) => !records.some((record) => record.name === name))
    if (missing.length) throw new Error(`传奇目录缺少 S30 哨兵：${missing.join('、')}`)
  }
  let rawImages
  if (options.fixture) {
    const fixtureManifest = await readImageManifest(fixtureRoot)
    rawImages = { patchRoot: fixtureRoot, entries: new Map(fixtureManifest.images.map((entry) => [entry.url, entry])) }
  } else {
    rawImages = {
      patchRoot,
      ...(await synchronizeRawImages({ patchRoot, records, mode: options.imageMode }))
    }
  }
  const stagingRoot = `${outputRoot}.staging-${process.pid}`
  await rm(stagingRoot, { recursive: true, force: true })
  await mkdir(stagingRoot, { recursive: true })
  try {
    await buildOutput({
      patch: options.patch,
      records,
      rawImages,
      generatedAt,
      targetRoot: stagingRoot,
      requireSentinels: !options.fixture
    })
    if (!options.fixture) await publishOutput(stagingRoot)
    return { records: records.length, images: new Set(records.map((record) => record.imageId)).size }
  } finally {
    await rm(stagingRoot, { recursive: true, force: true })
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateUniqueItemSnapshot().then((result) => {
    process.stdout.write(`传奇图片目录生成完成：${result.records} 条 / ${result.images} 张\n`)
  }).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
