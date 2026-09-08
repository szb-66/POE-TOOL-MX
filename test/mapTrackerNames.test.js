import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { classifyArea, normalizeMapName } from '../shared/mapTrackerAreaCatalog.js'
import { MapTrackerRepository } from '../electron/modules/mapTracker/repository.js'
import { buildDashboardSummary } from '../shared/mapTrackerDashboard.js'
import { mapLabel } from '../shared/mapTrackerLabels.js'

test('编年史目录与旧名称转换避免地图混淆且重复转换稳定', () => {
  for (const [id, old, expected] of [
    ['Strand', '滨海山丘', '致命岩滩'], ['Atoll', '环礁', '滨海山丘'],
    ['Reef', '珊瑚遗迹', '危机海礁'], ['Museum', '博物馆', '古博物馆'],
    ['Desert', '荒漠', '贫瘠之地']
  ]) {
    assert.equal(classifyArea(`MapWorlds${id}`).areaName, expected)
    assert.equal(normalizeMapName(`MapWorlds${id}`, old), expected)
    assert.equal(normalizeMapName(`MapWorlds${id}`, expected), expected)
    assert.equal(mapLabel(expected), expected)
  }
  assert.equal(mapLabel('滨海山丘'), '滨海山丘')
  assert.equal(classifyArea('MapWorldsCrimsonTemple').areaName, '玫红神殿')
  assert.equal(normalizeMapName('MapWorldsUnknown', '未知自定义名称'), '未知自定义名称')
})

test('磁盘历史及活动记录在筛选统计导出前更新名称且不改写源文件', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'map-name-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const repository = new MapTrackerRepository(root)
  const records = ['Strand', 'Atoll'].map((id, index) => ({
    id: String(index), areaId: `MapWorlds${id}`, areaName: '滨海山丘',
    startedAt: '2026-09-08T01:00:00.000Z', endedAt: '2026-09-08T01:10:00.000Z', activeDurationMs: 600000
  }))
  const shard = repository.shardPath(records[0])
  await mkdir(path.dirname(shard), { recursive: true })
  const original = JSON.stringify({ schemaVersion: 1, runs: records })
  await writeFile(shard, original)
  await writeFile(repository.activePath, JSON.stringify({ run: records[0] }))
  assert.equal((await repository.getActiveRun()).areaName, '致命岩滩')
  assert.equal((await repository.query({ map: '致命岩滩' })).total, 1)
  assert.equal((await repository.query({ map: '滨海山丘' })).total, 1)
  const { runs } = await repository.all()
  const summary = buildDashboardSummary({ runs, now: Date.parse('2026-09-08T04:00:00.000Z') })
  assert.match(JSON.stringify(summary), /致命岩滩/)
  assert.match(JSON.stringify(summary), /滨海山丘/)
  const output = path.join(root, 'export.csv')
  await repository.exportCsv({}, output)
  assert.match(await readFile(output, 'utf8'), /致命岩滩/)
  assert.equal(await readFile(shard, 'utf8'), original)
})
