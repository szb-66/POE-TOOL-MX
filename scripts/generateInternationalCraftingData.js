import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, rename, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { CRAFTING_SCHEMA_VERSION, normalizeCraftingDataset, stableCraftingId } from '../electron/modules/crafting/model.js'
import { POEDB_BASE_PAGES, POEDB_MODIFIER_PAGES, FLASK_MODIFIER_PAGES, SPECIAL_MODIFIER_PROFILES } from '../electron/modules/crafting/poedbSources.js'
import { finalizePoedbBases, groupModifierFamilies, mergeModifierGoals, parsePoedbBases, parsePoedbModifiers, parsePoedbCrafts, parsePoedbEldritchImplicits, parsePoedbCorruptedImplicits } from '../electron/modules/crafting/poedbParser.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sha256 = text => createHash('sha256').update(text).digest('hex')
const DEFAULT_OUTPUT = path.join(root, 'electron/assets/crafting-data-international')

export async function generateInternationalCraftingData({ patch, offline = false, refresh = false, output = DEFAULT_OUTPUT, cacheRoot = path.join(root, '.cache/international-crafting'), fetchImpl = fetch, onProgress = () => {} } = {}) {
  if (patch !== '3.30.0') throw new Error('必须显式指定已验证的国际服补丁 --patch 3.30.0')
  if (!path.basename(output).includes('international')) throw new Error('国际服输出路径必须包含 international，禁止覆盖国服')
  const pages = [...new Set([...POEDB_BASE_PAGES.map(([page]) => page), ...POEDB_MODIFIER_PAGES, 'Crafting_Bench', 'Horticrafting', 'Eldritch_implicit', 'Vaal_Orb'])]
  const texts = new Map()
  const sources = []
  await mkdir(path.join(cacheRoot, patch), { recursive: true })
  let cursor = 0
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (cursor < pages.length) {
      const page = pages[cursor++]
      const url = `https://poedb.tw/us/${page}`
      const cached = path.join(cacheRoot, patch, `${page}.html`)
      let text
      if (!refresh) {
        try { text = await readFile(cached, 'utf8') } catch (error) { if (error.code !== 'ENOENT') throw error }
      }
      if (!text) {
        if (offline) throw new Error(`缺少英文原始快照 ${page}`)
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const response = await fetchImpl(url, { signal: AbortSignal.timeout(60000) })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            text = await response.text()
            if (!text.includes('<html')) throw new Error('响应不是来源页面')
            await writeFile(cached, text)
            break
          } catch (error) { if (attempt === 2) throw new Error(`${page}: ${error.message}`) }
        }
      }
      texts.set(page, text)
      sources.push({ id: stableCraftingId('source', url), url, sha256: sha256(text) })
      onProgress({ page, completed: texts.size, total: pages.length })
    }
  }))
  // 3.30 新工艺作为版本哨兵，防止将旧语言快照仅改版本号后发布。
  const benchCrafts = parsePoedbCrafts(texts.get('Crafting_Bench'), { provider: 'bench' })
  if (!benchCrafts.some(craft => craft.effectKind === 'lock_prefixes_partial')) throw new Error('英文工艺来源缺少 3.30 部分锁前缀哨兵')
  const basePages = [...POEDB_BASE_PAGES, ...FLASK_MODIFIER_PAGES.map(page => [page, '药剂'])]
  const bases = finalizePoedbBases(basePages.flatMap(([page, category]) => {
    const items = parsePoedbBases(texts.get(page), { category })
    if (!items.length) throw new Error(`英文底材 ${page} 解析为空`)
    return items
  }), SPECIAL_MODIFIER_PROFILES)
  const modifiers = POEDB_MODIFIER_PAGES.flatMap(page => {
    const items = parsePoedbModifiers(texts.get(page), { profileId: page })
    if (!items.length && page !== 'Hybrid_Flasks') throw new Error(`英文词缀 ${page} 解析为空`)
    return items
  })
  const crafts = [...benchCrafts, ...parsePoedbCrafts(texts.get('Horticrafting'), { provider: 'harvest' })]
  const eldritchImplicitFamilies = parsePoedbEldritchImplicits(texts.get('Eldritch_implicit'))
  const corruptedImplicitFamilies = parsePoedbCorruptedImplicits(texts.get('Vaal_Orb'))
  if (bases.length < 900 || modifiers.length < 1900 || !crafts.some(craft => craft.effectKind === 'lock_prefixes_partial') || !eldritchImplicitFamilies.length || !corruptedImplicitFamilies.length) throw new Error('国际服数据覆盖校验失败')
  if (crafts.some(craft => ['reforge_tag', 'remove_add_tag'].includes(craft.effectKind) && !craft.params.tag)) throw new Error('英文花园工艺缺少目标标签')
  if (crafts.some(craft => ['convert_resistance', 'convert_damage'].includes(craft.effectKind) && (!craft.params.fromTag || !craft.params.toTag))) throw new Error('英文转换工艺缺少元素身份')
  bases.forEach(base => { base.imageId = 'placeholder'; delete base.imageUrl })
  const dataset = {
    manifest: { schemaVersion: CRAFTING_SCHEMA_VERSION, game: 'poe1', server: 'international', locale: 'en', patch, league: 'Covens of Umbra', generatedAt: new Date().toISOString(), checksum: '', sources: sources.sort((a, b) => a.url.localeCompare(b.url)) },
    bases, modifierFamilies: groupModifierFamilies(mergeModifierGoals(modifiers, crafts)), crafts,
    eldritchImplicitFamilies, corruptedImplicitFamilies, images: { placeholder: 'images/placeholder.svg' }
  }
  dataset.manifest.checksum = sha256(JSON.stringify(dataset))
  normalizeCraftingDataset(dataset)
  await mkdir(path.join(output, 'images'), { recursive: true })
  await copyFile(path.join(root, 'electron/assets/crafting-data/images/placeholder.svg'), path.join(output, 'images/placeholder.svg'))
  await writeFile(path.join(output, 'dataset.json.next'), `${JSON.stringify(dataset, null, 2)}\n`)
  await rename(path.join(output, 'dataset.json.next'), path.join(output, 'dataset.json'))
  return { bases: bases.length, modifiers: modifiers.length, crafts: crafts.length, sources: sources.length }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  generateInternationalCraftingData({ patch: args[args.indexOf('--patch') + 1], offline: args.includes('--offline'), refresh: args.includes('--live'), onProgress: p => console.log(`${p.completed}/${p.total} ${p.page}`) })
    .then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error); process.exitCode = 1 })
}
