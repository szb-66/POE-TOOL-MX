import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('设置页只展示一个自动操作等待输入并移除旧延迟控件和预设', () => {
  const view = source('../src/domains/settings/SettingsView.vue')
  assert.match(view, /label="自动操作等待"/)
  assert.match(view, /:min="OPERATION_DELAY\.min"/)
  assert.match(view, /:max="OPERATION_DELAY\.max"/)
  assert.doesNotMatch(view, /极速|均衡|稳妥|鼠标移动延迟|操作间隔|剪切板等待|delayPresets/)

  const bagView = source('../src/domains/bag/BagView.vue')
  assert.doesNotMatch(bagView, /逐格操作等待|transferDelayMs|入库失败 \{\{|failedSlots/)
})

test('设置持久化只输出 operationDelayMs，并同步下一轮背包运行配置', () => {
  const store = source('../src/domains/settings/settingsStore.js')
  assert.match(store, /operationDelayMs: operationDelayMs\.value/)
  assert.equal((store.match(/bag\.updateOperationDelay\(operationDelayMs\.value\)/g) || []).length, 2)
  assert.doesNotMatch(store, /delays: delays\.value|updateDelays/)

  const bagStore = source('../src/stores/bag.js')
  assert.doesNotMatch(bagStore, /transferDelayMs|failedSlots/)
})

test('制作和地图脚本使用同一个真实等待值且没有隐藏倍率或按键延迟模板', () => {
  const generator = source('../src/utils/python.js')
  assert.equal((generator.match(/normalizeOperationDelay\(operationDelayMs\)/g) || []).length, 2)
  assert.equal((generator.match(/'\{\{DELAY_MOUSE_MOVE\}\}': operationDelaySeconds/g) || []).length, 2)
  assert.equal((generator.match(/'\{\{DELAY_MOUSE_CLICK\}\}': operationDelaySeconds/g) || []).length, 2)
  assert.equal((generator.match(/'\{\{DELAY_CLIPBOARD\}\}': normalizedOperationDelayMs\.toFixed\(0\)/g) || []).length, 2)
  assert.doesNotMatch(generator, /delays\.mouseMove|delays\.action|delays\.clipboardRead|DELAY_KEY_PRESS|\* 0\.05|\* 0\.2/)

  for (const template of [
    source('../src/assets/scripts/crafting_template.py'),
    source('../src/assets/scripts/map_rolling_template.py')
  ]) {
    assert.match(template, /time\.sleep\(mouse_move_delay\)/)
    assert.match(template, /time\.sleep\(mouse_click_delay\)/)
    assert.match(template, /time\.sleep\(clipboard_read_delay \/ 1000\.0\)/)
    assert.doesNotMatch(template, /key_press_delay|currency_right_click_delay|item_left_click_delay/)
  }
})
