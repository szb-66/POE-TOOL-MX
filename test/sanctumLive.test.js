import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { SanctumLiveDriver, parseSanctumRoomTexts, parseSanctumCurrentEffects } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { AutomationLock } from '../electron/modules/automation/lock.js'
import { liveProfile, liveRegions } from '../shared/sanctumLive.js'
import { SEASON_BASELINE } from '../shared/seasonBaseline.js'
import { applySanctumEffects } from '../shared/sanctum.js'
import { runPython } from './helpers/python.js'
import { sanctumLogEvents } from './helpers/sanctumLog.js'

const environment = { windowId: 'game', processId: 123, width: 1920, height: 1080, dpi: 96 }
const nativeEnvironment = { environment, clientBounds: { x: 0, y: 0, width: 1920, height: 1080 } }
const regions = { mapRegion: { x: 0, y: 0, width: 1500, height: 800 }, titleRegion: { x: 0, y: 0, width: 500, height: 100 },
  effectIconsRegion: { x: 0, y: 0, width: 1920, height: 1080 }, anchorRegion: { x: 0, y: 0, width: 100, height: 50 } }
const png = fs.readFileSync(new URL('./fixtures/sanctum/map-entry-label.png', import.meta.url)).toString('base64')
const profile = () => liveProfile({ version: 1, environment, ...regions, anchor: { png }, captures: Object.fromEntries(['mapRegion','effectIconsRegion'].map(key => [key, { png, region: regions[key], environment }])) })
const entry = (kind, id, name) => ({ kind, id, name, aliases: [], descriptions: [], sourceId: 's', applicability: 'current', reviewedPatch: SEASON_BASELINE.patch })
const catalog = { schemaVersion: 1, game: 'poe1', patch: SEASON_BASELINE.patch, sources: [{ id: 's', channel: 'official' }],
  entries: [entry('reward','divine','神圣石'),entry('floor', 'f', '圣所档案室'), entry('room', 'room', '喷泉'), entry('affliction', 'pain', '痛苦')] }
const tick = () => new Promise(resolve => setImmediate(resolve))

test('词缀名称与换行描述独立识别并去重，不丢弃 OCR 原文', () => {
  const data=structuredClone(catalog)
  data.entries.find(e=>e.id==='pain').descriptions=['不能恢复坚毅']
  const room=parseSanctumRoomTexts(['喷泉','痛苦','不能恢复','坚毅'],data)
  assert.equal(room.afflictions.length,1)
  assert.equal(room.effects.length,1)
  assert.equal(room.effects[0].rule,'cannotRecover')
  assert.match(room.rawText,/不能恢复\n坚毅/)
  assert.equal(room.detailsStatus,'matched')
})

test('实时区域校验并保留旧区域，旧锚点不会成为标题', () => {
  assert.throws(() => liveRegions({ ...regions, mapRegion: { ...regions.mapRegion, x: -1 } }, environment), /越界/)
  assert.throws(() => liveProfile({ ...profile(), environment: { ...environment, dpi: null } }), /环境/)
  assert.equal(liveProfile({ ...profile(), anchor: { png: 'not-png' } }).anchor, undefined)
  assert.equal(profile().environment.windowId, undefined)
})

test('实时房间与路径参数绑定实际地图裁剪尺寸，效果区域越界拒绝', () => {
  const input = { ...profile(), calibration: { roomSize: [100, 150], pathHsv: [[12, 95, 42], [40, 255, 255]],
    imageSize: [1, 1], region: [-1, -1, 1, 1], dpi: 500 }, effectIconsRegion: regions.titleRegion }
  const saved = liveProfile(input)
  assert.deepEqual(saved.calibration, { version: 1, scope: 'live', imageSize: [1500, 800], region: [0, 0, 1500, 800],
    roomSize: [100, 150], pathHsv: [[12, 95, 42], [40, 255, 255]] })
  assert.deepEqual(liveProfile(saved), saved)
  assert.throws(() => liveProfile({ ...input, effectIconsRegion: { x: 1800, y: 0, width: 200, height: 100 } }), /越界/)
  assert.throws(() => liveProfile({ ...input, calibration: { ...input.calibration, roomSize: [2000, 150] } }), /房间尺寸/)
  assert.throws(() => liveProfile({ ...input, calibration: { ...input.calibration, pathHsv: [[40, 95, 42], [12, 255, 255]] } }), /路径颜色/)
})

test('当前效果读取实际可见规则影响评分条件，未知、歧义和空 OCR 始终保留缺口', () => {
  const effects = parseSanctumCurrentEffects(['不能恢复坚毅', '不能获得恩赐', '陌生效果', '不能恢复坚毅'], catalog)
  const rules = applySanctumEffects(effects)
  assert.equal(rules.cannotRecover, true)
  assert.equal(rules.cannotGainBoons, true)
  assert.equal(effects.filter(effect => effect.rule === 'cannotRecover').length, 1)
  assert.ok(rules.unknown.includes('陌生效果'))
  assert.ok(applySanctumEffects(parseSanctumCurrentEffects([], catalog)).unknown.length)
  assert.equal(applySanctumEffects(parseSanctumCurrentEffects(['constructor'], catalog)).cannotRecover, false)
})

test('原生地图观察只读图结构，不再执行固定区域效果 OCR', () => {
  const value = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
import sanctum_native as native
from sanctum_recognition import validate_calibration
session=native.NativeSession.__new__(native.NativeSession)
session.check=lambda:None
image=np.zeros((600,800,3),dtype=np.uint8)
session.image=lambda:(image,{'environment':{'width':800,'height':600,'dpi':96}})
shapes=[]
def ocr(view):
    shapes.append(list(view.shape)); return ['不能恢复坚毅']
session.ocr=ocr
session.match_title=lambda image, options, current: {'region':{'x':0,'y':0,'width':200,'height':50}}
cal={'version':1,'scope':'live','imageSize':[500,400],'region':[0,0,500,400],'roomSize':[80,120],'pathHsv':[[12,95,42],[40,255,255]]}
def analyze(view,options):
    validate_calibration(options,view.shape[1],view.shape[0])
    assert options==cal
    return {'rooms':[],'edges':[]}
native.analyze_floor=analyze
result=session.observe({'mapRegion':{'x':0,'y':0,'width':500,'height':400},'titleRegion':{'x':0,'y':0,'width':200,'height':50},
    'effectIconsRegion':{'x':500,'y':100,'width':250,'height':300},'areaLevelRegion':{'x':500,'y':0,'width':250,'height':60},'calibration':cal})
print(json.dumps({'shapes':shapes,'hasEffects': 'currentEffectTexts' in result['floor'],'hasTitle': 'titleTexts' in result['floor'], 'hasLevel': 'areaLevelTexts' in result['floor']}))
`)
  assert.deepEqual(value, { shapes: [], hasEffects: false, hasTitle: false, hasLevel: false })
})

test('房间文字保留领取时机、恢复与痛苦；未知及超大数值不伪装为完整识别', () => {
  const parsed = parseSanctumRoomTexts(['喷泉', '恢复 25 点坚毅', '完成本轮时获得 2 神圣石', '痛苦'], catalog)
  assert.equal(parsed.detailsStatus, 'matched')
  assert.equal(parsed.recovery, 25)
  assert.deepEqual(parsed.rewards, [{ groupId:'offer',currency: '神圣石', quantity: 2, timing: 'run' }])
  assert.equal(parsed.afflictions[0].id, 'pain')
  const partial = parseSanctumRoomTexts(['喷泉', '不能理解的效果', '立即获得 999999999999 神圣石'], catalog)
  assert.equal(partial.detailsStatus, 'partial')
  assert.deepEqual(partial.rewards, [])
  assert.ok(partial.effects.some(e=>e.status==='unknown'))
})

function fixture() {
  let time = 0, hidden = false
  const ui = { mode: 'map' }
  const commands = [], clients = []
  const frame = () => ({ ...nativeEnvironment, foreground: true, userTakeover: false, mapOpen: true, interfaceMatched: true,
    mapRegion: regions.mapRegion, fingerprint: 'graph', mapFingerprint: 'graph', timestamp: time += 400,
    floor: { currentRoomId: 'a', positionSource: 'paths', titleTexts: ['圣所档案室'], width: 1500, height: 800, rooms: [
      { id: 'a', column: 0, revealed: true, detailFingerprint: 'a', currentCandidate: true },
      { id: 'b', column: 1, revealed: true, detailFingerprint: 'b', terminal: true }], edges: [{ from: 'a', to: 'b', status: 'matched' }] } })
  const driver = new SanctumLiveDriver({ clientEvents: sanctumLogEvents().events, detection: detection(ui), catalog, wait: tick, withHidden: async action => { hidden = true; try { return await action() } finally { hidden = false } },
    windowActivation: { async activateGame() { return { success: true } } },
    makeClient: () => {
      const client = { closed: false, async request(command, input, { signal } = {}) {
        signal?.throwIfAborted(); commands.push(command)
        if (command === 'prepareFrames') return {count:8}
        if (command === 'freezeBaseline') return {baselineVersion:1}
        if (command === 'environment' || command === 'arm') return nativeEnvironment
        assert.equal(hidden, false)
        if (command === 'interfaceState') return { ...nativeEnvironment, mapOpen: ui.mode === 'map', hudVisible: ui.mode === 'effects', hudLayout: ui.mode === 'effects' ? 'standalone' : null }
        if (command === 'toggleMap') { ui.mode = input.targetMode; return { ...nativeEnvironment, mapOpen: ui.mode === 'map', hudVisible: ui.mode === 'effects', hudLayout: ui.mode === 'effects' ? 'standalone' : null } }
        if (command === 'inspectEffects') return { ...nativeEnvironment, icons: [] }
        if (command === 'observe') return frame()
        if (command === 'hover') return { status: 'located', texts: ['喷泉', '恢复 25 点坚毅'], mapFingerprint: 'graph', observation: frame() }
        throw new Error('unexpected command')
      }, async shutdown() { client.closed = true } }
      clients.push(client); return client
    } })
  return { driver, commands, clients }
}

test('保存截图校准后开始实时推荐贯穿服务，悬停与 OCR 不隐藏整个浮窗', { timeout: 10000 }, async () => {
  const { driver, commands, clients } = fixture(), lock = new AutomationLock()
  const service = new SanctumService({ catalog })
  service.attachLiveDriver(driver, lock); service.setEnabled(true); service.setForeground(true)
  service.state.liveCalibration = profile()
  let recommendation
  const unsubscribe = service.subscribe(state => {
    if (state.recommendation?.paths?.[0]?.nextRoomId === 'b' && state.floor.rooms.find(r=>r.id==='b')?.detailsStatus==='matched') { recommendation = state.recommendation; queueMicrotask(() => service.stop()) }
  })
  await service.startLive()
  assert.equal(recommendation.paths[0].nextRoomId,'b')
  assert.equal(commands.filter(command => command === 'hover').length, 2)
  assert.equal(lock.getState().locked, false)
  assert.equal(service.getState().running, false)
  assert.equal(service.getState().floor.captureStopped, true)
  assert.ok(clients.every(client => client.closed))
  unsubscribe(); await service.shutdown()
})

test('准备时禁用取消等待，迟到的实时环境不会保存或启动输入', async () => {
  let resolve, signal
  const driver = { prepare: (_profile, value) => { signal = value; return new Promise(done => { resolve = done }) }, close: async () => {} }
  const service = new SanctumService({})
  service.attachLiveDriver(driver, new AutomationLock()); service.setEnabled(true)
  service.state.liveCalibration = profile()
  const task = service.startLive(); await tick()
  service.setEnabled(false)
  assert.equal(signal.aborted, true)
  resolve({ ...nativeEnvironment, ...regions }); await task
  assert.equal(service.getState().liveEnvironment, null)
  assert.equal(service.getState().running, false)
  await service.shutdown()
})

test('窗口尺寸失配时不执行 arm 或悬停，楼层确认不依赖中文目录', async () => {
  const f = fixture(), signal = new AbortController().signal
  await assert.rejects(f.driver.prepare({ ...profile(), environment: { ...environment, width: 2000 } }, signal), /校准不符|不一致/)
  assert.equal(f.commands.includes('arm'), false)
  f.driver.catalog = { ...catalog, entries: [] }
  await f.driver.prepare(profile(), signal, new AutomationLock())
  assert.equal(f.driver.inspect().floor.identityConfirmed, true)
  assert.equal(f.driver.inspect().floor.floorId, 'floor:0')
  await f.driver.close()
})

function detection(ui = { mode: 'map' }) {
  return { getTitleConfig: () => ({ templates: { 'sanctum-hud': { png, environment }, 'sanctum-map': { png, environment }, 'sanctum-locker': { png, environment } }, threshold: .8 }),
    registerConsumer: async () => {}, unregisterConsumer: () => {}, subscribe: () => () => {},
    getState: () => ({ running: true, foreground: true, receivedAt: Date.now(), interfaces: { 'sanctum-hud': { matched: true }, 'sanctum-map': { matched: ui.mode === 'map' }, 'sanctum-locker': { matched: true } } }) }
}
