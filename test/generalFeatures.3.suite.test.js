import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { createPagePreloader as _m0_createPagePreloader } from '../src/router/pagePreloader.js'
import { createRouteTransitionController as _m0_createRouteTransitionController } from '../src/router/transitionState.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFile as _m1_readFile } from 'node:fs/promises'
import { SEASON_BASELINE as _m1_SEASON_BASELINE, S30_SKILL_SENTINELS as _m1_S30_SKILL_SENTINELS, S30_UNIQUE_SENTINELS as _m1_S30_UNIQUE_SENTINELS } from '../shared/seasonBaseline.js'
import { CURRENT_RULESET as _m1_CURRENT_RULESET } from '../electron/modules/crafting/seasonalRules.js'
import { VENDOR_DATA_META as _m1_VENDOR_DATA_META } from '../src/domains/regex/vendorData.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { resetApplicationSettings as _m2_resetApplicationSettings } from '../src/domains/settings/settingsReset.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { readFileSync as _m3_readFileSync } from 'node:fs'
import { createPinia as _m3_createPinia, setActivePinia as _m3_setActivePinia } from 'pinia'
import { electronApi as _m3_electronApi } from '../src/api/electron.js'
import { useChaosRecipeStore as _m3_useChaosRecipeStore } from '../src/stores/chaosRecipe.js'
import { usePoeCnAccountStore as _m3_usePoeCnAccountStore } from '../src/stores/poeCnAccount.js'
import { buildVendorRecipeOptions as _m3_buildVendorRecipeOptions } from '../src/domains/dashboard/vendorRecipeOptions.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { existsSync as _m4_existsSync, readFileSync as _m4_readFileSync } from 'node:fs'
import _m4_path from 'node:path'
import { parseItemInfo as _m4_parseItemInfo } from '../electron/modules/item/parser.js'
import { loadTradeCatalog as _m4_loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { createPriceCheckModel as _m4_createPriceCheckModel } from '../electron/modules/priceCheck/query.js'
import { ITEM_FORMAT_EXAMPLES as _m4_ITEM_FORMAT_EXAMPLES, CHART_FORMAT_EXAMPLES as _m4_CHART_FORMAT_EXAMPLES, MAP_FORMAT_EXAMPLES as _m4_MAP_FORMAT_EXAMPLES, SUPPORTED_FORMAT_EXAMPLES as _m4_SUPPORTED_FORMAT_EXAMPLES } from '../src/utils/supportedItemFormats.js'
import { toGlobalDipPoint as _m4_toGlobalDipPoint } from '../electron/modules/window/coordinates.js'
import { validateCraftingConfig as _m4_validateCraftingConfig } from '../src/utils/validation.js'
import { validateShortcuts as _m4_validateShortcuts } from '../src/utils/shortcutValidator.js'
import { toElectronAccelerator as _m4_toElectronAccelerator } from '../src/utils/electronAccelerator.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { readPersistentTab as _m5_readPersistentTab, readPersistentTabMap as _m5_readPersistentTabMap, writePersistentTab as _m5_writePersistentTab, writePersistentTabMap as _m5_writePersistentTabMap } from '../src/utils/tabPersistence.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { createThemeController as _m6_createThemeController, THEME_STORAGE_KEY as _m6_THEME_STORAGE_KEY } from '../src/theme/themePreference.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { readFileSync as _m7_readFileSync } from 'node:fs'
import _m7_less from 'less'
import { themeController as _m7_themeController } from '../src/theme/useTheme.js'
import { syncMainWindowTheme as _m7_syncMainWindowTheme, BUSINESS_OVERLAY_ROUTES as _m7_BUSINESS_OVERLAY_ROUTES } from '../src/theme/mainWindowTheme.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { DEFAULT_TOOL_SITES as _m8_DEFAULT_TOOL_SITES, TOOL_SITES_STORAGE_KEY as _m8_TOOL_SITES_STORAGE_KEY, addToolSite as _m8_addToolSite, deleteToolSite as _m8_deleteToolSite, loadToolSites as _m8_loadToolSites, moveToolSite as _m8_moveToolSite, saveToolSites as _m8_saveToolSites, toolSiteImageCandidates as _m8_toolSiteImageCandidates, updateToolSite as _m8_updateToolSite, validateToolSite as _m8_validateToolSite } from '../src/domains/tools/toolSites.js'

// === Merged from routeTransition.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const createPagePreloader = _m0_createPagePreloader
  const createRouteTransitionController = _m0_createRouteTransitionController
function createScheduler() {
  let currentTime = 0
  let nextId = 1
  const timers = new Map()

  return {
    now: () => currentTime,
    setTimer(callback, delay) {
      const id = nextId++
      timers.set(id, { callback, at: currentTime + delay })
      return id
    },
    clearTimer(id) {
      timers.delete(id)
    },
    advance(milliseconds) {
      const target = currentTime + milliseconds
      while (true) {
        const next = [...timers.entries()]
          .filter(([, timer]) => timer.at <= target)
          .sort((left, right) => left[1].at - right[1].at)[0]
        if (!next) break
        const [id, timer] = next
        timers.delete(id)
        currentTime = timer.at
        timer.callback()
      }
      currentTime = target
    }
  }
}

function createController(scheduler) {
  return createRouteTransitionController({
    showDelayMs: 80,
    minimumVisibleMs: 160,
    now: scheduler.now,
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer
  })
}

test('快速完成的页面切换不会闪烁加载层', () => {
  const scheduler = createScheduler()
  const controller = createController(scheduler)
  const token = controller.start()

  scheduler.advance(79)
  controller.finish(token)
  scheduler.advance(200)

  assert.equal(controller.pending.value, false)
  assert.equal(controller.visible.value, false)
})

test('慢切换显示加载层并满足最短展示时间', () => {
  const scheduler = createScheduler()
  const controller = createController(scheduler)
  const token = controller.start()

  scheduler.advance(80)
  assert.equal(controller.visible.value, true)

  scheduler.advance(20)
  controller.finish(token)
  scheduler.advance(139)
  assert.equal(controller.visible.value, true)

  scheduler.advance(1)
  assert.equal(controller.visible.value, false)
})

test('旧导航不能结束最新导航的加载状态', () => {
  const scheduler = createScheduler()
  const controller = createController(scheduler)
  const firstToken = controller.start()

  scheduler.advance(80)
  const latestToken = controller.start()

  assert.equal(controller.finish(firstToken), false)
  assert.equal(controller.pending.value, true)
  assert.equal(controller.visible.value, true)

  controller.finish(latestToken)
  scheduler.advance(160)
  assert.equal(controller.visible.value, false)
})

test('页面预加载复用进行中的结果并允许失败后重试', async () => {
  let calls = 0
  const preload = createPagePreloader({
    '/items': async () => {
      calls += 1
      if (calls === 1) throw new Error('temporary failure')
    }
  })

  const first = preload('/items')
  assert.strictEqual(preload('/items'), first)
  assert.equal(await first, false)
  assert.equal(await preload('/items'), true)
  assert.equal(calls, 2)
  assert.equal(await preload('/missing'), false)
})

test('主内容区加载层、导航异常复位与侧栏预加载均已接线', () => {
  const routerSource = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
  const layoutSource = readFileSync(new URL('../src/components/Layout/MainLayout.vue', import.meta.url), 'utf8')
  const sidebarSource = readFileSync(new URL('../src/components/Layout/Sidebar.vue', import.meta.url), 'utf8')

  assert.match(routerSource, /router\.beforeEach/)
  assert.match(routerSource, /router\.afterEach/)
  assert.match(routerSource, /router\.onError/)
  assert.match(layoutSource, /<RouteLoadingOverlay\s*\/>/)
  assert.match(sidebarSource, /@pointerenter="warmRoute/)
  assert.match(sidebarSource, /@focusin="warmRoute/)
})

test('普通页面切换使用居中的常规转圈加载且不再渲染骨架占位', () => {
  const overlaySource = readFileSync(new URL('../src/components/common/RouteLoadingOverlay.vue', import.meta.url), 'utf8')

  assert.match(overlaySource, /class="route-loading-indicator"/)
  assert.match(overlaySource, /<Loading\s*\/>/)
  assert.match(overlaySource, /\.route-loading-overlay\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/)
  assert.doesNotMatch(overlaySource, /route-loading-(?:title|band|cards)/)
})
})()

// === Merged from seasonBaseline.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFile = _m1_readFile
  const SEASON_BASELINE = _m1_SEASON_BASELINE
  const S30_SKILL_SENTINELS = _m1_S30_SKILL_SENTINELS
  const S30_UNIQUE_SENTINELS = _m1_S30_UNIQUE_SENTINELS
  const CURRENT_RULESET = _m1_CURRENT_RULESET
  const VENDOR_DATA_META = _m1_VENDOR_DATA_META
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'))

test('离线制作规则、剧情技能、传奇图片和正则维持同一数据基线', async () => {
  const [crafting, skills, uniques] = await Promise.all([
    readJson('electron/assets/crafting-data/dataset.json'),
    readJson('src/domains/story/skillCatalog.json'),
    readJson('electron/assets/unique-items/catalog.json')
  ])
  assert.deepEqual(CURRENT_RULESET, SEASON_BASELINE)
  assert.equal(crafting.manifest.patch, '3.30.0')
  assert.equal(crafting.manifest.league, 'Covens of Umbra')
  assert.equal(skills.patch, '3.30.0')
  assert.equal(uniques.patch, SEASON_BASELINE.patch)
  assert.match(VENDOR_DATA_META.gameVersion, /S30.*3\.29/)
})

test('S30 技能与传奇关键记录已进入离线目录', async () => {
  const [skills, uniques] = await Promise.all([
    readJson('src/domains/story/skillCatalog.json'),
    readJson('electron/assets/unique-items/catalog.json')
  ])
  assert.deepEqual(S30_SKILL_SENTINELS.filter((sourcePath) => !skills.skills.some((entry) => entry.sourcePath === sourcePath)), [])
  assert.ok(S30_UNIQUE_SENTINELS.some((name) => uniques.items.some((entry) => entry.name === name)))
})

test('3.28 原始快照保留且 3.29 使用独立目录', async () => {
  for (const kind of ['crafting-raw', 'skill-raw', 'unique-items-raw']) {
    const oldManifest = await readJson(`electron/assets/${kind}/3.28/manifest.json`)
    const currentManifest = await readJson(`electron/assets/${kind}/3.29/manifest.json`)
    assert.equal(oldManifest.patch, '3.28')
    assert.equal(currentManifest.patch, SEASON_BASELINE.patch)
  }
})
})()

// === Merged from settingsReset.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const resetApplicationSettings = _m2_resetApplicationSettings
test('停止任一输入自动化失败时不清空用户设置', async () => {
  const calls = []
  await assert.rejects(
    resetApplicationSettings({
      stopAutomations: async () => ({
        success: false,
        stopped: [{ id: 'potion', label: '自动喝药' }],
        failed: [{ id: 'combat-loop', label: '主动循环', error: '停止超时' }]
      }),
      resetStoredSettings: () => calls.push('settings'),
      resetInterfaceDetection: () => calls.push('interface'),
      resetControlOverlayOffset: async () => calls.push('offset'),
      syncPriceCheckShortcut: async () => calls.push('price-check-shortcut'),
      syncShortcuts: async () => calls.push('shortcuts')
    }),
    /无法安全重置：主动循环停止失败/
  )
  assert.deepEqual(calls, [])
})

test('浮窗偏移同步失败不会跳过快捷键重注册和已完成的本地重置', async () => {
  const calls = []
  const result = await resetApplicationSettings({
    stopAutomations: async () => ({ success: true, stopped: [], failed: [] }),
    resetStoredSettings: () => calls.push('settings'),
    resetInterfaceDetection: () => calls.push('interface'),
    resetControlOverlayOffset: async () => {
      calls.push('offset')
      throw new Error('浮窗不可用')
    },
    syncPriceCheckShortcut: async () => calls.push('price-check-shortcut'),
    syncShortcuts: async () => calls.push('shortcuts')
  })

  assert.deepEqual(calls, ['shortcuts', 'settings', 'interface', 'offset', 'price-check-shortcut'])
  assert.deepEqual(result.warnings, [{ id: 'control-overlay-offset', message: '浮窗不可用' }])
})

test('快捷键重注册失败时保留本地设置避免形成分叉状态', async () => {
  const calls = []
  await assert.rejects(resetApplicationSettings({
    stopAutomations: async () => ({ success: true, stopped: [], failed: [] }),
    resetStoredSettings: () => calls.push('settings'),
    resetInterfaceDetection: () => calls.push('interface'),
    resetControlOverlayOffset: async () => calls.push('offset'),
    syncPriceCheckShortcut: async () => calls.push('price-check-shortcut'),
    syncShortcuts: async () => {
      calls.push('shortcuts')
      throw new Error('Alt+3 注册失败')
    }
  }), /Alt\+3 注册失败/)
  assert.deepEqual(calls, ['shortcuts'])
})

test('本地重置会等待模块恢复并把警告返回页面', async () => {
  const calls = []
  const result = await resetApplicationSettings({
    stopAutomations: async () => ({ success: true, stopped: [], failed: [] }),
    resetStoredSettings: async () => {
      calls.push('settings:start')
      await Promise.resolve()
      calls.push('settings:end')
      return { warnings: [{ id: 'feature:bag', message: '存取后台恢复失败' }] }
    },
    resetInterfaceDetection: () => calls.push('interface'),
    resetControlOverlayOffset: async () => calls.push('offset'),
    syncPriceCheckShortcut: async () => calls.push('price-check-shortcut'),
    syncShortcuts: async () => calls.push('shortcuts')
  })

  assert.deepEqual(calls.slice(0, 4), ['shortcuts', 'settings:start', 'settings:end', 'interface'])
  assert.deepEqual(result.warnings, [{ id: 'feature:bag', message: '存取后台恢复失败' }])
})
})()

// === Merged from shopDashboard.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const readFileSync = _m3_readFileSync
  const createPinia = _m3_createPinia
  const setActivePinia = _m3_setActivePinia
  const electronApi = _m3_electronApi
  const useChaosRecipeStore = _m3_useChaosRecipeStore
  const usePoeCnAccountStore = _m3_usePoeCnAccountStore
  const buildVendorRecipeOptions = _m3_buildVendorRecipeOptions
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

test('配方页独立展示配方面板且不再承载正则标签', () => {
  const recipe = readFileSync(new URL('../src/domains/shop/RecipeView.vue', import.meta.url), 'utf8')
  assert.match(recipe, /<ChaosRecipePanel/)
  assert.doesNotMatch(recipe, /el-tab-pane|商城正则/)
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

test('重新登录后已有全局赛季会自动加载仓库页而无需手动刷新', async () => {
  installStorage({
    poeCnAccountSettings: JSON.stringify({ league: 'S30' })
  })
  setActivePinia(createPinia())

  const original = {
    completeWebLogin: electronApi.poeCnAccount.completeWebLogin,
    listLeagues: electronApi.poeCnAccount.listLeagues,
    listTabs: electronApi.chaosRecipe.listTabs
  }
  let tabCalls = 0
  electronApi.poeCnAccount.completeWebLogin = async () => ({
    success: true,
    data: { authenticated: true, accountName: '重新登录账号' }
  })
  electronApi.poeCnAccount.listLeagues = async () => ({
    success: true,
    data: [{ id: 'S30', name: 'S30' }]
  })
  electronApi.chaosRecipe.listTabs = async (league) => {
    tabCalls += 1
    return {
      success: true,
      data: [{ id: 'tab-1', name: `${league} 配方仓库`, supported: true }]
    }
  }

  try {
    const store = useChaosRecipeStore()
    const account = usePoeCnAccountStore()
    await account.completeWebLogin()
    await new Promise(resolve => setImmediate(resolve))

    assert.equal(store.auth.authenticated, true)
    assert.equal(store.league, 'S30')
    assert.equal(store.supportedTabs.length, 1)
    assert.equal(tabCalls, 1)
  } finally {
    electronApi.poeCnAccount.completeWebLogin = original.completeWebLogin
    electronApi.poeCnAccount.listLeagues = original.listLeagues
    electronApi.chaosRecipe.listTabs = original.listTabs
  }
})

test('首次登录后选择赛季会自动加载仓库页并进入后续配置', async () => {
  installStorage()
  setActivePinia(createPinia())

  const original = {
    completeWebLogin: electronApi.poeCnAccount.completeWebLogin,
    listLeagues: electronApi.poeCnAccount.listLeagues,
    setLeague: electronApi.poeCnAccount.setLeague,
    listTabs: electronApi.chaosRecipe.listTabs
  }
  let tabCalls = 0
  electronApi.poeCnAccount.completeWebLogin = async () => ({
    success: true,
    data: { authenticated: true, accountName: '首次登录账号' }
  })
  electronApi.poeCnAccount.listLeagues = async () => ({
    success: true,
    data: [{ id: 'S30', name: 'S30' }]
  })
  electronApi.poeCnAccount.setLeague = async (league) => ({ success: true, data: { league } })
  electronApi.chaosRecipe.listTabs = async (league) => {
    tabCalls += 1
    return {
      success: true,
      data: [{ id: 'tab-1', name: `${league} 配方仓库`, supported: true }]
    }
  }

  try {
    const store = useChaosRecipeStore()
    const account = usePoeCnAccountStore()
    await account.completeWebLogin()
    assert.equal(tabCalls, 0)

    await account.setLeague('S30')

    assert.equal(store.league, 'S30')
    assert.equal(store.supportedTabs.length, 1)
    assert.equal(tabCalls, 1)
  } finally {
    electronApi.poeCnAccount.completeWebLogin = original.completeWebLogin
    electronApi.poeCnAccount.listLeagues = original.listLeagues
    electronApi.poeCnAccount.setLeague = original.setLeague
    electronApi.chaosRecipe.listTabs = original.listTabs
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

test('运行时同步只携带全局固定自动化时序字段', async () => {
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
    assert.equal('adaptiveTiming' in last, false)
    assert.equal('adaptiveTimeoutMs' in last, false)
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
  const runtime = readFileSync(new URL('../src/features/installFeatureRuntime.js', import.meta.url), 'utf8')
  const store = readFileSync(new URL('../src/stores/chaosRecipe.js', import.meta.url), 'utf8')

  assert.doesNotMatch(panel, /onMounted|store\.restoreAuth/)
  assert.match(runtime, /chaosStore\.initializeRuntime\(\{ preserveEnabledOnFailure: true \}\)/)
  assert.match(store, /async function initializeRuntime\([^)]*\)[\s\S]*await accountStore\.restore\(\)[\s\S]*await syncRuntime\(\)/)
  assert.doesNotMatch(store, /async function (?:openWebLogin|completeWebLogin|loginWithToken|logout)/)
})

test('浮窗等待路由识别完成后再挂载，避免误执行主窗口初始化', () => {
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
  const routerReady = main.indexOf('await router.isReady()')
  const mount = main.indexOf("app.mount('#app')")
  assert.ok(routerReady >= 0)
  assert.ok(routerReady < mount)
})
})()

// === Merged from supportedItemFormats.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const existsSync = _m4_existsSync
  const readFileSync = _m4_readFileSync
  const path = _m4_path
  const parseItemInfo = _m4_parseItemInfo
  const loadTradeCatalog = _m4_loadTradeCatalog
  const createPriceCheckModel = _m4_createPriceCheckModel
  const ITEM_FORMAT_EXAMPLES = _m4_ITEM_FORMAT_EXAMPLES
  const CHART_FORMAT_EXAMPLES = _m4_CHART_FORMAT_EXAMPLES
  const MAP_FORMAT_EXAMPLES = _m4_MAP_FORMAT_EXAMPLES
  const SUPPORTED_FORMAT_EXAMPLES = _m4_SUPPORTED_FORMAT_EXAMPLES
  const toGlobalDipPoint = _m4_toGlobalDipPoint
  const validateCraftingConfig = _m4_validateCraftingConfig
  const validateShortcuts = _m4_validateShortcuts
  const toElectronAccelerator = _m4_toElectronAccelerator
const byId = Object.fromEntries(SUPPORTED_FORMAT_EXAMPLES.map(example => [example.id, example.text]))

test('制作和地图页面不再展示格式说明面板', () => {
  const itemsView = readFileSync(new URL('../src/domains/items/ItemsView.vue', import.meta.url), 'utf8')
  const mapView = readFileSync(new URL('../src/domains/map/MapView.vue', import.meta.url), 'utf8')
  const panelPath = new URL('../src/components/common/SupportedFormatPanel.vue', import.meta.url)

  assert.doesNotMatch(itemsView, /SupportedFormatPanel|ITEM_FORMAT_GUIDANCE/)
  assert.doesNotMatch(mapView, /SupportedFormatPanel|(?:MAP|CHART)_FORMAT_GUIDANCE/)
  assert.equal(existsSync(panelPath), false)
})

test('物品普通复制样例可解析基础字段、插槽和显式词缀', () => {
  const item = parseItemInfo(byId['item-basic'])
  assert.equal(item.category, '胸甲')
  assert.equal(item.rarity, '稀有')
  assert.equal(item.level, 86)
  assert.equal(item.quality, 20)
  assert.equal(item.socketsCount, 4)
  assert.equal(item.links, 3)
  assert.ok(item.explicitMods.includes('+96 最大生命'))
})

test('物品详细复制样例可解析详细、隐式和工艺词缀', () => {
  const item = parseItemInfo(byId['item-detailed'])
  assert.equal(item.category, '护身符')
  assert.equal(item.detailedMods.length, 2)
  assert.equal(item.detailedMods[0].name, '健壮的')
  assert.equal(item.detailedMods[0].text, '+89 最大生命')
  assert.deepEqual(item.implicitMods, ['+16 全能力'])
  assert.deepEqual(item.craftedMods, ['+20% 全域暴击伤害加成'])
})

test('国服三字段地图样例可解析阶级、基础属性和外延词缀', () => {
  const item = parseItemInfo(byId['map-normal'])
  assert.equal(item.category, '异界地图')
  assert.equal(item.mapTier, 16)
  assert.equal(item.itemQuantity, 82)
  assert.equal(item.itemRarity, 41)
  assert.equal(item.monsterPackSize, 25)
  assert.ok(item.explicitMods.some(mod => mod.includes('全部最大抗性')))
})

test('完整六字段地图样例可解析替代阶级写法和全部扩展基底', () => {
  const item = parseItemInfo(byId['map-t17'])
  assert.equal(item.category, '异界地图')
  assert.equal(item.mapTier, 17)
  assert.equal(item.moreMaps, 35)
  assert.equal(item.moreScarabs, 70)
  assert.equal(item.moreCurrency, 45)
})

test('集中样例集合覆盖物品、地图和航海海图', () => {
  assert.equal(ITEM_FORMAT_EXAMPLES.length, 7)
  assert.equal(MAP_FORMAT_EXAMPLES.length, 4)
  assert.equal(CHART_FORMAT_EXAMPLES.length, 3)
  assert.equal(SUPPORTED_FORMAT_EXAMPLES.length, 14)
})

test('航海海图样例解析身份、奖励数值和特殊状态', () => {
  const identified = parseItemInfo(byId['chart-identified'])
  assert.equal(identified.category, '海图')
  assert.equal(identified.name, '航海 跋涉')
  assert.equal(identified.baseName, '金沙海床海图')
  assert.equal(identified.areaName, '深渊平原')
  assert.equal(identified.areaLevel, 83)
  assert.equal(identified.itemRarity, 98)
  assert.equal(identified.deadmanSulphur, 30)
  assert.equal(identified.chartShape, '直线')
  assert.equal(identified.detailedMods[1].lines.length, 2)
  assert.equal(identified.explicitMods.some(mod => mod.includes('完成测绘')), false)
  assert.equal(identified.explicitMods.some(mod => mod.includes('瓦莱丽')), false)

  const unidentified = parseItemInfo(byId['chart-unidentified'])
  assert.equal(unidentified.name, '珊瑚密林海图')
  assert.equal(unidentified.baseName, '珊瑚密林海图')
  assert.equal(unidentified.areaName, '海底林地')
  assert.equal(unidentified.isUnidentified, true)
  assert.deepEqual(unidentified.explicitMods, [])

  const corrupted = parseItemInfo(byId['chart-corrupted'])
  assert.equal(corrupted.itemQuantity, 110)
  assert.equal(corrupted.monsterPackSize, 16)
  assert.equal(corrupted.deadmanSulphur, 30)
  assert.equal(corrupted.isCorrupted, true)
})

test('所有代表性格式样例均可被真实解析器识别', () => {
  for (const example of SUPPORTED_FORMAT_EXAMPLES) {
    const item = parseItemInfo(example.text)
    assert.ok(item, example.id)
    assert.ok(item.category, `${example.id} 缺少类别`)
    assert.ok(item.rarity, `${example.id} 缺少稀有度`)
  }
})

test('词缀补丁样例可解析破碎、前后缀与古灵固有词缀', () => {
  const item = parseItemInfo(byId['item-affix-patch'])
  assert.equal(item.category, '鞋子')
  assert.equal(item.isFractured, true)
  assert.deepEqual(item.influences, ['searing-exarch', 'eater-of-worlds'])
  assert.deepEqual(item.implicitMods, ['移动速度加快 7%', '你造成的点燃的伤害生效速度加快 7%'])

  const fractured = item.modifiers.find(mod => mod.type === 'fractured')
  assert.equal(fractured.affixType, 'prefix')
  assert.equal(fractured.name, '鼓舞的')
  assert.equal(fractured.tier, 1)
  assert.deepEqual(fractured.lines, ['该装备的护甲与能量护盾提高 99%'])

  const life = item.modifiers.find(mod => mod.name === '运动员的')
  assert.equal(life.type, 'prefix')
  assert.equal(life.tier, 1)
  assert.deepEqual(life.lines, ['+126 最大生命'])

  const chaos = item.modifiers.find(mod => mod.name === '巴曼斯之')
  assert.equal(chaos.type, 'suffix')
  assert.equal(chaos.tier, 1)
  assert.deepEqual(chaos.lines, ['+31% 混沌抗性'])

  assert.equal(item.explicitMods.some(mod => mod.includes('(115-129)') || mod.includes('(92-100)')), false)
  assert.equal(item.explicitMods.some(mod => mod.includes('近期内意指')), false)
  assert.equal(item.explicitMods.some(mod => mod.includes('他们会在短时间内')), false)
  assert.equal(item.explicitMods.length, 6)
  assert.equal(item.affixFormatUnsupported, false)
})

test('未适配的词缀补丁格式被标记，受支持格式不误报', () => {
  const item = parseItemInfo(`物品类别: 鞋子
稀 有 度: 稀有
咒缚 足迹
圣骑士长靴
--------
物品等级: 84
--------
{ 上级前缀 "鼓舞的" (T1)— 生命 }
+126(115-129) 最大生命`)
  assert.equal(item.affixFormatUnsupported, true)

  const zeroMods = parseItemInfo(`物品类别: 戒指
稀 有 度: 魔法
火山之红玉戒指
--------
物品等级: 72
--------`)
  assert.equal(zeroMods.affixFormatUnsupported, true)

  const normal = parseItemInfo(`物品类别: 胸甲
稀 有 度: 普通
星芒战铠
--------
物品等级: 86
--------`)
  assert.equal(normal.affixFormatUnsupported, false)
  assert.equal(parseItemInfo(byId['item-basic']).affixFormatUnsupported, false)
  assert.equal(parseItemInfo(byId['item-unidentified']).affixFormatUnsupported, false)
  assert.equal(parseItemInfo(byId['map-normal']).affixFormatUnsupported, false)
})

test('简改词缀 v1 的 ▲/▽ 标记解析后与官方措辞结果一致', () => {
  let pendingMark = ''
  const withMarkers = byId['item-affix-patch'].split('\n').map((line) => {
    if (line.startsWith('{')) {
      pendingMark = /前缀词缀/.test(line) ? '▲' : (/后缀词缀/.test(line) ? '▽' : '')
      return line
    }
    if (line === '--------') {
      pendingMark = ''
      return line
    }
    if (pendingMark && line && !/^[（(]/.test(line)) {
      const marked = `${pendingMark} ${line}`
      pendingMark = ''
      return marked
    }
    return line
  }).join('\n')

  const signature = (mods) => mods.map(({ originalLines, ...rest }) => rest)
  const base = parseItemInfo(byId['item-affix-patch'])
  const marked = parseItemInfo(withMarkers)
  assert.deepEqual(signature(marked.modifiers), signature(base.modifiers))
  assert.deepEqual(marked.explicitMods, base.explicitMods)
  assert.deepEqual(marked.implicitMods, base.implicitMods)
})

test('功能补丁的行首标记与尾部注释剥除且改写文案保留原文', async () => {
  const { catalog } = await loadTradeCatalog(path.resolve('electron/modules/priceCheck/catalog.json'))
  const text = `物品类别: 鞋子
稀 有 度: 稀有
咒缚 足迹
圣骑士长靴
--------
物品等级: 84
--------
{ 破碎的 ▲ 前缀词缀 "鼓舞的" (等阶：1)— 防御, 护甲, 能量护盾 }
▲ 此装备增加 99(92-100)% 护甲与能量护盾 [④/③双缀][①单(★100)]
{ ▲ 前缀词缀 "运动员的" (等阶：1)— 生命 }
▲ +126(115-129) 最大生命 [①手|鞋|链]
{ ▽ 后缀词缀 "巴曼斯之" (等阶：1)— 混沌, 抗性 }
▽ +31(31-35)% 混沌抗性 [①](★35%)`
  const item = parseItemInfo(text)
  const fractured = item.modifiers.find(mod => mod.type === 'fractured')
  assert.equal(fractured.affixType, 'prefix')
  assert.deepEqual(fractured.lines, ['此装备增加 99% 护甲与能量护盾'])
  assert.deepEqual(item.modifiers.find(mod => mod.name === '运动员的').lines, ['+126 最大生命'])
  assert.deepEqual(item.modifiers.find(mod => mod.name === '巴曼斯之').lines, ['+31% 混沌抗性'])
  assert.equal(item.explicitMods.some(mod => mod.includes('★') || mod.includes('[①')), false)

  const model = createPriceCheckModel(item, catalog, { initialSelection: 'none' })
  const rewritten = model.unknownStats.find(stat => stat.text.includes('此装备增加'))
  assert.ok(rewritten, '改写文案应进入未映射词缀')
  assert.equal(rewritten.text, '此装备增加 99% 护甲与能量护盾')
})

test('魔法物品区分基底属性和后缀', () => {
  const item = parseItemInfo(byId['item-magic-implicit'])
  assert.equal(item.rarity, '魔法')
  assert.deepEqual(item.implicitMods, ['+25% 火焰抗性'])
  assert.equal(item.modifiers.find(mod => mod.type === 'suffix').name, '火山之')
})

test('多行势力词缀归为同一记录且括号说明不进入匹配文本', () => {
  const item = parseItemInfo(byId['item-multiline-influence'])
  assert.deepEqual(item.influences, ['shaper'])
  assert.equal(item.modifiers[0].lines.length, 2)
  assert.match(item.modifiers[0].text, /增大范围[\s\S]*效果区域扩大 9%/)
  assert.equal(item.explicitMods.some(mod => mod.includes('冰霜元素异常状态指')), false)
})

test('传奇、未鉴定、腐化和不可改变状态可解析', () => {
  assert.equal(parseItemInfo(byId['item-unique']).isLegendary, true)
  const unidentified = parseItemInfo(byId['item-unidentified'])
  assert.equal(unidentified.isUnidentified, true)
  assert.deepEqual(unidentified.influences, ['shaper'])
  assert.equal(parseItemInfo(byId['map-corrupted']).isCorrupted, true)
  assert.equal(parseItemInfo(byId['map-unmodifiable']).isUnmodifiable, true)
})

test('详细格式中的固定说明和使用描述不会成为可匹配词缀', () => {
  const item = parseItemInfo(byId['map-unmodifiable'])
  assert.equal(item.explicitMods.some(mod => mod.includes('私人地图装置')), false)
  assert.equal(item.explicitMods.some(mod => mod.includes('出售获得通货')), false)
  assert.equal(item.explicitMods.some(mod => mod.startsWith('奖励:')), false)
})

test('窗口内坐标可转换为包含负原点的全局 DIP 坐标', () => {
  assert.deepEqual(
    toGlobalDipPoint({ x: -1920, y: -200 }, { x: 120.4, y: 80.7 }),
    { x: -1800, y: -119 }
  )
})

test('制作配置允许 Windows 虚拟桌面的负坐标', () => {
  const result = validateCraftingConfig({
    itemPosition: { x: -320, y: 240 },
    preset: {}
  })

  assert.equal(result.errors.some(error => error.includes('坐标无效')), false)
})

test('快捷键校验覆盖受支持功能、格式和大小写冲突', () => {
  assert.equal(validateShortcuts({ itemStart: 'Alt+1', storyPrevious: 'Numpad7', portal: 'Numpad2' }).isValid, true)
  assert.equal(validateShortcuts({ itemStart: 'Alt+1', storyPrevious: 'alt+1' }).isValid, false)
  assert.equal(validateShortcuts({ storyPrevious: 'Numpad7', portal: 'num7' }).isValid, false)
  assert.equal(validateShortcuts({ portal: 'not a shortcut' }).isValid, false)
})

test('用户可读的小键盘键名会转换为 Electron accelerator', () => {
  assert.equal(toElectronAccelerator('Numpad7'), 'num7')
  assert.equal(toElectronAccelerator('Ctrl+Numpad2'), 'Ctrl+num2')
  assert.equal(toElectronAccelerator('Alt+1'), 'Alt+1')
})
})()

// === Merged from tabPersistence.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const readPersistentTab = _m5_readPersistentTab
  const readPersistentTabMap = _m5_readPersistentTabMap
  const writePersistentTab = _m5_writePersistentTab
  const writePersistentTabMap = _m5_writePersistentTabMap
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
})()

// === Merged from themePreference.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const createThemeController = _m6_createThemeController
  const THEME_STORAGE_KEY = _m6_THEME_STORAGE_KEY
function fixture(saved, dark = false, broken = false) {
  const listeners = new Set()
  const writes = []
  const media = { matches: dark, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) }
  const controller = createThemeController({ localStorage: { getItem() { if (broken) throw Error(); return saved }, setItem(...args) { if (broken) throw Error(); writes.push(args) } }, matchMedia: () => media })
  return { controller, writes, listeners, change(value) { media.matches = value; listeners.forEach(fn => fn()) } }
}
test('默认和非法值跟随系统；系统不可用回退亮色', () => {
  for (const saved of [null, '', 'invalid']) {
    const { controller } = fixture(saved, true)
    assert.deepEqual(controller.snapshot(), { preference: 'system', resolved: 'dark' })
    controller.dispose()
  }
  const controller = createThemeController({})
  assert.deepEqual(controller.snapshot(), { preference: 'system', resolved: 'light' })
})
test('快捷切换进入手动模式，系统变化不覆盖；恢复跟随立即更新', () => {
  const f = fixture('system', true)
  const observed = []
  f.controller.subscribe(value => observed.push(value))
  f.controller.toggle()
  assert.deepEqual(f.controller.snapshot(), { preference: 'light', resolved: 'light' })
  assert.deepEqual(f.writes.at(-1), [THEME_STORAGE_KEY, 'light'])
  f.change(false); f.change(true)
  assert.equal(observed.length, 1)
  f.controller.setPreference('system')
  assert.equal(f.controller.snapshot().resolved, 'dark')
  f.change(false)
  assert.equal(observed.at(-1).resolved, 'light')
  f.controller.dispose()
  assert.equal(f.listeners.size, 0)
})
test('手动偏好恢复、连续切换、重置和存储异常', () => {
  const f = fixture('dark', false)
  assert.equal(f.controller.snapshot().resolved, 'dark')
  f.controller.toggle(); f.controller.toggle()
  assert.equal(f.controller.snapshot().resolved, 'dark')
  f.controller.setPreference('system')
  assert.equal(f.controller.snapshot().resolved, 'light')
  const failed = fixture(null, false, true)
  failed.controller.setPreference('dark')
  assert.equal(failed.controller.snapshot().resolved, 'dark')
  f.controller.dispose(); failed.controller.dispose()
})


test('启动脚本与运行时偏好解析一致，主页面与独立窗口分别处理', async () => {
  const { readFileSync } = await import('node:fs')
  const { runInNewContext } = await import('node:vm')
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
  for (const saved of [null, 'system', 'light', 'dark', 'invalid']) {
    for (const systemDark of [true, false]) {
      for (const hash of ['#/', '#/settings?tab=general', '#/price-check-overlay', '#/coordinate-picker']) {
        const dataset = {}
        runInNewContext(script, {
          localStorage: { getItem: () => saved },
          window: { matchMedia: () => ({ matches: systemDark }) },
          document: { documentElement: { dataset } }, location: { hash }
        })
        const f = fixture(saved, systemDark)
        assert.equal(dataset.startupTheme, f.controller.snapshot().resolved)
        assert.equal(dataset.startupWindow, hash.includes('overlay') || hash.includes('coordinate-picker') ? 'standalone' : 'main')
        f.controller.dispose()
      }
    }
  }
})
})()

// === Merged from themeRendering.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const readFileSync = _m7_readFileSync
  const less = _m7_less
  const themeController = _m7_themeController
  const syncMainWindowTheme = _m7_syncMainWindowTheme
  const BUSINESS_OVERLAY_ROUTES = _m7_BUSINESS_OVERLAY_ROUTES
const { css } = await less.render(readFileSync(new URL('../src/styles/variables.less', import.meta.url), 'utf8'))
function tokens(selector) {
  const result = {}
  for (const block of css.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
    if (!block[1].split(',').map(s => s.trim()).includes(selector)) continue
    for (const [, key, value] of block[2].matchAll(/--([\w-]+):\s*([^;]+);/g)) result[key] = value.trim()
  }
  return result
}
const dark = tokens('html.app-dark-theme'), light = tokens('html.app-light-theme')
test('编译后的双主题令牌完整，预览独立保留深色', () => {
  const preview = tokens('.business-overlay-theme')
  for (const key of Object.keys(dark)) {
    assert.ok(light[key] || ['border-radius-sm','border-radius-md'].includes(key), `亮色缺少 ${key}`)
    assert.equal(preview[key], dark[key], `预览深色令牌 ${key}`)
  }
  assert.notEqual(light['app-bg'], dark['app-bg'])
  assert.equal(preview['overlay-control-height'], '26px')
})
function luminance(hex) {
  const [r,g,b]=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4)
  return .2126*r+.7152*g+.0722*b
}
test('亮色文字、品牌与复选框在所有表面达到对比度要求', () => {
  for(const fg of ['text-primary','text-regular','text-secondary','el-text-color-placeholder','brand-color']) {
    for(const bg of ['app-bg','surface-1','surface-2','surface-hover']) {
      const ratio=(luminance(light[bg])+.05)/(luminance(light[fg])+.05)
      assert.ok(ratio>=4.5, `${fg}/${bg}: ${ratio}`)
    }
  }
  assert.ok((luminance(light['brand-on-color'])+.05)/(luminance(light['brand-color'])+.05)>=4.5)
})
test('偏好变化同步主窗口，浮窗和选择窗口不受影响', () => {
  const previous = globalThis.document
  const classes = new Set()
  globalThis.document = { documentElement: { classList: { toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name) } } } }
  try {
    syncMainWindowTheme({path:'/',meta:{}})
    themeController.setPreference('light')
    assert.ok(classes.has('app-light-theme'))
    themeController.setPreference('dark')
    assert.ok(classes.has('app-dark-theme')); assert.ok(!classes.has('app-light-theme'))
    for(const path of BUSINESS_OVERLAY_ROUTES) {
      syncMainWindowTheme({path,meta:{noLayout:true}})
      themeController.setPreference('light')
      assert.ok(classes.has('app-dark-theme')); assert.ok(classes.has('business-overlay-theme'))
      assert.ok(!classes.has('main-window-theme'))
    }
    for(const path of ['/coordinate-picker','/debug-overlay']) {
      syncMainWindowTheme({path,meta:{noLayout:true}})
      themeController.toggle()
      assert.equal(classes.size,0)
    }
  } finally { globalThis.document = previous }
})
})()

// === Merged from toolSites.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const DEFAULT_TOOL_SITES = _m8_DEFAULT_TOOL_SITES
  const TOOL_SITES_STORAGE_KEY = _m8_TOOL_SITES_STORAGE_KEY
  const addToolSite = _m8_addToolSite
  const deleteToolSite = _m8_deleteToolSite
  const loadToolSites = _m8_loadToolSites
  const moveToolSite = _m8_moveToolSite
  const saveToolSites = _m8_saveToolSites
  const toolSiteImageCandidates = _m8_toolSiteImageCandidates
  const updateToolSite = _m8_updateToolSite
  const validateToolSite = _m8_validateToolSite
function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, value) },
    value(key) { return values.get(key) }
  }
}

test('首次加载写入十个默认站点，返回值与常量互不共享', () => {
  const storage = createStorage()
  const sites = loadToolSites(storage)
  assert.equal(sites.length, 10)
  assert.deepEqual(sites, DEFAULT_TOOL_SITES)
  assert.notStrictEqual(sites[0], DEFAULT_TOOL_SITES[0])
  assert.equal(JSON.parse(storage.value(TOOL_SITES_STORAGE_KEY)).version, 1)
})

test('损坏数据回退默认目录，合法空列表保持为空', () => {
  const damaged = createStorage({ [TOOL_SITES_STORAGE_KEY]: '{bad json' })
  assert.equal(loadToolSites(damaged).length, 10)

  const empty = createStorage({
    [TOOL_SITES_STORAGE_KEY]: JSON.stringify({ version: 1, sites: [] })
  })
  assert.deepEqual(loadToolSites(empty), [])
})

test('加载时规范化站点字段并拒绝非法结构', () => {
  const storage = createStorage({
    [TOOL_SITES_STORAGE_KEY]: JSON.stringify({
      version: 1,
      sites: [{ id: ' custom ', name: '  Example  ', url: 'https://example.com', description: '  描述  ', imageUrl: '' }]
    })
  })
  assert.deepEqual(loadToolSites(storage), [{
    id: 'custom', name: 'Example', url: 'https://example.com/', description: '描述', imageUrl: ''
  }])

  const invalid = createStorage({
    [TOOL_SITES_STORAGE_KEY]: JSON.stringify({ version: 1, sites: [{ id: '', name: 'bad' }] })
  })
  assert.equal(loadToolSites(invalid).length, 10)
})

test('站点校验限制协议、必填项和重复地址', () => {
  const sites = [{ id: 'one', name: 'One', url: 'https://example.com/', description: '', imageUrl: '' }]
  assert.deepEqual(validateToolSite({ name: '', url: 'file:///tmp/a', imageUrl: 'data:image/png,a' }, sites).errors, {
    name: '请输入站点名称',
    url: '请输入有效的 HTTP 或 HTTPS 地址',
    imageUrl: '图片地址仅支持 HTTP 或 HTTPS'
  })
  assert.equal(validateToolSite({ name: 'Duplicate', url: 'https://example.com' }, sites).errors.url, '该站点地址已存在')
  assert.equal(validateToolSite({ name: 'One', url: 'https://example.com' }, sites, 'one').valid, true)
})

test('新增、编辑、删除与移动站点保持不可变操作', () => {
  const original = [{ id: 'one', name: 'One', url: 'https://one.test/', description: '', imageUrl: '' }]
  const added = addToolSite(original, { name: ' Two ', url: 'https://two.test', description: ' D ' }, () => 'two')
  assert.equal(added.success, true)
  assert.equal(added.site.url, 'https://two.test/')
  assert.equal(original.length, 1)

  const updated = updateToolSite(added.sites, 'two', { name: 'Second', url: 'https://two.test/', description: '', imageUrl: '' })
  assert.equal(updated.success, true)
  assert.equal(updated.site.name, 'Second')
  assert.deepEqual(moveToolSite(updated.sites, 1, 0).map(site => site.id), ['two', 'one'])
  assert.deepEqual(deleteToolSite(updated.sites, 'one').map(site => site.id), ['two'])
})

test('保存失败可被调用方识别', () => {
  const storage = { setItem() { throw new Error('quota') } }
  assert.equal(saveToolSites([], storage), false)
})

test('图片候选按自定义地址、favicon 顺序生成并去重', () => {
  assert.deepEqual(toolSiteImageCandidates({
    url: 'https://example.com/path', imageUrl: 'https://cdn.example.com/logo.png'
  }), ['https://cdn.example.com/logo.png', 'https://example.com/favicon.ico'])
  assert.deepEqual(toolSiteImageCandidates({
    url: 'https://example.com/path', imageUrl: 'https://example.com/favicon.ico'
  }), ['https://example.com/favicon.ico'])
})
})()
