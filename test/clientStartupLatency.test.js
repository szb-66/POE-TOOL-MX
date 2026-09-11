import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { ClientEventsService } from '../electron/modules/clientEvents/service.js'
import { ClientLogTailer } from '../electron/modules/clientEvents/tailer.js'

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }
const session = [{ id: 42, startedAt: '2026-09-01T00:00:00' }]
async function fixture(t, processProvider) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-client-startup-'))
  const file = path.join(root, 'Client.txt')
  await writeFile(file, '2026/09/10 10:00:00 [INFO Client 42] Generating level 83 area "MapWorldsCemetery" with seed 1\n')
  let value = { enabled: true, logPath: file }
  const service = new ClientEventsService({
    settings: { get: async () => ({ ...value }), save: async patch => (value = { ...value, ...patch }) }, processProvider
  })
  t.after(async () => { await service.stop(); await rm(root, { recursive: true, force: true }) })
  return { service, file }
}

test('并发初始化复用同一任务，恢复与首次轮询只探测一次，后续轮询刷新', async t => {
  let calls = 0
  const { service } = await fixture(t, async () => { calls++; return session })
  const recovered = []
  service.onEvent(event => { if (event.recovered) recovered.push(event) })
  const first = service.initialize()
  assert.equal(service.initialize(), first)
  await first
  assert.equal(calls, 1)
  assert.equal(recovered.length, 1)
  assert.equal(recovered[0].type, 'area-entered')
  assert.deepEqual(service.snapshot().events, [])
  await service.pollProcess()
  assert.equal(calls, 2)
})

test('停止后未完成的探测不能恢复状态或创建监听', async t => {
  const probe = deferred(); const entered = deferred()
  const { service } = await fixture(t, () => { entered.resolve(); return probe.promise })
  const recovered = []
  service.onEvent(event => { if (event.recovered) recovered.push(event) })
  const pending = service.initialize()
  await entered.promise
  await service.stop()
  probe.resolve(session)
  await pending
  assert.equal(service.snapshot().state, 'stopped')
  assert.equal(service.processTimer, null)
  assert.equal(service.tailer, null)
  assert.deepEqual(recovered, [])
})

test('初始化期间禁用不会被旧结果重新启用', async t => {
  const probe = deferred(); const entered = deferred()
  const { service } = await fixture(t, () => { entered.resolve(); return probe.promise })
  const pending = service.initialize()
  await entered.promise
  await service.updateSettings({ enabled: false })
  probe.resolve(session)
  await pending
  assert.equal(service.snapshot().enabled, false)
  assert.equal(service.snapshot().state, 'stopped')
  assert.equal(service.processTimer, null)
})

test('探测失败也不重复探测，PID 创建时间排除历史会话', async t => {
  let calls = 0
  const { service } = await fixture(t, async () => { calls++; throw new Error('probe failed') })
  await service.initialize()
  assert.equal(calls, 1)
  assert.equal(service.context, null)
  service.processProvider = async () => [{ id: 42, startedAt: '2026-09-11T00:00:00' }]
  await service.updateSettings({ enabled: true })
  assert.equal(service.context, null)
})

test('Tailer 在恢复回调中停止后不再创建轮询器', async t => {
  const { file } = await fixture(t, null)
  const entered = deferred(); const release = deferred(); const states = []
  const tailer = new ClientLogTailer({ filePath: file, onRecovery: () => { entered.resolve(); return release.promise }, onState: event => states.push(event.state) })
  t.after(() => tailer.stop())
  const pending = tailer.start()
  await entered.promise
  tailer.stop()
  release.resolve()
  await pending
  assert.equal(tailer.timer, null)
  assert.equal(states.at(-1), 'stopped')
})

test('尚未开始监听时并发 ensureStarted 复用任务，已启动实例不重复读取设置', async t => {
  let calls = 0
  const { service } = await fixture(t, async () => { calls++; return session })
  const first = service.ensureStarted()
  assert.equal(service.ensureStarted(), first)
  await first
  assert.equal(calls, 1)
  service.settings.get = () => { throw new Error('unexpected settings read') }
  await service.ensureStarted()
  assert.equal(calls, 1)
})

test('停止旧启动后重新启用，新代次不被旧探测覆盖', async t => {
  const oldProbe = deferred(); const entered = deferred(); let calls = 0
  const { service } = await fixture(t, () => { calls++; if (calls === 1) { entered.resolve(); return oldProbe.promise } return Promise.resolve(session) })
  const first = service.initialize()
  await entered.promise
  await service.stop()
  await service.updateSettings({ enabled: true })
  const activeTailer = service.tailer
  oldProbe.resolve([])
  await first
  assert.equal(service.tailer, activeTailer)
  assert.equal(service.snapshot().state, 'started')
  assert.ok(service.processTimer)
  assert.equal(service.context.processId, 42)
})

test('后续并发轮询合并同一探测，启动细分计时不持续记录周期轮询', async t => {
  const traceEvents = []
  const { service } = await fixture(t, async () => session)
  service.trace = { async measure(phase, operation) { traceEvents.push(phase); return operation() } }
  await service.initialize()
  const release = deferred(); let calls = 0
  service.processProvider = () => { calls++; return release.promise }
  const first = service.pollProcess(); const second = service.pollProcess()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(calls, 1)
  release.resolve(session)
  await Promise.all([first, second])
  assert.deepEqual(traceEvents.sort(), ['client-log-recovery', 'client-process-probe'])
})
