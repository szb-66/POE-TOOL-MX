import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { emptySanctumState } from '../shared/sanctum.js'
import { acceptSanctumFloor, resetSanctumRun } from '../electron/modules/sanctum/state.js'
import { SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { liveProfile, relicProfile } from '../shared/sanctumLive.js'

const floor = { runId: 'r', floorId: 'f', revision: 1, identityConfirmed: true, currentRoomId: 'a',
  rooms: [{ id: 'a', column: 0 }, { id: 'b', column: 1, terminal: true, detailsStatus: 'matched' }],
  edges: [{ from: 'a', to: 'b', status: 'matched' }] }
test('未知楼层撤销旧推荐，跨轮不沿用手动目标和效果', () => {
  let state = acceptSanctumFloor(emptySanctumState(), floor)
  assert.equal(state.recommendation.status, 'ready')
  state.marks.targets = ['b']
  state.currentEffects = [{ rule: 'cannotRecover' }]
  const next = acceptSanctumFloor(state, { ...floor, runId: 'new' })
  assert.deepEqual(next.marks.targets, [])
  assert.deepEqual(next.currentEffects, [])
  const unknown = acceptSanctumFloor(state, { ...floor, identityConfirmed: false })
  assert.equal(unknown.recommendation, null)
  assert.equal(unknown.floor.identityConfirmed, false)
  assert.equal(resetSanctumRun(state).floor, null)
})
test('生成候选布局不会替换已确认祭坛', () => {
  const state = emptySanctumState()
  state.altar = { ...state.altar, confirmed: true, items: [{ effects: [{ rule: 'cannotRecover' }] }] }
  state.loadouts = { candidates: [{ itemIds: [] }] }
  const next = acceptSanctumFloor(state, { ...floor, rooms: [floor.rooms[0], { ...floor.rooms[1], recovery: 100 }] })
  assert.equal(next.recommendation.paths[0].breakdown[0].parts.recovery, 0)
  assert.deepEqual(next.altar, state.altar)
})
test('重启保留配置及楼层结果，但不恢复采集与位置确认', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-test-'))
  try {
    const repository = new SanctumRepository(directory)
    const state = emptySanctumState()
    const region = { x: 0, y: 0, width: 500, height: 400 }
    const png = fs.readFileSync(new URL('../src/assets/sanctum/vault-boss.png', import.meta.url)).toString('base64')
    state.liveCalibration = liveProfile({ version: 1, environment: { width: 800, height: 600, dpi: 144 },
      mapRegion: region, titleRegion: region, tooltipRegion: region, anchorRegion: region, anchor: { png },
      currentEffectsRegion: region, calibration: { roomSize: [80, 120], pathHsv: [[12, 95, 42], [40, 255, 255]] } })
    state.relicCalibrations.altar = relicProfile({ ...state.liveCalibration, regionId: 'altar', columns: 5, rows: 4 })
    Object.assign(state, { running: true, floor, inventory: [{ id: 'x', status: 'matched' }], solving: true })
    state.loadoutPreferences.fixed = ['x']
    repository.save(state)
    const restored = repository.load()
    assert.equal(restored.running, false)
    assert.equal(restored.solving, false)
    assert.equal(restored.floor.floorId, floor.floorId)
    assert.equal(restored.floor.identityConfirmed, false)
    assert.equal(restored.floor.captureStopped, true)
    assert.equal(restored.inventory[0].id, 'x')
    assert.equal(restored.inventory[0].status, 'unknown')
    assert.equal(restored.altar.confirmed, false)
    assert.deepEqual(restored.loadoutPreferences.fixed, ['x'])
    assert.deepEqual(restored.liveCalibration, state.liveCalibration)
    assert.deepEqual(restored.relicCalibrations, state.relicCalibrations)
  } finally { fs.rmSync(directory, { recursive: true, force: true }) }
})

test('跨楼层保存历史并清理标记，同楼层拒收迟到版本', () => {
  const state = acceptSanctumFloor(emptySanctumState(), floor)
  state.marks.targets = ['b']
  const next = acceptSanctumFloor(state, { ...floor, floorId: 'second' })
  assert.equal(next.history[0].floorId, 'f')
  assert.deepEqual(next.marks.targets, [])
  assert.deepEqual(acceptSanctumFloor(state, { ...floor, revision: 0 }), state)
  assert.deepEqual(acceptSanctumFloor(state, { ...floor, revision: 1, currentRoomId: 'b' }), state)
})
