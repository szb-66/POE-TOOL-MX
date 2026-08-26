import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { FeedbackService } from '../electron/modules/feedback/service.js'

const config = { envId: 'env', region: 'ap-shanghai', bucket: 'feedback', table: 'app_feedback', publishableKey: 'publishable' }
const feedbackId = '11111111-1111-4111-8111-111111111111'
const clientMessageId = '22222222-2222-4222-8222-222222222222'

function service(cloud) {
  return new FeedbackService({ config, auth: { getSession: async () => ({ uid: 'uid-1', accessToken: 'secret-token' }) }, cloud, appVersion: 'test', logger: { warn() {} } })
}

test('列表计算三种回复提示且不返回管理状态和对象路径', async () => {
  const base = [
    { id: 'a', feedback_id: 'FB-A', category: 'bug', title: 'A', description: 'a', created_at: '2026-01-01', status: 'closed', attachments: [{ objectKey: 'secret/a' }] },
    { id: 'b', feedback_id: 'FB-B', category: 'bug', title: 'B', description: 'b', created_at: '2026-01-02', status: 'new', attachments: [] },
    { id: 'c', feedback_id: 'FB-C', category: 'bug', title: 'C', description: 'c', created_at: '2026-01-03', status: 'new', attachments: [] }
  ]
  const result = await service({
    listFeedback: async () => base,
    listMessages: async () => [
      { feedback_id: 'b', author_role: 'admin', created_at: '2026-01-04' },
      { feedback_id: 'c', author_role: 'admin', created_at: '2026-01-04' },
      { feedback_id: 'c', author_role: 'user', created_at: '2026-01-05' }
    ]
  }).listConversations()
  assert.equal(result.success, true)
  assert.deepEqual(result.items.map(item => item.replyState), ['followed_up', 'replied', 'waiting'])
  assert.deepEqual(result.items.map(item => item.id), ['c', 'b', 'a'])
  assert.equal(JSON.stringify(result).includes('status'), false)
  assert.equal(JSON.stringify(result).includes('secret/a'), false)
})

test('会话仅返回签名附件并保持原始问题和正序消息', async () => {
  const result = await service({
    getFeedback: async () => ({ id: feedbackId, feedback_id: 'FB-A', category: 'bug', title: '问题', description: '原始问题', created_at: '2026-01-01', attachments: [{ name: 'root.txt', objectKey: 'uid/root', size: 1 }] }),
    listMessages: async () => [{ id: 'm1', author_role: 'admin', body: '回复', client_message_id: clientMessageId, created_at: '2026-01-02', attachments: [{ name: 'reply.txt', objectKey: 'uid/reply', size: 2 }] }],
    signedDownloadUrls: async () => new Map([['uid/root', 'https://signed/root'], ['uid/reply', 'https://signed/reply']])
  }).conversation(feedbackId)
  assert.equal(result.success, true)
  assert.equal(result.conversation.feedback.body, '原始问题')
  assert.equal(result.conversation.messages[0].attachments[0].downloadUrl, 'https://signed/reply')
  assert.equal(JSON.stringify(result).includes('objectKey'), false)
})

test('用户回复按消息路径上传，写入失败逆序回滚并保留选择令牌', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-conversation-'))
  const first = path.join(root, 'first.txt')
  const second = path.join(root, 'second.log')
  await writeFile(first, 'first')
  await writeFile(second, 'second')
  const uploaded = []
  const removed = []
  const instance = service({
    uploadObject: async value => { uploaded.push(value.objectKey) },
    createMessage: async () => { throw Object.assign(new Error('failed'), { code: 'SAVE_FAILED' }) },
    deleteObject: async value => { removed.push(value) }
  })
  const selected = await instance.registerAttachments([first, second])
  const result = await instance.reply({ feedbackId, clientMessageId, body: '继续追问', attachmentTokens: selected.map(item => item.token) })
  assert.equal(result.success, false)
  assert.equal(uploaded.length, 2)
  assert.ok(uploaded.every(key => key.includes(`/${feedbackId}/messages/${clientMessageId}/`)))
  assert.deepEqual(removed, [...uploaded].reverse())
  assert.ok(selected.every(item => instance.selections.has(item.token)))
})

test('幂等重复回复成功后只清理本次额外上传对象', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-idempotent-'))
  const file = path.join(root, 'evidence.txt')
  await writeFile(file, 'evidence')
  const removed = []
  const instance = service({ uploadObject: async () => {}, createMessage: async () => ({ duplicate: true }), deleteObject: async key => { removed.push(key) } })
  const [selected] = await instance.registerAttachments([file])
  const result = await instance.reply({ feedbackId, clientMessageId, body: '重复提交', attachmentTokens: [selected.token] })
  assert.equal(result.success, true)
  assert.equal(removed.length, 1)
  assert.equal(instance.selections.has(selected.token), false)
})

test('消息已落库但响应丢失时保留消息引用的附件并返回幂等成功', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-ambiguous-reply-'))
  const file = path.join(root, 'evidence.txt')
  await writeFile(file, 'evidence')
  const uploaded = []
  const removed = []
  const instance = service({
    uploadObject: async value => { uploaded.push(value.objectKey) },
    createMessage: async () => { throw new TypeError('response lost') },
    listMessages: async () => [{
      client_message_id: clientMessageId,
      attachments: [{ objectKey: uploaded[0] }]
    }],
    deleteObject: async key => { removed.push(key) }
  })
  const [selected] = await instance.registerAttachments([file])
  const result = await instance.reply({ feedbackId, clientMessageId, body: '响应丢失', attachmentTokens: [selected.token] })
  assert.equal(result.success, true)
  assert.equal(result.duplicate, true)
  assert.deepEqual(removed, [])
  assert.equal(instance.selections.has(selected.token), false)
})

test('消息写入结果无法确认时不删除可能已被引用的附件', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-unknown-reply-'))
  const file = path.join(root, 'evidence.txt')
  await writeFile(file, 'evidence')
  const removed = []
  const instance = service({
    uploadObject: async () => {},
    createMessage: async () => { throw new TypeError('response lost') },
    listMessages: async () => { throw new TypeError('still offline') },
    deleteObject: async key => { removed.push(key) }
  })
  const [selected] = await instance.registerAttachments([file])
  const result = await instance.reply({ feedbackId, clientMessageId, body: '无法确认', attachmentTokens: [selected.token] })
  assert.equal(result.success, false)
  assert.deepEqual(removed, [])
  assert.equal(instance.selections.has(selected.token), true)
})

test('无法确认的消息在重试前对账并清理确认未引用的旧上传', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-retry-reconcile-'))
  const file = path.join(root, 'evidence.txt')
  await writeFile(file, 'evidence')
  const uploaded = []
  const removed = []
  let createCalls = 0
  let listCalls = 0
  const instance = service({
    uploadObject: async value => { uploaded.push(value.objectKey) },
    createMessage: async document => {
      createCalls += 1
      if (createCalls === 1) throw new TypeError('response lost')
      return document
    },
    listMessages: async () => {
      listCalls += 1
      if (listCalls === 1) throw new TypeError('still offline')
      return []
    },
    deleteObject: async key => { removed.push(key) }
  })
  const [selected] = await instance.registerAttachments([file])
  const input = { feedbackId, clientMessageId, body: '重试对账', attachmentTokens: [selected.token] }
  assert.equal((await instance.reply(input)).success, false)
  assert.equal((await instance.reply(input)).success, true)
  assert.equal(uploaded.length, 2)
  assert.deepEqual(removed, [uploaded[0]])
  assert.equal(instance.selections.has(selected.token), false)
})
