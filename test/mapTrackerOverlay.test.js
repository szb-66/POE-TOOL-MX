import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { defaultMapTrackerOverlayBounds, shouldShowMapTrackerOverlay } from '../electron/modules/mapTracker/overlayPolicy.js'

const snapshot = (overrides = {}) => ({ foreground: true, activeRun: {}, settings: { enabled: true, paused: false, overlay: { enabled: true }, ...overrides } })

test('浮窗启用后在游戏前台常显，包括等待地图与暂停状态', () => {
  assert.equal(shouldShowMapTrackerOverlay(snapshot()), true)
  assert.equal(shouldShowMapTrackerOverlay({ ...snapshot(), foreground: false }), false)
  assert.equal(shouldShowMapTrackerOverlay(snapshot({ paused: true })), true)
  assert.equal(shouldShowMapTrackerOverlay({ ...snapshot(), activeRun: null }), true)
  assert.equal(shouldShowMapTrackerOverlay(snapshot({ overlay: { enabled: false } })), false)
})

test('浮窗默认位置遵循显示器工作区并保留 DPI 后坐标', () => {
  assert.deepEqual(defaultMapTrackerOverlayBounds({ x: 100, y: 50, width: 1600, height: 900 }), { x: 1436, y: 74, width: 240, height: 88 })
})

test('浮窗管理器默认点击穿透并持久化移动位置', () => {
  const code = readFileSync(new URL('../electron/modules/mapTracker/overlay.js', import.meta.url), 'utf8')
  assert.match(code, /setIgnoreMouseEvents\(true/); assert.match(code, /this\.window\.on\('moved'/); assert.match(code, /updateSettings\(\{ overlay:/)
  assert.doesNotMatch(code, /requested|setHeld/); assert.doesNotMatch(code, /interactive|setFocusable/)
})

test('浮窗拖动抓手仅在显示时解除穿透且拖拽中不逐帧持久化', () => {
  const code = readFileSync(new URL('../electron/modules/mapTracker/overlay.js', import.meta.url), 'utf8')
  assert.match(code, /OverlayDragPassthroughController/); assert.match(code, /OverlayDragSession/)
  assert.match(code, /isPointInCenteredOverlayDragHandle\(point, bounds\)/)
  assert.match(code, /win\?\.isVisible\(\)\) && this\.shouldShow\(\)/)
  assert.match(code, /if \(this\.dragSession\.active\) return/)
  assert.match(code, /focusable: false/)
})

test('浮窗拖拽 IPC 通道钳制工作区并在结束时持久化位置', () => {
  const code = readFileSync(new URL('../electron/modules/ipc/mapTracker.js', import.meta.url), 'utf8')
  assert.match(code, /'map-tracker:overlay-move'/)
  assert.match(code, /win\.webContents !== event\.sender/)
  assert.match(code, /getFixedOverlayDragBounds\(requested, workArea, MAP_TRACKER_OVERLAY_SIZE\)/)
  assert.doesNotMatch(code, /getFixedOverlayDragBounds\(requested, workArea, win\.getBounds\(\)\)/)
  assert.match(code, /session\.begin\(event\.sender\.id, point, win\.getBounds\(\)\)\) overlay\.setDragging\(true\)/)
  assert.match(code, /if \(!session\.end\(event\.sender\.id\)\) return\s*\n\s*overlay\.setDragging\(false\)/)
})

test('浮窗视图提供拖动抓手并复用共享拖拽手势', () => {
  const view = readFileSync(new URL('../src/domains/mapTracker/MapTrackerOverlayView.vue', import.meta.url), 'utf8')
  assert.match(view, /class="drag-handle"/)
  assert.match(view, /createOverlayDrag\(message => electronApi\.mapTracker\.moveOverlay\(message\)\)/)
  const api = readFileSync(new URL('../src/api/electron.js', import.meta.url), 'utf8')
  assert.match(api, /moveOverlay: \(drag\) => window\.electronAPI\.moveMapTrackerOverlay\?/)
  const preload = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
  assert.match(preload, /moveMapTrackerOverlay: \(point\) => ipcRenderer\.send\('map-tracker:overlay-move', point\)/)
})
