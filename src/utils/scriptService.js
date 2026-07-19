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

// 监听器注册标志
let shortcutListenerRegistered = false
let pythonOutputListenerRegistered = false

/**
 * 初始化快捷键注册
 */
export async function initShortcuts() {
  // 使用 electronApi 封装
  const settingsStore = useSettingsStore()
  const shortcuts = settingsStore.globalShortcuts

  // 从设置中初始化快捷键
  try {
    await electronApi.shortcut.initFromSettings({
      itemStart: shortcuts.itemStart,
      mapStart: shortcuts.mapStart,
      end: shortcuts.end
    })
  } catch (err) {
    // 快捷键注册失败
  }

  // 监听快捷键触发事件
  if (!shortcutListenerRegistered) {
    electronApi.shortcut.onTriggered((accelerator) => {
      if (accelerator === 'itemStart') {
        startCrafting()
      } else if (accelerator === 'mapStart') {
        startMapRolling()
      } else if (accelerator === 'end') {
        stopCrafting()
      }
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

  // 注意：快捷键更新应该在设置页面手动触发，避免频繁注册
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
    preset: currentPreset,
    delays: settingsStore.delays
  })

  if (!validation.isValid) {
    ElMessage.error(validation.errors[0])
    return
  }

  try {
    // 获取文件路径
    const filePaths = await electronApi.file.getPaths()

    // 生成脚本内容
    const scriptContent = generatePythonScript({
      globalShortcuts: settingsStore.globalShortcuts,
      currencyPositions: settingsStore.currencyPositions,
      delays: settingsStore.delays,
      itemPosition: settingsStore.itemPosition,
      dpiScale: settingsStore.dpiScale,
      preset: currentPreset,
      filePaths
    })

    // Pinia 的数据是 Proxy，需要转换为普通对象才能通过 IPC 传递
    const plainPreset = JSON.parse(JSON.stringify(currentPreset))

    // 生成并执行脚本
    const result = await electronApi.script.generateAndExecute({
      scriptContent,
      preset: plainPreset
    })

    if (result.success) {
      scriptStore.setRunning(true)
      scriptStore.setProcessId(result.processId)
      ElMessage.success('脚本执行成功')
    } else {
      ElMessage.error('脚本执行失败: ' + result.error)
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

  try {
    // 获取文件路径
    const filePaths = await electronApi.file.getPaths()

    // 生成脚本内容
    const scriptContent = generateMapRollingScript({
      globalShortcuts: settingsStore.globalShortcuts,
      currencyPositions: settingsStore.currencyPositions,
      inventory: settingsStore.inventory,
      delays: settingsStore.delays,
      mapConfig: mapConfig,
      dpiScale: settingsStore.dpiScale,
      filePaths
    })

    // Pinia 的数据是 Proxy，需要转换为普通对象才能通过 IPC 传递
    const plainPreset = JSON.parse(JSON.stringify(currentPreset))

    // 生成并执行脚本
    const result = await electronApi.script.generateAndExecute({
      scriptContent,
      preset: plainPreset
    })

    if (result.success) {
      scriptStore.setRunning(true)
      scriptStore.setProcessId(result.processId)
      ElMessage.success('地图洗练脚本执行成功')
    } else {
      ElMessage.error('脚本执行失败: ' + result.error)
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
export async function updateShortcuts() {
  const settingsStore = useSettingsStore()
  const shortcuts = settingsStore.globalShortcuts

  // 从设置中重新初始化快捷键
  await electronApi.shortcut.initFromSettings({
    itemStart: shortcuts.itemStart,
    mapStart: shortcuts.mapStart,
    end: shortcuts.end
  })
}
