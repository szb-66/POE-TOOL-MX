import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { electronApi } from '../src/api/electron.js'
import { useChaosRecipeStore } from '../src/stores/chaosRecipe.js'

function installStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    clear: () => values.clear()
  }
  return values
}

test('商城首次默认配方并只恢复合法的最后选择', () => {
  const shop = readFileSync(new URL('../src/domains/shop/ShopView.vue', import.meta.url), 'utf8')
  const recipeTab = shop.indexOf('label="商城配方"')
  const regexTab = shop.indexOf('label="商城正则"')

  assert.ok(recipeTab >= 0 && recipeTab < regexTab)
  assert.match(shop, /\['chaos', 'vendor'\]\.includes\(storedActiveTool\) \? storedActiveTool : 'chaos'/)
  assert.match(shop, /localStorage\.setItem\('shopActiveTool', value\)/)
})

test('应用级初始化恢复配方账号、元数据和运行时', async () => {
  installStorage({
    chaosRecipeSettings: JSON.stringify({
      league: 'S29',
      selectedTabIds: ['tab-1'],
      activeRecipeId: 'chaos'
    })
  })
  setActivePinia(createPinia())

  const original = {
    restoreAuth: electronApi.chaosRecipe.restoreAuth,
    listLeagues: electronApi.chaosRecipe.listLeagues,
    listTabs: electronApi.chaosRecipe.listTabs,
    updateRuntime: electronApi.chaosRecipe.updateRuntime
  }
  const calls = []
  electronApi.chaosRecipe.restoreAuth = async () => ({
    success: true,
    data: { authenticated: true, accountName: '测试账号' }
  })
  electronApi.chaosRecipe.listLeagues = async () => ({
    success: true,
    data: [{ id: 'S29', name: 'S29' }]
  })
  electronApi.chaosRecipe.listTabs = async () => ({
    success: true,
    data: [{ id: 'tab-1', name: '配方仓库', supported: true }]
  })
  electronApi.chaosRecipe.updateRuntime = async payload => {
    calls.push(payload)
    return { success: true, data: { enabled: payload.enabled } }
  }

  try {
    const store = useChaosRecipeStore()
    await store.initializeRuntime()
    assert.equal(store.auth.authenticated, true)
    assert.equal(store.auth.accountName, '测试账号')
    assert.equal(store.supportedTabs.length, 1)
    assert.ok(calls.length >= 1)
  } finally {
    Object.assign(electronApi.chaosRecipe, original)
  }
})

test('首页切换配方会持久化并在控制开启时同步运行时', async () => {
  const values = installStorage()
  setActivePinia(createPinia())
  const originalUpdateRuntime = electronApi.chaosRecipe.updateRuntime
  const calls = []
  electronApi.chaosRecipe.updateRuntime = async payload => {
    calls.push(payload)
    return { success: true, data: { enabled: payload.enabled } }
  }

  try {
    const store = useChaosRecipeStore()
    store.settings.enabled = true
    store.setActiveRecipe('fusing')
    await new Promise(resolve => setImmediate(resolve))

    assert.equal(store.settings.activeRecipeId, 'fusing')
    assert.equal(JSON.parse(values.get('chaosRecipeSettings')).activeRecipeId, 'fusing')
    assert.equal(calls.at(-1).activeRecipeId, 'fusing')
  } finally {
    electronApi.chaosRecipe.updateRuntime = originalUpdateRuntime
  }
})

test('商城配方页不再重复恢复账号', () => {
  const panel = readFileSync(new URL('../src/domains/shop/ChaosRecipePanel.vue', import.meta.url), 'utf8')
  const app = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
  const store = readFileSync(new URL('../src/stores/chaosRecipe.js', import.meta.url), 'utf8')

  assert.doesNotMatch(panel, /onMounted|store\.restoreAuth/)
  assert.match(app, /chaosStore\.initializeRuntime\(\)/)
  assert.match(store, /async function initializeRuntime\(\)[\s\S]*await restoreAuth\(\)[\s\S]*await syncRuntime\(\)/)
})

test('浮窗等待路由识别完成后再挂载，避免误执行主窗口初始化', () => {
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
  const routerReady = main.indexOf('await router.isReady()')
  const mount = main.indexOf("app.mount('#app')")
  assert.ok(routerReady >= 0)
  assert.ok(routerReady < mount)
})
