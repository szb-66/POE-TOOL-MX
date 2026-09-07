import test from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { createDevelopmentStartupTrace } from '../shared/developmentStartupTrace.js'
import { summarizeStartupTrace } from '../scripts/startupMetrics.js'
import { configurePythonRuntime, resolvePythonRuntimeAsync } from '../electron/modules/python/detector.js'

test('启动事件使用统一入口时间，保留失败并且日志故障不改变业务结果', async () => {
  const events = []
  const trace = createDevelopmentStartupTrace({
    env: { POE_STARTUP_RUN_ID: 'test-123', POE_STARTUP_STARTED_AT: '1000' },
    now: () => 1400,
    write: (_path, line) => events.push(JSON.parse(line))
  })
  const error = new Error('probe failed')
  await assert.rejects(trace.measure('probe', () => { throw error }), value => value === error)
  assert.deepEqual(events.map(event => [event.runId, event.elapsedMs, event.outcome]), [
    ['test-123', 400, 'started'], ['test-123', 400, 'failed']
  ])
  const broken = createDevelopmentStartupTrace({
    env: { POE_STARTUP_RUN_ID: 'test-123', POE_STARTUP_STARTED_AT: '1000' },
    write: () => { throw new Error('read only') }
  })
  assert.equal(await broken.measure('probe', () => 42), 42)
  assert.equal(createDevelopmentStartupTrace({ env: {} }).record('probe'), undefined)
})

test('组件挂载不是首页可操作，缺失就绪或超过完整启动预算不能通过', () => {
  const events = [
    { phase: 'window-visible', outcome: 'succeeded', elapsedMs: 9000 },
    { phase: 'dashboard', outcome: 'succeeded', elapsedMs: 11000 }
  ]
  assert.equal(summarizeStartupTrace(events).complete, false)
  events.push({ phase: 'interactive', outcome: 'succeeded', elapsedMs: 61000 })
  assert.deepEqual(summarizeStartupTrace(events).budget, { window: true, interactive: false })
  events[2].elapsedMs = 14000
  assert.deepEqual(summarizeStartupTrace(events).budget, { window: true, interactive: true })
})

test('Python 异步探测复用并发任务，缺失运行时返回不可用而不抛出或阻塞调用方', async () => {
  configurePythonRuntime({ isPackaged: true, resourcesPath: path.join(os.tmpdir(), `missing-poe-runtime-${process.pid}`) })
  try {
    const first = resolvePythonRuntimeAsync()
    const second = resolvePythonRuntimeAsync()
    assert.equal(first, second)
    const result = await first
    assert.equal(result.ready, false)
    assert.equal(result.path, null)
    assert.equal(await resolvePythonRuntimeAsync(), result)
  } finally {
    configurePythonRuntime({ isPackaged: false, resourcesPath: process.resourcesPath || '' })
  }
})
