import { SEASON_BASELINE } from '../shared/seasonBaseline.js'
import { sanctumError } from '../electron/modules/sanctum/errors.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SanctumLiveDriver, parseSanctumEffectGroup, parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { liveProfile } from '../shared/sanctumLive.js'
import { AutomationLock } from '../electron/modules/automation/lock.js'
import { sanctumLogEvents } from './helpers/sanctumLog.js'
import { runPython } from './helpers/python.js'
import { SanctumCapture } from '../electron/modules/sanctum/capture.js'

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
