/** 背包模块 IPC：双界面检测、单会话自动触发及安全入库进程编排。 */

import { ipcMain, nativeImage, screen } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { app } from 'electron'
import { fileURLToPath } from 'node:url'
import {
  BagSessionController,
  createEventLineParser
} from '../bag/orchestrator.js'
import { createBagOverlaySnapshot } from '../bag/overlayState.js'
import { savePngAtomically, assertBagTemplateTarget } from '../bag/templateCapture.js'
import { expandSearchRegion, getDisplayPhysicalBounds } from '../window/coordinates.js'
import { OverlayDragSession } from '../window/overlayDrag.js'
import { getBagOverlayDragBounds } from '../window/bagOverlay.js'
import { validateTemplateCaptureEnvironment } from '../../../src/utils/bagConfig.js'
import {
  normalizeAutomationTiming,
  normalizeOperationDelay,
  pythonAutomationTiming
} from '../../../src/utils/operationDelay.js'
import { normalizeEmptySlotThreshold } from '../../../src/utils/inventorySettings.js'
import { itemFootprintRegistry } from '../items/footprintRegistry.js'

let stashProcess = null
let batchScanProcess = null
let batchScanPreparationToken = null
const batchScanStopRequests = new WeakMap()
let latestConfig = null
let getMainWindowRef = null
let bagWindowApi = null
let interfaceDetection = null
let automationLock = null
let loadingFeedback = null
let disposeDetectionState = null
let moduleRunning = false
let bagConfigRevision = 0
let latestDetectionState = {
  ready: false,
  stashReady: false,
  allflameReceiverReady: false,
  foreground: false
}
const session = new BagSessionController()
const bagOverlayDrag = new OverlayDragSession()
const moduleDir = path.dirname(fileURLToPath(import.meta.url))

function send(channel, payload = {}) {
  const mainWindow = getMainWindowRef?.()
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload)
}

function currentOverlaySnapshot() {
  const normalEnabled = Boolean(latestConfig?.module_enabled)
  const allflameReceiverEnabled = Boolean(latestConfig?.allflame_receiver_enabled)
  return createBagOverlaySnapshot({
    moduleEnabled: moduleRunning && (normalEnabled || allflameReceiverEnabled),
    normalEnabled,
    allflameReceiverEnabled,
    stashReady: Boolean(latestDetectionState.stashReady ?? latestDetectionState.ready),
    allflameReceiverReady: Boolean(latestDetectionState.allflameReceiverReady),
    ready: session.ready,
    foreground: session.foreground,
    stashing: session.stashing
  })
}

function syncBagOverlay() {
  if (!bagWindowApi) return
  if (!moduleRunning || (!latestConfig?.module_enabled && !latestConfig?.allflame_receiver_enabled)) {
    bagWindowApi.closeBagStashOverlayWindow()
    return
  }
  bagWindowApi.updateBagStashOverlay(currentOverlaySnapshot())
}

export function stopBagStashAutomation(reason = 'user') {
  const child = stashProcess
  const stopped = Boolean(child)
  stashProcess = null
  stopChild(child)
  session.finishStash()
  automationLock?.release('自动入库')
  syncBagOverlay()
  if (stopped) send('bag-stash-stopped', { reason })
  return { success: true, stopped }
}

function runtimeConfig(config = {}) {
  return {
    module_enabled: Boolean(config.moduleEnabled),
    allflame_receiver_enabled: Boolean(config.allflameReceiverEnabled),
    force_unique_stash: Boolean(config.forceUniqueStash),
    templates: {
      stash_title: String(config.templates?.stashTitle || ''),
      inventory_title: String(config.templates?.inventoryTitle || ''),
      junfeng_reward_title: String(config.templates?.junfengRewardTitle || ''),
      allflame_receiver_title: String(config.templates?.allflameReceiverTitle || ''),
      stash_region: config.templates?.stashRegion || {},
      inventory_region: config.templates?.inventoryRegion || {},
      junfeng_reward_region: config.templates?.junfengRewardRegion || {},
      allflame_receiver_region: config.templates?.allflameReceiverRegion || {}
    },
    match_threshold: Number(config.matchThreshold ?? 0.8),
    inventory: {
      ...(config.inventory || {}),
      emptySlotThreshold: normalizeEmptySlotThreshold(config.inventory?.emptySlotThreshold),
      layout: config.inventory?.layout || {}
    },
    blacklist: Array.isArray(config.blacklist) ? config.blacklist : [],
    ...pythonAutomationTiming(config)
  }
}

export function updateBagAutomationTiming(value = {}) {
  const timing = normalizeAutomationTiming(value)
  if (latestConfig) Object.assign(latestConfig, pythonAutomationTiming(timing))
  return timing
}

function validateConfigIssue(config) {
  const normalEnabled = Boolean(config?.module_enabled)
  const allflameReceiverEnabled = Boolean(config?.allflame_receiver_enabled)
  if (!normalEnabled && !allflameReceiverEnabled) {
    return { error: '请先启用一种入库功能', failureCode: 'CONFIGURATION_MISSING', configurationIssueId: '' }
  }
  if (normalEnabled && !config?.templates?.stash_title) {
    return { error: '请先配置仓库标题模板', failureCode: 'CONFIGURATION_MISSING', configurationIssueId: 'template.stash-title' }
  }
  if (allflameReceiverEnabled && !config?.templates?.allflame_receiver_title) {
    return { error: '请先配置永火接收舱标题模板', failureCode: 'CONFIGURATION_MISSING', configurationIssueId: 'template.allflame-receiver-title' }
  }
  if (!config?.templates?.inventory_title) {
    return { error: '请先配置背包标题模板', failureCode: 'CONFIGURATION_MISSING', configurationIssueId: 'template.inventory-title' }
  }
  if (!config.inventory?.startPos || !config.inventory?.slotSize) {
    return { error: '背包网格配置不完整', failureCode: 'CONFIGURATION_MISSING', configurationIssueId: 'inventory.grid' }
  }
  return { error: '', failureCode: '', configurationIssueId: '' }
}

function isMainWindowSender(event) {
  const mainWindow = getMainWindowRef?.()
  return Boolean(mainWindow && !mainWindow.isDestroyed() && event?.sender === mainWindow.webContents)
}

export function stopBatchInventoryScan(reason = 'user') {
  const child = batchScanProcess
  const stopped = Boolean(child)
  if (child) batchScanStopRequests.set(child, { reason: String(reason || 'user') })
  if (batchScanPreparationToken) loadingFeedback?.finish(batchScanPreparationToken)
  batchScanPreparationToken = null
  stopChild(child)
  return { success: true, stopped }
}

function effectiveDetectionReady(state = latestDetectionState, config = latestConfig) {
  return Boolean(
    (config?.module_enabled && (state?.stashReady ?? state?.ready)) ||
    (config?.allflame_receiver_enabled && state?.allflameReceiverReady)
  )
}

function applyDetectionState(state = {}) {
  latestDetectionState = structuredClone(state)
  session.setReady(effectiveDetectionReady(state), state.foreground)
  send('bag-detection-match', { matched: session.ready && session.foreground, ...state })
  syncBagOverlay()
}

function validateConfig(config) { return validateConfigIssue(config).error }

function currentDisplays() {
  return screen.getAllDisplays().map((display) => {
    const physicalBounds = getDisplayPhysicalBounds(
      display,
      process.platform,
      (point) => screen.dipToScreenPoint(point)
    )
    return {
      id: String(display.id),
      scaleFactor: display.scaleFactor,
      physicalSize: { width: physicalBounds.width, height: physicalBounds.height },
      physicalBounds
    }
  })
}

function validateCaptureConfig(config) {
  const displays = currentDisplays()
  const warnings = []
  const normalEnabled = Boolean(config.moduleEnabled)
  const allflameReceiverEnabled = Boolean(config.allflameReceiverEnabled)
  const definitions = [['背包标题', 'inventoryTitle', 'inventoryRegion', 'inventoryCapture', 'template.inventory-title']]
  if (normalEnabled || !allflameReceiverEnabled) {
    definitions.unshift(['仓库标题', 'stashTitle', 'stashRegion', 'stashCapture', 'template.stash-title'])
  }
  if (allflameReceiverEnabled) {
    definitions.unshift(['永火接收舱标题', 'allflameReceiverTitle', 'allflameReceiverRegion', 'allflameReceiverCapture', 'template.allflame-receiver-title'])
  }
  for (const [label, pathKey, regionKey, captureKey, configurationIssueId] of definitions) {
    const result = validateTemplateCaptureEnvironment(label, config.templates?.[pathKey], config.templates?.[regionKey], config.templates?.[captureKey], displays)
    if (result.error) return { error: result.error, warnings, failureCode: 'TEMPLATE_INVALID', configurationIssueId }
    if (result.warning) warnings.push(result.warning)
    const metadata = config.templates?.[captureKey]
    if (metadata) {
      const image = nativeImage.createFromPath(String(config.templates[pathKey] || ''))
      const size = image.getSize()
      if (image.isEmpty() || size.width !== metadata.templateSize.width || size.height !== metadata.templateSize.height) {
        return { error: `${label}的模板尺寸与采集记录不一致，请重新框选`, warnings, failureCode: 'TEMPLATE_INVALID', configurationIssueId }
      }
    }
  }
  return { error: '', warnings }
}

function stopChild(child) {
  if (!child || child.killed) return
  child.kill('SIGTERM')
  setTimeout(() => {
    if (child.exitCode === null) child.kill('SIGKILL')
  }, 2000)
}

function writeConfig(fileWatcher, name, config) {
  const configPath = path.join(fileWatcher.getFilePaths().tempDir, name)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')
  return configPath
}

function resolveBagScriptPath() {
  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath, 'bag_auto_stash_template.py')]
    : [
        path.resolve(moduleDir, '../../../src/assets/scripts/bag_auto_stash_template.py'),
        path.join(app.getAppPath(), 'src/assets/scripts/bag_auto_stash_template.py'),
        path.resolve(app.getAppPath(), '../src/assets/scripts/bag_auto_stash_template.py')
      ]
  const scriptPath = candidates.find((candidate) => fs.existsSync(candidate))
  if (!scriptPath) throw new Error(`模板脚本不存在，已检查: ${candidates.join('；')}`)
  return scriptPath
}

function resolveHighlightModelPaths() {
  const root = app.isPackaged
    ? path.join(process.resourcesPath, 'junfeng-highlight-model')
    : path.resolve(moduleDir, '../../../src/assets/models/junfeng-highlight')
  return {
    modelPath: path.join(root, 'model.onnx'),
    manifestPath: path.join(root, 'manifest.json')
  }
}

function spawnPython(python, mode, configPath) {
  const requiredModules = ['cv2', 'mss', 'numpy', 'pyperclip', 'pynput']
  const preferredModules = mode === 'scan' ? [...requiredModules, 'onnxruntime'] : requiredModules
  const pythonPath = python.detectPythonPathWithModules?.(preferredModules) ||
    python.detectPythonPathWithModules?.(requiredModules) || python.detectPythonPath()
  if (!pythonPath) throw new Error('未找到Python可执行文件')
  const scriptPath = resolveBagScriptPath()
  return spawn(pythonPath, [scriptPath, '--mode', mode, '--config', configPath], {
    shell: false,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  })
}

function bindCommonProcessLogging(child, label) {
  const diagnostics = { stderr: '', spawnError: '' }
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (data) => {
    diagnostics.stderr = `${diagnostics.stderr}${String(data)}`.slice(-4000)
    console.error(`[${label}]`, String(data).trim())
  })
  child.on('error', (error) => { diagnostics.spawnError = error.message; console.error(`[${label}] 进程错误:`, error) })
  return diagnostics
}

async function startStashProcess(python, fileWatcher) {
  const gate = session.beginManual()
  if (!gate.success) return gate
  const automationGate = automationLock?.acquire('自动入库') || { success: true }
  if (!automationGate.success) {
    session.finishStash()
    return automationGate
  }
  if (!latestConfig) {
    session.finishStash()
    automationLock?.release('自动入库')
    return { success: false, error: '背包模块尚未配置' }
  }
  const validation = validateConfigIssue(latestConfig)
  if (validation.error) {
    session.finishStash()
    automationLock?.release('自动入库')
    return { success: false, ...validation }
  }

  const activation = await bagWindowApi.activateGameWindow('bag-auto-stash')
  if (!activation.success) {
    session.finishStash()
    automationLock?.release('自动入库')
    return { success: false, error: bagWindowApi.describeGameActivationFailure(activation.code), errorCode: activation.code }
  }

  let child
  try {
    const frozenConfig = structuredClone(latestConfig)
    frozenConfig.inventory.itemFootprints = itemFootprintRegistry.snapshot()
    const configPath = writeConfig(fileWatcher, 'bag_stash_config.json', frozenConfig)
    child = spawnPython(python, 'stash', configPath)
    stashProcess = child
    syncBagOverlay()
  } catch (error_) {
    session.finishStash()
    automationLock?.release('自动入库')
    return { success: false, error: error_.message }
  }

  let terminalEventSent = false
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', createEventLineParser((event) => {
    if (event.event === 'stash-progress') send('bag-stash-progress', event)
    else if (event.event === 'stash-completed') {
      terminalEventSent = true
      send('bag-stash-completed', event)
    } else if (event.event === 'stash-aborted' || event.event === 'stash-error') {
      terminalEventSent = true
      send('bag-stash-stopped', event)
    }
  }, (line) => console.log('[自动入库]', line)))
  bindCommonProcessLogging(child, '自动入库')
  send('bag-stash-progress', {
    event: 'stash-progress', scannedSlots: 0, stashedSlots: 0,
    skippedOccupiedSlots: 0, blacklistedSlots: 0, emptySlots: 0, unreadableSlots: 0, progress: 0
  })
  child.on('close', (code) => {
    const wasCurrent = stashProcess === child
    if (wasCurrent) stashProcess = null
    if (wasCurrent) {
      session.finishStash()
      automationLock?.release('自动入库')
      syncBagOverlay()
      if (!terminalEventSent) send('bag-stash-stopped', { reason: code === 0 ? 'process-ended' : 'process-exited', code })
    }
  })
  return { success: true, processId: child.pid, mode }
}

async function startBatchInventoryScan(python, fileWatcher, config = {}) {
  if (batchScanProcess) return Promise.resolve({ success: false, error: '背包扫描正在进行' })
  const automationGate = automationLock?.acquire('批量背包扫描') || { success: true }
  if (!automationGate.success) return Promise.resolve(automationGate)
  const inventory = config.inventory || {}
  const configured = [inventory.startPos?.x, inventory.startPos?.y, inventory.slotSize?.w, inventory.slotSize?.h]
    .every(value => Number.isFinite(Number(value)) && Number(value) > 0)
  if (!configured) {
    automationLock?.release('批量背包扫描')
    return Promise.resolve({ success: false, error: '请先配置背包网格', errorCode: 'INVENTORY_GRID_INVALID' })
  }

  const frozenConfig = {
    inventory: {
      startPos: { x: Number(inventory.startPos.x), y: Number(inventory.startPos.y) },
      slotSize: { w: Number(inventory.slotSize.w), h: Number(inventory.slotSize.h) },
      itemFootprints: itemFootprintRegistry.snapshot()
    },
    emptySlotModel: {
      ...resolveHighlightModelPaths(),
      threshold: 0.995
    },
    ...pythonAutomationTiming(config)
  }
  let configPath = ''
  let child
  let windowPrepared = false
  const finishPreparation = () => {
    if (batchScanPreparationToken) loadingFeedback?.finish(batchScanPreparationToken)
    batchScanPreparationToken = null
  }
  try {
    windowPrepared = await bagWindowApi.minimizeMainWindowForAutomation()
    if (!windowPrepared) throw new Error('无法为背包扫描准备应用窗口')
    const activation = await bagWindowApi.activateGameWindow('batch-inventory-scan')
    if (!activation.success) throw Object.assign(new Error(bagWindowApi.describeGameActivationFailure(activation.code)), { code: activation.code })
    batchScanPreparationToken = loadingFeedback?.begin('batch-inventory.scan', { owner: '批量背包扫描' }) || null
    configPath = writeConfig(fileWatcher, `batch_inventory_scan_${Date.now()}.json`, frozenConfig)
    loadingFeedback?.update(batchScanPreparationToken, { stage: 'model' })
    child = spawnPython(python, 'scan', configPath)
    batchScanProcess = child
  } catch (error) {
    finishPreparation()
    automationLock?.release('批量背包扫描')
    if (configPath) fs.rmSync(configPath, { force: true })
    if (windowPrepared) await bagWindowApi.restoreMainWindowToForeground()
    return { success: false, error: error.message, errorCode: 'SCAN_START_FAILED' }
  }
  return new Promise((resolve) => {
    let terminal = null
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', createEventLineParser((event) => {
      if (['inventory-scan-progress', 'inventory-scan-completed', 'inventory-scan-error', 'inventory-scan-stopped'].includes(event.event)) finishPreparation()
      if (event.event === 'inventory-scan-progress') {
        send('batch-crafting-scan-progress', event)
      } else if (event.event === 'inventory-scan-completed') {
        terminal = { success: true, snapshot: event.snapshot }
      } else if (event.event === 'inventory-scan-error' || event.event === 'inventory-scan-stopped') {
        terminal = {
          success: false,
          error: String(event.reason || '背包扫描失败'),
          errorCode: String(event.code || 'SCAN_FAILED')
        }
      }
    }, () => {}))
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', data => { stderr = `${stderr}${String(data)}`.slice(-2000) })
    child.on('error', error => {
      finishPreparation()
      terminal = { success: false, error: error.message, errorCode: 'SCAN_PROCESS_ERROR' }
    })
    child.on('close', async code => {
      finishPreparation()
      if (batchScanProcess === child) batchScanProcess = null
      automationLock?.release('批量背包扫描')
      if (configPath) fs.rmSync(configPath, { force: true })
      const stopRequest = batchScanStopRequests.get(child)
      batchScanStopRequests.delete(child)
      const result = stopRequest ? {
        success: false,
        cancelled: true,
        error: '用户已停止背包扫描',
        errorCode: 'USER_STOPPED',
        reason: stopRequest.reason
      } : terminal || {
        success: false,
        error: stderr.trim() || (code === 0 ? '扫描未返回结果' : `背包扫描进程异常退出（${code}）`),
        errorCode: 'SCAN_PROCESS_EXITED'
      }
      if (result.success) send('batch-crafting-scan-completed', result.snapshot)
      else send('batch-crafting-scan-stopped', result)
      await bagWindowApi.restoreMainWindowToForeground()
      resolve(result)
    })
  })
}

const TEMPLATE_RUNTIME_KEYS = Object.freeze({
  stashTitle: { path: 'stash_title', region: 'stash_region' },
  inventoryTitle: { path: 'inventory_title', region: 'inventory_region' },
  junfengRewardTitle: { path: 'junfeng_reward_title', region: 'junfeng_reward_region' },
  allflameReceiverTitle: { path: 'allflame_receiver_title', region: 'allflame_receiver_region' }
})

const templateRuntimeKeys = (type) => TEMPLATE_RUNTIME_KEYS[type] || TEMPLATE_RUNTIME_KEYS.inventoryTitle

const updateRuntimeTemplate = (type, templatePath, region) => {
  if (!latestConfig?.templates) return
  const keys = templateRuntimeKeys(type)
  latestConfig.templates[keys.path] = templatePath
  if (region) latestConfig.templates[keys.region] = region
}

const reloadDetectionForTemplateChange = async (python, fileWatcher) => {
  if (!moduleRunning || !interfaceDetection) return false
  session.reset()
  syncBagOverlay()
  send('bag-detection-match', { matched: false, ready: false, reloading: true })
  await interfaceDetection.updateConfig(latestConfig)
  return true
}

export function registerBagHandlers(python, window, fileWatcher, shared = {}) {
  getMainWindowRef = window.getMainWindow
  bagWindowApi = window
  interfaceDetection = shared.interfaceDetection
  automationLock = shared.automationLock
  loadingFeedback = shared.loadingFeedback
  disposeDetectionState?.()
  disposeDetectionState = interfaceDetection?.subscribe((state) => {
    if (!moduleRunning) return
    applyDetectionState(state)
    if (!state.running && !state.reloading && state.reason) {
      send('bag-detection-stopped', {
        reason: state.reason,
        failureCode: state.failureCode || '',
        configurationIssueId: state.configurationIssueId || ''
      })
    }
  })

  ipcMain.handle('start-bag-detection', async (_event, config) => {
    const previousConfig = latestConfig ? structuredClone(latestConfig) : null
    const wasRunning = moduleRunning
    try {
      const captureValidation = validateCaptureConfig(config || {})
      if (captureValidation.error) return { success: false, ...captureValidation }
      const candidate = runtimeConfig(config)
      const validation = validateConfigIssue(candidate)
      if (validation.error) return { success: false, ...validation }
      if (!interfaceDetection) throw new Error('公共界面检测服务未初始化')
      latestConfig = candidate
      let state
      if (moduleRunning) state = await interfaceDetection.updateConfig(candidate)
      else {
        session.reset()
        state = await interfaceDetection.registerConsumer('bag', candidate)
      }
      moduleRunning = true
      applyDetectionState(state)
      return { success: true, shared: true, warnings: captureValidation.warnings }
    } catch (error) {
      latestConfig = previousConfig
      if (wasRunning && previousConfig) {
        try {
          const state = await interfaceDetection?.updateConfig(previousConfig)
          if (state) applyDetectionState(state)
        } catch {}
        moduleRunning = true
      } else {
        interfaceDetection?.unregisterConsumer('bag')
        session.reset()
        moduleRunning = false
        latestDetectionState = { ready: false, stashReady: false, allflameReceiverReady: false, foreground: false }
      }
      syncBagOverlay()
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('stop-bag-detection', async () => {
    const stashing = stashProcess
    stashProcess = null
    moduleRunning = false
    latestDetectionState = { ready: false, stashReady: false, allflameReceiverReady: false, foreground: false }
    interfaceDetection?.unregisterConsumer('bag')
    stopChild(stashing)
    automationLock?.release('自动入库')
    session.reset()
    syncBagOverlay()
    send('bag-detection-match', { matched: false, ready: false })
    return { success: true }
  })

  ipcMain.handle('start-bag-stash', async () => startStashProcess(python, fileWatcher))

  ipcMain.handle('batch-crafting-scan-inventory', async (event, config = {}) => {
    if (!isMainWindowSender(event)) return { success: false, error: '仅主窗口可启动背包扫描' }
    return startBatchInventoryScan(python, fileWatcher, config)
  })
  ipcMain.handle('batch-crafting-stop-scan', async (event) => {
    if (!isMainWindowSender(event)) return { success: false, error: '仅主窗口可停止背包扫描' }
    return stopBatchInventoryScan()
  })
  ipcMain.handle('update-bag-operation-delay', async (_event, value) => {
    const operationDelayMs = normalizeOperationDelay(value)
    if (latestConfig) updateBagAutomationTiming({
      operationDelayMs,
      fixedTiming: Object.fromEntries(Object.entries(latestConfig.fixed_timing || {}).map(([key, timingValue]) => [
        key.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase()), timingValue
      ]))
    })
    return { success: true, operationDelayMs }
  })

  ipcMain.handle('update-bag-empty-slot-threshold', async (_event, value) => {
    const emptySlotThreshold = normalizeEmptySlotThreshold(value)
    if (latestConfig) latestConfig.inventory.emptySlotThreshold = emptySlotThreshold
    return { success: true, emptySlotThreshold }
  })

  ipcMain.handle('update-bag-runtime-config', async (_event, config = {}) => {
    const previousConfig = latestConfig ? structuredClone(latestConfig) : null
    try {
      const captureValidation = validateCaptureConfig(config)
      if (captureValidation.error) throw new Error(captureValidation.error)
      const candidate = runtimeConfig(config)
      const error = validateConfig(candidate)
      if (error) throw new Error(error)
      latestConfig = candidate
      if (moduleRunning && interfaceDetection) {
        const state = await interfaceDetection.updateConfig(candidate)
        applyDetectionState(state)
      }
      bagConfigRevision += 1
      syncBagOverlay()
      return {
        success: true,
        config: structuredClone(candidate),
        revision: bagConfigRevision,
        warnings: captureValidation.warnings
      }
    } catch (error) {
      if (moduleRunning && interfaceDetection && previousConfig) {
        try { await interfaceDetection.updateConfig(previousConfig) } catch {}
      }
      latestConfig = previousConfig
      syncBagOverlay()
      return { success: false, error: error.message || String(error), revision: bagConfigRevision }
    }
  })

  ipcMain.handle('update-bag-interface-config', async (_event, config = {}) => {
    if (!latestConfig) return { success: true }
    const previousConfig = structuredClone(latestConfig)
    try {
      const candidate = structuredClone(latestConfig)
      candidate.templates = {
        stash_title: String(config.templates?.stashTitle || ''),
        inventory_title: String(config.templates?.inventoryTitle || ''),
        junfeng_reward_title: String(config.templates?.junfengRewardTitle || ''),
        allflame_receiver_title: String(config.templates?.allflameReceiverTitle || ''),
        stash_region: config.templates?.stashRegion || {},
        inventory_region: config.templates?.inventoryRegion || {},
        junfeng_reward_region: config.templates?.junfengRewardRegion || {},
        allflame_receiver_region: config.templates?.allflameReceiverRegion || {}
      }
      candidate.match_threshold = Number(config.matchThreshold ?? 0.8)
      const error = validateConfig(candidate)
      if (error) throw new Error(error)
      latestConfig = candidate
      if (moduleRunning && interfaceDetection) {
        const state = await interfaceDetection.updateConfig(candidate)
        applyDetectionState(state)
      }
      bagConfigRevision += 1
      return { success: true, revision: bagConfigRevision }
    } catch (error) {
      latestConfig = previousConfig
      if (moduleRunning && interfaceDetection) {
        try { await interfaceDetection.updateConfig(previousConfig) } catch {}
      }
      return { success: false, error: error.message || String(error), revision: bagConfigRevision }
    }
  })

  ipcMain.handle('get-bag-stash-overlay-state', async () => currentOverlaySnapshot())
  ipcMain.on('bag-stash-overlay-move', (event, point = {}) => {
    const overlay = bagWindowApi?.getBagStashOverlayWindow?.()
    if (!overlay || overlay.isDestroyed() || overlay.webContents !== event.sender) return
    if (point.phase === 'start') {
      bagOverlayDrag.begin(event.sender.id, point, overlay.getBounds())
      return
    }
    if (point.phase === 'end') {
      bagOverlayDrag.end(event.sender.id)
      return
    }
    if (point.phase !== 'move') return
    const requested = bagOverlayDrag.move(event.sender.id, point)
    if (!requested) return
    const workArea = screen.getDisplayNearestPoint(requested).workArea
    overlay.setBounds(getBagOverlayDragBounds(requested, workArea), false)
  })

  ipcMain.handle('stop-bag-stash', async () => stopBagStashAutomation())

  ipcMain.handle('upload-bag-template', async (_event, sourcePath, type) => {
    try {
      if (stashProcess) throw new Error('入库进行中，暂时不能替换模板')
      assertBagTemplateTarget(type)
      const templateDir = path.join(app.getPath('userData'), 'templates')
      if (!fs.existsSync(templateDir)) fs.mkdirSync(templateDir, { recursive: true })
      const ext = path.extname(sourcePath)
      const fileName = path.basename(assertBagTemplateTarget(type, app.isPackaged), '.png') + ext
      const targetPath = path.join(templateDir, fileName)
      fs.copyFileSync(sourcePath, targetPath)
      updateRuntimeTemplate(type, targetPath)
      let reloaded = false
      let reloadError = ''
      try { reloaded = await reloadDetectionForTemplateChange(python, fileWatcher) } catch (error) { reloadError = error.message }
      return { success: true, path: targetPath, version: Date.now(), reloaded, reloadError }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('capture-bag-template', async (_event, type) => {
    try {
      if (stashProcess) throw new Error('入库进行中，暂时不能替换模板')
      assertBagTemplateTarget(type)
      const result = await window.pickScreenRegion()
      if (result?.canceled) return { success: false, canceled: true, error: result.error || '' }
      if (result?.success === false) return { success: false, error: result.error?.message || '框选失败' }
      const templateDir = path.join(app.getPath('userData'), 'templates')
      const targetPath = savePngAtomically(templateDir, type, result.png, fs, app.isPackaged)
      const region = expandSearchRegion(result.selectedRegion, result.displayPhysicalBounds)
      updateRuntimeTemplate(type, targetPath, region)
      let reloaded = false
      let reloadError = ''
      try { reloaded = await reloadDetectionForTemplateChange(python, fileWatcher) } catch (error) { reloadError = error.message }
      return {
        success: true,
        path: targetPath,
        version: Date.now(),
        reloaded,
        reloadError,
        region,
        metadata: {
          displayId: result.displayId,
          scaleFactor: result.scaleFactor,
          displayPhysicalSize: {
            width: result.displayPhysicalBounds.width,
            height: result.displayPhysicalBounds.height
          },
          templateSize: result.templateSize,
          selectedRegion: result.selectedRegion,
          capturedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}

export async function cleanupBagProcesses() {
  const stashing = stashProcess
  const scanning = batchScanProcess
  stashProcess = null
  batchScanProcess = null
  if (batchScanPreparationToken) loadingFeedback?.finish(batchScanPreparationToken)
  batchScanPreparationToken = null
  moduleRunning = false
  latestDetectionState = { ready: false, stashReady: false, allflameReceiverReady: false, foreground: false }
  interfaceDetection?.unregisterConsumer('bag')
  stopChild(stashing)
  stopChild(scanning)
  automationLock?.release('自动入库')
  automationLock?.release('批量背包扫描')
  session.reset()
  syncBagOverlay()
}
