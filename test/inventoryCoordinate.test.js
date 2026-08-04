import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { pythonPath } from './helpers/python.js'

const bagScriptPath = fileURLToPath(new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url))
const mapTemplate = readFileSync(new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url), 'utf8')

test('地图网格直接使用首格中心和相邻中心间距', () => {
  const start = mapTemplate.indexOf('def get_slot_position(col, row):')
  const end = mapTemplate.indexOf('def stash_item(x, y):')
  const block = mapTemplate.slice(start, end)
  const script = `${block}\ngrid_config = {"startX": 2604, "startY": 1155, "offsetX": 100, "offsetY": 100}\nprint(get_slot_position(0, 0), get_slot_position(1, 1), get_slot_position(11, 4))\n`
  const result = spawnSync(pythonPath, ['-c', script], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), '(2604, 1155) (2704, 1255) (3704, 1555)')
})

test('自动入库遍历与地图制作使用同一中心坐标公式', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(bagScriptPath)})
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
module.run_stash({"inventory": {"startPos": {"x": 2604, "y": 1155}, "slotSize": {"w": 100, "h": 100}}})
print(json.dumps([Controller.moves[0], Controller.moves[1], Controller.moves[5], Controller.moves[-1]]))
`
  const result = spawnSync(pythonPath, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const summary = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
  assert.deepEqual(summary, [[2604, 1155], [2604, 1255], [2704, 1155], [3704, 1555]])
})

test('设置页明确要求首格中心坐标', () => {
  const view = readFileSync(new URL('../src/domains/settings/SettingsView.vue', import.meta.url), 'utf8')
  assert.match(view, /背包第一个格子（左上角）的中心坐标/)
})
