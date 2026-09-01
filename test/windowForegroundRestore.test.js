import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import {
  restoreWindowToForeground,
  restoreWindowsNativeWindowFocus
} from '../electron/modules/window/foregroundRestore.js'

class FakeWindow extends EventEmitter {
  constructor({ minimized = false, alwaysOnTop = false, focusAfter = 1, minimizeDelayMs = null } = {}) {
    super()
    this.minimized = minimized
    this.alwaysOnTop = alwaysOnTop
    this.focusAfter = focusAfter
    this.minimizeDelayMs = minimizeDelayMs
    this.focusAttempts = 0
    this.destroyed = false
    this.calls = []
  }

  isDestroyed() { return this.destroyed }
  isMinimized() { return this.minimized }
  isAlwaysOnTop() { return this.alwaysOnTop }
  isFocused() { return this.focusAttempts >= this.focusAfter }
  minimize() {
    this.calls.push(['minimize'])
    const complete = () => {
      this.minimized = true
      this.emit('minimize')
    }
    if (this.minimizeDelayMs === null) complete()
    else setTimeout(complete, this.minimizeDelayMs)
  }
  restore() { this.minimized = false; this.calls.push(['restore']) }
  show() { this.calls.push(['show']) }
  moveTop() { this.calls.push(['moveTop']) }
  focus() { this.focusAttempts += 1; this.calls.push(['focus']) }
  setAlwaysOnTop(value, level) {
    this.alwaysOnTop = value
    this.calls.push(['setAlwaysOnTop', value, level])
  }
}

const yieldFn = async () => {}

test('主窗口首次恢复成功时显示、移顶并聚焦且不改置顶状态', async () => {
  const window = new FakeWindow({ minimized: true })
  assert.equal(await restoreWindowToForeground(window, { yieldFn }), true)
  assert.deepEqual(window.calls, [['restore'], ['show'], ['moveTop'], ['focus']])
  assert.equal(window.alwaysOnTop, false)
})

test('可见窗口首次聚焦失败时仅执行一次最小化恢复补偿', async () => {
  const window = new FakeWindow({ focusAfter: 2 })
  assert.equal(await restoreWindowToForeground(window, { yieldFn }), true)
  assert.equal(window.focusAttempts, 2)
  assert.deepEqual(window.calls, [
    ['show'], ['moveTop'], ['focus'],
    ['minimize'], ['restore'], ['show'], ['moveTop'], ['focus']
  ])
  assert.equal(window.alwaysOnTop, false)
})

test('用户原本启用置顶时最小化恢复补偿不会改变置顶设置', async () => {
  const window = new FakeWindow({ alwaysOnTop: true, focusAfter: 2 })
  assert.equal(await restoreWindowToForeground(window, { yieldFn }), true)
  assert.equal(window.calls.some(([name]) => name === 'setAlwaysOnTop'), false)
  assert.equal(window.alwaysOnTop, true)
})

test('补偿会等待异步最小化完成后再恢复窗口', async () => {
  const window = new FakeWindow({ focusAfter: 2, minimizeDelayMs: 5 })
  assert.equal(await restoreWindowToForeground(window, { yieldFn }), true)
  assert.deepEqual(window.calls.slice(3, 5), [['minimize'], ['restore']])
  assert.equal(window.minimized, false)
})

test('窗口不存在、已销毁或两次均未聚焦时返回失败', async () => {
  assert.equal(await restoreWindowToForeground(null, { yieldFn }), false)
  const destroyed = new FakeWindow()
  destroyed.destroyed = true
  assert.equal(await restoreWindowToForeground(destroyed, { yieldFn }), false)
  const refused = new FakeWindow({ focusAfter: 3 })
  assert.equal(await restoreWindowToForeground(refused, { yieldFn }), false)
  assert.equal(refused.focusAttempts, 2)
  assert.equal(refused.calls.filter(([name]) => name === 'minimize').length, 1)
  assert.equal(refused.calls.filter(([name]) => name === 'restore').length, 1)
  assert.equal(refused.alwaysOnTop, false)
})

test('Windows 恢复优先使用原生前台切换，避免普通聚焦只闪任务栏', async () => {
  const window = new FakeWindow({ focusAfter: Number.POSITIVE_INFINITY })
  let nativeAttempts = 0
  const nativeFocusFn = async (target) => {
    assert.equal(target, window)
    nativeAttempts += 1
    window.focusAfter = 0
    return true
  }

  assert.equal(await restoreWindowToForeground(window, { yieldFn, nativeFocusFn }), true)
  assert.equal(nativeAttempts, 1)
  assert.deepEqual(window.calls, [])
})

test('原生前台切换未生效时才退回普通最小化恢复', async () => {
  const window = new FakeWindow({ focusAfter: 2 })
  const nativeFocusFn = async () => false

  assert.equal(await restoreWindowToForeground(window, { yieldFn, nativeFocusFn }), true)
  assert.deepEqual(window.calls, [
    ['show'], ['moveTop'], ['focus'],
    ['minimize'], ['restore'], ['show'], ['moveTop'], ['focus']
  ])
})

test('Windows 原生补偿使用主窗口句柄并核验前台切换结果', async () => {
  const handle = Buffer.alloc(8)
  handle.writeBigUInt64LE(0x123456789n)
  const window = { getNativeWindowHandle: () => handle }
  let invocation = null
  const execFileImpl = (executable, args, options, callback) => {
    invocation = { executable, args, options }
    callback(null)
  }

  assert.equal(await restoreWindowsNativeWindowFocus(window, {
    platform: 'win32',
    pythonPath: 'python.exe',
    execFileImpl
  }), true)
  assert.equal(invocation.executable, 'python.exe')
  assert.equal(invocation.args.at(-1), '4886718345')
  assert.match(invocation.args[1], /AttachThreadInput/)
  assert.match(invocation.args[1], /GetForegroundWindow\(\) == hwnd_value/)
  assert.equal(invocation.options.windowsHide, true)

  assert.equal(await restoreWindowsNativeWindowFocus(window, {
    platform: 'win32',
    pythonPath: 'python.exe',
    execFileImpl: (_executable, _args, _options, callback) => callback(new Error('refused'))
  }), false)
  assert.equal(await restoreWindowsNativeWindowFocus(window, { platform: 'linux', pythonPath: 'python.exe' }), false)
})
