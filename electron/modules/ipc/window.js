/**
 * Purpose: 注册窗口控制相关的 IPC 处理器
 * Inputs: window (object) - 窗口管理模块
 * Outputs: 注册 IPC 处理器，无返回值
 * Preconditions: 窗口已创建
 * Edge cases: 窗口不存在时静默处理；文件操作失败时返回原始结果
 * Errors: 文件操作失败时返回错误，不抛出异常
 */

import { ipcMain, BrowserWindow, dialog, app } from 'electron'
import fs from 'fs'
import path from 'path'
import { saveWindowState } from '../window/state.js'

export function registerWindowHandlers(window) {
  const { getMainWindow, getOverlayWindow, closeOverlayWindow } = window

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

  // 选择文件并复制到项目目录
  ipcMain.handle('select-file', async (event, options) => {
    const mainWindow = getMainWindow()
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Images/Videos', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg', 'mov'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    // 如果用户选择了文件，复制到项目目录
    if (!result.canceled && result.filePaths.length > 0) {
      const sourcePath = result.filePaths[0]
      try {
        // 创建背景文件目录（在 userData 目录下）
        const backgroundsDir = path.join(app.getPath('userData'), 'backgrounds')
        if (!fs.existsSync(backgroundsDir)) {
          fs.mkdirSync(backgroundsDir, { recursive: true })
        }

        // 生成唯一文件名（使用时间戳和原始文件名）
        const ext = path.extname(sourcePath)
        const baseName = path.basename(sourcePath, ext)
        const timestamp = Date.now()
        const fileName = `${baseName}_${timestamp}${ext}`
        const destPath = path.join(backgroundsDir, fileName)

        // 复制文件
        fs.copyFileSync(sourcePath, destPath)

        // 返回项目内的相对路径（用于存储和显示）
        // 使用 userData 目录的相对路径标识
        return {
          canceled: false,
          filePaths: [destPath], // 返回完整路径，前端会处理显示
          relativePath: `userData://backgrounds/${fileName}` // 用于存储的标识
        }
      } catch (error) {
        // 如果复制失败，返回原始路径
        return result
      }
    }

    return result
  })

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

