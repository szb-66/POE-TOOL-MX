import test from 'node:test'
import assert from 'node:assert/strict'
import { SanctumOverlay } from '../electron/modules/sanctum/overlay.js'
import { SanctumControlOverlay } from '../electron/modules/sanctum/controlOverlay.js'

function fixture(t, kind) {
  const windows = [], listeners = new Set()
  const switches = new Set(), animationKey = 'wm-window-animations-disabled'
  const commandLine = { hasSwitch: key => switches.has(key), appendSwitch: key => switches.add(key), removeSwitch: key => switches.delete(key) }
  let current = { enabled: true, foreground: true, running: true, inventory: [], marks: { avoid: [], targets: [] },
    observation: { foreground: true, interfaceMatched: true, receivedAt: Date.now(), mapOpen: true,
      clientBounds: { x: 100, y: 80, width: 800, height: 600 }, mapRegion: { x: 0, y: 0, width: 800, height: 600 } },
    floor: { identityConfirmed: true, width: 800, height: 600, rooms: [], edges: [] } }
  const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn) }
  const service = { enabled: true, state: {}, getState: () => current, subscribe }
  class Window {
    constructor(options) {
      this.bounds = options; this.visible = false; this.calls = { hide: 0, show: 0, bounds: 0 }
      this.events = {}; this.webContents = { on() {}, isLoadingMainFrame: () => false, send() {} }
      windows.push(this)
    }
    setAlwaysOnTop() {} setContentProtection() {}
    setIgnoreMouseEvents(ignore, options) { this.mouse = { ignore, ...options } }
    isVisible() { assert.equal(this.destroyed, undefined); return this.visible }
    isDestroyed() { return Boolean(this.destroyed) }
    getBounds() { return { ...this.bounds } }
    setBounds(bounds) { this.bounds = bounds; this.calls.bounds++ }
    showInactive() { assert.ok(switches.has(animationKey)); this.visible = true; this.calls.show++ }
    hide() { assert.ok(switches.has(animationKey)); this.visible = false; this.calls.hide++ }
    on(name, fn) { this.events[name] = fn }
    loadFile() {} loadURL() {}
    destroy() { this.destroyed = true; this.visible = false; this.events.closed?.() }
  }
  const display = { id: 1, workArea: { x: 0, y: 0, width: 1920, height: 1080 } }
  const options = { service, BrowserWindowClass: Window, settle: async () => {}, platform: 'win32', commandLine,
    screenApi: { screenToDipRect: (_window, rect) => rect, getAllDisplays: () => [display], getPrimaryDisplay: () => display },
    detection: { subscribe, registerConsumer() {}, unregisterConsumer() {}, getState: () => ({}) },
    automationLock: { subscribe, getState: () => ({}) } }
  const overlay = kind === 'route' ? new SanctumOverlay(options) : new SanctumControlOverlay(options)
  t.after(() => overlay.destroy())
  overlay.sync()
  assert.equal(switches.size, 0)
  const window = windows[0]
  return { overlay, window, windows, stop() { current = { ...current, running: false, observation: null }; overlay.sync() },
    restart() { current = { ...current, running: true, observation: { foreground: true, interfaceMatched: true, receivedAt: Date.now(), mapOpen: true,
      clientBounds: { x: 100, y: 80, width: 800, height: 600 }, mapRegion: { x: 0, y: 0, width: 800, height: 600 } } }; overlay.sync() } }
}

test('路线浮窗穿透不转发，按实际边界恢复原生移动', t => {
  const { overlay, window } = fixture(t, 'route')
  assert.deepEqual(window.mouse, { ignore: true, forward: false })
  const bounds = window.getBounds(), count = window.calls.bounds
  overlay.sync(); overlay.sync()
  assert.equal(window.calls.bounds, count)
  window.bounds = { ...bounds, y: bounds.y + 40 }
  overlay.sync()
  assert.deepEqual(window.getBounds(), bounds)
  assert.equal(window.calls.bounds, count + 1)
})

for (const kind of ['route', 'control']) {
  test(`${kind}: 三轮停止重启，重复同步没有显隐副作用`, t => {
    const f = fixture(t, kind), w = f.window
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < 20; i++) f.overlay.sync()
      assert.equal(w.calls.show, round + 1)
      f.stop()
      for (let i = 0; i < 20; i++) f.overlay.sync()
      assert.equal(w.visible, false)
      assert.equal(w.calls.hide, round + 1)
      f.restart()
      assert.equal(w.visible, true)
    }
    // 原生截图代码可改变实际可见状态，不能只依赖 JS 缓存。
    w.visible = false
    const shows = w.calls.show
    f.overlay.sync()
    assert.equal(w.calls.show, shows + 1)
    assert.equal(f.windows.length, 1)
  })

  test(`${kind}: 嵌套截图异常恢复，停止后不恢复过期窗口`, async t => {
    const f = fixture(t, kind), w = f.window
    await assert.rejects(f.overlay.withHidden(async () => {
      assert.equal(w.visible, false)
      await f.overlay.withHidden(async () => f.overlay.sync())
      assert.equal(w.calls.hide, 1)
      assert.equal(w.visible, false)
      throw new Error('capture failed')
    }), /capture failed/)
    assert.equal(w.visible, true)
    assert.equal(w.calls.show, 2)
    await f.overlay.withHidden(async () => f.stop())
    assert.equal(w.visible, false)
    assert.equal(w.calls.hide, 2)
    assert.equal(w.calls.show, 2)
  })

  test(`${kind}: 截图期间销毁不复活窗口`, async t => {
    const f = fixture(t, kind)
    await f.overlay.withHidden(async () => f.overlay.destroy())
    f.overlay.sync()
    assert.equal(f.window.destroyed, true)
    assert.equal(f.windows.length, 1)
    await assert.rejects(f.overlay.withHidden(async () => assert.fail('destroyed capture ran')), /已关闭/)
  })
}
