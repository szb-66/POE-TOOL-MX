import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync, readdirSync as _m0_readdirSync } from 'node:fs'
import _m0_path from 'node:path'
import { fileURLToPath as _m0_fileURLToPath } from 'node:url'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFileSync as _m1_readFileSync } from 'node:fs'
import { createApplicationTrayController as _m1_createApplicationTrayController } from '../electron/modules/lifecycle/tray.js'
import { WINDOW_CLOSE_BEHAVIOR_EXIT as _m1_WINDOW_CLOSE_BEHAVIOR_EXIT, WINDOW_CLOSE_BEHAVIOR_TRAY as _m1_WINDOW_CLOSE_BEHAVIOR_TRAY, normalizeWindowCloseBehavior as _m1_normalizeWindowCloseBehavior } from '../shared/windowCloseBehavior.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { EventEmitter as _m2_EventEmitter } from 'node:events'
import { restoreWindowToForeground as _m2_restoreWindowToForeground, restoreWindowsNativeWindowFocus as _m2_restoreWindowsNativeWindowFocus } from '../electron/modules/window/foregroundRestore.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { setWindowVisibilityImmediately as _m3_setWindowVisibilityImmediately } from '../electron/modules/window/transitions.js'

// === Merged from windowActivationArchitecture.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const readdirSync = _m0_readdirSync
  const path = _m0_path
  const fileURLToPath = _m0_fileURLToPath
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = relative => readFileSync(path.join(root, relative), 'utf8')

function filesUnder(relative, extension) {
  const directory = path.join(root, relative)
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const child = path.join(relative, entry.name)
    if (entry.isDirectory()) return filesUnder(child, extension)
    return entry.name.endsWith(extension) ? [child] : []
  })
}

test('Python 业务脚本只保留游戏前台校验，不再枚举或激活窗口', () => {
  const forbidden = /def (?:find_game_window|focus_game_window|activate_game_window)|\b(?:SetForegroundWindow|BringWindowToTop|AttachThreadInput)\b|activateGameWindow/
  for (const file of filesUnder('src/assets/scripts', '.py')) {
    assert.doesNotMatch(source(file), forbidden, file)
  }
})

test('游戏原生激活只存在于公共窗口激活模块', () => {
  const allowed = new Set([
    path.normalize('electron/modules/window/activation.js'),
    path.normalize('electron/modules/window/foregroundRestore.js')
  ])
  for (const file of filesUnder('electron/modules', '.js')) {
    if (allowed.has(path.normalize(file))) continue
    assert.doesNotMatch(source(file), /SetForegroundWindow|AttachThreadInput/, file)
  }
})

test('主窗口恢复业务不直接调用 focus，辅助窗口保持独立策略', () => {
  for (const file of [
    'electron/main.js',
    'electron/modules/window/manager.js',
    'electron/modules/faustus/manager.js',
    'electron/modules/puzzle/service.js',
    'electron/modules/ipc/window.js',
    'electron/modules/ipc/configurationGuide.js'
  ]) assert.doesNotMatch(source(file), /(?:main|mainWindow|existingWindow|window)\.focus\(\)/, file)

  assert.match(source('electron/modules/window/foregroundRestore.js'), /window\.focus\(\)/)
  assert.match(source('electron/modules/priceCheck/presentation.js'), /this\.window\.focus\(\)/)
  assert.match(source('electron/modules/chaosRecipe/auth.js'), /this\.loginWindow\.focus\(\)/)
})

test('所有创建自动化进程的主入口先调用公共游戏激活', () => {
  const expectations = new Map([
    ['electron/modules/ipc/python.js', 'activateGameWindow'],
    ['electron/modules/ipc/combat.js', 'activateGameWindow'],
    ['electron/modules/ipc/bag.js', 'activateGameWindow'],
    ['electron/modules/chaosRecipe/automation.js', 'windowActivation?.activateGame'],
    ['electron/modules/stashPickup/manager.js', 'windowActivation?.activateGame'],
    ['electron/modules/junfeng/manager.js', 'windowActivation?.activateGame'],
    ['electron/modules/puzzle/service.js', 'windowActivation?.activateGame'],
    ['electron/modules/faustus/manager.js', 'windowActivation?.activateGame']
  ])
  for (const [file, token] of expectations) assert.ok(source(file).includes(token), file)

  const ordered = [
    ['electron/modules/ipc/python.js', /activateGameWindow\('generated-automation'\)[\s\S]*fs\.writeFileSync\(scriptPath/],
    ['electron/modules/ipc/combat.js', /activateGameWindow\('combat-potion-start'\)[\s\S]*spawnCombatProcess/],
    ['electron/modules/ipc/bag.js', /activateGameWindow\('bag-auto-stash'\)[\s\S]*writeConfig\(fileWatcher, 'bag_stash_config\.json'/],
    ['electron/modules/chaosRecipe/automation.js', /activateGame\(\{ source: 'chaos-recipe-pickup' \}\)[\s\S]*this\.plan =/],
    ['electron/modules/stashPickup/manager.js', /activateGame\(\{ source: 'stash-pickup-start' \}\)[\s\S]*this\.writeConfig\(\)/],
    ['electron/modules/junfeng/manager.js', /activateGame\(\{ source: 'junfeng-pickup-start' \}\)[\s\S]*this\.writeConfig\(\)/],
    ['electron/modules/puzzle/service.js', /activateGame\(\{ source: 'puzzle-auto-placement' \}\)[\s\S]*fs\.writeFileSync\(configPath/],
    ['electron/modules/faustus/manager.js', /activateGame\(\{ source: 'faustus-start' \}\)[\s\S]*this\.spawnMode\('run'/]
  ]
  for (const [file, pattern] of ordered) assert.match(source(file), pattern, file)
})

test('renderer 不暴露任意窗口句柄或激活目标接口', () => {
  const preload = source('electron/preload.cjs')
  assert.doesNotMatch(preload, /ipcRenderer\.(?:invoke|send)\(['"](?:activate-(?:game|main)|window-activation|window-handle)/i)
})
})()

// === Merged from windowCloseBehavior.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFileSync = _m1_readFileSync
  const createApplicationTrayController = _m1_createApplicationTrayController
  const WINDOW_CLOSE_BEHAVIOR_EXIT = _m1_WINDOW_CLOSE_BEHAVIOR_EXIT
  const WINDOW_CLOSE_BEHAVIOR_TRAY = _m1_WINDOW_CLOSE_BEHAVIOR_TRAY
  const normalizeWindowCloseBehavior = _m1_normalizeWindowCloseBehavior
function createFixture() {
  const listeners = new Map()
  const tray = {
    destroyed: false,
    tooltip: '',
    menu: null,
    setToolTip(value) { this.tooltip = value },
    setContextMenu(value) { this.menu = value },
    on(event, handler) { listeners.set(event, handler) },
    destroy() { this.destroyed = true }
  }
  const window = {
    hidden: 0,
    shown: 0,
    restored: 0,
    minimized: false,
    visible: true,
    destroyed: false,
    hide() { this.hidden += 1; this.visible = false },
    show() { this.shown += 1; this.visible = true },
    restore() { this.restored += 1; this.minimized = false },
    isMinimized() { return this.minimized },
    isVisible() { return this.visible },
    isDestroyed() { return this.destroyed }
  }
  let quitting = false
  let quitCalls = 0
  let activateCalls = 0
  let createCalls = 0
  let closeChoiceRequests = 0
  const controller = createApplicationTrayController({
    app: { quit: () => { quitCalls += 1 } },
    icon: { kind: 'icon' },
    createTray: () => { createCalls += 1; return tray },
    createMenu: template => template,
    getMainWindow: () => window,
    activateMain: async () => { activateCalls += 1 },
    requestCloseChoice: () => { closeChoiceRequests += 1 },
    isQuitting: () => quitting
  })
  return {
    controller,
    tray,
    window,
    listeners,
    setQuitting: value => { quitting = value },
    counts: () => ({ quitCalls, activateCalls, createCalls, closeChoiceRequests })
  }
}

test('关闭行为默认和非法值均为彻底退出', () => {
  assert.equal(normalizeWindowCloseBehavior(), WINDOW_CLOSE_BEHAVIOR_EXIT)
  assert.equal(normalizeWindowCloseBehavior('unknown'), WINDOW_CLOSE_BEHAVIOR_EXIT)
  assert.equal(normalizeWindowCloseBehavior('tray'), WINDOW_CLOSE_BEHAVIOR_TRAY)
  assert.equal(createFixture().controller.behavior, WINDOW_CLOSE_BEHAVIOR_EXIT)
})

test('托盘模式拦截关闭并隐藏主窗口，退出过程中不再拦截', () => {
  const fixture = createFixture()
  fixture.controller.setBehavior(WINDOW_CLOSE_BEHAVIOR_TRAY)
  const event = { prevented: false, preventDefault() { this.prevented = true } }

  assert.equal(fixture.controller.handleMainWindowClose(event, fixture.window), true)
  assert.equal(event.prevented, true)
  assert.equal(fixture.window.hidden, 1)

  fixture.setQuitting(true)
  assert.equal(fixture.controller.handleMainWindowClose(event, fixture.window), false)
})

test('首次关闭请求用户选择，未记住时下次仍提示', () => {
  const fixture = createFixture()
  const event = { prevented: false, preventDefault() { this.prevented = true } }

  assert.equal(fixture.controller.handleMainWindowClose(event, fixture.window), true)
  assert.equal(event.prevented, true)
  assert.equal(fixture.window.hidden, 0)
  assert.equal(fixture.counts().closeChoiceRequests, 1)

  const result = fixture.controller.resolveCloseChoice({ behavior: 'tray', remember: false })
  assert.equal(result.success, true)
  assert.equal(fixture.window.hidden, 1)
  assert.equal(fixture.controller.promptSuppressed, false)

  fixture.controller.handleMainWindowClose(event, fixture.window)
  assert.equal(fixture.counts().closeChoiceRequests, 2)
})

test('记住首次关闭选择后不再提示，直接退出仍走 app.quit', () => {
  const fixture = createFixture()
  const event = { preventDefault() {} }
  fixture.controller.handleMainWindowClose(event, fixture.window)

  const result = fixture.controller.resolveCloseChoice({ behavior: 'exit', remember: true })
  assert.equal(result.success, true)
  assert.equal(fixture.controller.behavior, WINDOW_CLOSE_BEHAVIOR_EXIT)
  assert.equal(fixture.controller.promptSuppressed, true)
  assert.equal(fixture.counts().quitCalls, 1)
})

test('托盘左键和菜单恢复主窗口，菜单退出调用统一应用退出', async () => {
  const fixture = createFixture()
  fixture.window.visible = false
  fixture.window.minimized = true
  fixture.controller.setBehavior(WINDOW_CLOSE_BEHAVIOR_TRAY)

  fixture.listeners.get('click')()
  await Promise.resolve()
  assert.equal(fixture.window.restored, 1)
  assert.equal(fixture.window.shown, 1)
  assert.equal(fixture.counts().activateCalls, 1)

  const showItem = fixture.tray.menu.find(item => item.label === '显示主窗口')
  const quitItem = fixture.tray.menu.find(item => item.label === '退出应用')
  showItem.click()
  await Promise.resolve()
  quitItem.click()
  assert.equal(fixture.counts().activateCalls, 2)
  assert.equal(fixture.counts().quitCalls, 1)

  fixture.controller.setBehavior(WINDOW_CLOSE_BEHAVIOR_EXIT)
  assert.equal(fixture.tray.destroyed, true)
  assert.equal(fixture.controller.hasTray, false)
})

test('设置、IPC 与启动流程接通关闭行为', () => {
  const store = readFileSync(new URL('../src/domains/settings/settingsStore.js', import.meta.url), 'utf8')
  const view = readFileSync(new URL('../src/domains/settings/SettingsView.vue', import.meta.url), 'utf8')
  const preload = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
  const ipc = readFileSync(new URL('../electron/modules/ipc/window.js', import.meta.url), 'utf8')
  const runtime = readFileSync(new URL('../src/startup/mainRuntime.js', import.meta.url), 'utf8')

  assert.match(store, /windowCloseBehavior: windowCloseBehavior\.value/)
  assert.match(store, /windowCloseBehavior\.value = normalizeWindowCloseBehavior\(data\.windowCloseBehavior\)/)
  assert.match(store, /windowCloseBehavior\.value = WINDOW_CLOSE_BEHAVIOR_EXIT/)
  assert.match(store, /windowClosePromptSuppressed\.value = data\.windowClosePromptSuppressed === true/)
  assert.match(view, /label="关闭主窗口时"[\s\S]*彻底退出[\s\S]*最小化到系统托盘/)
  assert.match(preload, /window-close-behavior-update/)
  assert.match(preload, /window-close-choice-requested/)
  assert.match(ipc, /windowClose\?\.configure\(input\)/)
  assert.match(ipc, /windowClose\?\.resolveCloseChoice\(input\)/)
  assert.match(runtime, /settleSubsystem\('window-close',[\s\S]*settingsStore\.windowCloseBehavior/)
  assert.match(runtime, /不再提示/)
  assert.match(runtime, /设置 → 系统 → 系统设置/)
})
})()

// === Merged from windowForegroundRestore.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const EventEmitter = _m2_EventEmitter
  const restoreWindowToForeground = _m2_restoreWindowToForeground
  const restoreWindowsNativeWindowFocus = _m2_restoreWindowsNativeWindowFocus
class FakeWindow extends EventEmitter {
  constructor({ minimized = false, alwaysOnTop = false, focusAfter = 1, minimizeDelayMs = null } = {}) {
    super()
    this.minimized = minimized
    this.alwaysOnTop = alwaysOnTop
    this.focusAfter = focusAfter
    this.minimizeDelayMs = minimizeDelayMs
    this.focusAttempts = 0
    this.destroyed = false
    this.calls = []
  }

  isDestroyed() { return this.destroyed }
  isMinimized() { return this.minimized }
  isAlwaysOnTop() { return this.alwaysOnTop }
  isFocused() { return this.focusAttempts >= this.focusAfter }
  minimize() {
    this.calls.push(['minimize'])
    const complete = () => {
      this.minimized = true
      this.emit('minimize')
    }
    if (this.minimizeDelayMs === null) complete()
    else setTimeout(complete, this.minimizeDelayMs)
  }
  restore() { this.minimized = false; this.calls.push(['restore']) }
  show() { this.calls.push(['show']) }
  moveTop() { this.calls.push(['moveTop']) }
  focus() { this.focusAttempts += 1; this.calls.push(['focus']) }
  setAlwaysOnTop(value, level) {
    this.alwaysOnTop = value
    this.calls.push(['setAlwaysOnTop', value, level])
  }
}

const yieldFn = async () => {}

test('主窗口首次恢复成功时显示、移顶并聚焦且不改置顶状态', async () => {
  const window = new FakeWindow({ minimized: true })
  assert.equal(await restoreWindowToForeground(window, { yieldFn }), true)
  assert.deepEqual(window.calls, [['restore'], ['show'], ['moveTop'], ['focus']])
  assert.equal(window.alwaysOnTop, false)
})

test('可见窗口首次聚焦失败时仅执行一次最小化恢复补偿', async () => {
  const window = new FakeWindow({ focusAfter: 2 })
  assert.equal(await restoreWindowToForeground(window, { yieldFn }), true)
  assert.equal(window.focusAttempts, 2)
  assert.deepEqual(window.calls, [
    ['show'], ['moveTop'], ['focus'],
    ['minimize'], ['restore'], ['show'], ['moveTop'], ['focus']
  ])
  assert.equal(window.alwaysOnTop, false)
})

test('用户原本启用置顶时最小化恢复补偿不会改变置顶设置', async () => {
  const window = new FakeWindow({ alwaysOnTop: true, focusAfter: 2 })
  assert.equal(await restoreWindowToForeground(window, { yieldFn }), true)
  assert.equal(window.calls.some(([name]) => name === 'setAlwaysOnTop'), false)
  assert.equal(window.alwaysOnTop, true)
})

test('补偿会等待异步最小化完成后再恢复窗口', async () => {
  const window = new FakeWindow({ focusAfter: 2, minimizeDelayMs: 5 })
  assert.equal(await restoreWindowToForeground(window, { yieldFn }), true)
  assert.deepEqual(window.calls.slice(3, 5), [['minimize'], ['restore']])
  assert.equal(window.minimized, false)
})

test('窗口不存在、已销毁或两次均未聚焦时返回失败', async () => {
  assert.equal(await restoreWindowToForeground(null, { yieldFn }), false)
  const destroyed = new FakeWindow()
  destroyed.destroyed = true
  assert.equal(await restoreWindowToForeground(destroyed, { yieldFn }), false)
  const refused = new FakeWindow({ focusAfter: 3 })
  assert.equal(await restoreWindowToForeground(refused, { yieldFn }), false)
  assert.equal(refused.focusAttempts, 2)
  assert.equal(refused.calls.filter(([name]) => name === 'minimize').length, 1)
  assert.equal(refused.calls.filter(([name]) => name === 'restore').length, 1)
  assert.equal(refused.alwaysOnTop, false)
})

test('Windows 恢复优先使用原生前台切换，避免普通聚焦只闪任务栏', async () => {
  const window = new FakeWindow({ focusAfter: Number.POSITIVE_INFINITY })
  let nativeAttempts = 0
  const nativeFocusFn = async (target) => {
    assert.equal(target, window)
    nativeAttempts += 1
    window.focusAfter = 0
    return true
  }

  assert.equal(await restoreWindowToForeground(window, { yieldFn, nativeFocusFn }), true)
  assert.equal(nativeAttempts, 1)
  assert.deepEqual(window.calls, [])
})

test('原生前台切换未生效时才退回普通最小化恢复', async () => {
  const window = new FakeWindow({ focusAfter: 2 })
  const nativeFocusFn = async () => false

  assert.equal(await restoreWindowToForeground(window, { yieldFn, nativeFocusFn }), true)
  assert.deepEqual(window.calls, [
    ['show'], ['moveTop'], ['focus'],
    ['minimize'], ['restore'], ['show'], ['moveTop'], ['focus']
  ])
})

test('Windows 原生补偿使用主窗口句柄并核验前台切换结果', async () => {
  const handle = Buffer.alloc(8)
  handle.writeBigUInt64LE(0x123456789n)
  const window = { getNativeWindowHandle: () => handle }
  let invocation = null
  const execFileImpl = (executable, args, options, callback) => {
    invocation = { executable, args, options }
    callback(null)
  }

  assert.equal(await restoreWindowsNativeWindowFocus(window, {
    platform: 'win32',
    pythonPath: 'python.exe',
    execFileImpl
  }), true)
  assert.equal(invocation.executable, 'python.exe')
  assert.equal(invocation.args.at(-1), '4886718345')
  assert.match(invocation.args[1], /AttachThreadInput/)
  assert.match(invocation.args[1], /GetForegroundWindow\(\) == hwnd_value/)
  assert.equal(invocation.options.windowsHide, true)

  assert.equal(await restoreWindowsNativeWindowFocus(window, {
    platform: 'win32',
    pythonPath: 'python.exe',
    execFileImpl: (_executable, _args, _options, callback) => callback(new Error('refused'))
  }), false)
  assert.equal(await restoreWindowsNativeWindowFocus(window, { platform: 'linux', pythonPath: 'python.exe' }), false)
})
})()

// === Merged from windowTransitions.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const setWindowVisibilityImmediately = _m3_setWindowVisibilityImmediately
const key = 'wm-window-animations-disabled'
function fixture(existing = false) {
  const switches = new Set(existing ? [key] : [])
  const commandLine = { hasSwitch: k => switches.has(k), appendSwitch: k => switches.add(k), removeSwitch: k => switches.delete(k) }
  return { commandLine, switches }
}
for (const visible of [true, false]) test(`显隐 ${visible} 仅在调用期间关闭 Aura 动画`, () => {
  const { commandLine, switches } = fixture()
  const calls = []
  const window = {
    showInactive() { assert.ok(switches.has(key)); calls.push('show') },
    hide() { assert.ok(switches.has(key)); calls.push('hide') }
  }
  setWindowVisibilityImmediately(window, visible, commandLine)
  assert.deepEqual(calls, [visible ? 'show' : 'hide'])
  assert.equal(switches.has(key), false)
})
test('嵌套显隐保留外层开关，异常也恢复原状态', () => {
  const { commandLine, switches } = fixture()
  const window = { hide() { assert.ok(switches.has(key)) }, showInactive() {
    setWindowVisibilityImmediately(window, false, commandLine)
    assert.ok(switches.has(key))
    throw new Error('show failed')
  } }
  assert.throws(() => setWindowVisibilityImmediately(window, true, commandLine), /show failed/)
  assert.equal(switches.has(key), false)
})
test('已有开关保持不变', () => {
  const { commandLine, switches } = fixture(true)
  setWindowVisibilityImmediately({ showInactive() {} }, true, commandLine)
  assert.ok(switches.has(key))
})
})()
