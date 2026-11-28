import { serverStorage as localStorage } from '../utils/serverStorage.js'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '@/api/electron'
import { useInterfaceDetectionStore } from './interfaceDetection'
import { useFeatureModulesStore } from './featureModules.js'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { normalizeJunfengSettings } from '@/utils/junfengConfig'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from '@/utils/diagnostics.js'
import { runWithConfigurationGuide } from '@/domains/configurationGuide/configurationGuideStore.js'
import {
  collectJunfengConfigurationIssues,
  CONFIGURATION_ACTIONS,
  CONFIGURATION_MODULES
} from '@/domains/configurationGuide/configurationIssues.js'

const STORAGE_KEY = 'junfengHighlightSettings'

function load() {
  try { return normalizeJunfengSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')) } catch { return normalizeJunfengSettings() }
}

function unwrap(response) {
  if (response?.success) return response.data
  throw Object.assign(new Error(response?.error?.message || '君锋镇操作失败'), {
    code: response?.error?.code || 'JUNFENG_OPERATION_FAILED',
    failureCode: response?.error?.failureCode || '',
    configurationIssueId: response?.error?.configurationIssueId || '',
    configurationIssues: Array.isArray(response?.error?.configurationIssues) ? response.error.configurationIssues : []
  })
}

export const useJunfengStore = defineStore('junfeng', () => {
  const interfaceStore = useInterfaceDetectionStore()
  const settings = ref(load())
  const state = ref({
    status: 'idle', candidateItems: 0, remainingItems: 0, pickedItems: 0,
    uncertainCells: 0, reason: '', modelVersion: '', failureCode: '', configurationIssueId: ''
  })
  const preview = ref(null)
  const busy = ref(false)
  const running = computed(() => state.value.status === 'running')

  function runtime(overrides = {}) {
    const general = useSettingsStore()
    return {
      ...JSON.parse(JSON.stringify(settings.value)),
      templates: JSON.parse(JSON.stringify(interfaceStore.templates)),
      matchThreshold: interfaceStore.matchThreshold,
      operationDelayMs: general.operationDelayMs,
      fixedTiming: general.fixedTiming,
      ...overrides
    }
  }

  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value)) }

  async function sync(overrides = {}) {
    const requested = runtime(overrides)
    requested.enabled = useFeatureModulesStore().isEnabled('bag') && Boolean(requested.enabled)
    state.value = { ...state.value, ...unwrap(await electronApi.junfeng.updateRuntime(requested)) }
    return state.value
  }

  function collectConfiguration(actionId) {
    return collectJunfengConfigurationIssues({
      actionId,
      templates: interfaceStore.templates,
      gridRegion: settings.value.gridRegion
    })
  }

  async function setEnabled(value, { configurationGuideBypass = false } = {}) {
    const enabled = Boolean(value)
    if (enabled && !configurationGuideBypass) {
      const check = collectConfiguration(CONFIGURATION_ACTIONS.enable)
      if (!check.ok) {
        return runWithConfigurationGuide({
          moduleId: CONFIGURATION_MODULES.junfeng,
          actionId: CONFIGURATION_ACTIONS.enable,
          title: '完成君锋镇配置',
          actionLabel: '启用',
          collect: () => collectConfiguration(CONFIGURATION_ACTIONS.enable),
          execute: () => setEnabled(true, { configurationGuideBypass: true })
        })
      }
    }
    await sync({ enabled })
    settings.value.enabled = enabled
    persist()
  }

  async function calibrateGrid() {
    try {
      const result = unwrap(await electronApi.junfeng.pickGridRegion())
      if (!result?.canceled) {
        settings.value = normalizeJunfengSettings({ ...settings.value, gridRegion: result })
        persist()
        if (settings.value.enabled) await sync()
        void reportDiagnosticRecovery('junfeng', 'region_capture')
      }
      return result
    } catch (error) {
      void reportDiagnosticFailure('junfeng', 'region_capture', error, 'screen_capture_failed')
      throw error
    }
  }

  async function runPreview({ configurationGuideBypass = false } = {}) {
    if (!configurationGuideBypass) {
      const check = collectConfiguration(CONFIGURATION_ACTIONS.capture)
      if (!check.ok) {
        return runWithConfigurationGuide({
          moduleId: CONFIGURATION_MODULES.junfeng,
          actionId: CONFIGURATION_ACTIONS.capture,
          title: '完成君锋镇识别配置',
          actionLabel: '运行预览',
          collect: () => collectConfiguration(CONFIGURATION_ACTIONS.capture),
          execute: () => runPreview({ configurationGuideBypass: true })
        })
      }
    }
    busy.value = true
    try {
      if (settings.value.enabled) await sync()
      preview.value = unwrap(await electronApi.junfeng.preview())
      void reportDiagnosticRecovery('junfeng', 'detection')
      return preview.value
    } catch (error) {
      state.value = {
        ...state.value,
        reason: error.message,
        failureCode: error.failureCode || '',
        configurationIssueId: error.configurationIssueId || ''
      }
      void reportDiagnosticFailure('junfeng', 'detection', error, 'template_match_failed')
      throw error
    } finally { busy.value = false }
  }

  async function start({ configurationGuideBypass = false } = {}) {
    if (!configurationGuideBypass) {
      const check = collectConfiguration(CONFIGURATION_ACTIONS.start)
      if (!check.ok) {
        return runWithConfigurationGuide({
          moduleId: CONFIGURATION_MODULES.junfeng,
          actionId: CONFIGURATION_ACTIONS.start,
          title: '完成君锋镇配置',
          actionLabel: '开始拾取',
          collect: () => collectConfiguration(CONFIGURATION_ACTIONS.start),
          execute: () => start({ configurationGuideBypass: true })
        })
      }
    }
    try {
      state.value = { ...state.value, ...unwrap(await electronApi.junfeng.start()) }
      void reportDiagnosticRecovery('junfeng', 'pickup')
    } catch (error) {
      state.value = {
        ...state.value,
        status: 'stopped',
        reason: error.message,
        failureCode: error.failureCode || '',
        configurationIssueId: error.configurationIssueId || ''
      }
      void reportDiagnosticFailure('junfeng', 'pickup', error, 'automation_failed')
      throw error
    }
  }

  async function stop() { state.value = { ...state.value, ...unwrap(await electronApi.junfeng.stop()) } }

  function listen() {
    return electronApi.junfeng.onEvent(event => { state.value = { ...state.value, ...event } })
  }

  async function initializeRuntime({ preserveEnabledOnFailure = false, restoreEnabled = true } = {}) {
    if (!restoreEnabled) settings.value.enabled = false
    try {
      await sync()
      return { success: true }
    } catch (error) {
      if (!preserveEnabledOnFailure) {
        settings.value.enabled = false
        persist()
        try { await electronApi.junfeng.updateRuntime(runtime({ enabled: false })) } catch {}
      }
      return { success: false, error: error?.message || String(error) }
    }
  }

  return {
    settings, state, preview, busy, running,
    setEnabled, calibrateGrid, runPreview, start, stop, listen, initializeRuntime, sync
  }
})
