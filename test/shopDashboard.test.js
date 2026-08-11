import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { electronApi } from '../src/api/electron.js'
import { useChaosRecipeStore } from '../src/stores/chaosRecipe.js'
import { buildVendorRecipeOptions } from '../src/domains/dashboard/vendorRecipeOptions.js'

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
    restore: electronApi.poeCnAccount.restore,
    listLeagues: electronApi.poeCnAccount.listLeagues,
    listTabs: electronApi.chaosRecipe.listTabs,
    updateRuntime: electronApi.chaosRecipe.updateRuntime
  }
  const calls = []
  electronApi.poeCnAccount.restore = async () => ({
    success: true,
    data: { authenticated: true, accountName: '测试账号' }
  })
  electronApi.poeCnAccount.listLeagues = async () => ({
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
    electronApi.poeCnAccount.restore = original.restore
    electronApi.poeCnAccount.listLeagues = original.listLeagues
    electronApi.chaosRecipe.listTabs = original.listTabs
    electronApi.chaosRecipe.updateRuntime = original.updateRuntime
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

test('首页自动取件配方按套装和单件口径显示实时可取数量', () => {
  const empty = buildVendorRecipeOptions(null)
  assert.deepEqual(empty.map(option => option.label), [
    '机会石(0)', '混沌石(0)', '富豪石(0)', '崇高石(0)', '幻色石(0)', '工匠石(0)', '链结石(0)'
  ])

  const snapshot = {
    recipes: {
      chance: { fullSetCount: 1, candidateCount: 99 },
      chaos: { fullSetCount: 2, candidateCount: 99 },
      regal: { fullSetCount: 3, candidateCount: 99 },
      exalted: { fullSetCount: 4, candidateCount: 99 },
      chromatic: { fullSetCount: 99, candidateCount: 10 },
      jeweller: { fullSetCount: 99, candidateCount: 20 },
      fusing: { fullSetCount: 99, candidateCount: 30 }
    }
  }
  assert.deepEqual(buildVendorRecipeOptions(snapshot).map(option => option.label), [
    '机会石(1)', '混沌石(2)', '富豪石(3)', '崇高石(4)', '幻色石(10)', '工匠石(20)', '链结石(30)'
  ])

  snapshot.recipes.jeweller.candidateCount = 19
  assert.equal(buildVendorRecipeOptions(snapshot).find(option => option.value === 'jeweller').label, '工匠石(19)')
})

test('商城配方页不再重复恢复账号', () => {
  const panel = readFileSync(new URL('../src/domains/shop/ChaosRecipePanel.vue', import.meta.url), 'utf8')
  const runtime = readFileSync(new URL('../src/startup/mainRuntime.js', import.meta.url), 'utf8')
  const store = readFileSync(new URL('../src/stores/chaosRecipe.js', import.meta.url), 'utf8')

  assert.doesNotMatch(panel, /onMounted|store\.restoreAuth/)
  assert.match(runtime, /chaosStore\.initializeRuntime\(\)/)
  assert.match(store, /async function initializeRuntime\(\)[\s\S]*await accountStore\.restore\(\)[\s\S]*await syncRuntime\(\)/)
  assert.doesNotMatch(store, /async function (?:openWebLogin|completeWebLogin|loginWithToken|logout)/)
})

test('浮窗等待路由识别完成后再挂载，避免误执行主窗口初始化', () => {
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
  const routerReady = main.indexOf('await router.isReady()')
  const mount = main.indexOf("app.mount('#app')")
  assert.ok(routerReady >= 0)
  assert.ok(routerReady < mount)
})
