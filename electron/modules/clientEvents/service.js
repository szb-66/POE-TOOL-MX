import { createHash, randomUUID } from 'node:crypto'
import path from 'node:path'
import { stat } from 'node:fs/promises'
import { ClientLogTailer } from './tailer.js'
import { parseClientLogLine } from './parser.js'

export class ClientEventsService {
  constructor({ settings, selectFile, detectPath = async () => '', processProvider = null, Tailer = ClientLogTailer, now = () => new Date().toISOString() } = {}) {
    this.settings = settings
    this.selectFile = selectFile
    this.detectPath = detectPath
    this.Tailer = Tailer
    this.now = now
    this.processProvider = processProvider
    this.processTimer = null
    this.processPoll = null
    this.processId = null
    this.generation = 0
    this.tailer = null
    this.processSessions = new Map()
    this.fallbackSession = randomUUID()
    this.context = null
    this.seen = new Set()
    this.sequence = 0
    this.events = []
    this.status = { enabled: false, logPath: '', state: 'stopped', gameState: 'unknown', error: '', events: [] }
    this.listeners = new Set()
    this.eventListeners = new Set()
  }
  snapshot() { return structuredClone({ ...this.status, events: this.events }) }
  publish() { const value = this.snapshot(); for (const listener of this.listeners) listener(value); return value }
  onSnapshot(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  onEvent(listener) { this.eventListeners.add(listener); return () => this.eventListeners.delete(listener) }
  currentContext() { return this.status.gameState === 'in-game' && this.context ? structuredClone(this.context) : null }
  async ensureStarted() {
    if (this.status.enabled && this.tailer && this.status.state === 'started') return this.snapshot()
    const status = await this.updateSettings({ enabled: true })
    if (!status.logPath || !['started', 'resyncing'].includes(status.state)) throw new Error(status.error || '无法自动定位 Client.txt，请选择日志文件')
    return status
  }
  rememberProcesses(processes) {
    if (!Array.isArray(processes)) return null
    for (const entry of processes) if (typeof entry === 'object' && Number.isFinite(Date.parse(entry.startedAt))) this.processSessions.set(entry.id, entry.startedAt)
    return processes.map(entry => typeof entry === 'number' ? entry : entry.id)
  }
  async recover(entries) {
    const generation = this.generation
    const ids = this.rememberProcesses(await this.processProvider?.().catch(() => null))
    if (!Array.isArray(ids) || generation !== this.generation) return
    let context = null
    for (const entry of entries) {
      const pid = Number(entry.line.match(/\[(?:INFO|DEBUG) Client (\d+)\]/)?.[1])
      if (!ids.includes(pid) || !this.processSessions.has(pid)) continue
      const event = parseClientLogLine(entry.line)
      if (!event) continue
      const loggedAt = Date.parse(String(event.logTime).replaceAll('/', '-').replace(' ', 'T'))
      if (!Number.isFinite(loggedAt) || loggedAt + 1000 < Date.parse(this.processSessions.get(pid))) continue
      const metadata = this.eventMetadata(entry, pid)
      if (event.type === 'area-entered') context = { ...event, ...metadata }
      if (event.type === 'game-state' && context?.processId === pid) {
        if (event.state === 'disconnected') context = null
        else if (context) context.loading = event.state !== 'in-game'
      }
    }
    if (!context) return
    this.context = context; this.processId = context.processId
    this.status.gameState = context.loading ? 'loading' : 'in-game'
    // Only a recovered state is published, never historical statistic events.
    this.push({ ...context, recovered: true })
  }
  eventMetadata(entry, pid) {
    const sessionKey = createHash('sha256').update(`${entry.sourceId || ''}:${pid}:${this.processSessions.get(pid) || this.fallbackSession}`).digest('hex')
    const eventId = `${entry.fileId || entry.sourceId}:${entry.generation || 0}:${entry.offset}`
    return { sourceId: entry.sourceId, eventId, sessionKey, processId: pid }
  }
  push(event) {
    if (event.type === 'area-entered') { this.context = structuredClone(event); this.status.gameState = event.loading ? 'loading' : 'in-game' }
    if (event.type === 'game-state') { this.status.gameState = event.state; if (this.context) this.context.loading = event.state !== 'in-game'; if (event.state === 'disconnected' || event.state === 'unknown') this.context = null }
    const published = { sequence: ++this.sequence, receivedAt: this.now(), ...event }
    this.events.push(published)
    if (this.events.length > 50) this.events.splice(0, this.events.length - 50)
    for (const listener of this.eventListeners) listener(structuredClone(published))
    this.publish()
  }
  setState(value) {
    if (value.state !== 'started') this.setGameState('unknown', 'log-unavailable')
    if (this.status.state === value.state && this.status.error === String(value.error || '')) return this.snapshot()
    this.status = { ...this.status, state: value.state, error: String(value.error || '') }
    this.push({ type: 'client-state', logTime: null, state: value.state })
  }
  setGameState(state, reason) {
    if (this.status.gameState !== state) this.push({ type: 'game-state', logTime: null, state, reason })
  }
  acceptLine(line, metadata = {}) {
    const event = parseClientLogLine(line)
    if (!event) return
    const pid = String(line).match(/\[(?:INFO|DEBUG) Client (\d+)\]/)?.[1]
    if (pid) this.processId = Number(pid)
    const details = metadata.sourceId ? this.eventMetadata(metadata, Number(pid) || this.processId) : {}
    if (details.eventId && this.seen.has(details.eventId)) return
    if (details.eventId) { this.seen.add(details.eventId); if (this.seen.size > 4096) this.seen.delete(this.seen.values().next().value) }
    this.push({ ...event, ...details })
  }
  async pollProcess() {
    if (!this.processProvider || !this.status.enabled || this.processPoll) return
    const generation = this.generation
    this.processPoll = Promise.resolve().then(() => this.processProvider()).catch(() => null)
    try {
      const ids = this.rememberProcesses(await this.processPoll)
      if (generation !== this.generation || !Array.isArray(ids)) return
      if (this.processId != null && !ids.includes(this.processId)) {
        this.setGameState('disconnected', 'process-exit')
        this.processId = null
      } else if (this.processId == null && ids.length === 1) this.processId = ids[0]
    } finally { this.processPoll = null }
  }
  async resolvePath(saved) {
    if (saved) { try { if ((await stat(saved)).isFile()) return saved } catch {} }
    return await this.detectPath() || ''
  }
  async updateSettings(patch = {}) {
    let stored = await this.settings.save(patch)
    await this.stop(false)
    let logPath = stored.enabled ? await this.resolvePath(stored.logPath) : stored.logPath
    if (stored.enabled && logPath !== stored.logPath) {
      stored = await this.settings.save({ logPath })
      logPath = stored.logPath
    }
    this.status = { ...this.status, enabled: stored.enabled, logPath, error: '' }
    if (stored.enabled && logPath) {
      this.tailer = new this.Tailer({ filePath: logPath, intervalMs: 500, onLine: (line, metadata) => this.acceptLine(line, metadata), onRecovery: entries => this.recover(entries), onState: (state) => this.setState(state) })
      await this.tailer.start()
      if (this.processProvider) {
        await this.pollProcess()
        this.processTimer = setInterval(() => { void this.pollProcess() }, 1000)
        this.processTimer.unref?.()
      }
    } else this.status.state = stored.enabled ? 'waiting' : 'stopped'
    return this.publish()
  }
  async initialize() {
    const stored = await this.settings.get()
    await this.updateSettings(stored)
    this.events = []
    this.sequence = 0
    return this.publish()
  }
  async selectLogFile() {
    const selected = await this.selectFile()
    if (!selected) return this.snapshot()
    if (path.basename(selected).toLowerCase() !== 'client.txt') throw new Error('只能选择名为 Client.txt 的文件')
    const info = await stat(selected)
    if (!info.isFile()) throw new Error('Client.txt 必须是普通文件')
    return this.updateSettings({ logPath: selected })
  }
  async getStatus() { return this.snapshot() }
  async stop(publish = true) {
    this.generation++
    if (this.processTimer) clearInterval(this.processTimer)
    this.processTimer = null; this.processId = null
    this.tailer?.stop(); this.tailer = null
    this.setState({ state: 'stopped' })
    if (publish) return this.publish()
  }
}
