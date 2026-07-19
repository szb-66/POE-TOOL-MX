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

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow = null
let overlayWindow = null

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
