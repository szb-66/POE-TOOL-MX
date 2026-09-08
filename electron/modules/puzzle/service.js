import { app, clipboard, screen } from 'electron'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDisplayPhysicalBounds } from '../window/coordinates.js'
import { OPERATION_DELAY, pythonAutomationTiming } from '../../../src/utils/operationDelay.js'
import {
  gridCellCenter,
  normalizePuzzleRegionMetadata,
  normalizePuzzleTabPoints,
  validatePuzzleRegionEnvironment,
  validatePuzzleTabPoint
} from '../../../src/utils/puzzleConfig.js'
import { computeBorderEdgeTargets } from '../../../src/utils/chartEdgeGeometry.js'
import { matchBorderMods, matchFragmentMods } from '../../../src/utils/chartModMatcher.js'
import { chartFragmentCopyProtocol } from '../priceCheck/chartRegions.js'
import {
  borderRecognitionResult,
  fragmentRecognitionResult,
  recognitionFailureResult
} from './recognitionFeedback.js'
import { PuzzleFailureEvidenceSession } from './failureEvidenceSession.js'
import { finalizeInventoryAnalysisResult, resolveFragmentCopy } from './fragmentRecognition.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const AUTOMATION_OWNER = '海图自动放置'
const MOD_PROBE_OWNER = '海图词缀探测'
const MOD_PROBE_MODULES = Object.freeze(['cv2', 'mss', 'numpy', 'pynput', 'pyperclip', 'rapidocr', 'onnxruntime'])

function parseEvents(onEvent, onLog) {
  let buffer = ''
  return chunk => {
    buffer += String(chunk)
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('EVENT ')) {
        if (line.trim()) onLog(line)
        continue
      }
      try { onEvent(JSON.parse(line.slice(6))) } catch { onLog(line) }
    }
  }
}

function terminate(child) {
  if (!child || child.killed) return
  child.kill('SIGTERM')
  setTimeout(() => { if (child.exitCode === null) child.kill('SIGKILL') }, 1200)
}

function codedError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function unknownFragmentMod(rawText = '') {
  return { status: 'unknown', mod: null, confidence: 0, rawText }
}

// 内部探测结果为多样本(texts 为字符串数组的数组)或旧式单样本(纯字符串数组),统一取首个样本。
function borderTextsFor(edge) {
  const texts = edge?.texts
  if (Array.isArray(texts) && texts.every(sample => Array.isArray(sample))) return texts[0] || []
  if (Array.isArray(texts) && texts.every(line => typeof line === 'string')) return texts
  return []
}

// 对单帧 OCR 文本执行共享匹配器;未命中时保留本次原文供悬停诊断。
function borderModResult(lines) {
  const match = matchBorderMods(lines)
  if (match.status === 'matched') {
    return { status: 'matched', mod: match.mod, confidence: match.confidence, rawTexts: lines }
  }
  return { status: 'unknown', mod: null, confidence: 0, rawTexts: lines }
}

function currentDisplays() {
  return screen.getAllDisplays().map(display => ({
    id: String(display.id),
    scaleFactor: Number(display.scaleFactor || 1),
    physicalBounds: getDisplayPhysicalBounds(
      display,
      process.platform,
      point => screen.dipToScreenPoint(point)
    )
  }))
}

export class PuzzleAnalysisService {
  constructor({ python, window, fileWatcher, getMainWindow, windowActivation, loadingFeedback, automationLock = null, overlay = null, feedbackOverlay = null, calibration = null, failureEvidence = null }) {
    this.python = python
    this.window = window
    this.fileWatcher = fileWatcher
    this.getMainWindow = getMainWindow
    this.windowActivation = windowActivation
    this.loadingFeedback = loadingFeedback
    this.automationLock = automationLock
    this.overlay = overlay
    this.feedbackOverlay = feedbackOverlay
    this.calibration = calibration
    this.failureEvidence = failureEvidence
    this.child = null
    this.automationChild = null
    this.modProbeChild = null
    this.automationClipboardSnapshots = new WeakMap()
    this.busy = false
    this.stopGeneration = 0
    this.execution = {
      status: 'idle', currentIndex: -1, total: 9, completed: 0,
      source: null, target: null, turns: 0, reason: '', error: null
    }
  }

  assertCurrentGeneration(generation, message) {
    if (generation !== this.stopGeneration) throw codedError('EMERGENCY_STOPPED', message)
  }

  calibrationSamples() {
    return this.calibration?.list?.().map(sample => ({
      kind: sample.kind,
      type: sample.type,
      labelMask: sample.labelMask,
      featureVersion: sample.featureVersion,
      featureVector: sample.featureVector
    })) || []
  }

  listCalibration() { return this.calibration?.listWithImages?.() || [] }

  saveCalibration(items = []) {
    if (!Array.isArray(items) || !items.length || items.length > 60) throw new Error('待保存校准素材无效')
    for (const item of items) this.calibration?.save?.(item)
    return this.listCalibration()
  }

  removeCalibration(id) {
    this.calibration?.remove?.(id)
    return this.listCalibration()
  }

  resetCalibration() {
    this.calibration?.reset?.()
    return []
  }

  scriptPath() {
    const candidates = app.isPackaged
      ? [path.join(process.resourcesPath, 'puzzle_analyzer.py')]
      : [path.resolve(moduleDir, '../../../src/assets/scripts/puzzle_analyzer.py')]
    const found = candidates.find(candidate => fs.existsSync(candidate))
    if (!found) throw codedError('ANALYZER_MISSING', '海图识别脚本不存在')
    return found
  }

  templatesPath() {
    const candidates = app.isPackaged
      ? [path.join(process.resourcesPath, 'puzzle_templates.json')]
      : [path.resolve(moduleDir, '../../assets/puzzle/templates.json')]
    const found = candidates.find(candidate => fs.existsSync(candidate))
    if (!found) throw codedError('TEMPLATES_MISSING', '海图识别模板不存在')
    return found
  }

  autoScriptPath() {
    const candidates = app.isPackaged
      ? [path.join(process.resourcesPath, 'puzzle_auto_place.py')]
      : [path.resolve(moduleDir, '../../../src/assets/scripts/puzzle_auto_place.py')]
    const found = candidates.find(candidate => fs.existsSync(candidate))
    if (!found) throw codedError('AUTO_SCRIPT_MISSING', '海图自动放置脚本不存在')
    return found
  }

  modProbeScriptPath() {
    const candidates = app.isPackaged
      ? [path.join(process.resourcesPath, 'chart_mods_probe.py')]
      : [path.resolve(moduleDir, '../../../src/assets/scripts/chart_mods_probe.py')]
    const found = candidates.find(candidate => fs.existsSync(candidate))
    if (!found) throw codedError('MOD_PROBE_SCRIPT_MISSING', '海图词缀探测脚本不存在')
    return found
  }

  modProbePythonPath() {
    const found = this.python.detectPythonPathWithModules?.([...MOD_PROBE_MODULES])
    if (!found) throw codedError('PYTHON_RUNTIME_MISSING', '未找到具备 cv2、mss、numpy、pynput、pyperclip、rapidocr 的内置 Python 运行时')
    return found
  }

  pythonPath() {
    const found = this.python.detectPythonPathWithModules?.(['cv2', 'mss', 'numpy'])
    if (!found) throw codedError('PYTHON_RUNTIME_MISSING', '未找到具备 cv2、mss、numpy 的内置 Python 运行时')
    return found
  }

  automationPythonPath() {
    const found = this.python.detectPythonPathWithModules?.(['cv2', 'mss', 'numpy', 'pynput', 'pyperclip'])
    if (!found) throw codedError('PYTHON_RUNTIME_MISSING', '未找到具备 cv2、mss、numpy、pynput、pyperclip 的内置 Python 运行时')
    return found
  }

  previewDirectory() {
    return path.join(app.getPath('userData'), 'puzzle-regions')
  }

  previewPath(type) {
    return path.join(this.previewDirectory(), `${type === 'atlas' ? 'atlas' : 'inventory'}.png`)
  }

  savePreview(type, png) {
    if (!png?.length) return false
    fs.mkdirSync(this.previewDirectory(), { recursive: true })
    fs.writeFileSync(this.previewPath(type), png)
    return true
  }

  readPreview(type) {
    try {
      const data = fs.readFileSync(this.previewPath(type))
      return `data:image/png;base64,${data.toString('base64')}`
    } catch {
      return ''
    }
  }

  getConfiguration({ inventoryRegionMetadata, atlasRegionMetadata } = {}) {
    const regionState = (metadata, type) => {
      const validation = validatePuzzleRegionEnvironment(metadata, currentDisplays(), type)
      return {
        configured: Boolean(normalizePuzzleRegionMetadata(metadata)),
        valid: validation.valid,
        code: validation.valid ? '' : validation.code,
        message: validation.valid ? '当前显示环境有效' : validation.message
      }
    }
    const previewFor = (metadata, type) =>
      normalizePuzzleRegionMetadata(metadata) ? this.readPreview(type) : ''
    return {
      previews: {
        inventory: previewFor(inventoryRegionMetadata, 'inventory'),
        atlas: previewFor(atlasRegionMetadata, 'atlas')
      },
      states: {
        inventory: regionState(inventoryRegionMetadata, 'inventory'),
        atlas: regionState(atlasRegionMetadata, 'atlas')
      }
    }
  }

  async pickRegion(type = 'inventory') {
    const regionType = type === 'atlas' ? 'atlas' : 'inventory'
    const result = await this.window.pickScreenRegion({
      purpose: regionType === 'atlas' ? 'puzzle-atlas' : 'puzzle-inventory',
      minimumSize: regionType === 'atlas' ? { width: 60, height: 60 } : { width: 120, height: 200 }
    })
    if (result?.canceled) return result
    if (result?.success === false) return result
    this.savePreview(regionType, result.png)
    return {
      success: true,
      canceled: false,
      type: regionType,
      selectedRegion: result.selectedRegion,
      displayId: result.displayId,
      scaleFactor: result.scaleFactor,
      displayPhysicalBounds: result.displayPhysicalBounds,
      capturedAt: new Date().toISOString(),
      previewDataUrl: this.readPreview(regionType)
    }
  }

  pickInventoryRegion() { return this.pickRegion('inventory') }

  pickAtlasRegion() { return this.pickRegion('atlas') }

  pickInventoryTabPoint(page) {
    return this.window.pickScreenCoordinate()
  }

  clearRegion(type = 'inventory') {
    const regionType = type === 'atlas' ? 'atlas' : 'inventory'
    try {
      const preview = this.previewPath(regionType)
      if (fs.existsSync(preview)) fs.unlinkSync(preview)
    } catch {
      // 预览文件不存在或删除失败不影响清空状态
    }
    return { success: true, type: regionType }
  }

  validateRegion(regionMetadata, type = 'inventory') {
    const validation = validatePuzzleRegionEnvironment(regionMetadata, currentDisplays(), type)
    if (!validation.valid) throw codedError(validation.code, validation.message)
    return validation.metadata
  }

  getAutoPlacementStatus() {
    return structuredClone(this.execution)
  }

  resetExecution() {
    if (this.automationChild) {
      return this.publishExecution({ event: 'reset-blocked' })
    }
    this.execution = {
      status: 'idle', currentIndex: -1, total: 9, completed: 0,
      source: null, target: null, turns: 0, reason: '', error: null
    }
    this.overlay?.close?.()
    this.releaseAutomation()
    return this.publishExecution({ event: 'reset' })
  }

  publishExecution(event = {}) {
    const payload = { ...this.execution, ...event }
    const mainWindow = this.getMainWindow?.()
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('puzzle-auto-placement-updated', payload)
    this.overlay?.update?.(payload)
    return payload
  }

  setExecution(patch, event = {}) {
    this.execution = { ...this.execution, ...patch }
    return this.publishExecution(event)
  }

  releaseAutomation() {
    this.automationLock?.release(AUTOMATION_OWNER)
  }

  captureAutomationClipboard() {
    try {
      return { valid: true, text: clipboard.readText() }
    } catch {
      return { valid: false, text: '' }
    }
  }

  restoreClipboardSnapshot(snapshot) {
    if (!snapshot?.valid) return
    try { clipboard.writeText(snapshot.text) } catch {}
  }

  restoreAutomationClipboard(child) {
    if (!child) return
    const snapshot = this.automationClipboardSnapshots.get(child)
    this.automationClipboardSnapshots.delete(child)
    this.restoreClipboardSnapshot(snapshot)
  }

  handleAutomationEvent(child, event) {
    if (this.automationChild !== child) return
    if (event.event === 'capture-start') {
      this.overlay?.hide?.(event.regionType)
      return
    }
    if (event.event === 'capture-end') {
      this.overlay?.show?.(event.regionType)
      return
    }
    if (event.event === 'capture-series-start') {
      this.overlay?.hide?.(event.regionType)
      return
    }
    if (event.event === 'capture-series-end') {
      this.overlay?.show?.(event.regionType)
      return
    }
    if (event.event === 'started') {
      this.setExecution({ status: 'running', total: Number(event.total || 9), completed: Number(event.completed || 0), reason: '', error: null }, event)
    } else if (event.event === 'source-page') {
      this.setExecution({
        status: 'running', currentIndex: Number(event.currentIndex), completed: Number(event.completed || 0),
        source: event.source || null
      }, event)
    } else if (event.event === 'step') {
      this.setExecution({
        status: 'running', currentIndex: Number(event.currentIndex), completed: Number(event.completed || 0),
        source: event.source || null, target: event.target || null, turns: Number(event.turns || 0),
        slots: Array.isArray(event.slots) ? event.slots : this.execution.slots
      }, event)
    } else if (event.event === 'step-completed') {
      this.setExecution({ currentIndex: Number(event.currentIndex), completed: Number(event.completed || 0) }, event)
    } else if (event.event === 'verification') {
      this.publishExecution(event)
    } else if (event.event === 'source-rotation-verification') {
      this.setExecution({
        source: event.source || this.execution.source,
        slots: Array.isArray(event.slots) && event.slots.length ? event.slots : this.execution.slots
      }, event)
    } else if (event.event === 'completed') {
      this.restoreAutomationClipboard(child)
      this.automationChild = null
      this.setExecution({ status: 'completed', currentIndex: 8, completed: 9, reason: '', error: null }, event)
      this.overlay?.close?.()
      this.releaseAutomation()
    } else if (event.event === 'error') {
      this.restoreAutomationClipboard(child)
      this.automationChild = null
      const error = { code: event.code || 'AUTO_PLACEMENT_FAILED', message: event.reason || '海图自动放置失败', ...event }
      this.setExecution({ status: 'error', reason: error.message, error }, event)
      this.overlay?.close?.()
      this.releaseAutomation()
    }
  }

  async startAutoPlacement({ inventoryRegionMetadata, atlasRegionMetadata, inventoryTabPoints, targets, sourceSlots, operationDelayMs = OPERATION_DELAY.default, fixedTiming = {}, resume = false } = {}) {
    if (this.automationChild || ['validating', 'running'].includes(this.execution.status)) {
      return { ...this.getAutoPlacementStatus(), success: false, error: { code: 'AUTO_PLACEMENT_BUSY', message: '海图自动放置正在运行' } }
    }
    const gate = this.automationLock?.acquire(AUTOMATION_OWNER) || { success: true }
    if (!gate.success) return { ...this.getAutoPlacementStatus(), success: false, error: { code: 'AUTOMATION_LOCKED', message: gate.error, owner: gate.owner } }
    let pendingClipboardSnapshot = null
    try {
      const inventory = this.validateRegion(inventoryRegionMetadata, 'inventory')
      const atlas = this.validateRegion(atlasRegionMetadata, 'atlas')
      if (!Array.isArray(targets) || targets.length !== 9 || targets.some(target => !(Number(target?.mask) & 15))) {
        throw codedError('PLAN_INVALID', '当前海图方案不完整，无法自动放置')
      }
      if (!Array.isArray(sourceSlots) || sourceSlots.length !== 9) {
        throw codedError('PLAN_INVALID', '当前海图来源不完整，无法自动放置')
      }
      const tabPoints = normalizePuzzleTabPoints(inventoryTabPoints)
      for (const page of new Set(sourceSlots.map(source => Number(source?.page || 1)))) {
        const validation = validatePuzzleTabPoint(tabPoints[page], inventoryRegionMetadata, page, tabPoints[page === 1 ? 2 : 1])
        if (!validation.valid) throw codedError(validation.code, validation.message)
      }
      const activation = await this.windowActivation?.activateGame({ source: 'puzzle-auto-placement' })
      if (!activation?.success) throw codedError(activation?.code || 'ACTIVATION_UNAVAILABLE', '无法激活游戏窗口')
      const configPath = this.tempConfigPath().replace('puzzle-analysis-', 'puzzle-auto-place-')
      fs.writeFileSync(configPath, JSON.stringify({
        inventoryRegion: inventory.selectedRegion,
        inventoryTabPoints: tabPoints,
        atlasRegion: atlas.selectedRegion,
        displayBounds: atlasRegionMetadata?.displayPhysicalBounds || null,
        targets,
        sourceSlots,
        calibrationSamples: this.calibrationSamples(),
        copyTypeProtocol: chartFragmentCopyProtocol(),
        copyTimeoutMs: 900,
        copySettleMs: 260,
        resume: Boolean(resume),
        ...pythonAutomationTiming({ operationDelayMs, fixedTiming }),
        templatesPath: this.templatesPath()
      }), 'utf8')
      pendingClipboardSnapshot = this.captureAutomationClipboard()
      const child = spawn(this.automationPythonPath(), [this.autoScriptPath(), '--config', configPath], {
        shell: false, windowsHide: true,
        cwd: path.dirname(this.autoScriptPath()),
        env: { ...process.env, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
        stdio: ['ignore', 'pipe', 'pipe']
      })
      this.automationClipboardSnapshots.set(child, pendingClipboardSnapshot)
      pendingClipboardSnapshot = null
      this.automationChild = child
      this.execution = { status: 'validating', currentIndex: -1, total: 9, completed: 0, source: null, target: null, turns: 0, reason: '', error: null }
      this.overlay?.create?.({ ...this.execution, inventoryRegion: inventory.selectedRegion, atlasRegion: atlas.selectedRegion, targets })
      let stderr = ''
      child.stdout.setEncoding('utf8')
      child.stderr.setEncoding('utf8')
      child.stdout.on('data', parseEvents(event => this.handleAutomationEvent(child, event), line => console.log('[海图自动放置]', line)))
      child.stderr.on('data', chunk => {
        stderr = `${stderr}${String(chunk)}`.slice(-4000)
        console.error('[海图自动放置]', String(chunk).trim())
      })
      child.once('error', error => this.failAutoPlacement(error.message, 'PROCESS_START_FAILED'))
      child.once('close', code => {
        try { fs.unlinkSync(configPath) } catch {}
        if (this.automationChild !== child) return
        this.automationChild = null
        if (['validating', 'running'].includes(this.execution.status)) {
          const detail = stderr.trim()
          this.failAutoPlacement(detail || `海图自动放置进程异常退出（${code}）`, 'PROCESS_EXITED')
        }
      })
      return { success: true, ...this.publishExecution({ event: 'starting' }) }
    } catch (error) {
      const child = this.automationChild
      this.automationChild = null
      if (child) {
        terminate(child)
        this.restoreAutomationClipboard(child)
      } else {
        this.restoreClipboardSnapshot(pendingClipboardSnapshot)
      }
      this.releaseAutomation()
      const payload = { code: error.code || 'AUTO_PLACEMENT_FAILED', message: error.message || String(error) }
      this.execution = { ...this.execution, status: 'error', reason: payload.message, error: payload }
      return { ...this.getAutoPlacementStatus(), success: false, error: payload }
    }
  }

  failAutoPlacement(reason, code = 'AUTO_PLACEMENT_FAILED') {
    const child = this.automationChild
    this.automationChild = null
    terminate(child)
    this.restoreAutomationClipboard(child)
    const error = { code, message: reason }
    this.setExecution({ status: 'error', reason, error }, { event: 'error', code, reason })
    this.overlay?.close?.()
    this.releaseAutomation()
    return { ...this.getAutoPlacementStatus(), success: false, error }
  }

  stopAutoPlacement(reason = 'user') {
    const child = this.automationChild
    this.automationChild = null
    terminate(child)
    this.restoreAutomationClipboard(child)
    this.setExecution({ status: 'stopped', reason: String(reason || 'user'), error: null }, { event: 'stopped', reason })
    this.overlay?.close?.()
    this.releaseAutomation()
    return { success: true, ...this.getAutoPlacementStatus() }
  }

  emergencyStop(reason = 'shortcut') {
    const stopped = []
    this.stopGeneration += 1
    if (this.child || (this.busy && !this.modProbeChild)) stopped.push({ id: 'puzzle-analysis', label: '海图识别' })
    if (this.modProbeChild) stopped.push({ id: 'puzzle-probe', label: '海图词缀探测' })
    terminate(this.child)
    terminate(this.modProbeChild)
    if (this.automationChild || ['validating', 'running'].includes(this.execution.status)) {
      this.stopAutoPlacement(reason)
      stopped.push({ id: 'puzzle-placement', label: '海图自动放入' })
    }
    return { success: true, stopped }
  }

  tempConfigPath() {
    const directory = this.fileWatcher?.getFilePaths?.().tempDir || os.tmpdir()
    fs.mkdirSync(directory, { recursive: true })
    return path.join(directory, `puzzle-analysis-${process.pid}-${Date.now()}.json`)
  }

  runAnalyzer(config, onStarted = null) {
    return new Promise((resolve, reject) => {
      const configPath = this.tempConfigPath()
      fs.writeFileSync(configPath, JSON.stringify(config), 'utf8')
      const child = spawn(this.pythonPath(), [this.scriptPath(), '--config', configPath], {
        shell: false,
        windowsHide: true,
        env: { ...process.env, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
        stdio: ['ignore', 'pipe', 'pipe']
      })
      this.child = child
      onStarted?.()
      let stdout = ''
      let stderr = ''
      child.stdout.setEncoding('utf8')
      child.stderr.setEncoding('utf8')
      child.stdout.on('data', chunk => { stdout += chunk })
      child.stderr.on('data', chunk => { stderr += chunk })
      child.once('error', reject)
      child.once('close', code => {
        if (this.child === child) this.child = null
        try { fs.unlinkSync(configPath) } catch {}
        const resultLine = stdout.split(/\r?\n/).find(line => line.startsWith('RESULT '))
        if (!resultLine) {
          reject(codedError('ANALYZER_OUTPUT_INVALID', stderr.trim() || `识别进程异常退出（${code}）`))
          return
        }
        try {
          resolve(JSON.parse(resultLine.slice(7)))
        } catch {
          reject(codedError('ANALYZER_OUTPUT_INVALID', '海图识别结果无法解析'))
        }
      })
    })
  }

  publish(payload) {
    const mainWindow = this.getMainWindow?.()
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('puzzle-analysis-updated', payload)
  }

  // 词缀探测期间的进度推送不恢复主窗口,避免把游戏窗口挤到后台。
  sendProgress(payload) {
    const mainWindow = this.getMainWindow?.()
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('puzzle-analysis-updated', payload)
  }

  feedbackDisplayBounds(metadata) {
    return normalizePuzzleRegionMetadata(metadata)?.displayPhysicalBounds || metadata?.displayPhysicalBounds || null
  }

  showFeedbackFailure({ sessionId = null, displayBounds = null, error, canceled = false }) {
    const result = recognitionFailureResult(error, canceled)
    if (sessionId) return this.feedbackOverlay?.showResult?.(sessionId, result) || false
    if (!displayBounds) return false
    return Boolean(this.feedbackOverlay?.showImmediateResult?.({ displayBounds, ...result }))
  }

  mapProbeEvent(event) {
    if (event?.event === 'cell-copied') {
      return { event: 'mods-progress', stage: 'copy', index: Number(event.index || 0), total: Number(event.total || 0) }
    }
    if (event?.event === 'edge-scanned') {
      return { event: 'mods-progress', stage: 'border', index: Number(event.index || 0), total: Number(event.total || 0) }
    }
    return null
  }

  runProbe(config, feedbackSessionId = null, onStarted = null) {
    return new Promise((resolve, reject) => {
      const configPath = this.tempConfigPath().replace('puzzle-analysis-', 'chart-mods-probe-')
      fs.writeFileSync(configPath, JSON.stringify(config), 'utf8')
      const child = spawn(this.modProbePythonPath(), [this.modProbeScriptPath(), '--config', configPath], {
        shell: false,
        windowsHide: true,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1',
          OC_DISABLE_DOT_ACCESS_WARNING: '1'
        },
        stdio: ['ignore', 'pipe', 'pipe']
      })
      this.modProbeChild = child
      onStarted?.()
      let buffer = ''
      let resultLine = ''
      let stderr = ''
      child.stdout.setEncoding('utf8')
      child.stderr.setEncoding('utf8')
      const consumeLine = line => {
        if (line.startsWith('RESULT ')) {
          resultLine = line
          return
        }
        if (!line.startsWith('EVENT ')) return
        try {
          const progress = this.mapProbeEvent(JSON.parse(line.slice(6)))
          if (progress) {
            this.sendProgress(progress)
            this.feedbackOverlay?.updateProgress?.(feedbackSessionId, {
              stage: progress.stage,
              current: progress.index,
              total: progress.total
            })
          }
        } catch {
          // 单条进度事件解析失败不影响识别流程
        }
      }
      child.stdout.on('data', chunk => {
        buffer += chunk
        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() || ''
        for (const line of lines) consumeLine(line)
      })
      child.stderr.on('data', chunk => { stderr += chunk })
      child.once('error', reject)
      child.once('close', code => {
        if (this.modProbeChild === child) this.modProbeChild = null
        try { fs.unlinkSync(configPath) } catch {}
        if (!resultLine && buffer.trim()) consumeLine(buffer.trim())
        if (!resultLine) {
          const detail = String(stderr || '').trim().slice(-2000)
          reject(codedError('MOD_PROBE_OUTPUT_INVALID', detail || `词缀探测进程异常退出（${code}）`))
          return
        }
        try {
          resolve(JSON.parse(resultLine.slice(7)))
        } catch {
          reject(codedError('MOD_PROBE_OUTPUT_INVALID', '词缀探测结果无法解析'))
        }
      })
    })
  }

  emptyProbeStats(skipped = false, reason = '') {
    return { attempted: 0, matched: 0, unveiled: 0, unknown: 0, skipped, reason }
  }

  async probeFragmentMods({ inventoryMetadata, tabPoints, analysisResults, feedbackSessionId = null }) {
    const probeGeneration = this.stopGeneration
    const fragmentStats = this.emptyProbeStats()
    const copyCells = []
    for (const result of analysisResults || []) {
      const page = Number(result?.page || 1)
      for (const slot of result.slots || []) {
        if (!slot.candidate) continue
        const center = inventoryMetadata?.selectedRegion
          ? gridCellCenter(inventoryMetadata.selectedRegion, 'inventory', slot.row, slot.column)
          : { x: 0, y: 0 }
        copyCells.push({ page, key: `${page}:${slot.row}:${slot.column}`, x: center.x, y: center.y, slot })
      }
    }
    const finalize = () => {
      for (const result of analysisResults || []) finalizeInventoryAnalysisResult(result)
    }
    const fragmentMods = {}
    for (const cell of copyCells) fragmentMods[cell.key] = unknownFragmentMod()
    if (!inventoryMetadata?.selectedRegion) {
      fragmentStats.skipped = true
      fragmentStats.reason = 'REGION_REQUIRED'
      fragmentStats.unknown = copyCells.length
      this.showFeedbackFailure({
        sessionId: feedbackSessionId,
        displayBounds: inventoryMetadata?.displayPhysicalBounds,
        error: codedError('REGION_REQUIRED', '请先框选碎片仓库区域')
      })
      finalize()
      return { fragmentMods, fragmentProbe: fragmentStats, borderMods: null, borderProbe: this.emptyProbeStats(true, 'SKIPPED_BY_REQUEST') }
    }
    const gate = this.automationLock?.acquire(MOD_PROBE_OWNER) || { success: true }
    if (!gate.success) {
      fragmentStats.skipped = true
      fragmentStats.reason = gate.error
      fragmentStats.unknown = copyCells.length
      this.showFeedbackFailure({
        sessionId: feedbackSessionId,
        displayBounds: inventoryMetadata.displayPhysicalBounds,
        error: codedError('AUTOMATION_LOCKED', gate.error)
      })
      finalize()
      return { fragmentMods, fragmentProbe: fragmentStats, borderMods: null, borderProbe: this.emptyProbeStats(true, 'SKIPPED_BY_REQUEST') }
    }
    try {
      this.overlay?.close?.()
      try {
        if (copyCells.length) {
          fragmentStats.attempted = copyCells.length
          const pages = [...new Set(copyCells.map(cell => cell.page))].map(page => ({
            page,
            tabPoint: tabPoints[page] || null,
            cells: copyCells.filter(cell => cell.page === page).map(cell => ({ key: cell.key, x: cell.x, y: cell.y }))
          }))
          const copyResponse = await this.runProbe({
            mode: 'copy', pages, copyTimeoutMs: 900, settleMs: 260
          }, feedbackSessionId)
          if (copyResponse?.success === false) {
            fragmentStats.skipped = true
            fragmentStats.reason = copyResponse?.error?.message || '碎片词缀复制失败'
            fragmentStats.unknown = copyCells.length
            this.showFeedbackFailure({
              sessionId: feedbackSessionId,
              displayBounds: inventoryMetadata.displayPhysicalBounds,
              error: copyResponse?.error || codedError('MOD_PROBE_FAILED', fragmentStats.reason)
            })
          } else {
            const retryCells = copyCells.filter(cell => {
              const text = copyResponse?.texts?.[cell.key] || ''
              return !text || matchFragmentMods(text.split(/\r?\n/)).status === 'unknown'
            })
            let retryTexts = {}
            if (retryCells.length && probeGeneration === this.stopGeneration) {
              const retryPages = pages.map(page => ({ ...page,
                cells: page.cells.filter(cell => retryCells.some(candidate => candidate.key === cell.key))
              })).filter(page => page.cells.length)
              try {
                const retry = await this.runProbe({ mode: 'copy', pages: retryPages,
                  copyTimeoutMs: 900, settleMs: 260 }, feedbackSessionId)
                if (retry?.success !== false) retryTexts = retry?.texts || {}
              } catch {
                // Retry failure must not discard results from the first copy pass.
                this.assertCurrentGeneration(probeGeneration, '海图识别已紧急停止')
              }
            }
            this.assertCurrentGeneration(probeGeneration, '海图识别已紧急停止')
            for (const cell of copyCells) {
              const text = copyResponse?.texts?.[cell.key] || ''
              Object.assign(cell.slot, resolveFragmentCopy(cell.slot, text))
              const retryText = retryTexts[cell.key] || ''
              if (!cell.slot.type && retryText) Object.assign(cell.slot, resolveFragmentCopy(cell.slot, retryText))
              const modText = retryText || text
              const match = modText ? matchFragmentMods(modText.split(/\r?\n/)) : { status: 'unknown', confidence: 0 }
              fragmentMods[cell.key] = {
                status: match.status,
                mod: match.mod || null,
                confidence: match.confidence || 0,
                rawText: modText ? modText.slice(0, 600) : ''
              }
              if (match.status === 'matched') fragmentStats.matched += 1
              else if (match.status === 'unveiled') fragmentStats.unveiled += 1
              else fragmentStats.unknown += 1
            }
          }
        }
      } catch (copyError) {
        fragmentStats.skipped = true
        fragmentStats.reason = String(copyError?.message || copyError)
        fragmentStats.unknown = copyCells.length
        this.showFeedbackFailure({
          sessionId: feedbackSessionId,
          displayBounds: inventoryMetadata.displayPhysicalBounds,
          error: copyError,
          canceled: probeGeneration !== this.stopGeneration || copyError?.code === 'EMERGENCY_STOPPED'
        })
      }
      finalize()
      return { fragmentMods, fragmentProbe: fragmentStats, borderMods: null, borderProbe: this.emptyProbeStats(true, 'SKIPPED_BY_REQUEST') }
    } finally {
      this.automationLock?.release(MOD_PROBE_OWNER)
    }
  }

  // 无锁的边缘 OCR 执行体:由 probeBorderMods 在持锁后调用。
  async runBorderProbe(normalizeAtlas, feedbackSessionId = null, onStarted = null) {
    const borderStats = this.emptyProbeStats()
    const edges = computeBorderEdgeTargets(normalizeAtlas.selectedRegion, normalizeAtlas.displayPhysicalBounds)
    const borderMods = {}
    if (edges.length) {
      borderStats.attempted = edges.length
      for (const edge of edges) {
        borderMods[edge.id] = { status: 'unknown', mod: null, confidence: 0, rawTexts: [] }
      }
      const hoverRegion = {
        width: 800, height: 800, offsetY: 0,
        scaleFactor: normalizeAtlas.scaleFactor,
        displayBounds: normalizeAtlas.displayPhysicalBounds
      }
      const borderResponse = await this.runProbe({
        mode: 'border', edges,
        hoverRegion,
        settleMs: 300, ocrMinConfidence: 0.5
      }, feedbackSessionId, onStarted)
      if (borderResponse?.success === false) {
        throw codedError('BORDER_PROBE_FAILED', borderResponse?.error?.message || '边缘词缀识别失败')
      }
      for (const edge of edges) {
        borderMods[edge.id] = borderModResult(borderTextsFor(borderResponse?.edges?.[edge.id]))
      }
      for (const value of Object.values(borderMods)) {
        if (value.status === 'matched') borderStats.matched += 1
        else borderStats.unknown += 1
      }
    }
    return { borderMods, borderProbe: borderStats }
  }

  // 独立边缘词缀识别:仅重新识别 12 段外边缘,不重复碎片形状与碎片词缀识别。
  async probeBorderMods({ atlasRegionMetadata } = {}) {
    const displayBounds = this.feedbackDisplayBounds(atlasRegionMetadata)
    const fail = (code, message, reason = code, extra = {}) => {
      const error = { code, message, ...extra }
      this.showFeedbackFailure({ displayBounds, error })
      return { borderMods: {}, borderProbe: this.emptyProbeStats(true, reason), success: false, error }
    }
    if (this.busy) return fail('ANALYSIS_BUSY', '海图识别正在进行，请稍候')
    if (this.automationChild) return fail('AUTO_PLACEMENT_BUSY', '海图自动放置期间不能识别边缘词缀')
    const normalizeAtlas = normalizePuzzleRegionMetadata(atlasRegionMetadata)
    if (!normalizeAtlas?.selectedRegion) {
      return fail('REGION_REQUIRED', '请先框选 3×3 海图区')
    }
    const gate = this.automationLock?.acquire(MOD_PROBE_OWNER) || { success: true }
    if (!gate.success) {
      return fail('AUTOMATION_LOCKED', gate.error, gate.error, { owner: gate.owner })
    }
    const stopGeneration = this.stopGeneration
    let preparationToken = null
    let feedbackSessionId = null
    let automationStarted = false
    try {
      this.overlay?.close?.()
      const activation = await this.windowActivation?.activateGame({ source: 'puzzle-border-probe' })
      if (!activation?.success) throw codedError(activation?.code || 'ACTIVATION_UNAVAILABLE', '无法激活游戏窗口')
      preparationToken = this.loadingFeedback?.begin('puzzle.border', { owner: MOD_PROBE_OWNER }) || null
      this.loadingFeedback?.finish(preparationToken)
      feedbackSessionId = this.feedbackOverlay?.showRunning?.({
        displayBounds: normalizeAtlas.displayPhysicalBounds,
        stage: 'border',
        current: 0,
        total: 12
      }) || null
      const result = await this.runBorderProbe(normalizeAtlas, feedbackSessionId, () => { automationStarted = true })
      if (stopGeneration !== this.stopGeneration) throw codedError('EMERGENCY_STOPPED', '海图词缀探测已紧急停止')
      console.log('[海图边缘词缀]', JSON.stringify({ borderProbe: result.borderProbe }))
      this.feedbackOverlay?.showResult?.(feedbackSessionId, borderRecognitionResult(result.borderProbe))
      return { ...result, success: true }
    } catch (error) {
      const canceled = stopGeneration !== this.stopGeneration || error.code === 'EMERGENCY_STOPPED'
      this.showFeedbackFailure({ sessionId: feedbackSessionId, displayBounds, error, canceled })
      return {
        borderMods: {},
        borderProbe: this.emptyProbeStats(true, String(error?.message || error)),
        success: false,
        canceled,
        error: {
          code: canceled ? 'EMERGENCY_STOPPED' : 'BORDER_PROBE_FAILED',
          message: canceled ? '海图词缀探测已紧急停止' : String(error?.message || error)
        }
      }
    } finally {
      this.loadingFeedback?.finish(preparationToken)
      this.automationLock?.release(MOD_PROBE_OWNER)
      if (automationStarted) await this.windowActivation?.activateMain({ source: 'puzzle-border-probe' })
    }
  }

  async analyze({ regionMetadata, inventoryTabPoints, pages, page = null, resetExecution = true, probeMods = true } = {}) {
    const requestedPages = Array.isArray(pages)
      ? [...new Set(pages.map(value => Number(value)).filter(value => value === 1 || value === 2))].sort((left, right) => left - right)
      : [1, 2].includes(Number(page)) ? [Number(page)] : [1, 2]
    const responsePage = requestedPages.length === 1 ? requestedPages[0] : null
    if (this.automationChild) return { success: false, page: responsePage, error: { code: 'AUTO_PLACEMENT_BUSY', message: '海图自动放置期间不能重新识别' } }
    if (this.busy) return { success: false, page: responsePage, error: { code: 'ANALYSIS_BUSY', message: '海图识别正在进行，请稍候' } }
    if (resetExecution) {
      this.execution = { status: 'idle', currentIndex: -1, total: 9, completed: 0, source: null, target: null, turns: 0, reason: '', error: null }
      this.overlay?.close?.()
      this.releaseAutomation()
      this.publishExecution({ event: 'reset' })
    }
    this.busy = true
    const stopGeneration = this.stopGeneration
    const displayBounds = this.feedbackDisplayBounds(regionMetadata)
    let feedbackSessionId = null
    let automationStarted = false
    let preparationToken = null
    const evidenceSession = new PuzzleFailureEvidenceSession(this.failureEvidence)
    try {
      const metadata = this.validateRegion(regionMetadata)
      if (!requestedPages.length) throw codedError('TAB_PAGE_INVALID', '仓库页码无效')
      const tabPoints = normalizePuzzleTabPoints(inventoryTabPoints)
      for (const currentPage of requestedPages) {
        const validation = validatePuzzleTabPoint(tabPoints[currentPage], metadata, currentPage, tabPoints[currentPage === 1 ? 2 : 1])
        if (!validation.valid) throw codedError(validation.code, validation.message)
      }
      const activation = await this.windowActivation?.activateGame({ source: 'puzzle-analysis' })
      if (!activation?.success) throw codedError(activation?.code || 'ACTIVATION_UNAVAILABLE', '无法激活游戏窗口')
      preparationToken = this.loadingFeedback?.begin('puzzle.analysis', { owner: 'puzzle-analysis' }) || null
      this.loadingFeedback?.finish(preparationToken)
      const evidenceWorkspace = await evidenceSession.start()
      feedbackSessionId = this.feedbackOverlay?.showRunning?.({
        displayBounds: metadata.displayPhysicalBounds,
        stage: 'shape',
        current: 0,
        total: requestedPages.length
      }) || null
      const results = []
      for (const [pageIndex, currentPage] of requestedPages.entries()) {
        this.assertCurrentGeneration(stopGeneration, '海图识别已紧急停止')
        this.feedbackOverlay?.updateProgress?.(feedbackSessionId, {
          stage: 'shape',
          current: pageIndex + 1,
          total: requestedPages.length
        })
        const result = await this.runAnalyzer({
          region: metadata.selectedRegion,
          displayBounds: metadata.displayPhysicalBounds,
          templatesPath: this.templatesPath(),
          regionType: 'inventory',
          calibrationSamples: this.calibrationSamples(),
          allowEmpty: true,
          requireGameForeground: true,
          page: currentPage,
          tabPoint: tabPoints[currentPage],
          tabSettleSeconds: 0.25,
          ...(evidenceWorkspace ? {
            evidenceId: evidenceWorkspace.evidenceId,
            evidenceDirectory: evidenceWorkspace.directory
          } : {})
        }, () => { automationStarted = true })
        const publicResult = evidenceSession.consume(result)
        this.assertCurrentGeneration(stopGeneration, '海图识别已紧急停止')
        if (!publicResult.success) {
          if (evidenceWorkspace) await evidenceSession.commitFailure()
          const payload = { ...publicResult, page: currentPage }
          this.showFeedbackFailure({
            sessionId: feedbackSessionId,
            displayBounds: metadata.displayPhysicalBounds,
            error: publicResult.error || codedError('PUZZLE_ANALYSIS_FAILED', '碎片形状识别失败')
          })
          this.publish(payload)
          return payload
        }
        results.push({ ...publicResult, page: currentPage })
      }
      const candidateTotal = results.reduce((total, result) => (
        total + (result.slots || []).filter(slot => slot?.candidate).length
      ), 0)
      this.sendProgress({ event: 'mods-progress', stage: 'copy', index: 0, total: candidateTotal, starting: true })
      this.feedbackOverlay?.updateProgress?.(feedbackSessionId, {
        stage: 'copy',
        current: 0,
        total: candidateTotal
      })
      this.assertCurrentGeneration(stopGeneration, '海图识别已紧急停止')
      const mods = probeMods
        ? await this.probeFragmentMods({
            inventoryMetadata: metadata,
            tabPoints,
            analysisResults: results,
            feedbackSessionId
          })
        : {
            fragmentMods: null,
            borderMods: null,
            fragmentProbe: this.emptyProbeStats(true, 'SKIPPED_BY_REQUEST'),
            borderProbe: this.emptyProbeStats(true, 'SKIPPED_BY_REQUEST')
          }
      this.assertCurrentGeneration(stopGeneration, '海图识别已紧急停止')
      console.log('[海图碎片词缀探测]', JSON.stringify({ fragmentProbe: mods.fragmentProbe }))
      const payload = results.length === 1
        ? { ...results[0], regionMetadata: metadata, ...mods }
        : { success: true, pages: results, regionMetadata: metadata, ...mods }
      this.feedbackOverlay?.showResult?.(
        feedbackSessionId,
        fragmentRecognitionResult(mods.fragmentProbe, candidateTotal)
      )
      await evidenceSession.discard()
      this.publish(payload)
      return payload
    } catch (error) {
      const canceled = stopGeneration !== this.stopGeneration || error.code === 'EMERGENCY_STOPPED'
      const payload = {
        success: false,
        canceled,
        page: responsePage,
        error: {
          code: canceled ? 'EMERGENCY_STOPPED' : (error.code || 'PUZZLE_ANALYSIS_FAILED'),
          message: canceled ? '海图识别已紧急停止' : (error.message || String(error))
        }
      }
      this.showFeedbackFailure({ sessionId: feedbackSessionId, displayBounds, error, canceled })
      this.publish(payload)
      return payload
    } finally {
      this.loadingFeedback?.finish(preparationToken)
      await evidenceSession.discard()
      this.busy = false
      if (automationStarted) await this.windowActivation?.activateMain({ source: 'puzzle-analysis' })
    }
  }

  cleanup() {
    if (this.child && !this.child.killed) this.child.kill('SIGTERM')
    this.child = null
    if (this.modProbeChild && !this.modProbeChild.killed) this.modProbeChild.kill('SIGTERM')
    this.modProbeChild = null
    this.busy = false
    if (this.automationChild) this.stopAutoPlacement('application-exit')
    else this.releaseAutomation()
    this.overlay?.close?.()
    this.feedbackOverlay?.close?.()
  }
}
