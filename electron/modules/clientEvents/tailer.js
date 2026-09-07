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
    this.sourceId = digest(filePath.toLowerCase())
  }
  resetDecoder() { this.decoder = new StringDecoder('utf8'); this.lineBuffer = ''; this.lineOffset = this.offset }
  metadata(offset) { return { sourceId: this.sourceId, fileId: digest(this.fileIdentity), offset, generation: this.generation } }
  async recover(info) {
    this.offset = info.size; this.resetDecoder()
    if (!this.onRecovery) return
    const handle = await open(this.filePath, 'r')
    try {
      const start = Math.max(0, info.size - TAIL)
      const buffer = Buffer.alloc(info.size - start)
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, start)
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
    try {
      const info = await stat(this.filePath)
      if (!info.isFile()) throw new Error('Client.txt 不是普通文件')
      this.fileIdentity = identity(info); this.lastMtimeMs = info.mtimeMs
      await this.recover(info)
      this.onState({ state: 'started' })
    } catch (error) { this.offset = 0; this.fileIdentity = ''; this.onState({ state: error.code === 'ENOENT' ? 'waiting' : 'error', error: error.code === 'ENOENT' ? '' : 'Client.txt 读取失败' }) }
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
  async poll() {
    if (!this.started || this.polling) return
    this.polling = true
    try {
      const info = await stat(this.filePath)
      if (!info.isFile()) throw new Error('Client.txt 不是普通文件')
      const nextIdentity = identity(info)
      if (!this.fileIdentity || this.fileIdentity !== nextIdentity || info.size < this.offset || (info.size === this.offset && info.mtimeMs !== this.lastMtimeMs)) {
        this.fileIdentity = nextIdentity; this.generation++; this.offset = 0; this.resetDecoder()
        this.onState({ state: 'resyncing' })
        if (this.onRecovery) await this.recover(info)
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
            if (!bytesRead) break
            this.offset += bytesRead; this.emitLines(this.decoder.write(buffer.subarray(0, bytesRead)))
          }
        } finally { await handle.close() }
      }
      this.onState({ state: 'started' })
    } catch (error) {
      if (error.code === 'ENOENT') { this.fileIdentity = ''; this.offset = 0; this.lastMtimeMs = 0; this.resetDecoder(); this.onState({ state: 'waiting' }) }
      else this.onState({ state: 'error', error: 'Client.txt 读取失败' })
    } finally { this.polling = false }
  }
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; this.started = false; this.resetDecoder(); this.onState({ state: 'stopped' }) }
}
