import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFile as _m0_readFile } from 'node:fs/promises'
import { applyInternationalPseudoRules as _m0_applyInternationalPseudoRules, loadInternationalTradeCatalog as _m0_loadInternationalTradeCatalog, loadTradeCatalog as _m0_loadTradeCatalog, validateTradeCatalog as _m0_validateTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { buildOfficialTradeQuery as _m0_buildOfficialTradeQuery } from '../electron/modules/priceCheck/query.js'
import { PriceCheckService as _m0_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFileSync as _m1_readFileSync } from 'node:fs'
import { fileURLToPath as _m1_fileURLToPath } from 'node:url'
import { PriceCheckService as _m1_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { loadInternationalTradeCatalog as _m1_loadInternationalTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { LocalizationRuntime as _m1_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { runPython as _m1_runPython } from './helpers/python.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { readFile as _m2_readFile } from 'node:fs/promises'
import { parseItemInfo as _m2_parseItemInfo } from '../electron/modules/item/parser.js'
import { buildOfficialTradeQuery as _m2_buildOfficialTradeQuery, createPriceCheckModel as _m2_createPriceCheckModel, sanitizePriceCheckModel as _m2_sanitizePriceCheckModel } from '../electron/modules/priceCheck/query.js'
import { resolveSpecialItemIdentity as _m2_resolveSpecialItemIdentity } from '../electron/modules/priceCheck/specialItems.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { createServer as _m3_createServer } from 'vite'
import { createPinia as _m3_createPinia, setActivePinia as _m3_setActivePinia } from 'pinia'
import { serverContext as _m3_serverContext } from '../shared/serverMode.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { readFileSync as _m4_readFileSync } from 'node:fs'
import { createServer as _m4_createServer } from 'vite'
import _m4_vue from '@vitejs/plugin-vue'
import { fileURLToPath as _m4_fileURLToPath } from 'node:url'
import { createSSRApp as _m4_createSSRApp, h as _m4_h } from 'vue'
import { createPinia as _m4_createPinia } from 'pinia'
import { renderToString as _m4_renderToString } from '@vue/server-renderer'
import { PriceCheckService as _m4_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { readFile as _m5_readFile } from 'node:fs/promises'
import { PriceCheckService as _m5_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { buildOfficialTradeQuery as _m5_buildOfficialTradeQuery } from '../electron/modules/priceCheck/query.js'
import { createLocalizationTextResolver as _m5_createLocalizationTextResolver } from '../electron/modules/localization/text.js'
import { parseItemInfo as _m5_parseItemInfo } from '../electron/modules/item/parser.js'
import { minionSpeedSupport as _m5_minionSpeedSupport } from './fixtures/priceCheckSupportGem.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { createServer as _m6_createServer } from 'vite'
import { createPinia as _m6_createPinia, setActivePinia as _m6_setActivePinia } from 'pinia'

// === Merged from internationalPseudoRules.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFile = _m0_readFile
  const applyInternationalPseudoRules = _m0_applyInternationalPseudoRules
  const loadInternationalTradeCatalog = _m0_loadInternationalTradeCatalog
  const loadTradeCatalog = _m0_loadTradeCatalog
  const validateTradeCatalog = _m0_validateTradeCatalog
  const buildOfficialTradeQuery = _m0_buildOfficialTradeQuery
  const PriceCheckService = _m0_PriceCheckService
const cjk = /[\u3400-\u9fff]/u
const englishItem = `Item Class: Gloves
Rarity: Rare
Doom Warmth
Arcanist Gloves
--------
Energy Shield: 45
--------
Requirements:
Level: 60
Int: 95
--------
Sockets: B-B-B-B
--------
Item Level: 75
--------
{ Prefix Modifier "Athlete's" (Tier: 1) — Life }
+120(115-129) to maximum Life
{ Master Crafted Prefix Modifier "Upgraded" — Damage, Minion }
Minions deal 13(10-20)% increased Damage
{ Suffix Modifier "Scholar's" (Tier: 3) — Attribute }
+38(38-42) to Intelligence
{ Suffix Modifier "Ryslatha's" (Tier: 2) — Life }
Regenerate 51.4(48.1-64) Life per second
{ Suffix Modifier "Tempest's" (Tier: 4) — Elemental, Lightning, Resistance }
+33(30-35)% to Lightning Resistance`

test('国际服目录加载后补齐综合规则与英文引用', async () => {
  const { catalog: baseCatalog } = await loadTradeCatalog()
  const { catalog } = await loadInternationalTradeCatalog({
    baseCatalog,
    bundledFile: new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url),
    now: Date.parse('2026-11-23T00:00:00Z')
  })

  assert.equal(catalog.pseudoRules.length, 35)
  assert.equal(catalog.pseudoRuleVersion, 'awakened-poe-trade-3.29.102')
  const life = catalog.stats.find(entry => entry.ids?.pseudo === 'pseudo.pseudo_total_life')
  assert.ok(life.refs.includes('+# total maximum Life'))
  assert.ok(catalog.stats.some(entry => entry.ids?.explicit === 'explicit.stat_3299347043' && entry.refs.includes('+# to maximum Life')))
  for (const entry of catalog.stats) {
    for (const ref of entry.refs || []) assert.equal(cjk.test(ref), false, `${entry.key} 的 ref 混入了中文：${ref}`)
  }
})

test('国际服查价重新生成综合数值并写入官方查询', async () => {
  const { catalog: baseCatalog } = await loadTradeCatalog()
  const { catalog } = await loadInternationalTradeCatalog({
    baseCatalog,
    bundledFile: new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url),
    now: Date.parse('2026-11-23T00:00:00Z')
  })
  const service = new PriceCheckService({
    catalog,
    manualInputOnly: true,
    auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer() {} },
    client: {
      server: { id: 'international', label: '国际服' },
      clearCache() {},
      search: async () => ({ id: 'fixture', total: 0, result: [] }),
      fetch: async () => ({ result: [] })
    },
    localizationProvider: () => []
  })

  const model = service.parse(englishItem, { initialSelection: 'auto' })
  const pseudo = new Map(model.stats.filter(stat => stat.type === 'pseudo').map(stat => [stat.id, stat]))
  assert.equal(pseudo.get('pseudo.pseudo_total_life').values[0], 120)
  assert.equal(pseudo.get('pseudo.pseudo_total_life').enabled, true)
  assert.equal(pseudo.get('pseudo.pseudo_total_elemental_resistance').values[0], 33)
  assert.equal(pseudo.get('pseudo.pseudo_total_elemental_resistance').enabled, false)
  assert.equal(pseudo.get('pseudo.pseudo_total_intelligence').values[0], 38)
  assert.equal(pseudo.get('pseudo.pseudo_total_life_regen').values[0], 51.4)

  const initialIds = buildOfficialTradeQuery(model).query.stats.flatMap(group => group.filters.map(filter => filter.id))
  assert.ok(initialIds.includes('pseudo.pseudo_total_life'))
  assert.equal(initialIds.includes('pseudo.pseudo_total_elemental_resistance'), false)

  pseudo.get('pseudo.pseudo_total_elemental_resistance').enabled = true
  const body = buildOfficialTradeQuery(model)
  const ids = body.query.stats.flatMap(group => group.filters.map(filter => filter.id))
  assert.ok(ids.includes('pseudo.pseudo_total_life'))
  assert.ok(ids.includes('pseudo.pseudo_total_elemental_resistance'))
  assert.equal(model.stats.find(stat => stat.id === 'explicit.stat_3299347043').enabled, false)
})

test('缺少综合元数据的旧国际服快照也能补齐且保持目录可校验', async () => {
  const { catalog: baseCatalog } = await loadTradeCatalog()
  const raw = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
  raw.pseudoRules = []
  for (const entry of raw.stats) delete entry.refs
  const catalog = applyInternationalPseudoRules(raw, baseCatalog)
  assert.equal(catalog.pseudoRules.length, 35)
  assert.doesNotThrow(() => validateTradeCatalog(catalog))
  const life = catalog.stats.find(entry => entry.ids?.pseudo === 'pseudo.pseudo_total_life')
  assert.ok(life.refs.includes('+# total maximum Life'))
})
})()

// === Merged from internationalVisceraPriceCheck.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFileSync = _m1_readFileSync
  const fileURLToPath = _m1_fileURLToPath
  const PriceCheckService = _m1_PriceCheckService
  const loadInternationalTradeCatalog = _m1_loadInternationalTradeCatalog
  const LocalizationRuntime = _m1_LocalizationRuntime
  const runPython = _m1_runPython
const { aliasEntries, itemEntries, statEntries } = JSON.parse(readFileSync(new URL('./fixtures/internationalVisceraPriceCheck.json', import.meta.url)))
const gradeEntries = JSON.parse(readFileSync(new URL('./fixtures/internationalVisceraGradeEntries.json', import.meta.url)))
const catalog = { locale: 'en', items: itemEntries, stats: statEntries }

const reportedItem = `物品类别: 内脏
恐喙鸟头颅
--------
头部
--------
物品等级: 83
--------
{ 基底属性 }
混沌伤害提高 20(20-30)%
--------
将此物带到城镇或藏身处的柳条人处进行附着。`

const englishItem = `Item Class: Viscera
Severed Rhoa Head
--------
Head
--------
Item Level: 83
--------
{ Implicit Modifier }
20(20-30)% increased Chaos Damage
--------
Take this to the Wickerman in a town or hideout to attach it.`

const traditionalItem = `物品種類: 臟器
恐喙鳥之首
--------
頭
--------
物品等級: 83
--------
{ 固定詞綴 }
增加 20(20-30)% 混沌傷害
--------
將此物帶給城鎮或藏身處中的柳條人以將其附上。`

function fixture(currentCatalog = catalog, entries = aliasEntries) {
  const searches = []
  const service = new PriceCheckService({
    catalog: currentCatalog,
    localizationProvider: () => entries,
    manualInputOnly: true,
    auth: { getStatus: () => ({ authenticated: true }) },
    client: { server: { id: 'international' }, clearCache() {},
      async search(league, query) {
        searches.push(query)
        return { id: 'viscera-fixture', total: 0, result: [] }
      }
    }
  })
  return { service, searches }
}

test('简繁英内脏按实际底材和唯一基底词缀查价，保留物品等级且无需稀有度', async () => {
  const queries = []
  for (const [text, entries] of [[reportedItem, aliasEntries], [traditionalItem, aliasEntries], [englishItem, []]]) {
    const { service, searches } = fixture(catalog, entries)
    const { model } = await service.check({ text, league: 'Covens' })
    assert.equal(model.identity.type, 'Severed Rhoa Head')
    assert.equal(model.identity.category, 'viscera')
    assert.equal(model.item.rarity, '')
    assert.equal(model.item.itemLevel, 83)
    assert.deepEqual(model.unknownStats, [])
    assert.deepEqual(model.stats.map(stat => [stat.id, stat.values]), [['implicit.stat_736967255', [20]]])
    assert.equal(model.stats[0].displayText, text.split('\n').at(-3))
    assert.equal(searches[0].query.type, 'Severed Rhoa Head')
    assert.equal(searches[0].query.filters.type_filters.filters.category.option, 'viscera')
    assert.equal(searches[0].query.filters.type_filters.filters.rarity, undefined)
    assert.equal(searches[0].query.stats[0].filters[0].value.min, 20)
    await service.rerun({ model })
    assert.deepEqual(searches[1], searches[0])
    await service.rerun({ model: { ...model, identity: { ...model.identity, nameEnabled: false } } })
    assert.equal(searches[2].query.type, undefined)
    assert.equal(searches[2].query.filters.type_filters.filters.category.option, 'viscera')
    queries.push(searches[0])
  }
  assert.deepEqual(queries, [queries[0], queries[0], queries[0]])
})

test('内脏部位只在内脏属性段使用，未知底材或未知效果不会提交不完整查询', async () => {
  const { service, searches } = fixture()
  const lowerLimb = reportedItem.replace('恐喙鸟头颅', '猿猴之足').replace('头部', '下肢')
  assert.equal(service.parse(lowerLimb).identity.type, 'Primate Foot')
  await assert.rejects(service.check({ text: reportedItem.replace('混沌伤害提高 20(20-30)%', '无法验证的物品效果'), league: 'Covens' }),
    { code: 'LOCALIZATION_UNRESOLVED' })
  await assert.rejects(service.check({ text: englishItem.replace('Severed Rhoa Head', 'Unknown Head'), league: 'Covens' }),
    /官方交易目录/)
  await assert.rejects(service.check({ text: englishItem.replace('20(20-30)% increased Chaos Damage', 'Head').replace('Item Level: 83\n--------\n', ''), league: 'Covens' }),
    { code: 'LOCALIZATION_STATS_UNRESOLVED' })
  await assert.rejects(service.check({ text: englishItem.replace('increased Chaos Damage', 'increased Imaginary Damage'), league: 'Covens' }),
    { code: 'LOCALIZATION_STATS_UNRESOLVED' })
  await assert.rejects(service.check({ text: reportedItem.replace('物品类别: 内脏', '物品类别: 戒指\n稀 有 度: 普通'), league: 'Covens' }),
    { code: 'LOCALIZATION_AMBIGUOUS' })
  assert.deepEqual(searches, [])
})

test('内脏部位签名无效时保留无法识别错误', async () => {
  const entries = aliasEntries.map(entry => entry.id === 'VisceraItemHead' ? { ...entry, sourceHash: '' } : entry)
  const { service, searches } = fixture(catalog, entries)
  await assert.rejects(service.check({ text: reportedItem, league: 'Covens' }), { code: 'LOCALIZATION_UNRESOLVED' })
  assert.deepEqual(searches, [])
})

test('未缓存实时目录时仍能用内置国际服目录查询内脏', async () => {
  const { catalog: bundled, status } = await loadInternationalTradeCatalog({ baseCatalog: catalog })
  assert.equal(status.provider, 'bundled')
  const { service, searches } = fixture(bundled)
  const { model } = await service.check({ text: reportedItem, league: 'Covens' })
  assert.equal(model.identity.type, 'Severed Rhoa Head')
  assert.deepEqual(model.unknownStats, [])
  assert.equal(searches[0].query.stats[0].filters[0].id, 'implicit.stat_736967255')
})

test('背包正常入库支持简繁英内脏，无稀有度时仍保留原文和底材黑名单', () => {
  const runtime = new LocalizationRuntime({ serverId: 'international', revision: () => 'viscera', entries: () => [...aliasEntries, ...gradeEntries] })
  const script = fileURLToPath(new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url))
  const inputs = [
    { text: reportedItem },
    { text: traditionalItem.replaceAll('--------', '-------') },
    { text: englishItem, international: false },
    { text: englishItem.replace('Severed Rhoa Head', 'Infested Torso').replace('\nHead\n', '\nTorso\n') },
    { text: englishItem.replace('Severed Rhoa Head', 'Bloodied Arm').replace('\nHead\n', '\nUpper Limb\n') },
    { text: reportedItem.replace('恐喙鸟头颅', '猿猴之足').replace('\n头部\n', '\n下肢\n') },
    { text: reportedItem.replace('恐喙鸟头颅', '高级 恐喙鸟头颅') },
    { text: traditionalItem.replace('恐喙鳥之首', '低階 恐喙鳥之首') },
    { text: reportedItem, rule: { field: 'baseName', keyword: '恐喙鸟头颅', matchMode: 'exact' } },
    { text: englishItem.replace('Severed Rhoa Head', 'Greater Severed Rhoa Head'), rule: { field: 'baseName', keyword: 'Severed Rhoa Head', matchMode: 'exact' } },
    { text: reportedItem.replace('内脏', '头部') },
    { text: reportedItem.replace('\n头部\n', '\n未知部位\n') },
    { text: reportedItem.replace('恐喙鸟头颅', '未知等级 恐喙鸟头颅') }
  ]
  const data = JSON.stringify({ inputs, snapshot: runtime.snapshot() })
  const result = runPython(`
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(script)})
bag = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bag)
bag.is_game_foreground = lambda: True
bag.time.sleep = lambda _: None
class Controller:
    def __init__(self, config): self.copied = False
    def move(self, x, y): return True
    def copy_item_text(self):
        if self.copied: return "empty", ""
        self.copied = True
        return "copied", case["text"]
    def ctrl_click(self): return True
    def release_all(self): pass
bag.InputController = Controller
data = json.loads(${JSON.stringify(data)})
results = []
for case in data["inputs"]:
    events = {}
    bag.emit = lambda name, **payload: events.update({name: payload})
    bag.run_stash({
        "localizationSnapshot": data["snapshot"] if case.get("international", True) else {},
        "blacklist": [case["rule"]] if "rule" in case else [],
        "force_unique_stash": True
    })
    item = events.get("stash-item-transferred", {}).get("item", {})
    stats = events["stash-completed"]
    results.append([item.get("name"), item.get("baseName"), item.get("itemLevel"),
                    stats["stashedSlots"], stats["blacklistedSlots"], stats["unreadableSlots"]])
print(json.dumps(results))
`)
  assert.deepEqual(result, [
    ...['Severed Rhoa Head', 'Severed Rhoa Head', 'Severed Rhoa Head', 'Infested Torso', 'Bloodied Arm', 'Primate Foot']
      .map(name => [name, name, 83, 1, 0, 0]),
    ['Greater Severed Rhoa Head', 'Severed Rhoa Head', 83, 1, 0, 0],
    ['Lesser Severed Rhoa Head', 'Severed Rhoa Head', 83, 1, 0, 0],
    [null, null, null, 0, 1, 0], [null, null, null, 0, 1, 0],
    [null, null, null, 0, 0, 1], [null, null, null, 0, 0, 1], [null, null, null, 0, 0, 1]
  ])
})
})()

// === Merged from priceCheckCatalogCoverage.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const readFile = _m2_readFile
  const parseItemInfo = _m2_parseItemInfo
  const buildOfficialTradeQuery = _m2_buildOfficialTradeQuery
  const createPriceCheckModel = _m2_createPriceCheckModel
  const sanitizePriceCheckModel = _m2_sanitizePriceCheckModel
  const resolveSpecialItemIdentity = _m2_resolveSpecialItemIdentity
const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
const variants = catalog.items.filter(({ discriminator }) =>
  ['alt_x', 'alt_y', 'alt_z', 'blighted', 'uberblighted', 'scrying_orb'].includes(discriminator))
const variantCategory = { gem: '技能宝石', map: '地图', currency: '通货' }

test('国际目录所有宝石、菌潮和窥视宝珠显示名均保留真实类型与判别符', () => {
  for (const entry of variants) {
    const category = variantCategory[entry.category]
    const rarity = entry.category === 'gem' ? '宝石' : entry.category === 'currency' ? '通货' : '普通'
    const copied = `物品类别: ${category}\n稀 有 度: ${rarity}\n${entry.text}\n--------`
    const parsed = parseItemInfo(copied)
    const model = createPriceCheckModel(parsed, catalog)
    const expected = { discriminator: entry.discriminator, option: entry.baseType }
    assert.deepEqual(buildOfficialTradeQuery(model).query.type, expected, entry.text)
    const trusted = sanitizePriceCheckModel(structuredClone(model), catalog, model.facts, category, model)
    assert.deepEqual(buildOfficialTradeQuery(trusted).query.type, expected, `${entry.text}: trusted recheck`)
    const submitted = sanitizePriceCheckModel(structuredClone(model), catalog)
    assert.deepEqual(buildOfficialTradeQuery(submitted).query.type, expected, `${entry.text}: catalog-validated recheck`)
    assert.equal(model.identity.displayName, entry.text)
  }
  assert.equal(variants.length, 678, '目录变更后重新审计完整变体清单')
})

test('特殊身份仅接受相同类别的完整显示名，普通版本与历史版本不被猜测为变体', () => {
  const altered = variants.find(({ discriminator }) => discriminator === 'alt_x')
  assert.equal(resolveSpecialItemIdentity({ category: '通货', name: altered.text }, catalog), null)
  assert.equal(resolveSpecialItemIdentity({ category: '技能宝石', name: altered.baseType }, catalog), null)
  assert.throws(() => resolveSpecialItemIdentity({ category: '技能宝石', name: altered.baseType, gemVariant: true }, catalog), /特殊物品/)
  const ambiguous = { items: [altered, { ...altered, baseType: 'Different Query Type' }] }
  assert.throws(() => resolveSpecialItemIdentity({ category: '技能宝石', name: altered.text }, ambiguous), /无法唯一识别/)
  const duplicate = { items: [altered, { ...altered }] }
  assert.equal(resolveSpecialItemIdentity({ category: '技能宝石', name: altered.text }, duplicate).type, altered.baseType)
  for (const entry of catalog.items.filter(({ discriminator }) => discriminator === 'legacy')) {
    assert.equal(resolveSpecialItemIdentity({ category: '饰品', name: entry.name, baseName: entry.baseType }, catalog), null, entry.text)
  }
})

test('地图区域元数据可恢复中英文菌潮身份，并拒绝未知区域和错类目录项', () => {
  for (const discriminator of ['blighted', 'uberblighted']) {
    const entry = variants.find((candidate) => candidate.discriminator === discriminator)
    const areaName = entry.text.match(/\((.+)\)$/)[1]
    assert.equal(resolveSpecialItemIdentity({ category: '地图', name: 'Map', blightType: discriminator, areaName }, catalog).type, entry.baseType)
    assert.throws(() => resolveSpecialItemIdentity({ category: '地图', name: 'Map', blightType: discriminator, areaName: 'Unknown Region' }, catalog), /特殊物品/)
    assert.throws(() => resolveSpecialItemIdentity({ category: '地图', name: entry.text, blightType: discriminator }, {
      items: [{ ...entry, category: 'currency' }]
    }), /特殊物品/)
  }
})

test('国际目录全部可信身份序列化保留精确名称、类型及受支持判别符，历史版单独标记限制', () => {
  // This is a wire-format audit, not evidence that every game clipboard format
  // has been observed. Legacy versions share copyable names with current items.
  let exact = 0
  let legacy = 0
  for (const entry of catalog.items) {
    const model = {
      item: { category: '', rarity: entry.unique ? '传奇' : '普通' },
      identity: { name: entry.unique ? entry.name : '', type: entry.baseType, discriminator: entry.discriminator },
      properties: [], stats: []
    }
    const query = buildOfficialTradeQuery(model).query
    if (entry.discriminator === 'legacy') {
      assert.equal(query.type, entry.baseType, entry.text)
      assert.equal(query.name, entry.name, entry.text)
      legacy++
      continue
    }
    const expected = (value) => entry.discriminator ? { discriminator: entry.discriminator, option: value } : value
    assert.deepEqual(query.type, expected(entry.baseType), entry.text || entry.key)
    assert.deepEqual(query.name, entry.unique ? expected(entry.name) : undefined, entry.text || entry.key)
    exact++
  }
  assert.equal(exact, 6157, '目录变更后重新审计可精确序列化身份')
  assert.equal(legacy, 85, '历史版本需要额外身份信息，不能用同名剪贴板自动判定')
  assert.equal(exact + legacy, 6242)
})
})()

// === Merged from priceCheckConfiguration.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const createServer = _m3_createServer
  const createPinia = _m3_createPinia
  const setActivePinia = _m3_setActivePinia
  const serverContext = _m3_serverContext
test('查价启用与捕获的配置引导使用当前服务器账号和赛季', async (t) => {
  const previousStorage = globalThis.localStorage
  const storage = new Map()
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
  }
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  t.after(async () => { await server.close(); globalThis.localStorage = previousStorage })
  const { currentServer } = await server.ssrLoadModule('/src/utils/serverContext.js')
  const { usePriceCheckStore } = await server.ssrLoadModule('/src/stores/priceCheck.js')
  const { usePoeAccountStore } = await server.ssrLoadModule('/src/stores/poeAccount.js')
  const { useFeatureModulesStore } = await server.ssrLoadModule('/src/stores/featureModules.js')
  const { useConfigurationGuideStore } = await server.ssrLoadModule('/src/domains/configurationGuide/configurationGuideStore.js')
  const { configurationIssueFromFailure } = await server.ssrLoadModule('/src/domains/configurationGuide/configurationFailures.js')

  for (const id of ['international', 'cn']) {
    Object.assign(currentServer, serverContext(id))
    storage.clear()
    setActivePinia(createPinia())
    useFeatureModulesStore().enable('price-check')
    const priceCheck = usePriceCheckStore()
    const account = usePoeAccountStore()
    const guide = useConfigurationGuideStore()
    const label = currentServer.label

    for (const [failureCode, title] of [['SESSION_EXPIRED', `${label}账号`], ['LEAGUE_INVALID', `${label}赛季`]]) {
      const issue = configurationIssueFromFailure({ moduleId: 'price-check', actionId: 'capture', failureCode })
      assert.equal(issue.title, title)
      assert.equal(issue.message, `请重新配置${title}后手动重试`)
    }

    const result = await priceCheck.setEnabled(true)
    assert.equal(result.configurationRequired, true)
    assert.equal(priceCheck.settings.enabled, false)
    assert.deepEqual(guide.issues.map(issue => [issue.title, issue.message]), [
      [`${label}账号`, `请先完成${label}账号登录`],
      [`${label}赛季`, `请选择${label}赛季`]
    ])
    assert.deepEqual(guide.issues.map(issue => issue.editorId), ['account.poe-cn', 'account.league'])
    account.status = { authenticated: true, accountName: 'test-account' }
    guide.refresh()
    assert.deepEqual(guide.issues.map(issue => issue.title), [`${label}赛季`])
    account.settings.league = 'test-league'
    guide.refresh()
    assert.equal(guide.remainingCount, 0)
    guide.clear()

    priceCheck.settings.enabled = true
    account.settings.league = ''
    await priceCheck.checkHoveredItem()
    assert.equal(guide.request.actionId, 'capture')
    assert.deepEqual(guide.issues.map(issue => issue.title), [`${label}赛季`])
    guide.clear()
  }
})
})()

// === Merged from priceCheckGameTextIntegration.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const readFileSync = _m4_readFileSync
  const createServer = _m4_createServer
  const vue = _m4_vue
  const fileURLToPath = _m4_fileURLToPath
  const createSSRApp = _m4_createSSRApp
  const h = _m4_h
  const createPinia = _m4_createPinia
  const renderToString = _m4_renderToString
  const PriceCheckService = _m4_PriceCheckService
const catalog = JSON.parse(readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)))
const entries = JSON.parse(readFileSync(new URL('./fixtures/price-check-game-text-entries.json', import.meta.url)))
const itemText = (language) => ({
  cn: '物品类别: 头部\n稀有度: 传奇\n节庆之面\n--------\n闪避值: 80\n能量护盾: 18\n--------\n物品等级: 84\n--------\n未鉴定',
  tw: '物品種類: 頭部\n稀有度: 傳奇\n節慶之面\n--------\n閃避值: 80\n能量護盾: 18\n--------\n物品等級: 84\n--------\n未鑑定',
  en: 'Item Class: Helmets\nRarity: Unique\nFestival Mask\n--------\nEvasion Rating: 80\nEnergy Shield: 18\n--------\nItem Level: 84\n--------\nUnidentified'
})[language]

function fixture() {
  const searches = []
  const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) },
    client: { server: { id: 'international', label: '国际服' }, clearCache() {},
      search: async (league, query) => { searches.push(query); return { id: 'fixture', total: 0, result: [] } },
      fetch: async () => ({ result: [] }) },
    catalog, manualInputOnly: true, localizationProvider: () => entries })
  return { service, searches }
}

test('简繁英文未鉴定传奇的实际浮层显示随原文变化，官方身份与候选选择保持英文', async t => {
  const vite = await createServer({ configFile: false, plugins: [vue()],
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  t.after(() => vite.close())
  const { default: Overlay } = await vite.ssrLoadModule('/src/domains/priceCheck/PriceCheckOverlayView.vue')
  for (const language of ['cn', 'tw', 'en']) {
    const { service, searches } = fixture()
    const first = await service.check({ league: 'Covens', text: itemText(language) })
    assert.equal(first.model.presentation.language, language)
    assert.equal(first.model.identityResolution.required, true)
    const app = createSSRApp(Overlay, {
      previewMode: true, previewState: { ...first, status: 'identity-required' }
    }).use(createPinia())
    for (const name of ['el-icon', 'el-select', 'el-option', 'el-input-number']) {
      app.component(name, { render() { return h('div', this.$slots.default?.()) } })
    }
    const html = await renderToString(app)
    const names = language === 'cn' ? ['节庆之面', '共鸣之面', '共鸣之面【仿品】', '能量护盾']
      : language === 'tw' ? ['節慶之面', '共鳴之面', '贗品．共鳴之面', '能量護盾']
        : ['Festival Mask', 'Leer Cast', 'Replica Leer Cast', 'Energy Shield', 'Helmets', 'Unique']
    for (const name of names) assert.ok(html.includes(name), `${language} missing ${name}`)
    if (language !== 'en') assert.doesNotMatch(html, /(?:>|alt=")\s*(?:Festival Mask|Replica Leer Cast|Leer Cast)\s*(?:<|")/)
    const candidate = first.model.identityResolution.candidates.find(c => c.name === 'Replica Leer Cast')
    const selected = await service.resolveIdentity(candidate.key)
    assert.equal(selected.model.identity.name, 'Replica Leer Cast')
    assert.equal(selected.model.presentation.texts['Replica Leer Cast'], names[2])
    const retry = await service.rerun({ model: selected.model })
    assert.equal(retry.model.presentation.language, language)
    assert.equal(retry.model.presentation.texts['Replica Leer Cast'], names[2])
    assert.equal(searches[0].query.name, 'Replica Leer Cast')
    assert.equal(searches[0].query.type, 'Festival Mask')
  }
})
})()

// === Merged from priceCheckGems.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const readFile = _m5_readFile
  const PriceCheckService = _m5_PriceCheckService
  const buildOfficialTradeQuery = _m5_buildOfficialTradeQuery
  const createLocalizationTextResolver = _m5_createLocalizationTextResolver
  const parseItemInfo = _m5_parseItemInfo
  const minionSpeedSupport = _m5_minionSpeedSupport
const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
const { entries } = JSON.parse(await readFile(new URL('./fixtures/price-check-gem-entries.json', import.meta.url), 'utf8'))
const gems = catalog.items.filter(({ category }) => category === 'gem')
const visible = (value) => value.replace(/\[([^\]|]+)\|([^\]]*)\]/g, '$2').replace(/\[([^\]]+)\]/g, '$1').replace(/<[^<>]+>\{([^{}]*)\}/g, '$1')

function localizedName(name, language) {
  if (language === 'en') return name
  const combo = name.match(/^(Vaal .+) \((.+)\)$/)
  if (combo) return `${localizedName(combo[1], language)} (${localizedName(combo[2], language)})`
  const rows = entries.filter((entry) => visible(entry.en) === name && entry[language])
  const preferred = rows.find(({ table }) => table === 'baseitemtypes') || rows.find(({ table }) => table === 'gemeffects') || rows[0]
  assert.ok(preferred, `${language}: signed game name missing for ${name}`)
  return visible(preferred[language])
}

function fixture() {
  const searches = []
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true }) },
    client: { server: { id: 'international' }, clearCache() {},
      search: async (league, query) => { searches.push(query); return { id: 'gem-fixture', total: 0, result: [] } },
      fetch: async () => ({ result: [] }) },
    catalog, manualInputOnly: true, localizationProvider: () => entries
  })
  return { service, searches }
}

function gemText(entry, language) {
  const support = /Support$/.test(entry.baseType)
  const level = entry.baseType.startsWith('Awakened ') ? 5 : 6
  const category = language === 'en' ? `Item Class: ${support ? 'Support Gems' : 'Skill Gems'}`
    : language === 'tw' ? `物品種類: ${support ? '輔助寶石' : '技能寶石'}` : `物品类别: ${support ? '辅助宝石' : '技能宝石'}`
  const rarity = language === 'en' ? 'Rarity: Gem' : language === 'tw' ? '稀有度: 寶石' : '稀有度: 宝石'
  const properties = language === 'en' ? `Level: ${level}\nQuality: +20%\n--------\nRequirements:\nLevel: 35`
    : language === 'tw' ? `等級: ${level}\n品質: +20%\n--------\n需求:\n等級: 35` : `等级: ${level}\n品质: +20%\n--------\n需求:\n等级: 35`
  const corrupted = language === 'en' ? 'Corrupted' : language === 'tw' ? '已汙染' : '已腐化'
  return `${category}\n${rarity}\n${localizedName(entry.text || entry.baseType, language)}\n--------\n${properties}\n--------\n${corrupted}`
}

for (const language of ['cn', 'tw', 'en']) {
  test(`876条官方宝石身份经${language}游戏译名解析及官方请求保持精确`, () => {
    const { service } = fixture()
    const failures = []
    for (const entry of gems) {
      // The 49 Vaal/transfigured combinations use the catalogue's explicit
      // combined display format, assembled from two unchanged game name rows.
      // They are format coverage, not newly captured in-game clipboard samples.
      const name = entry.text || entry.baseType
      try {
        const model = service.parse(gemText(entry, language))
        for (const property of model.properties.filter(({ id }) => ['misc.gemLevel', 'misc.quality'].includes(id))) {
          property.enabled = true
          property.max = property.min
        }
        const query = buildOfficialTradeQuery(model).query
        assert.deepEqual(query.type, entry.discriminator ? { discriminator: entry.discriminator, option: entry.baseType } : entry.baseType)
        const level = entry.baseType.startsWith('Awakened ') ? 5 : 6
        assert.equal(model.item.gemLevel, level)
        assert.equal(model.item.quality, 20)
        assert.equal(model.facts.corrupted, true)
        assert.deepEqual(query.filters.misc_filters.filters.gem_level, { min: level, max: level })
        assert.deepEqual(query.filters.misc_filters.filters.quality, { min: 20, max: 20 })
        assert.equal(query.filters.misc_filters.filters.corrupted.option, 'true')
        assert.deepEqual(model.stats, [])
        assert.deepEqual(model.unknownStats, [])
        assert.equal(model.presentation.language, language)
        assert.equal(model.presentation.texts[name], localizedName(name, language))
      } catch (error) { failures.push(`${name}: ${error.message}`) }
    }
    assert.ok(gems.length >= 800)
    assert.equal(failures.length, 0, `${failures.length} failures:\n${failures.slice(0, 15).join('\n')}`)
  })
}

test('用户完整辅助宝石文本查询与重查保留等级6及原语言，不将技能描述作为装备词缀', async () => {
  const { service, searches } = fixture()
  const result = await service.check({ league: 'Covens', text: minionSpeedSupport, options: { initialSelection: 'all' } })
  assert.equal(result.model.identity.type, 'Minion Speed Support')
  assert.equal(result.model.item.gemLevel, 6)
  assert.equal(result.model.presentation.texts['Minion Speed Support'], '召唤生物速度(辅)')
  assert.equal(result.model.presentation.language, 'cn')
  assert.deepEqual(result.model.stats, [])
  assert.deepEqual(result.model.unknownStats, [])
  assert.equal(searches.length, 1)
  assert.equal(searches[0].query.type, 'Minion Speed Support')
  const level = result.model.properties.find(({ id }) => id === 'misc.gemLevel')
  assert.equal(level.min, 6)
  level.enabled = true
  await service.rerun({ model: result.model })
  assert.equal(searches.length, 2)
  assert.equal(searches[1].query.type, 'Minion Speed Support')
  assert.equal(searches[1].query.filters.misc_filters.filters.gem_level.min, 6)
})

test('宝石描述投影不会放宽普通装备未知中文词缀的阻断', () => {
  const { service } = fixture()
  for (const header of ['稀有度: 普通\nIron Ring', '稀有度: 稀有\n未知稀有名字\nIron Ring']) {
    assert.throws(() => service.parse(`物品类别: 戒指\n${header}\n--------\n未知装备伤害提高 127%`),
      (error) => error.code === 'LOCALIZATION_UNRESOLVED')
  }
})

test('等级1与腐化21级23品质辅助宝石保留交易数值和状态', () => {
  const { service } = fixture()
  for (const [level, quality, corrupted] of [[1, 0, false], [21, 23, true]]) {
    const text = minionSpeedSupport.replace('等级: 6', `等级: ${level}\n品质: +${quality}%`) + (corrupted ? '\n--------\n已腐化' : '')
    const model = service.parse(text)
    assert.equal(model.item.gemLevel, level)
    assert.equal(model.item.quality, quality)
    assert.equal(model.facts.corrupted, corrupted)
    for (const property of model.properties.filter(({ id }) => ['misc.gemLevel', 'misc.quality'].includes(id))) {
      property.enabled = true
      property.max = property.min
    }
    const query = buildOfficialTradeQuery(model).query
    assert.deepEqual(query.filters.misc_filters.filters.gem_level, { min: level, max: level })
    if (quality) assert.deepEqual(query.filters.misc_filters.filters.quality, { min: quality, max: quality })
  }
})

test('带井号标记的宝石状态和改造标志在描述投影后仍然保留', () => {
  const { service } = fixture()
  for (const state of ['## 已腐化', '## 已汙染', '## Corrupted']) {
    assert.equal(service.parse(`${minionSpeedSupport}\n--------\n${state}`).facts.corrupted, true, state)
  }
  const resolver = createLocalizationTextResolver(entries)
  for (const marker of ['## 改造', '## Transfigured']) {
    const resolved = resolver.resolve(`${minionSpeedSupport}\n--------\n${marker}`, { catalog })
    assert.equal(parseItemInfo(resolved.text).gemVariant, true, marker)
  }
})

test('瓦尔改造组合必须是目录中实际存在的完整组合，不能拼接两个已知宝石名误查', () => {
  const { service } = fixture()
  for (const language of ['cn', 'tw']) {
    const valid = gems.find(({ text }) => text === 'Vaal Arc (Arc of Oscillating)')
    const invalid = gemText(valid, language).replace(localizedName('Arc of Oscillating', language), localizedName('Absolution of Inspiring', language))
    assert.throws(() => service.parse(invalid), (error) => error.code === 'LOCALIZATION_UNRESOLVED')
  }
})
})()

// === Merged from priceCheckRestart.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const createServer = _m6_createServer
  const createPinia = _m6_createPinia
  const setActivePinia = _m6_setActivePinia
test('重启恢复期间查价先启用后台，恢复失败不捕获，成功恢复清除旧关闭错误', async (t) => {
  const previousStorage = globalThis.localStorage
  const storage = new Map([['priceCheckSettings', JSON.stringify({ enabled: true })]])
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key)
  }
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  t.after(async () => { await server.close(); globalThis.localStorage = previousStorage })
  const { electronApi } = await server.ssrLoadModule('/src/api/electron.js')
  const { usePriceCheckStore } = await server.ssrLoadModule('/src/stores/priceCheck.js')
  const { useFeatureModulesStore } = await server.ssrLoadModule('/src/stores/featureModules.js')
  setActivePinia(createPinia())
  useFeatureModulesStore().enable('price-check')
  const store = usePriceCheckStore()
  let enabled = false
  let rejectRestore = false
  const calls = []
  electronApi.priceCheck.updateRuntime = async (runtime) => {
    calls.push('restore')
    if (rejectRestore) return { success: false, error: { message: '后台恢复失败' } }
    enabled = runtime.enabled
    return { success: true, data: { enabled } }
  }
  electronApi.priceCheck.capture = async () => {
    calls.push('capture')
    assert.equal(enabled, true, '恢复完成前不能发送查价请求')
    return { success: true, data: { model: { item: {} }, result: null } }
  }
  assert.equal(store.settings.enabled, true)
  await store.checkHoveredItem({ configurationGuideBypass: true })
  assert.deepEqual(calls, ['restore', 'capture'])
  calls.length = 0
  await store.checkHoveredItem({ configurationGuideBypass: true })
  assert.deepEqual(calls, ['capture'])

  store.status = null
  rejectRestore = true
  calls.length = 0
  await assert.rejects(store.checkHoveredItem({ configurationGuideBypass: true }), /后台恢复失败/)
  assert.deepEqual(calls, ['restore'])
  assert.equal(store.settings.enabled, true)
  assert.equal(store.error, '后台恢复失败')

  rejectRestore = false
  store.error = '国服查价器尚未启用'
  store.failure = { message: store.error }
  await store.syncRuntime()
  assert.equal(store.error, '')
  assert.equal(store.failure, null)
  for (const message of ['查价器尚未启用', '国际服查价器尚未启用']) {
    store.error = message
    store.failure = { message }
    await store.syncRuntime()
    assert.equal(store.error, '')
    assert.equal(store.failure, null)
  }
  store.error = '查价尚未运行，请启用'
  store.failure = { failureCode: 'PRICE_CHECK_DISABLED', message: store.error }
  await store.syncRuntime()
  assert.equal(store.error, '')
  assert.equal(store.failure, null)
  store.error = '网络错误'
  await store.syncRuntime()
  assert.equal(store.error, '网络错误')

  store.settings.enabled = false
  calls.length = 0
  await assert.rejects(store.checkHoveredItem({ configurationGuideBypass: true }), /尚未启用/)
  assert.deepEqual(calls, [], '用户主动关闭时不得自动恢复后台')
})
})()
