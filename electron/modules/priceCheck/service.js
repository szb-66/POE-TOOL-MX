import { parseItemInfo } from '../item/parser.js'
import { CHAOS_ERROR_CODES, ChaosRecipeError } from '../chaosRecipe/errors.js'
import {
  buildOfficialTradeQuery,
  createPriceCheckModel,
  sanitizePriceCheckModel,
  sanitizePriceCheckOptions
} from './query.js'

function resultIds(search) {
  if (Array.isArray(search?.result)) return search.result
  if (search?.result && typeof search.result === 'object') return Object.keys(search.result)
  return []
}

function normalizeListing(entry) {
  const price = entry?.listing?.price
  const account = entry?.listing?.account || {}
  const amount = Number(price?.amount)
  return {
    id: String(entry?.id || ''),
    indexed: String(entry?.listing?.indexed || ''),
    accountName: String(account.name || ''),
    characterName: String(account.lastCharacterName || ''),
    online: Boolean(account.online),
    afk: account.online?.status === 'afk',
    amount: Number.isFinite(amount) && amount > 0 ? amount : null,
    currency: String(price?.currency || ''),
    priceType: String(price?.type || ''),
    whisper: String(entry?.listing?.whisper || ''),
    itemLevel: Number(entry?.item?.ilvl) || null,
    seller: String(account.name || account.lastCharacterName || ''),
    instantBuyout: ['psapi', 'securable'].includes(String(entry?.listing?.method || ''))
  }
}

export function summarizeListings(entries, accountName = '') {
  const listings = entries.map(normalizeListing).filter((entry) => entry.id)
  const unique = new Map()
  for (const listing of listings) {
    if (!listing.amount || !listing.currency || listing.accountName === accountName) continue
    const sellerKey = listing.accountName || listing.characterName || listing.id
    if (!unique.has(sellerKey)) unique.set(sellerKey, listing)
  }
  const usable = [...unique.values()]
  const groups = Object.groupBy
    ? Object.groupBy(usable, (entry) => entry.currency)
    : usable.reduce((all, entry) => ((all[entry.currency] ||= []).push(entry), all), {})
  const samples = Object.entries(groups).map(([currency, values]) => {
    const sorted = values.map((entry) => entry.amount).sort((a, b) => a - b)
    if (sorted.length < 3) return { currency, count: sorted.length, median: null }
    const middle = Math.floor(sorted.length / 2)
    const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
    return { currency, count: sorted.length, median }
  })
  return { listings, samples, disclaimer: '挂单参考，不代表成交价' }
}

export class PriceCheckService {
  constructor({ auth, client, catalog, catalogStatus, overlay = null, shell = null, captureClipboard = null }) {
    this.auth = auth
    this.client = client
    this.catalog = catalog
    this.catalogStatus = catalogStatus
    this.overlay = overlay
    this.shell = shell
    this.captureClipboard = captureClipboard
    this.controller = null
    this.requestSequence = 0
    this.captureSequence = 0
    this.latest = null
    this.runtime = { enabled: false }
    this.auth.registerCacheClearer?.(() => this.clear())
  }

  clear() {
    this.requestSequence += 1
    this.captureSequence += 1
    this.controller?.abort()
    this.controller = null
    this.client.clearCache()
    this.latest = null
    this.overlay?.update?.({ status: 'idle', result: null })
  }

  assertEnabled() {
    if (!this.runtime.enabled) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '国服查价器尚未启用')
    }
  }

  updateRuntime(runtime = {}) {
    const enabled = Boolean(runtime.enabled)
    this.runtime = {
      enabled,
      league: String(runtime.league || '').slice(0, 120),
      options: sanitizePriceCheckOptions(runtime.options)
    }
    if (!enabled) {
      this.clear()
      this.overlay?.close?.()
    }
    return this.getStatus()
  }

  async captureAndCheck(request) {
    this.assertEnabled()
    const captureSequence = ++this.captureSequence
    if (!this.captureClipboard) throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '当前环境不支持从游戏捕获物品')
    try {
      const text = await this.captureClipboard()
      if (captureSequence !== this.captureSequence) throw new DOMException('查询已取消', 'AbortError')
      return this.check({ ...request, text, model: undefined })
    } catch (error) {
      if (captureSequence === this.captureSequence && error?.name !== 'AbortError') this.overlay?.create?.({
        status: 'error',
        error: { code: error.code || CHAOS_ERROR_CODES.INVALID_REQUEST, message: error.message },
        catalog: this.catalogStatus,
        auth: this.auth.getStatus(),
        league: request?.league
      })
      throw error
    }
  }

  getStatus() {
    return {
      enabled: this.runtime.enabled,
      auth: this.auth.getStatus(),
      catalog: this.catalogStatus,
      latest: this.latest ? { league: this.latest.league, updatedAt: this.latest.updatedAt } : null
    }
  }

  parse(text, options = {}) {
    const item = parseItemInfo(String(text || ''))
    if (!item) throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '剪贴板中没有可识别的物品')
    try {
      return createPriceCheckModel(item, this.catalog, options)
    } catch (error) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, error.message || '剪贴板物品无法用于查价')
    }
  }

  async check({ text, league, model, options = {} }) {
    this.assertEnabled()
    options = sanitizePriceCheckOptions(options)
    this.controller?.abort()
    const controller = new AbortController()
    this.controller = controller
    const requestSequence = ++this.requestSequence
    if (!String(league || '').trim()) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '请选择国服赛季')
    }
    if (!this.auth.getStatus().authenticated) {
      const error = new ChaosRecipeError(CHAOS_ERROR_CODES.UNAUTHENTICATED, '请先登录国服账号')
      this.overlay?.create?.({ status: 'error', error: error.toJSON(), catalog: this.catalogStatus, auth: this.auth.getStatus(), league })
      throw error
    }
    let currentModel
    try {
      currentModel = model ? sanitizePriceCheckModel(model) : this.parse(text, options)
    } catch (error) {
      this.overlay?.create?.({ status: 'error', error: { code: error.code || CHAOS_ERROR_CODES.INVALID_REQUEST, message: error.message }, catalog: this.catalogStatus, auth: this.auth.getStatus(), league })
      throw error
    }
    const query = buildOfficialTradeQuery(currentModel, options)
    this.latest = null
    this.overlay?.create?.({
      status: 'loading', league, model: currentModel, options,
      catalog: this.catalogStatus, auth: this.auth.getStatus(), query
    })
    try {
      const search = await this.client.search(league, query, { signal: controller.signal })
      const allIds = resultIds(search).slice(0, 50)
      const ids = allIds.slice(0, 10)
      const fetched = ids.length ? await this.client.fetch(search.id, ids, { signal: controller.signal }) : { result: [] }
      if (requestSequence !== this.requestSequence) throw new DOMException('查询已取消', 'AbortError')
      const summary = summarizeListings(fetched.result.filter(Boolean), this.auth.getStatus().accountName)
      const result = { queryId: search.id, total: Number(search.total) || resultIds(search).length, ...summary }
      this.latest = {
        league,
        model: currentModel,
        query,
        options: structuredClone(options),
        result,
        rawEntries: fetched.result.filter(Boolean),
        remainingResultIds: allIds.slice(10),
        updatedAt: new Date().toISOString()
      }
      this.overlay?.update?.({ status: 'ready', ...this.latest, catalog: this.catalogStatus, auth: this.auth.getStatus() })
      return structuredClone(this.latest)
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      if (error?.code === CHAOS_ERROR_CODES.SESSION_EXPIRED) await this.auth.expire?.()
      this.overlay?.update?.({ status: 'error', error: { code: error.code || 'NETWORK_ERROR', message: error.message }, auth: this.auth.getStatus() })
      throw error
    }
  }

  getOverlayState() { return this.overlay?.getState?.() || null }
  closeOverlay() {
    this.requestSequence += 1
    this.captureSequence += 1
    this.controller?.abort()
    this.controller = null
    this.overlay?.close?.()
    return { closed: true }
  }

  async rerun(request = {}) {
    this.assertEnabled()
    const source = this.latest || this.overlay?.getState?.()
    if (!source?.model) throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '没有可重新查询的物品')
    return this.check({
      league: String(request.league || source.league || ''),
      model: request.model || source.model,
      options: request.options || {}
    })
  }

  async loadMore() {
    this.assertEnabled()
    if (!this.latest?.result?.queryId) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '没有可加载的查价结果')
    }
    const ids = this.latest.remainingResultIds.splice(0, 10)
    if (!ids.length) return structuredClone(this.latest)
    const fetched = await this.client.fetch(this.latest.result.queryId, ids)
    this.latest.rawEntries.push(...fetched.result.filter(Boolean))
    this.latest.result = {
      queryId: this.latest.result.queryId,
      total: this.latest.result.total,
      ...summarizeListings(this.latest.rawEntries, this.auth.getStatus().accountName)
    }
    this.latest.updatedAt = new Date().toISOString()
    this.overlay?.update?.({ status: 'ready', ...this.latest })
    return structuredClone(this.latest)
  }

  async openOfficial() {
    this.assertEnabled()
    if (!this.latest) throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '没有可打开的查价查询')
    const queryId = String(this.latest.result?.queryId || '')
    if (!/^[a-zA-Z0-9]+$/.test(queryId)) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.API_INCOMPATIBLE, '当前查价结果缺少可打开的官方查询编号')
    }
    const url = `https://poe.game.qq.com/trade/search/${encodeURIComponent(this.latest.league)}/${encodeURIComponent(queryId)}`
    this.overlay?.preserveForExternalAction?.()
    await this.shell.openExternal(url)
    return { opened: true }
  }
}
