import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useRegexPresetStore } from '../src/domains/regex/regexPresetStore.js'

function storage(initial = {}) {
  const values = new Map(Object.entries(initial))
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    clear: () => values.clear()
  }
  return values
}

function createStore(initial = {}) {
  const values = storage(initial)
  setActivePinia(createPinia())
  return { store: useRegexPresetStore(), values }
}

test('商城旧预设首次迁移且不覆盖旧存储', () => {
  const legacy = JSON.stringify([{ id: 'default', name: '旧预设', vendor: { threeLinks: ['rgb'], movement: ['movement_15'], plusGems: ['plus_fire'] } }])
  const { store, values } = createStore({ shopPresets: legacy, currentShopPresetId: 'default' })
  assert.equal(store.currentVendorPreset.name, '旧预设')
  assert.deepEqual(store.currentVendorPreset.vendor.movement.selectedIds, ['movement_15'])
  assert.equal('threeLinks' in store.currentVendorPreset.vendor, false)
  assert.equal(values.get('shopPresets'), legacy)
  assert.ok(values.get('vendorRegexPresets'))
})

test('商城与地图正则预设 CRUD 独立保存', () => {
  const { store, values } = createStore()
  const vendor = store.add('vendor', '商店')
  const map = store.add('map', '地图')
  store.update('vendor', { name: '商店改名' })
  assert.equal(store.currentVendorPreset.name, '商店改名')
  assert.equal(store.currentMapRegexPreset.name, '地图')
  assert.equal(store.remove('vendor', vendor.id), true)
  assert.equal(store.currentVendorPresetId, 'default')
  assert.equal(store.remove('map', map.id), true)
  assert.ok(values.get('vendorRegexPresets'))
  assert.ok(values.get('mapRegexPresets'))
})

test('损坏的商城正则存储不会影响地图正则恢复', () => {
  const maps = JSON.stringify([{ id: 'default', name: '地图保留', mapRegex: {} }])
  const { store } = createStore({ vendorRegexPresets: '{broken', mapRegexPresets: maps })
  assert.equal(store.currentVendorPresetId, 'default')
  assert.equal(store.currentMapRegexPreset.name, '地图保留')
})

test('商城首次迁移不会覆盖已经存在的地图正则存储', () => {
  const maps = JSON.stringify([{ id: 'default', name: '已有地图', mapRegex: {} }])
  const { store, values } = createStore({ shopPresets: '[]', mapRegexPresets: maps })
  assert.equal(store.currentMapRegexPreset.name, '已有地图')
  assert.equal(values.get('mapRegexPresets'), maps)
})

test('旧地图正则预设补空价格配置且新价格配置可持久化', () => {
  const maps = JSON.stringify([{ id: 'default', name: '旧地图', mapRegex: { stats: {} } }])
  const { store, values } = createStore({ mapRegexPresets: maps })
  assert.deepEqual(store.currentMapRegexPreset.mapRegex.priceRange, { min: null, max: null, currencies: [] })
  store.currentMapRegexPreset.mapRegex.priceRange = { min: 10, max: 25, currencies: ['ch', 'div'] }
  store.save()
  const saved = JSON.parse(values.get('mapRegexPresets'))
  assert.deepEqual(saved[0].mapRegex.priceRange, { min: 10, max: 25, currencies: ['ch', 'div'] })
})
