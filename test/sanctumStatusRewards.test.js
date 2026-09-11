import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {runPython} from './helpers/python.js'
import {parseStatusTooltip} from '../electron/modules/sanctum/statusRecognition.js'
import {observationKey,syncStatusRewards,validateRewardLedger} from '../electron/modules/sanctum/runObservation.js'
import {SanctumLiveDriver} from '../electron/modules/sanctum/liveDriver.js'
import {acceptSanctumFloor} from '../electron/modules/sanctum/state.js'
import {emptySanctumState} from '../shared/sanctum.js'
import {effectReadIssues,effectIssueText,effectTargetLabel,completedEffectGroups,emptyEffectGroups,effectScanFinished} from '../shared/sanctumEffects.js'
const catalog=JSON.parse(fs.readFileSync('electron/assets/sanctum/catalog.json','utf8'))
const promise='完成禁域时获得 14× 混沌石'
const base=()=>({identityConfirmed:true,runId:'batch',sanctumRunId:'run',floorId:'f',mapKey:'m',currentRoomId:'1:1',positionStatus:'confirmed',revision:1,rooms:[],edges:[]})
const scanned=(texts=[promise],floor=base())=>({...floor,effectScan:{binding:observationKey(floor),rewardGroups:[{
  ...parseStatusTooltip({status:'located',texts},catalog).rewardGroup,targetId:'effect:3',evidenceId:'proof'}]}})

test('真实奖励截图 OCR 分流为三项本轮待领奖励，保留数量和来源行',()=>{
  const ocr=runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import load_image
from sanctum_ocr import create_sanctum_ocr_engine,read_room_ocr
im=load_image('test/fixtures/sanctum/status-pending-rewards.png')
print(json.dumps(read_room_ocr(create_sanctum_ocr_engine(),im[49:333,76:733])))`)
  const result=parseStatusTooltip({status:'located',...ocr},catalog)
  assert.equal(result.effectGroup,null)
  assert.equal(result.classificationComplete,true)
  assert.equal(result.rewardGroup.complete,true)
  assert.deepEqual(result.rewardGroup.rewards.map(r=>[r.currency,r.quantity,r.timing,r.state]),[
    ['混沌石',14,'run','pending'],['机会石',30,'run','pending'],['点金石',40,'run','pending']])
})

test('奖励换行、同币种独立行及截断不污染效果，未知类型保持缺口',()=>{
  const result=parseStatusTooltip({status:'located',texts:['楼层结束时获得','14×','混沌石',promise,promise]},catalog)
  assert.deepEqual(result.rewardGroup.rewards.map(r=>r.timing),['floor','run','run'])
  assert.equal(result.rewardGroup.complete,true)
  const partial=parseStatusTooltip({status:'partial',texts:['完成禁域时获得 ?×未知物品'],reason:'截断'},catalog)
  assert.equal(partial.classificationComplete,true)
  assert.equal(partial.effectGroup,null)
  assert.equal(partial.rewardGroup.complete,false)
  assert.equal(partial.rewardGroup.rewards.length,0)
  assert.equal(parseStatusTooltip({status:'located',texts:['未知文字']},catalog).classificationComplete,false)
  assert.equal(parseStatusTooltip({status:'partial',texts:['全知之眼']},catalog).classificationComplete,false)
})

async function readStatus(t,texts,coverageConfirmed=true) {
  const driver=new SanctumLiveDriver({catalog,makeClient:()=>({sessionId:'s',async shutdown(){},async request(command,input){
    if(command==='interfaceState')return {mapOpen:true,hudLayout:'map'}
    if(command==='inspectEffects')return {coverageConfirmed,icons:texts.map((_,x)=>({x,y:1}))}
    if(command==='hoverEffect')return {status:'located',texts:texts[input.icon.x]}
  }})})
  await driver.open();t.after(()=>driver.close())
  driver.assertLog=()=>({floorId:'f'});driver.logContext={context:{},close(){}}
  driver.profile={environment:{},interfaceTitles:{'sanctum-map-hud':{}},mapEffectIconsRegion:{}}
  return driver.finalizeFloor(base(),new AbortController().signal)
}

test('空 OCR 只报具体浮窗，分类结果为空不影响整体未知，截图标签同源',async t=>{
  const floor=await readStatus(t,[['钝化之剑'],[]])
  assert.deepEqual(floor.effectScan.groups.slice(0,4).map(g=>g.status),['absent','absent','absent','read'])
  assert.equal(floor.effectScan.complete,false)
  assert.equal(floor.effectScan.finished,true)
  assert.ok(floor.currentEffects.some(e=>e.status==='unknown'))
  const issues=effectReadIssues(floor.effectScan)
  assert.equal(issues.length,1)
  assert.equal(issues[0].targetId,'effect:2')
  assert.equal(issues[0].label,effectTargetLabel(floor.effectScan.targets[1]))
  assert.equal(effectIssueText(issues[0]),'状态栏第 2 个图标浮窗 · 读取：未识别到该浮窗的名称或描述，无法确定具体状态')
  const group=floor.effectScan.groups.find(g=>g.targetId==='effect:2')
  assert.equal(group.iconIndex,2)
  assert.equal(group.evidenceId,floor.effectScan.targets[1].evidenceId)
})

test('部分未知文字显示原文且不污染已识别类别，混合奖励失败合并原因',async t=>{
  const floor=await readStatus(t,[['钝化之剑','测试无法匹配的描述','完成禁域时获得 ?×混沌石']])
  const issues=effectReadIssues(floor.effectScan)
  assert.equal(issues.length,1)
  assert.equal(issues[0].label,'钝化之剑')
  assert.match(issues[0].reason,/测试无法匹配的描述/)
  assert.match(issues[0].reason,/完成禁域时获得 \?×混沌石/)
  assert.equal(floor.effectScan.groups.find(g=>g.category==='minorAffliction').status,'read')
})

test('零图标与纯奖励四类为空；覆盖不足和入口失败单独报告；重读成功无旧错误',async t=>{
  for(const texts of [[],[[promise]]]) {
    const floor=await readStatus(t,texts)
    assert.ok(floor.effectScan.groups.every(g=>g.status==='absent'))
    assert.deepEqual(effectReadIssues(floor.effectScan),[])
  }
  const uncovered=await readStatus(t,[],false)
  assert.deepEqual(effectReadIssues(uncovered.effectScan).map(i=>i.stage),['scan'])
  assert.deepEqual(effectReadIssues({finished:true,complete:false,groups:[],targets:[{targetId:'effect:scan',stage:'scan-failed',reason:'入口扫描超时'}]}).map(i=>i.stage),['scan-failed'])
  assert.deepEqual(effectReadIssues((await readStatus(t,[['钝化之剑']])).effectScan),[])
  assert.equal(effectScanFinished({complete:false,groups:emptyEffectGroups()}),false)
  assert.ok(completedEffectGroups(emptyEffectGroups()).every(g=>g.status==='unconfirmed'))
})

test('旧记录空类别、无来源重复错误和内部编号兼容展示',()=>{
  const target={targetId:'effect:2',stage:'failed',texts:[],reason:'未读到词缀文字'}
  const scan={complete:false,targets:[target],groups:[...emptyEffectGroups().map(g=>({...g,status:'failed'})),
    {category:null,label:'未完整识别',complete:false,texts:[],reason:target.reason}]}
  assert.equal(effectScanFinished(scan),true)
  assert.ok(completedEffectGroups(scan.groups,true).slice(0,4).every(g=>g.status==='absent'))
  const issues=effectReadIssues(scan)
  assert.equal(issues.length,1)
  assert.equal(issues[0].label,'状态栏第 2 个图标浮窗')
  assert.doesNotMatch(effectIssueText(issues[0]),/effect:|未完整识别|词缀文字/)
})

test('解析保留截图绑定，装饰文字不算读取成功，同一目标同阶段只报告一次',()=>{
  const {effectGroup}=parseStatusTooltip({status:'located',texts:['X'],targetId:'effect:2',iconIndex:2,evidenceId:'proof-2'},catalog)
  assert.equal(effectGroup.targetId,'effect:2')
  assert.equal(effectGroup.evidenceId,'proof-2')
  assert.equal(effectGroup.iconIndex,2)
  assert.equal(effectGroup.status,'failed')
  const scan={complete:false,targets:[
    {targetId:'effect:2',stage:'ocr-failed',reason:'文字识别超时'},
    {targetId:'effect:2',stage:'ocr-failed',reason:'OCR 进程退出'}]}
  const issues=effectReadIssues(scan)
  assert.equal(issues.length,1)
  assert.match(issues[0].reason,/文字识别超时；OCR 进程退出/)
})

test('真实驱动分开效果完成与奖励失败：缺失类别为无，奖励不生成未知效果',async t=>{
  const floor=await readStatus(t,[['全知之眼'],['钝化之剑'],[promise],['楼层结束时获得 ?×点金石']])
  assert.equal(floor.effectScan.complete,false)
  assert.equal(floor.effectScan.effectsComplete,true)
  assert.deepEqual(floor.effectScan.groups.map(g=>g.status),['read','absent','absent','read'])
  assert.equal(floor.effectScan.rewardGroups.length,2)
  assert.ok(floor.currentEffects.every(e=>e.entryId))
  const state=acceptSanctumFloor(emptySanctumState(),floor)
  assert.equal(state.rewardLedger.items.length,1)
  assert.equal(state.rewardLedger.items[0].state,'pending')
  assert.equal(state.rewardLedger.complete,false)
  const unknown=await readStatus(t,[['全知之眼'],['未认识的入口']])
  assert.equal(unknown.effectScan.groups.find(g=>g.category==='minorBoon').status,'absent')
  const uncovered=await readStatus(t,[[promise]],false)
  assert.equal(uncovered.effectScan.effectsComplete,false)
  assert.ok(uncovered.effectScan.groups.every(g=>g.status==='absent'))
})

test('奖励快照重复替换、不合并独立行，保留手动记录且不会确认全账本',()=>{
  const floor=scanned([promise,promise])
  const first=syncStatusRewards(null,floor)
  assert.equal(first.items.length,2)
  assert.deepEqual(syncStatusRewards(first,floor),first)
  const manual=validateRewardLedger({complete:true,items:[{id:'manual',currency:'混沌石',quantity:14,state:'pending',timing:'run',eligible:true}]},base())
  const mixed=syncStatusRewards(manual,floor)
  assert.equal(mixed.items.length,2)
  assert.equal(mixed.items[0].id,'manual')
  assert.equal(mixed.items[0].eligible,true)
  assert.equal(mixed.complete,false)
  assert.deepEqual(syncStatusRewards(mixed,floor),mixed)
  const corrected=validateRewardLedger({complete:true,items:mixed.items},floor)
  assert.equal(syncStatusRewards(corrected,floor).items.length,2)
  assert.equal(syncStatusRewards(corrected,floor).complete,true)
  const changed=scanned(['楼层结束时获得 8× 点金石'])
  changed.effectScan.rewardGroups[0].evidenceId='new-proof'
  const combined=syncStatusRewards(corrected,changed)
  assert.equal(new Set(combined.items.map(item=>item.id)).size,combined.items.length)
  assert.doesNotThrow(()=>validateRewardLedger({items:combined.items,complete:true},changed))
  const fewer=syncStatusRewards(first,scanned([promise]))
  assert.equal(fewer.items.length,1)
  const failed=syncStatusRewards(first,scanned(['完成禁域时获得 ?×混沌石']))
  assert.equal(failed.items.length,0)
})

test('自动奖励随位置及楼层重新观测，过期绑定与迟到版本拒收，跨轮不带旧账本',()=>{
  const firstFloor=scanned(),first=syncStatusRewards(null,firstFloor)
  const moved={...base(),currentRoomId:'2:1',revision:2}
  assert.equal(syncStatusRewards(first,{...moved,effectScan:firstFloor.effectScan}),first)
  const next=syncStatusRewards(first,scanned(['楼层结束时获得 8× 点金石'],moved))
  assert.deepEqual(next.items.map(r=>r.currency),['点金石'])
  const level=syncStatusRewards(next,scanned([promise],{...moved,floorId:'f2'}))
  assert.equal(level.items.length,1)
  assert.equal(level.items[0].currency,'混沌石')
  const other=syncStatusRewards(level,scanned([promise],{...base(),sanctumRunId:'new'}))
  assert.equal(other.runId,'new');assert.equal(other.items.length,1)
  assert.equal(syncStatusRewards(first,{...firstFloor,identityConfirmed:false}),first)
  let state=acceptSanctumFloor(emptySanctumState(),firstFloor)
  state=acceptSanctumFloor(state,{...scanned(['楼层结束时获得 8× 点金石'],moved),revision:2})
  assert.deepEqual(acceptSanctumFloor(state,firstFloor).rewardLedger,state.rewardLedger)
})
