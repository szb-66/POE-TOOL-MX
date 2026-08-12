import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { pythonPath } from './helpers/python.js'
import vm from 'node:vm'

const scriptUrl = new URL('../src/assets/scripts/chaos_recipe_pick_template.py', import.meta.url)
const scriptPath = fileURLToPath(scriptUrl)

test('取件脚本只用复制结果确认原位是否还有物品，不做屏幕或身份校验', () => {
  const source = readFileSync(scriptUrl, 'utf8')
  const loop = source.slice(source.indexOf('for index, expected'))
  const transfer = source.slice(source.indexOf('def transfer_item'), source.indexOf('def run'))
  assert.doesNotMatch(source, /cv2|mss|numpy|InterfaceMatcher|source_changed|capture_source|safety_error|parse_item|matches\(/)
  assert.ok(loop.indexOf('CONTROLLER.move') < loop.indexOf('transfer_item('))
  assert.ok(loop.indexOf('transfer_item(') < loop.indexOf('emit("item-picked"'))
  assert.ok(transfer.indexOf('copy_item()') < transfer.indexOf('ctrl_click()'))
  assert.ok(transfer.indexOf('ctrl_click()') < transfer.lastIndexOf('copy_item()'))
})

function loadAutomationManager() {
  const source = readFileSync(new URL('../electron/modules/chaosRecipe/automation.js', import.meta.url), 'utf8')
  const executable = source
    .slice(source.indexOf('function parseEvents'))
    .replace('export class ChaosRecipeAutomationManager', 'class ChaosRecipeAutomationManager') +
    '\nglobalThis.AutomationManager = ChaosRecipeAutomationManager'
  const sandbox = {
    console,
    setTimeout,
    structuredClone,
    app: { isPackaged: false },
    spawn() { throw new Error('测试不应启动子进程') },
    fs: {},
    path: {},
    moduleDir: '',
    CHAOS_ERROR_CODES: {
      AUTOMATION_RUNNING: 'AUTOMATION_RUNNING',
      INVENTORY_FULL: 'INVENTORY_FULL',
      GAME_NOT_FOREGROUND: 'GAME_NOT_FOREGROUND',
      ITEM_MISMATCH: 'ITEM_MISMATCH'
    },
    ChaosRecipeError: class extends Error {},
    resolveStashGridLayout: () => ({ region: { left: 0, top: 0, right: 120, bottom: 120 } })
  }
  vm.runInNewContext(executable, sandbox)
  return sandbox.AutomationManager
}

test('取件脚本比较点击前后复制文本，原位文本相同时重试一次并报告满包', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("recipe", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class Controller:
    delay = 0.08
    def __init__(self, copies): self.clicks = 0; self.copies = iter(copies)
    def copy_item(self): return next(self.copies)
    def ctrl_click(self): self.clicks += 1

def execute(copies):
    controller = Controller(copies)
    result = module.transfer_item(controller)
    return [result[0], result[1], controller.clicks]

first = execute(["before", ""])
changed = execute(["before", "other"])
retry = execute(["before", "before", ""])
full = execute(["before", "before", "before"])
missing = execute([""])

events = []
class FakeController:
    delay = 0.08
    moves = 0
    def move(self, *_args): self.moves += 1; return True
    def release_all(self): pass
controller = FakeController()
module.InputController = lambda _delay: controller
module.focus_game_window = lambda: True
module.transfer_item = lambda *_args: (False, ("INVENTORY_FULL", "背包空间不足，请清空背包后继续"))
module.emit = lambda event, **payload: events.append({"event": event, **payload})
exit_code = module.run({"items": [
  {"id": "first", "screen": {"x": 1, "y": 1, "width": 10, "height": 10, "clickX": 6, "clickY": 6}},
  {"id": "second", "screen": {"x": 20, "y": 1, "width": 10, "height": 10, "clickX": 25, "clickY": 6}}
]})

print(json.dumps({
  "first": first,
  "changed": changed,
  "retry": retry,
  "full": full,
  "missing": missing,
  "exit": exit_code,
  "moves": controller.moves,
  "events": events
}, ensure_ascii=False))
`
  const result = spawnSync(pythonPath, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const values = JSON.parse(result.stdout)
  assert.deepEqual(values.first, [true, null, 1])
  assert.deepEqual(values.changed, [true, null, 1])
  assert.deepEqual(values.retry, [true, null, 2])
  assert.deepEqual(values.full, [false, ['INVENTORY_FULL', '背包空间不足，请清空背包后继续'], 2])
  assert.deepEqual(values.missing, [false, ['ITEM_MISMATCH', '目标位置没有可复制的物品'], 0])
  assert.equal(values.exit, 2)
  assert.equal(values.moves, 1)
  assert.deepEqual(values.events, [{
    event: 'aborted',
    code: 'INVENTORY_FULL',
    reason: '背包空间不足，请清空背包后继续',
    index: 0
  }])
})

test('聚焦游戏只恢复最小化窗口，不移动普通窗口', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("recipe", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class FakeUser32:
    def __init__(self, iconic):
        self.iconic = iconic
        self.calls = []
    def IsIconic(self, hwnd):
        return self.iconic
    def ShowWindow(self, hwnd, command):
        self.calls.append([hwnd, command])
normal = FakeUser32(False)
minimized = FakeUser32(True)
module.restore_game_window_if_minimized(normal, 101)
module.restore_game_window_if_minimized(minimized, 202)
print(json.dumps([normal.calls, minimized.calls]))
`
  const result = spawnSync(pythonPath, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [[], [[202, 9]]])
})

test('取件失败会关闭不可交互浮窗而不是留下卡死提示', () => {
  const source = readFileSync(
    new URL('../electron/modules/chaosRecipe/automation.js', import.meta.url),
    'utf8'
  )
  const failMethod = source.slice(source.indexOf('fail(reason'), source.indexOf('getStatus()'))
  assert.match(failMethod, /this\.overlay\.close\(\)/)
  assert.doesNotMatch(failMethod, /this\.overlay\.update/)
})

test('配方取件每次移动、复制和点击前检查前台，失焦时释放输入', () => {
  const source = readFileSync(scriptUrl, 'utf8')
  assert.match(source, /def move\(self, x, y\):\s*require_game_foreground\(\)/)
  assert.match(source, /def copy_item\(self\):\s*require_game_foreground\(\)/)
  assert.match(source, /pyperclip\.copy\(""\)[\s\S]*?require_game_foreground\(\)[\s\S]*?self\.keyboard\.press\(Key\.ctrl\)/)
  assert.match(source, /def ctrl_click\(self\):\s*require_game_foreground\(\)/)
  assert.match(source, /def copy_item\(self\):[\s\S]*?self\.keyboard\.press\(Key\.ctrl\)\s*time\.sleep\(MODIFIER_SETTLE_SECONDS\)[\s\S]*?self\.keyboard\.press\("c"\)\s*time\.sleep\(KEY_HOLD_SECONDS\)\s*self\.keyboard\.release\("c"\)\s*time\.sleep\(RELEASE_SETTLE_SECONDS\)\s*self\.keyboard\.release\(Key\.ctrl\)/)
  assert.match(source, /self\.clipboard_timeout = adaptive_timeout if self\.timing_mode == "adaptive" else CLIPBOARD_RESPONSE_MIN_SECONDS/)
  assert.match(source, /deadline = time\.monotonic\(\) \+ self\.clipboard_timeout/)
  assert.match(source, /InputController\(config\)/)
  assert.match(source, /timing_mode|adaptive_timeout_ms/)
  assert.match(source, /def ctrl_click\(self\):[\s\S]*?self\.keyboard\.press\(Key\.ctrl\)\s*time\.sleep\(MODIFIER_SETTLE_SECONDS\)[\s\S]*?self\.mouse\.press\(Button\.left\)\s*time\.sleep\(BUTTON_HOLD_SECONDS\)\s*self\.mouse\.release\(Button\.left\)\s*time\.sleep\(RELEASE_SETTLE_SECONDS\)\s*self\.keyboard\.release\(Key\.ctrl\)/)
  assert.match(source, /except GameNotForegroundError as error:[\s\S]*?code="GAME_NOT_FOREGROUND"/)
})

test('满包暂停保留游标、计划、锁和高亮，并从当前物品恢复', () => {
  const AutomationManager = loadAutomationManager()
  let releases = 0
  const overlays = []
  const manager = new AutomationManager({
    getMainWindow: () => null,
    overlay: {
      create: value => overlays.push(value),
      close() {}
    },
    automationLock: { release: () => { releases += 1 } }
  })
  manager.plan = {
    itemCount: 2,
    tabs: [{ tabId: 'tab-1', tabName: '配方页', columns: 12, items: [{ id: 'a' }, { id: 'b' }] }]
  }
  manager.config = { calibration: {} }
  manager.status = 'running'
  const firstChild = { killed: false, exitCode: null, kill() { this.killed = true; this.exitCode = 0 } }
  manager.child = firstChild
  manager.handleEvent(firstChild, { event: 'item-picked', itemId: 'a' })

  const secondChild = { killed: false, exitCode: null, kill() { this.killed = true; this.exitCode = 0 } }
  manager.child = secondChild
  manager.handleEvent(secondChild, {
    event: 'aborted',
    code: 'INVENTORY_FULL',
    reason: '背包空间不足，请清空背包后继续'
  })

  assert.equal(manager.status, 'paused')
  assert.equal(manager.itemOffset, 1)
  assert.equal(manager.completedItems, 1)
  assert.equal(manager.plan.tabs[0].items[1].id, 'b')
  assert.equal(manager.code, 'INVENTORY_FULL')
  assert.equal(releases, 0)
  assert.equal(secondChild.killed, true)
  assert.deepEqual(overlays.at(-1).items.map(item => item.id), ['b'])

  let resumedIds = []
  manager.spawnCurrentTab = function () {
    resumedIds = this.currentTab().items.slice(this.itemOffset).map(item => item.id)
    return { success: true, status: this.status }
  }
  manager.resume()
  assert.deepEqual(resumedIds, ['b'])
  assert.equal(manager.code, '')
})

test('游戏失焦暂停保留当前物品游标并允许继续', () => {
  const AutomationManager = loadAutomationManager()
  const overlays = []
  const manager = new AutomationManager({
    getMainWindow: () => null,
    overlay: { create: value => overlays.push(value), close() {} },
    automationLock: { release() {} }
  })
  manager.plan = {
    itemCount: 2,
    tabs: [{ tabId: 'tab-1', tabName: '配方页', columns: 12, items: [{ id: 'a' }, { id: 'b' }] }]
  }
  manager.config = { calibration: {} }
  manager.status = 'running'
  manager.itemOffset = 1
  manager.completedItems = 1
  const child = { killed: false, exitCode: null, kill() { this.killed = true; this.exitCode = 0 } }
  manager.child = child
  manager.handleEvent(child, {
    event: 'aborted', code: 'GAME_NOT_FOREGROUND', reason: '游戏窗口运行中失去前台'
  })

  assert.equal(manager.status, 'paused')
  assert.equal(manager.code, 'GAME_NOT_FOREGROUND')
  assert.equal(manager.itemOffset, 1)
  assert.equal(manager.completedItems, 1)
  assert.deepEqual(overlays.at(-1).items.map(item => item.id), ['b'])

  let resumedIds = []
  manager.spawnCurrentTab = function () {
    resumedIds = this.currentTab().items.slice(this.itemOffset).map(item => item.id)
    return { success: true, status: this.status }
  }
  manager.resume()
  assert.deepEqual(resumedIds, ['b'])
})

test('手动停止、普通错误和重置会清除断点并忽略迟到事件', () => {
  const AutomationManager = loadAutomationManager()
  let releases = 0
  const manager = new AutomationManager({
    getMainWindow: () => null,
    overlay: { create() {}, close() {} },
    automationLock: { release: () => { releases += 1 } }
  })
  const setCheckpoint = () => {
    manager.plan = { itemCount: 1, tabs: [{ tabName: '页', columns: 12, items: [{ id: 'x' }] }] }
    manager.config = { calibration: {} }
    manager.status = 'running'
    manager.itemOffset = 0
    manager.completedItems = 0
    manager.child = { killed: false, exitCode: null, kill() { this.killed = true; this.exitCode = 0 } }
    return manager.child
  }

  setCheckpoint()
  manager.stop('user')
  assert.equal(manager.plan, null)
  assert.equal(manager.config, null)
  assert.equal(manager.getStatus().totalItems, 0)

  const failedChild = setCheckpoint()
  manager.handleEvent(failedChild, { event: 'aborted', code: 'ITEM_MISMATCH', reason: '物品不一致' })
  assert.equal(manager.status, 'stopped')
  assert.equal(manager.plan, null)
  assert.equal(manager.code, 'ITEM_MISMATCH')

  const staleChild = setCheckpoint()
  manager.reset('refresh')
  manager.handleEvent(staleChild, { event: 'item-picked', itemId: 'x' })
  assert.equal(manager.completedItems, 0)
  assert.equal(manager.plan, null)
  assert.ok(releases >= 3)
})

test('商城页面和控制浮窗为满包暂停提供明确续取提示', () => {
  const panel = readFileSync(new URL('../src/domains/shop/ChaosRecipePanel.vue', import.meta.url), 'utf8')
  const control = readFileSync(new URL('../electron/modules/chaosRecipe/controlOverlay.js', import.meta.url), 'utf8')
  assert.match(panel, /automation\.code === 'INVENTORY_FULL'[\s\S]*清空背包后继续/)
  assert.match(control, /inventoryFull[\s\S]*背包空间不足，请清空背包后继续/)
})

test('打包配置包含取件脚本、GPL 许可证和第三方归属', () => {
  const packageConfig = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(packageConfig.license, 'GPL-3.0-or-later')
  assert.ok(packageConfig.build.extraResources.some((entry) => entry.to === 'chaos_recipe_pick_template.py'))
  assert.ok(packageConfig.build.files.includes('LICENSE.md'))
  assert.ok(packageConfig.build.files.includes('THIRD_PARTY_NOTICES.md'))
})
