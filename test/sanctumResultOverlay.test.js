import test from 'node:test'
import assert from 'node:assert/strict'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { sanctumOverlaySnapshot, SanctumOverlay } from '../electron/modules/sanctum/overlay.js'

const environment = { width: 1920, height: 1080, dpi: 96 }
function detection(matched = true, receivedAt = 2000) {
  return { running: true, foreground: true, receivedAt, interfaces: { 'sanctum-map': { matched } },
    gameBounds: { left: 0, top: 0, width: 1920, height: 1080, dpi: 96 } }
}
function setup(current = 0, stage = 'complete') {
  const service = new SanctumService({})
  service.setEnabled(true)
  service.state.floor = { identityConfirmed: true, runId: 'r', floorId: 'f', revision: 1, width: 1500, height: 800,
    positionStatus: 'confirmed', currentRoomId: `r${current}`, exitRoomIds: ['r7'],
    rooms: Array.from({ length: 8 }, (_, column) => ({ id: `r${column}`, column, x: column * 170, y: 100,
      width: 80, height: 100, status: 'matched', detailsStatus: 'matched' })),
    edges: Array.from({ length: 7 }, (_, i) => ({ from: `r${i}`, to: `r${i + 1}`, status: 'matched', availability: 'gold', traversal: 'available' })) }
  service.state.progress = { stage }
  service.updateObservation({ foreground: true, interfaceMatched: true, mapOpen: true,
    clientBounds: { x: 0, y: 0, width: 1920, height: 1080 }, mapRegion: { x: 0, y: 0, width: 1500, height: 800 } })
  service.recalculate()
  return service
}
const save = service => service.retainOverlayResult(environment, 1000)
const result = (service, detected = detection()) => {
  const state = service.getResultState(detected, 2000)
  return state && sanctumOverlaySnapshot(state, 2000)
}

for (const stage of ['complete', 'partial', 'timeout']) test(`${stage}后仅两房间与一条连线，普通关图再开恢复原位置`, () => {
  const service = setup(0, stage)
  save(service)
  const view = result(service)
  assert.deepEqual(view.rooms.map(room => room.id), ['r0', 'r1'])
  assert.equal(view.lines.length, 1)
  assert.equal(view.ocrRegion, undefined)
  assert.equal(result(service, detection(false)), null)
  service.stop()
  service.state.floor.currentRoomId = 'r4'
  assert.deepEqual(result(service).rooms.map(room => room.id), ['r0', 'r1'])
})

test('倒数第二列下一房本次显示，明确关图后永久清空', () => {
  const service = setup(5)
  save(service)
  assert.deepEqual(result(service).rooms.map(room => room.id), ['r5', 'r6'])
  assert.equal(result(service, detection(false)), null)
  assert.equal(service.overlayResult, null)
  assert.equal(result(service), null)
})

test('实时观察失效后手动设定当前位置仍刷新结果遮罩', () => {
  const service = setup(0)
  service.captureEnvironment = environment
  save(service)
  assert.deepEqual(result(service).rooms.map(room => room.id), ['r0', 'r1'])
  service.updateObservation(null)
  service.setCurrentRoom({ id: 'r2', runId: 'r', floorId: 'f', revision: 1 })
  assert.equal(service.observation, null)
  assert.ok(service.overlayResult)
  const view = result(service)
  assert.deepEqual(view.rooms.map(room => room.id), ['r2', 'r3'])
  assert.ok(view.rooms.find(room => room.id === 'r2' && room.current))
  assert.ok(view.rooms.find(room => room.id === 'r3' && room.next))
})

test('从未有地图观察时手动设定不生成遮罩', () => {
  const service = setup(0)
  service.captureEnvironment = environment
  service.observation = null
  service.lastMapObservation = null
  service.setCurrentRoom({ id: 'r2', runId: 'r', floorId: 'f', revision: 1 })
  assert.equal(service.overlayResult, null)
})

test('失焦、过期、缺少标题、环境变化和旧关图事件不清空结果', () => {
  const invalid = [d => { d.foreground = false }, d => { d.running = false }, d => { d.reloading = true },
    d => { d.receivedAt = 0 }, d => { d.receivedAt = 3000 }, d => { d.interfaces = {} },
    d => { d.gameBounds.dpi = 144 }, d => { d.gameBounds.width = 1600 }, d => { d.gameBounds.left = 100 }]
  for (const change of invalid) {
    const service = setup(5); save(service)
    const d = detection(false); change(d)
    assert.equal(result(service, d), null)
    assert.ok(result(service))
  }
  const service = setup(5); save(service)
  assert.equal(result(service, detection(false, 900)), null)
  assert.ok(result(service))
})

test('截断地图与未确认出口不将最右可见列当成终点', () => {
  for (const incomplete of [true, false]) {
    const service = setup(incomplete ? 4 : 5)
    if (incomplete) service.state.floor.rooms.pop()
    else service.state.floor.exitRoomIds = []
    service.recalculate(); save(service)
    assert.equal(service.overlayResult.clearOnMapClose, false)
    assert.equal(result(service, detection(false)), null)
    assert.ok(result(service))
  }
})

test('初始选房仅下一房，无推荐仅确认当前位置，未知位置不造标记', () => {
  const service = setup()
  Object.assign(service.state.floor, { currentRoomId: null, positionStatus: 'initial', initialSelection: true, startRoomIds: ['r0'] })
  service.recalculate(); save(service)
  assert.deepEqual(result(service).rooms.map(room => room.id), ['r0'])
  const noRoute = setup()
  noRoute.state.recommendation = null; save(noRoute)
  assert.deepEqual(result(noRoute).rooms.map(room => room.id), ['r0'])
  const unknown = setup()
  unknown.state.floor.positionStatus = 'unknown'; save(unknown)
  assert.equal(result(unknown), null)
})

test('失败不替换旧图，新有效路线替换，最后一房清空，禁用只隐藏', () => {
  const service = setup(); save(service)
  service.stop()
  save(service)
  assert.ok(result(service))
  service.setEnabled(false)
  assert.equal(result(service), null)
  service.setEnabled(true)
  assert.ok(result(service))
  const replacement = setup(3)
  service.state.floor = replacement.state.floor
  service.updateObservation(replacement.observation)
  service.state.progress = { stage: 'complete' }
  service.recalculate(); save(service)
  assert.deepEqual(result(service).rooms.map(room => room.id), ['r3', 'r4'])
  service.state.floor.currentRoomId = 'r7'
  service.recalculate(); save(service)
  assert.equal(result(service), null)
})

test('采集中完整地图；失败准备后仍走保存结果，重置清空', () => {
  const service = setup(); save(service)
  service.state.running = true
  const active = { ...service.getState(), foreground: true }
  active.observation.receivedAt = 2000
  assert.equal(sanctumOverlaySnapshot(active, 2000).rooms.length, 8)
  service.state.running = false
  service.state.progress = null
  let queried = false
  const get = service.getResultState.bind(service)
  service.getResultState = (...args) => { queried = true; return get(...args) }
  const overlay = new SanctumOverlay({ service, detection: { getState: detection, subscribe: () => () => {} }, now: () => 2000,
    setIntervalFn: () => 0, clearIntervalFn: () => {} })
  overlay.hiddenCaptures = 1
  overlay.sync()
  assert.equal(queried, true)
  overlay.destroy()
  service.resetRun()
  assert.equal(service.overlayResult, null)
})

test('服务采集完成发布结果后关闭输入任务，迟到失败不替换保存结果', async () => {
  const service = setup()
  const observed = structuredClone(service.observation)
  const floor = structuredClone(service.state.floor)
  floor.captureProgress = { stage: 'complete' }
  service.capture = { stop() {}, async run(_environment, publish, observe) {
    publish(floor)
    observe(observed)
    return 'complete'
  } }
  await service.startCapture(environment)
  assert.equal(service.state.running, false)
  assert.equal(service.captureTask, null)
  assert.equal(service.overlayResult.floor.currentRoomId, 'r0')
  service.capture.run = async () => { throw new Error('启动失败') }
  await service.startCapture(environment)
  assert.equal(service.overlayResult.floor.currentRoomId, 'r0')
})

test('地图生成路线后效果识别失败，页面和浮窗保留本轮路线且不恢复活动身份', async () => {
  const service = setup(2)
  const observed = structuredClone(service.observation), floor = structuredClone(service.state.floor)
  floor.captureSessionId = 'failed-effects'
  floor.identitySource = 'client-log'
  floor.captureProgress = { stage: 'recognizing', current: 3, total: 4 }
  service.capture = { stop() {}, async run(_environment, publish, observe) {
    publish(floor); observe(observed)
    throw new Error('游戏日志正在重新同步')
  } }
  await service.startCapture(environment)
  const state = service.getState()
  assert.equal(state.floor.identityConfirmed, false)
  assert.equal(state.recommendation, null)
  assert.equal(state.savedRoute.floor.currentRoomId, 'r2')
  assert.equal(state.savedRoute.incomplete, true)
  assert.equal(state.savedRoute.recommendation.paths[0].rooms[1], 'r3')
  assert.equal(service.overlayResult.floor.currentRoomId, 'r2')
  // Keep the original observation timestamp ordering for the title gate.
  const now = Date.now() + 1
  const overlay = sanctumOverlaySnapshot(service.getResultState(detection(true, now), now), now)
  assert.deepEqual(overlay.rooms.map(room => room.id), ['r2', 'r3'])
  assert.match(overlay.reason, /状态识别不完整.*历史参考/)
  service.resetRun()
  assert.equal(service.getState().savedRoute, null)
  assert.equal(service.overlayResult, null)
})

test('重识别确认地图但未定位时隐藏旧遮罩，快照保留且手动定位后恢复', () => {
  const service = setup(0)
  save(service)
  assert.ok(result(service))
  service.state.floor = { ...service.state.floor, captureSessionId: 'recapture', revision: 2, positionStatus: 'unknown', currentRoomId: null }
  assert.equal(service.getResultState(detection(), 2000), null)
  assert.ok(service.overlayResult)
  service.captureEnvironment = environment
  service.setCurrentRoom({ id: 'r3', runId: 'r', floorId: 'f', revision: 2 })
  assert.deepEqual(result(service).rooms.map(room => room.id), ['r3', 'r4'])
})

test('新一轮无路线或迟到回调不替换旧快照，有效新路线才替换', async () => {
  const service = setup(0)
  const original = structuredClone(service.routeResult)
  const next = setup(3), observed = structuredClone(next.observation), floor = structuredClone(next.state.floor)
  floor.captureSessionId = 'failed-retry'
  let latePublish, lateObserve
  service.capture = { stop() {}, async run(_environment, publish, observe) {
    latePublish = publish; lateObserve = observe
    publish({ ...floor, rooms: floor.rooms.map(room => ({ ...room, detailsStatus: 'unknown' })) })
    observe(observed)
    service.stop('日志上下文失效')
    return 'partial'
  } }
  await service.startCapture(environment)
  assert.equal(service.getState().savedRoute.floor.currentRoomId, original.floor.currentRoomId)
  latePublish(floor); lateObserve(observed)
  assert.equal(service.getState().savedRoute.floor.currentRoomId, 'r0')
  service.capture.run = async (_environment, publish, observe) => { publish({ ...floor, captureSessionId: 'successful-retry' }); observe(observed); return 'complete' }
  await service.startCapture(environment)
  assert.equal(service.routeResult.floor.currentRoomId, 'r3')
  assert.equal(service.overlayResult.floor.currentRoomId, 'r3')
  assert.equal(service.getState().savedRoute, null)
})
