import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFaustusRunSnapshot } from '../../../src/utils/faustusConfig.js'
import { itemFootprintRegistry } from '../items/footprintRegistry.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

const OWNER = '浮士德市集改价'
const REQUIRED_MODULES = Object.freeze(['rapidocr', 'onnxruntime', 'cv2', 'mss', 'numpy', 'pynput', 'pyperclip'])
const CURRENCIES = new Set(['chaos', 'divine'])
const REASON_CODES = new Set([
  'repriced', 'completed', 'aborted', 'user', 'shortcut', 'application_exit',
  'start_failed', 'process_error', 'process_exited', 'script_error', 'stopped',
  'game_not_foreground', 'game_activation_failed', 'input_privilege_mismatch', 'page_anchor_missing', 'grid_invalid', 'grid_aspect_invalid',
  'grid_structure_invalid', 'occupancy_model_unavailable',
  'occupancy_model_validation_failed', 'occupancy_grid_capture_failed', 'occupancy_model_inference_failed',
  'no_market_item_found', 'item_footprint_unknown', 'item_footprint_ambiguous', 'price_window_unknown',
  'price_window_anchor_missing', 'price_window_close_failed', 'item_clipboard_invalid',
  'price_clipboard_invalid', 'currency_ocr_uncertain', 'currency_option_uncertain',
  'currency_unsupported', 'submit_anchor_missing', 'invalid_ratio', 'invalid_bands',
  'invalid_band', 'invalid_discount', 'invalid_currency', 'overlapping_bands',
  'no_matching_band', 'result_below_one', 'not_lower', 'verification_mismatch',
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

function gridCalibrationKey(value = {}) {
  return JSON.stringify([
    Number(value.left), Number(value.top), Number(value.right), Number(value.bottom),
    String(value.displayId || ''), Number(value.scaleFactor)
  ])
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
    python, fileWatcher, getMainWindow, foregroundState, subscribeForeground, automationLock,
    processFactory, scriptPath, fileSystem = fs, isPackaged = false, resourcesPath = process.resourcesPath,
    feedbackOverlay = null, resolveDisplayBounds = null,
    waitForFeedback = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
  } = {}) {
    this.python = python
    this.fileWatcher = fileWatcher
    this.getMainWindow = getMainWindow
    this.foregroundState = foregroundState || (() => ({ available: false, gameForeground: false }))
    this.automationLock = automationLock
    this.fileSystem = fileSystem
    this.isPackaged = isPackaged
    this.resourcesPath = resourcesPath
    this.feedbackOverlay = feedbackOverlay
    this.resolveDisplayBounds = resolveDisplayBounds
    this.waitForFeedback = waitForFeedback
    this.feedbackSessionId = null
    this.resolveScriptPath = scriptPath || (() => this.defaultScriptPath())
    this.processFactory = processFactory || (options => spawn(options.pythonPath, [options.scriptPath, ...options.args], {
      shell: false, windowsHide: true, env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1', PYTHONUTF8: '1' }
    }))
    this.child = null
    this.lockHeld = false
    this.priceRecognitionCalibrationKey = ''
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
    const root = this.isPackaged
      ? path.join(this.resourcesPath || '', 'junfeng-highlight-model')
      : path.resolve(moduleDir, '../../../src/assets/models/junfeng-highlight')
    return { modelPath: path.join(root, 'model.onnx'), manifestPath: path.join(root, 'manifest.json') }
  }

  internalRuntimeConfig(config) {
    const occupancyModel = this.occupancyModelPaths()
    if (!this.fileSystem.existsSync?.(occupancyModel.modelPath) || !this.fileSystem.existsSync?.(occupancyModel.manifestPath)) {
      throw new Error('通用格子模型文件不完整，无法开始浮士德扫描')
    }
    return {
      ...config,
      model_path: occupancyModel.modelPath,
      manifest_path: occupancyModel.manifestPath,
      item_footprints: itemFootprintRegistry.snapshot()
    }
  }

  pythonPath() {
    const found = this.python?.detectPythonPathWithModules?.([...REQUIRED_MODULES])
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

  ensureStaticReady(config) {
    this.assertGridCalibration(config?.gridCalibration)
    // 识别测试由固定脚本先激活游戏。该内部标志不来自 renderer；激活成功后
    // Python 仍会再次核对前台，失败时不会发送任何游戏键鼠输入。
    if (!config?.activateGameWindow) this.assertForeground()
    const pythonPath = this.pythonPath()
    const scriptPath = this.resolveScriptPath()
    return { pythonPath, scriptPath }
  }

  assertPriceRecognitionReady(gridCalibration) {
    if (!this.priceRecognitionCalibrationKey || this.priceRecognitionCalibrationKey !== gridCalibrationKey(gridCalibration)) {
      throw new Error('请先对当前市集网格完成价格窗口识别测试')
    }
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

  spawnMode(mode, config, onEvent) {
    const runtime = this.ensureStaticReady(config)
    const configPath = this.writeConfig(config)
    const args = ['--mode', mode, '--config', configPath]
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
    return child
  }

  runOneShot(mode, config, successEvent, onEvent = null) {
    return new Promise((resolve, reject) => {
      let settled = false
      let child
      const finish = (callback, value) => {
        if (settled) return
        settled = true
        terminate(child)
        this.removeConfig()
        callback(value)
      }
      try {
        child = this.spawnMode(mode, config, event => {
          onEvent?.(event)
          if (event?.event === successEvent) finish(resolve, event)
          else if (event?.event === 'error' || event?.event === 'aborted') {
            const code = reasonCode(event.reasonCode, event.event === 'aborted' ? 'aborted' : 'script_error')
            const message = code === 'input_privilege_mismatch'
              ? '游戏以管理员权限运行，请以管理员权限重新启动开发版助手'
              : code === 'item_clipboard_invalid'
                ? '无法读取候选格的剪贴板内容'
              : code.startsWith('occupancy_')
                ? ({
                    occupancy_model_unavailable: '通用格子模型不可用，已停止测试以避免扫描全部 144 格',
                    occupancy_model_validation_failed: '通用格子模型或清单校验失败',
                    occupancy_grid_capture_failed: '通用格子模型无法截取当前市集网格',
                    occupancy_model_inference_failed: '通用格子模型执行格子分类失败'
                  }[code] || `通用格子模型失败（${code}）`)
              : (event.reason || `${mode} 失败（${code}）`)
            finish(reject, new Error(message))
          }
        })
      } catch (error) {
        this.removeConfig()
        reject(new Error(safeText(error?.message || error, 300)))
        return
      }
      child.once?.('error', error => finish(reject, new Error(safeText(error?.message || error, 300))))
      child.once?.('close', code => {
        if (!settled) finish(reject, new Error(`${mode} 进程异常退出（${code}）`))
      })
    })
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

  async testPriceWindow({ gridCalibration } = {}) {
    const config = this.internalRuntimeConfig({ version: 1, mode: 'recognition-test', activateGameWindow: true, gridCalibration })
    this.priceRecognitionCalibrationKey = ''
    let feedbackResultShown = false
    try {
      this.ensureStaticReady(config)
      this.acquireLock()
      this.beginFeedback(gridCalibration, '正在加载价格识别组件')
      const event = await this.runOneShot(
        'price-window-test', config, 'price-window-test',
        progress => this.handleFeedbackEvent(progress)
      )
      this.priceRecognitionCalibrationKey = gridCalibrationKey(config.gridCalibration)
      feedbackResultShown = this.showFeedbackResult('success', `读取成功：${event.price} ${event.currency === 'divine' ? '神圣石' : '混沌石'}`)
      if (feedbackResultShown) await this.waitForFeedback(900)
      return { price: finiteInteger(event.price), currency: CURRENCIES.has(event.currency) ? event.currency : '' }
    } catch (error) {
      feedbackResultShown = this.showFeedbackResult('failure', safeText(error?.message || error, 120))
      if (feedbackResultShown) await this.waitForFeedback(1200)
      throw error
    } finally {
      this.hideFeedback()
      this.releaseLock()
      this.restoreMainWindow()
    }
  }

  beginFeedback(gridCalibration, label) {
    try {
      const displayBounds = this.resolveDisplayBounds?.(gridCalibration)
      if (!displayBounds) return null
      this.feedbackSessionId = this.feedbackOverlay?.showRunning?.({
        scope: 'faustus', displayBounds, stage: 'starting', current: 0, total: 0,
        label, detail: '测试正在游戏内执行，请勿操作鼠标和键盘'
      }) || null
    } catch {
      this.feedbackSessionId = null
    }
    return this.feedbackSessionId
  }

  handleFeedbackEvent(event = {}) {
    if (!this.feedbackSessionId) return
    if (event.event === 'scan-progress') {
      this.feedbackOverlay?.updateProgress?.(this.feedbackSessionId, {
        stage: 'grid', current: Math.max(0, Number(event.current) || 0),
        total: Math.max(0, Number(event.total) || 0),
        label: `正在扫描市集格子 ${Number(event.column) || 0},${Number(event.row) || 0}`
      })
    } else if (event.event === 'scan-plan') {
      this.feedbackOverlay?.updateProgress?.(this.feedbackSessionId, {
        stage: 'grid', current: 0, total: Math.max(0, Number(event.total) || 0),
        label: `已排除 ${Math.max(0, Number(event.skippedEmpty) || 0)} 个空格，准备扫描物品格`
      })
    }
  }

  showFeedbackResult(status, message) {
    if (!this.feedbackSessionId) return false
    return Boolean(this.feedbackOverlay?.showResult?.(this.feedbackSessionId, {
      scope: 'faustus', status, message
    }))
  }

  hideFeedback() {
    if (this.feedbackSessionId) this.feedbackOverlay?.hide?.(this.feedbackSessionId)
    this.feedbackSessionId = null
  }

  restoreMainWindow() {
    const window = this.getMainWindow?.()
    if (!window || window.isDestroyed?.()) return
    try {
      if (window.isMinimized?.()) window.restore?.()
      window.show?.()
      window.focus?.()
    } catch {}
  }

  async start(request) {
    if (this.status.status === 'running' || this.child) throw new Error('浮士德市集改价正在运行')
    const config = this.internalRuntimeConfig({ ...createFaustusRunSnapshot(request?.config), activateGameWindow: true })
    this.ensureStaticReady(config)
    this.assertPriceRecognitionReady(config.gridCalibration)
    this.acquireLock()
    try {
      this.status = { status: 'running', reasonCode: '', processed: 0, total: 0 }
      this.beginFeedback(config.gridCalibration, '正在加载浮士德市集识别组件')
      const child = this.spawnMode('run', config, event => this.handleEvent(child, event))
      this.child = child
      child.once?.('error', error => this.fail('process_error', error.message))
      child.once?.('close', code => {
        if (this.child !== child) return
        this.child = null
        if (this.status.status === 'running') this.fail('process_exited', `改价进程异常退出（${code}）`)
      })
      this.publishState()
      return this.getStatus()
    } catch (error) {
      this.hideFeedback()
      this.removeConfig()
      this.releaseLock()
      this.status = { ...this.status, status: 'stopped', reasonCode: 'start_failed' }
      throw error
    }
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
    if (this.child !== child) return
    this.handleFeedbackEvent(event)
    if (event.event === 'item') {
      this.publish({ type: 'item', item: sanitizeFaustusItemEvent(event) })
      return
    }
    if (event.event === 'progress') {
      this.startForegroundMonitor()
      this.status = {
        ...this.status,
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
    if (event.event === 'completed') this.finish('completed', 'completed')
    else if (event.event === 'aborted') this.finish('stopped', reasonCode(event.reasonCode, 'aborted'))
    else if (event.event === 'error') this.fail(reasonCode(event.reasonCode, 'script_error'), event.reason)
  }

  removeConfig(configPath = this.configPath) {
    if (!configPath) return
    try { this.fileSystem.rmSync?.(configPath, { force: true }) } catch {}
    if (this.configPath === configPath) this.configPath = ''
  }

  finish(status, reasonCode) {
    const child = this.child
    this.child = null
    terminate(child)
    this.stopForegroundMonitor()
    this.releaseLock()
    this.removeConfig()
    this.hideFeedback()
    this.status = { ...this.status, status, reasonCode: reasonCode === 'completed' ? 'completed' : reasonCode }
    this.publishState()
    this.restoreMainWindow()
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
    const wasRunning = Boolean(this.child) || this.status.status === 'running'
    const child = this.child
    this.child = null
    terminate(child)
    this.stopForegroundMonitor()
    this.releaseLock()
    this.removeConfig()
    this.hideFeedback()
    this.status = { ...this.status, status: 'stopped', reasonCode: reasonCode(reason, 'user') }
    if (wasRunning) this.publishState()
    if (wasRunning) this.restoreMainWindow()
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
