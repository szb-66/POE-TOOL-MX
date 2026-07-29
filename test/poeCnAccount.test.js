import test from 'node:test'
import assert from 'node:assert/strict'
import { migratePoeCnAccountSettings } from '../src/stores/poeCnAccount.js'
import { normalizePriceCheckSettings } from '../src/utils/priceCheckSettings.js'

function storageFrom(values = {}) {
  const data = new Map(Object.entries(values))
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value))
  }
}

test('查价器升级后缺失 enabled 时统一默认关闭', () => {
  assert.equal(normalizePriceCheckSettings({ online: true }).enabled, false)
  assert.equal(normalizePriceCheckSettings({ enabled: true }).enabled, true)
})

test('全局赛季迁移优先商城配方并删除旧模块字段', () => {
  const storage = storageFrom({
    chaosRecipeSettings: JSON.stringify({ league: '商城赛季', selectedTabIds: ['1'] }),
    priceCheckSettings: JSON.stringify({ league: '查价赛季', enabled: true })
  })
  const migrated = migratePoeCnAccountSettings(storage)
  assert.equal(migrated.league, '商城赛季')
  assert.equal(JSON.parse(storage.data.get('chaosRecipeSettings')).league, undefined)
  assert.equal(JSON.parse(storage.data.get('priceCheckSettings')).league, undefined)
  assert.equal(JSON.parse(storage.data.get('priceCheckSettings')).enabled, true)
})
