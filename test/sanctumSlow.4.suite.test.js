import _m0_fs from 'node:fs'
import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { SanctumCapture as _m0_SanctumCapture } from '../electron/modules/sanctum/capture.js'
import { SanctumLiveDriver as _m0_SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumNativeClient as _m0_SanctumNativeClient } from '../electron/modules/sanctum/nativeClient.js'
import { sanctumError as _m0_sanctumError } from '../electron/modules/sanctum/errors.js'
import { AutomationLock as _m0_AutomationLock } from '../electron/modules/automation/lock.js'
import { runPython as _m0_runPython } from './helpers/python.js'
import { spawn as _m0_spawn } from 'node:child_process'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import _m1_fs from 'node:fs'
import { matchRoomText as _m1_matchRoomText, recognizeRoomTexts as _m1_recognizeRoomTexts, normalizeRoomText as _m1_normalizeRoomText } from '../electron/modules/sanctum/textRecognition.js'
import { parseSanctumRoomTexts as _m1_parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { runPython as _m1_runPython } from './helpers/python.js'

// === Merged from sanctumStepRecovery.test.js ===
await (async () => {
  const fs = _m0_fs
  const test = _m0_test
  const assert = _m0_assert
  const SanctumCapture = _m0_SanctumCapture
  const SanctumLiveDriver = _m0_SanctumLiveDriver
  const SanctumNativeClient = _m0_SanctumNativeClient
  const sanctumError = _m0_sanctumError
  const AutomationLock = _m0_AutomationLock
  const runPython = _m0_runPython
  const spawn = _m0_spawn
const environment = {windowId:'game',processId:123,width:1000,height:800,dpi:96}
const nativeEnvironment = {environment,clientBounds:{x:0,y:0,width:1000,height:800}}
const safe = {...nativeEnvironment,foreground:true,userTakeover:false,mapOpen:true,interfaceMatched:true,overlayExcluded:true}
const floor = count => ({runId:'r',floorId:'f',identityConfirmed:true,rooms:Array.from({length:count},(_,column)=>({id:String(column),column,row:0,x:column*10,y:20,width:8,height:12,revealed:true})),edges:[]})
const timeout = () => sanctumError('STEP_TIMEOUT','当前步骤超时')

test('34 个目标正常推进超过 20 秒，OCR 收尾超过 20 秒仍完整完成',async t=>{
  t.mock.timers.enable({apis:['Date','setTimeout'],now:1000})
  t.mock.method(performance,'now',()=>Date.now())
  const calls=[], lock=new AutomationLock(), updates=[]
  let release
  const finalRead=new Promise(resolve=>{release=resolve})
  const driver={inspect:()=>safe,subscribeSafety:()=>()=>{},
    async *frames(){yield {...safe,floor:floor(34)}},
    async captureRoom(room){calls.push(room.id);t.mock.timers.tick(2000);return {recognition:room.id==='33'?finalRead:Promise.resolve({patch:{detailsStatus:'matched'}})}},
    async finalizeFloor(value,_signal,{finishCapture}){calls.push('effects');await finishCapture();t.mock.timers.tick(25000);release({patch:{detailsStatus:'matched'}});return value}}
  assert.equal(await new SanctumCapture({driver,automationLock:lock}).run(environment,f=>updates.push(f)),'complete')
  assert.equal(calls.length,35)
  assert.equal(updates.at(-1).captureProgress.current,34)
  assert.ok(updates.at(-1).captureMetrics.totalMs>90000)
  assert.equal(lock.getState().locked,false)
})

async function recoveryFixture(t, recoveryFailure=false) {
  const calls=[], clients=[], original=floor(3)
  const driver=new SanctumLiveDriver({catalog:JSON.parse(fs.readFileSync('electron/assets/sanctum/catalog.json','utf8')),makeClient: callbacks=>{
    const index=clients.length
    const client={sessionId:`s${index}`,child:{},callbacks,async shutdown(){calls.push(`${index}:exit`);this.child=null},
      async request(command,input){
        calls.push(`${index}:${command}${input?.roomId?':'+input.roomId:''}`)
        if(command==='environment'||command==='arm') return structuredClone(nativeEnvironment)
        if(command==='resumeCapture') {
          if(recoveryFailure) throw new Error('地图未确认')
          return {...safe,floor:structuredClone(original)}
        }
        if(command==='hover') {
          if(input.roomId==='1') {this.child=null;throw timeout()}
          return {texts:['已读正文'],status:'located',observation:safe}
        }
        throw new Error(command)
      }}
    clients.push(client);return client
  }})
  await driver.open()
  driver.profile={};driver.runId='r';driver.recoveryEnvironment=structuredClone(nativeEnvironment)
  driver.latest={...safe,floor:original};driver.assertLog=()=>({floorId:'f'})
  driver.frames=async function*(){yield driver.latest}
  driver.finalizeFloor=async value=>{calls.push('effects');return value}
  t.after(()=>driver.close())
  return {driver,calls,clients}
}

test('截图进程挂起后等待退出、重新预检与建基线，从下一房继续，旧事件无效',async t=>{
  const f=await recoveryFixture(t),updates=[],ocr={shutdown(){assert.equal(updates.at(-1).captureProgress.stage,'completing')}}
  f.driver.ocrClient=ocr
  const capture=new SanctumCapture({driver:f.driver,automationLock:new AutomationLock()})
  assert.equal(await capture.run(environment,value=>updates.push(value)),'partial')
  assert.deepEqual(f.calls,['0:hover:0','0:hover:1','0:exit','1:environment','1:arm','1:resumeCapture','1:hover:2','effects','1:exit'])
  assert.equal(updates.at(-1).rooms[1].readStages.capture,'timeout')
  assert.equal(updates.at(-1).rooms[2].rawText,'已读正文')
  assert.equal(updates.at(-1).captureProgress.current,3)
  assert.equal(f.driver.ocrClient,null)
  f.clients[0].callbacks.onSafety({reason:'过期事件'})
  assert.equal(f.driver.latest.nativeError,undefined)
  f.driver.ocrClient=null
})

test('恢复失败只尝试一次，后续依赖项未执行，已有冻结识别继续提交',async t=>{
  const f=await recoveryFixture(t,true),updates=[]
  let release
  const original=f.driver.captureRoom.bind(f.driver)
  f.driver.captureRoom=async(room,options)=>room.id==='0'?{recognition:new Promise(resolve=>{release=resolve})}:original(room,options)
  f.driver.endCapture=async()=>release({patch:{detailsStatus:'matched',rawText:'冻结识别完成'}})
  const capture=new SanctumCapture({driver:f.driver,automationLock:new AutomationLock()})
  assert.equal(await capture.run(environment,value=>updates.push(value)),'partial')
  assert.equal(f.clients.length,2)
  assert.equal(f.calls.includes('1:hover:2'),false)
  assert.equal(updates.at(-1).rooms[2].readStages.capture,'skipped')
  assert.equal(updates.at(-1).rooms[0].rawText,'冻结识别完成')
})

test('恢复时窗口变化是安全中断，后续房间不能输入',async t=>{
  const f=await recoveryFixture(t),updates=[]
  f.driver.recoveryEnvironment={...nativeEnvironment,clientBounds:{...nativeEnvironment.clientBounds,x:100}}
  await assert.rejects(new SanctumCapture({driver:f.driver,automationLock:new AutomationLock()}).run(environment,value=>updates.push(value)),{code:'CONTEXT_CHANGED'})
  assert.equal(f.calls.some(call=>call.endsWith('hover:2')),false)
})

test('单张 OCR 超时回收旧进程，新客户端处理下一张，排队不使用整轮截止时间',async t=>{
  const calls=[],driver=new SanctumLiveDriver({recognitionWorkers:1,makeClient:()=>{
    const id=calls.filter(x=>x==='create').length;calls.push('create')
    return {async request(command,_input,options){calls.push(command);assert.equal(options.timeoutMs,command==='prepareOcr'?20000:40000);if(command==='prepareOcr')return {ready:true};if(id===0)throw timeout();return {texts:['下一张'],captureMetrics:{}}},async shutdown(){calls.push('exit')}}
  }})
  driver.assertLog=()=>({floorId:'f'})
  t.after(()=>driver.close())
  const data={png:'fixture',region:{x:0,y:0,width:20,height:20}}
  const first=driver.recognizeCaptured(data,new AbortController().signal)
  const second=driver.recognizeCaptured(data,new AbortController().signal)
  await assert.rejects(first,{code:'STEP_TIMEOUT'})
  assert.deepEqual((await second).texts,['下一张'])
  assert.deepEqual(calls,['create','prepareOcr','readFrozen','exit','create','prepareOcr','readFrozen'])
})

test('奖励图标失败保留正文且继续下一项图标，整轮为部分完成',async()=>{
  const seen=[],updates=[]
  const driver={inspect:()=>safe,subscribeSafety:()=>()=>{},async *frames(){yield {...safe,floor:floor(2)}},
    async captureRoom(room){
      return {
        recognition:Promise.resolve({patch:{detailsStatus:'matched',rawText:'正文'+room.id,readStages:{ocr:'matched',icons:'queued'}}}),
        supplement:async()=>{
          seen.push(room.id)
          if(room.id==='0')throw timeout()
          return {patch:{detailsStatus:'matched',rawText:'正文1',readStages:{ocr:'matched',icons:'matched'}}}
        }
      }
    }
  }
  assert.equal(await new SanctumCapture({driver,automationLock:new AutomationLock()}).run(environment,value=>updates.push(value)),'partial')
  assert.deepEqual(seen,['0','1'])
  assert.equal(updates.at(-1).rooms[0].rawText,'正文0')
  assert.equal(updates.at(-1).rooms[0].readStages.icons,'timeout')
  assert.equal(updates.at(-1).rooms[1].readStages.icons,'matched')
})

test('V 请求失败后检查实际界面，已切换则继续且只按一次',async()=>{
  const driver=new SanctumLiveDriver({}),commands=[]
  driver.assertLog=()=>({floorId:'f'});driver.client={child:{}}
  driver.sessionRequest=async command=>{commands.push(command);if(command==='toggleMap')throw new Error('切换确认延迟');return {mapOpen:false,hudVisible:true}}
  await driver.switchMode('effects',new AbortController().signal)
  assert.deepEqual(commands,['toggleMap','interfaceState'])
})

test('效果截图超时重建后恢复状态栏基线，继续下一个效果',async t=>{
  const icons=[{x:10,y:10},{x:30,y:10},{x:50,y:10}],commands=[]
  let generation=0
  const driver=new SanctumLiveDriver({catalog:JSON.parse(fs.readFileSync('electron/assets/sanctum/catalog.json','utf8')),makeClient:()=>{
    const id=generation++
    return {child:{},sessionId:String(id),async shutdown(){commands.push(`${id}:exit`)},async request(command,input){
      commands.push(`${id}:${command}:${input?.effectTarget || ''}`)
      if(command==='environment'||command==='arm')return structuredClone(nativeEnvironment)
      if(command==='interfaceState')return {...nativeEnvironment,mapOpen:true,hudLayout:'map'}
      if(command==='inspectEffects'||command==='resumeCapture')return {...nativeEnvironment,coverageConfirmed:true,icons}
      if(command==='hoverEffect') {
        if(input.effectTarget==='effect:2')throw timeout()
        return {status:'located',texts:['全知之眼','圣所地图现在完全显示了']}
      }
      throw new Error(command)
    }}
  }})
  await driver.open();t.after(()=>driver.close())
  driver.recoveryEnvironment=structuredClone(nativeEnvironment)
  driver.profile={interfaceTitles:{'sanctum-map-hud':{}},mapEffectIconsRegion:{x:0,y:0,width:100,height:100}}
  driver.assertLog=()=>({floorId:'f'})
  driver.logContext={context:{sessionKey:'s',processId:123,areaId:'a',seed:'seed'},close(){}}
  const value=floor(1)
  driver.latest={...safe,floor:value}
  const result=await driver.finalizeFloor(value,new AbortController().signal)
  assert.equal(generation,2)
  assert.ok(commands.indexOf('0:exit')<commands.indexOf('1:arm:'))
  assert.ok(commands.indexOf('1:resumeCapture:')<commands.indexOf('1:hoverEffect:effect:3'))
  assert.equal(commands.filter(command=>command.endsWith('effect:2')).length,1)
  assert.equal(result.effectScan.complete,false)
  assert.equal(result.currentEffects.filter(effect=>effect.rule==='fullMapRevealed').length,1)
})

test('原生请求结束清除期限，空闲超过上一请求时间不触发安全超时',()=>{
  const result=runPython(`
import sys,json,io
from unittest.mock import patch
sys.path.insert(0,'src/assets/scripts')
import sanctum_native as n
class Session:
    def dispatch(self,command,options):
        if command=='second':assert self.deadline_at is None
        self.deadline_at=options.get('deadlineAt');return {}
session=Session()
with patch.object(n,'NativeSession',lambda:session),patch.object(sys,'stdin',io.StringIO('{"id":1,"command":"first","input":{"deadlineAt":1}}\\n{"id":2,"command":"second"}\\n')),patch.object(n,'emit',lambda value:None):n.main()
print(json.dumps({'deadline':session.deadline_at}))
`)
  assert.equal(result.deadline,null)
})

test('每请求独立超时会终止真实挂起进程并返回结构化错误', {timeout:5000},async()=>{
  let exited=false
  const client=new SanctumNativeClient({resolveRuntime:async()=>({path:process.execPath}),launch:()=>{
    const child=spawn(process.execPath,['-e','process.stdin.once("data",()=>{while(true){}})'],{windowsHide:true,stdio:['pipe','pipe','pipe']})
    child.once('close',()=>{exited=true});return {process:child,started:Promise.resolve(child)}
  }})
  try {await assert.rejects(client.request('hover',{}, {timeoutMs:100}),{code:'STEP_TIMEOUT'});assert.equal(exited,true)}
  finally {await client.shutdown()}
})

test('运行时准备挂起也受单步期限约束，取消后不得迟到启动进程', {timeout:2000},async()=>{
  let ready,launches=0
  const client=new SanctumNativeClient({resolveRuntime:()=>new Promise(resolve=>{ready=resolve}),launch:()=>{launches++;throw new Error('不得启动')}})
  // Keep the event loop alive while AbortSignal.timeout's unreferenced timer runs.
  const keepAlive=setTimeout(()=>{},1500)
  try {
    await assert.rejects(client.request('environment',{}, {timeoutMs:20}),{code:'STEP_TIMEOUT'})
    await client.shutdown()
    ready({path:process.execPath})
    await new Promise(resolve=>setImmediate(resolve))
    assert.equal(launches,0)
  } finally {clearTimeout(keepAlive);await client.shutdown()}
})
})()

// === Merged from sanctumTextRecognition.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const fs = _m1_fs
  const matchRoomText = _m1_matchRoomText
  const recognizeRoomTexts = _m1_recognizeRoomTexts
  const normalizeRoomText = _m1_normalizeRoomText
  const parseSanctumRoomTexts = _m1_parseSanctumRoomTexts
  const runPython = _m1_runPython
const entry = (id, name, descriptions = []) => ({ id, name, descriptions, kind:'affliction', applicability:'unverified' })
const catalog = { entries: [entry('a','封闭之墙',['不能恢复坚毅']), entry('b','脆弱',['受到的伤害提高 50%'])] }

test('错字、漏字、全半角、低分和同分始终采用最高候选，数字和否定词保留', () => {
  assert.equal(matchRoomText('不能恢復坚毅',catalog).entryId,'a')
  assert.equal(matchRoomText('不能恢坚毅',catalog).entryId,'a')
  assert.equal(matchRoomText('受到的伤害提高５０％',catalog).similarity,1)
  assert.equal(matchRoomText('xyz',catalog).entryId,'a')
  assert.equal(matchRoomText('xyz',catalog).similarity,0)
  assert.equal(matchRoomText('xyz',{entries:[...catalog.entries].reverse()}).entryId,'a')
  assert.notEqual(normalizeRoomText('能恢复坚毅'),normalizeRoomText('不能恢复坚毅'))
  const value=matchRoomText('受到的伤害提高 15%',catalog)
  assert.equal(value.entryId,'b'); assert.equal(value.numericCompatible,false)
  assert.equal(value.rawText,'受到的伤害提高 15%')
})

test('换行描述合并、独立词缀分别匹配，空OCR和空词库不生成结果', () => {
  const value=recognizeRoomTexts(['不能恢复','坚毅','脆弱'],catalog)
  assert.deepEqual(value.matches.map(m=>[m.entryId,m.lineCount]),[['a',2],['b',1]])
  assert.equal(recognizeRoomTexts([],catalog).status,'empty')
  assert.equal(recognizeRoomTexts(['文字'],{entries:[]}).status,'no-catalog')
  assert.equal(recognizeRoomTexts(['不能恢复坚毅','脆弱'],catalog).matches.length,2)
})

test('真实未核验恩赐和痛苦能识别身份，计算支持独立；原文重复不丢失', () => {
  const data=JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json',import.meta.url)))
  for(const kind of ['boon','affliction']) {
    const item=data.entries.find(e=>e.kind===kind)
    item.applicability='unverified';item.reviewedPatch=null
    const value=parseSanctumRoomTexts([item.name,item.name],data)
    assert.equal(value.recognition.status,'matched')
    assert.equal(value.recognition.matches[0].name,item.name)
    assert.equal(value.recognition.matches[0].versionStatus,'unverified')
    assert.equal(value.recognition.matches[0].calculationStatus,'unsupported')
    assert.equal(value.rawText,`${item.name}\n${item.name}`)
    assert.equal(value.detailsStatus,'matched')
  }
})

test('原生OCR保留低置信度输出和真实框，按行组织而不抛弃文字', () => {
  const value=runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_ocr import read_room_ocr
def box(x,y,w,h):return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]]
engine=lambda image:[[box(30,0,20,10),'坚毅',.2],[box(0,0,30,10),'不能恢复',.99],[box(0,20,30,10),'脆弱',.7]]
print(json.dumps(read_room_ocr(engine,np.zeros((50,80,3),np.uint8))))
`)
  assert.deepEqual(value.texts,['不能恢复坚毅','脆弱'])
  assert.equal(value.ocrBlocks.length,3)
  assert.equal(value.ocrBlocks[1].confidence,.2)
  assert.deepEqual(value.ocrLines[0].region,{x:0,y:0,width:50,height:10})
})
})()
