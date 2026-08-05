import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runPython } from './helpers/python.js'
import {
  ADAPTIVE_TIMING,
  normalizeAdaptiveTimeoutMs,
  normalizeAdaptiveTiming,
  normalizeFixedTiming,
  pythonFixedTiming
} from '../src/utils/operationDelay.js'
import { buildBagRuntimeConfig } from '../src/utils/bagConfig.js'

const source = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')
const scriptUrl = new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url)
const bagScriptPath = fileURLToPath(scriptUrl)
const chaosScriptUrl = new URL('../src/assets/scripts/chaos_recipe_pick_template.py', import.meta.url)
const chaosScriptPath = fileURLToPath(chaosScriptUrl)

test('自适应常量默认值与归一化：旧配置默认开启、超时 1000ms、越界收敛', () => {
  assert.deepEqual(ADAPTIVE_TIMING, { default: true, timeoutDefault: 1000, timeoutMin: 500, timeoutMax: 3000 })
  assert.equal(normalizeAdaptiveTiming(undefined), true)
  assert.equal(normalizeAdaptiveTiming(null), true)
  assert.equal(normalizeAdaptiveTiming(false), false)
  assert.equal(normalizeAdaptiveTiming(true), true)
  assert.equal(normalizeAdaptiveTimeoutMs(undefined), 1000)
  assert.equal(normalizeAdaptiveTimeoutMs(null), 1000)
  assert.equal(normalizeAdaptiveTimeoutMs(''), 1000)
  assert.equal(normalizeAdaptiveTimeoutMs(0), 500)
  assert.equal(normalizeAdaptiveTimeoutMs(100), 500)
  assert.equal(normalizeAdaptiveTimeoutMs(5000), 3000)
  assert.equal(normalizeAdaptiveTimeoutMs(1500), 1500)
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

  const bagService = source('../src/utils/bagService.js')
  assert.doesNotMatch(bagService, /adaptiveTiming|adaptiveTimeoutMs/)

  const runtime = buildBagRuntimeConfig({ moduleEnabled: true, templates: {}, blacklist: [] }, {
    operationDelayMs: 80,
    adaptiveTiming: true,
    adaptiveTimeoutMs: 1500
  })
  assert.equal(runtime.adaptiveTiming, undefined)
  assert.equal(runtime.adaptiveTimeoutMs, undefined)
})

test('背包运行时配置不再输出自适应字段', () => {
  const ipc = source('../electron/modules/ipc/bag.js')
  assert.doesNotMatch(ipc, /timing_mode|adaptive_timeout_ms/)
})

test('背包脚本剪贴板等待固定为 250ms 下限，不受自适应配置影响', () => {
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
  assert.deepEqual(runPython(code), [0.25, 0.18])
})

test('混沌配方脚本剪贴板超时保留 delay*4 上限', () => {
  const code = `
import importlib.util, json, sys, types
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("chaos", ${JSON.stringify(chaosScriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.mouse = types.SimpleNamespace(Controller=lambda: object())
module.keyboard = types.SimpleNamespace(Controller=lambda: object())
normal = module.InputController(80)
slow = module.InputController(180)
print(json.dumps([round(normal.clipboard_timeout, 6), round(slow.clipboard_timeout, 6)]))
`
  assert.deepEqual(runPython(code), [0.32, 0.72])
})

test('制作与地图剪贴板确认窗口恢复 250ms，轮询逻辑保留', () => {
  for (const relative of [
    '../src/assets/scripts/crafting_template.py',
    '../src/assets/scripts/map_rolling_template.py'
  ]) {
    const content = source(relative)
    assert.match(content, /wait_for_clipboard_change\(before_seq, before_text, CLIPBOARD_RESPONSE_MIN_SECONDS\)/)
    assert.doesNotMatch(content, /ADAPTIVE_TIMEOUT_SECONDS/)
    assert.match(content, /TIMING_MODE = "{{TIMING_MODE}}"/)
    assert.match(content, /def wait_for_clipboard_change\(before_seq, before_text, timeout_seconds\):/)
  }
})

test('仓库取件脚本支持自适应超时参数，缺省时保持原固定上限', () => {
  const content = source('../src/assets/scripts/stash_pickup_template.py')
  assert.match(content, /def wait_for_patch_change\(before, rect, columns, candidate, ratio, grabber, delay, timeout_seconds=None\):/)
  assert.match(content, /if timeout_seconds is None:\s*timeout_seconds = max\(PATCH_VERIFY_SECONDS, delay \* 6\)/)
  assert.match(content, /timing_mode = config\.get\("timing_mode", "fixed"\)/)
  assert.match(content, /patch_timeout = \(adaptive_timeout_ms \/ 1000\.0\) if timing_mode == "adaptive" else None/)
  assert.match(content, /wait_for_patch_change\(before, rect, columns, candidate, ratio, grabber, delay, patch_timeout\)/)
})

test('海图放置脚本自适应模式缩短固定下限并由验证轮询兜底', () => {
  const content = source('../src/assets/scripts/puzzle_auto_place.py')
  assert.match(content, /timing_mode = config\.get\("timing_mode", "adaptive"\)/)
  assert.match(content, /adaptive_timeout_ms = max\(500, min\(3000, float\(config\.get\("adaptive_timeout_ms", 1000\)\)\)/)
  assert.match(content, /selection_delay = max\(delay, 0\.16 if timing_mode == "fixed" else 0\.10\)/)
  assert.match(content, /placement_delay = max\(delay, 0\.20 if timing_mode == "fixed" else 0\.12\)/)
  assert.match(content, /time\.sleep\(max\(delay, 0\.20 if timing_mode == "fixed" else 0\.15\)\)/)
  assert.match(content, /deadline = time\.monotonic\(\) \+ \(adaptive_timeout_ms \/ 1000\.0\) if timing_mode == "adaptive" else None/)
})

test('海图服务端与前端传递自适应配置', () => {
  const service = source('../electron/modules/puzzle/service.js')
  assert.match(service, /adaptiveTiming = true, adaptiveTimeoutMs = 1000/)
  assert.match(service, /timing_mode: adaptiveTiming === false \? 'fixed' : 'adaptive'/)
  assert.match(service, /adaptive_timeout_ms: Math\.max\(500, Math\.min\(3000, Number\(adaptiveTimeoutMs\) \|\| 1000\)\)/)

  const store = source('../src/stores/puzzle.js')
  assert.match(store, /async function startAutoPlacement\(operationDelayMs = 80, adaptiveTiming = true, adaptiveTimeoutMs = 1000\)/)
  assert.match(store, /adaptiveTiming, adaptiveTimeoutMs\s*\}\)/)

  const view = source('../src/domains/puzzle/PuzzleView.vue')
  assert.match(view, /settingsStore\.adaptiveTiming/)
  assert.match(view, /settingsStore\.adaptiveTimeoutMs/)
})

test('混沌配方不再传递自适应字段，仓库取件保留', () => {
  const automation = source('../electron/modules/chaosRecipe/automation.js')
  assert.doesNotMatch(automation, /timing_mode|adaptive_timeout_ms/)
  assert.match(automation, /operation_delay_ms: Number\(this\.config\.operationDelayMs \|\| 80\)/)

  const ipc = source('../electron/modules/ipc/chaosRecipe.js')
  assert.doesNotMatch(ipc, /adaptiveTiming|adaptiveTimeoutMs/)

  const service = source('../src/utils/chaosRecipeService.js')
  assert.doesNotMatch(service, /adaptiveTiming|adaptiveTimeoutMs/)

  const manager = source('../electron/modules/stashPickup/manager.js')
  assert.match(manager, /timing_mode: this\.runtime\.adaptiveTiming === false \? 'fixed' : 'adaptive'/)
  assert.match(manager, /adaptive_timeout_ms: Math\.max\(500, Math\.min\(3000, Number\(this\.runtime\.adaptiveTimeoutMs\) \|\| 1000\)\)/)

  const store = source('../src/stores/stashPickup.js')
  assert.match(store, /adaptiveTiming: settingsStore\.adaptiveTiming/)
  assert.match(store, /adaptiveTimeoutMs: settingsStore\.adaptiveTimeoutMs/)
  assert.match(store, /operationDelayMs: settingsStore\.operationDelayMs/)
})

test('制作与地图启动把自适应配置传入脚本生成器', () => {
  const scriptService = source('../src/utils/scriptService.js')
  assert.equal((scriptService.match(/adaptiveTiming: settingsStore\.adaptiveTiming/g) || []).length, 2)
  assert.doesNotMatch(scriptService, /adaptiveTimeoutMs/)
})

test('固定时序配置默认值与归一化', () => {
  assert.deepEqual(normalizeFixedTiming(), {
    modifierSettleMs: 50, keyHoldMs: 20, buttonHoldMs: 20, releaseSettleMs: 20,
    clipboardConfirmMs: 250, stashTabSettleMs: 250, stashSettleMs: 200, patchVerifyMs: 550
  })
  assert.equal(normalizeFixedTiming({ clipboardConfirmMs: 0 }).clipboardConfirmMs, 50)
  assert.equal(normalizeFixedTiming({ clipboardConfirmMs: 5000 }).clipboardConfirmMs, 1000)
  assert.equal(normalizeFixedTiming({ modifierSettleMs: 300 }).modifierSettleMs, 200)
  assert.equal(normalizeFixedTiming({ keyHoldMs: '35' }).keyHoldMs, 35)
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
  assert.match(bagConfig, /fixedTiming: normalizeFixedTiming\(settings\?\.fixedTiming\)/)
  const bagIpc = source('../electron/modules/ipc/bag.js')
  assert.match(bagIpc, /fixed_timing: pythonFixedTiming\(config\.fixedTiming\)/)
  const bagService = source('../src/utils/bagService.js')
  assert.match(bagService, /fixedTiming: fixedTiming \?\? settingsStore\.fixedTiming/)
  assert.match(bagService, /'fixedTiming' in patch\) settingsStore\.updateFixedTiming/)

  const automation = source('../electron/modules/chaosRecipe/automation.js')
  assert.match(automation, /fixed_timing: pythonFixedTiming\(this\.config\.fixedTiming\)/)
  const chaosService = source('../src/utils/chaosRecipeService.js')
  assert.match(chaosService, /fixedTiming: settingsStore\.fixedTiming/)

  const manager = source('../electron/modules/stashPickup/manager.js')
  assert.match(manager, /fixed_timing: pythonFixedTiming\(this\.runtime\.fixedTiming\)/)
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
