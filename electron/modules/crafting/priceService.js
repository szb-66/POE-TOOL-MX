import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { normalizePriceRecord, stableCraftingId } from './model.js'

const CACHE_TTL_MS = 60 * 60 * 1000
const STALE_MS = 24 * 60 * 60 * 1000

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

export function priceHealth(record, now = Date.now()) {
  if (record.error) return { valid: false, reason: record.errorInfo || 'API 标记为 OCR 异常' }
  if (!(record.sellAverage > 0)) return { valid: false, reason: '买卖双方均价均缺失或非正数' }
  const observed = parseTimestamp(record.observedAt)
  if (!Number.isFinite(observed)) return { valid: false, reason: '价格时间格式无效' }
  if (now - observed > STALE_MS) return { valid: false, reason: '价格超过 24 小时' }
  return { valid: true, reason: '' }
}

export function normalizeSummaryPrices(payload) {
  return flattenSummary(payload).filter((item) => item.item_name || item.itemName || item.engname).map((item, index) => {
    const observedAt = item.latest_datetime ?? item.observedAt
    const sellAverage = Number(item.sell_avg ?? item.sellAverage)
    const buyAverage = Number(item.buy_avg ?? item.buyAverage)
    const useSellAverage = Number.isFinite(sellAverage) && sellAverage > 0
    const useBuyAverage = !useSellAverage && Number.isFinite(buyAverage) && buyAverage > 0
    const selectedAverage = useSellAverage ? sellAverage : (useBuyAverage ? buyAverage : 0)
    const rawUnit = String(item.currency_unit ?? item.currencyUnit ?? 'c').toLowerCase()
    const invalidReasons = []
    if (!observedAt) invalidReasons.push('价格时间缺失')
    if (!(selectedAverage > 0)) invalidReasons.push('买卖双方均价均缺失或非正数')
    if (!['c', 'd', 'e'].includes(rawUnit)) invalidReasons.push(`未知计价单位 ${rawUnit}`)
    return normalizePriceRecord({
      resourceId: resourceIdFor(item),
      itemName: item.item_name ?? item.itemName ?? item.engname,
      sellAverage: selectedAverage,
      priceField: useBuyAverage ? 'buy_avg' : 'sell_avg',
      currencyUnit: ['c', 'd', 'e'].includes(rawUnit) ? rawUnit : 'c',
      observedAt: observedAt || 'invalid',
      error: Boolean(item.error) || invalidReasons.length > 0,
      errorInfo: item.error_info || item.errorInfo || invalidReasons.join('；')
    }, index)
  })
}

function findBenchmark(records, names) {
  return records.find((record) => names.includes(record.itemName) && record.currencyUnit === 'c' && priceHealth(record).valid)?.sellAverage
}

export function convertPricesToChaos(records, overrides = {}) {
  const divineInChaos = Number(overrides['currency:divine']) || findBenchmark(records, ['神圣石', 'Divine Orb'])
  const exaltedInChaos = Number(overrides['currency:exalted']) || findBenchmark(records, ['崇高石', 'Exalted Orb'])
  return records.map((record) => {
    const override = Number(overrides[record.resourceId])
    if (override > 0) return { ...record, chaosValue: override, valid: true, reason: '', source: 'override' }
    const health = priceHealth(record)
    let multiplier = 1
    if (record.currencyUnit === 'd') multiplier = divineInChaos
    if (record.currencyUnit === 'e') multiplier = exaltedInChaos
    if (!health.valid) return { ...record, chaosValue: null, valid: false, reason: health.reason, source: 'remote' }
    if (!(multiplier > 0)) return { ...record, chaosValue: null, valid: false, reason: `缺少 ${record.currencyUnit} 基准通货混沌价`, source: 'remote' }
    return { ...record, chaosValue: record.sellAverage * multiplier, valid: true, reason: '', source: record.priceField === 'buy_avg' ? 'remote-buy-fallback' : 'remote' }
  })
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
  constructor({ storageRoot, fetchImpl = fetch, now = () => Date.now() }) {
    this.storageRoot = storageRoot
    this.fetchImpl = fetchImpl
    this.now = now
    this.records = []
    this.fetchedAt = 0
    this.overrides = {}
  }

  get cacheFile() { return path.join(this.storageRoot, 'prices.json') }
  get overrideFile() { return path.join(this.storageRoot, 'price-overrides.json') }

  async initialize() {
    await mkdir(this.storageRoot, { recursive: true })
    try {
      const cached = JSON.parse(await readFile(this.cacheFile, 'utf8'))
      this.records = cached.records.map(normalizePriceRecord)
      this.fetchedAt = Number(cached.fetchedAt) || 0
    } catch {}
    try { this.overrides = JSON.parse(await readFile(this.overrideFile, 'utf8')) } catch {}
    return this.getSnapshot()
  }

  async refresh({ force = false } = {}) {
    if (!force && this.records.length && this.now() - this.fetchedAt < CACHE_TTL_MS) return this.getSnapshot()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    try {
      const response = await this.fetchImpl('https://poecurrency.top/api/summary?version=1', { signal: controller.signal })
      if (!response.ok) throw new Error(`价格服务返回 HTTP ${response.status}`)
      this.records = normalizeSummaryPrices(await response.json())
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
    return { fetchedAt: this.fetchedAt, records: convertPricesToChaos(this.records, this.overrides), overrides: { ...this.overrides }, warning: '公开价格为 OCR 数据，仅供个人非商业使用；底材成本未计入。' }
  }
}
