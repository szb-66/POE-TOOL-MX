import test from 'node:test'
import assert from 'node:assert/strict'
import { setWindowVisibilityImmediately } from '../electron/modules/window/transitions.js'

const key = 'wm-window-animations-disabled'
function fixture(existing = false) {
  const switches = new Set(existing ? [key] : [])
  const commandLine = { hasSwitch: k => switches.has(k), appendSwitch: k => switches.add(k), removeSwitch: k => switches.delete(k) }
  return { commandLine, switches }
}
for (const visible of [true, false]) test(`显隐 ${visible} 仅在调用期间关闭 Aura 动画`, () => {
  const { commandLine, switches } = fixture()
  const calls = []
  const window = {
    showInactive() { assert.ok(switches.has(key)); calls.push('show') },
    hide() { assert.ok(switches.has(key)); calls.push('hide') }
  }
  setWindowVisibilityImmediately(window, visible, commandLine)
  assert.deepEqual(calls, [visible ? 'show' : 'hide'])
  assert.equal(switches.has(key), false)
})
test('嵌套显隐保留外层开关，异常也恢复原状态', () => {
  const { commandLine, switches } = fixture()
  const window = { hide() { assert.ok(switches.has(key)) }, showInactive() {
    setWindowVisibilityImmediately(window, false, commandLine)
    assert.ok(switches.has(key))
    throw new Error('show failed')
  } }
  assert.throws(() => setWindowVisibilityImmediately(window, true, commandLine), /show failed/)
  assert.equal(switches.has(key), false)
})
test('已有开关保持不变', () => {
  const { commandLine, switches } = fixture(true)
  setWindowVisibilityImmediately({ showInactive() {} }, true, commandLine)
  assert.ok(switches.has(key))
})
