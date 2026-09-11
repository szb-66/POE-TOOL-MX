import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {parseEffectTooltip} from '../electron/modules/sanctum/effectRecognition.js'
import {mergeEffectGroups} from '../shared/sanctumEffects.js'
import {runPython} from './helpers/python.js'
import {SanctumLiveDriver} from '../electron/modules/sanctum/liveDriver.js'
const catalog=JSON.parse(fs.readFileSync('electron/assets/sanctum/catalog.json','utf8'))

test('效果冻结事件通过真实驱动绑定目标，OCR 失败仍保存只读图片引用',async()=>{
  const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
  const driver=new SanctumLiveDriver({catalog,makeClient:callbacks=>({sessionId:'s',async shutdown(){},async request(command,input){
    if(command==='interfaceState')return {mapOpen:true,hudLayout:'map'}
    if(command==='inspectEffects')return {coverageConfirmed:true,icons:[{x:1,y:1}]}
    if(command==='hoverEffect') {
      callbacks.onEvidence({targetId:input.effectTarget,sessionId:'s',png,width:1,height:1,region:{x:0,y:0,width:1,height:1},kind:'effect-crop',sourceRegion:{x:20,y:30,width:1,height:1},sourceWidth:100,sourceHeight:100})
      return {status:'located',region:{x:20,y:30,width:1,height:1},png,texts:[]}
    }
  }})})
  await driver.open()
  driver.ocrClient={async request(){throw new Error('OCR 失败')},async shutdown(){}}
  driver.assertLog=()=>({floorId:'f'})
  driver.logContext={context:{},close(){}}
  driver.profile={environment:{},interfaceTitles:{'sanctum-map-hud':{}},mapEffectIconsRegion:{}}
  try {
    const floor=await driver.finalizeFloor({runId:'r',floorId:'f',rooms:[],edges:[]},new AbortController().signal)
    const target=floor.effectScan.targets[0]
    assert.equal(target.stage,'ocr-failed');assert.ok(target.evidenceId)
    assert.equal(driver.evidence.image({runId:'r',floorId:'f',roomId:target.targetId,evidenceId:target.evidenceId}).dataUrl,`data:image/png;base64,${png}`)
    assert.doesNotMatch(JSON.stringify(floor),/data:image|iVBOR/)
  } finally {await driver.close()}
})

test('无类别标题：名称描述合并，四个真实词条由目录确定级别，计算独立',()=>{
  const boon=parseEffectTooltip({status:'located',texts:['X','全知之眼','圣所地图现在完全显示了']},catalog)
  assert.equal(boon.category,'majorBoon');assert.equal(boon.entries.length,1);assert.equal(boon.effects.length,1)
  assert.equal(boon.complete,true);assert.equal(boon.texts[0],'X')
  const afflictions=parseEffectTooltip({status:'located',texts:['钝化之剑','你和你的召唤生物伤害总降40%','过门税款','完成房间时损失30枚耀金币','巫毒人偶','坚毅低于50%时，失去的坚毅增加100%']},catalog)
  assert.equal(afflictions.category,'minorAffliction');assert.equal(afflictions.entries.length,3)
  assert.equal(afflictions.status,'read');assert.equal(afflictions.entries[0].calculationStatus,'supported')
  const mixed=parseEffectTooltip({status:'located',texts:['全知之眼','钝化之剑']},catalog)
  assert.equal(mixed.entries.length,2)
  assert.deepEqual(mergeEffectGroups([mixed],true).filter(g=>g.status==='read').map(g=>g.category),['majorBoon','minorAffliction'])
})

test('换行、未知文字、歧义、截断及缺失级别分别保留',()=>{
  assert.equal(parseEffectTooltip({status:'located',texts:['圣所地图现在','完全显示了']},catalog).entries[0].name,'全知之眼')
  const entry=catalog.entries.find(e=>e.name==='全知之眼')
  const ambiguous={...catalog,entries:[entry,{...entry,id:'duplicate'}]}
  assert.equal(parseEffectTooltip({status:'located',texts:['全知之眼']},ambiguous).entries.length,0)
  const unknown=parseEffectTooltip({status:'located',texts:['无关天气预报']},catalog)
  assert.equal(unknown.complete,false);assert.ok(unknown.effects.some(e=>e.rawText==='无关天气预报'))
  assert.equal(parseEffectTooltip({status:'partial',texts:['全知之眼'],reason:'截断'},catalog).complete,false)
  const missing=parseEffectTooltip({status:'located',texts:['全知之眼']},{...catalog,entries:[{...entry,tier:null}]})
  assert.equal(missing.entries[0].name,'全知之眼');assert.equal(missing.entries[0].category,null)
  const conflict=parseEffectTooltip({status:'located',texts:['全知之眼','圣所地图现在完全显示了99']},catalog)
  assert.equal(conflict.entries[0].calculationStatus,'unsupported')
  assert.ok(conflict.effects.every(e=>e.status==='unknown'))
})

test('原始截图局部回放：自动范围包含完整四条词缀，OCR 后匹配；静止旧浮窗不算新内容',()=>{
  const results=runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import load_image
from sanctum_tooltip import locate_content
from sanctum_ocr import create_sanctum_ocr_engine,read_room_ocr
frames=[]
for name in ['effect-boon','effect-afflictions']:
 im=np.pad(load_image('test/fixtures/sanctum/'+name+'.png'),((800,0),(1100,1440),(0,0)),mode='edge')
 frames.append(im)
engine=create_sanctum_ocr_engine();out=[]
for base,im,point in [(frames[1],frames[0],(1650,1440)),(frames[0],frames[1],(1730,1440))]:
 result=locate_content(base,im,point);r=result['region']
 for dy in [6,12]:
  assert locate_content(base,im,(point[0],point[1]+dy))['region']==r
 result.update(read_room_ocr(engine,im[r['y']:r['y']+r['height'],r['x']:r['x']+r['width']]))
 out.append(result)
out.append(locate_content(frames[0],frames[0],(1650,1440)))
print(json.dumps(out))`)
  for(const [i,expected] of [[0,{x:1374,y:1234,width:558,height:164}],[1,{x:1332,y:962,width:796,height:437}]]) {
    for(const key of Object.keys(expected)) assert.ok(Math.abs(results[i].region[key]-expected[key])<=8,`${i} ${key}: ${JSON.stringify(results[i].region)}`)
  }
  assert.equal(parseEffectTooltip(results[0],catalog).entries[0].name,'全知之眼')
  assert.equal(parseEffectTooltip(results[0],catalog).complete,true)
  assert.deepEqual(parseEffectTooltip(results[1],catalog).entries.map(e=>e.name),['钝化之剑','过门税款','巫毒人偶'])
  assert.equal(results[2].status,'unknown')
})
