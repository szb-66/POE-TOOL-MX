import test from 'node:test'
import assert from 'node:assert/strict'
import { MapTrackerStateMachine } from '../electron/modules/mapTracker/stateMachine.js'

test('首次进图、回城再入和附属区域维持同一局', () => {
  let time = 0; const machine = new MapTrackerStateMachine({ now: () => time })
  machine.setEnabled(true); machine.setForeground(true)
  machine.handleEvent({ type: 'area-entered', areaId: 'MapWorldsCemetery', seed: '7', areaLevel: 83, mapTier: 16 })
  assert.equal(machine.activeRun.portalsUsed, 1)
  time = 1000; machine.handleEvent({ type: 'area-entered', areaId: 'AbyssLeague', seed: '8', areaLevel: 83, mapTier: 16 })
  assert.equal(machine.activeRun.portalsUsed, 1)
  time = 2000; machine.handleEvent({ type: 'area-entered', areaId: 'Hideout', seed: '1', areaLevel: 60, mapTier: null })
  time = 3000; machine.handleEvent({ type: 'area-entered', areaId: 'MapWorldsCemetery', seed: '7', areaLevel: 83, mapTier: 16 })
  assert.equal(machine.activeRun.portalsUsed, 2)
})

test('计时排除失焦和暂停但包含空闲并在新实例自动结算', () => {
  let time = 0; const machine = new MapTrackerStateMachine({ now: () => time })
  machine.setEnabled(true); machine.setForeground(true)
  machine.handleEvent({ type: 'area-entered', areaId: 'MapWorldsCemetery', seed: '1', areaLevel: 83, mapTier: 16 })
  time = 1000; machine.tick(); machine.setIdleMs(10000)
  time = 3000; machine.tick(); machine.setIdleMs(0); machine.setPaused(true)
  time = 5000; machine.tick(); machine.setPaused(false)
  time = 6000; machine.handleEvent({ type: 'area-entered', areaId: 'MapWorldsMuseum', seed: '2', areaLevel: 82, mapTier: 15 })
  assert.equal(machine.completed[0].activeDurationMs, 4000)
  assert.equal(machine.completed[0].endReason, 'next-map')
})

test('死亡只更新活动局', () => {
  const machine = new MapTrackerStateMachine({ now: () => 0 }); machine.setEnabled(true)
  machine.handleEvent({ type: 'area-entered', areaId: 'MapWorldsBog', seed: '1', areaLevel: 80, mapTier: 13 })
  machine.handleEvent({ type: 'player-death' })
  assert.equal(machine.activeRun.deaths, 1)
})
