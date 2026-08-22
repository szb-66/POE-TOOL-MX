import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { electronApi } from '../src/api/electron.js'
import { useApplicationUpdateStore } from '../src/stores/applicationUpdate.js'

function withUpdateApi(t, overrides) {
  const original = { ...electronApi.update }
  Object.assign(electronApi.update, overrides)
  t.after(() => Object.assign(electronApi.update, original))
}

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
