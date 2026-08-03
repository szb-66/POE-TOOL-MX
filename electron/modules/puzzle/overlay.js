import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { physicalRectangleToDipBounds } from '../window/coordinates.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
function toDipBounds(region) {
  return physicalRectangleToDipBounds(
    region,
    process.platform,
    rectangle => screen.screenToDipRect(null, rectangle)
  )
}

export class PuzzleOverlayManager {
  constructor() {
    this.windows = new Map()
    this.snapshot = null
    this.hiddenTypes = new Set()
  }

  create(snapshot) {
    this.close()
    this.snapshot = structuredClone(snapshot)
    const regions = { inventory: snapshot.inventoryRegion, atlas: snapshot.atlasRegion }
    for (const [type, region] of Object.entries(regions)) {
      if (!region) continue
      const bounds = toDipBounds(region)
      const window = new BrowserWindow({
        ...bounds, frame: false, transparent: true, backgroundColor: '#00000000',
        alwaysOnTop: true, skipTaskbar: true, focusable: false, resizable: false,
        movable: false, fullscreenable: false, hasShadow: false, useContentSize: true, show: false,
        webPreferences: {
          preload: path.resolve(moduleDir, '../../preload.cjs'),
          nodeIntegration: false, contextIsolation: true, backgroundThrottling: false
        }
      })
      window.setBounds(bounds, false)
      window.setAlwaysOnTop(true, 'screen-saver')
      window.setIgnoreMouseEvents(true, { forward: true })
      this.windows.set(type, window)
      const devServerUrl = process.env.VITE_DEV_SERVER_URL
      if (process.env.NODE_ENV === 'development' && devServerUrl) {
        void window.loadURL(`${devServerUrl}#/puzzle-overlay?type=${type}`)
      } else {
        void window.loadFile(path.resolve(moduleDir, '../../../dist/index.html'), { hash: `/puzzle-overlay?type=${type}` })
      }
      window.webContents.once('did-finish-load', () => {
        if (window.isDestroyed()) return
        window.setBounds(bounds, false)
        window.webContents.send('puzzle-auto-placement-updated', { ...this.snapshot, regionType: type })
        if (!this.hiddenTypes.has(type)) window.showInactive()
      })
      window.on('closed', () => this.windows.delete(type))
    }
    return true
  }

  update(snapshot) {
    this.snapshot = { ...(this.snapshot || {}), ...structuredClone(snapshot) }
    for (const [type, window] of this.windows) {
      if (!window.isDestroyed() && !window.webContents.isLoadingMainFrame()) {
        window.webContents.send('puzzle-auto-placement-updated', { ...this.snapshot, regionType: type })
      }
    }
  }

  hide(type = null) {
    if (type) {
      this.hiddenTypes.add(type)
      const window = this.windows.get(type)
      if (window && !window.isDestroyed()) window.hide()
      return
    }
    for (const [windowType, window] of this.windows) {
      this.hiddenTypes.add(windowType)
      if (!window.isDestroyed()) window.hide()
    }
  }

  show(type = null) {
    if (type) {
      this.hiddenTypes.delete(type)
      const window = this.windows.get(type)
      if (window && !window.isDestroyed()) window.showInactive()
      return
    }
    this.hiddenTypes.clear()
    for (const window of this.windows.values()) if (!window.isDestroyed()) window.showInactive()
  }

  close() {
    for (const window of this.windows.values()) if (!window.isDestroyed()) window.close()
    this.windows.clear()
    this.snapshot = null
    this.hiddenTypes.clear()
  }
}

export { toDipBounds as puzzleOverlayDipBounds }
