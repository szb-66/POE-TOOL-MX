import { randomUUID } from 'node:crypto'
import { classifyArea } from './areaCatalog.js'
import { calculateExperienceEfficiency, createMapRun } from './model.js'

export const characterIdentity = value => value?.name ? JSON.stringify([value.accountName || '', value.league || '', value.name]) : null
const mapTypes = ['map', 'boss', 'side-area']

export class MapTrackerStateMachine {
  constructor({ now = () => Date.now(), characterLevel = null } = {}) {
    this.now = now; this.characterLevel = characterLevel
    this.activeRun = null; this.currentArea = null; this.enabled = false; this.paused = false
    this.gameForeground = false; this.gameState = 'unknown'; this.idleMs = 0; this.lastTick = this.now(); this.completed = []
    this.character = null; this.instances = new Map(); this.lastSettledRun = null
    this.restored = false
    this.sessionKey = randomUUID()
  }
  instanceIdentity(run) {
    return run.instanceKey && !run.instanceKey.endsWith(':unknown') && run.sessionKey ? JSON.stringify([run.sessionKey, run.instanceKey]) : null
  }
  remember(run) { const key = this.instanceIdentity(run); if (key) this.instances.set(key, structuredClone(run)) }
  loadHistory(runs) {
    for (const run of [...runs].sort((a, b) => String(a.endedAt).localeCompare(String(b.endedAt)))) {
      if (run.sessionKey) this.remember(run)
    }
  }
  setCharacter(character) {
    this.character = character ? structuredClone(character) : null
  }
  canAccumulate() {
    return this.gameState === 'in-game' && this.enabled && !this.paused && this.gameForeground && this.activeRun && mapTypes.includes(this.currentArea?.type)
  }
  tick(at = this.now()) {
    const delta = Math.max(0, at - this.lastTick)
    if (this.canAccumulate()) this.activeRun.activeDurationMs += delta
    this.lastTick = at
  }
  setEnabled(value, at = this.now()) { this.tick(at); this.enabled = value === true }
  setPaused(value, at = this.now()) { this.tick(at); this.paused = value === true }
  setForeground(value, at = this.now()) { this.tick(at); this.gameForeground = value === true }
  setIdleMs(value, at = this.now()) { this.tick(at); this.idleMs = Math.max(0, Number(value) || 0) }
  setGameState(state, at = this.now(), reason = 'disconnect') {
    this.tick(at); this.gameState = state
    if (state === 'unknown') this.currentArea = null
    if (state !== 'disconnected') return null
    const run = this.finish(reason, at)
    this.currentArea = null; this.lastSettledRun = null
    this.sessionKey = randomUUID()
    return run ? { action: 'settled', run } : null
  }
  enterArea(event, at = this.now()) {
    this.tick(at)
    const area = classifyArea(event.areaId)
    const restored = this.restored
    const sessionKey = event.sessionKey || this.sessionKey
    if (sessionKey !== this.sessionKey) {
      if (this.activeRun && this.activeRun.sessionKey !== sessionKey) this.finish('session-changed', at)
      this.lastSettledRun = null
      this.sessionKey = sessionKey
    }
    this.currentArea = area; this.gameState = event.loading ? 'loading' : 'in-game'
    if (!this.enabled) return null
    if (area.type === 'side-area' && this.activeRun && this.activeRun.sessionKey === sessionKey && !restored) return { action: 'continued-side-area', run: this.activeRun }
    if (!['map', 'boss'].includes(area.type)) {
      const run = this.finish('area-left', at)
      if (!['town', 'hideout'].includes(area.type)) this.lastSettledRun = null
      return run ? { action: 'settled', run } : null
    }
    const instanceKey = `${event.areaId}:${event.seed || 'unknown'}`
    if (event.seed && this.activeRun?.instanceKey === instanceKey && this.activeRun.sessionKey === sessionKey) {
      this.restored = false
      return { action: restored ? 'resumed' : 'continued', run: this.activeRun }
    }
    if (this.activeRun) this.finish('next-map', at)
    const key = this.instanceIdentity({ instanceKey, sessionKey })
    const saved = key ? this.instances.get(key) : null
    this.lastSettledRun = null
    this.restored = false
    this.activeRun = saved ? createMapRun({ ...saved, endedAt: null, endReason: null, portalsUsed: saved.portalsUsed + (event.recovered ? 0 : 1) })
      : createMapRun({ ...event, instanceKey, sessionKey, character: this.character, areaName: area.areaName, portalsUsed: 1, startedAt: new Date(at).toISOString(), experienceEfficiency: calculateExperienceEfficiency(this.characterLevel, event.areaLevel) })
    return { action: saved ? 'resumed' : 'started', run: this.activeRun }
  }
  handleEvent(event, at = this.now()) {
    if (event.type === 'area-entered') return this.enterArea(event, at)
    if (event.type === 'game-state') return this.setGameState(event.state, at, event.reason)
    if (event.type === 'client-state' && event.state !== 'started') return this.setGameState('unknown', at)
    this.tick(at)
    if (!this.enabled || this.paused || this.gameState !== 'in-game' || !this.activeRun || !mapTypes.includes(this.currentArea?.type)) return null
    if (event.type === 'player-death') this.activeRun.deaths += 1
    if (event.type === 'character-level') { this.characterLevel = event.level; this.activeRun.experienceEfficiency = calculateExperienceEfficiency(event.level, this.activeRun.areaLevel) }
    return null
  }
  finish(reason = 'manual', at = this.now()) {
    this.tick(at)
    if (!this.activeRun) return null
    const run = { ...this.activeRun, endedAt: new Date(at).toISOString(), endReason: reason }
    if (run.sessionKey) this.remember(run)
    this.restored = false; this.lastSettledRun = run
    this.completed.push(run); this.activeRun = null
    return run
  }
  restore(run) { this.activeRun = createMapRun(run); this.currentArea = null; this.gameState = 'unknown'; this.restored = true; return this.activeRun }
}
