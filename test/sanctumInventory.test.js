import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeSanctumInventory, summarizeSanctumRelics } from '../electron/modules/sanctum/inventory.js'

const relic = (x, more = {}) => ({ x, y: 0, width: 1, height: 2, status: 'matched', rawText: '同一词缀', baseId: 'censer', ...more })
test('库存按位置保留重复物品且重扫沿用实例 ID', () => {
  let serial = 0
  const scan = { regionId: 'locker', observations: [relic(0), relic(1)] }
  const items = mergeSanctumInventory([], scan, () => String(++serial))
  assert.equal(items.length, 2)
  assert.notEqual(items[0].id, items[1].id)
  assert.deepEqual(mergeSanctumInventory(items, scan), items)
})
test('复制失败或局部空位保留整件旧物，全部占格确认空才删除', () => {
  const items = [{ ...relic(0), id: 'old', regionId: 'locker' }, { ...relic(0), id: 'altar', regionId: 'altar' }]
  const failed = mergeSanctumInventory(items, { regionId: 'locker', observations: [{ x: 0, y: 1, width: 1, height: 1, status: 'unknown' }] })
  assert.equal(failed.find(item => item.id === 'old').status, 'unknown')
  assert.equal(failed.find(item => item.id === 'altar').status, 'matched')
  const partial = mergeSanctumInventory(items, { regionId: 'locker', observations: [{ x: 0, y: 0, width: 1, height: 1, status: 'empty' }] })
  assert.ok(partial.some(item => item.id === 'old'))
  const cleared = mergeSanctumInventory(items, { regionId: 'locker', observations: [{ x: 0, y: 0, width: 1, height: 2, status: 'empty' }] })
  assert.deepEqual(cleared.map(item => item.id), ['altar'])
})
test('拒绝重叠扫描；未确认词缀不参与汇总', () => {
  assert.throws(() => mergeSanctumInventory([], { regionId: 'locker', observations: [relic(0), relic(0)] }), /重叠/)
  const result = summarizeSanctumRelics([{ ...relic(0), modifiers: [{ id: 'resolve', status: 'matched', value: 20 }, { rawText: '未知词缀' }] }])
  assert.equal(result.totals.resolve, 20)
  assert.equal(result.unknown.length, 1)
})
