import { ipcMain } from 'electron'
import { normalizeFaustusPriceWindowTestRequest, normalizeFaustusStartRequest } from '../faustus/schema.js'

const ok = data => ({ success: true, data })

function assertMainWindowSender(event, getMainWindow) {
  const mainWindow = getMainWindow?.()
  if (!mainWindow || mainWindow.isDestroyed() || event.sender !== mainWindow.webContents) {
    throw Object.assign(new Error('浮士德操作只允许主窗口调用'), { code: 'INVALID_IPC_SENDER' })
  }
}

const invoke = (getMainWindow, handler) => async (event, ...args) => {
  try {
    assertMainWindowSender(event, getMainWindow)
    return ok(await handler(...args))
  } catch (error) {
    return { success: false, error: { code: error.code || 'FAUSTUS_ERROR', message: error.message || String(error) } }
  }
}

export function registerFaustusHandlers(manager, window, getMainWindow) {
  ipcMain.handle('faustus-status', invoke(getMainWindow, () => manager.getStatus()))
  ipcMain.handle('faustus-grid-pick', invoke(getMainWindow, async () => {
    const result = await window.pickScreenRegion()
    if (result?.canceled) return result
    if (result?.success === false) throw Object.assign(new Error(result.error?.message || '框选失败'), { code: result.error?.code })
    const region = result.selectedRegion || result.region
    return {
      canceled: false,
      left: Number(region?.left), top: Number(region?.top), right: Number(region?.right), bottom: Number(region?.bottom),
      displayId: String(result.displayId || ''), scaleFactor: Number(result.scaleFactor),
      displayPhysicalBounds: result.displayPhysicalBounds || null, capturedAt: new Date().toISOString()
    }
  }))
  ipcMain.handle('faustus-price-window-test', invoke(getMainWindow, request => manager.testPriceWindow(normalizeFaustusPriceWindowTestRequest(request))))
  ipcMain.handle('faustus-start', invoke(getMainWindow, request => manager.start(normalizeFaustusStartRequest(request))))
  ipcMain.handle('faustus-stop', invoke(getMainWindow, reason => manager.stop(String(reason || 'user'))))
}
