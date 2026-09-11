import { initialEffectState, advanceSanctumRoom, isEvaluatedEffect } from '../../../shared/sanctumStateEvaluation.js'
import { currentRunObservation } from './runObservation.js'
import { planPracticalFloor } from './practicalPlanner.js'
import { knownRoom, isMechanicUnknown, rewardReadingGaps } from './knowledge.js'
import { hasSanctumRoomContents } from '../../../shared/sanctumRecommendation.js'
import { pendingRouteTargets, routeBoundary, pendingTargetMessages, noKnownRoomReason, boundaryReason, withRecommendationNotes } from './recommendationBoundary.js'
import { applySanctumEffects, createSanctumStrategy } from '../../../shared/sanctum.js'

const number = value => Number.isFinite(value) ? value : 0

export function scoreRoom(room, strategy, effects, optionCount = 0) {
  const observed = room.missing ? room : knownRoom(room, {}, effects, ['rewards', 'afflictions'])
  const unknown = [...effects.unknown, ...observed.missing]
  const rewardsHidden = room.revealed === false || effects.roomsHidden || effects.rewardsHidden || isMechanicUnknown(room.knowledge?.rewards)
  if (!rewardsHidden) unknown.push(...rewardReadingGaps(room))
  let reward = 0
  for (const item of room.rewards || []) {
    const weight = strategy.currencyWeights[item.currency]
    const discount = strategy.timing[item.timing]
    if (rewardsHidden || !Number.isFinite(item.quantity)
      || !Number.isFinite(weight) || !Number.isFinite(discount)) {
      if (!rewardsHidden && Number.isFinite(item.quantity) && item.timing
        && (!Number.isFinite(weight) || !Number.isFinite(discount))) unknown.push(`${room.id}：${item.currency || '奖励种类'}评分权重或领取时机规则未确认`)
    } else reward += weight * Math.max(0, item.quantity) * discount
  }
  if (room.status && !['matched', 'manual'].includes(room.status)) unknown.push(`房间 ${room.id} 位置未确认`)
  const confirmedType = ['matched', 'manual'].includes(room.detailsStatus) || room.knowledge?.type === 'known' || room.knowledge?.type?.status === 'known' ? room.type : null
  const relicRecovery = effects.recoveryOnRoom + (confirmedType === 'boss' ? effects.recoveryOnBoss : 0)
    + (confirmedType === 'fountain' ? effects.recoveryOnFountain : 0)
  if ((!room.type || room.detailsStatus === 'unknown') && (effects.recoveryOnBoss || effects.recoveryOnFountain)
    && !isMechanicUnknown(observed.knowledge?.type)) unknown.push('房间类型未确认，条件圣物恢复尚未计入')
  const recovery = effects.cannotRecover ? 0 : (number(room.recovery) + relicRecovery) * effects.recoveryMultiplier
  const risk = (room.afflictions || []).reduce((total, affliction) => total +
    number(strategy.afflictionWeights[affliction.id] ?? affliction.severity ?? 1), 0)
  const parts = {
    reward: reward * number(strategy.weights.reward), recovery: recovery * number(strategy.weights.recovery),
    risk: -risk * number(strategy.weights.risk), relic: number(room.relicScore) * number(strategy.weights.relic),
    options: optionCount * number(strategy.weights.options), preference: number(strategy.roomWeights[room.type])
  }
  return { roomId: room.id, score: Object.values(parts).reduce((a, b) => a + b, 0), parts, unknown, limitations: observed.limitations }
}

export function planSanctumFloor(floor, strategy = createSanctumStrategy(), marks = {}, currentEffects = [], context = {}) {
  const { maxPaths = 100000 } = context
  if (['reveal','quantity'].includes(strategy.preset)) return planPracticalFloor(floor,strategy,marks,currentEffects,context)
  const none = (status, reason, extra = {}) => ({ status, reason, paths: [], unknown: [], ...extra })
  if (!floor?.identityConfirmed || !floor.runId || !floor.floorId) return none('unknown', '当前楼层身份尚未确认')
  if (!Array.isArray(floor.rooms) || !Array.isArray(floor.edges)) return none('unknown', '楼层图无效')
  const rooms = new Map(floor.rooms.map(room => [room.id, room]))
  if (rooms.size !== floor.rooms.length) return none('unknown', '房间标识重复')
  if (floor.initialSelection === true && !floor.currentRoomId && floor.startRoomIds?.length) {
    const startId = '__sanctum_entry__'
    if (rooms.has(startId)) return none('unknown', '初始房间标识冲突')
    const candidates = floor.startRoomIds.filter(id => rooms.has(id))
    const synthetic = { ...floor, initialSelection: false, currentRoomId: startId,
      rooms: [...floor.rooms, { id: startId, column: -1, detailsStatus: 'matched' }],
      edges: [...floor.edges, ...candidates.map(id => ({ from: startId, to: id, status: 'matched', availability: 'gold', traversal: 'available' }))] }
    const result = planSanctumFloor(synthetic, strategy, marks, currentEffects, { ...context, maxPaths })
    if (result.paths.length) result.reason = `待选择首个房间；${result.reason}`
    result.paths = result.paths.map(path => ({ ...path, rooms: path.rooms.filter(id => id !== startId) }))
    return result
  }
  const start = floor.currentRoomId
  if (!rooms.has(start)) return none('unknown', '当前位置尚未确认')
  const targets = new Set(marks.targets || [])
  const avoid = new Set(marks.avoid || [])
  const banned = new Set(strategy.bannedAfflictions || [])
  const invalidTarget = [...targets].find(id => !rooms.has(id))
  if (invalidTarget) return none('blocked', `目标房间不存在：${invalidTarget}`)
  const adjacency = new Map([...rooms.keys()].map(id => [id, []]))
  const unknown = []
  for (const edge of floor.edges) {
    const source = rooms.get(edge.from), target = rooms.get(edge.to)
    if (!source || !target || !(target.column > source.column)) return none('unknown', '楼层连线无效或存在回环')
    if (edge.availability === 'unavailable' || edge.traversal === 'unavailable') continue
    if ((edge.status !== 'matched' && edge.status !== 'manual') || edge.availability === 'unknown') { unknown.push(`连线未确认：${edge.from} → ${edge.to}`); continue }
    if (!adjacency.get(edge.from).includes(edge.to)) adjacency.get(edge.from).push(edge.to)
  }
  const effects = applySanctumEffects(currentEffects)
  unknown.push(...effects.unknown)
  const legal = (id, activeEffects) => !avoid.has(id) && (!hasSanctumRoomContents(rooms.get(id), floor)
    || !(knownRoom(rooms.get(id), floor, activeEffects).afflictions || []).some(a => banned.has(a.id)))
  const paths = [], boundaries = []
  let visited = 0, exhausted = true
  const lastColumn = Math.max(...floor.rooms.map(room => room.column))
  const stack = [{ id: start, ids: [], parts: [], effects: [...currentEffects], evaluationState:initialEffectState(currentRunObservation(context.runObservation,floor),currentEffects) }]
  while (stack.length) {
    if (++visited > maxPaths) { exhausted = false; break }
    const { id, ids, parts, effects: inheritedEffects, evaluationState } = stack.pop()
    const original = rooms.get(id), observed = knownRoom(original, floor, applySanctumEffects(inheritedEffects), ['rewards', 'afflictions'])
    const room = {...original, ...observed}
    for (const field of ['afflictions','effects','rewards','recovery','relicScore','type']) if (observed.knowledge[field] !== 'known') delete room[field]
    if (id !== start && (avoid.has(id) || (room.afflictions || []).some(a => banned.has(a.id)))) continue
    const updatedIds = [...ids, id]
    // Afflictions acquired upon entry affect the current room and subsequent rooms.
    const assessed = id === start ? null : advanceSanctumRoom(evaluationState,room,{strategy,rewardLedger:context.rewardLedger,altar:context.altar})
    const activeEffects = assessed?.activeEffects || inheritedEffects
    const effective = applySanctumEffects(activeEffects)
    const pathLegal = target => legal(target, effective)
    const successors = adjacency.get(id).filter(pathLegal)
    const next = successors.filter(target => hasSanctumRoomContents(rooms.get(target), floor))
    const frontier = successors.length > next.length
    const boundary = routeBoundary(successors.filter(target => !next.includes(target)), rooms, floor, effective)
    if (frontier) { boundaries.push(boundary); unknown.push(...boundary.unknown) }
    const evaluation = scoreRoom({...room,afflictions:(room.afflictions || []).filter(a=>!isEvaluatedEffect(a))}, strategy, effective, successors.length)
    if (assessed) {
      if (Number.isFinite(evaluationState.resolve) && Number.isFinite(evaluationState.maxResolve)) evaluation.parts.recovery=assessed.recovery*number(strategy.weights.recovery)
      const weightedRisk=assessed.contributions.filter(e=>e.direction<0).reduce((sum,e)=>sum+number(strategy.afflictionWeights[e.entryId] ?? 1),0)
        + Math.max(0,assessed.risks.length-assessed.contributions.filter(e=>e.direction<0).length)
      evaluation.parts.risk-=weightedRisk*number(strategy.weights.risk)
      evaluation.parts.options+=assessed.opportunities.length*number(strategy.weights.options)
      evaluation.score=Object.values(evaluation.parts).reduce((a,b)=>a+b,0)
      evaluation.unknown.push(...assessed.unknown)
      evaluation.conditions=assessed.conditions; evaluation.risks=assessed.risks; evaluation.opportunities=assessed.opportunities
      evaluation.resources={resolve:assessed.state.resolve,maxResolve:assessed.state.maxResolve,inspiration:assessed.state.inspiration,coins:assessed.state.coins}
    }
    const updatedParts = id === start ? parts : [...parts, evaluation]
    // Completion effects apply only after the room is finished; they never score the room itself.
    const forwardEffects = assessed?.state.effects || activeEffects
    for (const target of next) stack.push({ id: target, ids: updatedIds, parts: updatedParts, effects: forwardEffects, evaluationState:assessed?.state || evaluationState })
    if (!next.length || frontier) {
      if (updatedIds.length < 2) continue
      const pending = pendingRouteTargets(updatedIds, targets, adjacency, rooms, pathLegal, successors.filter(target => !next.includes(target)))
      if (!pending || (!frontier && adjacency.get(id).length)) continue
      const targetMessages = pendingTargetMessages(pending, boundary, adjacency, pathLegal)
      const complete = !frontier && room.column === lastColumn && (room.terminal === true || floor.exitRoomIds?.includes(id))
      paths.push({ rooms: updatedIds, nextRoomId: updatedIds[1] || null, complete,
        conditions:updatedParts.flatMap(p=>p.conditions || []),risks:updatedParts.flatMap(p=>p.risks || []),opportunities:updatedParts.flatMap(p=>p.opportunities || []),score: updatedParts.reduce((sum, part) => sum + part.score, 0), breakdown: updatedParts,
        limitations: [...updatedParts.flatMap(part => part.limitations || []), ...targetMessages.limitations],
        unknown: [...new Set(updatedParts.flatMap(part => part.unknown).concat(boundary.unknown, targetMessages.unknown,
          frontier || complete ? [] : ['后续路径未确认']))] })
    }
  }
  paths.sort((a, b) => Number(b.complete) - Number(a.complete) || b.score - a.score || a.rooms.join('|').localeCompare(b.rooms.join('|')))
  if (!paths.length) return none(unknown.length || boundaries.length || !exhausted ? 'unknown' : 'blocked',
    noKnownRoomReason(boundaries, '没有已确认且满足目标、避让和禁选条件的路线'), { unknown: [...new Set(unknown)], optimal: exhausted })
  const top = paths.filter((path,index) => paths.findIndex(p => p.nextRoomId === path.nextRoomId) === index).slice(0, 3)
  const gaps = [...new Set([...unknown, ...top.flatMap(path => path.unknown)])]
  return { status: gaps.length || top.some(path => path.limitations.length) || !exhausted || !top[0].complete ? 'partial' : 'ready', reason: withRecommendationNotes(top.some(path => !path.complete) ? boundaryReason : '按当前信息推荐', top.flatMap(path => path.limitations)),
    runId: floor.runId, floorId: floor.floorId, revision: floor.revision, optimal: exhausted, paths: top, unknown: gaps }
}
