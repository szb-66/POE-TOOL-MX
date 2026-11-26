import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFaustusRunSnapshot } from '../../../src/utils/faustusConfig.js'
import { itemFootprintRegistry } from '../items/footprintRegistry.js'
import { FAUSTUS_STAGE_LABELS } from '../../../shared/faustusStages.js'
import { getServer } from '../../../shared/serverMode.js'
import { resolveSlotHighlightWeightsPath } from '../stashPickup/slotHighlightWeights.js'
import { createFaustusRuntimeLanguage } from './runtimeLanguage.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

const OWNER = '浮士德市集改价'
const DEFAULT_WORKER_IDLE_TIMEOUT_MS = 60 * 1000
const REQUIRED_MODULES = Object.freeze(['rapidocr', 'onnxruntime', 'cv2', 'mss', 'numpy', 'pynput', 'pyperclip'])
const CURRENCIES = new Set(['chaos', 'divine'])
const REASON_CODES = new Set([
  'repriced', 'completed', 'aborted', 'user', 'shortcut', 'application_exit',
  'start_failed', 'process_error', 'process_exited', 'script_error', 'stopped',
  'game_not_foreground', 'game_activation_failed', 'input_privilege_mismatch', 'page_anchor_missing', 'grid_invalid', 'grid_aspect_invalid',
  'grid_structure_invalid', 'occupancy_model_unavailable',
  'occupancy_model_validation_failed', 'occupancy_grid_capture_failed', 'occupancy_model_inference_failed',
  'item_footprint_unknown', 'item_footprint_ambiguous', 'price_window_unknown',
  'price_window_anchor_missing', 'price_window_close_failed', 'item_clipboard_invalid',
  'price_clipboard_invalid', 'currency_ocr_uncertain', 'currency_option_uncertain',
  'currency_unsupported', 'submit_anchor_missing', 'invalid_ratio', 'invalid_bands',
  'invalid_band', 'invalid_discount', 'invalid_currency', 'overlapping_bands',
  'no_matching_band', 'result_below_one', 'not_lower',
  'submit_warning', 'submit_abnormal'
])

function terminate(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null || child.killed) return
  try { child.kill('SIGTERM') } catch {}
  const timer = setTimeout(() => {
    if (child.exitCode === null && child.signalCode === null) {
      try { child.kill('SIGKILL') } catch {}
    }
  }, 1200)
  timer.unref?.()
}

function createLineParser(onEvent, onLog) {
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
      try { onEvent(JSON.parse(line.slice(6))) } catch { onLog('invalid-event') }
    }
  }
}

function finiteInteger(value) {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : null
}

function shortText(value, size = 80) {
  return String(value || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, size)
}

function safeText(value, size = 80) {
  return shortText(value, 500)
    .replace(/\b(?:POESESSID|Cookie|Authorization)\b\s*[:=]?\s*\S*/gi, '[redacted]')
    .replace(/(?:[A-Za-z]:\\|\\\\)[^\s]+/g, '[path]')
    .slice(0, size)
}

function reasonCode(value, fallback = 'unknown') {
  const code = shortText(value, 64)
  return REASON_CODES.has(code) ? code : fallback
}

export function sanitizeFaustusItemEvent(event = {}) {
  const oldCurrency = CURRENCIES.has(event.oldCurrency) ? event.oldCurrency : ''
  const newCurrency = CURRENCIES.has(event.newCurrency) ? event.newCurrency : ''
  return {
    itemName: safeText(event.itemName, 60),
    grid: safeText(event.grid, 20),
    oldPrice: finiteInteger(event.oldPrice),
    oldCurrency,
    newPrice: finiteInteger(event.newPrice),
    newCurrency,
    reasonCode: reasonCode(event.reasonCode)
  }
}

export class FaustusManager {
  constructor({
    python, fileWatcher, getMainWindow, windowActivation, loadingFeedback, foregroundState, subscribeForeground, automationLock,
    processFactory, scriptPath, fileSystem = fs, isPackaged = false, resourcesPath = process.resourcesPath,
    feedbackOverlay = null, resolveDisplayBounds = null, server = getServer(),
    localizationProvider = () => [], localizationRevisionProvider = () => '',
    workerIdleTimeoutMs = DEFAULT_WORKER_IDLE_TIMEOUT_MS, dcRateService = null
  } = {}) {
    this.python = python
    this.fileWatcher = fileWatcher
    this.getMainWindow = getMainWindow
    this.windowActivation = windowActivation
    this.loadingFeedback = loadingFeedback
    this.foregroundState = foregroundState || (() => ({ available: false, gameForeground: false }))
    this.automationLock = automationLock
    this.fileSystem = fileSystem
    this.isPackaged = isPackaged
    this.resourcesPath = resourcesPath
    this.feedbackOverlay = feedbackOverlay
    this.resolveDisplayBounds = resolveDisplayBounds
    this.server = getServer(server.id)
    this.localizationProvider = localizationProvider
    this.localizationRevisionProvider = localizationRevisionProvider
    this.workerIdleTimeoutMs = Number.isFinite(Number(workerIdleTimeoutMs)) && Number(workerIdleTimeoutMs) >= 0
      ? Number(workerIdleTimeoutMs)
      : DEFAULT_WORKER_IDLE_TIMEOUT_MS
    this.dcRateService = dcRateService
    this.feedbackSessionId = null
    this.preparationToken = null
    this.startAttempt = null
    this.resolveScriptPath = scriptPath || (() => this.defaultScriptPath())
    this.processFactory = processFactory || (options => spawn(options.pythonPath, [options.scriptPath, ...options.args], {
      shell: false, windowsHide: true, env: { ...process.env, FAUSTUS_TIMING: this.isPackaged ? '0' : process.env.FAUSTUS_TIMING, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1', PYTHONUTF8: '1' }
    }))
    this.child = null
    this.worker = null
    this.workerReady = false
    this.workerIdleTimer = null
    this.pendingWorkerConfigPath = ''
    this.activeRun = false
    this.lockHeld = false
    this.configPath = ''
    this.status = { status: 'idle', reasonCode: '', processed: 0, total: 0 }
    this.disposeForeground = subscribeForeground
      ? subscribeForeground(state => this.handleForegroundState(state))
      : null
    this.foregroundTimer = null
  }

  defaultScriptPath() {
    const candidates = this.isPackaged
      ? [path.join(this.resourcesPath || '', 'faustus_market_repricing.py')]
      : [path.resolve(moduleDir, '../../../src/assets/scripts/faustus_market_repricing.py')]
    const found = candidates.find(candidate => this.fileSystem.existsSync?.(candidate))
    if (!found) throw new Error('浮士德改价固定脚本不存在')
    return found
  }

  occupancyModelPaths() {
    return {
      weightsPath: resolveSlotHighlightWeightsPath({
        isPackaged: this.isPackaged,
        resourcesPath: this.resourcesPath
      })
    }
  }

  internalRuntimeConfig(config) {
    const occupancyModel = this.occupancyModelPaths()
    if (!this.fileSystem.existsSync?.(occupancyModel.weightsPath)) {
      throw new Error('通用格子模型文件不完整，无法开始浮士德扫描')
    }
    const footprints = itemFootprintRegistry.snapshot()
    const revision = this.server.id === 'international' ? this.localizationRevisionProvider() : ''
    const language = createFaustusRuntimeLanguage({ server: this.server, revision,
      entries: revision ? this.localizationProvider() : [], footprints })
    return {
      ...config,
      runtime_language: language,
      weights_path: occupancyModel.weightsPath,
      item_footprints: footprints
    }
  }

  async pythonPath() {
    const result = await this.python?.resolvePythonRuntimeAsync?.([...REQUIRED_MODULES])
    const found = result?.ready && result.path
    if (!found) throw new Error('未找到具备 OCR 与输入依赖的 Python 运行时')
    return found
  }

  assertGridCalibration(value) {
    const [left, top, right, bottom] = ['left', 'top', 'right', 'bottom'].map(key => Number(value?.[key]))
    if (![left, top, right, bottom].every(Number.isFinite) || right <= left || bottom <= top) throw new Error('缺少有效的浮士德市集网格校准')
    if (!String(value?.displayId || '')) throw new Error('浮士德网格校准缺少显示器信息')
    if (!Number.isFinite(Number(value?.scaleFactor)) || Number(value.scaleFactor) <= 0) throw new Error('浮士德网格校准的 DPI 信息无效')
  }

  assertForeground() {
    const state = this.foregroundState?.() || {}
    if (!state.available) throw new Error('游戏前台检测不可用')
    if (!state.gameForeground) throw new Error('游戏不在前台')
  }

  async ensureStaticReady(config) {
    this.assertGridCalibration(config?.gridCalibration)
    const pythonPath = await this.pythonPath()
    const scriptPath = this.resolveScriptPath()
    return { pythonPath, scriptPath }
  }

  writeConfig(config) {
    const tempDir = this.fileWatcher?.getFilePaths?.().tempDir
    if (!tempDir) throw new Error('浮士德临时目录不可用')
    this.fileSystem.mkdirSync?.(tempDir, { recursive: true })
    const configPath = path.join(tempDir, `faustus_repricing_${process.pid}.json`)
    this.fileSystem.writeFileSync(configPath, JSON.stringify(config), 'utf8')
    this.configPath = configPath
    return configPath
  }

  spawnMode(mode, config, onEvent, runtime) {
    const configPath = this.writeConfig(config)
    const args = mode === 'worker' ? ['--mode', 'worker'] : ['--mode', mode, '--config', configPath]
    const child = this.processFactory({ ...runtime, args, mode, configPath })
    child.stdout?.setEncoding?.('utf8')
    child.stderr?.setEncoding?.('utf8')
    child.stdout?.on?.('data', createLineParser(onEvent, line => {
      if (line && line !== 'invalid-event') console.log('[浮士德改价]', line)
    }))
    child.stderr?.on?.('data', data => {
      const line = safeText(data, 300)
      if (line) console.error('[浮士德改价]', line)
    })
    return { child, configPath }
  }

  hasAliveIdleWorker() {
    const worker = this.worker
    return Boolean(
      worker && this.workerReady && !this.activeRun
      && worker.exitCode === null && worker.signalCode === null && !worker.killed
      && typeof worker.stdin?.write === 'function'
    )
  }

  clearWorkerIdleTimer() {
    if (this.workerIdleTimer) clearTimeout(this.workerIdleTimer)
    this.workerIdleTimer = null
  }

  scheduleWorkerIdleShutdown() {
    this.clearWorkerIdleTimer()
    if (!this.worker || this.activeRun) return
    if (this.workerIdleTimeoutMs <= 0) {
      this.disposeWorker(true)
      return
    }
    this.workerIdleTimer = setTimeout(() => {
      this.workerIdleTimer = null
      if (!this.activeRun) this.disposeWorker(true)
    }, this.workerIdleTimeoutMs)
    this.workerIdleTimer.unref?.()
  }

  disposeWorker(graceful = false) {
    this.clearWorkerIdleTimer()
    const worker = this.worker
    this.worker = null
    this.workerReady = false
    this.pendingWorkerConfigPath = ''
    if (!worker) return
    if (graceful && typeof worker.stdin?.write === 'function' && worker.exitCode === null && worker.signalCode === null && !worker.killed) {
      try {
        worker.stdin.write(JSON.stringify({ cmd: 'shutdown' }) + '\n')
        worker.stdin.end?.()
      } catch {}
    }
    terminate(worker)
  }

  sendWorkerRun(worker, configPath) {
    try {
      worker.stdin.write(JSON.stringify({ cmd: 'run', configPath }) + '\n')
    } catch (error) {
      this.fail('process_error', error?.message || '无法向浮士德常驻进程发送任务')
    }
  }

  async fetchInternationalDcRate(options = {}) {
    if (this.server.id !== 'international' || !this.dcRateService) {
      throw Object.assign(new Error('自动获取 poe.ninja 比例仅支持国际服'), { code: 'SERVER_FEATURE_UNAVAILABLE' })
    }
    return this.dcRateService.fetchRate(options)
  }

  acquireLock() {
    const gate = this.automationLock?.acquire(OWNER) || { success: true }
    if (!gate.success) throw new Error(gate.error || '其他自动化正在运行')
    this.lockHeld = true
  }

  releaseLock() {
    if (!this.lockHeld) return
    this.lockHeld = false
    this.automationLock?.release(OWNER)
  }

  beginFeedback(gridCalibration, label, onVisible) {
    try {
      const displayBounds = this.resolveDisplayBounds?.(gridCalibration)
      if (!displayBounds) return null
      this.feedbackSessionId = this.feedbackOverlay?.showRunning?.({
        scope: 'faustus', displayBounds, stage: 'starting', current: 0, total: 0,
        label, detail: '改价正在游戏内执行，请勿操作鼠标和键盘'
      }, { onVisible }) || null
    } catch {
      this.feedbackSessionId = null
    }
    return this.feedbackSessionId
  }

  handleFeedbackEvent(event = {}) {
    if (!this.feedbackSessionId) return
    if (event.event === 'scan-plan') {
      this.feedbackOverlay?.updateProgress?.(this.feedbackSessionId, {
        stage: 'grid', current: 0, total: Math.max(0, Number(event.total) || 0),
        label: `已排除 ${Math.max(0, Number(event.skippedEmpty) || 0)} 个空格，准备扫描物品格`
      })
    }
  }

  hideFeedback() {
    if (this.feedbackSessionId) this.feedbackOverlay?.hide?.(this.feedbackSessionId)
    this.feedbackSessionId = null
  }

  finishPreparation({ handoff = false } = {}) {
    const token = this.preparationToken
    this.preparationToken = null
    if (!token) return false
    if (handoff && this.loadingFeedback?.handoff) return this.loadingFeedback.handoff(token)
    return this.loadingFeedback?.finish(token) || false
  }

  async start(request) {
    if (this.startAttempt || this.status.status === 'running' || this.activeRun) throw new Error('浮士德市集改价正在运行')
    const config = this.internalRuntimeConfig(createFaustusRunSnapshot(request?.config))
    this.assertGridCalibration(config?.gridCalibration)
    this.acquireLock()
    const attempt = {}
    this.startAttempt = attempt
    this.status = { status: 'preparing', stage: 'preparing', reasonCode: '', processed: 0, total: 0 }
    try {
      this.preparationToken = this.loadingFeedback?.begin('faustus.start', { owner: OWNER }) || null
      this.publishState()
      const started = performance.now()
      const runtime = await this.ensureStaticReady(config)
      if (this.startAttempt !== attempt) return this.getStatus()
      this.traceTiming('runtime_ready', started)
      this.setStage('activating')
      const activation = await this.windowActivation?.activateGame({ source: 'faustus-start' })
      if (this.startAttempt !== attempt) return this.getStatus()
      if (!activation?.success) throw new Error(this.windowActivation?.gameFailureMessage?.(activation?.code) || `无法激活游戏窗口（${activation?.code || 'activation-unavailable'}）`)
      const reuseWorker = this.hasAliveIdleWorker()
      this.status = { ...this.status, status: 'running', stage: reuseWorker ? 'preflight' : 'loading' }
      this.setStage(reuseWorker ? 'preflight' : 'loading')
      this.beginFeedback(
        config.gridCalibration,
        reuseWorker ? '正在检查市集页面和网格' : '正在加载浮士德市集识别组件',
        () => {
          if (this.startAttempt === attempt) {
            this.traceTiming('startup_feedback_visible', started)
            this.finishPreparation({ handoff: true })
          }
        }
      )
      this.activeRun = true
      if (reuseWorker) {
        this.clearWorkerIdleTimer()
        const configPath = this.writeConfig(config)
        this.child = this.worker
        this.sendWorkerRun(this.worker, configPath)
      } else {
        this.disposeWorker(false)
        const mode = this.workerIdleTimeoutMs > 0 ? 'worker' : 'run'
        const { child, configPath } = this.spawnMode(mode, config, event => this.handleEvent(child, event), runtime)
        this.child = child
        const supportsWorker = mode === 'worker' && typeof child.stdin?.write === 'function'
        if (supportsWorker) {
          this.worker = child
          this.workerReady = false
          this.pendingWorkerConfigPath = configPath
        }
        child.once?.('error', error => {
          if (this.worker === child) this.worker = null
          if (this.child === child && this.activeRun) this.fail('process_error', error.message)
        })
        child.once?.('close', code => {
          if (this.worker === child) {
            this.clearWorkerIdleTimer()
            this.worker = null
            this.workerReady = false
            this.pendingWorkerConfigPath = ''
          }
          if (this.child !== child) return
          this.child = null
          if (this.activeRun && this.status.status === 'running') this.fail('process_exited', `改价进程异常退出（${code}）`)
        })
      }
      this.publishState()
      return this.getStatus()
    } catch (error) {
      if (this.startAttempt !== attempt) return this.getStatus()
      this.startAttempt = null
      this.activeRun = false
      this.finishPreparation()
      this.hideFeedback()
      this.removeConfig()
      this.releaseLock()
      this.status = { ...this.status, status: 'stopped', stage: '', reasonCode: 'start_failed' }
      this.publishState()
      throw error
    }
  }

  traceTiming(stage, started) {
    if (!this.isPackaged && process.env.FAUSTUS_TIMING === '1') {
      console.log('FAUSTUS_TIMING', JSON.stringify({ stage, ms: Math.round((performance.now() - started) * 100) / 100 }))
    }
  }

  setStage(stage) {
    if (!Object.hasOwn(FAUSTUS_STAGE_LABELS, stage)) return
    this.status = { ...this.status, stage }
    this.loadingFeedback?.update?.(this.preparationToken, { stage })
    this.publishState()
    if (this.feedbackSessionId) this.feedbackOverlay?.updateProgress?.(this.feedbackSessionId, {
      stage: 'grid', current: this.status.processed, total: this.status.total,
      label: FAUSTUS_STAGE_LABELS[stage]
    })
  }

  startForegroundMonitor() {
    if (this.disposeForeground || this.foregroundTimer) return
    this.foregroundTimer = setInterval(() => this.handleForegroundState(this.foregroundState()), 150)
    this.foregroundTimer.unref?.()
  }

  stopForegroundMonitor() {
    if (this.foregroundTimer) clearInterval(this.foregroundTimer)
    this.foregroundTimer = null
  }

  handleForegroundState(state) {
    if (this.status.status === 'running' && (!state?.available || !state?.gameForeground)) this.stop('game_not_foreground')
  }

  handleEvent(child, event = {}) {
    if (event.event === 'worker-ready' && this.worker === child) {
      this.workerReady = true
      if (this.activeRun && this.child === child && this.pendingWorkerConfigPath) {
        const configPath = this.pendingWorkerConfigPath
        this.pendingWorkerConfigPath = ''
        this.sendWorkerRun(child, configPath)
      }
      return
    }
    if (this.child !== child || !this.activeRun) return
    if (!this.feedbackSessionId) this.finishPreparation({ handoff: true })
    this.handleFeedbackEvent(event)
    if (event.event === 'stage') {
      this.setStage(event.stage)
      return
    }
    if (event.event === 'item') {
      this.publish({ type: 'item', item: sanitizeFaustusItemEvent(event) })
      return
    }
    if (event.event === 'progress') {
      this.startForegroundMonitor()
      this.status = {
        ...this.status,
        stage: 'scanning',
        processed: Math.max(0, Number(event.processed) || 0),
        total: Math.max(0, Number(event.total) || 0)
      }
      this.publishState()
      if (this.feedbackSessionId) this.feedbackOverlay?.updateProgress?.(this.feedbackSessionId, {
        stage: 'grid', current: this.status.processed, total: this.status.total,
        label: '正在扫描并处理市集物品'
      })
      return
    }
    if (event.event === 'completed') this.finish('completed', 'completed', { keepWorker: true })
    else if (event.event === 'aborted') this.finish('stopped', reasonCode(event.reasonCode, 'aborted'))
    else if (event.event === 'error') this.fail(reasonCode(event.reasonCode, 'script_error'), event.reason)
  }

  removeConfig(configPath = this.configPath) {
    if (!configPath) return
    try { this.fileSystem.rmSync?.(configPath, { force: true }) } catch {}
    if (this.configPath === configPath) this.configPath = ''
  }

  finish(status, reasonCode, { keepWorker = false } = {}) {
    this.startAttempt = null
    this.activeRun = false
    this.pendingWorkerConfigPath = ''
    this.finishPreparation()
    const child = this.child
    this.child = null
    const canKeepWorker = Boolean(
      keepWorker && child && this.worker === child && this.workerReady
      && typeof child.stdin?.write === 'function'
      && child.exitCode === null && child.signalCode === null && !child.killed
    )
    if (canKeepWorker) {
      this.scheduleWorkerIdleShutdown()
    } else {
      if (this.worker === child) this.disposeWorker(false)
      else terminate(child)
    }
    this.stopForegroundMonitor()
    this.releaseLock()
    this.removeConfig()
    this.hideFeedback()
    this.status = { ...this.status, status, stage: '', reasonCode: reasonCode === 'completed' ? 'completed' : reasonCode }
    this.publishState()
    void this.windowActivation?.activateMain({ source: 'faustus-finish' })
  }

  fail(reasonCode, reason = '') {
    this.finish('failed', reasonCode)
    if (reason) console.error('[浮士德改价]', safeText(reason, 300))
  }

  publishState() {
    this.publish({ type: 'state', state: this.getStatus() })
  }

  publish(payload) {
    const window = this.getMainWindow?.()
    if (window && !window.isDestroyed?.() && !window.webContents?.isDestroyed?.()) {
      window.webContents.send('faustus-event', structuredClone(payload))
    }
  }

  stop(reason = 'user') {
    this.startAttempt = null
    this.finishPreparation()
    const wasRunning = this.activeRun || Boolean(this.child) || ['running', 'preparing'].includes(this.status.status)
    this.activeRun = false
    const child = this.child
    this.child = null
    this.disposeWorker(false)
    if (child && child !== this.worker) terminate(child)
    this.stopForegroundMonitor()
    this.releaseLock()
    this.removeConfig()
    this.hideFeedback()
    this.status = { ...this.status, status: 'stopped', stage: '', reasonCode: reasonCode(reason, 'user') }
    if (wasRunning) this.publishState()
    if (wasRunning) void this.windowActivation?.activateMain({ source: 'faustus-stop' })
    return this.getStatus()
  }

  getStatus() {
    return structuredClone(this.status)
  }

  cleanup() {
    this.stop('application_exit')
    this.feedbackOverlay?.close?.()
    this.disposeForeground?.()
    this.disposeForeground = null
  }
}
