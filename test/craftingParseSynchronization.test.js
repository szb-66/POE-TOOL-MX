import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { pythonPath } from './helpers/python.js'

const craftingTemplate = readFileSync(new URL('../src/assets/scripts/crafting_template.py', import.meta.url), 'utf8')
const mapTemplate = readFileSync(new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url), 'utf8')

function block(source, start, end) {
  return source.slice(source.indexOf(start), source.indexOf(end))
}

function runPython(source) {
  const result = spawnSync(pythonPath, ['-c', source], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

test('装备模板在复制到旧剪贴板内容时不写入解析请求', () => {
  const snippet = block(craftingTemplate, 'def read_clipboard_to_file(', 'def wait_for_parse_result(')
  const result = runPython(`
import json, os, tempfile, types
${snippet}
with tempfile.TemporaryDirectory() as directory:
    item_info_file = os.path.join(directory, "item.json")
    item_info_result_file = os.path.join(directory, "result.json")
    GetClipboardSequenceNumber = None
    pyperclip = types.SimpleNamespace(paste=lambda: "上一轮复制的物品文本")
    def send_copy_command(_before_seq=None, _before_text="", allow_unchanged_text=False):
        return True
    parsed = read_clipboard_to_file()
    print(json.dumps({"result": parsed, "wroteRequest": os.path.exists(item_info_file)}, ensure_ascii=False))
`)
  assert.equal(result.result, false)
  assert.equal(result.wroteRequest, false)
})

test('装备模板重试允许同文本时写入解析请求', () => {
  const snippet = block(craftingTemplate, 'def read_clipboard_to_file(', 'def wait_for_parse_result(')
  const result = runPython(`
import json, os, tempfile, types
${snippet}
with tempfile.TemporaryDirectory() as directory:
    item_info_file = os.path.join(directory, "item.json")
    item_info_result_file = os.path.join(directory, "result.json")
    GetClipboardSequenceNumber = None
    parse_request_sequence = 0
    pending_parse_request_id = 0
    pyperclip = types.SimpleNamespace(paste=lambda: "上一轮复制的物品文本")
    def send_copy_command(_before_seq=None, _before_text="", allow_unchanged_text=False):
        return True
    parsed = read_clipboard_to_file(allow_unchanged_text=True)
    print(json.dumps({"result": parsed, "wroteRequest": os.path.exists(item_info_file)}, ensure_ascii=False))
`)
  assert.equal(result.result, 1)
  assert.equal(result.wroteRequest, true)
})

test('装备模板在复制到空剪贴板内容时不写入解析请求', () => {
  const snippet = block(craftingTemplate, 'def read_clipboard_to_file(', 'def wait_for_parse_result(')
  const result = runPython(`
import json, os, tempfile, types
${snippet}
with tempfile.TemporaryDirectory() as directory:
    item_info_file = os.path.join(directory, "item.json")
    item_info_result_file = os.path.join(directory, "result.json")
    GetClipboardSequenceNumber = None
    pyperclip = types.SimpleNamespace(paste=lambda: "")
    def send_copy_command(_before_seq=None, _before_text="", allow_unchanged_text=False):
        return True
    parsed = read_clipboard_to_file()
    print(json.dumps({"result": parsed, "wroteRequest": os.path.exists(item_info_file)}, ensure_ascii=False))
`)
  assert.equal(result.result, false)
  assert.equal(result.wroteRequest, false)
})

test('装备与地图模板在序列号变化但内容未变时不判定复制成功', () => {
  for (const template of [craftingTemplate, mapTemplate]) {
    const snippet = block(template, 'def clipboard_changed(', 'def read_clipboard_to_file(')
    const result = runPython(`
import json, tempfile, types
${snippet}
CLIPBOARD_POLL_INTERVAL_SECONDS = 0.01
is_running = True
GetClipboardSequenceNumber = lambda: 42
pyperclip = types.SimpleNamespace(paste=lambda: "复制前内容")
clock = {"now": 0.0}
def monotonic():
    clock["now"] += 1.0
    return clock["now"]
time = types.SimpleNamespace(sleep=lambda _value: None, monotonic=monotonic)
copied = wait_for_clipboard_change(41, "复制前内容", 1.0)
print(json.dumps({"copied": copied, "loops": clock["now"]}, ensure_ascii=False))
`)
    assert.equal(result.copied, false)
    assert.ok(result.loops >= 1)
  }
})

test('装备与地图模板在序列号变化且内容变化时判定复制成功', () => {
  for (const template of [craftingTemplate, mapTemplate]) {
    const snippet = block(template, 'def clipboard_changed(', 'def read_clipboard_to_file(')
    const result = runPython(`
import json, types
${snippet}
CLIPBOARD_POLL_INTERVAL_SECONDS = 0.01
is_running = True
GetClipboardSequenceNumber = lambda: 42
pyperclip = types.SimpleNamespace(paste=lambda: "新物品文本")
time = types.SimpleNamespace(sleep=lambda _value: None, monotonic=lambda: 1.0)
copied = wait_for_clipboard_change(41, "旧物品文本", 1.0)
print(json.dumps({"copied": copied}, ensure_ascii=False))
`)
    assert.equal(result.copied, true)
  }
})

test('装备与地图模板在重试允许同文本时序列号变化即判复制成功', () => {
  for (const template of [craftingTemplate, mapTemplate]) {
    const snippet = block(template, 'def clipboard_changed(', 'def read_clipboard_to_file(')
    const result = runPython(`
import json, types
${snippet}
CLIPBOARD_POLL_INTERVAL_SECONDS = 0.01
is_running = True
GetClipboardSequenceNumber = lambda: 42
pyperclip = types.SimpleNamespace(paste=lambda: "复制前内容")
time = types.SimpleNamespace(sleep=lambda _value: None, monotonic=lambda: 1.0)
copied = wait_for_clipboard_change(41, "复制前内容", 1.0, allow_unchanged_text=True)
print(json.dumps({"copied": copied}, ensure_ascii=False))
`)
    assert.equal(result.copied, true)
  }
})

for (const [name, template, end] of [
  ['装备', craftingTemplate, 'def fail_item_preparation('],
  ['地图和海图', mapTemplate, 'def get_slot_position(']
]) {
  test(`${name}模板接受等待开始前已经返回的当前解析结果`, () => {
    const waitBlock = block(template, 'def wait_for_parse_result(', end)
    const result = runPython(`
import json, os, tempfile, types
${waitBlock}
with tempfile.TemporaryDirectory() as directory:
    item_info_file = os.path.join(directory, "item.json")
    item_info_result_file = os.path.join(directory, "result.json")
    with open(item_info_file, "w", encoding="utf-8") as handle:
        json.dump({"clipboard": "item", "requestId": 1}, handle)
    with open(item_info_result_file, "w", encoding="utf-8") as handle:
        json.dump({"category": "地图", "requestId": 1}, handle)
    is_running = True
    pending_parse_request_id = 1
    time = types.SimpleNamespace(sleep=lambda _value: None)
    print(json.dumps(wait_for_parse_result(), ensure_ascii=False))
`)
    assert.equal(result.category, '地图')
    assert.equal(result.requestId, 1)
  })

  test(`${name}模板忽略陈旧响应并等待当前请求`, () => {
    const waitBlock = block(template, 'def wait_for_parse_result(', end)
    const result = runPython(`
import json, os, tempfile, types
${waitBlock}
with tempfile.TemporaryDirectory() as directory:
    item_info_file = os.path.join(directory, "item.json")
    item_info_result_file = os.path.join(directory, "result.json")
    with open(item_info_file, "w", encoding="utf-8") as handle:
        json.dump({"clipboard": "current", "requestId": 2}, handle)
    with open(item_info_result_file, "w", encoding="utf-8") as handle:
        json.dump({"category": "旧结果", "requestId": 1}, handle)
    is_running = True
    pending_parse_request_id = 2
    sleep_calls = 0
    def advance(_value):
        global sleep_calls
        if sleep_calls == 0:
            with open(item_info_result_file, "w", encoding="utf-8") as handle:
                json.dump({"category": "当前结果", "requestId": 2}, handle)
        sleep_calls += 1
    time = types.SimpleNamespace(sleep=advance)
    print(json.dumps(wait_for_parse_result(), ensure_ascii=False))
`)
    assert.equal(result.category, '当前结果')
    assert.equal(result.requestId, 2)
  })
}

test('地图和海图单张处理失败后停止且不移动到第二格', () => {
  const startBlock = block(mapTemplate, 'def start_map_rolling():', 'def process_single_map(')
  const result = runPython(`
import json, types
${startBlock}
events = []
grid_config = {"startX": 0, "startY": 0, "offsetX": 1, "offsetY": 1, "rows": 2, "cols": 1, "emptySlotThreshold": 2}
map_config = {"targetKind": "atlas"}
fatal_error_reason = None
GetClipboardSequenceNumber = None
keyboard = types.SimpleNamespace(GlobalHotKeys=lambda _mapping: types.SimpleNamespace(start=lambda: None))
pyperclip = types.SimpleNamespace(paste=lambda: "地图")
time = types.SimpleNamespace(sleep=lambda _value: None)
def focus_game_window(): return True
def select_currency_stash_tab(_mode): return True
def preflight_required_currencies(): return True
def move_mouse(x, y): events.append(["move", x, y]); return True
def get_slot_position(col, row): return col, row
def read_clipboard_to_file(): return 1
def wait_for_parse_result(_request_id=None): return {"category": "地图", "name": "测试", "mapTier": 16}
def process_single_map(_result, _x, _y): events.append(["process"]); return {"status": "failed", "reason": "解析超时"}
def count_affix_stats(_result): return {}, {}
def update_map_stats(*_args): events.append(["stats"])
def release_all_keys(): events.append(["release"])
def play_success_sound(): events.append(["success"])
def play_error_sound(): events.append(["error"])
def fail_map_runtime(reason, _code="MAP_PROCESSING_FAILED"):
    global fatal_error_reason, is_running
    fatal_error_reason = reason
    is_running = False
    events.append(["release"])
    return False
start_map_rolling()
print(json.dumps({"events": events, "reason": fatal_error_reason}, ensure_ascii=False))
`)
  assert.equal(result.events.filter(([event]) => event === 'process').length, 1)
  assert.deepEqual(result.events.filter(([event]) => event === 'move'), [['move', 0, 0]])
  assert.equal(result.reason, '解析超时')
})

function runSingleTarget({ method, targetKind, category, parsedResults }) {
  const helperBlock = block(mapTemplate, 'def completed_map_result(', 'def start_map_rolling():')
  const processBlock = block(mapTemplate, 'def process_single_map(', 'def read_and_parse(')
  return runPython(`
import json
${helperBlock}
${processBlock}
map_config = {"method": "${method}", "targetKind": "${targetKind}", "autoStash": False, "vaal": {"enabled": False}}
is_running = True
fatal_error_reason = None
CURRENCY_NAMES = {"alchemy": "点金石", "chaos": "混沌石", "scouring": "重铸石", "wisdom": "知识卷轴", "vaal": "瓦尔宝珠"}
currencies = []
copies = []
results = ${JSON.stringify(parsedResults).replaceAll('true', 'True').replaceAll('false', 'False')}
def item_matches_rolling_target(item): return item.get("category") == "${category}"
def rolling_target_label(): return "目标"
def rolling_item_level_label(_item): return "等级"
def read_and_parse(_x, _y, allow_unchanged_text=False): copies.append(len(copies) + 1); return len(copies)
def wait_for_parse_result(_request_id=None): return results.pop(0)
def apply_currency(currency, _x, _y): currencies.append(currency); return True
def check_map_base(item): return bool(item.get("match"))
def check_map_mods(_item): return True
def stash_item(_x, _y): return True
result = process_single_map({"category": "${category}", "rarity": "${method === 'chaos' ? '稀有' : '普通'}", "match": False}, 1, 2)
print(json.dumps({"result": result, "currencies": currencies, "copies": copies}, ensure_ascii=False))
`)
}

for (const [targetKind, category] of [['atlas', '地图'], ['chart', '海图']]) {
  test(`点金模式在${category}首次解析失败时只重试复制，不重复使用通货`, () => {
    const outcome = runSingleTarget({
      method: 'alchemy',
      targetKind,
      category,
      parsedResults: [
        { error: '等待超时' },
        { category, rarity: '稀有', match: true }
      ]
    })
    assert.deepEqual(outcome.currencies, ['alchemy'])
    assert.equal(outcome.copies.length, 2)
    assert.equal(outcome.result.status, 'completed-qualified')
  })
}

test('混沌模式在地图未达标时继续当前格直至达标', () => {
  const outcome = runSingleTarget({
    method: 'chaos',
    targetKind: 'atlas',
    category: '地图',
    parsedResults: [{ category: '地图', rarity: '稀有', match: true }]
  })
  assert.deepEqual(outcome.currencies, ['chaos'])
  assert.equal(outcome.copies.length, 1)
  assert.equal(outcome.result.status, 'completed-qualified')
})
