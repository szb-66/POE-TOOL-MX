import test from 'node:test'
import assert from 'node:assert/strict'
import { PriceCheckOverlayPresentation } from '../electron/modules/priceCheck/presentation.js'

function createWindowBoundary() {
  const calls = []
  return {
    calls,
    setOpacity(value) { calls.push(['opacity', value]) },
    setIgnoreMouseEvents(value) { calls.push(['ignoreMouse', value]) },
    setFocusable(value) { calls.push(['focusable', value]) },
    showInactive() { calls.push(['showInactive']) },
    focus() { calls.push(['focus']) },
    destroy() { calls.push(['destroy']) }
  }
}

test('查价浮窗预热后反复唤起只显示一次原生窗口且每次恢复交互', () => {
  const window = createWindowBoundary()
  const presentation = new PriceCheckOverlayPresentation(window)

  presentation.prime()
  for (let index = 0; index < 50; index += 1) {
    const display = presentation.beginDisplay()
    assert.equal(display.needsReveal, true)
    assert.equal(presentation.reveal(display.generation), true)
    assert.equal(presentation.isInteractive(), true)
    presentation.park()
    assert.equal(presentation.isInteractive(), false)
  }

  assert.equal(window.calls.filter(([name]) => name === 'showInactive').length, 1)
  assert.equal(window.calls.filter(([name]) => name === 'focus').length, 50)
  assert.equal(window.calls.some(([name]) => name === 'show' || name === 'hide'), false)
  assert.deepEqual(window.calls.slice(-3), [
    ['opacity', 0],
    ['ignoreMouse', true],
    ['focusable', false]
  ])
})

test('查价浮窗拒绝关闭前遗留的渲染回执', () => {
  const window = createWindowBoundary()
  const presentation = new PriceCheckOverlayPresentation(window)
  presentation.prime()

  const stale = presentation.beginDisplay()
  presentation.park()
  const current = presentation.beginDisplay()
  const callsBeforeStaleReply = window.calls.length

  assert.equal(presentation.reveal(stale.generation), false)
  assert.equal(window.calls.length, callsBeforeStaleReply)
  assert.equal(presentation.reveal(current.generation), true)
  assert.equal(presentation.isInteractive(), true)
})

test('查价浮窗保持显示时更新物品不重复提交原生显示和聚焦', () => {
  const window = createWindowBoundary()
  const presentation = new PriceCheckOverlayPresentation(window)
  presentation.prime()
  const first = presentation.beginDisplay()
  presentation.reveal(first.generation)
  const callsBeforeUpdate = window.calls.length

  const update = presentation.beginDisplay()

  assert.equal(update.needsReveal, false)
  assert.equal(presentation.isInteractive(), true)
  assert.equal(window.calls.length, callsBeforeUpdate)
})

test('查价浮窗销毁后不再响应遗留显示回执', () => {
  const window = createWindowBoundary()
  const presentation = new PriceCheckOverlayPresentation(window)
  presentation.prime()
  const display = presentation.beginDisplay()

  presentation.destroy()

  assert.equal(presentation.reveal(display.generation), false)
  assert.deepEqual(window.calls.slice(-1), [['destroy']])
})
