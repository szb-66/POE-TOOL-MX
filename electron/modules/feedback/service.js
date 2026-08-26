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
  createMessageObjectKey,
  createObjectKey,
  sanitizeAttachmentName,
  validateDiagnosticCaptureInput,
  validateFeedbackInput,
  validateFeedbackReply,
  validatePuzzleEvidenceReferenceInput
} from './validation.js'
import { isFeedbackConfigured } from './config.js'
import { assemblePuzzleEvidenceAttachments } from './evidenceAttachments.js'

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
    fileSystem = { lstat, readFile },
    failureEvidence = null
  }) {
    this.config = config
    this.auth = auth
    this.cloud = cloud
    this.appVersion = appVersion
    this.locale = locale
    this.logger = logger
    this.fileSystem = fileSystem
    this.failureEvidence = failureEvidence
    this.selections = new Map()
    this.pendingReplyUploads = new Map()
    this.submitting = false
    this.replying = false
  }

  status() {
    return { available: isFeedbackConfigured(this.config) }
  }

  async getPuzzleEvidenceSummary() {
    return this.failureEvidence?.getSummary?.() || { success: true, evidence: null }
  }

  async discardPuzzleEvidence(referenceId) {
    if (!this.failureEvidence?.clear) return { success: true, cleared: false }
    return this.failureEvidence.clear(referenceId)
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

  async reconcileIndeterminateReply({ error, feedbackId, clientMessageId, uploaded }) {
    const indeterminate = error instanceof TypeError || error?.code === 'FEEDBACK_NETWORK_ERROR'
    if (!indeterminate || typeof this.cloud.listMessages !== 'function') return { state: 'not-applicable' }
    try {
      const existing = (await this.cloud.listMessages(feedbackId))
        .find(item => item.client_message_id === clientMessageId)
      if (!existing) return { state: 'not-saved' }
      const referenced = new Set((Array.isArray(existing.attachments) ? existing.attachments : [])
        .map(item => item?.objectKey).filter(Boolean))
      await this.rollback(uploaded.filter(objectKey => !referenced.has(objectKey)))
      return { state: 'saved', existing }
    } catch {
      return { state: 'unknown' }
    }
  }

  replyAttemptKey(feedbackId, clientMessageId) {
    return `${feedbackId}:${clientMessageId}`
  }

  async reconcilePendingReply(form, attachmentTokens) {
    const key = this.replyAttemptKey(form.feedbackId, form.clientMessageId)
    const pending = this.pendingReplyUploads.get(key)
    if (!pending?.length) return null
    const existing = (await this.cloud.listMessages(form.feedbackId))
      .find(item => item.client_message_id === form.clientMessageId)
    if (existing) {
      const referenced = new Set((Array.isArray(existing.attachments) ? existing.attachments : [])
        .map(item => item?.objectKey).filter(Boolean))
      await this.rollback(pending.filter(objectKey => !referenced.has(objectKey)))
      this.pendingReplyUploads.delete(key)
      for (const token of attachmentTokens) this.selections.delete(String(token))
      return existing
    }
    await this.rollback(pending)
    this.pendingReplyUploads.delete(key)
    return null
  }

  async submit(input = {}, { buildDiagnostics, onProgress = () => {} } = {}) {
    if (this.submitting) return feedbackFailure({ code: 'FEEDBACK_BUSY' })
    this.submitting = true
    const uploaded = []
    try {
      if (!isFeedbackConfigured(this.config)) throw new FeedbackValidationError('FEEDBACK_SERVICE_UNAVAILABLE', '反馈服务暂不可用')
      const form = validateFeedbackInput(input)
      const diagnosticCaptureId = validateDiagnosticCaptureInput(input)
      const puzzleFailureEvidenceId = validatePuzzleEvidenceReferenceInput(input)
      const attachments = await this.resolveAttachments(input.attachmentTokens || [])
      let diagnostics = null
      if (input.includeDiagnostics) {
        if (typeof buildDiagnostics !== 'function') throw new FeedbackValidationError('FEEDBACK_DIAGNOSTICS_FAILED', '脱敏诊断生成失败')
        try {
          const snapshot = await buildDiagnostics(diagnosticCaptureId)
          const body = Buffer.from(`${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
          assertAttachmentSize(body.length)
          diagnostics = { name: 'poe-cn-helper-diagnostics.json', safeName: 'poe-cn-helper-diagnostics.json', mimeType: 'application/json', size: body.length, body, diagnostic: true }
        } catch (error) {
          if (error instanceof FeedbackValidationError) throw error
          throw new FeedbackValidationError('FEEDBACK_DIAGNOSTICS_FAILED', '脱敏诊断生成失败，请关闭诊断后重试')
        }
      }
      let systemAttachments = diagnostics ? [diagnostics] : []
      if (puzzleFailureEvidenceId) {
        if (!diagnostics || !this.failureEvidence?.readEvidence) {
          throw new FeedbackValidationError('FEEDBACK_EVIDENCE_UNAVAILABLE', '海图识别失败证据已失效，请重新复现或关闭附带诊断')
        }
        try {
          const evidence = await this.failureEvidence.readEvidence(puzzleFailureEvidenceId)
          systemAttachments = assemblePuzzleEvidenceAttachments({
            diagnostics,
            evidence,
            manualBytes: attachments.reduce((sum, item) => sum + item.size, 0)
          })
        } catch (error) {
          if (error instanceof FeedbackValidationError) throw error
          throw new FeedbackValidationError('FEEDBACK_EVIDENCE_UNAVAILABLE', '海图识别失败证据已失效，请重新复现或关闭附带诊断')
        }
      }
      const uploadItems = [...attachments, ...systemAttachments]
      const totalBytes = uploadItems.reduce((sum, item) => sum + item.size, 0)
      if (totalBytes > MAX_TOTAL_BYTES) throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_TOTAL', '附件合计不能超过 30MB')

      onProgress({ phase: 'authenticating' })
      const session = await this.auth.getSession()
      const feedbackId = createFeedbackId()
      const feedbackRecordId = randomUUID()
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
          kind: item.systemKind || (item.diagnostic ? 'diagnostics' : 'manual')
        })
      }

      onProgress({ phase: 'saving' })
      await this.cloud.createFeedback({
        id: feedbackRecordId,
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
      if (puzzleFailureEvidenceId) {
        try {
          const cleanup = await this.failureEvidence.clear(puzzleFailureEvidenceId)
          if (!cleanup?.success) this.logger.warn?.('puzzle evidence cleanup after feedback failed', { reasonCode: cleanup?.errorCode || 'EVIDENCE_CLEAR_FAILED' })
        } catch (error) {
          this.logger.warn?.('puzzle evidence cleanup after feedback failed', { reasonCode: String(error?.code || 'EVIDENCE_CLEAR_FAILED') })
        }
      }
      onProgress({ phase: 'complete', feedbackId })
      return { success: true, id: feedbackRecordId, feedbackId }
    } catch (error) {
      if (uploaded.length) await this.rollback(uploaded)
      return feedbackFailure(error)
    } finally {
      this.submitting = false
    }
  }

  safeAttachment(attachment, signedByPath) {
    return {
      name: typeof attachment?.name === 'string' && attachment.name.trim() ? attachment.name.trim() : '附件',
      kind: typeof attachment?.kind === 'string' ? attachment.kind : 'file',
      mimeType: typeof attachment?.mimeType === 'string' ? attachment.mimeType : 'application/octet-stream',
      size: Number.isFinite(attachment?.size) && attachment.size >= 0 ? attachment.size : 0,
      downloadUrl: signedByPath.get(attachment?.objectKey) || null
    }
  }

  async signConversationAttachments(items) {
    const objectKeys = items.flatMap(item => Array.isArray(item.attachments) ? item.attachments : []).map(item => item?.objectKey).filter(Boolean)
    const signedByPath = await this.cloud.signedDownloadUrls(objectKeys)
    return items.map(item => ({ ...item, attachments: (Array.isArray(item.attachments) ? item.attachments : []).map(attachment => this.safeAttachment(attachment, signedByPath)) }))
  }

  async listConversations() {
    try {
      if (!isFeedbackConfigured(this.config)) throw new FeedbackValidationError('FEEDBACK_SERVICE_UNAVAILABLE', '反馈服务暂不可用')
      const [feedbackItems, messages] = await Promise.all([this.cloud.listFeedback(), this.cloud.listMessages()])
      const summaryByFeedback = new Map()
      for (const message of messages) {
        const value = summaryByFeedback.get(message.feedback_id) || { messageCount: 0, adminReplyCount: 0, lastMessageAuthor: 'user', lastMessageAt: null }
        value.messageCount += 1
        if (message.author_role === 'admin') value.adminReplyCount += 1
        value.lastMessageAuthor = message.author_role
        value.lastMessageAt = message.created_at
        summaryByFeedback.set(message.feedback_id, value)
      }
      const items = feedbackItems.map(item => {
        const summary = summaryByFeedback.get(item.id) || { messageCount: 0, adminReplyCount: 0, lastMessageAuthor: 'user', lastMessageAt: item.created_at }
        const replyState = !summary.adminReplyCount ? 'waiting' : summary.lastMessageAuthor === 'user' ? 'followed_up' : 'replied'
        return { id: item.id, feedbackId: item.feedback_id, category: item.category, title: item.title, description: item.description, createdAt: item.created_at, ...summary, replyState }
      }).sort((left, right) => (
        Date.parse(right.lastMessageAt || right.createdAt) - Date.parse(left.lastMessageAt || left.createdAt)
      ))
      return { success: true, items }
    } catch (error) { return feedbackFailure(error) }
  }

  async conversation(feedbackId) {
    try {
      if (!isFeedbackConfigured(this.config)) throw new FeedbackValidationError('FEEDBACK_SERVICE_UNAVAILABLE', '反馈服务暂不可用')
      const [feedback, messages] = await Promise.all([this.cloud.getFeedback(feedbackId), this.cloud.listMessages(feedbackId)])
      if (!feedback) throw new FeedbackValidationError('FEEDBACK_NOT_FOUND', '反馈不存在或无权访问')
      const [root, ...signedMessages] = await this.signConversationAttachments([feedback, ...messages])
      return {
        success: true,
        conversation: {
          feedback: { id: root.id, feedbackId: root.feedback_id, category: root.category, title: root.title, body: root.description, createdAt: root.created_at, attachments: root.attachments },
          messages: signedMessages.map(message => ({ id: message.id, authorRole: message.author_role, body: message.body, clientMessageId: message.client_message_id, createdAt: message.created_at, attachments: message.attachments }))
        }
      }
    } catch (error) { return feedbackFailure(error) }
  }

  async reply(input = {}, { onProgress = () => {} } = {}) {
    if (this.replying) return feedbackFailure({ code: 'FEEDBACK_BUSY' })
    this.replying = true
    const uploaded = []
    try {
      if (!isFeedbackConfigured(this.config)) throw new FeedbackValidationError('FEEDBACK_SERVICE_UNAVAILABLE', '反馈服务暂不可用')
      const form = validateFeedbackReply(input)
      const pendingExisting = await this.reconcilePendingReply(form, input.attachmentTokens || [])
      if (pendingExisting) {
        onProgress({ phase: 'complete' })
        return { success: true, clientMessageId: form.clientMessageId, duplicate: true }
      }
      const attachments = await this.resolveAttachments(input.attachmentTokens || [])
      onProgress({ phase: 'authenticating' })
      const session = await this.auth.getSession()
      const metadata = []
      for (let index = 0; index < attachments.length; index += 1) {
        const item = attachments[index]
        onProgress({ phase: 'uploading', index: index + 1, total: attachments.length, fileName: item.name })
        const objectKey = createMessageObjectKey({ uid: session.uid, feedbackId: form.feedbackId, clientMessageId: form.clientMessageId, fileName: item.safeName })
        await this.cloud.uploadObject({ objectKey, body: item.body, mimeType: item.mimeType })
        uploaded.push(objectKey)
        metadata.push({ name: item.name, size: item.size, mimeType: item.mimeType, objectKey, kind: 'manual' })
      }
      onProgress({ phase: 'saving' })
      let saved
      try {
        saved = await this.cloud.createMessage({ feedback_id: form.feedbackId, author_role: 'user', body: form.body, attachments: metadata, client_message_id: form.clientMessageId, schema_version: 1 })
      } catch (error) {
        const reconciliation = await this.reconcileIndeterminateReply({
          error,
          feedbackId: form.feedbackId,
          clientMessageId: form.clientMessageId,
          uploaded
        })
        if (reconciliation.state === 'saved') {
          uploaded.length = 0
          for (const token of input.attachmentTokens || []) this.selections.delete(String(token))
          onProgress({ phase: 'complete' })
          return { success: true, clientMessageId: form.clientMessageId, duplicate: true }
        }
        if (reconciliation.state === 'unknown') {
          this.pendingReplyUploads.set(
            this.replyAttemptKey(form.feedbackId, form.clientMessageId),
            [...uploaded]
          )
          uploaded.length = 0
        }
        throw error
      }
      if (saved?.duplicate && uploaded.length) {
        await this.rollback(uploaded)
        uploaded.length = 0
      }
      for (const token of input.attachmentTokens || []) this.selections.delete(String(token))
      this.pendingReplyUploads.delete(this.replyAttemptKey(form.feedbackId, form.clientMessageId))
      onProgress({ phase: 'complete' })
      return { success: true, clientMessageId: form.clientMessageId }
    } catch (error) {
      if (uploaded.length) await this.rollback(uploaded)
      return feedbackFailure(error)
    } finally { this.replying = false }
  }
}
