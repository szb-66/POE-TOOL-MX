import { serverStorage as localStorage } from '../utils/serverStorage.js'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '../api/electron.js'
import { normalizeStashPickupSettings } from '../utils/stashPickupConfig.js'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { useInterfaceDetectionStore } from './interfaceDetection.js'
import { useFeatureModulesStore } from './featureModules.js'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from '../utils/diagnostics.js'
import { runWithConfigurationGuide } from '../domains/configurationGuide/configurationGuideStore.js'
import {
  collectStashPickupConfigurationIssues,
  CONFIGURATION_ACTIONS,
  CONFIGURATION_MODULES
} from '../domains/configurationGuide/configurationIssues.js'

const STORAGE_KEY = 'stashPickupSettings'

function loadSettings() {
  try { return normalizeStashPickupSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')) } catch {
    return normalizeStashPickupSettings()
  }
}

function unwrap(response) {
  if (response?.success) return response.data
  throw Object.assign(new Error(response?.error?.message || '仓库自动取件操作失败'), {
    code: response?.error?.code || 'STASH_PICKUP_ERROR',
    failureCode: response?.error?.failureCode || '',
    configurationIssueId: response?.error?.configurationIssueId || ''
  })
}

export const useStashPickupStore = defineStore('stashPickup', () => {
  const interfaceStore = useInterfaceDetectionStore()
  const settings = ref(loadSettings())
  const state = ref({
    status: 'idle', layout: 0, method: 'highlight-model', candidateCells: 0,
    remainingCells: 0, pickedItems: 0, currentIndex: 0, uncertainCells: 0,
    modelVersion: '', calibration: '', reason: '', failureCode: '', configurationIssueId: ''
  })
  const preview = ref(null)
  const busy = ref(false)
  let settingsRevision = 0
  let settingsCommitQueue = Promise.resolve()
  const running = computed(() => state.value.status === 'running')

  function runtime(overrides = {}) {
    const settingsStore = useSettingsStore()
    return {
      ...JSON.parse(JSON.stringify(settings.value)),
      calibration: JSON.parse(JSON.stringify(interfaceStore.stashGridCalibration)),
      ...interfaceStore.runtime(),
      operationDelayMs: settingsStore.operationDelayMs,
      fixedTiming: settingsStore.fixedTiming,
      ...overrides
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
  }

  async function syncRuntime(overrides = {}) {
    const requested = runtime(overrides)
    requested.enabled = useFeatureModulesStore().isEnabled('bag') && Boolean(requested.enabled)
    state.value = { ...state.value, ...unwrap(await electronApi.stashPickup.updateRuntime(requested)) }
    return state.value
  }

  function collectConfiguration(actionId) {
    return collectStashPickupConfigurationIssues({
      actionId,
      templates: interfaceStore.templates,
      calibration: interfaceStore.stashGridCalibration
    })
  }

  async function setEnabled(value, { configurationGuideBypass = false } = {}) {
    const enabled = Boolean(value)
    if (enabled && !configurationGuideBypass) {
      const check = collectConfiguration(CONFIGURATION_ACTIONS.enable)
      if (!check.ok) {
        return runWithConfigurationGuide({
          moduleId: CONFIGURATION_MODULES.stashPickup,
          actionId: CONFIGURATION_ACTIONS.enable,
          title: '完成仓库取件配置',
          actionLabel: '启用',
          collect: () => collectConfiguration(CONFIGURATION_ACTIONS.enable),
          execute: () => setEnabled(true, { configurationGuideBypass: true })
        })
      }
    }
    await syncRuntime({ enabled })
    settings.value.enabled = enabled
    save()
  }

  async function updateProfile(layout, patch) {
    const commit = async () => {
      const candidate = normalizeStashPickupSettings({
        ...settings.value,
        profiles: {
          ...settings.value.profiles,
          [layout]: { ...settings.value.profiles[layout], ...patch }
        }
      })
      if (settings.value.enabled) await syncRuntime(candidate)
      settings.value = candidate
      settingsRevision += 1
      save()
      return { success: true, revision: settingsRevision }
    }
    settingsCommitQueue = settingsCommitQueue.then(commit, commit)
    return settingsCommitQueue
  }

  async function calibrate(type) {
    const result = unwrap(await electronApi.stashPickup.pickGridRegion())
    if (!result?.canceled) {
      interfaceStore.setStashGridCalibration(type, result)
      if (settings.value.enabled) await syncRuntime()
    }
    return result
  }

  async function runPreview({ configurationGuideBypass = false } = {}) {
    if (!configurationGuideBypass) {
      const check = collectConfiguration(CONFIGURATION_ACTIONS.capture)
      if (!check.ok) {
        return runWithConfigurationGuide({
          moduleId: CONFIGURATION_MODULES.stashPickup,
          actionId: CONFIGURATION_ACTIONS.capture,
          title: '完成仓库检测配置',
          actionLabel: '运行预览',
          collect: () => collectConfiguration(CONFIGURATION_ACTIONS.capture),
          execute: () => runPreview({ configurationGuideBypass: true })
        })
      }
    }
    busy.value = true
    try {
      if (settings.value.enabled) await syncRuntime()
      preview.value = unwrap(await electronApi.stashPickup.preview())
      void reportDiagnosticRecovery('stashPickup', 'detection')
      return preview.value
    } catch (error) {
      state.value = {
        ...state.value,
        reason: error.message,
        failureCode: error.failureCode || '',
        configurationIssueId: error.configurationIssueId || ''
      }
      void reportDiagnosticFailure('stashPickup', 'detection', error, 'automation_failed')
      throw error
    } finally { busy.value = false }
  }

  async function start({ configurationGuideBypass = false } = {}) {
    if (!configurationGuideBypass) {
      const check = collectConfiguration(CONFIGURATION_ACTIONS.start)
      if (!check.ok) {
        return runWithConfigurationGuide({
          moduleId: CONFIGURATION_MODULES.stashPickup,
          actionId: CONFIGURATION_ACTIONS.start,
          title: '完成仓库取件配置',
          actionLabel: '开始取件',
          collect: () => collectConfiguration(CONFIGURATION_ACTIONS.start),
          execute: () => start({ configurationGuideBypass: true })
        })
      }
    }
    try {
      if (settings.value.enabled) await syncRuntime()
      state.value = { ...state.value, ...unwrap(await electronApi.stashPickup.start()) }
      void reportDiagnosticRecovery('stashPickup', 'pickup')
    } catch (error) {
      state.value = {
        ...state.value,
        status: 'stopped',
        reason: error.message,
        failureCode: error.failureCode || '',
        configurationIssueId: error.configurationIssueId || ''
      }
      void reportDiagnosticFailure('stashPickup', 'pickup', error, 'automation_failed')
      throw error
    }
  }

  async function stop() {
    state.value = { ...state.value, ...unwrap(await electronApi.stashPickup.stop()) }
  }

  function listen() {
    return electronApi.stashPickup.onEvent(event => {
      state.value = { ...state.value, ...event }
      if (event?.event === 'error' || event?.status === 'error') {
        void reportDiagnosticFailure('stashPickup', 'pickup', event, 'automation_failed')
      }
      if (event?.event === 'completed' || event?.status === 'completed') {
        void reportDiagnosticRecovery('stashPickup', 'pickup')
      }
    })
  }

  async function initializeRuntime({ preserveEnabledOnFailure = false, restoreEnabled = true } = {}) {
    if (!restoreEnabled) settings.value.enabled = false
    try {
      await syncRuntime()
      return { success: true }
    } catch (error) {
      if (!preserveEnabledOnFailure) {
        settings.value.enabled = false
        save()
      }
      return { success: false, error: error?.message || String(error) }
    }
  }

  return {
    settings, state, preview, busy, running,
    setEnabled, updateProfile, calibrate, runPreview,
    start, stop, listen, initializeRuntime, syncRuntime
  }
})
