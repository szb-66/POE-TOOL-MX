import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { createPinia as _m0_createPinia, setActivePinia as _m0_setActivePinia } from 'pinia'
import { usePresetStore as _m0_usePresetStore } from '../src/stores/preset.js'
import { createDefaultMapConfig as _m0_createDefaultMapConfig } from '../src/utils/mapPresetMigration.js'
import { resolveShortcutScopeHealth as _m0_resolveShortcutScopeHealth } from '../src/utils/shortcutConfig.js'
import { createModuleStatus as _m0_createModuleStatus, evaluateBagStatus as _m0_evaluateBagStatus, evaluateCombatStatus as _m0_evaluateCombatStatus, evaluateCraftingStatus as _m0_evaluateCraftingStatus, evaluateItemsStatus as _m0_evaluateItemsStatus, evaluateMapStatus as _m0_evaluateMapStatus, evaluatePriceCheckStatus as _m0_evaluatePriceCheckStatus, evaluateShortcutHealth as _m0_evaluateShortcutHealth, evaluateShopStatus as _m0_evaluateShopStatus, evaluateStoryStatus as _m0_evaluateStoryStatus, ITEM_CRAFTING_MODE_OPTIONS as _m0_ITEM_CRAFTING_MODE_OPTIONS, MAP_ROLLING_METHOD_OPTIONS as _m0_MAP_ROLLING_METHOD_OPTIONS, RECOVERY_MODE_OPTIONS as _m0_RECOVERY_MODE_OPTIONS, summarizeModules as _m0_summarizeModules } from '../src/domains/dashboard/dashboardStatus.js'
import { DASHBOARD_MODULE_GROUPS as _m0_DASHBOARD_MODULE_GROUPS, groupDashboardModules as _m0_groupDashboardModules } from '../src/domains/dashboard/dashboardGroups.js'
import { clearCurrentScriptProcess as _m0_clearCurrentScriptProcess, getCurrentScriptMode as _m0_getCurrentScriptMode, getCurrentScriptProcess as _m0_getCurrentScriptProcess, setCurrentScriptProcess as _m0_setCurrentScriptProcess } from '../electron/modules/python/process.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFileSync as _m1_readFileSync } from 'node:fs'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { FEATURE_MODULE_STORAGE_KEY as _m2_FEATURE_MODULE_STORAGE_KEY, availableFeatureCatalog as _m2_availableFeatureCatalog, availableNavigationFeatureCatalog as _m2_availableNavigationFeatureCatalog, featureForRoute as _m2_featureForRoute, filterFeatureShortcuts as _m2_filterFeatureShortcuts, shortcutFeatureId as _m2_shortcutFeatureId } from '../src/features/featureCatalog.js'
import { normalizeFeatureModuleState as _m2_normalizeFeatureModuleState, readFeatureModuleState as _m2_readFeatureModuleState, saveFeatureModuleState as _m2_saveFeatureModuleState } from '../src/features/featureModuleRepository.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { createPinia as _m3_createPinia } from 'pinia'
import { serverContext as _m3_serverContext } from '../shared/serverMode.js'
import { currentServer as _m3_currentServer } from '../src/utils/serverContext.js'
import { useFeatureModulesStore as _m3_useFeatureModulesStore } from '../src/stores/featureModules.js'
import { enableFeatureModule as _m3_enableFeatureModule, registerFeatureRuntimeAdapter as _m3_registerFeatureRuntimeAdapter, setFeatureShortcutSynchronizer as _m3_setFeatureShortcutSynchronizer } from '../src/features/featureRuntime.js'
import _m4_assert from 'node:assert/strict'
import _m4_test from 'node:test'
import { buildItemFootprintCatalog as _m4_buildItemFootprintCatalog, parseRepoeVersion as _m4_parseRepoeVersion, validateItemFootprintCatalog as _m4_validateItemFootprintCatalog } from '../scripts/generateItemFootprints.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { existsSync as _m5_existsSync, readFileSync as _m5_readFileSync } from 'node:fs'
import { CRAFTING_TOPICS as _m5_CRAFTING_TOPICS, FAQ_TOPICS as _m5_FAQ_TOPICS, GENERAL_TOPICS as _m5_GENERAL_TOPICS, MODULE_TOPICS as _m5_MODULE_TOPICS, moduleHelpTopicsById as _m5_moduleHelpTopicsById, moduleTopicById as _m5_moduleTopicById } from '../src/domains/help/helpContent.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import _m6_fs from 'node:fs'
import _m6_os from 'node:os'
import _m6_path from 'node:path'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { internationalVerificationFeatures as _m7_internationalVerificationFeatures, serverContext as _m7_serverContext, INTERNATIONAL_AUTOMATION_FEATURES as _m7_INTERNATIONAL_AUTOMATION_FEATURES } from '../shared/serverMode.js'
import { serverChannelFailure as _m7_serverChannelFailure, serverShortcutAllowed as _m7_serverShortcutAllowed } from '../electron/modules/app/serverIpcPolicy.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { readFileSync as _m8_readFileSync } from 'node:fs'
import { buildInternationalItemFootprints as _m8_buildInternationalItemFootprints } from '../scripts/generateInternationalItemFootprints.js'
import { ItemFootprintRegistry as _m8_ItemFootprintRegistry, configureItemFootprintRegistry as _m8_configureItemFootprintRegistry, loadServerFootprintCatalog as _m8_loadServerFootprintCatalog, itemFootprintRegistry as _m8_itemFootprintRegistry } from '../electron/modules/items/footprintRegistry.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { createHash as _m9_createHash } from 'node:crypto'
import _m9_data from '../src/data/internationalMapData.js'
import { mapRegexCatalog as _m9_mapRegexCatalog, createDefaultMapRegexConfig as _m9_createDefaultMapRegexConfig, cleanMapRegexConfig as _m9_cleanMapRegexConfig, generateMapRegex as _m9_generateMapRegex } from '../src/domains/regex/mapRegex.js'
import { beastRegexOptions as _m9_beastRegexOptions, cleanBeastRegexConfig as _m9_cleanBeastRegexConfig, generateBeastRegex as _m9_generateBeastRegex } from '../src/domains/regex/beastRegex.js'
import { affixSuggestionsForKind as _m9_affixSuggestionsForKind, searchMapAffixSuggestions as _m9_searchMapAffixSuggestions } from '../src/utils/mapAffixSuggestions.js'
import { parseInternationalMods as _m9_parseInternationalMods, parseInternationalChart as _m9_parseInternationalChart, buildInternationalSuggestions as _m9_buildInternationalSuggestions, parseCurrentBeasts as _m9_parseCurrentBeasts, generateInternationalMapData as _m9_generateInternationalMapData } from '../scripts/generateInternationalMapData.js'
import _m10_assert from 'node:assert/strict'
import { readFileSync as _m10_readFileSync } from 'node:fs'
import _m10_test from 'node:test'
import { ITEM_FOOTPRINT_SCHEMA_VERSION as _m10_ITEM_FOOTPRINT_SCHEMA_VERSION, ItemFootprintRegistry as _m10_ItemFootprintRegistry, createFootprintKey as _m10_createFootprintKey, loadBundledFootprintCatalog as _m10_loadBundledFootprintCatalog, normalizeFootprintText as _m10_normalizeFootprintText } from '../electron/modules/items/footprintRegistry.js'
import { normalizeStashItem as _m10_normalizeStashItem } from '../electron/modules/chaosRecipe/normalizer.js'
import _m11_test from 'node:test'
import _m11_assert from 'node:assert/strict'
import { paginateList as _m11_paginateList } from '../src/utils/listPagination.js'
import _m12_test from 'node:test'
import _m12_assert from 'node:assert/strict'
import { readFileSync as _m12_readFileSync } from 'node:fs'
import { parse as _m12_parse } from '@vue/compiler-sfc'
import { availableFeatureCatalog as _m12_availableFeatureCatalog } from '../src/features/featureCatalog.js'
import _m13_test from 'node:test'
import _m13_assert from 'node:assert/strict'
import { createPinia as _m13_createPinia, setActivePinia as _m13_setActivePinia } from 'pinia'
import { useRegexPresetStore as _m13_useRegexPresetStore } from '../src/domains/regex/regexPresetStore.js'

// === Merged from dashboardStatus.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const createPinia = _m0_createPinia
  const setActivePinia = _m0_setActivePinia
  const usePresetStore = _m0_usePresetStore
  const createDefaultMapConfig = _m0_createDefaultMapConfig
  const resolveShortcutScopeHealth = _m0_resolveShortcutScopeHealth
  const createModuleStatus = _m0_createModuleStatus
  const evaluateBagStatus = _m0_evaluateBagStatus
  const evaluateCombatStatus = _m0_evaluateCombatStatus
  const evaluateCraftingStatus = _m0_evaluateCraftingStatus
  const evaluateItemsStatus = _m0_evaluateItemsStatus
  const evaluateMapStatus = _m0_evaluateMapStatus
  const evaluatePriceCheckStatus = _m0_evaluatePriceCheckStatus
  const evaluateShortcutHealth = _m0_evaluateShortcutHealth
  const evaluateShopStatus = _m0_evaluateShopStatus
  const evaluateStoryStatus = _m0_evaluateStoryStatus
  const ITEM_CRAFTING_MODE_OPTIONS = _m0_ITEM_CRAFTING_MODE_OPTIONS
  const MAP_ROLLING_METHOD_OPTIONS = _m0_MAP_ROLLING_METHOD_OPTIONS
  const RECOVERY_MODE_OPTIONS = _m0_RECOVERY_MODE_OPTIONS
  const summarizeModules = _m0_summarizeModules
  const DASHBOARD_MODULE_GROUPS = _m0_DASHBOARD_MODULE_GROUPS
  const groupDashboardModules = _m0_groupDashboardModules
  const clearCurrentScriptProcess = _m0_clearCurrentScriptProcess
  const getCurrentScriptMode = _m0_getCurrentScriptMode
  const getCurrentScriptProcess = _m0_getCurrentScriptProcess
  const setCurrentScriptProcess = _m0_setCurrentScriptProcess
test('快捷键健康状态区分注册异常与正常前台门禁暂停', () => {
  assert.deepEqual(evaluateShortcutHealth(), {
    status: 'pending',
    text: '全局快捷键等待初始化'
  })
  assert.deepEqual(evaluateShortcutHealth({ status: 'error', error: 'Alt+1 注册失败' }), {
    status: 'error',
    text: 'Alt+1 注册失败'
  })
  assert.deepEqual(evaluateShortcutHealth({ status: 'attention', error: '部分快捷键注册失败：Ctrl+D；其余快捷键可用' }), {
    status: 'attention',
    text: '部分快捷键注册失败：Ctrl+D；其余快捷键可用'
  })
  assert.deepEqual(evaluateShortcutHealth({ status: 'ready', scopeEnabled: false }), {
    status: 'ready',
    text: '全局快捷键已注册（未限制窗口）'
  })
  assert.deepEqual(evaluateShortcutHealth({
    status: 'ready',
    scopeEnabled: true,
    scopeAvailable: true,
    gameForeground: true
  }), {
    status: 'ready',
    text: '全局快捷键已注册（游戏前台）'
  })

  for (const reason of ['window-title-mismatch', 'process-name-mismatch', 'no-foreground-window']) {
    assert.deepEqual(evaluateShortcutHealth({
      status: 'ready',
      scopeEnabled: true,
      scopeAvailable: true,
      gameForeground: false,
      reason
    }), {
      status: 'ready',
      text: '快捷键已就绪（切回游戏后生效）'
    })
  }

  assert.deepEqual(evaluateShortcutHealth({
    status: 'ready',
    scopeEnabled: true,
    scopeAvailable: false,
    gameForeground: false
  }), {
    status: 'attention',
    text: '前台监视不可用，快捷键已全局生效'
  })
})

test('快捷键作用域状态同步区分部分失败、全部失败与恢复', () => {
  assert.deepEqual(resolveShortcutScopeHealth({
    enabled: true,
    available: true,
    gameForeground: true,
    registered: ['Alt+2', 'Alt+3'],
    intended: ['Alt+2', 'Alt+3', 'Ctrl+D'],
    failed: ['Ctrl+D']
  }), {
    status: 'attention',
    error: '部分快捷键注册失败：Ctrl+D；其余快捷键可用',
    failed: ['Ctrl+D']
  })

  assert.deepEqual(resolveShortcutScopeHealth({
    enabled: true,
    available: true,
    gameForeground: false,
    registered: [],
    intended: ['Alt+2', 'Alt+3', 'Ctrl+D'],
    failed: ['Ctrl+D'],
    partialFailure: true
  }), {
    status: 'attention',
    error: '部分快捷键注册失败：Ctrl+D；其余快捷键可用',
    failed: ['Ctrl+D']
  })

  assert.deepEqual(resolveShortcutScopeHealth({
    enabled: true,
    available: true,
    gameForeground: true,
    registered: [],
    intended: ['Alt+2', 'Ctrl+D'],
    failed: ['Alt+2', 'Ctrl+D']
  }), {
    status: 'error',
    error: '全局快捷键注册失败：Alt+2、Ctrl+D',
    failed: ['Alt+2', 'Ctrl+D']
  })

  assert.deepEqual(resolveShortcutScopeHealth({
    enabled: true,
    available: true,
    gameForeground: true,
    registered: ['Alt+2', 'Ctrl+D'],
    intended: ['Alt+2', 'Ctrl+D'],
    failed: []
  }), {
    status: 'ready',
    error: '',
    failed: []
  })
})

test('模块状态按异常、运行中、需配置、可用的优先级互斥判定', () => {
  assert.equal(createModuleStatus({ error: '失败', running: true, issues: ['缺配置'] }).state, 'error')
  assert.equal(createModuleStatus({ running: true, issues: ['缺配置'] }).state, 'running')
  assert.equal(createModuleStatus({ issues: ['缺配置'] }).state, 'attention')
  assert.equal(createModuleStatus({}).state, 'ready')
})

test('查价快捷键未设置时首页明确提示配置而不展示旧默认键', () => {
  const base = {
    authenticated: true,
    league: 'S29',
    catalog: { degraded: false }
  }
  const missing = evaluatePriceCheckStatus(base)
  assert.equal(missing.state, 'attention')
  assert.ok(missing.issues.includes('请先设置查价快捷键'))
  assert.doesNotMatch(missing.description, /Ctrl\+D/)

  const configured = evaluatePriceCheckStatus({ ...base, shortcut: 'F8' })
  assert.equal(configured.state, 'ready')
  assert.match(configured.description, /F8/)
})

test('制作和地图区分共享脚本归属并保留互斥占用说明', () => {
  const validation = { isValid: true, errors: [] }
  const items = evaluateItemsStatus({
    validation,
    scriptRunning: true,
    scriptMode: 'items'
  })
  const map = evaluateMapStatus({
    validation,
    scriptRunning: true,
    scriptMode: 'items'
  })
  assert.equal(items.state, 'running')
  assert.equal(map.state, 'ready')
  assert.match(map.statusText, /制作模块占用/)
})

test('首页快捷配置使用真实制作方式和回复模式枚举', () => {
  assert.deepEqual(ITEM_CRAFTING_MODE_OPTIONS, [
    { value: 'alteration', label: '改造石模式' },
    { value: 'chaos', label: '混沌石模式' },
    { value: 'alchemy', label: '点金石模式' }
  ])
  assert.deepEqual(MAP_ROLLING_METHOD_OPTIONS, [
    { value: 'alchemy', label: '点金石' },
    { value: 'chaos', label: '混沌石' }
  ])
  assert.deepEqual(RECOVERY_MODE_OPTIONS, [
    { value: 'duration', label: '持续回复' },
    { value: 'instant', label: '立即回复' }
  ])
})

test('首页切换物品、地图和航海海图配置只修改各自当前预设并持久化', t => {
  const prevLocalStorage = globalThis.localStorage
  t.after(() => { if (prevLocalStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = prevLocalStorage })
  const values = new Map()
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  }
  setActivePinia(createPinia())
  const store = usePresetStore()
  const itemPreset = store.addItemPreset('点金装备')
  const mapPreset = store.addMapPreset('混沌地图')
  const chartPreset = store.addChartPreset('混沌海图')

  store.switchItemPreset(itemPreset.id)
  store.updateCurrentItemPreset({
    moduleTwo: { ...store.currentItemPreset.moduleTwo, mode: 'alchemy' }
  })
  store.switchMapPreset(mapPreset.id)
  store.updateCurrentMapPreset({
    map: { ...store.currentMapPreset.map, method: 'chaos' }
  })
  store.switchChartPreset(chartPreset.id)
  store.updateCurrentChartPreset({
    chart: { ...store.currentChartPreset.chart, method: 'chaos' }
  })
  store.setMapRollingKind('chart')

  assert.equal(store.currentItemPreset.moduleTwo.mode, 'alchemy')
  assert.equal(store.itemPresets.find(preset => preset.id === 'default').moduleTwo.mode, 'alteration')
  assert.equal(store.currentMapPreset.map.method, 'chaos')
  assert.equal(store.mapPresets.find(preset => preset.id === 'default').map.method, 'alchemy')
  assert.equal(store.currentChartPreset.chart.method, 'chaos')
  assert.equal(store.chartPresets.find(preset => preset.id === 'default').chart.method, 'alchemy')
  assert.equal(store.mapRollingKind, 'chart')
  assert.equal(store.mapPresets.some(preset => preset.id === chartPreset.id), false)
  assert.equal(store.chartPresets.some(preset => preset.id === mapPreset.id), false)

  setActivePinia(createPinia())
  const restored = usePresetStore()
  assert.equal(restored.currentItemPresetId, itemPreset.id)
  assert.equal(restored.currentItemPreset.moduleTwo.mode, 'alchemy')
  assert.equal(restored.currentMapPresetId, mapPreset.id)
  assert.equal(restored.currentMapPreset.map.method, 'chaos')
  assert.equal(restored.currentChartPresetId, chartPreset.id)
  assert.equal(restored.currentChartPreset.chart.method, 'chaos')
  assert.equal(restored.mapRollingKind, 'chart')
})

test('过渡版本嵌套海图配置拆分为独立预设并清理地图预设', t => {
  const prevLocalStorage = globalThis.localStorage
  t.after(() => { if (prevLocalStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = prevLocalStorage })
  const values = new Map([
    ['mapPresets', JSON.stringify([{
      id: 'default',
      name: '旧默认',
      map: {
        ...createDefaultMapConfig(),
        activeKind: 'chart',
        chart: { method: 'chaos', match: { blacklist: ['中毒'] } }
      }
    }])],
    ['currentMapPresetId', 'default']
  ])
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  }
  setActivePinia(createPinia())
  const store = usePresetStore()

  assert.equal(store.mapRollingKind, 'chart')
  assert.equal(store.currentChartPreset.name, '旧默认')
  assert.equal(store.currentChartPreset.chart.method, 'chaos')
  assert.deepEqual(store.currentChartPreset.chart.match.blacklist, ['中毒'])
  assert.equal('chart' in store.currentMapPreset.map, false)
  assert.equal('activeKind' in store.currentMapPreset.map, false)

  const savedMaps = JSON.parse(values.get('mapPresets'))
  const savedCharts = JSON.parse(values.get('chartPresets'))
  assert.equal('chart' in savedMaps[0].map, false)
  assert.equal(savedCharts[0].chart.method, 'chaos')
})

test('背包、战斗和剧情覆盖配置、运行与异常状态', () => {
  const bag = evaluateBagStatus({ configError: '缺少模板', stashedSlots: 12 })
  assert.equal(bag.state, 'attention')
  assert.deepEqual(bag.metrics, [])
  assert.match(bag.description, /背包入库/)
  assert.doesNotMatch(bag.description, /永火接收舱/)
  assert.equal(evaluateBagStatus({ moduleEnabled: true, isDetecting: true, isMatched: true }).state, 'running')
  assert.equal(evaluateBagStatus({
    moduleEnabled: true,
    isDetecting: false,
    lastStopReason: '进程异常退出'
  }).state, 'error')

  assert.equal(evaluateCombatStatus({
    validation: { errors: [] },
    running: true,
    focused: false
  }).statusText, '被动喝药 · 等待游戏窗口')
  assert.equal(evaluateCombatStatus({
    validation: { errors: [] },
    loopRunning: true,
    loopFocused: true
  }).statusText, '主动循环 · 游戏窗口前台')
  assert.equal(evaluateCombatStatus({
    validation: { errors: [] },
    running: true,
    focused: true,
    loopRunning: true,
    loopFocused: true
  }).statusText, '被动喝药 + 主动循环 · 游戏窗口前台')
  assert.equal(evaluateCombatStatus({
    validation: { errors: [] },
    lastError: '后台失败'
  }).state, 'error')

  assert.equal(evaluateStoryStatus({ chapters: [] }).state, 'attention')
  assert.equal(evaluateStoryStatus({
    chapters: [{ name: '第一章', steps: [{ text: '前往海滩' }] }],
    currentChapter: { name: '第一章' },
    currentStep: { text: '前往海滩' },
    overlayVisible: true
  }).state, 'running')
})

test('商城配方状态覆盖配置、快照、运行和异常优先级', () => {
  const readyInput = {
    authenticated: true,
    league: 'S29',
    selectedTabCount: 2,
    snapshot: {},
    activeRecipeLabel: '混沌石',
    activeRecipeKind: 'set',
    fullSetCount: 3,
    rewardTotal: 6
  }
  const ready = evaluateShopStatus({ ...readyInput, regex: '' })
  assert.equal(ready.state, 'ready')
  assert.equal(ready.title, '配方')
  assert.deepEqual(ready.metrics, [
    { label: '可取数量', value: '3 套' },
    { label: '预计奖励', value: 6 }
  ])
  assert.equal(evaluateShopStatus({}).state, 'attention')
  assert.equal(evaluateShopStatus({ ...readyInput, snapshot: null }).statusText, '尚未刷新商城配方仓库数据')
  assert.equal(evaluateShopStatus({ ...readyInput, enabled: true }).state, 'running')
  assert.equal(evaluateShopStatus({
    ...readyInput,
    automationStatus: 'paused'
  }).statusText, '自动取件已暂停 · 混沌石')
  assert.equal(evaluateShopStatus({
    ...readyInput,
    enabled: true,
    error: '运行时失败'
  }).state, 'error')
  assert.equal(evaluateShopStatus({
    ...readyInput,
    automationEvent: 'error',
    automationError: '自动取件失败'
  }).statusText, '自动取件失败')
  assert.equal(evaluateShopStatus({
    ...readyInput,
    activeRecipeKind: 'single',
    candidateCount: 4
  }).metrics[0].value, '4 件')

  const deferredCrafting = evaluateCraftingStatus({ status: null })
  assert.equal(deferredCrafting.state, 'ready')
  assert.equal(deferredCrafting.statusText, '首次进入时加载')
  assert.deepEqual(deferredCrafting.metrics[0], { label: '数据版本', value: '按需加载' })
  assert.equal(evaluateCraftingStatus({ status: null, updateError: '模拟数据损坏' }).state, 'error')
  assert.equal(evaluateCraftingStatus({
    status: { source: 'builtin', manifest: { patch: '3.28' } },
    session: { id: 'session' }
  }).statusText, '存在进行中的模拟会话')
})

test('八模块汇总每张卡只计入一个类别', () => {
  const modules = [
    createModuleStatus({ error: 'x' }),
    createModuleStatus({ running: true }),
    createModuleStatus({ issues: ['x'] }),
    createModuleStatus({}),
    createModuleStatus({}),
    createModuleStatus({}),
    createModuleStatus({ running: true }),
    createModuleStatus({ issues: ['x'] })
  ]
  assert.deepEqual(summarizeModules(modules), { error: 1, running: 2, attention: 2, ready: 3 })
})

test('首页仅按检测、制造分组且排除其他模块', () => {
  const modules = ['items', 'bag', 'map', 'combat', 'story', 'shop', 'priceCheck', 'crafting']
    .map(id => ({ id }))
  const groups = groupDashboardModules(modules)

  assert.deepEqual(
    DASHBOARD_MODULE_GROUPS.map(group => group.title),
    ['检测', '制造']
  )
  assert.deepEqual(
    groups.map(group => group.modules.map(module => module.id)),
    [
      ['bag', 'combat', 'shop', 'priceCheck'],
      ['map', 'items']
    ]
  )
  assert.equal(new Set(groups.flatMap(group => group.modules)).size, modules.length - 2)
})

test('共享脚本进程状态保存并清除运行类型', () => {
  const process = { pid: 321 }
  setCurrentScriptProcess(process, 'map')
  assert.equal(getCurrentScriptProcess(), process)
  assert.equal(getCurrentScriptMode(), 'map')
  clearCurrentScriptProcess()
  assert.equal(getCurrentScriptProcess(), null)
  assert.equal(getCurrentScriptMode(), null)
})

test('首页路由、侧栏入口和脚本生命周期桥接已接入', () => {
  const router = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
  const sidebar = readFileSync(new URL('../src/components/Layout/Sidebar.vue', import.meta.url), 'utf8')
  const catalog = readFileSync(new URL('../src/features/featureCatalog.js', import.meta.url), 'utf8')
  const preload = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
  const ipc = readFileSync(new URL('../electron/modules/ipc/python.js', import.meta.url), 'utf8')

  assert.match(router, /path: '\/',[\s\S]*name: 'Dashboard'/)
  assert.match(sidebar, /index="\/"[\s\S]*首页/)
  assert.match(sidebar, /overflow-y: auto/)
  assert.doesNotMatch(sidebar, /\b\w*Filled\b/)
  assert.match(sidebar, /featureStore\.enabledNavigationFeatures/)
  assert.match(catalog, /id: 'bag'[\s\S]*route: '\/bag'[\s\S]*icon: 'SuitcaseLine'/)
  assert.match(catalog, /id: 'craft-planner'[\s\S]*route: '\/craft-planner'[\s\S]*icon: 'SetUp'/)
  assert.match(catalog, /id: 'puzzle'[\s\S]*route: '\/puzzle'[\s\S]*icon: 'Guide'/)
  assert.match(preload, /onScriptStatusChanged/)
  assert.match(ipc, /script-status-changed/)
  assert.match(ipc, /status: 'running'/)
})

test('首页通用快捷控件接入物品、地图、战斗与商城状态源', () => {
  const dashboard = readFileSync(new URL('../src/domains/dashboard/useDashboard.js', import.meta.url), 'utf8')
  const card = readFileSync(
    new URL('../src/domains/dashboard/components/ModuleStatusCard.vue', import.meta.url),
    'utf8'
  )

  assert.match(dashboard, /useChaosRecipeStore/)
  assert.match(dashboard, /buildVendorRecipeOptions/)
  assert.match(dashboard, /setActiveRecipe/)
  assert.match(dashboard, /chaosRecipeStore\.refresh/)
  assert.match(dashboard, /chaosRecipeStore\.setEnabled/)
  assert.match(dashboard, /id: 'item-preset'/)
  assert.match(dashboard, /id: 'item-mode'/)
  assert.match(dashboard, /id: 'map-preset'/)
  assert.match(dashboard, /id: 'map-method'/)
  assert.match(dashboard, /id: 'health-mode'/)
  assert.match(dashboard, /id: 'health-enabled'/)
  assert.match(dashboard, /id: 'mana-mode'/)
  assert.match(dashboard, /id: 'mana-enabled'/)
  assert.match(dashboard, /settingsStore\.updateCombatAssist/)
  assert.match(dashboard, /scriptStore\.mode === 'items'/)
  assert.match(dashboard, /scriptStore\.mode === 'map'/)
  assert.match(dashboard, /const disabled = modulePending/)
  assert.doesNotMatch(dashboard, /modulePending \|\| combatStore\.running/)
  assert.doesNotMatch(dashboard, /generateVendorRegex|复制正则|shopResult/)
  assert.doesNotMatch(dashboard, /itemModes|enabledModes/)
  assert.doesNotMatch(card, /module\.selector/)
  assert.match(card, /module\.controls/)
  assert.match(card, /control\.type === 'switch'/)
  assert.match(card, /@change="\$emit\('control', module, control, \$event\)"/)
})

test('首页账号健康状态声明并初始化所读取的账号状态源', () => {
  const dashboard = readFileSync(new URL('../src/domains/dashboard/useDashboard.js', import.meta.url), 'utf8')

  assert.match(dashboard, /import \{ usePoeAccountStore \} from '@\/stores\/poeAccount'/)
  assert.match(dashboard, /const accountStore = usePoeAccountStore\(\)/)
  assert.match(dashboard, /authenticated: accountStore\.status\.authenticated/)
})

test('首页存取卡片使用三个开关分别启停入库与取件功能（永火接收舱已移入过期赛季）', () => {
  const dashboard = readFileSync(new URL('../src/domains/dashboard/useDashboard.js', import.meta.url), 'utf8')
  const card = readFileSync(
    new URL('../src/domains/dashboard/components/ModuleStatusCard.vue', import.meta.url),
    'utf8'
  )
  const bagControls = dashboard.slice(
    dashboard.indexOf("if (module.id === 'bag')", dashboard.indexOf('function controlsFor')),
    dashboard.indexOf("if (module.id === 'items')", dashboard.indexOf('function controlsFor'))
  )
  const actionsFor = dashboard.slice(dashboard.indexOf('function actionsFor'), dashboard.indexOf('async function runAction'))

  assert.match(dashboard, /useStashPickupStore/)
  assert.match(dashboard, /useJunfengStore/)
  assert.doesNotMatch(dashboard, /setAllflameReceiverEnabled/)
  for (const label of ['背包入库', '仓库取件', '君锋镇取件']) {
    assert.match(bagControls, new RegExp(`label: '${label}'`))
  }
  assert.doesNotMatch(bagControls, /永火接收舱/)
  assert.equal([...bagControls.matchAll(/type: 'switch'/g)].length, 3)
  assert.match(bagControls, /value: bagStore\.moduleEnabled/)
  assert.match(bagControls, /value: stashPickupStore\.settings\.enabled/)
  assert.match(bagControls, /value: junfengStore\.settings\.enabled/)
  assert.match(bagControls, /setBagModuleEnabled\(value\)/)
  assert.match(bagControls, /stashPickupStore\.setEnabled\(value\)/)
  assert.match(bagControls, /junfengStore\.setEnabled\(value\)/)
  assert.doesNotMatch(actionsFor, /module\.id === 'bag'/)
  assert.match(card, /\.quick-controls \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/)
})

test('首页模块卡片的单项快捷控件占满宽度且操作区底部对齐', () => {
  const card = readFileSync(
    new URL('../src/domains/dashboard/components/ModuleStatusCard.vue', import.meta.url),
    'utf8'
  )

  assert.match(card, /\.module-card \{[\s\S]*?display: flex;[\s\S]*?flex-direction: column;/)
  assert.match(card, /\.module-card :deep\(\.el-card__body\) \{[\s\S]*?display: flex;[\s\S]*?flex: 1;[\s\S]*?flex-direction: column;/)
  assert.match(card, /\.quick-control:only-child \{ grid-column: 1 \/ -1; \}/)
  assert.match(card, /\.card-actions \{[\s\S]*?margin-top: auto;/)
})

test('首页使用单一紧凑汇总带并以文字和图标表达模块状态', () => {
  const dashboard = readFileSync(new URL('../src/domains/dashboard/DashboardView.vue', import.meta.url), 'utf8')
  const card = readFileSync(new URL('../src/domains/dashboard/components/ModuleStatusCard.vue', import.meta.url), 'utf8')
  const skeleton = readFileSync(new URL('../src/domains/dashboard/DashboardRouteView.vue', import.meta.url), 'utf8')

  assert.match(dashboard, /class="summary-band"/)
  assert.match(dashboard, /aria-label="模块状态汇总"/)
  assert.match(dashboard, /class="health-panel"/)
  assert.doesNotMatch(dashboard, />前往设置<|@click="openSettings"/)
  const details = readFileSync(new URL('../src/domains/dashboard/components/DashboardStatusDialog.vue', import.meta.url), 'utf8')
  assert.match(details, /v-else-if="item\.action"/)
  assert.match(details, /\$emit\('open-health', item\.action\)/)
  assert.match(dashboard, /openAfterDetailsClose\(\(\) => openHealthAction\(action\)\)/)
  assert.match(details, /class="status-detail-content"/)
  assert.match(details, /class="status-detail-action"/)
  assert.match(dashboard, /openHelp: topicId => emit\('open-health-help', topicId\)/)
  for (const label of ['异常', '运行中', '需配置', '可用']) assert.match(card, new RegExp(label))
  assert.match(card, /<el-tag[^>]*>\{\{ stateLabel \}\}<\/el-tag>/)
  assert.match(card, /<strong>\{\{ module\.statusText \}\}<\/strong>/)
  assert.match(skeleton, /class="summary-band-skeleton"/)
  assert.match(skeleton, /@open-health-help="openHealthHelp"/)
  assert.match(skeleton, /ref="helpDrawer"/)
  assert.match(skeleton, /helpDrawer\.value\?\.open\(topicId\)/)
  assert.match(dashboard, /<el-row class="module-grid app-grid" :gutter="16">/)
  assert.match(dashboard, /<el-col v-for="module in group\.modules"[^>]*:xs="24" :sm="12" :md="8">/)
})

test('游戏显示模式健康项随游戏窗口状态推送自动更新', () => {
  const dashboard = readFileSync(new URL('../src/domains/dashboard/useDashboard.js', import.meta.url), 'utf8')
  const store = readFileSync(new URL('../src/domains/settings/settingsStore.js', import.meta.url), 'utf8')
  const service = readFileSync(new URL('../src/utils/scriptService.js', import.meta.url), 'utf8')
  const runtime = readFileSync(new URL('../src/startup/mainRuntime.js', import.meta.url), 'utf8')

  assert.match(store, /async function refreshGameDisplayMode\(\)/)
  assert.match(store, /const result = await electronApi\.system\.detectGameDpi\(\)\s*primaryDpiScale\.value = normalizeDpiScale/)
  assert.match(service, /onScopeChanged\(\(state\) => \{[\s\S]*?refreshGameDisplayMode\(\)/)
  assert.match(dashboard, /settingsStore\.refreshGameDisplayMode\(\)/)
  assert.match(dashboard, /describeGameDisplayMode\(settingsStore\.gameDisplayMode\)/)
  assert.match(dashboard, /settingsStore\.dpiDetectionStatus === 'detecting'/)
  assert.match(dashboard, /displayModeStatus && item\.id === 'gameDisplayMode'/)
  assert.doesNotMatch(dashboard, /settingsStore\.refreshDpiScale\(\)/)
  assert.match(runtime, /if \(settingsStore\.dpiMode === 'auto'\) void settingsStore\.refreshDpiScale\(\)/)
})
})()

// === Merged from detailPageStartActions.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFileSync = _m1_readFileSync
function source(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

test('物品制作详情页复用制作启动服务并阻止重复或并行启动', () => {
  const view = source('../src/domains/items/components/ModuleOne.vue')

  assert.match(view, /import \{ commitGlobalShortcut, startCrafting \} from ['"]\.\.\/\.\.\/\.\.\/utils\/scriptService['"]/)
  assert.match(view, /const starting = ref\(false\)/)
  assert.match(view, /const isCurrentModeRunning = computed\(\(\) => scriptStore\.isRunning && scriptStore\.mode === 'items'\)/)
  assert.match(view, /:loading="starting"/)
  assert.match(view, /:disabled="starting \|\| scriptStore\.isRunning \|\| !canUseGameInput\('items'\)"/)
  assert.match(view, /import \{ currentServer, canUseGameInput \} from ['"]@\/utils\/serverContext\.js['"]/)
  assert.match(view, /\{\{ isCurrentModeRunning \? '运行中' : '启动' \}\}/)
  assert.match(view, /async function handleStart\(\)[\s\S]*starting\.value = true[\s\S]*await startCrafting\(\{ craftingKind: 'general' \}\)[\s\S]*starting\.value = false/)
})

test('物品制作页顶部提供被制作物品坐标并复用持久化取点流程', () => {
  const view = source('../src/domains/items/components/ModuleOne.vue')
  const help = source('../src/domains/help/helpContent.js')

  assert.match(view, /<label class="form-label">被制作物品位置<\/label>/)
  assert.doesNotMatch(view, /此坐标是游戏中被制作物品所在的位置|class="position-help"/)
  assert.match(view, /<CoordinateConfigurationField[\s\S]*:model-value="itemPosition"[\s\S]*@update:model-value="updateItemPosition"[\s\S]*@pick="pickItemPosition"/)
  assert.match(view, /const itemPosition = ref\(\{ \.\.\.settingsStore\.itemPosition \}\)/)
  assert.match(view, /watch\(\(\) => settingsStore\.itemPosition,[\s\S]*itemPosition\.value = \{ \.\.\.value \}/)
  assert.match(view, /settingsStore\.updateItemPosition\(itemPosition\.value\)/)
  assert.match(help, /prerequisite: '单件模式需配置物品位置；批量模式需配置原生背包网格，并由用户自行打开角色背包和通货页面后手动扫描。/)

  const pickStart = view.indexOf('async function pickItemPosition()')
  const pickEnd = view.indexOf('async function handleSave', pickStart)
  const pick = view.slice(pickStart, pickEnd)
  assert.match(pick, /if \(itemPositionPicking\.value\) return/)
  assert.match(pick, /if \(!result \|\| result\.canceled\) return/)
  assert.match(pick, /if \(result\.success === false\) throw new Error/)
  assert.ok(pick.indexOf('result.canceled') < pick.indexOf('updateItemPosition(point)'))
  assert.match(pick, /finally \{\s*itemPositionPicking\.value = false/)
})

test('地图制作详情页复用地图启动服务并阻止重复或并行启动', () => {
  const view = source('../src/domains/map/MapView.vue')

  assert.match(view, /import \{ commitGlobalShortcut, startMapRolling \} from ['"]@\/utils\/scriptService['"]/)
  assert.match(view, /const starting = ref\(false\)/)
  assert.match(view, /const isCurrentModeRunning = computed\(\(\) => scriptStore\.isRunning && scriptStore\.mode === 'map'\)/)
  assert.match(view, /:loading="starting"/)
  assert.match(view, /:disabled="starting \|\| scriptStore\.isRunning \|\| !canUseGameInput\('map'\) \|\| \(currentServer\.id === 'international' && activeKind === 'chart'\)"/)
  assert.match(view, /import \{ currentServer, canUseGameInput \} from ['"]@\/utils\/serverContext\.js['"]/)
  assert.match(view, /\{\{ isCurrentModeRunning \? '运行中' : '启动' \}\}/)
  assert.match(view, /async function handleStart\(\)[\s\S]*starting\.value = true[\s\S]*await startMapRolling\(\)[\s\S]*starting\.value = false/)
})
})()

// === Merged from featureModuleRepository.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const FEATURE_MODULE_STORAGE_KEY = _m2_FEATURE_MODULE_STORAGE_KEY
  const availableFeatureCatalog = _m2_availableFeatureCatalog
  const availableNavigationFeatureCatalog = _m2_availableNavigationFeatureCatalog
  const featureForRoute = _m2_featureForRoute
  const filterFeatureShortcuts = _m2_filterFeatureShortcuts
  const shortcutFeatureId = _m2_shortcutFeatureId
  const normalizeFeatureModuleState = _m2_normalizeFeatureModuleState
  const readFeatureModuleState = _m2_readFeatureModuleState
  const saveFeatureModuleState = _m2_saveFeatureModuleState
function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    dump: () => Object.fromEntries(values)
  }
}

test('功能目录保持正式顺序且开发与正式版均不保留模型训练入口', () => {
  const production = availableFeatureCatalog()
  const development = availableFeatureCatalog({ development: true })
  assert.deepEqual(development.filter(item => item.developmentOnly), [])
  assert.equal(production.some(item => item.id === 'highlight-model-training'), false)
  assert.equal(development.some(item => item.id === 'highlight-model-training'), false)
  assert.deepEqual(production.map(item => item.route), [
    '/items', '/bag', '/map', null, '/combat', '/story', '/regex', '/recipe',
    '/craft-planner', '/price-check', '/faustus', '/puzzle', '/sanctum', '/tools', '/pob-export'
  ])
  assert.equal(production.find(item => item.id === 'map-tracker')?.navigation, false)
  assert.equal(availableNavigationFeatureCatalog().some(item => item.id === 'map-tracker'), false)
  assert.equal(new Set(availableNavigationFeatureCatalog().map(item => item.route)).size, availableNavigationFeatureCatalog().length)
  assert.equal(featureForRoute('/shop')?.id, 'recipe')
  assert.equal(shortcutFeatureId('storyNext'), 'story')
  assert.equal(shortcutFeatureId('itemContextMenu'), null)
  assert.equal(shortcutFeatureId('mapTrackerKills'), null)
})

test('功能偏好默认全部启用且损坏记录安全回退', () => {
  assert.deepEqual(readFeatureModuleState(memoryStorage()), { version: 1, disabledFeatureIds: [] })
  assert.deepEqual(readFeatureModuleState(memoryStorage({ [FEATURE_MODULE_STORAGE_KEY]: '{bad' })), { version: 1, disabledFeatureIds: [] })
  assert.deepEqual(normalizeFeatureModuleState({ version: 9, disabledFeatureIds: ['items'] }), { version: 1, disabledFeatureIds: [] })
})

test('功能偏好去重、忽略未知项且未来功能默认启用', () => {
  const normalized = normalizeFeatureModuleState({
    version: 1,
    disabledFeatureIds: ['items', 'unknown-future', 'items', 42]
  })
  assert.deepEqual(normalized.disabledFeatureIds, ['items'])
  assert.equal(normalized.disabledFeatureIds.includes('tools'), false)
  const storage = memoryStorage()
  assert.equal(saveFeatureModuleState(normalized, storage), true)
  assert.deepEqual(JSON.parse(storage.dump()[FEATURE_MODULE_STORAGE_KEY]), normalized)
})

test('快捷键仅保留启用模块和全局紧急停止', () => {
  const shortcuts = { itemStart: 'F6', mapStart: 'F7', end: 'Alt+3', priceCheck: 'F8' }
  assert.deepEqual(filterFeatureShortcuts(shortcuts, id => id !== 'items' && id !== 'price-check'), {
    mapStart: 'F7',
    end: 'Alt+3'
  })
})
})()

// === Merged from featureModuleStore.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const createPinia = _m3_createPinia
  const serverContext = _m3_serverContext
  const currentServer = _m3_currentServer
  const useFeatureModulesStore = _m3_useFeatureModulesStore
  const enableFeatureModule = _m3_enableFeatureModule
  const registerFeatureRuntimeAdapter = _m3_registerFeatureRuntimeAdapter
  const setFeatureShortcutSynchronizer = _m3_setFeatureShortcutSynchronizer
test('国际服未适配模块仅出现在未适配列表，不能启用或恢复后台任务', async t => {
  const originalServer = { ...currentServer }
  Object.assign(currentServer, serverContext('international'))
  t.after(() => { Object.assign(currentServer, originalServer); setFeatureShortcutSynchronizer(null) })
  const store = useFeatureModulesStore(createPinia())
  assert.deepEqual(store.unsupportedFeatures.map(item => item.id), ['craft-planner', 'puzzle'])
  for (const id of ['craft-planner', 'puzzle']) {
    assert.equal(store.enabledFeatures.some(item => item.id === id), false)
    assert.equal(store.enabledNavigationFeatures.some(item => item.id === id), false)
    assert.equal(store.disabledFeatures.some(item => item.id === id), false)
    assert.equal(store.isEnabled(id), false)
    assert.equal(store.enable(id), false)
    store.disable(id)
    const disabledBefore = [...store.disabledFeatureIds]
    const calls = []
    const remove = registerFeatureRuntimeAdapter(id, { resume: () => calls.push('resume') })
    t.after(remove)
    setFeatureShortcutSynchronizer(() => calls.push('shortcuts'))
    assert.equal((await enableFeatureModule(id, { store })).success, false)
    assert.deepEqual(calls, [])
    assert.deepEqual(store.disabledFeatureIds, disabledBefore)
  }
  store.disable('items')
  assert.equal(store.disabledFeatures.some(item => item.id === 'items'), true)
  assert.equal((await enableFeatureModule('items', { store })).success, true)
  assert.equal(store.isEnabled('items'), true)
  assert.equal((await enableFeatureModule('items', { store })).success, true, '重复添加保持成功')

  Object.assign(currentServer, serverContext('cn'))
  const cnStore = useFeatureModulesStore(createPinia())
  assert.deepEqual(cnStore.unsupportedFeatures, [])
  for (const id of ['craft-planner', 'puzzle']) assert.equal(cnStore.isEnabled(id), true)
})
})()

// === Merged from generateItemFootprints.test.js ===
await (async () => {
  const assert = _m4_assert
  const test = _m4_test
  const buildItemFootprintCatalog = _m4_buildItemFootprintCatalog
  const parseRepoeVersion = _m4_parseRepoeVersion
  const validateItemFootprintCatalog = _m4_validateItemFootprintCatalog
const base = (name, itemClass, width, height, releaseState = 'released') => ({
  name,
  item_class: itemClass,
  inventory_width: width,
  inventory_height: height,
  release_state: releaseState
})

function fixture(overrides = {}) {
  return {
    gameVersion: '3.29',
    repoeVersion: '3.29.3.1.2',
    generatedAt: '2026-08-13T00:00:00.000Z',
    expectedCraftingBases: 3,
    sources: [{ id: 'fixture', version: '3.29', sha256: 'a'.repeat(64) }],
    craftingDataset: {
      manifest: { patch: '3.29' },
      bases: [
        { sourceId: 'Crude_Bow', itemClass: 'Bow', name: '粗制弓' },
        { sourceId: 'Long_Bow', itemClass: 'Bow', name: '长弓' },
        { sourceId: 'Maelstr%C3%B6m_Staff', itemClass: 'Staff', name: '朽木之干' }
      ]
    },
    repoeBaseItems: {
      'Metadata/Bow1': base('Crude Bow', 'Bow', 2, 3),
      'Metadata/Bow2': base('Long Bow', 'Bow', 2, 4),
      'Metadata/Staff1': base('Maelström Staff', 'Staff', 1, 4),
      'Metadata/Map1': base('Beach Map', 'Map', 1, 1),
      'Metadata/Map2': base('Dunes Map', 'Map', 1, 1),
      'Metadata/CurrencyA': base('Large Token', 'StackableCurrency', 1, 1),
      'Metadata/CurrencyB': base('Large Token Copy', 'StackableCurrency', 2, 2)
    },
    localizedBaseItems: {
      'Metadata/Bow1': base('粗製弓', 'Bow', 2, 3),
      'Metadata/Bow2': base('長弓', 'Bow', 2, 4),
      'Metadata/Staff1': base('朽木之幹', 'Staff', 1, 4),
      'Metadata/Map1': base('濱海地圖', 'Map', 1, 1),
      'Metadata/CurrencyA': base('歧義通貨', 'StackableCurrency', 1, 1),
      'Metadata/CurrencyB': base('歧義通貨', 'StackableCurrency', 2, 2)
    },
    localizedItemClasses: {
      Bow: { name: '弓', category: '弓', category_id: 'Bow' },
      Staff: { name: '長杖', category: '長杖', category_id: 'Staff' },
      Map: { name: '地圖', category: '地圖', category_id: 'Map' },
      StackableCurrency: { name: '通貨', category: '通貨', category_id: 'Currency' }
    },
    officialItemsPayload: {
      result: [{ entries: [
        { type: '粗制弓' }, { type: '长弓' }, { type: '朽木之干' },
        { type: '滨海地图' }, { type: '歧义通货' }
      ] }]
    },
    toSimplified: (value) => String(value || '')
      .replaceAll('製', '制').replaceAll('長', '长').replaceAll('幹', '干')
      .replaceAll('濱', '滨').replaceAll('圖', '图').replaceAll('義', '义'),
    ...overrides
  }
}

test('解析并校验 RePoE 3.29 版本', () => {
  assert.equal(parseRepoeVersion('<title>RePoE - PoE version 3.29.3.1.2</title>'), '3.29.3.1.2')
  assert.throws(() => parseRepoeVersion('<title>RePoE</title>'), /无法识别/)
})

test('生成器优先关联做装 ID，补充官方交集并剔除歧义尺寸', () => {
  const catalog = buildItemFootprintCatalog(fixture())
  assert.equal(catalog.audit.craftingResolved, 3)
  assert.ok(catalog.items.some((entry) => entry.name === '粗制弓' && entry.width === 2 && entry.height === 3))
  assert.ok(catalog.items.some((entry) => entry.name === '长弓' && entry.width === 2 && entry.height === 4))
  assert.ok(catalog.items.some((entry) => entry.name === '朽木之干' && entry.width === 1 && entry.height === 4))
  assert.ok(catalog.items.some((entry) => entry.name === '滨海地图' && entry.width === 1 && entry.height === 1))
  assert.equal(catalog.items.some((entry) => entry.name === '歧义通货'), false)
  const aliases = catalog.categories.flatMap((entry) => entry.aliases)
  assert.ok(aliases.includes('地图'))
  assert.equal(aliases.includes('弓'), false)
  assert.equal(aliases.includes('长杖'), true)
})

test('生成器拒绝版本错配、做装缺项和最终目录重复身份', () => {
  assert.throws(() => buildItemFootprintCatalog(fixture({ repoeVersion: '3.28.0.16' })), /RePoE 与目标游戏版本不一致/)
  assert.throws(() => buildItemFootprintCatalog(fixture({ expectedCraftingBases: 4 })), /做装基底数量异常/)
  const catalog = buildItemFootprintCatalog(fixture())
  catalog.items.push({ ...catalog.items[0] })
  assert.throws(() => validateItemFootprintCatalog(catalog, 3), /重复物品占位/)
})
})()

// === Merged from helpContent.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const existsSync = _m5_existsSync
  const readFileSync = _m5_readFileSync
  const CRAFTING_TOPICS = _m5_CRAFTING_TOPICS
  const FAQ_TOPICS = _m5_FAQ_TOPICS
  const GENERAL_TOPICS = _m5_GENERAL_TOPICS
  const MODULE_TOPICS = _m5_MODULE_TOPICS
  const moduleHelpTopicsById = _m5_moduleHelpTopicsById
  const moduleTopicById = _m5_moduleTopicById
const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const topicText = topic => [
  topic.title,
  topic.summary,
  ...(topic.blocks || []).map(block => Array.isArray(block.items) ? block.items.join(' ') : String(block.text || ''))
].join(' ')

test('帮助专题使用唯一稳定 ID 并保留标题摘要', () => {
  const beginnerTopics = MODULE_TOPICS.flatMap(topic => moduleHelpTopicsById(topic.id.slice('module-'.length)).slice(1))
  const topics = [...GENERAL_TOPICS, ...MODULE_TOPICS, ...beginnerTopics, ...FAQ_TOPICS, ...CRAFTING_TOPICS]
  const ids = topics.map(topic => topic.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const topic of topics) {
    assert.ok(topic.title && topic.summary)
    assert.ok(topicText(topic).includes(topic.title))
  }
})

test('模块指南覆盖全部侧栏业务路由', () => {
  assert.deepEqual(
    MODULE_TOPICS.map(topic => topic.route),
    ['/', '/items', '/bag', '/map', '/combat', '/story', '/regex', '/recipe', '/craft-planner', '/price-check', '/puzzle', '/tools', '/settings']
  )
  for (const topic of MODULE_TOPICS) {
    assert.ok(topic.module.purpose)
    assert.ok(topic.module.prerequisite)
    assert.ok(topic.module.steps.length >= 3, `${topic.id} 应提供完整操作步骤`)
    assert.ok(topic.module.steps.every(step => typeof step === 'string' && step.trim()), `${topic.id} 步骤不能为空`)
    assert.ok(topic.module.risk)
  }
  assert.equal(MODULE_TOPICS.length, 13)
})

test('moduleTopicById 按 id 返回模块主题', () => {
  assert.equal(moduleTopicById('items')?.id, 'module-items')
  assert.equal(moduleTopicById('settings')?.route, '/settings')
  assert.equal(moduleTopicById('tools')?.route, '/tools')
  assert.equal(moduleTopicById('unknown'), null)
})

test('moduleHelpTopicsById 返回稳定有序的新手主题集合', () => {
  const requiredSections = ['首次使用前准备', '操作步骤', '如何判断成功', '停止与恢复', '常见问题', '安全边界', '术语']
  const expectedKeywords = {
    dashboard: ['需要关注', '模块卡片', '全局紧急停止'],
    items: ['物品预设', '词缀组合', '通货坐标'],
    bag: ['背包安全入库', '物品黑名单', '君锋镇取出高亮'],
    map: ['异界地图', '航海海图', '黑名单词缀', '符合条件存仓'],
    combat: ['检测间隔', '被动喝药', '主动喝药', '一键回城'],
    story: ['剧情预设', '技能预设', '剧情浮窗'],
    regex: ['商城正则', '地图正则', '复制正则'],
    recipe: ['商城配方', '仓库快照', '全局紧急停止'],
    crafting: ['分类', '底材', '制作历史', '撤销', '重做'],
    'price-check': ['国服账号', '全局赛季', '国服查价', '公开挂单'],
    puzzle: ['本机校准', '锁定', '相对收益', '自动放置'],
    tools: ['添加站点', '拖动排序', '图片地址', '永久移除'],
    settings: ['通用', '自动操作', '界面识别', '覆盖层', '系统', '问题反馈', '关于']
  }

  for (const [id, keywords] of Object.entries(expectedKeywords)) {
    const topics = moduleHelpTopicsById(id)
    assert.equal(topics[0], moduleTopicById(id))
    assert.ok(Object.isFrozen(topics))
    assert.ok(topics.length >= 3)
    assert.equal(topics[1].id, `module-${id}-first-use`)
    const content = topics.map(topicText).join('\n')
    for (const section of requiredSections) assert.match(content, new RegExp(section))
    for (const keyword of keywords) assert.match(content, new RegExp(keyword))
  }

  assert.deepEqual(moduleHelpTopicsById('unknown'), [])
})

test('做装参考保留完整专题和关键公开边界', () => {
  const content = CRAFTING_TOPICS.map(topicText).join('\n')
  assert.equal(CRAFTING_TOPICS.length, 14)
  for (const text of ['POE1 3.29', 'poecurrency.top OCR', '1/144', '13 种催化剂', 'poe1-3.29-community-v1', '全部 74 条', '社区实测估计', '供体被销毁', '三选一揭露', '希内科拉之锁']) {
    assert.match(content, new RegExp(text))
  }
})

test('常见问题与关于专题完整保留', () => {
  assert.equal(FAQ_TOPICS.length, 10)
  assert.equal(GENERAL_TOPICS.filter(topic => topic.category === 'about').length, 3)
  assert.ok(FAQ_TOPICS.every(topic => topic.blocks.length))
  const systemEnvironment = FAQ_TOPICS.find(topic => topic.id === 'faq-system-environment')
  assert.match(topicText(systemEnvironment), /Windows 10\/11 x64/)
  assert.match(topicText(systemEnvironment), /相同权限级别/)
  assert.match(topicText(systemEnvironment), /网络适配器/)
  const configLocation = FAQ_TOPICS.find(topic => topic.id === 'faq-config-location')
  assert.match(topicText(configLocation), /不可写/)
  assert.match(topicText(configLocation), /权限|安全软件|问题反馈/)
})

test('帮助内容就近分配到对应一级页面', () => {
  const expectations = [
    ['src/domains/dashboard/DashboardRouteView.vue', /helpTopics = \[\.\.\.moduleHelpTopicsById\('dashboard'\), quickStartTopic, \.\.\.healthHelpTopics\]/],
    ['src/domains/items/ItemsView.vue', /helpTopics = moduleHelpTopicsById\('items'\)/],
    ['src/domains/bag/BagView.vue', /helpTopics = moduleHelpTopicsById\('bag'\)/],
    ['src/domains/map/MapView.vue', /helpTopics = moduleHelpTopicsById\('map'\)/],
    ['src/domains/combat/CombatView.vue', /helpTopics = moduleHelpTopicsById\('combat'\)/],
    ['src/domains/story/StoryView.vue', /helpTopics = moduleHelpTopicsById\('story'\)/],
    ['src/domains/regex/RegexView.vue', /helpTopics = moduleHelpTopicsById\('regex'\)/],
    ['src/domains/shop/RecipeView.vue', /helpTopics = moduleHelpTopicsById\('recipe'\)/],
    ['src/domains/crafting/CraftPlannerView.vue', /helpTopics = \[\.\.\.moduleHelpTopicsById\('crafting'\), \.\.\.CRAFTING_TOPICS\]/],
    ['src/domains/priceCheck/PriceCheckView.vue', /helpTopics = \[\.\.\.moduleHelpTopicsById\('price-check'\), CRAFTING_PRICE_CHECK_TOPIC\]/],
    ['src/domains/puzzle/PuzzleView.vue', /helpTopics = moduleHelpTopicsById\('puzzle'\)/],
    ['src/domains/tools/ToolsView.vue', /helpTopics = moduleHelpTopicsById\('tools'\)/],
    ['src/domains/settings/SettingsView.vue', /helpTopics = \[\.\.\.moduleHelpTopicsById\('settings'\), \.\.\.FAQ_TOPICS\]/]
  ]
  for (const [path, pattern] of expectations) {
    assert.match(source(path), /<PageHelpDrawer[^>]*:topics="helpTopics"/)
    assert.match(source(path), pattern)
  }
})

test('开发页和独立浮窗不接入帮助抽屉', () => {
  for (const path of [
    'src/domains/overlay/OverlayView.vue',
    'src/domains/puzzle/PuzzleOverlayView.vue',
    'src/domains/priceCheck/PriceCheckOverlayView.vue',
    'src/domains/story/StoryOverlayView.vue'
  ]) assert.doesNotMatch(source(path), /PageHelpDrawer/)
})

test('帮助中心完全移除且无残留引用', () => {
  assert.equal(existsSync(new URL('../src/views/Help.vue', import.meta.url)), false)
  const router = source('src/router/index.js')
  const loaders = source('src/router/pageLoaders.js')
  const sidebar = source('src/components/Layout/Sidebar.vue')
  assert.doesNotMatch(router, /path: '\/help'/)
  assert.doesNotMatch(loaders, /'\/help'/)
  assert.doesNotMatch(sidebar, /\/help/)
  const content = source('src/domains/help/helpContent.js')
  for (const name of ['HELP_CATEGORIES', 'HELP_TOPICS', 'findHelpTopic', 'searchHelpTopics']) {
    assert.doesNotMatch(content, new RegExp(`export (const|function) ${name}`))
  }
})

test('抽屉默认展开唯一主题并保持只读展示', () => {
  const drawer = source('src/domains/help/PageHelpDrawer.vue')
  assert.match(drawer, /props\.topics\.length === 1 \? props\.topics\[0\]\.id : ''/)
  assert.match(drawer, /<el-drawer/)
  assert.match(drawer, /defineExpose\(\{ open \}\)/)
  assert.match(drawer, /requestedTopicId\.value \|\|/)
  assert.match(drawer, /target \? \[target, \.\.\.props\.topics\.filter/)
  assert.match(drawer, /targetOpenVersion\.value \+= 1/)
  assert.doesNotMatch(drawer, /if \(requestedTopicId\.value\) targetOpenVersion\.value \+= 1/)
  const list = source('src/domains/help/HelpTopicList.vue')
  assert.match(list, /v-if="block\.type === 'paragraph'/)
  assert.match(list, /v-else-if="block\.type === 'heading'/)
  assert.match(list, /v-else-if="block\.type === 'list'/)
  assert.match(list, /v-else-if="block\.type === 'callout'/)
  assert.match(list, /watch\(\(\) => props\.defaultExpandedId/)
  assert.match(list, /expandedTopicIds\.value = topicId \? \[topicId\] : \[\]/)
  assert.doesNotMatch(list, /打开相关页面|useRouter|navigateTo|router\.push|topic\.route/)
  assert.doesNotMatch(list, /startCrafting|startMapRolling|commitGlobalShortcut|updateShortcuts/)
})

test('设置关于分类展示真实版本与项目链接', () => {
  const settings = source('src/domains/settings/SettingsView.vue')
  assert.match(settings, /<el-tab-pane label="关于" name="about" \/>/)
  assert.match(settings, /v-show="activeTab === 'about'"/)
  assert.match(settings, /packageConfig\.version/)
  assert.match(settings, /target="_blank" rel="noreferrer"/)
})
})()



// === Merged from internationalCapabilities.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const internationalVerificationFeatures = _m7_internationalVerificationFeatures
  const serverContext = _m7_serverContext
  const INTERNATIONAL_AUTOMATION_FEATURES = _m7_INTERNATIONAL_AUTOMATION_FEATURES
  const serverChannelFailure = _m7_serverChannelFailure
  const serverShortcutAllowed = _m7_serverShortcutAllowed
test('国际服默认开放离线适配模块，旧验收参数不再决定可用性', () => {
  const args = ['--verify-international-features=items,map', '--verify-international-features=items']
  assert.deepEqual(internationalVerificationFeatures(args), [])
  assert.deepEqual(internationalVerificationFeatures(args, { isPackaged: false }), ['items', 'map'])
  assert.throws(() => internationalVerificationFeatures(['--verify-international-features=puzzle'], { isPackaged: false }))
  const context = serverContext('international')
  for (const id of INTERNATIONAL_AUTOMATION_FEATURES) {
    assert.equal(context.capabilities[id].available, true, id)
    assert.equal(context.capabilities[id].gameInputAvailable, true, id)
    assert.equal(context.capabilities[id].state, 'ready', id)
  }
  assert.deepEqual(serverContext('international', { verificationFeatures: ['items'] }), context)
  for (const id of ['puzzle', 'craft-planner']) assert.equal(context.capabilities[id].available, false)
})

test('具名业务 IPC 和快捷键开放，任意 Python 与做装模拟继续拒绝', () => {
  const context = serverContext('international')
  for (const mode of ['items', 'map']) assert.equal(serverChannelFailure(context, 'generate-and-execute-script', false, [{ mode }]), null)
  for (const config of [null, {}, { mode: 'other' }]) assert.equal(serverChannelFailure(context, 'generate-and-execute-script', false, [config]).code, 'SERVER_FEATURE_UNAVAILABLE')
  for (const channel of ['execute-python', 'crafting-create-manual-session', 'puzzle-analyze', 'unregistered-channel']) assert.equal(serverChannelFailure(context, channel).code, 'SERVER_FEATURE_UNAVAILABLE', channel)
  for (const channel of ['junfeng-start', 'combat-start-loop', 'chaos-recipe-control-action', 'chaos-recipe-pick-grid-region', 'chaos-recipe-runtime-update', 'chaos-recipe-control-state', 'price-check-capture', 'price-check-runtime-update', 'price-check-overlay-rendered', 'map-tracker:settings', 'map-tracker:overlay', 'client-events-settings-update', 'open-story-overlay', 'stash-pickup-start', 'faustus-start', 'sanctum:start', 'crafting-search-affix-suggestions']) assert.equal(serverChannelFailure(context, channel), null, channel)
  for (const key of ['itemStart', 'storyNext', 'mapStart', 'priceCheck']) {
    assert.equal(serverShortcutAllowed(context, key), true, key)
    assert.equal(serverChannelFailure(context, 'shortcut-triggered', false, [key]), null, key)
    assert.equal(serverShortcutAllowed(context, key, true), false, key)
  }
  assert.equal(serverShortcutAllowed(context, 'unknown'), false)
})

test('切服仍拒绝新任务，停止和关闭运行态始终可用', () => {
  const context = serverContext('international')
  assert.equal(serverShortcutAllowed(context, 'end', true), true)
  assert.equal(serverChannelFailure(context, 'shortcut-triggered', true, ['end']), null)
  for (const channel of ['stop-script', 'emergency-stop-all', 'price-check-overlay-close']) assert.equal(serverChannelFailure(context, channel, true), null)
  for (const channel of ['sanctum:stop', 'sanctum:cancelCalibrationCollection']) assert.equal(serverChannelFailure(context, channel, true), null)
  for (const channel of ['sanctum:setEnabled', 'sanctum:setModuleEnabled']) {
    assert.equal(serverChannelFailure(context, channel, true, [false]), null)
    assert.equal(serverChannelFailure(context, channel, true, [true]).code, 'SERVER_SWITCHING')
  }
  assert.equal(serverChannelFailure(context, 'map-tracker:overlay', true, ['hide']), null)
  assert.equal(serverChannelFailure(context, 'map-tracker:overlay', true, ['show']).code, 'SERVER_SWITCHING')
  for (const channel of ['map-tracker:settings', 'client-events-settings-update']) {
    assert.equal(serverChannelFailure(context, channel, true, [{ enabled: false }]), null)
    assert.equal(serverChannelFailure(context, channel, true, [{ enabled: false, logPath: 'another-file' }]).code, 'SERVER_SWITCHING')
  }
  for (const channel of ['stash-pickup-runtime-update', 'junfeng-runtime-update', 'price-check-runtime-update', 'chaos-recipe-runtime-update']) {
    assert.equal(serverChannelFailure(context, channel, true, [{ enabled: false }]), null)
    assert.equal(serverChannelFailure(context, channel, true, [{ enabled: true }]).code, 'SERVER_SWITCHING')
  }
  assert.equal(serverChannelFailure(context, 'generate-and-execute-script', true, [{ mode: 'items' }]).code, 'SERVER_SWITCHING')
})

test('国际服海图目标在实际预设和生成配置均拒绝，普通地图与契约保持开放', () => {
  for (const field of ['targetKind', 'activeKind']) for (const location of ['preset', 'generation']) {
    const config = { mode: 'map', preset: { map: {} }, generationConfig: { mapConfig: {} } }
    config[location === 'preset' ? 'preset' : 'generationConfig'][location === 'preset' ? 'map' : 'mapConfig'][field] = 'chart'
    assert.match(serverChannelFailure(serverContext('international'), 'generate-and-execute-script', false, [config]).message, /海图/)
    assert.equal(serverChannelFailure(serverContext('cn'), 'generate-and-execute-script', false, [config]), null)
  }
  for (const targetKind of ['atlas', 'heist']) assert.equal(serverChannelFailure(serverContext('international'), 'generate-and-execute-script', false, [{ mode: 'map', preset: { map: { targetKind } } }]), null)
})
})()

// === Merged from internationalItemFootprints.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const readFileSync = _m8_readFileSync
  const buildInternationalItemFootprints = _m8_buildInternationalItemFootprints
  const ItemFootprintRegistry = _m8_ItemFootprintRegistry
  const configureItemFootprintRegistry = _m8_configureItemFootprintRegistry
  const loadServerFootprintCatalog = _m8_loadServerFootprintCatalog
const sources = [{ id: 'repo', sha256: 'a'.repeat(64) }, { id: 'official', sha256: 'b'.repeat(64) }]
const base = (name, width, height) => ({ name, inventory_width: width, inventory_height: height, release_state: 'released' })

test('国际服仅复用官方当前名称与真实旧尺寸的无歧义交集，新类型不猜', () => {
  const catalog = buildInternationalItemFootprints({ gameVersion: '3.30.0', repoeVersion: '3.29.3.6', sources,
    baseItems: { a: base('Known Item', 2, 3), b: base('Conflict', 1, 1), c: base('Conflict', 2, 1), d: base('Absent Item', 1, 1) },
    officialCatalog: { manifest: { server: 'international' }, locale: 'en', items: [
      { baseType: 'Known Item' }, { baseType: 'Conflict' }, { baseType: 'New Thread' }
    ] } })
  assert.equal(catalog.dimensionSourceVersion, '3.29.3.6')
  assert.equal(catalog.compatibilityMode, 'known-items-only')
  assert.deepEqual(catalog.items.map(item => item.name), ['Known Item'])
  assert.equal(catalog.audit.ambiguousNames, 1)
  assert.equal(catalog.audit.unknownNames, 2)
  assert.deepEqual(catalog.categories, [])
  const registry = new ItemFootprintRegistry(catalog)
  assert.equal(registry.resolve('Currency', 'New Thread'), null)
  assert.equal(registry.resolve('Currency', 'Absent Item'), null)
})

test('国际服拒绝错误服务器目录和伪造来源版本', () => {
  const options = { gameVersion: '3.30.0', repoeVersion: '3.29.3.6', sources, baseItems: {}, officialCatalog: { manifest: { server: 'cn' }, locale: 'zh-CN', items: [] } }
  assert.throws(() => buildInternationalItemFootprints(options), /独立国际服官方英文目录/)
  assert.throws(() => buildInternationalItemFootprints({ ...options, repoeVersion: '' }), /真实尺寸来源版本/)
  assert.throws(() => buildInternationalItemFootprints({ ...options, gameVersion: 'live' }), /3.30.0/)
})

test('本服 API 实际尺寸优先于兼容旧尺寸，两次API冲突仍安全拒绝', () => {
  const registry = new ItemFootprintRegistry({ schemaVersion: 1, compatibilityMode: 'known-items-only', categories: [], items: [{ name: 'Known Item', width: 1, height: 1 }] })
  registry.registerStashItem({ baseType: 'Known Item', w: 2, h: 3 })
  assert.deepEqual(registry.resolve('', 'Known Item'), { width: 2, height: 3, source: 'stash-api' })
  registry.registerStashItem({ baseType: 'Known Item', w: 2, h: 4 })
  assert.equal(registry.resolve('', 'Known Item'), null)
  registry.registerStashItem({ baseType: 'New Item', w: 2, h: 2 })
  assert.deepEqual(registry.resolve('', 'New Item'), { width: 2, height: 2, source: 'stash-api' })
})

test('按服初始化替换共享目录且错误版本不回退国服', t => {
  t.after(() => configureItemFootprintRegistry({ serverId: 'cn', gameVersion: '3.29' }))
  const international = loadServerFootprintCatalog({ serverId: 'international', gameVersion: '3.30.0' })
  assert.equal(international.gameVersion, '3.30.0')
  assert.equal(international.dimensionSourceVersion, '3.29.3.6')
  assert.ok(international.items.length > 3000)
  configureItemFootprintRegistry({ serverId: 'international', gameVersion: '3.30.0' })
  assert.equal(_m8_itemFootprintRegistry.snapshot().strictKnownItems, true)
  assert.deepEqual(_m8_itemFootprintRegistry.resolve('', 'Astral Plate'), { width: 2, height: 3, source: 'bundled' })
  assert.equal(_m8_itemFootprintRegistry.resolve('', '星芒战铠'), null)
  configureItemFootprintRegistry({ serverId: 'international', gameVersion: '3.31.0' })
  assert.equal(_m8_itemFootprintRegistry.resolve('', 'Astral Plate'), null)
  assert.throws(() => configureItemFootprintRegistry({ serverId: 'unknown' }), /无效/)
  const snapshot = JSON.parse(readFileSync(new URL('../electron/assets/item-footprints.international.json', import.meta.url)))
  assert.equal(snapshot.server, 'international')
  assert.equal(snapshot.categories.length, 0)
})
})()

// === Merged from internationalRegex.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const createHash = _m9_createHash
  const data = _m9_data
  const mapRegexCatalog = _m9_mapRegexCatalog
  const createDefaultMapRegexConfig = _m9_createDefaultMapRegexConfig
  const cleanMapRegexConfig = _m9_cleanMapRegexConfig
  const generateMapRegex = _m9_generateMapRegex
  const beastRegexOptions = _m9_beastRegexOptions
  const cleanBeastRegexConfig = _m9_cleanBeastRegexConfig
  const generateBeastRegex = _m9_generateBeastRegex
  const affixSuggestionsForKind = _m9_affixSuggestionsForKind
  const searchMapAffixSuggestions = _m9_searchMapAffixSuggestions
  const parseInternationalMods = _m9_parseInternationalMods
  const parseInternationalChart = _m9_parseInternationalChart
  const buildInternationalSuggestions = _m9_buildInternationalSuggestions
  const parseCurrentBeasts = _m9_parseCurrentBeasts
  const generateInternationalMapData = _m9_generateInternationalMapData
test('国际服地图词库记录独立3.30来源、统一地图/契约/海图且保持完整数字模板', () => {
  assert.equal(data.manifest.server, 'international')
  assert.equal(data.manifest.gameVersion, '3.30.0')
  assert.equal(data.manifest.language, 'en')
  assert.equal(data.manifest.sources.length, 8)
  for (const source of data.manifest.sources) {
    assert.match(source.url, /^https:\/\/poedb\.tw\/us\//)
    assert.match(source.sha256, /^[a-f0-9]{64}$/)
  }
  for (const kind of ['atlas', 'chart', 'heist']) {
    assert.equal(affixSuggestionsForKind(kind, 'en'), data[kind])
    for (const item of data[kind]) {
      const normalize = text => text.replace(/\(-([\d.]+)[—–-]-([\d.]+)\)/g, '-($1—$2)').replace(/\(?\d+(?:\.\d+)?(?:\s*[—–-]\s*\d+(?:\.\d+)?)?\)?/g, '#')
      assert.ok(item.variants.every(variant => normalize(variant) === item.pattern), `${kind}:${item.id}`)
      assert.equal(item.value, item.pattern)
      assert.equal(/\p{Script=Han}/u.test(item.example), false)
    }
  }
  assert.ok(data.atlas.every(item => JSON.stringify(item.regions) === '["atlas"]'))
  assert.equal(data.atlas.some(item => /Atlas Drops|more Threads found/i.test(item.value)), false, '每词缀的地图奖励贡献不是可洗条件')
  assert.ok(searchMapAffixSuggestions('heist', 'REINFORCEMENTS', 10, 'en').length)
  assert.equal(affixSuggestionsForKind('atlas', 'zh-CN').some(item => /\p{Script=Han}/u.test(item.value)), true)
})

test('四类地图合并不丢失当前131条稳定身份、完整数值及四页来源，离线重建一致', () => {
  const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
  assert.equal(data.atlas.length, 131)
  assert.equal(new Set(data.atlas.map(entry => entry.id)).size, 131)
  assert.equal(digest(data.atlas.map(({ regions, ...entry }) => entry)), '476e1bfcfebe054324f9cec7c68f6df64a7f9357957c6564f2319044226d1297')
  assert.deepEqual(data.manifest.sources.slice(0, 4), [
    ['Maps_low_tier', '4c6e802465c93eb0cadeffb89502d79c2c9eeb9741340697555da78b51409b04'],
    ['Maps_mid_tier', '80ce6b87f1286c425cc52137b14840b82092758e91b5bd0f430af5a12a9b47ee'],
    ['Maps_top_tier', 'f71a2da51cc0b00478e9fe7b7c0979cf1ac7a864abbff2572627dacf11b87e54'],
    ['Maps_uber_tier', '4e9c5926704e0bf174f554144305b392043ba25c181c1149efe1139f52feff67']
  ].map(([page, sha256]) => ({ url: `https://poedb.tw/us/${page}`, sha256 })))
  const rebuilt = buildInternationalSuggestions([{ region: 'atlas', mods: data.atlas.map(entry => ({ affixType: entry.affixType, lines: entry.variants, tags: entry.tags })) }], 'atlas')
  assert.deepEqual(rebuilt, data.atlas)
})

test('每个英文地图表达式只命中全目录自身全部档位和边界样本，大小写不影响', () => {
  const catalog = mapRegexCatalog('en')
  for (const [id, expression] of Object.entries(catalog.expressions)) {
    const regex = new RegExp(expression, 'iu')
    for (const candidate of catalog.corpus) for (const variant of candidate.variants) {
      assert.equal(regex.test(variant.toUpperCase()), candidate.id === id, `${id} 对 ${candidate.id}：${expression}`)
    }
  }
})

test('英文地图数值使用3.30属性并正确处理数字边界、多行、包括排除和价格', () => {
  const catalog = mapRegexCatalog('en')
  const config = createDefaultMapRegexConfig('en')
  assert.ok(config.stats.atlasDrops)
  assert.ok(config.stats.threads)
  assert.equal(config.stats.quantity, undefined)
  assert.equal(config.stats.scarabs, undefined)
  config.stats.atlasDrops = { enabled: true, value: 80 }
  const numeric = generateMapRegex(config, 'en').regex.slice(1, -1)
  const regex = new RegExp(numeric, 'i')
  for (const value of [0, 7, 79, 80, 81, 180, 999, 1080]) assert.equal(regex.test(`Atlas Drops: +${value}%`), value >= 80, String(value))
  assert.equal(regex.test('Atlas Drops:\n+80%'), false)
  assert.equal(regex.test('Atlas Drops: -80%'), false)
  assert.equal(regex.test('Item Quantity: +180%'), false)
  config.includeAffixIds = [catalog.affixes[0].id]
  config.excludeAffixIds = [catalog.affixes[1].id]
  config.rarity = { mode: 'include', selectedIds: ['rare'] }
  config.corrupted = { enabled: true, mode: 'exclude' }
  config.priceRange = { min: 10, max: 19, currencies: ['div', 'ch'] }
  const result = generateMapRegex(config, 'en')
  assert.equal(result.includeCount, 4)
  assert.equal(result.excludeCount, 2)
  assert.ok(result.regex.includes('~b/o 1\\d (div|ch)'))
  assert.equal(/\p{Script=Han}/u.test(result.regex), false)
  assert.equal(cleanMapRegexConfig({ includeAffixIds: ['被怪物击中时中毒'] }, 'en').includeAffixIds.length, 1)
  assert.deepEqual(cleanMapRegexConfig({ includeAffixIds: ['不存在的非法词缀'] }, 'en').includeAffixIds, [])
})

test('英文野兽仅使用当前红兽/首领与官方可交易目录交集，短表达式不误匹配', () => {
  const options = beastRegexOptions('en')
  assert.equal(options.length, 51)
  assert.ok(options.some(item => item.name === 'Farrul, First of the Plains'))
  assert.ok(options.some(item => item.name === 'Black Mórrigan'))
  assert.equal(options.some(item => item.name === 'Cave Beast'), false)
  assert.equal(options.some(item => item.name === 'Farric Hound Alpha'), false)
  for (const item of options) {
    const regex = new RegExp(item.expression, 'iu')
    const copied = new RegExp(generateBeastRegex({ includeIds: [item.id] }, 'en').regex.slice(1, -1), 'iu')
    for (const other of options) {
      assert.equal(regex.test(other.name.toUpperCase()), item.id === other.id, `${item.name}/${other.name}`)
      assert.equal(copied.test(other.name.toUpperCase()), item.id === other.id, `复制后 ${item.name}/${other.name}`)
    }
  }
  const [a, b] = options
  const config = cleanBeastRegexConfig({ includeIds: [a.id, a.id, b.id, 'Cave Beast'], excludeIds: [b.id], priceRange: { min: 10, max: 19, currencies: ['div'] } }, 'en')
  assert.deepEqual(config.includeIds, [a.id])
  const result = generateBeastRegex(config, 'en')
  assert.equal(result.includeCount, 2)
  assert.equal(result.excludeCount, 1)
  assert.ok(result.regex.includes(`"!${b.expression}"`))
  assert.equal(generateBeastRegex({ includeIds: options.map(item => item.id) }, 'en').includeCount, options.length)
})

test('英文生成器校验词缀域、忽略不可洗记录和奖励贡献，不猜测来源', async () => {
  const html = 'new ModsView(' + JSON.stringify({ opt: { ModDomainsID: 5 }, normal: [
    { DropChance: 100, ModGenerationTypeID: '1', str: 'Monsters deal (10—20)% increased Damage<br>10% increased Atlas Drops in this Area<br>35% more Threads found in Area' },
    { DropChance: 0, ModGenerationTypeID: '2', str: 'Legacy effect' },
    { DropChance: 100, ModGenerationTypeID: '3', str: 'Implicit effect' }
  ] }) + ')'
  const mods = parseInternationalMods(html, 5)
  assert.equal(mods.length, 1)
  assert.deepEqual(mods[0].lines, ['Monsters deal (10—20)% increased Damage'])
  assert.throws(() => parseInternationalMods(html, 22), /词缀域/)
  assert.throws(() => parseInternationalMods('<html/>', 5), /ModsView/)
  const entries = buildInternationalSuggestions([{ mods, region: 'atlas' }], 'atlas')
  assert.ok(entries[0].variants.includes('Monsters deal 10% increased Damage'))
  assert.ok(entries[0].variants.includes('Monsters deal 20% increased Damage'))
  const chart = parseInternationalChart('<table><thead><tr><th>Level</th><th>Pre/Suf</th><th>Description</th></tr></thead><tbody><tr><td>1</td><td>Prefix</td><td>More Monsters<br>20% increased Rarity of Items found in adjacent Areas</td></tr><tr><td>1</td><td>Unique</td><td>Legacy implicit</td></tr></tbody></table>')
  assert.deepEqual(chart.map(row => row.lines), [['More Monsters']])
  assert.throws(() => parseCurrentBeasts('<div/>', { items: [] }), /覆盖不足/)
  await assert.rejects(generateInternationalMapData({ gameVersion: '3.29', catalog: {} }), /3.30/)
  await assert.rejects(generateInternationalMapData({ gameVersion: '3.30.0', catalog: { locale: 'zh-CN' } }), /国际服英文/)
})
})()

// === Merged from itemFootprint.test.js ===
await (async () => {
  const assert = _m10_assert
  const readFileSync = _m10_readFileSync
  const test = _m10_test
  const ITEM_FOOTPRINT_SCHEMA_VERSION = _m10_ITEM_FOOTPRINT_SCHEMA_VERSION
  const ItemFootprintRegistry = _m10_ItemFootprintRegistry
  const createFootprintKey = _m10_createFootprintKey
  const loadBundledFootprintCatalog = _m10_loadBundledFootprintCatalog
  const normalizeFootprintText = _m10_normalizeFootprintText
  const normalizeStashItem = _m10_normalizeStashItem
test('占位身份统一中文英文空白与 Unicode 宽度', () => {
  assert.equal(normalizeFootprintText('  Body　Armour '), 'body armour')
  assert.equal(createFootprintKey('胸甲', ' 星芒战铠 '), `胸甲\u001f星芒战铠`)
  assert.equal(createFootprintKey('', 'Chaos Orb'), `*\u001fchaos orb`)
})

test('共享目录登记 API 尺寸、冻结快照并隔离后续变更', () => {
  const registry = new ItemFootprintRegistry({
    schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION,
    categories: [],
    items: []
  })
  assert.equal(registry.registerStashItem({
    itemClass: 'Body Armour', baseType: 'Astral Plate', w: 2, h: 3
  }), true)
  const frozen = registry.snapshot()
  assert.deepEqual(frozen.items[createFootprintKey('', 'Astral Plate')], {
    key: createFootprintKey('', 'Astral Plate'), width: 2, height: 3, source: 'stash-api'
  })
  registry.registerStashItem({ itemClass: 'Flask', baseType: 'Granite Flask', w: 1, h: 2 })
  assert.equal(frozen.items[createFootprintKey('', 'Granite Flask')], undefined)
})

test('同类别同基底尺寸冲突后不再输出该身份', () => {
  const registry = new ItemFootprintRegistry({
    schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION,
    categories: [],
    items: []
  })
  registry.register({ categories: ['Shield'], names: ['Test Shield'], width: 2, height: 2 })
  registry.register({ categories: ['Shield'], names: ['Test Shield'], width: 2, height: 3 })
  const snapshot = registry.snapshot()
  assert.equal(snapshot.items[createFootprintKey('Shield', 'Test Shield')], undefined)
  assert.equal(snapshot.items[createFootprintKey('', 'Test Shield')], undefined)
})

test('无类别身份冲突不会清空无关类别兜底', () => {
  const registry = new ItemFootprintRegistry({
    schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION,
    categories: [{ aliases: ['Map', '地图'], width: 1, height: 1 }],
    items: []
  })
  registry.register({ names: ['冲突物品'], width: 1, height: 1 })
  registry.register({ names: ['冲突物品'], width: 2, height: 1 })
  const snapshot = registry.snapshot()
  assert.equal(snapshot.items[createFootprintKey('', '冲突物品')], undefined)
  assert.deepEqual(snapshot.categories[normalizeFootprintText('Map')], {
    key: normalizeFootprintText('Map'), width: 1, height: 1, source: 'bundled'
  })
})

test('内置目录有效且缺失或版本错误时安全回退为空目录', () => {
  const bundled = loadBundledFootprintCatalog()
  assert.equal(bundled.schemaVersion, ITEM_FOOTPRINT_SCHEMA_VERSION)
  assert.equal(bundled.gameVersion, '3.29')
  assert.ok(bundled.audit.craftingResolved > 0)
  assert.ok(bundled.categories.length > 0)
  assert.ok(bundled.items.length > 0)
  assert.deepEqual(loadBundledFootprintCatalog('不存在的目录.json'), {
    schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION, categories: [], items: []
  })
  assert.deepEqual(loadBundledFootprintCatalog(undefined, '3.28'), {
    schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION, categories: [], items: []
  })
})

test('内置目录精确区分混合尺寸基底且只保留安全类别兜底', () => {
  const registry = new ItemFootprintRegistry(loadBundledFootprintCatalog())
  const snapshot = registry.snapshot()
  const assertItem = (name, width, height) => {
    assert.deepEqual(snapshot.items[createFootprintKey('', name)], {
      key: createFootprintKey('', name), width, height, source: 'bundled'
    })
  }

  assertItem('短弓', 2, 3)
  assertItem('长弓', 2, 4)
  assertItem('朽木之干', 1, 4)
  assertItem('粗制长杖', 2, 4)
  assertItem('锈斑巨剑', 1, 4)
  assertItem('双手剑', 2, 4)
  assertItem('混沌石', 1, 1)
  assert.equal(snapshot.categories[normalizeFootprintText('弓')], undefined)
  assert.equal(snapshot.categories[normalizeFootprintText('长杖')], undefined)
  assert.equal(snapshot.categories[normalizeFootprintText('双手剑')], undefined)
  assert.deepEqual(snapshot.categories[normalizeFootprintText('鱼竿')], {
    key: normalizeFootprintText('鱼竿'), width: 1, height: 4, source: 'bundled'
  })
  assert.deepEqual(snapshot.categories[normalizeFootprintText('地图')], {
    key: normalizeFootprintText('地图'), width: 1, height: 1, source: 'bundled'
  })
  assert.deepEqual(snapshot.categories[normalizeFootprintText('技能宝石')], {
    key: normalizeFootprintText('技能宝石'), width: 1, height: 1, source: 'bundled'
  })
})

test('仓库归一化登记真实宽高且保留原有字段', () => {
  const item = normalizeStashItem({
    id: 'api-item', x: 1, y: 2, w: 2, h: 4, ilvl: 83,
    frameType: 2, baseType: '测试双手剑', typeLine: '测试双手剑',
    itemClass: 'Two Hand Sword', sockets: [], influences: { shaper: true }
  }, { id: 'tab', index: 0, name: '仓库', type: 'normal' })
  assert.equal(item.width, 2)
  assert.equal(item.height, 4)
  assert.deepEqual(item.influences, ['shaper'])
})

test('仓库 API 同尺寸合并、异尺寸禁用内置物品身份', () => {
  const registry = new ItemFootprintRegistry({
    schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION,
    categories: [{ aliases: ['Currency', '通货'], width: 1, height: 1 }],
    items: [{ name: '测试通货', width: 1, height: 1 }]
  })
  assert.equal(registry.registerStashItem({ itemClass: 'Currency', baseType: '测试通货', w: 1, h: 1 }), true)
  assert.deepEqual(registry.snapshot().items[createFootprintKey('', '测试通货')], {
    key: createFootprintKey('', '测试通货'), width: 1, height: 1, source: 'stash-api'
  })
  assert.equal(registry.registerStashItem({ itemClass: 'Currency', baseType: '测试通货', w: 2, h: 1 }), true)
  const snapshot = registry.snapshot()
  assert.equal(snapshot.items[createFootprintKey('', '测试通货')], undefined)
  assert.equal(snapshot.items[createFootprintKey('Currency', '测试通货')], undefined)
  assert.equal(snapshot.categories[normalizeFootprintText('Currency')], undefined)
  assert.equal(snapshot.categories[normalizeFootprintText('通货')], undefined)
})

test('自动入库注入冻结目录并由安装包携带目录资源', () => {
  const ipc = readFileSync(new URL('../electron/modules/ipc/bag.js', import.meta.url), 'utf8')
  const packageConfig = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.match(ipc, /structuredClone\(latestConfig\)/)
  assert.match(ipc, /inventory\.itemFootprints = itemFootprintRegistry\.snapshot\(\)/)
  assert.ok(packageConfig.build.files.includes('electron/assets/item-footprints.json'))
})
})()

// === Merged from listPagination.test.js ===
await (async () => {
  const test = _m11_test
  const assert = _m11_assert
  const paginateList = _m11_paginateList
test('列表分页固定切片并将页码收敛到合法范围', () => {
  const items = Array.from({ length: 26 }, (_, index) => index + 1)
  assert.deepEqual(paginateList(items, 1, 10), {
    items: items.slice(0, 10), page: 1, pageSize: 10, totalPages: 3
  })
  assert.deepEqual(paginateList(items, 3, 10), {
    items: items.slice(20), page: 3, pageSize: 10, totalPages: 3
  })
  assert.deepEqual(paginateList(items.slice(0, 20), 3, 10), {
    items: items.slice(10, 20), page: 2, pageSize: 10, totalPages: 2
  })
})

test('空列表和非法分页参数安全回退', () => {
  assert.deepEqual(paginateList([], 99, 10), { items: [], page: 1, pageSize: 10, totalPages: 1 })
  assert.deepEqual(paginateList([1, 2], 0, 0), { items: [1, 2], page: 1, pageSize: 10, totalPages: 1 })
})
})()

// === Merged from regexPages.test.js ===
await (async () => {
  const test = _m12_test
  const assert = _m12_assert
  const readFileSync = _m12_readFileSync
  const parse = _m12_parse
  const availableFeatureCatalog = _m12_availableFeatureCatalog
const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('正则、配方和旧商城兼容路由完整接入懒加载', () => {
  const router = source('src/router/index.js')
  const loaders = source('src/router/pageLoaders.js')
  assert.match(router, /path: '\/regex'[\s\S]*component: pageLoaders\['\/regex'\]/)
  assert.match(router, /path: '\/recipe'[\s\S]*component: pageLoaders\['\/recipe'\]/)
  assert.match(router, /path: '\/shop'[\s\S]*redirect: \{ path: '\/recipe', replace: true \}/)
  assert.match(loaders, /'\/regex': \(\) => import\('\.\.\/domains\/regex\/RegexView\.vue'\)/)
  assert.match(loaders, /'\/recipe': \(\) => import\('\.\.\/domains\/shop\/RecipeView\.vue'\)/)
})

test('侧栏使用线性图标并按正则、配方顺序预加载', () => {
  const sidebar = source('src/components/Layout/Sidebar.vue')
  const catalog = availableFeatureCatalog()
  assert.ok(catalog.findIndex(item => item.id === 'regex') < catalog.findIndex(item => item.id === 'recipe'))
  assert.equal(catalog.find(item => item.id === 'regex').icon, 'Operation')
  assert.equal(catalog.find(item => item.id === 'recipe').icon, 'ShoppingBag')
  assert.match(sidebar, /warmRoute\(feature\.route\)/)
})

test('正则页默认商城并提供地图标签、固定结果栏和 250 字符提示', () => {
  const view = source('src/domains/regex/RegexView.vue')
  const vendor = source('src/domains/regex/VendorRegexPanel.vue')
  const map = source('src/domains/regex/MapRegexPanel.vue')
  const result = source('src/domains/regex/RegexResultCard.vue')
  assert.match(view, /label="商城" name="vendor"/)
  assert.match(view, /label="地图" name="map"/)
  assert.match(view, /readPersistentTab\('regexActiveTab', TABS, 'vendor'\)/)
  assert.match(vendor, /position: sticky/)
  assert.doesNotMatch(vendor, /三连孔色|二连孔色|指定连接颜色|exactColors|threeLinks|twoLinks/)
  assert.match(map, /统一配置异界地图/)
  assert.doesNotMatch(map, /config\.region|regions\.includes|value="t17"/)
  assert.match(map, /includeAffixIds[\s\S]*excludeAffixIds/)
  assert.match(map, /批量购买价格筛选/)
  assert.match(map, /MAP_PRICE_CURRENCIES/)
  assert.match(map, /priceRange\.min[\s\S]*priceRange\.max/)
  assert.match(result, /result\.length \}\} \/ 250/)
})

test('新增页面组件均可被 Vue 编译器解析', () => {
  for (const path of [
    'src/domains/regex/RegexView.vue', 'src/domains/regex/VendorRegexPanel.vue',
    'src/domains/regex/MapRegexPanel.vue', 'src/domains/regex/BeastRegexPanel.vue', 'src/domains/regex/RegexResultCard.vue',
    'src/domains/regex/RegexPresetSelector.vue', 'src/domains/shop/RecipeView.vue'
  ]) {
    assert.deepEqual(parse(source(path), { filename: path }).errors, [], path)
  }
})
})()

// === Merged from regexPreset.test.js ===
await (async () => {
  const test = _m13_test
  const assert = _m13_assert
  const createPinia = _m13_createPinia
  const setActivePinia = _m13_setActivePinia
  const useRegexPresetStore = _m13_useRegexPresetStore
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


test('野兽预设增删改切换及恢复与其他预设隔离', () => {
  const { store, values } = createStore()
  const beast = store.add('beast', '野兽方案')
  store.update('beast', { name: '已改名' })
  store.currentBeastRegexPreset.beastRegex.priceRange = { min: 5, max: 20, currencies: ['div'] }
  store.save()
  store.switchTo('beast', 'default')
  store.switchTo('beast', beast.id)
  const restored = createStore(Object.fromEntries(values)).store
  assert.equal(restored.currentBeastRegexPreset.name, '已改名')
  assert.deepEqual(restored.currentBeastRegexPreset.beastRegex.priceRange, { min: 5, max: 20, currencies: ['div'] })
  assert.equal(restored.currentMapRegexPresetId, 'default')
  assert.equal(restored.currentVendorPresetId, 'default')
  assert.equal(restored.remove('beast', 'default'), false)
  assert.equal(restored.remove('beast', beast.id), true)
  assert.equal(restored.currentBeastRegexPresetId, 'default')
})

test('损坏或未知的野兽预设状态回退默认值', () => {
  const { store } = createStore({ beastRegexPresets: '{broken', currentBeastRegexPresetId: 'missing' })
  assert.equal(store.currentBeastRegexPreset.id, 'default')
  assert.deepEqual(store.currentBeastRegexPreset.beastRegex.includeIds, [])
})
})()
