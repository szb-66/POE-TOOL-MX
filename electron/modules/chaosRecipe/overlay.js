import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeGridRegion } from './coordinates.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

function regionToDipBounds(region) {
  const topLeft = process.platform === 'win32'
    ? screen.screenToDipPoint({ x: Math.round(region.left), y: Math.round(region.top) })
    : { x: region.left, y: region.top }
  const bottomRight = process.platform === 'win32'
    ? screen.screenToDipPoint({ x: Math.round(region.right), y: Math.round(region.bottom) })
    : { x: region.right, y: region.bottom }
  return {
    x: Math.round(topLeft.x),
    y: Math.round(topLeft.y),
    width: Math.max(1, Math.round(bottomRight.x - topLeft.x)),
    height: Math.max(1, Math.round(bottomRight.y - topLeft.y))
  }
}

export class ChaosRecipeOverlayManager {
  constructor() {
    this.window = null
    this.snapshot = null
  }

  create(snapshot) {
    const region = normalizeGridRegion(snapshot?.region)
    if (!region) return false
    const bounds = regionToDipBounds(region)
    this.snapshot = { ...snapshot, region }
    if (!this.window || this.window.isDestroyed()) {
      this.window = new BrowserWindow({
        ...bounds,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        alwaysOnTop: true,
        skipTaskbar: true,
        focusable: false,
        resizable: false,
        hasShadow: false,
        show: false,
        webPreferences: {
          preload: path.resolve(moduleDir, '../../preload.cjs'),
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false
        }
      })
      this.window.setIgnoreMouseEvents(true, { forward: true })
      this.window.on('closed', () => { this.window = null })
      this.window.once('ready-to-show', () => this.window?.showInactive())
      const devServerUrl = process.env.VITE_DEV_SERVER_URL
      if (process.env.NODE_ENV === 'development' && devServerUrl) {
        void this.window.loadURL(`${devServerUrl}#/chaos-recipe-overlay`)
      } else {
        void this.window.loadFile(path.resolve(moduleDir, '../../../dist/index.html'), { hash: '/chaos-recipe-overlay' })
      }
    } else {
      this.window.setBounds(bounds)
      this.window.showInactive()
    }
    this.publish()
    return true
  }

  update(snapshot) {
    if (snapshot) this.snapshot = { ...this.snapshot, ...snapshot }
    if (this.snapshot?.region && this.window && !this.window.isDestroyed()) {
      this.window.setBounds(regionToDipBounds(this.snapshot.region))
    }
    this.publish()
  }

  publish() {
    const window = this.window
    if (!window || window.isDestroyed() || !this.snapshot) return
    const send = () => {
      if (!window.isDestroyed()) window.webContents.send('chaos-recipe-overlay-state', this.snapshot)
    }
    if (window.webContents.isLoadingMainFrame()) window.webContents.once('did-finish-load', send)
    else send()
  }

  getState() {
    return this.snapshot ? structuredClone(this.snapshot) : null
  }

  close() {
    if (this.window && !this.window.isDestroyed()) this.window.close()
    this.window = null
    this.snapshot = null
  }
}
