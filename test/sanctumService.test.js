import test from 'node:test'
import assert from 'node:assert/strict'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { emptySanctumState, createSanctumStrategy } from '../shared/sanctum.js'
import { listSanctumSamples, replaySanctumSample } from '../electron/modules/sanctum/replay.js'

const snapshot = { identityConfirmed: true, runId: 'r', floorId: 'f', revision: 1, currentRoomId: 'a',
  rooms: [{ id: 'a', column: 0 }, { id: 'b', column: 1, terminal: true, recovery: 20, detailsStatus: 'matched' }],
  edges: [{ from: 'a', to: 'b', status: 'matched' }] }
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }

test('离线回放强制未知身份，禁用后迟到结果不能恢复图或运行', async () => {
  const pending = deferred()
  const service = new SanctumService({ replay: () => pending.promise })
  assert.throws(() => service.saveStrategy(createSanctumStrategy()), /未启用/)
  service.setEnabled(true)
  const run = service.rescan('sample')
  service.setEnabled(false)
  pending.resolve(snapshot)
  await run
  assert.equal(service.getState().floor, null)
  assert.equal(service.getState().running, false)
  service.setEnabled(true)
  await service.rescan('sample')
  assert.equal(service.getState().floor.identityConfirmed, false)
  assert.equal(service.getState().recommendation, null)
  await service.shutdown()
})

test('重扫开始就撤销旧推荐，停止可中断回放且不留下运行状态', async () => {
  let signal
  const pending = deferred()
  const service = new SanctumService({ replay: (_id, options) => { signal = options.signal; return pending.promise } })
  service.setEnabled(true)
  service.state.floor = snapshot
  service.recalculate()
  const run = service.rescan('sample')
  assert.equal(service.getState().recommendation, null)
  service.stop()
  assert.equal(signal.aborted, true)
  pending.resolve(snapshot)
  await run
  assert.equal(service.getState().running, false)
  assert.equal(service.getState().floor, null)
  await service.shutdown()
})

test('手动修正和标记验证参数，策略修改重新评分且独立持久化', async () => {
  const saved = []
  const service = new SanctumService({ repository: { load: emptySanctumState, save: state => saved.push(structuredClone(state)) } })
  service.setEnabled(true)
  service.state.floor = structuredClone(snapshot)
  assert.throws(() => service.correctRoom('b', { identityConfirmed: true }), /不支持/)
  assert.throws(() => service.correctRoom('b', { rewards: [{ quantity: NaN }] }), /奖励/)
  assert.throws(() => service.setMarks({ targets: ['absent'], avoid: [] }), /不存在/)
  service.state.strategy = createSanctumStrategy('reveal')
  service.correctRoom('b', { recovery: 1 })
  assert.equal(service.getState().floor.rooms[1].recovery, 1)
  service.setMarks({ targets: ['b'], avoid: ['b'] })
  assert.equal(service.getState().recommendation.status, 'blocked')
  service.setMarks({ targets: [], avoid: [] })
  service.saveStrategy(createSanctumStrategy('quantity'))
  assert.equal(service.getState().recommendation.paths[0].nextRoomId, 'b')
  assert.equal(saved.at(-1).strategy.preset, 'quantity')
  await service.shutdown()
})

test('回放仅允许清单内文件，不接受外部路径', async () => {
  assert.ok(listSanctumSamples().some(sample => sample.id === 'vault-entry.png'))
  await assert.rejects(replaySanctumSample('../research.txt'), /未知圣所样本/)
  await assert.rejects(replaySanctumSample('missing.png'), /未知圣所样本/)
})
