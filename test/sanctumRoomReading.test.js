import test from 'node:test'
import assert from 'node:assert/strict'
import { runPython } from './helpers/python.js'
import { roomExclusions } from '../electron/modules/sanctum/roomEligibility.js'

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
