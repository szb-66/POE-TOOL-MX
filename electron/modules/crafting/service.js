import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { CraftingDataRepository } from './dataRepository.js'
import { CraftingPriceService } from './priceService.js'
import { CraftingDataUpdater } from './updater.js'
import { CraftingTaskManager } from './taskManager.js'
import { applyManualBeastcraft, applyManualBenchCraft, applyManualCurrency, applyManualEldritchCraft, applyManualEssence, applyManualFossils, applyManualHarvestCraft, applyManualInfluenceCraft, applyManualVeiledCraft, clearManualAwakenerDonor, configureManualAwakenerDonor, createManualSession, inspectManualCurrencies, listManualAwakenerDonorCandidates, listManualBeastcrafts, listManualBenchCrafts, listManualEldritchCrafts, listManualEssences, listManualFossils, listManualHarvestCrafts, listManualInfluenceCrafts, listManualVeiledCrafts, previewManualCurrency, redoManualAction, resetManualSession, selectManualSplitResult, selectManualVeiledOption, undoManualAction } from './manualCrafting.js'

export class CraftingService {
  constructor({ storageRoot, protocol, net, fetchImpl = fetch }) {
    this.storageRoot = storageRoot
    this.protocol = protocol
    this.net = net
    this.repository = new CraftingDataRepository({ userDataRoot: path.join(storageRoot, 'datasets') })
    this.prices = new CraftingPriceService({
      storageRoot: path.join(storageRoot, 'prices'),
      fetchImpl,
      getRequiredResources: () => this.requiredPriceResources()
    })
    this.updater = new CraftingDataUpdater({ repository: this.repository, storageRoot: path.join(storageRoot, 'datasets'), fetchImpl })
    this.tasks = new CraftingTaskManager()
    this.ready = null
    this.pricesReady = null
  }

  initialize() {
    if (!this.ready) this.ready = this.repository.initialize()
    return this.ready
  }

  initializePrices() {
    if (!this.pricesReady) this.pricesReady = this.initialize().then(() => this.prices.initialize())
    return this.pricesReady
  }

  createManualSession(input) {
    const session = createManualSession(this.repository.getDataset(), input)
    return { session, currencies: inspectManualCurrencies(this.repository.getDataset(), session), essences: listManualEssences(this.repository.getDataset(), session), benchCrafts: listManualBenchCrafts(this.repository.getDataset(), session), fossils: listManualFossils(this.repository.getDataset(), session), harvest: listManualHarvestCrafts(this.repository.getDataset(), session), eldritch: listManualEldritchCrafts(this.repository.getDataset(), session), influence: listManualInfluenceCrafts(this.repository.getDataset(), session), veiled: listManualVeiledCrafts(this.repository.getDataset(), session), beastcraft: listManualBeastcrafts(this.repository.getDataset(), session) }
  }

  applyManualCurrency(session, actionId) { return applyManualCurrency(this.repository.getDataset(), session, actionId) }
  listManualEssences(session) { return listManualEssences(this.repository.getDataset(), session) }
  applyManualEssence(session, essenceId) { return applyManualEssence(this.repository.getDataset(), session, essenceId) }
  listManualBenchCrafts(session) { return listManualBenchCrafts(this.repository.getDataset(), session) }
  applyManualBenchCraft(session, benchCraftId) { return applyManualBenchCraft(this.repository.getDataset(), session, benchCraftId) }
  listManualFossils(session) { return listManualFossils(this.repository.getDataset(), session) }
  applyManualFossils(session, input) { return applyManualFossils(this.repository.getDataset(), session, input) }
  listManualHarvestCrafts(session) { return listManualHarvestCrafts(this.repository.getDataset(), session) }
  applyManualHarvestCraft(session, craftId) { return applyManualHarvestCraft(this.repository.getDataset(), session, craftId) }
  listManualEldritchCrafts(session) { return listManualEldritchCrafts(this.repository.getDataset(), session) }
  applyManualEldritchCraft(session, actionId) { return applyManualEldritchCraft(this.repository.getDataset(), session, actionId) }
  listManualInfluenceCrafts(session) { return listManualInfluenceCrafts(this.repository.getDataset(), session) }
  listManualAwakenerDonorCandidates(session, input) { return listManualAwakenerDonorCandidates(this.repository.getDataset(), session, input) }
  configureManualAwakenerDonor(session, input) { return configureManualAwakenerDonor(this.repository.getDataset(), session, input) }
  clearManualAwakenerDonor(session) { return clearManualAwakenerDonor(this.repository.getDataset(), session) }
  applyManualInfluenceCraft(session, actionId) { return applyManualInfluenceCraft(this.repository.getDataset(), session, actionId) }
  listManualVeiledCrafts(session) { return listManualVeiledCrafts(this.repository.getDataset(), session) }
  applyManualVeiledCraft(session, actionId) { return applyManualVeiledCraft(this.repository.getDataset(), session, actionId) }
  selectManualVeiledOption(session, modifierId, tierId) { return selectManualVeiledOption(this.repository.getDataset(), session, modifierId, tierId) }
  listManualBeastcrafts(session, input) { return listManualBeastcrafts(this.repository.getDataset(), session, input) }
  applyManualBeastcraft(session, recipeId, input) { return applyManualBeastcraft(this.repository.getDataset(), session, recipeId, input) }
  selectManualSplitResult(session, itemId) { return selectManualSplitResult(this.repository.getDataset(), session, itemId) }
  previewManualCurrency(session, actionId) { return previewManualCurrency(this.repository.getDataset(), session, actionId) }
  undoManualAction(session) { return undoManualAction(this.repository.getDataset(), session) }
  redoManualAction(session) { return redoManualAction(this.repository.getDataset(), session) }
  resetManualSession(session) { return resetManualSession(this.repository.getDataset(), session) }

  requiredPriceResources() {
    const dataset = this.repository.getDataset()
    const resources = new Map()
    const addCosts = (costs) => (costs || []).forEach((entry) => {
      if (entry?.resourceId && entry?.resourceName) resources.set(`${entry.resourceId}:${entry.resourceName}`, entry)
    })
    dataset.crafts.forEach((craft) => addCosts(craft.cost))
    dataset.modifierFamilies.forEach((family) => family.entries.forEach((modifier) => {
      modifier.craftedOptions.forEach((option) => addCosts(option.cost))
    }))
    return [...resources.values()]
  }

  registerImageProtocol() {
    this.protocol.handle('crafting-image', async (request) => {
      try {
        const url = new URL(request.url)
        const imageId = decodeURIComponent(url.pathname.replace(/^\//, ''))
        const info = await this.repository.imageInfo(imageId)
        if (!info) return new Response('Not found', { status: 404 })
        return this.net.fetch(pathToFileURL(info.file).toString())
      } catch {
        return new Response('Bad request', { status: 400 })
      }
    })
  }

  cleanup() {
    this.updater.cancel()
    this.tasks.cleanup()
  }
}
