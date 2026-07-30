import { CHAOS_ERROR_CODES, ChaosRecipeError } from '../chaosRecipe/errors.js'

const ORIGIN = 'https://poe.game.qq.com'
const LOGIN_HTML_PATTERN = /<title>流放之路<\/title>|需要登录|\/login\?redir=/i
const DEFAULT_REQUEST_INTERVAL_MS = 5000
const FETCH_REQUEST_INTERVAL_MS = 750
const CACHE_TTL_MS = 15_000

function delay(ms, signal) {
  if (!(ms > 0)) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('查询已取消', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    if (signal?.aborted) onAbort()
    else signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function retryAfterSeconds(headers) {
  const seconds = Number(headers?.get?.('retry-after'))
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : 60
}

function rateLimitInterval(headers) {
  const rules = [
    headers?.get?.('x-rate-limit-account'),
    headers?.get?.('x-rate-limit-ip')
  ].filter(Boolean).flatMap((value) => String(value).split(','))
  const intervals = rules.map((rule) => {
    const [limit, windowSeconds] = rule.split(':').map(Number)
    return limit > 0 && windowSeconds > 0
      ? Math.ceil((windowSeconds * 1000) / limit) + 50
      : 0
  })
  return Math.min(60_000, Math.max(0, ...intervals))
}

async function parseJsonResponse(response) {
  const text = await response.text()
  if (response.status === 401 || LOGIN_HTML_PATTERN.test(text)) {
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.SESSION_EXPIRED, '国服登录会话已失效')
  }
  if (response.status === 429) {
    const retryAfter = retryAfterSeconds(response.headers)
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.RATE_LIMITED, `国服交易接口请求过于频繁，请在 ${retryAfter} 秒后重试`, { retryAfter })
  }
  if (!response.ok) {
    let officialMessage = ''
    try {
      const payload = JSON.parse(text)
      officialMessage = String(payload?.error?.message || payload?.message || '').trim().slice(0, 240)
    } catch {
      officialMessage = ''
    }
    const detail = officialMessage ? `：${officialMessage}` : ''
    throw new ChaosRecipeError(
      CHAOS_ERROR_CODES.API_INCOMPATIBLE,
      `国服交易接口返回 HTTP ${response.status}${detail}`,
      { status: response.status, officialMessage }
    )
  }
  try { return JSON.parse(text) } catch {
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.API_INCOMPATIBLE, '国服交易接口没有返回可识别的 JSON 数据')
  }
}

export class PoeCnTradeClient {
  constructor({ session, now = () => Date.now(), sleep = delay }) {
    this.session = session
    this.now = now
    this.sleep = sleep
    this.cache = new Map()
    this.lastRequestAt = new Map()
    this.blockedUntil = new Map()
    this.requestIntervals = new Map()
    this.queue = Promise.resolve()
  }

  clearCache() { this.cache.clear() }

  async throttle(group, signal) {
    const defaultInterval = group === 'fetch' ? FETCH_REQUEST_INTERVAL_MS : DEFAULT_REQUEST_INTERVAL_MS
    const interval = Math.max(defaultInterval, this.requestIntervals.get(group) || 0)
    const nextRequestAt = Math.max(
      (this.lastRequestAt.get(group) || 0) + interval,
      this.blockedUntil.get(group) || 0
    )
    const wait = Math.max(0, nextRequestAt - this.now())
    if (wait > 0) await this.sleep(wait, signal)
  }

  async request(path, { method = 'GET', body, signal } = {}) {
    const execute = async () => {
      const group = path.includes('/fetch/') ? 'fetch' : path.includes('/search/') ? 'search' : 'other'
      await this.throttle(group, signal)
      this.lastRequestAt.set(group, this.now())
      let response
      try {
        response = await this.session.fetch(`${ORIGIN}${path}`, {
          method,
          cache: 'no-store',
          signal,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            Origin: ORIGIN,
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: body == null ? undefined : JSON.stringify(body)
        })
      } catch (error) {
        if (error?.name === 'AbortError') throw error
        throw new ChaosRecipeError(CHAOS_ERROR_CODES.NETWORK_ERROR, `无法连接国服交易接口：${error.message}`)
      }
      const observedInterval = rateLimitInterval(response.headers)
      if (observedInterval > 0) this.requestIntervals.set(group, observedInterval)
      try {
        return await parseJsonResponse(response)
      } catch (error) {
        if (error?.code === CHAOS_ERROR_CODES.RATE_LIMITED) {
          const retryAfter = Number(error.details?.retryAfter)
          this.blockedUntil.set(group, this.now() + (Number.isFinite(retryAfter) ? retryAfter : 60) * 1000)
        }
        throw error
      }
    }
    const pending = this.queue.then(execute, execute)
    this.queue = pending.catch(() => {})
    return pending
  }

  async search(league, query, { signal } = {}) {
    const safeLeague = String(league || '').trim()
    if (!safeLeague || safeLeague.length > 80) throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '请选择有效国服赛季')
    const cacheKey = JSON.stringify([safeLeague, query])
    const cached = this.cache.get(cacheKey)
    if (cached && this.now() - cached.createdAt < CACHE_TTL_MS) return structuredClone(cached.value)
    const value = await this.request(`/api/trade/search/${encodeURIComponent(safeLeague)}`, { method: 'POST', body: query, signal })
    if (!value?.id || (!Array.isArray(value.result) && !value.result)) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.API_INCOMPATIBLE, '国服交易搜索响应缺少查询编号或结果')
    }
    this.cache.set(cacheKey, { createdAt: this.now(), value })
    return structuredClone(value)
  }

  async getStats({ signal } = {}) {
    const value = await this.request('/api/trade/data/stats', { signal })
    if (!Array.isArray(value?.result)) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.API_INCOMPATIBLE, '国服官方词缀目录响应结构不兼容')
    }
    return value
  }

  async getItems({ signal } = {}) {
    const value = await this.request('/api/trade/data/items', { signal })
    if (!Array.isArray(value?.result)) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.API_INCOMPATIBLE, '国服官方物品目录响应结构不兼容')
    }
    return value
  }

  async fetch(queryId, resultIds, { signal } = {}) {
    const ids = Array.isArray(resultIds) ? resultIds.filter((id) => /^[a-zA-Z0-9]+$/.test(String(id))).slice(0, 10) : []
    if (!/^[a-zA-Z0-9]+$/.test(String(queryId || '')) || !ids.length) return { result: [] }
    const value = await this.request(`/api/trade/fetch/${ids.join(',')}?query=${encodeURIComponent(queryId)}`, { signal })
    if (!Array.isArray(value?.result)) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.API_INCOMPATIBLE, '国服交易挂单响应结构不兼容')
    }
    return value
  }
}

export { ORIGIN as POE_CN_TRADE_ORIGIN }
