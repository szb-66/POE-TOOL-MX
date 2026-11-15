import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { compatibleMarketTemplate, generateMarketLocalizationCatalog, marketTemplate, validateMarketCatalog } from '../scripts/generateMarketLocalizationCatalog.js'
import { fixedMarketRules } from '../scripts/market-localization/fixedTranslations.js'
import { auditOfficialFilterCoverage, filterDisplayRows, officialFilterSchema, officialFilterSource } from '../scripts/market-localization/officialFilterTranslations.js'

const hash = value => createHash('sha256').update(value).digest('hex')
const executableSha256 = 'c86e4b153a93e573e7d800dcdf01a79b3392a52f73e29ca48d2bd8297ad28031'
const entry = (value) => ({ kind: 'dat', ...value, sourceHash: hash(value.en) })
function fixture() {
  return {
    international: { items: [{ name: 'Iron Ring', baseType: 'Iron Ring', text: '', unique: false }], stats: [] },
    cnCatalog: { stats: [] },
    localization: { protocolVersion: 1, engineVersion: 1, gameVersion: '3.30.0b', entries: [entry({ table: 'baseitemtypes', id: 'Metadata/Items/Rings/Ring1', field: 'Name', en: 'Iron Ring', cn: '锻铁戒指', tw: '鍛鐵戒指' })] },
    officialNames: { schemaVersion: 1, locale: 'fr', gameVersion: '3.30.0b', buildId: '26673341', executableSha256, entries: [
      { table: 'baseitemtypes', id: 'Metadata/Items/Rings/Ring1', field: 'Name', en: 'Iron Ring', fr: 'Anneau en fer' }
    ] }
  }
}
const stat = (id, en) => ({ ids: { explicit: id }, matchers: [en] })

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
  assert.ok(catalog.report.statsCn > 10000)
  assert.ok(catalog.report.statsTw > 8000)
  assert.ok(catalog.report.itemsComplete > 4500)
})
