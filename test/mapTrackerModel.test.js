import test from 'node:test'
import assert from 'node:assert/strict'
import { createMapRun, normalizeMapTrackerSettings } from '../electron/modules/mapTracker/model.js'

test('地图跟踪设置默认关闭且增强项独立归一化', () => {
  const settings = normalizeMapTrackerSettings({ shortcuts: { refreshKills: 'F8' }, enabled: true, enhancements: { kills: true }, calibratedMechanics: ['迷雾'], league: '赛季 A', characterName: '角色', buildName: 'BD' })
  assert.equal(settings.enabled, true)
  assert.equal('kills' in settings.enhancements, false)
  assert.equal(settings.enhancements.loot, false)
  assert.equal('league' in settings, false); assert.equal('characterName' in settings, false); assert.equal('buildName' in settings, false); assert.equal('calibratedMechanics' in settings, false); assert.equal('mechanicCalibrations' in settings, false)
  assert.equal(settings.shortcuts, undefined)
})


test('地图记录固定字段且计数不为负数', () => {
  const run = createMapRun({ areaId: 'MapWorldsCemetery', instanceKey: 'MapWorldsCemetery:1', deaths: -2, league: '赛季 A' })
  assert.equal(run.deaths, 0)
  assert.equal(Object.hasOwn(run, 'experienceEfficiency'), false)
  assert.equal(Object.hasOwn(run, 'loot'), false)
  assert.equal('league' in run, false)
  assert.ok(run.id)
})
