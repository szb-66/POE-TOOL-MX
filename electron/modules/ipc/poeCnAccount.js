import { ipcMain } from 'electron'
import { CHAOS_ERROR_CODES, serializeChaosError } from '../chaosRecipe/errors.js'

const ok = (data = {}) => ({ success: true, data })

export function registerPoeCnAccountHandlers(account, window) {
  const register = (channel, handler) => {
    ipcMain.handle(channel, handler)
    ipcMain.handle(channel.replace('poe-cn-account-', 'poe-account-'), handler)
  }
  const invoke = (handler) => async (_event, ...args) => {
    try {
      return ok(await handler(...args))
    } catch (error) {
      if (error?.code === CHAOS_ERROR_CODES.SESSION_EXPIRED) {
        await account.auth.expire().catch(() => {})
      }
      return { success: false, error: serializeChaosError(error) }
    }
  }

  register('poe-cn-account-status', invoke(() => account.auth.getStatus()))
  register('poe-cn-account-restore', invoke(() => account.auth.restore()))
  register('poe-cn-account-open-web', invoke(() => account.auth.openWebLogin()))
  register('poe-cn-account-complete-web', invoke(() => account.auth.completeWebLogin()))
  register('poe-cn-account-token', invoke((token) => account.auth.setSessionToken(token)))
  register('poe-cn-account-logout', invoke(() => account.auth.logout()))
  register('poe-cn-account-list-leagues', invoke(() => account.listLeagues()))
  register('poe-cn-account-set-league', invoke((league) => ({ league: String(league || '') })))

  account.auth.subscribe((status) => {
    const mainWindow = window.getMainWindow?.()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('poe-cn-account-status-changed', status)
    }
  })
}
