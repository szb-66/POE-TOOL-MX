import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { acquireCrossProcessInstanceLock } from '../electron/modules/app/singleInstance.js'

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('应用在创建窗口前获取单实例锁并聚焦已有主窗口', () => {
  const main = source('../electron/main.js')
  assert.match(main, /app\.requestSingleInstanceLock\(\)/)
  assert.match(main, /if \(!hasSingleInstanceLock\) process\.exit\(0\)/)
  assert.match(main, /app\.on\('second-instance'/)
  assert.match(main, /acquireCrossProcessInstanceLock/)
  assert.match(main, /existingWindow\.restore\(\)/)
  assert.match(main, /existingWindow\.focus\(\)/)
})

test('开发版与打包版共用固定应用数据目录', () => {
  const main = source('../electron/main.js')
  const userData = source('../electron/modules/storage/userDataPath.js')
  assert.match(main, /app\.setPath\('userData', resolveUserDataPath/)
  assert.match(userData, /流放助手/)
})

test('固定命名管道阻止不同可执行程序创建第二套浮窗', async () => {
  const pipeName = `\\\\.\\pipe\\exile-helper-test-${process.pid}-${Date.now()}`
  let notified = false
  const first = await acquireCrossProcessInstanceLock({
    pipeName,
    onSecondInstance: () => { notified = true }
  })
  try {
    const second = await acquireCrossProcessInstanceLock({ pipeName })
    assert.equal(first.acquired, true)
    assert.equal(second.acquired, false)
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.equal(notified, true)
  } finally {
    await first.release()
  }
})
