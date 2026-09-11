// Position snapshots describe observations, never the effects of a chosen route.
export const effectMapKey = floor => JSON.stringify([
  floor.sanctumRunId || floor.runId, floor.floorId, floor.mapInstanceId || floor.mapKey || null,
  floor.initialSelection === true ? '__entry__' : floor.currentRoomId
])
export function reuseSanctumEffects(snapshot, floor, scope) {
  if (!snapshot || snapshot.scope !== scope || (!floor.currentRoomId && !floor.initialSelection)) return null
  if (floor.positionStatus === 'unknown' || floor.positionStatus === 'ambiguous') return null
  return effectMapKey(snapshot.floor) === effectMapKey(floor) ? snapshot : null
}
