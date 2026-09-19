import test from 'node:test'
import assert from 'node:assert/strict'
import { detectClientProcessSessions, detectClientProcessExists, ProcessProbeError } from '../electron/modules/clientEvents/processDetection.js'
import { ClientEventsService } from '../electron/modules/clientEvents/service.js'

const session = { id: 123, startedAt: '2026-09-10T00:00:00Z' }
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve() }
function bound(provider, logger) {
  const service = new ClientEventsService({ processProvider: provider, logger })
  service.status = { ...service.status, enabled: true, state: 'started', gameState: 'in-game' }
  service.tailer = { stop() {} }
  service.processId = 123
  service.processSessions.set(123, session.startedAt)
  service.context = { processId: 123, sessionKey: 'current', eventId: 'current' }
  return service
}

test('4.1秒查询完成后手动核验成功；10秒才终止慢查询', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let delay = 4100, calls = 0
  const service = bound(() => detectClientProcessSessions({ platform: 'win32', execFileImpl: (_exe, _args, options, callback) => {
    calls++
    assert.equal(options.timeout, 10000)
    const timeout = setTimeout(() => callback(Object.assign(new Error(), { killed: true, signal: 'SIGTERM' })), options.timeout)
    setTimeout(() => { clearTimeout(timeout); callback(null, JSON.stringify([session])) }, delay)
  } }))
  t.after(() => service.stop())
  let settled = false
  const pending = service.ensureCurrentContext(123).then(value => { settled = true; return value })
  await flush(); t.mock.timers.tick(3001); await flush(); assert.equal(settled, false)
  t.mock.timers.tick(1099); await flush()
  assert.equal((await pending).processId, 123)
  delay = 11000
  const retry = service.ensureCurrentContext(123)
  const rejection = assert.rejects(retry, { code: 'timeout', message: '游戏进程查询超时（10 秒），请稍后重新开始' })
  await flush(); t.mock.timers.tick(10000); await rejection
  assert.ok(service.currentContext())
  assert.equal(calls, 2)
})

test('两类查询保留分类与退出信息，支持同步启动异常', async () => {
  for (const query of [options => detectClientProcessSessions(options), options => detectClientProcessExists(123, options)]) {
    for (const [error, code] of [
      [{ killed: true, signal: 'SIGTERM' }, 'timeout'],
      [{ code: 'ENOENT', syscall: 'spawn powershell.exe' }, 'spawn'],
      [{ code: 1 }, 'execution']
    ]) {
      await assert.rejects(query({ platform: 'win32', execFileImpl: (_e, _a, _o, cb) => cb(Object.assign(new Error('private output'), error)) }), e => {
        assert.equal(e.code, code); assert.equal(e.exitCode, error.code ?? null)
        assert.ok(e.elapsedMs >= 0); assert.equal(e.message.includes('private'), false); return true
      })
    }
    await assert.rejects(query({ platform: 'win32', execFileImpl() { throw new Error('private') } }), { code: 'spawn' })
    await assert.rejects(query({ platform: 'win32', execFileImpl: (_e, _a, _o, cb) => cb(null, 'broken') }), { code: 'parse' })
  }
})

test('诊断相同失败限流一分钟，恢复一次；null替身视为未知失败', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 100000 })
  const records = []; let result = new ProcessProbeError('timeout', { elapsedMs: 10001 })
  const service = bound(async () => { if (result instanceof Error) throw result; return result }, { record: event => records.push(event) })
  t.after(() => service.stop())
  await service.pollProcess(); await service.pollProcess()
  assert.equal(records.length, 1); assert.ok(service.currentContext())
  t.mock.timers.tick(59999); await service.pollProcess(); assert.equal(records.length, 1)
  t.mock.timers.tick(1); await service.pollProcess(); assert.equal(records.length, 2)
  result = [session]; await service.pollProcess(); await service.pollProcess()
  assert.equal(records.length, 3); assert.equal(records[2].outcome, 'recovered')
  result = null; await assert.rejects(service.ensureCurrentContext(123), { code: 'unknown' })
  assert.equal(records.at(-1).reasonCode, 'unknown')
  assert.deepEqual(JSON.parse(records[0].message), { elapsedMs: 10001, exitCode: null, signal: null })
})

test('独立PID查询失败手动显示原因，后台不清空区域，随后重试恢复', async t => {
  const service = bound(async () => [])
  t.after(() => service.stop())
  service.processPresenceProvider = async () => { throw new ProcessProbeError('execution') }
  await service.pollProcess(); assert.ok(service.currentContext())
  await assert.rejects(service.ensureCurrentContext(123), { code: 'execution' })
  service.processProvider = async () => [session]
  assert.equal((await service.ensureCurrentContext(123)).processId, 123)
})

test('后台慢轮询复用请求，完成后等待整秒；停止后迟到查询不复活', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let calls = 0, finish
  const service = bound(() => { calls++; return new Promise(resolve => { finish = resolve }) })
  t.after(() => service.stop())
  service.scheduleProcessPoll(service.generation)
  t.mock.timers.tick(1000); await flush(); assert.equal(calls, 1)
  const shared = service.pollProcess()
  t.mock.timers.tick(5000); await flush(); assert.equal(calls, 1)
  finish([session]); await shared; await flush()
  t.mock.timers.tick(999); await flush(); assert.equal(calls, 1)
  t.mock.timers.tick(1); await flush(); assert.equal(calls, 2)
  await service.stop(); finish([session]); await flush()
  t.mock.timers.tick(20000); await flush()
  assert.equal(calls, 2); assert.equal(service.processTimer, null)
  assert.equal(service.currentContext(), null)
})

test('旧代失败不能覆盖新代诊断、清理新请求或重新调度', async () => {
  let rejectOld, finishNew
  const records = []
  const service = bound(() => new Promise((_resolve, reject) => { rejectOld = reject }), { record: e => records.push(e) })
  const old = service.pollProcess(); await flush()
  await service.stop()
  service.status.enabled = true
  service.processProvider = () => new Promise(resolve => { finishNew = resolve })
  const current = service.pollProcess(); await flush()
  const pending = service.processPoll
  rejectOld(new ProcessProbeError('timeout')); await old
  assert.equal(service.processPoll, pending); assert.equal(records.length, 0)
  assert.equal(service.probeErrors.size, 0)
  finishNew([session]); await current; await service.stop()
})

test('尚未执行的旧探测在停止后不会调用provider；诊断写入失败不影响重试', async () => {
  let calls = 0
  const service = bound(async () => { calls++; return [session] })
  const pending = service.probeProcesses()
  await service.stop(); await pending
  assert.equal(calls, 0)
  service.logger = { record() { throw new Error('log unavailable') } }
  service.processProvider = async () => { throw new ProcessProbeError('parse') }
  assert.equal(await service.probeProcesses(), null)
  service.processProvider = async () => [session]
  assert.deepEqual(await service.probeProcesses(), [session])
})

test('手动核验等待已有查询后另开新请求，不用旧会话缓存通过核验', async () => {
  let calls = 0, finish
  const service = bound(() => { calls++; return new Promise(resolve => { finish = resolve }) })
  const old = service.probeProcesses(); await flush()
  const manual = service.ensureCurrentContext(123)
  const rejected = assert.rejects(manual, /启动时间/)
  await flush(); assert.equal(calls, 1)
  finish([session]); await old; await flush(); assert.equal(calls, 2)
  finish([{ id: 123, startedAt: null }]); await rejected
  await service.stop()
})
