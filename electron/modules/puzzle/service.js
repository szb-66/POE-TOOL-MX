import { app, screen } from 'electron'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDisplayPhysicalBounds } from '../window/coordinates.js'
import { OPERATION_DELAY, pythonAutomationTiming } from '../../../src/utils/operationDelay.js'
import {
  normalizePuzzleRegionMetadata,
  normalizePuzzleTabPoints,
  validatePuzzleRegionEnvironment,
  validatePuzzleTabPoint
} from '../../../src/utils/puzzleConfig.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const AUTOMATION_OWNER = '海图自动放置'

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

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function codedError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
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

function restoreWindow(window) {
  if (!window || window.isDestroyed()) return
  if (window.isMinimized()) window.restore()
  window.show()
  window.focus()
}

export class PuzzleAnalysisService {
  constructor({ python, window, fileWatcher, getMainWindow, automationLock = null, overlay = null }) {
    this.python = python
    this.window = window
    this.fileWatcher = fileWatcher
    this.getMainWindow = getMainWindow
    this.automationLock = automationLock
    this.overlay = overlay
    this.child = null
    this.automationChild = null
    this.busy = false
    this.execution = {
      status: 'idle', currentIndex: -1, total: 9, completed: 0,
      source: null, target: null, turns: 0, reason: '', error: null
    }
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

  pythonPath() {
    const found = this.python.detectPythonPathWithModules?.(['cv2', 'mss', 'numpy'])
    if (!found) throw codedError('PYTHON_RUNTIME_MISSING', '未找到具备 cv2、mss、numpy 的内置 Python 运行时')
    return found
  }

  automationPythonPath() {
    const found = this.python.detectPythonPathWithModules?.(['cv2', 'mss', 'numpy', 'pynput'])
    if (!found) throw codedError('PYTHON_RUNTIME_MISSING', '未找到具备 cv2、mss、numpy、pynput 的内置 Python 运行时')
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
    const mainWindow = this.getMainWindow?.()
    try {
      mainWindow?.minimize()
      await sleep(500)
      const result = await this.window.pickScreenRegion({
        purpose: regionType === 'atlas' ? 'puzzle-atlas' : 'puzzle-inventory',
        minimumSize: regionType === 'atlas' ? { width: 60, height: 60 } : { width: 120, height: 200 }
      })
      if (result?.canceled) return result
      this.savePreview(regionType, result.png)
      return {
        canceled: false,
        type: regionType,
        selectedRegion: result.selectedRegion,
        displayId: result.displayId,
        scaleFactor: result.scaleFactor,
        displayPhysicalBounds: result.displayPhysicalBounds,
        capturedAt: new Date().toISOString(),
        previewDataUrl: this.readPreview(regionType)
      }
    } finally {
      restoreWindow(mainWindow)
    }
  }

  pickInventoryRegion() { return this.pickRegion('inventory') }

  pickAtlasRegion() { return this.pickRegion('atlas') }

  async pickInventoryTabPoint(page) {
    const mainWindow = this.getMainWindow?.()
    try {
      mainWindow?.minimize()
      await sleep(500)
      return await this.window.pickScreenCoordinate()
    } finally {
      restoreWindow(mainWindow)
    }
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
      this.automationChild = null
      this.setExecution({ status: 'completed', currentIndex: 8, completed: 9, reason: '', error: null }, event)
      this.overlay?.close?.()
      this.releaseAutomation()
    } else if (event.event === 'error') {
      this.automationChild = null
      const error = { code: event.code || 'AUTO_PLACEMENT_FAILED', message: event.reason || '海图自动放置失败', ...event }
      this.setExecution({ status: 'error', reason: error.message, error }, event)
      this.overlay?.close?.()
      this.releaseAutomation()
    }
  }

  startAutoPlacement({ inventoryRegionMetadata, atlasRegionMetadata, inventoryTabPoints, targets, sourceSlots, recognition, operationDelayMs = OPERATION_DELAY.default, adaptiveTiming = true, adaptiveTimeoutMs = 1000, fixedTiming = {}, resume = false } = {}) {
    if (this.automationChild || ['validating', 'running'].includes(this.execution.status)) {
      return { ...this.getAutoPlacementStatus(), success: false, error: { code: 'AUTO_PLACEMENT_BUSY', message: '海图自动放置正在运行' } }
    }
    const gate = this.automationLock?.acquire(AUTOMATION_OWNER) || { success: true }
    if (!gate.success) return { ...this.getAutoPlacementStatus(), success: false, error: { code: 'AUTOMATION_LOCKED', message: gate.error, owner: gate.owner } }
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
      const configPath = this.tempConfigPath().replace('puzzle-analysis-', 'puzzle-auto-place-')
      fs.writeFileSync(configPath, JSON.stringify({
        inventoryRegion: inventory.selectedRegion,
        inventoryTabPoints: tabPoints,
        atlasRegion: atlas.selectedRegion,
        displayBounds: atlasRegionMetadata?.displayPhysicalBounds || null,
        targets,
        sourceSlots,
        recognition,
        resume: Boolean(resume),
        ...pythonAutomationTiming({ operationDelayMs, adaptiveTiming, adaptiveTimeoutMs, fixedTiming }),
        templatesPath: this.templatesPath()
      }), 'utf8')
      const child = spawn(this.automationPythonPath(), [this.autoScriptPath(), '--config', configPath], {
        shell: false, windowsHide: true,
        cwd: path.dirname(this.autoScriptPath()),
        env: { ...process.env, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
        stdio: ['ignore', 'pipe', 'pipe']
      })
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
    this.setExecution({ status: 'stopped', reason: String(reason || 'user'), error: null }, { event: 'stopped', reason })
    this.overlay?.close?.()
    this.releaseAutomation()
    return { success: true, ...this.getAutoPlacementStatus() }
  }

  tempConfigPath() {
    const directory = this.fileWatcher?.getFilePaths?.().tempDir || os.tmpdir()
    fs.mkdirSync(directory, { recursive: true })
    return path.join(directory, `puzzle-analysis-${process.pid}-${Date.now()}.json`)
  }

  runAnalyzer(config) {
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
      let stdout = ''
      let stderr = ''
      child.stdout.setEncoding('utf8')
      child.stderr.setEncoding('utf8')
      child.stdout.on('data', chunk => { stdout += chunk })
      child.stderr.on('data', chunk => { stderr += chunk })
      child.once('error', reject)
      child.once('close', code => {
        this.child = null
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
    restoreWindow(mainWindow)
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('puzzle-analysis-updated', payload)
  }

  async analyze({ regionMetadata, recognition, inventoryTabPoints, pages, page = null, resetExecution = true } = {}) {
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
    const mainWindow = this.getMainWindow?.()
    try {
      const metadata = this.validateRegion(regionMetadata)
      if (!requestedPages.length) throw codedError('TAB_PAGE_INVALID', '仓库页码无效')
      const tabPoints = normalizePuzzleTabPoints(inventoryTabPoints)
      for (const currentPage of requestedPages) {
        const validation = validatePuzzleTabPoint(tabPoints[currentPage], metadata, currentPage, tabPoints[currentPage === 1 ? 2 : 1])
        if (!validation.valid) throw codedError(validation.code, validation.message)
      }
      const results = []
      for (const currentPage of requestedPages) {
        const result = await this.runAnalyzer({
          region: metadata.selectedRegion,
          templatesPath: this.templatesPath(),
          regionType: 'inventory',
          recognition,
          allowEmpty: true,
          requireGameForeground: true,
          page: currentPage,
          tabPoint: tabPoints[currentPage],
          tabSettleSeconds: 0.25
        })
        if (!result.success) {
          const payload = { ...result, page: currentPage }
          this.publish(payload)
          return payload
        }
        results.push({ ...result, page: currentPage })
      }
      const payload = results.length === 1
        ? { ...results[0], regionMetadata: metadata }
        : { success: true, pages: results, regionMetadata: metadata }
      this.publish(payload)
      return payload
    } catch (error) {
      const payload = { success: false, page: responsePage, error: { code: error.code || 'PUZZLE_ANALYSIS_FAILED', message: error.message || String(error) } }
      this.publish(payload)
      return payload
    } finally {
      this.busy = false
      restoreWindow(mainWindow)
    }
  }

  cleanup() {
    if (this.child && !this.child.killed) this.child.kill('SIGTERM')
    this.child = null
    this.busy = false
    if (this.automationChild) this.stopAutoPlacement('application-exit')
    else this.releaseAutomation()
    this.overlay?.close?.()
  }
}
