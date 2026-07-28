import { CHAOS_ERROR_CODES, ChaosRecipeError } from './errors.js'
import { requestPoeCnJson } from './http.js'
import { normalizeStashContents, normalizeStashTabs } from './normalizer.js'

const ORIGIN = 'https://poe.game.qq.com'
const encode = encodeURIComponent

function leagueNames(payload) {
  const list = Array.isArray(payload) ? payload : payload?.leagues
  if (!Array.isArray(list)) return []
  return list.map((league) => ({
    id: String(league?.id || league?.name || league || ''),
    name: String(league?.id || league?.name || league || '')
  })).filter((league) => league.id)
}

function usableTabs(payload) {
  const tabs = normalizeStashTabs(payload)
  if (!tabs.length) {
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.API_INCOMPATIBLE, '仓库接口未返回标签页列表')
  }
  return tabs
}

export class PoeCnStashClient {
  constructor({ session, getAuthStatus }) {
    this.session = session
    this.getAuthStatus = getAuthStatus
    this.providerByLeague = new Map()
    this.tabsByLeague = new Map()
    this.rateLimitedUntil = 0
  }

  clearCache() {
    this.providerByLeague.clear()
    this.tabsByLeague.clear()
    this.rateLimitedUntil = 0
  }

  assertAuthenticated() {
    const auth = this.getAuthStatus()
    if (!auth?.authenticated) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.UNAUTHENTICATED, '请先登录国服账号')
    }
    if (Date.now() < this.rateLimitedUntil) {
      const retryAfter = Math.ceil((this.rateLimitedUntil - Date.now()) / 1000)
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.RATE_LIMITED, `请在 ${retryAfter} 秒后重试`, { retryAfter })
    }
    return auth
  }

  async request(url) {
    try {
      return await requestPoeCnJson(this.session, url)
    } catch (error) {
      if (error.code === CHAOS_ERROR_CODES.RATE_LIMITED) {
        this.rateLimitedUntil = Date.now() + Number(error.details?.retryAfter || 60) * 1000
      }
      throw error
    }
  }

  async listLeagues() {
    this.assertAuthenticated()
    const payload = await this.request(`${ORIGIN}/api/leagues?type=main&realm=pc`)
    const leagues = leagueNames(payload)
    if (!leagues.length) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.API_INCOMPATIBLE, '国服赛季接口返回结构不受支持')
    }
    return leagues
  }

  async tryModernTabs(league) {
    const payload = await this.request(`${ORIGIN}/api/stash/${encode(league)}`)
    return usableTabs(payload)
  }

  async tryLegacyTabs(league, accountName) {
    const query = new URLSearchParams({
      accountName,
      realm: 'pc',
      league,
      tabs: '1',
      tabIndex: '0'
    })
    const payload = await this.request(`${ORIGIN}/character-window/get-stash-items?${query}`)
    return usableTabs(payload)
  }

  async listTabs(leagueInput) {
    const auth = this.assertAuthenticated()
    const league = String(leagueInput || '').trim()
    if (!league) throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '请选择国服赛季')
    const knownProvider = this.providerByLeague.get(league)
    let tabs
    if (knownProvider === 'modern') tabs = await this.tryModernTabs(league)
    else if (knownProvider === 'legacy') tabs = await this.tryLegacyTabs(league, auth.accountName)
    else {
      try {
        tabs = await this.tryModernTabs(league)
        this.providerByLeague.set(league, 'modern')
      } catch (modernError) {
        if (modernError.code === CHAOS_ERROR_CODES.SESSION_EXPIRED ||
            modernError.code === CHAOS_ERROR_CODES.RATE_LIMITED) throw modernError
        try {
          tabs = await this.tryLegacyTabs(league, auth.accountName)
          this.providerByLeague.set(league, 'legacy')
        } catch (legacyError) {
          if (legacyError.code === CHAOS_ERROR_CODES.SESSION_EXPIRED ||
              legacyError.code === CHAOS_ERROR_CODES.RATE_LIMITED) throw legacyError
          throw new ChaosRecipeError(
            CHAOS_ERROR_CODES.API_INCOMPATIBLE,
            '国服新版和旧版仓库接口均不兼容',
            { modern: modernError.message, legacy: legacyError.message }
          )
        }
      }
    }
    this.tabsByLeague.set(league, tabs)
    return tabs
  }

  async fetchTab(league, tab) {
    const auth = this.assertAuthenticated()
    if (!tab?.supported) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.UNSUPPORTED_TAB, `“${tab?.name || '未知仓库页'}”不是普通或大型仓库页`)
    }
    const provider = this.providerByLeague.get(league)
    let payload
    if (provider === 'modern') {
      const stashPath = tab.parent
        ? `${encode(tab.parent)}/${encode(tab.id)}`
        : encode(tab.id)
      payload = await this.request(`${ORIGIN}/api/stash/${encode(league)}/${stashPath}`)
      const modern = normalizeStashContents(payload, tab)
      const sourceLength = Number(modern.diagnostics?.sourceArrayLength || 0)
      const recognizedCount = Number(modern.diagnostics?.recognizedItemCount || 0)
      const shouldCompareLegacy = sourceLength === 0 || (sourceLength <= 3 && recognizedCount === 0)
      if (!shouldCompareLegacy) {
        modern.diagnostics.provider = 'modern'
        return modern
      }
      try {
        const legacy = await this.fetchLegacyTab(league, tab, auth.accountName)
        const legacyLength = Number(legacy.diagnostics?.sourceArrayLength || 0)
        const selected = legacyLength > sourceLength ? legacy : modern
        selected.diagnostics.provider = selected === legacy ? 'legacy-fallback' : 'modern'
        selected.diagnostics.comparedProviders = {
          modernItemCount: sourceLength,
          legacyItemCount: legacyLength
        }
        return selected
      } catch (error) {
        if (error.code === CHAOS_ERROR_CODES.SESSION_EXPIRED) throw error
        modern.diagnostics.provider = 'modern'
        modern.diagnostics.legacyFallbackError = error.code || CHAOS_ERROR_CODES.API_INCOMPATIBLE
        return modern
      }
    } else if (provider === 'legacy') {
      const legacy = await this.fetchLegacyTab(league, tab, auth.accountName)
      legacy.diagnostics.provider = 'legacy'
      return legacy
    } else {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.API_INCOMPATIBLE, '尚未确定国服仓库接口模式')
    }
  }

  async fetchLegacyTab(league, tab, accountName) {
    const query = new URLSearchParams({
      accountName,
      realm: 'pc',
      league,
      tabs: '0',
      tabIndex: String(tab.index)
    })
    const payload = await this.request(`${ORIGIN}/character-window/get-stash-items?${query}`)
    return normalizeStashContents(payload, tab)
  }

  async fetchTabs(league, selectedIds) {
    const tabs = this.tabsByLeague.get(league) || await this.listTabs(league)
    const ids = new Set((Array.isArray(selectedIds) ? selectedIds : []).map(String))
    const selected = tabs.filter((tab) => ids.has(tab.id))
    if (!selected.length) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '请至少选择一个受支持的仓库页')
    }
    const results = []
    for (const tab of selected) results.push(await this.fetchTab(league, tab))
    return results
  }
}
