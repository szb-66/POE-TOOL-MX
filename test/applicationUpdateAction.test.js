import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createApplicationUpdateEntryActionRunner,
  runApplicationUpdateEntryAction
} from '../src/utils/applicationUpdateAction.js'

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
