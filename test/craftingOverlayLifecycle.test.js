import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { prepareCraftingOverlay } from '../electron/modules/window/craftingOverlayLifecycle.js'

class FakeWebContents extends EventEmitter {
  constructor({ loading = false, calls }) {
    super()
    this.loading = loading
    this.calls = calls
  }

  isLoadingMainFrame() {
    return this.loading
  }

  send(channel, payload) {
    this.calls.push(['send', channel, payload])
  }
}

class FakeOverlayWindow {
  constructor({ loading = false } = {}) {
    this.calls = []
    this.destroyed = false
    this.visible = false
    this.webContents = new FakeWebContents({ loading, calls: this.calls })
  }

  isDestroyed() {
    return this.destroyed
  }

  isVisible() {
    return this.visible
  }

  showInactive() {
    this.calls.push(['showInactive'])
    this.visible = true
  }
}

function overlayHarness(options = {}) {
  let current = null
  const created = []
  return {
    created,
    current: () => current,
    setCurrent: (window) => { current = window },
    manager: {
      createOverlayWindow() {
        current = new FakeOverlayWindow(options)
        created.push(current)
        return current
      }
    }
  }
}

test('制作浮窗收到本次状态后才显示且不抢游戏焦点', async () => {
  const harness = overlayHarness()
  const window = await prepareCraftingOverlay(harness.manager, harness.current, { usageSessionId: 'session-1' })

  assert.equal(window.isVisible(), true)
  assert.deepEqual(window.calls, [
    ['send', 'update-overlay', { reset: true, usageSessionId: 'session-1' }],
    ['showInactive']
  ])
})

test('制作浮窗关闭后再次启动会创建并显示新实例', async () => {
  const harness = overlayHarness()
  const first = await prepareCraftingOverlay(harness.manager, harness.current, {})
  first.destroyed = true

  const second = await prepareCraftingOverlay(harness.manager, harness.current, {})

  assert.notEqual(second, first)
  assert.equal(harness.created.length, 2)
  assert.equal(second.isVisible(), true)
})

test('再次启动会重新显示仍存在但被隐藏的制作浮窗', async () => {
  const harness = overlayHarness()
  const existing = new FakeOverlayWindow()
  harness.setCurrent(existing)

  const returned = await prepareCraftingOverlay(harness.manager, harness.current, {})

  assert.equal(returned, existing)
  assert.equal(existing.isVisible(), true)
  assert.equal(harness.created.length, 0)
})

test('新建制作浮窗等待页面加载后再发送状态并显示', async () => {
  const harness = overlayHarness({ loading: true })
  const preparing = prepareCraftingOverlay(harness.manager, harness.current, {})
  const window = harness.current()
  assert.deepEqual(window.calls, [])

  window.webContents.loading = false
  window.webContents.emit('did-finish-load')
  await preparing

  assert.deepEqual(window.calls.map(call => call[0]), ['send', 'showInactive'])
})

test('制作浮窗管理器拒绝复用销毁实例且旧关闭回调不污染新实例', () => {
  const manager = readFileSync(new URL('../electron/modules/window/manager.js', import.meta.url), 'utf8')

  assert.match(manager, /if \(overlayWindow && !overlayWindow\.isDestroyed\(\)\) return overlayWindow\s+overlayWindow = null/)
  assert.match(manager, /const craftingWindow = overlayWindow\s+if \(!craftingWindow\) return\s+overlayWindow = null[\s\S]*if \(!craftingWindow\.isDestroyed\(\)\) craftingWindow\.close\(\)/)
  assert.match(manager, /craftingWindow\.on\('closed', \(\) => \{\s+clearTimeout\(saveTimer\)\s+if \(overlayWindow !== craftingWindow\) return\s+overlayWindow = null\s+craftingOverlayDragPassthrough\.stop\(\)/)
})
