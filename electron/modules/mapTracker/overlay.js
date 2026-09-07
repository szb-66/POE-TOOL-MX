import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defaultMapTrackerOverlayBounds, shouldShowMapTrackerOverlay } from './overlayPolicy.js'
import { OverlayDragPassthroughController, OverlayDragSession, isPointInCenteredOverlayDragHandle } from '../window/overlayDrag.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
// 固定尺寸常量：拖动钳制必须用它而非 getBounds()，否则 Windows DPI 往返漂移会让窗口越拖越大
export const MAP_TRACKER_OVERLAY_SIZE = Object.freeze({ width: 240, height: 88 })
const SIZE = MAP_TRACKER_OVERLAY_SIZE

export class MapTrackerOverlayManager {
  constructor({ service } = {}) { this.service = service; this.window = null; this.snapshot = null; this.loaded = false; this.dragSession = new OverlayDragSession(); this.unsubscribe = service.onSnapshot((value) => this.update(value)) }
  defaultBounds() { return defaultMapTrackerOverlayBounds(screen.getPrimaryDisplay().workArea, SIZE) }
  getWindow() { return this.window && !this.window.isDestroyed() ? this.window : null }
  setDragging(dragging) { this.dragPassthrough?.setDragging(dragging) }
  ensureWindow() {
    if (this.window && !this.window.isDestroyed()) return this.window
    const position = this.snapshot?.settings?.overlay || {}; const defaults = this.defaultBounds()
    this.window = new BrowserWindow({ ...defaults, ...(Number.isFinite(position.x) ? { x: position.x } : {}), ...(Number.isFinite(position.y) ? { y: position.y } : {}), frame: false, transparent: true, backgroundColor: '#00000000', alwaysOnTop: true, skipTaskbar: true, resizable: false, movable: true, show: false, focusable: false, webPreferences: { preload: path.resolve(moduleDir, '../../preload.cjs'), nodeIntegration: false, contextIsolation: true, webSecurity: true } })
    this.window.setAlwaysOnTop(true, 'screen-saver'); this.window.setIgnoreMouseEvents(true, { forward: true })
    this.dragPassthrough = new OverlayDragPassthroughController({
      getWindow: () => this.window,
      getCursorPoint: () => screen.getCursorScreenPoint(),
      isPointInHandle: (point, bounds, win) => Boolean(win?.isVisible()) && this.shouldShow() && isPointInCenteredOverlayDragHandle(point, bounds)
    })
    this.dragPassthrough.start()
    this.window.webContents.on('did-finish-load', () => { this.loaded = true; this.send() })
    this.window.on('moved', () => { if (this.dragSession.active) return; if (!this.window || this.window.isDestroyed()) return; const [x, y] = this.window.getPosition(); void this.service.updateSettings({ overlay: { ...this.snapshot.settings.overlay, x, y } }) })
    this.window.on('closed', () => { this.window = null; this.loaded = false; this.dragPassthrough?.stop() })
    const devServerUrl = process.env.VITE_DEV_SERVER_URL
    if (process.env.NODE_ENV === 'development' && devServerUrl) void this.window.loadURL(`${devServerUrl}#/map-tracker-overlay`)
    else void this.window.loadFile(path.resolve(moduleDir, '../../../dist/index.html'), { hash: '/map-tracker-overlay' })
    return this.window
  }
  shouldShow() { return shouldShowMapTrackerOverlay(this.snapshot) }
  send() { if (this.loaded && this.window && !this.window.isDestroyed()) this.window.webContents.send('map-tracker:snapshot', this.snapshot) }
  update(snapshot) { this.snapshot = structuredClone(snapshot); this.send(); if (this.shouldShow()) this.ensureWindow().showInactive(); else this.window?.hide() }
  async control(action) {
    if (action === 'show') this.update(this.service.snapshot())
    else if (action === 'hide') this.window?.hide()
    else if (action === 'reset') { const bounds = this.defaultBounds(); this.ensureWindow().setBounds(bounds); await this.service.updateSettings({ overlay: { ...this.snapshot.settings.overlay, x: bounds.x, y: bounds.y } }) }
    return { available: true, visible: Boolean(this.window?.isVisible()) }
  }
  destroy() { this.unsubscribe?.(); this.unsubscribe = null; this.dragPassthrough?.stop(); if (this.window && !this.window.isDestroyed()) this.window.destroy(); this.window = null }
}
