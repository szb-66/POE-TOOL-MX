import test from 'node:test'
import assert from 'node:assert/strict'
import { runPython } from './helpers/python.js'
import { sanctumDisplay, sanctumPositionUnconfirmed } from '../shared/sanctumDisplay.js'
import { parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumCapture } from '../electron/modules/sanctum/capture.js'
import { AutomationLock } from '../electron/modules/automation/lock.js'

test('墓场通用检测恢复底部与末列房间，完整入口且不推断首领类型', () => {
  const floor = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import analyze_floor,load_image
c={'version':1,'scope':'live','imageSize':[2000,1215],'region':[0,0,2000,1215],'roomSize':[86,131],'pathHsv':[[15,165,162],[31,255,255]]}
im=load_image('test/fixtures/sanctum/necropolis-initial-floor.png')[299:1514,912:2912]
print(json.dumps(analyze_floor(im,c)))`)
  assert.deepEqual(Array.from({ length: 8 }, (_, c) => floor.rooms.filter(r => r.column === c).length), [3,3,3,6,3,6,3,1])
  assert.equal(floor.edges.length, 45)
  assert.ok(floor.edges.every(e => e.status === 'matched' && e.traversal === 'available'))
  assert.equal(floor.positionStatus, 'initial')
  assert.equal(floor.currentRoomId, null)
  assert.deepEqual(floor.startRoomIds, ['0:0','0:1','0:2'])
  assert.deepEqual(floor.exitRoomIds, ['7:0'])
  for (const [id, x, y] of [['3:5',902.5,1111],['7:0',1776.5,623]]) {
    const room = floor.rooms.find(r => r.id === id)
    assert.ok(Math.abs(room.x + room.width / 2 - x) < 8, id)
    assert.ok(Math.abs(room.y + room.height / 2 - y) < 8, id)
    assert.equal(room.type, undefined)
  }
  assert.equal(sanctumPositionUnconfirmed(floor), false)
  assert.equal(sanctumDisplay(floor).rooms.filter(r => r.current).length, 0)
})

test('边框恢复不依赖图标，拒绝背景、断线、缺边和重复候选', () => {
  const results = runPython(`
import sys,json,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import recover_frame_rooms
def run(kind):
 im=np.full((800,1100,3),100,np.uint8)
 anchors=[dict(x=50+c*180,y=y,width=80,height=120,quality=.95) for c in range(4) for y in (100,300)]
 x,y=(410,500) if kind=='same-column' else (770,300)
 if kind=='off-column': x+=50
 if kind not in ('no-frame','crossing'):
  cv2.rectangle(im,(x-2,y-2),(x+82,y+122),(210,210,210),3)
  cv2.rectangle(im,(x,y),(x+80,y+120),(12,12,12),-1)
  if kind=='icon': im[y+20:y+100,x+14:x+66]=np.random.default_rng(7).integers(0,256,(80,52,3),dtype=np.uint8)
  if kind=='occluded-bottom': im[y+100:y+135,x-5:x+90]=100
  if kind=='no-sides': im[y+5:y+100,x-30:x+110]=100
 if kind not in ('no-path','crossing'):
  source=(630,360) if x>700 else (270,360)
  cv2.line(im,source,(x+40,y+60),(0,180,220),5)
  if kind=='broken-path': im[340:385,710:750]=100
 if kind=='crossing': cv2.line(im,(730,260),(730,440),(0,180,220),5)
 if kind=='duplicate': anchors+=anchors
 return recover_frame_rooms(im,anchors)
kinds=['normal','icon','same-column','occluded-bottom','duplicate','no-frame','no-path','no-sides','off-column','broken-path','crossing']
print(json.dumps({k:run(k) for k in kinds}))`)
  for (const kind of ['normal','icon','same-column','occluded-bottom','duplicate']) {
    assert.equal(results[kind].length, 1, kind)
    assert.ok(Math.abs(results[kind][0].y - (kind === 'same-column' ? 500 : 300)) <= 5, kind)
  }
  for (const kind of ['no-frame','no-path','no-sides','off-column','broken-path','crossing']) assert.deepEqual(results[kind], [], kind)
})

test('几何出口需要完整连接，不以末列坐标确认首领类型', () => {
  const results = runPython(`
import sys,json,copy
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import geometric_exit_rooms
rooms=[dict(id=str(c),column=c) for c in range(8)]
edges=[dict(**{'from':str(c),'to':str(c+1)},status='matched') for c in range(7)]
out={}
for kind in ['complete','missing-column','no-incoming','two-exits','occluded','unknown-edge']:
 r,e=copy.deepcopy(rooms),copy.deepcopy(edges)
 if kind=='missing-column': r.pop(2)
 if kind=='no-incoming': e.pop()
 if kind=='two-exits': r.append(dict(id='extra',column=7))
 if kind=='occluded': r[-1]['occluded']=True
 if kind=='unknown-edge': e[2]['status']='unknown'
 out[kind]=geometric_exit_rooms(r,e)
print(json.dumps(out))`)
  assert.deepEqual(results.complete, ['7'])
  for (const [kind, exits] of Object.entries(results)) if (kind !== 'complete') assert.deepEqual(exits, [], kind)
})

test('通用末列房间进入原生单帧及悬浮读取链路', () => {
  const result = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession
from sanctum_recognition import load_image
im=load_image('test/fixtures/sanctum/necropolis-initial-floor.png')[299:1514,912:2912]
p=json.load(open('test/fixtures/sanctum/archives-live-profile.json',encoding='utf-8'))
p['mapRegion']={'x':0,'y':0,'width':2000,'height':1215}
s=NativeSession.__new__(NativeSession);s.check=lambda:{};s.match_title=lambda *a:True
captures=[];points=[]
def capture(): captures.append(1);return im,{}
s.image=capture
f=s.observe(p,include_text=False)['floor']
def read(options,point,kind): points.append(point);return {'texts':['controlled tooltip']}
s.read_tooltip=read
room=next(r for r in f['rooms'] if r['column']==7)
s.hover({**p,'targetRoom':room})
print(json.dumps({'captures':len(captures),'points':points,'floor':f}))`)
  assert.equal(result.captures, 1)
  assert.ok(Math.abs(result.points[0][0] - 1777) < 8)
  assert.ok(Math.abs(result.points[0][1] - 623) < 8)
  assert.deepEqual(result.floor.exitRoomIds, ['7:0'])
})

test('末列详情成功按文字确认类型，失败保留几何与出口', async () => {
  const environment = { windowId:'game', width:2000, height:1215, dpi:96 }
  const observation = { foreground:true, userTakeover:false, mapOpen:true, interfaceMatched:true, overlayExcluded:true, environment }
  // Controlled catalog tests the existing parser contract; this is not a claim
  // that the supplied map screenshot contains readable boss tooltip text.
  const catalog = { entries:[{ id:'test-boss', kind:'room', name:'测试首领房', descriptions:['包含测试首领'], aliases:[], roomType:'boss' }] }
  for (const failed of [false,true]) {
    const room = { id:'7:0', column:7, row:0, x:1733, y:552, width:88, height:134, revealed:true }
    const floor = { runId:'test', floorId:'test-floor', identityConfirmed:true, rooms:[room], edges:[], exitRoomIds:['7:0'] }
    const calls = [], driver = { inspect:()=>observation, subscribeSafety:()=>()=>{},
      async *frames() { yield { ...observation, floor } },
      async hover(target) { calls.push(target.id); return { patch:failed ? { detailsStatus:'failed' } : parseSanctumRoomTexts(['包含测试首领'],catalog) } } }
    const capture = new SanctumCapture({ driver, automationLock:new AutomationLock() })
    let saved
    await capture.run(environment, value => { saved = value })
    assert.deepEqual(calls, ['7:0'])
    assert.deepEqual(saved.exitRoomIds, ['7:0'])
    assert.equal(saved.rooms[0].x, room.x)
    assert.equal(saved.rooms[0].type, failed ? undefined : 'boss')
    assert.equal(saved.rooms[0].detailsStatus, failed ? 'failed' : 'matched')
  }
})
