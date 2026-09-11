import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { MapTrackerService } from '../electron/modules/mapTracker/service.js'
import { MapTrackerRepository } from '../electron/modules/mapTracker/repository.js'
import { sanitizeStartupReport } from '../electron/modules/system/startupEvent.js'

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }
async function fixture(t, initialize) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-background-startup-'))
  let subscriptions = 0
  const service = new MapTrackerService({ repository: new MapTrackerRepository(root), clientEvents: {
    initialize, onEvent() { subscriptions++; return () => { subscriptions-- } }
  } })
  t.after(async () => { await service.shutdown({ normal: false }); await rm(root, { recursive: true, force: true }) })
  return { service, subscriptions: () => subscriptions }
}

test('慢日志恢复期间状态可查询，依赖操作等待，初始化只执行一次', async t => {
  const release = deferred(); let calls = 0
  const { service } = await fixture(t, () => { calls++; return release.promise })
  const pending = service.initialize()
  assert.equal(service.initialize(), pending)
  assert.equal(service.snapshot().initializationState, 'initializing')
  let updated = false
  const settings = service.updateSettings({ paused: true }).then(() => { updated = true })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(updated, false)
  release.resolve()
  await Promise.all([pending, settings])
  assert.equal(calls, 1)
  assert.equal(service.snapshot().initializationState, 'ready')
  assert.equal(service.snapshot().settings.paused, true)
})

test('日志恢复中关闭地图服务，不创建订阅或定时器', async t => {
  const release = deferred()
  const { service, subscriptions } = await fixture(t, () => release.promise)
  const pending = service.initialize()
  const stopped = service.shutdown({ normal: false })
  release.resolve()
  await Promise.all([pending, stopped])
  assert.equal(subscriptions(), 0)
  assert.equal(service.tickTimer, null)
  assert.equal(service.snapshot().initializationState, 'stopped')
  await assert.rejects(service.updateSettings({ enabled: true }), /已停止/)
})

test('后台初始化失败仍能查询状态，操作拒绝而非使用未恢复数据', async t => {
  const { service } = await fixture(t, async () => { throw new Error('log failed') })
  await assert.rejects(service.initialize(), /log failed/)
  assert.equal(service.snapshot().initializationState, 'failed')
  await assert.rejects(service.whenReady(), /log failed/)
})

test('初始化失败后可重试，成功后进入就绪', async t => {
  let calls = 0
  const { service } = await fixture(t, () => { if (++calls === 1) throw new Error('log failed'); return Promise.resolve() })
  await assert.rejects(service.initialize(), /log failed/)
  assert.equal(service.snapshot().initializationState, 'failed')
  await service.initialize()
  assert.equal(calls, 2)
  assert.equal(service.snapshot().initializationState, 'ready')
})

test('初始化前收到的游戏前台状态在就绪后仍生效', async t => {
  const release = deferred()
  const { service } = await fixture(t, () => release.promise)
  const pending = service.initialize()
  service.setForeground(true)
  release.resolve()
  await pending
  assert.equal(service.machine.gameForeground, true)
})

test('地图订阅建立后关闭，迟到日志就绪不能恢复区域或草稿', async t => {
  const release = deferred(); const entered = deferred()
  const { service, subscriptions } = await fixture(t, async () => {})
  await service.repository.saveSettings({ enabled: true })
  service.clientEvents.ensureStarted = () => { entered.resolve(); return release.promise }
  service.clientEvents.currentContext = () => ({ areaId: 'MapWorldsCemetery', seed: '1', areaLevel: 83, processId: 42 })
  const pending = service.initialize()
  await entered.promise
  const shutdown = service.shutdown({ normal: false })
  assert.equal(subscriptions(), 0)
  release.resolve()
  await Promise.all([pending, shutdown])
  assert.equal(service.snapshot().activeRun, null)
  assert.equal(await service.repository.getActiveRun(), null)
})

test('主窗口创建之前不等待日志与地图初始化，前端保留后台就绪等待', async () => {
  const main = await readFile(new URL('../electron/main.js', import.meta.url), 'utf8')
  const readyBody = main.slice(main.indexOf('async function startApplication()'))
  const windowIndex = readyBody.indexOf('createApplicationWindow()')
  assert.ok(windowIndex >= 0)
  assert.ok(readyBody.indexOf('clientEventsService.initialize()') > windowIndex)
  assert.ok(readyBody.indexOf('mapTrackerService.initialize()') > windowIndex)
  const runtime = await readFile(new URL('../src/startup/mainRuntime.js', import.meta.url), 'utf8')
  assert.match(runtime, /getStatus\(\{ waitForReady: true \}\)/)
  assert.ok(runtime.indexOf('await backgroundReady') < runtime.indexOf('markMainRuntimeSettled(warnings)'))
})

test('模块计时只接受固定模块，拒绝任意阶段，不写业务载荷', () => {
  assert.deepEqual(sanitizeStartupReport({ type: 'feature-runtime-failed', featureId: 'bag', message: 'private' }), {
    phase: 'renderer-feature-bag', outcome: 'failed', reasonCode: 'feature_restore_failed', message: ''
  })
  assert.equal(sanitizeStartupReport({ type: 'feature-runtime-ready', featureId: 'interactive' }), null)
  assert.equal(sanitizeStartupReport({ type: 'feature-runtime-ready', featureId: '../file' }), null)
})
