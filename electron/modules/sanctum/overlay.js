import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { physicalRectangleToDipBounds } from '../window/coordinates.js'
import { sanctumProgressText } from '../../../shared/sanctumProgress.js'
import { sanctumDisplay } from '../../../shared/sanctumDisplay.js'
import { effectReadIssues, effectIssueText } from '../../../shared/sanctumEffects.js'
import { setWindowVisibilityImmediately } from '../window/transitions.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const rectangle = value => value && ['x', 'y', 'width', 'height'].every(key => Number.isFinite(value[key]))
  && value.width > 0 && value.height > 0
const inside = (value, width, height) => rectangle(value) && value.x >= 0 && value.y >= 0
  && value.x + value.width <= width && value.y + value.height <= height

export function sanctumOverlaySnapshot(state, now = Date.now()) {
  const observation = state?.observation
  if (!state?.enabled || !state.foreground || !observation || observation.foreground !== true
    || observation.interfaceMatched !== true || !Number.isFinite(observation.receivedAt) || now < observation.receivedAt || now - observation.receivedAt > 1500
    || !rectangle(observation.clientBounds)) return null
  const { width, height } = observation.clientBounds
  const snapshot = { width, height, rooms: [], lines: [], highlight: null, reason: '', unknown: [], nextRoom: '' }
  const resultMode = !state.running && ['complete', 'partial', 'timeout'].includes(state.progress?.stage)
  if (observation.mapOpen === true && (state.running || resultMode) && !state.floor?.sampleId && state.floor?.identityConfirmed) {
    const floor = state.floor, region = observation.mapRegion
    if (!inside(region, width, height) || floor.width !== region.width || floor.height !== region.height) return null
    const display = sanctumDisplay(floor, state.recommendation, state.marks, state.progress)
    const rooms = display.rooms.filter(room => (!resultMode || room.current || room.next) && inside(room, region.width, region.height)).map(room => ({ id: room.id,
      x: region.x + room.x, y: region.y + room.y, width: room.width, height: room.height,
      name: room.name, reading: room.reading, detailsStatus: room.detailsStatus,
      current: room.current, displayState: room.displayState, recommended: room.recommended, next: room.next,
      avoided: room.avoided, target: room.target }))
    const byId = new Map(rooms.map(room => [room.id, room]))
    snapshot.rooms = rooms
    if (state.running && state.progress?.stage === 'rooms') {
      const active = floor.rooms.find(room => room.id === state.progress.targetId)
      const phase = state.progress.step
      const r = state.progress.region || (['ocr','parsing'].includes(phase) ? active?.recognition?.region : null)
      snapshot.ocrRegion = inside(r, width, height) ? { x:r.x, y:r.y, width:r.width, height:r.height } : null
      snapshot.recognitionMessage = snapshot.ocrRegion ? `文字识别区域 · ${active?.id || ''}`
        : phase === 'locating' || active?.detailsStatus === 'failed' ? '未找到识别区域' : '等待弹框识别区域'
    }
    snapshot.lines = display.lines.filter(line => (!resultMode || line.recommended) && byId.has(line.from) && byId.has(line.to)).map(line => ({ ...line,
      x1: region.x + line.x1, y1: region.y + line.y1, x2: region.x + line.x2, y2: region.y + line.y2 }))
    const next = display.nextRoomId
    snapshot.nextRoom = next ? floor.rooms.find(room => room.id === next)?.name || next : ''
    snapshot.reason = resultMode ? state.reason : sanctumProgressText(state.progress) || state.recommendation?.reason || state.reason || '地图详情待确认'
    snapshot.readIssues = state.running ? [] : effectReadIssues(floor.effectScan)
    snapshot.unknown = [...new Set([...snapshot.readIssues.map(effectIssueText), ...(state.recommendation?.unknown || [])])]
    snapshot.avoided = state.marks.avoid.join('、')
    return snapshot
  }
  if (state.highlight && state.highlight.expiresAt > now) {
    const item = state.inventory.find(item => item.id === state.highlight.id && item.status === 'matched')
    const grid = item && observation.regions?.[item.regionId]
    if (!grid || !grid.scanId || item.scanId !== grid.scanId || !inside(grid, width, height)
      || !Number.isInteger(grid.columns) || grid.columns < 1 || !Number.isInteger(grid.rows) || grid.rows < 1) return null
    const highlight = { x: grid.x + item.x * grid.width / grid.columns, y: grid.y + item.y * grid.height / grid.rows,
      width: item.width * grid.width / grid.columns, height: item.height * grid.height / grid.rows }
    if (!inside(highlight, width, height) || item.x < 0 || item.y < 0
      || item.x + item.width > grid.columns || item.y + item.height > grid.rows) return null
    snapshot.highlight = highlight
    snapshot.reason = item.name || '所选圣物位置'
    return snapshot
  }
  return null
}

export class SanctumOverlay {
  constructor({ service, detection, BrowserWindowClass, screenApi, platform = process.platform, now = Date.now,
    setIntervalFn = setInterval, clearIntervalFn = clearInterval, settle = () => new Promise(resolve => setTimeout(resolve, 50)),
    commandLine }) {
    Object.assign(this, { service, detection, BrowserWindowClass, screenApi, platform, now, clearIntervalFn, settle, commandLine })
    this.window = null; this.hiddenCaptures = 0; this.closed = false
    this.unsubscribe = service.subscribe(() => this.sync())
    this.unsubscribeDetection = detection?.subscribe(() => this.sync())
    this.timer = setIntervalFn(() => this.sync(), 250)
    this.timer?.unref?.()
  }
  ensureWindow() {
    if (this.window && !this.window.isDestroyed()) return this.window
    const window = new this.BrowserWindowClass({ show: false, frame: false, thickFrame: false, transparent: true, backgroundColor: '#00000000',
      focusable: false, resizable: false, movable: false, skipTaskbar: true, hasShadow: false,
      webPreferences: { preload: path.resolve(moduleDir, '../../preload.cjs'), nodeIntegration: false, contextIsolation: true, backgroundThrottling: false } })
    this.window = window
    window.setAlwaysOnTop(true, 'screen-saver')
    // 纯展示浮窗不需要移动事件；隐藏后也不应保留鼠标转发。
    window.setIgnoreMouseEvents(true, { forward: false })
    window.setContentProtection(true)
    window.webContents.on('did-finish-load', () => this.sync())
    window.on('closed', () => { if (this.window === window) this.window = null })
    const url = process.env.VITE_DEV_SERVER_URL
    const loading = url ? window.loadURL(`${url}#/sanctum-overlay`) : window.loadFile(path.resolve(moduleDir, '../../../dist/index.html'), { hash: '/sanctum-overlay' })
    Promise.resolve(loading).catch(() => { if (this.window === window) { window.destroy(); this.window = null } })
    return window
  }
  sync() {
    if (this.closed) return false
    let state = this.service.getState()
    if (!state.running && !state.highlight && this.service.getResultState) {
      state = this.service.getResultState?.(this.detection?.getState(), this.now())
      if (!state) { this.hide(); return false }
    }
    const snapshot = sanctumOverlaySnapshot(state, this.now())
    if (!snapshot || this.hiddenCaptures) { this.hide(); return false }
    const window = this.ensureWindow()
    if (window.webContents.isLoadingMainFrame()) return false
    const client = state.observation.clientBounds
    const bounds = physicalRectangleToDipBounds({ left: client.x, top: client.y, right: client.x + client.width, bottom: client.y + client.height },
      this.platform, rect => this.screenApi.screenToDipRect(null, rect))
    const currentBounds = window.getBounds()
    if (['x', 'y', 'width', 'height'].some(key => currentBounds[key] !== bounds[key])) {
      window.setBounds(bounds, false)
    }
    window.webContents.send('sanctum:overlay', snapshot)
    if (!window.isVisible()) setWindowVisibilityImmediately(window, true, this.commandLine)
    return true
  }
  hide() {
    if (this.window && !this.window.isDestroyed() && this.window.isVisible()) setWindowVisibilityImmediately(this.window, false, this.commandLine)
  }
  async withHidden(operation) {
    if (this.closed) throw new Error('圣所浮窗已关闭')
    this.hiddenCaptures++
    this.hide()
    try { await this.settle(); return await operation() }
    finally { this.hiddenCaptures--; this.sync() }
  }
  destroy() {
    this.closed = true
    this.unsubscribe?.(); this.unsubscribeDetection?.(); this.clearIntervalFn(this.timer)
    this.window?.destroy(); this.window = null
  }
}
