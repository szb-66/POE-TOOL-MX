import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createApplicationTrayController } from '../electron/modules/lifecycle/tray.js'
import {
  WINDOW_CLOSE_BEHAVIOR_EXIT,
  WINDOW_CLOSE_BEHAVIOR_TRAY,
  normalizeWindowCloseBehavior
} from '../shared/windowCloseBehavior.js'

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
