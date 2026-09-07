import { app } from 'electron'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createEventLineParser,
  describeDetectionExit,
  waitForDetectionStartup
} from '../bag/orchestrator.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

function stopChild(child) {
  if (!child || child.killed) return
  child.kill('SIGTERM')
  setTimeout(() => {
    if (child.exitCode === null) child.kill('SIGKILL')
  }, 2000)
}

function stableConfig(config = {}) {
  return JSON.stringify({
    templates: config.templates || {},
    match_threshold: Number(config.match_threshold ?? config.matchThreshold ?? 0.8),
    inventory_only: config.inventory_only === true
  })
}

export class InterfaceDetectionCoordinator {
  constructor({ python, fileWatcher, logger = console } = {}) {
    this.python = python
    this.fileWatcher = fileWatcher
    this.logger = logger
    this.child = null
    this.consumers = new Set()
    this.listeners = new Set()
    this.config = null
    this.configFingerprint = ''
    this.state = {
      running: false,
      reloading: false,
      ready: false,
      inventoryReady: false,
      stashReady: false,
      allflameReceiverReady: false,
      rewardDetected: false,
      junfengReady: false,
      foreground: false,
      gameBounds: null,
      reason: '',
      exitCode: null,
      failureCode: '',
      configurationIssueId: ''
    }
  }

  scriptPath() {
    const candidates = app.isPackaged
      ? [path.join(process.resourcesPath, 'bag_auto_stash_template.py')]
      : [
          path.resolve(moduleDir, '../../../src/assets/scripts/bag_auto_stash_template.py'),
          path.join(app.getAppPath(), 'src/assets/scripts/bag_auto_stash_template.py')
        ]
    const found = candidates.find((candidate) => fs.existsSync(candidate))
    if (!found) throw new Error('界面检测脚本不存在')
    return found
  }

  pythonPath() {
    const required = ['cv2', 'mss', 'numpy', 'pyperclip', 'pynput']
    const found = this.python.detectPythonPathWithModules?.(required) || this.python.detectPythonPath?.()
    if (!found) throw new Error('未找到具备界面检测依赖的 Python 3')
    return found
  }

  publish(patch = {}) {
    this.state = {
      ...this.state,
      ...patch,
      consumers: [...this.consumers]
    }
    const snapshot = this.getState()
    for (const listener of this.listeners) listener(snapshot)
  }

  subscribe(listener) {
    this.listeners.add(listener)
    listener(this.getState())
    return () => this.listeners.delete(listener)
  }

  getState() {
    return structuredClone({ ...this.state, consumers: [...this.consumers] })
  }

  async registerConsumer(consumer, config) {
    const id = String(consumer || '')
    if (!id) throw new Error('检测消费者不能为空')
    const fingerprint = stableConfig(config)
    const configChanged = fingerprint !== this.configFingerprint
    this.consumers.add(id)
    this.config = structuredClone(config)
    this.configFingerprint = fingerprint
    if (!this.child) await this.start()
    else if (configChanged) await this.restart()
    this.publish()
    return this.getState()
  }

  unregisterConsumer(consumer) {
    this.consumers.delete(String(consumer || ''))
    if (this.consumers.size === 0) this.stop()
    else this.publish()
    return this.getState()
  }

  async updateConfig(config) {
    const fingerprint = stableConfig(config)
    if (fingerprint === this.configFingerprint) return this.getState()
    this.config = structuredClone(config)
    this.configFingerprint = fingerprint
    if (this.child) await this.restart()
    return this.getState()
  }

  writeConfig() {
    const configPath = path.join(this.fileWatcher.getFilePaths().tempDir, 'interface_detection_config.json')
    fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2), 'utf8')
    return configPath
  }

  async start() {
    if (this.child || this.consumers.size === 0) return this.getState()
    const child = spawn(this.pythonPath(), [
      this.scriptPath(), '--mode', 'detect', '--config', this.writeConfig()
    ], {
      shell: false,
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' }
    })
    this.child = child
    let terminalReason = ''
    let stderr = ''
    let spawnError = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', createEventLineParser((event) => {
      if (this.child !== child) return
      if (event.event === 'detection-state') {
        this.publish({
          running: true,
          reloading: false,
          ready: Boolean(event.ready),
          inventoryReady: Boolean(event.inventoryReady),
          stashReady: Boolean(event.stashReady ?? event.ready),
          allflameReceiverReady: Boolean(event.allflameReceiverReady),
          rewardDetected: Boolean(event.rewardDetected),
          junfengReady: Boolean(event.junfengReady),
          foreground: Boolean(event.foreground),
          gameBounds: event.gameBounds || null,
          stashScore: event.stashScore,
          inventoryScore: event.inventoryScore,
          rewardScore: event.rewardScore,
          reason: '',
          exitCode: null,
          failureCode: '',
          configurationIssueId: ''
        })
      } else if (event.event === 'detection-error') {
        terminalReason = event.reason || '检测器报告错误'
        this.logger.record?.({
          phase: 'interface-detection-error',
          outcome: 'warning',
          reasonCode: 'detection_error_reported',
          message: `failureCode=${event.failureCode || ''} ${terminalReason}`
        })
        this.publish({
          reason: terminalReason,
          failureCode: String(event.failureCode || ''),
          configurationIssueId: String(event.configurationIssueId || '')
        })
      }
    }, (line) => console.log('[公共界面检测]', line)))
    child.stderr.on('data', (data) => {
      stderr = `${stderr}${String(data)}`.slice(-4000)
      console.error('[公共界面检测]', String(data).trim())
    })
    child.on('error', (error) => {
      spawnError = error.message
      console.error('[公共界面检测] 进程错误:', error)
    })
    child.on('close', (code) => {
      if (this.child !== child) return
      this.child = null
      const reason = code === 0 ? 'process-ended' : (terminalReason || describeDetectionExit({ code, stderr, spawnError }))
      console.error(`[公共界面检测] 检测进程意外退出 code=${code} stderr=${stderr.slice(-600).trim() || '(空)'}`)
      this.logger.record?.({
        phase: 'interface-detection-exit',
        outcome: 'failed',
        reasonCode: Number.isFinite(code) ? `exit_code_${code}` : 'exit_code_unknown',
        message: `code=${code} reason=${reason} stderr=${stderr.slice(-3500).trim()}`
      })
      this.publish({
        running: false,
        reloading: false,
        ready: false,
        inventoryReady: false,
        stashReady: false,
        allflameReceiverReady: false,
        rewardDetected: false,
        junfengReady: false,
        foreground: false,
        reason,
        exitCode: Number.isFinite(code) ? code : null,
        failureCode: '',
        configurationIssueId: ''
      })
    })
    try {
      await waitForDetectionStartup(child, {
        getFailureReason: (code) => describeDetectionExit({ code, terminalReason, stderr, spawnError })
      })
      this.publish({ running: true, reloading: false, reason: '', exitCode: null, failureCode: '', configurationIssueId: '' })
      return this.getState()
    } catch (error) {
      if (this.child !== child) return this.getState()
      this.child = null
      stopChild(child)
      this.publish({ running: false, reloading: false, ready: false, inventoryReady: false, stashReady: false, allflameReceiverReady: false, rewardDetected: false, junfengReady: false, foreground: false, reason: error.message })
      throw error
    }
  }

  async restart() {
    const previous = this.child
    this.child = null
    stopChild(previous)
    this.publish({ running: false, reloading: true, ready: false, inventoryReady: false, stashReady: false, allflameReceiverReady: false, rewardDetected: false, junfengReady: false, foreground: false, reason: '', exitCode: null, failureCode: '', configurationIssueId: '' })
    return this.start()
  }

  stop() {
    const child = this.child
    this.child = null
    stopChild(child)
    this.publish({ running: false, reloading: false, ready: false, inventoryReady: false, stashReady: false, allflameReceiverReady: false, rewardDetected: false, junfengReady: false, foreground: false, gameBounds: null, reason: '', exitCode: null, failureCode: '', configurationIssueId: '' })
  }

  cleanup() {
    this.consumers.clear()
    this.stop()
    this.listeners.clear()
  }
}
