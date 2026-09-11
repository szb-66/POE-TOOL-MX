import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getBagOverlayBounds, getBagOverlayDragBounds } from '../window/bagOverlay.js'
import { OverlayDragSession } from '../window/overlayDrag.js'
import { sanctumProgressText } from '../../../shared/sanctumProgress.js'
import { captureButton } from '../../../shared/sanctumPresentation.js'
import { setWindowVisibilityImmediately } from '../window/transitions.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const size = { width: 260, height: 56 }
export function sanctumControlState(service, detection, lock, now = Date.now()) {
  const observed = service.observation
  const active = service.running && observed?.foreground && observed?.interfaceMatched
    && Number.isFinite(observed.receivedAt) && now-observed.receivedAt >= 0 && now-observed.receivedAt <= 1500
  const visible = service.enabled && (active || detection.running && detection.foreground && !detection.reloading
    && Number.isFinite(detection.receivedAt) && now >= detection.receivedAt && now - detection.receivedAt <= 1500
    && detection.interfaces?.['sanctum-map']?.matched === true)
  const busy = service.running || service.solving || service.captureDraining
  const reason = !service.liveCalibration ? '请先在圣所页面完成实时校准'
    : lock?.locked && !busy ? '另一项自动化正在运行' : ''
  return { visible: Boolean(visible), running:service.running, ...captureButton(service, { locked: lock?.locked }),
    reason: reason || service.reason || sanctumProgressText(service.progress) || '' }
}

export class SanctumControlOverlay {
  constructor({ service, detection, automationLock, BrowserWindowClass, screenApi, commandLine }) {
    Object.assign(this, { service, detection, automationLock, BrowserWindowClass, screenApi, commandLine })
    this.drag = new OverlayDragSession()
    this.hidden = 0
    this.registered = false
    this.unsubscribe = service.subscribe(() => this.sync())
    this.unsubscribeDetection = detection.subscribe(state => {
      const issues = JSON.stringify(state.titleIssues || {})
      if (issues !== this.titleIssues) {
        this.titleIssues = issues
        this.service.publish()
      }
      this.sync()
    })
    this.unsubscribeLock = automationLock.subscribe(() => this.sync())
    this.timer = setInterval(() => this.sync(), 250)
    this.timer.unref?.()
    this.sync()
  }
  getState() { return sanctumControlState(this.service.getState(), this.detection.getState(), this.automationLock.getState()) }
  owns(sender) { return Boolean(this.window && !this.window.isDestroyed() && sender === this.window.webContents) }
  ensureWindow() {
    if (this.window && !this.window.isDestroyed()) return this.window
    const displays = this.screenApi.getAllDisplays().map(d => ({ ...d, primary: d.id === this.screenApi.getPrimaryDisplay().id }))
    const bounds = getBagOverlayBounds(this.service.state.controlOverlayBounds, displays, size)
    const window = new this.BrowserWindowClass({ ...bounds, show: false, frame: false, thickFrame: false, transparent: true,
      focusable: false, resizable: false, movable: false, skipTaskbar: true, hasShadow: false,
      webPreferences: { preload: path.resolve(moduleDir, '../../preload.cjs'), contextIsolation: true, nodeIntegration: false } })
    this.window = window
    window.setAlwaysOnTop(true, 'screen-saver')
    window.setContentProtection(true)
    window.webContents.on('did-finish-load', () => this.sync())
    window.on('closed', () => { if (this.window === window) this.window = null })
    const url = process.env.VITE_DEV_SERVER_URL
    Promise.resolve(url ? window.loadURL(`${url}#/sanctum-control-overlay`)
      : window.loadFile(path.resolve(moduleDir, '../../../dist/index.html'), { hash: '/sanctum-control-overlay' }))
      .catch(() => { window.destroy(); if (this.window === window) this.window = null })
    return window
  }
  sync() {
    if (this.closed) return
    if (this.registered !== this.service.enabled) {
      this.registered = this.service.enabled
      if (this.registered) Promise.resolve(this.detection.registerConsumer('sanctum-control')).catch(error => {
        this.service.state.reason = `圣所入口检测启动失败：${error.message}`; this.service.publish()
      })
      else this.detection.unregisterConsumer('sanctum-control')
    }
    const state = this.getState()
    if (!state.visible || this.hidden) { this.hide(); return }
    const window = this.ensureWindow()
    if (window.webContents.isLoadingMainFrame()) return
    window.webContents.send('sanctum:controlState', state)
    if (!window.isVisible()) setWindowVisibilityImmediately(window, true, this.commandLine)
  }
  move(sender, message) {
    if (!this.owns(sender) || !message) return false
    const window = this.window
    if (message.phase === 'start') return this.drag.begin(sender.id, message, window.getBounds())
    if (message.phase === 'move' || message.phase === 'end') {
      const point = this.drag.move(sender.id, message)
      if (point) {
        const display = this.screenApi.getDisplayNearestPoint(point)
        window.setBounds(getBagOverlayDragBounds(point, display.workArea, size), false)
      }
      if (message.phase === 'end' && this.drag.end(sender.id)) {
        const { x, y } = window.getBounds()
        this.service.state.controlOverlayBounds = { x, y }
        this.service.persist()
      }
      return true
    }
    return false
  }
  hide() {
    if (this.window && !this.window.isDestroyed() && this.window.isVisible()) setWindowVisibilityImmediately(this.window, false, this.commandLine)
  }
  async withHidden(operation) {
    if (this.closed) throw new Error('圣所浮窗已关闭')
    this.hidden++; this.hide()
    try { return await operation() }
    finally { this.hidden--; this.sync() }
  }
  destroy() {
    this.closed = true
    clearInterval(this.timer)
    this.unsubscribe(); this.unsubscribeDetection(); this.unsubscribeLock()
    this.detection.unregisterConsumer('sanctum-control')
    this.window?.destroy(); this.window = null
  }
}
