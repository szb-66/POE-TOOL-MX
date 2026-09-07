import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { electronApi } from '../api/electron.js'
import { useSettingsStore } from '../domains/settings/settingsStore.js'
import { usePoeCnAccountStore } from './poeCnAccount.js'
import { useFeatureModulesStore } from './featureModules.js'
import {
  DEFAULT_PRICE_CHECK_SETTINGS,
  normalizePriceCheckSettings
} from '../utils/priceCheckSettings.js'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from '../utils/diagnostics.js'
import { runWithConfigurationGuide } from '../domains/configurationGuide/configurationGuideStore.js'
import {
  collectPriceCheckConfigurationIssues,
  CONFIGURATION_ACTIONS,
  CONFIGURATION_MODULES
} from '../domains/configurationGuide/configurationIssues.js'

const STORAGE_KEY = 'priceCheckSettings'

function unwrap(response) {
  if (response?.success) return response.data
  const error = new Error(response?.error?.message || '国服查价失败')
  error.code = response?.error?.code
  error.details = response?.error?.details
  error.failureCode = response?.error?.failureCode || error.code || ''
  error.configurationIssueId = response?.error?.configurationIssueId || ''
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
  const failure = ref(null)
  let removeOverlayListener = null
  let removeSettingsListener = null
  let removeCatalogListener = null
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

  async function retryCatalog() {
    loading.value = true
    try {
      const catalogStatus = unwrap(await electronApi.priceCheck.retryCatalog())
      status.value = { ...(status.value || {}), catalog: catalogStatus }
      return catalogStatus
    } finally {
      loading.value = false
    }
  }

  async function syncRuntime(overrides = {}) {
    const moduleEnabled = useFeatureModulesStore().isEnabled('price-check')
    const requested = {
      enabled: settings.value.enabled,
      league: league.value,
      options: options.value,
      shortcut: appSettings.globalShortcuts.priceCheck,
      ...overrides
    }
    status.value = unwrap(await electronApi.priceCheck.updateRuntime({
      ...requested,
      enabled: moduleEnabled && Boolean(requested.enabled),
      shortcut: moduleEnabled ? requested.shortcut : ''
    }))
    if (status.value.enabled && error.value === '国服查价器尚未启用') {
      error.value = ''
      failure.value = null
    }
    return status.value
  }

  function collectConfiguration(actionId) {
    return collectPriceCheckConfigurationIssues({
      actionId,
      authenticated: authenticated.value,
      league: league.value
    })
  }

  async function setEnabled(value, { configurationGuideBypass = false } = {}) {
    const enabled = Boolean(value)
    if (enabled && !useFeatureModulesStore().isEnabled('price-check')) {
      throw new Error('查价功能尚未添加，请先从侧边栏“更多”中添加')
    }
    if (enabled === settings.value.enabled) return enabled
    if (enabled && !configurationGuideBypass) {
      const check = collectConfiguration(CONFIGURATION_ACTIONS.enable)
      if (!check.ok) {
        return runWithConfigurationGuide({
          moduleId: CONFIGURATION_MODULES.priceCheck,
          actionId: CONFIGURATION_ACTIONS.enable,
          title: '完成国服查价配置',
          actionLabel: '启用',
          collect: () => collectConfiguration(CONFIGURATION_ACTIONS.enable),
          execute: () => setEnabled(true, { configurationGuideBypass: true })
        })
      }
    }
    const shortcut = appSettings.globalShortcuts.priceCheck
    if (enabled) {
      await syncRuntime({ enabled: true })
      if (shortcut) {
        const registration = await electronApi.shortcut.register(shortcut, 'priceCheck')
        if (!registration?.success) {
          await electronApi.priceCheck.updateRuntime({ enabled: false })
          settings.value.enabled = false
          saveSettings()
          throw new Error(`快捷键 ${shortcut} 注册失败，查价器已保持关闭`)
        }
      }
      settings.value.enabled = true
    } else {
      if (shortcut) await electronApi.shortcut.unregister(shortcut)
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
        if (key === 'queryImmediately') {
          settings.value = candidate
          saveSettings()
          error.value = ''
          failure.value = null
          return { success: true, revision: settingsRevision }
        }
        const snapshot = unwrap(await electronApi.priceCheck.updateSettings({ [key]: candidate[key] }))
        settingsRevision = Math.max(settingsRevision, Number(snapshot.settingsRevision) || settingsRevision + 1)
        settings.value = candidate
        saveSettings()
        error.value = ''
        failure.value = null
        return { success: true, revision: settingsRevision }
      } catch (reason) {
        error.value = reason.message
        failure.value = {
          failureCode: reason.failureCode || reason.code || '',
          configurationIssueId: reason.configurationIssueId || '',
          message: reason.message
        }
        return { success: false, error: reason.message, revision: settingsRevision }
      }
    }
    settingsCommitQueue = settingsCommitQueue.then(commit, commit)
    return settingsCommitQueue
  }

  async function checkHoveredItem({ configurationGuideBypass = false } = {}) {
    if (!useFeatureModulesStore().isEnabled('price-check')) {
      throw new Error('查价功能尚未添加，请先从侧边栏“更多”中添加')
    }
    if (!settings.value.enabled) throw new Error('国服查价器尚未启用')
    if (!configurationGuideBypass) {
      const check = collectConfiguration(CONFIGURATION_ACTIONS.capture)
      if (!check.ok) {
        return runWithConfigurationGuide({
          moduleId: CONFIGURATION_MODULES.priceCheck,
          actionId: CONFIGURATION_ACTIONS.capture,
          title: '完成国服查价配置',
          actionLabel: '开始查价',
          collect: () => collectConfiguration(CONFIGURATION_ACTIONS.capture),
          execute: () => checkHoveredItem({ configurationGuideBypass: true })
        })
      }
    }
    loading.value = true
    error.value = ''
    failure.value = null
    try {
      // 重启恢复尚未完成或恢复失败时，先同步后台开关再捕获物品。
      if (status.value?.enabled !== true) await syncRuntime()
      const data = unwrap(await electronApi.priceCheck.capture({
        league: league.value,
        queryImmediately: settings.value.queryImmediately,
        options: options.value
      }))
      model.value = data.model
      result.value = data.result
      if (data.result) void reportDiagnosticRecovery('priceCheck', 'query')
      failure.value = null
      return data
    } catch (reason) {
      error.value = reason.message
      failure.value = {
        failureCode: reason.failureCode || reason.code || '',
        configurationIssueId: reason.configurationIssueId || '',
        message: reason.message
      }
      void reportDiagnosticFailure('priceCheck', 'query', reason, 'request_failed')
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
    removeCatalogListener = electronApi.priceCheck.onCatalogUpdated(() => {
      void refreshStatus().catch(() => {})
    })
    void electronApi.priceCheck.getOverlayState().then((response) => {
      if (response?.success) overlayState.value = response.data
    })
    return () => {
      removeOverlayListener?.()
      removeOverlayListener = null
      removeSettingsListener?.()
      removeSettingsListener = null
      removeCatalogListener?.()
      removeCatalogListener = null
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
    status, settings, model, result, overlayState, loading, error, failure,
    authenticated, catalog, league, options,
    saveSettings, clearResults, refreshStatus, syncRuntime, setEnabled,
    updateSetting, retryCatalog, checkHoveredItem, rerun, loadMore, loadDistribution, listenOverlay
  }
})
