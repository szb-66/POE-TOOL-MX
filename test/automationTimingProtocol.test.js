import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = relative => readFileSync(path.join(projectRoot, relative), 'utf8')
const bundledPython = path.join(projectRoot, '.runtime', 'python-runtime', 'python.exe')
const python = existsSync(bundledPython) ? bundledPython : 'python'

function runPython(code) {
  const result = spawnSync(python, ['-c', code], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1' }
  })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

test('所有游戏输入链路把完整协议送到实际 Python 脚本', () => {
  const consumers = [
    ['electron/modules/ipc/bag.js', /pythonAutomationTiming\(config\)/],
    ['electron/modules/stashPickup/manager.js', /pythonAutomationTiming\(this\.runtime\)/],
    ['electron/modules/junfeng/manager.js', /pythonAutomationTiming\(this\.runtime\)/],
    ['electron/modules/chaosRecipe/automation.js', /pythonAutomationTiming\(this\.config\)/],
    ['electron/modules/puzzle/service.js', /pythonAutomationTiming\(\{ operationDelayMs, fixedTiming \}\)/],
    ['electron/modules/ipc/combat.js', /pythonAutomationTiming\(payload\.automationTiming\)/],
    ['src/utils/python.js', /pythonAutomationTiming\(normalizedTiming\)/]
  ]
  for (const [file, pattern] of consumers) assert.match(source(file), pattern, file)

  for (const file of [
    'src/assets/scripts/bag_auto_stash_template.py',
    'src/assets/scripts/chaos_recipe_pick_template.py',
    'src/assets/scripts/junfeng_highlight_pickup.py',
    'src/assets/scripts/stash_tab_selector.py',
    'src/assets/scripts/puzzle_auto_place.py',
    'src/assets/scripts/combat_assist_template.py'
  ]) {
    const content = source(file)
    assert.match(content, /operation_delay_ms/, `${file} 未读取悬停配置`)
    assert.match(content, /fixed_timing/, `${file} 未读取物理输入配置`)
  }
})

test('0ms、自定义值和大值不经过隐藏下限，君锋复用同一控制器', { skip: !existsSync(bundledPython) }, () => {
  const bagPath = path.join(projectRoot, 'src', 'assets', 'scripts', 'bag_auto_stash_template.py')
  const junfeng = source('src/assets/scripts/junfeng_highlight_pickup.py')
  const result = runPython(`
import importlib.util, json, types
spec=importlib.util.spec_from_file_location("bag", ${JSON.stringify(bagPath)})
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.mouse=types.SimpleNamespace(Controller=lambda:object())
m.keyboard=types.SimpleNamespace(Controller=lambda:object())
values=[]
for delay in (0,137,9000):
 c=m.InputController({"operation_delay_ms":delay,"fixed_timing":{"clipboard_confirm_ms":10}})
 values.append([c.mouse_move_delay,c.clipboard_delay])
print(json.dumps(values))
`)
  assert.deepEqual(result, [[0, 0.01], [0.137, 0.01], [9, 0.01]])
  assert.match(junfeng, /InputController\(config\)/)
  assert.match(junfeng, /normalize_operation_delay\(config\.get\("operation_delay_ms"\)\)/)
})

test('动作边界禁止重新引入裸数字等待或旧字段', () => {
  const forbiddenByFile = new Map([
    ['src/assets/scripts/puzzle_auto_place.py', [/POINTER_SETTLE_MIN_SECONDS/, /BUTTON_HOLD_MIN_SECONDS/, /operationDelayMs/, /max\(delay,\s*0\./]],
    ['src/assets/scripts/stash_pickup_template.py', [/operationDelayMs/, /max\(0\.02/, /max\(0\.08/]],
    ['src/assets/scripts/chaos_recipe_pick_template.py', [/self\.delay\s*=\s*max\(0\.02/, /self\.delay\s*\*\s*4/]],
    ['src/assets/scripts/stash_tab_selector.py', [/SCROLL_DELAY_SECONDS/, /mouse\.click\(/]],
    ['src/assets/scripts/map_rolling_template.py', [/TIMING_MODE/, /ADAPTIVE_TIMEOUT/, /clipboard_read_delay/]],
    ['src/assets/scripts/crafting_template.py', [/clipboard_read_delay/]],
    ['src/utils/python.js', [/time\.sleep\(0\.05\)/, /DELAY_CLIPBOARD/]]
  ])
  for (const [file, patterns] of forbiddenByFile) {
    const content = source(file)
    for (const pattern of patterns) assert.doesNotMatch(content, pattern, `${file}: ${pattern}`)
  }

  for (const file of ['src', 'electron', 'shared']) {
    assert.doesNotMatch(sourceTree(file), /adaptiveTiming|adaptiveTimeoutMs|timing_mode|adaptive_timeout_ms/, file)
  }
})

function sourceTree(relativeDirectory) {
  const root = path.join(projectRoot, relativeDirectory)
  return readdirSync(root, { recursive: true })
    .filter(entry => /\.(?:js|cjs|vue|py)$/.test(entry) && statSync(path.join(root, entry)).isFile())
    .map(entry => source(path.join(relativeDirectory, entry)))
    .join('\n')
}
