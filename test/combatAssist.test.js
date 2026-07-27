import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createDefaultCombatAssist, normalizeCombatAssist, validateCombatAssist } from '../src/utils/combatConfig.js'

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
  assert.match(source, /if not is_game_foreground\(\):[\s\S]*游戏窗口当前不在前台/)
  assert.ok(source.indexOf('send_sequence([portal.get(') < source.indexOf('user32.mouse_event(0x0002'))
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

test('所有使用物理屏幕坐标的 Python 脚本在移动鼠标前启用 DPI 感知', () => {
  const templates = [
    scriptUrl,
    new URL('../src/assets/scripts/crafting_template.py', import.meta.url),
    new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url),
    new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url)
  ]
  for (const template of templates) {
    const source = readFileSync(template, 'utf8')
    const invocation = '\nenable_per_monitor_dpi_awareness()\n'
    const hasDpiInvocation = source.includes(invocation)
    const hasDpiPlaceholder = source.includes('{{DPI_AWARENESS}}')
    assert.ok(hasDpiInvocation || hasDpiPlaceholder,
      `${template.pathname} 缺少 DPI 感知调用 (需包含直接调用或 {{DPI_AWARENESS}} 占位符)`)
    if (hasDpiInvocation) {
      assert.ok(
        source.indexOf(invocation) < source.indexOf('SetCursorPos'),
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
