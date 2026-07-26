/**
 * Purpose: 窗口管理模块，负责创建和管理主窗口和覆盖层窗口
 * Inputs: 无（通过函数调用）
 * Outputs: 窗口对象引用
 * Preconditions: Electron app 已初始化
 * Edge cases: 窗口已存在时返回现有窗口；图标加载失败时跳过设置
 * Errors: 窗口创建失败时抛出异常
 */

import { BrowserWindow, screen, nativeImage, desktopCapturer } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadWindowState, saveWindowState } from './state.js'
import {
  STORY_GRIP_HTML,
  getStoryGripBounds,
  getStoryOverlayBoundsFromGrip
} from './storyGrip.js'
import {
  dipRectangleToPhysical,
  getRectangleSize,
  hasUsefulPixelVariance,
  isRegionLargeEnough,
  physicalRectangleToImageCrop,
  toGlobalDipPoint
} from './coordinates.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow = null
let overlayWindow = null
let storyOverlayWindow = null
let storyOverlayGripWindow = null
let storyOverlaySnapshot = null
let storyOverlaySize = { width: 560, height: 360 }

export function createMainWindow() {
  const state = loadWindowState()

  // 设置应用图标
  const iconPath = path.join(__dirname, '../../../src/assets/images/LOGO.png')
  const icon = nativeImage.createFromPath(iconPath)

  const options = {
    width: state.width || 1200,
    height: state.height || 800,
    frame: false,
    icon: icon.isEmpty() ? undefined : icon, // 如果图标加载失败则不设置
    webPreferences: {
      preload: path.join(__dirname, '../../preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // 允许加载本地文件
    }
  }

  // 只有在坐标有效时才设置位置
  if (state.x !== undefined && state.y !== undefined) {
    // 检查位置是否在当前屏幕范围内
    const displays = screen.getAllDisplays()
    const isVisible = displays.some(display => {
      const bounds = display.bounds
      return state.x >= bounds.x && state.x < bounds.x + bounds.width &&
        state.y >= bounds.y && state.y < bounds.y + bounds.height
    })

    if (isVisible) {
      options.x = state.x
      options.y = state.y
    }
  }

  mainWindow = new BrowserWindow(options)

  const notifyDevToolsVisibility = (visible) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('devtools-visibility-changed', visible)
    }
  }

  mainWindow.webContents.on('devtools-opened', () => notifyDevToolsVisibility(true))
  mainWindow.webContents.on('devtools-closed', () => notifyDevToolsVisibility(false))

  // 恢复状态
  if (state.isMaximized) {
    mainWindow.maximize()
  }
  if (state.isFullScreen) {
    mainWindow.setFullScreen(true)
  }
  if (state.alwaysOnTop) {
    mainWindow.setAlwaysOnTop(true)
  }

  // 窗口状态保存逻辑
  let resizeTimeout
  const saveState = () => {
    if (!mainWindow) return

    try {
      const isMaximized = mainWindow.isMaximized()
      const isFullScreen = mainWindow.isFullScreen()
      const bounds = mainWindow.getBounds()

      const newState = {
        isMaximized,
        isFullScreen,
        alwaysOnTop: mainWindow.isAlwaysOnTop()
      }

      // 如果不是最大化也不是全屏，才保存尺寸和位置
      if (!isMaximized && !isFullScreen) {
        newState.x = bounds.x
        newState.y = bounds.y
        newState.width = bounds.width
        newState.height = bounds.height
      }

      saveWindowState(newState)
    } catch (e) {
      // 保存窗口状态出错
    }
  }

  const debouncedSaveState = () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(saveState, 500)
  }

  mainWindow.on('resize', debouncedSaveState)
  mainWindow.on('move', debouncedSaveState)
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized', true)
    saveState()
  })
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized', false)
    saveState()
  })
  mainWindow.on('enter-full-screen', saveState)
  mainWindow.on('leave-full-screen', saveState)
  mainWindow.on('always-on-top-changed', saveState)

  // 获取开发服务器 URL
  const devServerUrl = process.env.VITE_DEV_SERVER_URL

  // 开发环境加载本地服务器，生产环境加载打包后的文件
  if (process.env.NODE_ENV === 'development' && devServerUrl) {
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../../dist/index.html'))
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    // 页面加载失败
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    closeOverlayWindow()
    closeStoryOverlayWindow()
  })

  return mainWindow
}

export function createOverlayWindow() {
  if (overlayWindow) return overlayWindow

  const { width } = screen.getPrimaryDisplay().workAreaSize

  // 设置应用图标
  const iconPath = path.join(__dirname, '../../../src/assets/images/LOGO.png')
  const icon = nativeImage.createFromPath(iconPath)

  overlayWindow = new BrowserWindow({
    width: 300,
    height: 400,
    x: width - 320,
    y: 20,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000', // 关键：设置背景颜色为完全透明
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false, // 不获取焦点
    resizable: false,
    icon: icon.isEmpty() ? undefined : icon, // 如果图标加载失败则不设置
    webPreferences: {
      preload: path.join(__dirname, '../../preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // 允许加载本地文件
    }
  })

  // 加载覆盖层路由
  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (process.env.NODE_ENV === 'development' && devServerUrl) {
    overlayWindow.loadURL(`${devServerUrl}#/overlay`)
  } else {
    overlayWindow.loadFile(path.join(__dirname, '../../../dist/index.html'), { hash: '/overlay' })
  }

  overlayWindow.setIgnoreMouseEvents(true, { forward: true }) // 允许鼠标事件转发，实现部分区域可交互

  // 监听渲染进程发送的鼠标事件设置
  overlayWindow.webContents.on('ipc-message', (event, channel, ...args) => {
    if (channel === 'set-ignore-mouse-events') {
      const ignore = args[0]
      overlayWindow.setIgnoreMouseEvents(ignore, { forward: true })
    }
  })

  overlayWindow.on('closed', () => {
    overlayWindow = null
  })

  return overlayWindow
}

export function closeOverlayWindow() {
  if (overlayWindow) {
    overlayWindow.close()
    overlayWindow = null
  }
}

export function getMainWindow() {
  return mainWindow
}

export function getOverlayWindow() {
  return overlayWindow
}

function getStoryOverlayBounds(width, height) {
  const saved = loadWindowState().storyOverlayBounds
  const displays = screen.getAllDisplays()
  if (saved && displays.some(display => {
    const bounds = display.workArea
    return saved.x + 80 >= bounds.x && saved.x < bounds.x + bounds.width &&
      saved.y + 40 >= bounds.y && saved.y < bounds.y + bounds.height
  })) {
    return { x: Math.round(saved.x), y: Math.round(saved.y), width, height }
  }
  const primary = screen.getPrimaryDisplay().workArea
  return {
    x: Math.round(primary.x + (primary.width - width) / 2),
    y: primary.y + 20,
    width,
    height
  }
}

function syncStoryGripToOverlay() {
  if (!storyOverlayWindow || storyOverlayWindow.isDestroyed() || !storyOverlayGripWindow || storyOverlayGripWindow.isDestroyed()) return
  const expected = getStoryGripBounds({ ...storyOverlayWindow.getBounds(), ...storyOverlaySize })
  const current = storyOverlayGripWindow.getBounds()
  if (current.x !== expected.x || current.y !== expected.y || current.width !== expected.width || current.height !== expected.height) {
    storyOverlayGripWindow.setBounds(expected)
  }
}

function createStoryGripWindow() {
  if (!storyOverlayWindow || storyOverlayWindow.isDestroyed()) return null
  if (storyOverlayGripWindow && !storyOverlayGripWindow.isDestroyed()) return storyOverlayGripWindow

  storyOverlayGripWindow = new BrowserWindow({
    ...getStoryGripBounds(storyOverlayWindow.getBounds()),
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    resizable: false,
    movable: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })
  storyOverlayGripWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(STORY_GRIP_HTML)}`)
  storyOverlayGripWindow.setAlwaysOnTop(true, 'screen-saver')
  storyOverlayGripWindow.once('ready-to-show', () => {
    if (storyOverlayGripWindow && !storyOverlayGripWindow.isDestroyed() && storyOverlayWindow?.isVisible()) {
      storyOverlayGripWindow.showInactive()
    }
  })
  storyOverlayGripWindow.on('move', () => {
    if (!storyOverlayWindow || storyOverlayWindow.isDestroyed() || !storyOverlayGripWindow || storyOverlayGripWindow.isDestroyed()) return
    const overlayBounds = storyOverlayWindow.getBounds()
    const gripBounds = storyOverlayGripWindow.getBounds()
    const next = getStoryOverlayBoundsFromGrip(gripBounds, overlayBounds, storyOverlaySize)
    if (overlayBounds.x !== next.x || overlayBounds.y !== next.y) {
      storyOverlayWindow.setBounds(next)
    }
  })
  storyOverlayGripWindow.on('closed', () => { storyOverlayGripWindow = null })
  return storyOverlayGripWindow
}

export function createStoryOverlayWindow(initialSnapshot = null, configuredWidth = 560) {
  if (initialSnapshot) storyOverlaySnapshot = initialSnapshot
  if (storyOverlayWindow && !storyOverlayWindow.isDestroyed()) {
    resizeStoryOverlay({ width: configuredWidth })
    storyOverlayWindow.showInactive()
    createStoryGripWindow()?.showInactive()
    if (initialSnapshot) storyOverlayWindow.webContents.send('story-overlay-state', initialSnapshot)
    return storyOverlayWindow
  }

  const width = Math.max(360, Math.min(1200, Math.round(Number(configuredWidth) || 560)))
  const height = 360
  storyOverlaySize = { width, height }
  storyOverlayWindow = new BrowserWindow({
    ...getStoryOverlayBounds(width, height),
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../../preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  })
  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (process.env.NODE_ENV === 'development' && devServerUrl) {
    storyOverlayWindow.loadURL(`${devServerUrl}#/story-overlay`)
  } else {
    storyOverlayWindow.loadFile(path.join(__dirname, '../../../dist/index.html'), { hash: '/story-overlay' })
  }

  storyOverlayWindow.setIgnoreMouseEvents(true, { forward: true })
  createStoryGripWindow()
  storyOverlayWindow.webContents.once('did-finish-load', () => {
    if (!storyOverlayWindow || storyOverlayWindow.isDestroyed()) return
    if (initialSnapshot) storyOverlayWindow.webContents.send('story-overlay-state', initialSnapshot)
    storyOverlayWindow.showInactive()
    syncStoryGripToOverlay()
    storyOverlayGripWindow?.showInactive()
  })

  let saveTimer
  storyOverlayWindow.on('move', () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      if (!storyOverlayWindow || storyOverlayWindow.isDestroyed()) return
      const { x, y } = storyOverlayWindow.getBounds()
      saveWindowState({ storyOverlayBounds: { x, y } })
    }, 250)
  })
  storyOverlayWindow.on('closed', () => {
    clearTimeout(saveTimer)
    if (storyOverlayGripWindow && !storyOverlayGripWindow.isDestroyed()) storyOverlayGripWindow.close()
    storyOverlayGripWindow = null
    storyOverlayWindow = null
  })
  return storyOverlayWindow
}

export function resizeStoryOverlay(size) {
  if (!storyOverlayWindow || storyOverlayWindow.isDestroyed()) return false
  const display = screen.getDisplayMatching(storyOverlayWindow.getBounds())
  const maxHeight = Math.max(260, Math.floor(display.workArea.height * 0.7))
  const bounds = storyOverlayWindow.getBounds()
  const requestedHeight = typeof size === 'object' ? size?.height : size
  const requestedWidth = typeof size === 'object' ? size?.width : null
  const nextHeight = requestedHeight == null ? storyOverlaySize.height : Math.max(240, Math.min(maxHeight, Math.round(Number(requestedHeight) || 360)))
  const maxWidth = Math.max(360, display.workArea.width)
  const nextWidth = requestedWidth == null ? storyOverlaySize.width : Math.max(360, Math.min(maxWidth, Math.round(Number(requestedWidth) || 560)))
  storyOverlaySize = { width: nextWidth, height: nextHeight }
  const maxX = display.workArea.x + display.workArea.width - nextWidth
  const nextX = Math.max(display.workArea.x, Math.min(maxX, bounds.x))
  storyOverlayWindow.setBounds({ ...bounds, x: nextX, width: nextWidth, height: nextHeight })
  syncStoryGripToOverlay()
  return true
}

export function updateStoryOverlay(snapshot) {
  storyOverlaySnapshot = snapshot || null
  if (storyOverlayWindow && !storyOverlayWindow.isDestroyed()) {
    storyOverlayWindow.webContents.send('story-overlay-state', storyOverlaySnapshot)
  }
  return true
}

export function getStoryOverlaySnapshot() {
  return storyOverlaySnapshot
}

export function closeStoryOverlayWindow() {
  if (storyOverlayGripWindow && !storyOverlayGripWindow.isDestroyed()) storyOverlayGripWindow.close()
  storyOverlayGripWindow = null
  if (storyOverlayWindow && !storyOverlayWindow.isDestroyed()) storyOverlayWindow.close()
  storyOverlayWindow = null
}

export function getStoryOverlayWindow() {
  return storyOverlayWindow
}

export function getStoryOverlayGripWindow() {
  return storyOverlayGripWindow
}

function tryShowConsolePanel() {
  const devTools = mainWindow?.webContents.devToolsWebContents
  if (!devTools || devTools.isDestroyed()) return

  devTools.executeJavaScript(`
    (() => {
      const inspectorView = globalThis.UI?.InspectorView?.InspectorView?.instance?.()
      return inspectorView?.showPanel?.('console')
    })()
  `).catch(() => {})
}

export function setDevToolsVisible(visible) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return false
  }

  if (visible) {
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.openDevTools({ mode: 'right', activate: true })
    }
    setTimeout(tryShowConsolePanel, 100)
  } else if (mainWindow.webContents.isDevToolsOpened()) {
    mainWindow.webContents.closeDevTools()
  }

  return mainWindow.webContents.isDevToolsOpened()
}

export function getDevToolsVisible() {
  return Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents.isDevToolsOpened())
}

export function toggleDevTools() {
  return setDevToolsVisible(!getDevToolsVisible())
}

let screenPickerSession = null

function settleScreenPicker(result) {
  const session = screenPickerSession
  if (!session || session.settled) return

  session.settled = true
  screenPickerSession = null

  session.windows.forEach(win => {
    if (!win.isDestroyed()) win.close()
  })
  session.screenshots.clear()
  session.resolve(result)
}

function physicalDisplayBounds(display) {
  if (process.platform !== 'win32') return { ...display.bounds }
  const topLeft = screen.dipToScreenPoint({ x: display.bounds.x, y: display.bounds.y })
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: Math.round(display.bounds.width * display.scaleFactor),
    height: Math.round(display.bounds.height * display.scaleFactor)
  }
}

async function captureDisplays(displays) {
  const maximum = displays.reduce((size, display) => {
    const physical = physicalDisplayBounds(display)
    return { width: Math.max(size.width, physical.width), height: Math.max(size.height, physical.height) }
  }, { width: 1, height: 1 })
  const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: maximum })
  const screenshots = new Map()
  displays.forEach((display) => {
    const source = sources.find(item => String(item.display_id) === String(display.id))
    if (!source || source.thumbnail.isEmpty()) throw new Error(`无法捕获显示器 ${display.id} 的画面`)
    screenshots.set(String(display.id), source.thumbnail)
  })
  return screenshots
}

function createScreenPickerSession(mode, screenshots = new Map()) {
  if (screenPickerSession) {
    return mode === screenPickerSession.mode
      ? screenPickerSession.promise
      : Promise.resolve({ canceled: true, error: '已有其他屏幕选取会话正在进行' })
  }

  let resolveSession
  const promise = new Promise(resolve => {
    resolveSession = resolve
  })

  screenPickerSession = {
    mode,
    promise,
    resolve: resolveSession,
    windows: [],
    contexts: new Map(),
    screenshots,
    settled: false
  }

  return promise
}

function openScreenPickerWindows(mode, displays) {
  const session = screenPickerSession
  if (!session || session.mode !== mode) return

  try {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL

    displays.forEach(display => {
      const pickerWindow = new BrowserWindow({
        ...display.bounds,
        frame: false,
        transparent: true,
        backgroundColor: '#22000000',
        alwaysOnTop: true,
        skipTaskbar: true,
        focusable: true,
        resizable: false,
        movable: false,
        fullscreenable: false,
        show: false,
        webPreferences: {
          preload: path.join(__dirname, '../../preload.cjs'),
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false
        }
      })

      session.windows.push(pickerWindow)
      const physicalBounds = physicalDisplayBounds(display)
      session.contexts.set(pickerWindow.webContents.id, {
        mode,
        displayId: String(display.id),
        scaleFactor: display.scaleFactor,
        displayDipBounds: display.bounds,
        displayPhysicalBounds: physicalBounds,
        minimumSize: { width: 20, height: 10 }
      })
      pickerWindow.setAlwaysOnTop(true, 'screen-saver')
      pickerWindow.once('ready-to-show', () => {
        if (!pickerWindow.isDestroyed()) pickerWindow.show()
      })
      pickerWindow.webContents.once('did-fail-load', () => settleScreenPicker({ canceled: true }))
      pickerWindow.on('closed', () => settleScreenPicker({ canceled: true }))

      if (process.env.NODE_ENV === 'development' && devServerUrl) {
        pickerWindow.loadURL(`${devServerUrl}#/coordinate-picker`)
      } else {
        pickerWindow.loadFile(path.join(__dirname, '../../../dist/index.html'), { hash: '/coordinate-picker' })
      }
    })
  } catch (error) {
    settleScreenPicker({ canceled: true, error: error.message })
  }
}

export function pickScreenCoordinate() {
  if (screenPickerSession) return createScreenPickerSession('point')
  const promise = createScreenPickerSession('point')
  openScreenPickerWindows('point', screen.getAllDisplays())
  return promise
}

export async function pickScreenRegion() {
  if (screenPickerSession) return createScreenPickerSession('region')
  const displays = screen.getAllDisplays()
  let screenshots
  try {
    screenshots = await captureDisplays(displays)
  } catch (error) {
    return { canceled: true, error: error.message }
  }
  const promise = createScreenPickerSession('region', screenshots)
  openScreenPickerWindows('region', displays)
  return promise
}

export function getScreenPickerContext(sender) {
  return screenPickerSession?.contexts.get(sender.id) || null
}

export function submitCoordinatePickerPoint(sender, clientPoint) {
  const session = screenPickerSession
  if (!session || session.mode !== 'point') return false

  const pickerWindow = BrowserWindow.fromWebContents(sender)
  if (!pickerWindow || !session.windows.includes(pickerWindow)) return false

  const globalDipPoint = toGlobalDipPoint(pickerWindow.getBounds(), clientPoint)
  const physicalPoint = process.platform === 'win32'
    ? screen.dipToScreenPoint(globalDipPoint)
    : globalDipPoint

  settleScreenPicker({
    canceled: false,
    x: physicalPoint.x,
    y: physicalPoint.y
  })
  return true
}

export function submitScreenPickerRegion(sender, clientRectangle) {
  const session = screenPickerSession
  if (!session || session.mode !== 'region') return false
  const pickerWindow = BrowserWindow.fromWebContents(sender)
  const context = session.contexts.get(sender.id)
  if (!pickerWindow || !context || !session.windows.includes(pickerWindow)) return false
  const convert = process.platform === 'win32' ? (point) => screen.dipToScreenPoint(point) : (point) => point
  const selectedRegion = dipRectangleToPhysical(pickerWindow.getBounds(), clientRectangle, convert)
  if (!isRegionLargeEnough(selectedRegion)) return false
  const screenshot = session.screenshots.get(context.displayId)
  try {
    if (!screenshot || screenshot.isEmpty()) throw new Error('选区截图不可用')
    const imageSize = screenshot.getSize()
    const crop = physicalRectangleToImageCrop(selectedRegion, context.displayPhysicalBounds, imageSize)
    let template = screenshot.crop({ x: crop.x, y: crop.y, width: crop.width, height: crop.height })
    if (template.isEmpty()) throw new Error('选区截图为空')
    if (crop.width !== crop.targetSize.width || crop.height !== crop.targetSize.height) {
      template = template.resize({ ...crop.targetSize, quality: 'best' })
    }
    if (!hasUsefulPixelVariance(template.getBitmap())) throw new Error('选区图像信息过少，请框选包含清晰文字的区域')
    const size = getRectangleSize(selectedRegion)
    settleScreenPicker({
      canceled: false,
      displayId: context.displayId,
      scaleFactor: context.scaleFactor,
      displayPhysicalBounds: context.displayPhysicalBounds,
      selectedRegion,
      templateSize: size,
      png: template.toPNG()
    })
  } catch (error) {
    settleScreenPicker({ canceled: true, error: error.message })
  }
  return true
}

export function cancelCoordinatePicker() {
  settleScreenPicker({ canceled: true })
}

let debugWindow = null

export function createDebugWindow() {
  if (debugWindow) return debugWindow

  // 获取主屏幕尺寸
  const { x, y, width, height } = screen.getPrimaryDisplay().bounds

  debugWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, '../../preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  })

  // 加载路由
  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (process.env.NODE_ENV === 'development' && devServerUrl) {
    debugWindow.loadURL(`${devServerUrl}#/debug-overlay`)
  } else {
    debugWindow.loadFile(path.join(__dirname, '../../../dist/index.html'), { hash: '/debug-overlay' })
  }

  // 忽略鼠标事件，允许点击穿透
  debugWindow.setIgnoreMouseEvents(true, { forward: true })

  debugWindow.on('closed', () => {
    debugWindow = null
  })

  return debugWindow
}

export function closeDebugWindow() {
  if (debugWindow) {
    debugWindow.close()
    debugWindow = null
  }
}

export function getDebugWindow() {
  return debugWindow
}
