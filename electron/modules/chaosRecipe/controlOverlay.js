import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CHAOS_CONTROL_DIP_SIZE,
  DEFAULT_CHAOS_CONTROL_OFFSET,
  normalizeControlOffset,
  placeControlInDip
} from './controlOverlayPosition.js'
import {
  CHAOS_GRID_LAYOUT_LABELS,
  missingCalibrationKeys
} from './layout.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

export class ChaosRecipeControlOverlay {
  constructor({ getMainWindow, interfaceDetection, automationLock }) {
    this.getMainWindow = getMainWindow
    this.interfaceDetection = interfaceDetection
    this.automationLock = automationLock
    this.service = null
    this.window = null
    this.enabled = false
    this.runtime = {
      league: '',
      selectedTabIds: [],
      includeIdentified: false,
      targetSetCount: 1,
      calibration: { root: null, folder: null },
      templates: {},
      matchThreshold: 0.8,
      operationDelayMs: 80,
      controlOverlayOffset: { ...DEFAULT_CHAOS_CONTROL_OFFSET }
    }
    this.detection = interfaceDetection?.getState?.() || {}
    this.disposeDetection = interfaceDetection?.subscribe((state) => {
      this.detection = state
      this.sync()
    })
    this.disposeAutomationLock = automationLock?.subscribe(() => this.sync())
  }

  attachService(service) {
    this.service = service
    this.sync()
  }

  setRuntime(runtime = {}) {
    this.enabled = Boolean(runtime.enabled)
    this.runtime = {
      ...this.runtime,
      ...structuredClone(runtime),
      selectedTabIds: Array.isArray(runtime.selectedTabIds) ? runtime.selectedTabIds.map(String) : this.runtime.selectedTabIds,
      controlOverlayOffset: normalizeControlOffset(runtime.controlOverlayOffset ?? this.runtime.controlOverlayOffset)
    }
    this.sync()
    return this.getState()
  }

  computeState() {
    const auth = this.service?.getAuthStatus?.() || {}
    const snapshot = this.service?.snapshot
    const automation = this.service?.automation?.getStatus?.() || { status: 'idle' }
    const selected = this.runtime.selectedTabIds.length > 0
    const canRefresh = Boolean(auth.authenticated && this.runtime.league && selected)
    const missingCalibrations = missingCalibrationKeys(snapshot?.tabs, this.runtime.calibration)
    const calibrated = missingCalibrations.length === 0
    const fullSetCount = Math.max(0, Number(snapshot?.fullSetCount) || 0)
    const missingCalibrationMessage = missingCalibrations.length
      ? `缺少${missingCalibrations.map((key) => CHAOS_GRID_LAYOUT_LABELS[key]).join('、')}校准`
      : ''
    const canPreview = Boolean(fullSetCount && calibrated)
    const lock = this.automationLock?.getState?.() || { locked: false, owner: '' }
    const occupiedByOther = lock.locked && lock.owner !== '混沌配方取件'
    const running = automation.status === 'running'
    const paused = automation.status === 'paused'
    let actionLabel = '自动取件'
    if (running) actionLabel = '停止取件'
    else if (paused) actionLabel = '继续取件'
    let actionReason = ''
    if (!running && !paused) {
      if (!canPreview) actionReason = !snapshot
        ? '请先刷新仓库'
        : !fullSetCount
          ? '当前快照没有完整套装'
          : missingCalibrationMessage
      else if (occupiedByOther) actionReason = `${lock.owner}正在运行`
    }
    const refreshReason = canRefresh ? '' : (!auth.authenticated ? '国服账号未认证' : '请先选择赛季和仓库页')
    const previewReason = canPreview
      ? ''
      : !snapshot
        ? '请先刷新仓库'
        : !fullSetCount
          ? '当前快照完整套装为 0'
          : missingCalibrationMessage
    const refreshLabel = canRefresh ? '刷新仓库' : (!auth.authenticated ? '账号未认证' : '未选择仓库')
    const previewLabel = canPreview
      ? '预览高亮'
      : fullSetCount && !calibrated
        ? '需要校准'
        : snapshot
          ? '暂无套装'
          : '先刷新仓库'
    if (!running && !paused && actionReason) {
      actionLabel = fullSetCount && !calibrated ? '需要校准' : (snapshot ? '无法取件' : '先刷新仓库')
    }
    const statusMessage = running
      ? `正在取件：${automation.completedItems || 0}/${automation.totalItems || 0}`
      : paused && automation.tabName
        ? `请切换到“${automation.tabName}”后继续`
        : refreshReason || (snapshot
            ? `完整套装 ${fullSetCount} · ${previewReason || actionReason || '操作已就绪'}`
            : previewReason || actionReason)
    return {
      visible: Boolean(this.enabled && this.detection.ready && this.detection.foreground && this.detection.gameBounds),
      enabled: this.enabled,
      ready: Boolean(this.detection.ready),
      foreground: Boolean(this.detection.foreground),
      refreshing: false,
      fullSetCount,
      canRefresh,
      refreshReason,
      refreshLabel,
      canPreview,
      previewReason,
      previewLabel,
      canRun: Boolean((running || paused) || (canPreview && !occupiedByOther)),
      actionLabel,
      actionReason,
      statusMessage,
      automation,
      message: automation.status === 'paused' && automation.tabName
        ? `请切换到“${automation.tabName}”`
        : '',
      offset: normalizeControlOffset(this.runtime.controlOverlayOffset)
    }
  }

  createWindow() {
    if (this.window && !this.window.isDestroyed()) return this.window
    this.window = new BrowserWindow({
      width: CHAOS_CONTROL_DIP_SIZE.width,
      height: CHAOS_CONTROL_DIP_SIZE.height,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      resizable: false,
      movable: false,
      show: false,
      hasShadow: false,
      webPreferences: {
        preload: path.resolve(moduleDir, '../../preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false
      }
    })
    this.window.setAlwaysOnTop(true, 'screen-saver')
    this.window.on('closed', () => { this.window = null })
    const devServerUrl = process.env.VITE_DEV_SERVER_URL
    if (process.env.NODE_ENV === 'development' && devServerUrl) {
      void this.window.loadURL(`${devServerUrl}#/chaos-recipe-control-overlay`)
    } else {
      void this.window.loadFile(path.resolve(moduleDir, '../../../dist/index.html'), {
        hash: '/chaos-recipe-control-overlay'
      })
    }
    return this.window
  }

  sync() {
    const state = this.computeState()
    if (!this.enabled) {
      this.close()
      return state
    }
    const window = this.createWindow()
    const placement = placeControlInDip(
      this.detection.gameBounds,
      this.runtime.controlOverlayOffset,
      process.platform === 'win32'
        ? {
            screenToDipPoint: (point) => screen.screenToDipPoint(point),
            dipToScreenPoint: (point) => screen.dipToScreenPoint(point)
          }
        : null
    )
    if (placement) {
      this.runtime.controlOverlayOffset = placement.offset
      window.setBounds(placement)
    }
    const publish = () => {
      if (!window.isDestroyed()) window.webContents.send('chaos-recipe-control-state', {
        ...state,
        offset: this.runtime.controlOverlayOffset
      })
    }
    if (window.webContents.isLoadingMainFrame()) window.webContents.once('did-finish-load', publish)
    else publish()
    if (state.visible && placement) window.showInactive()
    else window.hide()
    return state
  }

  getState() {
    return this.computeState()
  }

  moveToDip(x, y) {
    if (!this.window || this.window.isDestroyed() || !this.detection.gameBounds) return null
    const physical = process.platform === 'win32'
      ? screen.dipToScreenPoint({ x: Math.round(x), y: Math.round(y) })
      : { x: Math.round(x), y: Math.round(y) }
    this.runtime.controlOverlayOffset = normalizeControlOffset({
      x: physical.x - this.detection.gameBounds.left,
      y: physical.y - this.detection.gameBounds.top
    })
    this.sync()
    const mainWindow = this.getMainWindow?.()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('chaos-recipe-control-offset', this.runtime.controlOverlayOffset)
    }
    return this.runtime.controlOverlayOffset
  }

  close() {
    if (this.window && !this.window.isDestroyed()) this.window.close()
    this.window = null
  }

  cleanup() {
    this.disposeDetection?.()
    this.disposeAutomationLock?.()
    this.close()
  }
}
