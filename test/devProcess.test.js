import test from 'node:test'
import assert from 'node:assert/strict'
import { DEVELOPMENT_RESTART_EXIT_CODE } from '../electron/modules/lifecycle/restart.js'
import { runManagedElectronSession } from '../scripts/devProcess.js'

test('专用重启退出码会保留开发服务器并重新拉起 Electron', async () => {
  const exitCodes = [DEVELOPMENT_RESTART_EXIT_CODE, 0]
  let launches = 0
  let closeCalls = 0
  const result = await runManagedElectronSession({
    launchElectron: async () => {
      launches += 1
      assert.equal(closeCalls, 0)
      return exitCodes.shift()
    },
    closeServer: async () => { closeCalls += 1 }
  })

  assert.equal(result, 0)
  assert.equal(launches, 2)
  assert.equal(closeCalls, 1)
})

test('非重启退出码不会重新拉起并会关闭开发服务器', async () => {
  let launches = 0
  let closeCalls = 0
  const result = await runManagedElectronSession({
    launchElectron: async () => {
      launches += 1
      return 2
    },
    closeServer: async () => { closeCalls += 1 }
  })

  assert.equal(result, 2)
  assert.equal(launches, 1)
  assert.equal(closeCalls, 1)
})

test('重拉后的 Electron 正常退出时关闭开发服务器且不再启动第三个进程', async () => {
  const exitCodes = [DEVELOPMENT_RESTART_EXIT_CODE, 0]
  const observed = []
  const result = await runManagedElectronSession({
    launchElectron: async () => {
      const code = exitCodes.shift()
      observed.push(code)
      return code
    },
    closeServer: async () => { observed.push('server-closed') }
  })

  assert.equal(result, 0)
  assert.deepEqual(observed, [DEVELOPMENT_RESTART_EXIT_CODE, 0, 'server-closed'])
})

test('Electron 启动失败时仍关闭开发服务器并向调用方保留错误', async () => {
  const failure = new Error('spawn failed')
  let closeCalls = 0

  await assert.rejects(
    runManagedElectronSession({
      launchElectron: async () => { throw failure },
      closeServer: async () => { closeCalls += 1 }
    }),
    error => error === failure
  )
  assert.equal(closeCalls, 1)
})
