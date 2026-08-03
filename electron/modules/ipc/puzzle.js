import { ipcMain } from 'electron'

export function registerPuzzleHandlers(service) {
  ipcMain.handle('puzzle-pick-inventory-region', () => service.pickInventoryRegion())
  ipcMain.handle('puzzle-pick-atlas-region', () => service.pickAtlasRegion())
  ipcMain.handle('puzzle-configuration', (_event, payload) => service.getConfiguration(payload || {}))
  ipcMain.handle('puzzle-analyze', (_event, payload) => service.analyze(payload || {}))
  ipcMain.handle('puzzle-auto-placement-start', (_event, payload) => service.startAutoPlacement(payload || {}))
  ipcMain.handle('puzzle-auto-placement-stop', (_event, reason) => service.stopAutoPlacement(reason))
  ipcMain.handle('puzzle-auto-placement-status', () => service.getAutoPlacementStatus())
}
