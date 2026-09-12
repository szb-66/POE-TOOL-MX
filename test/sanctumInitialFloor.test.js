import test from 'node:test'
import assert from 'node:assert/strict'
import { runPython } from './helpers/python.js'
import { planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { createSanctumStrategy } from '../shared/sanctum.js'
import { sanctumDisplay, sanctumPositionUnconfirmed } from '../shared/sanctumDisplay.js'
import { sanctumPageDisplay } from '../shared/sanctumPresentation.js'

const floor = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import analyze_floor,load_image
c={'version':1,'scope':'live','imageSize':[2000,1215],'region':[0,0,2000,1215],'roomSize':[86,131],'pathHsv':[[15,165,162],[31,255,255]]}
im=load_image('test/fixtures/sanctum/nave-initial-floor.png')[299:1514,912:2912]
print(json.dumps(analyze_floor(im,c)))`)

test('教堂未打首房：29间47条可达线，入口待选且无当前位置', () => {
  assert.deepEqual(Array.from({ length: 8 }, (_, c) => floor.rooms.filter(r => r.column === c).length), [3,5,3,3,4,5,5,1])
  assert.equal(floor.edges.length, 47)
  assert.ok(floor.edges.every(e => e.status === 'matched' && e.traversal === 'available'))
  assert.equal(floor.initialSelection, true)
  assert.equal(floor.positionStatus, 'initial')
  assert.equal(floor.currentRoomId, null)
  assert.deepEqual(floor.startRoomIds, ['0:0','0:1','0:2'])
  assert.deepEqual(floor.exitRoomIds, ['7:0'])
  assert.ok(floor.rooms.every(r => !r.terminal && !r.type))
})

test('两类策略从已读首列推荐第一房，页面与浮窗不标当前房间', () => {
  // Controlled detail fixtures test planning; this is not OCR of the screenshot.
  const f = { ...structuredClone(floor), identityConfirmed: true, runId: 'test-run', floorId: 'test-nave', revision: 1 }
  for (const r of f.rooms.filter(r => r.column === 0)) Object.assign(r, { detailsStatus: 'matched', revealed: true, type: 'reward', rewards: [], afflictions: [] })
  for (const preset of ['reveal','currency']) {
    const recommendation = planSanctumFloor(f, createSanctumStrategy(preset))
    assert.ok(recommendation.paths.length > 0, `${preset}: ${recommendation.reason}`)
    assert.ok(f.startRoomIds.includes(recommendation.paths[0].nextRoomId))
    assert.equal(recommendation.paths[0].rooms[0], recommendation.paths[0].nextRoomId)
    assert.equal(sanctumPositionUnconfirmed(f), false)
    for (const render of [sanctumDisplay, sanctumPageDisplay]) {
      const display = render(f, recommendation)
      assert.equal(display.rooms.filter(r => r.current).length, 0)
      assert.equal(display.rooms.filter(r => r.next).length, 1)
      assert.equal(display.nextRoomId, recommendation.paths[0].nextRoomId)
      assert.ok(display.rooms.find(r => r.next).recommended)
    }
  }
})

test('入口详情读取失败提示读取缺口，不要求设置当前位置', () => {
  const f = { ...structuredClone(floor), identityConfirmed: true, runId: 'test-run', floorId: 'test-nave', revision: 1 }
  for (const preset of ['reveal','currency']) {
    const recommendation = planSanctumFloor(f, createSanctumStrategy(preset))
    assert.deepEqual(recommendation.paths, [])
    assert.match(recommendation.reason, /识别|读取/)
    assert.doesNotMatch(recommendation.reason, /当前位置|定位/)
    assert.equal(sanctumPositionUnconfirmed(f), false)
  }
})

test('入口结构必须完整：不忽略未知边、孤立房间、缺列、遮挡或错误终点', () => {
  const results = runPython(`
import sys,json,copy
sys.path.insert(0,'src/assets/scripts')
from sanctum_paths import locate_position
rooms=[{'id':'0:a','column':0},{'id':'0:b','column':0}]+[{'id':str(c),'column':c} for c in range(1,8)]
def edge(a,b): return {'from':a,'to':b,'status':'matched','availability':'gold','traversal':'available'}
edges=[edge('0:a','1'),edge('0:b','1')]+[edge(str(c),str(c+1)) for c in range(1,7)]
out={}
for kind in ['complete','unknown-edge','unknown-traversal','red-edge','occluded-room','occluded-edge','missing-column','broken','isolated','two-ends','dangling','skip-column','duplicate-id']:
 r,e=copy.deepcopy(rooms),copy.deepcopy(edges)
 if kind=='unknown-edge': e.append({**edge('2','3'),'status':'unknown'})
 if kind=='unknown-traversal': e[3]['traversal']='unknown'
 if kind=='red-edge': e[3].update(availability='unavailable',traversal='unavailable')
 if kind=='occluded-room': r[4]['occluded']=True
 if kind=='occluded-edge': e[3]['occluded']=True
 if kind=='missing-column': r=[x for x in r if x['column']!=4];e=[x for x in e if '4' not in (x['from'],x['to'])]
 if kind=='broken': e.pop(4)
 if kind=='isolated': r.append({'id':'orphan','column':3})
 if kind=='two-ends': r.append({'id':'second-end','column':7});e.append(edge('6','second-end'))
 if kind=='dangling': e.append(edge('6','missing'))
 if kind=='skip-column': e.append(edge('2','4'))
 if kind=='duplicate-id': r.append(dict(r[4]))
 p=locate_position(r,e)
 out[kind]=[p['positionStatus'],p['currentRoomId'],p['initialSelection']]
print(json.dumps(out))`)
  assert.deepEqual(results.complete, ['initial', null, true])
  for (const [kind, result] of Object.entries(results)) {
    if (kind !== 'complete') assert.deepEqual(result, ['unknown', null, false], kind)
  }
})
