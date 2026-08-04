import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  OverlayDragPassthroughController,
  getFixedOverlayDragBounds
} from '../electron/modules/window/overlayDrag.js'

function source(path) {
  return fs.readFileSync(new URL(path, import.meta.url), 'utf8')
}

test('穿透控制器仅在命中状态实际改变时切换鼠标穿透', () => {
  const calls = []
  let cursor = { x: 10, y: 10 }
  const window = {
    isDestroyed: () => false,
    getBounds: () => ({ x: 0, y: 0, width: 300, height: 400 }),
    setIgnoreMouseEvents: (...args) => calls.push(args)
  }
  const controller = new OverlayDragPassthroughController({
    getWindow: () => window,
    getCursorPoint: () => cursor,
    isPointInHandle: (point) => point.x >= 114 && point.x < 186 && point.y < 24
  })

  controller.sync()
  controller.sync()
  assert.deepEqual(calls, [[true, { forward: true }]])

  cursor = { x: 150, y: 10 }
  controller.sync()
  controller.sync()
  assert.deepEqual(calls.at(-1), [false, { forward: true }])
  assert.equal(calls.length, 2)

  controller.setDragging(true)
  controller.setDragging(false)
  assert.equal(calls.length, 2)

  cursor = { x: 10, y: 10 }
  controller.setEnabled(false)
  assert.equal(calls.length, 2)
  controller.setEnabled(true)
  assert.deepEqual(calls.at(-1), [true, { forward: true }])
})

test('统一拖动边界保留规范尺寸并限制在当前屏幕工作区', () => {
  const workArea = { x: -200, y: 20, width: 800, height: 600 }
  const size = { width: 300, height: 400 }
  assert.deepEqual(getFixedOverlayDragBounds({ x: 999, y: -100 }, workArea, size), {
    x: 300, y: 20, width: 300, height: 400
  })
})

test('可穿透浮窗共享 Pointer Capture 协议，原生标题栏明确显示抓手光标', () => {
  for (const path of [
    '../src/domains/overlay/components/OverlayContent.vue',
    '../src/domains/bag/BagStashOverlayView.vue',
    '../src/domains/shop/ChaosRecipeControlOverlayView.vue',
    '../src/domains/story/StoryOverlayView.vue'
  ]) {
    const view = source(path)
    assert.match(view, /createOverlayDrag/)
    assert.match(view, /@pointerdown="drag\.pointerDown"/)
    assert.match(view, /cursor: grab/)
    assert.match(view, /cursor: grabbing/)
  }

  const priceCheck = source('../src/domains/priceCheck/PriceCheckOverlayView.vue')
  assert.match(priceCheck, /\.topbar \{[^}]*cursor: grab;[^}]*-webkit-app-region: drag;/)
  assert.match(priceCheck, /\.topbar:active \{ cursor: grabbing; \}/)
})

test('制作进度浮窗通过独立会话移动且不再依赖悬停启停拖动', () => {
  const view = source('../src/domains/overlay/components/OverlayContent.vue')
  const ipc = source('../electron/modules/ipc/window.js')
  const manager = source('../electron/modules/window/manager.js')
  assert.doesNotMatch(view, /activateDragHandle|deactivateDragHandle/)
  assert.match(ipc, /const craftingOverlayDrag = new OverlayDragSession\(\)/)
  assert.match(ipc, /ipcMain\.on\('crafting-overlay-move'/)
  assert.match(manager, /export function moveCraftingOverlayTo/)
  assert.match(manager, /getFixedOverlayDragBounds\(point, display\.workArea, CRAFTING_OVERLAY_SIZE\)/)
})
