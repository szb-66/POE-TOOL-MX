import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {runPython} from './helpers/python.js'
import {parseStatusTooltip} from '../electron/modules/sanctum/statusRecognition.js'
import {SanctumLiveDriver} from '../electron/modules/sanctum/liveDriver.js'
import {effectReadIssues} from '../shared/sanctumEffects.js'
import {syncStatusRewards,observationKey} from '../electron/modules/sanctum/runObservation.js'

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
    assert.equal(parsed.rewardGroup.complete,true)
    assert.deepEqual(parsed.rewardGroup.rewards.map(r=>[r.currency,r.quantity,r.timing,r.state]),[
      ['工匠石',60,'run','pending'],['改造石',30,'run','pending']])
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

test('奖励重采替换旧浮窗失败，分类不依赖序号，同位置不重复入账',async t=>{
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
  const ledger=syncStatusRewards(null,read)
  assert.deepEqual(ledger.items.map(r=>[r.currency,r.quantity]),[['工匠石',60],['改造石',30]])
  assert.deepEqual(syncStatusRewards(ledger,read),ledger)
})
