import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { parseItemInfo as _m0_parseItemInfo } from '../electron/modules/item/parser.js'
import { loadTradeCatalog as _m0_loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { createPriceCheckModel as _m0_createPriceCheckModel, buildOfficialTradeQuery as _m0_buildOfficialTradeQuery } from '../electron/modules/priceCheck/query.js'
import { affixPatchAmulet as _m0_affixPatchAmulet } from './fixtures/affixPatchBase.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import _m1_path from 'node:path'
import { parseItemInfo as _m1_parseItemInfo } from '../electron/modules/item/parser.js'
import { loadTradeCatalog as _m1_loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { buildOfficialTradeQuery as _m1_buildOfficialTradeQuery, createPriceCheckModel as _m1_createPriceCheckModel, sanitizePriceCheckModel as _m1_sanitizePriceCheckModel } from '../electron/modules/priceCheck/query.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { readFile as _m2_readFile } from 'node:fs/promises'
import { fileURLToPath as _m2_fileURLToPath } from 'node:url'
import { loadInternationalTradeCatalog as _m2_loadInternationalTradeCatalog, loadTradeCatalog as _m2_loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { UniqueItemImageRepository as _m2_UniqueItemImageRepository, registerUniqueItemImageProtocol as _m2_registerUniqueItemImageProtocol } from '../electron/modules/priceCheck/uniqueItemSnapshot.js'
import { resolveUnidentifiedUnique as _m2_resolveUnidentifiedUnique } from '../electron/modules/priceCheck/query.js'
import { generateServerTradeCatalog as _m2_generateServerTradeCatalog } from '../scripts/generateServerTradeCatalog.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { createHash as _m3_createHash } from 'node:crypto'
import { readFile as _m3_readFile } from 'node:fs/promises'
import { createLocalizationTextResolver as _m3_createLocalizationTextResolver } from '../electron/modules/priceCheck/localizationText.js'
import { PriceCheckService as _m3_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { buildOfficialTradeQuery as _m3_buildOfficialTradeQuery } from '../electron/modules/priceCheck/query.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { readFileSync as _m4_readFileSync } from 'node:fs'
import { createLocalizationTextResolver as _m4_createLocalizationTextResolver } from '../electron/modules/localization/text.js'
import { PriceCheckService as _m4_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { resolveCatalogStat as _m4_resolveCatalogStat } from '../electron/modules/priceCheck/catalog.js'
import { asenathGentleTouchText as _m4_asenathGentleTouchText, dawnbreakerText as _m4_dawnbreakerText, doppelgangerGuiseText as _m4_doppelgangerGuiseText, ghastlyEyeJewelText as _m4_ghastlyEyeJewelText, inextricableFateText as _m4_inextricableFateText, soulMantleText as _m4_soulMantleText } from './fixtures/localizedPriceCheckReportedItems.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { readFile as _m5_readFile } from 'node:fs/promises'
import { PriceCheckService as _m5_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { loadTradeCatalog as _m5_loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import _m5_vm from 'node:vm'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { parseItemInfo as _m6_parseItemInfo } from '../electron/modules/item/parser.js'
import { enrichTradeCatalogChartRegions as _m6_enrichTradeCatalogChartRegions, loadTradeCatalog as _m6_loadTradeCatalog, resolveChartRegion as _m6_resolveChartRegion, validateTradeCatalog as _m6_validateTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { CHART_REGION_ALIASES as _m6_CHART_REGION_ALIASES, CHART_SHAPES as _m6_CHART_SHAPES } from '../electron/modules/priceCheck/chartRegions.js'
import { enrichOfficialItemsWithImages as _m6_enrichOfficialItemsWithImages, loadUniqueItemCatalog as _m6_loadUniqueItemCatalog } from '../electron/modules/priceCheck/uniqueItemSnapshot.js'
import { buildOfficialTradeQuery as _m6_buildOfficialTradeQuery, createPriceCheckModel as _m6_createPriceCheckModel, refreshPseudoStats as _m6_refreshPseudoStats, sanitizePriceCheckModel as _m6_sanitizePriceCheckModel } from '../electron/modules/priceCheck/query.js'
import { CHART_FORMAT_EXAMPLES as _m6_CHART_FORMAT_EXAMPLES } from '../src/utils/supportedItemFormats.js'
import { CHART_SHAPE_PRICE_CHECK_FIXTURES as _m6_CHART_SHAPE_PRICE_CHECK_FIXTURES, MAP_PRICE_CHECK_FIXTURES as _m6_MAP_PRICE_CHECK_FIXTURES } from './fixtures/mapChartItems.js'

// === Merged from affixPatchBase.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const parseItemInfo = _m0_parseItemInfo
  const loadTradeCatalog = _m0_loadTradeCatalog
  const createPriceCheckModel = _m0_createPriceCheckModel
  const buildOfficialTradeQuery = _m0_buildOfficialTradeQuery
  const affixPatchAmulet = _m0_affixPatchAmulet
const { catalog } = await loadTradeCatalog()

test('名称和底材宽松清理补丁标记，保留不成对及其他括号', () => {
  for (const [input, expected] of [
    ['聚焦项链[※※]', '聚焦项链'],
    ['[高价值]聚焦[123]项链[][45d 20c] ', '聚焦项链'],
    ['聚焦项链[提示: 已腐化]', '聚焦项链'],
    ['聚焦项链', '聚焦项链'],
    ['聚焦项链[未闭合', '聚焦项链[未闭合'],
    ['聚焦项链]', '聚焦项链]'],
    ['聚焦项链（※※）【高价值】', '聚焦项链（※※）【高价值】']
  ]) {
    const parsed = parseItemInfo(`物品类别: 项链\n稀有度: 稀有\n${input}\n${input}\n--------\n物品等级: 84`)
    assert.equal(parsed.name, expected, input)
    assert.equal(parsed.baseName, expected, input)
    assert.equal(parsed.isCorrupted, false)
  }
})

test('真实高价值项链保留词缀与等阶，并提交真实底材', () => {
  const parsed = parseItemInfo(affixPatchAmulet)
  assert.deepEqual(parsed, parseItemInfo(affixPatchAmulet.replace('[※※]', '')))
  assert.equal(parsed.level, 84)
  assert.equal(parsed.implicitMods.length, 4)
  assert.deepEqual(parsed.explicitMods, ['法术伤害提高 20%', '攻击附加 10 - 16 基础冰霜伤害', '+31% 全域暴击伤害加成'])
  assert.deepEqual(parsed.detailedMods.map(mod => mod.tier), [2, 5, 2])
  assert.deepEqual(parsed.detailedMods.flatMap(mod => mod.originalLines), [
    '法术伤害提高 20(18-22)%', '攻击附加 10(8-11) - 16(16-19) 基础冰霜伤害', '+31(30-34)% 全域暴击伤害加成'
  ])
  for (const [category, base] of [['项链', '聚焦项链'], ['戒指', '螺纹戒指']]) {
    const text = affixPatchAmulet.replace('物品类别: 项链', `物品类别: ${category}`).replace('聚焦项链', base)
    const model = createPriceCheckModel(parseItemInfo(text), catalog)
    assert.equal(model.identity.type, base)
    assert.equal(buildOfficialTradeQuery(model).query.type, base)
  }
  assert.ok(affixPatchAmulet.includes('聚焦项链[※※]'))
})

test('海图单行名称也清理补丁且不影响正文', () => {
  const parsed = parseItemInfo('物品类别: 海图\n稀有度: 稀有\n金沙海床海图[高价值]\n--------\n物品等级: 84')
  assert.equal(parsed.name, '金沙海床海图')
  assert.equal(parsed.baseName, '金沙海床海图')
})
})()

// === Merged from clusterJewelPriceCheck.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const path = _m1_path
  const parseItemInfo = _m1_parseItemInfo
  const loadTradeCatalog = _m1_loadTradeCatalog
  const buildOfficialTradeQuery = _m1_buildOfficialTradeQuery
  const createPriceCheckModel = _m1_createPriceCheckModel
  const sanitizePriceCheckModel = _m1_sanitizePriceCheckModel
const catalogPath = path.resolve('electron/modules/priceCheck/catalog.json')

const LARGE_CLUSTER = `物品类别: 珠宝
稀 有 度: 稀有
日象赠礼
大型星团珠宝
--------
需求:
等级: 54
--------
物品等级: 83
--------
增加 11 个天赋技能 (enchant)
（增加的天赋技能不被视为在其它珠宝范围之内） (enchant)
（除非另有说明，所有增加的天赋技能均为小天赋） (enchant)
其中 2 个增加的天赋为珠宝槽 (enchant)
增加的小天赋获得：法杖攻击造成的击中和异常状态伤害提高 12% (enchant)
（小天赋指天赋树上所有非核心天赋、非专精天赋、非基石天赋，以及非珠宝插槽） (enchant)
--------
{ 前缀属性 "镶嵌的" (等阶：2) — 防御, 护甲 }
增加的小天赋还获得：+21(21-30) 护甲值
{ 前缀属性 "健康的" (等阶：2) — 生命 }
增加的小天赋还获得：+7(4-7) 最大生命
{ 后缀属性 "幼龙之" (等阶：3) — 元素, 火焰, 抗性 }
增加的小天赋还获得：+2(2-3)% 火焰抗性
--------
放入天赋树上配置好的大型珠宝槽。增加的天赋跟珠宝范围无关。可以右键点击从插槽中移除。
--------
出售获得通货:非绑定`

const MEDIUM_CLUSTER = `物品类别: 珠宝
稀 有 度: 魔法
中型星团珠宝
--------
物品等级: 72
--------
增加 6 个天赋技能 (enchant)
（增加的天赋技能不被视为在其它珠宝范围之内） (enchant)
（除非另有说明，所有增加的天赋技能均为小天赋） (enchant)
其中 1 个增加的天赋为珠宝槽 (enchant)
增加的小天赋获得：燃烧伤害提高 12% (enchant)
（小天赋指天赋树上所有非核心天赋、非专精天赋、非基石天赋，以及非珠宝插槽） (enchant)
--------
未鉴定
--------
放入天赋树上配置好的中型或大型珠宝槽。增加的天赋跟珠宝范围无关。可以右键点击从插槽中移除。
--------
出售获得通货:非绑定`

const SMALL_CLUSTER = `物品类别: 珠宝
稀 有 度: 魔法
小型星团珠宝
--------
物品等级: 84
--------
增加 3 个天赋技能 (enchant)
（增加的天赋技能不被视为在其它珠宝范围之内） (enchant)
（除非另有说明，所有增加的天赋技能均为小天赋） (enchant)
（小天赋指天赋树上所有非核心天赋、非专精天赋、非基石天赋，以及非珠宝插槽） (enchant)
--------
{ 前缀属性 "武艺精湛" (等阶：1) — 伤害, 攻击 }
其中 1 个增加的天赋为武艺精湛
--------
放入天赋树上配置好的小型、中型或大型珠宝槽。增加的天赋跟珠宝范围无关。可以右键点击从插槽中移除。`

const explanationPattern = /不被视为|除非另有说明|小天赋指|放入天赋树/

test('星团珠宝解析有效附魔并从共享物品模型排除说明文案', () => {
  const large = parseItemInfo(LARGE_CLUSTER)
  const medium = parseItemInfo(MEDIUM_CLUSTER)
  const small = parseItemInfo(SMALL_CLUSTER)

  assert.equal(large.baseName, '大型星团珠宝')
  assert.equal(medium.name, '中型星团珠宝')
  assert.equal(small.name, '小型星团珠宝')
  assert.equal(medium.isUnidentified, true)
  assert.deepEqual(large.modifiers.filter(({ type }) => type === 'enchant').map(({ text }) => text), [
    '增加 11 个天赋技能',
    '其中 2 个增加的天赋为珠宝槽',
    '增加的小天赋获得：法杖攻击造成的击中和异常状态伤害提高 12%'
  ])
  assert.equal(medium.modifiers.filter(({ type }) => type === 'enchant').length, 3)
  assert.deepEqual(small.modifiers.filter(({ type }) => type === 'enchant').map(({ text }) => text), [
    '增加 3 个天赋技能'
  ])
  assert.equal(large.modifiers.find(({ type }) => type === 'enchant').originalLines[0], '增加 11 个天赋技能')

  for (const item of [large, medium, small]) {
    const allText = [
      ...item.modifiers.flatMap(({ lines = [], originalLines = [] }) => [...lines, ...originalLines]),
      ...item.implicitMods,
      ...item.explicitMods,
      ...item.craftedMods
    ].join('\n')
    assert.doesNotMatch(allText, explanationPattern)
  }
  assert.deepEqual(large.modifiers.filter(({ type }) => ['prefix', 'suffix'].includes(type)).map(({ tier }) => tier), [2, 2, 3])
})

test('三种星团底材将已有附魔目录映射为默认启用的官方查询条件', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const cases = [
    {
      text: LARGE_CLUSTER,
      type: '大型星团珠宝',
      ids: ['enchant.stat_3086156145', 'enchant.stat_4079888060', 'enchant.stat_3948993189|5']
    },
    {
      text: MEDIUM_CLUSTER,
      type: '中型星团珠宝',
      ids: ['enchant.stat_3086156145', 'enchant.stat_4079888060', 'enchant.stat_3948993189|18']
    },
    {
      text: SMALL_CLUSTER,
      type: '小型星团珠宝',
      ids: ['enchant.stat_3086156145']
    }
  ]

  for (const fixture of cases) {
    const model = createPriceCheckModel(parseItemInfo(fixture.text), catalog, { initialSelection: 'auto' })
    const enchantStats = model.stats.filter(({ type }) => type === 'enchant')
    assert.equal(model.identity.type, fixture.type)
    assert.equal(model.identity.category, 'jewel')
    assert.deepEqual(enchantStats.map(({ id }) => id), fixture.ids)
    assert.ok(enchantStats.every(({ enabled }) => enabled))
    assert.equal(model.properties.find(({ id }) => id === 'misc.itemLevel').enabled, model.item.itemLevel >= 84)
    assert.doesNotMatch(model.unknownStats.map(({ text }) => text).join('\n'), explanationPattern)
    const passiveCount = enchantStats.find(({ id }) => id === 'enchant.stat_3086156145')
    assert.equal(passiveCount.max, passiveCount.min)
    if (fixture.type === '小型星团珠宝') {
      const notable = model.stats.find(({ id }) => id === 'explicit.stat_1152182658')
      assert.equal(notable?.text, '其中 1 个增加的天赋为武艺精湛')
      assert.equal(notable?.enabled, true)
    }

    const query = buildOfficialTradeQuery(model).query
    assert.equal(query.type, fixture.type)
    assert.equal(query.filters.type_filters.filters.rarity.option, 'nonunique')
    assert.equal(query.filters.misc_filters?.filters.identified?.option, model.item.unidentified ? 'false' : undefined)
    const queryIds = query.stats[0].filters.map(({ id }) => id)
    assert.ok(fixture.ids.every((id) => queryIds.includes(id)))
    if (fixture.type === '大型星团珠宝') {
      assert.equal(queryIds.includes('explicit.stat_2554466725'), false)
      assert.equal(queryIds.includes('explicit.stat_3819827377'), false)
    }
  }
})

test('星团附魔可取消和编辑，普通珠宝附魔不改变自动初选语义', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const trusted = createPriceCheckModel(parseItemInfo(LARGE_CLUSTER), catalog, { initialSelection: 'auto' })
  const submitted = structuredClone(trusted)
  const passiveCount = submitted.stats.find(({ id }) => id === 'enchant.stat_3086156145')
  const jewelSockets = submitted.stats.find(({ id }) => id === 'enchant.stat_4079888060')
  passiveCount.min = 9
  passiveCount.max = 11
  jewelSockets.enabled = false

  const sanitized = sanitizePriceCheckModel(submitted, catalog, null, null, trusted)
  const filters = buildOfficialTradeQuery(sanitized).query.stats[0].filters
  assert.deepEqual(filters.find(({ id }) => id === passiveCount.id).value, {
    min: 9,
    max: 11,
    option: undefined
  })
  assert.equal(filters.some(({ id }) => id === jewelSockets.id), false)

  const normalJewel = createPriceCheckModel({
    category: '珠宝',
    rarity: '魔法',
    name: '钴蓝珠宝',
    modifiers: [{ type: 'enchant', text: '增加 11 个天赋技能' }]
  }, catalog, { initialSelection: 'auto' })
  assert.equal(normalJewel.identity.type, '钴蓝珠宝')
  assert.equal(normalJewel.stats.find(({ type }) => type === 'enchant').enabled, false)

  const clusterNone = createPriceCheckModel(parseItemInfo(MEDIUM_CLUSTER), catalog, { initialSelection: 'none' })
  assert.ok(clusterNone.stats.filter(({ type }) => type === 'enchant').every(({ enabled }) => !enabled))
  const normalAll = createPriceCheckModel({
    category: '珠宝',
    rarity: '魔法',
    name: '钴蓝珠宝',
    modifiers: [{ type: 'enchant', text: '增加 11 个天赋技能' }]
  }, catalog, { initialSelection: 'all' })
  assert.equal(normalAll.stats.find(({ type }) => type === 'enchant').enabled, true)
})
})()

// === Merged from internationalUniqueImages.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const readFile = _m2_readFile
  const fileURLToPath = _m2_fileURLToPath
  const loadInternationalTradeCatalog = _m2_loadInternationalTradeCatalog
  const loadTradeCatalog = _m2_loadTradeCatalog
  const UniqueItemImageRepository = _m2_UniqueItemImageRepository
  const registerUniqueItemImageProtocol = _m2_registerUniqueItemImageProtocol
  const resolveUnidentifiedUnique = _m2_resolveUnidentifiedUnique
  const generateServerTradeCatalog = _m2_generateServerTradeCatalog
test('国际服未鉴定节庆之面候选在无汉化词库时也能通过本地协议读取真实图片', async () => {
  const repository = new UniqueItemImageRepository()
  await repository.load()
  const { catalog } = await loadInternationalTradeCatalog({ uniqueItemCatalog: repository.catalog })
  const cached = await loadInternationalTradeCatalog({
    cacheFile: fileURLToPath(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)),
    uniqueItemCatalog: repository.catalog
  })
  assert.equal(cached.status.provider, 'cached')
  assert.notEqual(cached.catalog.items.find(item => item.name === 'Leer Cast').imageId, 'placeholder')
  const model = resolveUnidentifiedUnique({
    item: { rarity: '传奇', unidentified: true, baseType: 'Festival Mask' },
    identity: { name: '', type: 'Festival Mask' }
  }, catalog)
  assert.deepEqual(model.identityResolution.candidates.map(candidate => candidate.name), ['Leer Cast', 'Replica Leer Cast'])
  let handler
  registerUniqueItemImageProtocol({
    repository,
    protocol: { handle: (_scheme, value) => { handler = value } },
    net: { fetch: async url => new Response(await readFile(fileURLToPath(url))) }
  })
  for (const candidate of model.identityResolution.candidates) {
    assert.notEqual(candidate.imageId, 'placeholder', candidate.name)
    const response = await handler({ url: candidate.imageUrl })
    assert.equal(response.status, 200)
    const bytes = Buffer.from(await response.arrayBuffer())
    assert.ok(bytes.length > 100)
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP')
  }
  assert.ok(catalog.items.filter(item => item.name === 'Leer Cast').every(item => !item.uniqueSnapshotCovered && !item.uniqueModifierMatchers))
})

test('国际服实时目录刷新保留本地图片映射且不注入国服词缀', async () => {
  const repository = new UniqueItemImageRepository()
  await repository.load()
  const { catalog: baseCatalog } = await loadTradeCatalog()
  const payloads = {
    stats: { result: [{ id: 'explicit', entries: Array.from({ length: 110 }, (_, index) => ({ id: `explicit.stat_${index}`, text: `Fixture ${index}: +# to Life` })) }] },
    items: { result: [{ id: 'armour.helmet', entries: [
      { name: 'Leer Cast', type: 'Festival Mask', flags: { unique: true } },
      { name: 'Replica Leer Cast', type: 'Festival Mask', flags: { unique: true } },
      ...Array.from({ length: 110 }, (_, index) => ({ type: `Fixture Base ${index}` }))
    ] }] },
    static: { result: [{ id: 'currency', entries: [{ id: 'chaos', text: 'Chaos Orb' }] }] }
  }
  const result = await generateServerTradeCatalog({
    server: 'international', gameVersion: 'live', baseCatalog, uniqueItemCatalog: repository.catalog,
    fetchImpl: async url => new Response(JSON.stringify(payloads[url.split('/').at(-1)]))
  })
  for (const name of ['Leer Cast', 'Replica Leer Cast']) {
    const item = result.catalog.items.find(item => item.name === name)
    assert.notEqual(item.imageId, 'placeholder')
    assert.ok(repository.imageInfo(item.imageId))
    assert.equal(item.uniqueSnapshotCovered, undefined)
    assert.equal(item.uniqueModifierMatchers, undefined)
  }
})
})()

// === Merged from localizedPriceCheck.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const createHash = _m3_createHash
  const readFile = _m3_readFile
  const createLocalizationTextResolver = _m3_createLocalizationTextResolver
  const PriceCheckService = _m3_PriceCheckService
  const buildOfficialTradeQuery = _m3_buildOfficialTradeQuery
const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
const entry = (id, en, tw, cn, extra = {}) => ({ kind: 'dat', table: 'BaseItemTypes', id, field: 'Name', en, tw, cn, sourceHash: createHash('sha256').update(en).digest('hex'), ...extra })
const entries = [
  entry('Metadata/Items/Rings/Ring3', 'Coral Ring', '珊瑚戒指', '珊瑚戒指'),
  entry('base_maximum_life', '+{0} to maximum Life', '+{0} 最大生命', '+{0} 最大生命', { kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.txt', field: 'variant:0' })
]
const chinese = '物品種類: 戒指\n稀有度: 稀有\n风暴之环\n珊瑚戒指\n--------\n物品等級: 80\n--------\n+89 最大生命'
const english = 'Item Class: Rings\nRarity: Rare\nStorm Circle\nCoral Ring\n--------\nItem Level: 80\n--------\n+89 to maximum Life'

function serviceFixture(extra = {}) {
  const searches = []
  const client = { server: { id: 'international', label: '国际服' }, clearCache() {},
    search: async (league, query) => { searches.push({ league, query }); return { id: 'fixture', total: 0, result: [] } },
    fetch: async () => ({ result: [] }) }
  const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) }, client, catalog,
    manualInputOnly: true, localizationProvider: () => entries, ...extra })
  return { service, client, searches }
}

test('简体繁体混合文本按稳定条目映射成国际服身份和交易词缀，保留数值', async () => {
  const { service, searches } = serviceFixture()
  const result = await service.check({ league: 'Covens', text: chinese, options: { initialSelection: 'all' } })
  assert.equal(result.model.identity.type, 'Coral Ring')
  assert.ok(result.model.stats.some(stat => stat.id === 'explicit.stat_3299347043' && stat.values[0] === 89))
  assert.equal(searches.length, 1)
  assert.equal(searches[0].league, 'Covens')
  assert.equal(searches[0].query.query.type, 'Coral Ring')
  assert.match(JSON.stringify(searches[0].query), /explicit.stat_3299347043/)
})

test('纯英文和英文头部混合中文词缀查询得到相同国际服标识', () => {
  const { service } = serviceFixture()
  const expected = service.parse(english, { initialSelection: 'all' })
  const mixed = service.parse(english.replace('+89 to maximum Life', '+89 最大生命'), { initialSelection: 'all' })
  assert.deepEqual(mixed.identity, expected.identity)
  assert.deepEqual(buildOfficialTradeQuery(mixed), buildOfficialTradeQuery(expected))
  assert.equal(mixed.stats[0].displayText, '+89 最大生命')
})

test('国际服手动查价不要求快捷开关，启用后英文和受管汉化均可通过捕获打开浮窗', async () => {
  let captured = 0
  let text = english
  const overlays = []
  const { service } = serviceFixture({ manualInputOnly: false, allowManualQueries: true,
    captureClipboard: async () => { captured++; return text },
    overlay: { create: snapshot => overlays.push(snapshot), update() {}, prepare() {} } })
  const manual = await service.check({ league: 'Covens', text: chinese })
  assert.equal(manual.model.identity.type, 'Coral Ring')
  await assert.rejects(service.captureAndCheck({ league: 'Covens' }), /尚未启用/)
  assert.equal(captured, 0)
  service.updateRuntime({ enabled: true, league: 'Covens' })
  const original = await service.captureAndCheck({ league: 'Covens' })
  text = chinese
  const localized = await service.captureAndCheck({ league: 'Covens' })
  assert.deepEqual(localized.model.identity, original.model.identity)
  assert.deepEqual(buildOfficialTradeQuery(localized.model), buildOfficialTradeQuery(original.model))
  assert.equal(localized.model.stats[0].displayText, '+89 最大生命')
  assert.equal(captured, 2)
  assert.ok(overlays.some(snapshot => snapshot.status === 'ready-to-query'))
})

test('魔法单行名称仅按稳定底材别名解析，详细繁体词缀头保留等阶和来源', () => {
  const { service } = serviceFixture()
  const magic = service.parse('物品種類: 戒指\n稀有度: 魔法\n健壮的珊瑚戒指\n--------\n物品等級: 80\n--------\n{ 前綴詞綴 "健壮的" (等階: 1) — 生命 }\n+89 最大生命')
  assert.equal(magic.identity.type, 'Coral Ring')
  assert.ok(magic.stats.some(stat => stat.id === 'explicit.stat_3299347043' && stat.tier === 1))
})

test('没有词库、源文哈希错误和名称歧义均阻止发起查询，不使用国服目录兜底', async () => {
  const alternatives = [[], entries.map(value => ({ ...value, sourceHash: '0'.repeat(64) })), [
    ...entries, entry('different-stable-id', 'Iron Ring', '珊瑚戒指', '珊瑚戒指')
  ]]
  for (const data of alternatives) {
    const { service, searches } = serviceFixture({ localizationProvider: () => data })
    await assert.rejects(service.check({ league: 'Covens', text: chinese }), error => /^LOCALIZATION_/.test(error.code))
    assert.equal(searches.length, 0)
  }
})

test('资源中的英文身份不存在于国际服目录时拒绝查询', async () => {
  const data = [entry('invented-base', 'Invented Ring', '不存在的戒指', '不存在的戒指')]
  const { service, searches } = serviceFixture({ localizationProvider: () => data })
  await assert.rejects(service.check({ league: 'Covens', text: '物品类别: 戒指\n稀有度: 普通\n不存在的戒指\n--------\n物品等级: 80' }), /未匹配国际服交易目录/)
  assert.equal(searches.length, 0)
})

test('未知中文、英文词缀或多个官方候选不被静默省略', async () => {
  for (const text of [chinese.replace('+89 最大生命', '+89 未知效果'), english.replace('+89 to maximum Life', 'Grants 89 entirely unknown power')]) {
    const { service, searches } = serviceFixture()
    await assert.rejects(service.check({ league: 'Covens', text }), /已阻止省略条件查询/)
    assert.equal(searches.length, 0)
  }
})

test('占位符按编号重排，字面符号不会被当成正则，重复参数冲突拒绝匹配', () => {
  const resolver = createLocalizationTextResolver([
    entry('reorder', 'Gain {0}% Damage and {1} Life', '獲得 {1} 生命及 {0}% 傷害', '获得 {1} 生命及 {0}% 伤害', { kind: 'stat' }),
    entry('literal', 'Gain {0} Life (Local)', '獲得 {0} 生命 (區域)', '获得 {0} 生命 (区域)', { kind: 'stat' }),
    entry('repeated', 'Gain {0} Life twice', '{0} 生命與 {0} 生命', '{0} 生命与 {0} 生命', { kind: 'stat' })
  ])
  assert.equal(resolver.resolve('獲得 40 生命及 12% 傷害').text, 'Gain 12% Damage and 40 Life')
  assert.equal(resolver.resolve('获得 25 生命 (区域)').text, 'Gain 25 Life (Local)')
  assert.throws(() => resolver.resolve('获得 25 生命 X区域Y'), /未匹配/)
  assert.throws(() => resolver.resolve('25 生命与 26 生命'), /未匹配/)
})

test('真实资源的带符号和双数值模板可匹配，数字索引不会忽略模板里的固定数字', () => {
  const resolver = createLocalizationTextResolver([
    entry('base_maximum_life', '{0:+d} to maximum Life', '{0:+d} 最大生命', '{0:+d} 最大生命', { kind: 'stat' }),
    entry('attack_added_physical', 'Adds {0} to {1} Physical Damage to Attacks', '攻擊附加 {0} 至 {1} 物理傷害', '攻击附加 {0} - {1} 基础物理伤害', { kind: 'stat' }),
    entry('fixed-time', 'Gain {0} Life after 10 seconds', '10 秒後獲得 {0} 生命', '10 秒后获得 {0} 生命', { kind: 'stat' })
  ])
  assert.equal(resolver.resolve('+89 最大生命').text, '+89 to maximum Life')
  assert.equal(resolver.resolve('-20 最大生命').text, '-20 to maximum Life')
  assert.equal(resolver.resolve('攻击附加 1 - 4 基础物理伤害').text, 'Adds 1 to 4 Physical Damage to Attacks')
  assert.equal(resolver.resolve('10 秒后获得 35 生命').text, 'Gain 35 Life after 10 seconds')
  assert.throws(() => resolver.resolve('15 秒后获得 35 生命'), /未匹配/)
})

test('资源激活后清理旧结果，并丢弃更新前查询的迟到响应', async () => {
  let revision = 'r1'
  const { service, client } = serviceFixture({ localizationRevisionProvider: () => revision })
  let completeSearch
  client.search = () => new Promise(resolve => { completeSearch = resolve })
  const pending = service.check({ league: 'Covens', text: english })
  revision = 'r2'
  completeSearch({ id: 'old', total: 0, result: [] })
  await assert.rejects(pending, error => error.name === 'AbortError')
  assert.equal(service.latest, null)
  assert.equal(service.getStatus().localizationRevision, 'r2')
})

test('词库失效立即作废浮窗模型，重查无法沿用旧译文的过滤条件', async () => {
  for (const delivery of ['status', 'rerun']) {
    let revision = 'r1'
    let snapshot = null
    const overlay = {
      create: value => { snapshot = structuredClone(value) },
      update: patch => { snapshot = { ...snapshot, ...structuredClone(patch) } },
      getState: () => structuredClone(snapshot)
    }
    const { service, searches } = serviceFixture({ overlay, localizationRevisionProvider: () => revision,
      localizationProvider: () => revision === 'r1' ? entries : [] })
    const { model } = await service.check({ league: 'Covens', text: chinese, options: { initialSelection: 'all' } })
    assert.ok(model.stats.some(stat => stat.id === 'explicit.stat_3299347043' && stat.enabled))

    revision = 'r2'
    if (delivery === 'status') service.getStatus()
    await assert.rejects(service.rerun({ model }), /没有可重新查询的物品/, delivery)
    assert.equal(snapshot.model, null)
    assert.equal(snapshot.result, null)
    assert.equal(searches.length, 1)
    assert.equal((await service.check({ league: 'Covens', text: english })).model.identity.type, 'Coral Ring')
    assert.equal(searches.length, 2)
  }
})

test('词库失效或账号退出后迟到的网络错误不会恢复可重试模型', async () => {
  for (const change of ['revision', 'logout']) {
    let revision = 'r1'
    let authenticated = true
    const { service, client } = serviceFixture({ localizationRevisionProvider: () => revision,
      auth: { getStatus: () => ({ authenticated }) } })
    let rejectSearch
    client.search = () => new Promise((_resolve, reject) => { rejectSearch = reject })
    const pending = service.check({ league: 'Covens', text: english })
    if (change === 'revision') revision = 'r2'
    else authenticated = false
    rejectSearch(Object.assign(Error('迟到的断网错误'), { code: 'NETWORK_ERROR' }))
    await assert.rejects(pending, /断网/)
    assert.equal(service.latest, null, change)
  }
})

test('增量词库应用后分页迟到结果不进入旧查询', async () => {
  let revision = 'r1'
  const { service, client } = serviceFixture({ localizationRevisionProvider: () => revision })
  service.latest = { result: { queryId: 'old' }, rawEntries: [], remainingResultIds: ['a'] }
  let completeFetch
  client.fetch = () => new Promise(resolve => { completeFetch = resolve })
  const pending = service.loadMore()
  revision = 'r2'
  completeFetch({ result: [{ id: 'a' }] })
  await assert.rejects(pending, error => error.name === 'AbortError')
  assert.equal(service.latest, null)
})

test('国际服底材不兼容时不会重试删除底材条件，国服旧流程不受影响', async () => {
  const { service, client } = serviceFixture()
  let calls = 0
  client.search = async () => { calls++; const error = new Error('unknown item base type'); error.details = { status: 400, officialMessage: 'unknown item base type' }; throw error }
  const text = 'Item Class: Amulets\nRarity: Unique\nThe Anvil\nAmber Amulet\n--------\nItem Level: 80'
  await assert.rejects(service.check({ league: 'Covens', text }), /不认识物品底材/)
  assert.equal(calls, 1)
})
})()

// === Merged from localizedPriceCheckReportedItems.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const readFileSync = _m4_readFileSync
  const createLocalizationTextResolver = _m4_createLocalizationTextResolver
  const PriceCheckService = _m4_PriceCheckService
  const resolveCatalogStat = _m4_resolveCatalogStat
  const asenathGentleTouchText = _m4_asenathGentleTouchText
  const dawnbreakerText = _m4_dawnbreakerText
  const doppelgangerGuiseText = _m4_doppelgangerGuiseText
  const ghastlyEyeJewelText = _m4_ghastlyEyeJewelText
  const inextricableFateText = _m4_inextricableFateText
  const soulMantleText = _m4_soulMantleText
const bundled = JSON.parse(readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)))
const entries = JSON.parse(readFileSync(new URL('./fixtures/price-check-reported-items-entries.json', import.meta.url)))
// Verbatim rows from signed localization release c8864f7e-27bd-4e9b-8f3f-e63250554e1c.
const fixedVariants = JSON.parse(readFileSync(new URL('./fixtures/price-check-fixed-variants-entries.json', import.meta.url)))
const shieldEntries = JSON.parse(readFileSync(new URL('./fixtures/price-check-dawnbreaker-entries.json', import.meta.url)))
const legacy = { ...bundled, stats: bundled.stats.filter(stat => stat.ids?.explicit !== 'explicit.effect_1858870975') }

function fixture(catalog = bundled, dictionary = entries) {
  const searches = []
  const service = new PriceCheckService({ catalog, localizationProvider: () => dictionary, manualInputOnly: true,
    auth: { getStatus: () => ({ authenticated: true }) },
    client: { server: { id: 'international' }, clearCache() {},
      async search(league, query) { searches.push(query); return { id: 'soul-mantle', total: 0, result: [] } },
      async fetch() { return { result: [] } } }
  })
  return { service, searches }
}

test('完整祖灵之约在当前和旧目录保留全部五条词缀并提交正确辅助等级', async () => {
  for (const [catalog, id] of [[bundled, 'explicit.effect_1858870975'], [legacy, 'explicit.indexable_support_15']]) {
    const { service, searches } = fixture(catalog)
    const { model } = await service.check({ text: soulMantleText, league: 'Covens', options: { initialSelection: 'all' } })
    assert.equal(model.identity.name, 'Soul Mantle')
    assert.equal(model.identity.type, 'Spidersilk Robe')
    assert.deepEqual(model.unknownStats, [])
    assert.equal(model.stats.length, 5)
    assert.deepEqual(model.stats.map(stat => stat.values), [[109], [27], [20], [20], []])
    const support = model.stats.find(stat => stat.id === id)
    assert.ok(support)
    assert.equal(support.displayText, soulMantleText.split('\n').find(line => line.includes('寶石被等級')))
    const filters = searches[0].query.stats.flatMap(group => group.filters)
    assert.equal(filters.find(filter => filter.id === id).value.min, 20)
    await service.rerun({ model })
    assert.deepEqual(JSON.parse(JSON.stringify(searches[1])), JSON.parse(JSON.stringify(searches[0])))
  }
})

test('截图简体辅助行和繁体原文生成相同查询，详细等级范围仍保留实际值', async () => {
  const queries = []
  for (const text of [soulMantleText, soulMantleText.replace('插槽中的寶石被等級 20 的 ​法術圖騰輔助 輔助', '插槽中的宝石被等级 20 的 法术图腾辅助 辅助')]) {
    const { service, searches } = fixture()
    await service.check({ text, league: 'Covens', options: { initialSelection: 'all' } })
    queries.push(searches[0])
  }
  assert.deepEqual(queries[1], queries[0])
  const { service } = fixture()
  const model = service.parse(soulMantleText.replace('等級 20 的', '等級 20(18-22) 的'))
  assert.deepEqual(model.stats.find(stat => stat.id === 'explicit.effect_1858870975')?.values, [20])
})

test('未知辅助名或不可信名称仍阻止查询，不能省略条件', async () => {
  for (const [text, dictionary] of [
    [soulMantleText.replace('法術圖騰輔助', '未知輔助'), entries],
    [soulMantleText, entries.map(entry => ['grantedeffects', 'baseitemtypes'].includes(entry.table) && entry.en === 'Spell Totem Support'
      ? { ...entry, sourceHash: '0'.repeat(64) } : entry)]
  ]) {
    const { service, searches } = fixture(bundled, dictionary)
    await assert.rejects(service.check({ text, league: 'Covens' }), error => error.code === 'LOCALIZATION_UNRESOLVED')
    assert.deepEqual(searches, [])
  }
})

test('完整宿命查询保留全部七条词缀，官方只有存在性过滤项的藤蔓效果不带数值范围', async () => {
  const { service, searches } = fixture(bundled, fixedVariants)
  const { model } = await service.check({ text: inextricableFateText, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(model.identity.name, 'Inextricable Fate')
  assert.equal(model.identity.type, 'Fugitive Boots')
  assert.deepEqual(model.unknownStats, [])
  assert.deepEqual(model.stats.map(stat => [stat.id, stat.values]), [
    ['implicit.stat_2923486259', [21]],
    ['explicit.stat_3299347043', [90]],
    ['explicit.stat_2250533757', [30]],
    ['explicit.stat_375932027', []],
    ['explicit.stat_3469279727', []],
    ['explicit.stat_3190526553', [3]],
    ['explicit.stat_2070361501', [-46]]
  ])
  assert.match(model.stats[3].displayText, /获得 3 个缓速藤蔓/)
  assert.match(model.stats[4].displayText, /6 米范围内静止的敌人每 0\.5 秒/)
  const filters = searches[0].query.stats.flatMap(group => group.filters)
  assert.equal(filters.length, 7)
  for (const id of ['explicit.stat_375932027', 'explicit.stat_3469279727']) {
    const filter = filters.find(filter => filter.id === id)
    assert.ok(filter)
    assert.deepEqual(JSON.parse(JSON.stringify(filter.value ?? {})), {})
  }
  assert.equal(filters.find(filter => filter.id === 'explicit.stat_3190526553').value.min, 3)
  await service.rerun({ model })
  assert.deepEqual(JSON.parse(JSON.stringify(searches[1])), JSON.parse(JSON.stringify(searches[0])))
})

test('同源存在性过滤覆盖秒数与数量变体，保留相反语义并优先选择现行数值过滤', () => {
  const resolver = createLocalizationTextResolver(fixedVariants)
  const canonical = (text, catalog = bundled) => resolver.resolve(text, { normalizeStatSigns: true, catalog }).text
  for (const [clipboard, id] of [
    ['Gain a Spirit Charge every 0.5 seconds', 'explicit.stat_328131617'],
    ['Your Maps contain 2 additional Harbingers', 'explicit.stat_504850499']
  ]) {
    const match = resolveCatalogStat(bundled, canonical(clipboard)).match
    assert.equal(match?.id, id)
    assert.deepEqual(match.values, [])
  }
  const lostCharges = 'Lose 3 Frenzy Charges each second'
  assert.equal(canonical(lostCharges), lostCharges)
  const vines = 'You gain 3 Grasping Vines when you take a Critical Strike'
  assert.equal(canonical(`{ Enchant Modifier }\n${vines}`).split('\n').at(-1), vines)
  const unverified = createLocalizationTextResolver(fixedVariants.map(entry => entry.en.startsWith('You gain a Grasping Vine')
    ? { ...entry, sourceHash: '0'.repeat(64) } : entry))
  assert.equal(unverified.resolve(vines, { normalizeStatSigns: true, catalog: bundled }).text, vines)
  const newer = { ...bundled, stats: bundled.stats.map(stat => stat.ids?.explicit === 'explicit.stat_375932027'
    ? { ...stat, matchers: [...stat.matchers, 'You gain # Grasping Vines when you take a Critical Strike'] } : stat) }
  const current = canonical(vines, newer)
  assert.equal(current, vines)
  assert.deepEqual(resolveCatalogStat(newer, current).match?.values, [3])
})

test('完整破晓者使用盾牌局部格挡和带负号的火伤格挡词缀查询', async () => {
  const { service, searches } = fixture(bundled, shieldEntries)
  const { model } = await service.check({ text: dawnbreakerText, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(model.identity.name, 'Dawnbreaker')
  assert.equal(model.identity.type, 'Colossal Tower Shield')
  assert.deepEqual(model.unknownStats, [])
  assert.deepEqual(model.stats.map(stat => [stat.id, stat.values]), [
    ['implicit.stat_3299347043', [15]],
    ['explicit.stat_1062208444', [207]],
    ['explicit.stat_4253454700', [21]],
    ['explicit.stat_8517868', [-1]],
    ['explicit.stat_1642347505', [13]],
    ['explicit.stat_1244494473', [17]],
    ['explicit.stat_1004468512', [20]],
    ['explicit.stat_41178696', []]
  ])
  assert.match(model.stats[2].displayText, /该装备 \+21\(20-25\)%/)
  assert.match(model.stats[3].displayText, /每 200 点火焰伤害 -1%/)
  const filters = searches[0].query.stats.flatMap(group => group.filters)
  assert.equal(filters.length, 8)
  assert.equal(filters.find(filter => filter.id === 'explicit.stat_4253454700').value.min, 21)
  assert.equal(filters.find(filter => filter.id === 'explicit.stat_8517868').value.min, -1)
  await service.rerun({ model })
  assert.deepEqual(JSON.parse(JSON.stringify(searches[1])), JSON.parse(JSON.stringify(searches[0])))
})

test('盾牌的简写格挡依赖官方类型与物品类别，负号兼容优先保留目录的直接匹配', () => {
  const block = '+21% Chance to Block'
  const blockId = 'explicit.stat_4253454700'
  assert.equal(resolveCatalogStat(bundled, block, 'explicit', { category: 'Shields' }).match?.id, blockId)
  assert.equal(resolveCatalogStat(bundled, block, 'crafted', { category: '盾牌' }).match?.id, 'crafted.stat_4253454700')
  for (const context of [{}, { category: 'Staves' }, { category: 'Gloves' }]) {
    assert.equal(resolveCatalogStat(bundled, block, 'explicit', context).match, null)
  }
  const missing = { ...bundled, stats: bundled.stats.filter(stat => stat.ids?.explicit !== blockId) }
  assert.equal(resolveCatalogStat(missing, block, 'explicit', { category: '盾牌' }).match, null)

  const matcher = '#% Chance to Block Attack Damage for every 200 Fire Damage taken from Hits Recently'
  const source = matcher.replace('#', '-1')
  const explicitNegative = { ...bundled, stats: [...bundled.stats, {
    key: 'negative-filter', matchers: [`-${matcher}`], ids: { explicit: 'explicit.stat_999999999' }
  }] }
  assert.equal(resolveCatalogStat(explicitNegative, source).match?.id, 'explicit.stat_999999999')
  assert.equal(resolveCatalogStat(bundled, source.replace('200', '100')).match, null)
})

test('深渊珠宝属性段深渊标签按可信 ClientStrings 解析，保留全部五条召唤与防御词缀', async () => {
  const { service, searches } = fixture()
  const { model } = await service.check({ text: ghastlyEyeJewelText, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(model.identity.type, 'Ghastly Eye Jewel')
  assert.equal(model.identity.category, 'jewel.abyss')
  assert.deepEqual(model.unknownStats, [])
  assert.deepEqual(model.stats.map(stat => [stat.id, stat.values, stat.displayText]), [
    ['explicit.stat_3489782002', [22], '+22(21-25) 最大能量护盾'],
    ['explicit.stat_3299347043', [21], '+21(21-25) 最大生命'],
    ['explicit.stat_1423639565', [9], '召唤生物获得 +9(6-10)% 元素抗性'],
    ['explicit.stat_3375935924', [5], '召唤生物的攻击速度加快 5(4-6)%'],
    ['explicit.stat_4000101551', [6], '召唤生物的施法速度加快 6(4-6)%']
  ])
  assert.equal(searches[0].query.type, 'Ghastly Eye Jewel')
  assert.equal(searches[0].query.filters.type_filters.filters.category.option, 'jewel.abyss')
  assert.equal(searches[0].query.stats.flatMap(group => group.filters).length, 5)

  const traditional = ghastlyEyeJewelText
    .replace('物品类别: 深渊珠宝', '物品種類: 深淵珠寶')
    .replace('苍白之凝珠宝', '極懼之眼珠寶')
    .replace('\n深渊\n', '\n深淵\n')
  const twCheck = fixture()
  const twResult = await twCheck.service.check({ text: traditional, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(twResult.model.identity.type, 'Ghastly Eye Jewel')
  assert.deepEqual(JSON.parse(JSON.stringify(twCheck.searches[0])), JSON.parse(JSON.stringify(searches[0])))

  const untrusted = entries.map(entry => entry.id === 'ItemDisplayAbyssalJewel' ? { ...entry, sourceHash: '0'.repeat(64) } : entry)
  await assert.rejects(fixture(bundled, untrusted).service.check({ text: ghastlyEyeJewelText, league: 'Covens' }), { code: 'LOCALIZATION_UNRESOLVED' })
  await assert.rejects(fixture().service.check({
    text: ghastlyEyeJewelText.replace('物品类别: 深渊珠宝', '物品类别: 珠宝'),
    league: 'Covens'
  }), { code: 'LOCALIZATION_AMBIGUOUS' })
})

test('二次腐化安赛娜丝的安抚之语通过传奇身份消歧丝绸手套底材并保留腐化状态与八条词缀', async () => {
  for (const state of ['二次腐化', '二次汙染', 'Twice Corrupted']) {
    const { service, searches } = fixture()
    const text = asenathGentleTouchText.replace(/二次腐化$/, state)
    const { model } = await service.check({ text, league: 'Covens', options: { initialSelection: 'all' } })
    assert.equal(model.identity.name, "Asenath's Gentle Touch")
    assert.equal(model.identity.type, 'Silk Gloves')
    assert.equal(model.facts.corrupted, true, state)
    assert.equal(model.stateFilters.corrupted, 'true', state)
    assert.deepEqual(model.unknownStats, [])
    assert.deepEqual(model.stats.map(stat => [stat.id, stat.values]), [
      ['implicit.stat_2028847114', []],
      ['implicit.stat_3433724931', []],
      ['explicit.stat_328541901', [23]],
      ['explicit.stat_1050105434', [61]],
      ['explicit.stat_3299347043', [66]],
      ['explicit.stat_3433724931', []],
      ['explicit.stat_847744351', []],
      ['explicit.stat_1509756274', [3]]
    ])
    assert.equal(searches[0].query.name, "Asenath's Gentle Touch")
    assert.equal(searches[0].query.type, 'Silk Gloves')
    assert.equal(searches[0].query.filters.misc_filters.filters.corrupted.option, 'true', state)
  }

  const blackZenith = `物品类别: 手套\n稀 有 度: 传奇\n漆黑天顶\n丝绸手套\n--------\n物品等级: 80`
  assert.equal(fixture().service.parse(blackZenith).identity.type, 'Fingerless Silk Gloves')

  const rareAmbiguousBase = `物品类别: 手套\n稀 有 度: 稀有\n风暴之握\n丝绸手套\n--------\n物品等级: 80`
  await assert.rejects(fixture().service.check({ text: rareAmbiguousBase, league: 'Covens' }), { code: 'LOCALIZATION_AMBIGUOUS' })
})

test('武器重复类别、多段元素伤害增幅、宝石与珠宝需求标注、珠宝范围限制及魔符阶级均正确解析', async () => {
  const { service } = fixture()
  for (const [cls, base, expectedType] of [
    ['细剑', '锈刺剑', 'Rusted Spike'],
    ['細劍', '鏽刺劍', 'Rusted Spike'],
    ['短杖', '朽木短杖', 'Driftwood Sceptre'],
    ['符紋匕首', '妖魔短匕', 'Fiend Dagger'],
    ['征戰長杖', '鐵鍛長杖', 'Iron Staff'],
    ['鱼竿', '鱼竿', 'Fishing Rod'],
    ['魚竿', '魚竿', 'Fishing Rod']
  ]) {
    const text = `物品类别: ${cls}\n稀 有 度: 普通\n${base}\n--------\n${cls}\n物理伤害: 10-20 (增幅)\n火焰，冰霜，闪电伤害: 15-30 (增幅), 20-40 (增幅)\n攻击暴击率: 5.00%\n每秒攻击次数: 1.50\n--------\n需求:\n等级: 70 (宝石)\n力量: 155（寶石）\n智慧: 100 (珠宝)\n敏捷: 90（珠寶）\n--------\n物品等级: 80`
    const model = service.parse(text)
    assert.equal(model.identity.type, expectedType, cls)
    assert.equal(model.properties.find(p => p.id === 'weapon.edps')?.value, 78.75, cls)
  }

  for (const [limitLine, radiusLine] of [
    ['限制: 1', '范围: 极大'],
    ['上限: 1', '範圍: 非常大'],
    ['限制: 1', '范围: 变量'],
    ['上限: 1', '範圍: 可變的']
  ]) {
    const jewel = `物品类别: 珠宝\n稀 有 度: 传奇\n希望之线\n赤红珠宝\n--------\n${limitLine}\n${radiusLine}\n--------\n物品等级: 85`
    const model = service.parse(jewel)
    assert.equal(model.identity.name, 'Thread of Hope')
    assert.equal(model.identity.type, 'Crimson Jewel')
    assert.deepEqual(model.unknownStats, [])
  }

  for (const tierLine of ['魔符阶级: 1', '魔符階級：1', '魔符等级: 1']) {
    const talisman = `物品类别: 项链\n稀 有 度: 稀有\n风暴之符\n黑牙魔符\n--------\n${tierLine}\n--------\n物品等级: 80`
    assert.equal(service.parse(talisman).identity.type, 'Black Maw Talisman', tierLine)
  }
})

test('国际服分裂、破裂之物、烫金传奇、先祖秘藏日志、赏金猎人装备、菌潮地图及退化传奇均正确解析', async () => {
  const { service } = fixture()

  for (const [marker, key] of [['分裂', 'split'], ['分化', 'split'], ['分裂之物', 'fractured'], ['破裂之物', 'fractured']]) {
    const text = `物品类别: 戒指\n稀 有 度: 稀有\n风暴之环\n珊瑚戒指\n--------\n物品等级: 80\n--------\n${marker}`
    const model = service.parse(text)
    assert.equal(model.stateFilters[key], 'true', marker)
    assert.deepEqual(model.unknownStats, [], marker)
  }

  for (const foil of ['烫金传奇', '貼模傳奇', '烫金传奇(天蓝)', '貼模傳奇 (天藍)', 'Foil Unique (Voidborn)']) {
    const text = foil.startsWith('Foil')
      ? `Item Class: Jewels\nRarity: Unique\nThread of Hope\nCrimson Jewel\n--------\nItem Level: 80\n--------\n${foil}`
      : `物品类别: 珠宝\n稀 有 度: 传奇\n希望之线\n赤红珠宝\n--------\n物品等级: 80\n--------\n${foil}`
    const model = service.parse(text)
    assert.equal(model.identity.name, 'Thread of Hope', foil)
    assert.deepEqual(model.unknownStats, [], foil)
  }

  for (const [text, label] of [
    ['物品类别: 戒指\n稀 有 度: 稀有\n珊瑚戒指\n--------\n物品等级: 85\n--------\n未鉴定 (4 阶)', 'cn-rare'],
    ['物品種類: 戒指\n稀有度: 稀有\n珊瑚戒指\n--------\n物品等級: 85\n--------\n未鑑定 (4 階)', 'tw-rare'],
    ['Item Class: Rings\nRarity: Rare\nCoral Ring\n--------\nItem Level: 85\n--------\nUnidentified (Tier 4)', 'en-rare']
  ]) {
    const { service: checkService, searches } = fixture()
    const { model } = await checkService.check({ text, league: 'Covens' })
    assert.equal(model.identity.type, 'Coral Ring', label)
    assert.equal(model.item.unidentified, true, label)
    assert.equal(model.facts.identified, false, label)
    assert.equal(model.stateFilters.identified, 'false', label)
    assert.deepEqual(model.unknownStats, [], label)
    assert.equal(searches[0].query.filters.misc_filters.filters.identified.option, 'false', label)
  }

  for (const [text, label] of [
    ['物品类别: 珠宝\n稀 有 度: 传奇\n赤红珠宝\n--------\n物品等级: 85\n--------\n未鉴定 (3 阶)', 'cn-unique'],
    ['Item Class: Jewels\nRarity: Unique\nCrimson Jewel\n--------\nItem Level: 85\n--------\nUnidentified (Tier 3)', 'en-unique']
  ]) {
    const model = service.parse(text)
    assert.equal(model.item.unidentified, true, label)
    assert.equal(model.facts.identified, false, label)
    assert.equal(model.identityResolution?.required, true, label)
    assert.deepEqual(model.unknownStats, [], label)
  }

  const logbook = `物品类别: 先祖秘藏日志\n稀 有 度: 普通\n先祖秘藏日志\n--------\n区域等级: 83\n物品等级: 83\n--------\n森林废墟\n裂环祭司\n区域内怪物之印的数量提高 33(10-40)% (implicit)\n--------\n贫民窟\n裂环祭司\n区域内怪物之印的数量提高 30(10-40)% (implicit)`
  const logbookModel = service.parse(logbook)
  assert.equal(logbookModel.identity.type, 'Expedition Logbook')
  assert.equal(logbookModel.identity.category, 'logbook')
  assert.deepEqual(logbookModel.unknownStats, [])
  assert.ok(logbookModel.stats.some(s => s.id === 'implicit.stat_1915989164' && s.min === 63))
  assert.ok(logbookModel.stats.some(s => s.id === 'pseudo.pseudo_logbook_area_forest_ruins'))
  assert.ok(logbookModel.stats.some(s => s.id === 'pseudo.pseudo_logbook_area_sarn_slums'))
  assert.ok(logbookModel.stats.some(s => s.id === 'pseudo.pseudo_logbook_faction_druids'))

  const heistTool = `物品类别: 赏金猎人工具\n稀 有 度: 魔法\n基础易容工具\n--------\n该物品可以装备给：\n审讯师奈尔斯\n易容大师吉安娜\n--------\n需求:\n欺诈（等级2）\n--------\n物品等级: 60\n--------\n{ 基底属性 — 速度 }\n欺诈速度加快 6(4-6)%\n--------\n只能给赏金猎人同伴装备。`
  const heistModel = service.parse(heistTool, { initialSelection: 'all' })
  assert.equal(heistModel.identity.type, 'Basic Disguise Kit')
  assert.equal(heistModel.identity.category, 'heistequipment.heisttool')
  assert.deepEqual(heistModel.unknownStats, [])
  assert.ok(heistModel.stats.some(s => s.id === 'implicit.stat_2520458995' && s.values[0] === 6))

  const blightedMap = `物品类别: 地图\n稀 有 度: 普通\n菌潮 地图（13阶）\n--------\n## 地图区域: 堕影墓场\n## 物品等级: 81`
  const blightedModel = service.parse(blightedMap)
  assert.equal(blightedModel.identity.discriminator, 'blighted')
  assert.equal(blightedModel.identity.displayName, 'Blighted Map (Graveyard)')

  const vestigial = `物品类别: 头部\n稀 有 度: 传奇\n意志交锋\n退化黄金之面\n--------\n物品等级: 87`
  const vestigialModel = service.parse(vestigial)
  assert.equal(vestigialModel.identity.name, 'Willclash')
  assert.equal(vestigialModel.identityPrecision?.requiresConsent, true)
})

test('变形者外衣赋予20级精神失常及各类参数化技能、天赋、星团附魔与要塞守卫词缀均正确解析', async () => {
  const { service, searches } = fixture()
  const { model } = await service.check({ text: doppelgangerGuiseText, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(model.identity.name, 'Doppelgänger Guise')
  assert.equal(model.identity.type, 'Sadist Garb')
  assert.deepEqual(model.unknownStats, [])
  assert.deepEqual(model.stats.map(stat => [stat.id, stat.values, stat.displayText]), [
    ['explicit.effect_1306984944', [20], '赋予 20 级 精神失常 — 数值不可调整'],
    ['explicit.stat_2692289207', [42], '疯狂状态下，总暴击率总增 42(40-60)%'],
    ['explicit.stat_3797538318', [], '疯狂状态下，被你的击中击败的敌人会被毁灭'],
    ['explicit.stat_388639924', [-39], '理智状态下，受到的物理和混沌伤害总降 39(40-30)%'],
    ['explicit.stat_2504632495', [10], '理智状态下，被击中时在一秒内再生 10% 生命']
  ])
  assert.equal(searches[0].query.name, 'Doppelgänger Guise')
  assert.equal(searches[0].query.type, 'Sadist Garb')
  assert.equal(searches[0].query.stats.flatMap(group => group.filters).length, 5)

  for (const [text, expectedId] of [
    ['物品类别: 戒指\n稀 有 度: 稀有\n风暴之环\n珊瑚戒指\n--------\n物品等级: 80\n--------\n{ 前缀属性 }\n赋予 召唤冰雷先驱者', 'explicit.effect_668260863'],
    ['物品类别: 护身符\n稀 有 度: 传奇\n龙牙之翔【仿品】\n黑曜护身符\n--------\n物品等级: 80\n--------\n{ 传奇属性 }\n所有 魔卫复苏 宝石等级 +3', 'explicit.indexable_skill_16'],
    ['物品类别: 护身符\n稀 有 度: 稀有\n风暴之坠\n玛瑙护身符\n--------\n物品等级: 80\n--------\n{ 附魔基底属性 }\n配置 魅力', 'enchant.stat_2954116742|6799'],
    ['物品类别: 珠宝\n稀 有 度: 传奇\n禁断之火\n赤红珠宝\n--------\n物品等级: 85\n--------\n{ 传奇属性 }\n禁断之肉上有匹配的词缀则配置 暴徒', 'explicit.stat_1190333629|4194'],
    ['物品类别: 珠宝\n稀 有 度: 传奇\n禁断之肉\n钴蓝珠宝\n--------\n物品等级: 85\n--------\n{ 传奇属性 }\n禁断之火上有匹配的词缀则配置 暴徒', 'explicit.stat_2460506030|4194'],
    ['物品类别: 珠宝\n稀 有 度: 传奇\n无所遁形\n翠绿珠宝\n--------\n物品等级: 85\n--------\n{ 传奇属性 }\n异能魔力范围内的核心天赋技能可以在\n未连结至天赋树的情况下配置\n通途', 'explicit.stat_2422708892|56075'],
    ['物品类别: 珠宝\n稀 有 度: 传奇\n希望之线\n赤红珠宝\n--------\n限制: 1\n范围: 变量\n--------\n物品等级: 85\n--------\n{ 传奇属性 }\nOnly affects Passives in 巨大 Ring', 'explicit.stat_3642528642|5'],
    ['物品类别: 星团珠宝\n稀 有 度: 稀有\n风暴之石\n大型星团珠宝\n--------\n物品等级: 84\n--------\n{ 附魔基底属性 }\n增加 8 个天赋技能\n{ 附魔基底属性 }\n其中 2 个增加的天赋为珠宝槽\n{ 附魔基底属性 }\n增加的小天赋获得：攻击伤害提高 10%\n--------\n{ 前缀属性 }\n其中 1 个增加的天赋为以攻为守', 'enchant.stat_3948993189|9'],
    ['物品类别: 地图\n稀 有 度: 普通\n地图（16阶）\n--------\n## 地图区域: 巨坑\n--------\n物品等级: 83\n--------\n{ 基底属性 }\n地图中包含 阿尔赫兹敏要塞\n{ 基底属性 }\nMap is occupied by 裂界守卫：净世', 'implicit.stat_2563183002|3']
  ]) {
    const parsed = service.parse(text)
    assert.deepEqual(parsed.unknownStats, [], expectedId)
    assert.ok(parsed.stats.some(s => s.id === expectedId), expectedId)
  }
})
})()

// === Merged from manualPriceCheck.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const readFile = _m5_readFile
  const PriceCheckService = _m5_PriceCheckService
  const loadTradeCatalog = _m5_loadTradeCatalog
  const vm = _m5_vm
test('手动模式可查询和分页，但直接调用游戏捕获仍在服务层拒绝', async () => {
  const { catalog } = await loadTradeCatalog()
  let captured = false
  const client = { clearCache() {}, search: async () => ({ id: 'fixture', total: 0, result: [] }), fetch: async () => ({ result: [] }) }
  const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) }, client, catalog, manualInputOnly: true, captureClipboard: async () => { captured = true; return '' } })
  // 使用已有目录中的中文普通物品验证共用业务，英文目录匹配在 serverTradeCatalog 测试覆盖。
  const result = await service.check({ league: 'Standard', text: '物品类别: 戒指\n稀有度: 普通\n珊瑚戒指\n--------\n物品等级: 80' })
  assert.equal(result.result.total, 0)
  await assert.rejects(service.captureAndCheck({}), error => error.code === 'SERVER_FEATURE_UNAVAILABLE')
  assert.equal(captured, false)
})

test('国际服手动页面复用固定 API，模板没有游戏捕获或自动输入入口', async () => {
  const source = await readFile(new URL('../src/domains/priceCheck/ManualPriceCheckPanel.vue', import.meta.url), 'utf8')
  assert.match(source, /priceCheck.checkText/)
  assert.match(source, /priceCheck.loadMore/)
  assert.match(source, /clipboard.writeText/)
  assert.doesNotMatch(source, /captureAndCheck|capturePriceCheckItem|executePython|sendCopy/)
})

test('切换账号或赛季后丢弃手动查询迟到结果，不覆盖新查询的忙碌状态和结果', async () => {
  const source = await readFile(new URL('../src/domains/priceCheck/ManualPriceCheckPanel.vue', import.meta.url), 'utf8')
  const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  const pending = []
  const watchers = []
  const api = { priceCheck: { checkText: () => new Promise(resolve => pending.push(resolve)), closeOverlay: async () => ({ success: true }) } }
  const context = vm.createContext({ ref: value => ({ value }), watch: (_source, callback) => watchers.push(callback), onMounted() {}, onBeforeUnmount() {},
    usePoeAccountStore: () => ({ status: { authenticated: true }, settings: { league: 'Standard' } }), electronApi: api, ElMessage: {} })
  vm.runInContext(`${script}\nglobalThis.ui = { search, result, busy }`, context)
  const first = context.ui.search()
  watchers[0]()
  const second = context.ui.search()
  pending[0]({ success: true, data: { marker: 'old-account' } })
  await first
  assert.equal(context.ui.busy.value, true)
  assert.equal(context.ui.result.value, null)
  pending[1]({ success: true, data: { marker: 'current-account' } })
  await second
  assert.equal(context.ui.result.value.marker, 'current-account')
  assert.equal(context.ui.busy.value, false)
})

test('国际服刷新成功使旧查询失效，失败保留已有目录和结果', async () => {
  const { catalog, status } = await loadTradeCatalog()
  const client = { server: { id: 'international' }, clearCache() {} }
  let fail = false
  const service = new PriceCheckService({ auth: {}, client, catalog, catalogStatus: status,
    catalogRefresher: async () => { if (fail) throw Error('offline'); return { catalog: structuredClone(catalog), status } } })
  const oldResult = { result: { queryId: 'old' } }
  service.latest = oldResult
  service.controller = new AbortController()
  const controller = service.controller
  await service.refreshCatalog()
  assert.equal(service.latest, null)
  assert.equal(controller.signal.aborted, true)
  service.latest = oldResult
  const currentCatalog = service.catalog
  fail = true
  await assert.rejects(service.refreshCatalog(), /offline/)
  assert.equal(service.catalog, currentCatalog)
  assert.equal(service.latest, oldResult)
  assert.equal(service.catalogStatus.loading, false)
})

test('国际服分页遇到赛季切换时不污染新查询，失败后仍可重试同一页', async () => {
  let resolveFetch
  let rejectFetch
  const client = { clearCache() {}, fetch: () => new Promise((resolve, reject) => { resolveFetch = resolve; rejectFetch = reject }) }
  const service = new PriceCheckService({ auth: { getStatus: () => ({}) }, client, catalog: { currencyLabels: {} }, manualInputOnly: true })
  const first = { result: { queryId: 'old' }, rawEntries: [], remainingResultIds: ['a', 'b'] }
  service.latest = first
  const pending = service.loadMore()
  service.clear()
  const next = { result: { queryId: 'new' }, rawEntries: [], remainingResultIds: ['c'] }
  service.latest = next
  resolveFetch({ result: [{ id: 'old-result' }] })
  await assert.rejects(pending, error => error.name === 'AbortError')
  assert.equal(service.latest, next)
  assert.deepEqual(next.rawEntries, [])
  const retry = service.loadMore()
  rejectFetch(Error('rate limited'))
  await assert.rejects(retry, /rate limited/)
  assert.deepEqual(next.remainingResultIds, ['c'])
})

test('手动页面目录替换后清除旧结果并丢弃迟到查询，刷新失败同步降级状态', async () => {
  const source = await readFile(new URL('../src/domains/priceCheck/ManualPriceCheckPanel.vue', import.meta.url), 'utf8')
  const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  let completeQuery
  const updated = { generatedAt: 'new', loading: false, warning: '' }
  let current = updated
  const api = { priceCheck: {
    checkText: () => new Promise(resolve => { completeQuery = resolve }),
    retryCatalog: async () => ({ success: false, error: { message: 'offline' } }),
    getStatus: async () => ({ success: true, data: { catalog: current } })
  } }
  const context = vm.createContext({ ref: value => ({ value }), watch() {}, onMounted() {}, onBeforeUnmount() {},
    usePoeAccountStore: () => ({ settings: { league: 'Covens' } }), electronApi: api, ElMessage: {} })
  vm.runInContext(`${script}\nglobalThis.ui = { search, refreshCatalog, readStatus, catalog, result, busy, error }`, context)
  const ui = context.ui
  ui.catalog.value = { generatedAt: 'old' }
  ui.result.value = { marker: 'old' }
  const query = ui.search()
  await ui.readStatus()
  assert.equal(ui.result.value, null)
  assert.equal(ui.busy.value, false)
  completeQuery({ success: true, data: { marker: 'late' } })
  await query
  assert.equal(ui.result.value, null)
  ui.result.value = { marker: 'usable' }
  current = { ...updated, degraded: true, warning: '继续使用当前目录' }
  await ui.refreshCatalog()
  assert.equal(ui.result.value.marker, 'usable')
  assert.equal(ui.catalog.value.warning, '继续使用当前目录')
  assert.equal(ui.error.value, 'offline')
})

test('较早的状态响应不能覆盖刷新后的目录或取消新查询', async () => {
  const source = await readFile(new URL('../src/domains/priceCheck/ManualPriceCheckPanel.vue', import.meta.url), 'utf8')
  const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  let completeStatus
  let completeQuery
  const api = { priceCheck: {
    getStatus: () => new Promise(resolve => { completeStatus = resolve }),
    retryCatalog: async () => ({ success: true, data: { generatedAt: 'new' } }),
    checkText: () => new Promise(resolve => { completeQuery = resolve })
  } }
  const context = vm.createContext({ ref: value => ({ value }), watch() {}, onMounted() {}, onBeforeUnmount() {},
    usePoeAccountStore: () => ({ settings: { league: 'Covens' } }), electronApi: api, ElMessage: {} })
  vm.runInContext(`${script}\nglobalThis.ui = { search, readStatus, refreshCatalog, catalog, result, busy }`, context)
  const ui = context.ui
  ui.catalog.value = { generatedAt: 'old' }
  const oldStatus = ui.readStatus()
  await ui.refreshCatalog()
  const query = ui.search()
  completeStatus({ success: true, data: { catalog: { generatedAt: 'old' } } })
  await oldStatus
  assert.equal(ui.catalog.value.generatedAt, 'new')
  assert.equal(ui.busy.value, true)
  completeQuery({ success: true, data: { marker: 'current-query' } })
  await query
  assert.equal(ui.result.value.marker, 'current-query')
})

async function identityPage(api) {
  const source = await readFile(new URL('../src/domains/priceCheck/ManualPriceCheckPanel.vue', import.meta.url), 'utf8')
  const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  const watchers = []
  const disposers = []
  const account = { status: { authenticated: true, accountName: 'fixture-account' }, settings: { league: 'Standard' } }
  const context = vm.createContext({ ref: value => ({ value }), watch: (_source, callback) => watchers.push(callback), onMounted() {}, onBeforeUnmount: callback => disposers.push(callback),
    usePoeAccountStore: () => account, electronApi: api, ElMessage: {} })
  vm.runInContext(`${script}\nglobalThis.ui = { search, resolveIdentity, applyCatalog, text, catalog, result, busy, error }`, context)
  return { source, ui: context.ui, invalidate: () => watchers[0](), dispose: () => disposers[0]() }
}

test('手动页面选择未鉴定皮革腰带候选后查询该名称，并显示真实服务归一化的挂单', async () => {
  const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
  const queries = []
  const client = { server: { id: 'international' }, clearCache() {},
    search: async (league, query) => { queries.push({ league, query }); return { id: 'fixture-query', total: 1, result: ['listing'] } },
    fetch: async () => ({ result: [{ id: 'listing', listing: { account: { name: 'seller', online: { league: 'Standard' } }, price: { amount: 10, currency: 'chaos' }, whisper: 'fixture whisper' }, item: { name: 'Headhunter', typeLine: 'Leather Belt' } }] }) }
  const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) }, client, catalog, manualInputOnly: true })
  const ok = operation => Promise.resolve(operation).then(data => ({ success: true, data }))
  const api = { priceCheck: { checkText: input => ok(service.check(input)), resolveIdentity: key => ok(service.resolveIdentity(key)),
    rerun: input => ok(service.rerun(input)), closeOverlay: async () => ({ success: true }) } }
  const { source, ui } = await identityPage(api)
  assert.match(source, /v-for="candidate in result\.model\.identityResolution\.candidates"/)
  assert.match(source, /@click="resolveIdentity\(candidate\.key\)"/)
  ui.text.value = 'Item Class: Belts\nRarity: Unique\nLeather Belt\n--------\nItem Level: 80\n--------\nUnidentified'
  await ui.search()
  assert.equal(queries.length, 0)
  assert.equal(ui.result.value.model.identityResolution.required, true)
  assert.ok(ui.result.value.model.identityResolution.candidates.length > 1)
  const candidate = ui.result.value.model.identityResolution.candidates.find(entry => entry.name === 'Headhunter')
  await ui.resolveIdentity(candidate.key)
  assert.equal(queries.length, 1)
  assert.equal(queries[0].league, 'Standard')
  assert.equal(queries[0].query.query.name, 'Headhunter')
  assert.equal(queries[0].query.query.type, 'Leather Belt')
  assert.equal(ui.result.value.result.queryId, 'fixture-query')
  assert.equal(ui.result.value.result.listings[0].amount, 10)
  assert.equal(ui.result.value.result.listings[0].whisper, 'fixture whisper')
})

for (const failureStage of ['search', 'fetch', 'deferred-search']) {
  test(`名称选择在 ${failureStage} 失败后保留模型，可直接再次选择并查询`, async () => {
    const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
    let failed = false
    let selections = 0
    let parses = 0
    const queries = []
    const client = { server: { id: 'international' }, clearCache() {},
      search: async (_league, query) => {
        queries.push(query)
        if (!failed && failureStage !== 'fetch') { failed = true; throw Object.assign(Error('暂时限流'), { code: 'RATE_LIMITED' }) }
        return { id: 'retry-query', total: 1, result: ['listing'] }
      },
      fetch: async () => {
        if (!failed) { failed = true; throw Object.assign(Error('暂时断网'), { code: 'NETWORK_ERROR' }) }
        return { result: [] }
      }
    }
    const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) }, client, catalog, manualInputOnly: true })
    const respond = async action => {
      try { return { success: true, data: await action() } }
      catch (error) { return { success: false, error: { code: error.code, message: error.message } } }
    }
    const api = { priceCheck: {
      checkText: input => { parses++; return respond(() => service.check({ ...input, queryImmediately: failureStage !== 'deferred-search' })) },
      resolveIdentity: key => { selections++; return respond(() => service.resolveIdentity(key)) },
      rerun: input => respond(() => service.rerun(input))
    } }
    const { ui } = await identityPage(api)
    ui.text.value = 'Item Class: Belts\nRarity: Unique\nLeather Belt\n--------\nItem Level: 80\n--------\nUnidentified'
    await ui.search()
    const candidate = ui.result.value.model.identityResolution.candidates.find(entry => entry.name === 'Headhunter')
    await ui.resolveIdentity(candidate.key)
    assert.match(ui.error.value, /暂时/)
    assert.equal(ui.busy.value, false)
    assert.equal(service.latest?.model.identity.name, 'Headhunter')
    assert.equal(service.latest.result, null)
    await ui.resolveIdentity(candidate.key)
    assert.equal(selections, 2)
    assert.equal(parses, 1, '重试无需重新粘贴或重新解析物品')
    assert.equal(queries.length, 2)
    assert.ok(queries.every(query => query.query.name === 'Headhunter' && query.query.type === 'Leather Belt'))
    assert.equal(ui.error.value, '')
    assert.equal(ui.result.value.result.queryId, 'retry-query')
  })
}

test('旧查询迟到失败或已取消时不得恢复旧的可重试模型', async () => {
  for (const change of ['clear', 'new-query', 'close']) {
    const { catalog } = await loadTradeCatalog()
    let rejectSearch
    let searches = 0
    const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) }, manualInputOnly: true, catalog,
      client: { clearCache() {}, search: () => ++searches === 1 ? new Promise((_resolve, reject) => { rejectSearch = reject }) : Promise.resolve({ id: 'current', total: 0, result: [] }) } })
    const request = { league: 'Standard', text: '物品类别: 戒指\n稀有度: 普通\n珊瑚戒指\n--------\n物品等级: 80' }
    const old = service.check(request)
    if (change === 'clear') service.clear()
    else if (change === 'new-query') await service.check({ ...request, league: 'NewLeague' })
    else service.closeOverlay()
    const current = service.latest
    rejectSearch(Object.assign(Error('迟到的断网错误'), { code: 'NETWORK_ERROR' }))
    await assert.rejects(old, /断网/)
    assert.equal(service.latest, current, change)
  }
})

test('延迟查询模式选择名称后继续执行查询，重复点击不重复请求', async () => {
  let finishSelection
  let selections = 0
  const reruns = []
  const api = { priceCheck: {
    resolveIdentity: () => { selections++; return new Promise(resolve => { finishSelection = resolve }) },
    rerun: async request => { reruns.push(request); return { success: true, data: { result: { queryId: 'resolved' } } } }
  } }
  const { ui } = await identityPage(api)
  ui.result.value = { model: { identityResolution: { required: true } } }
  const first = ui.resolveIdentity('selected')
  await ui.resolveIdentity('selected')
  assert.equal(selections, 1)
  assert.equal(ui.busy.value, true)
  finishSelection({ success: true, data: { league: 'Standard', options: { initialSelection: 'none' }, model: { identityResolution: { required: false } }, result: null } })
  await first
  assert.equal(reruns.length, 1)
  assert.equal(reruns[0].league, 'Standard')
  assert.equal(reruns[0].options.initialSelection, 'none')
  assert.equal(ui.result.value.result.queryId, 'resolved')
  assert.equal(ui.busy.value, false)
})

test('名称选择迟到时不覆盖新状态，也不会为旧文本或目录继续发起查询', async () => {
  for (const change of ['input', 'catalog', 'unmount']) {
    let finishSelection
    let reruns = 0
    const api = { priceCheck: { resolveIdentity: () => new Promise(resolve => { finishSelection = resolve }),
      rerun: async () => { reruns++; return { success: true, data: {} } }, closeOverlay: async () => ({ success: true }) } }
    const { ui, invalidate, dispose } = await identityPage(api)
    ui.catalog.value = { generatedAt: 'old' }
    ui.result.value = { model: { identityResolution: { required: true } } }
    const pending = ui.resolveIdentity('selected')
    if (change === 'input') invalidate()
    else if (change === 'catalog') ui.applyCatalog({ generatedAt: 'new' })
    else dispose()
    const current = { marker: 'current' }
    ui.result.value = current
    finishSelection({ success: true, data: { model: { identityResolution: { required: false } }, result: null } })
    await pending
    assert.equal(ui.result.value, current, change)
    assert.equal(reruns, 0, change)
  }
})

test('切赛季后发起新查询，迟到的名称选择挂单不覆盖结果或清除忙碌状态', async () => {
  let finishSelection
  let finishQuery
  const api = { priceCheck: { resolveIdentity: () => new Promise(resolve => { finishSelection = resolve }),
    checkText: () => new Promise(resolve => { finishQuery = resolve }), closeOverlay: async () => ({ success: true }) } }
  const { ui, invalidate } = await identityPage(api)
  ui.result.value = { model: { identityResolution: { required: true } } }
  const selection = ui.resolveIdentity('selected')
  invalidate()
  const query = ui.search()
  finishSelection({ success: true, data: { result: { queryId: 'old-league' } } })
  await selection
  assert.equal(ui.result.value, null)
  assert.equal(ui.busy.value, true)
  finishQuery({ success: true, data: { result: { queryId: 'new-league' } } })
  await query
  assert.equal(ui.result.value.result.queryId, 'new-league')
  assert.equal(ui.busy.value, false)
})
})()

// === Merged from mapChartPriceCheck.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const parseItemInfo = _m6_parseItemInfo
  const enrichTradeCatalogChartRegions = _m6_enrichTradeCatalogChartRegions
  const loadTradeCatalog = _m6_loadTradeCatalog
  const resolveChartRegion = _m6_resolveChartRegion
  const validateTradeCatalog = _m6_validateTradeCatalog
  const CHART_REGION_ALIASES = _m6_CHART_REGION_ALIASES
  const CHART_SHAPES = _m6_CHART_SHAPES
  const enrichOfficialItemsWithImages = _m6_enrichOfficialItemsWithImages
  const loadUniqueItemCatalog = _m6_loadUniqueItemCatalog
  const buildOfficialTradeQuery = _m6_buildOfficialTradeQuery
  const createPriceCheckModel = _m6_createPriceCheckModel
  const refreshPseudoStats = _m6_refreshPseudoStats
  const sanitizePriceCheckModel = _m6_sanitizePriceCheckModel
  const CHART_FORMAT_EXAMPLES = _m6_CHART_FORMAT_EXAMPLES
  const CHART_SHAPE_PRICE_CHECK_FIXTURES = _m6_CHART_SHAPE_PRICE_CHECK_FIXTURES
  const MAP_PRICE_CHECK_FIXTURES = _m6_MAP_PRICE_CHECK_FIXTURES
const catalogPromise = loadTradeCatalog().then(({ catalog }) => catalog)
const enrichedCatalogPromise = Promise.all([loadTradeCatalog(), loadUniqueItemCatalog()]).then(([
  { catalog },
  { catalog: uniqueCatalog }
]) => ({
  ...catalog,
  items: enrichOfficialItemsWithImages(catalog.items, uniqueCatalog)
}))

test('便签和真实反馈中的地图格式统一按判别身份、精确阶级和状态查询', async () => {
  const catalog = await catalogPromise
  for (const fixture of MAP_PRICE_CHECK_FIXTURES) {
    const item = parseItemInfo(fixture.text)
    const model = createPriceCheckModel(item, catalog)
    const query = buildOfficialTradeQuery(model).query
    assert.equal(item.baseName, '地图', fixture.id)
    assert.deepEqual(query.type, { discriminator: 'map', option: '地图' }, fixture.id)
    assert.equal(query.filters.type_filters.filters.category.option, 'map', fixture.id)
    assert.deepEqual(query.filters.map_filters.filters.map_tier, { min: item.mapTier, max: item.mapTier }, fixture.id)
    const miscFilters = query.filters.misc_filters?.filters || {}
    assert.equal(miscFilters.identified?.option, item.isUnidentified ? 'false' : undefined, fixture.id)
    assert.equal(miscFilters.corrupted?.option, item.isCorrupted ? 'true' : undefined, fixture.id)
    if (item.rarity === '稀有') assert.equal(query.name, undefined, fixture.id)
  }
  const unidentifiedUnique = createPriceCheckModel(parseItemInfo(MAP_PRICE_CHECK_FIXTURES.find(({ id }) => id === 'unidentified-unique').text), catalog)
  assert.equal(unidentifiedUnique.identityResolution.required, false)
  assert.equal(buildOfficialTradeQuery(unidentifiedUnique).query.filters.type_filters.filters.rarity.option, 'unique')
  const identifiedUnique = buildOfficialTradeQuery(createPriceCheckModel(parseItemInfo(MAP_PRICE_CHECK_FIXTURES.find(({ id }) => id === 'identified-unique').text), catalog)).query
  assert.deepEqual(identifiedUnique.name, { discriminator: 'map', option: '亡者之财' })
})

test('地图默认只勾选阶级和可识别特殊基底，奖励可选查价', async () => {
  const catalog = await catalogPromise
  const fixture = MAP_PRICE_CHECK_FIXTURES.find(({ id }) => id === 'originator-memory')
  const model = createPriceCheckModel(parseItemInfo(fixture.text), catalog)
  assert.deepEqual(model.properties.filter(({ enabled }) => enabled).map(({ id }) => id), ['map.tier'])
  assert.ok(model.stats.some(({ enabled, type }) => enabled && type === 'implicit'))
  assert.ok(model.stats.every(({ enabled, type }) => !enabled || type === 'implicit'))
  assert.deepEqual(model.information, [])
  assert.equal(model.stats.find(({ id }) => id === 'pseudo.pseudo_map_more_map_drops').min, 75)
  assert.equal(JSON.stringify(buildOfficialTradeQuery(model)).includes('moreMaps'), false)
})

test('地图奖励支持独立及组合范围查询，清理和刷新保留选择', async () => {
  const catalog = await catalogPromise
  const rewards = [
    ['更多地图', 'pseudo.pseudo_map_more_map_drops', 105],
    ['更多圣甲虫', 'pseudo.pseudo_map_more_scarab_drops', 70],
    ['更多通货', 'pseudo.pseudo_map_more_currency_drops', 45]
  ]
  for (const selected of [[], ...rewards.map((reward) => [reward]), rewards]) {
    const text = `物品类别: 地图\n稀 有 度: 稀有\n幽暗雕刻\n地图（16阶）\n-------\n${selected.map(([label, , value]) => `${label}: +${value}% (augmented)`).join('\n')}\n-------\n物品等级: 84`
    const model = createPriceCheckModel(parseItemInfo(text), catalog)
    const rewardStats = model.stats.filter(({ id }) => rewards.some(([, expected]) => id === expected))
    assert.equal(rewardStats.length, selected.length)
    assert.deepEqual(model.information, [])
    assert.ok(rewardStats.every((stat) => !stat.enabled && stat.max === undefined))
    assert.ok(!JSON.stringify(buildOfficialTradeQuery(model)).includes('pseudo_map_more_'))
    for (const stat of rewardStats) { stat.enabled = true; stat.max = stat.min + 20 }
    const clean = sanitizePriceCheckModel(model, catalog, model.facts, model.item.category, model)
    refreshPseudoStats(clean, catalog)
    refreshPseudoStats(clean, catalog)
    const filters = buildOfficialTradeQuery(clean).query.stats.flatMap((group) => group.filters)
    for (const [, id, value] of selected) {
      assert.equal(clean.stats.filter((stat) => stat.id === id).length, 1)
      assert.deepEqual(filters.find((stat) => stat.id === id).value, { min: value, max: value + 20, option: undefined })
    }
    clean.stats.forEach((stat) => { stat.enabled = false })
    assert.ok(!JSON.stringify(buildOfficialTradeQuery(clean)).includes('pseudo_map_more_'))
  }
})

test('奖励目录缺失时回退只读信息', async () => {
  const catalog = await catalogPromise
  const withoutRewards = { ...catalog, stats: catalog.stats.filter((entry) => !String(entry.ids?.pseudo).includes('pseudo_map_more_')) }
  const fixture = MAP_PRICE_CHECK_FIXTURES.find(({ id }) => id === 'originator-memory')
  const model = createPriceCheckModel(parseItemInfo(fixture.text), withoutRewards)
  assert.deepEqual(model.information, [{ id: 'moreMaps', label: '更多地图', value: 75, suffix: '%' }])
  assert.ok(!model.stats.some(({ id }) => id.includes('pseudo_map_more_')))
})

test('完整 T16 反馈样本以更多地图 105 为最低值查询', async () => {
  const catalog = await catalogPromise
  const fixture = MAP_PRICE_CHECK_FIXTURES.find(({ id }) => id === 'originator-memory-more-maps-105')
  const model = createPriceCheckModel(parseItemInfo(fixture.text), catalog)
  const reward = model.stats.find(({ id }) => id === 'pseudo.pseudo_map_more_map_drops')
  assert.equal(reward.min, 105)
  assert.equal(reward.enabled, false)
  reward.enabled = true
  const query = buildOfficialTradeQuery(model).query
  assert.equal(query.filters.map_filters.filters.map_tier.min, 16)
  assert.equal(query.stats.flatMap((group) => group.filters).find(({ id }) => id === reward.id).value.min, 105)
  assert.ok(model.stats.some(({ type, enabled }) => type === 'implicit' && enabled))
})

test('传奇地图保留真实属性但不把说明文字加入搜索', async () => {
  const catalog = await enrichedCatalogPromise
  const fixture = MAP_PRICE_CHECK_FIXTURES.find(({ id }) => id === 'unique-description')
  const item = parseItemInfo(fixture.text)
  const model = createPriceCheckModel(item, catalog)
  const query = buildOfficialTradeQuery(model).query

  assert.equal(item.name, '禁闭祭坛')
  assert.equal(item.mapTier, 16)
  assert.deepEqual(model.stats.map(({ text }) => text), [
    '区域内有许多图腾 — 数值不可调整',
    '对怪物施放的诅咒效果降低 50%'
  ])
  assert.deepEqual(model.unknownStats, [])
  assert.deepEqual(query.name, { discriminator: 'map', option: '禁闭祭坛' })
  assert.deepEqual(query.type, { discriminator: 'map', option: '地图' })
  assert.deepEqual(query.filters.map_filters.filters.map_tier, { min: 16, max: 16 })
  assert.equal(JSON.stringify(query).includes('生命源于黑暗'), false)
})

test('三种海图样本解析区域、等级、硫磺、形状和状态', async () => {
  const catalog = await catalogPromise
  const expectedTypes = ['AbyssalPlain', 'UnderseaGroves', 'BrineKingsDomain']
  for (const [index, example] of CHART_FORMAT_EXAMPLES.entries()) {
    const item = parseItemInfo(example.text)
    const model = createPriceCheckModel(item, catalog)
    const query = buildOfficialTradeQuery(model).query
    assert.deepEqual(query.type, { discriminator: 'chart', option: expectedTypes[index] }, example.id)
    assert.equal(query.filters.type_filters.filters.category.option, 'chart', example.id)
    assert.deepEqual(query.filters.map_filters.filters.area_level, { min: item.areaLevel, max: item.areaLevel }, example.id)
    assert.deepEqual(query.filters.misc_filters.filters.ilvl, { min: item.level, max: item.level }, example.id)
    if (item.deadmanSulphur) assert.deepEqual(query.filters.map_filters.filters.chart_sulphur, { min: item.deadmanSulphur, max: item.deadmanSulphur })
    assert.equal(query.filters.map_filters.filters.chart_shape, undefined)
  }
})

test('传奇海图查询明确限制为 unique 稀有度', async () => {
  const catalog = await catalogPromise
  const model = createPriceCheckModel({
    category: '海图', rarity: '传奇', name: '航海 测试', baseName: '金沙海床海图',
    areaName: '深渊平原', areaLevel: 83, level: 83, modifiers: []
  }, catalog)
  const query = buildOfficialTradeQuery(model).query

  assert.equal(query.filters.type_filters.filters.category.option, 'chart')
  assert.equal(query.filters.type_filters.filters.rarity.option, 'unique')
})

test('海图完整区域别名和五种形状映射唯一且形状默认不勾选', async () => {
  const catalog = await catalogPromise
  const catalogWithCurrentRegions = structuredClone(catalog)
  for (const region of CHART_REGION_ALIASES) {
    if (catalogWithCurrentRegions.items.some((entry) => entry.baseType === region.type)) continue
    catalogWithCurrentRegions.items.push({
      key: `test-chart-${region.type}`,
      name: region.type,
      baseType: region.type,
      text: `Chart (${region.displayName})`,
      discriminator: 'chart',
      category: 'chart',
      unique: false
    })
  }
  const completeCatalog = enrichTradeCatalogChartRegions(catalogWithCurrentRegions)
  const expectedShapeLabels = [
    ['1', '端点', '结束'],
    ['2', '角落', '角落'],
    ['3', '直线', '直线'],
    ['4', '节点', '交汇'],
    ['5', '交叉', '岔路']
  ]
  assert.equal(CHART_REGION_ALIASES.length, 16)
  for (const region of CHART_REGION_ALIASES) {
    for (const alias of region.aliases) assert.equal(resolveChartRegion(completeCatalog, alias)?.type, region.type)
  }
  assert.equal(resolveChartRegion(completeCatalog, '海底山脊')?.type, 'SeafloorRidges')
  assert.equal(resolveChartRegion(completeCatalog, '平庸海床')?.type, 'UnremarkableSeabed')
  assert.deepEqual(CHART_SHAPES.map(({ id, gameLabel, tradeLabel }) => [id, gameLabel, tradeLabel]), expectedShapeLabels)
  for (const fixture of CHART_SHAPE_PRICE_CHECK_FIXTURES) {
    const parsed = parseItemInfo(fixture.text)
    assert.equal(parsed.chartShape, fixture.label)
    const model = createPriceCheckModel(parsed, catalog)
    const property = model.properties.find(({ id }) => id === 'map.shape')
    assert.equal(property.value, fixture.id, fixture.label)
    assert.equal(property.enabled, false, fixture.label)
    property.enabled = true
    assert.equal(buildOfficialTradeQuery(model).query.filters.map_filters.filters.chart_shape.option, fixture.id, fixture.label)
  }
  for (const shape of CHART_SHAPES) {
    for (const alias of shape.aliases) {
      const copiedText = `物品类别: 海图
稀 有 度: 稀有
航海 测试
金沙海床海图
--------
深渊平原
区域等级: 83
海图形状: ${alias}
--------
物品等级: 83`
      const parsed = parseItemInfo(copiedText)
      assert.equal(parsed.chartShape, alias)
      const aliasModel = createPriceCheckModel(parsed, catalog)
      assert.equal(aliasModel.properties.find(({ id }) => id === 'map.shape')?.value, shape.id, alias)
    }
    const model = createPriceCheckModel({
      category: '海图', rarity: '稀有', name: '航海 测试', baseName: '金沙海床海图',
      areaName: '深渊平原', areaLevel: 83, level: 83, chartShape: shape.label,
      modifiers: []
    }, catalog)
    const property = model.properties.find(({ id }) => id === 'map.shape')
    assert.equal(property.enabled, false)
    property.enabled = true
    assert.equal(buildOfficialTradeQuery(model).query.filters.map_filters.filters.chart_shape.option, shape.id)
  }
})

test('官方新增的未登记海图区域可从标准文本补全元数据', async () => {
  const catalog = structuredClone(await catalogPromise)
  catalog.items.push({
    key: 'official-item-future-chart',
    name: 'FutureSeabed',
    baseType: 'FutureSeabed',
    text: 'Chart (未来海床)',
    discriminator: 'chart',
    category: 'chart',
    unique: false
  })

  const enriched = enrichTradeCatalogChartRegions(catalog)
  assert.doesNotThrow(() => validateTradeCatalog(enriched))
  assert.deepEqual(resolveChartRegion(enriched, '未来海床'), {
    type: 'FutureSeabed',
    displayName: '未来海床',
    aliases: ['未来海床']
  })
})

test('无法解析区域名的未知海图条目仍被目录校验拒绝', async () => {
  const catalog = structuredClone(await catalogPromise)
  catalog.items.push({
    key: 'official-item-malformed-chart',
    name: 'MalformedSeabed',
    baseType: 'MalformedSeabed',
    text: 'Chart',
    discriminator: 'chart',
    category: 'chart',
    unique: false
  })

  const enriched = enrichTradeCatalogChartRegions(catalog)
  assert.throws(
    () => validateTradeCatalog(enriched),
    /交易目录海图区域 official-item-malformed-chart 元数据无效/
  )
})

test('无法识别海图区域时阻止退化为物理底材查询', async () => {
  const catalog = await catalogPromise
  assert.throws(() => createPriceCheckModel({
    category: '海图', rarity: '稀有', name: '航海 测试', baseName: '珊瑚暗礁海图',
    areaName: '不存在的区域', areaLevel: 83, level: 83, modifiers: []
  }, catalog), /无法识别海图区域.*阻止按物理底材误查/)
})

test('重跑清理保留选择范围但拒绝伪造海图身份、属性和值', async () => {
  const catalog = await catalogPromise
  const trusted = createPriceCheckModel({
    category: '海图', rarity: '稀有', name: '航海 测试', baseName: '金沙海床海图',
    areaName: '深渊平原', areaLevel: 83, level: 83, chartShape: '直线', modifiers: []
  }, catalog)
  const changed = structuredClone(trusted)
  changed.identity.type = '珊瑚暗礁海图'
  changed.properties.find(({ id }) => id === 'map.shape').value = '5'
  changed.properties.push({ id: 'map.fake', label: '伪造', value: 999, enabled: true })
  const clean = sanitizePriceCheckModel(changed, catalog, trusted.facts, trusted.item.category, trusted)
  assert.equal(clean.identity.type, 'AbyssalPlain')
  assert.equal(clean.identity.discriminator, 'chart')
  assert.equal(clean.properties.find(({ id }) => id === 'map.shape').value, '3')
  assert.equal(clean.properties.some(({ id }) => id === 'map.fake'), false)
  assert.doesNotThrow(() => validateTradeCatalog(catalog))
})

test('重跑清理从可信地图事实恢复 map 判别身份', async () => {
  const catalog = await catalogPromise
  const trusted = createPriceCheckModel(parseItemInfo(
    MAP_PRICE_CHECK_FIXTURES.find(({ id }) => id === 'unidentified-elder-guardian').text
  ), catalog)
  const changed = structuredClone(trusted)
  changed.identity.type = '地图（16阶）'
  changed.identity.discriminator = 'chart'
  const clean = sanitizePriceCheckModel(changed, catalog, trusted.facts, trusted.item.category, trusted)
  assert.equal(clean.identity.type, '地图')
  assert.equal(clean.identity.discriminator, 'map')
  assert.deepEqual(buildOfficialTradeQuery(clean).query.type, { discriminator: 'map', option: '地图' })
})

test('国服梦魇、瓦尔多、塑界守卫与瓦尔密殿地图保留独立底材且不附加 map 判别身份', async () => {
  const catalog = await catalogPromise
  const cases = [
    [
      '梦魇地图',
      `物品类别: 地图
稀 有 度: 稀有
梦魇地图
--------
物品等级: 85
--------
怪物等级: 83
--------
未鉴定
--------
在私人地图装置中使用该物品，前往该等阶或更低等阶的地图。只能被使用一次。
--------
僅能使用混沌石、瓦爾寶珠、譫妄玉和圖釘調整`
    ],
    [
      '瓦尔密殿地图',
      `物品类别: 地图
稀 有 度: 稀有
昏暗坚定
瓦尔密殿地图
--------
物品等级: 85
--------
怪物等级: 83
--------
已腐化`
    ],
    [
      '瓦尔多地图',
      `物品类别: 地图
稀 有 度: 稀有
巨岩 绝境
瓦尔多地图
--------
物品等级: 100
--------
怪物等级: 84
--------
不可改变`
    ],
    [
      '塑界守卫地图',
      `物品类别: 地图
稀 有 度: 稀有
塑界守卫地图
--------
物品等级: 85
--------
怪物等级: 83
--------
未鉴定`
    ]
  ]
  for (const [expectedBase, text] of cases) {
    const item = parseItemInfo(text)
    const model = createPriceCheckModel(item, catalog)
    assert.equal(model.identity.type, expectedBase, expectedBase)
    assert.equal(model.identity.discriminator, undefined, expectedBase)
    assert.deepEqual(model.unknownStats, [], expectedBase)
    const query = buildOfficialTradeQuery(model).query
    assert.equal(query.type, expectedBase, expectedBase)

    const tampered = structuredClone(model)
    tampered.identity.discriminator = 'map'
    const clean = sanitizePriceCheckModel(tampered, catalog, model.facts, model.item.category, model)
    assert.equal(clean.identity.type, expectedBase, expectedBase)
    assert.equal(clean.identity.discriminator, undefined, expectedBase)
    assert.equal(buildOfficialTradeQuery(clean).query.type, expectedBase, expectedBase)
  }
})
})()
