import test from 'node:test'
import assert from 'node:assert/strict'
import { sanctumDisplay, sanctumRoomLabel, sanctumRoomDetail } from '../shared/sanctumDisplay.js'

function fixture() {
  const room = (id, column, row = 0) => ({ id, column, status: 'matched', detailsStatus: 'matched', x: column * 200 + 20, y: row * 150 + 40, width: 100, height: 80 })
  const edge = (from, to, traversal = 'available') => ({ from, to, status: 'matched', availability: traversal === 'unavailable' ? 'unavailable' : 'gold', traversal })
  const floor = { identityConfirmed: true, runId: 'run', floorId: 'floor', revision: 3, positionStatus: 'confirmed', currentRoomId: 'b',
    rooms: [room('a', 0), room('missed', 0, 1), room('b', 1), room('side', 1, 1), room('c', 2), room('d', 2, 1), room('blocked', 2, 2), room('unknown', 2, 3), room('missing', 3, 3), room('end', 3)],
    edges: [edge('a', 'b', 'visited'), edge('a', 'side'), edge('b', 'c'), edge('b', 'd'), edge('b', 'blocked', 'unavailable'),
      { ...edge('b', 'unknown'), availability: 'unknown', traversal: 'unknown' }, edge('c', 'end'), edge('d', 'end')] }
  const recommendation = { runId: 'run', floorId: 'floor', revision: 3, status: 'ready', paths: [{ rooms: ['b', 'c', 'end'] }, { rooms: ['b', 'd', 'end'] }] }
  return { floor, recommendation }
}
const states = result => Object.fromEntries(result.rooms.map(room => [room.id, room.displayState]))

test('只有实际已走历史房间完成，岔路不可达，当前位置独立，未知不伪造', () => {
  const { floor, recommendation } = fixture()
  const original = structuredClone(floor)
  const display = sanctumDisplay(floor, recommendation)
  assert.deepEqual(states(display), { a: 'completed', missed: 'unreachable', b: 'reachable', side: 'unreachable', c: 'reachable', d: 'reachable', blocked: 'unreachable', unknown: 'unknown', missing: 'unknown', end: 'reachable' })
  assert.equal(display.rooms.find(room => room.id === 'b').current, true)
  assert.equal(display.lines[0].displayState, 'completed')
  assert.equal(display.lines[1].displayState, 'unreachable')
  assert.equal(display.nextRoomId, 'c')
  assert.deepEqual(display.lines.filter(line => line.recommended).map(line => [line.from, line.to]), [['b', 'c'], ['c', 'end']])
  assert.deepEqual(floor, original)
  assert.ok(display.lines.every(line => [line.x1, line.x2, line.y1, line.y2].every(Number.isFinite)))
  assert.ok(display.lines[2].x1 > floor.rooms[2].x + floor.rooms[2].width)
  assert.ok(display.lines[2].x2 < floor.rooms[4].x)
})

test('未知、遮挡和缺边保留未知，已确认路径可以证明汇合房可达', () => {
  const { floor } = fixture()
  floor.edges[4].occluded = true
  floor.rooms.find(room => room.id === 'd').occluded = true
  const result = sanctumDisplay(floor)
  assert.equal(states(result).blocked, 'unknown')
  assert.equal(states(result).d, 'unknown')
  assert.equal(states(result).end, 'reachable')
  assert.equal(states(result).missing, 'unknown')
  assert.equal(result.lines[4].displayState, 'unknown')
})

test('断开的或有分叉的已走证据不能伪装完成链，未知位置不猜历史', () => {
  const { floor } = fixture()
  floor.edges[1].traversal = 'visited'
  assert.equal(sanctumDisplay(floor).rooms.some(room => room.displayState === 'completed'), false)
  floor.positionStatus = 'unknown'
  const result = sanctumDisplay(floor)
  assert.ok(result.rooms.every(room => !room.current && room.displayState === 'unknown'))
  assert.equal(result.nextRoomId, null)
})

test('初始选择推荐第一房，推进后改为当前位置的下一房', () => {
  const { floor, recommendation } = fixture()
  floor.initialSelection = true; floor.positionStatus = 'initial'; floor.currentRoomId = null; floor.startRoomIds = ['a', 'missed']
  recommendation.paths = [{ rooms: ['a', 'b', 'c', 'end'] }]
  let result = sanctumDisplay(floor, recommendation)
  assert.equal(result.nextRoomId, 'a')
  assert.ok(result.rooms.every(room => room.displayState !== 'completed' && !room.current))
  floor.initialSelection = false; floor.positionStatus = 'confirmed'; floor.currentRoomId = 'c'
  floor.edges[2].traversal = 'visited'
  recommendation.paths = [{ rooms: ['c', 'end'] }]
  result = sanctumDisplay(floor, recommendation)
  assert.equal(result.nextRoomId, 'end')
  assert.equal(states(result).b, 'completed')
  assert.equal(states(result).d, 'unreachable')
})

test('身份、版本、位置、状态及连续连线任一不符即撤下推荐', () => {
  const mutations = [f => { f.recommendation.revision-- }, f => { f.recommendation.runId = 'old' }, f => { f.recommendation.floorId = 'old' },
    f => { f.floor.identityConfirmed = false }, f => { f.floor.positionStatus = 'unknown' }, f => { f.recommendation.status = 'blocked' },
    f => { delete f.recommendation.revision }, f => { f.recommendation.paths[0].rooms = ['c', 'end'] },
    f => { f.recommendation.paths[0].rooms = ['b', 'missing'] }, f => { f.floor.edges[2].availability = 'unknown' },
    f => { f.floor.edges[2].availability = 'unavailable' }, f => { f.recommendation = null }]
  for (const mutate of mutations) {
    const f = fixture(); mutate(f)
    const result = sanctumDisplay(f.floor, f.recommendation)
    assert.equal(result.nextRoomId, null)
    assert.ok(result.rooms.every(room => !room.recommended && !room.next))
    assert.ok(result.lines.every(line => !line.recommended))
  }
})

test('方案切换不残留旧绿线，只有当前位置时不标推荐', () => {
  const { floor, recommendation } = fixture()
  recommendation.paths.reverse()
  const display = sanctumDisplay(floor, recommendation)
  assert.equal(display.nextRoomId, 'd')
  assert.equal(display.rooms.find(room => room.id === 'c').recommended, false)
  recommendation.paths = [{ rooms: ['b'] }]
  const terminal = sanctumDisplay(floor, recommendation)
  assert.equal(terminal.nextRoomId, null)
  assert.ok(terminal.rooms.every(room => !room.recommended))
})

test('历史快照保留基础状态，读取失败和手动标记不改变路线状态', () => {
  const { floor, recommendation } = fixture()
  floor.rooms.find(room => room.id === 'c').detailsStatus = 'failed'
  let display = sanctumDisplay(floor, recommendation, { targets: ['c'], avoid: ['d'] }, { stage: 'rooms', targetId: 'c' })
  const next = display.rooms.find(room => room.id === 'c')
  assert.equal(next.displayState, 'reachable')
  assert.equal(sanctumRoomLabel(next), '可达 · 目标')
  assert.equal(display.nextRoomId, null)
  assert.equal(sanctumRoomDetail(next), '读取中')
  assert.equal(sanctumRoomDetail({ ...next, reading: false }), '读取失败')
  floor.identityConfirmed = false; floor.captureStopped = true
  display = sanctumDisplay(floor, recommendation)
  assert.equal(states(display).a, 'completed')
  assert.equal(display.nextRoomId, null)
})
