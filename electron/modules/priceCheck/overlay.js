import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  cursorInsideBounds,
  getPriceCheckOverlayBounds,
  hasLeftPriceCheckIntent
} from './overlayPosition.js'
import { createLoadAwarePublisher } from '../window/loadAwarePublisher.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const CURSOR_POLL_MS = 80
const CURSOR_LEAVE_DELAY_MS = 160

export class PriceCheckOverlayManager {
  constructor() {
    this.window = null
    this.snapshot = null
    this.ignoreNextBlur = false
    this.cursorMonitor = null
    this.cursorAnchor = null
    this.cursorEnteredWindow = false
    this.cursorOutsideSince = 0
    this.statePublisher = createLoadAwarePublisher()
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
      if (now - this.cursorOutsideSince >= CURSOR_LEAVE_DELAY_MS) this.close()
    }, CURSOR_POLL_MS)
    this.cursorMonitor.unref?.()
  }

  create(snapshot, { reposition = true } = {}) {
    this.snapshot = structuredClone(snapshot)
    const cursor = screen.getCursorScreenPoint()
    const area = screen.getDisplayNearestPoint(cursor).workArea
    if (!this.window || this.window.isDestroyed()) {
      const width = Math.min(640, Math.max(520, Math.floor(area.width * 0.32)))
      const height = Math.min(760, Math.max(520, Math.floor(area.height * 0.76)))
      const bounds = getPriceCheckOverlayBounds(cursor, area, width, height)
      this.window = new BrowserWindow({
        ...bounds,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: true,
        show: false,
        webPreferences: {
          preload: path.resolve(moduleDir, '../../preload.cjs'),
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true
        }
      })
      this.window.on('closed', () => {
        this.stopCursorMonitor()
        this.window = null
      })
      this.window.on('blur', () => {
        setTimeout(() => {
          if (this.ignoreNextBlur) {
            this.ignoreNextBlur = false
            return
          }
          this.close()
        }, 0)
      })
      this.window.once('ready-to-show', () => {
        this.window?.show()
        this.startCursorMonitor(cursor)
      })
      const devServerUrl = process.env.VITE_DEV_SERVER_URL
      if (process.env.NODE_ENV === 'development' && devServerUrl) {
        void this.window.loadURL(`${devServerUrl}#/price-check-overlay`)
      } else {
        void this.window.loadFile(path.resolve(moduleDir, '../../../dist/index.html'), { hash: '/price-check-overlay' })
      }
    } else {
      if (reposition) {
        const currentBounds = this.window.getBounds()
        this.window.setBounds(getPriceCheckOverlayBounds(
          cursor,
          area,
          currentBounds.width,
          currentBounds.height
        ))
      }
      this.window.show()
      this.window.focus()
      this.startCursorMonitor(cursor)
    }
    this.publish()
    return true
  }

  update(snapshot) {
    this.snapshot = { ...(this.snapshot || {}), ...structuredClone(snapshot || {}) }
    this.publish()
  }

  publish() {
    if (!this.window || this.window.isDestroyed() || !this.snapshot) return
    const window = this.window
    this.statePublisher.publish(window.webContents, () => {
      if (this.window === window && !window.isDestroyed()) window.webContents.send('price-check-overlay-state', this.snapshot)
    })
  }

  getState() { return this.snapshot ? structuredClone(this.snapshot) : null }
  preserveForExternalAction() {
    this.ignoreNextBlur = true
    setTimeout(() => { this.ignoreNextBlur = false }, 1500)
  }
  close() {
    this.stopCursorMonitor()
    this.statePublisher.dispose()
    if (this.window && !this.window.isDestroyed()) this.window.close()
    this.window = null
    this.snapshot = null
  }
}

export { getPriceCheckOverlayBounds }
