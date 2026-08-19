import { BrowserWindow, ipcMain } from 'electron'
import { CHAOS_ERROR_CODES, serializeChaosError } from '../chaosRecipe/errors.js'

const ok = (data = {}) => ({ success: true, data })

export function registerPriceCheckHandlers(service) {
  const broadcastCatalog = (snapshot) => {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) window.webContents.send('price-check-catalog-updated', snapshot)
    }
    return snapshot
  }
  const broadcastSettings = (snapshot) => {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) window.webContents.send('price-check-settings-changed', snapshot)
    }
    return snapshot
  }
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
  ipcMain.handle('price-check-runtime-update', invoke((runtime) => {
    const status = service.updateRuntime(runtime || {})
    broadcastSettings({
      options: status.options,
      settingsRevision: status.settingsRevision,
      dcRate: status.dcRate
    })
    return status
  }))
  ipcMain.handle('price-check-settings-update', invoke((patch) => broadcastSettings(service.updateSettings(patch || {}))))
  ipcMain.handle('price-check-catalog-retry', invoke(async () => broadcastCatalog(await service.refreshCatalog())))
  ipcMain.handle('price-check-capture', invoke((request) => service.captureAndCheck({
    league: String(request?.league || ''),
    queryImmediately: request?.queryImmediately === true,
    options: request?.options || {}
  })))
  ipcMain.handle('price-check-rerun', invoke((request) => service.rerun(request || {})))
  ipcMain.handle('price-check-load-more', invoke(() => service.loadMore()))
  ipcMain.handle('price-check-load-distribution', invoke(() => service.loadDistribution()))
  ipcMain.handle('price-check-resolve-identity', invoke((candidateKey) => service.resolveIdentity(candidateKey)))
  ipcMain.handle('price-check-resolve-stat-candidate', invoke((unknownKey, candidateId) => service.resolveStatCandidate(unknownKey, candidateId)))
  ipcMain.handle('price-check-overlay-state', invoke(() => service.getOverlayState()))
  ipcMain.handle('price-check-overlay-close', invoke(() => service.closeOverlay()))
  ipcMain.handle('price-check-open-official', invoke(() => service.openOfficial()))
}
