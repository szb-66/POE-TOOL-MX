import test from 'node:test'
import assert from 'node:assert/strict'
import { decideSanctumEffects, reuseSanctumEffects, sanctumEffectScan } from '../electron/modules/sanctum/effectLedger.js'
import { parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { emptyEffectGroups } from '../shared/sanctumEffects.js'
import { applySanctumEffects } from '../shared/sanctum.js'
import { observationKey, syncStatusRewards, currentRunObservation } from '../electron/modules/sanctum/runObservation.js'
import { SEASON_BASELINE } from '../shared/seasonBaseline.js'

const catalog = {schemaVersion:1,game:'poe1',patch:SEASON_BASELINE.patch,sources:[{id:'test',channel:'official'}],entries:[
  {id:'reward',kind:'room',name:'奖励',roomType:'reward',descriptions:['完成后提供奖励']},
  {id:'pain',kind:'affliction',tier:'minor',name:'痛苦',descriptions:['不能恢复坚毅']},
  {id:'unsupported',kind:'affliction',tier:'major',name:'未知计算痛苦',descriptions:['未支持的效果描述']}
].map(entry=>({...entry,sourceId:'test',applicability:'current',reviewedPatch:SEASON_BASELINE.patch}))}

function fixture(pain = null) {
  const rooms = ['a','b','c'].map((id,column) => {
    const patch = parseSanctumRoomTexts(['奖励',...(pain && id !== 'a' ? [pain] : [])],catalog)
    for (const fact of Object.values(patch.knowledge)) fact.mapKey = 'map'
    return {id,column,row:0,revealed:true,...patch,recognition:{...patch.recognition,evidenceId:`evidence-${id}`}}
  })
  const floor = {runId:'capture',sanctumRunId:'run',floorId:'floor',mapKey:'map',identityConfirmed:true,
    currentRoomId:'a',positionStatus:'confirmed',rooms,startRoomIds:['a'],
    edges:[{from:'a',to:'b',status:'matched',traversal:'available'},{from:'b',to:'c',status:'matched',traversal:'available'}]}
  const ledger = {scope:'scope',floor,complete:true,finished:true,effectsComplete:true,classificationComplete:true,
    coverageConfirmed:true,effects:[],groups:emptyEffectGroups().map(g=>({...g,complete:true,status:'absent'})),
    targets:[],binding:observationKey(floor),rewardGroups:[{targetId:'effect:1',complete:true,rewards:[{currency:'神圣石',quantity:2,timing:'run',row:0}]}]}
  const next = structuredClone(floor); next.currentRoomId = 'b'
  // Completed rooms are no longer hovered by the real capture pipeline.
  next.rooms[1] = {id:'b',column:1,row:0,captureSkipReason:'completed'}
  return {ledger,next}
}

test('奖励房沿用整个效果基线，但不更新奖励和资源观测', () => {
  const {ledger,next} = fixture()
  const advanced = reuseSanctumEffects(ledger,next,'scope',catalog)
  assert.equal(advanced.updateMode,'reuse')
  assert.deepEqual(advanced.effects,[])
  assert.equal(advanced.effectBinding,observationKey(next))
  assert.equal(advanced.binding,observationKey(ledger.floor))
  const oldRewards = syncStatusRewards(null,{...ledger.floor,effectScan:sanctumEffectScan(ledger)})
  assert.equal(syncStatusRewards(oldRewards,{...next,effectScan:sanctumEffectScan(advanced)}),oldRewards)
  assert.equal(currentRunObservation({key:observationKey(ledger.floor),status:'confirmed',coins:100},next),null)
  assert.equal(reuseSanctumEffects(advanced,next,'scope',catalog),advanced)
  const third = structuredClone(next); third.currentRoomId = 'c'
  assert.equal(reuseSanctumEffects(advanced,third,'scope',catalog).updateMode,'reuse')
  assert.equal(ledger.floor.currentRoomId,'a')
})

test('明确痛苦加入分类与计算，保留来源且连续同词条只加入一次', () => {
  const {ledger,next} = fixture('痛苦')
  const advanced = reuseSanctumEffects(ledger,next,'scope',catalog)
  assert.equal(advanced.updateMode,'append')
  assert.equal(advanced.effects.length,1)
  assert.equal(applySanctumEffects(advanced.effects).cannotRecover,true)
  assert.equal(advanced.effects[0].trigger,undefined)
  const group = advanced.groups.find(g=>g.category === 'minorAffliction')
  assert.equal(group.status,'read')
  assert.equal(group.entries[0].name,'痛苦')
  assert.equal(group.entries[0].source.roomId,'b')
  assert.equal(group.entries[0].source.evidenceId,'evidence-b')
  assert.deepEqual(advanced.targets,[])
  const third = structuredClone(next); third.currentRoomId = 'c'
  assert.equal(reuseSanctumEffects(advanced,third,'scope',catalog).effects.length,1)
  assert.deepEqual(ledger.effects,[])
})

test('明确身份但触发机制不支持的新增痛苦要求扫描，不推断效果不变', () => {
  const {ledger,next} = fixture('未知计算痛苦')
  const decision = decideSanctumEffects(ledger,next,'scope',catalog)
  assert.equal(decision.mode,'scan')
  assert.match(decision.reason,/未知计算痛苦.*触发机制尚未确认/)
})

test('入口到首房使用可信起点，不按推荐房间提前添加', () => {
  const {ledger,next} = fixture('痛苦')
  ledger.floor.initialSelection = true; ledger.floor.positionStatus = 'initial'; ledger.floor.currentRoomId = null
  ledger.floor.startRoomIds = ['b']
  assert.equal(reuseSanctumEffects(ledger,next,'scope',catalog).effects.length,1)
  ledger.floor.startRoomIds = ['a']
  assert.equal(reuseSanctumEffects(ledger,next,'scope',catalog),null)
})

test('商人、冥约、喷泉和未知类型即使有明确痛苦也重新扫描', () => {
  for (const type of ['merchant','pact','fountain',undefined,'unknown']) {
    const {ledger,next} = fixture('痛苦'); ledger.floor.rooms[1].type = type
    assert.equal(reuseSanctumEffects(ledger,next,'scope',catalog),null,type)
  }
  const {ledger,next} = fixture(); ledger.floor.rooms[1].type = 'treasure'
  assert.equal(reuseSanctumEffects(ledger,next,'scope',catalog).updateMode,'reuse')
})

test('战斗、倒计时、复活、每房随机与未知机制在宝藏房仍需重读', () => {
  for (const effect of [{rule:'randomAfflictionEachRoom'},{rule:'randomShrine'},
    {rule:'preventResolveLoss',remainingRooms:1},{rule:'guardKill',remainingUses:2},
    {rule:'flawlessInspiration',remainingRooms:1},{rule:'reviveSacred'},{rule:'reviveOnce'},
    {rule:'lowResolveRescue'},{rule:'firstHitImmune'},{rule:'newUnknownRule'},
    {rule:'cannotRecover',expires:'unknown'},{status:'unknown'}]) {
    const {ledger,next} = fixture()
    ledger.floor.rooms[1].type='treasure'
    ledger.effects = [{status:'matched',...effect}]
    assert.equal(reuseSanctumEffects(ledger,next,'scope',catalog),null,JSON.stringify(effect))
  }
})

test('喷泉、购买、恩赐转换和楼层到期条件不阻止同层无关房间复用', () => {
  for(const effect of [{rule:'fountainAffliction'},{rule:'fountainBoon'},
    {rule:'freePurchase'},{rule:'completionCoinsIncrease'},{rule:'convertNextBoon'},
    {rule:'upgradeNextBoon'},{rule:'coinsDoubleFloor'},{rule:'cannotRecover',expires:'floorBoss'}]) {
    for(const pain of [null,'痛苦']) {
      const {ledger,next}=fixture(pain)
      ledger.effects=[{status:'matched',...effect}]
      assert.equal(decideSanctumEffects(ledger,next,'scope',catalog).mode,pain?'append':'reuse',JSON.stringify(effect))
      assert.equal(decideSanctumEffects(ledger,{...next,floorId:'next-floor'},'scope',catalog).mode,'scan')
    }
  }
})

test('痛苦转换、额外随机痛苦和次要痛苦免疫只在新增对应痛苦时重读', () => {
  for(const rule of ['convertNextAffliction','extraAffliction','minorAfflictionImmune']) {
    const empty=fixture();empty.ledger.effects=[{rule,status:'matched',name:'条件效果'}]
    assert.equal(decideSanctumEffects(empty.ledger,empty.next,'scope',catalog).mode,'reuse')
    const f=fixture('痛苦');f.ledger.effects=[{rule,status:'matched',name:'条件效果'}]
    assert.match(decideSanctumEffects(f.ledger,f.next,'scope',catalog).reason,/条件效果.*触发/)
    f.ledger.effects.push({...f.ledger.floor.rooms[1].effects[0],trigger:undefined})
    assert.equal(decideSanctumEffects(f.ledger,f.next,'scope',catalog).mode,'reuse','已有相同词条不视为新增')
  }
  const f=fixture('痛苦');f.ledger.effects=[{rule:'minorAfflictionImmune',status:'matched'}]
  const majorCatalog={...catalog,entries:catalog.entries.map(e=>e.id==='pain'?{...e,tier:'major'}:e)}
  assert.equal(decideSanctumEffects(f.ledger,f.next,'scope',majorCatalog).mode,'append','次要痛苦免疫不影响主要痛苦')
})

test('新增条件痛苦与已有条件痛苦使用相同的触发条件', () => {
  for(const [rule,mode] of [['fountainAffliction','append'],['merchantOneOption','append'],['extraAffliction','scan'],['randomAfflictionEachRoom','scan']]) {
    const f=fixture('痛苦');f.ledger.floor.rooms[1].effects=[{entryId:'pain',kind:'affliction',status:'matched',trigger:'entry',rule}]
    assert.equal(decideSanctumEffects(f.ledger,f.next,'scope',catalog).mode,mode,rule)
  }
})

test('重读原因区分不完整基线、上下文与触发效果，不把旧失败恢复为完整', () => {
  const {ledger,next}=fixture()
  ledger.complete=false
  assert.equal(decideSanctumEffects(ledger,next,'scope',catalog).reason,'上一份状态未完整读取')
  assert.equal(decideSanctumEffects(ledger,ledger.floor,'scope',catalog).reason,'上一份状态未完整读取')
  assert.equal(decideSanctumEffects(ledger,next,'other',catalog).reason,'采集上下文已变化')
  assert.equal(ledger.complete,false)
})

test('缺失信息、异常身份、断边、跨列、未完整基线均不得推导', () => {
  const changes = [
    ({ledger})=>{ledger.complete=false},
    ({ledger})=>{delete ledger.floor.rooms[1].knowledge.effects},
    ({ledger})=>{ledger.floor.rooms[1].knowledge.type.source='manual'},
    ({ledger})=>{ledger.floor.rooms[1].knowledge.effects.mapKey='other'},
    ({ledger})=>{ledger.floor.rooms[1].effects=[{status:'unknown'}]},
    ({ledger})=>{ledger.floor.edges[0].status='unknown'},
    ({ledger})=>{ledger.floor.edges[0].traversal='unavailable'},
    ({ledger})=>{ledger.floor.edges[0].occluded=true},
    ({next})=>{next.currentRoomId='c'},({next})=>{next.positionStatus='ambiguous'},
    ({next})=>{next.identityConfirmed=false},({next})=>{next.floorId='other'},
    ({next})=>{next.mapKey='other'},({next})=>{next.mapInstanceId='other'},
    ({next})=>{next.sanctumRunId='other'},({next})=>{next.rerolled=true}
  ]
  for (const change of changes) {
    const f=fixture(); change(f)
    assert.equal(reuseSanctumEffects(f.ledger,f.next,'scope',catalog),null,change.toString())
  }
  const {ledger,next}=fixture()
  assert.equal(reuseSanctumEffects(ledger,next,'new-session',catalog),null)
  assert.equal(reuseSanctumEffects(null,next,'scope',catalog),null)
})
