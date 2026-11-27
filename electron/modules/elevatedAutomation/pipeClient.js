import { EventEmitter } from 'node:events'
import net from 'node:net'

const PIPE_PATTERN = /^\\\\\.\\pipe\\PoECNHelper\.ElevatedAutomation\.[A-Za-z0-9._-]{8,128}$/u
const MAX_MESSAGE_BYTES = 32 * 1024 * 1024
const RETRYABLE = new Set(['ENOENT', 'EPIPE', 'ECONNREFUSED', 'EAGAIN', 'EBUSY'])

export class ElevatedPipeError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'ElevatedPipeError'
    this.code = code
  }
}

export class NamedPipeHostConnection extends EventEmitter {
  constructor(socket) {
    super()
    this.socket = socket
    this.buffer = ''
    this.hello = null
    this.lastError = null
    this.closed = false
    socket.setEncoding?.('utf8')
    socket.on('data', chunk => this._read(String(chunk)))
    socket.on('error', error => {
      this.lastError = error
      if (!this.closed && this.listenerCount('error') > 0) this.emit('error', error)
    })
    socket.on('close', () => {
      if (this.closed) return
      this.closed = true
      this.emit('close')
    })
  }

  waitForHello(expectedHostProcessId, timeoutMs) {
    if (this.hello) {
      try {
        return Promise.resolve(this._validateHello(expectedHostProcessId))
      } catch (error) {
        return Promise.reject(error)
      }
    }
    if (this.closed) {
      return Promise.reject(
        this.lastError instanceof ElevatedPipeError
          ? this.lastError
          : new ElevatedPipeError('HOST_CONNECT_FAILED', this.lastError?.message || 'Host 在握手前关闭了命名管道')
      )
    }
    return new Promise((resolve, reject) => {
      const finish = (error, value) => {
        clearTimeout(timer)
        this.removeListener('hello', onHello)
        this.removeListener('error', onError)
        this.removeListener('close', onClose)
        if (error) {
          this.close()
          reject(error)
        } else {
          resolve(value)
        }
      }
      const onHello = value => {
        this.removeListener('close', onClose)
        this.removeListener('error', onError)
        try { finish(null, this._validateHello(expectedHostProcessId, value)) } catch (error) { finish(error) }
      }
      const onError = error => {
        finish(
          error instanceof ElevatedPipeError
            ? error
            : new ElevatedPipeError('HOST_CONNECT_FAILED', error?.message || 'Host 握手期间命名管道出错')
        )
      }
      const onClose = () => {
        finish(
          this.lastError instanceof ElevatedPipeError
            ? this.lastError
            : new ElevatedPipeError('HOST_CONNECT_FAILED', 'Host 在握手前关闭了命名管道')
        )
      }
      const timer = setTimeout(() => finish(new ElevatedPipeError('HOST_CONNECT_TIMEOUT', '等待 Host 握手超时')), timeoutMs)
      this.once('hello', onHello)
      this.once('error', onError)
      this.once('close', onClose)
    })
  }

  _validateHello(expectedHostProcessId, value = this.hello) {
    const keys = value && typeof value === 'object' && !Array.isArray(value)
      ? Object.keys(value).sort().join(',')
      : ''
    if (keys !== 'hostProcessId,protocolVersion,type' || value.type !== 'hello' || value.protocolVersion !== 1 || value.hostProcessId !== expectedHostProcessId) {
      this.close()
      throw new ElevatedPipeError('HOST_IDENTITY_MISMATCH', '命名管道 Host 身份不匹配')
    }
    return this
  }

  send(message) {
    if (this.closed) return Promise.reject(new ElevatedPipeError('HOST_DISCONNECTED', '命名管道已关闭'))
    let body
    try { body = `${JSON.stringify(message)}\n` } catch { return Promise.reject(new ElevatedPipeError('INVALID_PIPE_MESSAGE', '消息无法序列化')) }
    if (Buffer.byteLength(body, 'utf8') > MAX_MESSAGE_BYTES) {
      return Promise.reject(new ElevatedPipeError('PIPE_MESSAGE_TOO_LARGE', '命名管道消息超限'))
    }
    return new Promise((resolve, reject) => {
      this.socket.write(body, 'utf8', error => (error ? reject(error) : resolve()))
    })
  }

  close() {
    if (this.closed) return
    this.closed = true
    try { this.socket.end?.() } catch {}
    try { this.socket.destroy?.() } catch {}
    this.emit('close')
  }

  _read(chunk) {
    if (this.closed) return
    this.buffer += chunk
    if (Buffer.byteLength(this.buffer, 'utf8') > MAX_MESSAGE_BYTES * 2) return this._protocolFailure('命名管道未读缓冲超限')
    while (this.buffer.includes('\n')) {
      const index = this.buffer.indexOf('\n')
      const line = this.buffer.slice(0, index).replace(/\r$/u, '')
      this.buffer = this.buffer.slice(index + 1)
      if (!line || Buffer.byteLength(line, 'utf8') > MAX_MESSAGE_BYTES) return this._protocolFailure('命名管道消息无效')
      let message
      try { message = JSON.parse(line) } catch { return this._protocolFailure('命名管道消息不是 JSON') }
      if (!message || typeof message !== 'object' || Array.isArray(message)) return this._protocolFailure('命名管道消息必须是对象')
      if (!this.hello) {
        this.hello = message
        this.emit('hello', message)
      } else {
        this.emit('message', message)
      }
    }
  }

  _protocolFailure(message) {
    const error = new ElevatedPipeError('INVALID_PIPE_MESSAGE', message)
    this.lastError = error
    if (!this.closed && this.listenerCount('error') > 0) this.emit('error', error)
    this.close()
  }
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function openPipe(pipeName, createConnection, timeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = createConnection(pipeName)
    let settled = false
    const cleanup = () => {
      clearTimeout(timer)
      socket.removeListener?.('connect', onConnect)
      socket.removeListener?.('error', onError)
      socket.removeListener?.('close', onClose)
    }
    const onConnect = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve(new NamedPipeHostConnection(socket))
    }
    const onError = error => {
      if (settled) return
      settled = true
      cleanup()
      socket.on?.('error', () => {})
      try { socket.destroy?.() } catch {}
      reject(error)
    }
    const onClose = () => {
      if (settled) return
      settled = true
      cleanup()
      reject(Object.assign(new Error('命名管道在连接建立前关闭'), { code: 'EPIPE' }))
    }
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      cleanup()
      socket.on?.('error', () => {})
      try { socket.destroy?.() } catch {}
      reject(new ElevatedPipeError('HOST_CONNECT_TIMEOUT', '连接高权限自动化 Host 超时'))
    }, Math.max(1, timeoutMs))
    socket.once('connect', onConnect)
    socket.once('error', onError)
    socket.once('close', onClose)
  })
}

export async function connectNamedPipeHost({
  pipeName,
  expectedHostProcessId,
  timeoutMs = 15_000,
  createConnection = value => net.createConnection(value)
} = {}) {
  if (!PIPE_PATTERN.test(pipeName) || !Number.isSafeInteger(expectedHostProcessId) || expectedHostProcessId <= 0) {
    throw new ElevatedPipeError('INVALID_PIPE_TARGET', '命名管道连接目标无效')
  }
  const deadline = Date.now() + timeoutMs
  let lastError = null
  while (Date.now() < deadline) {
    try {
      const connection = await openPipe(pipeName, createConnection, Math.max(1, deadline - Date.now()))
      return await connection.waitForHello(expectedHostProcessId, Math.max(1, deadline - Date.now()))
    } catch (error) {
      lastError = error
      if (error instanceof ElevatedPipeError || !RETRYABLE.has(error?.code)) throw error
      await delay(Math.min(50, Math.max(1, deadline - Date.now())))
    }
  }
  throw new ElevatedPipeError('HOST_CONNECT_TIMEOUT', lastError?.message || '连接高权限自动化 Host 超时')
}
