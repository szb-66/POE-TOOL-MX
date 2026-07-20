import test from 'node:test'
import assert from 'node:assert/strict'
import { interpretCaptureEvent, keyboardEventToAccelerator, keyboardEventToActionKey } from '../src/utils/keyCapture.js'
import { validateShortcuts } from '../src/utils/shortcutValidator.js'

function keyEvent(key, options = {}) {
  return { key, code: options.code || '', ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...options }
}

test('DOM 按键事件转换为规范化组合键和小键盘键', () => {
  assert.equal(keyboardEventToAccelerator(keyEvent('k', { ctrlKey: true, shiftKey: true })), 'Ctrl+Shift+K')
  assert.equal(keyboardEventToAccelerator(keyEvent('1'), new Set(['Alt'])), 'Alt+1')
  assert.equal(keyboardEventToAccelerator(keyEvent('4', { code: 'Numpad4' })), 'Numpad4')
  assert.equal(keyboardEventToAccelerator(keyEvent('PageDown')), 'PageDown')
  assert.equal(keyboardEventToAccelerator(keyEvent('Control', { ctrlKey: true })), null)
})

test('动作键拒绝修饰组合并使用运行时支持的名称', () => {
  assert.equal(keyboardEventToActionKey(keyEvent('w')), 'w')
  assert.equal(keyboardEventToActionKey(keyEvent('1', { code: 'Numpad1' })), 'Numpad1')
  assert.equal(keyboardEventToActionKey(keyEvent('w', { ctrlKey: true })), null)
  assert.equal(keyboardEventToActionKey(keyEvent('W', { shiftKey: true })), null)
})

test('捕获事件支持取消、清空和等待修饰键', () => {
  assert.equal(interpretCaptureEvent(keyEvent('Escape')).type, 'cancel')
  assert.equal(interpretCaptureEvent(keyEvent('Delete')).type, 'clear')
  assert.equal(interpretCaptureEvent(keyEvent('Shift', { shiftKey: true })).type, 'pending')
})

test('快捷键验证接受翻页键并拒绝别名冲突和保留键', () => {
  assert.equal(validateShortcuts({ previous: 'PageUp', next: 'PageDown' }).isValid, true)
  assert.equal(validateShortcuts({ a: 'Numpad4', b: 'num4' }).isValid, false)
  assert.equal(validateShortcuts({ debug: 'F12' }).isValid, false)
  assert.equal(validateShortcuts({ debug: 'Ctrl+Shift+I' }).isValid, false)
})
