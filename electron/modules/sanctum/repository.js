import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { emptySanctumState, SANCTUM_SCHEMA_VERSION, validateSanctumStrategy } from '../../../shared/sanctum.js'
import { validateSanctumCalibrations } from '../../../shared/sanctumCalibration.js'
import { liveProfile, relicProfile } from '../../../shared/sanctumLive.js'
import { savedSanctumFloor, savedSanctumResult, withoutSanctumEvidence } from './savedResult.js'
import { SanctumEvidenceStore } from './evidence.js'
import { readEffectMemory } from './effectMemory.js'

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
      state.persistedRoute = optionalSnapshot(() => savedSanctumResult(data.savedRoute))
      state.persistedOverlay = optionalSnapshot(() => savedSanctumResult(data.savedOverlay, { overlay: true }))
      if (floor) {
        state.floor = { ...floor, identityConfirmed: false, captureStopped: true }
        state.rewardLedger = saved.rewardLedger && Array.isArray(saved.rewardLedger.items)
          ? { ...saved.rewardLedger, savedComplete: saved.rewardLedger.savedComplete ?? saved.rewardLedger.complete, complete:false, key:null } : null
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
      state.decisions = Array.isArray(data.decisions) ? data.decisions.slice(-20) : []
      state.strategy = validateSanctumStrategy(data.strategy)
      if (!Array.isArray(data.inventory) || !data.calibration || typeof data.calibration !== 'object') throw new Error('圣所存储结构无效')
      state.inventory = data.inventory.map(item => ({ ...item, status: 'unknown', reason: '重启后需重新确认位置' }))
      state.calibration = validateSanctumCalibrations(data.calibration)
      if (data.liveCalibration) state.liveCalibration = liveProfile(data.liveCalibration)
      for (const regionId of ['altar', 'locker']) if (data.relicCalibrations?.[regionId]) state.relicCalibrations[regionId] = relicProfile(data.relicCalibrations[regionId])
      if (data.loadoutPreferences) state.loadoutPreferences = data.loadoutPreferences
      if (Number.isFinite(data.controlOverlayBounds?.x) && Number.isFinite(data.controlOverlayBounds?.y)) {
        state.controlOverlayBounds = { x: Math.round(data.controlOverlayBounds.x), y: Math.round(data.controlOverlayBounds.y) }
      }
      if (data.altar && Array.isArray(data.altar.items)) state.altar = { ...data.altar, confirmed: false }
    } catch (error) {
      state.reason = `圣所配置未加载：${error.message}`
      state.status = 'error'
    }
    return state
  }

  save(state, { routeResult = state.persistedRoute, overlayResult = state.persistedOverlay } = {}) {
    const data = { schemaVersion: SANCTUM_SCHEMA_VERSION, enabled: state.enabled === true, strategy: validateSanctumStrategy(state.strategy),
      effectCorrectionMemory:readEffectMemory(state.effectCorrectionMemory),
      inventory: state.inventory, calibration: validateSanctumCalibrations(state.calibration), altar: state.altar, loadoutPreferences: state.loadoutPreferences,
      lastCapture: state.floor ? withoutSanctumEvidence({ floor: state.floor, currentEffects: state.currentEffects, runObservation:state.runObservation, rewardLedger:state.rewardLedger, marks: state.marks, progress: state.progress, savedAt: state.restoredFromSave ? state.savedAt : state.savedAt ?? Date.now() }) : null,
      savedRoute: savedSanctumResult(routeResult), savedOverlay: savedSanctumResult(overlayResult, { overlay: true }),
      controlOverlayBounds: state.controlOverlayBounds, decisions: state.decisions || [],
      liveCalibration: state.liveCalibration ? liveProfile(state.liveCalibration) : null,
      relicCalibrations: Object.fromEntries(['altar', 'locker'].filter(id => state.relicCalibrations?.[id]).map(id => [id, relicProfile(state.relicCalibrations[id])])) }
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
    const temporary=`${this.file}.${randomUUID()}.tmp`
    try {
      fs.writeFileSync(temporary,JSON.stringify(data,null,2),'utf8')
      fs.renameSync(temporary,this.file)
    } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary) }
  }
}
