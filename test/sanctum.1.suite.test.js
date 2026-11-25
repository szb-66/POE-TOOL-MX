import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { createHash as _m0_createHash } from 'node:crypto'
import { createLocalizedSanctumCatalog as _m0_createLocalizedSanctumCatalog } from '../electron/modules/sanctum/localization.js'
import { parseSanctumRoomTexts as _m0_parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { parseStatusTooltip as _m0_parseStatusTooltip } from '../electron/modules/sanctum/statusRecognition.js'
import { planSanctumFloor as _m0_planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { createSanctumStrategy as _m0_createSanctumStrategy } from '../shared/sanctum.js'
import { rewardDetail as _m0_rewardDetail } from '../shared/sanctumPresentation.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { withCalibrationGameWindow as _m1_withCalibrationGameWindow } from '../electron/modules/sanctum/calibrationWindow.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { SanctumCapture as _m2_SanctumCapture, validateSanctumEnvironment as _m2_validateSanctumEnvironment } from '../electron/modules/sanctum/capture.js'
import { AutomationLock as _m2_AutomationLock } from '../electron/modules/automation/lock.js'
import { SanctumService as _m2_SanctumService } from '../electron/modules/sanctum/service.js'
import { resourceSummary as _m2_resourceSummary } from '../shared/sanctumPresentation.js'
import { validateRunResources as _m2_validateRunResources } from '../electron/modules/sanctum/runObservation.js'
import { recognizeRoomProfile as _m2_recognizeRoomProfile } from '../shared/sanctumRoomProfiles.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { resolveSanctumCatalogText as _m3_resolveSanctumCatalogText } from '../electron/modules/sanctum/catalog.js'
import { parseSanctumCatalogHtml as _m3_parseSanctumCatalogHtml } from '../scripts/sanctum/catalogParser.js'
import { SEASON_BASELINE as _m3_SEASON_BASELINE } from '../shared/seasonBaseline.js'
import _m3_fs from 'node:fs'
import { parseSanctumRoomTexts as _m3_parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { createSanctumStrategy as _m4_createSanctumStrategy } from '../shared/sanctum.js'
import { planSanctumFloor as _m4_planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { knownRoom as _m4_knownRoom } from '../electron/modules/sanctum/knowledge.js'
import { sanctumOverlaySnapshot as _m4_sanctumOverlaySnapshot } from '../electron/modules/sanctum/overlay.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { sanctumDisplay as _m5_sanctumDisplay, sanctumRoomLabel as _m5_sanctumRoomLabel, sanctumRoomDetail as _m5_sanctumRoomDetail } from '../shared/sanctumDisplay.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import _m6_fs from 'node:fs'
import _m6_os from 'node:os'
import _m6_path from 'node:path'
import { parseEffectTooltip as _m6_parseEffectTooltip } from '../electron/modules/sanctum/effectRecognition.js'
import { parseStatusTooltip as _m6_parseStatusTooltip } from '../electron/modules/sanctum/statusRecognition.js'
import { mergeEffectGroups as _m6_mergeEffectGroups } from '../shared/sanctumEffects.js'
import { SanctumService as _m6_SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository as _m6_SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { observationKey as _m6_observationKey } from '../electron/modules/sanctum/runObservation.js'
import { preservePreviousCapture as _m6_preservePreviousCapture } from '../electron/modules/sanctum/previousCapture.js'
import { catalogEffect as _m6_catalogEffect } from '../electron/modules/sanctum/effectCorrection.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import _m7_fs from 'node:fs'
import _m7_os from 'node:os'
import _m7_path from 'node:path'
import { emptyEffectMemory as _m7_emptyEffectMemory, effectMemoryKey as _m7_effectMemoryKey, rememberEffectRule as _m7_rememberEffectRule, forgetEffectRule as _m7_forgetEffectRule, applyEffectMemory as _m7_applyEffectMemory, effectRuleStatus as _m7_effectRuleStatus, migrateEffectMemory as _m7_migrateEffectMemory } from '../electron/modules/sanctum/effectMemory.js'
import { parseStatusTooltip as _m7_parseStatusTooltip } from '../electron/modules/sanctum/statusRecognition.js'
import { SanctumService as _m7_SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository as _m7_SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { observationKey as _m7_observationKey } from '../electron/modules/sanctum/runObservation.js'
import { rebuildCorrectedScan as _m7_rebuildCorrectedScan } from '../electron/modules/sanctum/effectCorrection.js'
import { resetSanctumRun as _m7_resetSanctumRun } from '../electron/modules/sanctum/state.js'
import { preservePreviousCapture as _m7_preservePreviousCapture } from '../electron/modules/sanctum/previousCapture.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { decideSanctumEffects as _m8_decideSanctumEffects, reuseSanctumEffects as _m8_reuseSanctumEffects, sanctumEffectScan as _m8_sanctumEffectScan } from '../electron/modules/sanctum/effectLedger.js'
import { parseSanctumRoomTexts as _m8_parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { emptyEffectGroups as _m8_emptyEffectGroups } from '../shared/sanctumEffects.js'
import { applySanctumEffects as _m8_applySanctumEffects } from '../shared/sanctum.js'
import { observationKey as _m8_observationKey, currentRunObservation as _m8_currentRunObservation } from '../electron/modules/sanctum/runObservation.js'
import { SEASON_BASELINE as _m8_SEASON_BASELINE } from '../shared/seasonBaseline.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import _m9_fs from 'node:fs'
import _m9_os from 'node:os'
import _m9_path from 'node:path'
import { createPinia as _m9_createPinia, setActivePinia as _m9_setActivePinia } from 'pinia'
import { SanctumService as _m9_SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository as _m9_SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { SanctumCalibrationEditor as _m9_SanctumCalibrationEditor } from '../electron/modules/sanctum/calibration.js'
import { useSanctumStore as _m9_useSanctumStore } from '../src/domains/sanctum/sanctumStore.js'
import { createSanctumStrategy as _m9_createSanctumStrategy } from '../shared/sanctum.js'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import { SanctumEvidenceStore as _m10_SanctumEvidenceStore } from '../electron/modules/sanctum/evidence.js'
import { SanctumService as _m10_SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumCapture as _m10_SanctumCapture } from '../electron/modules/sanctum/capture.js'
import _m11_test from 'node:test'
import _m11_assert from 'node:assert/strict'
import _m11_fs from 'node:fs'
import _m11_os from 'node:os'
import _m11_path from 'node:path'
import _m11_vm from 'node:vm'
import { emptySanctumState as _m11_emptySanctumState, createSanctumStrategy as _m11_createSanctumStrategy, SANCTUM_PRESETS as _m11_SANCTUM_PRESETS } from '../shared/sanctum.js'
import { SanctumRepository as _m11_SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { SanctumService as _m11_SanctumService } from '../electron/modules/sanctum/service.js'
import { planSanctumFloor as _m11_planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { initialEffectState as _m11_initialEffectState, advanceSanctumRoom as _m11_advanceSanctumRoom } from '../shared/sanctumStateEvaluation.js'
import { parse as _m11_parse } from '@vue/compiler-sfc'

// === Merged from internationalSanctumRewards.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const createHash = _m0_createHash
  const createLocalizedSanctumCatalog = _m0_createLocalizedSanctumCatalog
  const parseSanctumRoomTexts = _m0_parseSanctumRoomTexts
  const parseStatusTooltip = _m0_parseStatusTooltip
  const planSanctumFloor = _m0_planSanctumFloor
  const createSanctumStrategy = _m0_createSanctumStrategy
  const rewardDetail = _m0_rewardDetail
const base = JSON.parse(readFileSync(new URL('../electron/assets/sanctum/catalog.international.json',import.meta.url)))
const templates = JSON.parse(readFileSync(new URL('./fixtures/sanctum/reward-client-strings.json',import.meta.url)))
const currency = (id,en,tw,cn) => ({table:'baseitemtypes',id,field:'Name',kind:'dat',en,tw,cn,sourceHash:createHash('sha256').update(en).digest('hex')})
const currencies = [currency('Metadata/Items/Currency/CurrencyRerollRare','Chaos Orb','混沌石','混沌石'),currency('Metadata/Items/Currency/CurrencyModValues','Divine Orb','神聖石','神圣石')]
const catalog = (entries=[...templates,...currencies], revision='active-signed-fixture',data=base) => createLocalizedSanctumCatalog(data,{entriesProvider:()=>entries,revisionProvider:()=>revision})
const timing = id => id.includes('Dungeon')?'run':id.includes('NextFloor')?'next-floor':id.includes('CurrentFloor')?'floor':'immediate'
const render = (entry,locale,name) => entry[locale].replace(/\{(\d+)\}/g,(_,index) => entry.id.includes('Singular') || index==='1' ? name : '4')

test('实际8条ClientStrings奖励模板按英文参数身份解析简繁参数重排和单数量',()=>{
  const data=catalog()
  assert.equal(templates.length,8)
  for (const entry of templates) for (const [locale,name] of [['en','Chaos Orb'],['cn','混沌石'],['tw','混沌石']]) {
    const text=render(entry,locale,name), amount=entry.id.includes('Singular')?1:4
    const parsed=data.parseReward(text)
    assert.equal(parsed.status,'matched',`${entry.id}/${locale}`)
    assert.deepEqual([parsed.quantity,parsed.currency,parsed.timing],[amount,'Chaos Orb',timing(entry.id)])
    const room=parseSanctumRoomTexts([text],data)
    assert.deepEqual(room.rewards,[{groupId:'offer',currency:'Chaos Orb',quantity:amount,timing:timing(entry.id)}])
    const status=parseStatusTooltip({texts:[text],status:'located'},data)
    assert.equal(status.hasRewardContext,true,`${entry.id}/${locale}`)
    assert.equal(status.effectGroup,null,`${entry.id}/${locale}`)
  }
})

test('繁体通货与数量次序独立，折行奖励不误当词缀也不吞掉相邻奖励',()=>{
  const data=catalog(), template=templates.find(entry=>entry.id==='SanctumMultiDungeonReward')
  const text=render(template,'tw','神聖石')
  assert.deepEqual(parseSanctumRoomTexts([text],data).rewards,[{groupId:'offer',currency:'Divine Orb',quantity:4,timing:'run'}])
  const wrapped=['完成聖域時，','獲得','神聖石x4']
  assert.equal(parseStatusTooltip({texts:wrapped,status:'located'},data).effectGroup,null)
  assert.deepEqual(parseSanctumRoomTexts([...wrapped,'Receive 1x Chaos Orb right now'],data).rewards.map(reward=>[reward.currency,reward.quantity,reward.timing]),[['Divine Orb',4,'run'],['Chaos Orb',1,'immediate']])
})

test('未知、歧义通货和无效数量保留缺口，英文也不能省略通货唯一性检查',()=>{
  const template=templates.find(entry=>entry.id==='SanctumMultiDungeonReward')
  for (const [data,text] of [
    [catalog(),render(template,'cn','不存在的通货')],
    [catalog(),render(template,'en','Unknown Currency')],
    [catalog([...templates,...currencies,currency('conflict','Divine Orb','混沌石','混沌石')]),render(template,'cn','混沌石')],
    [catalog([...templates,...currencies],'active',{...base,entries:[...base.entries,{...base.entries.find(entry=>entry.name==='Chaos Orb'),id:'duplicate-chaos'}]}),render(template,'en','Chaos Orb')],
    [catalog(),render(template,'en','Chaos Orb').replace('4x','9999999x')],
    [catalog(),render(template,'en','Chaos Orb').replace('4x','0x')]
  ]) {
    assert.equal(data.parseReward(text)?.status,'unknown',text)
    const room=parseSanctumRoomTexts([text],data)
    assert.equal(room.rewards.length,0,text)
    assert.equal(room.calculationStatus,'unsupported',text)
    const status=parseStatusTooltip({texts:[text],status:'located'},data)
    assert.equal(status.hasRewardContext,false,text)
    assert.equal(status.effectGroup.complete,false,text)
  }
})

test('错误稳定ID、原文哈希、字段、缺少参数或候选资源不能启用翻译模板',()=>{
  const template=templates.find(entry=>entry.id==='SanctumMultiDungeonReward'), text=render(template,'tw','混沌石')
  for (const source of [{...template,id:'UnrelatedText'},{...template,sourceHash:'0'.repeat(64)},{...template,field:'XBoxText'},{...template,tw:'完成聖域時，獲得 {0}x{0}'}]) {
    const data=catalog([...templates.filter(entry=>entry.id!==template.id),source,...currencies])
    assert.equal(data.parseReward(text),null)
    assert.equal(parseSanctumRoomTexts([text],data).rewards.length,0)
    assert.equal(parseStatusTooltip({texts:[text],status:'located'},data).hasRewardContext,false)
  }
  let revision='active'
  const data=createLocalizedSanctumCatalog(base,{entriesProvider:()=>[...templates,...currencies],revisionProvider:()=>revision})
  assert.equal(data.parseReward(text).status,'matched')
  revision=''
  assert.equal(data.parseReward(text),null)
  assert.equal(parseStatusTooltip({texts:[text],status:'located'},data).hasRewardContext,false)
  assert.equal(data.parseReward('Receive 4x Chaos Orb on completing the Sanctum').status,'matched')
})

test('下一楼层领取独立展示并进入路线缺口，不被当作本层已兑现奖励',()=>{
  const data=catalog(),template=templates.find(entry=>entry.id==='SanctumMultiNextFloorReward')
  const room={id:'reward',column:1,row:0,revealed:true,status:'matched',layout:'exit',terminal:true,...parseSanctumRoomTexts([render(template,'cn','混沌石')],data)}
  assert.equal(room.rewards[0].timing,'next-floor')
  assert.match(rewardDetail(room.rewards[0]),/下一楼层结束/)
  const floor={identityConfirmed:true,runId:'r',floorId:'floor:0',mapKey:'map',currentRoomId:'start',positionStatus:'confirmed',rooms:[{id:'start',column:0,row:0},room],edges:[{from:'start',to:'reward',status:'matched'}]}
  const strategy=createSanctumStrategy();strategy.targetPriority={'Chaos Orb':1}
  const plan=planSanctumFloor(floor,strategy)
  assert.equal(plan.optimal,false)
  assert.ok(JSON.stringify(plan).includes('下一楼层结束时领取'))
})

test('国际服旧英文兼容正则不能绕过模板、数量边界和通货身份校验',()=>{
  const data=catalog()
  for (const text of ['Receive 4 Chaos-Orb on completing the Sanctum','Receive 0 Chaos Orb on completing the Sanctum',
    'Gain 999999999 Chaos Orb on completing the Sanctum','Receive 4 Chaos Orb on completing the Sanctum',
    'Gain 4 Chaos Orb','On Sanctum Completion Receive 4 Unknown Currency']) {
    const room=parseSanctumRoomTexts([text],data)
    assert.equal(room.rewards.length,0,text)
    assert.equal(room.calculationStatus,'unsupported',text)
    assert.notEqual(room.detailsStatus,'matched',text)
    const status=parseStatusTooltip({texts:[text],status:'located'},data)
    assert.equal(status.hasRewardContext,false,text)
    assert.equal(status.effectGroup.complete,false,text)
  }
  const effect=parseStatusTooltip({texts:['Gain +40 Maximum Resolve each time you use a Fountain'],status:'located'},data)
  assert.equal(effect.effectGroup.complete,true)
  assert.equal(effect.effectGroup.effects[0].rule,'fountainMaxResolve')
})
})()

// === Merged from sanctumCalibrationWindow.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const withCalibrationGameWindow = _m1_withCalibrationGameWindow
function fixture({ activationFails = false, minimizeFails = false } = {}) {
  const calls = []
  let minimized = false
  const main = { isDestroyed:()=>false, isMinimized:()=>minimized,
    restore:()=>{calls.push('restore');minimized=false}, show:()=>calls.push('show'),
    hide:()=>{throw new Error('不得隐藏任务栏入口')} }
  return { calls, options: { getMainWindow:()=>main,
    minimizeMainWindow:async()=>{calls.push('minimize');minimized=true;return !minimizeFails},
    activation:{activateGame:async()=>{calls.push('activateGame');return {success:!activationFails,code:'missing'}},
      gameFailureMessage:()=> '未找到游戏窗口', activateMain:async()=>{calls.push('activateMain');return {success:true}}} } }
}
test('截图前主动激活游戏，截图后恢复助手，任务栏入口不隐藏',async()=>{
  const f=fixture()
  assert.equal(await withCalibrationGameWindow(f.options,async()=>{f.calls.push('capture');return 'frame'}),'frame')
  assert.deepEqual(f.calls,['minimize','activateGame','capture','restore','show','activateMain'])
})
test('游戏激活失败或最小化失败仍恢复助手且不截图',async()=>{
  for(const options of [{activationFails:true},{minimizeFails:true}]){
    const f=fixture(options)
    await assert.rejects(withCalibrationGameWindow(f.options,async()=>{throw new Error('不应截图')}),/游戏窗口|最小化/)
    assert.deepEqual(f.calls.slice(-3),['restore','show','activateMain'])
    assert.equal(f.calls.includes('capture'),false)
  }
})
test('截图异常或取消时恢复窗口后再报告失败',async()=>{
  const f=fixture()
  await assert.rejects(withCalibrationGameWindow(f.options,async()=>{throw new Error('采集取消')}),/采集取消/)
  assert.deepEqual(f.calls.slice(-3),['restore','show','activateMain'])
})
})()

// === Merged from sanctumCapture.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const SanctumCapture = _m2_SanctumCapture
  const validateSanctumEnvironment = _m2_validateSanctumEnvironment
  const AutomationLock = _m2_AutomationLock
  const SanctumService = _m2_SanctumService
  const resourceSummary = _m2_resourceSummary
  const validateRunResources = _m2_validateRunResources
  const recognizeRoomProfile = _m2_recognizeRoomProfile
const environment = { windowId: 'game', width: 1920, height: 1080, dpi: 96 }
const safety = () => ({ foreground: true, userTakeover: false, mapOpen: true, interfaceMatched: true, overlayExcluded: true, environment: { ...environment } })
const room = (id, detailFingerprint = 'one') => ({ id, revealed: true, detailFingerprint, column: id === 'a' ? 0 : 1 })
const frame = (timestamp, fingerprint = 'map', rooms = [room('a')], floorId = 'f') => ({ ...safety(), timestamp, fingerprint,
  floor: { identityConfirmed: true, runId: 'r', floorId, currentRoomId: 'a', rooms, edges: [] } })
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }

test('已确认进度跳过当前及过去列，初始或位置未知不跳过；同层重启按逻辑房间复用已读结果', async () => {
  const f = frame(0, 'map', [room('a'), room('b'), { ...room('c'), column: 2 }])
  f.floor.positionStatus = 'confirmed'
  f.floor.currentRoomId = 'b'
  const item = fixture([f])
  await item.capture.run(environment, () => {})
  assert.deepEqual(item.data.inputs, ['c'])
  await item.capture.run(environment, () => {})
  assert.deepEqual(item.data.inputs, ['c'])
  f.floor.positionStatus = 'unknown'
  await item.capture.run(environment, () => {})
  assert.deepEqual(item.data.inputs, ['c', 'a', 'b'])
  f.floor.runId = 'new-run'
  f.floor.positionStatus = 'initial'; f.floor.initialSelection = true
  await item.capture.run(environment, () => {})
  assert.deepEqual(item.data.inputs, ['c', 'a', 'b', 'a', 'b', 'c'])
})

test('停止再开始重读失败详情，不把失败缓存当作完成', async () => {
  const item = fixture([frame(0)])
  let calls = 0
  item.driver.hover = async () => { calls++; return { patch: { detailsStatus: calls === 1 ? 'failed' : 'matched' } } }
  await item.capture.run(environment, () => {})
  assert.equal(calls, 1)
  await item.capture.run(environment, () => {})
  assert.equal(calls, 2)
})

test('重启复用逻辑房间，不检查图片指纹；位置身份不同才重新读取', async () => {
  const f = frame(0)
  f.floor.rooms[0].resumeFingerprint = 'old-art'
  const item = fixture([f])
  await item.capture.run(environment, () => {})
  f.floor.rooms[0].resumeFingerprint = 'new-art'
  await item.capture.run(environment, () => {})
  f.floor.rooms[0].column = 3
  await item.capture.run(environment, () => {})
  assert.deepEqual(item.data.inputs, ['a','a'])
})
function fixture(frames) {
  let listener
  const data = { safety: safety(), inputs: [], disposed: false }
  const driver = {
    inspect: () => ({ mapFingerprint: data.current?.fingerprint, ...data.safety }),
    subscribeSafety(callback) { listener = callback; return () => { data.disposed = true; listener = null } },
    async *frames() { for (const value of frames) { data.current = value; yield value } },
    async hover(room, { guard }) { guard(); data.inputs.push(room.id); return { mapFingerprint: data.current.fingerprint,
      patch: { name: room.detailFingerprint, detailsStatus: 'matched', id: 'forged', column: 99 } } }
  }
  const lock = new AutomationLock()
  return { data, driver, lock, notify: value => { data.safety = value; listener?.(value) }, capture: new SanctumCapture({ driver, automationLock: lock }) }
}

test('采集结果保留独立玩法、陷阱、偏好与来源并绑定当前地图', async () => {
  const f=frame(0),item=fixture([f])
  f.floor.floorId='floor:0';f.floor.mapKey='profile-map'
  const profile=recognizeRoomProfile(['圣光试炼'],'floor:0')
  item.driver.hover=async()=>({patch:{...profile,detailsStatus:'matched',knowledge:Object.fromEntries(
    ['layout','traps','layoutPreferenceKey','roomProfile'].map(key=>[key,{status:'known',source:'observed'}]))}})
  const outputs=[]
  await item.capture.run(environment,value=>outputs.push(value))
  const saved=outputs.at(-1).rooms[0]
  assert.equal(saved.layout,'exit');assert.equal(saved.layoutPreferenceKey,'trap')
  assert.deepEqual(saved.traps,['lightning-floor'])
  assert.deepEqual(saved.roomProfile,profile.roomProfile)
  assert.equal(saved.knowledge.traps.mapKey,outputs.at(-1).mapKey)
})

test('完整采集经服务传递资源至页面：零值、部分未知、空结果、过期绑定和效果复用', async t => {
  for (const mode of ['complete','partial','empty','stale','reuse']) {
    const f=frame(0),item=fixture([f])
    const service=new SanctumService({captureDriver:item.driver,automationLock:item.lock})
    t.after(()=>service.shutdown())
    service.setEnabled(true)
    service.state.runObservation=validateRunResources({resolve:99,maxResolve:300,inspiration:50,coins:999},f.floor)
    let returned
    item.driver.finalizeFloor=async value=>{
      returned=mode==='empty'?null:{...validateRunResources({resolve:416,maxResolve:418,inspiration:0,coins:mode==='partial'?null:270},value,'observed'),
        ...(mode==='partial'?{reason:'金币读取失败'}:{})}
      if(mode==='stale') returned.key='other-position'
      return {...value,runObservation:returned,currentEffects:[],effectScan:{complete:true,updateMode:mode==='reuse'?'reuse':'scan'}}
    }
    await service.startCapture(environment)
    const state=service.getState(),summary=resourceSummary(state)
    assert.deepEqual(state.floor.runObservation,returned,mode)
    const unknown=['empty','stale'].includes(mode)
    assert.deepEqual([summary.resolve,summary.maxResolve,summary.inspiration,summary.coins],
      unknown?[null,null,null,null]:[416,418,0,mode==='partial'?null:270],mode)
    if(mode==='partial')assert.equal(state.runObservation.reason,'金币读取失败')
    if(unknown)assert.equal(state.runObservation,null)
  }
})

test('合并资源保留最终阶段并发完成的房间详情', async () => {
  const item=fixture([frame(0)]),pending=deferred(),committed=deferred()
  item.driver.captureRoom=async()=>({recognition:pending.promise})
  item.driver.finalizeFloor=async value=>{
    const earlier=structuredClone(value)
    pending.resolve({patch:{detailsStatus:'matched',name:'异步识别完成',rawText:'新正文'}})
    await committed.promise
    return {...earlier,runObservation:validateRunResources({inspiration:0,coins:270},value,'observed'),effectScan:{complete:true}}
  }
  let last
  await item.capture.run(environment,value=>{
    last=value
    if(value.rooms[0].name==='异步识别完成')committed.resolve()
  })
  assert.equal(last.rooms[0].name,'异步识别完成')
  assert.equal(last.rooms[0].rawText,'新正文')
  assert.equal(last.runObservation.inspiration,0)
})

test('隐藏房间的 OCR 不能建立历史知识，真正揭示后必须重新读取',async()=>{
  const f=frame(0),item=fixture([f]);f.floor.mapKey='map'
  Object.assign(f.floor.rooms[0],{revealed:false,revealStatus:'unknown'})
  let reads=0,latest
  item.driver.hover=async()=>{reads++;return {patch:{detailsStatus:'matched',rewards:[{currency:'神圣石',quantity:999,timing:'run'}],knowledge:{rewards:{status:'known',source:'observed'}}}}}
  await item.capture.run(environment,value=>{latest=value})
  assert.equal(latest.rooms[0].knowledge.rewards.status,'unrevealed')
  assert.equal(latest.rooms[0].knowledge.rewards.mapKey,undefined)
  f.floor.rooms[0].revealed=true
  await item.capture.run(environment,value=>{latest=value})
  assert.equal(reads,2)
  assert.equal(latest.rooms[0].knowledge.rewards.status,'known')
  assert.equal(latest.rooms[0].knowledge.rewards.mapKey,'map')
})

test('过滤发生在悬停前，保留图结构与正确进度；后续帧不得追加本轮队列', async () => {
  const f = frame(0, 'map', ['a','b','c','d'].map((id,column) => ({ ...room(id), column, contentStatus:'present' })))
  Object.assign(f.floor, { positionStatus:'confirmed', currentRoomId:'a' })
  f.floor.rooms[1].contentStatus = 'empty'
  f.floor.edges = [{from:'a',to:'b',status:'matched',availability:'gold',traversal:'available'},
    {from:'b',to:'c',status:'matched',availability:'unavailable',traversal:'unavailable'}]
  const later = structuredClone(f)
  later.floor.rooms[1].contentStatus = 'present'
  Object.assign(later.floor.edges[1], { availability:'gold',traversal:'available' })
  const item = fixture([f,later]), outputs=[]
  await item.capture.run(environment, value => outputs.push(value))
  assert.deepEqual(item.data.inputs, ['d'])
  const maps = outputs.filter(value => value.captureProgress.stage === 'map')
  assert.deepEqual(maps.map(value => value.captureProgress.total), [1])
  assert.ok(outputs.every(value => value.rooms.length === 4 && value.edges.length === 2))
  assert.equal(maps[0].rooms[1].captureSkipReason, 'empty')
})

test('窗口和 DPI 缺失、尺寸非法时拒绝预检', () => {
  for (const patch of [{ dpi: null }, { dpi: NaN }, { width: -1 }, { height: 2.5 }, { windowId: '' }]) {
    assert.throws(() => validateSanctumEnvironment({ ...environment, ...patch }), /未确认/)
  }
  assert.deepEqual(validateSanctumEnvironment({ ...environment, extra: true }), environment)
})

test('等待原生悬停期间失锁立即取消，迟到结果不能发布或释放新所有者', async () => {
  const item = fixture([frame(0), frame(300)]), entered = deferred(), pending = deferred()
  let signal
  item.driver.hover = async (_room, options) => { signal = options.signal; entered.resolve(); return pending.promise }
  const floors = []
  const task = item.capture.run(environment, value => { if (value) floors.push(value) })
  const rejected = assert.rejects(task, /锁已失效/)
  await entered.promise
  item.lock.release(item.lock.getState().owner)
  assert.equal(signal.aborted, true)
  item.lock.acquire('other')
  pending.resolve({ mapFingerprint: 'map', patch: { name: 'late' } })
  await rejected
  assert.equal(floors.length, 2)
  assert.equal(floors[0].captureProgress.stage, 'map')
  assert.equal(floors[0].rooms[0].name, undefined)
  assert.equal(item.lock.getState().owner, 'other')
  assert.equal(item.lock.listeners.size, 0)
})

test('立即显示地图并悬停，相同内容不重复输入，后续地图变化不追加采集', async () => {
  const { capture, data, lock } = fixture([frame(0), frame(100), frame(300), frame(600),
    frame(700, 'changed', [room('a'), room('b')]), frame(1000, 'changed', [room('a'), room('b')]),
    frame(1100, 'changed-again', [room('a', 'two'), room('b')]), frame(1400, 'changed-again', [room('a', 'two'), room('b')])])
  const results = []
  await capture.run(environment, value => results.push(value))
  assert.deepEqual(data.inputs, ['a'])
  assert.equal(results.at(-1).rooms[0].name, 'one')
  assert.equal(results.at(-1).rooms[0].id, 'a')
  assert.equal(results.at(-1).rooms[0].column, 0)
  assert.equal(lock.getState().locked, false)
  assert.equal(data.disposed, true)
})

test('动画与时间戳不阻塞，未知楼层及跨层清除详情缓存', async () => {
  const unknown = frame(500); unknown.floor.identityConfirmed = false
  const { capture, data } = fixture([frame(0), frame(300), unknown, frame(600), frame(600), frame(700, 'moving'),
    frame(800, 'map', [room('a')], 'next'), frame(1100, 'map', [room('a')], 'next')])
  const results = []
  await capture.run(environment, value => results.push(value))
  assert.deepEqual(data.inputs, ['a'])
  assert.ok(results.every(value => value?.identityConfirmed === true))
  assert.equal(results.at(-1).floorId, 'f')
})

test('前台、接管、地图、锚点、截图排除和环境变化全部禁止输入', async () => {
  for (const patch of [{ foreground: false }, { userTakeover: true }, { userTakeover: undefined }, { mapOpen: false },
    { interfaceMatched: false }, { overlayExcluded: false }, { environment: { ...environment, dpi: 144 } },
    { environment: { ...environment, windowId: 'other' } }, { environment: { ...environment, width: 1280 } }]) {
    const { capture, data, lock } = fixture([frame(0), frame(300)])
    data.safety = { ...safety(), ...patch }
    await assert.rejects(capture.run(environment, () => {}))
    assert.deepEqual(data.inputs, [])
    assert.equal(lock.getState().locked, false)
  }
})

test('锁冲突不输入、不释放其他任务的锁；锁失效后不得继续悬停', async () => {
  const blocked = fixture([frame(0), frame(300)])
  blocked.lock.acquire('craft')
  await assert.rejects(blocked.capture.run(environment, () => {}), /另一项自动化/)
  assert.deepEqual(blocked.data.inputs, [])
  assert.equal(blocked.lock.getState().owner, 'craft')
  const lost = fixture([frame(0), frame(300)])
  lost.driver.hover = async (_room, { guard }) => {
    lost.lock.release(lost.lock.getState().owner)
    lost.lock.acquire('craft')
    guard()
  }
  await assert.rejects(lost.capture.run(environment, () => {}), /锁已失效/)
  assert.equal(lost.lock.getState().owner, 'craft')
})

test('悬停中用户接管立即取消，迟到结果不发布且不自动恢复', async () => {
  const item = fixture([frame(0), frame(300), frame(600)])
  const entered = deferred(), pending = deferred(), results = []
  let signal
  item.driver.hover = async (_room, options) => { options.guard(); signal = options.signal; entered.resolve(); return pending.promise }
  const run = item.capture.run(environment, value => results.push(value))
  await entered.promise
  item.notify({ ...safety(), userTakeover: true })
  assert.equal(signal.aborted, true)
  assert.equal(item.lock.getState().locked, true)
  await assert.rejects(item.capture.run(environment, () => {}), /正在退出/)
  item.notify(safety())
  pending.resolve({ mapFingerprint: 'map', patch: { name: 'late' } })
  await assert.rejects(run, /接管/)
  assert.equal(results.length, 2)
  assert.equal(results[0].rooms[0].name, undefined)
  assert.equal(item.lock.getState().locked, false)
  assert.equal(item.capture.session, null)
})

test('每次物理输入重新预检，悬停期间地图改变时丢弃详情', async () => {
  const changed = fixture([frame(0), frame(300)])
  changed.driver.hover = async (_room, { guard }) => {
    changed.data.safety = { ...safety(), foreground: false }
    guard()
    assert.fail('不应产生输入')
  }
  const interrupted = []
  assert.equal(await changed.capture.run(environment, value => interrupted.push(value)), 'partial')
  assert.match(interrupted.at(-1).rooms[0].failureReason, /前台/)
  const moved = fixture([frame(0)])
  moved.driver.hover = async () => ({ targetChanged: true, patch: { name: 'wrong' } })
  const results = []
  await moved.capture.run(environment, value => results.push(value))
  assert.equal(results.at(-1).rooms[0].name, undefined)
  assert.equal(results.at(-1).rooms[0].detailsStatus, 'unknown')

})

test('服务 End、禁用和退出均取消采集；锁等待输入退出后释放，迟到结果无效', async () => {
  for (const action of ['emergencyStop', 'disable', 'shutdown']) {
    const item = fixture([frame(0), frame(300)])
    const entered = deferred(), pending = deferred()
    let signal
    item.driver.hover = async (_room, options) => { signal = options.signal; entered.resolve(); return pending.promise }
    const service = new SanctumService({ captureDriver: item.driver, automationLock: item.lock })
    service.setEnabled(true)
    const run = service.startCapture(environment)
    await entered.promise
    const cleanup = action === 'shutdown' ? service.shutdown() : action === 'disable' ? service.setEnabled(false) : service.emergencyStop()
    assert.equal(signal.aborted, true)
    assert.equal(service.getState().running, false)
    assert.equal(service.getState().recommendation, null)
    assert.equal(item.lock.getState().locked, true)
    pending.resolve({ mapFingerprint: 'map', patch: { name: 'late' } })
    await run; await cleanup
    assert.equal(service.getState().floor.identityConfirmed, false)
    assert.equal(item.lock.getState().locked, false)
    assert.equal(item.data.disposed, true)
    if (action !== 'shutdown') await service.shutdown()
  }
})

test('缺少实机驱动时服务不开放采集，离线回放不占用自动化锁', async () => {
  const lock = new AutomationLock()
  lock.acquire('craft')
  const service = new SanctumService({ automationLock: lock, replay: async () => frame(0).floor })
  service.setEnabled(true)
  assert.equal(service.getState().liveCaptureAvailable, false)
  await assert.rejects(service.startCapture(environment), /尚未启用/)
  await service.rescan('sample')
  assert.equal(lock.getState().owner, 'craft')
  await service.shutdown()
})

test('自然结束保留结果及可执行推荐，不停留采集中', async () => {
  const item = fixture([])
  const service = new SanctumService({ captureDriver: item.driver, automationLock: item.lock })
  service.setEnabled(true)
  item.driver.frames = async function *() {
    for (const value of [frame(0), frame(300), frame(400, 'new'), frame(700, 'new')]) {
      item.data.current = value
      yield value
      if (value.timestamp === 300) service.setMarks({ targets: ['a'], avoid: [] })
      if (value.timestamp === 400) {
        assert.ok(service.getState().recommendation)
        assert.equal(service.getState().floor.rooms[0].name, 'one')
      }
      if (value.timestamp === 700) assert.deepEqual(service.getState().marks.targets, ['a'])
    }
  }
  await service.startCapture(environment)
  assert.equal(service.getState().floor.identityConfirmed, true)
  assert.equal(service.getState().running, false)
  assert.equal(service.getState().status, 'ready')
  assert.ok(service.getState().recommendation)
  assert.deepEqual(item.data.inputs, ['a'])
  await service.shutdown()
})
})()

// === Merged from sanctumCatalog.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const resolveSanctumCatalogText = _m3_resolveSanctumCatalogText
  const parseSanctumCatalogHtml = _m3_parseSanctumCatalogHtml
  const SEASON_BASELINE = _m3_SEASON_BASELINE
  const fs = _m3_fs
  const parseSanctumRoomTexts = _m3_parseSanctumRoomTexts
function catalog() {
  return { schemaVersion: 1, game: 'poe1', patch: SEASON_BASELINE.patch, sources: [{ id: 'source', channel: 'official' }],
    entries: [{ id: 'effect', name: '测试痛苦', aliases: ['测试别名'], kind: 'affliction', sourceId: 'source',
      applicability: 'current', reviewedPatch: SEASON_BASELINE.patch, descriptions: ['不能恢复坚毅', '尚未支持的规则'] }] }
}
test('目录精确别名匹配，支持的限制与计算缺口分开', () => {
  const result = resolveSanctumCatalogText(catalog(), 'affliction', '测试别名')
  assert.equal(result.status, 'matched')
  assert.equal(result.effects[0].rule, 'cannotRecover')
  assert.equal(result.effects[1].status, 'unknown')
  assert.equal(result.scoringComplete, false)
  assert.equal(resolveSanctumCatalogText(catalog(), 'affliction', '测试别各').status, 'unknown')
})
test('歧义、历史、PTR、未核对及错误赛季均不参与当前规则', () => {
  const data = catalog()
  data.entries.push({ ...data.entries[0], id: 'another' })
  assert.equal(resolveSanctumCatalogText(data, 'affliction', '测试别名').reason, 'AMBIGUOUS')
  for (const applicability of ['historical', 'ptr', 'unverified']) {
    const data = catalog(); data.entries[0].applicability = applicability
    assert.equal(resolveSanctumCatalogText(data, 'affliction', '测试别名').status, 'unknown')
  }
  const ptr = catalog(); ptr.sources[0].channel = 'ptr'
  assert.equal(resolveSanctumCatalogText(ptr, 'affliction', '测试别名').status, 'unknown')
  const old = catalog(); old.patch = '3.20'
  assert.equal(resolveSanctumCatalogText(old, 'affliction', '测试别名').reason, 'CATALOG_VERSION_MISMATCH')
})
test('刷新只提取数据表且全部待核对，不混入社区历史章节', () => {
  const cards = ['恩赐', 'Affliction', 'Rooms'].map(id => `<section id="${id}"><div class="flex-grow-1">测试${id}<div class="explicitMod">效果</div></div></section>`).join('')
  const html = `${cards}<section id="Rewards"><table><tbody><tr><td>奖励</td></tr></tbody></table></section><div id="markContent"><div class="flex-grow-1">历史效果</div></div>`
  const result = parseSanctumCatalogHtml(html, { fetchedAt: '2026-09-09T00:00:00Z' })
  assert.equal(result.entries.length, 4)
  assert.ok(result.entries.every(entry => entry.applicability === 'unverified'))
  assert.equal(result.sources[0].sha256.length, 64)
  assert.throws(() => parseSanctumCatalogHtml('<html>维护中</html>', { fetchedAt: '2026-09-09T00:00:00Z' }), /结构不完整/)
})

test('同图标同内容跨层重复合并，不同层数变体保留独立标识及名称歧义', () => {
  const card = (name, description) => `<div><img alt="shared"><div class="flex-grow-1">${name}<div class="explicitMod">${description}</div></div></div>`
  const html = `<section id="Rooms">${card('喷泉', '包含喷泉').repeat(4)}</section>
    <section id="恩赐">${card('多层效果', '一层')}${card('多层效果', '两层')}</section>
    <section id="Affliction">${card('痛苦', '效果')}</section>
    <section id="Rewards"><table><tbody><tr><td>奖励</td></tr></tbody></table></section>`
  const result = parseSanctumCatalogHtml(html, { fetchedAt: '2026-09-09T00:00:00Z' })
  assert.equal(result.entries.filter(entry => entry.kind === 'room').length, 1)
  const variants = result.entries.filter(entry => entry.kind === 'boon')
  assert.equal(variants.length, 2)
  assert.notEqual(variants[0].id, variants[1].id)
  assert.equal(resolveSanctumCatalogText(result, 'boon', '多层效果').reason, 'AMBIGUOUS')
})

test('发布目录标识唯一，审核后的公共房间名称与包含描述都能确认类型', () => {
  const data = JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json', import.meta.url)))
  assert.equal(new Set(data.entries.map(entry => entry.id)).size, data.entries.length)
  assert.equal(resolveSanctumCatalogText(data, 'room', '喷泉').status, 'matched')
  for (const text of ['喷泉', '包含喷泉']) {
    const parsed = parseSanctumRoomTexts([text, '恢复 25 点坚毅'], data)
    assert.equal(parsed.type, 'fountain')
    assert.equal(parsed.recovery, 25)
  }
  const conflict = parseSanctumRoomTexts(['包含喷泉', '包含商人'], data)
  assert.equal(conflict.type, undefined)
  assert.equal(conflict.detailsStatus, 'partial')
  assert.equal(resolveSanctumCatalogText(data, 'room', '烛火礼拜堂').reason, 'AMBIGUOUS')
})
})()

// === Merged from sanctumConfirmation.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const createSanctumStrategy = _m4_createSanctumStrategy
  const planSanctumFloor = _m4_planSanctumFloor
  const knownRoom = _m4_knownRoom
  const sanctumOverlaySnapshot = _m4_sanctumOverlaySnapshot
function fixture() {
  return { identityConfirmed: true, runId: 'r', floorId: 'f', revision: 1, mapKey: 'map', currentRoomId: 's',
    rooms: ['s', 'a', 'u', 'z'].map((id, column) => ({ id, column, status: 'matched', revealed: column !== 2,
      detailsStatus: column === 2 ? 'unknown' : 'matched', terminal: id === 'z' })),
    edges: [['s','a'],['a','u'],['u','z']].map(([from,to]) => ({ from, to, status: 'matched' })) }
}

for (const preset of ['reveal', 'quantity']) {
  const plan = (floor, marks = {}, effects = []) => planSanctumFloor(floor, createSanctumStrategy(preset), marks, effects)

  test(`${preset}: 未揭示边界和远处目标只作普通说明，硬约束不变`, () => {
    const f = fixture(), result = plan(f, { targets: ['z'] })
    assert.deepEqual(result.unknown, [])
    assert.deepEqual(result.paths[0].unknown, [])
    assert.deepEqual(result.paths[0].rooms, ['s', 'a'])
    assert.equal(result.status, 'partial')
    assert.equal(result.paths[0].complete, false)
    assert.match(result.reason, /按当前可见信息推荐，路线止于已知部分/)
    assert.match(result.reason, /目标 z.*尚未达成/)
    assert.doesNotMatch(result.reason, /请先识别房间|待确认/)
    assert.deepEqual(plan(f, { targets: ['z'], avoid: ['u'] }).paths, [])
  })

  test(`${preset}: 无下一房时区分机制限制与读取失败，初始选房一致`, () => {
    for (const initial of [false, true]) {
      const f = fixture()
      if (initial) { f.initialSelection = true; f.currentRoomId = null; f.startRoomIds = ['a'] }
      Object.assign(f.rooms[1], { revealed: false, detailsStatus: 'unknown' })
      let result = plan(f)
      assert.deepEqual(result.paths, [])
      assert.deepEqual(result.unknown, [])
      assert.match(result.reason, /游戏揭示/)
      assert.doesNotMatch(result.reason, /先识别房间/)
      for (const status of ['failed', 'partial', 'unknown', 'reading']) {
        Object.assign(f.rooms[1], { revealed: true, detailsStatus: status, failureReason: '可见文字歧义' })
        result = plan(f)
        assert.deepEqual(result.paths, [])
        assert.match(result.reason, /先识别房间/)
        assert.ok(result.unknown.includes('a：可见文字歧义'))
      }
    }
  })

  test(`${preset}: 隐藏各字段保留普通说明与部分状态，无待确认`, () => {
    for (const rule of ['roomsHidden', 'rewardsHidden', 'afflictionsHidden', 'typesHidden']) {
      const f = fixture()
      f.rooms[2].revealed = true; f.rooms[2].detailsStatus = 'matched'
      const result = plan(f, {}, [{ rule, status: 'matched' }])
      assert.deepEqual(result.unknown, [], rule)
      assert.equal(result.status, 'partial', rule)
      assert.match(result.reason, /被效果隐藏/)
    }
  })

  test(`${preset}: 隐藏奖励不掩盖可见痛苦失败或歧义`, () => {
    const f = fixture()
    f.rooms[1].knowledge = { rewards: { status: 'hidden' }, afflictions: { status: 'failed' } }
    const result = plan(f)
    assert.ok(result.unknown.includes('a：痛苦未读全'))
    assert.ok(!result.unknown.some(text => /隐藏|未揭示/.test(text)))
    assert.match(result.reason, /a：奖励被效果隐藏/)
  })

  test(`${preset}: 游戏未展示奖励字段独立于另一字段读取错误`, () => {
    const f = fixture(), reward = { currency: '神圣石', quantity: null, timing: null,
      quantityStatus: 'not-shown', timingStatus: 'not-shown' }
    f.rooms[1].rewards = [reward]
    assert.deepEqual(plan(f).unknown, [])
    reward.timingStatus = 'failed'
    assert.ok(plan(f).unknown.some(text => text.includes('领取时机未读取')))
    reward.timingStatus = 'not-shown'; reward.quantityStatus = 'failed'
    assert.ok(plan(f).unknown.some(text => text.includes('数量未读取')))
    assert.equal(plan(f).paths[0].breakdown[0].parts.reward, 0)
  })

  test(`${preset}: 可见读取失败与未揭示并存，只保留真实缺口`, () => {
    const f = fixture()
    f.rooms.push({ id: 'v', column: 2, revealed: true, detailsStatus: 'failed', failureReason: '正文读取失败' })
    f.edges.push({ from: 'a', to: 'v', status: 'matched' })
    const result = plan(f)
    assert.deepEqual(result.unknown, ['v：正文读取失败'])
    assert.deepEqual(result.paths[0].rooms, ['s', 'a'])
    const targeted = plan(f, { targets: ['z'] })
    assert.deepEqual(targeted.unknown, ['v：正文读取失败'])
    assert.match(targeted.reason, /目标 z.*尚未达成/)
  })
}

test('未揭示覆盖旧失败状态，历史与人工已知事实仍按原规则有效', () => {
  const f = fixture(), room = f.rooms[2]
  room.knowledge = { rewards: { status: 'failed' } }
  assert.deepEqual(knownRoom(room, f).missing, [])
  room.knowledge.rewards = { status: 'known', source: 'observed', mapKey: f.mapKey }
  room.rewards = [{ currency: '神圣石', quantity: 2 }]
  assert.equal(knownRoom(room, f).rewards[0].quantity, 2)
  assert.equal(knownRoom(room, { ...f, rerolled: true }).rewards, undefined)
})

test('路线浮窗直接复用规划说明和真实缺口，无机制待确认', () => {
  const floor = fixture()
  floor.width = 800; floor.height = 300
  floor.rooms.forEach(room => Object.assign(room, { x: room.column * 150, y: 80, width: 70, height: 40 }))
  const state = { enabled: true, foreground: true, running: true, floor, marks: { targets: [], avoid: [] },
    observation: { foreground: true, interfaceMatched: true, receivedAt: 100,
      mapOpen: true, clientBounds: { x: 0, y: 0, width: 800, height: 300 }, mapRegion: { x: 0, y: 0, width: 800, height: 300 } } }
  state.recommendation = planSanctumFloor(floor)
  let snapshot = sanctumOverlaySnapshot(state, 100)
  assert.deepEqual(snapshot.unknown, [])
  assert.equal(snapshot.reason, state.recommendation.reason)
  Object.assign(floor.rooms[2], { revealed: true, detailsStatus: 'failed' })
  state.recommendation = planSanctumFloor(floor)
  snapshot = sanctumOverlaySnapshot(state, 100)
  assert.deepEqual(snapshot.unknown, state.recommendation.unknown)
  assert.ok(snapshot.unknown.some(text => text.includes('正文读取失败')))
})
})()

// === Merged from sanctumDisplay.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const sanctumDisplay = _m5_sanctumDisplay
  const sanctumRoomLabel = _m5_sanctumRoomLabel
  const sanctumRoomDetail = _m5_sanctumRoomDetail
function fixture() {
  const room = (id, column, row = 0) => ({ id, column, status: 'matched', detailsStatus: 'matched', x: column * 200 + 20, y: row * 150 + 40, width: 100, height: 80 })
  const edge = (from, to, traversal = 'available') => ({ from, to, status: 'matched', availability: traversal === 'unavailable' ? 'unavailable' : 'gold', traversal })
  const floor = { identityConfirmed: true, runId: 'run', floorId: 'floor', revision: 3, positionStatus: 'confirmed', currentRoomId: 'b',
    rooms: [room('a', 0), room('missed', 0, 1), room('b', 1), room('side', 1, 1), room('c', 2), room('d', 2, 1), room('blocked', 2, 2), room('unknown', 2, 3), room('missing', 3, 3), room('end', 3)],
    edges: [edge('a', 'b', 'visited'), edge('a', 'side'), edge('b', 'c'), edge('b', 'd'), edge('b', 'blocked', 'unavailable'),
      { ...edge('b', 'unknown'), availability: 'unknown', traversal: 'unknown' }, edge('c', 'end'), edge('d', 'end')] }
  const recommendation = { runId: 'run', floorId: 'floor', revision: 3, status: 'ready', paths: [{ rooms: ['b', 'c', 'end'] }, { rooms: ['b', 'd', 'end'] }] }
  return { floor, recommendation }
}
const states = result => Object.fromEntries(result.rooms.map(room => [room.id, room.displayState]))

test('只有实际已走历史房间完成，岔路不可达，当前位置独立，未知不伪造', () => {
  const { floor, recommendation } = fixture()
  const original = structuredClone(floor)
  const display = sanctumDisplay(floor, recommendation)
  assert.deepEqual(states(display), { a: 'completed', missed: 'unreachable', b: 'reachable', side: 'unreachable', c: 'reachable', d: 'reachable', blocked: 'unreachable', unknown: 'unknown', missing: 'unknown', end: 'reachable' })
  assert.equal(display.rooms.find(room => room.id === 'b').current, true)
  assert.equal(display.lines[0].displayState, 'completed')
  assert.equal(display.lines[1].displayState, 'unreachable')
  assert.equal(display.nextRoomId, 'c')
  assert.deepEqual(display.lines.filter(line => line.recommended).map(line => [line.from, line.to]), [['b', 'c'], ['c', 'end']])
  assert.deepEqual(floor, original)
  assert.ok(display.lines.every(line => [line.x1, line.x2, line.y1, line.y2].every(Number.isFinite)))
  assert.ok(display.lines[2].x1 > floor.rooms[2].x + floor.rooms[2].width)
  assert.ok(display.lines[2].x2 < floor.rooms[4].x)
})

test('未知、遮挡和缺边保留未知，已确认路径可以证明汇合房可达', () => {
  const { floor } = fixture()
  floor.edges[4].occluded = true
  floor.rooms.find(room => room.id === 'd').occluded = true
  const result = sanctumDisplay(floor)
  assert.equal(states(result).blocked, 'unknown')
  assert.equal(states(result).d, 'unknown')
  assert.equal(states(result).end, 'reachable')
  assert.equal(states(result).missing, 'unknown')
  assert.equal(result.lines[4].displayState, 'unknown')
})

test('断开的或有分叉的已走证据不能伪装完成链，未知位置不猜历史', () => {
  const { floor } = fixture()
  floor.edges[1].traversal = 'visited'
  assert.equal(sanctumDisplay(floor).rooms.some(room => room.displayState === 'completed'), false)
  floor.positionStatus = 'unknown'
  const result = sanctumDisplay(floor)
  assert.ok(result.rooms.every(room => !room.current && room.displayState === 'unknown'))
  assert.equal(result.nextRoomId, null)
})

test('初始选择推荐第一房，推进后改为当前位置的下一房', () => {
  const { floor, recommendation } = fixture()
  floor.initialSelection = true; floor.positionStatus = 'initial'; floor.currentRoomId = null; floor.startRoomIds = ['a', 'missed']
  recommendation.paths = [{ rooms: ['a', 'b', 'c', 'end'] }]
  let result = sanctumDisplay(floor, recommendation)
  assert.equal(result.nextRoomId, 'a')
  assert.ok(result.rooms.every(room => room.displayState !== 'completed' && !room.current))
  floor.initialSelection = false; floor.positionStatus = 'confirmed'; floor.currentRoomId = 'c'
  floor.edges[2].traversal = 'visited'
  recommendation.paths = [{ rooms: ['c', 'end'] }]
  result = sanctumDisplay(floor, recommendation)
  assert.equal(result.nextRoomId, 'end')
  assert.equal(states(result).b, 'completed')
  assert.equal(states(result).d, 'unreachable')
})

test('身份、版本、位置、状态及连续连线任一不符即撤下推荐', () => {
  const mutations = [f => { f.recommendation.revision-- }, f => { f.recommendation.runId = 'old' }, f => { f.recommendation.floorId = 'old' },
    f => { f.floor.identityConfirmed = false }, f => { f.floor.positionStatus = 'unknown' }, f => { f.recommendation.status = 'blocked' },
    f => { delete f.recommendation.revision }, f => { f.recommendation.paths[0].rooms = ['c', 'end'] },
    f => { f.recommendation.paths[0].rooms = ['b', 'missing'] }, f => { f.floor.edges[2].availability = 'unknown' },
    f => { f.floor.edges[2].availability = 'unavailable' }, f => { f.recommendation = null }]
  for (const mutate of mutations) {
    const f = fixture(); mutate(f)
    const result = sanctumDisplay(f.floor, f.recommendation)
    assert.equal(result.nextRoomId, null)
    assert.ok(result.rooms.every(room => !room.recommended && !room.next))
    assert.ok(result.lines.every(line => !line.recommended))
  }
})

test('方案切换不残留旧绿线，只有当前位置时不标推荐', () => {
  const { floor, recommendation } = fixture()
  recommendation.paths.reverse()
  const display = sanctumDisplay(floor, recommendation)
  assert.equal(display.nextRoomId, 'd')
  assert.equal(display.rooms.find(room => room.id === 'c').recommended, false)
  recommendation.paths = [{ rooms: ['b'] }]
  const terminal = sanctumDisplay(floor, recommendation)
  assert.equal(terminal.nextRoomId, null)
  assert.ok(terminal.rooms.every(room => !room.recommended))
})

test('历史快照保留基础状态，读取失败和手动标记不改变路线状态', () => {
  const { floor, recommendation } = fixture()
  floor.rooms.find(room => room.id === 'c').detailsStatus = 'failed'
  let display = sanctumDisplay(floor, recommendation, { targets: ['c'], avoid: ['d'] }, { stage: 'rooms', targetId: 'c' })
  const next = display.rooms.find(room => room.id === 'c')
  assert.equal(next.displayState, 'reachable')
  assert.equal(sanctumRoomLabel(next), '可达 · 目标')
  assert.equal(display.nextRoomId, null)
  assert.equal(sanctumRoomDetail(next), '读取中')
  assert.equal(sanctumRoomDetail({ ...next, reading: false }), '读取失败')
  floor.identityConfirmed = false; floor.captureStopped = true
  display = sanctumDisplay(floor, recommendation)
  assert.equal(states(display).a, 'completed')
  assert.equal(display.nextRoomId, null)
})
})()

// === Merged from sanctumEffectCorrection.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const fs = _m6_fs
  const os = _m6_os
  const path = _m6_path
  const parseEffectTooltip = _m6_parseEffectTooltip
  const parseStatusTooltip = _m6_parseStatusTooltip
  const mergeEffectGroups = _m6_mergeEffectGroups
  const SanctumService = _m6_SanctumService
  const SanctumRepository = _m6_SanctumRepository
  const observationKey = _m6_observationKey
  const preservePreviousCapture = _m6_preservePreviousCapture
  const catalogEffect = _m6_catalogEffect
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
})()

// === Merged from sanctumEffectMemory.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const fs = _m7_fs
  const os = _m7_os
  const path = _m7_path
  const emptyEffectMemory = _m7_emptyEffectMemory
  const effectMemoryKey = _m7_effectMemoryKey
  const rememberEffectRule = _m7_rememberEffectRule
  const forgetEffectRule = _m7_forgetEffectRule
  const applyEffectMemory = _m7_applyEffectMemory
  const effectRuleStatus = _m7_effectRuleStatus
  const migrateEffectMemory = _m7_migrateEffectMemory
  const parseStatusTooltip = _m7_parseStatusTooltip
  const SanctumService = _m7_SanctumService
  const SanctumRepository = _m7_SanctumRepository
  const observationKey = _m7_observationKey
  const rebuildCorrectedScan = _m7_rebuildCorrectedScan
  const resetSanctumRun = _m7_resetSanctumRun
  const preservePreviousCapture = _m7_preservePreviousCapture
const catalog=JSON.parse(fs.readFileSync('electron/assets/sanctum/catalog.json','utf8'))
const entry=name=>catalog.entries.find(entry=>entry.name === name)
const sword=entry('钝化之剑').id,eye=entry('全知之眼').id
const ids=group=>group.entries.map(entry=>entry.entryId)
const parse=(texts,memory,status='located')=>applyEffectMemory({texts,status},catalog,memory)
function capture(service,texts=['错误甲'],{runId='r',floorId='f',targetId='effect:1',evidenceId='image',status='located',captureIssue=null}={}) {
  const floor={runId,floorId,mapKey:'m',revision:1,identityConfirmed:true,positionStatus:'confirmed',currentRoomId:'a',rooms:[{id:'a',column:0,row:0},{id:'b',column:1,row:0,terminal:true,detailsStatus:'matched'}],edges:[{from:'a',to:'b',status:'matched'}]}
  const read=parseStatusTooltip({texts,status,targetId,evidenceId,reason:status === 'partial'?'截断':null},catalog,service.state.effectCorrectionMemory)
  const target={runId,floorId,targetId,evidenceId,readStatus:status,texts,captureIssue,stage:read.effectGroup?.complete?'matched':'failed',effectGroup:read.originalEffectGroup,rememberedGroup:read.effectGroup,memoryHits:read.memoryHits,region:{x:0,y:0,width:100,height:100}}
  const next=rebuildCorrectedScan({targets:[target],groups:[],binding:observationKey(floor),finished:true,coverageConfirmed:true},catalog,service.state.effectCorrectionMemory)
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
  assert.equal(result.memoryHits.length,0);assert.equal(result.hasRewardContext,true)
  rememberEffectRule(memory,'完成禁域时获得60×工匠石','ignore',null,catalog)
  const reward=parseStatusTooltip({status:'located',texts:['完成禁域时获得60×工匠石']},catalog,memory)
  assert.equal(reward.effectGroup,null);assert.equal(reward.hasRewardContext,true)
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
  service.state.floor.effectScan={targets:[],groups:[],binding:observationKey(service.state.floor),coverageConfirmed:true,finished:true,complete:true}
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
})()

// === Merged from sanctumEffectUpdates.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const decideSanctumEffects = _m8_decideSanctumEffects
  const reuseSanctumEffects = _m8_reuseSanctumEffects
  const sanctumEffectScan = _m8_sanctumEffectScan
  const parseSanctumRoomTexts = _m8_parseSanctumRoomTexts
  const emptyEffectGroups = _m8_emptyEffectGroups
  const applySanctumEffects = _m8_applySanctumEffects
  const observationKey = _m8_observationKey
  const currentRunObservation = _m8_currentRunObservation
  const SEASON_BASELINE = _m8_SEASON_BASELINE
const catalog = {schemaVersion:1,game:'poe1',patch:SEASON_BASELINE.patch,sources:[{id:'test',channel:'official'}],entries:[
  {id:'reward',kind:'room',name:'奖励',roomType:'reward',descriptions:['完成后提供奖励']},
  {id:'pain',kind:'affliction',tier:'minor',name:'痛苦',descriptions:['不能恢复坚毅']},
  {id:'unsupported',kind:'affliction',tier:'major',name:'未知计算痛苦',descriptions:['未支持的效果描述']}
].map(entry=>({...entry,sourceId:'test',applicability:'current',reviewedPatch:SEASON_BASELINE.patch}))}

function fixture(pain = null) {
  const rooms = ['a','b','c'].map((id,column) => {
    const patch = parseSanctumRoomTexts(['奖励',...(pain && id !== 'a' ? [pain] : [])],catalog)
    for (const fact of Object.values(patch.knowledge)) fact.mapKey = 'map'
    return {id,column,row:0,revealed:true,...patch,recognition:{...patch.recognition,evidenceId:`evidence-${id}`}}
  })
  const floor = {runId:'capture',sanctumRunId:'run',floorId:'floor',mapKey:'map',identityConfirmed:true,
    currentRoomId:'a',positionStatus:'confirmed',rooms,startRoomIds:['a'],
    edges:[{from:'a',to:'b',status:'matched',traversal:'available'},{from:'b',to:'c',status:'matched',traversal:'available'}]}
  const ledger = {scope:'scope',floor,complete:true,finished:true,effectsComplete:true,classificationComplete:true,
    coverageConfirmed:true,effects:[],groups:emptyEffectGroups().map(g=>({...g,complete:true,status:'absent'})),
    targets:[],binding:observationKey(floor)}
  const next = structuredClone(floor); next.currentRoomId = 'b'
  // Completed rooms are no longer hovered by the real capture pipeline.
  next.rooms[1] = {id:'b',column:1,row:0,captureSkipReason:'completed'}
  return {ledger,next}
}

test('奖励房沿用整个效果基线，但不更新资源观测', () => {
  const {ledger,next} = fixture()
  const advanced = reuseSanctumEffects(ledger,next,'scope',catalog)
  assert.equal(advanced.updateMode,'reuse')
  assert.deepEqual(advanced.effects,[])
  assert.equal(advanced.effectBinding,observationKey(next))
  assert.equal(advanced.binding,observationKey(ledger.floor))
  assert.equal(currentRunObservation({key:observationKey(ledger.floor),status:'confirmed',coins:100},next),null)
  assert.equal(reuseSanctumEffects(advanced,next,'scope',catalog),advanced)
  const third = structuredClone(next); third.currentRoomId = 'c'
  assert.equal(reuseSanctumEffects(advanced,third,'scope',catalog).updateMode,'reuse')
  assert.equal(ledger.floor.currentRoomId,'a')
})

test('明确痛苦加入分类与计算，保留来源且连续同词条只加入一次', () => {
  const {ledger,next} = fixture('痛苦')
  const advanced = reuseSanctumEffects(ledger,next,'scope',catalog)
  assert.equal(advanced.updateMode,'append')
  assert.equal(advanced.effects.length,1)
  assert.equal(applySanctumEffects(advanced.effects).cannotRecover,true)
  assert.equal(advanced.effects[0].trigger,undefined)
  const group = advanced.groups.find(g=>g.category === 'minorAffliction')
  assert.equal(group.status,'read')
  assert.equal(group.entries[0].name,'痛苦')
  assert.equal(group.entries[0].source.roomId,'b')
  assert.equal(group.entries[0].source.evidenceId,'evidence-b')
  assert.deepEqual(advanced.targets,[])
  const third = structuredClone(next); third.currentRoomId = 'c'
  assert.equal(reuseSanctumEffects(advanced,third,'scope',catalog).effects.length,1)
  assert.deepEqual(ledger.effects,[])
})

test('明确身份但触发机制不支持的新增痛苦要求扫描，不推断效果不变', () => {
  const {ledger,next} = fixture('未知计算痛苦')
  const decision = decideSanctumEffects(ledger,next,'scope',catalog)
  assert.equal(decision.mode,'scan')
  assert.match(decision.reason,/未知计算痛苦.*触发机制尚未确认/)
})

test('入口到首房使用可信起点，不按推荐房间提前添加', () => {
  const {ledger,next} = fixture('痛苦')
  ledger.floor.initialSelection = true; ledger.floor.positionStatus = 'initial'; ledger.floor.currentRoomId = null
  ledger.floor.startRoomIds = ['b']
  assert.equal(reuseSanctumEffects(ledger,next,'scope',catalog).effects.length,1)
  ledger.floor.startRoomIds = ['a']
  assert.equal(reuseSanctumEffects(ledger,next,'scope',catalog),null)
})

test('商人、冥约、喷泉和未知类型即使有明确痛苦也重新扫描', () => {
  for (const type of ['merchant','pact','fountain',undefined,'unknown']) {
    const {ledger,next} = fixture('痛苦'); ledger.floor.rooms[1].type = type
    assert.equal(reuseSanctumEffects(ledger,next,'scope',catalog),null,type)
  }
  const {ledger,next} = fixture(); ledger.floor.rooms[1].type = 'treasure'
  assert.equal(reuseSanctumEffects(ledger,next,'scope',catalog).updateMode,'reuse')
})

test('战斗、倒计时、复活、每房随机与未知机制在宝藏房仍需重读', () => {
  for (const effect of [{rule:'randomAfflictionEachRoom'},{rule:'randomShrine'},
    {rule:'preventResolveLoss',remainingRooms:1},{rule:'guardKill',remainingUses:2},
    {rule:'flawlessInspiration',remainingRooms:1},{rule:'reviveSacred'},{rule:'reviveOnce'},
    {rule:'lowResolveRescue'},{rule:'firstHitImmune'},{rule:'newUnknownRule'},
    {rule:'cannotRecover',expires:'unknown'},{status:'unknown'}]) {
    const {ledger,next} = fixture()
    ledger.floor.rooms[1].type='treasure'
    ledger.effects = [{status:'matched',...effect}]
    assert.equal(reuseSanctumEffects(ledger,next,'scope',catalog),null,JSON.stringify(effect))
  }
})

test('喷泉、购买、恩赐转换和楼层到期条件不阻止同层无关房间复用', () => {
  for(const effect of [{rule:'fountainAffliction'},{rule:'fountainBoon'},
    {rule:'freePurchase'},{rule:'completionCoinsIncrease'},{rule:'convertNextBoon'},
    {rule:'upgradeNextBoon'},{rule:'coinsDoubleFloor'},{rule:'cannotRecover',expires:'floorBoss'}]) {
    for(const pain of [null,'痛苦']) {
      const {ledger,next}=fixture(pain)
      ledger.effects=[{status:'matched',...effect}]
      assert.equal(decideSanctumEffects(ledger,next,'scope',catalog).mode,pain?'append':'reuse',JSON.stringify(effect))
      assert.equal(decideSanctumEffects(ledger,{...next,floorId:'next-floor'},'scope',catalog).mode,'scan')
    }
  }
})

test('痛苦转换、额外随机痛苦和次要痛苦免疫只在新增对应痛苦时重读', () => {
  for(const rule of ['convertNextAffliction','extraAffliction','minorAfflictionImmune']) {
    const empty=fixture();empty.ledger.effects=[{rule,status:'matched',name:'条件效果'}]
    assert.equal(decideSanctumEffects(empty.ledger,empty.next,'scope',catalog).mode,'reuse')
    const f=fixture('痛苦');f.ledger.effects=[{rule,status:'matched',name:'条件效果'}]
    assert.match(decideSanctumEffects(f.ledger,f.next,'scope',catalog).reason,/条件效果.*触发/)
    f.ledger.effects.push({...f.ledger.floor.rooms[1].effects[0],trigger:undefined})
    assert.equal(decideSanctumEffects(f.ledger,f.next,'scope',catalog).mode,'reuse','已有相同词条不视为新增')
  }
  const f=fixture('痛苦');f.ledger.effects=[{rule:'minorAfflictionImmune',status:'matched'}]
  const majorCatalog={...catalog,entries:catalog.entries.map(e=>e.id==='pain'?{...e,tier:'major'}:e)}
  assert.equal(decideSanctumEffects(f.ledger,f.next,'scope',majorCatalog).mode,'append','次要痛苦免疫不影响主要痛苦')
})

test('新增条件痛苦与已有条件痛苦使用相同的触发条件', () => {
  for(const [rule,mode] of [['fountainAffliction','append'],['merchantOneOption','append'],['extraAffliction','scan'],['randomAfflictionEachRoom','scan']]) {
    const f=fixture('痛苦');f.ledger.floor.rooms[1].effects=[{entryId:'pain',kind:'affliction',status:'matched',trigger:'entry',rule}]
    assert.equal(decideSanctumEffects(f.ledger,f.next,'scope',catalog).mode,mode,rule)
  }
})

test('重读原因区分不完整基线、上下文与触发效果，不把旧失败恢复为完整', () => {
  const {ledger,next}=fixture()
  ledger.complete=false
  assert.equal(decideSanctumEffects(ledger,next,'scope',catalog).reason,'上一份状态未完整读取')
  assert.equal(decideSanctumEffects(ledger,ledger.floor,'scope',catalog).reason,'上一份状态未完整读取')
  assert.equal(decideSanctumEffects(ledger,next,'other',catalog).reason,'采集上下文已变化')
  assert.equal(ledger.complete,false)
})

test('缺失信息、异常身份、断边、跨列、未完整基线均不得推导', () => {
  const changes = [
    ({ledger})=>{ledger.complete=false},
    ({ledger})=>{delete ledger.floor.rooms[1].knowledge.effects},
    ({ledger})=>{ledger.floor.rooms[1].knowledge.type.source='manual'},
    ({ledger})=>{ledger.floor.rooms[1].knowledge.effects.mapKey='other'},
    ({ledger})=>{ledger.floor.rooms[1].effects=[{status:'unknown'}]},
    ({ledger})=>{ledger.floor.edges[0].status='unknown'},
    ({ledger})=>{ledger.floor.edges[0].traversal='unavailable'},
    ({ledger})=>{ledger.floor.edges[0].occluded=true},
    ({next})=>{next.currentRoomId='c'},({next})=>{next.positionStatus='ambiguous'},
    ({next})=>{next.identityConfirmed=false},({next})=>{next.floorId='other'},
    ({next})=>{next.mapKey='other'},({next})=>{next.mapInstanceId='other'},
    ({next})=>{next.sanctumRunId='other'},({next})=>{next.rerolled=true}
  ]
  for (const change of changes) {
    const f=fixture(); change(f)
    assert.equal(reuseSanctumEffects(f.ledger,f.next,'scope',catalog),null,change.toString())
  }
  const {ledger,next}=fixture()
  assert.equal(reuseSanctumEffects(ledger,next,'new-session',catalog),null)
  assert.equal(reuseSanctumEffects(null,next,'scope',catalog),null)
})
})()

// === Merged from sanctumEnabled.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const fs = _m9_fs
  const os = _m9_os
  const path = _m9_path
  const createPinia = _m9_createPinia
  const setActivePinia = _m9_setActivePinia
  const SanctumService = _m9_SanctumService
  const SanctumRepository = _m9_SanctumRepository
  const SanctumCalibrationEditor = _m9_SanctumCalibrationEditor
  const useSanctumStore = _m9_useSanctumStore
  const createSanctumStrategy = _m9_createSanctumStrategy
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }

test('首次和旧配置默认关闭，重启恢复偏好但不运行，模块移除不修改偏好', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-enabled-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const repository = new SanctumRepository(root)
  let service = new SanctumService({ repository, moduleEnabled: false })
  assert.equal(service.getState().configuredEnabled, false)
  service.setModuleEnabled(true)
  assert.equal(service.enabled, false)
  service.setEnabled(true)
  service.resetRun()
  assert.equal(repository.load().enabled, true)
  service.setModuleEnabled(false)
  assert.equal(service.enabled, false)
  assert.equal(repository.load().enabled, true)
  service.setModuleEnabled(true)
  assert.equal(service.enabled, true)
  assert.equal(service.state.running, false)
  await service.shutdown()
  service = new SanctumService({ repository, moduleEnabled: false })
  service.setModuleEnabled(true)
  assert.equal(service.enabled, true)
  assert.equal(service.state.running, false)
  service.setEnabled(false)
  assert.equal(repository.load().enabled, false)
  const data = JSON.parse(fs.readFileSync(repository.file, 'utf8'))
  delete data.enabled
  fs.writeFileSync(repository.file, JSON.stringify(data))
  assert.equal(repository.load().enabled, false)
  await service.shutdown()
})

test('保存失败：开启不生效，关闭先停止并丢弃迟到回放，保留配置和偏好状态', async t => {
  let fail = true
  const pending = deferred()
  const service = new SanctumService({ repository: { load: () => null, save() { if (fail) throw new Error('disk failure') } },
    replay: () => pending.promise })
  t.after(() => service.shutdown())
  assert.throws(() => service.setEnabled(true), /保存失败/)
  assert.equal(service.enabled, false)
  fail = false
  service.setEnabled(true)
  const strategy = structuredClone(service.state.strategy)
  const run = service.rescan('sample')
  fail = true
  assert.throws(() => service.setEnabled(false), /本次已关闭/)
  assert.equal(service.enabled, false)
  assert.equal(service.getState().configuredEnabled, false)
  assert.equal(service.state.running, false)
  pending.resolve({rooms:[],edges:[]})
  await run
  assert.equal(service.state.floor, null)
  assert.deepEqual(service.state.strategy, strategy)
  assert.throws(() => service.resetRun(), /未启用/)
  assert.throws(() => service.saveStrategy(createSanctumStrategy()), /未启用/)
  await assert.rejects(service.rescan('sample'), /未启用/)
  fail = false
  service.setEnabled(true)
  service.stop()
  assert.equal(service.getState().configuredEnabled, true)
})

test('关闭取消自己的框选，迟到截图不能写入；重新开启可再次框选', async t => {
  const service = new SanctumService({})
  t.after(() => service.shutdown())
  service.setEnabled(true)
  const pending = deferred()
  let canceled = 0
  const editor = new SanctumCalibrationEditor({ service, withHidden: fn => fn(), picker: () => pending.promise,
    detection: { getTitleConfig: () => ({ templates: {} }) },
    cancelPicker: () => { canceled++ } })
  service.calibrationEditor = editor
  const capture = editor.capture('mapRegion')
  service.setEnabled(false)
  assert.equal(canceled, 1)
  service.setEnabled(true)
  pending.resolve({ success: true })
  await capture
  assert.equal(service.state.liveCalibration, null)
  assert.equal(editor.picking, false)
  editor.picker = async () => ({ canceled: true })
  await editor.capture('mapRegion')
  assert.equal(canceled, 1)
})

test('页内开关防重复提交，失败刷新状态并保留错误，初始化及暂停不改偏好', async t => {
  setActivePinia(createPinia())
  const original = globalThis.window
  t.after(() => { globalThis.window = original })
  const pending = deferred(), calls = []
  let state = { enabled: false, configuredEnabled: false, running: false, solving: false }
  globalThis.window = { electronAPI: { onSanctumState: () => () => {}, sanctum: {
    async setModuleEnabled(value) { calls.push(['module', value]); return { success: true, data: state } },
    async samples() { return { success: true, data: [] } },
    async setEnabled(value) { calls.push(['preference', value]); return pending.promise },
    async getState() { return { success: true, data: state } }
  } } }
  const store = useSanctumStore()
  await store.initialize()
  assert.equal(store.readOnly, true)
  const toggle = store.setEnabled(true)
  assert.equal(store.toggling, true)
  await store.setEnabled(false)
  assert.deepEqual(calls, [['module', true], ['preference', true]])
  pending.resolve({ success: false, error: '保存失败' })
  await toggle
  assert.equal(store.error, '保存失败')
  assert.equal(store.toggling, false)
  assert.equal(store.state.enabled, false)
  state = { ...state, enabled: true, configuredEnabled: true }
  await store.initialize()
  await store.suspend()
  assert.deepEqual(calls.slice(-2), [['module', true], ['module', false]])
})

test('开关 IPC 拒绝时刷新真实状态并显示错误，刷新成功不能清除失败提示', async t => {
  setActivePinia(createPinia())
  const original = globalThis.window
  t.after(() => { globalThis.window = original })
  let refreshed = 0
  globalThis.window = { electronAPI: { sanctum: {
    async setEnabled() { throw new Error('开关通信中断') },
    async getState() { refreshed++; return { success: true, data: { enabled: false, configuredEnabled: false } } }
  } } }
  const store = useSanctumStore()
  await store.setEnabled(true)
  assert.equal(refreshed, 1)
  assert.equal(store.error, '开关通信中断')
  assert.equal(store.toggling, false)
  assert.equal(store.readOnly, true)
})
})()

// === Merged from sanctumEvidence.test.js ===
await (async () => {
  const test = _m10_test
  const assert = _m10_assert
  const SanctumEvidenceStore = _m10_SanctumEvidenceStore
  const SanctumService = _m10_SanctumService
  const SanctumCapture = _m10_SanctumCapture
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
const frame={png,width:1,height:1,region:{x:0,y:0,width:1,height:1}}
const context={runId:'run',floorId:'floor',roomId:'a',sessionId:'session'}

test('图片有界保存，目标与截图绑定，图片只按需读取且不暴露内部信号', () => {
  const store=new SanctumEvidenceStore({maxCount:2})
  const id=store.add({...context,signal:new AbortController().signal},frame)
  const binding={...context,evidenceId:id}
  assert.equal(store.image(binding).dataUrl,`data:image/png;base64,${png}`)
  assert.equal(store.image(binding).signal,undefined)
  assert.throws(()=>store.get({...binding,roomId:'b'}),/过期/)
  const next=store.add(context,frame)
  assert.throws(()=>store.get(binding),/过期/)
  store.add({...context,roomId:'b'},frame);store.add({...context,roomId:'c'},frame)
  assert.equal(store.records.size,3)
  assert.ok(store.image({...context,evidenceId:next}).dataUrl)
  store.clear();assert.equal(store.bytes,0)
  assert.throws(()=>store.add(context,{...frame,width:99}),/尺寸/)
})

function fixture() {
  const service=new SanctumService({})
  service.setEnabled(true)
  const evidence=new SanctumEvidenceStore(), id=evidence.add(context,frame), binding={...context,evidenceId:id}
  const patch={rawText:'新文字',detailsStatus:'matched',rewards:[],effects:[],afflictions:[],recognition:{evidenceId:id,region:frame.region,matches:[]}}
  service.liveDriver={evidence,close:async()=>{}}
  service.capture=new SanctumCapture({})
  service.state.floor={runId:'run',floorId:'floor',revision:1,identityConfirmed:false,rooms:[{id:'a',detailFingerprint:'a:0',name:'旧名称',recovery:50,recognition:{evidenceId:id,region:frame.region}}],edges:[]}
  return {service,patch,binding}
}

test('停止后只读截图，重扫和楼层变化拒绝旧引用，无改框接口',()=>{
  const {service,binding}=fixture()
  assert.ok(service.getRoomEvidence(binding).dataUrl)
  assert.equal(service.recognizeRoomRegion,undefined)
  assert.doesNotMatch(JSON.stringify(service.getState()),/data:image|iVBOR/)
  service.state.floor.rooms[0].recognition.evidenceId='new'
  assert.throws(()=>service.getRoomEvidence(binding),/过期/)
})

test('自动痛苦的房间证据按原始来源读取，不能伪造其他房间绑定',()=>{
  const {service,binding}=fixture()
  service.state.floor.runId='next-capture'
  service.state.floor.rooms=[]
  service.state.floor.effectScan={groups:[{entries:[{entryId:'pain',source:{kind:'room',...binding}}]}]}
  assert.ok(service.getRoomEvidence(binding).dataUrl)
  assert.throws(()=>service.getRoomEvidence({...binding,roomId:'other'}),/变化|过期/)
  service.state.floor.effectScan.groups=[]
  assert.throws(()=>service.getRoomEvidence(binding),/变化|过期/)
})
test('效果图片按楼层、目标和截图校验，只返回局部图且拒绝旧整屏证据',()=>{
  const {service}=fixture()
  const target={...context,roomId:'effect:1'}
  const crop={...frame,kind:'effect-crop',sourceRegion:{x:40,y:50,width:1,height:1},sourceWidth:100,sourceHeight:100}
  const evidenceId=service.liveDriver.evidence.add(target,crop)
  service.state.floor.effectScan={targets:[{targetId:'effect:1',evidenceId,stage:'failed'}]}
  const binding={runId:'run',floorId:'floor',targetId:'effect:1',evidenceId}
  const image=service.getEffectEvidence(binding)
  assert.ok(image.dataUrl);assert.deepEqual(image.region,frame.region);assert.equal(image.sourceRegion.x,40)
  assert.throws(()=>service.liveDriver.evidence.add(target,{...crop,sourceRegion:{x:40,y:50,width:2,height:1}}),/坐标/) 
  assert.throws(()=>service.getEffectEvidence({...binding,targetId:'effect:2'}),/过期/)
  const oldId=service.liveDriver.evidence.add(target,frame)
  service.state.floor.effectScan.targets[0].evidenceId=oldId
  assert.throws(()=>service.getEffectEvidence({...binding,evidenceId:oldId}),/独立/)
  service.state.floor.floorId='changed'
  assert.throws(()=>service.getEffectEvidence(binding),/过期/)
})
})()

// === Merged from sanctumFeatureRemoval.test.js ===
await (async () => {
  const test = _m11_test
  const assert = _m11_assert
  const fs = _m11_fs
  const os = _m11_os
  const path = _m11_path
  const vm = _m11_vm
  const emptySanctumState = _m11_emptySanctumState
  const createSanctumStrategy = _m11_createSanctumStrategy
  const SANCTUM_PRESETS = _m11_SANCTUM_PRESETS
  const SanctumRepository = _m11_SanctumRepository
  const SanctumService = _m11_SanctumService
  const planSanctumFloor = _m11_planSanctumFloor
  const initialEffectState = _m11_initialEffectState
  const advanceSanctumRoom = _m11_advanceSanctumRoom
  const parse = _m11_parse
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
})()
