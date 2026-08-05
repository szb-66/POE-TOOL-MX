/**
 * Purpose: 注册全局快捷键相关的 IPC 处理器，支持前台作用域门禁
 * Inputs: shortcut (object) - 快捷键管理模块，window (object) - 窗口管理模块
 * Outputs: 注册 IPC 处理器和事件监听器，无返回值
 * Preconditions: 窗口已创建
 * Edge cases: 快捷键注册失败时返回失败状态；门禁开启且游戏未在前台时延迟注册；窗口不存在时静默处理
 * Errors: 快捷键注册失败时返回错误状态，不抛出异常
 */

import { ipcMain } from 'electron'

export function registerShortcutHandlers(shortcut, window) {
  const {
    registerConfiguredShortcut,
    unregisterConfiguredShortcut,
    setConfiguredShortcuts,
    setScopeEnabled,
    getScopeState,
    getRegisteredShortcuts,
    registerGlobalShortcut,
    unregisterGlobalShortcut
  } = shortcut
  const { getMainWindow } = window
  let suspendedShortcuts = null

  const sendTriggered = (key) => {
    const mainWindow = getMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('shortcut-triggered', key)
    }
  }

  // IPC: 注册全局快捷键
  ipcMain.handle('register-global-shortcut', async (event, accelerator, callbackId) => {
    const key = callbackId || accelerator
    const result = registerConfiguredShortcut(accelerator, key, () => sendTriggered(key))
    return { success: result.success, deferred: Boolean(result.deferred), error: result.error || '' }
  })

  // IPC: 注销全局快捷键
  ipcMain.handle('unregister-global-shortcut', async (event, accelerator) => {
    const result = unregisterConfiguredShortcut(accelerator)
    return { success: result.success }
  })

  // IPC: 初始化快捷键（从设置中读取）
  ipcMain.handle('init-shortcuts-from-settings', async (event, shortcuts) => {
    const entries = Object.entries(shortcuts || {})
      .filter(([, accelerator]) => Boolean(accelerator))
      .map(([key, accelerator]) => ({ key, accelerator, callback: () => sendTriggered(key) }))
    const result = setConfiguredShortcuts(entries)
    return {
      success: result.success,
      failed: result.failed,
      deferred: result.deferred,
      rolledBack: result.failed.length > 0
    }
  })

  // IPC: 切换“仅在游戏窗口前台生效”开关
  ipcMain.handle('shortcut-set-scope-enabled', (event, enabled) => {
    const result = setScopeEnabled(enabled)
    return { success: result.success, failed: result.failed, ...getScopeState() }
  })

  // IPC: 查询当前快捷键门禁状态
  ipcMain.handle('shortcut-get-scope-state', () => {
    return getScopeState()
  })

  ipcMain.handle('begin-shortcut-capture', () => {
    if (suspendedShortcuts) return { success: true }
    suspendedShortcuts = new Map(shortcut.getRegisteredShortcuts())
    suspendedShortcuts.forEach((_callback, accelerator) => unregisterGlobalShortcut(accelerator))
    return { success: true }
  })

  ipcMain.handle('end-shortcut-capture', () => {
    if (!suspendedShortcuts) return { success: true, failed: [] }
    const failed = []
    suspendedShortcuts.forEach((callback, accelerator) => {
      if (!registerGlobalShortcut(accelerator, callback)) failed.push(accelerator)
    })
    suspendedShortcuts = null
    return { success: failed.length === 0, failed }
  })

  // 监听快捷键触发事件
  ipcMain.on('shortcut-triggered', async (event, accelerator) => {
    const mainWindow = getMainWindow()
    // 处理快捷键触发
    if (accelerator === 'itemStart') {
      // 触发物品制作
      if (mainWindow) {
        mainWindow.webContents.send('start-item-crafting')
      }
    } else if (accelerator === 'mapStart') {
      // 触发地图制作
      if (mainWindow) {
        mainWindow.webContents.send('start-map-rolling')
      }
    } else if (accelerator === 'end') {
      // 停止脚本 - 这个逻辑在 python.js 中处理
      if (mainWindow) {
        mainWindow.webContents.send('stop-script-request')
      }
    }
  })
}

