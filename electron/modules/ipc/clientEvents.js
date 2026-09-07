import { BrowserWindow, ipcMain } from 'electron'

const invoke = (handler) => async (_event, ...args) => {
  try { return { success: true, data: await handler(...args) } } catch (error) { return { success: false, error: { message: error.message || '客户端事件中心操作失败' } } }
}

export function registerClientEventsHandlers(service) {
  service.onSnapshot((snapshot) => {
    for (const window of BrowserWindow.getAllWindows()) if (!window.isDestroyed()) window.webContents.send('client-events-snapshot', snapshot)
  })
  ipcMain.handle('client-events-status', invoke(() => service.getStatus()))
  ipcMain.handle('client-events-settings-update', invoke((patch) => service.updateSettings({
    ...(Object.hasOwn(patch || {}, 'enabled') ? { enabled: patch.enabled === true } : {}),
    ...(Object.hasOwn(patch || {}, 'logPath') ? { logPath: String(patch.logPath || '') } : {})
  })))
  ipcMain.handle('client-events-select-log', invoke(() => service.selectLogFile()))
}
