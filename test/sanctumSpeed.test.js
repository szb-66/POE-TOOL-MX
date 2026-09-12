import test from 'node:test'
import assert from 'node:assert/strict'
import { SanctumImageCapacity } from '../electron/modules/sanctum/imageCapacity.js'
import { SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { matchRoomText, recognizeRoomTexts } from '../electron/modules/sanctum/textRecognition.js'
import { runPython } from './helpers/python.js'

const deferred = () => { let resolve, reject; const promise=new Promise((a,b)=>{resolve=a;reject=b}); return {promise,resolve,reject} }
const tick = () => new Promise(resolve=>setImmediate(resolve))

test('图片容量同时限制字节和数量；取消、关闭唤醒等待，重复释放不扣成负数', async()=>{
  const c=new SanctumImageCapacity({count:2,bytes:10}), signal=new AbortController().signal
  const release=await c.acquire(8,signal), abort=new AbortController()
  const waiting=c.acquire(3,abort.signal); abort.abort(); await assert.rejects(waiting)
  assert.equal(c.count,1);assert.equal(c.bytes,8)
  const next=c.acquire(4,signal);release();release();const releaseNext=await next
  assert.equal(c.bytes,4)
  const stopped=c.acquire(7,signal);c.close();await assert.rejects(stopped,/关闭/)
  releaseNext();assert.equal(c.bytes,0);assert.equal(c.count,0)
})

test('图标阻塞时下一房文字仍完成，图像引用沿用身份且最终释放', async()=>{
  const gate=deferred(), commands=[]
  const driver=new SanctumLiveDriver({catalog:{entries:[]},makeClient:()=>({closed:false,
    async request(command,input){
      commands.push({command,input})
      if(command!=='readFrozen')return {}
      if(input.iconsOnly){await gate.promise;return {currencyIcons:[],captureMetrics:{iconsMs:3}}}
      return {texts:['完成后提供物品'],hasCurrencyOffer:true,imageRef:{pool:{name:input.binding.roomId},binding:input.binding},captureMetrics:{ocrCalls:1}}
    },shutdown:async()=>{}})})
  const signal=new AbortController().signal
  driver.assertLog=()=>({floorId:'f'});driver.profile={};driver.runId='r'
  driver.client={sessionId:'s',request:async()=>({png:'encoded',region:{x:3,y:4,width:20,height:30},status:'located'}),shutdown:async()=>{}}
  const a=await driver.captureRoom({id:'a'},{signal,guard:()=>{}});await a.recognition
  const b=await driver.captureRoom({id:'b'},{signal,guard:()=>{}});await b.recognition;await tick()
  assert.equal(commands.filter(c=>c.command==='readFrozen'&&!c.input.iconsOnly).length,2)
  const icon=commands.find(c=>c.input?.iconsOnly)
  assert.equal(icon.input.png,undefined);assert.deepEqual(icon.input.binding,icon.input.imageRef.binding)
  assert.equal(driver.imageCapacity.count,2)
  const c=await driver.captureRoom({id:'c'},{signal,guard:()=>{}})
  await c.recognition
  assert.equal(driver.imageCapacity.count,3)
  assert.equal(driver.queuedImages.bytes,0)
  gate.resolve();await a.supplement();await b.supplement();await c.supplement()
  assert.equal(driver.imageCapacity.count,0)
  assert.equal(driver.queuedImages.bytes,0)
  assert.equal(commands.filter(c=>c.command==='releaseImage').length,3)
  await driver.close()
})

test('词库原地修改及同分排序不会命中旧预处理，独立相同词缀不丢失',()=>{
  const catalog={entries:[{id:'b',kind:'affliction',name:'相同'},{id:'a',kind:'affliction',name:'相同'}]}
  assert.equal(matchRoomText('相同',catalog).entryId,'a')
  catalog.entries[1].name='变化'
  assert.equal(matchRoomText('相同',catalog).entryId,'b')
  assert.equal(recognizeRoomTexts(['相同','相同'],catalog).matches.length,2)
})

for (const mode of ['abort','malformed']) test(`文字响应 ${mode} 不会等待自身队列，保留的图片容量最终归零`,async()=>{
  const gate=deferred(), entered=deferred(), abort=new AbortController()
  const binding={sessionId:'s',runId:'r',floorId:'f',roomId:'a',frameId:1}
  const driver=new SanctumLiveDriver({catalog:{entries:[]},makeClient:()=>({closed:false,
    async request(command){if(command==='readFrozen'){entered.resolve();return gate.promise}return {}},shutdown:async()=>{}})})
  driver.assertLog=()=>({floorId:'f'})
  const task=driver.recognizeCaptured({png:'fixture',region:{x:0,y:0,width:30,height:20}},abort.signal,false,{retainImage:true,binding})
  await entered.promise;if(mode==='abort')abort.abort()
  gate.resolve({imageRef:{pool:{name:'a'},binding},ocrBlocks:mode==='malformed'?{}:[],captureMetrics:{}})
  await assert.rejects(task);await driver.ocrTail
  assert.equal(driver.imageCapacity.count,0)
  await driver.close()
})

test('图标工作进程超时保留文字并释放帧，下一目标使用新进程',async()=>{
  let iconReads=0, iconStarts=0, released=0
  const driver=new SanctumLiveDriver({catalog:{entries:[]},makeClient:()=>({closed:false,
    async request(command,input){
      if(command==='prepareIcons'){iconStarts++;return {}}
      if(command==='releaseImage'){released++;return {}}
      if(command!=='readFrozen')return {}
      if(input.iconsOnly){if(++iconReads===1)throw Object.assign(new Error('timeout'),{code:'STEP_TIMEOUT'});return {currencyIcons:[],captureMetrics:{iconsMs:1}}}
      return {texts:['完成后提供物品'],hasCurrencyOffer:true,imageRef:{pool:{name:input.binding.roomId},binding:input.binding},captureMetrics:{ocrCalls:1}}
    },shutdown:async()=>{}})})
  const signal=new AbortController().signal
  driver.assertLog=()=>({floorId:'f'});driver.profile={};driver.runId='r'
  driver.client={sessionId:'s',request:async()=>({png:'fixture',region:{x:0,y:0,width:20,height:30},status:'located'}),shutdown:async()=>{}}
  const a=await driver.captureRoom({id:'a'},{signal,guard(){}});await a.recognition
  const failed=await a.supplement()
  assert.equal(failed.patch.rawText,'完成后提供物品');assert.equal(failed.patch.readStages.icons,'timeout')
  const b=await driver.captureRoom({id:'b'},{signal,guard(){}});await b.recognition;await b.supplement()
  assert.equal(iconStarts,2);assert.equal(released,2);assert.equal(driver.imageCapacity.count,0)
  await driver.close()
})

test('跨进程图片复用不重新解码；错误身份、超容量和最后句柄释放',()=>{
  const result=runPython(`
import sys,json,base64,cv2,numpy as np,subprocess
sys.path.insert(0,'src/assets/scripts')
from sanctum_frozen_image import FrozenImages,open_image
import sanctum_ocr as o
binding=dict(sessionId='s',runId='r',floorId='f',roomId='a',frameId=1)
image=np.full((30,120,3),35,np.uint8);_,png=cv2.imencode('.png',image)
engine=lambda im:[[[[1,1],[110,1],[110,20],[1,20]],'完成后提供物品',.99]]
store=FrozenImages(count=1)
r=o.read_frozen(dict(png=base64.b64encode(png).decode(),region=dict(x=0,y=0,width=120,height=30),includeIcons=False,retainImage=True,binding=binding),engine,store)
ref=r['imageRef'];errors=[]
try: store.retain(image,binding)
except ValueError: errors.append('capacity')
try: open_image(ref,{**binding,'frameId':2})
except ValueError: errors.append('identity')
code="import sys,json;sys.path.insert(0,'src/assets/scripts');from sanctum_ocr import read_frozen;print(json.dumps(read_frozen(json.load(sys.stdin))))"
request=dict(imageRef=ref,binding=binding,region=dict(x=0,y=0,width=120,height=30),iconsOnly=True,includeIcons=False)
second=json.loads(subprocess.run([sys.executable,'-c',code],input=json.dumps(request),text=True,capture_output=True,check=True).stdout)
store.release({**ref,'deadlineAt':123,'captureWindows':[]});store.release(ref)
try: open_image(ref,binding)
except ValueError: errors.append('released')
print(json.dumps(dict(errors=errors,first=r['captureMetrics']['decodeCalls'],second=second['captureMetrics']['decodeCalls'],bytes=store.bytes)))
`)
  assert.deepEqual(result,{errors:['capacity','identity','released'],first:1,second:0,bytes:0})
})

test('并行候选扫描与顺序扫描结果完全一致，包含贴边、多币种与空白',()=>{
  const result=runPython(`
import sys,json,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_rewards import recognize_currency_icons,templates
from sanctum_recognition import load_image
cv2.setNumThreads(1)
canvas=np.full((130,300,3),35,np.uint8)
for (name,art),x,y in zip(templates()[:2],[0,220],[0,55]):
 art=cv2.resize(art,(40,40));alpha=art[:,:,3:4].astype(float)/255
 canvas[y:y+40,x:x+40]=(art[:,:,:3]*alpha+canvas[y:y+40,x:x+40]*(1-alpha)).astype(np.uint8)
images=[canvas,load_image('test/fixtures/sanctum/ocr-reward.png')[84:],np.full((90,200,3),35,np.uint8)]
results=[]
for image in images:
 a=recognize_currency_icons(image,workers=1);b=recognize_currency_icons(image,workers=4)
 results.append(a==b)
print(json.dumps(results))
`)
  assert.deepEqual(result,[true,true,true])
})
