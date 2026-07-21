import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { usePresetStore } from '../src/stores/preset.js'
import { cleanShopPresets, cleanVendorConfig } from '../src/domains/shop/vendorConfig.js'

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  }
}

function createStore(storage = createStorage()) {
  globalThis.localStorage = storage
  setActivePinia(createPinia())
  return usePresetStore()
}

test('商城预设 CRUD、默认保护与空白初始化', () => {
  const store = createStore()
  const added = store.addShopPreset('跑图商店')
  assert.equal(store.currentShopPresetId, added.id)
  assert.deepEqual(added.vendor.threeLinks, [])
  store.updateCurrentShopPreset({ name: '已改名' })
  assert.equal(store.currentShopPreset.name, '已改名')
  assert.equal(store.deleteShopPreset('default'), false)
  assert.equal(store.deleteShopPreset(added.id), true)
  assert.equal(store.currentShopPresetId, 'default')
})

test('商城预设可保存并在新 Store 中恢复', () => {
  const storage = createStorage()
  const first = createStore(storage)
  const added = first.addShopPreset('保留')
  first.updateCurrentShopPreset({ vendor: cleanVendorConfig({ movement: ['movement_15'] }) })

  const restored = createStore(storage)
  assert.equal(restored.currentShopPresetId, added.id)
  assert.deepEqual(restored.currentShopPreset.vendor.movement, ['movement_15'])
})

test('旧用户缺少商城键时初始化默认值且不改动物品地图键', () => {
  const storage = createStorage({ itemPresets: '[]', mapPresets: '[]' })
  const store = createStore(storage)
  assert.equal(store.shopPresets.length, 1)
  assert.equal(store.shopPresets[0].id, 'default')
  assert.equal(storage.getItem('itemPresets'), '[]')
  assert.equal(storage.getItem('mapPresets'), '[]')
})

test('商城损坏数据和失效当前 ID 独立回退默认预设', () => {
  const broken = createStore(createStorage({ shopPresets: '{broken', currentShopPresetId: 'missing' }))
  assert.equal(broken.currentShopPresetId, 'default')
  assert.equal(broken.shopPresets.length, 1)

  const cleaned = cleanShopPresets([{ id: 'custom', name: '旧数据', vendor: { movement: ['movement_10'] } }])
  assert.equal(cleaned[0].id, 'default')
  assert.deepEqual(cleaned[1].vendor.twoLinks, [])
})
