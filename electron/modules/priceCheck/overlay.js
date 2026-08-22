import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  cursorInsideBounds,
  getPriceCheckOverlayBounds,
  hasLeftPriceCheckIntent
} from './overlayPosition.js'
import { PriceCheckOverlaySizeController } from './overlaySize.js'
import { loadPriceCheckOverlaySize, savePriceCheckOverlaySize } from '../window/state.js'
import { createLoadAwarePublisher } from '../window/loadAwarePublisher.js'
import { PriceCheckOverlayPresentation } from './presentation.js'
import {
  PRICE_CHECK_OVERLAY_CLOSE_REASONS,
  PriceCheckOverlayFocusSession
} from './overlayFocus.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const CURSOR_POLL_MS = 80
const CURSOR_LEAVE_DELAY_MS = 160
const NATIVE_PRIME_DELAY_MS = 16

export class PriceCheckOverlayManager {
  constructor({ sizeController = null, restoreGameFocus = async () => false, focusSession = null } = {}) {
    this.window = null
    this.snapshot = null
    this.ignoreNextBlur = false
    this.cursorMonitor = null
    this.cursorAnchor = null
    this.cursorEnteredWindow = false
    this.cursorOutsideSince = 0
    this.ready = false
    this.contentRendered = false
    this.pendingShowCursor = null
    this.displayGeneration = 0
    this.presentation = null
    this.restoreGameFocus = restoreGameFocus
    this.focusSession = focusSession || new PriceCheckOverlayFocusSession()
    this.statePublisher = createLoadAwarePublisher()
    this.sizeController = sizeController || new PriceCheckOverlaySizeController({
      load: loadPriceCheckOverlaySize,
      save: savePriceCheckOverlaySize
    })
  }

  stopCursorMonitor() {
    if (this.cursorMonitor) clearInterval(this.cursorMonitor)
    this.cursorMonitor = null
    this.cursorAnchor = null
    this.cursorEnteredWindow = false
    this.cursorOutsideSince = 0
  }

  startCursorMonitor(anchor) {
    this.stopCursorMonitor()
    this.cursorAnchor = { ...anchor }
    this.cursorMonitor = setInterval(() => {
      if (!this.window || this.window.isDestroyed() || !this.cursorAnchor) {
        this.stopCursorMonitor()
        return
      }
      if (this.ignoreNextBlur) {
        this.cursorOutsideSince = 0
        return
      }
      const cursor = screen.getCursorScreenPoint()
      const bounds = this.window.getBounds()
      if (cursorInsideBounds(cursor, bounds)) {
        this.cursorEnteredWindow = true
        this.cursorOutsideSince = 0
        return
      }
      if (!hasLeftPriceCheckIntent(cursor, this.cursorAnchor, bounds, this.cursorEnteredWindow)) {
        this.cursorOutsideSince = 0
        return
      }
      const now = Date.now()
      if (!this.cursorOutsideSince) {
        this.cursorOutsideSince = now
        return
      }
      if (now - this.cursorOutsideSince >= CURSOR_LEAVE_DELAY_MS) this.close(PRICE_CHECK_OVERLAY_CLOSE_REASONS.POINTER_LEAVE)
    }, CURSOR_POLL_MS)
    this.cursorMonitor.unref?.()
  }

  ensureWindow(cursor, area) {
    if (this.window && !this.window.isDestroyed()) return false
    const { width, height } = this.sizeController.resolve(area)
    const bounds = getPriceCheckOverlayBounds(cursor, area, width, height)
    const window = new BrowserWindow({
      ...bounds,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: true,
      show: false,
      opacity: 0,
      focusable: false,
      webPreferences: {
        preload: path.resolve(moduleDir, '../../preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true
      }
    })
    this.window = window
    this.presentation = new PriceCheckOverlayPresentation(window)
    window.webContents.setBackgroundThrottling(false)
    this.ready = false
    window.on('will-resize', (_event, newBounds) => {
      this.sizeController.queueUserResize(newBounds)
    })
    window.on('closed', () => {
      this.sizeController.flush()
      this.stopCursorMonitor()
      if (this.window === window) this.window = null
      if (this.window === null) this.presentation = null
      this.ready = false
      this.contentRendered = false
      this.pendingShowCursor = null
    })
    window.on('blur', () => {
      setTimeout(() => {
        if (!this.presentation?.isInteractive()) return
        if (this.ignoreNextBlur) {
          this.ignoreNextBlur = false
          return
        }
        this.close(PRICE_CHECK_OVERLAY_CLOSE_REASONS.BLUR)
      }, 0)
    })
    window.once('ready-to-show', () => {
      if (this.window !== window || window.isDestroyed()) return
      this.presentation.prime()
      const finishPrime = setTimeout(() => {
        if (this.window !== window || window.isDestroyed()) return
        this.ready = true
        if (this.contentRendered && this.pendingShowCursor) this.showPreparedWindow(this.pendingShowCursor)
      }, NATIVE_PRIME_DELAY_MS)
      finishPrime.unref?.()
    })
    const devServerUrl = process.env.VITE_DEV_SERVER_URL
    if (process.env.NODE_ENV === 'development' && devServerUrl) {
      void window.loadURL(`${devServerUrl}#/price-check-overlay`)
    } else {
      void window.loadFile(path.resolve(moduleDir, '../../../dist/index.html'), { hash: '/price-check-overlay' })
    }
    return true
  }

  prepare() {
    const cursor = screen.getCursorScreenPoint()
    const area = screen.getDisplayNearestPoint(cursor).workArea
    this.ensureWindow(cursor, area)
  }

  showPreparedWindow(cursor) {
    if (!this.window || this.window.isDestroyed() || !this.ready || !this.contentRendered) return
    if (!this.presentation?.reveal(this.displayGeneration)) return
    this.pendingShowCursor = null
    this.startCursorMonitor(cursor)
  }

  create(snapshot, { reposition = true } = {}) {
    this.snapshot = structuredClone(snapshot)
    const cursor = screen.getCursorScreenPoint()
    const area = screen.getDisplayNearestPoint(cursor).workArea
    const created = this.ensureWindow(cursor, area)
    if (!created && reposition) {
      const currentBounds = this.window.getBounds()
      this.window.setBounds(getPriceCheckOverlayBounds(
        cursor,
        area,
        currentBounds.width,
        currentBounds.height
      ))
    }
    const display = this.presentation.beginDisplay()
    this.focusSession.begin()
    this.displayGeneration = display.generation
    this.contentRendered = false
    this.window.webContents.setBackgroundThrottling(false)
    this.pendingShowCursor = display.needsReveal ? { ...cursor } : null
    if (!display.needsReveal) this.startCursorMonitor(cursor)
    this.publish()
    return true
  }

  markRendered(contents, generation) {
    if (!this.window || this.window.isDestroyed() || this.window.webContents !== contents) return false
    if (!Number.isSafeInteger(generation) || generation !== this.displayGeneration) return false
    this.contentRendered = true
    contents.setBackgroundThrottling(true)
    if (this.pendingShowCursor) this.showPreparedWindow(this.pendingShowCursor)
    return true
  }

  update(snapshot) {
    this.snapshot = { ...(this.snapshot || {}), ...structuredClone(snapshot || {}) }
    this.publish()
  }

  publish() {
    if (!this.window || this.window.isDestroyed() || !this.snapshot) return
    const window = this.window
    const snapshot = structuredClone(this.snapshot)
    const generation = this.displayGeneration
    this.statePublisher.publish(window.webContents, () => {
      if (this.window === window && !window.isDestroyed()) window.webContents.send('price-check-overlay-state', snapshot, { generation })
    })
  }

  getState() { return this.snapshot ? structuredClone(this.snapshot) : null }
  getPresentation() {
    return this.snapshot && Number.isSafeInteger(this.displayGeneration)
      ? { generation: this.displayGeneration }
      : null
  }
  preserveForExternalAction() {
    this.ignoreNextBlur = true
    this.focusSession.preserveForExternalAction()
    setTimeout(() => { this.ignoreNextBlur = false }, 1500)
  }
  close(reason = PRICE_CHECK_OVERLAY_CLOSE_REASONS.SYSTEM) {
    const restoreFocus = this.focusSession.consumeRestoreRequest(reason)
    this.stopCursorMonitor()
    this.statePublisher.dispose()
    this.sizeController.flush()
    this.contentRendered = false
    this.pendingShowCursor = null
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.setBackgroundThrottling(true)
      this.presentation?.park()
      this.displayGeneration = this.presentation?.generation || this.displayGeneration + 1
    }
    this.snapshot = null
    if (restoreFocus) {
      void Promise.resolve()
        .then(() => this.restoreGameFocus())
        .catch(() => false)
    }
  }

  destroy() {
    this.stopCursorMonitor()
    this.statePublisher.dispose()
    this.sizeController.flush()
    this.snapshot = null
    this.contentRendered = false
    this.pendingShowCursor = null
    this.ready = false
    this.presentation?.destroy()
    this.presentation = null
    this.window = null
  }
}

export { getPriceCheckOverlayBounds }
