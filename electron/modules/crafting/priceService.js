import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { normalizePriceRecord, stableCraftingId } from './model.js'

const CACHE_TTL_MS = 60 * 60 * 1000
const STALE_MS = 24 * 60 * 60 * 1000
const YESTERDAY_STALE_MS = 48 * 60 * 60 * 1000

function parseTimestamp(raw) {
  const first = Date.parse(raw)
  if (Number.isFinite(first)) return first
  const withT = Date.parse(raw.replace(' ', 'T'))
  if (Number.isFinite(withT)) return withT
  const withTz = Date.parse(raw.replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(raw) ? '' : '+08:00'))
  return Number.isFinite(withTz) ? withTz : NaN
}

function flattenSummary(payload) {
  const rows = Array.isArray(payload) ? payload : []
  return rows.flatMap((category) => {
    const categoryLabel = category.category_label ?? category.categoryLabel ?? ''
    if (Array.isArray(category.items)) return category.items.map((item) => ({ ...item, category_label: categoryLabel }))
    return category.item_name ? [category] : []
  })
}

function resourceIdFor(item) {
  const name = item.item_name || item.itemName || ''
  const english = item.engname || ''
  const known = [
    [['混沌石', 'Chaos Orb'], 'currency:chaos'], [['神圣石', 'Divine Orb'], 'currency:divine'],
    [['崇高石', 'Exalted Orb'], 'currency:exalted'], [['改造石', 'Orb of Alteration'], 'currency:alteration'],
    [['增幅石', 'Orb of Augmentation'], 'currency:augmentation'], [['富豪石', 'Regal Orb'], 'currency:regal'],
    [['点金石', 'Orb of Alchemy'], 'currency:alchemy'], [['重铸石', 'Orb of Scouring'], 'currency:scouring'],
    [['蜕变石', 'Orb of Transmutation'], 'currency:transmutation'], [['无效石', '剥离石', 'Orb of Annulment'], 'currency:annulment']
  ].find(([names]) => names.includes(name) || names.includes(english))
  return known?.[1] || stableCraftingId('resource', english || name)
}

function comparableResourceName(value) {
  return String(value || '').replace(/\s+x\s*\d+(?:\.\d+)?\s*$/i, '').replace(/\s+/g, '').trim()
}

export function filterCraftingPrices(records, resources = []) {
  if (!Array.isArray(resources) || !resources.length) return records
  const ids = new Set(resources.map((resource) => resource?.resourceId).filter(Boolean))
  const names = new Set(resources.map((resource) => comparableResourceName(resource?.resourceName)).filter(Boolean))
  return records.filter((record) => ids.has(record.resourceId) || names.has(comparableResourceName(record.itemName)))
}

export function priceHealth(record, now = Date.now()) {
  if (record.validationError) return { valid: false, reason: record.validationError }
  if (!(record.sellAverage > 0)) return { valid: false, reason: '买卖双方均价均缺失或非正数' }
  const observed = parseTimestamp(record.observedAt)
  if (!Number.isFinite(observed)) return { valid: false, reason: '价格时间格式无效' }
  const staleAfter = String(record.source || '').startsWith('remote-yesterday-') ? YESTERDAY_STALE_MS : STALE_MS
  if (now - observed > staleAfter) return { valid: false, reason: `价格超过 ${staleAfter / 60 / 60 / 1000} 小时` }
  return { valid: true, reason: '', warning: record.warning || (record.error ? record.errorInfo || 'API 标记为 OCR 异常' : '') }
}

export function normalizeSummaryPrices(payload) {
  return flattenSummary(payload).filter((item) => item.item_name || item.itemName || item.engname).map((item, index) => {
    const observedAt = item.latest_datetime ?? item.observedAt
    const sellAverage = Number(item.sell_avg ?? item.sellAverage)
    const buyAverage = Number(item.buy_avg ?? item.buyAverage)
    const yesterdaySellAverage = Number(item.sell_avg_yesterday ?? item.yesterdaySellAverage)
    const yesterdayBuyAverage = Number(item.buy_avg_yesterday ?? item.yesterdayBuyAverage)
    const latestSell = Number(item.latest_sell1 ?? item.latestSell)
    const latestBuy = Number(item.latest_buy1 ?? item.latestBuy)
    const useSellAverage = Number.isFinite(sellAverage) && sellAverage > 0
    const useBuyAverage = !useSellAverage && Number.isFinite(buyAverage) && buyAverage > 0
    const useYesterdaySellAverage = !useSellAverage && !useBuyAverage && Number.isFinite(yesterdaySellAverage) && yesterdaySellAverage > 0
    const useYesterdayBuyAverage = !useSellAverage && !useBuyAverage && !useYesterdaySellAverage && Number.isFinite(yesterdayBuyAverage) && yesterdayBuyAverage > 0
    const useLatestSell = !useSellAverage && !useBuyAverage && !useYesterdaySellAverage && !useYesterdayBuyAverage && Number.isFinite(latestSell) && latestSell > 0
    const useLatestBuy = !useSellAverage && !useBuyAverage && !useYesterdaySellAverage && !useYesterdayBuyAverage && !useLatestSell && Number.isFinite(latestBuy) && latestBuy > 0
    const selectedAverage = useSellAverage
      ? sellAverage
      : useBuyAverage
        ? buyAverage
        : useYesterdaySellAverage
          ? yesterdaySellAverage
          : useYesterdayBuyAverage
            ? yesterdayBuyAverage
            : useLatestSell ? latestSell : useLatestBuy ? latestBuy : 0
    const source = useBuyAverage
      ? 'remote-buy-fallback'
      : useYesterdaySellAverage
        ? 'remote-yesterday-sell'
        : useYesterdayBuyAverage
          ? 'remote-yesterday-buy'
          : useLatestSell ? 'remote-latest-sell' : useLatestBuy ? 'remote-latest-buy' : 'remote'
    const rawUnit = String(item.currency_unit ?? item.currencyUnit ?? 'c').toLowerCase()
    const invalidReasons = []
    if (!observedAt) invalidReasons.push('价格时间缺失')
    if (!(selectedAverage > 0)) invalidReasons.push('买卖双方均价均缺失或非正数')
    if (!['c', 'd', 'e'].includes(rawUnit)) invalidReasons.push(`未知计价单位 ${rawUnit}`)
    return { ...normalizePriceRecord({
      resourceId: resourceIdFor(item),
      itemName: item.item_name ?? item.itemName ?? item.engname,
      sellAverage: selectedAverage,
      priceField: useBuyAverage || useYesterdayBuyAverage || useLatestBuy ? 'buy_avg' : 'sell_avg',
      currencyUnit: ['c', 'd', 'e'].includes(rawUnit) ? rawUnit : 'c',
      observedAt: observedAt || 'invalid',
      error: Boolean(item.error) || invalidReasons.length > 0,
      errorInfo: item.error_info || item.errorInfo || invalidReasons.join('；')
    }, index), source, validationError: invalidReasons.join('；'), warning: item.error ? item.error_info || item.errorInfo || 'API 标记为 OCR 异常' : '' }
  })
}

function findBenchmark(records, names, now) {
  return records.find((record) => names.includes(record.itemName) && record.currencyUnit === 'c' && priceHealth(record, now).valid)?.sellAverage
}

export function convertPricesToChaos(records, overrides = {}, now = Date.now()) {
  const divineInChaos = Number(overrides['currency:divine']) || findBenchmark(records, ['神圣石', 'Divine Orb'], now)
  const exaltedInChaos = Number(overrides['currency:exalted']) || findBenchmark(records, ['崇高石', 'Exalted Orb'], now)
  return records.map((record) => {
    const override = Number(overrides[record.resourceId])
    if (override > 0) return { ...record, chaosValue: override, valid: true, reason: '', source: 'override' }
    if (record.resourceId === 'currency:chaos') return { ...record, sellAverage: 1, chaosValue: 1, valid: true, reason: '', source: 'fixed-chaos' }
    const health = priceHealth(record, now)
    let multiplier = 1
    if (record.currencyUnit === 'd') multiplier = divineInChaos
    if (record.currencyUnit === 'e') multiplier = exaltedInChaos
    if (!health.valid) {
      const displayValue = record.sellAverage > 0 && multiplier > 0 && !String(health.reason).includes('未知计价单位')
        ? record.sellAverage * multiplier
        : null
      return { ...record, chaosValue: displayValue, valid: false, reason: health.reason, source: record.source || 'remote' }
    }
    if (!(multiplier > 0)) return { ...record, chaosValue: null, valid: false, reason: `缺少 ${record.currencyUnit} 基准通货混沌价`, source: 'remote' }
    return { ...record, chaosValue: record.sellAverage * multiplier, valid: true, reason: '', warning: health.warning || '', source: record.source || (record.priceField === 'buy_avg' ? 'remote-buy-fallback' : 'remote') }
  })
}

function usableRemoteCount(records, now) {
  return convertPricesToChaos(records, {}, now).filter((record) => record.valid && record.source !== 'fixed-chaos').length
}

export function estimateResources(resources, prices, overrides = {}) {
  const byId = new Map(convertPricesToChaos(prices, overrides).map((record) => [record.resourceId, record]))
  const details = resources.map((resource) => {
    const override = Number(overrides[resource.resourceId])
    const price = override > 0
      ? { chaosValue: override, valid: true, source: 'override', reason: '' }
      : byId.get(resource.resourceId)
    if (!price?.valid) return { ...resource, chaosValue: null, subtotalChaos: null, valid: false, reason: price?.reason || '没有公开价格或本地覆盖' }
    return { ...resource, chaosValue: price.chaosValue, subtotalChaos: resource.amount * price.chaosValue, valid: true, source: price.source }
  })
  const invalid = details.filter((entry) => !entry.valid)
  return { valid: invalid.length === 0, totalChaos: invalid.length ? null : details.reduce((sum, entry) => sum + entry.subtotalChaos, 0), details, reasons: invalid.map((entry) => `${entry.resourceName || entry.resourceId}：${entry.reason}`), baseCostChaos: 0 }
}

export class CraftingPriceService {
  constructor({ storageRoot, fetchImpl = fetch, now = () => Date.now(), getRequiredResources = () => [] }) {
    this.storageRoot = storageRoot
    this.fetchImpl = fetchImpl
    this.now = now
    this.getRequiredResources = getRequiredResources
    this.records = []
    this.fetchedAt = 0
    this.overrides = {}
  }

  get cacheFile() { return path.join(this.storageRoot, 'prices.json') }
  get overrideFile() { return path.join(this.storageRoot, 'price-overrides.json') }

  relevantRecords(records = this.records) {
    return filterCraftingPrices(records, this.getRequiredResources())
  }

  async initialize() {
    await mkdir(this.storageRoot, { recursive: true })
    try {
      const cached = JSON.parse(await readFile(this.cacheFile, 'utf8'))
      this.records = cached.records.map((record, index) => ({ ...normalizePriceRecord(record, index), source: record.source, validationError: record.validationError || '', warning: record.warning || '' }))
      this.fetchedAt = Number(cached.fetchedAt) || 0
    } catch {}
    try { this.overrides = JSON.parse(await readFile(this.overrideFile, 'utf8')) } catch {}
    return this.getSnapshot()
  }

  async refresh({ force = false } = {}) {
    if (!force && this.relevantRecords().length && this.now() - this.fetchedAt < CACHE_TTL_MS) return this.getSnapshot()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    try {
      const response = await this.fetchImpl('https://poecurrency.top/api/summary?version=1', { signal: controller.signal })
      if (!response.ok) throw new Error(`价格服务返回 HTTP ${response.status}`)
      const nextRecords = filterCraftingPrices(normalizeSummaryPrices(await response.json()), this.getRequiredResources())
      const previousValid = usableRemoteCount(this.relevantRecords(), this.now())
      const nextValid = usableRemoteCount(nextRecords, this.now())
      const suspiciousThreshold = Math.max(1, Math.floor(previousValid * 0.3))
      if (previousValid > 0 && nextValid < previousValid && nextValid <= suspiciousThreshold) {
        throw new Error(`价格服务有效价格异常（${previousValid} → ${nextValid}），已保留上次有效缓存`)
      }
      if (!nextRecords.length || nextValid === 0) throw new Error('价格服务没有返回有效价格，已保留上次有效缓存')
      this.records = nextRecords
      this.fetchedAt = this.now()
      await writeFile(this.cacheFile, JSON.stringify({ fetchedAt: this.fetchedAt, records: this.records }, null, 2))
      return this.getSnapshot()
    } finally { clearTimeout(timer) }
  }

  async setOverride(resourceId, chaosValue) {
    if (!/^[a-zA-Z0-9:_-]+$/.test(resourceId)) throw new Error('资源 ID 无效')
    const value = Number(chaosValue)
    if (!(value > 0)) throw new Error('覆盖价格必须大于 0')
    this.overrides[resourceId] = value
    await writeFile(this.overrideFile, JSON.stringify(this.overrides, null, 2))
    return this.getSnapshot()
  }

  async removeOverride(resourceId) {
    delete this.overrides[resourceId]
    await writeFile(this.overrideFile, JSON.stringify(this.overrides, null, 2))
    return this.getSnapshot()
  }

  getSnapshot() {
    return { fetchedAt: this.fetchedAt, records: convertPricesToChaos(this.relevantRecords(), this.overrides, this.now()), overrides: { ...this.overrides }, warning: '公开价格为 OCR 数据，仅供个人非商业使用；底材成本未计入。' }
  }
}
