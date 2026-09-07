import test from 'node:test'
import assert from 'node:assert/strict'
import { experienceDelta, runExperienceDelta, runExperiencePerHour, experienceTrend } from '../shared/experienceStatistics.js'

test('经验净变化保留死亡损失、恢复后净增长和零变化', () => {
  assert.equal(experienceDelta(1000, 900), -100)
  assert.equal(experienceDelta(1000, 1100), 100)
  assert.equal(experienceDelta(1000, 1000), 0)
  for (const value of [null, undefined, NaN, -1, '1000']) assert.equal(experienceDelta(value, 900), null)
})

test('单图经验与每小时折算均保留符号，折算使用采样间隔', () => {
  const run = { experienceStart: 1000, experienceEnd: 900, experienceSampleCount: 2, activeDurationMs: 999000, experienceFirstSampleAt: '2026-09-07T00:00:00Z', experienceLastSampleAt: '2026-09-07T00:01:00Z' }
  assert.equal(runExperienceDelta(run), -100)
  assert.equal(runExperiencePerHour(run), -6000)
  assert.equal(runExperiencePerHour({ ...run, experienceFirstSampleAt: null }), null)
  assert.equal(runExperienceDelta({ ...run, experienceSampleCount: 1 }), null)
})

test('负经验曲线位于零线下方，恢复到初始值后回到零线', () => {
  const observation = { first: 1000, points: [1000, 900, 1000, 1100].map((experience, index) => ({ experience, at: `2026-09-07T00:0${index}:00Z` })) }
  const trend = experienceTrend(observation)
  const yValues = trend.line.split(' ').map(point => Number(point.split(',')[1]))
  assert.equal(yValues[0], trend.zeroY)
  assert.ok(yValues[1] > trend.zeroY)
  assert.equal(yValues[2], trend.zeroY)
  assert.ok(yValues[3] < trend.zeroY)
})
