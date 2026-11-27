import { ipcMain } from 'electron'

const ok = data => ({ success: true, data })
const invoke = handler => async (_event, ...args) => {
  try { return ok(await handler(...args)) } catch (error) {
    return { success: false, error: {
      code: error.code || 'STASH_PICKUP_ERROR',
      message: error.message || String(error),
      failureCode: error.failureCode || '',
      configurationIssueId: error.configurationIssueId || ''
    } }
  }
}

export function registerStashPickupHandlers(manager, window, { interfaceDetection } = {}) {
  ipcMain.handle('stash-pickup-runtime-update', invoke(async (runtime = {}) => {
    const enabled = runtime.enabled == null ? Boolean(manager.runtime.enabled) : Boolean(runtime.enabled)
    const candidate = { ...manager.runtime, ...(runtime || {}), enabled }
    if (!enabled) {
      manager.setRuntime(candidate)
      interfaceDetection?.unregisterConsumer('stash-pickup')
      if (manager.getStatus().status === 'running') manager.stop('disabled')
      return manager.getStatus()
    }
    const templates = candidate.templates || {}
    if (!templates.stashTitle) {
      throw Object.assign(new Error('请先配置仓库标题模板'), { failureCode: 'CONFIGURATION_MISSING', configurationIssueId: 'template.stash-title' })
    }
    if (!templates.inventoryTitle) {
      throw Object.assign(new Error('请先配置背包标题模板'), { failureCode: 'CONFIGURATION_MISSING', configurationIssueId: 'template.inventory-title' })
    }
    await interfaceDetection?.registerConsumer('stash-pickup', {
      active_targets: ['inventory', 'stash'],
      templates: {
        stash_title: String(templates.stashTitle),
        inventory_title: String(templates.inventoryTitle),
        stash_region: templates.stashRegion || {},
        inventory_region: templates.inventoryRegion || {}
      },
      match_threshold: Number(candidate.matchThreshold ?? 0.8)
    })
    manager.setRuntime(candidate)
    return manager.getStatus()
  }))
  ipcMain.handle('stash-pickup-preview', invoke(() => manager.preview()))
  ipcMain.handle('stash-pickup-start', invoke(() => manager.start()))
  ipcMain.handle('stash-pickup-stop', invoke(() => manager.stop('user')))
  ipcMain.handle('stash-pickup-status', invoke(() => manager.getStatus()))
  ipcMain.handle('stash-pickup-pick-grid-region', invoke(async () => {
    const result = await window.pickScreenRegion({
      purpose: 'stash-pickup-grid',
      title: '框选完整的仓库取件网格区域',
      hint: '贴近目标仓库网格外边框，从左上角拖到右下角，包含全部格子，按 Esc 取消',
      minimumSize: { width: 200, height: 200 }
    })
    if (result?.canceled) return result
    if (result?.success === false) throw Object.assign(new Error(result.error?.message || '框选失败'), { code: result.error?.code })
    return {
      canceled: false, region: result.selectedRegion, displayId: result.displayId,
      scaleFactor: result.scaleFactor, displayPhysicalBounds: result.displayPhysicalBounds,
      capturedAt: new Date().toISOString()
    }
  }))
}
