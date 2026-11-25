import { ipcMain } from 'electron'
import { normalizeFaustusDcRateRequest, normalizeFaustusStartRequest } from '../faustus/schema.js'

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
    const result = await window.pickScreenRegion({
      purpose: 'faustus-grid',
      title: '框选完整的 12×12 浮士德市集网格',
      hint: '贴近浮士德市集网格外边框，从左上角拖到右下角，包含全部 144 格，按 Esc 取消',
      grid: { columns: 12, rows: 12 },
      minimumSize: { width: 240, height: 240 }
    })
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
  ipcMain.handle('faustus-start', invoke(getMainWindow, request => manager.start(normalizeFaustusStartRequest(request))))
  ipcMain.handle('faustus-stop', invoke(getMainWindow, reason => manager.stop(String(reason || 'user'))))
  ipcMain.handle('faustus-dc-rate', invoke(getMainWindow, request => manager.fetchInternationalDcRate(normalizeFaustusDcRateRequest(request))))
}
