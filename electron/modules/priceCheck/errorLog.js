const DEFAULT_LIMIT = 200
const MAX_ITEM_TEXT_LENGTH = 100_000
const MAX_STACK_LENGTH = 12_000

export const PRICE_CHECK_ERROR_STAGE_LABELS = Object.freeze({
  capture: '读取游戏物品',
  parse: '解析物品文本',
  model: '生成查价模型',
  identity: '识别物品身份',
  'stat-match': '匹配交易词缀',
  query: '查询官方交易接口',
  'load-more': '加载更多挂单',
  distribution: '加载价格分布',
  resolve: '选择候选条件',
  catalog: '刷新交易目录',
  official: '打开官方查询',
  precondition: '查价前置条件',
  ipc: '查价服务调用',
  unknown: '未知阶段'
})

function cleanText(value, maxLength = MAX_ITEM_TEXT_LENGTH) {
  if (value == null) return ''
  return String(value).slice(0, maxLength)
}

function normalizeDedupeText(value) {
  return String(value || '').replace(/\r\n?/g, '\n').trim()
}

function errorDedupeKey(entry) {
  const normalizedItemText = normalizeDedupeText(entry.itemText)
  const itemKey = normalizedItemText || JSON.stringify([
    entry.itemName || '',
    entry.itemRarity || '',
    entry.itemCategory || '',
    entry.itemBaseType || ''
  ])
  return JSON.stringify([
    entry.stage || '',
    entry.code || '',
    entry.failureCode || '',
    entry.configurationIssueId || '',
    normalizeDedupeText(entry.message),
    itemKey
  ])
}

function jsonSafe(value) {
  if (value == null) return null
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return null
  }
}

function errorMessage(error) {
  return cleanText(error?.message || error?.error?.message || '', 4000) || '查价失败'
}

function itemSummary(model, item) {
  const name = model?.identity?.displayName || model?.item?.name || item?.name || model?.identity?.type || item?.baseName || ''
  const rarity = model?.item?.rarity || item?.rarity || ''
  const category = model?.identity?.categoryLabel || model?.item?.category || item?.category || ''
  const baseType = model?.item?.baseType || model?.identity?.type || item?.baseName || ''
  return {
    name: cleanText(name, 240),
    rarity: cleanText(rarity, 40),
    category: cleanText(category, 80),
    baseType: cleanText(baseType, 240)
  }
}

export function createPriceCheckErrorLog({ limit = DEFAULT_LIMIT, now = () => Date.now() } = {}) {
  return new PriceCheckErrorLog({ limit, now })
}

/**
 * 本次启动期间的内存错误记录。查价失败时同时保留完整物品文本、解析结果和查价模型，
 * 供界面一键复制给 AI 定位问题。记录本身永不抛出，避免影响查价主流程。
 */
export class PriceCheckErrorLog {
  constructor({ limit = DEFAULT_LIMIT, now = () => Date.now() } = {}) {
    this.limit = Math.max(1, Math.floor(Number(limit) || DEFAULT_LIMIT))
    this.now = now
    this.startedAt = new Date(this.now()).toISOString()
    this.sequence = 0
    this.entries = []
  }

  record(input = {}) {
    try {
      const error = input.error
      if (!error || error?.name === 'AbortError') return null
      const stage = PRICE_CHECK_ERROR_STAGE_LABELS[input.stage] ? input.stage : 'unknown'
      const timestamp = new Date(this.now()).toISOString()
      const itemText = cleanText(input.itemText)
      const item = jsonSafe(input.item)
      const model = jsonSafe(input.model)
      const query = jsonSafe(input.query)
      const details = jsonSafe(error?.details || error?.error?.details || {}) || {}
      const summary = itemSummary(model, item)
      const entry = {
        id: `price-check-error-${++this.sequence}`,
        timestamp,
        stage,
        stageLabel: PRICE_CHECK_ERROR_STAGE_LABELS[stage],
        code: cleanText(error?.code || error?.error?.code || '', 120) || 'PRICE_CHECK_FAILED',
        message: errorMessage(error),
        failureCode: cleanText(error?.failureCode || '', 120),
        configurationIssueId: cleanText(error?.configurationIssueId || '', 120),
        details,
        stack: cleanText(error?.stack || '', MAX_STACK_LENGTH),
        league: cleanText(input.league, 120),
        source: input.source === 'manual' ? 'manual' : input.source === 'rerun' ? 'rerun' : 'capture',
        options: jsonSafe(input.options) || {},
        catalog: input.catalog ? {
          provider: cleanText(input.catalog.provider, 80),
          gameVersion: cleanText(input.catalog.gameVersion, 80),
          degraded: Boolean(input.catalog.degraded),
          stale: Boolean(input.catalog.stale)
        } : null,
        item: item || null,
        model: model || null,
        query: query || null,
        itemText,
        itemName: summary.name,
        itemRarity: summary.rarity,
        itemCategory: summary.category,
        itemBaseType: summary.baseType,
        repeatCount: 1
      }

      const key = errorDedupeKey(entry)
      const existingIndex = this.entries.findIndex(item => errorDedupeKey(item) === key)
      if (existingIndex !== -1) {
        const existing = this.entries[existingIndex]
        existing.timestamp = entry.timestamp
        existing.repeatCount += 1
        existing.details = entry.details
        if (entry.stack) existing.stack = entry.stack
        if (entry.league) existing.league = entry.league
        existing.source = entry.source
        existing.options = entry.options
        if (entry.catalog) existing.catalog = entry.catalog
        if (entry.itemText && (!existing.itemText || entry.itemText.length > existing.itemText.length)) {
          existing.itemText = entry.itemText
        }
        if (entry.item) existing.item = entry.item
        if (entry.model) existing.model = entry.model
        if (entry.query) existing.query = entry.query
        if (entry.itemName) existing.itemName = entry.itemName
        if (entry.itemRarity) existing.itemRarity = entry.itemRarity
        if (entry.itemCategory) existing.itemCategory = entry.itemCategory
        if (entry.itemBaseType) existing.itemBaseType = entry.itemBaseType
        if (existingIndex !== this.entries.length - 1) {
          this.entries.splice(existingIndex, 1)
          this.entries.push(existing)
        }
        return this.describe(existing)
      }

      this.entries.push(entry)
      if (this.entries.length > this.limit) this.entries.splice(0, this.entries.length - this.limit)
      return this.describe(entry)
    } catch {
      return null
    }
  }

  remove(id) {
    const targetId = cleanText(id, 120)
    if (!targetId) return false
    const index = this.entries.findIndex(entry => entry.id === targetId)
    if (index === -1) return false
    this.entries.splice(index, 1)
    return true
  }

  describe(entry) {
    return {
      id: entry.id,
      timestamp: entry.timestamp,
      stage: entry.stage,
      stageLabel: entry.stageLabel,
      code: entry.code,
      message: entry.message,
      itemName: entry.itemName,
      repeatCount: entry.repeatCount
    }
  }

  count() {
    return this.entries.length
  }

  snapshot({ appVersion = '', server = '' } = {}) {
    return {
      startedAt: this.startedAt,
      appVersion: cleanText(appVersion, 80),
      server: cleanText(server, 80),
      count: this.entries.length,
      entries: structuredClone(this.entries)
    }
  }
}
