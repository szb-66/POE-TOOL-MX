import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { sanctumRule, isCurrentSanctumEntry } from '../electron/modules/sanctum/catalog.js'
import { parseEffectTooltip } from '../electron/modules/sanctum/effectRecognition.js'
import { applySanctumEffects, createSanctumStrategy } from '../shared/sanctum.js'
import { initialEffectState, advanceSanctumRoom } from '../shared/sanctumStateEvaluation.js'
import { completedEffectGroups, emptyEffectGroups, mergeEffectGroups, effectReadIssues } from '../shared/sanctumEffects.js'
import { planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { observationKey } from '../electron/modules/sanctum/runObservation.js'

const catalog=JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json',import.meta.url)))
const entryEffects = entry => entry.descriptions.map(rawText=>({status:'matched',entryId:entry.id,name:entry.name,kind:entry.kind,tier:entry.tier,rawText,...sanctumRule(rawText)}))
const effects = name => entryEffects(catalog.entries.find(e=>e.name===name))
const resources={resolve:120,maxResolve:300,inspiration:0,coins:100}
const room={id:'r',layout:'guards',type:'treasure',rewards:[],effects:[]}
const run = (names, details = {}, options = {}) => advanceSanctumRoom(initialEffectState(resources,names.flatMap(effects)),{...room,...details},options)

test('守卫次数不应用于首领，已确认受损的无伤奖励不再计入机会',()=>{
  const state=initialEffectState(resources,[{rule:'guardKill',remainingUses:2}])
  const boss=advanceSanctumRoom(state,{...room,layout:'boss',type:'boss'})
  assert.equal(boss.opportunities.length,0)
  assert.equal(boss.state.effects[0].conditionalUsed,undefined)
  assert.equal(advanceSanctumRoom(boss.state,room).opportunities.length,1)
  const failed=initialEffectState(resources,[{rule:'flawlessInspiration',remainingRooms:1,flawless:false,value:150}])
  const result=advanceSanctumRoom(failed,room,{events:[{type:'completion',noLoss:true}]})
  assert.equal(result.opportunities.length,0)
  assert.equal(result.state.inspiration,0)
})

test('123个现行条目及变体有明确规则，正文完整识别且不是未知占位',()=>{
  const entries=catalog.entries.filter(e=>['boon','affliction'].includes(e.kind))
  assert.equal(entries.length,123)
  for (const entry of entries) {
    assert.ok(isCurrentSanctumEntry(catalog,entry),entry.id)
    const parsed=parseEffectTooltip({status:'located',texts:[entry.name,...entry.descriptions]},catalog)
    assert.equal(parsed.complete,true,entry.id)
    assert.ok(parsed.entries.some(e=>e.entryId===entry.id),entry.id)
    assert.equal(parsed.entries.find(e=>e.entryId===entry.id)?.calculationStatus,'supported',entry.id)
    assert.deepEqual(applySanctumEffects(entryEffects(entry)).unknown,[],entry.id)
  }
})

test('每个目录条目在适用事件或房间中提供资源、风险、机会或机制说明',()=>{
  const observations=[resources,{...resources,resolve:10,inspiration:100}, {...resources,resolve:280}]
  const rooms=[room,{...room,type:'reward',rewards:[{currency:'混沌石',quantity:5}]},{...room,type:'merchant'},{...room,type:'fountain',recovery:80,recoveryCost:10},
    {...room,layout:'trap'},{...room,layout:'boss',terminal:true},
    {...room,type:'boon',effects:[{rule:'scored',entryId:'test-boon',kind:'boon',tier:'minor',trigger:'entry',status:'matched'}]},
    {...room,type:'pact',effects:[{rule:'scored',entryId:'test-affliction',kind:'affliction',tier:'minor',trigger:'entry',status:'matched'}]},
    {...room,type:'boon',effects:Array.from({length:5},(_,i)=>({rule:'scored',entryId:`boon-${i}`,kind:'boon',tier:'minor',trigger:'entry',status:'matched'}))}]
  const eventSets=[[],[{type:'coinGain',amount:40,source:'chest'}],[{type:'coinGain',amount:40,source:'monster'}],
    [{type:'purchase',cost:20}],[{type:'fountain',recovery:20}],[{type:'resolveLoss',amount:20,source:'trap'}],
    [{type:'hitResolveLoss',amount:30}],[{type:'resolveLoss',amount:500}],[{type:'flask'}],[{type:'floorStart'}]]
  const projection = result => JSON.stringify({resolve:result.state.resolve,maxResolve:result.state.maxResolve,inspiration:result.state.inspiration,coins:result.state.coins,
    risks:result.risks,opportunities:result.opportunities,conditions:result.conditions,fatal:result.fatal})
  for(const entry of catalog.entries.filter(e=>['boon','affliction'].includes(e.kind))) {
    const rules=entryEffects(entry)
    let changed=false
    for(const observed of observations) {
      if(changed) break
      for(const target of rooms) {
        if(changed) break
        for(const events of eventSets) {
          const options={events}
          const baseline=projection(advanceSanctumRoom(initialEffectState(observed),target,options))
          const current=projection(advanceSanctumRoom(initialEffectState(observed,rules),target,options))
          const gained=projection(advanceSanctumRoom(initialEffectState(observed),{...target,effects:[...(target.effects || []),...rules.map(e=>({...e,trigger:'entry'}))]},options))
          if(baseline !== current || baseline !== gained) {changed=true;break}
        }
      }
    }
    // Countdown variants must be tested at their actual expiry, rather than
    // inventing an immediate loss for all variants.
    if(!changed && rules.some(e=>e.remainingRooms)) {
      let state=initialEffectState(resources,rules)
      for(let i=0;i<10;i++) {const next=advanceSanctumRoom(state,room);if(next.directLoss || next.opportunities.length) changed=true;state=next.state}
    }
    assert.ok(changed,`${entry.name} ${entry.id} 没有行为实现`)
  }
})

test('四项报告效果：金币减半、受击扣币、低坚毅损失、上限变化且当前资源不重复扣减',()=>{
  assert.equal(run(['焦化硬币'],{}, {events:[{type:'coinGain',amount:80}]}).state.coins,140)
  assert.equal(run(['钱包过满'],{}, {events:[{type:'hitResolveLoss',amount:5}]}).state.coins,80)
  assert.equal(run(['巫毒人偶'],{}, {events:[{type:'resolveLoss',amount:10}]}).state.resolve,100)
  assert.equal(run(['弱化血肉']).state.maxResolve,300)
  const acquired=run([],{effects:effects('弱化血肉').map(e=>({...e,trigger:'entry'}))})
  assert.equal(acquired.state.maxResolve,200)
  assert.equal(advanceSanctumRoom(acquired.state,room).state.maxResolve,200)
})

test('条件风险按房间和实际资源评估，不虚构受击和金币数',()=>{
  const value=run(['钱包过满','巫毒人偶'])
  assert.equal(value.state.coins,100);assert.equal(value.state.resolve,120)
  assert.ok(value.conditions.some(s=>s.includes('受击次数未知')))
  assert.equal(run(['钱包过满'],{layout:'exit',type:'fountain'}).risks.length,0)
  const high=advanceSanctumRoom(initialEffectState({...resources,resolve:200},effects('巫毒人偶')),room)
  assert.equal(high.risks.length,0)
  assert.equal(run(['祈祷念珠','钱包过满']).risks.length,0)
})

test('金币禁止、来源限制、价格、免费购买与购买后移除',()=>{
  assert.equal(run(['钱包失窃'],{}, {events:[{type:'coinGain',amount:100}]}).state.coins,100)
  assert.equal(run(['空白珍宝'],{}, {events:[{type:'coinGain',amount:100,source:'chest'}]}).state.coins,100)
  assert.equal(run(['不洁指环'],{}, {events:[{type:'purchase',cost:40}]}).state.coins,40)
  const free=run(['圣神赐福','金制奖杯'],{}, {events:[{type:'purchase',cost:40}]})
  assert.equal(free.state.coins,100)
  assert.ok(!free.state.effects.some(e=>['freePurchase','completionCoinsIncrease'].includes(e.rule)))
  assert.equal(run(['楼层税款'],{terminal:true}).state.coins,0)
  assert.ok(!run(['黄金矿石'],{terminal:true}).state.effects.some(e=>e.rule==='coinsDoubleFloor'))
})

test('免疫、转换、启迪、复活、倒计时和使用次数',()=>{
  const affliction=effects('弱化血肉').map(e=>({...e,trigger:'entry'}))
  assert.equal(run(['水晶圣杯'],{effects:affliction}).state.maxResolve,300)
  const converted=run(['水晶碎片'],{effects:affliction})
  assert.equal(converted.state.maxResolve,300);assert.ok(!converted.state.effects.some(e=>e.rule==='convertNextAffliction'))
  assert.equal(run(['锈蚀钟琴'],{effects:affliction}).state.inspiration,30)
  const revive=run(['祭司圣印'],{}, {events:[{type:'resolveLoss',amount:200}]})
  assert.equal(revive.state.resolve,225);assert.ok(!revive.state.effects.some(e=>e.rule==='reviveOnce'))
  assert.equal(run(['祈祷念珠'],{}, {events:[{type:'resolveLoss',amount:200}]}).state.resolve,120)
  const kill=run(['刺客之刃'],{}, {events:[{type:'guardAttack'}]})
  assert.ok(!kill.state.effects.some(e=>e.rule==='guardKill'))
  const countdown={rule:'resolveLossCountdown',remainingRooms:2,value:25,status:'matched'}
  const first=advanceSanctumRoom(initialEffectState(resources,[countdown]),room)
  const second=advanceSanctumRoom(first.state,room)
  assert.equal(first.state.resolve,120);assert.equal(second.state.resolve,95);assert.equal(second.state.effects.length,0)
})

test('两套策略中条件战斗效果改变实际推荐，输入未被修改',()=>{
  for(const preset of ['reveal','quantity']) {
    const f={identityConfirmed:true,runId:'run',floorId:'floor',revision:1,currentRoomId:'s',positionStatus:'confirmed',exitRoomIds:['a','b'],
      rooms:[{id:'s',column:0},{id:'a',column:1,layout:'guards',terminal:true},{id:'b',column:1,layout:'trap',terminal:true}].map(r=>({...r,type:'treasure',status:'matched',detailsStatus:'matched',revealed:true,rewards:[],afflictions:[],effects:[]})),
      edges:[{from:'s',to:'a',status:'matched'},{from:'s',to:'b',status:'matched'}]}
    const strategy=createSanctumStrategy(preset)
    strategy.layoutPreference={guards:0,trap:0}
    const context={runObservation:{...resources,key:observationKey(f),status:'confirmed'}}
    const plain=planSanctumFloor(f,strategy,{},[],context)
    const original=structuredClone(f)
    const withRisk=planSanctumFloor(f,strategy,{},effects('钱包过满'),context)
    assert.equal(plain.paths[0].nextRoomId,'a',preset)
    assert.equal(withRisk.paths[0].nextRoomId,'b',preset)
    assert.deepEqual(f,original)
  }
})

test('未采集保持待确认，分类结束空类别显示无，计算条件不制造读取失败',()=>{
  assert.ok(completedEffectGroups(emptyEffectGroups()).every(g=>g.status==='unconfirmed'))
  assert.ok(completedEffectGroups(emptyEffectGroups(),true).every(g=>g.status==='absent'))
  assert.ok(mergeEffectGroups([],true).every(g=>g.status==='absent'))
  const parsed=parseEffectTooltip({status:'located',texts:['钱包过满','当你被击中而失去坚毅时，损失20枚耀金币']},catalog)
  assert.equal(parsed.complete,true)
  assert.deepEqual(effectReadIssues({complete:true,groups:mergeEffectGroups([parsed],true)}),[])
  const failed=effectReadIssues({complete:false,groups:completedEffectGroups(emptyEffectGroups()),targets:[{targetId:'effect:1',stage:'ocr-failed',reason:'文字识别超时'}]})
  assert.ok(failed.some(i=>i.targetId==='effect:1'&&i.reason==='文字识别超时'))
})
