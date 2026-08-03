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

test('图三式单边断口会被有效性检查拒绝', () => {
  const valid = solvePuzzle({ counts: abundant, solutionLimit: 1 }).solutions[0]
  assert.equal(validateSolution(valid), true)
  const broken = structuredClone(valid)
  broken.cells[4].mask ^= DIRECTIONS.E
  assert.equal(validateSolution(broken), false)
})
