import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createPinia, setActivePinia } from 'pinia'
import { createDefaultCombatAssist, normalizeCombatAssist, validateCombatAssist } from '../src/utils/combatConfig.js'
import { useCombatStore } from '../src/stores/combat.js'

const scriptUrl = new URL('../src/assets/scripts/combat_assist_template.py', import.meta.url)
const scriptPath = fileURLToPath(scriptUrl)
const combatIpcUrl = new URL('../electron/modules/ipc/combat.js', import.meta.url)
const electronMainUrl = new URL('../electron/main.js', import.meta.url)

test('战斗辅助默认配置包含血蓝独立模式、安全限制和回城流程', () => {
  const config = createDefaultCombatAssist()
  assert.equal(config.potion.health.recoveryMode, 'duration')
  assert.equal(config.potion.mana.recoveryMode, 'duration')
  assert.deepEqual(config.potion.health.keys, ['1', '2', '3', '4', '5', 'w'])
  assert.equal(config.potion.maxTriggersPerSecond, 5)
  assert.equal(config.portal.openKey, 'Numpad1')
})

test('战斗辅助旧设置加载时补齐默认值并约束非法数值', () => {
  const config = normalizeCombatAssist({
    potion: { health: { threshold: 999, recoveryMode: 'instant', keys: ['1', '', 'w'] } },
    portal: { waitMs: -1 }
  })
  assert.equal(config.potion.health.threshold, 255)
  assert.equal(config.potion.health.recoveryMode, 'instant')
  assert.deepEqual(config.potion.health.keys, ['1', 'w'])
  assert.equal(config.portal.waitMs, 500)
})

test('战斗辅助启动校验要求启用检测项、坐标和按键序列', () => {
  const valid = createDefaultCombatAssist()
  assert.equal(validateCombatAssist(valid).isValid, true)

  const invalid = createDefaultCombatAssist()
  invalid.potion.health.enabled = false
  invalid.potion.mana.point = { x: 0, y: 0 }
  invalid.potion.mana.keys = []
  assert.deepEqual(validateCombatAssist(invalid).errors, [
    '魔力药剂检测坐标未配置',
    '魔力药剂按键序列未配置'
  ])

  invalid.potion.mana.enabled = false
  assert.match(validateCombatAssist(invalid).errors[0], /至少启用一项/)
})

test('自动喝药核心逻辑覆盖阈值、两种回复模式和频率保护', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("combat", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
results = {
  "at_threshold": module.should_trigger(60, 60, 1000, 0, "duration", 500, 100),
  "duration_wait": module.should_trigger(59, 60, 1200, 1000, "duration", 500, 100),
  "duration_ready": module.should_trigger(59, 60, 1500, 1000, "duration", 500, 100),
  "instant_ready": module.should_trigger(59, 60, 1100, 1000, "instant", 500, 100),
}
limiter = module.RateLimiter(2, 1000)
results["rate"] = [limiter.allow(0)[0], limiter.allow(100)[0], limiter.allow(200)[1], limiter.allow(500)[1], limiter.allow(1200)[0]]
print(json.dumps(results))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const values = JSON.parse(result.stdout)
  assert.equal(values.at_threshold, false)
  assert.equal(values.duration_wait, false)
  assert.equal(values.duration_ready, true)
  assert.equal(values.instant_ready, true)
  assert.deepEqual(values.rate, [true, true, 'limit', 'protected', true])
})

test('战斗辅助脚本在发送药剂和回城输入前检查游戏前台状态', () => {
  const source = readFileSync(scriptUrl, 'utf8')
  assert.doesNotMatch(source, /import mss/)
  assert.doesNotMatch(source, /from pynput/)
  assert.match(source, /gdi32\.GetPixel/)
  assert.match(source, /user32\.keybd_event/)
  assert.match(source, /if not focused:/)
  assert.match(source, /if not focused:\s*\r?\n\s*time\.sleep\(scan_interval \/ 1000\)\s*\r?\n\s*continue/)
  assert.match(source, /if not is_game_foreground\(\):[\s\S]*游戏窗口当前不在前台/)
  assert.ok(source.indexOf('send_sequence([portal.get(') < source.indexOf('click_point(point)'))
})

test('战斗辅助失焦时暂停检测和输入，回到游戏后自动继续', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("combat", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

events = []
reads = []
sends = []
trace = []
module.emit = lambda event, **payload: events.append({"event": event, **payload})
focus = iter([False, True, True])
def foreground():
    value = next(focus)
    trace.append("focus:" + str(value).lower())
    return value
def read(point):
    trace.append("read")
    reads.append(point)
    return {"r": 0, "g": 0, "b": 0}
def send(keys):
    trace.append("send")
    sends.append(keys)
    return len(keys)
def sleep(_delay):
    trace.append("sleep")
    if trace.count("sleep") >= 2:
        module.running = False
module.is_game_foreground = foreground
module.read_pixel = read
module.send_sequence = send
module.time.sleep = sleep

result = module.run_potion({"potion": {
  "scanIntervalMs": 10,
  "health": {"enabled": True, "threshold": 255, "keys": ["1"], "recoveryMode": "instant"},
  "mana": {"enabled": False}
}})
print(json.dumps({"result": result, "events": events, "reads": reads, "sends": sends, "trace": trace}, ensure_ascii=False))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const values = JSON.parse(result.stdout)
  assert.equal(values.result, 0)
  assert.deepEqual(values.trace.slice(0, 3), ['focus:false', 'sleep', 'focus:true'])
  assert.equal(values.reads.length, 1)
  assert.deepEqual(values.sends, [['1']])
  assert.equal(values.events.at(-1).event, 'stopped')
  assert.equal(values.events.some(event => event.code === 'GAME_NOT_FOREGROUND'), false)
})

test('战斗辅助在像素读取后失焦时不发送本轮药剂按键', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("combat", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

events = []
sends = []
focus = iter([True, False])
module.emit = lambda event, **payload: events.append({"event": event, **payload})
module.is_game_foreground = lambda: next(focus)
module.read_pixel = lambda _point: {"r": 0, "g": 0, "b": 0}
module.send_sequence = lambda keys: sends.append(keys) or len(keys)
module.time.sleep = lambda _delay: setattr(module, "running", False)

result = module.run_potion({"potion": {
  "scanIntervalMs": 10,
  "health": {"enabled": True, "threshold": 255, "keys": ["1", "2"], "recoveryMode": "instant"},
  "mana": {"enabled": False}
}})
print(json.dumps({"result": result, "events": events, "sends": sends}, ensure_ascii=False))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const values = JSON.parse(result.stdout)
  assert.equal(values.result, 0)
  assert.deepEqual(values.sends, [])
  assert.deepEqual(values.events.filter(event => event.event === 'focus').map(event => event.active), [true, false])
})

test('受保护按键序列在中途失焦后停止并配对释放当前键', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("combat", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

focus = iter([True, False])
events = []
sent = module.send_sequence(
  ["Enter", "Esc"],
  foreground_check=lambda: next(focus),
  key_event_sender=lambda virtual_code, scan_code, flags, extra: events.append([virtual_code, flags])
)
print(json.dumps({"sent": sent, "events": events}))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), {
    sent: 1,
    events: [[0x0D, 0], [0x0D, 0x0002]]
  })
})

test('回城等待期间失焦时不移动或点击鼠标', () => {
  const code = `
import contextlib, importlib.util, io, json, types, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("combat", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

focus = iter([True, False])
inputs = []
class User32:
    def SetCursorPos(self, x, y): inputs.append(["move", x, y])
    def mouse_event(self, flags, *_args): inputs.append(["mouse", flags])
module.ctypes = types.SimpleNamespace(windll=types.SimpleNamespace(user32=User32()))
module.is_game_foreground = lambda: next(focus)
module.send_sequence = lambda keys: inputs.append(["keys", keys]) or len(keys)
module.time.sleep = lambda _delay: None
output = io.StringIO()
with contextlib.redirect_stdout(output):
    result = module.run_portal({"portal": {"openKey": "Numpad1", "waitMs": 10, "clickPoint": {"x": 20, "y": 30}}})
print(json.dumps({"result": result, "inputs": inputs, "output": output.getvalue().strip()}))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const values = JSON.parse(result.stdout)
  assert.equal(values.result, 2)
  assert.deepEqual(values.inputs, [['keys', ['Numpad1']]])
  assert.match(JSON.parse(values.output).error, /游戏窗口当前不在前台/)
})

test('鼠标移动后失焦时不再按下鼠标', () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("combat", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

focus = iter([True, False])
events = []
clicked = module.click_point(
  {"x": 20, "y": 30},
  foreground_check=lambda: next(focus),
  cursor_setter=lambda x, y: events.append(["move", x, y]),
  mouse_event_sender=lambda flags, *_args: events.append(["mouse", flags])
)
print(json.dumps({"clicked": clicked, "events": events}))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), {
    clicked: false,
    events: [['move', 20, 30]]
  })
})

test('Store 在失焦期间保持运行，并在回焦后恢复前台状态', () => {
  const ipcSource = readFileSync(combatIpcUrl, 'utf8')
  assert.match(ipcSource, /running: true, \.\.\.JSON\.parse/)

  setActivePinia(createPinia())
  const store = useCombatStore()
  store.applyStatus({ running: true, event: 'started', processId: 42 })
  store.applyStatus({ running: true, event: 'focus', active: false })
  assert.equal(store.running, true)
  assert.equal(store.focused, false)
  assert.equal(store.processId, 42)
  assert.equal(store.lastError, '')
  store.applyStatus({ running: true, event: 'focus', active: true })
  assert.equal(store.running, true)
  assert.equal(store.focused, true)
})

test('战斗辅助使用独立进程句柄并注册退出清理', () => {
  const ipcSource = readFileSync(combatIpcUrl, 'utf8')
  const mainSource = readFileSync(electronMainUrl, 'utf8')
  assert.match(ipcSource, /let potionProcess = null/)
  assert.match(ipcSource, /let portalProcess = null/)
  assert.doesNotMatch(ipcSource, /currentScriptProcess/)
  assert.match(ipcSource, /export async function cleanupCombatProcesses\(\)/)
  assert.match(mainSource, /await cleanupCombatProcesses\(\)/)
})

test('自动喝药运行配置热加载并在损坏文件时保留最后有效配置', () => {
  const code = `
import importlib.util, json, os, tempfile, time, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("combat", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
initial = {"potion": {"scanIntervalMs": 100}}
with tempfile.TemporaryDirectory() as directory:
    path = os.path.join(directory, "combat.json")
    with open(path, "w", encoding="utf-8") as stream:
        json.dump(initial, stream)
    runtime = module.RuntimeConfig(path, initial)
    time.sleep(0.01)
    with open(path, "w", encoding="utf-8") as stream:
        json.dump({"potion": {"scanIntervalMs": 25}}, stream)
    updated = runtime.load()
    time.sleep(0.01)
    with open(path, "w", encoding="utf-8") as stream:
        stream.write("{")
    fallback = runtime.load()
    print(json.dumps({"updated": updated, "fallback": fallback}))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const payload = JSON.parse(result.stdout)
  assert.equal(payload.updated.potion.scanIntervalMs, 25)
  assert.equal(payload.fallback.potion.scanIntervalMs, 25)
})

test('自动喝药配置更新接口原子替换配置且不重启现有进程', () => {
  const ipcSource = readFileSync(combatIpcUrl, 'utf8')
  const preloadSource = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
  const apiSource = readFileSync(new URL('../src/api/electron.js', import.meta.url), 'utf8')
  const handler = ipcSource.match(/ipcMain\.handle\('combat-update-potion-config'[\s\S]*?\n  \}\)/)?.[0] || ''
  assert.match(handler, /normalizeValidPotionConfig/)
  assert.match(handler, /writeJsonAtomically/)
  assert.match(handler, /potionConfigRevision \+= 1/)
  assert.doesNotMatch(handler, /spawn\(|killPythonProcessTree/)
  assert.match(preloadSource, /updatePotionAssistConfig/)
  assert.match(apiSource, /updatePotionConfig/)
})

test('所有使用物理屏幕坐标的 Python 脚本在移动鼠标前启用 DPI 感知', () => {
  const templates = [
    scriptUrl,
    new URL('../src/assets/scripts/crafting_template.py', import.meta.url),
    new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url),
    new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url)
  ]
  for (const template of templates) {
    const source = readFileSync(template, 'utf8')
    const invocation = /(?:^|\r?\n)enable_per_monitor_dpi_awareness\(\)\r?\n/
    const invocationIndex = source.search(invocation)
    const hasDpiInvocation = invocationIndex >= 0
    const hasDpiPlaceholder = source.includes('{{DPI_AWARENESS}}')
    assert.ok(hasDpiInvocation || hasDpiPlaceholder,
      `${template.pathname} 缺少 DPI 感知调用 (需包含直接调用或 {{DPI_AWARENESS}} 占位符)`)
    if (hasDpiInvocation) {
      assert.ok(
        invocationIndex < source.indexOf('SetCursorPos'),
        `${template.pathname} 在鼠标 API 初始化后才设置 DPI 感知`
      )
    }
  }
})

test('战斗辅助子进程实际运行于 Per-Monitor DPI Aware 模式', () => {
  const code = `
import ctypes, importlib.util, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("combat", ${JSON.stringify(scriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
user32 = ctypes.windll.user32
user32.GetThreadDpiAwarenessContext.restype = ctypes.c_void_p
user32.GetAwarenessFromDpiAwarenessContext.argtypes = [ctypes.c_void_p]
user32.GetAwarenessFromDpiAwarenessContext.restype = ctypes.c_int
print(user32.GetAwarenessFromDpiAwarenessContext(user32.GetThreadDpiAwarenessContext()))
`
  const result = spawnSync('python', ['-c', code], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), '2')
})
