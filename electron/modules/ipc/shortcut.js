/**
 * Purpose: 注册全局快捷键相关的 IPC 处理器
 * Inputs: shortcut (object) - 快捷键管理模块，window (object) - 窗口管理模块
 * Outputs: 注册 IPC 处理器和事件监听器，无返回值
 * Preconditions: 窗口已创建
 * Edge cases: 快捷键注册失败时返回失败状态；窗口不存在时静默处理
 * Errors: 快捷键注册失败时返回错误状态，不抛出异常
 */

import { ipcMain } from 'electron'

export function registerShortcutHandlers(shortcut, window) {
  const { registerGlobalShortcut, unregisterGlobalShortcut } = shortcut
  const { getMainWindow } = window

  // IPC: 注册全局快捷键
  ipcMain.handle('register-global-shortcut', async (event, accelerator, callbackId) => {
    // 注意：callbackId在Electron中不能直接传递函数，需要通过IPC通信
    // 这里我们使用callbackId作为key，实际回调在主进程中处理
    const success = registerGlobalShortcut(accelerator, () => {
      // 通知渲染进程快捷键被触发
      const mainWindow = getMainWindow()
      if (mainWindow) {
        mainWindow.webContents.send('shortcut-triggered', callbackId || accelerator)
      }
    })
    return { success }
  })

  // IPC: 注销全局快捷键
  ipcMain.handle('unregister-global-shortcut', async (event, accelerator) => {
    const success = unregisterGlobalShortcut(accelerator)
    return { success }
  })

  // IPC: 初始化快捷键（从设置中读取）
  ipcMain.handle('init-shortcuts-from-settings', async (event, shortcuts) => {
    const mainWindow = getMainWindow()

    // 注销所有已注册的快捷键
    const registeredShortcuts = shortcut.getRegisteredShortcuts()
    registeredShortcuts.forEach((callback, accelerator) => {
      unregisterGlobalShortcut(accelerator)
    })

    const failed = []
    for (const [key, accelerator] of Object.entries(shortcuts)) {
      if (!accelerator) continue
      const success = registerGlobalShortcut(accelerator, () => {
        if (mainWindow) mainWindow.webContents.send('shortcut-triggered', key)
      })
      if (!success) failed.push({ key, accelerator })
    }

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

