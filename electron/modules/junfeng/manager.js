import { app, screen } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { spawnOperationProcess } from '../elevatedAutomation/index.js'
import { fileURLToPath } from 'node:url'
import { OPERATION_DELAY, pythonAutomationTiming } from '../../../src/utils/operationDelay.js'
import { normalizeJunfengRegion, validateJunfengGridEnvironment } from '../../../src/utils/junfengConfig.js'
import { validateTemplateCaptureEnvironment } from '../../../src/utils/bagConfig.js'
import { getDisplayPhysicalBounds } from '../window/coordinates.js'
import { normalizeJunfengProgress } from './progress.js'
import { itemFootprintRegistry } from '../items/footprintRegistry.js'
import { resolveSlotHighlightWeightsPath } from '../stashPickup/slotHighlightWeights.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const OWNER = '君锋镇取出高亮'
const REQUIRED_MODULES = Object.freeze(['mss', 'numpy', 'pynput', 'pyperclip'])

function configurationError(message, failureCode, configurationIssueId, configurationIssues = []) {
  return Object.assign(new Error(message), { failureCode, configurationIssueId, configurationIssues })
}

function eventError(event, fallback) {
  return Object.assign(new Error(event?.reason || fallback), {
    failureCode: String(event?.failureCode || ''),
    configurationIssueId: String(event?.configurationIssueId || '')
  })
}

function stopChild(child) {
  if (!child || child.killed) return
  child.kill('SIGTERM')
  setTimeout(() => { if (child.exitCode === null) child.kill('SIGKILL') }, 1200)
}

function parser(onEvent, onLog) {
  let buffer = ''
  return chunk => {
    buffer += String(chunk)
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('EVENT ')) { if (line.trim()) onLog(line); continue }
      try { onEvent(JSON.parse(line.slice(6))) } catch { onLog(line) }
    }
  }
}

export class JunfengHighlightManager {
  constructor({ python, fileWatcher, getMainWindow, windowActivation, loadingFeedback, interfaceDetection, automationLock, onStatusChange }) {
    this.python = python
    this.fileWatcher = fileWatcher
    this.getMainWindow = getMainWindow
    this.windowActivation = windowActivation
    this.loadingFeedback = loadingFeedback
    this.interfaceDetection = interfaceDetection
    this.automationLock = automationLock
    this.onStatusChange = onStatusChange
    this.runtime = { enabled: false, gridRegion: null, grid: { columns: 12, rows: 11 }, operationDelayMs: OPERATION_DELAY.default }
    this.child = null
    this.preparationToken = null
    this.status = this.initialStatus()
    this.disposeDetection = interfaceDetection?.subscribe(state => {
      if (this.status.status === 'running' && !state.foreground) {
        this.stop('game-not-foreground')
      }
    })
  }

  initialStatus() {
    return {
      status: 'idle', candidateItems: 0, processedItems: 0, remainingItems: 0,
      pickedItems: 0, uncertainCells: 0, reason: '', modelVersion: '',
      failureCode: '', configurationIssueId: ''
    }
  }

  scriptPath() {
    const candidates = app.isPackaged
      ? [path.join(process.resourcesPath, 'junfeng_highlight_pickup.py')]
      : [path.resolve(moduleDir, '../../../src/assets/scripts/junfeng_highlight_pickup.py')]
    const found = candidates.find(fs.existsSync)
    if (!found) throw new Error('君锋镇取件脚本不存在')
    return found
  }

  weightsPath() {
    return resolveSlotHighlightWeightsPath({
      isPackaged: app.isPackaged,
      resourcesPath: process.resourcesPath
    })
  }

  pythonPath() {
    const found = this.python.detectPythonPathWithModules?.([...REQUIRED_MODULES]) || this.python.detectPythonPath?.()
    if (!found) throw new Error('未找到君锋镇识别所需 Python 运行时')
    return found
  }

  async resolvePythonPath() {
    if (typeof this.python.resolvePythonRuntimeAsync === 'function') {
      const resolved = await this.python.resolvePythonRuntimeAsync([...REQUIRED_MODULES])
      if (resolved?.path) return resolved.path
    }
    return this.pythonPath()
  }

  setRuntime(runtime = {}) {
    const previousGrid = JSON.stringify(this.runtime.gridRegion || null)
    this.runtime = { ...this.runtime, ...structuredClone(runtime) }
    if (this.status.status === 'running' && previousGrid !== JSON.stringify(this.runtime.gridRegion || null)) {
      this.stop('grid-changed')
    }
    this.onStatusChange?.()
    return this.getStatus()
  }

  ensureReady({ modelRequired = true, requireReward = true } = {}) {
    const detection = this.interfaceDetection?.getState?.() || {}
    if (!this.runtime.enabled) throw new Error('君锋镇模块未启用')
    const configuration = this.getConfigurationAvailability()
    if (!configuration.ready) {
      throw configurationError(
        configuration.reason,
        configuration.failureCode,
        configuration.configurationIssueId,
        configuration.configurationIssues
      )
    }
    if (requireReward && !detection.rewardDetected) throw new Error('未检测到君锋镇奖励标题')
    if (modelRequired) {
      const availability = this.getAvailability()
      if (!availability.ready) throw new Error(availability.reason)
    }
  }

  getAvailability() {
    const configuration = this.getConfigurationAvailability()
    if (!configuration.ready) return configuration
    const weights = this.weightsPath()
    if (!fs.existsSync(weights)) {
      return { ready: false, reason: '高亮识别权重文件不存在' }
    }
    return { ready: true, reason: '', modelVersion: 'slot-highlight-v2' }
  }

  currentDisplays() {
    return screen.getAllDisplays().map(display => {
      const physicalBounds = getDisplayPhysicalBounds(
        display,
        process.platform,
        point => screen.dipToScreenPoint?.(point) || point
      )
      return {
        id: String(display.id),
        scaleFactor: Number(display.scaleFactor || 1),
        physicalSize: { width: physicalBounds.width, height: physicalBounds.height },
        physicalBounds
      }
    })
  }

  getConfigurationAvailability(runtime = this.runtime) {
    const issues = []
    const gridAvailability = this.getGridAvailability(runtime)
    if (!gridAvailability.ready) {
      issues.push({
        failureCode: 'REGION_INVALID',
        configurationIssueId: 'junfeng.grid',
        message: gridAvailability.reason
      })
    }
    const templates = runtime.templates || {}
    const displays = this.currentDisplays()
    const definitions = [
      ['背包标题', 'inventoryTitle', 'inventoryRegion', 'inventoryCapture', 'template.inventory-title'],
      ['君锋镇奖励标题', 'junfengRewardTitle', 'junfengRewardRegion', 'junfengRewardCapture', 'template.junfeng-reward-title']
    ]
    for (const [label, pathKey, regionKey, captureKey, configurationIssueId] of definitions) {
      const result = validateTemplateCaptureEnvironment(
        label,
        templates[pathKey],
        templates[regionKey],
        templates[captureKey],
        displays
      )
      if (result.error) {
        issues.push({ failureCode: 'TEMPLATE_INVALID', configurationIssueId, message: result.error })
      }
    }
    if (issues.length > 0) {
      return {
        ready: false,
        reason: issues.map(item => item.message).join('；'),
        failureCode: issues[0].failureCode,
        configurationIssueId: issues[0].configurationIssueId,
        configurationIssues: issues
      }
    }
    return { ready: true, reason: '' }
  }

  getGridAvailability(runtime = this.runtime) {
    return validateJunfengGridEnvironment(runtime.gridRegion, this.currentDisplays())
  }

  writeConfig(overrides = {}) {
    const configPath = path.join(this.fileWatcher.getFilePaths().tempDir, 'junfeng_highlight_config.json')
    fs.writeFileSync(configPath, JSON.stringify({
      grid_region: normalizeJunfengRegion(overrides.gridRegion || this.runtime.gridRegion),
      grid: overrides.grid || this.runtime.grid || { columns: 12, rows: 11 },
      highlight_threshold: 0.95,
      enable_border_boost: true,
      abort_on_uncertain: false,
      weights_path: this.weightsPath(),
      item_footprints: itemFootprintRegistry.snapshot(),
      ...pythonAutomationTiming(this.runtime)
    }, null, 2), 'utf8')
    return configPath
  }

  spawn(args, onEvent, pythonExe = this.pythonPath()) {
    const isPreview = Array.isArray(args) && args.includes('--preview')
    const child = isPreview
      ? spawn(pythonExe, [this.scriptPath(), ...args], {
          shell: false, windowsHide: true,
          env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' }
        })
      : spawnOperationProcess({
          operationId: 'junfeng.pickup',
          pythonPath: pythonExe,
          scriptPath: this.scriptPath(),
          args,
          env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' },
          stdin: 'ignore',
          fallbackSpawn: spawn
        })
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', parser(onEvent, line => console.log('[君锋镇高亮取件]', line)))
    child.stderr.on('data', line => console.error('[君锋镇高亮取件]', String(line).trim()))
    return child
  }

  async preview() {
    this.ensureReady({ modelRequired: false, requireReward: false })
    let token = null
    try {
      const activation = await this.windowActivation?.activateGame({ source: 'junfeng-preview' })
      if (!activation?.success) throw new Error(this.windowActivation?.gameFailureMessage?.(activation?.code) || `无法激活游戏窗口（${activation?.code || 'activation-unavailable'}）`)
      token = this.loadingFeedback?.begin('junfeng.preview', { owner: 'junfeng-preview' }) || null
      this.loadingFeedback?.update(token, { stage: 'model' })
      const configPath = this.writeConfig()
      const pythonExe = await this.resolvePythonPath()
      return await new Promise((resolve, reject) => {
        let settled = false
        const child = this.spawn(['--config', configPath, '--preview'], event => {
          if (event.event === 'preview') {
            settled = true
            resolve(event)
          } else if (event.event === 'error') {
            settled = true
            reject(eventError(event, '君锋镇预览失败'))
          }
        }, pythonExe)
        child.on('error', reject)
        child.on('close', code => { if (!settled) reject(new Error(`君锋镇预览进程异常退出（${code}）`)) })
      })
    } finally {
      this.loadingFeedback?.finish(token)
    }
  }

  async start() {
    if (this.child) throw new Error('君锋镇高亮取件正在运行')
    this.ensureReady()
    const gate = this.automationLock?.acquire(OWNER) || { success: true }
    if (!gate.success) throw new Error(gate.error)
    const activation = await this.windowActivation?.activateGame({ source: 'junfeng-pickup-start' })
    if (!activation?.success) {
      this.automationLock?.release(OWNER)
      throw new Error(this.windowActivation?.gameFailureMessage?.(activation?.code) || `无法激活游戏窗口（${activation?.code || 'activation-unavailable'}）`)
    }
    this.preparationToken = this.loadingFeedback?.begin('junfeng.start', { owner: OWNER }) || null
    this.status = { ...this.initialStatus(), status: 'running' }
    try {
      this.loadingFeedback?.update(this.preparationToken, { stage: 'model' })
      const configPath = this.writeConfig()
      const pythonExe = await this.resolvePythonPath()
      const child = this.spawn(['--config', configPath], event => this.handleEvent(child, event), pythonExe)
      this.child = child
      child.on('error', error => this.fail(error.message))
      child.on('close', code => { if (this.child === child && this.status.status === 'running') this.fail(`君锋镇取件进程异常退出（${code}）`) })
      this.publish({ event: 'starting' })
      return this.getStatus()
    } catch (error) {
      this.finishPreparation()
      this.automationLock?.release(OWNER)
      throw error
    }
  }

  handleEvent(child, event) {
    if (this.child !== child) return
    this.finishPreparation()
    const progress = normalizeJunfengProgress(
      event.currentIndex ?? this.status.processedItems,
      event.candidateItems ?? this.status.candidateItems
    )
    Object.assign(this.status, {
      status: event.event === 'completed' ? 'completed' : ['aborted', 'error'].includes(event.event) ? 'stopped' : 'running',
      candidateItems: progress.candidateItems,
      processedItems: progress.processedItems,
      remainingItems: Number(event.remainingItems ?? this.status.remainingItems),
      pickedItems: Number(event.pickedItems ?? this.status.pickedItems),
      uncertainCells: Number(event.uncertainCells ?? this.status.uncertainCells),
      reason: event.reason || '',
      modelVersion: event.modelVersion || this.status.modelVersion,
      failureCode: String(event.failureCode || ''),
      configurationIssueId: String(event.configurationIssueId || '')
    })
    this.publish(event)
    if (['completed', 'aborted', 'error'].includes(event.event)) {
      this.child = null
      this.automationLock?.release(OWNER)
    }
  }

  publish(event) {
    const payload = { ...this.status, ...event }
    const window = this.getMainWindow?.()
    if (window && !window.isDestroyed()) window.webContents.send('junfeng-highlight-event', payload)
    this.onStatusChange?.()
  }

  stop(reason = 'user') {
    this.finishPreparation()
    stopChild(this.child)
    this.child = null
    this.status = { ...this.status, status: 'stopped', reason, failureCode: '', configurationIssueId: '' }
    this.automationLock?.release(OWNER)
    this.publish({ event: 'stopped', reason })
    return this.getStatus()
  }

  fail(reason, failure = {}) {
    this.finishPreparation()
    stopChild(this.child)
    this.child = null
    this.status = {
      ...this.status,
      status: 'stopped',
      reason,
      failureCode: String(failure.failureCode || ''),
      configurationIssueId: String(failure.configurationIssueId || ''),
      configurationIssues: Array.isArray(failure.configurationIssues) ? failure.configurationIssues : []
    }
    this.automationLock?.release(OWNER)
    this.publish({
      event: 'error',
      reason,
      failureCode: this.status.failureCode,
      configurationIssueId: this.status.configurationIssueId,
      configurationIssues: this.status.configurationIssues
    })
  }

  getStatus() { return structuredClone(this.status) }

  finishPreparation() {
    if (this.preparationToken) this.loadingFeedback?.finish(this.preparationToken)
    this.preparationToken = null
  }

  cleanup() {
    this.finishPreparation()
    if (this.child) this.stop('application-exit')
    this.disposeDetection?.()
  }
}
