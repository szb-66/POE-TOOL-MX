import test from 'node:test'
import assert from 'node:assert/strict'
import { SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumFramePipeline } from '../electron/modules/sanctum/framePipeline.js'
import { SanctumImageCapacity } from '../electron/modules/sanctum/imageCapacity.js'
import { runPython } from './helpers/python.js'

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
