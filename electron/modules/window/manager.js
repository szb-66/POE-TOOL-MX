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
  DEFAULT_STORY_DIVIDER_RATIO,
  STORY_DIVIDER_GRIP_HTML,
  getStoryDividerGripBounds,
  getStoryDividerRatioFromGrip,
  normalizeStoryDividerRatio,
  storyOverlayBoundsEqual
} from './storyGrip.js'
import { getBagOverlayBounds } from './bagOverlay.js'
import { getReloadAction } from './refreshShortcut.js'
import {
  OverlayDragPassthroughController,
  getFixedOverlayDragBounds,
  isPointInCenteredOverlayDragHandle
} from './overlayDrag.js'
import {
  dipRectangleToPhysical,
  getDisplayPhysicalBounds,
  getRectangleSize,
  hasUsefulPixelVariance,
  isRegionLargeEnough,
  physicalRectangleToImageCrop,
  resolveCaptureSources,
  toGlobalDipPoint
} from './coordinates.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow = null
let overlayWindow = null
let storyOverlayWindow = null
let storyOverlayDividerWindow = null
let bagStashOverlayWindow = null
let bagStashOverlaySnapshot = null
let storyOverlaySnapshot = null
let storyOverlaySize = { width: 460, height: 220 }
let storyOverlayLayout = null
let storyOverlayDividerRatio = DEFAULT_STORY_DIVIDER_RATIO
let storyOverlayOpacity = 100
const CRAFTING_OVERLAY_SIZE = Object.freeze({ width: 300, height: 400 })

const craftingOverlayDragPassthrough = new OverlayDragPassthroughController({
  getWindow: () => overlayWindow,
  getCursorPoint: () => screen.getCursorScreenPoint(),
  isPointInHandle: (point, bounds) => isPointInCenteredOverlayDragHandle(point, bounds)
})

const storyOverlayDragPassthrough = new OverlayDragPassthroughController({
  getWindow: () => storyOverlayWindow,
  getCursorPoint: () => screen.getCursorScreenPoint(),
  isPointInHandle: (point, bounds) => storyOverlayOpacity > 0 && storyOverlayWindow?.isVisible() &&
    isPointInCenteredOverlayDragHandle(point, bounds)
})

export function createMainWindow({ beforeLoad = null, diagnosticFailLoad = false } = {}) {
  const state = loadWindowState()

  // 设置应用图标
  const iconPath = path.join(__dirname, '../../../src/assets/images/LOGO.png')
  const icon = nativeImage.createFromPath(iconPath)

  const options = {
    width: state.width || 1200,
    height: state.height || 800,
    frame: false,
    backgroundColor: '#f5f7fa', // 页面加载前也显示应用底色，避免白屏
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
  beforeLoad?.(mainWindow)

  mainWindow.webContents.on('before-input-event', (event, input) => {
    const action = getReloadAction(input)
    if (!action) return
    event.preventDefault()
    if (action === 'force-reload') {
      mainWindow.webContents.reloadIgnoringCache()
    } else {
      mainWindow.webContents.reload()
    }
  })

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
  if (process.env.NODE_ENV === 'development' && diagnosticFailLoad) {
    mainWindow.loadFile(path.join(__dirname, '../../../dist/__missing_startup_diagnostic__.html'))
  } else if (process.env.NODE_ENV === 'development' && devServerUrl) {
    mainWindow.loadURL(devServerUrl)
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
    closeBagStashOverlayWindow()
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
    ...CRAFTING_OVERLAY_SIZE,
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
  craftingOverlayDragPassthrough.setEnabled(true)
  craftingOverlayDragPassthrough.start()

  // 监听渲染进程发送的鼠标事件设置
  overlayWindow.webContents.on('ipc-message', (event, channel, ...args) => {
    if (channel === 'set-ignore-mouse-events') {
      craftingOverlayDragPassthrough.setEnabled(Boolean(args[0]))
    }
  })

  overlayWindow.on('closed', () => {
    craftingOverlayDragPassthrough.stop()
    overlayWindow = null
  })

  return overlayWindow
}

export function closeOverlayWindow() {
  craftingOverlayDragPassthrough.stop()
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

export function setCraftingOverlayDragging(dragging) {
  craftingOverlayDragPassthrough.setDragging(dragging)
}

export function moveCraftingOverlayTo(point) {
  if (!overlayWindow || overlayWindow.isDestroyed()) return false
  const display = screen.getDisplayNearestPoint(point)
  overlayWindow.setBounds(getFixedOverlayDragBounds(point, display.workArea, CRAFTING_OVERLAY_SIZE), false)
  return true
}

function publishBagStashOverlayState() {
  if (!bagStashOverlayWindow || bagStashOverlayWindow.isDestroyed() || !bagStashOverlaySnapshot) return
  bagStashOverlayWindow.webContents.send('bag-stash-overlay-state', bagStashOverlaySnapshot)
}

export function createBagStashOverlayWindow(initialSnapshot = null) {
  if (initialSnapshot) bagStashOverlaySnapshot = initialSnapshot
  if (bagStashOverlayWindow && !bagStashOverlayWindow.isDestroyed()) {
    publishBagStashOverlayState()
    return bagStashOverlayWindow
  }

  const displays = screen.getAllDisplays().map((display) => ({
    ...display,
    primary: display.id === screen.getPrimaryDisplay().id
  }))
  const bounds = getBagOverlayBounds(loadWindowState().bagStashOverlayBounds, displays)
  bagStashOverlayWindow = new BrowserWindow({
    ...bounds,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    resizable: false,
    movable: true,
    show: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, '../../preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  })
  bagStashOverlayWindow.setAlwaysOnTop(true, 'screen-saver')

  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (process.env.NODE_ENV === 'development' && devServerUrl) {
    bagStashOverlayWindow.loadURL(`${devServerUrl}#/bag-stash-overlay`)
  } else {
    bagStashOverlayWindow.loadFile(path.join(__dirname, '../../../dist/index.html'), { hash: '/bag-stash-overlay' })
  }

  bagStashOverlayWindow.webContents.once('did-finish-load', () => {
    if (!bagStashOverlayWindow || bagStashOverlayWindow.isDestroyed()) return
    publishBagStashOverlayState()
    if (bagStashOverlaySnapshot?.visible) bagStashOverlayWindow.showInactive()
  })

  let saveTimer
  bagStashOverlayWindow.on('move', () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      if (!bagStashOverlayWindow || bagStashOverlayWindow.isDestroyed()) return
      const { x, y } = bagStashOverlayWindow.getBounds()
      saveWindowState({ bagStashOverlayBounds: { x, y } })
    }, 250)
  })
  bagStashOverlayWindow.on('closed', () => {
    clearTimeout(saveTimer)
    bagStashOverlayWindow = null
  })
  return bagStashOverlayWindow
}

export function updateBagStashOverlay(snapshot) {
  bagStashOverlaySnapshot = snapshot ? { ...snapshot } : null
  if (!snapshot) return false
  const overlay = createBagStashOverlayWindow(snapshot)
  if (overlay.webContents.isLoadingMainFrame()) return true
  publishBagStashOverlayState()
  if (snapshot.visible) overlay.showInactive()
  else overlay.hide()
  return true
}

export function getBagStashOverlayWindow() {
  return bagStashOverlayWindow
}

export function closeBagStashOverlayWindow() {
  bagStashOverlaySnapshot = null
  if (bagStashOverlayWindow && !bagStashOverlayWindow.isDestroyed()) bagStashOverlayWindow.close()
  bagStashOverlayWindow = null
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

function storyOverlayIsInteractive() {
  return storyOverlayOpacity > 0 && storyOverlayWindow?.isVisible()
}

function destroyWindow(window) {
  if (window && !window.isDestroyed()) window.destroy()
}

function publishStoryDividerRatio() {
  if (!storyOverlayWindow || storyOverlayWindow.isDestroyed()) return
  storyOverlayWindow.webContents.send('story-overlay-divider-ratio', storyOverlayDividerRatio)
}

function syncStoryDividerToOverlay() {
  if (!storyOverlayDividerWindow || storyOverlayDividerWindow.isDestroyed() || !storyOverlayWindow || storyOverlayWindow.isDestroyed()) return
  const expected = getStoryDividerGripBounds(storyOverlayWindow.getBounds(), storyOverlayLayout, storyOverlayDividerRatio)
  if (!expected || !storyOverlayIsInteractive()) {
    storyOverlayDividerWindow.hide()
    return
  }
  const current = storyOverlayDividerWindow.getBounds()
  if (current.x !== expected.x || current.y !== expected.y || current.width !== expected.width || current.height !== expected.height) {
    storyOverlayDividerWindow.setBounds(expected)
  }
  storyOverlayDividerWindow.showInactive()
}

function createStoryDividerWindow() {
  if (!storyOverlayWindow || storyOverlayWindow.isDestroyed()) return null
  if (storyOverlayDividerWindow && !storyOverlayDividerWindow.isDestroyed()) return storyOverlayDividerWindow
  const initialBounds = getStoryDividerGripBounds(storyOverlayWindow.getBounds(), storyOverlayLayout, storyOverlayDividerRatio)
    || { x: storyOverlayWindow.getBounds().x, y: storyOverlayWindow.getBounds().y, width: 14, height: 1 }
  storyOverlayDividerWindow = new BrowserWindow({
    ...initialBounds,
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
  storyOverlayDividerWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(STORY_DIVIDER_GRIP_HTML)}`)
  storyOverlayDividerWindow.setAlwaysOnTop(true, 'screen-saver')
  storyOverlayDividerWindow.setOpacity(storyOverlayOpacity / 100)
  storyOverlayDividerWindow.once('ready-to-show', syncStoryDividerToOverlay)
  storyOverlayDividerWindow.on('move', () => {
    if (!storyOverlayDividerWindow || storyOverlayDividerWindow.isDestroyed() || !storyOverlayWindow || storyOverlayWindow.isDestroyed()) return
    storyOverlayDividerRatio = getStoryDividerRatioFromGrip(
      storyOverlayDividerWindow.getBounds(),
      storyOverlayWindow.getBounds(),
      storyOverlayLayout
    )
    saveWindowState({ storyOverlayDividerRatio })
    publishStoryDividerRatio()
  })
  storyOverlayDividerWindow.on('moved', syncStoryDividerToOverlay)
  const dividerWindow = storyOverlayDividerWindow
  dividerWindow.on('closed', () => {
    if (storyOverlayDividerWindow === dividerWindow) storyOverlayDividerWindow = null
  })
  return storyOverlayDividerWindow
}

export function createStoryOverlayWindow(initialSnapshot = null, options = {}) {
  const configuredWidth = typeof options === 'object' ? options?.width : options
  const requestedOpacity = typeof options === 'object' ? options?.opacity : storyOverlayOpacity
  if (requestedOpacity != null) {
    const number = Number(requestedOpacity)
    storyOverlayOpacity = Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 100
  }
  storyOverlayDividerRatio = normalizeStoryDividerRatio(loadWindowState().storyOverlayDividerRatio)
  if (initialSnapshot) storyOverlaySnapshot = initialSnapshot
  if (storyOverlayWindow && !storyOverlayWindow.isDestroyed()) {
    resizeStoryOverlay({ width: configuredWidth })
    setStoryOverlayOpacity(storyOverlayOpacity)
    storyOverlayWindow.showInactive()
    storyOverlayDragPassthrough.start()
    createStoryDividerWindow()
    syncStoryDividerToOverlay()
    if (initialSnapshot) storyOverlayWindow.webContents.send('story-overlay-state', initialSnapshot)
    publishStoryDividerRatio()
    return storyOverlayWindow
  }

  const width = Math.max(320, Math.min(1200, Math.round(Number(configuredWidth) || 460)))
  const height = 220
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
  storyOverlayWindow.setOpacity(storyOverlayOpacity / 100)
  createStoryDividerWindow()
  const overlayWindow = storyOverlayWindow
  overlayWindow.webContents.once('did-finish-load', () => {
    if (storyOverlayWindow !== overlayWindow || overlayWindow.isDestroyed()) return
    if (initialSnapshot) overlayWindow.webContents.send('story-overlay-state', initialSnapshot)
    overlayWindow.showInactive()
    storyOverlayDragPassthrough.start()
    publishStoryDividerRatio()
    syncStoryDividerToOverlay()
  })

  let saveTimer
  overlayWindow.on('move', () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      if (storyOverlayWindow !== overlayWindow || overlayWindow.isDestroyed()) return
      const { x, y } = overlayWindow.getBounds()
      saveWindowState({ storyOverlayBounds: { x, y } })
    }, 250)
  })
  overlayWindow.on('closed', () => {
    clearTimeout(saveTimer)
    if (storyOverlayWindow !== overlayWindow) return
    const dividerWindow = storyOverlayDividerWindow
    storyOverlayDividerWindow = null
    storyOverlayWindow = null
    storyOverlayDragPassthrough.stop()
    destroyWindow(dividerWindow)
  })
  return storyOverlayWindow
}

export function resizeStoryOverlay(size) {
  if (!storyOverlayWindow || storyOverlayWindow.isDestroyed()) return false
  const display = screen.getDisplayMatching(storyOverlayWindow.getBounds())
  const maxHeight = Math.max(180, Math.floor(display.workArea.height * 0.7))
  const bounds = storyOverlayWindow.getBounds()
  const requestedHeight = typeof size === 'object' ? size?.height : size
  const requestedWidth = typeof size === 'object' ? size?.width : null
  const nextHeight = requestedHeight == null ? storyOverlaySize.height : Math.max(150, Math.min(maxHeight, Math.round(Number(requestedHeight) || 220)))
  const maxWidth = Math.max(320, display.workArea.width)
  const nextWidth = requestedWidth == null ? storyOverlaySize.width : Math.max(320, Math.min(maxWidth, Math.round(Number(requestedWidth) || 460)))
  storyOverlaySize = { width: nextWidth, height: nextHeight }
  const maxX = display.workArea.x + display.workArea.width - nextWidth
  const nextX = Math.max(display.workArea.x, Math.min(maxX, bounds.x))
  const nextBounds = { ...bounds, x: nextX, width: nextWidth, height: nextHeight }
  if (storyOverlayBoundsEqual(bounds, nextBounds)) return true
  storyOverlayWindow.setBounds(nextBounds)
  syncStoryDividerToOverlay()
  return true
}

export function setStoryOverlayDragging(dragging) {
  storyOverlayDragPassthrough.setDragging(dragging)
  if (dragging) {
    storyOverlayDividerWindow?.hide()
  } else {
    syncStoryDividerToOverlay()
  }
}

export function moveStoryOverlayTo(point) {
  if (!storyOverlayWindow || storyOverlayWindow.isDestroyed()) return false
  const display = screen.getDisplayNearestPoint(point)
  const nextBounds = getFixedOverlayDragBounds(point, display.workArea, storyOverlaySize)
  storyOverlayWindow.setBounds(nextBounds, false)
  return true
}

export function setStoryOverlayOpacity(opacity) {
  const number = Number(opacity)
  storyOverlayOpacity = Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 100
  const nativeOpacity = storyOverlayOpacity / 100
  for (const window of [storyOverlayWindow, storyOverlayDividerWindow]) {
    if (window && !window.isDestroyed()) window.setOpacity(nativeOpacity)
  }
  if (storyOverlayOpacity === 0) {
    storyOverlayDividerWindow?.hide()
  } else if (storyOverlayWindow?.isVisible()) {
    syncStoryDividerToOverlay()
  }
  storyOverlayDragPassthrough.sync()
  return true
}

export function updateStoryOverlayLayout(layout) {
  const numeric = key => Math.max(0, Number(layout?.[key]) || 0)
  const nextLayout = {
    stacked: Boolean(layout?.stacked),
    left: numeric('left'),
    top: numeric('top'),
    width: numeric('width'),
    height: numeric('height')
  }
  if (storyOverlayLayout && storyOverlayLayout.stacked === nextLayout.stacked &&
    storyOverlayLayout.left === nextLayout.left && storyOverlayLayout.top === nextLayout.top &&
    storyOverlayLayout.width === nextLayout.width && storyOverlayLayout.height === nextLayout.height) return true
  storyOverlayLayout = nextLayout
  createStoryDividerWindow()
  syncStoryDividerToOverlay()
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
  const overlayWindow = storyOverlayWindow
  const dividerWindow = storyOverlayDividerWindow
  storyOverlayWindow = null
  storyOverlayDragPassthrough.stop()
  storyOverlayDividerWindow = null
  destroyWindow(dividerWindow)
  destroyWindow(overlayWindow)
}

export function getStoryOverlayWindow() {
  return storyOverlayWindow
}

export function getStoryOverlayDividerWindow() {
  return storyOverlayDividerWindow
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

function screenPickerFailure(error, fallbackCode = 'SCREEN_CAPTURE_FAILED') {
  return {
    success: false,
    canceled: false,
    error: {
      code: error?.code || fallbackCode,
      message: error?.message || String(error || '屏幕捕获失败'),
      ...(error?.details ? { details: error.details } : {})
    }
  }
}

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
  return getDisplayPhysicalBounds(display, process.platform, (point) => screen.dipToScreenPoint(point))
}

async function captureDisplays(displays) {
  const maximum = displays.reduce((size, display) => {
    const physical = physicalDisplayBounds(display)
    return { width: Math.max(size.width, physical.width), height: Math.max(size.height, physical.height) }
  }, { width: 1, height: 1 })
  const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: maximum })
  const resolved = resolveCaptureSources(displays, sources)
  const screenshots = new Map()
  displays.forEach((display) => {
    const source = resolved.get(String(display.id))
    screenshots.set(String(display.id), source.thumbnail)
  })
  return screenshots
}

function createScreenPickerSession(mode, screenshots = new Map(), options = {}) {
  if (screenPickerSession) {
    return mode === screenPickerSession.mode
      ? screenPickerSession.promise
      : Promise.resolve(screenPickerFailure(Object.assign(new Error('已有其他屏幕选取会话正在进行'), { code: 'PICKER_BUSY' })))
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
    options,
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
        purpose: session.options?.purpose || '',
        displayId: String(display.id),
        scaleFactor: display.scaleFactor,
        displayDipBounds: display.bounds,
        displayPhysicalBounds: physicalBounds,
        minimumSize: session.options?.minimumSize || { width: 20, height: 10 }
      })
      pickerWindow.setAlwaysOnTop(true, 'screen-saver')
      pickerWindow.once('ready-to-show', () => {
        if (!pickerWindow.isDestroyed()) pickerWindow.show()
      })
      pickerWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, _url, isMainFrame) => {
        if (isMainFrame === false) return
        settleScreenPicker(screenPickerFailure(Object.assign(
          new Error(`框选窗口加载失败：${errorDescription || errorCode}`),
          { code: 'PICKER_LOAD_FAILED', details: { errorCode } }
        )))
      })
      pickerWindow.on('closed', () => settleScreenPicker({ canceled: true }))

      if (process.env.NODE_ENV === 'development' && devServerUrl) {
        pickerWindow.loadURL(`${devServerUrl}#/coordinate-picker`)
      } else {
        pickerWindow.loadFile(path.join(__dirname, '../../../dist/index.html'), { hash: '/coordinate-picker' })
      }
    })
  } catch (error) {
    settleScreenPicker(screenPickerFailure(error, 'PICKER_LOAD_FAILED'))
  }
}

export function pickScreenCoordinate() {
  if (screenPickerSession) return createScreenPickerSession('point')
  const promise = createScreenPickerSession('point')
  openScreenPickerWindows('point', screen.getAllDisplays())
  return promise
}

export async function pickScreenRegion(options = {}) {
  if (screenPickerSession) return createScreenPickerSession('region')
  const displays = screen.getAllDisplays()
  let screenshots
  try {
    screenshots = await captureDisplays(displays)
  } catch (error) {
    return screenPickerFailure(error)
  }
  const promise = createScreenPickerSession('region', screenshots, options)
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
    success: true,
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
  const selectedSize = getRectangleSize(selectedRegion)
  const minimumSize = context.minimumSize || { width: 20, height: 10 }
  if (!isRegionLargeEnough(selectedRegion) || selectedSize.width < minimumSize.width || selectedSize.height < minimumSize.height) return false
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
    if (!hasUsefulPixelVariance(template.toBitmap())) throw new Error('选区图像信息过少，请框选包含清晰文字的区域')
    const size = selectedSize
    settleScreenPicker({
      success: true,
      canceled: false,
      displayId: context.displayId,
      scaleFactor: context.scaleFactor,
      displayPhysicalBounds: context.displayPhysicalBounds,
      selectedRegion,
      templateSize: size,
      png: template.toPNG()
    })
  } catch (error) {
    settleScreenPicker(screenPickerFailure(error))
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
