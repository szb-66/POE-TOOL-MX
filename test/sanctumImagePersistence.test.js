import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { emptySanctumState } from '../shared/sanctum.js'
import { preservePreviousCapture } from '../electron/modules/sanctum/previousCapture.js'

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
