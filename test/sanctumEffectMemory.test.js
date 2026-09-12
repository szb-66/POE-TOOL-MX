import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { emptyEffectMemory, effectMemoryKey, rememberEffectRule, forgetEffectRule, applyEffectMemory, effectRuleStatus, migrateEffectMemory } from '../electron/modules/sanctum/effectMemory.js'
import { parseStatusTooltip } from '../electron/modules/sanctum/statusRecognition.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { observationKey } from '../electron/modules/sanctum/runObservation.js'
import { rebuildCorrectedScan } from '../electron/modules/sanctum/effectCorrection.js'
import { resetSanctumRun } from '../electron/modules/sanctum/state.js'
import { preservePreviousCapture } from '../electron/modules/sanctum/previousCapture.js'
const catalog=JSON.parse(fs.readFileSync('electron/assets/sanctum/catalog.json','utf8'))
const entry=name=>catalog.entries.find(entry=>entry.name === name)
const sword=entry('钝化之剑').id,eye=entry('全知之眼').id
const ids=group=>group.entries.map(entry=>entry.entryId)
const parse=(texts,memory,status='located')=>applyEffectMemory({texts,status},catalog,memory)
function capture(service,texts=['错误甲'],{runId='r',floorId='f',targetId='effect:1',evidenceId='image',status='located',captureIssue=null}={}) {
  const floor={runId,floorId,mapKey:'m',revision:1,identityConfirmed:true,positionStatus:'confirmed',currentRoomId:'a',rooms:[{id:'a',column:0,row:0},{id:'b',column:1,row:0,terminal:true,detailsStatus:'matched'}],edges:[{from:'a',to:'b',status:'matched'}]}
  const read=parseStatusTooltip({texts,status,targetId,evidenceId,reason:status === 'partial'?'截断':null},catalog,service.state.effectCorrectionMemory)
  const target={runId,floorId,targetId,evidenceId,readStatus:status,texts,captureIssue,stage:read.effectGroup?.complete?'matched':'failed',effectGroup:read.originalEffectGroup,rememberedGroup:read.effectGroup,memoryHits:read.memoryHits,region:{x:0,y:0,width:100,height:100}}
  const next=rebuildCorrectedScan({targets:[target],groups:[],rewardGroups:read.rewardGroup?[read.rewardGroup]:[],binding:observationKey(floor),finished:true,coverageConfirmed:true},catalog,service.state.effectCorrectionMemory)
  floor.effectScan=next.scan;floor.currentEffects=next.effects
  service.state.floor=floor;service.state.currentEffects=next.effects;service.state.restoredFromSave=false
  service.liveDriver={effectCorrectionMemory:structuredClone(service.state.effectCorrectionMemory),effectLedger:{...next.scan,effects:next.effects,floor:structuredClone(floor)}}
  return ()=>service.getEffectReview({runId,floorId,targetId,evidenceId})
}
function setup(repository){const service=new SanctumService({catalog,repository});service.enabled=true;service.state.enabled=true;return service}
const correction=(sourceId,entryId,remember=true)=>({sourceEdits:[{sourceId,action:entryId?'replace':'ignore',...(entryId?{entryId}:{})}],addedEntryIds:[],remember})
const ruleBinding=(service,index=0)=>{const {rules,revision}=service.getEffectCorrectionRules();return {id:rules[index].id,revision:rules[index].revision,memoryRevision:revision}}

test('记忆只统一全半角和空白，保留数值、标点及其他兼容字符',()=>{
  assert.equal(effectMemoryKey('ＡＢＣ １２％\n'), 'ABC12%')
  assert.notEqual(effectMemoryKey('①'),effectMemoryKey('1'))
  const memory=emptyEffectMemory();rememberEffectRule(memory,'异常 １２％','replace',eye,catalog)
  assert.deepEqual(ids(parse(['异常12%'],memory).group),[eye])
  for(const text of ['异常13%','异常12','异常12%!','前缀异常12%','异常①2%'])assert.equal(parse([text],memory).hits.length,0,text)
})

test('效果增减排序和浮窗、楼层轮次变化仍逐条复用，不递归套用其他规则',()=>{
  const memory=emptyEffectMemory();rememberEffectRule(memory,'错误甲','replace',eye,catalog);rememberEffectRule(memory,'错误乙','ignore',null,catalog)
  rememberEffectRule(memory,'全知之眼','replace',sword,catalog)
  for(const texts of [['错误甲'],['钝化之剑',...entry('钝化之剑').descriptions,'错误乙','错误甲'],['错误甲','钱包失窃','错误乙']]){
    const result=parse(texts,memory)
    assert.ok(ids(result.group).includes(eye));assert.equal(result.group.complete,true)
    assert.deepEqual(result.original.texts,texts)
  }
  const service=setup();service.state.effectCorrectionMemory=memory
  for(const context of [{},{runId:'r2',floorId:'f2',targetId:'effect:9',evidenceId:'other'}]){
    const review=capture(service,['错误甲','错误乙'],context)()
    assert.deepEqual(ids(review.group),[eye]);assert.equal(review.sources.length,2)
    assert.ok(review.sources.every(source=>source.ruleId))
  }
})

test('完整原文可跨 OCR 换行匹配，但不能跨过奖励行或替换奖励',()=>{
  const memory=emptyEffectMemory();rememberEffectRule(memory,'错误甲错误乙','replace',eye,catalog)
  assert.equal(parse(['错误甲','错误乙'],memory).hits.length,1)
  const result=parseStatusTooltip({status:'located',texts:['错误甲','完成禁域时获得60×工匠石','错误乙']},catalog,memory)
  assert.equal(result.memoryHits.length,0);assert.equal(result.rewardGroup.rewards[0].quantity,60)
  rememberEffectRule(memory,'完成禁域时获得60×工匠石','ignore',null,catalog)
  const reward=parseStatusTooltip({status:'located',texts:['完成禁域时获得60×工匠石']},catalog,memory)
  assert.equal(reward.effectGroup,null);assert.equal(reward.rewardGroup.complete,true)
  const service=setup();service.state.effectCorrectionMemory=memory
  const review=capture(service,['错误甲','完成禁域时获得60×工匠石','错误乙'])()
  assert.equal(review.target.memoryHits.length,0)
})

test('换行变化后自动纠正的原文仍能编辑，重复分散词条分别绑定可匹配原文',()=>{
  const service=setup();rememberEffectRule(service.state.effectCorrectionMemory,'错误甲错误乙','replace',eye,catalog)
  const review=capture(service,['错误甲','错误乙'])
  assert.equal(review().sources.length,1);assert.equal(review().sources[0].selection,eye)
  service.correctEffectTarget(review().binding,correction(review().sources[0].id,null))
  assert.equal(review().group.complete,true);assert.deepEqual(ids(review().group),[])
  const other=capture(service,['钝化之剑','钱包失窃','钝化之剑'])
  const sources=other().sources.filter(source=>source.entryId===sword)
  assert.equal(sources.length,2)
  service.correctEffectTarget(other().binding,{sourceEdits:sources.map(source=>({sourceId:source.id,action:'ignore'})),addedEntryIds:[],remember:true})
  assert.ok(!ids(other().group).includes(sword))
})

test('修改和删除规则从原文更新当前状态账本与路线，历史快照不变',()=>{
  const service=setup(),review=capture(service),first=review()
  service.correctEffectTarget(first.binding,correction(first.sources[0].id,eye))
  const historical=structuredClone(service.state.floor);service.state.history=[historical]
  const original=structuredClone(review().original)
  assert.deepEqual(ids(review().group),[eye]);assert.ok(service.state.recommendation)
  const oldRule=ruleBinding(service)
  service.updateEffectCorrectionRule(oldRule,{action:'replace',entryId:sword})
  assert.deepEqual(ids(review().group),[sword])
  assert.deepEqual(service.state.currentEffects,service.liveDriver.effectLedger.effects)
  assert.deepEqual(service.state.currentEffects,service.state.floor.currentEffects)
  assert.deepEqual(service.state.history,[historical]);assert.deepEqual(review().original,original)
  assert.throws(()=>service.deleteEffectCorrectionRule(oldRule),/已更新/)
  service.updateEffectCorrectionRule(ruleBinding(service),{action:'ignore'})
  assert.equal(review().group.complete,true);assert.equal(review().sources[0].selection,'ignore')
  service.deleteEffectCorrectionRule(ruleBinding(service))
  assert.equal(review().group.complete,false);assert.equal(review().sources[0].selection,'keep')
  assert.equal(service.getEffectCorrectionRules().rules.length,0)
  assert.deepEqual(service.state.effectCorrectionMemory.history.map(item=>item.operation),['save','save','save','delete'])
})

test('已识别效果可替换、排除、重新修改，并沿用词库的完整描述和计算支持',()=>{
  const service=setup(),review=capture(service,['钝化之剑',...entry('钝化之剑').descriptions])
  const source=review().sources[0];assert.match(source.rawText,/钝化之剑/)
  service.correctEffectTarget(review().binding,correction(source.id,eye))
  assert.deepEqual(ids(review().group),[eye])
  service.correctEffectTarget(review().binding,correction(source.id,null))
  assert.equal(review().group.complete,true);assert.equal(review().sources[0].selection,'ignore')
  service.deleteEffectCorrectionRule(ruleBinding(service))
  assert.deepEqual(ids(review().group),[sword])
  const memory=emptyEffectMemory(),unsupported={...catalog,entries:catalog.entries.map(e=>e.id===eye?{...e,descriptions:['尚未支持的规则']}:e)}
  rememberEffectRule(memory,'错误甲','replace',eye,unsupported)
  const group=applyEffectMemory({status:'located',texts:['错误甲']},unsupported,memory).group
  assert.equal(group.entries[0].calculationStatus,'unsupported');assert.equal(group.effects[0].status,'unknown')
})

test('仅本次不会改变记忆，无来源添加不学习，后续管理不覆盖本次修正',()=>{
  const service=setup(),review=capture(service,['错误甲','错误乙'])
  const [a,b]=review().sources
  service.correctEffectTarget(review().binding,correction(a.id,eye))
  const memory=structuredClone(service.state.effectCorrectionMemory)
  const current=correction(a.id,sword,false);current.sourceEdits.push({sourceId:b.id,action:'ignore'});current.addedEntryIds=[entry('钱包失窃').id]
  service.correctEffectTarget(review().binding,current)
  assert.deepEqual(service.state.effectCorrectionMemory,memory)
  assert.deepEqual(new Set(ids(review().group)),new Set([sword,entry('钱包失窃').id]))
  service.updateEffectCorrectionRule(ruleBinding(service),{action:'ignore'})
  assert.ok(ids(review().group).includes(sword))
  const newReview=capture(service,['错误甲','错误乙'],{evidenceId:'new'})
  assert.equal(newReview().group.complete,false);assert.deepEqual(ids(newReview().group),[])
  assert.equal(newReview().target.correction,undefined)
})

test('同名变体保留名称和描述来源，删除不留下孤立标题；所有词库选择保持确定 ID',()=>{
  const variants=catalog.entries.filter(e=>e.name === '刺客之刃')
  const headingMemory=emptyEffectMemory();rememberEffectRule(headingMemory,variants[0].name,'replace',variants[0].id,catalog)
  const changedVariant=parse([variants[1].name,...variants[1].descriptions],headingMemory)
  assert.equal(changedVariant.hits.length,0);assert.deepEqual(ids(changedVariant.group),[variants[1].id])
  const service=setup(),review=capture(service,[variants[0].name,...variants[0].descriptions])
  assert.equal(review().sources[0].rawText,[variants[0].name,...variants[0].descriptions].join('\n'))
  service.correctEffectTarget(review().binding,correction(review().sources[0].id,null))
  assert.equal(review().group.complete,true);assert.deepEqual(ids(review().group),[])
  for(const item of catalog.entries.filter(e=>['boon','affliction'].includes(e.kind))){
    const memory=emptyEffectMemory();rememberEffectRule(memory,'错误甲','replace',item.id,catalog)
    assert.deepEqual(ids(parse(['错误甲'],memory).group),[item.id],item.id)
  }
})

test('取消读取无副作用，来源伪造、过期窗口和采集中拒绝',()=>{
  const service=setup(),review=capture(service),before=JSON.stringify(service.state),first=review()
  service.getEffectCorrectionRules();assert.equal(JSON.stringify(service.state),before)
  assert.throws(()=>service.correctEffectTarget(first.binding,correction('forged',eye)),/来源/)
  const edit=correction(first.sources[0].id,eye);edit.sourceEdits[0].rawText='伪造原文'
  service.correctEffectTarget(first.binding,edit)
  assert.equal(service.getEffectCorrectionRules().rules[0].rawText,'错误甲')
  const opened=review();service.updateEffectCorrectionRule(ruleBinding(service),{action:'ignore'})
  assert.throws(()=>service.correctEffectTarget(opened.binding,correction(opened.sources[0].id,sword)),/规则已更新/)
  service.state.running=true
  assert.throws(()=>service.deleteEffectCorrectionRule(ruleBinding(service)),/采集/)
  assert.throws(()=>service.correctEffectTarget(review().binding,correction(opened.sources[0].id,sword)),/采集/)
})

test('采集截断、截图失败与覆盖不足不能被忽略规则消除',()=>{
  const service=setup();rememberEffectRule(service.state.effectCorrectionMemory,'错误甲','ignore',null,catalog)
  for(const context of [{status:'partial'},{captureIssue:'截图保存失败'}]){
    const review=capture(service,['错误甲'],context)()
    assert.equal(review.group.complete,false);assert.equal(service.state.floor.effectScan.complete,false)
  }
  const review=capture(service);service.state.floor.effectScan.coverageConfirmed=false
  service.correctEffectTarget(review().binding,correction(review().sources[0].id,null))
  assert.equal(service.state.floor.effectScan.complete,false)
})

test('失败重读保留已应用规则的历史；成功截图中的新未知文字仍能直接纠正',()=>{
  const service=setup();rememberEffectRule(service.state.effectCorrectionMemory,'错误甲','ignore',null,catalog)
  capture(service,['错误甲','错误乙'])
  const old=structuredClone(service.state.floor)
  const failed=capture(service,[],{status:'partial',evidenceId:'failed'})
  preservePreviousCapture(service.state.floor,old)
  assert.equal(service.state.floor.effectScan.targets[0].previousCapture.result.memoryHits.length,1)
  assert.equal(failed().editable,false)
  const next=capture(service,['新错误'],{evidenceId:'new'})
  preservePreviousCapture(service.state.floor,old)
  assert.equal(service.state.floor.effectScan.targets[0].previousCapture,undefined)
  assert.equal(next().editable,true)
})

test('规则跨重启、重置本轮保留；历史修改不改写历史结果及路线',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'sanctum-memory-'))
  try{
    const repository=new SanctumRepository(directory),service=setup(repository),review=capture(service)
    service.correctEffectTarget(review().binding,correction(review().sources[0].id,eye))
    const restored=setup(repository),saved=JSON.stringify({floor:restored.state.floor,effects:restored.state.currentEffects,route:restored.routeResult})
    assert.equal(restored.state.restoredFromSave,true)
    restored.updateEffectCorrectionRule(ruleBinding(restored),{action:'replace',entryId:sword})
    assert.equal(JSON.stringify({floor:restored.state.floor,effects:restored.state.currentEffects,route:restored.routeResult}),saved)
    const again=setup(repository)
    assert.deepEqual(ids(capture(again,['错误甲'],{runId:'next-run',floorId:'next-floor'})().group),[sword])
    const reset=resetSanctumRun(again.state)
    assert.deepEqual(reset.effectCorrectionMemory,again.state.effectCorrectionMemory);assert.equal(reset.floor,null)
    again.state=reset;again.persist()
    assert.equal(setup(repository).getEffectCorrectionRules().rules[0].entryId,sword)
  }finally{fs.rmSync(directory,{recursive:true,force:true})}
})

test('词库目标删除、描述或级别改变停用；重存后使用新版本',()=>{
  const memory=emptyEffectMemory(),rule=rememberEffectRule(memory,'错误甲','replace',eye,catalog)
  for(const entries of [catalog.entries.filter(e=>e.id!==eye),catalog.entries.map(e=>e.id===eye?{...e,descriptions:['变化']}:e),catalog.entries.map(e=>e.id===eye?{...e,tier:'minor'}:e)]){
    const changed={...catalog,entries};assert.equal(effectRuleStatus(rule,changed).active,false)
    assert.equal(applyEffectMemory({status:'located',texts:['错误甲']},changed,memory).hits.length,0)
  }
  const changed={...catalog,entries:catalog.entries.map(e=>e.id===eye?{...e,descriptions:['变化']}:e)}
  const next=rememberEffectRule(memory,'错误甲','replace',eye,changed)
  assert.equal(next.revision,2);assert.equal(effectRuleStatus(next,changed).active,true)
})

test('记忆来源的截图和 OCR 跨重读、重置与重启保留，拒绝借用其他目标截图',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'sanctum-memory-evidence-'))
  try{
    const repository=new SanctumRepository(directory),service=setup(repository)
    const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
    const region={x:0,y:0,width:1,height:1},frame={png,width:1,height:1,region,kind:'effect-crop',sourceWidth:1,sourceHeight:1,sourceRegion:region}
    const origins=[]
    for(const text of ['错误甲','错误乙']){
      const evidenceId=repository.evidence.add({runId:'r',floorId:'f',roomId:'effect:1',sessionId:'session'},frame)
      const review=capture(service,[text],{evidenceId})
      service.correctEffectTarget(review().binding,correction(review().sources[0].id,eye))
      origins.push(service.getEffectCorrectionRules().rules.at(-1).source)
    }
    service.resetRun()
    const restored=setup(repository)
    for(const source of origins){
      assert.equal(restored.getEffectEvidence(source).dataUrl,'data:image/png;base64,'+png)
      assert.ok(source.texts[0].startsWith('错误'))
      assert.throws(()=>restored.getEffectEvidence({...source,targetId:'effect:2'}),/过期/)
    }
    assert.equal(JSON.parse(fs.readFileSync(repository.file)).evidenceRecords.length,2)
  }finally{fs.rmSync(directory,{recursive:true,force:true})}
})

test('只迁移明确原文的旧排除替换，删除后重启不复活',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'sanctum-memory-migrate-'))
  try{
    const repository=new SanctumRepository(directory),service=setup(repository),review=capture(service,['钝化之剑','错误甲','错误乙'])
    const [a,b]=review().original.unresolved
    service.correctEffectTarget(review().binding,{entryIds:[eye],resolutions:[{id:a.id,action:'replace',entryId:sword},{id:b.id,action:'ignore'}]})
    const data=JSON.parse(fs.readFileSync(repository.file,'utf8'))
    delete data.effectCorrectionMemory
    delete data.lastCapture.floor.effectScan.targets[0].effectGroup
    fs.writeFileSync(repository.file,JSON.stringify(data))
    const migrated=setup(repository),rules=migrated.getEffectCorrectionRules().rules
    assert.equal(rules.length,2);assert.ok(!rules.some(rule=>rule.rawText.includes('钝化之剑')))
    migrated.deleteEffectCorrectionRule(ruleBinding(migrated))
    assert.equal(setup(repository).getEffectCorrectionRules().rules.length,1)
    const memory=migrateEffectMemory(emptyEffectMemory(),[{effectScan:{targets:[{correction:{entryIds:[eye],resolutions:[]},effectGroup:review().original}]}}],catalog)
    assert.equal(memory.rules.length,0)
    forgetEffectRule(memory,'missing');assert.equal(memory.revision,0)
  }finally{fs.rmSync(directory,{recursive:true,force:true})}
})

test('已确认空栏在规则编辑删除后保持完整，未覆盖和失败仍不完整',()=>{
  const service=setup()
  rememberEffectRule(service.state.effectCorrectionMemory,'错误甲','ignore',null,catalog)
  capture(service)
  service.state.floor.effectScan={targets:[],groups:[],rewardGroups:[],binding:observationKey(service.state.floor),coverageConfirmed:true,finished:true,complete:true}
  for (const action of ['update','delete']) {
    if (action === 'delete') service.deleteEffectCorrectionRule(ruleBinding(service))
    else service.updateEffectCorrectionRule(ruleBinding(service),{action:'replace',entryId:eye})
    assert.equal(service.state.floor.effectScan.complete,true)
    assert.deepEqual(service.state.currentEffects,[])
  }
  for (const scan of [
    {targets:[],coverageConfirmed:false},
    {targets:[{targetId:'effect:scan',stage:'scan-failed'}],coverageConfirmed:true}
  ]) assert.equal(rebuildCorrectedScan(scan,catalog).scan.complete,false)
})

test('相同规则重复提交不增加长期版本，真实修改仍递增',()=>{
  const service=setup(),review=capture(service)
  service.correctEffectTarget(review().binding,correction(review().sources[0].id,eye))
  const before=structuredClone(service.state.effectCorrectionMemory)
  service.correctEffectTarget(review().binding,correction(review().sources[0].id,eye))
  assert.deepEqual(service.state.effectCorrectionMemory,before)
  service.correctEffectTarget(review().binding,correction(review().sources[0].id,sword))
  assert.equal(service.state.effectCorrectionMemory.revision,before.revision+1)
})

test('记忆历史有界且旧数据加载截断，广播不克隆完整记忆',async()=>{
  const {readEffectMemory,EFFECT_MEMORY_HISTORY_LIMIT}=await import('../electron/modules/sanctum/effectMemory.js')
  const memory=emptyEffectMemory()
  for(let i=0;i<130;i++) rememberEffectRule(memory,'错误甲','replace',i%2?eye:sword,catalog,i)
  assert.equal(memory.history.length,EFFECT_MEMORY_HISTORY_LIMIT)
  assert.equal(memory.history[0].revision,31)
  const old={...memory,history:Array.from({length:150},(_,i)=>({revision:i}))}
  const loaded=readEffectMemory(old)
  assert.equal(loaded.history.length,EFFECT_MEMORY_HISTORY_LIMIT)
  assert.equal(loaded.history[0].revision,50)
  assert.deepEqual(loaded.rules,memory.rules)
  forgetEffectRule(memory,memory.rules[0].id)
  assert.equal(memory.history.length,EFFECT_MEMORY_HISTORY_LIMIT)
  assert.equal(memory.history.at(-1).operation,'delete')
  const service=setup();service.state.effectCorrectionMemory=loaded
  assert.deepEqual(service.publish().effectCorrectionMemory,{revision:loaded.revision})
  assert.equal(service.getEffectCorrectionRules().rules.length,1)
})
