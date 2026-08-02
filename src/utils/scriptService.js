/**
 * Purpose: 脚本执行服务，负责快捷键注册、脚本生成和执行
 * Inputs: 配置对象、预设数据
 * Outputs: 执行结果、状态更新
 * Preconditions: Electron 环境已初始化，设置已加载
 * Edge cases: 快捷键注册失败时提示用户；脚本执行失败时清理状态
 * Errors: 执行失败时显示错误消息，不抛出异常
 */

import { generatePythonScript, generateMapRollingScript } from './python.js'
import { validateCraftingConfig, validateMapRollingConfig } from './validation.js'
import { electronApi } from '../api/electron.js'
import { usePresetStore } from '../stores/preset'
import { useSettingsStore } from '../domains/settings/settingsStore'
import { useScriptStore } from '../stores/script'
import { ElMessage } from 'element-plus'
import { executePortalAssist, startPotionAssist, stopPotionAssist } from './combatService.js'
import { useStoryStore } from '../stores/story'
import { validateShortcuts } from './shortcutValidator.js'
import { dispatchShortcutAction } from './shortcutConfig.js'
import { isSuccessfulScriptStart } from './scriptStartResult.js'
import {
  startChaosRecipePicking,
  stopChaosRecipePicking,
  toggleChaosRecipePicking
} from './chaosRecipeService.js'
import { usePriceCheckStore } from '../stores/priceCheck'
import { validateStashTabSelection } from './stashTabSelection.js'
import { usePuzzleStore } from '../stores/puzzle.js'

// 监听器注册标志
let shortcutListenerRegistered = false
let pythonOutputListenerRegistered = false
let scriptStatusListenerRegistered = false

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
  const shortcuts = settingsStore.globalShortcuts
  const registeredShortcuts = { ...shortcuts }
  if (!usePriceCheckStore().settings.enabled) delete registeredShortcuts.priceCheck

  // 从设置中初始化快捷键
  try {
    const result = await electronApi.shortcut.initFromSettings(registeredShortcuts)
    if (!result?.success) {
      const names = formatShortcutError(result)
      settingsStore.updateShortcutHealth({ ...result, error: `注册失败：${names}` })
      ElMessage.error(`全局快捷键注册失败：${names}`)
    } else {
      settingsStore.updateShortcutHealth(result)
    }
  } catch (err) {
    settingsStore.updateShortcutHealth({ success: false, error: err.message })
    ElMessage.error(`全局快捷键初始化失败：${err.message}`)
  }

  // 监听快捷键触发事件
  if (!shortcutListenerRegistered) {
    electronApi.shortcut.onTriggered((accelerator) => {
      dispatchShortcutAction(accelerator, {
        itemStart: startCrafting,
        mapStart: startMapRolling,
        end: stopCrafting,
        potionStart: startPotionAssist,
        potionStop: stopPotionAssist,
        portal: executePortalAssist,
        storyPrevious: () => useStoryStore().previous(),
        storyNext: () => useStoryStore().next(),
        chaosRecipeStart: startChaosRecipePicking,
        chaosRecipePause: toggleChaosRecipePicking,
        chaosRecipeStop: stopChaosRecipePicking,
        puzzleAnalyze: startPuzzleAnalysis,
        priceCheck: startPriceCheck
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
  if (!result?.success && result?.error) ElMessage.error(result.error.message)
}

/**
 * 开始制作
 */
export async function startCrafting() {
  const scriptStore = useScriptStore()
  const presetStore = usePresetStore()
  const settingsStore = useSettingsStore()

  // 检查是否已有脚本在运行
  const status = await electronApi.script.getStatus()
  scriptStore.applyStatus(status)
  if (status.isRunning) {
    ElMessage.warning('脚本已在运行中')
    return
  }

  // 检查是否有启用的模块
  const currentPreset = presetStore.currentItemPreset

  // 验证配置
  const validation = validateCraftingConfig({
    itemPosition: settingsStore.itemPosition,
    currencyPositions: settingsStore.currencyPositions,
    preset: currentPreset
  })

  if (!validation.isValid) {
    ElMessage.error(validation.errors[0])
    return
  }

  const stashValidation = validateStashTabSelection(settingsStore.stashTabSelection)
  if (!stashValidation.valid) {
    ElMessage.error(stashValidation.error)
    return
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
      itemPosition: settingsStore.itemPosition,
      dpiScale: settingsStore.dpiScale,
      stashTabSelection: stashValidation.config,
      preset: currentPreset,
      filePaths
    })

    // Pinia 的数据是 Proxy，需要转换为普通对象才能通过 IPC 传递
    const plainPreset = JSON.parse(JSON.stringify(currentPreset))

    // 生成并执行脚本
    const result = await electronApi.script.generateAndExecute({
      scriptContent,
      preset: plainPreset,
      mode: 'items',
      requiresStashTabOcr: stashValidation.config.enabled
    })

    if (isSuccessfulScriptStart(result)) {
      scriptStore.applyStatus({ status: 'running', ...result })
      ElMessage.success('脚本执行成功')
    } else {
      ElMessage.error('脚本执行失败: ' + (result?.error || '后台进程未返回有效进程标识'))
    }
  } catch (error) {
    ElMessage.error('启动制作失败: ' + error.message)
  }
}

/**
 * 开始地图洗练
 */
export async function startMapRolling() {
  const scriptStore = useScriptStore()
  const presetStore = usePresetStore()
  const settingsStore = useSettingsStore()

  // 检查是否已有脚本在运行
  const status = await electronApi.script.getStatus()
  scriptStore.applyStatus(status)
  if (status.isRunning) {
    ElMessage.warning('脚本已在运行中')
    return
  }

  // 获取当前预设和配置
  const currentPreset = presetStore.currentMapPreset
  const mapConfig = currentPreset.map

  if (!mapConfig) {
    ElMessage.error('当前预设未包含地图配置')
    return
  }

  // 验证背包首格坐标（从全局设置中读取）
  const validation = validateMapRollingConfig({
    inventory: settingsStore.inventory,
    currencyPositions: settingsStore.currencyPositions,
    mapConfig
  })

  if (!validation.isValid) {
    ElMessage.error(validation.errors[0])
    return
  }

  const stashValidation = validateStashTabSelection(settingsStore.stashTabSelection)
  if (!stashValidation.valid) {
    ElMessage.error(stashValidation.error)
    return
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
      mapConfig: mapConfig,
      dpiScale: settingsStore.dpiScale,
      stashTabSelection: stashValidation.config,
      filePaths
    })

    // Pinia 的数据是 Proxy，需要转换为普通对象才能通过 IPC 传递
    const plainPreset = JSON.parse(JSON.stringify(currentPreset))

    // 生成并执行脚本
    const result = await electronApi.script.generateAndExecute({
      scriptContent,
      preset: plainPreset,
      mode: 'map',
      requiresStashTabOcr: stashValidation.config.enabled
    })

    if (isSuccessfulScriptStart(result)) {
      scriptStore.applyStatus({ status: 'running', ...result })
      ElMessage.success('地图洗练脚本执行成功')
    } else {
      ElMessage.error('脚本执行失败: ' + (result?.error || '后台进程未返回有效进程标识'))
    }
  } catch (error) {
    ElMessage.error('启动制作失败: ' + error.message)
  }
}

/**
 * 停止制作
 */
export async function stopCrafting() {
  const scriptStore = useScriptStore()

  try {
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
  const shortcuts = candidateShortcuts || settingsStore.globalShortcuts

  const validation = validateShortcuts(shortcuts)
  if (!validation.isValid) throw new Error(validation.error)

  // 从设置中重新初始化快捷键
  const registeredShortcuts = { ...shortcuts }
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
  const candidate = { ...settingsStore.globalShortcuts, [key]: value }
  await updateShortcuts(candidate)
  settingsStore.updateGlobalShortcuts({ [key]: value })
  return value
}
