import { ipcMain } from 'electron'

const ok = data => ({ success: true, data })
const invoke = handler => async (_event, ...args) => {
  try { return ok(await handler(...args)) } catch (error) {
    return { success: false, error: { code: error.code || 'STASH_PICKUP_ERROR', message: error.message || String(error) } }
  }
}

export function registerStashPickupHandlers(manager, window, { interfaceDetection } = {}) {
  ipcMain.handle('stash-pickup-runtime-update', invoke(async (runtime = {}) => {
    const enabled = runtime.enabled == null ? Boolean(manager.runtime.enabled) : Boolean(runtime.enabled)
    manager.setRuntime({ ...runtime, enabled })
    if (!enabled) {
      interfaceDetection?.unregisterConsumer('stash-pickup')
      if (manager.getStatus().status === 'running') manager.stop('disabled')
      return manager.getStatus()
    }
    const templates = runtime.templates || {}
    if (!templates.stashTitle || !templates.inventoryTitle) throw new Error('请先配置仓库和背包标题模板')
    await interfaceDetection?.registerConsumer('stash-pickup', {
      templates: {
        stash_title: String(templates.stashTitle),
        inventory_title: String(templates.inventoryTitle),
        junfeng_reward_title: String(templates.junfengRewardTitle || ''),
        stash_region: templates.stashRegion || {},
        inventory_region: templates.inventoryRegion || {},
        junfeng_reward_region: templates.junfengRewardRegion || {}
      },
      match_threshold: Number(runtime.matchThreshold ?? 0.8)
    })
    return manager.getStatus()
  }))
  ipcMain.handle('stash-pickup-preview', invoke(() => manager.preview()))
  ipcMain.handle('stash-pickup-start', invoke(() => manager.start()))
  ipcMain.handle('stash-pickup-stop', invoke(() => manager.stop('user')))
  ipcMain.handle('stash-pickup-status', invoke(() => manager.getStatus()))
  ipcMain.handle('stash-pickup-pick-grid-region', invoke(async () => {
    const result = await window.pickScreenRegion()
    if (result?.canceled) return result
    return {
      canceled: false, region: result.selectedRegion, displayId: result.displayId,
      scaleFactor: result.scaleFactor, displayPhysicalBounds: result.displayPhysicalBounds,
      capturedAt: new Date().toISOString()
    }
  }))
}
