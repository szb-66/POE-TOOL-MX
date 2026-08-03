import { app } from 'electron'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const OWNER = '仓库自动取件'

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

export class StashPickupManager {
  constructor({ python, fileWatcher, getMainWindow, interfaceDetection, automationLock, onStatusChange }) {
    this.python = python
    this.fileWatcher = fileWatcher
    this.getMainWindow = getMainWindow
    this.interfaceDetection = interfaceDetection
    this.automationLock = automationLock
    this.onStatusChange = onStatusChange
    this.runtime = { enabled: false, calibration: {}, profiles: {}, operationDelayMs: 80 }
    this.child = null
    this.allowingFocusTransition = false
    this.status = {
      status: 'idle', layout: 0, method: 'variance', candidateCells: 0,
      remainingCells: 0, pickedItems: 0, currentIndex: 0, reason: ''
    }
    this.disposeDetection = interfaceDetection?.subscribe(state => {
      if (this.status.status === 'running' && !this.allowingFocusTransition && (!state.ready || !state.foreground)) {
        this.stop(!state.foreground ? 'game-not-foreground' : 'interface-lost')
      }
    })
  }

  scriptPath() {
    const candidates = app.isPackaged
      ? [path.join(process.resourcesPath, 'stash_pickup_template.py')]
      : [
          path.resolve(moduleDir, '../../../src/assets/scripts/stash_pickup_template.py'),
          path.join(app.getAppPath(), 'src/assets/scripts/stash_pickup_template.py')
        ]
    const found = candidates.find(value => fs.existsSync(value))
    if (!found) throw new Error('仓库自动取件脚本不存在')
    return found
  }

  pythonPath() {
    const found = this.python.detectPythonPathWithModules?.(['cv2', 'mss', 'numpy', 'pynput']) || this.python.detectPythonPath?.()
    if (!found) throw new Error('未找到具备 cv2、mss、numpy、pynput 的 Python 3')
    return found
  }

  setRuntime(runtime = {}) {
    this.runtime = { ...this.runtime, ...structuredClone(runtime) }
    this.onStatusChange?.()
    return this.getStatus()
  }

  writeConfig() {
    const configPath = path.join(this.fileWatcher.getFilePaths().tempDir, 'stash_pickup_config.json')
    fs.writeFileSync(configPath, JSON.stringify({
      calibration: this.runtime.calibration || {},
      profiles: this.runtime.profiles || {},
      operationDelayMs: Number(this.runtime.operationDelayMs || 80)
    }, null, 2), 'utf8')
    return configPath
  }

  ensureReady({ requireForeground = true } = {}) {
    const detection = this.interfaceDetection?.getState?.() || {}
    if (detection.foreground && !detection.ready) throw new Error('仓库与背包界面未就绪')
    if (!detection.foreground && !detection.running) throw new Error('仓库与背包检测尚未运行')
    if (requireForeground && !detection.foreground) throw new Error('游戏不在前台')
    if (!this.runtime.calibration?.root && !this.runtime.calibration?.folder) throw new Error('缺少仓库网格校准')
  }

  spawnProcess(args, onEvent) {
    const child = spawn(this.pythonPath(), [this.scriptPath(), ...args], {
      shell: false, windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' }
    })
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', parseEvents(onEvent, line => console.log('[仓库自动取件]', line)))
    child.stderr.on('data', line => console.error('[仓库自动取件]', String(line).trim()))
    return child
  }

  preview() {
    this.ensureReady({ requireForeground: false })
    const configPath = this.writeConfig()
    return new Promise((resolve, reject) => {
      let settled = false
      const child = this.spawnProcess(['--config', configPath, '--preview'], event => {
        if (event.event === 'preview') {
          settled = true
          resolve(event)
        } else if (event.event === 'error') {
          settled = true
          reject(new Error(event.reason || '检测预览失败'))
        }
      })
      child.on('error', reject)
      child.on('close', code => {
        if (!settled) reject(new Error(`检测预览进程异常退出（${code}）`))
      })
    })
  }

  start() {
    if (this.status.status === 'running') throw new Error('仓库自动取件正在运行')
    this.ensureReady({ requireForeground: false })
    const gate = this.automationLock?.acquire(OWNER) || { success: true }
    if (!gate.success) throw new Error(gate.error)
    this.status = { ...this.status, status: 'running', candidateCells: 0, remainingCells: 0, pickedItems: 0, currentIndex: 0, reason: '' }
    this.allowingFocusTransition = true
    try {
      const configPath = this.writeConfig()
      const child = this.spawnProcess(['--config', configPath], event => this.handleEvent(child, event))
      this.child = child
      child.on('error', error => this.fail(error.message))
      child.on('close', code => {
        if (this.child !== child) return
        this.child = null
        if (this.status.status === 'running') this.fail(`取件进程异常退出（${code}）`)
      })
      this.publish({ event: 'starting' })
      return this.getStatus()
    } catch (error) {
      this.allowingFocusTransition = false
      this.automationLock?.release(OWNER)
      this.status.status = 'stopped'
      throw error
    }
  }

  handleEvent(child, event) {
    if (this.child !== child) return
    this.allowingFocusTransition = false
    Object.assign(this.status, {
      status: event.event === 'completed' ? 'completed' : event.event === 'aborted' || event.event === 'error' ? 'stopped' : 'running',
      layout: Number(event.layout || this.status.layout || 0),
      method: event.method || this.status.method,
      candidateCells: Number(event.candidateCells ?? this.status.candidateCells),
      remainingCells: Number(event.remainingCells ?? this.status.remainingCells),
      pickedItems: Number(event.pickedItems ?? this.status.pickedItems),
      currentIndex: Number(event.currentIndex ?? this.status.currentIndex),
      reason: event.reason || ''
    })
    this.publish(event)
    if (event.event === 'completed' || event.event === 'aborted' || event.event === 'error') {
      this.child = null
      this.automationLock?.release(OWNER)
    }
  }

  publish(event) {
    const payload = { ...this.status, ...event }
    const window = this.getMainWindow?.()
    if (window && !window.isDestroyed()) window.webContents.send('stash-pickup-event', payload)
    this.onStatusChange?.()
  }

  stop(reason = 'user') {
    this.allowingFocusTransition = false
    terminate(this.child)
    this.child = null
    this.status = { ...this.status, status: 'stopped', reason }
    this.automationLock?.release(OWNER)
    this.publish({ event: 'stopped', reason })
    return this.getStatus()
  }

  fail(reason) {
    this.allowingFocusTransition = false
    terminate(this.child)
    this.child = null
    this.status = { ...this.status, status: 'stopped', reason }
    this.automationLock?.release(OWNER)
    this.publish({ event: 'error', reason })
  }

  getStatus() {
    return structuredClone(this.status)
  }

  cleanup() {
    if (this.child || this.status.status === 'running') this.stop('application-exit')
    else this.automationLock?.release(OWNER)
    this.disposeDetection?.()
  }
}
