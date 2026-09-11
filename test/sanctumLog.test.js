import test from 'node:test'
import assert from 'node:assert/strict'
import { SanctumLogContext, sanctumLogFloor } from '../electron/modules/sanctum/logContext.js'
import { SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { AutomationLock } from '../electron/modules/automation/lock.js'
import { sanctumLogEvents } from './helpers/sanctumLog.js'
import { liveProfile } from '../shared/sanctumLive.js'
import { runPython } from './helpers/python.js'

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
const environment = { windowId: 'game', processId: 123, width: 1920, height: 1080, dpi: 96 }
const region = { x: 0, y: 0, width: 1000, height: 700 }
const profile = () => liveProfile({ version: 2, environment, mapRegion: region, effectIconsRegion: region,
  captures: { mapRegion: { png, environment, region }, effectIconsRegion: { png, environment, region } } })
const signal = () => new AbortController().signal
const tick = () => new Promise(resolve => setImmediate(resolve))
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }

test('启动在环境检查前调用全局激活一次，配置失败不激活，激活失败不发原生命令', async t => {
  const f = fixture(t), calls = []
  f.driver.windowActivation = { async activateGame(options) { calls.push(options); assert.deepEqual(f.commands, []); return { success: true } } }
  await assert.rejects(f.driver.prepare({}, signal(), new AutomationLock()))
  assert.deepEqual(calls, [])
  await f.driver.prepare(profile(), signal(), new AutomationLock())
  assert.deepEqual(calls, [{ source: 'sanctum-start' }])
  await f.driver.dispose()
  f.commands.length = 0
  f.driver.windowActivation = { async activateGame() { return { success: false, code: 'focus-refused' } }, gameFailureMessage: code => `激活失败：${code}` }
  await assert.rejects(f.driver.prepare(profile(), signal(), new AutomationLock()), /激活失败：focus-refused/)
  assert.deepEqual(f.commands, [])
})

test('等待全局激活或环境结果时停止，不继续 arm；恢复焦点不会自动激活', async t => {
  for (const stage of ['activation', 'environment']) {
    const f = fixture(t), entered = deferred(), release = deferred(), controller = new AbortController()
    let activations = 0
    f.driver.windowActivation = { async activateGame() {
      activations++
      if (stage === 'activation') { entered.resolve(); await release.promise }
      return { success: true }
    } }
    if (stage === 'environment') f.hooks.environment = async () => { entered.resolve(); await release.promise; return { environment } }
    const preparing = f.driver.prepare(profile(), controller.signal, new AutomationLock())
    await entered.promise
    controller.abort(); release.resolve()
    await assert.rejects(preparing, /abort/i)
    assert.equal(activations, 1)
    assert.equal(f.commands.includes('arm'), false)
    if (stage === 'activation') assert.deepEqual(f.commands, [])
  }
})

function fixture(t) {
  const log = sanctumLogEvents(), hooks = {}, commands = []
  let time = 0, aborted = 0, mode = 'map'
  const frame = () => ({ environment, foreground: true, userTakeover: false, mapOpen: true, interfaceMatched: true,
    fingerprint: 'map', mapFingerprint: 'map', timestamp: time += 400,
    floor: { currentRoomId: 'a', positionSource: 'paths', titleTexts: ['所有层相同的标题'], areaLevelTexts: ['区域等级：1'],
      rooms: [{ id: 'a', column: 0, currentCandidate: true, revealed: false }, { id: 'b', column: 1, terminal: true, revealed: false }],
      edges: [{ from: 'a', to: 'b', status: 'matched', availability: 'gold' }] } })
  const driver = new SanctumLiveDriver({ catalog: { entries: [] }, clientEvents: log.events, wait: tick,
    windowActivation: { async activateGame() { return { success: true } } },
    withHidden: async fn => { await hooks.hidden?.(); return fn() },
    detection: { getTitleConfig: () => ({ templates: { 'sanctum-hud': { png, environment }, 'sanctum-map': { png, environment } }, threshold: .8 }),
      registerConsumer: async () => {}, unregisterConsumer() {}, subscribe: () => () => {},
      getState: () => ({ running: true, foreground: true, receivedAt: Date.now(), interfaces: { 'sanctum-hud': { matched: true }, 'sanctum-map': { matched: mode === 'map' } } }) },
    makeClient: () => ({ abort() { aborted++ }, shutdown: async () => {}, async request(command, input) {
      commands.push(command)
      if (hooks[command]) return hooks[command]()
      if (command === 'prepareFrames') return {count:8}
      if (command === 'freezeBaseline') return {baselineVersion:1}
      if (command === 'environment' || command === 'arm') return { environment }
      if (command === 'interfaceState') return { environment, mapOpen: mode !== 'effects', hudVisible: mode !== 'map', hudLayout: mode === 'both' ? 'map' : mode === 'effects' ? 'standalone' : null }
      if (command === 'toggleMap') { mode = input.targetMode; return { environment, mapOpen: mode !== 'effects', hudVisible: mode !== 'map', hudLayout: mode === 'both' ? 'map' : mode === 'effects' ? 'standalone' : null } }
      if (command === 'inspectEffects') return { environment, icons: [] }
      if (command === 'observe') return frame()
      if (command === 'hover') return { texts: [], mapFingerprint: 'map', observation: frame() }
      throw new Error(`Unexpected ${command}`)
    } }) })
  t.after(() => driver.close())
  return { ...log, driver, hooks, commands, frame, get aborted() { return aborted } }
}

test('四层及编号入口精确映射，等级独立校验，其他入口保持未知', () => {
  for (const [index, name] of ['Cellar', 'Vaults', 'Nave', 'Crypt'].entries()) {
    for (const areaId of [`Sanctum${name}`, `sAnCtUm${name}`, `SanctumFoyer_${index + 1}`, `SanctumFoyer_${index + 1}_3`]) {
      assert.deepEqual(sanctumLogFloor({ areaId, areaLevel: 83 }), {
        floorId: `floor:${index}`, floorNumber: index + 1, areaLevel: 83, identitySource: 'client-log'
      })
    }
  }
  for (const areaId of ['', 'SanctumFoyer', 'SanctumFoyer_Fellshrine', 'SanctumFoyer_5', 'SanctumFoyer_10', 'SanctumFoyer_5_3', 'SanctumFoyer_3_0', 'SanctumFoyer_3_-1', 'SanctumFoyer_3_03', 'SanctumFoyer_3_3x', 'SanctumVaultsBoss', 'constructor']) {
    assert.equal(sanctumLogFloor({ areaId, areaLevel: 83 }).floorId, null)
    assert.equal(sanctumLogFloor({ areaId, areaLevel: 83 }).areaLevel, null)
  }
  for (const areaLevel of [null, undefined, '83', 0, 101, 83.5, NaN]) {
    assert.equal(sanctumLogFloor({ areaId: 'SanctumVaults', areaLevel }).areaLevel, null)
    assert.equal(sanctumLogFloor({ areaId: 'SanctumVaults', areaLevel }).floorId, 'floor:1')
  }
})

test('相同标题按日志确认四层，目录空白也能识别，重启采集生成独立 runId', async t => {
  const f = fixture(t), runs = new Set()
  for (let n = 1; n <= 4; n++) {
    f.enter({ areaId: `SanctumFoyer_${n}`, areaLevel: 80 + n })
    await f.driver.prepare(profile(), signal(), new AutomationLock())
    const floor = f.driver.inspect().floor
    assert.equal(floor.floorId, `floor:${n - 1}`)
    assert.equal(floor.areaLevel, 80 + n)
    assert.equal(floor.identityConfirmed, true)
    runs.add(floor.runId)
    await f.driver.dispose()
  }
  assert.equal(runs.size, 4)
  assert.equal(f.events.status.state, 'started')
  assert.equal(f.events.eventListeners.size, 0)
})

test('准备阶段验证日志可用性、进程和区域，失败不 arm 或悬停', async t => {
  for (const [change, message] of [
    [f => { f.events.status.enabled = false; f.events.ensureStarted = async () => { throw new Error('请配置 Client.txt') } }, /Client.txt/],
    [f => f.events.setState({ state: 'resyncing' }), /日志|区域/],
    [f => f.events.setGameState('loading', 'loading'), /进入区域/],
    [f => f.enter({ processId: 456 }), /进程/],
    [f => f.enter({ areaId: 'SanctumFoyer_Fellshrine' }), /楼层/],
    [f => f.enter({ eventId: null }), /会话/]
  ]) {
    const f = fixture(t)
    // A resyncing shared listener can be enabled without yet having a current context.
    if (message.source === '日志|区域') f.events.ensureStarted = async () => f.events.snapshot()
    change(f)
    await assert.rejects(f.driver.prepare(profile(), signal(), new AutomationLock()), message)
    assert.equal(f.commands.includes('arm'), false)
    assert.equal(f.commands.includes('hover'), false)
  }
})

test('停止等待日志准备后，迟到的启动结果不会进入原生采集', async t => {
  const f = fixture(t), started = deferred(), pending = deferred(), controller = new AbortController()
  f.events.ensureStarted = () => { started.resolve(); return pending.promise }
  const preparing = f.driver.prepare(profile(), controller.signal, new AutomationLock())
  await started.promise
  controller.abort()
  pending.resolve()
  await assert.rejects(preparing, /abort/i)
  assert.deepEqual(f.commands, [])
})

test('地图准备首次启用共享监听，再次采集复用监听而不重启或关闭', async t => {
  const f = fixture(t)
  let stored = { enabled: false, logPath: '' }, starts = 0, stops = 0
  await f.events.stop()
  f.events.status.enabled = false
  f.events.settings = { async save(patch) { stored = { ...stored, ...patch }; return stored } }
  f.events.detectPath = async () => 'Client.txt'
  f.events.Tailer = class {
    constructor(options) { this.options = options }
    async start() {
      starts++
      this.options.onState({ state: 'started' })
      this.options.onLine('2026/09/09 12:00:00 1 [INFO Client 123] Generating level 82 area "SanctumVaults" with seed 123',
        { sourceId: 'source', fileId: 'file', offset: 0 })
      this.options.onLine('2026/09/09 12:00:01 1 [INFO Client 123] : You have entered The Sanctum Vaults.',
        { sourceId: 'source', fileId: 'file', offset: 100 })
    }
    stop() { stops++ }
  }
  await f.driver.prepare(profile(), signal(), new AutomationLock())
  assert.equal(f.driver.inspect().floor.floorId, 'floor:1')
  assert.equal(f.driver.inspect().floor.areaLevel, 82)
  await f.driver.dispose()
  await f.driver.prepare(profile(), signal(), new AutomationLock())
  await f.driver.dispose()
  assert.equal(starts, 1)
  assert.equal(stops, 0)
  assert.equal(stored.enabled, true)
})

test('共享日志有界恢复只接受当前进程区域，圣所不恢复旧统计或旧采集轮次', async t => {
  const f = fixture(t)
  f.events.context = null
  f.events.processProvider = async () => [{ id: 123, startedAt: '2026-09-09T11:00:00' }]
  const body = (pid, message) => `2026/09/09 12:00:00 1 [INFO Client ${pid}] ${message}`
  await f.events.recover([
    body(456, 'Generating level 83 area "SanctumCrypt" with seed 1'),
    body(123, 'Generating level 82 area "SanctumNave" with seed 2'),
    body(123, ': You have entered The Sanctum.'),
    body(123, ': You have died.')
  ].map((line, offset) => ({ line, sourceId: 'source', fileId: 'file', offset })))
  await f.driver.prepare(profile(), signal(), new AutomationLock())
  assert.equal(f.driver.inspect().floor.floorId, 'floor:2')
  assert.equal(f.driver.inspect().floor.areaLevel, 82)
  assert.equal(f.events.events.filter(event => event.recovered).length, 1)
  assert.equal(f.events.events.some(event => event.type === 'player-death'), false)
})

test('没有新日志不使楼层过期，其他白名单事件不使绑定失效', () => {
  const f = sanctumLogEvents()
  f.enter({ logTime: '2000/01/01 00:00:00', recovered: true })
  const bound = new SanctumLogContext(f.events, 123, () => assert.fail('不应失效'))
  try {
    f.events.push({ type: 'character-level', level: 90 })
    f.events.push({ type: 'player-death' })
    assert.equal(bound.assertCurrent().floorId, 'floor:0')
  } finally { bound.close() }
})

test('区域、等级、种子、会话、加载、断线及轮换均锁定失败，恢复不能复活旧绑定', () => {
  const changes = [f => f.enter(), f => f.enter({ areaId: 'SanctumVaults' }), f => f.enter({ areaLevel: 84 }),
    f => f.enter({ seed: '456' }), f => f.enter({ sessionKey: 'other' }), f => f.enter({ processId: 456 }),
    f => f.events.setGameState('loading', 'loading'), f => f.events.setGameState('disconnected', 'disconnect'),
    f => f.events.setState({ state: 'resyncing' }), f => f.events.setState({ state: 'waiting' })]
  for (const change of changes) {
    const f = sanctumLogEvents(), failures = []
    const bound = new SanctumLogContext(f.events, 123, error => failures.push(error))
    change(f)
    assert.equal(failures.length, 1)
    f.events.status.state = 'started'; f.enter()
    assert.throws(() => bound.assertCurrent())
    assert.equal(failures.length, 1)
    assert.equal(f.events.eventListeners.size, 0)
  }
})

test('原生观察前切区，禁止发送新的请求', async t => {
  const f = fixture(t)
  await f.driver.prepare(profile(), signal(), new AutomationLock())
  const before = f.commands.length
  f.enter({ areaId: 'SanctumVaults' })
  await assert.rejects(f.driver.observe(signal()), /变化/)
  assert.equal(f.commands.length, before)
  assert.equal(f.aborted, 1)
})

test('截图与悬停迟到结果、返回进程不一致或缺失均不能更新当前快照', async t => {
  for (const command of ['observe', 'hover']) {
    for (const mismatch of ['log', 'process', 'missing']) {
      const f = fixture(t)
      await f.driver.prepare(profile(), signal(), new AutomationLock())
      f.hooks[command] = async () => {
        const frame = f.frame()
        if (mismatch === 'log') f.enter({ areaId: 'SanctumVaults' })
        else frame.environment = { ...environment, processId: mismatch === 'process' ? 456 : undefined }
        return command === 'observe' ? frame : { texts: ['迟到信息'], observation: frame, mapFingerprint: 'map' }
      }
      await assert.rejects(command === 'observe' ? f.driver.observe(signal()) : f.driver.hover({ id: 'a' }, { signal: signal(), guard() {} }), /变化/)
      assert.equal(f.driver.inspect().floor, undefined)
      assert.equal(f.aborted, 1)
      await f.driver.dispose()
    }
  }
})

test('服务在原生请求尚未返回时立即撤销推荐与等级，迟到结果不恢复，共享日志继续运行', async t => {
  const f = fixture(t), service = new SanctumService({}), lock = new AutomationLock()
  const ready = deferred(), waiting = deferred(), release = deferred()
  service.attachLiveDriver(f.driver, lock); service.setEnabled(true); service.state.liveCalibration = profile()
  service.subscribe(state => { if (state.recommendation && state.floor?.identityConfirmed) ready.resolve() })
  f.hooks.inspectEffects = () => { waiting.resolve(); return release.promise }
  const task = service.startLive()
  t.after(async () => { release.resolve({ environment, icons:[] }); service.stop(); await task; await service.shutdown() })
  await Promise.race([ready.promise, task.then(() => { throw new Error(service.state.reason) })])
  assert.equal(service.state.floor.areaLevel, 83)
  await Promise.race([waiting.promise, task.then(() => { throw new Error(service.state.reason) })])
  f.events.setGameState('loading', 'area-loading')
  assert.equal(service.state.floor.identityConfirmed, false)
  assert.equal(service.state.recommendation, null)
  assert.equal(service.state.running, false)
  assert.match(service.state.reason, /手动重新开始/)
  f.enter({ areaId: 'SanctumVaults' })
  release.resolve({ environment, icons:[] }); await task
  assert.equal(service.state.floor.identityConfirmed, false)
  assert.equal(service.state.recommendation, null)
  assert.equal(f.events.status.state, 'started')
  // Only the read-only whole-run watcher survives between captures.
  assert.equal(f.events.eventListeners.size, 1)
  await service.shutdown()
  assert.equal(f.events.eventListeners.size, 0)
  assert.equal(lock.getState().locked, false)
})

test('原生环境返回前台窗口进程，无法读取进程时拒绝环境', () => {
  const result = runPython(`
import ctypes,json,sys
from ctypes import wintypes
sys.path.insert(0,'src/assets/scripts')
import sanctum_native as native
class User32:
    pid=321
    def GetForegroundWindow(self): return 10
    def GetClientRect(self, hwnd, rect):
        value=ctypes.cast(rect,ctypes.POINTER(wintypes.RECT)).contents
        value.right=1920; value.bottom=1080; return 1
    def ClientToScreen(self, hwnd, point): return 1
    def GetDpiForWindow(self, hwnd): return 96
    def GetWindowThreadProcessId(self, hwnd, pid):
        ctypes.cast(pid,ctypes.POINTER(wintypes.DWORD)).contents.value=self.pid
session=native.NativeSession.__new__(native.NativeSession)
session.u=User32();session.matches_game=lambda hwnd:True
value=session.environment()['environment']
session.u.pid=0
try: session.environment(); failed=False
except native.NativeError: failed=True
print(json.dumps({'processId':value['processId'],'rejected':failed}))
`)
  assert.deepEqual(result, { processId: 321, rejected: true })
})
