import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { PassThrough, Writable } from 'node:stream'
import { LocalizationService } from '../electron/modules/localization/service.js'
import { LocalizationHelperClient } from '../electron/modules/localization/helperClient.js'
import { ServerModeController } from '../electron/modules/app/serverMode.js'
import { createShutdownController } from '../electron/modules/lifecycle/shutdown.js'
import { createApplicationRestartController } from '../electron/modules/lifecycle/restart.js'
import { ApplicationUpdateService } from '../electron/modules/update/service.js'

const deferred = () => {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}
const flush = () => new Promise(resolve => setImmediate(resolve))

test('汉化退出等待原生操作及词库激活完成，并拒绝新操作', async () => {
  const native = deferred()
  const calls = []
  const bundle = { manifest: { releaseId: 'next' }, entries: [], envelope: {} }
  const service = new LocalizationService({
    serverId: 'international', storageRoot: 'unused-lifecycle-test',
    downloader: { load: file => file === 'ready.json' ? bundle : null, check: async () => ({ releaseId: 'next', missingObjects: 0 }), download: async () => ({ downloadedBytes: 0 }), activate() { calls.push('activate') } },
    helper: { available: () => true, run: operation => operation === 'scan' ? { applied: false } : native.promise, waitForIdle: async () => { calls.push('native-closed') } },
    discover: async () => [],
    inspect: () => ({ gameDirectory: 'unused' }), assertWritable: async () => ({ gameDirectory: 'unused' }),
    verifyInstalled: () => ({ ready: true })
  })
  // Replace only directory selection; apply, activation and shutdown remain real.
  service.selectedGame = () => ({ gameDirectory: 'unused' })
  const pending = service.apply({ gameDirectory: 'unused' })
  await flush()
  const shutdown = service.shutdown().then(() => calls.push('shutdown'))
  await flush()
  assert.deepEqual(calls, [])
  await assert.rejects(service.check(), /退出|关闭/)
  native.resolve({ applied: true, resourceVersion: 'next' })
  await Promise.all([pending, shutdown])
  assert.deepEqual(calls, ['activate', 'native-closed', 'shutdown'])
  assert.equal(service.getActiveRevision(), 'next')
})

test('汉化组件报告失败后仍等待子进程真正关闭，输入管道异常会终止该子进程', async () => {
  const child = new EventEmitter()
  child.stdout = new PassThrough()
  child.stderr = new PassThrough()
  child.stdin = new Writable({ write(_chunk, _encoding, done) { done() } })
  let kills = 0
  child.kill = () => { kills++ }
  const helper = new LocalizationHelperClient({ spawnImpl: () => child })
  helper.available = () => true
  const pending = helper.run('apply', {})
  child.stdin.emit('error', new Error('fixture pipe error'))
  await assert.rejects(pending, /输入通道/)
  assert.equal(kills, 1)
  let closed = false
  const idle = helper.waitForIdle().then(() => { closed = true })
  await flush()
  assert.equal(closed, false)
  child.emit('close', 1)
  await idle
  assert.equal(closed, true)
})

for (const kind of ['quit', 'restart', 'switch', 'install']) {
  test(`${kind} 在汉化准备结束之后才启动普通清理超时`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const native = deferred()
    const calls = []
    const prepareCleanup = () => { calls.push('wait-native'); return native.promise }
    const cleanup = async () => { calls.push('cleanup') }
    let pending
    if (kind === 'quit') {
      const app = { on() {}, quit() { calls.push('quit') } }
      pending = createShutdownController({ app, prepareCleanup, cleanup, timeoutMs: 1 }).requestShutdown()
    } else if (kind === 'restart') {
      pending = createApplicationRestartController({ prepareCleanup, cleanup, timeoutMs: 1,
        clearCache: async () => {}, markCleanupComplete() {}, restart() { calls.push('restart') },
        terminateAfterFailure() { calls.push('unexpected-terminate') }
      }).requestRestart()
    } else if (kind === 'switch') {
      // No mode file is written: restart deliberately fails after preparation/cleanup.
      // The filesystem boundary is covered by the existing server-mode tests.
      const controller = new ServerModeController({ userDataPath: '.', prepareCleanup, cleanup })
      controller.mode = 'cn'
      controller.cleanup = async () => { calls.push('cleanup'); throw new Error('fixture stops before mode write') }
      pending = controller.switchTo('international')
    } else {
      const updater = new EventEmitter()
      updater.quitAndInstall = () => { calls.push('install') }
      const service = new ApplicationUpdateService({ updater, prepareCleanup, cleanup, cleanupTimeoutMs: 1,
        currentVersion: '1.0.0', isPackaged: true })
      service.downloadReady = true
      pending = service.restartAndInstall()
    }
    await flush()
    t.mock.timers.tick(20000)
    await flush()
    assert.deepEqual(calls, ['wait-native'])
    native.resolve()
    await pending
    assert.deepEqual(calls, ['wait-native', 'cleanup', ...({ quit: ['quit'], restart: ['restart'], switch: [], install: ['install'] }[kind])])
  })
}

test('主进程为退出、重启、切服和更新安装接入同一个汉化准备步骤', () => {
  const source = readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8')
  assert.match(source, /let localization = null/)
  assert.equal((source.match(/prepareCleanup: prepareLocalizationShutdown/g) || []).length, 4)
  assert.match(source, /await Promise\.all\(\[localization\?\.shutdown\(\), marketLocalization\?\.shutdown\(\)\]\)/)
})
