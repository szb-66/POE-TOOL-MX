import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { FeedbackAuthClient } from '../electron/modules/feedback/auth.js'

test('匿名身份持久化设备ID并在令牌到期后刷新', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-auth-'))
  const calls = []
  let now = 1_000
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return new Response(JSON.stringify(calls.length === 1
      ? { access_token: 'access-1', refresh_token: 'refresh-1', expires_in: 120, sub: 'uid-1' }
      : { access_token: 'access-2', refresh_token: 'refresh-2', expires_in: 120, sub: 'uid-1' }), { status: 200 })
  }
  const auth = new FeedbackAuthClient({
    config: { envId: 'env', publishableKey: 'publishable' }, userDataPath: root, fetchImpl, now: () => now
  })
  assert.equal((await auth.getSession()).accessToken, 'access-1')
  assert.equal((await auth.getSession()).accessToken, 'access-1')
  now += 70_000
  assert.equal((await auth.getSession()).accessToken, 'access-2')
  assert.equal(calls.length, 2)
  assert.match(calls[1].url, /\/auth\/v1\/token$/)
  assert.equal(JSON.parse(calls[1].options.body).grant_type, 'refresh_token')
  assert.equal(calls[0].options.headers['x-device-id'], calls[1].options.headers['x-device-id'])
  assert.equal((await readFile(path.join(root, 'feedback', 'device-id'), 'utf8')).trim(), calls[0].options.headers['x-device-id'])
})
