import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { usePresetStore } from '../src/stores/preset.js'
import { createDefaultMapConfig } from '../src/utils/mapPresetMigration.js'
import {
  createModuleStatus,
  evaluateBagStatus,
  evaluateCombatStatus,
  evaluateCraftingStatus,
  evaluateItemsStatus,
  evaluateMapStatus,
  evaluatePriceCheckStatus,
  evaluateShopStatus,
  evaluateStoryStatus,
  ITEM_CRAFTING_MODE_OPTIONS,
  MAP_ROLLING_METHOD_OPTIONS,
  RECOVERY_MODE_OPTIONS,
  summarizeModules
} from '../src/domains/dashboard/dashboardStatus.js'
import {
  DASHBOARD_MODULE_GROUPS,
  groupDashboardModules
} from '../src/domains/dashboard/dashboardGroups.js'
import {
  clearCurrentScriptProcess,
  getCurrentScriptMode,
  getCurrentScriptProcess,
  setCurrentScriptProcess
} from '../electron/modules/python/process.js'

test('模块状态按异常、运行中、需配置、可用的优先级互斥判定', () => {
  assert.equal(createModuleStatus({ error: '失败', running: true, issues: ['缺配置'] }).state, 'error')
  assert.equal(createModuleStatus({ running: true, issues: ['缺配置'] }).state, 'running')
  assert.equal(createModuleStatus({ issues: ['缺配置'] }).state, 'attention')
  assert.equal(createModuleStatus({}).state, 'ready')
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

test('首页切换物品、地图和航海海图配置只修改各自当前预设并持久化', () => {
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

test('过渡版本嵌套海图配置拆分为独立预设并清理地图预设', () => {
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
  assert.equal(evaluateBagStatus({ configError: '缺少模板' }).state, 'attention')
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
  assert.equal(ready.title, '商城配方')
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

  assert.equal(evaluateCraftingStatus({ status: null }).state, 'attention')
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

test('首页按检测、制造、其他分组且每个模块只出现一次', () => {
  const modules = ['items', 'bag', 'map', 'combat', 'story', 'shop', 'priceCheck', 'crafting']
    .map(id => ({ id }))
  const groups = groupDashboardModules(modules)

  assert.deepEqual(
    DASHBOARD_MODULE_GROUPS.map(group => group.title),
    ['检测', '制造', '其他']
  )
  assert.deepEqual(
    groups.map(group => group.modules.map(module => module.id)),
    [
      ['bag', 'combat', 'shop', 'priceCheck'],
      ['map', 'items'],
      ['story', 'crafting']
    ]
  )
  assert.equal(new Set(groups.flatMap(group => group.modules)).size, modules.length)
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
  const preload = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
  const ipc = readFileSync(new URL('../electron/modules/ipc/python.js', import.meta.url), 'utf8')

  assert.match(router, /path: '\/',[\s\S]*name: 'Dashboard'/)
  assert.match(sidebar, /index="\/"[\s\S]*首页/)
  assert.match(sidebar, /overflow-y: auto/)
  assert.doesNotMatch(sidebar, /\b\w*Filled\b/)
  assert.match(sidebar, /index="\/bag"[\s\S]*<SuitcaseLine \/>/)
  assert.match(sidebar, /index="\/craft-planner"[\s\S]*<SetUp \/>/)
  assert.match(sidebar, /index="\/puzzle"[\s\S]*<Guide \/>/)
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
