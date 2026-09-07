import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { MapTrackerRepository } from '../electron/modules/mapTracker/repository.js'
import { MapTrackerService } from '../electron/modules/mapTracker/service.js'
import { createStashStatisticsBatch } from '../electron/modules/bag/stashStatistics.js'

const initialTime = new Date(2026, 8, 30, 23, 59, 59).getTime()
async function setup(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'stash-statistics-'))
  let now = initialTime
  const repository = new MapTrackerRepository(root)
  const service = new MapTrackerService({ repository, now: () => now })
  await service.initialize()
  clearInterval(service.tickTimer); service.tickTimer = null
  t.after(async () => { await service.shutdown({ normal: false }); await rm(root, { recursive: true, force: true }) })
  await service.updateSettings({ enabled: true, enhancements: { loot: true } })
  return { root, repository, service, setNow: value => { now = value } }
}

test('无地图无角色统计所有自动入库，跨午夜及月份重启恢复', async t => {
  const { root, repository, service, setNow } = await setup(t)
  assert.equal(service.snapshot().activeRun, null)
  await service.recordStashedItem({ name: '混沌石', quantity: 20 }, 'batch:1')
  assert.equal(service.snapshot().summary.todayLoot, 20)
  const later = initialTime + 2000
  setNow(later)
  await service.recordStashedItem({ name: '混沌石', quantity: 20 }, 'batch:1')
  await service.recordStashedItem({ name: '混沌石', quantity: 3 }, 'batch:2')
  assert.equal(service.snapshot().summary.todayLoot, 3)
  assert.equal(service.snapshot().summary.windows[24].loot, 23)
  const restored = new MapTrackerService({ repository: new MapTrackerRepository(root), now: () => later })
  await restored.initialize()
  try {
    await restored.recordStashedItem({ name: '混沌石', quantity: 20 }, 'batch:1')
    assert.equal(restored.snapshot().summary.todayLoot, 3)
    assert.equal(restored.snapshot().summary.windows[24].loot, 23)
    assert.equal((await repository.all()).runs.length, 0)
  } finally { await restored.shutdown({ normal: false }) }
})

test('收到事件时冻结资格与数据，关闭开关不撤销已接收事件', async t => {
  const { service } = await setup(t)
  let release
  service.enqueue(() => new Promise(resolve => { release = resolve }))
  await new Promise(resolve => setImmediate(resolve))
  const item = { name: '混沌石', quantity: 5 }
  const accepted = service.recordStashedItem(item, 'accepted:1')
  item.quantity = 999
  service.settings.enabled = false
  assert.equal(await service.recordStashedItem(item, 'disabled:1'), false)
  service.settings.enabled = true; service.settings.paused = true
  assert.equal(await service.recordStashedItem(item, 'paused:1'), false)
  service.settings.paused = false; service.settings.enhancements.loot = false
  assert.equal(await service.recordStashedItem(item, 'off:1'), false)
  release(); await accepted
  assert.equal(service.snapshot().summary.todayLoot, 5)
})

test('并发和重复事件不重复计数，保存失败队列可恢复', async t => {
  const { service, repository } = await setup(t)
  const save = repository.saveStashEvent.bind(repository)
  repository.saveStashEvent = async () => { throw Object.assign(new Error('占用'), { code: 'EPERM' }) }
  await assert.rejects(service.recordStashedItem({ name: '石', quantity: 8 }, 'retry:1'), { code: 'EPERM' })
  assert.equal(service.snapshot().summary.todayLoot, 0)
  repository.saveStashEvent = save
  await Promise.all(Array.from({ length: 30 }, () => service.recordStashedItem({ name: '石', quantity: 8 }, 'retry:1')))
  assert.equal(service.snapshot().summary.todayLoot, 8)
  assert.equal((await repository.getStashEvents(initialTime)).events.length, 1)
})

test('旧字段清理保留其他原始数据，可重入且不触碰新事件', async t => {
  const { repository, service } = await setup(t)
  const shardPath = path.join(repository.root, 'runs', 'standard', '2026-09.json')
  await mkdir(path.dirname(shardPath), { recursive: true })
  const old = { id: 'old', startedAt: '2026-09-01T00:00:00Z', loot: [{ name: '旧物品', quantity: 99 }], unknownField: { retained: true } }
  await writeFile(repository.activePath, JSON.stringify({ schemaVersion: 1, run: old }))
  await writeFile(shardPath, JSON.stringify({ schemaVersion: 1, runs: [old], custom: 'keep' }))
  await service.recordStashedItem({ name: '新物品', quantity: 2 }, 'new:1')
  assert.deepEqual(await repository.clearLegacyLoot(), [])
  const cleaned = { ...old }; delete cleaned.loot
  assert.deepEqual(JSON.parse(await readFile(repository.activePath, 'utf8')).run, cleaned)
  assert.deepEqual(JSON.parse(await readFile(shardPath, 'utf8')), { schemaVersion: 1, runs: [cleaned], custom: 'keep' })
  assert.deepEqual(await repository.clearLegacyLoot(), [])
  assert.equal((await repository.getStashEvents(initialTime)).events.length, 1)
  await writeFile(shardPath, '{broken')
  assert.equal((await repository.clearLegacyLoot()).length, 1)
  assert.equal(await readFile(shardPath, 'utf8'), '{broken')
})

test('关闭等待已收到的入库事件落盘且不接受新事件', async t => {
  const { service, repository } = await setup(t)
  const save = repository.saveStashEvent.bind(repository)
  let release
  repository.saveStashEvent = async event => {
    await new Promise(resolve => { release = resolve })
    return save(event)
  }
  const pending = service.recordStashedItem({ name: '石', quantity: 4 }, 'shutdown:1')
  await new Promise(resolve => setImmediate(resolve))
  let finished = false
  const shutdown = service.shutdown({ normal: false }).then(() => { finished = true })
  assert.equal(await service.recordStashedItem({ name: '石' }, 'shutdown:2'), false)
  assert.equal(finished, false)
  release(); await pending; await shutdown
  assert.equal((await repository.getStashEvents(initialTime)).events[0].quantity, 4)
})

test('批次立即采集，完成等待全部写入；失败报告而不拒绝或重复操作', async () => {
  let release; let calls = 0; let reported = 0
  const ids = []
  const batch = createStashStatisticsBatch((_item, id) => {
    ids.push(id); calls++
    if (calls === 1) return new Promise(resolve => { release = resolve })
    throw new Error('统计文件占用')
  }, () => { reported++ })
  batch.record({ name: '成功' }); batch.record({ name: '失败' })
  assert.equal(calls, 2)
  assert.notEqual(ids[0], ids[1])
  let finished = false
  const finish = batch.finish().then(result => { finished = true; return result })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(finished, false)
  release()
  assert.deepEqual(await finish, { statisticsError: '统计保存失败' })
  assert.equal(reported, 1)
  assert.equal(calls, 2)
})
