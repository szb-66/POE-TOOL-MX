const copy = value => { const {previousCapture,...result}=value; return structuredClone(result) }

// A previous observation is only evidence for display, never current planner
// input. Keep the exact text/region and original identity paired with its image.
export function preservePreviousCapture(floor, previous) {
  if (!floor || !previous || floor.floorId !== previous.floorId || floor.mapKey !== previous.mapKey
    || (floor.sanctumRunId || floor.runId) !== (previous.sanctumRunId || previous.runId)) return floor
  for (const room of floor.rooms || []) {
    const old = previous.rooms?.find(item=>item.id === room.id)
    if (!old) continue
    const success = room.detailsStatus === 'matched' && room.recognition?.evidenceId
      && !Object.values(room.readStages || {}).some(stage=>['failed','timeout','skipped','queued','reading','capturing'].includes(stage))
    if (success) { delete room.previousCapture; continue }
    const saved = old.previousCapture || (old.recognition?.evidenceId && old.detailsStatus === 'matched' ? {
      result:copy(old),binding:{runId:previous.runId,floorId:previous.floorId,roomId:old.id,evidenceId:old.recognition.evidenceId}
    } : null)
    if (saved) room.previousCapture = structuredClone(saved)
  }
  const retained=new Map((previous.previousEffectTargets || []).map(target=>[target.targetId,target]))
  for(const target of previous.effectScan?.targets || []) {
    if(target.stage==='matched' && target.evidenceId) retained.set(target.targetId,target)
    else if(target.previousCapture) retained.set(target.targetId,{...target.previousCapture.result,...target.previousCapture.binding})
  }
  const oldTargets = [...retained.values()]
  if (oldTargets.length) floor.previousEffectTargets = structuredClone(oldTargets)
  for (const target of floor.effectScan?.targets || []) {
    const old = oldTargets.find(item=>item.targetId === target.targetId)
    if (!old) continue
    if (target.stage === 'matched' && target.evidenceId) { delete target.previousCapture; continue }
    const saved = old.previousCapture || (old.stage === 'matched' && old.evidenceId ? {
      result:copy(old),binding:{runId:old.runId || previous.runId,floorId:old.floorId || previous.floorId,targetId:old.targetId,evidenceId:old.evidenceId}
    } : null)
    if (saved) target.previousCapture = structuredClone(saved)
  }
  if (floor.effectScan?.complete) delete floor.previousEffectTargets
  return floor
}
