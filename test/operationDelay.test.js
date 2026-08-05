import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('设置页只展示一个自动操作等待输入并移除旧延迟控件和预设', () => {
  const view = source('../src/domains/settings/SettingsView.vue')
  assert.match(view, /label="自动操作等待"/)
  assert.match(view, /:min="OPERATION_DELAY\.min"/)
  assert.match(view, /:max="OPERATION_DELAY\.max"/)
  assert.match(view, /悬停稳定时间/)
  assert.match(view, /label="自适应等待"/)
  assert.match(view, /label="自适应等待上限"/)
  assert.match(view, /:min="ADAPTIVE_TIMING\.timeoutMin"/)
  assert.match(view, /:max="ADAPTIVE_TIMING\.timeoutMax"/)
  assert.match(view, /handleAdaptiveTimingChange/)
  assert.match(view, /handleAdaptiveTimeoutChange/)
  assert.doesNotMatch(view, /极速|均衡|稳妥|鼠标移动延迟|操作间隔|剪切板等待|delayPresets/)

  const bagView = source('../src/domains/bag/BagView.vue')
  assert.doesNotMatch(bagView, /逐格操作等待|transferDelayMs|入库失败 \{\{|failedSlots/)
})

test('设置持久化只输出 operationDelayMs，并同步下一轮背包运行配置', () => {
  const store = source('../src/domains/settings/settingsStore.js')
  assert.match(store, /operationDelayMs: operationDelayMs\.value/)
  assert.match(store, /adaptiveTiming: adaptiveTiming\.value/)
  assert.match(store, /adaptiveTimeoutMs: adaptiveTimeoutMs\.value/)
  assert.match(store, /normalizeAdaptiveTiming\(data\.adaptiveTiming\)/)
  assert.match(store, /normalizeAdaptiveTimeoutMs\(data\.adaptiveTimeoutMs\)/)
  assert.match(store, /updateAdaptiveTiming/)
  assert.match(store, /updateAdaptiveTimeoutMs/)
  assert.equal((store.match(/bag\.updateOperationDelay\(operationDelayMs\.value\)/g) || []).length, 2)
  assert.doesNotMatch(store, /delays: delays\.value|updateDelays/)

  const bagStore = source('../src/stores/bag.js')
  assert.doesNotMatch(bagStore, /transferDelayMs|failedSlots/)
})

test('制作和地图脚本的悬停等待来自同一个真实值，点击与复制使用内部固定时序', () => {
  const generator = source('../src/utils/python.js')
  assert.equal((generator.match(/normalizeOperationDelay\(operationDelayMs\)/g) || []).length, 2)
  assert.equal((generator.match(/normalizeAdaptiveTiming\(adaptiveTiming\)/g) || []).length, 2)
  assert.equal((generator.match(/'\{\{DELAY_MOUSE_MOVE\}\}': operationDelaySeconds/g) || []).length, 2)
  assert.equal((generator.match(/'\{\{DELAY_CLIPBOARD\}\}': normalizedOperationDelayMs\.toFixed\(0\)/g) || []).length, 2)
  assert.equal((generator.match(/'\{\{TIMING_MODE\}\}': normalizedAdaptiveTiming \? 'adaptive' : 'fixed'/g) || []).length, 2)
  for (const placeholder of ['MODIFIER_SETTLE_MS', 'KEY_HOLD_MS', 'BUTTON_HOLD_MS', 'RELEASE_SETTLE_MS', 'CLIPBOARD_CONFIRM_MS', 'STASH_TAB_SETTLE_MS', 'STASH_SETTLE_MS']) {
    assert.equal((generator.match(new RegExp(`'\\{\\{${placeholder}\\}\\}': String\\(normalizedFixedTiming\\.${camelCase(placeholder)}\\)`, 'g')) || []).length, 2, `${placeholder} 注入次数`)
  }
  assert.doesNotMatch(generator, /ADAPTIVE_TIMEOUT_MS|adaptiveTimeoutMs/)
  assert.doesNotMatch(generator, /DELAY_MOUSE_CLICK/)
  assert.doesNotMatch(generator, /delays\.mouseMove|delays\.action|delays\.clipboardRead|DELAY_KEY_PRESS|\* 0\.05|\* 0\.2/)

  for (const template of [
    source('../src/assets/scripts/crafting_template.py'),
    source('../src/assets/scripts/map_rolling_template.py')
  ]) {
    assert.match(template, /time\.sleep\(mouse_move_delay\)/)
    assert.match(template, /MODIFIER_SETTLE_SECONDS = float\({{MODIFIER_SETTLE_MS}}\) \/ 1000\.0/)
    assert.match(template, /KEY_HOLD_SECONDS = float\({{KEY_HOLD_MS}}\) \/ 1000\.0/)
    assert.match(template, /BUTTON_HOLD_SECONDS = float\({{BUTTON_HOLD_MS}}\) \/ 1000\.0/)
    assert.match(template, /RELEASE_SETTLE_SECONDS = float\({{RELEASE_SETTLE_MS}}\) \/ 1000\.0/)
    assert.match(template, /CLIPBOARD_RESPONSE_MIN_SECONDS = float\({{CLIPBOARD_CONFIRM_MS}}\) \/ 1000\.0/)
    assert.match(template, /STASH_TAB_SETTLE_SECONDS = float\({{STASH_TAB_SETTLE_MS}}\) \/ 1000\.0/)
    assert.match(template, /STASH_SETTLE_SECONDS = float\({{STASH_SETTLE_MS}}\) \/ 1000\.0/)
    assert.match(template, /mouse_controller\.press\(Button\.(left|right)\)\s*time\.sleep\(BUTTON_HOLD_SECONDS\)\s*mouse_controller\.release\(Button\.(left|right)\)/)
    assert.match(template, /time\.sleep\(max\(CLIPBOARD_RESPONSE_MIN_SECONDS, clipboard_read_delay \/ 1000\.0\)\)/)
    assert.match(template, /TIMING_MODE = "{{TIMING_MODE}}"/)
    assert.match(template, /def wait_for_clipboard_change\(before_seq, before_text, timeout_seconds\):/)
    assert.match(template, /if TIMING_MODE == "adaptive":/)
    assert.match(template, /wait_for_clipboard_change\(before_seq, before_text, CLIPBOARD_RESPONSE_MIN_SECONDS\)/)
    assert.doesNotMatch(template, /ADAPTIVE_TIMEOUT_SECONDS/)
    assert.doesNotMatch(template, /key_press_delay|currency_right_click_delay|item_left_click_delay/)
  }
})

function camelCase(snake) {
  return snake.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}
