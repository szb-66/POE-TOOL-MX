import test from 'node:test'
import assert from 'node:assert/strict'
import {
  VOYAGE_REWARD_MODE_OPTIONS,
  VOYAGE_REWARD_STRATEGIES,
  normalizeVoyageRewardMode,
  scoreVoyageMod
} from '../src/domains/puzzle/voyageRewards.js'
import { BORDER_CHART_MODS, FRAGMENT_CHART_MODS } from '../src/data/chartModsData.js'

test('收益策略覆盖综合、保险箱、稀有怪、魔法怪与硫磺目标', () => {
  assert.deepEqual(
    VOYAGE_REWARD_STRATEGIES.map(strategy => strategy.id),
    ['balanced', 'strongbox', 'rare', 'magic', 'sulphur']
  )
})

test('自动模式独立于五种实际计分策略', () => {
  assert.deepEqual(VOYAGE_REWARD_MODE_OPTIONS.map(option => option.id), ['auto', 'balanced', 'strongbox', 'rare', 'magic', 'sulphur'])
  assert.equal(normalizeVoyageRewardMode('auto'), 'auto')
  assert.equal(normalizeVoyageRewardMode('invalid'), 'balanced')
})

test('词缀收益区分自身、相邻与全航行作用范围', () => {
  const scored = scoreVoyageMod({ lines: [
    '相邻区域包含 3 个额外奥术师的保险箱',
    '所有航行区域中找到的亡者硫磺提高 25%',
    '怪物有几率被 4000 个荒林鬼灵强化'
  ] }, 'balanced')

  assert.ok(scored.adjacent > 0)
  assert.ok(scored.global > 0)
  assert.ok(scored.self > 0)
  assert.equal(scored.total, scored.self + scored.adjacent + scored.global)
})

test('专精策略会提高对应词缀的相对权重', () => {
  const boxes = { lines: ['相邻区域包含 3 个额外奥术师的保险箱'] }
  const rares = { lines: ['所有航行区域的稀有怪物有 100% 的几率被附身'] }
  const magic = { lines: ['所有航行区域的怪物至少为魔法'] }
  const sulphur = { lines: ['相邻区域中找到的亡者硫磺提高 45%'] }

  assert.ok(scoreVoyageMod(boxes, 'strongbox').total > scoreVoyageMod(boxes, 'balanced').total)
  assert.ok(scoreVoyageMod(rares, 'rare').total > scoreVoyageMod(rares, 'balanced').total)
  assert.ok(scoreVoyageMod(magic, 'magic').total > scoreVoyageMod(magic, 'balanced').total)
  assert.ok(scoreVoyageMod(sulphur, 'sulphur').total > scoreVoyageMod(sulphur, 'balanced').total)
})

test('目录内明确收益词缀均可计分，纯难度词缀保持零分', () => {
  const beneficial = /所有航行区域|相邻区域|相邻海图/
  const ignoredEffects = /词缀数值提高/
  for (const mod of [...FRAGMENT_CHART_MODS, ...BORDER_CHART_MODS]) {
    if (!mod.lines.some(line => beneficial.test(line)) || mod.lines.some(line => ignoredEffects.test(line))) continue
    assert.ok(scoreVoyageMod(mod, 'balanced', { connections: 2 }).total !== 0, mod.lines.join(' / '))
  }
  assert.equal(scoreVoyageMod({ lines: ['怪物伤害提高 50%'] }, 'balanced').total, 0)
})
