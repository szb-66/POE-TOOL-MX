import test from 'node:test'
import assert from 'node:assert/strict'
import { createSanctumStrategy } from '../shared/sanctum.js'
import { planSanctumFloor } from '../electron/modules/sanctum/planner.js'
import { knownRoom } from '../electron/modules/sanctum/knowledge.js'
import { sanctumOverlaySnapshot } from '../electron/modules/sanctum/overlay.js'

function fixture() {
  return { identityConfirmed: true, runId: 'r', floorId: 'f', revision: 1, mapKey: 'map', currentRoomId: 's',
    rooms: ['s', 'a', 'u', 'z'].map((id, column) => ({ id, column, status: 'matched', revealed: column !== 2,
      detailsStatus: column === 2 ? 'unknown' : 'matched', terminal: id === 'z' })),
    edges: [['s','a'],['a','u'],['u','z']].map(([from,to]) => ({ from, to, status: 'matched' })) }
}

for (const preset of ['reveal', 'quantity']) {
  const plan = (floor, marks = {}, effects = []) => planSanctumFloor(floor, createSanctumStrategy(preset), marks, effects)

  test(`${preset}: 未揭示边界和远处目标只作普通说明，硬约束不变`, () => {
    const f = fixture(), result = plan(f, { targets: ['z'] })
    assert.deepEqual(result.unknown, [])
    assert.deepEqual(result.paths[0].unknown, [])
    assert.deepEqual(result.paths[0].rooms, ['s', 'a'])
    assert.equal(result.status, 'partial')
    assert.equal(result.paths[0].complete, false)
    assert.match(result.reason, /按当前可见信息推荐，路线止于已知部分/)
    assert.match(result.reason, /目标 z.*尚未达成/)
    assert.doesNotMatch(result.reason, /请先识别房间|待确认/)
    assert.deepEqual(plan(f, { targets: ['z'], avoid: ['u'] }).paths, [])
  })

  test(`${preset}: 无下一房时区分机制限制与读取失败，初始选房一致`, () => {
    for (const initial of [false, true]) {
      const f = fixture()
      if (initial) { f.initialSelection = true; f.currentRoomId = null; f.startRoomIds = ['a'] }
      Object.assign(f.rooms[1], { revealed: false, detailsStatus: 'unknown' })
      let result = plan(f)
      assert.deepEqual(result.paths, [])
      assert.deepEqual(result.unknown, [])
      assert.match(result.reason, /游戏揭示/)
      assert.doesNotMatch(result.reason, /先识别房间/)
      for (const status of ['failed', 'partial', 'unknown', 'reading']) {
        Object.assign(f.rooms[1], { revealed: true, detailsStatus: status, failureReason: '可见文字歧义' })
        result = plan(f)
        assert.deepEqual(result.paths, [])
        assert.match(result.reason, /先识别房间/)
        assert.ok(result.unknown.includes('a：可见文字歧义'))
      }
    }
  })

  test(`${preset}: 隐藏各字段保留普通说明与部分状态，无待确认`, () => {
    for (const rule of ['roomsHidden', 'rewardsHidden', 'afflictionsHidden', 'typesHidden']) {
      const f = fixture()
      f.rooms[2].revealed = true; f.rooms[2].detailsStatus = 'matched'
      const result = plan(f, {}, [{ rule, status: 'matched' }])
      assert.deepEqual(result.unknown, [], rule)
      assert.equal(result.status, 'partial', rule)
      assert.match(result.reason, /被效果隐藏/)
    }
  })

  test(`${preset}: 隐藏奖励不掩盖可见痛苦失败或歧义`, () => {
    const f = fixture()
    f.rooms[1].knowledge = { rewards: { status: 'hidden' }, afflictions: { status: 'failed' } }
    const result = plan(f)
    assert.ok(result.unknown.includes('a：痛苦未读全'))
    assert.ok(!result.unknown.some(text => /隐藏|未揭示/.test(text)))
    assert.match(result.reason, /a：奖励被效果隐藏/)
  })

  test(`${preset}: 游戏未展示奖励字段独立于另一字段读取错误`, () => {
    const f = fixture(), reward = { currency: '神圣石', quantity: null, timing: null,
      quantityStatus: 'not-shown', timingStatus: 'not-shown' }
    f.rooms[1].rewards = [reward]
    assert.deepEqual(plan(f).unknown, [])
    reward.timingStatus = 'failed'
    assert.ok(plan(f).unknown.some(text => text.includes('领取时机未读取')))
    reward.timingStatus = 'not-shown'; reward.quantityStatus = 'failed'
    assert.ok(plan(f).unknown.some(text => text.includes('数量未读取')))
    assert.equal(plan(f).paths[0].breakdown[0].parts.reward, 0)
  })

  test(`${preset}: 可见读取失败与未揭示并存，只保留真实缺口`, () => {
    const f = fixture()
    f.rooms.push({ id: 'v', column: 2, revealed: true, detailsStatus: 'failed', failureReason: '正文读取失败' })
    f.edges.push({ from: 'a', to: 'v', status: 'matched' })
    const result = plan(f)
    assert.deepEqual(result.unknown, ['v：正文读取失败'])
    assert.deepEqual(result.paths[0].rooms, ['s', 'a'])
    const targeted = plan(f, { targets: ['z'] })
    assert.deepEqual(targeted.unknown, ['v：正文读取失败'])
    assert.match(targeted.reason, /目标 z.*尚未达成/)
  })
}

test('未揭示覆盖旧失败状态，历史与人工已知事实仍按原规则有效', () => {
  const f = fixture(), room = f.rooms[2]
  room.knowledge = { rewards: { status: 'failed' } }
  assert.deepEqual(knownRoom(room, f).missing, [])
  room.knowledge.rewards = { status: 'known', source: 'observed', mapKey: f.mapKey }
  room.rewards = [{ currency: '神圣石', quantity: 2 }]
  assert.equal(knownRoom(room, f).rewards[0].quantity, 2)
  assert.equal(knownRoom(room, { ...f, rerolled: true }).rewards, undefined)
})

test('路线浮窗直接复用规划说明和真实缺口，无机制待确认', () => {
  const floor = fixture()
  floor.width = 800; floor.height = 300
  floor.rooms.forEach(room => Object.assign(room, { x: room.column * 150, y: 80, width: 70, height: 40 }))
  const state = { enabled: true, foreground: true, running: true, floor, marks: { targets: [], avoid: [] },
    observation: { foreground: true, interfaceMatched: true, receivedAt: 100,
      mapOpen: true, clientBounds: { x: 0, y: 0, width: 800, height: 300 }, mapRegion: { x: 0, y: 0, width: 800, height: 300 } } }
  state.recommendation = planSanctumFloor(floor)
  let snapshot = sanctumOverlaySnapshot(state, 100)
  assert.deepEqual(snapshot.unknown, [])
  assert.equal(snapshot.reason, state.recommendation.reason)
  Object.assign(floor.rooms[2], { revealed: true, detailsStatus: 'failed' })
  state.recommendation = planSanctumFloor(floor)
  snapshot = sanctumOverlaySnapshot(state, 100)
  assert.deepEqual(snapshot.unknown, state.recommendation.unknown)
  assert.ok(snapshot.unknown.some(text => text.includes('正文读取失败')))
})
