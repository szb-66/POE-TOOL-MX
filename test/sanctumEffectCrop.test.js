import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {runPython} from './helpers/python.js'
import {parseEffectTooltip} from '../electron/modules/sanctum/effectRecognition.js'
import {SanctumLiveDriver} from '../electron/modules/sanctum/liveDriver.js'
const catalog=JSON.parse(fs.readFileSync('electron/assets/sanctum/catalog.json','utf8'))

test('定位区分无候选、冲突和截断；缩放回原图采用实际横纵比例',()=>{
  const result=runPython(`
import sys,json,cv2,numpy as np
from unittest.mock import patch
sys.path.insert(0,'src/assets/scripts')
from sanctum_tooltip import locate_content
base=np.full((800,1200,3),150,np.uint8);out=[]
for rectangles in [[],[(300,250,600,330),(300,420,600,500)],[(300,0,600,180)]]:
 im=base.copy()
 for x,y,right,bottom in rectangles:cv2.rectangle(im,(x,y),(right,bottom),(20,20,20),-1)
 out.append(locate_content(base,im,(450,375 if len(rectangles)==2 else 195)))
base=np.full((1645,3072,3),150,np.uint8);im=np.full_like(base,20)
with patch('sanctum_tooltip.locate_tooltip',side_effect=[{'status':'unknown','reason':'无候选'},{'status':'located','region':{'x':500,'y':400,'width':250,'height':100}}]) as locator:
 r=locate_content(base,im,(1000,900))['region']
 assert locator.call_count==2
 assert locator.call_args.args[0].shape[:2]==(1028,1920)
 assert r=={'x':800,'y':640,'width':400,'height':161},r
print(json.dumps(out))`)
  assert.match(result[0].reason,/未找到/)
  assert.match(result[1].reason,/多个候选/)
  assert.equal(result[2].status,'partial');assert.match(result[2].reason,/截断/)
})

test('三张反馈四种宽度：原生采集只截一次，同源局部证据、完整文字 OCR 和目录匹配',()=>{
  const results=runPython(`
import sys,json,cv2,numpy as np,threading,base64
from unittest.mock import patch
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import load_image
from sanctum_tooltip import locate_content,icon_candidates
from sanctum_native import NativeSession
from sanctum_frames import FramePool
from sanctum_postprocess import process_image
from sanctum_ocr import create_sanctum_ocr_engine,read_room_ocr
frames=[np.pad(load_image('test/fixtures/sanctum/'+name+'.png'),((800,0),(1100,1440),(0,0)),mode='edge') for name in ['effect-boon','effect-afflictions']]
frames.append(np.pad(load_image('test/fixtures/sanctum/effect-feedback.png'),((450,319),(760,998),(0,0)),mode='edge'))
points=[(1650,1440),(1730,1440),(1114,932)]
expected=[(1390,1250,1900,1380),(1345,985,2110,1385),(865,631,1360,885)]
engine=create_sanctum_ocr_engine();out=[]
for index,frame in enumerate(frames):
 for width in [1920,2560,3072,3840]:
  height=round(frame.shape[0]*width/frame.shape[1]);scale=width/frame.shape[1]
  image=cv2.resize(frame,(width,height),interpolation=cv2.INTER_AREA)
  base=cv2.resize(frames[1-index] if index<2 else np.full_like(frame,100),(width,height),interpolation=cv2.INTER_AREA)
  point=tuple(value*scale for value in points[index])
  s=NativeSession.__new__(NativeSession);s.expected={};s.tooltip_baseline=base;s.cancelled=threading.Event()
  s.check=lambda:{'clientBounds':{'x':0,'y':0}};s.move_cursor=lambda p:None;s.progress=lambda *a,**kw:None
  s.request_context={'targetId':'effect:1','sessionId':'s'};s.capture_masks=[]
  events=[];shots=[]
  def shot():
   shots.append(1);return image,{}
  s.image=shot
  pool=FramePool(width,height)
  s.freeze_baseline({'pool':pool.spec,'slot':0})
  captured=s.read_tooltip({'frozen':{'pool':pool.spec,'slot':1,'baselineSlot':0,'baselineVersion':s.baseline_version,'frameId':1}},point,'effects')
  result=process_image(pool.view(0),pool.view(1),captured['frozenFrame'],events.append)
  s.frame_mapping.close();pool.close()
  assert len(shots)==1 and len(events)==1,(index,width,result)
  r=result['region'];event=events[0]
  assert event['kind']=='effect-crop' and event['png']==result['png']
  assert event['sourceRegion']==r and event['region']==dict(x=0,y=0,width=r['width'],height=r['height'])
  cropped=cv2.imdecode(np.frombuffer(base64.b64decode(result.pop('png')),np.uint8),cv2.IMREAD_COLOR)
  assert np.array_equal(cropped,image[r['y']:r['y']+r['height'],r['x']:r['x']+r['width']])
  x,y,right,bottom=[v*scale for v in expected[index]]
  assert r['x']<=x and r['y']<=y and r['x']+r['width']>=right and r['y']+r['height']>=bottom,(index,width,r)
  for dx,dy in [(0,6),(8,12),(-8,-6)]:
   assert locate_content(base,image,(point[0]+dx*scale,point[1]+dy*scale))['region']==r
  # Exactly one OCR invocation on the very PNG supplied to the evidence API.
  result.update(read_room_ocr(engine,cropped));result.update(sample=index,width=width)
  out.append(result)
  assert not locate_content(image,image,point).get('region')
# No location produces no full-screen evidence or OCR input.
s.tooltip_baseline=image
events=[]
failed=process_image(image,image,{'mode':'effects','point':point,'frameId':2},events.append)
assert not events and not failed.get('png') and failed['readStages']['ocr']=='failed'
# Open decorative borders: all four entrances survive at every tested scale.
icons=load_image('test/fixtures/sanctum/effect-entrances.png')
for width in [1920,2560,3072,3840]:
 scale=width/3840
 found=icon_candidates(cv2.resize(icons,None,fx=scale,fy=scale,interpolation=cv2.INTER_AREA))
 assert len(found)==4,(width,found)
 for icon,x in zip(found,[81,159,229,312]):assert abs(icon['x']/scale-x)<14
print(json.dumps(out))`)
  assert.equal(results.length,12)
  for(const result of results) {
    const group=parseEffectTooltip(result,catalog)
    assert.deepEqual(group.entries.map(e=>e.name),result.sample===0?['全知之眼']:['钝化之剑','过门税款','巫毒人偶'],JSON.stringify(result))
    assert.ok(group.entries.every(e=>e.category===(result.sample===0?'majorBoon':'minorAffliction')))
  }
})

test('全部入口依次悬停：某个浮窗定位失败仍采集其余入口，各成功裁剪只 OCR 一次',async()=>{
  const hovered=[],ocr=[]
  const driver=new SanctumLiveDriver({catalog,makeClient:()=>({sessionId:'s',async shutdown(){},async request(command,input){
    if(command==='interfaceState')return {mapOpen:true,hudLayout:'map'}
    if(command==='inspectEffects')return {coverageConfirmed:true,icons:[0,1,2,3].map(x=>({x,y:10}))}
    if(command==='hoverEffect') {
      hovered.push(input.icon.x)
      if(input.icon.x===1)return {status:'unknown',reason:'未找到效果浮窗'}
      return {status:'located',region:{x:100,y:200,width:20,height:10},png:String(input.icon.x)}
    }
  }})})
  await driver.open()
  driver.ocrClient={async shutdown(){},async request(command,input){ocr.push(input);return {texts:['全知之眼']}}}
  driver.assertLog=()=>({floorId:'f'});driver.logContext={context:{},close(){}}
  driver.profile={environment:{},interfaceTitles:{'sanctum-map-hud':{}},mapEffectIconsRegion:{}}
  try {
    const floor=await driver.finalizeFloor({runId:'r',floorId:'f',rooms:[],edges:[]},new AbortController().signal)
    assert.deepEqual(hovered,[0,1,2,3]);assert.deepEqual(ocr.map(o=>o.png),['0','2','3'])
    assert.ok(ocr.every(o=>o.room===false && o.region.x===0 && o.region.y===0))
    assert.equal(floor.effectScan.targets.length,4)
    assert.equal(floor.effectScan.targets[1].stage,'failed')
    assert.equal(floor.effectScan.targets[1].evidenceId,undefined)
  } finally {await driver.close()}
})
