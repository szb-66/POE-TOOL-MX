import { createHash, randomUUID } from 'node:crypto'
import path from 'node:path'
import {
  mkdir, readFile, readdir, rename, rm, stat, writeFile
} from 'node:fs/promises'

export const PUZZLE_FAILURE_EVIDENCE_SCHEMA_VERSION = 1
export const PUZZLE_FAILURE_EVIDENCE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SHA256_PATTERN = /^[0-9a-f]{64}$/i
const STATUS_VALUES = new Set(['complete', 'partial'])
const FILE_STATUS_VALUES = new Set(['complete', 'missing', 'omitted'])
const FILE_KIND_VALUES = new Set(['window', 'crop'])
const FILE_ENCODING_VALUES = new Set(['jpeg', 'png'])
const ABSOLUTE_PATH_PATTERN = /(?:^|[\s"'])(?:[a-z]:[\\/]|\\\\[^\\/\s]+[\\/]|\/(?:users|home|var|tmp)\/)/i

function evidenceError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function finiteNumber(value, fallback = null) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function boundedInteger(value, minimum = 0) {
  const number = finiteNumber(value)
  return number === null ? null : Math.max(minimum, Math.floor(number))
}

function safeCode(value, fallback = null) {
  const code = String(value || '').trim()
  return /^[A-Z][A-Z0-9_]{1,80}$/.test(code) ? code : fallback
}

function safeTimestamp(value) {
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
}

function safeRelativeFileName(value) {
  if (typeof value !== 'string' || !value || value.includes('\\')) return null
  const normalized = path.posix.normalize(value)
  if (normalized !== value || normalized.startsWith('../') || normalized.startsWith('/') || path.posix.basename(normalized) !== normalized) return null
  return normalized
}

function safeRectangle(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const left = finiteNumber(value.left ?? value.x)
  const top = finiteNumber(value.top ?? value.y)
  const width = finiteNumber(value.width, finiteNumber(value.right) !== null && left !== null ? finiteNumber(value.right) - left : null)
  const height = finiteNumber(value.height, finiteNumber(value.bottom) !== null && top !== null ? finiteNumber(value.bottom) - top : null)
  if ([left, top, width, height].some(item => item === null) || width <= 0 || height <= 0) return null
  return { left, top, width, height }
}

function safeLineList(value) {
  return (Array.isArray(value) ? value : [])
    .map(item => finiteNumber(item))
    .filter(item => item !== null)
    .slice(0, 128)
}

function assertNoSensitiveStrings(value) {
  if (typeof value === 'string') {
    if (ABSOLUTE_PATH_PATTERN.test(value) || /POESESSID|authorization\s*[:=]|bearer\s+/i.test(value)) {
      throw evidenceError('PUZZLE_EVIDENCE_SENSITIVE_VALUE', '证据清单包含不允许的敏感文本')
    }
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) assertNoSensitiveStrings(item)
    return
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) assertNoSensitiveStrings(item)
  }
}

function normalizeGrid(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const confidence = finiteNumber(value.confidence)
  return {
    candidateVerticalLines: safeLineList(value.candidateVerticalLines),
    candidateHorizontalLines: safeLineList(value.candidateHorizontalLines),
    spacing: {
      x: finiteNumber(value.spacing?.x),
      y: finiteNumber(value.spacing?.y)
    },
    deviation: {
      mean: finiteNumber(value.deviation?.mean),
      max: finiteNumber(value.deviation?.max)
    },
    confidence: confidence === null ? null : Math.max(0, Math.min(1, confidence))
  }
}

function normalizeAttempt(value) {
  const attempt = boundedInteger(value?.attempt, 1)
  const page = boundedInteger(value?.page, 1)
  const capturedAt = safeTimestamp(value?.capturedAt)
  const stage = safeCode(value?.stage)
  if (!attempt || !page || !capturedAt || !stage) {
    throw evidenceError('PUZZLE_EVIDENCE_MANIFEST_INVALID', '证据清单的识别尝试字段无效')
  }
  return {
    attempt,
    page,
    capturedAt,
    stage,
    monitorBounds: safeRectangle(value.monitorBounds),
    windowBounds: safeRectangle(value.windowBounds),
    configuredRegion: safeRectangle(value.configuredRegion),
    actualCrop: safeRectangle(value.actualCrop),
    grid: normalizeGrid(value.grid),
    occupiedCount: boundedInteger(value.occupiedCount),
    warnings: (Array.isArray(value.warnings) ? value.warnings : []).map(item => safeCode(item)).filter(Boolean).slice(0, 64),
    errorCode: safeCode(value.errorCode)
  }
}

function normalizeFile(value) {
  const attempt = boundedInteger(value?.attempt, 1)
  const page = boundedInteger(value?.page, 1)
  const kind = FILE_KIND_VALUES.has(value?.kind) ? value.kind : null
  const encoding = FILE_ENCODING_VALUES.has(value?.encoding) ? value.encoding : null
  const status = FILE_STATUS_VALUES.has(value?.status) ? value.status : null
  const omissionReason = safeCode(value?.omissionReason)
  const fileName = safeRelativeFileName(value?.fileName)
  if (!attempt || !page || !kind || !encoding || !status) {
    throw evidenceError('PUZZLE_EVIDENCE_MANIFEST_INVALID', '证据清单的图片元数据无效')
  }
  if (status === 'complete') {
    const width = boundedInteger(value.width, 1)
    const height = boundedInteger(value.height, 1)
    const bytes = boundedInteger(value.bytes)
    if (!fileName || !width || !height || bytes === null || !SHA256_PATTERN.test(String(value.sha256 || ''))) {
      throw evidenceError('PUZZLE_EVIDENCE_MANIFEST_INVALID', '完整证据图片缺少文件元数据')
    }
    return { attempt, page, kind, encoding, status, fileName, width, height, bytes, sha256: String(value.sha256).toLowerCase() }
  }
  if (!omissionReason) throw evidenceError('PUZZLE_EVIDENCE_MANIFEST_INVALID', '不完整证据图片缺少省略原因')
  return { attempt, page, kind, encoding, status, ...(fileName ? { fileName } : {}), omissionReason }
}

export function validatePuzzleFailureEvidenceManifest(value, { expectedId = null } = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw evidenceError('PUZZLE_EVIDENCE_MANIFEST_INVALID', '证据清单格式无效')
  }
  const evidenceId = String(value.evidenceId || '').toLowerCase()
  const occurredAt = safeTimestamp(value.occurredAt)
  const status = STATUS_VALUES.has(value.completeness?.status) ? value.completeness.status : null
  if (value.schemaVersion !== PUZZLE_FAILURE_EVIDENCE_SCHEMA_VERSION || !UUID_PATTERN.test(evidenceId) ||
      (expectedId && evidenceId !== String(expectedId).toLowerCase()) || !occurredAt || !status) {
    throw evidenceError('PUZZLE_EVIDENCE_MANIFEST_INVALID', '证据清单标识或完整性状态无效')
  }
  const attempts = (Array.isArray(value.attempts) ? value.attempts : []).map(normalizeAttempt)
  const files = (Array.isArray(value.files) ? value.files : []).map(normalizeFile)
  if (!attempts.length) throw evidenceError('PUZZLE_EVIDENCE_MANIFEST_INVALID', '证据清单缺少识别尝试')
  if (new Set(files.filter(item => item.fileName).map(item => item.fileName)).size !== files.filter(item => item.fileName).length) {
    throw evidenceError('PUZZLE_EVIDENCE_MANIFEST_INVALID', '证据清单包含重复文件名')
  }
  const manifest = {
    schemaVersion: PUZZLE_FAILURE_EVIDENCE_SCHEMA_VERSION,
    evidenceId,
    occurredAt,
    completeness: {
      status,
      reasons: (Array.isArray(value.completeness?.reasons) ? value.completeness.reasons : []).map(item => safeCode(item)).filter(Boolean).slice(0, 64)
    },
    attempts,
    files,
    omittedFiles: (Array.isArray(value.omittedFiles) ? value.omittedFiles : []).map(item => ({
      attempt: boundedInteger(item?.attempt, 1),
      page: boundedInteger(item?.page, 1),
      kind: FILE_KIND_VALUES.has(item?.kind) ? item.kind : null,
      fileName: safeRelativeFileName(item?.fileName),
      reason: safeCode(item?.reason)
    })).filter(item => item.attempt && item.page && item.kind && item.reason)
  }
  assertNoSensitiveStrings(manifest)
  return manifest
}

function manifestBytes(manifest) {
  return Buffer.byteLength(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

export function summarizePuzzleFailureEvidence(manifest) {
  const filesBytes = manifest.files.filter(item => item.status === 'complete').reduce((sum, item) => sum + item.bytes, 0)
  return {
    referenceId: manifest.evidenceId,
    occurredAt: manifest.occurredAt,
    attemptCount: manifest.attempts.length,
    estimatedBytes: filesBytes + manifestBytes(manifest),
    completeness: manifest.completeness.status,
    completenessReasons: [...manifest.completeness.reasons]
  }
}

export class PuzzleFailureEvidenceRepository {
  constructor({ root, now = () => Date.now(), logger = console } = {}) {
    this.root = path.resolve(String(root || ''))
    this.now = now
    this.logger = logger
    this.lastIntegrity = { status: 'ready', reasons: [] }
    this.activeWorkspaces = new Set()
  }

  async ensureRoot() { await mkdir(this.root, { recursive: true }) }

  pointerName(id) { return `current-${id}.json` }

  async pointerEntries() {
    await this.ensureRoot()
    return (await readdir(this.root, { withFileTypes: true }))
      .filter(item => item.isFile() && /^current-[0-9a-f-]{36}\.json$/i.test(item.name))
  }

  async currentPointer() {
    const candidates = []
    for (const entry of await this.pointerEntries()) {
      try {
        const filePath = path.join(this.root, entry.name)
        const [metadata, body] = await Promise.all([stat(filePath), readFile(filePath, 'utf8')])
        const parsed = JSON.parse(body)
        if (UUID_PATTERN.test(String(parsed?.evidenceId || ''))) candidates.push({ filePath, evidenceId: String(parsed.evidenceId).toLowerCase(), mtimeMs: metadata.mtimeMs })
      } catch {}
    }
    return candidates.sort((left, right) => right.mtimeMs - left.mtimeMs)[0] || null
  }

  async cleanup() {
    try {
      await this.ensureRoot()
      const current = await this.currentPointer()
      const cutoff = this.now() - PUZZLE_FAILURE_EVIDENCE_RETENTION_MS
      for (const entry of await readdir(this.root, { withFileTypes: true })) {
        const entryPath = path.join(this.root, entry.name)
        if (entry.isDirectory() && entry.name.startsWith('.staging-')) {
          const evidenceId = entry.name.slice('.staging-'.length).toLowerCase()
          if (this.activeWorkspaces.has(evidenceId)) continue
          await rm(entryPath, { recursive: true, force: true })
          continue
        }
        if (entry.isDirectory() && UUID_PATTERN.test(entry.name)) {
          const evidenceId = entry.name.toLowerCase()
          let keep = this.activeWorkspaces.has(evidenceId) || current?.evidenceId === evidenceId
          if (keep && !this.activeWorkspaces.has(evidenceId)) {
            try {
              const manifest = validatePuzzleFailureEvidenceManifest(JSON.parse(await readFile(path.join(entryPath, 'manifest.json'), 'utf8')), { expectedId: entry.name })
              keep = Date.parse(manifest.occurredAt) >= cutoff
            } catch { keep = false }
          }
          if (!keep) await rm(entryPath, { recursive: true, force: true })
        }
      }
      for (const pointer of await this.pointerEntries()) {
        const evidenceId = pointer.name.slice('current-'.length, -'.json'.length).toLowerCase()
        if (!this.activeWorkspaces.has(evidenceId) && (
          !current || path.join(this.root, pointer.name) !== current.filePath || !await this.directoryExists(current.evidenceId)
        )) {
          await rm(path.join(this.root, pointer.name), { force: true })
        }
      }
      this.lastIntegrity = { status: 'ready', reasons: [] }
      return { success: true }
    } catch (error) {
      this.lastIntegrity = { status: 'unavailable', reasons: [String(error?.code || 'EVIDENCE_CLEANUP_FAILED')] }
      this.logger.warn?.('puzzle evidence cleanup failed', { reasonCode: this.lastIntegrity.reasons[0] })
      return { success: false, errorCode: 'PUZZLE_EVIDENCE_CLEANUP_FAILED' }
    }
  }

  async directoryExists(id) {
    try { return (await stat(path.join(this.root, id))).isDirectory() } catch { return false }
  }

  async createWorkspace() {
    await this.cleanup()
    const evidenceId = randomUUID()
    const directory = path.join(this.root, `.staging-${evidenceId}`)
    await mkdir(directory, { recursive: false })
    this.activeWorkspaces.add(evidenceId)
    return { evidenceId, directory }
  }

  async discardWorkspace(workspace) {
    const id = String(workspace?.evidenceId || '').toLowerCase()
    if (!UUID_PATTERN.test(id)) return { success: false, errorCode: 'PUZZLE_EVIDENCE_REFERENCE_INVALID' }
    try {
      await rm(path.join(this.root, `.staging-${id}`), { recursive: true, force: true })
      return { success: true }
    } finally {
      this.activeWorkspaces.delete(id)
    }
  }

  async verifyFiles(directory, manifest) {
    for (const item of manifest.files.filter(file => file.status === 'complete')) {
      const body = await readFile(path.join(directory, item.fileName))
      if (body.length !== item.bytes || createHash('sha256').update(body).digest('hex') !== item.sha256) {
        throw evidenceError('PUZZLE_EVIDENCE_INTEGRITY_FAILED', '证据图片完整性校验失败')
      }
    }
  }

  async commit(workspace, candidate) {
    const id = String(workspace?.evidenceId || '').toLowerCase()
    try {
      const manifest = validatePuzzleFailureEvidenceManifest(candidate, { expectedId: id })
      const staging = path.join(this.root, `.staging-${id}`)
      await this.verifyFiles(staging, manifest)
      await writeFile(path.join(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
      const committed = path.join(this.root, id)
      await rename(staging, committed)
      const pointerTemp = path.join(this.root, `.pointer-${id}.tmp`)
      const pointer = path.join(this.root, this.pointerName(id))
      await writeFile(pointerTemp, `${JSON.stringify({ evidenceId: id })}\n`, { encoding: 'utf8', flag: 'wx' })
      await rename(pointerTemp, pointer)
      for (const entry of await this.pointerEntries()) {
        if (entry.name !== this.pointerName(id)) await rm(path.join(this.root, entry.name), { force: true })
      }
      for (const entry of await readdir(this.root, { withFileTypes: true })) {
        if (entry.isDirectory() && UUID_PATTERN.test(entry.name) && entry.name.toLowerCase() !== id) {
          await rm(path.join(this.root, entry.name), { recursive: true, force: true })
        }
      }
      this.lastIntegrity = { status: manifest.completeness.status, reasons: [...manifest.completeness.reasons] }
      this.activeWorkspaces.delete(id)
      return { success: true, summary: summarizePuzzleFailureEvidence(manifest) }
    } catch (error) {
      await this.discardWorkspace(workspace).catch(() => {})
      this.lastIntegrity = { status: 'unavailable', reasons: [String(error?.code || 'EVIDENCE_COMMIT_FAILED')] }
      this.logger.warn?.('puzzle evidence commit failed', { reasonCode: this.lastIntegrity.reasons[0] })
      return { success: false, errorCode: 'PUZZLE_EVIDENCE_COMMIT_FAILED' }
    }
  }

  async loadCurrentManifest() {
    await this.cleanup()
    const pointer = await this.currentPointer()
    if (!pointer) return null
    const manifest = validatePuzzleFailureEvidenceManifest(
      JSON.parse(await readFile(path.join(this.root, pointer.evidenceId, 'manifest.json'), 'utf8')),
      { expectedId: pointer.evidenceId }
    )
    this.lastIntegrity = { status: manifest.completeness.status, reasons: [...manifest.completeness.reasons] }
    return { pointer, manifest, directory: path.join(this.root, pointer.evidenceId) }
  }

  async getSummary() {
    try {
      const current = await this.loadCurrentManifest()
      return current ? { success: true, evidence: summarizePuzzleFailureEvidence(current.manifest) } : { success: true, evidence: null }
    } catch (error) {
      this.lastIntegrity = { status: 'unavailable', reasons: [String(error?.code || 'EVIDENCE_READ_FAILED')] }
      return { success: false, evidence: null, errorCode: 'PUZZLE_EVIDENCE_UNAVAILABLE' }
    }
  }

  async readEvidence(referenceId) {
    const current = await this.loadCurrentManifest()
    if (!current || current.manifest.evidenceId !== String(referenceId || '').toLowerCase()) {
      throw evidenceError('PUZZLE_EVIDENCE_UNAVAILABLE', '海图识别失败证据已失效，请重新复现或关闭附带诊断')
    }
    await this.verifyFiles(current.directory, current.manifest)
    const files = []
    for (const item of current.manifest.files.filter(file => file.status === 'complete')) {
      files.push({ ...item, body: await readFile(path.join(current.directory, item.fileName)) })
    }
    return { referenceId: current.manifest.evidenceId, manifest: structuredClone(current.manifest), files }
  }

  async clear(referenceId = null) {
    try {
      const current = await this.currentPointer()
      if (!current || (referenceId && current.evidenceId !== String(referenceId).toLowerCase())) return { success: true, cleared: false }
      await rm(current.filePath, { force: true })
      await rm(path.join(this.root, current.evidenceId), { recursive: true, force: true })
      this.lastIntegrity = { status: 'ready', reasons: [] }
      return { success: true, cleared: true }
    } catch (error) {
      this.lastIntegrity = { status: 'unavailable', reasons: [String(error?.code || 'EVIDENCE_CLEAR_FAILED')] }
      return { success: false, cleared: false, errorCode: 'PUZZLE_EVIDENCE_CLEAR_FAILED' }
    }
  }

  integrityStatus() { return structuredClone(this.lastIntegrity) }
}
