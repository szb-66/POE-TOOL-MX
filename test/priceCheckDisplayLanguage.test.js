import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { buildOfficialTradeQuery } from '../electron/modules/priceCheck/query.js'
import { applyOriginalModifierText } from '../electron/modules/priceCheck/displayText.js'
import { localizedDagger } from './fixtures/priceCheckLocalizedDagger.js'

const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
const entry = (id, en, cn, extra = {}) => ({ kind: 'dat', table: 'BaseItemTypes', field: 'Name',
  id, en, cn, tw: cn, sourceHash: createHash('sha256').update(en).digest('hex'), ...extra })
const entries = [
  entry('Metadata/Items/Rings/Ring3', 'Coral Ring', '珊瑚戒指'),
  entry('base_maximum_life', '+{0} to maximum Life', '+{0} 最大生命', { kind: 'stat' }),
  entry('base_maximum_mana', '+{0} to maximum Mana', '+{0} 最大魔力', { kind: 'stat' })
]
const original = `物品类别: 戒指
稀有度: 稀有
风暴之环
珊瑚戒指
--------
物品等级: 80
--------
{ 前缀属性 "健壮的" (等阶: 1) — 生命, 魔力 }
+89(80-99) 最大生命
+23(20-29) 最大魔力`
const english = `Item Class: Rings
Rarity: Rare
Storm Circle
Coral Ring
--------
Item Level: 80
--------
{ Prefix Modifier "Healthy" (Tier: 1) — Life, Mana }
+89(80-99) to maximum Life
+23(20-29) to maximum Mana`

function fixture() {
  const searches = []
  const client = { server: { id: 'international', label: '国际服' }, clearCache() {},
    search: async (league, query) => { searches.push({ league, query }); return { id: 'fixture', total: 0, result: [] } },
    fetch: async () => ({ result: [] }) }
  const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) },
    client, catalog, manualInputOnly: true, localizationProvider: () => entries })
  return { service, searches }
}

test('中文详细词缀按原文显示，分开的效果保留数值范围，国际服查询与英文等价', () => {
  const { service } = fixture()
  const localized = service.parse(original, { initialSelection: 'all' })
  const canonical = service.parse(english, { initialSelection: 'all' })
  assert.deepEqual(localized.stats.map(stat => stat.displayText), ['+89(80-99) 最大生命', '+23(20-29) 最大魔力'])
  assert.deepEqual(localized.stats.map(stat => stat.sources[0].displayText), localized.stats.map(stat => stat.displayText))
  assert.deepEqual(localized.stats.map(stat => stat.text), canonical.stats.map(stat => stat.text))
  assert.deepEqual(localized.stats.map(stat => stat.values), [[89], [23]])
  assert.deepEqual(buildOfficialTradeQuery(localized), buildOfficialTradeQuery(canonical))
  assert.ok(canonical.stats.every(stat => !/[\u3400-\u9fff]/u.test(stat.text)))
})

test('中文词缀原文经过查询、模型净化和重试仍保留，筛选边界照常可改', async () => {
  const { service, searches } = fixture()
  const first = await service.check({ league: 'Covens', text: original, options: { initialSelection: 'all' } })
  const model = structuredClone(first.model)
  model.stats[0].min = 90
  const rerun = await service.rerun({ model })
  assert.deepEqual(rerun.model.stats.map(stat => stat.displayText), first.model.stats.map(stat => stat.displayText))
  assert.deepEqual(rerun.model.stats.map(stat => stat.sources[0].displayText), first.model.stats.map(stat => stat.sources[0].displayText))
  assert.equal(searches.length, 2)
  assert.equal(searches[1].query.query.stats[0].filters[0].value.min, 90)
  assert.equal(rerun.model.stats[0].displayText, '+89(80-99) 最大生命')
})

test('多行官方词缀与合并来源按同一多行原文显示，保留原文用词和范围', () => {
  const canonical = '+89 to maximum Life\n+23 to maximum Mana'
  const original = '+89(80-99) 最大生命\n+23(20-29) 最大魔力值'
  const model = { stats: [{ id: 'explicit.stat_3299347043', text: canonical,
    values: [89, 23], sources: [{ text: '+89 to maximum Life' }, { text: '+23 to maximum Mana' }] }] }
  applyOriginalModifierText(model, [{ canonical, original }])
  assert.equal(model.stats[0].displayText, original)
  assert.equal(model.stats[0].text, canonical)
  assert.deepEqual(model.stats[0].sources.map(source => source.displayText), original.split('\n'))
  assert.deepEqual(model.stats[0].values, [89, 23])
})

test('相同数值的不同词缀来源各保留自己的范围，一行翻译成多行仍显示原文', () => {
  const model = { stats: [
    { text: '+20 to maximum Life', sources: [{ text: '+20 to maximum Life' }] },
    { text: '+20 to maximum Life', sources: [{ text: '+20 to maximum Life' }] },
    { text: '+23 to maximum Mana', sources: [{ text: '+23 to maximum Mana' }] }
  ] }
  applyOriginalModifierText(model, [
    { canonical: '+20(20-30) to maximum Life', original: '+20(20-30) 最大生命' },
    { canonical: '+20(10-29) to maximum Life', original: '+20(10-29) 最大生命' },
    { canonical: '+23 to maximum Mana\nRegenerate 1 Life per second', original: '+23 最大魔力，且每秒回复 1 生命' }
  ])
  assert.deepEqual(model.stats.map(stat => stat.displayText), [
    '+20(20-30) 最大生命', '+20(10-29) 最大生命', '+23 最大魔力，且每秒回复 1 生命'
  ])
})

test('用户提供的蚕食之暗完整文本显示六条中文词缀，并保留实际掷值', async () => {
  const entries = JSON.parse(await readFile(new URL('./fixtures/price-check-localized-dagger-entries.json', import.meta.url), 'utf8'))
  const { service } = fixture()
  service.localizationProvider = () => entries
  const model = service.parse(localizedDagger, { initialSelection: 'all' })
  assert.deepEqual(model.stats.map(stat => stat.displayText), [
    '全域暴击率提高 52(50-55)%',
    '30% 的火焰伤害转换为混沌伤害',
    '所有火焰法术主动技能石等级 +1',
    '火焰伤害提高 46(40-60)%',
    '+23(20-40) 智慧',
    '你的混沌伤害有 60% 的几率使敌人中毒'
  ])
  assert.deepEqual(model.stats.map(stat => stat.values), [[52], [30], [1], [46], [23], [60]])
  assert.deepEqual(model.unknownStats, [])
  assert.equal(buildOfficialTradeQuery(model).query.stats[0].filters.length, 6)
})
