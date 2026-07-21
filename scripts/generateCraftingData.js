import { createHash } from 'node:crypto'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createCoreCurrencyCrafts,
  parsePoedbBases,
  parsePoedbCrafts,
  parsePoedbModifiers
} from '../electron/modules/crafting/poedbParser.js'
import { normalizeCraftingDataset, stableCraftingId } from '../electron/modules/crafting/model.js'
import { POEDB_BASE_PAGES, POEDB_MODIFIER_PAGES } from '../electron/modules/crafting/poedbSources.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '..')
const outputRoot = path.join(projectRoot, 'electron', 'assets', 'crafting-data')
const fixtureRoot = path.join(projectRoot, 'test', 'fixtures', 'crafting')

async function fetchText(url) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'ExileHelper/1.0 personal-data-refresh' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.text()
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 600))
    }
  }
  throw new Error(`${url} 获取失败：${lastError?.message || '网络错误'}`, { cause: lastError })
}

async function mapLimited(entries, limit, operation) {
  const results = new Array(entries.length)
  let cursor = 0
  async function worker() {
    while (cursor < entries.length) {
      const index = cursor++
      results[index] = await operation(entries[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, entries.length) }, worker))
  return results
}

function createMetaCrafts() {
  const definitions = [
    ['lock-prefixes', '前缀无法被变更', 'lock_prefixes', 2],
    ['lock-suffixes', '后缀无法被变更', 'lock_suffixes', 2],
    ['cannot-roll-attack', '无法骰出攻击词缀', 'cannot_roll_attack', 1],
    ['cannot-roll-caster', '无法骰出法术词缀', 'cannot_roll_caster', 1],
    ['multimod', '可以拥有多个工艺词缀', 'multimod', 2]
  ]
  return definitions.map(([key, name, effectKind, amount]) => ({
    id: `craft:bench:${key}`,
    provider: 'bench', name, effectKind, itemClasses: [],
    cost: [{ resourceId: 'currency:divine', resourceName: '神圣石', amount }], params: { meta: true }
  }))
}

async function loadFixtureDataset() {
  const [items, modifiers, bench, harvest] = await Promise.all([
    readFile(path.join(fixtureRoot, 'items.html'), 'utf8'), readFile(path.join(fixtureRoot, 'modifiers.html'), 'utf8'),
    readFile(path.join(fixtureRoot, 'bench.html'), 'utf8'), readFile(path.join(fixtureRoot, 'harvest.html'), 'utf8')
  ])
  return {
    bases: parsePoedbBases(items, { category: '首饰与珠宝' }),
    modifiers: parsePoedbModifiers(modifiers),
    crafts: [...createCoreCurrencyCrafts(), ...createMetaCrafts(), ...parsePoedbCrafts(bench, { provider: 'bench' }), ...parsePoedbCrafts(harvest, { provider: 'harvest' })]
  }
}

async function loadLiveDataset() {
  const pages = await mapLimited(POEDB_BASE_PAGES, 3, async ([page, category]) => {
    const url = `https://poedb.tw/cn/${page}`
    const html = await fetchText(url)
    process.stdout.write(`已解析 ${page}\n`)
    return { url, bases: parsePoedbBases(html, { category }) }
  })
  const modifierPages = await mapLimited(POEDB_MODIFIER_PAGES, 3, async (page) => {
    const url = `https://poedb.tw/cn/${page}`
    const modifiers = parsePoedbModifiers(await fetchText(url))
    if (!modifiers.length) throw new Error(`${page} 词缀解析结果为空`)
    process.stdout.write(`已解析词缀 ${page}\n`)
    return { url, modifiers }
  })
  const [benchHtml, harvestHtml] = await Promise.all([
    fetchText('https://poedb.tw/cn/Crafting_Bench'),
    fetchText('https://poedb.tw/cn/Horticrafting')
  ])
  return {
    bases: [...new Map(pages.flatMap((page) => page.bases).map((entry) => [entry.id, entry])).values()],
    modifiers: [...new Map(modifierPages.flatMap((page) => page.modifiers).map((entry) => [entry.id, entry])).values()],
    crafts: [
      ...createCoreCurrencyCrafts(), ...createMetaCrafts(),
      ...parsePoedbCrafts(benchHtml, { provider: 'bench' }),
      ...parsePoedbCrafts(harvestHtml, { provider: 'harvest' })
    ],
    sources: [...pages, ...modifierPages].map((page) => page.url)
  }
}

async function cacheImages(bases, live, targetRoot) {
  const imageDir = path.join(targetRoot, 'images')
  await mkdir(imageDir, { recursive: true })
  const placeholderSource = path.join(fixtureRoot, 'placeholder.svg')
  const placeholderTarget = path.join(imageDir, 'placeholder.svg')
  await writeFile(placeholderTarget, await readFile(placeholderSource))
  const images = { placeholder: 'images/placeholder.svg' }
  await mapLimited(bases, 5, async (base) => {
    if (!live || !base.imageUrl) {
      base.imageId = 'placeholder'
      return
    }
    try {
      const response = await fetch(base.imageUrl, { headers: { 'user-agent': 'ExileHelper/1.0 personal-data-refresh' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const fileName = `${base.imageId.replace(/[^a-zA-Z0-9_-]/g, '_')}.webp`
      await writeFile(path.join(imageDir, fileName), Buffer.from(await response.arrayBuffer()))
      images[base.imageId] = `images/${fileName}`
    } catch {
      base.imageId = 'placeholder'
    }
  })
  return images
}

async function main() {
  const live = process.argv.includes('--live')
  const loaded = live ? await loadLiveDataset() : await loadFixtureDataset()
  if (!loaded.bases.length || !loaded.modifiers.length) throw new Error('解析结果为空，拒绝生成快照')
  const stagingRoot = path.join(path.dirname(outputRoot), `.crafting-data-staging-${process.pid}`)
  const backupRoot = path.join(path.dirname(outputRoot), `.crafting-data-backup-${process.pid}`)
  await rm(stagingRoot, { recursive: true, force: true })
  await mkdir(stagingRoot, { recursive: true })
  const images = await cacheImages(loaded.bases, live, stagingRoot)
  loaded.bases.forEach((base) => delete base.imageUrl)
  const sourceUrls = [...new Set(loaded.sources ?? [
    'https://poedb.tw/cn/Items', 'https://poedb.tw/cn/Modifiers',
    'https://poedb.tw/cn/Crafting_Bench', 'https://poedb.tw/cn/Horticrafting'
  ])]
  const dataset = {
    manifest: {
      schemaVersion: 1, game: 'poe1', locale: 'zh-CN', league: live ? 'current' : 'Fixture',
      patch: live ? 'current' : 'test', generatedAt: new Date().toISOString(), checksum: 'pending',
      sources: sourceUrls.map((url) => ({ id: stableCraftingId('source', url), url }))
    },
    bases: loaded.bases,
    modifiers: loaded.modifiers,
    crafts: [...new Map(loaded.crafts.map((entry) => [entry.id, entry])).values()],
    images
  }
  const checksumInput = JSON.stringify({ ...dataset, manifest: { ...dataset.manifest, checksum: '' } })
  dataset.manifest.checksum = createHash('sha256').update(checksumInput).digest('hex')
  normalizeCraftingDataset(dataset)
  await writeFile(path.join(stagingRoot, 'dataset.json'), `${JSON.stringify(dataset, null, 2)}\n`)
  await rm(backupRoot, { recursive: true, force: true })
  try {
    await cp(outputRoot, backupRoot, { recursive: true }).catch((error) => { if (error.code !== 'ENOENT') throw error })
    await rm(outputRoot, { recursive: true, force: true })
    await cp(stagingRoot, outputRoot, { recursive: true })
    await rm(stagingRoot, { recursive: true, force: true })
    await rm(backupRoot, { recursive: true, force: true })
  } catch (error) {
    await rm(outputRoot, { recursive: true, force: true })
    await cp(backupRoot, outputRoot, { recursive: true }).catch(() => {})
    await rm(stagingRoot, { recursive: true, force: true })
    throw error
  }
  process.stdout.write(`已生成 ${dataset.bases.length} 个底材、${dataset.modifiers.length} 个词缀族、${dataset.crafts.length} 个工艺。\n`)
}

main().catch(async (error) => {
  const stagingRoot = path.join(path.dirname(outputRoot), `.crafting-data-staging-${process.pid}`)
  const backupRoot = path.join(path.dirname(outputRoot), `.crafting-data-backup-${process.pid}`)
  await rm(stagingRoot, { recursive: true, force: true }).catch(() => {})
  await cp(backupRoot, outputRoot, { recursive: true }).catch(() => {})
  process.stderr.write(`${error.stack || error.message}\n`)
  process.exitCode = 1
})
