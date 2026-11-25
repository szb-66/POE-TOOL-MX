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
import { createDetectionProcessDiagnostics } from './processDiagnostics.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const KNOWN_TARGETS = Object.freeze(['inventory', 'stash', 'reward', 'allflame_receiver'])

function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode) return Promise.resolve()
  return new Promise(resolve => {
    const timer = setTimeout(() => child.kill('SIGKILL'), 2000)
    timer.unref?.()
    child.once('close', () => { clearTimeout(timer); resolve() })
    if (!child.killed) child.kill('SIGTERM')
  })
}

function normalizeTemplates(templates = {}) {
  return {
    stash_title: String(templates.stash_title || ''),
    inventory_title: String(templates.inventory_title || ''),
    junfeng_reward_title: String(templates.junfeng_reward_title || ''),
    allflame_receiver_title: String(templates.allflame_receiver_title || ''),
    stash_region: templates.stash_region || {},
    inventory_region: templates.inventory_region || {},
    junfeng_reward_region: templates.junfeng_reward_region || {},
    allflame_receiver_region: templates.allflame_receiver_region || {}
  }
}

function inferConsumerTargets(consumerId, config = {}) {
  if (Array.isArray(config.active_targets)) {
    return config.active_targets.filter(target => KNOWN_TARGETS.includes(target))
  }
  if (config.inventory_only === true) return ['inventory']
  if (consumerId === 'stash-pickup' || consumerId === 'chaos-recipe') return ['inventory', 'stash']
  if (consumerId === 'junfeng-highlight') return ['inventory', 'reward']
  if (consumerId === 'sanctum-control') return []
  if (consumerId === 'bag') {
    const hasExplicitFlags = Object.hasOwn(config, 'module_enabled') || Object.hasOwn(config, 'allflame_receiver_enabled')
    if (hasExplicitFlags) {
      const targets = ['inventory']
      if (config.module_enabled) targets.push('stash')
      if (config.allflame_receiver_enabled) targets.push('allflame_receiver')
      return targets
    }
  }
  const templates = config.templates || {}
  const inferred = []
  if (templates.inventory_title) inferred.push('inventory')
  if (templates.stash_title) inferred.push('stash')
  if (templates.junfeng_reward_title) inferred.push('reward')
  if (templates.allflame_receiver_title) inferred.push('allflame_receiver')
  return inferred
}

function stableConfig(config = {}) {
  return JSON.stringify({
    templates: normalizeTemplates(config.templates || {}),
    match_threshold: Number(config.match_threshold ?? config.matchThreshold ?? 0.8),
    inventory_only: config.inventory_only === true,
    active_targets: Array.isArray(config.active_targets) ? [...new Set(config.active_targets)].sort() : [],
    interface_titles: config.interface_titles || {}
  })
}

export class InterfaceDetectionCoordinator {
  constructor({ python, fileWatcher, logger = console } = {}) {
    this.python = python
    this.fileWatcher = fileWatcher
    this.logger = logger
    this.childDiagnostics = new WeakMap()
    this.child = null
    this.consumers = new Set()
    this.consumerConfigs = new Map()
    this.listeners = new Set()
    this.titleRegistry = new InterfaceTitleRegistry(path.join(app.getPath('userData'), 'interface-titles.json'))
    this.config = null
    this.configFingerprint = ''
    this.lifecycle = Promise.resolve()
    this.draining = Promise.resolve()
    this.pendingReconcile = null
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
    const required = ['cv2', 'mss', 'numpy']
    const found = this.python.detectPythonPathWithModules?.(required) || this.python.detectPythonPath?.()
    if (!found) throw new Error('未找到具备界面检测依赖的 Python 3')
    return found
  }

  async resolvePythonPath() {
    const required = ['cv2', 'mss', 'numpy']
    if (typeof this.python.resolvePythonRuntimeAsync === 'function') {
      const resolved = await this.python.resolvePythonRuntimeAsync(required)
      if (resolved?.path) return resolved.path
    }
    return this.pythonPath()
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

  scheduleReconcile() {
    if (!this.pendingReconcile) {
      this.pendingReconcile = new Promise((resolve, reject) => {
        setImmediate(() => {
          this.pendingReconcile = null
          this.enqueue(() => this.reconcile()).then(resolve, reject)
        })
      })
    }
    return this.pendingReconcile
  }

  effectiveConfig() {
    const map = this.titleRegistry.templates['sanctum-map']
    const mergedTemplates = normalizeTemplates(this.config?.templates || {})
    const activeTargets = new Set()
    let hasNonSanctumConsumer = false
    let allInventoryOnly = true

    for (const consumerId of this.consumers) {
      const consumerConfig = this.consumerConfigs.get(consumerId) || {}
      const templates = consumerConfig.templates || {}
      if (templates.stash_title && !mergedTemplates.stash_title) {
        mergedTemplates.stash_title = String(templates.stash_title)
        mergedTemplates.stash_region = templates.stash_region || {}
      }
      if (templates.inventory_title && !mergedTemplates.inventory_title) {
        mergedTemplates.inventory_title = String(templates.inventory_title)
        mergedTemplates.inventory_region = templates.inventory_region || {}
      }
      if (templates.junfeng_reward_title && !mergedTemplates.junfeng_reward_title) {
        mergedTemplates.junfeng_reward_title = String(templates.junfeng_reward_title)
        mergedTemplates.junfeng_reward_region = templates.junfeng_reward_region || {}
      }
      if (templates.allflame_receiver_title && !mergedTemplates.allflame_receiver_title) {
        mergedTemplates.allflame_receiver_title = String(templates.allflame_receiver_title)
        mergedTemplates.allflame_receiver_region = templates.allflame_receiver_region || {}
      }
      if (consumerId !== 'sanctum-control') {
        hasNonSanctumConsumer = true
        if (consumerConfig.inventory_only !== true) allInventoryOnly = false
      }
      for (const target of inferConsumerTargets(consumerId, consumerConfig)) {
        activeTargets.add(target)
      }
    }

    const inventoryOnly = hasNonSanctumConsumer
      ? allInventoryOnly
      : Boolean(this.config?.inventory_only === true)

    return {
      ...(this.config || {}),
      templates: mergedTemplates,
      match_threshold: Number(this.config?.match_threshold ?? this.config?.matchThreshold ?? 0.8),
      inventory_only: inventoryOnly,
      active_targets: [...activeTargets].sort(),
      interface_titles: this.consumers.has('sanctum-control') && map ? { 'sanctum-map': map } : {}
    }
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

  mergeLatestTemplates(incoming = {}) {
    const baseTemplates = normalizeTemplates(this.config?.templates || {})
    const nextTemplates = incoming.templates || {}
    for (const [titleKey, regionKey] of [
      ['stash_title', 'stash_region'],
      ['inventory_title', 'inventory_region'],
      ['junfeng_reward_title', 'junfeng_reward_region'],
      ['allflame_receiver_title', 'allflame_receiver_region']
    ]) {
      if (Object.hasOwn(nextTemplates, titleKey)) {
        const value = String(nextTemplates[titleKey] || '')
        if (value || !baseTemplates[titleKey]) {
          baseTemplates[titleKey] = value
          baseTemplates[regionKey] = nextTemplates[regionKey] || {}
        }
      }
    }
    this.config = {
      ...(this.config || {}),
      ...structuredClone(incoming),
      templates: baseTemplates,
      match_threshold: Number(incoming.match_threshold ?? incoming.matchThreshold ?? this.config?.match_threshold ?? 0.8)
    }
  }

  async registerConsumer(consumer, config = this.config || {}) {
    const id = String(consumer || '')
    if (!id) throw new Error('检测消费者不能为空')
    this.consumers.add(id)
    const cloned = structuredClone(config || {})
    this.consumerConfigs.set(id, cloned)
    this.mergeLatestTemplates(cloned)
    return this.scheduleReconcile()
  }

  unregisterConsumer(consumer) {
    const id = String(consumer || '')
    this.consumers.delete(id)
    this.consumerConfigs.delete(id)
    if (this.consumers.size === 0) this.stop('no_consumers')
    else {
      this.publish()
      void this.scheduleReconcile().catch(error => {
        this.publish({ reason: error.message })
      })
    }
    return this.getState()
  }

  async updateConfig(config, consumer = '') {
    const cloned = structuredClone(config || {})
    if (consumer) {
      this.consumerConfigs.set(String(consumer), cloned)
      this.mergeLatestTemplates(cloned)
    } else {
      // 全局更新（如用户修改了模板或阈值）时保留各消费者自身声明的 active_targets，同时更新共享模板与阈值。
      const nextTemplates = normalizeTemplates(cloned.templates || {})
      const hasAnyExplicitTargets = Object.hasOwn(cloned, 'module_enabled') ||
        Object.hasOwn(cloned, 'allflame_receiver_enabled') ||
        Array.isArray(cloned.active_targets)
      if (hasAnyExplicitTargets && this.consumers.has('bag')) {
        this.consumerConfigs.set('bag', cloned)
      }
      this.config = {
        ...(this.config || {}),
        ...cloned,
        templates: nextTemplates,
        match_threshold: Number(cloned.match_threshold ?? cloned.matchThreshold ?? this.config?.match_threshold ?? 0.8)
      }
    }
    return this.enqueue(() => this.reconcile())
  }

  writeConfig() {
    const configPath = path.join(this.fileWatcher.getFilePaths().tempDir, 'interface_detection_config.json')
    fs.writeFileSync(configPath, JSON.stringify(this.effectiveConfig(), null, 2), 'utf8')
    return configPath
  }

  async start() {
    if (this.child || this.consumers.size === 0) return this.getState()
    const diagnostic = createDetectionProcessDiagnostics({ logger: this.logger, getConsumers: () => [...this.consumers] })
    diagnostic.record({ phase: 'interface-detection-start', outcome: 'started', reasonCode: 'spawn_requested' })
    let child
    try {
      const pythonExe = await this.resolvePythonPath()
      if (this.child || this.consumers.size === 0) return this.getState()
      child = spawn(pythonExe, [
        this.scriptPath(), '--mode', 'detect', '--config', this.writeConfig()
      ], {
        shell: false,
        windowsHide: true,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1', PYTHONFAULTHANDLER: '1' }
      })
    } catch (error) {
      diagnostic.record({ phase: 'interface-detection-error', outcome: 'failed', reasonCode: 'spawn_failed', error })
      throw error
    }
    diagnostic.bind(child)
    this.childDiagnostics.set(child, diagnostic)
    child.once('spawn', () => diagnostic.record({ phase: 'interface-detection-start', outcome: 'succeeded', reasonCode: 'spawned' }))
    child.on('exit', (code, signal) => diagnostic.lifecycle('process-exit', `code=${code} signal=${signal || 'none'}`))
    this.child = child
    this.configFingerprint = stableConfig(this.effectiveConfig())
    const childFingerprint = this.configFingerprint
    let terminalReason = ''
    let stderr = ''
    let spawnError = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', createEventLineParser((event) => {
      diagnostic.event()
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
        diagnostic.record({
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
      diagnostic.record({ phase: 'interface-detection-error', outcome: 'failed', reasonCode: 'process_error', error })
      console.error('[公共界面检测] 进程错误:', error)
    })
    child.on('close', (code, signal) => {
      diagnostic.lifecycle('close', `code=${code} signal=${signal || 'none'} stderr=${stderr.slice(-3500).trim()}`)
      if (this.child !== child) return
      this.child = null
      const reason = code === 0 ? 'process-ended' : (terminalReason || describeDetectionExit({ code, stderr, spawnError }))
      console.error(`[公共界面检测] 检测进程意外退出 code=${code} stderr=${stderr.slice(-600).trim() || '(空)'}`)
      diagnostic.record({
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
      diagnostic.record({ phase: 'interface-detection-ready', outcome: 'succeeded', reasonCode: 'startup_complete' })
      if (this.child !== child) return this.getState()
      this.publish({ running: true, reloading: false, reason: '', exitCode: null, failureCode: '', configurationIssueId: '' })
      return this.getState()
    } catch (error) {
      if (this.child !== child) return this.getState()
      this.child = null
      diagnostic.stop('startup_failed')
      this.draining = stopChild(child)
      await this.draining
      this.publish({ running: false, reloading: false, ready: false, inventoryReady: false, stashReady: false, allflameReceiverReady: false, rewardDetected: false, junfengReady: false, foreground: false, reason: error.message })
      throw error
    }
  }

  async restart() {
    const previous = this.child
    this.child = null
    if (previous) this.childDiagnostics.get(previous)?.stop('config_restart')
    this.draining = stopChild(previous)
    this.publish({ running: false, reloading: true, ready: false, inventoryReady: false, stashReady: false, allflameReceiverReady: false, rewardDetected: false, junfengReady: false, foreground: false, reason: '', exitCode: null, failureCode: '', configurationIssueId: '' })
    await this.draining
    return this.start()
  }

  stop(reason = 'explicit_stop') {
    const child = this.child
    this.child = null
    if (child) this.childDiagnostics.get(child)?.stop(reason)
    if (child) this.draining = stopChild(child)
    this.publish({ running: false, reloading: false, ready: false, inventoryReady: false, stashReady: false, allflameReceiverReady: false, rewardDetected: false, junfengReady: false, foreground: false, gameBounds: null, reason: '', exitCode: null, failureCode: '', configurationIssueId: '' })
  }

  cleanup() {
    this.consumers.clear()
    this.consumerConfigs.clear()
    this.stop('application_cleanup')
    this.listeners.clear()
  }
}
