import test from 'node:test'
import assert from 'node:assert/strict'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import {
  loadTradeCatalog,
  resolveChartRegion,
  validateTradeCatalog
} from '../electron/modules/priceCheck/catalog.js'
import { CHART_REGION_ALIASES, CHART_SHAPES } from '../electron/modules/priceCheck/chartRegions.js'
import {
  enrichOfficialItemsWithImages,
  loadUniqueItemCatalog
} from '../electron/modules/priceCheck/uniqueItemSnapshot.js'
import {
  buildOfficialTradeQuery,
  createPriceCheckModel,
  sanitizePriceCheckModel
} from '../electron/modules/priceCheck/query.js'
import { CHART_FORMAT_GUIDANCE } from '../src/utils/supportedItemFormats.js'
import { CHART_SHAPE_PRICE_CHECK_FIXTURES, MAP_PRICE_CHECK_FIXTURES } from './fixtures/mapChartItems.js'

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
  const unidentifiedUnique = createPriceCheckModel(parseItemInfo(MAP_PRICE_CHECK_FIXTURES[0].text), catalog)
  assert.equal(unidentifiedUnique.identityResolution.required, false)
  assert.equal(buildOfficialTradeQuery(unidentifiedUnique).query.filters.type_filters.filters.rarity.option, 'unique')
  const identifiedUnique = buildOfficialTradeQuery(createPriceCheckModel(parseItemInfo(MAP_PRICE_CHECK_FIXTURES[1].text), catalog)).query
  assert.deepEqual(identifiedUnique.name, { discriminator: 'map', option: '亡者之财' })
})

test('地图默认只勾选阶级和可识别特殊基底，奖励字段仅展示', async () => {
  const catalog = await catalogPromise
  const fixture = MAP_PRICE_CHECK_FIXTURES.find(({ id }) => id === 'originator-memory')
  const model = createPriceCheckModel(parseItemInfo(fixture.text), catalog)
  assert.deepEqual(model.properties.filter(({ enabled }) => enabled).map(({ id }) => id), ['map.tier'])
  assert.ok(model.stats.some(({ enabled, type }) => enabled && type === 'implicit'))
  assert.ok(model.stats.every(({ enabled, type }) => !enabled || type === 'implicit'))
  assert.deepEqual(model.information, [{ id: 'moreMaps', label: '更多地图', value: 75, suffix: '%' }])
  assert.equal(JSON.stringify(buildOfficialTradeQuery(model)).includes('moreMaps'), false)
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
  for (const [index, example] of CHART_FORMAT_GUIDANCE.examples.entries()) {
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
  const expectedShapeLabels = [
    ['1', '端点', '结束'],
    ['2', '角落', '角落'],
    ['3', '直线', '直线'],
    ['4', '节点', '交汇'],
    ['5', '交叉', '岔路']
  ]
  assert.equal(CHART_REGION_ALIASES.length, 15)
  for (const region of CHART_REGION_ALIASES) {
    for (const alias of region.aliases) assert.equal(resolveChartRegion(catalog, alias)?.type, region.type)
  }
  assert.equal(resolveChartRegion(catalog, '海底山脊')?.type, 'SeafloorRidges')
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
