import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { CraftingDataRepository } from './dataRepository.js'
import { CraftingPriceService } from './priceService.js'
import { CraftingDataUpdater } from './updater.js'
import { CraftingTaskManager } from './taskManager.js'

export class CraftingService {
  constructor({ storageRoot, protocol, net, fetchImpl = fetch }) {
    this.storageRoot = storageRoot
    this.protocol = protocol
    this.net = net
    this.repository = new CraftingDataRepository({ userDataRoot: path.join(storageRoot, 'datasets') })
    this.prices = new CraftingPriceService({ storageRoot: path.join(storageRoot, 'prices'), fetchImpl })
    this.updater = new CraftingDataUpdater({ repository: this.repository, storageRoot: path.join(storageRoot, 'datasets'), fetchImpl })
    this.tasks = new CraftingTaskManager()
    this.ready = null
  }

  initialize() {
    if (!this.ready) this.ready = Promise.all([this.repository.initialize(), this.prices.initialize()])
    return this.ready
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
