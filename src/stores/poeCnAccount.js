import { ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '../api/electron.js'

const STORAGE_KEY = 'poeCnAccountSettings'
const CHAOS_STORAGE_KEY = 'chaosRecipeSettings'
const PRICE_STORAGE_KEY = 'priceCheckSettings'

const emptyStatus = () => ({ authenticated: false, mode: null, accountName: '' })

export function migratePoeCnAccountSettings(storage = localStorage) {
  const read = (key) => {
    try {
      const value = JSON.parse(storage.getItem(key) || '{}')
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
    } catch {
      return {}
    }
  }
  const shared = read(STORAGE_KEY)
  const chaos = read(CHAOS_STORAGE_KEY)
  const price = read(PRICE_STORAGE_KEY)
  const league = String(shared.league || chaos.league || price.league || '')

  if ('league' in chaos) {
    delete chaos.league
    storage.setItem(CHAOS_STORAGE_KEY, JSON.stringify(chaos))
  }
  if ('league' in price) {
    delete price.league
    storage.setItem(PRICE_STORAGE_KEY, JSON.stringify(price))
  }
  const migrated = { league }
  storage.setItem(STORAGE_KEY, JSON.stringify(migrated))
  return migrated
}

function unwrap(response) {
  if (response?.success) return response.data
  const error = new Error(response?.error?.message || '国服账号操作失败')
  error.code = response?.error?.code || 'UNKNOWN'
  error.details = response?.error?.details || {}
  throw error
}

export const usePoeCnAccountStore = defineStore('poeCnAccount', () => {
  const settings = ref(migratePoeCnAccountSettings())
  const status = ref(emptyStatus())
  const leagues = ref([])
  const busy = ref(false)
  const error = ref(null)
  const leagueChangeListeners = new Set()
  const statusChangeListeners = new Set()
  let leagueLoadPromise = null

  function applyStatus(value) {
    status.value = { ...emptyStatus(), ...(value || {}) }
    if (!status.value.authenticated) leagues.value = []
    for (const listener of statusChangeListeners) {
      try { void Promise.resolve(listener(status.value)).catch(() => {}) } catch { /* feature cleanup is best effort */ }
    }
    return status.value
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ league: settings.value.league }))
  }

  async function setLeague(value) {
    const league = String(value || '')
    if (league === settings.value.league) return league
    unwrap(await electronApi.poeCnAccount.setLeague(league))
    settings.value.league = league
    saveSettings()
    for (const listener of leagueChangeListeners) await listener(league)
    return league
  }

  function onLeagueChanged(listener) {
    if (typeof listener !== 'function') return () => {}
    leagueChangeListeners.add(listener)
    return () => leagueChangeListeners.delete(listener)
  }

  function onStatusChanged(listener) {
    if (typeof listener !== 'function') return () => {}
    statusChangeListeners.add(listener)
    return () => statusChangeListeners.delete(listener)
  }

  async function restore() {
    applyStatus(unwrap(await electronApi.poeCnAccount.restore()))
    if (status.value.authenticated) await loadLeagues()
    return status.value
  }

  async function getStatus() {
    applyStatus(unwrap(await electronApi.poeCnAccount.getStatus()))
    return status.value
  }

  async function openWebLogin() {
    return unwrap(await electronApi.poeCnAccount.openWebLogin())
  }

  async function completeWebLogin() {
    applyStatus(unwrap(await electronApi.poeCnAccount.completeWebLogin()))
    await loadLeagues()
    return status.value
  }

  async function setSessionToken(token) {
    applyStatus(unwrap(await electronApi.poeCnAccount.setSessionToken(token)))
    await loadLeagues()
    return status.value
  }

  async function logout() {
    applyStatus(unwrap(await electronApi.poeCnAccount.logout()))
    return status.value
  }

  async function loadLeagues() {
    if (leagueLoadPromise) return leagueLoadPromise
    leagueLoadPromise = (async () => {
      leagues.value = unwrap(await electronApi.poeCnAccount.listLeagues())
      if (settings.value.league && !leagues.value.some((league) => league.id === settings.value.league)) {
        await setLeague('')
      }
      return leagues.value
    })().finally(() => { leagueLoadPromise = null })
    return leagueLoadPromise
  }

  function listenStatus() {
    return electronApi.poeCnAccount.onStatusChanged((nextStatus) => {
      const wasAuthenticated = status.value.authenticated
      applyStatus(nextStatus)
      if (!wasAuthenticated && status.value.authenticated) {
        void loadLeagues().catch((caught) => { error.value = caught })
      }
    })
  }

  async function run(action) {
    busy.value = true
    error.value = null
    try {
      return await action()
    } catch (caught) {
      error.value = caught
      throw caught
    } finally {
      busy.value = false
    }
  }

  return {
    settings, status, leagues, busy, error,
    saveSettings, setLeague, onLeagueChanged, onStatusChanged, restore, getStatus,
    openWebLogin, completeWebLogin, setSessionToken, logout, loadLeagues,
    listenStatus, run
  }
})
