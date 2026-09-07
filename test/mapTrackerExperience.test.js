import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeMapTrackerSettings } from '../electron/modules/mapTracker/model.js'
import { observeCharacterExperience, characterExperienceGrowth } from '../electron/modules/mapTracker/experience.js'

test('角色经验按账号角色和本地日期隔离，首次采样不显示增长', () => {
  const now = new Date(2026, 8, 7, 12).getTime()
  const character = { accountName: 'account', name: 's30、嘎嘎嘎', league: 'S30赛季', experience: 1000 }
  const first = observeCharacterExperience(null, character, now)
  assert.equal(characterExperienceGrowth(first, now), null)
  const second = observeCharacterExperience(first, { ...character, experience: 1200 }, now + 1000)
  assert.equal(characterExperienceGrowth(second, now), 200)
  const decreased = observeCharacterExperience(first, { ...character, experience: 900 }, now + 1000)
  assert.equal(characterExperienceGrowth(decreased, now), -100)
  assert.equal(observeCharacterExperience(second, { ...character, name: '另一角色' }, now).samples, 1)
  assert.equal(observeCharacterExperience(second, character, now + 86400000).samples, 1)
  assert.equal(observeCharacterExperience(second, { ...character, experience: null }, now), null)
})


test('经验曲线采样按时间保留并经设置持久化格式恢复', () => {
  const now = new Date(2026, 8, 7, 12).getTime()
  const character = { accountName: 'account', name: 'character', league: 'league', experience: 1000 }
  const first = observeCharacterExperience(null, character, now)
  const second = observeCharacterExperience(first, { ...character, experience: 1200 }, now + 60000)
  const restored = normalizeMapTrackerSettings(JSON.parse(JSON.stringify({ experienceObservation: second })))
  assert.deepEqual(restored.experienceObservation.points, [
    { at: new Date(now).toISOString(), experience: 1000 },
    { at: new Date(now + 60000).toISOString(), experience: 1200 }
  ])
  assert.equal(characterExperienceGrowth(restored.experienceObservation, now), 200)
})
