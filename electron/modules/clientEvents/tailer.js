import { open, stat } from 'node:fs/promises'
import { StringDecoder } from 'node:string_decoder'
import { createHash } from 'node:crypto'

const identity = value => `${value.dev ?? ''}:${value.ino ?? ''}:${value.birthtimeMs ?? ''}`
const digest = value => createHash('sha256').update(value).digest('hex')
const CHUNK = 64 * 1024
const TAIL = 256 * 1024

export class ClientLogTailer {
  constructor({ filePath, intervalMs = 500, onLine = () => {}, onState = () => {}, onRecovery = null } = {}) {
    Object.assign(this, { filePath, intervalMs, onLine, onState, onRecovery })
    this.offset = 0; this.fileIdentity = ''; this.lastMtimeMs = 0
    this.decoder = new StringDecoder('utf8'); this.lineBuffer = ''; this.lineOffset = 0
    this.timer = null; this.started = false; this.polling = false; this.generation = 0
    this.lifecycle = 0
    this.contentEvidence = null
    this.ioTask = Promise.resolve()
    this.pollTask = null
    this.sourceId = digest(filePath.toLowerCase())
  }
  resetDecoder() { this.decoder = new StringDecoder('utf8'); this.lineBuffer = ''; this.lineOffset = this.offset }
  metadata(offset) { return { sourceId: this.sourceId, fileId: digest(this.fileIdentity), offset, generation: this.generation } }
  async readEvidence(size) {
    const handle = await open(this.filePath, 'r')
    try {
      const start = Math.max(0, size - TAIL), buffer = Buffer.alloc(size - start)
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, start)
      return bytesRead === buffer.length ? digest(buffer) : null
    } finally { await handle.close() }
  }
  async recover(info, lifecycle = this.lifecycle) {
    this.offset = info.size; this.resetDecoder()
    if (!this.onRecovery) return
    const handle = await open(this.filePath, 'r')
    try {
      const start = Math.max(0, info.size - TAIL)
      const buffer = Buffer.alloc(info.size - start)
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, start)
      if (!this.started || lifecycle !== this.lifecycle) return
      let text = this.decoder.write(buffer.subarray(0, bytesRead))
      let offset = start
      if (start) { const end = text.indexOf('\n'); if (end < 0) return; offset += Buffer.byteLength(text.slice(0, end + 1)); text = text.slice(end + 1) }
      const lines = text.split('\n'); this.lineBuffer = lines.pop() || ''
      const entries = []
      for (const line of lines) { entries.push({ line: line.replace(/\r$/, '').replace(/^\uFEFF/, ''), ...this.metadata(offset) }); offset += Buffer.byteLength(line + '\n') }
      this.lineOffset = offset
      await this.onRecovery(entries)
    } finally { await handle.close() }
  }
  async start() {
    if (this.started) return
    this.started = true
    const lifecycle = ++this.lifecycle
    try {
      const info = await stat(this.filePath)
      if (!this.started || lifecycle !== this.lifecycle) return
      if (!info.isFile()) throw new Error('Client.txt 不是普通文件')
      this.fileIdentity = identity(info); this.lastMtimeMs = info.mtimeMs
      await this.recover(info, lifecycle)
      this.contentEvidence = await this.readEvidence(this.offset)
      if (!this.started || lifecycle !== this.lifecycle) return
      this.onState({ state: 'started' })
    } catch (error) {
      if (!this.started || lifecycle !== this.lifecycle) return
      this.offset = 0; this.fileIdentity = ''; this.onState({ state: error.code === 'ENOENT' ? 'waiting' : 'error', error: error.code === 'ENOENT' ? '' : 'Client.txt 读取失败' })
    }
    if (!this.started || lifecycle !== this.lifecycle) return
    this.timer = setInterval(() => void this.poll(), this.intervalMs); this.timer.unref?.()
  }
  emitLines(text) {
    this.lineBuffer += text
    const lines = this.lineBuffer.split('\n'); this.lineBuffer = lines.pop() || ''
    for (const line of lines) {
      const offset = this.lineOffset; this.lineOffset += Buffer.byteLength(line + '\n')
      this.onLine(line.replace(/\r$/, '').replace(/^\uFEFF/, ''), this.metadata(offset))
    }
    // A malformed unbounded line cannot be a supported system message.
    if (this.lineBuffer.length > CHUNK) { this.lineOffset += Buffer.byteLength(this.lineBuffer); this.lineBuffer = '' }
  }
  serial(operation) {
    const task = this.ioTask.then(operation)
    this.ioTask = task.catch(() => {})
    return task
  }
  async poll() {
    if (this.pollTask) return this.pollTask
    const task = this.serial(() => this.pollOnce())
    this.pollTask = task
    try { await task } finally { if (this.pollTask === task) this.pollTask = null }
  }
  // Manual context recovery must not move the live cursor or replay statistics.
  async readCurrentEntries() {
    const lifecycle = this.lifecycle
    await this.poll()
    return this.serial(async () => {
      if (!this.started || lifecycle !== this.lifecycle) return null
      const handle = await open(this.filePath, 'r')
      try {
        const info = await handle.stat()
        if (identity(info) !== this.fileIdentity) return null
        const start = Math.max(0, info.size - TAIL), buffer = Buffer.alloc(info.size - start)
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, start)
        const after = await stat(this.filePath)
        if (!this.started || lifecycle !== this.lifecycle || bytesRead !== buffer.length
          || identity(after) !== identity(info) || after.size !== info.size || after.mtimeMs !== info.mtimeMs) return null
        let text = buffer.toString('utf8'), offset = start
        if (start) { const end = text.indexOf('\n'); if (end < 0) return []; offset += Buffer.byteLength(text.slice(0, end + 1)); text = text.slice(end + 1) }
        const lines = text.split('\n'); lines.pop()
        return lines.map(line => {
          const entry = { line: line.replace(/\r$/, '').replace(/^\uFEFF/, ''), ...this.metadata(offset) }
          offset += Buffer.byteLength(line + '\n')
          return entry
        })
      } finally { await handle.close() }
    })
  }
  async pollOnce() {
    if (!this.started || this.polling) return
    this.polling = true
    const lifecycle = this.lifecycle
    try {
      const info = await stat(this.filePath)
      if (!this.started || lifecycle !== this.lifecycle) return
      if (!info.isFile()) throw new Error('Client.txt 不是普通文件')
      const nextIdentity = identity(info)
      // Windows can update LastWriteTime after the bytes have already been read.
      // Compare the bounded recovery window before revoking its area evidence.
      let rewritten = false
      if (this.fileIdentity === nextIdentity && info.size === this.offset && info.mtimeMs !== this.lastMtimeMs) {
        const evidence = await this.readEvidence(info.size)
        rewritten = !evidence || evidence !== this.contentEvidence
      }
      if (!this.started || lifecycle !== this.lifecycle) return
      if (!this.fileIdentity || this.fileIdentity !== nextIdentity || info.size < this.offset || rewritten) {
        this.fileIdentity = nextIdentity; this.generation++; this.offset = 0; this.resetDecoder()
        this.onState({ state: 'resyncing' })
        if (this.onRecovery) await this.recover(info, lifecycle)
        this.contentEvidence = await this.readEvidence(this.offset)
        if (!this.started || lifecycle !== this.lifecycle) return
      }
      this.lastMtimeMs = info.mtimeMs
      if (info.size > this.offset) {
        const handle = await open(this.filePath, 'r')
        try {
          const buffer = Buffer.alloc(CHUNK)
          // Bound each poll as well as each allocation, yielding to the event loop.
          const end = Math.min(info.size, this.offset + TAIL)
          while (this.started && this.offset < end) {
            const { bytesRead } = await handle.read(buffer, 0, Math.min(CHUNK, end - this.offset), this.offset)
            if (!this.started || lifecycle !== this.lifecycle) return
            if (!bytesRead) break
            this.offset += bytesRead; this.emitLines(this.decoder.write(buffer.subarray(0, bytesRead)))
          }
          this.contentEvidence = await this.readEvidence(this.offset)
        } finally { await handle.close() }
      }
      if (!this.started || lifecycle !== this.lifecycle) return
      this.onState({ state: 'started' })
    } catch (error) {
      if (!this.started || lifecycle !== this.lifecycle) return
      if (error.code === 'ENOENT') { this.fileIdentity = ''; this.offset = 0; this.lastMtimeMs = 0; this.resetDecoder(); this.onState({ state: 'waiting' }) }
      else this.onState({ state: 'error', error: 'Client.txt 读取失败' })
    } finally { this.polling = false }
  }
  stop() { this.lifecycle++; if (this.timer) clearInterval(this.timer); this.timer = null; this.started = false; this.resetDecoder(); this.onState({ state: 'stopped' }) }
}
