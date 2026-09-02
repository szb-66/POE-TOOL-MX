import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { FaustusManager, sanitizeFaustusItemEvent } from '../electron/modules/faustus/manager.js'
import { normalizeFaustusStartRequest } from '../electron/modules/faustus/schema.js'
import { createFaustusRunSnapshot } from '../src/utils/faustusConfig.js'

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
  assert.match(emergency, /managerAction\('faustus', '浮士德市集改价', faustus\)/)
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
    python: { detectPythonPathWithModules: () => 'python.exe' },
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
    python: { detectPythonPathWithModules: () => 'python.exe' },
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
    python: { detectPythonPathWithModules: () => 'python.exe' },
    fileWatcher: { getFilePaths: () => ({ tempDir: process.cwd() }) },
    windowActivation: createActivation(),
    foregroundState: () => ({ available: true, gameForeground: true }),
    automationLock: { acquire: () => ({ success: true }), release: () => {} },
    fileSystem: { existsSync: () => true, mkdirSync: () => {}, writeFileSync: () => {} },
    processFactory: () => { spawned += 1; return childProcess() },
    scriptPath: () => 'fixed-faustus.py',
    ...overrides
  })

  await assert.rejects(() => make({ python: { detectPythonPathWithModules: () => null } }).start({ config: validConfig() }), /OCR/)
  await assert.rejects(() => make().start({ config: { ...validConfig(), gridCalibration: null } }), /校准/)
  await assert.rejects(() => make().start({ config: { ...validConfig(), gridCalibration: { ...validConfig().gridCalibration, scaleFactor: 0 } } }), /DPI/)
  assert.equal(spawned, 0)
})

test('游戏激活失败时释放浮士德锁且不写配置、不创建进程', async () => {
  let spawned = 0
  let written = 0
  let released = 0
  const manager = new FaustusManager({
    python: { detectPythonPathWithModules: () => 'python.exe' },
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
    python: { detectPythonPathWithModules: () => 'python.exe' },
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
  assert.deepEqual(feedbackEvents, ['activate', 'begin'])
  assert.equal(typeof onVisible, 'function')
  onVisible()
  assert.deepEqual(feedbackEvents, ['activate', 'begin', 'handoff'])
  manager.stop('user')
})

test('manager 只从固定资源注入通用格子模型和冻结占位且不接受 renderer 路径', async () => {
  let written = null
  const child = childProcess()
  const manager = new FaustusManager({
    python: { detectPythonPathWithModules: () => 'python.exe' },
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
    python: { detectPythonPathWithModules: () => 'python.exe' },
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
    python: { detectPythonPathWithModules: () => 'python.exe' },
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
