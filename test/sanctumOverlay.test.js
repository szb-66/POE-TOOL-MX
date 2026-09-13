import test from 'node:test'
import assert from 'node:assert/strict'
import { SanctumOverlay, sanctumOverlaySnapshot } from '../electron/modules/sanctum/overlay.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { sanctumDisplay } from '../shared/sanctumDisplay.js'

const state = () => ({ enabled: true, foreground: true, running: true, reason: '部分识别', inventory: [],
  marks: { targets: ['b'], avoid: ['c'] }, recommendation: { runId: 'run', floorId: 'floor', revision: 1, status: 'partial', paths: [{ rooms: ['a', 'b'] }], reason: '已知信息推荐', unknown: ['奖励未知'] },
  observation: { foreground: true, interfaceMatched: true, mapOpen: true, receivedAt: 1000,
    clientBounds: { x: -1920, y: 100, width: 1920, height: 1080 }, mapRegion: { x: 100, y: 100, width: 1500, height: 800 } },
  floor: { identityConfirmed: true, runId: 'run', floorId: 'floor', revision: 1, positionStatus: 'confirmed', currentRoomId: 'a', width: 1500, height: 800,
    rooms: [{ id: 'a', column: 0, status: 'matched', x: 50, y: 100, width: 80, height: 120 }, { id: 'b', column: 1, status: 'matched', detailsStatus: 'matched', name: '宝库', x: 200, y: 200, width: 80, height: 120 },
      { id: 'c', column: 1, status: 'matched', x: 200, y: 400, width: 80, height: 120 }],
    edges: [{ from: 'a', to: 'b', status: 'matched', availability: 'gold' }, { from: 'a', to: 'c', status: 'unknown' }] } })

test('实际OCR框使用客户区坐标，移动到新目标及定位失败不沿用旧框', () => {
  const s=state(), region={x:300,y:200,width:500,height:250}
  s.progress={stage:'rooms',step:'ocr',targetId:'a',region}
  assert.deepEqual(sanctumOverlaySnapshot(s,1000).ocrRegion,region)
  s.progress={stage:'rooms',step:'moving',targetId:'b'}
  assert.equal(sanctumOverlaySnapshot(s,1000).ocrRegion,null)
  s.progress={stage:'rooms',step:'locating',targetId:'b',region:null}
  assert.equal(sanctumOverlaySnapshot(s,1000).recognitionMessage,'未找到识别区域')
  s.progress.region={...region,x:1800}
  assert.equal(sanctumOverlaySnapshot(s,1000).ocrRegion,null)
})

test('路线浮窗叠加地图偏移，呈现下一房、路径、避让及未知', () => {
  const result = sanctumOverlaySnapshot(state(), 1000)
  assert.equal(result.nextRoom, '宝库')
  assert.equal(result.rooms[0].x, 150)
  assert.equal(result.rooms[1].y, 300)
  assert.equal(result.rooms[2].avoided, true)
  assert.equal(result.lines[0].recommended, true)
  assert.equal(result.lines[1].displayState, 'unknown')
  assert.equal(result.rooms[1].next, true)
  assert.deepEqual(result.unknown, ['奖励未知'])
})

test('页面显示投影与浮窗状态一致，旧版本不再显示推荐', () => {
  const value = state()
  const display = sanctumDisplay(value.floor, value.recommendation, value.marks)
  const overlay = sanctumOverlaySnapshot(value, 1000)
  for (const room of overlay.rooms) {
    const expected = display.rooms.find(item => item.id === room.id)
    for (const key of ['displayState', 'current', 'recommended', 'next', 'target', 'avoided']) assert.equal(room[key], expected[key])
  }
  overlay.lines.forEach((line, index) => {
    assert.equal(line.displayState, display.lines[index].displayState)
    assert.equal(line.recommended, display.lines[index].recommended)
    assert.equal(line.x1, display.lines[index].x1 + 100)
    assert.equal(line.y2, display.lines[index].y2 + 100)
  })
  value.recommendation.revision = 0
  const stale = sanctumOverlaySnapshot(value, 1000)
  assert.equal(stale.nextRoom, '')
  assert.ok(stale.rooms.every(room => !room.recommended && !room.next))
  assert.ok(stale.lines.every(line => !line.recommended))
})

test('离线图、停用、切出、关图、过期或缺失证据及尺寸失配均隐藏', () => {
  const cases = [value => { value.enabled = false }, value => { value.foreground = false }, value => { value.running = false },
    value => { value.floor.sampleId = 'sample.png' }, value => { value.floor.identityConfirmed = false },
    value => { value.observation.mapOpen = false }, value => { value.observation.interfaceMatched = false },
    value => { value.observation.receivedAt = -1000 }, value => { delete value.observation.receivedAt },
    value => { value.observation.receivedAt = 2000 }, value => { value.observation.mapRegion.width = 1400 }]
  for (const change of cases) { const value = state(); change(value); assert.equal(sanctumOverlaySnapshot(value, 1000), null) }
})

function fixture() {
  let current = state(), now = 1000, changed, tick
  const windows = []
  class Window {
    constructor(options) {
      this.options = options; this.events = {}; this.visible = false; this.loading = true
      this.webContents = { on: (name, callback) => { this.events[name] = callback }, isLoadingMainFrame: () => this.loading,
        send: (_name, value) => { this.sent = value } }
      windows.push(this)
    }
    setAlwaysOnTop() {}
    setIgnoreMouseEvents(value) { this.passthrough = value }
    setContentProtection(value) { this.protected = value }
    setBounds(value) { this.bounds = value }
    getBounds() { return this.bounds || {} }
    isVisible() { return this.visible }
    showInactive() { this.visible = true }
    hide() { this.visible = false }
    isDestroyed() { return Boolean(this.destroyed) }
    on(name, callback) { this.events[name] = callback }
    async loadFile() {}
    async loadURL() {}
    destroy() { this.destroyed = true; this.visible = false; this.events.closed?.() }
    loaded() { this.loading = false; this.events['did-finish-load']() }
  }
  const service = { getState: () => current, subscribe: callback => { changed = callback; return () => { changed = null } } }
  const overlay = new SanctumOverlay({ service, BrowserWindowClass: Window, now: () => now, platform: 'win32',
    screenApi: { screenToDipRect: (_window, rect) => Object.fromEntries(Object.entries(rect).map(([key, value]) => [key, value / 1.5])) },
    setIntervalFn: callback => { tick = callback; return 1 }, clearIntervalFn: () => { tick = null }, settle: async () => {} })
  return { overlay, windows, change(value) { current = value; changed?.() }, advance(value) { now = value; tick?.() },
    get disposed() { return !changed && !tick } }
}

test('窗口惰性创建、不可聚焦、穿透及截图保护，正确转换负坐标与 DPI', () => {
  const f = fixture()
  assert.equal(f.windows.length, 0)
  f.overlay.sync()
  const window = f.windows[0]
  assert.equal(window.options.focusable, false)
  assert.equal(window.passthrough, true)
  assert.equal(window.protected, true)
  assert.equal(window.visible, false)
  window.loaded()
  assert.deepEqual(window.bounds, { x: -1280, y: 67, width: 1280, height: 720 })
  assert.equal(window.visible, true)
  f.advance(2501)
  assert.equal(window.visible, false)
  f.overlay.destroy()
  assert.equal(window.destroyed, true)
  assert.equal(f.disposed, true)
})

test('加载期间切出不会迟到显示，截图期间禁止重显且异常后恢复最新可见性', async () => {
  const f = fixture()
  f.overlay.sync()
  const window = f.windows[0]
  f.change({ ...state(), foreground: false })
  window.loaded()
  assert.equal(window.visible, false)
  f.change(state())
  assert.equal(window.visible, true)
  await assert.rejects(f.overlay.withHidden(async () => {
    assert.equal(window.visible, false)
    f.overlay.sync()
    assert.equal(window.visible, false)
    await f.overlay.withHidden(async () => assert.equal(window.visible, false))
    assert.equal(window.visible, false)
    throw new Error('截图失败')
  }), /截图失败/)
  assert.equal(window.visible, true)
  await f.overlay.withHidden(async () => { f.change({ ...state(), enabled: false }) })
  assert.equal(window.visible, false)
  f.overlay.destroy()
})
