import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { canonicalJson, sha256, verifyEnvelope, decodeObject } from '../../../shared/localizationProtocol.js'

const connectionErrors = new Set(['ECONNREFUSED', 'ECONNRESET', 'ECONNABORTED', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'ENETUNREACH', 'EHOSTUNREACH', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'UND_ERR_SOCKET'])

export function localizationBaseUrl(value = 'http://127.0.0.1:44317', allowLoopbackHttp = true) {
  const url = new URL(value)
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || (url.protocol !== 'https:' && !(allowLoopbackHttp && loopback && url.protocol === 'http:'))) throw new Error('翻译资源地址必须为 HTTPS；内部测试仅允许本机 HTTP 入口')
  return url.origin
}

export function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const next = `${file}.${randomUUID()}.next`
  try { fs.writeFileSync(next, JSON.stringify(value)); fs.renameSync(next, file) }
  finally { if (fs.existsSync(next)) fs.unlinkSync(next) }
}

async function readBounded(response, limit) {
  const length = response.headers.get('content-length')
  if (length && (!/^\d+$/.test(length) || Number(length) > limit)) throw new Error('翻译资源响应大小超出限制')
  const parts = []
  let size = 0
  if (!response.body) return Buffer.alloc(0)
  for await (const part of response.body) {
    size += part.byteLength
    if (size > limit) throw new Error('翻译资源响应大小超出限制')
    parts.push(Buffer.from(part))
  }
  return Buffer.concat(parts)
}

export class LocalizationDownloader {
  constructor({ storageRoot, baseUrl, publicKey, publicKeyFile, allowLoopbackHttp = true, fetchImpl = fetch } = {}) {
    this.storageRoot = storageRoot
    this.baseUrl = localizationBaseUrl(baseUrl, allowLoopbackHttp)
    this.publicKey = publicKey
    this.publicKeyFile = publicKeyFile
    this.fetchImpl = fetchImpl
    this.pending = null
  }
  key() {
    if (this.publicKey) return this.publicKey
    try { return fs.readFileSync(this.publicKeyFile, 'utf8') }
    catch { throw new Error('未配置翻译资源发布公钥，无法验证更新') }
  }
  async request(relative, headers = {}, limit = 2 * 1024 * 1024) {
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${relative}`, { headers, redirect: 'error', signal: AbortSignal.timeout(45000) })
      if (response.status === 304) return { response, bytes: null }
      if (!response.ok) throw Object.assign(new Error(`翻译资源请求失败（HTTP ${response.status}）`), { code: response.status >= 500 && response.status < 600 ? 'LOCALIZATION_RESOURCE_UNAVAILABLE' : 'LOCALIZATION_RESOURCE_HTTP_ERROR' })
      return { response, bytes: await readBounded(response, limit) }
    } catch (error) {
      if (['TimeoutError', 'AbortError'].includes(error.name) || connectionErrors.has(error.code) || connectionErrors.has(error.cause?.code)) {
        throw Object.assign(new Error('无法连接翻译资源服务，请检查网络或 SSH 测试隧道', { cause: error }), { code: 'LOCALIZATION_RESOURCE_UNAVAILABLE' })
      }
      throw error
    }
  }
  objectPath(hash) {
    if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('翻译资源对象标识无效')
    return path.join(this.storageRoot, 'objects', hash)
  }
  cachedObject(descriptor, decodedObjects) {
    try {
      const bytes = fs.readFileSync(this.objectPath(descriptor.sha256))
      const cacheKey = decodedObjects && canonicalJson(descriptor)
      // Reuse only decoding work; every read still verifies the signed object's bytes.
      if (decodedObjects?.has(cacheKey) && bytes.length === descriptor.bytes && sha256(bytes) === descriptor.sha256) {
        return decodedObjects.get(cacheKey)
      }
      const entries = decodeObject(bytes, descriptor)
      decodedObjects?.set(cacheKey, entries)
      return entries
    } catch { return null }
  }
  missing(manifest) { return manifest.objects.filter(object => !this.cachedObject(object)) }
  readEnvelope(file) {
    const value = JSON.parse(fs.readFileSync(path.join(this.storageRoot, file), 'utf8'))
    const envelope = value.envelope || value
    const manifest = verifyEnvelope(envelope, this.key())
    return { envelope, manifest }
  }
  loadBundle({ envelope, manifest }, decodedObjects) {
    const entries = manifest.objects.flatMap(object => {
      const part = this.cachedObject(object, decodedObjects)
      if (!part) throw new Error('翻译缓存缺失或校验失败')
      return part
    })
    if (entries.length !== manifest.entryCount) throw new Error('翻译条目数量不一致')
    return { envelope, manifest, entries }
  }
  load(file = 'active.json', decodedObjects) {
    try { return this.loadBundle(this.readEnvelope(file), decodedObjects) }
    catch { return null }
  }
  loadRevision(releaseId) {
    if (typeof releaseId !== 'string' || !/^[a-zA-Z0-9._-]{1,80}$/.test(releaseId)) return null
    const bundle = this.load(`releases/${releaseId}.json`)
    return bundle?.manifest.releaseId === releaseId ? bundle : null
  }
  loadCachedHistory() {
    let files
    try { files = fs.readdirSync(path.join(this.storageRoot, 'releases'), { withFileTypes: true }) }
    catch { return null }
    const candidates = []
    for (const file of files) {
      if (!file.isFile() || !/^[a-zA-Z0-9._-]{1,80}\.json$/.test(file.name)) continue
      try {
        const candidate = this.readEnvelope(path.join('releases', file.name))
        if (file.name === `${candidate.manifest.releaseId}.json`) candidates.push(candidate)
      } catch { /* 跳过不可信的历史清单 */ }
    }
    const createdAt = candidate => Date.parse(candidate.manifest.createdAt) || 0
    candidates.sort((a, b) => createdAt(b) - createdAt(a) || a.manifest.releaseId.localeCompare(b.manifest.releaseId))
    for (const candidate of candidates) {
      try { return this.loadBundle(candidate) }
      catch { /* 缓存对象不完整，检查下一个历史版本 */ }
    }
    return null
  }
  async check() {
    const key = this.key()
    const channelFile = path.join(this.storageRoot, 'channel.json')
    let cached
    try { cached = JSON.parse(fs.readFileSync(channelFile, 'utf8')) } catch { /* 首次检查 */ }
    const headers = cached?.etag ? { 'if-none-match': cached.etag } : {}
    const { response, bytes } = await this.request('/resources/poe1/steam/stable.json', headers)
    const envelope = response.status === 304 ? cached?.envelope : JSON.parse(bytes.toString('utf8'))
    const manifest = verifyEnvelope(envelope, key)
    this.pending = envelope
    writeJsonAtomic(channelFile, { envelope, etag: response.headers.get('etag') || cached?.etag || '' })
    const missing = this.missing(manifest)
    return { releaseId: manifest.releaseId, gameVersion: manifest.gameVersion, entryCount: manifest.entryCount, missingObjects: missing.length, totalObjects: manifest.objects.length, downloadBytes: missing.reduce((total, object) => total + object.bytes, 0) }
  }
  async download(onProgress = () => {}) {
    if (!this.pending) throw new Error('请先手动检查翻译资源更新')
    const envelope = this.pending
    const manifest = verifyEnvelope(envelope, this.key())
    const missing = this.missing(manifest)
    let downloadedBytes = 0
    for (let index = 0; index < missing.length; index++) {
      const descriptor = missing[index]
      const { bytes } = await this.request(`/resources/objects/${descriptor.sha256}`, {}, descriptor.bytes)
      decodeObject(bytes, descriptor)
      const destination = this.objectPath(descriptor.sha256)
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      const temporary = `${destination}.${randomUUID()}.next`
      try { fs.writeFileSync(temporary, bytes); fs.renameSync(temporary, destination) }
      finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary) }
      downloadedBytes += bytes.length
      onProgress({ phase: 'download', completed: index + 1, total: missing.length, downloadedBytes })
    }
    // Commit only after every object can be decoded, including previously cached objects.
    for (const descriptor of manifest.objects) if (!this.cachedObject(descriptor)) throw new Error('翻译资源未下载完整，已保留旧版本')
    writeJsonAtomic(path.join(this.storageRoot, 'releases', `${manifest.releaseId}.json`), envelope)
    writeJsonAtomic(path.join(this.storageRoot, 'ready.json'), envelope)
    return { releaseId: manifest.releaseId, downloadedBytes, downloadedObjects: missing.length, totalObjects: manifest.objects.length }
  }
  activate(envelope) {
    const manifest = verifyEnvelope(envelope, this.key())
    writeJsonAtomic(path.join(this.storageRoot, 'releases', `${manifest.releaseId}.json`), envelope)
    writeJsonAtomic(path.join(this.storageRoot, 'active.json'), envelope)
    return sha256(canonicalJson(envelope.manifest))
  }
}
