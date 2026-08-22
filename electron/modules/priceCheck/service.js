import { parseItemInfo } from '../item/parser.js'
import { CHAOS_ERROR_CODES, ChaosRecipeError } from '../chaosRecipe/errors.js'
import { PRICE_CHECK_OVERLAY_CLOSE_REASONS } from './overlayFocus.js'
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
    message: error?.message || '国服查价失败',
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
    dcRateProvider = null,
    catalogRefresher = null,
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
    this.dcRateProvider = dcRateProvider
    this.catalogRefresher = catalogRefresher
    this.now = now
    this.distributionWait = distributionWait
    this.catalogRefreshPending = null
    this.controller = null
    this.requestSequence = 0
    this.captureSequence = 0
    this.latest = null
    this.settingsRevision = 0
    this.dcRate = null
    this.dcRateAttemptedAt = 0
    this.dcRatePending = null
    this.runtime = { enabled: false, league: '', options: sanitizePriceCheckOptions() }
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
    const hasOptions = runtime.options && typeof runtime.options === 'object'
    this.runtime = {
      enabled,
      league: String(runtime.league || '').slice(0, 120),
      options: hasOptions ? sanitizePriceCheckOptions(runtime.options) : this.runtime.options
    }
    if (hasOptions) this.settingsRevision += 1
    if (enabled) this.overlay?.prepare?.()
    else {
      this.clear()
      this.destroyOverlay()
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
      const queryImmediately = request?.queryImmediately === true
      return this.check({
        ...request,
        text,
        model: undefined,
        execute: queryImmediately,
        queryImmediately
      })
    } catch (error) {
      if (captureSequence === this.captureSequence && error?.name !== 'AbortError') this.overlay?.create?.({
        status: 'error',
        error: errorSnapshot(error, CHAOS_ERROR_CODES.INVALID_REQUEST),
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
      options: structuredClone(this.runtime.options),
      settingsRevision: this.settingsRevision,
      dcRate: this.currentDcRate(),
      auth: this.auth.getStatus(),
      catalog: this.catalogStatus,
      latest: this.latest ? { league: this.latest.league, updatedAt: this.latest.updatedAt } : null
    }
  }

  async refreshCatalog() {
    if (!this.catalogRefresher) throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '当前环境不支持刷新交易目录')
    if (this.catalogRefreshPending) return this.catalogRefreshPending
    this.catalogStatus = {
      ...this.catalogStatus,
      loading: true,
      warning: '正在刷新腾讯官方物品与词缀目录…'
    }
    this.overlay?.update?.({ catalog: this.catalogStatus })
    this.catalogRefreshPending = Promise.resolve()
      .then(() => this.catalogRefresher())
      .then((bundle) => {
        this.catalog = bundle.catalog
        this.catalogStatus = { ...bundle.status, loading: false, warning: '' }
        this.overlay?.update?.({ catalog: this.catalogStatus })
        return this.catalogStatus
      })
      .catch((error) => {
        this.catalogStatus = {
          ...this.catalogStatus,
          provider: this.catalogStatus.provider || 'bundled',
          degraded: true,
          loading: false,
          warning: `腾讯官方交易目录不可用，继续使用当前目录：${error.message}`
        }
        this.overlay?.update?.({ catalog: this.catalogStatus })
        throw error
      })
      .finally(() => { this.catalogRefreshPending = null })
    return this.catalogRefreshPending
  }

  updateSettings(patch = {}) {
    this.runtime.options = sanitizePriceCheckOptions({ ...this.runtime.options, ...patch })
    this.settingsRevision += 1
    this.overlay?.update?.({
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
    this.overlay?.update?.({ dcRate: snapshot, ...(this.latest ? { result: this.latest.result } : {}) })
    return snapshot
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

  async check({ text, league, model, options = {}, reposition = true, execute = true, queryImmediately = true }) {
    this.assertEnabled()
    options = sanitizePriceCheckOptions(options)
    queryImmediately = queryImmediately === true
    this.controller?.abort()
    const controller = new AbortController()
    this.controller = controller
    const requestSequence = ++this.requestSequence
    if (!String(league || '').trim()) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '请选择国服赛季')
    }
    if (!this.auth.getStatus().authenticated) {
      const error = new ChaosRecipeError(CHAOS_ERROR_CODES.UNAUTHENTICATED, '请先登录国服账号')
      this.overlay?.create?.({ status: 'error', error: error.toJSON(), catalog: this.catalogStatus, auth: this.auth.getStatus(), league }, { reposition })
      throw error
    }
    let currentModel
    try {
      currentModel = model ? sanitizePriceCheckModel(model, this.catalog) : this.parse(text, options)
    } catch (error) {
      this.overlay?.create?.({ status: 'error', error: { code: error.code || CHAOS_ERROR_CODES.INVALID_REQUEST, message: error.message }, catalog: this.catalogStatus, auth: this.auth.getStatus(), league }, { reposition })
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
      this.overlay?.create?.(state, { reposition })
      void this.refreshDcRate()
      return structuredClone(this.latest)
    }
    if (execute === false) {
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
      this.overlay?.create?.({
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
    const query = buildOfficialTradeQuery(currentModel, options)
    this.latest = null
    this.overlay?.create?.({
      status: 'loading', league, model: currentModel, options,
      settingsRevision: this.settingsRevision, dcRate: this.currentDcRate(),
      catalog: this.catalogStatus, auth: this.auth.getStatus(), query
    }, { reposition })
    try {
      let effectiveQuery = query
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
        } else if (isUnknownBaseTypeError(error) && effectiveQuery.query?.name && effectiveQuery.query?.type) {
          effectiveQuery = withoutBaseType(effectiveQuery)
          search = await this.client.search(league, effectiveQuery, { signal: controller.signal })
        } else if (isUnknownBaseTypeError(error)) {
          const baseType = String(
            effectiveQuery.query?.type?.option || effectiveQuery.query?.type || currentModel.identity?.type || ''
          ).trim()
          throw new ChaosRecipeError(
            CHAOS_ERROR_CODES.INVALID_REQUEST,
            `国服交易接口不认识物品底材“${baseType || '未知'}”，请重新复制物品；如果这是通货，请使用游戏内货币兑换`,
            { baseType, officialMessage: error.details?.officialMessage }
          )
        } else {
          throw error
        }
      }
      const allIds = resultIds(search).slice(0, 100)
      const ids = allIds.slice(0, 10)
      const fetched = ids.length ? await this.client.fetch(search.id, ids, { signal: controller.signal }) : { result: [] }
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
      this.overlay?.update?.({ status: 'ready', ...this.latest, dcRate: this.currentDcRate(), catalog: this.catalogStatus, auth: this.auth.getStatus() })
      void this.refreshDcRate()
      return structuredClone(this.latest)
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      if (error?.code === CHAOS_ERROR_CODES.SESSION_EXPIRED) await this.auth.expire?.()
      this.overlay?.update?.({ status: 'error', error: errorSnapshot(error), auth: this.auth.getStatus() })
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
  markOverlayRendered(contents, generation) { return this.overlay?.markRendered?.(contents, generation) || false }
  closeOverlay(reason = PRICE_CHECK_OVERLAY_CLOSE_REASONS.SYSTEM) {
    this.requestSequence += 1
    this.captureSequence += 1
    this.controller?.abort()
    this.controller = null
    this.overlay?.close?.(reason)
    return { closed: true }
  }

  destroyOverlay() {
    this.requestSequence += 1
    this.captureSequence += 1
    this.controller?.abort()
    this.controller = null
    this.overlay?.destroy?.()
    return { destroyed: true }
  }

  async rerun(request = {}) {
    this.assertEnabled()
    const source = this.latest || this.overlay?.getState?.()
    if (!source?.model) throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '没有可重新查询的物品')
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
      reposition: false
    })
  }

  async resolveIdentity(candidateKey) {
    this.assertEnabled()
    const source = this.latest || this.overlay?.getState?.()
    const candidates = source?.model?.identityResolution?.candidates || []
    const candidate = candidates.find((entry) => entry.key === String(candidateKey || ''))
    if (!candidate) throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '未鉴定传奇候选无效')
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
      reposition: false
    })
  }

  async resolveStatCandidate(unknownKey, candidateId) {
    this.assertEnabled()
    const source = this.latest || this.overlay?.getState?.()
    const model = structuredClone(source?.model || null)
    const unknownIndex = model?.unknownStats?.findIndex((entry) => entry.key === String(unknownKey || '')) ?? -1
    const unknown = unknownIndex >= 0 ? model.unknownStats[unknownIndex] : null
    const candidate = unknown?.candidates?.find((entry) => entry.id === String(candidateId || ''))
    if (!candidate) throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '词缀候选无效或已过期')

    const options = sanitizePriceCheckOptions(source.options || this.runtime.options)
    mergeStatIntoList(model.stats, {
      id: candidate.id,
      label: candidate.label,
      text: unknown.text,
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
      reposition: false
    })
  }

  async loadMore() {
    this.assertEnabled()
    if (!this.latest?.result?.queryId) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '没有可加载的查价结果')
    }
    if (this.latest.rawEntries.length >= 50) return structuredClone(this.latest)
    const ids = this.latest.remainingResultIds.splice(
      0,
      Math.min(10, 50 - this.latest.rawEntries.length)
    )
    if (!ids.length) return structuredClone(this.latest)
    const fetched = await this.client.fetch(this.latest.result.queryId, ids)
    this.latest.rawEntries.push(...fetched.result.filter(Boolean))
    this.refreshLatestResult()
    this.latest.updatedAt = new Date().toISOString()
    this.overlay?.update?.({ status: 'ready', ...this.latest })
    return structuredClone(this.latest)
  }

  async loadDistribution() {
    this.assertEnabled()
    if (!this.latest?.result?.queryId) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '没有可分析的查价结果')
    }
    const latest = this.latest
    const requestSequence = this.requestSequence
    const signal = this.controller?.signal
    let previousRequestStartedAt = null
    const assertCurrent = () => {
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
        if (error?.code !== CHAOS_ERROR_CODES.RATE_LIMITED) throw error
        this.refreshLatestResult(latest)
        latest.rateLimit = errorSnapshot(error, CHAOS_ERROR_CODES.RATE_LIMITED)
        latest.updatedAt = new Date().toISOString()
        this.overlay?.update?.({ status: 'ready', ...latest, dcRate: this.currentDcRate() })
        return structuredClone(latest)
      }
      assertCurrent()
      latest.rawEntries.push(...fetched.result.filter(Boolean))
      latest.rateLimit = null
      this.refreshLatestResult(latest)
      latest.updatedAt = new Date().toISOString()
      this.overlay?.update?.({ status: 'ready', ...latest, dcRate: this.currentDcRate() })
    }
    assertCurrent()
    this.refreshLatestResult(latest)
    latest.rateLimit = null
    latest.result.distribution.complete = true
    this.overlay?.update?.({ status: 'ready', ...latest, dcRate: this.currentDcRate() })
    return structuredClone(latest)
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
    this.closeOverlay(PRICE_CHECK_OVERLAY_CLOSE_REASONS.EXTERNAL_ACTION)
    return { opened: true }
  }
}
