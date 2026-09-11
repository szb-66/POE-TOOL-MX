import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { sanctumOverlaySnapshot } from '../electron/modules/sanctum/overlay.js'
import { observationKey, currentRunObservation } from '../electron/modules/sanctum/runObservation.js'
import { resourceSummary } from '../shared/sanctumPresentation.js'

const environment = { width: 1920, height: 1080, dpi: 96 }
const detection = (overrides = {}) => ({ running: true, foreground: true, receivedAt: Date.now(),
  interfaces: { 'sanctum-map': { matched: true } }, gameBounds: { left: 0, top: 0, ...environment }, ...overrides })
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-persist-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const repository = new SanctumRepository(root), service = new SanctumService({ repository })
  service.setEnabled(true)
  service.state.floor = { identityConfirmed: true, runId: 'run', floorId: 'floor', floorNumber: 2, revision: 1,
    width: 1500, height: 800, positionStatus: 'confirmed', currentRoomId: 'r2', exitRoomIds: ['r7'],
    captureSessionId: 'obsolete-session',
    rooms: Array.from({ length: 8 }, (_, column) => ({ id: `r${column}`, column, x: column * 170, y: 100,
      width: 80, height: 100, status: 'matched', detailsStatus: 'matched', recognition: { evidenceId: 'obsolete-image' } })),
    edges: Array.from({ length: 7 }, (_, i) => ({ from: `r${i}`, to: `r${i + 1}`, status: 'matched', availability: 'gold', traversal: 'available' })),
    effectScan: { complete: true, targets: [{ evidenceId: 'effect-image', texts: ['状态原文'] }] } }
  const key = observationKey(service.state.floor)
  service.state.runObservation = { key, status: 'confirmed', resolve: 0, maxResolve: 100, coins: 20, inspiration: 50 }
  service.state.rewardLedger = { key, runId: 'run', complete: true, items: [{ id: 'reward', state: 'pending', currency: '混沌石', quantity: 3 }] }
  service.state.currentEffects = [{ rule: 'cannotRecover' }]
  service.state.progress = { stage: 'complete' }
  service.updateObservation({ foreground: true, interfaceMatched: true, mapOpen: true,
    clientBounds: { x: 0, y: 0, width: 1920, height: 1080 }, mapRegion: { x: 0, y: 0, width: 1500, height: 800 } })
  service.captureEnvironment = environment
  service.recalculate()
  service.persist()
  return { service, repository, restart: () => new SanctumService({ repository }) }
}

test('连续重启保留配套路线、资源、奖励、时间与标记，实时证据不复用', async t => {
  const { service, repository, restart } = fixture(t)
  const originalRoute = JSON.parse(JSON.stringify(service.routeResult.recommendation))
  const savedAt = service.state.savedAt
  await service.shutdown()
  for (let i = 0; i < 3; i++) {
    const restored = restart(), state = restored.getState()
    assert.equal(state.running, false)
    assert.equal(state.solving, false)
    assert.equal(state.floor.identityConfirmed, false)
    assert.equal(state.floor.currentRoomId, 'r2')
    assert.deepEqual(state.savedRoute.recommendation, originalRoute)
    assert.equal(state.savedRoute.runObservation.coins, 20)
    assert.equal(state.rewardLedger.items[0].quantity, 3)
    assert.equal(state.rewardLedger.complete, false)
    assert.equal(state.rewardLedger.savedComplete, true)
    assert.equal(currentRunObservation(state.runObservation, state.floor), null)
    assert.deepEqual(resourceSummary(state), { resolve: 0, maxResolve: 100, inspiration: 50, coins: 20, percent: 0 })
    assert.equal(state.savedAt, savedAt)
    const overlay = restored.getResultState(detection())
    assert.deepEqual(sanctumOverlaySnapshot(overlay).rooms.map(r => r.id), ['r2', 'r3'])
    assert.equal(restored.observation, null)
    restored.stop()
  }
  const data = fs.readFileSync(repository.file, 'utf8')
  assert.doesNotMatch(data, /obsolete-session|obsolete-image|effect-image/)
  assert.match(data, /状态原文/)
})

test('中断后最新房间与旧路线各自配套保存，重启不恢复排队任务', t => {
  const { service, restart } = fixture(t)
  service.state.running = true
  service.state.floor = { ...service.state.floor, revision: 2, currentRoomId: 'r3' }
  service.state.floor.rooms[4].detailsStatus = 'reading'
  service.state.floor.rooms[4].readStages = { text: 'reading', icons: 'queued' }
  service.state.floor.effectScan.targets = [{ targetId: 'effect', stage: 'reading' }]
  service.state.progress = { stage: 'recognizing', step: 'ocr' }
  service.stop()
  const restored = restart().getState()
  assert.equal(restored.floor.currentRoomId, 'r3')
  assert.equal(restored.savedRoute.floor.currentRoomId, 'r2')
  assert.equal(restored.savedRoute.floor.revision, restored.savedRoute.recommendation.revision)
  assert.equal(restored.floor.rooms[4].detailsStatus, 'failed')
  assert.deepEqual(restored.floor.rooms[4].readStages, { text: 'failed', icons: 'failed' })
  assert.equal(restored.progress.step, null)
  assert.equal(restored.floor.effectScan.targets[0].stage, 'failed')
})

test('恢复后主动采集替换旧结果，末段悬浮清除跨重启保留', async t => {
  const { service: initial, repository, restart } = fixture(t)
  const updated = structuredClone(initial.state.floor)
  updated.currentRoomId = 'r5'
  updated.revision++
  const service = restart()
  let captures = 0
  service.capture = { stop() {}, async run(environment, accept, observe) {
    captures++
    observe({ foreground: true, interfaceMatched: true, mapOpen: true,
      clientBounds: { x: 0, y: 0, width: 1920, height: 1080 }, mapRegion: { x: 0, y: 0, width: 1500, height: 800 } })
    accept(updated)
    return 'complete'
  } }
  assert.equal(captures, 0)
  await service.startCapture(environment)
  assert.equal(captures, 1)
  assert.equal(service.state.restoredFromSave, false)
  const restored = restart()
  assert.equal(restored.getState().savedRoute.floor.currentRoomId, 'r5')
  assert.equal(restored.overlayResult.clearOnMapClose, true)
  restored.getResultState(detection({ receivedAt: Date.now() + 1, interfaces: { 'sanctum-map': { matched: false } } }), Date.now() + 1)
  assert.equal(restored.overlayResult, null)
  assert.equal(new SanctumService({ repository }).overlayResult, null)
})

test('悬浮环境校验、禁用再启用以及重置跨重启有效', t => {
  const { restart } = fixture(t), service = restart()
  for (const changes of [{ foreground: false }, { interfaces: {} }, { interfaces: { 'sanctum-map': { matched: false } } },
    { gameBounds: { left: 0, top: 0, ...environment, dpi: 144 } }, { receivedAt: 0 }]) {
    assert.equal(service.getResultState(detection(changes)), null)
    assert.ok(service.overlayResult)
  }
  service.getResultState(detection({ gameBounds: { left: 20, top: 0, ...environment } }))
  assert.match(service.getState().overlayRestoreWarning, /再次采集/)
  assert.ok(service.getResultState(detection()))
  assert.equal(service.getState().overlayRestoreWarning, '')
  service.setEnabled(false)
  assert.equal(restart().getResultState(detection()), null)
  service.setEnabled(true)
  assert.ok(restart().getResultState(detection()))
  service.resetRun()
  assert.equal(restart().getState().floor, null)
  assert.equal(restart().getState().savedRoute, null)
  assert.equal(restart().overlayResult, null)
})

test('旧存档与损坏可选快照不阻止配置加载', t => {
  const { repository, restart } = fixture(t)
  const data = JSON.parse(fs.readFileSync(repository.file, 'utf8'))
  delete data.savedRoute
  delete data.savedOverlay
  fs.writeFileSync(repository.file, JSON.stringify(data))
  assert.match(restart().state.reason, /尚无已保存路线/)
  data.lastCapture.floor.rooms = [null]
  data.savedRoute = { floor: { rooms: [null], edges: [] } }
  data.savedOverlay = { floor: {} }
  fs.writeFileSync(repository.file, JSON.stringify(data))
  const restored = restart()
  assert.equal(restored.enabled, true)
  assert.notEqual(restored.state.status, 'error')
  assert.equal(restored.state.floor, null)
})

test('人工修正更新配套路线，保存失败保留内存与旧磁盘文件', t => {
  const { service, repository, restart } = fixture(t)
  service.correctRunResources(observationKey(service.state.floor), { resolve: 40, maxResolve: 100, coins: 99, inspiration: 5 })
  assert.equal(restart().getState().savedRoute.runObservation.coins, 99)
  const previous = fs.readFileSync(repository.file, 'utf8')
  repository.save = () => { throw new Error('disk unavailable') }
  assert.throws(() => service.correctRunResources(observationKey(service.state.floor), { resolve: 50, maxResolve: 100, coins: 100, inspiration: 5 }), /disk unavailable/)
  assert.equal(service.state.runObservation.coins, 100)
  assert.match(service.getState().saveError, /保存失败/)
  assert.equal(fs.readFileSync(repository.file, 'utf8'), previous)
})
