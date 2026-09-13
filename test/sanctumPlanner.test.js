import test from 'node:test'
import assert from 'node:assert/strict'
import { createSanctumStrategy, validateSanctumStrategy } from '../shared/sanctum.js'
import { planSanctumFloor as plan } from '../electron/modules/sanctum/planner.js'

// Structural constraints apply to both practical strategies.
const planSanctumFloor = (floor,strategy=createSanctumStrategy('reveal'),...args)=>plan(floor,strategy,...args)
function fixture() {
  return { identityConfirmed: true, runId: 'run', floorId: 'floor-2', revision: 1, currentRoomId: 'start',
    rooms: [
      { id: 'start', column: 0, detailsStatus: 'matched' },
      { id: 'reward', column: 1, detailsStatus: 'matched', rewards: [{ currency: '混沌石', quantity: 5, timing: 'run' }] },
      { id: 'heal', column: 1, detailsStatus: 'matched', recovery: 4 },
      { id: 'exit', column: 2, detailsStatus: 'matched', terminal: true }
    ], edges: [['start','reward'],['start','heal'],['reward','exit'],['heal','exit']].map(([from,to]) => ({from,to,status:'matched'})) }
}

test('不可达目标不放宽避让或禁选痛苦', () => {
  assert.equal(planSanctumFloor(fixture(), undefined, { targets: ['reward'], avoid: ['reward'] }).status, 'blocked')
  const floor = fixture(), strategy = createSanctumStrategy('reveal')
  floor.rooms[1].afflictions = [{id:'blind'}]; strategy.bannedAfflictions = ['blind']
  assert.equal(planSanctumFloor(floor, strategy, {targets:['reward']}).status, 'blocked')
})
test('未知连线不进入路径且不把断路当终点', () => {
  const floor = fixture(); floor.edges[2].status = 'unknown'
  const result = planSanctumFloor(floor, undefined, { targets: ['reward'] })
  assert.equal(result.status, 'partial'); assert.equal(result.paths[0].complete, false)
  assert.deepEqual(result.paths[0].rooms, ['start','reward'])
})
test('身份不确定或回环拒绝推荐，当前房奖励不重复计算', () => {
  const floor = fixture(); floor.identityConfirmed = false
  assert.equal(planSanctumFloor(floor).status, 'unknown')
  floor.identityConfirmed = true; floor.currentRoomId = 'reward'
  assert.deepEqual(planSanctumFloor(floor).paths[0].offers, [])
  floor.edges.push({from:'exit',to:'start',status:'matched'})
  assert.equal(planSanctumFloor(floor).status, 'unknown')
})
test('策略拒绝非有限数', () => {
  const strategy = createSanctumStrategy('reveal'); strategy.targetPriority.神圣石 = Infinity
  assert.throws(() => validateSanctumStrategy(strategy))
})
test('地图推进后红色不可达连线不参与推荐', () => {
  const floor = fixture(); floor.edges[0].availability = 'unavailable'
  const result = planSanctumFloor(floor, createSanctumStrategy('quantity'))
  assert.equal(result.paths[0].nextRoomId, 'heal')
  assert.equal(planSanctumFloor(floor, undefined, {targets:['reward']}).status, 'blocked')
})
