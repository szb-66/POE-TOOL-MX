import { SANCTUM_TIMEOUTS, sanctumError } from './errors.js'
import { fileURLToPath } from 'node:url'
import { createPythonProcess } from '../python/launcher.js'
import { resolvePythonRuntimeAsync } from '../python/detector.js'
import { randomUUID } from 'node:crypto'

// One sequential native session, never a shell. An aborted request tears down
// its process; no late response can be applied to a replacement session.
export class SanctumNativeClient {
  constructor({ resolveRuntime = resolvePythonRuntimeAsync, launch = createPythonProcess, onSafety = () => {}, onProgress = () => {}, onSurface = () => {}, onEvidence = () => {}, captureWindows = () => [], env = process.env } = {}) {
    Object.assign(this, { resolveRuntime, launch, onSafety, onProgress, onSurface, onEvidence, captureWindows, env })
    this.sessionId = randomUUID()
    this.child = null; this.pending = null; this.starting = null; this.sequence = 0; this.closed = false
    this.drain = Promise.resolve()
  }
  async start(signal) {
    signal?.throwIfAborted()
    if (this.closed) throw new Error('圣所原生通道已关闭')
    if (this.child) return
    if (this.starting) return this.starting
    const task = (async () => {
      await this.drain
      const runtime = await this.resolveRuntime(['cv2', 'numpy', 'mss', 'rapidocr', 'onnxruntime', 'pyperclip'])
      signal?.throwIfAborted()
      if (this.closed) throw new Error('圣所原生通道已关闭')
      const { process: child, started } = this.launch({ pythonPath: runtime.path,
        scriptPath: fileURLToPath(new URL('../../../src/assets/scripts/sanctum_native.py', import.meta.url)), stdin: 'pipe', env: this.env })
      this.child = child
      this.drain = new Promise(resolve => child.once('close', resolve))
      let buffer = ''
      child.stdout.setEncoding('utf8')
      child.stdout.on('data', chunk => {
        if (child !== this.child) return
        buffer += chunk
        if (buffer.length > 26 * 1024 * 1024) { this.abort(new Error('圣所原生响应过大')); return }
        const lines = buffer.split(/\r?\n/); buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('SANCTUM ')) continue
          let message
          try { message = JSON.parse(line.slice(8)) } catch { this.abort(new Error('圣所原生响应损坏')); return }
          if (message.event === 'unsafe') {
            const error = sanctumError(message.code || 'SAFETY_INTERRUPTED',message.reason || '采集环境失效')
            if (error.code !== 'STEP_TIMEOUT') this.onSafety({...message,code:error.code})
            this.abort(error); return
          }
          const pending = this.pending
          if (!pending || message.id !== pending.id) continue
          if (message.sessionId !== undefined && message.sessionId !== this.sessionId) continue
          if (message.event === 'progress') { this.onProgress(message); continue }
          if (message.event === 'surface') { this.onSurface(message); continue }
          if (message.event === 'evidence') { this.onEvidence(message); continue }
          this.pending = null; pending.cleanup()
          if (message.success === true) pending.resolve(message.data)
          else pending.reject(sanctumError(message.code || 'STEP_FAILED',String(message.error || '圣所采集失败').slice(0, 240)))
        }
      })
      // Native error text may contain filesystem paths. Consume it without
      // copying it into the UI, logs or persisted state.
      child.stderr.on('data', () => {})
      child.on('error', () => { if (child === this.child) this.abort(new Error('圣所原生进程无法运行')) })
      child.once('close', () => {
        if (child !== this.child) return
        this.child = null
        const pending = this.pending; this.pending = null
        if (pending) { pending.cleanup(); pending.reject(new Error('圣所原生进程已退出')) }
      })
      await started
    })()
    this.starting = task
    try { await task } finally { if (this.starting === task) this.starting = null }
  }
  async request(command, input = {}, { signal, timeoutMs = SANCTUM_TIMEOUTS.capture } = {}) {
    const remaining = this.deadlineAt ? this.deadlineAt - Date.now() : timeoutMs
    if (remaining <= 0) { this.abort(sanctumError('STEP_TIMEOUT','当前步骤超时')); await this.drain; throw sanctumError('STEP_TIMEOUT','当前步骤超时') }
    timeoutMs = Math.min(timeoutMs, remaining)
    const deadlineAt = Date.now() + timeoutMs
    signal = AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(Math.max(1, Math.ceil(timeoutMs)))])
    signal?.throwIfAborted()
    let abortStarting
    const interrupted = new Promise((_,reject) => {
      abortStarting = () => {
        const error = signal.reason?.name === 'TimeoutError' ? sanctumError('STEP_TIMEOUT','当前步骤超时') : sanctumError('SAFETY_INTERRUPTED','圣所采集已停止')
        this.abort(error); reject(error)
      }
      signal.addEventListener('abort',abortStarting,{once:true})
    })
    try { await Promise.race([this.start(signal),interrupted]) }
    catch (error) { this.abort(error); await this.drain; throw error }
    finally { signal.removeEventListener('abort',abortStarting) }
    if (signal?.aborted) { const error = signal.reason?.name === 'TimeoutError' ? sanctumError('STEP_TIMEOUT','当前步骤超时') : signal.reason; this.abort(error); await this.drain; throw error }
    if (this.pending) throw new Error('圣所原生操作尚未结束')
    const child = this.child
    if (!child) throw new Error('圣所原生进程未就绪')
    const drain = this.drain
    const response = new Promise((resolve, reject) => {
      const id = ++this.sequence
      const abort = () => this.abort(signal?.reason?.name === 'TimeoutError' ? sanctumError('STEP_TIMEOUT','当前步骤超时') : sanctumError('SAFETY_INTERRUPTED','圣所采集已停止'))
      const timer = setTimeout(() => this.abort(sanctumError('STEP_TIMEOUT','当前步骤超时')), timeoutMs)
      const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort) }
      this.pending = { id, resolve, reject, cleanup }
      signal?.addEventListener('abort', abort, { once: true })
      try {
        child.stdin.write(`${JSON.stringify({ id, sessionId: this.sessionId, command, input: { ...input, deadlineAt, captureWindows: this.captureWindows() } })}\n`, error => {
          if (error && child === this.child) this.abort(new Error('圣所原生通道写入失败'))
        })
      } catch { this.abort(new Error('圣所原生参数或通道无效')) }
    })
    try { return await response }
    finally { if (this.child !== child) await drain }
  }
  abort(error = new Error('圣所采集已停止')) {
    const child = this.child; this.child = null
    const pending = this.pending; this.pending = null
    if (pending) { pending.cleanup(); pending.reject(error) }
    if (child) { child.stdin.destroy(); child.kill() }
  }
  async shutdown() { this.closed = true; this.abort(); await this.drain }
}
