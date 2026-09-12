import test from 'node:test'
import assert from 'node:assert/strict'
import { runPython } from './helpers/python.js'
import { sanctumDisplay } from '../shared/sanctumDisplay.js'

test('宝库低填充首房：单帧准确恢复32房间及两段已走路径', () => {
  const result = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import analyze_floor,load_image
c={'version':1,'scope':'live','imageSize':[2000,1215],'region':[0,0,2000,1215],'roomSize':[86,131],'pathHsv':[[15,165,162],[31,255,255]]}
im=load_image('test/fixtures/sanctum/vault-low-fill-room.png')[299:1514,912:2912]
f=analyze_floor(im,c)
print(json.dumps({'columns':[sum(r['column']==i for r in f['rooms']) for i in range(8)],
 'position':f['currentRoomId'],'status':f['positionStatus'],
 'visited':[[e['from'],e['to']] for e in f['edges'] if e['traversal']=='visited'],
 'first':f['rooms'][0],'floor':f}))`)
  assert.deepEqual(result.columns, [3, 5, 5, 6, 3, 5, 4, 1])
  assert.equal(result.position, '2:1')
  assert.equal(result.status, 'confirmed')
  assert.deepEqual(result.visited, [['0:0', '1:2'], ['1:2', '2:1']])
  assert.ok(Math.abs(result.first.height - 133) <= 3, '恢复完整高度而非109像素碎片')
  assert.ok(Math.abs(result.first.y + result.first.height / 2 - 390) <= 10, '中心对齐真实房间')
  assert.deepEqual(result.floor.edges.filter(e => e.from === '0:0').map(e => [e.to, e.traversal]),
    [['1:0', 'unavailable'], ['1:1', 'unavailable'], ['1:2', 'visited']])
  const display = sanctumDisplay(result.floor)
  assert.equal(display.rooms.length, 32)
  assert.deepEqual(display.rooms.filter(r => r.current).map(r => r.id), ['2:1'])
  assert.deepEqual(display.rooms.filter(r => r.displayState === 'completed').map(r => r.id), ['0:0', '1:2'])
  assert.equal(display.lines.filter(e => e.displayState === 'completed').length, 2)
})

test('低填充补位覆盖首中尾：只接受独立锚点和完整连续路径', () => {
  const result = runPython(`
import sys,json,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import recover_low_fill_rooms
def room(x,y): return {'x':x,'y':y,'width':80,'height':130,'quality':.95}
def fragment(y,x=200): return {'x':x,'y':y,'width':82,'height':105,'quality':.28}
def run(y,kind='valid'):
 im=np.full((1000,850,3),110,np.uint8)
 anchors=[room(200,v) for v in (180,420,660) if v!=y]+[room(420,y),room(640,420)]
 if kind=='single-anchor': anchors=anchors[1:]
 if kind=='overlap': anchors.append(room(200,y))
 if kind=='no-anchors': anchors=[]
 if kind=='crossing': cv2.line(im,(350,y+20),(350,y+110),(0,180,220),5)
 elif kind!='no-path': cv2.line(im,(280,y+65),(420,y+65),(0,180,220),5)
 fragments=[fragment(y)]
 if kind=='duplicate': fragments += [fragment(y+2),fragment(y+5)]
 if kind=='off-column': fragments=[fragment(y,235)]
 if kind=='wrong-size': fragments[0]['width']=120
 if kind=='background': fragments=[fragment(y,640)]
 recovered=recover_low_fill_rooms(im,anchors,fragments)
 return [{'x':r['x'],'y':r['y'],'width':r['width'],'height':r['height']} for r in recovered]
print(json.dumps({'valid':[run(y) for y in (180,420,660)],'duplicate':run(420,'duplicate'),
 'rejected':{kind:run(420,kind) for kind in ['no-path','crossing','off-column','overlap','single-anchor','no-anchors','wrong-size','background']}}))`)
  for (const [index, rooms] of result.valid.entries()) {
    assert.equal(rooms.length, 1)
    assert.equal(rooms[0].x, 200)
    assert.equal(rooms[0].width, 80)
    assert.equal(rooms[0].height, 130)
    assert.ok(Math.abs(rooms[0].y - [180, 420, 660][index]) <= 8)
  }
  assert.equal(result.duplicate.length, 1)
  for (const [kind, rooms] of Object.entries(result.rejected)) assert.deepEqual(rooms, [], kind)
})

test('原生单帧observe到地图显示保留补位、位置及稳定编号', () => {
  const result = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession
from sanctum_recognition import load_image
im=load_image('test/fixtures/sanctum/vault-low-fill-room.png')[299:1514,912:2912]
p=json.load(open('test/fixtures/sanctum/archives-live-profile.json',encoding='utf-8'))
p['mapRegion']={'x':0,'y':0,'width':2000,'height':1215}
p['calibration']={'version':1,'scope':'live','imageSize':[2000,1215],'region':[0,0,2000,1215],'roomSize':[86,131],'pathHsv':[[15,165,162],[31,255,255]]}
s=NativeSession.__new__(NativeSession);s.check=lambda:None;s.match_title=lambda *a:True
captures=[]
def capture():
 captures.append(1)
 return im,{}
s.image=capture
f=s.observe(p,include_text=False)['floor']
print(json.dumps({'floor':f,'captures':len(captures)}))`)
  assert.equal(result.captures, 1)
  const display = sanctumDisplay(result.floor)
  assert.equal(display.rooms.length, 32)
  const current = display.rooms.filter(r => r.current)
  assert.equal(current.length, 1)
  assert.equal(current[0].column, 2)
  assert.equal(current[0].row, 1)
  assert.equal(display.lines.filter(e => e.displayState === 'completed').length, 2)
})
