import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { restoreWindowToForeground } from '../electron/modules/window/foregroundRestore.js'

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
