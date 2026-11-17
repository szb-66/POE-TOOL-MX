import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { createLocalizationDictionary } from '../electron/modules/localization/text.js'

const catalog = JSON.parse(readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)))
const entries = JSON.parse(readFileSync(new URL('./fixtures/price-check-rarity-entries.json', import.meta.url)))
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

const fixture = () => {
  const searches = []
  const service = new PriceCheckService({ catalog, localizationProvider: () => entries, manualInputOnly: true,
    auth: { getStatus: () => ({ authenticated: true }) },
    client: { server: { id: 'international' }, clearCache() {},
      async search(league, query) { searches.push(query); return { id: 'rarity', total: 0, result: [] } },
      async fetch() { return { result: [] } } }
  })
  return { service, searches }
}

test('真实帝金护身符按装备基底解析稀有度，保留全部五条词缀和数值', async () => {
  const { service, searches } = fixture()
  const { model } = await service.check({ text: amuletText, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(model.identity.type, 'Gold Amulet')
  assert.deepEqual(model.unknownStats, [])
  assert.equal(model.stats.length, 5)
  const rarity = model.stats.find(stat => stat.id === 'implicit.stat_3917489142')
  assert.deepEqual(rarity?.values, [16])
  assert.equal(rarity.displayText, '物品稀有度 +16(12-20)%')
  const filters = searches[0].query.stats.flatMap(group => group.filters)
  assert.equal(filters.find(filter => filter.id === rarity.id).value.min, 16)
  assert.equal(filters.some(filter => filter.id === 'implicit.stat_190932737'), false)
})

test('相同中文地图基底保留地图专用词缀，不套用装备稀有度', () => {
  const { service } = fixture()
  const model = service.parse('物品类别: 异界地图\n稀有度: 普通\nFortress Map\n--------\n地图阶级: 17\n--------\n物品等级: 83\n--------\n{ 基底属性 }\n物品稀有度 +16(12-20)%')
  assert.ok(model.stats.some(stat => stat.id === 'implicit.stat_190932737' && stat.values[0] === 16))
  assert.equal(model.stats.some(stat => stat.id === 'implicit.stat_3917489142'), false)
})

test('普通复制的implicit尾标使用相同物品类别，缺少上下文时仍阻止歧义', () => {
  const { service } = fixture()
  const plain = amuletText.replace('{ 基底属性— 丟置 }\n物品稀有度 +16(12-20)%', '物品稀有度 +16(12-20)% (implicit)')
  assert.ok(service.parse(plain).stats.some(stat => stat.id === 'implicit.stat_3917489142'))
  assert.throws(() => createLocalizationDictionary(entries).toEnglish('物品稀有度 +16(12-20)%'), error => error.code === 'LOCALIZATION_AMBIGUOUS')
})
