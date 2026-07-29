import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

export class PriceCheckOverlayManager {
  constructor() {
    this.window = null
    this.snapshot = null
    this.ignoreNextBlur = false
  }

  create(snapshot) {
    this.snapshot = structuredClone(snapshot)
    if (!this.window || this.window.isDestroyed()) {
      const area = screen.getPrimaryDisplay().workArea
      const width = Math.min(640, Math.max(520, Math.floor(area.width * 0.32)))
      const height = Math.min(760, Math.max(520, Math.floor(area.height * 0.76)))
      this.window = new BrowserWindow({
        width,
        height,
        x: area.x + area.width - width - 24,
        y: area.y + Math.max(24, Math.floor((area.height - height) / 2)),
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
      this.window.on('closed', () => { this.window = null })
      this.window.on('blur', () => {
        setTimeout(() => {
          if (this.ignoreNextBlur) {
            this.ignoreNextBlur = false
            return
          }
          this.close()
        }, 0)
      })
      this.window.once('ready-to-show', () => this.window?.show())
      const devServerUrl = process.env.VITE_DEV_SERVER_URL
      if (process.env.NODE_ENV === 'development' && devServerUrl) {
        void this.window.loadURL(`${devServerUrl}#/price-check-overlay`)
      } else {
        void this.window.loadFile(path.resolve(moduleDir, '../../../dist/index.html'), { hash: '/price-check-overlay' })
      }
    } else {
      this.window.show()
      this.window.focus()
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
    const send = () => this.window && !this.window.isDestroyed() && this.window.webContents.send('price-check-overlay-state', this.snapshot)
    if (this.window.webContents.isLoadingMainFrame()) this.window.webContents.once('did-finish-load', send)
    else send()
  }

  getState() { return this.snapshot ? structuredClone(this.snapshot) : null }
  preserveForExternalAction() {
    this.ignoreNextBlur = true
    setTimeout(() => { this.ignoreNextBlur = false }, 1500)
  }
  close() {
    if (this.window && !this.window.isDestroyed()) this.window.close()
    this.window = null
    this.snapshot = null
  }
}
