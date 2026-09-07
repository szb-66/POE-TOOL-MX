/**
 * Purpose: 脚本执行服务，负责快捷键注册、脚本生成和执行
 * Inputs: 配置对象、预设数据
 * Outputs: 执行结果、状态更新
 * Preconditions: Electron 环境已初始化，设置已加载
 * Edge cases: 快捷键注册失败时提示用户；脚本执行失败时清理状态
 * Errors: 执行失败时显示错误消息，不抛出异常
 */

import { generatePythonScript, generateMapRollingScript } from './python.js'
import { validateCraftingConfig, validateMapRollingConfig, validateSpecializedCraftingConfig } from './validation.js'
import { electronApi } from '../api/electron.js'
import { usePresetStore } from '../stores/preset'
import { useSettingsStore } from '../domains/settings/settingsStore'
import { useScriptStore } from '../stores/script'
import { ElMessage } from 'element-plus'
import { executePortalAssist } from './combatService.js'
import { useStoryStore } from '../stores/story'
import { useStoryTimerStore } from '../stores/storyTimer'
import { validateShortcuts } from './shortcutValidator.js'
import { dispatchShortcutAction, normalizeGlobalShortcutSettings } from './shortcutConfig.js'
import { isSuccessfulScriptStart } from './scriptStartResult.js'
import { usePriceCheckStore } from '../stores/priceCheck'
import { validateStashTabSelection } from './stashTabSelection.js'
import { usePuzzleStore } from '../stores/puzzle.js'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from './diagnostics.js'
import { getActiveMapRollingConfig } from './mapPresetMigration.js'
import { isEmergencyCancellation } from './emergencyStopResult.js'
import { validateMapRecovery } from './craftingRecovery.js'
import { createItemCraftingRunPreset } from './itemPreset.js'
import { normalizeItemCraftingKind, specializedPresetToExecutionPreset } from './specializedCraftingPreset.js'
import { useBatchCraftingStore } from '../stores/batchCrafting.js'
import { useFeatureModulesStore } from '../stores/featureModules.js'
import { filterFeatureShortcuts, shortcutFeatureId } from '../features/featureCatalog.js'
import { freezeBatchConfiguration, restoreBatchConfiguration } from '../domains/items/batchCrafting.js'
import { runWithConfigurationGuide } from '../domains/configurationGuide/configurationGuideStore.js'
import {
  collectCraftingConfigurationIssues,
  collectMapConfigurationIssues,
  CONFIGURATION_ACTIONS,
  CONFIGURATION_MODULES
} from '../domains/configurationGuide/configurationIssues.js'

// 监听器注册标志
let shortcutListenerRegistered = false
let shortcutScopeListenerRegistered = false
let pythonOutputListenerRegistered = false
let scriptStatusListenerRegistered = false
let itemResultListenerRegistered = false
let emergencyStopPromise = null

function formatShortcutError(result) {
  return result?.failed?.map(item => item.accelerator).join('、') || '未知快捷键'
}

async function refreshDpiForAutomation(settingsStore) {
  const result = await settingsStore.refreshDpiScale()
  if (result.success || result.skipped) return
  const sourceText = result.source === 'history' ? '上次识别值' : '主屏倍率'
  ElMessage.warning(`未能识别游戏窗口 DPI，正在使用${sourceText} ${result.scaleFactor}`)
}

/**
 * 初始化快捷键注册
 */
export async function initShortcuts() {
  // 使用 electronApi 封装
  const settingsStore = useSettingsStore()
  useStoryTimerStore()

  // 同步“仅在游戏窗口前台生效”开关与当前前台状态
  try {
    const storedEnabled = settingsStore.shortcutScopeEnabled
    let scopeState = await electronApi.shortcut.getScopeState()
    if (scopeState && Boolean(scopeState.enabled) !== storedEnabled) {
      scopeState = await electronApi.shortcut.setScopeEnabled(storedEnabled)
    }
    if (scopeState) settingsStore.applyShortcutScopeState(scopeState)
  } catch {
    // 门禁状态同步失败不阻断快捷键初始化
  }
  if (!shortcutScopeListenerRegistered) {
    electronApi.shortcut.onScopeChanged((state) => {
      if (!state) return
      settingsStore.applyShortcutScopeState(state)
      // 前台/窗口 bounds 变化（含游戏内切换显示模式）时同步刷新游戏显示模式
      void settingsStore.refreshGameDisplayMode()
    })
    shortcutScopeListenerRegistered = true
  }
  void settingsStore.refreshGameDisplayMode()

  const featureStore = useFeatureModulesStore()
  const shortcuts = settingsStore.globalShortcuts
  const registeredShortcuts = filterFeatureShortcuts(shortcuts, id => featureStore.isEnabled(id))
  if (!usePriceCheckStore().settings.enabled) delete registeredShortcuts.priceCheck

  // 从设置中初始化快捷键
  try {
    const result = await electronApi.shortcut.initFromSettings(registeredShortcuts, {
      rollbackOnFailure: false,
    })
    settingsStore.applyShortcutScopeState(result)
    if (!result?.success) {
      const names = formatShortcutError(result)
      const health = settingsStore.shortcutHealth
      const message = health.error || `全局快捷键注册失败：${names}`
      if (health.status === 'attention') ElMessage.warning(message)
      else ElMessage.error(message)
      void reportDiagnosticFailure('shortcuts', 'shortcut_registration', result, 'shortcut_registration_failed')
    } else {
      void reportDiagnosticRecovery('shortcuts', 'shortcut_registration')
    }
  } catch (err) {
    settingsStore.updateShortcutHealth({ success: false, error: err.message })
    ElMessage.error(`全局快捷键初始化失败：${err.message}`)
    void reportDiagnosticFailure('shortcuts', 'shortcut_registration', err, 'shortcut_registration_failed')
  }

  // 监听快捷键触发事件
  if (!shortcutListenerRegistered) {
    electronApi.shortcut.onTriggered((accelerator) => {
      const featureId = shortcutFeatureId(accelerator)
      if (featureId && !useFeatureModulesStore().isEnabled(featureId)) return
      dispatchShortcutAction(accelerator, {
        itemStart: startCrafting,
        mapStart: startMapRolling,
        end: emergencyStopAll,
        portal: executePortalAssist,
        storyPrevious: () => useStoryStore().previous(),
        storyNext: () => useStoryStore().next(),
        storyTimerToggle: () => {
          const story = useStoryStore()
          const result = useStoryTimerStore().toggle(story.currentStoryPreset)
          if (result?.reason === 'game-background') ElMessage.warning('请切换到游戏前台后开始或继续计时')
          if (result?.reason === 'feature-disabled') ElMessage.warning('请先开启计时浮窗模块')
        },
        priceCheck: startPriceCheck,
      })
    })
    shortcutListenerRegistered = true
  }

  // 初始化 Python 脚本输出监听器
  if (!pythonOutputListenerRegistered) {
    electronApi.events.onPythonOutput((data) => {
      // 将 Python 脚本的输出显示在控制台
      const output = data.data.trim()
      if (output) {
        // Python脚本输出已通过IPC传递
      }
    })
    pythonOutputListenerRegistered = true
  }

  if (!scriptStatusListenerRegistered) {
    electronApi.script.onStatusChanged((status) => useScriptStore().applyStatus(status))
    scriptStatusListenerRegistered = true
  }

  if (!itemResultListenerRegistered) {
    electronApi.events.onUpdateOverlay((result) => useScriptStore().applyItemResult(result))
    itemResultListenerRegistered = true
  }

  const currentStatus = await electronApi.script.getStatus()
  useScriptStore().applyStatus(currentStatus)

  // 注意：快捷键更新应该在设置页面手动触发，避免频繁注册
}

export async function startPriceCheck() {
  try {
    await usePriceCheckStore().checkHoveredItem()
  } catch (error) {
    ElMessage.error(error.message || '国服查价失败')
  }
}

export async function startPuzzleAnalysis() {
  const result = await usePuzzleStore().analyze()
  if (isEmergencyCancellation(result)) return result
  if (!result?.success && result?.error) ElMessage.error(result.error.message)
  return result
}

export function emergencyStopAll() {
  if (emergencyStopPromise) return emergencyStopPromise
  const run = async () => {
    try {
      const result = await electronApi.emergencyStopAll()
      if (!result) throw new Error('主进程未返回停止结果')
      const failed = Array.isArray(result.failed) ? result.failed : []
      const stopped = Array.isArray(result.stopped) ? result.stopped : []
      if (failed.length) {
        ElMessage.error(`紧急停止部分失败：${failed.map(item => item.label || item.id).join('、')}`)
      } else if (stopped.length) {
        ElMessage.success(`已紧急停止：${stopped.map(item => item.label || item.id).join('、')}`)
      } else {
        ElMessage.info('当前没有运行中的自动化')
      }
      return result
    } catch (error) {
      ElMessage.error(`紧急停止失败：${error.message || String(error)}`)
      return { success: false, stopped: [], failed: [{ id: 'emergency-stop', label: '紧急停止', error: error.message || String(error) }] }
    }
  }
  emergencyStopPromise = run().finally(() => {
    emergencyStopPromise = null
  })
  return emergencyStopPromise
}

/**
 * 开始制作
 */
export async function startCrafting(options = {}) {
  const presetStore = usePresetStore()
  const craftingKind = normalizeItemCraftingKind(options.craftingKind || presetStore.itemCraftingKind)
  return craftingKind === 'general'
    ? startGeneralCrafting({ ...options, craftingKind })
    : startSpecializedCrafting(craftingKind, options)
}

async function startSpecializedCrafting(craftingKind, {
  forceInitialCheck = false,
  usageSessionId = null,
  continueCurrencyUsage = false
} = {}) {
  const scriptStore = useScriptStore()
  const presetStore = usePresetStore()
  const settingsStore = useSettingsStore()
  scriptStore.resetItemRuntime()

  const status = await electronApi.script.getStatus()
  scriptStore.applyStatus(status)
  if (status.isRunning) {
    const error = '脚本已在运行中'
    ElMessage.warning(error)
    return { success: false, error }
  }

  const sourcePreset = craftingKind === 'essence' ? presetStore.currentEssencePreset : presetStore.currentHarvestPreset
  const itemPosition = craftingKind === 'essence' ? settingsStore.essenceItemPosition : settingsStore.harvestItemPosition
  const actionPosition = craftingKind === 'essence' ? sourcePreset?.essencePosition : settingsStore.harvestCraftButtonPosition
  const validation = validateSpecializedCraftingConfig({ kind: craftingKind, preset: sourcePreset, itemPosition, actionPosition })
  if (!validation.isValid) {
    const error = validation.errors[0]
    ElMessage.error(error)
    return { success: false, error }
  }

  const checkInitialItem = forceInitialCheck || presetStore.craftingInitialChecks[craftingKind]
  const effectivePreset = specializedPresetToExecutionPreset(sourcePreset, checkInitialItem)
  try {
    await refreshDpiForAutomation(settingsStore)
    const filePaths = await electronApi.file.getPaths()
    const scriptContent = generatePythonScript({
      globalShortcuts: settingsStore.globalShortcuts,
      currencyPositions: {},
      operationDelayMs: settingsStore.operationDelayMs,
      fixedTiming: settingsStore.fixedTiming,
      itemPosition,
      actionPosition,
      craftingKind,
      dpiScale: settingsStore.dpiScale,
      preset: effectivePreset,
      filePaths
    })
    const requestedUsageSessionId = usageSessionId || globalThis.crypto.randomUUID()
    const result = await electronApi.script.generateAndExecute({
      scriptContent,
      preset: effectivePreset,
      mode: 'items',
      craftingKind,
      usageSessionId: requestedUsageSessionId,
      continueCurrencyUsage,
      requiresStashTabOcr: false
    })
    if (!isSuccessfulScriptStart(result)) {
      const error = result?.error || '后台进程未返回有效进程标识'
      ElMessage.error('脚本执行失败: ' + error)
      return { ...(result || {}), success: false, error }
    }
    scriptStore.applyStatus({ status: 'running', ...result, craftingKind })
    ElMessage.success(craftingKind === 'essence' ? '精华制作已启动' : '花园工艺已启动')
    return { ...result, success: true, craftingKind }
  } catch (error) {
    ElMessage.error('启动制作失败: ' + error.message)
    return { success: false, error: error.message || String(error) }
  }
}

async function startGeneralCrafting({
  craftingKind = 'general',
  forceInitialCheck = false,
  usageSessionId = null,
  continueCurrencyUsage = false,
  configurationGuideBypass = false,
  singleItemOnly = false,
  batchRecovery = null
} = {}) {
  const scriptStore = useScriptStore()
  const presetStore = usePresetStore()
  const settingsStore = useSettingsStore()
  const batchStore = useBatchCraftingStore()
  scriptStore.resetItemRuntime()

  // 检查是否已有脚本在运行
  const status = await electronApi.script.getStatus()
  scriptStore.applyStatus(status)
  if (status.isRunning) {
    const error = '脚本已在运行中'
    ElMessage.warning(error)
    return { success: false, error }
  }

  // 检查是否有启用的模块
  const currentPreset = presetStore.currentItemPreset
  const effectivePreset = createItemCraftingRunPreset(currentPreset, { forceInitialCheck, singleItemOnly })
  effectivePreset.checkInitialItem = forceInitialCheck || presetStore.craftingInitialChecks.general
  if (batchRecovery) {
    effectivePreset.batchCrafting = {
      enabled: true,
      categoryIds: [...new Set((batchRecovery.targets || []).map(target => String(target.categoryId || '')).filter(Boolean))]
    }
  }

  const collectBatchPrerequisites = () => {
    const latestPreset = JSON.parse(JSON.stringify(usePresetStore().currentItemPreset))
    const latestSettings = useSettingsStore()
    return collectCraftingConfigurationIssues({
      itemPosition: latestSettings.itemPosition,
      inventory: latestSettings.inventory,
      currencyPositions: latestSettings.currencyPositions,
      stashTabSelection: latestSettings.stashTabSelection,
      preset: latestPreset,
      batchSnapshot: batchStore.snapshot,
      batchCandidateCount: batchStore.candidates.length
    })
  }
  if (!batchRecovery && effectivePreset.batchCrafting?.enabled && !configurationGuideBypass) {
    const prerequisites = collectBatchPrerequisites()
    if (!prerequisites.ok) {
      return runWithConfigurationGuide({
        moduleId: CONFIGURATION_MODULES.items,
        actionId: CONFIGURATION_ACTIONS.start,
        title: '完成背包批量制作配置',
        actionLabel: '开始批量制作',
        collect: collectBatchPrerequisites,
        execute: () => startCrafting({
          craftingKind,
          forceInitialCheck, usageSessionId, continueCurrencyUsage,
          configurationGuideBypass: true
        })
      })
    }
  }

  let batchConfig = null
  let effectiveItemPosition = settingsStore.itemPosition
  if (effectivePreset.batchCrafting?.enabled) {
    try {
      const buildResult = batchRecovery
        ? restoreBatchConfiguration({ checkpoint: batchRecovery, preset: effectivePreset, inventory: settingsStore.inventory })
        : freezeBatchConfiguration({
            snapshot: batchStore.snapshot,
            categoryIds: effectivePreset.batchCrafting.categoryIds,
            preset: effectivePreset,
            inventory: settingsStore.inventory
          })
      if (!buildResult.valid) throw new Error(buildResult.error)
      batchConfig = buildResult.config
      const completed = new Set(batchConfig.completedIds || [])
      effectiveItemPosition = batchConfig.targets.find(target => !completed.has(target.id))?.position || settingsStore.itemPosition
    } catch (caught) {
      const error = caught?.message || '批量制作启动检查失败'
      ElMessage.error(error)
      return { success: false, error }
    }
  }

  const collectConfiguration = () => {
    const latestPreset = createItemCraftingRunPreset(
      usePresetStore().currentItemPreset,
      { forceInitialCheck, singleItemOnly }
    )
    if (batchRecovery) latestPreset.batchCrafting = { ...effectivePreset.batchCrafting }
    const latestSettings = useSettingsStore()
    return collectCraftingConfigurationIssues({
      itemPosition: effectivePreset.batchCrafting?.enabled ? effectiveItemPosition : latestSettings.itemPosition,
      currencyPositions: latestSettings.currencyPositions,
      stashTabSelection: latestSettings.stashTabSelection,
      inventory: latestSettings.inventory,
      preset: latestPreset,
      batchSnapshot: batchRecovery ? { scanId: batchRecovery.scanId } : batchStore.snapshot,
      batchCandidateCount: batchRecovery
        ? Math.max(0, (batchRecovery.targets || []).length - (batchRecovery.completedIds || []).length)
        : batchStore.candidates.length
    })
  }
  const configurationCheck = collectConfiguration()
  if (!configurationGuideBypass && !configurationCheck.ok) {
    return runWithConfigurationGuide({
      moduleId: CONFIGURATION_MODULES.items,
      actionId: CONFIGURATION_ACTIONS.start,
      title: '完成物品制作配置',
      actionLabel: '开始制作',
      collect: collectConfiguration,
      execute: () => startCrafting({
        craftingKind,
        forceInitialCheck,
        usageSessionId,
        continueCurrencyUsage,
        configurationGuideBypass: true,
        singleItemOnly,
        batchRecovery
      })
    })
  }

  // 验证配置
  const validation = validateCraftingConfig({
    itemPosition: effectiveItemPosition,
    inventory: settingsStore.inventory,
    currencyPositions: settingsStore.currencyPositions,
    stashTabSelection: settingsStore.stashTabSelection,
    preset: effectivePreset,
    batchSnapshot: batchRecovery ? { scanId: batchRecovery.scanId } : batchStore.snapshot,
    batchCandidateCount: batchRecovery
      ? Math.max(0, (batchRecovery.targets || []).length - (batchRecovery.completedIds || []).length)
      : batchStore.candidates.length
  })

  if (!validation.isValid) {
    const error = validation.errors[0]
    ElMessage.error(error)
    return { success: false, error }
  }

  const stashValidation = validateStashTabSelection(settingsStore.stashTabSelection)
  if (!stashValidation.valid) {
    const error = stashValidation.error
    ElMessage.error(error)
    return { success: false, error }
  }

  try {
    await refreshDpiForAutomation(settingsStore)
    // 获取文件路径
    const filePaths = await electronApi.file.getPaths()

    // 生成脚本内容
    const scriptContent = generatePythonScript({
        globalShortcuts: settingsStore.globalShortcuts,
        currencyPositions: settingsStore.currencyPositions,
        operationDelayMs: settingsStore.operationDelayMs,
        fixedTiming: settingsStore.fixedTiming,
        itemPosition: effectiveItemPosition,
      dpiScale: settingsStore.dpiScale,
      stashTabSelection: stashValidation.config,
      preset: effectivePreset,
      batchConfig,
      filePaths
    })

    // Pinia 的数据是 Proxy，需要转换为普通对象才能通过 IPC 传递
    const plainPreset = effectivePreset
    const requestedUsageSessionId = batchRecovery?.usageSessionId || usageSessionId || globalThis.crypto.randomUUID()
    if (batchConfig) scriptStore.beginBatch(batchConfig, requestedUsageSessionId)

    // 生成并执行脚本
    const result = await electronApi.script.generateAndExecute({
      scriptContent,
      preset: plainPreset,
      mode: 'items',
      craftingKind,
      usageSessionId: requestedUsageSessionId,
      continueCurrencyUsage,
      batchRecoveryContext: batchConfig,
      requiresStashTabOcr: stashValidation.config.enabled
    })

    if (isSuccessfulScriptStart(result)) {
      scriptStore.applyStatus({ status: 'running', ...result })
      ElMessage.success('脚本执行成功')
      void reportDiagnosticRecovery('items', 'script_start')
      return { ...result, success: true, craftingKind }
    } else {
      const error = result?.error || '后台进程未返回有效进程标识'
      ElMessage.error('脚本执行失败: ' + error)
      void reportDiagnosticFailure('items', 'script_start', result, 'process_start_failed')
      return { ...(result || {}), success: false, error }
    }
  } catch (error) {
    ElMessage.error('启动制作失败: ' + error.message)
    void reportDiagnosticFailure('items', 'script_start', error, 'process_start_failed')
    return { success: false, error: error.message || String(error) }
  }
}

/**
 * 开始地图洗练
 */
export async function startMapRolling({
  recovery = null,
  usageSessionId = null,
  continueCurrencyUsage = false,
  configurationGuideBypass = false
} = {}) {
  const scriptStore = useScriptStore()
  const presetStore = usePresetStore()
  const settingsStore = useSettingsStore()

  // 检查是否已有脚本在运行
  const status = await electronApi.script.getStatus()
  scriptStore.applyStatus(status)
  if (status.isRunning) {
    const error = '脚本已在运行中'
    ElMessage.warning(error)
    return { success: false, error }
  }

  // 获取当前预设和配置
  const targetKind = presetStore.mapRollingKind
  const currentPreset = targetKind === 'heist' ? presetStore.currentHeistPreset : targetKind === 'chart'
    ? presetStore.currentChartPreset
    : presetStore.currentMapPreset
  const storedMapConfig = targetKind === 'heist' ? currentPreset.heist : targetKind === 'chart'
    ? currentPreset.chart
    : currentPreset.map

  const mapConfig = storedMapConfig
    ? getActiveMapRollingConfig(
      targetKind === 'chart' ? {} : storedMapConfig,
      targetKind === 'chart' ? storedMapConfig : null,
      targetKind
    )
    : null

  const collectConfiguration = () => {
    const latestPresets = usePresetStore()
    const latestSettings = useSettingsStore()
    const latestKind = latestPresets.mapRollingKind
    const latestPreset = latestKind === 'heist' ? latestPresets.currentHeistPreset : latestKind === 'chart'
      ? latestPresets.currentChartPreset
      : latestPresets.currentMapPreset
    const latestStored = latestKind === 'heist' ? latestPreset.heist : latestKind === 'chart' ? latestPreset.chart : latestPreset.map
    const latestMapConfig = latestStored
      ? getActiveMapRollingConfig(
        latestKind === 'chart' ? {} : latestStored,
        latestKind === 'chart' ? latestStored : null,
        latestKind
      )
      : null
    return collectMapConfigurationIssues({
      inventory: latestSettings.inventory,
      currencyPositions: latestSettings.currencyPositions,
      stashTabSelection: latestSettings.stashTabSelection,
      mapConfig: latestMapConfig
    })
  }
  const configurationCheck = collectConfiguration()
  if (!configurationGuideBypass && !configurationCheck.ok) {
    return runWithConfigurationGuide({
      moduleId: CONFIGURATION_MODULES.map,
      actionId: CONFIGURATION_ACTIONS.start,
      title: targetKind === 'heist' ? '完成契约蓝图配置' : targetKind === 'chart' ? '完成航海海图配置' : '完成地图制作配置',
      actionLabel: '开始制作',
      collect: collectConfiguration,
      execute: () => startMapRolling({
        recovery,
        usageSessionId,
        continueCurrencyUsage,
        configurationGuideBypass: true
      })
    })
  }
  if (!mapConfig) {
    const error = '当前预设未包含地图配置'
    ElMessage.error(error)
    return { success: false, error }
  }

  // 验证背包首格坐标（从全局设置中读取）
  const validation = validateMapRollingConfig({
    inventory: settingsStore.inventory,
    currencyPositions: settingsStore.currencyPositions,
    mapConfig
  })

  if (!validation.isValid) {
    const error = validation.errors[0]
    ElMessage.error(error)
    return { success: false, error }
  }

  const stashValidation = validateStashTabSelection(settingsStore.stashTabSelection)
  if (!stashValidation.valid) {
    const error = stashValidation.error
    ElMessage.error(error)
    return { success: false, error }
  }

  const recoveryValidation = validateMapRecovery(recovery, {
    targetKind,
    rows: mapConfig.grid?.rows || 5,
    cols: mapConfig.grid?.cols || 12
  })
  if (!recoveryValidation.valid) {
    ElMessage.error(recoveryValidation.error)
    return { success: false, error: recoveryValidation.error }
  }

  try {
    await refreshDpiForAutomation(settingsStore)
    // 获取文件路径
    const filePaths = await electronApi.file.getPaths()

    // 生成脚本内容
    const scriptContent = generateMapRollingScript({
      globalShortcuts: settingsStore.globalShortcuts,
        currencyPositions: settingsStore.currencyPositions,
        inventory: settingsStore.inventory,
        operationDelayMs: settingsStore.operationDelayMs,
        fixedTiming: settingsStore.fixedTiming,
        mapConfig: mapConfig,
      recovery: recoveryValidation.value,
      dpiScale: settingsStore.dpiScale,
      stashTabSelection: stashValidation.config,
      filePaths
    })

    // Pinia 的数据是 Proxy，需要转换为普通对象才能通过 IPC 传递
    const plainPreset = JSON.parse(JSON.stringify({
      id: currentPreset.id,
      name: currentPreset.name,
      map: mapConfig
    }))
    const requestedUsageSessionId = usageSessionId || globalThis.crypto.randomUUID()

    // 生成并执行脚本
    const result = await electronApi.script.generateAndExecute({
      scriptContent,
      preset: plainPreset,
      mode: 'map',
      usageSessionId: requestedUsageSessionId,
      continueCurrencyUsage,
      requiresStashTabOcr: stashValidation.config.enabled
    })

    if (isSuccessfulScriptStart(result)) {
      scriptStore.applyStatus({ status: 'running', ...result })
      ElMessage.success('地图洗练脚本执行成功')
      void reportDiagnosticRecovery('map', 'script_start')
      return { ...result, success: true }
    } else {
      const error = result?.error || '后台进程未返回有效进程标识'
      ElMessage.error('脚本执行失败: ' + error)
      void reportDiagnosticFailure('map', 'script_start', result, 'process_start_failed')
      return { ...(result || {}), success: false, error }
    }
  } catch (error) {
    ElMessage.error('启动制作失败: ' + error.message)
    void reportDiagnosticFailure('map', 'script_start', error, 'process_start_failed')
    return { success: false, error: error.message || String(error) }
  }
}

/**
 * 停止制作
 */
export async function stopCrafting() {
  const scriptStore = useScriptStore()

  try {
    const atlasStatus = await electronApi.puzzle.getAutoPlacementStatus?.()
    if (['validating', 'running'].includes(atlasStatus?.status)) {
      await electronApi.puzzle.stopAutoPlacement('shortcut')
    }
    const result = await electronApi.script.stop()
    if (result.success) {
      scriptStore.reset()
      await electronApi.file.watcher.stop()
      ElMessage.success('脚本已停止')
    }
  } catch (error) {
    ElMessage.error('停止脚本失败: ' + error.message)
  }
}

/**
 * 更新快捷键注册
 */
export async function updateShortcuts(candidateShortcuts = null) {
  const settingsStore = useSettingsStore()
  const shortcuts = normalizeGlobalShortcutSettings(candidateShortcuts || settingsStore.globalShortcuts)

  const validation = validateShortcuts(shortcuts, { requiredKeys: ['end'] })
  if (!validation.isValid) throw new Error(validation.error)

  // 从设置中重新初始化快捷键
  const featureStore = useFeatureModulesStore()
  const registeredShortcuts = filterFeatureShortcuts(shortcuts, id => featureStore.isEnabled(id))
  if (!usePriceCheckStore().settings.enabled) delete registeredShortcuts.priceCheck
  const result = await electronApi.shortcut.initFromSettings(registeredShortcuts)
  if (!result?.success) {
    const names = formatShortcutError(result)
    settingsStore.updateShortcutHealth({ ...result, error: `注册失败：${names}` })
    throw new Error(`全局快捷键注册失败：${names}`)
  }
  settingsStore.updateShortcutHealth(result)
  return result
}

export async function commitGlobalShortcut(key, value) {
  const settingsStore = useSettingsStore()
  const previous = normalizeGlobalShortcutSettings(settingsStore.globalShortcuts)
  const candidate = normalizeGlobalShortcutSettings({ ...settingsStore.globalShortcuts, [key]: value })
  await updateShortcuts(candidate)
  settingsStore.updateGlobalShortcuts({ [key]: candidate[key] })
  try {
    if (key === 'priceCheck' && useFeatureModulesStore().isEnabled('price-check')) {
      await usePriceCheckStore().syncRuntime({ shortcut: candidate[key] })
    }
  } catch (error) {
    settingsStore.updateGlobalShortcuts({ [key]: previous[key] })
    try {
      await updateShortcuts(previous)
      if (useFeatureModulesStore().isEnabled('price-check')) {
        await usePriceCheckStore().syncRuntime({ shortcut: previous[key] })
      }
    } catch (rollbackError) {
      throw new Error(`${error.message}；恢复原快捷键失败：${rollbackError.message}`, { cause: error })
    }
    throw error
  }
  return candidate[key]
}
