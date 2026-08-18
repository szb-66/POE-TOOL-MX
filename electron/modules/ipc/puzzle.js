import { ipcMain } from 'electron'

export function registerPuzzleHandlers(service) {
  ipcMain.handle('puzzle-pick-inventory-region', () => service.pickInventoryRegion())
  ipcMain.handle('puzzle-pick-atlas-region', () => service.pickAtlasRegion())
  ipcMain.handle('puzzle-pick-inventory-tab-point', (_event, page) => service.pickInventoryTabPoint(page))
  ipcMain.handle('puzzle-clear-region', (_event, type) => service.clearRegion(type))
  ipcMain.handle('puzzle-configuration', (_event, payload) => service.getConfiguration(payload || {}))
  ipcMain.handle('puzzle-calibration-list', () => service.listCalibration())
  ipcMain.handle('puzzle-calibration-save', (_event, payload) => service.saveCalibration(payload || []))
  ipcMain.handle('puzzle-calibration-remove', (_event, id) => service.removeCalibration(id))
  ipcMain.handle('puzzle-calibration-reset', () => service.resetCalibration())
  ipcMain.handle('puzzle-analyze', (_event, payload) => service.analyze(payload || {}))
  ipcMain.handle('puzzle-probe-border-mods', (_event, payload) => service.probeBorderMods(payload || {}))
  ipcMain.handle('puzzle-auto-placement-start', (_event, payload) => service.startAutoPlacement(payload || {}))
  ipcMain.handle('puzzle-auto-placement-stop', (_event, reason) => service.stopAutoPlacement(reason))
  ipcMain.handle('puzzle-auto-placement-status', () => service.getAutoPlacementStatus())
  ipcMain.handle('puzzle-complete-chart', () => service.resetExecution())
}
