import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { electronApi } from '../api/electron.js'
import { useSettingsStore } from '../domains/settings/settingsStore.js'
import { usePoeCnAccountStore } from './poeCnAccount.js'
import {
  DEFAULT_PRICE_CHECK_SETTINGS,
  normalizePriceCheckSettings
} from '../utils/priceCheckSettings.js'

const STORAGE_KEY = 'priceCheckSettings'

function unwrap(response) {
  if (response?.success) return response.data
  const error = new Error(response?.error?.message || '国服查价失败')
  error.code = response?.error?.code
  error.details = response?.error?.details
  throw error
}

function loadSettings() {
  try {
    return normalizePriceCheckSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'))
  } catch {
    return { ...DEFAULT_PRICE_CHECK_SETTINGS }
  }
}

export const usePriceCheckStore = defineStore('priceCheck', () => {
  const account = usePoeCnAccountStore()
  const appSettings = useSettingsStore()
  const status = ref(null)
  const settings = ref(loadSettings())
  const model = ref(null)
  const result = ref(null)
  const overlayState = ref(null)
  const loading = ref(false)
  const error = ref('')
  let removeOverlayListener = null
  let removeSettingsListener = null
  let settingsRevision = 0
  let settingsCommitQueue = Promise.resolve()

  const authenticated = computed(() => account.status.authenticated)
  const catalog = computed(() => status.value?.catalog || null)
  const league = computed(() => account.settings.league)
  const options = computed(() => ({
    status: settings.value.status,
    listed: settings.value.listed,
    currency: settings.value.currency,
    collapseListings: settings.value.collapseListings,
    valueRange: settings.value.valueRange,
    initialSelection: settings.value.initialSelection,
    manualDcRate: settings.value.manualDcRate
  }))

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
  }

  function clearResults() {
    model.value = null
    result.value = null
    overlayState.value = null
  }

  async function refreshStatus() {
    status.value = unwrap(await electronApi.priceCheck.getStatus())
    return status.value
  }

  async function syncRuntime(overrides = {}) {
    status.value = unwrap(await electronApi.priceCheck.updateRuntime({
      enabled: settings.value.enabled,
      league: league.value,
      options: options.value,
      ...overrides
    }))
    return status.value
  }

  async function setEnabled(value) {
    const enabled = Boolean(value)
    if (enabled === settings.value.enabled) return enabled
    const shortcut = appSettings.globalShortcuts.priceCheck
    if (enabled) {
      if (!shortcut) throw new Error('请先设置国服查价快捷键')
      await syncRuntime({ enabled: true })
      const registration = await electronApi.shortcut.register(shortcut, 'priceCheck')
      if (!registration?.success) {
        await electronApi.priceCheck.updateRuntime({ enabled: false })
        settings.value.enabled = false
        saveSettings()
        throw new Error(`快捷键 ${shortcut} 注册失败，查价器已保持关闭`)
      }
      settings.value.enabled = true
    } else {
      await electronApi.shortcut.unregister(shortcut)
      settings.value.enabled = false
      await syncRuntime({ enabled: false })
      clearResults()
    }
    saveSettings()
    return settings.value.enabled
  }

  async function updateSetting(key, value) {
    const commit = async () => {
      try {
        const candidate = normalizePriceCheckSettings({ ...settings.value, [key]: value })
        const snapshot = unwrap(await electronApi.priceCheck.updateSettings({ [key]: candidate[key] }))
        settingsRevision = Math.max(settingsRevision, Number(snapshot.settingsRevision) || settingsRevision + 1)
        settings.value = candidate
        saveSettings()
        error.value = ''
        return { success: true, revision: settingsRevision }
      } catch (reason) {
        error.value = reason.message
        return { success: false, error: reason.message, revision: settingsRevision }
      }
    }
    settingsCommitQueue = settingsCommitQueue.then(commit, commit)
    return settingsCommitQueue
  }

  async function checkHoveredItem() {
    if (!settings.value.enabled) throw new Error('国服查价器尚未启用')
    if (!league.value) throw new Error('请先在设置页选择国服赛季')
    loading.value = true
    error.value = ''
    try {
      const data = unwrap(await electronApi.priceCheck.capture({
        league: league.value,
        options: options.value
      }))
      model.value = data.model
      result.value = data.result
      return data
    } catch (reason) {
      error.value = reason.message
      throw reason
    } finally {
      loading.value = false
    }
  }

  async function rerun(nextModel = model.value, currentOptions = options.value) {
    const data = unwrap(await electronApi.priceCheck.rerun({
      league: league.value,
      model: nextModel,
      options: currentOptions
    }))
    model.value = data.model
    result.value = data.result
    return data
  }

  async function loadMore() {
    const data = unwrap(await electronApi.priceCheck.loadMore())
    result.value = data.result
    return data
  }

  async function loadDistribution() {
    const data = unwrap(await electronApi.priceCheck.loadDistribution())
    result.value = data.result
    return data
  }

  function listenOverlay() {
    if (removeOverlayListener) return removeOverlayListener
    removeOverlayListener = electronApi.priceCheck.onOverlayState((snapshot) => {
      overlayState.value = snapshot
      if (snapshot?.model) model.value = snapshot.model
      if (snapshot?.result) result.value = snapshot.result
    })
    removeSettingsListener = electronApi.priceCheck.onSettingsChanged((snapshot) => {
      const revision = Number(snapshot?.settingsRevision) || 0
      if (revision < settingsRevision || !snapshot?.options) return
      settingsRevision = revision
      settings.value = normalizePriceCheckSettings({ ...settings.value, ...snapshot.options })
      saveSettings()
    })
    void electronApi.priceCheck.getOverlayState().then((response) => {
      if (response?.success) overlayState.value = response.data
    })
    return () => {
      removeOverlayListener?.()
      removeOverlayListener = null
      removeSettingsListener?.()
      removeSettingsListener = null
    }
  }

  account.onLeagueChanged(async () => {
    clearResults()
    await electronApi.priceCheck.closeOverlay()
    if (settings.value.enabled) await syncRuntime()
  })
  account.onStatusChanged(async (nextStatus) => {
    if (nextStatus.authenticated) return
    clearResults()
    await electronApi.priceCheck.closeOverlay()
  })

  return {
    status, settings, model, result, overlayState, loading, error,
    authenticated, catalog, league, options,
    saveSettings, clearResults, refreshStatus, syncRuntime, setEnabled,
    updateSetting, checkHoveredItem, rerun, loadMore, loadDistribution, listenOverlay
  }
})
