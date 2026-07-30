import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const mapTemplate = readFileSync(
  new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url),
  'utf8'
)

function runMapStart(focusResult) {
  const start = mapTemplate.indexOf('def start_map_rolling():')
  const end = mapTemplate.indexOf('def process_single_map(')
  const block = mapTemplate.slice(start, end)
  const code = `
import json, types
${block}
events = []
grid_config = {"startX": 0, "startY": 0, "offsetX": 1, "offsetY": 1, "rows": 1, "cols": 1, "emptySlotThreshold": 1}
map_config = {}
fatal_error_reason = None
GetClipboardSequenceNumber = None
keyboard = types.SimpleNamespace(GlobalHotKeys=lambda mapping: types.SimpleNamespace(start=lambda: None))
pyperclip = types.SimpleNamespace(paste=lambda: "")
time = types.SimpleNamespace(sleep=lambda value: None)
def focus_game_window(): events.append("focus"); return ${focusResult ? 'True' : 'False'}
def preflight_required_currencies(): events.append("preflight"); return True
def move_mouse(x, y): events.append("move"); return True
def get_slot_position(col, row): return col, row
def read_clipboard_to_file(): events.append("copy"); return False
def wait_for_parse_result(): return {"error": "unexpected"}
def process_single_map(result, x, y): return True
def count_affix_stats(result): return {}, {}
def update_map_stats(*args): pass
def release_all_keys(): pass
def play_success_sound(): pass
start_map_rolling()
print(json.dumps(events))
`
  const result = spawnSync('python', ['-c', code], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(result.status, 0, result.stderr)
  return {
    events: JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1)),
    output: result.stdout
  }
}

test('地图洗练从应用启动时先保障游戏前台，再执行鼠标与复制操作', () => {
  const result = runMapStart(true)
  assert.deepEqual(result.events, ['focus', 'preflight', 'move', 'copy'])
})

test('地图洗练使用 Win32 查找、恢复、激活并验证中英文游戏窗口', () => {
  assert.match(mapTemplate, /GAME_WINDOW_TITLES = \("流放之路", "Path of Exile"\)/)
  assert.match(mapTemplate, /def find_game_window\(\):[\s\S]*user32\.EnumWindows/)
  assert.match(mapTemplate, /user32\.IsIconic\(hwnd\)[\s\S]*user32\.ShowWindow\(hwnd, 9\)/)
  assert.match(mapTemplate, /user32\.BringWindowToTop\(hwnd\)/)
  assert.match(mapTemplate, /user32\.SetForegroundWindow\(hwnd\)/)
  assert.match(mapTemplate, /while is_running[\s\S]*is_game_foreground\(\)/)

  const start = mapTemplate.indexOf('def start_map_rolling():')
  const focus = mapTemplate.indexOf('if not focus_game_window():', start)
  const scan = mapTemplate.indexOf('while is_running and current_col', start)
  assert.ok(start < focus && focus < scan)
})

test('地图洗练无法激活游戏时安全停止，不进入鼠标和剪贴板判空流程', () => {
  const result = runMapStart(false)
  assert.deepEqual(result.events, ['focus'])
  assert.match(result.output, /无法激活游戏窗口/)
  assert.doesNotMatch(result.output, /连续空格候选/)
})
