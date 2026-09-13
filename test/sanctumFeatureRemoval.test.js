import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { emptySanctumState, createSanctumStrategy, SANCTUM_PRESETS } from '../shared/sanctum.js'
import { SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { initialEffectState, advanceSanctumRoom } from '../shared/sanctumStateEvaluation.js'
import { parse } from '@vue/compiler-sfc'

const removed = ['inventory', 'altar', 'relicCalibrations', 'loadoutPreferences', 'loadouts', 'rewardLedger']
const floor = { identityConfirmed:true, runId:'r', floorId:'f', revision:1, currentRoomId:'a',
  rooms:[{id:'a',column:0,detailsStatus:'matched'}, {id:'b',column:1,detailsStatus:'matched',terminal:true}],
  edges:[{from:'a',to:'b',status:'matched'}] }

for (const preset of ['survival','currency','relic','reveal','quantity']) test(`迁移 ${preset} 配置保留识别和设置，删除旧能力数据与旧路线`, t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'sanctum-migrate-'))
  t.after(() => fs.rmSync(root,{recursive:true,force:true}))
  const repo = new SanctumRepository(root)
  const strategy = {...createSanctumStrategy(),preset,targetPriority:{神圣石:99},weights:{reward:123}}
  const obsolete = Object.fromEntries(removed.map(key=>[key,{old:true}]))
  const observation = {...floor,rewardGroups:[{rewards:[{quantity:10}]}],currentEffects:[{source:'relic',rule:'cannotRecover'}]}
  fs.writeFileSync(repo.file,JSON.stringify({schemaVersion:1,enabled:true,strategy,calibration:{},...obsolete,
    controlOverlayBounds:{x:20,y:30},lastCapture:{floor:observation,...obsolete,runObservation:{resolve:25},currentEffects:observation.currentEffects},
    savedRoute:{floor,recommendation:planSanctumFloor(floor),savedAt:1}}))
  const state = repo.load()
  assert.notEqual(state.status,'error')
  assert.equal(state.enabled,true)
  assert.deepEqual(state.controlOverlayBounds,{x:20,y:30})
  assert.equal(state.floor.rooms.length,2)
  assert.equal(state.runObservation.resolve,25)
  assert.deepEqual(state.currentEffects,[])
  assert.equal(state.persistedRoute,null)
  assert.equal(state.persistedOverlay,null)
  assert.match(state.reason,/采集/)
  for (const key of removed) assert.equal(Object.hasOwn(state,key),false,key)
  const modern = ['reveal','quantity'].includes(preset)
  assert.equal(state.strategy.preset,modern?preset:'reveal')
  assert.deepEqual(state.strategy.targetPriority,modern?{神圣石:99}:createSanctumStrategy().targetPriority)
  assert.equal(state.strategy.weights,undefined)
  repo.saveEffectMemory({})
  const migrated = fs.readFileSync(repo.file,'utf8')
  for (const key of [...removed,'rewardGroups']) assert.equal(migrated.includes(`"${key}"`),false,key)
  assert.equal(repo.load().persistedRoute,null)
  repo.save(state)
  const disk = fs.readFileSync(repo.file,'utf8')
  for (const key of [...removed,'rewardGroups']) assert.equal(disk.includes(`"${key}"`),false,key)
  assert.equal(repo.load().persistedRoute,null)
})

test('两种实战策略忽略旧祭坛与账本，复制效果只说明机制', () => {
  assert.deepEqual(Object.keys(SANCTUM_PRESETS),['reveal','quantity'])
  for (const preset of Object.keys(SANCTUM_PRESETS)) {
    const strategy = createSanctumStrategy(preset)
    const baseline = planSanctumFloor(floor,strategy)
    assert.deepEqual(planSanctumFloor(floor,strategy,{},[{source:'relic',rule:'cannotRecover'}],{
      altar:{confirmed:true,runId:'r',items:[{uniqueId:'unique:The_Hour_of_Divinity',status:'matched'}]},
      rewardLedger:{complete:true,items:[{state:'pending',currency:'神圣石',quantity:100}]}
    }),baseline)
  }
  const result = advanceSanctumRoom(initialEffectState({}),{effects:[{rule:'copyTributes',trigger:'entry',value:2}]})
  assert.equal(result.opportunities.length,0)
  assert.equal(result.unknown.length,0)
  assert.ok(result.conditions.some(text=>text.includes('不评估具体复制收益')))
})

test('页面三个同级页签，旧 IPC 与预加载入口已删除', () => {
  const source = fs.readFileSync('src/domains/sanctum/SanctumView.vue','utf8')
  const {descriptor,errors} = parse(source)
  assert.deepEqual(errors,[])
  assert.deepEqual([...descriptor.template.content.matchAll(/<el-tab-pane label="([^"]+)"/g)].map(m=>m[1]),['楼层规划','路线策略','识别校准'])
  assert.match(source,/function openCalibration\(\) \{ tab.value = 'calibration' \}/)
  const actions = []
  const script = fs.readFileSync('electron/modules/ipc/sanctum.js','utf8')
    .replace("import { ipcMain } from 'electron'",'').replace('export function','function')
  const context = vm.createContext({ipcMain:{handle:name=>actions.push(name)},service:{subscribe:()=>()=>{}},options:{}})
  vm.runInContext(`${script}\nregisterSanctumHandlers(service,options)`,context)
  const preload = fs.readFileSync('electron/preload.cjs','utf8')
  for (const name of ['correctRewardLedger','scanRelics','highlightRelic','solveLoadout','cancelSolve','previewLoadout','saveLoadoutPreferences','saveGridCells','selectSampleCell']) {
    assert.equal(actions.includes(`sanctum:${name}`),false,name)
    assert.equal(preload.includes(`'${name}'`),false,name)
    assert.equal(SanctumService.prototype[name],undefined,name)
  }
  for (const key of removed) assert.equal(Object.hasOwn(emptySanctumState(),key),false,key)
})
