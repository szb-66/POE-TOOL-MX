import { ipcMain } from 'electron'

const ok = data => ({ success: true, data })
const invoke = handler => async (_event, ...args) => {
  try { return ok(await handler(...args)) } catch (error) {
    return { success: false, error: { code: error.code || 'JUNFENG_ERROR', message: error.message || String(error) } }
  }
}

export function registerJunfengHandlers(manager, window, { interfaceDetection, enableTraining = false } = {}) {
  ipcMain.handle('junfeng-runtime-update', invoke(async runtime => {
    const candidate = { ...manager.runtime, ...(runtime || {}) }
    if (!candidate.enabled) {
      manager.setRuntime(candidate)
      interfaceDetection?.unregisterConsumer('junfeng-highlight')
      if (manager.getStatus().status === 'running') manager.stop('disabled')
      return manager.getStatus()
    }
    const templates = candidate.templates || {}
    if (!templates.junfengRewardTitle || !templates.inventoryTitle) throw new Error('请先配置君锋镇奖励和背包标题模板')
    manager.setRuntime(candidate)
    await interfaceDetection?.registerConsumer('junfeng-highlight', {
      templates: {
        stash_title: String(templates.stashTitle || ''),
        inventory_title: String(templates.inventoryTitle),
        junfeng_reward_title: String(templates.junfengRewardTitle),
        stash_region: templates.stashRegion || {},
        inventory_region: templates.inventoryRegion || {},
        junfeng_reward_region: templates.junfengRewardRegion || {}
      },
      match_threshold: Number(candidate.matchThreshold ?? 0.8)
    })
    return manager.getStatus()
  }))
  ipcMain.handle('junfeng-preview', invoke(() => manager.preview()))
  ipcMain.handle('junfeng-start', invoke(() => manager.start()))
  ipcMain.handle('junfeng-stop', invoke(() => manager.stop('user')))
  ipcMain.handle('junfeng-status', invoke(() => manager.getStatus()))
  ipcMain.handle('junfeng-pick-grid-region', invoke(async () => {
    const result = await window.pickScreenRegion()
    if (result?.canceled) return result
    return { canceled: false, region: result.selectedRegion, displayId: result.displayId, scaleFactor: result.scaleFactor,
      displayPhysicalBounds: result.displayPhysicalBounds, capturedAt: new Date().toISOString() }
  }))
  ipcMain.handle('junfeng-corrections', invoke(() => manager.listCorrections()))
  ipcMain.handle('junfeng-add-correction', invoke(value => manager.addCorrection(value || {})))
  ipcMain.handle('junfeng-remove-correction', invoke(id => manager.removeCorrection(id)))
  ipcMain.handle('junfeng-reset-corrections', invoke(() => manager.resetCorrections()))
  ipcMain.handle('junfeng-rebuild-corrections', invoke(() => manager.rebuildCorrections()))
  ipcMain.handle('highlight-calibration-list', invoke(() => manager.listCorrections()))
  ipcMain.handle('highlight-calibration-save', invoke(value => manager.addCorrection(value || {})))
  ipcMain.handle('highlight-calibration-remove', invoke(id => manager.removeCorrection(id)))
  ipcMain.handle('highlight-calibration-reset', invoke(() => manager.resetCorrections()))
  if (!enableTraining) return

  ipcMain.handle('junfeng-training-pick-region', invoke(async () => {
    const result = await window.pickScreenRegion()
    if (result?.canceled) return result
    return { canceled: false, region: result.selectedRegion, displayId: result.displayId, scaleFactor: result.scaleFactor,
      displayPhysicalBounds: result.displayPhysicalBounds, capturedAt: new Date().toISOString() }
  }))
  ipcMain.handle('junfeng-training-preview', invoke(value => manager.previewTraining(value || {})))
  ipcMain.handle('junfeng-training-save-session', invoke(value => manager.saveTrainingSession(value || {})))
  ipcMain.handle('junfeng-training-sessions', invoke(() => manager.listTrainingSessions()))
  ipcMain.handle('junfeng-training-session', invoke(id => manager.getTrainingSession(id)))
  ipcMain.handle('junfeng-training-update-session', invoke(value => manager.updateTrainingSession(value || {})))
  ipcMain.handle('junfeng-training-delete-session', invoke(id => manager.deleteTrainingSession(id)))
  ipcMain.handle('junfeng-training-status', invoke(() => manager.getTrainingStatus()))
  ipcMain.handle('junfeng-training-start', invoke(value => manager.trainModel(value || {})))
  ipcMain.handle('junfeng-training-evaluate', invoke(() => manager.evaluateModel()))
}
