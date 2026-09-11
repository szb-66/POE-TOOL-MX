import { sanctumError } from '../electron/modules/sanctum/errors.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { SanctumCapture } from '../electron/modules/sanctum/capture.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { AutomationLock } from '../electron/modules/automation/lock.js'
import { runPython } from './helpers/python.js'

const environment = { windowId:'game',width:1920,height:1080,dpi:96 }
const surface = { environment,foreground:true,userTakeover:false,mapOpen:true,interfaceMatched:true,overlayExcluded:true }
const floor = () => ({ runId:'r',floorId:'f',identityConfirmed:true,revision:1,
  rooms:['a','b','c'].map((id,column) => ({ id,column,row:0,revealed:true })),edges:[] })
function fixture() {
  let progress
  const lock = new AutomationLock(), calls = []
  const driver = { inspect:() => surface, subscribeSafety:() => () => {},
    subscribeProgress: listener => { progress = listener; return () => {} },
    async *frames() { yield { ...surface,floor:floor() }; throw new Error('不应读取第二帧') },
    async hover(room) { calls.push(room.id); return { patch:{name:room.id,detailsStatus:room.id==='b'?'failed':'matched',rawText:room.id} } },
    async finalizeFloor(value) { calls.push('effects'); return value } }
  return { lock,driver,calls,emit:value => progress(value),capture:new SanctumCapture({driver,automationLock:lock}) }
}

test('第一项 OCR 未完成时已经截图下一项，完成结果写回各自房间', async () => {
  const f=fixture(), updates=[]
  let release
  const first=new Promise(resolve => { release=resolve })
  f.driver.captureRoom=async room => {
    f.calls.push(room.id)
    if(room.id==='c') release({patch:{name:'异步房间 a',detailsStatus:'matched'}})
    return {recognition:room.id==='a' ? first : Promise.resolve({patch:{name:`异步房间 ${room.id}`,detailsStatus:'matched'}})}
  }
  await f.capture.run(environment,value => updates.push(value))
  assert.deepEqual(f.calls,['a','b','c','effects'])
  assert.deepEqual(updates.at(-1).rooms.map(r=>r.name),['异步房间 a','异步房间 b','异步房间 c'])
  assert.ok(updates.some(value=>value.captureProgress.step==='queued'))
})

test('流水线中断取消已排队识别，不能提交迟到结果或继续截图', async () => {
  const f=fixture(), updates=[]
  f.driver.captureRoom=async (room,{signal}) => {
    f.calls.push(room.id)
    if(room.id==='b') f.capture.stop()
    return {recognition:new Promise((resolve,reject) => {
      if(signal.aborted) { resolve({patch:{name:'不得提交'}}); return }
      signal.addEventListener('abort',()=>reject(signal.reason),{once:true})
    })}
  }
  await f.capture.run(environment,value=>updates.push(value))
  assert.deepEqual(f.calls,['a','b'])
  assert.ok(updates.every(value=>value.rooms.every(room=>room.name!=='不得提交')))
  assert.equal(f.lock.getState().locked,false)
})

test('固定队列没有指纹也只处理一轮，局部失败仍完成且释放锁', async () => {
  const f=fixture(), updates=[]
  const outcome=await f.capture.run(environment,value => updates.push(value))
  assert.equal(outcome,'partial')
  assert.deepEqual(f.calls,['a','b','c','effects'])
  assert.equal(updates.at(-1).rooms[1].detailsStatus,'failed')
  assert.equal(f.lock.getState().locked,false)
  assert.equal(f.capture.session,null)
})

test('单项截图超时保留前项并继续后续目标', async () => {
  const f=fixture(), updates=[]
  f.driver.hover=async (room,{signal}) => {
    f.calls.push(room.id)
    if(room.id==='b') throw sanctumError('STEP_TIMEOUT','当前步骤超时')
    return {patch:{name:'完成',detailsStatus:'matched'}}
  }
  const outcome=await f.capture.run(environment,value => updates.push(value),() => {})
  assert.equal(outcome,'partial')
  assert.deepEqual(f.calls,['a','b','c','effects'])
  assert.equal(updates.at(-1).rooms[0].name,'完成')
  assert.equal(updates.at(-1).rooms[1].detailsStatus,'failed')
  assert.equal(f.lock.getState().locked,false)
})

test('效果逐类别落盘，中断及重启保留房间和已读效果，不恢复活动身份', async () => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'sanctum-result-'))
  try {
    const f=fixture(), repository=new SanctumRepository(directory)
    const service=new SanctumService({repository,captureDriver:f.driver,automationLock:f.lock})
    service.setEnabled(true)
    f.driver.finalizeFloor=async (value,signal) => {
      f.emit({stage:'effects',current:1,total:2,effectScan:{complete:false,groups:[{category:'minorAffliction',texts:['已读效果']}]},currentEffects:[{status:'unknown',rawText:'已读效果'}]})
      assert.equal(repository.load().floor.effectScan.groups[0].texts[0],'已读效果')
      service.emergencyStop()
      signal.throwIfAborted()
    }
    await service.startCapture(environment)
    const restored=repository.load()
    assert.equal(restored.floor.rooms[0].name,'a')
    assert.equal(restored.floor.effectScan.groups[0].texts[0],'已读效果')
    assert.equal(restored.currentEffects[0].rawText,'已读效果')
    assert.equal(restored.running,false)
    assert.equal(restored.floor.identityConfirmed,false)
    assert.equal(restored.recommendation,null)
  } finally { fs.rmSync(directory,{recursive:true,force:true}) }
})

test('保存失败不阻止停止或清空内存结果，并显示明确错误', async () => {
  const f=fixture()
  const service=new SanctumService({captureDriver:f.driver,automationLock:f.lock})
  service.setEnabled(true)
  service.repository={save:() => { throw new Error('磁盘不可写') }}
  await service.startCapture(environment)
  service.emergencyStop()
  assert.equal(service.state.running,false)
  assert.equal(service.state.floor.rooms[0].rawText,'a')
  assert.match(service.state.saveError,/保存失败/)
})

test('不同正文高度按实际内容结束，不扩到下方地图或按正方形截断长正文', () => {
  const result=runPython(`
import sys,json,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_tooltip import locate_content
out=[]
for height in [130,260,460]:
 base=np.full((800,1000,3),150,np.uint8); im=base.copy()
 cv2.rectangle(im,(200,100),(600,100+height),(20,20,20),-1)
 cv2.line(im,(200,100),(600,100),(240,240,240),2)
 cv2.line(im,(200,150),(600,150),(240,240,240),2)
 cv2.putText(im,'Room',(260,135),cv2.FONT_HERSHEY_SIMPLEX,1,(230,230,230),2)
 for y in range(180,100+height-10,25):cv2.putText(im,'Text '*4,(220,y),cv2.FONT_HERSHEY_SIMPLEX,.6,(230,230,230),2)
 out.append(locate_content(base,im,(400,400),room=True))
print(json.dumps(out))`)
  for (const [index,height] of [130,260,460].entries()) {
    assert.equal(result[index].status,'located')
    assert.ok(Math.abs(result[index].region.height-height)<12,JSON.stringify(result[index]))
  }
})
