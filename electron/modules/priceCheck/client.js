import { CHAOS_ERROR_CODES, ChaosRecipeError } from '../chaosRecipe/errors.js'

const ORIGIN = 'https://poe.game.qq.com'
const LOGIN_HTML_PATTERN = /<title>流放之路<\/title>|需要登录|\/login\?redir=/i
const CACHE_TTL_MS = 15_000

function retryAfterDetails(headers, now) {
  const raw = String(headers?.get?.('retry-after') || '').trim()
  if (!raw) return {}
  const numeric = Number(raw)
  const retryAfter = Number.isFinite(numeric) && numeric >= 0
    ? Math.ceil(numeric)
    : (() => {
        const retryAt = Date.parse(raw)
        return Number.isFinite(retryAt) && retryAt >= now
          ? Math.ceil((retryAt - now) / 1000)
          : null
      })()
  return retryAfter == null
    ? {}
    : { retryAfter, retryAt: now + retryAfter * 1000 }
}

async function parseJsonResponse(response, now) {
  const text = await response.text()
  if (response.status === 401 || LOGIN_HTML_PATTERN.test(text)) {
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.SESSION_EXPIRED, '国服登录会话已失效')
  }
  if (response.status === 429) {
    const details = retryAfterDetails(response.headers, now)
    const message = details.retryAfter == null
      ? '国服交易接口已限制请求频率，但未提供恢复时间'
      : `国服交易接口已限制请求频率，请在 ${details.retryAfter} 秒后重试`
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.RATE_LIMITED, message, details)
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
    this.blockedUntil = new Map()
  }

  clearCache() { this.cache.clear() }

  assertNotRateLimited(group) {
    const retryAt = this.blockedUntil.get(group) || 0
    const now = this.now()
    if (retryAt <= now) {
      this.blockedUntil.delete(group)
      return
    }
    const retryAfter = Math.ceil((retryAt - now) / 1000)
    throw new ChaosRecipeError(
      CHAOS_ERROR_CODES.RATE_LIMITED,
      `国服交易接口已限制请求频率，请在 ${retryAfter} 秒后重试`,
      { retryAfter, retryAt }
    )
  }

  async request(path, { method = 'GET', body, signal } = {}) {
    const group = path.includes('/fetch/') ? 'fetch' : path.includes('/search/') ? 'search' : 'other'
    this.assertNotRateLimited(group)
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
    try {
      return await parseJsonResponse(response, this.now())
    } catch (error) {
      const retryAt = Number(error?.details?.retryAt)
      if (error?.code === CHAOS_ERROR_CODES.RATE_LIMITED && Number.isFinite(retryAt)) {
        this.blockedUntil.set(group, retryAt)
      }
      throw error
    }
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
