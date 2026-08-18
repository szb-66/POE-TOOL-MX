import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FEEDBACK_CLOUDBASE_CONFIG } from '../electron/modules/feedback/config.js'
import { FeedbackAuthClient } from '../electron/modules/feedback/auth.js'
import { FeedbackCloudClient } from '../electron/modules/feedback/cloudClient.js'
import { FeedbackService } from '../electron/modules/feedback/service.js'

const runCloud = process.env.FEEDBACK_CLOUD_INTEGRATION === '1'

test('真实CloudBase开发环境反馈闭环', { skip: !runCloud, timeout: 120_000 }, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-cloud-'))
  const auth = new FeedbackAuthClient({ config: FEEDBACK_CLOUDBASE_CONFIG, userDataPath: root })
  const cloud = new FeedbackCloudClient({ config: FEEDBACK_CLOUDBASE_CONFIG, auth })
  const service = new FeedbackService({
    config: FEEDBACK_CLOUDBASE_CONFIG,
    auth,
    cloud,
    appVersion: '1.0.5-dev-test',
    locale: 'zh-CN',
    logger: { warn() {} }
  })
  const base = {
    category: 'bug',
    title: '开发环境反馈闭环测试',
    description: '这是自动化开发环境验证生成的反馈，用于核对匿名身份、写库和附件链路。',
    contact: '',
    attachmentTokens: []
  }

  const session = await auth.getSession()
  const genericInsert = await fetch(`https://${FEEDBACK_CLOUDBASE_CONFIG.envId}.api.tcloudbasegateway.com/v1/rdb/rest/${FEEDBACK_CLOUDBASE_CONFIG.table}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${FEEDBACK_CLOUDBASE_CONFIG.publishableKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      feedback_id: 'FB-SECURITY-GENERIC', category: 'bug', title: '通用主体写入应被拒绝',
      description: '这是一条只用于验证通用Publishable Key不能绕过匿名登录的测试数据。',
      attachments: [], diagnostics_included: false, status: 'new', app_version: 'test',
      platform: 'win32', arch: 'x64', locale: 'zh-CN', schema_version: 1
    })
  })
  assert.equal(genericInsert.ok, false)
  const forbiddenRead = await fetch(`https://${FEEDBACK_CLOUDBASE_CONFIG.envId}.api.tcloudbasegateway.com/v1/rdb/rest/${FEEDBACK_CLOUDBASE_CONFIG.table}?select=feedback_id`, {
    headers: { Authorization: `Bearer ${session.accessToken}` }
  })
  assert.equal(forbiddenRead.ok, false)

  const plain = await service.submit(base)
  assert.equal(plain.success, true, JSON.stringify(plain))

  const textPath = path.join(root, 'evidence.txt')
  await writeFile(textPath, 'CloudBase feedback integration evidence\n')
  const imagePath = fileURLToPath(new URL('./fixtures/unique-items/images/test-alpha.webp', import.meta.url))
  const selected = await service.registerAttachments([textPath, imagePath])
  const withFiles = await service.submit({ ...base, title: '开发环境图片与文件反馈测试', attachmentTokens: selected.map(item => item.token) })
  assert.equal(withFiles.success, true, JSON.stringify(withFiles))

  const withDiagnostics = await service.submit({ ...base, title: '开发环境脱敏诊断反馈测试', includeDiagnostics: true }, {
    buildDiagnostics: async () => ({ schemaVersion: 3, generatedAt: new Date().toISOString(), context: { mode: 'snapshot' }, safe: true })
  })
  assert.equal(withDiagnostics.success, true, JSON.stringify(withDiagnostics))

  const rollbackSelection = await service.registerAttachments([textPath])
  let rollbackObjectKey = ''
  const rollbackCloud = {
    uploadObject: async (...args) => { rollbackObjectKey = args[0].objectKey; return cloud.uploadObject(...args) },
    deleteObject: (...args) => cloud.deleteObject(...args),
    createFeedback: async () => { throw Object.assign(new Error('forced database failure'), { code: 'FORCED_DATABASE_FAILURE' }) }
  }
  const rollbackService = new FeedbackService({
    config: FEEDBACK_CLOUDBASE_CONFIG,
    auth,
    cloud: rollbackCloud,
    appVersion: '1.0.5-dev-test',
    locale: 'zh-CN',
    logger: { warn() {} }
  })
  rollbackService.selections = service.selections
  const rolledBack = await rollbackService.submit({ ...base, title: '开发环境回滚测试', attachmentTokens: rollbackSelection.map(item => item.token) })
  assert.equal(rolledBack.success, false)
  assert.equal(rolledBack.errorCode, 'FORCED_DATABASE_FAILURE')
  const encodedKey = rollbackObjectKey.split('/').map(encodeURIComponent).join('/')
  const rollbackHead = await fetch(`https://${FEEDBACK_CLOUDBASE_CONFIG.envId}.api.tcloudbasegateway.com/v1/storages/object/${FEEDBACK_CLOUDBASE_CONFIG.bucket}/${encodedKey}`, {
    method: 'HEAD', headers: { Authorization: `Bearer ${session.accessToken}` }
  })
  assert.equal(rollbackHead.status, 404)

  console.log(JSON.stringify({ plain: plain.feedbackId, withFiles: withFiles.feedbackId, withDiagnostics: withDiagnostics.feedbackId }))
})
