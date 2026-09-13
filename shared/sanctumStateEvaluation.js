import { SANCTUM_EXTENDED_RULES, SANCTUM_BASE_RULES } from './sanctumRules.js'

const finite = Number.isFinite
const n = value => finite(value) ? value : 0
const identity = e => e.entryId || e.id || `${e.rule}:${e.value ?? ''}`
export const isExtendedEffect = e => Boolean(SANCTUM_EXTENDED_RULES[e?.rule])
export const isEvaluatedEffect = e => isExtendedEffect(e) || Boolean(SANCTUM_BASE_RULES[e?.rule])
const combat = room => ['guards','arena','boss','miniboss'].includes(room.layout) || room.type === 'boss'
function applicable(scope, room) {
  switch (scope) {
    case 'combat': return combat(room)
    case 'guards': return ['guards','arena'].includes(room.layout) && room.type !== 'boss'
    case 'trap': return room.layout === 'trap' || room.traps?.length > 0
    case 'boss': return room.layout === 'boss' || room.type === 'boss'
    case 'merchant': case 'fountain': return room.type === scope
    case 'chest': return ['treasure','reward'].includes(room.type)
    case 'coins': return combat(room) || ['treasure','reward','merchant'].includes(room.type) || finite(room.coins)
    case 'boon': return ['boon','pact','merchant','fountain'].includes(room.type) || room.effects?.some(e=>e.kind === 'boon')
    case 'affliction': return room.effects?.some(e=>e.kind === 'affliction') || room.type === 'pact'
    case 'reward': return Boolean(room.rewards?.length)
    case 'recovery': return room.type==='fountain' || finite(room.recovery)
    case 'inspiration': return room.terminal || applicable('affliction',room)
    case 'relic': return true
    default: return true
  }
}

export function initialEffectState(resources, effects = []) {
  return {resolve:resources?.resolve,maxResolve:resources?.maxResolve,inspiration:resources?.inspiration,coins:resources?.coins,
    effects:effects.filter(e=>e?.status !== 'unknown' && e?.source !== 'relic').map(e=>({...e})),uncertain:[]}
}

// Deterministic resources and conditional opportunities are deliberately kept
// separate. The latter affect ranking but never invent a hit count or a roll.
export function advanceSanctumRoom(previous, room, {strategy = {}, events = []} = {}) {
  const state = {...previous,effects:previous.effects.map(e=>({...e})),uncertain:[...(previous.uncertain || [])]}
  const risks=[], opportunities=[], conditions=[], unknown=[...state.uncertain], contributions=[]
  let recovery=0, directLoss=0, fatal=false
  const has = rule => state.effects.some(e=>e.rule === rule)
  const sum = rule => state.effects.filter(e=>e.rule === rule).reduce((total,e)=>total+n(e.value),0)
  const remove = rule => {state.effects=state.effects.filter(e=>e.rule !== rule)}
  const low = (threshold = 50) => finite(state.resolve) && finite(state.maxResolve) ? state.resolve < state.maxResolve*threshold/100 : null
  const describe = e => e.name || e.rawText || e.entryId || e.rule
  const emit = (e, direction, reason) => {
    if (!direction) return
    if (direction < 0 && (strategy.toleratedAfflictions || []).some(id=>[e.entryId,e.id,e.name].includes(id))) return
    const text=reason==='陷阱会结束本轮' ? reason : `${describe(e)}：${reason}`
    ;(direction < 0 ? risks : opportunities).push(text)
    conditions.push(text)
    contributions.push({entryId:e.entryId,rule:e.rule,direction,reason,text})
  }
  const change = (field, amount, reason) => {
    if (!amount) return
    if (finite(state[field])) state[field]=Math.max(0,state[field]+amount)
    else unknown.push(`缺少实际${{resolve:'坚毅',maxResolve:'最大坚毅',inspiration:'启迪',coins:'耀金币'}[field]}，${reason}`)
  }
  const gainInspiration = amount => {if (!has('cannotGainInspiration')) change('inspiration',amount,'未计入启迪变化')}
  const maxResolve = amount => {
    change('maxResolve',amount,'无法计算上限变化')
    if (finite(state.resolve) && finite(state.maxResolve)) state.resolve=Math.min(state.resolve,state.maxResolve)
  }
  const heal = amount => {
    if (!amount || has('cannotRecover')) return
    if (!finite(state.resolve) || !finite(state.maxResolve)) {unknown.push('缺少实际坚毅或最大坚毅，未计入恢复');return}
    const multiplier=Math.max(0,1+(sum('recoveryIncrease')- (has('recoveryReduced')?50:0)+(low()===true?sum('lowResolveRecovery'):0))/100)
    const gained=Math.min(Math.max(0,state.maxResolve-state.resolve),Math.max(0,amount*multiplier))
    state.resolve+=gained; recovery+=gained
  }
  const coins = (amount, source = 'found') => {
    if (has('cannotGainCoins') || source === 'chest' && has('noChestCoins') || source === 'monster' && has('noMonsterCoins')) return 0
    const modifier=sum('coinsFoundModifier')+(low()===true ? sum('lowResolveCoins'):0)+(source === 'completion' ? sum('completionCoinsIncrease'):0)
    const gained=Math.max(0,amount*(1+modifier/100))*(has('coinsDouble')?2:1)*(has('coinsDoubleFloor')?2:1)
    change('coins',gained,'未计入金币收益');return gained
  }
  const loseResolve = (amount, source = 'direct') => {
    if (amount <= 0 || has('preventResolveLoss') || source === 'trap' && has('trapsDisabled')) return
    let modifier=low()===true?sum('lowResolveLoss'):0
    if (source === 'trap') modifier+=sum('trapResolveModifier')+(has('dangerousTraps')?200:0)
    if (source === 'monster') modifier+=sum('monsterResolveModifier')+(state.effects.some(e=>e.rule==='dangerousMonsters' && e.damageDomain!=='life')?25:0)
    amount*=Math.max(0,1+modifier/100)
    if (finite(state.inspiration) && state.inspiration>0) amount*=Math.max(0,1-sum('inspiredResolveReduction')/100)
    if (source === 'trap' && has('lethalTraps') || has('endsOnResolveLoss')) {fatal=true;risks.push('已知完成效果会结束本轮')}
    directLoss+=amount
    change('resolve',-amount,'无法核对坚毅损失')
    if (low(20)===true && has('lowResolveRescue')) {heal(n(state.maxResolve)*sum('lowResolveRescue')/100);remove('lowResolveRescue')}
    if (state.resolve === 0 && !fatal) {
      if (has('reviveOnce') && finite(state.maxResolve)) {state.resolve=state.maxResolve*.75;remove('reviveOnce')}
      else if (has('reviveSacred') && finite(state.maxResolve)) {
        state.resolve=state.maxResolve;maxResolve(-state.maxResolve*.5)
        // The removed boon is unknowable: do not propagate any particular boon
        // as guaranteed after this event.
        state.effects=state.effects.filter(e=>e.kind !== 'boon')
        unknown.push('复活后随机移除恩赐，后续恩赐效果需重新读取')
      } else {fatal=true;risks.push('已知完成效果会结束本轮')}
    }
  }
  const acquire = effect => {
    const e={...effect}
    if (e.status === 'unknown' || !e.rule) return
    if (state.effects.some(old=>identity(old) === identity(e))) return
    if (e.kind === 'boon') {
      if (has('cannotGainBoons') || has('boonLimit') && new Set(state.effects.filter(x=>x.kind==='boon').map(identity)).size >= 5) return
      if (has('convertNextBoon')) {remove('convertNextBoon');emit(e,-1,'下一恩赐转换为随机次要痛苦，具体结果未定');state.uncertain.push('随机痛苦');return}
      if (e.tier === 'minor' && has('upgradeNextBoon')) {remove('upgradeNextBoon');emit(e,1,'下一次要恩赐升级为随机主要恩赐，具体结果未定');return}
    }
    if (e.kind === 'affliction') {
      if (e.tier === 'minor' && has('minorAfflictionImmune')) return
      if (has('convertNextAffliction')) {remove('convertNextAffliction');emit(e,1,'下一痛苦转换为随机次要恩赐，具体结果未定');state.uncertain.push('随机转换的恩赐尚未读取，不假定其后续效果');return}
      gainInspiration(sum('inspirationOnAffliction'))
      if (has('extraAffliction') && !has('minorAfflictionImmune')) {emit(e,-1,'获得额外随机次要痛苦');state.uncertain.push('额外随机痛苦')}
    }
    if (e.rule === 'gainMaxResolve') {maxResolve(n(e.value));emit(e,Math.sign(e.value),'获取时调整最大坚毅');state.effects.push({...e,acquisitionApplied:true});return}
    if (e.rule === 'gainInspiration') {gainInspiration(n(e.value));state.effects.push({...e,acquisitionApplied:true});return}
    if (e.rule === 'copyTributes') {
      conditions.push(`${describe(e)}：获取时从已选贡品中随机复制最多${e.value}项；不评估具体复制收益`)
      state.effects.push({...e,acquisitionApplied:true});return
    }
    // Re-reading one effect/description cannot stack it. Distinct effects that
    // happen to use the same rule (e.g. coins +/-50%) retain distinct IDs.
    if (!state.effects.some(old=>identity(old) === identity(e))) state.effects.push(e)
  }
  const additions=(room.effects || []).filter(e=>['entry','completion'].includes(e.trigger))
  additions.filter(e=>e.trigger==='entry').forEach(acquire)
  const activeEffects=state.effects.map(e=>({...e}))
  if (!applicable('trap',room) && state.effects.some(e => (SANCTUM_EXTENDED_RULES[e.rule] || SANCTUM_BASE_RULES[e.rule])?.scope === 'trap')
    && !has('trapsDisabled')) unknown.push('陷阱特征未确认，未列出陷阱不代表无陷阱；相关效果尚不能完整评估')
  unknown.push(...(room.effects || []).filter(e=>e.status==='unknown').map(e=>e.rawText || '已读效果规则未知'))
  if (applicable('boss',room)) heal(n(state.maxResolve)*sum('bossRecoveryPercent')/100)

  for (const e of state.effects) {
    const definition=SANCTUM_EXTENDED_RULES[e.rule]
    if (!definition) {
      const base=SANCTUM_BASE_RULES[e.rule]
      if (base && applicable(base.scope,room)) {
        if (base.scope==='relic') { conditions.push(`${describe(e)}：${base.reason}；未评估装备圣物影响`); continue }
        if (['lethalTraps','dangerousTraps'].includes(e.rule) && (has('trapsDisabled')||has('preventResolveLoss'))) continue
        if (['resolveLossCountdown','completionResolveLossPercent'].includes(e.rule)) continue // exact completion loss below
        emit(e,base.direction,base.reason)
      }
      continue
    }
    const meta={...definition,...e}
    if (!applicable(meta.scope,room)) continue
    const rule=e.rule
    if (rule === 'monsterActionSlow' && has('monsterSpeedFloor') || meta.scope === 'trap' && has('trapsDisabled') && rule !== 'trapsDisabled') continue
    if (meta.mode === 'conditional') {
      if (['fountainBoon','upgradeNextBoon'].includes(rule) && has('cannotGainBoons') || rule==='fountainAffliction' && has('minorAfflictionImmune')) continue
      if (rule==='boonLimit' && new Set(state.effects.filter(x=>x.kind==='boon').map(identity)).size < 5) continue
      if (rule==='copyTributes') continue // Acquisition is described without estimating copied rewards.
      if (rule==='guardKill' && e.conditionalUsed) {conditions.push(`${describe(e)}：此前战斗可能已消耗，剩余次数需下次读取`);continue}
      if (rule==='flawlessInspiration' && (e.remainingRooms !== 1 || e.flawless === false)) continue
      emit(e,meta.direction,`${e.rawText || '条件效果'}${meta.random?'；随机结果待实际读取':'；按房间条件评估，不预估战斗次数或耗时'}`)
    } else {
      switch(rule) {
        case 'gainMaxResolve': case 'gainInspiration': case 'recoveryOnRoom': case 'recoveryIncrease': case 'completionCoinLoss': case 'floorCoinLoss': case 'bossRecoveryPercent': break
        case 'coinsOnHit': if (!has('preventResolveLoss') && (e.value < 0 ? state.coins !== 0 : !has('cannotGainCoins'))) emit(e,Math.sign(e.value),`每次被击中失去坚毅时${e.value<0?'损失':'获得'}${Math.abs(e.value)}枚耀金币；受击次数未知`); break
        case 'lowResolveLoss': if (low() !== false && !has('preventResolveLoss')) emit(e,-1,low()===null?'实际坚毅或上限未读取，低于50%时损失增加100%':'坚毅低于50%，损失增加100%；未来受击量未知'); break
        case 'lowResolveRecovery': if (low() !== false && !has('cannotRecover')) emit(e,1,'坚毅低于50%时恢复提高；是否触发按实际资源判断'); break
        case 'lowResolveCoins': if (low() !== false && applicable('coins',room) && !has('cannotGainCoins')) emit(e,1,'低坚毅时金币收益提高；掉落量未知'); break
        case 'coinsFoundModifier': case 'coinsDouble': case 'coinsDoubleFloor': case 'completionCoinsIncrease':
          if (applicable('coins',room) && !has('cannotGainCoins')) emit(e,e.value<0?-1:1,'改变本房间适用来源的金币收益；未读到基础数量时不推算总量');break
        case 'cannotGainCoins': case 'noChestCoins': case 'noMonsterCoins': if(applicable('coins',room)) emit(e,-1,'适用来源无法获得耀金币');break
        case 'merchantPrice': emit(e,e.value<0?1:-1,'改变商人购买成本；购买内容及价格需实际确认');break
        case 'trapResolveModifier': case 'monsterResolveModifier': if (!has('preventResolveLoss')) emit(e,e.value<0?1:-1,'改变对应来源的坚毅损失；受击量未知');break
        case 'flaskResolveLoss': emit(e,-1,'每次使用药剂失去10坚毅；使用次数未知');break
        case 'fountainMaxResolve': emit(e,1,'主动使用喷泉时增加最大坚毅');break
        case 'inspirationOnAffliction': if (applicable('affliction',room) && !has('cannotGainInspiration')) emit(e,1,'获得痛苦时增加启迪');break
        case 'inspirationOnFloor': if (room.terminal && !has('cannotGainInspiration')) emit(e,1,'下层开始时增加启迪');break
        case 'inspiredResolveReduction': if (state.inspiration !== 0 && !has('preventResolveLoss')) emit(e,1,'拥有启迪时减少坚毅损失；受击量未知');break
        case 'reviveOnce': case 'reviveSacred': case 'lowResolveRescue': emit(e,1,'达到坚毅触发条件时提供恢复保障，不假定无伤');break
      }
    }
  }
  for (const effect of room.effects || []) if (effect.trigger==='choice' && effect.status==='matched') {
    if(effect.kind==='boon' && !has('cannotGainBoons')) emit(effect,has('convertNextBoon')?-1:1,'如主动选择可获得此恩赐；未将选择结果当成已获得状态')
  }
  // External events are explicit observations/choices, never guessed by the
  // planner. These handlers also make one-use and purchase expiry testable.
  for (const event of events) {
    if (event.type === 'coinGain' && finite(event.amount)) coins(event.amount,event.source)
    if (event.type === 'purchase' && finite(event.cost) && finite(state.coins)) {
      const cost=has('freePurchase')?0:Math.max(0,event.cost*(1+sum('merchantPrice')/100))
      if (state.coins >= cost) {state.coins-=cost;remove('freePurchase');state.effects=state.effects.filter(e=>e.expires!=='purchase');(event.effects || []).forEach(acquire)}
    }
    if (event.type === 'fountain') {maxResolve(sum('fountainMaxResolve'));heal(n(event.recovery)+sum('recoveryOnFountain'))}
    if (event.type === 'flask') loseResolve(sum('flaskResolveLoss'))
    if (event.type === 'resolveLoss') loseResolve(n(event.amount),event.source)
    if (event.type === 'hitResolveLoss' && event.amount > 0 && !has('preventResolveLoss')) {
      loseResolve(n(event.amount),'monster')
      const delta=state.effects.filter(e=>e.rule==='coinsOnHit' && (e.value<0 || !has('cannotGainCoins'))).reduce((a,e)=>a+e.value,0)
      if(delta) change('coins',delta,'无法核对受击金币变化')
    }
    if (event.type === 'guardAttack') {
      const effect=state.effects.find(e=>e.rule==='guardKill')
      if(effect) {effect.remainingUses--;if(effect.remainingUses<=0) state.effects=state.effects.filter(e=>e!==effect)}
    }
    if (event.type === 'floorStart') gainInspiration(sum('inspirationOnFloor'))
    if (event.type === 'gainEffect') acquire(event.effect)
  }
  for (const effect of state.effects) {
    if(effect.rule==='guardKill' && applicable('guards',room) && !events.some(e=>e.type==='guardAttack')) effect.conditionalUsed=true
    if(effect.rule==='flawlessInspiration') {
      const confirmed=events.find(e=>e.type==='completion')?.noLoss
      effect.flawless = effect.flawless === false || confirmed === false || events.some(e=>['hitResolveLoss','resolveLoss'].includes(e.type)&&e.amount>0) ? false
        : confirmed === true && effect.flawless !== null ? true : null
      if(effect.remainingRooms===1 && effect.flawless===true) gainInspiration(effect.value)
    }
  }
  if (room.type === 'fountain' && finite(room.recoveryCost) && finite(state.coins) && state.coins>=room.recoveryCost && !has('cannotRecover')
    && finite(state.resolve) && finite(state.maxResolve) && state.resolve < state.maxResolve) {
    state.coins-=room.recoveryCost;maxResolve(sum('fountainMaxResolve'));heal(n(room.recovery)+sum('recoveryOnFountain'))
    unknown.push(`${room.id}：恢复以主动使用喷泉为条件`)
  }
  heal(sum('recoveryOnRoom')+(applicable('boss',room)?sum('recoveryOnBoss'):0))
  if (finite(room.coins)) coins(room.coins,room.coinSource || 'completion')
  if (sum('completionCoinLoss')) change('coins',-sum('completionCoinLoss'),'无法核对完成房间金币损失')
  if (has('completionCoinLoss')) emit(state.effects.find(e=>e.rule==='completionCoinLoss'),-1,'完成房间损失耀金币')
  for (const effect of [...state.effects]) {
    if (effect.rule === 'resolveLossCountdown' && effect.remainingRooms === 1) loseResolve(n(effect.value))
    if (effect.rule === 'completionResolveLossPercent') {
      if (finite(state.resolve)) loseResolve(state.resolve*n(effect.value)/100)
      else unknown.push('缺少实际坚毅，无法核对完成房间时的坚毅损失')
    }
  }
  if (directLoss && !fatal) risks.push(`完成房间将直接失去坚毅（已知量 ${directLoss}）`)
  state.effects=state.effects.flatMap(e=>Number.isInteger(e.remainingRooms) ? e.remainingRooms>1?[{...e,remainingRooms:e.remainingRooms-1}]:[]:[e])
  if (room.terminal) {
    if(has('floorCoinLoss')) {state.coins=0;emit(state.effects.find(e=>e.rule==='floorCoinLoss'),-1,'完成楼层失去全部耀金币')}
    state.effects=state.effects.filter(e=>!['floor','floorBoss'].includes(e.expires))
  }
  additions.filter(e=>e.trigger==='completion').forEach(acquire)
  return {state,activeEffects,recovery,directLoss,fatal,risks:[...new Set(risks)],opportunities:[...new Set(opportunities)],conditions:[...new Set(conditions)],unknown:[...new Set(unknown)],contributions}
}
