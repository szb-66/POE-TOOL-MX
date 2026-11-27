import { EventEmitter } from 'node:events'
import { PassThrough, Writable } from 'node:stream'

/**
 * 与 Node ChildProcess 兼容的高权限远程进程适配器：
 * 支持 stdin/stdout/stderr 双向流、pid、kill(0/SIGTERM/SIGKILL)、spawn/close/exit/error 事件。
 */
export class RemoteElevatedChild extends EventEmitter {
  constructor({ requestId, operationId, writeStdin, endStdin, stop, onTerminal } = {}) {
    super()
    this.requestId = requestId
    this.operationId = operationId
    this.isRemoteElevated = true
    this.stdout = new PassThrough()
    this.stderr = new PassThrough()
    this.stdin = new Writable({
      write: (chunk, encoding, callback) => {
        if (this.terminated) {
          callback(new Error('高权限进程已结束'))
          return
        }
        const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk)
        Promise.resolve(writeStdin?.(this.requestId, text))
          .then(() => callback())
          .catch(error => callback(error))
      },
      final: (callback) => {
        Promise.resolve(endStdin?.(this.requestId))
          .then(() => callback())
          .catch(() => callback())
      }
    })
    this.stdin.on('error', () => {})
    this.processId = null
    this.exitCode = null
    this.signalCode = null
    this.killed = false
    this.terminated = false
    this._stop = stop
    this._stopPromise = null
    this._onTerminal = onTerminal
  }

  get pid() {
    return this.processId
  }

  kill(signal = 'SIGTERM') {
    if (signal === 0 || signal === '0') {
      if (this.terminated) throw Object.assign(new Error('ESRCH'), { code: 'ESRCH' })
      return true
    }
    if (this.terminated) return true
    this.killed = true
    void this.stop()
    return true
  }

  stop() {
    if (this.terminated) return Promise.resolve(true)
    if (!this._stopPromise) {
      this._stopPromise = Promise.resolve()
        .then(() => this._stop?.(this.requestId))
        .catch(() => false)
    }
    return this._stopPromise
  }

  accept(message) {
    if (this.terminated || message?.requestId !== this.requestId) return false
    if (message.type === 'started') {
      if (!Number.isSafeInteger(message.processId) || message.processId <= 0) {
        return this.fail('INVALID_HOST_EVENT', '高权限 Host 返回了无效子进程 PID')
      }
      this.processId = message.processId
      this.emit('spawn')
      return true
    }
    if (message.type === 'stdout') {
      this.stdout.write(String(message.data || ''), 'utf8')
      return true
    }
    if (message.type === 'stderr') {
      this.stderr.write(String(message.data || ''), 'utf8')
      return true
    }
    if (message.type === 'exited') {
      const code = Number.isInteger(message.exitCode) ? message.exitCode : 1
      return this._finish(code, null)
    }
    if (message.type === 'error') {
      return this.fail(message.code || 'HOST_ERROR', message.message || '高权限操作失败')
    }
    return false
  }

  fail(code, message) {
    if (this.terminated) return false
    const error = Object.assign(new Error(message || '高权限操作失败'), { code })
    this.terminated = true
    this.exitCode = 1
    this.stdout.end()
    this.stderr.end()
    this.stdin.destroy()
    this._onTerminal?.(this)
    if (this.listenerCount('error') > 0) this.emit('error', error)
    this.emit('exit', 1, null)
    this.emit('close', 1, null)
    return true
  }

  _finish(code, signal) {
    if (this.terminated) return false
    this.terminated = true
    this.exitCode = code
    this.signalCode = signal
    this.stdout.end()
    this.stderr.end()
    this.stdin.destroy()
    this._onTerminal?.(this)
    this.emit('exit', code, signal)
    this.emit('close', code, signal)
    return true
  }
}
