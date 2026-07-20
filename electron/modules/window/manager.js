/**
 * Purpose: 窗口管理模块，负责创建和管理主窗口和覆盖层窗口
 * Inputs: 无（通过函数调用）
 * Outputs: 窗口对象引用
 * Preconditions: Electron app 已初始化
 * Edge cases: 窗口已存在时返回现有窗口；图标加载失败时跳过设置
 * Errors: 窗口创建失败时抛出异常
 */

import { BrowserWindow, screen, nativeImage } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadWindowState, saveWindowState } from './state.js'
import { toGlobalDipPoint } from './coordinates.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow = null
let overlayWindow = null
let storyOverlayWindow = null
let storyOverlaySnapshot = null

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

export function createStoryOverlayWindow(initialSnapshot = null) {
  if (initialSnapshot) storyOverlaySnapshot = initialSnapshot
  if (storyOverlayWindow && !storyOverlayWindow.isDestroyed()) {
    storyOverlayWindow.showInactive()
    if (initialSnapshot) storyOverlayWindow.webContents.send('story-overlay-state', initialSnapshot)
    return storyOverlayWindow
  }

  const width = 560
  const height = 360
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
  storyOverlayWindow.webContents.on('ipc-message', (event, channel, ...args) => {
    if (channel === 'set-ignore-mouse-events' && storyOverlayWindow) {
      storyOverlayWindow.setIgnoreMouseEvents(Boolean(args[0]), { forward: true })
    }
  })
  storyOverlayWindow.webContents.once('did-finish-load', () => {
    if (!storyOverlayWindow || storyOverlayWindow.isDestroyed()) return
    if (initialSnapshot) storyOverlayWindow.webContents.send('story-overlay-state', initialSnapshot)
    storyOverlayWindow.showInactive()
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
    storyOverlayWindow = null
  })
  return storyOverlayWindow
}

export function resizeStoryOverlay(height) {
  if (!storyOverlayWindow || storyOverlayWindow.isDestroyed()) return false
  const display = screen.getDisplayMatching(storyOverlayWindow.getBounds())
  const maxHeight = Math.max(260, Math.floor(display.workArea.height * 0.7))
  const nextHeight = Math.max(240, Math.min(maxHeight, Math.round(Number(height) || 360)))
  const bounds = storyOverlayWindow.getBounds()
  storyOverlayWindow.setBounds({ ...bounds, height: nextHeight })
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
  if (storyOverlayWindow && !storyOverlayWindow.isDestroyed()) storyOverlayWindow.close()
  storyOverlayWindow = null
}

export function getStoryOverlayWindow() {
  return storyOverlayWindow
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

let coordinatePickerSession = null

function settleCoordinatePicker(result) {
  const session = coordinatePickerSession
  if (!session || session.settled) return

  session.settled = true
  coordinatePickerSession = null

  session.windows.forEach(win => {
    if (!win.isDestroyed()) win.close()
  })
  session.resolve(result)
}

export function pickScreenCoordinate() {
  if (coordinatePickerSession) {
    return coordinatePickerSession.promise
  }

  let resolveSession
  const promise = new Promise(resolve => {
    resolveSession = resolve
  })

  coordinatePickerSession = {
    promise,
    resolve: resolveSession,
    windows: [],
    settled: false
  }

  try {
    const displays = screen.getAllDisplays()
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

      coordinatePickerSession.windows.push(pickerWindow)
      pickerWindow.setAlwaysOnTop(true, 'screen-saver')
      pickerWindow.once('ready-to-show', () => {
        if (!pickerWindow.isDestroyed()) pickerWindow.show()
      })
      pickerWindow.webContents.once('did-fail-load', () => settleCoordinatePicker({ canceled: true }))
      pickerWindow.on('closed', () => settleCoordinatePicker({ canceled: true }))

      if (process.env.NODE_ENV === 'development' && devServerUrl) {
        pickerWindow.loadURL(`${devServerUrl}#/coordinate-picker`)
      } else {
        pickerWindow.loadFile(path.join(__dirname, '../../../dist/index.html'), { hash: '/coordinate-picker' })
      }
    })
  } catch (error) {
    settleCoordinatePicker({ canceled: true, error: error.message })
  }

  return promise
}

export function submitCoordinatePickerPoint(sender, clientPoint) {
  const session = coordinatePickerSession
  if (!session) return false

  const pickerWindow = BrowserWindow.fromWebContents(sender)
  if (!pickerWindow || !session.windows.includes(pickerWindow)) return false

  const globalDipPoint = toGlobalDipPoint(pickerWindow.getBounds(), clientPoint)
  const physicalPoint = process.platform === 'win32'
    ? screen.dipToScreenPoint(globalDipPoint)
    : globalDipPoint

  settleCoordinatePicker({
    canceled: false,
    x: physicalPoint.x,
    y: physicalPoint.y
  })
  return true
}

export function cancelCoordinatePicker() {
  settleCoordinatePicker({ canceled: true })
}

let debugWindow = null

export function createDebugWindow() {
  if (debugWindow) return debugWindow

  // 获取主屏幕尺寸
  const { width, height } = screen.getPrimaryDisplay().bounds

  debugWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
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
