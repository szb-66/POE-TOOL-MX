import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { electronApi } from '@/api/electron'
import { createDefaultCombatAssist, normalizeCombatAssist, validateCombatAssist } from '@/utils/combatConfig'
import { DEFAULT_GLOBAL_SHORTCUTS, mergeGlobalShortcutSettings } from '@/utils/shortcutConfig'
import {
  ADAPTIVE_TIMING,
  FIXED_TIMING,
  OPERATION_DELAY,
  migrateOperationDelay,
  normalizeAdaptiveTimeoutMs,
  normalizeAdaptiveTiming,
  normalizeFixedTiming,
  normalizeOperationDelay
} from '@/utils/operationDelay'
import { EMPTY_SLOT_THRESHOLD, normalizeEmptySlotThreshold } from '@/utils/inventorySettings'
import { createDefaultStashTabSelection, normalizeStashTabSelection } from '@/utils/stashTabSelection'
import { addOverlayBackgroundHistory, normalizeOverlaySettings } from '../../../shared/overlayBackground.js'
import {
  DEFAULT_STORY_OVERLAY_WIDTH,
  DEFAULT_STORY_OVERLAY_OPACITY,
  DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL,
  migrateStoryOverlayLayout,
  normalizeStoryOverlayOpacity,
  normalizeStoryOverlayWidth,
  normalizeStoryShowSkillRequiredLevel,
  STORY_OVERLAY_LAYOUT_VERSION
} from './storySkillSettings'
import {
  DPI_MODE_AUTO,
  DPI_MODE_MANUAL,
  loadDpiSettings,
  normalizeDpiScale,
  resolveEffectiveDpi
} from '@/utils/dpiSettings'
import {
  DEFAULT_GAME_WINDOW_TITLES,
  normalizeGameWindowTitles,
  validateGameWindowTitles
} from '../../../shared/gameWindowTitles.js'

function sanitizeCurrencyPositions(positions = {}) {
  const { chisel, ...rest } = positions
  return rest
}

export const useSettingsStore = defineStore('settings', () => {
  const globalShortcuts = ref({ ...DEFAULT_GLOBAL_SHORTCUTS })
  const shortcutHealth = ref({ status: 'pending', error: '', failed: [] })
  const shortcutScopeEnabled = ref(true)
  const shortcutScopeAvailable = ref(true)
  const gameForeground = ref(false)

  const combatAssist = ref(createDefaultCombatAssist())
  let combatConfigRevision = 0
  let combatCommitQueue = Promise.resolve()
  const stashTabSelection = ref(createDefaultStashTabSelection())

  const currencyPositions = ref({
    alteration: { x: 210, y: 561 },      // 改造石
    augmentation: { x: 425, y: 663 },    // 增幅石
    regal: { x: 830, y: 555 },           // 富豪石
    chaos: { x: 1040, y: 567 },          // 混沌石
    exalted: { x: 570, y: 567 },         // 崇高石
    alchemy: { x: 933, y: 567 },         // 点金石
    scouring: { x: 822, y: 1000 },       // 重铸石
    transmutation: { x: 110, y: 567 },   // 蜕变石
    jewellers: { x: 209, y: 797 },       // 工匠石
    fusing: { x: 323, y: 797 },          // 链结石
    chromic: { x: 428, y: 798 },         // 幻色石
    vaal: { x: 1158, y: 1017 },          // 瓦尔宝珠
    wisdom: { x: 210, y: 430 }           // 知识卷轴
  })

  // 背包设置
  const inventory = ref({
    startPos: { x: 2658, y: 1199 },      // 首格坐标
    slotSize: { w: 100, h: 100 },        // 单格宽高
    emptySlotThreshold: EMPTY_SLOT_THRESHOLD.default
  })

  const operationDelayMs = ref(OPERATION_DELAY.default)
  const adaptiveTiming = ref(ADAPTIVE_TIMING.default)
  const adaptiveTimeoutMs = ref(ADAPTIVE_TIMING.timeoutDefault)
  const fixedTiming = ref({ ...FIXED_TIMING.defaults })

  const itemPosition = ref({
    x: 636,
    y: 930
  })

  const dpiMode = ref(DPI_MODE_AUTO)
  const manualDpiScale = ref(1)
  const lastDetectedDpiScale = ref(null)
  const detectedDpiScale = ref(null)
  const primaryDpiScale = ref(1)
  const dpiDetectionStatus = ref('idle')
  const dpiWindowTitle = ref('')
  const dpiDetectionError = ref('')
  const effectiveDpi = computed(() => resolveEffectiveDpi({
    mode: dpiMode.value,
    manualScale: manualDpiScale.value,
    detectedScale: detectedDpiScale.value,
    lastDetectedScale: lastDetectedDpiScale.value,
    primaryScale: primaryDpiScale.value
  }))
  const dpiScale = computed(() => effectiveDpi.value.scaleFactor)
  const dpiSource = computed(() => effectiveDpi.value.source)
  const debugMode = ref(false)

  // 覆盖层设置
  const overlaySettings = ref(normalizeOverlaySettings())
  const gameWindowTitles = ref([...DEFAULT_GAME_WINDOW_TITLES])
  const storyOverlayWidth = ref(DEFAULT_STORY_OVERLAY_WIDTH)
  const storyOverlayLayoutVersion = ref(STORY_OVERLAY_LAYOUT_VERSION)
  const storyOverlayOpacity = ref(DEFAULT_STORY_OVERLAY_OPACITY)
  const storyShowSkillRequiredLevel = ref(DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL)

  // 背景历史记录
  const backgroundHistory = ref([])

  function updateGlobalShortcuts(shortcuts) {
    globalShortcuts.value = { ...globalShortcuts.value, ...shortcuts }
    saveSettings()
  }

  function updateCurrencyPosition(currency, position) {
    currencyPositions.value[currency] = { ...position }
    saveSettings()
  }

  function updateInventorySettings(settings) {
    inventory.value = {
      ...inventory.value,
      ...settings,
      emptySlotThreshold: normalizeEmptySlotThreshold(
        settings?.emptySlotThreshold ?? inventory.value.emptySlotThreshold
      )
    }
    saveSettings()
    if ('emptySlotThreshold' in (settings || {})) {
      electronApi.bag.updateEmptySlotThreshold(inventory.value.emptySlotThreshold)?.catch(() => {})
    }
    return inventory.value
  }

  function updateShortcutHealth(result = {}) {
    shortcutHealth.value = {
      status: result.success === true ? 'ready' : 'error',
      error: String(result.error || ''),
      failed: Array.isArray(result.failed) ? result.failed : []
    }
  }

  function applyShortcutScopeState(state = {}) {
    if (typeof state.enabled === 'boolean') shortcutScopeEnabled.value = state.enabled
    if (typeof state.available === 'boolean') shortcutScopeAvailable.value = state.available
    if (typeof state.gameForeground === 'boolean') gameForeground.value = state.gameForeground
    return { ...state }
  }

  async function setShortcutScopeEnabled(enabled) {
    const candidate = Boolean(enabled)
    const previous = shortcutScopeEnabled.value
    shortcutScopeEnabled.value = candidate
    try {
      const state = await electronApi.shortcut.setScopeEnabled(candidate)
      if (state?.success === false) throw new Error(state.error || '更新快捷键作用域失败')
      applyShortcutScopeState(state)
      saveSettings()
      return state || { success: true }
    } catch (error) {
      shortcutScopeEnabled.value = previous
      saveSettings()
      return { success: false, error: error?.message || '更新快捷键作用域失败' }
    }
  }

  function updateOperationDelay(value) {
    operationDelayMs.value = normalizeOperationDelay(value)
    saveSettings()
    electronApi.bag.updateOperationDelay(operationDelayMs.value)?.catch(() => {})
    return operationDelayMs.value
  }

  function updateAdaptiveTiming(enabled) {
    adaptiveTiming.value = normalizeAdaptiveTiming(enabled)
    saveSettings()
    return adaptiveTiming.value
  }

  function updateAdaptiveTimeoutMs(value) {
    adaptiveTimeoutMs.value = normalizeAdaptiveTimeoutMs(value)
    saveSettings()
    return adaptiveTimeoutMs.value
  }

  function updateFixedTiming(patch = {}) {
    fixedTiming.value = normalizeFixedTiming({ ...fixedTiming.value, ...patch })
    saveSettings()
    return fixedTiming.value
  }

  function updateCombatAssist(config) {
    const candidate = normalizeCombatAssist(config)
    const validation = validateCombatAssist(candidate)
    if (!validation.isValid) {
      return Promise.resolve({ success: false, error: validation.errors[0] || '战斗辅助配置无效' })
    }
    const commit = async () => {
      try {
        const potionResult = await electronApi.combat.updatePotionConfig(candidate)
        if (!potionResult?.success) throw new Error(potionResult?.error || '战斗辅助配置同步失败')
        const loopResult = await electronApi.combat.updateLoopConfig(candidate)
        if (!loopResult?.success) {
          await electronApi.combat.updatePotionConfig(combatAssist.value)?.catch(() => {})
          throw new Error(loopResult?.error || '主动循环配置同步失败')
        }
        const revision = Number(potionResult.revision) || 0
        if (revision >= combatConfigRevision) {
          combatConfigRevision = revision
          combatAssist.value = normalizeCombatAssist(potionResult.config || candidate)
          saveSettings()
        }
        return { success: true, config: JSON.parse(JSON.stringify(combatAssist.value)), revision }
      } catch (error) {
        return { success: false, error: error?.message || '战斗辅助配置同步失败' }
      }
    }
    combatCommitQueue = combatCommitQueue.then(commit, commit)
    return combatCommitQueue
  }

  function updateStashTabSelection(config) {
    stashTabSelection.value = normalizeStashTabSelection({
      ...stashTabSelection.value,
      ...config,
      names: { ...stashTabSelection.value.names, ...(config?.names || {}) }
    })
    saveSettings()
    return stashTabSelection.value
  }

  function updateItemPosition(position) {
    itemPosition.value = { ...position }
    saveSettings()
  }

  function updateManualDpiScale(scale) {
    manualDpiScale.value = normalizeDpiScale(scale, manualDpiScale.value)
    saveSettings()
  }

  async function updateGameWindowTitles(value) {
    const validation = validateGameWindowTitles(value)
    if (!validation.valid) return { success: false, error: validation.error }
    try {
      const result = await electronApi.system.updateGameWindowTitles(validation.titles)
      if (!result?.success) return { success: false, error: result?.error || '更新游戏窗口名称失败' }
      gameWindowTitles.value = normalizeGameWindowTitles(result.titles)
      saveSettings()
      return { success: true, titles: [...gameWindowTitles.value] }
    } catch (error) {
      return { success: false, error: error?.message || '更新游戏窗口名称失败' }
    }
  }

  function syncGameWindowTitles() {
    return updateGameWindowTitles(gameWindowTitles.value)
  }

  function updateDpiMode(mode) {
    dpiMode.value = mode === DPI_MODE_MANUAL ? DPI_MODE_MANUAL : DPI_MODE_AUTO
    if (dpiMode.value === DPI_MODE_MANUAL) {
      detectedDpiScale.value = null
      dpiDetectionStatus.value = 'idle'
      dpiDetectionError.value = ''
    }
    saveSettings()
  }

  async function refreshDpiScale() {
    if (dpiMode.value !== DPI_MODE_AUTO) {
      return { success: true, skipped: true, scaleFactor: dpiScale.value, source: dpiSource.value }
    }
    dpiDetectionStatus.value = 'detecting'
    dpiDetectionError.value = ''
    try {
      const result = await electronApi.system.detectGameDpi()
      primaryDpiScale.value = normalizeDpiScale(result?.primaryScaleFactor, primaryDpiScale.value)
      const detected = result?.found ? normalizeDpiScale(result.scaleFactor, null) : null
      if (detected != null) {
        detectedDpiScale.value = detected
        lastDetectedDpiScale.value = detected
        dpiWindowTitle.value = String(result.windowTitle || '')
        dpiDetectionStatus.value = 'success'
        saveSettings()
        return { success: true, scaleFactor: dpiScale.value, source: dpiSource.value, windowTitle: dpiWindowTitle.value }
      }
      detectedDpiScale.value = null
      dpiWindowTitle.value = ''
      dpiDetectionStatus.value = 'error'
      dpiDetectionError.value = result?.error || '未找到游戏窗口'
    } catch (error) {
      detectedDpiScale.value = null
      dpiWindowTitle.value = ''
      dpiDetectionStatus.value = 'error'
      dpiDetectionError.value = error?.message || '识别游戏 DPI 失败'
    }
    saveSettings()
    return { success: false, scaleFactor: dpiScale.value, source: dpiSource.value, error: dpiDetectionError.value }
  }

  function updateOverlaySettings(settings) {
    overlaySettings.value = normalizeOverlaySettings({ ...overlaySettings.value, ...settings })
    
    // Add to history if path is valid and not already at the top
    if (overlaySettings.value.backgroundMode === 'custom' && overlaySettings.value.backgroundPath) {
      addToHistory({
        path: overlaySettings.value.backgroundPath
      })
    }

    saveSettings()
    // 通知 Overlay 窗口更新
    if (electronApi && electronApi.overlay && electronApi.overlay.updateSettings) {
      // 使用 JSON.parse(JSON.stringify()) 去除 Proxy 包装，确保 IPC 通信正常
      electronApi.overlay.updateSettings(JSON.parse(JSON.stringify(overlaySettings.value)))
    }
  }

  function addToHistory(item) {
    backgroundHistory.value = addOverlayBackgroundHistory(backgroundHistory.value, item?.path)
  }

  function removeHistoryItem(index) {
    backgroundHistory.value.splice(index, 1)
    saveSettings()
  }

  function saveSettings() {
    try {
      localStorage.setItem('settings', JSON.stringify({
        globalShortcuts: globalShortcuts.value,
        shortcutScopeEnabled: shortcutScopeEnabled.value,
        currencyPositions: sanitizeCurrencyPositions(currencyPositions.value),
        inventory: inventory.value,
        operationDelayMs: operationDelayMs.value,
        adaptiveTiming: adaptiveTiming.value,
        adaptiveTimeoutMs: adaptiveTimeoutMs.value,
        fixedTiming: fixedTiming.value,
        itemPosition: itemPosition.value,
        gameWindowTitles: gameWindowTitles.value,
        dpiScale: dpiScale.value,
        dpiMode: dpiMode.value,
        manualDpiScale: manualDpiScale.value,
        lastDetectedDpiScale: lastDetectedDpiScale.value,
        debugMode: debugMode.value,
        overlaySettings: overlaySettings.value,
        storyOverlayWidth: storyOverlayWidth.value,
        storyOverlayLayoutVersion: storyOverlayLayoutVersion.value,
        storyOverlayOpacity: storyOverlayOpacity.value,
        storyShowSkillRequiredLevel: storyShowSkillRequiredLevel.value,
        backgroundHistory: backgroundHistory.value,
        combatAssist: combatAssist.value,
        stashTabSelection: stashTabSelection.value
      }))
    } catch (error) {
      // 保存设置失败
    }
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem('settings')
      const data = saved ? JSON.parse(saved) : {}
      let legacyBagSettings = {}
      try { legacyBagSettings = JSON.parse(localStorage.getItem('bagSettings') || '{}') } catch (_error) { /* ignore invalid legacy data */ }
      operationDelayMs.value = migrateOperationDelay(data, legacyBagSettings)
      adaptiveTiming.value = normalizeAdaptiveTiming(data.adaptiveTiming)
      adaptiveTimeoutMs.value = normalizeAdaptiveTimeoutMs(data.adaptiveTimeoutMs)
      fixedTiming.value = normalizeFixedTiming(data.fixedTiming)
      if (saved) {
        if (typeof data.shortcutScopeEnabled === 'boolean') {
          shortcutScopeEnabled.value = data.shortcutScopeEnabled
        }
        if (data.globalShortcuts) {
          globalShortcuts.value = mergeGlobalShortcutSettings(data.globalShortcuts)
        } else {
          globalShortcuts.value = mergeGlobalShortcutSettings()
        }
        if (data.currencyPositions) {
          currencyPositions.value = {
            ...currencyPositions.value,
            ...sanitizeCurrencyPositions(data.currencyPositions)
          }
        } else {
          currencyPositions.value = sanitizeCurrencyPositions(currencyPositions.value)
        }
        if (data.inventory) {
          inventory.value = {
            ...inventory.value,
            ...data.inventory,
            emptySlotThreshold: normalizeEmptySlotThreshold(data.inventory.emptySlotThreshold)
          }
        }
        if (data.itemPosition) {
          itemPosition.value = { ...data.itemPosition }
        }
        gameWindowTitles.value = normalizeGameWindowTitles(data.gameWindowTitles)
        const dpiSettings = loadDpiSettings(data)
        dpiMode.value = dpiSettings.mode
        manualDpiScale.value = dpiSettings.manualScale
        lastDetectedDpiScale.value = dpiSettings.lastDetectedScale
        if (typeof data.debugMode === 'boolean') {
          debugMode.value = data.debugMode
        }
        if (data.overlaySettings) {
          overlaySettings.value = normalizeOverlaySettings(data.overlaySettings)
        }
        if (data.backgroundHistory) {
          backgroundHistory.value = data.backgroundHistory
        }
        const storyOverlayLayout = migrateStoryOverlayLayout({
          width: data.storyOverlayWidth,
          layoutVersion: data.storyOverlayLayoutVersion
        })
        storyOverlayWidth.value = storyOverlayLayout.width
        storyOverlayLayoutVersion.value = storyOverlayLayout.layoutVersion
        storyOverlayOpacity.value = normalizeStoryOverlayOpacity(data.storyOverlayOpacity)
        storyShowSkillRequiredLevel.value = normalizeStoryShowSkillRequiredLevel(data.storyShowSkillRequiredLevel)
        combatAssist.value = normalizeCombatAssist(data.combatAssist)
        stashTabSelection.value = normalizeStashTabSelection(data.stashTabSelection)
        if (storyOverlayLayout.migrated) saveSettings()
      }
    } catch (error) {
      // 加载设置失败
    }
  }

  // 默认值（用于重置）
  const defaultGlobalShortcuts = DEFAULT_GLOBAL_SHORTCUTS

  const defaultCurrencyPositions = {
    alteration: { x: 210, y: 561 },
    augmentation: { x: 425, y: 663 },
    regal: { x: 830, y: 555 },
    chaos: { x: 1040, y: 567 },
    exalted: { x: 570, y: 567 },
    alchemy: { x: 933, y: 567 },
    scouring: { x: 822, y: 1000 },
    transmutation: { x: 110, y: 567 },
    jewellers: { x: 209, y: 797 },
    fusing: { x: 323, y: 797 },
    chromic: { x: 428, y: 798 },
    vaal: { x: 1158, y: 1017 },
    wisdom: { x: 210, y: 430 }
  }

  const updateStoryOverlayWidth = (width) => {
    storyOverlayWidth.value = normalizeStoryOverlayWidth(width)
    saveSettings()
    electronApi.storyOverlay.resize({ width: storyOverlayWidth.value })
  }

  const updateStoryShowSkillRequiredLevel = (visible) => {
    storyShowSkillRequiredLevel.value = Boolean(visible)
    saveSettings()
  }

  const updateStoryOverlayOpacity = (opacity) => {
    storyOverlayOpacity.value = normalizeStoryOverlayOpacity(opacity)
    saveSettings()
    electronApi.storyOverlay.setOpacity(storyOverlayOpacity.value)
  }

  const defaultInventory = {
    startPos: { x: 2658, y: 1199 },
    slotSize: { w: 100, h: 100 },
    emptySlotThreshold: EMPTY_SLOT_THRESHOLD.default
  }

  const defaultItemPosition = {
    x: 636,
    y: 930
  }

  const defaultOverlaySettings = normalizeOverlaySettings()

  function resetSettings() {
    globalShortcuts.value = { ...defaultGlobalShortcuts }
    shortcutScopeEnabled.value = true
    shortcutScopeAvailable.value = true
    gameForeground.value = false
    currencyPositions.value = { ...defaultCurrencyPositions }
    inventory.value = { ...defaultInventory }
    operationDelayMs.value = OPERATION_DELAY.default
    adaptiveTiming.value = ADAPTIVE_TIMING.default
    adaptiveTimeoutMs.value = ADAPTIVE_TIMING.timeoutDefault
    fixedTiming.value = { ...FIXED_TIMING.defaults }
    itemPosition.value = { ...defaultItemPosition }
    gameWindowTitles.value = [...DEFAULT_GAME_WINDOW_TITLES]
    dpiMode.value = DPI_MODE_AUTO
    manualDpiScale.value = 1
    lastDetectedDpiScale.value = null
    detectedDpiScale.value = null
    primaryDpiScale.value = 1
    dpiDetectionStatus.value = 'idle'
    dpiWindowTitle.value = ''
    dpiDetectionError.value = ''
    debugMode.value = false
    overlaySettings.value = { ...defaultOverlaySettings }
    storyOverlayWidth.value = DEFAULT_STORY_OVERLAY_WIDTH
    storyOverlayLayoutVersion.value = STORY_OVERLAY_LAYOUT_VERSION
    storyOverlayOpacity.value = DEFAULT_STORY_OVERLAY_OPACITY
    storyShowSkillRequiredLevel.value = DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL
    backgroundHistory.value = []
    combatAssist.value = createDefaultCombatAssist()
    stashTabSelection.value = createDefaultStashTabSelection()
    saveSettings()
    electronApi.bag.updateOperationDelay(operationDelayMs.value)?.catch(() => {})
    electronApi.bag.updateEmptySlotThreshold(inventory.value.emptySlotThreshold)?.catch(() => {})
    electronApi.system.updateGameWindowTitles(gameWindowTitles.value)?.catch(() => {})
    // 重置后把门禁开关同步回主进程，避免渲染端与主进程状态分叉
    electronApi.shortcut.setScopeEnabled(true)
      .then((state) => { if (state) applyShortcutScopeState(state) })
      .catch(() => {})
    // 同步重置后的设置
    if (electronApi && electronApi.overlay && electronApi.overlay.updateSettings) {
      // 使用 JSON.parse(JSON.stringify()) 去除 Proxy 包装，确保 IPC 通信正常
      electronApi.overlay.updateSettings(JSON.parse(JSON.stringify(overlaySettings.value)))
    }
    electronApi.window.setDevToolsVisible(false)
  }

  function updateDebugMode(enabled) {
    debugMode.value = Boolean(enabled)
    saveSettings()
  }

  // 初始化时加载
  loadSettings()

  return {
    globalShortcuts,
    shortcutHealth,
    shortcutScopeEnabled,
    shortcutScopeAvailable,
    gameForeground,
    combatAssist,
    stashTabSelection,
    currencyPositions,
    inventory,
    operationDelayMs,
    adaptiveTiming,
    adaptiveTimeoutMs,
    fixedTiming,
    itemPosition,
    gameWindowTitles,
    dpiScale,
    dpiMode,
    manualDpiScale,
    lastDetectedDpiScale,
    detectedDpiScale,
    primaryDpiScale,
    dpiSource,
    dpiDetectionStatus,
    dpiWindowTitle,
    dpiDetectionError,
    debugMode,
    overlaySettings,
    storyOverlayWidth,
    storyOverlayOpacity,
    storyShowSkillRequiredLevel,
    backgroundHistory,
    updateGlobalShortcuts,
    updateShortcutHealth,
    applyShortcutScopeState,
    setShortcutScopeEnabled,
    updateCombatAssist,
    updateStashTabSelection,
    updateCurrencyPosition,
    updateInventorySettings,
    updateOperationDelay,
    updateAdaptiveTiming,
    updateAdaptiveTimeoutMs,
    updateFixedTiming,
    updateItemPosition,
    updateGameWindowTitles,
    syncGameWindowTitles,
    updateManualDpiScale,
    updateDpiMode,
    refreshDpiScale,
    updateDebugMode,
    updateOverlaySettings,
    updateStoryOverlayWidth,
    updateStoryOverlayOpacity,
    updateStoryShowSkillRequiredLevel,
    removeHistoryItem,
    saveSettings,
    loadSettings,
    resetSettings
  }
})
