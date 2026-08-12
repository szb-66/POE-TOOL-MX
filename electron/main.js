/**
 * Purpose: Electron 主进程入口，负责窗口创建、模块依赖注册、生命周期清理与全局快捷键。
 * Inputs: Electron app 生命周期事件；渲染进程通过 IPC 调用暴露的模块方法。
 * Outputs: 创建/管理主窗口；注册 IPC 处理器；注册/注销全局快捷键；清理子进程与监控资源。
 * Preconditions: app.whenReady 触发后再创建窗口；各子模块可安全初始化（Python 环境探测、文件监听等）。
 * Edge cases: 同一可执行程序使用 Electron 锁，不同开发/打包可执行程序使用命名管道锁；快捷键注册失败当前未兜底。
 */
import { app, BrowserWindow, Menu, clipboard, crashReporter, dialog, globalShortcut, protocol, net, shell, session } from 'electron'
import electronUpdater from 'electron-updater'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMainWindow, getMainWindow, toggleDevTools } from './modules/window/manager.js'
import { installExternalLinkPolicy } from './modules/window/externalLinks.js'
import { registerIpcHandlers } from './modules/ipc/index.js'
import { startForegroundWatcher } from './modules/system/foregroundWatcher.js'

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
import {
  registerUniqueItemImageProtocol,
  UniqueItemImageRepository
} from './modules/priceCheck/uniqueItemSnapshot.js'
import { PoeCnTradeClient } from './modules/priceCheck/client.js'
import { PriceCheckService } from './modules/priceCheck/service.js'
import { PriceCheckOverlayManager } from './modules/priceCheck/overlay.js'
import {
  assertWindowsGameForeground,
  capturePoeItemText,
  sendWindowsCopy
} from './modules/priceCheck/clipboardCapture.js'
import { StashPickupManager } from './modules/stashPickup/manager.js'
import { JunfengHighlightManager } from './modules/junfeng/manager.js'
import { JunfengCalibrationRepository } from './modules/junfeng/calibrationRepository.js'
import { PuzzleAnalysisService } from './modules/puzzle/service.js'
import { PuzzleOverlayManager } from './modules/puzzle/overlay.js'
import { GameWindowTitleRegistry } from './modules/system/gameWindowTitles.js'
import { DiagnosticEventStore } from './modules/system/diagnosticEventStore.js'
import { createStartupLogger } from './modules/system/startupLog.js'
import { createCrashGuard } from './modules/system/crashGuard.js'
import { ApplicationUpdateService } from './modules/update/service.js'

// 降低 Chromium 底层噪声日志，避免 Windows 网络变更监听告警干扰排查
app.commandLine.appendSwitch('log-level', '3')
protocol.registerSchemesAsPrivileged([
  { scheme: 'crafting-image', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
  { scheme: 'price-check-image', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
])

const startupStartedAt = Date.now()
const startupSafeMode = process.argv.includes('--startup-safe-mode')
const developmentFaultEnabled = (argument) => (
  process.env.NODE_ENV === 'development' && process.argv.includes(argument)
)
let applicationShuttingDown = false
let startupFailureShown = false

function resolveApplicationVersion() {
  try {
    const mainModuleDirectory = path.dirname(fileURLToPath(import.meta.url))
    return JSON.parse(fs.readFileSync(path.resolve(mainModuleDirectory, '../package.json'), 'utf8')).version
  } catch {
    try {
      return JSON.parse(fs.readFileSync(path.join(app.getAppPath(), 'package.json'), 'utf8')).version
    } catch {
      return app.getVersion()
    }
  }
}

if (startupSafeMode) app.disableHardwareAcceleration()
app.setPath('userData', resolveUserDataPath(app.getPath('appData')))
const crashDumpsPath = path.join(app.getPath('userData'), 'crashes')
const startupLog = createStartupLogger({ userDataPath: app.getPath('userData') })
const applicationVersion = resolveApplicationVersion()
try {
  fs.mkdirSync(crashDumpsPath, { recursive: true })
  app.setPath('crashDumps', crashDumpsPath)
} catch (error) {
  startupLog.record({ phase: 'crashpad', outcome: 'warning', reasonCode: 'crash_directory_unavailable', error })
}
startupLog.record({
  phase: 'app-start', outcome: 'started', reasonCode: 'none',
  message: `version=${applicationVersion} electron=${process.versions.electron} platform=${process.platform} release=${os.release()} arch=${process.arch} safeMode=${startupSafeMode}`
})
try {
  crashReporter.start({
    productName: '流放助手',
    uploadToServer: false,
    globalExtra: { applicationVersion, startupSafeMode: String(startupSafeMode) }
  })
  startupLog.record({ phase: 'crashpad', outcome: 'succeeded', reasonCode: 'none' })
} catch (error) {
  startupLog.record({ phase: 'crashpad', outcome: 'failed', reasonCode: 'crashpad_start_failed', error })
}

function showStartupFailure({ reasonCode = 'startup_failed' } = {}) {
  if (startupFailureShown || applicationShuttingDown) return
  startupFailureShown = true
  startupLog.record({
    phase: 'startup-failure', outcome: 'failed', reasonCode,
    message: '已向用户显示本地诊断材料位置'
  })
  if (developmentFaultEnabled('--diagnostic-exit-on-unrecoverable')) {
    applicationShuttingDown = true
    app.exit(2)
    return
  }
  try {
    dialog.showErrorBox(
      '流放助手启动失败',
      `应用启动失败（${reasonCode}）。\n\n启动日志：${startupLog.filePath}\n崩溃转储：${crashDumpsPath}\n\n这些文件不会自动上传，请在反馈问题时主动提供。`
    )
  } catch {
    // 原生提示不可用时仍保留已落盘日志。
  }
  applicationShuttingDown = true
  app.exit(1)
}

const crashGuard = createCrashGuard({
  app,
  log: startupLog,
  startedAt: startupStartedAt,
  safeMode: startupSafeMode,
  onUnrecoverable: showStartupFailure,
  isShuttingDown: () => applicationShuttingDown
})
crashGuard.install()

const startupDiagnostics = {
  record(event, sender) {
    const mainWindow = getMainWindow()
    if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents !== sender) return false
    const recorded = startupLog.record(event)
    if (developmentFaultEnabled('--diagnostic-startup-json')) {
      console.log(`@@POE_STARTUP@@${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}`)
    }
    if (recorded && event?.reasonCode === 'none' && event?.phase === 'renderer' && event?.outcome === 'succeeded') {
      crashGuard.markStartupComplete()
    }
    if (event?.reasonCode === 'none' && event?.phase === 'renderer' && event?.outcome === 'succeeded' &&
        developmentFaultEnabled('--diagnostic-exit-after-mounted')) {
      setImmediate(() => app.quit())
    }
    if (event?.reasonCode === 'none' && event?.phase === 'dashboard' && event?.outcome === 'succeeded' &&
        developmentFaultEnabled('--diagnostic-exit-after-dashboard-ready')) {
      setImmediate(() => {
        void shutdownController.requestShutdown()
        // 仅诊断基准使用：给正常清理短暂窗口，避免后台网络恢复让六轮基准长期挂起。
        setTimeout(() => app.exit(0), 3000).unref()
      })
    }
    return recorded
  }
}

pythonDetector.configurePythonRuntime({
  isPackaged: app.isPackaged,
  resourcesPath: process.resourcesPath
})
const hasSingleInstanceLock = app.requestSingleInstanceLock()
startupLog.record({
  phase: 'instance-lock', outcome: hasSingleInstanceLock ? 'succeeded' : 'stopped',
  reasonCode: hasSingleInstanceLock ? 'none' : 'existing_instance'
})
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
let stashPickup = null
let junfengHighlight = null
let puzzleService = null
let gameWindowTitles = null
let diagnosticEvents = null
let foregroundWatcher = null
let applicationUpdate = null

function resolveForegroundWatcherScriptPath() {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url))
  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath, 'foreground_watcher.py')]
    : [
        path.resolve(moduleDir, '../src/assets/scripts/foreground_watcher.py'),
        path.join(app.getAppPath(), 'src/assets/scripts/foreground_watcher.py'),
        path.resolve(app.getAppPath(), '../src/assets/scripts/foreground_watcher.py')
      ]
  return candidates.find((candidate) => fs.existsSync(candidate)) || ''
}

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
    () => stashPickup?.cleanup(),
    () => junfengHighlight?.cleanup(),
    () => chaosRecipeService?.overlay?.close(),
    () => chaosControlOverlay?.cleanup(),
    () => priceCheckService?.closeOverlay(),
    () => puzzleService?.cleanup(),
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
    () => foregroundWatcher?.stop(),
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

let applicationCleanupPromise = null
function cleanupApplicationResourcesOnce() {
  if (!applicationCleanupPromise) applicationCleanupPromise = cleanupApplicationResources()
  return applicationCleanupPromise
}

const shutdownController = createShutdownController({
  app,
  cleanup: cleanupApplicationResourcesOnce
})

function createApplicationWindow() {
  startupLog.record({ phase: 'main-window', outcome: 'started', reasonCode: 'none' })
  const window = createMainWindow({
    beforeLoad: candidate => crashGuard.observeWindow(candidate),
    diagnosticFailLoad: developmentFaultEnabled('--diagnostic-fail-load')
  })
  window.on('close', shutdownController.handleMainWindowClose)
  startupLog.record({ phase: 'main-window', outcome: 'succeeded', reasonCode: 'none' })
  if (developmentFaultEnabled('--diagnostic-crash-renderer')) {
    window.webContents.once('did-finish-load', () => {
      setImmediate(() => {
        if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
          window.webContents.forcefullyCrashRenderer()
        }
      })
    })
  }
  return window
}

// 生命周期管理：ready 后创建窗口与快捷键，退出前清理
async function startApplication() {
  if (!hasSingleInstanceLock) return
  startupLog.record({ phase: 'app-ready', outcome: 'succeeded', reasonCode: 'none' })
  if (developmentFaultEnabled('--diagnostic-fail-main')) {
    throw new Error('development diagnostic main-process failure')
  }
  if (developmentFaultEnabled('--diagnostic-crash-main-native')) {
    process.crash()
  }
  crossProcessInstanceLock = await acquireCrossProcessInstanceLock({
    onSecondInstance: showExistingMainWindow
  })
  if (!crossProcessInstanceLock.acquired) {
    startupLog.record({ phase: 'cross-process-lock', outcome: 'stopped', reasonCode: 'existing_instance' })
    process.exit(0)
    return
  }
  startupLog.record({ phase: 'cross-process-lock', outcome: 'succeeded', reasonCode: 'none' })
  gameWindowTitles = new GameWindowTitleRegistry({ userDataPath: app.getPath('userData') })
  gameWindowTitles.initialize()
  diagnosticEvents = new DiagnosticEventStore({
    userDataPath: app.getPath('userData'),
    appVersion: app.getVersion()
  })
  applicationUpdate = new ApplicationUpdateService({
    updater: electronUpdater.autoUpdater,
    currentVersion: app.getVersion(),
    isPackaged: app.isPackaged,
    cleanup: cleanupApplicationResourcesOnce,
    markCleanupComplete: () => shutdownController.markCleanupComplete(),
    requestShutdown: () => app.quit()
  })
  applicationUpdate.on('state-changed', state => {
    const mainWindow = getMainWindow()
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('update-state-changed', state)
    }
  })
  // 禁用菜单栏，保持无干扰窗口
  Menu.setApplicationMenu(null)

  poeCnSession = session.fromPartition('persist:poe-cn-auth')

  craftingService = new CraftingService({
    storageRoot: path.join(app.getPath('userData'), 'crafting'),
    protocol,
    net
  })

  const chaosOverlay = new ChaosRecipeOverlayManager()
  const puzzleOverlay = new PuzzleOverlayManager()
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
    onStatusChange: (payload) => {
      chaosControlOverlay?.sync()
      if (payload?.event !== 'completed' && payload?.event !== 'stopped') return
      const mainWindow = getMainWindow?.()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('chaos-recipe-snapshot-updated', chaosRecipeService?.snapshot)
      }
    }
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
  const highlightCalibration = new JunfengCalibrationRepository(path.join(app.getPath('userData'), 'junfeng-highlight'))
  stashPickup = new StashPickupManager({
    python: { ...pythonManager, ...pythonDetector },
    fileWatcher,
    getMainWindow,
    interfaceDetection,
    automationLock,
    calibration: highlightCalibration,
    onStatusChange: () => chaosControlOverlay?.sync()
  })
  junfengHighlight = new JunfengHighlightManager({
    python: { ...pythonManager, ...pythonDetector },
    fileWatcher,
    getMainWindow,
    interfaceDetection,
    automationLock,
    calibration: highlightCalibration,
    onStatusChange: () => chaosControlOverlay?.sync()
  })
  puzzleService = new PuzzleAnalysisService({
    python: { ...pythonManager, ...pythonDetector },
    window: windowManager,
    fileWatcher,
    getMainWindow,
    automationLock,
    overlay: puzzleOverlay
  })
  chaosControlOverlay.attachStashPickup?.(stashPickup)
  chaosControlOverlay.attachJunfeng?.(junfengHighlight)
  chaosControlOverlay.attachService(chaosRecipeService)
  chaosRecipeService.control = chaosControlOverlay
  const priceCheckClient = new PoeCnTradeClient({ session: poeCnSession })
  const uniqueItemImages = new UniqueItemImageRepository()
  // 先用内置目录构造查价服务（本地读取，快），官方目录后台刷新后替换
  const tradeCatalogBundle = await loadTradeCatalog()
  tradeCatalogBundle.status = {
    ...tradeCatalogBundle.status,
    provider: 'bundled',
    degraded: true,
    warning: '正在加载腾讯官方词缀目录…'
  }
  const priceCheckOverlay = new PriceCheckOverlayManager()
  priceCheckService = new PriceCheckService({
    auth: chaosAuth,
    client: priceCheckClient,
    catalog: tradeCatalogBundle.catalog,
    catalogStatus: tradeCatalogBundle.status,
    dcRateProvider: async () => {
      await craftingService.initializePrices()
      const snapshot = await craftingService.prices.refresh()
      return snapshot.records.find((record) => record.resourceId === 'currency:divine') || null
    },
    catalogRefresher: async () => {
      const [officialStats, officialItems] = await Promise.all([
        priceCheckClient.getStats(),
        priceCheckClient.getItems()
      ])
      return createOfficialTradeCatalog(
        tradeCatalogBundle.catalog,
        officialStats,
        Date.now(),
        officialItems,
        uniqueItemImages.catalog
      )
    },
    overlay: priceCheckOverlay,
    shell,
    captureClipboard: () => capturePoeItemText({
      clipboard,
      assertForeground: () => assertWindowsGameForeground(pythonDetector.detectPythonPath()),
      sendCopy: () => sendWindowsCopy(pythonDetector.detectPythonPath())
    })
  })
  startupLog.record({ phase: 'services', outcome: 'succeeded', reasonCode: 'none' })

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
    stashPickup,
    junfeng: junfengHighlight,
    interfaceDetection,
    automationLock,
    puzzle: puzzleService,
    gameWindowTitles,
    diagnostics: diagnosticEvents,
    startupDiagnostics,
    applicationUpdate,
    getMainWindow,
    enableJunfengTraining: !app.isPackaged
  })

  createApplicationWindow()

  // 启动游戏前台监视器：门禁开启时仅在游戏窗口位于前台注册用户全局快捷键。
  // 放到窗口创建后的下一个事件循环，避免同步探测 Python 阻塞窗口显示。
  setImmediate(() => {
    foregroundWatcher = startForegroundWatcher({
      pythonPath: pythonDetector.detectPythonPath(),
      scriptPath: resolveForegroundWatcherScriptPath(),
      onStateChange: ({ game, title, reason, processName }) => {
        const result = shortcutManager.setScopeActive(game, { title, reason, processName })
        const mainWindow = getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('shortcut-scope-changed', {
            ...shortcutManager.getScopeState(),
            failed: result.failed
          })
        }
        if (!result.success) {
          void diagnosticEvents?.record({
            area: 'shortcuts',
            operation: 'shortcut_scope',
            outcome: 'failed',
            reasonCode: 'shortcut_registration_failed',
            metadata: { failed: result.failed }
          })
        }
      },
      onFailure: (error) => {
        shortcutManager.setScopeAvailable(false)
        const mainWindow = getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('shortcut-scope-changed', {
            ...shortcutManager.getScopeState()
          })
        }
        void diagnosticEvents?.record({
          area: 'shortcuts',
          operation: 'shortcut_scope',
          outcome: 'failed',
          reasonCode: 'foreground_watcher_failed',
          metadata: { error: String(error?.message || error) }
        })
      }
    })
  })

  // 等待窗口加载完成后再通知渲染进程初始化快捷键，避免渲染端尚未准备好
  const mainWindow = getMainWindow()
  if (mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      if (mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) return
      // 只给主应用页面安装外链策略。国服登录窗必须留在独立 Session 内导航。
      installExternalLinkPolicy(mainWindow.webContents, (url) => shell.openExternal(url))
      // 渲染进程再行注册本地快捷键映射
      if (!mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
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

  // 耗时初始化移到窗口显示之后后台执行：做装数据、登录恢复、官方交易目录刷新
  void (async () => {
    try {
      await craftingService.initialize()
      craftingService.registerImageProtocol()
    } catch (error) {
      // 做装数据加载失败：IPC handler 内部仍会 await service.initialize() 重试
    }
    await chaosRecipeService.restoreAuth()
    let uniqueImageWarning = ''
    try {
      await uniqueItemImages.load()
    } catch (error) {
      uniqueItemImages.useFallback()
      uniqueImageWarning = `本地传奇图片目录不可用：${error.message}`
    }
    registerUniqueItemImageProtocol({ protocol, net, repository: uniqueItemImages })
    try {
      await priceCheckService.refreshCatalog()
    } catch (error) {
      startupLog.record({
        phase: 'price-check-catalog', outcome: 'failed',
        reasonCode: 'official_catalog_unavailable', error
      })
    }
    if (uniqueImageWarning) {
      priceCheckService.catalogStatus.warning = [priceCheckService.catalogStatus.warning, uniqueImageWarning].filter(Boolean).join('；')
    }
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) window.webContents.send('price-check-catalog-updated')
    }
  })().catch((error) => {
    startupLog.record({
      phase: 'background-initialization', outcome: 'failed',
      reasonCode: 'background_initialization_failed', error
    })
  })
}

app.whenReady().then(startApplication).catch((error) => {
  startupLog.record({ phase: 'app-ready', outcome: 'failed', reasonCode: 'startup_initialization_failed', error })
  showStartupFailure({ reasonCode: 'startup_initialization_failed' })
  app.exit(1)
})

// 应用退出时注销所有全局快捷键
app.on('before-quit', () => {
  if (applicationShuttingDown) return
  applicationShuttingDown = true
  applicationUpdate?.dispose()
  startupLog.record({ phase: 'app-shutdown', outcome: 'started', reasonCode: 'none' })
})

app.on('will-quit', () => {
  crashGuard.dispose()
  globalShortcut.unregisterAll()
  shortcutManager.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
