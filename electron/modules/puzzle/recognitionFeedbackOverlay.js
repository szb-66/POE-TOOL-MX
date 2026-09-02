import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { physicalRectangleToDipBounds } from '../window/coordinates.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const OVERLAY_WIDTH = 520
const OVERLAY_HEIGHT = 76
const OVERLAY_TOP_MARGIN = 24
export const RECOGNITION_FEEDBACK_CHANNEL = 'chart-recognition-feedback-updated'
export const RECOGNITION_RESULT_DURATION = Object.freeze({
  success: 4000,
  partial: 6000,
  failure: 6000,
  stopped: 4000
})

function physicalDisplayToDipBounds(displayBounds, screenApi) {
  if (!displayBounds || Number(displayBounds.width) <= 0 || Number(displayBounds.height) <= 0) return null
  return physicalRectangleToDipBounds({
    left: Number(displayBounds.x),
    top: Number(displayBounds.y),
    right: Number(displayBounds.x) + Number(displayBounds.width),
    bottom: Number(displayBounds.y) + Number(displayBounds.height)
  }, process.platform, rectangle => screenApi.screenToDipRect(null, rectangle))
}

export function recognitionFeedbackBounds(displayBounds, screenApi) {
  const display = physicalDisplayToDipBounds(displayBounds, screenApi)
  if (!display) return null
  const width = Math.min(OVERLAY_WIDTH, Math.max(1, display.width))
  const height = Math.min(OVERLAY_HEIGHT, Math.max(1, display.height))
  return {
    x: Math.round(display.x + (display.width - width) / 2),
    y: Math.round(display.y + Math.min(OVERLAY_TOP_MARGIN, Math.max(0, display.height - height))),
    width,
    height
  }
}

export class RecognitionFeedbackOverlayManager {
  constructor({
    BrowserWindowClass,
    screenApi,
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout
  } = {}) {
    this.BrowserWindowClass = BrowserWindowClass
    this.screenApi = screenApi
    this.setTimeoutFn = setTimeoutFn
    this.clearTimeoutFn = clearTimeoutFn
    this.window = null
    this.snapshot = null
    this.generation = 0
    this.closeTimer = null
    this.visibleCallback = null
  }

  prime() {
    if (this.window && !this.window.isDestroyed()) return this.window
    if (!this.BrowserWindowClass || !this.screenApi) throw new Error('识别反馈窗口缺少 Electron 窗口依赖')
    const window = new this.BrowserWindowClass({
      width: OVERLAY_WIDTH,
      height: OVERLAY_HEIGHT,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      hasShadow: false,
      useContentSize: true,
      show: false,
      webPreferences: {
        preload: path.resolve(moduleDir, '../../preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false
      }
    })
    window.setAlwaysOnTop(true, 'screen-saver')
    window.setFocusable(false)
    window.setIgnoreMouseEvents(true, { forward: true })
    window.setContentProtection(true)
    this.window = window
    const devServerUrl = process.env.VITE_DEV_SERVER_URL
    if (process.env.NODE_ENV === 'development' && devServerUrl) {
      void window.loadURL(`${devServerUrl}#/chart-recognition-feedback`)
    } else {
      void window.loadFile(path.resolve(moduleDir, '../../../dist/index.html'), { hash: '/chart-recognition-feedback' })
    }
    window.webContents.on('did-finish-load', () => this.publishCurrent())
    window.on('closed', () => {
      if (this.window === window) this.window = null
    })
    return window
  }

  cancelCloseTimer() {
    if (this.closeTimer !== null) this.clearTimeoutFn(this.closeTimer)
    this.closeTimer = null
  }

  publishCurrent() {
    const window = this.window
    const snapshot = this.snapshot
    if (!window || window.isDestroyed() || !snapshot || window.webContents.isLoadingMainFrame()) return false
    window.setBounds(snapshot.bounds, false)
    window.webContents.send(RECOGNITION_FEEDBACK_CHANNEL, structuredClone(snapshot))
    window.showInactive()
    if (this.visibleCallback?.sessionId === snapshot.sessionId) {
      const callback = this.visibleCallback.callback
      this.visibleCallback = null
      try { callback() } catch {}
    }
    return true
  }

  begin(snapshot, { onVisible } = {}) {
    const bounds = recognitionFeedbackBounds(snapshot?.displayBounds, this.screenApi)
    if (!bounds) return null
    this.cancelCloseTimer()
    const sessionId = ++this.generation
    this.snapshot = {
      sessionId,
      kind: 'running',
      stage: 'shape',
      current: 0,
      total: 0,
      ...structuredClone(snapshot),
      bounds
    }
    this.visibleCallback = typeof onVisible === 'function' ? { sessionId, callback: onVisible } : null
    this.prime()
    this.publishCurrent()
    return sessionId
  }

  showRunning(snapshot, options) {
    return this.begin({ ...snapshot, kind: 'running' }, options)
  }

  updateProgress(sessionId, patch) {
    if (!sessionId || sessionId !== this.generation || this.snapshot?.kind !== 'running') return false
    this.snapshot = { ...this.snapshot, ...structuredClone(patch), sessionId, kind: 'running' }
    this.publishCurrent()
    return true
  }

  showResult(sessionId, result) {
    if (!sessionId || sessionId !== this.generation || this.snapshot?.kind !== 'running') return false
    const status = RECOGNITION_RESULT_DURATION[result?.status] ? result.status : 'failure'
    this.cancelCloseTimer()
    this.snapshot = { ...this.snapshot, ...structuredClone(result), sessionId, kind: 'result', status }
    this.publishCurrent()
    const duration = RECOGNITION_RESULT_DURATION[status]
    this.closeTimer = this.setTimeoutFn(() => this.hide(sessionId), duration)
    return true
  }

  showImmediateResult(snapshot) {
    const bounds = recognitionFeedbackBounds(snapshot?.displayBounds, this.screenApi)
    if (!bounds) return null
    this.cancelCloseTimer()
    this.visibleCallback = null
    const sessionId = ++this.generation
    this.snapshot = {
      sessionId,
      kind: 'running',
      displayBounds: structuredClone(snapshot.displayBounds),
      bounds
    }
    this.prime()
    this.showResult(sessionId, snapshot)
    return sessionId
  }

  hide(sessionId) {
    if (sessionId && sessionId !== this.generation) return false
    this.cancelCloseTimer()
    this.snapshot = null
    this.visibleCallback = null
    const window = this.window
    if (window && !window.isDestroyed()) window.hide()
    return true
  }

  close() {
    this.cancelCloseTimer()
    this.generation += 1
    this.snapshot = null
    this.visibleCallback = null
    const window = this.window
    this.window = null
    if (window && !window.isDestroyed()) window.close()
  }
}
