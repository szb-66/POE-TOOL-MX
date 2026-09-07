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
