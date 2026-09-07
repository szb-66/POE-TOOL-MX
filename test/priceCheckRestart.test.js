import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'

test('重启恢复期间查价先启用后台，恢复失败不捕获，成功恢复清除旧关闭错误', async (t) => {
  const previousStorage = globalThis.localStorage
  const storage = new Map([['priceCheckSettings', JSON.stringify({ enabled: true })]])
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key)
  }
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  t.after(async () => { await server.close(); globalThis.localStorage = previousStorage })
  const { electronApi } = await server.ssrLoadModule('/src/api/electron.js')
  const { usePriceCheckStore } = await server.ssrLoadModule('/src/stores/priceCheck.js')
  const { useFeatureModulesStore } = await server.ssrLoadModule('/src/stores/featureModules.js')
  setActivePinia(createPinia())
  useFeatureModulesStore().enable('price-check')
  const store = usePriceCheckStore()
  let enabled = false
  let rejectRestore = false
  const calls = []
  electronApi.priceCheck.updateRuntime = async (runtime) => {
    calls.push('restore')
    if (rejectRestore) return { success: false, error: { message: '后台恢复失败' } }
    enabled = runtime.enabled
    return { success: true, data: { enabled } }
  }
  electronApi.priceCheck.capture = async () => {
    calls.push('capture')
    assert.equal(enabled, true, '恢复完成前不能发送查价请求')
    return { success: true, data: { model: { item: {} }, result: null } }
  }
  assert.equal(store.settings.enabled, true)
  await store.checkHoveredItem({ configurationGuideBypass: true })
  assert.deepEqual(calls, ['restore', 'capture'])
  calls.length = 0
  await store.checkHoveredItem({ configurationGuideBypass: true })
  assert.deepEqual(calls, ['capture'])

  store.status = null
  rejectRestore = true
  calls.length = 0
  await assert.rejects(store.checkHoveredItem({ configurationGuideBypass: true }), /后台恢复失败/)
  assert.deepEqual(calls, ['restore'])
  assert.equal(store.settings.enabled, true)
  assert.equal(store.error, '后台恢复失败')

  rejectRestore = false
  store.error = '国服查价器尚未启用'
  store.failure = { message: store.error }
  await store.syncRuntime()
  assert.equal(store.error, '')
  assert.equal(store.failure, null)
  store.error = '网络错误'
  await store.syncRuntime()
  assert.equal(store.error, '网络错误')

  store.settings.enabled = false
  calls.length = 0
  await assert.rejects(store.checkHoveredItem({ configurationGuideBypass: true }), /尚未启用/)
  assert.deepEqual(calls, [], '用户主动关闭时不得自动恢复后台')
})
