import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
  DiagnosticEventStore,
  DIAGNOSTIC_EVENT_LIMIT,
  DIAGNOSTIC_EVENT_RETENTION_MS
} from '../electron/modules/system/diagnosticEventStore.js'

async function temporaryStore(t, options = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'poe-diagnostics-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  return { root, store: new DiagnosticEventStore({ userDataPath: root, ...options }) }
}

test('事件存储仅接受白名单字段并记录失败后的恢复', async (t) => {
  let now = Date.parse('2026-08-01T00:00:00.000Z')
  const { store } = await temporaryStore(t, {
    appVersion: '1.0.0', sessionId: '11111111-1111-4111-8111-111111111111', now: () => now
  })
  await store.record({
    area: 'priceCheck', operation: 'query', outcome: 'failed', reasonCode: 'request_failed',
    message: 'POESESSID=secret', metadata: { httpStatus: 500, private: 1 }
  })
  now += 1000
  await store.record({ area: 'priceCheck', operation: 'query', outcome: 'recovered' })
  const result = await store.read()
  assert.equal(result.corrupt, false)
  assert.equal(result.events.length, 2)
  assert.deepEqual(result.events[0].metadata, { httpStatus: 500 })
  assert.doesNotMatch(JSON.stringify(result), /secret|private|message/)
  assert.equal(result.events[1].outcome, 'recovered')
  assert.equal('reasonCode' in result.events[1], false)
})

test('60 秒内相同事件合并并支持并发调用', async (t) => {
  let now = Date.parse('2026-08-01T00:00:00.000Z')
  const { store } = await temporaryStore(t, {
    appVersion: '1.0.0', sessionId: '11111111-1111-4111-8111-111111111111', now: () => now
  })
  await Promise.all(Array.from({ length: 10 }, () => store.record({
    area: 'items', operation: 'script_start', outcome: 'failed', reasonCode: 'process_start_failed'
  })))
  const result = await store.read()
  assert.equal(result.events.length, 1)
  assert.equal(result.events[0].repeatCount, 10)
})

test('事件按 7 天与 200 条裁剪', async (t) => {
  let now = Date.parse('2026-08-01T00:00:00.000Z')
  const { store } = await temporaryStore(t, {
    appVersion: '1.0.0', sessionId: '11111111-1111-4111-8111-111111111111', now: () => now
  })
  for (let index = 0; index < DIAGNOSTIC_EVENT_LIMIT + 5; index += 1) {
    await store.record({ area: 'items', operation: 'script_runtime', outcome: 'failed', reasonCode: 'process_exit' })
    now += 61_000
  }
  assert.equal((await store.read()).events.length, DIAGNOSTIC_EVENT_LIMIT)
  now += DIAGNOSTIC_EVENT_RETENTION_MS
  assert.equal((await store.read()).events.length, 0)
})

test('损坏文件安全降级并可由后续写入重建', async (t) => {
  const { root, store } = await temporaryStore(t, {
    appVersion: '1.0.0', sessionId: '11111111-1111-4111-8111-111111111111'
  })
  const directory = path.join(root, 'diagnostics')
  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(path.join(directory, 'events.json'), '{broken', 'utf8')
  assert.equal((await store.read()).corrupt, true)
  const recorded = await store.record({
    area: 'system', operation: 'runtime_check', outcome: 'failed', reasonCode: 'runtime_unavailable'
  })
  assert.equal(recorded.recorded, true)
  const rebuilt = await store.read()
  assert.equal(rebuilt.corrupt, false)
  assert.equal(rebuilt.events.length, 1)
})
