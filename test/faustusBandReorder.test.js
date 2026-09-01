import test from 'node:test'
import assert from 'node:assert/strict'
import { createFaustusBandReorderTransaction, moveFaustusBand, reorderFaustusBands } from '../src/utils/faustusBandReorder.js'

const ids = bands => bands.map(band => band.id)
const initialBands = () => [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]

test('浮士德分段按稳定 ID 跨多行实时预览且无效目标不改变顺序', () => {
  assert.deepEqual(ids(reorderFaustusBands(initialBands(), 'a', 'd')), ['b', 'c', 'd', 'a'])
  assert.equal(reorderFaustusBands(initialBands(), 'missing', 'd'), null)
  assert.equal(reorderFaustusBands(initialBands(), 'a', 'a'), null)
})

test('浮士德分段拖拽只在提交时持久化一次', () => {
  let bands = initialBands()
  let commits = 0
  const transaction = createFaustusBandReorderTransaction({
    getBands: () => bands,
    preview: next => { bands = next },
    commit: next => { bands = next; commits += 1 },
    locked: () => false
  })
  assert.equal(transaction.begin('a'), true)
  assert.equal(transaction.preview('c'), true)
  assert.deepEqual(ids(bands), ['b', 'c', 'a', 'd'])
  assert.equal(commits, 0)
  assert.equal(transaction.commit(), true)
  assert.equal(transaction.commit(), false)
  assert.equal(commits, 1)
})

test('浮士德分段拖拽取消恢复快照且重复取消安全忽略', () => {
  let bands = initialBands()
  const transaction = createFaustusBandReorderTransaction({
    getBands: () => bands,
    preview: next => { bands = next },
    commit: () => assert.fail('取消不应持久化'),
    locked: () => false
  })
  transaction.begin('d')
  transaction.preview('a')
  assert.deepEqual(ids(bands), ['d', 'a', 'b', 'c'])
  assert.equal(transaction.cancel(), true)
  assert.deepEqual(ids(bands), ['a', 'b', 'c', 'd'])
  assert.equal(transaction.cancel(), false)
})

test('浮士德分段运行态禁止开始拖拽事务', () => {
  let running = true
  let bands = initialBands()
  const transaction = createFaustusBandReorderTransaction({
    getBands: () => bands,
    preview: next => { bands = next },
    commit: next => { bands = next },
    locked: () => running
  })
  assert.equal(transaction.begin('a'), false)
  running = false
  assert.equal(transaction.begin('a'), true)
})

test('浮士德分段键盘单步移动遵守边界', () => {
  assert.deepEqual(ids(moveFaustusBand(initialBands(), 1, -1)), ['b', 'a', 'c', 'd'])
  assert.deepEqual(ids(moveFaustusBand(initialBands(), 1, 1)), ['a', 'c', 'b', 'd'])
  assert.equal(moveFaustusBand(initialBands(), 0, -1), null)
  assert.equal(moveFaustusBand(initialBands(), 3, 1), null)
})
