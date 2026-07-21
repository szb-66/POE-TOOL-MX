import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
  CraftingPriceService,
  convertPricesToChaos,
  estimateResources,
  normalizeSummaryPrices,
  priceHealth
} from '../electron/modules/crafting/priceService.js'

const now = Date.parse('2026-07-21T12:00:00+08:00')
const payload = [{ category_label: '通货', items: [
  { item_name: '混沌石', engname: 'Chaos Orb', sell_avg: 1, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' },
  { item_name: '神圣石', engname: 'Divine Orb', sell_avg: 150, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' },
  { item_name: '高价资源', engname: 'Expensive', sell_avg: 2, currency_unit: 'd', latest_datetime: '2026-07-21 11:00:00' },
  { item_name: '异常资源', engname: 'Broken', sell_avg: 10, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00', error: true, error_info: 'OCR 故障' }
]}]

test('公开 sell_avg 和 d 单位统一换算为混沌石', () => {
  const records = normalizeSummaryPrices(payload)
  const converted = convertPricesToChaos(records)
  assert.equal(converted.find((entry) => entry.itemName === '高价资源').chaosValue, 300)
  assert.equal(converted.find((entry) => entry.itemName === '异常资源').valid, false)
  assert.equal(records[0].resourceId, 'currency:chaos')
})

test('超过 24 小时和 OCR 异常价格被拒用', () => {
  assert.equal(priceHealth({ sellAverage: 1, error: false, observedAt: '2026-07-20 10:00:00' }, now).valid, false)
  assert.equal(priceHealth({ sellAverage: 1, error: true, errorInfo: '坏数据', observedAt: '2026-07-21 11:00:00' }, now).reason, '坏数据')
})

test('单条价格缺少时间时标记无效但不阻断整批刷新', () => {
  const records = normalizeSummaryPrices([{ items: [
    { item_name: '混沌石', engname: 'Chaos Orb', sell_avg: 1, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' },
    { item_name: '缺时间资源', engname: 'No Time', sell_avg: 2, currency_unit: 'c' }
  ] }])
  assert.equal(records.length, 2)
  const invalid = convertPricesToChaos(records).find((entry) => entry.itemName === '缺时间资源')
  assert.equal(invalid.valid, false)
  assert.equal(invalid.reason, '价格时间缺失')
})

test('缺失均价和未知单位同样只拒用单条记录', () => {
  const records = normalizeSummaryPrices([{ items: [
    { item_name: '正常资源', sell_avg: 1, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' },
    { item_name: '格式损坏资源', sell_avg: null, currency_unit: 'x', latest_datetime: '2026-07-21 11:00:00' }
  ] }])
  const converted = convertPricesToChaos(records)
  assert.equal(converted.find((entry) => entry.itemName === '正常资源').valid, true)
  assert.equal(converted.find((entry) => entry.itemName === '格式损坏资源').valid, false)
})

test('卖方均价为 0 时回退到正数买方均价并标记来源', () => {
  const records = normalizeSummaryPrices([{ items: [
    { item_name: '增幅石', engname: 'Orb of Augmentation', sell_avg: 0, buy_avg: 0.08, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' }
  ] }])
  const converted = convertPricesToChaos(records)
  assert.equal(converted[0].valid, true)
  assert.equal(converted[0].chaosValue, 0.08)
  assert.equal(converted[0].source, 'remote-buy-fallback')
})

test('新版中文剥离石映射到无效通货资源', () => {
  const [record] = normalizeSummaryPrices([{ items: [
    { item_name: '剥离石', sell_avg: 1, currency_unit: 'c', latest_datetime: '2026-07-21 11:00:00' }
  ] }])
  assert.equal(record.resourceId, 'currency:annulment')
})

test('本地覆盖优先，资源估价不包含底材成本', () => {
  const records = normalizeSummaryPrices(payload)
  const estimate = estimateResources([{ resourceId: 'currency:chaos', resourceName: '混沌石', amount: 5 }], records, { 'currency:chaos': 2 })
  assert.equal(estimate.totalChaos, 10)
  assert.equal(estimate.baseCostChaos, 0)
  assert.equal(estimate.details[0].source, 'override')
})

test('价格服务缓存一小时并持久化覆盖', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-price-'))
  let calls = 0
  const fetchImpl = async () => ({ ok: true, json: async () => { calls += 1; return payload } })
  const service = new CraftingPriceService({ storageRoot: root, fetchImpl, now: () => now })
  await service.initialize()
  await service.refresh()
  await service.refresh()
  assert.equal(calls, 1)
  await service.setOverride('currency:chaos', 1.5)
  assert.equal(service.getSnapshot().overrides['currency:chaos'], 1.5)
  await service.removeOverride('currency:chaos')
  assert.equal(service.getSnapshot().overrides['currency:chaos'], undefined)
})
