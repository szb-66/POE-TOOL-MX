import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTradeCatalog, createOfficialTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { createPriceCheckModel, buildOfficialTradeQuery, sanitizePriceCheckModel, refreshPseudoStats } from '../electron/modules/priceCheck/query.js'
import * as samples from './fixtures/priceCheckRealItems.js'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'

const { catalog } = await loadTradeCatalog()
const model = (text, options = {}) => createPriceCheckModel(parseItemInfo(text), catalog, options)
const recheck = (submitted, trusted) => sanitizePriceCheckModel(submitted, catalog, trusted.facts, trusted.item.category, trusted)

test('真实宝石保留变体、等级 1，需求与描述不是词缀', () => {
  const m = model(samples.gem)
  assert.equal(m.item.gemLevel, 1)
  assert.deepEqual(m.unknownStats, [])
  assert.deepEqual(m.stats, [])
  m.properties.find(p => p.id === 'misc.gemLevel').enabled = true
  const q = buildOfficialTradeQuery(recheck(m, m)).query
  assert.deepEqual(q.type, { discriminator: 'alt_x', option: '爆裂箭雨' })
  assert.equal(q.filters.misc_filters.filters.gem_level.min, 1)
  const forged = structuredClone(m)
  forged.item.category = '头部'
  assert.equal(sanitizePriceCheckModel(forged, catalog).identity.discriminator, undefined)
  const normal = model(samples.gem.replace('特拉特斯之爆裂箭雨', '爆裂箭雨').replace('## 改造', ''))
  assert.equal(buildOfficialTradeQuery(normal).query.type, '爆裂箭雨')
  assert.throws(() => model(samples.gem.replace('特拉特斯之爆裂箭雨', '不存在之宝石')), /特殊物品/)
})

test('两种真实菌潮地图身份和区域经可信校验不丢失', () => {
  for (const [text, discriminator, option, tier] of [
    [samples.blighted, 'blighted', '53902', 13],
    [samples.uberBlighted, 'uberblighted', '11490', 16]
  ]) {
    const m = model(text)
    const submitted = structuredClone(m)
    submitted.identity.type = '伪造底材'
    submitted.identity.discriminator = 'chart'
    const q = buildOfficialTradeQuery(recheck(submitted, m)).query
    assert.deepEqual(q.type, { discriminator, option })
    assert.deepEqual(q.filters.map_filters.filters.map_tier, { min: tier, max: tier })
    assert.throws(() => model(text.replace(/地图区域: .+/, '地图区域: 未知区域')), /特殊物品/)
  }
})

test('日志平铺合并为 63，区域派系去重且保留来源，重算和重查稳定', () => {
  const parsed = parseItemInfo(samples.logbook)
  assert.equal(parsed.logbookRegions.length, 3)
  const m = model(samples.logbook)
  assert.deepEqual(m.unknownStats, [])
  assert.equal(m.stats.filter(s => s.type === 'implicit').length, 5)
  assert.equal(m.stats.filter(s => s.type === 'pseudo').length, 4)
  assert.ok(m.stats.every(s => s.enabled))
  const merged = m.stats.find(s => s.id === 'implicit.stat_1915989164')
  assert.equal(merged.min, 63)
  assert.match(merged.text, /63%/)
  assert.equal(merged.max, undefined)
  assert.equal(merged.sources.length, 2)
  assert.match(merged.sources[0].text, /森林废墟.*33\(10-40\)/)
  assert.match(merged.sources[1].text, /船骸礁岩.*30\(10-40\)/)
  assert.deepEqual(m.stats.filter(s => s.type === 'implicit').map(s => s.min).sort((a,b)=>a-b), [19,28,37,38,63])
  const property = m.properties.find(p => p.id === 'misc.itemLevel')
  assert.equal(property.enabled, true)
  assert.equal(property.min, 83)
  assert.equal(property.max, undefined)
  const area = m.stats.find(s => /area_scrublands$/.test(s.id))
  area.enabled = false
  refreshPseudoStats(m, catalog)
  const q = buildOfficialTradeQuery(recheck(m, m)).query
  assert.equal(q.stats.flatMap(g=>g.filters).length, 8)
  assert.ok(!q.stats.flatMap(g=>g.filters).some(s => s.id === area.id))
  const none = model(samples.logbook, { initialSelection: 'none' })
  assert.ok(none.stats.every(s => !s.enabled))
  assert.ok(none.properties.every(p => !p.enabled))
  assert.equal(buildOfficialTradeQuery(none).query.stats[0].filters.length, 0)
  const missing = model(samples.logbook.replace('灌木之地', '未知地区'))
  assert.ok(missing.unknownStats.some(s => s.text.includes('未知地区')))
})

test('赏金猎人三件装备映射正确且不误报说明', () => {
  for (const [text, type, category, count] of [
    [samples.tool, '基础易容工具', 'heistequipment.heisttool', 2],
    [samples.cloak, '破旧披风', 'heistequipment.heistutility', 4],
    [samples.brooch, '珐琅胸针', 'heistequipment.heistreward', 4]
  ]) {
    const m = model(text, { initialSelection: 'all' })
    assert.equal(m.identity.type, type)
    assert.equal(m.identity.category, category)
    assert.deepEqual(m.unknownStats, [])
    assert.equal(m.stats.filter(s => s.type !== 'pseudo').length, count)
    assert.equal(buildOfficialTradeQuery(m).query.type, type)
  }
})

test('赏金猎人费用减免提交负向上限，目录刷新及取消勾选保持正确', () => {
  const payload = { result: [{ id: 'explicit', entries: catalog.stats
    .filter(e => typeof e.ids.explicit === 'string')
    .map(e => ({ id: e.ids.explicit, type: 'explicit', text: e.matchers[0] })) }] }
  const refreshed = createOfficialTradeCatalog(catalog, payload).catalog
  for (const current of [catalog, refreshed]) {
    for (const [text, id, amount] of [
      [samples.tool, 'explicit.stat_2257592286', 7],
      [samples.brooch, 'explicit.stat_2257592286', 10],
      [samples.cloak, 'explicit.stat_2904116257', 9],
      [samples.tool.replace('招募费用减少', '赏金猎人招募费用降低'), 'explicit.stat_2257592286', 7]
    ]) {
      const m = createPriceCheckModel(parseItemInfo(text), current, { initialSelection: 'all' })
      const fee = m.stats.find(s => s.id === id)
      assert.equal(fee.valueMultiplier, -1)
      // Reproduce the screenshot: the reduction amount is entered as a minimum.
      fee.min = amount
      fee.max = undefined
      const filters = () => buildOfficialTradeQuery(sanitizePriceCheckModel(m, current, m.facts, m.item.category, m)).query.stats.flatMap(g => g.filters)
      assert.deepEqual(JSON.parse(JSON.stringify(filters().find(s => s.id === id).value)), { max: -amount })
      fee.enabled = false
      assert.ok(!filters().some(s => s.id === id))
    }
  }
})

test('赏金猎人速度、掉落和经验正负描述使用同一官方项的相反数值', () => {
  for (const [positive, negative, id] of [
    ['任务速度加快', '任务速度减慢', '2978905446'],
    ['夺宝冒险中掉落的物品稀有度提高', '夺宝冒险中掉落的物品稀有度降低', '2833896424'],
    ['夺宝冒险中掉落的物品数量提高', '夺宝冒险中掉落的物品数量降低', '3683643898'],
    ['任务经验获取率提高', '任务经验获取率降低', '3569230441']
  ]) {
    for (const [label, negativeDirection] of [[positive, false], [negative, true]]) {
      const text = `物品类别: 赏金猎人披风\n稀 有 度: 稀有\n符纹 道具\n破旧披风\n--------\n{ 后缀属性 }\n${label} 15%`
      const m = model(text, { initialSelection: 'all' })
      const stat = m.stats.find(s => s.id === `explicit.stat_${id}`)
      assert.ok(stat)
      stat.min = 15
      stat.max = undefined
      const q = buildOfficialTradeQuery(recheck(m, m)).query
      assert.equal(q.type, '破旧披风')
      assert.deepEqual(JSON.parse(JSON.stringify(q.stats[0].filters[0].value)), negativeDirection ? { max: -15 } : { min: 15 })
    }
  }
})

test('真实硫磺喷灯的任务速度和工程学速度是独立过滤项', () => {
  const m = model(samples.sulphurBlowtorch, { initialSelection: 'none' })
  assert.deepEqual(m.unknownStats, [])
  const speed = m.stats.find(s => s.id === 'explicit.stat_2978905446')
  assert.ok(speed)
  speed.enabled = true
  const q = buildOfficialTradeQuery(recheck(m, m)).query
  assert.equal(q.type, '硫磺喷灯')
  assert.deepEqual(JSON.parse(JSON.stringify(q.stats[0].filters)), [{ id: 'explicit.stat_2978905446', value: { min: 15 }, disabled: false }])
  assert.ok(m.stats.some(s => s.id === 'implicit.stat_3211817426' && s.min === 11))
  assert.ok(!m.stats.some(s => s.id === 'explicit.stat_3211817426'))
  speed.enabled = false
  assert.equal(buildOfficialTradeQuery(recheck(m, m)).query.stats[0].filters.length, 0)
})

test('退化传奇需明确同意后才按名称查询且可信限制无法删除', () => {
  const m = model(samples.vestigial)
  assert.equal(m.stats.length, 6)
  assert.deepEqual(m.unknownStats, [])
  assert.throws(() => buildOfficialTradeQuery(m), /退化版本/)
  const tampered = structuredClone(m)
  delete tampered.identityPrecision
  tampered.identity.type = '黄金之面'
  assert.throws(() => buildOfficialTradeQuery(recheck(tampered, m)), /退化版本/)
  m.identityPrecision.allowNameOnly = true
  const q = buildOfficialTradeQuery(recheck(m, m)).query
  assert.equal(q.name, '意志交锋')
  assert.equal(q.type, undefined)
  assert.equal(q.filters.misc_filters.filters.corrupted.option, 'true')
})

test('实际服务重查保留特殊身份、日志勾选与退化确认', async () => {
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
    overlay: { create: (state) => states.push(state), update: (state) => states.push(state) }
  })
  service.updateRuntime({ enabled: true })
  await service.check({ text: samples.vestigial, league: '测试赛季' })
  assert.equal(requests.length, 0)
  assert.equal(states.at(-1).status, 'ready-to-query')
  await service.rerun()
  assert.equal(requests.length, 0)
  const confirmed = structuredClone(service.latest.model)
  confirmed.identityPrecision.allowNameOnly = true
  await service.rerun({ model: confirmed })
  assert.equal(requests.length, 1)
  assert.equal(requests.at(-1).query.type, undefined)
  assert.equal(requests.at(-1).query.name, '意志交锋')
  for (const [text, expected] of [[samples.gem, 'alt_x'], [samples.blighted, 'blighted'], [samples.uberBlighted, 'uberblighted']]) {
    await service.check({ text, league: '测试赛季', execute: false })
    await service.rerun()
    assert.equal(requests.at(-1).query.type.discriminator, expected)
  }
  await service.check({ text: samples.logbook, league: '测试赛季', execute: false })
  const edited = structuredClone(service.latest.model)
  edited.stats.find(s => /area_scrublands$/.test(s.id)).enabled = false
  await service.rerun({ model: edited })
  assert.equal(requests.at(-1).query.stats.flatMap(g => g.filters).length, 8)
  assert.equal(service.latest.model.stats.find(s => s.id === 'implicit.stat_1915989164').sources.length, 2)
  service.updateRuntime({ enabled: false })
})
