import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const scripts = {
  bag: new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url),
  stashPickup: new URL('../src/assets/scripts/stash_pickup_template.py', import.meta.url),
  chaosRecipe: new URL('../src/assets/scripts/chaos_recipe_pick_template.py', import.meta.url),
  mapRolling: new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url),
  crafting: new URL('../src/assets/scripts/crafting_template.py', import.meta.url)
}

const source = (key) => readFileSync(scripts[key], 'utf8')

test('五个自动化脚本定义一致的内部固定时序常量', () => {
  const placeholderKeys = ['mapRolling', 'crafting']
  const runtimeKeys = ['bag', 'chaosRecipe', 'stashPickup']
  for (const key of placeholderKeys) {
    const content = source(key)
    assert.match(content, /MODIFIER_SETTLE_SECONDS = float\({{MODIFIER_SETTLE_MS}}\) \/ 1000\.0/, `${key} 缺少组合键稳定占位符`)
    assert.match(content, /KEY_HOLD_SECONDS = float\({{KEY_HOLD_MS}}\) \/ 1000\.0/, `${key} 缺少按键保持占位符`)
    assert.match(content, /BUTTON_HOLD_SECONDS = float\({{BUTTON_HOLD_MS}}\) \/ 1000\.0/, `${key} 缺少鼠标保持占位符`)
    assert.match(content, /RELEASE_SETTLE_SECONDS = float\({{RELEASE_SETTLE_MS}}\) \/ 1000\.0/, `${key} 缺少释放稳定占位符`)
    assert.match(content, /CLIPBOARD_RESPONSE_MIN_SECONDS = float\({{CLIPBOARD_CONFIRM_MS}}\) \/ 1000\.0/, `${key} 缺少剪贴板确认占位符`)
    assert.match(content, /STASH_TAB_SETTLE_SECONDS = float\({{STASH_TAB_SETTLE_MS}}\) \/ 1000\.0/, `${key} 缺少选仓等待占位符`)
    assert.match(content, /STASH_SETTLE_SECONDS = float\({{STASH_SETTLE_MS}}\) \/ 1000\.0/, `${key} 缺少存仓等待占位符`)
  }
  for (const key of runtimeKeys) {
    const content = source(key)
    assert.match(content, /MODIFIER_SETTLE_SECONDS\s*=\s*0\.05/, `${key} 缺少组合键稳定默认值`)
    assert.match(content, /KEY_HOLD_SECONDS\s*=\s*0\.02/, `${key} 缺少按键保持默认值`)
    assert.match(content, /BUTTON_HOLD_SECONDS\s*=\s*0\.02/, `${key} 缺少鼠标保持默认值`)
    assert.match(content, /RELEASE_SETTLE_SECONDS\s*=\s*0\.02/, `${key} 缺少释放稳定默认值`)
    assert.match(content, /def apply_fixed_timing\(config\):/, `${key} 缺少固定时序应用函数`)
  }
  assert.match(source('bag'), /CLIPBOARD_RESPONSE_MIN_SECONDS\s*=\s*0\.25/)
  assert.match(source('chaosRecipe'), /CLIPBOARD_RESPONSE_MIN_SECONDS\s*=\s*0\.25/)
})

test('制作与地图脚本包含自适应剪贴板轮询，固定常量仍保留', () => {
  for (const key of ['mapRolling', 'crafting']) {
    const content = source(key)
    assert.match(content, /TIMING_MODE = "{{TIMING_MODE}}"/)
    assert.match(content, /def wait_for_clipboard_change\(before_seq, before_text, timeout_seconds\):/)
    assert.match(content, /def clipboard_changed\(before_seq, before_text\):/)
    assert.match(content, /if TIMING_MODE == "adaptive":/)
    assert.match(content, /wait_for_clipboard_change\(before_seq, before_text, ADAPTIVE_TIMEOUT_SECONDS\)/)
    assert.match(content, /CLIPBOARD_POLL_INTERVAL_SECONDS = 0\.01/)
    assert.match(content, /time\.sleep\(CLIPBOARD_RESPONSE_MIN_SECONDS\)/)
  }
})

test('背包 Ctrl+C 与 Ctrl+点击均满足 Ctrl 先按下、最后释放', () => {
  const content = source('bag')
  const beginCtrl = content.slice(content.indexOf('def begin_ctrl(self):'), content.indexOf('def move(self, x, y):'))
  const sendCopy = content.slice(content.indexOf('def _send_copy(self, ctrl_held=False):'), content.indexOf('def _copy_item_text_once(self, ctrl_held=False):'))
  const clickWithCtrl = content.slice(content.indexOf('def click_with_ctrl(self):'), content.indexOf('def ctrl_click(self):'))
  const ctrlClick = content.slice(content.indexOf('def ctrl_click(self):'), content.indexOf('def transfer_item_once(controller):'))
  assert.match(beginCtrl, /self\.press_key\(Key\.ctrl\)/)
  assert.ok(sendCopy.indexOf('self.begin_ctrl()') < sendCopy.indexOf('self.press_key("c")'))
  assert.ok(sendCopy.indexOf('self.release_key("c")') < sendCopy.indexOf('self.release_key(Key.ctrl)'))
  assert.ok(clickWithCtrl.indexOf('self.begin_ctrl()') < clickWithCtrl.indexOf('self.press_button(Button.left)'))
  assert.ok(clickWithCtrl.indexOf('self.press_button(Button.left)') < clickWithCtrl.indexOf('self.release_button(Button.left)'))
  assert.ok(ctrlClick.indexOf('self.click_with_ctrl()') < ctrlClick.indexOf('self.release_key(Key.ctrl)'))
})

test('仓库取件 Ctrl+点击满足 Ctrl 先按下、最后释放', () => {
  const content = source('stashPickup')
  const ctrlClick = content.slice(
    content.indexOf('def ctrl_click(mouse, keyboard, ctrl_key, left_button, foreground_check=None):'),
    content.indexOf('def wait_for_patch_change(')
  )
  assert.ok(ctrlClick.indexOf('keyboard.press(ctrl_key)') < ctrlClick.indexOf('mouse.press(left_button)'))
  assert.ok(ctrlClick.indexOf('mouse.release(left_button)') < ctrlClick.lastIndexOf('keyboard.release(ctrl_key)'))
})

test('混沌配方取件 Ctrl+C 与 Ctrl+点击均满足 Ctrl 先按下、最后释放', () => {
  const content = source('chaosRecipe')
  const copyItem = content.slice(content.indexOf('def copy_item(self):'), content.indexOf('def ctrl_click(self):'))
  assert.ok(copyItem.indexOf('self.keyboard.press(Key.ctrl)') < copyItem.indexOf('self.keyboard.press("c")'))
  assert.ok(copyItem.indexOf('self.keyboard.release("c")') < copyItem.indexOf('self.keyboard.release(Key.ctrl)'))
  const ctrlClick = content.slice(content.indexOf('def ctrl_click(self):'), content.indexOf('def transfer_item('))
  assert.ok(ctrlClick.indexOf('self.keyboard.press(Key.ctrl)') < ctrlClick.indexOf('self.mouse.press(Button.left)'))
  assert.ok(ctrlClick.indexOf('self.mouse.release(Button.left)') < ctrlClick.indexOf('self.keyboard.release(Key.ctrl)'))
})

test('地图洗练 Ctrl+C 与存仓点击满足 Ctrl 先按下、最后释放', () => {
  const content = source('mapRolling')
  const sendCopy = content.slice(content.indexOf('def send_copy_command('), content.indexOf('def read_clipboard_to_file():'))
  assert.ok(sendCopy.indexOf('keyboard_controller.press(Key.ctrl)') < sendCopy.indexOf("keyboard_controller.press('c')"))
  assert.ok(sendCopy.indexOf("keyboard_controller.release('c')") < sendCopy.indexOf('keyboard_controller.release(Key.ctrl)'))
  const stashItem = content.slice(content.indexOf('def stash_item(x, y):'), content.indexOf('def update_map_stats('))
  assert.ok(stashItem.indexOf('keyboard_controller.press(Key.ctrl)') < stashItem.indexOf('click_mouse("left")'))
  assert.ok(stashItem.indexOf('click_mouse("left")') < stashItem.indexOf('keyboard_controller.release(Key.ctrl)'))
})

test('制作脚本 Ctrl+C 满足 Ctrl 先按下、最后释放', () => {
  const content = source('crafting')
  const sendCopy = content.slice(content.indexOf('def send_copy_command('), content.indexOf('def read_clipboard_to_file():'))
  assert.ok(sendCopy.indexOf('keyboard_controller.press(Key.ctrl)') < sendCopy.indexOf("keyboard_controller.press('c')"))
  assert.ok(sendCopy.indexOf("keyboard_controller.release('c')") < sendCopy.indexOf('keyboard_controller.release(Key.ctrl)'))
})
