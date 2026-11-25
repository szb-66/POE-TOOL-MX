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

// --- 5. Stackable Currency & Divination Cards description/instruction lines ---
test('可堆叠通货（重铸石、未知命运卡）与命运卡的描述和使用说明不触发汉化未匹配异常，未知通货名仍阻断', async () => {
  const hash = (text) => createHash('sha256').update(text).digest('hex')
  const currencyEntries = [
    { kind: 'dat', table: 'baseitemtypes', id: 'Metadata/Items/Currency/CurrencyConvertToNormal', field: 'Name', en: 'Orb of Scouring', cn: '重铸石', tw: '重鑄石', sourceHash: hash('Orb of Scouring') },
    { kind: 'dat', table: 'baseitemtypes', id: 'Metadata/Items/Currency/CurrencyDivinationCardDeck', field: 'Name', en: 'Stacked Deck', cn: '未知命运卡', tw: '未知命運卡', sourceHash: hash('Stacked Deck') },
    { kind: 'dat', table: 'baseitemtypes', id: 'Metadata/Items/DivinationCards/DivinationCardTheDoctor', field: 'Name', en: 'The Doctor', cn: '疯医', tw: '瘋醫', sourceHash: hash('The Doctor') }
  ]

  const scouringText = `物品类别: 可堆叠通货
稀 有 度: 通货
重铸石
--------
堆叠数量: 30 / 30
--------
將一件物品上的所有屬性刪除，變回普通物品
--------
右鍵點擊此物品，再左鍵點擊一件魔法或稀有物品來使用。
按住 Shift 点击以分开堆叠`

  const stackedDeckText = `物品类别: 可堆叠通货
稀 有 度: 通货
未知命运卡
--------
堆叠数量: 6 / 20
--------
一組未知的命運卡
--------
點擊右鍵從排組中取出一張命運卡。
按住Ctrl+右鍵以從牌組中移出一張卡至你的物品欄中。
按住 Shift 点击以分开堆叠`

  const divinationCardText = `物品类别: 命运卡
稀 有 度: 命运卡
疯医
--------
堆叠数量: 1 / 8
--------
猎首
--------
一段未收录的中文背景故事
按住 Shift 点击以分开堆叠`

  const { service, requests } = createIntlFixture(currencyEntries, catalog, 'currency-desc')
  const scouring = await service.check({ text: scouringText, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(scouring.model.identity.type, 'Orb of Scouring')
  assert.deepEqual(scouring.model.unknownStats, [])
  assert.equal(requests[0].query.query.type, 'Orb of Scouring')

  const stackedDeck = await service.check({ text: stackedDeckText, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(stackedDeck.model.identity.type, 'Stacked Deck')
  assert.deepEqual(stackedDeck.model.unknownStats, [])
  assert.equal(requests[1].query.query.type, 'Stacked Deck')

  const doctor = await service.check({ text: divinationCardText, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(doctor.model.identity.type, 'The Doctor')
  assert.deepEqual(doctor.model.unknownStats, [])
  assert.equal(requests[2].query.query.type, 'The Doctor')

  const unknownCurrency = scouringText.replace('重铸石', '不存在的通货名称')
  await assert.rejects(service.check({ text: unknownCurrency, league: 'Covens' }), { code: 'LOCALIZATION_UNRESOLVED' })
})

// --- 6. Forbidden Shako indexable supports with (...) & Fated unidentified rare & mirrored reflected rolls ---
test('禁断的军帽随机可索引辅助短名与(...)标注映射为 indexable_support，且不干扰固定辅助与强辅', async () => {
  const hash = (text) => createHash('sha256').update(text).digest('hex')
  const shakoEntries = [
    { kind: 'dat', table: 'words', id: 'hash:forbidden-shako', field: 'Text2', en: 'Forbidden Shako', cn: '禁断的军帽', tw: '禁忌軍帽', sourceHash: hash('Forbidden Shako') },
    { kind: 'dat', table: 'baseitemtypes', id: 'Metadata/Items/Armours/Helmets/HelmetStrInt9', field: 'Name', en: 'Great Crown', cn: '强化巨盔', tw: '強化巨盔', sourceHash: hash('Great Crown') },
    {
      kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
      id: 'local_random_support_gem_level local_random_support_gem_index', field: 'variant:0',
      en: 'Socketed Gems are Supported by Level {0} {1}', cn: '插入的技能石被 {0} 级的{1}辅助', tw: '插槽中的寶石被等級 {0} 的 {1} 輔助',
      sourceHash: hash('Socketed Gems are Supported by Level {0} {1}'),
      stats: { ids: ['local_random_support_gem_level', 'local_random_support_gem_index'], variants: [{ condition: '# #', handlers: 'display_indexable_support 2 1', placeholders: ['{0}', '{1}'] }] }
    },
    { kind: 'dat', table: 'clientstrings', id: 'ModGrantsSupportEffectWithLevel', field: 'Text', en: 'Socketed Gems are Supported by Level {1} {0}', cn: '镶嵌的宝石被 {1} 级 {0} 辅助', tw: '插槽中的寶石被等級 {1} 的 {0} 輔助', sourceHash: hash('Socketed Gems are Supported by Level {1} {0}') },
    { kind: 'dat', table: 'grantedeffects', id: 'SupportMultistrike', field: 'SupportName', en: 'Multistrike Support', cn: '多重打击（辅）', tw: '多重打擊輔助', sourceHash: hash('Multistrike Support') },
    { kind: 'dat', table: 'grantedeffects', id: 'SupportAwakenedMultistrike', field: 'SupportName', en: 'Awakened Multistrike Support', cn: '多重打击（强辅）', tw: '覺醒．多重打擊輔助', sourceHash: hash('Awakened Multistrike Support') },
    { kind: 'dat', table: 'grantedeffects', id: 'SupportVolley', field: 'SupportName', en: 'Volley Support', cn: '齐射（辅）', tw: '齊射輔助', sourceHash: hash('Volley Support') },
    {
      kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
      id: 'additional_all_attributes', field: 'variant:0',
      en: '{0:+d} to all Attributes', cn: '{0:+d} 全属性', tw: '{0:+d} 全能力',
      sourceHash: hash('{0:+d} to all Attributes'),
      stats: { ids: ['additional_all_attributes'], variants: [{ condition: '#', handlers: 'reminderstring ReminderTextAttributes', placeholders: ['{0:+d}'] }] }
    },
    { kind: 'dat', table: 'remindertext', id: 'ReminderTextAttributes', field: 'Text', en: '(Attributes are Strength, Dexterity, and Intelligence)', cn: '(属性分为力量，敏捷和智慧三种)', tw: '(能力為力量、敏捷與智慧)', sourceHash: hash('(Attributes are Strength, Dexterity, and Intelligence)') },
    { kind: 'dat', table: 'flavourtext', id: 'UniqueHelmetStrInt9', field: 'Text', en: 'The Azmeri should never have touched the tears of the gods, lest Viridi weep.', cn: '阿兹莫里人绝不该碰众神之泪，以免维里迪哭泣。', tw: '阿茲莫里人不應該碰觸眾神之淚，以免維里迪哭泣。', sourceHash: hash('The Azmeri should never have touched the tears of the gods, lest Viridi weep.') }
  ]

  const shakoCn = `物品类别: 头盔
稀 有 度: 传奇
禁断的军帽
强化巨盔
--------
护甲: 160
能量护盾: 33
--------
需求:
等级: 68
力量: 59
智慧: 59
--------
插槽: W-G-R-W 
--------
物品等级: 85
--------
{ 传奇属性— 寶石 }
插入的技能石被 5(1-10) 级的多重打擊(...)辅助 — 数值不可调整
{ 传奇属性— 寶石 }
插入的技能石被 35(25-35) 级的齊射(...)辅助 — 数值不可调整
{ 传奇属性— 能力 }
+25(25-30) 全属性
(属性分为力量，敏捷和智慧三种)
--------
阿兹莫里人绝不该碰众神之泪，以免维里迪哭泣。`

  const shakoEn = `Item Class: Helmets
Rarity: Unique
Forbidden Shako
Great Crown
--------
Armour: 160
Energy Shield: 33
--------
Requirements:
Level: 68
Str: 59
Int: 59
--------
Sockets: W-G-R-W 
--------
Item Level: 85
--------
{ Unique Modifier — Gem }
Socketed Gems are Supported by Level 5(1-10) Multistrike(...) — Unscalable Value
{ Unique Modifier — Gem }
Socketed Gems are Supported by Level 35(25-35) Volley(...) — Unscalable Value
{ Unique Modifier — Attribute }
+25(25-30) to all Attributes
(Attributes are Strength, Dexterity, and Intelligence)`

  const cnFixture = createIntlFixture(shakoEntries, catalog, 'shako-cn')
  const cnResult = await cnFixture.service.check({ text: shakoCn, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(cnResult.model.identity.name, 'Forbidden Shako')
  assert.equal(cnResult.model.identity.type, 'Great Crown')
  assert.deepEqual(cnResult.model.unknownStats, [])
  assert.deepEqual(cnResult.model.stats.map(stat => [stat.id, stat.values]), [
    ['explicit.indexable_support_41', [5]],
    ['explicit.indexable_support_36', [35]],
    ['explicit.stat_1379411836', [25]]
  ])
  assert.equal(cnResult.model.stats[0].displayText, '插入的技能石被 5(1-10) 级的多重打擊(...)辅助 — 数值不可调整')
  assert.equal(cnResult.model.stats[1].displayText, '插入的技能石被 35(25-35) 级的齊射(...)辅助 — 数值不可调整')

  const enFixture = createIntlFixture(shakoEntries, catalog, 'shako-en')
  const enResult = await enFixture.service.check({ text: shakoEn, league: 'Covens', options: { initialSelection: 'all' } })
  assert.deepEqual(enResult.model.unknownStats, [])
  assert.deepEqual(enFixture.requests[0].query, cnFixture.requests[0].query)

  // 固定词缀完整名称（带 輔助 / （辅））仍映射到 explicit.effect_*，不与短名混淆
  const fixedLine = shakoCn
    .replace('插入的技能石被 5(1-10) 级的多重打擊(...)辅助 — 数值不可调整', '插槽中的寶石被等級 20 的 多重打擊輔助 輔助 — 数值不可调整')
    .replace('插入的技能石被 35(25-35) 级的齊射(...)辅助 — 数值不可调整', '插入的技能石被 20 级的齐射(辅)辅助 — 数值不可调整')
  const fixedModel = createIntlFixture(shakoEntries, catalog, 'shako-fixed').service.parse(fixedLine)
  assert.deepEqual(fixedModel.stats.slice(0, 2).map(stat => [stat.id, stat.values]), [
    ['explicit.effect_2100902429', [20]],
    ['explicit.effect_3022937704', [20]]
  ])

  // 未知辅助名即使带 (...) 也必须阻断
  await assert.rejects(
    cnFixture.service.check({ text: shakoCn.replace('多重打擊(...)', '未知輔助(...)'), league: 'Covens' }),
    { code: 'LOCALIZATION_UNRESOLVED' }
  )
})

test('未鉴定命定稀有底材与映像迷雾越界反射词缀均可完整解析并生成一致查询', async () => {
  const hash = (text) => createHash('sha256').update(text).digest('hex')
  const entries = [
    { kind: 'dat', table: 'clientstrings', id: 'FatedItem', field: 'Text', en: 'Fated {0}', cn: '命定的 {0}', tw: '命運 {0}', sourceHash: hash('Fated {0}') },
    { kind: 'dat', table: 'baseitemtypes', id: 'Metadata/Items/Rings/Ring13', field: 'Name', en: 'Two-Stone Ring', cn: '双玉戒指', tw: '雙玉戒指', sourceHash: hash('Two-Stone Ring') },
    { kind: 'dat', table: 'baseitemtypes', id: 'Metadata/Items/Rings/Ring2', field: 'Name', en: 'Ruby Ring', cn: '红玉戒指', tw: '紅玉戒指', sourceHash: hash('Ruby Ring') },
    {
      kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
      id: 'fire_and_lightning_damage_resistance_%', field: 'variant:0',
      en: '{0:+d}% to Fire and Lightning Resistances', cn: '{0:+d}% 火焰与闪电抗性', tw: '{0:+d}% 火焰與閃電抗性',
      sourceHash: hash('{0:+d}% to Fire and Lightning Resistances'),
      stats: { ids: ['fire_and_lightning_damage_resistance_%'], variants: [{ condition: '#', handlers: '', placeholders: ['%', '{0:+d}'] }] }
    },
    {
      kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
      id: 'base_fire_damage_resistance_%', field: 'variant:0',
      en: '{0:+d}% to Fire Resistance', cn: '{0:+d}% 火焰抗性', tw: '{0:+d}% 火焰抗性',
      sourceHash: hash('{0:+d}% to Fire Resistance'),
      stats: { ids: ['base_fire_damage_resistance_%'], variants: [{ condition: '#', handlers: '', placeholders: ['%', '{0:+d}'] }] }
    },
    {
      kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
      id: 'base_maximum_energy_shield', field: 'variant:0',
      en: '{0:+d} to maximum Energy Shield', cn: '{0:+d} 最大能量护盾', tw: '{0:+d} 最大能量護盾',
      sourceHash: hash('{0:+d} to maximum Energy Shield'),
      stats: { ids: ['base_maximum_energy_shield'], variants: [{ condition: '#', handlers: '', placeholders: ['{0:+d}'] }] }
    },
    {
      kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
      id: 'mana_regeneration_rate_+%', field: 'variant:0',
      en: '{0}% increased Mana Regeneration Rate', cn: '魔力再生速度加快 {0}%', tw: '增加 {0}% 魔力回復率',
      sourceHash: hash('{0}% increased Mana Regeneration Rate'),
      stats: { ids: ['mana_regeneration_rate_+%'], variants: [{ condition: '1|#', handlers: '', placeholders: ['%', '{0}'] }, { condition: '#|-1', handlers: 'negate 1', placeholders: ['%', '{0}'] }] }
    },
    {
      kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.csd',
      id: 'mana_regeneration_rate_+%', field: 'variant:1',
      en: '{0}% reduced Mana Regeneration Rate', cn: '魔力再生速度降低 {0}%', tw: '減少 {0}% 魔力回復率',
      sourceHash: hash('{0}% reduced Mana Regeneration Rate'),
      stats: { ids: ['mana_regeneration_rate_+%'], variants: [{ condition: '1|#', handlers: '', placeholders: ['%', '{0}'] }, { condition: '#|-1', handlers: 'negate 1', placeholders: ['%', '{0}'] }] }
    }
  ]

  const fatedCn = `物品类别: 戒指
稀 有 度: 稀有
命定的 双玉戒指
--------
物品等级: 85
--------
{ 基底属性— 元素,火焰,閃電,抗性 }
+13(12-16)% 火焰与闪电抗性
--------
未鉴定`
  const fatedTw = `物品種類: 戒指
稀有度: 稀有
命運 雙玉戒指
--------
物品等級: 85
--------
{ 固定詞綴— 元素,火焰,閃電,抗性 }
+13(12-16)% 火焰與閃電抗性
--------
未鑑定`
  const fatedEn = `Item Class: Rings
Rarity: Rare
Fated Two-Stone Ring
--------
Item Level: 85
--------
{ Implicit Modifier — Elemental, Fire, Lightning, Resistance }
+13(12-16)% to Fire and Lightning Resistances
--------
Unidentified`

  const queries = []
  for (const text of [fatedCn, fatedTw, fatedEn]) {
    const { service, requests } = createIntlFixture(entries, catalog, 'fated-ring')
    const { model } = await service.check({ text, league: 'Covens', options: { initialSelection: 'all' } })
    assert.equal(model.identity.type, 'Two-Stone Ring')
    assert.equal(model.stateFilters.identified, 'false')
    assert.deepEqual(model.unknownStats, [])
    assert.deepEqual(model.stats.map(stat => [stat.id, stat.values]), [['implicit.stat_3441501978', [13]]])
    queries.push(requests[0].query)
  }
  assert.deepEqual(queries[1], queries[0])
  assert.deepEqual(queries[2], queries[0])

  // 缺失或未验签的 FatedItem 模板以及未知底材必须继续阻断
  for (const [text, data] of [
    [fatedCn, entries.filter(entry => entry.id !== 'FatedItem')],
    [fatedCn, entries.map(entry => entry.id === 'FatedItem' ? { ...entry, sourceHash: '0'.repeat(64) } : entry)],
    [fatedCn.replace('命定的 双玉戒指', '命定的 未知戒指'), entries]
  ]) {
    const { service, requests } = createIntlFixture(data, catalog, 'fated-reject')
    await assert.rejects(service.check({ text, league: 'Covens' }), { code: 'LOCALIZATION_UNRESOLVED' })
    assert.deepEqual(requests, [])
  }

  // 映像迷雾已复制饰品：括号区间外的放大正值、反号负值及负向描述均正确解析
  const mirroredRing = `物品类别: 戒指
稀 有 度: 稀有
暴怒 灵指
红玉戒指
--------
物品等级: 83
--------
{ 基底属性— 元素,火焰,抗性 }
+26(20-30)% 火焰抗性
--------
{ 前缀属性 "灿烂的" (等阶：1)— 防禦,能量護盾 }
+117(44-47) 最大能量护盾
{ 后缀属性 "炉火之" (等阶：4)— 元素,火焰,抗性 }
-82(30-35)% 火焰抗性
{ 后缀属性 "喜悦之" (等阶：5)— 魔力 }
魔力再生速度降低 62(-20--29)%
--------
已复制`
  const reflected = createIntlFixture(entries, catalog, 'mirrored-ring')
  const reflectedResult = await reflected.service.check({ text: mirroredRing, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(reflectedResult.model.identity.type, 'Ruby Ring')
  assert.equal(reflectedResult.model.stateFilters.mirrored, 'true')
  assert.deepEqual(reflectedResult.model.unknownStats, [])
  assert.deepEqual(reflectedResult.model.stats.map(stat => [stat.id, stat.values]), [
    ['implicit.stat_3372524247', [26]],
    ['explicit.stat_3489782002', [117]],
    ['explicit.stat_3372524247', [-82]],
    ['explicit.stat_789117908', [-62]]
  ])
})

// --- 7. Direct base-type maps (Nightmare / Valdo / Shaper Guardian / Vaal Temple) ---
test('国际服梦魇地图与其他独立底材地图按真实底材无 discriminator 查询并过滤改造限制说明', async () => {
  const hash = (text) => createHash('sha256').update(text).digest('hex')
  const mapEntries = [
    { kind: 'dat', table: 'baseitemtypes', id: 'Metadata/Items/Maps/MapKeyNightmareBoss', field: 'Name', en: 'Nightmare Map', cn: '梦魇地图', tw: '夢魘地圖', sourceHash: hash('Nightmare Map') },
    { kind: 'dat', table: 'baseitemtypes', id: 'Metadata/Items/Maps/MapKeyValdo', field: 'Name', en: 'Valdo Map', cn: '瓦尔多地图', tw: '瓦爾多地圖', sourceHash: hash('Valdo Map') },
    { kind: 'dat', table: 'baseitemtypes', id: 'Metadata/Items/Maps/MapKeyShaperGuardian', field: 'Name', en: 'Shaper Guardian Map', cn: '塑界守卫地图', tw: '塑者守衛地圖', sourceHash: hash('Shaper Guardian Map') },
    { kind: 'dat', table: 'baseitemtypes', id: 'Metadata/Items/Maps/MapKeyVaalTemple', field: 'Name', en: 'Vaal Temple Map', cn: '瓦尔密殿地图', tw: '瓦爾密殿地圖', sourceHash: hash('Vaal Temple Map') },
    { kind: 'dat', table: 'baseitemtypes', id: 'Metadata/Items/Maps/MapUnknownSpecial', field: 'Name', en: 'Unknown Special Map', cn: '未知特殊地图', tw: '未知特殊地圖', sourceHash: hash('Unknown Special Map') },
    { kind: 'dat', table: 'words', id: 'hash:perandus-manor', field: 'Text2', en: 'The Perandus Manor', cn: '普兰德斯庄园', tw: '普蘭德斯莊園', sourceHash: hash('The Perandus Manor') },
    { kind: 'dat', table: 'clientstrings', id: 'ItemDescriptionMap', field: 'Text', en: 'Travel to this Map by using it in a personal Map Device. Maps can only be used once.', cn: '在私人地图装置中使用该物品，前往该等阶或更低等阶的地图。只能被使用一次。', tw: '在個人的地圖裝置中使用此物品來前往此地圖。地圖只能使用一次。', sourceHash: hash('Travel to this Map by using it in a personal Map Device. Maps can only be used once.') },
    { kind: 'dat', table: 'clientstrings', id: 'ItemPopupNightmareMapModifiable', field: 'Text', en: 'Can only be modified with Chaos Orbs, Vaal Orbs, Delirium Orbs and Chisels', cn: '仅能使用混沌石、瓦尔宝珠、谵妄玉和制图钉调整', tw: '僅能使用混沌石、瓦爾寶珠、譫妄玉和圖釘調整', sourceHash: hash('Can only be modified with Chaos Orbs, Vaal Orbs, Delirium Orbs and Chisels') }
  ]

  const reportedNightmareCn = `物品类别: 地图
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

  const reportedNightmareEn = `Item Class: Maps
Rarity: Rare
Nightmare Map
--------
Item Level: 85
--------
Monster Level: 83
--------
Unidentified
--------
Travel to this Map by using it in a personal Map Device. Maps can only be used once.
--------
Can only be modified with Chaos Orbs, Vaal Orbs, Delirium Orbs and Chisels`

  const { service, requests } = createIntlFixture(mapEntries, catalog, 'nightmare-map')
  const cnResult = await service.check({ text: reportedNightmareCn, league: 'Covens', options: { initialSelection: 'auto' } })
  const enResult = await service.check({ text: reportedNightmareEn, league: 'Covens', options: { initialSelection: 'auto' } })

  for (const [label, res, req] of [
    ['cn', cnResult, requests[0].query.query],
    ['en', enResult, requests[1].query.query]
  ]) {
    assert.equal(res.model.identity.type, 'Nightmare Map', label)
    assert.equal(res.model.identity.discriminator, undefined, label)
    assert.deepEqual(res.model.unknownStats, [], label)
    assert.equal(req.type, 'Nightmare Map', label)
    assert.equal(req.filters.type_filters.filters.category.option, 'map', label)
    assert.equal(req.filters.type_filters.filters.rarity.option, 'nonunique', label)
    assert.equal(req.filters.misc_filters.filters.identified.option, 'false', label)
  }

  // 修改筛选条件重查（经过 sanitizePriceCheckModel）时，不补回 discriminator: 'map'
  const editedModel = structuredClone(cnResult.model)
  editedModel.properties.find((prop) => prop.id === 'misc.itemLevel').enabled = true
  await service.check({ model: editedModel, league: 'Covens', options: { initialSelection: 'auto' } })
  assert.equal(requests[2].query.query.type, 'Nightmare Map')
  assert.deepEqual(requests[2].query.query.filters.misc_filters.filters.ilvl, { min: 85 })

  // 已鉴定稀有独立底材地图（瓦尔多、塑界守卫、瓦尔密殿）与传奇瓦尔多地图
  for (const [cnBase, enBase] of [
    ['梦魇地图', 'Nightmare Map'],
    ['瓦尔多地图', 'Valdo Map'],
    ['塑界守卫地图', 'Shaper Guardian Map'],
    ['瓦尔密殿地图', 'Vaal Temple Map']
  ]) {
    const identifiedText = `物品类别: 地图\n稀 有 度: 稀有\n昏暗坚定\n${cnBase}\n--------\n物品等级: 85\n--------\n怪物等级: 83`
    const parsed = service.parse(identifiedText)
    assert.equal(parsed.identity.type, enBase, enBase)
    assert.equal(parsed.identity.discriminator, undefined, enBase)
  }

  const uniqueValdo = `物品类别: 地图\n稀 有 度: 传奇\n普兰德斯庄园\n瓦尔多地图\n--------\n物品等级: 100\n--------\n怪物等级: 84`
  const uniqueValdoRes = await service.check({ text: uniqueValdo, league: 'Covens' })
  assert.equal(uniqueValdoRes.model.identity.name, 'The Perandus Manor')
  assert.equal(uniqueValdoRes.model.identity.type, 'Valdo Map')
  assert.equal(uniqueValdoRes.model.identity.discriminator, undefined)
  assert.equal(requests.at(-1).query.query.name, 'The Perandus Manor')
  assert.equal(requests.at(-1).query.query.type, 'Valdo Map')

  // 不在交易目录中的未知特殊地图仍被身份校验拦截，不退化为普通 Map 查询
  const unknownMap = reportedNightmareCn.replace('梦魇地图', '未知特殊地图')
  await assert.rejects(
    service.check({ text: unknownMap, league: 'Covens' }),
    /中文物品身份未匹配国际服交易目录/
  )
})
