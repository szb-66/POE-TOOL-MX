import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parseEffectTooltip } from '../electron/modules/sanctum/effectRecognition.js'
import { parseStatusTooltip } from '../electron/modules/sanctum/statusRecognition.js'
import { mergeEffectGroups } from '../shared/sanctumEffects.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { observationKey } from '../electron/modules/sanctum/runObservation.js'
import { preservePreviousCapture } from '../electron/modules/sanctum/previousCapture.js'
import { catalogEffect } from '../electron/modules/sanctum/effectCorrection.js'
const catalog=JSON.parse(fs.readFileSync('electron/assets/sanctum/catalog.json','utf8'))
const entry=name=>catalog.entries.find(entry=>entry.name===name)
const sword=entry('钝化之剑').id, eye=entry('全知之眼').id
function setup({texts=['钝化之剑','无关天气预报','未登记文字甲'],status='located',repository,catalog:dictionary=catalog}={}) {
  const service=new SanctumService({catalog:dictionary,repository})
  service.enabled=true;service.state.enabled=true
  const floor={runId:'r',floorId:'f',mapKey:'m',revision:1,identityConfirmed:true,positionStatus:'confirmed',currentRoomId:'a',
    rooms:[{id:'a',column:0,row:0},{id:'b',column:1,row:0,terminal:true,detailsStatus:'matched'}],edges:[{from:'a',to:'b',status:'matched'}]}
  const group=parseEffectTooltip({status,texts,targetId:'effect:1',evidenceId:'image',reason:status==='partial'?'截断':null},dictionary)
  const target={targetId:'effect:1',evidenceId:'image',runId:'r',floorId:'f',readStatus:status,stage:group.complete?'matched':'failed',
    texts,region:{x:0,y:0,width:100,height:100},entries:group.entries,effectGroup:group,reason:group.reason,classificationComplete:group.complete}
  floor.effectScan={targets:[target],groups:mergeEffectGroups([group],true),binding:observationKey(floor),finished:true,coverageConfirmed:true,complete:group.complete}
  floor.currentEffects=group.effects;service.state.floor=floor;service.state.currentEffects=group.effects
  service.liveDriver={effectLedger:{...floor.effectScan,effects:group.effects,scope:'s',floor:structuredClone(floor)}}
  const binding=()=>service.getEffectReview({runId:'r',floorId:'f',targetId:'effect:1',evidenceId:'image'}).binding
  return {service,binding,target}
}

test('九条效果混入楼层名仍完整，原文保留且不重复显示',()=>{
  const names=['钝化之剑','空白珍宝','黑烟蔽目','巫毒人偶','不洁吊坠','毒水侵袭','隐蔽异动','恐惧之印','锈蚀硬币']
  const texts=names.flatMap(name=>[name,...entry(name).descriptions]);texts.splice(1,0,'禁域墓场')
  const result=parseEffectTooltip({status:'located',texts},catalog)
  assert.equal(result.complete,true);assert.deepEqual(result.entries.map(e=>e.name),names)
  assert.deepEqual(result.texts,texts);assert.equal(mergeEffectGroups([result],true).length,4)
  const unknown=parseEffectTooltip({status:'located',texts:[...texts,'无关天气预报']},catalog)
  assert.deepEqual(mergeEffectGroups([unknown],true).at(-1).texts,['无关天气预报'])
  assert.equal(parseEffectTooltip({status:'located',texts:['禁域墓场']},catalog).complete,false)
  assert.equal(parseEffectTooltip({status:'partial',texts,reason:'截断'},catalog).complete,false)
  const wrapped=parseEffectTooltip({status:'located',texts:['圣所地图现在','禁域墓场','完全显示了']},catalog)
  assert.equal(wrapped.entries[0].name,'全知之眼');assert.equal(wrapped.complete,true)
  const reward=parseStatusTooltip({status:'located',texts:['禁域墓场','完成禁域时获得60×工匠石']},catalog)
  assert.equal(reward.effectGroup,null);assert.equal(reward.hasRewardContext,true)
  const collision={...catalog,entries:[...catalog.entries,{...entry('钝化之剑'),id:'collision',name:'禁域墓场'}]}
  assert.equal(parseEffectTooltip({status:'located',texts:['禁域墓场']},collision).entries[0].entryId,'collision')
  const alias={...catalog,entries:catalog.entries.map(e=>e.kind==='floor'?{...e,aliases:['楼层别名']}:e)}
  assert.equal(parseEffectTooltip({status:'located',texts:['楼层别名','钝化之剑']},alias).complete,true)
})

test('部分排除、替换及删除同步状态、账本与路线，原文不变，旧修订拒绝',()=>{
  const {service,binding,target}=setup(), original=structuredClone(target.effectGroup)
  const first=binding(), [a,b]=original.unresolved
  assert.equal(service.getEffectReview(first).editable,true)
  let state=service.correctEffectTarget(first,{entryIds:[sword],resolutions:[{id:a.id,action:'ignore'}]})
  assert.equal(state.floor.effectScan.complete,false)
  assert.deepEqual(state.floor.effectScan.groups.at(-1).texts,[b.rawText])
  assert.throws(()=>service.correctEffectTarget(first,{entryIds:[],resolutions:[]}),/已被纠正/)
  state=service.correctEffectTarget(binding(),{entryIds:[],resolutions:[{id:a.id,action:'ignore'},{id:b.id,action:'replace',entryId:eye}]})
  assert.equal(state.floor.effectScan.complete,true)
  assert.deepEqual(state.currentEffects.map(e=>e.entryId),[eye])
  assert.ok(state.recommendation)
  assert.deepEqual(state.currentEffects,service.liveDriver.effectLedger.effects)
  assert.deepEqual(state.currentEffects,state.floor.currentEffects)
  assert.deepEqual(state.floor.effectScan.targets[0].effectGroup,original)
  assert.equal(state.floor.effectScan.targets[0].correction.revision,2)
  assert.equal(service.getEffectReview(binding()).group.entries[0].manual,true)
})

test('词库之外、重复处理、错证据、位置变化和采集中均拒绝，取消读取不修改状态',()=>{
  const {service,binding}=setup(), before=JSON.stringify(service.state)
  const current=binding();assert.equal(JSON.stringify(service.state),before)
  assert.throws(()=>service.correctEffectTarget(current,{entryIds:['floor:3'],resolutions:[]}),/词库/)
  assert.throws(()=>service.correctEffectTarget(current,{entryIds:[sword],resolutions:[{id:'fake',action:'ignore'}]}),/处理无效/)
  assert.throws(()=>service.correctEffectTarget({...current,evidenceId:'wrong'},{entryIds:[],resolutions:[]}),/没有可核对/)
  service.state.running=true
  assert.throws(()=>service.correctEffectTarget(current,{entryIds:[],resolutions:[]}),/等待采集/)
  service.state.running=false;service.state.floor.currentRoomId='b'
  assert.throws(()=>service.correctEffectTarget(current,{entryIds:[],resolutions:[]}),/历史|位置/)
})

test('纠正不清除截断、覆盖不足和未支持计算',()=>{
  const {service,binding}=setup({status:'partial',texts:['钝化之剑']})
  const state=service.correctEffectTarget(binding(),{entryIds:[sword],resolutions:[]})
  assert.equal(state.floor.effectScan.complete,false);assert.match(state.floor.effectScan.targets[0].reason,/截断/)
  const other=setup({texts:['钝化之剑']});other.service.state.floor.effectScan.coverageConfirmed=false
  assert.equal(other.service.correctEffectTarget(other.binding(),{entryIds:[eye],resolutions:[]}).floor.effectScan.complete,false)
  const unsupported={...catalog,entries:catalog.entries.map(e=>e.id===eye?{...e,descriptions:['暂无实现的新规则']}:e)}
  const un=setup({texts:['钝化之剑'],catalog:unsupported})
  const corrected=un.service.correctEffectTarget(un.binding(),{entryIds:[eye],resolutions:[]})
  assert.equal(corrected.currentEffects[0].status,'unknown')
  assert.equal(corrected.floor.effectScan.groups.find(g=>g.entries?.length).entries[0].calculationStatus,'unsupported')
})

test('纠正结果持久化为历史，新证据替换，失败保留原人工记录但不进入当前效果',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'sanctum-correction-'))
  try {
    const repository=new SanctumRepository(directory),{service,binding}=setup({repository,texts:['钝化之剑']})
    service.correctEffectTarget(binding(),{entryIds:[eye],resolutions:[]})
    const restored=new SanctumService({catalog,repository})
    assert.equal(restored.state.restoredFromSave,true)
    assert.deepEqual(restored.state.floor.effectScan.targets[0].correction.entryIds,[eye])
    assert.equal(restored.getEffectReview(binding()).editable,false)
    const next=setup({texts:['钝化之剑']}).service.state.floor
    next.effectScan.targets[0].evidenceId='new-image'
    preservePreviousCapture(next,service.state.floor)
    assert.equal(next.effectScan.targets[0].correction,undefined)
    assert.equal(next.effectScan.targets[0].previousCapture,undefined)
    const failed=setup({texts:[],status:'partial'}).service.state.floor
    failed.effectScan.targets[0].evidenceId='failed-image'
    preservePreviousCapture(failed,service.state.floor)
    assert.deepEqual(failed.effectScan.targets[0].previousCapture.result.correction.entryIds,[eye])
    assert.ok(!failed.currentEffects.some(e=>e.entryId===eye))
  } finally { fs.rmSync(directory,{recursive:true,force:true}) }
})

test('人工词库选择沿用所有条目的规则和级别',()=>{
  for (const item of catalog.entries.filter(e=>['boon','affliction'].includes(e.kind))) {
    const result=catalogEffect(item,catalog)
    assert.equal(result.entryId,item.id)
    assert.equal(result.calculationStatus,'supported',item.id)
    assert.ok(result.effects.length,item.id)
  }
})

test('部分人工修正也保留为失败重读的历史记录，缺图明确报错',()=>{
  const {service,binding}=setup()
  const original=service.state.floor.effectScan.targets[0].effectGroup
  service.correctEffectTarget(binding(),{entryIds:[sword],resolutions:[{id:original.unresolved[0].id,action:'ignore'}]})
  const failed=setup({status:'partial',texts:[]}).service.state.floor
  failed.effectScan.targets[0].evidenceId='failed-new'
  preservePreviousCapture(failed,service.state.floor)
  assert.equal(failed.effectScan.targets[0].previousCapture.result.correction.revision,1)
  assert.equal(failed.effectScan.targets[0].previousCapture.result.stage,'failed')
  assert.throws(()=>service.getEffectEvidence(binding()),/未保存截图/)
})

test('纠正一个来源保留其他浮窗和房间增量',()=>{
  const {service,binding}=setup({texts:['钝化之剑']})
  const other=parseEffectTooltip({status:'located',texts:['钱包失窃'],targetId:'effect:2',evidenceId:'other'},catalog)
  const scan=service.state.floor.effectScan
  scan.targets.push({targetId:'effect:2',evidenceId:'other',readStatus:'located',stage:'matched',texts:other.texts,effectGroup:other,classificationComplete:true})
  const addition={...catalogEffect(entry('巫毒人偶'),catalog),source:{kind:'room',roomId:'a'}}
  scan.groups=mergeEffectGroups([{entries:[addition],effects:addition.effects,complete:true},...scan.groups],true)
  const next=service.correctEffectTarget(binding(),{entryIds:[eye],resolutions:[]})
  assert.deepEqual(new Set(next.currentEffects.filter(e=>e.entryId).map(e=>e.entryId)),new Set([eye,entry('钱包失窃').id,entry('巫毒人偶').id]))
  assert.equal(next.floor.effectScan.complete,true)
  assert.equal(next.floor.effectScan.rewardGroups,undefined)
})
