import path from 'node:path'
import { randomBytes } from 'node:crypto'

export const MAX_MANUAL_ATTACHMENTS = 5
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
export const MAX_TOTAL_BYTES = 30 * 1024 * 1024

export const FEEDBACK_CATEGORIES = new Set(['bug', 'operation', 'data', 'suggestion', 'other'])

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const MIME_BY_EXTENSION = Object.freeze({
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.txt': 'text/plain', '.log': 'text/plain', '.json': 'application/json', '.md': 'text/markdown',
  '.pdf': 'application/pdf', '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.zip': 'application/zip', '.7z': 'application/x-7z-compressed', '.rar': 'application/vnd.rar'
})

const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.com', '.bat', '.cmd', '.ps1', '.psm1', '.vbs', '.vbe', '.js', '.jse', '.mjs', '.cjs',
  '.wsf', '.wsh', '.scr', '.msi', '.dll', '.sys', '.sh', '.bash', '.zsh', '.py', '.pyw', '.jar', '.lnk'
])

export class FeedbackValidationError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'FeedbackValidationError'
    this.code = code
  }
}

function textLength(value) {
  return [...String(value || '').trim()].length
}

export function validateFeedbackInput(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new FeedbackValidationError('FEEDBACK_INVALID_INPUT', '反馈内容格式不正确')
  }
  const category = String(input.category || '')
  const title = String(input.title || '').trim()
  const description = String(input.description || '').trim()
  const contact = String(input.contact || '').trim()
  if (!FEEDBACK_CATEGORIES.has(category)) {
    throw new FeedbackValidationError('FEEDBACK_CATEGORY_INVALID', '请选择反馈类型')
  }
  if (!textLength(title)) {
    throw new FeedbackValidationError('FEEDBACK_TITLE_INVALID', '请输入标题')
  }
  if (textLength(title) > 80) {
    throw new FeedbackValidationError('FEEDBACK_TITLE_INVALID', '标题不能超过 80 个字符')
  }
  if (!textLength(description)) {
    throw new FeedbackValidationError('FEEDBACK_DESCRIPTION_INVALID', '请输入详细描述')
  }
  if (textLength(description) > 2000) {
    throw new FeedbackValidationError('FEEDBACK_DESCRIPTION_INVALID', '详细描述不能超过 2000 个字符')
  }
  if (textLength(contact) > 200) {
    throw new FeedbackValidationError('FEEDBACK_CONTACT_INVALID', '联系方式不能超过 200 个字符')
  }
  return { category, title, description, contact: contact || null }
}

export function validateDiagnosticCaptureInput(input = {}) {
  const captureId = input?.diagnosticCaptureId
  if (captureId === undefined || captureId === null || captureId === '') return null
  if (input.includeDiagnostics !== true) {
    throw new FeedbackValidationError('FEEDBACK_DIAGNOSTIC_CAPTURE_REQUIRES_CONSENT', '诊断会话只能在附带脱敏诊断时提交')
  }
  if (typeof captureId !== 'string' || !UUID_PATTERN.test(captureId)) {
    throw new FeedbackValidationError('FEEDBACK_DIAGNOSTIC_CAPTURE_INVALID', '诊断会话标识无效，请重新开始诊断')
  }
  return captureId.toLowerCase()
}

export function attachmentMimeType(fileName) {
  const extension = path.extname(String(fileName || '')).toLowerCase()
  if (DANGEROUS_EXTENSIONS.has(extension)) {
    throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_UNSAFE', '不允许上传可执行文件或脚本')
  }
  const mimeType = MIME_BY_EXTENSION[extension]
  if (!mimeType) {
    throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_TYPE', '该文件类型不支持上传')
  }
  return mimeType
}

export function sanitizeAttachmentName(fileName) {
  const base = path.basename(String(fileName || '')).normalize('NFKC')
  const extension = path.extname(base).toLowerCase()
  const stem = base.slice(0, base.length - extension.length)
    .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 80)
  return `${stem || 'attachment'}${extension}`
}

export function assertAttachmentSize(size) {
  const bytes = Number(size)
  if (!Number.isSafeInteger(bytes) || bytes < 0) {
    throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_INVALID', '无法读取附件大小')
  }
  if (bytes > MAX_ATTACHMENT_BYTES) {
    throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_TOO_LARGE', '单个附件不能超过 10MB')
  }
  return bytes
}

export function assertAttachmentCollection(items, { manual = true } = {}) {
  const list = Array.isArray(items) ? items : []
  if (manual && list.length > MAX_MANUAL_ATTACHMENTS) {
    throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_COUNT', '最多选择 5 个附件')
  }
  const total = list.reduce((sum, item) => sum + assertAttachmentSize(item.size), 0)
  if (total > MAX_TOTAL_BYTES) {
    throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_TOTAL', '附件合计不能超过 30MB')
  }
  return total
}

export function assertSafeFileHeader(buffer) {
  if (!Buffer.isBuffer(buffer)) return
  const unsafe = (
    (buffer[0] === 0x4d && buffer[1] === 0x5a) ||
    (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) ||
    (buffer[0] === 0x23 && buffer[1] === 0x21) ||
    (buffer.length >= 4 && ['feedface', 'feedfacf', 'cefaedfe', 'cffaedfe'].includes(buffer.subarray(0, 4).toString('hex')))
  )
  if (unsafe) throw new FeedbackValidationError('FEEDBACK_ATTACHMENT_UNSAFE', '不允许上传可执行文件或脚本')
}

export function createFeedbackId(date = new Date(), random = randomBytes(4).toString('hex').toUpperCase()) {
  const day = date.toISOString().slice(0, 10).replaceAll('-', '')
  return `FB-${day}-${String(random).replace(/[^A-Z0-9]/gi, '').slice(0, 8).toUpperCase().padEnd(8, '0')}`
}

function safeSegment(value, fallback) {
  return String(value || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 96) || fallback
}

export function createObjectKey({ uid, feedbackId, fileName, id = randomBytes(8).toString('hex') }) {
  return `${safeSegment(uid, 'anonymous')}/${safeSegment(feedbackId, 'feedback')}/${safeSegment(id, 'file')}-${sanitizeAttachmentName(fileName)}`
}

export function formatAttachmentSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
