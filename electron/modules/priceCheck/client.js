import { CHAOS_ERROR_CODES, ChaosRecipeError } from '../chaosRecipe/errors.js'

const ORIGIN = 'https://poe.game.qq.com'
const LOGIN_HTML_PATTERN = /<title>流放之路<\/title>|需要登录|\/login\?redir=/i
const REQUEST_INTERVAL_MS = 5000
const CACHE_TTL_MS = 15_000

function retryAfterSeconds(headers) {
  const seconds = Number(headers?.get?.('retry-after'))
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : 60
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
  constructor({ session, now = () => Date.now() }) {
    this.session = session
    this.now = now
    this.cache = new Map()
    this.lastRequestAt = new Map()
    this.queue = Promise.resolve()
  }

  clearCache() { this.cache.clear() }

  async throttle(group, signal) {
    const wait = Math.max(0, (this.lastRequestAt.get(group) || 0) + REQUEST_INTERVAL_MS - this.now())
    if (!wait) return
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, wait)
      signal?.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('查询已取消', 'AbortError'))
      }, { once: true })
    })
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
      return parseJsonResponse(response)
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
