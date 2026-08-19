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
