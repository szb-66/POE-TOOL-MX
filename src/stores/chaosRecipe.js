import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '../api/electron.js'
import { normalizeOperationDelay } from '../utils/operationDelay.js'
import { useInterfaceDetectionStore } from './interfaceDetection.js'
import { usePoeCnAccountStore } from './poeCnAccount.js'
import {
  CHAOS_GRID_LAYOUT_LABELS,
  missingCalibrationKeys,
  requiredCalibrationKeys
} from '../../electron/modules/chaosRecipe/layout.js'
import {
  SINGLE_RECIPE_IDS,
  VENDOR_RECIPE_IDS
} from '../../electron/modules/chaosRecipe/engine.js'
import { normalizeStashGridRegion } from '../utils/stashGridCalibration.js'

const STORAGE_KEY = 'chaosRecipeSettings'

const defaultSettings = () => ({
  enabled: false,
  selectedTabIds: [],
  includeIdentified: false,
  activeRecipeId: 'chaos',
  targetSetCount: 1,
  operationDelayMs: 80,
  controlOverlayOffset: { x: 50, y: 1550 },
  calibration: { root: null, folder: null },
  tabFolderStates: {}
})

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
  const activeRecipeId = VENDOR_RECIPE_IDS.includes(String(raw.activeRecipeId || ''))
    ? String(raw.activeRecipeId)
    : 'chaos'
  return {
    enabled: Boolean(raw.enabled),
    selectedTabIds: Array.isArray(raw.selectedTabIds) ? raw.selectedTabIds.map(String) : [],
    includeIdentified: Boolean(raw.includeIdentified),
    activeRecipeId,
    targetSetCount: Math.max(1, Math.min(20, Math.trunc(Number(raw.targetSetCount) || 1))),
    operationDelayMs: normalizeOperationDelay(raw.operationDelayMs),
    tabFolderStates: normalizeTabFolderStates(raw.tabFolderStates || raw.tabOverrides),
    controlOverlayOffset: {
      x: Number.isFinite(Number(raw.controlOverlayOffset?.x)) ? Math.round(Number(raw.controlOverlayOffset.x)) : 50,
      y: Number.isFinite(Number(raw.controlOverlayOffset?.y)) ? Math.round(Number(raw.controlOverlayOffset.y)) : 1550
    },
    calibration: {
      root: normalizeStashGridRegion(raw.calibration?.root) ||
        normalizeStashGridRegion(raw.calibration?.normal) ||
        normalizeStashGridRegion(raw.calibration?.quad),
      folder: normalizeStashGridRegion(raw.calibration?.folder) ||
        normalizeStashGridRegion(raw.calibration?.folderNormal) ||
        normalizeStashGridRegion(raw.calibration?.folderQuad)
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
  const error = new Error(response?.error?.message || '国服商店配方操作失败')
  error.code = response?.error?.code || 'UNKNOWN'
  error.details = response?.error?.details || {}
  throw error
}

export const useChaosRecipeStore = defineStore('chaosRecipe', () => {
  const interfaceDetectionStore = useInterfaceDetectionStore()
  const accountStore = usePoeCnAccountStore()
  const initial = loadSettings()
  const tabs = ref([])
  const snapshot = ref(null)
  const singleSelections = ref(Object.fromEntries(SINGLE_RECIPE_IDS.map((id) => [id, []])))
  const automation = ref({ status: 'idle', completedItems: 0, totalItems: 0, tabName: '' })
  const settings = ref(initial)
  const stashGridCalibration = computed(() => interfaceDetectionStore.stashGridCalibration)
  const busy = ref(false)
  const error = ref(null)
  const auth = computed(() => accountStore.status)
  const leagues = computed(() => accountStore.leagues)
  const league = computed(() => accountStore.settings.league)

  const effectiveTabs = computed(() => {
    const folderStates = settings.value.tabFolderStates[league.value] || {}
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
  const missingCalibrations = computed(() => missingCalibrationKeys(selectedTabs.value, stashGridCalibration.value))
  const missingCalibrationLabels = computed(() =>
    missingCalibrations.value.map((key) => CHAOS_GRID_LAYOUT_LABELS[key])
  )
  const activeRecipe = computed(() =>
    snapshot.value?.recipes?.[settings.value.activeRecipeId] || null
  )
  const activeSelectedItemIds = computed(() =>
    singleSelections.value[settings.value.activeRecipeId] || []
  )

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
  }

  function runtimePayload(overrides = {}) {
    return {
      ...JSON.parse(JSON.stringify(settings.value)),
      calibration: JSON.parse(JSON.stringify(stashGridCalibration.value)),
      league: league.value,
      selectedItemIds: [...activeSelectedItemIds.value],
      ...interfaceDetectionStore.runtime(),
      ...overrides
    }
  }

  function resetSingleSelections(value = snapshot.value) {
    singleSelections.value = Object.fromEntries(SINGLE_RECIPE_IDS.map((id) => [
      id,
      (value?.recipes?.[id]?.candidates || []).map((item) => String(item.id))
    ]))
  }

  function currentPlanRequest() {
    return {
      recipeId: settings.value.activeRecipeId,
      setCount: settings.value.targetSetCount,
      itemIds: [...activeSelectedItemIds.value],
      calibration: JSON.parse(JSON.stringify(stashGridCalibration.value))
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
      await accountStore.restore()
      if (accountStore.status.authenticated && league.value) await loadTabs()
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

  async function loadTabs(nextLeague = league.value) {
    if (String(nextLeague || '') !== league.value) await accountStore.setLeague(nextLeague)
    if (!league.value) {
      tabs.value = []
      return []
    }
    tabs.value = unwrap(await electronApi.chaosRecipe.listTabs(league.value))
    const available = new Set(tabs.value.filter((tab) => tab.supported).map((tab) => String(tab.id)))
    settings.value.selectedTabIds = settings.value.selectedTabIds.filter((id) => available.has(String(id)))
    save()
    if (settings.value.enabled) await syncRuntime()
    return tabs.value
  }

  async function refresh() {
    return run(async () => {
      snapshot.value = unwrap(await electronApi.chaosRecipe.refresh({
        league: league.value,
        selectedTabIds: settings.value.selectedTabIds,
        includeIdentified: settings.value.includeIdentified,
        tabFolderStates: settings.value.tabFolderStates[league.value] || {}
      }))
      resetSingleSelections(snapshot.value)
      if (Array.isArray(snapshot.value.availableTabs)) {
        tabs.value = snapshot.value.availableTabs
        const available = new Set(tabs.value.filter((tab) => tab.supported).map((tab) => String(tab.id)))
        settings.value.selectedTabIds = settings.value.selectedTabIds.filter((id) => available.has(String(id)))
      }
      const activeSetCount = snapshot.value.recipes?.[settings.value.activeRecipeId]?.fullSetCount || 0
      settings.value.targetSetCount = Math.min(
        Math.max(1, settings.value.targetSetCount),
        Math.max(1, activeSetCount)
      )
      save()
      if (settings.value.enabled) await syncRuntime()
      return snapshot.value
    })
  }

  async function calibrate(type) {
    const result = unwrap(await electronApi.chaosRecipe.pickGridRegion())
    if (!result?.canceled) {
      interfaceDetectionStore.setStashGridCalibration(type, result)
      if (settings.value.enabled) await syncRuntime()
    }
    return result
  }

  async function previewOverlay() {
    return run(async () => unwrap(await electronApi.chaosRecipe.openOverlay(currentPlanRequest())))
  }

  async function startAutomation(runtime) {
    return run(async () => {
      const result = unwrap(await electronApi.chaosRecipe.startAutomation({
        ...currentPlanRequest(),
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

  function setActiveRecipe(recipeId) {
    settings.value.activeRecipeId = VENDOR_RECIPE_IDS.includes(String(recipeId)) ? String(recipeId) : 'chaos'
    const recipe = snapshot.value?.recipes?.[settings.value.activeRecipeId]
    if (recipe?.kind === 'set') {
      settings.value.targetSetCount = Math.min(
        Math.max(1, settings.value.targetSetCount),
        Math.max(1, Number(recipe.fullSetCount) || 0)
      )
    }
    save()
    if (settings.value.enabled) void syncRuntime().catch(setError)
  }

  function setSelectedItemIds(recipeId, itemIds) {
    if (!SINGLE_RECIPE_IDS.includes(String(recipeId))) return
    const available = new Set((snapshot.value?.recipes?.[recipeId]?.candidates || []).map((item) => String(item.id)))
    singleSelections.value = {
      ...singleSelections.value,
      [recipeId]: [...new Set((Array.isArray(itemIds) ? itemIds : []).map(String))]
        .filter((id) => available.has(id))
    }
    if (settings.value.activeRecipeId === recipeId && settings.value.enabled) {
      void syncRuntime().catch(setError)
    }
  }

  function updateTabFolderState(tabId, inFolder) {
    const activeLeague = league.value
    if (!activeLeague || !tabId) return
    const leagueStates = settings.value.tabFolderStates[activeLeague] || {}
    settings.value.tabFolderStates = {
      ...settings.value.tabFolderStates,
      [activeLeague]: {
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
      if (event.event === 'completed' && league.value && settings.value.selectedTabIds.length) {
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
      resetSingleSelections(value)
      if (settings.value.enabled) void syncRuntime().catch(setError)
    })
    return () => {
      disposeAutomation?.()
      disposeOffset?.()
      disposeSnapshot?.()
    }
  }

  accountStore.onLeagueChanged(async () => {
    if (settings.value.enabled) await setEnabled(false)
    settings.value.selectedTabIds = []
    tabs.value = []
    snapshot.value = null
    resetSingleSelections(null)
    save()
    if (accountStore.status.authenticated && league.value) await loadTabs()
  })
  accountStore.onStatusChanged(async (nextStatus) => {
    if (nextStatus.authenticated) return
    if (settings.value.enabled) await setEnabled(false)
    tabs.value = []
    snapshot.value = null
    resetSingleSelections(null)
  })

  return {
    auth, leagues, league, tabs, supportedTabs, selectedTabs, requiredCalibrations, missingCalibrations,
    missingCalibrationLabels, stashGridCalibration, snapshot, activeRecipe, activeSelectedItemIds,
    singleSelections, automation, settings, busy, error,
    save, setError, loadTabs, refresh, calibrate, previewOverlay,
    startAutomation, pauseAutomation, resumeAutomation, stopAutomation,
    updateSetting, setActiveRecipe, setSelectedItemIds, updateTabFolderState,
    listenAutomation, setEnabled, syncRuntime, initializeRuntime
  }
})
