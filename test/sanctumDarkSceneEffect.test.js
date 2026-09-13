import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {runPython} from './helpers/python.js'
import {parseStatusTooltip} from '../electron/modules/sanctum/statusRecognition.js'
const catalog=JSON.parse(fs.readFileSync('electron/assets/sanctum/catalog.json','utf8'))

// Real dark-room frames supplied by the user (see status-dark-evidence.md):
// the tooltip body is barely darker than the scene, so absolute thresholds
// find nothing. Baseline darkening must locate both panels.
test('暗场景状态栏两浮窗：基线变暗定位成功并完整分流，入口坐标复现',()=>{
  const results=runPython(`
import sys,json,base64
sys.path.insert(0,'src/assets/scripts')
import cv2,numpy as np
from sanctum_recognition import load_image
from sanctum_tooltip import locate_content,icon_candidates
from sanctum_ocr import create_sanctum_ocr_engine,read_frozen
base=load_image('test/fixtures/sanctum/status-dark-base.png')
h,w=base.shape[:2]
region={'x':int(w*.38),'y':int(h*.72),'width':int(w*.24),'height':int(h*.22)}
icons=icon_candidates(base[region['y']:region['y']+region['height'],region['x']:region['x']+region['width']])
points=[{'x':i['x']+region['x'],'y':i['y']+region['y']} for i in icons]
engine=create_sanctum_ocr_engine();out=[]
for name,pt in (('status-dark-afflictions-hover',points[0]),('status-dark-rewards-hover',points[1])):
  img=load_image('test/fixtures/sanctum/'+name+'.png')
  for width in (1920,2560,3072,3840):
    size=(width,round(img.shape[0]*width/img.shape[1]));scale=width/img.shape[1]
    b=cv2.resize(base,size,interpolation=cv2.INTER_AREA)
    f=cv2.resize(img,size,interpolation=cv2.INTER_AREA)
    result=locate_content(b,f,(pt['x']*scale,pt['y']*scale))
    assert result['status']=='located',(name,width,result)
    r=result['region']
    ok,png=cv2.imencode('.png',f[r['y']:r['y']+r['height'],r['x']:r['x']+r['width']],[cv2.IMWRITE_PNG_COMPRESSION,1])
    read=read_frozen(dict(png=base64.b64encode(png).decode('ascii'),region=dict(x=0,y=0,width=r['width'],height=r['height']),room=False,includeIcons=False),engine)
    out.append(dict(name=name,width=width,point=pt,
      region={k:round(v/scale) for k,v in r.items()},texts=read['texts']))
print(json.dumps(dict(points=points,results=out),ensure_ascii=False))`)
  // The calibrated status-bar crop finds exactly the two hovered entrances.
  assert.equal(results.points.length,2)
  for(const point of results.points){
    assert.ok(point.x>780&&point.x<980,JSON.stringify(point))
    assert.ok(point.y>780&&point.y<900,JSON.stringify(point))
  }
  const byName={}
  for(const result of results.results){
    byName[result.name]??=[]
    byName[result.name].push(result)
    // Every width maps back to the same native rectangle within a few pixels.
    assert.ok(Math.abs(result.region.x-(result.name.includes('rewards')?730:634))<5,JSON.stringify(result))
    assert.ok(Math.abs(result.region.y-(result.name.includes('rewards')?673:450))<5,JSON.stringify(result))
    assert.ok(Math.abs(result.region.width-(result.name.includes('rewards')?410:452))<8,JSON.stringify(result))
    assert.ok(Math.abs(result.region.height-(result.name.includes('rewards')?149:372))<8,JSON.stringify(result))
  }
  for(const result of byName['status-dark-afflictions-hover']){
    const {effectGroup,hasRewardContext}=parseStatusTooltip({status:'located',texts:result.texts},catalog)
    assert.equal(hasRewardContext,false)
    assert.equal(effectGroup.complete,true)
    assert.deepEqual(effectGroup.entries.map(e=>e.name),['黑暗深坑','焦化硬币','钱包过满','巫毒人偶','弱化血肉'])
    assert.ok(effectGroup.entries.every(e=>e.category==='minorAffliction'))
  }
  for(const result of byName['status-dark-rewards-hover']){
    const {effectGroup,hasRewardContext}=parseStatusTooltip({status:'located',texts:result.texts},catalog)
    assert.equal(effectGroup,null)
    assert.equal(hasRewardContext,true)
  }
})

test('暗场景变暗候选拒绝静止区域与画面外噪声',()=>{
  const checks=runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
import cv2,numpy as np
from sanctum_recognition import load_image
from sanctum_tooltip import changed_panel_boundary
base=load_image('test/fixtures/sanctum/status-dark-base.png')
before=cv2.cvtColor(base,cv2.COLOR_BGR2GRAY).astype(np.int16)
darkened=before-cv2.cvtColor(base,cv2.COLOR_BGR2GRAY).astype(np.int16)>6
# static scene, zero darkening: no rectangle may pass as a new panel
still=changed_panel_boundary(base,base,dict(x=730,y=673,width=410,height=150),darkened)
print(json.dumps([still]))`)
  assert.equal(checks[0],false)
})
