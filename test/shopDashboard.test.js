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
  assert.match(shop, /readPersistentTab\('shopActiveTool', SHOP_TABS, 'chaos'\)/)
  assert.match(shop, /writePersistentTab\('shopActiveTool', value, SHOP_TABS, 'chaos'\)/)
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

  snapshot.recipes.chromatic.candidates = [{ id: 'rgb-1' }, { id: 'rgb-2' }]
  snapshot.recipes.jeweller.candidates = [{ id: 'socket-1' }]
  snapshot.recipes.fusing.candidates = [{ id: 'link-1' }]
  assert.deepEqual(buildVendorRecipeOptions(snapshot, {
    chromatic: ['rgb-2'],
    jeweller: [],
    fusing: ['link-1']
  }).slice(4).map(option => option.label), ['幻色石(1)', '工匠石(0)', '链结石(1)'])
})

test('首页刷新完成时向控制浮窗提交同一快照派生的全部单件选择', async () => {
  installStorage({
    chaosRecipeSettings: JSON.stringify({
      enabled: true,
      selectedTabIds: ['tab-1'],
      activeRecipeId: 'chaos'
    })
  })
  setActivePinia(createPinia())
  const original = {
    refresh: electronApi.chaosRecipe.refresh,
    updateRuntime: electronApi.chaosRecipe.updateRuntime
  }
  const runtimeCalls = []
  electronApi.chaosRecipe.refresh = async () => ({
    success: true,
    data: {
      availableTabs: [{ id: 'tab-1', name: '配方仓库', supported: true }],
      recipes: {
        chance: { kind: 'set', fullSetCount: 0 },
        chaos: { kind: 'set', fullSetCount: 1 },
        regal: { kind: 'set', fullSetCount: 0 },
        exalted: { kind: 'set', fullSetCount: 0 },
        chromatic: { kind: 'single', candidates: [{ id: 'rgb-1' }] },
        jeweller: { kind: 'single', candidates: [{ id: 'six-socket-1' }] },
        fusing: { kind: 'single', candidates: [{ id: 'six-link-1' }] }
      }
    }
  })
  electronApi.chaosRecipe.updateRuntime = async payload => {
    runtimeCalls.push(JSON.parse(JSON.stringify(payload)))
    return { success: true, data: { enabled: payload.enabled } }
  }

  try {
    const store = useChaosRecipeStore()
    await store.refresh()

    assert.equal(runtimeCalls.length, 1)
    assert.deepEqual(runtimeCalls[0].selectedItemIdsByRecipe, {
      chromatic: ['rgb-1'],
      jeweller: ['six-socket-1'],
      fusing: ['six-link-1']
    })
  } finally {
    electronApi.chaosRecipe.refresh = original.refresh
    electronApi.chaosRecipe.updateRuntime = original.updateRuntime
  }
})

test('浮窗切换配方后首页持久化选择并让运行时收敛', async () => {
  const values = installStorage({
    chaosRecipeSettings: JSON.stringify({ enabled: true, activeRecipeId: 'chaos' })
  })
  setActivePinia(createPinia())
  const original = {
    onControlRecipeSelected: electronApi.chaosRecipe.onControlRecipeSelected,
    updateRuntime: electronApi.chaosRecipe.updateRuntime
  }
  let selectFromControl
  const runtimeCalls = []
  electronApi.chaosRecipe.onControlRecipeSelected = callback => {
    selectFromControl = callback
    return () => { selectFromControl = null }
  }
  electronApi.chaosRecipe.updateRuntime = async payload => {
    runtimeCalls.push(JSON.parse(JSON.stringify(payload)))
    return { success: true, data: { enabled: payload.enabled } }
  }

  try {
    const store = useChaosRecipeStore()
    const dispose = store.listenAutomation()
    await selectFromControl('fusing')

    assert.equal(store.settings.activeRecipeId, 'fusing')
    assert.equal(JSON.parse(values.get('chaosRecipeSettings')).activeRecipeId, 'fusing')
    assert.equal(runtimeCalls.at(-1).activeRecipeId, 'fusing')
    dispose()
    assert.equal(selectFromControl, null)
  } finally {
    electronApi.chaosRecipe.onControlRecipeSelected = original.onControlRecipeSelected
    electronApi.chaosRecipe.updateRuntime = original.updateRuntime
  }
})

test('取件完成广播快照后首页更新数量并重置单件勾选且不回推运行时', async () => {
  installStorage({
    chaosRecipeSettings: JSON.stringify({
      enabled: true,
      selectedTabIds: ['tab-1'],
      activeRecipeId: 'chromatic'
    })
  })
  setActivePinia(createPinia())
  const original = {
    onSnapshotUpdated: electronApi.chaosRecipe.onSnapshotUpdated,
    updateRuntime: electronApi.chaosRecipe.updateRuntime
  }
  let snapshotUpdated
  const runtimeCalls = []
  electronApi.chaosRecipe.onSnapshotUpdated = callback => {
    snapshotUpdated = callback
    return () => { snapshotUpdated = null }
  }
  electronApi.chaosRecipe.updateRuntime = async payload => {
    runtimeCalls.push(JSON.parse(JSON.stringify(payload)))
    return { success: true, data: { enabled: payload.enabled } }
  }

  try {
    const store = useChaosRecipeStore()
    const dispose = store.listenAutomation()
    await snapshotUpdated({
      fetchedAt: '2026-01-01T00:00:00.000Z',
      recipes: {
        chance: { kind: 'set', fullSetCount: 0 },
        chaos: { kind: 'set', fullSetCount: 1 },
        regal: { kind: 'set', fullSetCount: 0 },
        exalted: { kind: 'set', fullSetCount: 0 },
        chromatic: { kind: 'single', candidates: [{ id: 'rgb-1' }, { id: 'rgb-2' }] },
        jeweller: { kind: 'single', candidates: [{ id: 'six-socket-1' }] },
        fusing: { kind: 'single', candidates: [{ id: 'six-link-1' }] }
      }
    })

    assert.equal(store.snapshot.recipes.chaos.fullSetCount, 1)
    assert.equal(store.settings.activeRecipeId, 'chromatic')
    assert.deepEqual(store.singleSelections.chromatic, ['rgb-1', 'rgb-2'])
    assert.equal(runtimeCalls.length, 0)
    dispose()
    assert.equal(snapshotUpdated, null)
  } finally {
    electronApi.chaosRecipe.onSnapshotUpdated = original.onSnapshotUpdated
    electronApi.chaosRecipe.updateRuntime = original.updateRuntime
  }
})

test('取件快照广播处理不再回推控制浮窗运行时', () => {
  const store = readFileSync(new URL('../src/stores/chaosRecipe.js', import.meta.url), 'utf8')
  const segment = store.slice(store.indexOf('onSnapshotUpdated'), store.indexOf('onControlRecipeSelected'))
  assert.match(segment, /snapshot\.value = value/)
  assert.match(segment, /resetSingleSelections\(value\)/)
  assert.doesNotMatch(segment, /syncRuntime/)
})

test('主进程在取件完成或停止时广播取件后快照', () => {
  const main = readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8')
  const start = main.indexOf('new ChaosRecipeAutomationManager')
  const segment = main.slice(start, main.indexOf('chaosRecipeService = new ChaosRecipeService'))
  assert.match(segment, /onStatusChange:\s*\(payload\)\s*=>/)
  assert.match(segment, /payload\?\.event\s*!==\s*'completed'\s*&&\s*payload\?\.event\s*!==\s*'stopped'/)
  assert.match(segment, /webContents\.send\('chaos-recipe-snapshot-updated',\s*chaosRecipeService\?\.snapshot\)/)
})

test('取件完成后不再自动请求网络刷新仓库', async () => {
  installStorage({
    poeCnAccountSettings: JSON.stringify({ league: 'S29' }),
    chaosRecipeSettings: JSON.stringify({ enabled: true, selectedTabIds: ['tab-1'] })
  })
  setActivePinia(createPinia())
  const original = {
    onAutomationEvent: electronApi.chaosRecipe.onAutomationEvent,
    refresh: electronApi.chaosRecipe.refresh
  }
  let automationEvent
  let refreshCalls = 0
  electronApi.chaosRecipe.onAutomationEvent = callback => {
    automationEvent = callback
    return () => { automationEvent = null }
  }
  electronApi.chaosRecipe.refresh = async () => {
    refreshCalls += 1
    return { success: true, data: {} }
  }

  try {
    const store = useChaosRecipeStore()
    const dispose = store.listenAutomation()
    automationEvent({ event: 'completed', status: 'completed' })
    await new Promise(resolve => setTimeout(resolve, 1600))
    assert.equal(refreshCalls, 0)
    dispose()
    assert.equal(automationEvent, null)
  } finally {
    electronApi.chaosRecipe.onAutomationEvent = original.onAutomationEvent
    electronApi.chaosRecipe.refresh = original.refresh
  }
})

test('运行时同步携带全局自动化时序四字段', async () => {
  installStorage({
    settings: JSON.stringify({
      operationDelayMs: 20,
      adaptiveTiming: false,
      adaptiveTimeoutMs: 300,
      fixedTiming: {
        modifierSettleMs: 10,
        keyHoldMs: 5,
        buttonHoldMs: 5,
        releaseSettleMs: 5,
        clipboardConfirmMs: 100,
        stashTabSettleMs: 100,
        stashSettleMs: 80,
        patchVerifyMs: 200
      }
    })
  })
  setActivePinia(createPinia())
  const original = electronApi.chaosRecipe.updateRuntime
  const calls = []
  electronApi.chaosRecipe.updateRuntime = async payload => {
    calls.push(JSON.parse(JSON.stringify(payload)))
    return { success: true, data: { enabled: payload.enabled } }
  }

  try {
    const store = useChaosRecipeStore()
    await store.syncRuntime()
    const last = calls.at(-1)
    assert.equal(last.operationDelayMs, 20)
    assert.equal(last.adaptiveTiming, false)
    assert.equal(last.adaptiveTimeoutMs, 300)
    assert.deepEqual(last.fixedTiming, {
      modifierSettleMs: 10,
      keyHoldMs: 5,
      buttonHoldMs: 5,
      releaseSettleMs: 5,
      clipboardConfirmMs: 100,
      stashTabSettleMs: 100,
      stashSettleMs: 80,
      patchVerifyMs: 200
    })
  } finally {
    electronApi.chaosRecipe.updateRuntime = original
  }
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
