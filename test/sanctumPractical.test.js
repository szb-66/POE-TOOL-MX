import test from 'node:test'
import assert from 'node:assert/strict'
import { createSanctumStrategy, validateSanctumStrategy } from '../shared/sanctum.js'
import { planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { reuseSanctumEffects } from '../electron/modules/sanctum/effectLedger.js'
import { validateRunResources, validateRewardLedger, hourAdvice, parseResourceRegions, observationKey } from '../electron/modules/sanctum/runObservation.js'
import { parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { parseSanctumCurrentEffects } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { sanctumRelicWeight } from '../electron/modules/sanctum/relicScoring.js'
import { runPython } from './helpers/python.js'
import fs from 'node:fs'
const catalog=JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json',import.meta.url)))
const edge=(from,to)=>({from,to,status:'matched'})
const room=(id,column,other={})=>({id,column,row:0,revealed:true,detailsStatus:'matched',layout:'exit',...other})
const map=()=>({identityConfirmed:true,runId:'batch-context',sanctumRunId:'whole-run',floorId:'floor:1',mapKey:'map',currentRoomId:'s',revision:1,
  rooms:[room('s',0),room('a',1),room('b',1),room('c',2),room('d',2),room('z',3,{terminal:true})],
  edges:[edge('s','a'),edge('s','b'),edge('a','c'),edge('a','d'),edge('b','c'),edge('c','z'),edge('d','z')]})
const plan=(f,s=createSanctumStrategy(),effects=[],context={})=>planSanctumFloor(f,s,{},effects,context)

test('默认是揭图策略；旧自定义价格保留，不迁移成行情',()=>{
  assert.equal(createSanctumStrategy().preset,'reveal')
  assert.deepEqual(createSanctumStrategy().currencyWeights,{})
  const legacy=createSanctumStrategy('currency');legacy.currencyWeights.神圣石=123
  assert.equal(validateSanctumStrategy(legacy).currencyWeights.神圣石,123)
})
test('隐藏房间注入奖励、痛苦、恢复、效果不改变排名或禁选',()=>{
  for (const preset of ['reveal','quantity','survival']) {
    const f=map(),s=createSanctumStrategy(preset);s.bannedAfflictions=['banned']
    f.rooms[1].revealed=false
    const before=plan(f,s)
    Object.assign(f.rooms[1],{rewards:[{currency:'神圣石',quantity:999,timing:'run'}],afflictions:[{id:'banned'}],effects:[{rule:'cannotRecover',trigger:'entry'}],recovery:999,relicScore:999})
    const after=plan(f,s)
    assert.deepEqual(after.paths.map(p=>[p.nextRoomId,p.score,p.vector]),before.paths.map(p=>[p.nextRoomId,p.score,p.vector]))
    assert.equal(after.status,before.status)
  }
})
test('揭图保留下次分支；数量速刷优先用户短房型，已知目标可改变两者',()=>{
  const f=map();f.rooms[1].layout='arena'
  assert.equal(plan(f).paths[0].nextRoomId,'a')
  assert.equal(plan(f,createSanctumStrategy('quantity')).paths[0].nextRoomId,'b')
  f.rooms[1].rewards=[{currency:'神圣石',quantity:null,timing:null}]
  assert.equal(plan(f,createSanctumStrategy('quantity')).paths[0].nextRoomId,'a')
  assert.ok(plan(f).unknown.some(x=>x.includes('数量')))
})
test('备选按下一房去重；汇合节点只计算一次，奖励组选项互斥',()=>{
  const f=map();f.rooms[1].rewards=[{groupId:'one',currency:'神圣石',quantity:1,timing:'immediate'},{groupId:'one',currency:'神圣石',quantity:3,timing:'run'}]
  const result=plan(f)
  assert.equal(new Set(result.paths.map(x=>x.nextRoomId)).size,result.paths.length)
  assert.equal(result.paths[0].offers.length,1)
  assert.equal(result.paths[0].offers[0].quantity,3)
  assert.equal(result.paths[0].reachable,3)
})
test('满坚毅、费用不够、禁止恢复不给喷泉加分；使用是条件性预览',()=>{
  const f=map();Object.assign(f.rooms[1],{type:'fountain',recovery:100,recoveryCost:5})
  const context={runObservation:validateRunResources({resolve:300,maxResolve:300,inspiration:7,coins:10},f)}
  const recovery=()=>plan(f,undefined,[],context).paths.find(p=>p.nextRoomId==='a').breakdown[0].parts.recovery
  assert.equal(recovery(),0)
  context.runObservation.resolve=290;context.runObservation.coins=0;assert.equal(recovery(),0)
  context.runObservation.coins=5;assert.equal(recovery(),10)
  assert.equal(context.runObservation.resolve,290)
  assert.equal(plan(f,undefined,[{rule:'cannotRecover'}],context).paths.find(p=>p.nextRoomId==='a').breakdown[0].parts.recovery,0)
})
test('主动喷泉/契约效果不进入路线实际记录，已知进入效果只影响条件性推演',()=>{
  const f=map(),actual=[];f.rooms[1].effects=[{rule:'cannotRecover',status:'matched',trigger:'choice'}]
  f.rooms[3].type='fountain';f.rooms[3].recovery=20;f.rooms[3].recoveryCost=0
  const context={runObservation:validateRunResources({resolve:10,maxResolve:100,coins:0},f)}
  const result=plan(f,undefined,actual,context)
  assert.deepEqual(actual,[])
  assert.ok(result.paths.find(p=>p.nextRoomId==='a').breakdown.some(x=>x.parts.recovery===20))
  f.rooms[1].effects[0].trigger='entry'
  assert.ok(plan(f,undefined,actual,context).paths.find(p=>p.nextRoomId==='a').breakdown.every(x=>x.parts.recovery===0))
})
test('同位置不完整快照仍复用；变化、未知、切层、整轮变化不复用',()=>{
  const f=map(),snapshot={floor:f,scope:'session',effects:[{status:'unknown'}],complete:false}
  assert.equal(reuseSanctumEffects(snapshot,{...f,runId:'another-capture'},'session'),snapshot)
  for(const change of [{currentRoomId:'a'},{floorId:'next'},{sanctumRunId:'new'},{positionStatus:'unknown'}]) assert.equal(reuseSanctumEffects(snapshot,{...f,...change},'session'),null)
  assert.equal(reuseSanctumEffects(snapshot,f,'restarted'),null)
})
test('神圣之刻只认实际装备；不同待领奖励最多复制两项，领取/新位置使账本需重确认',()=>{
  const f=map(),altar={confirmed:true,runId:'whole-run',items:[{status:'matched',uniqueId:'unique:The_Hour_of_Divinity'}]}
  const input={complete:true,items:[{id:'one',currency:'神圣石',quantity:2,state:'pending',timing:'run',eligible:true}]}
  let ledger=validateRewardLedger(input,f)
  assert.equal(hourAdvice(altar,ledger,f).copyLimit,1)
  input.items.push({...input.items[0],id:'two'},{...input.items[0],id:'three'})
  ledger=validateRewardLedger(input,f);assert.equal(hourAdvice(altar,ledger,f).copyLimit,2);assert.equal(hourAdvice(altar,ledger,f).dilution,true)
  input.items[0].state='claimed';ledger=validateRewardLedger(input,f);assert.equal(hourAdvice(altar,ledger,f).dilution,false)
  assert.equal(hourAdvice(altar,ledger,{...f,currentRoomId:'a'}).known,false)
  assert.equal(hourAdvice({...altar,confirmed:false},ledger,f).active,false)
  const saved=structuredClone(ledger);plan(f,undefined,[],{altar,rewardLedger:ledger});assert.deepEqual(ledger,saved)
  assert.throws(()=>validateRewardLedger({...input,items:[input.items[1],input.items[1]]},f),/重复/)
})
test('缺少楼层上下文时名称不推断玩法，扩展通货保留图标未知数量',()=>{
  const value=parseSanctumRoomTexts(['废弃图书馆','完成本轮时获得 1 无常瓦尔宝珠'],catalog,[{currency:'神圣石',confidence:1}])
  assert.equal(value.layout,undefined)
  assert.equal(value.rewards.find(x=>x.currency==='无常瓦尔宝珠').quantity,1)
  assert.equal(value.rewards.find(x=>x.currency==='神圣石').quantity,null)
})
test('读取资源缺失不会复活旧值，账本不完整仍允许普通选路',()=>{
  const f=map(),resources=parseResourceRegions({mapResourcesRegion:{texts:['坚毅 30 / 300','启迪：12']}},f)
  assert.equal(resources.resolve,30);assert.equal(resources.coins,null)
  assert.equal(resources.key,observationKey(f))
  assert.equal(parseResourceRegions({coinsRegion:{texts:['10','20']}},f).coins,null)
  const result=plan(f,undefined,[],{rewardLedger:{complete:false}})
  assert.ok(result.paths.length)
})
test('所有可选路径有负面仍推荐较低风险；硬禁选冲突才阻断',()=>{
  const f=map(),s=createSanctumStrategy()
  f.rooms[1].afflictions=[{id:'a-risk',name:'痛苦甲',status:'matched',trigger:'entry'}]
  f.rooms[2].afflictions=[{id:'b-risk',name:'痛苦乙',status:'matched',trigger:'entry'},{id:'c-risk',name:'痛苦丙',status:'matched',trigger:'entry'}]
  assert.equal(plan(f,s).paths[0].nextRoomId,'a')
  assert.notEqual(plan(f,s).status,'blocked')
  s.bannedAfflictions=['a-risk','b-risk']
  assert.equal(plan(f,s).status,'blocked')
})
test('分项隐藏只隔离对应内容；真实历史知识在重随机后失效',()=>{
  const f=map();f.rooms[1].rewards=[{currency:'神圣石',quantity:10,timing:'run'}]
  f.rooms[1].effects=[{rule:'cannotRecover',status:'matched',kind:'affliction',trigger:'entry'}]
  const before=plan(f,undefined,[{rule:'rewardsHidden'}])
  f.rooms[1].rewards[0].quantity=999
  assert.deepEqual(plan(f,undefined,[{rule:'rewardsHidden'}]).paths,before.paths)
  f.rooms[1].knowledge={rewards:{status:'known',source:'observed',mapKey:'map'}}
  f.rooms[1].revealed=false
  assert.equal(plan(f).paths[0].offers[0].quantity,999)
  f.rerolled=true
  assert.ok(plan(f).paths.every(p=>p.offers.length===0))
})
test('中途获得的隐藏效果改变后续房间评估，无该效果时路线被禁选阻断',()=>{
  const f=map(),s=createSanctumStrategy();s.bannedAfflictions=['ban']
  f.rooms[1].effects=[{rule:'afflictionsHidden',status:'matched',kind:'affliction',trigger:'entry'}]
  f.rooms[3].afflictions=[{id:'ban',status:'matched',trigger:'entry'}]
  f.rooms[4].afflictions=[{id:'ban',status:'matched',trigger:'entry'}]
  const through=plan(f,s)
  assert.ok(through.paths.length)
  assert.ok(through.paths.every(p=>p.rooms.includes('a')))
  assert.ok(!through.unknown.some(u=>u==='c：痛苦被效果隐藏'))
  assert.match(through.reason,/c：痛苦被效果隐藏/)
  f.rooms[1].effects=[]
  assert.equal(plan(f,s).status,'blocked')
  const g=map()
  g.rooms[1].effects=[{rule:'rewardsHidden',status:'matched',kind:'affliction',trigger:'entry'}]
  g.rooms[3].rewards=[{currency:'神圣石',quantity:10,timing:'run'}]
  const viaA=paths=>paths.find(p=>p.rooms.includes('a')&&p.rooms.includes('c'))
  assert.equal(viaA(plan(g).paths).offers.length,0)
  g.rooms[1].effects=[]
  assert.equal(viaA(plan(g).paths).offers.length,1)
})
test('倒计时与移除读自实际文本，条件性损失不写回原快照',()=>{
  const effects=parseSanctumCurrentEffects(['失去坚毅使你的禁域结束\n（1个房间后移除）','完成下间房间后失去 250 坚毅'],catalog,true)
  assert.equal(effects[0].remainingRooms,1)
  const f=map(),saved=structuredClone(effects)
  const result=plan(f,undefined,effects,{runObservation:validateRunResources({resolve:300,maxResolve:300,coins:0},f)})
  assert.ok(result.paths.every(p=>p.risks.includes('已知完成效果会结束本轮')))
  assert.deepEqual(effects,saved)
  assert.deepEqual(parseSanctumCurrentEffects([],catalog,true),[])
})
test('同种已知奖励比较可兼得总量，不能把两项小奖励当成比一项大更有价值',()=>{
  const f=map();f.rooms[1].rewards=[{currency:'神圣石',quantity:10,timing:'run'}]
  f.rooms[2].rewards=[{currency:'神圣石',quantity:1,timing:'run'}]
  f.rooms[3].rewards=[{currency:'神圣石',quantity:1,timing:'run'}]
  assert.equal(plan(f).paths[0].nextRoomId,'a')
})
test('实际状态修正绑定位置；神圣之刻缺账本继续，旧装备不作用于新轮',async()=>{
  const s=new SanctumService({});s.setEnabled(true);s.state.floor=map()
  s.correctRunResources(observationKey(s.state.floor),{resolve:20,maxResolve:100,inspiration:5,coins:0})
  const old=observationKey(s.state.floor);s.state.floor.currentRoomId='a'
  assert.throws(()=>s.correctRunResources(old,{resolve:100}),/位置已变化/)
  assert.equal(hourAdvice({confirmed:true,runId:'old',items:[{status:'matched',uniqueId:'unique:The_Hour_of_Divinity'}]},null,s.state.floor).active,false)
  await s.shutdown()
})
test('圣物新目标只比较揭示房间或数量，不把续航和金币折算成虚构利润',()=>{
  const reveal=createSanctumStrategy(),quantity=createSanctumStrategy('quantity')
  const names=['禁域地图上揭晓了 # 个额外的房间','怪物掉落的遗物数量提高 #%','当你完成一个房间时获得 # 枚耀金币']
  assert.deepEqual(names.map(name=>sanctumRelicWeight({name},reveal)),[1,0,0])
  assert.deepEqual(names.map(name=>sanctumRelicWeight({name},quantity)),[0,1,0])
})
test('实际面板读取先校验预检、标题和范围，只返回当前截图',()=>{
  const result=runPython(`
import sys,json,base64,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
s=NativeSession.__new__(NativeSession)
s.expected=None
s.image=lambda:(np.zeros((200,300,3),np.uint8),{'environment':{'width':300,'height':200}})
s.interface_state=lambda options,snapshot=None:{'mapOpen':True}
options={'coinsRegion':{'x':10,'y':20,'width':50,'height':30}}
rejected=[]
try:s.dispatch('readRunPanel',options)
except NativeError:rejected.append('unarmed')
s.expected={}
value=s.dispatch('readRunPanel',options)
image=cv2.imdecode(np.frombuffer(base64.b64decode(value['regions']['coinsRegion']['png']),np.uint8),cv2.IMREAD_COLOR)
s.interface_state=lambda options,snapshot=None:{'mapOpen':False}
try:s.dispatch('readRunPanel',options)
except NativeError:rejected.append('title')
s.interface_state=lambda options,snapshot=None:{'mapOpen':True}
try:
 value=s.dispatch('readRunPanel',{'coinsRegion':{'x':299,'y':0,'width':10,'height':10}})
 if value['regions']['coinsRegion']['status']=='unknown':rejected.append('bounds')
except NativeError:rejected.append('bounds')
print(json.dumps({'shape':list(image.shape),'rejected':rejected}))
`)
  assert.deepEqual(result,{shape:[30,50,3],rejected:['unarmed','title','bounds']})
})
