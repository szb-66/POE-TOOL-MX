import test from 'node:test'
import assert from 'node:assert/strict'
import { paginateList } from '../src/utils/listPagination.js'

test('列表分页固定切片并将页码收敛到合法范围', () => {
  const items = Array.from({ length: 26 }, (_, index) => index + 1)
  assert.deepEqual(paginateList(items, 1, 10), {
    items: items.slice(0, 10), page: 1, pageSize: 10, totalPages: 3
  })
  assert.deepEqual(paginateList(items, 3, 10), {
    items: items.slice(20), page: 3, pageSize: 10, totalPages: 3
  })
  assert.deepEqual(paginateList(items.slice(0, 20), 3, 10), {
    items: items.slice(10, 20), page: 2, pageSize: 10, totalPages: 2
  })
})

test('空列表和非法分页参数安全回退', () => {
  assert.deepEqual(paginateList([], 99, 10), { items: [], page: 1, pageSize: 10, totalPages: 1 })
  assert.deepEqual(paginateList([1, 2], 0, 0), { items: [1, 2], page: 1, pageSize: 10, totalPages: 1 })
})
