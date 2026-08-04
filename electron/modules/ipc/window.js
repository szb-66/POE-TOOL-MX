/**
 * Purpose: 注册窗口控制相关的 IPC 处理器
 * Inputs: window (object) - 窗口管理模块
 * Outputs: 注册 IPC 处理器，无返回值
 * Preconditions: 窗口已创建
 * Edge cases: 窗口不存在时静默处理；文件操作失败时返回原始结果
 * Errors: 文件操作失败时返回错误，不抛出异常
 */

import { ipcMain, BrowserWindow, dialog, app } from 'electron'
import { saveWindowState } from '../window/state.js'
import { importOverlayBackground } from '../window/backgroundImport.js'
import { OverlayDragSession } from '../window/overlayDrag.js'

export function registerWindowHandlers(window) {
  const { getMainWindow, getOverlayWindow, closeOverlayWindow } = window
  const craftingOverlayDrag = new OverlayDragSession()
  const storyOverlayDrag = new OverlayDragSession()

  // 窗口控制 IPC
  ipcMain.handle('window-minimize', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) mainWindow.minimize()
  })

  ipcMain.handle('window-maximize', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
    }
  })

  ipcMain.handle('window-close', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) mainWindow.close()
  })

  ipcMain.handle('close-overlay-window', () => {
    closeOverlayWindow()
  })

  ipcMain.handle('window-toggle-always-on-top', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      const isAlwaysOnTop = mainWindow.isAlwaysOnTop()
      const newState = !isAlwaysOnTop
      mainWindow.setAlwaysOnTop(newState)
      saveWindowState({ alwaysOnTop: newState })
      return newState
    }
    return false
  })

  ipcMain.handle('window-is-always-on-top', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) return mainWindow.isAlwaysOnTop()
    return false
  })

  ipcMain.handle('set-devtools-visible', (event, visible) => {
    return { visible: window.setDevToolsVisible(Boolean(visible)) }
  })

  ipcMain.handle('get-devtools-visible', () => {
    return { visible: window.getDevToolsVisible() }
  })

  ipcMain.handle('pick-screen-coordinate', () => {
    return window.pickScreenCoordinate()
  })

  ipcMain.handle('screen-picker-context', (event) => {
    return window.getScreenPickerContext(event.sender)
  })

  ipcMain.on('coordinate-picker-select', (event, point) => {
    window.submitCoordinatePickerPoint(event.sender, point)
  })

  ipcMain.on('screen-picker-region-select', (event, rectangle) => {
    window.submitScreenPickerRegion(event.sender, rectangle)
  })

  ipcMain.on('coordinate-picker-cancel', () => {
    window.cancelCoordinatePicker()
  })

  // 移动窗口
  ipcMain.on('window-move', (event, { x, y }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      // 使用 setBounds 并显式保留当前宽高，防止在 Windows 上拖动时改变窗口大小
      const { width, height } = win.getBounds()
      win.setBounds({ x: Math.round(x), y: Math.round(y), width, height })
    }
  })

  const importBackground = (sourcePath) => {
    try {
      return importOverlayBackground(sourcePath, { userDataPath: app.getPath('userData') })
    } catch (error) {
      return {
        success: false,
        error: { code: error.code || 'BACKGROUND_IMPORT_FAILED', message: error.message || '导入背景失败' }
      }
    }
  }

  ipcMain.handle('select-overlay-background', async () => {
    const mainWindow = getMainWindow()
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Images/Videos', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg', 'mov'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) return { success: false, canceled: true }
    return { ...importBackground(result.filePaths[0]), canceled: false }
  })

  ipcMain.on('crafting-overlay-move', (event, point = {}) => {
    const overlay = getOverlayWindow()
    if (!overlay || overlay.isDestroyed() || overlay.webContents !== event.sender) return
    if (point.phase === 'start') {
      if (craftingOverlayDrag.begin(event.sender.id, point, overlay.getBounds())) window.setCraftingOverlayDragging(true)
      return
    }
    if (point.phase === 'end') {
      if (craftingOverlayDrag.end(event.sender.id)) window.setCraftingOverlayDragging(false)
      return
    }
    if (point.phase !== 'move') return
    const requested = craftingOverlayDrag.move(event.sender.id, point)
    if (requested) window.moveCraftingOverlayTo(requested)
  })

  ipcMain.on('story-overlay-move', (event, point = {}) => {
    const overlay = window.getStoryOverlayWindow?.()
    if (!overlay || overlay.isDestroyed() || overlay.webContents !== event.sender) return
    if (point.phase === 'start') {
      if (storyOverlayDrag.begin(event.sender.id, point, overlay.getBounds())) window.setStoryOverlayDragging(true)
      return
    }
    if (point.phase === 'end') {
      if (storyOverlayDrag.end(event.sender.id)) window.setStoryOverlayDragging(false)
      return
    }
    if (point.phase !== 'move') return
    const requested = storyOverlayDrag.move(event.sender.id, point)
    if (requested) window.moveStoryOverlayTo(requested)
  })

  ipcMain.handle('import-overlay-background', (_event, sourcePath) => importBackground(sourcePath))

  // 更新覆盖层设置
  ipcMain.handle('update-overlay-settings', async (event, settings) => {
    const overlayWindow = getOverlayWindow()
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('update-overlay-settings', settings)
    }
    return { success: true }
  })

  ipcMain.handle('open-story-overlay', (event, snapshot, options) => {
    window.createStoryOverlayWindow(snapshot, options)
    return { success: true }
  })

  ipcMain.handle('close-story-overlay', () => {
    window.closeStoryOverlayWindow()
    return { success: true }
  })

  ipcMain.handle('update-story-overlay', (event, snapshot) => {
    window.updateStoryOverlay(snapshot)
    return { success: true }
  })

  ipcMain.handle('get-story-overlay-state', () => window.getStoryOverlaySnapshot())

  ipcMain.handle('resize-story-overlay', (event, size) => ({
    success: window.resizeStoryOverlay(size)
  }))

  ipcMain.handle('set-story-overlay-opacity', (event, opacity) => ({
    success: window.setStoryOverlayOpacity(opacity)
  }))

  ipcMain.handle('update-story-overlay-layout', (event, layout) => ({
    success: window.updateStoryOverlayLayout(layout)
  }))

  // 调试覆盖层控制
  const { createDebugWindow, closeDebugWindow, getDebugWindow } = window

  ipcMain.handle('open-debug-overlay', () => {
    createDebugWindow()
    return { success: true }
  })

  ipcMain.handle('close-debug-overlay', () => {
    closeDebugWindow()
    return { success: true }
  })

  ipcMain.handle('update-debug-overlay', (event, data) => {
    const debugWindow = getDebugWindow()
    if (debugWindow && !debugWindow.isDestroyed()) {
      const publish = () => {
        if (!debugWindow.isDestroyed()) debugWindow.webContents.send('update-debug-overlay', data)
      }
      if (debugWindow.webContents.isLoadingMainFrame()) debugWindow.webContents.once('did-finish-load', publish)
      else publish()
    }
    return { success: true }
  })
}

