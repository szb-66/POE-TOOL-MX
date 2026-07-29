/**
 * Purpose: Electron 主进程入口，负责窗口创建、模块依赖注册、生命周期清理与全局快捷键。
 * Inputs: Electron app 生命周期事件；渲染进程通过 IPC 调用暴露的模块方法。
 * Outputs: 创建/管理主窗口；注册 IPC 处理器；注册/注销全局快捷键；清理子进程与监控资源。
 * Preconditions: app.whenReady 触发后再创建窗口；各子模块可安全初始化（Python 环境探测、文件监听等）。
 * Edge cases: 同一可执行程序使用 Electron 锁，不同开发/打包可执行程序使用命名管道锁；快捷键注册失败当前未兜底。
 */
import { app, BrowserWindow, Menu, clipboard, globalShortcut, protocol, net, shell, session } from 'electron'
import path from 'node:path'
import { createMainWindow, getMainWindow, toggleDevTools } from './modules/window/manager.js'
import { installExternalLinkPolicy } from './modules/window/externalLinks.js'
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
import { cleanupBagProcesses } from './modules/ipc/bag.js'
import { CraftingService } from './modules/crafting/service.js'
import { resolveUserDataPath } from './modules/storage/userDataPath.js'
import { PoeCnAuthService } from './modules/chaosRecipe/auth.js'
import { PoeCnStashClient } from './modules/chaosRecipe/stashClient.js'
import { ChaosRecipeService } from './modules/chaosRecipe/service.js'
import { ChaosRecipeOverlayManager } from './modules/chaosRecipe/overlay.js'
import { ChaosRecipeAutomationManager } from './modules/chaosRecipe/automation.js'
import { InterfaceDetectionCoordinator } from './modules/interfaceDetection/coordinator.js'
import { AutomationLock } from './modules/automation/lock.js'
import { ChaosRecipeControlOverlay } from './modules/chaosRecipe/controlOverlay.js'
import { createShutdownController } from './modules/lifecycle/shutdown.js'
import { acquireCrossProcessInstanceLock } from './modules/app/singleInstance.js'
import { createOfficialTradeCatalog, loadTradeCatalog } from './modules/priceCheck/catalog.js'
import { PoeCnTradeClient } from './modules/priceCheck/client.js'
import { PriceCheckService } from './modules/priceCheck/service.js'
import { PriceCheckOverlayManager } from './modules/priceCheck/overlay.js'
import { capturePoeItemText, sendWindowsCopy } from './modules/priceCheck/clipboardCapture.js'

// 降低 Chromium 底层噪声日志，避免 Windows 网络变更监听告警干扰排查
app.commandLine.appendSwitch('log-level', '3')
protocol.registerSchemesAsPrivileged([{ scheme: 'crafting-image', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }])

app.setPath('userData', resolveUserDataPath(app.getPath('appData')))
const hasSingleInstanceLock = app.requestSingleInstanceLock()
if (!hasSingleInstanceLock) process.exit(0)

function showExistingMainWindow() {
  const existingWindow = getMainWindow()
  if (!existingWindow || existingWindow.isDestroyed()) return
  if (existingWindow.isMinimized()) existingWindow.restore()
  existingWindow.show()
  existingWindow.focus()
}

app.on('second-instance', showExistingMainWindow)

let craftingService = null
let chaosRecipeService = null
let poeCnSession = null
let interfaceDetection = null
let automationLock = null
let chaosControlOverlay = null
let priceCheckService = null
let crossProcessInstanceLock = null

async function settleCleanupPhase(operations, errors) {
  const results = await Promise.allSettled(
    operations.map(operation => Promise.resolve().then(operation))
  )
  for (const result of results) {
    if (result.status === 'rejected') errors.push(result.reason)
  }
}

async function cleanupApplicationResources() {
  const errors = []

  await settleCleanupPhase([
    () => chaosRecipeService?.automation?.cleanup(),
    () => chaosRecipeService?.overlay?.close(),
    () => chaosControlOverlay?.cleanup(),
    () => priceCheckService?.closeOverlay(),
    () => interfaceDetection?.cleanup(),
    () => craftingService?.cleanup(),
    async () => {
      await crossProcessInstanceLock?.release?.()
      crossProcessInstanceLock = null
    }
  ], errors)

  await settleCleanupPhase([
    async () => {
      await cleanupCombatProcesses()
    },
    cleanupBagProcesses,
    pythonManager.cleanup,
    () => fileWatcher.stopFileWatcher(),
    () => shortcutManager.unregisterAll(),
    () => globalShortcut.unregisterAll()
  ], errors)

  await settleCleanupPhase([
    () => windowManager.cancelCoordinatePicker(),
    () => windowManager.closeOverlayWindow(),
    () => windowManager.closeStoryOverlayWindow(),
    () => windowManager.closeBagStashOverlayWindow(),
    () => windowManager.closeDebugWindow()
  ], errors)

  const mainWindow = getMainWindow()
  const auxiliaryWindows = BrowserWindow.getAllWindows()
    .filter(window => window !== mainWindow && !window.isDestroyed())
  await settleCleanupPhase(
    auxiliaryWindows.map(window => () => window.destroy()),
    errors
  )

  if (errors.length) {
    throw new AggregateError(errors, '一个或多个应用资源清理失败')
  }
}

const shutdownController = createShutdownController({
  app,
  cleanup: cleanupApplicationResources
})

function createApplicationWindow() {
  const window = createMainWindow()
  window.on('close', shutdownController.handleMainWindowClose)
  return window
}

// 生命周期管理：ready 后创建窗口与快捷键，退出前清理
app.whenReady().then(async () => {
  if (!hasSingleInstanceLock) return
  crossProcessInstanceLock = await acquireCrossProcessInstanceLock({
    onSecondInstance: showExistingMainWindow
  })
  if (!crossProcessInstanceLock.acquired) {
    process.exit(0)
    return
  }
  // 禁用菜单栏，保持无干扰窗口
  Menu.setApplicationMenu(null)

  poeCnSession = session.fromPartition('persist:poe-cn-auth')

  craftingService = new CraftingService({
    storageRoot: path.join(app.getPath('userData'), 'crafting'),
    protocol,
    net
  })
  await craftingService.initialize()
  craftingService.registerImageProtocol()

  const chaosOverlay = new ChaosRecipeOverlayManager()
  automationLock = new AutomationLock()
  interfaceDetection = new InterfaceDetectionCoordinator({
    python: { ...pythonManager, ...pythonDetector },
    fileWatcher
  })
  const chaosAuth = new PoeCnAuthService({
    session: poeCnSession,
    BrowserWindow,
    parentWindow: getMainWindow
  })
  const chaosStashClient = new PoeCnStashClient({
    session: poeCnSession,
    getAuthStatus: () => chaosAuth.getStatus()
  })
  const chaosAutomation = new ChaosRecipeAutomationManager({
    python: { ...pythonManager, ...pythonDetector },
    fileWatcher,
    getMainWindow,
    overlay: chaosOverlay,
    onItemPicked: (itemId) => chaosRecipeService?.consumeItem(itemId),
    automationLock,
    onStatusChange: () => chaosControlOverlay?.sync()
  })
  chaosRecipeService = new ChaosRecipeService({
    auth: chaosAuth,
    stashClient: chaosStashClient,
    automation: chaosAutomation,
    overlay: chaosOverlay
  })
  chaosControlOverlay = new ChaosRecipeControlOverlay({
    getMainWindow,
    interfaceDetection,
    automationLock
  })
  chaosControlOverlay.attachService(chaosRecipeService)
  chaosRecipeService.control = chaosControlOverlay
  await chaosRecipeService.restoreAuth()
  const priceCheckClient = new PoeCnTradeClient({ session: poeCnSession })
  let tradeCatalogBundle = await loadTradeCatalog()
  try {
    tradeCatalogBundle = createOfficialTradeCatalog(tradeCatalogBundle.catalog, await priceCheckClient.getStats())
  } catch (error) {
    tradeCatalogBundle.status = {
      ...tradeCatalogBundle.status,
      provider: 'bundled',
      degraded: true,
      warning: `腾讯官方词缀目录不可用，已使用内置目录：${error.message}`
    }
  }
  const priceCheckOverlay = new PriceCheckOverlayManager()
  priceCheckService = new PriceCheckService({
    auth: chaosAuth,
    client: priceCheckClient,
    catalog: tradeCatalogBundle.catalog,
    catalogStatus: tradeCatalogBundle.status,
    overlay: priceCheckOverlay,
    shell,
    captureClipboard: () => capturePoeItemText({
      clipboard,
      sendCopy: (options) => sendWindowsCopy(pythonDetector.detectPythonPath(), options)
    })
  })

  // Purpose: 组合主进程可暴露的能力并注册 IPC，渲染端通过约定频道访问
  registerIpcHandlers({
    window: windowManager,
    python: { ...pythonManager, ...pythonDetector },
    fileWatcher,
    itemParser,
    itemMatcher,
    shortcut: shortcutManager,
    crafting: craftingService,
    chaosRecipe: chaosRecipeService,
    priceCheck: priceCheckService,
    poeCnAccount: {
      auth: chaosAuth,
      listLeagues: () => chaosStashClient.listLeagues()
    },
    interfaceDetection,
    automationLock
  })
  
  createApplicationWindow()

  // 等待窗口加载完成后再通知渲染进程初始化快捷键，避免渲染端尚未准备好
  const mainWindow = getMainWindow()
  if (mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      // 只给主应用页面安装外链策略。国服登录窗必须留在独立 Session 内导航。
      installExternalLinkPolicy(mainWindow.webContents, (url) => shell.openExternal(url))
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
      createApplicationWindow()
    }
  })
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
