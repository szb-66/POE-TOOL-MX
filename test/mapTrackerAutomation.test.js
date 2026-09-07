import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, appendFile, rename, rm } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { ClientEventsService } from '../electron/modules/clientEvents/service.js'
import { ClientEventSettingsRepository } from '../electron/modules/clientEvents/settingsRepository.js'
import { MapTrackerService } from '../electron/modules/mapTracker/service.js'
import { MapTrackerRepository } from '../electron/modules/mapTracker/repository.js'
import { detectClientProcessSessions } from '../electron/modules/clientEvents/processDetection.js'
import { parseClientLogLine } from '../electron/modules/clientEvents/parser.js'
import { normalizeMapTrackerSettings, createMapRun } from '../electron/modules/mapTracker/model.js'

const log = body => `2026/09/07 12:00:00 [INFO Client 123] ${body}\n`
const area = (seed = 1, id = 'MapWorldsCemetery') => log(`Generating level 83 area "${id}" with seed ${seed}`)
const ready = log(': You have entered Cemetery.')
async function setup(t, initial = area() + ready, ids = [123]) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tracker-auto-'))
  const file = path.join(root, 'Client.txt'); await writeFile(file, initial)
  const settings = new ClientEventSettingsRepository(path.join(root, 'client.json'))
  const client = new ClientEventsService({ settings, detectPath: async () => file, processProvider: async () => ids.map(id => ({ id, startedAt: "2026-09-07T00:00:00Z" })) })
  const repository = new MapTrackerRepository(root)
  let now = Date.parse('2026-09-07T12:00:00Z')
  const service = new MapTrackerService({ repository, clientEvents: client, now: () => now })
  await service.initialize()
  t.after(async () => { await client.stop(false); await service.shutdown({ normal: false }); await rm(root, { recursive: true, force: true }) })
  const flush = async () => { await service.workQueue; await Promise.allSettled([...service.inFlight]); await service.workQueue }
  const append = async text => { await appendFile(file, text); await client.tailer.poll(); await flush() }
  return { service, repository, client, root, file, append, flush, advance: ms => { now += ms } }
}

test('旧字段及经验开关静默移除，保留角色身份', () => {
  const settings = normalizeMapTrackerSettings({ overlay: { interactive: true }, enhancements: { kills: true, character: true }, chat: { inputReady: {} }, selectedCharacter: { name: '旧角色', level: 90 } })
  assert.equal(settings.overlay.interactive, undefined); assert.equal(settings.enhancements.kills, undefined)
  assert.equal(settings.chat, undefined); assert.equal(settings.enhancements.character, undefined)
  assert.equal(settings.selectedCharacter.name, '旧角色'); assert.equal(createMapRun({ kills: 500 }).kills, undefined)
})

test('系统消息边界拒绝聊天伪装和废弃查询结果，中英文死亡可解析', () => {
  for (const body of ['#玩家: You have died', '@玩家: Generating level 83 area "MapWorldsCemetery" with seed 1', ': 玩家: 你已死亡', '已击杀：123 个怪物', '名称:玩家，职业：元素使，等级：98，区：赛季，状态：城镇']) assert.equal(parseClientLogLine(log(body).trim()), null)
  for (const body of ['You have died', ': 你已死亡。', ': Player has been slain.']) assert.equal(parseClientLogLine(log(body).trim()).type, 'player-death')
  assert.equal(parseClientLogLine('Generating level 83 area "MapWorldsCemetery"'), null)
})

test('图内开启自动定位日志，只恢复当前状态，不回放死亡、不补计时间', async t => {
  const { service, client, flush } = await setup(t, area() + ready + log(': You have died'))
  await service.updateSettings({ enabled: true }); await flush()
  assert.equal(client.status.state, 'started')
  const run = service.snapshot().activeRun
  assert.ok(run); assert.equal(run.deaths, 0); assert.equal(run.portalsUsed, 1); assert.equal(run.activeDurationMs, 0)
  assert.ok(run.sessionKey); assert.equal(run.character, null)
})

test('旧 PID 或缺少就绪状态不能冒充正在地图内', async t => {
  const { service, flush } = await setup(t, area() + ready, [456])
  await service.updateSettings({ enabled: true }); await flush()
  assert.equal(service.snapshot().activeRun, null)
  assert.equal(service.snapshot().gameState, 'unknown')
})

test('无输入计时、后台暂停、关闭保存和再开启同局续记', async t => {
  const { service, repository, client, advance, flush } = await setup(t)
  await service.updateSettings({ enabled: true }); await flush(); service.setForeground(true)
  const id = service.snapshot().activeRun.id
  advance(15000); await service.tick(); assert.equal(service.snapshot().activeRun.activeDurationMs, 15000)
  service.setForeground(false); advance(8000); await service.tick(); assert.equal(service.snapshot().activeRun.activeDurationMs, 15000)
  service.setForeground(true); advance(1000); await service.updateSettings({ enabled: false })
  assert.equal(service.snapshot().activeRun, null); assert.equal((await repository.query()).total, 1)
  assert.equal(client.status.enabled, true)
  advance(9000); await service.updateSettings({ enabled: true }); await flush()
  assert.equal(service.snapshot().activeRun.id, id)
  assert.equal(service.snapshot().activeRun.activeDurationMs, 16000)
  assert.equal(service.snapshot().activeRun.portalsUsed, 1)
})

test('真实日志同实例回城重返、附属往返与新 seed 的记录归属', async t => {
  const { service, repository, append, flush } = await setup(t)
  await service.updateSettings({ enabled: true }); await flush(); service.setForeground(true)
  const id = service.snapshot().activeRun.id
  await append(area(3, 'AbyssLeague') + ready + area() + ready)
  assert.equal(service.snapshot().activeRun.id, id); assert.equal(service.snapshot().activeRun.portalsUsed, 1)
  await append(area(2, 'Hideout') + ready)
  assert.equal((await repository.query()).total, 1)
  await append(area() + ready)
  assert.equal(service.snapshot().activeRun.id, id); assert.equal(service.snapshot().activeRun.portalsUsed, 2)
  await append(area(9) + ready)
  assert.notEqual(service.snapshot().activeRun.id, id)
  assert.equal((await repository.query()).total, 1)
})

test('半字符半行只发布一次，重复来源事件不重复死亡', async t => {
  const { service, client, append, flush } = await setup(t)
  await service.updateSettings({ enabled: true }); await flush()
  const bytes = Buffer.from(log(': 你已死亡'))
  const split = bytes.indexOf(Buffer.from('死')) + 1
  await append(bytes.subarray(0, split)); assert.equal(service.snapshot().activeRun.deaths, 0)
  await append(bytes.subarray(split)); assert.equal(service.snapshot().activeRun.deaths, 1)
  const event = client.events.findLast(event => event.type === 'player-death')
  await service.handleEvent(event); assert.equal(service.snapshot().activeRun.deaths, 1)
  assert.equal(JSON.stringify(event).includes('Client.txt'), false)
})

test('日志替换恢复状态而不重放旧死亡和传送门', async t => {
  const { service, client, root, file, append, flush } = await setup(t)
  await service.updateSettings({ enabled: true }); await flush()
  await append(log(': You have died'))
  const id = service.snapshot().activeRun.id
  await rename(file, path.join(root, 'Client.old.txt'))
  await writeFile(file, area() + ready + log(': You have died'))
  await client.tailer.poll(); await flush()
  assert.equal(service.snapshot().activeRun.id, id)
  assert.equal(service.snapshot().activeRun.deaths, 1)
  assert.equal(service.snapshot().activeRun.portalsUsed, 1)
})

test('加载暂停、断线自动结算且不会由普通连接消息恢复', async t => {
  const { service, repository, append, advance, flush } = await setup(t)
  await service.updateSettings({ enabled: true }); await flush(); service.setForeground(true)
  advance(1000); await append(log('Connecting to instance server at 127.0.0.1:1234'))
  advance(10000); await service.tick(); assert.equal(service.snapshot().activeRun.activeDurationMs, 1000)
  await append(log('Abnormal disconnect: disconnected'))
  assert.equal(service.snapshot().activeRun, null); assert.equal((await repository.query()).total, 1)
  await append(log('Connecting to server at 127.0.0.1:1234'))
  assert.equal(service.snapshot().gameState, 'disconnected')
})

test('共享日志准备幂等且无效路径自动回退检测', async t => {
  const { client } = await setup(t)
  await client.settings.save({ enabled: false, logPath: path.join(os.tmpdir(), 'missing-tracker-test-directory', 'Client.txt') })
  await client.ensureStarted(); const tailer = client.tailer
  await client.ensureStarted(); assert.equal(client.tailer, tailer)
})

test('进程会话检测隐藏启动窗口且只保留有效 PID 和创建时间', async () => {
  const result = await detectClientProcessSessions({ platform: 'win32', execFileImpl: (_exe, _args, options, callback) => {
    assert.equal(options.windowsHide, true)
    callback(null, JSON.stringify([{ id: 123, startedAt: '2026-09-07T00:00:00Z' }, { id: 456, startedAt: 'invalid' }]))
  } })
  assert.deepEqual(result, [{ id: 123, startedAt: '2026-09-07T00:00:00Z' }])
})

test('同 PID 的新进程不能恢复创建之前的旧日志', async () => {
  const client = new ClientEventsService({ processProvider: async () => [{ id: 123, startedAt: '2026-09-08T00:00:00Z' }] })
  await client.recover([{ line: area().trim(), sourceId: 'source', fileId: 'file', offset: 0 }, { line: ready.trim(), sourceId: 'source', fileId: 'file', offset: 100 }])
  assert.equal(client.currentContext(), null)
})
