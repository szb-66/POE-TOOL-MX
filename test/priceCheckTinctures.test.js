import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createLocalizationTextResolver } from '../electron/modules/localization/text.js'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { userAshbarkTincture } from './fixtures/priceCheckTincture.js'

const entries = JSON.parse(await readFile(new URL('./fixtures/price-check-tincture-entries.json', import.meta.url)))
const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)))
const structures = entries.filter(entry => entry.table === 'clientstrings' && /^ItemDisplayTincture/.test(entry.id))
const base = entries.find(entry => entry.table === 'baseitemtypes')
const itemClass = entries.find(entry => entry.table === 'itemclasses')

function fixture(dictionary = entries) {
  const searches = []
  const service = new PriceCheckService({ catalog, localizationProvider: () => dictionary, manualInputOnly: true,
    auth: { getStatus: () => ({ authenticated: true }) },
    client: { server: { id: 'international' }, clearCache() {},
      async search(league, query) { searches.push(query); return { id: 'tincture', total: 0, result: [] } },
      async fetch() { return { result: [] } } }
  })
  return { service, searches }
}

function structuralText(row, value, language) {
  const prefix = language === 'en' ? 'Item Class' : language === 'tw' ? '物品種類' : '物品类别'
  const rarity = language === 'en' ? 'Rarity: Normal' : '稀有度: 普通'
  const level = language === 'en' ? 'Item Level: 73' : language === 'tw' ? '物品等級: 73' : '物品等级: 73'
  return `${prefix}: ${itemClass[language]}\n${rarity}\n${base[language]}\n--------\n${row[language].replace('{0}', value)}\n--------\n${level}`
}

test('用户完整烬皮酊剂保留点燃几率、伤害和击败回复生命三个真实词缀', async () => {
  const { service, searches } = fixture()
  const { model } = await service.check({ text: userAshbarkTincture, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(model.identity.type, 'Ashbark Tincture')
  assert.equal(model.item.category, '酊剂')
  assert.deepEqual(model.unknownStats, [])
  assert.equal(model.stats.length, 3)
  assert.equal(searches[0].query.type, 'Ashbark Tincture')
  assert.equal(searches[0].query.filters.type_filters.filters.category.option, 'tincture')
  const filters = searches[0].query.stats.flatMap(group => group.filters)
  for (const [id, value] of [['implicit.stat_4206255461', 25], ['implicit.stat_3935936274', 86], ['explicit.stat_2507321875', 14]]) {
    const stat = model.stats.find(stat => stat.id === id)
    assert.ok(stat, id)
    assert.deepEqual(stat.values, [value])
    assert.equal(filters.find(filter => filter.id === id).value.min, value)
  }
  assert.match(model.stats.find(stat => stat.id === 'implicit.stat_3935936274').displayText, /86\(60-90\)%/)
  assert.match(model.stats.find(stat => stat.id === 'explicit.stat_2507321875').displayText, /14\(11-15\)/)
  await service.rerun({ model })
  assert.deepEqual(JSON.parse(JSON.stringify(searches[1])), JSON.parse(JSON.stringify(searches[0])))
})

test('酊剂四个真实结构模板在英简繁下保留秒数、单复数和增幅标记', async () => {
  assert.equal(structures.length, 4)
  assert.ok(entries.every(entry => entry.sourceHash === createHash('sha256').update(entry.en).digest('hex')))
  const resolver = createLocalizationTextResolver(entries)
  for (const row of structures) {
    const values = row.id.endsWith('1Second') ? ['1'] : ['0.60', '7', '2.20 (augmented)']
    for (const value of values) for (const language of ['en', 'cn', 'tw']) {
      const text = structuralText(row, value, language)
      assert.ok(resolver.resolve(text, { catalog }).text.includes(row.en.replace('{0}', value)), `${row.id}/${value}/${language}`)
      const { service, searches } = fixture()
      const { model } = await service.check({ text, league: 'Covens' })
      assert.equal(searches[0].query.type, 'Ashbark Tincture')
      assert.equal(searches[0].query.filters.type_filters.filters.category.option, 'tincture')
      assert.deepEqual(model.stats, [])
      assert.deepEqual(model.unknownStats, [])
    }
  }
})

test('签名游戏译名和词缀组成的英繁等价酊剂产生相同查询', async () => {
  const { service: originalService, searches: originalSearches } = fixture()
  await originalService.check({ text: userAshbarkTincture, league: 'Covens', options: { initialSelection: 'all' } })
  const suffix = entries.find(entry => entry.table === 'mods' && entry.en === 'of Success')
  const render = (id, value, language, kind = 'stat') => entries.find(entry => entry.kind === kind && entry.id === id && entry.field !== 'variant:1')[language].replace('{0}', value)
  // Equivalent formats assembled from unchanged signed game rows, not newly captured clipboard samples.
  for (const language of ['en', 'tw']) {
    const text = [
      `${language === 'en' ? 'Item Class' : '物品種類'}: ${itemClass[language]}`,
      language === 'en' ? 'Rarity: Magic' : '稀有度: 魔法',
      language === 'en' ? `${base.en} ${suffix.en}` : `${suffix.tw}${base.tw}`,
      '--------',
      render('ItemDisplayTinctureToxicityNSeconds', '0.60', language, 'dat'),
      render('ItemDisplayTinctureCooldownNSeconds', '7', language, 'dat'),
      '--------', language === 'en' ? 'Item Level: 73' : '物品等級: 73', '--------',
      '{ Implicit Modifier }',
      render('chance_to_ignite_%_with_tinctured_weapons', '25', language),
      render('ignite_damage_+%_with_tinctured_weapons', '86(60-90)', language),
      '--------', `{ Suffix Modifier "${suffix[language]}" (Tier: 4) }`,
      render('life_gained_on_killing_enemies_with_tinctured_weapons', '14(11-15)', language)
    ].join('\n')
    const { service, searches } = fixture()
    const { model } = await service.check({ text, league: 'Covens', options: { initialSelection: 'all' } })
    assert.equal(model.presentation.language, language)
    assert.deepEqual(JSON.parse(JSON.stringify(searches[0])), JSON.parse(JSON.stringify(originalSearches[0])))
  }
})

test('酊剂结构只适用于首属性段且不能绕过未知词缀或无效源模板', () => {
  const { service } = fixture()
  assert.throws(() => service.parse(userAshbarkTincture.replace('每击败一名敌人获得 14(11-15) 点生命', '每击败一名敌人获得 14(11-15) 点生命\n造成 99 未知酊剂效果')), /未匹配|已阻止/)
  assert.throws(() => service.parse(userAshbarkTincture.replace('近战武器每击败一名敌人获得 14(11-15) 点生命', '每 0.60 秒造成魔力燃烧')), /多个国际服候选|未匹配/)
  const row = structures.find(entry => entry.id === 'ItemDisplayTinctureToxicityNSeconds')
  assert.throws(() => service.parse(structuralText(row, '0.60', 'cn').replace('物品类别: 酊剂', '物品类别: 戒指')), /多个国际服候选|未匹配/)
  const badRows = entries.map(entry => /^ItemDisplayTinctureToxicity/.test(entry.id) ? { ...entry, sourceHash: '0'.repeat(64) } : entry)
  assert.throws(() => fixture(badRows).service.parse(userAshbarkTincture), /未匹配|已阻止/)
})
