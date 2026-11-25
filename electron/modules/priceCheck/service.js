import { isMercenaryWarrantText, parseItemInfo } from '../item/parser.js'
import { CHAOS_ERROR_CODES, ChaosRecipeError } from '../chaosRecipe/errors.js'
import { PRICE_CHECK_OVERLAY_CLOSE_REASONS } from './overlayFocus.js'
import { createLocalizationTextResolver } from './localizationText.js'
import { applyOriginalModifierText } from './displayText.js'
import { applyGameTextPresentation } from './gameText.js'
import { encodeTradeQueryId } from './queryId.js'
import { POE_CN_TRADE_ORIGIN } from './client.js'
import { resolveCatalogStat, warmTradeCatalogIndexes } from './catalog.js'
import { createMercenaryWarrantResolver } from './mercenary.js'
import { createPriceCheckErrorLog } from './errorLog.js'
import {
  buildOfficialTradeQuery,
  createPriceCheckModel,
  mergeStatIntoList,
  refreshPseudoStats,
  sanitizePriceCheckModel,
  sanitizePriceCheckOptions
} from './query.js'

const DISTRIBUTION_REQUEST_INTERVAL_MS = 1000

function waitForDistributionBatch(ms, signal) {
  if (!(ms > 0)) return Promise.resolve()
  return new Promise((resolve, reject) => {
    let timer
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('查询已取消', 'AbortError'))
    }
    timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    if (signal?.aborted) onAbort()
    else signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function resultIds(search) {
  if (Array.isArray(search?.result)) return search.result
  if (search?.result && typeof search.result === 'object') return Object.keys(search.result)
  return []
}

function isUnknownBaseTypeError(error) {
  return error?.details?.status === 400 &&
    /unknown item base type/i.test(String(error?.details?.officialMessage || ''))
}

function isQueryTooComplexError(error) {
  return error?.details?.status === 400 &&
    /(?:query.{0,16}too complex|too complex|查询.{0,12}复杂)/i.test(String(error?.details?.officialMessage || error?.message || ''))
}

function withoutBaseType(query) {
  const fallback = structuredClone(query)
  delete fallback.query?.type
  return fallback
}

function errorSnapshot(error, fallbackCode = 'NETWORK_ERROR') {
  return {
    code: error?.code || fallbackCode,
    message: error?.message || '查价失败',
    details: structuredClone(error?.details || {})
  }
}

function normalizeListing(entry, currencyLabels = {}) {
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
    currencyLabel: String(currencyLabels?.[price?.currency] || ''),
    priceType: String(price?.type || ''),
    whisper: String(entry?.listing?.whisper || ''),
    itemLevel: Number(entry?.item?.ilvl) || null,
    seller: String(account.name || account.lastCharacterName || ''),
    instantBuyout: ['psapi', 'securable'].includes(String(entry?.listing?.method || ''))
  }
}

export function summarizeListings(entries, accountName = '', currencyLabels = {}) {
  const listings = entries.map((entry) => normalizeListing(entry, currencyLabels)).filter((entry) => entry.id)
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

export function buildPriceDistribution(entries, accountName = '', dcRate = null, target = 100, currencyLabels = {}) {
  const unique = new Map()
  for (const listing of entries.map((entry) => normalizeListing(entry, currencyLabels))) {
    if (!listing.id || !listing.amount || !listing.currency || listing.accountName === accountName) continue
    const sellerKey = listing.accountName || listing.characterName || listing.id
    if (!unique.has(sellerKey)) unique.set(sellerKey, listing)
  }
  const rate = Number(dcRate?.value)
  const canConvert = Number.isFinite(rate) && rate > 0
  const groups = new Map()
  for (const listing of unique.values()) {
    let key
    let chaosEquivalent = null
    if (listing.currency === 'chaos') {
      chaosEquivalent = Math.round(listing.amount * 10) / 10
      key = `chaos:${chaosEquivalent}`
    } else if (listing.currency === 'divine' && canConvert) {
      chaosEquivalent = Math.round(listing.amount * rate * 10) / 10
      key = `chaos:${chaosEquivalent}`
    } else {
      key = `${listing.currency}:${listing.amount}`
    }
    const group = groups.get(key) || {
      key,
      amount: chaosEquivalent ?? listing.amount,
      currency: chaosEquivalent != null ? 'chaos' : listing.currency,
      currencyLabel: chaosEquivalent != null ? (currencyLabels.chaos || '混沌石') : listing.currencyLabel,
      chaosEquivalent,
      count: 0,
      chaosCount: 0,
      divineCount: 0
    }
    group.count += 1
    if (listing.currency === 'chaos') group.chaosCount += 1
    if (listing.currency === 'divine') group.divineCount += 1
    groups.set(key, group)
  }
  const usable = unique.size
  const points = [...groups.values()]
    .map((group) => ({ ...group, percent: usable ? Math.round((group.count / usable) * 1000) / 10 : 0 }))
    .sort((a, b) => {
      if (a.currency === b.currency) return a.amount - b.amount
      return a.currency.localeCompare(b.currency)
    })
  const highest = points.reduce((max, group) => Math.max(max, group.count), 0)
  for (const group of points) group.highest = highest > 0 && group.count === highest
  return {
    target,
    fetched: Math.min(entries.length, target),
    usable,
    complete: entries.length >= target,
    converted: canConvert,
    groups: points,
    disclaimer: '已抓取挂单样本分布，不代表全部挂单或实际成交价'
  }
}

export class PriceCheckService {
  constructor({
    auth,
    client,
    catalog,
    catalogStatus,
    overlay = null,
    shell = null,
    captureClipboard = null,
    warmClipboardCapture = null,
    disposeClipboardCapture = null,
    dcRateProvider = null,
    catalogRefresher = null,
    manualInputOnly = false,
    allowManualQueries = manualInputOnly,
    localizationProvider = () => [],
    localizationRevisionProvider = () => '',
    mercenaryReferenceCatalog = null,
    appVersion = '',
    errorLog = null,
    now = () => Date.now(),
    distributionWait = waitForDistributionBatch
  }) {
    this.auth = auth
    this.client = client
    this.catalog = catalog
    this.catalogStatus = catalogStatus
    this.overlay = overlay
    this.shell = shell
    this.captureClipboard = captureClipboard
    this.warmClipboardCapture = warmClipboardCapture
    this.disposeClipboardCapture = disposeClipboardCapture
    this.dcRateProvider = dcRateProvider
    this.catalogRefresher = catalogRefresher
    this.allowManualQueries = allowManualQueries
    this.manualInputOnly = manualInputOnly
    this.localizationProvider = localizationProvider
    this.localizationRevisionProvider = localizationRevisionProvider
    this.mercenaryReferenceCatalog = mercenaryReferenceCatalog
    this.appVersion = String(appVersion || '')
    this.errorLog = errorLog || createPriceCheckErrorLog()
    this.localizationRevision = String(localizationRevisionProvider() || '')
    this.localizationResolver = null
    this.now = now
    this.distributionWait = distributionWait
    this.catalogRefreshPending = null
    this.controller = null
    this.requestSequence = 0
    this.captureSequence = 0
    this.hotkeyCaptureSequence = 0
    this.pendingHotkeyCapture = null
    this.warmUpScheduled = false
    this.latest = null
    this.lastItemText = ''
    this.settingsRevision = 0
    this.dcRate = null
    this.dcRateAttemptedAt = 0
    this.dcRatePending = null
    this.runtime = { enabled: false, league: '', shortcut: '', options: sanitizePriceCheckOptions() }
    this.auth.registerCacheClearer?.(() => this.clear())
  }

  clear() {
    this.requestSequence += 1
    this.captureSequence += 1
    this.pendingHotkeyCapture = null
    this.controller?.abort()
    this.controller = null
    this.client.clearCache()
    this.latest = null
    this.lastItemText = ''
    this.updateOverlay({ status: 'idle', model: null, query: null, result: null })
  }

  assertEnabled() {
    if (!this.runtime.enabled && !this.allowManualQueries) {
      throw new ChaosRecipeError('PRICE_CHECK_DISABLED', '查价器尚未启用')
    }
  }

  recordFailure(stage, error, context = {}) {
    if (!error || error?.name === 'AbortError') return null
    const entry = this.errorLog?.record?.({
      stage,
      error,
      league: context.league ?? this.runtime.league,
      options: context.options ?? this.runtime.options,
      itemText: context.itemText ?? (context.model ? this.lastItemText : ''),
      item: context.item ?? context.model?.item ?? null,
      model: context.model ?? null,
      query: context.query ?? null,
      source: context.source,
      catalog: this.catalogStatus
    })
    try {
      if (error && typeof error === 'object') error.priceCheckErrorLogged = true
    } catch { /* 冻结的错误对象不影响记录 */ }
    return entry
  }

  getErrorLog() {
    return this.errorLog.snapshot({ appVersion: this.appVersion, server: this.client?.server?.label || '' })
  }

  deleteErrorLogEntry(id) {
    this.errorLog.remove(id)
    return this.getErrorLog()
  }

  overlaySnapshot(snapshot = {}) {
    return { ...snapshot, shortcut: this.runtime.shortcut }
  }

  createOverlay(snapshot, options) {
    this.overlay?.create?.(this.overlaySnapshot(snapshot), options)
  }

  updateOverlay(snapshot) {
    this.overlay?.update?.(this.overlaySnapshot(snapshot))
  }

  scheduleWarmUp() {
    if (!this.runtime.enabled || this.warmUpScheduled) return
    this.warmUpScheduled = true
    const timer = setImmediate(() => {
      this.warmUpScheduled = false
      if (!this.runtime.enabled) return
      try {
        warmTradeCatalogIndexes(this.catalog)
      } catch { /* 目录未就绪时不阻断预热 */ }
      try {
        this.warmClipboardCapture?.()
      } catch { /* 复制助手预热失败时在查价阶段自动回退 */ }
      if (this.client?.server?.id === 'international' && !this.localizationResolver) {
        try {
          this.syncLocalizationRevision()
          const entries = this.localizationProvider?.() || []
          if (entries.length) this.localizationResolver = createLocalizationTextResolver(entries)
        } catch { /* 汉化索引预热失败不影响后续按需构建 */ }
      }
    })
    timer.unref?.()
  }

  beginHotkeyCapture() {
    if (this.manualInputOnly || !this.runtime.enabled || !this.captureClipboard) return false
    if (!String(this.runtime.league || '').trim() || !this.auth.getStatus().authenticated) return false
    this.overlay?.captureHotkeyCursor?.()
    const id = ++this.hotkeyCaptureSequence
    let promise
    try {
      promise = Promise.resolve(this.captureClipboard())
    } catch (error) {
      promise = Promise.reject(error)
    }
    promise.catch(() => {})
    this.pendingHotkeyCapture = { id, promise, createdAt: this.now() }
    return true
  }

  consumePendingHotkeyCapture() {
    const pending = this.pendingHotkeyCapture
    this.pendingHotkeyCapture = null
    if (!pending) return null
    if (this.now() - pending.createdAt > 3000) return null
    return pending
  }

  updateRuntime(runtime = {}) {
    const enabled = Boolean(runtime.enabled)
    const hasOptions = runtime.options && typeof runtime.options === 'object'
    const hasShortcut = Object.prototype.hasOwnProperty.call(runtime, 'shortcut')
    this.runtime = {
      enabled,
      league: String(runtime.league || '').slice(0, 120),
      shortcut: hasShortcut ? String(runtime.shortcut || '').trim().slice(0, 120) : this.runtime.shortcut,
      options: hasOptions ? sanitizePriceCheckOptions(runtime.options) : this.runtime.options
    }
    if (hasOptions) this.settingsRevision += 1
    if (enabled) {
      this.overlay?.prepare?.()
      this.scheduleWarmUp()
      this.updateOverlay({ shortcut: this.runtime.shortcut })
    } else {
      this.clear()
      this.destroyOverlay()
    }
    return this.getStatus()
  }

  async captureAndCheck(request) {
    if (this.manualInputOnly) throw new ChaosRecipeError('SERVER_FEATURE_UNAVAILABLE', '当前查价服务仅支持手动输入')
    if (!this.runtime.enabled) throw new ChaosRecipeError('PRICE_CHECK_DISABLED', '查价器尚未启用')
    const captureSequence = ++this.captureSequence
    const preCapture = this.consumePendingHotkeyCapture()
    if (!this.captureClipboard && !preCapture) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '当前环境不支持从游戏捕获物品')
    }
    this.requestSequence += 1
    this.controller?.abort()
    this.controller = null
    this.latest = null
    this.lastItemText = ''
    let capturedText = ''
    try {
      capturedText = await (preCapture ? preCapture.promise : this.captureClipboard())
      if (captureSequence !== this.captureSequence) throw new DOMException('查询已取消', 'AbortError')
      const queryImmediately = request?.queryImmediately === true
      return await this.check({
        ...request, text: capturedText, model: undefined, reposition: true,
        execute: queryImmediately, queryImmediately, source: 'capture'
      })
    } catch (error) {
      if (!error?.priceCheckErrorLogged && captureSequence === this.captureSequence) {
        this.recordFailure('capture', error, {
          league: request?.league,
          options: request?.options,
          itemText: capturedText,
          source: 'capture'
        })
      }
      if (captureSequence === this.captureSequence && error?.name !== 'AbortError') this.createOverlay({
        ...this.latest,
        status: 'error',
        error: errorSnapshot(error, CHAOS_ERROR_CODES.INVALID_REQUEST),
        catalog: this.catalogStatus,
        auth: this.auth.getStatus(),
        league: request?.league
      }, { reposition: true })
      throw error
    }
  }

  getStatus() {
    this.syncLocalizationRevision()
    return {
      enabled: this.runtime.enabled,
      league: this.runtime.league,
      shortcut: this.runtime.shortcut,
      options: structuredClone(this.runtime.options),
      settingsRevision: this.settingsRevision,
      dcRate: this.currentDcRate(),
      auth: this.auth.getStatus(),
      catalog: this.catalogStatus,
      localizationRevision: this.localizationRevision,
      errorCount: this.errorLog.count(),
      latest: this.latest ? { league: this.latest.league, updatedAt: this.latest.updatedAt } : null
    }
  }

  async refreshCatalog() {
    if (!this.catalogRefresher) throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '当前环境不支持刷新交易目录')
    if (this.catalogRefreshPending) return this.catalogRefreshPending
    this.catalogStatus = {
      ...this.catalogStatus,
      loading: true,
      warning: `正在刷新${this.client.server?.id === 'international' ? '国际服' : '腾讯'}官方物品与词缀目录…`
    }
    this.updateOverlay({ catalog: this.catalogStatus })
    this.catalogRefreshPending = Promise.resolve()
      .then(() => this.catalogRefresher())
      .then((bundle) => {
        if (this.client.server?.id === 'international') this.clear()
        this.catalog = bundle.catalog
        this.catalogStatus = { ...bundle.status, loading: false, warning: '' }
        this.scheduleWarmUp()
        this.updateOverlay({ catalog: this.catalogStatus })
        return this.catalogStatus
      })
      .catch((error) => {
        this.recordFailure('catalog', error)
        this.catalogStatus = {
          ...this.catalogStatus,
          provider: this.catalogStatus.provider || 'bundled',
          degraded: true,
          loading: false,
          warning: `${this.client.server?.id === 'international' ? '国际服' : '腾讯'}官方交易目录不可用，继续使用当前目录：${error.message}`
        }
        this.updateOverlay({ catalog: this.catalogStatus })
        throw error
      })
      .finally(() => { this.catalogRefreshPending = null })
    return this.catalogRefreshPending
  }

  updateSettings(patch = {}) {
    this.runtime.options = sanitizePriceCheckOptions({ ...this.runtime.options, ...patch })
    this.settingsRevision += 1
    this.updateOverlay({
      options: structuredClone(this.runtime.options),
      settingsRevision: this.settingsRevision,
      dcRate: this.currentDcRate()
    })
    return {
      options: structuredClone(this.runtime.options),
      settingsRevision: this.settingsRevision,
      dcRate: this.currentDcRate()
    }
  }

  currentDcRate() {
    if (this.dcRate?.value > 0) return structuredClone(this.dcRate)
    const manual = Number(this.runtime.options?.manualDcRate)
    return manual > 0
      ? { value: manual, source: 'manual', updatedAt: null, stale: false }
      : { value: null, source: 'unavailable', updatedAt: null, stale: false }
  }

  async refreshDcRate() {
    const oneHour = 60 * 60 * 1000
    if (Date.now() - this.dcRateAttemptedAt < oneHour) return this.currentDcRate()
    if (this.dcRatePending) return this.dcRatePending
    this.dcRateAttemptedAt = Date.now()
    this.dcRatePending = Promise.resolve()
      .then(() => this.dcRateProvider?.())
      .then((record) => {
        const value = Number(record?.chaosValue)
        if (record?.valid && value > 0) {
          this.dcRate = {
            value,
            source: 'poecurrency.top',
            updatedAt: record.observedAt || new Date().toISOString(),
            stale: false
          }
        }
        return this.currentDcRate()
      })
      .catch(() => this.currentDcRate())
      .finally(() => { this.dcRatePending = null })
    const snapshot = await this.dcRatePending
    if (this.latest) this.refreshLatestResult()
    this.updateOverlay({ dcRate: snapshot, ...(this.latest ? { result: this.latest.result } : {}) })
    return snapshot
  }

  parse(text, options = {}) {
    this.syncLocalizationRevision()
    let input = String(text || '')
    let localized = false
    let lineMappings = []
    if (this.client.server?.id === 'international') {
      this.localizationResolver ||= createLocalizationTextResolver(this.localizationProvider())
      if (!isMercenaryWarrantText(input)) {
        const resolved = this.localizationResolver.resolve(input, { normalizeStatSigns: true, catalog: this.catalog,
          resolveStatAmbiguity: (candidates, { type }) => {
            const supported = candidates.filter(candidate => {
              const text = candidate.replace(/(-?\d+(?:\.\d+)?)[（(](-?\d+(?:\.\d+)?)\s*[-–—]\s*(-?\d+(?:\.\d+)?)[）)]/g, '$1')
              return resolveCatalogStat(this.catalog, text, type).candidates.length > 0
            })
            return supported.length === 1 ? supported[0] : null
          }
        })
        input = resolved.text
        localized = resolved.localized
        lineMappings = resolved.lineMappings || []
      }
    }
    const item = parseItemInfo(input)
    if (!item) throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '剪贴板中没有可识别的物品')
    try {
      const model = this.modelFromItem(item, options)
      // Viscera already requires an exact category-scoped catalog base after removing a display grade.
      if (localized && model.identity.category !== 'viscera') {
        const identity = model.identity
        // Do not let the generic model's suffix fallback reduce an unknown translated base to "Ring".
        const rawCopiedBase = String(item.baseName || item.name || '')
        const copiedBase = model.identityPrecision?.requiresConsent
          ? rawCopiedBase.replace(/^(?:Vestigial\s+|退化|殘存\s*)/, '')
          : rawCopiedBase
        const expectedType = model.identityPrecision?.requiresConsent
          ? String(identity.type || '').replace(/^(?:Vestigial\s+|退化|殘存\s*)/, '')
          : identity.type
        const mapIdentity = identity.discriminator === 'map' && copiedBase === '地图' && expectedType === 'Map'
        const blightMapIdentity = ['blighted', 'uberblighted'].includes(identity.discriminator) && copiedBase === '地图'
        const candidates = (this.catalog.items || []).filter(entry => (
          ((String(entry.baseType || entry.type || '') === copiedBase && copiedBase === expectedType) ||
            (entry.discriminator === identity.discriminator && entry.baseType === expectedType &&
              (entry.text === copiedBase || (blightMapIdentity && entry.text === identity.displayName))) ||
            (mapIdentity && entry.baseType === 'Map' && entry.discriminator === 'map')) &&
          (!identity.name || String(entry.name || '') === identity.name)
        ))
        if (!candidates.length && !model.identityResolution?.required) {
          throw new Error('中文物品身份未匹配国际服交易目录，已阻止查询；请更新目录与汉化资源')
        }
      }
      applyOriginalModifierText(model, lineMappings)
      return this.client.server?.id === 'international'
        ? applyGameTextPresentation(model, { source: text, lineMappings, resolver: this.localizationResolver, catalog: this.catalog })
        : model
    } catch (error) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, error.message || '剪贴板物品无法用于查价')
    }
  }

  syncLocalizationRevision() {
    if (this.client.server?.id !== 'international') return
    const revision = String(this.localizationRevisionProvider() || '')
    if (revision === this.localizationRevision) return
    this.localizationRevision = revision
    this.localizationResolver = null
    this.mercenaryResolver = null
    this.clear()
  }

  assertLocalizationRevision(revision) {
    this.syncLocalizationRevision()
    if (revision !== this.localizationRevision) throw new DOMException('汉化资源已更改，请重新查询', 'AbortError')
  }

  modelFromItem(item, options = {}) {
    this.syncLocalizationRevision()
    try {
      let mercenaryResolver = null
      if (item?.mercenary && this.client.server?.id === 'international') {
        this.mercenaryResolver ||= createMercenaryWarrantResolver(this.localizationProvider(), this.mercenaryReferenceCatalog)
        mercenaryResolver = this.mercenaryResolver
      }
      return createPriceCheckModel(structuredClone(item), this.catalog, options, mercenaryResolver)
    } catch (error) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, error.message || '物品无法用于查价')
    }
  }

  async checkCapturedItem({ item, ...request }) {
    return this.check({ ...request, model: this.modelFromItem(item, request.options) })
  }

  async check({ text, league, model, options = {}, reposition = true, execute = true, queryImmediately = true, source = 'capture' }) {
    this.assertEnabled()
    this.syncLocalizationRevision()
    const localizationRevision = this.localizationRevision
    options = sanitizePriceCheckOptions(options)
    queryImmediately = queryImmediately === true
    const rawItemText = typeof text === 'string' ? text : ''
    if (rawItemText) this.lastItemText = rawItemText
    const itemText = rawItemText || (model ? this.lastItemText : '')
    this.controller?.abort()
    const controller = new AbortController()
    this.controller = controller
    const requestSequence = ++this.requestSequence
    if (!String(league || '').trim()) {
      const error = new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, `请选择${this.client.server?.label || '国服'}赛季`)
      this.recordFailure('precondition', error, { league, options, itemText, model, source })
      throw error
    }
    if (!this.auth.getStatus().authenticated) {
      const error = new ChaosRecipeError(CHAOS_ERROR_CODES.UNAUTHENTICATED, `请先登录${this.client.server?.label || '国服'}账号`)
      this.recordFailure('precondition', error, { league, options, itemText, model, source })
      this.createOverlay({ status: 'error', error: error.toJSON(), catalog: this.catalogStatus, auth: this.auth.getStatus(), league }, { reposition })
      throw error
    }
    let currentModel
    try {
      currentModel = model ? sanitizePriceCheckModel(model, this.catalog) : this.parse(text, options)
      if (this.client.server?.id === 'international') {
        this.localizationResolver ||= createLocalizationTextResolver(this.localizationProvider())
        applyGameTextPresentation(currentModel, { resolver: this.localizationResolver, catalog: this.catalog, texts: [league] })
      }
    } catch (error) {
      this.recordFailure(model ? 'model' : 'parse', error, { league, options, itemText, model, source })
      this.createOverlay({ status: 'error', error: { code: error.code || CHAOS_ERROR_CODES.INVALID_REQUEST, message: error.message }, catalog: this.catalogStatus, auth: this.auth.getStatus(), league }, { reposition })
      throw error
    }
    if (this.client.server?.id === 'international' && currentModel.unknownStats?.length) {
      const unknown = currentModel.unknownStats
      const error = new ChaosRecipeError('LOCALIZATION_STATS_UNRESOLVED', `有 ${unknown.length} 条词缀无法唯一匹配国际服交易目录，已阻止省略条件查询：${unknown[0].text.slice(0, 120)}`, {
        stats: unknown.map(({ text, reason }) => ({ text, reason })).slice(0, 24)
      })
      this.recordFailure('stat-match', error, { league, options, itemText, model: currentModel, source })
      throw error
    }
    if (currentModel.identityResolution?.required) {
      this.latest = {
        league,
        model: currentModel,
        queryImmediately,
        options: structuredClone(options),
        result: null,
        rawEntries: [],
        remainingResultIds: [],
        updatedAt: new Date().toISOString()
      }
      const status = currentModel.identityResolution.candidates?.length ? 'identity-required' : 'error'
      if (status === 'error') {
        this.recordFailure(
          'identity',
          new ChaosRecipeError('IDENTITY_UNRESOLVED', currentModel.identityResolution.message || '无法确定物品身份'),
          { league, options, itemText, model: currentModel, source }
        )
      }
      const state = {
        status,
        ...this.latest,
        settingsRevision: this.settingsRevision,
        dcRate: this.currentDcRate(),
        catalog: this.catalogStatus,
        auth: this.auth.getStatus(),
        error: status === 'error'
          ? { code: 'IDENTITY_UNRESOLVED', message: currentModel.identityResolution.message }
          : undefined
      }
      this.createOverlay(state, { reposition })
      void this.refreshDcRate()
      return structuredClone(this.latest)
    }
    if (execute === false || (currentModel.identityPrecision?.requiresConsent && !currentModel.identityPrecision.allowNameOnly)) {
      this.latest = {
        league,
        model: currentModel,
        queryImmediately,
        options: structuredClone(options),
        result: null,
        rawEntries: [],
        remainingResultIds: [],
        updatedAt: new Date().toISOString()
      }
      this.createOverlay({
        status: 'ready-to-query',
        ...this.latest,
        settingsRevision: this.settingsRevision,
        dcRate: this.currentDcRate(),
        catalog: this.catalogStatus,
        auth: this.auth.getStatus()
      }, { reposition })
      void this.refreshDcRate()
      return structuredClone(this.latest)
    }
    let query
    try {
      query = buildOfficialTradeQuery(currentModel, options)
    } catch (error) {
      this.recordFailure('model', error, { league, options, itemText, model: currentModel, source })
      throw error
    }
    let effectiveQuery = query
    this.latest = null
    this.createOverlay({
      status: 'loading', league, model: currentModel, options,
      settingsRevision: this.settingsRevision, dcRate: this.currentDcRate(),
      catalog: this.catalogStatus, auth: this.auth.getStatus(), query
    }, { reposition })
    try {
      let search
      try {
        search = await this.client.search(league, effectiveQuery, { signal: controller.signal })
      } catch (error) {
        if (isQueryTooComplexError(error)) {
          const hasMercenaryGroups = effectiveQuery.query?.stats?.some(({ type }) => type === 'mercenary')
          throw new ChaosRecipeError(
            CHAOS_ERROR_CODES.QUERY_TOO_COMPLEX,
            hasMercenaryGroups
              ? '所选佣兵技能组过多，官方交易接口认为查询过于复杂；请减少启用的技能组后重试'
              : '所选查询条件过多，官方交易接口认为查询过于复杂；请减少启用的筛选条件后重试',
            { officialMessage: error.details?.officialMessage }
          )
        } else if (isUnknownBaseTypeError(error) && this.client.server?.id !== 'international' && effectiveQuery.query?.name && effectiveQuery.query?.type) {
          effectiveQuery = withoutBaseType(effectiveQuery)
          search = await this.client.search(league, effectiveQuery, { signal: controller.signal })
        } else if (isUnknownBaseTypeError(error)) {
          const baseType = String(
            effectiveQuery.query?.type?.option || effectiveQuery.query?.type || currentModel.identity?.type || ''
          ).trim()
          throw new ChaosRecipeError(
            CHAOS_ERROR_CODES.INVALID_REQUEST,
            `${this.client.server?.label || '国服'}交易接口不认识物品底材“${baseType || '未知'}”，请重新复制物品；如果这是通货，请使用游戏内货币兑换`,
            { baseType, officialMessage: error.details?.officialMessage }
          )
        } else {
          throw error
        }
      }
      const allIds = resultIds(search).slice(0, 100)
      const ids = allIds.slice(0, 10)
      const fetched = ids.length ? await this.client.fetch(search.id, ids, { signal: controller.signal }) : { result: [] }
      this.assertLocalizationRevision(localizationRevision)
      if (requestSequence !== this.requestSequence) throw new DOMException('查询已取消', 'AbortError')
      const rawEntries = fetched.result.filter(Boolean)
      const result = this.createResult(search.id, Number(search.total) || resultIds(search).length, rawEntries)
      this.latest = {
        league,
        model: currentModel,
        queryImmediately,
        query: effectiveQuery,
        options: structuredClone(options),
        result,
        rawEntries,
        remainingResultIds: allIds.slice(10),
        updatedAt: new Date().toISOString()
      }
      this.updateOverlay({ status: 'ready', ...this.latest, dcRate: this.currentDcRate(), catalog: this.catalogStatus, auth: this.auth.getStatus() })
      void this.refreshDcRate()
      return structuredClone(this.latest)
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      if (requestSequence !== this.requestSequence || controller.signal.aborted) throw error
      this.recordFailure('query', error, {
        league, options, itemText, model: currentModel, query: effectiveQuery, source
      })
      if (error?.code === CHAOS_ERROR_CODES.SESSION_EXPIRED) await this.auth.expire?.()
      this.syncLocalizationRevision()
      if (requestSequence === this.requestSequence && !controller.signal.aborted && this.auth.getStatus().authenticated) {
        // Keep the current model for retrying a failed search or identity choice.
        this.latest = {
          league, model: currentModel, queryImmediately, options: structuredClone(options),
          result: null, rawEntries: [], remainingResultIds: [], updatedAt: new Date().toISOString()
        }
      }
      this.updateOverlay({ status: 'error', error: errorSnapshot(error), auth: this.auth.getStatus() })
      throw error
    }
  }

  createResult(queryId, total, entries) {
    const accountName = this.auth.getStatus().accountName
    const summary = summarizeListings(entries, accountName, this.catalog.currencyLabels)
    return {
      queryId,
      total,
      ...summary,
      listings: summary.listings.slice(0, 50),
      distribution: buildPriceDistribution(entries, accountName, this.currentDcRate(), 100, this.catalog.currencyLabels)
    }
  }

  refreshLatestResult(latest = this.latest) {
    if (!latest?.result?.queryId) return
    latest.result = this.createResult(
      latest.result.queryId,
      latest.result.total,
      latest.rawEntries
    )
    latest.result.distribution.complete = latest.remainingResultIds.length === 0
  }

  getOverlayState() { return this.overlay?.getState?.() || null }
  getOverlayPresentation() { return this.overlay?.getPresentation?.() || null }
  markOverlayLoadingReady(contents) { return this.overlay?.markLoadingReady?.(contents) || false }
  markOverlayRendered(contents, generation) { return this.overlay?.markRendered?.(contents, generation) || false }
  closeOverlay(reason = PRICE_CHECK_OVERLAY_CLOSE_REASONS.SYSTEM) {
    this.requestSequence += 1
    this.captureSequence += 1
    this.pendingHotkeyCapture = null
    this.controller?.abort()
    this.controller = null
    this.overlay?.close?.(reason)
    return { closed: true }
  }

  destroyOverlay() {
    this.requestSequence += 1
    this.captureSequence += 1
    this.pendingHotkeyCapture = null
    this.controller?.abort()
    this.controller = null
    this.overlay?.destroy?.()
    this.disposeClipboardCapture?.()
    return { destroyed: true }
  }

  currentQuerySource() {
    this.assertEnabled()
    this.syncLocalizationRevision()
    return this.latest || this.overlay?.getState?.()
  }

  async rerun(request = {}) {
    const source = this.currentQuerySource()
    if (!source?.model) {
      const error = new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '没有可重新查询的物品')
      this.recordFailure('precondition', error, { source: 'rerun' })
      throw error
    }
    const model = sanitizePriceCheckModel(
      request.model || source.model,
      this.catalog,
      source.model.facts,
      source.model.item?.category,
      source.model
    )
    return this.check({
      league: String(request.league || source.league || ''),
      model,
      options: request.options || {},
      execute: true,
      queryImmediately: source.queryImmediately === true,
      reposition: false,
      source: 'rerun'
    })
  }

  async resolveIdentity(candidateKey) {
    const source = this.currentQuerySource()
    const candidates = source?.model?.identityResolution?.candidates || []
    const candidate = candidates.find((entry) => entry.key === String(candidateKey || ''))
    if (!candidate) {
      const error = new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '未鉴定传奇候选无效')
      this.recordFailure('resolve', error, {
        league: source?.league, options: source?.options, model: source?.model, source: 'rerun'
      })
      throw error
    }
    const model = structuredClone(source.model)
    model.identity = {
      ...model.identity,
      name: candidate.name,
      type: candidate.baseType,
      nameEnabled: true
    }
    model.identityResolution = { ...model.identityResolution, required: false, selectedKey: candidate.key }
    const queryImmediately = source.queryImmediately === true
    return this.check({
      league: source.league,
      model,
      options: source.options || this.runtime.options,
      execute: queryImmediately,
      queryImmediately,
      reposition: false,
      source: 'rerun'
    })
  }

  async resolveStatCandidate(unknownKey, candidateId) {
    const source = this.currentQuerySource()
    const model = structuredClone(source?.model || null)
    const unknownIndex = model?.unknownStats?.findIndex((entry) => entry.key === String(unknownKey || '')) ?? -1
    const unknown = unknownIndex >= 0 ? model.unknownStats[unknownIndex] : null
    const candidate = unknown?.candidates?.find((entry) => entry.id === String(candidateId || ''))
    if (!candidate) {
      const error = new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '词缀候选无效或已过期')
      this.recordFailure('resolve', error, {
        league: source?.league, options: source?.options, model: source?.model, source: 'rerun'
      })
      throw error
    }

    const options = sanitizePriceCheckOptions(source.options || this.runtime.options)
    mergeStatIntoList(model.stats, {
      id: candidate.id,
      label: candidate.label,
      text: unknown.text,
      ...(unknown.displayText ? { displayText: unknown.displayText } : {}),
      type: candidate.type,
      refs: candidate.refs || [],
      ref: candidate.ref,
      tier: unknown.tier,
      tags: unknown.tags || [],
      values: candidate.values || [],
      valueMultiplier: candidate.valueMultiplier,
      merge: candidate.merge,
      sources: [{
        key: `${candidate.type}:${candidate.id}`,
        id: candidate.id,
        type: candidate.type,
        text: unknown.text,
        ...(unknown.displayText ? { displayText: unknown.displayText } : {}),
        name: candidate.label,
        values: candidate.values || [],
        valueMultiplier: candidate.valueMultiplier,
        refs: candidate.refs || [],
        ref: candidate.ref
      }],
      enabled: true,
      min: candidate.min,
      max: candidate.max
    })
    model.unknownStats.splice(unknownIndex, 1)
    refreshPseudoStats(model, this.catalog, options)
    const queryImmediately = source.queryImmediately === true
    return this.check({
      league: source.league,
      model,
      options: source.options || this.runtime.options,
      execute: queryImmediately,
      queryImmediately,
      reposition: false,
      source: 'rerun'
    })
  }

  async loadMore() {
    this.assertEnabled()
    this.syncLocalizationRevision()
    const localizationRevision = this.localizationRevision
    if (!this.latest?.result?.queryId) {
      const error = new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '没有可加载的查价结果')
      this.recordFailure('load-more', error, {
        league: this.latest?.league, options: this.latest?.options, model: this.latest?.model, source: 'rerun'
      })
      throw error
    }
    const latest = this.latest
    const requestSequence = this.requestSequence
    const signal = this.controller?.signal
    const assertCurrent = () => {
      this.assertLocalizationRevision(localizationRevision)
      if (signal?.aborted || requestSequence !== this.requestSequence || latest !== this.latest) {
        throw new DOMException('查询已取消', 'AbortError')
      }
    }
    if (latest.rawEntries.length >= 50) return structuredClone(latest)
    const ids = latest.remainingResultIds.splice(
      0,
      Math.min(10, 50 - latest.rawEntries.length)
    )
    if (!ids.length) return structuredClone(latest)
    let fetched
    try { fetched = await this.client.fetch(latest.result.queryId, ids, { signal }) }
    catch (error) {
      latest.remainingResultIds.unshift(...ids)
      assertCurrent()
      this.recordFailure('load-more', error, {
        league: latest.league, options: latest.options, model: latest.model, query: latest.query, source: 'rerun'
      })
      throw error
    }
    assertCurrent()
    latest.rawEntries.push(...fetched.result.filter(Boolean))
    this.refreshLatestResult(latest)
    latest.updatedAt = new Date().toISOString()
    this.updateOverlay({ status: 'ready', ...latest })
    return structuredClone(latest)
  }

  async loadDistribution() {
    this.assertEnabled()
    this.syncLocalizationRevision()
    const localizationRevision = this.localizationRevision
    if (!this.latest?.result?.queryId) {
      const error = new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '没有可分析的查价结果')
      this.recordFailure('distribution', error, {
        league: this.latest?.league, options: this.latest?.options, model: this.latest?.model, source: 'rerun'
      })
      throw error
    }
    const latest = this.latest
    const requestSequence = this.requestSequence
    const signal = this.controller?.signal
    let previousRequestStartedAt = null
    const assertCurrent = () => {
      this.assertLocalizationRevision(localizationRevision)
      if (signal?.aborted || requestSequence !== this.requestSequence || latest !== this.latest) {
        throw new DOMException('查询已取消', 'AbortError')
      }
    }
    while (latest.remainingResultIds.length && latest.rawEntries.length < 100) {
      if (previousRequestStartedAt != null) {
        const wait = Math.max(0, previousRequestStartedAt + DISTRIBUTION_REQUEST_INTERVAL_MS - this.now())
        if (wait > 0) await this.distributionWait(wait, signal)
        assertCurrent()
      }
      previousRequestStartedAt = this.now()
      const ids = latest.remainingResultIds.splice(0, 10)
      let fetched
      try {
        fetched = await this.client.fetch(latest.result.queryId, ids, { signal })
      } catch (error) {
        latest.remainingResultIds.unshift(...ids)
        assertCurrent()
        if (error?.code !== CHAOS_ERROR_CODES.RATE_LIMITED) {
          this.recordFailure('distribution', error, {
            league: latest.league, options: latest.options, model: latest.model, query: latest.query, source: 'rerun'
          })
          throw error
        }
        this.refreshLatestResult(latest)
        latest.rateLimit = errorSnapshot(error, CHAOS_ERROR_CODES.RATE_LIMITED)
        latest.updatedAt = new Date().toISOString()
        this.updateOverlay({ status: 'ready', ...latest, dcRate: this.currentDcRate() })
        return structuredClone(latest)
      }
      assertCurrent()
      latest.rawEntries.push(...fetched.result.filter(Boolean))
      latest.rateLimit = null
      this.refreshLatestResult(latest)
      latest.updatedAt = new Date().toISOString()
      this.updateOverlay({ status: 'ready', ...latest, dcRate: this.currentDcRate() })
    }
    assertCurrent()
    this.refreshLatestResult(latest)
    latest.rateLimit = null
    latest.result.distribution.complete = true
    this.updateOverlay({ status: 'ready', ...latest, dcRate: this.currentDcRate() })
    return structuredClone(latest)
  }

  async openOfficial() {
    this.assertEnabled()
    this.syncLocalizationRevision()
    if (!this.latest) {
      const error = new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '没有可打开的查价查询')
      this.recordFailure?.('official', error, { source: 'rerun' })
      throw error
    }
    const queryId = encodeTradeQueryId(this.latest.result?.queryId)
    const url = `${this.client?.origin || POE_CN_TRADE_ORIGIN}/trade/search/${encodeURIComponent(this.latest.league)}/${queryId}`
    this.overlay?.preserveForExternalAction?.()
    try {
      await this.shell.openExternal(url)
    } catch (error) {
      this.recordFailure?.('official', error, {
        league: this.latest.league, options: this.latest.options, model: this.latest.model, source: 'rerun'
      })
      throw error
    }
    this.closeOverlay(PRICE_CHECK_OVERLAY_CLOSE_REASONS.EXTERNAL_ACTION)
    return { opened: true }
  }
}
