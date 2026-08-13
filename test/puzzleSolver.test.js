import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BOUNDARY_EXITS,
  CONNECTED_INTERNAL_MASKS,
  DIRECTIONS,
  assignSourceSlots,
  solvePuzzle,
  typeForMask,
  validateSolution
} from '../src/domains/puzzle/solver.js'

const abundant = { endpoint: 20, straight: 20, corner: 20, tee: 20, cross: 20 }

test('五种基础线型覆盖全部非空四位掩码', () => {
  const types = new Set(Array.from({ length: 15 }, (_, index) => typeForMask(index + 1)))
  assert.deepEqual([...types].sort(), ['corner', 'cross', 'endpoint', 'straight', 'tee'])
  assert.equal(typeForMask(DIRECTIONS.N | DIRECTIONS.S), 'straight')
  assert.equal(typeForMask(DIRECTIONS.N | DIRECTIONS.E), 'corner')
  assert.equal(CONNECTED_INTERNAL_MASKS.length, 431)
})

test('求解结果九格连通、内部无断口且出口达到12', () => {
  const result = solvePuzzle({ counts: abundant })
  assert.equal(result.score, 12)
  assert.ok(result.totalOptimalCount > 0)
  assert.ok(result.solutions.length <= 100)
  for (const solution of result.solutions) {
    assert.equal(validateSolution(solution), true)
    assert.equal(solution.cells.length, 9)
    assert.equal(Object.values(solution.usage).reduce((sum, value) => sum + value, 0), 9)
  }
})

test('库存不足与不可能的类型组合返回结构化无解', () => {
  assert.equal(solvePuzzle({ counts: { cross: 8 } }).error, 'INSUFFICIENT_FRAGMENTS')
  const impossible = solvePuzzle({ counts: { endpoint: 9 }, requiredExits: BOUNDARY_EXITS.map(exit => exit.id) })
  assert.equal(impossible.error, 'NO_SOLUTION')
  assert.equal(impossible.solutions.length, 0)
})

test('必选出口是硬约束且其余出口继续最大化', () => {
  const requiredExits = ['N0', 'E1', 'S2', 'W1']
  const result = solvePuzzle({ counts: abundant, requiredExits, solutionLimit: 8 })
  assert.equal(result.score, 12)
  assert.equal(result.solutions.length, 8)
  for (const solution of result.solutions) {
    requiredExits.forEach(exit => assert.ok(solution.exits.includes(exit)))
  }
})

test('禁止出口是硬约束且其余出口继续最大化', () => {
  const forbiddenExits = ['N0', 'E1']
  const result = solvePuzzle({ counts: abundant, forbiddenExits, solutionLimit: 8 })
  assert.equal(result.score, 10)
  assert.equal(result.solutions.length, 8)
  for (const solution of result.solutions) {
    forbiddenExits.forEach(exit => assert.ok(!solution.exits.includes(exit)))
  }
})

test('必选与禁止出口可以组合且冲突约束明确无解', () => {
  const result = solvePuzzle({
    counts: abundant,
    requiredExits: ['N0', 'S2'],
    forbiddenExits: ['E1', 'W1'],
    solutionLimit: 8
  })
  assert.equal(result.score, 10)
  for (const solution of result.solutions) {
    assert.ok(solution.exits.includes('N0'))
    assert.ok(solution.exits.includes('S2'))
    assert.ok(!solution.exits.includes('E1'))
    assert.ok(!solution.exits.includes('W1'))
  }

  const conflict = solvePuzzle({ counts: abundant, requiredExits: ['N0'], forbiddenExits: ['N0'] })
  assert.equal(conflict.error, 'NO_SOLUTION')
  assert.equal(conflict.solutions.length, 0)
})

test('同分方案稳定截断且来源格按置信度和行列选择', () => {
  const first = solvePuzzle({ counts: abundant, solutionLimit: 2 })
  const second = solvePuzzle({ counts: abundant, solutionLimit: 2 })
  assert.equal(first.truncated, first.totalOptimalCount > 2)
  assert.deepEqual(first.solutions, second.solutions)
  const solution = { cells: [
    { index: 0, type: 'corner' },
    { index: 1, type: 'corner' }
  ] }
  const sources = assignSourceSlots(solution, [
    { row: 1, column: 1, occupied: true, type: 'corner', confidence: 0.9 },
    { row: 0, column: 2, occupied: true, type: 'corner', confidence: 0.9 },
    { row: 5, column: 5, occupied: true, type: 'corner', confidence: 0.2, corrected: true }
  ])
  assert.deepEqual(sources.map(slot => [slot.row, slot.column]), [[5, 5], [0, 2]])
})

test('双页相同行列是独立来源且页码参与稳定排序', () => {
  const solution = { cells: [{ index: 0, type: 'corner' }, { index: 1, type: 'corner' }] }
  const sources = assignSourceSlots(solution, [
    { page: 2, row: 0, column: 0, occupied: true, type: 'corner', confidence: 0.9 },
    { page: 1, row: 0, column: 0, occupied: true, type: 'corner', confidence: 0.9 }
  ])
  assert.deepEqual(sources.map(source => [source.page, source.row, source.column]), [[1, 0, 0], [2, 0, 0]])
})

test('图三式单边断口会被有效性检查拒绝', () => {
  const valid = solvePuzzle({ counts: abundant, solutionLimit: 1 }).solutions[0]
  assert.equal(validateSolution(valid), true)
  const broken = structuredClone(valid)
  broken.cells[4].mask ^= DIRECTIONS.E
  assert.equal(validateSolution(broken), false)
})

test('收益策略把相邻收益高的同型碎片放在覆盖格数更多的位置', () => {
  const solution = { cells: [
    { index: 0, type: 'corner' },
    { index: 4, type: 'corner' }
  ] }
  const sources = assignSourceSlots(solution, [
    { page: 1, row: 0, column: 0, occupied: true, type: 'corner', confidence: 1, mods: { status: 'matched', mod: { lines: ['相邻区域包含 3 个额外奥术师的保险箱'] } } },
    { page: 1, row: 0, column: 1, occupied: true, type: 'corner', confidence: 1, mods: { status: 'matched', mod: { lines: ['相邻区域中找到的物品稀有度提高 7%'] } } }
  ], { strategy: 'strongbox' })

  assert.equal(sources.find(source => source.cellIndex === 4).column, 0)
  assert.ok(sources.find(source => source.cellIndex === 4).rewardScore > 0)
})

test('边缘词缀按相邻格生效并能放大该格碎片词缀，不依赖外周出口', () => {
  const solution = { cells: [
    { index: 0, type: 'corner', mask: DIRECTIONS.E | DIRECTIONS.S },
    { index: 1, type: 'corner', mask: DIRECTIONS.E | DIRECTIONS.S }
  ] }
  const valuable = { status: 'matched', mod: { lines: ['相邻区域包含 3 个额外奥术师的保险箱'] } }
  const sources = assignSourceSlots(solution, [
    { page: 1, row: 0, column: 0, occupied: true, type: 'corner', confidence: 1, mods: valuable },
    { page: 1, row: 0, column: 1, occupied: true, type: 'corner', confidence: 1, mods: null }
  ], {
    strategy: 'strongbox',
    edges: { N0: { status: 'matched', mod: { lines: ['相邻区域的词缀数值提高 80%'] } } }
  })

  assert.equal(sources.find(source => source.cellIndex === 0).column, 0)
  assert.ok(!solution.cells[0].mask || !(solution.cells[0].mask & DIRECTIONS.N))
})

test('求解器返回策略相对收益并在无词缀时保留外周出口兜底', () => {
  const slots = Object.entries(abundant).flatMap(([type, count]) => Array.from({ length: count }, (_, index) => ({
    page: index < 10 ? 1 : 2,
    row: Math.floor((index % 10) / 6),
    column: index % 6,
    occupied: true,
    type,
    confidence: 1,
    mods: type === 'cross' && index === 0
      ? { status: 'matched', mod: { lines: ['所有航行区域中找到的亡者硫磺提高 25%'] } }
      : null
  })))
  const profitable = solvePuzzle({ slots, strategy: 'sulphur', solutionLimit: 2 })
  assert.equal(profitable.strategy, 'sulphur')
  assert.ok(profitable.rewardScore > 0)
  assert.ok(profitable.solutions.every(solution => solution.sourceSlots.length === 9))

  const fallback = solvePuzzle({ counts: abundant, strategy: 'balanced', solutionLimit: 2 })
  assert.equal(fallback.rewardDataAvailable, false)
  assert.equal(fallback.score, 12)

  const difficultyOnly = solvePuzzle({ slots: slots.map(slot => ({ ...slot, mods: { status: 'matched', mod: { lines: ['怪物伤害提高 50%'] } } })), solutionLimit: 1 })
  assert.equal(difficultyOnly.rewardDataAvailable, false)
})

test('自动收益选择显示分最高的策略并保留出口约束', () => {
  const slots = Object.entries(abundant).flatMap(([type, count]) => Array.from({ length: count }, (_, index) => ({
    page: index < 10 ? 1 : 2,
    row: Math.floor((index % 10) / 6),
    column: index % 6,
    occupied: true,
    type,
    confidence: 1,
    mods: type === 'cross' && index === 0
      ? { status: 'matched', mod: { lines: ['相邻区域包含 3 个额外奥术师的保险箱'] } }
      : null
  })))
  const requiredExits = ['N0', 'S2']
  const manual = ['balanced', 'strongbox', 'rare', 'magic', 'sulphur']
    .map(strategy => solvePuzzle({ slots, strategy, requiredExits, solutionLimit: 1 }))
  const highest = manual.reduce((best, result) => result.rewardScore > best.rewardScore ? result : best)
  const automatic = solvePuzzle({ slots, strategy: 'auto', requiredExits, solutionLimit: 1 })

  assert.equal(automatic.strategy, 'auto')
  assert.equal(automatic.effectiveStrategy, highest.strategy)
  assert.equal(automatic.rewardScore, highest.rewardScore)
  requiredExits.forEach(exit => assert.ok(automatic.solutions[0].exits.includes(exit)))
})

test('自动收益同分时按策略顺序选择且无收益数据不冒充赢家', () => {
  const slots = Array.from({ length: 9 }, (_, index) => ({
    page: 1, row: Math.floor(index / 6), column: index % 6,
    occupied: true, type: 'cross', confidence: 1,
    mods: { status: 'matched', mod: { lines: ['相邻区域中找到的物品数量提高 10%'] } }
  }))
  const automatic = solvePuzzle({ slots, strategy: 'auto', solutionLimit: 1 })
  assert.equal(automatic.effectiveStrategy, 'balanced')

  const fallback = solvePuzzle({ counts: abundant, strategy: 'auto', solutionLimit: 1 })
  assert.equal(fallback.strategy, 'auto')
  assert.equal(fallback.effectiveStrategy, null)
  assert.equal(fallback.score, 12)
})
