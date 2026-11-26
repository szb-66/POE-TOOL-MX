import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { runPython as _m0_runPython } from './helpers/python.js'
import { parseSanctumEffectGroup as _m0_parseSanctumEffectGroup } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumService as _m0_SanctumService } from '../electron/modules/sanctum/service.js'
import { planSanctumFloor as _m0_planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { createSanctumStrategy as _m1_createSanctumStrategy, validateSanctumStrategy as _m1_validateSanctumStrategy } from '../shared/sanctum.js'
import { planSanctumFloor as _m1_planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { reuseSanctumEffects as _m1_reuseSanctumEffects } from '../electron/modules/sanctum/effectLedger.js'
import { validateRunResources as _m1_validateRunResources, parseResourceRegions as _m1_parseResourceRegions, observationKey as _m1_observationKey } from '../electron/modules/sanctum/runObservation.js'
import { parseSanctumRoomTexts as _m1_parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { parseSanctumCurrentEffects as _m1_parseSanctumCurrentEffects } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumService as _m1_SanctumService } from '../electron/modules/sanctum/service.js'
import { runPython as _m1_runPython } from './helpers/python.js'
import _m1_fs from 'node:fs'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { runPython as _m2_runPython } from './helpers/python.js'
import { parseSanctumRoomTexts as _m2_parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumCapture as _m2_SanctumCapture } from '../electron/modules/sanctum/capture.js'
import { AutomationLock as _m2_AutomationLock } from '../electron/modules/automation/lock.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { runPython as _m3_runPython } from './helpers/python.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import _m4_fs from 'node:fs'
import _m4_path from 'node:path'
import _m4_os from 'node:os'
import _m4_vm from 'node:vm'
import { pathToFileURL as _m4_pathToFileURL } from 'node:url'
import { sanctumNativeScriptPath as _m4_sanctumNativeScriptPath } from '../electron/modules/sanctum/nativeClient.js'
import { runPython as _m4_runPython } from './helpers/python.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { liveProfile as _m5_liveProfile } from '../shared/sanctumLive.js'
import { parseResourceRegions as _m5_parseResourceRegions } from '../electron/modules/sanctum/runObservation.js'
import { SanctumService as _m5_SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumLiveDriver as _m5_SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumLogContext as _m5_SanctumLogContext } from '../electron/modules/sanctum/logContext.js'
import { sanctumLogEvents as _m5_sanctumLogEvents } from './helpers/sanctumLog.js'
import { runPython as _m5_runPython } from './helpers/python.js'
import { acceptSanctumFloor as _m5_acceptSanctumFloor } from '../electron/modules/sanctum/state.js'
import { emptySanctumState as _m5_emptySanctumState } from '../shared/sanctum.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import _m6_fs from 'node:fs'
import _m6_os from 'node:os'
import _m6_path from 'node:path'
import { runPython as _m6_runPython } from './helpers/python.js'
import { parseSanctumRoomTexts as _m6_parseSanctumRoomTexts, SanctumLiveDriver as _m6_SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { roomCardSummary as _m6_roomCardSummary, rewardDetail as _m6_rewardDetail } from '../shared/sanctumPresentation.js'
import { SanctumRepository as _m6_SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { emptySanctumState as _m6_emptySanctumState } from '../shared/sanctum.js'
import { rewardReadingGaps as _m6_rewardReadingGaps } from '../electron/modules/sanctum/knowledge.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import _m7_fs from 'node:fs'
import { runPython as _m7_runPython } from './helpers/python.js'
import { parseStatusTooltip as _m7_parseStatusTooltip } from '../electron/modules/sanctum/statusRecognition.js'
import { SanctumLiveDriver as _m7_SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { effectReadIssues as _m7_effectReadIssues } from '../shared/sanctumEffects.js'
import { observationKey as _m7_observationKey } from '../electron/modules/sanctum/runObservation.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { runPython as _m8_runPython } from './helpers/python.js'
import { parseSanctumRoomTexts as _m8_parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import _m9_fs from 'node:fs'
import { SANCTUM_ROOM_PROFILES as _m9_SANCTUM_ROOM_PROFILES, recognizeRoomProfile as _m9_recognizeRoomProfile, roomLayoutPreference as _m9_roomLayoutPreference } from '../shared/sanctumRoomProfiles.js'
import { createSanctumStrategy as _m9_createSanctumStrategy } from '../shared/sanctum.js'
import { initialEffectState as _m9_initialEffectState, advanceSanctumRoom as _m9_advanceSanctumRoom } from '../shared/sanctumStateEvaluation.js'
import { parseSanctumRoomTexts as _m9_parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { knownRoom as _m9_knownRoom } from '../electron/modules/sanctum/knowledge.js'
import { planSanctumFloor as _m9_planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { SanctumService as _m9_SanctumService } from '../electron/modules/sanctum/service.js'
import { preservePreviousCapture as _m9_preservePreviousCapture } from '../electron/modules/sanctum/previousCapture.js'
import { runPython as _m9_runPython } from './helpers/python.js'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import { runPython as _m10_runPython } from './helpers/python.js'
import { roomExclusions as _m10_roomExclusions } from '../electron/modules/sanctum/roomEligibility.js'
import _m11_test from 'node:test'
import _m11_assert from 'node:assert/strict'
import { SanctumImageCapacity as _m11_SanctumImageCapacity } from '../electron/modules/sanctum/imageCapacity.js'
import { SanctumLiveDriver as _m11_SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { matchRoomText as _m11_matchRoomText, recognizeRoomTexts as _m11_recognizeRoomTexts } from '../electron/modules/sanctum/textRecognition.js'
import { runPython as _m11_runPython } from './helpers/python.js'
import _m12_test from 'node:test'
import _m12_assert from 'node:assert/strict'
import _m12_fs from 'node:fs'
import { runPython as _m12_runPython } from './helpers/python.js'
import { parseStatusTooltip as _m12_parseStatusTooltip } from '../electron/modules/sanctum/statusRecognition.js'
import { observationKey as _m12_observationKey } from '../electron/modules/sanctum/runObservation.js'
import { SanctumLiveDriver as _m12_SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { acceptSanctumFloor as _m12_acceptSanctumFloor } from '../electron/modules/sanctum/state.js'
import { emptySanctumState as _m12_emptySanctumState } from '../shared/sanctum.js'
import { effectReadIssues as _m12_effectReadIssues, effectIssueText as _m12_effectIssueText, effectTargetLabel as _m12_effectTargetLabel, completedEffectGroups as _m12_completedEffectGroups, emptyEffectGroups as _m12_emptyEffectGroups, effectScanFinished as _m12_effectScanFinished } from '../shared/sanctumEffects.js'

// === Merged from sanctumPathCapture.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const runPython = _m0_runPython
  const parseSanctumEffectGroup = _m0_parseSanctumEffectGroup
  const SanctumService = _m0_SanctumService
  const planSanctumFloor = _m0_planSanctumFloor
test('宝库斜向已走线：原始截图全部 34 房间与连线，定位第二列第二房', () => {
  const result = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import analyze_floor,load_image
c=json.load(open('test/fixtures/sanctum/archives-live-profile.json',encoding='utf-8'))['calibration']
im=load_image('test/fixtures/sanctum/vault-diagonal-map.png')
# Full window screenshot includes its 34px title bar; calibration is client-relative.
f=analyze_floor(im[299:1514,912:2912],c)
print(json.dumps({'position':f['currentRoomId'],'rooms':[r['id'] for r in f['rooms']],
'edges':[[e['from'],e['to'],e['traversal']] for e in f['edges']]}))`)
  assert.equal(result.position,'1:1')
  assert.deepEqual(result.rooms,[3,4,5,4,5,6,6,1].flatMap((rows,col)=>Array.from({length:rows},(_,row)=>`${col}:${row}`)))
  // Destinations checked against the screenshot; v=solid gold, g=hollow gold, r=red.
  const rows=[
    ['0:0','1:0r 1:1r'],['0:1','1:1r'],['0:2','1:1v 1:2r 1:3r'],
    ['1:0','2:0r 2:1r'],['1:1','2:1g 2:2g'],['1:2','2:2r 2:3r'],['1:3','2:3r 2:4r'],
    ['2:0','3:0r 3:1r'],['2:1','3:1g 3:2g'],['2:2','3:2g'],['2:3','3:2r'],['2:4','3:2r 3:3r'],
    ['3:0','4:0r 4:1r'],['3:1','4:1g'],['3:2','4:1g 4:2g'],['3:3','4:2r 4:3r 4:4r'],
    ['4:0','5:0r 5:1r'],['4:1','5:1g 5:2g 5:3g'],['4:2','5:3g'],['4:3','5:3r 5:4r'],['4:4','5:4r 5:5r'],
    ['5:0','6:0r 6:1r'],['5:1','6:1g'],['5:2','6:1g 6:2g'],['5:3','6:2g 6:3g'],['5:4','6:3r 6:4r'],['5:5','6:4r 6:5r'],
    ...Array.from({length:6},(_,i)=>[`6:${i}`,`7:0${i>=1&&i<=3?'g':'r'}`])]
  assert.deepEqual(result.edges,rows.flatMap(([from,targets])=>targets.split(' ').map(to=>[from,to.slice(0,-1),{r:'unavailable',v:'visited',g:'available'}[to.at(-1)]])))
})

test('实机路径截面区分已走和可达，紫框不定位，补齐真实首领出口', () => {
  const result = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import analyze_floor,load_image
out=[]
for name in ['archives-progress-1','archives-progress-2','archives-progress-3','vault-progress','vault-entry']:
 f=analyze_floor(load_image('test/fixtures/sanctum/'+name+'.png'))
 out.append({'position':f.get('currentRoomId'),'initial':f.get('initialSelection'),'exits':f.get('exitRoomIds'),
 'visited':sum(e['traversal']=='visited' for e in f['edges']), 'available':sum(e['traversal']=='available' for e in f['edges']),
 'purplePosition':any(r.get('currentCandidate') for r in f['rooms'])})
print(json.dumps(out))`)
  assert.deepEqual(result.slice(0, 4).map(r => r.position), ['1:1', '2:1', '3:2', '4:1'])
  assert.deepEqual(result.slice(0, 4).map(r => r.visited), [1, 2, 3, 4])
  assert.ok(result.every(r => r.available > 0 && !r.purplePosition && r.exits.length === 1))
  // 底部效果图标仅局部遮挡，通用边框恢复房间及入边后确认完整入口。
  assert.equal(result[4].initial, true)
  assert.equal(result[4].position, null)
})

test('分叉、断链不能定位；真实终点无出边仍可定位', () => {
  const result = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_paths import locate_position
rooms=[{'id':str(i),'column':i} for i in range(4)]
def e(a,b):return {'from':str(a),'to':str(b),'traversal':'visited','status':'matched'}
print(json.dumps([locate_position(rooms,edges)['currentRoomId'] for edges in [[e(0,1),e(1,2),e(2,3)],[e(0,1),e(0,2)],[e(0,1),e(2,3)],[]]]))`)
  assert.deepEqual(result, ['3', null, null, null])
})

test('首列唯一可达出边确认当前位置；多候选入口待选；全不可达保持未知', () => {
  const result = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_paths import locate_position
rooms=[{'id':'0:0','column':0},{'id':'0:1','column':0},{'id':'0:2','column':0}]+[{'id':f'{c}:0','column':c} for c in range(1,8)]
def e(a,b,t='available'):
 return {'from':a,'to':b,'status':'matched','availability':'gold' if t!='unavailable' else 'unavailable','traversal':t}
chain=[e(f'{c}:0',f'{c+1}:0') for c in range(1,7)]
entered=[e('0:0','1:0','unavailable'),e('0:1','1:0'),e('0:2','1:0','unavailable')]+chain
entry=[e('0:0','1:0'),e('0:1','1:0'),e('0:2','1:0')]+chain
blocked=[e('0:0','1:0','unavailable'),e('0:1','1:0','unavailable'),e('0:2','1:0','unavailable')]+chain
walked=[e('0:0','1:0','unavailable'),e('0:1','1:0','visited'),e('0:2','1:0','unavailable')]+chain
out=[locate_position(rooms,edges) for edges in [entered,entry,blocked,walked]]
print(json.dumps([{'cur':o['currentRoomId'],'status':o['positionStatus'],'initial':o['initialSelection'],'starts':o['startRoomIds']} for o in out]))`)
  assert.deepEqual(result[0], { cur: '0:1', status: 'confirmed', initial: false, starts: [] })
  assert.deepEqual(result[1], { cur: null, status: 'initial', initial: true, starts: ['0:0', '0:1', '0:2'] })
  assert.deepEqual(result[2], { cur: null, status: 'unknown', initial: false, starts: [] })
  assert.equal(result[3].cur, '1:0')
  assert.equal(result[3].status, 'confirmed')
})

test('已揭示房间被图标切分仍识别，并按两段已走实心金线定位', () => {
  const result = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import analyze_floor,load_image
c={'version':1,'scope':'live','imageSize':[2000,1215],'region':[0,0,2000,1215],'roomSize':[86,131],'pathHsv':[[15,165,162],[31,255,255]]}
im=load_image('test/fixtures/sanctum/vault-missing-middle-room.png')
# Full window screenshot includes its 34px title bar; calibration is client-relative.
f=analyze_floor(im[299:1514,912:2912],c)
print(json.dumps({'position':f['currentRoomId'],'status':f['positionStatus'],
 'column0':[r['id'] for r in f['rooms'] if r['column']==0],
 'visited':[[e['from'],e['to']] for e in f['edges'] if e['traversal']=='visited']}))`)
  assert.equal(result.position, '2:2')
  assert.equal(result.status, 'confirmed')
  assert.deepEqual(result.column0, ['0:0', '0:1', '0:2'])
  assert.deepEqual(result.visited, [['0:1', '1:2'], ['1:2', '2:2']])
})

test('碎片补位覆盖列内首中尾，只接受对齐且不重叠的候选', () => {
  const result = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import merge_fragmented_rooms
def room(y,w=82,h=133): return {'x':201,'y':y,'width':w,'height':h,'quality':.95}
def frag(x,y,w,h): return {'x':x,'y':y,'width':w,'height':h,'quality':.43}
cases=[]
cases.append([a['y'] for a in merge_fragmented_rooms([room(560),room(797)],[frag(205,324,90,109)],1215)])
cases.append([a['y'] for a in merge_fragmented_rooms([room(324),room(797)],[frag(205,558,90,109)],1215)])
cases.append([a['y'] for a in merge_fragmented_rooms([room(324),room(560)],[frag(205,797,90,109)],1215)])
# 背景装饰不同列、与已有房间纵向重叠的重复碎片都必须拒绝
cases.append([a['y'] for a in merge_fragmented_rooms([room(324),room(797)],[frag(1768,838,93,113),frag(201,324,82,133)],1215)])
print(json.dumps(cases))`)
  assert.deepEqual(result, [[324], [558], [797], []])
})

test('手动定位下一次识别失效，不套用旧位置', () => {
  const service = new SanctumService({})
  service.setEnabled(true)
  const floor = { identityConfirmed: true, runId: 'r', floorId: 'f', mapKey: 'm', revision: 1,
    rooms: [{ id: 'a', column: 0 }, { id: 'b', column: 1, terminal: true }], edges: [{ from: 'a', to: 'b', status: 'matched', availability: 'gold' }] }
  service.state.floor = floor
  service.setCurrentRoom({ id: 'a', runId: 'r', floorId: 'f', revision: 1 })
  assert.equal(service.state.floor.currentRoomId, 'a')
  assert.equal(service.state.floor.positionSource, 'manual')
  service.stop()
  assert.equal(service.positionOverride, null)
  const recapture = service.applyPosition({ ...floor, currentRoomId: null, positionStatus: 'unknown' })
  assert.equal(recapture.currentRoomId, null)
  assert.equal(recapture.positionStatus, 'unknown')
})

test('缺少词库时不以标题或描述规则冒充词条身份',()=>{
  const group=parseSanctumEffectGroup({status:'located',texts:['主要恩赐','不能恢复坚毅']},{entries:[]})
  assert.equal(group.category,null)
  assert.equal(group.complete,false)
  assert.equal(group.entries.length,0)
})

test('手动位置校验地图版本，身份变化失效；初始选房不伪造当前位置', () => {
  const service = new SanctumService({})
  service.setEnabled(true)
  const floor = { identityConfirmed: true, runId: 'r', floorId: 'f', mapKey: 'm', revision: 1,
    rooms: [{ id: 'a', column: 0 }, { id: 'b', column: 1, terminal: true }], edges: [{ from: 'a', to: 'b', status: 'matched', availability: 'gold' }] }
  service.state.floor = floor
  assert.throws(() => service.setCurrentRoom({ id: 'a', runId: 'r', floorId: 'f', revision: 0 }), /版本/)
  service.setCurrentRoom({ id: 'a', runId: 'r', floorId: 'f', revision: 1 })
  assert.equal(service.state.floor.positionSource, 'manual')
  assert.equal(service.applyPosition({ ...floor, currentRoomId: null }).currentRoomId, 'a')
  assert.equal(service.applyPosition({ ...floor, mapKey: 'new', currentRoomId: null }).currentRoomId, null)
  assert.equal(service.positionOverride, null)
  const unknown = planSanctumFloor({ ...floor, initialSelection: true, startRoomIds: ['a'] })
  assert.deepEqual(unknown.paths, [])
  assert.match(unknown.reason, /先识别房间/)
  const result = planSanctumFloor({ ...floor, initialSelection: true, startRoomIds: ['a'],
    rooms: floor.rooms.map(room => ({ ...room, detailsStatus: 'matched' })) })
  assert.match(result.reason, /首个房间/)
  assert.deepEqual(result.paths[0].rooms, ['a', 'b'])
  assert.equal(result.paths[0].nextRoomId, 'a')
})
})()

// === Merged from sanctumPractical.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const createSanctumStrategy = _m1_createSanctumStrategy
  const validateSanctumStrategy = _m1_validateSanctumStrategy
  const planSanctumFloor = _m1_planSanctumFloor
  const reuseSanctumEffects = _m1_reuseSanctumEffects
  const validateRunResources = _m1_validateRunResources
  const parseResourceRegions = _m1_parseResourceRegions
  const observationKey = _m1_observationKey
  const parseSanctumRoomTexts = _m1_parseSanctumRoomTexts
  const parseSanctumCurrentEffects = _m1_parseSanctumCurrentEffects
  const SanctumService = _m1_SanctumService
  const runPython = _m1_runPython
  const fs = _m1_fs
const catalog=JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json',import.meta.url)))
const edge=(from,to)=>({from,to,status:'matched'})
const room=(id,column,other={})=>({id,column,row:0,revealed:true,detailsStatus:'matched',layout:'exit',...other})
const map=()=>({identityConfirmed:true,runId:'batch-context',sanctumRunId:'whole-run',floorId:'floor:1',mapKey:'map',currentRoomId:'s',revision:1,
  rooms:[room('s',0),room('a',1),room('b',1),room('c',2),room('d',2),room('z',3,{terminal:true})],
  edges:[edge('s','a'),edge('s','b'),edge('a','c'),edge('a','d'),edge('b','c'),edge('c','z'),edge('d','z')]})
const plan=(f,s=createSanctumStrategy(),effects=[],context={})=>planSanctumFloor(f,s,{},effects,context)

test('默认是揭图策略；不提供旧自定义价格',()=>{
  assert.equal(createSanctumStrategy().preset,'reveal')
  assert.equal(createSanctumStrategy().currencyWeights,undefined)
  assert.throws(()=>validateSanctumStrategy({...createSanctumStrategy(),preset:'currency'}),/无效/)
})
test('隐藏房间注入奖励、痛苦、恢复、效果不改变排名或禁选',()=>{
  for (const preset of ['reveal','quantity']) {
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
test('缺少楼层上下文时名称不推断玩法，扩展通货保留图标未知数量',()=>{
  const value=parseSanctumRoomTexts(['废弃图书馆','完成本轮时获得 1 无常瓦尔宝珠'],catalog,[{currency:'神圣石',confidence:1}])
  assert.equal(value.layout,undefined)
  assert.equal(value.rewards.find(x=>x.currency==='无常瓦尔宝珠').quantity,1)
  assert.equal(value.rewards.find(x=>x.currency==='神圣石').quantity,null)
})
test('读取资源缺失不会复活旧值，资源未知仍允许普通选路',()=>{
  const f=map(),resources=parseResourceRegions({mapResourcesRegion:{texts:['坚毅 30 / 300','启迪：12']}},f)
  assert.equal(resources.resolve,30);assert.equal(resources.coins,null)
  assert.equal(resources.key,observationKey(f))
  assert.equal(parseResourceRegions({coinsRegion:{texts:['10','20']}},f).coins,null)
  const result=plan(f)
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
test('实际状态修正绑定位置',async()=>{
  const s=new SanctumService({});s.setEnabled(true);s.state.floor=map()
  s.correctRunResources(observationKey(s.state.floor),{resolve:20,maxResolve:100,inspiration:5,coins:0})
  const old=observationKey(s.state.floor);s.state.floor.currentRoomId='a'
  assert.throws(()=>s.correctRunResources(old,{resolve:100}),/位置已变化/)
  await s.shutdown()
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
})()

// === Merged from sanctumRealCapture.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const runPython = _m2_runPython
  const parseSanctumRoomTexts = _m2_parseSanctumRoomTexts
  const SanctumCapture = _m2_SanctumCapture
  const AutomationLock = _m2_AutomationLock
test('真实运行校准保留全部 30 房间，逐边核对金色、红色与已走链且无多余连线', () => {
  const result = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession
from sanctum_recognition import load_image
p=json.load(open('test/fixtures/sanctum/archives-live-profile.json',encoding='utf-8'))
out=[]
for name in ['archives-live-map','archives-calibration-map']:
 im=load_image('test/fixtures/sanctum/'+name+'.png');h,w=im.shape[:2]
 p['mapRegion']={'x':0,'y':0,'width':w,'height':h}
 p['calibration']['imageSize']=[w,h];p['calibration']['region']=[0,0,w,h]
 s=NativeSession.__new__(NativeSession);s.check=lambda:None;s.image=lambda:(im,{});s.match_title=lambda *a:True
 f=s.observe(p)['floor'];by={r['id']:str(r['column'])+':'+str(r['row']) for r in f['rooms']}
 out.append({'rooms':len(f['rooms']),'position':by[f['currentRoomId']], 'exits':[by[i] for i in f['exitRoomIds']],
 'edges':[[by[e['from']],by[e['to']],e['traversal']] for e in f['edges']]})
print(json.dumps(out))`)
  // Manually checked against the supplied map: each row lists actual destinations.
  const rows = [
    ['0:0','1:0r 1:1r 1:2v'],['1:0','2:0r'],['1:1','2:0r 2:1r'],['1:2','2:1v 2:2r'],
    ['2:0','3:0r 3:1r 3:2r'],['2:1','3:2g 3:3g'],['2:2','3:3r 3:4r 3:5r'],
    ['3:0','4:0r'],['3:1','4:0r'],['3:2','4:0g 4:1g'],['3:3','4:1g'],['3:4','4:1r 4:2r'],['3:5','4:2r 4:3r'],
    ['4:0','5:0g 5:1g 5:2g'],['4:1','5:2g 5:3g 5:4g'],['4:2','5:4r 5:5r'],['4:3','5:5r'],
    ['5:0','6:0g'],['5:1','6:0g 6:1g'],['5:2','6:1g 6:2g'],['5:3','6:2g 6:3g'],['5:4','6:3g 6:4g'],['5:5','6:4r 6:5r'],
    ...Array.from({length:6},(_,i)=>[`6:${i}`,`7:0${i===5?'r':'g'}`])]
  const expected = rows.flatMap(([from, targets]) => targets.split(' ').map(to => [from,to.slice(0,-1),{r:'unavailable',v:'visited',g:'available'}[to.at(-1)]]))
  for (const floor of result) {
    assert.equal(floor.rooms,30)
    assert.equal(floor.position,'2:1')
    assert.deepEqual(floor.exits,['7:0'])
    assert.deepEqual(floor.edges,expected)
  }
})

test('真实半透明弹框保留名称候选，按楼层确认玩法且图标奖励保留未知', () => {
  const result = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import load_image
from sanctum_tooltip import locate_tooltip
from chart_mods_probe import create_rapidocr_engine,ordered_texts
im=load_image('test/fixtures/sanctum/archives-live-tooltip.png')
# Actual no-tooltip map crop, aligned by the unchanged lower-left map texture.
# Alignment offset was verified with 0.9999998 normalized correlation.
baseline=load_image('test/fixtures/sanctum/archives-live-map.png')
view=im[270:270+baseline.shape[0],917:917+baseline.shape[1]]
r=locate_tooltip(baseline,view,(1590-917,925-270))
a=r['region'];r['texts']=ordered_texts(create_rapidocr_engine(),view[a['y']:a['y']+a['height'],a['x']:a['x']+a['width']],.60)
r['region']={**a,'x':a['x']+917,'y':a['y']+270}
print(json.dumps(r))`)
  assert.equal(result.method,'decorated-title')
  assert.ok(result.region.x >= 1180 && result.region.x <= 1300)
  assert.ok(result.region.y >= 500 && result.region.y <= 525)
  assert.deepEqual(result.texts,['遗弃的图书馆、破旧的地窖、礼拜堂、地下室','完成后提供物品'])
  const parsed = parseSanctumRoomTexts(result.texts,{ entries:[] })
  assert.equal(parsed.nameCandidates.length,4)
  assert.equal(parsed.layout,undefined)
  const withFloor = parseSanctumRoomTexts(result.texts,{ entries:[] },[],{floorId:'floor:0'})
  assert.equal(withFloor.layout,'exit')
  assert.deepEqual(withFloor.traps,['ice-ring'])
  assert.equal(parsed.type,'reward')
  assert.equal(parsed.detailsStatus,'partial')
  assert.deepEqual(parsed.rewards,[])
  assert.equal(parsed.rewardEvidence[0].status,'unknown')
})

test('部分文字不重扫，失败不整次重试，进度先于结果且停止后事件无效', async () => {
  const env={windowId:'game',width:1920,height:1080,dpi:96}
  const observation={foreground:true,userTakeover:false,mapOpen:true,interfaceMatched:true,overlayExcluded:true,environment:env}
  const frame={...observation,floor:{runId:'run',floorId:'floor',identityConfirmed:true,rooms:['a','b'].map(id=>({id,column:0,revealed:true,detailFingerprint:id})),edges:[]}}
  const calls=[], outputs=[]; let progress
  const driver={inspect:()=>observation,subscribeSafety:()=>()=>{},subscribeProgress:fn=>{progress=fn;return()=>{progress=null}},
    async *frames(){yield structuredClone(frame);yield structuredClone(frame)},
    async hover(room){calls.push(room.id);progress({stage:'ocr',targetId:room.id});return {patch:room.id==='a'?{detailsStatus:'partial',rawText:'未知词缀'}:{detailsStatus:'failed'}}}}
  const capture=new SanctumCapture({driver,automationLock:new AutomationLock()})
  await capture.run(env,value=>outputs.push(value))
  assert.deepEqual(calls,['a','b'])
  assert.ok(outputs.some(f=>f.captureProgress.step==='ocr' && f.rooms[0].detailsStatus==='reading'))
  assert.equal(outputs.at(-1).rooms[0].rawText,'未知词缀')
  assert.equal(progress,null)
})

test('截图降级只隐藏绘图层，控制面板移到采集区外且保持可见', () => {
  const result=runPython(`
import sys,json,threading,types,numpy as np
sys.path.insert(0,'src/assets/scripts')
import sanctum_native as n
out=[]
for role,affinity in [('control',17),('control',0),('graph',0)]:
 calls=[];visible=[True]
 class U:
  def IsWindow(self,h):return True
  def IsWindowVisible(self,h):return visible[0]
  def GetWindowThreadProcessId(self,h,p):p._obj.value=7;return 1
  def GetWindowDisplayAffinity(self,h,p):p._obj.value=affinity;return 1
  def ShowWindow(self,h,mode):visible[0]=bool(mode);calls.append('show' if mode else 'hide')
  def GetWindowRect(self,h,p):p._obj.left=0;p._obj.top=0;p._obj.right=60;p._obj.bottom=40;return 1
  def SetWindowPos(self,*a):calls.append('park');return 1
 class Capture:
  def __enter__(self):return self
  def __exit__(self,*a):pass
  def grab(self,b):calls.append('capture-visible' if visible[0] else 'capture-hidden');return np.zeros((400,600,4),np.uint8)
 n.mss.mss=Capture;n.ctypes.windll=types.SimpleNamespace(dwmapi=types.SimpleNamespace(DwmFlush=lambda:None))
 s=n.NativeSession.__new__(n.NativeSession);s.u=U();s.cancelled=threading.Event()
 s.check=lambda:{'clientBounds':{'x':0,'y':0,'width':600,'height':400}}
 s.capture_windows=[{'handle':'1','processId':7,'role':role}]
 s.capture_options={'mapRegion':{'x':120,'y':80,'width':400,'height':280}}
 im,_=s.image();out.append({'calls':calls,'visible':visible[0],'masked':bool(np.all(im[15,15]==255))})
print(json.dumps(out))`)
  assert.deepEqual(result,[
    {calls:['capture-visible'],visible:true,masked:false},
    {calls:['park','capture-visible'],visible:true,masked:true},
    {calls:['hide','capture-hidden','show'],visible:true,masked:false}])
})
})()

// === Merged from sanctumRecognition.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const runPython = _m3_runPython
test('宝库实机推进图及入口局部遮挡通过真实边框恢复房间', () => {
  const results = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import analyze_floor,load_image
print(json.dumps([analyze_floor(load_image('test/fixtures/sanctum/'+n+'.png')) for n in ['vault-entry','vault-progress']]))
`)
  const [entry, progress] = results
  // Manual count from the supplied screenshots, left to right and top to bottom.
  const counts = floor => Array.from({length: 8}, (_, col) => floor.rooms.filter(room => room.column === col).length)
  assert.deepEqual(counts(progress), [3, 3, 6, 5, 3, 3, 3, 1])
  assert.deepEqual(counts(entry), [3, 3, 6, 5, 3, 3, 3, 1])
  assert.equal(entry.status, 'partial')
  assert.equal(progress.status, 'partial')
  const edge = (floor, from, to) => floor.edges.find(item => item.from === from && item.to === to)
  assert.equal(edge(entry, '0:0', '1:0').availability, 'gold')
  assert.equal(edge(progress, '0:0', '1:0').availability, 'unavailable')
  assert.equal(edge(progress, '5:1', '6:0').availability, 'gold')
  assert.equal(edge(progress, '6:0', '7:0').status, 'matched')
  assert.ok(progress.rooms.every(room => room.detailsStatus === 'unknown'))
})

test('非地图界面不能生成楼层图', () => {
  const results = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import analyze_floor,load_image
images=[np.zeros((800,1200,3),dtype=np.uint8),load_image('test/fixtures/sanctum/offering-choice.png'),load_image('test/fixtures/sanctum/relic-altar.png')]
print(json.dumps([analyze_floor(image) for image in images]))
`)
  for (const result of results) {
    assert.equal(result.status, 'unknown')
    assert.deepEqual(result.rooms, [])
  }
})
})()

// === Merged from sanctumRelease.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const fs = _m4_fs
  const path = _m4_path
  const os = _m4_os
  const vm = _m4_vm
  const pathToFileURL = _m4_pathToFileURL
  const sanctumNativeScriptPath = _m4_sanctumNativeScriptPath
  const runPython = _m4_runPython
test('正式路由保留圣所页面和浮窗，仅排除模型训练', () => {
  const source = fs.readFileSync('src/router/index.js', 'utf8')
  const definitions = source.slice(source.indexOf('const routes = ['), source.indexOf('const router'))
  const context = vm.createContext({ pageLoaders: new Proxy({}, { get: () => () => {} }) })
  const routes = vm.runInContext(definitions.replaceAll('import.meta.env.DEV', 'false') + '\nroutes', context)
  for (const route of ['/sanctum', '/sanctum-overlay', '/sanctum-control-overlay']) {
    assert.ok(routes.some(item => item.path === route), route)
  }
  assert.equal(routes.some(item => item.path === '/highlight-model-training'), false)
  const loaderSource = fs.readFileSync('src/router/pageLoaders.js', 'utf8')
    .replace(/^import .*$/m, '').replace('export const pageLoaders', 'const pageLoaders')
    .split('export const preloadPage')[0].replaceAll('import.meta.env.DEV', 'false')
  const loaders = vm.runInNewContext(loaderSource + '\npageLoaders')
  assert.equal(typeof loaders['/sanctum'], 'function')
  assert.equal(loaders['/highlight-model-training'], undefined)
})

test('圣所解包资源可独立导入并读取奖励图标和校准示例', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-release-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const unpacked = path.join(root, 'app.asar.unpacked')
  const config = JSON.parse(fs.readFileSync('package.json', 'utf8')).build
  const files = fs.globSync(config.asarUnpack)
  assert.ok(files.some(file => file.endsWith('sanctum_native.py')))
  for (const file of files) {
    assert.ok(config.files.some(pattern => !pattern.startsWith('!') && path.matchesGlob(file, pattern)), file)
    const target = path.join(unpacked, file)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(file, target)
  }
  const moduleUrl = pathToFileURL(path.join(root, 'app.asar/electron/modules/sanctum/nativeClient.js'))
  const script = sanctumNativeScriptPath(moduleUrl)
  assert.equal(script, path.join(unpacked, 'src/assets/scripts/sanctum_native.py'))
  assert.ok(fs.existsSync(sanctumNativeScriptPath()))
  const result = runPython(`
import sys, json
sys.path.insert(0, ${JSON.stringify(path.dirname(script))})
import sanctum_native, sanctum_postprocess, sanctum_ocr, sanctum_resources
from sanctum_rewards import templates
from sanctum_calibration_collection import reference_image
print(json.dumps({'icons': len(templates()), 'examples': [reference_image(i).shape[1] for i in [1, 2]]}))
`, { cwd: root, windowsHide: true })
  assert.ok(result.icons > 0)
  assert.deepEqual(result.examples, [2048, 2048])
})
})()

// === Merged from sanctumResourceRegions.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const liveProfile = _m5_liveProfile
  const parseResourceRegions = _m5_parseResourceRegions
  const SanctumService = _m5_SanctumService
  const SanctumLiveDriver = _m5_SanctumLiveDriver
  const SanctumLogContext = _m5_SanctumLogContext
  const sanctumLogEvents = _m5_sanctumLogEvents
  const runPython = _m5_runPython
  const acceptSanctumFloor = _m5_acceptSanctumFloor
  const emptySanctumState = _m5_emptySanctumState
const floor = { identityConfirmed:true, runId:'run', floorId:'floor:0', currentRoomId:'a' }
const read = (...texts) => ({status:'located',texts})

const coin = text => ({...read(text), ocrBlocks:[{text,region:{x:50,y:10,width:100,height:20}}],
  resourceEvidence:{coinRegion:{x:10,y:8,width:20,height:25}}})
const moduleRead = (resolve, inspiration, noInspiration=false) => ({...read(`坚毅 ${resolve}`, ...(inspiration===undefined?[]:[`启迪 ${inspiration}`])), resourceEvidence:{noInspiration}})

test('提供截图：地图双框与独立整栏在原始及半尺寸下读取真实数值', () => {
  const samples=runPython(`
import sys,json,cv2,base64
sys.path.insert(0,'src/assets/scripts')
from sanctum_ocr import read_frozen,create_sanctum_ocr_engine
from sanctum_resources import resource_evidence
engine=create_sanctum_ocr_engine();out=[]
for scale in [1,.5]:
 reads={}
 for key,name in [('coinsRegion','resource-map-coins.png'),('mapResourcesRegion','resource-map-hud.png'),('hudResourcesRegion','resource-standalone-hud.png')]:
  im=cv2.imread('test/fixtures/sanctum/'+name)
  im=cv2.resize(im,None,fx=scale,fy=scale)
  ok,png=cv2.imencode('.png',im);h,w=im.shape[:2]
  reads[key]=read_frozen({'png':base64.b64encode(png).decode(),'region':dict(x=0,y=0,width=w,height=h),'room':False,'includeIcons':False,'resources':True},engine)
  if key=='mapResourcesRegion':
   # An OCR miss on the second row must not prove zero inspiration.
   missing=[line for line in reads[key]['ocrLines'] if '坚毅' in line['text']]
   assert not resource_evidence(im,missing)['noInspiration']
 out.append(reads)
print(json.dumps(out))`)
  for (const reads of samples) {
    const map=parseResourceRegions({coinsRegion:reads.coinsRegion,mapResourcesRegion:reads.mapResourcesRegion},floor)
    assert.deepEqual([map.coins,map.resolve,map.maxResolve,map.inspiration],[270,418,418,70])
    const hud=parseResourceRegions({hudResourcesRegion:reads.hudResourcesRegion},floor)
    assert.deepEqual([hud.coins,hud.resolve,hud.maxResolve,hud.inspiration],[270,416,418,0])
  }
})

test('资源随有效快照提交，未知不沿用旧值，过期绑定不能影响路线', () => {
  const state=emptySanctumState()
  state.runObservation={...parseResourceRegions({mapResourcesRegion:moduleRead('30/300','12')},floor)}
  const current={...floor,rooms:[],edges:[],revision:1,runObservation:parseResourceRegions({},floor)}
  const accepted=acceptSanctumFloor(state,current)
  assert.equal(accepted.runObservation.resolve,null)
  assert.equal(accepted.runObservation.inspiration,null)
  current.runObservation={...state.runObservation,key:'other-position'}
  assert.equal(acceptSanctumFloor(state,current).runObservation,null)
})

test('双布局标签解析支持移动、金币后缀与经确认的零启迪', () => {
  const value=parseResourceRegions({coinsRegion:coin('275(+0)'),mapResourcesRegion:moduleRead('196 / 200','12')},floor)
  assert.deepEqual([value.coins,value.resolve,value.maxResolve,value.inspiration],[275,196,200,12])
  assert.equal(parseResourceRegions({coinsRegion:coin('1,234')},floor).coins,1234)
  assert.equal(parseResourceRegions({mapResourcesRegion:moduleRead('196/200',undefined,true)},floor).inspiration,0)
  const hud={...coin('270(+0)'),texts:['坚毅416/418','270(+0)']}
  assert.equal(parseResourceRegions({hudResourcesRegion:hud},floor).resolve,416)
  assert.equal(parseResourceRegions({hudResourcesRegion:hud},floor).coins,270)
})

test('缺失、失败、截断、冲突和非法数字保持未知，不恢复旧值', () => {
  for (const sample of [undefined,coin(''),coin('10 20'),coin('275其他内容'),coin('1,23'),coin('-1'),coin('1e3'),coin('1000000001'),{...coin('10'),status:'partial'},{...coin('10'),reason:'失败'}]) {
    const value=parseResourceRegions({coinsRegion:sample,mapResourcesRegion:moduleRead('201/200')},floor)
    assert.deepEqual([value.coins,value.resolve,value.maxResolve,value.inspiration],[null,null,null,null])
  }
  assert.equal(parseResourceRegions({mapResourcesRegion:moduleRead('196/200')},floor).inspiration,null)
  assert.equal(parseResourceRegions({mapResourcesRegion:moduleRead('196/200','?',true)},floor).inspiration,null)
  assert.equal(parseResourceRegions({mapResourcesRegion:read('坚毅196/200','坚毅190/200')},floor).resolve,null)
  assert.equal(parseResourceRegions({hudResourcesRegion:read('5','40','1000')},floor).coins,null)
})

test('v1 至 v5 保留地图金币及无关配置，旧小框不拼接，新区域持久化', () => {
  const environment={width:1920,height:1080,dpi:96}, region={x:10,y:20,width:80,height:30}
  const capture={environment,region,png:'iVBORw0KGgoAAA='}
  for (const version of [1,2,3,4,5]) {
    const value=liveProfile({version,environment,mapRegion:region,effectIconsRegion:region,coinsRegion:region,
      resourcesRegion:{invalid:true},resolveRegion:{invalid:true},inspirationRegion:{invalid:true},rewardPanelRegion:{invalid:true},
      captures:{mapRegion:capture,coinsRegion:capture,resolveRegion:{invalid:true},resourcesRegion:{invalid:true}}})
    assert.equal(value.version,6)
    assert.deepEqual(value.mapRegion,region)
    assert.deepEqual(value.effectIconsRegion,region)
    assert.deepEqual(value.coinsRegion,region)
    assert.deepEqual(Object.keys(value.captures),['mapRegion','coinsRegion'])
    assert.equal(value.mapResourcesRegion,undefined)
    assert.equal(value.resolveRegion,undefined)
  }
  const value=liveProfile({version:6,environment,coinsRegion:region,mapResourcesRegion:region,hudResourcesRegion:region,
    captures:{coinsRegion:capture,mapResourcesRegion:capture,hudResourcesRegion:capture}})
  assert.deepEqual(liveProfile(JSON.parse(JSON.stringify(value))),value)
})

test('原生按布局从同一帧裁剪，独立布局无需锚点，缺项越界遮挡及未预检拒绝', () => {
  const result=runPython(`
import sys,json,base64,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
s=NativeSession.__new__(NativeSession);s.expected={}
frames=[]
im=np.arange(300*200*3,dtype=np.uint8).reshape((200,300,3))
def image():
 frames.append(1);return im,{'environment':{'width':300,'height':200}}
s.image=image
def layout(opts,snapshot=None):
 return {'mapOpen':True}
s.interface_state=layout
regions={'coinsRegion':dict(x=220,y=10,width=40,height=20),'mapResourcesRegion':dict(x=210,y=140,width=70,height=50)}
value=s.dispatch('readRunPanel',regions)
assert len(frames)==1
for key,r in regions.items():
 decoded=cv2.imdecode(np.frombuffer(base64.b64decode(value['regions'][key]['png']),np.uint8),cv2.IMREAD_COLOR)
 assert np.array_equal(decoded,im[r['y']:r['y']+r['height'],r['x']:r['x']+r['width']])
assert list(s.dispatch('readRunPanel',{'coinsRegion':regions['coinsRegion']})['regions'])==['coinsRegion']
s.interface_state=lambda opts,snapshot=None:{'mapOpen':False}
hud=dict(x=40,y=120,width=240,height=60)
value=s.dispatch('readRunPanel',{**regions,'hudResourcesRegion':hud})
assert value['resourceLayout']=='standalone'
assert list(value['regions'])==['hudResourcesRegion']
rejected=[]
for case in ['empty','bounds','mask','title','unarmed']:
 opts=regions.copy();s.capture_masks=[];s.expected={};s.interface_state=layout
 if case=='empty':opts={}
 if case=='bounds':opts['coinsRegion']=dict(x=299,y=10,width=40,height=20)
 if case=='mask':s.capture_masks=[(220,10,40,20)]
 if case=='title':s.interface_state=lambda opts,snapshot=None:{'mapOpen':False}
 if case=='unarmed':s.expected=None
 try:
  value=s.dispatch('readRunPanel',opts)
  if case in ('bounds','mask'):
   assert value['regions']['coinsRegion']['status']=='unknown'
   assert value['regions']['mapResourcesRegion']['status']=='located'
   rejected.append(case)
 except NativeError:rejected.append(case)
print(json.dumps(rejected))`)
  assert.deepEqual(result,['empty','bounds','mask','title','unarmed'])
})

test('资源驱动一次截图，单块 OCR 失败保持未知，切区和停止拒绝迟到结果', async t => {
  for (const mode of ['ok','ocr-failed','area-changed','stopped']) {
    const log=sanctumLogEvents(),controller=new AbortController(),calls=[]
    const environment={width:1000,height:800,dpi:96,processId:123}
    const region={x:10,y:20,width:80,height:30}
    const context=new SanctumLogContext(log.events,123,()=>{})
    const current={...floor,logContextKey:context.key};context.close()
    const driver=new SanctumLiveDriver({clientEvents:log.events,
      detection:{getTitleConfig:()=>({templates:{'sanctum-map':{}},threshold:.8})},
      makeClient:()=>({shutdown:async()=>{},abort(){},async request(command){
        calls.push(command)
        if(command==='environment'||command==='arm') return {environment}
        assert.equal(command,'readRunPanel')
        return {environment,regions:{coinsRegion:{...coin('275'),region},mapResourcesRegion:{...moduleRead('196/200'),region}}}
      }})})
    t.after(()=>driver.close())
    driver.recognizeCaptured=async value=>{
      if(value.texts[0]==='275') {
        if(mode==='ocr-failed') throw new Error('OCR 失败')
        if(mode==='area-changed') log.enter({seed:'changed'})
        if(mode==='stopped') controller.abort(new Error('停止'))
      }
      return value
    }
    const work=driver.readRunPanel({version:5,environment,coinsRegion:region,mapResourcesRegion:region},current,'resources',controller.signal)
    if(['area-changed','stopped'].includes(mode)) await assert.rejects(work)
    else {
      const value=await work
      assert.equal(value.coins,mode==='ok'?275:null)
      assert.equal(value.resolve,196)
      assert.equal(value.maxResolve,200)
      assert.equal(value.inspiration,null)
    }
    assert.equal(calls.filter(command=>command==='readRunPanel').length,1)
  }
})
})()

// === Merged from sanctumRewardCards.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const fs = _m6_fs
  const os = _m6_os
  const path = _m6_path
  const runPython = _m6_runPython
  const parseSanctumRoomTexts = _m6_parseSanctumRoomTexts
  const SanctumLiveDriver = _m6_SanctumLiveDriver
  const roomCardSummary = _m6_roomCardSummary
  const rewardDetail = _m6_rewardDetail
  const SanctumRepository = _m6_SanctumRepository
  const emptySanctumState = _m6_emptySanctumState
  const rewardReadingGaps = _m6_rewardReadingGaps
test('两组用户截图原尺寸与125%保留三个选项，空白与装饰不产生通货', () => {
  const result = runPython(`
import sys,json,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import load_image
from sanctum_rewards import recognize_currency_icons,templates
results=[]
for name in ['reward-alchemy-chaos','reward-fusing-binding-jewellers']:
 image=load_image('test/fixtures/sanctum/'+name+'.png')
 for scale in [1,1.25]:
  panel=cv2.resize(image,None,fx=scale,fy=scale,interpolation=cv2.INTER_CUBIC) if scale!=1 else image
  results.append(recognize_currency_icons(panel))
negative=recognize_currency_icons(image[:55])
blank=recognize_currency_icons(np.full((90,300,3),35,np.uint8))
print(json.dumps({'results':results,'negative':negative,'blank':blank,'count':len(templates())}))`)
  const expected = [['点金石','点金石','混沌石'],['链结石','高阶点金石','工匠石']]
  result.results.forEach((icons,index) => {
    assert.deepEqual(icons.map(i=>i.currency), expected[Math.floor(index/2)])
    assert.ok(icons.every(i=>i.confidence>=.94))
    const room=parseSanctumRoomTexts(['完成后提供物品'],{entries:[]},icons)
    assert.equal(room.detailsStatus,'matched')
    assert.equal(room.failureReason,null)
    assert.equal(room.calculationStatus,'supported')
    assert.deepEqual(room.rewards.map(r=>r.currency),expected[Math.floor(index/2)])
    assert.equal(new Set(room.rewards.map(r=>r.offerId)).size,3)
    assert.ok(room.rewards.every(r=>r.quantity===null && r.quantityStatus==='not-shown' && r.region))
    assert.equal(rewardReadingGaps({...room,id:'0:0'}).length,0)
  })
  assert.equal(result.count,35)
  assert.deepEqual(result.negative,[])
  assert.deepEqual(result.blank,[])
})

test('卡片序号恒定，内容替换状态，数量未展示与可见数值分开', () => {
  for (const [detailsStatus,label] of [['queued','等待识别'],['reading','读取中'],['failed','读取失败']]) {
    assert.equal(roomCardSummary({id:'2:1',detailsStatus}),`2:1 · ${label}`)
  }
  assert.equal(roomCardSummary({id:'1:1',detailsStatus:'matched',recognition:{matches:[{descriptions:['恢复 50 坚毅']},{descriptions:['恢复 50 坚毅']}]}}),'1:1 · 恢复 50 坚毅')
  assert.equal(roomCardSummary({id:'0:0',rewards:[{currency:'点金石'},{currency:'点金石'},{currency:'混沌石'}]}),'0:0 · 点金石 / 点金石 / 混沌石')
  assert.equal(rewardDetail({currency:'混沌石',quantity:null}),'混沌石 · 具体数量通过房间后确认')
  assert.equal(rewardDetail({currency:'混沌石',quantity:2,timing:'immediate'}),'混沌石 × 2 · 立即领取')
  const incomplete=parseSanctumRoomTexts(['完成后提供物品'],{entries:[]})
  assert.equal(incomplete.detailsStatus,'partial')
  assert.equal(incomplete.failureReason,'奖励图标尚未识别')
  assert.equal(incomplete.knowledge.rewards.status,'failed')
  assert.equal(rewardDetail({currency:'混沌石',quantity:null,quantityStatus:'failed'}),'混沌石 · 数量读取失败')
})

test('同名文字与图标只凭位置合并，独立选项保留未知数量',()=>{
  const icons=[{currency:'混沌石',confidence:.98,region:{x:5,y:20,width:25,height:25}},
    {currency:'混沌石',confidence:.98,region:{x:90,y:70,width:25,height:25}}]
  const room=parseSanctumRoomTexts(['立即获得 2 混沌石'],{entries:[{kind:'reward',name:'混沌石'}]},icons,
    {ocrLines:[{text:'立即获得 2 混沌石',region:{x:30,y:22,width:160,height:20}}]})
  assert.equal(room.rewards.length,2)
  assert.equal(room.rewards[0].quantity,2)
  assert.equal(room.rewards[1].quantity,null)
  assert.deepEqual(room.rewards[1].region,icons[1].region)
})

test('文字先提交、图标后补及重新读取整体替换，不保留旧警告或重复合并',async()=>{
  let kinds=['点金石','点金石','混沌石']
  const driver=new SanctumLiveDriver({catalog:{entries:[]},makeClient:()=>({async request(command,input){
    return input.iconsOnly ? {currencyIcons:kinds.map((currency,x)=>({currency,confidence:.98,region:{x:x*30,y:30,width:25,height:25}})),captureMetrics:{iconsMs:1}}
      : {texts:['完成后提供物品'],hasCurrencyOffer:true,status:'located',captureMetrics:{ocrCalls:1}}
  },shutdown:async()=>{}})})
  driver.assertLog=()=>({floorId:'f'});driver.profile={};driver.runId='r'
  driver.client={sessionId:'s',request:async()=>({png:'fixture',region:{x:10,y:20,width:150,height:80},status:'located'}),shutdown:async()=>{}}
  try {
    const read=async()=>{
      const captured=await driver.captureRoom({id:'a'},{signal:new AbortController().signal,guard:()=>{}})
      const text=await captured.recognition
      assert.equal(text.patch.readStages.icons,'queued')
      return (await captured.supplement()).patch
    }
    const patch=await read()
    assert.equal(patch.failureReason,null)
    assert.equal(patch.readStages.icons,'matched')
    assert.equal(patch.rewards.length,3)
    const directory=fs.mkdtempSync(path.join(os.tmpdir(),'sanctum-reward-test-'))
    try {
      const repo=new SanctumRepository(directory),state=emptySanctumState()
      state.floor={rooms:[{id:'a',...patch}],edges:[]}
      repo.save(state)
      assert.deepEqual(repo.load().floor.rooms[0].rewards,patch.rewards)
    } finally {fs.rmSync(directory,{recursive:true,force:true})}
    kinds=['工匠石']
    assert.deepEqual((await read()).rewards.map(r=>r.currency),['工匠石'])
  } finally {await driver.close()}
})
})()

// === Merged from sanctumRewardTooltipLocation.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const fs = _m7_fs
  const runPython = _m7_runPython
  const parseStatusTooltip = _m7_parseStatusTooltip
  const SanctumLiveDriver = _m7_SanctumLiveDriver
  const effectReadIssues = _m7_effectReadIssues
  const observationKey = _m7_observationKey
const catalog=JSON.parse(fs.readFileSync('electron/assets/sanctum/catalog.json','utf8'))

test('奖励真实局部图与背景组合：四种宽度完整同源裁剪，拒绝实际错误背景区域',()=>{
  const results=runPython(`
import sys,json,cv2,numpy as np,base64
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import load_image
from sanctum_tooltip import locate_content,changed_panel_boundary
from sanctum_postprocess import process_image
from sanctum_ocr import create_sanctum_ocr_engine,read_frozen
reward=load_image('test/fixtures/sanctum/status-rewards-two-rows.png')
bad=load_image('test/fixtures/sanctum/status-rewards-wrong-crop.png')
# Composite replay, not the lost live baseline/frame. Static map cards attach
# to the top of the tooltip's dark contour, reproducing a contour-only trap.
base=np.full((2054,3840,3),110,np.uint8)
base[1093:1242,1530:1869]=bad
frame=base.copy();frame[1235:1442,1300:1963]=reward
wrong=dict(x=1530,y=1093,width=339,height=149)
assert not changed_panel_boundary(base,frame,wrong)
assert not locate_content(base,base,(1650,1480)).get('region')
engine=create_sanctum_ocr_engine();out=[]
for width in [1920,2560,3072,3840]:
 scale=width/3840
 b=cv2.resize(base,None,fx=scale,fy=scale,interpolation=cv2.INTER_AREA)
 f=cv2.resize(frame,None,fx=scale,fy=scale,interpolation=cv2.INTER_AREA)
 events=[]
 result=process_image(b,f,dict(mode='effects',point=(1650*scale,1480*scale),frameId=1),events.append)
 assert result['status']=='located',result
 r=result['region'];x,y,w,h=(r[k] for k in ('x','y','width','height'))
 # Bound the whole body (pixel rounding tolerance), not just the text island.
 assert abs(x/scale-1300)<5 and abs(y/scale-1235)<5,r
 assert abs(w/scale-663)<6 and abs(h/scale-207)<6,r
 assert len(events)==1 and events[0]['png']==result['png']
 crop=cv2.imdecode(np.frombuffer(base64.b64decode(result['png']),np.uint8),cv2.IMREAD_COLOR)
 assert np.array_equal(crop,f[y:y+h,x:x+w])
 read=read_frozen(dict(png=result['png'],region=events[0]['region'],room=False,includeIcons=False),engine)
 assert read['captureMetrics']['ocrCalls']==1 and read['captureMetrics']['iconCalls']==0
 out.append(read)
print(json.dumps(out))`)
  for(const read of results) {
    const parsed=parseStatusTooltip(read,catalog)
    assert.equal(parsed.effectGroup,null)
    assert.equal(parsed.hasRewardContext,true)
  }
})

test('原尺寸小候选不阻断完整标准尺度候选；独立冲突保持失败',()=>{
  const results=runPython(`
import sys,json,numpy as np
from unittest.mock import patch
sys.path.insert(0,'src/assets/scripts')
from sanctum_tooltip import locate_content
base=np.full((1645,3072,3),150,np.uint8);frame=np.full_like(base,20)
full={'status':'located','region':dict(x=500,y=400,width=250,height=100)}
out=[]
for small in [dict(x=850,y=665,width=100,height=50),dict(x=1500,y=600,width=250,height=100)]:
 with patch('sanctum_tooltip.locate_tooltip',side_effect=[{'status':'located','region':small},full]) as locator:
  out.append(locate_content(base,frame,(1000,900)))
  assert locator.call_count==2
print(json.dumps(out))`)
  assert.deepEqual(results[0].region,{x:800,y:640,width:400,height:161})
  assert.equal(results[1].status,'unknown')
  assert.match(results[1].reason,/多个候选/)
})

test('三行奖励面板在静态真实背景中的多尺度边界保持完整',()=>{
  const regions=runPython(`
import sys,json,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import load_image
from sanctum_tooltip import locate_content
im=load_image('test/fixtures/sanctum/status-pending-rewards.png')
frame=np.full((2054,3840,3),110,np.uint8)
frame[800:1247,1200:2037]=im
# The background outside the real panel is unchanged; only the occluded
# baseline under the panel is reconstructed for this composite replay.
base=frame.copy();base[849:1133,1276:1933]=110
out=[]
for width in [1920,2560,3072,3840]:
 scale=width/3840
 b=cv2.resize(base,None,fx=scale,fy=scale,interpolation=cv2.INTER_AREA)
 f=cv2.resize(frame,None,fx=scale,fy=scale,interpolation=cv2.INTER_AREA)
 result=locate_content(b,f,(1685*scale,1180*scale))
 assert result['status']=='located',result
 r=result['region']
 assert abs(r['x']/scale-1276)<6 and abs(r['y']/scale-849)<6,r
 assert abs(r['width']/scale-657)<8 and abs(r['height']/scale-284)<8,r
 out.append(r)
print(json.dumps(out))`)
  assert.equal(regions.length,4)
})

test('奖励重采替换旧浮窗失败，分类不依赖序号，不生成账本',async t=>{
  let texts=[]
  const driver=new SanctumLiveDriver({catalog,makeClient:()=>({sessionId:'s',async shutdown(){},async request(command){
    if(command==='interfaceState')return {mapOpen:true,hudLayout:'map'}
    if(command==='inspectEffects')return {coverageConfirmed:true,icons:[{x:1,y:1}]}
    if(command==='hoverEffect')return {status:'located',texts}
  }})})
  await driver.open();t.after(()=>driver.close())
  driver.assertLog=()=>({floorId:'f'});driver.logContext={context:{},close(){}}
  driver.profile={environment:{},interfaceTitles:{'sanctum-map-hud':{}},mapEffectIconsRegion:{}}
  const base={identityConfirmed:true,runId:'batch',sanctumRunId:'run',floorId:'f',mapKey:'m',currentRoomId:'1:1',positionStatus:'confirmed',revision:1,rooms:[],edges:[]}
  const failed=await driver.finalizeFloor(base,new AbortController().signal)
  assert.equal(effectReadIssues(failed.effectScan).length,1)
  texts=['完成禁域时获得 60×工匠石','完成禁域时获得 30×改造石']
  driver.resetEffects() // Explicit re-read invalidates the same-position cache.
  const read=await driver.finalizeFloor(base,new AbortController().signal)
  assert.deepEqual(effectReadIssues(read.effectScan),[])
  assert.equal(read.effectScan.targets[0].contentKind,'reward')
  assert.equal(read.effectScan.effectsComplete,true)
  read.effectScan.binding=observationKey(read)
  assert.equal(read.effectScan.rewardGroups,undefined)
})
})()

// === Merged from sanctumRewards.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const runPython = _m8_runPython
  const parseSanctumRoomTexts = _m8_parseSanctumRoomTexts
test('加速掩膜相关与 OpenCV 原指标一致，空白不产生无穷分数', () => {
  const result = runPython(`
import sys,json,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_rewards import masked_correlation
rng=np.random.default_rng(42); errors=[]
for h,w in [(12,18),(30,22),(44,50)]:
 gray=rng.integers(10,220,(100,160),dtype=np.uint8).astype(np.float32)
 template=gray[20:20+h,30:30+w].copy();mask=np.float32(rng.random((h,w))>.3)
 a=cv2.matchTemplate(gray,template,cv2.TM_CCOEFF_NORMED,mask=mask)
 b=masked_correlation(gray,gray*gray,template,mask)
 errors.append(float(np.max(np.abs(a-b))))
 assert np.unravel_index(np.argmax(b),b.shape)==(20,30)
blank=np.full((100,160),35,np.float32)
out=masked_correlation(blank,blank*blank,template,mask)
print(json.dumps({'errors':errors,'blank':float(np.max(np.abs(out)))}))`)
  assert.ok(result.errors.every(error => error < .0001))
  assert.equal(result.blank, 0)
})

test('真实弹框图标与文字分开识别：确认混沌石，不把背景、说明或重复图标当数量', () => {
  const result = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import load_image
from sanctum_rewards import recognize_currency_icons
im=load_image('test/fixtures/sanctum/archives-live-tooltip.png')
# The actual visible panel, independently annotated from the game screenshot.
icons=recognize_currency_icons(im[518:783,1281:2348])
blank=recognize_currency_icons(np.full((100,300,3),35,np.uint8))
print(json.dumps({'icons':icons,'blank':blank}))
`)
  // The original panel also contains chance orbs, absent from the old 13-art catalog.
  assert.deepEqual(result.icons.map(item => item.currency), ['机会石', '混沌石'])
  const icon = result.icons.find(item => item.currency === '混沌石')
  assert.ok(icon.region.x >= 550 && icon.region.x <= 590)
  assert.ok(icon.region.y >= 150 && icon.region.y <= 180)
  assert.deepEqual(result.blank, [])
  const parsed = parseSanctumRoomTexts(['完成后提供物品'], { entries: [] }, result.icons)
  assert.deepEqual(parsed.rewards.map(r => r.currency), ['机会石','混沌石'])
  assert.ok(parsed.rewards.every(r => r.quantity === null && r.quantityStatus === 'not-shown'))
  assert.equal(parsed.detailsStatus, 'matched')
  assert.equal(parsed.rewardEvidence.at(-1).currency, '混沌石')
  assert.equal(parsed.failureReason, null)
  assert.equal(parsed.rewardEvidence.at(-1).quantity, undefined)
})

test('低置信度图标不能确认为奖励；文字奖励保留原有种类数量时机', () => {
  const catalog = { entries: [{kind:'reward',name:'神圣石'}] }
  const unknown = parseSanctumRoomTexts([], catalog, [{currency:'混沌石',confidence:.89}])
  assert.deepEqual(unknown.rewardEvidence, [])
  const text = parseSanctumRoomTexts(['立即获得 2 神圣石'], catalog)
  assert.deepEqual(text.rewards, [{groupId:'offer',currency:'神圣石',quantity:2,timing:'immediate'}])
})

test('局部证据按20组轮换且不写整屏或日志上下文，旧弹框诊断不会残留', () => {
  const result = runPython(`
import sys,json,tempfile,numpy as np
from pathlib import Path
sys.path.insert(0,'src/assets/scripts')
import sanctum_diagnostics as d
from sanctum_recognition import load_image
with tempfile.TemporaryDirectory() as directory:
 d.tempfile.gettempdir=lambda:directory
 image=np.zeros((100,200,3),np.uint8)
 options={'mapRegion':{'x':20,'y':20,'width':50,'height':40},'log':'must-not-save'}
 for i in range(22):
  d.save_tooltip_evidence(i,image,image,{'status':'unknown','region':{'x':10,'y':10,'width':20,'height':20},'log':'must-not-save'},options)
 d.save_tooltip_evidence(0,image,image,{'status':'unknown'},options)
 root=Path(directory)/'poe-sanctum-diagnostics'
 print(json.dumps({'files':len(list(root.iterdir())),'shape':list(load_image(str(root/'tooltip-00-before.png')).shape),'oldPanel':(root/'tooltip-00-panel.png').exists(),'record':json.loads((root/'tooltip-00.json').read_text())}))
`)
  assert.equal(result.files, 79)
  assert.deepEqual(result.shape, [40,50,3])
  assert.equal(result.oldPanel, false)
  assert.equal(result.record.log, undefined)
})
})()

// === Merged from sanctumRoomProfiles.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const fs = _m9_fs
  const SANCTUM_ROOM_PROFILES = _m9_SANCTUM_ROOM_PROFILES
  const recognizeRoomProfile = _m9_recognizeRoomProfile
  const roomLayoutPreference = _m9_roomLayoutPreference
  const createSanctumStrategy = _m9_createSanctumStrategy
  const initialEffectState = _m9_initialEffectState
  const advanceSanctumRoom = _m9_advanceSanctumRoom
  const parseSanctumRoomTexts = _m9_parseSanctumRoomTexts
  const knownRoom = _m9_knownRoom
  const planSanctumFloor = _m9_planSanctumFloor
  const SanctumService = _m9_SanctumService
  const preservePreviousCapture = _m9_preservePreviousCapture
  const runPython = _m9_runPython
const catalog = JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json', import.meta.url)))
const parse = (name, floorId = 'floor:0', texts = ['完成后提供物品']) => parseSanctumRoomTexts(texts, catalog,
  [{ currency:'混沌石', confidence:1 }], { titleTexts:[name], floorId })
const strategy = preset => createSanctumStrategy(preset)
const node = (id, column, name, extras = {}) => ({ id,column,revealed:true,...parse(name),...extras })
const edge = (from,to) => ({ from,to,status:'matched' })
const floor = () => ({identityConfirmed:true,runId:'capture',floorId:'floor:0',mapKey:'map',revision:1,currentRoomId:'s',
  rooms:[node('s',0,'废弃图书馆'),node('a',1,'圣殿编史'),node('b',1,'废弃图书馆'),
    node('c',2,'铭文室'),node('d',2,'铭文室'),node('z',3,'烛火礼拜堂',{terminal:true})],
  edges:[edge('s','a'),edge('s','b'),edge('a','c'),edge('a','d'),edge('b','c'),edge('c','z'),edge('d','z')] })

test('四层中英目录及核实别名逐项匹配，错层不会推断', () => {
  assert.equal(SANCTUM_ROOM_PROFILES.length,24)
  for (const entry of SANCTUM_ROOM_PROFILES) {
    for (const name of [entry.name,...entry.aliases]) {
      const result=recognizeRoomProfile([name],entry.floorId)
      assert.equal(result.layout,entry.layout,name)
      assert.deepEqual(result.traps,entry.traps,name)
      assert.ok(result.roomProfile.sources.length)
    }
    assert.equal(recognizeRoomProfile([entry.name],`floor:${(Number(entry.floorId.at(-1))+1)%4}`).layout,undefined)
  }
  assert.equal(recognizeRoomProfile(['没核实的房间'],'floor:0').layout,undefined)
})

test('多候选只采用共同属性；有未知候选不择优猜测', () => {
  const shared=recognizeRoomProfile(['废弃图书馆、圣光试炼'],'floor:0')
  assert.equal(shared.layout,'exit')
  assert.equal(shared.traps,undefined)
  assert.equal(shared.layoutPreferenceKey,undefined)
  assert.equal(parse('废弃图书馆、圣殿编史').layout,undefined)
  assert.equal(parse('废弃图书馆、未知标题').layout,undefined)
  assert.equal(roomLayoutPreference(knownRoom(parse('废弃图书馆、圣光试炼'),{}),strategy()),0)
})

test('标题和正文独立，标题成功不确认奖励痛苦，混合文本保留标题', () => {
  const titleOnly=parseSanctumRoomTexts([],catalog,[],{titleTexts:['废弃图书馆'],floorId:'floor:0'})
  assert.equal(titleOnly.layout,'exit')
  assert.equal(titleOnly.knowledge.layout.status,'known')
  assert.equal(titleOnly.knowledge.rewards.status,'failed')
  assert.equal(titleOnly.knowledge.afflictions.status,'failed')
  assert.equal(titleOnly.detailsStatus,'failed')
  assert.equal(parse('完全未知标题').type,'reward')
  const mixed=parseSanctumRoomTexts(['废弃图书馆','包含喷泉'],catalog,[],{floorId:'floor:0'})
  assert.equal(mixed.name,'废弃图书馆')
  assert.equal(mixed.type,'fountain')
  assert.equal(mixed.layout,'exit')
})

test('隐藏、未揭示与失效历史不贡献玩法，匹配历史及手动确认可使用', () => {
  const room={...parse('废弃图书馆'),revealed:true}
  for (const effects of [{roomsHidden:true},{typesHidden:true}]) {
    const known=knownRoom(room,{mapKey:'map'},effects)
    assert.equal(known.layout,undefined);assert.equal(known.traps,undefined)
  }
  assert.equal(knownRoom({...room,revealed:false},{}).layout,undefined)
  for(const fact of Object.values(room.knowledge)) fact.mapKey='old'
  assert.equal(knownRoom(room,{mapKey:'new'}).layout,undefined)
  assert.equal(knownRoom(room,{mapKey:'old',rerolled:true}).traps,undefined)
  assert.equal(knownRoom({...room,revealed:false},{mapKey:'old'}).layout,'exit')
  room.knowledge.layout={status:'known',source:'manual'}
  assert.equal(knownRoom(room,{}, {typesHidden:true}).layout,'exit')
})

test('出口房陷阱触发风险但仍使用出口偏好；穿越陷阱独立偏好', () => {
  const exit=knownRoom(parse('废弃图书馆'),{}), gauntlet=knownRoom(parse('圣光试炼'),{})
  assert.equal(roomLayoutPreference(exit,strategy()),2)
  assert.equal(roomLayoutPreference(gauntlet,strategy()),-1)
  const previous=initialEffectState({},[{rule:'lethalTraps',status:'matched'}])
  assert.ok(advanceSanctumRoom(previous,exit).risks.includes('陷阱会结束本轮'))
  previous.effects.push({rule:'trapsDisabled',status:'matched'})
  assert.ok(!advanceSanctumRoom(previous,exit).risks.includes('陷阱会结束本轮'))
  assert.ok(advanceSanctumRoom(initialEffectState({},[{rule:'dangerousTraps'}]),{layout:'guards'}).unknown.some(x=>x.includes('不代表无陷阱')))
})

test('小首领是战斗但不触发楼层首领恢复', () => {
  const state=initialEffectState({resolve:10,maxResolve:100},[{rule:'recoveryOnBoss',value:20},{rule:'dangerousMonsters'}])
  const mini=advanceSanctumRoom(state,knownRoom(parse('墓影书坊'),{}))
  assert.equal(mini.recovery,0);assert.ok(mini.risks.length)
  assert.equal(advanceSanctumRoom(state,knownRoom(parse('烛火礼拜堂'),{})).recovery,20)
})

test('实用策略同等奖励下分别优先选择空间和房型，目标与避让仍优先', () => {
  const f=floor()
  assert.equal(planSanctumFloor(f,strategy('reveal')).paths[0].nextRoomId,'a')
  assert.equal(planSanctumFloor(f,strategy('quantity')).paths[0].nextRoomId,'b')
  assert.equal(planSanctumFloor(f,strategy('quantity'),{targets:['a']}).paths[0].nextRoomId,'a')
  assert.equal(planSanctumFloor(f,strategy('quantity'),{avoid:['b']}).paths[0].nextRoomId,'a')
  f.rooms[1].rewards=[{currency:'神圣石',quantity:1,timing:'immediate'}]
  assert.equal(planSanctumFloor(f,strategy('quantity')).paths[0].nextRoomId,'a')
  f.rooms[2].rewards=[{currency:'神圣石',quantity:1,timing:'immediate'}]
  assert.equal(planSanctumFloor(f,strategy('quantity')).paths[0].nextRoomId,'b')
})

test('下一间相同偏好时比较后续已知房间，后续隐藏不反向改写下一间', () => {
  const f=floor()
  f.rooms[1]=node('a',1,'废弃图书馆');f.rooms[3]=node('c',2,'圣光试炼');f.rooms[4]=node('d',2,'废弃图书馆')
  f.edges=[edge('s','a'),edge('s','b'),edge('a','c'),edge('b','d'),edge('c','z'),edge('d','z')]
  for(const preset of ['reveal','quantity']) assert.equal(planSanctumFloor(f,strategy(preset)).paths[0].nextRoomId,'b')
  f.rooms[4].effects=[{rule:'typesHidden',status:'matched',trigger:'completion'}]
  const path=planSanctumFloor(f,strategy()).paths.find(p=>p.nextRoomId==='b')
  assert.equal(path.breakdown[0].layoutPreference,2)
  assert.equal(path.breakdown[1].layoutPreference,2)
  assert.equal(path.breakdown[2].layout,undefined)
  assert.ok(path.reasons.some(x=>x.includes('后续已知房间偏好合计')))
})

test('人工修改玩法清理旧陷阱与来源，修改奖励保留目录属性', () => {
  const room=node('a',1,'圣光试炼')
  const service={assertEnabled(){},state:{floor:{rooms:[room]}},recalculate(){},publish(){}}
  SanctumService.prototype.correctRoom.call(service,'a',{recovery:20})
  assert.deepEqual(room.traps,['lightning-floor'])
  SanctumService.prototype.correctRoom.call(service,'a',{layout:'miniboss'})
  assert.equal(room.traps,undefined);assert.equal(room.roomProfile,undefined)
  assert.equal(roomLayoutPreference(knownRoom(room,{}),strategy()),0)
  SanctumService.prototype.correctRoom.call(service,'a',{name:'未知房间'})
  assert.equal(room.layout,undefined)
})

test('重新采集失败只展示旧玩法，不把上一张结果用于推荐', () => {
  const previous=floor();previous.rooms[1].recognition.evidenceId='old'
  const next=floor();next.rooms[1]={id:'a',column:1,detailsStatus:'failed'}
  preservePreviousCapture(next,previous)
  assert.equal(next.rooms[1].previousCapture.result.layout,'arena')
  assert.equal(knownRoom(next.rooms[1],next).layout,undefined)
})

test('真实房间图片一次OCR分离标题和正文，原标题可供复核', () => {
  const result=runPython(`
import sys,json,base64
from pathlib import Path
sys.path.insert(0,'src/assets/scripts')
from sanctum_ocr import read_frozen,create_sanctum_ocr_engine
from sanctum_recognition import load_image
p=Path('test/fixtures/sanctum/ocr-pact.png');im=load_image(p)
r=read_frozen({'png':base64.b64encode(p.read_bytes()).decode(),'region':dict(x=0,y=0,width=im.shape[1],height=im.shape[0]),'includeIcons':False},create_sanctum_ocr_engine())
print(json.dumps(r,ensure_ascii=False))
`,{timeout:60000})
  assert.ok(result.titleTexts.length)
  assert.deepEqual(result.texts,['包含遭诅契约'])
  assert.equal(result.captureMetrics.ocrCalls,1)
  assert.equal(result.titleRegion.height,result.bodyRegion.y)
  const parsed=parseSanctumRoomTexts(result.texts,catalog,[],{...result,floorId:'floor:0'})
  assert.equal(parsed.layout,'guards')
  assert.equal(parsed.nameCandidates.includes('0'),false)
})

test('实机四层合并标题仅在包含当前层时采用共同属性', () => {
  for(const floorId of ['floor:0','floor:1','floor:2','floor:3']) {
    assert.equal(parse('破旧书库、圣物厅、禁域战场、王陵',floorId).layout,'miniboss')
    assert.equal(parse('遗弃的图书馆、破旧的地窖、礼拜堂、地下室',floorId).layout,'exit')
  }
  assert.equal(parse('破旧书库、圣物厅','floor:3').layout,undefined)
  assert.equal(parse('破旧书库、地下室','floor:0').layout,undefined)
})
})()

// === Merged from sanctumRoomReading.test.js ===
await (async () => {
  const test = _m10_test
  const assert = _m10_assert
  const runPython = _m10_runPython
  const roomExclusions = _m10_roomExclusions
test('用户实图只保留五个未打、有内容的可达房间，灰白图标并非空白', () => {
  const floor = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import analyze_floor,load_image
print(json.dumps(analyze_floor(load_image('test/fixtures/sanctum/archives-filter.png'))))`)
  const excluded = roomExclusions(floor)
  assert.equal(floor.rooms.length, 30)
  assert.equal(floor.currentRoomId, '2:1')
  assert.deepEqual(floor.rooms.filter(r => !excluded.has(r.id)).map(r => r.id), ['3:2','3:3','4:0','4:1','7:0'])
  assert.deepEqual(floor.rooms.filter(r => r.contentStatus === 'present').map(r => r.id), ['0:0','1:2','2:1','3:2','3:3','4:0','4:1','7:0'])
})

test('红边阻断向后传播，未知边、漏检、遮挡保留，初始与进度未知不猜已打', () => {
  const rooms = ['a','b','c','d','e','f'].map((id, column) => ({ id, column, contentStatus:'present' }))
  const edge = (from,to,extra={}) => ({ from,to,status:'matched',traversal:'available',availability:'gold',...extra })
  const floor = { rooms, currentRoomId:'a', positionStatus:'confirmed', edges:[edge('a','b',{availability:'unavailable'}),edge('b','c'),edge('a','d',{status:'unknown'}),edge('d','e')] }
  assert.deepEqual([...roomExclusions(floor)], [['a','completed'],['b','unreachable'],['c','unreachable']])
  floor.edges.push(edge('a','b',{status:'unknown'}))
  assert.deepEqual([...roomExclusions(floor)], [['a','completed']])
  floor.edges.pop(); floor.edges[0].occluded = true
  assert.deepEqual([...roomExclusions(floor)], [['a','completed']])
  floor.positionStatus = 'unknown'
  assert.equal(roomExclusions(floor).size, 0)
  floor.initialSelection = true; floor.startRoomIds = ['a']
  assert.equal(roomExclusions(floor).has('a'), false)
  rooms[3].contentStatus = 'empty'
  assert.equal(roomExclusions(floor).get('d'), 'empty')
  rooms[3].occluded = true
  assert.equal(roomExclusions(floor).has('d'), false)
})

test('内容判定排除边框，保留灰图标、弱证据及遮挡；正文范围不随文字密度截短', () => {
  const result = runPython(`
import sys,json,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import room_content_status,load_image
from sanctum_tooltip import locate_content
r={'x':20,'y':20,'width':100,'height':160}; a=np.full((220,160,3),20,np.uint8)
cv2.rectangle(a,(20,20),(120,180),(220,20,220),8)
states=[room_content_status(a,r)]
cv2.rectangle(a,(50,65),(80,105),(150,150,150),-1)
states.append(room_content_status(a,r));states.append(room_content_status(a,{**r,'occluded':True}))
states.append(room_content_status(np.full_like(a,60),r))
regions=[]
for y in [100,500]:
 base=np.full((800,1000,3),150,np.uint8);im=base.copy()
 cv2.rectangle(im,(200,y),(600,min(799,y+230)),(20,20,20),-1)
 cv2.line(im,(200,y),(600,y),(240,240,240),2);cv2.line(im,(200,y+50),(600,y+50),(240,240,240),2)
 cv2.putText(im,'Room',(280,y+35),cv2.FONT_HERSHEY_SIMPLEX,1,(230,230,230),2)
 for row in range(y+70,min(790,y+220),24):cv2.putText(im,'Dense text '*3,(215,row),cv2.FONT_HERSHEY_SIMPLEX,.6,(230,230,230),2)
 regions.append(locate_content(base,im,(400,y+240),room=True))
print(json.dumps({'states':states,'regions':regions}))`)
  assert.deepEqual(result.states, ['empty','present','unknown','unknown'])
  assert.equal(result.regions[0].status, 'located')
  assert.ok(result.regions[0].region.height >= 220 && result.regions[0].region.height < 250)
  assert.equal(result.regions[1].status, 'located')
  assert.ok(result.regions[1].region.y+result.regions[1].region.height < 750)
})

test('真实半透明房间按正文结束位置裁剪', () => {
  const result = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import load_image
from sanctum_tooltip import locate_content
base=load_image('test/fixtures/sanctum/archives-live-map.png')
full=load_image('test/fixtures/sanctum/archives-live-tooltip.png')
view=full[270:270+base.shape[0],917:917+base.shape[1]]
print(json.dumps(locate_content(base,view,(673,655),room=True)))`)
  assert.ok(result.region)
  assert.ok(result.region.width >= 1060 && result.region.width <= 1080)
  assert.ok(result.region.height > 150 && result.region.height < result.region.width)
  assert.equal(result.status, 'located')
})

test('每个房间只截图一次，标题遮挡不停止，定位失败不补图；取消不输入', () => {
  const result = runPython(`
import sys,json,cv2,numpy as np,types
sys.path.insert(0,'src/assets/scripts')
import sanctum_native as native
native.emit=lambda *a:None
from sanctum_frames import FramePool
from sanctum_postprocess import process_image
import sanctum_postprocess as post
post.save_tooltip_evidence=lambda *a:None
base=np.full((800,1000,3),150,np.uint8); panel=base.copy()
cv2.rectangle(panel,(100,100),(340,260),(20,20,20),-1)
cv2.putText(panel,'Room',(130,160),cv2.FONT_HERSHEY_SIMPLEX,1,(220,220,220),2)
out=[]
for case in ['first','missing','cancel','occluded','occluded-next']:
 s=native.NativeSession.__new__(native.NativeSession);s.expected={};s.tooltip_baseline=base
 counts={'images':0,'ocr':0,'moves':0,'titles':0}; frozen=[]
 s.cancelled=types.SimpleNamespace(wait=lambda duration:case=='cancel')
 def check():
  if case=='cancel':raise native.NativeError('采集已停止')
  return {'clientBounds':{'x':0,'y':0}}
 s.check=check
 def validate(*a):
  counts['titles']+=1
  raise native.NativeError('圣所界面已关闭或变化')
 s.validate_surface=validate
 s.move_cursor=lambda *a:counts.update(moves=counts['moves']+1)
 s.progress=lambda *a,**kw:None
 pool=FramePool(1000,800)
 s.baseline_version=1
 pool.view(0)[:]=base
 options={'frozen':{'pool':pool.spec,'slot':1,'baselineSlot':0,'baselineVersion':1,'frameId':1}}
 def read():
  captured=s.read_tooltip(options,(200,280),'map')
  return process_image(pool.view(0),pool.view(1),{**captured['frozenFrame'],'captureMetrics':captured['captureMetrics']},frozen.append)
 def image():
  counts['images']+=1
  return (base if case=='missing' else panel),{}
 s.image=image
 def ocr(*args):
  counts['ocr']+=1
  if case=='ocr-error':raise ValueError('test')
  return ['Room']
 s.ocr=ocr
 try:
  if case=='occluded-next':read()
  e=read();out.append({'case':case,'status':e['status'],**counts,'frozen':len(frozen),'titleMs':e['captureMetrics']['titleMs']})
 except native.NativeError:out.append({'case':case,'status':'stopped',**counts})
print(json.dumps(out))`)
  assert.deepEqual(result.map(r => [r.images,r.ocr,r.moves]), [[1,0,1],[1,0,1],[0,0,0],[1,0,1],[2,0,2]])
  assert.ok(result.every(r => r.titles === 0))
  assert.ok(result.filter(r => r.status !== 'stopped').every(r => r.titleMs === 0))
  assert.equal(result[0].status, 'located')
  assert.equal(result[1].status, 'unknown')
  assert.equal(result[2].status, 'stopped')
  assert.equal(result[3].status, 'located')
  assert.equal(result[4].status, 'located')
})
})()

// === Merged from sanctumSpeed.test.js ===
await (async () => {
  const test = _m11_test
  const assert = _m11_assert
  const SanctumImageCapacity = _m11_SanctumImageCapacity
  const SanctumLiveDriver = _m11_SanctumLiveDriver
  const matchRoomText = _m11_matchRoomText
  const recognizeRoomTexts = _m11_recognizeRoomTexts
  const runPython = _m11_runPython
const deferred = () => { let resolve, reject; const promise=new Promise((a,b)=>{resolve=a;reject=b}); return {promise,resolve,reject} }
const tick = () => new Promise(resolve=>setImmediate(resolve))

test('图片容量同时限制字节和数量；取消、关闭唤醒等待，重复释放不扣成负数', async()=>{
  const c=new SanctumImageCapacity({count:2,bytes:10}), signal=new AbortController().signal
  const release=await c.acquire(8,signal), abort=new AbortController()
  const waiting=c.acquire(3,abort.signal); abort.abort(); await assert.rejects(waiting)
  assert.equal(c.count,1);assert.equal(c.bytes,8)
  const next=c.acquire(4,signal);release();release();const releaseNext=await next
  assert.equal(c.bytes,4)
  const stopped=c.acquire(7,signal);c.close();await assert.rejects(stopped,/关闭/)
  releaseNext();assert.equal(c.bytes,0);assert.equal(c.count,0)
})

test('图标阻塞时下一房文字仍完成，图像引用沿用身份且最终释放', async()=>{
  const gate=deferred(), commands=[]
  const driver=new SanctumLiveDriver({catalog:{entries:[]},makeClient:()=>({closed:false,
    async request(command,input){
      commands.push({command,input})
      if(command!=='readFrozen')return {}
      if(input.iconsOnly){await gate.promise;return {currencyIcons:[],captureMetrics:{iconsMs:3}}}
      return {texts:['完成后提供物品'],hasCurrencyOffer:true,imageRef:{pool:{name:input.binding.roomId},binding:input.binding},captureMetrics:{ocrCalls:1}}
    },shutdown:async()=>{}})})
  const signal=new AbortController().signal
  driver.assertLog=()=>({floorId:'f'});driver.profile={};driver.runId='r'
  driver.client={sessionId:'s',request:async()=>({png:'encoded',region:{x:3,y:4,width:20,height:30},status:'located'}),shutdown:async()=>{}}
  const a=await driver.captureRoom({id:'a'},{signal,guard:()=>{}});await a.recognition
  const b=await driver.captureRoom({id:'b'},{signal,guard:()=>{}});await b.recognition;await tick()
  assert.equal(commands.filter(c=>c.command==='readFrozen'&&!c.input.iconsOnly).length,2)
  const icon=commands.find(c=>c.input?.iconsOnly)
  assert.equal(icon.input.png,undefined);assert.deepEqual(icon.input.binding,icon.input.imageRef.binding)
  assert.equal(driver.imageCapacity.count,2)
  const c=await driver.captureRoom({id:'c'},{signal,guard:()=>{}})
  await c.recognition
  assert.equal(driver.imageCapacity.count,3)
  assert.equal(driver.queuedImages.bytes,0)
  gate.resolve();await a.supplement();await b.supplement();await c.supplement()
  assert.equal(driver.imageCapacity.count,0)
  assert.equal(driver.queuedImages.bytes,0)
  assert.equal(commands.filter(c=>c.command==='releaseImage').length,3)
  await driver.close()
})

test('词库原地修改及同分排序不会命中旧预处理，独立相同词缀不丢失',()=>{
  const catalog={entries:[{id:'b',kind:'affliction',name:'相同'},{id:'a',kind:'affliction',name:'相同'}]}
  assert.equal(matchRoomText('相同',catalog).entryId,'a')
  catalog.entries[1].name='变化'
  assert.equal(matchRoomText('相同',catalog).entryId,'b')
  assert.equal(recognizeRoomTexts(['相同','相同'],catalog).matches.length,2)
})

for (const mode of ['abort','malformed']) test(`文字响应 ${mode} 不会等待自身队列，保留的图片容量最终归零`,async()=>{
  const gate=deferred(), entered=deferred(), abort=new AbortController()
  const binding={sessionId:'s',runId:'r',floorId:'f',roomId:'a',frameId:1}
  const driver=new SanctumLiveDriver({catalog:{entries:[]},makeClient:()=>({closed:false,
    async request(command){if(command==='readFrozen'){entered.resolve();return gate.promise}return {}},shutdown:async()=>{}})})
  driver.assertLog=()=>({floorId:'f'})
  const task=driver.recognizeCaptured({png:'fixture',region:{x:0,y:0,width:30,height:20}},abort.signal,false,{retainImage:true,binding})
  await entered.promise;if(mode==='abort')abort.abort()
  gate.resolve({imageRef:{pool:{name:'a'},binding},ocrBlocks:mode==='malformed'?{}:[],captureMetrics:{}})
  await assert.rejects(task);await driver.ocrTail
  assert.equal(driver.imageCapacity.count,0)
  await driver.close()
})

test('图标工作进程超时保留文字并释放帧，下一目标使用新进程',async()=>{
  let iconReads=0, iconStarts=0, released=0
  const driver=new SanctumLiveDriver({catalog:{entries:[]},makeClient:()=>({closed:false,
    async request(command,input){
      if(command==='prepareIcons'){iconStarts++;return {}}
      if(command==='releaseImage'){released++;return {}}
      if(command!=='readFrozen')return {}
      if(input.iconsOnly){if(++iconReads===1)throw Object.assign(new Error('timeout'),{code:'STEP_TIMEOUT'});return {currencyIcons:[],captureMetrics:{iconsMs:1}}}
      return {texts:['完成后提供物品'],hasCurrencyOffer:true,imageRef:{pool:{name:input.binding.roomId},binding:input.binding},captureMetrics:{ocrCalls:1}}
    },shutdown:async()=>{}})})
  const signal=new AbortController().signal
  driver.assertLog=()=>({floorId:'f'});driver.profile={};driver.runId='r'
  driver.client={sessionId:'s',request:async()=>({png:'fixture',region:{x:0,y:0,width:20,height:30},status:'located'}),shutdown:async()=>{}}
  const a=await driver.captureRoom({id:'a'},{signal,guard(){}});await a.recognition
  const failed=await a.supplement()
  assert.equal(failed.patch.rawText,'完成后提供物品');assert.equal(failed.patch.readStages.icons,'timeout')
  const b=await driver.captureRoom({id:'b'},{signal,guard(){}});await b.recognition;await b.supplement()
  assert.equal(iconStarts,2);assert.equal(released,2);assert.equal(driver.imageCapacity.count,0)
  await driver.close()
})

test('跨进程图片复用不重新解码；错误身份、超容量和最后句柄释放',()=>{
  const result=runPython(`
import sys,json,base64,cv2,numpy as np,subprocess
sys.path.insert(0,'src/assets/scripts')
from sanctum_frozen_image import FrozenImages,open_image
import sanctum_ocr as o
binding=dict(sessionId='s',runId='r',floorId='f',roomId='a',frameId=1)
image=np.full((30,120,3),35,np.uint8);_,png=cv2.imencode('.png',image)
engine=lambda im:[[[[1,1],[110,1],[110,20],[1,20]],'完成后提供物品',.99]]
store=FrozenImages(count=1)
r=o.read_frozen(dict(png=base64.b64encode(png).decode(),region=dict(x=0,y=0,width=120,height=30),includeIcons=False,retainImage=True,binding=binding),engine,store)
ref=r['imageRef'];errors=[]
try: store.retain(image,binding)
except ValueError: errors.append('capacity')
try: open_image(ref,{**binding,'frameId':2})
except ValueError: errors.append('identity')
code="import sys,json;sys.path.insert(0,'src/assets/scripts');from sanctum_ocr import read_frozen;print(json.dumps(read_frozen(json.load(sys.stdin))))"
request=dict(imageRef=ref,binding=binding,region=dict(x=0,y=0,width=120,height=30),iconsOnly=True,includeIcons=False)
second=json.loads(subprocess.run([sys.executable,'-c',code],input=json.dumps(request),text=True,capture_output=True,check=True).stdout)
store.release({**ref,'deadlineAt':123,'captureWindows':[]});store.release(ref)
try: open_image(ref,binding)
except ValueError: errors.append('released')
print(json.dumps(dict(errors=errors,first=r['captureMetrics']['decodeCalls'],second=second['captureMetrics']['decodeCalls'],bytes=store.bytes)))
`)
  assert.deepEqual(result,{errors:['capacity','identity','released'],first:1,second:0,bytes:0})
})

test('并行候选扫描与顺序扫描结果完全一致，包含贴边、多币种与空白',()=>{
  const result=runPython(`
import sys,json,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_rewards import recognize_currency_icons,templates
from sanctum_recognition import load_image
cv2.setNumThreads(1)
canvas=np.full((130,300,3),35,np.uint8)
for (name,art),x,y in zip(templates()[:2],[0,220],[0,55]):
 art=cv2.resize(art,(40,40));alpha=art[:,:,3:4].astype(float)/255
 canvas[y:y+40,x:x+40]=(art[:,:,:3]*alpha+canvas[y:y+40,x:x+40]*(1-alpha)).astype(np.uint8)
images=[canvas,load_image('test/fixtures/sanctum/ocr-reward.png')[84:],np.full((90,200,3),35,np.uint8)]
results=[]
for image in images:
 a=recognize_currency_icons(image,workers=1);b=recognize_currency_icons(image,workers=4)
 results.append(a==b)
print(json.dumps(results))
`)
  assert.deepEqual(result,[true,true,true])
})
})()

// === Merged from sanctumStatusRewards.test.js ===
await (async () => {
  const test = _m12_test
  const assert = _m12_assert
  const fs = _m12_fs
  const runPython = _m12_runPython
  const parseStatusTooltip = _m12_parseStatusTooltip
  const observationKey = _m12_observationKey
  const SanctumLiveDriver = _m12_SanctumLiveDriver
  const acceptSanctumFloor = _m12_acceptSanctumFloor
  const emptySanctumState = _m12_emptySanctumState
  const effectReadIssues = _m12_effectReadIssues
  const effectIssueText = _m12_effectIssueText
  const effectTargetLabel = _m12_effectTargetLabel
  const completedEffectGroups = _m12_completedEffectGroups
  const emptyEffectGroups = _m12_emptyEffectGroups
  const effectScanFinished = _m12_effectScanFinished
const catalog=JSON.parse(fs.readFileSync('electron/assets/sanctum/catalog.json','utf8'))
const promise='完成禁域时获得 14× 混沌石'
const base=()=>({identityConfirmed:true,runId:'batch',sanctumRunId:'run',floorId:'f',mapKey:'m',currentRoomId:'1:1',positionStatus:'confirmed',revision:1,rooms:[],edges:[]})

test('真实奖励截图 OCR 识别为奖励上下文，不生成效果或账本',()=>{
  const ocr=runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import load_image
from sanctum_ocr import create_sanctum_ocr_engine,read_room_ocr
im=load_image('test/fixtures/sanctum/status-pending-rewards.png')
print(json.dumps(read_room_ocr(create_sanctum_ocr_engine(),im[49:333,76:733])))`)
  const result=parseStatusTooltip({status:'located',...ocr},catalog)
  assert.equal(result.effectGroup,null)
  assert.equal(result.classificationComplete,true)
  assert.equal(result.hasRewardContext,true)
  assert.equal(result.rewardGroup,undefined)
})

test('奖励换行、同币种独立行及截断不污染效果，未知类型保持缺口',()=>{
  const result=parseStatusTooltip({status:'located',texts:['楼层结束时获得','14×','混沌石',promise,promise]},catalog)
  const partial=parseStatusTooltip({status:'partial',texts:['完成禁域时获得 ?×未知物品'],reason:'截断'},catalog)
  assert.equal(partial.classificationComplete,true)
  assert.equal(partial.effectGroup,null)
  assert.equal(parseStatusTooltip({status:'located',texts:['未知文字']},catalog).classificationComplete,false)
  assert.equal(parseStatusTooltip({status:'partial',texts:['全知之眼']},catalog).classificationComplete,false)
})

async function readStatus(t,texts,coverageConfirmed=true) {
  const driver=new SanctumLiveDriver({catalog,makeClient:()=>({sessionId:'s',async shutdown(){},async request(command,input){
    if(command==='interfaceState')return {mapOpen:true,hudLayout:'map'}
    if(command==='inspectEffects')return {coverageConfirmed,icons:texts.map((_,x)=>({x,y:1}))}
    if(command==='hoverEffect')return {status:'located',texts:texts[input.icon.x]}
  }})})
  await driver.open();t.after(()=>driver.close())
  driver.assertLog=()=>({floorId:'f'});driver.logContext={context:{},close(){}}
  driver.profile={environment:{},interfaceTitles:{'sanctum-map-hud':{}},mapEffectIconsRegion:{}}
  return driver.finalizeFloor(base(),new AbortController().signal)
}

test('空 OCR 只报具体浮窗，分类结果为空不影响整体未知，截图标签同源',async t=>{
  const floor=await readStatus(t,[['钝化之剑'],[]])
  assert.deepEqual(floor.effectScan.groups.slice(0,4).map(g=>g.status),['absent','absent','absent','read'])
  assert.equal(floor.effectScan.complete,false)
  assert.equal(floor.effectScan.finished,true)
  assert.ok(floor.currentEffects.some(e=>e.status==='unknown'))
  const issues=effectReadIssues(floor.effectScan)
  assert.equal(issues.length,1)
  assert.equal(issues[0].targetId,'effect:2')
  assert.equal(issues[0].label,effectTargetLabel(floor.effectScan.targets[1]))
  assert.equal(effectIssueText(issues[0]),'状态栏第 2 个图标浮窗 · 读取：未识别到该浮窗的名称或描述，无法确定具体状态')
  const group=floor.effectScan.groups.find(g=>g.targetId==='effect:2')
  assert.equal(group.iconIndex,2)
  assert.equal(group.evidenceId,floor.effectScan.targets[1].evidenceId)
})

test('部分未知文字显示原文且不污染已识别类别，排除奖励内容',async t=>{
  const floor=await readStatus(t,[['钝化之剑','测试无法匹配的描述','完成禁域时获得 ?×混沌石']])
  const issues=effectReadIssues(floor.effectScan)
  assert.equal(issues.length,1)
  assert.equal(issues[0].label,'钝化之剑')
  assert.match(issues[0].reason,/测试无法匹配的描述/)
  assert.doesNotMatch(issues[0].reason,/完成禁域时获得/)
  assert.equal(floor.effectScan.groups.find(g=>g.category==='minorAffliction').status,'read')
})

test('零图标与纯奖励四类为空；覆盖不足和入口失败单独报告；重读成功无旧错误',async t=>{
  for(const texts of [[],[[promise]]]) {
    const floor=await readStatus(t,texts)
    assert.ok(floor.effectScan.groups.every(g=>g.status==='absent'))
    assert.deepEqual(effectReadIssues(floor.effectScan),[])
  }
  const uncovered=await readStatus(t,[],false)
  assert.deepEqual(effectReadIssues(uncovered.effectScan).map(i=>i.stage),['scan'])
  assert.deepEqual(effectReadIssues({finished:true,complete:false,groups:[],targets:[{targetId:'effect:scan',stage:'scan-failed',reason:'入口扫描超时'}]}).map(i=>i.stage),['scan-failed'])
  assert.deepEqual(effectReadIssues((await readStatus(t,[['钝化之剑']])).effectScan),[])
  assert.equal(effectScanFinished({complete:false,groups:emptyEffectGroups()}),false)
  assert.ok(completedEffectGroups(emptyEffectGroups()).every(g=>g.status==='unconfirmed'))
})

test('旧记录空类别、无来源重复错误和内部编号兼容展示',()=>{
  const target={targetId:'effect:2',stage:'failed',texts:[],reason:'未读到词缀文字'}
  const scan={complete:false,targets:[target],groups:[...emptyEffectGroups().map(g=>({...g,status:'failed'})),
    {category:null,label:'未完整识别',complete:false,texts:[],reason:target.reason}]}
  assert.equal(effectScanFinished(scan),true)
  assert.ok(completedEffectGroups(scan.groups,true).slice(0,4).every(g=>g.status==='absent'))
  const issues=effectReadIssues(scan)
  assert.equal(issues.length,1)
  assert.equal(issues[0].label,'状态栏第 2 个图标浮窗')
  assert.doesNotMatch(effectIssueText(issues[0]),/effect:|未完整识别|词缀文字/)
})

test('解析保留截图绑定，装饰文字不算读取成功，同一目标同阶段只报告一次',()=>{
  const {effectGroup}=parseStatusTooltip({status:'located',texts:['X'],targetId:'effect:2',iconIndex:2,evidenceId:'proof-2'},catalog)
  assert.equal(effectGroup.targetId,'effect:2')
  assert.equal(effectGroup.evidenceId,'proof-2')
  assert.equal(effectGroup.iconIndex,2)
  assert.equal(effectGroup.status,'failed')
  const scan={complete:false,targets:[
    {targetId:'effect:2',stage:'ocr-failed',reason:'文字识别超时'},
    {targetId:'effect:2',stage:'ocr-failed',reason:'OCR 进程退出'}]}
  const issues=effectReadIssues(scan)
  assert.equal(issues.length,1)
  assert.match(issues[0].reason,/文字识别超时；OCR 进程退出/)
})

test('真实驱动忽略奖励数量缺口，奖励不生成未知效果或账本',async t=>{
  const floor=await readStatus(t,[['全知之眼'],['钝化之剑'],[promise],['楼层结束时获得 ?×点金石']])
  assert.equal(floor.effectScan.complete,true)
  assert.equal(floor.effectScan.effectsComplete,true)
  assert.deepEqual(floor.effectScan.groups.map(g=>g.status),['read','absent','absent','read'])
  assert.equal(floor.effectScan.rewardGroups,undefined)
  assert.ok(floor.currentEffects.every(e=>e.entryId))
  const state=acceptSanctumFloor(emptySanctumState(),floor)
  assert.equal(state.rewardLedger,undefined)
  const unknown=await readStatus(t,[['全知之眼'],['未认识的入口']])
  assert.equal(unknown.effectScan.groups.find(g=>g.category==='minorBoon').status,'absent')
  const uncovered=await readStatus(t,[[promise]],false)
  assert.equal(uncovered.effectScan.effectsComplete,false)
  assert.ok(uncovered.effectScan.groups.every(g=>g.status==='absent'))
})
})()
