import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { FeedbackAuthClient } from '../electron/modules/feedback/auth.js'
import { feedbackBaseUrl, feedbackAttachmentUrl, FEEDBACK_CONFIG } from '../electron/modules/feedback/config.js'

const config = { baseUrl: 'https://feedback.example.test' }
const identity = { uid: '11111111-1111-4111-8111-111111111111', accessToken: 'a'.repeat(43) }
const json = (value, status = 200) => new Response(JSON.stringify(value), { status })

async function temporaryRoot(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-auth-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  return root
}

test('新身份首次并发只注册一次，重启后使用保存的高熵凭据验证原身份', async t => {
  const root = await temporaryRoot(t)
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return json(url.endsWith('/identity') ? identity : { uid: identity.uid })
  }
  const auth = new FeedbackAuthClient({ config, userDataPath: root, fetchImpl })
  const sessions = await Promise.all([auth.getSession(), auth.getSession(), auth.getSession()])
  assert.deepEqual(sessions, [identity, identity, identity])
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, config.baseUrl + '/api/client/v1/identity')
  assert.equal(calls[0].options.redirect, 'error')
  assert.deepEqual(JSON.parse(await readFile(auth.filePath, 'utf8')), identity)
  const restarted = new FeedbackAuthClient({ config, userDataPath: root, fetchImpl })
  assert.deepEqual(await restarted.getSession(), identity)
  assert.equal(calls[1].url, config.baseUrl + '/api/client/v1/session')
  assert.equal(calls[1].options.headers.Authorization, 'Bearer ' + identity.accessToken)
  assert.equal(calls[1].options.redirect, 'error')
})

test('401或损坏的本机凭据不会自动注册新身份，避免丢失已有会话', async t => {
  const root = await temporaryRoot(t)
  const initial = new FeedbackAuthClient({ config, userDataPath: root, fetchImpl: async () => json(identity) })
  await initial.getSession()
  const calls = []
  const invalidated = new FeedbackAuthClient({
    config, userDataPath: root, fetchImpl: async url => { calls.push(url); return json({ code: 'UNAUTHORIZED' }, 401) }
  })
  await assert.rejects(invalidated.getSession(), error => error.code === 'UNAUTHORIZED')
  assert.deepEqual(calls, [config.baseUrl + '/api/client/v1/session'])
  assert.deepEqual(JSON.parse(await readFile(initial.filePath, 'utf8')), identity)
  await writeFile(initial.filePath, '{"uid":"public-device-id"}')
  await assert.rejects(invalidated.getSession(), error => error.code === 'IDENTITY_INVALID')
  assert.equal(calls.length, 1)
})

test('服务地址隔离身份文件，拒绝不安全入口和其他来源的附件地址', async t => {
  const root = await temporaryRoot(t)
  const first = new FeedbackAuthClient({ config, userDataPath: root })
  const second = new FeedbackAuthClient({ config: { baseUrl: 'https://other.example.test' }, userDataPath: root })
  assert.notEqual(first.filePath, second.filePath)
  assert.equal(feedbackBaseUrl(FEEDBACK_CONFIG), 'http://127.0.0.1:44317')
  for (const baseUrl of ['http://feedback.example.test', 'https://user:password@example.test', 'https://example.test/path', 'https://example.test/?token=bad']) {
    assert.throws(() => feedbackBaseUrl({ baseUrl, allowLoopbackHttp: true }))
  }
  assert.throws(() => feedbackBaseUrl({ baseUrl: 'http://127.0.0.1:44317' }))
  assert.equal(feedbackAttachmentUrl(config, '/api/attachments/a'), config.baseUrl + '/api/attachments/a')
  assert.throws(() => feedbackAttachmentUrl(config, 'https://attacker.example/upload'))
})
