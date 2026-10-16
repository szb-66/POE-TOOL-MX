import test from 'node:test'
import assert from 'node:assert/strict'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { createPriceCheckModel, buildOfficialTradeQuery, sanitizePriceCheckModel, refreshPseudoStats } from '../electron/modules/priceCheck/query.js'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'

const { catalog } = await loadTradeCatalog()
const foulbornLeap = `物品类别: 珠宝
稀 有 度: 传奇
秽生直觉之跃
翠绿珠宝
--------
范围: 巨大
--------
物品等级: 83
--------
{ 秽生传奇词缀 }
范围内的基石天赋技能无需连接到你的天赋树即可配置
通途 — 数值不可调整
--------
拔刀而战的木匠并非疯汉，他只是不甘平凡。
--------
放置到一个天赋树的珠宝插槽中以产生效果。右键点击以移出插槽。`

const create = (text = foulbornLeap, options = {}, currentCatalog = catalog) =>
  createPriceCheckModel(parseItemInfo(text), currentCatalog, options)
const filters = (model) => buildOfficialTradeQuery(model).query.stats.flatMap(group => group.filters)

test('真实秽生直觉之跃保留名称和来源，默认精准查询且可信校验不丢失', () => {
  const parsed = parseItemInfo(foulbornLeap)
  assert.equal(parsed.name, '秽生直觉之跃')
  assert.equal(parsed.baseName, '翠绿珠宝')
  assert.equal(parsed.isMutated, true)
  assert.equal(parsed.modifiers.length, 1)
  assert.equal(parsed.modifiers[0].type, 'unique')
  assert.equal(parsed.modifiers[0].sourceSubtype, 'foulborn')
  const model = create()
  assert.equal(model.item.name, parsed.name)
  assert.equal(model.identity.displayName, parsed.name)
  assert.deepEqual(model.unknownStats, [])
  assert.equal(model.stats.length, 1)
  assert.match(model.stats[0].text, /\n通途 — 数值不可调整/)
  const submitted = structuredClone(model)
  submitted.identity.name = '伪造名称'
  submitted.identity.type = '伪造底材'
  const trusted = sanitizePriceCheckModel(submitted, catalog, model.facts, model.item.category, model)
  const query = buildOfficialTradeQuery(trusted).query
  assert.equal(query.name, '直觉之跃')
  assert.equal(query.type, '翠绿珠宝')
  assert.equal(trusted.identity.displayName, parsed.name)
  assert.equal(query.filters.misc_filters.filters.mutated.option, 'true')
  const wireFilters = JSON.parse(JSON.stringify(filters(trusted)))
  assert.deepEqual(wireFilters, [{ id: 'explicit.stat_1211779989', value: {}, disabled: false }])
})

test('全不选、普通复制和普通传奇保留既有词缀默认，价格尾标不污染身份', () => {
  assert.deepEqual(filters(create(foulbornLeap, { initialSelection: 'none' })), [])
  const plain = create(foulbornLeap.replace('{ 秽生传奇词缀 }\n', ''))
  assert.equal(plain.identity.name, '直觉之跃')
  assert.equal(plain.stateFilters.mutated, 'true')
  assert.ok(plain.stats.every(stat => !stat.enabled))
  const regular = create(foulbornLeap.replaceAll('秽生', ''))
  assert.equal(regular.identity.name, '直觉之跃')
  assert.equal(regular.stateFilters.mutated, 'any')
  assert.ok(regular.stats.every(stat => !stat.enabled))
  assert.equal(create(foulbornLeap.replace('秽生直觉之跃', '秽生直觉之跃[5d]')).identity.name, '直觉之跃')
  for (const name of ['秽生崇高石', '秽生增幅石', '秽生富豪石']) {
    const item = parseItemInfo(`物品类别: 通货\n稀 有 度: 普通\n${name}\n--------`)
    assert.equal(item.name, name)
    assert.equal(item.isMutated, false)
    assert.equal(createPriceCheckModel(item, catalog).identity.type, name)
  }
})

test('非珠宝秽生传奇及多个秽生词缀通用支持，未知词缀不被快照隐藏', () => {
  const text = `物品类别: 项链\n稀 有 度: 传奇\n秽生测试项链\n黑曜护身符\n--------\n物品等级: 83\n--------\n{ 秽生传奇词缀 }\n+20 最大生命\n{ 秽生传奇词缀 }\n+30 最大魔力\n{ 秽生传奇词缀 }\n这是目录未收录的秽生效果\n--------\n背景故事`
  const currentCatalog = { ...catalog, items: [...catalog.items, {
    unique: true, name: '测试项链', baseType: '黑曜护身符',
    uniqueSnapshotCovered: true, uniqueModifierMatchers: []
  }] }
  const model = create(text, {}, currentCatalog)
  assert.equal(model.identity.name, '测试项链')
  const explicit = model.stats.filter(stat => stat.type === 'explicit')
  assert.equal(explicit.length, 2)
  assert.ok(explicit.every(stat => stat.enabled))
  assert.equal(model.unknownStats.length, 1)
  assert.equal(model.unknownStats[0].text, '这是目录未收录的秽生效果')
  assert.equal(model.unknownStats[0].candidates.length, 0)
  assert.equal(filters(model).length, 2)
  const edited = structuredClone(model)
  edited.stats.filter(stat => stat.type === 'explicit').forEach(stat => { stat.enabled = false })
  const trusted = sanitizePriceCheckModel(edited, currentCatalog, model.facts, model.item.category, model)
  refreshPseudoStats(trusted, currentCatalog)
  assert.deepEqual(filters(trusted), [])
  assert.ok(trusted.stats.filter(stat => stat.type === 'explicit').every(stat => stat.sourceSubtype === 'foulborn'))
})

test('秽生身份完整名称优先，未知和歧义身份阻止查询', () => {
  const entry = { unique: true, name: '秽生直觉之跃', baseType: '翠绿珠宝' }
  assert.equal(create(foulbornLeap, {}, { ...catalog, items: [...catalog.items, entry] }).identity.name, entry.name)
  assert.throws(() => create(foulbornLeap.replace('秽生直觉之跃', '秽生未知传奇')), /无法识别秽生传奇/)
  assert.throws(() => create(foulbornLeap.replace('翠绿珠宝', '赤红珠宝')), /无法识别秽生传奇/)
  assert.throws(() => create(foulbornLeap, {}, { ...catalog, items: [...catalog.items, entry, entry] }), /无法识别秽生传奇/)
})

test('服务浮窗与连续重查保留用户取消词缀和秽生状态选择，未知身份不发请求', async () => {
  const requests = []
  const states = []
  const service = new PriceCheckService({
    catalog,
    auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer() {} },
    client: {
      clearCache() {},
      search: async (_league, body) => { requests.push(body); return { id: 'test', total: 0, result: [] } },
      fetch: async () => ({ result: [] })
    },
    overlay: { create: state => states.push(state), update: state => states.push(state) }
  })
  service.updateRuntime({ enabled: true })
  await service.check({ text: foulbornLeap, league: '测试赛季', execute: false })
  assert.equal(states.at(-1).status, 'ready-to-query')
  assert.equal(requests.length, 0)
  await service.rerun()
  assert.equal(requests.at(-1).query.name, '直觉之跃')
  assert.equal(requests.at(-1).query.stats[0].filters[0].id, 'explicit.stat_1211779989')
  const edited = structuredClone(service.latest.model)
  edited.stats[0].enabled = false
  edited.stateFilters.mutated = 'false'
  await service.rerun({ model: edited })
  await service.rerun()
  assert.deepEqual(requests.at(-1).query.stats[0].filters, [])
  assert.equal(requests.at(-1).query.filters.misc_filters.filters.mutated.option, 'false')
  const before = requests.length
  await assert.rejects(service.check({ text: foulbornLeap.replace('秽生直觉之跃', '秽生未知传奇'), league: '测试赛季', execute: true }), /无法识别秽生传奇/)
  assert.equal(requests.length, before)
  service.updateRuntime({ enabled: false })
})
