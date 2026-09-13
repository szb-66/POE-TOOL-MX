import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import { EventEmitter } from 'node:events'
import { errorMessage } from '../electron/modules/pobLauncher/errors.js'

test('启动助手 IPC 只允许主窗口主 frame，并固定分派安装更新', async () => {
  const source = (await fs.readFile(new URL('../electron/modules/ipc/pobLauncher.js', import.meta.url), 'utf8'))
    .replace(/^import .*$/gm, '').replace('export function', 'function')
  const handlers = new Map(), sends = [], calls = []
  const owner = { isDestroyed: () => false, webContents: { mainFrame: {}, send: (...args) => sends.push(args) } }
  const service = new EventEmitter()
  for (const method of ['getState', 'setDirectory', 'pickDirectory', 'install', 'start', 'stop']) {
    service[method] = async (...args) => { calls.push([method, ...args]); return { success: true } }
  }
  const context = { errorMessage, ipcMain: { handle: (channel, fn) => handlers.set(channel, fn) }, dialog: { showOpenDialog: async () => ({ canceled: true }) } }
  vm.runInNewContext(`${source}\nregisterPobLauncherHandlers`, context)(service, () => owner)
  const trusted = { sender: owner.webContents, senderFrame: owner.webContents.mainFrame }
  assert.equal(handlers.size, 7)
  assert.equal((await handlers.get('pob-launcher:install')({ sender: {} })).success, false)
  assert.equal((await handlers.get('pob-launcher:install')({ ...trusted, senderFrame: {} })).success, false)
  assert.equal(calls.length, 0)
  await handlers.get('pob-launcher:update')(trusted, { url: 'untrusted' })
  assert.deepEqual(calls[0], ['install', 'update'])
  await handlers.get('pob-launcher:install')(trusted)
  assert.equal(calls[1][1], 'install')
  assert.equal(await calls[1][2](), null)
  service.emit('state', { busy: true })
  assert.equal(sends[0][0], 'pob-launcher:state-changed')
  await handlers.get('pob-launcher:stop')(trusted, 'operation-1')
  assert.deepEqual(calls.at(-1), ['stop', 'operation-1'])
  const diagnostics = []
  service.report = (...args) => diagnostics.push(args)
  service.snapshot = () => ({ busy: false })
  owner.webContents.send = () => { throw new Error('Object has been destroyed') }
  assert.doesNotThrow(() => service.emit('state', { busy: true }))
  assert.equal(diagnostics[0][1], 'notification')
  service.start = async () => { throw new Error('injected IPC failure') }
  assert.equal((await handlers.get('pob-launcher:start')(trusted)).success, false)
  assert.equal(diagnostics.at(-1)[1], 'ipc')
})

test('preload 仅暴露固定频道，状态订阅解除后不再通知', async () => {
  const source = await fs.readFile(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
  const renderer = new EventEmitter(), calls = []
  renderer.invoke = (...args) => { calls.push(args); return Promise.resolve({ success: true }) }
  let api
  vm.runInNewContext(source, { require: () => ({ ipcRenderer: renderer, contextBridge: { exposeInMainWorld: (_name, value) => { api = value } }, webUtils: {} }) })
  await api.getPobLauncherState()
  await api.setPobLauncherDirectory('')
  await api.pickPobLauncherDirectory()
  await api.installPobLauncher()
  await api.updatePobLauncher()
  await api.startPobLauncher()
  await api.stopPobLauncher('operation-1')
  assert.deepEqual(calls.map(call => call[0]), ['pob-launcher:state', 'pob-launcher:directory', 'pob-launcher:pick', 'pob-launcher:install', 'pob-launcher:update', 'pob-launcher:start', 'pob-launcher:stop'])
  assert.equal(calls.at(-1)[1], 'operation-1')
  let received = 0
  const off = api.onPobLauncherState(() => received++)
  renderer.emit('pob-launcher:state-changed', {}, {})
  off()
  renderer.emit('pob-launcher:state-changed', {}, {})
  assert.equal(received, 1)
})
