import test from 'node:test'
import assert from 'node:assert/strict'
import { runApplicationUpdateEntryAction } from '../src/utils/applicationUpdateAction.js'

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
