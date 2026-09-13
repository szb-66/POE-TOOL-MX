import { roomLayoutPreference } from '../../../shared/sanctumRoomProfiles.js'
import { layoutLabels } from '../../../shared/sanctumPresentation.js'
import { initialEffectState, advanceSanctumRoom, isExtendedEffect, isEvaluatedEffect } from '../../../shared/sanctumStateEvaluation.js'
import { applySanctumEffects } from '../../../shared/sanctum.js'
import { knownRoom, rewardReadingGaps } from './knowledge.js'
import { hasSanctumRoomContents } from '../../../shared/sanctumRecommendation.js'
import { pendingRouteTargets, routeBoundary, pendingTargetMessages, noKnownRoomReason, boundaryReason, withRecommendationNotes } from './recommendationBoundary.js'
import { currentRunObservation } from './runObservation.js'

const value = n => Number.isFinite(n) ? n : 0
const keyOf = item => item.currency
const compareVector = (a, b) => {
  for (let i = 0; i < Math.max(a.length,b.length); i++) if (value(a[i]) !== value(b[i])) return value(b[i]) - value(a[i])
  return 0
}

// One offer per choice group. The selected alternative remains a conditional
// preview, not an observed selection.
export function chooseRewardOptions(room, strategy) {
  const groups = new Map()
  for (const item of room.rewards || []) {
    const group = item.groupId || 'offer'
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push(item)
  }
  const priority = item => value(strategy.targetPriority?.[keyOf(item)])
  return [...groups.values()].map(items => items.toSorted((a,b) => priority(b)-priority(a)
    || (a.currency === b.currency && Number.isFinite(a.quantity) && Number.isFinite(b.quantity) ? b.quantity-a.quantity : 0))[0])
}

function compareTargets(a, b, strategy) {
  const tiers=[...new Set(Object.values(strategy.targetPriority || {}).filter(x=>x>0))].sort((a,b)=>b-a)
  for (const tier of tiers) {
    const left=a.offers.filter(o=>strategy.targetPriority[o.currency]===tier),right=b.offers.filter(o=>strategy.targetPriority[o.currency]===tier)
    const kinds=new Set([...left,...right].map(o=>o.currency))
    if (kinds.size===1 && left.length && right.length && [...left,...right].every(o=>Number.isFinite(o.quantity))) {
      const difference=right.reduce((n,o)=>n+o.quantity,0)-left.reduce((n,o)=>n+o.quantity,0)
      if(difference) return difference
    } else if(left.length!==right.length) return right.length-left.length
  }
  return 0
}

function targetVector(offers, strategy) {
  const priorities = [...new Set(Object.values(strategy.targetPriority || {}).filter(x => x > 0))].sort((a,b)=>b-a)
  // Quantity is compared only when the entire same-priority currency set is
  // known. An unknown amount establishes a target opportunity, never 1 unit.
  return priorities.map(priority => offers.filter(x => strategy.targetPriority[x.currency] === priority).length)
}

export function planPracticalFloor(floor, strategy, marks = {}, currentEffects = [], context = {}) {
  const none = (status, reason, unknown = []) => ({ status, reason, paths: [], unknown, optimal: false })
  if (!floor?.identityConfirmed || !floor.runId || !floor.floorId) return none('unknown','当前楼层身份尚未确认')
  if (!Array.isArray(floor.rooms) || !Array.isArray(floor.edges)) return none('unknown','楼层图无效')
  const rooms = new Map(floor.rooms.map(r=>[r.id,r]))
  if (rooms.size !== floor.rooms.length) return none('unknown','房间标识重复')
  const initial = floor.initialSelection && !floor.currentRoomId
  const start = initial ? '__entry__' : floor.currentRoomId
  if (!initial && !rooms.has(start)) return none('unknown','当前位置尚未确认')
  const adj = new Map([...rooms.keys()].map(id=>[id,[]])), gaps = []
  if (initial) adj.set(start, (floor.startRoomIds || []).filter(id=>rooms.has(id)))
  for (const edge of floor.edges) {
    if (!rooms.has(edge.from) || !rooms.has(edge.to) || !(rooms.get(edge.to).column > rooms.get(edge.from).column)) return none('unknown','楼层连线无效或存在回环')
    if (edge.availability === 'unavailable' || edge.traversal === 'unavailable') continue
    if (!['matched','manual'].includes(edge.status) || edge.availability === 'unknown') { gaps.push(`连线未确认：${edge.from} → ${edge.to}`); continue }
    if (!adj.get(edge.from).includes(edge.to)) adj.get(edge.from).push(edge.to)
  }
  const targets = new Set(marks.targets || []), avoid = new Set(marks.avoid || []), bans = new Set(strategy.bannedAfflictions || [])
  if ([...targets].some(id=>!rooms.has(id) || avoid.has(id))) return none('blocked','目标不存在或与避让冲突；未放宽硬约束')
  const actual = currentEffects.filter(e => e?.source !== 'relic')
  const active = applySanctumEffects(actual)
  gaps.push(...active.unknown)
  const legal = (id, fx = active) => !avoid.has(id) && (!hasSanctumRoomContents(rooms.get(id), floor)
    || !(knownRoom(rooms.get(id), floor, fx).afflictions || []).some(a=>bans.has(a.id) || bans.has(a.name)))
  const reach = (id, fx = active) => {
    const seen = new Set(), queue = [...(adj.get(id)||[])]
    while(queue.length) { const next=queue.pop(); if (seen.has(next)||!legal(next,fx)) continue; seen.add(next); queue.push(...adj.get(next)) }
    return seen.size
  }
  const resources = currentRunObservation(context.runObservation, floor)
  const stack = [{ id:start, rooms:[], breakdown:[], effects:actual, offers:[], risk:0, recovery:0, opportunity:0, evaluationState:initialEffectState(resources,actual) }]
  const paths = [], boundaries = [], maxPaths = context.maxPaths ?? 100000
  let visited=0, exhausted=true
  while(stack.length) {
    if (++visited > maxPaths) { exhausted=false; break }
    const state=stack.pop(), id=state.id, isStart=id===start
    const before=applySanctumEffects(state.effects)
    if (!isStart && !legal(id,before)) continue
    const nextState={ ...state, rooms:[...state.rooms,id], breakdown:[...state.breakdown], offers:[...state.offers] }
    if (!isStart) {
      const room=knownRoom(rooms.get(id),floor,before), missing=[...room.missing], limitations=[...room.limitations], risks=[], disruptions=[]
      for (const e of room.effects || []) if (e.status === 'unknown') missing.push(e.rawText || '已读效果的规则尚未支持')
      if (rooms.get(id).status && !['matched','manual'].includes(rooms.get(id).status)) missing.push(`${id}：房间位置未确认`)
      const assessed=advanceSanctumRoom(state.evaluationState, {...room,terminal:rooms.get(id).terminal}, {strategy})
      nextState.evaluationState=assessed.state
      nextState.effects=assessed.state.effects
      missing.push(...assessed.unknown); risks.push(...assessed.risks)
      nextState.opportunity+=assessed.opportunities.length
      const effects=applySanctumEffects(assessed.activeEffects)
      if (effects.randomAfflictionEachRoom) limitations.push('每房随机临时痛苦，无法预知具体内容')
      if (effects.randomDestination) limitations.push('随机传送生效，所选房间及后续目标不能保证到达')
      const tolerated=new Set(strategy.toleratedAfflictions || [])
      for (const a of room.afflictions||[]) {
        if (a.trigger === 'choice') { missing.push(`${id}：契约痛苦取决于玩家选择`); continue }
        if (before.minorAfflictionImmune && a.tier === 'minor') continue
        if (before.convertNextAffliction && a.tier === 'minor') {
          limitations.push('下一痛苦将转换为随机恩赐，结果由下次实际读取确认')
          nextState.effects=nextState.effects.filter(e=>e.rule!=='convertNextAffliction')
          continue
        }
        if (tolerated.has(a.id)||tolerated.has(a.name) || isExtendedEffect(a)) continue
        if (a.status === 'unknown' || a.trigger !== 'entry' && a.trigger !== 'completion') { missing.push(`${id}：痛苦触发条件或规则未确认`); continue }
        // Affliction-specific relevance is evaluated by rule; no hidden severity
        // number or arbitrary risk multiplier is accepted from a room fixture.
        if (a.rule === 'cannotGainBoons' && before.cannotGainBoons) continue
        if (['lethalTraps','dangerousTraps','dangerousMonsters'].includes(a.rule)) continue
        if (a.rule === 'randomDestination') disruptions.push('无法保证进入所选房间')
        if (a.rule === 'rewardsHidden' && strategy.preset === 'reveal') disruptions.push('后续揭图目标奖励被隐藏')
        if (a.rule === 'typesHidden' && strategy.preset === 'quantity') disruptions.push('后续速刷房型被隐藏')
        if (a.rule === 'rewardsHidden' && strategy.preset==='quantity') limitations.push('奖励隐藏降低后续目标可知度')
        if (!isEvaluatedEffect(a)) risks.push(a.name||a.rawText||a.id)
      }
      const recovery=assessed.recovery
      const offers=chooseRewardOptions(room,strategy)
      missing.push(...rewardReadingGaps({ id, rewards: offers }))
      nextState.offers.push(...offers.map(o=>({...o,roomId:id})))
      nextState.risk+=risks.length
      nextState.recovery+=recovery
      if(effects.endsOnResolveLoss) missing.push('当前失去坚毅即结束本轮，无法保证无伤完成')
      nextState.breakdown.push({roomId:id,layout:room.layout,type:room.type,layoutPreference:roomLayoutPreference(room,strategy),score:0,parts:{reward:0,risk:-risks.length,recovery,options:0,preference:0,relic:0},unknown:missing,limitations,risks,disruptions,conditions:assessed.conditions,opportunities:assessed.opportunities,resources:{resolve:assessed.state.resolve,maxResolve:assessed.state.maxResolve,inspiration:assessed.state.inspiration,coins:assessed.state.coins}})
    }
    const forward=applySanctumEffects(nextState.effects)
    const successors=(adj.get(id)||[]).filter(nextId=>legal(nextId,forward))
    const next=successors.filter(nextId=>hasSanctumRoomContents(rooms.get(nextId), floor))
    const frontier=successors.length>next.length
    const boundary=routeBoundary(successors.filter(nextId=>!next.includes(nextId)),rooms,floor,forward)
    if(frontier) { boundaries.push(boundary); gaps.push(...boundary.unknown) }
    for(const nextId of next) stack.push({...nextState,id:nextId})
    if (!next.length || frontier) {
      const pending=pendingRouteTargets(nextState.rooms,targets,adj,rooms,nextId=>legal(nextId,forward),successors.filter(nextId=>!next.includes(nextId)))
      if (!pending) continue
      const targetMessages=pendingTargetMessages(pending,boundary,adj,nextId=>legal(nextId,forward))
      const complete=!frontier && (rooms.get(id)?.terminal===true || floor.exitRoomIds?.includes(id)===true)
      // A dead end caused by hard constraints is not a continuing option.
      if ((adj.get(id)||[]).length && !complete && !frontier) continue
      const route=nextState.rooms.filter(x=>x!=='__entry__'), nextRoomId=initial?route[0]:route[1]
      if (!nextRoomId) continue
      const choiceCount=(adj.get(nextRoomId)||[]).filter(x=>legal(x,forward)).length, reachable=reach(nextRoomId,forward)
      const firstStep=nextState.breakdown[0], layout=firstStep?.layoutPreference || 0
      const laterLayout=nextState.breakdown.slice(1).reduce((sum,step)=>sum+step.layoutPreference,0)
      const opportunity=['pact','boon'].includes(firstStep?.type)?1:0
      const target=targetVector(nextState.offers,strategy), hasTarget=target.some(x=>x>0)
      const tail=strategy.preset==='quantity' ? [layout,laterLayout,choiceCount,reachable,opportunity] : [choiceCount,reachable,opportunity,layout,laterLayout]
      const lethal=nextState.breakdown.flatMap(x=>x.risks).filter(x=>x==='陷阱会结束本轮'||x==='已知完成效果会结束本轮').length
      const disruptions=nextState.breakdown.flatMap(x=>x.disruptions)
      const vector=[-lethal,-disruptions.length,-nextState.risk,...target,nextState.recovery,nextState.opportunity,...tail]
      const unknown=[...new Set([...nextState.breakdown.flatMap(x=>x.unknown),...boundary.unknown,...targetMessages.unknown])]
      if (!complete && !frontier) unknown.push('后续连通性尚未确认')
      paths.push({rooms:route,nextRoomId,complete,conditional:true,score:0,vector,risks:nextState.breakdown.flatMap(x=>x.risks),breakdown:nextState.breakdown,unknown,
        limitations:[...nextState.breakdown.flatMap(x=>x.limitations || []),...targetMessages.limitations],
        conditions:nextState.breakdown.flatMap(x=>x.conditions || []),opportunities:nextState.breakdown.flatMap(x=>x.opportunities || []),offers:nextState.offers,riskVector:[-lethal,-disruptions.length,-nextState.risk],tailVector:[nextState.recovery,...tail],choiceCount,reachable, reasons:[...disruptions,`下一间${layoutLabels[firstStep?.layout] || '玩法未知'}：偏好 ${layout}；后续已知房间偏好合计 ${laterLayout}`, nextState.risk?`已知路径有 ${nextState.risk} 项未容忍风险`:'已知信息中无新增未容忍风险',hasTarget?'保留同一路线上可兼得的目标奖励':strategy.preset==='quantity'?'优先配置的短房型与稳定完成':'优先推进后的选择空间',`推进后 ${choiceCount} 个直接选项，后续 ${reachable} 个去重可达房间`]})
    }
  }
  const compare=(a,b)=>Number(b.complete)-Number(a.complete)||compareVector(a.riskVector,b.riskVector)||compareTargets(a,b,strategy)||compareVector(a.tailVector,b.tailVector)
  paths.sort((a,b)=>compare(a,b)||a.rooms.join('|').localeCompare(b.rooms.join('|')))
  const top=[...new Map(paths.map(p=>[p.nextRoomId,paths.find(x=>x.nextRoomId===p.nextRoomId)])).values()].slice(0,3)
  if (!top.length) return none(gaps.length||boundaries.length||!exhausted?'unknown':'blocked',noKnownRoomReason(boundaries,'没有已确认且满足目标、避让和禁选的继续路线'),[...new Set(gaps)])
  const unknown=[...new Set([...gaps,...top.flatMap(p=>p.unknown)])]
  const tied=top.length>1 && compare(top[0],top[1])===0
  const reason=withRecommendationNotes(top.some(path=>!path.complete)?boundaryReason:'按当前可见信息推荐',[
    ...(initial?['待选择首个房间']:[]),...(tied?['当前已知条件并列']:[]),...top.flatMap(path=>path.limitations)])
  return {status:unknown.length||top.some(path=>path.limitations.length)||!exhausted||!top[0].complete?'partial':'ready',reason,
    runId:floor.runId,floorId:floor.floorId,revision:floor.revision,paths:top,unknown,optimal:exhausted&&!unknown.length&&!tied,tied}
}
