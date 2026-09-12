import fs from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { SanctumCapture } from '../electron/modules/sanctum/capture.js'
import { SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumNativeClient } from '../electron/modules/sanctum/nativeClient.js'
import { sanctumError } from '../electron/modules/sanctum/errors.js'
import { AutomationLock } from '../electron/modules/automation/lock.js'
import { runPython } from './helpers/python.js'
import { spawn } from 'node:child_process'

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
