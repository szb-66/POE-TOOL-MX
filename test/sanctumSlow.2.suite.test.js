import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { SanctumFramePipeline as _m0_SanctumFramePipeline } from '../electron/modules/sanctum/framePipeline.js'
import { SanctumCapture as _m0_SanctumCapture } from '../electron/modules/sanctum/capture.js'
import { AutomationLock as _m0_AutomationLock } from '../electron/modules/automation/lock.js'
import { captureButton as _m0_captureButton } from '../shared/sanctumPresentation.js'
import { sanctumControlState as _m0_sanctumControlState } from '../electron/modules/sanctum/controlOverlay.js'
import { runPython as _m0_runPython, pythonPath as _m0_pythonPath } from './helpers/python.js'
import { SanctumNativeClient as _m0_SanctumNativeClient } from '../electron/modules/sanctum/nativeClient.js'
import { SanctumProgress as _m0_SanctumProgress } from '../electron/modules/sanctum/progress.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { SanctumLiveDriver as _m1_SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumFramePipeline as _m1_SanctumFramePipeline } from '../electron/modules/sanctum/framePipeline.js'
import { SanctumImageCapacity as _m1_SanctumImageCapacity } from '../electron/modules/sanctum/imageCapacity.js'
import { runPython as _m1_runPython } from './helpers/python.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { runPython as _m2_runPython } from './helpers/python.js'
import { sanctumDisplay as _m2_sanctumDisplay, sanctumPositionUnconfirmed as _m2_sanctumPositionUnconfirmed } from '../shared/sanctumDisplay.js'
import { parseSanctumRoomTexts as _m2_parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumCapture as _m2_SanctumCapture } from '../electron/modules/sanctum/capture.js'
import { AutomationLock as _m2_AutomationLock } from '../electron/modules/automation/lock.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { runPython as _m3_runPython } from './helpers/python.js'
import { planSanctumFloor as _m3_planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { createSanctumStrategy as _m3_createSanctumStrategy } from '../shared/sanctum.js'
import { sanctumDisplay as _m3_sanctumDisplay, sanctumPositionUnconfirmed as _m3_sanctumPositionUnconfirmed } from '../shared/sanctumDisplay.js'
import { sanctumPageDisplay as _m3_sanctumPageDisplay } from '../shared/sanctumPresentation.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import _m4_fs from 'node:fs'
import _m4_os from 'node:os'
import _m4_path from 'node:path'
import { SanctumLiveDriver as _m4_SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumCapture as _m4_SanctumCapture } from '../electron/modules/sanctum/capture.js'
import { SanctumService as _m4_SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository as _m4_SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { AutomationLock as _m4_AutomationLock } from '../electron/modules/automation/lock.js'
import { runPython as _m4_runPython } from './helpers/python.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import _m5_fs from 'node:fs'
import { SanctumLiveDriver as _m5_SanctumLiveDriver, parseSanctumRoomTexts as _m5_parseSanctumRoomTexts, parseSanctumCurrentEffects as _m5_parseSanctumCurrentEffects } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumService as _m5_SanctumService } from '../electron/modules/sanctum/service.js'
import { AutomationLock as _m5_AutomationLock } from '../electron/modules/automation/lock.js'
import { liveProfile as _m5_liveProfile, liveRegions as _m5_liveRegions } from '../shared/sanctumLive.js'
import { SEASON_BASELINE as _m5_SEASON_BASELINE } from '../shared/seasonBaseline.js'
import { applySanctumEffects as _m5_applySanctumEffects } from '../shared/sanctum.js'
import { runPython as _m5_runPython } from './helpers/python.js'
import { sanctumLogEvents as _m5_sanctumLogEvents } from './helpers/sanctumLog.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { SanctumLogContext as _m6_SanctumLogContext, sanctumLogFloor as _m6_sanctumLogFloor } from '../electron/modules/sanctum/logContext.js'
import { SanctumLiveDriver as _m6_SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumService as _m6_SanctumService } from '../electron/modules/sanctum/service.js'
import { AutomationLock as _m6_AutomationLock } from '../electron/modules/automation/lock.js'
import { sanctumLogEvents as _m6_sanctumLogEvents } from './helpers/sanctumLog.js'
import { liveProfile as _m6_liveProfile } from '../shared/sanctumLive.js'
import { runPython as _m6_runPython } from './helpers/python.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { runPython as _m7_runPython } from './helpers/python.js'
import { sanctumDisplay as _m7_sanctumDisplay } from '../shared/sanctumDisplay.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { runPython as _m8_runPython } from './helpers/python.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { spawn as _m9_spawn } from 'node:child_process'
import { EventEmitter as _m9_EventEmitter } from 'node:events'
import { SanctumNativeClient as _m9_SanctumNativeClient } from '../electron/modules/sanctum/nativeClient.js'
import { runPython as _m9_runPython } from './helpers/python.js'
import { sanctumError as _m10_sanctumError } from '../electron/modules/sanctum/errors.js'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import _m10_fs from 'node:fs'
import { runPython as _m10_runPython } from './helpers/python.js'
import { parseSanctumRoomTexts as _m10_parseSanctumRoomTexts, SanctumLiveDriver as _m10_SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumCapture as _m10_SanctumCapture } from '../electron/modules/sanctum/capture.js'
import { AutomationLock as _m10_AutomationLock } from '../electron/modules/automation/lock.js'
import { SanctumService as _m10_SanctumService } from '../electron/modules/sanctum/service.js'

// === Merged from sanctumFastPipeline.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const SanctumFramePipeline = _m0_SanctumFramePipeline
  const SanctumCapture = _m0_SanctumCapture
  const AutomationLock = _m0_AutomationLock
  const captureButton = _m0_captureButton
  const sanctumControlState = _m0_sanctumControlState
  const runPython = _m0_runPython
  const pythonPath = _m0_pythonPath
  const SanctumNativeClient = _m0_SanctumNativeClient
  const SanctumProgress = _m0_SanctumProgress
const deferred = () => { let resolve,reject; const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject} }
const tick = () => new Promise(resolve=>setImmediate(resolve))
const env = {windowId:'game',width:100,height:100,dpi:96}
const safe = {environment:env,foreground:true,interfaceMatched:true,mapOpen:true,userTakeover:false,overlayExcluded:true}

test('空队列及重复/迟到事件不伪造计数，截图结束分母固定，停止保留退出文案',()=>{
  const p=new SanctumProgress();p.rooms(0);p.finishCapture()
  assert.deepEqual(p.snapshot().analysis,{current:0,total:0,failed:0})
  p.queue('late');p.effects(4);p.analyzed('late',true)
  assert.equal(p.snapshot().stage,'recognizing');assert.equal(p.snapshot().analysis.total,0)
  assert.equal(captureButton({captureDraining:true,progress:{stage:'stopped'}}).label,'正在结束')
  const q=new SanctumProgress();q.rooms(2);q.queue('a');q.queue('a');q.queue('b');q.analyzed('a',true);q.analyzed('a',true)
  assert.deepEqual(q.snapshot().analysis,{current:1,total:2,failed:1})
})

test('后处理阻塞时继续冻结；容量等待可取消，基线与帧不会被提前复用',async()=>{
  const gate=deferred(), events=[], signal=new AbortController().signal
  const client={child:{},closed:false,request:async command=>command==='prepareFrames'?{count:3}:gate.promise,shutdown:async()=>{gate.reject(new Error('closed'))}}
  const pipeline=new SanctumFramePipeline({client,onEvidence:(context,event)=>events.push(context.roomId)})
  await pipeline.prepare(env,signal)
  const moves=[]
  const native={request:async(command,input)=>{
    if(command==='freezeBaseline')return {baselineVersion:7}
    moves.push(input.frozen.slot)
    return {frozenFrame:{...input.frozen,mode:'map',point:[1,1]}}
  }}
  const context=id=>({runId:'r',floorId:'f',roomId:id,sessionId:'s',signal})
  const a=await pipeline.freeze(native,'hover',{},context('a'),signal)
  const first=pipeline.process(a,signal);first.catch(()=>{})
  const b=await pipeline.freeze(native,'hover',{},context('b'),signal)
  assert.equal(moves.length,2); assert.notEqual(moves[0],moves[1])
  const abort=new AbortController()
  const waiting=pipeline.freeze(native,'hover',{},context('c'),abort.signal)
  await tick();assert.equal(moves.length,2)
  abort.abort();await assert.rejects(waiting)
  pipeline.evidence({frameId:1,targetId:'b',captureSessionId:'s',baselineVersion:7})
  pipeline.evidence({frameId:1,targetId:'a',captureSessionId:'old',baselineVersion:7})
  pipeline.evidence({frameId:1,targetId:'a',captureSessionId:'s',baselineVersion:7})
  assert.deepEqual(events,['a'])
  b.release(); gate.resolve({texts:[]}); await first
  pipeline.invalidateBaseline(); assert.equal(pipeline.free.length,3)
  await pipeline.close()
})

test('后处理进程故障结束排队任务，释放全部槽位并唤醒容量等待',async()=>{
  const signal=new AbortController().signal, gate=deferred()
  const client={child:{},closed:false,request:async command=>command==='prepareFrames'?{count:3}:gate.promise,shutdown:async()=>{}}
  const p=new SanctumFramePipeline({client});await p.prepare(env,signal)
  const native={request:async(command,input)=>command==='freezeBaseline'?{baselineVersion:1}:{frozenFrame:input.frozen}}
  const context={runId:'r',floorId:'f',roomId:'a',sessionId:'s',signal}
  const a=await p.freeze(native,'hover',{},context,signal),b=await p.freeze(native,'hover',{},context,signal)
  const jobs=[p.process(a,signal),p.process(b,signal)]
  const settled=Promise.allSettled(jobs)
  const pending=p.acquire(signal);pending.catch(()=>{})
  await tick(); client.child=null;gate.reject(new Error('worker exited'))
  assert.ok((await settled).every(r=>r.status==='rejected'))
  await assert.rejects(pending,/worker exited/)
  p.invalidateBaseline();assert.equal(p.free.length,3);await p.close()
})

function fixture() {
  const updates=[], lock=new AutomationLock(), ended=deferred()
  const driver={inspect:()=>safe,subscribeSafety:()=>()=>{},
    async *frames(){yield {...safe,floor:{runId:'r',floorId:'f',identityConfirmed:true,rooms:['a','b'].map((id,column)=>({id,column,row:0,revealed:true})),edges:[]}}},
    endCapture:async()=>ended.resolve()}
  const capture=new SanctumCapture({driver,automationLock:lock})
  return {driver,updates,ended,capture,run:()=>capture.run(env,f=>updates.push(f))}
}

test('截图结束后按钮显示真实分析计数，图标后补和效果结束前不提前完成',async()=>{
  const f=fixture(), text=deferred(), icons=deferred(), effect=deferred(), cleanup=deferred()
  f.driver.captureRoom=async room=>({recognition:text.promise.then(()=>({patch:{detailsStatus:'matched',readStages:{ocr:'matched'}}})),
    needsSupplement:()=>room.id==='a',supplement:()=>room.id==='a'?icons.promise:null})
  f.driver.finalizeFloor=async(floor,signal,{finishCapture,onTaskProgress})=>{
    onTaskProgress({kind:'targets',total:1});onTaskProgress({kind:'queued',targetId:'effect:1'});onTaskProgress({kind:'captured',targetId:'effect:1'})
    await finishCapture();await effect.promise
    onTaskProgress({kind:'analyzed',targetId:'effect:1'});return floor
  }
  f.driver.finishProcessing=()=>cleanup.promise
  const task=f.run();await f.ended.promise
  let progress=f.updates.at(-1).captureProgress
  assert.equal(progress.stage,'recognizing');assert.deepEqual(progress.analysis,{current:0,total:3,failed:0})
  const state={running:true,progress,enabled:true,liveCalibration:{},observation:{...safe,receivedAt:10}}
  assert.equal(captureButton(state).label,'分析中 0/3')
  assert.equal(sanctumControlState(state,{},null,10).label,'分析中 0/3')
  text.resolve();await tick();progress=f.updates.at(-1).captureProgress
  assert.equal(progress.analysis.current,1)
  effect.resolve();await tick();assert.equal(f.updates.at(-1).captureProgress.analysis.current,2)
  icons.resolve(null);await tick();assert.equal(f.updates.at(-1).captureProgress.stage,'completing')
  cleanup.resolve();assert.equal(await task,'complete')
  assert.ok(f.updates.filter(f=>f.captureProgress.capture.finished).every(f=>!['rooms','effects'].includes(f.captureProgress.stage)))
  assert.equal(f.updates.at(-1).captureProgress.analysis.current,3)
})

test('Windows真实独立进程持有共享画面，生产者退出后仍可处理，最后句柄关闭即释放',()=>{
  const result=runPython(`
import sys,json,subprocess,ctypes
sys.path.insert(0,'src/assets/scripts')
from sanctum_frames import FramePool
pool=FramePool(100,80,budget=100*80*3*3)
code="import sys,json;sys.path.insert(0,'src/assets/scripts');from sanctum_frames import open_mapping,frame_view;s=json.loads(sys.argv[1]);m=open_mapping(s);frame_view(m,s,1)[:]=123;m.close()"
subprocess.run([sys.executable,'-c',code,json.dumps(pool.spec)],check=True)
assert int(pool.view(1)[0,0,0])==123
kernel=ctypes.windll.kernel32
kernel.OpenFileMappingW.restype=ctypes.c_void_p
kernel.CloseHandle.argtypes=[ctypes.c_void_p]
name=pool.spec['name'];handle=kernel.OpenFileMappingW(4,False,name)
assert handle;kernel.CloseHandle(handle)
pool.close()
assert not kernel.OpenFileMappingW(4,False,name)
print(json.dumps({'retained':True,'released':True}))
`)
  assert.deepEqual(result,{retained:true,released:true})
})

test('真实后处理进程通过原图引用生成同源证据，控制响应不包含原始像素',async()=>{
  const signal=new AbortController().signal,events=[]
  let p
  const client=new SanctumNativeClient({resolveRuntime:async()=>({path:pythonPath}),onEvidence:e=>p.evidence(e)})
  p=new SanctumFramePipeline({client,onEvidence:(binding,e)=>events.push({id:binding.roomId,frame:e})})
  try {
    await p.prepare({width:1000,height:800},signal)
    const native={request:async(command,input)=>{
      const spec=command==='freezeBaseline'?input:input.frozen
      runPython(`
import sys,json,cv2
sys.path.insert(0,'src/assets/scripts')
from sanctum_frames import open_mapping,frame_view
spec=json.loads(${JSON.stringify(JSON.stringify(spec))})
m=open_mapping(spec['pool']);view=frame_view(m,spec['pool'],spec['slot']);view[:]=150
if ${command==='freezeBaseline'?'False':'True'}:
 cv2.rectangle(view,(100,100),(340,260),(20,20,20),-1)
 cv2.putText(view,'Room',(130,160),cv2.FONT_HERSHEY_SIMPLEX,1,(220,220,220),2)
del view;m.close();print('{}')
`)
      return command==='freezeBaseline'?{baselineVersion:1}:{frozenFrame:{slot:spec.slot,baselineSlot:spec.baselineSlot,
        baselineVersion:1,frameId:spec.frameId,mode:'map',point:[200,280],mapRegion:{x:0,y:0,width:1000,height:800}},captureMetrics:{contentScreenshots:1}}
    }}
    const frozen=await p.freeze(native,'hover',{}, {runId:'r',floorId:'f',roomId:'a',sessionId:'capture',signal},signal)
    assert.ok(JSON.stringify(frozen.data).length<500)
    const result=await p.process(frozen,signal)
    assert.equal(events.length,1);assert.equal(events[0].id,'a')
    assert.equal(events[0].frame.kind,'room-crop')
    assert.equal(events[0].frame.sourceWidth,1000)
    assert.equal(events[0].frame.width,events[0].frame.sourceRegion.width)
    assert.equal(result.captureMetrics.contentScreenshots,1)
    for (const key of ['locateMs','encodeMs','evidenceTransferMs','diagnosticMs','postprocessMs']) assert.ok(result.captureMetrics[key]>=0,key)
    p.invalidateBaseline();assert.equal(p.free.length,p.pool.count)
  } finally {await p.close()}
})
})()

// === Merged from sanctumForegroundSpeed.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const SanctumLiveDriver = _m1_SanctumLiveDriver
  const SanctumFramePipeline = _m1_SanctumFramePipeline
  const SanctumImageCapacity = _m1_SanctumImageCapacity
  const runPython = _m1_runPython
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return {promise,resolve} }
const tick = () => new Promise(resolve => setImmediate(resolve))

test('奖励积压超过八个目标时仍继续截图；原始帧、压缩图片、解码图片分别限流', async () => {
  const gate = deferred(), signal = new AbortController().signal
  let captured = 0
  const driver = new SanctumLiveDriver({catalog:{entries:[]},makeClient:()=>({
    async request(command, input) {
      if (command !== 'readFrozen') return {}
      if (input.iconsOnly) { await gate.promise; return {currencyIcons:[],captureMetrics:{}} }
      return {texts:['完成后提供物品'],hasCurrencyOffer:true,imageRef:{pool:{name:input.binding.roomId},binding:input.binding},captureMetrics:{}}
    },async shutdown() {}
  })})
  driver.assertLog = () => ({floorId:'f'}); driver.profile = {}; driver.runId = 'r'
  driver.client = {sessionId:'s',async request() { captured++;return {png:'image',region:{x:0,y:0,width:10,height:10},status:'located'} },async shutdown() {}}
  const jobs = []
  try {
    for (let i=0;i<16;i++) jobs.push(await driver.captureRoom({id:String(i)},{signal,guard(){}}))
    await tick()
    assert.equal(captured,16)
    assert.equal(driver.imageCapacity.count,8)
    assert.ok(driver.queuedImages.bytes > 0)
    gate.resolve()
    await Promise.all(jobs.map(job=>job.recognition))
    await Promise.all(jobs.map(job=>job.supplement()))
    assert.equal(driver.queuedImages.bytes,0)
    assert.equal(driver.imageCapacity.bytes,0)
  } finally { gate.resolve();await driver.close() }
})

test('输出图片预算满时原始帧保持租约；停止唤醒等待并释放帧', async () => {
  const abort = new AbortController(), capacity = new SanctumImageCapacity({count:2,bytes:4})
  const release = await capacity.acquire(4,abort.signal)
  let released = 0
  const pipeline = new SanctumFramePipeline({client:{async request(){return {png:'abcd'}},async shutdown(){}},onEvidence(){}})
  const work = pipeline.process({data:{frozenFrame:{}},binding:{frameId:1},release(){released++}},abort.signal,
    async value=>{await capacity.acquire(4,abort.signal);return value})
  await tick();assert.equal(released,0)
  abort.abort();await assert.rejects(work)
  assert.equal(released,1);release();assert.equal(capacity.bytes,0)
  await pipeline.close()
})

test('状态栏悬停和释放鼠标不等待资源 OCR；整轮完成仍等待资源结果', async () => {
  const gate = deferred(), signal = new AbortController().signal, events = []
  const driver = new SanctumLiveDriver({catalog:{entries:[]}})
  driver.assertLog = () => ({floorId:'f'})
  driver.profile = {coinsRegion:{x:0,y:0,width:10,height:10}}
  driver.sessionRequest = async () => ({regions:{coinsRegion:{png:'image',region:{x:0,y:0,width:10,height:10}}},interfaceState:{mapOpen:true,hudLayout:'map'}})
  driver.recognizeCaptured = async () => { events.push('ocr-start');await gate.promise;events.push('ocr-end');return {texts:[]} }
  driver.finalizeCapturedFloor = async (floor,signal,{queueResources,finishCapture}) => {
    const layout = await queueResources();assert.equal(layout.hudLayout,'map')
    events.push('hover-effects');await finishCapture();return floor
  }
  let completed = false
  const job = driver.finalizeFloor({identityConfirmed:true,currentRoomId:'a',runId:'r',floorId:'f'},signal,
    {finishCapture:async()=>{events.push('input-released')}}).then(value=>{completed=true;return value})
  await tick();assert.ok(events.includes('hover-effects'));assert.ok(events.includes('input-released'));assert.equal(completed,false)
  gate.resolve();const result=await job
  assert.ok(result.runObservation);assert.ok(result.captureMetrics.effectsTotalMs >= result.captureMetrics.effectsCaptureMs)
  await driver.close()
})

test('成功后保温只保留模型：重开使用新采集身份，过期和停止关闭模型', async t => {
  t.mock.timers.enable({apis:['setTimeout']})
  let made=0, resets=0, stopped=0
  const driver = new SanctumLiveDriver({catalog:{entries:[]},makeClient:()=>({sessionId:String(++made),
    async request(command){if(command==='resetImages')resets++;return {}},async shutdown(){stopped++}
  })})
  const signal = new AbortController().signal
  await driver.open();const first=driver.client.sessionId
  await driver.prepareOcr(signal);const ocr=driver.ocrClient
  await driver.finishProcessing({keepWarm:true});await driver.close({keepWarm:true})
  assert.equal(resets,1);assert.equal(driver.ocrClient,null)
  await driver.open();assert.notEqual(driver.client.sessionId,first);assert.equal(driver.ocrClient,ocr)
  assert.equal(driver.imageCapacity.bytes,0);assert.equal(driver.queuedImages.bytes,0)
  await driver.prepareOcr(signal);await driver.finishProcessing({keepWarm:true})
  t.mock.timers.tick(60000);await tick();assert.equal(driver.warmWorkers,null)
  assert.ok(stopped >= 3)
  await driver.close()
})

test('失败的图片重置禁止保温，显式关闭立即结束尚在保温的进程', async () => {
  let stopped=0
  const driver=new SanctumLiveDriver({catalog:{entries:[]},makeClient:()=>({async request(command){if(command==='resetImages')throw new Error('reset failed');return {}},async shutdown(){stopped++}})})
  await driver.prepareOcr(new AbortController().signal)
  await driver.finishProcessing({keepWarm:true})
  assert.equal(driver.warmWorkers,undefined);assert.equal(stopped,2)
  driver.warmWorkers={ocr:{async shutdown(){stopped++}},icons:{async shutdown(){stopped++}}}
  await driver.close();assert.equal(stopped,4);assert.equal(driver.warmWorkers,null)
})

test('保温期超时或模型进程崩溃后重新开始，不标记为模型复用', async () => {
  for (const reason of ['expired','crashed']) {
    let stopped=0
    const driver=new SanctumLiveDriver({catalog:{entries:[]},makeClient:()=>({async shutdown(){}})})
    driver.warmWorkers={expiresAt:reason==='expired'?0:performance.now()+60000,
      ocr:{child:reason==='crashed'?null:{},async shutdown(){stopped++}},icons:{async shutdown(){stopped++}}}
    await driver.open()
    assert.equal(driver.usedWarmWorkers,false);assert.equal(stopped,2)
    await driver.close()
  }
})

test('图片重置期间停止不会把已取消的进程放入保温池', async () => {
  const gate=deferred(), entered=deferred(), abort=new AbortController()
  const driver=new SanctumLiveDriver({catalog:{entries:[]},makeClient:()=>({
    async request(command){if(command==='resetImages'){entered.resolve();await gate.promise}return {}},async shutdown(){}
  })})
  await driver.prepareOcr(abort.signal)
  const closing=driver.finishProcessing({keepWarm:true,signal:abort.signal})
  await entered.promise;abort.abort();gate.resolve();await closing
  assert.equal(driver.warmWorkers,null)
  await driver.close()
})

test('采集通道导入不初始化 OCR/图标/后处理；资源与布局使用同一张截图', () => {
  const result=runPython(`
import sys,json,threading,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession
unloaded=[name not in sys.modules for name in ['sanctum_ocr','sanctum_rewards','sanctum_postprocess','sanctum_grid']]
s=NativeSession.__new__(NativeSession);s.expected={};s.input_lock=threading.RLock();s.cancelled=threading.Event()
s.check=lambda: {};s.match_title=lambda *args: True
calls=[]
def image():
 calls.append('screenshot');return np.zeros((20,20,3),np.uint8),{'environment':{}}
s.image=image
s.interface_state=lambda options,snapshot=None: {'mapOpen':True,'hudLayout':'map','sameFrame':snapshot is not None}
r=s.dispatch('readRunPanel',{'coinsRegion':{'x':0,'y':0,'width':10,'height':10}})
print(json.dumps({'unloaded':unloaded,'screenshots':len(calls),'sameFrame':r['interfaceState']['sameFrame']}))
`)
  assert.deepEqual(result,{unloaded:[true,true,true,true],screenshots:1,sameFrame:true})
})
})()

// === Merged from sanctumGenericRooms.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const runPython = _m2_runPython
  const sanctumDisplay = _m2_sanctumDisplay
  const sanctumPositionUnconfirmed = _m2_sanctumPositionUnconfirmed
  const parseSanctumRoomTexts = _m2_parseSanctumRoomTexts
  const SanctumCapture = _m2_SanctumCapture
  const AutomationLock = _m2_AutomationLock
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
})()

// === Merged from sanctumInitialFloor.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const runPython = _m3_runPython
  const planSanctumFloor = _m3_planSanctumFloor
  const createSanctumStrategy = _m3_createSanctumStrategy
  const sanctumDisplay = _m3_sanctumDisplay
  const sanctumPositionUnconfirmed = _m3_sanctumPositionUnconfirmed
  const sanctumPageDisplay = _m3_sanctumPageDisplay
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
})()

// === Merged from sanctumInterruption.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const fs = _m4_fs
  const os = _m4_os
  const path = _m4_path
  const SanctumLiveDriver = _m4_SanctumLiveDriver
  const SanctumCapture = _m4_SanctumCapture
  const SanctumService = _m4_SanctumService
  const SanctumRepository = _m4_SanctumRepository
  const AutomationLock = _m4_AutomationLock
  const runPython = _m4_runPython
const environment = {windowId:'game',width:1000,height:800,dpi:96}
const safe = {environment,foreground:true,userTakeover:false,mapOpen:true,interfaceMatched:true,overlayExcluded:true}

async function fixture(t) {
  let callbacks
  const driver = new SanctumLiveDriver({makeClient: options => { callbacks = options; return {shutdown:async()=>{}} }})
  await driver.open()
  t.after(()=>driver.close())
  driver.latest = safe
  driver.frames = async function* () { yield {...safe,floor:{runId:'r',floorId:'f',identityConfirmed:true,
    rooms:[{id:'a',column:0,row:0,revealed:true},{id:'b',column:1,row:0,revealed:true}],edges:[]}} }
  driver.hover = async () => ({patch:{name:'已读房间',detailsStatus:'matched'}})
  driver.captureRoom = undefined
  driver.endCapture = async () => {}
  driver.finalizeFloor = async value => value
  const lock = new AutomationLock()
  return {driver, lock, unsafe:reason=>callbacks.onSafety({event:'unsafe',reason})}
}

test('非失焦原生安全异常保留真实原因并取消整轮', async t => {
  for (const reason of ['窗口位置、尺寸或 DPI 已变化，请重新校准','采集已停止']) {
    const f = await fixture(t), updates=[], diagnostics=[]
    let inputSignal, released=false
    f.driver.captureRoom = async (room, {signal,captureSignal}) => {
      inputSignal = captureSignal
      if (room.id === 'a') return {recognition:Promise.resolve({patch:{name:'已读房间',detailsStatus:'matched'}})}
      f.unsafe(reason)
      assert.equal(captureSignal.aborted,true)
      assert.equal(signal.aborted,true)
      throw new Error('原生请求已取消')
    }
    f.driver.endCapture = async () => {released=true}
    const capture = new SanctumCapture({driver:f.driver,automationLock:f.lock})
    const task = capture.run(environment,value=>updates.push(value),()=>{}, {onDiagnostics:entries=>diagnostics.push(entries)})
    await assert.rejects(task,{message:reason})
    assert.equal(inputSignal.aborted,true)
    assert.equal(diagnostics.at(-1).at(-1).reason,reason)
    assert.equal(f.lock.getState().locked,false)
  }
})

test('效果扫描中断诊断有界落盘，重启可查原始阶段与原因', async t => {
  const f = await fixture(t)
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sanctum-interruption-'))
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}))
  const repository=new SanctumRepository(root)
  const service=new SanctumService({repository,captureDriver:f.driver,automationLock:f.lock})
  service.setEnabled(true)
  f.driver.finalizeFloor = async () => {
    for(let i=0;i<90;i++) for(const listener of f.driver.progressListeners) listener({diagnostic:{stage:'scanning-effects',outcome:'started',elapsedMs:0,remainingMs:900}})
    for(const listener of f.driver.progressListeners) listener({diagnostic:{stage:'scanning-effects',outcome:'failed',reason:'效果图标范围无效',elapsedMs:150,remainingMs:750}})
    throw new Error('效果图标范围无效')
  }
  await service.startCapture(environment)
  const restored=repository.load()
  assert.equal(restored.floor.captureDiagnostics.length,80)
  assert.equal(restored.floor.captureDiagnostics.at(-1).stage,'scanning-effects')
  assert.equal(restored.floor.captureDiagnostics.at(-1).reason,'效果图标范围无效')
  assert.equal(restored.floor.rooms[0].name,'已读房间')
  assert.equal(restored.floor.identityConfirmed,false)
  assert.equal(restored.running,false)
  assert.match(service.state.reason,/效果图标范围无效/)
})

test('V 延迟确认受共享截止时间约束，只有一组按键，取消或环境变化不继续检查', () => {
  const result=runPython(`
import sys,json,threading,types
from unittest.mock import patch
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
out={}
for case in ['delayed','missing','deadline','cancel','changed']:
    clock=[0.0];keys=[];reads=[]
    s=NativeSession.__new__(NativeSession);s.expected={};s.input_lock=threading.RLock()
    s.deadline_at=220 if case=='deadline' else 20000
    s.u=types.SimpleNamespace(keybd_event=lambda *a:keys.append(a[2]),GetAsyncKeyState=lambda _:0)
    def check():
        if clock[0]*1000>=s.deadline_at:raise NativeError('本轮采集超时')
        if case=='changed' and clock[0]>.1:raise NativeError('窗口位置、尺寸或 DPI 已变化，请重新校准')
    s.check=check
    def wait(delay):
        clock[0]+=delay
        return case=='cancel'
    s.cancelled=types.SimpleNamespace(wait=wait)
    def state(_):
        reads.append(clock[0])
        return {'mapOpen':not keys,'hudVisible':case=='delayed' and clock[0]>=.35}
    s.interface_state=state
    with patch('sanctum_native.time.monotonic',lambda:clock[0]),patch('sanctum_native.time.time',lambda:clock[0]):
        try:s.toggle_map({'targetMode':'effects'});reason=None
        except NativeError as e:reason=str(e)
    out[case]={'keys':keys,'reads':len(reads),'elapsed':clock[0],'reason':reason}
print(json.dumps(out))
`)
  for(const entry of Object.values(result)) assert.deepEqual(entry.keys,[0,2])
  assert.equal(result.delayed.reason,null)
  assert.ok(result.delayed.elapsed>=.35)
  assert.ok(result.missing.elapsed<=1.501)
  assert.match(result.missing.reason,/V 关闭地图超时/)
  assert.ok(result.deadline.elapsed<=.221)
  assert.equal(result.deadline.reason,'本轮采集超时')
  assert.equal(result.cancel.reads,1)
  assert.equal(result.changed.reads,1)
})

test('主动停止同步保存中断原因，旧任务诊断不会覆盖新一轮', async t => {
  const f=await fixture(t),service=new SanctumService({captureDriver:f.driver,automationLock:f.lock})
  service.setEnabled(true)
  f.driver.finalizeFloor=async (_floor,signal)=>{
    service.emergencyStop()
    signal.throwIfAborted()
  }
  await service.startCapture(environment)
  assert.equal(service.state.floor.captureDiagnostics.at(-1).reason,'用户主动停止')
  assert.equal(service.state.floor.rooms[0].name,'已读房间')
  assert.equal(service.state.running,false)
})
})()

// === Merged from sanctumLive.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const fs = _m5_fs
  const SanctumLiveDriver = _m5_SanctumLiveDriver
  const parseSanctumRoomTexts = _m5_parseSanctumRoomTexts
  const parseSanctumCurrentEffects = _m5_parseSanctumCurrentEffects
  const SanctumService = _m5_SanctumService
  const AutomationLock = _m5_AutomationLock
  const liveProfile = _m5_liveProfile
  const liveRegions = _m5_liveRegions
  const SEASON_BASELINE = _m5_SEASON_BASELINE
  const applySanctumEffects = _m5_applySanctumEffects
  const runPython = _m5_runPython
  const sanctumLogEvents = _m5_sanctumLogEvents
const environment = { windowId: 'game', processId: 123, width: 1920, height: 1080, dpi: 96 }
const nativeEnvironment = { environment, clientBounds: { x: 0, y: 0, width: 1920, height: 1080 } }
const regions = { mapRegion: { x: 0, y: 0, width: 1500, height: 800 }, titleRegion: { x: 0, y: 0, width: 500, height: 100 },
  effectIconsRegion: { x: 0, y: 0, width: 1920, height: 1080 }, anchorRegion: { x: 0, y: 0, width: 100, height: 50 } }
const png = fs.readFileSync(new URL('./fixtures/sanctum/map-entry-label.png', import.meta.url)).toString('base64')
const profile = () => liveProfile({ version: 1, environment, ...regions, anchor: { png }, captures: Object.fromEntries(['mapRegion','effectIconsRegion'].map(key => [key, { png, region: regions[key], environment }])) })
const entry = (kind, id, name) => ({ kind, id, name, aliases: [], descriptions: [], sourceId: 's', applicability: 'current', reviewedPatch: SEASON_BASELINE.patch })
const catalog = { schemaVersion: 1, game: 'poe1', patch: SEASON_BASELINE.patch, sources: [{ id: 's', channel: 'official' }],
  entries: [entry('reward','divine','神圣石'),entry('floor', 'f', '圣所档案室'), entry('room', 'room', '喷泉'), entry('affliction', 'pain', '痛苦')] }
const tick = () => new Promise(resolve => setImmediate(resolve))

test('词缀名称与换行描述独立识别并去重，不丢弃 OCR 原文', () => {
  const data=structuredClone(catalog)
  data.entries.find(e=>e.id==='pain').descriptions=['不能恢复坚毅']
  const room=parseSanctumRoomTexts(['喷泉','痛苦','不能恢复','坚毅'],data)
  assert.equal(room.afflictions.length,1)
  assert.equal(room.effects.length,1)
  assert.equal(room.effects[0].rule,'cannotRecover')
  assert.match(room.rawText,/不能恢复\n坚毅/)
  assert.equal(room.detailsStatus,'matched')
})

test('实时区域校验并保留旧区域，旧锚点不会成为标题', () => {
  assert.throws(() => liveRegions({ ...regions, mapRegion: { ...regions.mapRegion, x: -1 } }, environment), /越界/)
  assert.throws(() => liveProfile({ ...profile(), environment: { ...environment, dpi: null } }), /环境/)
  assert.equal(liveProfile({ ...profile(), anchor: { png: 'not-png' } }).anchor, undefined)
  assert.equal(profile().environment.windowId, undefined)
})

test('实时房间与路径参数绑定实际地图裁剪尺寸，效果区域越界拒绝', () => {
  const input = { ...profile(), calibration: { roomSize: [100, 150], pathHsv: [[12, 95, 42], [40, 255, 255]],
    imageSize: [1, 1], region: [-1, -1, 1, 1], dpi: 500 }, effectIconsRegion: regions.titleRegion }
  const saved = liveProfile(input)
  assert.deepEqual(saved.calibration, { version: 1, scope: 'live', imageSize: [1500, 800], region: [0, 0, 1500, 800],
    roomSize: [100, 150], pathHsv: [[12, 95, 42], [40, 255, 255]] })
  assert.deepEqual(liveProfile(saved), saved)
  assert.throws(() => liveProfile({ ...input, effectIconsRegion: { x: 1800, y: 0, width: 200, height: 100 } }), /越界/)
  assert.throws(() => liveProfile({ ...input, calibration: { ...input.calibration, roomSize: [2000, 150] } }), /房间尺寸/)
  assert.throws(() => liveProfile({ ...input, calibration: { ...input.calibration, pathHsv: [[40, 95, 42], [12, 255, 255]] } }), /路径颜色/)
})

test('当前效果读取实际可见规则影响评分条件，未知、歧义和空 OCR 始终保留缺口', () => {
  const effects = parseSanctumCurrentEffects(['不能恢复坚毅', '不能获得恩赐', '陌生效果', '不能恢复坚毅'], catalog)
  const rules = applySanctumEffects(effects)
  assert.equal(rules.cannotRecover, true)
  assert.equal(rules.cannotGainBoons, true)
  assert.equal(effects.filter(effect => effect.rule === 'cannotRecover').length, 1)
  assert.ok(rules.unknown.includes('陌生效果'))
  assert.ok(applySanctumEffects(parseSanctumCurrentEffects([], catalog)).unknown.length)
  assert.equal(applySanctumEffects(parseSanctumCurrentEffects(['constructor'], catalog)).cannotRecover, false)
})

test('原生地图观察只读图结构，不再执行固定区域效果 OCR', () => {
  const value = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
import sanctum_native as native
from sanctum_recognition import validate_calibration
session=native.NativeSession.__new__(native.NativeSession)
session.check=lambda:None
image=np.zeros((600,800,3),dtype=np.uint8)
session.image=lambda:(image,{'environment':{'width':800,'height':600,'dpi':96}})
shapes=[]
def ocr(view):
    shapes.append(list(view.shape)); return ['不能恢复坚毅']
session.ocr=ocr
session.match_title=lambda image, options, current: {'region':{'x':0,'y':0,'width':200,'height':50}}
cal={'version':1,'scope':'live','imageSize':[500,400],'region':[0,0,500,400],'roomSize':[80,120],'pathHsv':[[12,95,42],[40,255,255]]}
def analyze(view,options):
    validate_calibration(options,view.shape[1],view.shape[0])
    assert options==cal
    return {'rooms':[],'edges':[]}
native.analyze_floor=analyze
result=session.observe({'mapRegion':{'x':0,'y':0,'width':500,'height':400},'titleRegion':{'x':0,'y':0,'width':200,'height':50},
    'effectIconsRegion':{'x':500,'y':100,'width':250,'height':300},'areaLevelRegion':{'x':500,'y':0,'width':250,'height':60},'calibration':cal})
print(json.dumps({'shapes':shapes,'hasEffects': 'currentEffectTexts' in result['floor'],'hasTitle': 'titleTexts' in result['floor'], 'hasLevel': 'areaLevelTexts' in result['floor']}))
`)
  assert.deepEqual(value, { shapes: [], hasEffects: false, hasTitle: false, hasLevel: false })
})

test('房间文字保留领取时机、恢复与痛苦；未知及超大数值不伪装为完整识别', () => {
  const parsed = parseSanctumRoomTexts(['喷泉', '恢复 25 点坚毅', '完成本轮时获得 2 神圣石', '痛苦'], catalog)
  assert.equal(parsed.detailsStatus, 'matched')
  assert.equal(parsed.recovery, 25)
  assert.deepEqual(parsed.rewards, [{ groupId:'offer',currency: '神圣石', quantity: 2, timing: 'run' }])
  assert.equal(parsed.afflictions[0].id, 'pain')
  const partial = parseSanctumRoomTexts(['喷泉', '不能理解的效果', '立即获得 999999999999 神圣石'], catalog)
  assert.equal(partial.detailsStatus, 'partial')
  assert.deepEqual(partial.rewards, [])
  assert.ok(partial.effects.some(e=>e.status==='unknown'))
})

function fixture() {
  let time = 0, hidden = false
  const ui = { mode: 'map' }
  const commands = [], clients = []
  const frame = () => ({ ...nativeEnvironment, foreground: true, userTakeover: false, mapOpen: true, interfaceMatched: true,
    mapRegion: regions.mapRegion, fingerprint: 'graph', mapFingerprint: 'graph', timestamp: time += 400,
    floor: { currentRoomId: 'a', positionSource: 'paths', titleTexts: ['圣所档案室'], width: 1500, height: 800, rooms: [
      { id: 'a', column: 0, revealed: true, detailFingerprint: 'a', currentCandidate: true },
      { id: 'b', column: 1, revealed: true, detailFingerprint: 'b', terminal: true }], edges: [{ from: 'a', to: 'b', status: 'matched' }] } })
  const driver = new SanctumLiveDriver({ clientEvents: sanctumLogEvents().events, detection: detection(ui), catalog, wait: tick, withHidden: async action => { hidden = true; try { return await action() } finally { hidden = false } },
    windowActivation: { async activateGame() { return { success: true } } },
    makeClient: () => {
      const client = { closed: false, async request(command, input, { signal } = {}) {
        signal?.throwIfAborted(); commands.push(command)
        if (command === 'prepareFrames') return {count:8}
        if (command === 'freezeBaseline') return {baselineVersion:1}
        if (command === 'environment' || command === 'arm') return nativeEnvironment
        assert.equal(hidden, false)
        if (command === 'interfaceState') return { ...nativeEnvironment, mapOpen: ui.mode === 'map', hudVisible: ui.mode === 'effects', hudLayout: ui.mode === 'effects' ? 'standalone' : null }
        if (command === 'toggleMap') { ui.mode = input.targetMode; return { ...nativeEnvironment, mapOpen: ui.mode === 'map', hudVisible: ui.mode === 'effects', hudLayout: ui.mode === 'effects' ? 'standalone' : null } }
        if (command === 'inspectEffects') return { ...nativeEnvironment, icons: [] }
        if (command === 'observe') return frame()
        if (command === 'hover') return { status: 'located', texts: ['喷泉', '恢复 25 点坚毅'], mapFingerprint: 'graph', observation: frame() }
        throw new Error('unexpected command')
      }, async shutdown() { client.closed = true } }
      clients.push(client); return client
    } })
  return { driver, commands, clients }
}

test('保存截图校准后开始实时推荐贯穿服务，悬停与 OCR 不隐藏整个浮窗', { timeout: 10000 }, async () => {
  const { driver, commands, clients } = fixture(), lock = new AutomationLock()
  const service = new SanctumService({ catalog })
  service.attachLiveDriver(driver, lock); service.setEnabled(true); service.setForeground(true)
  service.state.liveCalibration = profile()
  let recommendation
  const unsubscribe = service.subscribe(state => {
    if (state.recommendation?.paths?.[0]?.nextRoomId === 'b' && state.floor.rooms.find(r=>r.id==='b')?.detailsStatus==='matched') { recommendation = state.recommendation; queueMicrotask(() => service.stop()) }
  })
  await service.startLive()
  assert.equal(recommendation.paths[0].nextRoomId,'b')
  assert.equal(commands.filter(command => command === 'hover').length, 2)
  assert.equal(lock.getState().locked, false)
  assert.equal(service.getState().running, false)
  assert.equal(service.getState().floor.captureStopped, true)
  assert.ok(clients.every(client => client.closed))
  unsubscribe(); await service.shutdown()
})

test('准备时禁用取消等待，迟到的实时环境不会保存或启动输入', async () => {
  let resolve, signal
  const driver = { prepare: (_profile, value) => { signal = value; return new Promise(done => { resolve = done }) }, close: async () => {} }
  const service = new SanctumService({})
  service.attachLiveDriver(driver, new AutomationLock()); service.setEnabled(true)
  service.state.liveCalibration = profile()
  const task = service.startLive(); await tick()
  service.setEnabled(false)
  assert.equal(signal.aborted, true)
  resolve({ ...nativeEnvironment, ...regions }); await task
  assert.equal(service.getState().liveEnvironment, null)
  assert.equal(service.getState().running, false)
  await service.shutdown()
})

test('窗口尺寸失配时不执行 arm 或悬停，楼层确认不依赖中文目录', async () => {
  const f = fixture(), signal = new AbortController().signal
  await assert.rejects(f.driver.prepare({ ...profile(), environment: { ...environment, width: 2000 } }, signal), /校准不符|不一致/)
  assert.equal(f.commands.includes('arm'), false)
  f.driver.catalog = { ...catalog, entries: [] }
  await f.driver.prepare(profile(), signal, new AutomationLock())
  assert.equal(f.driver.inspect().floor.identityConfirmed, true)
  assert.equal(f.driver.inspect().floor.floorId, 'floor:0')
  await f.driver.close()
})

function detection(ui = { mode: 'map' }) {
  return { getTitleConfig: () => ({ templates: { 'sanctum-hud': { png, environment }, 'sanctum-map': { png, environment }, 'sanctum-locker': { png, environment } }, threshold: .8 }),
    registerConsumer: async () => {}, unregisterConsumer: () => {}, subscribe: () => () => {},
    getState: () => ({ running: true, foreground: true, receivedAt: Date.now(), interfaces: { 'sanctum-hud': { matched: true }, 'sanctum-map': { matched: ui.mode === 'map' }, 'sanctum-locker': { matched: true } } }) }
}
})()

// === Merged from sanctumLog.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const SanctumLogContext = _m6_SanctumLogContext
  const sanctumLogFloor = _m6_sanctumLogFloor
  const SanctumLiveDriver = _m6_SanctumLiveDriver
  const SanctumService = _m6_SanctumService
  const AutomationLock = _m6_AutomationLock
  const sanctumLogEvents = _m6_sanctumLogEvents
  const liveProfile = _m6_liveProfile
  const runPython = _m6_runPython
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
const environment = { windowId: 'game', processId: 123, width: 1920, height: 1080, dpi: 96 }
const region = { x: 0, y: 0, width: 1000, height: 700 }
const profile = () => liveProfile({ version: 2, environment, mapRegion: region, effectIconsRegion: region,
  captures: { mapRegion: { png, environment, region }, effectIconsRegion: { png, environment, region } } })
const signal = () => new AbortController().signal
const captureCommands = commands => commands.filter(command=>!['prepareIcons','prepareOcr'].includes(command))
const tick = () => new Promise(resolve => setImmediate(resolve))
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }

test('启动在环境检查前调用全局激活一次，配置失败不激活，激活失败不发采集命令，模型准备允许并行', async t => {
  const f = fixture(t), calls = []
  f.driver.windowActivation = { async activateGame(options) { calls.push(options); assert.deepEqual(captureCommands(f.commands), []); return { success: true } } }
  await assert.rejects(f.driver.prepare({}, signal(), new AutomationLock()))
  assert.deepEqual(calls, [])
  assert.deepEqual(f.commands, [])
  await f.driver.prepare(profile(), signal(), new AutomationLock())
  assert.deepEqual(calls, [{ source: 'sanctum-start' }])
  await f.driver.dispose()
  f.commands.length = 0
  f.driver.windowActivation = { async activateGame() { return { success: false, code: 'focus-refused' } }, gameFailureMessage: code => `激活失败：${code}` }
  await assert.rejects(f.driver.prepare(profile(), signal(), new AutomationLock()), /激活失败：focus-refused/)
  assert.deepEqual(captureCommands(f.commands), [])
})

test('等待全局激活或环境结果时停止，不继续 arm；恢复焦点不会自动激活', async t => {
  for (const stage of ['activation', 'environment']) {
    const f = fixture(t), entered = deferred(), release = deferred(), controller = new AbortController()
    let activations = 0
    f.driver.windowActivation = { async activateGame() {
      activations++
      if (stage === 'activation') { entered.resolve(); await release.promise }
      return { success: true }
    } }
    if (stage === 'environment') f.hooks.environment = async () => { entered.resolve(); await release.promise; return { environment } }
    const preparing = f.driver.prepare(profile(), controller.signal, new AutomationLock())
    await entered.promise
    controller.abort(); release.resolve()
    await assert.rejects(preparing, /abort/i)
    assert.equal(activations, 1)
    assert.equal(f.commands.includes('arm'), false)
    if (stage === 'activation') assert.deepEqual(captureCommands(f.commands), [])
  }
})

function fixture(t) {
  const log = sanctumLogEvents(), hooks = {}, commands = []
  let time = 0, aborted = 0, mode = 'map'
  const frame = () => ({ environment, foreground: true, userTakeover: false, mapOpen: true, interfaceMatched: true,
    fingerprint: 'map', mapFingerprint: 'map', timestamp: time += 400,
    floor: { currentRoomId: 'a', positionSource: 'paths', titleTexts: ['所有层相同的标题'], areaLevelTexts: ['区域等级：1'],
      rooms: [{ id: 'a', column: 0, currentCandidate: true, revealed: false }, { id: 'b', column: 1, terminal: true, revealed: false }],
      edges: [{ from: 'a', to: 'b', status: 'matched', availability: 'gold' }] } })
  const driver = new SanctumLiveDriver({ catalog: { entries: [] }, clientEvents: log.events, wait: tick,
    windowActivation: { async activateGame() { return { success: true } } },
    withHidden: async fn => { await hooks.hidden?.(); return fn() },
    detection: { getTitleConfig: () => ({ templates: { 'sanctum-hud': { png, environment }, 'sanctum-map': { png, environment } }, threshold: .8 }),
      registerConsumer: async () => {}, unregisterConsumer() {}, subscribe: () => () => {},
      getState: () => ({ running: true, foreground: true, receivedAt: Date.now(), interfaces: { 'sanctum-hud': { matched: true }, 'sanctum-map': { matched: mode === 'map' } } }) },
    makeClient: () => ({ abort() { aborted++ }, shutdown: async () => {}, async request(command, input) {
      commands.push(command)
      if (hooks[command]) return hooks[command]()
      if (['prepareIcons','prepareOcr','resetImages'].includes(command)) return {}
      if (command === 'prepareFrames') return {count:8}
      if (command === 'freezeBaseline') return {baselineVersion:1}
      if (command === 'environment' || command === 'arm') return { environment }
      if (command === 'interfaceState') return { environment, mapOpen: mode !== 'effects', hudVisible: mode !== 'map', hudLayout: mode === 'both' ? 'map' : mode === 'effects' ? 'standalone' : null }
      if (command === 'toggleMap') { mode = input.targetMode; return { environment, mapOpen: mode !== 'effects', hudVisible: mode !== 'map', hudLayout: mode === 'both' ? 'map' : mode === 'effects' ? 'standalone' : null } }
      if (command === 'inspectEffects') return { environment, icons: [] }
      if (command === 'observe') return frame()
      if (command === 'hover') return { texts: [], mapFingerprint: 'map', observation: frame() }
      throw new Error(`Unexpected ${command}`)
    } }) })
  t.after(() => driver.close())
  return { ...log, driver, hooks, commands, frame, get aborted() { return aborted } }
}

test('四层及编号入口精确映射，等级独立校验，其他入口保持未知', () => {
  for (const [index, name] of ['Cellar', 'Vaults', 'Nave', 'Crypt'].entries()) {
    for (const areaId of [`Sanctum${name}`, `sAnCtUm${name}`, `SanctumFoyer_${index + 1}`, `SanctumFoyer_${index + 1}_3`]) {
      assert.deepEqual(sanctumLogFloor({ areaId, areaLevel: 83 }), {
        floorId: `floor:${index}`, floorNumber: index + 1, areaLevel: 83, identitySource: 'client-log'
      })
    }
  }
  for (const areaId of ['', 'SanctumFoyer', 'SanctumFoyer_Fellshrine', 'SanctumFoyer_5', 'SanctumFoyer_10', 'SanctumFoyer_5_3', 'SanctumFoyer_3_0', 'SanctumFoyer_3_-1', 'SanctumFoyer_3_03', 'SanctumFoyer_3_3x', 'SanctumVaultsBoss', 'constructor']) {
    assert.equal(sanctumLogFloor({ areaId, areaLevel: 83 }).floorId, null)
    assert.equal(sanctumLogFloor({ areaId, areaLevel: 83 }).areaLevel, null)
  }
  for (const areaLevel of [null, undefined, '83', 0, 101, 83.5, NaN]) {
    assert.equal(sanctumLogFloor({ areaId: 'SanctumVaults', areaLevel }).areaLevel, null)
    assert.equal(sanctumLogFloor({ areaId: 'SanctumVaults', areaLevel }).floorId, 'floor:1')
  }
})

test('相同标题按日志确认四层，目录空白也能识别，重启采集生成独立 runId', async t => {
  const f = fixture(t), runs = new Set()
  for (let n = 1; n <= 4; n++) {
    f.enter({ areaId: `SanctumFoyer_${n}`, areaLevel: 80 + n })
    await f.driver.prepare(profile(), signal(), new AutomationLock())
    const floor = f.driver.inspect().floor
    assert.equal(floor.floorId, `floor:${n - 1}`)
    assert.equal(floor.areaLevel, 80 + n)
    assert.equal(floor.identityConfirmed, true)
    runs.add(floor.runId)
    await f.driver.dispose()
  }
  assert.equal(runs.size, 4)
  assert.equal(f.events.status.state, 'started')
  assert.equal(f.events.eventListeners.size, 0)
})

test('准备阶段验证日志可用性、进程和区域，失败不 arm 或悬停', async t => {
  for (const [change, message] of [
    [f => { f.events.status.enabled = false; f.events.ensureStarted = async () => { throw new Error('请配置 Client.txt') } }, /Client.txt/],
    [f => f.events.setState({ state: 'resyncing' }), /日志|区域/],
    [f => f.events.setGameState('loading', 'loading'), /进入区域/],
    [f => f.enter({ processId: 456 }), /进程/],
    [f => f.enter({ areaId: 'SanctumFoyer_Fellshrine' }), /楼层/],
    [f => f.enter({ eventId: null }), /会话/]
  ]) {
    const f = fixture(t)
    // A resyncing shared listener can be enabled without yet having a current context.
    if (message.source === '日志|区域') f.events.ensureStarted = async () => f.events.snapshot()
    change(f)
    await assert.rejects(f.driver.prepare(profile(), signal(), new AutomationLock()), message)
    assert.equal(f.commands.includes('arm'), false)
    assert.equal(f.commands.includes('hover'), false)
  }
})

test('停止等待日志准备后，迟到的启动结果不会进入原生采集', async t => {
  const f = fixture(t), started = deferred(), pending = deferred(), controller = new AbortController()
  f.events.ensureStarted = () => { started.resolve(); return pending.promise }
  const preparing = f.driver.prepare(profile(), controller.signal, new AutomationLock())
  await started.promise
  controller.abort()
  pending.resolve()
  await assert.rejects(preparing, /abort/i)
  assert.deepEqual(captureCommands(f.commands), [])
})

test('地图准备首次启用共享监听，再次采集复用监听而不重启或关闭', async t => {
  const f = fixture(t)
  let stored = { enabled: false, logPath: '' }, starts = 0, stops = 0
  await f.events.stop()
  f.events.status.enabled = false
  f.events.settings = { async save(patch) { stored = { ...stored, ...patch }; return stored } }
  f.events.detectPath = async () => 'Client.txt'
  f.events.Tailer = class {
    constructor(options) { this.options = options }
    async start() {
      starts++
      this.options.onState({ state: 'started' })
      this.options.onLine('2026/09/09 12:00:00 1 [INFO Client 123] Generating level 82 area "SanctumVaults" with seed 123',
        { sourceId: 'source', fileId: 'file', offset: 0 })
      this.options.onLine('2026/09/09 12:00:01 1 [INFO Client 123] : You have entered The Sanctum Vaults.',
        { sourceId: 'source', fileId: 'file', offset: 100 })
    }
    stop() { stops++ }
  }
  await f.driver.prepare(profile(), signal(), new AutomationLock())
  assert.equal(f.driver.inspect().floor.floorId, 'floor:1')
  assert.equal(f.driver.inspect().floor.areaLevel, 82)
  await f.driver.dispose()
  await f.driver.prepare(profile(), signal(), new AutomationLock())
  await f.driver.dispose()
  assert.equal(starts, 1)
  assert.equal(stops, 0)
  assert.equal(stored.enabled, true)
})

test('共享日志有界恢复只接受当前进程区域，圣所不恢复旧统计或旧采集轮次', async t => {
  const f = fixture(t)
  f.events.context = null
  f.events.processProvider = async () => [{ id: 123, startedAt: '2026-09-09T11:00:00' }]
  const body = (pid, message) => `2026/09/09 12:00:00 1 [INFO Client ${pid}] ${message}`
  await f.events.recover([
    body(456, 'Generating level 83 area "SanctumCrypt" with seed 1'),
    body(123, 'Generating level 82 area "SanctumNave" with seed 2'),
    body(123, ': You have entered The Sanctum.'),
    body(123, ': You have died.')
  ].map((line, offset) => ({ line, sourceId: 'source', fileId: 'file', offset })))
  await f.driver.prepare(profile(), signal(), new AutomationLock())
  assert.equal(f.driver.inspect().floor.floorId, 'floor:2')
  assert.equal(f.driver.inspect().floor.areaLevel, 82)
  assert.equal(f.events.events.filter(event => event.recovered).length, 1)
  assert.equal(f.events.events.some(event => event.type === 'player-death'), false)
})

test('没有新日志不使楼层过期，其他白名单事件不使绑定失效', () => {
  const f = sanctumLogEvents()
  f.enter({ logTime: '2000/01/01 00:00:00', recovered: true })
  const bound = new SanctumLogContext(f.events, 123, () => assert.fail('不应失效'))
  try {
    f.events.push({ type: 'character-level', level: 90 })
    f.events.push({ type: 'player-death' })
    assert.equal(bound.assertCurrent().floorId, 'floor:0')
  } finally { bound.close() }
})

test('区域、等级、种子、会话、加载、断线及轮换均锁定失败，恢复不能复活旧绑定', () => {
  const changes = [f => f.enter(), f => f.enter({ areaId: 'SanctumVaults' }), f => f.enter({ areaLevel: 84 }),
    f => f.enter({ seed: '456' }), f => f.enter({ sessionKey: 'other' }), f => f.enter({ processId: 456 }),
    f => f.events.setGameState('loading', 'loading'), f => f.events.setGameState('disconnected', 'disconnect'),
    f => f.events.setState({ state: 'resyncing' }), f => f.events.setState({ state: 'waiting' })]
  for (const change of changes) {
    const f = sanctumLogEvents(), failures = []
    const bound = new SanctumLogContext(f.events, 123, error => failures.push(error))
    change(f)
    assert.equal(failures.length, 1)
    f.events.status.state = 'started'; f.enter()
    assert.throws(() => bound.assertCurrent())
    assert.equal(failures.length, 1)
    assert.equal(f.events.eventListeners.size, 0)
  }
})

test('原生观察前切区，禁止发送新的请求', async t => {
  const f = fixture(t)
  await f.driver.prepare(profile(), signal(), new AutomationLock())
  const before = f.commands.length
  f.enter({ areaId: 'SanctumVaults' })
  await assert.rejects(f.driver.observe(signal()), /变化/)
  assert.equal(f.commands.length, before)
  assert.equal(f.aborted, 1)
})

test('截图与悬停迟到结果、返回进程不一致或缺失均不能更新当前快照', async t => {
  for (const command of ['observe', 'hover']) {
    for (const mismatch of ['log', 'process', 'missing']) {
      const f = fixture(t)
      await f.driver.prepare(profile(), signal(), new AutomationLock())
      f.hooks[command] = async () => {
        const frame = f.frame()
        if (mismatch === 'log') f.enter({ areaId: 'SanctumVaults' })
        else frame.environment = { ...environment, processId: mismatch === 'process' ? 456 : undefined }
        return command === 'observe' ? frame : { texts: ['迟到信息'], observation: frame, mapFingerprint: 'map' }
      }
      await assert.rejects(command === 'observe' ? f.driver.observe(signal()) : f.driver.hover({ id: 'a' }, { signal: signal(), guard() {} }), /变化/)
      assert.equal(f.driver.inspect().floor, undefined)
      assert.equal(f.aborted, 1)
      await f.driver.dispose()
    }
  }
})

test('服务在原生请求尚未返回时立即撤销推荐与等级，迟到结果不恢复，共享日志继续运行', async t => {
  const f = fixture(t), service = new SanctumService({}), lock = new AutomationLock()
  const ready = deferred(), waiting = deferred(), release = deferred()
  service.attachLiveDriver(f.driver, lock); service.setEnabled(true); service.state.liveCalibration = profile()
  service.subscribe(state => { if (state.recommendation && state.floor?.identityConfirmed) ready.resolve() })
  f.hooks.inspectEffects = () => { waiting.resolve(); return release.promise }
  const task = service.startLive()
  t.after(async () => { release.resolve({ environment, icons:[] }); service.stop(); await task; await service.shutdown() })
  await Promise.race([ready.promise, task.then(() => { throw new Error(service.state.reason) })])
  assert.equal(service.state.floor.areaLevel, 83)
  await Promise.race([waiting.promise, task.then(() => { throw new Error(service.state.reason) })])
  f.events.setGameState('loading', 'area-loading')
  assert.equal(service.state.floor.identityConfirmed, false)
  assert.equal(service.state.recommendation, null)
  assert.equal(service.state.running, false)
  assert.match(service.state.reason, /手动重新开始/)
  f.enter({ areaId: 'SanctumVaults' })
  release.resolve({ environment, icons:[] }); await task
  assert.equal(service.state.floor.identityConfirmed, false)
  assert.equal(service.state.recommendation, null)
  assert.equal(f.events.status.state, 'started')
  // Only the read-only whole-run watcher survives between captures.
  assert.equal(f.events.eventListeners.size, 1)
  await service.shutdown()
  assert.equal(f.events.eventListeners.size, 0)
  assert.equal(lock.getState().locked, false)
})

test('原生环境返回前台窗口进程，无法读取进程时拒绝环境', () => {
  const result = runPython(`
import ctypes,json,sys
from ctypes import wintypes
sys.path.insert(0,'src/assets/scripts')
import sanctum_native as native
class User32:
    pid=321
    def GetForegroundWindow(self): return 10
    def GetClientRect(self, hwnd, rect):
        value=ctypes.cast(rect,ctypes.POINTER(wintypes.RECT)).contents
        value.right=1920; value.bottom=1080; return 1
    def ClientToScreen(self, hwnd, point): return 1
    def GetDpiForWindow(self, hwnd): return 96
    def GetWindowThreadProcessId(self, hwnd, pid):
        ctypes.cast(pid,ctypes.POINTER(wintypes.DWORD)).contents.value=self.pid
session=native.NativeSession.__new__(native.NativeSession)
session.u=User32();session.matches_game=lambda hwnd:True
value=session.environment()['environment']
session.u.pid=0
try: session.environment(); failed=False
except native.NativeError: failed=True
print(json.dumps({'processId':value['processId'],'rejected':failed}))
`)
  assert.deepEqual(result, { processId: 321, rejected: true })
})
})()

// === Merged from sanctumLowFillRoom.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const runPython = _m7_runPython
  const sanctumDisplay = _m7_sanctumDisplay
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
})()

// === Merged from sanctumMapEntry.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const runPython = _m8_runPython
test('恢复地图仅点击唯一入口，客户区偏移生效；缺失、多匹配、失焦和取消禁止盲点', () => {
  const results=runPython(`
import sys,json,cv2,numpy as np,base64,types,threading
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
import sanctum_native as native
label=cv2.imread('test/fixtures/sanctum/map-entry-label.png');h,w=label.shape[:2]
_,png=cv2.imencode('.png',label)
env=dict(width=800,height=600,dpi=96)
template=dict(environment=env,region=dict(x=10,y=10,width=w,height=h),png=base64.b64encode(png).decode())
def run(mode):
 im=np.zeros((600,800,3),np.uint8)
 if mode!='absent':im[120:120+h,300:300+w]=label
 if mode=='multiple':im[350:350+h,60:60+w]=label
 s=NativeSession.__new__(NativeSession);s.expected={};s.input_lock=threading.RLock();s.cancelled=threading.Event()
 inputs=[];stopped=False
 current=dict(environment=env,clientBounds=dict(x=-800,y=40,width=800,height=600))
 def check():
  if mode in ('cancel','focus') or stopped:raise NativeError('stopped','SAFETY_INTERRUPTED')
  return current
 def mouse(*args):
  nonlocal stopped
  inputs.append(['mouse',args[0]])
  if mode=='during' and args[0]==2:stopped=True
 s.check=check;s.image=lambda:(im,current)
 s.u=types.SimpleNamespace(SetCursorPos=lambda x,y:(inputs.append(['move',x,y]) or True),
  GetAsyncKeyState=lambda _:int(mode=='held')*0x8000,mouse_event=mouse,keybd_event=lambda *args:inputs.append(['key']))
 native.match_titles=lambda *args,**kwargs: {'sanctum-map':True} if any(x==['mouse',4] for x in inputs) and mode!='timeout' else {}
 options=dict(targetMode='map',interfaceTitles={'sanctum-map-entry':template})
 if mode=='uncalibrated':options['interfaceTitles']={}
 if mode=='dpi':options['interfaceTitles']={'sanctum-map-entry':dict(template,environment=dict(env,dpi=144))}
 if mode=='mask':s.capture_masks=[(300,120,w,h)]
 try:s.toggle_map(options);failed=False
 except NativeError:failed=True
 return dict(mode=mode,inputs=inputs,failed=failed)
print(json.dumps([run(mode) for mode in ['ok','absent','multiple','cancel','focus','during','held','uncalibrated','dpi','mask','timeout']]))`)
  const ok=results[0]
  assert.equal(ok.failed,false)
  assert.deepEqual(ok.inputs,[['move',-401,188],['mouse',2],['mouse',4]])
  for (const value of results.slice(1)) {
    assert.equal(value.failed,true,value.mode)
    if (['during','timeout'].includes(value.mode)) assert.deepEqual(value.inputs,ok.inputs)
    else assert.deepEqual(value.inputs,[],value.mode)
  }
})
})()

// === Merged from sanctumNative.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const spawn = _m9_spawn
  const EventEmitter = _m9_EventEmitter
  const SanctumNativeClient = _m9_SanctumNativeClient
  const runPython = _m9_runPython
function fixture() {
  const children = []
  const client = new SanctumNativeClient({ resolveRuntime: async () => ({ path: 'python' }), launch: options => {
    const child = new EventEmitter()
    child.stdout = new EventEmitter(); child.stdout.setEncoding = () => {}
    child.stderr = new EventEmitter(); child.requests = []; child.options = options
    child.stdin = { write: (line, callback) => { child.requests.push(JSON.parse(line)); callback() }, destroy: () => {} }
    child.kill = () => { child.killed = true }
    child.reply = value => child.stdout.emit('data', `SANCTUM ${JSON.stringify(value)}\n`)
    children.push(child)
    return { process: child, started: Promise.resolve(child) }
  } })
  return { client, children }
}
const tick = () => new Promise(resolve => setImmediate(resolve))

test('静态配置只传一次，动态身份始终发送；重新配置和进程替换不会沿用旧配置', async () => {
  const {client,children}=fixture(), configuration={interfaceKind:'sanctum-map',interfaceTitles:{sample:'image'}}
  const first=client.configure(configuration)
  await tick();let child=children[0]
  assert.deepEqual(child.requests[0].input.interfaceTitles,configuration.interfaceTitles)
  child.reply({id:1,success:true,data:{}});await first
  const read=client.request('hover',{...configuration,roomId:'a'})
  await tick();assert.equal(child.requests[1].input.interfaceTitles,undefined);assert.equal(child.requests[1].input.roomId,'a')
  child.reply({id:2,success:true,data:{}});await read
  const reset=client.configure(configuration)
  await tick();assert.deepEqual(child.requests[2].input.interfaceTitles,configuration.interfaceTitles)
  child.reply({id:3,success:true,data:{}});await reset
  client.abort();child.emit('close')
  const next=client.request('hover',{...configuration,roomId:'b'})
  await tick();child=children[1]
  assert.deepEqual(child.requests[0].input.interfaceTitles,configuration.interfaceTitles)
  child.reply({id:4,success:true,data:{}});await next
  const closed=client.shutdown();child.emit('close');await closed
})

test('房间详情结束后先移开并等待再匹配布局，初始预检不移动，停止或环境失效不继续', () => {
  const result = runPython(`
import sys,json,threading,copy,time
from unittest.mock import patch
import numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
base={'environment':{'windowId':'1','processId':123,'width':800,'height':600,'dpi':96},'clientBounds':{'x':10,'y':20,'width':800,'height':600}}
out={}
for case in ['initial','clear','cancel-before','cancel-wait','expired','changed-before','changed-wait']:
    s=NativeSession.__new__(NativeSession)
    s.expected=copy.deepcopy(base);s.input_lock=threading.RLock();s.cancelled=threading.Event()
    s.environment=lambda:copy.deepcopy(base)
    s.room_tooltip_pending=case!='initial'
    events=[]
    class Input:
        def SetCursorPos(self,x,y):
            assert (x,y)==(808,618)
            events.append('move');return True
    s.u=Input()
    def wait(duration):
        assert duration==.15
        events.append('wait')
        if case=='changed-wait':s.environment=lambda:{**base,'clientBounds':{**base['clientBounds'],'x':99}}
        return case=='cancel-wait'
    s.cancelled.wait=wait
    if case=='cancel-before':s.cancelled.set()
    if case=='expired':s.deadline_at=time.time()*1000-1
    if case=='changed-before':s.environment=lambda:{**base,'environment':{**base['environment'],'dpi':120}}
    def image():
        s.check();events.append('image');return np.zeros((600,800,3),np.uint8),copy.deepcopy(base)
    s.image=image
    region={'x':20,'y':30,'width':40,'height':20}
    def match(*args,**kwargs):
        events.append('match')
        if case=='initial':return {}
        assert events[:2]==['move','wait']
        return {'sanctum-map':True,'sanctum-map-hud':{'region':region}}
    with patch('sanctum_native.match_titles',side_effect=match):
        try:
            state=s.interface_state({'interfaceTitles':{'sanctum-map-hud':{'region':region}}})
            if case=='initial':assert state['mapOpen'] is False
            else:
                assert state['mapOpen'] is True and state['hudLayout']=='map'
                assert s.room_tooltip_pending is False
                assert s.surface_snapshot is not None
                s.interface_state({})
        except NativeError:
            assert case not in ['initial','clear']
        else:assert case in ['initial','clear']
    out[case]=events
print(json.dumps(out))
`)
  assert.deepEqual(result.initial, ['image','match'])
  assert.deepEqual(result.clear, ['move','wait','image','match','image','match'])
  for (const key of ['cancel-before','expired','changed-before']) assert.deepEqual(result[key], [])
  for (const key of ['cancel-wait','changed-wait']) assert.deepEqual(result[key], ['move','wait'])
})

test('原生效果扫描在完整空区域返回覆盖证据，遮挡和无效区域不能确认无效果', () => {
  const result = runPython(`
import sys,json
import numpy as np
from unittest.mock import patch
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
s=NativeSession.__new__(NativeSession)
s.check=lambda:None
s.surface=lambda value:None
s.capture_masks=[]
image=np.zeros((120,200,3),dtype=np.uint8)
current={'environment':{'width':200,'height':120}}
s.image=lambda:(image,current)
options={'hudLayout':'map','effectIconsRegion':{'x':10,'y':20,'width':100,'height':80}}
with patch('sanctum_native.match_titles',return_value={'sanctum-map-hud':True}):
    empty=s.inspect_effects(options)
    assert empty['coverageConfirmed'] is True and empty['icons']==[]
    with patch('sanctum_native.icon_candidates',return_value=[{'x':30,'y':25,'width':20,'height':20}]):
        visible=s.inspect_effects(options)
        assert visible['coverageConfirmed'] is True
        assert visible['icons'][0]['x']==40 and visible['icons'][0]['y']==45
    s.capture_masks=[(20,30,20,20)]
    with patch('sanctum_native.icon_candidates') as scan:
        blocked=s.inspect_effects(options)
        assert blocked['coverageConfirmed'] is False and blocked['reason'] and blocked['icons']==[]
        scan.assert_not_called()
    s.capture_masks=[(110,20,20,20)]
    assert s.inspect_effects(options)['coverageConfirmed'] is True
    for region in [None,{'x':190,'y':20,'width':100,'height':80}]:
        try:s.inspect_effects({**options,'effectIconsRegion':region})
        except NativeError:pass
        else:raise AssertionError('invalid region accepted')
with patch('sanctum_native.match_titles',return_value={}):
    try:s.inspect_effects(options)
    except NativeError:pass
    else:raise AssertionError('invalid title accepted')
    standalone={**options,'hudLayout':'standalone'}
    assert s.inspect_effects(standalone)['coverageConfirmed'] is True
    s.capture_masks=[(20,30,20,20)]
    assert s.inspect_effects(standalone)['coverageConfirmed'] is False
    s.capture_masks=[]
    for region in [None,{'x':190,'y':20,'width':100,'height':80}]:
        try:s.inspect_effects({**standalone,'effectIconsRegion':region})
        except NativeError:pass
        else:raise AssertionError('invalid standalone region accepted')
    with patch('sanctum_native.icon_candidates',side_effect=NativeError('scan failed')):
        try:s.inspect_effects(standalone)
        except NativeError:pass
        else:raise AssertionError('failed scan accepted')
with patch('sanctum_native.match_titles',return_value={'sanctum-map':True}):
    try:s.inspect_effects(standalone)
    except NativeError:pass
    else:raise AssertionError('open map accepted as standalone')
print(json.dumps({'empty':empty['coverageConfirmed'],'blocked':blocked['coverageConfirmed']}))
`)
  assert.deepEqual(result, { empty: true, blocked: false })
})

test('arm 忽略浮窗元数据，环境缺失或变化拒绝启动，运行变化仍停止', () => {
  const result = runPython(`
import sys,json,threading,copy
from unittest.mock import patch
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
base={'environment':{'windowId':'1','processId':123,'width':800,'height':600,'dpi':96},'clientBounds':{'x':10,'y':20,'width':800,'height':600}}
def fixture():
    session=NativeSession.__new__(NativeSession)
    session.expected=None; session.expected_cursor=None; session.watching=False
    session.cancelled=threading.Event(); session.input_lock=threading.RLock()
    session.environment=lambda:copy.deepcopy(base)
    session.cursor=lambda:(0,0)
    class NoInput:
        def __getattr__(self,name): raise AssertionError('unexpected native input: '+name)
    session.u=NoInput()
    return session
accepted=0; rejected=0; stopped=0
fields=[('environment',key) for key in base['environment']]+[('clientBounds',key) for key in base['clientBounds']]
with patch('sanctum_native.threading.Thread') as worker, patch('sanctum_native.emit') as emit:
    for windows in [[],[{'handle':'2','processId':456,'role':'control'}]]:
        session=fixture(); options={**copy.deepcopy(base),'captureWindows':windows}
        assert session.dispatch('arm',options)==base
        assert session.expected==base and session.capture_windows==windows
        assert session.capture_options==options
        session.check(); session.cancelled.set(); accepted+=1
    invalid=[]
    for group,key in fields:
        changed=copy.deepcopy(base)
        changed[group][key]='other' if key=='windowId' else changed[group][key]+1
        invalid.append(changed)
        missing=copy.deepcopy(base); del missing[group][key]; invalid.append(missing)
    for group in base:
        missing=copy.deepcopy(base); del missing[group]; invalid.append(missing)
    for expected in invalid:
        session=fixture(); worker.reset_mock()
        try: session.dispatch('arm',{**expected,'captureWindows':[]})
        except NativeError as error: assert str(error)=='校准环境已变化'
        else: raise AssertionError('invalid environment accepted')
        assert session.expected is None and not session.watching
        worker.assert_not_called(); rejected+=1
    for group,key in fields:
        session=fixture(); session.dispatch('arm',{**copy.deepcopy(base),'captureWindows':[]})
        changed=copy.deepcopy(base)
        changed[group][key]='other' if key=='windowId' else changed[group][key]+1
        session.environment=lambda:changed
        emit.reset_mock()
        worker.call_args.kwargs['target']()
        assert session.cancelled.is_set()
        assert emit.call_args.args[0]['event']=='unsafe'
        assert '已变化' in emit.call_args.args[0]['reason']
        stopped+=1
print(json.dumps({'accepted':accepted,'rejected':rejected,'stopped':stopped}))
`)
  assert.deepEqual(result, { accepted: 2, rejected: 20, stopped: 9 })
})

test('进度和界面事件不完成请求，过期请求及会话事件无效', async () => {
  const {client,children}=fixture(), progress=[], surfaces=[], evidence=[]
  client.onProgress=e=>progress.push(e)
  client.onSurface=e=>surfaces.push(e)
  client.onEvidence=e=>evidence.push(e)
  const request=client.request('hover',{roomId:'a'})
  await tick()
  const child=children[0], {id,sessionId}=child.requests[0]
  child.reply({event:'progress',id,sessionId:'old',stage:'ocr'})
  child.reply({event:'progress',id:id-1,sessionId,stage:'ocr'})
  child.reply({event:'progress',id,sessionId,stage:'ocr',targetId:'a'})
  child.reply({event:'surface',id,sessionId,observation:{mapOpen:true}})
  child.reply({event:'evidence',id,sessionId:'old',png:'old'})
  child.reply({event:'evidence',id,sessionId,png:'current'})
  assert.deepEqual(evidence.map(e=>e.png),['current'])
  assert.equal(progress.length,1);assert.equal(surfaces.length,1)
  assert.equal(client.pending.id,id)
  child.reply({id,success:true,data:{texts:['已读']}})
  assert.deepEqual(await request,{texts:['已读']})
  child.reply({event:'progress',id,sessionId,stage:'parsing'})
  assert.equal(progress.length,1)
  const stopped=client.shutdown();child.emit('close');await stopped
})

test('原生请求使用管道 JSON，响应按 ID 匹配且不泄漏标准错误', async () => {
  const { client, children } = fixture()
  const request = client.request('observe', { text: '`$(not-a-command)' })
  await tick()
  const child = children[0]
  assert.equal(child.options.stdin, 'pipe')
  assert.equal(child.requests[0].input.text, '`$(not-a-command)')
  child.stderr.emit('data', 'private diagnostics')
  child.reply({ id: -1, success: true, data: 'late' })
  await assert.rejects(client.request('observe'), /尚未结束/)
  child.reply({ id: child.requests[0].id, success: true, data: { rooms: [] } })
  assert.deepEqual(await request, { rooms: [] })
  const stopped = client.shutdown(); child.emit('close'); await stopped
})

test('取消等待进程退出再完成，旧响应不能串入新会话', async () => {
  const { client, children } = fixture(), controller = new AbortController()
  const request = client.request('hover', {}, { signal: controller.signal })
  let settled = false
  const rejected = assert.rejects(request, /已停止/).then(() => { settled = true })
  await tick()
  const old = children[0]
  controller.abort()
  await tick()
  assert.equal(old.killed, true)
  assert.equal(settled, false)
  const next = client.request('environment')
  await tick()
  assert.equal(children.length, 1)
  old.emit('close')
  await rejected; await tick()
  const current = children[1]
  old.reply({ id: current.requests[0].id, success: true, data: 'old process' })
  current.reply({ id: current.requests[0].id, success: true, data: 'current process' })
  assert.equal(await next, 'current process')
  const stopped = client.shutdown(); current.emit('close'); await stopped
})

test('接管事件和损坏响应均终止原生进程，且正常退出清理悬挂请求', async () => {
  for (const kind of ['unsafe', 'malformed', 'close']) {
    const { client, children } = fixture()
    const request = client.request('hover')
    const rejected = assert.rejects(request)
    await tick()
    const child = children[0]
    if (kind === 'unsafe') child.reply({ event: 'unsafe', reason: '用户接管' })
    if (kind === 'malformed') child.stdout.emit('data', 'SANCTUM {broken}\n')
    child.emit('close')
    await rejected
    await client.shutdown()
  }
})

test('原生裁剪拒绝越界', () => {
  const value = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import crop,NativeError
try:crop(np.zeros((10,10,3),np.uint8),{'x':9,'y':0,'width':2,'height':3});print('false')
except NativeError:print('true')`)
  assert.equal(value,true)
})

test('实际隔离运行时可加载原生脚本；未知命令被拒绝且不产生输入', async () => {
  const client = new SanctumNativeClient()
  try { await assert.rejects(client.request('invalid-command'), /不支持的圣所原生操作|仅支持 Windows/) }
  finally { await client.shutdown() }
})

test('单轮原生悬停只使用固定队列目标，不执行地图指纹或二次观察', () => {
  const value = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
s=NativeSession.__new__(NativeSession)
s.check=lambda:{'environment':{},'clientBounds':{}}
s.last_floor={'rooms':[{'id':'a'}]}
s.read_tooltip=lambda options,point,mode:{'texts':['内容'],'point':point}
s.observe=lambda *a:(_ for _ in ()).throw(AssertionError('不能二次观察'))
print(json.dumps(s.hover({'targetRoom':{'id':'a','x':100,'y':100,'width':80,'height':120},'mapRegion':{'x':10,'y':20}})))`)
  assert.deepEqual(value.point,[150,180])
  assert.deepEqual(value.texts,['内容'])
})


test('期限耗尽会终止真实挂起子进程并等待退出', { timeout: 5000 }, async () => {
  let child, exited = false
  const client = new SanctumNativeClient({ resolveRuntime: async () => ({path:process.execPath}), launch: () => {
    child = spawn(process.execPath, ['-e', 'process.stdin.once("data", () => { while (true) {} })'], {windowsHide:true,stdio:['pipe','pipe','pipe']})
    child.once('close', () => { exited=true })
    return {process:child,started:Promise.resolve(child)}
  } })
  client.deadlineAt = Date.now()+250
  try {
    await assert.rejects(client.request('readFrozen'), /超时|timed out/)
    assert.ok(child.pid)
    assert.equal(exited,true)
    assert.equal(client.child,null)
    assert.equal(client.pending,null)
  } finally { await client.shutdown() }
})
})()

// === Merged from sanctumOcrPipeline.test.js ===
await (async () => {
  const sanctumError = _m10_sanctumError
  const test = _m10_test
  const assert = _m10_assert
  const fs = _m10_fs
  const runPython = _m10_runPython
  const parseSanctumRoomTexts = _m10_parseSanctumRoomTexts
  const SanctumLiveDriver = _m10_SanctumLiveDriver
  const SanctumCapture = _m10_SanctumCapture
  const AutomationLock = _m10_AutomationLock
  const SanctumService = _m10_SanctumService
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

test('真实驱动先提交文字，物品奖励独立扫描且不重复OCR',async()=>{
  const commands=[]
  const driver=new SanctumLiveDriver({catalog,makeClient:()=>({async request(command,input){if(command.startsWith('prepare'))return {ready:true};commands.push([command,input]);return input.iconsOnly?{currencyIcons:[],captureMetrics:{iconsMs:2}}:{texts:['完成后提供物品'],hasCurrencyOffer:true,status:'located',captureMetrics:{ocrCalls:1}}},shutdown:async()=>{}})})
  driver.assertLog=()=>({floorId:'f'});driver.profile={};driver.runId='r'
  driver.client={sessionId:'s',request:async()=>({png:'fixture',region:{x:10,y:20,width:100,height:50},status:'located'}),shutdown:async()=>{}}
  const captured=await driver.captureRoom({id:'a'},{signal:new AbortController().signal,guard:()=>{}})
  const text=await captured.recognition
  assert.equal(text.patch.type,'reward');assert.equal(text.patch.readStages.icons,'queued')
  assert.equal(commands.filter(([,input])=>!input.iconsOnly).length,1);assert.equal(commands[0][1].includeIcons,false)
  await captured.supplement()
  assert.equal(commands.length,2);assert.equal(commands[1][1].iconsOnly,true)
  await driver.close()
})
})()
