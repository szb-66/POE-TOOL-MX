import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { median, summarizeStartupRuns } from '../scripts/startupMetrics.js'

const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('启动基准使用中位数并执行外壳、首页和相对缩短预算', () => {
  assert.equal(median([9, 1, 5]), 5)
  assert.equal(median([2, 4]), 3)
  assert.equal(median([]), null)

  const result = summarizeStartupRuns([
    { viteReadyMs: 900, electronLaunchMs: 20, shellMs: 1800, dashboardMs: 7000 },
    { viteReadyMs: 700, electronLaunchMs: 30, shellMs: 2200, dashboardMs: 7600 },
    { viteReadyMs: 800, electronLaunchMs: 10, shellMs: 2000, dashboardMs: 7200 }
  ])
  assert.equal(result.viteMedianMs, 800)
  assert.equal(result.electronLaunchMedianMs, 20)
  assert.equal(result.shellMedianMs, 2000)
  assert.equal(result.dashboardMedianMs, 7200)
  assert.deepEqual(result.budget, { shell: true, dashboard: true, reduction: true })
})

test('启动基准只清理本仓库旧 Electron 开发实例', () => {
  const benchmark = source('../scripts/startupBenchmark.js')
  assert.match(benchmark, /closeOldDevelopmentProcesses/)
  assert.match(benchmark, /\.Name -eq 'electron\.exe'/)
  assert.match(benchmark, /electronMainPath/)
  assert.match(benchmark, /taskkill\.exe/)
  assert.match(benchmark, /spawn\(process\.execPath,[\s\S]*?viteBinPath/)
  assert.doesNotMatch(benchmark, /Get-NetTCPConnection|LocalPort\s+-eq\s+3000/)
})

test('只有 renderer-mounted 改变 CrashGuard，首页就绪使用独立退出参数', () => {
  const main = source('../electron/main.js')
  const markComplete = main.match(/crashGuard\.markStartupComplete\(\)/g) || []
  assert.equal(markComplete.length, 1)
  assert.match(main, /event\?\.phase === 'renderer'[\s\S]*?crashGuard\.markStartupComplete/)
  assert.match(main, /event\?\.phase === 'dashboard'[\s\S]*?--diagnostic-exit-after-dashboard-ready/)
})

test('根组件动态加载主运行时且浮窗门禁位于导入之前', () => {
  const app = source('../src/App.vue')
  const guard = app.indexOf('if (route.meta.noLayout) return')
  const runtimeImport = app.indexOf("import('./startup/mainRuntime')")
  assert.ok(guard >= 0 && runtimeImport > guard)
  assert.doesNotMatch(app, /useChaosRecipeStore|useJunfengStore|initCombatAssist/)
})

test('主窗口运行时复用初始化任务、先接监听器并统一逆序清理', () => {
  const runtime = source('../src/startup/mainRuntime.js')
  assert.match(runtime, /let initializationPromise = null/)
  assert.match(runtime, /if \(!initializationPromise\)[\s\S]*?initializationPromise = startMainRuntime/)
  assert.match(runtime, /activeDisposers\.splice\(0\)\.reverse\(\)/)
  const listeners = runtime.indexOf('// 先接收生命周期事件')
  const titleSync = runtime.indexOf('await settingsStore.syncGameWindowTitles()')
  const parallelSync = runtime.indexOf('await Promise.all([')
  assert.ok(listeners >= 0 && titleSync > listeners && parallelSync > titleSync)
  assert.match(runtime, /settleSubsystem\('junfeng'/)
  assert.match(runtime, /warnings\.push/)
})

test('首页路由使用轻量外壳并保留失败重试和状态同步门禁', () => {
  const loaders = source('../src/router/pageLoaders.js')
  const route = source('../src/domains/dashboard/DashboardRouteView.vue')
  const content = source('../src/domains/dashboard/DashboardView.vue')
  assert.match(loaders, /DashboardRouteView\.vue/)
  assert.match(route, /import\('\.\/DashboardView\.vue'\)/)
  assert.match(route, />重试</)
  assert.match(route, /:inert="!mainRuntimeState\.settled"/)
  assert.match(content, /dashboard-ready/)
})
