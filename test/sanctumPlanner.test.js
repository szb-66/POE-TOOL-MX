import test from 'node:test'
import assert from 'node:assert/strict'
import { createSanctumStrategy, validateSanctumStrategy, applySanctumEffects } from '../shared/sanctum.js'
import { planSanctumFloor as plan, scoreRoom } from '../electron/modules/sanctum/planner.js'

test('未确认房间类型不计入条件圣物恢复，已确认后才加入', () => {
  const strategy = createSanctumStrategy('survival'), effects = applySanctumEffects([{ rule: 'recoveryOnFountain', value: 20 }])
  const room = { id: 'f', type: 'fountain', detailsStatus: 'unknown' }
  assert.equal(scoreRoom(room, strategy, effects).parts.recovery, 0)
  assert.equal(scoreRoom({ ...room, detailsStatus: 'matched' }, strategy, effects).parts.recovery, 20 * strategy.weights.recovery)
})

// Fixed scores below exercise persisted legacy custom strategies.
const planSanctumFloor = (floor,strategy=createSanctumStrategy('survival'),...args)=>plan(floor,strategy,...args)
function fixture() {
  return { identityConfirmed: true, runId: 'run', floorId: 'floor-2', revision: 1, currentRoomId: 'start',
    rooms: [
      { id: 'start', column: 0, detailsStatus: 'matched' },
      { id: 'reward', column: 1, detailsStatus: 'matched', rewards: [{ currency: '混沌石', quantity: 5, timing: 'run' }] },
      { id: 'heal', column: 1, detailsStatus: 'matched', recovery: 4 },
      { id: 'exit', column: 2, detailsStatus: 'matched', terminal: true }
    ], edges: [['start','reward'],['start','heal'],['reward','exit'],['heal','exit']].map(([from,to]) => ({from,to,status:'matched'})) }
}

test('不同预设比较续航和货币，保留拆解与备选', () => {
  assert.equal(planSanctumFloor(fixture()).paths[0].nextRoomId, 'heal')
  const value = planSanctumFloor(fixture(), createSanctumStrategy('currency'))
  assert.equal(value.paths[0].nextRoomId, 'reward')
  assert.equal(value.paths.length, 2)
  assert.equal(value.paths[0].breakdown[0].parts.reward, 18.75)
})
test('不可达目标不放宽避让或禁选痛苦', () => {
  assert.equal(planSanctumFloor(fixture(), undefined, { targets: ['reward'], avoid: ['reward'] }).status, 'blocked')
  const floor = fixture(), strategy = createSanctumStrategy('survival')
  floor.rooms[1].afflictions = [{id:'blind'}]; strategy.bannedAfflictions = ['blind']
  assert.equal(planSanctumFloor(floor, strategy, {targets:['reward']}).status, 'blocked')
})
test('无法恢复会取消续航收益', () => {
  const value = planSanctumFloor(fixture(), undefined, {}, [{rule:'cannotRecover',status:'matched'}])
  assert.equal(value.paths[0].nextRoomId, 'reward')
  assert.equal(value.paths[1].breakdown[0].parts.recovery, 0)
})
test('隐藏奖励和未知数量不猜测收益', () => {
  const floor = fixture(); floor.rooms[1].rewards[0].quantity = null
  const result = planSanctumFloor(floor)
  assert.equal(result.status, 'partial')
  assert.equal(result.paths.find(p => p.nextRoomId === 'reward').breakdown[0].parts.reward, 0)
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
  assert.equal(planSanctumFloor(floor).paths[0].score, 0)
  floor.edges.push({from:'exit',to:'start',status:'matched'})
  assert.equal(planSanctumFloor(floor).status, 'unknown')
})
test('策略拒绝非有限数和非法折扣', () => {
  const strategy = createSanctumStrategy('survival'); strategy.timing.run = 2
  assert.throws(() => validateSanctumStrategy(strategy))
})
test('地图推进后红色不可达连线不参与推荐', () => {
  const floor = fixture(); floor.edges[0].availability = 'unavailable'
  const result = planSanctumFloor(floor, createSanctumStrategy('currency'))
  assert.equal(result.paths[0].nextRoomId, 'heal')
  assert.equal(planSanctumFloor(floor, undefined, {targets:['reward']}).status, 'blocked')
})

test('沿途未知效果、未知房间和隐藏信息不能成为完整推荐', () => {
  const floor = fixture()
  floor.rooms[1].effects = [{ status: 'unknown', rawText: '尚未实现的恩赐',trigger:'entry' }]
  const result = planSanctumFloor(floor)
  assert.equal(result.status, 'partial')
  assert.ok(result.paths.find(p => p.nextRoomId === 'reward').unknown.includes('尚未实现的恩赐'))
  floor.rooms[1].effects = []
  floor.rooms[1].status = 'unknown'
  assert.equal(planSanctumFloor(floor).status, 'partial')
  assert.equal(planSanctumFloor(fixture(), undefined, {}, [{ rule: 'roomsHidden' }]).status, 'partial')
})

test('路径颜色歧义不能参与推荐，禁选房间不增加选择余地', () => {
  const floor = fixture()
  floor.edges[0].availability = 'unknown'
  const result = planSanctumFloor(floor)
  assert.equal(result.status, 'partial')
  assert.ok(result.paths.every(p => !p.rooms.includes('reward')))
  const fork = fixture()
  fork.rooms.push({ id: 'forbidden', column: 2, detailsStatus: 'matched', terminal: true })
  fork.edges.push({ from: 'heal', to: 'forbidden', status: 'matched' })
  const restricted = planSanctumFloor(fork, undefined, { avoid: ['forbidden'] })
  assert.equal(restricted.paths.find(p => p.nextRoomId === 'heal').breakdown[0].parts.options, 2)
})

test('进入房间获得无法恢复效果会影响本房间及后续房间', () => {
  const floor = fixture()
  floor.rooms[2].effects = [{ rule: 'cannotRecover', trigger:'entry' }]
  floor.rooms[3].recovery = 20
  const result = planSanctumFloor(floor)
  assert.ok(result.paths.find(p => p.nextRoomId === 'heal').breakdown.every(p => p.parts.recovery === 0))
  assert.equal(result.paths.find(p => p.nextRoomId === 'reward').breakdown[1].parts.recovery, 80)
})

test('完成房间获得的 completion 效果只影响后续房间评分，不作用于本房间', () => {
  const floor = fixture()
  floor.rooms[1].effects = [{ rule: 'cannotRecover', trigger: 'completion' }]
  floor.rooms[1].recovery = 5
  floor.rooms[3].recovery = 20
  const result = planSanctumFloor(floor)
  const viaReward = result.paths.find(p => p.nextRoomId === 'reward')
  assert.equal(viaReward.breakdown[0].parts.recovery, 20)
  assert.equal(viaReward.breakdown[1].parts.recovery, 0)
  assert.equal(result.paths.find(p => p.nextRoomId === 'heal').breakdown[1].parts.recovery, 80)
})

test('已确认圣物按房间类型提供恢复，禁止恢复时全部归零', () => {
  const floor = fixture()
  floor.rooms[1].type = 'boss'
  floor.rooms[2].type = 'fountain'
  floor.rooms[3].type = 'combat'
  const effects = [{ rule: 'recoveryOnRoom', value: 3 }, { rule: 'recoveryOnBoss', value: 10 },
    { rule: 'recoveryOnFountain', value: 5 }, { rule: 'recoveryIncrease', value: 20 }]
  const result = planSanctumFloor(floor, undefined, {}, effects)
  assert.equal(result.paths.find(path => path.nextRoomId === 'reward').breakdown[0].parts.recovery, 13 * 1.2 * 4)
  assert.equal(result.paths.find(path => path.nextRoomId === 'heal').breakdown[0].parts.recovery, 12 * 1.2 * 4)
  const blocked = planSanctumFloor(floor, undefined, {}, [...effects, { rule: 'cannotRecover' }])
  assert.ok(blocked.paths.every(path => path.breakdown.every(part => part.parts.recovery === 0)))
})
