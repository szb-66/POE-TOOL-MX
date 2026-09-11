import test from 'node:test'
import assert from 'node:assert/strict'
import { ClientEventsService } from '../electron/modules/clientEvents/service.js'
import { parseClientLogLine } from '../electron/modules/clientEvents/parser.js'
import { SanctumLogContext } from '../electron/modules/sanctum/logContext.js'

// Minimal, anonymized system messages from the CN client; no network addresses.
const line = (body, pid = 123) => `2026/09/09 20:58:35 39240015 ff4d814e [INFO Client ${pid}] ${body}`
const generation = 'Generating level 83 area "SanctumFoyer_3_3" with seed 1'
const complete = '[LOADING SCREEN] (圣所教堂) Duration = 0.971189 seconds'
const connect = 'Connecting to instance server at [redacted]'
const entry = (body, offset, pid = 123) => ({ line: line(body, pid), sourceId: 'source', fileId: 'file', offset })
const service = () => new ClientEventsService({ processProvider: async () => [
  { id: 123, startedAt: '2026-09-09T10:00:00Z' }, { id: 456, startedAt: '2026-09-09T10:00:00Z' }
] })

test('国服加载完成严格匹配系统正文，聊天、焦点和畸形耗时不能确认区域', () => {
  assert.equal(parseClientLogLine(line(complete)).state, 'in-game')
  for (const body of [`: #玩家: ${complete}`, `: ${complete}`, '[WINDOW] Gained focus',
    complete + ' suffix', complete.replace('0.971189', '-1'), complete.replace('0.971189', 'NaN')]) {
    assert.equal(parseClientLogLine(line(body)), null)
  }
})

test('实时与历史恢复均确认当前进程第 3 层 83 级且不恢复历史统计', async () => {
  for (const recover of [false, true]) {
    const events = service()
    events.status = { ...events.status, enabled: true, state: 'started' }
    const entries = [entry(connect, 0), entry(generation, 1), entry(complete, 2), entry(': You have died.', 3)]
    if (recover) await events.recover(entries)
    else for (const item of entries) events.acceptLine(item.line, item)
    const bound = new SanctumLogContext(events, 123, () => {})
    assert.deepEqual(bound.assertCurrent(), { floorId: 'floor:2', floorNumber: 3, areaLevel: 83, identitySource: 'client-log' })
    bound.close()
    if (recover) assert.equal(events.events.some(event => event.type === 'player-death'), false)
  }
})

test('完成事件不能跨进程、无区域、断线或下一次连接复活旧区域', async () => {
  for (const bodies of [
    [entry(complete, 0)],
    [entry(generation, 0), entry(complete, 1, 456)],
    [entry(generation, 0), entry('Abnormal disconnect: test', 1), entry(complete, 2)],
    [entry(generation, 0), entry(complete, 1), entry(connect, 2), entry(complete, 3)]
  ]) {
    for (const recover of [false, true]) {
      const events = service()
      if (recover) await events.recover(bodies)
      else for (const item of bodies) events.acceptLine(item.line, item)
      assert.equal(events.currentContext(), null)
      assert.notEqual(events.status.gameState, 'in-game')
    }
  }
})
