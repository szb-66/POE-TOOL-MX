import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ShutdownTimeoutError,
  createShutdownController
} from '../electron/modules/lifecycle/shutdown.js'

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
  assert.match(main, /window\.on\('close', shutdownController\.handleMainWindowClose\)/)
  assert.match(main, /BrowserWindow\.getAllWindows\(\)/)
  assert.match(main, /throw new AggregateError\(errors/)
  assert.match(main, /applicationCleanupPromise/)
  assert.match(main, /cleanupApplicationResourcesOnce/)
  assert.match(main, /requestShutdown: \(\) => app\.quit\(\)/)
  assert.doesNotMatch(main, /app\.on\('before-quit', async/)
  assert.doesNotMatch(pythonProcess, /tasklist .*python\.exe/)
  assert.match(pythonProcess, /if \(!stopped\) throw new Error/)
})
