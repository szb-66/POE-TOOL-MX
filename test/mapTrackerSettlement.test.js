import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { MapTrackerService } from '../electron/modules/mapTracker/service.js'
import { MapTrackerRepository } from '../electron/modules/mapTracker/repository.js'
import { MapTrackerStateMachine } from '../electron/modules/mapTracker/stateMachine.js'
import { ClientEventsService } from '../electron/modules/clientEvents/service.js'
import { parseClientLogLine } from '../electron/modules/clientEvents/parser.js'
import { detectClientProcesses } from '../electron/modules/clientEvents/processDetection.js'

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
  const client = new ClientEventsService({ processProvider: async () => ids })
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
