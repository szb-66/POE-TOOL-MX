import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { EventEmitter } from 'node:events'
import vm from 'node:vm'
import path from 'node:path'
import * as position from '../electron/modules/chaosRecipe/controlOverlayPosition.js'
import * as layout from '../electron/modules/chaosRecipe/layout.js'
import * as engine from '../electron/modules/chaosRecipe/engine.js'
import { createLoadAwarePublisher } from '../electron/modules/window/loadAwarePublisher.js'
import { OverlayDragSession } from '../electron/modules/window/overlayDrag.js'
import { normalizeAutomationTiming } from '../src/utils/operationDelay.js'
import { formatJunfengButtonLabel } from '../electron/modules/junfeng/progress.js'
import { createOverlayDrag } from '../src/utils/useOverlayDrag.js'

function setup(scale = 1, left = 0) {
  const source = readFileSync(new URL('../electron/modules/chaosRecipe/controlOverlay.js', import.meta.url), 'utf8')
    .replace(/^import [\s\S]*? from ['"][^'"]+['"]\r?\n/gm, '')
    .replace('const moduleDir = path.dirname(fileURLToPath(import.meta.url))', "const moduleDir = '.'")
    .replace('export class ChaosRecipeControlOverlay', 'class ChaosRecipeControlOverlay')
  class Window extends EventEmitter {
    constructor(bounds) {
      super(); this.bounds = bounds; this.updates = 0; this.destroyed = false
      this.webContents = Object.assign(new EventEmitter(), { id: 7, send() {}, isLoadingMainFrame: () => false })
    }
    getBounds() { return { ...this.bounds } }
    setBounds(bounds) { this.bounds = bounds; this.updates++ }
    isDestroyed() { return this.destroyed }
    setAlwaysOnTop() {}
    isVisible() { return Boolean(this.visible) }
    showInactive() { this.visible = true; this.shows = (this.shows || 0) + 1 }
    hide() { this.visible = false; this.hides = (this.hides || 0) + 1 }
    loadFile() {}
    close() { this.emit('close'); this.destroyed = true; this.emit('closed') }
  }
  const Control = vm.runInNewContext(`${source}\nChaosRecipeControlOverlay`, {
    ...position, ...layout, ...engine, createLoadAwarePublisher, OverlayDragSession,
    normalizeAutomationTiming, formatJunfengButtonLabel, path, structuredClone, performance,
    console: { debug() {} }, app: { isPackaged: false }, process: { platform: 'win32', env: {} },
    BrowserWindow: Window,
    screen: {
      dipToScreenPoint: ({ x, y }) => ({ x: Math.round(x * scale), y: Math.round(y * scale) }),
      screenToDipPoint: ({ x, y }) => ({ x: x / scale, y: y / scale })
    }
  })
  const commits = [], publications = []
  const control = new Control({ getMainWindow: () => ({ isDestroyed: () => false,
    webContents: { send: (channel, offset) => commits.push({ channel, ...offset }) } }) })
  control.enabled = true
  control.detection = { foreground: true, ready: true,
    gameBounds: { left: left * scale, top: 0, right: (left + 1600) * scale, bottom: 1000 * scale } }
  control.runtime.controlOverlayOffset = { x: 100 * scale, y: 100 * scale }
  control.sync()
  control.window.webContents.send = (...args) => publications.push(args)
  const drag = (phase, x, y, senderId = 7) => control.handleDrag(senderId, { phase, screenX: x, screenY: y })
  return { control, commits, publications, drag }
}

test('混沌浮窗重复同步无显隐副作用，实际隐藏后仍能恢复', () => {
  const { control } = setup()
  const window = control.window
  const shows = window.shows || 0
  for (let i = 0; i < 10; i++) control.sync()
  assert.equal(window.shows || 0, shows)
  window.visible = false
  control.sync()
  assert.equal(window.shows, shows + 1)
  control.detection.foreground = false
  control.sync()
  const hides = window.hides
  for (let i = 0; i < 10; i++) control.sync()
  assert.equal(window.hides, hides)
})

test('连续移动只定位，最终坐标提交一次，正常同步不会重复设置位置', () => {
  const { control, commits, publications, drag } = setup()
  let computations = 0
  const compute = control.computeState.bind(control)
  control.computeState = () => { computations++; return compute() }
  drag('start', 110, 110)
  for (let x = 120; x <= 420; x++) drag('move', x, 150)
  assert.equal(computations, 0)
  assert.equal(publications.length, 0)
  assert.equal(commits.length, 0)
  const updates = control.window.updates
  drag('move', 420, 150)
  control.sync()
  assert.equal(control.window.updates, updates)
  assert.equal(publications.length, 1)
  drag('end', 450, 180)
  assert.equal(control.window.getBounds().x, 440)
  assert.equal(control.window.getBounds().y, 170)
  assert.deepEqual(commits, [{ channel: 'chaos-recipe-control-offset', x: 440, y: 170 }])
  drag('end', 900, 900)
  drag('move', 900, 900)
  assert.equal(commits.length, 1)
  assert.equal(control.window.getBounds().x, 440)
})

test('不移动、外来发送者与无效坐标不提交；重复 start 不重置会话', () => {
  const { control, commits, drag } = setup()
  drag('start', 110, 110, 99)
  assert.equal(control.dragSession.active, null)
  drag('start', 110, 110)
  drag('end', 110, 110)
  assert.equal(commits.length, 0)
  drag('start', 110, 110)
  drag('move', Infinity, NaN)
  drag('start', 500, 500)
  drag('move', 150, 150)
  drag('end', NaN, NaN)
  assert.equal(commits.length, 1)
  assert.equal(commits[0].x, 140)
})

test('业务设置更新保留拖动位置，游戏移动后相对跟随，重显不回跳', () => {
  const { control, commits, publications, drag } = setup()
  drag('start', 110, 110)
  drag('move', 210, 210)
  control.setRuntime({ enabled: true, league: 'test', controlOverlayOffset: { x: 10, y: 10 } })
  assert.equal(control.runtime.league, 'test')
  assert.equal(control.window.getBounds().x, 200)
  assert.equal(publications.length, 1)
  control.detection.gameBounds.left += 50
  control.detection.gameBounds.right += 50
  control.sync()
  assert.equal(control.window.getBounds().x, 250)
  drag('end')
  assert.equal(commits[0].x, 200)
  control.close()
  control.sync()
  assert.equal(control.window.getBounds().x, 250)
})

for (const scale of [1, 1.25, 1.5, 2]) {
  test(`缩放 ${scale} 与负坐标客户区：保存钳制偏移并保持尺寸`, () => {
    const { control, commits, drag } = setup(scale, -1600)
    drag('start', -1490, 110)
    drag('move', 9000, 9000)
    drag('end')
    const bounds = control.window.getBounds()
    assert.equal(bounds.x, -560)
    assert.equal(bounds.y, 912)
    assert.equal(bounds.width, 560)
    assert.equal(bounds.height, 88)
    assert.equal(commits[0].x, 1040 * scale)
    assert.equal(commits[0].y, 912 * scale)
    control.sync()
    assert.equal(control.window.getBounds().x, -560)
  })
}

for (const finish of ['close', 'render-process-gone', 'hide']) {
  test(`${finish} 结束并提交已有移动一次`, () => {
    const { control, commits, drag } = setup()
    drag('start', 110, 110); drag('move', 210, 210)
    if (finish === 'close') control.window.close()
    else if (finish === 'hide') { control.detection.foreground = false; control.sync() }
    else control.window.webContents.emit(finish)
    control.finishDrag()
    assert.equal(commits.length, 1)
    assert.equal(control.dragSession.active, null)
  })
}

test('未拖动保留动态默认位置，业务同步不覆盖已有保存偏移', () => {
  const { control, commits, drag } = setup()
  control.runtime.controlOverlayOffset = null
  control.sync()
  const first = control.window.getBounds()
  drag('start', first.x + 10, first.y + 10)
  drag('end', first.x + 10, first.y + 10)
  control.detection.gameBounds.bottom -= 100
  control.sync()
  assert.equal(control.runtime.controlOverlayOffset, null)
  assert.equal(control.window.getBounds().y, first.y - 100)
  assert.equal(commits.length, 0)
  control.runtime.controlOverlayOffset = { x: 1500, y: 950 }
  control.sync()
  assert.deepEqual(control.runtime.controlOverlayOffset, { x: 1500, y: 950 })
})

function pointerSetup(finalCoordinates = true) {
  const messages = []
  let captured = false
  const target = { setPointerCapture: () => { captured = true }, hasPointerCapture: () => captured,
    releasePointerCapture: () => { captured = false; drag.pointerUp(event('lostpointercapture', 0, 0)) } }
  const drag = createOverlayDrag(message => messages.push(message), { finalCoordinates })
  const event = (type, screenX = 110, screenY = 110, pointerId = 1) => ({ type, button: 0,
    screenX, screenY, pointerId, currentTarget: target, preventDefault() {} })
  return { drag, messages, event }
}

test('指针松手携带最终坐标、释放捕获不重复结束，忽略其他指针', () => {
  const { drag, messages, event } = pointerSetup()
  drag.pointerDown(event('pointerdown'))
  drag.pointerMove(event('pointermove', 200, 200, 2))
  drag.pointerUp(event('pointerup', 200, 200, 2))
  drag.pointerMove(event('pointermove', 210, 210))
  drag.pointerUp(event('pointerup', 230, 250))
  assert.deepEqual(messages, [
    { phase: 'start', screenX: 110, screenY: 110 },
    { phase: 'move', screenX: 210, screenY: 210 },
    { phase: 'end', screenX: 230, screenY: 250 }
  ])
})

for (const type of ['pointercancel', 'lostpointercapture', 'dispose']) {
  test(`${type} 不使用默认零坐标且不重复提交`, () => {
    const { drag, messages, event } = pointerSetup()
    drag.pointerDown(event('pointerdown'))
    drag.pointerMove(event('pointermove', 210, 210))
    if (type === 'dispose') drag.dispose()
    else drag.pointerUp(event(type, 0, 0))
    drag.dispose()
    assert.deepEqual(messages.at(-1), { phase: 'end' })
    assert.equal(messages.length, 3)
  })
}

test('其他浮窗默认结束消息保持兼容', () => {
  const { drag, messages, event } = pointerSetup(false)
  drag.pointerDown(event('pointerdown')); drag.pointerUp(event('pointerup', 220, 220))
  assert.deepEqual(messages.at(-1), { phase: 'end' })
})
