import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {runPython} from './helpers/python.js'
import {parseStatusTooltip} from '../electron/modules/sanctum/statusRecognition.js'
import {observationKey} from '../electron/modules/sanctum/runObservation.js'
import {SanctumLiveDriver} from '../electron/modules/sanctum/liveDriver.js'
import {acceptSanctumFloor} from '../electron/modules/sanctum/state.js'
import {emptySanctumState} from '../shared/sanctum.js'
import {effectReadIssues,effectIssueText,effectTargetLabel,completedEffectGroups,emptyEffectGroups,effectScanFinished} from '../shared/sanctumEffects.js'
const catalog=JSON.parse(fs.readFileSync('electron/assets/sanctum/catalog.json','utf8'))
const promise='完成禁域时获得 14× 混沌石'
const base=()=>({identityConfirmed:true,runId:'batch',sanctumRunId:'run',floorId:'f',mapKey:'m',currentRoomId:'1:1',positionStatus:'confirmed',revision:1,rooms:[],edges:[]})

test('真实奖励截图 OCR 识别为奖励上下文，不生成效果或账本',()=>{
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
  assert.equal(result.hasRewardContext,true)
  assert.equal(result.rewardGroup,undefined)
})

test('奖励换行、同币种独立行及截断不污染效果，未知类型保持缺口',()=>{
  const result=parseStatusTooltip({status:'located',texts:['楼层结束时获得','14×','混沌石',promise,promise]},catalog)
  const partial=parseStatusTooltip({status:'partial',texts:['完成禁域时获得 ?×未知物品'],reason:'截断'},catalog)
  assert.equal(partial.classificationComplete,true)
  assert.equal(partial.effectGroup,null)
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

test('部分未知文字显示原文且不污染已识别类别，排除奖励内容',async t=>{
  const floor=await readStatus(t,[['钝化之剑','测试无法匹配的描述','完成禁域时获得 ?×混沌石']])
  const issues=effectReadIssues(floor.effectScan)
  assert.equal(issues.length,1)
  assert.equal(issues[0].label,'钝化之剑')
  assert.match(issues[0].reason,/测试无法匹配的描述/)
  assert.doesNotMatch(issues[0].reason,/完成禁域时获得/)
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

test('真实驱动忽略奖励数量缺口，奖励不生成未知效果或账本',async t=>{
  const floor=await readStatus(t,[['全知之眼'],['钝化之剑'],[promise],['楼层结束时获得 ?×点金石']])
  assert.equal(floor.effectScan.complete,true)
  assert.equal(floor.effectScan.effectsComplete,true)
  assert.deepEqual(floor.effectScan.groups.map(g=>g.status),['read','absent','absent','read'])
  assert.equal(floor.effectScan.rewardGroups,undefined)
  assert.ok(floor.currentEffects.every(e=>e.entryId))
  const state=acceptSanctumFloor(emptySanctumState(),floor)
  assert.equal(state.rewardLedger,undefined)
  const unknown=await readStatus(t,[['全知之眼'],['未认识的入口']])
  assert.equal(unknown.effectScan.groups.find(g=>g.category==='minorBoon').status,'absent')
  const uncovered=await readStatus(t,[[promise]],false)
  assert.equal(uncovered.effectScan.effectsComplete,false)
  assert.ok(uncovered.effectScan.groups.every(g=>g.status==='absent'))
})
