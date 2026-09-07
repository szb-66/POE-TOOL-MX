import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateExperienceEfficiency, createMapRun, normalizeMapTrackerSettings } from '../electron/modules/mapTracker/model.js'

test('地图跟踪设置默认关闭且增强项独立归一化', () => {
  const settings = normalizeMapTrackerSettings({ shortcuts: { refreshKills: 'F8' }, enabled: true, enhancements: { kills: true }, calibratedMechanics: ['迷雾'], league: '赛季 A', characterName: '角色', buildName: 'BD' })
  assert.equal(settings.enabled, true)
  assert.equal('kills' in settings.enhancements, false)
  assert.equal(settings.enhancements.loot, false)
  assert.equal('league' in settings, false); assert.equal('characterName' in settings, false); assert.equal('buildName' in settings, false); assert.equal('calibratedMechanics' in settings, false); assert.equal('mechanicCalibrations' in settings, false)
  assert.equal(settings.shortcuts, undefined)
})

test('经验效率未知时为 null 并应用高等级区域修正', () => {
  assert.equal(calculateExperienceEfficiency(null, 83), null)
  assert.equal(calculateExperienceEfficiency(95, null), null)
  assert.equal(calculateExperienceEfficiency(75, 83), 1)
  assert.ok(calculateExperienceEfficiency(100, 68) < 1)
})

test('地图记录固定字段且计数不为负数', () => {
  const run = createMapRun({ areaId: 'MapWorldsCemetery', instanceKey: 'MapWorldsCemetery:1', deaths: -2, league: '赛季 A' })
  assert.equal(run.deaths, 0)
  assert.equal(run.experienceEfficiency, null)
  assert.equal(Object.hasOwn(run, 'loot'), false)
  assert.equal('league' in run, false)
  assert.ok(run.id)
})
