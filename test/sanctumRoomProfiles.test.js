import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { SANCTUM_ROOM_PROFILES, recognizeRoomProfile, roomLayoutPreference } from '../shared/sanctumRoomProfiles.js'
import { createSanctumStrategy } from '../shared/sanctum.js'
import { initialEffectState, advanceSanctumRoom } from '../shared/sanctumStateEvaluation.js'
import { parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { knownRoom } from '../electron/modules/sanctum/knowledge.js'
import { planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { preservePreviousCapture } from '../electron/modules/sanctum/previousCapture.js'
import { runPython } from './helpers/python.js'

const catalog = JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json', import.meta.url)))
const parse = (name, floorId = 'floor:0', texts = ['完成后提供物品']) => parseSanctumRoomTexts(texts, catalog,
  [{ currency:'混沌石', confidence:1 }], { titleTexts:[name], floorId })
const strategy = preset => createSanctumStrategy(preset)
const node = (id, column, name, extras = {}) => ({ id,column,revealed:true,...parse(name),...extras })
const edge = (from,to) => ({ from,to,status:'matched' })
const floor = () => ({identityConfirmed:true,runId:'capture',floorId:'floor:0',mapKey:'map',revision:1,currentRoomId:'s',
  rooms:[node('s',0,'废弃图书馆'),node('a',1,'圣殿编史'),node('b',1,'废弃图书馆'),
    node('c',2,'铭文室'),node('d',2,'铭文室'),node('z',3,'烛火礼拜堂',{terminal:true})],
  edges:[edge('s','a'),edge('s','b'),edge('a','c'),edge('a','d'),edge('b','c'),edge('c','z'),edge('d','z')] })

test('四层中英目录及核实别名逐项匹配，错层不会推断', () => {
  assert.equal(SANCTUM_ROOM_PROFILES.length,24)
  for (const entry of SANCTUM_ROOM_PROFILES) {
    for (const name of [entry.name,...entry.aliases]) {
      const result=recognizeRoomProfile([name],entry.floorId)
      assert.equal(result.layout,entry.layout,name)
      assert.deepEqual(result.traps,entry.traps,name)
      assert.ok(result.roomProfile.sources.length)
    }
    assert.equal(recognizeRoomProfile([entry.name],`floor:${(Number(entry.floorId.at(-1))+1)%4}`).layout,undefined)
  }
  assert.equal(recognizeRoomProfile(['没核实的房间'],'floor:0').layout,undefined)
})

test('多候选只采用共同属性；有未知候选不择优猜测', () => {
  const shared=recognizeRoomProfile(['废弃图书馆、圣光试炼'],'floor:0')
  assert.equal(shared.layout,'exit')
  assert.equal(shared.traps,undefined)
  assert.equal(shared.layoutPreferenceKey,undefined)
  assert.equal(parse('废弃图书馆、圣殿编史').layout,undefined)
  assert.equal(parse('废弃图书馆、未知标题').layout,undefined)
  assert.equal(roomLayoutPreference(knownRoom(parse('废弃图书馆、圣光试炼'),{}),strategy()),0)
})

test('标题和正文独立，标题成功不确认奖励痛苦，混合文本保留标题', () => {
  const titleOnly=parseSanctumRoomTexts([],catalog,[],{titleTexts:['废弃图书馆'],floorId:'floor:0'})
  assert.equal(titleOnly.layout,'exit')
  assert.equal(titleOnly.knowledge.layout.status,'known')
  assert.equal(titleOnly.knowledge.rewards.status,'failed')
  assert.equal(titleOnly.knowledge.afflictions.status,'failed')
  assert.equal(titleOnly.detailsStatus,'failed')
  assert.equal(parse('完全未知标题').type,'reward')
  const mixed=parseSanctumRoomTexts(['废弃图书馆','包含喷泉'],catalog,[],{floorId:'floor:0'})
  assert.equal(mixed.name,'废弃图书馆')
  assert.equal(mixed.type,'fountain')
  assert.equal(mixed.layout,'exit')
})

test('隐藏、未揭示与失效历史不贡献玩法，匹配历史及手动确认可使用', () => {
  const room={...parse('废弃图书馆'),revealed:true}
  for (const effects of [{roomsHidden:true},{typesHidden:true}]) {
    const known=knownRoom(room,{mapKey:'map'},effects)
    assert.equal(known.layout,undefined);assert.equal(known.traps,undefined)
  }
  assert.equal(knownRoom({...room,revealed:false},{}).layout,undefined)
  for(const fact of Object.values(room.knowledge)) fact.mapKey='old'
  assert.equal(knownRoom(room,{mapKey:'new'}).layout,undefined)
  assert.equal(knownRoom(room,{mapKey:'old',rerolled:true}).traps,undefined)
  assert.equal(knownRoom({...room,revealed:false},{mapKey:'old'}).layout,'exit')
  room.knowledge.layout={status:'known',source:'manual'}
  assert.equal(knownRoom(room,{}, {typesHidden:true}).layout,'exit')
})

test('出口房陷阱触发风险但仍使用出口偏好；穿越陷阱独立偏好', () => {
  const exit=knownRoom(parse('废弃图书馆'),{}), gauntlet=knownRoom(parse('圣光试炼'),{})
  assert.equal(roomLayoutPreference(exit,strategy()),2)
  assert.equal(roomLayoutPreference(gauntlet,strategy()),-1)
  const previous=initialEffectState({},[{rule:'lethalTraps',status:'matched'}])
  assert.ok(advanceSanctumRoom(previous,exit).risks.includes('陷阱会结束本轮'))
  previous.effects.push({rule:'trapsDisabled',status:'matched'})
  assert.ok(!advanceSanctumRoom(previous,exit).risks.includes('陷阱会结束本轮'))
  assert.ok(advanceSanctumRoom(initialEffectState({},[{rule:'dangerousTraps'}]),{layout:'guards'}).unknown.some(x=>x.includes('不代表无陷阱')))
})

test('小首领是战斗但不触发楼层首领恢复', () => {
  const state=initialEffectState({resolve:10,maxResolve:100},[{rule:'recoveryOnBoss',value:20},{rule:'dangerousMonsters'}])
  const mini=advanceSanctumRoom(state,knownRoom(parse('墓影书坊'),{}))
  assert.equal(mini.recovery,0);assert.ok(mini.risks.length)
  assert.equal(advanceSanctumRoom(state,knownRoom(parse('烛火礼拜堂'),{})).recovery,20)
})

test('实用策略同等奖励下分别优先选择空间和房型，目标与避让仍优先', () => {
  const f=floor()
  assert.equal(planSanctumFloor(f,strategy('reveal')).paths[0].nextRoomId,'a')
  assert.equal(planSanctumFloor(f,strategy('quantity')).paths[0].nextRoomId,'b')
  assert.equal(planSanctumFloor(f,strategy('quantity'),{targets:['a']}).paths[0].nextRoomId,'a')
  assert.equal(planSanctumFloor(f,strategy('quantity'),{avoid:['b']}).paths[0].nextRoomId,'a')
  f.rooms[1].rewards=[{currency:'神圣石',quantity:1,timing:'immediate'}]
  assert.equal(planSanctumFloor(f,strategy('quantity')).paths[0].nextRoomId,'a')
  f.rooms[2].rewards=[{currency:'神圣石',quantity:1,timing:'immediate'}]
  assert.equal(planSanctumFloor(f,strategy('quantity')).paths[0].nextRoomId,'b')
})

test('下一间相同偏好时比较后续已知房间，后续隐藏不反向改写下一间', () => {
  const f=floor()
  f.rooms[1]=node('a',1,'废弃图书馆');f.rooms[3]=node('c',2,'圣光试炼');f.rooms[4]=node('d',2,'废弃图书馆')
  f.edges=[edge('s','a'),edge('s','b'),edge('a','c'),edge('b','d'),edge('c','z'),edge('d','z')]
  for(const preset of ['reveal','quantity']) assert.equal(planSanctumFloor(f,strategy(preset)).paths[0].nextRoomId,'b')
  f.rooms[4].effects=[{rule:'typesHidden',status:'matched',trigger:'completion'}]
  const path=planSanctumFloor(f,strategy()).paths.find(p=>p.nextRoomId==='b')
  assert.equal(path.breakdown[0].layoutPreference,2)
  assert.equal(path.breakdown[1].layoutPreference,2)
  assert.equal(path.breakdown[2].layout,undefined)
  assert.ok(path.reasons.some(x=>x.includes('后续已知房间偏好合计')))
})

test('人工修改玩法清理旧陷阱与来源，修改奖励保留目录属性', () => {
  const room=node('a',1,'圣光试炼')
  const service={assertEnabled(){},state:{floor:{rooms:[room]}},recalculate(){},publish(){}}
  SanctumService.prototype.correctRoom.call(service,'a',{recovery:20})
  assert.deepEqual(room.traps,['lightning-floor'])
  SanctumService.prototype.correctRoom.call(service,'a',{layout:'miniboss'})
  assert.equal(room.traps,undefined);assert.equal(room.roomProfile,undefined)
  assert.equal(roomLayoutPreference(knownRoom(room,{}),strategy()),0)
  SanctumService.prototype.correctRoom.call(service,'a',{name:'未知房间'})
  assert.equal(room.layout,undefined)
})

test('重新采集失败只展示旧玩法，不把上一张结果用于推荐', () => {
  const previous=floor();previous.rooms[1].recognition.evidenceId='old'
  const next=floor();next.rooms[1]={id:'a',column:1,detailsStatus:'failed'}
  preservePreviousCapture(next,previous)
  assert.equal(next.rooms[1].previousCapture.result.layout,'arena')
  assert.equal(knownRoom(next.rooms[1],next).layout,undefined)
})

test('真实房间图片一次OCR分离标题和正文，原标题可供复核', () => {
  const result=runPython(`
import sys,json,base64
from pathlib import Path
sys.path.insert(0,'src/assets/scripts')
from sanctum_ocr import read_frozen,create_sanctum_ocr_engine
from sanctum_recognition import load_image
p=Path('test/fixtures/sanctum/ocr-pact.png');im=load_image(p)
r=read_frozen({'png':base64.b64encode(p.read_bytes()).decode(),'region':dict(x=0,y=0,width=im.shape[1],height=im.shape[0]),'includeIcons':False},create_sanctum_ocr_engine())
print(json.dumps(r,ensure_ascii=False))
`,{timeout:60000})
  assert.ok(result.titleTexts.length)
  assert.deepEqual(result.texts,['包含遭诅契约'])
  assert.equal(result.captureMetrics.ocrCalls,1)
  assert.equal(result.titleRegion.height,result.bodyRegion.y)
  const parsed=parseSanctumRoomTexts(result.texts,catalog,[],{...result,floorId:'floor:0'})
  assert.equal(parsed.layout,'guards')
  assert.equal(parsed.nameCandidates.includes('0'),false)
})

test('实机四层合并标题仅在包含当前层时采用共同属性', () => {
  for(const floorId of ['floor:0','floor:1','floor:2','floor:3']) {
    assert.equal(parse('破旧书库、圣物厅、禁域战场、王陵',floorId).layout,'miniboss')
    assert.equal(parse('遗弃的图书馆、破旧的地窖、礼拜堂、地下室',floorId).layout,'exit')
  }
  assert.equal(parse('破旧书库、圣物厅','floor:3').layout,undefined)
  assert.equal(parse('破旧书库、地下室','floor:0').layout,undefined)
})
