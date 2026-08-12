import test from 'node:test'
import assert from 'node:assert/strict'
import { getReloadAction } from '../electron/modules/window/refreshShortcut.js'

const keyDown = (key, extra = {}) => ({ type: 'keyDown', key, control: false, shift: false, meta: false, alt: false, ...extra })

test('Ctrl+R 触发普通刷新', () => {
  assert.equal(getReloadAction(keyDown('r', { control: true })), 'reload')
  assert.equal(getReloadAction(keyDown('R', { control: true })), 'reload')
})

test('Ctrl+Shift+R 触发强制刷新', () => {
  assert.equal(getReloadAction(keyDown('r', { control: true, shift: true })), 'force-reload')
})

test('F5 触发普通刷新', () => {
  assert.equal(getReloadAction(keyDown('F5')), 'reload')
  assert.equal(getReloadAction(keyDown('f5')), 'reload')
})

test('其他按键与抬起事件不触发刷新', () => {
  assert.equal(getReloadAction(keyDown('a', { control: true })), null)
  assert.equal(getReloadAction(keyDown('r')), null)
  assert.equal(getReloadAction({ type: 'keyUp', key: 'r', control: true, shift: false, meta: false, alt: false }), null)
})
