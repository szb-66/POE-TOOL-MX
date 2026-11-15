import { getServer, SERVERS } from '../../../shared/serverMode.js'
import { CHAOS_ERROR_CODES, ChaosRecipeError } from './errors.js'

const LOGIN_HTML_PATTERN = /<title>流放之路<\/title>|需要登录|\/login\?redir=|<title>[^<]*(?:log in|sign in)[^<]*<\/title>/i

function retryAfterSeconds(headers) {
  const raw = headers?.get?.('retry-after')
  const seconds = Number(raw)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds
  const date = Date.parse(raw)
  return Number.isFinite(date) ? Math.max(0, Math.ceil((date - Date.now()) / 1000)) : 60
}

export async function requestPoeCnJson(session, url, { signal, headers = {}, method = 'GET', body } = {}) {
  const serverLabel = Object.values(SERVERS).find(server => server.origin === new URL(url).origin)?.label || '官网'
  let response
  try {
    response = await session.fetch(url, {
      method,
      ...(body === undefined ? {} : { body }),
      cache: 'no-store',
      signal: signal || AbortSignal.timeout(15000),
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        'User-Agent': 'OAuth exile-helper/1.0.0 (contact: local-desktop-app)',
        ...headers
      }
    })
  } catch (error) {
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.NETWORK_ERROR, `无法连接${serverLabel}网站：${error.message}`)
  }

  const text = await response.text()
  if (response.status === 401 || LOGIN_HTML_PATTERN.test(text)) {
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.SESSION_EXPIRED, `${serverLabel}登录会话已失效`)
  }
  if (response.status === 429) {
    const retryAfter = retryAfterSeconds(response.headers)
    throw new ChaosRecipeError(
      CHAOS_ERROR_CODES.RATE_LIMITED,
      `${serverLabel}接口请求过于频繁，请在 ${retryAfter} 秒后重试`,
      { retryAfter }
    )
  }
  if (response.status === 403) throw new ChaosRecipeError('ACCESS_DENIED', '网站拒绝访问此接口；当前会话或接口可能不受支持', { status: 403 })
  if (!response.ok) {
    throw new ChaosRecipeError(
      CHAOS_ERROR_CODES.API_INCOMPATIBLE,
      `${serverLabel}接口返回 HTTP ${response.status}`,
      { status: response.status }
    )
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new ChaosRecipeError(
      CHAOS_ERROR_CODES.API_INCOMPATIBLE,
      `${serverLabel}接口没有返回可识别的 JSON 数据`,
      { contentType: response.headers?.get?.('content-type') || '' }
    )
  }
}

export function isPoeCnAllowedUrl(value, server = getServer()) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return false
    const hostname = url.hostname.toLowerCase()
    if (server.id === 'international') return ['www.pathofexile.com', 'pathofexile.com', 'steamcommunity.com', 'www.epicgames.com'].includes(hostname)
    return hostname === 'poe.game.qq.com' ||
      hostname === 'poecdn.game.qq.com' ||
      hostname === 'qq.com' ||
      hostname.endsWith('.qq.com') ||
      hostname === 'game.qq.com' ||
      hostname.endsWith('.game.qq.com')
  } catch {
    return false
  }
}
