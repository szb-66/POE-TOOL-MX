import test from 'node:test'
import assert from 'node:assert/strict'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { emptySanctumState, createSanctumStrategy } from '../shared/sanctum.js'
import { listSanctumSamples, replaySanctumSample } from '../electron/modules/sanctum/replay.js'
import { solveSanctumLoadouts } from '../electron/modules/sanctum/loadout.js'

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
  service.cancelSolve()
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
  service.state.strategy = createSanctumStrategy('survival')
  service.correctRoom('b', { recovery: 1 })
  assert.equal(service.getState().recommendation.paths[0].score, 4)
  service.setMarks({ targets: ['b'], avoid: ['b'] })
  assert.equal(service.getState().recommendation.status, 'blocked')
  service.setMarks({ targets: [], avoid: [] })
  service.saveStrategy(createSanctumStrategy('currency'))
  assert.equal(service.getState().recommendation.paths[0].score, 1)
  assert.equal(saved.at(-1).strategy.preset, 'currency')
  await service.shutdown()
})

test('搭配取消不发布迟到结果，假设预览不覆盖真实祭坛路线', async () => {
  const pending = deferred()
  const solver = { solve: () => pending.promise, cancel() {}, async shutdown() {} }
  const service = new SanctumService({ solver })
  service.setEnabled(true)
  service.state.floor = snapshot
  service.state.altar = { ...service.state.altar, confirmed: true, items: [] }
  service.state.inventory = [{ id: 'u', unique: true, status: 'matched', width: 1, height: 1, effects: [{ rule: 'cannotRecover' }] }]
  service.recalculate()
  const run = service.solveLoadout()
  service.stop()
  pending.resolve({ candidates: [{ itemIds: ['u'] }] })
  await run
  assert.equal(service.getState().loadouts, null)
  service.state.loadouts = { candidates: [{ itemIds: ['u'] }] }
  const before = service.getState()
  const preview = service.previewLoadout(0)
  assert.equal(preview.hypothetical, true)
  assert.equal(preview.recommendation.paths[0].score, 0)
  assert.deepEqual(service.getState(), before)
  assert.throws(() => service.saveLoadoutPreferences({ fixed: ['missing'], excluded: [], selectedUniques: [] }), /不存在/)
  service.saveLoadoutPreferences({ fixed: ['u'], excluded: [], selectedUniques: ['u'] })
  assert.deepEqual(service.getState().loadoutPreferences.fixed, ['u'])
  await service.shutdown()
})

test('回放仅允许清单内文件，不接受外部路径', async () => {
  assert.ok(listSanctumSamples().some(sample => sample.id === 'vault-entry.png'))
  await assert.rejects(replaySanctumSample('../research.txt'), /未知圣所样本/)
  await assert.rejects(replaySanctumSample('missing.png'), /未知圣所样本/)
})

test('停止采集前保留本次求解等级；目标等级独立约束传奇且不伪造当前楼层', async () => {
  const service = new SanctumService({ solver: { solve: async input => solveSanctumLoadouts(input), cancel() {}, async shutdown() {} } })
  service.setEnabled(true)
  service.state.inventory = [{ id: 'u', unique: true, status: 'matched', width: 1, height: 2, minAreaLevel: 80, modifiers: [], effects: [] }]
  service.state.altar.unlocked = Array.from({ length: 20 }, (_, i) => i)
  service.state.loadoutPreferences.selectedUniques = ['u']
  service.state.floor = { ...snapshot, areaLevel: 83 }
  service.state.status = 'capturing'
  await service.solveLoadout()
  assert.equal(service.state.floor.identityConfirmed, false)
  assert.equal(service.state.loadouts.areaLevel, 83)
  assert.equal(service.state.loadouts.areaLevelSource, 'observed')
  assert.ok(service.state.loadouts.candidates.length)
  await service.solveLoadout()
  assert.equal(service.state.loadouts.status, 'blocked')
  assert.equal(service.state.loadouts.areaLevelSource, 'unknown')
  for (const target of [79, 80]) {
    service.saveLoadoutPreferences({ ...service.state.loadoutPreferences, targetAreaLevel: target })
    await service.solveLoadout()
    assert.equal(service.state.loadouts.candidates.length > 0, target === 80)
    assert.equal(service.state.loadouts.areaLevelSource, 'target')
    assert.equal(service.state.floor.identityConfirmed, false)
    assert.equal(service.state.altar.confirmed, false)
  }
  for (const targetAreaLevel of [0, 101, 80.5, '80']) assert.throws(() => service.saveLoadoutPreferences({ ...service.state.loadoutPreferences, targetAreaLevel }), /目标区域等级/)
  await service.shutdown()
})
