import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000
const STARTUP_TIMEOUT_MS = 15000
const SHUTDOWN_GRACE_MS = 1500
const WARMUP_COOLDOWN_MS = 15000

const modelStampCache = new Map()

export function resolveVerifiedModelStamp(modelPath) {
  if (!modelPath) return null
  try {
    const stat = fs.statSync(modelPath)
    const size = Number(stat.size)
    const mtimeMs = Math.trunc(stat.mtimeMs)
    const cached = modelStampCache.get(modelPath)
    if (cached && cached.size === size && cached.mtimeMs === mtimeMs) return cached
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(modelPath)).digest('hex')
    const stamp = { size, mtimeMs, sha256 }
    if (modelStampCache.size > 16) modelStampCache.clear()
    modelStampCache.set(modelPath, stamp)
    return stamp
  } catch {
    modelStampCache.delete(modelPath)
    return null
  }
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
      try { onEvent(JSON.parse(line.slice(6))) } catch { onLog(line) }
    }
  }
}

function terminateChild(child, graceMs = 1200) {
  if (!child || child.exitCode !== null || child.signalCode) return
  try { child.kill('SIGTERM') } catch {}
  const timer = setTimeout(() => {
    if (child.exitCode === null && !child.signalCode) {
      try { child.kill('SIGKILL') } catch {}
    }
  }, graceMs)
  timer.unref?.()
}

export class HighlightPickupWorker {
  constructor({
    python,
    scriptPath,
    fileWatcher,
    resolveWarmupConfig = null,
    interfaceDetection = null,
    idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
    logger = console
  }) {
    this.python = python
    this.scriptPath = scriptPath
    this.fileWatcher = fileWatcher
    this.resolveWarmupConfig = resolveWarmupConfig
    this.interfaceDetection = interfaceDetection
    this.idleTimeoutMs = Math.max(1000, Number(idleTimeoutMs) || DEFAULT_IDLE_TIMEOUT_MS)
    this.logger = logger

    this.child = null
    this.ready = false
    this.startingPromise = null
    this.activeRequest = null
    this.idleTimer = null
    this.requestSequence = 0
    this.consumers = new Map()
    this.lastWarmupAttemptAt = 0
    this.warmupInFlight = false
    this.disposed = false

    this.disposeDetection = interfaceDetection?.subscribe(state => {
      this.handleDetectionState(state)
    })
  }

  setConsumerEnabled(consumerId, enabled) {
    const id = String(consumerId || '')
    if (!id) return
    if (enabled) this.consumers.set(id, true)
    else this.consumers.delete(id)
    if (!this.hasEnabledConsumers() && !this.activeRequest) {
      this.recycle('all-consumers-disabled')
    }
  }

  hasEnabledConsumers() {
    return this.consumers.size > 0
  }

  handleDetectionState(state = {}) {
    if (this.disposed || !state.foreground) return
    if (this.child || this.startingPromise || this.activeRequest || this.warmupInFlight) return
    const stashEnabled = Boolean(this.consumers.get('stash-pickup'))
    const junfengEnabled = Boolean(this.consumers.get('junfeng'))
    const shouldWarmup = (stashEnabled && Boolean(state.stashReady ?? state.ready)) ||
      (junfengEnabled && Boolean(state.rewardDetected))
    if (!shouldWarmup) return
    const now = Date.now()
    if (now - this.lastWarmupAttemptAt < WARMUP_COOLDOWN_MS) return
    this.lastWarmupAttemptAt = now
    void this.warmup().catch(error => {
      this.logger.debug?.('[高亮取件Worker] 懒预热失败:', error?.message || error)
    })
  }

  async resolvePythonPath() {
    const required = ['cv2', 'mss', 'numpy', 'onnxruntime', 'pynput', 'pyperclip']
    if (typeof this.python?.resolvePythonRuntimeAsync === 'function') {
      const resolved = await this.python.resolvePythonRuntimeAsync(required)
      if (resolved?.path) return resolved.path
    }
    const found = this.python?.detectPythonPathWithModules?.(required) || this.python?.detectPythonPath?.()
    if (!found) throw new Error('未找到高亮识别所需 Python 运行时')
    return found
  }

  clearIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
    }
  }

  scheduleIdleRecycle() {
    this.clearIdleTimer()
    if (!this.child || this.activeRequest || this.disposed) return
    this.idleTimer = setTimeout(() => {
      this.idleTimer = null
      if (!this.activeRequest) this.recycle('idle-timeout')
    }, this.idleTimeoutMs)
    this.idleTimer.unref?.()
  }

  async ensureStarted() {
    if (this.disposed) throw new Error('高亮取件 Worker 已释放')
    if (this.child && this.ready && this.child.exitCode === null) return this.child
    if (this.startingPromise) return this.startingPromise

    this.startingPromise = (async () => {
      const pythonExe = await this.resolvePythonPath()
      const script = typeof this.scriptPath === 'function' ? this.scriptPath() : String(this.scriptPath || '')
      if (!script) throw new Error('高亮取件脚本不存在')
      if (this.disposed) throw new Error('高亮取件 Worker 已释放')

      const child = spawn(pythonExe, [script, '--worker'], {
        shell: false,
        windowsHide: true,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' }
      })
      this.child = child
      this.ready = false
      let stderr = ''

      return await new Promise((resolve, reject) => {
        let settled = false
        const startupTimer = setTimeout(() => {
          if (settled) return
          settled = true
          if (this.child === child) {
            this.child = null
            this.ready = false
          }
          terminateChild(child)
          reject(new Error('高亮取件 Worker 启动超时'))
        }, STARTUP_TIMEOUT_MS)
        startupTimer.unref?.()

        const finishStartup = error => {
          if (settled) return
          settled = true
          clearTimeout(startupTimer)
          if (error) reject(error)
          else resolve(child)
        }

        child.stdout.setEncoding('utf8')
        child.stderr.setEncoding('utf8')
        child.stdout.on('data', createLineParser(event => {
          if (this.child !== child) return
          if (event.event === 'worker-ready') {
            this.ready = true
            finishStartup(null)
            return
          }
          if (event.event === 'worker-shutdown') return
          this.handleWorkerEvent(event)
        }, line => this.logger.log?.('[高亮取件Worker]', line)))

        child.stderr.on('data', chunk => {
          stderr = `${stderr}${String(chunk)}`.slice(-2000)
          this.logger.error?.('[高亮取件Worker]', String(chunk).trim())
        })

        child.on('error', error => {
          if (this.child === child) {
            this.child = null
            this.ready = false
          }
          finishStartup(error)
          this.failActiveRequest(new Error(error?.message || '高亮取件 Worker 进程错误'))
        })

        child.on('close', code => {
          if (this.child === child) {
            this.child = null
            this.ready = false
            this.clearIdleTimer()
          }
          const detail = stderr.trim() || `高亮取件 Worker 退出（${code}）`
          finishStartup(new Error(detail))
          this.failActiveRequest(new Error(detail))
        })
      })
    })().finally(() => {
      this.startingPromise = null
    })

    return this.startingPromise
  }

  handleWorkerEvent(event) {
    const active = this.activeRequest
    if (!active) return
    if (event.requestId && event.requestId !== active.requestId) return
    active.onEvent?.(event)
    if (['warmup-done', 'preview', 'completed', 'aborted', 'error'].includes(event.event)) {
      this.activeRequest = null
      active.resolve(event)
      if (!this.hasEnabledConsumers()) this.recycle('all-consumers-disabled')
      else this.scheduleIdleRecycle()
    }
  }

  failActiveRequest(error) {
    const active = this.activeRequest
    if (!active) return
    this.activeRequest = null
    active.reject(error)
  }

  sendCommand(cmd, configPath, { onEvent = null } = {}) {
    if (this.activeRequest) {
      return {
        promise: Promise.reject(new Error('高亮取件 Worker 正忙')),
        cancel: () => {}
      }
    }
    this.clearIdleTimer()
    const requestId = `req-${++this.requestSequence}-${Date.now()}`
    let cancelled = false

    const promise = (async () => {
      const child = await this.ensureStarted()
      if (cancelled) throw new Error('请求已取消')
      if (!child.stdin || child.stdin.destroyed) throw new Error('高亮取件 Worker 通道不可用')
      return await new Promise((resolve, reject) => {
        this.activeRequest = { requestId, onEvent, resolve, reject, cmd }
        try {
          child.stdin.write(`${JSON.stringify({ cmd, requestId, configPath })}\n`, 'utf8')
        } catch (error) {
          this.activeRequest = null
          reject(error)
        }
      })
    })()

    const cancel = (reason = 'user') => {
      cancelled = true
      if (this.activeRequest?.requestId === requestId) {
        const active = this.activeRequest
        this.activeRequest = null
        // 中止运行中任务时终止 Worker，确保 Python 立即释放键鼠且无残留状态。
        this.terminateNow(`cancel:${reason}`)
        active.reject(Object.assign(new Error(reason), { cancelled: true }))
      }
    }

    return { promise, cancel }
  }

  async warmup() {
    if (this.disposed || this.activeRequest || this.warmupInFlight) return null
    if (typeof this.resolveWarmupConfig !== 'function') return null
    this.warmupInFlight = true
    try {
      const config = this.resolveWarmupConfig()
      if (!config?.model_path || !config?.manifest_path) return null
      const tempDir = this.fileWatcher?.getFilePaths?.().tempDir
      if (!tempDir) return null
      const configPath = path.join(tempDir, 'highlight_worker_warmup.json')
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')
      const { promise } = this.sendCommand('warmup', configPath)
      return await promise
    } finally {
      this.warmupInFlight = false
    }
  }

  async preview(configPath) {
    const { promise } = this.sendCommand('preview', configPath)
    return promise
  }

  start(configPath, onEvent) {
    return this.sendCommand('run', configPath, { onEvent })
  }

  recycle(reason = 'recycle') {
    this.clearIdleTimer()
    const child = this.child
    if (!child) return
    this.child = null
    this.ready = false
    if (this.activeRequest) {
      this.terminateChildProcess(child)
      this.failActiveRequest(new Error(`高亮取件 Worker 已回收（${reason}）`))
      return
    }
    try {
      if (child.stdin && !child.stdin.destroyed) {
        child.stdin.write(`${JSON.stringify({ cmd: 'shutdown' })}\n`, 'utf8')
        child.stdin.end()
      }
    } catch {}
    const timer = setTimeout(() => terminateChild(child, 800), SHUTDOWN_GRACE_MS)
    timer.unref?.()
    child.once('close', () => clearTimeout(timer))
  }

  terminateChildProcess(child) {
    terminateChild(child, 1200)
  }

  terminateNow(reason = 'terminate') {
    this.clearIdleTimer()
    const child = this.child
    this.child = null
    this.ready = false
    if (child) terminateChild(child, 1200)
    if (this.activeRequest) {
      this.failActiveRequest(new Error(reason))
    }
  }

  invalidate(reason = 'model-updated') {
    modelStampCache.clear()
    if (!this.activeRequest) this.recycle(reason)
  }

  isRunning() {
    return Boolean(this.child && this.child.exitCode === null)
  }

  cleanup() {
    this.disposed = true
    this.consumers.clear()
    this.disposeDetection?.()
    this.disposeDetection = null
    this.terminateNow('cleanup')
  }
}
