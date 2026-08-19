import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FeedbackValidationError,
  MAX_ATTACHMENT_BYTES,
  attachmentMimeType,
  assertAttachmentCollection,
  assertSafeFileHeader,
  createFeedbackId,
  createObjectKey,
  sanitizeAttachmentName,
  validateDiagnosticCaptureInput,
  validateFeedbackInput
} from '../electron/modules/feedback/validation.js'

test('反馈标题和内容取消最低字数限制但保留必填与最大长度校验', () => {
  assert.deepEqual(validateFeedbackInput({ category: 'bug', title: '题', description: '文' }), {
    category: 'bug', title: '题', description: '文', contact: null
  })
  assert.throws(() => validateFeedbackInput({ category: 'bad', title: '题', description: '文' }), FeedbackValidationError)
  assert.throws(() => validateFeedbackInput({ category: 'bug', title: ' ', description: '文' }), /请输入标题/)
  assert.throws(() => validateFeedbackInput({ category: 'bug', title: '题', description: '\n' }), /请输入详细描述/)
  assert.throws(() => validateFeedbackInput({ category: 'bug', title: '题'.repeat(81), description: '文' }), /80/)
  assert.throws(() => validateFeedbackInput({ category: 'bug', title: '题', description: '文'.repeat(2001) }), /2000/)
})

test('诊断会话标识要求明确授权且只接受 UUID', () => {
  const captureId = '11111111-1111-4111-8111-111111111111'
  assert.equal(validateDiagnosticCaptureInput({ includeDiagnostics: true, diagnosticCaptureId: captureId }), captureId)
  assert.equal(validateDiagnosticCaptureInput({ includeDiagnostics: true }), null)
  assert.throws(
    () => validateDiagnosticCaptureInput({ includeDiagnostics: false, diagnosticCaptureId: captureId }),
    /只能在附带脱敏诊断时提交/
  )
  assert.throws(
    () => validateDiagnosticCaptureInput({ includeDiagnostics: true, diagnosticCaptureId: 'not-a-uuid' }),
    /诊断会话标识无效/
  )
})

test('附件类型、数量、大小和伪装执行文件被拒绝', () => {
  assert.equal(attachmentMimeType('image.JPEG'), 'image/jpeg')
  assert.equal(attachmentMimeType('report.docx'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  assert.throws(() => attachmentMimeType('run.ps1'), /可执行文件或脚本/)
  assert.throws(() => attachmentMimeType('unknown.bin'), /不支持/)
  assert.throws(() => assertAttachmentCollection(Array.from({ length: 6 }, () => ({ size: 1 }))), /最多选择 5/)
  assert.throws(() => assertAttachmentCollection([{ size: MAX_ATTACHMENT_BYTES + 1 }]), /10MB/)
  assert.throws(() => assertSafeFileHeader(Buffer.from([0x4d, 0x5a, 0, 0])), /可执行文件或脚本/)
  assert.throws(() => assertSafeFileHeader(Buffer.from('#!/bin/sh')), /可执行文件或脚本/)
})

test('文件名净化、反馈编号和对象路径稳定且不含父目录', () => {
  assert.equal(sanitizeAttachmentName('..\\秘密 报告?.PDF'), '秘密-报告.pdf')
  assert.equal(createFeedbackId(new Date('2026-08-18T00:00:00Z'), 'ab-cd'), 'FB-20260818-ABCD0000')
  assert.equal(
    createObjectKey({ uid: 'uid/../x', feedbackId: 'FB-1', fileName: '../a b.txt', id: 'fixed' }),
    'uidx/FB-1/fixed-a-b.txt'
  )
})
