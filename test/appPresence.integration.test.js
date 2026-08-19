import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { FEEDBACK_CLOUDBASE_CONFIG } from '../electron/modules/feedback/config.js'
import { FeedbackAuthClient } from '../electron/modules/feedback/auth.js'
import { AppPresenceService } from '../electron/modules/presence/service.js'

const runCloud = process.env.PRESENCE_CLOUD_INTEGRATION === '1'

function presenceUrl(name = FEEDBACK_CLOUDBASE_CONFIG.presenceTable) {
  return `https://${FEEDBACK_CLOUDBASE_CONFIG.envId}.api.tcloudbasegateway.com/v1/rdb/rest/${name}`
}

test('真实CloudBase开发环境在线心跳与权限闭环', { skip: !runCloud, timeout: 120_000 }, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-presence-cloud-'))
  const auth = new FeedbackAuthClient({ config: FEEDBACK_CLOUDBASE_CONFIG, userDataPath: root })
  const session = await auth.getSession()
  const genericWrite = await fetch(presenceUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FEEDBACK_CLOUDBASE_CONFIG.publishableKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({
      app_version: '1.0.5-dev-presence',
      platform: 'win32',
      arch: 'x64',
      runtime_mode: 'development'
    })
  })
  assert.equal(genericWrite.ok, false)

  const forbiddenTableRead = await fetch(`${presenceUrl('app_presence')}?select=installation_uid`, {
    headers: { Authorization: `Bearer ${session.accessToken}` }
  })
  assert.equal(forbiddenTableRead.ok, false)
  const forbiddenHeartbeatRead = await fetch(`${presenceUrl()}?select=*`, {
    headers: { Authorization: `Bearer ${session.accessToken}` }
  })
  assert.equal(forbiddenHeartbeatRead.ok, false)
  const forbiddenSummaryRead = await fetch(`${presenceUrl('app_online_summary')}?select=*`, {
    headers: { Authorization: `Bearer ${session.accessToken}` }
  })
  assert.equal(forbiddenSummaryRead.ok, false)

  const forbiddenBaseWrite = await fetch(presenceUrl('app_presence'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({
      installation_uid: 'forged-authenticated-uid',
      first_seen_at: '2000-01-01T00:00:00.000Z',
      last_seen_at: '2000-01-01T00:00:00.000Z',
      app_version: '1.0.5-dev-presence',
      platform: 'win32',
      arch: 'x64',
      runtime_mode: 'development',
      schema_version: 999
    })
  })
  assert.equal(forbiddenBaseWrite.ok, false)

  const extraFieldWrite = await fetch(presenceUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({
      installation_uid: 'forged-authenticated-uid',
      app_version: '1.0.5-dev-presence',
      platform: 'win32',
      arch: 'x64',
      runtime_mode: 'development'
    })
  })
  assert.equal(extraFieldWrite.ok, false)

  const presence = new AppPresenceService({
    config: FEEDBACK_CLOUDBASE_CONFIG,
    auth,
    appVersion: '1.0.5-dev-presence',
    runtimeMode: 'development',
    platform: 'win32',
    arch: 'x64'
  })
  assert.equal(await presence.report(), true)

  console.log(JSON.stringify({ uid: session.uid, runtimeMode: 'development', appVersion: '1.0.5-dev-presence' }))
})
