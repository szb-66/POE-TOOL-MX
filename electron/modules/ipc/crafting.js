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
  ipcMain.handle('crafting-search-modifier-catalog', async (_event, input = {}) => {
    await service.initialize()
    return service.repository.searchModifierCatalog({ baseId: safeId(input.baseId), itemLevel: input.itemLevel, query: safeQuery(input.query) })
  })
  ipcMain.handle('crafting-search-affix-suggestions', async (_event, input = {}) => {
    await service.initialize()
    return service.repository.searchAffixSuggestions({ query: safeQuery(input.query), limit: Math.min(100, Number(input.limit) || 50) })
  })
  ipcMain.handle('crafting-search-eldritch-implicit-suggestions', async (_event, input = {}) => {
    await service.initialize()
    return service.searchEldritchImplicitSuggestions({
      query: safeQuery(input.query),
      source: input.source === 'eater' ? 'eater' : 'exarch',
      tier: Math.max(1, Math.min(4, Math.trunc(Number(input.tier)) || 1)),
      limit: Math.min(100, Number(input.limit) || 50)
    })
  })
  ipcMain.handle('crafting-create-manual-session', async (_event, input = {}) => { await service.initialize(); return service.createManualSession(input) })
  ipcMain.handle('crafting-apply-manual-currency', async (_event, session, actionId) => { await service.initialize(); return service.applyManualCurrency(session, safeId(actionId)) })
  ipcMain.handle('crafting-list-manual-essences', async (_event, session) => { await service.initialize(); return service.listManualEssences(session) })
  ipcMain.handle('crafting-apply-manual-essence', async (_event, session, essenceId) => { await service.initialize(); return service.applyManualEssence(session, safeId(essenceId)) })
  ipcMain.handle('crafting-list-manual-bench-crafts', async (_event, session) => { await service.initialize(); return service.listManualBenchCrafts(session) })
  ipcMain.handle('crafting-apply-manual-bench-craft', async (_event, session, benchCraftId) => { await service.initialize(); return service.applyManualBenchCraft(session, safeId(benchCraftId)) })
  ipcMain.handle('crafting-list-manual-fossils', async (_event, session) => { await service.initialize(); return service.listManualFossils(session) })
  ipcMain.handle('crafting-apply-manual-fossils', async (_event, session, input = {}) => {
    await service.initialize()
    return service.applyManualFossils(session, { sockets: Math.trunc(Number(input.sockets)), fossilIds: Array.isArray(input.fossilIds) ? input.fossilIds.map(safeId) : [] })
  })
  ipcMain.handle('crafting-list-manual-harvest-crafts', async (_event, session) => { await service.initialize(); return service.listManualHarvestCrafts(session) })
  ipcMain.handle('crafting-apply-manual-harvest-craft', async (_event, session, craftId) => { await service.initialize(); return service.applyManualHarvestCraft(session, safeId(craftId)) })
  ipcMain.handle('crafting-list-manual-eldritch-crafts', async (_event, session) => { await service.initialize(); return service.listManualEldritchCrafts(session) })
  ipcMain.handle('crafting-apply-manual-eldritch-craft', async (_event, session, actionId) => { await service.initialize(); return service.applyManualEldritchCraft(session, safeId(actionId)) })
  ipcMain.handle('crafting-list-manual-influence-crafts', async (_event, session) => { await service.initialize(); return service.listManualInfluenceCrafts(session) })
  ipcMain.handle('crafting-list-awakener-donor-candidates', async (_event, session, input = {}) => {
    await service.initialize()
    return service.listManualAwakenerDonorCandidates(session, { baseId: input.baseId ? safeId(input.baseId) : '', itemLevel: input.itemLevel, influence: input.influence ? safeId(input.influence) : '' })
  })
  ipcMain.handle('crafting-configure-awakener-donor', async (_event, session, input = {}) => {
    await service.initialize()
    return service.configureManualAwakenerDonor(session, { baseId: safeId(input.baseId), itemLevel: input.itemLevel, influence: safeId(input.influence), modifierId: safeId(input.modifierId), tierId: safeId(input.tierId), seed: input.seed })
  })
  ipcMain.handle('crafting-clear-awakener-donor', async (_event, session) => { await service.initialize(); return service.clearManualAwakenerDonor(session) })
  ipcMain.handle('crafting-apply-manual-influence-craft', async (_event, session, actionId) => { await service.initialize(); return service.applyManualInfluenceCraft(session, safeId(actionId)) })
  ipcMain.handle('crafting-list-manual-veiled-crafts', async (_event, session) => { await service.initialize(); return service.listManualVeiledCrafts(session) })
  ipcMain.handle('crafting-apply-manual-veiled-craft', async (_event, session, actionId) => { await service.initialize(); return service.applyManualVeiledCraft(session, safeId(actionId)) })
  ipcMain.handle('crafting-select-manual-veiled-option', async (_event, session, modifierId, tierId) => { await service.initialize(); return service.selectManualVeiledOption(session, safeId(modifierId), safeId(tierId)) })
  ipcMain.handle('crafting-list-manual-beastcrafts', async (_event, session, input = {}) => { await service.initialize(); return service.listManualBeastcrafts(session, { beastLevel: input.beastLevel }) })
  ipcMain.handle('crafting-apply-manual-beastcraft', async (_event, session, recipeId, input = {}) => { await service.initialize(); return service.applyManualBeastcraft(session, safeId(recipeId), { beastLevel: input.beastLevel }) })
  ipcMain.handle('crafting-select-manual-split-result', async (_event, session, itemId) => { await service.initialize(); return service.selectManualSplitResult(session, safeId(itemId)) })
  ipcMain.handle('crafting-preview-manual-currency', async (_event, session, actionId) => { await service.initialize(); return service.previewManualCurrency(session, safeId(actionId)) })
  ipcMain.handle('crafting-undo-manual-action', async (_event, session) => { await service.initialize(); return service.undoManualAction(session) })
  ipcMain.handle('crafting-redo-manual-action', async (_event, session) => { await service.initialize(); return service.redoManualAction(session) })
  ipcMain.handle('crafting-reset-manual-session', async (_event, session) => { await service.initialize(); return service.resetManualSession(session) })
  ipcMain.handle('crafting-update-data', async (event) => {
    await service.initialize()
    return service.updater.update((progress) => { if (senderAlive(event.sender)) event.sender.send('crafting-update-progress', progress) })
  })
  ipcMain.handle('crafting-cancel-update', () => { service.updater.cancel(); return { success: true } })
  ipcMain.handle('crafting-get-prices', async () => { await service.initializePrices(); return service.prices.getSnapshot() })
  ipcMain.handle('crafting-refresh-prices', async (_event, force = false) => { await service.initializePrices(); return service.prices.refresh({ force: Boolean(force) }) })
  ipcMain.handle('crafting-set-price-override', async (_event, resourceId, value) => { await service.initializePrices(); return service.prices.setOverride(safeId(resourceId), value) })
  ipcMain.handle('crafting-remove-price-override', async (_event, resourceId) => { await service.initializePrices(); return service.prices.removeOverride(safeId(resourceId)) })
  ipcMain.handle('crafting-start-plan', async (event, request, options = {}) => {
    await service.initializePrices()
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
