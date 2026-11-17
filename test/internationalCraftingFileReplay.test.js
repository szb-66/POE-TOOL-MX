import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { EventEmitter } from 'node:events'
import vm from 'node:vm'
import { spawnSync } from 'node:child_process'
import { LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import * as matcher from '../electron/modules/item/matcher.js'
import { buildCraftingAffixPayload } from '../electron/modules/item/craftingAffixPayload.js'
import { ItemFootprintRegistry, loadServerFootprintCatalog } from '../electron/modules/items/footprintRegistry.js'
import { mapStatVariants } from './fixtures/internationalMapStatVariants.js'
import { ATLAS_MAP_BANDS } from '../shared/mapItemClasses.js'
import { pythonPath } from './helpers/python.js'
import { FileWatcher } from '../electron/modules/watcher/fileWatcher.js'

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
const bases = JSON.parse(source('test/fixtures/crafting-localization-bases.json'))
function replayHarness(watcher = new EventEmitter()) {
  let revision = 'current-managed', result
  const registry = new ItemFootprintRegistry(loadServerFootprintCatalog({ serverId: 'international' }))
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => [...bases, ...mapStatVariants], revision: () => revision,
    baseNames: () => Object.keys(registry.snapshot().items).map(key => key.split('\u001f')[1]).filter(Boolean) })
  if (!watcher.getFilePaths) watcher.getFilePaths = () => ({ itemInfoResultFile: 'memory-result' })
  const handlers = new Map()
  const watcherSource = source('electron/modules/watcher/fileWatcher.js')
  const attach = vm.runInNewContext(watcherSource.slice(watcherSource.indexOf('export function attachParseRequestId'), watcherSource.indexOf('export class FileWatcher')).replace('export ', '') + '\nattachParseRequestId')
  const context = {
    ...matcher, parseItemInfo, buildCraftingAffixPayload, attachParseRequestId: attach,
    ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    fs: { existsSync: () => false, writeFileSync: (_, content) => { result = JSON.parse(content) } },
    itemFootprintRegistry: registry
  }
  const handlerSource = source('electron/modules/ipc/file.js').replace(/^import .*$/gm, '').replace('export function registerFileHandlers', 'function registerFileHandlers')
  const register = vm.runInNewContext(handlerSource + '\nregisterFileHandlers', context)
  register(watcher, {}, {}, { getOverlayWindow: () => null, getMainWindow: () => null }, null, runtime)
  return {
    getPaths: () => handlers.get('get-file-paths')(),
    read(text, config) { result = undefined; watcher.emit('fileChanged', text, { ...config, localizationRevision: 'current-managed' }, 'replay-request'); return result },
    invalidate() { revision = 'new-managed' }
  }
}

test('真实 FileWatcher 经 IPC 获取路径与解析回写时保留实例，并跟随当前服务器目录', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'file-paths-ipc-'))
  const watcher = new FileWatcher(path.join(root, 'cn'))
  t.after(() => {
    watcher.stopFileWatcher()
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()))
    rmSync(root, { recursive: true, force: true })
  })
  const replay = replayHarness(watcher)
  for (const directory of [path.join(root, 'cn'), path.join(root, 'international')]) {
    watcher.configureDirectory(directory)
    assert.deepEqual(await replay.getPaths(), watcher.getFilePaths())
    const result = replay.read(mapText('Map', 'en', ['Rare Monsters each have 1 additional Modifier']),
      { map: { targetKind: 'atlas', match: {} } })
    assert.ok(result, '解析结果必须成功回写')
    assert.equal(result.error, undefined)
    assert.equal(result.requestId, 'replay-request')
  }
})
const mapText = (name, locale, mods, band = 'Low') => {
  const entry = bases.find(entry => entry.en === name)
  const base = entry[locale] || entry.tw || entry.en
  const header = locale === 'en' ? `Item Class: Maps (${band})\nRarity: Rare\nDoom Domain` : locale === 'cn' ? `物品类别: 异界地图(${band})\n稀有度: 稀有\n灾厄之域` : `物品種類: 異界地圖(${band})\n稀有度: 稀有\n災厄之域`
  const properties = locale === 'en' ? 'Item Tier: 5\nItem Level: 84' : locale === 'cn' ? '物品阶级: 5\n物品等级: 84' : '物品階級: 5\n物品等級: 84'
  return `${header}\n${base}\n--------\n${properties}\n--------\n${mods.map(mod => `{ Prefix Modifier "Fixture" (Tier: 1) }\n${mod}`).join('\n')}`
}

test('真实fileChanged业务回放将Low/Mid/Top/Uber四语地图结果原样交给Python黑名单与统计', () => {
  const replay = replayHarness(), results = []
  const blacklist = ['Rare Monsters each have # additional Modifiers', 'Monsters reflect #% of Physical Damage']
  for (const band of ATLAS_MAP_BANDS) for (const name of ['Map', 'Nightmare Map']) for (const locale of ['en', 'cn', 'tw', 'mixed']) for (const quantity of [1, 2]) {
    const language = locale === 'mixed' ? 'en' : locale
    const mods = (locale === 'en' ? [`Rare Monsters each have ${quantity} additional Modifier${quantity === 1 ? '' : 's'}`, 'Monsters reflect 18% of Physical Damage']
      : locale === 'tw' ? [`每個稀有怪物有 ${quantity} 個額外詞綴`, '怪物反射 18% 物理傷害']
        : [`每个稀有怪物额外具有 ${quantity} 个词缀`, '怪物会反射 18% 物理伤害'])
    const text = mapText(name, language, mods, band)
    const result = replay.read(text, { map: { targetKind: 'atlas', match: { blacklist } } })
    assert.equal(result.error, undefined, JSON.stringify(result))
    assert.equal(result.requestId, 'replay-request')
    assert.equal(result.originalText, text)
    assert.equal(result.displayName, locale === 'en' || locale === 'mixed' ? 'Doom Domain' : locale === 'cn' ? '灾厄之域' : '災厄之域')
    const base = bases.find(entry => entry.en === name)
    assert.equal(result.displayBaseName, language === 'en' ? name : base[language] || base.tw || base.en)
    assert.deepEqual(result.displayExplicitMods, mods)
    assert.equal(result.baseName, name)
    assert.equal(result.category, '异界地图')
    assert.equal(result.footprint.width, 1)
    assert.equal(result.footprint.height, 1)
    assert.equal(result.mapMatch, false)
    assert.equal(result.explicitMods.length, 2)
    assert.equal(result.itemTier, 5)
    results.push(result)
  }
  const template = source('src/assets/scripts/map_rolling_template.py')
  const helpers = template.slice(template.indexOf('def map_term_matches('), template.indexOf('def check_map_requirements('))
  const code = `import json,sys\n${helpers}\nmap_config={'match':{'blacklist':${JSON.stringify(blacklist)},'whitelist':[]}}\nprint(json.dumps([[check_map_mods(item),count_affix_stats(item)] for item in json.load(sys.stdin)]))`
  const python = spawnSync(pythonPath, ['-c', code], { input: JSON.stringify(results), encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', PYTHONDONTWRITEBYTECODE: '1' } })
  assert.equal(python.status, 0, python.stderr)
  for (const [passed, stats] of JSON.parse(python.stdout.trim().split(/\r?\n/).at(-1))) {
    assert.equal(passed, false)
    assert.deepEqual(stats, [Object.fromEntries(blacklist.map(term => [term, 1])), {}])
  }
})

test('魔法地图英文修饰名与汉化名称都保留规范底材，已知占位可用于批量', () => {
  const replay = replayHarness()
  const mod = 'Rare Monsters each have 1 additional Modifier'
  const english = mapText('Map', 'en', [mod]).replace('Rarity: Rare\nDoom Domain\nMap', 'Rarity: Magic\nSavage Map of Congealment')
  const translatedBase = bases.find(entry => entry.en === 'Map').tw
  const traditional = mapText('Map', 'tw', ['每個稀有怪物有 1 個額外詞綴']).replace(`稀有度: 稀有\n災厄之域\n${translatedBase}`, `稀有度: 魔法\n兇猛的${translatedBase}`)
  for (const text of [english, traditional]) {
    const result = replay.read(text, { map: { targetKind: 'atlas', match: {} } })
    assert.equal(result.error, undefined, JSON.stringify(result))
    assert.equal(result.baseName.toLowerCase(), 'map')
    assert.equal(result.footprint.width, 1)
    assert.equal(result.footprint.height, 1)
  }
  const legacy = mapText('Strand Map', 'en', [mod]).replace('Rarity: Rare\nDoom Domain\nStrand Map', 'Rarity: Magic\nSavage Strand Map of Congealment')
  const result = replay.read(legacy, { map: { targetKind: 'atlas', match: {} } })
  assert.equal(result.baseName, 'Strand Map')
  assert.equal(result.footprint, null, '可识别身份不代表已有可靠尺寸，不猜为通用Map')
})

test('真实fileChanged链路对未知词缀及运行中换词库返回错误，不输出可制作结果', () => {
  const replay = replayHarness(), config = { map: { targetKind: 'atlas', match: {} } }
  const text = mapText('Fortress Map', 'tw', ['怪物反射 18% 物理傷害'])
  assert.equal(replay.read(text, config).error, undefined)
  const unknown = replay.read(text.replace('物理傷害', '未知傷害'), config)
  assert.match(unknown.error, /未匹配/)
  assert.equal(unknown.errorCode, 'LOCALIZATION_UNRESOLVED')
  replay.invalidate()
  const result = replay.read(text, config)
  assert.match(result.error, /汉化资源已更改/)
  assert.equal(result.errorCode, 'LOCALIZATION_CHANGED')
  assert.equal(result.mapMatch, undefined)
  assert.equal(result.affixMatch, undefined)
})
