import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { FEEDBACK_CLOUDBASE_CONFIG } from '../electron/modules/feedback/config.js'
import { FeedbackAuthClient } from '../electron/modules/feedback/auth.js'
import { DailyUsageService } from '../electron/modules/dailyUsage/service.js'

const runCloud = process.env.DAILY_USAGE_CLOUD_INTEGRATION === '1'
const testConfig = Object.freeze({
  ...FEEDBACK_CLOUDBASE_CONFIG,
  envId: process.env.DAILY_USAGE_CLOUD_TEST_ENV_ID || '',
  publishableKey: process.env.DAILY_USAGE_CLOUD_TEST_PUBLISHABLE_KEY || ''
})

function usageUrl(name = testConfig.dailyUsageTable) {
  return `https://${testConfig.envId}.api.tcloudbasegateway.com/v1/rdb/rest/${name}`
}

async function responseJson(response) {
  const text = await response.text()
  assert.equal(response.ok, true, text.slice(0, 300))
  return text ? JSON.parse(text) : []
}

async function adminRows(apiKey, name, query) {
  const response = await fetch(`${usageUrl(name)}?${query}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  })
  return responseJson(response)
}

async function adminRequest(apiKey, name, { method, query = '', body }) {
  return fetch(`${usageUrl(name)}${query ? `?${query}` : ''}`, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  })
}

test('真实 CloudBase 每日使用写入与最小权限闭环', { skip: !runCloud, timeout: 120_000 }, async () => {
  const apiKey = process.env.CLOUDBASE_FEEDBACK_API_KEY
  assert.ok(apiKey, 'DAILY_USAGE_CLOUD_INTEGRATION=1 时必须通过环境变量提供 CLOUDBASE_FEEDBACK_API_KEY')
  assert.ok(testConfig.envId && testConfig.publishableKey, '必须显式提供 DAILY_USAGE_CLOUD_TEST_ENV_ID 和 DAILY_USAGE_CLOUD_TEST_PUBLISHABLE_KEY')
  assert.notEqual(testConfig.envId, FEEDBACK_CLOUDBASE_CONFIG.envId, '每日使用集成测试不得指向默认生产环境')
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-daily-usage-cloud-'))
  const auth = new FeedbackAuthClient({ config: testConfig, userDataPath: root })
  const session = await auth.getSession()

  const genericWrite = await fetch(usageUrl(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${testConfig.publishableKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ app_version: 'daily-usage-integration', platform: 'win32', arch: 'x64', runtime_mode: 'packaged' })
  })
  assert.equal(genericWrite.ok, false)

  for (const name of ['app_daily_usage', testConfig.dailyUsageTable, 'app_daily_usage_totals', 'app_daily_usage_summary']) {
    const forbiddenRead = await fetch(`${usageUrl(name)}?select=*`, { headers: { Authorization: `Bearer ${session.accessToken}` } })
    assert.equal(forbiddenRead.ok, false)
  }

  const forgedWrite = await fetch(usageUrl(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ installation_uid: 'forged', last_used_at: '2000-01-01T00:00:00Z', app_version: 'daily-usage-integration', platform: 'win32', arch: 'x64', runtime_mode: 'packaged' })
  })
  assert.equal(forgedWrite.ok, false)

  const developmentWrite = await fetch(usageUrl(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ app_version: 'daily-usage-integration', platform: 'win32', arch: 'x64', runtime_mode: 'development' })
  })
  assert.equal(developmentWrite.ok, false)

  const beforeRows = await adminRows(apiKey, 'app_daily_usage_summary', 'select=usage_count&order=usage_date.desc&limit=1')
  assert.equal(beforeRows.length, 1)
  const countBefore = BigInt(beforeRows[0].usage_count)

  const usage = new DailyUsageService({
    config: testConfig,
    auth,
    appVersion: 'daily-usage-integration',
    runtimeMode: 'packaged',
    userDataPath: root,
    platform: 'win32',
    arch: 'x64'
  })
  assert.equal(await usage.report(), true)
  assert.equal(await usage.report(), false)

  const rowQuery = `select=installation_uid,first_used_at,last_used_at,app_version,runtime_mode&installation_uid=eq.${encodeURIComponent(session.uid)}`
  const firstRows = await adminRows(apiKey, 'app_daily_usage', rowQuery)
  assert.equal(firstRows.length, 1)
  assert.equal(firstRows[0].app_version, 'daily-usage-integration')
  assert.equal(firstRows[0].runtime_mode, 'packaged')

  const duplicatePayload = { app_version: 'daily-usage-integration-upsert', platform: 'win32', arch: 'x64', runtime_mode: 'packaged' }
  const concurrentWrites = await Promise.all(Array.from({ length: 3 }, () => fetch(usageUrl(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(duplicatePayload)
  })))
  assert.equal(concurrentWrites.every(response => response.ok), true)

  const secondRows = await adminRows(apiKey, 'app_daily_usage', rowQuery)
  assert.equal(secondRows.length, 1)
  assert.equal(secondRows[0].installation_uid, session.uid)
  assert.equal(secondRows[0].first_used_at, firstRows[0].first_used_at)
  assert.ok(Date.parse(secondRows[0].last_used_at) >= Date.parse(firstRows[0].last_used_at))
  assert.equal(secondRows[0].app_version, 'daily-usage-integration-upsert')

  const summaryRows = await adminRows(apiKey, 'app_daily_usage_summary', 'select=usage_date,runtime_mode,usage_count&order=usage_date.desc&limit=1')
  assert.equal(summaryRows.length, 1)
  assert.equal(summaryRows[0].runtime_mode, 'packaged')
  const countAfterConcurrentWrites = BigInt(summaryRows[0].usage_count)
  assert.equal(countAfterConcurrentWrites, countBefore + 1n)

  const invalidBefore = countAfterConcurrentWrites
  const invalidWrite = await fetch(usageUrl(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ ...duplicatePayload, runtime_mode: 'development' })
  })
  assert.equal(invalidWrite.ok, false)
  const afterInvalid = await adminRows(apiKey, 'app_daily_usage_summary', 'select=usage_count&order=usage_date.desc&limit=1')
  assert.equal(BigInt(afterInvalid[0].usage_count), invalidBefore)

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const rewind = await adminRequest(apiKey, 'app_daily_usage', {
    method: 'PATCH',
    query: `installation_uid=eq.${encodeURIComponent(session.uid)}`,
    body: { last_used_at: yesterday }
  })
  assert.equal(rewind.ok, true)
  const crossDayWrite = await fetch(usageUrl(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(duplicatePayload)
  })
  assert.equal(crossDayWrite.ok, true)
  const afterCrossDay = await adminRows(apiKey, 'app_daily_usage_summary', 'select=usage_count&order=usage_date.desc&limit=1')
  assert.equal(BigInt(afterCrossDay[0].usage_count), countAfterConcurrentWrites + 1n)
})
