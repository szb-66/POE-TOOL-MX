import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { defaultMapTrackerOverlayBounds as _m0_defaultMapTrackerOverlayBounds, shouldShowMapTrackerOverlay as _m0_shouldShowMapTrackerOverlay } from '../electron/modules/mapTracker/overlayPolicy.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { mkdir as _m1_mkdir, mkdtemp as _m1_mkdtemp, readFile as _m1_readFile, writeFile as _m1_writeFile, rename as _m1_rename, readdir as _m1_readdir } from 'node:fs/promises'
import _m1_os from 'node:os'
import _m1_path from 'node:path'
import { createMapRun as _m1_createMapRun } from '../electron/modules/mapTracker/model.js'
import { MapTrackerRepository as _m1_MapTrackerRepository, atomicWrite as _m1_atomicWrite, csvEscape as _m1_csvEscape, runsToCsv as _m1_runsToCsv } from '../electron/modules/mapTracker/repository.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { mkdtemp as _m2_mkdtemp } from 'node:fs/promises'
import _m2_os from 'node:os'
import _m2_path from 'node:path'
import { MapTrackerRepository as _m2_MapTrackerRepository } from '../electron/modules/mapTracker/repository.js'
import { MapTrackerService as _m2_MapTrackerService, sanitizeTrackedItem as _m2_sanitizeTrackedItem } from '../electron/modules/mapTracker/service.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { mkdtemp as _m3_mkdtemp, rm as _m3_rm } from 'node:fs/promises'
import _m3_os from 'node:os'
import _m3_path from 'node:path'
import { MapTrackerService as _m3_MapTrackerService } from '../electron/modules/mapTracker/service.js'
import { MapTrackerRepository as _m3_MapTrackerRepository } from '../electron/modules/mapTracker/repository.js'
import { MapTrackerStateMachine as _m3_MapTrackerStateMachine } from '../electron/modules/mapTracker/stateMachine.js'
import { ClientEventsService as _m3_ClientEventsService } from '../electron/modules/clientEvents/service.js'
import { parseClientLogLine as _m3_parseClientLogLine } from '../electron/modules/clientEvents/parser.js'
import { detectClientProcesses as _m3_detectClientProcesses } from '../electron/modules/clientEvents/processDetection.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { MapTrackerStateMachine as _m4_MapTrackerStateMachine } from '../electron/modules/mapTracker/stateMachine.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { readFileSync as _m5_readFileSync } from 'node:fs'
import { createPinia as _m5_createPinia, setActivePinia as _m5_setActivePinia } from 'pinia'
import { ATLAS_MAP_AFFIX_SUGGESTIONS as _m5_ATLAS_MAP_AFFIX_SUGGESTIONS } from '../src/data/mapAffixSuggestionsData.js'
import _m5_internationalMapData from '../src/data/internationalMapData.js'
import { cleanMapRegexConfig as _m5_cleanMapRegexConfig, createDefaultMapRegexConfig as _m5_createDefaultMapRegexConfig, filterMapRegexAffixes as _m5_filterMapRegexAffixes, generateMapRegex as _m5_generateMapRegex, mapRegexCatalog as _m5_mapRegexCatalog } from '../src/domains/regex/mapRegex.js'
import { useRegexPresetStore as _m5_useRegexPresetStore } from '../src/domains/regex/regexPresetStore.js'
import { moduleHelpTopicsById as _m5_moduleHelpTopicsById } from '../src/domains/help/helpContent.js'
import { MAP_FORMAT_EXAMPLES as _m5_MAP_FORMAT_EXAMPLES } from '../src/utils/supportedItemFormats.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { VOYAGE_REWARD_MODE_OPTIONS as _m6_VOYAGE_REWARD_MODE_OPTIONS, VOYAGE_REWARD_STRATEGIES as _m6_VOYAGE_REWARD_STRATEGIES, normalizeVoyageRewardMode as _m6_normalizeVoyageRewardMode, scoreVoyageMod as _m6_scoreVoyageMod } from '../src/domains/puzzle/voyageRewards.js'
import { BORDER_CHART_MODS as _m6_BORDER_CHART_MODS, FRAGMENT_CHART_MODS as _m6_FRAGMENT_CHART_MODS } from '../src/data/chartModsData.js'

// === Merged from mapTrackerOverlay.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const defaultMapTrackerOverlayBounds = _m0_defaultMapTrackerOverlayBounds
  const shouldShowMapTrackerOverlay = _m0_shouldShowMapTrackerOverlay
const snapshot = (overrides = {}) => ({ foreground: true, activeRun: {}, settings: { enabled: true, paused: false, overlay: { enabled: true }, ...overrides } })

test('浮窗启用后在游戏前台常显，包括等待地图与暂停状态', () => {
  assert.equal(shouldShowMapTrackerOverlay(snapshot()), true)
  assert.equal(shouldShowMapTrackerOverlay({ ...snapshot(), foreground: false }), false)
  assert.equal(shouldShowMapTrackerOverlay(snapshot({ paused: true })), true)
  assert.equal(shouldShowMapTrackerOverlay({ ...snapshot(), activeRun: null }), true)
  assert.equal(shouldShowMapTrackerOverlay(snapshot({ overlay: { enabled: false } })), false)
})

test('浮窗默认位置遵循显示器工作区并保留 DPI 后坐标', () => {
  assert.deepEqual(defaultMapTrackerOverlayBounds({ x: 100, y: 50, width: 1600, height: 900 }), { x: 1436, y: 74, width: 240, height: 88 })
})

test('浮窗管理器默认点击穿透并持久化移动位置', () => {
  const code = readFileSync(new URL('../electron/modules/mapTracker/overlay.js', import.meta.url), 'utf8')
  assert.match(code, /setIgnoreMouseEvents\(true/); assert.match(code, /this\.window\.on\('moved'/); assert.match(code, /updateSettings\(\{ overlay:/)
  assert.doesNotMatch(code, /requested|setHeld/); assert.doesNotMatch(code, /interactive|setFocusable/)
})

test('浮窗拖动抓手仅在显示时解除穿透且拖拽中不逐帧持久化', () => {
  const code = readFileSync(new URL('../electron/modules/mapTracker/overlay.js', import.meta.url), 'utf8')
  assert.match(code, /OverlayDragPassthroughController/); assert.match(code, /OverlayDragSession/)
  assert.match(code, /isPointInCenteredOverlayDragHandle\(point, bounds\)/)
  assert.match(code, /win\?\.isVisible\(\)\) && this\.shouldShow\(\)/)
  assert.match(code, /if \(this\.dragSession\.active\) return/)
  assert.match(code, /focusable: false/)
})

test('浮窗拖拽 IPC 通道钳制工作区并在结束时持久化位置', () => {
  const code = readFileSync(new URL('../electron/modules/ipc/mapTracker.js', import.meta.url), 'utf8')
  assert.match(code, /'map-tracker:overlay-move'/)
  assert.match(code, /win\.webContents !== event\.sender/)
  assert.match(code, /getFixedOverlayDragBounds\(requested, workArea, MAP_TRACKER_OVERLAY_SIZE\)/)
  assert.doesNotMatch(code, /getFixedOverlayDragBounds\(requested, workArea, win\.getBounds\(\)\)/)
  assert.match(code, /session\.begin\(event\.sender\.id, point, win\.getBounds\(\)\)\) overlay\.setDragging\(true\)/)
  assert.match(code, /if \(!session\.end\(event\.sender\.id\)\) return\s*\n\s*overlay\.setDragging\(false\)/)
})

test('浮窗视图提供拖动抓手并复用共享拖拽手势', () => {
  const view = readFileSync(new URL('../src/domains/mapTracker/MapTrackerOverlayView.vue', import.meta.url), 'utf8')
  assert.match(view, /class="drag-handle"/)
  assert.match(view, /createOverlayDrag\(message => electronApi\.mapTracker\.moveOverlay\(message\)\)/)
  const api = readFileSync(new URL('../src/api/electron.js', import.meta.url), 'utf8')
  assert.match(api, /moveOverlay: \(drag\) => window\.electronAPI\.moveMapTrackerOverlay\?/)
  const preload = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
  assert.match(preload, /moveMapTrackerOverlay: \(point\) => ipcRenderer\.send\('map-tracker:overlay-move', point\)/)
})
})()

// === Merged from mapTrackerRepository.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const mkdir = _m1_mkdir
  const mkdtemp = _m1_mkdtemp
  const readFile = _m1_readFile
  const writeFile = _m1_writeFile
  const rename = _m1_rename
  const readdir = _m1_readdir
  const os = _m1_os
  const path = _m1_path
  const createMapRun = _m1_createMapRun
  const MapTrackerRepository = _m1_MapTrackerRepository
  const atomicWrite = _m1_atomicWrite
  const csvEscape = _m1_csvEscape
  const runsToCsv = _m1_runsToCsv
const makeRoot = () => mkdtemp(path.join(os.tmpdir(), 'map-tracker-'))
const run = (overrides = {}) => createMapRun({ areaId: 'MapWorldsCemetery', areaName: '墓地', instanceKey: 'MapWorldsCemetery:1', startedAt: '2026-09-03T01:00:00.000Z', endedAt: '2026-09-03T01:10:00.000Z', ...overrides })

test('并发保存冻结输入，保存和清除严格按顺序执行', async () => {
  const repository = new MapTrackerRepository(await makeRoot())
  const value = run({ character: { name: '角色甲' } })
  const first = repository.saveActiveRun(value)
  value.character.name = '角色乙'
  await first
  assert.equal((await repository.getActiveRun()).character.name, '角色甲')
  const writes = Array.from({ length: 40 }, (_, index) => repository.saveActiveRun({ ...value, deaths: index }))
  await Promise.all(writes)
  assert.equal((await repository.getActiveRun()).deaths, 39)
  await Promise.all([repository.saveActiveRun(value), repository.clearActiveRun()])
  assert.equal(await repository.getActiveRun(), null)
  await Promise.all([repository.clearActiveRun(), repository.saveActiveRun(value)])
  assert.equal((await repository.getActiveRun()).id, value.id)
})

test('同月并发结算不覆盖其他记录', async () => {
  const repository = new MapTrackerRepository(await makeRoot())
  await Promise.all(Array.from({ length: 20 }, () => repository.saveRun(run())))
  assert.equal((await repository.query()).total, 20)
})

test('替换遇到短暂占用按指定间隔重试，持续失败保留旧文件并清理临时文件', async () => {
  const root = await makeRoot(); const target = path.join(root, 'active.json')
  await atomicWrite(target, { version: 1 })
  const delays = []; let attempts = 0
  await atomicWrite(target, { version: 2 }, {
    sleep: async delay => { delays.push(delay) },
    replace: async (...args) => {
      assert.deepEqual(JSON.parse(await readFile(target, 'utf8')), { version: 1 })
      if (++attempts < 4) throw Object.assign(new Error('occupied'), { code: ['EPERM', 'EACCES', 'EBUSY'][attempts - 1] })
      return rename(...args)
    }
  })
  assert.deepEqual(delays, [50, 100, 200])
  attempts = 0
  await assert.rejects(atomicWrite(target, { version: 3 }, {
    sleep: async () => {},
    replace: async () => { attempts++; throw Object.assign(new Error('occupied'), { code: 'EPERM' }) }
  }), { code: 'EPERM' })
  assert.equal(attempts, 4)
  assert.deepEqual(JSON.parse(await readFile(target, 'utf8')), { version: 2 })
  assert.deepEqual(await readdir(root), ['active.json'])
  await atomicWrite(target, { version: 4 })
  assert.deepEqual(JSON.parse(await readFile(target, 'utf8')), { version: 4 })
})

test('仓储保存设置、活动草稿和月度记录', async () => {
  const root = await makeRoot(); const repository = new MapTrackerRepository(root)
  assert.equal((await repository.getSettings()).enabled, false)
  await repository.saveSettings({ enabled: true }); assert.equal((await repository.getSettings()).enabled, true)
  const active = run(); await repository.saveActiveRun(active); assert.equal((await repository.getActiveRun()).id, active.id)
  await repository.clearActiveRun(); assert.equal(await repository.getActiveRun(), null)
  await repository.saveRun(active); const result = await repository.query()
  assert.equal(result.total, 1); assert.equal(result.items[0].areaName, '晨曦墓地')
})

test('查询支持筛选分页、编辑允许字段和删除', async () => {
  const repository = new MapTrackerRepository(await makeRoot())
  const first = run({ areaName: '墓地' }); const second = run({ areaName: '博物馆', areaId: 'MapWorldsMuseum', instanceKey: 'MapWorldsMuseum:2', startedAt: '2026-09-04T01:00:00.000Z' })
  await repository.saveRun(first); await repository.saveRun(second)
  const page = await repository.query({ map: '墓', pageSize: 1 }); assert.equal(page.total, 1)
  const edited = await repository.editRun(first.id, { areaName: '新名称', deaths: 99 })
  assert.equal(edited.areaName, '晨曦墓地'); assert.equal(edited.deaths, 0); assert.equal('deviceInputs' in edited, false)
  await repository.deleteRun(second.id); assert.equal((await repository.query()).total, 1)
})

test('损坏分片只读隔离且不影响其他月份', async () => {
  const repository = new MapTrackerRepository(await makeRoot()); const good = run(); await repository.saveRun(good)
  const broken = path.join(repository.root, 'runs', 'standard', '2026-10.json')
  await mkdir(path.dirname(broken), { recursive: true }); await writeFile(broken, '{broken', 'utf8')
  const result = await repository.query(); assert.equal(result.total, 1); assert.equal(result.errors.length, 1)
  assert.equal(await readFile(broken, 'utf8'), '{broken')
})

test('CSV 使用 BOM、稳定列和标准转义', () => {
  assert.equal(csvEscape('a,"b"'), '"a,""b"""')
  const csv = runsToCsv([run({ areaId: 'MapWorldsUnknown', areaName: '第一行\n第二行' })])
  assert.equal(csv.charCodeAt(0), 0xFEFF); assert.match(csv, /startedAt,endedAt,areaName/); assert.match(csv, /"第一行\n第二行"/)
  assert.doesNotMatch(csv, /mapModifiers|notes|mechanics|deviceInputs/)
})

test('CSV 删除经验列并保持其余列顺序', () => {
  const csv = runsToCsv([run()])
  assert.equal(csv.split('\r\n')[0], '\uFEFFstartedAt,endedAt,areaName,areaId,areaLevel,mapTier,activeDurationMs,deaths,portalsUsed,character,endReason')
})

test('旧经验记录整条过滤，包含空字段；读取不改写文件，新记录正常导出', async () => {
  const repository = new MapTrackerRepository(await makeRoot())
  const good = run({ id: 'new-record', deaths: 2, portalsUsed: 3, activeDurationMs: 60000 })
  await repository.saveRun(good)
  const file = repository.shardPath(good)
  const legacy = ['experienceEfficiency', 'experienceStart', 'experienceEnd', 'experienceGain', 'experienceSampleCount', 'experienceFirstSampleAt', 'experienceLastSampleAt'].map((key, index) => ({ ...good, id: `legacy-${index}`, [key]: index % 2 ? 100 : null }))
  const original = JSON.stringify({ schemaVersion: 1, runs: [...legacy, good] })
  await writeFile(file, original)
  assert.deepEqual((await repository.all()).runs, [good])
  assert.equal((await repository.query()).total, 1)
  const target = path.join(repository.root, 'export.csv')
  assert.deepEqual(await repository.exportCsv({}, target), { count: 1 })
  assert.doesNotMatch(await readFile(target, 'utf8'), /experience/)
  assert.equal(await readFile(file, 'utf8'), original)
})

test('旧经验草稿保留地图与计时但剥离经验字段', async () => {
  const repository = new MapTrackerRepository(await makeRoot())
  const draft = run({ activeDurationMs: 120000, deaths: 2, portalsUsed: 4 })
  await mkdir(repository.root, { recursive: true })
  await writeFile(repository.activePath, JSON.stringify({ schemaVersion: 1, run: { ...draft, experienceStart: 100 } }))
  assert.deepEqual(await repository.getActiveRun(), draft)
})
})()

// === Merged from mapTrackerService.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const mkdtemp = _m2_mkdtemp
  const os = _m2_os
  const path = _m2_path
  const MapTrackerRepository = _m2_MapTrackerRepository
  const MapTrackerService = _m2_MapTrackerService
  const sanitizeTrackedItem = _m2_sanitizeTrackedItem
class Events { constructor(){ this.listener = null } onEvent(listener){ this.listener = listener; return () => { this.listener = null } } emit(event){ this.listener?.(event) } }
const setup = async ({ commandSender = async () => {} } = {}) => {
  let now = 10000; const events = new Events(); const repository = new MapTrackerRepository(await mkdtemp(path.join(os.tmpdir(), 'map-service-')))
  const service = new MapTrackerService({ repository, clientEvents: events, commandSender, now: () => now, idleProvider: () => 0 })
  await service.initialize(); await service.updateSettings({ enabled: true, enhancements: { loot: true } }); service.setForeground(true)
  await service.handleEvent({ type: 'area-entered', areaId: 'MapWorldsCemetery', seed: '1', areaLevel: 83, mapTier: 16 })
  return { service, repository, events, setNow: (value) => { now = value } }
}

test('定时写入不重叠，失败报告后下一轮恢复且入库记录完整', async (t) => {
  const { service, repository } = await setup()
  t.after(() => service.shutdown({ normal: false }))
  const original = repository.saveActiveRun.bind(repository)
  let release; let calls = 0
  repository.saveActiveRun = async () => {
    calls++
    await new Promise(resolve => { release = resolve })
    throw Object.assign(new Error('occupied'), { code: 'EPERM' })
  }
  const first = service.runScheduledTick()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(service.runScheduledTick(), first)
  assert.equal(calls, 1)
  release(); await first
  assert.match(service.snapshot().errors.join(), /occupied/)
  repository.saveActiveRun = original
  const id = service.snapshot().activeRun.id
  await Promise.all([
    service.runScheduledTick(),
    ...Array.from({ length: 30 }, (_, index) => service.recordStashedItem({ name: `物品${index}`, quantity: 1 }, `${id}:${index}`))
  ])
  assert.equal((await repository.getStashEvents(10000)).events.length, 30)
})

test('关闭先取消生产者并等待在途保存，再结算和清除草稿', async () => {
  const { service, repository, events } = await setup()
  const original = repository.saveActiveRun.bind(repository)
  let release
  repository.saveActiveRun = async run => {
    await new Promise(resolve => { release = resolve })
    return original(run)
  }
  const pending = service.runScheduledTick()
  await new Promise(resolve => setImmediate(resolve))
  const shutdown = service.shutdown()
  assert.equal(events.listener, null)
  assert.equal(service.tickTimer, null)
  release()
  await Promise.all([pending, shutdown])
  assert.equal(await repository.getActiveRun(), null)
  assert.equal((await repository.query()).total, 1)
})

test('结算写入失败保留待保存记录，后续定时任务恢复', async (t) => {
  const { service, repository } = await setup()
  t.after(() => service.shutdown({ normal: false }))
  const original = repository.saveRun.bind(repository)
  repository.saveRun = async () => { throw new Error('disk unavailable') }
  await assert.rejects(service.finish(), /disk unavailable/)
  assert.equal(service.machine.completed.length, 1)
  repository.saveRun = original
  await service.runScheduledTick()
  assert.equal(service.machine.completed.length, 0)
  assert.equal((await repository.query()).total, 1)
  assert.equal(await repository.getActiveRun(), null)
})



test('服务订阅事件、保存草稿并在新地图原子结算', async () => {
  const { service, repository } = await setup()
  await service.handleEvent({ type: 'player-death' }); assert.equal(service.snapshot().activeRun.deaths, 1)
  await service.handleEvent({ type: 'area-entered', areaId: 'MapWorldsMuseum', seed: '2', areaLevel: 82, mapTier: 15 })
  assert.equal((await repository.query()).total, 1); assert.equal((await repository.getActiveRun()).areaId, 'MapWorldsMuseum')
  await service.shutdown({ normal: false })
})

test('独立入库只保存最小白名单并按数量累计，切换地图不影响', async t => {
  const item = { name: '墓地地图', baseName: '墓地地图', rarity: '稀有', stackSize: 2, secret: '不得保存', modifiers: ['词缀'] }
  const { service, repository } = await setup()
  t.after(() => service.shutdown({ normal: false }))
  await service.recordStashedItem(item, 'batch:1')
  const event = (await repository.getStashEvents(10000)).events[0]
  assert.deepEqual(Object.keys(event).sort(), ['baseType', 'id', 'name', 'quantity', 'rarity', 'recordedAt'])
  assert.equal(service.snapshot().summary.todayLoot, 2)
  assert.equal(Object.hasOwn(await repository.getActiveRun(), 'loot'), false)
  await service.handleEvent({ type: 'area-entered', areaId: 'MapWorldsMuseum', seed: '2', areaLevel: 82 })
  await service.recordStashedItem({ name: '混沌石', quantity: 23 }, 'batch:2')
  assert.equal(service.snapshot().summary.todayLoot, 25)
  assert.deepEqual(sanitizeTrackedItem(item), { name: '墓地地图', baseType: '墓地地图', rarity: '稀有', quantity: 2 })
})

test('旧经验配置不恢复采样，地图结算保留计时和死亡', async t => {
  const { service, repository, setNow } = await setup()
  t.after(() => service.shutdown({ normal: false }))
  let requests = 0
  service.characterProvider = () => { requests++; throw new Error('不应查询经验') }
  await service.updateSettings({ enhancements: { character: true }, experienceObservation: { first: 100, latest: 200 }, selectedCharacter: { name: '旧角色' } })
  setNow(70000)
  await service.handleEvent({ type: 'player-death' })
  await service.handleEvent({ type: 'character-level', level: 99 })
  await service.handleEvent({ type: 'area-entered', areaId: 'Hideout' })
  const result = (await repository.all()).runs[0]
  assert.equal(result.activeDurationMs, 60000)
  assert.equal(result.deaths, 1)
  assert.equal(requests, 0)
  assert.doesNotMatch(JSON.stringify(service.snapshot()), /experience/i)
  assert.doesNotMatch(JSON.stringify(result), /experience/i)
  assert.equal(Object.hasOwn(service.snapshot().settings.enhancements, 'character'), false)
})
})()

// === Merged from mapTrackerSettlement.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const mkdtemp = _m3_mkdtemp
  const rm = _m3_rm
  const os = _m3_os
  const path = _m3_path
  const MapTrackerService = _m3_MapTrackerService
  const MapTrackerRepository = _m3_MapTrackerRepository
  const MapTrackerStateMachine = _m3_MapTrackerStateMachine
  const ClientEventsService = _m3_ClientEventsService
  const parseClientLogLine = _m3_parseClientLogLine
  const detectClientProcesses = _m3_detectClientProcesses
const character = { accountName: 'test', name: '测试角色', league: '测试赛季' }
const area = (seed = '1', areaId = 'MapWorldsCemetery', extra = {}) => ({ type: 'area-entered', areaId, seed, areaLevel: 83, ...extra })
const town = () => area('h', 'Hideout')
const disconnected = { type: 'game-state', state: 'disconnected', reason: 'disconnect' }
const log = body => `2026/09/07 19:05:45 8034250 eee1d8f2 [INFO Client 123] ${body}`
const flush = async service => { await service.workQueue; while (service.inFlight.size) await Promise.allSettled([...service.inFlight]); await service.workQueue }
async function setup(t, options = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'map-settle-'))
  let now = Date.parse('2026-09-07T10:00:00Z')
  const repository = new MapTrackerRepository(root)
  const service = new MapTrackerService({ repository, now: () => now, ...options })
  await service.initialize(); await service.updateSettings({ enabled: true, selectedCharacter: character, enhancements: { kills: false, character: false, loot: true } })
  service.setForeground(true)
  t.after(async () => { await service.shutdown({ normal: false }); await rm(root, { recursive: true, force: true }) })
  return { service, repository, advance: ms => { now += ms } }
}

test('真实系统断线和区域就绪可解析，聊天与普通网络连接不改变游戏状态', () => {
  assert.equal(parseClientLogLine(log('Generating level 83 area \"MapWorldsCitySquare\" with seed 123').replace('[INFO Client', '[DEBUG Client')).type, 'area-entered')
  assert.equal(parseClientLogLine(log('Abnormal disconnect: 发生无法预期的断线。')).state, 'disconnected')
  assert.equal(parseClientLogLine(log('Connected to 127.0.0.1 in 0ms.')), null)
  assert.equal(parseClientLogLine(log('@玩家: Abnormal disconnect: 发生无法预期的断线。')), null)
  assert.equal(parseClientLogLine(log('@玩家: Generating level 83 area "MapWorldsCemetery" with seed 1')), null)
  assert.equal(parseClientLogLine(log(': 你已进入： 城中广场。')).state, 'in-game')
  assert.equal(parseClientLogLine(log('@玩家: : 你已进入： 城中广场。')), null)
})

test('进程退出独立于前台，检测失败不报告退出且重复退出幂等', async () => {
  let ids = [123]
  const client = new ClientEventsService({ processProvider: async () => ids, processPresenceProvider: async () => false })
  client.status.enabled = true
  await client.pollProcess()
  client.acceptLine(log('Generating level 83 area "MapWorldsCemetery" with seed 1'))
  client.acceptLine(log(': 你已进入： 城中广场。'))
  ids = null; await client.pollProcess(); assert.equal(client.snapshot().gameState, 'in-game')
  ids = []; await client.pollProcess(); await client.pollProcess()
  assert.equal(client.snapshot().gameState, 'disconnected')
  assert.equal(client.events.filter(event => event.reason === 'process-exit').length, 1)
  client.setState({ state: 'error', error: 'unreadable' })
  assert.equal(client.snapshot().gameState, 'unknown')
})

test('白名单进程检测只返回PID且隐藏窗口', async () => {
  const result = await detectClientProcesses({ execFileImpl: (_exe, _args, options, callback) => {
    assert.equal(options.windowsHide, true)
    callback(null, '"PathOfExile_x64.exe","123","Console"\n"Other.exe","456","Console"')
  } })
  assert.deepEqual(result, [123])
  assert.equal(await detectClientProcesses({ execFileImpl: (_exe, _args, _options, cb) => cb(new Error('denied')) }), null)
})

test('离图即时落盘，同实例回访累计并保持历史与摘要只有一条', async t => {
  const { service, repository, advance } = await setup(t)
  await service.handleEvent(area()); const id = service.snapshot().activeRun.id
  advance(1000); await service.handleEvent({ type: 'player-death' }); await service.handleEvent(town())
  assert.equal(service.snapshot().activeRun, null)
  assert.equal((await repository.query()).total, 1)
  assert.equal(service.snapshot().summary.todayCount, 1)
  advance(20000); await service.handleEvent(area())
  assert.equal(service.snapshot().activeRun.id, id)
  assert.equal(service.snapshot().activeRun.portalsUsed, 2)
  advance(2000); await service.tick()
  assert.equal(service.snapshot().summary.todayCount, 1)
  assert.equal(service.snapshot().summary.windows[1].durations[0].totalDurationMs, 3000)
  await service.handleEvent(town())
  const runs = (await repository.all()).runs
  assert.equal(runs.length, 1); assert.equal(runs[0].activeDurationMs, 3000); assert.equal(runs[0].deaths, 1)
})

test('附属区域不结算，加载期间不计时，断线立即结算且仅网络连接不恢复', async t => {
  const { service, repository, advance } = await setup(t)
  await service.handleEvent(area()); advance(1000)
  await service.handleEvent(area('2', 'AbyssLeague'))
  assert.equal((await repository.all()).runs.length, 0)
  advance(1000); await service.handleEvent({ type: 'game-state', state: 'loading' })
  advance(10000); await service.handleEvent(area('1', 'MapWorldsCemetery', { loading: true }))
  advance(10000); await service.tick()
  assert.equal(service.snapshot().activeRun.activeDurationMs, 2000)
  await service.handleEvent({ type: 'game-state', state: 'in-game', reason: 'area-ready' })
  advance(1000); await service.handleEvent(disconnected); await service.handleEvent(disconnected)
  assert.equal(service.snapshot().activeRun, null)
  assert.equal((await repository.all()).runs[0].activeDurationMs, 3000)
  advance(10000); service.setForeground(true); await service.tick()
  assert.equal(service.snapshot().gameState, 'disconnected')
  assert.equal((await repository.all()).runs.length, 1)
})

test('相同seed不同会话不合并，无seed不合并，断线后不跨上下文合并', () => {
  const machine = new MapTrackerStateMachine()
  machine.setEnabled(true); machine.setCharacter(character)
  machine.handleEvent(area()); const first = machine.activeRun.id
  machine.handleEvent(town()); machine.sessionKey = "other-session"; machine.setCharacter({ ...character, name: '另一角色' }); machine.handleEvent(area())
  assert.notEqual(machine.activeRun.id, first)
  machine.handleEvent(town()); machine.handleEvent(area(null)); const unknownSeed = machine.activeRun.id
  machine.handleEvent(town()); machine.handleEvent(area(null)); assert.notEqual(machine.activeRun.id, unknownSeed)
  machine.handleEvent(town()); machine.setCharacter(null); machine.handleEvent(area('3')); const unknownCharacter = machine.activeRun.id
  machine.handleEvent(disconnected); machine.handleEvent(area('3')); assert.notEqual(machine.activeRun.id, unknownCharacter)
})

test('已确认日志会话可跨启动恢复实例，草稿恢复不自动计时', async t => {
  const { service, repository } = await setup(t)
  await service.handleEvent(area('1', 'MapWorldsCemetery', { sessionKey: 'verified-session' })); const id = service.machine.activeRun.id
  await service.handleEvent(town())
  const next = new MapTrackerService({ repository }); await next.initialize()
  t.after(() => next.shutdown({ normal: false }))
  next.setForeground(true); await next.handleEvent(area('1', 'MapWorldsCemetery', { sessionKey: 'verified-session' }))
  assert.equal(next.machine.activeRun.id, id)
  const machine = new MapTrackerStateMachine({ now: () => 0 }); machine.setEnabled(true); machine.setForeground(true)
  machine.restore(next.machine.activeRun); machine.tick(10000)
  assert.equal(machine.activeRun.activeDurationMs, next.machine.activeRun.activeDurationMs)
})


test('入库不补写历史，重入和跨地图不改变独立统计', async t => {
  const { service, repository } = await setup(t)
  await service.handleEvent(area())
  await service.handleEvent(town())
  await service.recordStashedItem({ name: '混沌石', quantity: 7 }, 'batch:1')
  assert.equal(Object.hasOwn((await repository.all()).runs[0], 'loot'), false)
  await service.handleEvent(area())
  await service.recordStashedItem({ name: '混沌石', quantity: 9 }, 'batch:2')
  await service.handleEvent(area('2'))
  assert.equal(service.snapshot().summary.todayLoot, 16)
  assert.equal(Object.hasOwn(service.snapshot(), 'lootRunId'), false)
})


test('结算写入期间收到新区域和断线，不会在旧队列放行任何输入', async t => {
  const sent = []
  const { service, repository } = await setup(t, { commandSender: async command => sent.push(command) })
  await service.updateSettings({ enhancements: { kills: true } })
  const original = repository.saveActiveRun.bind(repository)
  let release
  repository.saveActiveRun = async run => { await new Promise(resolve => { release = resolve }); repository.saveActiveRun = original; return original(run) }
  const entering = service.handleEvent(area())
  await new Promise(resolve => setImmediate(resolve))
  const ready = service.handleEvent({ type: 'game-state', state: 'in-game' })
  const exit = service.handleEvent(disconnected)
  release(); await Promise.all([entering, ready, exit]); await flush(service)
  assert.deepEqual(sent, [])
  assert.equal((await repository.all()).runs.length, 1)
  assert.equal(service.liveGameState, 'disconnected')
})

test('日志不可用暂停计时与输入，恢复监听本身不等于恢复游戏', async t => {
  const { service, advance } = await setup(t)
  await service.handleEvent(area()); advance(1000)
  await service.handleEvent({ type: 'client-state', state: 'error' })
  advance(10000); await service.tick()
  assert.equal(service.machine.activeRun.activeDurationMs, 1000)
  await service.handleEvent({ type: 'client-state', state: 'started' })
  advance(10000); await service.tick()
  assert.equal(service.machine.activeRun.activeDurationMs, 1000)
  assert.equal(service.requestCommand, undefined)
})

test('删除结算记录后不会通过入库或实例索引复活，重入使用标准名称', async t => {
  const { service, repository } = await setup(t)
  await service.handleEvent(area()); const id = service.machine.activeRun.id
  await service.handleEvent(town()); await service.editRun(id, { areaName: '自定义地图名' })
  await service.handleEvent(area()); assert.equal(service.machine.activeRun.areaName, '晨曦墓地')
  await service.handleEvent(town()); await service.deleteRun(id)
  assert.equal(await service.recordStashedItem({ name: '混沌石' }, 'deleted-map-batch:1'), true)
  await service.handleEvent(area()); assert.notEqual(service.machine.activeRun.id, id)
  assert.equal((await repository.all()).runs.length, 0)
})
})()

// === Merged from mapTrackerStateMachine.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const MapTrackerStateMachine = _m4_MapTrackerStateMachine
test('首次进图、回城再入和附属区域维持同一局', () => {
  let time = 0; const machine = new MapTrackerStateMachine({ now: () => time })
  machine.setEnabled(true); machine.setForeground(true)
  machine.handleEvent({ type: 'area-entered', areaId: 'MapWorldsCemetery', seed: '7', areaLevel: 83, mapTier: 16 })
  assert.equal(machine.activeRun.portalsUsed, 1)
  time = 1000; machine.handleEvent({ type: 'area-entered', areaId: 'AbyssLeague', seed: '8', areaLevel: 83, mapTier: 16 })
  assert.equal(machine.activeRun.portalsUsed, 1)
  time = 2000; machine.handleEvent({ type: 'area-entered', areaId: 'Hideout', seed: '1', areaLevel: 60, mapTier: null })
  time = 3000; machine.handleEvent({ type: 'area-entered', areaId: 'MapWorldsCemetery', seed: '7', areaLevel: 83, mapTier: 16 })
  assert.equal(machine.activeRun.portalsUsed, 2)
})

test('计时排除失焦和暂停但包含空闲并在新实例自动结算', () => {
  let time = 0; const machine = new MapTrackerStateMachine({ now: () => time })
  machine.setEnabled(true); machine.setForeground(true)
  machine.handleEvent({ type: 'area-entered', areaId: 'MapWorldsCemetery', seed: '1', areaLevel: 83, mapTier: 16 })
  time = 1000; machine.tick(); machine.setIdleMs(10000)
  time = 3000; machine.tick(); machine.setIdleMs(0); machine.setPaused(true)
  time = 5000; machine.tick(); machine.setPaused(false)
  time = 6000; machine.handleEvent({ type: 'area-entered', areaId: 'MapWorldsMuseum', seed: '2', areaLevel: 82, mapTier: 15 })
  assert.equal(machine.completed[0].activeDurationMs, 4000)
  assert.equal(machine.completed[0].endReason, 'next-map')
})

test('死亡只更新活动局', () => {
  const machine = new MapTrackerStateMachine({ now: () => 0 }); machine.setEnabled(true)
  machine.handleEvent({ type: 'area-entered', areaId: 'MapWorldsBog', seed: '1', areaLevel: 80, mapTier: 13 })
  machine.handleEvent({ type: 'player-death' })
  assert.equal(machine.activeRun.deaths, 1)
})
})()

// === Merged from unifiedMapCatalog.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const readFileSync = _m5_readFileSync
  const createPinia = _m5_createPinia
  const setActivePinia = _m5_setActivePinia
  const ATLAS_MAP_AFFIX_SUGGESTIONS = _m5_ATLAS_MAP_AFFIX_SUGGESTIONS
  const internationalMapData = _m5_internationalMapData
  const cleanMapRegexConfig = _m5_cleanMapRegexConfig
  const createDefaultMapRegexConfig = _m5_createDefaultMapRegexConfig
  const filterMapRegexAffixes = _m5_filterMapRegexAffixes
  const generateMapRegex = _m5_generateMapRegex
  const mapRegexCatalog = _m5_mapRegexCatalog
  const useRegexPresetStore = _m5_useRegexPresetStore
  const moduleHelpTopicsById = _m5_moduleHelpTopicsById
  const MAP_FORMAT_EXAMPLES = _m5_MAP_FORMAT_EXAMPLES
for (const language of ['zh-CN', 'en']) {
  test(`${language} 旧分组迁移后全地图目录可见且条件、正则结果不变`, () => {
    const catalog = mapRegexCatalog(language)
    const expectedIds = language === 'en' ? internationalMapData.atlas.map(item => item.id) : ATLAS_MAP_AFFIX_SUGGESTIONS.map(item => item.canonicalId)
    assert.deepEqual(catalog.affixes.map(item => item.id), expectedIds)
    assert.ok(catalog.affixes.every(item => item.regions.length === 1 && item.regions[0] === 'atlas'))
    const baseline = createDefaultMapRegexConfig(language)
    baseline.includeAffixIds = [catalog.affixes[0].id]
    baseline.excludeAffixIds = [catalog.affixes.at(-1).id]
    baseline.stats.packSize = { enabled: true, value: 30 }
    baseline.priceRange = { min: 1, max: 10, currencies: ['div'] }
    const expectedResult = generateMapRegex(baseline, language)
    for (const region of ['normal', 't17', 'atlas', undefined]) {
      const legacy = { ...baseline, region }
      const migrated = cleanMapRegexConfig(legacy, language)
      assert.deepEqual(migrated, baseline)
      assert.deepEqual(generateMapRegex(migrated, language), expectedResult)
      assert.deepEqual(filterMapRegexAffixes(legacy, '', language).map(item => item.id), expectedIds)
    }
    const prefixOnly = filterMapRegexAffixes({ ...baseline, affixTypes: ['prefix'] }, '', language)
    assert.ok(prefixOnly.length > 0 && prefixOnly.length < expectedIds.length)
    assert.ok(prefixOnly.every(item => item.affixType === 'prefix' || item.affixType === 'mixed'))
  })
}

test('统一地图目录仍按活动汉化别名搜索，条件 ID 使用英文原值', () => {
  const config = { ...createDefaultMapRegexConfig('en'), region: 't17' }
  const item = mapRegexCatalog('en').affixes.at(-1)
  const aliases = new Map([[item.value, { aliases: ['测试受管完整汉化词缀', '測試受管完整漢化詞綴'] }]])
  for (const query of ['测试受管完整汉化词缀', '測試受管完整漢化詞綴', item.value.toUpperCase()]) {
    assert.deepEqual(filterMapRegexAffixes(config, query, 'en', aliases).map(entry => entry.id), [item.id])
  }
})

test('真实预设存储恢复旧分组并保留预设身份、当前选择和条件', t => {
  const previousStorage = globalThis.localStorage
  t.after(() => { globalThis.localStorage = previousStorage })
  const catalog = mapRegexCatalog('zh-CN')
  const presets = ['normal', 't17'].map((region, index) => ({
    id: `legacy-${region}`, name: `保留方案${index}`, mapRegex: {
      ...createDefaultMapRegexConfig('zh-CN'), region,
      includeAffixIds: [catalog.affixes[index].id], excludeAffixIds: [catalog.affixes.at(-1 - index).id]
    }
  }))
  const values = new Map([['mapRegexPresets', JSON.stringify(presets)], ['currentMapRegexPresetId', 'legacy-t17']])
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) }
  setActivePinia(createPinia())
  const store = useRegexPresetStore()
  assert.equal(store.currentMapRegexPresetId, 'legacy-t17')
  store.save()
  const saved = JSON.parse(values.get('mapRegexPresets'))
  for (const preset of presets) {
    assert.deepEqual(saved.find(item => item.id === preset.id), { ...preset, mapRegex: { ...preset.mapRegex, region: 'atlas' } })
  }
})

test('帮助和真实页面呈现一个异界地图入口，国服旧格式样例仍保留', () => {
  const panel = readFileSync(new URL('../src/domains/regex/MapRegexPanel.vue', import.meta.url), 'utf8')
  assert.match(panel, /filterMapRegexAffixes\(config\.value, query\.value, currentServer\.language, localization\.aliases\.value\)/)
  assert.doesNotMatch(panel, /config\.region|regions\.includes|value="t17"/)
  const help = JSON.stringify(moduleHelpTopicsById('map'))
  for (const band of ['Low', 'Mid', 'Top', 'Uber']) assert.ok(help.includes(band))
  assert.ok(help.includes('同一个异界地图预设'))
  assert.doesNotMatch(JSON.stringify(moduleHelpTopicsById('regex')), /普通或 T17|按普通、T17/)
  assert.deepEqual(MAP_FORMAT_EXAMPLES.slice(0, 2).map(item => [item.id, item.label]), [
    ['map-normal', '国服三字段地图样例'], ['map-t17', '国服六字段地图样例']
  ])
})
})()

// === Merged from voyageRewards.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const VOYAGE_REWARD_MODE_OPTIONS = _m6_VOYAGE_REWARD_MODE_OPTIONS
  const VOYAGE_REWARD_STRATEGIES = _m6_VOYAGE_REWARD_STRATEGIES
  const normalizeVoyageRewardMode = _m6_normalizeVoyageRewardMode
  const scoreVoyageMod = _m6_scoreVoyageMod
  const BORDER_CHART_MODS = _m6_BORDER_CHART_MODS
  const FRAGMENT_CHART_MODS = _m6_FRAGMENT_CHART_MODS
test('收益策略覆盖综合、保险箱、稀有怪、魔法怪与硫磺目标', () => {
  assert.deepEqual(
    VOYAGE_REWARD_STRATEGIES.map(strategy => strategy.id),
    ['balanced', 'strongbox', 'rare', 'magic', 'sulphur']
  )
})

test('自动模式独立于五种实际计分策略', () => {
  assert.deepEqual(VOYAGE_REWARD_MODE_OPTIONS.map(option => option.id), ['auto', 'balanced', 'strongbox', 'rare', 'magic', 'sulphur'])
  assert.equal(normalizeVoyageRewardMode('auto'), 'auto')
  assert.equal(normalizeVoyageRewardMode('invalid'), 'balanced')
})

test('词缀收益区分自身、相邻与全航行作用范围', () => {
  const scored = scoreVoyageMod({ lines: [
    '相邻区域包含 3 个额外奥术师的保险箱',
    '所有航行区域中找到的亡者硫磺提高 25%',
    '怪物有几率被 4000 个荒林鬼灵强化'
  ] }, 'balanced')

  assert.ok(scored.adjacent > 0)
  assert.ok(scored.global > 0)
  assert.ok(scored.self > 0)
  assert.equal(scored.total, scored.self + scored.adjacent + scored.global)
})

test('专精策略会提高对应词缀的相对权重', () => {
  const boxes = { lines: ['相邻区域包含 3 个额外奥术师的保险箱'] }
  const rares = { lines: ['所有航行区域的稀有怪物有 100% 的几率被附身'] }
  const magic = { lines: ['所有航行区域的怪物至少为魔法'] }
  const sulphur = { lines: ['相邻区域中找到的亡者硫磺提高 45%'] }

  assert.ok(scoreVoyageMod(boxes, 'strongbox').total > scoreVoyageMod(boxes, 'balanced').total)
  assert.ok(scoreVoyageMod(rares, 'rare').total > scoreVoyageMod(rares, 'balanced').total)
  assert.ok(scoreVoyageMod(magic, 'magic').total > scoreVoyageMod(magic, 'balanced').total)
  assert.ok(scoreVoyageMod(sulphur, 'sulphur').total > scoreVoyageMod(sulphur, 'balanced').total)
})

test('目录内明确收益词缀均可计分，纯难度词缀保持零分', () => {
  const beneficial = /所有航行区域|相邻区域|相邻海图/
  const ignoredEffects = /词缀数值提高/
  for (const mod of [...FRAGMENT_CHART_MODS, ...BORDER_CHART_MODS]) {
    if (!mod.lines.some(line => beneficial.test(line)) || mod.lines.some(line => ignoredEffects.test(line))) continue
    assert.ok(scoreVoyageMod(mod, 'balanced', { connections: 2 }).total !== 0, mod.lines.join(' / '))
  }
  assert.equal(scoreVoyageMod({ lines: ['怪物伤害提高 50%'] }, 'balanced').total, 0)
})
})()
