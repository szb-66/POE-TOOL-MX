import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { EventEmitter as _m0_EventEmitter } from 'node:events'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { FaustusManager as _m0_FaustusManager, sanitizeFaustusItemEvent as _m0_sanitizeFaustusItemEvent } from '../electron/modules/faustus/manager.js'
import { normalizeFaustusStartRequest as _m0_normalizeFaustusStartRequest } from '../electron/modules/faustus/schema.js'
import { createFaustusRunSnapshot as _m0_createFaustusRunSnapshot } from '../src/utils/faustusConfig.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { FAUSTUS_CURRENCY as _m1_FAUSTUS_CURRENCY, createDefaultFaustusConfig as _m1_createDefaultFaustusConfig, formatFaustusReasonCode as _m1_formatFaustusReasonCode, formatFaustusValidationError as _m1_formatFaustusValidationError, isFaustusPriceLower as _m1_isFaustusPriceLower, normalizeFaustusConfig as _m1_normalizeFaustusConfig, planFaustusReprice as _m1_planFaustusReprice, validateFaustusConfig as _m1_validateFaustusConfig } from '../src/utils/faustusPricing.js'
import { FAUSTUS_CONFIG_STORAGE_KEY as _m1_FAUSTUS_CONFIG_STORAGE_KEY, createFaustusConfigRepository as _m1_createFaustusConfigRepository, createFaustusRunSnapshot as _m1_createFaustusRunSnapshot } from '../src/utils/faustusConfig.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { deriveInventoryGridFromRegion as _m2_deriveInventoryGridFromRegion } from '../src/utils/inventorySettings.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { readFileSync as _m3_readFileSync } from 'node:fs'
import { AutomationLock as _m3_AutomationLock } from '../electron/modules/automation/lock.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { mkdtemp as _m4_mkdtemp, writeFile as _m4_writeFile, rm as _m4_rm } from 'node:fs/promises'
import { tmpdir as _m4_tmpdir } from 'node:os'
import _m4_path from 'node:path'
import { createHash as _m4_createHash } from 'node:crypto'
import { ModelAvailability as _m4_ModelAvailability, validateModelFiles as _m4_validateModelFiles } from '../electron/modules/junfeng/modelAvailability.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { readFileSync as _m5_readFileSync } from 'node:fs'
import { formatJunfengButtonLabel as _m5_formatJunfengButtonLabel, normalizeJunfengProgress as _m5_normalizeJunfengProgress } from '../electron/modules/junfeng/progress.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { readFileSync as _m6_readFileSync } from 'node:fs'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { VENDOR_GROUPS as _m7_VENDOR_GROUPS } from '../src/domains/regex/vendorData.js'
import { localizeVendorGroups as _m7_localizeVendorGroups } from '../src/domains/regex/vendorLanguage.js'
import { buildVendorTokens as _m7_buildVendorTokens, generateVendorRegex as _m7_generateVendorRegex } from '../src/domains/regex/vendorRegex.js'
import { createDefaultVendorConfig as _m7_createDefaultVendorConfig } from '../src/domains/regex/vendorConfig.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { ChaosRecipeService as _m8_ChaosRecipeService } from '../electron/modules/chaosRecipe/service.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { buildVendorTokens as _m9_buildVendorTokens, generateVendorRegex as _m9_generateVendorRegex, REGEX_LENGTH_LIMIT as _m9_REGEX_LENGTH_LIMIT } from '../src/domains/regex/vendorRegex.js'
import { cleanVendorConfig as _m9_cleanVendorConfig, createDefaultVendorConfig as _m9_createDefaultVendorConfig, migrateLegacyVendorConfig as _m9_migrateLegacyVendorConfig } from '../src/domains/regex/vendorConfig.js'
import { VENDOR_GROUPS as _m9_VENDOR_GROUPS, VENDOR_REGEX_CORPUS as _m9_VENDOR_REGEX_CORPUS } from '../src/domains/regex/vendorData.js'
import { expressionMatches as _m9_expressionMatches, hasMinimumHanFragment as _m9_hasMinimumHanFragment } from '../src/domains/regex/compactExpression.js'

// === Merged from faustusElectron.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const EventEmitter = _m0_EventEmitter
  const readFileSync = _m0_readFileSync
  const FaustusManager = _m0_FaustusManager
  const sanitizeFaustusItemEvent = _m0_sanitizeFaustusItemEvent
  const normalizeFaustusStartRequest = _m0_normalizeFaustusStartRequest
  const createFaustusRunSnapshot = _m0_createFaustusRunSnapshot
const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const validConfig = () => ({
  version: 1,
  chaosPerDivine: '200',
  bands: [{ id: 'all', start: '1', end: '', rangeCurrency: 'chaos', discountPercent: '10', outputCurrency: 'chaos' }],
  gridCalibration: { left: 10, top: 20, right: 1210, bottom: 1220, displayId: 'display-1', scaleFactor: 1 }
})

function childProcess() {
  const child = new EventEmitter()
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  child.stdout.setEncoding = () => {}
  child.stderr.setEncoding = () => {}
  child.exitCode = null
  child.signalCode = null
  child.killed = false
  child.kill = signal => {
    child.killed = true
    child.signalCode = signal
    child.exitCode = 0
    queueMicrotask(() => child.emit('close', 0, signal))
    return true
  }
  return child
}

const createActivation = (overrides = {}) => ({
  activateGame: async () => ({ success: true, code: 'game-activated' }),
  activateMain: async () => ({ success: true, code: 'main-activated' }),
  ...overrides
})

const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function startupFixture(overrides = {}) {
  const events = [], children = [], locks = [], feedback = []
  const visible = []
  const manager = new FaustusManager({
    python: { resolvePythonRuntimeAsync: async () => ({ ready: true, path: 'python.exe' }) },
    fileWatcher: { getFilePaths: () => ({ tempDir: process.cwd() }) },
    fileSystem: { existsSync: () => true, mkdirSync() {}, writeFileSync() {}, rmSync() {} },
    scriptPath: () => 'fixed-faustus.py',
    windowActivation: createActivation(),
    foregroundState: () => ({ available: true, gameForeground: true }),
    automationLock: {
      acquire: () => { locks.push('acquire'); return { success: true } },
      release: () => locks.push('release')
    },
    getMainWindow: () => ({ isDestroyed: () => false, webContents: { send: (_channel, event) => events.push(event) } }),
    processFactory: runtime => { const child = childProcess(); children.push({ child, runtime }); return child },
    loadingFeedback: {
      begin: () => { const token = `token-${feedback.length}`; feedback.push(['begin', token]); return token },
      finish: token => feedback.push(['finish', token]),
      handoff: token => feedback.push(['handoff', token]),
      update() {}
    },
    resolveDisplayBounds: () => ({ x: 0, y: 0, width: 1920, height: 1080 }),
    feedbackOverlay: {
      showRunning: (_state, { onVisible }) => { visible.push(onVisible); return `session-${visible.length}` },
      updateProgress: (_id, state) => feedback.push(['progress', state]),
      hide() {}
    },
    ...overrides
  })
  return { manager, events, children, locks, feedback, visible }
}

test('慢依赖检测期间立即反馈、拒绝重入，停止后不启动旧任务', async () => {
  const pending = deferred()
  const f = startupFixture({ python: { resolvePythonRuntimeAsync: () => pending.promise } })
  const start = f.manager.start({ config: validConfig() })
  assert.equal(f.manager.getStatus().status, 'preparing')
  assert.equal(f.events[0].state.stage, 'preparing')
  assert.equal(f.feedback[0][0], 'begin')
  await new Promise(resolve => setImmediate(resolve))
  await assert.rejects(f.manager.start({ config: validConfig() }), /正在运行/)
  assert.equal(f.children.length, 0)
  f.manager.stop('shortcut')
  pending.resolve({ ready: true, path: 'python.exe' })
  assert.equal((await start).status, 'stopped')
  assert.equal(f.children.length, 0)
  assert.deepEqual(f.locks, ['acquire', 'release'])
})

test('旧准备请求迟到失败不清理新运行，运行时只解析一次', async () => {
  const pending = deferred()
  let calls = 0
  const f = startupFixture({ python: {
    resolvePythonRuntimeAsync: () => ++calls === 1 ? pending.promise : Promise.resolve({ ready: true, path: 'resolved.exe' })
  } })
  const old = f.manager.start({ config: validConfig() })
  f.manager.stop('shortcut')
  await f.manager.start({ config: validConfig() })
  pending.reject(new Error('old runtime failure'))
  await old
  assert.equal(calls, 2)
  assert.equal(f.children.length, 1)
  assert.equal(f.children[0].runtime.pythonPath, 'resolved.exe')
  assert.equal(f.manager.getStatus().status, 'running')
  assert.deepEqual(f.locks, ['acquire', 'release', 'acquire'])
  f.manager.stop()
})

test('游戏激活等待中停止后不启动，旧浮窗可见回调不结束新准备', async () => {
  const activation = deferred(), runtime = deferred()
  let calls = 0
  const f = startupFixture({
    python: { resolvePythonRuntimeAsync: () => ++calls === 3 ? runtime.promise : Promise.resolve({ ready: true, path: 'python.exe' }) },
    windowActivation: createActivation({ activateGame: () => calls === 1 ? activation.promise : Promise.resolve({ success: true }) })
  })
  const old = f.manager.start({ config: validConfig() })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(f.manager.getStatus().stage, 'activating')
  f.manager.stop('shortcut')
  activation.resolve({ success: true })
  await old
  assert.equal(f.children.length, 0)
  await f.manager.start({ config: validConfig() })
  const oldVisible = f.visible[0]
  f.manager.stop()
  const next = f.manager.start({ config: validConfig() })
  oldVisible()
  assert.equal(f.feedback.filter(([kind]) => kind === 'handoff').length, 0)
  f.manager.stop()
  runtime.resolve({ ready: true, path: 'python.exe' })
  await next
})

test('阶段事件同步到页面和浮窗，失败清理准备反馈与锁', async () => {
  const f = startupFixture()
  await f.manager.start({ config: validConfig() })
  const child = f.children[0].child
  child.stdout.emit('data', 'EVENT {"event":"stage","stage":"submitting"}\n')
  assert.equal(f.manager.getStatus().stage, 'submitting')
  assert.equal(f.feedback.at(-1)[1].label, '正在确认提交结果')
  child.stdout.emit('data', 'EVENT {"event":"stage","stage":"untrusted"}\n')
  assert.equal(f.manager.getStatus().stage, 'submitting')
  f.manager.stop()
  assert.equal(f.manager.getStatus().stage, '')
  const failed = startupFixture({ python: { resolvePythonRuntimeAsync: async () => { throw new Error('runtime failed') } } })
  await assert.rejects(failed.manager.start({ config: validConfig() }), /runtime failed/)
  assert.deepEqual(failed.locks, ['acquire', 'release'])
  assert.equal(failed.feedback.at(-1)[0], 'finish')
  assert.equal(failed.events.at(-1).state.reasonCode, 'start_failed')
  assert.equal(failed.children.length, 0)
})

test('浮士德 preload 与 IPC 只暴露固定操作且每个处理器校验主窗口 sender', () => {
  const preload = source('electron/preload.cjs')
  const ipc = source('electron/modules/ipc/faustus.js')
  const api = source('src/api/electron.js')
  const schema = source('electron/modules/faustus/schema.js')
  const manager = source('electron/modules/faustus/manager.js')
  const index = source('electron/modules/ipc/index.js')
  for (const token of [
    'faustus-status', 'faustus-grid-pick', 'faustus-start', 'faustus-stop', 'faustus-event'
  ]) assert.match(`${preload}\n${ipc}`, new RegExp(token))
  assert.doesNotMatch(`${preload}\n${ipc}\n${api}\n${schema}\n${manager}`, /faustus-price-window-test|testFaustusPriceWindow|testPriceWindow|priceRecognitionCalibrationKey|normalizeFaustusPriceWindowTestRequest/)
  assert.match(ipc, /assertMainWindowSender\(event, getMainWindow\)/)
  assert.equal((ipc.match(/ipcMain\.handle\([^\n]+invoke\(getMainWindow/g) || []).length, 4)
  assert.match(index, /registerFaustusHandlers\(faustus, window, getMainWindow\)/)
  assert.doesNotMatch(preload, /faustus.*(?:scriptPath|permission|mouse|keyboard)/i)
  const main = source('electron/main.js')
  const emergency = source('electron/modules/ipc/emergencyStop.js')
  assert.match(main, /new FaustusManager\(/)
  assert.match(main, /faustus:\s*faustusManager/)
  assert.match(main, /faustusManager\?\.cleanup\(\)/)
  assert.match(emergency, /managerAction\('faustus', '浮士德市集改价', faustus, \['preparing', 'running'\]\)/)
})

test('浮士德开始请求拒绝 renderer 注入脚本、权限和通用输入字段', () => {
  assert.deepEqual(normalizeFaustusStartRequest({ config: validConfig() }), { config: createFaustusRunSnapshot(validConfig()) })
  for (const forbidden of [
    { scriptPath: 'other.py' }, { permission: 'user' }, { click: { x: 1, y: 2 } }, { keyboard: ['Enter'] }
  ]) {
    assert.throws(() => normalizeFaustusStartRequest({ config: validConfig(), ...forbidden }), /不支持的浮士德请求字段/)
  }
})

test('manager 取得锁后只启动一个包含预检与输入的固定进程', async () => {
  const modes = []
  const children = []
  const locks = []
  const manager = new FaustusManager({
    python: { resolvePythonRuntimeAsync: async () => ({ ready: true, path: 'python.exe' }) },
    fileWatcher: { getFilePaths: () => ({ tempDir: process.cwd() }) },
    windowActivation: createActivation(),
    foregroundState: () => ({ available: true, gameForeground: true }),
    automationLock: {
      acquire: owner => { locks.push(['acquire', owner]); return { success: true } },
      release: owner => { locks.push(['release', owner]) }
    },
    fileSystem: { existsSync: () => true, mkdirSync: () => {}, writeFileSync: () => {} },
    processFactory: ({ mode }) => {
      modes.push(mode)
      const child = childProcess()
      children.push(child)
      return child
    },
    scriptPath: () => 'fixed-faustus.py'
  })

  const state = await manager.start({ config: validConfig() })
  assert.equal(state.status, 'running')
  assert.deepEqual(modes, ['run'])
  assert.deepEqual(locks, [['acquire', '浮士德市集改价']])
  await assert.rejects(() => manager.start({ config: validConfig() }), /正在运行/)
  assert.equal(children.filter(child => !child.killed).length, 1, '只能保留一个输入进程')
  manager.stop('user')
  manager.stop('user')
  assert.equal(children[0].killed, true)
  assert.deepEqual(locks.at(-1), ['release', '浮士德市集改价'])
})

test('整页改价正常完成后恢复并聚焦助手窗口', async () => {
  const actions = []
  const runChild = childProcess()
  const manager = new FaustusManager({
    python: { resolvePythonRuntimeAsync: async () => ({ ready: true, path: 'python.exe' }) },
    fileWatcher: { getFilePaths: () => ({ tempDir: process.cwd() }) },
    windowActivation: createActivation({
      activateMain: async () => {
        actions.push('restore', 'show', 'focus')
        return { success: true, code: 'main-activated' }
      }
    }),
    foregroundState: () => ({ available: true, gameForeground: true }),
    automationLock: { acquire: () => ({ success: true }), release: () => {} },
    fileSystem: { existsSync: () => true, mkdirSync: () => {}, writeFileSync: () => {}, rmSync: () => {} },
    getMainWindow: () => ({
      isDestroyed: () => false,
      isMinimized: () => true,
      restore: () => actions.push('restore'),
      show: () => actions.push('show'),
      focus: () => actions.push('focus'),
      webContents: { isDestroyed: () => false, send: () => {} }
    }),
    processFactory: () => runChild,
    scriptPath: () => 'fixed-faustus.py'
  })

  await manager.start({ config: validConfig() })
  runChild.stdout.emit('data', 'EVENT {"event":"completed","processed":3,"total":3}\n')
  assert.equal(manager.getStatus().status, 'completed')
  assert.deepEqual(actions, ['restore', 'show', 'focus'])
})

test('manager 在配置、DPI 或 OCR 依赖失败时不创建进程和输入', async () => {
  let spawned = 0
  const make = overrides => new FaustusManager({
    python: { resolvePythonRuntimeAsync: async () => ({ ready: true, path: 'python.exe' }) },
    fileWatcher: { getFilePaths: () => ({ tempDir: process.cwd() }) },
    windowActivation: createActivation(),
    foregroundState: () => ({ available: true, gameForeground: true }),
    automationLock: { acquire: () => ({ success: true }), release: () => {} },
    fileSystem: { existsSync: () => true, mkdirSync: () => {}, writeFileSync: () => {} },
    processFactory: () => { spawned += 1; return childProcess() },
    scriptPath: () => 'fixed-faustus.py',
    ...overrides
  })

  await assert.rejects(() => make({ python: { resolvePythonRuntimeAsync: async () => ({ ready: false, path: null }) } }).start({ config: validConfig() }), /OCR/)
  await assert.rejects(() => make().start({ config: { ...validConfig(), gridCalibration: null } }), /校准/)
  await assert.rejects(() => make().start({ config: { ...validConfig(), gridCalibration: { ...validConfig().gridCalibration, scaleFactor: 0 } } }), /DPI/)
  assert.equal(spawned, 0)
})

test('游戏激活失败时释放浮士德锁且不写配置、不创建进程', async () => {
  let spawned = 0
  let written = 0
  let released = 0
  const manager = new FaustusManager({
    python: { resolvePythonRuntimeAsync: async () => ({ ready: true, path: 'python.exe' }) },
    fileWatcher: { getFilePaths: () => ({ tempDir: process.cwd() }) },
    windowActivation: createActivation({ activateGame: async () => ({ success: false, code: 'focus-refused' }) }),
    automationLock: { acquire: () => ({ success: true }), release: () => { released += 1 } },
    fileSystem: { existsSync: () => true, mkdirSync: () => {}, writeFileSync: () => { written += 1 } },
    processFactory: () => { spawned += 1; return childProcess() },
    scriptPath: () => 'fixed-faustus.py'
  })
  await assert.rejects(() => manager.start({ config: validConfig() }), /focus-refused/)
  assert.equal(spawned, 0)
  assert.equal(written, 0)
  assert.equal(released, 1)
})

test('浮士德准备反馈持续到专用识别浮层真实显示后再交接', async () => {
  const feedbackEvents = []
  let onVisible = null
  const manager = new FaustusManager({
    python: { resolvePythonRuntimeAsync: async () => ({ ready: true, path: 'python.exe' }) },
    fileWatcher: { getFilePaths: () => ({ tempDir: process.cwd() }) },
    windowActivation: createActivation({
      activateGame: async () => { feedbackEvents.push('activate'); return { success: true, code: 'game-activated' } }
    }),
    loadingFeedback: {
      begin: () => { feedbackEvents.push('begin'); return 'faustus-loading' },
      finish: () => feedbackEvents.push('finish'),
      handoff: () => feedbackEvents.push('handoff')
    },
    feedbackOverlay: {
      showRunning: (_snapshot, options) => { onVisible = options?.onVisible; return 1 },
      hide: () => {}
    },
    resolveDisplayBounds: () => ({ x: 0, y: 0, width: 1920, height: 1080 }),
    automationLock: { acquire: () => ({ success: true }), release: () => {} },
    fileSystem: { existsSync: () => true, mkdirSync: () => {}, writeFileSync: () => {}, rmSync: () => {} },
    processFactory: () => childProcess(),
    scriptPath: () => 'fixed-faustus.py'
  })

  await manager.start({ config: validConfig() })
  assert.deepEqual(feedbackEvents, ['begin', 'activate'])
  assert.equal(typeof onVisible, 'function')
  onVisible()
  assert.deepEqual(feedbackEvents, ['begin', 'activate', 'handoff'])
  manager.stop('user')
})

test('manager 只从固定资源注入通用格子模型和冻结占位且不接受 renderer 路径', async () => {
  let written = null
  const child = childProcess()
  const manager = new FaustusManager({
    python: { resolvePythonRuntimeAsync: async () => ({ ready: true, path: 'python.exe' }) },
    fileWatcher: { getFilePaths: () => ({ tempDir: process.cwd() }) },
    windowActivation: createActivation(),
    foregroundState: () => ({ available: true, gameForeground: true }),
    automationLock: { acquire: () => ({ success: true }), release: () => {} },
    fileSystem: { existsSync: () => true, mkdirSync: () => {}, writeFileSync: (_path, value) => { written = JSON.parse(value) }, rmSync: () => {} },
    processFactory: () => child,
    scriptPath: () => 'fixed-faustus.py'
  })
  await manager.start({ config: { ...validConfig(), occupancyModel: { modelPath: 'renderer-injected.onnx' } } })
  assert.match(written.model_path, /src[\\/]assets[\\/]models[\\/]junfeng-highlight[\\/]model\.onnx$/)
  assert.match(written.manifest_path, /src[\\/]assets[\\/]models[\\/]junfeng-highlight[\\/]manifest\.json$/)
  assert.equal(written.item_footprints.schemaVersion, 1)
  assert.ok(Object.keys(written.item_footprints.items).length > 0)
  assert.doesNotMatch(JSON.stringify(written), /renderer-injected/)
  assert.equal(Object.hasOwn(written, 'emptyConfidenceThreshold'), false)
  manager.stop('user')
})

test('manager 仅转发字段白名单并在前台丢失、紧急停止和清理时释放输入', async () => {
  const sent = []
  const listeners = []
  const runChild = childProcess()
  const manager = new FaustusManager({
    python: { resolvePythonRuntimeAsync: async () => ({ ready: true, path: 'python.exe' }) },
    fileWatcher: { getFilePaths: () => ({ tempDir: process.cwd() }) },
    windowActivation: createActivation(),
    foregroundState: () => ({ available: true, gameForeground: true }),
    subscribeForeground: listener => { listeners.push(listener); return () => listeners.splice(0) },
    automationLock: { acquire: () => ({ success: true }), release: () => {} },
    fileSystem: { existsSync: () => true, mkdirSync: () => {}, writeFileSync: () => {} },
    getMainWindow: () => ({ isDestroyed: () => false, webContents: { send: (...args) => sent.push(args) } }),
    processFactory: () => runChild,
    scriptPath: () => 'fixed-faustus.py'
  })
  await manager.start({ config: validConfig() })
  runChild.stdout.emit('data', 'EVENT {"event":"item","itemName":"短名","grid":"2,3","oldPrice":100,"oldCurrency":"chaos","newPrice":90,"newCurrency":"chaos","reasonCode":"repriced","clipboard":"secret","fingerprint":"secret"}\n')
  const item = sent.find(([, payload]) => payload?.type === 'item')?.[1]?.item
  assert.deepEqual(item, { itemName: '短名', grid: '2,3', oldPrice: 100, oldCurrency: 'chaos', newPrice: 90, newCurrency: 'chaos', reasonCode: 'repriced' })
  listeners[0]({ available: true, gameForeground: false })
  assert.equal(manager.getStatus().status, 'stopped')
  assert.equal(runChild.killed, true)
  manager.cleanup()
  assert.equal(listeners.length, 0)
})

test('manager 对脚本成功、跳过与终止事件只转发稳定原因码和脱敏字段', async () => {
  const sanitized = sanitizeFaustusItemEvent({
    itemName: 'Authorization: Bearer-secret C:\\Users\\A\\private',
    grid: '1,1', oldPrice: 100, oldCurrency: 'chaos', newPrice: 90, newCurrency: 'chaos',
    reasonCode: 'repriced', clipboard: '完整物品', fingerprint: 'sha256', cookie: 'secret'
  })
  assert.equal(Object.keys(sanitized).sort().join(','), 'grid,itemName,newCurrency,newPrice,oldCurrency,oldPrice,reasonCode')
  assert.doesNotMatch(JSON.stringify(sanitized), /Bearer-secret|Users|完整物品|sha256|cookie/i)
  assert.equal(sanitizeFaustusItemEvent({ reasonCode: 'Authorization' }).reasonCode, 'unknown')

  const sent = []
  const removed = []
  const runChild = childProcess()
  const manager = new FaustusManager({
    python: { resolvePythonRuntimeAsync: async () => ({ ready: true, path: 'python.exe' }) },
    fileWatcher: { getFilePaths: () => ({ tempDir: process.cwd() }) },
    windowActivation: createActivation(),
    foregroundState: () => ({ available: true, gameForeground: true }),
    automationLock: { acquire: () => ({ success: true }), release: () => {} },
    fileSystem: { existsSync: () => true, mkdirSync: () => {}, writeFileSync: () => {}, rmSync: path => removed.push(path) },
    getMainWindow: () => ({ isDestroyed: () => false, webContents: { send: (...args) => sent.push(args) } }),
    processFactory: () => runChild,
    scriptPath: () => 'fixed-faustus.py'
  })
  await manager.start({ config: validConfig() })
  runChild.stdout.emit('data', 'EVENT {"event":"progress","processed":1,"total":144}\n')
  runChild.stdout.emit('data', 'EVENT {"event":"item","itemName":"测试","grid":"1,1","reasonCode":"no_matching_band"}\n')
  runChild.stdout.emit('data', 'EVENT {"event":"aborted","reasonCode":"game_not_foreground","clipboard":"secret"}\n')
  assert.equal(manager.getStatus().status, 'stopped')
  assert.equal(manager.getStatus().reasonCode, 'game_not_foreground')
  assert.equal(manager.getStatus().processed, 1)
  assert.equal(sent.some(([, payload]) => payload?.item?.reasonCode === 'no_matching_band'), true)
  assert.equal(removed.length >= 1, true, '运行配置应在结束后清理')
})
})()

// === Merged from faustusPricing.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const FAUSTUS_CURRENCY = _m1_FAUSTUS_CURRENCY
  const createDefaultFaustusConfig = _m1_createDefaultFaustusConfig
  const formatFaustusReasonCode = _m1_formatFaustusReasonCode
  const formatFaustusValidationError = _m1_formatFaustusValidationError
  const isFaustusPriceLower = _m1_isFaustusPriceLower
  const normalizeFaustusConfig = _m1_normalizeFaustusConfig
  const planFaustusReprice = _m1_planFaustusReprice
  const validateFaustusConfig = _m1_validateFaustusConfig
  const FAUSTUS_CONFIG_STORAGE_KEY = _m1_FAUSTUS_CONFIG_STORAGE_KEY
  const createFaustusConfigRepository = _m1_createFaustusConfigRepository
  const createFaustusRunSnapshot = _m1_createFaustusRunSnapshot
const band = (overrides = {}) => ({
  id: 'band-1',
  start: '1',
  end: '100',
  rangeCurrency: FAUSTUS_CURRENCY.chaos,
  discountPercent: '10',
  outputCurrency: FAUSTUS_CURRENCY.chaos,
  ...overrides
})

const config = (overrides = {}) => ({
  version: 1,
  chaosPerDivine: '200',
  bands: [band()],
  gridCalibration: null,
  ...overrides
})

test('浮士德分段下限包含、上限不包含且最后一段可无上限', () => {
  const value = config({
    bands: [
      band({ id: 'low', start: '1', end: '100' }),
      band({ id: 'high', start: '100', end: '', discountPercent: '20' })
    ]
  })
  assert.equal(validateFaustusConfig(value).valid, true)
  assert.equal(planFaustusReprice({ oldPrice: 99, oldCurrency: 'chaos', config: value }).bandId, 'low')
  assert.equal(planFaustusReprice({ oldPrice: 100, oldCurrency: 'chaos', config: value }).bandId, 'high')
  assert.equal(planFaustusReprice({ oldPrice: 10000, oldCurrency: 'chaos', config: value }).bandId, 'high')
})

test('浮士德分段按比例换算后拒绝重叠、倒置和非末段无上限', () => {
  const overlap = config({
    bands: [
      band({ id: 'chaos', start: '1', end: '250' }),
      band({ id: 'divine', start: '1', end: '2', rangeCurrency: 'divine' })
    ]
  })
  assert.equal(validateFaustusConfig(overlap).valid, false)
  assert.ok(validateFaustusConfig(overlap).errors.some(item => item.code === 'overlapping_bands'))
  assert.ok(validateFaustusConfig(config({ bands: [band({ start: '10', end: '10' })] })).errors.some(item => item.code === 'invalid_band_range'))
  assert.ok(validateFaustusConfig(config({ bands: [band({ end: '' }), band({ id: 'second', start: '100', end: '' })] })).errors.some(item => item.code === 'open_band_not_last'))
})

test('浮士德配置校验与运行原因显示明确中文提示', () => {
  const value = config({
    bands: [
      band({ id: 'first', end: '' }),
      band({ id: 'second', start: '50', end: '' })
    ]
  })
  const errors = validateFaustusConfig(value).errors
  const openEnded = errors.find(item => item.code === 'open_band_not_last')
  const overlap = errors.find(item => item.code === 'overlapping_bands')
  assert.equal(formatFaustusValidationError(openEnded, value), '第 1 段未设置结束价；只有最后一段可以不设上限')
  assert.equal(formatFaustusValidationError(overlap, value), '第 1 段与第 2 段的价格区间重叠，请调整起始价或结束价')
  assert.equal(formatFaustusReasonCode('no_matching_band'), '当前价格没有匹配的价格分段')
  assert.equal(formatFaustusReasonCode('item_footprint_unknown'), '无法确定物品占位，已安全跳过')
  assert.equal(formatFaustusReasonCode('item_footprint_ambiguous'), '物品占位与视觉格子不一致，已安全跳过')
  assert.equal(formatFaustusReasonCode('price_window_anchor_missing'), '价格窗口未打开，物品可能处于锁定期，已跳过')
})

test('浮士德配置拒绝非法比例、折扣、零边界和不支持单位', () => {
  assert.ok(validateFaustusConfig(config({ chaosPerDivine: '0' })).errors.some(item => item.code === 'invalid_ratio'))
  assert.ok(validateFaustusConfig(config({ bands: [band({ discountPercent: '0' })] })).errors.some(item => item.code === 'invalid_discount'))
  assert.ok(validateFaustusConfig(config({ bands: [band({ discountPercent: '100' })] })).errors.some(item => item.code === 'invalid_discount'))
  assert.ok(validateFaustusConfig(config({ bands: [band({ start: '0' })] })).errors.some(item => item.code === 'invalid_band_start'))
  assert.ok(validateFaustusConfig(config({ bands: [band({ outputCurrency: 'exalted' })] })).errors.some(item => item.code === 'unsupported_currency'))
})

test('同单位和跨单位折扣使用精确换算并向下取整', () => {
  const same = planFaustusReprice({ oldPrice: 101, oldCurrency: 'chaos', config: config({ bands: [band({ end: '200' })] }) })
  assert.deepEqual({ price: same.newPrice, currency: same.newCurrency, reason: same.reasonCode }, { price: 90, currency: 'chaos', reason: 'repriced' })

  const cross = planFaustusReprice({
    oldPrice: 2,
    oldCurrency: 'divine',
    config: config({ bands: [band({ start: '1', end: '', rangeCurrency: 'divine', outputCurrency: 'chaos' })] })
  })
  assert.deepEqual({ price: cross.newPrice, currency: cross.newCurrency }, { price: 360, currency: 'chaos' })
})

test('无匹配、零价、结果不足 1 和折后未真正降低均跳过', () => {
  const value = config({ bands: [band({ start: '10', end: '20' })] })
  assert.equal(planFaustusReprice({ oldPrice: 5, oldCurrency: 'chaos', config: value }).reasonCode, 'no_matching_band')
  assert.equal(planFaustusReprice({ oldPrice: 0, oldCurrency: 'chaos', config: value }).reasonCode, 'invalid_old_price')

  const belowOne = config({ bands: [band({ start: '1', end: '', outputCurrency: 'divine', discountPercent: '10' })] })
  assert.equal(planFaustusReprice({ oldPrice: 100, oldCurrency: 'chaos', config: belowOne }).reasonCode, 'result_below_one')

  assert.equal(isFaustusPriceLower({ oldPrice: 1, oldCurrency: 'divine', newPrice: 100, newCurrency: 'chaos', chaosPerDivine: 100 }), false)
  assert.equal(isFaustusPriceLower({ oldPrice: 1, oldCurrency: 'divine', newPrice: 99, newCurrency: 'chaos', chaosPerDivine: 100 }), true)
})

test('配置归一化产生独立安全默认值并清理损坏校准', () => {
  const first = createDefaultFaustusConfig()
  const second = createDefaultFaustusConfig()
  first.bands.push(band())
  assert.equal(second.bands.length, 0)

  const normalized = normalizeFaustusConfig({
    version: 99,
    chaosPerDivine: 200,
    bands: [band({ id: '', start: 1, end: null })],
    gridCalibration: { left: 10, top: 20, right: 10, bottom: 40 }
  })
  assert.equal(normalized.version, 1)
  assert.equal(normalized.chaosPerDivine, '200')
  assert.equal(normalized.bands[0].end, '')
  assert.ok(normalized.bands[0].id)
  assert.equal(normalized.gridCalibration, null)
})

test('浮士德配置独立持久化且运行快照不受后续编辑影响', () => {
  const values = new Map()
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  }
  const repository = createFaustusConfigRepository(storage)
  const current = config({ gridCalibration: { left: 10, top: 20, right: 1210, bottom: 1220, displayId: '1', scaleFactor: 1.5 } })
  repository.save(current)
  assert.ok(values.has(FAUSTUS_CONFIG_STORAGE_KEY))
  assert.deepEqual(repository.load(), normalizeFaustusConfig(current))

  const snapshot = createFaustusRunSnapshot(current)
  current.bands[0].discountPercent = '50'
  assert.equal(snapshot.bands[0].discountPercent, '10')
  assert.equal(Object.isFrozen(snapshot), true)
  assert.equal(Object.isFrozen(snapshot.bands[0]), true)

  values.set(FAUSTUS_CONFIG_STORAGE_KEY, '{bad json')
  assert.deepEqual(repository.load(), createDefaultFaustusConfig())
})
})()

// === Merged from inventoryGridDerive.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const deriveInventoryGridFromRegion = _m2_deriveInventoryGridFromRegion
test('框选区域换算首格中心与单格宽高', () => {
  const grid = deriveInventoryGridFromRegion({ left: 2004, top: 1055, right: 3204, bottom: 1555 })
  assert.deepEqual(grid, {
    startPos: { x: 2054, y: 1105 },
    slotSize: { w: 100, h: 100 }
  })
})

test('非整除区域按四舍五入取整换算', () => {
  const grid = deriveInventoryGridFromRegion({ left: 2004, top: 1055, right: 3210, bottom: 1561 })
  assert.deepEqual(grid.slotSize, { w: 101, h: 101 })
  assert.deepEqual(grid.startPos, { x: Math.round(2004 + 101 / 2), y: Math.round(1055 + 101 / 2) })
})

test('反向拖动矩形被规范化后换算', () => {
  const grid = deriveInventoryGridFromRegion({ left: 3204, top: 1555, right: 2004, bottom: 1055 })
  assert.deepEqual(grid, {
    startPos: { x: 2054, y: 1105 },
    slotSize: { w: 100, h: 100 }
  })
})

test('区域无效或过小时返回 null', () => {
  assert.equal(deriveInventoryGridFromRegion(null), null)
  assert.equal(deriveInventoryGridFromRegion({ left: 100, top: 100, right: 100, bottom: 100 }), null)
  assert.equal(deriveInventoryGridFromRegion({ left: 100, top: 100, right: 200, bottom: 100 }), null)
  assert.equal(deriveInventoryGridFromRegion({ left: 100, top: 100, right: 100, bottom: 200 }), null)
})
})()

// === Merged from junfengIntegration.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const readFileSync = _m3_readFileSync
  const AutomationLock = _m3_AutomationLock
const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('君锋镇接入独立 manager、IPC、preload、store 和自动化互斥锁', () => {
  const main = source('electron/main.js')
  const ipc = source('electron/modules/ipc/junfeng.js')
  const preload = source('electron/preload.cjs')
  const manager = source('electron/modules/junfeng/manager.js')
  const store = source('src/stores/junfeng.js')
  assert.match(main, /new JunfengHighlightManager/)
  assert.match(ipc, /junfeng-runtime-update/)
  assert.match(ipc, /registerConsumer\('junfeng-highlight'/)
  assert.match(preload, /onJunfengEvent/)
  assert.match(preload, /onJunfengTrainingEvent/)
  assert.match(store, /candidateItems/)
  assert.match(manager, /acquire\(OWNER\)/)
  assert.match(manager, /release\(OWNER\)/)
  assert.match(manager, /'small-stash': \{ columns: 12, rows: 12 \}/)
  assert.match(manager, /'large-stash': \{ columns: 24, rows: 24 \}/)
  assert.match(ipc, /junfeng-training-start/)
  assert.match(ipc, /junfeng-training-update-session/)
  assert.match(ipc, /junfeng-training-delete-session/)
  assert.match(store, /saveTrainingSession/)
  assert.match(store, /reviewTrainingSession/)
  const lock = new AutomationLock()
  assert.equal(lock.acquire('自动入库').success, true)
  assert.equal(lock.acquire('君锋镇取出高亮').success, false)
})

test('奖励界面优先显示取出高亮并隐藏普通仓库按钮', () => {
  const manager = source('electron/modules/chaosRecipe/controlOverlay.js')
  const view = source('src/domains/shop/ChaosRecipeControlOverlayView.vue')
  assert.match(manager, /rewardDetected \? junfengVisible : normalVisible/)
  assert.match(manager, /junfengButtonLabel/)
  assert.match(manager, /getAvailability/)
  assert.match(view, /取出高亮/)
  assert.match(view, /v-if="state\.junfengEnabled && state\.rewardDetected"/)
  assert.match(view, /v-if="state\.stashPickupEnabled"[\s\S]*v-show="!state\.rewardDetected"/)
  assert.match(view, /electronApi\.junfeng\.start/)
})

test('正式取件只有一次全网格分类并使用三轮复制确认保护', () => {
  const script = source('src/assets/scripts/junfeng_highlight_pickup.py')
  const shared = source('src/assets/scripts/bag_auto_stash_template.py')
  const classifyStart = script.indexOf('cells, groups, uncertain = classify(image, config, model, calibration)')
  const loopStart = script.indexOf('for index, candidate in enumerate(candidates):')
  assert.ok(classifyStart > 0 && loopStart > classifyStart)
  assert.equal((script.slice(classifyStart, loopStart).match(/classify\(/g) || []).length, 1)
  assert.match(script, /if uncertain and bool\(config\.get\("abort_on_uncertain", True\)\):[\s\S]*reason="uncertain-cells"/)
  assert.match(script, /require_game_foreground\(\)[\s\S]*transfer_pickup_item/)
  assert.match(shared, /def transfer_pickup_item\(controller\):[\s\S]*for _attempt in range\(3\):/)
  assert.match(script, /reason="transfer-unconfirmed"/)
  assert.match(shared, /return False, "inventory-full"/)
})

test('普通仓库和君锋镇共享候选复制判空路径，已知占位可提前跳过', () => {
  const script = source('src/assets/scripts/junfeng_highlight_pickup.py')
  assert.match(script, /candidates = ordered_candidates\(groups\)/)
  assert.match(script, /key=lambda candidate: \(candidate\["row"\], candidate\["column"\]\)/)
  assert.match(script, /copy_item_text\(\)[\s\S]*before_status == "empty"[\s\S]*transfer_pickup_item/)
  assert.match(script, /resolved_footprint_slots\([\s\S]*resolved_slots\.update/)
  assert.doesNotMatch(script, /transfer_confirmation|wait_for_candidate_change/)
  assert.equal((script.match(/mouse\.position = park_position/g) || []).length, 1)
  assert.doesNotMatch(script, /changed_candidate_cells|cleared_cells/)
  assert.doesNotMatch(script, /next_position|source_patch/)
  assert.doesNotMatch(script, /InterfaceMatcher|require_action_ready|check_interface/)
})

test('主界面触发检测预览允许暂时失焦，正式取件仍要求奖励标题处于检测状态', () => {
  const manager = source('electron/modules/junfeng/manager.js')
  assert.match(manager, /preview\(\)\s*{\s*this\.ensureReady\(\{ modelRequired: false, requireReward: false \}\)/)
  assert.match(manager, /start\(\)\s*{[\s\S]*?this\.ensureReady\(\)/)
  assert.match(manager, /if \(requireReward && !detection\.rewardDetected\)/)
})

test('君锋镇按钮依赖公共标题检测，执行阶段只因失去前台停止', () => {
  const manager = source('electron/modules/junfeng/manager.js')
  const overlay = source('electron/modules/chaosRecipe/controlOverlay.js')
  const subscription = manager.slice(
    manager.indexOf('this.disposeDetection = interfaceDetection?.subscribe'),
    manager.indexOf('  initialStatus()')
  )

  assert.match(subscription, /!state\.foreground/)
  assert.doesNotMatch(subscription, /junfengReady|reward-interface-lost/)
  assert.match(overlay, /const rewardDetected = junfengRunning \|\|/)
  assert.match(overlay, /junfengRunning \|\| \(junfengReady && junfengAvailability\.ready && !junfengOccupied\)/)
})

test('普通仓库和君锋镇均跳过模糊格继续取件', () => {
  const stashManager = source('electron/modules/stashPickup/manager.js')
  const junfengManager = source('electron/modules/junfeng/manager.js')
  assert.match(stashManager, /abort_on_uncertain: false/)
  assert.match(junfengManager, /abort_on_uncertain: false/)
})

test('通用训练框选的嵌套区域在写入 Python 配置前归一化为扁平物理坐标', () => {
  const manager = source('electron/modules/junfeng/manager.js')
  assert.match(manager, /grid_region: normalizeJunfengRegion\(overrides\.gridRegion \|\| this\.runtime\.gridRegion\)/)
  assert.match(manager, /previewTraining\(\{ domain, gridRegion, partition = 'train' \} = \{\}\)/)
})

test('君锋镇和仓库只在启动前校验标题，正式取件配置不再携带标题门禁', () => {
  const junfengManager = source('electron/modules/junfeng/manager.js')
  const stashManager = source('electron/modules/stashPickup/manager.js')
  for (const manager of [junfengManager, stashManager]) {
    const writeConfig = manager.slice(manager.indexOf('  writeConfig('), manager.indexOf('  spawn', manager.indexOf('  writeConfig(')))
    assert.doesNotMatch(writeConfig, /templates|match_threshold|interface_mode/)
  }
  assert.match(junfengManager, /if \(requireReward && !detection\.rewardDetected\)/)
  assert.match(stashManager, /if \(detection\.foreground && !detection\.ready\)/)
  assert.doesNotMatch(junfengManager, /transfer_confirmation/)
  assert.doesNotMatch(stashManager, /transfer_confirmation/)
  assert.match(junfengManager, /'pynput', 'pyperclip'/)
  assert.match(stashManager, /'pynput', 'pyperclip'/)
  assert.match(source('src/domains/bag/BagView.vue'), /'transfer-unconfirmed': '无法确认物品已转移，已安全停止'/)
})

test('君锋镇可用性校验模板采集环境和网格物理边界', () => {
  const manager = source('electron/modules/junfeng/manager.js')
  const config = source('src/utils/junfengConfig.js')
  assert.match(manager, /validateTemplateCaptureEnvironment/)
  assert.match(manager, /junfengRewardCapture/)
  assert.match(manager, /inventoryCapture/)
  assert.match(manager, /validateJunfengGridEnvironment\(runtime\.gridRegion, this\.currentDisplays\(\)\)/)
  assert.match(config, /region\.displayPhysicalBounds/)
  assert.match(config, /分辨率或位置已变化/)
})

test('校准素材导出保留仓库与君锋镇来源域', () => {
  const builder = source('scripts/junfeng/build_calibration_dataset.py')
  assert.match(builder, /str\(sample\.get\("domain"\) or "junfeng"\)/)
  assert.doesNotMatch(builder, /args\.repeat, "junfeng-calibration"/)
})

test('有效模型可直接用于正式取件且准确率报告只作为质量参考', () => {
  const script = source('src/assets/scripts/junfeng_highlight_pickup.py')
  const manager = source('electron/modules/junfeng/manager.js')
  assert.match(script, /validate_model\(config\)/)
  assert.doesNotMatch(script, /model-not-approved|require_approved/)
  assert.doesNotMatch(manager, /!manifest\.automationEnabled|!manifest\.benchmark\?\.passed/)
  assert.match(manager, /this\.modelAvailability\.getState\(\)/)
  assert.doesNotMatch(source('electron/modules/junfeng/modelAvailability.js'), /!manifest\.automationEnabled|!manifest\.benchmark\?\.passed/)
})

test('检测预览在截图前把鼠标停到当前显示器且位于网格之外', () => {
  const script = source('src/assets/scripts/junfeng_highlight_pickup.py')
  assert.match(script, /park_position = park_cursor_position\(config\.get\("grid_region", \{\}\), rect\)/)
  assert.match(script, /mouse\.position = park_position[\s\S]*time\.sleep\(normalize_operation_delay\(config\.get\("operation_delay_ms"\)\) \/ 1000\.0\)[\s\S]*image = capture\(rect, grabber\)/)
})

test('检测与训练标注直接覆盖在原始预览截图上并支持点击循环标签', () => {
  const script = source('src/assets/scripts/junfeng_highlight_pickup.py')
  const pickupView = source('src/domains/bag/BagView.vue')
  const trainingView = source('src/domains/bag/HighlightModelTrainingView.vue')
  const gridPreview = source('src/components/highlight/HighlightGridPreview.vue')
  assert.match(script, /rawImageDataUrl=data_url\(image\)/)
  assert.match(pickupView, /<HighlightGridPreview[\s\S]*decision-mode[\s\S]*editable/)
  assert.match(trainingView, /<HighlightGridPreview[\s\S]*:labels="junfengStore\.trainingLabels"[\s\S]*editable/)
  assert.match(gridPreview, /highlighted: 'dimmed', dimmed: 'empty', empty: 'highlighted'/)
  assert.match(gridPreview, /emit\('change', \{ cell, label: nextLabel\(effectiveLabel\(cell\)\) \}\)/)
})

test('训练标注网格可独立切换彩色边框和同色中心圆点', () => {
  const gridPreview = source('src/components/highlight/HighlightGridPreview.vue')
  assert.match(gridPreview, /const showGridColors = ref\(true\)/)
  assert.match(gridPreview, /const showCenterDots = ref\(true\)/)
  assert.match(gridPreview, /v-model="showGridColors" active-text="显示网格颜色"/)
  assert.match(gridPreview, /v-model="showCenterDots" active-text="显示中心圆点"/)
  assert.match(gridPreview, /'is-grid-color-hidden': !showGridColors/)
  assert.match(gridPreview, /'is-center-dot-hidden': !showCenterDots/)
  assert.match(gridPreview, /\.highlight-grid-preview__cell::after[^{]*\{[^}]*background: var\(--highlight-label-color\)/)
  assert.match(gridPreview, /\.is-highlighted \{ --highlight-label-color: rgba\(65, 220, 92, 0\.95\)/)
  assert.match(gridPreview, /\.is-dimmed \{ --highlight-label-color: rgba\(205, 210, 218, 0\.88\)/)
  assert.match(gridPreview, /\.is-empty \{ --highlight-label-color: rgba\(255, 255, 255, 0\.28\)/)
  assert.match(gridPreview, /\.is-grid-color-hidden \.highlight-grid-preview__cell \{ border-color: transparent/)
  assert.match(gridPreview, /\.is-center-dot-hidden \.highlight-grid-preview__cell::after \{ display: none/)
})

test('训练图片图例实时展示当前标注的高亮灰暗和空格数量', () => {
  const trainingView = source('src/domains/bag/HighlightModelTrainingView.vue')
  const gridPreview = source('src/components/highlight/HighlightGridPreview.vue')
  assert.match(trainingView, /const trainingLabelCounts = computed\(\(\) => Object\.values\(junfengStore\.trainingLabels\)\.reduce/)
  assert.match(trainingView, /\{ highlighted: 0, dimmed: 0, empty: 0, unknown: 0 \}/)
  assert.match(gridPreview, /高亮 \{\{ counts\.highlighted \}\}/)
  assert.match(gridPreview, /灰暗 \{\{ counts\.dimmed \}\}/)
  assert.match(gridPreview, /空格 \{\{ counts\.empty \}\}/)
  assert.match(trainingView, /const trainingUnknownCount = computed\(\(\) => trainingLabelCounts\.value\.unknown\)/)
})

test('训练标注保存成功后关闭当前图片并退出复核状态', () => {
  const store = source('src/stores/junfeng.js')
  assert.match(store, /async function saveTrainingSession\(\)[\s\S]*await loadTrainingSessions\(\)[\s\S]*trainingPreview\.value = null[\s\S]*trainingLabels\.value = \{\}[\s\S]*reviewingSessionId\.value = ''[\s\S]*return summary/)
})

test('历史标注会话可按来源和用途组合筛选并保留全量测试计数', () => {
  const view = source('src/domains/bag/HighlightModelTrainingView.vue')
  assert.match(view, /const sessionDomainFilter = ref\(''\)/)
  assert.match(view, /const sessionPartitionFilter = ref\(''\)/)
  assert.match(view, /v-model="sessionDomainFilter"[\s\S]*label="全部来源" value=""/)
  assert.match(view, /v-model="sessionPartitionFilter"[\s\S]*label="全部用途" value=""/)
  assert.match(view, /const filteredTrainingSessions = computed\(\(\) => junfengStore\.trainingSessions\.filter\(session =>[\s\S]*!sessionDomainFilter\.value \|\| session\.domain === sessionDomainFilter\.value[\s\S]*&&[\s\S]*!sessionPartitionFilter\.value \|\| session\.partition === sessionPartitionFilter\.value/)
  assert.match(view, /:data="filteredTrainingSessions"/)
  assert.match(view, /filteredTrainingSessions\.length \}\} \/ \{\{ junfengStore\.trainingSessions\.length/)
  assert.match(view, /v-else-if="junfengStore\.trainingSessions\.length"[\s\S]*description="没有符合筛选条件的历史标注会话"/)
  assert.match(view, /const testSessionCount = computed\(\(\) => junfengStore\.trainingSessions\.filter/)
  assert.doesNotMatch(view, /const testSessionCount = computed\(\(\) => filteredTrainingSessions/)
})

test('独立训练页面可视化复核历史会话并直接更新当前模型', () => {
  const router = source('src/router/index.js')
  const pageLoaders = source('src/router/pageLoaders.js')
  const catalog = source('src/features/featureCatalog.js')
  const bagView = source('src/domains/bag/BagView.vue')
  const view = source('src/domains/bag/HighlightModelTrainingView.vue')
  const repository = source('electron/modules/junfeng/calibrationRepository.js')
  const benchmark = source('scripts/junfeng/benchmark_model.py')
  assert.match(router, /const developmentRoutes = import\.meta\.env\.DEV \? \[/)
  assert.match(router, /path: '\/highlight-model-training'/)
  assert.match(router, /!import\.meta\.env\.DEV && to\.path === '\/highlight-model-training'[\s\S]*path: '\/'/)
  assert.match(pageLoaders, /import\.meta\.env\.DEV \? \{[\s\S]*'\/highlight-model-training':[\s\S]*HighlightModelTrainingView\.vue/)
  assert.match(catalog, /id: 'highlight-model-training'[\s\S]*developmentOnly: true/)
  assert.doesNotMatch(bagView, /历史标注会话|GPU 训练并更新当前模型/)
  assert.match(view, /历史标注会话/)
  assert.match(view, /保存复核修改/)
  assert.match(view, /全部高亮/)
  assert.match(view, /最终测试集（质量评估）/)
  assert.match(view, /GPU 训练并更新当前模型/)
  assert.match(view, /运行最终测试（可选）/)
  assert.match(view, /在原图中查看/)
  assert.match(repository, /reconstructedGridDataUrl/)
  assert.match(repository, /revision: Number\(previousSession\?\.revision \|\| 0\) \+ 1/)
  assert.match(benchmark, /"errors": errors/)
})

test('正式版不注册君锋镇训练 IPC，普通取件 IPC 保持可用', () => {
  const main = source('electron/main.js')
  const ipcIndex = source('electron/modules/ipc/index.js')
  const ipc = source('electron/modules/ipc/junfeng.js')
  assert.match(main, /enableJunfengTraining: !app\.isPackaged/)
  assert.match(ipcIndex, /enableJunfengTraining = false/)
  assert.match(ipcIndex, /enableTraining: enableJunfengTraining/)
  assert.match(ipc, /ipcMain\.handle\('junfeng-status'/)
  assert.match(ipc, /if \(!enableTraining\) return[\s\S]*ipcMain\.handle\('junfeng-training-pick-region'/)
  assert.match(ipc, /ipcMain\.handle\('junfeng-training-start'/)
})

test('公共检测独立上报普通仓库与奖励状态并在背包变化时刷新君锋镇就绪状态', () => {
  const python = source('src/assets/scripts/bag_auto_stash_template.py')
  const coordinator = source('electron/modules/interfaceDetection/coordinator.js')
  assert.match(python, /rewardDetected=reward_detected/)
  assert.match(python, /junfeng_ready = reward_detected and matches\["inventoryMatched"\]/)
  assert.match(python, /inventory_changed = matches\["inventoryMatched"\] != last_inventory_matched/)
  assert.match(coordinator, /stashReady: Boolean\(event\.stashReady \?\? event\.ready\)/)
  assert.match(python, /allflameReceiverReady=allflame_receiver_ready/)
  assert.match(coordinator, /allflameReceiverReady: Boolean\(event\.allflameReceiverReady\)/)
  assert.match(coordinator, /rewardDetected: Boolean\(event\.rewardDetected\)/)
  assert.match(coordinator, /rewardScore: event\.rewardScore/)
})

test('开发训练工具按会话划分并独立评估零误报、召回率和零高亮场景', () => {
  const train = source('scripts/junfeng/train_model.py')
  const benchmark = source('scripts/junfeng/benchmark_model.py')
  assert.match(train, /validation_sessions/)
  assert.doesNotMatch(train, /random_split/)
  assert.match(train, /output_names=\["logits", "embedding"\]/)
  assert.match(benchmark, /false_positive == 0 and recall >= 0\.99 and zero_scene_clicks == 0/)
  assert.doesNotMatch(benchmark, /--approve|automationEnabled/)
  assert.match(benchmark, /最终测试集至少需要 3 个已审计独立会话/)
  assert.match(train, /partition not in \("validation", "test"\)/)
})

test('训练先完成候选模型验证再发布当前模型并保留失败回滚', () => {
  const manager = source('electron/modules/junfeng/manager.js')
  const benchmark = manager.indexOf("this.publishTraining({ stage: '独立验证候选模型' })")
  const publish = manager.indexOf('this.publishCandidateModel(candidate)', benchmark)
  assert.ok(benchmark > 0 && publish > benchmark)
  assert.match(manager, /candidateRoot = path\.join\(paths\.artifacts, 'workbench-candidate'\)/)
  assert.match(manager, /backup: `\$\{target\}\.\$\{token\}\.backup`/)
  assert.match(manager, /entry\.replaced && entry\.existed[\s\S]*copyFileSync\(entry\.backup, entry\.target\)/)
})
})()

// === Merged from junfengModelAvailability.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const mkdtemp = _m4_mkdtemp
  const writeFile = _m4_writeFile
  const rm = _m4_rm
  const tmpdir = _m4_tmpdir
  const path = _m4_path
  const createHash = _m4_createHash
  const ModelAvailability = _m4_ModelAvailability
  const validateModelFiles = _m4_validateModelFiles
async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'junfeng-model-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const paths = { model: path.join(root, 'model.onnx'), manifest: path.join(root, 'manifest.json') }
  const manifest = { schemaVersion: 1, architectureVersion: 1, classes: ['highlighted', 'dimmed', 'empty'],
    modelVersion: 'test', sha256: createHash('sha256').update('model').digest('hex') }
  await writeFile(paths.model, 'model')
  await writeFile(paths.manifest, JSON.stringify(manifest))
  return { paths, manifest }
}

test('模型异步校验保留缺失、损坏、契约和哈希错误', async t => {
  const { paths, manifest } = await fixture(t)
  assert.deepEqual(await validateModelFiles(paths), { ready: true, reason: '', modelVersion: 'test' })
  await writeFile(paths.model, 'changed')
  assert.match((await validateModelFiles(paths)).reason, /校验失败/)
  await rm(paths.model)
  assert.match((await validateModelFiles(paths)).reason, /文件不存在/)
  await writeFile(paths.manifest, JSON.stringify({ ...manifest, schemaVersion: 2 }))
  assert.match((await validateModelFiles(paths)).reason, /契约不兼容/)
  await writeFile(paths.manifest, '{')
  assert.match((await validateModelFiles(paths)).reason, /清单损坏/)
  await rm(paths.manifest)
  assert.match((await validateModelFiles(paths)).reason, /清单不存在/)
})

test('并发共用校验，刷新界面只读取缓存', async t => {
  const { paths } = await fixture(t)
  let calls = 0
  const cache = new ModelAvailability(paths, { validate: async () => {
    calls++
    return { ready: true, reason: '', modelVersion: 'test' }
  } })
  t.after(() => cache.dispose())
  cache.setEnabled(true)
  assert.equal(cache.getState().reason, '模型准备中')
  assert.equal(cache.refresh(), cache.refresh())
  await cache.refresh()
  for (let i = 0; i < 100; i++) assert.equal(cache.getState().ready, true)
  cache.setEnabled(true)
  assert.equal(calls, 1)
})

test('关闭功能后忽略旧结果，再启用会重新校验', async t => {
  const { paths } = await fixture(t)
  let finish
  let changes = 0
  const cache = new ModelAvailability(paths, { validate: () => new Promise(resolve => { finish = resolve }),
    onChange: () => changes++ })
  t.after(() => cache.dispose())
  cache.setEnabled(true)
  const old = cache.refresh()
  await Promise.resolve()
  cache.setEnabled(false)
  finish({ ready: true, reason: '' })
  await old
  assert.equal(cache.getState().ready, false)
  assert.equal(changes, 0)
  cache.setEnabled(true)
  const next = cache.refresh()
  await Promise.resolve()
  finish({ ready: true, reason: '' })
  await next
  assert.equal(cache.getState().ready, true)
  assert.equal(changes, 1)
})

test('校验途中失效不会发布旧结果，并自动补一次校验', async t => {
  const { paths } = await fixture(t)
  const finishes = []
  const cache = new ModelAvailability(paths, { validate: () => new Promise(resolve => finishes.push(resolve)) })
  t.after(() => cache.dispose())
  cache.setEnabled(true)
  const first = cache.refresh()
  await Promise.resolve()
  cache.invalidate()
  finishes[0]({ ready: true, reason: '', modelVersion: 'old' })
  await first
  assert.equal(cache.getState().ready, false)
  const second = cache.refresh()
  await Promise.resolve()
  finishes[1]({ ready: true, reason: '', modelVersion: 'new' })
  await second
  assert.equal(cache.getState().modelVersion, 'new')
})

test('文件变化自动清除缓存并重新校验，缺失文件恢复后可用', async t => {
  const { paths } = await fixture(t)
  const cache = new ModelAvailability(paths)
  t.after(() => cache.dispose())
  cache.setEnabled(true)
  await cache.refresh()
  async function waitFor(predicate) {
    const deadline = Date.now() + 5000
    while (!predicate()) {
      assert.ok(Date.now() < deadline, '等待文件监听更新超时')
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }
  await rm(paths.model)
  await waitFor(() => cache.getState().reason.includes('文件不存在'))
  await writeFile(paths.model, 'model')
  await waitFor(() => cache.getState().ready)
  await writeFile(paths.manifest, '{}')
  await waitFor(() => cache.getState().reason.includes('契约不兼容'))
})
})()

// === Merged from junfengOverlayProgress.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const readFileSync = _m5_readFileSync
  const formatJunfengButtonLabel = _m5_formatJunfengButtonLabel
  const normalizeJunfengProgress = _m5_normalizeJunfengProgress
const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('君锋镇按钮只有空闲和运行进度两类文案', () => {
  assert.equal(formatJunfengButtonLabel(), '取出高亮')
  assert.equal(formatJunfengButtonLabel({ status: 'completed', processedItems: 2, candidateItems: 2 }), '取出高亮')
  assert.equal(formatJunfengButtonLabel({ status: 'stopped', processedItems: 1, candidateItems: 2 }), '取出高亮')
  assert.equal(formatJunfengButtonLabel({ status: 'running' }), '进行中（0/0）')
  assert.equal(formatJunfengButtonLabel({ status: 'running', processedItems: 1, candidateItems: 2 }), '进行中（1/2）')
})

test('候选进度使用已处理序号并钳制到归并后的候选总数', () => {
  assert.deepEqual(normalizeJunfengProgress(1, 2), { processedItems: 1, candidateItems: 2 })
  assert.deepEqual(normalizeJunfengProgress(5, 2), { processedItems: 2, candidateItems: 2 })
  assert.deepEqual(normalizeJunfengProgress(-1, 2), { processedItems: 0, candidateItems: 2 })
  assert.deepEqual(normalizeJunfengProgress('invalid', 'invalid'), { processedItems: 0, candidateItems: 0 })

  const manager = source('electron/modules/junfeng/manager.js')
  assert.match(manager, /event\.currentIndex \?\? this\.status\.processedItems/)
  assert.match(manager, /processedItems: progress\.processedItems/)

  const pickup = source('src/assets/scripts/junfeng_highlight_pickup.py')
  assert.match(pickup, /skipped=True/)
  assert.match(pickup, /emit\("progress", currentIndex=index \+ 1/)
})

test('君锋镇浮窗运行中禁用单向启动按钮并保留全局 End 停止', () => {
  const view = source('src/domains/shop/ChaosRecipeControlOverlayView.vue')
  assert.match(view, /:disabled="state\.junfengRunning \|\| !state\.canJunfeng \|\| Boolean\(busy\)"/)
  assert.match(view, /\? await electronApi\.junfeng\.start\(\)/)
  assert.doesNotMatch(view, /electronApi\.junfeng\.stop\(\)/)
  assert.match(view, /busy\.value === 'junfeng'[\s\S]*'进行中（0\/0）'/)
  assert.doesNotMatch(view, /busy === 'junfeng' \? '处理中/)

  const emergencyIpc = source('electron/modules/ipc/emergencyStop.js')
  assert.match(emergencyIpc, /managerAction\('junfeng', '君锋镇取件', junfeng\)/)
})

test('君锋镇模式仅保留拖动柄和按钮，其他模式继续显示状态行', () => {
  const view = source('src/domains/shop/ChaosRecipeControlOverlayView.vue')
  assert.match(view, /:class="\{ 'junfeng-only': state\.rewardDetected \}"/)
  assert.match(view, /<div v-if="!state\.rewardDetected" class="status-message"/)
  assert.match(view, /\.control-shell\.junfeng-only\s*\{[^}]*grid-template-rows:[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s)
  assert.match(view, /\.control-shell\.junfeng-only \.drag-handle \{ grid-row: 1; \}/)
  assert.match(view, /ResizeObserver\(reportContentSize\)/)
  assert.match(view, /electronApi\.chaosRecipe\.resizeControl/)
})
})()

// === Merged from stashPickupIntegration.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const readFileSync = _m6_readFileSync
const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('仓库取件接入独立 IPC、preload、运行管理和自动化锁', () => {
  const main = source('electron/main.js')
  const ipc = source('electron/modules/ipc/stashPickup.js')
  const preload = source('electron/preload.cjs')
  const manager = source('electron/modules/stashPickup/manager.js')
  assert.match(main, /new StashPickupManager/)
  assert.match(ipc, /stash-pickup-runtime-update/)
  assert.match(ipc, /registerConsumer\('stash-pickup'/)
  assert.match(preload, /onStashPickupEvent/)
  assert.match(manager, /acquire\(OWNER\)/)
  assert.match(manager, /release\(OWNER\)/)
  assert.match(manager, /junfeng_highlight_pickup\.py/)
  assert.match(manager, /item_footprints:\s*itemFootprintRegistry\.snapshot\(\)/)
  assert.match(manager, /candidateItems/)
  assert.match(manager, /remainingItems/)
})

test('游戏控制按钮按商城配方与仓库取件独立启用状态显示', () => {
  const manager = source('electron/modules/chaosRecipe/controlOverlay.js')
  const view = source('src/domains/shop/ChaosRecipeControlOverlayView.vue')
  assert.match(manager, /recipeEnabled: this\.enabled/)
  assert.match(manager, /stashPickupEnabled/)
  assert.match(view, /v-if="state\.recipeEnabled"/)
  assert.match(view, /v-if="state\.stashPickupEnabled"/)
  assert.match(view, /electronApi\.stashPickup\.start/)
})

test('背包页说明仓库默认按搜索高亮取件且不再展示统计阈值控件', () => {
  const view = source('src/domains/bag/BagView.vue')
  assert.match(view, /普通仓库 12×12/)
  assert.match(view, /大型仓库 24×24/)
  assert.match(view, /搜索框为空时全部物品都会高亮并取出/)
  assert.doesNotMatch(view, /方差 variance/)
  assert.doesNotMatch(view, /亮度 brightness/)
  assert.doesNotMatch(view, /饱和度 saturation/)
  assert.match(view, /检测预览/)
  assert.match(view, /转移未确认/)
})

test('检测预览由主进程激活游戏，脚本只保留前台校验', () => {
  const manager = source('electron/modules/stashPickup/manager.js')
  const script = source('src/assets/scripts/stash_pickup_template.py')
  assert.match(manager, /async preview\(\)[\s\S]*windowActivation\?\.activateGame/)
  assert.doesNotMatch(script, /def focus_game_window\(/)
  assert.match(script, /def require_game_foreground\(\):[\s\S]*raise RuntimeError\("game-not-foreground"\)/)
})

test('仓库与君锋镇共享本机校准池和统一网格预览交互', () => {
  const main = source('electron/main.js')
  const manager = source('electron/modules/stashPickup/manager.js')
  const ipc = source('electron/modules/ipc/junfeng.js')
  const preload = source('electron/preload.cjs')
  const api = source('src/api/electron.js')
  const view = source('src/domains/bag/BagView.vue')
  assert.match(main, /const highlightCalibration = new JunfengCalibrationRepository/)
  assert.match(main, /new StashPickupManager\([\s\S]*calibration: highlightCalibration/)
  assert.match(main, /new JunfengHighlightManager\([\s\S]*calibration: highlightCalibration/)
  assert.match(manager, /calibration_index: this\.calibration\?\.indexPath \|\| ''/)
  assert.match(ipc, /highlight-calibration-save/)
  assert.match(preload, /saveHighlightCalibration/)
  assert.match(api, /highlightCalibration:/)
  assert.equal((view.match(/<HighlightGridPreview/g) || []).length, 2)
  assert.match(view, /saveStashPreviewCorrections/)
  assert.match(view, /保存修改的校准素材/)
})

test('仓库按钮依赖公共标题检测，执行阶段不再匹配标题且失去前台仍立即停止', () => {
  const manager = source('electron/modules/stashPickup/manager.js')
  const overlay = source('electron/modules/chaosRecipe/controlOverlay.js')
  const subscription = manager.slice(
    manager.indexOf('this.disposeDetection = interfaceDetection?.subscribe'),
    manager.indexOf('  scriptPath()')
  )
  const script = source('src/assets/scripts/junfeng_highlight_pickup.py')

  assert.match(subscription, /!state\.foreground/)
  assert.doesNotMatch(subscription, /!state\.ready/)
  assert.doesNotMatch(manager, /transfer_confirmation/)
  assert.match(overlay, /canStashPickup[\s\S]*this\.detection\.ready/)
  const action = script.slice(script.indexOf('def run(config, preview=False):'))
  assert.doesNotMatch(action, /InterfaceMatcher|require_action_ready|check_interface/)
  assert.match(overlay, /stashPickupRunning \|\| \(this\.detection\.ready && !stashPickupOccupied\)/)
  assert.match(overlay, /this\.detection\.ready \|\| stashPickupRunning \|\| running \|\| paused/)
})

test('游戏浮窗显示仓库取件的真实停止原因', () => {
  const manager = source('electron/modules/chaosRecipe/controlOverlay.js')

  assert.match(manager, /game-not-foreground[\s\S]*游戏不在前台/)
  assert.match(manager, /interface-lost[\s\S]*仓库或背包界面/)
  assert.match(manager, /transfer-unconfirmed[\s\S]*无法确认物品已转移，已安全停止/)
  assert.match(manager, /inventory-full[\s\S]*背包空间不足/)
  assert.match(manager, /stashPickupStopMessage/)
})

test('普通仓库与君锋镇共用三轮点击后复制确认且入库使用受控转移', () => {
  const pickup = source('src/assets/scripts/junfeng_highlight_pickup.py')
  const bag = source('src/assets/scripts/bag_auto_stash_template.py')
  const action = pickup.slice(pickup.indexOf('def run(config, preview=False):'))

  assert.match(pickup, /transfer_pickup_item/)
  assert.match(action, /transferred, reason = transfer_pickup_item\(clipboard_controller\)/)
  assert.doesNotMatch(action, /transfer_item_once/)
  assert.match(bag, /def transfer_pickup_item\(controller\):[\s\S]*begin_ctrl\(\)[\s\S]*for _attempt in range\(3\):[\s\S]*copy_item_text\(ctrl_held=True,\s*clear_first=True\)[\s\S]*inventory-full/)
  assert.match(bag, /def run_stash\(config\):[\s\S]*transfer_stash_item\([\s\S]*controller, item, force_unique_stash\)/)
})
})()

// === Merged from vendorEnglishRegex.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const VENDOR_GROUPS = _m7_VENDOR_GROUPS
  const localizeVendorGroups = _m7_localizeVendorGroups
  const buildVendorTokens = _m7_buildVendorTokens
  const generateVendorRegex = _m7_generateVendorRegex
  const createDefaultVendorConfig = _m7_createDefaultVendorConfig
test('英文商店条件完整覆盖现有 ID，保留中文界面标签且不改变原始国服目录', () => {
  const groups = localizeVendorGroups(VENDOR_GROUPS, 'en')
  assert.deepEqual(groups.flatMap(group => group.options.map(item => item.id)), VENDOR_GROUPS.flatMap(group => group.options.map(item => item.id)))
  assert.equal(groups[0].options[0].label, '稀有')
  assert.equal(groups[0].options[0].expression, 'Rarity: Rare')
  assert.equal(VENDOR_GROUPS[0].options[0].expression, '稀有度: 稀有')
  for (const option of groups.flatMap(group => group.options)) {
    assert.doesNotThrow(() => new RegExp(option.compactExpression, 'im'))
    assert.equal(/\p{Script=Han}/u.test(option.compactExpression), false)
  }
  assert.throws(() => localizeVendorGroups([{ options: [{ id: 'missing' }] }], 'en'), /缺少英文/)
})

test('英文 +1 与移动速度不会误匹配 +11 或 130%，组合条件保留包括排除语义', () => {
  const options = new Map(localizeVendorGroups(VENDOR_GROUPS, 'en').flatMap(group => group.options).map(item => [item.id, item]))
  const plus = new RegExp(options.get('plus_fire').expression, 'im')
  assert.equal(plus.test('+1 to Level of all Fire Spell Skill Gems'), true)
  assert.equal(plus.test('+11 to Level of all Fire Spell Skill Gems'), false)
  const movement = new RegExp(options.get('movement_30').expression, 'im')
  assert.equal(movement.test('30% increased Movement Speed'), true)
  assert.equal(movement.test('130% increased Movement Speed'), false)
  const config = createDefaultVendorConfig()
  config.rarity.selectedIds = ['rare']
  config.movement.selectedIds = ['movement_30']
  config.movement.mode = 'exclude'
  const result = buildVendorTokens(config, 'en')
  assert.equal(result.includeCount, 1)
  assert.equal(result.excludeCount, 1)
  assert.ok(result.tokens.some(token => token.startsWith('"!')))
  assert.equal(/\p{Script=Han}/u.test(generateVendorRegex(config, 'en').regex), false)
})
})()

// === Merged from vendorRecipeService.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const ChaosRecipeService = _m8_ChaosRecipeService
const tab = {
  id: 'tab-1',
  index: 0,
  name: '商店配方',
  type: 'normal',
  columns: 12,
  supported: true,
  inFolder: false
}

const socketItem = {
  id: 'rgb-item',
  tabId: tab.id,
  tabIndex: 0,
  tabName: tab.name,
  tabType: 'normal',
  inFolder: false,
  x: 1,
  y: 2,
  width: 1,
  height: 1,
  itemLevel: 10,
  frameType: 0,
  rarity: 'normal',
  identified: true,
  itemClass: 'helmet',
  name: '',
  baseType: '测试头盔',
  typeLine: '测试头盔',
  sockets: ['R', 'G', 'B'].map((sColour) => ({ group: 0, attr: '', sColour })),
  influences: []
}

function service() {
  return new ChaosRecipeService({
    auth: { getStatus: () => ({ authenticated: true }) },
    stashClient: { clearCache() {} },
    overlay: { close() {} }
  })
}

test('统一服务创建预览计划不改变计数，实际消费物品后才重算结果', () => {
  const instance = service()
  const snapshot = instance.setSnapshot({
    league: '测试赛季',
    results: [{ tab, items: [socketItem], diagnostics: { sourceArrayLength: 1 } }],
    availableTabs: [tab],
    includeIdentified: false
  })
  assert.equal(snapshot.recipes.chromatic.candidateCount, 1)
  assert.equal(snapshot.items.length, 1)
  assert.equal(snapshot.fullSetCount, snapshot.recipes.chaos.fullSetCount)
  const snapshotBeforePreview = structuredClone(instance.snapshot)

  const plan = instance.createPlan({
    recipeId: 'chromatic',
    itemIds: ['rgb-item'],
    calibration: { root: { left: 0, top: 0, right: 1200, bottom: 1200 } }
  })
  assert.equal(plan.recipeId, 'chromatic')
  assert.equal(plan.itemCount, 1)
  assert.equal(plan.tabs[0].items[0].screen.clickX, 150)
  assert.deepEqual(instance.snapshot, snapshotBeforePreview)

  instance.consumeItem('rgb-item')
  assert.equal(instance.snapshot.items.length, 0)
  assert.equal(instance.snapshot.recipes.chromatic.candidateCount, 0)
})

test('刷新仓库先清除旧自动化断点，再请求接口并生成新快照', async () => {
  const order = []
  const instance = new ChaosRecipeService({
    auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer() {} },
    automation: { reset: reason => order.push(`reset:${reason}`) },
    stashClient: {
      clearCache() {},
      async fetchTabs() {
        order.push('fetch')
        return [{ tab, items: [socketItem], diagnostics: { sourceArrayLength: 1 } }]
      },
      getTabsSnapshot: () => [tab]
    },
    overlay: { close() {} }
  })

  const snapshot = await instance.refresh({
    league: '测试赛季',
    selectedTabIds: [tab.id],
    includeIdentified: false
  })
  assert.deepEqual(order, ['reset:refresh', 'fetch'])
  assert.equal(snapshot.recipes.chromatic.candidateCount, 1)
})
})()

// === Merged from vendorRegex.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const buildVendorTokens = _m9_buildVendorTokens
  const generateVendorRegex = _m9_generateVendorRegex
  const REGEX_LENGTH_LIMIT = _m9_REGEX_LENGTH_LIMIT
  const cleanVendorConfig = _m9_cleanVendorConfig
  const createDefaultVendorConfig = _m9_createDefaultVendorConfig
  const migrateLegacyVendorConfig = _m9_migrateLegacyVendorConfig
  const VENDOR_GROUPS = _m9_VENDOR_GROUPS
  const VENDOR_REGEX_CORPUS = _m9_VENDOR_REGEX_CORPUS
  const expressionMatches = _m9_expressionMatches
  const hasMinimumHanFragment = _m9_hasMinimumHanFragment
test('商城正则空配置返回统一结果结构', () => {
  assert.deepEqual(generateVendorRegex(createDefaultVendorConfig()), {
    regex: '', length: 0, overLimit: false, warnings: [], includeCount: 0, excludeCount: 0
  })
})

test('商城分类分别生成包括与排除片段并去除未知项', () => {
  const config = cleanVendorConfig({
    rarity: { mode: 'include', selectedIds: ['rare', 'unknown'] },
    resistance: { mode: 'exclude', selectedIds: ['res_fire'] },
    movement: { mode: 'include', selectedIds: ['movement_15'] }
  })
  const built = buildVendorTokens(config)
  assert.equal(built.includeCount, 2)
  assert.equal(built.excludeCount, 1)
  assert.ok(built.tokens.some(token => token.includes('稀有$')))
  assert.ok(built.tokens.some(token => token.includes('!焰抗')))
  assert.ok(built.tokens.some(token => token.includes('移动.*15%')))
})

test('全部商城紧凑表达式命中目标语料且不误命中其他选项', () => {
  for (const option of VENDOR_GROUPS.flatMap(group => group.options)) {
    const positiveIds = new Set([option.id, ...option.matchIds])
    assert.equal(hasMinimumHanFragment(option.compactExpression), true, `${option.id} 不得使用单字表达式`)
    for (const candidate of VENDOR_REGEX_CORPUS) {
      for (const variant of candidate.variants) {
        assert.equal(
          expressionMatches(option.compactExpression, variant),
          positiveIds.has(candidate.id),
          `${option.id} 对 ${candidate.id} 的匹配结果错误：${option.compactExpression}`
        )
      }
    }
  }
})

test('商城正则统一使用 250 字符阈值且超长不截断', () => {
  const config = createDefaultVendorConfig()
  config.damage.selectedIds = ['physical_damage', 'spell_damage', 'elemental_damage', 'cold_damage', 'fire_damage', 'lightning_damage', 'chaos_damage', 'fire_dot', 'cold_dot', 'chaos_dot']
  const result = generateVendorRegex(config)
  assert.equal(REGEX_LENGTH_LIMIT, 250)
  assert.equal(result.length, result.regex.length)
  assert.equal(result.overLimit, result.length > 250)
})

test('旧商城配置只迁移非孔色字段', () => {
  const migrated = migrateLegacyVendorConfig({
    threeLinks: ['rgb'], anyLinks: ['any_six'], exactColors: { enabled: true, red: 1 },
    movement: ['movement_15'], plusGems: ['plus_fire'], damage: ['physical_damage'], weaponTypes: ['wand']
  })
  assert.deepEqual(migrated.movement.selectedIds, ['movement_15'])
  assert.deepEqual(migrated.common.selectedIds, ['plus_fire'])
  assert.deepEqual(migrated.damage.selectedIds, ['physical_damage'])
  assert.deepEqual(migrated.oneHanded.selectedIds, ['wand'])
  assert.equal('threeLinks' in migrated, false)
  assert.equal('exactColors' in migrated, false)
})
})()
