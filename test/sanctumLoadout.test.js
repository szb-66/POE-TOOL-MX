import test from 'node:test'
import assert from 'node:assert/strict'
import { solveSanctumLoadouts } from '../electron/modules/sanctum/loadout.js'
import { SanctumLoadoutService } from '../electron/modules/sanctum/loadoutService.js'

const item = (id, width, height, score, more = {}) => ({ id, width, height, score, status: 'matched', ...more })
const grid = items => ({ width: 2, height: 2, unlocked: [0, 1, 2, 3], items, timeBudgetMs: 10000 })

test('相同数值独立实例可同时使用，三套组合不按摆放重复', () => {
  const result = solveSanctumLoadouts(grid([item('a', 1, 2, 5), item('b', 1, 2, 5), item('c', 2, 2, 6)]))
  assert.equal(result.optimal, true)
  assert.deepEqual(result.candidates.map(candidate => candidate.score), [10, 6, 5])
  assert.deepEqual(new Set(result.candidates[0].itemIds), new Set(['a', 'b']))
  for (const candidate of result.candidates) {
    const cells = new Set()
    for (const p of candidate.placements) for (let y = p.y; y < p.y + p.height; y++) for (let x = p.x; x < p.x + p.width; x++) {
      const cell = y * 2 + x
      assert.ok(!cells.has(cell)); cells.add(cell)
      assert.ok(x >= 0 && x < 2 && y >= 0 && y < 2)
    }
  }
})

test('固定朝向、未解锁格与排除都是硬约束', () => {
  const input = { width: 2, height: 1, unlocked: [0, 1], items: [item('a', 1, 2, 5)], fixed: ['a'] }
  assert.equal(solveSanctumLoadouts(input).status, 'blocked')
  assert.equal(solveSanctumLoadouts({ ...grid([item('a', 2, 2, 5)]), unlocked: [0, 1, 2], fixed: ['a'] }).status, 'blocked')
  assert.equal(solveSanctumLoadouts({ ...grid([item('a', 1, 1, 5)]), fixed: ['a'], excluded: ['a'] }).status, 'blocked')
})

test('仅选择指定传奇且无法恢复取消恢复评分，未支持效果可见', () => {
  const items = [item('unique', 1, 1, 0, { unique: true, effects: [{ rule: 'cannotRecover' }, { rawText: '未知传奇规则', status: 'unknown' }] }),
    item('heal', 1, 1, 0, { recoveryScore: 50 }), item('reward', 1, 1, 10)]
  assert.ok(solveSanctumLoadouts(grid(items)).candidates.every(candidate => !candidate.itemIds.includes('unique')))
  const result = solveSanctumLoadouts({ ...grid(items), selectedUniques: ['unique'] })
  assert.ok(result.candidates.every(candidate => candidate.itemIds.includes('unique') && candidate.breakdown.recovery === 0))
  assert.equal(result.candidates[0].score, 10)
  assert.deepEqual(result.candidates[0].unknown, ['未知传奇规则'])
})

test('小规模一格库存对照独立子集穷举', () => {
  const items = [item('a', 1, 1, 7), item('b', 1, 1, -2), item('c', 1, 1, 3), item('d', 1, 1, 9), item('e', 1, 1, 4)]
  const expected = []
  for (let mask = 0; mask < 2 ** items.length; mask++) {
    const selected = items.filter((_, i) => mask & (1 << i))
    if (selected.length <= 3) expected.push(selected.reduce((sum, value) => sum + value.score, 0))
  }
  expected.sort((a, b) => b - a)
  const result = solveSanctumLoadouts({ width: 3, height: 1, unlocked: [0, 1, 2], items })
  assert.deepEqual(result.candidates.map(candidate => candidate.score), expected.slice(0, 3))
})

test('预算与取消保留状态，后台可协作取消', async () => {
  const input = grid([item('a', 1, 1, 1), item('b', 1, 1, 2)])
  const budget = solveSanctumLoadouts({ ...input, nodeBudget: 1 })
  assert.equal(budget.status, 'budget')
  assert.equal(budget.optimal, false)
  assert.equal(solveSanctumLoadouts(input, { cancelled: () => true }).status, 'cancelled')
  const service = new SanctumLoadoutService()
  const pending = service.solve(input)
  service.cancel()
  assert.equal((await pending).status, 'cancelled')
  assert.equal((await service.solve(input)).status, 'complete')
  await service.shutdown()
  await assert.rejects(service.solve(input), /已关闭/)
})

test('混合尺寸与独立网格穷举一致', () => {
  const items = [item('a', 2, 1, 7), item('b', 1, 2, 6), item('c', 1, 1, 3),
    item('d', 1, 1, 5), item('e', 2, 2, 10)]
  const open = [0, 1, 2, 3, 4]
  const scores = []
  function fits(selected, index = 0, occupied = new Set()) {
    if (index === selected.length) return true
    const current = selected[index]
    for (let y = 0; y + current.height <= 2; y++) for (let x = 0; x + current.width <= 3; x++) {
      const cells = []
      for (let dy = 0; dy < current.height; dy++) for (let dx = 0; dx < current.width; dx++) cells.push((y + dy) * 3 + x + dx)
      if (cells.every(cell => open.includes(cell) && !occupied.has(cell)) && fits(selected, index + 1, new Set([...occupied, ...cells]))) return true
    }
    return false
  }
  for (let mask = 0; mask < 2 ** items.length; mask++) {
    const selected = items.filter((_, index) => mask & (1 << index))
    if (!fits(selected)) continue
    scores.push(selected.reduce((sum, item) => sum + item.score, 0))
  }
  const result = solveSanctumLoadouts({ width: 3, height: 2, unlocked: open, items, timeBudgetMs: 10000 })
  assert.equal(result.optimal, true)
  assert.deepEqual(result.candidates.map(item => item.score), scores.sort((a, b) => b - a).slice(0, 3))
})

test('无效预算不能静默降级', () => {
  const input = grid([item('a', 1, 1, 1)])
  assert.throws(() => solveSanctumLoadouts({ ...input, nodeBudget: Infinity }), /预算/)
  assert.throws(() => solveSanctumLoadouts({ ...input, selectedUniques: ['a'] }), /普通圣物/)
})
