import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { ShutdownTimeoutError as _m0_ShutdownTimeoutError, createShutdownController as _m0_createShutdownController } from '../electron/modules/lifecycle/shutdown.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFileSync as _m1_readFileSync } from 'node:fs'
import { StrictCleanupTimeoutError as _m1_StrictCleanupTimeoutError } from '../electron/modules/lifecycle/strictCleanup.js'
import { createApplicationRestartController as _m1_createApplicationRestartController } from '../electron/modules/lifecycle/restart.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { EventEmitter as _m2_EventEmitter } from 'node:events'
import { ApplicationUpdateService as _m2_ApplicationUpdateService, isStableNewerVersion as _m2_isStableNewerVersion, sanitizeUpdateError as _m2_sanitizeUpdateError } from '../electron/modules/update/service.js'
import { runStrictCleanup as _m2_runStrictCleanup, StrictCleanupTimeoutError as _m2_StrictCleanupTimeoutError } from '../electron/modules/lifecycle/strictCleanup.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { createApplicationUpdateEntryActionRunner as _m3_createApplicationUpdateEntryActionRunner, runApplicationUpdateEntryAction as _m3_runApplicationUpdateEntryAction } from '../src/utils/applicationUpdateAction.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { readFileSync as _m4_readFileSync } from 'node:fs'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { readFileSync as _m5_readFileSync } from 'node:fs'
import { runInNewContext as _m5_runInNewContext } from 'node:vm'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { createPinia as _m6_createPinia, setActivePinia as _m6_setActivePinia } from 'pinia'
import { electronApi as _m6_electronApi } from '../src/api/electron.js'
import { useApplicationUpdateStore as _m6_useApplicationUpdateStore } from '../src/stores/applicationUpdate.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { mkdtemp as _m7_mkdtemp, rm as _m7_rm, readFile as _m7_readFile } from 'node:fs/promises'
import _m7_os from 'node:os'
import _m7_path from 'node:path'
import { MapTrackerService as _m7_MapTrackerService } from '../electron/modules/mapTracker/service.js'
import { MapTrackerRepository as _m7_MapTrackerRepository } from '../electron/modules/mapTracker/repository.js'
import { sanitizeStartupReport as _m7_sanitizeStartupReport } from '../electron/modules/system/startupEvent.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { appendFile as _m8_appendFile, mkdir as _m8_mkdir, mkdtemp as _m8_mkdtemp, rename as _m8_rename, truncate as _m8_truncate, unlink as _m8_unlink, writeFile as _m8_writeFile } from 'node:fs/promises'
import _m8_os from 'node:os'
import _m8_path from 'node:path'
import { parseClientLogLine as _m8_parseClientLogLine } from '../electron/modules/clientEvents/parser.js'
import { ClientLogTailer as _m8_ClientLogTailer } from '../electron/modules/clientEvents/tailer.js'
import { ClientEventsService as _m8_ClientEventsService } from '../electron/modules/clientEvents/service.js'
import { ClientEventSettingsRepository as _m8_ClientEventSettingsRepository, deriveClientLogPath as _m8_deriveClientLogPath } from '../electron/modules/clientEvents/settingsRepository.js'
import { detectRunningClientLogPath as _m8_detectRunningClientLogPath } from '../electron/modules/clientEvents/pathDetection.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { ClientEventsService as _m9_ClientEventsService } from '../electron/modules/clientEvents/service.js'
import { parseClientLogLine as _m9_parseClientLogLine } from '../electron/modules/clientEvents/parser.js'
import { SanctumLogContext as _m9_SanctumLogContext } from '../electron/modules/sanctum/logContext.js'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import { mkdtemp as _m10_mkdtemp, writeFile as _m10_writeFile, appendFile as _m10_appendFile, rm as _m10_rm } from 'node:fs/promises'
import _m10_os from 'node:os'
import _m10_path from 'node:path'
import { detectClientProcessSessions as _m10_detectClientProcessSessions, detectClientProcessExists as _m10_detectClientProcessExists } from '../electron/modules/clientEvents/processDetection.js'
import { ClientEventsService as _m10_ClientEventsService } from '../electron/modules/clientEvents/service.js'
import { SanctumLogContext as _m10_SanctumLogContext } from '../electron/modules/sanctum/logContext.js'
import _m11_test from 'node:test'
import _m11_assert from 'node:assert/strict'
import { detectClientProcessSessions as _m11_detectClientProcessSessions, detectClientProcessExists as _m11_detectClientProcessExists, ProcessProbeError as _m11_ProcessProbeError } from '../electron/modules/clientEvents/processDetection.js'
import { ClientEventsService as _m11_ClientEventsService } from '../electron/modules/clientEvents/service.js'

// === Merged from appShutdown.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const ShutdownTimeoutError = _m0_ShutdownTimeoutError
  const createShutdownController = _m0_createShutdownController
function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

function createFakeApp() {
  const listeners = new Map()
  return {
    quitCalls: 0,
    on(event, listener) {
      listeners.set(event, listener)
    },
    quit() {
      this.quitCalls += 1
    },
    emitBeforeQuit() {
      const event = {
        defaultPrevented: false,
        preventDefault() {
          this.defaultPrevented = true
        }
      }
      listeners.get('before-quit')?.(event)
      return event
    }
  }
}

test('before-quit 会等待异步清理完成后再次退出', async () => {
  const app = createFakeApp()
  const pending = deferred()
  const controller = createShutdownController({
    app,
    cleanup: () => pending.promise,
    timeoutMs: 1000
  })

  const event = app.emitBeforeQuit()
  assert.equal(event.defaultPrevented, true)
  assert.equal(controller.state, 'cleaning')
  assert.equal(app.quitCalls, 0)

  pending.resolve()
  await controller.done

  assert.equal(controller.state, 'ready')
  assert.equal(app.quitCalls, 1)
  assert.equal(app.emitBeforeQuit().defaultPrevented, false)
})

test('重复退出请求只执行一次清理', async () => {
  const app = createFakeApp()
  const pending = deferred()
  let cleanupCalls = 0
  const controller = createShutdownController({
    app,
    cleanup: () => {
      cleanupCalls += 1
      return pending.promise
    },
    timeoutMs: 1000
  })

  app.emitBeforeQuit()
  app.emitBeforeQuit()
  controller.requestShutdown()
  await Promise.resolve()
  assert.equal(cleanupCalls, 1)

  pending.resolve()
  await controller.done
  assert.equal(app.quitCalls, 1)
})

test('清理失败仍恢复 Electron 退出', async () => {
  const app = createFakeApp()
  const errors = []
  const controller = createShutdownController({
    app,
    cleanup: async () => {
      throw new Error('cleanup failed')
    },
    onError: (error) => errors.push(error),
    timeoutMs: 1000
  })

  app.emitBeforeQuit()
  await controller.done

  assert.equal(errors.length, 1)
  assert.match(errors[0].message, /cleanup failed/)
  assert.equal(controller.state, 'ready')
  assert.equal(app.quitCalls, 1)
})

test('清理超时不会让应用永久驻留', async () => {
  const app = createFakeApp()
  const errors = []
  const controller = createShutdownController({
    app,
    cleanup: () => new Promise(() => {}),
    onError: (error) => errors.push(error),
    timeoutMs: 10
  })

  app.emitBeforeQuit()
  await controller.done

  assert.equal(errors.length, 1)
  assert.ok(errors[0] instanceof ShutdownTimeoutError)
  assert.equal(app.quitCalls, 1)
})

test('主窗口关闭会发起完整应用退出', () => {
  const app = createFakeApp()
  const controller = createShutdownController({
    app,
    cleanup: async () => {},
    timeoutMs: 1000
  })

  controller.handleMainWindowClose()

  assert.equal(app.quitCalls, 1)
})

test('外部严格清理完成后 before-quit 不重复执行清理', () => {
  const app = createFakeApp()
  let cleanupCalls = 0
  const controller = createShutdownController({ app, cleanup: async () => { cleanupCalls += 1 } })
  controller.markCleanupComplete()
  const event = app.emitBeforeQuit()
  assert.equal(event.defaultPrevented, false)
  assert.equal(cleanupCalls, 0)
})

test('主进程接入统一退出控制且不会扫描终止系统中的其他 Python', () => {
  const main = readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8')
  const pythonProcess = readFileSync(new URL('../electron/modules/python/process.js', import.meta.url), 'utf8')

  assert.match(main, /createShutdownController/)
  assert.match(main, /applicationTray\?\.handleMainWindowClose\(event, window\)/)
  assert.match(main, /shutdownController\.handleMainWindowClose\(\)/)
  assert.match(main, /BrowserWindow\.getAllWindows\(\)/)
  assert.match(main, /throw new AggregateError\(errors/)
  assert.match(main, /applicationCleanupPromise/)
  assert.match(main, /cleanupApplicationResourcesOnce/)
  assert.match(main, /requestShutdown: \(\) => app\.quit\(\)/)
  assert.doesNotMatch(main, /app\.on\('before-quit', async/)
  assert.doesNotMatch(pythonProcess, /tasklist .*python\.exe/)
  assert.match(pythonProcess, /if \(!stopped\) throw new Error/)
})
})()

// === Merged from applicationRestart.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFileSync = _m1_readFileSync
  const StrictCleanupTimeoutError = _m1_StrictCleanupTimeoutError
  const createApplicationRestartController = _m1_createApplicationRestartController
function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

test('应用重启按清理、缓存失效、完成退出清理、拉起新实例的顺序执行', async () => {
  const calls = []
  const controller = createApplicationRestartController({
    cleanup: async () => { calls.push('cleanup') },
    clearCache: async () => { calls.push('clear-cache') },
    markCleanupComplete: () => { calls.push('mark-clean') },
    restart: async () => { calls.push('restart') },
    terminateAfterFailure: () => { calls.push('terminate') }
  })

  const result = await controller.requestRestart()

  assert.deepEqual(result, { success: true })
  assert.deepEqual(calls, ['cleanup', 'clear-cache', 'mark-clean', 'restart'])
  assert.equal(controller.restarting, true)
})

test('重复重启请求共享同一流程且只清理和拉起一次', async () => {
  const pending = deferred()
  let cleanupCalls = 0
  let restartCalls = 0
  const controller = createApplicationRestartController({
    cleanup: async () => {
      cleanupCalls += 1
      await pending.promise
    },
    clearCache: async () => {},
    markCleanupComplete: () => {},
    restart: async () => { restartCalls += 1 },
    terminateAfterFailure: () => {}
  })

  const first = controller.requestRestart()
  const second = controller.requestRestart()
  assert.equal(first, second)

  pending.resolve()
  assert.deepEqual(await first, { success: true })
  assert.equal(cleanupCalls, 1)
  assert.equal(restartCalls, 1)
})

test('资源清理失败时保留根因、终止旧实例且不清缓存或拉起', async () => {
  const failure = new Error('managed process did not stop')
  const errors = []
  const calls = []
  const controller = createApplicationRestartController({
    cleanup: async () => { throw failure },
    clearCache: async () => { calls.push('clear-cache') },
    markCleanupComplete: () => { calls.push('mark-clean') },
    restart: async () => { calls.push('restart') },
    onError: error => errors.push(error),
    terminateAfterFailure: error => calls.push(['terminate', error])
  })

  const result = await controller.requestRestart()

  assert.equal(result.success, false)
  assert.equal(result.error, failure)
  assert.deepEqual(errors, [failure])
  assert.deepEqual(calls, [['terminate', failure]])
})

test('资源清理超时时不拉起新实例并把超时错误交给终止路径', async () => {
  const errors = []
  let restartCalls = 0
  const controller = createApplicationRestartController({
    cleanup: () => new Promise(() => {}),
    clearCache: async () => {},
    markCleanupComplete: () => {},
    restart: async () => { restartCalls += 1 },
    terminateAfterFailure: error => errors.push(error),
    timeoutMs: 10
  })

  const result = await controller.requestRestart()

  assert.equal(result.success, false)
  assert.ok(result.error instanceof StrictCleanupTimeoutError)
  assert.equal(errors[0], result.error)
  assert.equal(restartCalls, 0)
})

test('页面缓存失效失败时不拉起新实例，也不清除或伪造原始错误', async () => {
  const failure = new Error('cache unavailable')
  let restartCalls = 0
  let terminatedWith = null
  const controller = createApplicationRestartController({
    cleanup: async () => {},
    clearCache: async () => { throw failure },
    markCleanupComplete: () => {},
    restart: async () => { restartCalls += 1 },
    onError: () => { throw new Error('logger failed') },
    terminateAfterFailure: error => { terminatedWith = error }
  })

  const result = await controller.requestRestart()

  assert.equal(result.error, failure)
  assert.equal(terminatedWith, failure)
  assert.equal(restartCalls, 0)
})

test('主进程只清理主窗口页面缓存并接入正式版与开发版重启路径', () => {
  const main = readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8')
  const manager = readFileSync(new URL('../electron/modules/window/manager.js', import.meta.url), 'utf8')

  assert.match(main, /createApplicationRestartController/)
  assert.match(main, /webContents\.session\.clearCache\(\)/)
  assert.doesNotMatch(main, /clearStorageData\(|cookies\.remove\(/)
  assert.match(main, /app\.relaunch\(\)/)
  assert.match(main, /DEVELOPMENT_RESTART_EXIT_CODE/)
  assert.match(main, /requestForceRefresh:\s*\(\)\s*=>/)
  assert.match(manager, /requestForceRefresh/)
  assert.doesNotMatch(manager, /reloadIgnoringCache/)
})
})()

// === Merged from applicationUpdate.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const EventEmitter = _m2_EventEmitter
  const ApplicationUpdateService = _m2_ApplicationUpdateService
  const isStableNewerVersion = _m2_isStableNewerVersion
  const sanitizeUpdateError = _m2_sanitizeUpdateError
  const runStrictCleanup = _m2_runStrictCleanup
  const StrictCleanupTimeoutError = _m2_StrictCleanupTimeoutError
class FakeUpdater extends EventEmitter {
  constructor() {
    super()
    this.checkCalls = 0
    this.downloadCalls = 0
    this.installCalls = 0
    this.installArguments = []
    this.feedURLs = []
    this.checkImplementation = async () => {}
    this.downloadImplementation = async () => {}
  }

  checkForUpdates() {
    this.checkCalls += 1
    return this.checkImplementation()
  }

  downloadUpdate() {
    this.downloadCalls += 1
    return this.downloadImplementation()
  }

  quitAndInstall(...args) {
    this.installCalls += 1
    this.installArguments.push(args)
  }

  setFeedURL(options) {
    this.feedURLs.push(options)
  }
}

function fakeScheduler() {
  const timeouts = new Map()
  const intervals = new Map()
  let id = 0
  return {
    timeouts,
    intervals,
    setTimeout(callback, delay) {
      const key = ++id
      timeouts.set(key, { callback: () => { timeouts.delete(key); return callback() }, delay })
      return key
    },
    clearTimeout(key) { timeouts.delete(key) },
    setInterval(callback, delay) { const key = ++id; intervals.set(key, { callback, delay }); return key },
    clearInterval(key) { intervals.delete(key) }
  }
}

function createService(options = {}) {
  const updater = options.updater || new FakeUpdater()
  const scheduler = options.scheduler || fakeScheduler()
  const service = new ApplicationUpdateService({
    updater,
    scheduler,
    currentVersion: '1.0.2',
    isPackaged: true,
    cleanup: options.cleanup || (async () => {}),
    markCleanupComplete: options.markCleanupComplete || (() => {}),
    requestShutdown: options.requestShutdown || (() => {}),
    checkIntervalMs: 60,
    cleanupTimeoutMs: options.cleanupTimeoutMs || 50
  })
  return { service, updater, scheduler }
}

test('只接受高于当前版本的稳定 semver', () => {
  assert.equal(isStableNewerVersion('1.0.3', '1.0.2'), true)
  assert.equal(isStableNewerVersion('1.0.3-beta.1', '1.0.2'), false)
  assert.equal(isStableNewerVersion('1.0.1', '1.0.2'), false)
  assert.equal(isStableNewerVersion('bad', '1.0.2'), false)
})

test('手动检查发布无更新和可用更新状态', async () => {
  const { service, updater } = createService()
  updater.checkImplementation = async () => updater.emit('update-not-available', { version: '1.0.2' })
  await service.check()
  assert.equal(service.snapshot().status, 'not-available')

  updater.checkImplementation = async () => updater.emit('update-available', {
    version: '1.0.3', releaseDate: '2026-08-08T00:00:00Z', releaseNotes: [{ note: '修复 A' }, { note: '改进 B' }]
  })
  await service.check()
  assert.equal(service.snapshot().status, 'available')
  assert.equal(service.snapshot().availableVersion, '1.0.3')
  assert.equal(service.snapshot().releaseNotes, '修复 A\n\n改进 B')
})

test('下载源默认 CNB 且可在空闲时手动切换 GitHub', async () => {
  const { service, updater } = createService()
  assert.equal(service.snapshot().source, 'cnb')
  updater.emit('update-available', { version: '1.0.3' })

  const github = service.configure({ mode: 'manual', source: 'github' })
  assert.equal(github.source, 'github')
  assert.equal(github.status, 'idle')
  assert.equal(github.availableVersion, '')
  assert.deepEqual(updater.feedURLs.at(-1), {
    provider: 'generic',
    url: 'https://github.com/szb-66/POE-TOOL-MX/releases/latest/download'
  })

  const cnb = service.configure({ mode: 'manual', source: 'cnb' })
  assert.equal(cnb.source, 'cnb')
  assert.deepEqual(updater.feedURLs.at(-1), {
    provider: 'generic',
    url: 'https://cnb.cool/Auto-Tool-MX/POE-TOOL-MX/-/releases/latest/download'
  })
})

test('检查进行中拒绝切换下载源', async () => {
  const { service, updater } = createService()
  let finish
  updater.checkImplementation = () => new Promise(resolve => { finish = resolve })
  const checking = service.check()
  assert.throws(
    () => service.configure({ mode: 'manual', source: 'github' }),
    /更新操作进行中/
  )
  updater.emit('update-not-available', { version: '1.0.2' })
  finish()
  await checking
})

test('下载进度和完成状态可观测且不自动安装', async () => {
  const { service, updater } = createService()
  updater.checkImplementation = async () => updater.emit('update-available', { version: '1.0.3' })
  await service.check()
  updater.downloadImplementation = async () => {
    updater.emit('download-progress', { percent: 42.4, transferred: 42, total: 100, bytesPerSecond: 5 })
    updater.emit('update-downloaded', { version: '1.0.3' })
  }
  await service.download()
  assert.equal(service.snapshot().status, 'downloaded')
  assert.equal(service.snapshot().progress.percent, 100)
  assert.equal(updater.installCalls, 0)
})

test('下载失败保留可用版本并允许直接重试', async () => {
  const { service, updater } = createService()
  updater.checkImplementation = async () => updater.emit('update-available', { version: '1.0.3' })
  await service.check()
  updater.downloadImplementation = async () => { throw new Error('network failed') }
  const first = await service.download()
  assert.equal(first.success, false)
  assert.equal(service.snapshot().status, 'available')
  updater.downloadImplementation = async () => updater.emit('update-downloaded', { version: '1.0.3' })
  const retry = await service.download()
  assert.equal(retry.success, true)
  assert.equal(service.snapshot().status, 'downloaded')
  assert.equal(updater.downloadCalls, 2)
})

test('自动模式仅安排周期检查，切换手动后清理定时器', async () => {
  const { service, updater, scheduler } = createService()
  updater.checkImplementation = async () => updater.emit('update-not-available', { version: '1.0.2' })
  service.configure({ mode: 'automatic' })
  assert.equal(scheduler.timeouts.size, 0)
  assert.equal([...scheduler.intervals.values()][0].delay, 60)
  await [...scheduler.intervals.values()][0].callback()
  assert.equal(updater.checkCalls, 1)
  service.configure({ mode: 'manual' })
  assert.equal(scheduler.timeouts.size, 0)
  assert.equal(scheduler.intervals.size, 0)
  assert.equal(updater.autoDownload, false)
})

test('自动周期检查发现新版本后下载但不安装', async () => {
  const { service, updater, scheduler } = createService()
  updater.checkImplementation = async () => {
    updater.emit('update-available', { version: '1.0.3' })
    if (updater.autoDownload) {
      updater.emit('download-progress', { percent: 50, transferred: 50, total: 100 })
      updater.emit('update-downloaded', { version: '1.0.3' })
    }
  }
  service.configure({ mode: 'automatic' })
  await [...scheduler.intervals.values()][0].callback()
  assert.equal(service.snapshot().status, 'downloaded')
  assert.equal(updater.installCalls, 0)
})

test('重复检查会返回 busy 且不启动第二个请求', async () => {
  const { service, updater } = createService()
  let finish
  updater.checkImplementation = () => new Promise(resolve => { finish = resolve })
  const first = service.check()
  const second = await service.check()
  assert.equal(second.busy, true)
  assert.equal(updater.checkCalls, 1)
  updater.emit('update-not-available', { version: '1.0.2' })
  finish()
  await first
})

test('错误脱敏 URL、本地路径与凭据', () => {
  const message = sanitizeUpdateError(new Error('GET https://x.test/latest.yml?token=secret C:\\Users\\A\\file token=abc'))
  assert.doesNotMatch(message, /secret|Users|abc/)
  assert.match(message, /\[update-source\]|\[local-path\]|\[redacted\]/)
})

test('严格清理成功后标记完成并安装，失败时请求受控退出', async () => {
  let failCleanup = false
  let cleanupCompleteCalls = 0
  let shutdownCalls = 0
  const { service, updater } = createService({
    cleanup: async () => { if (failCleanup) throw new Error('cleanup failed') },
    markCleanupComplete: () => { cleanupCompleteCalls += 1 },
    requestShutdown: () => { shutdownCalls += 1 }
  })
  updater.emit('update-downloaded', { version: '1.0.3' })
  failCleanup = true
  const failed = await service.restartAndInstall()
  assert.equal(failed.success, false)
  assert.equal(failed.reason, 'cleanup-failed')
  assert.equal(service.snapshot().status, 'error')
  assert.equal(updater.installCalls, 0)
  assert.equal(cleanupCompleteCalls, 0)
  assert.equal(shutdownCalls, 1)

  const successful = createService({ markCleanupComplete: () => { cleanupCompleteCalls += 1 } })
  successful.updater.emit('update-downloaded', { version: '1.0.3' })
  const installed = await successful.service.restartAndInstall()
  assert.equal(installed.success, true)
  assert.equal(successful.updater.installCalls, 1)
  assert.deepEqual(successful.updater.installArguments[0], [false, true])
  assert.equal(cleanupCompleteCalls, 1)
})

test('安装前保存更新内容，失败时恢复已下载状态且不清理', async () => {
  const saved = []
  let cleanupCalls = 0
  const repository = {
    save: async record => { saved.push(record) },
    acknowledge: async () => true
  }
  const { service, updater } = createService({
    cleanup: async () => { cleanupCalls += 1 }
  })
  service.installedUpdateRepository = repository
  updater.emit('update-available', { version: '1.0.3', releaseNotes: '修复 A' })
  updater.emit('update-downloaded', { version: '1.0.3' })
  const result = await service.restartAndInstall()
  assert.equal(result.success, true)
  assert.deepEqual(saved, [{ targetVersion: '1.0.3', releaseNotes: '修复 A' }])
  assert.equal(cleanupCalls, 1)

  let failedCleanupCalls = 0
  const failed = createService({ cleanup: async () => { failedCleanupCalls += 1 } })
  failed.service.installedUpdateRepository = { save: async () => { throw new Error('record failed') } }
  failed.updater.emit('update-available', { version: '1.0.3', releaseNotes: '修复 A' })
  failed.updater.emit('update-downloaded', { version: '1.0.3' })
  const failure = await failed.service.restartAndInstall()
  assert.equal(failure.reason, 'update-record-failed')
  assert.equal(failure.state.status, 'downloaded')
  assert.equal(failedCleanupCalls, 0)
  assert.equal(failed.updater.installCalls, 0)
})

test('当前版本的升级内容可确认已读且广播清除', async () => {
  const acknowledgedVersions = []
  const { service } = createService()
  service.installedUpdateRepository = {
    acknowledge: async version => { acknowledgedVersions.push(version); return true }
  }
  service.state.installedUpdate = { targetVersion: '1.0.2', releaseNotes: '内容' }
  const result = await service.acknowledgeInstalledUpdate()
  assert.equal(result.acknowledged, true)
  assert.deepEqual(acknowledgedVersions, ['1.0.2'])
  assert.equal(service.snapshot().installedUpdate, null)
})

test('更新未下载与重复安装返回明确原因且不清理', async () => {
  let cleanupCalls = 0
  const pending = new Promise(() => {})
  const { service, updater } = createService({ cleanup: () => { cleanupCalls += 1; return pending } })
  const notReady = await service.restartAndInstall()
  assert.equal(notReady.reason, 'update-not-downloaded')
  assert.equal(cleanupCalls, 0)

  updater.emit('update-downloaded', { version: '1.0.3' })
  void service.restartAndInstall()
  await Promise.resolve()
  const busy = await service.restartAndInstall()
  assert.equal(busy.busy, true)
  assert.equal(busy.reason, 'install-in-progress')
  assert.equal(cleanupCalls, 1)
})

test('严格清理超时会拒绝', async () => {
  await assert.rejects(
    runStrictCleanup(() => new Promise(() => {}), 5),
    StrictCleanupTimeoutError
  )
})

test('安装前清理超时会请求受控退出', async () => {
  let shutdownCalls = 0
  const { service, updater } = createService({
    cleanup: () => new Promise(() => {}),
    cleanupTimeoutMs: 5,
    requestShutdown: () => { shutdownCalls += 1 }
  })
  updater.emit('update-downloaded', { version: '1.0.3' })
  const result = await service.restartAndInstall()
  assert.equal(result.success, false)
  assert.equal(result.reason, 'cleanup-timeout')
  assert.equal(shutdownCalls, 1)
  assert.equal(updater.installCalls, 0)
})
})()

// === Merged from applicationUpdateAction.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const createApplicationUpdateEntryActionRunner = _m3_createApplicationUpdateEntryActionRunner
  const runApplicationUpdateEntryAction = _m3_runApplicationUpdateEntryAction
function createUpdateController() {
  let confirmedVersion = ''
  const calls = { download: 0, install: 0 }
  return {
    calls,
    state: null,
    isVersionConfirmed: version => confirmedVersion === version,
    confirmVersion(version) { confirmedVersion = version; return true },
    download: async () => { calls.download += 1; return { success: true } },
    install: async () => { calls.install += 1; return { success: true } }
  }
}

test('取消标题栏更新确认时不下载也不安装', async () => {
  const update = createUpdateController()
  const result = await runApplicationUpdateEntryAction({
    state: { status: 'available', availableVersion: '1.0.3', releaseNotes: '修复 A' },
    update,
    confirm: async snapshot => {
      assert.equal(snapshot.releaseNotes, '修复 A')
      return false
    }
  })
  assert.equal(result.cancelled, true)
  assert.deepEqual(update.calls, { download: 0, install: 0 })
})

test('确认可用版本后只执行一次下载操作', async () => {
  const update = createUpdateController()
  let confirmCalls = 0
  const result = await runApplicationUpdateEntryAction({
    state: { status: 'available', availableVersion: '1.0.3' },
    update,
    confirm: async () => { confirmCalls += 1; return true }
  })
  assert.equal(result.success, true)
  assert.equal(confirmCalls, 1)
  assert.deepEqual(update.calls, { download: 1, install: 0 })
})

test('自动下载的未确认版本安装前确认，已确认版本不重复弹窗', async () => {
  const update = createUpdateController()
  let confirmCalls = 0
  const state = { status: 'downloaded', availableVersion: '1.0.3' }
  await runApplicationUpdateEntryAction({
    state,
    update,
    confirm: async () => { confirmCalls += 1; return true }
  })
  await runApplicationUpdateEntryAction({
    state,
    update,
    confirm: async () => { confirmCalls += 1; return true }
  })
  assert.equal(confirmCalls, 1)
  assert.deepEqual(update.calls, { download: 0, install: 2 })
})

test('目标版本变化后必须重新确认', async () => {
  const update = createUpdateController()
  let confirmCalls = 0
  for (const availableVersion of ['1.0.3', '1.0.4']) {
    await runApplicationUpdateEntryAction({
      state: { status: 'available', availableVersion },
      update,
      confirm: async () => { confirmCalls += 1; return true }
    })
  }
  assert.equal(confirmCalls, 2)
  assert.equal(update.calls.download, 2)
})

test('确认期间同一版本下载完成后按最新状态直接安装', async () => {
  const update = createUpdateController()
  update.state = { status: 'available', availableVersion: '1.0.3' }
  const result = await runApplicationUpdateEntryAction({
    state: { status: 'available', availableVersion: '1.0.3' },
    update,
    confirm: async () => {
      update.state = { status: 'downloaded', availableVersion: '1.0.3' }
      return true
    }
  })
  assert.equal(result.success, true)
  assert.deepEqual(update.calls, { download: 0, install: 1 })
})

test('更新确认未结束时连续点击只打开一个弹窗并执行一次下载', async () => {
  const update = createUpdateController()
  update.state = { status: 'available', availableVersion: '1.0.3' }
  let confirmCalls = 0
  let resolveConfirm
  const confirmPendingChanges = []
  const confirmation = new Promise(resolve => { resolveConfirm = resolve })
  const runEntryAction = createApplicationUpdateEntryActionRunner((pending) => {
    confirmPendingChanges.push(pending)
  })
  const options = {
    state: update.state,
    update,
    confirm: async () => {
      confirmCalls += 1
      return confirmation
    }
  }

  const first = runEntryAction(options)
  const duplicates = await Promise.all(Array.from({ length: 7 }, () => runEntryAction(options)))

  assert.equal(confirmCalls, 1)
  assert.ok(duplicates.every(result => result.busy && result.reason === 'entry-action-in-progress'))
  assert.deepEqual(update.calls, { download: 0, install: 0 })
  assert.deepEqual(confirmPendingChanges, [true])

  resolveConfirm(true)
  const result = await first
  assert.equal(result.success, true)
  assert.deepEqual(update.calls, { download: 1, install: 0 })
  assert.deepEqual(confirmPendingChanges, [true, false])
})

test('自动下载版本等待确认时连续点击只执行一次安装', async () => {
  const update = createUpdateController()
  update.state = { status: 'downloaded', availableVersion: '1.0.3' }
  let confirmCalls = 0
  let resolveConfirm
  const confirmation = new Promise(resolve => { resolveConfirm = resolve })
  const runEntryAction = createApplicationUpdateEntryActionRunner()
  const options = {
    state: update.state,
    update,
    confirm: async () => {
      confirmCalls += 1
      return confirmation
    }
  }

  const first = runEntryAction(options)
  const duplicate = await runEntryAction(options)

  assert.equal(confirmCalls, 1)
  assert.equal(duplicate.busy, true)
  assert.deepEqual(update.calls, { download: 0, install: 0 })

  resolveConfirm(true)
  const result = await first
  assert.equal(result.success, true)
  assert.deepEqual(update.calls, { download: 0, install: 1 })
})

test('取消或弹窗异常后更新入口会释放并发门禁', async () => {
  const update = createUpdateController()
  update.state = { status: 'available', availableVersion: '1.0.3' }
  let confirmCalls = 0
  const runEntryAction = createApplicationUpdateEntryActionRunner()
  const options = {
    state: update.state,
    update,
    confirm: async () => {
      confirmCalls += 1
      if (confirmCalls === 1) return false
      if (confirmCalls === 2) throw new Error('弹窗异常')
      return false
    }
  }

  const cancelled = await runEntryAction(options)
  assert.equal(cancelled.cancelled, true)
  await assert.rejects(runEntryAction(options), /弹窗异常/)
  const retried = await runEntryAction(options)

  assert.equal(retried.cancelled, true)
  assert.equal(confirmCalls, 3)
  assert.deepEqual(update.calls, { download: 0, install: 0 })
})
})()

// === Merged from applicationUpdateInstaller.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const readFileSync = _m4_readFileSync
const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('更新安装使用可见 NSIS 窗口并在完成后重新运行', () => {
  const service = source('../electron/modules/update/service.js')
  assert.match(service, /quitAndInstall\(false, true\)/)
  assert.doesNotMatch(service, /quitAndInstall\(true, true\)/)
})

test('NSIS 更新页读取真实进度并保持全新安装配置', () => {
  const installer = source('../build/installer.nsh')
  const packageJson = JSON.parse(source('../package.json'))
  assert.equal(packageJson.build.nsis.oneClick, false)
  assert.equal(packageJson.build.nsis.allowToChangeInstallationDirectory, true)
  assert.equal(packageJson.build.nsis.include, 'build/installer.nsh')
  assert.match(installer, /\$\{isUpdated\}/)
  assert.match(installer, /customInstallMode/)
  assert.match(installer, /\$hasPerMachineInstallation == "1"/)
  assert.match(installer, /\$hasPerUserInstallation == "1"/)
  assert.match(installer, /PBM_GETPOS/)
  assert.match(installer, /PBM_GETRANGE/)
  assert.match(installer, /GetDlgItem \$4 \$3 1004/)
  assert.match(installer, /GetDlgItem \$5 \$3 1006/)
  assert.doesNotMatch(installer, /\$mui\.InstFilesPage/)
  assert.match(installer, /customFinishPage/)
  assert.match(installer, /\$applicationUpdateInstallSucceeded == "1"/)
  assert.match(installer, /\$INSTDIR\\\$\{APP_EXECUTABLE_FILENAME\}/)
  assert.doesNotMatch(installer, /\$launchLink/)
  assert.match(installer, /Call StartInstalledApplication\s+Abort/)
  assert.match(installer, /正在安装更新：\$2%/)
  assert.match(installer, /EnableWindow \$0 0/)
  assert.match(installer, /!ifndef BUILD_UNINSTALLER/)
  assert.ok(
    installer.indexOf('!macro customPageAfterChangeDir') < installer.indexOf('Function ShowApplicationUpdateProgress'),
    '进度函数必须延迟到页面宏展开后定义，避免早于 StdUtils 插件目录加载'
  )
})
})()

// === Merged from applicationUpdateIntegration.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const readFileSync = _m5_readFileSync
  const runInNewContext = _m5_runInNewContext
const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('更新状态监听不把渲染层响应式回调结果返回给 contextBridge', () => {
  let api
  let registered
  let removed
  runInNewContext(source('../electron/preload.cjs'), {
    require: name => {
      assert.equal(name, 'electron')
      return {
        contextBridge: { exposeInMainWorld: (_name, value) => { api = value } },
        ipcRenderer: {
          sendSync: () => ({ id: 'cn' }),
          on: (channel, listener) => { registered = { channel, listener } },
          removeListener: (channel, listener) => { removed = { channel, listener } }
        }
      }
    }
  })
  const reactiveState = new Proxy({}, {})
  assert.throws(() => structuredClone(reactiveState), { name: 'DataCloneError' })
  let received
  const unsubscribe = api.onApplicationUpdateStateChanged(state => {
    received = state
    return reactiveState
  })
  const state = { supported: false, status: 'idle' }
  assert.equal(registered.channel, 'update-state-changed')
  assert.equal(registered.listener({}, state), undefined)
  assert.equal(received, state)
  unsubscribe()
  assert.equal(removed.channel, registered.channel)
  assert.equal(removed.listener, registered.listener)
})

test('更新 IPC 只暴露固定命令且校验主窗口、模式与来源', () => {
  const ipc = source('../electron/modules/ipc/update.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  for (const channel of ['update-get-state', 'update-configure', 'update-check', 'update-download', 'update-restart-install', 'update-acknowledge-installed']) {
    assert.match(ipc, new RegExp(channel))
  }
  assert.match(ipc, /event\.sender !== mainWindow\.webContents/)
  assert.match(ipc, /UPDATE_MODES\.has/)
  assert.match(ipc, /UPDATE_SOURCES\.has/)
  assert.match(preload, /onApplicationUpdateStateChanged/)
  assert.match(api, /restartAndInstallApplicationUpdate/)
  assert.match(api, /acknowledgeInstalledApplicationUpdate/)
  assert.doesNotMatch(preload, /setApplicationUpdateFeedURL/)
})

test('设置默认手动更新与 CNB 来源并持久化、重置和同步到主进程', () => {
  const store = source('../src/domains/settings/settingsStore.js')
  const app = source('../src/App.vue')
  const runtime = source('../src/startup/mainRuntime.js')
  const updateStore = source('../src/stores/applicationUpdate.js')
  assert.match(store, /const updateMode = ref\(UPDATE_MODE_MANUAL\)/)
  assert.match(store, /const updateSource = ref\(UPDATE_SOURCE_CNB\)/)
  assert.match(store, /updateMode: updateMode\.value/)
  assert.match(store, /updateSource: updateSource\.value/)
  assert.match(store, /updateMode\.value = normalizeUpdateMode\(data\.updateMode\)/)
  assert.match(store, /updateSource\.value = normalizeUpdateSource\(data\.updateSource\)/)
  assert.match(store, /electronApi\.update\.configure\(\{ mode: updateMode\.value, source: updateSource\.value \}\)/)

  const initializationStart = store.indexOf('// 初始化时加载')
  const initializationEnd = store.indexOf('return {', initializationStart)
  assert.ok(initializationStart >= 0 && initializationEnd > initializationStart)
  assert.doesNotMatch(
    store.slice(initializationStart, initializationEnd),
    /electronApi\.update\.configure/,
    '设置 store 会被覆盖层复用，构造时不得调用仅限主窗口的更新 IPC'
  )

  const mountedStart = app.indexOf('onMounted(() => {')
  const noLayoutGuard = app.indexOf('if (route.meta.noLayout) return', mountedStart)
  const runtimeImport = app.indexOf("import('./startup/mainRuntime')", mountedStart)
  assert.ok(mountedStart >= 0 && noLayoutGuard > mountedStart && runtimeImport > noLayoutGuard,
    '更新模式应在排除覆盖层路由后由主窗口同步')
  assert.match(runtime, /electronApi\.update\.configure\(\{ mode: settingsStore\.updateMode, source: settingsStore\.updateSource \}\)/)
  const configure = runtime.indexOf('await electronApi.update.configure')
  const initialize = runtime.indexOf('await applicationUpdateStore.initialize')
  const startupCheck = runtime.indexOf('applicationUpdateStore.startupCheck', initialize)
  assert.ok(configure >= 0 && initialize > configure && startupCheck > initialize,
    '启动检查必须在保存配置同步和状态监听建立之后')
  assert.match(updateStore, /if \(startupCheckPromise\) return startupCheckPromise/)
  assert.match(runtime, /dangerouslyUseHTMLString: false/)
  assert.match(runtime, /customClass: 'installed-update-dialog'/)
  assert.doesNotMatch(runtime, /type:\s*'success'/, '更新完成弹窗不应显示左侧成功图标')
})

test('三处入口统一安全 Markdown 发布说明并保留更新进度', () => {
  const main = source('../src/main.js')
  const runtime = source('../src/startup/mainRuntime.js')
  const view = source('../src/domains/settings/SettingsView.vue')
  const titleBar = source('../src/components/Layout/TitleBar.vue')
  const releaseNotes = source('../src/components/common/ReleaseNotesContent.vue')
  assert.match(main, /element-plus\/es\/components\/message-box\/style\/css/)
  assert.match(view, /应用更新/)
  assert.match(view, /update-release-notes/)
  assert.match(view, /ReleaseNotesContent/)
  assert.match(view, /el-progress/)
  assert.match(view, /立即安装/)
  assert.match(view, /CNB（国内推荐）/)
  assert.match(view, /GitHub Release/)
  assert.match(view, /:disabled="updateBusy"/)
  assert.match(view, /useApplicationUpdateStore/)
  assert.doesNotMatch(view, /removeUpdateStateListener/)
  assert.doesNotMatch(view, /ElMessageBox\.confirm\([\s\S]*?重启并安装/)
  assert.match(titleBar, /发现新版本 v/)
  assert.match(titleBar, /下载中 /)
  assert.match(titleBar, /更新已就绪，点击安装/)
  assert.match(titleBar, /ElMessageBox\.confirm/)
  assert.match(titleBar, /createApplicationUpdateEntryActionRunner/)
  assert.match(titleBar, /updateEntryActionPending\.value/)
  assert.match(titleBar, /dangerouslyUseHTMLString: false/)
  assert.match(titleBar, /本版本暂无更新说明/)
  assert.match(titleBar, /h\(ReleaseNotesContent/)
  assert.match(runtime, /h\(ReleaseNotesContent/)
  assert.match(releaseNotes, /parseReleaseNotesMarkdown/)
  assert.match(releaseNotes, /target:\s*'_blank'/)
  assert.match(releaseNotes, /rel:\s*'noopener noreferrer'/)
  assert.doesNotMatch(`${runtime}\n${titleBar}\n${view}\n${releaseNotes}`, /v-html=|innerHTML/)
  assert.match(titleBar, /-webkit-app-region: no-drag/)
})
})()

// === Merged from applicationUpdateStore.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const createPinia = _m6_createPinia
  const setActivePinia = _m6_setActivePinia
  const electronApi = _m6_electronApi
  const useApplicationUpdateStore = _m6_useApplicationUpdateStore
function withUpdateApi(t, overrides) {
  const original = { ...electronApi.update }
  Object.assign(electronApi.update, overrides)
  t.after(() => Object.assign(electronApi.update, original))
}

test('跨桥状态订阅回调本身返回 undefined，同时保留 applyState 的本地响应式返回值', async t => {
  let emitThroughBridge
  withUpdateApi(t, {
    onStateChanged: callback => {
      emitThroughBridge = snapshot => structuredClone(callback(snapshot))
      return () => {}
    },
    getState: async () => ({ status: 'idle', supported: false })
  })
  setActivePinia(createPinia())
  const store = useApplicationUpdateStore()
  await store.initialize()
  t.after(store.dispose)
  const localState = store.applyState({ currentVersion: '1.9.2' })
  assert.equal(localState, store.state)
  assert.throws(() => structuredClone(localState), { name: 'DataCloneError' })
  assert.equal(emitThroughBridge({ status: 'not-available', supported: false }), undefined)
  assert.equal(store.state.status, 'not-available')
  assert.equal(store.state.currentVersion, '1.9.2')
})

test('共享更新 store 先监听再读取快照且启动检查只执行一次', async t => {
  const order = []
  let checkCalls = 0
  let stateListener
  withUpdateApi(t, {
    onStateChanged: listener => { order.push('listen'); stateListener = listener; return () => order.push('dispose') },
    getState: async () => { order.push('state'); return { status: 'idle', supported: true } },
    check: async () => { checkCalls += 1; return { success: true, state: { status: 'not-available' } } }
  })
  setActivePinia(createPinia())
  const store = useApplicationUpdateStore()
  const dispose = await store.initialize()
  assert.deepEqual(order, ['listen', 'state'])
  stateListener({ status: 'available', availableVersion: '1.0.6' })
  assert.equal(store.state.availableVersion, '1.0.6')
  await Promise.all([store.startupCheck(), store.startupCheck()])
  assert.equal(checkCalls, 1)
  assert.equal(store.state.status, 'not-available')
  dispose()
  assert.deepEqual(order, ['listen', 'state', 'dispose'])
})

test('更新内容弹窗同时只展示一次并在关闭后确认已读', async t => {
  let dialogCalls = 0
  let acknowledgeCalls = 0
  let closeDialog
  withUpdateApi(t, {
    acknowledgeInstalled: async () => {
      acknowledgeCalls += 1
      return { success: true, acknowledged: true, state: { installedUpdate: null } }
    }
  })
  setActivePinia(createPinia())
  const store = useApplicationUpdateStore()
  store.applyState({ installedUpdate: { targetVersion: '1.0.6', releaseNotes: '修复 A' } })
  const showDialog = record => {
    dialogCalls += 1
    assert.deepEqual(record, { targetVersion: '1.0.6', releaseNotes: '修复 A' })
    return new Promise(resolve => { closeDialog = resolve })
  }
  const first = store.showInstalledUpdate(showDialog)
  const second = store.showInstalledUpdate(showDialog)
  await Promise.resolve()
  assert.equal(dialogCalls, 1)
  assert.equal(acknowledgeCalls, 0)
  closeDialog()
  assert.equal(await first, true)
  assert.equal(await second, true)
  assert.equal(acknowledgeCalls, 1)
  assert.equal(store.state.installedUpdate, null)
})

test('标题栏更新确认仅对当前运行周期的同一目标版本生效', () => {
  setActivePinia(createPinia())
  const store = useApplicationUpdateStore()
  store.applyState({ status: 'available', availableVersion: '1.0.6' })
  assert.equal(store.isVersionConfirmed(), false)
  assert.equal(store.confirmVersion('1.0.6'), true)
  assert.equal(store.isVersionConfirmed('1.0.6'), true)

  store.applyState({ status: 'available', availableVersion: '1.0.7' })
  assert.equal(store.isVersionConfirmed('1.0.7'), false)
  assert.equal(store.confirmVersion('1.0.6'), false)
  assert.equal(store.confirmVersion('1.0.7'), true)
  assert.equal(store.isVersionConfirmed('1.0.7'), true)

  store.dispose()
  assert.equal(store.isVersionConfirmed('1.0.7'), false)
})

test('安装操作先在共享状态中锁定交互', async t => {
  let resolveInstall
  withUpdateApi(t, {
    restartAndInstall: () => new Promise(resolve => { resolveInstall = resolve })
  })
  setActivePinia(createPinia())
  const store = useApplicationUpdateStore()
  store.applyState({ status: 'downloaded' })
  const pending = store.install()
  assert.equal(store.state.status, 'installing')
  assert.equal(store.busy, true)
  const duplicate = await store.install()
  assert.equal(duplicate.reason, 'install-in-progress')
  resolveInstall({ success: false, reason: 'update-record-failed', state: { status: 'downloaded', error: '写入失败' } })
  const result = await pending
  assert.equal(result.reason, 'update-record-failed')
  assert.equal(store.state.status, 'downloaded')
})
})()

// === Merged from backgroundStartup.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const mkdtemp = _m7_mkdtemp
  const rm = _m7_rm
  const readFile = _m7_readFile
  const os = _m7_os
  const path = _m7_path
  const MapTrackerService = _m7_MapTrackerService
  const MapTrackerRepository = _m7_MapTrackerRepository
  const sanitizeStartupReport = _m7_sanitizeStartupReport
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
})()

// === Merged from clientEvents.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const appendFile = _m8_appendFile
  const mkdir = _m8_mkdir
  const mkdtemp = _m8_mkdtemp
  const rename = _m8_rename
  const truncate = _m8_truncate
  const unlink = _m8_unlink
  const writeFile = _m8_writeFile
  const os = _m8_os
  const path = _m8_path
  const parseClientLogLine = _m8_parseClientLogLine
  const ClientLogTailer = _m8_ClientLogTailer
  const ClientEventsService = _m8_ClientEventsService
  const ClientEventSettingsRepository = _m8_ClientEventSettingsRepository
  const deriveClientLogPath = _m8_deriveClientLogPath
  const detectRunningClientLogPath = _m8_detectRunningClientLogPath
test('Client 日志解析只返回区域、等级白名单字段', () => {
  assert.deepEqual(parseClientLogLine('2026/09/03 10:20:30 123 [INFO Client 1] Generating level 83 area "MapWorldsCemetery" with seed 1'), {
    type: 'area-entered', logTime: '2026/09/03 10:20:30', areaId: 'MapWorldsCemetery', loading: true, seed: '1', areaLevel: 83, mapTier: 16
  })
  assert.deepEqual(parseClientLogLine('2026/09/03 10:21:30 [INFO Client] Player has leveled up to level 91'), {
    type: 'character-level', logTime: '2026/09/03 10:21:30', level: 91
  })
  assert.equal(parseClientLogLine('secret raw line'), null)
})

test('事件订阅者只收到构造后的白名单事件', () => {
  const service = new ClientEventsService()
  const received = []
  const unsubscribe = service.onEvent((event) => received.push(event))
  service.push({ type: 'player-death', logTime: null })
  unsubscribe()
  service.push({ type: 'player-death', logTime: null })
  assert.equal(received.length, 1)
  assert.deepEqual(Object.keys(received[0]).sort(), ['logTime', 'receivedAt', 'sequence', 'type'])
})

test('tailer 从 EOF 起步并处理半字符、半行、截断和轮转', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-client-tail-'))
  const file = path.join(root, 'Client.txt')
  await writeFile(file, '历史内容\n', 'utf8')
  const lines = []
  const states = []
  const tailer = new ClientLogTailer({ filePath: file, onLine: (line) => lines.push(line), onState: (state) => states.push(state.state) })
  await tailer.start()
  const bytes = Buffer.from('新增中文\n半行', 'utf8')
  await appendFile(file, bytes.subarray(0, 5)); await tailer.poll()
  await appendFile(file, bytes.subarray(5)); await tailer.poll()
  assert.deepEqual(lines, ['新增中文'])
  await appendFile(file, '完成\r\n'); await tailer.poll()
  assert.equal(lines.at(-1), '半行完成')
  await truncate(file, 0); await appendFile(file, '截断后\n'); await tailer.poll()
  assert.equal(lines.at(-1), '截断后')
  await rename(file, path.join(root, 'Client.old.txt')); await writeFile(file, '轮转后\n'); await tailer.poll()
  assert.equal(lines.at(-1), '轮转后')
  assert.ok(states.includes('resyncing'))
  tailer.stop()
})

test('tailer 处理删除重建、BOM 和不可读取目标', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-client-recreate-'))
  const file = path.join(root, 'Client.txt')
  await writeFile(file, 'old\n')
  const lines = []
  const states = []
  const tailer = new ClientLogTailer({ filePath: file, onLine: (line) => lines.push(line), onState: (state) => states.push(state.state) })
  await tailer.start()
  await unlink(file); await tailer.poll()
  await writeFile(file, '\uFEFFrecreated\r\n'); await tailer.poll()
  assert.equal(lines.at(-1), 'recreated')
  assert.ok(states.includes('waiting'))
  tailer.stop()

  const directory = path.join(root, 'Client-directory')
  await mkdir(directory)
  const broken = new ClientLogTailer({ filePath: directory, onState: (state) => states.push(state.state) })
  await broken.start()
  assert.equal(states.at(-1), 'error')
  broken.stop()
})

test('事件服务最多保留 50 条且不包含原始日志行', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-client-service-'))
  const settings = new ClientEventSettingsRepository(path.join(root, 'settings.json'))
  class FakeTailer { constructor(options){this.options=options} async start(){} stop(){} }
  const service = new ClientEventsService({ settings, detectPath: async () => path.join(root, 'Client.txt'), selectFile: async () => '', Tailer: FakeTailer })
  await service.updateSettings({ enabled: true })
  for (let index = 0; index < 55; index++) service.push({ type: 'character-level', logTime: null, level: index })
  const snapshot = await service.getStatus()
  assert.equal(snapshot.events.length, 50)
  assert.equal(snapshot.events.at(-1).level, 54)
  assert.equal(JSON.stringify(snapshot).includes('rawLine'), false)
})

test('自动检测路径持久化并在重启后恢复监听', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-client-restart-'))
  const file = path.join(root, 'Client.txt')
  const settingsPath = path.join(root, 'settings.json')
  await writeFile(file, '', 'utf8')
  const starts = []
  class FakeTailer {
    constructor(options) { this.options = options }
    async start() { starts.push(this.options.filePath); this.options.onState({ state: 'started' }) }
    stop() { this.options.onState({ state: 'stopped' }) }
  }

  const firstRepository = new ClientEventSettingsRepository(settingsPath)
  const first = new ClientEventsService({ settings: firstRepository, detectPath: async () => file, Tailer: FakeTailer })
  await first.updateSettings({ enabled: true })
  assert.equal((await firstRepository.get()).logPath, file)
  await first.stop(false)

  const secondRepository = new ClientEventSettingsRepository(settingsPath)
  const second = new ClientEventsService({ settings: secondRepository, detectPath: async () => '', Tailer: FakeTailer })
  const restored = await second.initialize()
  assert.equal(restored.enabled, true)
  assert.equal(restored.logPath, file)
  assert.equal(restored.state, 'started')
  assert.deepEqual(restored.events, [])

  await second.updateSettings({ enabled: false })
  assert.equal((await second.getStatus()).state, 'stopped')
  const resumed = await second.updateSettings({ enabled: true })
  assert.equal(resumed.logPath, file)
  assert.equal(resumed.state, 'started')
  assert.deepEqual(starts, [file, file, file])
  await second.stop(false)
})

test('初始化失败后可重试，修复路径后恢复监听', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-client-retry-'))
  const file = path.join(root, 'Client.txt')
  await writeFile(file, '', 'utf8')
  let detect = false
  class FakeTailer {
    constructor(options) { this.options = options }
    async start() { this.options.onState({ state: 'started' }) }
    stop() { this.options.onState({ state: 'stopped' }) }
  }
  const service = new ClientEventsService({
    settings: new ClientEventSettingsRepository(path.join(root, 'settings.json')),
    detectPath: async () => { if (!detect) throw new Error('detect failed'); return file },
    selectFile: async () => '', Tailer: FakeTailer
  })
  await service.settings.save({ enabled: true })
  await assert.rejects(service.initialize(), /detect failed/)
  assert.equal((await service.getStatus()).state, 'error')
  detect = true
  const status = await service.updateSettings({ enabled: true })
  assert.equal(status.state, 'started')
  assert.equal((await service.whenReady()).state, 'started')
  await service.stop(false)
})

test('设置默认关闭且只接受 Client.txt 路径', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-client-settings-'))
  const repository = new ClientEventSettingsRepository(path.join(root, 'settings.json'))
  assert.equal((await repository.get()).enabled, false)
  assert.equal((await repository.save({ enabled: true, logPath: path.join(root, 'other.log') })).logPath, '')
  assert.equal(deriveClientLogPath('C:\\Games\\Path of Exile\\PathOfExile.exe'), 'C:\\Games\\Path of Exile\\logs\\Client.txt')
})

test('自动检测根据游戏进程路径推导 Client.txt', async () => {
  const execFileImpl = (_file, args, options, callback) => {
    assert.equal(options.windowsHide, true)
    assert.match(args.at(-1), /OutputEncoding.*UTF8Encoding/)
    callback(null, 'E:\\WeGameApps\\流放之路\\PathOfExile_x64.exe')
  }
  assert.equal(
    await detectRunningClientLogPath({ platform: 'win32', execFileImpl }),
    'E:\\WeGameApps\\流放之路\\logs\\Client.txt'
  )
})

test('自动检测失败或非 Windows 时返回空路径', async () => {
  const execFileImpl = (_file, _args, _options, callback) => callback(new Error('denied'), '')
  assert.equal(await detectRunningClientLogPath({ platform: 'win32', execFileImpl }), '')
  assert.equal(await detectRunningClientLogPath({ platform: 'linux', execFileImpl }), '')
})
})()

// === Merged from clientLoadingScreen.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const ClientEventsService = _m9_ClientEventsService
  const parseClientLogLine = _m9_parseClientLogLine
  const SanctumLogContext = _m9_SanctumLogContext
// Minimal, anonymized system messages from the CN client; no network addresses.
const line = (body, pid = 123) => `2026/09/09 20:58:35 39240015 ff4d814e [INFO Client ${pid}] ${body}`
const generation = 'Generating level 83 area "SanctumFoyer_3_3" with seed 1'
const complete = '[LOADING SCREEN] (圣所教堂) Duration = 0.971189 seconds'
const connect = 'Connecting to instance server at [redacted]'
const entry = (body, offset, pid = 123) => ({ line: line(body, pid), sourceId: 'source', fileId: 'file', offset })
const service = () => new ClientEventsService({ processProvider: async () => [
  { id: 123, startedAt: '2026-09-09T10:00:00Z' }, { id: 456, startedAt: '2026-09-09T10:00:00Z' }
] })

test('国服加载完成严格匹配系统正文，聊天、焦点和畸形耗时不能确认区域', () => {
  assert.equal(parseClientLogLine(line(complete)).state, 'in-game')
  for (const body of [`: #玩家: ${complete}`, `: ${complete}`, '[WINDOW] Gained focus',
    complete + ' suffix', complete.replace('0.971189', '-1'), complete.replace('0.971189', 'NaN')]) {
    assert.equal(parseClientLogLine(line(body)), null)
  }
})

test('实时与历史恢复均确认当前进程第 3 层 83 级且不恢复历史统计', async () => {
  for (const recover of [false, true]) {
    const events = service()
    events.status = { ...events.status, enabled: true, state: 'started' }
    const entries = [entry(connect, 0), entry(generation, 1), entry(complete, 2), entry(': You have died.', 3)]
    if (recover) await events.recover(entries)
    else for (const item of entries) events.acceptLine(item.line, item)
    const bound = new SanctumLogContext(events, 123, () => {})
    assert.deepEqual(bound.assertCurrent(), { floorId: 'floor:2', floorNumber: 3, areaLevel: 83, identitySource: 'client-log' })
    bound.close()
    if (recover) assert.equal(events.events.some(event => event.type === 'player-death'), false)
  }
})

test('完成事件不能跨进程、无区域、断线或下一次连接复活旧区域', async () => {
  for (const bodies of [
    [entry(complete, 0)],
    [entry(generation, 0), entry(complete, 1, 456)],
    [entry(generation, 0), entry('Abnormal disconnect: test', 1), entry(complete, 2)],
    [entry(generation, 0), entry(complete, 1), entry(connect, 2), entry(complete, 3)]
  ]) {
    for (const recover of [false, true]) {
      const events = service()
      if (recover) await events.recover(bodies)
      else for (const item of bodies) events.acceptLine(item.line, item)
      assert.equal(events.currentContext(), null)
      assert.notEqual(events.status.gameState, 'in-game')
    }
  }
})
})()

// === Merged from clientProcessRecovery.test.js ===
await (async () => {
  const test = _m10_test
  const assert = _m10_assert
  const mkdtemp = _m10_mkdtemp
  const writeFile = _m10_writeFile
  const appendFile = _m10_appendFile
  const rm = _m10_rm
  const os = _m10_os
  const path = _m10_path
  const detectClientProcessSessions = _m10_detectClientProcessSessions
  const detectClientProcessExists = _m10_detectClientProcessExists
  const ClientEventsService = _m10_ClientEventsService
  const SanctumLogContext = _m10_SanctumLogContext
const session = { id: 123, startedAt: '2026-09-10T00:00:00Z' }
const entry = body => `2026/09/11 02:17:24 1 x [INFO Client 123] ${body}\n`
const area = entry('Generating level 83 area "SanctumVaults" with seed 1')
const ready = entry('[LOADING SCREEN] (圣所宝库) Duration = 1.1 seconds')
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }
const options = output => ({ platform: 'win32', execFileImpl: (_exe, _args, config, callback) => {
  assert.equal(config.windowsHide, true); assert.equal(config.timeout, 10000); callback(null, output)
} })

test('启动时间未知保留PID，空输出／损坏／超时与明确空列表分开', async () => {
  assert.deepEqual(await detectClientProcessSessions(options('[{"id":123,"startedAt":null}]')), [{ id: 123, startedAt: null }])
  for (const output of ['', 'garbage', 'null', '[{}]']) await assert.rejects(detectClientProcessSessions(options(output)), { code: 'parse' })
  assert.deepEqual(await detectClientProcessSessions(options('[]')), [])
  await assert.rejects(detectClientProcessSessions({ platform: 'win32', execFileImpl: (_e, _a, _o, cb) => cb(Object.assign(new Error('timeout'), { killed: true })) }), { code: 'timeout' })
})

test('独立PID查询只接受明确布尔结果，错误或空输出不确认退出', async () => {
  assert.equal(await detectClientProcessExists(123, options('{"exists":true}')), true)
  assert.equal(await detectClientProcessExists(123, options('{"exists":false}')), false)
  for (const output of ['', '{}', 'false', 'garbage']) await assert.rejects(detectClientProcessExists(123, options(output)), { code: 'parse' })
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
})()

// === Merged from clientProcessTimeout.test.js ===
await (async () => {
  const test = _m11_test
  const assert = _m11_assert
  const detectClientProcessSessions = _m11_detectClientProcessSessions
  const detectClientProcessExists = _m11_detectClientProcessExists
  const ProcessProbeError = _m11_ProcessProbeError
  const ClientEventsService = _m11_ClientEventsService
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
})()
