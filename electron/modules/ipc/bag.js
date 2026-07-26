/** 背包模块 IPC：双界面检测、单会话自动触发及安全入库进程编排。 */

import { ipcMain, nativeImage, screen } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { app } from 'electron'
import { fileURLToPath } from 'node:url'
import {
  BagSessionController,
  createEventLineParser,
  describeDetectionExit,
  waitForDetectionStartup
} from '../bag/orchestrator.js'
import { savePngAtomically, assertBagTemplateTarget } from '../bag/templateCapture.js'
import { expandSearchRegion } from '../window/coordinates.js'
import { validateTemplateCaptureEnvironment } from '../../../src/utils/bagConfig.js'

let detectionProcess = null
let stashProcess = null
let latestConfig = null
let getMainWindowRef = null
const session = new BagSessionController()
const moduleDir = path.dirname(fileURLToPath(import.meta.url))

function send(channel, payload = {}) {
  const mainWindow = getMainWindowRef?.()
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload)
}

function runtimeConfig(config = {}) {
  return {
    templates: {
      stash_title: String(config.templates?.stashTitle || ''),
      inventory_title: String(config.templates?.inventoryTitle || ''),
      stash_region: config.templates?.stashRegion || {},
      inventory_region: config.templates?.inventoryRegion || {}
    },
    match_threshold: Number(config.matchThreshold ?? 0.8),
    inventory: config.inventory || {},
    blacklist: Array.isArray(config.blacklist) ? config.blacklist : [],
    delays: {
      mouse_move: Number(config.delays?.mouseMove ?? 260),
      action: Number(config.delays?.action ?? 65),
      clipboard_read: Number(config.delays?.clipboardRead ?? 100)
    }
  }
}

function validateConfig(config) {
  if (!config?.templates?.stash_title || !config?.templates?.inventory_title) return '请先配置仓库和背包标题模板'
  if (!config.inventory?.startPos || !config.inventory?.slotSize) return '背包网格配置不完整'
  return ''
}

function currentDisplays() {
  return screen.getAllDisplays().map((display) => ({
    id: String(display.id),
    scaleFactor: display.scaleFactor,
    physicalSize: {
      width: Math.round(display.bounds.width * display.scaleFactor),
      height: Math.round(display.bounds.height * display.scaleFactor)
    }
  }))
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
  if (!latestConfig) {
    session.finishStash()
    return { success: false, error: '背包模块尚未配置' }
  }
  const error = validateConfig(latestConfig)
  if (error) {
    session.finishStash()
    return { success: false, error }
  }

  let child
  try {
    const configPath = writeConfig(fileWatcher, 'bag_stash_config.json', latestConfig)
    child = spawnPython(python, 'stash', configPath)
    stashProcess = child
  } catch (error_) {
    session.finishStash()
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
    blacklistedSlots: 0, emptySlots: 0, unreadableSlots: 0, progress: 0
  })
  child.on('close', (code) => {
    const wasCurrent = stashProcess === child
    if (wasCurrent) stashProcess = null
    if (wasCurrent) {
      session.finishStash()
      if (!terminalEventSent) send('bag-stash-stopped', { reason: code === 0 ? 'process-ended' : 'process-exited', code })
    }
  })
  return { success: true, processId: child.pid, mode }
}

function startDetectionProcess(python, fileWatcher) {
  const configPath = writeConfig(fileWatcher, 'bag_detection_config.json', latestConfig)
  const child = spawnPython(python, 'detect', configPath)
  detectionProcess = child
  child.stdout.setEncoding('utf8')
  let terminalReason = ''
  child.stdout.on('data', createEventLineParser((event) => {
    if (detectionProcess !== child) return
    if (event.event === 'detection-state') {
      const shouldAutoStart = session.setReady(event.ready, event.foreground)
      send('bag-detection-match', { matched: session.ready && session.foreground, ...event })
      if (shouldAutoStart) {
        const result = startStashProcess(python, fileWatcher, 'auto')
        if (!result.success) send('bag-stash-stopped', { reason: result.error })
      }
    } else if (event.event === 'detection-error') {
      terminalReason = event.reason || '检测器报告错误'
      send('bag-detection-stopped', event)
    }
  }, (line) => console.log('[背包检测]', line)))
  const diagnostics = bindCommonProcessLogging(child, '背包检测')
  child.on('close', (code) => {
    const wasCurrent = detectionProcess === child
    if (wasCurrent) detectionProcess = null
    if (wasCurrent) {
      session.setReady(false, false)
      if (!terminalReason) send('bag-detection-stopped', {
        code,
        reason: describeDetectionExit({ code, stderr: diagnostics.stderr, spawnError: diagnostics.spawnError })
      })
    }
  })
  return {
    child,
    startup: waitForDetectionStartup(child, {
      getFailureReason: (code) => describeDetectionExit({
        code,
        terminalReason,
        stderr: diagnostics.stderr,
        spawnError: diagnostics.spawnError
      })
    })
  }
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
  if (!detectionProcess) return false
  const previous = detectionProcess
  detectionProcess = null
  stopChild(previous)
  session.reset()
  send('bag-detection-match', { matched: false, ready: false, reloading: true })
  const { child, startup } = startDetectionProcess(python, fileWatcher)
  try {
    await startup
    return true
  } catch (error) {
    if (detectionProcess === child) {
      detectionProcess = null
      stopChild(child)
    }
    session.reset()
    throw error
  }
}

export function registerBagHandlers(python, window, fileWatcher) {
  getMainWindowRef = window.getMainWindow

  ipcMain.handle('start-bag-detection', async (_event, config) => {
    try {
      if (detectionProcess) return { success: false, error: '检测进程已在运行中' }
      const captureValidation = validateCaptureConfig(config || {})
      if (captureValidation.error) return { success: false, error: captureValidation.error }
      latestConfig = runtimeConfig(config)
      const error = validateConfig(latestConfig)
      if (error) return { success: false, error }
      session.reset()
      const { child, startup } = startDetectionProcess(python, fileWatcher)
      await startup
      return { success: true, processId: child.pid, warnings: captureValidation.warnings }
    } catch (error) {
      if (detectionProcess) {
        const child = detectionProcess
        detectionProcess = null
        stopChild(child)
      }
      session.reset()
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('stop-bag-detection', async () => {
    const detecting = detectionProcess
    const stashing = stashProcess
    detectionProcess = null
    stashProcess = null
    stopChild(detecting)
    stopChild(stashing)
    session.reset()
    send('bag-detection-match', { matched: false, ready: false })
    return { success: true }
  })

  ipcMain.handle('start-bag-stash', async () => startStashProcess(python, fileWatcher, 'manual'))

  ipcMain.handle('stop-bag-stash', async () => {
    const child = stashProcess
    stashProcess = null
    stopChild(child)
    session.finishStash()
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
  const detecting = detectionProcess
  const stashing = stashProcess
  detectionProcess = null
  stashProcess = null
  stopChild(detecting)
  stopChild(stashing)
  session.reset()
}
