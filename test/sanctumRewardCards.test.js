import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { runPython } from './helpers/python.js'
import { parseSanctumRoomTexts, SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { roomCardSummary, rewardDetail } from '../shared/sanctumPresentation.js'
import { SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { emptySanctumState, createSanctumStrategy, applySanctumEffects } from '../shared/sanctum.js'
import { scoreRoom } from '../electron/modules/sanctum/planner.js'

test('两组用户截图原尺寸与125%保留三个选项，空白与装饰不产生通货', () => {
  const result = runPython(`
import sys,json,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import load_image
from sanctum_rewards import recognize_currency_icons,templates
results=[]
for name in ['reward-alchemy-chaos','reward-fusing-binding-jewellers']:
 image=load_image('test/fixtures/sanctum/'+name+'.png')
 for scale in [1,1.25]:
  panel=cv2.resize(image,None,fx=scale,fy=scale,interpolation=cv2.INTER_CUBIC) if scale!=1 else image
  results.append(recognize_currency_icons(panel))
negative=recognize_currency_icons(image[:55])
blank=recognize_currency_icons(np.full((90,300,3),35,np.uint8))
print(json.dumps({'results':results,'negative':negative,'blank':blank,'count':len(templates())}))`)
  const expected = [['点金石','点金石','混沌石'],['链结石','高阶点金石','工匠石']]
  result.results.forEach((icons,index) => {
    assert.deepEqual(icons.map(i=>i.currency), expected[Math.floor(index/2)])
    assert.ok(icons.every(i=>i.confidence>=.94))
    const room=parseSanctumRoomTexts(['完成后提供物品'],{entries:[]},icons)
    assert.equal(room.detailsStatus,'matched')
    assert.equal(room.failureReason,null)
    assert.equal(room.calculationStatus,'supported')
    assert.deepEqual(room.rewards.map(r=>r.currency),expected[Math.floor(index/2)])
    assert.equal(new Set(room.rewards.map(r=>r.offerId)).size,3)
    assert.ok(room.rewards.every(r=>r.quantity===null && r.quantityStatus==='not-shown' && r.region))
    assert.equal(scoreRoom({...room,id:'0:0'},createSanctumStrategy(),applySanctumEffects([])).unknown.length,0)
  })
  assert.equal(result.count,35)
  assert.deepEqual(result.negative,[])
  assert.deepEqual(result.blank,[])
})

test('卡片序号恒定，内容替换状态，数量未展示与可见数值分开', () => {
  for (const [detailsStatus,label] of [['queued','等待识别'],['reading','读取中'],['failed','读取失败']]) {
    assert.equal(roomCardSummary({id:'2:1',detailsStatus}),`2:1 · ${label}`)
  }
  assert.equal(roomCardSummary({id:'1:1',detailsStatus:'matched',recognition:{matches:[{descriptions:['恢复 50 坚毅']},{descriptions:['恢复 50 坚毅']}]}}),'1:1 · 恢复 50 坚毅')
  assert.equal(roomCardSummary({id:'0:0',rewards:[{currency:'点金石'},{currency:'点金石'},{currency:'混沌石'}]}),'0:0 · 点金石 / 点金石 / 混沌石')
  assert.equal(rewardDetail({currency:'混沌石',quantity:null}),'混沌石 · 具体数量通过房间后确认')
  assert.equal(rewardDetail({currency:'混沌石',quantity:2,timing:'immediate'}),'混沌石 × 2 · 立即领取')
  const incomplete=parseSanctumRoomTexts(['完成后提供物品'],{entries:[]})
  assert.equal(incomplete.detailsStatus,'partial')
  assert.equal(incomplete.failureReason,'奖励图标尚未识别')
  assert.equal(incomplete.knowledge.rewards.status,'failed')
  assert.equal(rewardDetail({currency:'混沌石',quantity:null,quantityStatus:'failed'}),'混沌石 · 数量读取失败')
})

test('同名文字与图标只凭位置合并，独立选项保留未知数量',()=>{
  const icons=[{currency:'混沌石',confidence:.98,region:{x:5,y:20,width:25,height:25}},
    {currency:'混沌石',confidence:.98,region:{x:90,y:70,width:25,height:25}}]
  const room=parseSanctumRoomTexts(['立即获得 2 混沌石'],{entries:[{kind:'reward',name:'混沌石'}]},icons,
    {ocrLines:[{text:'立即获得 2 混沌石',region:{x:30,y:22,width:160,height:20}}]})
  assert.equal(room.rewards.length,2)
  assert.equal(room.rewards[0].quantity,2)
  assert.equal(room.rewards[1].quantity,null)
  assert.deepEqual(room.rewards[1].region,icons[1].region)
})

test('文字先提交、图标后补及重新读取整体替换，不保留旧警告或重复合并',async()=>{
  let kinds=['点金石','点金石','混沌石']
  const driver=new SanctumLiveDriver({catalog:{entries:[]},makeClient:()=>({async request(command,input){
    return input.iconsOnly ? {currencyIcons:kinds.map((currency,x)=>({currency,confidence:.98,region:{x:x*30,y:30,width:25,height:25}})),captureMetrics:{iconsMs:1}}
      : {texts:['完成后提供物品'],hasCurrencyOffer:true,status:'located',captureMetrics:{ocrCalls:1}}
  },shutdown:async()=>{}})})
  driver.assertLog=()=>({floorId:'f'});driver.profile={};driver.runId='r'
  driver.client={sessionId:'s',request:async()=>({png:'fixture',region:{x:10,y:20,width:150,height:80},status:'located'}),shutdown:async()=>{}}
  try {
    const read=async()=>{
      const captured=await driver.captureRoom({id:'a'},{signal:new AbortController().signal,guard:()=>{}})
      const text=await captured.recognition
      assert.equal(text.patch.readStages.icons,'queued')
      return (await captured.supplement()).patch
    }
    const patch=await read()
    assert.equal(patch.failureReason,null)
    assert.equal(patch.readStages.icons,'matched')
    assert.equal(patch.rewards.length,3)
    const directory=fs.mkdtempSync(path.join(os.tmpdir(),'sanctum-reward-test-'))
    try {
      const repo=new SanctumRepository(directory),state=emptySanctumState()
      state.floor={rooms:[{id:'a',...patch}],edges:[]}
      repo.save(state)
      assert.deepEqual(repo.load().floor.rooms[0].rewards,patch.rewards)
    } finally {fs.rmSync(directory,{recursive:true,force:true})}
    kinds=['工匠石']
    assert.deepEqual((await read()).rewards.map(r=>r.currency),['工匠石'])
  } finally {await driver.close()}
})
