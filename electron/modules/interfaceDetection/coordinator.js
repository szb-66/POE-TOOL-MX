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

import { InterfaceTitleRegistry } from './titleRegistry.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode) return Promise.resolve()
  return new Promise(resolve => {
    const timer = setTimeout(() => child.kill('SIGKILL'), 2000)
    timer.unref?.()
    child.once('close', () => { clearTimeout(timer); resolve() })
    if (!child.killed) child.kill('SIGTERM')
  })
}

function stableConfig(config = {}) {
  return JSON.stringify({
    templates: config.templates || {},
    match_threshold: Number(config.match_threshold ?? config.matchThreshold ?? 0.8),
    inventory_only: config.inventory_only === true,
    interface_titles: config.interface_titles || {}
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
    this.titleRegistry = new InterfaceTitleRegistry(path.join(app.getPath('userData'), 'interface-titles.json'))
    this.config = null
    this.configFingerprint = ''
    this.lifecycle = Promise.resolve()
    this.draining = Promise.resolve()
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
    if (!this.state.running || !this.state.foreground || this.state.reloading || this.state.reason) { this.state.interfaces = {}; this.state.receivedAt = 0 }
    if (!this.consumers.has('sanctum-control')) { this.state.interfaces = {}; this.state.titleIssues = {} }
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

  getTitleConfig() {
    const issues = { ...this.state.titleIssues }
    for (const [key, entry] of Object.entries(this.titleRegistry.templates)) {
      const r = entry.region, env = entry.environment
      if (!r || !env || !['x', 'y', 'width', 'height'].every(k => Number.isInteger(r[k]))
        || r.x < 0 || r.y < 0 || r.width < 2 || r.height < 2
        || r.x + r.width > env.width || r.y + r.height > env.height) {
        issues[key] = '标题框选区域无效，请重新框选'
      }
    }
    return { templates: structuredClone(this.titleRegistry.templates), issues, threshold: Number(this.config?.match_threshold ?? this.config?.matchThreshold ?? .8) }
  }

  enqueue(operation) {
    const task = this.lifecycle.then(operation)
    this.lifecycle = task.catch(() => {})
    return task
  }

  effectiveConfig() {
    const map = this.titleRegistry.templates['sanctum-map']
    return { ...this.config, interface_titles: this.consumers.has('sanctum-control') && map ? { 'sanctum-map': map } : {} }
  }

  async reconcile() {
    await this.draining
    if (this.consumers.size === 0) return this.getState()
    const fingerprint = stableConfig(this.effectiveConfig())
    if (!this.child) await this.start()
    else if (fingerprint !== this.configFingerprint) await this.restart()
    this.publish()
    return this.getState()
  }

  setTitle(key, capture) {
    return this.enqueue(async () => {
      const previous = this.titleRegistry.templates[key]
      this.titleRegistry.set(key, capture)
      const titleIssues = { ...this.state.titleIssues }
      delete titleIssues[key]
      this.publish({ titleIssues })
      try { await this.reconcile() }
      catch (error) { this.titleRegistry.set(key, previous); throw error }
      this.publish()
      return this.getTitleConfig()
    })
  }

  async registerConsumer(consumer, config = this.config || {}) {
    const id = String(consumer || '')
    if (!id) throw new Error('检测消费者不能为空')
    this.consumers.add(id)
    this.config = structuredClone(config)
    return this.enqueue(() => this.reconcile())
  }

  unregisterConsumer(consumer) {
    this.consumers.delete(String(consumer || ''))
    if (this.consumers.size === 0) this.stop()
    else {
      this.publish()
      void this.enqueue(() => this.reconcile()).catch(error => {
        this.publish({ reason: error.message })
      })
    }
    return this.getState()
  }

  async updateConfig(config) {
    this.config = structuredClone(config)
    return this.enqueue(() => this.reconcile())
  }

  writeConfig() {
    const configPath = path.join(this.fileWatcher.getFilePaths().tempDir, 'interface_detection_config.json')
    fs.writeFileSync(configPath, JSON.stringify(this.effectiveConfig(), null, 2), 'utf8')
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
    this.configFingerprint = stableConfig(this.effectiveConfig())
    const childFingerprint = this.configFingerprint
    let terminalReason = ''
    let stderr = ''
    let spawnError = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', createEventLineParser((event) => {
      if (this.child !== child) return
      if (childFingerprint !== stableConfig(this.effectiveConfig())) return
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
          interfaces: event.interfaces || {}, receivedAt: Date.now(),
          titleIssues: event.titleIssues || {},
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
      if (this.child !== child) return this.getState()
      this.publish({ running: true, reloading: false, reason: '', exitCode: null, failureCode: '', configurationIssueId: '' })
      return this.getState()
    } catch (error) {
      if (this.child !== child) return this.getState()
      this.child = null
      this.draining = stopChild(child)
      await this.draining
      this.publish({ running: false, reloading: false, ready: false, inventoryReady: false, stashReady: false, allflameReceiverReady: false, rewardDetected: false, junfengReady: false, foreground: false, reason: error.message })
      throw error
    }
  }

  async restart() {
    const previous = this.child
    this.child = null
    this.draining = stopChild(previous)
    this.publish({ running: false, reloading: true, ready: false, inventoryReady: false, stashReady: false, allflameReceiverReady: false, rewardDetected: false, junfengReady: false, foreground: false, reason: '', exitCode: null, failureCode: '', configurationIssueId: '' })
    await this.draining
    return this.start()
  }

  stop() {
    const child = this.child
    this.child = null
    if (child) this.draining = stopChild(child)
    this.publish({ running: false, reloading: false, ready: false, inventoryReady: false, stashReady: false, allflameReceiverReady: false, rewardDetected: false, junfengReady: false, foreground: false, gameBounds: null, reason: '', exitCode: null, failureCode: '', configurationIssueId: '' })
  }

  cleanup() {
    this.consumers.clear()
    this.stop()
    this.listeners.clear()
  }
}
