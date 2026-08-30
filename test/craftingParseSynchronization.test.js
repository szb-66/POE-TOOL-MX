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
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
with tempfile.TemporaryDirectory() as directory:
    item_info_file = os.path.join(directory, "item.json")
    item_info_result_file = os.path.join(directory, "result.json")
    GetClipboardSequenceNumber = None
    pyperclip = types.SimpleNamespace(paste=lambda: "上一轮复制的物品文本")
    def send_copy_command(_before_seq=None, _before_text="", allow_unchanged_text=False):
        return None
    parsed = read_clipboard_to_file()
    print(json.dumps({"result": parsed, "wroteRequest": os.path.exists(item_info_file)}, ensure_ascii=False))
`)
  assert.equal(result.result, false)
  assert.equal(result.wroteRequest, false)
})

test('装备模板重试在无法确认剪贴板序列变化时拒绝同文本', () => {
  const snippet = block(craftingTemplate, 'def read_clipboard_to_file(', 'def wait_for_parse_result(')
  const result = runPython(`
import json, os, tempfile, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
with tempfile.TemporaryDirectory() as directory:
    item_info_file = os.path.join(directory, "item.json")
    item_info_result_file = os.path.join(directory, "result.json")
    GetClipboardSequenceNumber = None
    parse_request_sequence = 0
    pending_parse_request_id = 0
    pyperclip = types.SimpleNamespace(paste=lambda: "上一轮复制的物品文本")
    def send_copy_command(_before_seq=None, _before_text="", allow_unchanged_text=False):
        return None
    parsed = read_clipboard_to_file(allow_unchanged_text=True)
    print(json.dumps({"result": parsed, "wroteRequest": os.path.exists(item_info_file)}, ensure_ascii=False))
`)
  assert.equal(result.result, false)
  assert.equal(result.wroteRequest, false)
})

test('装备模板在复制到空剪贴板内容时不写入解析请求', () => {
  const snippet = block(craftingTemplate, 'def read_clipboard_to_file(', 'def wait_for_parse_result(')
  const result = runPython(`
import json, os, tempfile, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
with tempfile.TemporaryDirectory() as directory:
    item_info_file = os.path.join(directory, "item.json")
    item_info_result_file = os.path.join(directory, "result.json")
    GetClipboardSequenceNumber = None
    pyperclip = types.SimpleNamespace(paste=lambda: "")
    def send_copy_command(_before_seq=None, _before_text="", allow_unchanged_text=False):
        return None
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
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
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
print(json.dumps({"copied": copied, "unchanged": copied == "__CLIPBOARD_TEXT_UNCHANGED__"}, ensure_ascii=False))
`)
    assert.ok(result.copied !== '复制前内容')
    // 装备与地图模板都区分"复制成功但文本未变化"（哨兵），不判定为复制成功
    assert.equal(result.unchanged, true)
  }
})

test('地图模板读取在全部尝试均为同文本时返回未变化且不放行', () => {
  const snippet = block(mapTemplate, 'def read_current_rolling_target(', 'def update_map_recovery_checkpoint(')
  const result = runPython(`
import json, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
is_running = True
fatal_error_reason = None
calls = []
outcomes = ["unchanged", "unchanged", "unchanged"]
def read_and_parse(_x, _y, allow_unchanged_text=False, **_kwargs):
    calls.append(bool(allow_unchanged_text))
    return outcomes.pop(0)
def wait_for_parse_result(_request_id=None): raise AssertionError("不应分发解析")
def item_matches_rolling_target(_item): return False
def rolling_target_label(): return "地图"
result = read_current_rolling_target(1, 2)
print(json.dumps({"result": result, "calls": calls}, ensure_ascii=False))
`)
  assert.deepEqual(result.result, { unchanged: true })
  assert.deepEqual(result.calls, [false, false, false])
})

test('地图模板读取在未变化后重试拒收同文本直至取得新文本', () => {
  const snippet = block(mapTemplate, 'def read_current_rolling_target(', 'def update_map_recovery_checkpoint(')
  const result = runPython(`
import json, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
is_running = True
fatal_error_reason = None
calls = []
outcomes = ["unchanged", 2]
parsed = [{"category": "地图", "mapTier": 16}]
def read_and_parse(_x, _y, allow_unchanged_text=False, **_kwargs):
    calls.append(bool(allow_unchanged_text))
    return outcomes.pop(0)
def wait_for_parse_result(_request_id=None): return parsed.pop(0)
def item_matches_rolling_target(_item): return True
def rolling_target_label(): return "地图"
result = read_current_rolling_target(1, 2)
print(json.dumps({"result": result, "calls": calls}, ensure_ascii=False))
`)
  assert.equal(result.result.category, '地图')
  assert.deepEqual(result.calls, [false, false])
})

test('地图模板读取在解析分发失败后的重试放行同文本重发', () => {
  const snippet = block(mapTemplate, 'def read_current_rolling_target(', 'def update_map_recovery_checkpoint(')
  const result = runPython(`
import json, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
is_running = True
fatal_error_reason = None
calls = []
outcomes = [1, 2]
parsed = [{"error": "等待超时"}, {"category": "地图", "mapTier": 16}]
def read_and_parse(_x, _y, allow_unchanged_text=False, **_kwargs):
    calls.append(bool(allow_unchanged_text))
    return outcomes.pop(0)
def wait_for_parse_result(_request_id=None): return parsed.pop(0)
def item_matches_rolling_target(_item): return True
def rolling_target_label(): return "地图"
result = read_current_rolling_target(1, 2)
print(json.dumps({"result": result, "calls": calls}, ensure_ascii=False))
`)
  assert.equal(result.result.category, '地图')
  assert.deepEqual(result.calls, [false, true])
})

test('地图模板初始读取显式同文本放行行为保持不变', () => {
  const snippet = block(mapTemplate, 'def read_current_rolling_target(', 'def update_map_recovery_checkpoint(')
  const result = runPython(`
import json, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
is_running = True
fatal_error_reason = None
calls = []
outcomes = [1]
parsed = [{"category": "地图", "mapTier": 16}]
def read_and_parse(_x, _y, allow_unchanged_text=False, **_kwargs):
    calls.append(bool(allow_unchanged_text))
    return outcomes.pop(0)
def wait_for_parse_result(_request_id=None): return parsed.pop(0)
def item_matches_rolling_target(_item): return True
def rolling_target_label(): return "地图"
result = read_current_rolling_target(1, 2, attempts=3, allow_unchanged_text=True, empty_on_copy_failure=True)
print(json.dumps({"result": result, "calls": calls}, ensure_ascii=False))
`)
  assert.equal(result.result.category, '地图')
  assert.deepEqual(result.calls, [true])
})

test('装备与地图模板在序列号变化且内容变化时判定复制成功', () => {
  for (const template of [craftingTemplate, mapTemplate]) {
    const snippet = block(template, 'def clipboard_changed(', 'def read_clipboard_to_file(')
    const result = runPython(`
import json, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
CLIPBOARD_POLL_INTERVAL_SECONDS = 0.01
is_running = True
GetClipboardSequenceNumber = lambda: 42
pyperclip = types.SimpleNamespace(paste=lambda: "新物品文本")
time = types.SimpleNamespace(sleep=lambda _value: None, monotonic=lambda: 1.0)
copied = wait_for_clipboard_change(41, "旧物品文本", 1.0)
print(json.dumps({"copied": copied}, ensure_ascii=False))
`)
    assert.equal(result.copied, '新物品文本')
  }
})

test('装备与地图模板在重试允许同文本时序列号变化即判复制成功', () => {
  for (const template of [craftingTemplate, mapTemplate]) {
    const snippet = block(template, 'def clipboard_changed(', 'def read_clipboard_to_file(')
    const result = runPython(`
import json, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
CLIPBOARD_POLL_INTERVAL_SECONDS = 0.01
is_running = True
GetClipboardSequenceNumber = lambda: 42
pyperclip = types.SimpleNamespace(paste=lambda: "复制前内容")
time = types.SimpleNamespace(sleep=lambda _value: None, monotonic=lambda: 1.0)
copied = wait_for_clipboard_change(41, "复制前内容", 1.0, allow_unchanged_text=True)
print(json.dumps({"copied": copied}, ensure_ascii=False))
`)
    assert.equal(result.copied, '复制前内容')
  }
})

test('装备与地图模板在没有序列号证据时拒绝同文本重试', () => {
  for (const template of [craftingTemplate, mapTemplate]) {
    const snippet = block(template, 'def clipboard_changed(', 'def read_clipboard_to_file(')
    const result = runPython(`
import json, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
CLIPBOARD_POLL_INTERVAL_SECONDS = 0.01
is_running = True
GetClipboardSequenceNumber = None
pyperclip = types.SimpleNamespace(paste=lambda: "复制前内容")
clock = {"now": 0.0}
def monotonic():
    clock["now"] += 1.0
    return clock["now"]
time = types.SimpleNamespace(sleep=lambda _value: None, monotonic=monotonic)
copied = wait_for_clipboard_change(None, "复制前内容", 1.0, allow_unchanged_text=True)
print(json.dumps({"copied": copied}, ensure_ascii=False))
`)
    assert.equal(result.copied, false)
  }
})

test('装备模板读取在全部尝试均为同文本时返回未变化且不放行', () => {
  const snippet = block(craftingTemplate, 'def fail_item_runtime(', 'def fail_item_preparation(')
    .replaceAll('{{ENABLE_AFFIX}}', 'False')
    .replaceAll('{{ENABLE_ELDRITCH}}', 'False')
  const result = runPython(`
import json, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
is_running = True
fatal_error_reason = None
def release_all_keys(): pass
def play_error_sound(): pass
calls = []
outcomes = ["unchanged", "unchanged", "unchanged"]
def read_clipboard_to_file(allow_unchanged_text=False, **_kwargs):
    calls.append(bool(allow_unchanged_text))
    return outcomes.pop(0)
def wait_for_parse_result(_request_id=None): raise AssertionError("不应分发解析")
result = read_current_item()
print(json.dumps({"result": result, "calls": calls, "fatal": fatal_error_reason}, ensure_ascii=False))
`)
  assert.deepEqual(result.result, { unchanged: true })
  assert.deepEqual(result.calls, [false, false, false])
  assert.equal(result.fatal, null)
})

test('装备模板读取在未变化后重试拒收同文本直至取得新文本', () => {
  const snippet = block(craftingTemplate, 'def fail_item_runtime(', 'def fail_item_preparation(')
    .replaceAll('{{ENABLE_AFFIX}}', 'False')
    .replaceAll('{{ENABLE_ELDRITCH}}', 'False')
  const result = runPython(`
import json, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
is_running = True
fatal_error_reason = None
def release_all_keys(): pass
def play_error_sound(): pass
calls = []
outcomes = ["unchanged", 2]
parsed = [{"rarity": "魔法", "affixMatch": True}]
def read_clipboard_to_file(allow_unchanged_text=False, **_kwargs):
    calls.append(bool(allow_unchanged_text))
    return outcomes.pop(0)
def wait_for_parse_result(_request_id=None): return parsed.pop(0)
result = read_current_item()
print(json.dumps({"result": result, "calls": calls}, ensure_ascii=False))
`)
  assert.equal(result.result.rarity, '魔法')
  assert.deepEqual(result.calls, [false, false])
})

test('装备模板读取在解析分发失败后的重试放行同文本重发', () => {
  const snippet = block(craftingTemplate, 'def fail_item_runtime(', 'def fail_item_preparation(')
    .replaceAll('{{ENABLE_AFFIX}}', 'False')
    .replaceAll('{{ENABLE_ELDRITCH}}', 'False')
  const result = runPython(`
import json, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
is_running = True
fatal_error_reason = None
def release_all_keys(): pass
def play_error_sound(): pass
calls = []
outcomes = [1, 2]
parsed = [{"error": "等待超时"}, {"rarity": "魔法"}]
def read_clipboard_to_file(allow_unchanged_text=False, **_kwargs):
    calls.append(bool(allow_unchanged_text))
    return outcomes.pop(0)
def wait_for_parse_result(_request_id=None): return parsed.pop(0)
result = read_current_item()
print(json.dumps({"result": result, "calls": calls}, ensure_ascii=False))
`)
  assert.equal(result.result.rarity, '魔法')
  assert.deepEqual(result.calls, [false, true])
})

test('装备模板显式同文本放行的首次尝试行为保持不变', () => {
  const snippet = block(craftingTemplate, 'def fail_item_runtime(', 'def fail_item_preparation(')
    .replaceAll('{{ENABLE_AFFIX}}', 'False')
    .replaceAll('{{ENABLE_ELDRITCH}}', 'False')
  const result = runPython(`
import json, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
is_running = True
fatal_error_reason = None
def release_all_keys(): pass
def play_error_sound(): pass
calls = []
outcomes = [1]
parsed = [{"rarity": "普通", "socketsCount": 3}]
def read_clipboard_to_file(allow_unchanged_text=False, **_kwargs):
    calls.append(bool(allow_unchanged_text))
    return outcomes.pop(0)
def wait_for_parse_result(_request_id=None): return parsed.pop(0)
result = read_current_item(allow_unchanged_text=True)
print(json.dumps({"result": result, "calls": calls}, ensure_ascii=False))
`)
  assert.equal(result.result.socketsCount, 3)
  assert.deepEqual(result.calls, [true])
})

test('装备模板通货后读取命中历史文本时退避复核并接受稳定文本', () => {
  const snippet = block(craftingTemplate, 'def read_clipboard_to_file(', 'def wait_for_parse_result(')
  const result = runPython(`
import json, os, tempfile, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
SEEN_TEXT_CAPACITY = 8
STALE_COPY_BACKOFF_SECONDS = 0.0
seen_item_texts = {"旧状态文本": True}
is_running = True
parse_request_sequence = 0
pending_parse_request_id = None
sleeps = []
time = types.SimpleNamespace(sleep=lambda _v: sleeps.append(1))
with tempfile.TemporaryDirectory() as directory:
    item_info_file = os.path.join(directory, "item.json")
    item_info_result_file = os.path.join(directory, "result.json")
    GetClipboardSequenceNumber = lambda: 7
    pyperclip = types.SimpleNamespace(paste=lambda: "旧状态文本")
    copies = []
    def send_copy_command(_before_seq=None, _before_text="", allow_unchanged_text=False):
        copies.append(_before_text)
        return "旧状态文本"
    request_id = read_clipboard_to_file(verify_freshness=True)
    with open(item_info_file, "r", encoding="utf-8") as handle:
        request = json.load(handle)
    print(json.dumps({"requestId": request_id, "clipboard": request["clipboard"], "copies": len(copies), "sleeps": len(sleeps), "stillSeen": "旧状态文本" in seen_item_texts}, ensure_ascii=False))
`)
  assert.equal(result.requestId, 1)
  assert.equal(result.clipboard, '旧状态文本')
  assert.equal(result.copies, 2)
  assert.equal(result.sleeps, 1)
  assert.equal(result.stillSeen, true)
})

test('装备模板可疑文本复核到较新结果时取新者', () => {
  const snippet = block(craftingTemplate, 'def read_clipboard_to_file(', 'def wait_for_parse_result(')
  const result = runPython(`
import json, os, tempfile, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
SEEN_TEXT_CAPACITY = 8
STALE_COPY_BACKOFF_SECONDS = 0.0
seen_item_texts = {"旧状态文本": True}
is_running = True
parse_request_sequence = 0
pending_parse_request_id = None
time = types.SimpleNamespace(sleep=lambda _v: None)
with tempfile.TemporaryDirectory() as directory:
    item_info_file = os.path.join(directory, "item.json")
    item_info_result_file = os.path.join(directory, "result.json")
    GetClipboardSequenceNumber = lambda: 7
    pyperclip = types.SimpleNamespace(paste=lambda: "旧状态文本")
    copies = []
    def send_copy_command(_before_seq=None, _before_text="", allow_unchanged_text=False):
        copies.append(_before_text)
        return "旧状态文本" if len(copies) == 1 else "较新状态文本"
    request_id = read_clipboard_to_file(verify_freshness=True)
    with open(item_info_file, "r", encoding="utf-8") as handle:
        request = json.load(handle)
    print(json.dumps({"requestId": request_id, "clipboard": request["clipboard"], "copies": len(copies)}, ensure_ascii=False))
`)
  assert.equal(result.requestId, 1)
  assert.equal(result.clipboard, '较新状态文本')
  assert.equal(result.copies, 2)
})

test('装备模板未变化退避复核仍不变才按无新信息处理', () => {
  const snippet = block(craftingTemplate, 'def read_clipboard_to_file(', 'def wait_for_parse_result(')
  const unchanged = runPython(`
import json, os, tempfile, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
SEEN_TEXT_CAPACITY = 8
STALE_COPY_BACKOFF_SECONDS = 0.0
seen_item_texts = {}
is_running = True
sleeps = []
time = types.SimpleNamespace(sleep=lambda _v: sleeps.append(1))
with tempfile.TemporaryDirectory() as directory:
    item_info_file = os.path.join(directory, "item.json")
    item_info_result_file = os.path.join(directory, "result.json")
    GetClipboardSequenceNumber = lambda: 7
    pyperclip = types.SimpleNamespace(paste=lambda: "复制前内容")
    copies = []
    def send_copy_command(_before_seq=None, _before_text="", allow_unchanged_text=False):
        copies.append(1)
        return CLIPBOARD_TEXT_UNCHANGED
    parsed = read_clipboard_to_file(verify_freshness=True)
    print(json.dumps({"result": parsed, "copies": len(copies), "sleeps": len(sleeps), "wroteRequest": os.path.exists(item_info_file)}, ensure_ascii=False))
`)
  assert.equal(unchanged.result, 'unchanged')
  assert.equal(unchanged.copies, 2)
  assert.equal(unchanged.sleeps, 1)
  assert.equal(unchanged.wroteRequest, false)

  const fresh = runPython(`
import json, os, tempfile, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
SEEN_TEXT_CAPACITY = 8
STALE_COPY_BACKOFF_SECONDS = 0.0
seen_item_texts = {}
is_running = True
parse_request_sequence = 0
pending_parse_request_id = None
time = types.SimpleNamespace(sleep=lambda _v: None)
with tempfile.TemporaryDirectory() as directory:
    item_info_file = os.path.join(directory, "item.json")
    item_info_result_file = os.path.join(directory, "result.json")
    GetClipboardSequenceNumber = lambda: 7
    pyperclip = types.SimpleNamespace(paste=lambda: "复制前内容")
    copies = []
    def send_copy_command(_before_seq=None, _before_text="", allow_unchanged_text=False):
        copies.append(1)
        return CLIPBOARD_TEXT_UNCHANGED if len(copies) == 1 else "新状态文本"
    request_id = read_clipboard_to_file(verify_freshness=True)
    with open(item_info_file, "r", encoding="utf-8") as handle:
        request = json.load(handle)
    print(json.dumps({"requestId": request_id, "clipboard": request["clipboard"], "copies": len(copies)}, ensure_ascii=False))
`)
  assert.equal(fresh.requestId, 1)
  assert.equal(fresh.clipboard, '新状态文本')
  assert.equal(fresh.copies, 2)
})

test('装备读取按调用语义传递新鲜度验证开关', () => {
  const snippet = block(craftingTemplate, 'def fail_item_runtime(', 'def fail_item_preparation(')
    .replaceAll('{{ENABLE_AFFIX}}', 'False')
    .replaceAll('{{ENABLE_ELDRITCH}}', 'False')
  const result = runPython(`
import json, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
is_running = True
fatal_error_reason = None
def release_all_keys(): pass
def play_error_sound(): pass
calls = []
def read_clipboard_to_file(allow_unchanged_text=False, **_kwargs):
    calls.append([bool(allow_unchanged_text), _kwargs.get("verify_freshness")])
    return 1
def wait_for_parse_result(_request_id=None): return {"rarity": "普通"}
read_current_item()
read_current_item(allow_unchanged_text=True)
print(json.dumps(calls))
`)
  assert.deepEqual(result, [[false, true], [true, false]])
})

test('地图模板通货后读取命中历史文本时退避复核到较新结果', () => {
  const snippet = block(mapTemplate, 'def read_clipboard_to_file(', 'def wait_for_parse_result(')
  const result = runPython(`
import json, os, tempfile, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
SEEN_TEXT_CAPACITY = 8
STALE_COPY_BACKOFF_SECONDS = 0.0
seen_item_texts = {"旧状态文本": True}
is_running = True
parse_request_sequence = 0
pending_parse_request_id = None
time = types.SimpleNamespace(sleep=lambda _v: None)
with tempfile.TemporaryDirectory() as directory:
    item_info_file = os.path.join(directory, "item.json")
    item_info_result_file = os.path.join(directory, "result.json")
    GetClipboardSequenceNumber = lambda: 7
    pyperclip = types.SimpleNamespace(paste=lambda: "旧状态文本")
    copies = []
    def send_copy_command(_before_seq=None, _before_text="", allow_unchanged_text=False):
        copies.append(_before_text)
        return "旧状态文本" if len(copies) == 1 else "较新状态文本"
    request_id = read_clipboard_to_file(verify_freshness=True)
    with open(item_info_file, "r", encoding="utf-8") as handle:
        request = json.load(handle)
    print(json.dumps({"requestId": request_id, "clipboard": request["clipboard"], "copies": len(copies)}, ensure_ascii=False))
`)
  assert.equal(result.requestId, 1)
  assert.equal(result.clipboard, '较新状态文本')
  assert.equal(result.copies, 2)
})

test('地图洗练读取按调用语义传递新鲜度验证开关', () => {
  const snippet = block(mapTemplate, 'def read_current_rolling_target(', 'def update_map_recovery_checkpoint(')
  const result = runPython(`
import json, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
is_running = True
fatal_error_reason = None
calls = []
def read_and_parse(_x, _y, allow_unchanged_text=False, **_kwargs):
    calls.append([bool(allow_unchanged_text), _kwargs.get("verify_freshness")])
    return 1
def wait_for_parse_result(_request_id=None): return {"category": "地图", "mapTier": 16}
def item_matches_rolling_target(_item): return True
def rolling_target_label(): return "地图"
read_current_rolling_target(1, 2)
read_current_rolling_target(1, 2, allow_unchanged_text=True, empty_on_copy_failure=True)
print(json.dumps(calls))
`)
  assert.deepEqual(result, [[false, true], [true, false]])
})

test('装备与地图模板requestId不匹配的等待最终超时返回失败', () => {
  for (const [template, end] of [[craftingTemplate, 'def fail_item_runtime('], [mapTemplate, 'def get_slot_position(']]) {
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
    time = types.SimpleNamespace(sleep=lambda _v: None)
    print(json.dumps(wait_for_parse_result(), ensure_ascii=False))
`)
    assert.ok(result.error && result.error.includes('等待超时'))
  }
})

test('装备与地图模板写入复制确认时捕获的同一份文本快照', () => {
  for (const template of [craftingTemplate, mapTemplate]) {
    const snippet = block(template, 'def read_clipboard_to_file(', 'def wait_for_parse_result(')
    const result = runPython(`
import json, os, tempfile, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
with tempfile.TemporaryDirectory() as directory:
    item_info_file = os.path.join(directory, "item.json")
    item_info_result_file = os.path.join(directory, "result.json")
    parse_request_sequence = 0
    pending_parse_request_id = None
    GetClipboardSequenceNumber = lambda: 10
    pastes = []
    def paste():
        pastes.append(len(pastes) + 1)
        return "复制前内容" if len(pastes) == 1 else "确认后被其他程序覆盖"
    pyperclip = types.SimpleNamespace(paste=paste)
    def send_copy_command(_before_seq=None, _before_text="", *_args, **_kwargs):
        return "本轮确认快照"
    request_id = read_clipboard_to_file()
    with open(item_info_file, "r", encoding="utf-8") as handle:
        request = json.load(handle)
    print(json.dumps({"requestId": request_id, "request": request, "pasteCalls": len(pastes)}, ensure_ascii=False))
`)
    assert.equal(result.requestId, 1)
    assert.equal(result.request.clipboard, '本轮确认快照')
    assert.equal(result.request.requestId, 1)
    assert.equal(result.pasteCalls, 1)
  }
})

test('装备与地图模板等待固定时长后单次确认剪贴板快照', () => {
  for (const template of [craftingTemplate, mapTemplate]) {
    const snippet = block(template, 'def send_copy_command(', 'def wait_for_parse_result(')
    const result = runPython(`
import json, types
${snippet}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
state = {"sequence": 10, "text": "上一轮物品", "sleeps": 0}
GetClipboardSequenceNumber = lambda: state["sequence"]
pyperclip = types.SimpleNamespace(paste=lambda: state["text"])
class Controller:
    def press(self, _key): pass
    def release(self, _key): pass
keyboard_controller = Controller()
Key = types.SimpleNamespace(ctrl="ctrl")
def sleep(_value):
    state["sleeps"] += 1
    if state["sleeps"] == 5:
        state["sequence"] = 11
        state["text"] = "本轮物品"
clock = {"now": 0.0}
def monotonic():
    clock["now"] += 0.01
    return clock["now"]
time = types.SimpleNamespace(sleep=sleep, monotonic=monotonic)
is_running = True
MODIFIER_SETTLE_SECONDS = KEY_HOLD_SECONDS = RELEASE_SETTLE_SECONDS = 0.0
CLIPBOARD_RESPONSE_MIN_SECONDS = 1.0
def require_game_foreground(): return True
copied = send_copy_command(10, "上一轮物品")
print(json.dumps({"copied": copied, "sequence": state["sequence"]}, ensure_ascii=False))
`)
    assert.equal(result.copied, '本轮物品')
    assert.equal(result.sequence, 11)
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
recovery_config = {}
current_recovery_checkpoint = None
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
def read_current_rolling_target(*_args, **_kwargs): return {"category": "地图", "name": "测试", "mapTier": 16}
def process_single_map(_result, _x, _y): events.append(["process"]); return {"status": "failed", "reason": "解析超时"}
def count_affix_stats(_result): return {}, {}
def update_map_stats(*_args): events.append(["stats"])
def update_map_recovery_checkpoint(*_args): events.append(["checkpoint"])
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

test('地图恢复从检查点失败格继续并仅提交该格一次统计', () => {
  const startBlock = block(mapTemplate, 'def start_map_rolling():', 'def process_single_map(')
  const result = runPython(`
import json, types
${startBlock}
events = []
grid_config = {"startX": 0, "startY": 0, "offsetX": 1, "offsetY": 1, "rows": 2, "cols": 3, "emptySlotThreshold": 1}
map_config = {"targetKind": "atlas"}
recovery_config = {
  "targetKind": "atlas", "col": 1, "row": 1,
  "processedCount": 4, "qualifiedCount": 3,
  "blacklistStats": {"反射": 2}, "whitelistStats": {"额外怪物": 1}
}
current_recovery_checkpoint = None
fatal_error_reason = None
GetClipboardSequenceNumber = None
keyboard = types.SimpleNamespace(GlobalHotKeys=lambda _mapping: types.SimpleNamespace(start=lambda: None))
time = types.SimpleNamespace(sleep=lambda _value: None)
def focus_game_window(): return True
def select_currency_stash_tab(_mode): return True
def preflight_required_currencies(): return True
def move_mouse(x, y): events.append(["move", x, y]); return True
def get_slot_position(col, row): return col, row
reads = 0
def read_current_rolling_target(*_args, **_kwargs):
    global reads
    reads += 1
    return {"category": "地图", "name": "恢复地图", "mapTier": 16} if reads == 1 else {"empty": True}
def process_single_map(_result, _x, _y): events.append(["process"]); return {"status": "completed-qualified", "qualified": True}
def count_affix_stats(_result): return {"不能回复": 1}, {"怪物群": 2}
def update_map_stats(*args): events.append(["stats", *args])
def update_map_recovery_checkpoint(*args): events.append(["checkpoint", *args])
def release_all_keys(): pass
def play_success_sound(): pass
start_map_rolling()
print(json.dumps(events, ensure_ascii=False))
`)

  assert.deepEqual(result.filter(([event]) => event === 'move')[0], ['move', 1, 1])
  assert.equal(result.filter(([event]) => event === 'process').length, 1)
  const stats = result.find(([event]) => event === 'stats')
  assert.deepEqual(stats.slice(1, 3), [5, 4])
  assert.deepEqual(stats[3], { 反射: 2, 不能回复: 1 })
  assert.deepEqual(stats[4], { 额外怪物: 1, 怪物群: 2 })
  const checkpoints = result.filter(([event]) => event === 'checkpoint')
  assert.deepEqual(checkpoints[0].slice(1, 5), [1, 1, 4, 3])
  assert.deepEqual(checkpoints[1].slice(1, 5), [2, 0, 5, 4])
})

function runSingleTarget({ method, targetKind, category, parsedResults }) {
  const helperBlock = block(mapTemplate, 'def completed_map_result(', 'def start_map_rolling():')
  const processBlock = block(mapTemplate, 'def process_single_map(', 'def read_and_parse(')
  return runPython(`
import json
${helperBlock}
${processBlock}
map_config = {"method": "${method}", "targetKind": "${targetKind}", "autoStash": False, "exalted": {"enabled": False}, "vaal": {"enabled": False}}
is_running = True
fatal_error_reason = None
CURRENCY_NAMES = {"alchemy": "点金石", "chaos": "混沌石", "scouring": "重铸石", "wisdom": "知识卷轴", "vaal": "瓦尔宝珠"}
currencies = []
copies = []
results = ${JSON.stringify(parsedResults).replaceAll('true', 'True').replaceAll('false', 'False')}
def item_matches_rolling_target(item): return item.get("category") == "${category}"
def rolling_target_label(): return "目标"
def rolling_item_level_label(_item): return "等级"
def read_and_parse(_x, _y, allow_unchanged_text=False, **_kwargs): copies.append(len(copies) + 1); return len(copies)
def wait_for_parse_result(_request_id=None): return results.pop(0)
def apply_currency(currency, _x, _y): currencies.append(currency); return True
def fill_rare_map_affixes(result, _x, _y): return {"ok": True, "result": result}
def check_map_base(item): return bool(item.get("match"))
def check_map_mods(_item): return True
def stash_item(_x, _y): return True
result = process_single_map({"category": "${category}", "rarity": "${method === 'chaos' ? '稀有' : '普通'}", "match": False}, 1, 2)
print(json.dumps({"result": result, "currencies": currencies, "copies": copies}, ensure_ascii=False))
`)
}

function runInitialTargetRead({ targetKind, category, copyResults, parsedResults }) {
  const helperBlock = block(mapTemplate, 'def completed_map_result(', 'def start_map_rolling():')
  return runPython(`
import json
${helperBlock}
map_config = {"targetKind": "${targetKind}"}
is_running = True
fatal_error_reason = None
current_recovery_checkpoint = None
copies = []
copy_results = ${JSON.stringify(copyResults).replaceAll('true', 'True').replaceAll('false', 'False')}
parsed_results = ${JSON.stringify(parsedResults).replaceAll('true', 'True').replaceAll('false', 'False')}
def read_and_parse(_x, _y, allow_unchanged_text=False, **_kwargs):
    copies.append(bool(allow_unchanged_text))
    return copy_results.pop(0)
def wait_for_parse_result(_request_id=None): return parsed_results.pop(0)
def item_matches_rolling_target(item): return item.get("category") == "${category}"
def rolling_target_label(): return "${category}"
result = read_current_rolling_target(10, 20, attempts=3, allow_unchanged_text=True, empty_on_copy_failure=True)
print(json.dumps({"result": result, "copies": copies}, ensure_ascii=False))
`)
}

for (const [targetKind, category] of [['atlas', '地图'], ['chart', '海图']]) {
  test(`${category}初始读取在前两次解析失败后由第三次恢复`, () => {
    const outcome = runInitialTargetRead({
      targetKind,
      category,
      copyResults: [1, 2, 3],
      parsedResults: [{ error: '复制结果等待超时' }, { error: '解析失败' }, { category }]
    })
    assert.equal(outcome.result.category, category)
    assert.equal(outcome.copies.length, 3)
    assert.deepEqual(outcome.copies, [true, true, true])
  })
}

test('地图初始读取三次均无法复制时才作为空格候选', () => {
  const outcome = runInitialTargetRead({
    targetKind: 'atlas',
    category: '地图',
    copyResults: [false, false, false],
    parsedResults: []
  })
  assert.deepEqual(outcome.result, { empty: true })
  assert.equal(outcome.copies.length, 3)
})

for (const [targetKind, category] of [['atlas', '地图'], ['chart', '海图']]) {
  test(`点金模式在${category}前两次解析失败后第三次恢复，不重复使用通货`, () => {
    const outcome = runSingleTarget({
      method: 'alchemy',
      targetKind,
      category,
      parsedResults: [
        { error: '等待超时' },
        { error: '等待超时' },
        { category, rarity: '稀有', match: true }
      ]
    })
    assert.deepEqual(outcome.currencies, ['alchemy'])
    assert.equal(outcome.copies.length, 3)
    assert.equal(outcome.result.status, 'completed-qualified')
  })

  test(`点金模式在${category}三次解析均失败后停留当前格且不重复使用通货`, () => {
    const outcome = runSingleTarget({
      method: 'alchemy',
      targetKind,
      category,
      parsedResults: [
        { error: '等待超时' },
        { error: '等待超时' },
        { error: '等待超时' }
      ]
    })
    assert.deepEqual(outcome.currencies, ['alchemy'])
    assert.equal(outcome.copies.length, 3)
    assert.equal(outcome.result.status, 'failed')
    assert.match(outcome.result.reason, /等待超时/)
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
