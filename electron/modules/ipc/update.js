import { ipcMain } from 'electron'
import { UPDATE_MODES, UPDATE_SOURCES } from '../update/service.js'

function assertMainWindowSender(event, getMainWindow) {
  const mainWindow = getMainWindow()
  if (!mainWindow || mainWindow.isDestroyed() || event.sender !== mainWindow.webContents) {
    throw new Error('更新操作只允许主窗口调用')
  }
}

export function registerApplicationUpdateHandlers(service, getMainWindow) {
  const guarded = handler => async (event, ...args) => {
    assertMainWindowSender(event, getMainWindow)
    return handler(...args)
  }

  ipcMain.handle('update-get-state', guarded(() => service.snapshot()))
  ipcMain.handle('update-configure', guarded((input = {}) => {
    if (!UPDATE_MODES.has(input?.mode)) throw new Error('不支持的更新模式')
    if (!UPDATE_SOURCES.has(input?.source)) throw new Error('不支持的更新来源')
    return service.configure({ mode: input.mode, source: input.source })
  }))
  ipcMain.handle('update-check', guarded(() => service.check()))
  ipcMain.handle('update-download', guarded(() => service.download()))
  ipcMain.handle('update-restart-install', guarded(() => service.restartAndInstall()))
  ipcMain.handle('update-acknowledge-installed', guarded(() => service.acknowledgeInstalledUpdate()))
}
