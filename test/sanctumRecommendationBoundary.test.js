import test from 'node:test'
import assert from 'node:assert/strict'
import { planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { createSanctumStrategy } from '../shared/sanctum.js'
import { sanctumDisplay } from '../shared/sanctumDisplay.js'
import { sanctumOverlaySnapshot } from '../electron/modules/sanctum/overlay.js'

const edge = (from, to) => ({ from, to, status: 'matched', availability: 'gold', traversal: 'available' })
function fixture() {
  return { identityConfirmed: true, runId: 'r', floorId: 'f', revision: 1, positionStatus: 'confirmed', currentRoomId: 's',
    width: 1500, height: 800, exitRoomIds: ['z'],
    rooms: ['s', 'a', 'u', 'z'].map((id, column) => ({ id, column, status: 'matched',
      detailsStatus: column === 1 || column === 3 ? 'matched' : 'unknown',
      terminal: id === 'z', x: column * 200, y: 100, width: 100, height: 80,
      rewards: column === 1 ? [{ currency: '神圣石', quantity: null, quantityStatus: 'not-shown', timingStatus: 'not-shown' }] : [] })),
    edges: [edge('s', 'a'), edge('a', 'u'), edge('u', 'z')] }
}

for (const preset of ['reveal', 'quantity', 'survival']) {
  const plan = (f, marks = {}) => planSanctumFloor(f, createSanctumStrategy(preset), marks)
  test(`${preset}: 已知段结束，未知内容及远处出口不进入结果`, () => {
    const f = fixture(), before = plan(f)
    assert.equal(before.status, 'partial')
    assert.deepEqual(before.paths[0].rooms, ['s', 'a'])
    assert.equal(before.paths[0].complete, false)
    assert.deepEqual(before.paths[0].breakdown.map(p => p.roomId), ['a'])
    assert.ok((before.paths[0].offers || []).every(o => o.roomId === 'a'))
    Object.assign(f.rooms[2], { rewards: [{currency:'神圣石',quantity:999,timing:'run'}],
      recovery: 999, effects: [{ rule: 'cannotRecover', trigger: 'entry' }], afflictions: [{ id: 'bad' }] })
    f.rooms[3].rewards = [{currency:'神圣石',quantity:999,timing:'run'}]
    assert.deepEqual(plan(f), before)
    f.rooms[2].detailsStatus = 'manual'
    assert.deepEqual(plan(f).paths[0].rooms, ['s', 'a', 'u', 'z'])
  })
  test(`${preset}: 下一房未知、读取失败、部分及初始选房均暂停`, () => {
    for (const status of ['unknown', 'reading', 'partial', 'failed', undefined]) {
      const f = fixture(); f.rooms[1].detailsStatus = status
      assert.deepEqual(plan(f).paths, [])
      assert.match(plan(f).reason, /先识别房间/)
      f.initialSelection = true; f.currentRoomId = null; f.startRoomIds = ['a']
      assert.deepEqual(plan(f).paths, [])
      assert.match(plan(f).reason, /先识别房间/)
    }
  })
  test(`${preset}: 未知之后的目标待确认，硬约束与互斥目标不放宽`, () => {
    const f = fixture()
    const result = plan(f, { targets: ['z'] })
    assert.deepEqual(result.paths[0].rooms, ['s', 'a'])
    assert.ok(result.paths[0].unknown.some(text => text.includes('目标 z') && text.includes('待确认')))
    assert.deepEqual(plan(f, { targets: ['z'], avoid: ['u'] }).paths, [])
    f.rooms.push({ ...f.rooms[2], id: 'v' })
    f.edges.push(edge('a', 'v'), edge('v', 'z'))
    assert.deepEqual(plan(f, { targets: ['u', 'v'] }).paths, [])
    // A known side branch must not prevent retaining the prefix toward a pending target.
    f.rooms[4].detailsStatus = 'matched'
    assert.deepEqual(plan(f, { targets: ['u'] }).paths[0].rooms, ['s', 'a'])
  })
  test(`${preset}: 部分候选已识别时仅推荐已知合法候选`, () => {
    const f = fixture()
    f.rooms.push({ ...f.rooms[1], id: 'b', detailsStatus: 'unknown' })
    f.edges.push(edge('s', 'b'), edge('b', 'u'))
    assert.deepEqual(plan(f).paths.map(p => p.nextRoomId), ['a'])
    assert.deepEqual(plan(f, { avoid: ['a'] }).paths, [])
    f.rooms[1].afflictions = [{id:'banned',status:'matched',trigger:'entry'}]
    const strategy = createSanctumStrategy(preset); strategy.bannedAfflictions = ['banned']
    assert.deepEqual(planSanctumFloor(f, strategy).paths, [])
  })
}

test('页面、路线浮窗、结果遮罩对旧完整结果也在未知房间前截断', () => {
  const floor = fixture()
  const recommendation = { ...floor, status: 'partial', paths: [{ rooms: ['s', 'a', 'u', 'z'] }] }
  const view = sanctumDisplay(floor, recommendation)
  assert.deepEqual(view.rooms.filter(r => r.recommended).map(r => r.id), ['s', 'a'])
  assert.deepEqual(view.lines.filter(e => e.recommended).map(e => [e.from, e.to]), [['s', 'a']])
  assert.equal(view.rooms.find(r => r.id === 'u').displayState, 'reachable')
  const state = { enabled: true, foreground: true, running: true, floor, recommendation, marks: { avoid: [], targets: [] },
    observation: { foreground: true, interfaceMatched: true, mapOpen: true, receivedAt: 1000,
      clientBounds: {x:0,y:0,width:1920,height:1080}, mapRegion: {x:0,y:0,width:1500,height:800} } }
  const overlay = sanctumOverlaySnapshot(state, 1000)
  assert.deepEqual(overlay.rooms.filter(r => r.recommended).map(r => r.id), ['s', 'a'])
  state.running = false; state.progress = {stage: 'complete'}
  assert.deepEqual(sanctumOverlaySnapshot(state, 1000).rooms.map(r => r.id), ['s', 'a'])
  floor.rooms[1].detailsStatus = 'unknown'
  assert.equal(sanctumDisplay(floor, recommendation).nextRoomId, null)
  assert.ok(sanctumOverlaySnapshot(state, 1000).rooms.every(r => !r.next && !r.recommended))
  assert.deepEqual(sanctumOverlaySnapshot(state, 1000).rooms.map(r => r.id), ['s'])
})
