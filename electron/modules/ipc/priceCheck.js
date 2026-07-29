import { ipcMain } from 'electron'
import { CHAOS_ERROR_CODES, serializeChaosError } from '../chaosRecipe/errors.js'

const ok = (data = {}) => ({ success: true, data })

export function registerPriceCheckHandlers(service) {
  const invoke = (handler) => async (_event, ...args) => {
    try {
      return ok(await handler(...args))
    } catch (error) {
      if (error?.name === 'AbortError') {
        return { success: false, error: { code: 'CANCELED', message: '查价已取消', details: {} } }
      }
      if (error?.code === CHAOS_ERROR_CODES.SESSION_EXPIRED) {
        await service.auth.expire?.().catch(() => service.clear())
      }
      return { success: false, error: serializeChaosError(error) }
    }
  }

  ipcMain.handle('price-check-status', invoke(() => service.getStatus()))
  ipcMain.handle('price-check-runtime-update', invoke((runtime) => service.updateRuntime(runtime || {})))
  ipcMain.handle('price-check-capture', invoke((request) => service.captureAndCheck({
    league: String(request?.league || ''),
    options: request?.options || {}
  })))
  ipcMain.handle('price-check-rerun', invoke((request) => service.rerun(request || {})))
  ipcMain.handle('price-check-load-more', invoke(() => service.loadMore()))
  ipcMain.handle('price-check-overlay-state', invoke(() => service.getOverlayState()))
  ipcMain.handle('price-check-overlay-close', invoke(() => service.closeOverlay()))
  ipcMain.handle('price-check-open-official', invoke(() => service.openOfficial()))
}
