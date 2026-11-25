import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { createHash as _m0_createHash } from 'node:crypto'
import { createInternationalSanctumCatalog as _m0_createInternationalSanctumCatalog } from '../scripts/sanctum/internationalCatalog.js'
import { createLocalizedSanctumCatalog as _m0_createLocalizedSanctumCatalog, normalizeSanctumEvidence as _m0_normalizeSanctumEvidence } from '../electron/modules/sanctum/localization.js'
import { isCurrentSanctumEntry as _m0_isCurrentSanctumEntry, resolveSanctumCatalogText as _m0_resolveSanctumCatalogText } from '../electron/modules/sanctum/catalog.js'
import { parseSanctumRoomTexts as _m0_parseSanctumRoomTexts, parseSanctumCurrentEffects as _m0_parseSanctumCurrentEffects } from '../electron/modules/sanctum/liveDriver.js'
import { parseStatusTooltip as _m0_parseStatusTooltip } from '../electron/modules/sanctum/statusRecognition.js'
import { parseResourceRegions as _m0_parseResourceRegions } from '../electron/modules/sanctum/runObservation.js'
import { parseSanctumResearch as _m0_parseSanctumResearch } from '../electron/modules/sanctum/research.js'
import { SanctumService as _m0_SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumControlOverlay as _m0_SanctumControlOverlay } from '../electron/modules/sanctum/controlOverlay.js'
import { runPython as _m0_runPython } from './helpers/python.js'
import { sanctumError as _m1_sanctumError } from '../electron/modules/sanctum/errors.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import _m1_fs from 'node:fs'
import _m1_os from 'node:os'
import _m1_path from 'node:path'
import { SanctumCapture as _m1_SanctumCapture } from '../electron/modules/sanctum/capture.js'
import { SanctumService as _m1_SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository as _m1_SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { AutomationLock as _m1_AutomationLock } from '../electron/modules/automation/lock.js'
import { runPython as _m1_runPython } from './helpers/python.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import _m2_fs from 'node:fs'
import _m2_os from 'node:os'
import _m2_path from 'node:path'
import { validateSanctumCalibration as _m2_validateSanctumCalibration, bindSanctumCalibration as _m2_bindSanctumCalibration } from '../shared/sanctumCalibration.js'
import { SanctumService as _m2_SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository as _m2_SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { listSanctumSamples as _m2_listSanctumSamples, replaySanctumSample as _m2_replaySanctumSample } from '../electron/modules/sanctum/replay.js'
import { runPython as _m2_runPython } from './helpers/python.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { SanctumCalibrationEditor as _m3_SanctumCalibrationEditor } from '../electron/modules/sanctum/calibration.js'
import { SanctumCalibrationCollection as _m3_SanctumCalibrationCollection } from '../electron/modules/sanctum/calibrationCollection.js'
import { SanctumService as _m3_SanctumService } from '../electron/modules/sanctum/service.js'
import { COLLECTION_KEYS as _m3_COLLECTION_KEYS } from '../shared/sanctumCalibrationCollection.js'
import { runPython as _m3_runPython } from './helpers/python.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import _m4_fs from 'node:fs'
import _m4_os from 'node:os'
import _m4_path from 'node:path'
import { SanctumCalibrationEditor as _m4_SanctumCalibrationEditor } from '../electron/modules/sanctum/calibration.js'
import { SanctumService as _m4_SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository as _m4_SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { InterfaceTitleRegistry as _m4_InterfaceTitleRegistry } from '../electron/modules/interfaceDetection/titleRegistry.js'
import { runPython as _m4_runPython } from './helpers/python.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import _m5_fs from 'node:fs'
import { runPython as _m5_runPython } from './helpers/python.js'
import { parseStatusTooltip as _m5_parseStatusTooltip } from '../electron/modules/sanctum/statusRecognition.js'
import { SEASON_BASELINE as _m6_SEASON_BASELINE } from '../shared/seasonBaseline.js'
import { sanctumError as _m6_sanctumError } from '../electron/modules/sanctum/errors.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { readFileSync as _m6_readFileSync } from 'node:fs'
import { SanctumLiveDriver as _m6_SanctumLiveDriver, parseSanctumEffectGroup as _m6_parseSanctumEffectGroup, parseSanctumRoomTexts as _m6_parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { liveProfile as _m6_liveProfile } from '../shared/sanctumLive.js'
import { AutomationLock as _m6_AutomationLock } from '../electron/modules/automation/lock.js'
import { sanctumLogEvents as _m6_sanctumLogEvents } from './helpers/sanctumLog.js'
import { runPython as _m6_runPython } from './helpers/python.js'
import { SanctumCapture as _m6_SanctumCapture } from '../electron/modules/sanctum/capture.js'
import { createLocalizedSanctumCatalog as _m6_createLocalizedSanctumCatalog } from '../electron/modules/sanctum/localization.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import _m7_fs from 'node:fs'
import { runPython as _m7_runPython } from './helpers/python.js'
import { parseEffectTooltip as _m7_parseEffectTooltip } from '../electron/modules/sanctum/effectRecognition.js'
import { SanctumLiveDriver as _m7_SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import _m8_fs from 'node:fs'
import { parseEffectTooltip as _m8_parseEffectTooltip } from '../electron/modules/sanctum/effectRecognition.js'
import { mergeEffectGroups as _m8_mergeEffectGroups } from '../shared/sanctumEffects.js'
import { runPython as _m8_runPython } from './helpers/python.js'
import { SanctumLiveDriver as _m8_SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import _m9_fs from 'node:fs'
import _m9_os from 'node:os'
import _m9_path from 'node:path'
import { reuseSanctumEffects as _m9_reuseSanctumEffects } from '../electron/modules/sanctum/effectLedger.js'
import { SanctumControlOverlay as _m9_SanctumControlOverlay, sanctumControlState as _m9_sanctumControlState } from '../electron/modules/sanctum/controlOverlay.js'
import { SanctumRepository as _m9_SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { emptySanctumState as _m9_emptySanctumState } from '../shared/sanctum.js'
import { runPython as _m9_runPython } from './helpers/python.js'

// === Merged from internationalSanctum.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const createHash = _m0_createHash
  const createInternationalSanctumCatalog = _m0_createInternationalSanctumCatalog
  const createLocalizedSanctumCatalog = _m0_createLocalizedSanctumCatalog
  const normalizeSanctumEvidence = _m0_normalizeSanctumEvidence
  const isCurrentSanctumEntry = _m0_isCurrentSanctumEntry
  const resolveSanctumCatalogText = _m0_resolveSanctumCatalogText
  const parseSanctumRoomTexts = _m0_parseSanctumRoomTexts
  const parseSanctumCurrentEffects = _m0_parseSanctumCurrentEffects
  const parseStatusTooltip = _m0_parseStatusTooltip
  const parseResourceRegions = _m0_parseResourceRegions
  const parseSanctumResearch = _m0_parseSanctumResearch
  const SanctumService = _m0_SanctumService
  const SanctumControlOverlay = _m0_SanctumControlOverlay
  const runPython = _m0_runPython
const base = JSON.parse(readFileSync(new URL('../electron/assets/sanctum/catalog.international.json', import.meta.url)))
const entry = (id, en, tw, cn) => ({ table: 'ClientStrings', id, field: 'Text', kind: 'dat', en, tw, cn, sourceHash: createHash('sha256').update(en).digest('hex') })
const entries = [entry('fountain', 'Contains Fountain', '包含噴泉', '包含喷泉'), entry('recover', 'Recover {0} Resolve', '恢復 {0} 點堅毅', '恢复 {0} 点坚毅'),
  entry('skull', 'Demonic Skull', '惡魔頭骨', '恶魔头骨'), entry('no-recovery', 'Cannot recover Resolve', '無法恢復堅毅', '不能恢复坚毅'),
  entry('offers', 'Offers Items on Completion', '完成後提供物品', '完成后提供物品'), entry('coins', 'Chaos Orb', '混沌石', '混沌石'),
  entry('resolve', 'Resolve', '堅毅', '坚毅'), entry('inspiration', 'Inspiration', '啟迪', '启迪')]
const catalog = () => createLocalizedSanctumCatalog(base, { entriesProvider: () => entries, revisionProvider: () => 'signed-current' })

test('圣所入口浮窗启动及状态摘要不加载翻译字典，首次识别和汉化更新仍按需加载', t => {
  let reads = 0, revision = 'a', current = entries
  const data = createLocalizedSanctumCatalog(base, {
    entriesProvider: () => { reads++; return current }, revisionProvider: () => revision
  })
  const service = new SanctumService({ catalog: data, moduleEnabled: false })
  const control = new SanctumControlOverlay({ service,
    detection: { subscribe: () => () => {}, getState: () => ({}), unregisterConsumer() {} },
    automationLock: { subscribe: () => () => {}, getState: () => ({}) }
  })
  t.after(() => control.destroy())
  assert.equal(reads, 0, '启动入口浮窗只需要目录摘要，不应建立完整翻译字典')
  const expected = new SanctumService({ catalog: base }).getState().catalogSummary
  assert.deepEqual(service.getState().catalogSummary, expected)
  assert.equal(reads, 0)
  const parse = () => parseStatusTooltip({ texts: ['不能恢复坚毅'], status: 'located' }, data).effectGroup.complete
  assert.equal(parse(), true)
  assert.equal(reads, 1)
  revision = 'b'; current = []
  control.sync()
  assert.deepEqual(service.getState().catalogSummary, expected)
  assert.equal(reads, 1, '汉化版本变化后，纯状态查询仍不构建识别字典')
  assert.equal(parse(), false)
  assert.equal(reads, 2)
  revision = 'c'; current = entries
  assert.equal(parse(), true)
  assert.equal(reads, 3)
  data.patch = 'old'
  assert.deepEqual(service.getState().catalogSummary.afflictions, [])
  assert.equal(reads, 3)
})

test('国际服独立当前目录记录来源与审核证据，不等价规则保持未知', () => {
  assert.equal(base.server, 'international')
  assert.equal(base.patch, '3.30.0')
  assert.equal(base.versionEvidence.sentinel, 'Covens v3.30')
  assert.ok(base.sources.every(source => /^[a-f0-9]{64}$/.test(source.sha256)))
  assert.equal(base.entries.filter(entry => ['boon','affliction'].includes(entry.kind) && entry.rules.every(Boolean)).length, 114)
  for (const name of ['Gold Trophy','Orb of Negation','Gold Magnet','Charred Coin','Wooden Effigy','Hungry Fangs','Voodoo Doll','Enchanted Urn','Unholy Urn']) {
    const unsupported = base.entries.find(entry => entry.name === name)
    assert.equal(unsupported.ruleSupport,'unsupported',name)
    assert.deepEqual(unsupported.rules,[null],name)
    assert.ok(unsupported.reviewEvidence.reason,name)
  }
  assert.equal(new Set(base.entries.map(entry => entry.id)).size, base.entries.length)
  assert.equal(isCurrentSanctumEntry(base, base.entries[0]), true)
  assert.equal(isCurrentSanctumEntry({ ...base, patch: '3.29' }, base.entries[0]), false)
  assert.equal(isCurrentSanctumEntry({ ...base, versionEvidence: null }, base.entries[0]), false)
  assert.equal(resolveSanctumCatalogText(base, 'affliction', 'Ghastly Scythe').reason, 'AMBIGUOUS')
})

test('相同英文、受管简繁正文得到相同房型、恢复值和效果，保留原文', () => {
  const data = catalog()
  for (const texts of [['Contains Fountain','Recover 25 Resolve'], ['包含喷泉','恢复 25 点坚毅'], ['包含噴泉','恢復 25 點堅毅']]) {
    const result = parseSanctumRoomTexts(texts, data)
    assert.equal(result.type, 'fountain')
    assert.equal(result.recovery, 25)
    assert.ok(result.rawText.includes(texts[0]))
  }
  for (const text of ['Cannot recover Resolve','不能恢复坚毅','無法恢復堅毅']) {
    const result = parseStatusTooltip({ texts:[text], status:'located' },data)
    assert.equal(result.effectGroup.entries[0].effects[0].rule, 'cannotRecover')
    assert.equal(result.effectGroup.complete, true)
    assert.equal(parseSanctumCurrentEffects([text], data, true)[0].rule, 'cannotRecover')
  }
})

test('当前汉化撤销或歧义不会沿用旧别名，国际服不借国服规则解析未知中文', () => {
  let revision = 'a', current = entries
  const data = createLocalizedSanctumCatalog(base, { entriesProvider: () => current, revisionProvider: () => revision })
  assert.equal(parseStatusTooltip({ texts:['不能恢复坚毅'],status:'located' },data).effectGroup.complete,true)
  revision = 'b'; current = []
  assert.equal(parseStatusTooltip({ texts:['不能恢复坚毅'],status:'located' },data).effectGroup.complete,false)
  assert.equal(parseSanctumCurrentEffects(['不能恢复坚毅'],data,true)[0].status,'unknown')
  current = [...entries,entry('other','Other unmatched effect','無法恢復堅毅','不能恢复坚毅')]; revision='c'
  assert.equal(parseStatusTooltip({ texts:['不能恢复坚毅'],status:'located' },data).effectGroup.complete,false)
  revision=''; current=entries
  assert.equal(data.normalizeText('不能恢复坚毅'),'不能恢复坚毅')
  assert.equal(data.entries.find(entry=>entry.name==='Demonic Skull').aliases.includes('恶魔头骨'),false)
  assert.deepEqual(data.nativeText().offers,['Offers Items on Completion'])
})

test('英文奖励领取、稳定通货图标和英文资源数值进入相同结构', () => {
  const data = catalog()
  const result = parseSanctumRoomTexts(['Receive 4x Chaos Orb on completing the Sanctum'],data)
  assert.deepEqual(result.rewards,[{groupId:'offer',currency:'Chaos Orb',quantity:4,timing:'run'}])
  const icons = normalizeSanctumEvidence({currencyIcons:[{currency:'混沌石',key:'chaos-orb',confidence:1}]},data)
  assert.equal(icons.currencyIcons[0].currency,'Chaos Orb')
  const status = parseStatusTooltip({texts:['Receive 4x Chaos Orb on completing the Sanctum'],status:'located'},data)
  assert.equal(status.hasRewardContext,true)
  assert.equal(status.effectGroup,null)
  const wrapped = parseStatusTooltip({texts:['Receive 4x','Chaos Orb','on completing the Sanctum'],status:'located'},data)
  assert.equal(wrapped.hasRewardContext,true);assert.equal(wrapped.effectGroup,null)
  const mixed = parseStatusTooltip({texts:['+100 to Inspiration','Receive 4x','Chaos Orb','on completing the Sanctum'],status:'located'},data)
  assert.equal(mixed.effectGroup.entries[0].effects[0].rule,'gainInspiration')
  assert.equal(mixed.hasRewardContext,true)
  const floor = {identityConfirmed:true,runId:'run',floorId:'floor:0',currentRoomId:'room'}
  const reads = {hudResourcesRegion:{status:'located',texts:['Resolve: 150/300','Inspiration: 20']}}
  const resources = parseResourceRegions(reads,floor,data)
  assert.equal(resources.resolve,150);assert.equal(resources.maxResolve,300);assert.equal(resources.inspiration,20)
  const traditional = parseResourceRegions({hudResourcesRegion:{status:'located',texts:['堅毅: 150/300','啟迪: 20']}},floor,data)
  assert.equal(traditional.resolve,150);assert.equal(traditional.inspiration,20)
})

test('英文研究文本读取资源和未绑定效果，不根据研究文本虚构当前楼层', () => {
  const value = parseSanctumResearch('Item Class: Sanctum Research\nRarity: Rare\nSanctum Research\n--------\nArea Level: 83\nResolve: 200/300\nInspiration: 10\nAureus: 123\nMinor Afflictions: Demonic Skull',catalog())
  assert.equal(value.status,'parsed');assert.equal(value.coins,123);assert.deepEqual(value.resolve,{current:200,maximum:300})
  assert.equal(value.effects[0].rawText,'Demonic Skull');assert.equal(value.bindingStatus,'unconfirmed')
})

test('国际服目录生成拒绝错误赛季、缺表和中英数值结构冲突', () => {
  const html = language => `<a title="Covens v3.30"></a>${[[language==='en'?'Boon':'恩赐','boon'],['Affliction','affliction'],['Rooms','room']].map(([id,kind])=>`<section id="${id}"><div><img alt="${kind}"><div class="flex-grow-1">${kind}<div>${language==='en'?'Minor Boons':'次要恩赐'}</div><div class="explicitMod">${language==='en'?'100% more Damage':'伤害总增100%'}</div></div></div></section>`).join('')}<section id="Rewards"><table><tbody><tr><td><a href="Chaos_Orb">Chaos Orb</a></td></tr></tbody></table></section>`
  const options = {englishHtml:html('en'),chineseHtml:html('cn'),fetchedAt:'2026-11-15T00:00:00Z'}
  assert.ok(createInternationalSanctumCatalog(options).entries.length)
  assert.throws(()=>createInternationalSanctumCatalog({...options,patch:'3.29'}),/版本/)
  assert.throws(()=>createInternationalSanctumCatalog({...options,englishHtml:options.englishHtml.replace('Covens v3.30','old')}),/赛季标识/)
  assert.throws(()=>createInternationalSanctumCatalog({...options,chineseHtml:options.chineseHtml.replaceAll('100','200')}),/数值不一致/)
})

test('相同图标、相同数字但英文否定或触发条件变化不会自动通过审核', () => {
  const html = (language, description) => `<a title="Covens v3.30"></a><section id="${language==='en'?'Boon':'恩赐'}"><div><img alt="unknown"><div class="flex-grow-1">Unknown<div class="explicitMod">Unknown</div></div></div></section><section id="Affliction"><div><img alt="CurseDemonicSkullIcon"><div class="flex-grow-1">${language==='en'?'Demonic Skull':'恶魔颅骨'}<div>${language==='en'?'Major Afflictions':'主要痛苦'}</div><div class="explicitMod">${description}</div></div></div></section><section id="Rooms"><div class="flex-grow-1">Room</div></section><section id="Rewards"><table><tbody><tr><td><a href="Chaos_Orb">Chaos Orb</a></td></tr></tbody></table></section>`
  const options = { englishHtml:html('en','Cannot recover Resolve'), chineseHtml:html('cn','不能恢复坚毅'), fetchedAt:'2026-11-15T00:00:00Z' }
  const reviewed = createInternationalSanctumCatalog(options).entries.find(entry=>entry.name==='Demonic Skull')
  assert.equal(reviewed.rules[0].rule,'cannotRecover')
  for (const text of ['Can recover Resolve','Cannot recover Resolve after completing a room']) {
    const changed = createInternationalSanctumCatalog({...options,englishHtml:html('en',text)}).entries.find(entry=>entry.name==='Demonic Skull')
    assert.equal(changed.applicability,'unverified')
    assert.deepEqual(changed.rules,[null])
  }
})

test('Python英文及当前受管繁体奖励提示触发图标补读，普通正文不触发', () => {
  const result = runPython(`import sys,json\nsys.path.insert(0,'src/assets/scripts')\nfrom sanctum_ocr import has_currency_offer\nprint(json.dumps([has_currency_offer(['Offers Items on Completion']),has_currency_offer(['完成後提供物品'],{'offers':['完成後提供物品']}),has_currency_offer(['Cannot recover Resolve'])]))`)
  assert.deepEqual(result,[true,true,false])
})
})()

// === Merged from sanctumBounded.test.js ===
await (async () => {
  const sanctumError = _m1_sanctumError
  const test = _m1_test
  const assert = _m1_assert
  const fs = _m1_fs
  const os = _m1_os
  const path = _m1_path
  const SanctumCapture = _m1_SanctumCapture
  const SanctumService = _m1_SanctumService
  const SanctumRepository = _m1_SanctumRepository
  const AutomationLock = _m1_AutomationLock
  const runPython = _m1_runPython
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
})()

// === Merged from sanctumCalibration.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const fs = _m2_fs
  const os = _m2_os
  const path = _m2_path
  const validateSanctumCalibration = _m2_validateSanctumCalibration
  const bindSanctumCalibration = _m2_bindSanctumCalibration
  const SanctumService = _m2_SanctumService
  const SanctumRepository = _m2_SanctumRepository
  const listSanctumSamples = _m2_listSanctumSamples
  const replaySanctumSample = _m2_replaySanctumSample
  const runPython = _m2_runPython
const sample = listSanctumSamples().find(item => item.id === 'vault-progress.png')
const imageSize = [sample.crop[2] - sample.crop[0], sample.crop[3] - sample.crop[1]]
const calibration = () => ({ version: 1, scope: 'sample', sampleId: sample.id, imageSize,
  region: [0, 0, ...imageSize], roomSize: null, pathHsv: [[12, 95, 42], [40, 255, 255]] })

test('校准参数严格校验边界，不能携带实机确认或伪造 DPI', () => {
  const value = validateSanctumCalibration({ ...calibration(), dpi: 144, liveValidated: true })
  assert.equal(value.dpi, null)
  assert.equal(value.liveValidated, false)
  for (const patch of [{ region: [1, 0, ...imageSize] }, { region: [0, 0, 0, 0] }, { roomSize: [1, 1] },
    { pathHsv: [[180, 0, 0], [255, 255, 255]] }, { pathHsv: [[30, 0, 0], [20, 255, 255]] },
    { scope: 'live' }, { imageSize: [NaN, 100] }, { sampleId: '../a.png' }]) {
    assert.throws(() => validateSanctumCalibration({ ...calibration(), ...patch }))
  }
  assert.throws(() => bindSanctumCalibration(calibration(), { ...sample, crop: [0, 0, 100, 100] }), /尺寸已变化/)
  assert.throws(() => bindSanctumCalibration(calibration(), { ...sample, id: 'other.png' }), /样本/)
})

test('校准保存、重启与清除贯穿回放服务，尺寸变化时不调用识别器', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-calibration-'))
  let service
  try {
    const repository = new SanctumRepository(root)
    const calls = []
    const options = { repository, samples: () => [sample], replay: async (_id, options) => { calls.push(options); return { rooms: [], edges: [] } } }
    service = new SanctumService(options)
    assert.throws(() => service.calibrate(calibration()), /未启用/)
    service.setEnabled(true)
    service.calibrate(calibration())
    await service.rescan(sample.id)
    assert.deepEqual(calls[0].calibration, validateSanctumCalibration(calibration()))
    assert.equal(service.getState().recommendation, null)
    await service.shutdown()
    service = new SanctumService(options)
    assert.equal(service.getState().running, false)
    assert.deepEqual(service.getState().calibration[sample.id], calls[0].calibration)
    service.setEnabled(true)
    service.samples = () => [{ ...sample, crop: [0, 0, 100, 100] }]
    await service.rescan(sample.id)
    assert.equal(calls.length, 1)
    assert.match(service.getState().reason, /尺寸已变化/)
    service.samples = options.samples
    service.clearCalibration(sample.id)
    await service.rescan(sample.id)
    assert.equal(calls[1].calibration, null)
    assert.deepEqual(repository.load().calibration, {})
  } finally {
    await service?.shutdown()
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('校准保存取消旧回放，迟到图像不能覆盖新参数状态', async () => {
  let resolve, signal
  const service = new SanctumService({ samples: () => [sample], replay: (_id, options) => {
    signal = options.signal; return new Promise(done => { resolve = done })
  } })
  service.setEnabled(true)
  const run = service.rescan(sample.id)
  service.calibrate(calibration())
  assert.equal(signal.aborted, true)
  resolve({ rooms: [{ id: 'late' }] })
  await run
  assert.equal(service.getState().floor, null)
  assert.equal(service.getState().running, false)
  await service.shutdown()
})

test('真实宝库样本默认校准保持识别结果，区域和房间尺寸实际参与识别，失配保持未知', () => {
  const results = runPython(`
import sys,json,copy
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import analyze_floor,load_image
image=load_image('test/fixtures/sanctum/vault-progress.png')
base=json.loads(${JSON.stringify(JSON.stringify(calibration()))})
automatic=analyze_floor(image)
default=analyze_floor(image,base)
room=copy.deepcopy(base); room['roomSize']=[automatic['rooms'][0]['width'],automatic['rooms'][0]['height']]
region=copy.deepcopy(base); region['region']=[0,0,100,100]
wrong_room=copy.deepcopy(base); wrong_room['roomSize']=[24,24]
wrong_size=copy.deepcopy(base); wrong_size['imageSize']=[100,100]
wrong_hsv=copy.deepcopy(base); wrong_hsv['pathHsv']=[[200,0,0],[255,255,255]]
no_gold=copy.deepcopy(base); no_gold['pathHsv']=[[90,255,255],[90,255,255]]
print(json.dumps([automatic,default,analyze_floor(image,room),analyze_floor(image,region),analyze_floor(image,wrong_room),analyze_floor(image,wrong_size),analyze_floor(image,wrong_hsv),analyze_floor(image,no_gold)]))
`)
  const [automatic, normal, room, region, wrongRoom, wrongSize, wrongHsv, noGold] = results
  assert.deepEqual(normal, automatic)
  assert.equal(room.rooms.length, 27)
  for (const value of [region, wrongRoom, wrongSize, wrongHsv]) {
    assert.equal(value.status, 'unknown')
    assert.deepEqual(value.rooms, [])
  }
  assert.ok(normal.edges.some(edge => edge.availability === 'gold'))
  assert.equal(noGold.edges.some(edge => edge.availability === 'gold'), true) // 校准不能排除基础金线证据
})

test('真实回放命令传递校准，并拒绝绑定其他样本', async () => {
  const result = await replaySanctumSample(sample.id, { calibration: { ...calibration(), region: [0, 0, 100, 100] } })
  assert.equal(result.status, 'unknown')
  assert.deepEqual(result.rooms, [])
  await assert.rejects(replaySanctumSample('vault-entry.png', { calibration: calibration() }), /样本或尺寸/)
})
})()

// === Merged from sanctumCalibrationCollection.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const SanctumCalibrationEditor = _m3_SanctumCalibrationEditor
  const SanctumCalibrationCollection = _m3_SanctumCalibrationCollection
  const SanctumService = _m3_SanctumService
  const COLLECTION_KEYS = _m3_COLLECTION_KEYS
  const runPython = _m3_runPython
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
const env = { width:1920,height:1080,dpi:96,windowId:'12',processId:13 }
const rect = { x:100,y:100,width:100,height:150 }
function fixture() {
  const service=new SanctumService({}); service.setEnabled(true)
  let environment={...env}, visible=true, failure=false, saveFailure=false, canceled=false
  const titles={}, requests=[], crops=[]
  const editor=new SanctumCalibrationEditor({service,
    detection:{getTitleConfig:()=>({templates:titles}),setTitle:async(key,value)=>{
      if(failure){failure=false;throw new Error('template failed')}
      if(value)titles[key]=value;else delete titles[key]
    }},
    nativeImage:{createFromBuffer:()=>({getSize:()=>({width:environment.width,height:environment.height}),crop:r=>{
      crops.push(r);return {toPNG:()=>Buffer.from(png,'base64'),toBitmap:()=>Buffer.from([20,150,230,255])}
    }})},
    withScreenshotHidden:async fn=>{visible=false;try{return await fn()}finally{visible=true}}
  })
  service.calibrationEditor=editor
  const persist=service.persist.bind(service)
  service.persist=()=>{if(saveFailure){saveFailure=false;throw new Error('disk failed')}return persist()}
  const collection=new SanctumCalibrationCollection(editor,{makeClient:()=>({
    request:async(command,_input,{signal})=>{
      requests.push(command);signal.throwIfAborted()
      if(command==='configure'){assert.equal(visible,true);return {configured:true}}
      if(command==='analyzeCalibrationFrame'){assert.equal(visible,true);if(canceled)editor.cancel();return {candidates:[{key:'mapRegion',region:rect}],message:'review'}}
      assert.equal(visible,false)
      return {environment,clientBounds:{x:-1920,y:0,width:environment.width,height:environment.height},png}
    },shutdown:async()=>{}
  })})
  editor.collection=collection
  return {collection,editor,service,titles,requests,crops,environment:value=>{environment={...environment,...value}},
    templateFail:()=>{failure=true},diskFail:()=>{saveFailure=true},cancel:()=>{canceled=true}}
}
async function collect(f,keys){
  const draft=await f.collection.capture()
  return f.collection.confirm({id:draft.id,frameId:draft.current.id,selections:keys.map(key=>({key,region:rect}))})
}
test('隐藏时只截图一次，恢复后分析，草稿不进入业务状态',async()=>{
  const f=fixture(),draft=await f.collection.capture()
  assert.deepEqual(f.requests,['configure','environment','captureCalibrationFrame','analyzeCalibrationFrame'])
  assert.equal(f.service.state.liveCalibration,null)
  assert.equal(draft.current.candidates[0].key,'mapRegion');assert.equal(f.editor.picking,false)
})
test('两张截图可逆序补齐十一项，部分保存后继续收集',async()=>{
  for(const groups of [[COLLECTION_KEYS.slice(8),COLLECTION_KEYS.slice(0,8)],[COLLECTION_KEYS.slice(0,8),COLLECTION_KEYS.slice(8)]]){
    const f=fixture();let draft=await collect(f,groups[0]);await f.collection.save({id:draft.id})
    draft=await collect(f,groups[1]);assert.equal(Object.keys(draft.items).length,11)
    await f.collection.save({id:draft.id});assert.equal(Object.keys(f.collection.view().items).length,11)
    assert.equal(Object.keys(f.titles).length,3);assert.ok(f.service.state.liveCalibration.calibration.pathHsv)
  }
})
test('重复默认保留，显式替换生效，旧截图与越界不能确认',async()=>{
  const f=fixture();await collect(f,['mapRegion'])
  let draft=await f.collection.capture(),input={id:draft.id,frameId:draft.current.id,selections:[{key:'mapRegion',region:{...rect,x:200}}]}
  assert.throws(()=>f.collection.confirm({...input,frameId:'old'}),/截图已更新/)
  assert.throws(()=>f.collection.confirm({...input,selections:[{key:'roomSize',region:{...rect,x:1920}}]}),/越界/)
  draft=f.collection.confirm(input);assert.equal(draft.items.mapRegion.region.x,100)
  draft=await f.collection.capture()
  draft=f.collection.confirm({...input,frameId:draft.current.id,selections:[{...input.selections[0],replace:true}]})
  assert.equal(draft.items.mapRegion.region.x,200)
})
test('窗口进程尺寸 DPI 隔离；取消保留确认项；丢弃不修改配置',async()=>{
  for(const changed of [{windowId:'99'},{processId:99},{width:2000},{dpi:144}]){
    const f=fixture(),before=await collect(f,['mapRegion']);f.environment(changed)
    await assert.rejects(f.collection.capture(),/不一致/);assert.deepEqual(f.collection.view().items,before.items)
  }
  const f=fixture();await collect(f,['mapRegion']);const draft=await f.collection.capture()
  assert.equal(f.collection.discard({id:draft.id}).items.mapRegion.region.x,100)
  f.cancel();await assert.rejects(f.collection.capture());assert.equal(f.editor.picking,false)
  assert.ok(f.collection.view().items.mapRegion);f.collection.discard({id:draft.id,all:true});assert.equal(f.service.state.liveCalibration,null)
})
test('模板或存储失败回滚并保留草稿可重试',async()=>{
  for(const fail of ['templateFail','diskFail']){
    const f=fixture();let draft=await collect(f,['sanctum-map','mapRegion']);await f.collection.save({id:draft.id})
    const old=structuredClone(f.service.state.liveCalibration),titles=structuredClone(f.titles)
    draft=await collect(f,['sanctum-map-entry','hudResourcesRegion']);f[fail]()
    await assert.rejects(f.collection.save({id:draft.id}));assert.deepEqual(f.service.state.liveCalibration,old);assert.deepEqual(f.titles,titles)
    assert.equal(f.collection.view().dirty,true);await f.collection.save({id:draft.id});assert.ok(f.titles['sanctum-map-entry'])
  }
})
test('运行中拒绝修改，外部校准变化不会被旧草稿覆盖',async()=>{
  const f=fixture(),draft=await collect(f,['mapRegion']);f.service.state.running=true
  await assert.rejects(f.collection.capture(),/运行中/);f.service.state.running=false
  f.titles['sanctum-map']={environment:env,png,region:rect}
  await assert.rejects(f.collection.save({id:draft.id}),/发生变化/)
})
test('先单独保存路径样本，后续补齐地图时仍保留颜色参数',async()=>{
  const f=fixture();let draft=await collect(f,['pathColor']);await f.collection.save({id:draft.id})
  assert.ok(f.collection.view().items.pathColor.pathHsv)
  draft=await collect(f,['mapRegion','roomSize']);await f.collection.save({id:draft.id})
  assert.ok(f.service.state.liveCalibration.calibration.pathHsv)
})
test('同环境部分保存不删除旧版仅有坐标的配置',async()=>{
  const f=fixture()
  f.service.state.liveCalibration={version:6,environment:{width:1920,height:1080,dpi:96},mapRegion:{...rect,width:800,height:600},captures:{},calibration:{roomSize:[50,80],pathHsv:[[12,95,42],[40,255,255]]}}
  const draft=await collect(f,['coinsRegion']);await f.collection.save({id:draft.id})
  assert.equal(f.service.state.liveCalibration.mapRegion.width,800)
  assert.deepEqual(f.service.state.liveCalibration.calibration.roomSize,[50,80])
})
test('原生整帧采集仅截图一次，环境变化拒绝返回',()=>{
  const result=runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
out=[]
for changed in (False,True):
    session=object.__new__(NativeSession)
    count=[0]
    before={'environment':{'width':100,'height':100,'dpi':96},'clientBounds':{'x':0,'y':0,'width':100,'height':100}}
    def check(): return before
    def image():
        count[0]+=1
        current={**before,'environment':{**before['environment'],'dpi':144}} if changed else before
        return np.zeros((100,100,3),dtype=np.uint8),current
    session.check=check;session.image=image
    try:
        frame=session.dispatch('captureCalibrationFrame',{})
        out.append({'count':count[0],'png':frame['png'].startswith('iVBOR')})
    except NativeError:out.append({'count':count[0],'rejected':True})
print(json.dumps(out))
`)
  assert.deepEqual(result,[{count:1,png:true},{count:1,rejected:true}])
})
test('原图与缩放客户区补齐元素，空图不产生候选',{timeout:180000},()=>{
  const results=runPython(`
import sys,json,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_calibration_collection import analyze_calibration
out=[]
for number in (1,2):
    image=cv2.imdecode(np.fromfile('src/assets/images/sanctum-calibration/example-%d.png'%number,dtype=np.uint8),1)
    if number==2: image=image[33:]
    for scale in (1,.5):
        frame=cv2.resize(image,None,fx=scale,fy=scale)
        out.append(analyze_calibration(frame)['candidates'])
out.append(analyze_calibration(np.zeros((600,1000,3),dtype=np.uint8),lambda image: ([],None))['candidates'])
print(json.dumps(out))
`,{timeout:170000})
  for(const index of [0,1]){
    assert.deepEqual([...new Set([...results[index],...results[index+2]].map(item=>item.key))].sort(),[...COLLECTION_KEYS].sort())
    assert.ok(results[index].every(item=>item.region.width>0&&item.region.height>0))
  }
  assert.deepEqual(results[4],[])
})
})()

// === Merged from sanctumCalibrationEditor.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const fs = _m4_fs
  const os = _m4_os
  const path = _m4_path
  const SanctumCalibrationEditor = _m4_SanctumCalibrationEditor
  const SanctumService = _m4_SanctumService
  const SanctumRepository = _m4_SanctumRepository
  const InterfaceTitleRegistry = _m4_InterfaceTitleRegistry
  const runPython = _m4_runPython
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
const env = { width: 1920, height: 1080, dpi: 144 }
function fixture() {
  const service = new SanctumService({})
  service.setEnabled(true)
  let cancel = false, fail = false, changed = false, reads = 0, options, rect = { left: -1800, top: 100, right: -1300, bottom: 500 }
  service.liveDriver = { inspectEnvironment: async () => ({ environment: { ...env, dpi: changed && ++reads > 1 ? 96 : 144 }, clientBounds: { x: -1920, y: 0, width: 1920, height: 1080 } }) }
  const titles = {}, crops = []
  const nativeImage = { createFromBuffer: () => ({ getSize: () => ({ width: 500, height: 400 }), crop: r => { crops.push(r); return { toPNG: () => Buffer.from(png, 'base64'), toBitmap: () => Buffer.from([30, 120, 200, 255]) } } }) }
  const editor = new SanctumCalibrationEditor({ service, nativeImage, withHidden: action => action(),
    detection: { getTitleConfig: () => ({ templates: titles, threshold: .8 }), setTitle: async (key, value) => { if (value) titles[key] = value; else delete titles[key] } },
    picker: async input => { options = input; await input.beforeCapture(); await input.afterCapture();
      if (cancel) return { canceled: true }
      if (fail) return { success: false }
      return { success: true, selectedRegion: rect, png: Buffer.from(png, 'base64'), displayId: 'left', scaleFactor: 1.5, displayPhysicalBounds: { x: -1920, y: 0, width: 1920, height: 1080 } }
    } })
  service.calibrationEditor = editor
  return { service, editor, titles, crops, get options() { return options }, cancel: () => { cancel = true }, fail: () => { fail = true }, change: () => { changed = true; reads = 0 }, rect: value => { rect = value } }
}

test('独立框选使用真实负坐标客户区和 DPI，取消与失败保持旧配置', async () => {
  for (const failure of ['cancel', 'fail', 'change']) {
    const f = fixture()
    await f.editor.capture('mapRegion')
    assert.equal(f.service.state.liveCalibration.mapRegion.x, 120)
    assert.equal(f.service.state.liveCalibration.environment.dpi, 144)
    await f.editor.capture('effectIconsRegion')
    const before = structuredClone(f.service.state.liveCalibration)
    f[failure]()
    if (failure === 'cancel') await f.editor.capture('mapRegion')
    else await assert.rejects(f.editor.capture('mapRegion'))
    assert.deepEqual(f.service.state.liveCalibration, before)
    await f.editor.clear('effectIconsRegion')
    assert.ok(f.service.state.liveCalibration.captures.mapRegion)
    assert.equal(f.service.state.liveCalibration.captures.effectIconsRegion, undefined)
  }
})

test('公共标题独立保存和清除，不复制进圣所区域配置', async () => {
  const f = fixture()
  await f.editor.capture('sanctum-map')
  assert.equal(Object.keys(f.titles).length, 1)
  assert.equal(f.service.state.liveCalibration, null)
  await f.editor.clear('sanctum-map')
})

test('三个资源选区独立保存清除，重新框选取消不影响已有资源', async () => {
  const f = fixture()
  for (const [index, key] of ['coinsRegion','mapResourcesRegion','hudResourcesRegion'].entries()) {
    f.rect({left:-1800+index*100,top:100,right:-1750+index*100,bottom:125})
    await f.editor.capture(key)
  }
  const before = structuredClone(f.service.state.liveCalibration)
  assert.equal(before.version,6)
  assert.deepEqual([before.coinsRegion.x,before.mapResourcesRegion.x,before.hudResourcesRegion.x],[120,220,320])
  f.cancel()
  await f.editor.capture('coinsRegion')
  assert.deepEqual(f.service.state.liveCalibration,before)
  await f.editor.clear('mapResourcesRegion')
  assert.equal(f.service.state.liveCalibration.mapResourcesRegion,undefined)
  assert.equal(f.service.state.liveCalibration.captures.mapResourcesRegion,undefined)
  assert.deepEqual(f.service.state.liveCalibration.coinsRegion,before.coinsRegion)
  assert.deepEqual(f.service.state.liveCalibration.hudResourcesRegion,before.hudResourcesRegion)
})

test('运行中拒绝校准；紧急停止使迟到截图不保存', async () => {
  const f = fixture()
  f.service.state.running = true
  await assert.rejects(f.editor.capture('mapRegion'), /运行中/)
  assert.throws(() => f.editor.pathColor({}), /运行中/)
  f.service.state.running = false
  const original = f.editor.picker
  f.editor.picker = async options => { const result = await original(options); f.service.emergencyStop(); return result }
  await f.editor.capture('mapRegion')
  assert.equal(f.service.state.liveCalibration, null)
})

test('公共模板移动定位、独立界面及 DPI 失配使用同套匹配规则', () => {
  const result = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from interface_titles import match_titles
import cv2,base64
def png(image): return base64.b64encode(cv2.imencode('.png',image)[1]).decode()
env={'width':200,'height':100,'dpi':144}
rng=np.random.default_rng(42)
t=rng.integers(0,255,(10,25,3),dtype=np.uint8)
u=rng.integers(0,255,(10,25,3),dtype=np.uint8)
image=np.zeros((100,200,3),dtype=np.uint8); image[20:30,70:95]=t
templates={'sanctum-map':{'png':png(t),'environment':env},'sanctum-altar':{'png':png(u),'environment':env}}
found=match_titles(image,templates,env,.95)
print(json.dumps({'found':found,'wrong':match_titles(image,templates,{**env,'dpi':96},.95),'missing':match_titles(np.zeros_like(image),templates,env,.95)}))
`)
  assert.equal(result.found['sanctum-map'].templateId, 'sanctum-map')
  assert.deepEqual(result.found['sanctum-map'].region, { x: 70, y: 20, width: 25, height: 10 })
  assert.equal(result.found['sanctum-altar'], undefined)
  assert.deepEqual(result.wrong, {})
  assert.deepEqual(result.missing, {})
})

test('持久化失败恢复原校准，不留下半份配置', async () => {
  const f = fixture()
  await f.editor.capture('mapRegion')
  await f.editor.capture('sanctum-map')
  const previous = structuredClone(f.service.state), oldTitle = structuredClone(f.titles['sanctum-map'])
  f.service.repository = { save: () => { throw new Error('disk failure') } }
  f.rect({ left: -1700, top: 100, right: -1200, bottom: 500 })
  await assert.rejects(f.editor.capture('mapRegion'), /disk failure/)
  assert.deepEqual(f.service.state, previous)
  await assert.rejects(f.editor.capture('sanctum-map'), /disk failure/)
  assert.deepEqual(f.titles['sanctum-map'], oldTitle)
  assert.deepEqual(f.service.state, previous)
  await assert.rejects(f.editor.clear('sanctum-map'), /disk failure/)
  assert.deepEqual(f.titles['sanctum-map'], oldTitle)
})

test('截图取色生成 HSV，微调校验失败不会改变之前的颜色', async () => {
  const f = fixture()
  await f.editor.capture('mapRegion')
  await f.editor.capture('pathColor')
  f.editor.pathColor({ x: 5, y: 6 })
  const previous = structuredClone(f.service.state.liveCalibration)
  assert.equal(previous.calibration.pathHsv.length, 2)
  assert.throws(() => f.editor.pathColor({ pathHsv: [[180, 0, 0], [179, 255, 255]] }), /路径颜色/)
  assert.deepEqual(f.service.state.liveCalibration, previous)
})

test('单一地图标题优先新键，否则迁移首个有效旧键，保存清理旧键', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-title-migration-'))
  const file = path.join(dir, 'titles.json')
  try {
    const old = { png, environment: env, marker: 'old' }
    const fresh = { ...old, marker: 'new' }
    for (const [input, marker] of [
      [{ 'sanctum-map': fresh, 'sanctum-map-1': old }, 'new'],
      [{ 'sanctum-map': { png: 'invalid' }, 'sanctum-map-1': { png: 'invalid' }, 'sanctum-map-2': old, 'sanctum-map-3': fresh }, 'old'],
      [{ 'sanctum-map-4': old, 'sanctum-map-2': fresh }, 'new']
    ]) {
      fs.writeFileSync(file, JSON.stringify({ ...input, 'sanctum-altar': old }))
      const registry = new InterfaceTitleRegistry(file)
      assert.equal(registry.templates['sanctum-map'].marker, marker)
      assert.equal(registry.templates['sanctum-altar'],undefined)
      registry.set('sanctum-map-entry', old)
      const saved = JSON.parse(fs.readFileSync(file, 'utf8'))
      assert.deepEqual(Object.keys(saved).sort(), ['sanctum-map', 'sanctum-map-entry'])
      assert.equal(new InterfaceTitleRegistry(file).templates['sanctum-map'].marker, marker)
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
})

test('旧等级校准即使无效也被移除，其余校准可恢复与保存', async () => {
  const f = fixture(), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-level-migration-'))
  try {
    await f.editor.capture('mapRegion')
    const repo = new SanctumRepository(dir)
    repo.save(f.service.state)
    const raw = JSON.parse(fs.readFileSync(repo.file, 'utf8'))
    raw.liveCalibration.areaLevelRegion = { x: -100 }
    raw.liveCalibration.captures.areaLevelRegion = { png: 'invalid', environment: {} }
    fs.writeFileSync(repo.file, JSON.stringify(raw))
    const loaded = repo.load()
    assert.ok(loaded.liveCalibration.mapRegion)
    assert.equal(loaded.liveCalibration.areaLevelRegion, undefined)
    assert.equal(loaded.liveCalibration.captures.areaLevelRegion, undefined)
    repo.save(loaded)
    assert.equal(fs.readFileSync(repo.file, 'utf8').includes('areaLevelRegion'), false)
    await assert.rejects(f.editor.capture('areaLevelRegion'), /未知校准/)
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
})
})()

// === Merged from sanctumDarkSceneEffect.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const fs = _m5_fs
  const runPython = _m5_runPython
  const parseStatusTooltip = _m5_parseStatusTooltip
const catalog=JSON.parse(fs.readFileSync('electron/assets/sanctum/catalog.json','utf8'))

// Real dark-room frames supplied by the user (see status-dark-evidence.md):
// the tooltip body is barely darker than the scene, so absolute thresholds
// find nothing. Baseline darkening must locate both panels.
test('暗场景状态栏两浮窗：基线变暗定位成功并完整分流，入口坐标复现',()=>{
  const results=runPython(`
import sys,json,base64
sys.path.insert(0,'src/assets/scripts')
import cv2,numpy as np
from sanctum_recognition import load_image
from sanctum_tooltip import locate_content,icon_candidates
from sanctum_ocr import create_sanctum_ocr_engine,read_frozen
base=load_image('test/fixtures/sanctum/status-dark-base.png')
h,w=base.shape[:2]
region={'x':int(w*.38),'y':int(h*.72),'width':int(w*.24),'height':int(h*.22)}
icons=icon_candidates(base[region['y']:region['y']+region['height'],region['x']:region['x']+region['width']])
points=[{'x':i['x']+region['x'],'y':i['y']+region['y']} for i in icons]
engine=create_sanctum_ocr_engine();out=[]
for name,pt in (('status-dark-afflictions-hover',points[0]),('status-dark-rewards-hover',points[1])):
  img=load_image('test/fixtures/sanctum/'+name+'.png')
  for width in (1920,2560,3072,3840):
    size=(width,round(img.shape[0]*width/img.shape[1]));scale=width/img.shape[1]
    b=cv2.resize(base,size,interpolation=cv2.INTER_AREA)
    f=cv2.resize(img,size,interpolation=cv2.INTER_AREA)
    result=locate_content(b,f,(pt['x']*scale,pt['y']*scale))
    assert result['status']=='located',(name,width,result)
    r=result['region']
    ok,png=cv2.imencode('.png',f[r['y']:r['y']+r['height'],r['x']:r['x']+r['width']],[cv2.IMWRITE_PNG_COMPRESSION,1])
    read=read_frozen(dict(png=base64.b64encode(png).decode('ascii'),region=dict(x=0,y=0,width=r['width'],height=r['height']),room=False,includeIcons=False),engine)
    out.append(dict(name=name,width=width,point=pt,
      region={k:round(v/scale) for k,v in r.items()},texts=read['texts']))
print(json.dumps(dict(points=points,results=out),ensure_ascii=False))`)
  // The calibrated status-bar crop finds exactly the two hovered entrances.
  assert.equal(results.points.length,2)
  for(const point of results.points){
    assert.ok(point.x>780&&point.x<980,JSON.stringify(point))
    assert.ok(point.y>780&&point.y<900,JSON.stringify(point))
  }
  const byName={}
  for(const result of results.results){
    byName[result.name]??=[]
    byName[result.name].push(result)
    // Every width maps back to the same native rectangle within a few pixels.
    assert.ok(Math.abs(result.region.x-(result.name.includes('rewards')?730:634))<5,JSON.stringify(result))
    assert.ok(Math.abs(result.region.y-(result.name.includes('rewards')?673:450))<5,JSON.stringify(result))
    assert.ok(Math.abs(result.region.width-(result.name.includes('rewards')?410:452))<8,JSON.stringify(result))
    assert.ok(Math.abs(result.region.height-(result.name.includes('rewards')?149:372))<8,JSON.stringify(result))
  }
  for(const result of byName['status-dark-afflictions-hover']){
    const {effectGroup,hasRewardContext}=parseStatusTooltip({status:'located',texts:result.texts},catalog)
    assert.equal(hasRewardContext,false)
    assert.equal(effectGroup.complete,true)
    assert.deepEqual(effectGroup.entries.map(e=>e.name),['黑暗深坑','焦化硬币','钱包过满','巫毒人偶','弱化血肉'])
    assert.ok(effectGroup.entries.every(e=>e.category==='minorAffliction'))
  }
  for(const result of byName['status-dark-rewards-hover']){
    const {effectGroup,hasRewardContext}=parseStatusTooltip({status:'located',texts:result.texts},catalog)
    assert.equal(effectGroup,null)
    assert.equal(hasRewardContext,true)
  }
})

test('暗场景变暗候选拒绝静止区域与画面外噪声',()=>{
  const checks=runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
import cv2,numpy as np
from sanctum_recognition import load_image
from sanctum_tooltip import changed_panel_boundary
base=load_image('test/fixtures/sanctum/status-dark-base.png')
before=cv2.cvtColor(base,cv2.COLOR_BGR2GRAY).astype(np.int16)
darkened=before-cv2.cvtColor(base,cv2.COLOR_BGR2GRAY).astype(np.int16)>6
# static scene, zero darkening: no rectangle may pass as a new panel
still=changed_panel_boundary(base,base,dict(x=730,y=673,width=410,height=150),darkened)
print(json.dumps([still]))`)
  assert.equal(checks[0],false)
})
})()

// === Merged from sanctumDynamic.test.js ===
await (async () => {
  const SEASON_BASELINE = _m6_SEASON_BASELINE
  const sanctumError = _m6_sanctumError
  const test = _m6_test
  const assert = _m6_assert
  const readFileSync = _m6_readFileSync
  const SanctumLiveDriver = _m6_SanctumLiveDriver
  const parseSanctumEffectGroup = _m6_parseSanctumEffectGroup
  const parseSanctumRoomTexts = _m6_parseSanctumRoomTexts
  const liveProfile = _m6_liveProfile
  const AutomationLock = _m6_AutomationLock
  const sanctumLogEvents = _m6_sanctumLogEvents
  const runPython = _m6_runPython
  const SanctumCapture = _m6_SanctumCapture
  const createLocalizedSanctumCatalog = _m6_createLocalizedSanctumCatalog
const environment = { windowId: 'game', processId: 123, width: 1000, height: 800, dpi: 96 }
const region = { x: 0, y: 0, width: 800, height: 500 }, png = 'iVBORw0KGgoAAA='
const profile = () => liveProfile({ version: 3, environment, mapRegion: region, effectIconsRegion: region, mapEffectIconsRegion: region,
  captures: Object.fromEntries(['mapRegion', 'effectIconsRegion', 'mapEffectIconsRegion'].map(key => [key, { png, environment, region }])) })
const catalog = {schemaVersion:1,game:'poe1',patch:SEASON_BASELINE.patch,sources:[{id:'test',channel:'official'}],entries:[
  ['a','affliction','minor','不能恢复坚毅'],['b','affliction','major','不能获得恩赐'],
  ['c','boon','major','圣所地图现在完全显示了'],['d','boon','minor','你在禁域地图上看到的房间增加一个']
].map(([id,kind,tier,description])=>({id,kind,tier,name:'词条'+id,descriptions:[description],sourceId:'test',applicability:'current',reviewedPatch:SEASON_BASELINE.patch}))}
const signal = () => new AbortController().signal

function fixture(t, initial = 'map') {
  let mode = initial, time = 0
  const log = sanctumLogEvents(), lock = new AutomationLock(), commands = [], hooks = {}
  const frame = () => ({ environment, fingerprint: 'map', mapFingerprint: 'map', timestamp: time += 400,
    foreground: true, userTakeover: false, mapOpen: true, interfaceMatched: true,
    floor: { currentRoomId:'a',positionStatus:'confirmed',rooms: [{id:'a',column:0,row:0}], edges: [] } })
  const driver = new SanctumLiveDriver({ catalog, withHidden: async action => action(), clientEvents: log.events, wait: async () => {},
    windowActivation: { async activateGame() { return { success: true } } },
    detection: { getTitleConfig: () => ({ threshold: .8, templates: { 'sanctum-map': { png, environment }, 'sanctum-map-hud': { png, environment } } }),
      registerConsumer: async () => {}, unregisterConsumer() {}, subscribe: () => () => {},
      getState: () => ({ running: true, foreground: true, receivedAt: Date.now(), interfaces: {
        'sanctum-map': { matched: mode === 'map' }, 'sanctum-hud': { matched: mode === 'effects' } } }) },
    makeClient: () => ({ shutdown: async () => {}, abort() {}, async request(command, input) {
      commands.push(command)
      if (hooks[command]) return hooks[command](input)
      if (command === 'prepareFrames') return {count:8}
      if (command === 'freezeBaseline') return {baselineVersion:1}
      if (command === 'environment' || command === 'arm') return { environment }
      if (command === 'interfaceState') return { environment, mapOpen: mode !== 'effects', hudVisible: mode !== 'map', hudLayout: mode === 'both' ? 'map' : mode === 'effects' ? 'standalone' : null }
      if (command === 'toggleMap') { assert.ok(lock.getState().owner); mode = input.targetMode; return { environment, mapOpen: mode !== 'effects', hudVisible: mode !== 'map', hudLayout: mode === 'both' ? 'map' : mode === 'effects' ? 'standalone' : null } }
      if (command === 'inspectEffects') return { environment, coverageConfirmed: true, icons: [{ x: 50, y: 50 }] }
      if (command === 'hoverEffect') { assert.ok(lock.getState().owner); return { environment, status: 'located', texts: ['次要痛苦', '不能恢复坚毅'] } }
      if (command === 'observe') return frame()
      throw new Error(command)
    } }) })
  t.after(() => driver.close())
  return { driver, commands, hooks, lock, ...log }
}

async function collect(f, sig = signal()) {
  await f.driver.prepare(profile(), sig, f.lock)
  f.lock.acquire('test-collector')
  try { return await f.driver.finalizeFloor(f.driver.latest.floor, sig) }
  finally { f.lock.release('test-collector') }
}

test('国际服观测和最终采集共用词库版本scope，版本变化后必须重新读取效果',async t=>{
  const f=fixture(t,'both'),sig=signal()
  let revision='active-a'
  const international=JSON.parse(readFileSync(new URL('../electron/assets/sanctum/catalog.international.json',import.meta.url),'utf8'))
  f.driver.catalog=createLocalizedSanctumCatalog(international,{revisionProvider:()=>revision})
  f.hooks.hoverEffect=()=>({environment,status:'located',texts:['Cannot recover Resolve']})
  await f.driver.prepare(profile(),sig,f.lock)
  f.lock.acquire('test-collector')
  try {
    const first=await f.driver.finalizeFloor(f.driver.latest.floor,sig)
    assert.equal(first.effectScan.complete,true)
    assert.equal(f.driver.effectLedger.scope,f.driver.effectScope())
    await f.driver.finalizeFloor(first,sig)
    assert.equal(f.commands.filter(command=>command==='inspectEffects').length,1)
    revision='active-b'
    const changed=await f.driver.finalizeFloor(first,sig)
    assert.equal(changed.effectScan.complete,true)
    assert.equal(f.commands.filter(command=>command==='inspectEffects').length,2)
    assert.equal(f.driver.effectLedger.scope,f.driver.effectScope())
  } finally {f.lock.release('test-collector')}
})

test('完整识别即使复用效果也重新读取资源，只在独立扫描后恢复地图', async t => {
  for (const mode of ['both','map']) {
    const f=fixture(t,mode),sig=signal(),events=[]
    const input=profile();input.coinsRegion={x:10,y:10,width:100,height:40}
    input.mapResourcesRegion={x:120,y:10,width:100,height:80}
    input.hudResourcesRegion={x:10,y:100,width:300,height:100}
    await f.driver.prepare(input,sig,f.lock)
    let reads=0
    f.hooks.readRunPanel=()=>{
      reads++;events.push('resource')
      return {environment,regions:{mapResourcesRegion:{status:'located',texts:[`坚毅 ${100+reads}/300`,'启迪12']}}}
    }
    f.hooks.hoverEffect=()=>{events.push('effect');return {environment,status:'located',texts:['次要痛苦','不能恢复坚毅']}}
    f.lock.acquire('test-collector')
    try {
      const first=await f.driver.finalizeFloor(f.driver.latest.floor,sig)
      assert.equal(first.runObservation.resolve,mode==='both'?101:102)
      assert.equal(f.commands.filter(c=>c==='toggleMap').length,mode==='both'?0:2)
      const second=await f.driver.finalizeFloor(first,sig)
      assert.equal(second.runObservation.resolve,mode==='both'?102:103)
      assert.equal(events.filter(e=>e==='effect').length,1)
      assert.equal(f.commands.filter(c=>c==='toggleMap').length,mode==='both'?0:2)
    } finally {f.lock.release('test-collector')}
  }
})

test('最近实战房间回归：毒水侵袭不触发宝藏房扫描，明确痛苦加入，喷泉和手动刷新重读', async t => {
  const sample=JSON.parse(readFileSync(new URL('./fixtures/sanctum/conditional-effect-room-sequence.json',import.meta.url),'utf8'))
  const realCatalog=JSON.parse(readFileSync(new URL('../electron/assets/sanctum/catalog.json',import.meta.url),'utf8'))
  const f=fixture(t,'both'),messages=[]
  await f.driver.prepare(profile(),signal(),f.lock)
  f.driver.catalog=realCatalog
  f.driver.progress=message=>messages.push(message)
  const base=structuredClone(f.driver.latest.floor)
  base.currentRoomId=sample.rooms[0].id
  base.rooms=sample.rooms.map(({texts,...room})=>{
    if(!texts)return room
    const patch=parseSanctumRoomTexts(texts,realCatalog)
    for(const fact of Object.values(patch.knowledge))fact.mapKey=base.mapKey
    return {...room,revealed:true,...patch}
  })
  base.edges=sample.rooms.slice(1).map((room,i)=>({from:sample.rooms[i].id,to:room.id,status:'matched',traversal:'available'}))
  f.hooks.hoverEffect=()=>({environment,status:'located',texts:sample.baselineEffects.flatMap(e=>[e.name,e.rawText])})
  f.lock.acquire('test-collector')
  try {
    const initial=await f.driver.finalizeFloor(base,signal())
    assert.equal(initial.effectScan.complete,true)
    assert.equal(initial.currentEffects.length,sample.baselineEffects.length)
    for(const [index,mode,count] of [[1,'reuse',1],[2,'append',1],[3,'scan',2]]) {
      const next=structuredClone(base);next.currentRoomId=sample.rooms[index].id
      next.rooms[index]={...sample.rooms[index],texts:undefined,captureSkipReason:'completed'}
      f.hooks.observe=()=>({environment,foreground:true,mapOpen:true,interfaceMatched:true,floor:next})
      const observed=(await f.driver.observe(signal())).floor
      const result=await f.driver.finalizeFloor(observed,signal())
      assert.equal(result.effectScan.updateMode,mode)
      assert.equal(f.commands.filter(c=>c==='inspectEffects').length,count)
      if(mode!=='scan') {
        assert.deepEqual(result.currentEffects,observed.currentEffects)
        assert.deepEqual(result.effectScan,observed.effectScan)
        await f.driver.finalizeFloor(result,signal())
        assert.equal(f.commands.filter(c=>c==='inspectEffects').length,count)
      }
      if(mode==='append') {
        const effect=result.currentEffects.find(e=>e.name==='隐蔽异动')
        assert.equal(effect.rule,'deathAnomaly')
        assert.equal(effect.source.roomId,'4:0')
        assert.equal(result.currentEffects.filter(e=>e.name==='隐蔽异动').length,1)
      }
      if(mode==='scan')assert.match(result.effectScan.scanReason,/仁慈喷泉/)
    }
    assert.ok(messages.some(message=>message.includes('正在读取当前位置的实际效果：已完成仁慈喷泉')))
    f.driver.requestEffectRescan()
    const last={...base,currentRoomId:sample.rooms.at(-1).id}
    f.hooks.inspectEffects=()=>({environment,coverageConfirmed:true,icons:[]})
    const refreshed=await f.driver.finalizeFloor(last,signal())
    assert.deepEqual(refreshed.currentEffects,[])
    assert.equal(f.commands.filter(c=>c==='inspectEffects').length,3)
    assert.match(refreshed.effectScan.scanReason,/手动重读/)
  } finally { f.lock.release('test-collector') }
})

test('完成房间的观察与最终采集一致：跳过扫描、加入痛苦、连续推进和手动重读', async t => {
  const f=fixture(t,'both')
  await f.driver.prepare(profile(),signal(),f.lock)
  const floor=structuredClone(f.driver.latest.floor)
  floor.rooms.push(...['b','c'].map((id,index)=>{
    const patch=parseSanctumRoomTexts(['完成后提供奖励',...(id==='b'?['不能获得恩赐']:[])],catalog)
    for(const fact of Object.values(patch.knowledge)) fact.mapKey=floor.mapKey
    return {id,column:index+1,row:0,revealed:true,...patch}
  }))
  floor.edges=[{from:'a',to:'b',status:'matched',traversal:'available'},{from:'b',to:'c',status:'matched',traversal:'available'}]
  f.lock.acquire('test-collector')
  try {
    await f.driver.finalizeFloor(floor,signal())
    assert.equal(f.commands.filter(c=>c==='inspectEffects').length,1)
    const next=structuredClone(floor); next.currentRoomId='b'
    next.rooms[1]={id:'b',column:1,row:0}
    f.hooks.observe=()=>({environment,foreground:true,mapOpen:true,interfaceMatched:true,floor:next})
    const observed=await f.driver.observe(signal())
    assert.equal(observed.floor.effectScan.updateMode,'append')
    assert.ok(observed.floor.currentEffects.some(e=>e.rule==='cannotGainBoons'))
    const finalized=await f.driver.finalizeFloor(observed.floor,signal())
    assert.deepEqual(finalized.currentEffects,observed.floor.currentEffects)
    assert.deepEqual(finalized.effectScan,observed.floor.effectScan)
    assert.equal(f.commands.filter(c=>c==='inspectEffects').length,1)
    next.currentRoomId='c'
    const third=await f.driver.observe(signal())
    await f.driver.finalizeFloor(third.floor,signal())
    assert.equal(f.commands.filter(c=>c==='inspectEffects').length,1)
    f.driver.requestEffectRescan()
    const reread=await f.driver.finalizeFloor(third.floor,signal())
    assert.equal(f.commands.filter(c=>c==='inspectEffects').length,2)
    assert.equal(reread.effectScan.updateMode,'scan')
    assert.equal(reread.currentEffects.some(e=>e.rule==='cannotGainBoons'),false)
  } finally { f.lock.release('test-collector') }
})

test('商人或特殊效果触发真实扫描，失败后不会用旧效果补齐', async t => {
  for (const special of [false,true]) {
    const f=fixture(t,'both')
    await f.driver.prepare(profile(),signal(),f.lock)
    const floor=structuredClone(f.driver.latest.floor)
    floor.rooms.push({id:'b',column:1,row:0,type:special?'reward':'merchant',effects:[],afflictions:[],
      knowledge:Object.fromEntries(['type','effects','afflictions'].map(key=>[key,{status:'known',source:'observed',mapKey:floor.mapKey}]))})
    floor.edges=[{from:'a',to:'b',status:'matched',traversal:'available'}]
    f.lock.acquire('test-collector')
    try {
      await f.driver.finalizeFloor(floor,signal())
      if(special) f.driver.effectLedger.effects.push({rule:'randomAfflictionEachRoom',name:'每房随机痛苦',status:'matched'})
      const next={...floor,currentRoomId:'b'}
      f.hooks.inspectEffects=()=>({environment,coverageConfirmed:false,icons:[],reason:'扫描失败'})
      const result=await f.driver.finalizeFloor(next,signal())
      assert.equal(f.commands.filter(c=>c==='inspectEffects').length,2)
      assert.equal(result.effectScan.complete,false)
      assert.equal(result.currentEffects.some(e=>e.rule==='cannotRecover'),false)
      assert.ok(result.currentEffects.some(e=>e.status==='unknown'))
      assert.match(result.effectScan.scanReason,special?/每房随机痛苦/:/merchant/)
    } finally { f.lock.release('test-collector') }
  }
})

test('关图后进程启动时间不可读或列表漏检，不中断状态悬停并正常恢复地图', async t => {
  for (const processes of [[{ id: 123, startedAt: null }], []]) {
    const f = fixture(t)
    f.events.processPresenceProvider = async () => true
    f.hooks.inspectEffects = async () => {
      assert.equal(f.commands.filter(command => command === 'toggleMap').length, 1)
      f.events.processId = 123
      await f.events.pollProcess(processes)
      return { environment, coverageConfirmed: true, icons: [{ x: 50, y: 50 }] }
    }
    const floor = await collect(f)
    assert.equal(floor.effectScan.complete, true)
    assert.ok(f.commands.includes('hoverEffect'))
    assert.equal(f.commands.filter(command => command === 'toggleMap').length, 2)
    assert.equal(f.events.status.gameState, 'in-game')
  }
})

test('未完成效果仅在下次主动采集重读，确认空效果后整轮完成并复用', async t => {
  const f = fixture(t, 'both')
  f.hooks.inspectEffects = () => ({ environment, icons: [], coverageConfirmed: false, reason: '效果图标区域与截图排除区重叠' })
  let floor = await collect(f)
  assert.equal(floor.effectScan.complete, false)
  assert.ok(floor.effectScan.groups.every(g => g.status === 'absent'))
  assert.ok(floor.effectScan.issues.some(issue => issue.stage === 'scan' && issue.reason.includes('截图排除区')))
  await f.driver.observe(signal())
  await f.driver.finalizeFloor(floor, signal())
  assert.equal(f.commands.filter(c => c === 'inspectEffects').length, 1)
  f.hooks.inspectEffects = () => ({ environment, icons: [], coverageConfirmed: true })
  floor = await collect(f)
  assert.equal(floor.effectScan.complete, true)
  assert.equal(floor.effectScan.scanReason,'上一份状态未完整读取')
  assert.deepEqual(floor.currentEffects, [])
  assert.ok(floor.effectScan.groups.every(g => g.status === 'absent' && g.complete))
  await collect(f)
  assert.equal(f.commands.filter(c => c === 'inspectEffects').length, 2)
  assert.equal(f.commands.includes('hoverEffect'), false)

  // Exercise capture's actual aggregate outcome using the driver's finalized effects.
  const safe = { foreground:true,userTakeover:false,mapOpen:true,interfaceMatched:true,overlayExcluded:true,environment }
  const driver = {
    inspect: () => safe,
    subscribeSafety: () => () => {},
    async *frames() { yield {...safe,floor:{...floor,identityConfirmed:true,positionStatus:'initial',initialSelection:true,
      startRoomIds:['a'],rooms:[{id:'a',column:0,row:0,revealed:true}],edges:[]}} },
    async hover() { return {patch:{detailsStatus:'matched'}} },
    async finalizeFloor(value) { return {...value,effectScan:floor.effectScan,currentEffects:floor.currentEffects} }
  }
  let latest
  const capture = new SanctumCapture({driver,automationLock:new AutomationLock()})
  assert.equal(await capture.run(environment,value=>{latest=value}), 'complete')
  assert.equal(latest.captureProgress.stage, 'complete')
  assert.equal(latest.rooms[0].detailsStatus, 'matched')
})

test('效果完成同时要求覆盖证据和每个图标读取成功', async t => {
  const f = fixture(t, 'both')
  const labels = ['主要恩赐','次要恩赐','主要痛苦','次要痛苦']
  let covered = false, failed = false
  f.hooks.inspectEffects = () => ({environment,coverageConfirmed:covered,icons:labels.map((_,x)=>({x,y:50}))})
  f.hooks.hoverEffect = ({icon}) => ({environment,status:failed && icon.x === 0 ? 'partial':'located',
    texts:[catalog.entries[icon.x].name,...catalog.entries[icon.x].descriptions]})
  assert.equal((await collect(f)).effectScan.complete, false)
  covered = true; failed = true
  assert.equal((await collect(f)).effectScan.complete, false)
  failed = false
  assert.equal((await collect(f)).effectScan.complete, true)
})

test('v3 清除无效旧文字选区，不推断图标位置，保留地图校准', () => {
  const value = liveProfile({ ...profile(), version: 2, tooltipRegion: 'bad', currentEffectsRegion: 'bad',
    captures: { ...profile().captures, tooltipRegion: { png: 'bad' }, currentEffectsRegion: {} } })
  assert.equal(value.version, 6)
  assert.equal(value.tooltipRegion, undefined)
  assert.equal(value.captures.currentEffectsRegion, undefined)
  assert.deepEqual(value.mapRegion, region)
})

test('类别来自词条，错误类别标题不改变结果，空白和截断保留缺口',()=>{
  const group=parseSanctumEffectGroup({status:'located',texts:['主要恩赐','词条a','不能恢复坚毅']},catalog)
  assert.equal(group.category,'minorAffliction')
  assert.equal(group.entries.length,1)
  assert.equal(group.effects.length,1)
  for(const evidence of [{status:'located',texts:[]},{status:'partial',reason:'截断',texts:['词条a']},{status:'located',texts:['完全无关的文字内容']}]) {
    assert.equal(parseSanctumEffectGroup(evidence,catalog).complete,false)
  }
})

test('两种起始界面按需 V 切换；效果缓存跨普通刷新，停止后清空', async t => {
  for (const mode of ['map', 'both']) {
    const f = fixture(t, mode)
    await collect(f)
    assert.equal(f.commands.filter(command => command === 'toggleMap').length, mode === 'map' ? 2 : 0)
    assert.equal(f.lock.getState().locked, false)
    const id = f.driver.runId
    for (let n = 0; n < 3; n++) {
      const result = await f.driver.observe(signal())
      assert.equal(result.floor.runId, id)
      assert.ok(result.floor.currentEffects.some(effect => effect.rule === 'cannotRecover'))
    }
    assert.equal(f.commands.filter(command => command === 'hoverEffect').length, 1)
    await f.driver.close()
    assert.equal(f.driver.currentEffects, null)
    assert.equal(f.events.snapshot().state, 'started')
  }
})

test('切换超时、切区、接管和取消不发送恢复按键，不接受迟到效果', async t => {
  for (const failure of ['timeout', 'area', 'takeover', 'cancel']) {
    const f = fixture(t, failure === 'timeout' ? 'map' : 'both'), controller = new AbortController()
    if (failure === 'timeout') f.hooks.toggleMap = () => { throw new Error('V 切换界面超时') }
    else f.hooks.hoverEffect = () => {
      if (failure === 'area') f.enter({ areaId: 'SanctumVaults' })
      if (failure === 'takeover') throw sanctumError('SAFETY_INTERRUPTED','用户已接管鼠标')
      if (failure === 'cancel') controller.abort()
      return { environment, status: 'located', texts: ['次要痛苦', '不能恢复坚毅'] }
    }
    if (failure === 'timeout') assert.equal((await collect(f,controller.signal)).effectScan.complete,false)
    else await assert.rejects(collect(f, controller.signal))
    assert.equal(f.commands.filter(command => command === 'toggleMap').length, failure === 'timeout' ? 1 : 0)
    if (failure !== 'timeout') assert.equal(f.driver.currentEffects, null)
    assert.equal(f.lock.getState().locked, false)
  }
})

test('动态图框几何：不同位置高度、边缘截断、残留与多候选均独立判定', () => {
  const result = runPython(`
import sys,json,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_tooltip import locate_tooltip,icon_candidates
base=np.full((800,1000,3),150,np.uint8)
results=[]
for x,y,w,h in [(100,100,240,160),(650,300,280,350),(0,150,260,300)]:
    frame=base.copy(); cv2.rectangle(frame,(x,y),(x+w,y+h),(20,20,20),-1)
    results.append(locate_tooltip(base,frame,(x+w//2,y+h+15)))
old=base.copy();cv2.rectangle(old,(100,100),(340,260),(20,20,20),-1)
results.append(locate_tooltip(old,old,(200,280)))
many=base.copy()
cv2.rectangle(many,(100,100),(280,230),(20,20,20),-1)
cv2.rectangle(many,(300,100),(480,230),(20,20,20),-1)
results.append(locate_tooltip(base,many,(290,245)))
scrolled=base.copy();cv2.rectangle(scrolled,(100,100),(400,500),(20,20,20),-1)
cv2.rectangle(scrolled,(380,140),(385,460),(200,200,200),-1)
results.append(locate_tooltip(base,scrolled,(240,515)))
bar=np.zeros((100,400,3),np.uint8)
for x in [10,100,190]:cv2.rectangle(bar,(x,10),(x+60,70),(200,200,200),3)
print(json.dumps({'statuses':[r['status'] for r in results],'icons':len(icon_candidates(bar))}))
`)
  assert.deepEqual(result, { statuses: ['located', 'located', 'partial', 'unknown', 'unknown', 'partial'], icons: 3 })
})

test('原生 V 仅按一次、释放按键；未知界面或取消禁止后续输入', () => {
  const result = runPython(`
import sys,json,types
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
from threading import RLock
def run(cancel=False,unknown=False,success=False):
    s=NativeSession.__new__(NativeSession);s.expected={};s.input_lock=RLock();keys=[]
    s.u=types.SimpleNamespace(keybd_event=lambda *a:keys.append(a[2]),GetAsyncKeyState=lambda key:0)
    s.check=lambda:None
    def require(*a):
        if unknown:raise NativeError('unknown')
    s.require_mode=require;s.cancelled=types.SimpleNamespace(wait=lambda _:cancel)
    s.interface_state=lambda _: {'mapOpen':not unknown and not (bool(keys) and success), 'hudVisible':not unknown}
    try:s.toggle_map({'targetMode':'effects'});error=False
    except NativeError:error=True
    return [keys,error]
print(json.dumps([run(success=True),run(),run(cancel=True),run(unknown=True)]))
`)
  assert.deepEqual(result, [[[0, 2], false], [[0, 2], true], [[0, 2], true], [[], true]])
})

test('图标缺失显示未知；互斥占用、缺少配置和环境失配均不 arm', async t => {
  const empty = fixture(t, 'both')
  empty.hooks.inspectEffects = () => ({ environment, icons: [] })
  await collect(empty)
  assert.equal(empty.driver.effectScan.complete, false)
  assert.ok(empty.driver.currentEffects.some(effect => effect.status === 'unknown'))
  for (const mode of ['locked', 'missing', 'dpi']) {
    const f = fixture(t)
    if (mode === 'locked') f.lock.acquire('other')
    const input = profile()
    if (mode === 'missing') delete input.captures.mapRegion
    if (mode === 'dpi') input.environment.dpi = 144
    await assert.rejects(f.driver.prepare(input, signal(), f.lock))
    assert.equal(f.commands.includes('arm'), false)
    assert.equal(f.commands.includes('toggleMap'), false)
    if (mode === 'locked') assert.equal(f.lock.getState().owner, 'other')
  }
})


test('地图未匹配即时提示且不 arm，公共检测过期不影响启动', async t => {
  const missing = fixture(t, 'effects')
  await assert.rejects(missing.driver.prepare(profile(), signal(), missing.lock), /未检测到圣所地图/)
  assert.equal(missing.commands.includes('arm'), false)
  assert.equal(missing.commands.includes('hoverEffect'), false)
  const valid = fixture(t, 'both')
  valid.driver.detection.getState = () => { throw new Error('不得读取公共状态') }
  valid.driver.detection.subscribe = () => { throw new Error('不得持续订阅') }
  await collect(valid)
  assert.equal(valid.commands.filter(c => c === 'toggleMap').length, 0)
})

test('双布局读取各自图标选区，未知结果每次采集只校正一次', async t => {
  const f = fixture(t, 'both')
  const input = profile(), embedded = { x: 40, y: 500, width: 200, height: 40 }
  input.mapEffectIconsRegion = embedded
  input.captures.mapEffectIconsRegion.region = embedded
  f.hooks.inspectEffects = options => {
    assert.deepEqual(options.effectIconsRegion, embedded)
    assert.equal(options.hudLayout, 'map')
    return { environment, icons: [] }
  }
  await f.driver.prepare(input, signal(), f.lock)
  f.lock.acquire('test-collector')
  const floor = f.driver.latest.floor
  await f.driver.finalizeFloor(floor, signal())
  await f.driver.finalizeFloor(floor, signal())
  f.lock.release('test-collector')
  assert.equal(f.commands.filter(c => c === 'inspectEffects').length, 1)
  assert.equal(f.driver.effectScan.complete, false)
  assert.ok(f.commands.indexOf('observe') < f.commands.indexOf('inspectEffects'))
  const ledger = f.driver.effectLedger
  await f.driver.close()
  assert.equal(f.driver.effectLedger, ledger)
  f.driver.resetEffects()
  assert.equal(f.driver.effectLedger, null)
})


test('位置变化重新读取实际效果，同位置跨批次复用，跨层重新确认', async t => {
  const f = fixture(t, 'both')
  let current = 'a', time = 0
  f.hooks.observe = () => ({ environment, fingerprint: 'stable', mapFingerprint: 'stable', timestamp: time += 400,
    foreground: true, userTakeover: false, mapOpen: true, interfaceMatched: true,
    floor: { currentRoomId: current, width: 800, height: 500, rooms: ['a', 'b'].map((id, x) => ({ id, x, y: 0, width: 40, height: 60,
      currentCandidate: id === current, revealed: true, detailsStatus: 'matched', type: 'reward', afflictions: [],
      effects: id === 'b' ? [{ rule: 'recoveryIncrease', value: 20, status: 'matched', category: 'minorBoon' }] : [] })),
      edges: [{ from: 'a', to: 'b', status: 'matched', traversal: current === 'b' ? 'visited' : 'available' }] } })
  await collect(f)
  current = 'b'
  const next = await f.driver.observe(signal())
  assert.ok(next.floor.currentEffects.every(e=>e.rule!=='cannotRecover'))
  f.lock.acquire('test-collector')
  const accumulated = await f.driver.finalizeFloor(next.floor, signal())
  f.lock.release('test-collector')
  assert.equal(accumulated.currentEffects.length, 1)
  assert.equal(f.commands.filter(c => c === 'hoverEffect').length, 2)
  await f.driver.close()
  await collect(f)
  assert.equal(f.driver.currentEffects.length, 1)
  assert.equal(f.commands.filter(c => c === 'hoverEffect').length, 2)
  f.enter({ areaId: 'SanctumVaults' })
  await collect(f)
  assert.equal(f.driver.currentEffects.length, 1)
  assert.equal(f.commands.filter(c => c === 'hoverEffect').length, 3)
})

test('独立状态栏扫描或悬停失败后不再按 V，仍清理采集资源', async t => {
  for (const command of ['inspectEffects','hoverEffect']) {
    const f=fixture(t,'map')
    await f.driver.prepare(profile(),signal(),f.lock)
    f.lock.acquire('test-collector')
    f.hooks[command]=()=>{throw sanctumError('SAFETY_INTERRUPTED','窗口位置、尺寸或 DPI 已变化，请重新校准')}
    let finished=0
    try {
      await assert.rejects(f.driver.finalizeFloor(f.driver.latest.floor,signal(),{finishCapture:async()=>{finished++}}),/DPI/)
      assert.equal(f.commands.filter(c=>c==='toggleMap').length,1)
      assert.equal(finished,1)
    } finally { f.lock.release('test-collector') }
  }
})

test('整轮身份跨正常楼层加载延续，离开圣所或断线后重新建立', async t => {
  const f=fixture(t,'both')
  await collect(f)
  const run=f.driver.sanctumRunId
  await f.driver.close()
  f.events.setGameState('loading','area-loading')
  f.enter({areaId:'SanctumVaults',seed:'new-floor'})
  await collect(f)
  assert.equal(f.driver.sanctumRunId,run)
  await f.driver.close()
  f.events.setGameState('unknown','disconnected')
  f.enter({areaId:'SanctumVaults',seed:'new-floor'})
  await collect(f)
  assert.notEqual(f.driver.sanctumRunId,run)
})

test('效果移除或转换由新位置实读替换，同位置仅手动重读更新',async t=>{
  const f=fixture(t,'both')
  await collect(f)
  assert.equal(f.driver.currentEffects[0].rule,'cannotRecover')
  f.hooks.hoverEffect=()=>({environment,status:'located',texts:['次要痛苦','不能获得恩赐']})
  await collect(f)
  assert.equal(f.driver.currentEffects[0].rule,'cannotRecover')
  f.driver.requestEffectRescan()
  await collect(f)
  assert.deepEqual(f.driver.currentEffects.map(e=>e.rule),['cannotGainBoons'])
  f.hooks.observe=()=>({environment,foreground:true,userTakeover:false,mapOpen:true,interfaceMatched:true,floor:{currentRoomId:'b',positionStatus:'confirmed',rooms:[{id:'b',column:1,row:0}],edges:[]}})
  f.hooks.inspectEffects=()=>({environment,coverageConfirmed:true,icons:[]})
  await collect(f)
  assert.deepEqual(f.driver.currentEffects,[])
})


test('一个效果项失败不阻止后续项，失败保留缺口且最终恢复地图',async t=>{
  const f=fixture(t,'map'),seen=[]
  // The native process is still alive for a normal per-item recognition failure.
  f.hooks.inspectEffects=()=>({environment,coverageConfirmed:true,icons:[{x:1,y:50},{x:2,y:50},{x:3,y:50}]})
  f.hooks.hoverEffect=({icon})=>{seen.push(icon.x);if(icon.x===2)throw new Error('当前效果截图失败');return {environment,status:'located',texts:[icon.x===1?'次要痛苦':'主要痛苦','不能恢复坚毅']}}
  await f.driver.prepare(profile(),signal(),f.lock)
  f.driver.client.child={}
  f.lock.acquire('effects-test')
  try {
    const result=await f.driver.finalizeFloor(f.driver.latest.floor,signal())
    assert.deepEqual(seen,[1,2,3])
    assert.equal(result.effectScan.complete,false)
    assert.ok(result.currentEffects.some(effect=>effect.rule==='cannotRecover'))
    assert.equal(f.commands.filter(command=>command==='toggleMap').length,2)
  } finally {f.lock.release('effects-test')}
})

for (const failure of ['inspectEffects','ocr']) test(`独立状态栏普通失败仍检查界面并恢复地图：${failure}`,async t=>{
  const f=fixture(t,'map')
  if(failure==='inspectEffects')f.hooks.inspectEffects=()=>{throw new Error('状态栏图标检查失败')}
  else f.driver.recognizeCaptured=async()=>{throw new Error('OCR 失败')}
  const result=await collect(f)
  assert.equal(f.commands.filter(c=>c==='toggleMap').length,2)
  assert.equal(result.effectScan.complete,false)
  assert.ok(result.effectScan.targets.some(t=>t.reason?.includes('失败')))
})
})()

// === Merged from sanctumEffectCrop.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const fs = _m7_fs
  const runPython = _m7_runPython
  const parseEffectTooltip = _m7_parseEffectTooltip
  const SanctumLiveDriver = _m7_SanctumLiveDriver
const catalog=JSON.parse(fs.readFileSync('electron/assets/sanctum/catalog.json','utf8'))

test('定位区分无候选、冲突和截断；缩放回原图采用实际横纵比例',()=>{
  const result=runPython(`
import sys,json,cv2,numpy as np
from unittest.mock import patch
sys.path.insert(0,'src/assets/scripts')
from sanctum_tooltip import locate_content
base=np.full((800,1200,3),150,np.uint8);out=[]
for rectangles in [[],[(300,250,600,330),(300,420,600,500)],[(300,0,600,180)]]:
 im=base.copy()
 for x,y,right,bottom in rectangles:cv2.rectangle(im,(x,y),(right,bottom),(20,20,20),-1)
 out.append(locate_content(base,im,(450,375 if len(rectangles)==2 else 195)))
base=np.full((1645,3072,3),150,np.uint8);im=np.full_like(base,20)
with patch('sanctum_tooltip.locate_tooltip',side_effect=[{'status':'unknown','reason':'无候选'},{'status':'located','region':{'x':500,'y':400,'width':250,'height':100}}]) as locator:
 r=locate_content(base,im,(1000,900))['region']
 assert locator.call_count==2
 assert locator.call_args.args[0].shape[:2]==(1028,1920)
 assert r=={'x':800,'y':640,'width':400,'height':161},r
print(json.dumps(out))`)
  assert.match(result[0].reason,/未找到/)
  assert.match(result[1].reason,/多个候选/)
  assert.equal(result[2].status,'partial');assert.match(result[2].reason,/截断/)
})

test('三张反馈四种宽度：原生采集只截一次，同源局部证据、完整文字 OCR 和目录匹配',()=>{
  const results=runPython(`
import sys,json,cv2,numpy as np,threading,base64
from unittest.mock import patch
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import load_image
from sanctum_tooltip import locate_content,icon_candidates
from sanctum_native import NativeSession
from sanctum_frames import FramePool
from sanctum_postprocess import process_image
from sanctum_ocr import create_sanctum_ocr_engine,read_room_ocr
frames=[np.pad(load_image('test/fixtures/sanctum/'+name+'.png'),((800,0),(1100,1440),(0,0)),mode='edge') for name in ['effect-boon','effect-afflictions']]
frames.append(np.pad(load_image('test/fixtures/sanctum/effect-feedback.png'),((450,319),(760,998),(0,0)),mode='edge'))
points=[(1650,1440),(1730,1440),(1114,932)]
expected=[(1390,1250,1900,1380),(1345,985,2110,1385),(865,631,1360,885)]
engine=create_sanctum_ocr_engine();out=[]
for index,frame in enumerate(frames):
 for width in [1920,2560,3072,3840]:
  height=round(frame.shape[0]*width/frame.shape[1]);scale=width/frame.shape[1]
  image=cv2.resize(frame,(width,height),interpolation=cv2.INTER_AREA)
  base=cv2.resize(frames[1-index] if index<2 else np.full_like(frame,100),(width,height),interpolation=cv2.INTER_AREA)
  point=tuple(value*scale for value in points[index])
  s=NativeSession.__new__(NativeSession);s.expected={};s.tooltip_baseline=base;s.cancelled=threading.Event()
  s.check=lambda:{'clientBounds':{'x':0,'y':0}};s.move_cursor=lambda p:None;s.progress=lambda *a,**kw:None
  s.request_context={'targetId':'effect:1','sessionId':'s'};s.capture_masks=[]
  events=[];shots=[]
  def shot():
   shots.append(1);return image,{}
  s.image=shot
  pool=FramePool(width,height)
  s.freeze_baseline({'pool':pool.spec,'slot':0})
  captured=s.read_tooltip({'frozen':{'pool':pool.spec,'slot':1,'baselineSlot':0,'baselineVersion':s.baseline_version,'frameId':1}},point,'effects')
  result=process_image(pool.view(0),pool.view(1),captured['frozenFrame'],events.append)
  s.frame_mapping.close();pool.close()
  assert len(shots)==1 and len(events)==1,(index,width,result)
  r=result['region'];event=events[0]
  assert event['kind']=='effect-crop' and event['png']==result['png']
  assert event['sourceRegion']==r and event['region']==dict(x=0,y=0,width=r['width'],height=r['height'])
  cropped=cv2.imdecode(np.frombuffer(base64.b64decode(result.pop('png')),np.uint8),cv2.IMREAD_COLOR)
  assert np.array_equal(cropped,image[r['y']:r['y']+r['height'],r['x']:r['x']+r['width']])
  x,y,right,bottom=[v*scale for v in expected[index]]
  assert r['x']<=x and r['y']<=y and r['x']+r['width']>=right and r['y']+r['height']>=bottom,(index,width,r)
  for dx,dy in [(0,6),(8,12),(-8,-6)]:
   assert locate_content(base,image,(point[0]+dx*scale,point[1]+dy*scale))['region']==r
  # Exactly one OCR invocation on the very PNG supplied to the evidence API.
  result.update(read_room_ocr(engine,cropped));result.update(sample=index,width=width)
  out.append(result)
  assert not locate_content(image,image,point).get('region')
# No location produces no full-screen evidence or OCR input.
s.tooltip_baseline=image
events=[]
failed=process_image(image,image,{'mode':'effects','point':point,'frameId':2},events.append)
assert not events and not failed.get('png') and failed['readStages']['ocr']=='failed'
# Open decorative borders: all four entrances survive at every tested scale.
icons=load_image('test/fixtures/sanctum/effect-entrances.png')
for width in [1920,2560,3072,3840]:
 scale=width/3840
 found=icon_candidates(cv2.resize(icons,None,fx=scale,fy=scale,interpolation=cv2.INTER_AREA))
 assert len(found)==4,(width,found)
 for icon,x in zip(found,[81,159,229,312]):assert abs(icon['x']/scale-x)<14
print(json.dumps(out))`)
  assert.equal(results.length,12)
  for(const result of results) {
    const group=parseEffectTooltip(result,catalog)
    assert.deepEqual(group.entries.map(e=>e.name),result.sample===0?['全知之眼']:['钝化之剑','过门税款','巫毒人偶'],JSON.stringify(result))
    assert.ok(group.entries.every(e=>e.category===(result.sample===0?'majorBoon':'minorAffliction')))
  }
})

test('全部入口依次悬停：某个浮窗定位失败仍采集其余入口，各成功裁剪只 OCR 一次',async()=>{
  const hovered=[],ocr=[]
  const driver=new SanctumLiveDriver({catalog,makeClient:()=>({sessionId:'s',async shutdown(){},async request(command,input){
    if(command==='interfaceState')return {mapOpen:true,hudLayout:'map'}
    if(command==='inspectEffects')return {coverageConfirmed:true,icons:[0,1,2,3].map(x=>({x,y:10}))}
    if(command==='hoverEffect') {
      hovered.push(input.icon.x)
      if(input.icon.x===1)return {status:'unknown',reason:'未找到效果浮窗'}
      return {status:'located',region:{x:100,y:200,width:20,height:10},png:String(input.icon.x)}
    }
  }})})
  await driver.open()
  driver.ocrClient={async shutdown(){},async request(command,input){ocr.push(input);return {texts:['全知之眼']}}}
  driver.assertLog=()=>({floorId:'f'});driver.logContext={context:{},close(){}}
  driver.profile={environment:{},interfaceTitles:{'sanctum-map-hud':{}},mapEffectIconsRegion:{}}
  try {
    const floor=await driver.finalizeFloor({runId:'r',floorId:'f',rooms:[],edges:[]},new AbortController().signal)
    assert.deepEqual(hovered,[0,1,2,3]);assert.deepEqual(ocr.map(o=>o.png),['0','2','3'])
    assert.ok(ocr.every(o=>o.room===false && o.region.x===0 && o.region.y===0))
    assert.equal(floor.effectScan.targets.length,4)
    assert.equal(floor.effectScan.targets[1].stage,'failed')
    assert.equal(floor.effectScan.targets[1].evidenceId,undefined)
  } finally {await driver.close()}
})
})()

// === Merged from sanctumEffectRecognition.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const fs = _m8_fs
  const parseEffectTooltip = _m8_parseEffectTooltip
  const mergeEffectGroups = _m8_mergeEffectGroups
  const runPython = _m8_runPython
  const SanctumLiveDriver = _m8_SanctumLiveDriver
const catalog=JSON.parse(fs.readFileSync('electron/assets/sanctum/catalog.json','utf8'))

test('效果冻结事件通过真实驱动绑定目标，OCR 失败仍保存只读图片引用',async()=>{
  const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
  const driver=new SanctumLiveDriver({catalog,makeClient:callbacks=>({sessionId:'s',async shutdown(){},async request(command,input){
    if(command==='interfaceState')return {mapOpen:true,hudLayout:'map'}
    if(command==='inspectEffects')return {coverageConfirmed:true,icons:[{x:1,y:1}]}
    if(command==='hoverEffect') {
      callbacks.onEvidence({targetId:input.effectTarget,sessionId:'s',png,width:1,height:1,region:{x:0,y:0,width:1,height:1},kind:'effect-crop',sourceRegion:{x:20,y:30,width:1,height:1},sourceWidth:100,sourceHeight:100})
      return {status:'located',region:{x:20,y:30,width:1,height:1},png,texts:[]}
    }
  }})})
  await driver.open()
  driver.ocrClient={async request(){throw new Error('OCR 失败')},async shutdown(){}}
  driver.assertLog=()=>({floorId:'f'})
  driver.logContext={context:{},close(){}}
  driver.profile={environment:{},interfaceTitles:{'sanctum-map-hud':{}},mapEffectIconsRegion:{}}
  try {
    const floor=await driver.finalizeFloor({runId:'r',floorId:'f',rooms:[],edges:[]},new AbortController().signal)
    const target=floor.effectScan.targets[0]
    assert.equal(target.stage,'ocr-failed');assert.ok(target.evidenceId)
    assert.equal(driver.evidence.image({runId:'r',floorId:'f',roomId:target.targetId,evidenceId:target.evidenceId}).dataUrl,`data:image/png;base64,${png}`)
    assert.doesNotMatch(JSON.stringify(floor),/data:image|iVBOR/)
  } finally {await driver.close()}
})

test('无类别标题：名称描述合并，四个真实词条由目录确定级别，计算独立',()=>{
  const boon=parseEffectTooltip({status:'located',texts:['X','全知之眼','圣所地图现在完全显示了']},catalog)
  assert.equal(boon.category,'majorBoon');assert.equal(boon.entries.length,1);assert.equal(boon.effects.length,1)
  assert.equal(boon.complete,true);assert.equal(boon.texts[0],'X')
  const afflictions=parseEffectTooltip({status:'located',texts:['钝化之剑','你和你的召唤生物伤害总降40%','过门税款','完成房间时损失30枚耀金币','巫毒人偶','坚毅低于50%时，失去的坚毅增加100%']},catalog)
  assert.equal(afflictions.category,'minorAffliction');assert.equal(afflictions.entries.length,3)
  assert.equal(afflictions.status,'read');assert.equal(afflictions.entries[0].calculationStatus,'supported')
  const mixed=parseEffectTooltip({status:'located',texts:['全知之眼','钝化之剑']},catalog)
  assert.equal(mixed.entries.length,2)
  assert.deepEqual(mergeEffectGroups([mixed],true).filter(g=>g.status==='read').map(g=>g.category),['majorBoon','minorAffliction'])
})

test('换行、未知文字、歧义、截断及缺失级别分别保留',()=>{
  assert.equal(parseEffectTooltip({status:'located',texts:['圣所地图现在','完全显示了']},catalog).entries[0].name,'全知之眼')
  const entry=catalog.entries.find(e=>e.name==='全知之眼')
  const ambiguous={...catalog,entries:[entry,{...entry,id:'duplicate'}]}
  assert.equal(parseEffectTooltip({status:'located',texts:['全知之眼']},ambiguous).entries.length,0)
  const unknown=parseEffectTooltip({status:'located',texts:['无关天气预报']},catalog)
  assert.equal(unknown.complete,false);assert.ok(unknown.effects.some(e=>e.rawText==='无关天气预报'))
  assert.equal(parseEffectTooltip({status:'partial',texts:['全知之眼'],reason:'截断'},catalog).complete,false)
  const missing=parseEffectTooltip({status:'located',texts:['全知之眼']},{...catalog,entries:[{...entry,tier:null}]})
  assert.equal(missing.entries[0].name,'全知之眼');assert.equal(missing.entries[0].category,null)
  const conflict=parseEffectTooltip({status:'located',texts:['全知之眼','圣所地图现在完全显示了99']},catalog)
  assert.equal(conflict.entries[0].calculationStatus,'unsupported')
  assert.ok(conflict.effects.every(e=>e.status==='unknown'))
})

test('原始截图局部回放：自动范围包含完整四条词缀，OCR 后匹配；静止旧浮窗不算新内容',()=>{
  const results=runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import load_image
from sanctum_tooltip import locate_content
from sanctum_ocr import create_sanctum_ocr_engine,read_room_ocr
frames=[]
for name in ['effect-boon','effect-afflictions']:
 im=np.pad(load_image('test/fixtures/sanctum/'+name+'.png'),((800,0),(1100,1440),(0,0)),mode='edge')
 frames.append(im)
engine=create_sanctum_ocr_engine();out=[]
for base,im,point in [(frames[1],frames[0],(1650,1440)),(frames[0],frames[1],(1730,1440))]:
 result=locate_content(base,im,point);r=result['region']
 for dy in [6,12]:
  assert locate_content(base,im,(point[0],point[1]+dy))['region']==r
 result.update(read_room_ocr(engine,im[r['y']:r['y']+r['height'],r['x']:r['x']+r['width']]))
 out.append(result)
out.append(locate_content(frames[0],frames[0],(1650,1440)))
print(json.dumps(out))`)
  for(const [i,expected] of [[0,{x:1374,y:1234,width:558,height:164}],[1,{x:1332,y:962,width:796,height:437}]]) {
    for(const key of Object.keys(expected)) assert.ok(Math.abs(results[i].region[key]-expected[key])<=8,`${i} ${key}: ${JSON.stringify(results[i].region)}`)
  }
  assert.equal(parseEffectTooltip(results[0],catalog).entries[0].name,'全知之眼')
  assert.equal(parseEffectTooltip(results[0],catalog).complete,true)
  assert.deepEqual(parseEffectTooltip(results[1],catalog).entries.map(e=>e.name),['钝化之剑','过门税款','巫毒人偶'])
  assert.equal(results[2].status,'unknown')
})
})()

// === Merged from sanctumEntry.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const fs = _m9_fs
  const os = _m9_os
  const path = _m9_path
  const reuseSanctumEffects = _m9_reuseSanctumEffects
  const SanctumControlOverlay = _m9_SanctumControlOverlay
  const sanctumControlState = _m9_sanctumControlState
  const SanctumRepository = _m9_SanctumRepository
  const emptySanctumState = _m9_emptySanctumState
  const runPython = _m9_runPython
const floor = currentRoomId => ({ floorId: 'floor:0', width: 800, height: 600, currentRoomId,
  rooms: ['a', 'b', 'c'].map((id, x) => ({ id, x, y: 0, width: 40, height: 60, type: 'reward', detailsStatus: 'matched',
    effects: id === 'b' ? [{ rule: 'cannotRecover', status: 'matched', category: 'minorAffliction' }] : [], afflictions: [] })),
  edges: [{ from: 'a', to: 'b', status: 'matched', traversal: ['b', 'c'].includes(currentRoomId) ? 'visited' : 'available' }, { from: 'b', to: 'c', status: 'matched', traversal: currentRoomId === 'c' ? 'visited' : 'available' }] })

test('位置快照不累加经过房间的效果；推荐不提交且变化要求重新读取', () => {
  const initial = { scope:'same', floor:floor('a'),effects:[],complete:true }
  assert.deepEqual(reuseSanctumEffects(initial,floor('a'),'same').effects,[])
  for (const id of ['b','c']) assert.equal(reuseSanctumEffects(initial,floor(id),'same'),null)
  assert.equal(reuseSanctumEffects(initial,floor('a'),'new'),null)
  assert.deepEqual(initial.effects,[])
})

test('未知效果、交易房间、分叉路径和缺少当前位置均要求状态校正', () => {
  for (const change of [f => { f.rooms[1].effects = [{ status: 'unknown' }] },
    f => { f.rooms[1].type = 'merchant' }, f => { f.rooms[1].detailsStatus = 'unknown' },
    f => { f.edges.push({ from: 'a', to: 'c', status: 'matched' }) }]) {
    const base = floor('a'); change(base)
    const target = structuredClone(base); target.currentRoomId = 'c'; target.edges.forEach(edge => { edge.traversal = 'visited' })
    assert.equal(reuseSanctumEffects({ scope: 'same', floor: base, effects: [], complete: true }, target, 'same'), null)
  }
  assert.equal(reuseSanctumEffects({ scope: 'same', floor: floor('a'), effects: [], complete: true }, floor(null), 'same'), null)
})

test('游戏内入口显隐与互斥、过期、运行状态独立计算', () => {
  const service = { enabled: true, liveCalibration: {} }
  const detection = { running: true, foreground: true, receivedAt: 1000, interfaces: { 'sanctum-map': { matched: true } } }
  assert.equal(sanctumControlState(service, detection, {}, 1000).disabled, false)
  assert.equal(sanctumControlState(service, detection, {}, 3000).visible, false)
  assert.equal(sanctumControlState(service, { ...detection, foreground: false }, {}, 1000).visible, false)
  assert.equal(sanctumControlState(service, detection, { locked: true }, 1000).disabled, true)
  assert.equal(sanctumControlState({ ...service, running: true }, detection, {}, 1000).label, '正在准备')
  assert.equal(sanctumControlState({ ...service, enabled: false }, detection, {}, 1000).visible, false)
})

test('圣所浮窗拖动独立持久化、重启恢复、截图隐藏及调用方限制', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-control-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const repository = new SanctumRepository(root)
  const state = emptySanctumState(); state.liveCalibration = null
  const bagFile = path.join(root, 'bag.json'); fs.writeFileSync(bagFile, '{"x":99,"y":88}')
  const service = { state, enabled: false, subscribe: () => () => {}, getState: () => ({ ...state, enabled: false }), persist: () => repository.save(state) }
  const detection = { subscribe: () => () => {}, getState: () => ({}), unregisterConsumer() {} }
  const display = { id: 1, workArea: { x: 0, y: 0, width: 1920, height: 1080 } }
  class Window {
    constructor(bounds) { this.bounds = bounds; this.webContents = { id: 7, on() {}, isLoadingMainFrame: () => false, send() {} } }
    isDestroyed() { return false }
    setAlwaysOnTop() {} setContentProtection() {} on() {} loadFile() {}
    getBounds() { return this.bounds }
    setBounds(value) { this.bounds = value }
    isVisible() { return !this.hidden }
    hide() { this.hidden = true } destroy() {}
  }
  const options = { service, detection, automationLock: { subscribe: () => () => {}, getState: () => ({}) }, BrowserWindowClass: Window,
    screenApi: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, getDisplayNearestPoint: () => display } }
  const overlay = new SanctumControlOverlay(options); t.after(() => overlay.destroy())
  const window = overlay.ensureWindow(), original = window.getBounds(), sender = window.webContents
  assert.equal(overlay.move({ id: 99 }, { phase: 'start', screenX: 0, screenY: 0 }), false)
  overlay.move(sender, { phase: 'start', screenX: 100, screenY: 100 })
  overlay.move(sender, { phase: 'move', screenX: 0, screenY: 150 })
  overlay.move(sender, { phase: 'end', screenX: 0, screenY: 150 })
  assert.deepEqual(repository.load().controlOverlayBounds, { x: original.x - 100, y: original.y + 50 })
  assert.equal(fs.readFileSync(bagFile, 'utf8'), '{"x":99,"y":88}')
  await overlay.withHidden(async () => { assert.equal(window.hidden, true); assert.equal(overlay.hidden, 1) })
  const restored = new SanctumControlOverlay({ ...options, service: { ...service, state: repository.load() } }); t.after(() => restored.destroy())
  assert.equal(restored.ensureWindow().getBounds().x, original.x - 100)
})

test('地图内状态栏要求校准位置，地图关闭无需独立锚点', () => {
  const result = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
import sanctum_native as n
s=n.NativeSession.__new__(n.NativeSession)
s.image=lambda:(np.zeros((10,10,3),np.uint8),{'environment':{}})
options={'interfaceTitles':{'sanctum-map-hud':{'region':{'x':100,'y':200}},'sanctum-hud':{'region':{'x':500,'y':600}}}}
out=[]
for opened,x,y in [(True,100,200),(False,500,600),(True,500,600),(False,0,0)]:
    key='sanctum-map-hud' if opened else 'sanctum-hud'
    n.match_titles=lambda *a,**kw: {**({'sanctum-map':{'matched':True}} if opened else {}),key:{'region':{'x':x,'y':y}}}
    if not opened:
        options['interfaceTitles'].pop('sanctum-hud',None)
        n.match_titles=lambda *a,**kw: {}
    state=s.interface_state(options);out.append([state['mapOpen'],state['hudVisible'],state['hudLayout']])
print(json.dumps(out))
`)
  assert.deepEqual(result, [[true, true, 'map'], [false, true, 'standalone'], [true, false, null], [false, true, 'standalone']])
})
})()
