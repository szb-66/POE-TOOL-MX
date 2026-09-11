import { createHash, randomUUID } from 'node:crypto'
import path from 'node:path'
import { stat } from 'node:fs/promises'
import { ClientLogTailer } from './tailer.js'
import { parseClientLogLine } from './parser.js'

export class ClientEventsService {
  constructor({ settings, selectFile, detectPath = async () => '', processProvider = null, processPresenceProvider = async () => null, Tailer = ClientLogTailer, now = () => new Date().toISOString(), trace = null } = {}) {
    this.settings = settings
    this.selectFile = selectFile
    this.detectPath = detectPath
    this.Tailer = Tailer
    this.now = now
    this.processProvider = processProvider
    this.processPresenceProvider = processPresenceProvider
    this.trace = trace
    this.initializationPromise = null
    this.settingsPending = null
    this.ensurePending = null
    this.settingsWrites = Promise.resolve()
    this.processProbe = null
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
    this.status = { enabled: false, logPath: '', state: 'stopped', gameState: 'unknown', gameStateReason: null, processProbeState: 'unknown', error: '', events: [] }
    this.listeners = new Set()
    this.eventListeners = new Set()
  }
  snapshot() { return structuredClone({ ...this.status, events: this.events }) }
  publish() { const value = this.snapshot(); for (const listener of this.listeners) listener(value); return value }
  onSnapshot(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  onEvent(listener) { this.eventListeners.add(listener); return () => this.eventListeners.delete(listener) }
  currentContext() { return this.status.gameState === 'in-game' && this.context ? structuredClone(this.context) : null }
  ensureStarted() {
    if (!this.ensurePending) {
      const pending = this.ensureListening()
      this.ensurePending = pending
      void pending.then(() => { if (this.ensurePending === pending) this.ensurePending = null }, () => { if (this.ensurePending === pending) this.ensurePending = null })
    }
    return this.ensurePending
  }
  async ensureListening() {
    const generation = this.generation
    await (this.settingsPending || this.initializationPromise)
    if (generation !== this.generation) throw new Error('日志初始化已取消')
    if (this.status.enabled && this.tailer && this.status.state === 'started') return this.snapshot()
    const status = await this.updateSettings({ enabled: true })
    if (!status.logPath || !['started', 'resyncing'].includes(status.state)) throw new Error(status.error || '无法自动定位 Client.txt，请选择日志文件')
    return status
  }
  async ensureCurrentContext(processId, signal) {
    await this.ensureStarted()
    signal?.throwIfAborted()
    if (this.status.state !== 'started' || this.status.gameState === 'loading') return this.currentContext()
    if (this.context && this.context.processId !== processId) throw new Error('游戏日志与前台游戏进程不一致，请核对 Client.txt')
    const stamp = this.processStamp(), tailer = this.tailer
    // Do not use a poll that began before this manual verification request.
    if (this.processProbe) await this.processProbe
    signal?.throwIfAborted()
    const result = await this.probeProcesses()
    signal?.throwIfAborted()
    if (stamp !== this.processStamp() || tailer !== this.tailer) throw new Error('游戏区域或会话在核验期间变化，请重新开始')
    if (!Array.isArray(result)) {
      this.setProbeState('unavailable')
      throw new Error('游戏进程探测暂不可用，请稍后重新开始')
    }
    const session = result.find(entry => entry?.id === processId)
    if (!session) {
      const exists = await Promise.resolve().then(() => this.processPresenceProvider(processId)).catch(() => null)
      signal?.throwIfAborted()
      if (stamp !== this.processStamp()) throw new Error('游戏区域或会话在核验期间变化，请重新开始')
      if (exists === false) {
        this.processSessions.delete(processId); this.processId = null
        this.setGameState('disconnected', 'process-exit')
        throw new Error('已确认游戏进程退出，当前区域记录已失效')
      }
    }
    if (!session || !Number.isFinite(Date.parse(session.startedAt))) {
      this.setProbeState('session-unavailable')
      throw new Error('尚未取得当前游戏进程的启动时间，无法核验区域会话，请稍后重新开始')
    }
    const previous = this.processSessions.get(processId)
    if (previous && Date.parse(previous) !== Date.parse(session.startedAt)) this.setGameState('unknown', 'process-session-changed')
    this.rememberProcesses([session])
    this.setProbeState('available')
    if (this.currentContext()?.processId === processId) return this.currentContext()
    const generation = this.generation, recoveryStamp = this.processStamp()
    const entries = await tailer.readCurrentEntries()
    signal?.throwIfAborted()
    if (generation !== this.generation || tailer !== this.tailer) throw new Error('游戏日志恢复已取消')
    if (recoveryStamp !== this.processStamp()) throw new Error('游戏区域或会话在恢复期间变化，请重新开始')
    if (!entries) throw new Error('游戏日志在核验期间变化，请稍后重新开始')
    await this.recover(entries, [session], generation)
    signal?.throwIfAborted()
    return this.currentContext()
  }
  rememberProcesses(processes) {
    if (!Array.isArray(processes)) return null
    for (const entry of processes) if (entry && typeof entry === 'object' && Number.isFinite(Date.parse(entry.startedAt))) this.processSessions.set(entry.id, entry.startedAt)
    return processes.map(entry => typeof entry === 'number' ? entry : entry.id)
  }
  probeProcesses(diagnostic = false) {
    if (!this.processProbe) {
      const operation = async () => {
        const result = await this.processProvider?.()
        if (this.processProvider && !Array.isArray(result)) throw new Error('process_probe_unavailable')
        return result ?? null
      }
      const pending = (diagnostic && this.trace ? this.trace.measure('client-process-probe', operation) : Promise.resolve().then(operation)).catch(() => null)
      this.processProbe = pending
      void pending.then(() => { if (this.processProbe === pending) this.processProbe = null })
    }
    return this.processProbe
  }
  async recover(entries, processes, generation = this.generation) {
    const result = processes === undefined ? await this.probeProcesses() : await processes
    if (generation !== this.generation) return
    // Recovery requires fresh creation-time evidence, never a cached session.
    const sessions = Array.isArray(result) ? result.filter(entry => entry && Number.isInteger(entry.id) && Number.isFinite(Date.parse(entry.startedAt))) : null
    const ids = this.rememberProcesses(sessions)
    if (!Array.isArray(ids)) return
    let context = null, lastState = null
    for (const entry of entries) {
      const pid = Number(entry.line.match(/\[(?:INFO|DEBUG) Client (\d+)\]/)?.[1])
      if (!ids.includes(pid) || !this.processSessions.has(pid)) continue
      const event = parseClientLogLine(entry.line)
      if (!event) continue
      const loggedAt = Date.parse(String(event.logTime).replaceAll('/', '-').replace(' ', 'T'))
      if (!Number.isFinite(loggedAt) || loggedAt + 1000 < Date.parse(this.processSessions.get(pid))) continue
      const metadata = this.eventMetadata(entry, pid)
      if (event.type === 'area-entered') { context = { ...event, ...metadata }; lastState = null }
      if (event.type === 'game-state' && (!context || context.processId === pid)
        && (event.state === 'disconnected' || event.reason === 'area-loading')) lastState = event
      if (event.type === 'game-state' && context?.processId === pid) {
        if (event.state === 'disconnected' || event.reason === 'area-loading') context = null
        else if (context) context.loading = event.state !== 'in-game'
      }
    }
    if (!context) { if (lastState) this.setGameState(lastState.state, lastState.reason); return }
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
    if (event.type === 'area-entered') { this.context = structuredClone(event); this.status.gameState = event.loading ? 'loading' : 'in-game'; this.status.gameStateReason = event.loading ? 'area-loading' : 'area-ready' }
    if (event.type === 'game-state') { this.status.gameState = event.state; this.status.gameStateReason = event.reason || null; if (this.context) this.context.loading = event.state !== 'in-game'; if (event.state === 'disconnected' || event.state === 'unknown') this.context = null }
    const published = { sequence: ++this.sequence, receivedAt: this.now(), ...event }
    this.events.push(published)
    if (this.events.length > 50) this.events.splice(0, this.events.length - 50)
    for (const listener of this.eventListeners) listener(structuredClone(published))
    this.publish()
  }
  setState(value) {
    if (this.status.state === value.state && this.status.error === String(value.error || '')) return this.snapshot()
    this.status = { ...this.status, state: value.state, error: String(value.error || '') }
    // Publish the cause before invalidation subscribers inspect the status.
    if (value.state !== 'started') this.setGameState('unknown', 'log-unavailable')
    this.push({ type: 'client-state', logTime: null, state: value.state })
  }
  setGameState(state, reason) {
    if (this.status.gameState !== state || this.status.gameStateReason !== reason) this.push({ type: 'game-state', logTime: null, state, reason })
  }
  acceptLine(line, metadata = {}) {
    const event = parseClientLogLine(line)
    if (!event) return
    const pid = String(line).match(/\[(?:INFO|DEBUG) Client (\d+)\]/)?.[1]
    // A completion belongs only to an existing region from this same client.
    if (event.type === 'game-state' && event.state === 'in-game'
      && (!pid || !this.context || this.context.processId !== Number(pid))) return
    if (pid) this.processId = Number(pid)
    const details = metadata.sourceId ? this.eventMetadata(metadata, Number(pid) || this.processId) : { processId: Number(pid) || null }
    if (details.eventId && this.seen.has(details.eventId)) return
    if (details.eventId) { this.seen.add(details.eventId); if (this.seen.size > 4096) this.seen.delete(this.seen.values().next().value) }
    if (event.type === 'game-state' && event.reason === 'area-loading') this.context = null
    this.push({ ...event, ...details })
  }
  async pollProcess(processes) {
    if (!this.processProvider || !this.status.enabled) return
    if (this.processPoll) return this.processPoll
    const stamp = this.processStamp(), processId = this.processId, startedAt = this.processSessions.get(processId)
    const pending = (async () => {
      const result = await (processes === undefined ? this.probeProcesses() : processes)
      if (stamp !== this.processStamp()) return
      if (!Array.isArray(result)) { this.setProbeState('unavailable'); return }
      const ids = result.map(entry => typeof entry === 'number' ? entry : entry.id)
      if (processId != null && !ids.includes(processId)) {
        const exists = await Promise.resolve().then(() => this.processPresenceProvider(processId)).catch(() => null)
        if (stamp !== this.processStamp()) return
        this.setProbeState(exists === null ? 'unavailable' : 'available')
        if (exists === false) {
          this.processSessions.delete(processId)
          this.processId = null
          this.setGameState('disconnected', 'process-exit')
        }
        return
      }
      const entry = result.find(entry => entry?.id === processId)
      if (startedAt && entry?.startedAt && Date.parse(startedAt) !== Date.parse(entry.startedAt)) {
        this.rememberProcesses(result)
        this.setGameState('unknown', 'process-session-changed')
        return
      }
      this.rememberProcesses(result)
      this.setProbeState(entry && !entry.startedAt ? 'session-unavailable' : 'available')
      if (this.processId == null && ids.length === 1) this.processId = ids[0]
    })()
    this.processPoll = pending
    try { await pending } finally { if (this.processPoll === pending) this.processPoll = null }
  }
  processStamp() { return JSON.stringify([this.generation, this.processId, this.processSessions.get(this.processId), this.context?.eventId, this.context?.sessionKey, this.status.gameState, this.status.gameStateReason]) }
  setProbeState(state) { if (this.status.processProbeState !== state) { this.status.processProbeState = state; this.publish() } }
  async resolvePath(saved) {
    if (saved) { try { if ((await stat(saved)).isFile()) return saved } catch {} }
    return await this.detectPath() || ''
  }
  saveSettings(patch, generation) {
    const pending = this.settingsWrites.then(() => generation === this.generation ? this.settings.save(patch) : null)
    this.settingsWrites = pending.catch(() => {})
    return pending
  }
  updateSettings(patch = {}) {
    this.stop(false)
    const generation = this.generation
    const pending = this.saveSettings(patch, generation).then(stored => {
      if (generation !== this.generation || !stored) return this.snapshot()
      return this.startSettings(stored, generation)
    })
    this.settingsPending = pending
    this.initializationPromise ||= pending
    void pending.then(() => { if (this.settingsPending === pending) this.settingsPending = null }, () => { if (this.settingsPending === pending) this.settingsPending = null })
    return pending
  }
  async startSettings(stored, generation) {
    this.status = { ...this.status, enabled: stored.enabled, state: 'initializing', error: '' }
    this.publish()
    let logPath = stored.enabled ? await this.resolvePath(stored.logPath) : stored.logPath
    if (generation !== this.generation) return this.snapshot()
    if (stored.enabled && logPath !== stored.logPath) {
      stored = await this.saveSettings({ logPath }, generation)
      if (generation !== this.generation || !stored) return this.snapshot()
      logPath = stored.logPath
    }
    this.status = { ...this.status, enabled: stored.enabled, logPath, error: '' }
    if (stored.enabled && logPath) {
      // Keep this promise for the entire first recovery/poll even after it resolves.
      const processes = this.probeProcesses(true)
      let starting = true
      const tailer = new this.Tailer({ filePath: logPath, intervalMs: 500,
        onLine: (line, metadata) => { if (generation === this.generation) this.acceptLine(line, metadata) },
        onRecovery: entries => {
          if (generation !== this.generation) return
          const operation = () => this.recover(entries, starting ? processes : undefined, generation)
          return starting && this.trace ? this.trace.measure('client-log-recovery', operation) : operation()
        },
        onState: state => { if (generation === this.generation) this.setState(state) }
      })
      this.tailer = tailer
      await tailer.start()
      if (generation !== this.generation) { tailer.stop(); return this.snapshot() }
      if (this.processProvider) {
        await this.pollProcess(processes)
        if (generation !== this.generation) return this.snapshot()
        this.processTimer = setInterval(() => { void this.pollProcess() }, 1000)
        this.processTimer.unref?.()
      }
      starting = false
    } else this.status.state = stored.enabled ? 'waiting' : 'stopped'
    return this.publish()
  }
  initialize() {
    if (!this.initializationPromise) {
      const generation = this.generation
      this.status.state = 'initializing'
      const settings = this.settingsWrites.then(() => generation === this.generation ? this.settings.get() : null)
      this.settingsWrites = settings.catch(() => {})
      const pending = (async () => {
        const stored = await settings
        if (generation !== this.generation) return this.snapshot()
        await this.startSettings(stored, generation)
        if (generation !== this.generation) return this.snapshot()
        if (this.status.state === 'error') throw new Error('日志初始化失败')
        this.events = []; this.sequence = 0
        return this.publish()
      })().catch(error => {
        if (generation === this.generation) this.setState({ state: 'error', error: '日志初始化失败' })
        if (this.initializationPromise === pending) this.initializationPromise = null
        throw error
      })
      this.initializationPromise = pending
    }
    return this.initializationPromise
  }
  async whenReady() {
    await (this.settingsPending || this.initialize())
    // A settings change can supersede startup while it is awaiting I/O.
    while (this.settingsPending) await this.settingsPending
    return this.snapshot()
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
    this.ensurePending = null
    this.processProbe = null; this.processPoll = null
    if (this.processTimer) clearInterval(this.processTimer)
    this.processTimer = null; this.processId = null
    this.tailer?.stop(); this.tailer = null
    this.setState({ state: 'stopped' })
    if (publish) return this.publish()
  }
}
