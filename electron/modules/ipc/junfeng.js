import { ipcMain } from 'electron'

const ok = data => ({ success: true, data })
const invoke = handler => async (_event, ...args) => {
  try { return ok(await handler(...args)) } catch (error) {
    return { success: false, error: {
      code: error.code || 'JUNFENG_ERROR',
      message: error.message || String(error),
      failureCode: error.failureCode || '',
      configurationIssueId: error.configurationIssueId || '',
      configurationIssues: Array.isArray(error.configurationIssues) ? error.configurationIssues : []
    } }
  }
}

export function registerJunfengHandlers(manager, window, { interfaceDetection } = {}) {
  ipcMain.handle('junfeng-runtime-update', invoke(async runtime => {
    const candidate = { ...manager.runtime, ...(runtime || {}) }
    if (!candidate.enabled) {
      manager.setRuntime(candidate)
      interfaceDetection?.unregisterConsumer('junfeng-highlight')
      if (manager.getStatus().status === 'running') manager.stop('disabled')
      return manager.getStatus()
    }
    const templates = candidate.templates || {}
    if (!templates.junfengRewardTitle) {
      throw Object.assign(new Error('请先配置君锋镇奖励标题模板'), { failureCode: 'CONFIGURATION_MISSING', configurationIssueId: 'template.junfeng-reward-title' })
    }
    if (!templates.inventoryTitle) {
      throw Object.assign(new Error('请先配置背包标题模板'), { failureCode: 'CONFIGURATION_MISSING', configurationIssueId: 'template.inventory-title' })
    }
    await interfaceDetection?.registerConsumer('junfeng-highlight', {
      active_targets: ['inventory', 'reward'],
      templates: {
        inventory_title: String(templates.inventoryTitle),
        junfeng_reward_title: String(templates.junfengRewardTitle),
        inventory_region: templates.inventoryRegion || {},
        junfeng_reward_region: templates.junfengRewardRegion || {}
      },
      match_threshold: Number(candidate.matchThreshold ?? 0.8)
    })
    manager.setRuntime(candidate)
    return manager.getStatus()
  }))
  ipcMain.handle('junfeng-preview', invoke(() => manager.preview()))
  ipcMain.handle('junfeng-start', invoke(() => manager.start()))
  ipcMain.handle('junfeng-stop', invoke(() => manager.stop('user')))
  ipcMain.handle('junfeng-status', invoke(() => manager.getStatus()))
  ipcMain.handle('junfeng-pick-grid-region', invoke(async () => {
    const result = await window.pickScreenRegion({
      purpose: 'junfeng-grid',
      title: '框选完整的 12×11 君锋镇奖励网格',
      hint: '贴近君锋镇奖励网格外边框，从左上角拖到右下角，包含全部 132 格，按 Esc 取消',
      grid: { columns: 12, rows: 11 },
      minimumSize: { width: 200, height: 200 }
    })
    if (result?.canceled) return result
    if (result?.success === false) throw Object.assign(new Error(result.error?.message || '框选失败'), { code: result.error?.code })
    return { canceled: false, region: result.selectedRegion, displayId: result.displayId, scaleFactor: result.scaleFactor,
      displayPhysicalBounds: result.displayPhysicalBounds, capturedAt: new Date().toISOString() }
  }))
}
