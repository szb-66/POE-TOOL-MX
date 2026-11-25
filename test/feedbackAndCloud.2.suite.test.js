import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { mkdtemp as _m1_mkdtemp, writeFile as _m1_writeFile, rm as _m1_rm } from 'node:fs/promises'
import _m1_os from 'node:os'
import _m1_path from 'node:path'
import { FeedbackService as _m1_FeedbackService } from '../electron/modules/feedback/service.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { FeedbackValidationError as _m2_FeedbackValidationError, MAX_ATTACHMENT_BYTES as _m2_MAX_ATTACHMENT_BYTES, attachmentMimeType as _m2_attachmentMimeType, assertAttachmentCollection as _m2_assertAttachmentCollection, assertSafeFileHeader as _m2_assertSafeFileHeader, createFeedbackId as _m2_createFeedbackId, createObjectKey as _m2_createObjectKey, sanitizeAttachmentName as _m2_sanitizeAttachmentName, validateDiagnosticCaptureInput as _m2_validateDiagnosticCaptureInput, validateFeedbackInput as _m2_validateFeedbackInput, validatePuzzleEvidenceReferenceInput as _m2_validatePuzzleEvidenceReferenceInput } from '../electron/modules/feedback/validation.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { borderRecognitionResult as _m3_borderRecognitionResult, fragmentRecognitionResult as _m3_fragmentRecognitionResult, recognitionFailureResult as _m3_recognitionFailureResult, sanitizeRecognitionFeedbackReason as _m3_sanitizeRecognitionFeedbackReason } from '../electron/modules/puzzle/recognitionFeedback.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { EventEmitter as _m4_EventEmitter } from 'node:events'
import { RECOGNITION_FEEDBACK_CHANNEL as _m4_RECOGNITION_FEEDBACK_CHANNEL, RecognitionFeedbackOverlayManager as _m4_RecognitionFeedbackOverlayManager, recognitionFeedbackBounds as _m4_recognitionFeedbackBounds } from '../electron/modules/puzzle/recognitionFeedbackOverlay.js'

// === Merged from feedbackIpc.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
const preload = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
const ipc = readFileSync(new URL('../electron/modules/ipc/feedback.js', import.meta.url), 'utf8')
const api = readFileSync(new URL('../src/api/electron.js', import.meta.url), 'utf8')
const component = readFileSync(new URL('../src/domains/settings/FeedbackSettings.vue', import.meta.url), 'utf8')
const inAppFeedbackSpec = readFileSync(new URL('../openspec/specs/in-app-feedback/spec.md', import.meta.url), 'utf8')
const conversationsSpec = readFileSync(new URL('../openspec/specs/feedback-conversations/spec.md', import.meta.url), 'utf8')

test('反馈IPC只暴露选择、提交和进度能力且不返回本地路径', () => {
  assert.match(preload, /feedback:pick-attachments/)
  assert.match(preload, /feedback:submit/)
  assert.match(preload, /feedback:puzzle-evidence-summary/)
  assert.match(preload, /feedback:puzzle-evidence-discard/)
  assert.match(preload, /feedback:progress/)
  assert.match(preload, /feedback:list/)
  assert.match(preload, /feedback:conversation/)
  assert.match(preload, /feedback:reply-pick-attachments/)
  assert.match(preload, /feedback:reply/)
  assert.doesNotMatch(preload, /CloudBase.*(?:admin|management)|SecretKey|service_role/i)
  assert.match(ipc, /attachments = await feedback\.registerAttachments\(result\.filePaths\)/)
  assert.match(ipc, /assertMainWindowSender\(event, getMainWindow\)/)
  assert.match(ipc, /event\.sender !== mainWindow\.webContents/)
  assert.match(ipc, /feedback:pick-attachments[\s\S]*guarded\(/)
  assert.match(ipc, /feedback:submit[\s\S]*guarded\(/)
  assert.match(ipc, /feedback:puzzle-evidence-summary[\s\S]*guarded\(/)
  assert.match(ipc, /feedback:puzzle-evidence-discard[\s\S]*guarded\(/)
  assert.match(ipc, /feedback:list[\s\S]*guarded\(/)
  assert.match(ipc, /feedback:conversation[\s\S]*guarded\(/)
  assert.match(ipc, /feedback:reply[\s\S]*guarded\(/)
  assert.match(ipc, /submitFeedbackWithDiagnostics/)
  assert.match(api, /feedback:\s*\{[\s\S]*pickAttachments[\s\S]*submit[\s\S]*onProgress/)
})

test('反馈页披露最近海图失败证据且未授权时不提交引用', () => {
  assert.match(component, /完整游戏客户端窗口、仓库画面、实际识别裁剪图和逐次网格指标/)
  assert.match(component, /puzzleEvidence\.attemptCount/)
  assert.match(component, /puzzleEvidence\.estimatedBytes/)
  assert.match(component, /puzzleFailureEvidenceId/)
  assert.match(component, /includeDiagnostics && puzzleEvidence\.value\?\.referenceId/)
  assert.match(component, /FEEDBACK_EVIDENCE_UNAVAILABLE[\s\S]*表单和其他附件已保留/)
  assert.match(component, /取消并删除本地证据/)
  assert.doesNotMatch(component, /puzzleEvidence\.(?:path|directory)|完整本地路径/)
})

test('反馈会话界面只有进入加载和手动刷新且支持连续回复', () => {
  assert.match(component, /提交反馈/)
  assert.match(component, /我的反馈/)
  assert.match(component, /等待回复/)
  assert.match(component, /已回复/)
  assert.match(component, /已追问，等待回复/)
  assert.match(component, /手动刷新/)
  assert.match(component, /@click="refreshConversations"/)
  assert.match(component, /refreshConversations[\s\S]*Promise\.all[\s\S]*loadConversations\(\)[\s\S]*loadConversation\(selectedFeedbackId\.value\)/)
  assert.match(component, /crypto\.randomUUID\(\)/)
  assert.match(component, /replyClientMessageId/)
  assert.doesNotMatch(component, /setInterval|setTimeout/)
  assert.doesNotMatch(component, /item\.status|处理状态/)
})

test('反馈主规范不再同时要求展示和禁止展示会话历史', () => {
  assert.match(conversationsSpec, /当前安装可查看自己的反馈历史/)
  assert.doesNotMatch(inAppFeedbackSpec, /首版仅提供提交入口|SHALL NOT 在应用内展示反馈历史/)
})

test('反馈页面具备诊断默认关闭、失败保留和成功清空契约', () => {
  assert.match(component, /includeDiagnostics: false/)
  assert.match(component, /if \(!result\?\.success\)[\s\S]*submitError\.value/)
  assert.match(component, /successId\.value = result\.feedbackId[\s\S]*resetForm\(\)/)
  assert.match(component, /attachments\.value\.map\(item => item\.token\)/)
  assert.match(component, /class="feedback-grid app-grid" :gutter="16"/)
  assert.match(component, /<el-col :xs="24" :md="16">/)
  assert.match(component, /<el-col :xs="24" :md="8" tag="aside"/)
})

test('反馈页面取消标题和内容最低字数提示与校验', () => {
  assert.doesNotMatch(component, /5–80|20–2000/)
  assert.match(component, /lengthOf\(form\.title\) > 80/)
  assert.match(component, /lengthOf\(form\.description\) > 2000/)
})
})()

// === Merged from feedbackService.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const mkdtemp = _m1_mkdtemp
  const writeFile = _m1_writeFile
  const rm = _m1_rm
  const os = _m1_os
  const path = _m1_path
  const FeedbackService = _m1_FeedbackService
const config = { baseUrl: 'https://feedback.example.test' }
const validInput = { category: 'bug', title: '提交测试标题', description: '这里是一段足够长的问题描述，用于验证反馈提交服务。', contact: '', attachmentTokens: [] }

function createService(cloud, overrides = {}) {
  return new FeedbackService({
    config,
    auth: { getSession: async () => ({ uid: 'uid-1', accessToken: 'token' }) },
    cloud,
    appVersion: '1.0.5',
    locale: 'zh-CN',
    logger: { warn() {} },
    ...overrides
  })
}

test('成功提交保存元数据且默认不生成诊断', async () => {
  let document
  let diagnosticsCalled = false
  const service = createService({
    uploadObject: async () => {}, deleteObject: async () => {}, createFeedback: async value => { document = value }
  })
  const result = await service.submit(validInput, { buildDiagnostics: async () => { diagnosticsCalled = true } })
  assert.equal(result.success, true)
  assert.match(result.feedbackId, /^FB-\d{8}-[A-Z0-9]{8}$/)
  assert.equal(diagnosticsCalled, false)
  assert.equal(document.feedback_id, result.feedbackId)
  assert.equal(document.status, 'new')
  assert.deepEqual(document.attachments, [])
})

test('附件上传部分失败会回滚且不写入反馈记录', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-service-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const first = path.join(root, 'first.txt')
  const second = path.join(root, 'second.log')
  await writeFile(first, 'first')
  await writeFile(second, 'second')
  const deleted = []
  let uploaded = 0
  let saved = false
  const service = createService({
    uploadObject: async () => { uploaded += 1; if (uploaded === 2) throw Object.assign(new Error('upload failed'), { code: 'UPLOAD_FAILED' }) },
    deleteObject: async key => { deleted.push(key) },
    createFeedback: async () => { saved = true }
  })
  const selected = await service.registerAttachments([first, second])
  const result = await service.submit({ ...validInput, attachmentTokens: selected.map(item => item.token) })
  assert.equal(result.success, false)
  assert.equal(saved, false)
  assert.equal(deleted.length, 1)
  assert.match(deleted[0], /^uid-1\/FB-/)
})

test('写库失败回滚全部附件，文件变化和重复提交均被阻止', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-retry-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const file = path.join(root, 'evidence.txt')
  await writeFile(file, 'before')
  const deleted = []
  const service = createService({
    uploadObject: async () => {}, deleteObject: async key => { deleted.push(key) },
    createFeedback: async () => { throw Object.assign(new Error('save failed'), { code: 'SAVE_FAILED' }) }
  })
  const [selected] = await service.registerAttachments([file])
  const failed = await service.submit({ ...validInput, attachmentTokens: [selected.token] })
  assert.equal(failed.success, false)
  assert.equal(deleted.length, 1)

  const [changed] = await service.registerAttachments([file])
  await new Promise(resolve => setTimeout(resolve, 10))
  await writeFile(file, 'after-change')
  const changedResult = await service.submit({ ...validInput, attachmentTokens: [changed.token] })
  assert.equal(changedResult.errorCode, 'FEEDBACK_ATTACHMENT_CHANGED')

  let release
  const busyService = createService({ uploadObject: async () => {}, deleteObject: async () => {}, createFeedback: () => new Promise(resolve => { release = resolve }) })
  const pending = busyService.submit(validInput)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal((await busyService.submit(validInput)).errorCode, 'FEEDBACK_BUSY')
  release()
  assert.equal((await pending).success, true)
})

test('明确开启诊断时生成JSON附件并计入提交', async () => {
  const uploaded = []
  let document
  const service = createService({
    uploadObject: async item => { uploaded.push(item) }, deleteObject: async () => {}, createFeedback: async value => { document = value }
  })
  const result = await service.submit({ ...validInput, includeDiagnostics: true }, {
    buildDiagnostics: async () => ({ schemaVersion: 3, safe: true })
  })
  assert.equal(result.success, true)
  assert.equal(uploaded.length, 1)
  assert.equal(uploaded[0].mimeType, 'application/json')
  assert.equal(document.diagnostics_included, true)
  assert.equal(document.attachments[0].kind, 'diagnostics')
})

test('会话诊断只向构建器传递会话标识且不写入云端记录', async () => {
  const captureId = '11111111-1111-4111-8111-111111111111'
  let receivedCaptureId
  let document
  const service = createService({
    uploadObject: async () => {}, deleteObject: async () => {}, createFeedback: async value => { document = value }
  })
  const result = await service.submit({ ...validInput, includeDiagnostics: true, diagnosticCaptureId: captureId }, {
    buildDiagnostics: async value => {
      receivedCaptureId = value
      return { schemaVersion: 3, context: { mode: 'capture', captureId } }
    }
  })
  assert.equal(result.success, true)
  assert.equal(receivedCaptureId, captureId)
  assert.equal('diagnosticCaptureId' in document, false)
  assert.equal(JSON.stringify(document).includes(captureId), false)
})

test('会话诊断构建失败时保留失败结果且不写入反馈', async () => {
  const captureId = '11111111-1111-4111-8111-111111111111'
  let saved = false
  const service = createService({
    uploadObject: async () => {}, deleteObject: async () => {}, createFeedback: async () => { saved = true }
  })
  const result = await service.submit({ ...validInput, includeDiagnostics: true, diagnosticCaptureId: captureId }, {
    buildDiagnostics: async () => {
      throw new Error('capture unavailable')
    }
  })
  assert.equal(result.success, false)
  assert.equal(result.errorCode, 'FEEDBACK_DIAGNOSTICS_FAILED')
  assert.equal(saved, false)
})

test('附件读取失败不向渲染进程泄露本地路径', async () => {
  const secretPath = 'C:\\Users\\PrivateUser\\Desktop\\secret.txt'
  const stat = {
    size: 12,
    mtimeMs: 100,
    birthtimeMs: 50,
    ino: 7,
    isFile: () => true,
    isSymbolicLink: () => false
  }
  const service = createService({
    uploadObject: async () => {}, deleteObject: async () => {}, createFeedback: async () => {}
  }, {
    fileSystem: {
      lstat: async () => stat,
      readFile: async () => {
        throw Object.assign(new Error(`EPERM: operation not permitted, open '${secretPath}'`), { code: 'EPERM' })
      }
    }
  })
  const [selected] = await service.registerAttachments([secretPath])
  const result = await service.submit({ ...validInput, attachmentTokens: [selected.token] })

  assert.equal(result.success, false)
  assert.equal(result.errorCode, 'FEEDBACK_ATTACHMENT_MISSING')
  assert.doesNotMatch(result.error, /PrivateUser|secret\.txt/)
})

function puzzleEvidenceFixture(referenceId) {
  const crop = { attempt: 1, page: 1, kind: 'crop', fileName: 'page-1-attempt-1-crop.png', encoding: 'png', width: 600, height: 1000, bytes: 3, sha256: 'a'.repeat(64), status: 'complete', body: Buffer.from('png') }
  const window = { attempt: 1, page: 1, kind: 'window', fileName: 'page-1-attempt-1-window.jpg', encoding: 'jpeg', width: 1920, height: 1080, bytes: 4, sha256: 'b'.repeat(64), status: 'complete', body: Buffer.from('jpeg') }
  return {
    referenceId,
    files: [crop, window],
    manifest: {
      schemaVersion: 1, evidenceId: referenceId, occurredAt: '2026-08-26T01:02:03Z',
      completeness: { status: 'complete', reasons: [] }, attempts: [{ attempt: 1, page: 1 }],
      files: [crop, window].map(({ body, ...metadata }) => metadata), omittedFiles: []
    }
  }
}

test('附带诊断读取系统证据并在云端保存成功后清理对应引用', async () => {
  const referenceId = '11111111-1111-4111-8111-111111111111'
  const uploaded = []
  let document
  const cleared = []
  const service = createService({
    uploadObject: async item => { uploaded.push(item) }, deleteObject: async () => {}, createFeedback: async value => { document = value }
  }, {
    failureEvidence: {
      readEvidence: async id => { assert.equal(id, referenceId); return puzzleEvidenceFixture(referenceId) },
      clear: async id => { cleared.push(id); return { success: true, cleared: true } }
    }
  })
  const result = await service.submit({ ...validInput, includeDiagnostics: true, puzzleFailureEvidenceId: referenceId }, {
    buildDiagnostics: async () => ({ schemaVersion: 3, safe: true })
  })
  assert.equal(result.success, true)
  assert.deepEqual(document.attachments.map(item => item.kind), [
    'puzzle-evidence-crop', 'puzzle-evidence-window', 'puzzle-evidence-manifest', 'diagnostics'
  ])
  assert.equal(uploaded.length, 4)
  assert.deepEqual(cleared, [referenceId])
})

test('证据读取、上传或保存失败时保留同一引用供重试', async () => {
  const referenceId = '11111111-1111-4111-8111-111111111111'
  let cleared = 0
  const unavailable = createService({ uploadObject: async () => {}, deleteObject: async () => {}, createFeedback: async () => {} }, {
    failureEvidence: {
      readEvidence: async () => { throw new Error('C:\\Users\\Private\\missing') },
      clear: async () => { cleared += 1; return { success: true } }
    }
  })
  const unavailableResult = await unavailable.submit({ ...validInput, includeDiagnostics: true, puzzleFailureEvidenceId: referenceId }, { buildDiagnostics: async () => ({ safe: true }) })
  assert.equal(unavailableResult.errorCode, 'FEEDBACK_EVIDENCE_UNAVAILABLE')
  assert.doesNotMatch(unavailableResult.error, /Private|missing/)

  const saveFailed = createService({
    uploadObject: async () => {}, deleteObject: async () => {}, createFeedback: async () => { throw new Error('save') }
  }, {
    failureEvidence: {
      readEvidence: async () => puzzleEvidenceFixture(referenceId),
      clear: async () => { cleared += 1; return { success: true } }
    }
  })
  const failedResult = await saveFailed.submit({ ...validInput, includeDiagnostics: true, puzzleFailureEvidenceId: referenceId }, { buildDiagnostics: async () => ({ safe: true }) })
  assert.equal(failedResult.success, false)
  assert.equal(cleared, 0)
})

test('云端已保存后本地证据清理故障不反转成功结果', async () => {
  const referenceId = '11111111-1111-4111-8111-111111111111'
  const warnings = []
  const service = createService({ uploadObject: async () => {}, deleteObject: async () => {}, createFeedback: async () => {} }, {
    logger: { warn: (...items) => warnings.push(items) },
    failureEvidence: {
      readEvidence: async () => puzzleEvidenceFixture(referenceId),
      clear: async () => { throw Object.assign(new Error('clear failed'), { code: 'EACCES' }) }
    }
  })
  const result = await service.submit({ ...validInput, includeDiagnostics: true, puzzleFailureEvidenceId: referenceId }, { buildDiagnostics: async () => ({ safe: true }) })
  assert.equal(result.success, true)
  assert.equal(warnings.length, 1)
})
})()

// === Merged from feedbackValidation.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const FeedbackValidationError = _m2_FeedbackValidationError
  const MAX_ATTACHMENT_BYTES = _m2_MAX_ATTACHMENT_BYTES
  const attachmentMimeType = _m2_attachmentMimeType
  const assertAttachmentCollection = _m2_assertAttachmentCollection
  const assertSafeFileHeader = _m2_assertSafeFileHeader
  const createFeedbackId = _m2_createFeedbackId
  const createObjectKey = _m2_createObjectKey
  const sanitizeAttachmentName = _m2_sanitizeAttachmentName
  const validateDiagnosticCaptureInput = _m2_validateDiagnosticCaptureInput
  const validateFeedbackInput = _m2_validateFeedbackInput
  const validatePuzzleEvidenceReferenceInput = _m2_validatePuzzleEvidenceReferenceInput
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

test('海图失败证据引用要求明确附带诊断且只接受 UUID', () => {
  const id = '11111111-1111-4111-8111-111111111111'
  assert.equal(validatePuzzleEvidenceReferenceInput({ includeDiagnostics: true, puzzleFailureEvidenceId: id }), id)
  assert.equal(validatePuzzleEvidenceReferenceInput({ includeDiagnostics: true }), null)
  assert.throws(() => validatePuzzleEvidenceReferenceInput({ includeDiagnostics: false, puzzleFailureEvidenceId: id }), /附带诊断/)
  assert.throws(() => validatePuzzleEvidenceReferenceInput({ includeDiagnostics: true, puzzleFailureEvidenceId: 'bad' }), /已失效/)
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
})()

// === Merged from recognitionFeedback.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const borderRecognitionResult = _m3_borderRecognitionResult
  const fragmentRecognitionResult = _m3_fragmentRecognitionResult
  const recognitionFailureResult = _m3_recognitionFailureResult
  const sanitizeRecognitionFeedbackReason = _m3_sanitizeRecognitionFeedbackReason
test('碎片识别结果按完整、未揭示、未知和跳过统计分级', () => {
  assert.deepEqual(
    fragmentRecognitionResult({ attempted: 5, matched: 5, unveiled: 0, unknown: 0, skipped: false }, 5),
    { status: 'success', message: '碎片识别完成，共 5 个' }
  )
  assert.deepEqual(
    fragmentRecognitionResult({ attempted: 5, matched: 3, unveiled: 1, unknown: 1, skipped: false }, 5),
    { status: 'partial', message: '已识别 4/5 个词缀，词缀未知 1 个' }
  )
  assert.equal(fragmentRecognitionResult({ attempted: 5, matched: 5, skipped: true }, 5).status, 'partial')
})

test('边缘识别以 attempted 和 matched 判定完整或部分成功', () => {
  assert.deepEqual(
    borderRecognitionResult({ attempted: 12, matched: 12, unknown: 0, skipped: false }),
    { status: 'success', message: '边缘词缀识别完成，共 12 段' }
  )
  assert.deepEqual(
    borderRecognitionResult({ attempted: 12, matched: 9, unknown: 3, skipped: false }),
    { status: 'partial', message: '已识别 9/12 段，未知 3 段' }
  )
})

test('失败原因单行脱敏截断，紧急停止使用独立中性文案', () => {
  const sanitized = sanitizeRecognitionFeedbackReason(`读取失败\nC:\\Users\\Example\\secret.txt ${'x'.repeat(120)}`)
  assert.doesNotMatch(sanitized, /Users|secret\.txt|\n/)
  assert.ok(sanitized.length <= 80)
  assert.deepEqual(
    recognitionFailureResult({ code: 'EMERGENCY_STOPPED', message: 'ignored' }),
    { status: 'stopped', message: '本次识别已停止，未完成结果未保存' }
  )
  assert.equal(recognitionFailureResult({ code: 'PROCESS_EXITED', message: '子进程退出' }).status, 'failure')
})
})()

// === Merged from recognitionFeedbackOverlay.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const EventEmitter = _m4_EventEmitter
  const RECOGNITION_FEEDBACK_CHANNEL = _m4_RECOGNITION_FEEDBACK_CHANNEL
  const RecognitionFeedbackOverlayManager = _m4_RecognitionFeedbackOverlayManager
  const recognitionFeedbackBounds = _m4_recognitionFeedbackBounds
class FakeWebContents extends EventEmitter {
  constructor() {
    super()
    this.loading = true
    this.sent = []
  }

  isLoadingMainFrame() { return this.loading }
  send(...args) { this.sent.push(args) }
}

class FakeWindow extends EventEmitter {
  static instances = []

  constructor(options) {
    super()
    this.options = options
    this.webContents = new FakeWebContents()
    this.calls = []
    this.destroyed = false
    FakeWindow.instances.push(this)
  }

  isDestroyed() { return this.destroyed }
  setAlwaysOnTop(...args) { this.calls.push(['alwaysOnTop', ...args]) }
  setFocusable(...args) { this.calls.push(['focusable', ...args]) }
  setIgnoreMouseEvents(...args) { this.calls.push(['ignoreMouse', ...args]) }
  setContentProtection(...args) { this.calls.push(['contentProtection', ...args]) }
  setBounds(...args) { this.calls.push(['bounds', ...args]) }
  showInactive() { this.calls.push(['showInactive']) }
  hide() { this.calls.push(['hide']) }
  loadURL(...args) { this.calls.push(['loadURL', ...args]); return Promise.resolve() }
  loadFile(...args) { this.calls.push(['loadFile', ...args]); return Promise.resolve() }
  close() { this.destroyed = true; this.calls.push(['close']); this.emit('closed') }
}

const screenApi = {
  screenToDipRect(_window, rectangle) {
    return {
      x: rectangle.x / 1.5,
      y: rectangle.y / 1.5,
      width: rectangle.width / 1.5,
      height: rectangle.height / 1.5
    }
  }
}

function createManager() {
  const timers = []
  const cleared = []
  FakeWindow.instances.length = 0
  const manager = new RecognitionFeedbackOverlayManager({
    BrowserWindowClass: FakeWindow,
    screenApi,
    setTimeoutFn(callback, duration) {
      const timer = { callback, duration }
      timers.push(timer)
      return timer
    },
    clearTimeoutFn(timer) { cleared.push(timer) }
  })
  return { manager, timers, cleared }
}

test('识别反馈窗口按目标显示器 DPI 顶部居中并保持不可交互和内容保护', () => {
  const bounds = recognitionFeedbackBounds({ x: -1920, y: 0, width: 1920, height: 1080 }, screenApi)
  assert.deepEqual(bounds, { x: -900, y: 24, width: 520, height: 76 })

  const { manager } = createManager()
  manager.prime()
  const window = FakeWindow.instances[0]
  assert.equal(window.options.show, false)
  assert.equal(window.options.focusable, false)
  assert.equal(window.options.skipTaskbar, true)
  assert.deepEqual(window.calls.slice(0, 4), [
    ['alwaysOnTop', true, 'screen-saver'],
    ['focusable', false],
    ['ignoreMouse', true, { forward: true }],
    ['contentProtection', true]
  ])
  assert.ok(window.calls.some(([name, file]) => name === 'loadFile' && file.endsWith('dist\\index.html')))
})

test('预加载期间缓存最新快照，加载完成后才显示并推送', () => {
  const { manager } = createManager()
  let visibleCount = 0
  assert.equal(FakeWindow.instances.length, 0)
  const sessionId = manager.showRunning({
    displayBounds: { x: 0, y: 0, width: 2560, height: 1440 },
    stage: 'shape', current: 1, total: 2
  }, { onVisible: () => { visibleCount += 1 } })
  const window = FakeWindow.instances[0]
  assert.ok(window)
  manager.updateProgress(sessionId, { stage: 'copy', current: 3, total: 9 })
  assert.equal(window.webContents.sent.length, 0)
  assert.equal(visibleCount, 0)
  assert.equal(window.calls.some(([name]) => name === 'showInactive'), false)

  window.webContents.loading = false
  window.webContents.emit('did-finish-load')
  assert.equal(window.webContents.sent.length, 1)
  assert.equal(window.webContents.sent[0][0], RECOGNITION_FEEDBACK_CHANNEL)
  assert.equal(window.webContents.sent[0][1].stage, 'copy')
  assert.equal(window.webContents.sent[0][1].current, 3)
  assert.equal(window.calls.filter(([name]) => name === 'showInactive').length, 1)
  assert.equal(visibleCount, 1)
  manager.updateProgress(sessionId, { current: 4 })
  assert.equal(visibleCount, 1)
})

test('结果时长、计时取消和会话代次隔离相邻识别', () => {
  const { manager, timers, cleared } = createManager()
  manager.prime()
  const window = FakeWindow.instances[0]
  window.webContents.loading = false
  const displayBounds = { x: 0, y: 0, width: 1920, height: 1080 }
  const first = manager.showRunning({ displayBounds, stage: 'shape' })
  assert.equal(manager.showResult(first, { status: 'partial', message: '部分成功' }), true)
  assert.equal(timers[0].duration, 6000)

  const second = manager.showRunning({ displayBounds, stage: 'border' })
  assert.ok(second > first)
  assert.deepEqual(cleared, [timers[0]])
  assert.equal(manager.updateProgress(first, { current: 12 }), false)
  timers[0].callback()
  assert.equal(window.calls.some(([name]) => name === 'hide'), false)

  assert.equal(manager.showResult(second, { status: 'success', message: '完成' }), true)
  assert.equal(timers[1].duration, 4000)
  timers[1].callback()
  assert.equal(window.calls.at(-1)[0], 'hide')

  const failure = manager.showImmediateResult({ displayBounds, status: 'failure', message: '失败' })
  assert.ok(failure > second)
  assert.equal(timers[2].duration, 6000)
  const failureSnapshots = window.webContents.sent.filter(([, snapshot]) => snapshot.sessionId === failure)
  assert.equal(failureSnapshots.length, 1)
  assert.equal(failureSnapshots[0][1].kind, 'result')
  manager.close()
  assert.equal(window.calls.at(-1)[0], 'close')
})
})()
