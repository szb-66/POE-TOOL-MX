import test from 'node:test'
import assert from 'node:assert/strict'
import { createExportController, newExportState } from '../src/domains/pobExport/exportState.js'
const ok = data => ({ success: true, data })
const characters = [{ name: 'a', league: 'A' }, { name: 'b', league: 'B' }]
test('默认赛季、刷新清空、重复点击保护及导出结果', async () => {
  const state = newExportState()
  let calls = 0
  const control = createExportController(state, { source: 'self', preferredLeague: () => 'B', api: {
    listCharacters: async () => ok(characters), exportBuild: async () => { calls++; return ok({ code: 'abc' }) }
  } })
  await control.load()
  assert.equal(state.league, 'B')
  assert.equal(state.character, '')
  control.setCharacter('b')
  await Promise.all([control.exportBuild(), control.exportBuild()])
  assert.equal(calls, 1)
  assert.equal(state.result.code, 'abc')
  control.setLeague('A')
  assert.equal(state.result, null)
  assert.equal(state.character, '')
})
test('旧加载结果、旧导出错误和卸载后响应均被丢弃', async () => {
  const state = newExportState()
  let resolve
  const control = createExportController(state, { source: 'other', api: { listCharacters: () => new Promise(r => { resolve = r }) } })
  control.setForumId('first')
  const pending = control.load()
  control.setForumId('second')
  resolve(ok(characters))
  await pending
  assert.deepEqual(state.characters, [])
  const next = control.load()
  control.dispose()
  resolve(ok(characters))
  await next
  assert.equal(state.loaded, false)
  assert.equal(state.busy, '')
})
test('错误可以重试且选择变化丢弃导出结果', async () => {
  const state = newExportState()
  let finish
  let failure = true
  const control = createExportController(state, { source: 'self', api: {
    listCharacters: async () => failure ? { success: false, error: { message: '限流' } } : ok(characters),
    exportBuild: () => new Promise(r => { finish = r })
  } })
  await control.load()
  assert.equal(state.error, '限流')
  failure = false
  await control.load()
  assert.equal(state.error, '')
  control.setCharacter('a')
  const pending = control.exportBuild()
  control.setLeague('B')
  finish(ok({ code: 'stale' }))
  await pending
  assert.equal(state.result, null)
})
