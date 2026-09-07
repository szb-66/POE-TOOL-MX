import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeMapTrackerPatch, sanitizeMapTrackerQuery } from '../electron/modules/ipc/mapTrackerValidation.js'

test('地图跟踪 IPC 查询限制分页、方向与文本长度', () => {
  const value = sanitizeMapTrackerQuery({ league: 'x'.repeat(200), page: -1, pageSize: 1000, direction: 'drop table', path: 'C:/secret' })
  assert.equal(value.league.length, 80); assert.equal(value.page, 1); assert.equal(value.pageSize, 100); assert.equal(value.direction, 'desc'); assert.equal('path' in value, false)
})

test('地图跟踪设置 IPC 丢弃未知字段、废弃设置键和任意快捷键内容', () => {
  const value = sanitizeMapTrackerPatch({ enabled: 1, buildName: 'a'.repeat(200), league: '赛季', characterName: '角色', enhancements: { kills: true, modifiers: true, mechanics: true, notes: true, arbitrary: true }, shortcuts: { captureMap: 'Ctrl+Alt+Delete' }, command: '/exit' })
  assert.equal(value.enabled, false); assert.equal('buildName' in value, false); assert.equal('league' in value, false); assert.equal('characterName' in value, false); assert.deepEqual(value.enhancements, {}); assert.equal('shortcuts' in value, false); assert.equal('command' in value, false)
})
