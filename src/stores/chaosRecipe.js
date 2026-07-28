import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '../api/electron.js'
import { normalizeOperationDelay } from '../utils/operationDelay.js'
import { useInterfaceDetectionStore } from './interfaceDetection.js'
import {
  CHAOS_GRID_LAYOUT_LABELS,
  missingCalibrationKeys,
  requiredCalibrationKeys
} from '../../electron/modules/chaosRecipe/layout.js'

const STORAGE_KEY = 'chaosRecipeSettings'

const defaultSettings = () => ({
  enabled: false,
  league: '',
  selectedTabIds: [],
  includeIdentified: false,
  targetSetCount: 1,
  operationDelayMs: 80,
  controlOverlayOffset: { x: 50, y: 1550 },
  calibration: { root: null, folder: null },
  tabFolderStates: {}
})

function normalizeRegion(value) {
  const region = value?.region || value
  const numbers = ['left', 'top', 'right', 'bottom'].map((key) => Number(region?.[key]))
  if (!numbers.every(Number.isFinite) || numbers[2] <= numbers[0] || numbers[3] <= numbers[1]) return null
  return {
    left: numbers[0],
    top: numbers[1],
    right: numbers[2],
    bottom: numbers[3],
    displayId: String(value?.displayId || ''),
    scaleFactor: Number(value?.scaleFactor || 1),
    capturedAt: String(value?.capturedAt || '')
  }
}

function normalizeTabFolderStates(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const result = {}
  for (const [league, tabs] of Object.entries(value)) {
    if (!tabs || typeof tabs !== 'object' || Array.isArray(tabs)) continue
    result[String(league)] = {}
    for (const [tabId, override] of Object.entries(tabs)) {
      if (typeof override !== 'boolean' &&
          (!override || typeof override !== 'object' || Array.isArray(override))) continue
      result[String(league)][String(tabId)] = Boolean(
        typeof override === 'object' ? override.inFolder : override
      )
    }
  }
  return result
}

export function normalizeChaosRecipeSettings(raw = {}) {
  return {
    enabled: Boolean(raw.enabled),
    league: String(raw.league || ''),
    selectedTabIds: Array.isArray(raw.selectedTabIds) ? raw.selectedTabIds.map(String) : [],
    includeIdentified: Boolean(raw.includeIdentified),
    targetSetCount: Math.max(1, Math.min(20, Math.trunc(Number(raw.targetSetCount) || 1))),
    operationDelayMs: normalizeOperationDelay(raw.operationDelayMs),
    tabFolderStates: normalizeTabFolderStates(raw.tabFolderStates || raw.tabOverrides),
    controlOverlayOffset: {
      x: Number.isFinite(Number(raw.controlOverlayOffset?.x)) ? Math.round(Number(raw.controlOverlayOffset.x)) : 50,
      y: Number.isFinite(Number(raw.controlOverlayOffset?.y)) ? Math.round(Number(raw.controlOverlayOffset.y)) : 1550
    },
    calibration: {
      root: normalizeRegion(raw.calibration?.root) ||
        normalizeRegion(raw.calibration?.normal) ||
        normalizeRegion(raw.calibration?.quad),
      folder: normalizeRegion(raw.calibration?.folder) ||
        normalizeRegion(raw.calibration?.folderNormal) ||
        normalizeRegion(raw.calibration?.folderQuad)
    }
  }
}

function loadSettings() {
  try {
    return normalizeChaosRecipeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'))
  } catch {
    return defaultSettings()
  }
}

function unwrap(response) {
  if (response?.success) return response.data
  const error = new Error(response?.error?.message || '国服混沌配方操作失败')
  error.code = response?.error?.code || 'UNKNOWN'
  error.details = response?.error?.details || {}
  throw error
}

export const useChaosRecipeStore = defineStore('chaosRecipe', () => {
  const interfaceDetectionStore = useInterfaceDetectionStore()
  const initial = loadSettings()
  const auth = ref({ authenticated: false, mode: null, accountName: '' })
  const leagues = ref([])
  const tabs = ref([])
  const snapshot = ref(null)
  const automation = ref({ status: 'idle', completedItems: 0, totalItems: 0, tabName: '' })
  const settings = ref(initial)
  const busy = ref(false)
  const error = ref(null)

  const effectiveTabs = computed(() => {
    const folderStates = settings.value.tabFolderStates[settings.value.league] || {}
    return tabs.value.map((tab) => {
      return {
        ...tab,
        inFolder: Boolean(folderStates[tab.id])
      }
    })
  })
  const supportedTabs = computed(() => effectiveTabs.value.filter((tab) => tab.supported))
  const selectedTabs = computed(() => supportedTabs.value.filter((tab) => settings.value.selectedTabIds.includes(tab.id)))
  const requiredCalibrations = computed(() => requiredCalibrationKeys(selectedTabs.value))
  const missingCalibrations = computed(() => missingCalibrationKeys(selectedTabs.value, settings.value.calibration))
  const missingCalibrationLabels = computed(() =>
    missingCalibrations.value.map((key) => CHAOS_GRID_LAYOUT_LABELS[key])
  )

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
  }

  function runtimePayload(overrides = {}) {
    return {
      ...JSON.parse(JSON.stringify(settings.value)),
      ...interfaceDetectionStore.runtime(),
      ...overrides
    }
  }

  async function syncRuntime(overrides = {}) {
    return unwrap(await electronApi.chaosRecipe.updateRuntime(runtimePayload(overrides)))
  }

  async function setEnabled(enabled) {
    const next = Boolean(enabled)
    if (next && (!interfaceDetectionStore.templates.stashTitle || !interfaceDetectionStore.templates.inventoryTitle)) {
      throw new Error('请先在设置页配置仓库和背包标题模板')
    }
    try {
      await syncRuntime({ enabled: next })
      settings.value.enabled = next
      save()
      return next
    } catch (error) {
      settings.value.enabled = false
      save()
      throw error
    }
  }

  async function initializeRuntime() {
    try {
      auth.value = unwrap(await electronApi.chaosRecipe.getAuthStatus())
      await syncRuntime()
    } catch (error) {
      if (settings.value.enabled) {
        settings.value.enabled = false
        save()
      }
      setError(error)
    }
  }

  function setError(value) {
    error.value = value ? { code: value.code || 'UNKNOWN', message: value.message || String(value) } : null
  }

  async function run(action) {
    busy.value = true
    setError(null)
    try { return await action() } catch (reason) { setError(reason); throw reason } finally { busy.value = false }
  }

  async function restoreAuth() {
    auth.value = unwrap(await electronApi.chaosRecipe.restoreAuth())
    if (auth.value.authenticated) {
      await loadLeagues()
      if (settings.value.league) await loadTabs(settings.value.league)
    }
    return auth.value
  }

  async function openWebLogin() {
    return run(async () => unwrap(await electronApi.chaosRecipe.openWebLogin()))
  }

  async function completeWebLogin() {
    return run(async () => {
      auth.value = unwrap(await electronApi.chaosRecipe.completeWebLogin())
      await loadLeagues()
      return auth.value
    })
  }

  async function loginWithToken(token) {
    return run(async () => {
      auth.value = unwrap(await electronApi.chaosRecipe.setSessionToken(token))
      await loadLeagues()
      return auth.value
    })
  }

  async function logout() {
    return run(async () => {
      auth.value = unwrap(await electronApi.chaosRecipe.logout())
      leagues.value = []
      tabs.value = []
      snapshot.value = null
    })
  }

  async function loadLeagues() {
    leagues.value = unwrap(await electronApi.chaosRecipe.listLeagues())
    if (settings.value.league && !leagues.value.some((league) => league.id === settings.value.league)) {
      settings.value.league = ''
      settings.value.selectedTabIds = []
      save()
      if (settings.value.enabled) await syncRuntime()
    }
    return leagues.value
  }

  async function loadTabs(league = settings.value.league) {
    const nextLeague = String(league || '')
    if (settings.value.league !== nextLeague) settings.value.selectedTabIds = []
    settings.value.league = nextLeague
    save()
    if (!settings.value.league) {
      tabs.value = []
      return []
    }
    tabs.value = unwrap(await electronApi.chaosRecipe.listTabs(settings.value.league))
    const available = new Set(tabs.value.filter((tab) => tab.supported).map((tab) => String(tab.id)))
    settings.value.selectedTabIds = settings.value.selectedTabIds.filter((id) => available.has(String(id)))
    save()
    if (settings.value.enabled) await syncRuntime()
    return tabs.value
  }

  async function refresh() {
    return run(async () => {
      snapshot.value = unwrap(await electronApi.chaosRecipe.refresh({
        league: settings.value.league,
        selectedTabIds: settings.value.selectedTabIds,
        includeIdentified: settings.value.includeIdentified,
        tabFolderStates: settings.value.tabFolderStates[settings.value.league] || {}
      }))
      if (Array.isArray(snapshot.value.availableTabs)) {
        tabs.value = snapshot.value.availableTabs
        const available = new Set(tabs.value.filter((tab) => tab.supported).map((tab) => String(tab.id)))
        settings.value.selectedTabIds = settings.value.selectedTabIds.filter((id) => available.has(String(id)))
      }
      settings.value.targetSetCount = Math.min(
        Math.max(1, settings.value.targetSetCount),
        Math.max(1, snapshot.value.fullSetCount)
      )
      save()
      if (settings.value.enabled) await syncRuntime()
      return snapshot.value
    })
  }

  async function calibrate(type) {
    const result = unwrap(await electronApi.chaosRecipe.pickGridRegion())
    if (!result?.canceled) {
      settings.value.calibration[type] = normalizeRegion(result)
      save()
      if (settings.value.enabled) await syncRuntime()
    }
    return result
  }

  async function previewOverlay() {
    return run(async () => unwrap(await electronApi.chaosRecipe.openOverlay(
      settings.value.targetSetCount,
      settings.value.calibration
    )))
  }

  async function startAutomation(runtime) {
    return run(async () => {
      const result = unwrap(await electronApi.chaosRecipe.startAutomation({
        setCount: settings.value.targetSetCount,
        calibration: settings.value.calibration,
        ...runtime
      }))
      automation.value = { ...automation.value, ...result }
      return result
    })
  }

  async function pauseAutomation() {
    automation.value = { ...automation.value, ...unwrap(await electronApi.chaosRecipe.pauseAutomation()) }
  }

  async function resumeAutomation() {
    automation.value = { ...automation.value, ...unwrap(await electronApi.chaosRecipe.resumeAutomation()) }
  }

  async function stopAutomation() {
    automation.value = { ...automation.value, ...unwrap(await electronApi.chaosRecipe.stopAutomation()) }
  }

  function updateSetting(key, value) {
    settings.value[key] = key === 'operationDelayMs' ? normalizeOperationDelay(value) : value
    save()
    if (settings.value.enabled) void syncRuntime().catch(setError)
  }

  function updateTabFolderState(tabId, inFolder) {
    const league = settings.value.league
    if (!league || !tabId) return
    const leagueStates = settings.value.tabFolderStates[league] || {}
    settings.value.tabFolderStates = {
      ...settings.value.tabFolderStates,
      [league]: {
        ...leagueStates,
        [tabId]: Boolean(inFolder)
      }
    }
    save()
    if (settings.value.selectedTabIds.includes(String(tabId))) {
      void refresh().catch(setError)
    } else if (settings.value.enabled) {
      void syncRuntime().catch(setError)
    }
  }

  function listenAutomation() {
    const disposeAutomation = electronApi.chaosRecipe.onAutomationEvent((event) => {
      automation.value = { ...automation.value, ...event }
      if (event.event === 'completed' && settings.value.league && settings.value.selectedTabIds.length) {
        setTimeout(() => { void refresh().catch(() => {}) }, 1500)
      }
    })
    const disposeOffset = electronApi.chaosRecipe.onControlOffset((offset) => {
      settings.value.controlOverlayOffset = {
        x: Math.round(Number(offset?.x) || 0),
        y: Math.round(Number(offset?.y) || 0)
      }
      save()
    })
    const disposeSnapshot = electronApi.chaosRecipe.onSnapshotUpdated((value) => {
      snapshot.value = value
    })
    return () => {
      disposeAutomation?.()
      disposeOffset?.()
      disposeSnapshot?.()
    }
  }

  return {
    auth, leagues, tabs, supportedTabs, selectedTabs, requiredCalibrations, missingCalibrations,
    missingCalibrationLabels, snapshot, automation, settings, busy, error,
    save, setError, restoreAuth, openWebLogin, completeWebLogin, loginWithToken, logout,
    loadLeagues, loadTabs, refresh, calibrate, previewOverlay,
    startAutomation, pauseAutomation, resumeAutomation, stopAutomation,
    updateSetting, updateTabFolderState, listenAutomation, setEnabled, syncRuntime, initializeRuntime
  }
})
