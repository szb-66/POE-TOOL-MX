import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeGridRegion } from './coordinates.js'
import { createLoadAwarePublisher } from '../window/loadAwarePublisher.js'

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
    this.statePublisher = createLoadAwarePublisher()
  }

  create(snapshot) {
    const region = normalizeGridRegion(snapshot?.region)
    if (!region) {
      console.log('[商城配方高亮]', JSON.stringify({ event: 'create-skipped', reason: 'invalid-region' }))
      return false
    }
    const bounds = regionToDipBounds(region)
    this.snapshot = { ...snapshot, region }
    const reusable = Boolean(this.window && !this.window.isDestroyed())
    const crashed = Boolean(reusable && this.window.webContents?.isCrashed?.())
    if (crashed) {
      console.log('[商城配方高亮]', JSON.stringify({ event: 'renderer-crashed', action: 'recreate' }))
      const crashedWindow = this.window
      this.window = null
      if (!crashedWindow.isDestroyed()) crashedWindow.destroy()
    }
    const reused = Boolean(this.window && !this.window.isDestroyed())
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
      this.window.setAlwaysOnTop(true, 'screen-saver')
      this.window.setIgnoreMouseEvents(true, { forward: true })
      const createdWindow = this.window
      createdWindow.on('closed', () => {
        if (this.window !== createdWindow) return
        this.window = null
        this.snapshot = null
      })
      createdWindow.webContents.on('render-process-gone', () => {
        console.log('[商城配方高亮]', JSON.stringify({ event: 'renderer-crashed' }))
      })
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
    console.log('[商城配方高亮]', JSON.stringify({
      event: 'show',
      status: this.snapshot.status || '',
      itemCount: Array.isArray(this.snapshot.items) ? this.snapshot.items.length : 0,
      reused
    }))
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
    this.statePublisher.publish(window.webContents, () => {
      if (!window.isDestroyed()) window.webContents.send('chaos-recipe-overlay-state', this.snapshot)
    })
  }

  getState() {
    return this.snapshot ? structuredClone(this.snapshot) : null
  }

  close() {
    this.statePublisher.dispose()
    if (this.window && !this.window.isDestroyed()) this.window.close()
    if (this.snapshot) {
      console.log('[商城配方高亮]', JSON.stringify({ event: 'close', hadStatus: this.snapshot.status || '' }))
    }
    this.window = null
    this.snapshot = null
  }
}
