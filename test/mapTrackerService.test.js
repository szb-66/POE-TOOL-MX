import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { MapTrackerRepository } from '../electron/modules/mapTracker/repository.js'
import { MapTrackerService, sanitizeTrackedItem } from '../electron/modules/mapTracker/service.js'

class Events { constructor(){ this.listener = null } onEvent(listener){ this.listener = listener; return () => { this.listener = null } } emit(event){ this.listener?.(event) } }
const setup = async ({ commandSender = async () => {} } = {}) => {
  let now = 10000; const events = new Events(); const repository = new MapTrackerRepository(await mkdtemp(path.join(os.tmpdir(), 'map-service-')))
  const service = new MapTrackerService({ repository, clientEvents: events, commandSender, characterProvider: async () => [{ name: 's30、嘎嘎嘎', accountName: 'test', level: 98, className: '元素使', league: 'S30赛季' }], now: () => now, idleProvider: () => 0 })
  await service.initialize(); await service.updateSettings({ enabled: true, enhancements: { character: true, loot: true } }); service.setForeground(true)
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

test('经验缺失不清除有效基准，死亡后恢复采样仍保留净损失', async (t) => {
  const { service, repository, setNow } = await setup()
  t.after(() => service.shutdown({ normal: false }))
  const character = { name: 's30、嘎嘎嘎', accountName: 'test', league: 'S30赛季', level: 98 }
  let experience = 1000
  service.characterProvider = async () => [{ ...character, experience }]
  await service.updateSettings({ selectedCharacter: character })
  await service.listCharacters({ sampleExperience: true })
  setNow(70000)
  experience = 900
  await service.listCharacters({ sampleExperience: true })
  assert.equal(service.snapshot().summary.experienceGrowth, -100)
  const observation = service.snapshot().settings.experienceObservation
  setNow(130000)
  experience = null
  await service.listCharacters({ sampleExperience: true })
  assert.deepEqual(service.snapshot().settings.experienceObservation, observation)
  assert.deepEqual((await repository.getSettings()).experienceObservation, observation)
  assert.equal(service.snapshot().activeRun.experienceSampleCount, 2)
  setNow(190000)
  experience = 950
  await service.listCharacters({ sampleExperience: true })
  assert.equal(service.snapshot().summary.experienceGrowth, -50)
  assert.equal(service.snapshot().activeRun.experienceStart, 1000)
  assert.equal(service.snapshot().activeRun.experienceEnd, 950)
  assert.equal((await repository.getActiveRun()).experienceSampleCount, 3)
})

test('刷图期间不轮询经验，离开立即结算并在每次进入建立基准', async (t) => {
  const { service, repository, setNow } = await setup()
  t.after(() => service.shutdown({ normal: false }))
  await service.finish('area-left')
  const character = { name: 's30、嘎嘎嘎', accountName: 'test', league: 'S30赛季', level: 98 }
  let experience = 1000
  let requests = 0
  service.characterProvider = async () => { requests++; return [{ ...character, experience }] }
  await service.updateSettings({ selectedCharacter: character })
  await service.handleEvent({ type: 'area-entered', areaId: 'MapWorldsCemetery', seed: 'a', areaLevel: 83 })
  assert.equal(requests, 1)
  setNow(70000)
  await service.tick()
  setNow(130000)
  await service.tick()
  assert.equal(requests, 1)
  experience = 900
  await service.handleEvent({ type: 'area-entered', areaId: 'Hideout', seed: 'h', areaLevel: 60 })
  await Promise.allSettled([...service.inFlight])
  assert.equal(requests, 2)
  await service.handleEvent({ type: 'area-entered', areaId: 'MapWorldsMuseum', seed: 'b', areaLevel: 83 })
  await Promise.allSettled([...service.inFlight])
  assert.equal(requests, 3)
  const completed = (await repository.all()).runs.find(run => run.instanceKey.endsWith(':a'))
  assert.equal(completed.experienceEnd - completed.experienceStart, -100)
  assert.equal(service.snapshot().activeRun.experienceStart, 900)
  experience = 950
  setNow(190000)
  const last = await service.finish()
  assert.equal(requests, 4)
  assert.equal(last.experienceEnd - last.experienceStart, 50)
  assert.equal(service.snapshot().summary.experienceGrowth, -50)
  await service.finish()
  await service.tick()
  assert.equal(requests, 4)
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
