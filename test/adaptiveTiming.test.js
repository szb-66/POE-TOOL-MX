import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runPython } from './helpers/python.js'
import {
  FIXED_TIMING,
  OPERATION_DELAY,
  normalizeAutomationTiming,
  normalizeFixedTiming,
  pythonAutomationTiming,
  pythonFixedTiming
} from '../src/utils/operationDelay.js'

const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')
const bagScriptPath = fileURLToPath(new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url))
const chaosScriptPath = fileURLToPath(new URL('../src/assets/scripts/chaos_recipe_pick_template.py', import.meta.url))

const expectedDefaults = {
  modifierSettleMs: 20,
  keyHoldMs: 15,
  buttonHoldMs: 15,
  releaseSettleMs: 10,
  clipboardConfirmMs: 10,
  stashTabSettleMs: 10,
  stashSettleMs: 10,
  patchVerifyMs: 10
}

test('九项自动化时序默认值使用用户确认值', () => {
  assert.equal(OPERATION_DELAY.default, 40)
  assert.deepEqual(FIXED_TIMING.defaults, expectedDefaults)
  assert.deepEqual(normalizeFixedTiming(), expectedDefaults)
})

test('完整时序使用封闭投影并忽略旧自适应字段', () => {
  const timing = normalizeAutomationTiming({
    operationDelayMs: 0,
    adaptiveTiming: true,
    adaptiveTimeoutMs: 9000,
    fixedTiming: { buttonHoldMs: 7 }
  })
  assert.deepEqual(timing, {
    operationDelayMs: 0,
    fixedTiming: { ...expectedDefaults, buttonHoldMs: 7 }
  })
  assert.deepEqual(pythonAutomationTiming(timing), {
    operation_delay_ms: 0,
    fixed_timing: {
      modifier_settle_ms: 20,
      key_hold_ms: 15,
      button_hold_ms: 7,
      release_settle_ms: 10,
      clipboard_confirm_ms: 10,
      stash_tab_settle_ms: 10,
      stash_settle_ms: 10,
      patch_verify_ms: 10
    }
  })
})

test('固定时序保留任意非负有限用户值，缺失或无效值回退新默认', () => {
  assert.equal(normalizeFixedTiming({ clipboardConfirmMs: 0 }).clipboardConfirmMs, 0)
  assert.equal(normalizeFixedTiming({ clipboardConfirmMs: 5000 }).clipboardConfirmMs, 5000)
  assert.equal(normalizeFixedTiming({ modifierSettleMs: -1 }).modifierSettleMs, 20)
  assert.equal(normalizeFixedTiming({ keyHoldMs: '35' }).keyHoldMs, 35)
  assert.deepEqual(pythonFixedTiming(), {
    modifier_settle_ms: 20,
    key_hold_ms: 15,
    button_hold_ms: 15,
    release_settle_ms: 10,
    clipboard_confirm_ms: 10,
    stash_tab_settle_ms: 10,
    stash_settle_ms: 10,
    patch_verify_ms: 10
  })
})

test('设置与运行时协议不再持久化或传递自适应字段', () => {
  for (const relativePath of [
    '../src/domains/settings/settingsStore.js',
    '../src/utils/bagService.js',
    '../src/utils/chaosRecipeService.js',
    '../src/utils/combatService.js',
    '../src/utils/scriptService.js',
    '../src/domains/puzzle/PuzzleView.vue',
    '../electron/modules/ipc/chaosRecipe.js',
    '../electron/modules/puzzle/service.js'
  ]) {
    const content = source(relativePath)
    assert.doesNotMatch(content, /adaptiveTiming|adaptiveTimeoutMs/, relativePath)
  }
  const operationDelay = source('../src/utils/operationDelay.js')
  assert.doesNotMatch(operationDelay, /ADAPTIVE_TIMING|timing_mode|adaptive_timeout_ms/)
})

test('背包与商城配方剪贴板确认完整使用固定等待值', () => {
  const code = `
import importlib.util, json, sys, types
sys.dont_write_bytecode = True
def load(name, path):
 spec = importlib.util.spec_from_file_location(name, path)
 module = importlib.util.module_from_spec(spec)
 spec.loader.exec_module(module)
 module.mouse = types.SimpleNamespace(Controller=lambda: object())
 module.keyboard = types.SimpleNamespace(Controller=lambda: object())
 return module
bag = load("bag", ${JSON.stringify(bagScriptPath)})
chaos = load("chaos", ${JSON.stringify(chaosScriptPath)})
config = {"operation_delay_ms": 40, "fixed_timing": {"clipboard_confirm_ms": 17}}
bag.apply_fixed_timing(config)
chaos.apply_fixed_timing(config)
print(json.dumps([bag.InputController(config).clipboard_delay, chaos.InputController(config).clipboard_timeout]))
`
  assert.deepEqual(runPython(code), [0.017, 0.017])
})

test('设置页始终显示固定结果等待并为九项延迟提供问号说明', () => {
  const view = source('../src/domains/settings/SettingsView.vue')
  assert.doesNotMatch(view, /自适应等待|adaptiveTiming|adaptiveTimeoutMs/)
  assert.doesNotMatch(view, /v-if="!adaptiveTiming"/)
  assert.match(view, />固定结果等待</)
  assert.match(view, /TIMING_FIELD_HELP/)
  assert.equal((view.match(/timing-help-trigger/g) || []).length >= 2, true)
  for (const label of ['自动操作等待', '组合键稳定', '按键保持', '鼠标点击保持', '释放后稳定', '剪贴板/空格确认', '选仓后生效等待', '存仓后生效等待', '画面变化验证等待']) {
    assert.match(view, new RegExp(label))
  }
})
