import test from 'node:test'
import assert from 'node:assert/strict'
import { FeedbackCloudClient } from '../electron/modules/feedback/cloudClient.js'
import { safeCloudError } from '../electron/modules/feedback/auth.js'

const config = { envId: 'env-id', bucket: 'feedback', table: 'app_feedback' }

test('CloudBase 401只重建匿名会话并重试一次', async () => {
  const sessions = [{ accessToken: 'old', uid: 'uid' }, { accessToken: 'new', uid: 'uid' }]
  const auth = {
    invalidated: 0,
    calls: [],
    async getSession(options) { this.calls.push(options || {}); return sessions.shift() },
    invalidate() { this.invalidated += 1 }
  }
  let requests = 0
  const client = new FeedbackCloudClient({
    config,
    auth,
    fetchImpl: async (_url, options) => {
      requests += 1
      assert.equal(options.headers.Authorization, `Bearer ${requests === 1 ? 'old' : 'new'}`)
      return new Response('', { status: requests === 1 ? 401 : 201 })
    }
  })
  await client.createFeedback({ feedback_id: 'FB-1' })
  assert.equal(requests, 2)
  assert.equal(auth.invalidated, 1)
  assert.deepEqual(auth.calls, [{}, { force: true }])
})

test('CloudBase错误翻译不透传服务端详情', () => {
  const error = safeCloudError({ code: 'DATABASE_42501', message: 'secret server detail /Users/A' }, 401)
  assert.equal(error.code, 'DATABASE_42501')
  assert.equal(error.status, 401)
  assert.doesNotMatch(error.message, /secret|Users/)
})
