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
  normalizeInventoryLayout,
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
import { pythonPath as runtimePython } from './helpers/python.js'

const scriptUrl = new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url)
const scriptPath = fileURLToPath(scriptUrl)

test('背包设置只输出当前格式字段并补齐默认黑名单', () => {
  const settings = normalizeBagSettings({
    moduleEnabled: true,
    buttonPosition: { x: 1, y: 2 },
    templates: { stashTitle: 'stash.png', inventoryTitle: 'inventory.png' }
  })
  assert.equal(settings.moduleEnabled, true)
  assert.equal(settings.immediateStash, true)
  assert.equal(settings.showStashButtonOnlyWhenReady, true)
  assert.equal('transferDelayMs' in settings, false)
  assert.deepEqual(settings.blacklist, [])
  assert.equal('buttonPosition' in settings, false)
  assert.equal(settings.templates.stashTitle, 'stash.png')
  assert.deepEqual(settings.inventoryLayout, {
    extraEnabled: false,
    extraColumns: 1,
    excludedSlots: []
  })
})

test('背包布局限制额外列数并去重合法格子，同时保留隐藏额外列选择', () => {
  assert.deepEqual(normalizeInventoryLayout({
    extraEnabled: false,
    extraColumns: 99,
    excludedSlots: [
      { column: 0, row: 0 },
      { column: 0, row: 0 },
      { column: -6, row: 4 },
      { column: -7, row: 0 },
      { column: 12, row: 0 },
      { column: 1.5, row: 2 },
      { column: 1, row: 5 }
    ]
  }), {
    extraEnabled: false,
    extraColumns: 6,
    excludedSlots: [{ column: 0, row: 0 }, { column: -6, row: 4 }]
  })
  assert.equal(normalizeInventoryLayout({ extraColumns: 0 }).extraColumns, 1)
  assert.equal(normalizeInventoryLayout({ extraColumns: 'invalid' }).extraColumns, 1)
})

test('黑名单规范化仅保留名称、基底和类别的非空规则', () => {
  assert.deepEqual(normalizeBagBlacklist([
    { field: 'name', keyword: '  神圣石 ' },
    { field: 'baseName', keyword: '戒指' },
    { field: 'category', keyword: '通货', enabled: false },
    { field: 'rarity', keyword: '传奇' },
    { field: 'name', keyword: ' ' }
  ]), [
    { field: 'name', keyword: '神圣石', matchMode: 'contains', enabled: true },
    { field: 'baseName', keyword: '戒指', matchMode: 'contains', enabled: true },
    { field: 'category', keyword: '通货', matchMode: 'contains', enabled: false }
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

test('黑名单按指定字段和模式做不区分大小写的匹配', () => {
  const item = { name: 'Chaos Orb', baseName: '', category: 'Stackable Currency' }
  assert.deepEqual(findBagBlacklistMatch(item, [{ field: 'name', keyword: ' chaos ' }]), {
    field: 'name', keyword: 'chaos', matchMode: 'contains', enabled: true
  })
  assert.equal(findBagBlacklistMatch(item, [{ field: 'baseName', keyword: 'orb' }]), null)
  assert.deepEqual(findBagBlacklistMatch(item, [{ field: 'category', keyword: 'CURRENCY' }]), {
    field: 'category', keyword: 'CURRENCY', matchMode: 'contains', enabled: true
  })
  const toggledRule = { field: 'name', keyword: 'chaos', matchMode: 'contains', enabled: false }
  assert.equal(findBagBlacklistMatch(item, [toggledRule]), null)
  assert.deepEqual(findBagBlacklistMatch(item, [{ ...toggledRule, enabled: true }]), {
    field: 'name', keyword: 'chaos', matchMode: 'contains', enabled: true
  })

  const mapFragment = { name: '凡人的愤怒', baseName: '瓦尔碎片', category: '地图碎片' }
  assert.equal(findBagBlacklistMatch(mapFragment, [
    { field: 'category', keyword: '地图', matchMode: 'exact' }
  ]), null)
  assert.deepEqual(findBagBlacklistMatch({ ...mapFragment, category: ' 地图 ' }, [
    { field: 'category', keyword: '地图', matchMode: 'exact' }
  ]), { field: 'category', keyword: '地图', matchMode: 'exact', enabled: true })
  assert.ok(findBagBlacklistMatch(mapFragment, [
    { field: 'category', keyword: '地图', matchMode: 'contains' }
  ]))
  assert.equal(normalizeBagBlacklist([
    { field: 'category', keyword: '地图', matchMode: 'unknown' }
  ])[0].matchMode, 'contains')
})

test('运行配置包含模板区域、网格、黑名单和全局自动操作等待', () => {
  const config = buildBagRuntimeConfig({
    immediateStash: false,
    showStashButtonOnlyWhenReady: false,
    templates: {
      stashTitle: 's.png', inventoryTitle: 'i.png',
      stashRegion: { left: 1, top: 2, right: 3, bottom: 4 },
      inventoryRegion: { left: 5, top: 6, right: 7, bottom: 8 }
    },
    blacklist: [{ field: 'category', keyword: '通货', enabled: false }],
    inventoryLayout: {
      extraEnabled: true,
      extraColumns: 2,
      excludedSlots: [{ column: -2, row: 3 }]
    }
  }, {
    inventory: { startPos: { x: 10, y: 20 }, slotSize: { w: 30, h: 40 } },
    operationDelayMs: 180
  })
  assert.equal(config.templates.inventoryRegion.left, 5)
  assert.deepEqual(config.inventory.slotSize, { w: 30, h: 40 })
  assert.deepEqual(config.inventory.layout, {
    extraEnabled: true,
    extraColumns: 2,
    excludedSlots: [{ column: -2, row: 3 }]
  })
  assert.equal(config.blacklist[0].keyword, '通货')
  assert.equal(config.blacklist[0].matchMode, 'contains')
  assert.equal(config.blacklist[0].enabled, false)
  assert.equal(config.operationDelayMs, 180)
  assert.equal(config.immediateStash, false)
  assert.equal(config.showStashButtonOnlyWhenReady, false)
  assert.equal('delays' in config, false)
})

test('背包页面提供额外背包与逐格禁用布局，并在模块启用后热更新', () => {
  const source = readFileSync(new URL('../src/domains/bag/BagView.vue', import.meta.url), 'utf8')
  assert.match(source, /背包格子布局/)
  assert.match(source, /inventory-region--extra/)
  assert.match(source, /v-for="column in extraColumns"/)
  assert.match(source, /v-for="column in nativeColumns"/)
  assert.match(source, /toggleExcludedSlot\(column, row\)/)
  assert.match(source, /清空选择/)
  assert.doesNotMatch(source, /:disabled="bagStore\.moduleEnabled"/)
  assert.match(source, /updateBagRuntimeConfig/)
  assert.match(source, /运行中修改从下一轮入库生效/)
  assert.match(source, /extraColumns[\s\S]*index - count/)
  assert.match(source, /BAG_BLACKLIST_MATCH_MODES/)
  assert.match(source, /BAG_BLACKLIST_MATCH_MODE_LABELS/)
  assert.match(source, /<el-table-column label="生效"/)
  assert.match(source, /:model-value="scope\.row\.enabled"/)
  assert.match(source, /@change="toggleBlacklistRule\(scope\.\$index, \$event\)"/)
  assert.match(source, /function toggleBlacklistRule\(index, enabled\)/)
  assert.match(source, /ruleIndex === index \? \{ \.\.\.rule, enabled: Boolean\(enabled\) \} : rule/)
  assert.match(source, /matchMode: draftRule\.value\.matchMode,[\s\S]*enabled: true/)
})

test('Python 黑名单支持精确匹配、旧规则迁移和单项启停', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
item = {"name": "凡人的愤怒", "baseName": "瓦尔碎片", "category": "地图碎片"}
exact = module.find_blacklist_match(item, [{"field": "category", "keyword": "地图", "matchMode": "exact"}])
contains = module.find_blacklist_match(item, [{"field": "category", "keyword": "地图", "matchMode": "contains"}])
legacy = module.normalize_blacklist([{"field": "category", "keyword": "地图"}])
invalid = module.normalize_blacklist([{"field": "category", "keyword": "地图", "matchMode": "unknown"}])
disabled_rules = module.normalize_blacklist([{"field": "category", "keyword": "地图", "enabled": False}])
disabled = module.find_blacklist_match(item, [{"field": "category", "keyword": "地图", "matchMode": "contains", "enabled": False}])
reenabled = module.find_blacklist_match(item, [{"field": "category", "keyword": "地图", "matchMode": "contains", "enabled": True}])
print(json.dumps({"exact": exact, "contains": contains, "legacy": legacy, "invalid": invalid, "disabled_rules": disabled_rules, "disabled": disabled, "reenabled": reenabled}, ensure_ascii=False))
`
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), {
    exact: null,
    contains: { field: 'category', keyword: '地图', matchMode: 'contains', enabled: true },
    legacy: [{ field: 'category', keyword: '地图', matchMode: 'contains', enabled: true }],
    invalid: [{ field: 'category', keyword: '地图', matchMode: 'contains', enabled: true }],
    disabled_rules: [{ field: 'category', keyword: '地图', matchMode: 'contains', enabled: false }],
    disabled: null,
    reenabled: { field: 'category', keyword: '地图', matchMode: 'contains', enabled: true }
  })
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

test('关闭立即执行时就绪不会锁定会话，仍可手动入库', () => {
  const state = new BagSessionController()
  assert.equal(state.setReady(true, true, false), false)
  assert.equal(state.locked, false)
  assert.equal(state.beginManual().success, true)
  state.finishStash()
  assert.equal(state.setReady(false, false, false), false)
  assert.equal(state.setReady(true, true, true), true)
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
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [
    [false, false], [false, false], [true, true],
    [true, false], [true, false], [false, true]
  ])
})

test('Python 持续检测在游戏后台跳过截图匹配并在回到前台后重新稳定识别', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
events = []
focus = iter([False, False, True, True, True])
class Matcher:
    valid = True
    checks = 0
    def __init__(self, config): pass
    def check_interface(self):
        Matcher.checks += 1
        return True, {"stashScore": 1, "inventoryScore": 1}
module.InterfaceMatcher = Matcher
module.is_game_foreground = lambda: next(focus)
module.get_game_client_bounds = lambda: {"left": 1}
module.emit = lambda event, **payload: events.append({"event": event, **payload})
def sleep(_delay):
    if Matcher.checks >= 3:
        module.is_running = False
module.time.sleep = sleep
result = module.run_detection({})
print(json.dumps({"result": result, "checks": Matcher.checks, "events": events}))
`
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const values = JSON.parse(result.stdout)
  assert.equal(values.result, 0)
  assert.equal(values.checks, 3)
  assert.equal(values.events[0].foreground, false)
  assert.equal(values.events.at(-1).ready, true)
  assert.equal(values.events.at(-1).foreground, true)
})

test('Python 入库从助手启动时先聚焦游戏，运行中失焦会停止且释放输入', () => {
  const source = readFileSync(new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url), 'utf8')
  assert.match(source, /def run_stash\(config\):[\s\S]*?if not focus_game_window\(\):[\s\S]*?game-not-foreground/)
  assert.match(source, /def move\(self, x, y\):[\s\S]*?if not is_game_foreground\(\):[\s\S]*?stop_for_foreground_loss\(self\)/)
  assert.match(source, /def _send_copy\(self\):[\s\S]*?if not is_game_foreground\(\):[\s\S]*?self\.keyboard\.press\(Key\.ctrl\)[\s\S]*?if not is_game_foreground\(\):/)
  assert.match(source, /def ctrl_click\(self\):[\s\S]*?if not is_game_foreground\(\):[\s\S]*?self\.keyboard\.press\(Key\.ctrl\)[\s\S]*?if not is_game_foreground\(\):/)
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
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
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
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
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
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
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
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [
    ['copied', 'Item Class: Currency\nRarity: Currency\nChaos Orb\n--------', 2],
    ['empty', '', 2],
    ['empty', '', 1]
  ])
})

test('Python 只确认达到配置阈值的末尾连续空格，零散无响应改记为未识别', () => {
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
raise SystemExit(module.run_stash({"inventory": {
    "startPos": {"x": 0, "y": 0}, "slotSize": {"w": 1, "h": 1}, "emptySlotThreshold": 4
}}))
`
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const events = result.stdout.trim().split(/\r?\n/).map((line) => JSON.parse(line.slice(6)))
  const completed = events.at(-1)
  assert.equal(completed.event, 'stash-completed')
  assert.equal(completed.reason, 'consecutive-empty-threshold')
  assert.equal(completed.scannedSlots, 7)
  assert.equal(completed.emptySlots, 4)
  assert.equal(completed.unreadableSlots, 2)
  assert.equal(completed.stashedSlots, 1)
  assert.equal('failedSlots' in completed, false)
  assert.equal(events.filter((event) => event.event === 'stash-progress').length, 7)
})

test('Python 扫描计划先原生后额外，并从最左额外列向原生方向排列', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
phases = module.build_scan_phases({"layout": {
    "extraEnabled": True,
    "extraColumns": 6,
    "excludedSlots": [{"column": 0, "row": 0}, {"column": -6, "row": 4}]
}})
print(json.dumps({
    "sizes": [len(phase) for phase in phases],
    "native": [[phases[0][0]["column"], phases[0][0]["row"]], [phases[0][-1]["column"], phases[0][-1]["row"]]],
    "extra": [[phases[1][0]["column"], phases[1][0]["row"]], [phases[1][-1]["column"], phases[1][-1]["row"]]],
    "excluded": [phases[0][0]["excluded"], phases[1][4]["excluded"]]
}))
`
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), {
    sizes: [60, 30],
    native: [[0, 0], [11, 4]],
    extra: [[-6, 0], [-1, 4]],
    excluded: [true, true]
  })
})

test('Python 原生完整扫描后按负列坐标扫描额外背包', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
text = "Item Class: Currency\\nRarity: Currency\\nChaos Orb\\n--------"
class Matcher:
    valid = True
    def __init__(self, config): pass
    def check_interface(self): return True, {}
class Controller:
    moves = []
    def __init__(self, config): pass
    def move(self, x, y): Controller.moves.append([x, y]); return True
    def copy_item_text(self): return "copied", text
    def ctrl_click(self): return True
    def release_all(self): pass
module.InterfaceMatcher = Matcher
module.InputController = Controller
module.is_game_foreground = lambda: True
module.run_stash({"inventory": {
    "startPos": {"x": 100, "y": 200},
    "slotSize": {"w": 10, "h": 20},
    "layout": {"extraEnabled": True, "extraColumns": 2, "excludedSlots": []}
}})
print(json.dumps({
    "count": len(Controller.moves),
    "points": [Controller.moves[0], Controller.moves[59], Controller.moves[60], Controller.moves[-1]]
}))
`
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const summary = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
  assert.deepEqual(summary, {
    count: 70,
    points: [[100, 200], [210, 280], [80, 200], [90, 280]]
  })
})

test('Python 禁用格零操作并中断空格计数，阶段边界也重置候选空格', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
text = "Item Class: Currency\\nRarity: Currency\\nChaos Orb\\n--------"
class Matcher:
    valid = True
    def __init__(self, config): pass
    def check_interface(self): return True, {}
class Controller:
    moves = []
    calls = 0
    statuses = []
    def __init__(self, config): pass
    def move(self, x, y): Controller.moves.append([x, y]); return True
    def copy_item_text(self):
        status = Controller.statuses[Controller.calls] if Controller.calls < len(Controller.statuses) else "copied"
        Controller.calls += 1
        return status, text if status == "copied" else ""
    def ctrl_click(self): return True
    def release_all(self): pass
module.InterfaceMatcher = Matcher
module.InputController = Controller
module.is_game_foreground = lambda: True

Controller.statuses = ["empty", "empty", "empty", "copied"]
module.run_stash({"inventory": {
    "startPos": {"x": 0, "y": 0}, "slotSize": {"w": 1, "h": 1},
    "layout": {"excludedSlots": [{"column": 0, "row": 2}]}
}})
excluded_case = {"moves": len(Controller.moves), "containsExcluded": [0, 2] in Controller.moves}

Controller.moves = []
Controller.calls = 0
Controller.statuses = ["copied"] * 58 + ["empty", "empty", "empty", "copied"]
module.run_stash({"inventory": {
    "startPos": {"x": 0, "y": 0}, "slotSize": {"w": 1, "h": 1},
    "layout": {"extraEnabled": True, "extraColumns": 2}
}})
boundary_case = {"moves": len(Controller.moves), "extraFirst": Controller.moves[60]}
print(json.dumps({"excluded": excluded_case, "boundary": boundary_case}))
`
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const summary = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
  assert.deepEqual(summary, {
    excluded: { moves: 59, containsExcluded: false },
    boundary: { moves: 70, extraFirst: [-2, 0] }
  })
})

test('原生阶段连续空格达到配置阈值时不进入额外背包', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class Matcher:
    valid = True
    def __init__(self, config): pass
    def check_interface(self): return True, {}
class Controller:
    moves = []
    def __init__(self, config): pass
    def move(self, x, y): Controller.moves.append([x, y]); return True
    def copy_item_text(self): return "empty", ""
    def ctrl_click(self): return True
    def release_all(self): pass
module.InterfaceMatcher = Matcher
module.InputController = Controller
module.is_game_foreground = lambda: True
module.run_stash({"inventory": {
    "startPos": {"x": 0, "y": 0}, "slotSize": {"w": 1, "h": 1},
    "emptySlotThreshold": 4,
    "layout": {"extraEnabled": True, "extraColumns": 6}
}})
print(json.dumps(Controller.moves))
`
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1)), [[0, 0], [0, 1], [0, 2], [0, 3]])
})

test('Electron 运行配置显式透传背包布局', () => {
  const source = readFileSync(new URL('../electron/modules/ipc/bag.js', import.meta.url), 'utf8')
  assert.match(source, /inventory:[\s\S]*layout: config\.inventory\?\.layout \|\| \{\}/)
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
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const lines = result.stdout.trim().split(/\r?\n/)
  const summary = JSON.parse(lines.pop())
  const completed = JSON.parse(lines.at(-1).slice(6))
  assert.deepEqual(summary, { code: 0, clicks: 1 })
  assert.equal('failedSlots' in completed, false)
  assert.equal(completed.stashedSlots, 1)
})

test('Python 已知 2x3 物品入库后跳过剩余五格且保持逻辑进度', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
body = "Item Class: Body Armour\\nRarity: Rare\\nStorm Shell\\nAstral Plate\\n--------"
class Matcher:
    valid = True
    def __init__(self, config): pass
    def check_interface(self): return True, {}
class Controller:
    moves = []
    clicks = 0
    current = None
    removed = False
    def __init__(self, config): pass
    def move(self, x, y):
        Controller.current = (x, y)
        Controller.moves.append([x, y])
        return True
    def copy_item_text(self):
        if not Controller.removed and Controller.current in {(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2)}:
            return "copied", body
        return "empty", ""
    def ctrl_click(self):
        Controller.clicks += 1
        Controller.removed = True
        return True
    def release_all(self): pass
module.InterfaceMatcher = Matcher
module.InputController = Controller
module.is_game_foreground = lambda: True
catalog = {"schemaVersion": 1, "items": {}, "categories": {
    "body armour": {"key": "body armour", "width": 2, "height": 3, "source": "bundled"}
}}
module.run_stash({"inventory": {
    "startPos": {"x": 0, "y": 0}, "slotSize": {"w": 1, "h": 1},
    "emptySlotThreshold": 60, "itemFootprints": catalog
}})
print(json.dumps({"moves": Controller.moves, "clicks": Controller.clicks}))
`
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const lines = result.stdout.trim().split(/\r?\n/)
  const summary = JSON.parse(lines.pop())
  const completed = JSON.parse(lines.at(-1).slice(6))
  assert.equal(summary.clicks, 1)
  assert.equal(summary.moves.length, 55)
  for (const point of [[0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]) {
    assert.equal(summary.moves.some((move) => move[0] === point[0] && move[1] === point[1]), false)
  }
  assert.equal(completed.scannedSlots, 60)
  assert.equal(completed.stashedSlots, 1)
  assert.equal(completed.skippedOccupiedSlots, 5)
})

test('Python 占位解析覆盖多尺寸并对未知、越界和更早排除格回退', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
phase = module.build_scan_phases({"layout": {}})[0]
catalog = {"schemaVersion": 1, "items": {
    module.footprint_key("", "双手剑"): {"width": 2, "height": 4},
    module.footprint_key("", "单手剑"): {"width": 1, "height": 3},
    module.footprint_key("", "药剂"): {"width": 1, "height": 2},
    module.footprint_key("", "戒指"): {"width": 1, "height": 1}
}, "categories": {}}
def footprint(name):
    return module.resolve_item_footprint({"category": "测试", "name": name, "baseName": ""}, catalog)
target = {"column": 0, "row": 0, "excluded": False}
result = {
    "sizes": [footprint(name) for name in ["双手剑", "单手剑", "药剂", "戒指", "未知"]],
    "twoHandSlots": len(module.resolved_footprint_slots(target, footprint("双手剑"), phase, set())),
    "outOfBounds": len(module.resolved_footprint_slots(
        {"column": 11, "row": 4, "excluded": False}, footprint("双手剑"), phase, set())),
    "excludedBefore": len(module.resolved_footprint_slots(
        {"column": 1, "row": 1, "excluded": False}, {"width": 2, "height": 2}, phase, {(0, 0)}))
}
print(json.dumps(result, ensure_ascii=False))
`
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), {
    sizes: [
      { width: 2, height: 4 },
      { width: 1, height: 3 },
      { width: 1, height: 2 },
      { width: 1, height: 1 },
      null
    ],
    twoHandSlots: 8,
    outOfBounds: 0,
    excludedBefore: 0
  })
})

test('Python 黑名单多格物品保留且只识别一次', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
flask = "Item Class: Flask\\nRarity: Magic\\nGranite Flask\\n--------"
class Matcher:
    valid = True
    def __init__(self, config): pass
    def check_interface(self): return True, {}
class Controller:
    current = None
    moves = []
    clicks = 0
    def __init__(self, config): pass
    def move(self, x, y):
        Controller.current = (x, y)
        Controller.moves.append([x, y])
        return True
    def copy_item_text(self):
        return ("copied", flask) if Controller.current in {(0, 0), (0, 1)} else ("empty", "")
    def ctrl_click(self): Controller.clicks += 1; return True
    def release_all(self): pass
module.InterfaceMatcher = Matcher
module.InputController = Controller
module.is_game_foreground = lambda: True
module.run_stash({
    "blacklist": [{"field": "category", "keyword": "Flask", "matchMode": "exact"}],
    "inventory": {
        "startPos": {"x": 0, "y": 0}, "slotSize": {"w": 1, "h": 1},
        "emptySlotThreshold": 60,
        "itemFootprints": {"schemaVersion": 1, "items": {}, "categories": {
            "flask": {"width": 1, "height": 2}
        }}
    }
})
print(json.dumps({"moves": Controller.moves, "clicks": Controller.clicks}))
`
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const lines = result.stdout.trim().split(/\r?\n/)
  const summary = JSON.parse(lines.pop())
  const completed = JSON.parse(lines.at(-1).slice(6))
  assert.equal(summary.clicks, 0)
  assert.equal(summary.moves.some((move) => move[0] === 0 && move[1] === 1), false)
  assert.equal(completed.blacklistedSlots, 1)
  assert.equal(completed.skippedOccupiedSlots, 1)
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

test('完整背包运行时配置热更新检测并保留当前入库进程快照', () => {
  const ipcSource = readFileSync(new URL('../electron/modules/ipc/bag.js', import.meta.url), 'utf8')
  const preloadSource = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
  const apiSource = readFileSync(new URL('../src/api/electron.js', import.meta.url), 'utf8')
  const bagView = readFileSync(new URL('../src/domains/bag/BagView.vue', import.meta.url), 'utf8')
  const handler = ipcSource.match(/ipcMain\.handle\('update-bag-runtime-config'[\s\S]*?\n  \}\)/)?.[0] || ''
  assert.match(handler, /interfaceDetection\.updateConfig\(candidate\)/)
  assert.match(handler, /latestConfig = candidate/)
  assert.match(handler, /bagConfigRevision \+= 1/)
  assert.doesNotMatch(handler, /stopChild\(stashProcess\)|stashProcess = null/)
  assert.match(ipcSource, /const frozenConfig = structuredClone\(latestConfig\)/)
  assert.match(preloadSource, /updateBagRuntimeConfig/)
  assert.match(apiSource, /updateRuntimeConfig/)
  assert.doesNotMatch(bagView, /:disabled="bagStore\.moduleEnabled"/)
  assert.doesNotMatch(bagView, /请先关闭模块再修改黑名单/)
  assert.match(bagView, /新规则从下一轮入库生效/)
})

test('正式包携带背包脚本并从稳定路径解析', () => {
  const packageConfig = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.ok(packageConfig.build.extraResources.some((entry) => entry.to === 'bag_auto_stash_template.py'))
  for (const sharedModule of [
    'src/utils/bagConfig.js',
    'src/utils/electronAccelerator.js',
    'src/utils/inventorySettings.js',
    'src/utils/operationDelay.js'
  ]) {
    assert.ok(packageConfig.build.files.includes(sharedModule), `正式包缺少主进程依赖：${sharedModule}`)
  }
  const ipcSource = readFileSync(new URL('../electron/modules/ipc/bag.js', import.meta.url), 'utf8')
  assert.match(ipcSource, /process\.resourcesPath/)
  assert.match(ipcSource, /path\.resolve\(moduleDir, '\.\.\/\.\.\/\.\.\/src\/assets\/scripts\/bag_auto_stash_template\.py'\)/)
  assert.match(ipcSource, /candidates\.find\(\(candidate\) => fs\.existsSync\(candidate\)\)/)
})

test('制作进度穿透浮窗使用统一指针抓手拖动', () => {
  const source = readFileSync(new URL('../src/domains/overlay/components/OverlayContent.vue', import.meta.url), 'utf8')
  assert.match(source, /class="overlay-drag-handle"/)
  assert.match(source, /createOverlayDrag/)
  assert.match(source, /@pointerdown="drag\.pointerDown"/)
  assert.match(source, /cursor: grab/)
  assert.match(source, /cursor: grabbing/)
  assert.match(source, /-webkit-app-region: no-drag/)
  assert.doesNotMatch(source, /activateDragHandle|deactivateDragHandle|@mouseenter/)
  assert.doesNotMatch(source, /getWindowPosition|setWindowPosition|handleMouseDown/)
  assert.doesNotMatch(source, /class="overlay-content"[^>]*@mouseenter/)
})

test('模板替换允许运行态更新并重载检测器', () => {
  const ipcSource = readFileSync(new URL('../electron/modules/ipc/bag.js', import.meta.url), 'utf8')
  const settingsSource = readFileSync(new URL('../src/domains/settings/InterfaceDetectionSettings.vue', import.meta.url), 'utf8')
  const coordinatorSource = readFileSync(new URL('../electron/modules/interfaceDetection/coordinator.js', import.meta.url), 'utf8')
  assert.match(ipcSource, /reloadDetectionForTemplateChange/)
  assert.match(ipcSource, /updateRuntimeTemplate\(type, targetPath/)
  assert.match(ipcSource, /interfaceDetection\.updateConfig\(latestConfig\)/)
  assert.match(coordinatorSource, /async restart\(\)[\s\S]*stopChild\(previous\)[\s\S]*return this\.start\(\)/)
  assert.match(coordinatorSource, /if \(this\.child !== child\) return/)
  assert.match(ipcSource, /reloadError/)
  assert.match(settingsSource, /captureTemplate\(definition\)/)
  assert.match(settingsSource, /游戏界面检测/)
})
