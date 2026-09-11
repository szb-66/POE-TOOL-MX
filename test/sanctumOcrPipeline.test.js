import { sanctumError } from '../electron/modules/sanctum/errors.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { runPython } from './helpers/python.js'
import { parseSanctumRoomTexts, SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumCapture } from '../electron/modules/sanctum/capture.js'
import { AutomationLock } from '../electron/modules/automation/lock.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'

const catalog = JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json',import.meta.url)))
const environment = {windowId:'game',width:1920,height:1080,dpi:96}
const surface = {environment,foreground:true,userTakeover:false,mapOpen:true,interfaceMatched:true,overlayExcluded:true}
const deferred = () => { let resolve; const promise=new Promise(r=>{resolve=r}); return {promise,resolve} }

test('四张原始裁剪自动剥离标题，真实OCR正文完整，装饰不生成词缀', () => {
  const rows=runPython(`
import sys,json,base64
from pathlib import Path
sys.path.insert(0,'src/assets/scripts')
from sanctum_ocr import create_sanctum_ocr_engine,read_frozen
from sanctum_recognition import load_image
engine=create_sanctum_ocr_engine();out=[]
for name in ['reward','purse','pact','fountain']:
 p=Path('test/fixtures/sanctum/ocr-'+name+'.png');im=load_image(p)
 r=read_frozen({'png':base64.b64encode(p.read_bytes()).decode(),'region':{'x':0,'y':0,'width':im.shape[1],'height':im.shape[0]},'includeIcons':False},engine)
 out.append(r)
print(json.dumps(out,ensure_ascii=False))
`,{timeout:60000})
  assert.deepEqual(rows.map(r=>r.texts),[
    ['完成后提供物品'],
    ['包含次要宝物奖励','在你进入时受到钱包过满折磨','当你被击中而失去坚毅时，损失20枚耀金币'],
    ['包含遭诅契约'],['包含痛苦喷泉']
  ])
  assert.deepEqual(rows.map(r=>r.hasCurrencyOffer),[true,false,false,false])
  for(const row of rows) {
    assert.ok(row.bodyRegion.y > 0)
    assert.ok(row.ocrBlocks.every(b=>b.region.y >= row.bodyRegion.y))
    assert.equal(row.captureMetrics.ocrCalls,1)
  }
  const parsed=rows.map(r=>parseSanctumRoomTexts(r.texts,catalog,[],r))
  assert.deepEqual(parsed.map(r=>r.type),['reward','treasure','pact','fountain'])
  assert.deepEqual(parsed[1].recognition.matches.map(m=>m.name),['次要宝藏','钱包过满'])
  assert.equal(parsed[1].recognition.matches[1].evidence.length,2)
  assert.equal(parsed[1].afflictions.length,1)
  assert.ok(parsed.every(r=>!r.layout && !/破碎盾牌|光辉漆彩/.test(JSON.stringify(r))))
})

test('不同缩放共用几何正文边界，无标题框选保留首行并映射回整图坐标', () => {
  const result=runPython(`
import sys,json,cv2,base64,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_ocr import room_body_region,read_frozen
from sanctum_recognition import load_image
im=load_image('test/fixtures/sanctum/ocr-pact.png');regions=[]
for scale in [.65,1,1.5]:
 view=cv2.resize(im,None,fx=scale,fy=scale);r=room_body_region(view);regions.append(r['y']/scale)
body=im[95:];canvas=np.zeros((200,1200,3),np.uint8);canvas[20:20+body.shape[0],30:30+body.shape[1]]=body
_,png=cv2.imencode('.png',canvas)
engine=lambda view:[[[[4,2],[104,2],[104,22],[4,22]],'包含遭诅契约',.9]]
r=read_frozen({'png':base64.b64encode(png).decode(),'region':{'x':30,'y':20,'width':body.shape[1],'height':body.shape[0]},'includeIcons':False},engine)
print(json.dumps({'regions':regions,'read':r}))
`)
  assert.ok(result.regions.every(y=>y>70 && y<95))
  assert.equal(result.read.bodyRegion.y,20)
  assert.deepEqual(result.read.texts,['包含遭诅契约'])
  assert.deepEqual(result.read.ocrBlocks[0].region,{x:34,y:22,width:100,height:20})
})

test('名称与独立噪声不污染正文；不同数值变体、独立效果和合法数字保留', () => {
  const parsed=parseSanctumRoomTexts(['破旧书库、圣物厅、禁域战场、王陵','0','包含遭诅契约'],catalog)
  assert.deepEqual(parsed.recognition.matches.map(m=>m.name),['被诅咒的冥约'])
  assert.equal(parsed.type,'pact')
  const variants=catalog.entries.filter(e=>e.name==='伤亡代价' && e.descriptions.some(d=>/完成/.test(d))).slice(0,2)
  const multiple=parseSanctumRoomTexts(variants.map(e=>e.descriptions[0]),catalog)
  assert.deepEqual(multiple.recognition.matches.map(m=>m.entryId),variants.map(e=>e.id))
  const values=parseSanctumRoomTexts(['包含喷泉','恢复 25 点坚毅','完成本轮时获得 2 神圣石'],catalog)
  assert.equal(values.recovery,25);assert.equal(values.rewards[0].quantity,2)
  assert.equal(parseSanctumRoomTexts([],catalog).readStages.ocr,'empty')
  assert.equal(parseSanctumRoomTexts(['包含','遭诅契约'],catalog).type,'pact')
  const wrapped=parseSanctumRoomTexts(['当你被击中而失去坚毅时，损失','20','枚耀金币'],catalog)
  assert.equal(wrapped.recognition.matches.length,1)
  assert.equal(wrapped.recognition.matches[0].name,'钱包过满')
  assert.equal(wrapped.recognition.matches[0].numericCompatible,true)
})

test('停止清除所有读取中阶段，图标未完成不丢失文字和已保存效果',async()=>{
  const service=new SanctumService({solver:{cancel(){},shutdown:async()=>{}}})
  service.state.status='capturing'
  service.state.floor={rooms:[{id:'a',detailsStatus:'reading',readStages:{ocr:'queued'}},
    {id:'b',detailsStatus:'partial',rawText:'完成后提供物品',readStages:{ocr:'matched',icons:'queued'}}]}
  service.stop()
  assert.equal(service.state.floor.rooms[0].readStages.ocr,'failed')
  assert.equal(service.state.floor.rooms[1].readStages.icons,'failed')
  assert.equal(service.state.floor.rooms[1].readStages.ocr,'matched')
  assert.equal(service.state.floor.rooms[1].rawText,'完成后提供物品')
  await service.shutdown()
})

function pipelineFixture() {
  const lock=new AutomationLock(), ended=deferred(), updates=[],calls=[]
  const driver={inspect:()=>surface,subscribeSafety:()=>()=>{},
    async *frames(){yield {...surface,floor:{runId:'r',floorId:'f',identityConfirmed:true,rooms:['a','b'].map((id,column)=>({id,column,row:0,revealed:true})),edges:[]}}},
    async endCapture(){calls.push('endCapture');ended.resolve()}
  }
  const capture=new SanctumCapture({driver,automationLock:lock})
  return {driver,capture,lock,ended,updates,calls,run:options=>capture.run(environment,f=>updates.push(f),()=>{},options)}
}

test('单项采集超时，已截图OCR继续提交；图标补充在文字后且无新输入', async () => {
  const f=pipelineFixture()
  f.driver.captureRoom=async(room,{signal,captureSignal})=>{
    f.calls.push(room.id)
    if(room.id==='b') throw sanctumError('STEP_TIMEOUT','当前步骤超时')
    return {recognition:f.ended.promise.then(()=>{signal.throwIfAborted();return {patch:{name:'契约',detailsStatus:'matched',rawText:'包含遭诅契约'}}}),
      supplement:async()=>{f.calls.push('icons');return null}}
  }
  assert.equal(await f.run(),'partial')
  assert.equal(f.updates.at(-1).rooms[0].name,'契约')
  assert.equal(f.updates.at(-1).rooms[1].detailsStatus,'failed')
  assert.deepEqual(f.calls,['a','b','endCapture','icons'])
  assert.equal(f.lock.getState().locked,false)
})

for(const mode of ['stop']) test(`识别阶段${mode}保留已提交文字、清理未完成状态且拒绝迟到覆盖`,async()=>{
  const f=pipelineFixture()
  f.driver.captureRoom=async(room,{signal})=>({recognition:room.id==='a'?Promise.resolve({patch:{detailsStatus:'matched',rawText:'已读'}})
    :new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}))})
  const task=f.run()
  await f.ended.promise
  if(mode==='stop')f.capture.stop()
  const outcome=await task
  assert.equal(f.updates.at(-1).rooms[0].rawText,'已读')
  assert.equal(f.capture.session,null)
})

test('真实驱动先提交文字，只有物品奖励延后扫描图标且不重复OCR',async()=>{
  const commands=[]
  const driver=new SanctumLiveDriver({catalog,makeClient:()=>({async request(command,input){if(command==='prepareOcr')return {ready:true};commands.push([command,input]);return input.iconsOnly?{currencyIcons:[],captureMetrics:{iconsMs:2}}:{texts:['完成后提供物品'],hasCurrencyOffer:true,status:'located',captureMetrics:{ocrCalls:1}}},shutdown:async()=>{}})})
  driver.assertLog=()=>({floorId:'f'});driver.profile={};driver.runId='r'
  driver.client={sessionId:'s',request:async()=>({png:'fixture',region:{x:10,y:20,width:100,height:50},status:'located'}),shutdown:async()=>{}}
  const captured=await driver.captureRoom({id:'a'},{signal:new AbortController().signal,guard:()=>{}})
  const text=await captured.recognition
  assert.equal(text.patch.type,'reward');assert.equal(text.patch.readStages.icons,'queued')
  assert.equal(commands.length,1);assert.equal(commands[0][1].includeIcons,false)
  await captured.supplement()
  assert.equal(commands.length,2);assert.equal(commands[1][1].iconsOnly,true)
  await driver.close()
})
