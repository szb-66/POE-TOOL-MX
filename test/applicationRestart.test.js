import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { StrictCleanupTimeoutError } from '../electron/modules/lifecycle/strictCleanup.js'
import { createApplicationRestartController } from '../electron/modules/lifecycle/restart.js'

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
