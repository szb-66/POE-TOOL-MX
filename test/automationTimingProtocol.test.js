import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
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
    ['electron/modules/puzzle/service.js', /pythonAutomationTiming\(\{ operationDelayMs, adaptiveTiming, adaptiveTimeoutMs, fixedTiming \}\)/],
    ['electron/modules/ipc/combat.js', /pythonAutomationTiming\(payload\.automationTiming\)/],
    ['src/utils/python.js', /pythonAutomationTiming\(normalizedTiming\)/]
  ]
  for (const [file, pattern] of consumers) assert.match(source(file), pattern, file)

  for (const file of [
    'src/assets/scripts/bag_auto_stash_template.py',
    'src/assets/scripts/chaos_recipe_pick_template.py',
    'src/assets/scripts/stash_pickup_template.py',
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

test('伪时钟验证仓库画面等待可提前成功并精确达到统一上限', { skip: !existsSync(bundledPython) }, () => {
  const scriptPath = path.join(projectRoot, 'src', 'assets', 'scripts', 'stash_pickup_template.py')
  const result = runPython(`
import importlib.util, json, numpy as np
spec=importlib.util.spec_from_file_location("stash", ${JSON.stringify(scriptPath)})
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.require_game_foreground=lambda: None
before=np.zeros((2,2,3),dtype=np.uint8)
candidate={"column":0,"row":0}
class Clock:
 def __init__(self): self.value=0.0
 def monotonic(self): return self.value
 def sleep(self,value): self.value += value
def execute(change_after, timeout):
 clock=Clock();m.time.monotonic=clock.monotonic;m.time.sleep=clock.sleep
 calls={"value":0}
 def grab(_rect,_grabber):
  calls["value"] += 1
  return np.ones((2,2,3),dtype=np.uint8)*20 if calls["value"] >= change_after else before
 m.capture=grab;m.local_patch=lambda image,*args:image
 found=m.wait_for_patch_change(before,{},1,candidate,1,None,timeout)
 return round(clock.value,3), found is not None
print(json.dumps({"early":execute(2,3.0),"timeout":execute(999,0.37)}))
`)
  assert.deepEqual(result.early, [0.01, true])
  assert.deepEqual(result.timeout, [0.37, false])
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
 c=m.InputController({"operation_delay_ms":delay,"timing_mode":"adaptive","adaptive_timeout_ms":2468})
 values.append([c.mouse_move_delay,c.clipboard_delay])
print(json.dumps(values))
`)
  assert.deepEqual(result, [[0, 2.468], [0.137, 2.468], [9, 2.468]])
  assert.match(junfeng, /InputController\(config\)/)
  assert.match(junfeng, /normalize_operation_delay\(config\.get\("operation_delay_ms"\)\)/)
})

test('动作边界禁止重新引入裸数字等待或旧字段', () => {
  const forbiddenByFile = new Map([
    ['src/assets/scripts/puzzle_auto_place.py', [/POINTER_SETTLE_MIN_SECONDS/, /BUTTON_HOLD_MIN_SECONDS/, /operationDelayMs/, /max\(delay,\s*0\./]],
    ['src/assets/scripts/stash_pickup_template.py', [/operationDelayMs/, /max\(0\.02/, /max\(0\.08/]],
    ['src/assets/scripts/chaos_recipe_pick_template.py', [/self\.delay\s*=\s*max\(0\.02/, /self\.delay\s*\*\s*4/]],
    ['src/assets/scripts/stash_tab_selector.py', [/SCROLL_DELAY_SECONDS/, /mouse\.click\(/]],
    ['src/assets/scripts/map_rolling_template.py', [/time\.sleep\(0\.05 if TIMING_MODE/, /clipboard_read_delay/]],
    ['src/assets/scripts/crafting_template.py', [/clipboard_read_delay/]],
    ['src/utils/python.js', [/time\.sleep\(0\.05\)/, /DELAY_CLIPBOARD/]]
  ])
  for (const [file, patterns] of forbiddenByFile) {
    const content = source(file)
    for (const pattern of patterns) assert.doesNotMatch(content, pattern, `${file}: ${pattern}`)
  }
})
