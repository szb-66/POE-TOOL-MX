import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { FeedbackService } from '../electron/modules/feedback/service.js'

const config = { envId: 'env', region: 'ap-shanghai', bucket: 'feedback', table: 'app_feedback', publishableKey: 'publishable' }
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

test('附件上传部分失败会回滚且不写入反馈记录', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-service-'))
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

test('写库失败回滚全部附件，文件变化和重复提交均被阻止', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-retry-'))
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
