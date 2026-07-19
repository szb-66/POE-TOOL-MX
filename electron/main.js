/**
 * Purpose: Electron 主进程入口，负责窗口创建、模块依赖注册、生命周期清理与全局快捷键。
 * Inputs: Electron app 生命周期事件；渲染进程通过 IPC 调用暴露的模块方法。
 * Outputs: 创建/管理主窗口；注册 IPC 处理器；注册/注销全局快捷键；清理子进程与监控资源。
 * Preconditions: app.whenReady 触发后再创建窗口；各子模块可安全初始化（Python 环境探测、文件监听等）。
 * Edge cases: 多实例由外层配置处理；快捷键注册失败当前未兜底（TODO 可加入失败日志）。
 */
import { app, BrowserWindow, Menu, globalShortcut } from 'electron'
import { createMainWindow, getMainWindow, toggleDevTools } from './modules/window/manager.js'
import { registerIpcHandlers } from './modules/ipc/index.js'

// 导入各模块
import * as windowManager from './modules/window/manager.js'
import * as pythonManager from './modules/python/process.js'
import * as pythonDetector from './modules/python/detector.js'
import { fileWatcher } from './modules/watcher/fileWatcher.js'
import * as itemParser from './modules/item/parser.js'
import * as itemMatcher from './modules/item/matcher.js'
import * as shortcutManager from './modules/shortcuts/manager.js'
import { cleanupCombatProcesses } from './modules/ipc/combat.js'

// 降低 Chromium 底层噪声日志，避免 Windows 网络变更监听告警干扰排查
app.commandLine.appendSwitch('log-level', '3')

// Purpose: 组合主进程可暴露的能力并注册 IPC，渲染端通过约定频道访问
registerIpcHandlers({
  window: windowManager,
  python: { ...pythonManager, ...pythonDetector },
  fileWatcher,
  itemParser,
  itemMatcher,
  shortcut: shortcutManager
})

// 生命周期管理：ready 后创建窗口与快捷键，退出前清理
app.whenReady().then(() => {
  // 禁用菜单栏，保持无干扰窗口
  Menu.setApplicationMenu(null)
  
  createMainWindow()

  // 等待窗口加载完成后再通知渲染进程初始化快捷键，避免渲染端尚未准备好
  const mainWindow = getMainWindow()
  if (mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      // 渲染进程再行注册本地快捷键映射
      if (mainWindow) {
        mainWindow.webContents.send('init-shortcuts')
      }
    })
  }

  // 注册全局快捷键打开/关闭开发者工具（F12 与 Ctrl/Cmd+Shift+I）
  globalShortcut.register('F12', () => {
    toggleDevTools()
  })

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    toggleDevTools()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

// 应用退出前终止所有进程
app.on('before-quit', async (event) => {
  // 防止重复退出处理
  if (app.isQuitting) return
  app.isQuitting = true
  
  // 清理资源（调用各模块的清理方法）；若失败当前策略为上抛退出
  await cleanupCombatProcesses()
  await pythonManager.cleanup()
  fileWatcher.stopFileWatcher()
  shortcutManager.unregisterAll()
  windowManager.closeOverlayWindow()
  windowManager.cancelCoordinatePicker()
  
  // 如果被阻止了，现在重新调用退出
  if (event.defaultPrevented) {
    app.exit()
  }
})

// 应用退出时注销所有全局快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  shortcutManager.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
