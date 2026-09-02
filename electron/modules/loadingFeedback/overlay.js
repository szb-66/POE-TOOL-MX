/**
 * 文件职责：在当前游戏窗口顶部呈现不抢焦点的加载反馈浮层。
 * 主要入口：loadingFeedbackBounds、LoadingFeedbackOverlayManager.publish/close。
 * 关键依赖：Electron BrowserWindow/screen、物理坐标到 DIP 转换、Vite 开发页或 dist 页面。
 * 边界：窗口不可聚焦且鼠标穿透；边界或可见快照缺失时隐藏。
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { physicalRectangleToDipBounds } from '../window/coordinates.js'
import { LOADING_FEEDBACK_CHANNEL } from '../../../shared/loadingFeedback.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const WIDTH = 460
const HEIGHT = 68
const TOP_MARGIN = 24

// Purpose: 将游戏物理像素边界转为顶部居中的 DIP 浮层边界；缺失边界返回 null。
export function loadingFeedbackBounds(gameBounds, screenApi, platform = process.platform) {
  if (!gameBounds) return null
  const game = physicalRectangleToDipBounds(gameBounds, platform, rectangle => screenApi.screenToDipRect(null, rectangle))
  const width = Math.min(WIDTH, game.width)
  const height = Math.min(HEIGHT, game.height)
  return {
    x: Math.round(game.x + (game.width - width) / 2),
    y: Math.round(game.y + Math.min(TOP_MARGIN, Math.max(0, game.height - height))),
    width,
    height
  }
}

/**
 * Purpose: 管理游戏加载反馈窗口的惰性创建、定位、发布与销毁。
 * Preconditions: BrowserWindowClass 和 screenApi 由 Electron ready 后注入。
 * Errors: 页面未完成加载时保留最新快照，待 did-finish-load 重发。
 */
export class LoadingFeedbackOverlayManager {
  constructor({ BrowserWindowClass, screenApi, platform = process.platform } = {}) {
    this.BrowserWindowClass = BrowserWindowClass
    this.screenApi = screenApi
    this.platform = platform
    this.window = null
    this.snapshot = null
    this.bounds = null
  }

  // Purpose: 惰性创建不可交互的反馈窗口；已存在时复用同一实例。
  ensureWindow() {
    if (this.window && !this.window.isDestroyed()) return this.window
    const window = new this.BrowserWindowClass({
      width: WIDTH,
      height: HEIGHT,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      resizable: false,
      movable: false,
      hasShadow: false,
      show: false,
      webPreferences: {
        preload: path.resolve(moduleDir, '../../preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false
      }
    })
    window.setAlwaysOnTop(true, 'screen-saver')
    window.setFocusable(false)
    window.setIgnoreMouseEvents(true, { forward: true })
    this.window = window
    const devServerUrl = process.env.VITE_DEV_SERVER_URL
    if (process.env.NODE_ENV === 'development' && devServerUrl) void window.loadURL(`${devServerUrl}#/loading-feedback-overlay`)
    else void window.loadFile(path.resolve(moduleDir, '../../../dist/index.html'), { hash: '/loading-feedback-overlay' })
    window.webContents.on('did-finish-load', () => this.publishCurrent())
    window.on('closed', () => { if (this.window === window) this.window = null })
    return window
  }

  // Inputs: 受控快照和当前游戏边界；不可见时隐藏，可见时发布最新状态。
  publish(snapshot, gameBounds) {
    this.snapshot = snapshot
    this.bounds = loadingFeedbackBounds(gameBounds, this.screenApi, this.platform)
    if (!snapshot?.visible || !this.bounds) {
      if (this.window && !this.window.isDestroyed()) this.window.hide()
      return false
    }
    this.ensureWindow()
    return this.publishCurrent()
  }

  // Outputs: 页面已就绪时发送快照并 showInactive；未就绪时返回 false 等待重发。
  publishCurrent() {
    const window = this.window
    if (!window || window.isDestroyed() || !this.snapshot?.visible || !this.bounds || window.webContents.isLoadingMainFrame()) return false
    window.setBounds(this.bounds, false)
    window.webContents.send(LOADING_FEEDBACK_CHANNEL, structuredClone(this.snapshot))
    window.showInactive()
    return true
  }

  // Purpose: 销毁窗口并清空快照/边界引用；重复调用安全。
  close() {
    const window = this.window
    this.window = null
    this.snapshot = null
    this.bounds = null
    if (window && !window.isDestroyed()) window.close()
  }
}
