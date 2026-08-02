import { ipcMain } from 'electron'

export function registerPuzzleHandlers(service) {
  ipcMain.handle('puzzle-pick-inventory-region', () => service.pickRegion())
  ipcMain.handle('puzzle-analyze', (_event, payload) => service.analyze(payload || {}))
}

