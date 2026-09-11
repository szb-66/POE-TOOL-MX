import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { AutomationLock } from '../electron/modules/automation/lock.js'
import { SanctumFramePipeline } from '../electron/modules/sanctum/framePipeline.js'
import { sanctumError } from '../electron/modules/sanctum/errors.js'

const deferred = () => { let resolve; const promise = new Promise(r => { resolve=r }); return {promise,resolve} }
const environment = {windowId:'game',width:1000,height:800,dpi:96}
const safe = {environment,foreground:true,mapOpen:true,interfaceMatched:true,userTakeover:false,overlayExcluded:true}
const patch = {detailsStatus:'matched',readStages:{ocr:'matched',parse:'matched'},type:'reward',rawText:'已识别文字'}
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(),'sanctum-focus-'))
  t.after(() => fs.rmSync(directory,{recursive:true,force:true}))
  const listeners = new Set(), ended = deferred(), lock = new AutomationLock()
  let ends=0, releases=0
  const release = lock.release.bind(lock)
  lock.release = owner => { releases++; return release(owner) }
  const floor = {runId:'r',floorId:'f',identityConfirmed:true,positionStatus:'confirmed',currentRoomId:null,initialSelection:true,startRoomIds:['a'],
    rooms:['a','b','c'].map((id,column)=>({id,column,row:0,revealed:true,status:'matched'})),
    edges:[{from:'a',to:'b',status:'matched'},{from:'b',to:'c',status:'matched'}],effectScan:{complete:true}}
  const driver = {inspect:()=>safe,subscribeSafety:fn=>{listeners.add(fn);return ()=>listeners.delete(fn)},
    async *frames(){yield {...safe,floor}},async endCapture(){ends++;ended.resolve()},
    async captureRoom(){return {recognition:Promise.resolve({patch})}}}
  const repository = new SanctumRepository(directory)
  const service = new SanctumService({repository,captureDriver:driver,automationLock:lock})
  service.setEnabled(true)
  t.after(()=>service.shutdown())
  return {driver,service,repository,lock,ended,floor,
    unsafe:reason=>{for(const fn of listeners)fn({...safe,nativeError:{code:'SAFETY_INTERRUPTED',reason}})},
    logError:()=>{for(const fn of listeners)fn({logError:'日志会话已变化'})},
    counts:()=>({ends,releases}),run:()=>service.startCapture(environment)}
}

for (const source of ['service','native']) test(`全部截图后${source}失焦继续奖励图标分析并保存完整结果`, async t => {
  const f=fixture(t), icons=deferred(), entered=deferred()
  f.driver.captureRoom=async room=>({recognition:Promise.resolve({patch:{...patch,readStages:{ocr:'matched',icons:room.id==='a'?'queued':'matched'}}}),
    supplement:room.id==='a'?async()=>{entered.resolve();await icons.promise;return {patch:{...patch,rewards:[{currency:'混沌石',quantity:2,timing:'room'}],readStages:{ocr:'matched',icons:'matched'}}}}:undefined})
  const task=f.run();await entered.promise
  if(source==='service') f.service.setForeground(false)
  else f.unsafe('游戏不在前台')
  assert.equal(f.service.state.running,true)
  assert.equal(f.service.capture.session.controller.signal.aborted,false)
  icons.resolve();await task
  assert.equal(f.service.state.status,'ready')
  assert.equal(f.service.state.floor.rooms[0].rewards[0].quantity,2)
  assert.equal(f.repository.load().persistedRoute.incomplete,false)
  assert.deepEqual(f.counts(),{ends:1,releases:1})
})

for (const source of ['service','native','guard']) test(`房间截图中途${source}失焦保留已截图任务且不再输入`, async t => {
  const f=fixture(t), text=deferred(), reached=deferred(), calls=[]
  f.driver.captureRoom=async (room,{signal,captureSignal,guard})=>{
    calls.push(room.id)
    if(room.id==='a')return {recognition:text.promise.then(()=>{signal.throwIfAborted();return {patch}})}
    reached.resolve()
    if(source==='native') f.unsafe('游戏不在前台')
    if(source==='guard') { f.driver.inspect=()=>({...safe,foreground:false});guard() }
    if(captureSignal.aborted)throw captureSignal.reason
    return await new Promise((resolve,reject)=>captureSignal.addEventListener('abort',()=>reject(captureSignal.reason),{once:true}))
  }
  const task=f.run();await reached.promise
  if(source==='service')f.service.setForeground(false)
  await f.ended.promise
  assert.equal(f.service.capture.session.controller.signal.aborted,false)
  text.resolve();await task
  assert.deepEqual(calls,['a','b'])
  assert.equal(f.service.state.floor.rooms[0].rawText,'已识别文字')
  assert.match(f.service.state.floor.rooms[2].failureReason,/前台/)
  assert.equal(f.service.state.status,'partial')
  assert.equal(f.repository.load().persistedRoute.incomplete,true)
  assert.deepEqual(f.counts(),{ends:1,releases:1})
})

for (const action of ['stop','emergencyStop','disable','reset','log','shutdown']) test(`后台分析期间${action}仍取消整轮并拒绝迟到结果`, async t => {
  const f=fixture(t), text=deferred()
  f.driver.captureRoom=async()=>({recognition:text.promise.then(()=>({patch}))})
  const task=f.run();await f.ended.promise;f.service.setForeground(false)
  let closing
  if(action==='disable')f.service.setEnabled(false)
  else if(action==='reset')f.service.resetRun()
  else if(action==='log') {
    // The capture subscriber must still reject log context loss after input closes.
    f.logError()
  } else if(action==='shutdown')closing=f.service.shutdown()
  else f.service[action]()
  const snapshot=JSON.stringify(f.service.state.floor)
  text.resolve();await task;await closing
  assert.equal(f.service.state.running,false)
  if(action!=='log')assert.equal(JSON.stringify(f.service.state.floor),snapshot)
  assert.ok(!f.service.state.floor || f.service.state.floor.rooms.every(room=>room.rawText!=='已识别文字'))
})

test('最后一帧已返回而失焦信号到达时，槽位保留给后处理且只释放一次',async()=>{
  const input=new AbortController(),analysis=new AbortController(),commands=[]
  const client={request:async(command,options)=>{
    commands.push(command)
    return command==='prepareFrames'?{count:3}:{texts:['已读']}
  },shutdown:async()=>{}}
  const pipeline=new SanctumFramePipeline({client})
  await pipeline.prepare(environment,analysis.signal)
  const native={request:async(command,options)=>{
    if(command==='freezeBaseline')return {baselineVersion:1}
    input.abort(new Error('游戏已失去前台'))
    return {frozenFrame:options.frozen}
  }}
  const frame=await pipeline.freeze(native,'hover',{}, {runId:'r',floorId:'f',roomId:'a',sessionId:'s',signal:analysis.signal},input.signal)
  assert.equal(pipeline.free.length,1)
  assert.deepEqual(await pipeline.process(frame,analysis.signal),{texts:['已读']})
  frame.release();pipeline.invalidateBaseline()
  assert.equal(pipeline.free.length,3)
  await pipeline.close()
  assert.deepEqual(commands,['prepareFrames','processFrame'])
})

test('真实房间驱动冻结返回同时失焦，正文和奖励补充仍完成且不再调用输入 guard',async()=>{
  const input=new AbortController(),analysis=new AbortController()
  const driver=new SanctumLiveDriver({catalog:JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json',import.meta.url)))})
  driver.assertLog=()=>({floorId:'f'});driver.client={sessionId:'s',shutdown:async()=>{}};driver.profile={}
  driver.freezeTarget=async(command,options,binding)=>{
    input.abort(new Error('游戏已失去前台'))
    return {binding,data:{png:'frozen',region:{x:0,y:0,width:10,height:10}}}
  }
  let checks=0,reads=0
  driver.recognizeCaptured=async(data,signal,icons,options)=>{
    signal.throwIfAborted();reads++
    return options.iconsOnly?{currencyIcons:[],captureMetrics:{iconsMs:1}}:{texts:['完成后提供物品'],hasCurrencyOffer:true,status:'located'}
  }
  const captured=await driver.captureRoom({id:'a'},{signal:analysis.signal,captureSignal:input.signal,guard:()=>{checks++;assert.equal(input.signal.aborted,false)}})
  assert.equal((await captured.recognition).patch.readStages.icons,'queued')
  assert.equal((await captured.supplement()).patch.readStages.icons,'empty')
  assert.equal(checks,1);assert.equal(reads,2)
  await driver.close()
})

test('状态预检请求失焦被原生通道转换成通用取消错误时，已冻结房间仍完成',async t=>{
  const f=fixture(t), gate=deferred()
  f.floor.effectScan={complete:false}
  f.driver.captureRoom=async()=>({recognition:gate.promise.then(()=>({patch}))})
  f.driver.finalizeFloor=async()=>{
    f.service.setForeground(false)
    throw sanctumError('SAFETY_INTERRUPTED','圣所采集已停止')
  }
  const task=f.run();await f.ended.promise
  assert.equal(f.service.capture.session.controller.signal.aborted,false)
  gate.resolve();await task
  assert.equal(f.service.state.status,'partial')
  assert.ok(f.service.state.floor.rooms.every(room=>room.rawText==='已识别文字'))
  assert.match(f.service.state.floor.effectScan.reason,/前台/)
})

for (const last of [false,true]) test(`真实状态驱动第${last?'最后':'一'}张冻结截图后失焦仍分析状态`, async t => {
  const f=fixture(t), gate=deferred(), calls=[]
  const catalog=JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json',import.meta.url)))
  const driver=new SanctumLiveDriver({catalog,makeClient:()=>({shutdown:async()=>{}})})
  driver.assertLog=()=>({floorId:'f'})
  driver.logContext={context:{sessionKey:'s',processId:1,areaId:'sanctum',seed:1},close(){}}
  driver.profile={environment,interfaceTitles:{'sanctum-map-hud':{}},mapEffectIconsRegion:{}}
  driver.sessionRequest=async command=>{
    calls.push(command)
    if(command==='interfaceState')return {hudLayout:'map',mapOpen:true}
    return {coverageConfirmed:true,icons:[{},{}]}
  }
  driver.freezeTarget=async(command,input,context,signal)=>{
    signal.throwIfAborted();calls.push(input.effectTarget)
    if(input.effectTarget===(last?'effect:2':'effect:1'))f.service.setForeground(false)
    return {binding:context,data:{png:'frozen',targetId:input.effectTarget,region:{x:0,y:0,width:10,height:10}}}
  }
  driver.recognizeCaptured=async(data,signal)=>{await gate.promise;signal.throwIfAborted();return {status:'located',texts:data.targetId==='effect:2'?['完成禁域时获得60x工匠石']:['焦化硬币','找到的耀金币数量减少50%']}}
  f.driver.finalizeFloor=driver.finalizeFloor.bind(driver)
  const task=f.run();await f.ended.promise;gate.resolve();await task
  assert.equal(f.service.state.floor.effectScan.complete,last)
  assert.equal(f.service.state.floor.effectScan.targets[0].stage,'matched')
  assert.ok(f.service.state.currentEffects.some(effect=>effect.name==='焦化硬币'))
  if(!last)assert.equal(f.service.state.floor.effectScan.targets[1].stage,'skipped')
  else assert.equal(f.service.state.floor.effectScan.rewardGroups[0].rewards[0].quantity,60)
  assert.equal(f.service.state.status,last?'ready':'partial')
  assert.deepEqual(f.counts(),{ends:1,releases:1})
  await driver.close()
})

test('状态截图全部取得，恢复地图请求被失焦取消时不制造识别缺口',async t=>{
  const f=fixture(t), gate=deferred(), commands=[]
  const driver=new SanctumLiveDriver({catalog:JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json',import.meta.url)))})
  driver.assertLog=()=>({floorId:'f'})
  driver.logContext={context:{sessionKey:'s',processId:1,areaId:'sanctum',seed:1},close(){}}
  driver.profile={environment,interfaceTitles:{'sanctum-hud':{}},effectIconsRegion:{}}
  let checks=0
  driver.sessionRequest=async(command,options,signal)=>{
    commands.push(command)
    if(command==='interfaceState') {
      if(checks++===0)return {hudLayout:'standalone',mapOpen:true}
      f.service.setForeground(false)
      for(const fn of driver.progressListeners)fn({diagnostic:{stage:'checking-interface',outcome:'failed',reason:'圣所采集已停止'}})
      throw sanctumError('SAFETY_INTERRUPTED','圣所采集已停止')
    }
    if(command==='inspectEffects')return {coverageConfirmed:true,icons:[{}]}
    return {}
  }
  driver.freezeTarget=async(command,input,binding)=>({binding,data:{png:'frozen'}})
  driver.recognizeCaptured=async()=>{await gate.promise;return {status:'located',texts:['完成禁域时获得60x工匠石']}}
  f.driver.subscribeProgress=driver.subscribeProgress.bind(driver)
  f.driver.finalizeFloor=driver.finalizeFloor.bind(driver)
  const task=f.run();await f.ended.promise;gate.resolve();await task
  assert.equal(f.service.state.status,'ready')
  assert.equal(f.service.state.floor.effectScan.complete,true)
  assert.equal(f.repository.load().persistedRoute.incomplete,false)
  assert.equal(commands.filter(command=>command==='toggleMap').length,1)
  await driver.close()
})
