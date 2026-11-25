import fs from 'node:fs/promises'
import path from 'node:path'
import { getServer } from '../../../shared/serverMode.js'

const CACHE_TTL_MS = 5 * 60 * 1000
const FORCE_COOLDOWN_MS = 15 * 1000
const LEAGUES_TTL_MS = 30 * 60 * 1000
const REQUEST_TIMEOUT_MS = 10 * 1000
const USER_AGENT = 'PoeHelper/1.0 (Faustus International DC Rate)'

const LEAGUES_URLS = Object.freeze([
  'https://poe.ninja/poe1/api/economy/leagues',
  'https://poe.ninja/api/data/getindexstate'
])

const OVERVIEW_URL_BUILDERS = Object.freeze([
  league => `https://poe.ninja/poe1/api/economy/exchange/current/overview?league=${encodeURIComponent(league)}&type=Currency`,
  league => `https://poe.ninja/api/data/currencyoverview?league=${encodeURIComponent(league)}&type=Currency`
])

const PERMANENT_LEAGUE_PATTERN = /^(?:Standard|Hardcore|Solo Self-Found|SSF Standard|SSF Hardcore|Ruthless|Hardcore Ruthless|SSF Ruthless|SSF Hardcore Ruthless)$/i
const SAFE_LEAGUE_PATTERN = /^[A-Za-z0-9 ()'\-:+]{1,80}$/

function positiveFinite(value) {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase()
}

export function sanitizeLeagueName(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (!SAFE_LEAGUE_PATTERN.test(text)) {
    throw Object.assign(new Error('国际服赛季名称格式无效'), { code: 'INVALID_LEAGUE' })
  }
  return text
}

export function parsePoeNinjaLeagues(payload) {
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.economyLeagues)
      ? payload.economyLeagues
      : []
  const seen = new Set()
  const leagues = []
  for (const entry of rawList) {
    const id = String(entry?.name || entry?.id || entry?.url || '').trim()
    if (!id || !SAFE_LEAGUE_PATTERN.test(id)) continue
    const key = id.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const displayName = String(entry?.displayName || entry?.name || id).trim()
    leagues.push({ id, name: displayName })
  }
  return leagues
}

export function pickDefaultInternationalLeague(leagues = []) {
  if (!Array.isArray(leagues) || !leagues.length) return 'Standard'
  const challenge = leagues.find(item => {
    const id = String(item?.id || '')
    return id && !PERMANENT_LEAGUE_PATTERN.test(id) && !/\b(?:SSF|Hardcore|Ruthless)\b/i.test(id)
  })
  return challenge?.id || leagues[0]?.id || 'Standard'
}

export function extractDivineChaosValue(payload) {
  if (!payload || typeof payload !== 'object') return null
  const lines = Array.isArray(payload.lines) ? payload.lines : []
  const items = Array.isArray(payload.items) ? payload.items : []
  const currencyDetails = Array.isArray(payload.currencyDetails) ? payload.currencyDetails : []

  const idToName = new Map()
  for (const item of [...items, ...currencyDetails]) {
    if (!item || typeof item !== 'object') continue
    const name = String(item.name || item.text || '').trim()
    if (!name) continue
    if (item.id !== undefined && item.id !== null) idToName.set(String(item.id).toLowerCase(), name)
    if (item.detailsId) idToName.set(String(item.detailsId).toLowerCase(), name)
  }

  const lineMatches = (line, targetName, targetIds) => {
    if (!line || typeof line !== 'object') return false
    const candidates = [
      line.currencyTypeName,
      line.name,
      idToName.get(String(line.id ?? '').toLowerCase()),
      idToName.get(String(line.detailsId ?? '').toLowerCase())
    ].map(normalizeName)
    if (candidates.includes(targetName)) return true
    const ids = [line.id, line.detailsId].map(normalizeName)
    return ids.some(id => targetIds.includes(id))
  }

  const divineLine = lines.find(line => lineMatches(line, 'divine orb', ['divine', 'divine-orb']))
  const chaosLine = lines.find(line => lineMatches(line, 'chaos orb', ['chaos', 'chaos-orb']))

  // 1. 经典及通用字段 chaosEquivalent
  const directChaos = positiveFinite(divineLine?.chaosEquivalent)
  if (directChaos) return directChaos

  // 2. 新版 poe1 exchange overview：结合 core.primary 与 primaryValue / core.rates
  const primary = normalizeName(payload.core?.primary)
  const coreRatesChaos = positiveFinite(payload.core?.rates?.chaos)
  if (primary === 'divine' && coreRatesChaos) return coreRatesChaos

  const divinePrimary = positiveFinite(divineLine?.primaryValue)
  const chaosPrimary = positiveFinite(chaosLine?.primaryValue)
  if (primary === 'chaos' && divinePrimary) return divinePrimary
  if (primary === 'divine' && chaosPrimary) return 1 / chaosPrimary

  // 3. 兼容 receive.value / 无 core 字段但 primaryValue 明显为混沌等价（如 > 5）
  const receiveValue = positiveFinite(divineLine?.receive?.value)
  if (receiveValue) return receiveValue
  if (!primary && divinePrimary && divinePrimary >= 2) return divinePrimary

  return null
}

async function fetchJson(fetchImpl, url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  timer.unref?.()
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT
      },
      signal: controller.signal
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

export class InternationalDcRateService {
  constructor({ server = getServer('international'), cacheFile = '', fetchImpl = fetch, now = () => Date.now() } = {}) {
    this.server = getServer(server.id)
    this.cacheFile = String(cacheFile || '')
    this.fetchImpl = fetchImpl
    this.now = now
    this.initialized = false
    this.leaguesCache = { items: [], fetchedAt: 0 }
    this.ratesCache = new Map()
    this.inFlight = new Map()
    this.leaguesInFlight = null
  }

  assertInternational() {
    if (this.server.id !== 'international') {
      throw Object.assign(new Error('自动获取 poe.ninja 比例仅支持国际服'), { code: 'SERVER_FEATURE_UNAVAILABLE' })
    }
  }

  async ensureLoaded() {
    if (this.initialized) return
    this.initialized = true
    if (!this.cacheFile) return
    try {
      const raw = JSON.parse(await fs.readFile(this.cacheFile, 'utf8'))
      if (Array.isArray(raw?.leagues?.items)) {
        this.leaguesCache = {
          items: parsePoeNinjaLeagues(raw.leagues.items),
          fetchedAt: Number(raw.leagues.fetchedAt) || 0
        }
      }
      if (raw?.rates && typeof raw.rates === 'object') {
        for (const [league, entry] of Object.entries(raw.rates)) {
          const rawValue = positiveFinite(entry?.rawChaosPerDivine)
          const fetchedAt = Number(entry?.fetchedAt) || 0
          if (SAFE_LEAGUE_PATTERN.test(league) && rawValue && fetchedAt > 0) {
            this.ratesCache.set(league, {
              league,
              rawChaosPerDivine: rawValue,
              chaosPerDivine: Math.max(1, Math.round(rawValue)),
              fetchedAt,
              updatedAt: String(entry.updatedAt || new Date(fetchedAt).toISOString())
            })
          }
        }
      }
    } catch {
      // 本地缓存缺失或损坏时忽略并重新拉取。
    }
  }

  async persistCache() {
    if (!this.cacheFile) return
    try {
      await fs.mkdir(path.dirname(this.cacheFile), { recursive: true })
      const payload = {
        leagues: this.leaguesCache,
        rates: Object.fromEntries(this.ratesCache.entries())
      }
      await fs.writeFile(this.cacheFile, JSON.stringify(payload, null, 2), 'utf8')
    } catch {
      // 缓存落盘失败不影响正常返回。
    }
  }

  async listLeagues({ force = false } = {}) {
    this.assertInternational()
    await this.ensureLoaded()
    const fresh = !force && this.leaguesCache.items.length > 0 && (this.now() - this.leaguesCache.fetchedAt < LEAGUES_TTL_MS)
    if (fresh) return [...this.leaguesCache.items]
    if (this.leaguesInFlight) return this.leaguesInFlight

    this.leaguesInFlight = (async () => {
      let lastError = null
      for (const url of LEAGUES_URLS) {
        try {
          const payload = await fetchJson(this.fetchImpl, url)
          const parsed = parsePoeNinjaLeagues(payload)
          if (parsed.length > 0) {
            this.leaguesCache = { items: parsed, fetchedAt: this.now() }
            await this.persistCache()
            return [...parsed]
          }
        } catch (error) {
          lastError = error
        }
      }
      if (this.leaguesCache.items.length > 0) return [...this.leaguesCache.items]
      throw Object.assign(new Error(`无法获取 poe.ninja 国际服赛季列表：${lastError?.message || '请求失败'}`), { code: 'POE_NINJA_UNAVAILABLE' })
    })().finally(() => {
      this.leaguesInFlight = null
    })

    return this.leaguesInFlight
  }

  async fetchRate({ league = '', force = false } = {}) {
    this.assertInternational()
    await this.ensureLoaded()

    const requestedLeague = sanitizeLeagueName(league)
    let leagues = []
    try {
      leagues = await this.listLeagues({ force: false })
    } catch (error) {
      if (!requestedLeague) throw error
      leagues = this.leaguesCache.items.length ? [...this.leaguesCache.items] : [{ id: requestedLeague, name: requestedLeague }]
    }

    const resolvedLeague = requestedLeague || pickDefaultInternationalLeague(leagues)
    const cached = this.ratesCache.get(resolvedLeague)
    const age = cached ? this.now() - cached.fetchedAt : Infinity
    const canReuse = cached && ((!force && age < CACHE_TTL_MS) || (force && age < FORCE_COOLDOWN_MS))
    if (canReuse) {
      return {
        serverId: 'international',
        source: 'poe.ninja',
        league: resolvedLeague,
        leagues,
        chaosPerDivine: cached.chaosPerDivine,
        rawChaosPerDivine: cached.rawChaosPerDivine,
        updatedAt: cached.updatedAt,
        fromCache: true
      }
    }

    const flightKey = `${resolvedLeague}:${force ? 'force' : 'normal'}`
    if (this.inFlight.has(flightKey)) return this.inFlight.get(flightKey)

    const task = (async () => {
      let lastError = null
      for (const buildUrl of OVERVIEW_URL_BUILDERS) {
        try {
          const payload = await fetchJson(this.fetchImpl, buildUrl(resolvedLeague))
          const rawValue = extractDivineChaosValue(payload)
          if (rawValue) {
            const fetchedAt = this.now()
            const entry = {
              league: resolvedLeague,
              rawChaosPerDivine: Number(rawValue.toFixed(4)),
              chaosPerDivine: Math.max(1, Math.round(rawValue)),
              fetchedAt,
              updatedAt: new Date(fetchedAt).toISOString()
            }
            this.ratesCache.set(resolvedLeague, entry)
            await this.persistCache()
            return {
              serverId: 'international',
              source: 'poe.ninja',
              league: resolvedLeague,
              leagues,
              chaosPerDivine: entry.chaosPerDivine,
              rawChaosPerDivine: entry.rawChaosPerDivine,
              updatedAt: entry.updatedAt,
              fromCache: false
            }
          }
          lastError = new Error('未在行情响应中找到 Divine Orb 比例')
        } catch (error) {
          lastError = error
        }
      }
      throw Object.assign(
        new Error(`无法从 poe.ninja 获取 ${resolvedLeague} 赛季神圣石比例：${lastError?.message || '请求失败'}`),
        { code: 'POE_NINJA_UNAVAILABLE' }
      )
    })().finally(() => {
      this.inFlight.delete(flightKey)
    })

    this.inFlight.set(flightKey, task)
    return task
  }
}
