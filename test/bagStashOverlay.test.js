import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createBagOverlaySnapshot } from '../electron/modules/bag/overlayState.js'
import {
  BAG_OVERLAY_SIZE,
  getBagOverlayBounds,
  getBagOverlayDragBounds
} from '../electron/modules/window/bagOverlay.js'
import { OverlayDragSession } from '../electron/modules/window/overlayDrag.js'

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('条件显示模式仅在就绪或入库中显示，入库时禁用', () => {
  assert.deepEqual(createBagOverlaySnapshot({
    moduleEnabled: true,
    ready: false,
    foreground: false,
    showOnlyWhenReady: true
  }), {
    visible: false,
    ready: false,
    foreground: false,
    stashing: false,
    disabled: true,
    disabledReason: '等待仓库与背包同时打开',
    label: '自动入库'
  })

  const ready = createBagOverlaySnapshot({
    moduleEnabled: true,
    ready: true,
    foreground: true,
    showOnlyWhenReady: true
  })
  assert.equal(ready.visible, true)
  assert.equal(ready.disabled, false)

  const stashing = createBagOverlaySnapshot({
    moduleEnabled: true,
    ready: true,
    foreground: true,
    stashing: true,
    showOnlyWhenReady: true
  })
  assert.equal(stashing.visible, true)
  assert.equal(stashing.disabled, true)
  assert.equal(stashing.label, '入库中')
})

test('常驻模式在模块运行期间显示并准确说明禁用原因', () => {
  const waiting = createBagOverlaySnapshot({
    moduleEnabled: true,
    ready: true,
    foreground: false,
    showOnlyWhenReady: false
  })
  assert.equal(waiting.visible, true)
  assert.equal(waiting.disabled, true)
  assert.equal(waiting.disabledReason, '游戏窗口不在前台')
  assert.equal(createBagOverlaySnapshot({ moduleEnabled: false, showOnlyWhenReady: false }).visible, false)
})

test('浮层恢复有效位置，失效位置回退到主屏工作区', () => {
  const displays = [
    { primary: true, workArea: { x: 0, y: 0, width: 1920, height: 1080 } },
    { primary: false, workArea: { x: 1920, y: 0, width: 1280, height: 1024 } }
  ]
  assert.deepEqual(getBagOverlayBounds({ x: 2100, y: 100 }, displays), {
    x: 2100, y: 100, ...BAG_OVERLAY_SIZE
  })
  assert.deepEqual(getBagOverlayBounds({ x: 5000, y: 5000 }, displays), {
    x: 1708,
    y: 508,
    ...BAG_OVERLAY_SIZE
  })
})

test('浮窗拖动始终从主进程固定起点计算且不累积窗口尺寸', () => {
  const drag = new OverlayDragSession()
  drag.begin(7, { screenX: 100, screenY: 200 }, { x: 300, y: 400, width: 188, height: 64 })
  assert.deepEqual(drag.move(7, { screenX: 110, screenY: 220 }), { x: 310, y: 420 })
  assert.deepEqual(drag.move(7, { screenX: 120, screenY: 240 }), { x: 320, y: 440 })
  assert.equal(drag.move(8, { screenX: 130, screenY: 260 }), null)
  drag.end(7)
  assert.equal(drag.move(7, { screenX: 140, screenY: 280 }), null)
})

test('浮层水平、垂直及重复拖动始终恢复固定尺寸', () => {
  const workArea = { x: 0, y: 0, width: 1920, height: 1080 }
  const targets = [
    { x: 450, y: 400 },
    { x: 300, y: 620 },
    { x: 700, y: 800 },
    { x: 800, y: 900 }
  ]
  for (const target of targets) {
    assert.deepEqual(getBagOverlayDragBounds(target, workArea), {
      ...target,
      ...BAG_OVERLAY_SIZE
    })
  }
})

test('浮层拖到工作区边缘时夹取位置而不改变固定尺寸', () => {
  const workArea = { x: -1280, y: 0, width: 1280, height: 720 }
  assert.deepEqual(getBagOverlayDragBounds({ x: -2000, y: -100 }, workArea), {
    x: -1280, y: 0, ...BAG_OVERLAY_SIZE
  })
  assert.deepEqual(getBagOverlayDragBounds({ x: 100, y: 1000 }, workArea), {
    x: -188, y: 656, ...BAG_OVERLAY_SIZE
  })
  assert.deepEqual(getBagOverlayDragBounds(
    { x: 50, y: 50 },
    { x: 10, y: 20, width: 100, height: 40 }
  ), {
    x: 10, y: 20, ...BAG_OVERLAY_SIZE
  })
})

test('专用浮层保持不抢焦点、独立路由、拖动与统一 IPC 状态', () => {
  const manager = source('../electron/modules/window/manager.js')
  const router = source('../src/router/index.js')
  const view = source('../src/domains/bag/BagStashOverlayView.vue')
  const ipc = source('../electron/modules/ipc/bag.js')
  const shortcuts = source('../src/utils/scriptService.js')
  const bagPage = source('../src/domains/bag/BagView.vue')
  const moveHandler = ipc.slice(
    ipc.indexOf("ipcMain.on('bag-stash-overlay-move'"),
    ipc.indexOf("ipcMain.handle('stop-bag-stash'")
  )
  const movePhase = moveHandler.slice(moveHandler.indexOf("if (point.phase !== 'move')"))

  assert.match(manager, /let bagStashOverlayWindow = null/)
  assert.match(manager, /focusable: false/)
  assert.match(manager, /showInactive\(\)/)
  assert.match(manager, /bagStashOverlayBounds/)
  assert.match(manager, /export function getBagStashOverlayWindow\(\)/)
  assert.match(router, /path: '\/bag-stash-overlay'/)
  assert.match(view, /createOverlayDrag/)
  assert.match(view, /@pointerdown="drag\.pointerDown"/)
  assert.match(view, /@pointerdown\.stop\.prevent="startStashFromPointer"/)
  assert.match(view, /grid-template-columns: 28px 1fr/)
  assert.match(view, /-webkit-app-region: no-drag/)
  assert.match(view, /electronApi\.bag\.startStash\(\)/)
  assert.match(ipc, /createBagOverlaySnapshot/)
  assert.match(ipc, /update-bag-preferences/)
  assert.match(ipc, /bag-stash-overlay-move/)
  assert.match(ipc, /getBagStashOverlayWindow/)
  assert.match(movePhase, /overlay\.setBounds\(getBagOverlayDragBounds\(/)
  assert.doesNotMatch(movePhase, /overlay\.getBounds\(\)/)
  assert.doesNotMatch(movePhase, /overlay\.setPosition\(/)
  assert.match(ipc, /new OverlayDragSession\(\)/)
  assert.doesNotMatch(shortcuts, /stashStart:/)
  assert.doesNotMatch(bagPage, /手动补扫快捷键|>手动补扫</)
})
