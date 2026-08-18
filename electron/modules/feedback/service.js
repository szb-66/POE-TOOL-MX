import { lstat, readFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  FeedbackValidationError,
  MAX_MANUAL_ATTACHMENTS,
  MAX_TOTAL_BYTES,
  assertAttachmentCollection,
  assertAttachmentSize,
  assertSafeFileHeader,
  attachmentMimeType,
  createFeedbackId,
  createObjectKey,
  sanitizeAttachmentName,
  validateFeedbackInput
} from './validation.js'
import { isFeedbackConfigured } from './config.js'

const SELECTION_TTL_MS = 30 * 60 * 1000

function feedbackFailure(error) {
  const known = {
    FEEDBACK_BUSY: '反馈正在提交，请勿重复操作',
    FEEDBACK_SERVICE_UNAVAILABLE: '反馈服务暂不可用，请稍后重试',
    FEEDBACK_ATTACHMENT_CHANGED: '附件在选择后发生变化，请重新选择',
    FEEDBACK_ATTACHMENT_MISSING: '附件已被删除或无法读取，请重新选择',
    FEEDBACK_DIAGNOSTICS_FAILED: '脱敏诊断生成失败，请关闭诊断后重试',
    FEEDBACK_NETWORK_ERROR: '网络连接失败，请检查网络后重试'
  }
  const code = String(error?.code || (error instanceof TypeError ? 'FEEDBACK_NETWORK_ERROR' : 'FEEDBACK_SUBMIT_FAILED'))
  return {
    success: false,
    error: known[code] || error?.message || '反馈提交失败，请稍后重试',
    errorCode: code
  }
}

function fileFingerprint(stat) {
  return { size: stat.size, mtimeMs: stat.mtimeMs, birthtimeMs: stat.birthtimeMs, ino: stat.ino }
}

function fingerprintMatches(left, right) {
  return left.size === right.size && left.mtimeMs === right.mtimeMs &&
    left.birthtimeMs === right.birthtimeMs && left.ino === right.ino
}

export class FeedbackService {
  constructor({
    config,
    auth,
    cloud,
    appVersion,
    locale = Intl.DateTimeFormat().resolvedOptions().locale,
    logger = console,
    fileSystem = { lstat, readFile }
  }) {
    this.config = config
    this.auth = auth
    this.cloud = cloud
    this.appVersion = appVersion
    this.locale = locale
    this.logger = logger
    this.fileSystem = fileSystem
    this.selections = new Map()
    this.submitting = false
  }

  status() {
    return { available: isFeedbackConfigured(this.config) }
  }

  purgeExpiredSelections() {
    const cutoff = Date.now() - SELECTION_TTL_MS
    for (const [token, item] of this.selections) {
      if (item.selectedAt < cutoff) this.selections.delete(token)
    }
  }

  async registerAttachments(filePaths = []) {
    this.purgeExpiredSelections()
    if (!Array.isArray(filePaths)) throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_INVALID', '附件选择结果无效')
    if (filePaths.length > MAX_MANUAL_ATTACHMENTS) {
      throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_COUNT', '最多选择 5 个附件')
    }
    const entries = []
    for (const filePath of filePaths) {
      try {
        const stat = await this.fileSystem.lstat(filePath)
        if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('not_file')
        const name = path.basename(filePath)
        const mimeType = attachmentMimeType(name)
        const size = assertAttachmentSize(stat.size)
        entries.push({ path: filePath, name, safeName: sanitizeAttachmentName(name), mimeType, size, fingerprint: fileFingerprint(stat) })
      } catch (error) {
        if (error instanceof FeedbackValidationError) throw error
        throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_MISSING', '附件已被删除或无法读取，请重新选择')
      }
    }
    assertAttachmentCollection(entries)
    return entries.map(entry => {
      const token = randomUUID()
      this.selections.set(token, { ...entry, token, selectedAt: Date.now() })
      return { token, name: entry.name, size: entry.size, mimeType: entry.mimeType }
    })
  }

  async resolveAttachments(tokens = []) {
    this.purgeExpiredSelections()
    if (!Array.isArray(tokens) || tokens.length > MAX_MANUAL_ATTACHMENTS || new Set(tokens).size !== tokens.length) {
      throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_COUNT', '附件数量无效，请重新选择')
    }
    const resolved = []
    for (const token of tokens) {
      const selected = this.selections.get(String(token))
      if (!selected) throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_MISSING', '附件选择已失效，请重新选择')
      let stat
      try { stat = await this.fileSystem.lstat(selected.path) } catch {
        throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_MISSING', '附件已被删除或无法读取，请重新选择')
      }
      if (!stat.isFile() || stat.isSymbolicLink() || !fingerprintMatches(selected.fingerprint, fileFingerprint(stat))) {
        throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_CHANGED', '附件在选择后发生变化，请重新选择')
      }
      attachmentMimeType(selected.name)
      assertAttachmentSize(stat.size)
      let body
      try { body = await this.fileSystem.readFile(selected.path) } catch {
        throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_MISSING', '附件已被删除或无法读取，请重新选择')
      }
      assertSafeFileHeader(body.subarray(0, 8))
      resolved.push({ ...selected, body })
    }
    assertAttachmentCollection(resolved)
    return resolved
  }

  async rollback(objectKeys) {
    const failures = []
    for (const objectKey of [...objectKeys].reverse()) {
      try { await this.cloud.deleteObject(objectKey) } catch (error) {
        failures.push(String(error?.code || 'ROLLBACK_DELETE_FAILED'))
      }
    }
    if (failures.length) this.logger.warn?.('feedback rollback incomplete', { reasonCodes: failures })
  }

  async submit(input = {}, { buildDiagnostics, onProgress = () => {} } = {}) {
    if (this.submitting) return feedbackFailure({ code: 'FEEDBACK_BUSY' })
    this.submitting = true
    const uploaded = []
    try {
      if (!isFeedbackConfigured(this.config)) throw new FeedbackValidationError('FEEDBACK_SERVICE_UNAVAILABLE', '反馈服务暂不可用')
      const form = validateFeedbackInput(input)
      const attachments = await this.resolveAttachments(input.attachmentTokens || [])
      let diagnostics = null
      if (input.includeDiagnostics) {
        if (typeof buildDiagnostics !== 'function') throw new FeedbackValidationError('FEEDBACK_DIAGNOSTICS_FAILED', '脱敏诊断生成失败')
        try {
          const snapshot = await buildDiagnostics()
          const body = Buffer.from(`${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
          assertAttachmentSize(body.length)
          diagnostics = { name: 'poe-cn-helper-diagnostics.json', safeName: 'poe-cn-helper-diagnostics.json', mimeType: 'application/json', size: body.length, body, diagnostic: true }
        } catch (error) {
          if (error instanceof FeedbackValidationError) throw error
          throw new FeedbackValidationError('FEEDBACK_DIAGNOSTICS_FAILED', '脱敏诊断生成失败，请关闭诊断后重试')
        }
      }
      const uploadItems = diagnostics ? [...attachments, diagnostics] : attachments
      const totalBytes = uploadItems.reduce((sum, item) => sum + item.size, 0)
      if (totalBytes > MAX_TOTAL_BYTES) throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_TOTAL', '附件合计不能超过 30MB')

      onProgress({ phase: 'authenticating' })
      const session = await this.auth.getSession()
      const feedbackId = createFeedbackId()
      const metadata = []
      for (let index = 0; index < uploadItems.length; index += 1) {
        const item = uploadItems[index]
        onProgress({ phase: 'uploading', index: index + 1, total: uploadItems.length, fileName: item.name })
        const objectKey = createObjectKey({ uid: session.uid, feedbackId, fileName: item.safeName })
        await this.cloud.uploadObject({ objectKey, body: item.body, mimeType: item.mimeType })
        uploaded.push(objectKey)
        metadata.push({
          name: item.name,
          size: item.size,
          mimeType: item.mimeType,
          objectKey,
          kind: item.diagnostic ? 'diagnostics' : 'manual'
        })
      }

      onProgress({ phase: 'saving' })
      await this.cloud.createFeedback({
        feedback_id: feedbackId,
        category: form.category,
        title: form.title,
        description: form.description,
        contact: form.contact,
        attachments: metadata,
        diagnostics_included: Boolean(diagnostics),
        status: 'new',
        app_version: String(this.appVersion || 'unknown'),
        platform: process.platform,
        arch: process.arch,
        locale: String(this.locale || 'zh-CN'),
        schema_version: 1
      })
      for (const token of input.attachmentTokens || []) this.selections.delete(String(token))
      onProgress({ phase: 'complete', feedbackId })
      return { success: true, feedbackId }
    } catch (error) {
      if (uploaded.length) await this.rollback(uploaded)
      return feedbackFailure(error)
    } finally {
      this.submitting = false
    }
  }
}
