import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { normalizeGridRegion } from '../electron/modules/chaosRecipe/coordinates.js'
import { createLoadAwarePublisher } from '../electron/modules/window/loadAwarePublisher.js'

const REGION = { left: 100, top: 100, right: 700, bottom: 700 }

class FakeWebContents {
  constructor() {
    this.crashed = false
    this.sent = []
    this.listeners = {}
  }

  isCrashed() { return this.crashed }
  isLoadingMainFrame() { return false }
  on(name, handler) { (this.listeners[name] ||= []).push(handler) }
  send(channel, state) { this.sent.push([channel, state]) }
  emit(name) { for (const handler of this.listeners[name] || []) handler() }
}

class FakeWindow {
  constructor(bounds) {
    this.bounds = bounds
    this.destroyed = false
    this.shown = 0
    this.closeCalled = false
    this.handlers = {}
    this.onceHandlers = {}
    this.webContents = new FakeWebContents()
    FakeWindow.created.push(this)
  }

  on(name, handler) { (this.handlers[name] ||= []).push(handler); return this }
  once(name, handler) { (this.onceHandlers[name] ||= []).push(handler); return this }
  emit(name) {
    for (const handler of this.handlers[name] || []) handler()
    for (const handler of this.onceHandlers[name] || []) handler()
    this.onceHandlers[name] = []
  }
  setBounds(bounds) { this.bounds = bounds }
  showInactive() { this.shown += 1 }
  setIgnoreMouseEvents() {}
  setAlwaysOnTop() {}
  loadURL() { return Promise.resolve() }
  loadFile() { return Promise.resolve() }
  close() { this.closeCalled = true }
  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.emit('closed')
  }
  isDestroyed() { return this.destroyed }
}
FakeWindow.created = []

function loadOverlayManager() {
  const logs = []
  const source = readFileSync(new URL('../electron/modules/chaosRecipe/overlay.js', import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace("import { BrowserWindow, screen } from 'electron'\n", '')
    .replace("import path from 'node:path'\n", '')
    .replace("import { fileURLToPath } from 'node:url'\n", '')
    .replace("import { normalizeGridRegion } from './coordinates.js'\n", '')
    .replace("import { createLoadAwarePublisher } from '../window/loadAwarePublisher.js'\n", '')
    .replace("const moduleDir = path.dirname(fileURLToPath(import.meta.url))", "const moduleDir = ''")
    .replace('export class ChaosRecipeOverlayManager', 'class ChaosRecipeOverlayManager')
  const sandbox = {
    console: { log: (...parts) => logs.push(parts.filter(Boolean).join(' ')) },
    BrowserWindow: FakeWindow,
    screen: {},
    path,
    fileURLToPath: () => '',
    normalizeGridRegion,
    createLoadAwarePublisher,
    structuredClone,
    JSON,
    Math,
    Number,
    Array,
    Object,
    Boolean,
    String,
    process: { platform: 'linux', env: {} }
  }
  vm.runInNewContext(`${source}\nglobalThis.OverlayManager = ChaosRecipeOverlayManager`, sandbox)
  return { OverlayManager: sandbox.OverlayManager, logs }
}

function previewSnapshot() {
  return {
    region: REGION,
    tabId: 1,
    tabName: '仓库页',
    columns: 12,
    items: [{ id: 'a' }],
    status: 'preview',
    recipeId: 'chaos',
    recipeLabel: '混沌石',
    message: '1 套'
  }
}

function parseLogs(logs) {
  return logs.map((line) => {
    assert.match(line, /^\[商城配方高亮\] /)
    return JSON.parse(line.slice('[商城配方高亮] '.length))
  })
}

test('窗口被外部销毁后不残留幽灵预览状态，可重新创建高亮', () => {
  FakeWindow.created = []
  const { OverlayManager, logs } = loadOverlayManager()
  const manager = new OverlayManager()

  assert.equal(manager.create(previewSnapshot()), true)
  const first = FakeWindow.created[0]
  first.emit('ready-to-show')
  assert.equal(first.shown, 1)
  assert.equal(manager.getState()?.status, 'preview')

  first.emit('closed')
  assert.equal(manager.getState(), null)

  assert.equal(manager.create(previewSnapshot()), true)
  const second = FakeWindow.created[1]
  assert.notEqual(second, first)
  assert.equal(manager.getState()?.status, 'preview')

  manager.close()
  assert.equal(second.closeCalled, true)
  const events = parseLogs(logs).map((entry) => entry.event)
  assert.ok(events.includes('show'))
  assert.ok(events.includes('close'))
})

test('渲染进程崩溃后复用前销毁重建并恢复状态发布', () => {
  FakeWindow.created = []
  const { OverlayManager, logs } = loadOverlayManager()
  const manager = new OverlayManager()

  assert.equal(manager.create(previewSnapshot()), true)
  const first = FakeWindow.created[0]
  first.webContents.crashed = true

  assert.equal(manager.create(previewSnapshot()), true)
  const second = FakeWindow.created[1]
  assert.notEqual(second, first)
  assert.equal(first.destroyed, true)
  assert.equal(manager.getState()?.status, 'preview')
  assert.ok(second.webContents.sent.some(([channel, state]) =>
    channel === 'chaos-recipe-overlay-state' && state.status === 'preview'))

  first.emit('closed')
  assert.equal(manager.getState()?.status, 'preview')

  assert.ok(parseLogs(logs).some((entry) => entry.event === 'renderer-crashed'))
})

test('旧窗口的 closed 回调不会误伤重建后的新窗口', () => {
  FakeWindow.created = []
  const { OverlayManager } = loadOverlayManager()
  const manager = new OverlayManager()

  assert.equal(manager.create(previewSnapshot()), true)
  const first = FakeWindow.created[0]
  first.webContents.crashed = true
  assert.equal(manager.create(previewSnapshot()), true)
  const second = FakeWindow.created[1]

  first.emit('closed')
  first.emit('closed')
  assert.equal(manager.getState()?.status, 'preview')

  second.emit('closed')
  assert.equal(manager.getState(), null)
})

test('校准区域非法时 create 静默拒绝且不创建窗口', () => {
  FakeWindow.created = []
  const { OverlayManager, logs } = loadOverlayManager()
  const manager = new OverlayManager()

  assert.equal(manager.create({ ...previewSnapshot(), region: { left: 10, top: 10, right: 5, bottom: 5 } }), false)
  assert.equal(manager.create({ ...previewSnapshot(), region: null }), false)
  assert.equal(FakeWindow.created.length, 0)
  assert.equal(manager.getState(), null)
  const entries = parseLogs(logs)
  assert.equal(entries.length, 2)
  for (const entry of entries) {
    assert.equal(entry.event, 'create-skipped')
    assert.equal(entry.reason, 'invalid-region')
  }
})

test('诊断日志只包含事件字段，不包含物品详情或路径信息', () => {
  FakeWindow.created = []
  const { OverlayManager, logs } = loadOverlayManager()
  const manager = new OverlayManager()
  manager.create(previewSnapshot())
  manager.close()
  for (const entry of parseLogs(logs)) {
    const text = JSON.stringify(entry)
    assert.doesNotMatch(text, /账号|token|session|poessid/i)
    assert.ok(['show', 'close', 'create-skipped', 'renderer-crashed'].includes(entry.event))
  }
})

test('预览 IPC 在 create 失败时抛出可定位的校准错误', () => {
  const source = readFileSync(new URL('../electron/modules/ipc/chaosRecipe.js', import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n')
  const handler = source.slice(source.indexOf("ipcMain.handle('chaos-recipe-control-preview'"), source.indexOf("ipcMain.handle('chaos-recipe-control-action'"))
  assert.match(handler, /const created = service\.overlay\.create\(/)
  assert.match(handler, /if \(!created\)/)
  assert.match(handler, /INVALID_REQUEST/)
  assert.match(handler, /无法定位仓库区域/)
})

function loadAutomationManager() {
  const source = readFileSync(new URL('../electron/modules/chaosRecipe/automation.js', import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n')
  const executable = source
    .slice(source.indexOf('function parseEvents'))
    .replace('export class ChaosRecipeAutomationManager', 'class ChaosRecipeAutomationManager') +
    '\nglobalThis.AutomationManager = ChaosRecipeAutomationManager'
  const sandbox = {
    console,
    setTimeout,
    structuredClone,
    app: { isPackaged: false, getAppPath: () => '' },
    spawn() { throw new Error('测试中禁止真实启动取件进程') },
    fs: { existsSync: () => true, writeFileSync: () => {} },
    path,
    moduleDir: '',
    pythonAutomationTiming: () => ({}),
    CHAOS_ERROR_CODES: {
      AUTOMATION_RUNNING: 'AUTOMATION_RUNNING',
      INVENTORY_FULL: 'INVENTORY_FULL',
      GAME_NOT_FOREGROUND: 'GAME_NOT_FOREGROUND',
      ITEM_MISMATCH: 'ITEM_MISMATCH'
    },
    ChaosRecipeError: class extends Error {},
    resolveStashGridLayout: () => ({ region: { left: 0, top: 0, right: 120, bottom: 120 } }),
    process: { platform: 'linux', env: {} }
  }
  vm.runInNewContext(executable, sandbox)
  return sandbox.AutomationManager
}

test('取件启动阶段同步失败时关闭高亮浮窗并释放锁', async () => {
  const AutomationManager = loadAutomationManager()
  const closed = []
  const released = []
  const overlay = { create: () => true, close: () => closed.push('close') }
  const automationLock = {
    acquire: () => ({ success: true }),
    release: (owner) => released.push(owner)
  }
  const manager = new AutomationManager({
    python: { detectPythonPathWithModules: () => 'python' },
    fileWatcher: { getFilePaths: () => ({ tempDir: 'temp' }) },
    getMainWindow: () => null,
    overlay,
    automationLock,
    windowActivation: { activateGame: async () => ({ success: true }) }
  })
  const plan = {
    recipeId: 'chaos',
    recipeLabel: '混沌石',
    itemCount: 1,
    tabs: [{ tabId: 1, tabName: '仓库页', columns: 12, items: [{ id: 'a' }] }]
  }
  await assert.rejects(
    () => manager.start(plan, { calibration: { root: REGION } }),
    /禁止真实启动取件进程/
  )
  assert.equal(manager.status, 'stopped')
  assert.deepEqual(closed, ['close'])
  assert.deepEqual(released, ['混沌配方取件'])
})
