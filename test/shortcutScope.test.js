import test from 'node:test'
import assert from 'node:assert/strict'
import assertLoose from 'node:assert'
import { readFileSync } from 'node:fs'
import { EventEmitter } from 'node:events'
import vm from 'node:vm'
import { DIAGNOSTIC_OPERATIONS, DIAGNOSTIC_REASON_CODES } from '../electron/modules/system/diagnostics.js'
import { createEventLineParser } from '../electron/modules/system/foregroundWatcher.js'

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const flush = (ms = 5) => new Promise((resolve) => setTimeout(resolve, ms))

function createGlobalShortcutMock(failAccelerators = new Set()) {
  const registered = new Map()
  const calls = []
  return {
    registered,
    calls,
    register(accelerator, callback) {
      calls.push(['register', accelerator])
      if (failAccelerators.has(accelerator)) return false
      registered.set(accelerator, callback)
      return true
    },
    unregister(accelerator) {
      calls.push(['unregister', accelerator])
      registered.delete(accelerator)
    }
  }
}

function loadShortcutManager(globalShortcutMock) {
  const transformed = source('../electron/modules/shortcuts/manager.js')
    .replace("import { globalShortcut } from 'electron'\n", '')
    .replace("import { toElectronAccelerator } from '../../../src/utils/electronAccelerator.js'\n", '')
    .replaceAll('export function ', 'function ')
    .replaceAll('export const ', 'const ')
  const exports = [
    'registerConfiguredShortcut',
    'unregisterConfiguredShortcut',
    'setConfiguredShortcuts',
    'setScopeEnabled',
    'setScopeActive',
    'setScopeAvailable',
    'getScopeState',
    'registerGlobalShortcut',
    'unregisterGlobalShortcut',
    'unregisterAll',
    'getRegisteredShortcuts',
    'getIntendedShortcuts'
  ].join(', ')
  const sandbox = {
    console,
    globalShortcut: globalShortcutMock,
    toElectronAccelerator: (value) => String(value || '').trim(),
    Map,
    Set,
    Object,
    Boolean,
    String,
    Array,
    JSON,
    Error,
    Number
  }
  vm.createContext(sandbox)
  vm.runInContext(`${transformed}\nglobalThis.__shortcutManager = { ${exports} }`, sandbox)
  return sandbox.__shortcutManager
}

test('门禁默认开启且游戏未前台时保存意图但不注册', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  const result = manager.setConfiguredShortcuts([
    { key: 'portal', accelerator: 'B', callback: () => {} },
    { key: 'end', accelerator: 'Alt+3', callback: () => {} }
  ])
  assert.equal(result.success, true)
  assertLoose.deepEqual(result.deferred, ['B', 'Alt+3'])
  assert.equal(mock.registered.size, 0)
  assert.equal(manager.getScopeState().enabled, true)
  assert.equal(manager.getScopeState().available, true)
  assert.equal(manager.getScopeState().gameForeground, false)
})

test('游戏前台注册全部意图，失焦立即全部注销', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  manager.setConfiguredShortcuts([
    { key: 'portal', accelerator: 'B', callback: () => {} },
    { key: 'end', accelerator: 'Alt+3', callback: () => {} }
  ])
  manager.setScopeActive(true)
  assert.deepEqual([...mock.registered.keys()].sort(), ['Alt+3', 'B'])
  assert.equal(manager.getScopeState().gameForeground, true)
  manager.setScopeActive(false)
  assert.equal(mock.registered.size, 0)
  assert.equal(manager.getScopeState().gameForeground, false)
})

test('前台状态携带窗口与进程不匹配的具体原因', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  manager.setScopeActive(false, {
    reason: 'process-name-mismatch',
    title: 'Path of Exile 编年史 - Google Chrome',
    processName: 'chrome.exe'
  })
  assert.equal(manager.getScopeState().gameForeground, false)
  assert.equal(manager.getScopeState().reason, 'process-name-mismatch')
  assert.equal(manager.getScopeState().windowTitle, 'Path of Exile 编年史 - Google Chrome')
  assert.equal(manager.getScopeState().processName, 'chrome.exe')
  manager.setScopeActive(true, { reason: 'game-foreground', title: '流放之路', processName: 'PathOfExile.exe' })
  assert.equal(manager.getScopeState().reason, 'game-foreground')
  assert.equal(manager.getScopeState().windowTitle, '流放之路')
})

test('关闭门禁开关立即无条件注册，重新开启后恢复前台约束', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  manager.setConfiguredShortcuts([
    { key: 'portal', accelerator: 'B', callback: () => {} },
    { key: 'end', accelerator: 'Alt+3', callback: () => {} }
  ])
  manager.setScopeEnabled(false)
  assert.equal(manager.getScopeState().enabled, false)
  assert.equal(mock.registered.size, 2)
  manager.setScopeEnabled(true)
  assert.equal(mock.registered.size, 0)
  manager.setScopeActive(true)
  assert.equal(mock.registered.size, 2)
})

test('单个快捷键在门禁下延迟注册，注销后不再复活', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  const result = manager.registerConfiguredShortcut('Ctrl+D', 'priceCheck', () => {})
  assertLoose.deepEqual(result, { success: true, deferred: true, accelerator: 'Ctrl+D' })
  assert.equal(mock.registered.has('Ctrl+D'), false)
  manager.setScopeActive(true)
  assert.equal(mock.registered.has('Ctrl+D'), true)
  manager.unregisterConfiguredShortcut('Ctrl+D')
  assert.equal(mock.registered.has('Ctrl+D'), false)
  manager.setScopeActive(false)
  manager.setScopeActive(true)
  assert.equal(mock.registered.has('Ctrl+D'), false)
})

test('集合注册失败回滚到上一组成功注册集合', () => {
  const failSet = new Set()
  const mock = createGlobalShortcutMock(failSet)
  const manager = loadShortcutManager(mock)
  manager.setScopeActive(true)
  manager.setConfiguredShortcuts([
    { key: 'end', accelerator: 'Alt+3', callback: () => {} }
  ])
  failSet.add('B')
  const result = manager.setConfiguredShortcuts([
    { key: 'end', accelerator: 'Alt+3', callback: () => {} },
    { key: 'portal', accelerator: 'B', callback: () => {} }
  ])
  assert.equal(result.success, false)
  assertLoose.deepEqual(result.failed, ['B'])
  assert.deepEqual([...mock.registered.keys()], ['Alt+3'])
  assert.deepEqual([...manager.getIntendedShortcuts().keys()], ['Alt+3'])
})

test('前台监视器不可用时回退为无条件注册', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  manager.setConfiguredShortcuts([
    { key: 'portal', accelerator: 'B', callback: () => {} }
  ])
  manager.setScopeAvailable(false)
  assert.equal(manager.getScopeState().available, false)
  assert.equal(mock.registered.has('B'), true)
})

test('原始注册接口不受门禁约束（快捷键捕获挂起恢复使用）', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  assert.equal(manager.registerGlobalShortcut('F9', () => {}), true)
  assert.equal(mock.registered.has('F9'), true)
  manager.unregisterGlobalShortcut('F9')
  assert.equal(mock.registered.has('F9'), false)
})

function fakeChild() {
  const child = new EventEmitter()
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  child.pid = 40000 + Math.floor(Math.random() * 10000)
  return child
}

function loadForegroundWatcher(spawnImpl, killImpl = () => Promise.resolve(true)) {
  const transformed = source('../electron/modules/system/foregroundWatcher.js')
    .replace("import { spawn } from 'node:child_process'\n", '')
    .replace("import { killPythonProcessTree } from '../python/process.js'\n", '')
    .replace('export function createEventLineParser', 'function createEventLineParser')
    .replace('export function startForegroundWatcher', 'function startForegroundWatcher')
  const sandbox = {
    console,
    process,
    spawn: spawnImpl,
    killPythonProcessTree: killImpl,
    queueMicrotask,
    setTimeout,
    clearTimeout
  }
  vm.createContext(sandbox)
  vm.runInContext(`${transformed}\nglobalThis.__watcher = { createEventLineParser, startForegroundWatcher }`, sandbox)
  return sandbox.__watcher
}

test('事件行解析器支持跨 chunk 的 EVENT 行并忽略普通日志', () => {
  const events = []
  const parse = createEventLineParser((event) => events.push(event))
  parse('普通日志\nEVENT {"event":"foreground","game":true,"title":"流放之路"}\nEVENT {"ev')
  parse('ent":"foreground","game":false}\n')
  assert.deepEqual(events, [
    { event: 'foreground', game: true, title: '流放之路' },
    { event: 'foreground', game: false }
  ])
})

test('缺少 Python 或脚本路径时立即失败且不启动进程', async () => {
  const spawned = []
  const loader = loadForegroundWatcher((...args) => {
    spawned.push(args)
    throw new Error('不应启动子进程')
  })
  let failure = null
  const watcher = loader.startForegroundWatcher({
    pythonPath: '',
    scriptPath: '',
    onStateChange: () => {},
    onFailure: (error) => { failure = error }
  })
  await flush()
  assert.match(failure.message, /缺少 Python 路径或脚本路径/)
  assert.equal(watcher.getState().state, 'unavailable')
  assert.equal(spawned.length, 0)
})

test('监视器解析前台事件并驱动状态回调', async () => {
  const children = []
  const spawned = []
  const loader = loadForegroundWatcher((...args) => {
    spawned.push(args)
    const child = fakeChild()
    children.push(child)
    return child
  })
  const states = []
  const watcher = loader.startForegroundWatcher({
    pythonPath: 'python',
    scriptPath: 'foreground_watcher.py',
    onStateChange: (state) => states.push(state),
    onFailure: () => {}
  })
  assert.equal(watcher.getState().state, 'starting')
  assert.equal(spawned.length, 1)
  children[0].stdout.emit('data', 'EVENT {"event":"foreground","game":true,"title":"流放之路"}\n')
  assertLoose.deepEqual(states, [{ game: true, title: '流放之路', reason: '', processName: '' }])
  assert.equal(watcher.getState().state, 'ready')
  children[0].stdout.emit('data', 'EVENT {"event":"foreground","game":false,"title":"微信"}\n')
  assertLoose.deepEqual(states.at(-1), { game: false, title: '微信', reason: '', processName: '' })
  children[0].stdout.emit('data', 'EVENT {"event":"foreground","game":false,"title":"Path of Exile 编年史 - Google Chrome","reason":"process-name-mismatch","processName":"chrome.exe"}\n')
  assertLoose.deepEqual(states.at(-1), {
    game: false,
    title: 'Path of Exile 编年史 - Google Chrome',
    reason: 'process-name-mismatch',
    processName: 'chrome.exe'
  })
  watcher.stop()
})

test('监视器异常退出按退避重启，重试耗尽后失败回调', async () => {
  const children = []
  const spawned = []
  const loader = loadForegroundWatcher((...args) => {
    spawned.push(args)
    const child = fakeChild()
    children.push(child)
    return child
  })
  let failures = 0
  const watcher = loader.startForegroundWatcher({
    pythonPath: 'python',
    scriptPath: 'foreground_watcher.py',
    onStateChange: () => {},
    onFailure: () => { failures += 1 },
    maxRestarts: 1,
    restartDelayMs: 1
  })
  children[0].emit('close', 1)
  await flush(10)
  assert.equal(spawned.length, 2)
  children[1].emit('close', 1)
  await flush(10)
  assert.equal(failures, 1)
  assert.equal(watcher.getState().state, 'exited')
  watcher.stop()
})

test('停止后杀死进程树且不再重启', async () => {
  const children = []
  const killed = []
  const loader = loadForegroundWatcher((...args) => {
    const child = fakeChild()
    children.push(child)
    return child
  }, (pid) => {
    killed.push(pid)
    return Promise.resolve(true)
  })
  const watcher = loader.startForegroundWatcher({
    pythonPath: 'python',
    scriptPath: 'foreground_watcher.py',
    onStateChange: () => {},
    onFailure: () => {}
  })
  const pid = children[0].pid
  watcher.stop()
  assert.deepEqual(killed, [pid])
  children[0].emit('close', 0)
  await flush(10)
  assert.equal(children.length, 1)
})

test('IPC、preload 与渲染 API 暴露前台门禁协议', () => {
  const ipc = source('../electron/modules/ipc/shortcut.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  assert.match(ipc, /shortcut-set-scope-enabled/)
  assert.match(ipc, /shortcut-get-scope-state/)
  assert.match(ipc, /setConfiguredShortcuts\(entries\)/)
  assert.match(ipc, /deferred: Boolean\(result\.deferred\)/)
  assert.match(preload, /setShortcutScopeEnabled/)
  assert.match(preload, /getShortcutScopeState/)
  assert.match(preload, /onShortcutScopeChanged/)
  assert.match(api, /setScopeEnabled/)
  assert.match(api, /getScopeState/)
  assert.match(api, /onScopeChanged/)
})

test('设置页、首页状态与设置存储展示前台门禁', () => {
  const settingsView = source('../src/domains/settings/SettingsView.vue')
  const dashboard = source('../src/domains/dashboard/useDashboard.js')
  const store = source('../src/domains/settings/settingsStore.js')
  assert.match(settingsView, /仅在游戏窗口前台时生效/)
  assert.match(settingsView, /handleShortcutScopeToggle/)
  assert.match(dashboard, /快捷键已暂停（游戏未在前台）/)
  assert.match(dashboard, /快捷键已暂停（前台窗口标题未匹配游戏窗口名称）/)
  assert.match(dashboard, /快捷键已暂停（窗口标题匹配，但进程名不是游戏客户端）/)
  assert.match(dashboard, /前台监视不可用/)
  assert.match(store, /shortcutScopeEnabled/)
  assert.match(store, /shortcutScopeReason/)
  assert.match(store, /applyShortcutScopeState/)
  assert.match(store, /setShortcutScopeEnabled/)
})

test('启动同步先比较本地开关，重置与失败路径保持主从状态一致', () => {
  const scriptService = source('../src/utils/scriptService.js')
  const settingsStore = source('../src/domains/settings/settingsStore.js')
  const dashboard = source('../src/domains/dashboard/useDashboard.js')
  const main = source('../electron/main.js')
  assert.match(scriptService, /const storedEnabled = settingsStore\.shortcutScopeEnabled/)
  assert.ok(scriptService.indexOf('const storedEnabled') < scriptService.indexOf('applyShortcutScopeState(scopeState)'))
  assert.match(settingsStore, /const previous = shortcutScopeEnabled\.value/)
  assert.match(settingsStore, /setScopeEnabled\(true\)/)
  assert.match(dashboard, /item\.status === 'pending' \|\| item\.status === 'attention'/)
  assert.match(main, /createApplicationWindow\(\)[\s\S]*?setImmediate\(\(\) => \{[\s\S]*?startForegroundWatcher/)
})

test('诊断允许集合包含前台门禁事件与回退原因', () => {
  assert.ok(DIAGNOSTIC_OPERATIONS.has('shortcut_scope'))
  assert.ok(DIAGNOSTIC_REASON_CODES.has('foreground_watcher_failed'))
  assert.ok(DIAGNOSTIC_REASON_CODES.has('shortcut_scope_paused'))
  assert.ok(DIAGNOSTIC_REASON_CODES.has('shortcut_scope_title_mismatch'))
  assert.ok(DIAGNOSTIC_REASON_CODES.has('shortcut_scope_process_mismatch'))
  assert.ok(DIAGNOSTIC_REASON_CODES.has('shortcut_scope_no_foreground_window'))
})

test('打包资源与运行时清单包含前台监视脚本', () => {
  const packageConfig = JSON.parse(source('../package.json'))
  const manifest = JSON.parse(source('../scripts/runtime/manifest.json'))
  assert.ok(packageConfig.build.extraResources.some((entry) => (
    entry.from === 'src/assets/scripts/foreground_watcher.py' && entry.to === 'foreground_watcher.py'
  )))
  assert.ok(manifest.requiredScripts.includes('src/assets/scripts/foreground_watcher.py'))
  const main = source('../electron/main.js')
  assert.match(main, /startForegroundWatcher/)
  assert.match(main, /foregroundWatcher\?\.stop\(\)/)
  const watcherScript = source('../src/assets/scripts/foreground_watcher.py')
  assert.match(watcherScript, /foreground_state = \(game, reason, process_name\)/)
  assert.match(watcherScript, /if foreground_state != _last_foreground_state:/)
})
