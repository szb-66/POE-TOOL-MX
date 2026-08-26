import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import {
  RECOGNITION_FEEDBACK_CHANNEL,
  RecognitionFeedbackOverlayManager,
  recognitionFeedbackBounds
} from '../electron/modules/puzzle/recognitionFeedbackOverlay.js'

class FakeWebContents extends EventEmitter {
  constructor() {
    super()
    this.loading = true
    this.sent = []
  }

  isLoadingMainFrame() { return this.loading }
  send(...args) { this.sent.push(args) }
}

class FakeWindow extends EventEmitter {
  static instances = []

  constructor(options) {
    super()
    this.options = options
    this.webContents = new FakeWebContents()
    this.calls = []
    this.destroyed = false
    FakeWindow.instances.push(this)
  }

  isDestroyed() { return this.destroyed }
  setAlwaysOnTop(...args) { this.calls.push(['alwaysOnTop', ...args]) }
  setFocusable(...args) { this.calls.push(['focusable', ...args]) }
  setIgnoreMouseEvents(...args) { this.calls.push(['ignoreMouse', ...args]) }
  setContentProtection(...args) { this.calls.push(['contentProtection', ...args]) }
  setBounds(...args) { this.calls.push(['bounds', ...args]) }
  showInactive() { this.calls.push(['showInactive']) }
  hide() { this.calls.push(['hide']) }
  loadURL(...args) { this.calls.push(['loadURL', ...args]); return Promise.resolve() }
  loadFile(...args) { this.calls.push(['loadFile', ...args]); return Promise.resolve() }
  close() { this.destroyed = true; this.calls.push(['close']); this.emit('closed') }
}

const screenApi = {
  screenToDipRect(_window, rectangle) {
    return {
      x: rectangle.x / 1.5,
      y: rectangle.y / 1.5,
      width: rectangle.width / 1.5,
      height: rectangle.height / 1.5
    }
  }
}

function createManager() {
  const timers = []
  const cleared = []
  FakeWindow.instances.length = 0
  const manager = new RecognitionFeedbackOverlayManager({
    BrowserWindowClass: FakeWindow,
    screenApi,
    setTimeoutFn(callback, duration) {
      const timer = { callback, duration }
      timers.push(timer)
      return timer
    },
    clearTimeoutFn(timer) { cleared.push(timer) }
  })
  return { manager, timers, cleared }
}

test('识别反馈窗口按目标显示器 DPI 顶部居中并保持不可交互和内容保护', () => {
  const bounds = recognitionFeedbackBounds({ x: -1920, y: 0, width: 1920, height: 1080 }, screenApi)
  assert.deepEqual(bounds, { x: -900, y: 24, width: 520, height: 76 })

  const { manager } = createManager()
  manager.prime()
  const window = FakeWindow.instances[0]
  assert.equal(window.options.show, false)
  assert.equal(window.options.focusable, false)
  assert.equal(window.options.skipTaskbar, true)
  assert.deepEqual(window.calls.slice(0, 4), [
    ['alwaysOnTop', true, 'screen-saver'],
    ['focusable', false],
    ['ignoreMouse', true, { forward: true }],
    ['contentProtection', true]
  ])
  assert.ok(window.calls.some(([name, file]) => name === 'loadFile' && file.endsWith('dist\\index.html')))
})

test('预加载期间缓存最新快照，加载完成后才显示并推送', () => {
  const { manager } = createManager()
  assert.equal(FakeWindow.instances.length, 0)
  const sessionId = manager.showRunning({
    displayBounds: { x: 0, y: 0, width: 2560, height: 1440 },
    stage: 'shape', current: 1, total: 2
  })
  const window = FakeWindow.instances[0]
  assert.ok(window)
  manager.updateProgress(sessionId, { stage: 'copy', current: 3, total: 9 })
  assert.equal(window.webContents.sent.length, 0)
  assert.equal(window.calls.some(([name]) => name === 'showInactive'), false)

  window.webContents.loading = false
  window.webContents.emit('did-finish-load')
  assert.equal(window.webContents.sent.length, 1)
  assert.equal(window.webContents.sent[0][0], RECOGNITION_FEEDBACK_CHANNEL)
  assert.equal(window.webContents.sent[0][1].stage, 'copy')
  assert.equal(window.webContents.sent[0][1].current, 3)
  assert.equal(window.calls.filter(([name]) => name === 'showInactive').length, 1)
})

test('结果时长、计时取消和会话代次隔离相邻识别', () => {
  const { manager, timers, cleared } = createManager()
  manager.prime()
  const window = FakeWindow.instances[0]
  window.webContents.loading = false
  const displayBounds = { x: 0, y: 0, width: 1920, height: 1080 }
  const first = manager.showRunning({ displayBounds, stage: 'shape' })
  assert.equal(manager.showResult(first, { status: 'partial', message: '部分成功' }), true)
  assert.equal(timers[0].duration, 6000)

  const second = manager.showRunning({ displayBounds, stage: 'border' })
  assert.ok(second > first)
  assert.deepEqual(cleared, [timers[0]])
  assert.equal(manager.updateProgress(first, { current: 12 }), false)
  timers[0].callback()
  assert.equal(window.calls.some(([name]) => name === 'hide'), false)

  assert.equal(manager.showResult(second, { status: 'success', message: '完成' }), true)
  assert.equal(timers[1].duration, 4000)
  timers[1].callback()
  assert.equal(window.calls.at(-1)[0], 'hide')

  const failure = manager.showImmediateResult({ displayBounds, status: 'failure', message: '失败' })
  assert.ok(failure > second)
  assert.equal(timers[2].duration, 6000)
  const failureSnapshots = window.webContents.sent.filter(([, snapshot]) => snapshot.sessionId === failure)
  assert.equal(failureSnapshots.length, 1)
  assert.equal(failureSnapshots[0][1].kind, 'result')
  manager.close()
  assert.equal(window.calls.at(-1)[0], 'close')
})
