import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { FeedbackAuthClient } from '../electron/modules/feedback/auth.js'
import { FeedbackCloudClient } from '../electron/modules/feedback/cloudClient.js'
import { FeedbackService } from '../electron/modules/feedback/service.js'

test('本机 HTTP 契约联调：身份、原始附件、反馈和回复使用自建服务', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-http-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const uid = randomUUID()
  const token = 'z'.repeat(43)
  const feedback = []
  const messages = []
  const uploads = new Map()
  let origin
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, origin)
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const bytes = Buffer.concat(chunks)
    const body = request.headers['content-type'] === 'application/json' ? JSON.parse(bytes.toString()) : null
    const send = (value, status = 200) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(value)) }
    const base = '/api/client/v1'
    if (url.pathname === base + '/identity') return send({ uid, accessToken: token })
    if (url.pathname === '/upload') {
      assert.equal(request.headers.authorization, undefined)
      uploads.set(url.searchParams.get('key'), bytes)
      return send({})
    }
    if (request.headers.authorization !== 'Bearer ' + token) return send({ code: 'UNAUTHORIZED' }, 401)
    if (url.pathname === base + '/session') return send({ uid })
    if (url.pathname === base + '/attachments/authorize') return send({ uploadUrl: origin + '/upload?key=' + encodeURIComponent(body.objectKey) })
    if (url.pathname === base + '/attachments/download-urls') return send(body.paths.map(objectKey => ({ path: objectKey, fullSignedURL: origin + '/download?key=' + encodeURIComponent(objectKey) })))
    if (url.pathname === base + '/feedback' && request.method === 'POST') { feedback.push({ ...body, created_at: new Date().toISOString() }); return send({ id: body.id, feedbackId: body.feedback_id }) }
    if (url.pathname === base + '/feedback') return send(feedback)
    if (url.pathname.startsWith(base + '/feedback/')) return send(feedback.find(row => row.id === url.pathname.split('/').at(-1)) || null)
    if (url.pathname === base + '/messages' && request.method === 'POST') {
      const row = { ...body, id: randomUUID(), created_at: new Date().toISOString() }
      messages.push(row)
      return send(row)
    }
    if (url.pathname === base + '/messages') return send(messages.filter(row => !url.searchParams.get('feedbackId') || row.feedback_id === url.searchParams.get('feedbackId')))
    return send({ code: 'NOT_FOUND' }, 404)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  origin = 'http://127.0.0.1:' + server.address().port
  t.after(() => new Promise(resolve => server.close(resolve)))
  const config = { baseUrl: origin, allowLoopbackHttp: true }
  const auth = new FeedbackAuthClient({ config, userDataPath: root })
  const cloud = new FeedbackCloudClient({ config, auth })
  const service = new FeedbackService({ config, auth, cloud, appVersion: 'test', locale: 'zh-CN' })
  const file = path.join(root, 'evidence.txt')
  await writeFile(file, 'private evidence')
  const selected = await service.registerAttachments([file])
  const result = await service.submit({ category: 'bug', title: '本机联调', description: '自建服务反馈上传', attachmentTokens: selected.map(value => value.token) })
  assert.equal(result.success, true, JSON.stringify(result))
  assert.equal(uploads.size, 1)
  assert.equal([...uploads.values()][0].toString(), 'private evidence')
  const reply = await service.reply({ feedbackId: result.id, clientMessageId: randomUUID(), body: '补充问题', attachmentTokens: [] })
  assert.equal(reply.success, true, JSON.stringify(reply))
  const conversation = await service.conversation(result.id)
  assert.equal(conversation.success, true)
  assert.equal(conversation.conversation.messages[0].body, '补充问题')
  assert.ok(conversation.conversation.feedback.attachments[0].downloadUrl.startsWith(origin))
})

test('真实 HTTP 重定向不能把身份注册请求转发到其他入口', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-redirect-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  let redirectedRequests = 0
  const server = createServer((request, response) => {
    if (request.url === '/redirected') { redirectedRequests += 1; response.end('{}'); return }
    response.writeHead(307, { Location: '/redirected' }); response.end()
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const config = { baseUrl: 'http://127.0.0.1:' + server.address().port, allowLoopbackHttp: true }
  await assert.rejects(new FeedbackAuthClient({ config, userDataPath: root }).getSession())
  assert.equal(redirectedRequests, 0)
})
