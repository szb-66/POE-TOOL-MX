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
import { normalizeOperationDelay } from '../../../src/utils/operationDelay.js'
import { normalizeEmptySlotThreshold } from '../../../src/utils/inventorySettings.js'
import { itemFootprintRegistry } from '../items/footprintRegistry.js'

let stashProcess = null
let latestConfig = null
let getMainWindowRef = null
let bagWindowApi = null
let interfaceDetection = null
let automationLock = null
let disposeDetectionState = null
let moduleRunning = false
const session = new BagSessionController()
const bagOverlayDrag = new OverlayDragSession()
const moduleDir = path.dirname(fileURLToPath(import.meta.url))

function send(channel, payload = {}) {
  const mainWindow = getMainWindowRef?.()
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload)
}

function currentOverlaySnapshot() {
  return createBagOverlaySnapshot({
    moduleEnabled: moduleRunning,
    ready: session.ready,
    foreground: session.foreground,
    stashing: session.stashing,
    showOnlyWhenReady: latestConfig?.showStashButtonOnlyWhenReady !== false
  })
}

function syncBagOverlay() {
  if (!bagWindowApi) return
  if (!moduleRunning) {
    bagWindowApi.closeBagStashOverlayWindow()
    return
  }
  bagWindowApi.updateBagStashOverlay(currentOverlaySnapshot())
}

function runtimeConfig(config = {}) {
  return {
    immediateStash: config.immediateStash !== false,
    showStashButtonOnlyWhenReady: config.showStashButtonOnlyWhenReady !== false,
    templates: {
      stash_title: String(config.templates?.stashTitle || ''),
      inventory_title: String(config.templates?.inventoryTitle || ''),
      stash_region: config.templates?.stashRegion || {},
      inventory_region: config.templates?.inventoryRegion || {}
    },
    match_threshold: Number(config.matchThreshold ?? 0.8),
    inventory: {
      ...(config.inventory || {}),
      emptySlotThreshold: normalizeEmptySlotThreshold(config.inventory?.emptySlotThreshold),
      layout: config.inventory?.layout || {}
    },
    blacklist: Array.isArray(config.blacklist) ? config.blacklist : [],
    operation_delay_ms: normalizeOperationDelay(config.operationDelayMs)
  }
}

function validateConfig(config) {
  if (!config?.templates?.stash_title || !config?.templates?.inventory_title) return '请先配置仓库和背包标题模板'
  if (!config.inventory?.startPos || !config.inventory?.slotSize) return '背包网格配置不完整'
  return ''
}

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
  const definitions = [
    ['仓库标题', 'stashTitle', 'stashRegion', 'stashCapture'],
    ['背包标题', 'inventoryTitle', 'inventoryRegion', 'inventoryCapture']
  ]
  for (const [label, pathKey, regionKey, captureKey] of definitions) {
    const result = validateTemplateCaptureEnvironment(label, config.templates?.[pathKey], config.templates?.[regionKey], config.templates?.[captureKey], displays)
    if (result.error) return { error: result.error, warnings }
    if (result.warning) warnings.push(result.warning)
    const metadata = config.templates?.[captureKey]
    if (metadata) {
      const image = nativeImage.createFromPath(String(config.templates[pathKey] || ''))
      const size = image.getSize()
      if (image.isEmpty() || size.width !== metadata.templateSize.width || size.height !== metadata.templateSize.height) {
        return { error: `${label}的模板尺寸与采集记录不一致，请重新框选`, warnings }
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

function spawnPython(python, mode, configPath) {
  const requiredModules = ['cv2', 'mss', 'numpy', 'pyperclip', 'pynput']
  const pythonPath = python.detectPythonPathWithModules?.(requiredModules) || python.detectPythonPath()
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

function startStashProcess(python, fileWatcher, mode) {
  const gate = mode === 'auto' ? session.beginAutomatic() : session.beginManual()
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
  const error = validateConfig(latestConfig)
  if (error) {
    session.finishStash()
    automationLock?.release('自动入库')
    return { success: false, error }
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

const templateRuntimeKeys = (type) => type === 'stashTitle'
  ? { path: 'stash_title', region: 'stash_region' }
  : { path: 'inventory_title', region: 'inventory_region' }

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
  disposeDetectionState?.()
  disposeDetectionState = interfaceDetection?.subscribe((state) => {
    if (!moduleRunning) return
    const shouldAutoStart = session.setReady(state.ready, state.foreground, latestConfig?.immediateStash !== false)
    send('bag-detection-match', { matched: session.ready && session.foreground, ...state })
    syncBagOverlay()
    if (!state.running && !state.reloading && state.reason) {
      send('bag-detection-stopped', { reason: state.reason })
    }
    if (shouldAutoStart) {
      const result = startStashProcess(python, fileWatcher, 'auto')
      if (!result.success) send('bag-stash-stopped', { reason: result.error })
    }
  })

  ipcMain.handle('start-bag-detection', async (_event, config) => {
    try {
      if (moduleRunning) return { success: true, shared: true }
      const captureValidation = validateCaptureConfig(config || {})
      if (captureValidation.error) return { success: false, error: captureValidation.error }
      latestConfig = runtimeConfig(config)
      const error = validateConfig(latestConfig)
      if (error) return { success: false, error }
      session.reset()
      if (!interfaceDetection) throw new Error('公共界面检测服务未初始化')
      await interfaceDetection.registerConsumer('bag', latestConfig)
      moduleRunning = true
      syncBagOverlay()
      return { success: true, shared: true, warnings: captureValidation.warnings }
    } catch (error) {
      interfaceDetection?.unregisterConsumer('bag')
      session.reset()
      moduleRunning = false
      syncBagOverlay()
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('stop-bag-detection', async () => {
    const stashing = stashProcess
    stashProcess = null
    moduleRunning = false
    interfaceDetection?.unregisterConsumer('bag')
    stopChild(stashing)
    automationLock?.release('自动入库')
    session.reset()
    syncBagOverlay()
    send('bag-detection-match', { matched: false, ready: false })
    return { success: true }
  })

  ipcMain.handle('start-bag-stash', async () => startStashProcess(python, fileWatcher, 'manual'))

  ipcMain.handle('update-bag-operation-delay', async (_event, value) => {
    const operationDelayMs = normalizeOperationDelay(value)
    if (latestConfig) latestConfig.operation_delay_ms = operationDelayMs
    return { success: true, operationDelayMs }
  })

  ipcMain.handle('update-bag-empty-slot-threshold', async (_event, value) => {
    const emptySlotThreshold = normalizeEmptySlotThreshold(value)
    if (latestConfig) latestConfig.inventory.emptySlotThreshold = emptySlotThreshold
    return { success: true, emptySlotThreshold }
  })

  ipcMain.handle('update-bag-preferences', async (_event, preferences = {}) => {
    const wasImmediate = latestConfig?.immediateStash !== false
    if (latestConfig) {
      latestConfig.immediateStash = preferences.immediateStash !== false
      latestConfig.showStashButtonOnlyWhenReady = preferences.showStashButtonOnlyWhenReady !== false
    }
    syncBagOverlay()
    if (moduleRunning && !wasImmediate && latestConfig?.immediateStash &&
        session.setReady(session.ready, session.foreground, true)) {
      const result = startStashProcess(python, fileWatcher, 'auto')
      if (!result.success) send('bag-stash-stopped', { reason: result.error })
    }
    return {
      success: true,
      immediateStash: latestConfig?.immediateStash ?? true,
      showStashButtonOnlyWhenReady: latestConfig?.showStashButtonOnlyWhenReady ?? true
    }
  })

  ipcMain.handle('update-bag-interface-config', async (_event, config = {}) => {
    if (latestConfig) {
      latestConfig.templates = {
        stash_title: String(config.templates?.stashTitle || ''),
        inventory_title: String(config.templates?.inventoryTitle || ''),
        stash_region: config.templates?.stashRegion || {},
        inventory_region: config.templates?.inventoryRegion || {}
      }
      latestConfig.match_threshold = Number(config.matchThreshold ?? 0.8)
    }
    return { success: true }
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

  ipcMain.handle('stop-bag-stash', async () => {
    const child = stashProcess
    stashProcess = null
    stopChild(child)
    session.finishStash()
    automationLock?.release('自动入库')
    syncBagOverlay()
    return { success: true }
  })

  ipcMain.handle('upload-bag-template', async (_event, sourcePath, type) => {
    try {
      if (stashProcess) throw new Error('入库进行中，暂时不能替换模板')
      assertBagTemplateTarget(type)
      const templateDir = path.join(app.getPath('userData'), 'templates')
      if (!fs.existsSync(templateDir)) fs.mkdirSync(templateDir, { recursive: true })
      const ext = path.extname(sourcePath)
      const fileName = type === 'stashTitle' ? `stash_title${ext}` : `inventory_title${ext}`
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
      const templateDir = path.join(app.getPath('userData'), 'templates')
      const targetPath = savePngAtomically(templateDir, type, result.png)
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
  stashProcess = null
  moduleRunning = false
  interfaceDetection?.unregisterConsumer('bag')
  stopChild(stashing)
  automationLock?.release('自动入库')
  session.reset()
  syncBagOverlay()
}
