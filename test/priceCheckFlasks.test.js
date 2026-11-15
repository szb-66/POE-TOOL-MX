import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createLocalizationTextResolver } from '../electron/modules/localization/text.js'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { userLifeFlask, equivalentEnglishLifeFlask, equivalentTraditionalLifeFlask, userDreadMaidenFlask, userKiaraFlask } from './fixtures/priceCheckFlask.js'
import { statNumber } from '../electron/modules/localization/statVariants.js'
import { createPriceCheckModel } from '../electron/modules/priceCheck/query.js'
import { flaskStructures } from './fixtures/priceCheckFlaskStructures.js'

const entries = JSON.parse(await readFile(new URL('./fixtures/price-check-flask-entries.json', import.meta.url)))
const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)))
const currentFlaskRows = JSON.parse(await readFile(new URL('./fixtures/price-check-current-unique-flasks.json', import.meta.url)))
const replacementKeys = new Set(currentFlaskRows.stats.map(row => row.key))
const currentFlaskCatalog = { ...catalog, items: [...catalog.items, ...currentFlaskRows.items],
  stats: [...catalog.stats.filter(row => !replacementKeys.has(row.key)), ...currentFlaskRows.stats] }
const bases = { 'Life Flasks': 'Divine Life Flask', 'Mana Flasks': 'Divine Mana Flask', 'Hybrid Flasks': 'Hallowed Hybrid Flask', 'Utility Flasks': 'Granite Flask' }

function fixture(dictionary = entries, tradeCatalog = catalog) {
  const searches = []
  const service = new PriceCheckService({ catalog: tradeCatalog, localizationProvider: () => dictionary, manualInputOnly: true,
    auth: { getStatus: () => ({ authenticated: true }) },
    client: { server: { id: 'international' }, clearCache() {},
      async search(league, query) { searches.push(query); return { id: 'flask', total: 0, result: [] } },
      async fetch() { return { result: [] } } }
  })
  return { service, searches }
}

function clipboard(structure, language) {
  const itemClass = entries.find(entry => entry.table === 'itemclasses' && entry.en === structure.className)
  const base = entries.find(entry => entry.table === 'baseitemtypes' && entry.en === bases[structure.className])
  const label = language === 'en' ? 'Item Class' : language === 'tw' ? '物品種類' : '物品类别'
  const rarity = language === 'en' ? 'Rarity: Normal' : '稀有度: 普通'
  const itemLevel = language === 'en' ? 'Item Level: 64' : language === 'tw' ? '物品等級: 64' : '物品等级: 64'
  return `${label}: ${itemClass[language]}\n${rarity}\n${base[language]}\n--------\n${structure.localized[language]}\n--------\n${itemLevel}`
}

test('用户完整魔法生命药剂保留正确底材、最大充能和两种七秒免疫', async () => {
  const { service, searches } = fixture()
  const { model } = await service.check({ text: userLifeFlask, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(searches.length, 1)
  assert.equal(searches[0].query.type, 'Divine Life Flask')
  assert.equal(model.identity.type, 'Divine Life Flask')
  assert.deepEqual(model.unknownStats, [])
  assert.equal(model.stats.length, 2)
  const charges = model.stats.find(stat => stat.id === 'explicit.stat_1437957544')
  const immunity = model.stats.find(stat => stat.id === 'explicit.stat_182714578')
  assert.deepEqual(charges.values, [22])
  assert.deepEqual(immunity.values, [7, 7])
  assert.equal(charges.displayText, '最大充能 +22(20-23)')
  assert.match(immunity.displayText, /在流血时使用可以在接下来 7\(6-8\) 秒免疫流血/)
  assert.match(immunity.displayText, /被腐化之血影响时使用可以在接下来 7\(6-8\) 秒免疫腐化之血/)
  const filters = JSON.parse(JSON.stringify(searches[0])).query.stats.flatMap(group => group.filters)
  assert.deepEqual(filters.find(filter => filter.id === charges.id).value, { min: 22 })
  assert.deepEqual(filters.find(filter => filter.id === immunity.id).value, { min: 7 })
  await service.rerun({ model })
  assert.equal(searches.length, 2)
  assert.deepEqual(JSON.parse(JSON.stringify(searches[1])), JSON.parse(JSON.stringify(searches[0])))
})

test('恐惧仕女的圣礼完整文本按当前官方目录提交四条词缀，受击充能保留6', async () => {
  const { service, searches } = fixture(entries, currentFlaskCatalog)
  const { model } = await service.check({ text: userDreadMaidenFlask, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(searches[0].query.name, "Dreadmaidens' Sacrament")
  assert.equal(searches[0].query.type, 'Basalt Flask')
  assert.deepEqual(model.unknownStats, [])
  assert.deepEqual(model.stats.map(stat => [stat.id, stat.values]), [
    ['implicit.stat_2005503156', [3]],
    ['explicit.stat_1582728645', [6]],
    ['explicit.stat_3860231079', [15]],
    ['explicit.stat_86321750', [6]]
  ])
  assert.match(model.stats[1].displayText, /6\(4-6\)/)
  const filters = searches[0].query.stats.flatMap(group => group.filters)
  for (const stat of model.stats) assert.ok(filters.some(filter => filter.id === stat.id && filter.value.min === stat.values[0]))
  await service.rerun({ model })
  assert.deepEqual(JSON.parse(JSON.stringify(searches[1])), JSON.parse(JSON.stringify(searches[0])))
})

test('奇亚拉的决心保留反向范围原文与64缩短值，提交负数持续时间过滤', async () => {
  const { service, searches } = fixture()
  const { model } = await service.check({ text: userKiaraFlask, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(searches[0].query.name, "Kiara's Determination")
  assert.equal(searches[0].query.type, 'Silver Flask')
  assert.deepEqual(model.unknownStats, [])
  assert.deepEqual(model.stats.map(stat => [stat.id, stat.values]), [
    ['explicit.stat_803730540', []], ['explicit.stat_1256719186', [-64]]
  ])
  assert.equal(model.stats[1].displayText, '生效时间缩短 64(80-60)%')
  const duration = searches[0].query.stats.flatMap(group => group.filters).find(filter => filter.id === 'explicit.stat_1256719186')
  assert.equal(duration.value.min, -64)
  assert.equal(duration.value.max, undefined)
  await service.rerun({ model })
  assert.deepEqual(JSON.parse(JSON.stringify(searches[1])), JSON.parse(JSON.stringify(searches[0])))
})

test('升序与降序显示范围均按两端界定合法掷值，超界和损坏范围仍拒绝', () => {
  for (const [text, expected] of [['64(80-60)', 64], ['64(60-80)', 64], ['60(80-60)', 60], ['80(80-60)', 80], ['-64(-60--80)', -64]]) assert.equal(statNumber(text), expected, text)
  for (const text of ['59(80-60)', '81(80-60)', '64(80-)', '64(未知范围)', '64(80-60)7']) assert.equal(statNumber(text), null, text)
  assert.throws(() => fixture().service.parse(userKiaraFlask.replace('64(80-60)', '81(80-60)')), /未匹配|已阻止/)
})

test('药剂十二种真实基础模板的英简繁单复数、零充能和内嵌增幅均可形成精确身份查询', async () => {
  assert.equal(new Set(flaskStructures.map(structure => structure.id)).size, 12)
  const resolver = createLocalizationTextResolver(entries)
  for (const structure of flaskStructures) for (const language of ['en', 'cn', 'tw']) {
    const text = clipboard(structure, language)
    const canonical = resolver.resolve(text, { catalog }).text
    assert.ok(canonical.includes(structure.canonical), `${structure.id}/${language}: ${canonical}`)
    const { service, searches } = fixture()
    const { model } = await service.check({ text, league: 'Covens' })
    assert.equal(searches.length, 1)
    assert.equal(searches[0].query.type, bases[structure.className])
    assert.deepEqual(model.stats, [])
    assert.deepEqual(model.unknownStats, [])
  }
})

test('完整英简繁魔法药剂得到相同官方身份与词缀条件，英文后缀不会混入底材', async () => {
  const queries = []
  for (const [language, text] of [['cn', userLifeFlask], ['en', equivalentEnglishLifeFlask], ['tw', equivalentTraditionalLifeFlask]]) {
    const { service, searches } = fixture()
    const { model } = await service.check({ text, league: 'Covens', options: { initialSelection: 'all' } })
    assert.equal(model.presentation.language, language)
    assert.equal(model.identity.type, 'Divine Life Flask')
    assert.deepEqual(model.stats.map(stat => stat.values), [[22], [7, 7]])
    queries.push(JSON.parse(JSON.stringify(searches[0])))
  }
  assert.deepEqual(queries[1], queries[0])
  assert.deepEqual(queries[2], queries[0])
})

test('英文魔法底材只接受同类完整词，嵌套底材取最长，多底材仍阻断', () => {
  const model = name => createPriceCheckModel({ rarity: '魔法', category: '匕首', name }, catalog)
  assert.equal(model('Shimmering Imperial Skean of the Rainbow').identity.type, 'Imperial Skean')
  assert.equal(model('Shimmering IMPERIAL SKEAN of the Rainbow').identity.type, 'Imperial Skean')
  assert.equal(model('Shimmering Imperial Skeanling').identity.type, 'Shimmering Imperial Skeanling')
  assert.throws(() => model('Imperial Skean and Skean'), /多个底材候选/)
})

test('药剂结构识别严格限定类别和首属性段，未知词缀与不可信模板仍阻断', () => {
  const { service, searches } = fixture()
  assert.throws(() => service.parse(userLifeFlask.replace('最大充能 +22(20-23)', '最大充能 +22(20-23)\n充能会神秘消失')), /未匹配|已阻止/)
  assert.throws(() => service.parse(userLifeFlask.replace('最大充能 +22(20-23)', '3.50 秒内回复 2400 生命')), /多个国际服候选/)
  const structure = flaskStructures.find(value => value.id === 'ItemDisplayFlaskLifeRecoveryNSeconds' && value.parameters[1] === '3.50')
  assert.ok(structure)
  const wrongClass = clipboard(structure, 'cn').replace('生命药剂', '戒指')
  assert.throws(() => service.parse(wrongClass), /多个国际服候选/)
  const badRows = entries.map(entry => /^ItemDisplayFlaskLifeRecovery/.test(entry.id) ? { ...entry, sourceHash: '0'.repeat(64) } : entry)
  assert.throws(() => fixture(badRows).service.parse(userLifeFlask), /未匹配|已阻止/)
  assert.equal(searches.length, 0)
})
