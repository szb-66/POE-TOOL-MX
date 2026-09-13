import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { emptySanctumState, SANCTUM_SCHEMA_VERSION, validateSanctumStrategy, createSanctumStrategy } from '../../../shared/sanctum.js'
import { validateSanctumCalibrations } from '../../../shared/sanctumCalibration.js'
import { liveProfile } from '../../../shared/sanctumLive.js'
import { savedSanctumFloor, savedSanctumResult, withoutSanctumEvidence } from './savedResult.js'
import { SanctumEvidenceStore } from './evidence.js'
import { readEffectMemory } from './effectMemory.js'

const ROUTE_VERSION = 2
const readStrategy = value => ['survival', 'currency', 'relic'].includes(value?.preset) ? createSanctumStrategy() : validateSanctumStrategy(value)

// A malformed optional observation must not prevent preferences from loading.
function optionalSnapshot(read) {
  try { return read() } catch { return null }
}

export class SanctumRepository {
  constructor(root) {
    this.file = path.join(path.resolve(root), 'sanctum.json')
    this.evidence = new SanctumEvidenceStore({directory:path.join(path.resolve(root),'sanctum-images')})
  }

  load() {
    const state = emptySanctumState()
    if (!fs.existsSync(this.file)) return state
    try {
      const data = JSON.parse(fs.readFileSync(this.file, 'utf8'))
      if (data.schemaVersion !== SANCTUM_SCHEMA_VERSION) throw new Error('圣所存储版本不兼容')
      state.effectCorrectionMemory = readEffectMemory(data.effectCorrectionMemory)
      this.evidence.restore(data.evidenceRecords)
      const saved = optionalSnapshot(() => withoutSanctumEvidence(data.lastCapture))
      const floor = optionalSnapshot(() => savedSanctumFloor(saved?.floor))
      state.persistedRoute = data.routeVersion === ROUTE_VERSION ? optionalSnapshot(() => savedSanctumResult(data.savedRoute)) : null
      state.persistedOverlay = data.routeVersion === ROUTE_VERSION ? optionalSnapshot(() => savedSanctumResult(data.savedOverlay, { overlay: true })) : null
      if (floor) {
        state.floor = { ...floor, identityConfirmed: false, captureStopped: true }
        state.runObservation = saved.runObservation && typeof saved.runObservation === 'object'
          ? { ...saved.runObservation, savedKey: saved.runObservation.savedKey ?? saved.runObservation.key,
            savedStatus: saved.runObservation.savedStatus ?? saved.runObservation.status, status:'historical',key:null } : null
        state.currentEffects = Array.isArray(saved.currentEffects) ? saved.currentEffects : []
        for (const key of ['targets', 'avoid']) if (Array.isArray(saved.marks?.[key])) state.marks[key] = saved.marks[key].filter(id => floor.rooms.some(room => room.id === id))
        state.progress = saved.progress && typeof saved.progress === 'object' ? { ...saved.progress, stage: ['complete','partial','timeout','stopped'].includes(saved.progress.stage) ? saved.progress.stage : 'stopped', step: null } : null
        state.restoredFromSave = true
        state.savedAt = Number.isFinite(saved.savedAt) ? saved.savedAt : null
        state.status = 'paused'
        state.reason = state.persistedRoute ? '已恢复上次保存的路线与状态；再次采集可更新' : '已恢复上次保存的状态，尚无已保存路线；再次采集可生成'
      }
      state.enabled = data.enabled === true
      state.decisions = data.routeVersion === ROUTE_VERSION && Array.isArray(data.decisions) ? withoutSanctumEvidence(data.decisions.slice(-20)) : []
      state.strategy = readStrategy(data.strategy)
      state.calibration = validateSanctumCalibrations(data.calibration)
      if (data.liveCalibration) state.liveCalibration = liveProfile(data.liveCalibration)
      if (Number.isFinite(data.controlOverlayBounds?.x) && Number.isFinite(data.controlOverlayBounds?.y)) {
        state.controlOverlayBounds = { x: Math.round(data.controlOverlayBounds.x), y: Math.round(data.controlOverlayBounds.y) }
      }
    } catch (error) {
      state.reason = `圣所配置未加载：${error.message}`
      state.status = 'error'
    }
    return state
  }

  save(state, { routeResult = state.persistedRoute, overlayResult = state.persistedOverlay } = {}) {
    const data = { schemaVersion: SANCTUM_SCHEMA_VERSION, routeVersion: ROUTE_VERSION, enabled: state.enabled === true, strategy: validateSanctumStrategy(state.strategy),
      effectCorrectionMemory:readEffectMemory(state.effectCorrectionMemory),
      calibration: validateSanctumCalibrations(state.calibration),
      lastCapture: state.floor ? withoutSanctumEvidence({ floor: state.floor, currentEffects: state.currentEffects, runObservation:state.runObservation, marks: state.marks, progress: state.progress, savedAt: state.restoredFromSave ? state.savedAt : state.savedAt ?? Date.now() }) : null,
      savedRoute: savedSanctumResult(routeResult), savedOverlay: savedSanctumResult(overlayResult, { overlay: true }),
      controlOverlayBounds: state.controlOverlayBounds, decisions: withoutSanctumEvidence(state.decisions || []),
      liveCalibration: state.liveCalibration ? liveProfile(state.liveCalibration) : null }
    data.evidenceRecords = this.evidence.snapshot(data)
    fs.mkdirSync(path.dirname(this.file), { recursive: true })
    const temporary = `${this.file}.${randomUUID()}.tmp`
    try {
      fs.writeFileSync(temporary, JSON.stringify(data, null, 2), 'utf8')
      fs.renameSync(temporary, this.file)
      this.evidence.commit(data.evidenceRecords)
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary)
    }
  }

  saveEffectMemory(memory) {
    if (!fs.existsSync(this.file)) return
    const data=JSON.parse(fs.readFileSync(this.file,'utf8'))
    data.effectCorrectionMemory=readEffectMemory(memory)
    // Memory migration also writes at startup, before the next normal save.
    for (const key of ['inventory','altar','relicCalibrations','loadoutPreferences','loadouts','rewardLedger']) delete data[key]
    data.strategy = readStrategy(data.strategy)
    data.lastCapture = withoutSanctumEvidence(data.lastCapture)
    data.savedRoute = data.routeVersion === ROUTE_VERSION ? savedSanctumResult(data.savedRoute) : null
    data.savedOverlay = data.routeVersion === ROUTE_VERSION ? savedSanctumResult(data.savedOverlay,{overlay:true}) : null
    data.decisions = data.routeVersion === ROUTE_VERSION ? withoutSanctumEvidence(data.decisions || []) : []
    data.routeVersion = ROUTE_VERSION
    const temporary=`${this.file}.${randomUUID()}.tmp`
    try {
      fs.writeFileSync(temporary,JSON.stringify(data,null,2),'utf8')
      fs.renameSync(temporary,this.file)
    } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary) }
  }
}
