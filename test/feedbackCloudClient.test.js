import test from 'node:test'
import assert from 'node:assert/strict'
import { FeedbackCloudClient } from '../electron/modules/feedback/cloudClient.js'
import { safeCloudError } from '../electron/modules/feedback/auth.js'

const config = { baseUrl: 'https://feedback.example.test' }
const json = (value, status = 200) => new Response(JSON.stringify(value), { status })

test('401仅验证原持久身份并重试一次，不创建新匿名身份', async () => {
  const sessions = [{ accessToken: 'old', uid: 'uid' }, { accessToken: 'same-persisted-token', uid: 'uid' }]
  const auth = {
    invalidated: 0, calls: [],
    async getSession(options) { this.calls.push(options || {}); return sessions.shift() },
    invalidate() { this.invalidated += 1 }
  }
  let requests = 0
  const client = new FeedbackCloudClient({
    config, auth,
    fetchImpl: async (url, options) => {
      requests += 1
      assert.equal(url, config.baseUrl + '/api/client/v1/feedback')
      assert.equal(options.redirect, 'error')
      return json({}, requests === 1 ? 401 : 201)
    }
  })
  await client.createFeedback({ feedback_id: 'FB-1' })
  assert.equal(requests, 2)
  assert.equal(auth.invalidated, 1)
  assert.deepEqual(auth.calls, [{}, { force: true }])
})

test('授权上传使用原始字节且所有请求拒绝重定向', async () => {
  const calls = []
  const client = new FeedbackCloudClient({
    config, auth: { getSession: async () => ({ uid: 'uid', accessToken: 'private' }) },
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return calls.length === 1 ? json({ uploadUrl: '/api/files/upload?ticket=short-lived' }) : json({})
    }
  })
  const body = Buffer.from('evidence')
  assert.deepEqual(await client.uploadObject({ objectKey: 'uid/FB-1/file.txt', body, mimeType: 'text/plain' }), { objectKey: 'uid/FB-1/file.txt', uid: 'uid' })
  assert.deepEqual(JSON.parse(calls[0].options.body), { objectKey: 'uid/FB-1/file.txt', mimeType: 'text/plain', size: body.length })
  assert.equal(calls[1].options.body, body)
  assert.equal(calls[1].options.headers.Authorization, undefined)
  assert.ok(calls.every(call => call.options.redirect === 'error'))
})

test('拒绝把附件内容发送到第三方，并清理已授权但未提交的对象', async () => {
  const calls = []
  const client = new FeedbackCloudClient({
    config, auth: { getSession: async () => ({ uid: 'uid', accessToken: 'private' }) },
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return json(options.method === 'DELETE' ? {} : { uploadUrl: 'https://attacker.example/upload' })
    }
  })
  await assert.rejects(client.uploadObject({ objectKey: 'uid/FB-1/file.txt', body: Buffer.from('secret'), mimeType: 'text/plain' }), /不属于当前服务/)
  assert.equal(calls.length, 2)
  assert.equal(calls[1].options.method, 'DELETE')
})

test('PUT失败会清理pending对象且保留原始上传错误', async () => {
  const calls = []
  const client = new FeedbackCloudClient({
    config, auth: { getSession: async () => ({ uid: 'uid', accessToken: 'private' }) },
    fetchImpl: async (url, options) => {
      calls.push(options.method)
      if (options.method === 'PUT') return json({ code: 'UPLOAD_FAILED' }, 500)
      if (options.method === 'DELETE') throw new Error('cleanup unavailable')
      return json({ uploadUrl: '/api/files/upload?ticket=short-lived' })
    }
  })
  await assert.rejects(client.uploadObject({ objectKey: 'uid/FB-1/file.txt', body: Buffer.from('secret'), mimeType: 'text/plain' }), error => error.code === 'UPLOAD_FAILED')
  assert.deepEqual(calls, ['POST', 'PUT', 'DELETE'])
})

test('下载地址只接受本服务且客户端消息返回服务端已保存的幂等结果', async () => {
  const row = { id: 'saved', client_message_id: 'message-1', created_at: '2026-11-11' }
  const client = new FeedbackCloudClient({
    config, auth: { getSession: async () => ({ uid: 'uid', accessToken: 'private' }) },
    fetchImpl: async url => url.endsWith('/messages')
      ? json(row)
      : json([{ path: 'uid/a', fullSignedURL: '/api/files/a?ticket=short-lived' }])
  })
  assert.deepEqual(await client.createMessage({ client_message_id: 'message-1' }), row)
  assert.equal((await client.signedDownloadUrls(['uid/a', 'uid/a'])).get('uid/a'), config.baseUrl + '/api/files/a?ticket=short-lived')
  client.fetch = async () => json([{ path: 'uid/a', fullSignedURL: 'https://other.example/a' }])
  await assert.rejects(client.signedDownloadUrls(['uid/a']), /不属于当前服务/)
})

test('错误翻译不透传服务端详情', () => {
  const error = safeCloudError({ code: 'DATABASE_42501', message: 'secret server detail /Users/A' }, 401)
  assert.equal(error.code, 'DATABASE_42501')
  assert.equal(error.status, 401)
  assert.doesNotMatch(error.message, /secret|Users/)
})
