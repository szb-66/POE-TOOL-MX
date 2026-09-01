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

function markPriceRecognitionReady(manager, config = validConfig()) {
  const calibration = config.gridCalibration
  manager.priceRecognitionCalibrationKey = JSON.stringify([
    Number(calibration.left), Number(calibration.top), Number(calibration.right), Number(calibration.bottom),
    String(calibration.displayId || ''), Number(calibration.scaleFactor)
  ])
}

test('浮士德 preload 与 IPC 只暴露固定操作且每个处理器校验主窗口 sender', () => {
  const preload = source('electron/preload.cjs')
  const ipc = source('electron/modules/ipc/faustus.js')
  const index = source('electron/modules/ipc/index.js')
  for (const token of [
    'faustus-status', 'faustus-grid-pick', 'faustus-price-window-test',
    'faustus-start', 'faustus-stop', 'faustus-event'
  ]) assert.match(`${preload}\n${ipc}`, new RegExp(token))
  assert.match(ipc, /assertMainWindowSender\(event, getMainWindow\)/)
  assert.equal((ipc.match(/ipcMain\.handle\([^\n]+invoke\(getMainWindow/g) || []).length, 5)
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

  markPriceRecognitionReady(manager)
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

  markPriceRecognitionReady(manager)
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

test('正式改价必须先通过与当前网格绑定的价格窗口识别测试', async () => {
  let spawned = 0
  const manager = new FaustusManager({
    python: { detectPythonPathWithModules: () => 'python.exe' },
    fileWatcher: { getFilePaths: () => ({ tempDir: process.cwd() }) },
    foregroundState: () => ({ available: true, gameForeground: true }),
    automationLock: { acquire: () => ({ success: true }), release: () => {} },
    fileSystem: { existsSync: () => true, mkdirSync: () => {}, writeFileSync: () => {} },
    processFactory: () => { spawned += 1; return childProcess() },
    scriptPath: () => 'fixed-faustus.py'
  })

  await assert.rejects(() => manager.start({ config: validConfig() }), /价格窗口识别测试/)
  markPriceRecognitionReady(manager)
  const changedGrid = {
    ...validConfig(),
    gridCalibration: { ...validConfig().gridCalibration, right: 1200 }
  }
  await assert.rejects(() => manager.start({ config: changedGrid }), /价格窗口识别测试/)
  assert.equal(spawned, 0)
})

test('价格窗口识别测试允许从助手前台激活游戏并在结束后恢复助手窗口', async () => {
  let gameForeground = false
  const windowActions = []
  const feedback = []
  const manager = new FaustusManager({
    python: { detectPythonPathWithModules: () => 'python.exe' },
    fileWatcher: { getFilePaths: () => ({ tempDir: process.cwd() }) },
    foregroundState: () => ({ available: true, gameForeground }),
    automationLock: { acquire: () => ({ success: true }), release: () => {} },
    fileSystem: { existsSync: () => true, mkdirSync: () => {}, writeFileSync: () => {}, rmSync: () => {} },
    getMainWindow: () => ({
      isDestroyed: () => false,
      isMinimized: () => true,
      restore: () => windowActions.push('restore'),
      show: () => windowActions.push('show'),
      focus: () => windowActions.push('focus'),
      webContents: { isDestroyed: () => false, send: () => {} }
    }),
    feedbackOverlay: {
      showRunning: snapshot => { feedback.push(['running', snapshot]); return 7 },
      updateProgress: (sessionId, snapshot) => feedback.push(['progress', sessionId, snapshot]),
      showResult: (sessionId, snapshot) => { feedback.push(['result', sessionId, snapshot]); return true },
      hide: sessionId => feedback.push(['hide', sessionId])
    },
    resolveDisplayBounds: () => ({ x: 0, y: 0, width: 1920, height: 1080 }),
    waitForFeedback: async () => {},
    processFactory: ({ mode }) => {
      const child = childProcess()
      if (mode === 'price-window-test') queueMicrotask(() => {
        gameForeground = true
        child.stdout.emit('data', 'EVENT {"event":"scan-progress","current":1,"total":144,"column":2,"row":3}\n')
        child.stdout.emit('data', 'EVENT {"event":"price-window-test","price":1000,"currency":"chaos"}\n')
      })
      return child
    },
    scriptPath: () => 'fixed-faustus.py'
  })

  assert.deepEqual(await manager.testPriceWindow({ gridCalibration: validConfig().gridCalibration }), {
    price: 1000,
    currency: 'chaos'
  })
  assert.equal(feedback[0][0], 'running')
  assert.deepEqual(feedback.find(entry => entry[0] === 'progress')?.slice(1), [7, {
    stage: 'grid', current: 1, total: 144, label: '正在扫描市集格子 2,3'
  }])
  assert.equal(feedback.some(entry => entry[0] === 'result' && entry[2].status === 'success'), true)
  assert.deepEqual(feedback.at(-1), ['hide', 7])
  assert.deepEqual(windowActions, ['restore', 'show', 'focus'])
})

test('manager 只从固定资源注入通用格子模型和冻结占位且不接受 renderer 路径', async () => {
  let written = null
  const child = childProcess()
  const manager = new FaustusManager({
    python: { detectPythonPathWithModules: () => 'python.exe' },
    fileWatcher: { getFilePaths: () => ({ tempDir: process.cwd() }) },
    foregroundState: () => ({ available: true, gameForeground: false }),
    automationLock: { acquire: () => ({ success: true }), release: () => {} },
    fileSystem: { existsSync: () => true, mkdirSync: () => {}, writeFileSync: (_path, value) => { written = JSON.parse(value) }, rmSync: () => {} },
    processFactory: () => {
      queueMicrotask(() => child.stdout.emit('data', 'EVENT {"event":"price-window-test","price":1,"currency":"chaos"}\n'))
      return child
    },
    scriptPath: () => 'fixed-faustus.py'
  })
  await manager.testPriceWindow({
    gridCalibration: validConfig().gridCalibration,
    occupancyModel: { modelPath: 'renderer-injected.onnx' }
  })
  assert.match(written.model_path, /src[\\/]assets[\\/]models[\\/]junfeng-highlight[\\/]model\.onnx$/)
  assert.match(written.manifest_path, /src[\\/]assets[\\/]models[\\/]junfeng-highlight[\\/]manifest\.json$/)
  assert.equal(written.item_footprints.schemaVersion, 1)
  assert.ok(Object.keys(written.item_footprints.items).length > 0)
  assert.doesNotMatch(JSON.stringify(written), /renderer-injected/)
  assert.equal(Object.hasOwn(written, 'emptyConfidenceThreshold'), false)
})

test('manager 将通用格子模型各阶段失败转换为可定位且不泄露路径的提示', async () => {
  for (const [reasonCode, expected] of [
    ['occupancy_model_validation_failed', '校验失败'],
    ['occupancy_grid_capture_failed', '截取当前市集网格'],
    ['occupancy_model_inference_failed', '格子分类失败']
  ]) {
    const child = childProcess()
    const manager = new FaustusManager({
      python: { detectPythonPathWithModules: () => 'python.exe' },
      fileWatcher: { getFilePaths: () => ({ tempDir: process.cwd() }) },
      foregroundState: () => ({ available: true, gameForeground: false }),
      automationLock: { acquire: () => ({ success: true }), release: () => {} },
      fileSystem: { existsSync: () => true, mkdirSync: () => {}, writeFileSync: () => {}, rmSync: () => {} },
      processFactory: () => {
        queueMicrotask(() => child.stdout.emit('data', `EVENT {"event":"aborted","reasonCode":"${reasonCode}"}\n`))
        return child
      },
      scriptPath: () => 'fixed-faustus.py'
    })
    await assert.rejects(
      () => manager.testPriceWindow({ gridCalibration: validConfig().gridCalibration }),
      new RegExp(expected)
    )
  }
})

test('manager 仅转发字段白名单并在前台丢失、紧急停止和清理时释放输入', async () => {
  const sent = []
  const listeners = []
  const runChild = childProcess()
  const manager = new FaustusManager({
    python: { detectPythonPathWithModules: () => 'python.exe' },
    fileWatcher: { getFilePaths: () => ({ tempDir: process.cwd() }) },
    foregroundState: () => ({ available: true, gameForeground: true }),
    subscribeForeground: listener => { listeners.push(listener); return () => listeners.splice(0) },
    automationLock: { acquire: () => ({ success: true }), release: () => {} },
    fileSystem: { existsSync: () => true, mkdirSync: () => {}, writeFileSync: () => {} },
    getMainWindow: () => ({ isDestroyed: () => false, webContents: { send: (...args) => sent.push(args) } }),
    processFactory: () => runChild,
    scriptPath: () => 'fixed-faustus.py'
  })
  markPriceRecognitionReady(manager)
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
    foregroundState: () => ({ available: true, gameForeground: true }),
    automationLock: { acquire: () => ({ success: true }), release: () => {} },
    fileSystem: { existsSync: () => true, mkdirSync: () => {}, writeFileSync: () => {}, rmSync: path => removed.push(path) },
    getMainWindow: () => ({ isDestroyed: () => false, webContents: { send: (...args) => sent.push(args) } }),
    processFactory: () => runChild,
    scriptPath: () => 'fixed-faustus.py'
  })
  markPriceRecognitionReady(manager)
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
