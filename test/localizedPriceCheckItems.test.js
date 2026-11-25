import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createLocalizationDictionary, createLocalizationTextResolver } from '../electron/modules/localization/text.js'
import { resolveCatalogStat } from '../electron/modules/priceCheck/catalog.js'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { localizedDagger } from './fixtures/priceCheckLocalizedDagger.js'
import { MAP_PRICE_CHECK_FIXTURES } from './fixtures/mapChartItems.js'

// Shared single parse of international catalog across all localized item price-check suites
const catalog = JSON.parse(readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)))

const daggerEntries = JSON.parse(readFileSync(new URL('./fixtures/price-check-localized-dagger-entries.json', import.meta.url)))
const mapReminderEntries = JSON.parse(readFileSync(new URL('./fixtures/price-check-map-reminder-entries.json', import.meta.url)))
const rarityEntries = JSON.parse(readFileSync(new URL('./fixtures/price-check-rarity-entries.json', import.meta.url)))
const pluralEntries = JSON.parse(readFileSync(new URL('./fixtures/price-check-stat-plural-entries.json', import.meta.url)))

function createIntlFixture(dictionary, activeCatalog = catalog, queryId = 'test') {
  const requests = []
  const service = new PriceCheckService({
    catalog: activeCatalog,
    localizationProvider: () => dictionary,
    manualInputOnly: true,
    auth: { getStatus: () => ({ authenticated: true }) },
    client: {
      server: { id: 'international', label: '国际服' },
      clearCache() {},
      async search(league, query) {
        requests.push({ league, query })
        return { id: queryId, total: 0, result: [] }
      },
      async fetch() { return { result: [] } }
    }
  })
  return { service, requests }
}

// --- 1. Localized dagger ---
test('真实传奇符文匕首的类别显示与米单位不再阻止国际服查价', async () => {
  const { service, requests } = createIntlFixture(daggerEntries)
  const result = await service.check({ league: 'Covens', text: localizedDagger, options: { initialSelection: 'all' } })
  assert.equal(result.model.identity.name, 'The Consuming Dark')
  assert.equal(result.model.identity.type, 'Fiend Dagger')
  assert.equal(result.model.stats.length, 6)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].query.query.name, 'The Consuming Dark')
  assert.equal(requests[0].query.query.type, 'Fiend Dagger')
  assert.equal(requests[0].query.query.stats[0].filters.length, 6)
})

test('结构字段的消歧不放宽底材或未知属性单位检查', () => {
  const resolver = createLocalizationTextResolver(daggerEntries)
  assert.throws(() => resolver.toEnglish('符文匕首'), (error) => error.code === 'LOCALIZATION_AMBIGUOUS')
  assert.throws(() => resolver.resolve(localizedDagger.replace('兽血短匕', '符文匕首')), (error) => error.code === 'LOCALIZATION_UNRESOLVED')
  assert.throws(() => resolver.resolve(localizedDagger.replace('1 米', '1 未知单位')), (error) => error.code === 'LOCALIZATION_UNRESOLVED')
  assert.throws(() => resolver.resolve(localizedDagger.replace('物品类别: 符文匕首\n', '').replace('符文匕首\n物理伤害', '未知类别\n物理伤害')), (error) => error.code === 'LOCALIZATION_UNRESOLVED')
})

// --- 2. Map reminder & Gold Ring ---
const mapText = MAP_PRICE_CHECK_FIXTURES[0].text
const ringText = `物品类别: 戒指
稀 有 度: 稀有
剧痛 魔语
金光戒指
--------
需求:
等级: 60
--------
物品等级: 85
--------
{ 基底属性— 丟置 }
物品稀有度 +6(6-15)%
--------
{ 前缀属性 "纯蓝的" (等阶：3)— 魔力 }
+67(65-68) 最大魔力
{ 前缀属性 "炽烈的" (等阶：4)— 防禦,能量護盾 }
+29(27-31) 最大能量护盾
{ 后缀属性 "有经验之" (等阶：1)— 法術,速度 }
施法速度加快 14(13-16)%
{ 后缀属性 "光辉之" (等阶：1)— 攻擊 }
命中值提高 20(16-20)%
照亮范围扩大 23(21-30)%`

test('完整地图忽略已核实的致盲提醒和使用说明，保留真实词缀和保证触发的下限', async () => {
  const { service, requests } = createIntlFixture(mapReminderEntries, catalog, 'map-reminder')
  const { model } = await service.check({ text: mapText, league: 'Covens', options: { initialSelection: 'all' } })
  assert.deepEqual(model.unknownStats, [])
  assert.equal(model.stats.length, 10)
  assert.deepEqual(requests[0].query.query.type, { discriminator: 'map', option: 'Map' })
  assert.deepEqual(requests[0].query.query.filters.map_filters.filters.map_tier, { min: 16, max: 16 })
  const filters = requests[0].query.query.stats.flatMap((group) => group.filters)
  for (const [id, description] of [['explicit.stat_1629869774', '怪物击中时致盲'], ['explicit.stat_406353061', '怪物在击中时获得暴击球']]) {
    assert.equal(model.stats.find((stat) => stat.id === id)?.displayText, description)
    const filter = filters.find((candidate) => candidate.id === id)
    assert.equal(filter?.value.min, 100)
    assert.equal(filter?.value.max, undefined)
  }
})

test('金光戒指独立识别，共六条词缀且稀有度使用装备基底过滤', async () => {
  const { service, requests } = createIntlFixture(mapReminderEntries, catalog, 'map-reminder')
  const { model } = await service.check({ text: ringText, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(model.identity.type, 'Gold Ring')
  assert.deepEqual(model.unknownStats, [])
  assert.deepEqual(model.stats.map((stat) => [stat.id, stat.values]), [
    ['implicit.stat_3917489142', [6]], ['explicit.stat_1050105434', [67]], ['explicit.stat_3489782002', [29]],
    ['explicit.stat_2891184298', [14]], ['explicit.stat_624954515', [20]], ['explicit.stat_1263695895', [23]]
  ])
  assert.equal(requests[0].query.query.stats.flatMap((group) => group.filters).length, 6)
})

test('官方已直接支持的致盲原句与剪贴板明确给出的几率优先保持', () => {
  const id = 'explicit.stat_1629869774'
  const custom = {
    ...catalog,
    stats: catalog.stats.map((stat) => stat.ids?.explicit === id
      ? { ...stat, matchers: [...stat.matchers, 'Monsters Blind on Hit'] }
      : stat)
  }
  const { service } = createIntlFixture(mapReminderEntries, custom, 'map-reminder')
  assert.deepEqual(service.parse(mapText).stats.find((stat) => stat.id === id)?.values, [])
  const withChance = mapText.replace('怪物击中时致盲', '怪物有 75% 的几率在击中时致盲')
  assert.deepEqual(service.parse(withChance).stats.find((stat) => stat.id === id)?.values, [75])
})

test('未知括号文本或没有可信数值变体的真实词缀继续阻止查询', async () => {
  const { service, requests } = createIntlFixture(mapReminderEntries, catalog, 'map-reminder')
  const unknown = mapText.replace('（被致盲时命中和闪避在接下来 4 秒总降 20%）', '（未知的效果文本）')
  await assert.rejects(service.check({ text: unknown, league: 'Covens' }), { code: 'LOCALIZATION_UNRESOLVED' })
  assert.deepEqual(requests, [])

  const rejected = createIntlFixture(mapReminderEntries.map((entry) => entry.id === 'map_monsters_chance_to_blind_on_hit_%' && entry.field === 'variant:0'
    ? { ...entry, sourceHash: '0'.repeat(64) }
    : entry))
  await assert.rejects(rejected.service.check({ text: mapText, league: 'Covens' }), { code: 'LOCALIZATION_STATS_UNRESOLVED' })
  assert.deepEqual(rejected.requests, [])
})

// --- 3. Gold Amulet rarity disambiguation ---
export const amuletText = `物品类别: 项链
稀 有 度: 稀有
恶魔 宝符
帝金护身符
--------
需求:
等级: 65
--------
物品等级: 83
--------
{ 基底属性— 丟置 }
物品稀有度 +16(12-20)%
--------
{ 前缀属性 "眩目的" (等阶：1)— 防禦,能量護盾 }
+51(48-51) 最大能量护盾
{ 后缀属性 "众神之" (等阶：1)— 能力 }
+51(51-55) 力量
{ 后缀属性 "凤凰之" (等阶：1)— 生命 }
每秒再生 65(64.1-96) 生命
{ 后缀属性 "宇宙之" (等阶：3)— 能力 }
+28(25-28) 全属性
(属性分为力量，敏捷和智慧三种)`

test('真实帝金护身符按装备基底解析稀有度，保留全部五条词缀和数值', async () => {
  const { service, requests } = createIntlFixture(rarityEntries, catalog, 'rarity')
  const { model } = await service.check({ text: amuletText, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(model.identity.type, 'Gold Amulet')
  assert.deepEqual(model.unknownStats, [])
  assert.equal(model.stats.length, 5)
  const rarity = model.stats.find((stat) => stat.id === 'implicit.stat_3917489142')
  assert.deepEqual(rarity?.values, [16])
  assert.equal(rarity.displayText, '物品稀有度 +16(12-20)%')
  const filters = requests[0].query.query.stats.flatMap((group) => group.filters)
  assert.equal(filters.find((filter) => filter.id === rarity.id).value.min, 16)
  assert.equal(filters.some((filter) => filter.id === 'implicit.stat_190932737'), false)
})

test('相同中文地图基底保留地图专用词缀，不套用装备稀有度', () => {
  const { service } = createIntlFixture(rarityEntries, catalog, 'rarity')
  const model = service.parse('物品类别: 异界地图\n稀有度: 普通\nFortress Map\n--------\n地图阶级: 17\n--------\n物品等级: 83\n--------\n{ 基底属性 }\n物品稀有度 +16(12-20)%')
  assert.ok(model.stats.some((stat) => stat.id === 'implicit.stat_190932737' && stat.values[0] === 16))
  assert.equal(model.stats.some((stat) => stat.id === 'implicit.stat_3917489142'), false)
})

test('普通复制的implicit尾标使用相同物品类别，缺少上下文时仍阻止歧义', () => {
  const { service } = createIntlFixture(rarityEntries, catalog, 'rarity')
  const plain = amuletText.replace('{ 基底属性— 丟置 }\n物品稀有度 +16(12-20)%', '物品稀有度 +16(12-20)% (implicit)')
  assert.ok(service.parse(plain).stats.some((stat) => stat.id === 'implicit.stat_3917489142'))
  assert.throws(() => createLocalizationDictionary(rarityEntries).toEnglish('物品稀有度 +16(12-20)%'), (error) => error.code === 'LOCALIZATION_AMBIGUOUS')
})

// --- 4. Stat plural bridge ---
const pluralCases = [
  ['local_flask_gain_X_charges_when_hit', 6, 'explicit', 'explicit.stat_1582728645'],
  ['gain_adrenaline_for_X_seconds_on_kill', 7, 'explicit', 'explicit.stat_4145689649'],
  ['herald_scorpion_number_of_additional_projectiles', 2, 'enchant', 'enchant.stat_155429578'],
  ['local_flask_ignite_proliferation_radius_during_effect', 2.5, 'explicit', 'explicit.stat_3052040294']
]
const pluralRows = (id) => pluralEntries.filter((entry) => entry.id === id)
const renderPlural = (text, number) => text.replace(/\{0\}/g, String(number))
const canonicalPlural = (dictionary, text, type = 'explicit', currentCatalog = catalog) => dictionary.resolve(
  type === 'explicit' ? text : `{ Enchant Modifier }\n${text}`,
  { normalizeStatSigns: true, catalog: currentCatalog }
).text.split('\n').at(-1)

test('同源单复数词缀桥接仅使用当前官方类型，保留真实数值与处理器单位', () => {
  const dictionary = createLocalizationTextResolver(pluralEntries)
  for (const [id, number, type, expectedId] of pluralCases) {
    const [singular, plural] = ['variant:0', 'variant:1'].map((field) => pluralRows(id).find((entry) => entry.field === field))
    const expected = renderPlural(singular.en, number)
    for (const language of ['en', 'cn', 'tw']) {
      const source = renderPlural(plural[language], number)
      const result = canonicalPlural(dictionary, source, type)
      assert.equal(result, expected, `${id}/${language}`)
      const match = resolveCatalogStat(catalog, result, type).match
      assert.equal(match?.id, expectedId, `${id}/${language}`)
      assert.deepEqual(match.values, [number], `${id}/${language}: 必须保留显示单位而非原始 handler 单位`)
      if (language === 'en') {
        const resolved = dictionary.resolve(type === 'explicit' ? source : `{ Enchant Modifier }\n${source}`, { normalizeStatSigns: true, catalog })
        assert.equal(resolved.lineMappings.at(-1).canonical, expected)
        assert.equal(resolved.lineMappings.at(-1).original, source)
      }
    }
  }
})

test('单数充能仍保留1，复数范围的原始6不被规范化为单数示例值1', () => {
  const dictionary = createLocalizationTextResolver(pluralEntries)
  for (const source of ['Gain 1 Charge when you are Hit by an Enemy', '你被敌人击中时获得 1 次充能']) {
    assert.equal(canonicalPlural(dictionary, source), 'Gain 1 Charge when you are Hit by an Enemy')
  }
  const text = canonicalPlural(dictionary, 'Gain 6(4-6) Charges when you are Hit by an Enemy')
  assert.equal(text, 'Gain 6(4-6) Charge when you are Hit by an Enemy')
})

test('已有当前类型官方matcher时保持复数原文，其他类型matcher不能用于桥接', () => {
  const dictionary = createLocalizationTextResolver(pluralEntries)
  const source = 'Gain 6 Charges when you are Hit by an Enemy'
  const currentCatalog = {
    ...catalog,
    stats: catalog.stats.map((stat) => stat.ids?.explicit === 'explicit.stat_1582728645'
      ? { ...stat, matchers: [...stat.matchers, 'Gain # Charges when you are Hit by an Enemy'] }
      : stat)
  }
  assert.equal(canonicalPlural(dictionary, source, 'explicit', currentCatalog), source)
  assert.equal(canonicalPlural(dictionary, source, 'enchant'), source)
})

test('坏hash、缺失可信hash、不同stat、不同handler或不同参数不能借单复数桥接', () => {
  const charge = pluralRows('local_flask_gain_X_charges_when_hit')
  const singular = charge.find((entry) => entry.field === 'variant:0')
  const plural = charge.find((entry) => entry.field === 'variant:1')
  const source = 'Gain 6 Charges when you are Hit by an Enemy'
  const changedParameter = { ...singular, en: singular.en.replace('{0}', '{1}') }
  changedParameter.sourceHash = createHash('sha256').update(changedParameter.en).digest('hex')
  const differentHandler = structuredClone(plural)
  differentHandler.stats.variants[1].handlers = 'reminderstring AnotherReminder'
  for (const invalidRows of [
    [singular, { ...plural, sourceHash: '0'.repeat(64) }],
    [{ ...singular, sourceHash: '0'.repeat(64) }, plural],
    charge.map(({ sourceHash, ...entry }) => entry),
    [singular, { ...plural, id: 'different_stat' }],
    [singular, differentHandler],
    [changedParameter, plural]
  ]) assert.equal(canonicalPlural(createLocalizationTextResolver(invalidRows), source), source)
})
