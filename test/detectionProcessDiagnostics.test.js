import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { EventEmitter, once } from 'node:events'
import { spawn } from 'node:child_process'
import { pythonPath } from './helpers/python.js'
import { InterfaceTitleRegistry } from '../electron/modules/interfaceDetection/titleRegistry.js'
import { createDetectionProcessDiagnostics } from '../electron/modules/interfaceDetection/processDiagnostics.js'
import { createEventLineParser, waitForDetectionStartup, describeDetectionExit } from '../electron/modules/bag/orchestrator.js'
import { createStartupLogger } from '../electron/modules/system/startupLog.js'

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
