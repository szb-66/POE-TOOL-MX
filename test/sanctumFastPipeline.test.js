import test from 'node:test'
import assert from 'node:assert/strict'
import { SanctumFramePipeline } from '../electron/modules/sanctum/framePipeline.js'
import { SanctumCapture } from '../electron/modules/sanctum/capture.js'
import { AutomationLock } from '../electron/modules/automation/lock.js'
import { captureButton } from '../shared/sanctumPresentation.js'
import { sanctumControlState } from '../electron/modules/sanctum/controlOverlay.js'
import { runPython, pythonPath } from './helpers/python.js'
import { SanctumNativeClient } from '../electron/modules/sanctum/nativeClient.js'
import { SanctumProgress } from '../electron/modules/sanctum/progress.js'

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
