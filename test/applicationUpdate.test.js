import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import {
  ApplicationUpdateService,
  isStableNewerVersion,
  sanitizeUpdateError
} from '../electron/modules/update/service.js'
import { runStrictCleanup, StrictCleanupTimeoutError } from '../electron/modules/lifecycle/strictCleanup.js'

class FakeUpdater extends EventEmitter {
  constructor() {
    super()
    this.checkCalls = 0
    this.downloadCalls = 0
    this.installCalls = 0
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

  quitAndInstall() {
    this.installCalls += 1
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
    firstCheckDelayMs: 30,
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

test('自动模式安排首次与周期检查，切换手动后清理定时器', async () => {
  const { service, updater, scheduler } = createService()
  updater.checkImplementation = async () => updater.emit('update-not-available', { version: '1.0.2' })
  service.configure({ mode: 'automatic' })
  assert.equal([...scheduler.timeouts.values()][0].delay, 30)
  assert.equal([...scheduler.intervals.values()][0].delay, 60)
  await [...scheduler.timeouts.values()][0].callback()
  assert.equal(updater.checkCalls, 1)
  service.configure({ mode: 'manual' })
  assert.equal(scheduler.timeouts.size, 0)
  assert.equal(scheduler.intervals.size, 0)
  assert.equal(updater.autoDownload, false)
})

test('自动检查发现新版本后下载但不安装', async () => {
  const { service, updater, scheduler } = createService()
  updater.checkImplementation = async () => {
    updater.emit('update-available', { version: '1.0.3' })
    if (updater.autoDownload) {
      updater.emit('download-progress', { percent: 50, transferred: 50, total: 100 })
      updater.emit('update-downloaded', { version: '1.0.3' })
    }
  }
  service.configure({ mode: 'automatic' })
  await [...scheduler.timeouts.values()][0].callback()
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
  assert.equal(cleanupCompleteCalls, 1)
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
