import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { migratePoeCnAccountSettings, usePoeCnAccountStore } from '../src/stores/poeCnAccount.js'
import { normalizePriceCheckSettings } from '../src/utils/priceCheckSettings.js'
import { electronApi } from '../src/api/electron.js'

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

test('立即查价对旧设置和非法值默认关闭并保留显式选择', () => {
  assert.equal(normalizePriceCheckSettings({}).queryImmediately, false)
  assert.equal(normalizePriceCheckSettings({ queryImmediately: 'true' }).queryImmediately, false)
  assert.equal(normalizePriceCheckSettings({ queryImmediately: true }).queryImmediately, true)
})

test('旧数值下浮设置被忽略且不会进入后续保存载荷', () => {
  for (const valueRange of ['down10', 'down20', 'unlimited']) {
    const normalized = normalizePriceCheckSettings({ enabled: true, valueRange })
    assert.equal('valueRange' in normalized, false)
  }
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

test('自动登录状态广播只触发一次赛季加载', async () => {
  const storage = storageFrom()
  globalThis.localStorage = storage
  setActivePinia(createPinia())
  const original = {
    onStatusChanged: electronApi.poeCnAccount.onStatusChanged,
    listLeagues: electronApi.poeCnAccount.listLeagues
  }
  let statusListener
  let leagueCalls = 0
  electronApi.poeCnAccount.onStatusChanged = (listener) => {
    statusListener = listener
    return () => {}
  }
  electronApi.poeCnAccount.listLeagues = async () => {
    leagueCalls += 1
    return { success: true, data: [{ id: 'S29', name: 'S29' }] }
  }
  try {
    const store = usePoeCnAccountStore()
    store.listenStatus()
    statusListener({ authenticated: true, mode: 'web', accountName: '自动账号' })
    statusListener({ authenticated: true, mode: 'web', accountName: '自动账号' })
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.equal(store.status.accountName, '自动账号')
    assert.deepEqual(store.leagues, [{ id: 'S29', name: 'S29' }])
    assert.equal(leagueCalls, 1)
  } finally {
    electronApi.poeCnAccount.onStatusChanged = original.onStatusChanged
    electronApi.poeCnAccount.listLeagues = original.listLeagues
    delete globalThis.localStorage
  }
})
