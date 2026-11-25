import _m0__m0_test from 'node:test'
import _m0__m0_assert from 'node:assert/strict'
import _m0__m0_fs from 'node:fs'
import _m0__m0_os from 'node:os'
import _m0__m0_path from 'node:path'
import _m0__m0_vm from 'node:vm'
import { EventEmitter as _m0__m0_EventEmitter, once as _m0__m0_once } from 'node:events'
import { spawn as _m0__m0_spawn } from 'node:child_process'
import { pythonPath as _m0__m0_pythonPath } from './helpers/python.js'
import { InterfaceTitleRegistry as _m0__m0_InterfaceTitleRegistry } from '../electron/modules/interfaceDetection/titleRegistry.js'
import { createDetectionProcessDiagnostics as _m0__m0_createDetectionProcessDiagnostics } from '../electron/modules/interfaceDetection/processDiagnostics.js'
import { createEventLineParser as _m0__m0_createEventLineParser, waitForDetectionStartup as _m0__m0_waitForDetectionStartup, describeDetectionExit as _m0__m0_describeDetectionExit } from '../electron/modules/bag/orchestrator.js'
import { createStartupLogger as _m0__m0_createStartupLogger } from '../electron/modules/system/startupLog.js'
import _m0__m1_test from 'node:test'
import _m0__m1_assert from 'node:assert/strict'
import { readFileSync as _m0__m1_readFileSync } from 'node:fs'
import { createPinia as _m0__m1_createPinia } from 'pinia'
import { createServer as _m0__m1_createServer } from 'vite'
import { CURRENCY_POSITION_KEYS as _m0__m1_CURRENCY_POSITION_KEYS, createDefaultInventorySettings as _m0__m1_createDefaultInventorySettings, createEmptyCurrencyPositions as _m0__m1_createEmptyCurrencyPositions, createEmptyItemPosition as _m0__m1_createEmptyItemPosition } from '../src/utils/environmentDefaults.js'
import { DEFAULT_GLOBAL_SHORTCUTS as _m0__m1_DEFAULT_GLOBAL_SHORTCUTS } from '../src/utils/shortcutConfig.js'
import { FIXED_TIMING as _m0__m1_FIXED_TIMING, OPERATION_DELAY as _m0__m1_OPERATION_DELAY, OPERATION_TIMING_VERSION as _m0__m1_OPERATION_TIMING_VERSION } from '../src/utils/operationDelay.js'
import { normalizeChaosRecipeSettings as _m0__m1_normalizeChaosRecipeSettings } from '../src/stores/chaosRecipe.js'
import { validateCraftingConfig as _m0__m1_validateCraftingConfig, validateMapRollingConfig as _m0__m1_validateMapRollingConfig } from '../src/utils/validation.js'
import { createDefaultMapConfig as _m0__m1_createDefaultMapConfig } from '../src/utils/mapPresetMigration.js'
import { useFeatureModulesStore as _m0__m1_useFeatureModulesStore } from '../src/stores/featureModules.js'
import _m0__m2_test from 'node:test'
import _m0__m2_assert from 'node:assert/strict'
import { readFileSync as _m0__m2_readFileSync } from 'node:fs'
import { spawnSync as _m0__m2_spawnSync } from 'node:child_process'
import { generatePythonScript as _m0__m2_generatePythonScript, generateMapRollingScript as _m0__m2_generateMapRollingScript } from '../src/utils/pythonScriptGenerator.js'
import { pythonPath as _m0__m2_pythonPath } from './helpers/python.js'
import _m0__m3_test from 'node:test'
import _m0__m3_assert from 'node:assert/strict'
import { readFileSync as _m0__m3_readFileSync } from 'node:fs'
import { unlink as _m0__m3_unlink, writeFile as _m0__m3_writeFile } from 'node:fs/promises'
import { spawnSync as _m0__m3_spawnSync } from 'node:child_process'
import _m0__m3_path from 'node:path'
import { fileURLToPath as _m0__m3_fileURLToPath } from 'node:url'
import { scriptDistribution as _m0__m3_scriptDistribution, assertScriptDistribution as _m0__m3_assertScriptDistribution, withStagedScripts as _m0__m3_withStagedScripts } from '../scripts/runtime/scriptDistribution.js'
import _m1__m0_test from 'node:test'
import _m1__m0_assert from 'node:assert/strict'
import { readFileSync as _m1__m0_readFileSync } from 'node:fs'
import { fileURLToPath as _m1__m0_fileURLToPath } from 'node:url'
import { runPython as _m1__m0_runPython } from './helpers/python.js'
import { FIXED_TIMING as _m1__m0_FIXED_TIMING, OPERATION_DELAY as _m1__m0_OPERATION_DELAY, normalizeAutomationTiming as _m1__m0_normalizeAutomationTiming, normalizeFixedTiming as _m1__m0_normalizeFixedTiming, pythonAutomationTiming as _m1__m0_pythonAutomationTiming, pythonFixedTiming as _m1__m0_pythonFixedTiming } from '../src/utils/operationDelay.js'
import _m1__m1_test from 'node:test'
import _m1__m1_assert from 'node:assert/strict'
import { existsSync as _m1__m1_existsSync, readFileSync as _m1__m1_readFileSync, readdirSync as _m1__m1_readdirSync, statSync as _m1__m1_statSync } from 'node:fs'
import _m1__m1_path from 'node:path'
import { spawnSync as _m1__m1_spawnSync } from 'node:child_process'
import { fileURLToPath as _m1__m1_fileURLToPath } from 'node:url'
import _m1__m2_test from 'node:test'
import _m1__m2_assert from 'node:assert/strict'
import { runPython as _m1__m2_runPython } from './helpers/python.js'
import _m1__m3_test from 'node:test'
import _m1__m3_assert from 'node:assert/strict'
import _m1__m3_fs from 'node:fs'
import _m1__m3_path from 'node:path'
import _m1__m3_vm from 'node:vm'
import { EventEmitter as _m1__m3_EventEmitter } from 'node:events'
import { runPython as _m1__m3_runPython } from './helpers/python.js'
import { createEventLineParser as _m1__m3_createEventLineParser, waitForDetectionStartup as _m1__m3_waitForDetectionStartup, describeDetectionExit as _m1__m3_describeDetectionExit } from '../electron/modules/bag/orchestrator.js'
import { createDetectionProcessDiagnostics as _m1__m3_createDetectionProcessDiagnostics } from '../electron/modules/interfaceDetection/processDiagnostics.js'
import _m1__m4_test from 'node:test'
import _m1__m4_assert from 'node:assert/strict'
import { createServer as _m1__m4_createServer } from 'vite'

// === Merged from appLifecycleSlow.suite.test.js ===
await (async () => {
  const _m0_test = _m0__m0_test
  const _m0_assert = _m0__m0_assert
  const _m0_fs = _m0__m0_fs
  const _m0_os = _m0__m0_os
  const _m0_path = _m0__m0_path
  const _m0_vm = _m0__m0_vm
  const _m0_EventEmitter = _m0__m0_EventEmitter
  const _m0_once = _m0__m0_once
  const _m0_spawn = _m0__m0_spawn
  const _m0_pythonPath = _m0__m0_pythonPath
  const _m0_InterfaceTitleRegistry = _m0__m0_InterfaceTitleRegistry
  const _m0_createDetectionProcessDiagnostics = _m0__m0_createDetectionProcessDiagnostics
  const _m0_createEventLineParser = _m0__m0_createEventLineParser
  const _m0_waitForDetectionStartup = _m0__m0_waitForDetectionStartup
  const _m0_describeDetectionExit = _m0__m0_describeDetectionExit
  const _m0_createStartupLogger = _m0__m0_createStartupLogger
  const _m1_test = _m0__m1_test
  const _m1_assert = _m0__m1_assert
  const _m1_readFileSync = _m0__m1_readFileSync
  const _m1_createPinia = _m0__m1_createPinia
  const _m1_createServer = _m0__m1_createServer
  const _m1_CURRENCY_POSITION_KEYS = _m0__m1_CURRENCY_POSITION_KEYS
  const _m1_createDefaultInventorySettings = _m0__m1_createDefaultInventorySettings
  const _m1_createEmptyCurrencyPositions = _m0__m1_createEmptyCurrencyPositions
  const _m1_createEmptyItemPosition = _m0__m1_createEmptyItemPosition
  const _m1_DEFAULT_GLOBAL_SHORTCUTS = _m0__m1_DEFAULT_GLOBAL_SHORTCUTS
  const _m1_FIXED_TIMING = _m0__m1_FIXED_TIMING
  const _m1_OPERATION_DELAY = _m0__m1_OPERATION_DELAY
  const _m1_OPERATION_TIMING_VERSION = _m0__m1_OPERATION_TIMING_VERSION
  const _m1_normalizeChaosRecipeSettings = _m0__m1_normalizeChaosRecipeSettings
  const _m1_validateCraftingConfig = _m0__m1_validateCraftingConfig
  const _m1_validateMapRollingConfig = _m0__m1_validateMapRollingConfig
  const _m1_createDefaultMapConfig = _m0__m1_createDefaultMapConfig
  const _m1_useFeatureModulesStore = _m0__m1_useFeatureModulesStore
  const _m2_test = _m0__m2_test
  const _m2_assert = _m0__m2_assert
  const _m2_readFileSync = _m0__m2_readFileSync
  const _m2_spawnSync = _m0__m2_spawnSync
  const _m2_generatePythonScript = _m0__m2_generatePythonScript
  const _m2_generateMapRollingScript = _m0__m2_generateMapRollingScript
  const _m2_pythonPath = _m0__m2_pythonPath
  const _m3_test = _m0__m3_test
  const _m3_assert = _m0__m3_assert
  const _m3_readFileSync = _m0__m3_readFileSync
  const _m3_unlink = _m0__m3_unlink
  const _m3_writeFile = _m0__m3_writeFile
  const _m3_spawnSync = _m0__m3_spawnSync
  const _m3_path = _m0__m3_path
  const _m3_fileURLToPath = _m0__m3_fileURLToPath
  const _m3_scriptDistribution = _m0__m3_scriptDistribution
  const _m3_assertScriptDistribution = _m0__m3_assertScriptDistribution
  const _m3_withStagedScripts = _m0__m3_withStagedScripts
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const fs = _m0_fs
  const os = _m0_os
  const path = _m0_path
  const vm = _m0_vm
  const EventEmitter = _m0_EventEmitter
  const once = _m0_once
  const spawn = _m0_spawn
  const pythonPath = _m0_pythonPath
  const InterfaceTitleRegistry = _m0_InterfaceTitleRegistry
  const createDetectionProcessDiagnostics = _m0_createDetectionProcessDiagnostics
  const createEventLineParser = _m0_createEventLineParser
  const waitForDetectionStartup = _m0_waitForDetectionStartup
  const describeDetectionExit = _m0_describeDetectionExit
  const createStartupLogger = _m0_createStartupLogger
const source = fs.readFileSync(new URL('../electron/modules/interfaceDetection/coordinator.js', import.meta.url), 'utf8')
  .replace(/^import [\s\S]*? from ['"][^'"]+['"]\r?\n/gm, '')
  .replace('const moduleDir = path.dirname(fileURLToPath(import.meta.url))', "const moduleDir = '.'")
  .replace('export class InterfaceDetectionCoordinator', 'class InterfaceDetectionCoordinator')
const tick = () => new Promise(resolve => setImmediate(resolve))

function fakeChild() {
  const child = Object.assign(new EventEmitter(), { pid: 1234, exitCode: null, signalCode: null, killed: false })
  child.stdout = Object.assign(new EventEmitter(), { setEncoding() {} })
  child.stderr = Object.assign(new EventEmitter(), { setEncoding() {} })
  child.kill = () => { child.killed = true; return true }
  child.report = () => child.stdout.emit('data', 'EVENT {"event":"detection-state","foreground":true}\n')
  child.finish = (code = 0, signal = null) => {
    child.exitCode = code; child.signalCode = signal
    child.emit('exit', code, signal); child.emit('close', code, signal)
  }
  setImmediate(() => { child.emit('spawn'); child.report() })
  return child
}

function fixture(t, spawnChild = () => fakeChild(), brokenLogger = false) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-detection-diagnostic-'))
  const logger = createStartupLogger({ userDataPath: directory })
  const children = []
  const Coordinator = vm.runInNewContext(`${source}\nInterfaceDetectionCoordinator`, {
    app: { getPath: () => directory, getAppPath: () => directory, isPackaged: false }, path,
    fs: { ...fs, existsSync: () => true }, InterfaceTitleRegistry,
    createDetectionProcessDiagnostics, createEventLineParser, waitForDetectionStartup, describeDetectionExit,
    structuredClone, setTimeout, clearTimeout, process, console: { log() {}, error() {} },
    spawn: (...args) => { const child = spawnChild(...args); children.push(child); return child }
  })
  const coordinator = new Coordinator({ python: { detectPythonPath: () => pythonPath },
    fileWatcher: { getFilePaths: () => ({ tempDir: directory }) },
    logger: brokenLogger ? { record() { throw new Error('log unavailable') } } : logger })
  t.after(async () => {
    coordinator.cleanup()
    for (const child of children) {
      if (child.exitCode === null && !child.signalCode) {
        if (child.finish) child.finish()
        else { const closed = once(child, 'close'); child.kill(); await closed }
      }
    }
    await coordinator.draining
    fs.rmSync(directory, { recursive: true, force: true })
  })
  return { coordinator, children, logger,
    events: () => fs.readFileSync(logger.filePath, 'utf8').trim().split('\n').map(JSON.parse) }
}

test('异常退出保留关联、PID、最后事件、消费者、退出码并通知状态', async t => {
  const f = fixture(t), states = []
  f.coordinator.subscribe(state => states.push(state))
  await f.coordinator.registerConsumer('bag')
  f.children[0].finish(4294967295)
  const events = f.events()
  assert.equal(new Set(events.map(e => e.sessionId)).size, 1)
  assert.equal(new Set(events.map(e => e.message.match(/instanceId=([^ ]+)/)[1])).size, 1)
  const closed = events.find(e => e.phase === 'interface-detection-close')
  assert.equal(closed.reasonCode, 'unexpected')
  assert.match(closed.message, /childPid=1234 lastEventAt=\d+.*consumers=\["bag"\].*code=4294967295 signal=none/)
  assert.equal(states.at(-1).running, false)
  assert.equal(states.at(-1).exitCode, 4294967295)
  assert.ok(events.some(e => e.phase === 'interface-detection-ready'))
  assert.ok(events.some(e => e.phase === 'interface-detection-process-exit'))
  assert.equal(events.some(e => e.phase.startsWith('exit-')), false)
})

test('配置重启等待旧进程结束且旧实例单独记录，不覆盖新实例', async t => {
  const f = fixture(t)
  await f.coordinator.registerConsumer('bag')
  const previous = f.children[0]
  const updating = f.coordinator.updateConfig({ match_threshold: 0.9 })
  await tick()
  assert.equal(f.coordinator.getState().reloading, true)
  assert.equal(f.children.length, 1)
  previous.finish(null, 'SIGTERM')
  await updating
  assert.equal(f.coordinator.getState().running, true)
  assert.notEqual(f.coordinator.child, previous)
  const events = f.events()
  const close = events.find(e => e.phase === 'interface-detection-close')
  assert.equal(close.reasonCode, 'config_restart')
  assert.match(close.message, /signal=SIGTERM/)
  assert.equal(events.filter(e => e.phase === 'interface-detection-exit').length, 0)
  assert.equal(new Set(events.map(e => e.message.match(/instanceId=([^ ]+)/)[1])).size, 2)
})

test('无消费者和应用清理正常结束不会误报异常；诊断失败不影响检测', async t => {
  const f = fixture(t)
  await f.coordinator.registerConsumer('bag')
  f.coordinator.unregisterConsumer('bag')
  f.children[0].finish()
  await f.coordinator.registerConsumer('bag')
  f.coordinator.cleanup()
  f.children[1].finish()
  assert.deepEqual(f.events().filter(e => e.phase === 'interface-detection-close').map(e => e.reasonCode), ['no_consumers', 'application_cleanup'])
  const broken = fixture(t, () => fakeChild(), true)
  await broken.coordinator.registerConsumer('bag')
  assert.doesNotThrow(() => broken.children[0].finish(1))
  assert.equal(broken.coordinator.getState().exitCode, 1)
})

test('进程错误与有界 stderr 脱敏保留，不泄露完整输出', async t => {
  const f = fixture(t)
  await f.coordinator.registerConsumer('bag')
  const child = f.children[0]
  child.stderr.emit('data', `discarded-prefix${'x'.repeat(8000)} token=secret`)
  child.emit('error', new Error('test-process-error'))
  child.finish(1)
  const events = f.events()
  assert.ok(events.some(e => e.reasonCode === 'process_error'))
  assert.doesNotMatch(JSON.stringify(events), /discarded-prefix|secret/)
  assert.ok(events.every(e => e.message.length <= 4096))
})

test('隔离 Python 检测替身启用故障输出，真实终止仅影响测试子进程', { timeout: 15000 }, async t => {
  const f = fixture(t, (executable, _args, options) => {
    assert.equal(options.windowsHide, true)
    assert.equal(options.env.PYTHONFAULTHANDLER, '1')
    return spawn(executable, ['-c', 'import faulthandler,time; assert faulthandler.is_enabled(); print(\'EVENT {"event":"detection-state","foreground":true}\', flush=True); time.sleep(60)'], options)
  })
  await f.coordinator.registerConsumer('test_detector')
  const child = f.children[0]
  const closed = once(child, 'close')
  child.kill('SIGTERM')
  await closed
  const events = f.events()
  assert.ok(events.some(e => e.phase === 'interface-detection-start' && e.outcome === 'succeeded'))
  assert.ok(events.some(e => e.phase === 'interface-detection-process-exit'))
  assert.match(events.find(e => e.phase === 'interface-detection-close').message, new RegExp(`childPid=${child.pid} `))
  assert.equal(f.coordinator.getState().running, false)
  assert.equal(events.some(e => e.phase.startsWith('exit-')), false)
})
})()

// === Merged from environmentSpecificDefaults.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFileSync = _m1_readFileSync
  const createPinia = _m1_createPinia
  const createServer = _m1_createServer
  const CURRENCY_POSITION_KEYS = _m1_CURRENCY_POSITION_KEYS
  const createDefaultInventorySettings = _m1_createDefaultInventorySettings
  const createEmptyCurrencyPositions = _m1_createEmptyCurrencyPositions
  const createEmptyItemPosition = _m1_createEmptyItemPosition
  const DEFAULT_GLOBAL_SHORTCUTS = _m1_DEFAULT_GLOBAL_SHORTCUTS
  const FIXED_TIMING = _m1_FIXED_TIMING
  const OPERATION_DELAY = _m1_OPERATION_DELAY
  const OPERATION_TIMING_VERSION = _m1_OPERATION_TIMING_VERSION
  const normalizeChaosRecipeSettings = _m1_normalizeChaosRecipeSettings
  const validateCraftingConfig = _m1_validateCraftingConfig
  const validateMapRollingConfig = _m1_validateMapRollingConfig
  const createDefaultMapConfig = _m1_createDefaultMapConfig
  const useFeatureModulesStore = _m1_useFeatureModulesStore
function installStorage(settings) {
  const values = new Map()
  if (settings !== undefined) values.set('settings', JSON.stringify(settings))
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  }
  return values
}

test('设备相关默认工厂统一返回零值并保留背包业务阈值', () => {
  const currencies = createEmptyCurrencyPositions()
  assert.equal(Object.keys(currencies).length, CURRENCY_POSITION_KEYS.length)
  assert.ok(Object.values(currencies).every(point => point.x === 0 && point.y === 0))
  assert.deepEqual(createEmptyItemPosition(), { x: 0, y: 0 })
  assert.deepEqual(createDefaultInventorySettings().startPos, { x: 0, y: 0 })
  assert.deepEqual(createDefaultInventorySettings().slotSize, { w: 0, h: 0 })
  assert.equal(typeof createDefaultInventorySettings().emptySlotThreshold, 'number')
})

test('商城浮窗空偏移保持未配置，已有用户偏移原样兼容', () => {
  assert.equal(normalizeChaosRecipeSettings({}).controlOverlayOffset, null)
  assert.equal(normalizeChaosRecipeSettings({ controlOverlayOffset: null }).controlOverlayOffset, null)
  assert.deepEqual(
    normalizeChaosRecipeSettings({ controlOverlayOffset: { x: 123, y: 456 } }).controlOverlayOffset,
    { x: 123, y: 456 }
  )
})

test('制作和地图在零坐标下预检失败且运行路径先校验后调用输入进程', () => {
  const crafting = validateCraftingConfig({
    itemPosition: createEmptyItemPosition(),
    currencyPositions: createEmptyCurrencyPositions(),
    preset: null
  })
  assert.equal(crafting.isValid, false)
  assert.match(crafting.errors.join('\n'), /物品位置未配置/)

  const map = validateMapRollingConfig({
    inventory: createDefaultInventorySettings(),
    currencyPositions: createEmptyCurrencyPositions(),
    mapConfig: createDefaultMapConfig()
  })
  assert.equal(map.isValid, false)
  assert.match(map.errors.join('\n'), /背包首格坐标未配置/)
  assert.match(map.errors.join('\n'), /背包单格宽高未配置/)

  const service = readFileSync(new URL('../src/utils/scriptService.js', import.meta.url), 'utf8')
  const specializedStart = service.slice(service.indexOf('async function startSpecializedCrafting'), service.indexOf('async function startGeneralCrafting'))
  const itemStart = service.slice(service.indexOf('async function startGeneralCrafting'), service.indexOf('export async function startMapRolling'))
  const mapStart = service.slice(service.indexOf('export async function startMapRolling'), service.indexOf('export async function stopCrafting'))
  assert.ok(specializedStart.indexOf('validateSpecializedCraftingConfig') < specializedStart.indexOf('generatePythonScript'))
  assert.ok(itemStart.indexOf('validateCraftingConfig') < itemStart.indexOf('generatePythonScript'))
  assert.ok(mapStart.indexOf('validateMapRollingConfig') < mapStart.indexOf('generateMapRollingScript'))
})

test('批量制作公共校验保留背包网格并解除账号赛季依赖', () => {
  const point = { x: 100, y: 200 }
  const result = validateCraftingConfig({
    itemPosition: point,
    inventory: { startPos: point, slotSize: { w: 50, h: 50 } },
    authenticated: true,
    league: 'S30',
    batchSnapshot: { scanId: 'scan-1' },
    batchCandidateCount: 3,
    currencyPositions: { wisdom: point, transmutation: point, scouring: point, alteration: point },
    stashTabSelection: { enabled: false },
    preset: {
      batchCrafting: { enabled: true, categoryIds: ['flask'] },
      moduleTwo: {
        enabled: true,
        mode: 'alteration',
        affixGroups: [{ enabled: true, selectedAffixes: ['生命'] }]
      },
      moduleThree: { enabled: false },
      moduleEldritch: { enabled: false }
    }
  })

  assert.equal(result.isValid, true, result.errors.join('\n'))
  assert.doesNotMatch(result.errors.join('\n'), /国服账号登录|国服赛季|背包网格|本地背包扫描/)

  const service = readFileSync(new URL('../src/utils/scriptService.js', import.meta.url), 'utf8')
  const validationStart = service.indexOf('const validation = validateCraftingConfig({')
  const validationCall = service.slice(validationStart, service.indexOf('if (!validation.isValid)', validationStart))
  assert.match(validationCall, /inventory: settingsStore\.inventory/)
  assert.match(validationCall, /batchSnapshot: batchRecovery \? \{ scanId: batchRecovery\.scanId \} : batchStore\.snapshot/)
  assert.match(validationCall, /batchCandidateCount: batchRecovery[\s\S]*batchStore\.candidates\.length/)
  assert.doesNotMatch(validationCall, /authenticated:|accountStore|league:/)
})

test('新安装、已有保存值和重置设置遵循兼容策略', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { useSettingsStore } = await server.ssrLoadModule('/src/domains/settings/settingsStore.js')

    installStorage()
    const fresh = useSettingsStore(createPinia())
    assert.deepEqual(fresh.globalShortcuts, DEFAULT_GLOBAL_SHORTCUTS)
    assert.deepEqual(fresh.itemPosition, { x: 0, y: 0 })
    assert.deepEqual(fresh.inventory.startPos, { x: 0, y: 0 })
    assert.deepEqual(fresh.inventory.slotSize, { w: 0, h: 0 })
    assert.equal(fresh.operationDelayMs, OPERATION_DELAY.default)
    assert.equal(fresh.batchScanConfirmationSuppressed, false)
    assert.deepEqual(fresh.fixedTiming, FIXED_TIMING.defaults)
    assert.equal('adaptiveTiming' in fresh, false)
    assert.equal('adaptiveTimeoutMs' in fresh, false)

    const saved = {
      globalShortcuts: {
        ...DEFAULT_GLOBAL_SHORTCUTS,
        itemStart: 'F6',
        portal: 'B',
        priceCheck: 'F8',
        potionStart: 'F9',
        potionStop: 'F10',
        puzzleAnalyze: 'Alt+7',
        chaosRecipeStart: 'Alt+4',
        chaosRecipePause: 'Alt+5',
        chaosRecipeStop: 'Alt+6'
      },
      currencyPositions: { chaos: { x: 321, y: 654 } },
      inventory: { startPos: { x: 101, y: 202 }, slotSize: { w: 33, h: 44 } },
      itemPosition: { x: 777, y: 888 },
      operationTimingVersion: 2,
      operationDelayMs: 73,
      adaptiveTiming: true,
      adaptiveTimeoutMs: 999,
      fixedTiming: { modifierSettleMs: 34, keyHoldMs: 12 },
      batchScanConfirmationSuppressed: true,
      combatAssist: {
        potion: {
          health: { point: { x: 11, y: 22 }, keys: ['1'] },
          mana: { point: { x: 33, y: 44 }, keys: ['2'] }
        },
        portal: { openKey: 'Numpad1', clickPoint: { x: 55, y: 66 } }
      }
    }
    const savedStorage = installStorage(saved)
    savedStorage.set('featureModules:v1', JSON.stringify({ version: 1, disabledFeatureIds: ['tools'] }))
    const existingPinia = createPinia()
    const existing = useSettingsStore(existingPinia)
    const featureModules = useFeatureModulesStore(existingPinia)
    assert.equal(featureModules.isEnabled('tools'), false)
    assert.equal(existing.globalShortcuts.itemStart, 'F6')
    assert.equal(existing.globalShortcuts.portal, 'B')
    assert.equal(existing.globalShortcuts.priceCheck, 'F8')
    assert.equal('potionStart' in existing.globalShortcuts, false)
    assert.equal('potionStop' in existing.globalShortcuts, false)
    assert.equal('puzzleAnalyze' in existing.globalShortcuts, false)
    assert.equal('chaosRecipeStart' in existing.globalShortcuts, false)
    assert.equal('chaosRecipePause' in existing.globalShortcuts, false)
    assert.equal('chaosRecipeStop' in existing.globalShortcuts, false)
    assert.deepEqual(existing.currencyPositions.chaos, { x: 321, y: 654 })
    assert.deepEqual(existing.inventory.startPos, { x: 101, y: 202 })
    assert.deepEqual(existing.inventory.slotSize, { w: 33, h: 44 })
    assert.deepEqual(existing.itemPosition, { x: 777, y: 888 })
    assert.deepEqual(existing.combatAssist.potion.health.point, { x: 11, y: 22 })
    assert.equal(existing.combatAssist.portal.openKey, 'Numpad1')
    assert.equal(existing.operationDelayMs, 73)
    assert.equal(existing.batchScanConfirmationSuppressed, true)
    existing.updateBatchScanConfirmationSuppressed(false)
    assert.equal(JSON.parse(savedStorage.get('settings')).batchScanConfirmationSuppressed, false)
    existing.updateBatchScanConfirmationSuppressed(true)
    assert.deepEqual(existing.fixedTiming, {
      ...FIXED_TIMING.defaults,
      modifierSettleMs: 34,
      keyHoldMs: 12
    })
    assert.equal('adaptiveTiming' in existing, false)
    assert.equal('adaptiveTimeoutMs' in existing, false)
    const migrated = JSON.parse(savedStorage.get('settings'))
    assert.equal(migrated.operationTimingVersion, OPERATION_TIMING_VERSION)
    assert.equal(migrated.globalShortcuts.itemStart, 'F6')
    assert.equal(migrated.globalShortcuts.portal, 'B')
    assert.equal(migrated.globalShortcuts.priceCheck, 'F8')
    assert.equal('potionStart' in migrated.globalShortcuts, false)
    assert.equal('potionStop' in migrated.globalShortcuts, false)
    assert.equal('puzzleAnalyze' in migrated.globalShortcuts, false)
    assert.equal('chaosRecipeStart' in migrated.globalShortcuts, false)
    assert.equal('chaosRecipePause' in migrated.globalShortcuts, false)
    assert.equal('chaosRecipeStop' in migrated.globalShortcuts, false)
    assert.equal('adaptiveTiming' in migrated, false)
    assert.equal('adaptiveTimeoutMs' in migrated, false)

    existing.resetSettings()
    assert.equal(featureModules.isEnabled('tools'), true)
    assert.equal(savedStorage.has('featureModules:v1'), false)
    assert.deepEqual(existing.globalShortcuts, DEFAULT_GLOBAL_SHORTCUTS)
    assert.deepEqual(existing.itemPosition, { x: 0, y: 0 })
    assert.deepEqual(existing.inventory.startPos, { x: 0, y: 0 })
    assert.deepEqual(existing.inventory.slotSize, { w: 0, h: 0 })
    assert.deepEqual(existing.combatAssist.potion.health.keys, [])
    assert.equal(existing.combatAssist.portal.openKey, '')
    assert.equal(existing.operationDelayMs, OPERATION_DELAY.default)
    assert.equal(existing.batchScanConfirmationSuppressed, false)
    assert.deepEqual(existing.fixedTiming, FIXED_TIMING.defaults)
    assert.equal('adaptiveTiming' in existing, false)
    assert.equal('adaptiveTimeoutMs' in existing, false)
  } finally {
    await server.close()
  }
})
})()

// === Merged from pythonScriptGenerator.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const readFileSync = _m2_readFileSync
  const spawnSync = _m2_spawnSync
  const generatePythonScript = _m2_generatePythonScript
  const generateMapRollingScript = _m2_generateMapRollingScript
  const pythonPath = _m2_pythonPath
const craftingTemplate = readFileSync(new URL('../src/assets/scripts/crafting_template.py', import.meta.url), 'utf8')
const mapTemplate = readFileSync(new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url), 'utf8')
const base = {
  globalShortcuts: { end: 'F12' }, itemPosition: { x: 1, y: 2 }, currencyPositions: {},
  preset: { moduleTwo: { enabled: false }, moduleThree: { enabled: false }, moduleEldritch: { enabled: false } },
  inventory: {}, mapConfig: { method: 'alchemy', match: { blacklist: [] } }
}

test('共享生成器可在无window和Vite的Node环境生成，两种语言可显式覆盖服务器默认值', () => {
  assert.equal(globalThis.window, undefined)
  const english = generatePythonScript({ ...base, serverId: 'cn', language: 'en' }, craftingTemplate)
  const chinese = generatePythonScript({ ...base, serverId: 'international', language: 'zh-CN' }, craftingTemplate)
  assert.match(english, /"alteration":\s*\["Orb of Alteration","改造石"\]/)
  assert.match(chinese, /currency_expected_names = \{\}/)
  assert.match(generateMapRollingScript({ ...base, language: 'en' }, mapTemplate), /Orb of Alteration/)
  assert.throws(() => generateMapRollingScript({ ...base, language: 'unknown' }, mapTemplate), /语言/)
  assert.throws(() => generatePythonScript({ ...base, craftingKind: '\";print(1)#' }, craftingTemplate), /制作类型/)
})

test('生成器拒绝源码位置的快捷键、路径及插槽数字注入', () => {
  for (const [generate, template] of [[generatePythonScript, craftingTemplate], [generateMapRollingScript, mapTemplate]]) {
    assert.throws(() => generate({ ...base, globalShortcuts: { end: 'F1\");print(1)#' } }, template), /快捷键格式/)
    assert.throws(() => generate({ ...base, filePaths: { itemInfoFile: 'x"\nprint(1)#' } }, template), /通信路径/)
  }
  assert.throws(() => generatePythonScript({ ...base, preset: { ...base.preset, moduleThree: { enabled: true, color: { enabled: true, red: '0);print(1)#', green: 1, blue: 0 } } } }, craftingTemplate), /插槽数量/)
})

test('JSON字符串保留布尔词和模板标记，数据不得二次展开成Python源码', () => {
  const hostile = 'true false null {{DPI_AWARENESS}} ");print("injected")#'
  const script = generateMapRollingScript({ ...base, mapConfig: { ...base.mapConfig, match: { blacklist: [hostile], whitelist: ['safe'] } } }, mapTemplate)
  const result = spawnSync(pythonPath, ['-c', `import ast,json,sys
tree=ast.parse(sys.stdin.read())
node=next(n.value for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='map_config' for t in n.targets))
assert isinstance(node,ast.Call) and isinstance(node.func,ast.Attribute) and node.func.attr=='loads'
print(json.dumps(json.loads(ast.literal_eval(node.args[0]))['match']['blacklist']))`], { input: script, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [hostile])
})
})()

// === Merged from scriptDistribution.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const readFileSync = _m3_readFileSync
  const unlink = _m3_unlink
  const writeFile = _m3_writeFile
  const spawnSync = _m3_spawnSync
  const path = _m3_path
  const fileURLToPath = _m3_fileURLToPath
  const scriptDistribution = _m3_scriptDistribution
  const assertScriptDistribution = _m3_assertScriptDistribution
  const withStagedScripts = _m3_withStagedScripts
const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const config = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const manifest = JSON.parse(readFileSync(new URL('../scripts/runtime/manifest.json', import.meta.url), 'utf8'))
const python = path.join(projectRoot, '.runtime/python-runtime/python.exe')
const layout = scriptDistribution(projectRoot, config, manifest)

test('脚本清单覆盖所有源码脚本；新增分发脚本漏登必须失败', () => {
  const missing = { ...manifest, requiredScripts: manifest.requiredScripts.filter(p => !p.endsWith('/sanctum_ocr.py')) }
  assert.throws(() => scriptDistribution(projectRoot, config, missing), /清单漏登.*sanctum_ocr/)
  const additional = structuredClone(config)
  additional.build.extraResources.push({ from: 'scripts/new_worker.py', to: 'new_worker.py' })
  assert.throws(() => scriptDistribution(projectRoot, additional, manifest), /清单漏登.*new_worker/)
})

test('安装布局完整时隔离 Python 检查通过；删除任一目录依赖均会失败', async () => {
  await withStagedScripts(projectRoot, layout, async root => {
    assertScriptDistribution(root, layout, python)
    await unlink(path.join(root, 'interface_titles.py'))
    assert.throws(() => assertScriptDistribution(root, layout, python), /bag_auto_stash_template\.py:\d+: interface_titles -> interface_titles\.py missing/)
    // The intact unpacked copy must not hide the resources failure above.
    await unlink(path.join(root, 'app.asar.unpacked/src/assets/scripts/chart_mods_probe.py'))
    assert.throws(() => assertScriptDistribution(root, layout, python), /sanctum_ocr\.py:\d+: chart_mods_probe/)
  })
})

test('旧配置漏分发依赖也会失败，而不只是检测配置已声明但文件被删', async () => {
  const oldConfig = structuredClone(config)
  oldConfig.build.extraResources = oldConfig.build.extraResources.filter(r => r.to !== 'interface_titles.py')
  const oldLayout = scriptDistribution(projectRoot, oldConfig, manifest)
  await withStagedScripts(projectRoot, oldLayout, root => {
    assert.throws(() => assertScriptDistribution(root, oldLayout, python), /interface_titles -> interface_titles\.py missing/)
  })
})

test('AST 检查函数内 import 和 from 导入，不执行脚本', async () => {
  await withStagedScripts(projectRoot, layout, async root => {
    await writeFile(path.join(root, 'puzzle_auto_place.py'), 'raise RuntimeError("must not execute")\ndef lazy():\n    import sanctum_ocr\n    from sanctum_frames import FramePool\n')
    assert.throws(() => assertScriptDistribution(root, layout, python), /puzzle_auto_place\.py:3: sanctum_ocr/)
    assert.throws(() => assertScriptDistribution(root, layout, python), /puzzle_auto_place\.py:4: sanctum_frames/)
  })
})

test('安装布局真实延迟导入：合成图片驱动圣所与背包仓库检测共同上报匹配及未匹配', async () => {
  await withStagedScripts(projectRoot, layout, root => {
    const probe = fileURLToPath(new URL('./fixtures/packagedDetectionProbe.py', import.meta.url))
    const result = spawnSync(python, ['-I', '-B', probe], {
      cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000
    })
    assert.equal(result.status, 0, result.stderr || result.stdout)
    assert.equal(JSON.parse(result.stdout).matchedAndUnmatched, true)
  })
})
})()
})()

// === Merged from inputAndSafetySlow.suite.test.js ===
await (async () => {
  const _m0_test = _m1__m0_test
  const _m0_assert = _m1__m0_assert
  const _m0_readFileSync = _m1__m0_readFileSync
  const _m0_fileURLToPath = _m1__m0_fileURLToPath
  const _m0_runPython = _m1__m0_runPython
  const _m0_FIXED_TIMING = _m1__m0_FIXED_TIMING
  const _m0_OPERATION_DELAY = _m1__m0_OPERATION_DELAY
  const _m0_normalizeAutomationTiming = _m1__m0_normalizeAutomationTiming
  const _m0_normalizeFixedTiming = _m1__m0_normalizeFixedTiming
  const _m0_pythonAutomationTiming = _m1__m0_pythonAutomationTiming
  const _m0_pythonFixedTiming = _m1__m0_pythonFixedTiming
  const _m1_test = _m1__m1_test
  const _m1_assert = _m1__m1_assert
  const _m1_existsSync = _m1__m1_existsSync
  const _m1_readFileSync = _m1__m1_readFileSync
  const _m1_readdirSync = _m1__m1_readdirSync
  const _m1_statSync = _m1__m1_statSync
  const _m1_path = _m1__m1_path
  const _m1_spawnSync = _m1__m1_spawnSync
  const _m1_fileURLToPath = _m1__m1_fileURLToPath
  const _m2_test = _m1__m2_test
  const _m2_assert = _m1__m2_assert
  const _m2_runPython = _m1__m2_runPython
  const _m3_test = _m1__m3_test
  const _m3_assert = _m1__m3_assert
  const _m3_fs = _m1__m3_fs
  const _m3_path = _m1__m3_path
  const _m3_vm = _m1__m3_vm
  const _m3_EventEmitter = _m1__m3_EventEmitter
  const _m3_runPython = _m1__m3_runPython
  const _m3_createEventLineParser = _m1__m3_createEventLineParser
  const _m3_waitForDetectionStartup = _m1__m3_waitForDetectionStartup
  const _m3_describeDetectionExit = _m1__m3_describeDetectionExit
  const _m3_createDetectionProcessDiagnostics = _m1__m3_createDetectionProcessDiagnostics
  const _m4_test = _m1__m4_test
  const _m4_assert = _m1__m4_assert
  const _m4_createServer = _m1__m4_createServer
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const fileURLToPath = _m0_fileURLToPath
  const runPython = _m0_runPython
  const FIXED_TIMING = _m0_FIXED_TIMING
  const OPERATION_DELAY = _m0_OPERATION_DELAY
  const normalizeAutomationTiming = _m0_normalizeAutomationTiming
  const normalizeFixedTiming = _m0_normalizeFixedTiming
  const pythonAutomationTiming = _m0_pythonAutomationTiming
  const pythonFixedTiming = _m0_pythonFixedTiming
const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')
const bagScriptPath = fileURLToPath(new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url))
const chaosScriptPath = fileURLToPath(new URL('../src/assets/scripts/chaos_recipe_pick_template.py', import.meta.url))

const expectedDefaults = {
  modifierSettleMs: 20,
  keyHoldMs: 15,
  buttonHoldMs: 15,
  releaseSettleMs: 10,
  clipboardConfirmMs: 10,
  stashTabSettleMs: 10,
  stashSettleMs: 10,
  patchVerifyMs: 10
}

test('九项自动化时序默认值使用用户确认值', () => {
  assert.equal(OPERATION_DELAY.default, 40)
  assert.deepEqual(FIXED_TIMING.defaults, expectedDefaults)
  assert.deepEqual(normalizeFixedTiming(), expectedDefaults)
})

test('完整时序使用封闭投影并忽略旧自适应字段', () => {
  const timing = normalizeAutomationTiming({
    operationDelayMs: 0,
    adaptiveTiming: true,
    adaptiveTimeoutMs: 9000,
    fixedTiming: { buttonHoldMs: 7 }
  })
  assert.deepEqual(timing, {
    operationDelayMs: 0,
    fixedTiming: { ...expectedDefaults, buttonHoldMs: 7 }
  })
  assert.deepEqual(pythonAutomationTiming(timing), {
    operation_delay_ms: 0,
    fixed_timing: {
      modifier_settle_ms: 20,
      key_hold_ms: 15,
      button_hold_ms: 7,
      release_settle_ms: 10,
      clipboard_confirm_ms: 10,
      stash_tab_settle_ms: 10,
      stash_settle_ms: 10,
      patch_verify_ms: 10
    }
  })
})

test('固定时序保留任意非负有限用户值，缺失或无效值回退新默认', () => {
  assert.equal(normalizeFixedTiming({ clipboardConfirmMs: 0 }).clipboardConfirmMs, 0)
  assert.equal(normalizeFixedTiming({ clipboardConfirmMs: 5000 }).clipboardConfirmMs, 5000)
  assert.equal(normalizeFixedTiming({ modifierSettleMs: -1 }).modifierSettleMs, 20)
  assert.equal(normalizeFixedTiming({ keyHoldMs: '35' }).keyHoldMs, 35)
  assert.deepEqual(pythonFixedTiming(), {
    modifier_settle_ms: 20,
    key_hold_ms: 15,
    button_hold_ms: 15,
    release_settle_ms: 10,
    clipboard_confirm_ms: 10,
    stash_tab_settle_ms: 10,
    stash_settle_ms: 10,
    patch_verify_ms: 10
  })
})

test('设置与运行时协议不再持久化或传递自适应字段', () => {
  for (const relativePath of [
    '../src/domains/settings/settingsStore.js',
    '../src/utils/bagService.js',
    '../src/utils/chaosRecipeService.js',
    '../src/utils/combatService.js',
    '../src/utils/scriptService.js',
    '../src/domains/puzzle/PuzzleView.vue',
    '../electron/modules/ipc/chaosRecipe.js',
    '../electron/modules/puzzle/service.js'
  ]) {
    const content = source(relativePath)
    assert.doesNotMatch(content, /adaptiveTiming|adaptiveTimeoutMs/, relativePath)
  }
  const operationDelay = source('../src/utils/operationDelay.js')
  assert.doesNotMatch(operationDelay, /ADAPTIVE_TIMING|timing_mode|adaptive_timeout_ms/)
})

test('背包与商城配方剪贴板确认完整使用固定等待值', () => {
  const code = `
import importlib.util, json, sys, types
sys.dont_write_bytecode = True
def load(name, path):
 spec = importlib.util.spec_from_file_location(name, path)
 module = importlib.util.module_from_spec(spec)
 spec.loader.exec_module(module)
 module.mouse = types.SimpleNamespace(Controller=lambda: object())
 module.keyboard = types.SimpleNamespace(Controller=lambda: object())
 return module
bag = load("bag", ${JSON.stringify(bagScriptPath)})
chaos = load("chaos", ${JSON.stringify(chaosScriptPath)})
config = {"operation_delay_ms": 40, "fixed_timing": {"clipboard_confirm_ms": 17}}
bag.apply_fixed_timing(config)
chaos.apply_fixed_timing(config)
print(json.dumps([bag.InputController(config).clipboard_delay, chaos.InputController(config).clipboard_timeout]))
`
  assert.deepEqual(runPython(code), [0.017, 0.017])
})

test('设置页始终显示固定结果等待并为九项延迟提供问号说明', () => {
  const view = source('../src/domains/settings/SettingsView.vue')
  assert.doesNotMatch(view, /自适应等待|adaptiveTiming|adaptiveTimeoutMs/)
  assert.doesNotMatch(view, /v-if="!adaptiveTiming"/)
  assert.match(view, />固定结果等待</)
  assert.match(view, /TIMING_FIELD_HELP/)
  assert.equal((view.match(/timing-help-trigger/g) || []).length >= 2, true)
  for (const label of ['自动操作等待', '组合键稳定', '按键保持', '鼠标点击保持', '释放后稳定', '剪贴板/空格确认', '选仓后生效等待', '存仓后生效等待', '画面变化验证等待']) {
    assert.match(view, new RegExp(label))
  }
})
})()

// === Merged from automationTimingProtocol.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const existsSync = _m1_existsSync
  const readFileSync = _m1_readFileSync
  const readdirSync = _m1_readdirSync
  const statSync = _m1_statSync
  const path = _m1_path
  const spawnSync = _m1_spawnSync
  const fileURLToPath = _m1_fileURLToPath
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = relative => readFileSync(path.join(projectRoot, relative), 'utf8')
const bundledPython = path.join(projectRoot, '.runtime', 'python-runtime', 'python.exe')
const python = existsSync(bundledPython) ? bundledPython : 'python'

function runPython(code) {
  const result = spawnSync(python, ['-c', code], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1' }
  })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

test('所有游戏输入链路把完整协议送到实际 Python 脚本', () => {
  const consumers = [
    ['electron/modules/ipc/bag.js', /pythonAutomationTiming\(config\)/],
    ['electron/modules/stashPickup/manager.js', /pythonAutomationTiming\(this\.runtime\)/],
    ['electron/modules/junfeng/manager.js', /pythonAutomationTiming\(this\.runtime\)/],
    ['electron/modules/chaosRecipe/automation.js', /pythonAutomationTiming\(this\.config\)/],
    ['electron/modules/puzzle/service.js', /pythonAutomationTiming\(\{ operationDelayMs, fixedTiming \}\)/],
    ['electron/modules/ipc/combat.js', /pythonAutomationTiming\(payload\.automationTiming\)/],
    ['src/utils/pythonScriptGenerator.js', /pythonAutomationTiming\(normalizedTiming\)/]
  ]
  for (const [file, pattern] of consumers) assert.match(source(file), pattern, file)

  for (const file of [
    'src/assets/scripts/bag_auto_stash_template.py',
    'src/assets/scripts/chaos_recipe_pick_template.py',
    'src/assets/scripts/junfeng_highlight_pickup.py',
    'src/assets/scripts/stash_tab_selector.py',
    'src/assets/scripts/puzzle_auto_place.py',
    'src/assets/scripts/combat_assist_template.py'
  ]) {
    const content = source(file)
    assert.match(content, /operation_delay_ms/, `${file} 未读取悬停配置`)
    assert.match(content, /fixed_timing/, `${file} 未读取物理输入配置`)
  }
})

test('0ms、自定义值和大值不经过隐藏下限，君锋复用同一控制器', { skip: !existsSync(bundledPython) }, () => {
  const bagPath = path.join(projectRoot, 'src', 'assets', 'scripts', 'bag_auto_stash_template.py')
  const junfeng = source('src/assets/scripts/junfeng_highlight_pickup.py')
  const result = runPython(`
import importlib.util, json, types
spec=importlib.util.spec_from_file_location("bag", ${JSON.stringify(bagPath)})
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.mouse=types.SimpleNamespace(Controller=lambda:object())
m.keyboard=types.SimpleNamespace(Controller=lambda:object())
values=[]
for delay in (0,137,9000):
 c=m.InputController({"operation_delay_ms":delay,"fixed_timing":{"clipboard_confirm_ms":10}})
 values.append([c.mouse_move_delay,c.clipboard_delay])
print(json.dumps(values))
`)
  assert.deepEqual(result, [[0, 0.01], [0.137, 0.01], [9, 0.01]])
  assert.match(junfeng, /InputController\(config\)/)
  assert.match(junfeng, /normalize_operation_delay\(config\.get\("operation_delay_ms"\)\)/)
})

test('动作边界禁止重新引入裸数字等待或旧字段', () => {
  const forbiddenByFile = new Map([
    ['src/assets/scripts/puzzle_auto_place.py', [/POINTER_SETTLE_MIN_SECONDS/, /BUTTON_HOLD_MIN_SECONDS/, /operationDelayMs/, /max\(delay,\s*0\./]],
    ['src/assets/scripts/stash_pickup_template.py', [/operationDelayMs/, /max\(0\.02/, /max\(0\.08/]],
    ['src/assets/scripts/chaos_recipe_pick_template.py', [/self\.delay\s*=\s*max\(0\.02/, /self\.delay\s*\*\s*4/]],
    ['src/assets/scripts/stash_tab_selector.py', [/SCROLL_DELAY_SECONDS/, /mouse\.click\(/]],
    ['src/assets/scripts/map_rolling_template.py', [/TIMING_MODE/, /ADAPTIVE_TIMEOUT/, /clipboard_read_delay/]],
    ['src/assets/scripts/crafting_template.py', [/clipboard_read_delay/]],
    ['src/utils/pythonScriptGenerator.js', [/time\.sleep\(0\.05\)/, /DELAY_CLIPBOARD/]]
  ])
  for (const [file, patterns] of forbiddenByFile) {
    const content = source(file)
    for (const pattern of patterns) assert.doesNotMatch(content, pattern, `${file}: ${pattern}`)
  }

  for (const file of ['src', 'electron', 'shared']) {
    assert.doesNotMatch(sourceTree(file), /adaptiveTiming|adaptiveTimeoutMs|timing_mode|adaptive_timeout_ms/, file)
  }
})

function sourceTree(relativeDirectory) {
  const root = path.join(projectRoot, relativeDirectory)
  return readdirSync(root, { recursive: true })
    .filter(entry => /\.(?:js|cjs|vue|py)$/.test(entry) && statSync(path.join(root, entry)).isFile())
    .map(entry => source(path.join(relativeDirectory, entry)))
    .join('\n')
}
})()

// === Merged from interfaceTitlesUnmatched.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const runPython = _m2_runPython
test('圣所地图标题未匹配：开启 report_unmatched 输出明确 false，默认无键，环境失配不产出', () => {
  const result = runPython(`
import sys, json, base64
sys.path.insert(0, 'src/assets/scripts')
import numpy as np, cv2
from interface_titles import match_titles
template = np.zeros((10, 20), np.uint8); template[:, :10] = 255
png = base64.b64encode(cv2.imencode('.png', template)[1]).decode()
env = {'width': 40, 'height': 30, 'dpi': 96}
entry = {'png': png, 'region': {'x': 5, 'y': 7, 'width': 20, 'height': 10}, 'environment': env}
miss = np.random.default_rng(7).integers(0, 256, (30, 40), dtype=np.uint8)
print(json.dumps({
  'default': match_titles(miss, {'sanctum-map': entry}, env),
  'explicit': match_titles(miss, {'sanctum-map': entry}, env, report_unmatched=True),
  'envMismatch': match_titles(miss, {'sanctum-map': entry}, {'width': 40, 'height': 30, 'dpi': 120}, report_unmatched=True)
}))`)
  assert.deepEqual(result.default, {})
  assert.deepEqual(result.explicit, { 'sanctum-map': { matched: false } })
  assert.deepEqual(result.envMismatch, {})
})
})()

// === Merged from sharedTitleLatency.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const fs = _m3_fs
  const path = _m3_path
  const vm = _m3_vm
  const EventEmitter = _m3_EventEmitter
  const runPython = _m3_runPython
  const createEventLineParser = _m3_createEventLineParser
  const waitForDetectionStartup = _m3_waitForDetectionStartup
  const describeDetectionExit = _m3_describeDetectionExit
  const createDetectionProcessDiagnostics = _m3_createDetectionProcessDiagnostics
const read = file => fs.readFileSync(new URL(file, import.meta.url), 'utf8')

test('局部标题仅搜索框选附近，隔离坏图、坏区域并保留环境检查', () => {
  const result = runPython(`
import sys,json,base64,numpy as np,cv2
sys.path.insert(0,'src/assets/scripts')
from interface_titles import match_titles
env={'width':200,'height':100,'dpi':144}
t=np.random.default_rng(42).integers(0,255,(10,25),dtype=np.uint8)
raw=base64.b64encode(cv2.imencode('.png',t)[1]).decode()
entry={'png':raw,'environment':env,'region':{'x':70,'y':20,'width':25,'height':10}}
image=np.zeros((100,200),dtype=np.uint8); image[28:38,78:103]=t
shapes=[]; original=cv2.matchTemplate
def spy(view,*args):
 shapes.append(list(view.shape)); return original(view,*args)
cv2.matchTemplate=spy
issues={}
templates={'good':entry,'missing':{**entry,'region':None},'negative':{**entry,'region':{**entry['region'],'x':-1}},'size':{**entry,'region':{**entry['region'],'width':24}},'bad':{**entry,'png':'!!!!'},'outside':{**entry,'region':{**entry['region'],'x':199}}}
found=match_titles(image,templates,env,.95,anchored=True,issues=issues)
far=np.zeros_like(image); far[50:60,130:155]=t
absent=match_titles(far,{'good':entry},env,.95,anchored=True)
wrong=[match_titles(image,{'good':entry},{**env,k:v},.95,anchored=True) for k,v in [('dpi',96),('width',201),('height',101)]]
print(json.dumps({'found':found,'issues':issues,'shapes':shapes,'absent':absent,'wrong':wrong}))
`)
  assert.deepEqual(result.found.good.region, { x: 78, y: 28, width: 25, height: 10 })
  assert.deepEqual(Object.keys(result.found), ['good'])
  assert.equal(Object.keys(result.issues).length, 5)
  assert.ok(Object.values(result.issues).every(message => message.includes('重新框选')))
  assert.ok(result.shapes.every(([h, w]) => h === 26 && w === 41))
  assert.deepEqual(result.absent, {})
  assert.deepEqual(result.wrong, [{}, {}, {}])
})

test('坏圣所模板不阻断三次背包命中与周期心跳，关闭后无圣所截图', () => {
  const result = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
import bag_auto_stash_template as b
env={'left':0,'top':0,'right':200,'bottom':100,'width':200,'height':100,'dpi':144}
b.is_game_foreground=lambda:True; b.get_game_client_bounds=lambda:env
original=b.InterfaceMatcher
class Matcher(original):
 def _load_templates(self): self.templates={'inventory':None,'stash':None}
 def _capture(self,region): return np.zeros((100,200),dtype=np.uint8)
 def check_interface(self): return {'stashMatched':True,'inventoryMatched':True,'rewardMatched':False,'allflameReceiverMatched':False},{}
b.InterfaceMatcher=Matcher
events=[]; sleeps=[]
b.emit=lambda event,**data:events.append({'event':event,**data})
def sleep(seconds):
 sleeps.append(seconds)
 if len(sleeps)==4: b.is_running=False
b.time.sleep=sleep; b.is_running=True
b.run_detection({'interface_titles':{'sanctum-map':{'png':'!!!!','environment':env}}})
m=Matcher({}); m._capture=lambda region: (_ for _ in ()).throw(AssertionError('unexpected capture'))
disabled=m.check_titles(env)
print(json.dumps({'events':events,'sleeps':sleeps,'disabled':disabled}))
`)
  assert.equal(result.events.length, 5)
  assert.deepEqual(result.events.map(e => e.ready), [false, false, false, true, true])
  assert.ok(result.events.slice(1).every(e => e.titleIssues['sanctum-map'].includes('重新框选')))
  assert.deepEqual(result.sleeps, [.2, .2, .2, .2])
  assert.deepEqual(result.disabled, {})
})

test('公共标题只截取局部物理区域，负坐标与边缘裁剪还原客户区位置', () => {
  const result = runPython(`
import sys,json,base64,numpy as np,cv2
sys.path.insert(0,'src/assets/scripts')
import bag_auto_stash_template as b
env={'width':200,'height':100,'dpi':144}
t=np.random.default_rng(12).integers(0,255,(10,25),dtype=np.uint8)
raw=base64.b64encode(cv2.imencode('.png',t)[1]).decode()
results=[]
for x,y in [(70,20),(0,0),(175,90)]:
 image=np.zeros((100,200),dtype=np.uint8); image[y:y+10,x:x+25]=t
 entry={'png':raw,'environment':env,'region':{'x':x,'y':y,'width':25,'height':10}}
 matcher=b.InterfaceMatcher({'interface_titles':{'sanctum-map':entry}}); captures=[]
 def capture(r):
  captures.append(r); return image[r['top']+50:r['bottom']+50,r['left']+300:r['right']+300]
 matcher._capture=capture
 found=matcher.check_titles({**env,'left':-300,'top':-50,'right':-100,'bottom':50})
 results.append({'found':found,'captures':captures})
print(json.dumps(results))
`)
  for (const [i, [x, y]] of [[70, 20], [0, 0], [175, 90]].entries()) {
    assert.deepEqual(result[i].found['sanctum-map'].region, { x, y, width: 25, height: 10 })
    assert.equal(result[i].captures.length, 1)
    const r = result[i].captures[0]
    assert.ok(r.right - r.left <= 41 && r.bottom - r.top <= 26)
    assert.ok(r.left >= -300 && r.top >= -50 && r.right <= -100 && r.bottom <= 50)
  }
})

function coordinatorFixture() {
  const source = read('../electron/modules/interfaceDetection/coordinator.js')
    .replace(/^import [\s\S]*? from ['"][^'"]+['"]\r?\n/gm, '')
    .replace('const moduleDir = path.dirname(fileURLToPath(import.meta.url))', "const moduleDir = '.'")
    .replace('export class InterfaceDetectionCoordinator', 'class InterfaceDetectionCoordinator')
  const children = [], writes = [], logs = []
  let alive = 0, maxAlive = 0, fail = false, autoStart = true
  class Registry {
    templates = { 'sanctum-map': { png: 'map' }, 'sanctum-altar': { png: 'altar' } }
    set(key, value) { if (value) this.templates[key] = value; else delete this.templates[key] }
  }
  const Coordinator = vm.runInNewContext(`${source}\nInterfaceDetectionCoordinator`, {
    app: { getPath: () => '.', getAppPath: () => '.', isPackaged: false }, path,
    fs: { existsSync: () => true, writeFileSync: (_file, value) => writes.push(JSON.parse(value)) },
    InterfaceTitleRegistry: Registry, createEventLineParser, waitForDetectionStartup, describeDetectionExit, createDetectionProcessDiagnostics,
    structuredClone, setTimeout, clearTimeout, process: { env: {} }, console: { log() {}, error() {} },
    spawn: () => {
      if (fail) { fail = false; throw new Error('injected spawn failure') }
      const child = new EventEmitter()
      child.stdout = Object.assign(new EventEmitter(), { setEncoding() {} })
      child.stderr = Object.assign(new EventEmitter(), { setEncoding() {} })
      child.exitCode = null; child.signalCode = null; child.killed = false
      child.kill = () => { child.killed = true; return true }
      child.close = () => { alive--; child.exitCode = 0; child.emit('close', 0) }
      child.report = patch => child.stdout.emit('data', 'EVENT ' + JSON.stringify({ event: 'detection-state', foreground: true, ready: true, ...patch }) + '\n')
      children.push(child); maxAlive = Math.max(maxAlive, ++alive)
      if (autoStart) setImmediate(() => child.report({}))
      return child
    }
  })
  const coordinator = new Coordinator({ python: { detectPythonPath: () => 'python' },
    fileWatcher: { getFilePaths: () => ({ tempDir: '.' }) }, logger: { record: event => logs.push(event) } })
  return { coordinator, children, writes, logs, maxAlive: () => maxAlive,
    failNext: () => { fail = true }, manualStart: () => { autoStart = false } }
}
const tick = () => new Promise(resolve => setImmediate(resolve))

test('按需只下发地图标题，注销即时清空，旧进程关闭后才重启', async () => {
  const f = coordinatorFixture(), c = f.coordinator
  await c.registerConsumer('bag', { templates: { inventory_title: 'inventory' } })
  assert.deepEqual(f.writes[0].interface_titles, {})
  const enable = c.registerConsumer('sanctum-control'); await tick()
  assert.equal(f.children.length, 1)
  assert.equal(f.children[0].killed, true)
  f.children[0].close(); await enable
  assert.deepEqual(Object.keys(f.writes[1].interface_titles), ['sanctum-map'])
  assert.equal(Object.keys(c.getTitleConfig().templates).length, 2)
  f.children[1].report({ interfaces: { 'sanctum-map': { matched: true } } })
  c.unregisterConsumer('sanctum-control')
  assert.deepEqual(Object.keys(c.getState().interfaces), [])
  f.children[1].report({ interfaces: { 'sanctum-map': { matched: true } } })
  assert.deepEqual(Object.keys(c.getState().interfaces), [])
  await tick(); f.children[1].close(); await c.lifecycle
  assert.deepEqual(f.writes[2].interface_titles, {})
  assert.equal(c.getState().running, true)
  assert.equal(f.maxAlive(), 1)
  c.cleanup(); f.children[2].close()
})

test('快速切换收敛最新需求，非公共模板更新不重启，启动失败后可恢复', async () => {
  const f = coordinatorFixture(), c = f.coordinator
  await c.registerConsumer('bag', {})
  const on = c.registerConsumer('sanctum-control')
  c.unregisterConsumer('sanctum-control')
  await on; await c.lifecycle
  assert.equal(f.children.length, 1)
  await c.setTitle('sanctum-altar', { png: 'updated' })
  assert.equal(f.children.length, 1)
  const update = c.updateConfig({ match_threshold: .91 }); await tick()
  f.failNext(); f.children[0].close()
  await assert.rejects(update, /injected spawn failure/)
  await c.updateConfig({ match_threshold: .92 })
  assert.equal(f.writes.at(-1).match_threshold, .92)
  assert.equal(f.maxAlive(), 1)
  c.cleanup(); f.children.at(-1).close()
})

test('地图模板更新串行重载，旧配置事件不能覆盖新配置，问题独立于背包失败状态', async () => {
  const f = coordinatorFixture(), c = f.coordinator
  await c.registerConsumer('sanctum-control')
  assert.match(c.getTitleConfig().issues['sanctum-map'], /重新框选/)
  const update = c.setTitle('sanctum-map', { png: 'new-map', region: { x: 5, y: 5, width: 20, height: 10 }, environment: { width: 200, height: 100 } })
  await tick()
  f.children[0].report({ interfaces: { 'sanctum-map': { matched: true } } })
  assert.equal(Object.keys(c.getState().interfaces).length, 0)
  f.children[0].close(); await update
  assert.equal(f.writes.at(-1).interface_titles['sanctum-map'].png, 'new-map')
  f.children[1].report({ titleIssues: { 'sanctum-map': '坏图，请重新框选' } })
  assert.equal(c.getState().ready, true)
  assert.equal(c.getState().reason, '')
  assert.match(c.getTitleConfig().issues['sanctum-map'], /重新框选/)
  assert.equal(f.maxAlive(), 1)
  c.cleanup(); f.children[1].close()
})

test('启动尚未就绪时停止，不复活旧状态，重新注册等待旧进程关闭', async () => {
  const f = coordinatorFixture(), c = f.coordinator
  f.manualStart()
  const first = c.registerConsumer('bag'); await tick()
  c.unregisterConsumer('bag')
  const second = c.registerConsumer('bag')
  f.children[0].report({}); await first; await tick()
  assert.equal(c.getState().running, false)
  assert.equal(f.children.length, 1)
  f.children[0].close(); await tick()
  f.children[1].report({}); await second
  assert.equal(f.maxAlive(), 1)
  c.cleanup(); f.children[1].close()
})

test('背包窗口重复同步无原生显隐，截图隐藏后可恢复', () => {
  const source = read('../electron/modules/window/manager.js').match(/export function updateBagStashOverlay\(snapshot\) \{[\s\S]*?\n\}/)[0].replace('export ', '')
  let visible = false, shows = 0, hides = 0, sends = 0
  const window = { webContents: { isLoadingMainFrame: () => false }, isVisible: () => visible,
    showInactive() { shows++; visible = true }, hide() { hides++; visible = false } }
  const sync = vm.runInNewContext(`${source}\nupdateBagStashOverlay`, {
    bagStashOverlaySnapshot: null, createBagStashOverlayWindow: () => window, publishBagStashOverlayState: () => sends++
  })
  for (let i = 0; i < 10; i++) sync({ visible: true })
  assert.equal(shows, 1); assert.equal(sends, 10)
  visible = false; sync({ visible: true }); assert.equal(shows, 2)
  for (let i = 0; i < 10; i++) sync({ visible: false })
  assert.equal(hides, 1)
})
})()

// === Merged from shortcutEmptyPython.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const createServer = _m4_createServer
test('制作与地图脚本生成拒绝空紧急停止且不再隐式回退', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript, generateMapRollingScript } = await server.ssrLoadModule('/src/utils/python.js')
    assert.throws(() => generatePythonScript({
      globalShortcuts: { end: ' ' },
      currencyPositions: {},
      itemPosition: {},
      preset: {
        moduleTwo: { enabled: false },
        moduleThree: { enabled: false },
        moduleEldritch: { enabled: false }
      },
      filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' }
    }), /全局紧急停止快捷键不能为空/)
    assert.throws(() => generateMapRollingScript({
      globalShortcuts: { end: '' },
      currencyPositions: {},
      inventory: {},
      mapConfig: {}
    }), /全局紧急停止快捷键不能为空/)
  } finally {
    await server.close()
  }
})
})()
})()
