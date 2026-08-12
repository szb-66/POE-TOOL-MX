import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runPython } from './helpers/python.js'
import {
  ADAPTIVE_TIMING,
  normalizeAdaptiveTimeoutMs,
  normalizeAdaptiveTiming,
  normalizeAutomationTiming,
  normalizeFixedTiming,
  pythonAutomationTiming,
  pythonFixedTiming
} from '../src/utils/operationDelay.js'
import { buildBagRuntimeConfig } from '../src/utils/bagConfig.js'

const source = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')
const scriptUrl = new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url)
const bagScriptPath = fileURLToPath(scriptUrl)
const chaosScriptUrl = new URL('../src/assets/scripts/chaos_recipe_pick_template.py', import.meta.url)
const chaosScriptPath = fileURLToPath(chaosScriptUrl)

test('自适应常量默认值与归一化：旧配置默认开启、超时由用户自由设置', () => {
  assert.deepEqual(ADAPTIVE_TIMING, { default: true, timeoutDefault: 1000 })
  assert.equal(normalizeAdaptiveTiming(undefined), true)
  assert.equal(normalizeAdaptiveTiming(null), true)
  assert.equal(normalizeAdaptiveTiming(false), false)
  assert.equal(normalizeAdaptiveTiming(true), true)
  assert.equal(normalizeAdaptiveTimeoutMs(undefined), 1000)
  assert.equal(normalizeAdaptiveTimeoutMs(null), 1000)
  assert.equal(normalizeAdaptiveTimeoutMs(''), 1000)
  assert.equal(normalizeAdaptiveTimeoutMs(-1), 1000)
  assert.equal(normalizeAdaptiveTimeoutMs(0), 0)
  assert.equal(normalizeAdaptiveTimeoutMs(100), 100)
  assert.equal(normalizeAdaptiveTimeoutMs(5000), 5000)
  assert.equal(normalizeAdaptiveTimeoutMs(12.5), 12.5)
  assert.equal(normalizeAdaptiveTimeoutMs(1500), 1500)
})

test('完整自动化时序一次规范化并转换为 Python 协议', () => {
  assert.deepEqual(normalizeAutomationTiming({
    operationDelayMs: 0,
    adaptiveTiming: false,
    adaptiveTimeoutMs: 2500,
    fixedTiming: { buttonHoldMs: 7 }
  }), {
    operationDelayMs: 0,
    adaptiveTiming: false,
    adaptiveTimeoutMs: 2500,
    fixedTiming: {
      modifierSettleMs: 50, keyHoldMs: 20, buttonHoldMs: 7, releaseSettleMs: 20,
      clipboardConfirmMs: 250, stashTabSettleMs: 250, stashSettleMs: 200, patchVerifyMs: 550
    }
  })
  assert.deepEqual(pythonAutomationTiming({ operationDelayMs: 125, adaptiveTimeoutMs: 900 }), {
    operation_delay_ms: 125,
    timing_mode: 'adaptive',
    adaptive_timeout_ms: 900,
    fixed_timing: {
      modifier_settle_ms: 50, key_hold_ms: 20, button_hold_ms: 20, release_settle_ms: 20,
      clipboard_confirm_ms: 250, stash_tab_settle_ms: 250, stash_settle_ms: 200, patch_verify_ms: 550
    }
  })
})

test('设置 store 持久化自适应字段并在加载/重置时归一化', () => {
  const store = source('../src/domains/settings/settingsStore.js')
  assert.match(store, /const adaptiveTiming = ref\(ADAPTIVE_TIMING\.default\)/)
  assert.match(store, /const adaptiveTimeoutMs = ref\(ADAPTIVE_TIMING\.timeoutDefault\)/)
  assert.match(store, /adaptiveTiming: adaptiveTiming\.value/)
  assert.match(store, /adaptiveTimeoutMs: adaptiveTimeoutMs\.value/)
  assert.match(store, /adaptiveTiming\.value = normalizeAdaptiveTiming\(data\.adaptiveTiming\)/)
  assert.match(store, /adaptiveTimeoutMs\.value = normalizeAdaptiveTimeoutMs\(data\.adaptiveTimeoutMs\)/)
  assert.match(store, /adaptiveTiming\.value = ADAPTIVE_TIMING\.default/)
  assert.match(store, /adaptiveTimeoutMs\.value = ADAPTIVE_TIMING\.timeoutDefault/)
  assert.match(store, /updateAdaptiveTiming,/)
  assert.match(store, /updateAdaptiveTimeoutMs,/)
})

test('设置页保存自适应配置到 settingsStore，不再经背包运行时', () => {
  const view = source('../src/domains/settings/SettingsView.vue')
  assert.match(view, /v-model="adaptiveTiming"/)
  assert.match(view, /v-model="adaptiveTimeoutMs"/)
  assert.match(view, /settingsStore\.updateAdaptiveTiming\(value\)/)
  assert.match(view, /settingsStore\.updateAdaptiveTimeoutMs\(value\)/)
  assert.doesNotMatch(view, /updateBagRuntimeConfig\(\{ adaptiveTiming|updateBagRuntimeConfig\(\{ adaptiveTimeoutMs/)
  assert.doesNotMatch(view, /OPERATION_DELAY\.(?:min|max)/)
  assert.doesNotMatch(view, /ADAPTIVE_TIMING\.(?:timeoutMin|timeoutMax)/)
  assert.doesNotMatch(view, /:min="field\.min"|:max="field\.max"/)

  const bagService = source('../src/utils/bagService.js')
  assert.match(bagService, /adaptiveTiming: adaptiveTiming \?\? settingsStore\.adaptiveTiming/)
  assert.match(bagService, /adaptiveTimeoutMs: adaptiveTimeoutMs \?\? settingsStore\.adaptiveTimeoutMs/)

  const runtime = buildBagRuntimeConfig({ moduleEnabled: true, templates: {}, blacklist: [] }, {
    operationDelayMs: 80,
    adaptiveTiming: true,
    adaptiveTimeoutMs: 1500
  })
  assert.equal(runtime.adaptiveTiming, true)
  assert.equal(runtime.adaptiveTimeoutMs, 1500)
})

test('背包运行时配置输出完整 Python 时序协议', () => {
  const ipc = source('../electron/modules/ipc/bag.js')
  assert.match(ipc, /pythonAutomationTiming\(config\)/)
})

test('背包脚本剪贴板等待自适应时使用统一上限，悬停保持独立值', () => {
  const code = `
import importlib.util, json, sys, types
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(bagScriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.mouse = types.SimpleNamespace(Controller=lambda: object())
module.keyboard = types.SimpleNamespace(Controller=lambda: object())
controller = module.InputController({"operation_delay_ms": 180, "timing_mode": "adaptive", "adaptive_timeout_ms": 3000})
print(json.dumps([controller.clipboard_delay, controller.mouse_move_delay]))
`
  assert.deepEqual(runPython(code), [3, 0.18])
})

test('混沌配方脚本剪贴板等待不再由悬停时间派生', () => {
  const code = `
import importlib.util, json, sys, types
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("chaos", ${JSON.stringify(chaosScriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.mouse = types.SimpleNamespace(Controller=lambda: object())
module.keyboard = types.SimpleNamespace(Controller=lambda: object())
normal = module.InputController({"operation_delay_ms": 80, "timing_mode": "fixed", "fixed_timing": {"clipboard_confirm_ms": 250}})
slow = module.InputController({"operation_delay_ms": 180, "timing_mode": "adaptive", "adaptive_timeout_ms": 900})
print(json.dumps([round(normal.clipboard_timeout, 6), round(slow.clipboard_timeout, 6)]))
`
  assert.deepEqual(runPython(code), [0.25, 0.9])
})

test('制作与地图剪贴板确认在自适应模式使用统一上限', () => {
  for (const relative of [
    '../src/assets/scripts/crafting_template.py',
    '../src/assets/scripts/map_rolling_template.py'
  ]) {
    const content = source(relative)
    assert.match(content, /wait_for_clipboard_change\(before_seq, before_text, ADAPTIVE_TIMEOUT_SECONDS, allow_unchanged_text\)/)
    assert.match(content, /time\.sleep\(CLIPBOARD_RESPONSE_MIN_SECONDS\)/)
    assert.match(content, /ADAPTIVE_TIMEOUT_SECONDS = float\(\{\{ADAPTIVE_TIMEOUT_MS\}\}\) \/ 1000\.0/)
    assert.match(content, /TIMING_MODE = "{{TIMING_MODE}}"/)
    assert.match(content, /def wait_for_clipboard_change\(before_seq, before_text, timeout_seconds, allow_unchanged_text=False\):/)
  }
})

test('海图放置脚本无隐藏输入下限并由统一验证时序兜底', () => {
  const content = source('../src/assets/scripts/puzzle_auto_place.py')
  assert.match(content, /timing_mode = config\.get\("timing_mode", "adaptive"\)/)
  assert.match(content, /adaptive_timeout_ms = float\(config\.get\("adaptive_timeout_ms", 1000\)\)/)
  assert.match(content, /delay = max\(0\.0, float\(config\.get\("operation_delay_ms", 50\)\) \/ 1000\)/)
  assert.match(content, /time\.sleep\(button_hold_seconds\)/)
  assert.match(content, /time\.sleep\(patch_verify_seconds\)/)
  assert.doesNotMatch(content, /POINTER_SETTLE_MIN_SECONDS|BUTTON_HOLD_MIN_SECONDS|operationDelayMs/)
  assert.match(content, /deadline = time\.monotonic\(\) \+ \(adaptive_timeout_ms \/ 1000\.0\) if timing_mode == "adaptive" else None/)
})

test('海图服务端与前端传递自适应配置', () => {
  const service = source('../electron/modules/puzzle/service.js')
  assert.match(service, /adaptiveTiming = true, adaptiveTimeoutMs = 1000, fixedTiming = \{\}/)
  assert.match(service, /pythonAutomationTiming\(\{ operationDelayMs, adaptiveTiming, adaptiveTimeoutMs, fixedTiming \}\)/)

  const store = source('../src/stores/puzzle.js')
  assert.match(store, /async function startAutoPlacement\(timing = \{ operationDelayMs: OPERATION_DELAY\.default \}\)/)
  assert.match(store, /\{ \.\.\.executionPayload\(\), \.\.\.timing \}/)

  const view = source('../src/domains/puzzle/PuzzleView.vue')
  assert.match(view, /settingsStore\.adaptiveTiming/)
  assert.match(view, /settingsStore\.adaptiveTimeoutMs/)
  assert.match(view, /fixedTiming: settingsStore\.fixedTiming/)
})

test('制作和洗图把完整时序快照写入仓库页签选择器配置', () => {
  const generator = source('../src/utils/python.js')
  assert.equal((generator.match(/\.\.\.pythonAutomationTiming\(normalizedTiming\)/g) || []).length, 2)
  assert.equal((generator.match(/JSON\.stringify\(JSON\.stringify\(normalizedStashTabSelection\)\)/g) || []).length, 2)
})

test('混沌配方与仓库取件都传递完整自适应字段', () => {
  const automation = source('../electron/modules/chaosRecipe/automation.js')
  assert.match(automation, /pythonAutomationTiming\(this\.config\)/)

  const ipc = source('../electron/modules/ipc/chaosRecipe.js')
  assert.match(ipc, /adaptiveTiming: request\.adaptiveTiming/)
  assert.match(ipc, /adaptiveTimeoutMs: request\.adaptiveTimeoutMs/)

  const service = source('../src/utils/chaosRecipeService.js')
  assert.match(service, /adaptiveTiming: settingsStore\.adaptiveTiming/)
  assert.match(service, /adaptiveTimeoutMs: settingsStore\.adaptiveTimeoutMs/)

  const manager = source('../electron/modules/stashPickup/manager.js')
  assert.match(manager, /pythonAutomationTiming\(this\.runtime\)/)

  const store = source('../src/stores/stashPickup.js')
  assert.match(store, /adaptiveTiming: settingsStore\.adaptiveTiming/)
  assert.match(store, /adaptiveTimeoutMs: settingsStore\.adaptiveTimeoutMs/)
  assert.match(store, /operationDelayMs: settingsStore\.operationDelayMs/)
})

test('制作与地图启动把自适应配置传入脚本生成器', () => {
  const scriptService = source('../src/utils/scriptService.js')
  assert.equal((scriptService.match(/adaptiveTiming: settingsStore\.adaptiveTiming/g) || []).length, 2)
  assert.equal((scriptService.match(/adaptiveTimeoutMs: settingsStore\.adaptiveTimeoutMs/g) || []).length, 2)
})

test('战斗辅助启动与长期进程热更新使用完整时序协议', () => {
  const service = source('../src/utils/combatService.js')
  assert.equal((service.match(/automationTiming: \{/g) || []).length, 3)
  for (const field of ['operationDelayMs', 'adaptiveTiming', 'adaptiveTimeoutMs', 'fixedTiming']) {
    assert.equal((service.match(new RegExp(`${field}: settings\\.${field}`, 'g')) || []).length, 3)
  }

  const combat = source('../electron/modules/ipc/combat.js')
  assert.match(combat, /export function updateCombatAutomationTiming/)
  assert.match(combat, /writeJsonAtomically\(configPath, combatRuntimeConfig\(config, candidate\)\)/)
  assert.match(combat, /writeJsonAtomically\(configPath, combatRuntimeConfig\(config, previous\)\)/)

  const ipc = source('../electron/modules/ipc/index.js')
  assert.match(ipc, /updateCombatTiming: updateCombatAutomationTiming/)
})

test('固定时序配置保留任意非负有限值', () => {
  assert.deepEqual(normalizeFixedTiming(), {
    modifierSettleMs: 50, keyHoldMs: 20, buttonHoldMs: 20, releaseSettleMs: 20,
    clipboardConfirmMs: 250, stashTabSettleMs: 250, stashSettleMs: 200, patchVerifyMs: 550
  })
  assert.equal(normalizeFixedTiming({ clipboardConfirmMs: 0 }).clipboardConfirmMs, 0)
  assert.equal(normalizeFixedTiming({ clipboardConfirmMs: 5000 }).clipboardConfirmMs, 5000)
  assert.equal(normalizeFixedTiming({ modifierSettleMs: 300 }).modifierSettleMs, 300)
  assert.equal(normalizeFixedTiming({ modifierSettleMs: -1 }).modifierSettleMs, 50)
  assert.equal(normalizeFixedTiming({ keyHoldMs: '35' }).keyHoldMs, 35)
  assert.equal(normalizeFixedTiming({ keyHoldMs: 12.5 }).keyHoldMs, 12.5)
  assert.equal(normalizeFixedTiming({ patchVerifyMs: 2000 }).patchVerifyMs, 2000)
})

test('固定时序写入 Python 配置时使用 snake_case 键名', () => {
  assert.deepEqual(pythonFixedTiming({ modifierSettleMs: 200, clipboardConfirmMs: 1000 }), {
    modifier_settle_ms: 200, key_hold_ms: 20, button_hold_ms: 20, release_settle_ms: 20,
    clipboard_confirm_ms: 1000, stash_tab_settle_ms: 250, stash_settle_ms: 200, patch_verify_ms: 550
  })
  assert.deepEqual(pythonFixedTiming(), {
    modifier_settle_ms: 50, key_hold_ms: 20, button_hold_ms: 20, release_settle_ms: 20,
    clipboard_confirm_ms: 250, stash_tab_settle_ms: 250, stash_settle_ms: 200, patch_verify_ms: 550
  })
  assert.equal(pythonFixedTiming({ clipboardConfirmMs: 0 }).clipboard_confirm_ms, 0)
  assert.equal(pythonFixedTiming({ patchVerifyMs: 5000 }).patch_verify_ms, 5000)
})

test('设置 store 持久化固定时序配置', () => {
  const store = source('../src/domains/settings/settingsStore.js')
  assert.match(store, /const fixedTiming = ref\(\{ \.\.\.FIXED_TIMING\.defaults \}\)/)
  assert.match(store, /fixedTiming: fixedTiming\.value/)
  assert.match(store, /fixedTiming\.value = normalizeFixedTiming\(data\.fixedTiming\)/)
  assert.match(store, /fixedTiming\.value = \{ \.\.\.FIXED_TIMING\.defaults \}/)
  assert.match(store, /function updateFixedTiming\(patch = \{\}\)/)
})

test('固定时序配置经背包与混沌运行时传递到脚本', () => {
  const bagConfig = source('../src/utils/bagConfig.js')
  assert.match(bagConfig, /normalizeAutomationTiming\(settings\)/)
  const bagIpc = source('../electron/modules/ipc/bag.js')
  assert.match(bagIpc, /pythonAutomationTiming\(config\)/)
  const bagService = source('../src/utils/bagService.js')
  assert.match(bagService, /fixedTiming: fixedTiming \?\? settingsStore\.fixedTiming/)
  assert.match(bagService, /settingsStore\.updateAutomationTiming/)

  const automation = source('../electron/modules/chaosRecipe/automation.js')
  assert.match(automation, /pythonAutomationTiming\(this\.config\)/)
  const chaosService = source('../src/utils/chaosRecipeService.js')
  assert.match(chaosService, /fixedTiming: settingsStore\.fixedTiming/)

  const manager = source('../electron/modules/stashPickup/manager.js')
  assert.match(manager, /pythonAutomationTiming\(this\.runtime\)/)
  const stashStore = source('../src/stores/stashPickup.js')
  assert.match(stashStore, /fixedTiming: settingsStore\.fixedTiming/)
})

test('背包与混沌脚本应用固定时序配置并覆盖默认值', () => {
  const bag = source('../src/assets/scripts/bag_auto_stash_template.py')
  assert.match(bag, /def apply_fixed_timing\(config\):/)
  assert.match(bag, /CLIPBOARD_RESPONSE_MIN_SECONDS = float\(timing\.get\("clipboard_confirm_ms", 250\)\) \/ 1000\.0/)
  assert.match(bag, /MODIFIER_SETTLE_SECONDS = float\(timing\.get\("modifier_settle_ms", 50\)\) \/ 1000\.0/)
  assert.match(bag, /apply_fixed_timing\(config\)/)

  const chaos = source('../src/assets/scripts/chaos_recipe_pick_template.py')
  assert.match(chaos, /def apply_fixed_timing\(config\):/)
  assert.match(chaos, /CLIPBOARD_RESPONSE_MIN_SECONDS = float\(timing\.get\("clipboard_confirm_ms", 250\)\) \/ 1000\.0/)
  assert.match(chaos, /apply_fixed_timing\(config\)/)

  const stashPickup = source('../src/assets/scripts/stash_pickup_template.py')
  assert.match(stashPickup, /PATCH_VERIFY_SECONDS = float\(timing\.get\("patch_verify_ms", 550\)\) \/ 1000\.0/)
  assert.match(stashPickup, /apply_fixed_timing\(config\)/)
})
