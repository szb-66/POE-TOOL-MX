import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { median as _m0_median, summarizeStartupRuns as _m0_summarizeStartupRuns } from '../scripts/startupMetrics.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFileSync as _m1_readFileSync } from 'node:fs'
import { sanitizeStartupReport as _m1_sanitizeStartupReport } from '../electron/modules/system/startupEvent.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import _m2_fs from 'node:fs'
import _m2_path from 'node:path'
import _m2_os from 'node:os'
import _m2_vm from 'node:vm'
import { EventEmitter as _m2_EventEmitter } from 'node:events'
import { prepareTrustedScriptRequest as _m2_prepareTrustedScriptRequest } from '../electron/modules/python/trustedScript.js'
import { getServer as _m2_getServer } from '../shared/serverMode.js'
import { createBatchRecoveryStore as _m2_createBatchRecoveryStore } from '../electron/modules/crafting/batchRecovery.js'
import { CraftingCurrencyUsageLedger as _m2_CraftingCurrencyUsageLedger } from '../electron/modules/python/currencyUsageLedger.js'
import { resolveCraftingPython as _m2_resolveCraftingPython, resolveCraftingPythonAsync as _m2_resolveCraftingPythonAsync } from '../electron/modules/python/launcher.js'
import { handlePipeParseRequest as _m2_handlePipeParseRequest, normalizeMapStatsSnapshot as _m2_normalizeMapStatsSnapshot } from '../electron/modules/python/parsePipe.js'

// === Merged from startupPerformance.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const median = _m0_median
  const summarizeStartupRuns = _m0_summarizeStartupRuns
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

test('开发服务器首次预构建 Element Plus 组件样式，避免冷启动整页重载', () => {
  const viteConfig = source('../vite.config.js')

  assert.ok(viteConfig.includes("'element-plus/es/components/*/style/css'"))
})

test('启动基准使用真实开发入口且不会搜索并终止已有开发实例', () => {
  const benchmark = source('../scripts/startupBenchmark.js')
  assert.doesNotMatch(benchmark, /closeOldDevelopmentProcesses|Get-CimInstance/)
  assert.match(benchmark, /scripts\/dev\.js/)
  assert.match(benchmark, /taskkill\.exe/)
  assert.match(benchmark, /String\(child\.pid\)/)
  assert.match(benchmark, /boot-first/)
  assert.match(benchmark, /process-restart/)
  assert.match(benchmark, /electron-restart/)
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
  assert.match(runtime, /settleSubsystem\('feature-modules'/)
  assert.match(runtime, /installFeatureRuntime/)
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

test('启动与首页状态刷新不预热完整做装数据', () => {
  const main = source('../electron/main.js')
  const dashboard = source('../src/domains/dashboard/useDashboard.js')

  assert.match(main, /craftingService\.registerImageProtocol\(\)/)
  assert.doesNotMatch(main, /await craftingService\.initialize\(\)/)
  assert.doesNotMatch(dashboard, /electronApi\.crafting\.getStatus\(\)/)
  assert.doesNotMatch(dashboard, /craftingStore|useCraftingStore|evaluateCraftingStatus/)
})

test('首页复用主运行时的 DPI 探测结果', () => {
  const runtime = source('../src/startup/mainRuntime.js')
  const dashboard = source('../src/domains/dashboard/useDashboard.js')

  assert.match(runtime, /settingsStore\.refreshDpiScale\(\)/)
  assert.doesNotMatch(dashboard, /settingsStore\.refreshDpiScale\(\)/)
})
})()

// === Merged from startupWiring.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFileSync = _m1_readFileSync
  const sanitizeStartupReport = _m1_sanitizeStartupReport
test('渲染端启动事件只接受固定枚举和长度受限文本', () => {
  assert.deepEqual(sanitizeStartupReport({ type: 'renderer-mounted' }), {
    phase: 'renderer', outcome: 'succeeded', reasonCode: 'none', message: ''
  })
  assert.deepEqual(sanitizeStartupReport({ type: 'renderer-error', message: 'boom' }), {
    phase: 'renderer', outcome: 'failed', reasonCode: 'renderer_error', message: 'boom'
  })
  assert.equal(sanitizeStartupReport({ type: 'unknown', message: 'boom' }), null)
  assert.equal(sanitizeStartupReport({ type: 'renderer-error', message: 'x'.repeat(1025) }), null)
  assert.equal(sanitizeStartupReport('renderer-mounted'), null)
  assert.deepEqual(sanitizeStartupReport({ type: 'dashboard-ready' }), {
    phase: 'dashboard', outcome: 'succeeded', reasonCode: 'none', message: ''
  })
  assert.deepEqual(sanitizeStartupReport({ type: 'renderer-runtime-failed', message: 'partial' }), {
    phase: 'renderer-runtime', outcome: 'failed', reasonCode: 'renderer_runtime_failed', message: 'partial'
  })
})

test('主进程在 ready 前启用本地 Crashpad 和崩溃保护', () => {
  const main = readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8')
  const readyIndex = main.indexOf('app.whenReady()')
  assert.ok(readyIndex > 0)
  assert.ok(main.indexOf("app.setPath('crashDumps'") < readyIndex)
  assert.ok(main.indexOf('crashReporter.start') < readyIndex)
  assert.ok(main.indexOf('crashGuard.install()') < readyIndex)
  assert.match(main, /--startup-safe-mode/)
  assert.match(main, /--diagnostic-fail-main/)
  assert.match(main, /--diagnostic-fail-load/)
  assert.match(main, /--diagnostic-crash-renderer/)
  assert.match(main, /--diagnostic-crash-main-native/)
  assert.match(main, /--diagnostic-exit-after-mounted/)
  assert.match(main, /--diagnostic-exit-after-dashboard-ready/)
  assert.match(main, /--diagnostic-exit-on-unrecoverable/)
})

test('开发启动器把显式诊断参数传给 Electron', () => {
  const launcher = readFileSync(new URL('../scripts/dev.js', import.meta.url), 'utf8')
  const processManager = readFileSync(new URL('../scripts/devProcess.js', import.meta.url), 'utf8')
  assert.match(launcher, /process\.argv\.slice\(2\)/)
  assert.match(launcher, /electronMainPath, \.\.\.diagnosticArguments/)
  assert.match(launcher, /runManagedElectronSession/)
  assert.match(processManager, /DEVELOPMENT_RESTART_EXIT_CODE/)
})

test('preload 与 Vue 启动入口完成受限启动握手', () => {
  const preload = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
  const renderer = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
  const ipc = readFileSync(new URL('../electron/modules/ipc/system.js', import.meta.url), 'utf8')
  assert.match(preload, /reportStartupEvent/)
  assert.match(preload, /startup-report/)
  assert.match(renderer, /renderer-mounted/)
  assert.match(renderer, /unhandledrejection/)
  assert.match(renderer, /renderer-bootstrap-failed/)
  assert.match(ipc, /sanitizeStartupReport/)
  assert.match(ipc, /report, _event\.sender/)
  assert.match(readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8'), /mainWindow\.webContents !== sender/)
  assert.match(readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8'), /crashGuard\.markStartupComplete\(\)/)
})

test('主窗口在开始加载前接入启动观察器，并保留开发故障注入边界', () => {
  const manager = readFileSync(new URL('../electron/modules/window/manager.js', import.meta.url), 'utf8')
  assert.match(manager, /beforeLoad\?\.\(mainWindow\)[\s\S]*?mainWindow\.load/)
  assert.match(manager, /diagnosticFailLoad/)
  assert.match(manager, /NODE_ENV === 'development'/)
})
})()

// === Merged from trustedGeneratedScript.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const fs = _m2_fs
  const path = _m2_path
  const os = _m2_os
  const vm = _m2_vm
  const EventEmitter = _m2_EventEmitter
  const prepareTrustedScriptRequest = _m2_prepareTrustedScriptRequest
  const getServer = _m2_getServer
  const createBatchRecoveryStore = _m2_createBatchRecoveryStore
  const CraftingCurrencyUsageLedger = _m2_CraftingCurrencyUsageLedger
  const resolveCraftingPython = _m2_resolveCraftingPython
const ipcUrl = new URL('../electron/modules/ipc/python.js', import.meta.url)
const filePathsFor = directory => ({ tempDir: directory, itemInfoFile: path.join(directory, 'item_info.txt'), itemInfoResultFile: path.join(directory, 'item_info_result.json') })
const mainWindow = () => ({ isDestroyed: () => false, webContents: { isDestroyed: () => false, send() {} } })
const request = (mode = 'items') => ({
  mode, craftingKind: mode === 'items' ? 'general' : undefined,
  preset: mode === 'items' ? { checkInitialItem: true, moduleTwo: { enabled: true, mode: 'alteration' } } : { map: { targetKind: 'atlas', method: 'alchemy' } },
  generationConfig: {
    globalShortcuts: { end: 'F12' }, currencyPositions: {}, itemPosition: { x: 10, y: 20 },
    inventory: { startPos: { x: 1, y: 2 }, slotSize: { w: 10, h: 10 } },
    stashTabSelection: { enabled: false }, serverId: 'cn', language: 'zh-CN'
  }
})

test('主进程重新生成内置脚本，覆盖伪造正文、路径、服务器、通信文件和预设', () => {
  const window = mainWindow()
  const files = filePathsFor(path.resolve(os.tmpdir(), 'trusted-generation-test-only'))
  for (const mode of ['items', 'map']) {
    const config = request(mode)
    Object.assign(config, { scriptContent: 'UNTRUSTED_SCRIPT_MUST_NOT_EXECUTE', scriptPath: path.join(os.tmpdir(), 'untrusted.py'), requiresStashTabOcr: true })
    Object.assign(config.generationConfig, { filePaths: { itemInfoFile: 'UNTRUSTED_COMMUNICATION_PATH' }, preset: { moduleTwo: { enabled: false } }, mapConfig: { method: 'UNTRUSTED_MAP_MODE' } })
    const trusted = prepareTrustedScriptRequest({ event: { sender: window.webContents }, config, mainWindow: window, filePaths: files, server: getServer('international') })
    assert.equal(trusted.scriptPath, path.join(files.tempDir, mode === 'items' ? 'crafting.py' : 'map_rolling.py'))
    assert.equal(trusted.generationConfig.serverId, 'international')
    assert.equal(trusted.generationConfig.language, 'en')
    assert.deepEqual(trusted.generationConfig.filePaths, files)
    assert.deepEqual(trusted.preset, { ...config.preset, localizationRevision: '' })
    assert.deepEqual(trusted.generationConfig.preset, { ...config.preset, localizationRevision: '' })
    assert.equal(trusted.requireStashTabOcr, false)
    assert.doesNotMatch(trusted.scriptContent, /UNTRUSTED_/)
    assert.match(trusted.scriptContent, /Scroll of Wisdom/)
    if (mode === 'map') assert.deepEqual(trusted.generationConfig.mapConfig, config.preset.map)
  }
})

test('中文生成继续使用国服通货规则，OCR依赖取自实际生成配置', () => {
  const window = mainWindow()
  const config = request()
  config.generationConfig.stashTabSelection.enabled = true
  config.requiresStashTabOcr = false
  const trusted = prepareTrustedScriptRequest({ event: { sender: window.webContents }, config, mainWindow: window, filePaths: filePathsFor(path.resolve(os.tmpdir(), 'trusted-cn-test-only')), server: getServer('cn') })
  assert.equal(trusted.generationConfig.language, 'zh-CN')
  assert.equal(trusted.requireStashTabOcr, true)
  assert.match(trusted.scriptContent, /改造石/)
})

test('国际服可信生成只接收主进程汉化版本，保留海图预设但拒绝启动', () => {
  const window = mainWindow()
  const config = request('map')
  const files = filePathsFor(path.resolve(os.tmpdir(), 'trusted-localization-test-only'))
  config.preset.localizationRevision = 'renderer-version'
  config.generationConfig.localizationSnapshot = { revision: 'renderer-version', entries: [] }
  const snapshot = { revision: 'managed-version', entries: [] }
  const create = server => prepareTrustedScriptRequest({ event: { sender: window.webContents }, config, mainWindow: window, filePaths: files, server: getServer(server), localizationSnapshot: snapshot })
  const trusted = create('international')
  assert.equal(trusted.preset.localizationRevision, 'managed-version')
  assert.equal(trusted.generationConfig.localizationSnapshot, snapshot)
  assert.equal(config.preset.localizationRevision, 'renderer-version')
  assert.equal(create('cn').generationConfig.localizationSnapshot, null)
  for (const field of ['targetKind', 'activeKind']) {
    config.preset.map = { method: 'alchemy', [field]: 'chart' }
    const before = structuredClone(config)
    assert.throws(() => create('international'), /海图/)
    assert.deepEqual(config, before)
    assert.doesNotThrow(() => create('cn'))
  }
})

function handlerHarness(t, { active = false, pythonAvailable = true } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'trusted-script-ipc-'))
  t.after(() => {
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()))
    fs.rmSync(directory, { recursive: true, force: true })
  })
  const files = filePathsFor(directory)
  const window = mainWindow()
  let overlay = mainWindow()
  const handlers = new Map()
  const effects = { kills: 0, clears: 0, watcherStops: 0, activations: 0, launches: [], watcherPresets: [] }
  let current = active ? { pid: 876, exitCode: null, signalCode: null, kill() { throw new Error('Existing task must not be killed') } } : null
  const sandbox = {
    fs, path, process, console, setTimeout: callback => queueMicrotask(callback),
    ipcMain: { handle: (name, callback) => handlers.set(name, callback) },
    prepareTrustedScriptRequest, CraftingCurrencyUsageLedger, resolveCraftingPython,
    resolveCraftingPythonAsync: _m2_resolveCraftingPythonAsync,
    handlePipeParseRequest: _m2_handlePipeParseRequest,
    normalizeMapStatsSnapshot: _m2_normalizeMapStatsSnapshot,
    batchRecoveryStore: createBatchRecoveryStore(),
    prepareCraftingOverlay: async () => {},
    createOverlayDispatcher: () => ({ readyPromise: Promise.resolve(), send() {} }),
    waitForScriptStartup: async () => ({ event: 'crafting-startup-succeeded' }),
    parseScriptEventLine: () => null,
    createPythonProcess: options => {
      effects.launches.push({ ...options, script: fs.readFileSync(options.scriptPath, 'utf8') })
      const child = new EventEmitter()
      child.pid = 456
      child.stdout = new EventEmitter()
      child.stderr = new EventEmitter()
      return { process: child, started: Promise.resolve(child) }
    }
  }
  const source = fs.readFileSync(ipcUrl, 'utf8')
    .replace(/^import\s+[\s\S]*?\sfrom\s+['"][^'"]+['"]\r?\n/gm, '')
    .replace(/\bexport\s+(?=(?:async\s+)?function)/g, '')
  vm.runInNewContext(`${source}\nglobalThis.register = registerPythonHandlers`, sandbox)
  sandbox.register({
    detectPythonPath: () => 'compatible-python', detectPythonPathWithModules: () => pythonAvailable ? 'compatible-python' : null,
    killPythonProcessTree: async () => { effects.kills += 1; return true },
    getCurrentScriptProcess: () => current, getCurrentScriptMode: () => 'items',
    setCurrentScriptProcess: child => { current = child }, clearCurrentScriptProcess: () => { effects.clears += 1; current = null }
  }, { getMainWindow: () => window, getOverlayWindow: () => overlay, activateGameWindow: async () => { effects.activations += 1; return { success: true } } }, {
    getFilePaths: () => files,
    startFileWatcher: preset => effects.watcherPresets.push(preset),
    stopFileWatcher: () => { effects.watcherStops += 1 }
  }, { server: getServer('international') })
  return { directory, files, window, overlay, effects, handlers, setOverlay: value => { overlay = value } }
}

for (const [mode, kind] of [['items', 'general'], ['items', 'essence'], ['items', 'harvest'], ['items', 'batch'], ['map', null]]) test(`制作浮窗重试可通过实际IPC启动${kind || mode}，仍由主进程生成可信脚本`, async t => {
  const harness = handlerHarness(t)
  const config = request(mode)
  if (mode === 'items') config.craftingKind = kind === 'batch' ? 'general' : kind
  if (kind === 'batch') {
    config.usageSessionId = 'usage-batch'
    config.batchRecoveryContext = {
      enabled: true, batchId: 'batch-1', scanId: 'scan-1', snapshotFingerprint: 'snapshot-1', completedIds: [],
      targets: [{ id: 'item-1', categoryId: 'ring', baseType: 'Coral Ring', displayName: 'Coral Ring', x: 0, y: 0, width: 1, height: 1, position: { x: 10, y: 20 } }]
    }
    config.generationConfig.batchConfig = config.batchRecoveryContext
  }
  config.scriptContent = 'UNTRUSTED_OVERLAY_SCRIPT'
  config.scriptPath = path.join(harness.directory, 'untrusted-overlay.py')
  const result = await harness.handlers.get('generate-and-execute-script')({ sender: harness.overlay.webContents }, config)
  assert.equal(result.success, true, result.error)
  assert.equal(harness.effects.launches.length, 1)
  const launch = harness.effects.launches[0]
  assert.equal(launch.scriptPath, path.join(harness.directory, mode === 'items' ? 'crafting.py' : 'map_rolling.py'))
  assert.doesNotMatch(launch.script, /UNTRUSTED_OVERLAY_SCRIPT/)
  assert.match(launch.script, /Scroll of Wisdom/)
  assert.equal(fs.existsSync(config.scriptPath), false)
})

for (const state of ['closed', 'contents-closed', 'replaced', 'missing']) test(`拒绝${state}制作浮窗且不干扰正在运行的任务`, async t => {
  const harness = handlerHarness(t, { active: true })
  const sender = harness.overlay.webContents
  if (state === 'closed') harness.overlay.isDestroyed = () => true
  if (state === 'contents-closed') sender.isDestroyed = () => true
  if (state === 'replaced') harness.setOverlay(mainWindow())
  if (state === 'missing') harness.setOverlay(null)
  const result = await harness.handlers.get('generate-and-execute-script')({ sender }, request())
  assert.equal(result.success, false)
  assert.equal(result.code, 'INVALID_SCRIPT_REQUEST')
  assert.equal(harness.effects.kills, 0)
  assert.equal(harness.effects.clears, 0)
  assert.equal(harness.effects.watcherStops, 0)
  assert.equal(harness.effects.activations, 0)
  assert.deepEqual(harness.effects.launches, [])
  assert.deepEqual(fs.readdirSync(harness.directory), [])
})

test('实际IPC拒绝外部发送者、raw-only、非法类型及生成失败，不干扰正在运行的任务', async t => {
  const harness = handlerHarness(t, { active: true })
  const valid = request()
  const invalid = [
    [{ sender: mainWindow().webContents }, valid],
    ...[harness.window.webContents, harness.overlay.webContents].flatMap(sender => [
      [{ sender }, { ...valid, mode: 'other' }],
      [{ sender }, { mode: 'items', preset: {}, scriptContent: 'raw-only' }],
      [{ sender }, { ...valid, generationConfig: { globalShortcuts: { end: 'F12";INJECTION' } } }],
      [{ sender }, { ...valid, batchRecoveryContext: { invalid: true } }]
    ])
  ]
  for (const [event, config] of invalid) {
    const result = await harness.handlers.get('generate-and-execute-script')(event, config)
    assert.equal(result.success, false)
  }
  assert.equal(harness.effects.kills, 0)
  assert.equal(harness.effects.clears, 0)
  assert.equal(harness.effects.watcherStops, 0)
  assert.equal(harness.effects.activations, 0)
  assert.deepEqual(harness.effects.launches, [])
  assert.deepEqual(fs.readdirSync(harness.directory), [])
})

test('批量目标与检查点双向缺失均拒绝，null和undefined同为缺失且不停止旧任务', async t => {
  const harness = handlerHarness(t, { active: true })
  const batch = {
    enabled: true, batchId: 'batch-1', scanId: 'scan-1', snapshotFingerprint: 'snapshot-1', completedIds: [],
    targets: [{ id: 'item-1', categoryId: 'ring', baseType: 'Coral Ring', displayName: 'Coral Ring', x: 0, y: 0, width: 1, height: 1, position: { x: 10, y: 20 } }]
  }
  for (const missing of [undefined, null]) for (const missingSide of ['checkpoint', 'generation']) {
    const config = request()
    config.usageSessionId = 'usage-1'
    config.generationConfig.batchConfig = missingSide === 'generation' ? missing : batch
    config.batchRecoveryContext = missingSide === 'checkpoint' ? missing : batch
    const result = await harness.handlers.get('generate-and-execute-script')({ sender: harness.window.webContents }, config)
    assert.equal(result.success, false, missingSide)
    assert.match(result.error, /同时提供/)
  }
  const config = request()
  config.usageSessionId = 'usage-1'
  config.generationConfig.batchConfig = batch
  config.batchRecoveryContext = batch
  assert.doesNotThrow(() => prepareTrustedScriptRequest({ event: { sender: harness.window.webContents }, config, mainWindow: harness.window, filePaths: harness.files }))
  for (const kind of ['general', 'essence', 'harvest']) {
    const config = request()
    config.craftingKind = kind
    config.generationConfig.batchConfig = null
    config.batchRecoveryContext = undefined
    assert.doesNotThrow(() => prepareTrustedScriptRequest({ event: { sender: harness.window.webContents }, config, mainWindow: harness.window, filePaths: harness.files }))
  }
  assert.equal(harness.effects.kills, 0)
  assert.equal(harness.effects.clears, 0)
  assert.equal(harness.effects.watcherStops, 0)
  assert.deepEqual(harness.effects.launches, [])
  assert.deepEqual(fs.readdirSync(harness.directory), [])
})

test('实际IPC写入和启动的均为主进程内置生成脚本，文件监听与生成使用相同预设', async t => {
  const harness = handlerHarness(t)
  const config = request('map')
  config.scriptContent = 'UNTRUSTED_SCRIPT_MUST_NOT_EXECUTE'
  config.scriptPath = path.join(harness.directory, 'untrusted.py')
  config.generationConfig.mapConfig = { targetKind: 'heist', method: 'UNTRUSTED_MAP_MODE' }
  const result = await harness.handlers.get('generate-and-execute-script')({ sender: harness.window.webContents }, config)
  assert.equal(result.success, true, result.error)
  assert.equal(harness.effects.launches.length, 1)
  const launch = harness.effects.launches[0]
  assert.equal(launch.scriptPath, path.join(harness.directory, 'map_rolling.py'))
  assert.doesNotMatch(launch.script, /UNTRUSTED_/)
  assert.match(launch.script, /Scroll of Wisdom/)
  assert.deepEqual(harness.effects.watcherPresets, [{ ...config.preset, localizationRevision: '' }])
  assert.equal(fs.existsSync(config.scriptPath), false)
})

test('缺少新任务所需的Python依赖时保留已有制作进程和文件监听', async t => {
  const harness = handlerHarness(t, { active: true, pythonAvailable: false })
  const result = await harness.handlers.get('generate-and-execute-script')({ sender: harness.window.webContents }, request())
  assert.equal(result.success, false)
  assert.match(result.error, /Python/)
  assert.equal(harness.effects.kills, 0)
  assert.equal(harness.effects.clears, 0)
  assert.equal(harness.effects.watcherStops, 0)
  assert.deepEqual(harness.effects.launches, [])
})

test('生成脚本及直接依赖被列入应用资源', () => {
  const files = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).build.files
  for (const file of ['src/utils/pythonScriptGenerator.js', 'src/utils/currencyPreflight.js', 'src/domains/items/affixConfig.js', 'src/domains/items/eldritchConfig.js', 'src/assets/scripts/crafting_template.py', 'src/assets/scripts/map_rolling_template.py']) assert.ok(files.includes(file), file)
})
})()
