import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import {
  createOverlayOutsideClickCloser,
  isPointInsideBounds
} from '../electron/modules/window/overlayOutsideClickClose.js'

class FakeStdout extends EventEmitter {
  constructor() {
    super()
    this.written = []
  }

  setEncoding() {
    this.encodingSet = true
  }
}

class FakeChild extends EventEmitter {
  constructor() {
    super()
    this.stdout = new FakeStdout()
    this.killed = false
  }

  kill() {
    this.killed = true
  }
}

class FakeOverlayWindow {
  constructor(bounds) {
    this.bounds = bounds
    this.destroyed = false
  }

  isDestroyed() {
    return this.destroyed
  }

  getBounds() {
    return this.bounds
  }
}

function harness({ bounds = { x: 100, y: 100, width: 300, height: 400 }, cursor = { x: 0, y: 0 } } = {}) {
  const children = []
  const closer = createOverlayOutsideClickCloser({
    onClose: () => { closed += 1 },
    pythonPath: 'python',
    scriptPath: 'listener.py',
    getCursorPoint: () => cursor,
    spawnImpl: () => {
      const child = new FakeChild()
      children.push(child)
      return child
    }
  })
  let closed = 0
  return { closer, children, closed: () => closed }
}

test('isPointInsideBounds 判断点是否在浮窗矩形内', () => {
  const bounds = { x: 100, y: 100, width: 300, height: 400 }
  assert.equal(isPointInsideBounds({ x: 100, y: 100 }, bounds), true)
  assert.equal(isPointInsideBounds({ x: 400, y: 500 }, bounds), true)
  assert.equal(isPointInsideBounds({ x: 99, y: 300 }, bounds), false)
  assert.equal(isPointInsideBounds({ x: 401, y: 300 }, bounds), false)
  assert.equal(isPointInsideBounds(null, bounds), false)
})

test('布防启动监听进程，浮窗外点击触发关闭', () => {
  const { closer, children, closed } = harness({ cursor: { x: 50, y: 50 } })
  const win = new FakeOverlayWindow({ x: 100, y: 100, width: 300, height: 400 })

  closer.arm(win)

  assert.equal(closer.isArmed(), true)
  assert.equal(children.length, 1)

  children[0].stdout.emit('data', '{"event": "click"}\n')

  assert.equal(closed(), 1)
})

test('点击浮窗自身不触发关闭', () => {
  const { closer, children, closed } = harness({ cursor: { x: 200, y: 300 } })
  const win = new FakeOverlayWindow({ x: 100, y: 100, width: 300, height: 400 })

  closer.arm(win)
  children[0].stdout.emit('data', '{"event": "click"}\n')

  assert.equal(closed(), 0)
  assert.equal(closer.isArmed(), true)
})

test('解除布防终止监听进程，后续点击不再触发关闭', () => {
  const { closer, children, closed } = harness({ cursor: { x: 50, y: 50 } })
  const win = new FakeOverlayWindow({ x: 100, y: 100, width: 300, height: 400 })

  closer.arm(win)
  closer.disarm()

  assert.equal(children[0].killed, true)
  assert.equal(closer.isArmed(), false)

  children[0].stdout.emit('data', '{"event": "click"}\n')

  assert.equal(closed(), 0)
})

test('布防幂等，重复布防只保留一个监听进程', () => {
  const { closer, children, closed } = harness({ cursor: { x: 50, y: 50 } })
  const win = new FakeOverlayWindow({ x: 100, y: 100, width: 300, height: 400 })

  closer.arm(win)
  closer.arm(win)

  assert.equal(children.length, 2)
  assert.equal(children[0].killed, true)

  children[1].stdout.emit('data', '{"event": "click"}\n')

  assert.equal(closed(), 1)
})

test('监听进程意外退出时解除布防', () => {
  const { closer, children } = harness()
  const win = new FakeOverlayWindow({ x: 100, y: 100, width: 300, height: 400 })

  closer.arm(win)
  children[0].emit('exit', 1)

  assert.equal(closer.isArmed(), false)
})

test('缺少 Python 运行时不布防且不抛错', () => {
  const closer = createOverlayOutsideClickCloser({
    onClose: () => {},
    getCursorPoint: () => ({ x: 0, y: 0 }),
    spawnImpl: () => new FakeChild()
  })
  const win = new FakeOverlayWindow({ x: 0, y: 0, width: 10, height: 10 })

  closer.arm(win)

  assert.equal(closer.isArmed(), false)
})
