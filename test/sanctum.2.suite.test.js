import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import _m0_fs from 'node:fs'
import _m0_os from 'node:os'
import _m0_path from 'node:path'
import { SanctumService as _m0_SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumLiveDriver as _m0_SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumRepository as _m0_SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { AutomationLock as _m0_AutomationLock } from '../electron/modules/automation/lock.js'
import { SanctumFramePipeline as _m0_SanctumFramePipeline } from '../electron/modules/sanctum/framePipeline.js'
import { sanctumError as _m0_sanctumError } from '../electron/modules/sanctum/errors.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import _m1_fs from 'node:fs'
import _m1_path from 'node:path'
import _m1_os from 'node:os'
import { SanctumRepository as _m1_SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { SanctumService as _m1_SanctumService } from '../electron/modules/sanctum/service.js'
import { emptySanctumState as _m1_emptySanctumState } from '../shared/sanctum.js'
import { preservePreviousCapture as _m1_preservePreviousCapture } from '../electron/modules/sanctum/previousCapture.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { SanctumOverlay as _m2_SanctumOverlay, sanctumOverlaySnapshot as _m2_sanctumOverlaySnapshot } from '../electron/modules/sanctum/overlay.js'
import { SanctumService as _m2_SanctumService } from '../electron/modules/sanctum/service.js'
import { sanctumDisplay as _m2_sanctumDisplay } from '../shared/sanctumDisplay.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { SanctumOverlay as _m3_SanctumOverlay } from '../electron/modules/sanctum/overlay.js'
import { SanctumControlOverlay as _m3_SanctumControlOverlay } from '../electron/modules/sanctum/controlOverlay.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import _m4_fs from 'node:fs'
import _m4_os from 'node:os'
import _m4_path from 'node:path'
import { SanctumRepository as _m4_SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { SanctumService as _m4_SanctumService } from '../electron/modules/sanctum/service.js'
import { sanctumOverlaySnapshot as _m4_sanctumOverlaySnapshot } from '../electron/modules/sanctum/overlay.js'
import { observationKey as _m4_observationKey, currentRunObservation as _m4_currentRunObservation } from '../electron/modules/sanctum/runObservation.js'
import { resourceSummary as _m4_resourceSummary } from '../shared/sanctumPresentation.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { createSanctumStrategy as _m5_createSanctumStrategy, validateSanctumStrategy as _m5_validateSanctumStrategy } from '../shared/sanctum.js'
import { planSanctumFloor as _m5_plan } from '../electron/modules/sanctum/planner.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { captureButton as _m6_captureButton, observationBinding as _m6_observationBinding, resourceSummary as _m6_resourceSummary, rewardSummary as _m6_rewardSummary, sanctumPageDisplay as _m6_sanctumPageDisplay, calibrationIssues as _m6_calibrationIssues, sanctumDisplayFloors as _m6_sanctumDisplayFloors } from '../shared/sanctumPresentation.js'
import { sanctumPositionUnconfirmed as _m6_sanctumPositionUnconfirmed } from '../shared/sanctumDisplay.js'
import { sanctumControlState as _m6_sanctumControlState } from '../electron/modules/sanctum/controlOverlay.js'
import { SanctumService as _m6_SanctumService } from '../electron/modules/sanctum/service.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { planSanctumFloor as _m7_planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { createSanctumStrategy as _m7_createSanctumStrategy } from '../shared/sanctum.js'
import { sanctumDisplay as _m7_sanctumDisplay } from '../shared/sanctumDisplay.js'
import { sanctumOverlaySnapshot as _m7_sanctumOverlaySnapshot } from '../electron/modules/sanctum/overlay.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { readFileSync as _m8_readFileSync } from 'node:fs'
import { parseSanctumResearch as _m8_parseSanctumResearch } from '../electron/modules/sanctum/research.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { SanctumService as _m9_SanctumService } from '../electron/modules/sanctum/service.js'
import { captureButton as _m9_captureButton } from '../shared/sanctumPresentation.js'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import { SanctumService as _m10_SanctumService } from '../electron/modules/sanctum/service.js'
import { sanctumOverlaySnapshot as _m10_sanctumOverlaySnapshot, SanctumOverlay as _m10_SanctumOverlay } from '../electron/modules/sanctum/overlay.js'
import _m11_test from 'node:test'
import _m11_assert from 'node:assert/strict'
import { SanctumService as _m11_SanctumService } from '../electron/modules/sanctum/service.js'
import { emptySanctumState as _m11_emptySanctumState, createSanctumStrategy as _m11_createSanctumStrategy } from '../shared/sanctum.js'
import { listSanctumSamples as _m11_listSanctumSamples, replaySanctumSample as _m11_replaySanctumSample } from '../electron/modules/sanctum/replay.js'
import _m12_test from 'node:test'
import _m12_assert from 'node:assert/strict'
import _m12_fs from 'node:fs'
import _m12_os from 'node:os'
import _m12_path from 'node:path'
import { emptySanctumState as _m12_emptySanctumState } from '../shared/sanctum.js'
import { acceptSanctumFloor as _m12_acceptSanctumFloor, resetSanctumRun as _m12_resetSanctumRun } from '../electron/modules/sanctum/state.js'
import { SanctumRepository as _m12_SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { liveProfile as _m12_liveProfile } from '../shared/sanctumLive.js'
import { recognizeRoomProfile as _m12_recognizeRoomProfile } from '../shared/sanctumRoomProfiles.js'
import _m13_test from 'node:test'
import _m13_assert from 'node:assert/strict'
import _m13_fs from 'node:fs'
import { sanctumRule as _m13_sanctumRule, isCurrentSanctumEntry as _m13_isCurrentSanctumEntry } from '../electron/modules/sanctum/catalog.js'
import { parseEffectTooltip as _m13_parseEffectTooltip } from '../electron/modules/sanctum/effectRecognition.js'
import { applySanctumEffects as _m13_applySanctumEffects, createSanctumStrategy as _m13_createSanctumStrategy } from '../shared/sanctum.js'
import { initialEffectState as _m13_initialEffectState, advanceSanctumRoom as _m13_advanceSanctumRoom } from '../shared/sanctumStateEvaluation.js'
import { completedEffectGroups as _m13_completedEffectGroups, emptyEffectGroups as _m13_emptyEffectGroups, mergeEffectGroups as _m13_mergeEffectGroups, effectReadIssues as _m13_effectReadIssues } from '../shared/sanctumEffects.js'
import { planSanctumFloor as _m13_planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { observationKey as _m13_observationKey } from '../electron/modules/sanctum/runObservation.js'

// === Merged from sanctumForegroundAnalysis.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const fs = _m0_fs
  const os = _m0_os
  const path = _m0_path
  const SanctumService = _m0_SanctumService
  const SanctumLiveDriver = _m0_SanctumLiveDriver
  const SanctumRepository = _m0_SanctumRepository
  const AutomationLock = _m0_AutomationLock
  const SanctumFramePipeline = _m0_SanctumFramePipeline
  const sanctumError = _m0_sanctumError
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
  else assert.equal(f.service.state.floor.effectScan.targets[1].contentKind,'reward')
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
})()

// === Merged from sanctumImagePersistence.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const fs = _m1_fs
  const path = _m1_path
  const os = _m1_os
  const SanctumRepository = _m1_SanctumRepository
  const SanctumService = _m1_SanctumService
  const emptySanctumState = _m1_emptySanctumState
  const preservePreviousCapture = _m1_preservePreviousCapture
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
const frame={png,width:1,height:1,region:{x:0,y:0,width:1,height:1}}
const binding={runId:'run',floorId:'floor',roomId:'r',sessionId:'session'}
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sanctum-images-test-'))
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}))
  const repository=new SanctumRepository(root),state=emptySanctumState()
  state.enabled=true
  state.floor={identityConfirmed:true,runId:'run',floorId:'floor',mapKey:'map',revision:1,rooms:[],edges:[]}
  return {root,repository,state}
}
const put = (repository,roomId='r') => repository.evidence.add({...binding,roomId},frame)
const room = (id,evidenceId,text='原文') => ({id,detailsStatus:'matched',readStages:{ocr:'matched'},recognition:{evidenceId,region:frame.region},rawText:text})

test('浮窗整轮失败及连续部分重采始终保留最近一次成功结果',()=>{
  const base={floorId:'f',runId:'r',mapKey:'m',rooms:[]}
  const target=(evidenceId)=>({targetId:'effect:1',evidenceId,stage:'matched',texts:[evidenceId]})
  const first={...base,effectScan:{complete:true,targets:[target('first')]}}
  const failed=preservePreviousCapture({...base,effectScan:{complete:false,targets:[]}},first)
  assert.equal(failed.previousEffectTargets[0].evidenceId,'first')
  const second=preservePreviousCapture({...base,effectScan:{complete:false,targets:[target('second')]}},failed)
  const third=preservePreviousCapture({...base,effectScan:{complete:false,targets:[{targetId:'effect:1',stage:'ocr-failed'}]}},second)
  assert.equal(third.effectScan.targets[0].previousCapture.binding.evidenceId,'second')
  assert.deepEqual(third.effectScan.targets[0].previousCapture.result.texts,['second'])
  const fresh=preservePreviousCapture({...base,effectScan:{complete:true,targets:[target('third')]}},third)
  assert.equal(fresh.previousEffectTargets,undefined)
  assert.equal(fresh.effectScan.targets[0].previousCapture,undefined)
})

test('超过20张及内存预算仍可看，图片与文字跨重启保存，重置清理',async t=>{
  const {root,repository,state}=fixture(t)
  repository.evidence.maxCount=2;repository.evidence.maxBytes=80
  for(let i=0;i<25;i++) state.floor.rooms.push(room(`r${i}`,put(repository,`r${i}`),`原文${i}`))
  repository.save(state)
  assert.ok(repository.evidence.bytes<=80)
  const restarted=new SanctumService({repository:new SanctumRepository(root)})
  for(const r of restarted.state.floor.rooms) assert.ok(restarted.getRoomEvidence({...binding,roomId:r.id,evidenceId:r.recognition.evidenceId}).dataUrl)
  assert.equal(restarted.state.floor.rooms[0].rawText,'原文0')
  await restarted.shutdown()
  assert.equal(fs.readdirSync(path.join(root,'sanctum-images')).length,25)
  const again=new SanctumService({repository:new SanctumRepository(root)})
  again.resetRun()
  assert.equal(fs.readdirSync(path.join(root,'sanctum-images')).length,0)
})

test('新采集失败保留旧图片及其原文，成功后原子替换且删除旧图',t=>{
  const {root,repository,state}=fixture(t)
  const oldId=put(repository)
  state.floor.rooms=[room('r',oldId,'上次成功原文')]
  repository.save(state)
  const oldFloor=structuredClone(state.floor),failedId=put(repository)
  state.floor=preservePreviousCapture({...state.floor,rooms:[{...room('r',failedId,'失败碎片'),detailsStatus:'failed',failureReason:'OCR超时'}]},oldFloor)
  repository.save(state);repository.evidence.clear()
  assert.equal(fs.readdirSync(path.join(root,'sanctum-images')).length,1)
  const restarted=new SanctumService({repository:new SanctumRepository(root)})
  const previous=restarted.state.floor.rooms[0].previousCapture
  assert.equal(previous.result.rawText,'上次成功原文')
  assert.equal(previous.binding.evidenceId,oldId)
  assert.ok(restarted.getRoomEvidence(previous.binding).previousCapture)
  const freshId=put(repository)
  state.floor=preservePreviousCapture({...state.floor,rooms:[room('r',freshId,'新的成功原文')]},state.floor)
  repository.save(state)
  assert.equal(fs.existsSync(path.join(root,'sanctum-images',`${oldId}.png`)),false)
  const loaded=new SanctumRepository(root).load()
  assert.equal(loaded.floor.rooms[0].rawText,'新的成功原文')
  assert.equal(loaded.floor.rooms[0].previousCapture,undefined)
})

test('存档替换失败不删除旧图片，新候选不覆盖磁盘结果',t=>{
  const {root,repository,state}=fixture(t)
  const id=put(repository)
  state.floor.rooms=[room('r',id)]
  repository.save(state)
  state.floor.rooms=[room('r',put(repository),'新文字')]
  const original=fs.renameSync
  fs.renameSync=()=>{throw new Error('模拟磁盘拒绝')}
  try { assert.throws(()=>repository.save(state),/模拟磁盘拒绝/) } finally {fs.renameSync=original}
  const loaded=new SanctumRepository(root)
  assert.equal(loaded.load().floor.rooms[0].recognition.evidenceId,id)
  assert.ok(loaded.evidence.image({...binding,evidenceId:id}).dataUrl)
})

test('状态浮窗重启查看、失败保留旧目标绑定，非法图片引用不访问文件',t=>{
  const {root,repository,state}=fixture(t)
  const image={...frame,kind:'effect-crop',sourceRegion:{x:4,y:5,width:1,height:1},sourceWidth:10,sourceHeight:10}
  const id=repository.evidence.add({...binding,roomId:'effect:1'},image)
  state.floor.effectScan={complete:true,targets:[{targetId:'effect:1',evidenceId:id,texts:['旧状态'],stage:'matched'}]}
  repository.save(state)
  state.floor=preservePreviousCapture({...state.floor,effectScan:{complete:false,targets:[{targetId:'effect:1',stage:'ocr-failed',reason:'超时'}]}},state.floor)
  repository.save(state)
  const restarted=new SanctumService({repository:new SanctumRepository(root)})
  const old=restarted.state.floor.effectScan.targets[0].previousCapture
  assert.deepEqual(old.result.texts,['旧状态'])
  assert.equal(restarted.getEffectEvidence(old.binding).kind,'effect-crop')
  assert.throws(()=>restarted.getEffectEvidence({...old.binding,targetId:'effect:2'}),/过期/)
  repository.evidence.restore([{...binding,evidenceId:'../../outside',width:1,height:1}])
  assert.equal(repository.evidence.records.has('../../outside'),false)
})
})()

// === Merged from sanctumOverlay.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const SanctumOverlay = _m2_SanctumOverlay
  const sanctumOverlaySnapshot = _m2_sanctumOverlaySnapshot
  const SanctumService = _m2_SanctumService
  const sanctumDisplay = _m2_sanctumDisplay
const state = () => ({ enabled: true, foreground: true, running: true, reason: '部分识别', inventory: [],
  marks: { targets: ['b'], avoid: ['c'] }, recommendation: { runId: 'run', floorId: 'floor', revision: 1, status: 'partial', paths: [{ rooms: ['a', 'b'] }], reason: '已知信息推荐', unknown: ['奖励未知'] },
  observation: { foreground: true, interfaceMatched: true, mapOpen: true, receivedAt: 1000,
    clientBounds: { x: -1920, y: 100, width: 1920, height: 1080 }, mapRegion: { x: 100, y: 100, width: 1500, height: 800 } },
  floor: { identityConfirmed: true, runId: 'run', floorId: 'floor', revision: 1, positionStatus: 'confirmed', currentRoomId: 'a', width: 1500, height: 800,
    rooms: [{ id: 'a', column: 0, status: 'matched', x: 50, y: 100, width: 80, height: 120 }, { id: 'b', column: 1, status: 'matched', detailsStatus: 'matched', name: '宝库', x: 200, y: 200, width: 80, height: 120 },
      { id: 'c', column: 1, status: 'matched', x: 200, y: 400, width: 80, height: 120 }],
    edges: [{ from: 'a', to: 'b', status: 'matched', availability: 'gold' }, { from: 'a', to: 'c', status: 'unknown' }] } })

test('实际OCR框使用客户区坐标，移动到新目标及定位失败不沿用旧框', () => {
  const s=state(), region={x:300,y:200,width:500,height:250}
  s.progress={stage:'rooms',step:'ocr',targetId:'a',region}
  assert.deepEqual(sanctumOverlaySnapshot(s,1000).ocrRegion,region)
  s.progress={stage:'rooms',step:'moving',targetId:'b'}
  assert.equal(sanctumOverlaySnapshot(s,1000).ocrRegion,null)
  s.progress={stage:'rooms',step:'locating',targetId:'b',region:null}
  assert.equal(sanctumOverlaySnapshot(s,1000).recognitionMessage,'未找到识别区域')
  s.progress.region={...region,x:1800}
  assert.equal(sanctumOverlaySnapshot(s,1000).ocrRegion,null)
})

test('路线浮窗叠加地图偏移，呈现下一房、路径、避让及未知', () => {
  const result = sanctumOverlaySnapshot(state(), 1000)
  assert.equal(result.nextRoom, '宝库')
  assert.equal(result.rooms[0].x, 150)
  assert.equal(result.rooms[1].y, 300)
  assert.equal(result.rooms[2].avoided, true)
  assert.equal(result.lines[0].recommended, true)
  assert.equal(result.lines[1].displayState, 'unknown')
  assert.equal(result.rooms[1].next, true)
  assert.deepEqual(result.unknown, ['奖励未知'])
})

test('页面显示投影与浮窗状态一致，旧版本不再显示推荐', () => {
  const value = state()
  const display = sanctumDisplay(value.floor, value.recommendation, value.marks)
  const overlay = sanctumOverlaySnapshot(value, 1000)
  for (const room of overlay.rooms) {
    const expected = display.rooms.find(item => item.id === room.id)
    for (const key of ['displayState', 'current', 'recommended', 'next', 'target', 'avoided']) assert.equal(room[key], expected[key])
  }
  overlay.lines.forEach((line, index) => {
    assert.equal(line.displayState, display.lines[index].displayState)
    assert.equal(line.recommended, display.lines[index].recommended)
    assert.equal(line.x1, display.lines[index].x1 + 100)
    assert.equal(line.y2, display.lines[index].y2 + 100)
  })
  value.recommendation.revision = 0
  const stale = sanctumOverlaySnapshot(value, 1000)
  assert.equal(stale.nextRoom, '')
  assert.ok(stale.rooms.every(room => !room.recommended && !room.next))
  assert.ok(stale.lines.every(line => !line.recommended))
})

test('离线图、停用、切出、关图、过期或缺失证据及尺寸失配均隐藏', () => {
  const cases = [value => { value.enabled = false }, value => { value.foreground = false }, value => { value.running = false },
    value => { value.floor.sampleId = 'sample.png' }, value => { value.floor.identityConfirmed = false },
    value => { value.observation.mapOpen = false }, value => { value.observation.interfaceMatched = false },
    value => { value.observation.receivedAt = -1000 }, value => { delete value.observation.receivedAt },
    value => { value.observation.receivedAt = 2000 }, value => { value.observation.mapRegion.width = 1400 }]
  for (const change of cases) { const value = state(); change(value); assert.equal(sanctumOverlaySnapshot(value, 1000), null) }
})

function fixture() {
  let current = state(), now = 1000, changed, tick
  const windows = []
  class Window {
    constructor(options) {
      this.options = options; this.events = {}; this.visible = false; this.loading = true
      this.webContents = { on: (name, callback) => { this.events[name] = callback }, isLoadingMainFrame: () => this.loading,
        send: (_name, value) => { this.sent = value } }
      windows.push(this)
    }
    setAlwaysOnTop() {}
    setIgnoreMouseEvents(value) { this.passthrough = value }
    setContentProtection(value) { this.protected = value }
    setBounds(value) { this.bounds = value }
    getBounds() { return this.bounds || {} }
    isVisible() { return this.visible }
    showInactive() { this.visible = true }
    hide() { this.visible = false }
    isDestroyed() { return Boolean(this.destroyed) }
    on(name, callback) { this.events[name] = callback }
    async loadFile() {}
    async loadURL() {}
    destroy() { this.destroyed = true; this.visible = false; this.events.closed?.() }
    loaded() { this.loading = false; this.events['did-finish-load']() }
  }
  const service = { getState: () => current, subscribe: callback => { changed = callback; return () => { changed = null } } }
  const overlay = new SanctumOverlay({ service, BrowserWindowClass: Window, now: () => now, platform: 'win32',
    screenApi: { screenToDipRect: (_window, rect) => Object.fromEntries(Object.entries(rect).map(([key, value]) => [key, value / 1.5])) },
    setIntervalFn: callback => { tick = callback; return 1 }, clearIntervalFn: () => { tick = null }, settle: async () => {} })
  return { overlay, windows, change(value) { current = value; changed?.() }, advance(value) { now = value; tick?.() },
    get disposed() { return !changed && !tick } }
}

test('窗口惰性创建、不可聚焦、穿透及截图保护，正确转换负坐标与 DPI', () => {
  const f = fixture()
  assert.equal(f.windows.length, 0)
  f.overlay.sync()
  const window = f.windows[0]
  assert.equal(window.options.focusable, false)
  assert.equal(window.passthrough, true)
  assert.equal(window.protected, true)
  assert.equal(window.visible, false)
  window.loaded()
  assert.deepEqual(window.bounds, { x: -1280, y: 67, width: 1280, height: 720 })
  assert.equal(window.visible, true)
  f.advance(2501)
  assert.equal(window.visible, false)
  f.overlay.destroy()
  assert.equal(window.destroyed, true)
  assert.equal(f.disposed, true)
})

test('加载期间切出不会迟到显示，截图期间禁止重显且异常后恢复最新可见性', async () => {
  const f = fixture()
  f.overlay.sync()
  const window = f.windows[0]
  f.change({ ...state(), foreground: false })
  window.loaded()
  assert.equal(window.visible, false)
  f.change(state())
  assert.equal(window.visible, true)
  await assert.rejects(f.overlay.withHidden(async () => {
    assert.equal(window.visible, false)
    f.overlay.sync()
    assert.equal(window.visible, false)
    await f.overlay.withHidden(async () => assert.equal(window.visible, false))
    assert.equal(window.visible, false)
    throw new Error('截图失败')
  }), /截图失败/)
  assert.equal(window.visible, true)
  await f.overlay.withHidden(async () => { f.change({ ...state(), enabled: false }) })
  assert.equal(window.visible, false)
  f.overlay.destroy()
})
})()

// === Merged from sanctumOverlayLifecycle.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const SanctumOverlay = _m3_SanctumOverlay
  const SanctumControlOverlay = _m3_SanctumControlOverlay
function fixture(t, kind) {
  const windows = [], listeners = new Set()
  const switches = new Set(), animationKey = 'wm-window-animations-disabled'
  const commandLine = { hasSwitch: key => switches.has(key), appendSwitch: key => switches.add(key), removeSwitch: key => switches.delete(key) }
  let current = { enabled: true, foreground: true, running: true, inventory: [], marks: { avoid: [], targets: [] },
    observation: { foreground: true, interfaceMatched: true, receivedAt: Date.now(), mapOpen: true,
      clientBounds: { x: 100, y: 80, width: 800, height: 600 }, mapRegion: { x: 0, y: 0, width: 800, height: 600 } },
    floor: { identityConfirmed: true, width: 800, height: 600, rooms: [], edges: [] } }
  const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn) }
  const service = { enabled: true, state: {}, getState: () => current, subscribe }
  class Window {
    constructor(options) {
      this.bounds = options; this.visible = false; this.calls = { hide: 0, show: 0, bounds: 0 }
      this.events = {}; this.webContents = { on() {}, isLoadingMainFrame: () => false, send() {} }
      windows.push(this)
    }
    setAlwaysOnTop() {} setContentProtection() {}
    setIgnoreMouseEvents(ignore, options) { this.mouse = { ignore, ...options } }
    isVisible() { assert.equal(this.destroyed, undefined); return this.visible }
    isDestroyed() { return Boolean(this.destroyed) }
    getBounds() { return { ...this.bounds } }
    setBounds(bounds) { this.bounds = bounds; this.calls.bounds++ }
    showInactive() { assert.ok(switches.has(animationKey)); this.visible = true; this.calls.show++ }
    hide() { assert.ok(switches.has(animationKey)); this.visible = false; this.calls.hide++ }
    on(name, fn) { this.events[name] = fn }
    loadFile() {} loadURL() {}
    destroy() { this.destroyed = true; this.visible = false; this.events.closed?.() }
  }
  const display = { id: 1, workArea: { x: 0, y: 0, width: 1920, height: 1080 } }
  const options = { service, BrowserWindowClass: Window, settle: async () => {}, platform: 'win32', commandLine,
    screenApi: { screenToDipRect: (_window, rect) => rect, getAllDisplays: () => [display], getPrimaryDisplay: () => display },
    detection: { subscribe, registerConsumer() {}, unregisterConsumer() {}, getState: () => ({}) },
    automationLock: { subscribe, getState: () => ({}) } }
  const overlay = kind === 'route' ? new SanctumOverlay(options) : new SanctumControlOverlay(options)
  t.after(() => overlay.destroy())
  overlay.sync()
  assert.equal(switches.size, 0)
  const window = windows[0]
  return { overlay, window, windows, stop() { current = { ...current, running: false, observation: null }; overlay.sync() },
    restart() { current = { ...current, running: true, observation: { foreground: true, interfaceMatched: true, receivedAt: Date.now(), mapOpen: true,
      clientBounds: { x: 100, y: 80, width: 800, height: 600 }, mapRegion: { x: 0, y: 0, width: 800, height: 600 } } }; overlay.sync() } }
}

test('路线浮窗穿透不转发，按实际边界恢复原生移动', t => {
  const { overlay, window } = fixture(t, 'route')
  assert.deepEqual(window.mouse, { ignore: true, forward: false })
  const bounds = window.getBounds(), count = window.calls.bounds
  overlay.sync(); overlay.sync()
  assert.equal(window.calls.bounds, count)
  window.bounds = { ...bounds, y: bounds.y + 40 }
  overlay.sync()
  assert.deepEqual(window.getBounds(), bounds)
  assert.equal(window.calls.bounds, count + 1)
})

for (const kind of ['route', 'control']) {
  test(`${kind}: 三轮停止重启，重复同步没有显隐副作用`, t => {
    const f = fixture(t, kind), w = f.window
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < 20; i++) f.overlay.sync()
      assert.equal(w.calls.show, round + 1)
      f.stop()
      for (let i = 0; i < 20; i++) f.overlay.sync()
      assert.equal(w.visible, false)
      assert.equal(w.calls.hide, round + 1)
      f.restart()
      assert.equal(w.visible, true)
    }
    // 原生截图代码可改变实际可见状态，不能只依赖 JS 缓存。
    w.visible = false
    const shows = w.calls.show
    f.overlay.sync()
    assert.equal(w.calls.show, shows + 1)
    assert.equal(f.windows.length, 1)
  })

  test(`${kind}: 嵌套截图异常恢复，停止后不恢复过期窗口`, async t => {
    const f = fixture(t, kind), w = f.window
    await assert.rejects(f.overlay.withHidden(async () => {
      assert.equal(w.visible, false)
      await f.overlay.withHidden(async () => f.overlay.sync())
      assert.equal(w.calls.hide, 1)
      assert.equal(w.visible, false)
      throw new Error('capture failed')
    }), /capture failed/)
    assert.equal(w.visible, true)
    assert.equal(w.calls.show, 2)
    await f.overlay.withHidden(async () => f.stop())
    assert.equal(w.visible, false)
    assert.equal(w.calls.hide, 2)
    assert.equal(w.calls.show, 2)
  })

  test(`${kind}: 截图期间销毁不复活窗口`, async t => {
    const f = fixture(t, kind)
    await f.overlay.withHidden(async () => f.overlay.destroy())
    f.overlay.sync()
    assert.equal(f.window.destroyed, true)
    assert.equal(f.windows.length, 1)
    await assert.rejects(f.overlay.withHidden(async () => assert.fail('destroyed capture ran')), /已关闭/)
  })
}
})()

// === Merged from sanctumPersistence.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const fs = _m4_fs
  const os = _m4_os
  const path = _m4_path
  const SanctumRepository = _m4_SanctumRepository
  const SanctumService = _m4_SanctumService
  const sanctumOverlaySnapshot = _m4_sanctumOverlaySnapshot
  const observationKey = _m4_observationKey
  const currentRunObservation = _m4_currentRunObservation
  const resourceSummary = _m4_resourceSummary
const environment = { width: 1920, height: 1080, dpi: 96 }
const detection = (overrides = {}) => ({ running: true, foreground: true, receivedAt: Date.now(),
  interfaces: { 'sanctum-map': { matched: true } }, gameBounds: { left: 0, top: 0, ...environment }, ...overrides })
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-persist-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const repository = new SanctumRepository(root), service = new SanctumService({ repository })
  service.setEnabled(true)
  service.state.floor = { identityConfirmed: true, runId: 'run', floorId: 'floor', floorNumber: 2, revision: 1,
    width: 1500, height: 800, positionStatus: 'confirmed', currentRoomId: 'r2', exitRoomIds: ['r7'],
    captureSessionId: 'obsolete-session',
    rooms: Array.from({ length: 8 }, (_, column) => ({ id: `r${column}`, column, x: column * 170, y: 100,
      width: 80, height: 100, status: 'matched', detailsStatus: 'matched', recognition: { evidenceId: 'obsolete-image' } })),
    edges: Array.from({ length: 7 }, (_, i) => ({ from: `r${i}`, to: `r${i + 1}`, status: 'matched', availability: 'gold', traversal: 'available' })),
    effectScan: { complete: true, targets: [{ evidenceId: 'effect-image', texts: ['状态原文'] }] } }
  const key = observationKey(service.state.floor)
  service.state.runObservation = { key, status: 'confirmed', resolve: 0, maxResolve: 100, coins: 20, inspiration: 50 }
  service.state.currentEffects = [{ rule: 'cannotRecover' }]
  service.state.progress = { stage: 'complete' }
  service.updateObservation({ foreground: true, interfaceMatched: true, mapOpen: true,
    clientBounds: { x: 0, y: 0, width: 1920, height: 1080 }, mapRegion: { x: 0, y: 0, width: 1500, height: 800 } })
  service.captureEnvironment = environment
  service.recalculate()
  service.persist()
  return { service, repository, restart: () => new SanctumService({ repository }) }
}

test('连续重启保留配套路线、资源、时间与标记，实时证据不复用', async t => {
  const { service, repository, restart } = fixture(t)
  const originalRoute = JSON.parse(JSON.stringify(service.routeResult.recommendation))
  const savedAt = service.state.savedAt
  await service.shutdown()
  for (let i = 0; i < 3; i++) {
    const restored = restart(), state = restored.getState()
    assert.equal(state.running, false)
    assert.equal(state.solving, undefined)
    assert.equal(state.floor.identityConfirmed, false)
    assert.equal(state.floor.currentRoomId, 'r2')
    assert.deepEqual(state.savedRoute.recommendation, originalRoute)
    assert.equal(state.savedRoute.runObservation.coins, 20)
    assert.equal(currentRunObservation(state.runObservation, state.floor), null)
    assert.deepEqual(resourceSummary(state), { resolve: 0, maxResolve: 100, inspiration: 50, coins: 20, percent: 0 })
    assert.equal(state.savedAt, savedAt)
    const overlay = restored.getResultState(detection())
    assert.deepEqual(sanctumOverlaySnapshot(overlay).rooms.map(r => r.id), ['r2', 'r3'])
    assert.equal(restored.observation, null)
    restored.stop()
  }
  const data = fs.readFileSync(repository.file, 'utf8')
  assert.doesNotMatch(data, /obsolete-session|obsolete-image|effect-image/)
  assert.match(data, /状态原文/)
})

test('中断后最新房间与旧路线各自配套保存，重启不恢复排队任务', t => {
  const { service, restart } = fixture(t)
  service.state.running = true
  service.state.floor = { ...service.state.floor, revision: 2, currentRoomId: 'r3' }
  service.state.floor.rooms[4].detailsStatus = 'reading'
  service.state.floor.rooms[4].readStages = { text: 'reading', icons: 'queued' }
  service.state.floor.effectScan.targets = [{ targetId: 'effect', stage: 'reading' }]
  service.state.progress = { stage: 'recognizing', step: 'ocr' }
  service.stop()
  const restored = restart().getState()
  assert.equal(restored.floor.currentRoomId, 'r3')
  assert.equal(restored.savedRoute.floor.currentRoomId, 'r2')
  assert.equal(restored.savedRoute.floor.revision, restored.savedRoute.recommendation.revision)
  assert.equal(restored.floor.rooms[4].detailsStatus, 'failed')
  assert.deepEqual(restored.floor.rooms[4].readStages, { text: 'failed', icons: 'failed' })
  assert.equal(restored.progress.step, null)
  assert.equal(restored.floor.effectScan.targets[0].stage, 'failed')
})

test('恢复后主动采集替换旧结果，末段悬浮清除跨重启保留', async t => {
  const { service: initial, repository, restart } = fixture(t)
  const updated = structuredClone(initial.state.floor)
  updated.currentRoomId = 'r5'
  updated.revision++
  const service = restart()
  let captures = 0
  service.capture = { stop() {}, async run(environment, accept, observe) {
    captures++
    observe({ foreground: true, interfaceMatched: true, mapOpen: true,
      clientBounds: { x: 0, y: 0, width: 1920, height: 1080 }, mapRegion: { x: 0, y: 0, width: 1500, height: 800 } })
    accept(updated)
    return 'complete'
  } }
  assert.equal(captures, 0)
  await service.startCapture(environment)
  assert.equal(captures, 1)
  assert.equal(service.state.restoredFromSave, false)
  const restored = restart()
  assert.equal(restored.getState().savedRoute.floor.currentRoomId, 'r5')
  assert.equal(restored.overlayResult.clearOnMapClose, true)
  restored.getResultState(detection({ receivedAt: Date.now() + 1, interfaces: { 'sanctum-map': { matched: false } } }), Date.now() + 1)
  assert.equal(restored.overlayResult, null)
  assert.equal(new SanctumService({ repository }).overlayResult, null)
})

test('悬浮环境校验、禁用再启用以及重置跨重启有效', t => {
  const { restart } = fixture(t), service = restart()
  for (const changes of [{ foreground: false }, { interfaces: {} }, { interfaces: { 'sanctum-map': { matched: false } } },
    { gameBounds: { left: 0, top: 0, ...environment, dpi: 144 } }, { receivedAt: 0 }]) {
    assert.equal(service.getResultState(detection(changes)), null)
    assert.ok(service.overlayResult)
  }
  service.getResultState(detection({ gameBounds: { left: 20, top: 0, ...environment } }))
  assert.match(service.getState().overlayRestoreWarning, /再次采集/)
  assert.ok(service.getResultState(detection()))
  assert.equal(service.getState().overlayRestoreWarning, '')
  service.setEnabled(false)
  assert.equal(restart().getResultState(detection()), null)
  service.setEnabled(true)
  assert.ok(restart().getResultState(detection()))
  service.resetRun()
  assert.equal(restart().getState().floor, null)
  assert.equal(restart().getState().savedRoute, null)
  assert.equal(restart().overlayResult, null)
})

test('旧存档与损坏可选快照不阻止配置加载', t => {
  const { repository, restart } = fixture(t)
  const data = JSON.parse(fs.readFileSync(repository.file, 'utf8'))
  delete data.savedRoute
  delete data.savedOverlay
  fs.writeFileSync(repository.file, JSON.stringify(data))
  assert.match(restart().state.reason, /尚无已保存路线/)
  data.lastCapture.floor.rooms = [null]
  data.savedRoute = { floor: { rooms: [null], edges: [] } }
  data.savedOverlay = { floor: {} }
  fs.writeFileSync(repository.file, JSON.stringify(data))
  const restored = restart()
  assert.equal(restored.enabled, true)
  assert.notEqual(restored.state.status, 'error')
  assert.equal(restored.state.floor, null)
})

test('人工修正更新配套路线，保存失败保留内存与旧磁盘文件', t => {
  const { service, repository, restart } = fixture(t)
  service.correctRunResources(observationKey(service.state.floor), { resolve: 40, maxResolve: 100, coins: 99, inspiration: 5 })
  assert.equal(restart().getState().savedRoute.runObservation.coins, 99)
  const previous = fs.readFileSync(repository.file, 'utf8')
  repository.save = () => { throw new Error('disk unavailable') }
  assert.throws(() => service.correctRunResources(observationKey(service.state.floor), { resolve: 50, maxResolve: 100, coins: 100, inspiration: 5 }), /disk unavailable/)
  assert.equal(service.state.runObservation.coins, 100)
  assert.match(service.getState().saveError, /保存失败/)
  assert.equal(fs.readFileSync(repository.file, 'utf8'), previous)
})
})()

// === Merged from sanctumPlanner.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const createSanctumStrategy = _m5_createSanctumStrategy
  const validateSanctumStrategy = _m5_validateSanctumStrategy
  const plan = _m5_plan
const planSanctumFloor = (floor,strategy=createSanctumStrategy('reveal'),...args)=>plan(floor,strategy,...args)
function fixture() {
  return { identityConfirmed: true, runId: 'run', floorId: 'floor-2', revision: 1, currentRoomId: 'start',
    rooms: [
      { id: 'start', column: 0, detailsStatus: 'matched' },
      { id: 'reward', column: 1, detailsStatus: 'matched', rewards: [{ currency: '混沌石', quantity: 5, timing: 'run' }] },
      { id: 'heal', column: 1, detailsStatus: 'matched', recovery: 4 },
      { id: 'exit', column: 2, detailsStatus: 'matched', terminal: true }
    ], edges: [['start','reward'],['start','heal'],['reward','exit'],['heal','exit']].map(([from,to]) => ({from,to,status:'matched'})) }
}

test('不可达目标不放宽避让或禁选痛苦', () => {
  assert.equal(planSanctumFloor(fixture(), undefined, { targets: ['reward'], avoid: ['reward'] }).status, 'blocked')
  const floor = fixture(), strategy = createSanctumStrategy('reveal')
  floor.rooms[1].afflictions = [{id:'blind'}]; strategy.bannedAfflictions = ['blind']
  assert.equal(planSanctumFloor(floor, strategy, {targets:['reward']}).status, 'blocked')
})
test('未知连线不进入路径且不把断路当终点', () => {
  const floor = fixture(); floor.edges[2].status = 'unknown'
  const result = planSanctumFloor(floor, undefined, { targets: ['reward'] })
  assert.equal(result.status, 'partial'); assert.equal(result.paths[0].complete, false)
  assert.deepEqual(result.paths[0].rooms, ['start','reward'])
})
test('身份不确定或回环拒绝推荐，当前房奖励不重复计算', () => {
  const floor = fixture(); floor.identityConfirmed = false
  assert.equal(planSanctumFloor(floor).status, 'unknown')
  floor.identityConfirmed = true; floor.currentRoomId = 'reward'
  assert.deepEqual(planSanctumFloor(floor).paths[0].offers, [])
  floor.edges.push({from:'exit',to:'start',status:'matched'})
  assert.equal(planSanctumFloor(floor).status, 'unknown')
})
test('策略拒绝非有限数', () => {
  const strategy = createSanctumStrategy('reveal'); strategy.targetPriority.神圣石 = Infinity
  assert.throws(() => validateSanctumStrategy(strategy))
})
test('地图推进后红色不可达连线不参与推荐', () => {
  const floor = fixture(); floor.edges[0].availability = 'unavailable'
  const result = planSanctumFloor(floor, createSanctumStrategy('quantity'))
  assert.equal(result.paths[0].nextRoomId, 'heal')
  assert.equal(planSanctumFloor(floor, undefined, {targets:['reward']}).status, 'blocked')
})
})()

// === Merged from sanctumPresentation.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const captureButton = _m6_captureButton
  const observationBinding = _m6_observationBinding
  const resourceSummary = _m6_resourceSummary
  const rewardSummary = _m6_rewardSummary
  const sanctumPageDisplay = _m6_sanctumPageDisplay
  const calibrationIssues = _m6_calibrationIssues
  const sanctumDisplayFloors = _m6_sanctumDisplayFloors
  const sanctumPositionUnconfirmed = _m6_sanctumPositionUnconfirmed
  const sanctumControlState = _m6_sanctumControlState
  const SanctumService = _m6_SanctumService
test('按钮退出优先于旧完成状态，锁与识别任务阻止重复启动', () => {
  const state = { liveCalibration: {}, progress: { stage: 'complete' } }
  assert.deepEqual(captureButton({ ...state, captureDraining: true }), { label: '正在完成', disabled: true })
  assert.equal(captureButton(state).label, '分析完成·再次采集')
  for (const field of ['running']) assert.equal(captureButton({ ...state, [field]: true }).disabled, true)
  assert.equal(captureButton(state, { locked: true }).disabled, true)
  assert.equal(captureButton({ ...state, liveCalibration: null }).disabled, true)
})
test('采集按钮按阶段和终态显示，房间计数不泄漏调试内容', () => {
  const base = { liveCalibration: {}, running: true }
  assert.equal(captureButton({ ...base, progress: { stage: 'rooms', step: 'ocr', current: 2, total: 5, targetId: 'private-id' } }).label, '截图房间 2/5')
  assert.equal(captureButton({ ...base, progress: { stage: 'effects' } }).label, '检测效果')
  assert.equal(captureButton({ ...base, progress: { stage: 'map' } }).label, '读取地图')
  for (const stage of ['partial', 'timeout', 'stopped']) assert.equal(captureButton({ ...base, running: false, progress: { stage } }).disabled, false)
  assert.equal(captureButton({ ...base, running: false, status: 'error' }).label, '分析失败·重试')
  const control = sanctumControlState({ ...base, running: false, captureDraining: true }, {}, {})
  assert.equal(control.disabled, true)
  assert.equal(control.label, '正在完成')
})
test('资源卡只使用已确认且当前位置匹配的数据，零与未知分开', () => {
  const floor = { runId: 'run', floorId: 'f1', currentRoomId: 'r1', identityConfirmed: true }
  const state = { floor, runObservation: { status: 'confirmed', key: observationBinding(floor), resolve: 0, maxResolve: 100, coins: 0 } }
  assert.deepEqual(resourceSummary(state), { resolve: 0, maxResolve: 100, inspiration: null, coins: 0, percent: 0 })
  for (const changed of [{ ...floor, currentRoomId: 'r2' }, { ...floor, floorId: 'f2' }, { ...floor, identityConfirmed: false }]) {
    assert.equal(resourceSummary({ ...state, floor: changed }).percent, null)
    assert.equal(resourceSummary({ ...state, floor: changed }).coins, null)
  }
  assert.equal(resourceSummary({ ...state, runObservation: { ...state.runObservation, status: 'unknown' } }).percent, null)
  assert.equal(resourceSummary({ ...state, runObservation: { ...state.runObservation, maxResolve: 0 } }).percent, null)
})
test('地图奖励摘要保留选项，不把未展示数量当识别失败', () => {
  assert.equal(rewardSummary({ rewards: [{ currency: '神圣石', quantity: 2, groupId: 'offer' }, { currency: '神圣石', quantity: null, groupId: 'offer' }] }), '神圣石 / 神圣石')
})
test('主页面重排只改变绘图坐标，保留推荐与原始采集坐标', () => {
  const room = (id, column, y) => ({ id, column, y, x: column * 500, width: 100, height: 60, status: 'matched', detailsStatus: 'matched' })
  const floor = { identityConfirmed: true, runId: 'r', floorId: 'f', revision: 1, initialSelection: true, startRoomIds: ['a'], rooms: [room('a', 0, 900), room('b', 1, 100), room('c', 1, 800)], edges: [{ from: 'a', to: 'b', status: 'matched', availability: 'gold', traversal: 'available' }] }
  const original = structuredClone(floor)
  const display = sanctumPageDisplay(floor, { runId: 'r', floorId: 'f', revision: 1, status: 'ready', paths: [{ rooms: ['a', 'b'] }] })
  assert.deepEqual(floor, original)
  assert.equal(display.nextRoomId, 'a')
  assert.equal(display.rooms.find(room => room.id === 'b').y < display.rooms.find(room => room.id === 'c').y, true)
  assert.ok(display.rooms.every(room => room.width === 190))
  assert.equal(sanctumPageDisplay(null).rooms.length, 0)
})
test('有公共配置时，缺失地图截图和标题给出具体校准缺口', () => {
  const state = { liveCalibration: {}, publicTitles: { templates: {} } }
  assert.deepEqual(calibrationIssues(state), ['地图范围截图', '地图标题截图'])
  assert.equal(captureButton(state).disabled, true)
  state.liveCalibration.captures = { mapRegion: {} }
  state.publicTitles.templates['sanctum-map'] = {}
  assert.deepEqual(calibrationIssues(state), [])
  assert.equal(captureButton(state).disabled, false)
})
test('重识别未确认位置时以实时结果为准，不沿用历史快照的当前位置', () => {
  const live = { identityConfirmed: true, runId: 'r2', floorId: 'f', revision: 2, positionStatus: 'unknown', currentRoomId: null, rooms: [] }
  const saved = { floor: { identityConfirmed: true, runId: 'r1', floorId: 'f', revision: 1, positionStatus: 'confirmed', currentRoomId: 'old' } }
  const state = { floor: live, savedRoute: saved, restoredFromSave: false }
  const views = sanctumDisplayFloors(state)
  assert.equal(views.live, live)
  assert.equal(views.history, null)
  assert.equal(views.floor, live)
  assert.equal(sanctumPositionUnconfirmed(live), true)
  const stopped = { ...live, identityConfirmed: false }
  const history = sanctumDisplayFloors({ ...state, floor: stopped })
  assert.equal(history.live, null)
  assert.equal(history.history, saved)
  assert.equal(history.floor, saved.floor)
  assert.equal(sanctumPositionUnconfirmed(stopped), false)
  assert.equal(sanctumPositionUnconfirmed({ ...live, positionStatus: 'confirmed', currentRoomId: 'a' }), false)
  assert.equal(sanctumPositionUnconfirmed({ ...live, positionStatus: 'initial', initialSelection: true }), false)
  assert.equal(sanctumPositionUnconfirmed({ ...live, identityConfirmed: false }), false)
})
test('采集异常保留主窗口详细原因，并让按钮显示失败重试', async () => {
  const service = new SanctumService({})
  service.setEnabled(true)
  service.state.liveCalibration = {}
  service.capture = { stop() {}, async run() { throw new Error('地图窗口环境发生变化') } }
  const state = await service.startCapture({})
  assert.equal(state.status, 'error')
  assert.match(state.reason, /地图窗口环境发生变化/)
  assert.equal(captureButton(state).label, '分析失败·重试')
  assert.equal(state.running, false)
})
})()

// === Merged from sanctumRecommendationBoundary.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const planSanctumFloor = _m7_planSanctumFloor
  const createSanctumStrategy = _m7_createSanctumStrategy
  const sanctumDisplay = _m7_sanctumDisplay
  const sanctumOverlaySnapshot = _m7_sanctumOverlaySnapshot
const edge = (from, to) => ({ from, to, status: 'matched', availability: 'gold', traversal: 'available' })
function fixture() {
  return { identityConfirmed: true, runId: 'r', floorId: 'f', revision: 1, positionStatus: 'confirmed', currentRoomId: 's',
    width: 1500, height: 800, exitRoomIds: ['z'],
    rooms: ['s', 'a', 'u', 'z'].map((id, column) => ({ id, column, status: 'matched',
      detailsStatus: column === 1 || column === 3 ? 'matched' : 'unknown',
      terminal: id === 'z', x: column * 200, y: 100, width: 100, height: 80,
      rewards: column === 1 ? [{ currency: '神圣石', quantity: null, quantityStatus: 'not-shown', timingStatus: 'not-shown' }] : [] })),
    edges: [edge('s', 'a'), edge('a', 'u'), edge('u', 'z')] }
}

for (const preset of ['reveal', 'quantity']) {
  const plan = (f, marks = {}) => planSanctumFloor(f, createSanctumStrategy(preset), marks)
  test(`${preset}: 已知段结束，未知内容及远处出口不进入结果`, () => {
    const f = fixture(), before = plan(f)
    assert.equal(before.status, 'partial')
    assert.deepEqual(before.paths[0].rooms, ['s', 'a'])
    assert.equal(before.paths[0].complete, false)
    assert.deepEqual(before.paths[0].breakdown.map(p => p.roomId), ['a'])
    assert.ok((before.paths[0].offers || []).every(o => o.roomId === 'a'))
    Object.assign(f.rooms[2], { rewards: [{currency:'神圣石',quantity:999,timing:'run'}],
      recovery: 999, effects: [{ rule: 'cannotRecover', trigger: 'entry' }], afflictions: [{ id: 'bad' }] })
    f.rooms[3].rewards = [{currency:'神圣石',quantity:999,timing:'run'}]
    assert.deepEqual(plan(f), before)
    f.rooms[2].detailsStatus = 'manual'
    assert.deepEqual(plan(f).paths[0].rooms, ['s', 'a', 'u', 'z'])
  })
  test(`${preset}: 下一房未知、读取失败、部分及初始选房均暂停`, () => {
    for (const status of ['unknown', 'reading', 'partial', 'failed', undefined]) {
      const f = fixture(); f.rooms[1].detailsStatus = status
      assert.deepEqual(plan(f).paths, [])
      assert.match(plan(f).reason, /先识别房间/)
      f.initialSelection = true; f.currentRoomId = null; f.startRoomIds = ['a']
      assert.deepEqual(plan(f).paths, [])
      assert.match(plan(f).reason, /先识别房间/)
    }
  })
  test(`${preset}: 未知之后的目标待确认，硬约束与互斥目标不放宽`, () => {
    const f = fixture()
    const result = plan(f, { targets: ['z'] })
    assert.deepEqual(result.paths[0].rooms, ['s', 'a'])
    assert.ok(result.paths[0].unknown.some(text => text.includes('目标 z') && text.includes('待确认')))
    assert.deepEqual(plan(f, { targets: ['z'], avoid: ['u'] }).paths, [])
    f.rooms.push({ ...f.rooms[2], id: 'v' })
    f.edges.push(edge('a', 'v'), edge('v', 'z'))
    assert.deepEqual(plan(f, { targets: ['u', 'v'] }).paths, [])
    // A known side branch must not prevent retaining the prefix toward a pending target.
    f.rooms[4].detailsStatus = 'matched'
    assert.deepEqual(plan(f, { targets: ['u'] }).paths[0].rooms, ['s', 'a'])
  })
  test(`${preset}: 部分候选已识别时仅推荐已知合法候选`, () => {
    const f = fixture()
    f.rooms.push({ ...f.rooms[1], id: 'b', detailsStatus: 'unknown' })
    f.edges.push(edge('s', 'b'), edge('b', 'u'))
    assert.deepEqual(plan(f).paths.map(p => p.nextRoomId), ['a'])
    assert.deepEqual(plan(f, { avoid: ['a'] }).paths, [])
    f.rooms[1].afflictions = [{id:'banned',status:'matched',trigger:'entry'}]
    const strategy = createSanctumStrategy(preset); strategy.bannedAfflictions = ['banned']
    assert.deepEqual(planSanctumFloor(f, strategy).paths, [])
  })
}

test('页面、路线浮窗、结果遮罩对旧完整结果也在未知房间前截断', () => {
  const floor = fixture()
  const recommendation = { ...floor, status: 'partial', paths: [{ rooms: ['s', 'a', 'u', 'z'] }] }
  const view = sanctumDisplay(floor, recommendation)
  assert.deepEqual(view.rooms.filter(r => r.recommended).map(r => r.id), ['s', 'a'])
  assert.deepEqual(view.lines.filter(e => e.recommended).map(e => [e.from, e.to]), [['s', 'a']])
  assert.equal(view.rooms.find(r => r.id === 'u').displayState, 'reachable')
  const state = { enabled: true, foreground: true, running: true, floor, recommendation, marks: { avoid: [], targets: [] },
    observation: { foreground: true, interfaceMatched: true, mapOpen: true, receivedAt: 1000,
      clientBounds: {x:0,y:0,width:1920,height:1080}, mapRegion: {x:0,y:0,width:1500,height:800} } }
  const overlay = sanctumOverlaySnapshot(state, 1000)
  assert.deepEqual(overlay.rooms.filter(r => r.recommended).map(r => r.id), ['s', 'a'])
  state.running = false; state.progress = {stage: 'complete'}
  assert.deepEqual(sanctumOverlaySnapshot(state, 1000).rooms.map(r => r.id), ['s', 'a'])
  floor.rooms[1].detailsStatus = 'unknown'
  assert.equal(sanctumDisplay(floor, recommendation).nextRoomId, null)
  assert.ok(sanctumOverlaySnapshot(state, 1000).rooms.every(r => !r.next && !r.recommended))
  assert.deepEqual(sanctumOverlaySnapshot(state, 1000).rooms.map(r => r.id), ['s'])
})
})()

// === Merged from sanctumResearch.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const readFileSync = _m8_readFileSync
  const parseSanctumResearch = _m8_parseSanctumResearch
const text = readFileSync(new URL('./fixtures/sanctum/research.txt', import.meta.url), 'utf8')
test('国服研究文本保留数值、未解析效果和独立身份', () => {
  const result = parseSanctumResearch(text)
  assert.equal(result.status, 'parsed')
  assert.equal(result.name, '禁域宝库研究')
  assert.equal(result.areaLevel, 69)
  assert.deepEqual(result.resolve, { current: 300, maximum: 300 })
  assert.equal(result.coins, 150)
  assert.equal(result.inspiration, 0)
  assert.deepEqual(result.effects.map(item => item.rawText), ['金币磁铁', '金色烟雾', '巫毒人偶', '诅咒棱镜'])
  assert.ok(result.effects.every(item => item.status === 'unknown'))
  assert.equal(result.modifiers.length, 1)
  assert.equal(result.modifiers[0].source, 'research')
  assert.equal(result.modifiers[0].rawText, '宝箱有 4(3-4)% 的几率掉落双倍耀金币')
  assert.equal(result.runId, null)
  assert.equal(result.bindingStatus, 'unconfirmed')
})
test('重复、损坏和缺失状态不被当成零或有效值', () => {
  const result = parseSanctumResearch(text.replace('坚毅：300/300', '坚毅：400/300').replace('启迪：0', '启迪：?') + '\n耀金币：200')
  assert.equal(result.status, 'partial')
  assert.equal(result.coins, null)
  assert.equal(result.resolve, null)
  assert.equal(result.inspiration, null)
  assert.equal(parseSanctumResearch('物品类别: 圣物').status, 'unknown')
})
})()

// === Merged from sanctumRestart.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const SanctumService = _m9_SanctumService
  const captureButton = _m9_captureButton
const tick = () => new Promise(resolve => setImmediate(resolve))
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }

for (const cancelRestart of [false, true]) test(`停止再启动等待完整退出，旧关闭不影响新会话；再次停止=${cancelRestart}`, async () => {
  const service = new SanctumService({})
  service.setEnabled(true)
  service.state.liveCalibration = {}
  const closing = deferred()
  let prepares = 0, closes = 0, capture
  service.liveDriver = {
    async prepare() { prepares++; return {} },
    async close() { closes++; if (closes === 1) await closing.promise }
  }
  service.capture = {
    run() { capture = deferred(); return capture.promise },
    stop() { capture?.resolve() }
  }
  const first = service.startLive()
  await tick()
  assert.equal(prepares, 1)
  service.stop()
  const second = service.startLive()
  const duplicate = service.startLive()
  await tick()
  assert.equal(prepares, 1)
  assert.equal(closes, 1)
  if (cancelRestart) service.stop()
  closing.resolve()
  await first
  await tick()
  assert.equal(prepares, cancelRestart ? 1 : 2)
  if (!cancelRestart) {
    assert.equal(service.state.running, true)
    assert.equal(closes, 1)
    service.stop()
  }
  const replies = await Promise.all([second, duplicate])
  for (const reply of replies) assert.equal(reply.captureDraining,false)
  assert.equal(service.startTask, null)
  assert.equal(service.restartTask, null)
  assert.equal(service.state.running, false)
})

for (const outcome of ['complete','partial','failed','stopped']) test(`后台${outcome}清理后响应不会覆盖完成推送，按钮无需前台刷新`,async()=>{
  const service=new SanctumService({})
  service.setEnabled(true);service.state.liveCalibration={}
  service.foreground=false
  const closing=deferred(),entered=deferred()
  let displayed,settled=false
  service.subscribe(state=>{displayed=state})
  service.liveDriver={prepare:async()=>({}),close:async()=>{entered.resolve();await closing.promise}}
  service.capture={stop(){},run:async(environment,onFloor)=>{
    onFloor({runId:'r',floorId:'f',revision:1,identityConfirmed:true,rooms:[],edges:[],effectScan:{complete:true},captureProgress:{stage:outcome}})
    if(outcome==='failed')throw new Error('识别失败')
    if(outcome==='stopped'){service.stop();return}
    return outcome
  }}
  const request=service.startLive().then(reply=>{settled=true;displayed=reply;return reply})
  await entered.promise
  assert.equal(settled,false)
  assert.equal(displayed.captureDraining,true)
  assert.equal(captureButton(displayed).disabled,true)
  closing.resolve()
  const reply=await request
  assert.equal(reply.captureDraining,false)
  assert.equal(reply.running,false)
  assert.equal(reply.foreground,false)
  assert.equal(captureButton(displayed).disabled,false)
  assert.equal(captureButton(displayed).label,{
    complete:'分析完成·再次采集',partial:'部分完成·再次采集',failed:'分析失败·重试',stopped:'已停止·再次采集'
  }[outcome])
  assert.deepEqual(reply,service.getState())
  await service.shutdown()
})
})()

// === Merged from sanctumResultOverlay.test.js ===
await (async () => {
  const test = _m10_test
  const assert = _m10_assert
  const SanctumService = _m10_SanctumService
  const sanctumOverlaySnapshot = _m10_sanctumOverlaySnapshot
  const SanctumOverlay = _m10_SanctumOverlay
const environment = { width: 1920, height: 1080, dpi: 96 }
function detection(matched = true, receivedAt = 2000) {
  return { running: true, foreground: true, receivedAt, interfaces: { 'sanctum-map': { matched } },
    gameBounds: { left: 0, top: 0, width: 1920, height: 1080, dpi: 96 } }
}
function setup(current = 0, stage = 'complete') {
  const service = new SanctumService({})
  service.setEnabled(true)
  service.state.floor = { identityConfirmed: true, runId: 'r', floorId: 'f', revision: 1, width: 1500, height: 800,
    positionStatus: 'confirmed', currentRoomId: `r${current}`, exitRoomIds: ['r7'],
    rooms: Array.from({ length: 8 }, (_, column) => ({ id: `r${column}`, column, x: column * 170, y: 100,
      width: 80, height: 100, status: 'matched', detailsStatus: 'matched' })),
    edges: Array.from({ length: 7 }, (_, i) => ({ from: `r${i}`, to: `r${i + 1}`, status: 'matched', availability: 'gold', traversal: 'available' })) }
  service.state.progress = { stage }
  service.updateObservation({ foreground: true, interfaceMatched: true, mapOpen: true,
    clientBounds: { x: 0, y: 0, width: 1920, height: 1080 }, mapRegion: { x: 0, y: 0, width: 1500, height: 800 } })
  service.recalculate()
  return service
}
const save = service => service.retainOverlayResult(environment, 1000)
const result = (service, detected = detection()) => {
  const state = service.getResultState(detected, 2000)
  return state && sanctumOverlaySnapshot(state, 2000)
}

for (const stage of ['complete', 'partial', 'timeout']) test(`${stage}后仅两房间与一条连线，普通关图再开恢复原位置`, () => {
  const service = setup(0, stage)
  save(service)
  const view = result(service)
  assert.deepEqual(view.rooms.map(room => room.id), ['r0', 'r1'])
  assert.equal(view.lines.length, 1)
  assert.equal(view.ocrRegion, undefined)
  assert.equal(result(service, detection(false)), null)
  service.stop()
  service.state.floor.currentRoomId = 'r4'
  assert.deepEqual(result(service).rooms.map(room => room.id), ['r0', 'r1'])
})

test('倒数第二列下一房本次显示，明确关图后永久清空', () => {
  const service = setup(5)
  save(service)
  assert.deepEqual(result(service).rooms.map(room => room.id), ['r5', 'r6'])
  assert.equal(result(service, detection(false)), null)
  assert.equal(service.overlayResult, null)
  assert.equal(result(service), null)
})

test('实时观察失效后手动设定当前位置仍刷新结果遮罩', () => {
  const service = setup(0)
  service.captureEnvironment = environment
  save(service)
  assert.deepEqual(result(service).rooms.map(room => room.id), ['r0', 'r1'])
  service.updateObservation(null)
  service.setCurrentRoom({ id: 'r2', runId: 'r', floorId: 'f', revision: 1 })
  assert.equal(service.observation, null)
  assert.ok(service.overlayResult)
  const view = result(service)
  assert.deepEqual(view.rooms.map(room => room.id), ['r2', 'r3'])
  assert.ok(view.rooms.find(room => room.id === 'r2' && room.current))
  assert.ok(view.rooms.find(room => room.id === 'r3' && room.next))
})

test('从未有地图观察时手动设定不生成遮罩', () => {
  const service = setup(0)
  service.captureEnvironment = environment
  service.observation = null
  service.lastMapObservation = null
  service.setCurrentRoom({ id: 'r2', runId: 'r', floorId: 'f', revision: 1 })
  assert.equal(service.overlayResult, null)
})

test('失焦、过期、缺少标题、环境变化和旧关图事件不清空结果', () => {
  const invalid = [d => { d.foreground = false }, d => { d.running = false }, d => { d.reloading = true },
    d => { d.receivedAt = 0 }, d => { d.receivedAt = 3000 }, d => { d.interfaces = {} },
    d => { d.gameBounds.dpi = 144 }, d => { d.gameBounds.width = 1600 }, d => { d.gameBounds.left = 100 }]
  for (const change of invalid) {
    const service = setup(5); save(service)
    const d = detection(false); change(d)
    assert.equal(result(service, d), null)
    assert.ok(result(service))
  }
  const service = setup(5); save(service)
  assert.equal(result(service, detection(false, 900)), null)
  assert.ok(result(service))
})

test('截断地图与未确认出口不将最右可见列当成终点', () => {
  for (const incomplete of [true, false]) {
    const service = setup(incomplete ? 4 : 5)
    if (incomplete) service.state.floor.rooms.pop()
    else service.state.floor.exitRoomIds = []
    service.recalculate(); save(service)
    assert.equal(service.overlayResult.clearOnMapClose, false)
    assert.equal(result(service, detection(false)), null)
    assert.ok(result(service))
  }
})

test('初始选房仅下一房，无推荐仅确认当前位置，未知位置不造标记', () => {
  const service = setup()
  Object.assign(service.state.floor, { currentRoomId: null, positionStatus: 'initial', initialSelection: true, startRoomIds: ['r0'] })
  service.recalculate(); save(service)
  assert.deepEqual(result(service).rooms.map(room => room.id), ['r0'])
  const noRoute = setup()
  noRoute.state.recommendation = null; save(noRoute)
  assert.deepEqual(result(noRoute).rooms.map(room => room.id), ['r0'])
  const unknown = setup()
  unknown.state.floor.positionStatus = 'unknown'; save(unknown)
  assert.equal(result(unknown), null)
})

test('失败不替换旧图，新有效路线替换，最后一房清空，禁用只隐藏', () => {
  const service = setup(); save(service)
  service.stop()
  save(service)
  assert.ok(result(service))
  service.setEnabled(false)
  assert.equal(result(service), null)
  service.setEnabled(true)
  assert.ok(result(service))
  const replacement = setup(3)
  service.state.floor = replacement.state.floor
  service.updateObservation(replacement.observation)
  service.state.progress = { stage: 'complete' }
  service.recalculate(); save(service)
  assert.deepEqual(result(service).rooms.map(room => room.id), ['r3', 'r4'])
  service.state.floor.currentRoomId = 'r7'
  service.recalculate(); save(service)
  assert.equal(result(service), null)
})

test('采集中完整地图；失败准备后仍走保存结果，重置清空', () => {
  const service = setup(); save(service)
  service.state.running = true
  const active = { ...service.getState(), foreground: true }
  active.observation.receivedAt = 2000
  assert.equal(sanctumOverlaySnapshot(active, 2000).rooms.length, 8)
  service.state.running = false
  service.state.progress = null
  let queried = false
  const get = service.getResultState.bind(service)
  service.getResultState = (...args) => { queried = true; return get(...args) }
  const overlay = new SanctumOverlay({ service, detection: { getState: detection, subscribe: () => () => {} }, now: () => 2000,
    setIntervalFn: () => 0, clearIntervalFn: () => {} })
  overlay.hiddenCaptures = 1
  overlay.sync()
  assert.equal(queried, true)
  overlay.destroy()
  service.resetRun()
  assert.equal(service.overlayResult, null)
})

test('服务采集完成发布结果后关闭输入任务，迟到失败不替换保存结果', async () => {
  const service = setup()
  const observed = structuredClone(service.observation)
  const floor = structuredClone(service.state.floor)
  floor.captureProgress = { stage: 'complete' }
  service.capture = { stop() {}, async run(_environment, publish, observe) {
    publish(floor)
    observe(observed)
    return 'complete'
  } }
  await service.startCapture(environment)
  assert.equal(service.state.running, false)
  assert.equal(service.captureTask, null)
  assert.equal(service.overlayResult.floor.currentRoomId, 'r0')
  service.capture.run = async () => { throw new Error('启动失败') }
  await service.startCapture(environment)
  assert.equal(service.overlayResult.floor.currentRoomId, 'r0')
})

test('地图生成路线后效果识别失败，页面和浮窗保留本轮路线且不恢复活动身份', async () => {
  const service = setup(2)
  const observed = structuredClone(service.observation), floor = structuredClone(service.state.floor)
  floor.captureSessionId = 'failed-effects'
  floor.identitySource = 'client-log'
  floor.captureProgress = { stage: 'recognizing', current: 3, total: 4 }
  service.capture = { stop() {}, async run(_environment, publish, observe) {
    publish(floor); observe(observed)
    throw new Error('游戏日志正在重新同步')
  } }
  await service.startCapture(environment)
  const state = service.getState()
  assert.equal(state.floor.identityConfirmed, false)
  assert.equal(state.recommendation, null)
  assert.equal(state.savedRoute.floor.currentRoomId, 'r2')
  assert.equal(state.savedRoute.incomplete, true)
  assert.equal(state.savedRoute.recommendation.paths[0].rooms[1], 'r3')
  assert.equal(service.overlayResult.floor.currentRoomId, 'r2')
  // Keep the original observation timestamp ordering for the title gate.
  const now = Date.now() + 1
  const overlay = sanctumOverlaySnapshot(service.getResultState(detection(true, now), now), now)
  assert.deepEqual(overlay.rooms.map(room => room.id), ['r2', 'r3'])
  assert.match(overlay.reason, /状态识别不完整.*历史参考/)
  service.resetRun()
  assert.equal(service.getState().savedRoute, null)
  assert.equal(service.overlayResult, null)
})

test('重识别确认地图但未定位时隐藏旧遮罩，快照保留且手动定位后恢复', () => {
  const service = setup(0)
  save(service)
  assert.ok(result(service))
  service.state.floor = { ...service.state.floor, captureSessionId: 'recapture', revision: 2, positionStatus: 'unknown', currentRoomId: null }
  assert.equal(service.getResultState(detection(), 2000), null)
  assert.ok(service.overlayResult)
  service.captureEnvironment = environment
  service.setCurrentRoom({ id: 'r3', runId: 'r', floorId: 'f', revision: 2 })
  assert.deepEqual(result(service).rooms.map(room => room.id), ['r3', 'r4'])
})

test('新一轮无路线或迟到回调不替换旧快照，有效新路线才替换', async () => {
  const service = setup(0)
  const original = structuredClone(service.routeResult)
  const next = setup(3), observed = structuredClone(next.observation), floor = structuredClone(next.state.floor)
  floor.captureSessionId = 'failed-retry'
  let latePublish, lateObserve
  service.capture = { stop() {}, async run(_environment, publish, observe) {
    latePublish = publish; lateObserve = observe
    publish({ ...floor, rooms: floor.rooms.map(room => ({ ...room, detailsStatus: 'unknown' })) })
    observe(observed)
    service.stop('日志上下文失效')
    return 'partial'
  } }
  await service.startCapture(environment)
  assert.equal(service.getState().savedRoute.floor.currentRoomId, original.floor.currentRoomId)
  latePublish(floor); lateObserve(observed)
  assert.equal(service.getState().savedRoute.floor.currentRoomId, 'r0')
  service.capture.run = async (_environment, publish, observe) => { publish({ ...floor, captureSessionId: 'successful-retry' }); observe(observed); return 'complete' }
  await service.startCapture(environment)
  assert.equal(service.routeResult.floor.currentRoomId, 'r3')
  assert.equal(service.overlayResult.floor.currentRoomId, 'r3')
  assert.equal(service.getState().savedRoute, null)
})
})()

// === Merged from sanctumService.test.js ===
await (async () => {
  const test = _m11_test
  const assert = _m11_assert
  const SanctumService = _m11_SanctumService
  const emptySanctumState = _m11_emptySanctumState
  const createSanctumStrategy = _m11_createSanctumStrategy
  const listSanctumSamples = _m11_listSanctumSamples
  const replaySanctumSample = _m11_replaySanctumSample
const snapshot = { identityConfirmed: true, runId: 'r', floorId: 'f', revision: 1, currentRoomId: 'a',
  rooms: [{ id: 'a', column: 0 }, { id: 'b', column: 1, terminal: true, recovery: 20, detailsStatus: 'matched' }],
  edges: [{ from: 'a', to: 'b', status: 'matched' }] }
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }

test('离线回放强制未知身份，禁用后迟到结果不能恢复图或运行', async () => {
  const pending = deferred()
  const service = new SanctumService({ replay: () => pending.promise })
  assert.throws(() => service.saveStrategy(createSanctumStrategy()), /未启用/)
  service.setEnabled(true)
  const run = service.rescan('sample')
  service.setEnabled(false)
  pending.resolve(snapshot)
  await run
  assert.equal(service.getState().floor, null)
  assert.equal(service.getState().running, false)
  service.setEnabled(true)
  await service.rescan('sample')
  assert.equal(service.getState().floor.identityConfirmed, false)
  assert.equal(service.getState().recommendation, null)
  await service.shutdown()
})

test('重扫开始就撤销旧推荐，停止可中断回放且不留下运行状态', async () => {
  let signal
  const pending = deferred()
  const service = new SanctumService({ replay: (_id, options) => { signal = options.signal; return pending.promise } })
  service.setEnabled(true)
  service.state.floor = snapshot
  service.recalculate()
  const run = service.rescan('sample')
  assert.equal(service.getState().recommendation, null)
  service.stop()
  assert.equal(signal.aborted, true)
  pending.resolve(snapshot)
  await run
  assert.equal(service.getState().running, false)
  assert.equal(service.getState().floor, null)
  await service.shutdown()
})

test('手动修正和标记验证参数，策略修改重新评分且独立持久化', async () => {
  const saved = []
  const service = new SanctumService({ repository: { load: emptySanctumState, save: state => saved.push(structuredClone(state)) } })
  service.setEnabled(true)
  service.state.floor = structuredClone(snapshot)
  assert.throws(() => service.correctRoom('b', { identityConfirmed: true }), /不支持/)
  assert.throws(() => service.correctRoom('b', { rewards: [{ quantity: NaN }] }), /奖励/)
  assert.throws(() => service.setMarks({ targets: ['absent'], avoid: [] }), /不存在/)
  service.state.strategy = createSanctumStrategy('reveal')
  service.correctRoom('b', { recovery: 1 })
  assert.equal(service.getState().floor.rooms[1].recovery, 1)
  service.setMarks({ targets: ['b'], avoid: ['b'] })
  assert.equal(service.getState().recommendation.status, 'blocked')
  service.setMarks({ targets: [], avoid: [] })
  service.saveStrategy(createSanctumStrategy('quantity'))
  assert.equal(service.getState().recommendation.paths[0].nextRoomId, 'b')
  assert.equal(saved.at(-1).strategy.preset, 'quantity')
  await service.shutdown()
})

test('回放仅允许清单内文件，不接受外部路径', async () => {
  assert.ok(listSanctumSamples().some(sample => sample.id === 'vault-entry.png'))
  await assert.rejects(replaySanctumSample('../research.txt'), /未知圣所样本/)
  await assert.rejects(replaySanctumSample('missing.png'), /未知圣所样本/)
})
})()

// === Merged from sanctumState.test.js ===
await (async () => {
  const test = _m12_test
  const assert = _m12_assert
  const fs = _m12_fs
  const os = _m12_os
  const path = _m12_path
  const emptySanctumState = _m12_emptySanctumState
  const acceptSanctumFloor = _m12_acceptSanctumFloor
  const resetSanctumRun = _m12_resetSanctumRun
  const SanctumRepository = _m12_SanctumRepository
  const liveProfile = _m12_liveProfile
  const recognizeRoomProfile = _m12_recognizeRoomProfile
const floor = { runId: 'r', floorId: 'f', revision: 1, identityConfirmed: true, currentRoomId: 'a',
  rooms: [{ id: 'a', column: 0 }, { id: 'b', column: 1, terminal: true, detailsStatus: 'matched' }],
  edges: [{ from: 'a', to: 'b', status: 'matched' }] }
test('未知楼层撤销旧推荐，跨轮不沿用手动目标和效果', () => {
  let state = acceptSanctumFloor(emptySanctumState(), floor)
  assert.equal(state.recommendation.status, 'ready')
  state.marks.targets = ['b']
  state.currentEffects = [{ rule: 'cannotRecover' }]
  const next = acceptSanctumFloor(state, { ...floor, runId: 'new' })
  assert.deepEqual(next.marks.targets, [])
  assert.deepEqual(next.currentEffects, [])
  const unknown = acceptSanctumFloor(state, { ...floor, identityConfirmed: false })
  assert.equal(unknown.recommendation, null)
  assert.equal(unknown.floor.identityConfirmed, false)
  assert.equal(resetSanctumRun(state).floor, null)
})
test('重启保留配置及楼层结果，但不恢复采集与位置确认', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-test-'))
  try {
    const repository = new SanctumRepository(directory)
    const state = emptySanctumState()
    const region = { x: 0, y: 0, width: 500, height: 400 }
    const png = fs.readFileSync(new URL('./fixtures/sanctum/map-entry-label.png', import.meta.url)).toString('base64')
    state.liveCalibration = liveProfile({ version: 1, environment: { width: 800, height: 600, dpi: 144 },
      mapRegion: region, titleRegion: region, tooltipRegion: region, anchorRegion: region, anchor: { png },
      currentEffectsRegion: region, calibration: { roomSize: [80, 120], pathHsv: [[12, 95, 42], [40, 255, 255]] } })
    Object.assign(state, { running: true, floor })
    const roomProfile=recognizeRoomProfile(['圣光试炼'],'floor:0')
    state.floor={...floor,rooms:floor.rooms.map(room=>({...room,...roomProfile}))}
    repository.save(state)
    const restored = repository.load()
    assert.equal(restored.running, false)
    assert.equal(restored.solving, undefined)
    assert.equal(restored.floor.floorId, floor.floorId)
    assert.deepEqual(restored.floor.rooms[0].traps,['lightning-floor'])
    assert.equal(restored.floor.rooms[0].layoutPreferenceKey,'trap')
    assert.deepEqual(restored.floor.rooms[0].roomProfile,roomProfile.roomProfile)
    assert.equal(restored.floor.identityConfirmed, false)
    assert.equal(restored.floor.captureStopped, true)
    assert.deepEqual(restored.liveCalibration, state.liveCalibration)
  } finally { fs.rmSync(directory, { recursive: true, force: true }) }
})

test('跨楼层保存历史并清理标记，同楼层拒收迟到版本', () => {
  const state = acceptSanctumFloor(emptySanctumState(), floor)
  state.marks.targets = ['b']
  const next = acceptSanctumFloor(state, { ...floor, floorId: 'second' })
  assert.equal(next.history[0].floorId, 'f')
  assert.deepEqual(next.marks.targets, [])
  assert.deepEqual(acceptSanctumFloor(state, { ...floor, revision: 0 }), state)
  assert.deepEqual(acceptSanctumFloor(state, { ...floor, revision: 1, currentRoomId: 'b' }), state)
})
})()

// === Merged from sanctumStateEvaluation.test.js ===
await (async () => {
  const test = _m13_test
  const assert = _m13_assert
  const fs = _m13_fs
  const sanctumRule = _m13_sanctumRule
  const isCurrentSanctumEntry = _m13_isCurrentSanctumEntry
  const parseEffectTooltip = _m13_parseEffectTooltip
  const applySanctumEffects = _m13_applySanctumEffects
  const createSanctumStrategy = _m13_createSanctumStrategy
  const initialEffectState = _m13_initialEffectState
  const advanceSanctumRoom = _m13_advanceSanctumRoom
  const completedEffectGroups = _m13_completedEffectGroups
  const emptyEffectGroups = _m13_emptyEffectGroups
  const mergeEffectGroups = _m13_mergeEffectGroups
  const effectReadIssues = _m13_effectReadIssues
  const planSanctumFloor = _m13_planSanctumFloor
  const observationKey = _m13_observationKey
const catalog=JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json',import.meta.url)))
const entryEffects = entry => entry.descriptions.map(rawText=>({status:'matched',entryId:entry.id,name:entry.name,kind:entry.kind,tier:entry.tier,rawText,...sanctumRule(rawText)}))
const effects = name => entryEffects(catalog.entries.find(e=>e.name===name))
const resources={resolve:120,maxResolve:300,inspiration:0,coins:100}
const room={id:'r',layout:'guards',type:'treasure',rewards:[],effects:[]}
const run = (names, details = {}, options = {}) => advanceSanctumRoom(initialEffectState(resources,names.flatMap(effects)),{...room,...details},options)

test('守卫次数不应用于首领，已确认受损的无伤奖励不再计入机会',()=>{
  const state=initialEffectState(resources,[{rule:'guardKill',remainingUses:2}])
  const boss=advanceSanctumRoom(state,{...room,layout:'boss',type:'boss'})
  assert.equal(boss.opportunities.length,0)
  assert.equal(boss.state.effects[0].conditionalUsed,undefined)
  assert.equal(advanceSanctumRoom(boss.state,room).opportunities.length,1)
  const failed=initialEffectState(resources,[{rule:'flawlessInspiration',remainingRooms:1,flawless:false,value:150}])
  const result=advanceSanctumRoom(failed,room,{events:[{type:'completion',noLoss:true}]})
  assert.equal(result.opportunities.length,0)
  assert.equal(result.state.inspiration,0)
})

test('123个现行条目及变体有明确规则，正文完整识别且不是未知占位',()=>{
  const entries=catalog.entries.filter(e=>['boon','affliction'].includes(e.kind))
  assert.equal(entries.length,123)
  for (const entry of entries) {
    assert.ok(isCurrentSanctumEntry(catalog,entry),entry.id)
    const parsed=parseEffectTooltip({status:'located',texts:[entry.name,...entry.descriptions]},catalog)
    assert.equal(parsed.complete,true,entry.id)
    assert.ok(parsed.entries.some(e=>e.entryId===entry.id),entry.id)
    assert.equal(parsed.entries.find(e=>e.entryId===entry.id)?.calculationStatus,'supported',entry.id)
    assert.deepEqual(applySanctumEffects(entryEffects(entry)).unknown,[],entry.id)
  }
})

test('每个目录条目在适用事件或房间中提供资源、风险、机会或机制说明',()=>{
  const observations=[resources,{...resources,resolve:10,inspiration:100}, {...resources,resolve:280}]
  const rooms=[room,{...room,type:'reward',rewards:[{currency:'混沌石',quantity:5}]},{...room,type:'merchant'},{...room,type:'fountain',recovery:80,recoveryCost:10},
    {...room,layout:'trap'},{...room,layout:'boss',terminal:true},
    {...room,type:'boon',effects:[{rule:'scored',entryId:'test-boon',kind:'boon',tier:'minor',trigger:'entry',status:'matched'}]},
    {...room,type:'pact',effects:[{rule:'scored',entryId:'test-affliction',kind:'affliction',tier:'minor',trigger:'entry',status:'matched'}]},
    {...room,type:'boon',effects:Array.from({length:5},(_,i)=>({rule:'scored',entryId:`boon-${i}`,kind:'boon',tier:'minor',trigger:'entry',status:'matched'}))}]
  const eventSets=[[],[{type:'coinGain',amount:40,source:'chest'}],[{type:'coinGain',amount:40,source:'monster'}],
    [{type:'purchase',cost:20}],[{type:'fountain',recovery:20}],[{type:'resolveLoss',amount:20,source:'trap'}],
    [{type:'hitResolveLoss',amount:30}],[{type:'resolveLoss',amount:500}],[{type:'flask'}],[{type:'floorStart'}]]
  const projection = result => JSON.stringify({resolve:result.state.resolve,maxResolve:result.state.maxResolve,inspiration:result.state.inspiration,coins:result.state.coins,
    risks:result.risks,opportunities:result.opportunities,conditions:result.conditions,fatal:result.fatal})
  for(const entry of catalog.entries.filter(e=>['boon','affliction'].includes(e.kind))) {
    const rules=entryEffects(entry)
    let changed=false
    for(const observed of observations) {
      if(changed) break
      for(const target of rooms) {
        if(changed) break
        for(const events of eventSets) {
          const options={events}
          const baseline=projection(advanceSanctumRoom(initialEffectState(observed),target,options))
          const current=projection(advanceSanctumRoom(initialEffectState(observed,rules),target,options))
          const gained=projection(advanceSanctumRoom(initialEffectState(observed),{...target,effects:[...(target.effects || []),...rules.map(e=>({...e,trigger:'entry'}))]},options))
          if(baseline !== current || baseline !== gained) {changed=true;break}
        }
      }
    }
    // Countdown variants must be tested at their actual expiry, rather than
    // inventing an immediate loss for all variants.
    if(!changed && rules.some(e=>e.remainingRooms)) {
      let state=initialEffectState(resources,rules)
      for(let i=0;i<10;i++) {const next=advanceSanctumRoom(state,room);if(next.directLoss || next.opportunities.length) changed=true;state=next.state}
    }
    assert.ok(changed,`${entry.name} ${entry.id} 没有行为实现`)
  }
})

test('四项报告效果：金币减半、受击扣币、低坚毅损失、上限变化且当前资源不重复扣减',()=>{
  assert.equal(run(['焦化硬币'],{}, {events:[{type:'coinGain',amount:80}]}).state.coins,140)
  assert.equal(run(['钱包过满'],{}, {events:[{type:'hitResolveLoss',amount:5}]}).state.coins,80)
  assert.equal(run(['巫毒人偶'],{}, {events:[{type:'resolveLoss',amount:10}]}).state.resolve,100)
  assert.equal(run(['弱化血肉']).state.maxResolve,300)
  const acquired=run([],{effects:effects('弱化血肉').map(e=>({...e,trigger:'entry'}))})
  assert.equal(acquired.state.maxResolve,200)
  assert.equal(advanceSanctumRoom(acquired.state,room).state.maxResolve,200)
})

test('条件风险按房间和实际资源评估，不虚构受击和金币数',()=>{
  const value=run(['钱包过满','巫毒人偶'])
  assert.equal(value.state.coins,100);assert.equal(value.state.resolve,120)
  assert.ok(value.conditions.some(s=>s.includes('受击次数未知')))
  assert.equal(run(['钱包过满'],{layout:'exit',type:'fountain'}).risks.length,0)
  const high=advanceSanctumRoom(initialEffectState({...resources,resolve:200},effects('巫毒人偶')),room)
  assert.equal(high.risks.length,0)
  assert.equal(run(['祈祷念珠','钱包过满']).risks.length,0)
})

test('金币禁止、来源限制、价格、免费购买与购买后移除',()=>{
  assert.equal(run(['钱包失窃'],{}, {events:[{type:'coinGain',amount:100}]}).state.coins,100)
  assert.equal(run(['空白珍宝'],{}, {events:[{type:'coinGain',amount:100,source:'chest'}]}).state.coins,100)
  assert.equal(run(['不洁指环'],{}, {events:[{type:'purchase',cost:40}]}).state.coins,40)
  const free=run(['圣神赐福','金制奖杯'],{}, {events:[{type:'purchase',cost:40}]})
  assert.equal(free.state.coins,100)
  assert.ok(!free.state.effects.some(e=>['freePurchase','completionCoinsIncrease'].includes(e.rule)))
  assert.equal(run(['楼层税款'],{terminal:true}).state.coins,0)
  assert.ok(!run(['黄金矿石'],{terminal:true}).state.effects.some(e=>e.rule==='coinsDoubleFloor'))
})

test('免疫、转换、启迪、复活、倒计时和使用次数',()=>{
  const affliction=effects('弱化血肉').map(e=>({...e,trigger:'entry'}))
  assert.equal(run(['水晶圣杯'],{effects:affliction}).state.maxResolve,300)
  const converted=run(['水晶碎片'],{effects:affliction})
  assert.equal(converted.state.maxResolve,300);assert.ok(!converted.state.effects.some(e=>e.rule==='convertNextAffliction'))
  assert.equal(run(['锈蚀钟琴'],{effects:affliction}).state.inspiration,30)
  const revive=run(['祭司圣印'],{}, {events:[{type:'resolveLoss',amount:200}]})
  assert.equal(revive.state.resolve,225);assert.ok(!revive.state.effects.some(e=>e.rule==='reviveOnce'))
  assert.equal(run(['祈祷念珠'],{}, {events:[{type:'resolveLoss',amount:200}]}).state.resolve,120)
  const kill=run(['刺客之刃'],{}, {events:[{type:'guardAttack'}]})
  assert.ok(!kill.state.effects.some(e=>e.rule==='guardKill'))
  const countdown={rule:'resolveLossCountdown',remainingRooms:2,value:25,status:'matched'}
  const first=advanceSanctumRoom(initialEffectState(resources,[countdown]),room)
  const second=advanceSanctumRoom(first.state,room)
  assert.equal(first.state.resolve,120);assert.equal(second.state.resolve,95);assert.equal(second.state.effects.length,0)
})

test('两套策略中条件战斗效果改变实际推荐，输入未被修改',()=>{
  for(const preset of ['reveal','quantity']) {
    const f={identityConfirmed:true,runId:'run',floorId:'floor',revision:1,currentRoomId:'s',positionStatus:'confirmed',exitRoomIds:['a','b'],
      rooms:[{id:'s',column:0},{id:'a',column:1,layout:'guards',terminal:true},{id:'b',column:1,layout:'trap',terminal:true}].map(r=>({...r,type:'treasure',status:'matched',detailsStatus:'matched',revealed:true,rewards:[],afflictions:[],effects:[]})),
      edges:[{from:'s',to:'a',status:'matched'},{from:'s',to:'b',status:'matched'}]}
    const strategy=createSanctumStrategy(preset)
    strategy.layoutPreference={guards:0,trap:0}
    const context={runObservation:{...resources,key:observationKey(f),status:'confirmed'}}
    const plain=planSanctumFloor(f,strategy,{},[],context)
    const original=structuredClone(f)
    const withRisk=planSanctumFloor(f,strategy,{},effects('钱包过满'),context)
    assert.equal(plain.paths[0].nextRoomId,'a',preset)
    assert.equal(withRisk.paths[0].nextRoomId,'b',preset)
    assert.deepEqual(f,original)
  }
})

test('未采集保持待确认，分类结束空类别显示无，计算条件不制造读取失败',()=>{
  assert.ok(completedEffectGroups(emptyEffectGroups()).every(g=>g.status==='unconfirmed'))
  assert.ok(completedEffectGroups(emptyEffectGroups(),true).every(g=>g.status==='absent'))
  assert.ok(mergeEffectGroups([],true).every(g=>g.status==='absent'))
  const parsed=parseEffectTooltip({status:'located',texts:['钱包过满','当你被击中而失去坚毅时，损失20枚耀金币']},catalog)
  assert.equal(parsed.complete,true)
  assert.deepEqual(effectReadIssues({complete:true,groups:mergeEffectGroups([parsed],true)}),[])
  const failed=effectReadIssues({complete:false,groups:completedEffectGroups(emptyEffectGroups()),targets:[{targetId:'effect:1',stage:'ocr-failed',reason:'文字识别超时'}]})
  assert.ok(failed.some(i=>i.targetId==='effect:1'&&i.reason==='文字识别超时'))
})
})()
