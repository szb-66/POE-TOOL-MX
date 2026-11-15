import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { userRareMap } from './fixtures/priceCheckCategoryCorpus.js'

const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
const entries = JSON.parse(await readFile(new URL('./fixtures/price-check-map-full-entries.json', import.meta.url), 'utf8'))

function parsingService() {
  return new PriceCheckService({ catalog, manualInputOnly: true, localizationProvider: () => entries,
    auth: { getStatus: () => ({ authenticated: true }) }, client: { server: { id: 'international' } } })
}

test('当前词缀类型仅有反向官方文案时正确转换负回复值', () => {
  const service = parsingService()
  const header = 'Item Class: Rings\nRarity: Normal\nCoral Ring\n--------\nItem Level: 80\n--------\n'
  for (const modifier of ['Lose 2% of Life on Kill (implicit)', '{ Implicit Modifier }\nLose 2% of Life on Kill']) {
    const model = service.parse(header + modifier)
    assert.deepEqual(model.unknownStats, [], modifier)
    const stat = model.stats.find(stat => stat.id === 'implicit.stat_2023107756')
    assert.ok(stat, modifier)
    assert.equal(stat.values[0], -2, modifier)
  }
  const explicit = service.parse(header + 'Lose 2% of Life on Kill')
  assert.deepEqual(explicit.unknownStats, [])
  assert.ok(explicit.stats.some(stat => stat.id === 'explicit.stat_751813227' && stat.values[0] === 2))
})

test('普通复制的附魔后缀仅决定当前行的官方词缀类型', () => {
  const model = parsingService().parse(`Item Class: Wands
Rarity: Normal
Driftwood Wand
--------
Item Level: 80
--------
元素伤害提高 15% (enchant)
--------
元素伤害提高 16%`)
  assert.deepEqual(model.unknownStats, [])
  assert.ok(model.stats.some(stat => stat.id === 'enchant.stat_692420067' && stat.values[0] === 15))
  assert.ok(model.stats.some(stat => stat.type === 'explicit' && stat.values[0] === 16))
})

test('固定说明与未知词缀位于同一段时不得整段省略', () => {
  const text = userRareMap.replace('只能被使用一次。\n--------', '只能被使用一次。\n+1 未知词缀\n--------')
  assert.throws(() => parsingService().parse(text), /未知词缀|未匹配当前汉化资源/)
})

test('稀有随机名称与真实词缀同名时保留随机名称并继续解析底材', () => {
  const model = parsingService().parse(userRareMap.replace('苍空轨迹', '怪物免疫晕眩'))
  assert.equal(model.identity.type, 'Map')
  assert.equal(model.identity.name, '')
  assert.deepEqual(model.unknownStats, [])
  assert.equal(model.stats.length, 7)
})

test('用户完整汉化地图保留15阶、腐化状态和全部七条词缀', async () => {
  const searches = []
  const service = new PriceCheckService({
    catalog,
    manualInputOnly: true,
    localizationProvider: () => entries,
    auth: { getStatus: () => ({ authenticated: true }) },
    client: {
      server: { id: 'international', label: '国际服' },
      clearCache() {},
      search: async (league, query) => {
        searches.push(query)
        return { id: 'user-map', total: 0, result: [] }
      },
      fetch: async () => ({ result: [] })
    }
  })
  const { model } = await service.check({ text: userRareMap, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(searches.length, 1)
  const query = searches[0].query
  assert.deepEqual(query.type, { discriminator: 'map', option: 'Map' })
  assert.deepEqual(query.filters.map_filters.filters.map_tier, { min: 15, max: 15 })
  assert.equal(query.filters.misc_filters.filters.corrupted.option, 'true')
  assert.deepEqual(model.unknownStats, [])
  const expected = [
    ['implicit.stat_3737068014', -15],
    ['explicit.stat_1041951480', undefined],
    ['explicit.stat_1000591322', undefined],
    ['explicit.stat_365540634', 25],
    ['explicit.stat_1054098949', 40],
    ['explicit.stat_1910157106', undefined]
  ]
  const filters = query.stats.flatMap(group => group.filters)
  for (const [id, value] of expected) {
    const stat = model.stats.find(stat => stat.id === id)
    assert.ok(stat, `应保留 ${id}`)
    assert.ok(filters.some(filter => filter.id === id), `查询应包含 ${id}`)
    if (value !== undefined) assert.equal(stat.values[0], value, id)
  }
  const life = model.stats.find(stat => ['explicit.stat_95249895', 'explicit.stat_2710898947'].includes(stat.id))
  assert.ok(life, '应保留怪物生命总增')
  assert.equal(life.values[0], 29)
  assert.ok(filters.some(filter => filter.id === life.id))
})
