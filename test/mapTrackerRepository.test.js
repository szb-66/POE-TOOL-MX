import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, writeFile, rename, readdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createMapRun } from '../electron/modules/mapTracker/model.js'
import { MapTrackerRepository, atomicWrite, csvEscape, runsToCsv } from '../electron/modules/mapTracker/repository.js'

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
  assert.equal(result.total, 1); assert.equal(result.items[0].areaName, '墓地')
})

test('查询支持筛选分页、编辑允许字段和删除', async () => {
  const repository = new MapTrackerRepository(await makeRoot())
  const first = run({ areaName: '墓地' }); const second = run({ areaName: '博物馆', areaId: 'MapWorldsMuseum', instanceKey: 'MapWorldsMuseum:2', startedAt: '2026-09-04T01:00:00.000Z' })
  await repository.saveRun(first); await repository.saveRun(second)
  const page = await repository.query({ map: '墓', pageSize: 1 }); assert.equal(page.total, 1)
  const edited = await repository.editRun(first.id, { areaName: '新名称', deaths: 99 })
  assert.equal(edited.areaName, '新名称'); assert.equal(edited.deaths, 0); assert.equal('deviceInputs' in edited, false)
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
  const csv = runsToCsv([run({ areaName: '第一行\n第二行' })])
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
