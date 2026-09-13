import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createExitDiagnostics } from '../electron/modules/system/exitDiagnostics.js'
import { createStartupLogger } from '../electron/modules/system/startupLog.js'
import { createShutdownController } from '../electron/modules/lifecycle/shutdown.js'
import { createApplicationTrayController } from '../electron/modules/lifecycle/tray.js'
import { createApplicationRestartController } from '../electron/modules/lifecycle/restart.js'
import { createCrashGuard } from '../electron/modules/system/crashGuard.js'
import { ApplicationUpdateService } from '../electron/modules/update/service.js'

function fixture(log) {
  const events = [], app = new EventEmitter(), proc = new EventEmitter()
  app.quit = () => app.emit('before-quit', { preventDefault() {} })
  app.exit = code => { app.emit('quit', {}, code); proc.emit('exit', code) }
  const diagnostic = createExitDiagnostics({ app, processObject: proc, log: log || { record: e => events.push(e) } })
  return { app, proc, diagnostic, events }
}

test('退出来源跨清理后二次 quit、最终退出保持首因', async () => {
  const { app, proc, diagnostic, events } = fixture()
  const shutdown = createShutdownController({ app, cleanup: () => diagnostic.cleanup(async () => {}) })
  diagnostic.request('tray_exit')
  app.quit()
  await shutdown.done
  diagnostic.request('window_all_closed')
  app.emit('will-quit')
  app.emit('quit', {}, 0)
  proc.emit('exit', 0)
  assert.equal(diagnostic.firstSource, 'tray_exit')
  assert.equal(events.filter(e => e.phase === 'exit-before-quit').length, 2)
  assert.deepEqual(events.filter(e => e.phase === 'exit-cleanup').map(e => e.outcome), ['started', 'succeeded'])
  assert.match(events.at(-1).message, /firstSource=tray_exit.*code=0/)
  diagnostic.dispose()
  assert.equal(proc.listenerCount('exit'), 0)
})

test('未知退出和日志抛错不会改变清理结果', async () => {
  const f = fixture()
  f.app.quit()
  assert.equal(f.diagnostic.firstSource, 'unknown')
  const broken = fixture({ record() { throw new Error('disk unavailable') } })
  broken.diagnostic.request('application_restart')
  assert.equal(await broken.diagnostic.cleanup(async () => 42), 42)
  const failure = new Error('original cleanup failure')
  await assert.rejects(broken.diagnostic.cleanup(async () => { throw failure }), error => error === failure)
  assert.doesNotThrow(() => broken.app.exit(1))
})

test('窗口 IPC 候选、托盘隐藏和关闭选择不会污染首因', () => {
  const f = fixture()
  const window = { isDestroyed: () => false, hide() {} }
  const tray = createApplicationTrayController({
    app: f.app, exitDiagnostics: f.diagnostic, getMainWindow: () => window,
    createTray: () => ({ setToolTip() {}, setContextMenu() {}, on() {}, destroy() {} }),
    createMenu: x => x
  })
  const close = () => {
    const source = f.diagnostic.windowCloseSource(window)
    f.diagnostic.record('window-close-request', source)
    if (tray.handleMainWindowClose({ preventDefault() {} }, window)) return
    f.diagnostic.request(source)
    f.app.quit()
  }
  f.diagnostic.withWindowCloseSource(window, close)
  assert.equal(f.diagnostic.firstSource, '')
  assert.equal(f.events[0].reasonCode, 'window_close_ipc')
  tray.resolveCloseChoice({ behavior: 'tray' })
  assert.equal(f.diagnostic.firstSource, '')
  tray.configure({ behavior: 'tray', promptSuppressed: true })
  close()
  assert.equal(f.diagnostic.firstSource, '')
  tray.configure({ behavior: 'exit', promptSuppressed: true })
  f.diagnostic.withWindowCloseSource(window, close)
  assert.equal(f.diagnostic.firstSource, 'window_close_ipc')
})

test('关闭选择、托盘、原生关闭可分别归因', () => {
  for (const source of ['close_choice_exit', 'tray_exit', 'native_window_close']) {
    const f = fixture(), window = {}
    const tray = createApplicationTrayController({ app: f.app, exitDiagnostics: f.diagnostic })
    if (source === 'close_choice_exit') {
      tray.handleMainWindowClose({ preventDefault() {} }, window)
      tray.resolveCloseChoice({ behavior: 'exit' })
    } else if (source === 'tray_exit') tray.requestQuit()
    else f.diagnostic.request(f.diagnostic.windowCloseSource(window))
    assert.equal(f.diagnostic.firstSource, source)
  }
})

test('重启、更新安装和致命异常在退出前记录来源', async () => {
  const restart = fixture()
  const controller = createApplicationRestartController({
    exitDiagnostics: restart.diagnostic,
    cleanup: () => restart.diagnostic.cleanup(async () => {}), clearCache: async () => {},
    markCleanupComplete() {}, restart: () => restart.app.exit(75), terminateAfterFailure() {}
  })
  assert.equal((await controller.requestRestart()).success, true)
  assert.equal(restart.events[0].reasonCode, 'application_restart')
  const update = fixture(), updater = new EventEmitter()
  updater.setFeedURL = () => {}
  updater.quitAndInstall = () => update.app.exit(0)
  const service = new ApplicationUpdateService({
    updater, isPackaged: false, currentVersion: '1.0.0', exitDiagnostics: update.diagnostic,
    cleanup: () => update.diagnostic.cleanup(async () => {})
  })
  service.downloadReady = true
  assert.equal((await service.restartAndInstall()).success, true)
  assert.equal(update.events[0].reasonCode, 'update_install')
  service.dispose()
  const fatal = fixture()
  const guard = createCrashGuard({ app: fatal.app, processObject: fatal.proc, exitDiagnostics: fatal.diagnostic })
  guard.install()
  fatal.proc.emit('unhandledRejection', new Error('failure'))
  assert.equal(fatal.diagnostic.firstSource, 'unhandled_rejection')
  assert.match(fatal.events.at(-1).message, /code=1/)
  guard.dispose()
})

test('会话日志跨事件关联，独立启动使用不同会话并保留脱敏', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'poe-exit-log-'))
  try {
    const first = createStartupLogger({ userDataPath: directory })
    first.record({ phase: 'app-start' })
    first.record({ phase: 'exit-process', message: 'token=secret' })
    createStartupLogger({ userDataPath: directory }).record({ phase: 'app-start' })
    const events = readFileSync(first.filePath, 'utf8').trim().split('\n').map(JSON.parse)
    assert.equal(events[0].sessionId, events[1].sessionId)
    assert.notEqual(events[0].sessionId, events[2].sessionId)
    assert.equal(events[0].pid, process.pid)
    assert.doesNotMatch(events[1].message, /secret/)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
