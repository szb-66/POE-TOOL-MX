import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import {
  createCoreCurrencyCrafts,
  finalizePoedbBases,
  groupModifierFamilies,
  mergeModifierGoals,
  parsePoedbBases,
  parsePoedbCrafts,
  parsePoedbCorruptedImplicits,
  parsePoedbEldritchImplicits,
  parsePoedbModifiers
} from '../electron/modules/crafting/poedbParser.js'
import { CRAFTING_SCHEMA_VERSION, normalizeCraftingDataset, stableCraftingId } from '../electron/modules/crafting/model.js'
import { BENCH_META_CRAFTS } from '../electron/modules/crafting/actionProviders.js'
import { createFossilCrafts } from '../electron/modules/crafting/fossilRules.js'
import { FLASK_MODIFIER_PAGES, POEDB_BASE_PAGES, POEDB_MODIFIER_PAGES, SPECIAL_MODIFIER_PROFILES } from '../electron/modules/crafting/poedbSources.js'
import { synchronizeRawSnapshot } from './craftingRawSnapshot.js'
import { CATALYST_DEFINITIONS } from '../electron/modules/crafting/catalystRules.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '..')
const outputRoot = path.join(projectRoot, 'electron', 'assets', 'crafting-data')
const rawSnapshotRoot = path.join(projectRoot, 'electron', 'assets', 'crafting-raw')
const fixtureRoot = path.join(projectRoot, 'test', 'fixtures', 'crafting')
const CURRENT_PATCH = '3.28'
const CURRENT_LEAGUE = 'Mirage'
const VERSION_SOURCES = [
  'https://www.poewiki.net/wiki/Path_of_Exile',
  'https://www.poewiki.net/wiki/Version_history'
]
const execFileAsync = promisify(execFile)
const POWERSHELL_EXE = 'C:\\Program Files\\PowerShell\\7\\pwsh.exe'

async function pathExists(target) {
  try { await access(target); return true } catch { return false }
}

async function fetchTextWithSystemClient(url) {
  const command = '[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false); $OutputEncoding = [Console]::OutputEncoding; $ProgressPreference = "SilentlyContinue"; (Invoke-WebRequest -UseBasicParsing -Uri $env:POEDB_FETCH_URL).Content'
  const { stdout } = await execFileAsync(POWERSHELL_EXE, ['-NoProfile', '-NonInteractive', '-Command', command], {
    encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 60000, windowsHide: true,
    env: { ...process.env, POEDB_FETCH_URL: url }
  })
  return { text: stdout, status: 200 }
}

function assertSnapshotSentinels(loaded, live) {
  if (!loaded.bases.length || !loaded.modifierFamilies.length || !loaded.eldritchImplicitFamilies?.length || !loaded.corruptedImplicitFamilies?.length) throw new Error('解析结果为空，拒绝生成快照')
  for (const base of loaded.bases) {
    if (!base.requirements || !Number.isInteger(base.socketLimit) || !base.qualityType || !Array.isArray(base.baseStats) || !Array.isArray(base.implicitModifiers)) {
      throw new Error(`底材 ${base.name} 缺少 schema v8 装备属性，拒绝生成快照`)
    }
  }
  if (!live) return
  if (loaded.bases.length < 900) throw new Error(`正式底材仅解析到 ${loaded.bases.length} 个，低于 900 哨兵`)
  if (loaded.modifierFamilies.length < 100) throw new Error(`正式词缀家族仅解析到 ${loaded.modifierFamilies.length} 个，低于 100 哨兵`)
  for (const profileId of FLASK_MODIFIER_PAGES.filter((profile) => profile !== 'Hybrid_Flasks')) {
    const families = loaded.modifierFamilies.filter((family) => family.modifierProfileId === profileId)
    if (!families.length || !families.some((family) => ['prefix', 'suffix'].includes(family.affixType))) {
      throw new Error(`正式快照缺少 ${profileId} 药剂普通前后缀哨兵`)
    }
  }
  const ironHat = loaded.bases.find((base) => base.name === '粗铁盔')
  if (!ironHat) throw new Error('正式快照缺少粗铁盔哨兵')
  if (ironHat.requirements.level !== 1 || ironHat.requirements.strength !== 9 || ironHat.requiredLevel !== 1) {
    throw new Error(`粗铁盔需求解析异常：${JSON.stringify(ironHat.requirements)}`)
  }
  if (ironHat.qualityType !== 'armour' || ironHat.socketLimit !== 4 || !ironHat.baseStats.length) {
    throw new Error('粗铁盔缺少护甲基础属性或四孔类型上限')
  }
}

async function fetchText(url) {
  let lastError
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      const result = process.platform === 'win32'
        ? await fetchTextWithSystemClient(url)
        : await (async () => {
            const response = await fetch(url, { headers: { 'user-agent': 'ExileHelper/1.0 personal-data-refresh' }, signal: AbortSignal.timeout(60000) })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            return { text: await response.text(), status: response.status }
          })()
      await new Promise((resolve) => setTimeout(resolve, 1800))
      return result
    } catch (error) {
      lastError = error
      if (attempt < 8) await new Promise((resolve) => setTimeout(resolve, Math.min(30000, attempt * 5000)))
    }
  }
  throw new Error(`${url} 获取失败：${lastError?.message || '网络错误'}`, { cause: lastError })
}

export function createPoedbRawSources() {
  return [
    ...POEDB_BASE_PAGES.map(([page, baseCategory]) => ({
      id: `base:${page}`, page, url: `https://poedb.tw/cn/${page}`, category: 'base', baseCategory
    })),
    ...POEDB_MODIFIER_PAGES.map((page) => ({
      id: `modifier:${page}`, page, url: `https://poedb.tw/cn/${page}`, category: 'modifier', profileId: page
    })),
    { id: 'craft:bench', page: 'Crafting_Bench', url: 'https://poedb.tw/cn/Crafting_Bench', category: 'craft' },
    { id: 'craft:harvest', page: 'Horticrafting', url: 'https://poedb.tw/cn/Horticrafting', category: 'craft' },
    { id: 'implicit:eldritch', page: 'Eldritch_implicit', url: 'https://poedb.tw/cn/Eldritch_implicit', category: 'implicit' },
    { id: 'reference:catalysts', page: 'Catalysts', url: 'https://poedb.tw/cn/Catalysts', category: 'reference' },
    { id: 'implicit:vaal', page: 'Vaal_Orb', url: 'https://poedb.tw/cn/Vaal_Orb', category: 'implicit' }
  ]
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
  return BENCH_META_CRAFTS.map((definition) => ({
    id: `craft:bench:${definition.id}`,
    provider: 'bench', name: definition.name, effectKind: definition.id.replaceAll('-', '_'), itemClasses: [],
    cost: [{ resourceId: 'currency:divine', resourceName: '神圣石', amount: definition.cost }], params: { meta: true }
  }))
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]))
}

async function loadFixtureDataset() {
  const [items, modifiers, bench, harvest, eldritch, vaal] = await Promise.all([
    readFile(path.join(fixtureRoot, 'items.html'), 'utf8'), readFile(path.join(fixtureRoot, 'modifiers.html'), 'utf8'),
    readFile(path.join(fixtureRoot, 'bench.html'), 'utf8'), readFile(path.join(fixtureRoot, 'harvest.html'), 'utf8'),
    readFile(path.join(fixtureRoot, 'eldritch.html'), 'utf8'), readFile(path.join(fixtureRoot, 'vaal.html'), 'utf8')
  ])
  const crafts = [...createCoreCurrencyCrafts(), ...createMetaCrafts(), ...createFossilCrafts(), ...parsePoedbCrafts(bench, { provider: 'bench' }), ...parsePoedbCrafts(harvest, { provider: 'harvest' })]
  return {
    bases: finalizePoedbBases(parsePoedbBases(items, { category: '首饰与珠宝' }), SPECIAL_MODIFIER_PROFILES),
    modifierFamilies: groupModifierFamilies(mergeModifierGoals(parsePoedbModifiers(modifiers, { profileId: 'fixture' }), crafts)),
    crafts,
    eldritchImplicitFamilies: parsePoedbEldritchImplicits(eldritch),
    corruptedImplicitFamilies: parsePoedbCorruptedImplicits(vaal)
  }
}

async function loadSnapshotDataset(rawSnapshot, sources) {
  const sourceById = new Map(sources.map((source) => [source.id, source]))
  const pages = POEDB_BASE_PAGES.map(([page, category]) => {
    const source = sourceById.get(`base:${page}`)
    return { url: source.url, bases: parsePoedbBases(rawSnapshot.texts.get(source.id), { category }) }
  })
  const modifierPages = POEDB_MODIFIER_PAGES.map((page) => {
    const source = sourceById.get(`modifier:${page}`)
    const html = rawSnapshot.texts.get(source.id)
    const modifiers = parsePoedbModifiers(html, { profileId: page })
    if (page === 'Hybrid_Flasks') {
      if (!/复合药剂\s*物品\s*\/\s*\d+/.test(html)) throw new Error('Hybrid_Flasks 页面缺少复合药剂底材哨兵')
    } else if (!modifiers.length) {
      throw new Error(`${page} 词缀解析结果为空`)
    }
    process.stdout.write(`已解析词缀 ${page}\n`)
    return { url: source.url, modifiers }
  })
  const benchHtml = rawSnapshot.texts.get('craft:bench')
  const harvestHtml = rawSnapshot.texts.get('craft:harvest')
  const eldritchHtml = rawSnapshot.texts.get('implicit:eldritch')
  const catalystHtml = rawSnapshot.texts.get('reference:catalysts')
  const vaalHtml = rawSnapshot.texts.get('implicit:vaal')
  const catalystNames = [...CATALYST_DEFINITIONS.map((entry) => entry.name), '污秽催化剂']
  if (!/Catalyst\s*物品\s*\/13/.test(catalystHtml) || catalystNames.some((name) => !catalystHtml.includes(name))) {
    throw new Error('3.28 催化剂来源缺少 13 种中文名称哨兵')
  }
  if (!/瓦尔宝珠\s*已腐化\s*固定\s*\/463/.test(vaalHtml)) throw new Error('3.28 瓦尔宝珠来源缺少 463 条腐化隐式哨兵')
  const crafts = [
      ...createCoreCurrencyCrafts(), ...createMetaCrafts(), ...createFossilCrafts(),
      ...parsePoedbCrafts(benchHtml, { provider: 'bench' }),
      ...parsePoedbCrafts(harvestHtml, { provider: 'harvest' })
    ]
  return {
    bases: finalizePoedbBases(pages.flatMap((page) => page.bases), SPECIAL_MODIFIER_PROFILES),
    modifierFamilies: groupModifierFamilies(mergeModifierGoals(modifierPages.flatMap((page) => page.modifiers), crafts)),
    crafts,
    eldritchImplicitFamilies: parsePoedbEldritchImplicits(eldritchHtml),
    corruptedImplicitFamilies: parsePoedbCorruptedImplicits(vaalHtml),
    sources: sources.map((source) => source.url).concat(['https://poedb.tw/cn/Fossil'])
  }
}

async function cacheImages(bases, preserveExisting, targetRoot) {
  const imageDir = path.join(targetRoot, 'images')
  if (preserveExisting && await pathExists(path.join(outputRoot, 'images'))) await cp(path.join(outputRoot, 'images'), imageDir, { recursive: true })
  await mkdir(imageDir, { recursive: true })
  const placeholderSource = path.join(fixtureRoot, 'placeholder.svg')
  const placeholderTarget = path.join(imageDir, 'placeholder.svg')
  await writeFile(placeholderTarget, await readFile(placeholderSource))
  const images = { placeholder: 'images/placeholder.svg' }
  await mapLimited(bases, 5, async (base) => {
    if (!preserveExisting || !base.imageUrl) {
      base.imageId = 'placeholder'
      return
    }
    const fileName = `${base.imageId.replace(/[^a-zA-Z0-9_-]/g, '_')}.webp`
    if (await pathExists(path.join(imageDir, fileName))) {
      images[base.imageId] = `images/${fileName}`
    } else {
      base.imageId = 'placeholder'
    }
  })
  return images
}

function parseArguments(args) {
  const fixture = args.includes('--fixture')
  const modes = [args.includes('--live'), args.includes('--fetch-missing'), args.includes('--refresh') || args.some((arg) => arg.startsWith('--refresh='))].filter(Boolean)
  if (!fixture && modes.length > 1) throw new Error('--live、--fetch-missing 与 --refresh 只能选择一个')
  const patchIndex = args.indexOf('--patch')
  const patch = patchIndex >= 0 ? args[patchIndex + 1] : CURRENT_PATCH
  if (!patch) throw new Error('--patch 后必须提供版本号')
  const refresh = []
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--refresh') {
      if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error('--refresh 后必须提供来源 ID、页面名或 URL')
      refresh.push(args[index + 1])
    } else if (args[index].startsWith('--refresh=')) {
      refresh.push(args[index].slice('--refresh='.length))
    }
  }
  return {
    fixture,
    patch,
    refresh,
    mode: args.includes('--live') ? 'full' : args.includes('--fetch-missing') ? 'missing' : refresh.length ? 'refresh' : 'offline'
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  const sources = createPoedbRawSources()
  const rawSnapshot = options.fixture ? null : await synchronizeRawSnapshot({
    root: rawSnapshotRoot,
    patch: options.patch,
    sources,
    mode: options.mode,
    refresh: options.refresh,
    fetcher: fetchText,
    onFetch: (source) => process.stdout.write(`正在抓取原始来源 ${source.id}\n`)
  })
  const loaded = options.fixture ? await loadFixtureDataset() : await loadSnapshotDataset(rawSnapshot, sources)
  process.stdout.write(`生成前校验：${loaded.bases.length} 底材 / ${loaded.modifierFamilies.length} 词缀家族 / ${loaded.eldritchImplicitFamilies?.length ?? 0} 古灵家族 / ${loaded.corruptedImplicitFamilies?.length ?? 0} 腐化隐式家族\n`)
  assertSnapshotSentinels(loaded, !options.fixture)
  const stagingRoot = path.join(path.dirname(outputRoot), `.crafting-data-staging-${process.pid}`)
  const backupRoot = path.join(path.dirname(outputRoot), `.crafting-data-backup-${process.pid}`)
  await rm(stagingRoot, { recursive: true, force: true })
  await mkdir(stagingRoot, { recursive: true })
  const images = await cacheImages(loaded.bases, !options.fixture, stagingRoot)
  loaded.bases.forEach((base) => delete base.imageUrl)
  const sourceUrls = [...new Set([...(loaded.sources ?? [
    'https://poedb.tw/cn/Items', 'https://poedb.tw/cn/Modifiers',
    'https://poedb.tw/cn/Crafting_Bench', 'https://poedb.tw/cn/Horticrafting', 'https://poedb.tw/cn/Fossil', 'https://poedb.tw/cn/Eldritch_implicit'
  ]), ...VERSION_SOURCES])]
  const generatedAt = options.fixture
    ? new Date().toISOString()
    : rawSnapshot.manifest.sources.reduce((latest, source) => source.fetchedAt > latest ? source.fetchedAt : latest, '')
  const dataset = {
    manifest: {
      schemaVersion: CRAFTING_SCHEMA_VERSION, game: 'poe1', locale: 'zh-CN', league: options.fixture ? 'Fixture' : CURRENT_LEAGUE,
      patch: options.fixture ? 'test' : options.patch, generatedAt, checksum: '',
      sources: sourceUrls.map((url) => ({ id: stableCraftingId('source', url), url }))
    },
    bases: loaded.bases,
    modifierFamilies: loaded.modifierFamilies,
    eldritchImplicitFamilies: loaded.eldritchImplicitFamilies,
    corruptedImplicitFamilies: loaded.corruptedImplicitFamilies,
    crafts: [...new Map(loaded.crafts.map((entry) => [entry.id, entry])).values()],
    images
  }
  const canonicalDataset = canonicalize(dataset)
  canonicalDataset.manifest.checksum = createHash('sha256').update(JSON.stringify(canonicalDataset)).digest('hex')
  normalizeCraftingDataset(canonicalDataset)
  await writeFile(path.join(stagingRoot, 'dataset.json'), `${JSON.stringify(canonicalDataset, null, 2)}\n`)
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
  process.stdout.write(`已生成 ${dataset.bases.length} 个底材、${dataset.modifierFamilies.length} 个词缀项、${dataset.eldritchImplicitFamilies.length} 个古灵隐式家族、${dataset.corruptedImplicitFamilies.length} 个腐化隐式家族、${dataset.crafts.length} 个工艺。\n`)
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) main().catch(async (error) => {
  const stagingRoot = path.join(path.dirname(outputRoot), `.crafting-data-staging-${process.pid}`)
  const backupRoot = path.join(path.dirname(outputRoot), `.crafting-data-backup-${process.pid}`)
  await rm(stagingRoot, { recursive: true, force: true }).catch(() => {})
  await cp(backupRoot, outputRoot, { recursive: true }).catch(() => {})
  process.stderr.write(`${error.stack || error.message}\n`)
  process.exitCode = 1
})
