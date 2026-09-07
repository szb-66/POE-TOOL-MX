import { MapTrackerStateMachine } from './stateMachine.js'
import { normalizeMapTrackerSettings } from './model.js'
import { buildDashboardSummary } from '../../../shared/mapTrackerDashboard.js'

const clean = (value, max = 120) => String(value || '').trim().slice(0, max)

export function sanitizeTrackedItem(item = {}) {
  const name = clean(item.name || item.baseName, 160)
  if (!name) throw new Error('无法识别物品名称')
  return {
    name, baseType: clean(item.baseName || item.baseType, 160), rarity: clean(item.rarity, 40),
    quantity: Math.max(1, Math.min(50000, Number(item.stackSize || item.quantity) || 1))
  }
}

export class MapTrackerService {
  constructor({ repository, clientEvents, now = () => Date.now() } = {}) {
    this.repository = repository; this.clientEvents = clientEvents
    this.now = now; this.settings = normalizeMapTrackerSettings(); this.machine = null
    this.foreground = false; this.listeners = new Set(); this.unsubscribeEvents = null; this.tickTimer = null
    this.errors = []
    this.dashboardRuns = []
    this.stashEvents = []
    this.pendingStashEvents = new Map()
    this.inFlight = new Set()
    this.tickPending = null
    this.stopping = false
    this.workQueue = Promise.resolve()
    this.historyRevision = 0
    this.liveGameState = 'unknown'
    this.seenEvents = new Set()
  }
  async initialize() {
    this.settings = await this.repository.getSettings()
    try { this.errors.push(...await this.repository.clearLegacyLoot()) } catch { this.errors.push('旧入库数据清理失败，将在下次启动重试') }
    await this.refreshStashEvents()
    this.machine = new MapTrackerStateMachine({ now: this.now })
    this.machine.setEnabled(this.settings.enabled); this.machine.setPaused(this.settings.paused)
    const draft = await this.repository.getActiveRun(); if (draft) this.machine.restore(draft)
    this.machine.setCharacter(this.settings.selectedCharacter)
    await this.refreshSummary()
    this.machine.loadHistory(this.dashboardRuns)
    this.unsubscribeEvents = this.clientEvents?.onEvent?.((event) => {
      if (!this.stopping) void this.handleEvent(event).catch((error) => this.report(error))
    }) || null
    if (this.settings.enabled) { try { await this.clientEvents?.ensureStarted?.(); this.restoreClientContext() } catch (error) { this.report(error) } }
    this.tickTimer = setInterval(() => { void this.runScheduledTick() }, 1000); this.tickTimer.unref?.()
    return this.publish()
  }
  restoreClientContext() {
    const event = this.clientEvents?.currentContext?.()
    if (!event) { this.machine.setGameState('unknown', this.now()); this.liveGameState = 'unknown'; return }
    this.liveGameState = event.loading ? 'loading' : 'in-game'
    this.machine.enterArea({ ...event, recovered: true }, this.now())
  }
  report(error) { this.errors = [clean(error?.message || error, 200)].filter(Boolean); this.publish() }
  snapshot() {
    const active = this.machine?.activeRun ? structuredClone(this.machine.activeRun) : null
    const dashboard = buildDashboardSummary({ runs: this.dashboardRuns, activeRun: active, stashEvents: this.stashEvents, now: this.now() })
    return structuredClone({ settings: this.settings, activeRun: active, gameState: this.liveGameState, historyRevision: this.historyRevision, foreground: this.foreground, summary: dashboard, errors: this.errors })
  }
  publish() { const value = this.snapshot(); for (const listener of this.listeners) listener(value); return value }
  onSnapshot(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  trackWork(operation) {
    const pending = Promise.resolve().then(operation)
    this.inFlight.add(pending)
    pending.then(() => this.inFlight.delete(pending), () => this.inFlight.delete(pending))
    return pending
  }
  enqueue(operation) {
    const pending = this.workQueue.then(operation)
    this.workQueue = pending.catch(() => {})
    return pending
  }
  runScheduledTick() {
    if (this.stopping) return Promise.resolve()
    if (this.tickPending) return this.tickPending
    this.tickPending = this.trackWork(() => this.tick())
      .catch(error => this.report(error))
      .finally(() => { this.tickPending = null })
    return this.tickPending
  }
  persistTransition() { return this.enqueue(() => this.persistCurrentTransition()) }
  async persistCurrentTransition() {
    const completed = this.machine.completed.splice(0)
    for (const run of completed) {
      try { await this.repository.saveRun(run) } catch (error) {
        this.machine.completed.unshift(...completed.slice(completed.indexOf(run)))
        throw error
      }
    }
    if (completed.length) { await this.refreshSummary(); this.historyRevision++ }
    if (this.machine.activeRun) await this.repository.saveActiveRun(this.machine.activeRun); else await this.repository.clearActiveRun()
  }
  async refreshSummary() {
    const start = new Date(this.now()); start.setHours(0, 0, 0, 0)
    this.summaryDate = start.toDateString()
    const { runs, errors = [] } = await this.repository.all({})
    this.dashboardRuns = runs
    if (errors.length) this.errors = errors
  }
  async refreshStashEvents() {
    const { events, errors } = await this.repository.getStashEvents(this.now())
    this.stashEvents = events
    if (errors.length) this.errors = [...this.errors, ...errors]
  }
  tick() { return this.enqueue(() => this.processTick()) }
  async processTick() {
    if (!this.machine || this.stopping) return
    this.machine.tick(this.now())
    if (this.summaryDate !== new Date(this.now()).toDateString()) { await this.refreshSummary(); await this.refreshStashEvents() }
    await this.persistCurrentTransition(); this.publish()
  }
  handleEvent(event) {
    if (event.eventId) {
      if (this.seenEvents.has(event.eventId) && !event.recovered) return Promise.resolve()
      this.seenEvents.add(event.eventId)
      if (this.seenEvents.size > 4096) this.seenEvents.delete(this.seenEvents.values().next().value)
    }
    const at = this.now()
    if (event.type === 'area-entered' || event.type === 'game-state' || (event.type === 'client-state' && event.state !== 'started')) {
      this.liveGameState = event.type === 'area-entered' ? (event.loading ? 'loading' : 'in-game') : event.type === 'game-state' ? event.state : 'unknown'
    }
    return this.enqueue(() => this.processEvent(event, at))
  }
  async processEvent(event, at) {
    if (!this.machine) return
    this.machine.handleEvent(event, at)
    await this.persistCurrentTransition()
    this.publish()
  }
  updateSettings(patch = {}) {
    return this.enqueue(() => this.applySettings(patch))
  }
  async applySettings(patch = {}) {
    const enabling = patch.enabled === true && !this.settings.enabled
    if (enabling) await this.clientEvents?.ensureStarted?.()
    if (patch.enabled === false) {
      this.machine.finish('disabled', this.now())
      await this.persistCurrentTransition()
    }
    this.settings = await this.repository.saveSettings({ ...this.settings, ...patch, enhancements: { ...this.settings.enhancements, ...(patch.enhancements || {}) }, overlay: { ...this.settings.overlay, ...(patch.overlay || {}) } })
    this.machine.setCharacter(this.settings.selectedCharacter)
    this.machine.setEnabled(this.settings.enabled, this.now()); this.machine.setPaused(this.settings.paused, this.now())
    if (enabling) this.restoreClientContext()
    await this.persistCurrentTransition(); return this.publish()
  }
  setForeground(value) { this.foreground = value === true; this.machine?.setForeground(this.foreground, this.now()); return this.publish() }
  recordStashedItem(item, eventId) {
    if (this.stopping || !this.settings.enabled || this.settings.paused || !this.settings.enhancements.loot) return Promise.resolve(false)
    if (this.stashEvents.some(entry => entry.id === eventId)) return Promise.resolve(true)
    if (this.pendingStashEvents.has(eventId)) return this.pendingStashEvents.get(eventId)
    const event = { ...sanitizeTrackedItem(item), id: eventId, recordedAt: new Date(this.now()).toISOString() }
    const pending = this.enqueue(async () => {
      const saved = await this.repository.saveStashEvent(event)
      if (!this.stashEvents.some(entry => entry.id === saved.id)) this.stashEvents.push(saved)
      this.publish()
      return true
    })
    this.pendingStashEvents.set(eventId, pending)
    pending.then(() => this.pendingStashEvents.delete(eventId), () => this.pendingStashEvents.delete(eventId))
    return pending
  }
  async finish(reason = 'manual') {
    const run = await this.enqueue(async () => { const run = this.machine.finish(reason, this.now()); await this.persistCurrentTransition(); this.publish(); return run })
    return run
  }
  async emergencyStop() { const wasRunning = this.settings.enabled && !this.settings.paused; await this.updateSettings({ paused: true }); return { success: true, stopped: wasRunning } }
  query(filters) { return this.repository.query(filters) }
  editRun(id, patch) { return this.enqueue(async () => {
    const result = await this.repository.editRun(id, patch)
    this.machine.remember(result)
    for (const run of [this.machine.activeRun, this.machine.lastSettledRun]) if (run?.id === id) run.areaName = result.areaName
    await this.refreshSummary(); this.historyRevision++; this.publish(); return result
  }) }
  deleteRun(id) { return this.enqueue(async () => {
    if (this.machine.activeRun?.id === id) throw new Error('请先关闭地图追踪，再删除当前记录')
    const result = await this.repository.deleteRun(id)
    for (const [key, run] of this.machine.instances) if (run.id === id) this.machine.instances.delete(key)
    if (this.machine.lastSettledRun?.id === id) this.machine.lastSettledRun = null
    await this.refreshSummary(); this.historyRevision++; this.publish(); return result
  }) }
  exportCsv(filters, filePath) { return this.repository.exportCsv(filters, filePath) }
  async shutdown({ normal = true } = {}) {
    this.stopping = true
    this.unsubscribeEvents?.(); this.unsubscribeEvents = null
    if (this.tickTimer) clearInterval(this.tickTimer)
    this.tickTimer = null
    await this.workQueue
    while (this.inFlight.size) await Promise.allSettled([...this.inFlight])
    if (normal && this.machine?.activeRun) this.machine.finish('app-exit', this.now())
    await this.persistTransition()
  }
}
