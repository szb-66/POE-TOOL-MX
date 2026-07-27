import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  createModuleStatus,
  evaluateBagStatus,
  evaluateCombatStatus,
  evaluateCraftingStatus,
  evaluateItemsStatus,
  evaluateMapStatus,
  evaluateShopStatus,
  evaluateStoryStatus,
  summarizeModules
} from '../src/domains/dashboard/dashboardStatus.js'
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

test('物品和地图区分共享脚本归属并保留互斥占用说明', () => {
  const validation = { isValid: true, errors: [] }
  const items = evaluateItemsStatus({
    validation,
    scriptRunning: true,
    scriptMode: 'items',
    presetName: '物品预设',
    enabledModes: ['词缀']
  })
  const map = evaluateMapStatus({
    validation,
    scriptRunning: true,
    scriptMode: 'items',
    presetName: '地图预设',
    method: 'chaos'
  })
  assert.equal(items.state, 'running')
  assert.equal(map.state, 'ready')
  assert.match(map.statusText, /物品模块占用/)
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
  }).statusText, '运行中 · 等待游戏窗口')
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

test('商城和做装使用可用性而不是虚假运行状态', () => {
  assert.equal(evaluateShopStatus({ regex: '', length: 0 }).state, 'attention')
  assert.equal(evaluateShopStatus({ regex: 'r-g-b', length: 5 }).state, 'ready')
  assert.equal(evaluateCraftingStatus({ status: null }).state, 'attention')
  assert.equal(evaluateCraftingStatus({
    status: { source: 'builtin', manifest: { patch: '3.28' } },
    session: { id: 'session' }
  }).statusText, '存在进行中的做装会话')
})

test('七模块汇总每张卡只计入一个类别', () => {
  const modules = [
    createModuleStatus({ error: 'x' }),
    createModuleStatus({ running: true }),
    createModuleStatus({ issues: ['x'] }),
    createModuleStatus({}),
    createModuleStatus({}),
    createModuleStatus({ running: true }),
    createModuleStatus({ issues: ['x'] })
  ]
  assert.deepEqual(summarizeModules(modules), { error: 1, running: 2, attention: 2, ready: 2 })
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
  assert.match(preload, /onScriptStatusChanged/)
  assert.match(ipc, /script-status-changed/)
  assert.match(ipc, /status: 'running'/)
})

