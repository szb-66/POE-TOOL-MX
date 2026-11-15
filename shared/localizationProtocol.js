import { createHash, createPrivateKey, createPublicKey, sign, verify, randomUUID } from 'node:crypto'
import { gzipSync, gunzipSync } from 'node:zlib'

export const PROTOCOL_VERSION = 1
export const ENGINE_VERSION = 1
export const MAX_OBJECT_BYTES = 16 * 1024 * 1024
const invalid = message => Object.assign(new Error(message), { code: 'TRANSLATION_INVALID', status: 400 })
export function sha256(value) { return createHash('sha256').update(value).digest('hex') }
export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
}
function plain(value) { return value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype }
function string(value, name, max = 65536) {
  if (typeof value !== 'string' || value.length > max || value.includes('\0')) throw invalid(`${name} 无效`)
  return value
}
export function entryKey(entry) { return `${entry.table}\0${entry.id}\0${entry.field}` }
export function entryBucket(entry) { return `${sha256(entry.table).slice(0, 16)}-${sha256(entryKey(entry)).slice(0, 1)}` }
export function validateEntry(value) {
  if (!plain(value)) throw invalid('翻译条目必须是对象')
  const { table, id, field, en, kind = 'dat' } = value
  for (const [name, item] of Object.entries({ table, id, field })) {
    string(item, name, 512)
    if (!item || /[\r\n]/.test(item)) throw invalid(`${name} 不能为空或包含换行`)
  }
  string(en, 'en')
  if (!en || !['dat', 'stat'].includes(kind)) throw invalid('英文原文或条目类型无效')
  const sourceHash = sha256(en)
  if (value.sourceHash !== undefined && value.sourceHash !== sourceHash) throw invalid('英文原文哈希不一致')
  const entry = { table, id, field, en, kind, sourceHash }
  for (const locale of ['tw', 'cn']) if (value[locale] !== undefined) entry[locale] = string(value[locale], locale)
  if (kind === 'stat') {
    const stats = value.stats
    if (!plain(stats) || !Array.isArray(stats.ids) || !stats.ids.length || stats.ids.length > 64 || !stats.ids.every(item => typeof item === 'string' && item && item.length < 512) || !Array.isArray(stats.variants) || !stats.variants.length || stats.variants.length > 512) throw invalid('词缀条目缺少结构校验信息')
    entry.stats = { ids: stats.ids.map(item => string(item, 'stat id', 512)), variants: stats.variants.map(variant => {
      if (!plain(variant) || !Array.isArray(variant.placeholders) || variant.placeholders.length > 64) throw invalid('词缀变体结构无效')
      return { condition: string(variant.condition, 'condition', 4096), handlers: string(variant.handlers, 'handlers', 4096), placeholders: variant.placeholders.map(item => string(item, 'placeholder', 128)) }
    }) }
  }
  return entry
}
export function validateDataset(value) {
  if (!plain(value) || value.protocolVersion !== 1 || value.engineVersion !== 1 || !Array.isArray(value.entries) || !value.entries.length || value.entries.length > 500000) throw invalid('资源包协议、引擎或条目数量无效')
  if (typeof value.gameVersion !== 'string' || !/^[a-zA-Z0-9._-]{1,64}$/.test(value.gameVersion)) throw invalid('游戏版本无效')
  const seen = new Set()
  const entries = value.entries.map(item => { const entry = validateEntry(item); const key = entryKey(entry); if (seen.has(key)) throw invalid('存在重复条目标识'); seen.add(key); return entry })
  const cnGameVersion = value.cnGameVersion === undefined ? null : string(value.cnGameVersion, 'cnGameVersion', 64)
  return { protocolVersion: 1, engineVersion: 1, gameVersion: value.gameVersion, cnGameVersion, entries }
}
export function buildRelease(input, privateKey, { releaseId = randomUUID(), createdAt = new Date().toISOString() } = {}) {
  const dataset = validateDataset(input)
  const buckets = new Map()
  // Keep table families independent: a delayed CN name table must not force the
  // unchanged stat/UI dictionaries to download again. Fixed key buckets remain
  // stable as entries are added or removed.
  for (const entry of dataset.entries) { const bucket = entryBucket(entry); if (!buckets.has(bucket)) buckets.set(bucket, []); buckets.get(bucket).push(entry) }
  const objects = []
  const blobs = new Map()
  for (const [bucket, entries] of [...buckets].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    entries.sort((a, b) => entryKey(a) < entryKey(b) ? -1 : entryKey(a) > entryKey(b) ? 1 : 0)
    const raw = Buffer.from(canonicalJson({ protocolVersion: 1, entries }))
    if (raw.length > MAX_OBJECT_BYTES) throw invalid('分片过大，请减少单个资源包的条目')
    const bytes = gzipSync(raw, { level: 9, mtime: 0 })
    const hash = sha256(bytes)
    objects.push({ bucket, sha256: hash, bytes: bytes.length, uncompressedBytes: raw.length, entries: entries.length })
    blobs.set(hash, bytes)
  }
  const manifest = { protocolVersion: 1, engineVersion: 1, releaseId, gameVersion: dataset.gameVersion, cnGameVersion: dataset.cnGameVersion, createdAt, objects, entryCount: dataset.entries.length }
  const key = createPrivateKey(privateKey)
  if (key.asymmetricKeyType !== 'ed25519') throw invalid('发布密钥必须是 Ed25519')
  const keyId = sha256(createPublicKey(key).export({ type: 'spki', format: 'der' })).slice(0, 16)
  const envelope = { manifest, signature: sign(null, Buffer.from(canonicalJson(manifest)), key).toString('base64'), keyId }
  return { envelope, manifestHash: sha256(canonicalJson(manifest)), blobs }
}
export function verifyEnvelope(envelope, publicKey, { engineVersion = 1 } = {}) {
  if (!plain(envelope) || !plain(envelope.manifest) || typeof envelope.signature !== 'string' || !/^[A-Za-z0-9+/]{86}==$/.test(envelope.signature)) throw invalid('资源签名格式无效')
  const key = createPublicKey(publicKey)
  const keyId = sha256(key.export({ type: 'spki', format: 'der' })).slice(0, 16)
  if (key.asymmetricKeyType !== 'ed25519' || envelope.keyId !== keyId || !verify(null, Buffer.from(canonicalJson(envelope.manifest)), key, Buffer.from(envelope.signature, 'base64'))) throw invalid('资源签名校验失败')
  const manifest = envelope.manifest
  if (manifest.protocolVersion !== 1 || manifest.engineVersion !== engineVersion || !/^[a-zA-Z0-9._-]{1,80}$/.test(manifest.releaseId || '') || !/^[a-zA-Z0-9._-]{1,64}$/.test(manifest.gameVersion || '') || !Array.isArray(manifest.objects) || manifest.objects.length > 8192 || !Number.isSafeInteger(manifest.entryCount) || manifest.entryCount < 1 || manifest.entryCount > 500000) throw invalid('不支持的资源清单')
  const seen = new Set()
  let entries = 0
  for (const object of manifest.objects) {
    if (!plain(object) || !/^(?:[0-9a-f]{2}|[0-9a-f]{16}-[0-9a-f])$/.test(object.bucket) || seen.has(object.bucket) || !/^[0-9a-f]{64}$/.test(object.sha256) || !Number.isSafeInteger(object.bytes) || object.bytes < 1 || object.bytes > MAX_OBJECT_BYTES || !Number.isSafeInteger(object.uncompressedBytes) || object.uncompressedBytes < 1 || object.uncompressedBytes > MAX_OBJECT_BYTES || !Number.isSafeInteger(object.entries) || object.entries < 1) throw invalid('资源对象清单无效')
    seen.add(object.bucket); entries += object.entries
  }
  if (entries !== manifest.entryCount) throw invalid('资源条目数量不一致')
  return manifest
}
export function decodeObject(bytes, descriptor) {
  if (bytes.length !== descriptor.bytes || sha256(bytes) !== descriptor.sha256) throw invalid('资源对象哈希或大小不一致')
  const raw = gunzipSync(bytes, { maxOutputLength: MAX_OBJECT_BYTES })
  if (raw.length !== descriptor.uncompressedBytes) throw invalid('资源对象解压大小不一致')
  const value = JSON.parse(raw.toString('utf8'))
  if (!plain(value) || value.protocolVersion !== 1 || !Array.isArray(value.entries) || value.entries.length !== descriptor.entries) throw invalid('资源对象内容无效')
  const seen = new Set()
  return value.entries.map(item => { const entry = validateEntry(item); const key = entryKey(entry); const bucket = descriptor.bucket.length === 2 ? sha256(key).slice(0, 2) : entryBucket(entry); if (seen.has(key) || bucket !== descriptor.bucket) throw invalid('资源分桶或重复条目无效'); seen.add(key); return entry })
}
