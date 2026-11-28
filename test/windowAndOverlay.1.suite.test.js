import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { EventEmitter as _m0_EventEmitter } from 'node:events'
import _m0_vm from 'node:vm'
import _m0_path from 'node:path'
import * as _m0_position from '../electron/modules/chaosRecipe/controlOverlayPosition.js'
import * as _m0_layout from '../electron/modules/chaosRecipe/layout.js'
import * as _m0_engine from '../electron/modules/chaosRecipe/engine.js'
import { createLoadAwarePublisher as _m0_createLoadAwarePublisher } from '../electron/modules/window/loadAwarePublisher.js'
import { OverlayDragSession as _m0_OverlayDragSession } from '../electron/modules/window/overlayDrag.js'
import { normalizeAutomationTiming as _m0_normalizeAutomationTiming } from '../src/utils/operationDelay.js'
import { formatJunfengButtonLabel as _m0_formatJunfengButtonLabel } from '../electron/modules/junfeng/progress.js'
import { createOverlayDrag as _m0_createOverlayDrag } from '../src/utils/useOverlayDrag.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFileSync as _m1_readFileSync } from 'node:fs'
import { classifyGameDisplayMode as _m1_classifyGameDisplayMode, createCachedGameDpiDetector as _m1_createCachedGameDpiDetector, isGameWindowTitle as _m1_isGameWindowTitle, selectGameWindowCandidate as _m1_selectGameWindowCandidate } from '../electron/modules/system/gameDpi.js'
import { loadDpiSettings as _m1_loadDpiSettings, resolveEffectiveDpi as _m1_resolveEffectiveDpi } from '../src/utils/dpiSettings.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { mkdtempSync as _m2_mkdtempSync, readFileSync as _m2_readFileSync, rmSync as _m2_rmSync, writeFileSync as _m2_writeFileSync } from 'node:fs'
import { tmpdir as _m2_tmpdir } from 'node:os'
import _m2_path from 'node:path'
import { DEFAULT_GAME_WINDOW_TITLES as _m2_DEFAULT_GAME_WINDOW_TITLES, DEFAULT_GAME_WINDOW_PROCESS_NAMES as _m2_DEFAULT_GAME_WINDOW_PROCESS_NAMES, gameWindowTitlePriority as _m2_gameWindowTitlePriority, isGameWindowCandidate as _m2_isGameWindowCandidate, isGameWindowProcessName as _m2_isGameWindowProcessName, normalizeGameWindowProcessNames as _m2_normalizeGameWindowProcessNames, normalizeGameWindowTitles as _m2_normalizeGameWindowTitles, validateGameWindowProcessNames as _m2_validateGameWindowProcessNames, validateGameWindowTitles as _m2_validateGameWindowTitles } from '../shared/gameWindowTitles.js'
import { GAME_WINDOW_TITLES_ENV as _m2_GAME_WINDOW_TITLES_ENV, GameWindowTitleRegistry as _m2_GameWindowTitleRegistry } from '../electron/modules/system/gameWindowTitles.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { EventEmitter as _m3_EventEmitter } from 'node:events'
import { createLoadAwarePublisher as _m3_createLoadAwarePublisher } from '../electron/modules/window/loadAwarePublisher.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { readFileSync as _m4_readFileSync } from 'node:fs'
import { EventEmitter as _m4_EventEmitter } from 'node:events'
import _m4_vm from 'node:vm'
import _m4_path from 'node:path'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { addOverlayBackgroundHistory as _m5_addOverlayBackgroundHistory, OVERLAY_BACKGROUND_MODES as _m5_OVERLAY_BACKGROUND_MODES, isSupportedOverlayBackground as _m5_isSupportedOverlayBackground, normalizeOverlaySettings as _m5_normalizeOverlaySettings, overlayBackgroundMedia as _m5_overlayBackgroundMedia, resolveOverlayBackgroundDrop as _m5_resolveOverlayBackgroundDrop } from '../shared/overlayBackground.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { readFileSync as _m6_readFileSync } from 'node:fs'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import _m7_fs from 'node:fs'
import _m7_os from 'node:os'
import _m7_path from 'node:path'
import { importOverlayBackground as _m7_importOverlayBackground, OverlayBackgroundImportError as _m7_OverlayBackgroundImportError } from '../electron/modules/window/backgroundImport.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import _m8_fs from 'node:fs'
import { OverlayDragPassthroughController as _m8_OverlayDragPassthroughController, getFixedOverlayDragBounds as _m8_getFixedOverlayDragBounds } from '../electron/modules/window/overlayDrag.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { EventEmitter as _m9_EventEmitter } from 'node:events'
import { createOverlayOutsideClickCloser as _m9_createOverlayOutsideClickCloser, isPointInsideBounds as _m9_isPointInsideBounds } from '../electron/modules/window/overlayOutsideClickClose.js'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import _m10_fs from 'node:fs'
import _m10_os from 'node:os'
import _m10_path from 'node:path'
import { readFileSync as _m10_readFileSync } from 'node:fs'
import { clampRectangle as _m10_clampRectangle, dipRectangleToPhysical as _m10_dipRectangleToPhysical, expandSearchRegion as _m10_expandSearchRegion, getDisplayPhysicalBounds as _m10_getDisplayPhysicalBounds, hasUsefulPixelVariance as _m10_hasUsefulPixelVariance, isRegionLargeEnough as _m10_isRegionLargeEnough, normalizeRectangle as _m10_normalizeRectangle, physicalRectangleToDipBounds as _m10_physicalRectangleToDipBounds, physicalRectangleToImageCrop as _m10_physicalRectangleToImageCrop, resolveCaptureSources as _m10_resolveCaptureSources } from '../electron/modules/window/coordinates.js'
import { assertBagTemplateTarget as _m10_assertBagTemplateTarget, resolveTemplateFileName as _m10_resolveTemplateFileName, savePngAtomically as _m10_savePngAtomically } from '../electron/modules/bag/templateCapture.js'
import { normalizeBagSettings as _m10_normalizeBagSettings, resolveCaptureDisplay as _m10_resolveCaptureDisplay, validateTemplateCaptureEnvironment as _m10_validateTemplateCaptureEnvironment } from '../src/utils/bagConfig.js'
import _m11_test from 'node:test'
import _m11_assert from 'node:assert/strict'
import { readFileSync as _m11_readFileSync } from 'node:fs'
import _m11_path from 'node:path'
import { runInNewContext as _m11_runInNewContext } from 'node:vm'
import { acquireCrossProcessInstanceLock as _m11_acquireCrossProcessInstanceLock } from '../electron/modules/app/singleInstance.js'
import { resolveUserDataPath as _m11_resolveUserDataPath } from '../electron/modules/storage/userDataPath.js'
import _m12_test from 'node:test'
import _m12_assert from 'node:assert/strict'
import _m12_fs from 'node:fs'
import _m12_path from 'node:path'
import { resolveUserDataPath as _m12_resolveUserDataPath } from '../electron/modules/storage/userDataPath.js'
import _m13_test from 'node:test'
import _m13_assert from 'node:assert/strict'
import { WINDOW_ACTIVATION_CODES as _m13_WINDOW_ACTIVATION_CODES, WindowActivationService as _m13_WindowActivationService, selectTrustedGameWindow as _m13_selectTrustedGameWindow } from '../electron/modules/window/activation.js'

// === Merged from controlOverlayDrag.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const EventEmitter = _m0_EventEmitter
  const vm = _m0_vm
  const path = _m0_path
  const position = _m0_position
  const layout = _m0_layout
  const engine = _m0_engine
  const createLoadAwarePublisher = _m0_createLoadAwarePublisher
  const OverlayDragSession = _m0_OverlayDragSession
  const normalizeAutomationTiming = _m0_normalizeAutomationTiming
  const formatJunfengButtonLabel = _m0_formatJunfengButtonLabel
  const createOverlayDrag = _m0_createOverlayDrag
function setup(scale = 1, left = 0, { loadingOnCreate = false } = {}) {
  const source = readFileSync(new URL('../electron/modules/chaosRecipe/controlOverlay.js', import.meta.url), 'utf8')
    .replace(/^import [\s\S]*? from ['"][^'"]+['"]\r?\n/gm, '')
    .replace('const moduleDir = path.dirname(fileURLToPath(import.meta.url))', "const moduleDir = '.'")
    .replace('export class ChaosRecipeControlOverlay', 'class ChaosRecipeControlOverlay')
  class Window extends EventEmitter {
    constructor(bounds) {
      super(); this.bounds = bounds; this.updates = 0; this.destroyed = false; this.loading = loadingOnCreate; this.alwaysOnTopCalls = []
      this.webContents = Object.assign(new EventEmitter(), { id: 7, send() {}, isLoadingMainFrame: () => this.loading })
    }
    getBounds() { return { ...this.bounds } }
    setBounds(bounds) { this.bounds = bounds; this.updates++ }
    isDestroyed() { return this.destroyed }
    setAlwaysOnTop(...args) { this.alwaysOnTopCalls.push(args) }
    isVisible() { return Boolean(this.visible) }
    showInactive() { this.visible = true; this.shows = (this.shows || 0) + 1 }
    hide() { this.visible = false; this.hides = (this.hides || 0) + 1 }
    loadFile() {}
    destroy() { this.destroyed = true }
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

test('懒创建控制浮窗在加载完成前不提前显示，did-finish-load 后再置顶显示或保持隐藏', () => {
  const { control } = setup(1, 0, { loadingOnCreate: true })
  control.enabled = false
  control.close()
  control.stashPickup = { runtime: { enabled: true }, getStatus: () => ({ status: 'idle' }) }
  control.detection = {
    foreground: true,
    ready: true,
    gameBounds: { left: 0, top: 0, right: 1600, bottom: 1000 }
  }
  const sent = []
  control.sync()
  assert.ok(control.window)
  assert.equal(control.window.isVisible(), false)
  assert.equal(control.window.shows || 0, 0)
  control.window.webContents.send = (...args) => sent.push(args)

  // 即使 did-finish-load 触发瞬间 isLoadingMainFrame() 尚未翻转，也应立即显示浮窗
  control.window.webContents.emit('did-finish-load')
  assert.equal(control.window.isVisible(), true)
  assert.equal(control.window.shows, 1)
  assert.deepEqual(control.window.alwaysOnTopCalls.at(-1), [true, 'screen-saver'])
  assert.equal(sent.length, 1)

  control.close()
  control.sync()
  control.detection.foreground = false
  control.window.loading = false
  control.window.webContents.emit('did-finish-load')
  assert.equal(control.window.isVisible(), false)
  assert.equal(control.window.shows || 0, 0)
})

test('仅开启仓库取件时残留 rewardDetected 不隐藏普通按钮，close 后重置 contentSize', () => {
  const { control } = setup()
  control.enabled = false
  control.stashPickup = { runtime: { enabled: true }, getStatus: () => ({ status: 'idle' }) }
  control.junfeng = { runtime: { enabled: false }, getStatus: () => ({ status: 'idle' }), getAvailability: () => ({ ready: false, reason: '未启用' }) }
  control.detection = {
    foreground: true,
    ready: true,
    rewardDetected: true,
    gameBounds: { left: 0, top: 0, right: 1600, bottom: 1000 }
  }
  const state = control.computeState()
  assert.equal(state.rewardDetected, false)
  assert.equal(state.visible, true)
  assert.equal(state.stashPickupEnabled, true)

  control.resizeToContent({ width: 140, height: 42 })
  assert.deepEqual(control.contentSize, { width: 140, height: 42 })
  control.close()
  assert.deepEqual({ ...control.contentSize }, { ...position.CHAOS_CONTROL_DIP_SIZE })
})

test('多屏混合 DPI 下控制浮窗通过 screen.screenToDipRect 保持在游戏屏幕可见区域内', () => {
  const source = readFileSync(new URL('../electron/modules/chaosRecipe/controlOverlay.js', import.meta.url), 'utf8')
    .replace(/^import [\s\S]*? from ['"][^'"]+['"]\r?\n/gm, '')
    .replace('const moduleDir = path.dirname(fileURLToPath(import.meta.url))', "const moduleDir = '.'")
    .replace('export class ChaosRecipeControlOverlay', 'class ChaosRecipeControlOverlay')
  class Window extends EventEmitter {
    constructor(bounds) {
      super(); this.bounds = bounds; this.destroyed = false; this.visible = false
      this.webContents = Object.assign(new EventEmitter(), { id: 9, send() {}, isLoadingMainFrame: () => false })
    }
    getBounds() { return { ...this.bounds } }
    setBounds(bounds) { this.bounds = bounds }
    isDestroyed() { return this.destroyed }
    setAlwaysOnTop() {}
    isVisible() { return this.visible }
    showInactive() { this.visible = true }
    hide() { this.visible = false }
    loadFile() {}
    destroy() { this.destroyed = true }
    close() { this.destroyed = true; this.emit('closed') }
  }
  let rectCalls = 0
  const Control = vm.runInNewContext(`${source}\nChaosRecipeControlOverlay`, {
    ...position, ...layout, ...engine, createLoadAwarePublisher, OverlayDragSession,
    normalizeAutomationTiming, formatJunfengButtonLabel, path, structuredClone, performance,
    console: { debug() {} }, app: { isPackaged: false }, process: { platform: 'win32', env: {} },
    BrowserWindow: Window,
    screen: {
      screenToDipPoint: ({ x, y }) => x >= 3840 ? { x: 2194 + (x - 3840), y } : { x: x / 1.75, y: y / 1.75 },
      dipToScreenPoint: ({ x, y }) => ({ x: Math.round(x * 1.75), y: Math.round(y * 1.75) }),
      screenToDipRect: (_win, rect) => { rectCalls++; return { x: Math.round(rect.x / 1.75), y: Math.round(rect.y / 1.75), width: Math.round(rect.width / 1.75), height: Math.round(rect.height / 1.75) } }
    }
  })
  const control = new Control({ getMainWindow: () => null })
  control.stashPickup = { runtime: { enabled: true }, getStatus: () => ({ status: 'idle' }) }
  control.detection = { foreground: true, ready: true, gameBounds: { left: 0, top: 0, right: 3840, bottom: 2160, width: 3840, height: 2160 } }
  control.sync()
  assert.ok(rectCalls >= 1)
  const bounds = control.window.getBounds()
  assert.equal(bounds.x, position.CHAOS_CONTROL_MARGIN)
  assert.equal(bounds.y, Math.round(2160 / 1.75) - position.CHAOS_CONTROL_DIP_SIZE.height - position.CHAOS_CONTROL_MARGIN)
  assert.equal(control.window.isVisible(), true)
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
})()

// === Merged from gameDpi.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFileSync = _m1_readFileSync
  const classifyGameDisplayMode = _m1_classifyGameDisplayMode
  const createCachedGameDpiDetector = _m1_createCachedGameDpiDetector
  const isGameWindowTitle = _m1_isGameWindowTitle
  const selectGameWindowCandidate = _m1_selectGameWindowCandidate
  const loadDpiSettings = _m1_loadDpiSettings
  const resolveEffectiveDpi = _m1_resolveEffectiveDpi
const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('游戏 DPI 候选匹配中英文标题并优先配置顺序', () => {
  assert.equal(isGameWindowTitle('流放之路'), true)
  assert.equal(isGameWindowTitle('Path of Exile 2'), true)
  assert.equal(isGameWindowTitle('普通浏览器窗口'), false)
  const selected = selectGameWindowCandidate([
    { title: 'Path of Exile', processName: 'PathOfExile.exe', foreground: false, minimized: false, area: 4000, dpi: 144 },
    { title: '流放之路', processName: 'PathOfExile.exe', foreground: true, minimized: false, area: 1000, dpi: 120 }
  ])
  assert.equal(selected.title, '流放之路')
  assert.equal(selected.dpi, 120)
})

test('没有前台候选时选择最大非最小化游戏窗口', () => {
  const selected = selectGameWindowCandidate([
    { title: '流放之路', processName: 'PathOfExile_x64.exe', foreground: false, minimized: true, area: 9000, dpi: 192 },
    { title: 'Path of Exile', processName: 'PathOfExile.exe', foreground: false, minimized: false, area: 5000, dpi: 144 },
    { title: '流放之路 2', processName: 'PathOfExile_x64Steam.exe', foreground: false, minimized: false, area: 3000, dpi: 120 }
  ])
  assert.equal(selected.dpi, 120)
  assert.equal(selectGameWindowCandidate([{ title: '其他窗口', area: 9999 }]), null)
})

test('自定义名称优先级高于前台状态，同一名称内仍优先前台和面积', () => {
  const candidates = [
    { title: '低优先级客户端', processName: 'PathOfExile.exe', foreground: true, minimized: false, area: 9000, dpi: 192 },
    { title: '高优先级客户端 A', processName: 'PathOfExile.exe', foreground: false, minimized: false, area: 1000, dpi: 120 },
    { title: '高优先级客户端 B', processName: 'PathOfExile.exe', foreground: true, minimized: false, area: 500, dpi: 144 }
  ]
  assert.equal(selectGameWindowCandidate(candidates, ['高优先级', '低优先级']).dpi, 144)
  assert.equal(selectGameWindowCandidate(candidates, ['低优先级', '高优先级']).dpi, 192)
})

test('游戏最小化时仍可读取 DPI，同一名称下优先非最小化候选', () => {
  const minimized = { title: '流放之路', processName: 'PathOfExile.exe', foreground: false, minimized: true, area: 4000, dpi: 144 }
  assert.equal(selectGameWindowCandidate([minimized])?.dpi, 144)
  assert.equal(selectGameWindowCandidate([
    minimized,
    { title: '流放之路 - 可见', processName: 'PathOfExile.exe', foreground: false, minimized: false, area: 1000, dpi: 120 }
  ])?.dpi, 120)
})

test('并发和短时间重复 DPI 探测复用同一任务与结果', async () => {
  let calls = 0
  let release
  let now = 1000
  const detector = createCachedGameDpiDetector(() => {
    calls += 1
    return new Promise(resolve => { release = resolve })
  }, { cacheDurationMs: 2000, now: () => now })

  const first = detector()
  const second = detector()
  assert.strictEqual(first, second)
  assert.equal(calls, 1)
  release({ found: true, scaleFactor: 1.5 })
  assert.deepEqual(await first, { found: true, scaleFactor: 1.5 })
  assert.deepEqual(await detector(), { found: true, scaleFactor: 1.5 })
  assert.equal(calls, 1)

  now += 2001
  const third = detector()
  assert.equal(calls, 2)
  release({ found: true, scaleFactor: 1.25 })
  assert.equal((await third).scaleFactor, 1.25)
})

test('显示模式分类覆盖窗口、无边框、独占全屏与异常场景', () => {
  const WS_CAPTION = 0x00C00000
  const WS_POPUP = 0x80000000
  const fullMonitor = { left: 0, top: 0, right: 1920, bottom: 1080 }
  const assertMode = (candidate, mode, supported) => {
    assert.deepEqual(classifyGameDisplayMode(candidate), { mode, supported })
  }
  assertMode(null, null, false)
  assertMode({ title: '流放之路', minimized: true, style: WS_CAPTION }, 'unknown', false)
  assertMode({ title: '流放之路', style: WS_CAPTION }, 'windowed', true)
  assertMode({
    title: '流放之路', style: WS_POPUP, foreground: false, notificationState: -1,
    windowRect: fullMonitor, monitorRect: fullMonitor
  }, 'fullscreen', true)
  assertMode({
    title: '流放之路', style: WS_POPUP, foreground: true, notificationState: 3,
    windowRect: fullMonitor, monitorRect: fullMonitor
  }, 'exclusive', false)
  assertMode({
    title: '流放之路', style: WS_POPUP, foreground: false, notificationState: 3,
    windowRect: fullMonitor, monitorRect: fullMonitor
  }, 'fullscreen', true)
  assertMode({
    title: '流放之路', style: WS_POPUP, foreground: true, notificationState: 3,
    windowRect: { left: 0, top: 0, right: 960, bottom: 540 }, monitorRect: fullMonitor
  }, 'borderless', true)
  assertMode({ title: '流放之路', style: WS_POPUP, windowRect: null, monitorRect: fullMonitor }, 'borderless', true)
})

test('浏览器等非游戏进程即使标题匹配也不作为 DPI 候选', () => {
  assert.equal(selectGameWindowCandidate([
    {
      title: 'Path of Exile 编年史 - Google Chrome',
      processName: 'chrome.exe',
      foreground: true,
      minimized: false,
      area: 9000,
      dpi: 144
    }
  ]), null)
  assert.equal(selectGameWindowCandidate([
    {
      title: 'Path of Exile 编年史 - Google Chrome',
      processName: 'chrome.exe',
      foreground: true,
      minimized: false,
      area: 9000,
      dpi: 144
    },
    { title: '流放之路', processName: 'PathOfExile.exe', foreground: false, minimized: false, area: 1000, dpi: 120 }
  ]).dpi, 120)
})

test('旧 DPI 设置迁移到自动模式并保留手动初值与历史回退', () => {
  assert.deepEqual(loadDpiSettings({ dpiScale: 1.5 }), {
    mode: 'auto',
    manualScale: 1.5,
    lastDetectedScale: 1.5
  })
  assert.deepEqual(loadDpiSettings({}), {
    mode: 'auto',
    manualScale: 1,
    lastDetectedScale: null
  })
})

test('有效 DPI 按手动、当前游戏、历史和主屏顺序解析', () => {
  assert.deepEqual(resolveEffectiveDpi({ mode: 'manual', manualScale: 1.75, detectedScale: 1.5 }), { scaleFactor: 1.75, source: 'manual' })
  assert.deepEqual(resolveEffectiveDpi({ mode: 'auto', detectedScale: 1.5, lastDetectedScale: 1.25, primaryScale: 1 }), { scaleFactor: 1.5, source: 'game' })
  assert.deepEqual(resolveEffectiveDpi({ mode: 'auto', lastDetectedScale: 1.25, primaryScale: 1 }), { scaleFactor: 1.25, source: 'history' })
  assert.deepEqual(resolveEffectiveDpi({ mode: 'auto', primaryScale: 1.5 }), { scaleFactor: 1.5, source: 'primary' })
})

test('启动与脚本运行前触发检测，脚本只在 pynput 回退路径使用注入倍率', () => {
  const runtime = source('../src/startup/mainRuntime.js')
  const service = source('../src/utils/scriptService.js')
  const generator = source('../src/utils/pythonScriptGenerator.js')
  const crafting = source('../src/assets/scripts/crafting_template.py')
  const mapRolling = source('../src/assets/scripts/map_rolling_template.py')

  assert.match(runtime, /settingsStore\.refreshDpiScale\(\)/)
  assert.match(runtime, /window\.addEventListener\('focus', refreshGameWindowOnFocus\)/)
  assert.match(runtime, /window\.removeEventListener\('focus', refreshGameWindowOnFocus\)/)
  assert.equal((service.match(/await refreshDpiForAutomation\(settingsStore\)/g) || []).length, 3)
  assert.equal((generator.match(/'\{\{DPI_SCALE_FACTOR\}\}'/g) || []).length, 2)
  for (const template of [crafting, mapRolling]) {
    assert.match(template, /dpi_scale_factor = \{\{DPI_SCALE_FACTOR\}\}/)
    assert.doesNotMatch(template, /GetDpiForSystem/)
    assert.match(template, /SetCursorPos\(int\(x\), int\(y\)\)/)
    assert.match(template, /mouse_controller\.position = \(int\(x \/ dpi_scale_factor\), int\(y \/ dpi_scale_factor\)\)/)
  }
})
})()

// === Merged from gameWindowTitles.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const mkdtempSync = _m2_mkdtempSync
  const readFileSync = _m2_readFileSync
  const rmSync = _m2_rmSync
  const writeFileSync = _m2_writeFileSync
  const tmpdir = _m2_tmpdir
  const path = _m2_path
  const DEFAULT_GAME_WINDOW_TITLES = _m2_DEFAULT_GAME_WINDOW_TITLES
  const DEFAULT_GAME_WINDOW_PROCESS_NAMES = _m2_DEFAULT_GAME_WINDOW_PROCESS_NAMES
  const gameWindowTitlePriority = _m2_gameWindowTitlePriority
  const isGameWindowCandidate = _m2_isGameWindowCandidate
  const isGameWindowProcessName = _m2_isGameWindowProcessName
  const normalizeGameWindowProcessNames = _m2_normalizeGameWindowProcessNames
  const normalizeGameWindowTitles = _m2_normalizeGameWindowTitles
  const validateGameWindowProcessNames = _m2_validateGameWindowProcessNames
  const validateGameWindowTitles = _m2_validateGameWindowTitles
  const GAME_WINDOW_TITLES_ENV = _m2_GAME_WINDOW_TITLES_ENV
  const GameWindowTitleRegistry = _m2_GameWindowTitleRegistry
const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('窗口名称规范化保留顺序、去除空白并拒绝无效列表', () => {
  assert.deepEqual(validateGameWindowTitles(['  自定义客户端  ', 'Path of Exile']).titles, ['自定义客户端', 'Path of Exile'])
  assert.equal(validateGameWindowTitles([]).valid, false)
  assert.equal(validateGameWindowTitles(['  ']).valid, false)
  assert.equal(validateGameWindowTitles(['Game', 'game']).valid, false)
  assert.deepEqual(normalizeGameWindowTitles(null), [...DEFAULT_GAME_WINDOW_TITLES])
})

test('标题使用不区分大小写的包含匹配并返回最早优先级', () => {
  assert.equal(gameWindowTitlePriority('Season - PATH OF EXILE', ['自定义', 'Path of Exile']), 1)
  assert.equal(gameWindowTitlePriority('自定义 Path of Exile', ['自定义', 'Path of Exile']), 0)
  assert.equal(gameWindowTitlePriority('普通窗口', ['自定义']), -1)
})

test('游戏客户端进程名使用不区分大小写的精确匹配并拒绝无效列表', () => {
  assert.deepEqual(validateGameWindowProcessNames(['PathOfExile.exe', '  PathOfExile_x64.exe  ']).processNames, ['PathOfExile.exe', 'PathOfExile_x64.exe'])
  assert.deepEqual(validateGameWindowProcessNames(['C:\\Games\\Path of Exile\\PathOfExile.exe']).processNames, ['PathOfExile.exe'])
  assert.equal(validateGameWindowProcessNames([]).valid, false)
  assert.equal(validateGameWindowProcessNames(['  ']).valid, false)
  assert.equal(validateGameWindowProcessNames(['pathofexile.exe', 'PathOfExile.exe']).valid, false)
  assert.deepEqual(normalizeGameWindowProcessNames(null), [...DEFAULT_GAME_WINDOW_PROCESS_NAMES])
  assert.ok(DEFAULT_GAME_WINDOW_PROCESS_NAMES.includes('PathOfExileEGS.exe'))
  assert.ok(DEFAULT_GAME_WINDOW_PROCESS_NAMES.includes('PathOfExile_x64EGS.exe'))
  assert.equal(isGameWindowProcessName('C:\\Games\\Path of Exile\\PathOfExile.exe'), true)
  assert.equal(isGameWindowProcessName('chrome.exe'), false)
})

test('窗口只有在标题与进程名同时匹配时才识别为游戏窗口', () => {
  assert.equal(isGameWindowCandidate('Path of Exile 编年史 - Google Chrome', 'chrome.exe'), false)
  assert.equal(isGameWindowCandidate('Season - PATH OF EXILE', 'PathOfExile.exe'), true)
  assert.equal(isGameWindowCandidate('普通窗口', 'PathOfExile.exe'), false)
  assert.equal(isGameWindowCandidate('流放之路', 'PathOfExile_x64.exe'), true)
})

test('主进程注册表原子更新固定共享文件并保留有序列表', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'poe-window-titles-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const environment = {}
  const registry = new GameWindowTitleRegistry({ userDataPath: directory, environment })
  registry.initialize()
  assert.equal(environment[GAME_WINDOW_TITLES_ENV], path.join(directory, 'game-window-titles.json'))
  const result = registry.update(['第二客户端', '第一客户端'])
  assert.deepEqual(result.titles, ['第二客户端', '第一客户端'])
  assert.deepEqual(result.processNames, [...DEFAULT_GAME_WINDOW_PROCESS_NAMES])
  const saved = JSON.parse(readFileSync(environment[GAME_WINDOW_TITLES_ENV], 'utf8'))
  assert.deepEqual(saved, {
    version: 2,
    titles: ['第二客户端', '第一客户端'],
    processNames: [...DEFAULT_GAME_WINDOW_PROCESS_NAMES]
  })
})

test('旧版配置缺少进程名时自动补齐默认列表', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'poe-window-titles-legacy-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const filePath = path.join(directory, 'game-window-titles.json')
  writeFileSync(filePath, JSON.stringify({ version: 1, titles: ['流放之路', 'Path of Exile'] }), 'utf8')
  const registry = new GameWindowTitleRegistry({ userDataPath: directory })
  registry.initialize()
  assert.deepEqual(registry.getTitles(), ['流放之路', 'Path of Exile'])
  assert.deepEqual(registry.getProcessNames(), [...DEFAULT_GAME_WINDOW_PROCESS_NAMES])
})

test('进程名列表可独立更新并持久化，写入失败时保留上一份内存配置', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'poe-window-process-names-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const registry = new GameWindowTitleRegistry({ userDataPath: directory })
  registry.initialize()
  const result = registry.updateProcessNames(['PathOfExile.exe', 'CustomClient.exe'])
  assert.deepEqual(result.processNames, ['PathOfExile.exe', 'CustomClient.exe'])
  const saved = JSON.parse(readFileSync(path.join(directory, 'game-window-titles.json'), 'utf8'))
  assert.deepEqual(saved.processNames, ['PathOfExile.exe', 'CustomClient.exe'])

  const fileSystem = {
    writeFileSync() {},
    renameSync() { throw new Error('locked') },
    unlinkSync() {}
  }
  const failing = new GameWindowTitleRegistry({ userDataPath: directory, fileSystem, environment: {} })
  failing.titles = ['流放之路']
  failing.processNames = ['PathOfExile.exe']
  assert.throws(() => failing.updateProcessNames(['PathOfExile_x64.exe']), /locked/)
  assert.deepEqual(failing.getProcessNames(), ['PathOfExile.exe'])
})

test('共享文件写入失败时不替换上一份内存配置', () => {
  const fileSystem = {
    writeFileSync() {},
    renameSync() { throw new Error('locked') },
    unlinkSync() {}
  }
  const registry = new GameWindowTitleRegistry({ userDataPath: 'C:\\runtime', fileSystem, environment: {} })
  assert.throws(() => registry.update(['新客户端']), /locked/)
  assert.deepEqual(registry.getTitles(), [...DEFAULT_GAME_WINDOW_TITLES])
})

test('Windows 短暂占用共享文件时重试原子替换', () => {
  let renameAttempts = 0
  const retryDelays = []
  const fileSystem = {
    writeFileSync() {},
    renameSync() {
      renameAttempts += 1
      if (renameAttempts < 3) {
        throw Object.assign(new Error('operation not permitted'), { code: 'EPERM' })
      }
    },
    unlinkSync() {
      assert.fail('重试成功后不应删除临时文件')
    }
  }
  const registry = new GameWindowTitleRegistry({
    userDataPath: 'C:\\runtime',
    fileSystem,
    environment: {},
    sleep: delay => retryDelays.push(delay)
  })

  const result = registry.updateProcessNames(['PathOfExile_x64.exe'])

  assert.deepEqual(result.processNames, ['PathOfExile_x64.exe'])
  assert.equal(renameAttempts, 3)
  assert.deepEqual(retryDelays, [10, 25])
})

test('设置持久化、启动同步和编辑器覆盖新增编辑删除与拖拽', () => {
  const store = source('../src/domains/settings/settingsStore.js')
  const runtime = source('../src/startup/mainRuntime.js')
  const view = source('../src/domains/settings/SettingsView.vue')
  const editor = source('../src/domains/settings/GameWindowTitleSettings.vue')
  assert.match(store, /gameWindowTitles: gameWindowTitles\.value/)
  assert.match(store, /gameWindowProcessNames: gameWindowProcessNames\.value/)
  assert.match(store, /normalizeGameWindowTitles\(data\.gameWindowTitles \|\| currentServer.windowTitles\)/)
  assert.match(store, /normalizeGameWindowProcessNames\(data\.gameWindowProcessNames\)/)
  assert.match(store, /gameWindowTitles\.value = \[\.\.\.currentServer.windowTitles\]/)
  assert.match(store, /gameWindowProcessNames\.value = \[\.\.\.DEFAULT_GAME_WINDOW_PROCESS_NAMES\]/)
  assert.match(store, /updateGameWindowProcessNames/)
  assert.match(store, /syncGameWindowProcessNames/)
  const startupDpiSync = runtime.indexOf("settleSubsystem('dpi'")
  assert.ok(runtime.indexOf('await settingsStore.syncGameWindowTitles()') < startupDpiSync)
  assert.ok(runtime.indexOf('await settingsStore.syncGameWindowProcessNames()') < startupDpiSync)
  assert.match(view, /<GameWindowTitleSettings/)
  assert.match(editor, /draggable="true"/)
  assert.match(editor, /processDrafts/)
  assert.match(editor, /addProcessName/)
  assert.match(editor, /removeProcessName/)
  assert.match(editor, /commitProcessNames/)
  assert.match(editor, /dropTitle\(index\)/)
  assert.match(editor, /addTitle/)
  assert.match(editor, /removeTitle\(index\)/)
  assert.match(editor, /drafts\.value = previous/)
})

test('IPC 与全部 Python 窗口识别脚本接入同一热更新契约', () => {
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const systemIpc = source('../electron/modules/ipc/system.js')
  assert.match(preload, /system-update-game-window-titles/)
  assert.match(preload, /system-update-game-window-process-names/)
  assert.match(api, /updateGameWindowTitles/)
  assert.match(api, /updateGameWindowProcessNames/)
  assert.match(systemIpc, /gameWindowTitles\.update\(titles\)/)
  assert.match(systemIpc, /gameWindowTitles\.updateProcessNames\(processNames\)/)

  const scripts = [
    'crafting_template.py',
    'map_rolling_template.py',
    'combat_assist_template.py',
    'bag_auto_stash_template.py',
    'chaos_recipe_pick_template.py',
    'stash_pickup_template.py',
    'puzzle_analyzer.py',
    'stash_tab_selector.py',
    'foreground_watcher.py',
    'faustus_market_repricing.py'
  ].map(name => source(`../src/assets/scripts/${name}`))

  for (const script of scripts) {
    assert.match(script, /POE_GAME_WINDOW_TITLES_FILE/)
    assert.match(script, /st_mtime_ns/)
    assert.match(script, /def game_window_title_priority/)
    assert.match(script, /def game_window_process_names/)
    assert.match(script, /def window_process_name/)
    assert.match(script, /def window_matches_game/)
    assert.match(script, /processNames/)
    assert.match(script, /_game_window_titles_cache = GAME_WINDOW_TITLES/)
    assert.doesNotMatch(script, /any\([^\n]*GAME_WINDOW_TITLES/)
  }
  for (const script of scripts.slice(0, 7).filter(text => text.includes('def find_game_window') || text.includes('get_game_client_bounds'))) {
    assert.match(script, /priority = game_window_title_priority/)
    assert.match(script, /sort\(key=/)
  }
})
})()

// === Merged from loadAwarePublisher.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const EventEmitter = _m3_EventEmitter
  const createLoadAwarePublisher = _m3_createLoadAwarePublisher
class LoadingContents extends EventEmitter {
  constructor() {
    super()
    this.loading = true
    this.destroyed = false
  }

  isLoadingMainFrame() { return this.loading }
  isDestroyed() { return this.destroyed }
}

test('加载期间高频发布只注册一个 did-finish-load 并发送最新状态', () => {
  const contents = new LoadingContents()
  const publisher = createLoadAwarePublisher()
  const sent = []

  for (let index = 0; index < 20; index += 1) {
    publisher.publish(contents, () => sent.push(index))
  }

  assert.equal(contents.listenerCount('did-finish-load'), 1)
  assert.deepEqual(sent, [])
  contents.loading = false
  contents.emit('did-finish-load')
  assert.deepEqual(sent, [19])
  assert.equal(contents.listenerCount('did-finish-load'), 0)
  assert.equal(contents.listenerCount('destroyed'), 0)
})

test('窗口销毁或替换时清理旧加载监听器', () => {
  const first = new LoadingContents()
  const second = new LoadingContents()
  const publisher = createLoadAwarePublisher()

  publisher.publish(first, () => {})
  publisher.publish(second, () => {})
  assert.equal(first.listenerCount('did-finish-load'), 0)
  assert.equal(first.listenerCount('destroyed'), 0)
  assert.equal(second.listenerCount('did-finish-load'), 1)

  second.destroyed = true
  second.emit('destroyed')
  assert.equal(second.listenerCount('did-finish-load'), 0)
  publisher.dispose()
})
})()

// === Merged from mainWindowStartupVisibility.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const readFileSync = _m4_readFileSync
  const EventEmitter = _m4_EventEmitter
  const vm = _m4_vm
  const path = _m4_path
const source = readFileSync(new URL('../electron/modules/window/manager.js', import.meta.url), 'utf8')
const createSource = source.slice(source.indexOf('export function createMainWindow('), source.indexOf('export function createOverlayWindow(')).replace('export function', 'function')

function setup(state, { bounds = { x: 10, y: 10, width: 1200, height: 800 }, minimized = false } = {}) {
  const calls = [], saved = []
  let createdOptions = null
  const setSizeCalls = []
  class Window extends EventEmitter {
    constructor(options) {
      super()
      createdOptions = options
      this.visible = options.show !== false
      this.minimized = minimized
      this.bounds = { ...bounds }
      this.webContents = new EventEmitter()
      this.webContents.send = () => {}
    }
    isDestroyed() { return !!this.destroyed }
    show() { calls.push('show'); this.visible = true }
    maximize() { calls.push('maximize'); this.visible = true; this.maximized = true; this.emit('maximize') }
    setFullScreen(value) { calls.push('fullscreen'); this.fullscreen = value; this.emit('enter-full-screen') }
    setAlwaysOnTop(value) { this.alwaysOnTop = value }
    isMinimized() { return !!this.minimized }
    isMaximized() { return !!this.maximized }
    isFullScreen() { return !!this.fullscreen }
    isAlwaysOnTop() { return !!this.alwaysOnTop }
    getBounds() { return { ...this.bounds } }
    setSize(width, height) {
      setSizeCalls.push([width, height])
      this.bounds = { ...this.bounds, width, height }
    }
    loadURL() { calls.push('load') }
  }
  const context = vm.createContext({
    BrowserWindow: Window, mainWindow: null, path, __dirname: '.',
    loadWindowState: () => state, saveWindowState: value => saved.push(value),
    nativeImage: { createFromPath: () => ({ isEmpty: () => true }) },
    process: { env: { NODE_ENV: 'development', VITE_DEV_SERVER_URL: 'http://localhost:3000' } },
    setTimeout: (fn) => { fn(); return 1 }, clearTimeout: () => {}
  })
  const window = vm.runInContext(`${createSource}\ncreateMainWindow()`, context)
  return { window, calls, saved, createdOptions, setSizeCalls }
}

for (const state of [{}, { isMaximized: true }, { isFullScreen: true }, { isMaximized: true, isFullScreen: true }]) {
  test(`首帧之前保持隐藏，之后恢复窗口状态 ${JSON.stringify(state)}`, () => {
    const { window, calls, saved } = setup({ ...state, alwaysOnTop: true })
    assert.equal(window.visible, false)
    assert.deepEqual(calls, ['load'])
    window.emit('ready-to-show')
    assert.deepEqual(calls, ['load', ...(state.isMaximized ? ['maximize'] : []), ...(state.isFullScreen ? ['fullscreen'] : []), 'show'])
    assert.equal(window.visible, true)
    assert.equal(window.isMaximized(), !!state.isMaximized)
    assert.equal(window.isFullScreen(), !!state.isFullScreen)
    assert.equal(window.isAlwaysOnTop(), true)
    if (saved.length) {
      assert.equal(saved.at(-1).isMaximized, !!state.isMaximized)
      assert.equal(saved.at(-1).isFullScreen, !!state.isFullScreen)
    }
    const count = calls.length
    window.emit('ready-to-show')
    assert.equal(calls.length, count)
  })
}

test('首帧前销毁的窗口不恢复状态也不显示', () => {
  const { window, calls } = setup({ isMaximized: true, isFullScreen: true })
  window.destroyed = true
  window.emit('ready-to-show')
  assert.deepEqual(calls, ['load'])
  assert.equal(window.visible, false)
})

test('主窗口强制最小尺寸并修复异常过小的历史状态', () => {
  const { createdOptions } = setup({ width: 212, height: 162, isMaximized: true })
  assert.equal(createdOptions.minWidth, 800)
  assert.equal(createdOptions.minHeight, 600)
  assert.equal(createdOptions.width, 1200)
  assert.equal(createdOptions.height, 800)
})

test('主窗口最小化或尺寸异常偏小时不覆盖保存的恢复尺寸', () => {
  const { window, saved } = setup({ width: 1280, height: 860 }, { bounds: { x: 100, y: 100, width: 212, height: 162 }, minimized: true })
  window.emit('resize')
  assert.equal(saved.length, 0)

  window.minimized = false
  window.emit('resize')
  assert.equal(saved.length, 1)
  assert.equal(saved[0].width, undefined)
  assert.equal(saved[0].height, undefined)

  window.bounds = { x: 120, y: 120, width: 1280, height: 860 }
  window.emit('move')
  assert.equal(saved.length, 2)
  assert.equal(saved[1].width, 1280)
  assert.equal(saved[1].height, 860)
})

test('取消最大化若恢复到异常过小尺寸会兜底重置为默认尺寸', () => {
  const { window, setSizeCalls, saved } = setup({ isMaximized: true }, { bounds: { x: 200, y: 150, width: 212, height: 162 } })
  window.emit('unmaximize')
  assert.deepEqual(setSizeCalls, [[1200, 800]])
  assert.equal(saved.at(-1).width, 1200)
  assert.equal(saved.at(-1).height, 800)
})
})()

// === Merged from overlayBackground.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const addOverlayBackgroundHistory = _m5_addOverlayBackgroundHistory
  const OVERLAY_BACKGROUND_MODES = _m5_OVERLAY_BACKGROUND_MODES
  const isSupportedOverlayBackground = _m5_isSupportedOverlayBackground
  const normalizeOverlaySettings = _m5_normalizeOverlaySettings
  const overlayBackgroundMedia = _m5_overlayBackgroundMedia
  const resolveOverlayBackgroundDrop = _m5_resolveOverlayBackgroundDrop
test('旧覆盖层背景设置会迁移为显式模式', () => {
  assert.equal(normalizeOverlaySettings({ backgroundPath: 'C:\\bg.webp' }).backgroundMode, OVERLAY_BACKGROUND_MODES.custom)
  assert.equal(normalizeOverlaySettings({ backgroundPath: '' }).backgroundMode, OVERLAY_BACKGROUND_MODES.default)
})

test('无背景和默认背景不保留无效的自定义路径', () => {
  assert.deepEqual(
    normalizeOverlaySettings({ backgroundMode: 'none', backgroundPath: 'C:\\old.png', blur: 2, maskOpacity: 0.3 }),
    { backgroundMode: 'none', backgroundPath: '', blur: 2, maskOpacity: 0.3 }
  )
  assert.equal(normalizeOverlaySettings({ backgroundMode: 'custom', backgroundPath: '' }).backgroundMode, 'default')
})

test('背景媒体决策区分默认、无背景、图片和视频', () => {
  assert.equal(overlayBackgroundMedia({ backgroundMode: 'default' }), 'default')
  assert.equal(overlayBackgroundMedia({ backgroundMode: 'none' }), 'none')
  assert.equal(overlayBackgroundMedia({ backgroundMode: 'custom', backgroundPath: 'D:\\bg.PNG' }), 'image')
  assert.equal(overlayBackgroundMedia({ backgroundMode: 'custom', backgroundPath: 'D:\\bg.webm' }), 'video')
})

test('背景格式白名单与文件选择器保持一致', () => {
  for (const extension of ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg', 'mov']) {
    assert.equal(isSupportedOverlayBackground(`background.${extension}`), true)
  }
  assert.equal(isSupportedOverlayBackground('background.svg'), false)
  assert.equal(isSupportedOverlayBackground('background.png.exe'), false)
})

test('历史记录只添加自定义路径、去重置顶并限制六项', () => {
  const original = Array.from({ length: 6 }, (_, index) => ({ path: `${index}.png` }))
  assert.deepEqual(addOverlayBackgroundHistory(original, ''), original)
  assert.deepEqual(addOverlayBackgroundHistory(original, '2.png')[0], { path: '2.png' })
  const next = addOverlayBackgroundHistory(original, 'new.png')
  assert.equal(next.length, 6)
  assert.equal(next[0].path, 'new.png')
  assert.equal(next.some(item => item.path === '5.png'), false)
})

test('拖拽解析拒绝多文件和无本地路径', () => {
  assert.equal(resolveOverlayBackgroundDrop([], () => '').error.code, 'BACKGROUND_FILE_COUNT')
  assert.equal(resolveOverlayBackgroundDrop([{}, {}], () => '').error.code, 'BACKGROUND_FILE_COUNT')
  assert.equal(resolveOverlayBackgroundDrop([{}], () => '').error.code, 'BACKGROUND_PATH_REQUIRED')
  assert.deepEqual(resolveOverlayBackgroundDrop([{ name: 'bg.png' }], () => 'C:\\bg.png'), {
    success: true,
    sourcePath: 'C:\\bg.png'
  })
})
})()

// === Merged from overlayBackgroundElectron.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const readFileSync = _m6_readFileSync
const source = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('选择和拖拽背景共用主进程导入边界', () => {
  const ipc = source('../electron/modules/ipc/window.js')
  assert.match(ipc, /select-overlay-background/)
  assert.match(ipc, /import-overlay-background/)
  assert.match(ipc, /importBackground\(result\.filePaths\[0\]\)/)
  assert.match(ipc, /import-overlay-background', \(_event, sourcePath\) => importBackground\(sourcePath\)/)
})

test('preload 仅通过 webUtils 解析拖入文件并移除旧孤立接口', () => {
  const preload = source('../electron/preload.cjs')
  const rendererApi = source('../src/api/electron.js')

  assert.match(preload, /webUtils\.getPathForFile\(file\)/)
  assert.match(preload, /selectOverlayBackground/)
  assert.match(preload, /importOverlayBackground/)
  assert.doesNotMatch(preload, /copyFileToProject|copy-file-to-project/)
  assert.doesNotMatch(rendererApi, /copyFileToProject|copy-file-to-project/)
})
})()

// === Merged from overlayBackgroundImport.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const fs = _m7_fs
  const os = _m7_os
  const path = _m7_path
  const importOverlayBackground = _m7_importOverlayBackground
  const OverlayBackgroundImportError = _m7_OverlayBackgroundImportError
function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'overlay-background-test-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  return directory
}

test('背景导入会复制到 userData/backgrounds', (t) => {
  const root = temporaryDirectory(t)
  const source = path.join(root, 'personal.PNG')
  fs.writeFileSync(source, 'image')

  const result = importOverlayBackground(source, { userDataPath: path.join(root, 'profile'), now: () => 123 })

  assert.equal(result.success, true)
  assert.equal(result.filePath, path.join(root, 'profile', 'backgrounds', 'personal_123.png'))
  assert.equal(fs.readFileSync(result.filePath, 'utf8'), 'image')
})

test('背景导入拒绝空路径、不支持格式和文件夹', (t) => {
  const root = temporaryDirectory(t)
  const directoryWithImageExtension = path.join(root, 'folder.png')
  fs.mkdirSync(directoryWithImageExtension)

  assert.throws(
    () => importOverlayBackground('', { userDataPath: root }),
    (error) => error instanceof OverlayBackgroundImportError && error.code === 'BACKGROUND_PATH_REQUIRED'
  )
  assert.throws(
    () => importOverlayBackground(path.join(root, 'background.png'), { userDataPath: '' }),
    (error) => error.code === 'BACKGROUND_STORAGE_UNAVAILABLE'
  )
  assert.throws(
    () => importOverlayBackground(path.join(root, 'background.svg'), { userDataPath: root }),
    (error) => error.code === 'BACKGROUND_FORMAT_UNSUPPORTED'
  )
  assert.throws(
    () => importOverlayBackground(directoryWithImageExtension, { userDataPath: root }),
    (error) => error.code === 'BACKGROUND_FILE_REQUIRED'
  )
})

test('复制失败时不会返回原始个人文件路径作为可用背景', () => {
  const fileSystem = {
    statSync: () => ({ isFile: () => true }),
    mkdirSync: () => {},
    copyFileSync: () => { throw new Error('denied') }
  }

  assert.throws(
    () => importOverlayBackground('C:\\personal\\background.webp', { userDataPath: 'C:\\profile', fileSystem }),
    (error) => error.code === 'BACKGROUND_COPY_FAILED'
  )
})
})()

// === Merged from overlayDrag.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const fs = _m8_fs
  const OverlayDragPassthroughController = _m8_OverlayDragPassthroughController
  const getFixedOverlayDragBounds = _m8_getFixedOverlayDragBounds
function source(path) {
  return fs.readFileSync(new URL(path, import.meta.url), 'utf8')
}

test('穿透控制器仅在命中状态实际改变时切换鼠标穿透', () => {
  const calls = []
  let cursor = { x: 10, y: 10 }
  const window = {
    isDestroyed: () => false,
    getBounds: () => ({ x: 0, y: 0, width: 300, height: 400 }),
    setIgnoreMouseEvents: (...args) => calls.push(args)
  }
  const controller = new OverlayDragPassthroughController({
    getWindow: () => window,
    getCursorPoint: () => cursor,
    isPointInHandle: (point) => point.x >= 114 && point.x < 186 && point.y < 24
  })

  controller.sync()
  controller.sync()
  assert.deepEqual(calls, [[true, { forward: true }]])

  cursor = { x: 150, y: 10 }
  controller.sync()
  controller.sync()
  assert.deepEqual(calls.at(-1), [false, { forward: true }])
  assert.equal(calls.length, 2)

  controller.setDragging(true)
  controller.setDragging(false)
  assert.equal(calls.length, 2)

  cursor = { x: 10, y: 10 }
  controller.setEnabled(false)
  assert.equal(calls.length, 2)
  controller.setEnabled(true)
  assert.deepEqual(calls.at(-1), [true, { forward: true }])
})

test('统一拖动边界保留规范尺寸并限制在当前屏幕工作区', () => {
  const workArea = { x: -200, y: 20, width: 800, height: 600 }
  const size = { width: 300, height: 400 }
  assert.deepEqual(getFixedOverlayDragBounds({ x: 999, y: -100 }, workArea, size), {
    x: 300, y: 20, width: 300, height: 400
  })
})

test('可穿透浮窗共享 Pointer Capture 协议，原生标题栏明确显示抓手光标', () => {
  for (const path of [
    '../src/domains/overlay/components/OverlayContent.vue',
    '../src/domains/bag/BagStashOverlayView.vue',
    '../src/domains/shop/ChaosRecipeControlOverlayView.vue',
    '../src/domains/story/StoryOverlayView.vue'
  ]) {
    const view = source(path)
    assert.match(view, /createOverlayDrag/)
    assert.match(view, /@pointerdown="drag\.pointerDown"/)
    assert.match(view, /cursor: grab/)
    assert.match(view, /cursor: grabbing/)
  }

  const priceCheck = source('../src/domains/priceCheck/PriceCheckOverlayView.vue')
  assert.match(priceCheck, /\.topbar \{[^}]*cursor: grab;[^}]*-webkit-app-region: drag;/)
  assert.match(priceCheck, /\.topbar:active \{ cursor: grabbing; \}/)
})

test('制作进度浮窗通过独立会话移动且不再依赖悬停启停拖动', () => {
  const view = source('../src/domains/overlay/components/OverlayContent.vue')
  const ipc = source('../electron/modules/ipc/window.js')
  const manager = source('../electron/modules/window/manager.js')
  assert.doesNotMatch(view, /activateDragHandle|deactivateDragHandle/)
  assert.match(ipc, /const craftingOverlayDrag = new OverlayDragSession\(\)/)
  assert.match(ipc, /ipcMain\.on\('crafting-overlay-move'/)
  assert.match(manager, /export function moveCraftingOverlayTo/)
  assert.match(manager, /getFixedOverlayDragBounds\(point, display\.workArea, CRAFTING_OVERLAY_SIZE\)/)
})

test('制作进度浮窗为顶部抓手预留内容空间', () => {
  const view = source('../src/domains/overlay/components/OverlayContent.vue')
  assert.match(view, /:class="\{[^}]*'has-drag-handle': allowDrag[^}]*\}"/)
  assert.match(view, /\.overlay-container\.has-drag-handle\s*\{[^}]*padding-top:\s*calc\(24px \+ var\(--overlay-space-1\)\)/s)
})
})()

// === Merged from overlayOutsideClickClose.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const EventEmitter = _m9_EventEmitter
  const createOverlayOutsideClickCloser = _m9_createOverlayOutsideClickCloser
  const isPointInsideBounds = _m9_isPointInsideBounds
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
})()

// === Merged from screenRegionPicker.test.js ===
await (async () => {
  const test = _m10_test
  const assert = _m10_assert
  const fs = _m10_fs
  const os = _m10_os
  const path = _m10_path
  const readFileSync = _m10_readFileSync
  const clampRectangle = _m10_clampRectangle
  const dipRectangleToPhysical = _m10_dipRectangleToPhysical
  const expandSearchRegion = _m10_expandSearchRegion
  const getDisplayPhysicalBounds = _m10_getDisplayPhysicalBounds
  const hasUsefulPixelVariance = _m10_hasUsefulPixelVariance
  const isRegionLargeEnough = _m10_isRegionLargeEnough
  const normalizeRectangle = _m10_normalizeRectangle
  const physicalRectangleToDipBounds = _m10_physicalRectangleToDipBounds
  const physicalRectangleToImageCrop = _m10_physicalRectangleToImageCrop
  const resolveCaptureSources = _m10_resolveCaptureSources
  const assertBagTemplateTarget = _m10_assertBagTemplateTarget
  const resolveTemplateFileName = _m10_resolveTemplateFileName
  const savePngAtomically = _m10_savePngAtomically
  const normalizeBagSettings = _m10_normalizeBagSettings
  const resolveCaptureDisplay = _m10_resolveCaptureDisplay
  const validateTemplateCaptureEnvironment = _m10_validateTemplateCaptureEnvironment
test('遮罩物理矩形一次转换为整数 DIP 边界', () => {
  let received = null
  const converted = physicalRectangleToDipBounds(
    { left: 1472, top: 656, right: 2289, bottom: 1482 },
    'win32',
    rectangle => {
      received = rectangle
      return { x: 981.333, y: 437.333, width: 544.667, height: 550.667 }
    }
  )
  assert.deepEqual(received, { x: 1472, y: 656, width: 817, height: 826 })
  assert.deepEqual(converted, { x: 981, y: 437, width: 545, height: 551 })
  assert.ok(Object.values(converted).every(Number.isInteger))
})

test('选区支持反向规范化、负坐标边界裁剪与最小 20×10 尺寸', () => {
  assert.deepEqual(normalizeRectangle({ x: 40, y: 30 }, { x: -20, y: 5 }), {
    left: -20, top: 5, right: 40, bottom: 30
  })
  assert.deepEqual(clampRectangle({ left: -600, top: -20, right: 100, bottom: 400 }, {
    x: -500, y: 0, width: 500, height: 300
  }), { left: -500, top: 0, right: 0, bottom: 300 })
  assert.equal(isRegionLargeEnough({ left: 0, top: 0, right: 20, bottom: 10 }), true)
  assert.equal(isRegionLargeEnough({ left: 0, top: 0, right: 19, bottom: 10 }), false)
})

test('混合 DPI 换算只使用选区窗口所在显示器并保留负物理坐标', () => {
  const converted = dipRectangleToPhysical(
    { x: -1280, y: 100 },
    { left: 10, top: 20, right: 110, bottom: 70 },
    (point) => ({ x: Math.round(point.x * 1.5), y: Math.round(point.y * 1.5) })
  )
  assert.deepEqual(converted, { left: -1905, top: 180, right: -1755, bottom: 255 })
  assert.deepEqual(getDisplayPhysicalBounds({
    bounds: { x: -1280, y: 0, width: 1280, height: 720 }, scaleFactor: 1.5
  }, 'win32', (point) => ({ x: Math.round(point.x * 1.5), y: Math.round(point.y * 1.5) })), {
    x: -1920, y: 0, width: 1920, height: 1080
  })
})

test('搜索区域四周扩展 12 物理像素并裁剪到显示器边界', () => {
  assert.deepEqual(expandSearchRegion(
    { left: -495, top: 10, right: -420, bottom: 40 },
    { x: -500, y: 0, width: 500, height: 300 }
  ), { left: -500, top: 0, right: -408, bottom: 52 })
})

test('截图 thumbnail 比例换算后仍指定物理选区为目标尺寸', () => {
  assert.deepEqual(physicalRectangleToImageCrop(
    { left: 100, top: 50, right: 300, bottom: 150 },
    { x: 0, y: 0, width: 1920, height: 1080 },
    { width: 960, height: 540 }
  ), { x: 50, y: 25, width: 100, height: 50, targetSize: { width: 200, height: 100 } })
})

test('空图与低信息像素会被拒绝', () => {
  assert.equal(hasUsefulPixelVariance(Buffer.alloc(0)), false)
  assert.equal(hasUsefulPixelVariance(Buffer.alloc(400, 60)), false)
  const varied = Buffer.alloc(400, 20)
  varied[200] = 100
  assert.equal(hasUsefulPixelVariance(varied), true)
})

test('截图源优先按显示器 id 匹配且仅在单屏单源时安全回退', () => {
  const image = { isEmpty: () => false }
  const exact = resolveCaptureSources(
    [{ id: 1 }, { id: 2 }],
    [{ display_id: '2', thumbnail: image }, { display_id: '1', thumbnail: image }]
  )
  assert.equal(exact.get('1').display_id, '1')
  assert.equal(exact.get('2').display_id, '2')

  const fallback = resolveCaptureSources(
    [{ id: 2020828493 }],
    [{ display_id: '', thumbnail: image }]
  )
  assert.equal(fallback.get('2020828493').display_id, '')

  assert.throws(() => resolveCaptureSources(
    [{ id: 1 }],
    [{ display_id: '1', thumbnail: { isEmpty: () => true } }]
  ), error => error.code === 'CAPTURE_SOURCE_NOT_FOUND' && error.details.usableSourceCount === 0)
  assert.throws(() => resolveCaptureSources(
    [{ id: 1 }, { id: 2 }],
    [{ display_id: '', thumbnail: image }, { display_id: '', thumbnail: image }]
  ), error => error.code === 'CAPTURE_SOURCE_NOT_FOUND' && error.details.displayCount === 2)
})

test('标题框选使用当前 nativeImage 位图接口，不触发 getBitmap 弃用警告', () => {
  const manager = readFileSync(new URL('../electron/modules/window/manager.js', import.meta.url), 'utf8')
  assert.doesNotMatch(manager, /\.getBitmap\(\)/)
  assert.match(manager, /hasUsefulPixelVariance\(template\.toBitmap\(\)\)/)
})

test('模板保存只接受白名单目标，并在替换失败时恢复旧文件', () => {
  assert.equal(assertBagTemplateTarget('stashTitle'), 'stash_title.png')
  assert.equal(assertBagTemplateTarget('stashTitle', true), 'stash_title.png')
  assert.throws(() => assertBagTemplateTarget('../../evil'), /不支持的模板目标/)
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bag-template-'))
  const target = path.join(directory, 'stash_title.png')
  fs.writeFileSync(target, 'old')
  let temporaryRenameFailed = false
  const failingFs = {
    ...fs,
    renameSync(source, destination) {
      if (source.endsWith('.tmp') && destination === target) {
        temporaryRenameFailed = true
        throw new Error('simulated replace failure')
      }
      return fs.renameSync(source, destination)
    }
  }
  try {
    assert.throws(() => savePngAtomically(directory, 'stashTitle', Buffer.from('new'), failingFs), /simulated/)
    assert.equal(temporaryRenameFailed, true)
    assert.equal(fs.readFileSync(target, 'utf8'), 'old')
    assert.equal(fs.readdirSync(directory).some((name) => name.endsWith('.tmp') || name.endsWith('.bak')), false)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

test('模板文件名按运行模式隔离：安装版固定名，开发版追加 .dev 后缀且不覆盖安装版文件', () => {
  assert.equal(resolveTemplateFileName('stash_title.png', true), 'stash_title.png')
  assert.equal(resolveTemplateFileName('stash_title.png', false), 'stash_title.dev.png')
  assert.equal(assertBagTemplateTarget('inventoryTitle', false), 'inventory_title.dev.png')
  assert.equal(assertBagTemplateTarget('junfengRewardTitle', false), 'junfeng_reward_title.dev.png')
  assert.equal(assertBagTemplateTarget('allflameReceiverTitle', false), 'allflame_receiver_title.dev.png')
  assert.throws(() => assertBagTemplateTarget('../../evil', false), /不支持的模板目标/)
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bag-template-mode-'))
  try {
    const packagedTarget = path.join(directory, 'stash_title.png')
    fs.writeFileSync(packagedTarget, 'packaged')
    const savedPath = savePngAtomically(directory, 'stashTitle', Buffer.from('dev'), fs, false)
    assert.equal(path.basename(savedPath), 'stash_title.dev.png')
    assert.equal(fs.readFileSync(packagedTarget, 'utf8'), 'packaged')
    assert.equal(fs.readFileSync(savedPath, 'utf8'), 'dev')
    assert.equal(fs.readdirSync(directory).some((name) => name.endsWith('.tmp') || name.endsWith('.bak')), false)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

test('当前采集元数据可校验环境变化与区域尺寸，缺少元数据时返回中性提示', () => {
  const metadata = {
    displayId: '2', scaleFactor: 1.5,
    displayPhysicalSize: { width: 1920, height: 1080 },
    templateSize: { width: 120, height: 30 },
    selectedRegion: { left: -500, top: 20, right: -380, bottom: 50 },
    capturedAt: '2026-07-21T00:00:00.000Z'
  }
  const settings = normalizeBagSettings({ templates: { stashTitle: 's.png', stashCapture: metadata } })
  assert.deepEqual(settings.templates.stashCapture, metadata)
  assert.deepEqual(validateTemplateCaptureEnvironment('仓库标题', 's.png', settings.templates.stashRegion, null, []), {
    error: '', warning: '仓库标题缺少采集环境信息，无法校验采集显示环境'
  })
  assert.match(validateTemplateCaptureEnvironment('仓库标题', 's.png', { left: 0, top: 0, right: 100, bottom: 20 }, metadata, [
    { id: '2', scaleFactor: 1.5, physicalSize: { width: 1920, height: 1080 } }
  ]).error, /小于模板尺寸/)
  assert.match(validateTemplateCaptureEnvironment('仓库标题', 's.png', { left: 0, top: 0, right: 200, bottom: 100 }, metadata, [
    { id: '2', scaleFactor: 1.25, physicalSize: { width: 1920, height: 1080 } }
  ]).error, /显示环境已变化/)
})

test('显示器 id 在重启后变化时通过物理环境与采集区域恢复匹配', () => {
  const metadata = {
    displayId: 'old-id', scaleFactor: 1.5,
    displayPhysicalSize: { width: 1920, height: 1080 },
    templateSize: { width: 120, height: 30 },
    selectedRegion: { left: -500, top: 20, right: -380, bottom: 50 },
    capturedAt: '2026-07-21T00:00:00.000Z'
  }
  const region = { left: -512, top: 8, right: -368, bottom: 62 }
  const displays = [{
    id: 'new-id', scaleFactor: 1.5,
    physicalSize: { width: 1920, height: 1080 },
    physicalBounds: { x: -1920, y: 0, width: 1920, height: 1080 }
  }]

  assert.deepEqual(validateTemplateCaptureEnvironment('仓库标题', 's.png', region, metadata, displays), {
    error: '', warning: ''
  })
})

test('共享显示器解析默认保持严格 DPI 比较并允许调用方指定容差', () => {
  const metadata = {
    displayId: 'old-id', scaleFactor: 1.5,
    displayPhysicalSize: { width: 1920, height: 1080 },
    selectedRegion: { left: -500, top: 20, right: -380, bottom: 50 }
  }
  const display = {
    id: 'new-id', scaleFactor: 1.505,
    physicalSize: { width: 1920, height: 1080 },
    physicalBounds: { x: -1920, y: 0, width: 1920, height: 1080 }
  }

  assert.equal(resolveCaptureDisplay(metadata, [display]), null)
  assert.equal(resolveCaptureDisplay(metadata, [display], 0.01), display)
})

test('显示器 id 交换后选择参数兼容且包含原采集区域的显示器', () => {
  const metadata = {
    displayId: '2', scaleFactor: 1.5,
    displayPhysicalSize: { width: 1920, height: 1080 },
    templateSize: { width: 120, height: 30 },
    selectedRegion: { left: -500, top: 20, right: -380, bottom: 50 },
    capturedAt: '2026-07-21T00:00:00.000Z'
  }
  const displays = [
    {
      id: '2', scaleFactor: 1.5,
      physicalSize: { width: 1920, height: 1080 },
      physicalBounds: { x: 0, y: 0, width: 1920, height: 1080 }
    },
    {
      id: '3', scaleFactor: 1.5,
      physicalSize: { width: 1920, height: 1080 },
      physicalBounds: { x: -1920, y: 0, width: 1920, height: 1080 }
    }
  ]

  assert.equal(validateTemplateCaptureEnvironment(
    '仓库标题', 's.png', { left: -512, top: 8, right: -368, bottom: 62 }, metadata, displays
  ).error, '')
})

test('多个兼容显示器无法由采集区域唯一确定时拒绝启动', () => {
  const metadata = {
    displayId: 'old-id', scaleFactor: 1,
    displayPhysicalSize: { width: 1920, height: 1080 },
    templateSize: { width: 120, height: 30 },
    selectedRegion: { left: 100, top: 20, right: 220, bottom: 50 },
    capturedAt: '2026-07-21T00:00:00.000Z'
  }
  const compatible = { scaleFactor: 1, physicalSize: { width: 1920, height: 1080 } }
  const result = validateTemplateCaptureEnvironment(
    '仓库标题', 's.png', { left: 88, top: 8, right: 232, bottom: 62 }, metadata,
    [{ id: '3', ...compatible }, { id: '4', ...compatible }]
  )

  assert.match(result.error, /采集显示器已不存在/)
})

test('非整数缩放产生 1-2px 物理尺寸舍入误差时仍匹配原显示器，且仅缩放变化时提示显示环境已变化', () => {
  const roundedMetadata = {
    displayId: 'old-id', scaleFactor: 1.75,
    displayPhysicalSize: { width: 3840, height: 2160 },
    templateSize: { width: 161, height: 89 },
    selectedRegion: { left: 546, top: 56, right: 707, bottom: 145 },
    capturedAt: '2026-11-21T12:52:38.864Z'
  }
  const roundedDisplays = [{
    id: 'new-id', scaleFactor: 1.75,
    physicalSize: { width: 3841, height: 2161 },
    physicalBounds: { x: 0, y: 0, width: 3841, height: 2161 }
  }]
  assert.deepEqual(
    validateTemplateCaptureEnvironment('仓库标题', 's.png', { left: 534, top: 44, right: 719, bottom: 157 }, roundedMetadata, roundedDisplays),
    { error: '', warning: '' }
  )

  const scaledMetadata = {
    displayId: 'old-id', scaleFactor: 1.5,
    displayPhysicalSize: { width: 3840, height: 2160 },
    templateSize: { width: 132, height: 89 },
    selectedRegion: { left: 572, top: 51, right: 704, bottom: 140 },
    capturedAt: '2026-08-29T07:17:16.731Z'
  }
  const changedDisplays = [
    {
      id: 'new-primary', scaleFactor: 1.75,
      physicalSize: { width: 3841, height: 2161 },
      physicalBounds: { x: 0, y: 0, width: 3841, height: 2161 }
    },
    {
      id: 'new-secondary', scaleFactor: 1.5,
      physicalSize: { width: 3840, height: 2160 },
      physicalBounds: { x: 3840, y: 0, width: 3840, height: 2160 }
    }
  ]
  const changedResult = validateTemplateCaptureEnvironment(
    '仓库标题', 's.png', { left: 560, top: 39, right: 716, bottom: 152 }, scaledMetadata, changedDisplays
  )
  assert.match(changedResult.error, /显示环境已变化（缩放 150% → 175%）/)
})

test('point/region 共用互斥会话并对关闭、取消、加载失败统一单次结算', () => {
  const manager = readFileSync(new URL('../electron/modules/window/manager.js', import.meta.url), 'utf8')
  assert.match(manager, /let screenPickerSession = null/)
  assert.match(manager, /if \(!session \|\| session\.settled\) return/)
  assert.match(manager, /session\.mode !== 'point'/)
  assert.match(manager, /session\.mode !== 'region'/)
  assert.match(manager, /did-fail-load[\s\S]*settleScreenPicker/)
  assert.match(manager, /pickerWindow\.on\('closed'[\s\S]*settleScreenPicker/)
  assert.match(manager, /session\.screenshots\.clear\(\)/)
  assert.match(manager, /selectedSize\.width < minimumSize\.width/)
})

test('区域选框的确认按钮可点击且不会触发拖拽选区，并按功能展示对应提示与辅助网格', () => {
  const picker = readFileSync(new URL('../src/domains/settings/CoordinatePickerView.vue', import.meta.url), 'utf8')
  const faustusIpc = readFileSync(new URL('../electron/modules/ipc/faustus.js', import.meta.url), 'utf8')
  const junfengIpc = readFileSync(new URL('../electron/modules/ipc/junfeng.js', import.meta.url), 'utf8')
  const bagIpc = readFileSync(new URL('../electron/modules/ipc/bag.js', import.meta.url), 'utf8')
  assert.match(picker, /button[\s\S]*@pointerdown\.stop[\s\S]*@pointerup\.stop[\s\S]*@click\.stop="confirmRegion"/)
  assert.match(picker, /\.coordinate-picker__tip button \{[\s\S]*pointer-events: auto;/)
  assert.match(picker, /'faustus-grid': \{ columns: 12, rows: 12 \}/)
  assert.doesNotMatch(picker, /return '拖动框选标题模板'/)
  assert.match(faustusIpc, /pickScreenRegion\(\{[\s\S]*purpose: 'faustus-grid'[\s\S]*12×12[\s\S]*columns: 12, rows: 12/)
  assert.match(junfengIpc, /pickScreenRegion\(\{[\s\S]*purpose: 'junfeng-grid'[\s\S]*columns: 12, rows: 11/)
  assert.match(bagIpc, /pickScreenRegion\(\{[\s\S]*purpose: `bag-template-\$\{type\}`[\s\S]*title: `框选\$\{label\}`/)
})

test('手工区域修改仍清除对应采集元数据', () => {
  const store = readFileSync(new URL('../src/stores/interfaceDetection.js', import.meta.url), 'utf8')
  assert.match(store, /function setTemplateRegion\([\s\S]*inventoryCapture[\s\S]*save\(\)/)
})
})()

// === Merged from singleInstance.test.js ===
await (async () => {
  const test = _m11_test
  const assert = _m11_assert
  const readFileSync = _m11_readFileSync
  const path = _m11_path
  const runInNewContext = _m11_runInNewContext
  const acquireCrossProcessInstanceLock = _m11_acquireCrossProcessInstanceLock
  const resolveUserDataPath = _m11_resolveUserDataPath
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
})()

// === Merged from userDataPath.test.js ===
await (async () => {
  const test = _m12_test
  const assert = _m12_assert
  const fs = _m12_fs
  const path = _m12_path
  const resolveUserDataPath = _m12_resolveUserDataPath
const source = (filePath) => fs.readFileSync(new URL(filePath, import.meta.url), 'utf8')

test('开发版与正式版使用唯一的流放助手数据目录', () => {
  assert.equal(
    resolveUserDataPath('C:\\Users\\A\\AppData\\Roaming'),
    path.join('C:\\Users\\A\\AppData\\Roaming', '流放助手')
  )
  const main = source('../electron/main.js')
  assert.ok(main.indexOf("app.setPath('userData'") < main.indexOf('app.whenReady()'))
})

test('应用不再暴露旧数据迁移或导入入口', () => {
  const main = source('../electron/main.js')
  const preload = source('../electron/preload.cjs')
  const rendererMain = source('../src/main.js')
  for (const contents of [main, preload, rendererMain]) {
    assert.doesNotMatch(contents, /legacy|recovered|migration|旧版页面数据/i)
  }
})
})()

// === Merged from windowActivation.test.js ===
await (async () => {
  const test = _m13_test
  const assert = _m13_assert
  const WINDOW_ACTIVATION_CODES = _m13_WINDOW_ACTIVATION_CODES
  const WindowActivationService = _m13_WindowActivationService
  const selectTrustedGameWindow = _m13_selectTrustedGameWindow
const registry = {
  getTitles: () => ['流放之路', 'Path of Exile'],
  getProcessNames: () => ['PathOfExile_x64.exe']
}

test('游戏候选必须同时匹配标题和进程，浏览器标题碰撞会被排除', () => {
  const selected = selectTrustedGameWindow([
    { title: '流放之路 - Microsoft Edge', processName: 'msedge.exe', area: 999999, foreground: true },
    { title: 'Path of Exile', processName: 'PathOfExile_x64.exe', area: 100 }
  ], registry.getTitles(), registry.getProcessNames())

  assert.equal(selected.processName, 'PathOfExile_x64.exe')
  assert.equal(selected.title, 'Path of Exile')
})

test('游戏候选依次按标题、非最小化、当前前台和可见面积排序', () => {
  const candidates = [
    { title: 'Path of Exile', processName: 'PathOfExile_x64.exe', area: 900, foreground: true },
    { title: '流放之路 A', processName: 'PathOfExile_x64.exe', area: 9999, minimized: true, foreground: true },
    { title: '流放之路 B', processName: 'PathOfExile_x64.exe', area: 100, foreground: true },
    { title: '流放之路 C', processName: 'PathOfExile_x64.exe', area: 1000 }
  ]
  assert.equal(selectTrustedGameWindow(candidates, registry.getTitles(), registry.getProcessNames()).title, '流放之路 B')
})

test('游戏激活映射稳定结果码并限制目标摘要', async () => {
  const service = new WindowActivationService({
    gameWindowRegistry: registry,
    platform: 'win32',
    pythonPathProvider: () => 'python.exe',
    activateWindowsGame: async () => ({
      success: true,
      code: WINDOW_ACTIVATION_CODES.GAME_ACTIVATED,
      target: { title: '流放之路'.repeat(30), processName: 'C:\\Games\\PathOfExile_x64.exe', handle: '123' }
    })
  })
  const result = await service.activateGame({ source: 'unit-test' })
  assert.equal(result.success, true)
  assert.equal(result.code, WINDOW_ACTIVATION_CODES.GAME_ACTIVATED)
  assert.equal(result.target.processName, 'PathOfExile_x64.exe')
  assert.ok(result.target.title.length <= 80)
  assert.equal('handle' in result.target, false)
})

test('游戏激活覆盖目标缺失、权限不一致、目标变化和系统拒绝', async () => {
  for (const code of [
    WINDOW_ACTIVATION_CODES.GAME_NOT_FOUND,
    WINDOW_ACTIVATION_CODES.PRIVILEGE_MISMATCH,
    WINDOW_ACTIVATION_CODES.TARGET_CHANGED,
    WINDOW_ACTIVATION_CODES.FOCUS_REFUSED
  ]) {
    const service = new WindowActivationService({
      gameWindowRegistry: registry,
      platform: 'win32',
      pythonPathProvider: () => 'python.exe',
      activateWindowsGame: async () => ({ success: false, code })
    })
    assert.deepEqual(await service.activateGame({ source: 'unit-test' }), { success: false, code })
  }
})

test('非 Windows 跳过 Win32 游戏激活', async () => {
  let called = false
  const service = new WindowActivationService({
    gameWindowRegistry: registry,
    platform: 'linux',
    activateWindowsGame: async () => { called = true }
  })
  assert.deepEqual(await service.activateGame({ source: 'unit-test' }), {
    success: true,
    code: WINDOW_ACTIVATION_CODES.PLATFORM_SKIPPED
  })
  assert.equal(called, false)
})

test('助手恢复覆盖已销毁、原生成功和 Electron 回退补偿', async () => {
  const destroyed = new WindowActivationService({
    getMainWindow: () => ({ isDestroyed: () => true })
  })
  assert.deepEqual(await destroyed.activateMain({ source: 'unit-test' }), {
    success: false,
    code: WINDOW_ACTIVATION_CODES.MAIN_UNAVAILABLE
  })

  const window = { isDestroyed: () => false }
  const nativeSuccess = new WindowActivationService({
    getMainWindow: () => window,
    restoreMainWindow: async (_window, options) => {
      assert.equal(await options.nativeFocusFn(window), true)
      return true
    },
    restoreWindowsMain: async () => true
  })
  assert.equal((await nativeSuccess.activateMain({ source: 'unit-test' })).code, WINDOW_ACTIVATION_CODES.MAIN_ACTIVATED)

  let fallbackCalled = false
  const fallback = new WindowActivationService({
    getMainWindow: () => window,
    restoreMainWindow: async (_window, options) => {
      assert.equal(await options.nativeFocusFn(window), false)
      fallbackCalled = true
      return true
    },
    restoreWindowsMain: async () => false
  })
  assert.equal((await fallback.activateMain({ source: 'unit-test' })).success, true)
  assert.equal(fallbackCalled, true)
})
})()
