import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { runInNewContext } from 'node:vm'
import { acquireCrossProcessInstanceLock } from '../electron/modules/app/singleInstance.js'
import { resolveUserDataPath } from '../electron/modules/storage/userDataPath.js'

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('应用在创建窗口前获取单实例锁并通过公共服务激活已有主窗口', () => {
  const main = source('../electron/main.js')
  assert.match(main, /app\.requestSingleInstanceLock\(\)/)
  assert.match(main, /if \(!hasSingleInstanceLock\)\s*\{\s*exitDiagnostics\.request\('single_instance'\);\s*process\.exit\(0\)\s*\}/)
  assert.match(main, /app\.on\('second-instance'/)
  assert.match(main, /acquireCrossProcessInstanceLock/)
  assert.match(main, /windowActivation\?\.activateMain\(\{ source: 'second-instance' \}\)/)
  assert.doesNotMatch(main, /existingWindow\.(?:restore|focus)\(\)/)
})

test('普通开发版和正式版共用固定目录，仅显式内部测试元数据隔离用户数据', () => {
  const main = source('../electron/main.js')
  const start = main.indexOf('const applicationMetadata = resolveApplicationMetadata()')
  const end = main.indexOf('const serverMode =', start)
  assert.ok(start >= 0 && end > start)
  const appData = 'C:\\Users\\A\\AppData\\Roaming'
  for (const metadata of [{}, { feedbackInternalTest: false }, { feedbackInternalTest: 'true' }, { feedbackInternalTest: true }]) {
    const calls = []
    runInNewContext(main.slice(start, end), {
      resolveApplicationMetadata: () => metadata,
      startupSafeMode: false,
      path,
      resolveUserDataPath,
      app: {
        getPath: name => { assert.equal(name, 'appData'); return appData },
        setPath: (name, value) => calls.push([name, value])
      }
    })
    assert.deepEqual(calls, [['userData', metadata.feedbackInternalTest === true
      ? path.join(appData, '流放助手-阿里云测试')
      : resolveUserDataPath(appData)]])
  }
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
