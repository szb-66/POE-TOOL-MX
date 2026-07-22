import { createHash } from 'node:crypto'
import { gzip, gunzip } from 'node:zlib'
import { access, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)

export const RAW_SNAPSHOT_SCHEMA_VERSION = 1

async function pathExists(target) {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

export function snapshotPatchRoot(root, patch) {
  if (!/^\d+\.\d+(?:\.\d+)?$/.test(patch)) throw new Error(`非法补丁版本：${patch}`)
  return path.join(root, patch)
}

export function sourceFileName(source) {
  const slug = source.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)
  const hash = createHash('sha256').update(source.url).digest('hex').slice(0, 16)
  return `pages/${slug}-${hash}.html.gz`
}

export function contentSha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

export async function readRawManifest(root, patch) {
  const file = path.join(snapshotPatchRoot(root, patch), 'manifest.json')
  if (!await pathExists(file)) return null
  const manifest = JSON.parse(await readFile(file, 'utf8'))
  if (manifest.schemaVersion !== RAW_SNAPSHOT_SCHEMA_VERSION || manifest.patch !== patch || !Array.isArray(manifest.sources)) {
    throw new Error(`原始快照 manifest 无效：${file}`)
  }
  return manifest
}

async function readEntryText(patchRoot, entry) {
  const file = path.resolve(patchRoot, entry.file)
  const pagesRoot = path.resolve(patchRoot, 'pages')
  if (file !== pagesRoot && !file.startsWith(`${pagesRoot}${path.sep}`)) throw new Error(`原始来源路径越界：${entry.file}`)
  const text = (await gunzipAsync(await readFile(file))).toString('utf8')
  const actualHash = contentSha256(text)
  if (actualHash !== entry.sha256) throw new Error(`原始来源内容哈希不匹配：${entry.id}`)
  return text
}

export async function loadRawSnapshot({ root, patch, sources }) {
  const manifest = await readRawManifest(root, patch)
  if (!manifest) throw new Error(`缺少 ${patch} 原始快照；请显式运行 --fetch-missing 或 --live`)
  const byId = new Map(manifest.sources.map((entry) => [entry.id, entry]))
  const texts = new Map()
  for (const source of sources) {
    const entry = byId.get(source.id)
    if (!entry || entry.url !== source.url || entry.category !== source.category || entry.status < 200 || entry.status >= 300) {
      throw new Error(`原始快照缺少或不兼容来源：${source.id}`)
    }
    texts.set(source.id, await readEntryText(snapshotPatchRoot(root, patch), entry))
  }
  return { manifest, texts }
}

function selectRefreshIds(sources, requested) {
  const selected = new Set()
  for (const query of requested) {
    const matches = sources.filter((source) => source.id === query || source.page === query || source.url === query)
    if (!matches.length) throw new Error(`找不到要刷新的来源：${query}`)
    matches.forEach((source) => selected.add(source.id))
  }
  return selected
}

async function writeCompressedAtomic(file, text) {
  await mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.tmp-${process.pid}-${Date.now()}`
  await writeFile(temporary, await gzipAsync(Buffer.from(text, 'utf8'), { level: 9 }))
  await rename(temporary, file)
}

async function writeJsonAtomic(file, value) {
  await mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.tmp-${process.pid}-${Date.now()}`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`)
  await rename(temporary, file)
}

export async function synchronizeRawSnapshot({
  root,
  patch,
  sources,
  mode = 'offline',
  refresh = [],
  fetcher,
  fetchConcurrency = 3,
  now = () => new Date().toISOString(),
  onFetch = () => {}
}) {
  if (!['offline', 'missing', 'refresh', 'full'].includes(mode)) throw new Error(`未知原始快照模式：${mode}`)
  if (mode === 'offline') return loadRawSnapshot({ root, patch, sources })
  if (typeof fetcher !== 'function') throw new Error(`${mode} 模式需要 fetcher`)

  const patchRoot = snapshotPatchRoot(root, patch)
  const existing = await readRawManifest(root, patch)
  const entries = new Map((existing?.sources ?? []).map((entry) => [entry.id, entry]))
  const refreshIds = mode === 'refresh' ? selectRefreshIds(sources, refresh) : new Set()
  if (mode === 'missing') {
    for (const source of sources) {
      if (entries.has(source.id)) continue
      const file = sourceFileName(source)
      const absoluteFile = path.join(patchRoot, file)
      if (!await pathExists(absoluteFile)) continue
      try {
        const text = (await gunzipAsync(await readFile(absoluteFile))).toString('utf8')
        if (!text) continue
        entries.set(source.id, {
          id: source.id,
          url: source.url,
          category: source.category,
          status: 200,
          fetchedAt: (await stat(absoluteFile)).mtime.toISOString(),
          sha256: contentSha256(text),
          file
        })
      } catch {
        // 损坏的孤立文件会在下面按缺失来源重新抓取并原子替换。
      }
    }
  }
  const shouldFetch = async (source) => {
    if (mode === 'full') return true
    if (mode === 'refresh') return refreshIds.has(source.id)
    const entry = entries.get(source.id)
    if (!entry || entry.url !== source.url || entry.category !== source.category || !entry.file) return true
    try {
      await readEntryText(patchRoot, entry)
      return false
    } catch {
      return true
    }
  }

  const pending = []
  for (const source of sources) if (await shouldFetch(source)) pending.push(source)
  let cursor = 0
  async function worker() {
    while (cursor < pending.length) {
      const source = pending[cursor++]
    onFetch(source)
    const result = await fetcher(source.url, source)
    const text = typeof result === 'string' ? result : result?.text
    const status = typeof result === 'string' ? 200 : Number(result?.status)
    if (!text || !Number.isInteger(status) || status < 200 || status >= 300) {
      throw new Error(`${source.id} 抓取失败：HTTP ${Number.isFinite(status) ? status : 'unknown'}`)
    }
    const file = sourceFileName(source)
    await writeCompressedAtomic(path.join(patchRoot, file), text)
    entries.set(source.id, {
      id: source.id,
      url: source.url,
      category: source.category,
      status,
      fetchedAt: now(),
      sha256: contentSha256(text),
      file
    })
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, fetchConcurrency), pending.length) }, () => worker()))

  const missing = sources.filter((source) => !entries.has(source.id))
  if (missing.length) throw new Error(`原始快照仍缺少来源：${missing.map((source) => source.id).join(', ')}`)
  const manifest = {
    schemaVersion: RAW_SNAPSHOT_SCHEMA_VERSION,
    patch,
    sources: sources.map((source) => entries.get(source.id))
  }
  await writeJsonAtomic(path.join(patchRoot, 'manifest.json'), manifest)
  return loadRawSnapshot({ root, patch, sources })
}
