import { emptySanctumState } from '../../../shared/sanctum.js'
import { planSanctumFloor } from './planner.js'
import { currentRunObservation } from './runObservation.js'

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
  const previousDecision = next.decisions?.at(-1)
  if (previousDecision && !previousDecision.observedNextRoomId && previousDecision.runId === (snapshot.sanctumRunId || snapshot.runId)
    && previousDecision.floorId === snapshot.floorId && snapshot.currentRoomId && previousDecision.currentRoomId !== snapshot.currentRoomId) {
    previousDecision.observedNextRoomId = snapshot.currentRoomId
  }
  // A snapshot is a full observation. Do not carry forward room details merely
  // because a detected ordinal happens to equal one from an earlier screenshot.
  next.currentEffects = structuredClone(snapshot.currentEffects || [])
  if (Object.hasOwn(snapshot, 'runObservation')) next.runObservation = structuredClone(currentRunObservation(snapshot.runObservation, snapshot))
  next.recommendation = planSanctumFloor(next.floor, next.strategy, next.marks, next.currentEffects, {runObservation:next.runObservation})
  next.status = next.recommendation.status
  next.reason = next.recommendation.reason
  return next
}

export function resetSanctumRun(state) {
  const next = emptySanctumState()
  for (const key of ['enabled', 'strategy', 'calibration', 'liveCalibration', 'controlOverlayBounds', 'effectCorrectionMemory']) next[key] = structuredClone(state[key])
  return next
}
