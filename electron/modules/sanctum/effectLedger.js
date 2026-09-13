import { completedEffectGroups, effectReadIssues, effectScanFinished, mergeEffectGroups } from '../../../shared/sanctumEffects.js'
import { SANCTUM_STATE_RULES } from '../../../shared/sanctumRules.js'
import { observationKey } from './runObservation.js'

// Only an observed completed room can advance effects; a chosen route cannot.
export const effectMapKey = floor => JSON.stringify([
  floor.sanctumRunId || floor.runId, floor.floorId, floor.mapInstanceId || floor.mapKey || null,
  floor.initialSelection === true ? '__entry__' : floor.currentRoomId
])
const mapIdentity = floor => JSON.stringify([floor.sanctumRunId || floor.runId, floor.floorId,
  floor.mapInstanceId || floor.mapKey || null])
const roomOrCombatRules = new Set(['randomAfflictionEachRoom','endsOnResolveLoss',
  'preventResolveLoss','resolveLossCountdown','guardKill','flawlessInspiration'])

// Called only after confirming a same-floor reward/treasure room with no boon
// choice. Treasure describes the reward, not whether combat happened.
function effectChangeReason(effect, additions) {
  const metadata = SANCTUM_STATE_RULES[effect.rule]
  const label = effect.name || effect.rawText || effect.rule || '未知效果'
  if (!metadata || effect.status !== 'matched') return `「${label}」的触发机制尚未确认`
  const rule = {...metadata, ...effect}
  const change = `「${label}」可能在本房间触发或到期`
  if (roomOrCombatRules.has(rule.rule) || rule.remainingRooms != null
    || rule.remainingUses != null || rule.usesPerRoom != null) return change
  if (rule.rule === 'minorAfflictionImmune') return additions.some(entry=>entry.tier === 'minor') ? change : null
  if (rule.rule === 'convertNextAffliction') return additions.length ? change : null
  if (rule.rule === 'convertNextBoon') return null
  if (rule.expires && !['purchase','floor','floorBoss'].includes(rule.expires)) return change
  if (rule.random || rule.once) {
    if (['fountain','purchase','gainBoon','floorStart','floorEnd'].includes(rule.event)) return null
    if (rule.event === 'gainAffliction') return additions.length ? change : null
    return change
  }
  return null
}

function completedRoom(previous, floor) {
  if (!previous.identityConfirmed || !floor.identityConfirmed || previous.rerolled || floor.rerolled
    || !previous.mapKey || previous.mapKey !== floor.mapKey || mapIdentity(previous) !== mapIdentity(floor)
    || floor.initialSelection || floor.positionStatus !== 'confirmed') return null
  const room = previous.rooms?.find(item => item.id === floor.currentRoomId)
  const current = floor.rooms?.find(item => item.id === floor.currentRoomId)
  if (!room || !current || !Number.isInteger(room.column) || room.column !== current.column || room.row !== current.row) return null
  if (previous.initialSelection && previous.positionStatus === 'initial') {
    if (!previous.startRoomIds?.includes(room.id)) return null
  } else {
    const from = previous.rooms?.find(item => item.id === previous.currentRoomId)
    if (previous.positionStatus !== 'confirmed' || !from || room.column !== from.column + 1
      || !previous.edges?.some(edge => edge.from === from.id && edge.to === room.id && edge.status === 'matched'
        && !edge.occluded && !['unknown','unavailable'].includes(edge.availability)
        && !['unknown','unavailable'].includes(edge.traversal))) return null
  }
  // No fallback to the newly observed node or a display-only previousCapture.
  if (!['type','afflictions','effects'].every(field => room.knowledge?.[field]?.status === 'known'
    && room.knowledge[field].source === 'observed' && room.knowledge[field].mapKey === previous.mapKey)) return null
  return room
}

export function decideSanctumEffects(snapshot, floor, scope, catalog) {
  const scan = reason => ({mode:'scan',snapshot:null,reason})
  if (!snapshot) return scan('尚无可复用的状态，首次读取或手动重读')
  if (snapshot.scope !== scope) return scan('采集上下文已变化')
  if ((!floor.currentRoomId && !floor.initialSelection)
    || ['unknown','ambiguous'].includes(floor.positionStatus)) return scan('当前位置尚未确认')
  if (effectMapKey(snapshot.floor) === effectMapKey(floor)) return {mode:'reuse',snapshot,
    reason:snapshot.complete ? null : '上一份状态未完整读取'}
  if (!snapshot.complete || !Array.isArray(snapshot.effects)) return scan('上一份状态未完整读取')
  const room = completedRoom(snapshot.floor, floor)
  if (!room) return scan('房间推进或此前房间详情尚未完整确认')
  if (!['reward','treasure'].includes(room.type)) return scan(`已完成${room.name || room.type || '未知类型房间'}，可能改变状态`)
  if (!Array.isArray(room.afflictions) || !Array.isArray(room.effects)) return scan('房间效果信息未完整读取')
  const afflictions = room.afflictions
  if (afflictions.some(item => item.status !== 'matched' || item.trigger !== 'entry' || !item.id)
    || room.effects.some(effect => effect.trigger !== 'entry' || !afflictions.some(item => item.id === effect.entryId)))
    return scan('房间包含未确认或可选的效果变化')
  const entries = []
  for (const affliction of afflictions) {
    const match = room.recognition?.matches?.find(item => item.entryId === affliction.id && item.kind === 'affliction')
    const tier = catalog?.entries?.find(item => item.id === affliction.id && item.kind === 'affliction')?.tier || affliction.tier
    if (!match || !['major','minor'].includes(tier)) return scan(`「${affliction.name || affliction.id}」的痛苦身份或级别尚未确认`)
    const source = {kind:'room',roomId:room.id,runId:snapshot.floor.runId,floorId:floor.floorId,
      mapKey:floor.mapKey,evidenceId:room.recognition.evidenceId,region:room.recognition.region,
      observationKey:observationKey(snapshot.floor)}
    const category = `${tier}Affliction`
    const effects = room.effects.filter(effect => effect.entryId === affliction.id).map(({trigger,...effect}) => ({
      ...effect,kind:'affliction',name:match.name,tier,category,source
    }))
    if (!effects.length) return scan(`「${match.name}」的效果信息未完整读取`)
    entries.push({...match,tier,category,effects,source})
  }
  const existing = new Set([...(snapshot.groups || []).flatMap(group => (group.entries || []).map(entry => entry.entryId)),
    ...snapshot.effects.map(effect => effect.entryId).filter(Boolean)])
  const additions = entries.filter(entry => {
    if (existing.has(entry.entryId)) return false
    existing.add(entry.entryId); return true
  })
  for (const effect of [...snapshot.effects,...additions.flatMap(entry=>entry.effects)]) {
    const reason = effectChangeReason(effect, additions)
    if (reason) return scan(reason)
  }
  const next = structuredClone(snapshot)
  if (additions.length) {
    next.groups = mergeEffectGroups([...(next.groups || []),{entries:additions,complete:true}],true)
    next.effects.push(...additions.flatMap(entry => entry.effects))
  }
  next.floor = structuredClone(floor)
  next.effectBinding = observationKey(floor)
  next.updateMode = additions.length ? 'append' : 'reuse'
  next.sourceRoomId = room.id
  delete next.scanReason
  // The binding keeps the actual scan position. It must never
  // make old rewards look newly observed when only effects advanced.
  return {mode:next.updateMode,snapshot:next,reason:null}
}

export function reuseSanctumEffects(snapshot, floor, scope, catalog) {
  return decideSanctumEffects(snapshot, floor, scope, catalog).snapshot
}

export function sanctumEffectScan(snapshot) {
  const scan = {complete:snapshot?.complete === true,finished:effectScanFinished(snapshot),reason:snapshot?.reason,
    groups:completedEffectGroups(snapshot?.groups,effectScanFinished(snapshot)),targets:snapshot?.targets || [],
    effectsComplete:snapshot?.effectsComplete === true,
    classificationComplete:snapshot?.classificationComplete === true,coverageConfirmed:snapshot?.coverageConfirmed === true,
    binding:snapshot?.binding,effectBinding:snapshot?.effectBinding || snapshot?.binding,
    updateMode:snapshot?.updateMode || 'scan',sourceRoomId:snapshot?.sourceRoomId,scanReason:snapshot?.scanReason}
  scan.issues = effectReadIssues(scan)
  return structuredClone(scan)
}
