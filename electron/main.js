import { loadInternationalTradeCatalog } from './modules/priceCheck/catalog.js'
import { createEmergencyStopCoordinator } from './modules/ipc/emergencyStop.js'
import { ServerModeController } from './modules/app/serverMode.js'
import { LocalizationService } from './modules/localization/service.js'
import { LocalizationRuntime } from './modules/localization/runtime.js'
import { createLocalizedSanctumCatalog } from './modules/sanctum/localization.js'
import { registerLocalizationHandlers } from './modules/ipc/localization.js'
import { MarketLocalizationService } from './modules/marketLocalization/service.js'
import { registerMarketLocalizationHandlers } from './modules/marketLocalization/ipc.js'
import { installServerIpcPolicy, serverShortcutAllowed } from './modules/app/serverIpcPolicy.js'
import { internationalVerificationFeatures } from '../shared/serverMode.js'
import { configureItemFootprintRegistry, itemFootprintRegistry } from './modules/items/footprintRegistry.js'
/**
 * Purpose: Electron 主进程入口，负责窗口创建、模块依赖注册、生命周期清理与全局快捷键。
 * Inputs: Electron app 生命周期事件；渲染进程通过 IPC 调用暴露的模块方法。
 * Outputs: 创建/管理主窗口；注册 IPC 处理器；注册/注销全局快捷键；清理子进程与监控资源。
 * Preconditions: app.whenReady 触发后再创建窗口；各子模块可安全初始化（Python 环境探测、文件监听等）。
 * Edge cases: 同一可执行程序使用 Electron 锁，不同开发/打包可执行程序使用命名管道锁；快捷键注册失败当前未兜底。
 */
import { app, BrowserWindow, Menu, Tray, clipboard, crashReporter, dialog, globalShortcut, nativeImage, protocol, net, screen, shell, session, ipcMain } from 'electron'
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
import { PobExportService } from './modules/pobExport/service.js'
import { PobLauncherService } from './modules/pobLauncher/service.js'
import { PoeCnStashClient } from './modules/chaosRecipe/stashClient.js'
import { ChaosRecipeService } from './modules/chaosRecipe/service.js'
import { ChaosRecipeOverlayManager } from './modules/chaosRecipe/overlay.js'
import { ChaosRecipeAutomationManager } from './modules/chaosRecipe/automation.js'
import { InterfaceDetectionCoordinator } from './modules/interfaceDetection/coordinator.js'
import { AutomationLock } from './modules/automation/lock.js'
import { ChaosRecipeControlOverlay } from './modules/chaosRecipe/controlOverlay.js'
import { createShutdownController } from './modules/lifecycle/shutdown.js'
import { createApplicationTrayController } from './modules/lifecycle/tray.js'
import {
  createApplicationRestartController,
  DEVELOPMENT_RESTART_EXIT_CODE
} from './modules/lifecycle/restart.js'
import { acquireCrossProcessInstanceLock } from './modules/app/singleInstance.js'
import { createCnOfficialTradeCatalog, loadTradeCatalog } from './modules/priceCheck/catalog.js'
import {
  enrichOfficialItemsWithImages,
  registerUniqueItemImageProtocol,
  UniqueItemImageRepository
} from './modules/priceCheck/uniqueItemSnapshot.js'
import { PoeCnTradeClient } from './modules/priceCheck/client.js'
import { PriceCheckService } from './modules/priceCheck/service.js'
import { PriceCheckOverlayManager } from './modules/priceCheck/overlay.js'
import {
  assertWindowsGameForeground,
  capturePoeItemText,
  disposeWindowsClipboardHelper,
  sendWindowsCopy,
  warmWindowsClipboardHelper
} from './modules/priceCheck/clipboardCapture.js'
import { CHAOS_ERROR_CODES } from './modules/chaosRecipe/errors.js'
import { ClientEventSettingsRepository } from './modules/clientEvents/settingsRepository.js'
import { ClientEventsService } from './modules/clientEvents/service.js'
import { detectRunningClientLogPath } from './modules/clientEvents/pathDetection.js'
import { detectClientProcessSessions, detectClientProcessExists } from './modules/clientEvents/processDetection.js'
import { MapTrackerRepository } from './modules/mapTracker/repository.js'
import { MapTrackerService } from './modules/mapTracker/service.js'
import { MapTrackerOverlayManager } from './modules/mapTracker/overlay.js'
import { SanctumRepository } from './modules/sanctum/repository.js'
import { SanctumService } from './modules/sanctum/service.js'
import { SanctumControlOverlay } from './modules/sanctum/controlOverlay.js'
import { SanctumOverlay } from './modules/sanctum/overlay.js'
import { SanctumCalibrationEditor } from './modules/sanctum/calibration.js'
import { SanctumLiveDriver } from './modules/sanctum/liveDriver.js'
import { listSanctumSamples, replaySanctumSample } from './modules/sanctum/replay.js'
import { StashPickupManager } from './modules/stashPickup/manager.js'
import { JunfengHighlightManager } from './modules/junfeng/manager.js'
import { FaustusManager } from './modules/faustus/manager.js'
import { InternationalDcRateService } from './modules/faustus/internationalDcRate.js'
import { PuzzleAnalysisService } from './modules/puzzle/service.js'
import { PuzzleCalibrationRepository } from './modules/puzzle/calibrationRepository.js'
import { PuzzleFailureEvidenceRepository } from './modules/puzzle/failureEvidenceRepository.js'
import { PuzzleOverlayManager } from './modules/puzzle/overlay.js'
import { RecognitionFeedbackOverlayManager } from './modules/puzzle/recognitionFeedbackOverlay.js'
import { getDisplayPhysicalBounds } from './modules/window/coordinates.js'
import { GameWindowTitleRegistry } from './modules/system/gameWindowTitles.js'
import { WindowActivationService } from './modules/window/activation.js'
import { DiagnosticEventStore } from './modules/system/diagnosticEventStore.js'
import { createStartupLogger } from './modules/system/startupLog.js'
import { createExitDiagnostics } from './modules/system/exitDiagnostics.js'
import { withCalibrationGameWindow } from './modules/sanctum/calibrationWindow.js'
import { createDevelopmentStartupTrace } from '../shared/developmentStartupTrace.js'
import { waitForDevServerReady } from '../shared/devServerReady.js'
import { createCrashGuard } from './modules/system/crashGuard.js'
import { ApplicationUpdateService } from './modules/update/service.js'
import { InstalledUpdateRepository } from './modules/update/installedUpdateRepository.js'
import { FEEDBACK_CONFIG } from './modules/feedback/config.js'
import { FeedbackAuthClient } from './modules/feedback/auth.js'
import { FeedbackCloudClient } from './modules/feedback/cloudClient.js'
import { FeedbackService } from './modules/feedback/service.js'
import { DailyUsageService } from './modules/dailyUsage/service.js'
import { LoadingFeedbackCoordinator } from './modules/loadingFeedback/coordinator.js'
import { LoadingFeedbackOverlayManager } from './modules/loadingFeedback/overlay.js'
import { LOADING_FEEDBACK_CHANNEL } from '../shared/loadingFeedback.js'

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
const managedDevelopmentRestart = (
  process.env.NODE_ENV === 'development' && Boolean(process.env.VITE_DEV_SERVER_URL)
)
let applicationShuttingDown = false
let startupFailureShown = false

function resolveApplicationMetadata() {
  try {
    const mainModuleDirectory = path.dirname(fileURLToPath(import.meta.url))
    return JSON.parse(fs.readFileSync(path.resolve(mainModuleDirectory, '../package.json'), 'utf8'))
  } catch {
    try {
      return JSON.parse(fs.readFileSync(path.join(app.getAppPath(), 'package.json'), 'utf8'))
    } catch {
      return { version: app.getVersion() }
    }
  }
}

const applicationMetadata = resolveApplicationMetadata()
const feedbackInternalTest = applicationMetadata.feedbackInternalTest === true
if (startupSafeMode) app.disableHardwareAcceleration()
app.setPath('userData', feedbackInternalTest
  ? path.join(app.getPath('appData'), '流放助手-阿里云测试')
  : resolveUserDataPath(app.getPath('appData')))
const serverMode = new ServerModeController({
  userDataPath: app.getPath('userData'),
  verificationFeatures: internationalVerificationFeatures(process.argv, { isPackaged: app.isPackaged }),
  prepareCleanup: prepareLocalizationShutdown,
  cleanup: async () => {
    priceCheckService?.clear()
    const result = await createEmergencyStopCoordinator({ chaosRecipe: chaosRecipeService, stashPickup, junfeng: junfengHighlight, faustus: faustusManager, puzzle: puzzleService, mapTracker: mapTrackerService, sanctum: sanctumService }).stopAll('server-switch')
    if (!result.success) throw new Error('自动化未能停止')
  },
  finalizeCleanup: cleanupApplicationResourcesOnce,
  restart: () => {
    shutdownController.markCleanupComplete()
    if (managedDevelopmentRestart) exitApplicationImmediately(DEVELOPMENT_RESTART_EXIT_CODE)
    else { app.relaunch(); app.quit() }
  }
})
configureItemFootprintRegistry({ serverId: serverMode.mode, gameVersion: serverMode.mode === 'international' ? '3.30.0' : '3.29' })
if (serverMode.mode === 'international') fileWatcher.configureDirectory(serverMode.dataPath('automation'))
installServerIpcPolicy(ipcMain, serverMode)
ipcMain.on('server-mode:context', event => { event.returnValue = serverMode.context })
ipcMain.handle('server-mode:switch', (event, id) => {
  if (event.sender !== getMainWindow()?.webContents) return { success: false, error: '只允许主窗口切换服务器' }
  return serverMode.switchTo(id)
})
shortcutManager.setServerInputPolicy(key => serverShortcutAllowed(serverMode.context, key, serverMode.switching))
const crashDumpsPath = path.join(app.getPath('userData'), 'crashes')
const startupTrace = createDevelopmentStartupTrace({ env: app.isPackaged ? {} : process.env })
const startupLog = createStartupLogger({
  userDataPath: app.getPath('userData'),
  onRecord: event => startupTrace.record(event.phase, event.outcome, event.reasonCode)
})
const applicationVersion = applicationMetadata.version || app.getVersion()
const exitDiagnostics = createExitDiagnostics({ app, log: startupLog })
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
    exitDiagnostics.request('diagnostic_unrecoverable')
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
  exitDiagnostics.request('startup_failure')
  app.exit(1)
}

const crashGuard = createCrashGuard({
  app,
  log: startupLog,
  exitDiagnostics,
  startedAt: startupStartedAt,
  safeMode: startupSafeMode,
  onUnrecoverable: showStartupFailure,
  isShuttingDown: () => applicationShuttingDown
})
crashGuard.install()

let startupDashboardReady = false
let startupRuntimeSettled = false
let startupInteractiveRecorded = false
const startupDiagnostics = {
  record(event, sender) {
    const mainWindow = getMainWindow()
    if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents !== sender) return false
    const recorded = startupLog.record(event)
    if (event?.phase === 'dashboard' && event?.outcome === 'succeeded') startupDashboardReady = true
    if (event?.phase === 'renderer-runtime' && ['succeeded', 'failed'].includes(event?.outcome)) startupRuntimeSettled = true
    if (!startupInteractiveRecorded && startupDashboardReady && startupRuntimeSettled) {
      startupInteractiveRecorded = true
      startupTrace.record('interactive', 'succeeded')
      if (developmentFaultEnabled('--diagnostic-server-roundtrip')) {
        setImmediate(async () => {
          const reportFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.cache', 'server-switch-verification.json')
          try {
            const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'))
            report.visited.push(serverMode.mode)
            const target = report.sequence.shift()
            fs.writeFileSync(reportFile, JSON.stringify(report))
            if (target) {
              const result = await serverMode.switchTo(target)
              if (!result.success) throw new Error('switch-failed')
            } else {
              exitDiagnostics.request('diagnostic_server_roundtrip')
              void shutdownController.requestShutdown()
            }
          } catch {
            startupLog.record({ phase: 'server-switch-verification', outcome: 'failed', reasonCode: 'server_switch_failed' })
            app.exit(1)
          }
        })
        return recorded
      }
      if (developmentFaultEnabled('--diagnostic-exit-after-interactive')) {
        setImmediate(() => {
          exitDiagnostics.request('diagnostic_interactive')
          void shutdownController.requestShutdown()
          setTimeout(() => app.exit(0), 3000).unref()
        })
      }
    }
    if (developmentFaultEnabled('--diagnostic-startup-json')) {
      console.log(`@@POE_STARTUP@@${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}`)
    }
    if (recorded && event?.reasonCode === 'none' && event?.phase === 'renderer' && event?.outcome === 'succeeded') {
      crashGuard.markStartupComplete()
    }
    if (event?.reasonCode === 'none' && event?.phase === 'renderer' && event?.outcome === 'succeeded' &&
        developmentFaultEnabled('--diagnostic-exit-after-mounted')) {
      setImmediate(() => { exitDiagnostics.request('diagnostic_mounted'); app.quit() })
    }
    if (event?.reasonCode === 'none' && event?.phase === 'dashboard' && event?.outcome === 'succeeded' &&
        developmentFaultEnabled('--diagnostic-exit-after-dashboard-ready')) {
      setImmediate(() => {
        exitDiagnostics.request('diagnostic_dashboard')
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
if (!hasSingleInstanceLock) { exitDiagnostics.request('single_instance'); process.exit(0) }

function showExistingMainWindow() {
  void windowActivation?.activateMain({ source: 'second-instance' })
}

app.on('second-instance', showExistingMainWindow)

let craftingService = null
let chaosRecipeService = null
let poeCnSession = null
let interfaceDetection = null
let automationLock = null
let chaosControlOverlay = null
let priceCheckService = null
let localization = null
let marketLocalization = null
let clientEventsService = null
let mapTrackerService = null
let mapTrackerOverlay = null
let sanctumService = null
let sanctumOverlay = null
let sanctumControlOverlay = null
let crossProcessInstanceLock = null
let stashPickup = null
let junfengHighlight = null
let faustusManager = null
let puzzleService = null
let gameWindowTitles = null
let windowActivation = null
let applicationTray = null
let diagnosticEvents = null
let foregroundWatcher = null
let applicationUpdate = null
let feedbackService = null
let dailyUsageService = null
let loadingFeedback = null
let loadingFeedbackOverlay = null
let lastGameWindowBounds = null

function syncLoadingFeedbackForeground({ available = true } = {}) {
  if (!loadingFeedback) return
  const main = getMainWindow()
  if (main && !main.isDestroyed() && main.isFocused()) {
    loadingFeedback.setForeground({ kind: 'app' })
  } else if (shortcutManager.getScopeState().gameForeground && lastGameWindowBounds) {
    loadingFeedback.setForeground({ kind: 'game', gameBounds: lastGameWindowBounds })
  } else {
    loadingFeedback.setForeground({ kind: available ? 'other' : 'unavailable' })
  }
}

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



function resolveOverlayOutsideClickScriptPath() {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url))
  const candidates = app.isPackaged ? [path.join(process.resourcesPath, 'overlay_outside_click.py')] : [path.resolve(moduleDir, '../src/assets/scripts/overlay_outside_click.py'), path.join(app.getAppPath(), 'src/assets/scripts/overlay_outside_click.py')]
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

async function prepareLocalizationShutdown() {
  await Promise.all([localization?.shutdown(), marketLocalization?.shutdown()])
}

async function cleanupApplicationResources() {
  const errors = []

  await settleCleanupPhase([
    () => marketLocalization?.shutdown(),
    () => dailyUsageService?.stop(),
    () => applicationTray?.dispose(),
    () => chaosRecipeService?.automation?.cleanup(),
    () => stashPickup?.cleanup(),
    () => junfengHighlight?.cleanup(),
    () => faustusManager?.cleanup(),
    () => chaosRecipeService?.overlay?.close(),
    () => chaosControlOverlay?.cleanup(),
    () => priceCheckService?.destroyOverlay(),
    () => disposeWindowsClipboardHelper(),
    () => mapTrackerOverlay?.destroy(),
    () => sanctumService?.shutdown(),
    () => sanctumOverlay?.destroy(),
    () => sanctumControlOverlay?.destroy(),
    () => mapTrackerService?.shutdown({ normal: true }),
    () => clientEventsService?.stop(),
    () => puzzleService?.cleanup(),
    () => interfaceDetection?.cleanup(),
    () => craftingService?.cleanup(),
    async () => {
      // A timed-out server switch can still occupy the current app until the user retries or exits.
      if (serverMode.restartRequired) return
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
    () => loadingFeedback?.close(),
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
  loadingFeedbackOverlay?.close()
  loadingFeedbackOverlay = null

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
  if (!applicationCleanupPromise) applicationCleanupPromise = exitDiagnostics.cleanup(cleanupApplicationResources)
  return applicationCleanupPromise
}

const shutdownController = createShutdownController({
  app,
  prepareCleanup: prepareLocalizationShutdown,
  cleanup: cleanupApplicationResourcesOnce
})

function exitApplicationImmediately(code) {
  applicationShuttingDown = true
  try { applicationUpdate?.dispose() } catch {}
  try { crashGuard.dispose() } catch {}
  try { globalShortcut.unregisterAll() } catch {}
  try { shortcutManager.unregisterAll() } catch {}
  app.exit(code)
}

const applicationRestartController = createApplicationRestartController({
  prepareCleanup: prepareLocalizationShutdown,
  exitDiagnostics,
  cleanup: cleanupApplicationResourcesOnce,
  clearCache: async () => {
    const mainWindow = getMainWindow()
    if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) {
      throw new Error('强制刷新时主窗口已不可用')
    }
    await mainWindow.webContents.session.clearCache()
  },
  markCleanupComplete: () => shutdownController.markCleanupComplete(),
  restart: () => {
    if (managedDevelopmentRestart) {
      exitApplicationImmediately(DEVELOPMENT_RESTART_EXIT_CODE)
      return
    }
    app.relaunch()
    app.quit()
  },
  onError: error => startupLog.record({
    phase: 'application-restart', outcome: 'failed', reasonCode: 'force_refresh_failed', error
  }),
  terminateAfterFailure: () => exitApplicationImmediately(1)
})

function createApplicationWindow() {
  startupLog.record({ phase: 'main-window', outcome: 'started', reasonCode: 'none' })
  const window = createMainWindow({
    beforeLoad: candidate => {
      crashGuard.observeWindow(candidate)
      if (candidate.isVisible()) startupTrace.record('window-visible')
      else candidate.once('show', () => startupTrace.record('window-visible'))
    },
    diagnosticFailLoad: developmentFaultEnabled('--diagnostic-fail-load'),
    requestForceRefresh: () => applicationRestartController.requestRestart()
  })
  window.on('close', (event) => {
    const source = exitDiagnostics.windowCloseSource(window)
    exitDiagnostics.record('window-close-request', source)
    if (applicationTray?.handleMainWindowClose(event, window)) return
    exitDiagnostics.request(source)
    shutdownController.handleMainWindowClose()
  })
  window.on('focus', () => syncLoadingFeedbackForeground())
  window.on('blur', () => syncLoadingFeedbackForeground())
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
    exitDiagnostics.request('cross_process_instance')
    startupLog.record({ phase: 'cross-process-lock', outcome: 'stopped', reasonCode: 'existing_instance' })
    process.exit(0)
    return
  }
  startupLog.record({ phase: 'cross-process-lock', outcome: 'succeeded', reasonCode: 'none' })
  // Start probing concurrently with independent service setup; no synchronous subprocess on this path.
  const pythonRuntimePending = startupTrace.measure('python-runtime', () => pythonDetector.resolvePythonRuntimeAsync())
  void pythonRuntimePending.catch(() => {})
  gameWindowTitles = new GameWindowTitleRegistry({ userDataPath: serverMode.dataPath(), defaultTitles: serverMode.server.windowTitles })
  gameWindowTitles.initialize()
  windowActivation = new WindowActivationService({
    gameWindowRegistry: gameWindowTitles,
    getMainWindow,
    pythonPathProvider: () => pythonDetector.detectPythonPath()
  })
  windowManager.configureWindowActivation(windowActivation)
  const trayIcon = nativeImage.createFromPath(path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../src/assets/images/LOGO-dark.png'
  ))
  applicationTray = createApplicationTrayController({
    app,
    exitDiagnostics,
    icon: trayIcon,
    createTray: value => new Tray(value),
    createMenu: template => Menu.buildFromTemplate(template),
    getMainWindow,
    activateMain: () => windowActivation.activateMain({ source: 'tray' }),
    requestCloseChoice: () => {
      const window = getMainWindow()
      if (window && !window.isDestroyed() && !window.webContents.isDestroyed()) {
        window.webContents.send('window-close-choice-requested')
      }
    },
    isQuitting: () => applicationShuttingDown || shutdownController.state !== 'idle' || serverMode.restartRequired
  })
  diagnosticEvents = new DiagnosticEventStore({
    userDataPath: app.getPath('userData'),
    appVersion: app.getVersion()
  })
  const installedUpdateRepository = new InstalledUpdateRepository({ userDataPath: app.getPath('userData') })
  const installedUpdate = await startupTrace.measure('installed-update', () => installedUpdateRepository.loadForVersion(app.getVersion()))
  const updateSupported = app.isPackaged && !feedbackInternalTest
  const autoUpdater = updateSupported
    ? (await import('electron-updater')).default.autoUpdater
    : { on() {}, removeListener() {}, setFeedURL() {} }
  applicationUpdate = new ApplicationUpdateService({
    prepareCleanup: prepareLocalizationShutdown,
    exitDiagnostics,
    updater: autoUpdater,
    currentVersion: app.getVersion(),
    isPackaged: updateSupported,
    cleanup: cleanupApplicationResourcesOnce,
    markCleanupComplete: () => shutdownController.markCleanupComplete(),
    requestShutdown: () => app.quit(),
    installedUpdateRepository,
    installedUpdate
  })
  applicationUpdate.on('state-changed', state => {
    const mainWindow = getMainWindow()
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('update-state-changed', state)
    }
  })
  const feedbackAuth = new FeedbackAuthClient({
    config: FEEDBACK_CONFIG,
    userDataPath: app.getPath('userData')
  })
  const puzzleFailureEvidence = new PuzzleFailureEvidenceRepository({
    root: path.join(app.getPath('userData'), 'diagnostic-evidence', 'puzzle-recognition')
  })
  feedbackService = new FeedbackService({
    config: FEEDBACK_CONFIG,
    auth: feedbackAuth,
    cloud: new FeedbackCloudClient({ config: FEEDBACK_CONFIG, auth: feedbackAuth }),
    failureEvidence: puzzleFailureEvidence,
    appVersion: app.getVersion(),
    locale: app.getLocale()
  })
  if (app.isPackaged) {
    dailyUsageService = new DailyUsageService({
      config: FEEDBACK_CONFIG,
      auth: feedbackAuth,
      appVersion: applicationVersion,
      runtimeMode: 'packaged',
      userDataPath: app.getPath('userData')
    })
  }
  // 禁用菜单栏，保持无干扰窗口
  Menu.setApplicationMenu(null)

  poeCnSession = session.fromPartition(serverMode.server.partition)

  const localizationRuntime = new LocalizationRuntime({ serverId: serverMode.mode,
    entries: () => localization?.getActiveEntries() || [], revision: () => localization?.getActiveRevision() || '',
    catalog: () => priceCheckService?.catalog || null,
    baseNames: () => {
      const names = Object.keys(itemFootprintRegistry.snapshot().items).map(key => key.split('\u001f')[1]).filter(Boolean)
      try { names.push(...craftingService.repository.getDataset().bases.map(base => base.name)) } catch { /* builtin footprint identities remain available before crafting initializes */ }
      return [...new Set(names)]
    }
  })
  craftingService = new CraftingService({
    storageRoot: serverMode.dataPath('crafting'),
    server: serverMode.server,
    localizationRuntime,
    protocol,
    net
  })
  craftingService.registerImageProtocol()

  const chaosOverlay = new ChaosRecipeOverlayManager()
  const puzzleOverlay = new PuzzleOverlayManager()
  const recognitionFeedbackOverlay = new RecognitionFeedbackOverlayManager({ BrowserWindowClass: BrowserWindow, screenApi: screen })
  const faustusFeedbackOverlay = new RecognitionFeedbackOverlayManager({ BrowserWindowClass: BrowserWindow, screenApi: screen })
  loadingFeedbackOverlay = new LoadingFeedbackOverlayManager({ BrowserWindowClass: BrowserWindow, screenApi: screen })
  loadingFeedback = new LoadingFeedbackCoordinator({
    publishApp: snapshot => {
      const main = getMainWindow()
      if (main && !main.isDestroyed() && !main.webContents.isDestroyed()) main.webContents.send(LOADING_FEEDBACK_CHANNEL, snapshot)
    },
    publishGame: (snapshot, bounds) => loadingFeedbackOverlay?.publish(snapshot, bounds)
  })
  automationLock = new AutomationLock()
  interfaceDetection = new InterfaceDetectionCoordinator({
    python: { ...pythonManager, ...pythonDetector },
    fileWatcher,
    logger: startupLog
  })
  const chaosAuth = new PoeCnAuthService({
    session: poeCnSession, server: serverMode.server,
    BrowserWindow,
    parentWindow: getMainWindow
  })
  const chaosStashClient = new PoeCnStashClient({
    session: poeCnSession, server: serverMode.server,
    getAuthStatus: () => chaosAuth.getStatus()
  })
  const chaosAutomation = new ChaosRecipeAutomationManager({
    python: { ...pythonManager, ...pythonDetector },
    fileWatcher,
    getMainWindow,
    overlay: chaosOverlay,
    onItemPicked: (itemId) => chaosRecipeService?.consumeItem(itemId),
    automationLock,
    windowActivation,
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
  stashPickup = new StashPickupManager({
    python: { ...pythonManager, ...pythonDetector },
    fileWatcher,
    getMainWindow,
    windowActivation,
    loadingFeedback,
    interfaceDetection,
    automationLock,
    onStatusChange: () => chaosControlOverlay?.sync()
  })
  junfengHighlight = new JunfengHighlightManager({
    python: { ...pythonManager, ...pythonDetector },
    fileWatcher,
    getMainWindow,
    windowActivation,
    loadingFeedback,
    interfaceDetection,
    automationLock,
    onStatusChange: () => chaosControlOverlay?.sync()
  })
  faustusManager = new FaustusManager({
    dcRateService: serverMode.mode === 'international'
      ? new InternationalDcRateService({
          server: serverMode.server,
          cacheFile: serverMode.dataPath('faustus-dc-rate-cache.json')
        })
      : null,
    server: serverMode.server,
    localizationProvider: () => localization?.getActiveEntries() || [],
    localizationRevisionProvider: () => localization?.getActiveRevision() || '',
    python: { ...pythonManager, ...pythonDetector },
    fileWatcher,
    getMainWindow,
    windowActivation,
    loadingFeedback,
    foregroundState: () => shortcutManager.getScopeState(),
    automationLock,
    feedbackOverlay: faustusFeedbackOverlay,
    resolveDisplayBounds: calibration => {
      const displays = screen.getAllDisplays()
      const display = displays.find(candidate => String(candidate.id) === String(calibration?.displayId))
        || screen.getDisplayNearestPoint({ x: Number(calibration?.left || 0), y: Number(calibration?.top || 0) })
      return getDisplayPhysicalBounds(display, process.platform, point => screen.dipToScreenPoint(point))
    },
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath
  })
  puzzleService = new PuzzleAnalysisService({
    python: { ...pythonManager, ...pythonDetector },
    window: windowManager,
    fileWatcher,
    getMainWindow,
    windowActivation,
    loadingFeedback,
    automationLock,
    overlay: puzzleOverlay,
    feedbackOverlay: recognitionFeedbackOverlay,
    failureEvidence: puzzleFailureEvidence,
    calibration: new PuzzleCalibrationRepository(serverMode.dataPath('puzzle-calibration'))
  })
  chaosControlOverlay.attachStashPickup?.(stashPickup)
  chaosControlOverlay.attachJunfeng?.(junfengHighlight)
  chaosControlOverlay.attachService(chaosRecipeService)
  chaosRecipeService.control = chaosControlOverlay
  const priceCheckClient = new PoeCnTradeClient({ session: poeCnSession, server: serverMode.server })
  const uniqueItemImages = new UniqueItemImageRepository()
  let uniqueImageWarning = ''
  const tradeCatalogPending = startupTrace.measure('trade-catalog', () => loadTradeCatalog())
  // Attach a rejection handler immediately while the independent image read is in flight.
  void tradeCatalogPending.catch(() => {})
  try {
    await startupTrace.measure('unique-images', () => uniqueItemImages.load())
  } catch (error) {
    uniqueItemImages.useFallback()
    uniqueImageWarning = `本地传奇图片与属性目录不可用：${error.message}`
  }
  // 首次查价前先用本地传奇快照增强内置目录，官方目录仍在后台刷新后替换。
  const tradeCatalogBundle = await tradeCatalogPending
  const mercenaryReferenceCatalog = serverMode.mode === 'international' ? tradeCatalogBundle.catalog : null
  if (serverMode.mode === 'international') {
    Object.assign(tradeCatalogBundle, await loadInternationalTradeCatalog({
      baseCatalog: tradeCatalogBundle.catalog,
      uniqueItemCatalog: uniqueItemImages.catalog,
      cacheFile: serverMode.dataPath('trade-catalog.international.json')
    }))
  } else {
    tradeCatalogBundle.catalog.items = enrichOfficialItemsWithImages(
      tradeCatalogBundle.catalog.items,
      uniqueItemImages.catalog
    )
    tradeCatalogBundle.status = {
      ...tradeCatalogBundle.status,
      provider: 'bundled',
      degraded: true,
      warning: ['正在加载腾讯官方词缀目录…', uniqueImageWarning].filter(Boolean).join('；')
    }
  }
  const priceCheckOverlay = new PriceCheckOverlayManager({
    restoreGameFocus: async () => (await windowActivation.activateGame({ source: 'price-check-overlay-close' })).success
  })
  localization = new LocalizationService({
    serverId: serverMode.mode,
    storageRoot: serverMode.dataPath('localization'),
    executable: app.isPackaged ? path.join(process.resourcesPath, 'localization-helper', 'LocalizationHelper.exe') : fileURLToPath(new URL('../.runtime/localization-helper/LocalizationHelper.exe', import.meta.url)),
    configPath: path.join(app.getPath('documents'), 'My Games', 'Path of Exile', 'production_Config.ini'),
    baseUrl: process.env.LOCALIZATION_RESOURCE_BASE_URL || 'http://127.0.0.1:44317',
    allowLoopbackHttp: process.env.LOCALIZATION_ALLOW_LOOPBACK_HTTP !== '0',
    publicKeyFile: process.env.LOCALIZATION_PUBLIC_KEY_FILE || fileURLToPath(new URL('./assets/localization-public-key.pem', import.meta.url))
  })
  marketLocalization = new MarketLocalizationService({
    serverId: serverMode.mode,
    localization,
    storageRoot: serverMode.dataPath('localization'),
    executable: app.isPackaged ? path.join(process.resourcesPath, 'localization-helper', 'LocalizationHelper.exe') : fileURLToPath(new URL('../.runtime/localization-helper/LocalizationHelper.exe', import.meta.url)),
    catalogPath: fileURLToPath(new URL('./assets/market-localization/catalog.json', import.meta.url))
  })
  priceCheckService = new PriceCheckService({
    appVersion: applicationVersion,
    localizationProvider: () => localization.getPriceCheckEntries(),
    localizationRevisionProvider: () => localization.getPriceCheckRevision(),
    mercenaryReferenceCatalog,
    auth: chaosAuth,
    client: priceCheckClient,
    catalog: tradeCatalogBundle.catalog,
    catalogStatus: tradeCatalogBundle.status,
    dcRateProvider: async () => {
      if (serverMode.mode === 'international') return null
      await craftingService.initializePrices()
      const snapshot = await craftingService.prices.refresh()
      return snapshot.records.find((record) => record.resourceId === 'currency:divine') || null
    },
    allowManualQueries: serverMode.mode === 'international',
    catalogRefresher: async () => {
      if (serverMode.mode === 'international') {
        const { generateServerTradeCatalog, writeServerTradeCatalog } = await import('../scripts/generateServerTradeCatalog.js')
        const generated = await generateServerTradeCatalog({ server: 'international', gameVersion: 'live', baseCatalog: tradeCatalogBundle.catalog, uniqueItemCatalog: uniqueItemImages.catalog, fetchImpl: (url, options) => poeCnSession.fetch(url, options) })
        await writeServerTradeCatalog(serverMode.dataPath('trade-catalog.international.json'), generated.catalog)
        return generated
      }
      const officialStats = await priceCheckClient.getStats()
      const officialItems = await priceCheckClient.getItems()
      return createCnOfficialTradeCatalog(
        tradeCatalogBundle.catalog,
        officialStats,
        Date.now(),
        officialItems,
        uniqueItemImages.catalog
      )
    },
    overlay: priceCheckOverlay,
    shell,
    warmClipboardCapture: () => {
      const pythonPath = pythonDetector.detectPythonPath()
      if (pythonPath) warmWindowsClipboardHelper(pythonPath)
    },
    disposeClipboardCapture: () => disposeWindowsClipboardHelper(),
    captureClipboard: async () => {
      const pythonPath = pythonDetector.detectPythonPath()
      let foregroundReady = false
      if (process.platform === 'win32' && pythonPath) {
        try {
          await assertWindowsGameForeground(pythonPath)
          foregroundReady = true
        } catch (error) {
          if (error?.code !== CHAOS_ERROR_CODES.GAME_NOT_FOREGROUND) throw error
        }
      }
      if (!foregroundReady) {
        const activation = await windowActivation.activateGame({ source: 'price-check-capture' })
        if (!activation.success) throw new Error(windowActivation.gameFailureMessage(activation.code))
      }
      return capturePoeItemText({
        clipboard,
        pollMs: 10,
        releaseDelayMs: 0,
        retryCopyAfterMs: 180,
        assertForeground: () => assertWindowsGameForeground(pythonDetector.detectPythonPath()),
        sendCopy: () => sendWindowsCopy(pythonDetector.detectPythonPath())
      })
    }
  })
  const startupPythonPath = (await pythonRuntimePending).path
  if (!startupPythonPath) startupTrace.record('python-runtime', 'failed', 'runtime_unavailable')
  windowManager.configureOverlayOutsideClickCloser({
    pythonPath: startupPythonPath,
    scriptPath: resolveOverlayOutsideClickScriptPath()
  })
  clientEventsService = new ClientEventsService({
    trace: startupTrace,
    processProvider: detectClientProcessSessions,
    logger: startupLog,
    processPresenceProvider: detectClientProcessExists,
    settings: new ClientEventSettingsRepository(serverMode.dataPath('client-events-settings.json')),
    detectPath: detectRunningClientLogPath,
    selectFile: async () => {
      const result = await dialog.showOpenDialog(getMainWindow(), {
        title: '选择 Client.txt', properties: ['openFile'], filters: [{ name: 'Path of Exile Client.txt', extensions: ['txt'] }]
      })
      return result.canceled ? '' : String(result.filePaths[0] || '')
    }
  })
  const mapTrackerRepository = new MapTrackerRepository(serverMode.dataPath())
  mapTrackerService = new MapTrackerService({
    repository: mapTrackerRepository,
    clientEvents: clientEventsService,
    trace: startupTrace,

  })
  mapTrackerOverlay = new MapTrackerOverlayManager({ service: mapTrackerService })
  // ponytail: catalog.json 缺失或损坏只降级圣所功能，不让应用启动失败
  try {
    const sanctumCatalog = JSON.parse(fs.readFileSync(new URL(serverMode.mode === 'international'
      ? './assets/sanctum/catalog.international.json' : './assets/sanctum/catalog.json', import.meta.url), 'utf8'))
    sanctumService = new SanctumService({ moduleEnabled: false, repository: new SanctumRepository(serverMode.dataPath()),
      replay: replaySanctumSample, samples: listSanctumSamples, automationLock,
      catalog: serverMode.mode === 'international' ? createLocalizedSanctumCatalog(sanctumCatalog, {
        entriesProvider: () => localization.getActiveEntries(), revisionProvider: () => localization.getActiveRevision()
      }) : sanctumCatalog })
  } catch (error) { console.warn('圣所服务未启动：无法加载 catalog.json', error) }
  if (sanctumService) sanctumOverlay = new SanctumOverlay({ service: sanctumService, detection: interfaceDetection, BrowserWindowClass: BrowserWindow, screenApi: screen, commandLine: app.commandLine })
  if (sanctumService) {
    sanctumControlOverlay = new SanctumControlOverlay({ service: sanctumService, detection: interfaceDetection, automationLock, BrowserWindowClass: BrowserWindow, screenApi: screen, commandLine: app.commandLine })
    sanctumService.controlOverlay = sanctumControlOverlay
  }
  if (sanctumService) sanctumService.attachLiveDriver(new SanctumLiveDriver({ catalog: sanctumService.catalog, clientEvents: clientEventsService, windowActivation,
    captureWindows: () => [sanctumControlOverlay, sanctumOverlay].flatMap(overlay => {
      const window = overlay?.window
      if (!window || window.isDestroyed()) return []
      const handle = window.getNativeWindowHandle()
      return [{ handle:(handle.length === 8 ? handle.readBigUInt64LE() : BigInt(handle.readUInt32LE())).toString(), processId:process.pid, role:overlay === sanctumControlOverlay ? 'control' : 'graph' }]
    }),
    withHidden: operation => sanctumControlOverlay.withHidden(() => sanctumOverlay.withHidden(operation)), detection: interfaceDetection }), automationLock)
  if (sanctumService) sanctumService.calibrationEditor = new SanctumCalibrationEditor({ service: sanctumService,
    picker: windowManager.pickScreenRegion, cancelPicker: windowManager.cancelCoordinatePicker, detection: interfaceDetection, nativeImage,
    withScreenshotHidden: operation => sanctumControlOverlay.withHidden(() => sanctumOverlay.withHidden(() =>
      withCalibrationGameWindow({ getMainWindow, minimizeMainWindow: windowManager.minimizeMainWindowForAutomation,
        activation: windowActivation }, operation))),
    withHidden: operation => sanctumControlOverlay.withHidden(() => sanctumOverlay.withHidden(operation)) })
  startupLog.record({ phase: 'services', outcome: 'succeeded', reasonCode: 'none' })


  // Purpose: 组合主进程可暴露的能力并注册 IPC，渲染端通过约定频道访问
  registerLocalizationHandlers(localization, getMainWindow, localizationRuntime)
  registerMarketLocalizationHandlers(marketLocalization, getMainWindow, ipcMain)
  // Capture existing game sessions before showing the window, so games launched after it are new sessions.
  await marketLocalization.initialize()
  let localizationRevision = localization.getActiveRevision()
  const localizationStop = createEmergencyStopCoordinator({ chaosRecipe: chaosRecipeService, stashPickup, junfeng: junfengHighlight,
    faustus: faustusManager, puzzle: puzzleService, mapTracker: mapTrackerService, sanctum: sanctumService })
  const synchronizeLocalization = () => {
    if (localizationRevision === localization.getActiveRevision()) return
    localizationRevision = localization.getActiveRevision()
    priceCheckService.clear()
    void localizationStop.stopAll('localization-changed').catch(error => startupLog.warn('localization', '汉化变更后停止任务失败', error))
    for (const window of BrowserWindow.getAllWindows()) {
      try { if (!window.isDestroyed()) {
        window.webContents.send('price-check-catalog-updated', priceCheckService.getStatus().catalog)
        window.webContents.send('localization:state-changed', localization.getStatus())
      } }
      catch { /* 窗口退出不影响已提交的汉化事务 */ }
    }
  }
  localization.on('state', synchronizeLocalization)
  if (serverMode.mode === 'international') {
    const timer = setInterval(synchronizeLocalization, 500)
    timer.unref()
    app.once('will-quit', () => clearInterval(timer))
  }
  registerIpcHandlers({
    server: serverMode.server,
    localizationRuntime,
    window: windowManager,
    python: { ...pythonManager, ...pythonDetector },
    fileWatcher,
    itemParser,
    itemMatcher,
    shortcut: shortcutManager,
    crafting: craftingService,
    chaosRecipe: chaosRecipeService,
    priceCheck: priceCheckService,
    clientEvents: clientEventsService,
    mapTracker: mapTrackerService,
    mapTrackerOverlay,
    sanctum: sanctumService,
    poeCnAccount: {
      auth: chaosAuth,
      listLeagues: () => chaosStashClient.listLeagues()
    },
    pobExport: new PobExportService({ session: poeCnSession, server: serverMode.server, auth: chaosAuth }),
    pobLauncher: new PobLauncherService({ userData: app.getPath('userData') }),
    stashPickup,
    junfeng: junfengHighlight,
    faustus: faustusManager,
    interfaceDetection,
    automationLock,
    puzzle: puzzleService,
    gameWindowTitles,
    diagnostics: diagnosticEvents,
    startupDiagnostics,
    applicationUpdate,
    feedback: feedbackService,
    failureEvidence: puzzleFailureEvidence,
    windowActivation,
    windowClose: applicationTray,
    exitDiagnostics,
    loadingFeedback,
    getMainWindow
  })

  dailyUsageService?.start()
  if (process.env.POE_DEV_SERVER_READY_FILE) {
    try {
      await startupTrace.measure('dev-server-ready', () => waitForDevServerReady())
    } catch (error) {
      if (error?.code === 'DEV_SERVER_FAILED' || error?.code === 'DEV_LAUNCHER_EXITED') {
        exitDiagnostics.request('dev_server_unavailable')
        app.exit(1)
        return
      }
      throw error
    }
  }
  createApplicationWindow()
  // Register IPC before loading the window, then restore business services in the background.
  setImmediate(() => {
    if (applicationShuttingDown) return
    void startupTrace.measure('client-events', () => clientEventsService.initialize())
      .then(() => { if (!applicationShuttingDown) return mapTrackerService.initialize() })
      .catch(error => startupLog.warn('background-services', '后台服务初始化失败', error))
  })
  setImmediate(() => {
    if (applicationShuttingDown) return
    void startupTrace.measure('evidence-cleanup', () => puzzleFailureEvidence.cleanup()).catch(error => {
      startupLog.warn('evidence-cleanup', '历史诊断文件清理失败', error)
    })
  })

  // 启动游戏前台监视器：门禁开启时仅在游戏窗口位于前台注册用户全局快捷键。
  // 放到窗口创建后的下一个事件循环，避免同步探测 Python 阻塞窗口显示。
  setImmediate(() => {
    foregroundWatcher = startForegroundWatcher({
      pythonPath: startupPythonPath,
      scriptPath: resolveForegroundWatcherScriptPath(),
      onStateChange: ({ game, title, reason, processName, bounds }) => {
        lastGameWindowBounds = game ? bounds : null
        const result = shortcutManager.setScopeActive(game, { title, reason, processName })
        mapTrackerService?.setForeground(game)
        sanctumService?.setForeground(game)
        syncLoadingFeedbackForeground()
        const mainWindow = getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('shortcut-scope-changed', {
            ...shortcutManager.getScopeState()
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
        lastGameWindowBounds = null
        shortcutManager.setScopeAvailable(false)
        mapTrackerService?.setForeground(false)
        sanctumService?.setForeground(false)
        syncLoadingFeedbackForeground({ available: false })
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

  // 耗时初始化移到窗口显示之后后台执行：登录恢复、官方交易目录刷新。
  // 做装数据仅在首次使用相关 IPC 或图片协议时加载，避免启动阶段阻塞系统响应。
  void (async () => {
    await chaosRecipeService.restoreAuth()
    registerUniqueItemImageProtocol({ protocol, net, repository: uniqueItemImages })
    try {
      await priceCheckService.refreshCatalog()
    } catch (error) {
      startupLog.record({
        phase: 'price-check-catalog', outcome: 'failed',
        reasonCode: 'official_catalog_unavailable', error
      })
    }
    if (uniqueImageWarning && serverMode.mode === 'cn') {
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
  exitDiagnostics.request('startup_initialization_failed')
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
    exitDiagnostics.request('window_all_closed')
    app.quit()
  }
})
