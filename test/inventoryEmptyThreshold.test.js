import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { pythonPath } from './helpers/python.js'
import {
  EMPTY_SLOT_THRESHOLD,
  normalizeEmptySlotThreshold
} from '../src/utils/inventorySettings.js'
import { buildBagRuntimeConfig } from '../src/utils/bagConfig.js'

const source = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const mapTemplate = source('../src/assets/scripts/map_rolling_template.py')

function runMapScan(emptySlotThreshold, statuses, cols = 8) {
  const start = mapTemplate.indexOf('def start_map_rolling():')
  const end = mapTemplate.indexOf('def process_single_map(')
  const block = mapTemplate.slice(start, end)
  const code = `
import json, types
${block}
grid_config = {"startX": 0, "startY": 0, "offsetX": 1, "offsetY": 1, "rows": 1, "cols": ${cols}, "emptySlotThreshold": ${emptySlotThreshold}}
map_config = {}
fatal_error_reason = None
GetClipboardSequenceNumber = None
keyboard = types.SimpleNamespace(GlobalHotKeys=lambda mapping: types.SimpleNamespace(start=lambda: None))
pyperclip = types.SimpleNamespace(paste=lambda: "Item Class: Maps")
time = types.SimpleNamespace(sleep=lambda value: None)
statuses = iter(${JSON.stringify(statuses).replaceAll('true', 'True').replaceAll('false', 'False')})
moves = []
def move_mouse(x, y): moves.append([x, y]); return True
def focus_game_window(): return True
def select_currency_stash_tab(mode): return True
def preflight_required_currencies(): return True
def get_slot_position(col, row): return col, row
def read_clipboard_to_file(): return next(statuses)
def wait_for_parse_result(_request_id=None): return {"category": "地图", "name": "测试地图", "mapTier": 1}
def process_single_map(result, x, y): return {"status": "completed-qualified", "qualified": True}
def count_affix_stats(result): return {}, {}
def update_map_stats(*args): pass
def release_all_keys(): pass
def play_success_sound(): pass
def play_error_sound(): pass
start_map_rolling()
print(json.dumps(moves))
`
  const result = spawnSync(pythonPath, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

test('连续空格阈值使用默认值、取整并限制在 1–60', () => {
  assert.deepEqual(EMPTY_SLOT_THRESHOLD, { min: 1, max: 60, default: 3 })
  assert.equal(normalizeEmptySlotThreshold(undefined), 3)
  assert.equal(normalizeEmptySlotThreshold('invalid'), 3)
  assert.equal(normalizeEmptySlotThreshold(0), 1)
  assert.equal(normalizeEmptySlotThreshold(8.9), 8)
  assert.equal(normalizeEmptySlotThreshold(99), 60)
})

test('设置页持久化共享阈值并支持旧值补全和重置', () => {
  const view = source('../src/domains/settings/SettingsView.vue')
  const store = source('../src/domains/settings/settingsStore.js')
  assert.match(view, /label="连续空格停止数量"/)
  assert.match(view, /:min="EMPTY_SLOT_THRESHOLD\.min"/)
  assert.match(view, /:max="EMPTY_SLOT_THRESHOLD\.max"/)
  assert.match(store, /emptySlotThreshold: EMPTY_SLOT_THRESHOLD\.default/)
  assert.match(store, /normalizeEmptySlotThreshold\(data\.inventory\.emptySlotThreshold\)/)
  assert.equal((store.match(/bag\.updateEmptySlotThreshold\(inventory\.value\.emptySlotThreshold\)/g) || []).length, 2)
})

test('地图和自动入库运行配置使用规范化后的共享阈值', () => {
  const config = buildBagRuntimeConfig({}, {
    inventory: {
      startPos: { x: 10, y: 20 },
      slotSize: { w: 30, h: 40 },
      emptySlotThreshold: 7.8
    }
  })
  assert.equal(config.inventory.emptySlotThreshold, 7)

  const generator = source('../src/utils/python.js')
  assert.match(generator, /emptySlotThreshold: normalizeEmptySlotThreshold\(inventory\?\.emptySlotThreshold\)/)
})

test('地图扫描按阈值结束，成功复制会打断零散空格计数', () => {
  assert.deepEqual(runMapScan(3, [false, false, true, false, false, false, true]), [
    [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]
  ])
  assert.deepEqual(runMapScan(1, [false, true]), [[0, 0]])
  assert.deepEqual(runMapScan(4, [false, false, false, false, true]), [
    [0, 0], [1, 0], [2, 0], [3, 0]
  ])
})

test('连续空格阈值运行时同步只更新下一轮配置', () => {
  const ipc = source('../electron/modules/ipc/bag.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const handler = ipc.match(/ipcMain\.handle\('update-bag-empty-slot-threshold'[\s\S]*?\n  \}\)/)?.[0] || ''
  assert.match(handler, /normalizeEmptySlotThreshold\(value\)/)
  assert.match(handler, /latestConfig\.inventory\.emptySlotThreshold = emptySlotThreshold/)
  assert.doesNotMatch(handler, /startDetectionProcess|session\.reset/)
  assert.match(preload, /updateBagEmptySlotThreshold/)
  assert.match(api, /updateEmptySlotThreshold/)
  assert.match(api, /updateEmptySlotThreshold: \(emptySlotThreshold\) => Promise\.resolve/)
})
