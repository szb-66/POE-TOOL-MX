import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumCapture } from '../electron/modules/sanctum/capture.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { AutomationLock } from '../electron/modules/automation/lock.js'
import { runPython } from './helpers/python.js'

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
