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
  const abnormal = converted.find((entry) => entry.itemName === '异常资源')
  assert.equal(abnormal.valid, true)
  assert.equal(abnormal.chaosValue, 10)
  assert.equal(abnormal.warning, 'OCR 故障')
  assert.equal(records[0].resourceId, 'currency:chaos')
})

test('超过 24 小时的价格被拒用，OCR 异常价格保留并警告', () => {
  assert.equal(priceHealth({ sellAverage: 1, error: false, observedAt: '2026-07-20 10:00:00' }, now).valid, false)
  const abnormal = priceHealth({ sellAverage: 1, error: true, errorInfo: '坏数据', observedAt: '2026-07-21 11:00:00' }, now)
  assert.equal(abnormal.valid, true)
  assert.equal(abnormal.warning, '坏数据')
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

test('今日均价全零时按卖方、买方顺序回退昨日均价', () => {
  const records = normalizeSummaryPrices([{ items: [
    { item_name: '神圣石', engname: 'Divine Orb', sell_avg: 0, buy_avg: 0, sell_avg_yesterday: 150, buy_avg_yesterday: 160, currency_unit: 'c', latest_datetime: '2026-07-21 23:00:00' },
    { item_name: '增幅石', engname: 'Orb of Augmentation', sell_avg: 0, buy_avg: 0, sell_avg_yesterday: 0, buy_avg_yesterday: 0.08, currency_unit: 'c', latest_datetime: '2026-07-21 23:00:00' }
  ] }])
  const converted = convertPricesToChaos(records)
  assert.equal(converted.find((entry) => entry.itemName === '神圣石').chaosValue, 150)
  assert.equal(converted.find((entry) => entry.itemName === '神圣石').source, 'remote-yesterday-sell')
  assert.equal(converted.find((entry) => entry.itemName === '增幅石').chaosValue, 0.08)
  assert.equal(converted.find((entry) => entry.itemName === '增幅石').source, 'remote-yesterday-buy')
})

test('今日和昨日均价全零时继续回退最新卖一或买一', () => {
  const records = normalizeSummaryPrices([{ items: [
    { item_name: '最新卖价资源', sell_avg: 0, buy_avg: 0, sell_avg_yesterday: 0, buy_avg_yesterday: 0, latest_sell1: 0.002857, latest_buy1: 0.003, currency_unit: 'c', latest_datetime: '2026-07-21 23:00:00' },
    { item_name: '最新买价资源', sell_avg: 0, buy_avg: 0, sell_avg_yesterday: 0, buy_avg_yesterday: 0, latest_sell1: 0, latest_buy1: 0.0008, currency_unit: 'c', latest_datetime: '2026-07-21 23:00:00' }
  ] }])
  const converted = convertPricesToChaos(records)
  assert.equal(converted.find((entry) => entry.itemName === '最新卖价资源').chaosValue, 0.002857)
  assert.equal(converted.find((entry) => entry.itemName === '最新卖价资源').source, 'remote-latest-sell')
  assert.equal(converted.find((entry) => entry.itemName === '最新买价资源').chaosValue, 0.0008)
  assert.equal(converted.find((entry) => entry.itemName === '最新买价资源').source, 'remote-latest-buy')
})

test('存在价格但时间缺失时保留展示值但不参与计算', () => {
  const records = normalizeSummaryPrices([{ items: [
    { item_name: '时间未知资源', sell_avg: 0, buy_avg: 0, latest_sell1: 0.0012, currency_unit: 'c', latest_datetime: '' }
  ] }])
  const [converted] = convertPricesToChaos(records)
  assert.equal(converted.valid, false)
  assert.equal(converted.chaosValue, 0.0012)
  assert.match(converted.reason, /价格时间缺失/)
})

test('昨日均价最多允许使用 48 小时', () => {
  assert.equal(priceHealth({ sellAverage: 1, error: false, observedAt: '2026-07-19 11:00:00', source: 'remote-yesterday-sell' }, now).valid, false)
  assert.equal(priceHealth({ sellAverage: 1, error: false, observedAt: '2026-07-20 11:00:00', source: 'remote-yesterday-sell' }, now).valid, true)
})

test('混沌石远程价格缺失时固定为 1C', () => {
  const records = normalizeSummaryPrices([{ items: [
    { item_name: '混沌石', engname: 'Chaos Orb', sell_avg: 0, buy_avg: 0, currency_unit: 'c', latest_datetime: '' }
  ] }])
  const [chaos] = convertPricesToChaos(records)
  assert.equal(chaos.valid, true)
  assert.equal(chaos.chaosValue, 1)
  assert.equal(chaos.source, 'fixed-chaos')
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

test('异常刷新不会覆盖已有有效价格缓存', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-price-'))
  let responsePayload = payload
  let currentTime = now
  const fetchImpl = async () => ({ ok: true, json: async () => responsePayload })
  const service = new CraftingPriceService({ storageRoot: root, fetchImpl, now: () => currentTime })
  await service.initialize()
  await service.refresh()
  const previous = service.getSnapshot()

  currentTime += 2 * 60 * 60 * 1000
  responsePayload = [{ items: [{ item_name: '神圣石', sell_avg: 0, buy_avg: 0, currency_unit: 'c', latest_datetime: '' }] }]
  await assert.rejects(service.refresh({ force: true }), /有效价格异常/)

  const preserved = service.getSnapshot()
  assert.equal(preserved.fetchedAt, previous.fetchedAt)
  assert.equal(preserved.records.find((entry) => entry.resourceId === 'currency:divine').chaosValue, 150)
})
