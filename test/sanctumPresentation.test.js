import test from 'node:test'
import assert from 'node:assert/strict'
import { captureButton, observationBinding, resourceSummary, rewardSummary, sanctumPageDisplay, calibrationIssues } from '../shared/sanctumPresentation.js'
import { sanctumControlState } from '../electron/modules/sanctum/controlOverlay.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'

test('按钮退出优先于旧完成状态，锁与识别任务阻止重复启动', () => {
  const state = { liveCalibration: {}, progress: { stage: 'complete' } }
  assert.deepEqual(captureButton({ ...state, captureDraining: true }), { label: '正在完成', disabled: true })
  assert.equal(captureButton(state).label, '分析完成·再次采集')
  for (const field of ['solving', 'running']) assert.equal(captureButton({ ...state, [field]: true }).disabled, true)
  assert.equal(captureButton(state, { locked: true }).disabled, true)
  assert.equal(captureButton({ ...state, liveCalibration: null }).disabled, true)
})
test('采集按钮按阶段和终态显示，房间计数不泄漏调试内容', () => {
  const base = { liveCalibration: {}, running: true }
  assert.equal(captureButton({ ...base, progress: { stage: 'rooms', step: 'ocr', current: 2, total: 5, targetId: 'private-id' } }).label, '截图房间 2/5')
  assert.equal(captureButton({ ...base, progress: { stage: 'effects' } }).label, '检测效果')
  assert.equal(captureButton({ ...base, progress: { stage: 'map' } }).label, '读取地图')
  for (const stage of ['partial', 'timeout', 'stopped']) assert.equal(captureButton({ ...base, running: false, progress: { stage } }).disabled, false)
  assert.equal(captureButton({ ...base, running: false, status: 'error' }).label, '分析失败·重试')
  const control = sanctumControlState({ ...base, running: false, captureDraining: true }, {}, {})
  assert.equal(control.disabled, true)
  assert.equal(control.label, '正在完成')
})
test('资源卡只使用已确认且当前位置匹配的数据，零与未知分开', () => {
  const floor = { runId: 'run', floorId: 'f1', currentRoomId: 'r1', identityConfirmed: true }
  const state = { floor, runObservation: { status: 'confirmed', key: observationBinding(floor), resolve: 0, maxResolve: 100, coins: 0 } }
  assert.deepEqual(resourceSummary(state), { resolve: 0, maxResolve: 100, inspiration: null, coins: 0, percent: 0 })
  for (const changed of [{ ...floor, currentRoomId: 'r2' }, { ...floor, floorId: 'f2' }, { ...floor, identityConfirmed: false }]) {
    assert.equal(resourceSummary({ ...state, floor: changed }).percent, null)
    assert.equal(resourceSummary({ ...state, floor: changed }).coins, null)
  }
  assert.equal(resourceSummary({ ...state, runObservation: { ...state.runObservation, status: 'unknown' } }).percent, null)
  assert.equal(resourceSummary({ ...state, runObservation: { ...state.runObservation, maxResolve: 0 } }).percent, null)
})
test('地图奖励摘要保留选项，不把未展示数量当识别失败', () => {
  assert.equal(rewardSummary({ rewards: [{ currency: '神圣石', quantity: 2, groupId: 'offer' }, { currency: '神圣石', quantity: null, groupId: 'offer' }] }), '神圣石 / 神圣石')
})
test('主页面重排只改变绘图坐标，保留推荐与原始采集坐标', () => {
  const room = (id, column, y) => ({ id, column, y, x: column * 500, width: 100, height: 60, status: 'matched', detailsStatus: 'matched' })
  const floor = { identityConfirmed: true, runId: 'r', floorId: 'f', revision: 1, initialSelection: true, startRoomIds: ['a'], rooms: [room('a', 0, 900), room('b', 1, 100), room('c', 1, 800)], edges: [{ from: 'a', to: 'b', status: 'matched', availability: 'gold', traversal: 'available' }] }
  const original = structuredClone(floor)
  const display = sanctumPageDisplay(floor, { runId: 'r', floorId: 'f', revision: 1, status: 'ready', paths: [{ rooms: ['a', 'b'] }] })
  assert.deepEqual(floor, original)
  assert.equal(display.nextRoomId, 'a')
  assert.equal(display.rooms.find(room => room.id === 'b').y < display.rooms.find(room => room.id === 'c').y, true)
  assert.ok(display.rooms.every(room => room.width === 190))
  assert.equal(sanctumPageDisplay(null).rooms.length, 0)
})
test('有公共配置时，缺失地图截图和标题给出具体校准缺口', () => {
  const state = { liveCalibration: {}, publicTitles: { templates: {} } }
  assert.deepEqual(calibrationIssues(state), ['地图范围截图', '地图标题截图'])
  assert.equal(captureButton(state).disabled, true)
  state.liveCalibration.captures = { mapRegion: {} }
  state.publicTitles.templates['sanctum-map'] = {}
  assert.deepEqual(calibrationIssues(state), [])
  assert.equal(captureButton(state).disabled, false)
})
test('采集异常保留主窗口详细原因，并让按钮显示失败重试', async () => {
  const service = new SanctumService({})
  service.setEnabled(true)
  service.state.liveCalibration = {}
  service.capture = { stop() {}, async run() { throw new Error('地图窗口环境发生变化') } }
  const state = await service.startCapture({})
  assert.equal(state.status, 'error')
  assert.match(state.reason, /地图窗口环境发生变化/)
  assert.equal(captureButton(state).label, '分析失败·重试')
  assert.equal(state.running, false)
})
