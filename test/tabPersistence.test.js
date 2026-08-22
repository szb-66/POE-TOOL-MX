import test from 'node:test'
import assert from 'node:assert/strict'
import {
  readPersistentTab,
  readPersistentTabMap,
  writePersistentTab,
  writePersistentTabMap
} from '../src/utils/tabPersistence.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    value: key => values.get(key)
  }
}

test('持久化 Tab 只恢复合法值并在无效记录时回退默认项', () => {
  const storage = memoryStorage({ valid: 'pickup', invalid: 'removed' })
  assert.equal(readPersistentTab('valid', ['inbound', 'pickup'], 'inbound', storage), 'pickup')
  assert.equal(readPersistentTab('invalid', ['inbound', 'pickup'], 'inbound', storage), 'inbound')
  assert.equal(readPersistentTab('missing', ['inbound', 'pickup'], 'inbound', storage), 'inbound')
})

test('不同 Tab 存储键相互隔离且写入值经过合法性校验', () => {
  const storage = memoryStorage()
  assert.equal(writePersistentTab('bag', 'pickup', ['inbound', 'pickup'], 'inbound', storage), 'pickup')
  assert.equal(writePersistentTab('settings', 'feedback', ['general', 'feedback'], 'general', storage), 'feedback')
  assert.equal(writePersistentTab('bag', 'removed', ['inbound', 'pickup'], 'inbound', storage), 'inbound')
  assert.equal(storage.value('bag'), 'inbound')
  assert.equal(storage.value('settings'), 'feedback')
})

test('动态 Tab 映射按稳定分组 ID 隔离并过滤失效分组和值', () => {
  const storage = memoryStorage({
    catalog: JSON.stringify({ delve: 'suffix', essence: 'prefix', removed: 'suffix', broken: 'other' })
  })
  assert.deepEqual(
    readPersistentTabMap('catalog', ['delve', 'essence', 'broken'], ['prefix', 'suffix'], 'prefix', storage),
    { delve: 'suffix', essence: 'prefix', broken: 'prefix' }
  )
  const saved = writePersistentTabMap('catalog', { delve: 'prefix', essence: 'suffix', removed: 'suffix' },
    ['delve', 'essence'], ['prefix', 'suffix'], 'prefix', storage)
  assert.deepEqual(saved, { delve: 'prefix', essence: 'suffix' })
  assert.deepEqual(JSON.parse(storage.value('catalog')), saved)
})

test('本机存储异常时 Tab 读写使用安全内存结果', () => {
  const storage = {
    getItem() { throw new Error('blocked') },
    setItem() { throw new Error('full') }
  }
  assert.equal(readPersistentTab('bag', ['inbound', 'pickup'], 'inbound', storage), 'inbound')
  assert.equal(writePersistentTab('bag', 'pickup', ['inbound', 'pickup'], 'inbound', storage), 'pickup')
  assert.deepEqual(readPersistentTabMap('catalog', ['delve'], ['prefix', 'suffix'], 'prefix', storage), { delve: 'prefix' })
  assert.deepEqual(writePersistentTabMap('catalog', { delve: 'suffix' }, ['delve'], ['prefix', 'suffix'], 'prefix', storage), { delve: 'suffix' })
})
