import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptUrl = new URL('../src/assets/scripts/chaos_recipe_pick_template.py', import.meta.url)
const scriptPath = fileURLToPath(scriptUrl)

test('取件脚本解析中英文稀有物品并校验等级和基底', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("recipe", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
cn = module.parse_item("稀 有 度: 稀有\\n龙鳞胸甲\\n--------\\n物品等级: 71")
en = module.parse_item("Rarity: Rare\\nHubris Circlet\\n--------\\nItem Level: 73")
print(json.dumps([
  module.matches(cn, {"itemLevel": 71, "baseType": "龙鳞胸甲"}),
  module.matches(en, {"itemLevel": 73, "baseType": "Hubris Circlet"}),
  module.matches(cn, {"itemLevel": 72, "baseType": "龙鳞胸甲"})
], ensure_ascii=False))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const values = JSON.parse(result.stdout)
  assert.deepEqual(values[0], [true, ''])
  assert.deepEqual(values[1], [true, ''])
  assert.deepEqual(values[2], [false, '物品等级与仓库快照不一致'])
})

test('取件脚本每件物品均先检查前台、界面、坐标和剪贴板再点击', () => {
  const source = readFileSync(scriptUrl, 'utf8')
  const loop = source.slice(source.indexOf('for index, expected'))
  assert.ok(source.indexOf('if not focus_game_window():') < source.indexOf('for index, expected'))
  const foreground = loop.indexOf('is_game_foreground()')
  const interfaceCheck = loop.indexOf('matcher.ready()')
  const move = loop.indexOf('CONTROLLER.move')
  const copy = loop.indexOf('CONTROLLER.copy_item()')
  const validate = loop.indexOf('matches(parse_item')
  const click = loop.indexOf('CONTROLLER.ctrl_click()')
  assert.ok(foreground < interfaceCheck && interfaceCheck < move)
  assert.ok(move < copy && copy < validate && validate < click)
  assert.match(source, /release_all\(\)/)
  assert.match(source, /signal\.signal\(signal\.SIGTERM/)
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
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
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

test('打包配置包含取件脚本、GPL 许可证和第三方归属', () => {
  const packageConfig = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(packageConfig.license, 'GPL-3.0-or-later')
  assert.ok(packageConfig.build.extraResources.some((entry) => entry.to === 'chaos_recipe_pick_template.py'))
  assert.ok(packageConfig.build.files.includes('LICENSE.md'))
  assert.ok(packageConfig.build.files.includes('THIRD_PARTY_NOTICES.md'))
})
