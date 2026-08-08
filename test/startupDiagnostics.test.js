import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  createStartupLogger
} from '../electron/modules/system/startupLog.js'
import {
  buildSafeModeArgs,
  createCrashGuard,
  shouldRecoverStartupCrash
} from '../electron/modules/system/crashGuard.js'

function withTempDirectory(run) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'poe-startup-diagnostics-'))
  try {
    return run(directory)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

test('启动日志写入结构化事件并脱敏路径与凭据', () => withTempDirectory((directory) => {
  const logger = createStartupLogger({
    userDataPath: directory,
    homeDirectory: 'C:\\Users\\Alice',
    now: () => new Date('2026-08-08T01:02:03.000Z')
  })

  assert.equal(logger.record({
    phase: 'renderer',
    outcome: 'failed',
    reasonCode: 'renderer_bootstrap_failed',
    message: 'C:\\Users\\Alice\\app token=secret-value Cookie=session-secret'
  }), true)

  const event = JSON.parse(readFileSync(logger.filePath, 'utf8').trim())
  assert.deepEqual({
    timestamp: event.timestamp,
    phase: event.phase,
    outcome: event.outcome,
    reasonCode: event.reasonCode
  }, {
    timestamp: '2026-08-08T01:02:03.000Z',
    phase: 'renderer',
    outcome: 'failed',
    reasonCode: 'renderer_bootstrap_failed'
  })
  assert.doesNotMatch(event.message, /Alice|secret-value|session-secret/)
  assert.match(event.message, /redacted|local-path|USERPROFILE/i)
}))

test('启动日志超过限制时只保留当前和上一份日志', () => withTempDirectory((directory) => {
  const logger = createStartupLogger({ userDataPath: directory, maxBytes: 180 })
  logger.record({ phase: 'boot', outcome: 'started', message: 'a'.repeat(160) })
  logger.record({ phase: 'ready', outcome: 'started', message: 'second' })

  assert.equal(existsSync(logger.previousPath), true)
  assert.match(readFileSync(logger.previousPath, 'utf8'), /"phase":"boot"/)
  assert.match(readFileSync(logger.filePath, 'utf8'), /"phase":"ready"/)
  assert.equal(existsSync(path.join(logger.directory, 'startup.2.log')), false)
}))

test('启动日志目录不可写时静默降级并返回 false', () => {
  const fileSystem = {
    mkdirSync() { throw new Error('denied') }
  }
  const logger = createStartupLogger({ userDataPath: 'X:\\blocked', fileSystem })
  assert.equal(logger.record({ phase: 'boot', outcome: 'failed' }), false)
})

test('恢复策略只允许早期渲染器和 GPU 崩溃且安全模式不重复恢复', () => {
  const base = { startedAt: 1000, now: 2000, graceMs: 30000, safeMode: false }
  assert.equal(shouldRecoverStartupCrash({ ...base, source: 'renderer', details: { reason: 'crashed' } }), true)
  assert.equal(shouldRecoverStartupCrash({ ...base, source: 'renderer', details: { reason: 'abnormal-exit' } }), true)
  assert.equal(shouldRecoverStartupCrash({ ...base, source: 'child', details: { type: 'GPU', reason: 'crashed' } }), true)
  for (const reason of ['oom', 'launch-failed', 'integrity-failure', 'killed', 'clean-exit']) {
    assert.equal(shouldRecoverStartupCrash({ ...base, source: 'renderer', details: { reason } }), false)
  }
  assert.equal(shouldRecoverStartupCrash({ ...base, source: 'child', details: { type: 'Network Service', reason: 'crashed' } }), false)
  assert.equal(shouldRecoverStartupCrash({ ...base, source: 'renderer', details: { reason: 'crashed' }, safeMode: true }), false)
  assert.equal(shouldRecoverStartupCrash({ ...base, source: 'renderer', details: { reason: 'crashed' }, now: 40001 }), false)
})

test('安全模式参数保留原参数并去重', () => {
  assert.deepEqual(
    buildSafeModeArgs(['electron/main.js', '--flag', '--disable-gpu']),
    ['electron/main.js', '--flag', '--disable-gpu', '--startup-safe-mode']
  )
})

test('崩溃保护对可恢复故障只请求一次重启', () => {
  const records = []
  const app = {
    relaunchCalls: [], exitCalls: [], listeners: new Map(),
    on(name, listener) { this.listeners.set(name, listener) },
    removeListener(name) { this.listeners.delete(name) },
    relaunch(options) { this.relaunchCalls.push(options) },
    exit(code) { this.exitCalls.push(code) }
  }
  const processObject = {
    argv: ['app.exe'], listeners: new Map(),
    on(name, listener) { this.listeners.set(name, listener) },
    removeListener(name) { this.listeners.delete(name) }
  }
  const guard = createCrashGuard({
    app,
    processObject,
    log: { record: event => records.push(event) },
    startedAt: 1000,
    now: () => 2000
  })
  guard.install()

  assert.equal(guard.handleRendererGone({ reason: 'crashed', exitCode: 9 }), true)
  assert.equal(guard.handleRendererGone({ reason: 'crashed', exitCode: 9 }), false)
  assert.equal(app.relaunchCalls.length, 1)
  assert.deepEqual(app.relaunchCalls[0].args, ['--disable-gpu', '--startup-safe-mode'])
  assert.deepEqual(app.exitCalls, [0])
  assert.equal(records.some(event => event.reasonCode === 'renderer_crashed'), true)
})

test('主进程未捕获异常同步记录后受控退出而不是继续运行', () => {
  const records = []
  const app = {
    exitCalls: [], listeners: new Map(),
    on(name, listener) { this.listeners.set(name, listener) },
    removeListener(name) { this.listeners.delete(name) },
    exit(code) { this.exitCalls.push(code) }
  }
  const processObject = {
    argv: ['app.exe'], listeners: new Map(),
    on(name, listener) { this.listeners.set(name, listener) },
    removeListener(name) { this.listeners.delete(name) }
  }
  const guard = createCrashGuard({ app, processObject, log: { record: event => records.push(event) } })
  guard.install()
  processObject.listeners.get('uncaughtException')(new Error('fatal startup error'))

  assert.deepEqual(app.exitCalls, [1])
  assert.equal(records.at(-1).reasonCode, 'uncaught_exception')
  guard.dispose()
})

test('非 GPU Chromium 子进程退出只记录而不终止应用', () => {
  const records = []
  const failures = []
  const app = {
    relaunchCalls: [], exitCalls: [],
    relaunch(value) { this.relaunchCalls.push(value) },
    exit(value) { this.exitCalls.push(value) }
  }
  const guard = createCrashGuard({
    app,
    log: { record: event => records.push(event) },
    onUnrecoverable: failure => failures.push(failure),
    startedAt: 1000,
    now: () => 2000
  })

  assert.equal(guard.handleChildProcessGone({ type: 'Network Service', reason: 'crashed', exitCode: 1 }), false)
  assert.equal(records.at(-1).reasonCode, 'child_crashed')
  assert.deepEqual(failures, [])
  assert.deepEqual(app.exitCalls, [])
  assert.deepEqual(app.relaunchCalls, [])
})

function observedWindow() {
  const window = new EventEmitter()
  window.webContents = new EventEmitter()
  return window
}

test('页面加载失败只在首次挂载前对真实主框架错误执行致命诊断', () => {
  const failures = []
  const records = []
  const guard = createCrashGuard({
    log: { record: event => records.push(event) },
    onUnrecoverable: failure => failures.push(failure)
  })
  const window = observedWindow()
  guard.observeWindow(window)

  window.webContents.emit('did-fail-load', {}, -3, 'ERR_ABORTED', 'http://localhost:5173', true)
  assert.equal(failures.length, 0)
  assert.equal(records.at(-1).reasonCode, 'page_load_failed')

  window.webContents.emit('did-fail-load', {}, -102, 'ERR_CONNECTION_REFUSED', 'http://localhost:5173', false)
  assert.equal(failures.length, 0)

  window.webContents.emit('did-fail-load', {}, -102, 'ERR_CONNECTION_REFUSED', 'http://localhost:5173', true)
  assert.equal(failures.length, 1)
  assert.equal(failures[0].reasonCode, 'page_load_failed')
})

test('首次挂载完成后的主框架加载失败只记录且允许恢复', () => {
  const failures = []
  const records = []
  const guard = createCrashGuard({
    log: { record: event => records.push(event) },
    onUnrecoverable: failure => failures.push(failure)
  })
  const window = observedWindow()
  guard.observeWindow(window)
  guard.markStartupComplete()

  window.webContents.emit('did-fail-load', {}, -102, 'ERR_CONNECTION_REFUSED', 'http://localhost:5173', true)
  assert.equal(guard.startupComplete, true)
  assert.equal(failures.length, 0)
  assert.equal(records.at(-1).reasonCode, 'page_load_failed')
})
