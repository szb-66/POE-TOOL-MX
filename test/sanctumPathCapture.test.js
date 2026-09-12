import test from 'node:test'
import assert from 'node:assert/strict'
import { runPython } from './helpers/python.js'
import { parseSanctumEffectGroup } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { planSanctumFloor } from '../electron/modules/sanctum/planner.js'

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
