import { emptySanctumState } from '../../../shared/sanctum.js'
import { planSanctumFloor } from './planner.js'
import { syncStatusRewards } from './runObservation.js'

export function acceptSanctumFloor(state, snapshot) {
  const next = structuredClone(state)
  next.recommendation = null
  if (!snapshot?.identityConfirmed || !snapshot.runId || !snapshot.floorId) {
    if (next.floor) next.history = [...next.history, next.floor].slice(-20)
    next.floor = snapshot ? { ...structuredClone(snapshot), identityConfirmed: false } : null
    next.marks = { targets: [], avoid: [] }
    next.currentEffects = []
    next.status = 'partial'
    next.reason = '当前楼层身份尚未确认，旧推荐已失效'
    return next
  }
  const sameFloor = (next.floor?.identityConfirmed || next.floor?.captureStopped) && next.floor.runId === snapshot.runId && next.floor.floorId === snapshot.floorId
  if (sameFloor && next.floor.captureSessionId === snapshot.captureSessionId && (!Number.isInteger(snapshot.revision) || snapshot.revision <= next.floor.revision)) return structuredClone(state)
  if (!sameFloor) {
    if (next.floor) next.history = [...next.history, next.floor].slice(-20)
    next.marks = { targets: [], avoid: [] }
    next.currentEffects = []
  }
  next.floor = structuredClone(snapshot)
  next.restoredFromSave = false
  const runId = snapshot.sanctumRunId || snapshot.runId
  if (next.altar.confirmed && next.altar.runId && next.altar.runId !== runId) next.altar.confirmed = false
  if (next.altar.confirmed && next.altar.pendingRun) {
    next.altar.runId = runId
    next.altar.pendingRun = false
  }
  const previousDecision = next.decisions?.at(-1)
  if (previousDecision && !previousDecision.observedNextRoomId && previousDecision.runId === (snapshot.sanctumRunId || snapshot.runId)
    && previousDecision.floorId === snapshot.floorId && snapshot.currentRoomId && previousDecision.currentRoomId !== snapshot.currentRoomId) {
    previousDecision.observedNextRoomId = snapshot.currentRoomId
  }
  // A snapshot is a full observation. Do not carry forward room details merely
  // because a detected ordinal happens to equal one from an earlier screenshot.
  next.currentEffects = structuredClone(snapshot.currentEffects || [])
  next.rewardLedger = syncStatusRewards(next.rewardLedger, snapshot)
  const equippedEffects = next.altar.confirmed ? next.altar.items.flatMap(item => (item.effects || []).map(e=>({...e,source:'relic',unique:item.unique}))) : []
  next.recommendation = planSanctumFloor(next.floor, next.strategy, next.marks, [...next.currentEffects, ...equippedEffects], {altar:next.altar,runObservation:next.runObservation,rewardLedger:next.rewardLedger})
  next.status = next.recommendation.status
  next.reason = next.recommendation.reason
  return next
}

export function resetSanctumRun(state) {
  const next = emptySanctumState()
  for (const key of ['enabled', 'inventory', 'strategy', 'calibration', 'liveCalibration', 'relicCalibrations', 'altar', 'loadoutPreferences', 'controlOverlayBounds']) next[key] = structuredClone(state[key])
  next.altar.confirmed = false
  return next
}
