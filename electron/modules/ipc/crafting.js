import { ipcMain } from 'electron'

function safeQuery(value, maximum = 120) {
  return String(value ?? '').slice(0, maximum)
}

function safeId(value) {
  const id = String(value ?? '')
  if (!/^[\p{L}\p{N}:_.-]{1,160}$/u.test(id)) throw new Error('ID 格式无效')
  return id
}

function senderAlive(sender) {
  return sender && !sender.isDestroyed()
}

function safePlanOptions(input = {}) {
  const integer = (value, fallback, min, max) => Math.max(min, Math.min(max, Math.trunc(Number(value) || fallback)))
  return {
    seed: integer(input.seed, 20260721, 1, 0x7fffffff),
    quickSamples: integer(input.quickSamples, 10_000, 100, 10_000),
    refineMinimum: integer(input.refineMinimum, 100_000, 1_000, 500_000),
    refineMaximum: integer(input.refineMaximum, 500_000, 1_000, 500_000),
    confidenceRelativeWidth: Math.max(0.01, Math.min(0.2, Number(input.confidenceRelativeWidth) || 0.05))
  }
}

export function registerCraftingHandlers(service) {
  ipcMain.handle('crafting-get-status', async () => { await service.initialize(); return service.repository.getStatus() })
  ipcMain.handle('crafting-list-categories', async () => { await service.initialize(); return service.repository.listCategories() })
  ipcMain.handle('crafting-search-bases', async (_event, input = {}) => {
    await service.initialize()
    return service.repository.searchBases({ query: safeQuery(input.query), category: safeQuery(input.category, 40), itemClass: safeQuery(input.itemClass, 60), page: input.page, pageSize: input.pageSize })
  })
  ipcMain.handle('crafting-search-modifiers', async (_event, input = {}) => {
    await service.initialize()
    const affixType = ['prefix', 'suffix'].includes(input.affixType) ? input.affixType : ''
    return service.repository.searchModifiers({ ...input, affixType, baseId: safeId(input.baseId), query: safeQuery(input.query), pageSize: Math.min(100, Number(input.pageSize) || 50) })
  })
  ipcMain.handle('crafting-update-data', async (event) => {
    await service.initialize()
    return service.updater.update((progress) => { if (senderAlive(event.sender)) event.sender.send('crafting-update-progress', progress) })
  })
  ipcMain.handle('crafting-cancel-update', () => { service.updater.cancel(); return { success: true } })
  ipcMain.handle('crafting-get-prices', async () => { await service.initialize(); return service.prices.getSnapshot() })
  ipcMain.handle('crafting-refresh-prices', async (_event, force = false) => { await service.initialize(); return service.prices.refresh({ force: Boolean(force) }) })
  ipcMain.handle('crafting-set-price-override', async (_event, resourceId, value) => service.prices.setOverride(safeId(resourceId), value))
  ipcMain.handle('crafting-remove-price-override', async (_event, resourceId) => service.prices.removeOverride(safeId(resourceId)))
  ipcMain.handle('crafting-start-plan', async (event, request, options = {}) => {
    await service.initialize()
    const snapshot = service.prices.getSnapshot()
    const priceMap = Object.fromEntries(snapshot.records.filter((record) => record.valid).map((record) => [record.resourceId, record.chaosValue]))
    Object.entries(snapshot.overrides).forEach(([id, value]) => { priceMap[id] = value })
    const taskId = service.tasks.start({
      request, dataset: service.repository.getDataset(), priceMap, priceTime: snapshot.fetchedAt ? new Date(snapshot.fetchedAt).toISOString() : 'unknown',
      options: safePlanOptions(options),
      onEvent: (message) => { if (senderAlive(event.sender)) event.sender.send('crafting-plan-event', message) }
    })
    return { taskId }
  })
  ipcMain.handle('crafting-cancel-plan', (_event, taskId) => ({ success: service.tasks.cancel(safeId(taskId)) }))
}
