import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import {
  buildBagRuntimeConfig,
  findBagBlacklistMatch,
  normalizeBagBlacklist,
  normalizeBagSettings,
  parseBagItemHeader
} from '../src/utils/bagConfig.js'
import { OPERATION_DELAY, migrateOperationDelay, normalizeOperationDelay } from '../src/utils/operationDelay.js'
import {
  BagSessionController,
  createEventLineParser,
  describeDetectionExit,
  waitForDetectionStartup
} from '../electron/modules/bag/orchestrator.js'
import { detectPythonPathWithModules } from '../electron/modules/python/detector.js'

const scriptUrl = new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url)
const scriptPath = fileURLToPath(scriptUrl)

test('背包设置只输出当前格式字段并补齐默认黑名单', () => {
  const settings = normalizeBagSettings({
    moduleEnabled: true,
    buttonPosition: { x: 1, y: 2 },
    templates: { stashTitle: 'stash.png', inventoryTitle: 'inventory.png' }
  })
  assert.equal(settings.moduleEnabled, true)
  assert.equal('transferDelayMs' in settings, false)
  assert.deepEqual(settings.blacklist, [])
  assert.equal('buttonPosition' in settings, false)
  assert.equal(settings.templates.stashTitle, 'stash.png')
})

test('黑名单规范化仅保留名称、基底和类别的非空规则', () => {
  assert.deepEqual(normalizeBagBlacklist([
    { field: 'name', keyword: '  神圣石 ' },
    { field: 'baseName', keyword: '戒指' },
    { field: 'category', keyword: '通货' },
    { field: 'rarity', keyword: '传奇' },
    { field: 'name', keyword: ' ' }
  ]), [
    { field: 'name', keyword: '神圣石' },
    { field: 'baseName', keyword: '戒指' },
    { field: 'category', keyword: '通货' }
  ])
})

test('物品头解析支持中文和英文复制格式', () => {
  assert.deepEqual(parseBagItemHeader('物品类别: 饰品\n稀 有 度: 稀有\n风暴之眼\n紫晶戒指\n--------\n物品等级: 84'), {
    category: '饰品', name: '风暴之眼', baseName: '紫晶戒指'
  })
  assert.deepEqual(parseBagItemHeader('Item Class: Stackable Currency\nRarity: Currency\nChaos Orb\n--------'), {
    category: 'Stackable Currency', name: 'Chaos Orb', baseName: ''
  })
  assert.equal(parseBagItemHeader('普通剪贴板文本'), null)
})

test('黑名单按指定字段做不区分大小写的包含匹配', () => {
  const item = { name: 'Chaos Orb', baseName: '', category: 'Stackable Currency' }
  assert.deepEqual(findBagBlacklistMatch(item, [{ field: 'name', keyword: ' chaos ' }]), { field: 'name', keyword: 'chaos' })
  assert.equal(findBagBlacklistMatch(item, [{ field: 'baseName', keyword: 'orb' }]), null)
  assert.deepEqual(findBagBlacklistMatch(item, [{ field: 'category', keyword: 'CURRENCY' }]), { field: 'category', keyword: 'CURRENCY' })
})

test('运行配置包含模板区域、网格、黑名单和全局自动操作等待', () => {
  const config = buildBagRuntimeConfig({
    templates: {
      stashTitle: 's.png', inventoryTitle: 'i.png',
      stashRegion: { left: 1, top: 2, right: 3, bottom: 4 },
      inventoryRegion: { left: 5, top: 6, right: 7, bottom: 8 }
    },
    blacklist: [{ field: 'category', keyword: '通货' }]
  }, {
    inventory: { startPos: { x: 10, y: 20 }, slotSize: { w: 30, h: 40 } },
    operationDelayMs: 180
  })
  assert.equal(config.templates.inventoryRegion.left, 5)
  assert.deepEqual(config.inventory.slotSize, { w: 30, h: 40 })
  assert.equal(config.blacklist[0].keyword, '通货')
  assert.equal(config.operationDelayMs, 180)
  assert.equal('delays' in config, false)
})

test('自动操作等待补齐默认值、钳制并按优先级迁移旧配置', () => {
  assert.equal(normalizeOperationDelay(undefined), 80)
  assert.equal(normalizeOperationDelay('invalid'), 80)
  assert.equal(normalizeOperationDelay(null), 80)
  assert.equal(normalizeOperationDelay('  '), 80)
  assert.equal(normalizeOperationDelay(0), 20)
  assert.equal(normalizeOperationDelay(900), 500)
  assert.equal(normalizeOperationDelay(125), 125)
  assert.deepEqual(OPERATION_DELAY, { default: 80, min: 20, max: 500 })
  assert.equal(migrateOperationDelay({ operationDelayMs: 120 }, { transferDelayMs: 200 }), 120)
  assert.equal(migrateOperationDelay({}, { transferDelayMs: 200 }), 200)
  assert.equal(migrateOperationDelay({ delays: { mouseMove: 2000, action: 50, clipboardRead: 100 } }), 100)
  assert.equal(migrateOperationDelay({ delays: { mouseMove: 100, action: 50, clipboardRead: 100 } }), 80)
  assert.equal(migrateOperationDelay({}, {}), 80)
})

test('结构化事件解析器支持跨 chunk 行并忽略普通日志', () => {
  const events = []
  const logs = []
  const parse = createEventLineParser((event) => events.push(event), (line) => logs.push(line))
  parse('普通日志\nEVENT {"event":"stash-pro')
  parse('gress","progress":50}\n')
  assert.deepEqual(events, [{ event: 'stash-progress', progress: 50 }])
  assert.deepEqual(logs, ['普通日志'])
})

test('单会话只自动执行一次，not-ready 后重新解锁，手动补扫校验互斥', () => {
  const state = new BagSessionController()
  assert.equal(state.setReady(true), true)
  assert.equal(state.beginAutomatic().success, true)
  state.finishStash()
  assert.equal(state.setReady(true), false)
  assert.equal(state.beginManual().success, true)
  assert.equal(state.beginManual().success, false)
  state.finishStash()
  state.setReady(false)
  assert.equal(state.setReady(true), true)
})

test('失去前台不会解锁当前界面会话，返回前台也不会重复自动执行', () => {
  const state = new BagSessionController()
  assert.equal(state.setReady(true, true), true)
  assert.equal(state.beginAutomatic().success, true)
  state.finishStash()
  assert.equal(state.setReady(true, false), false)
  assert.equal(state.beginManual().success, false)
  assert.equal(state.setReady(true, true), false)
  state.setReady(false, false)
  assert.equal(state.setReady(true, true), true)
})

test('Python 检测状态需要连续三次命中或丢失才切换', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
state = (False, 0, 0)
changes = []
for matched in [True, True, True, False, False, False]:
    ready, hits, misses, changed = module.advance_detection_state(*state, matched)
    state = (ready, hits, misses)
    changes.append([ready, changed])
print(json.dumps(changes))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [
    [false, false], [false, false], [true, true],
    [true, false], [true, false], [false, true]
  ])
})

test('Python 检测模式使用 Electron 约定的错误事件名', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
print(json.dumps([module.error_event("detect"), module.error_event("stash")]))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), ['detection-error', 'stash-error'])
})

test('Python 可从中文路径加载仓库和背包标题模板', () => {
  const pythonPath = detectPythonPathWithModules(['cv2', 'numpy'])
  assert.ok(pythonPath, '应找到具备 cv2 和 numpy 的 Python')
  const code = `
import cv2, importlib.util, json, os, sys, tempfile
import numpy as np
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
with tempfile.TemporaryDirectory(prefix="背包模板-") as root:
    template_dir = os.path.join(root, "标题截图")
    os.makedirs(template_dir)
    paths = [os.path.join(template_dir, "仓库标题.png"), os.path.join(template_dir, "背包标题.png")]
    encoded = cv2.imencode(".png", np.full((8, 12), 127, dtype=np.uint8))[1].tobytes()
    for image_path in paths:
        with open(image_path, "wb") as image_file:
            image_file.write(encoded)
    matcher = module.InterfaceMatcher({"templates": {"stash_title": paths[0], "inventory_title": paths[1]}})
    print(json.dumps({"valid": matcher.valid, "shapes": [list(matcher.templates[name].shape) for name in ("stash", "inventory")]}))
`
  const result = spawnSync(pythonPath, ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), { valid: true, shapes: [[8, 12], [8, 12]] })
})

test('Python 独立规范化全局自动操作等待', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
print(json.dumps([module.normalize_operation_delay(None), module.normalize_operation_delay(0), module.normalize_operation_delay(900), module.normalize_operation_delay("bad")]))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [80, 20, 500, 80])
})

test('Python 全局自动操作等待同时覆盖移入稳定、剪贴板响应和点击后等待', () => {
  const code = `
import importlib.util, json, sys, types
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.mouse = types.SimpleNamespace(Controller=lambda: object())
module.keyboard = types.SimpleNamespace(Controller=lambda: object())
controller = module.InputController({"operation_delay_ms": 180})
print(json.dumps([controller.mouse_move_delay, controller.clipboard_delay, controller.action_delay]))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [0.18, 0.18, 0.18])
})

test('Python Ctrl+C 首次无响应时重试，连续无响应才判为空格', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
text = "Item Class: Currency\\nRarity: Currency\\nChaos Orb\\n--------"
def run(responses):
    controller = module.InputController.__new__(module.InputController)
    values = iter(responses)
    calls = {"count": 0}
    def attempt():
        calls["count"] += 1
        return next(values)
    controller._copy_item_text_once = attempt
    return [*controller.copy_item_text(), calls["count"]]
print(json.dumps([
    run([("no-response", ""), ("copied", text)]),
    run([("no-response", ""), ("no-response", "")]),
    run([("empty", "")])
]))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [
    ['copied', 'Item Class: Currency\nRarity: Currency\nChaos Orb\n--------', 2],
    ['empty', '', 2],
    ['empty', '', 1]
  ])
})

test('Python 只确认末尾连续三个空格，零散无响应改记为未识别', () => {
  const code = `
import importlib.util, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
statuses = iter(["empty", "empty", "copied", "empty", "empty", "empty", "empty"])
class Matcher:
    valid = True
    def __init__(self, config): pass
    def check_interface(self): return True, {}
class Controller:
    def __init__(self, config): pass
    def move(self, x, y): return True
    def copy_item_text(self):
        status = next(statuses)
        return (status, "Item Class: Currency\\nRarity: Currency\\nChaos Orb\\n--------" if status == "copied" else "")
    def ctrl_click(self): return True
    def release_all(self): pass
module.InterfaceMatcher = Matcher
module.InputController = Controller
module.is_game_foreground = lambda: True
raise SystemExit(module.run_stash({"inventory": {"startPos": {"x": 0, "y": 0}, "slotSize": {"w": 1, "h": 1}}}))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const events = result.stdout.trim().split(/\r?\n/).map((line) => JSON.parse(line.slice(6)))
  const completed = events.at(-1)
  assert.equal(completed.event, 'stash-completed')
  assert.equal(completed.reason, 'three-consecutive-empty')
  assert.equal(completed.scannedSlots, 6)
  assert.equal(completed.emptySlots, 3)
  assert.equal(completed.unreadableSlots, 2)
  assert.equal(completed.stashedSlots, 1)
  assert.equal('failedSlots' in completed, false)
  assert.equal(events.filter((event) => event.event === 'stash-progress').length, 6)
})

function fakeDetectionChild() {
  const child = new EventEmitter()
  child.stdout = new EventEmitter()
  return child
}

test('检测进程收到首个状态后才确认启动成功', async () => {
  const child = fakeDetectionChild()
  const startup = waitForDetectionStartup(child, { timeoutMs: 100 })
  child.stdout.emit('data', 'EVENT {"event":"detection-state","ready":false}\n')
  await startup
})

test('检测进程启动阶段保留结构化错误和真实退出信息', async () => {
  const structured = fakeDetectionChild()
  const structuredStartup = waitForDetectionStartup(structured, { timeoutMs: 100 })
  structured.stdout.emit('data', 'EVENT {"event":"detection-error","reason":"Python 依赖缺失: cv2"}\n')
  await assert.rejects(structuredStartup, /Python 依赖缺失: cv2/)

  const exited = fakeDetectionChild()
  const exitedStartup = waitForDetectionStartup(exited, {
    timeoutMs: 100,
    getFailureReason: (code) => describeDetectionExit({ code, stderr: 'import failed' })
  })
  exited.emit('close', 2)
  await assert.rejects(exitedStartup, /import failed/)
  assert.equal(describeDetectionExit({ code: 3 }), '检测进程异常退出（退出码 3）')
  assert.equal(describeDetectionExit({ code: 0 }), 'process-ended')
})

test('Python 探测器选择满足指定模块的解释器并缓存结果', () => {
  const pythonPath = detectPythonPathWithModules(['sys', 'json'])
  assert.ok(pythonPath, '应找到具备标准库的 Python')
  assert.equal(detectPythonPathWithModules(['sys', 'json']), pythonPath)
  const result = spawnSync(pythonPath, ['-c', 'import sys, json'], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
})

test('检测成功后清除历史停止原因', () => {
  const source = readFileSync(new URL('../src/utils/bagService.js', import.meta.url), 'utf8')
  assert.match(source, /setDetectionStatus\(true\)[\s\S]*setStopReason\(''\)/)
})

test('Python 入库对空格、无效文本和安全门禁采用失败关闭策略', () => {
  const source = readFileSync(scriptUrl, 'utf8')
  assert.match(source, /clipboard_sequence_number\(\)/)
  assert.match(source, /copy_status == "empty"[\s\S]*emptySlots/)
  assert.match(source, /item is None:[\s\S]*unreadableSlots/)
  assert.match(source, /elif controller\.ctrl_click\(\):[\s\S]*stashedSlots/)
  assert.doesNotMatch(source, /transfer_item|same_item|failedSlots/)
  assert.match(source, /if not is_game_foreground\(\):[\s\S]*game-not-foreground/)
  assert.match(source, /if not interface_ready:[\s\S]*interface-lost/)
  assert.match(source, /finally:[\s\S]*controller\.release_all\(\)/)
  assert.ok(source.indexOf('if not is_game_foreground():') < source.indexOf('elif controller.ctrl_click():'))
  assert.ok(source.indexOf('if not interface_ready:') < source.indexOf('elif controller.ctrl_click():'))
})

test('Python 每个安全物品只 Ctrl+点击一次且点击后不再复制确认', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
text = "Item Class: Currency\\nRarity: Currency\\nChaos Orb\\n--------"
statuses = iter([("copied", text), ("empty", ""), ("empty", ""), ("empty", "")])
class Matcher:
    valid = True
    def __init__(self, config): pass
    def check_interface(self): return True, {}
class Controller:
    clicks = 0
    def __init__(self, config): pass
    def move(self, x, y): return True
    def copy_item_text(self): return next(statuses)
    def ctrl_click(self): Controller.clicks += 1; return True
    def release_all(self): pass
module.InterfaceMatcher = Matcher
module.InputController = Controller
module.is_game_foreground = lambda: True
code = module.run_stash({"inventory": {"startPos": {"x": 0, "y": 0}, "slotSize": {"w": 1, "h": 1}}})
print(json.dumps({"code": code, "clicks": Controller.clicks}))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const lines = result.stdout.trim().split(/\r?\n/)
  const summary = JSON.parse(lines.pop())
  const completed = JSON.parse(lines.at(-1).slice(6))
  assert.deepEqual(summary, { code: 0, clicks: 1 })
  assert.equal('failedSlots' in completed, false)
  assert.equal(completed.stashedSlots, 1)
})

test('全局操作等待同步接口只更新下一轮运行配置，不重启检测器或重置会话', () => {
  const ipcSource = readFileSync(new URL('../electron/modules/ipc/bag.js', import.meta.url), 'utf8')
  const preloadSource = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
  const apiSource = readFileSync(new URL('../src/api/electron.js', import.meta.url), 'utf8')
  const handler = ipcSource.match(/ipcMain\.handle\('update-bag-operation-delay'[\s\S]*?\n  \}\)/)?.[0] || ''
  assert.match(handler, /normalizeOperationDelay\(value\)/)
  assert.match(handler, /latestConfig\.operation_delay_ms = operationDelayMs/)
  assert.doesNotMatch(handler, /startDetectionProcess|reloadDetection|session\.reset/)
  assert.match(preloadSource, /updateBagOperationDelay/)
  assert.match(apiSource, /updateOperationDelay/)
})

test('正式包携带背包脚本并从稳定路径解析', () => {
  const packageConfig = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.ok(packageConfig.build.extraResources.some((entry) => entry.to === 'bag_auto_stash_template.py'))
  const ipcSource = readFileSync(new URL('../electron/modules/ipc/bag.js', import.meta.url), 'utf8')
  assert.match(ipcSource, /process\.resourcesPath/)
  assert.match(ipcSource, /path\.resolve\(moduleDir, '\.\.\/\.\.\/\.\.\/src\/assets\/scripts\/bag_auto_stash_template\.py'\)/)
  assert.match(ipcSource, /candidates\.find\(\(candidate\) => fs\.existsSync\(candidate\)\)/)
})

test('穿透浮窗只使用独立原生抓手拖动', () => {
  const source = readFileSync(new URL('../src/domains/overlay/components/OverlayContent.vue', import.meta.url), 'utf8')
  assert.match(source, /class="overlay-drag-handle"/)
  assert.match(source, /@mouseenter="activateDragHandle" @mouseleave="deactivateDragHandle"/)
  assert.match(source, /-webkit-app-region: drag/)
  assert.doesNotMatch(source, /getWindowPosition|setWindowPosition|handleMouseDown/)
  assert.doesNotMatch(source, /class="overlay-content"[^>]*@mouseenter/)
})

test('模板替换允许运行态更新并重载检测器', () => {
  const ipcSource = readFileSync(new URL('../electron/modules/ipc/bag.js', import.meta.url), 'utf8')
  const viewSource = readFileSync(new URL('../src/domains/bag/BagView.vue', import.meta.url), 'utf8')
  assert.match(ipcSource, /reloadDetectionForTemplateChange/)
  assert.match(ipcSource, /updateRuntimeTemplate\(type, targetPath/)
  assert.match(ipcSource, /detectionProcess = null[\s\S]*stopChild\(previous\)[\s\S]*startDetectionProcess/)
  assert.match(ipcSource, /if \(detectionProcess !== child\) return/)
  assert.match(ipcSource, /reloadError/)
  assert.doesNotMatch(viewSource, /bagStore\.moduleEnabled\) return ElMessage\.warning\('请先关闭背包模块再框选'/)
  assert.match(viewSource, /bagStore\.isStashing/)
})
