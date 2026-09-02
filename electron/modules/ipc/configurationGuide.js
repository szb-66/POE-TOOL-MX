import { ipcMain } from 'electron'
import { sanitizeOverlayGuideRequest } from '../../../shared/configurationGuideRequest.js'

export function registerConfigurationGuideHandlers(window, { windowActivation } = {}) {
  const { getMainWindow, getOverlayWindow } = window

  ipcMain.handle('configuration-guide:open-from-overlay', async (event, request) => {
    const overlay = getOverlayWindow?.()
    if (!overlay || overlay.isDestroyed() || overlay.webContents !== event.sender) {
      return { success: false, error: { code: 'GUIDE_SENDER_REJECTED', message: '仅制作浮窗可以请求重新定位' } }
    }
    const sanitized = sanitizeOverlayGuideRequest(request)
    if (!sanitized) {
      return { success: false, error: { code: 'GUIDE_REQUEST_REJECTED', message: '配置引导请求无效' } }
    }
    const main = getMainWindow?.()
    if (!main || main.isDestroyed()) {
      return { success: false, error: { code: 'GUIDE_MAIN_WINDOW_UNAVAILABLE', message: '主窗口不可用' } }
    }
    const activation = await windowActivation?.activateMain({ source: 'configuration-guide' })
    if (!activation?.success) {
      return { success: false, error: { code: activation?.code || 'ACTIVATION_UNAVAILABLE', message: '无法恢复主窗口' } }
    }
    overlay.hide()
    main.webContents.send('configuration-guide:requested', sanitized)
    return { success: true }
  })

  ipcMain.handle('configuration-guide:return-to-overlay', (event) => {
    const main = getMainWindow?.()
    if (!main || main.isDestroyed() || main.webContents !== event.sender) {
      return { success: false, error: { code: 'GUIDE_SENDER_REJECTED', message: '仅主窗口可以返回制作浮窗' } }
    }
    const overlay = getOverlayWindow?.()
    if (!overlay || overlay.isDestroyed()) {
      return { success: false, error: { code: 'GUIDE_OVERLAY_UNAVAILABLE', message: '制作浮窗已关闭' } }
    }
    overlay.show()
    overlay.focus()
    main.minimize()
    return { success: true }
  })
}
