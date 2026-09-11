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
  assert.equal(result[4].initial, true)
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
