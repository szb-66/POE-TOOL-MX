import { createHash } from 'node:crypto'
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createCoreCurrencyCrafts, parsePoedbBases, parsePoedbCrafts, parsePoedbModifiers } from './poedbParser.js'
import { normalizeCraftingDataset, stableCraftingId } from './model.js'
import { POEDB_BASE_PAGES, POEDB_MODIFIER_PAGES } from './poedbSources.js'

async function fetchOrThrow(fetchImpl, url, signal) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetchImpl(url, { signal, headers: { 'user-agent': 'ExileHelper/1.0 personal-data-refresh' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response
    } catch (error) {
      if (signal.aborted) throw error
      lastError = error
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 600))
    }
  }
  throw new Error(`${url} 获取失败：${lastError?.message || '网络错误'}`, { cause: lastError })
}

function detectLeague(html) {
  const matches = [...html.matchAll(/<img[^>]+alt="([^"]+)"[^>]+(?:league|League|Mirage|Settlers|Mercenaries)/gi)]
  return matches[0]?.[1] || 'current'
}

export class CraftingDataUpdater {
  constructor({ repository, storageRoot, fetchImpl = fetch }) {
    this.repository = repository
    this.storageRoot = storageRoot
    this.fetchImpl = fetchImpl
    this.controller = null
  }

  cancel() {
    if (this.controller) this.controller.abort()
  }

  async update(onProgress = () => {}) {
    if (this.controller) throw new Error('已有数据更新正在进行')
    this.controller = new AbortController()
    const signal = this.controller.signal
    const staging = path.join(this.storageRoot, `.staging-${Date.now()}`)
    try {
      await mkdir(path.join(staging, 'images'), { recursive: true })
      const pageResults = []
      for (let index = 0; index < POEDB_BASE_PAGES.length; index += 1) {
        const [page, category] = POEDB_BASE_PAGES[index]
        const url = `https://poedb.tw/cn/${page}`
        const html = await (await fetchOrThrow(this.fetchImpl, url, signal)).text()
        const bases = parsePoedbBases(html, { category })
        if (!bases.length) throw new Error(`${page} 底材解析结果为空`)
        pageResults.push({ url, html, bases })
        onProgress({ phase: 'pages', completed: index + 1, total: POEDB_BASE_PAGES.length, label: page })
      }
      const modifierResults = []
      for (let index = 0; index < POEDB_MODIFIER_PAGES.length; index += 1) {
        const page = POEDB_MODIFIER_PAGES[index]
        const url = `https://poedb.tw/cn/${page}`
        const modifiers = parsePoedbModifiers(await (await fetchOrThrow(this.fetchImpl, url, signal)).text())
        if (!modifiers.length) throw new Error(`${page} 词缀解析结果为空`)
        modifierResults.push({ url, modifiers })
        onProgress({ phase: 'modifiers', completed: index + 1, total: POEDB_MODIFIER_PAGES.length, label: page })
      }
      const [benchHtml, harvestHtml] = await Promise.all([
        fetchOrThrow(this.fetchImpl, 'https://poedb.tw/cn/Crafting_Bench', signal).then((response) => response.text()),
        fetchOrThrow(this.fetchImpl, 'https://poedb.tw/cn/Horticrafting', signal).then((response) => response.text())
      ])
      const bases = [...new Map(pageResults.flatMap((entry) => entry.bases).map((entry) => [entry.id, entry])).values()]
      const modifiers = [...new Map(modifierResults.flatMap((entry) => entry.modifiers).map((entry) => [entry.id, entry])).values()]
      // ponytail: merge+dedup — createCoreCurrencyCrafts() generates canonical costs,
      // prior-dataset staticCrafts may carry additional info; Map keeps last-write-wins
      const staticCrafts = this.repository.getDataset().crafts.filter((craft) => craft.provider === 'currency' || ['lock_prefixes', 'lock_suffixes', 'cannot_roll_attack', 'cannot_roll_caster', 'multimod'].includes(craft.effectKind))
      const crafts = [...new Map([
        ...createCoreCurrencyCrafts(), ...staticCrafts,
        ...parsePoedbCrafts(benchHtml, { provider: 'bench' }), ...parsePoedbCrafts(harvestHtml, { provider: 'harvest' })
      ].map((entry) => [entry.id, entry])).values()]
      const images = { placeholder: 'images/placeholder.svg' }
      bases.forEach((base) => { base.imageId = 'placeholder'; delete base.imageUrl })
      onProgress({ phase: 'text-only', completed: bases.length, total: bases.length, skippedImages: bases.length })
      await copyFile(path.join(this.repository.builtinRoot, 'images', 'placeholder.svg'), path.join(staging, 'images', 'placeholder.svg'))
      const firstHtml = pageResults[0]?.html || ''
      const dataset = {
        manifest: {
          schemaVersion: 1, game: 'poe1', locale: 'zh-CN', league: detectLeague(firstHtml), patch: 'current',
          generatedAt: new Date().toISOString(), checksum: 'pending',
          sources: [...new Set([...pageResults, ...modifierResults].map((entry) => entry.url).concat(['https://poedb.tw/cn/Crafting_Bench', 'https://poedb.tw/cn/Horticrafting']))]
            .map((url) => ({ id: stableCraftingId('source', url), url }))
        }, bases, modifiers, crafts, images
      }
      const checksumInput = JSON.stringify({ ...dataset, manifest: { ...dataset.manifest, checksum: '' } })
      dataset.manifest.checksum = createHash('sha256').update(checksumInput).digest('hex')
      normalizeCraftingDataset(dataset)
      await writeFile(path.join(staging, 'dataset.json'), `${JSON.stringify(dataset, null, 2)}\n`)
      onProgress({ phase: 'validate', completed: 1, total: 1 })
      return await this.repository.activateStaged(staging)
    } catch (error) {
      await rm(staging, { recursive: true, force: true })
      if (signal.aborted) throw new Error('数据更新已取消')
      throw error
    } finally {
      this.controller = null
    }
  }
}
