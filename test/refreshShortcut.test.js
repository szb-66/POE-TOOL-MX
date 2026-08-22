import test from 'node:test'
import assert from 'node:assert/strict'
import { dispatchReloadAction, getReloadAction } from '../electron/modules/window/refreshShortcut.js'

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

test('强制刷新动作只请求一次应用重启且不直接重载渲染页面', () => {
  let restartRequests = 0
  let reloadCalls = 0

  assert.equal(dispatchReloadAction('force-reload', {
    requestForceRefresh: () => { restartRequests += 1 },
    reload: () => { reloadCalls += 1 }
  }), true)
  assert.equal(restartRequests, 1)
  assert.equal(reloadCalls, 0)
})

test('普通刷新动作只重载渲染页面', () => {
  let restartRequests = 0
  let reloadCalls = 0

  assert.equal(dispatchReloadAction('reload', {
    requestForceRefresh: () => { restartRequests += 1 },
    reload: () => { reloadCalls += 1 }
  }), true)
  assert.equal(restartRequests, 0)
  assert.equal(reloadCalls, 1)
  assert.equal(dispatchReloadAction(null, { requestForceRefresh() {}, reload() {} }), false)
})
