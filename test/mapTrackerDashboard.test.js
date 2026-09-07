import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDashboardSummary, mergeDashboardRuns } from '../shared/mapTrackerDashboard.js'

const HOUR = 3600000
const now = new Date(2026, 8, 7, 12).getTime()
const iso = value => new Date(value).toISOString()
const character = { accountName: 'a', league: 's', name: '角色' }
const run = (id, patch = {}) => ({ id, areaId: 'cemetery', areaName: '墓地', mapTier: 16, instanceKey: `cemetery:${id}`, character, startedAt: iso(now - HOUR), endedAt: iso(now - 1000), activeDurationMs: 60000, loot: [], ...patch })

test('入库按数量累加并按名称和基底分组，草稿保存不重复计数', () => {
  const loot = [{ name: '混沌石', quantity: 20, recordedAt: iso(now - 1000) }, { name: '混沌石', quantity: 10, recordedAt: iso(now) }, { name: '装备', baseType: '甲', quantity: 1, recordedAt: iso(now) }, { name: '装备', baseType: '乙', recordedAt: iso(now) }]
  const activeRun = run('a', { endedAt: null, loot })
  const active = buildDashboardSummary({ activeRun, stashEvents: loot, now })
  assert.equal(active.todayLoot, 32)
  assert.equal(active.todayCount, 0)
  assert.equal(active.windows[1].items[0].quantity, 30)
  assert.equal(active.windows[1].items.length, 3)
  const saved = buildDashboardSummary({ runs: [run('a', { loot })], activeRun, stashEvents: loot, now })
  assert.equal(saved.todayLoot, 32)
  assert.equal(saved.todayCount, 1)
  assert.equal(saved.windows[1].buckets.reduce((sum, entry) => sum + entry.loot, 0), 32)
})

test('时间窗口跨日，完成按结束时间归属，今日数字不受窗口影响', () => {
  const midnight = new Date(2026, 8, 7, 0, 30).getTime()
  const runs = [run('a', { startedAt: iso(midnight - 2 * HOUR), endedAt: iso(midnight - 1000) }), run('b', { endedAt: iso(midnight - HOUR) }), run('c', { endedAt: iso(midnight - 7 * HOUR) }), run('d', { endedAt: iso(midnight - 25 * HOUR) })]
  const summary = buildDashboardSummary({ runs, now: midnight })
  assert.equal(summary.todayCount, 1)
  assert.equal(summary.windows[1].count, 2)
  assert.equal(summary.windows[6].count, 2)
  assert.equal(summary.windows[24].count, 3)
  assert.deepEqual([24, 6, 1].map(hours => summary.windows[hours].buckets.length), [24, 24, 12])
  assert.equal(summary.windows[1].buckets[0].count, 1)
})

test('同实例合并有效用时，不合并未知实例、不同角色或不同阶级', () => {
  const runs = [run('a'), run('b', { instanceKey: 'cemetery:a', activeDurationMs: 120000 }), run('c'), run('d', { instanceKey: 'cemetery:unknown' }), run('e', { instanceKey: 'cemetery:unknown' }), run('f', { instanceKey: 'cemetery:a', character: { ...character, name: '另一角色' } }), run('g', { instanceKey: 'cemetery:a', mapTier: 17 })]
  assert.equal(mergeDashboardRuns(runs).length, 6)
  const summary = buildDashboardSummary({ runs, now })
  assert.equal(summary.todayCount, 6)
  assert.equal(summary.windows[1].durations[0].count, 5)
  assert.equal(summary.windows[1].durations[0].totalDurationMs, 420000)
  assert.equal(summary.windows[1].durations[0].averageDurationMs, 84000)
})

test('旧地图入库不计数，独立事件不受地图删除影响', () => {
  const events = [{ id: 'a:1', name: '石', quantity: 2, recordedAt: iso(now) }]
  const old = run('a', { loot: [{ name: '石', quantity: 99 }] })
  assert.equal(buildDashboardSummary({ runs: [old], now }).todayLoot, 0)
  assert.equal(buildDashboardSummary({ runs: [old], stashEvents: events, now }).todayLoot, 2)
  assert.equal(buildDashboardSummary({ stashEvents: events, now }).todayLoot, 2)
})
