import { ipcMain } from 'electron'
import { CHAOS_ERROR_CODES, serializeChaosError } from '../chaosRecipe/errors.js'
import { resolveStashGridLayout } from '../chaosRecipe/layout.js'
import { OverlayDragSession } from '../window/overlayDrag.js'

const ok = (data = {}) => ({ success: true, data })

export function registerChaosRecipeHandlers(service, window, shared = {}) {
  const interfaceDetection = shared.interfaceDetection
  const control = service.control
  const controlDrag = new OverlayDragSession()
  const invoke = (handler) => async (_event, ...args) => {
    try {
      return ok(await handler(...args))
    } catch (error) {
      if (error?.code === CHAOS_ERROR_CODES.SESSION_EXPIRED) {
        await service.expireSession().catch(() => service.clear())
      }
      return { success: false, error: serializeChaosError(error) }
    }
  }

  ipcMain.handle('chaos-recipe-auth-status', invoke(() => service.getAuthStatus()))
  ipcMain.handle('chaos-recipe-auth-restore', invoke(() => service.restoreAuth()))
  ipcMain.handle('chaos-recipe-auth-open-web', invoke(() => service.openWebLogin()))
  ipcMain.handle('chaos-recipe-auth-complete-web', invoke(() => service.completeWebLogin()))
  ipcMain.handle('chaos-recipe-auth-token', invoke((token) => service.setSessionToken(token)))
  ipcMain.handle('chaos-recipe-auth-logout', invoke(() => service.logout()))

  ipcMain.handle('chaos-recipe-list-leagues', invoke(() => service.listLeagues()))
  ipcMain.handle('chaos-recipe-list-tabs', invoke((league) => service.listTabs(league)))
  ipcMain.handle('chaos-recipe-refresh', invoke((request) => service.refresh(request || {})))
  ipcMain.handle('chaos-recipe-get-snapshot', invoke(() => service.getSnapshot()))

  ipcMain.handle('chaos-recipe-pick-grid-region', invoke(async () => {
    const result = await window.pickScreenRegion()
    if (result?.canceled) return result
    return {
      canceled: false,
      region: result.selectedRegion,
      displayId: result.displayId,
      scaleFactor: result.scaleFactor,
      displayPhysicalBounds: result.displayPhysicalBounds,
      capturedAt: new Date().toISOString()
    }
  }))

  ipcMain.handle('chaos-recipe-open-overlay', invoke((setCount, calibration) => {
    const plan = service.createPlan(setCount, calibration)
    const tab = plan.tabs[0]
    const { region } = resolveStashGridLayout(tab, calibration)
    service.overlay.create({
      region,
      tabId: tab.tabId,
      tabName: tab.tabName,
      columns: tab.columns,
      items: tab.items,
      status: 'preview',
      message: `${plan.setCount} 套 · ${plan.itemCount} 件`
    })
    return plan
  }))
  ipcMain.handle('chaos-recipe-close-overlay', invoke(() => {
    service.overlay.close()
    return { closed: true }
  }))
  ipcMain.handle('chaos-recipe-overlay-state', invoke(() => service.overlay.getState()))

  ipcMain.handle('chaos-recipe-automation-start', invoke((request = {}) => {
    const plan = service.createPlan(request.setCount, request.calibration)
    return service.automation.start(plan, {
      calibration: request.calibration,
      templates: request.templates,
      matchThreshold: request.matchThreshold,
      operationDelayMs: request.operationDelayMs
    })
  }))
  ipcMain.handle('chaos-recipe-automation-pause', invoke(() => service.automation.pause()))
  ipcMain.handle('chaos-recipe-automation-resume', invoke(() => service.automation.resume()))
  ipcMain.handle('chaos-recipe-automation-stop', invoke(() => service.automation.stop()))
  ipcMain.handle('chaos-recipe-automation-status', invoke(() => service.automation.getStatus()))

  ipcMain.handle('chaos-recipe-runtime-update', invoke(async (runtime = {}) => {
    if (!runtime.enabled) {
      interfaceDetection?.unregisterConsumer('chaos-recipe')
      return control?.setRuntime({ ...runtime, enabled: false }) || { enabled: false }
    }
    const templates = runtime.templates || {}
    if (!templates.stashTitle || !templates.inventoryTitle) {
      throw new Error('请先在设置页配置仓库和背包标题模板')
    }
    if (!interfaceDetection) throw new Error('公共界面检测服务未初始化')
    const detectionConfig = {
      templates: {
        stash_title: String(templates.stashTitle),
        inventory_title: String(templates.inventoryTitle),
        stash_region: templates.stashRegion || {},
        inventory_region: templates.inventoryRegion || {}
      },
      match_threshold: Number(runtime.matchThreshold ?? 0.8)
    }
    await interfaceDetection.registerConsumer('chaos-recipe', detectionConfig)
    return control?.setRuntime({ ...runtime, enabled: true }) || { enabled: true }
  }))
  ipcMain.handle('chaos-recipe-control-state', invoke(() => control?.getState() || { visible: false }))
  ipcMain.handle('chaos-recipe-control-refresh', invoke(async () => {
    const runtime = control?.runtime || {}
    const snapshot = await service.refresh({
      league: runtime.league,
      selectedTabIds: runtime.selectedTabIds,
      includeIdentified: runtime.includeIdentified,
      tabFolderStates: runtime.tabFolderStates?.[runtime.league] || {}
    })
    control?.sync()
    const mainWindow = window.getMainWindow?.()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('chaos-recipe-snapshot-updated', snapshot)
    }
    return snapshot
  }))
  ipcMain.handle('chaos-recipe-control-preview', invoke(() => {
    const runtime = control?.runtime || {}
    const plan = service.createPlan(runtime.targetSetCount, runtime.calibration)
    const tab = plan.tabs[0]
    const { region } = resolveStashGridLayout(tab, runtime.calibration)
    service.overlay.create({
      region,
      tabId: tab.tabId,
      tabName: tab.tabName,
      columns: tab.columns,
      items: tab.items,
      status: 'preview',
      message: `${plan.setCount} 套 · ${plan.itemCount} 件`
    })
    return plan
  }))
  ipcMain.handle('chaos-recipe-control-action', invoke(() => {
    const status = service.automation.getStatus().status
    if (status === 'running') return service.automation.stop('overlay')
    if (status === 'paused') return service.automation.resume()
    const runtime = control?.runtime || {}
    const plan = service.createPlan(runtime.targetSetCount, runtime.calibration)
    return service.automation.start(plan, {
      calibration: runtime.calibration,
      templates: runtime.templates,
      matchThreshold: runtime.matchThreshold,
      operationDelayMs: runtime.operationDelayMs
    })
  }))
  ipcMain.handle('interface-detection-state', invoke(() => interfaceDetection?.getState() || {}))
  ipcMain.handle('interface-detection-update-config', invoke((runtime = {}) => {
    const templates = runtime.templates || {}
    return interfaceDetection?.updateConfig({
      templates: {
        stash_title: String(templates.stashTitle || ''),
        inventory_title: String(templates.inventoryTitle || ''),
        stash_region: templates.stashRegion || {},
        inventory_region: templates.inventoryRegion || {}
      },
      match_threshold: Number(runtime.matchThreshold ?? 0.8)
    }) || {}
  }))
  ipcMain.on('chaos-recipe-control-move', (event, point = {}) => {
    if (!control?.window || control.window.isDestroyed() || control.window.webContents !== event.sender) return
    if (point.phase === 'start') {
      controlDrag.begin(event.sender.id, point, control.window.getBounds())
      return
    }
    if (point.phase === 'end') {
      controlDrag.end(event.sender.id)
      return
    }
    if (point.phase !== 'move') return
    const target = controlDrag.move(event.sender.id, point)
    if (target) control.moveToDip(target.x, target.y)
  })
}
