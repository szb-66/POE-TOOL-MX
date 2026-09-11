import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, appendFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { detectClientProcessSessions, detectClientProcessExists } from '../electron/modules/clientEvents/processDetection.js'
import { ClientEventsService } from '../electron/modules/clientEvents/service.js'
import { SanctumLogContext } from '../electron/modules/sanctum/logContext.js'

const session = { id: 123, startedAt: '2026-09-10T00:00:00Z' }
const entry = body => `2026/09/11 02:17:24 1 x [INFO Client 123] ${body}\n`
const area = entry('Generating level 83 area "SanctumVaults" with seed 1')
const ready = entry('[LOADING SCREEN] (圣所宝库) Duration = 1.1 seconds')
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }
const options = output => ({ platform: 'win32', execFileImpl: (_exe, _args, config, callback) => {
  assert.equal(config.windowsHide, true); assert.equal(config.timeout, 3000); callback(null, output)
} })

test('启动时间未知保留PID，空输出／损坏／超时与明确空列表分开', async () => {
  assert.deepEqual(await detectClientProcessSessions(options('[{"id":123,"startedAt":null}]')), [{ id: 123, startedAt: null }])
  for (const output of ['', 'garbage', 'null', '[{}]']) assert.equal(await detectClientProcessSessions(options(output)), null)
  assert.deepEqual(await detectClientProcessSessions(options('[]')), [])
  assert.equal(await detectClientProcessSessions({ platform: 'win32', execFileImpl: (_e, _a, _o, cb) => cb(new Error('timeout')) }), null)
})

test('独立PID查询只接受明确布尔结果，错误或空输出不确认退出', async () => {
  assert.equal(await detectClientProcessExists(123, options('{"exists":true}')), true)
  assert.equal(await detectClientProcessExists(123, options('{"exists":false}')), false)
  for (const output of ['', '{}', 'false', 'garbage']) assert.equal(await detectClientProcessExists(123, options(output)), null)
})

function boundService(provider, presence = async () => null) {
  const service = new ClientEventsService({ processProvider: provider, processPresenceProvider: presence })
  service.status.enabled = true; service.status.state = 'started'; service.processId = 123
  service.processSessions.set(123, session.startedAt)
  service.acceptLine(area.trim(), { sourceId: 'source', fileId: 'file', offset: 0 })
  service.acceptLine(ready.trim(), { sourceId: 'source', fileId: 'file', offset: 100 })
  return service
}

test('状态扫描时列表缺失但PID存在或不可查，不撤销圣所；确认退出只发布一次', async () => {
  for (const exists of [true, null]) {
    let checks = 0
    const service = boundService(async () => [], async () => { checks++; return exists })
    const bound = new SanctumLogContext(service, 123, () => assert.fail('不应中断'))
    await service.pollProcess()
    assert.equal(checks, 1); assert.equal(bound.assertCurrent().floorNumber, 2); bound.close()
  }
  const service = boundService(async () => [], async () => false)
  await service.pollProcess(); await service.pollProcess()
  assert.equal(service.status.gameStateReason, 'process-exit')
  assert.equal(service.currentContext(), null)
  assert.equal(service.events.filter(event => event.reason === 'process-exit').length, 1)
})

test('启动时间暂不可读或探测失败不清空绑定；相同PID新会话使旧绑定失效', async () => {
  let result = [{ id: 123, startedAt: null }]
  const service = boundService(async () => result)
  await service.pollProcess(); assert.ok(service.currentContext())
  result = null; await service.pollProcess(); assert.ok(service.currentContext())
  result = [{ id: 123, startedAt: '2026-09-12T00:00:00Z' }]
  await service.pollProcess()
  assert.equal(service.currentContext(), null)
  assert.equal(service.status.gameStateReason, 'process-session-changed')
})

test('列表查询与独立PID查询的迟到结果不能撤销新区域', async () => {
  for (const phase of ['list', 'presence']) {
    const wait = deferred(), entered = deferred()
    const service = boundService(async () => { if (phase === 'list') { entered.resolve(); return wait.promise }; return [] },
      async () => { entered.resolve(); return wait.promise })
    const poll = service.pollProcess(); await entered.promise
    service.acceptLine(area.replace('seed 1', 'seed 2').trim(), { sourceId: 'source', fileId: 'file', offset: 200 })
    service.acceptLine(ready.trim(), { sourceId: 'source', fileId: 'file', offset: 300 })
    wait.resolve(phase === 'list' ? [] : false); await poll
    assert.equal(service.currentContext().seed, '2')
  }
})

async function fixture(t, text = area + ready) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'client-recovery-')), file = path.join(root, 'Client.txt')
  await writeFile(file, text)
  let sessions = [session]
  const service = new ClientEventsService({ processProvider: async () => sessions,
    settings: { get: async () => ({ enabled: true, logPath: file }) } })
  await service.initialize()
  t.after(async () => { await service.stop(); await rm(root, { recursive: true, force: true }) })
  return { service, file, sessions: value => { sessions = value } }
}

test('误退出后手动重试恢复同进程区域，复用监听且历史死亡不重放', async t => {
  const { service } = await fixture(t, area + ready + entry('You have died.'))
  const tailer = service.tailer, events = []
  service.onEvent(event => events.push(event))
  service.setGameState('disconnected', 'process-exit')
  const restored = await service.ensureCurrentContext(123)
  assert.equal(restored.areaId, 'SanctumVaults')
  assert.equal(service.tailer, tailer)
  assert.equal(events.filter(event => event.recovered).length, 1)
  assert.equal(events.some(event => event.type === 'player-death'), false)
  await service.ensureCurrentContext(123)
  assert.equal(events.filter(event => event.recovered).length, 1)
})

test('真实断线无新区域、缺少加载完成或新PID会话不能恢复旧区域', async t => {
  for (const text of [area + ready + entry('Abnormal disconnect: disconnected'), area]) {
    const { service } = await fixture(t, text)
    service.setGameState('disconnected', 'disconnect')
    assert.equal(await service.ensureCurrentContext(123), null)
  }
  const f = await fixture(t)
  f.service.setGameState('disconnected', 'process-exit')
  f.sessions([{ id: 123, startedAt: '2026-09-12T00:00:00Z' }])
  assert.equal(await f.service.ensureCurrentContext(123), null)
  f.sessions([{ id: 123, startedAt: null }])
  await assert.rejects(f.service.ensureCurrentContext(123), /启动时间/)
})

test('恢复读取与实时尾读串行，后续完整行仍只发布一次；停止拒绝迟到恢复', async t => {
  const { service, file } = await fixture(t)
  service.setGameState('disconnected', 'process-exit')
  const seen = []; service.onEvent(event => seen.push(event))
  await Promise.all([service.ensureCurrentContext(123), service.tailer.poll()])
  await appendFile(file, entry('You have died.'))
  await service.tailer.poll(); await service.tailer.poll()
  assert.equal(seen.filter(event => event.type === 'player-death').length, 1)
  service.setGameState('disconnected', 'process-exit')
  const gate = deferred(), entered = deferred(), original = service.tailer.readCurrentEntries.bind(service.tailer)
  service.tailer.readCurrentEntries = async () => { const entries = await original(); entered.resolve(); await gate.promise; return entries }
  const task = service.ensureCurrentContext(123)
  await entered.promise; await service.stop(); gate.resolve()
  await assert.rejects(task, /取消/)
  assert.equal(service.currentContext(), null)
})
