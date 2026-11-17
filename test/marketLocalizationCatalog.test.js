import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { compatibleMarketTemplate, generateMarketLocalizationCatalog, loadOfficialTradeItems, loadOfficialTradeStats, marketTemplate, validateMarketCatalog } from '../scripts/generateMarketLocalizationCatalog.js'
import { fixedMarketRules, pseudoMarketTranslations } from '../scripts/market-localization/fixedTranslations.js'
import { auditOfficialFilterCoverage, filterDisplayRows, officialFilterSchema, officialFilterSource } from '../scripts/market-localization/officialFilterTranslations.js'
import { auditMarketPseudoCoverage } from '../scripts/auditMarketPseudoCoverage.js'

const hash = value => createHash('sha256').update(value).digest('hex')
const executableSha256 = '7f762cadbe0a7315091e105121010d2f35296db8046294e0bf49aacfff67db3c'
const entry = (value) => ({ kind: 'dat', ...value, sourceHash: hash(value.en) })
function fixture() {
  return {
    international: { items: [{ name: 'Iron Ring', baseType: 'Iron Ring', text: '', unique: false }], stats: [] },
    cnCatalog: { stats: [] },
    localization: { protocolVersion: 1, engineVersion: 1, gameVersion: '3.30.0b', entries: [entry({ table: 'baseitemtypes', id: 'Metadata/Items/Rings/Ring1', field: 'Name', en: 'Iron Ring', cn: '锻铁戒指', tw: '鍛鐵戒指' })] },
    officialStats: { schemaVersion: 1, game: 'poe1', locale: 'fr', buildId: '26694821', entries: [
      { en: '#% increased Damage', fr: '#% d’Augmentation des Dégâts' },
      { en: '+#% to Cold Resistance', fr: '+#% de Résistance au froid' },
      { en: '+#% total to Cold Resistance', fr: '+#% de Résistance au froid au total' }
    ] },
    officialNames: { schemaVersion: 1, locale: 'fr', gameVersion: '3.30.0b', buildId: '26694821', executableSha256, entries: [
      { table: 'baseitemtypes', id: 'Metadata/Items/Rings/Ring1', field: 'Name', en: 'Iron Ring', fr: 'Anneau en fer' }
    ] }
  }
}
const stat = (id, en) => ({ ids: { explicit: id }, matchers: [en] })
const tradeSnapshot = locale => JSON.parse(gunzipSync(fs.readFileSync(new URL(`../scripts/market-localization/official-trade-stats.${locale}.json.gz`, import.meta.url))))

function gemFixture() {
  const input = fixture()
  const bases = [
    { id: 'Metadata/Items/Gems/SkillGemAnimateWeapon', en: 'Animate Weapon', fr: "Animation d'Arme", cn: '幻化武器', tw: '幻化武器' },
    { id: 'Metadata/Items/Gems/SkillGemVaalAnimateWeapon', en: 'Vaal Animate Weapon', fr: "Animation d'arme vaal", cn: '瓦尔：幻化武器', tw: '瓦爾．幻化武器' }
  ]
  for (const row of bases) {
    input.officialNames.entries.push({ table: 'baseitemtypes', field: 'Name', id: row.id, en: row.en, fr: row.fr })
    input.localization.entries.push(entry({ table: 'baseitemtypes', field: 'Name', id: row.id, en: row.en, cn: row.cn, tw: row.tw }))
  }
  input.localization.entries.push(entry({ table: 'activeskills', field: 'DisplayedName', id: 'animate_weapon_alt_y', en: 'Animate Weapon of Ranged Arms', cn: '远程之幻化武器', tw: '幻化武器．遠程' }))
  const en = [
    { type: 'Animate Weapon', text: 'Animate Weapon of Ranged Arms', disc: 'alt_y' },
    { type: 'Vaal Animate Weapon', text: 'Vaal Animate Weapon (Animate Weapon of Ranged Arms)', disc: 'alt_y' }
  ]
  const fr = [
    { type: "Animation d'Arme", text: "Animation d'arme à distance", disc: 'alt_y' },
    { type: "Animation d'arme vaal", text: "Animation d'Arme vaal (Animation d'arme à distance)", disc: 'alt_y' }
  ]
  input.international.items = en.map(row => ({ name: row.type, baseType: row.type, text: row.text, discriminator: row.disc, category: 'gem', unique: false }))
  input.officialTradeItems = { en: { result: [{ id: 'gem', entries: en }] }, fr: { result: [{ id: 'gem', entries: fr }] } }
  return input
}

test('远程之幻化武器及瓦尔组合名称按官方完整text翻译，搜索仅反查term', () => {
  const catalog = generateMarketLocalizationCatalog(gemFixture())
  for (const [source, cn, tw] of [
    ["Animation d'arme à distance", '远程之幻化武器', '幻化武器．遠程'],
    ["Animation d'Arme vaal (Animation d'arme à distance)", '瓦尔：幻化武器 (远程之幻化武器)', '瓦爾．幻化武器 (幻化武器．遠程)']
  ]) {
    const rule = catalog.rules.find(rule => rule.field === 'text' && rule.source === source)
    assert.equal(rule?.cn, cn); assert.equal(rule?.tw, tw)
    assert.deepEqual(rule.reverse, ['term'])
    assert.ok(!catalog.rules.some(rule => rule.field === 'type' && rule.source === source))
  }
  const base = catalog.rules.find(rule => rule.field === 'type' && rule.source === "Animation d'Arme")
  assert.equal(base.cn, '幻化武器')
  assert.deepEqual(base.reverse, ['term', 'type'])
  assert.equal(catalog.report.itemsComplete, 2)
  assert.deepEqual(catalog.report.gemVariants, { officialTotal: 2, currentCatalogTotal: 2, total: 2, matched: 2, cn: 2, tw: 2, compound: 1, skipped: 0, reasons: {}, officialOnly: [] })
})

test('变异宝石缺法语、重复配对、英文变化、discriminator不符及译文歧义不猜测', () => {
  for (const mutate of [
    input => { input.officialTradeItems.fr.result[0].entries = [] },
    input => { input.officialTradeItems.fr.result[0].entries.push({ ...input.officialTradeItems.fr.result[0].entries[0] }) },
    input => { input.officialTradeItems.en.result[0].entries.push({ ...input.officialTradeItems.en.result[0].entries[0] }) },
    input => { input.officialTradeItems.en.result[0].entries[0].text = 'Changed English Gem' },
    input => { input.officialTradeItems.fr.result[0].entries[0].disc = 'alt_x' },
    input => { input.localization.entries.push(entry({ table: 'gemeffects', id: 'AnimateWeaponAltY', field: 'Name', en: 'Animate Weapon of Ranged Arms', cn: '其它译名', tw: '其它譯名' })) }
  ]) {
    const input = gemFixture(); mutate(input)
    const catalog = generateMarketLocalizationCatalog(input)
    assert.ok(!catalog.rules.some(rule => rule.field === 'text' && rule.source === "Animation d'arme à distance"))
    assert.equal(catalog.report.itemsComplete, catalog.report.gemVariants.matched)
  }
})

test('变异宝石只有基础类型译文时不能计为完整覆盖，官方英法快照可以离线核验来源哈希', async () => {
  const input = gemFixture()
  delete input.officialTradeItems
  assert.equal(generateMarketLocalizationCatalog(input).report.itemsComplete, 0)
  const snapshot = await loadOfficialTradeItems()
  assert.equal(snapshot.sources.fr.url, 'https://fr.pathofexile.com/api/trade/data/items')
  for (const locale of ['en', 'fr']) {
    const rows = snapshot[locale].result.find(group => group.id === 'gem').entries
    assert.equal(rows.length, 876)
    assert.equal(rows.filter(row => row.disc && row.text).length, 265)
  }
})

test('官方新变异可凭准确英法配对与受管名称生成，缺少简体时保留可靠繁体回退', () => {
  const input = gemFixture()
  input.international.items = []
  delete input.localization.entries.find(row => row.id === 'animate_weapon_alt_y').cn
  const catalog = generateMarketLocalizationCatalog(input)
  const rule = catalog.rules.find(row => row.field === 'text' && row.source === "Animation d'arme à distance")
  assert.equal(rule.cn, undefined)
  assert.equal(rule.tw, '幻化武器．遠程')
  assert.deepEqual(rule.reverse, ['term'])
  assert.equal(catalog.report.gemVariants.currentCatalogTotal, 0)
  assert.equal(catalog.report.gemVariants.officialOnly.length, 2)
  assert.equal(catalog.report.gemVariants.matched, 2)
})

test('官方英法交易目录补齐截图中的24个综合词缀，仍绑定精确法语原文', () => {
  const input = fixture()
  input.officialStats.entries = []
  input.officialTradeStats = { en: tradeSnapshot('en'), fr: tradeSnapshot('fr') }
  input.international.stats = Object.entries(pseudoMarketTranslations).map(([id, row]) => stat(id, row.en))
  input.localization.entries.push(entry({ kind: 'stat', table: 'metadata/statdescriptions/test.csd', id: 'movement_speed', field: 'variant:0',
    en: '{0}% increased Movement Speed', cn: '移动速度增加 {0}%', tw: '移動速度增加 {0}%', stats: { ids: ['movement_speed'], variants: [{ condition: '#', handlers: '', placeholders: ['{0}'] }] } }))
  const catalog = generateMarketLocalizationCatalog(input)
  const french = new Map(input.officialTradeStats.fr.result.flatMap(group => group.entries).map(row => [row.id, row.text]))
  assert.equal(input.international.stats.length, 24)
  for (const [id, translation] of Object.entries(pseudoMarketTranslations)) {
    const rule = catalog.rules.find(row => row.section === 'stats' && row.field === 'text' && row.id === id)
    assert.equal(rule?.source, french.get(id), id)
    assert.equal(rule?.cn, translation.cn, id)
    assert.equal(rule?.tw, translation.tw, id)
  }
})

test('官方英法快照原始字节符合来源URL、时间及哈希清单', async () => {
  const snapshot = await loadOfficialTradeStats()
  assert.equal(snapshot.sources.fr.url, 'https://fr.pathofexile.com/api/trade/data/stats')
  assert.equal(snapshot.en.result.find(group => group.id === 'pseudo').entries.length, 298)
  assert.equal(snapshot.fr.result.find(group => group.id === 'pseudo').entries.length, 298)
})

test('全部298个官方综合词缀及截图22项宝石等级均有准确FR来源和简体译文', async () => {
  const input = fixture()
  input.officialStats.entries = []
  input.officialTradeStats = await loadOfficialTradeStats()
  const pseudo = input.officialTradeStats.en.result.find(group => group.id === 'pseudo').entries
  input.international.stats = pseudo.map(row => stat(row.id, row.text))
  input.cnCatalog = JSON.parse(fs.readFileSync(new URL('../electron/modules/priceCheck/catalog.json', import.meta.url), 'utf8'))
  // These five range-damage rows are supplied by the managed CSD in production.
  // Preserve that independent source in the fixture; the legacy rows use English matchers, not refs.
  for (const row of pseudo.filter(row => /^pseudo\.pseudo_adds_(physical|lightning|cold|fire|chaos)_damage$/.test(row.id))) {
    const cn = input.cnCatalog.stats.find(stat => Object.values(stat.ids || {}).flat().includes(row.id) && stat.matchers.includes(row.text))
    input.localization.entries.push(entry({ kind: 'stat', table: 'metadata/statdescriptions/test.csd', id: row.id, field: 'variant:0', en: row.text,
      cn: cn.matchers[0], stats: { ids: [row.id], variants: [{ condition: '#', handlers: '', placeholders: [] }] } }))
  }
  const french = new Map(input.officialTradeStats.fr.result.find(group => group.id === 'pseudo').entries.map(row => [row.id, row.text]))
  const catalog = generateMarketLocalizationCatalog(input)
  const missing = pseudo.filter(row => !catalog.rules.some(rule => rule.section === 'stats' && rule.field === 'text'
    && rule.id === row.id && rule.source === french.get(row.id) && rule.cn)).map(row => row.id)
  assert.equal(pseudo.length, 298)
  assert.equal(pseudo.filter(row => row.id.startsWith('pseudo.pseudo_total_additional_') && row.id.endsWith('_gem_levels')).length, 22)
  assert.deepEqual(missing, [])
  const audit = auditMarketPseudoCoverage(catalog, input.officialTradeStats, input.international)
  assert.equal(audit.coverage.cn.covered, 298)
  assert.equal(audit.coverage.cn.missing, 0)
  assert.ok(audit.rows.every(row => row.cn === 'covered'))
})

test('交易ID相同但英文或参数漂移不能借用API或旧CSD译文', () => {
  for (const mutation of ['english', 'french', 'ambiguous']) {
    const input = fixture(), id = 'explicit.stat_1'
    input.international.stats = [stat(id, '#% increased Damage')]
    input.cnCatalog.stats = [{ ...stat(id, '伤害提高 #%'), refs: ['#% increased Damage'] }]
    input.officialTradeStats = {
      en: { result: [{ entries: [{ id, text: '#% increased Damage' }] }] },
      fr: { result: [{ entries: [{ id, text: '#% de Dégâts' }] }] }
    }
    if (mutation === 'english') input.officialTradeStats.en.result[0].entries[0].text = '#% more Damage'
    if (mutation === 'french') {
      input.officialStats.entries = []
      input.officialTradeStats.fr.result[0].entries[0].text = 'Dégâts augmentés de 4%'
    }
    if (mutation === 'ambiguous') input.officialTradeStats.en.result[0].entries.push({ id, text: '#% more Damage' })
    assert.ok(!generateMarketLocalizationCatalog(input).rules.some(rule => rule.id === id), mutation)
  }
})

test('官方X占位符仅允许已核实的准确ID和英法原文，不扩展到其它文案', () => {
  const id = 'pseudo.pseudo_total_mana', en = '+# total maximum Mana', fr = '+X au Mana maxi au total'
  for (const mutation of ['id', 'source']) {
    const input = fixture(), actualId = mutation === 'id' ? 'explicit.stat_1' : id
    input.officialStats.entries = []
    input.international.stats = [stat(actualId, en)]
    input.cnCatalog.stats = [{ ...stat(actualId, '+# 总最大魔力'), refs: [en] }]
    input.officialTradeStats = {
      en: { result: [{ entries: [{ id: actualId, text: en }] }] },
      fr: { result: [{ entries: [{ id: actualId, text: mutation === 'source' ? `${fr} changé` : fr }] }] }
    }
    assert.ok(!generateMarketLocalizationCatalog(input).rules.some(rule => rule.id === actualId), mutation)
  }
})

test('全部24个X拼写例外均可追溯到官方快照中的精确ID及英法全文', async () => {
  const source = JSON.parse(fs.readFileSync(new URL('../scripts/market-localization/official-pseudo-parameter-spellings.json', import.meta.url), 'utf8'))
  const snapshot = await loadOfficialTradeStats()
  const byLocale = Object.fromEntries(['en', 'fr'].map(locale => [locale, new Map(snapshot[locale].result.flatMap(group => group.entries).map(row => [row.id, row.text]))]))
  assert.equal(source.entries.length, 24)
  assert.equal(new Set(source.entries.map(row => row.id)).size, 24)
  assert.equal(source.sourceEnglishSha256, snapshot.sources.en.sha256)
  assert.equal(source.sourceFrenchSha256, snapshot.sources.fr.sha256)
  for (const row of source.entries) {
    assert.equal(byLocale.en.get(row.id), row.en)
    assert.equal(byLocale.fr.get(row.id), row.fr)
    assert.equal(compatibleMarketTemplate(row.en, row.fr), false)
  }
})

test('官方法语名称按稳定表ID与英文原文对齐，简繁搜索保留不同反向字段', () => {
  const result = generateMarketLocalizationCatalog(fixture())
  const rule = result.rules.find(rule => rule.section === 'items' && rule.field === 'type' && rule.source === 'Anneau en fer')
  assert.equal(rule.cn, '锻铁戒指'); assert.equal(rule.tw, '鍛鐵戒指')
  assert.deepEqual(rule.reverse, ['term', 'type'])
  assert.ok(!rule.id, 'DAT identity must not be mistaken for the remote item object ID')
  assert.ok(!result.rules.some(rule => rule.section === 'items' && rule.field === 'name'))
  assert.equal(result.report.itemsComplete, 1)
})

test('英文漂移、未覆盖条目和法语身份歧义不猜测物品名称', () => {
  for (const mutate of [
    input => { input.officialNames.entries[0].en = 'Different Ring' },
    input => { input.international.items[0] = { name: 'Unknown', baseType: 'Unknown', unique: false } },
    input => { input.officialNames.entries.push({ ...input.officialNames.entries[0], fr: 'Different French Ring' }) }
  ]) {
    const input = fixture(); mutate(input)
    assert.ok(!generateMarketLocalizationCatalog(input).rules.some(rule => rule.section === 'items' && rule.source))
  }
})

test('传奇名称与底材分开映射，组合文字只在原始结构相符时生成', () => {
  const input = fixture()
  input.international.items = [{ name: 'Fixture Unique', baseType: 'Iron Ring', text: 'Fixture Unique Iron Ring', unique: true }]
  input.localization.entries.push(entry({ table: 'words', id: 'hash:00000001', field: 'Text2', en: 'Fixture Unique', cn: '示例传奇', tw: '範例傳奇' }))
  input.officialNames.entries.push({ table: 'words', id: 'hash:00000001', field: 'Text2', en: 'Fixture Unique', fr: 'Unique français' })
  const result = generateMarketLocalizationCatalog(input)
  assert.deepEqual(result.rules.find(rule => rule.source === 'Unique français').reverse, ['name', 'term'])
  assert.equal(result.rules.find(rule => rule.source === 'Unique français Anneau en fer').tw, '範例傳奇 鍛鐵戒指')
  assert.equal(result.report.itemsComplete, 1)
})

test('同ID旧国服词缀仍必须匹配当前英文语义及参数', () => {
  const input = fixture()
  input.international.stats = [stat('explicit.stat_1', '#% increased Damage'), stat('explicit.stat_2', '#% more Damage')]
  input.cnCatalog.stats = [
    { ...stat('explicit.stat_1', '伤害提高 #%'), refs: ['#% increased Damage'] },
    { ...stat('explicit.stat_2', '伤害提高 #%'), refs: ['#% increased Damage'] }
  ]
  const result = generateMarketLocalizationCatalog(input)
  assert.equal(result.rules.find(rule => rule.id === 'explicit.stat_1').cn, '伤害提高 #%')
  assert.ok(!result.rules.some(rule => rule.id === 'explicit.stat_2'))
  assert.equal(result.report.statsSkipped, 1)
})

test('动态词缀必须绑定可靠法语原文，缺失、英文漂移和参数变化均跳过', () => {
  for (const mutate of [
    input => { input.officialStats.entries = [] },
    input => { input.officialStats.entries[0].en = '#% more Damage' },
    input => { input.officialStats.entries[0].fr = 'Dégâts augmentés de 4%' }
  ]) {
    const input = fixture()
    input.international.stats = [stat('explicit.stat_1', '#% increased Damage')]
    input.cnCatalog.stats = [{ ...stat('explicit.stat_1', '伤害提高 #%'), refs: ['#% increased Damage'] }]
    mutate(input)
    const catalog = generateMarketLocalizationCatalog(input)
    assert.ok(!catalog.rules.some(rule => rule.id === 'explicit.stat_1'))
    assert.equal(catalog.report.statsSourceMissing, 1)
  }
})

test('词缀规则保留各可靠法语原文，译文不能脱离当前原文证据', () => {
  const input = fixture()
  input.international.stats = [stat('explicit.stat_1', '#% increased Damage')]
  input.cnCatalog.stats = [{ ...stat('explicit.stat_1', '伤害提高 #%'), refs: ['#% increased Damage'] }]
  input.officialStats.entries.push({ en: '#% increased Damage', fr: '#% d’Augmentation des Dégâts globaux' })
  const catalog = generateMarketLocalizationCatalog(input)
  const rules = catalog.rules.filter(rule => rule.id === 'explicit.stat_1' && rule.field === 'text')
  assert.deepEqual(new Set(rules.map(rule => rule.source)), new Set(input.officialStats.entries.filter(row => row.en === '#% increased Damage').map(row => row.fr)))
  assert.ok(rules.every(rule => rule.cn === '伤害提高 #%'))
  const { source, ...missing } = rules[0]
  assert.throws(() => validateMarketCatalog({ ...catalog, rules: [missing] }), /缺少已核实法语原文/)
})

test('同一交易ID的另一英文变体没有译文时不能借用已有变体译文', () => {
  const input = fixture()
  input.international.stats = [stat('explicit.stat_1', '#% increased Damage'), stat('explicit.stat_1', '#% more Damage')]
  input.cnCatalog.stats = [{ ...stat('explicit.stat_1', '伤害提高 #%'), refs: ['#% increased Damage'] }]
  input.officialStats.entries.push({ en: '#% more Damage', fr: '#% davantage de Dégâts' })
  const catalog = generateMarketLocalizationCatalog(input)
  assert.ok(catalog.rules.some(rule => rule.id === 'explicit.stat_1' && rule.source === '#% d’Augmentation des Dégâts'))
  assert.ok(!catalog.rules.some(rule => rule.id === 'explicit.stat_1' && rule.source === '#% davantage de Dégâts'))
})

test('受管词缀提供原始简繁模板，不能使用数值展示label或丢失百分号与常数', () => {
  const input = fixture()
  input.international.stats = [stat('explicit.stat_1', '+#% to Cold Resistance')]
  input.localization.entries.push(entry({ kind: 'stat', table: 'metadata/statdescriptions/test.csd', id: 'fixture_stat', field: 'variant:0', en: '{0:+d}% to Cold Resistance', cn: '冰霜抗性 {0:+d}%', tw: '{0:+d}% 冰冷抗性', stats: { ids: ['fixture_stat'], variants: [{ condition: '#', handlers: '', placeholders: ['{0:+d}'] }] } }))
  const result = generateMarketLocalizationCatalog(input)
  const rule = result.rules.find(rule => rule.id === 'explicit.stat_1')
  assert.equal(rule.cn, '冰霜抗性 +#%'); assert.equal(rule.tw, '+#% 冰冷抗性')
  assert.ok(!JSON.stringify(rule).includes('数值'))
  assert.equal(marketTemplate('{0:+d}% to Cold Resistance'), '+#% to Cold Resistance')
  assert.equal(compatibleMarketTemplate('#% for 4 seconds', '#% 持续 5 秒'), false)
  assert.equal(compatibleMarketTemplate('#%', '#'), false)
})

test('同ID多种英文词缀映射到不同译文时保留原文', () => {
  const input = fixture()
  input.international.stats = [stat('explicit.stat_1', '#% increased Damage'), stat('explicit.stat_1', '#% reduced Damage')]
  input.cnCatalog.stats = [
    { ...stat('explicit.stat_1', '伤害提高 #%'), refs: ['#% increased Damage'] },
    { ...stat('explicit.stat_1', '伤害降低 #%'), refs: ['#% reduced Damage'] }
  ]
  assert.ok(!generateMarketLocalizationCatalog(input).rules.some(rule => rule.id === 'explicit.stat_1'))
})

test('伪词缀独立校验聚合含义，语义变化时不套用旧翻译', () => {
  const input = fixture()
  input.international.stats = [stat('pseudo.pseudo_total_cold_resistance', '+#% total to Cold Resistance')]
  let result = generateMarketLocalizationCatalog(input)
  assert.equal(result.rules.find(rule => rule.id === 'pseudo.pseudo_total_cold_resistance').tw, '+#% 總冰冷抗性')
  input.international.stats[0].matchers = ['+#% maximum Cold Resistance']
  result = generateMarketLocalizationCatalog(input)
  assert.ok(!result.rules.some(rule => rule.id === 'pseudo.pseudo_total_cold_resistance'))
})

test('无效来源哈希、来源游戏版本和发布可执行文件指纹会拒绝生成', () => {
  for (const mutate of [
    input => { input.localization.entries[0].sourceHash = '0'.repeat(64) },
    input => { input.officialNames.gameVersion = 'other' },
    input => { input.officialNames.buildId = '26673341' },
    input => { input.officialNames.executableSha256 = 'c86e4b153a93e573e7d800dcdf01a79b3392a52f73e29ca48d2bd8297ad28031' },
    input => { input.officialNames.executableSha256 = '0'.repeat(64) }
  ]) {
    const input = fixture(); mutate(input)
    assert.throws(() => generateMarketLocalizationCatalog(input))
  }
})

test('固定栏目和布尔选项不改变查询身份，已观测类型目录全部有自有译文', () => {
  for (const id of ['type_filters', 'weapon_filters', 'trade_filters', 'true', 'false', 'weapon.basesword', 'weapon.rapier', 'weapon.basemace']) {
    const rule = fixedMarketRules.find(rule => rule.id === id)
    assert.ok(rule?.cn && rule?.tw, id)
  }
  assert.equal(fixedMarketRules.find(rule => rule.id === 'true').cn, '是')
  for (const source of ['Coût en Or', 'Coût en or']) {
    const gold = fixedMarketRules.find(rule => rule.section === 'filters' && rule.field === 'text' && rule.source === source)
    assert.equal(gold?.cn, '金币费用'); assert.equal(gold?.tw, '金幣費用')
    assert.ok(!gold.id, 'unknown remote gold field ID must not be guessed')
  }
  assert.ok(!fixedMarketRules.some(rule => rule.section === 'stats' && rule.field === 'type'))
})

test('市集分组采用核对后的游戏术语，避免直译伪词缀与显式词缀', () => {
  const expected = {
    pseudo: ['综合', '偽屬性'], explicit: ['外延', '隨機屬性'], implicit: ['基底', '固定屬性'],
    fractured: ['分裂的', '破裂'], crafted: ['工艺', '工藝'], veiled: ['影匿', '隱匿'],
    enchant: ['附魔', '附魔'], scourge: ['异度天灾', '災魘'], crucible: ['古神熔炉', '熔火冥獄'],
    necropolis: ['死寂亡城', '魔影墓場'], monster: ['怪物', '怪物']
  }
  for (const [id, values] of Object.entries(expected)) {
    const rule = fixedMarketRules.find(rule => rule.section === 'stats' && rule.field === 'label' && rule.id === id)
    assert.deepEqual([rule?.cn, rule?.tw], values, id)
    assert.doesNotMatch(`${rule.cn}\n${rule.tw}`, /伪词缀|偽詞綴|显式词缀|顯式詞綴|固性屬性/)
  }
})

test('完整官方筛选树的每个字段与内联选项均有映射，默认项按所属selector区分', () => {
  const audit = auditOfficialFilterCoverage(fixedMarketRules)
  assert.deepEqual(audit.missing, [])
  assert.equal(audit.groups, 12); assert.equal(audit.fields, 94)
  assert.equal(audit.titles, 11); assert.equal(audit.fieldTexts, 93); assert.equal(audit.placeholders, 1)
  assert.equal(audit.inlineSelectors, 36); assert.equal(audit.inlineOptions, 275); assert.equal(audit.defaultOptions, 35)
  assert.equal(audit.displayRows, 380); assert.equal(audit.tipsExcluded, 6)
  assert.equal(audit.dynamicKnownItem.length, 3)
  const defaultOf = scope => fixedMarketRules.find(rule => rule.section === 'filters' && rule.scope === scope && rule.defaultOption)
  assert.equal(defaultOf('category').cn, '任意')
  assert.equal(defaultOf('collapse').cn, '否')
  assert.equal(defaultOf('indexed').cn, '任意时间')
  assert.equal(defaultOf('sale_type').tw, '直購價或定價')
  assert.equal(defaultOf('price').tw, '與混沌石等值')
  assert.ok(!fixedMarketRules.some(rule => rule.section === 'filters' && !rule.scope && ['true', 'false', 'any', '0'].includes(rule.id)))
  assert.ok(!fixedMarketRules.some(rule => rule.section === 'filters' && rule.source === 'Tous'))
  for (const row of filterDisplayRows()) if (row.kind === 'option') assert.ok(fixedMarketRules.some(rule => rule.scope === row.scope &&
    (row.id === null ? rule.defaultOption === true : rule.id === row.id)), row.path)
})

test('职业、类别后半部及新字段使用真实schema身份和核对后的游戏术语', () => {
  const field = id => fixedMarketRules.find(rule => rule.section === 'filters' && !rule.scope && rule.field === 'text' && rule.id === id)
  const option = (scope, id) => fixedMarketRules.find(rule => rule.section === 'filters' && rule.scope === scope && rule.id === id)
  assert.equal(field('damage').cn, '伤害'); assert.equal(field('ward').cn, '结界')
  assert.equal(field('base_defence_percentile').cn, '基础防御百分位'); assert.equal(field('class').cn, '角色职业')
  assert.equal(field('intangibility').cn, '虚化'); assert.equal(field('stored_experience').cn, '储存经验')
  assert.equal(option('class', 'scion').cn, '贵族'); assert.equal(option('class', 'templar').tw, '聖堂武僧')
  assert.equal(option('class', 'shadow').cn, '暗影')
  const expected = {
    leaguestone: '赛季石', memoryline: '回忆', 'monster.redbeast': '红色野兽', 'monster.yellowbeast': '黄色野兽',
    'heistequipment.heisttool': '赏金猎人工具', 'heistequipment.heistutility': '赏金猎人披风', 'heistequipment.heistreward': '赏金猎人胸针',
    'heistmission.contract': '契约', 'heistmission.blueprint': '蓝图', logbook: '先祖秘藏日志', 'sanctum.relic': '遗物',
    tincture: '酊剂', corpse: '灵柩', idol: '雕像', graft: '移植物', wombgift: '孕育赠礼', enshrouded: '雾隐物品', chart: '海图', viscera: '脏器'
  }
  for (const [id, cn] of Object.entries(expected)) assert.equal(option('category', id)?.cn, cn, id)
  for (let id = 0; id <= 12; id++) assert.equal(typeof option('foil_variation', String(id))?.id, 'string')
  assert.equal(option('foil_variation', 'voidborn').cn, '虚空血脉（全部）')
  const rows = filterDisplayRows(officialFilterSchema)
  assert.ok(rows.some(row => row.scope === 'category' && row.id === 'enshrouded'))
  assert.ok(!rows.some(row => row.id === 'wrapped' || row.id === 'maritimecharts'), 'display nouns must not become invented query IDs')
  assert.equal(officialFilterSource.locale, 'zh-TW')
})

test('scoped默认规则必须限制为filter选项，不能变成全局空ID替换', () => {
  const catalog = generateMarketLocalizationCatalog(fixture())
  const good = catalog.rules.find(rule => rule.defaultOption)
  assert.ok(good.scope && !good.id)
  for (const invalid of [
    { ...good, scope: undefined }, { ...good, id: 'any' }, { ...good, defaultOption: false },
    { ...good, section: 'stats' }, { ...good, field: 'title' }
  ]) assert.throws(() => validateMarketCatalog({ ...catalog, rules: [invalid] }))
})

test('账号占位符仅按已观测原文匹配，scope严格遵循host的filters/text约束', () => {
  const catalog = generateMarketLocalizationCatalog(fixture())
  const placeholder = catalog.rules.find(rule => rule.section === 'filters' && rule.field === 'placeholder')
  assert.equal(placeholder.source, 'Tapez le nom du compte...')
  assert.equal(placeholder.cn, '输入账号名称...')
  assert.ok(!('scope' in placeholder))
  assert.ok(!('id' in placeholder))
  validateMarketCatalog({ ...catalog, rules: [placeholder] })
  assert.throws(() => validateMarketCatalog({ ...catalog, rules: [{ ...placeholder, scope: 'account' }] }), /市集选项范围无效/)
  assert.ok(catalog.rules.filter(rule => rule.scope).every(rule => rule.section === 'filters' && rule.field === 'text'))
})

test('发布目录符合原生大小限制、交易ID范围及法语搜索规则约束', () => {
  const catalog = JSON.parse(fs.readFileSync(new URL('../electron/assets/market-localization/catalog.json', import.meta.url), 'utf8'))
  validateMarketCatalog(catalog)
  const international = JSON.parse(fs.readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
  const ids = new Set(international.stats.flatMap(stat => Object.values(stat.ids).flat()))
  for (const rule of catalog.rules) {
    if (rule.section === 'stats' && rule.field === 'text') assert.ok(ids.has(rule.id), rule.id)
    if (rule.reverse) { assert.equal(rule.section, 'items'); assert.ok(rule.source); assert.ok(!rule.id) }
    if (rule.section === 'stats') assert.notEqual(rule.field, 'type')
  }
  assert.ok(catalog.report.statsCn > 11000)
  assert.ok(catalog.report.statsTw > 8500)
  assert.ok(catalog.report.itemsComplete > 4500)
  const french = new Map(tradeSnapshot('fr').result.flatMap(group => group.entries).map(row => [row.id, row.text]))
  for (const [id, translation] of Object.entries(pseudoMarketTranslations)) {
    assert.ok(catalog.rules.some(rule => rule.id === id && rule.field === 'text' && rule.source === french.get(id)
      && rule.cn === translation.cn && rule.tw === translation.tw), id)
  }
  for (const [id, source] of french) if (id.startsWith('pseudo.')) {
    assert.ok(catalog.rules.some(rule => rule.id === id && rule.field === 'text' && rule.source === source && rule.cn), id)
  }
  for (const [source, cn] of [["Animation d'arme à distance", '远程之幻化武器'],
    ["Animation d'Arme vaal (Animation d'arme à distance)", '瓦尔：幻化武器 (远程之幻化武器)']]) {
    const rule = catalog.rules.find(row => row.section === 'items' && row.field === 'text' && row.source === source)
    assert.equal(rule?.cn, cn)
    assert.deepEqual(rule.reverse, ['term'])
    assert.ok(!catalog.rules.some(row => row.section === 'items' && row.field === 'type' && row.source === source))
  }
  assert.equal(catalog.report.gemVariants.currentCatalogTotal, 263)
  assert.equal(catalog.report.gemVariants.total, 265)
  assert.equal(catalog.report.gemVariants.matched, 265)
  assert.equal(catalog.report.gemVariants.skipped, 0)
  const frenchGems = JSON.parse(gunzipSync(fs.readFileSync(new URL('../scripts/market-localization/official-trade-items.fr.json.gz', import.meta.url)))).result.find(group => group.id === 'gem').entries
  const variants = frenchGems.filter(row => row.disc && row.text)
  assert.equal(variants.length, 265)
  for (const variant of variants) {
    const rule = catalog.rules.find(row => row.section === 'items' && row.field === 'text' && row.source === variant.text && (row.cn || row.tw))
    assert.ok(rule, variant.text)
    assert.deepEqual(rule.reverse, ['term'])
  }
})
