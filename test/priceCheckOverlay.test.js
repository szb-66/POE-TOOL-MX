import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { PriceCheckOverlayPresentation } from '../electron/modules/priceCheck/presentation.js'
import {
  PRICE_CHECK_OVERLAY_CLOSE_REASONS,
  PriceCheckOverlayFocusSession,
  shouldRestoreGameFocus
} from '../electron/modules/priceCheck/overlayFocus.js'
import {
  getDefaultPriceCheckOverlaySize,
  normalizePriceCheckOverlaySize,
  PriceCheckOverlaySizeController,
  resolvePriceCheckOverlaySize
} from '../electron/modules/priceCheck/overlaySize.js'
import { createLoadAwarePublisher } from '../electron/modules/window/loadAwarePublisher.js'
import {
  activateWindowsGameWindow,
  WINDOW_ACTIVATION_CODES
} from '../electron/modules/window/activation.js'

// --- 1. Overlay boot & cold-start lifecycle ---
const overlaySource = readFileSync(new URL('../electron/modules/priceCheck/overlay.js', import.meta.url), 'utf8')
  .replace(/^import[\s\S]*?from ['"][^'"]+['"]\r?\n/gm, '')
  .replace(/^const moduleDir = .*$/m, '')
  .replace('export class', 'class')
  .replace(/^export \{[^}]+\}\s*$/gm, '')

function bootHarness() {
  const calls = []
  const window = {
    webContents: { send() {}, setBackgroundThrottling() {} }, isDestroyed: () => false,
    setOpacity: (value) => calls.push(['opacity', value]),
    setFocusable: (value) => calls.push(['focusable', value]),
    setIgnoreMouseEvents: (value) => calls.push(['ignoreMouse', value]),
    showInactive() {}, focus: () => calls.push(['focus'])
  }
  const Manager = vm.runInNewContext(`${overlaySource}\nPriceCheckOverlayManager`, {
    structuredClone, createLoadAwarePublisher, PriceCheckOverlayFocusSession, PRICE_CHECK_OVERLAY_CLOSE_REASONS,
    screen: { getCursorScreenPoint: () => ({ x: 0, y: 0 }), getDisplayNearestPoint: () => ({ workArea: {} }) }
  })
  const manager = new Manager({ sizeController: { flush() {} } })
  manager.window = window
  manager.ready = true
  manager.presentation = new PriceCheckOverlayPresentation(window)
  manager.ensureWindow = () => false
  manager.startCursorMonitor = () => {}
  const create = (status) => manager.create({ status }, { reposition: false })
  return { manager, window, calls, create }
}

test('冷启动HTML首帧先显示且不抢焦点，正式物品页面渲染后才恢复交互', () => {
  const { manager, window, calls, create } = bootHarness()
  create('loading')
  assert.deepEqual(calls.filter(([name]) => name === 'opacity'), [])
  assert.equal(manager.markLoadingReady({}), false)
  assert.equal(manager.markLoadingReady(window.webContents), true)
  assert.deepEqual(calls.at(-1), ['opacity', 1])
  assert.equal(calls.some(([name]) => name === 'focus'), false)
  assert.ok(manager.pendingShowCursor)
  manager.markRendered(window.webContents, manager.displayGeneration)
  assert.equal(manager.loadingRendered, false)
  assert.equal(manager.presentation.isInteractive(), true)
  assert.equal(calls.filter(([name]) => name === 'focus').length, 1)
})

test('预热仅准备静态占位，Vue挂载回执会清除冷启动占位且不提前显示窗口', () => {
  const { manager, window, calls, create } = bootHarness()
  manager.markLoadingReady(window.webContents)
  assert.deepEqual(calls, [])
  assert.equal(manager.markRendered(window.webContents, null), false)
  assert.equal(manager.rendererMounted, true)
  assert.equal(manager.loadingRendered, false)
  assert.deepEqual(calls, [])
  create('loading')
  assert.deepEqual(calls, [])
  assert.equal(manager.presentation.isInteractive(), false)
  manager.markRendered(window.webContents, manager.displayGeneration)
  assert.equal(manager.presentation.isInteractive(), true)
  assert.deepEqual(calls.filter(([name]) => name === 'opacity'), [['opacity', 1]])
})

test('预热未挂载完时有查价请求才显示冷启动占位并在正式渲染后聚焦', () => {
  const { manager, window, calls, create } = bootHarness()
  manager.markLoadingReady(window.webContents)
  assert.deepEqual(calls, [])
  create('loading')
  assert.deepEqual(calls.at(-1), ['opacity', 1])
  assert.equal(manager.presentation.isInteractive(), false)
  manager.markRendered(window.webContents, manager.displayGeneration)
  assert.equal(manager.presentation.isInteractive(), true)
})

test('关闭后迟到的静态占位回执和旧页面回执均不得重新显示', () => {
  const { manager, window, calls, create } = bootHarness()
  create('loading')
  const previousGeneration = manager.displayGeneration
  manager.close()
  const count = calls.length
  manager.markLoadingReady(window.webContents)
  assert.equal(manager.markRendered(window.webContents, previousGeneration), false)
  assert.equal(calls.length, count)
})

test('正式页面接管后静态占位回执失效，后续查询不暴露旧页面', () => {
  const { manager, window, calls, create } = bootHarness()
  create('ready-to-query')
  manager.markRendered(window.webContents, manager.displayGeneration)
  manager.close()
  create('loading')
  const count = calls.length
  assert.equal(manager.markLoadingReady(window.webContents), false)
  assert.equal(calls.length, count)
  assert.equal(manager.contentRendered, false)
})

// --- 2. Presentation state machine ---
function createWindowBoundary() {
  const calls = []
  return {
    calls,
    setOpacity(value) { calls.push(['opacity', value]) },
    setIgnoreMouseEvents(value) { calls.push(['ignoreMouse', value]) },
    setFocusable(value) { calls.push(['focusable', value]) },
    showInactive() { calls.push(['showInactive']) },
    focus() { calls.push(['focus']) },
    destroy() { calls.push(['destroy']) }
  }
}

test('查价浮窗预热后反复唤起只显示一次原生窗口且每次恢复交互', () => {
  const window = createWindowBoundary()
  const presentation = new PriceCheckOverlayPresentation(window)

  presentation.prime()
  for (let index = 0; index < 50; index += 1) {
    const display = presentation.beginDisplay()
    assert.equal(display.needsReveal, true)
    assert.equal(presentation.reveal(display.generation), true)
    assert.equal(presentation.isInteractive(), true)
    presentation.park()
    assert.equal(presentation.isInteractive(), false)
  }

  assert.equal(window.calls.filter(([name]) => name === 'showInactive').length, 1)
  assert.equal(window.calls.filter(([name]) => name === 'focus').length, 50)
  assert.equal(window.calls.some(([name]) => name === 'show' || name === 'hide'), false)
  assert.deepEqual(window.calls.slice(-3), [
    ['opacity', 0],
    ['ignoreMouse', true],
    ['focusable', false]
  ])
})

test('查价浮窗拒绝关闭前遗留的渲染回执', () => {
  const window = createWindowBoundary()
  const presentation = new PriceCheckOverlayPresentation(window)
  presentation.prime()

  const stale = presentation.beginDisplay()
  presentation.park()
  const current = presentation.beginDisplay()
  const callsBeforeStaleReply = window.calls.length

  assert.equal(presentation.reveal(stale.generation), false)
  assert.equal(window.calls.length, callsBeforeStaleReply)
  assert.equal(presentation.reveal(current.generation), true)
  assert.equal(presentation.isInteractive(), true)
})

test('查价浮窗保持显示时更新物品不重复提交原生显示和聚焦', () => {
  const window = createWindowBoundary()
  const presentation = new PriceCheckOverlayPresentation(window)
  presentation.prime()
  const first = presentation.beginDisplay()
  presentation.reveal(first.generation)
  const callsBeforeUpdate = window.calls.length

  const update = presentation.beginDisplay()

  assert.equal(update.needsReveal, false)
  assert.equal(presentation.isInteractive(), true)
  assert.equal(window.calls.length, callsBeforeUpdate)
})

test('查价浮窗销毁后不再响应遗留显示回执', () => {
  const window = createWindowBoundary()
  const presentation = new PriceCheckOverlayPresentation(window)
  presentation.prime()
  const display = presentation.beginDisplay()

  presentation.destroy()

  assert.equal(presentation.reveal(display.generation), false)
  assert.deepEqual(window.calls.slice(-1), [['destroy']])
})

test('首次捕获占位可见且不抢焦点或遮挡游戏悬停，读取后恢复交互', () => {
  const window = createWindowBoundary()
  const presentation = new PriceCheckOverlayPresentation(window)
  presentation.prime()

  const capture = presentation.beginDisplay({ focus: false })
  assert.equal(capture.needsReveal, true)
  assert.equal(presentation.reveal(capture.generation, { focus: false }), true)
  assert.equal(presentation.isInteractive(), false)
  assert.deepEqual(window.calls.filter(([name]) => name === 'opacity').at(-1), ['opacity', 1])
  assert.deepEqual(window.calls.filter(([name]) => name === 'ignoreMouse').at(-1), ['ignoreMouse', true])
  assert.deepEqual(window.calls.filter(([name]) => name === 'focusable').at(-1), ['focusable', false])
  assert.equal(window.calls.filter(([name]) => name === 'focus').length, 0)

  const item = presentation.beginDisplay()
  assert.equal(item.needsReveal, true)
  assert.equal(presentation.reveal(item.generation), true)
  assert.equal(presentation.reveal(item.generation), true)
  assert.equal(presentation.isInteractive(), true)
  assert.deepEqual(window.calls.filter(([name]) => name === 'ignoreMouse').at(-1), ['ignoreMouse', false])
  assert.equal(window.calls.filter(([name]) => name === 'focus').length, 1)
  assert.equal(window.calls.filter(([name]) => name === 'showInactive').length, 1)
})

test('已交互浮窗重新捕获时立即释放焦点资格，旧物品回执不能恢复交互', () => {
  const window = createWindowBoundary()
  const presentation = new PriceCheckOverlayPresentation(window)
  presentation.prime()
  const previous = presentation.beginDisplay()
  presentation.reveal(previous.generation)

  const capture = presentation.beginDisplay({ focus: false })
  assert.equal(presentation.isInteractive(), false)
  assert.deepEqual(window.calls.filter(([name]) => name === 'focusable').at(-1), ['focusable', false])
  const callsBeforeOldReply = window.calls.length
  assert.equal(presentation.reveal(previous.generation), false)
  assert.equal(window.calls.length, callsBeforeOldReply)
  assert.equal(presentation.reveal(capture.generation, { focus: false }), true)
  assert.equal(presentation.isInteractive(), false)
  assert.equal(window.calls.filter(([name]) => name === 'focus').length, 1)

  const item = presentation.beginDisplay()
  assert.equal(presentation.reveal(item.generation), true)
  assert.equal(presentation.isInteractive(), true)
  assert.equal(window.calls.filter(([name]) => name === 'focus').length, 2)
  assert.equal(window.calls.filter(([name]) => name === 'showInactive').length, 1)
})

for (const rendered of [false, true]) {
  test(`捕获占位${rendered ? '显示' : '等待渲染'}时关闭，迟到回执不得复活窗口`, () => {
    const window = createWindowBoundary()
    const presentation = new PriceCheckOverlayPresentation(window)
    presentation.prime()
    const capture = presentation.beginDisplay({ focus: false })
    if (rendered) presentation.reveal(capture.generation, { focus: false })

    presentation.park()
    const callsAfterClose = window.calls.length
    assert.equal(presentation.reveal(capture.generation, { focus: false }), false)
    assert.equal(presentation.reveal(capture.generation), false)
    assert.equal(window.calls.length, callsAfterClose)
    assert.equal(presentation.isInteractive(), false)
    assert.deepEqual(window.calls.filter(([name]) => name === 'opacity').at(-1), ['opacity', 0])
    assert.equal(window.calls.filter(([name]) => name === 'focus').length, 0)
  })
}

// --- 3. Overlay size & width persistence ---
test('查价浮窗宽度偏好只接受有限正数并兼容旧宽高对象', () => {
  for (const value of [null, [], {}, { width: 0 }, { width: -1, height: 700 }, { width: Infinity, height: 700 }, { width: '600', height: 700 }]) {
    assert.equal(normalizePriceCheckOverlaySize(value), null)
  }
  assert.deepEqual(normalizePriceCheckOverlaySize({ width: 600.4 }), { width: 600 })
  assert.deepEqual(normalizePriceCheckOverlaySize({ x: 20, y: 30, width: 600.4, height: 700.6 }), { width: 600 })
})

test('查价浮窗使用默认或保存宽度并始终铺满当前工作区高度', () => {
  assert.deepEqual(getDefaultPriceCheckOverlaySize({ width: 1920, height: 1080 }), { width: 614, height: 1080 })
  assert.deepEqual(resolvePriceCheckOverlaySize(null, { width: 400, height: 300 }), { width: 400, height: 300 })
  assert.deepEqual(resolvePriceCheckOverlaySize({ width: 900, height: 800 }, { width: 700, height: 600 }), { width: 700, height: 600 })
  assert.deepEqual(resolvePriceCheckOverlaySize({ width: 900, height: 800 }, { width: 1920, height: 1080 }), { width: 900, height: 1080 })
})

test('用户连续横向缩放只保存最后宽度且关闭刷新待保存值', () => {
  const callbacks = new Map()
  const cancelled = []
  const saved = []
  let sequence = 0
  const controller = new PriceCheckOverlaySizeController({
    save: (size) => saved.push(size),
    schedule: (callback) => {
      const id = ++sequence
      callbacks.set(id, callback)
      return id
    },
    cancel: (id) => {
      cancelled.push(id)
      callbacks.delete(id)
    }
  })

  assert.equal(controller.queueUserResize({ x: 10, y: 20, width: 620, height: 1080 }), true)
  assert.equal(controller.queueUserResize({ x: 30, y: 40, width: 680, height: 1080 }), true)
  assert.deepEqual(cancelled, [1])
  assert.deepEqual(saved, [])

  assert.equal(controller.flush(), true)
  assert.deepEqual(cancelled, [1, 2])
  assert.deepEqual(saved, [{ width: 680 }])
  assert.equal(controller.flush(), false)
})

test('防抖结束持久化宽度并在不同显示器恢复各自满高布局', () => {
  let preferredSize = { width: 777, height: 666 }
  let scheduled = null
  const first = new PriceCheckOverlaySizeController({
    load: () => preferredSize,
    save: (size) => { preferredSize = size },
    schedule: (callback) => { scheduled = callback; return 1 },
    cancel: () => {}
  })

  assert.deepEqual(first.resolve({ width: 1920, height: 1080 }), { width: 777, height: 1080 })
  first.queueUserResize({ x: 99, y: 88, width: 820, height: 1080 })
  scheduled()
  assert.deepEqual(preferredSize, { width: 820 })

  const afterRestart = new PriceCheckOverlaySizeController({ load: () => preferredSize })
  assert.deepEqual(afterRestart.resolve({ width: 1920, height: 1080 }), { width: 820, height: 1080 })
  assert.deepEqual(afterRestart.resolve({ width: 640, height: 480 }), { width: 640, height: 480 })
  assert.deepEqual(preferredSize, { width: 820 })
})

test('无效或读取失败的宽度配置回退默认宽度和完整工作区高度', () => {
  const invalid = new PriceCheckOverlaySizeController({ load: () => ({ width: 0, height: 700 }) })
  const failed = new PriceCheckOverlaySizeController({ load: () => { throw new Error('broken state') } })
  const workArea = { width: 1600, height: 900 }
  assert.deepEqual(invalid.resolve(workArea), getDefaultPriceCheckOverlaySize(workArea))
  assert.deepEqual(failed.resolve(workArea), getDefaultPriceCheckOverlaySize(workArea))
})

test('查价浮窗锁定工作区高度且仅从用户缩放事件保存宽度', async () => {
  const [overlay, state] = await Promise.all([
    readFile('electron/modules/priceCheck/overlay.js', 'utf8'),
    readFile('electron/modules/window/state.js', 'utf8')
  ])
  assert.match(overlay, /\.on\('will-resize',[\s\S]*sizeController\.queueUserResize\(newBounds\)/)
  assert.equal((overlay.match(/queueUserResize/g) || []).length, 1)
  assert.match(overlay, /lockPriceCheckOverlayHeight\(this\.window, area\)/)
  assert.equal((overlay.match(/sizeController\.flush\(\)/g) || []).length, 3)
  const persistedSize = state.match(/priceCheckOverlaySize:\s*\{[\s\S]*?\}/)?.[0] || ''
  assert.match(persistedSize, /width: size\?\.width/)
  assert.doesNotMatch(persistedSize, /\bheight:|\bx:|\by:/)
})

// --- 4. Focus restore ---
test('查价浮窗仅在用户关闭或鼠标离开时允许归还游戏焦点', () => {
  const reasons = PRICE_CHECK_OVERLAY_CLOSE_REASONS
  assert.equal(shouldRestoreGameFocus(reasons.USER_DISMISS), true)
  assert.equal(shouldRestoreGameFocus(reasons.POINTER_LEAVE), true)
  assert.equal(shouldRestoreGameFocus(reasons.BLUR), false)
  assert.equal(shouldRestoreGameFocus(reasons.EXTERNAL_ACTION), false)
  assert.equal(shouldRestoreGameFocus(reasons.SYSTEM), false)
  assert.equal(shouldRestoreGameFocus('unknown'), false)
})

test('查价浮窗焦点会话抑制外部动作并保证每次显示最多恢复一次', () => {
  const reasons = PRICE_CHECK_OVERLAY_CLOSE_REASONS
  const session = new PriceCheckOverlayFocusSession()

  session.begin()
  assert.equal(session.consumeRestoreRequest(reasons.USER_DISMISS), true)
  assert.equal(session.consumeRestoreRequest(reasons.POINTER_LEAVE), false)

  session.begin()
  session.preserveForExternalAction()
  assert.equal(session.consumeRestoreRequest(reasons.POINTER_LEAVE), false)

  session.begin()
  assert.equal(session.consumeRestoreRequest(reasons.BLUR), false)
  assert.equal(session.consumeRestoreRequest(reasons.POINTER_LEAVE), true)
})

test('Windows 游戏聚焦仅在脚本成功验证目标前台后返回成功', async () => {
  let invocation = null
  const execFileImpl = (pythonPath, args, options, callback) => {
    invocation = { pythonPath, args, options }
    callback(null, JSON.stringify({ title: '流放之路', processName: 'PathOfExile_x64.exe' }))
  }
  const result = await activateWindowsGameWindow({
    pythonPath: 'python.exe',
    titles: ['流放之路'],
    processNames: ['PathOfExile_x64.exe'],
    execFileImpl
  })
  assert.equal(result.success, true)
  assert.equal(result.code, WINDOW_ACTIVATION_CODES.GAME_ACTIVATED)
  assert.equal(invocation.pythonPath, 'python.exe')
  assert.equal(invocation.options.windowsHide, true)
  const script = invocation.args[1]
  assert.equal(invocation.args.at(-2), JSON.stringify(['流放之路']))
  assert.equal(invocation.args.at(-1), JSON.stringify(['PathOfExile_x64.exe']))
  assert.match(script, /process_names/)
  assert.match(script, /EnumWindows/)
  assert.match(script, /SetForegroundWindow/)
  assert.match(script, /GetForegroundWindow\(\) != hwnd_value/)
})

test('Windows 游戏聚焦区分目标缺失、权限、系统拒绝和目标变化', async () => {
  const expectedCodes = new Map([
    [23, WINDOW_ACTIVATION_CODES.GAME_NOT_FOUND],
    [24, WINDOW_ACTIVATION_CODES.PRIVILEGE_MISMATCH],
    [25, WINDOW_ACTIVATION_CODES.FOCUS_REFUSED],
    [26, WINDOW_ACTIVATION_CODES.TARGET_CHANGED],
    ['EPERM', WINDOW_ACTIVATION_CODES.ACTIVATION_ERROR]
  ])
  for (const [exitCode, expected] of expectedCodes) {
    const execFileImpl = (_pythonPath, _args, _options, callback) => {
      const error = new Error('focus failed')
      error.code = exitCode
      callback(error)
    }
    const result = await activateWindowsGameWindow({ pythonPath: 'python.exe', execFileImpl })
    assert.deepEqual(result, { success: false, code: expected })
  }
  const throwingExec = () => { throw new Error('spawn failed') }
  assert.deepEqual(await activateWindowsGameWindow({ pythonPath: 'python.exe', execFileImpl: throwingExec }), {
    success: false,
    code: WINDOW_ACTIVATION_CODES.ACTIVATION_ERROR
  })
  assert.deepEqual(await activateWindowsGameWindow({ pythonPath: '' }), {
    success: false,
    code: WINDOW_ACTIVATION_CODES.PYTHON_UNAVAILABLE
  })
})
