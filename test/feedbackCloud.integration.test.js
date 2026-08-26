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
  const allowedOwnRead = await fetch(`https://${FEEDBACK_CLOUDBASE_CONFIG.envId}.api.tcloudbasegateway.com/v1/rdb/rest/${FEEDBACK_CLOUDBASE_CONFIG.table}?select=feedback_id`, {
    headers: { Authorization: `Bearer ${session.accessToken}` }
  })
  assert.equal(allowedOwnRead.ok, true)
  const forbiddenManagementRead = await fetch(`https://${FEEDBACK_CLOUDBASE_CONFIG.envId}.api.tcloudbasegateway.com/v1/rdb/rest/${FEEDBACK_CLOUDBASE_CONFIG.table}?select=status,submitter_uid`, {
    headers: { Authorization: `Bearer ${session.accessToken}` }
  })
  assert.equal(forbiddenManagementRead.ok, false)

  const plain = await service.submit(base)
  assert.equal(plain.success, true, JSON.stringify(plain))
  const firstReplyId = crypto.randomUUID()
  const replied = await service.reply({ feedbackId: plain.id, clientMessageId: firstReplyId, body: '开发环境用户连续回复验证', attachmentTokens: [] })
  assert.equal(replied.success, true, JSON.stringify(replied))
  const conversation = await service.conversation(plain.id)
  assert.equal(conversation.success, true, JSON.stringify(conversation))
  assert.equal(conversation.conversation.messages.at(-1).body, '开发环境用户连续回复验证')
  assert.equal(JSON.stringify(conversation).includes('objectKey'), false)

  const secondRoot = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-cloud-second-'))
  const secondAuth = new FeedbackAuthClient({ config: FEEDBACK_CLOUDBASE_CONFIG, userDataPath: secondRoot })
  const secondCloud = new FeedbackCloudClient({ config: FEEDBACK_CLOUDBASE_CONFIG, auth: secondAuth })
  await secondAuth.getSession()
  assert.equal(await secondCloud.getFeedback(plain.id), null)
  await assert.rejects(secondCloud.createMessage({ feedback_id: plain.id, author_role: 'user', body: '跨身份回复应被拒绝', attachments: [], client_message_id: crypto.randomUUID(), schema_version: 1 }))
  await assert.rejects(cloud.createMessage({ feedback_id: plain.id, author_role: 'admin', body: '伪造管理员应被拒绝', attachments: [], client_message_id: crypto.randomUUID(), schema_version: 1 }))

  const textPath = path.join(root, 'evidence.txt')
  await writeFile(textPath, 'CloudBase feedback integration evidence\n')
  const imagePath = fileURLToPath(new URL('./fixtures/unique-items/images/test-alpha.webp', import.meta.url))
  const selected = await service.registerAttachments([textPath, imagePath])
  const withFiles = await service.submit({ ...base, title: '开发环境图片与文件反馈测试', attachmentTokens: selected.map(item => item.token) })
  assert.equal(withFiles.success, true, JSON.stringify(withFiles))
  const replySelection = await service.registerAttachments([textPath])
  const attachmentReply = await service.reply({ feedbackId: withFiles.id, clientMessageId: crypto.randomUUID(), body: '用户附件回复验证', attachmentTokens: replySelection.map(item => item.token) })
  assert.equal(attachmentReply.success, true, JSON.stringify(attachmentReply))
  const attachmentConversation = await service.conversation(withFiles.id)
  assert.equal(attachmentConversation.success, true, JSON.stringify(attachmentConversation))
  assert.match(attachmentConversation.conversation.messages.at(-1).attachments[0].downloadUrl, /^https:\/\//)

  for (let index = 0; index < 18; index += 1) {
    const withinLimit = await service.reply({ feedbackId: plain.id, clientMessageId: crypto.randomUUID(), body: `回复限流验证 ${index + 1}`, attachmentTokens: [] })
    assert.equal(withinLimit.success, true, JSON.stringify(withinLimit))
  }
  const rateLimited = await service.reply({ feedbackId: plain.id, clientMessageId: crypto.randomUUID(), body: '第 21 条回复应被拒绝', attachmentTokens: [] })
  assert.equal(rateLimited.success, false)

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
