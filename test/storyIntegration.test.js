import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  STORY_GRIP_HTML,
  getStoryGripBounds,
  getStoryOverlayBoundsFromGrip,
  getStoryOverlayPositionFromGrip
} from '../electron/modules/window/storyGrip.js'

function source(path) {
  return fs.readFileSync(new URL(path, import.meta.url), 'utf8')
}

test('剧情浮窗使用独立窗口、路由和 IPC，不复用制作浮窗', () => {
  const manager = source('../electron/modules/window/manager.js')
  const router = source('../src/router/index.js')
  const ipc = source('../electron/modules/ipc/window.js')
  assert.match(manager, /let overlayWindow = null/)
  assert.match(manager, /let storyOverlayWindow = null/)
  assert.match(manager, /createStoryOverlayWindow/)
  assert.match(router, /path: '\/story-overlay'/)
  assert.match(ipc, /open-story-overlay/)
  assert.match(ipc, /update-story-overlay/)
})

test('覆盖层渲染进程不会重复初始化全局快捷键服务', () => {
  const app = source('../src/App.vue')
  assert.match(app, /if \(route\.meta\.noLayout\) return/)
})

test('剧情浮窗保存位置、恢复屏幕可见性并限制内容高度', () => {
  const manager = source('../electron/modules/window/manager.js')
  assert.match(manager, /storyOverlayBounds/)
  assert.match(manager, /screen\.getAllDisplays/)
  assert.match(manager, /display\.workArea\.height \* 0\.7/)
  assert.match(manager, /configuredWidth/)
  assert.match(manager, /requestedWidth/)
})

test('剧情浮窗使用独立原生三点抓手且内容窗口保持穿透', () => {
  const manager = source('../electron/modules/window/manager.js')
  const overlay = source('../src/domains/story/StoryOverlayView.vue')
  assert.match(manager, /let storyOverlayGripWindow = null/)
  assert.match(manager, /createStoryGripWindow/)
  assert.doesNotMatch(manager, /parent: storyOverlayWindow/)
  assert.match(manager, /storyOverlayWindow\.setIgnoreMouseEvents\(true, \{ forward: true \}\)/)
  assert.doesNotMatch(manager, /storyOverlayWindow\.setIgnoreMouseEvents\(Boolean/)
  assert.match(STORY_GRIP_HTML, /-webkit-app-region:drag/)
  assert.equal((STORY_GRIP_HTML.match(/<i><\/i>/g) || []).length, 3)
  assert.doesNotMatch(overlay, /setIgnoreMouseEvents|story-drag-handle|@mouseenter/)
})

test('抓手与剧情内容窗口保持固定相对位置并传播拖动位移', () => {
  const overlay = { x: 1000, y: 20, width: 560, height: 240 }
  const grip = getStoryGripBounds(overlay)
  assert.deepEqual(grip, { x: 1254, y: 24, width: 52, height: 20 })
  assert.deepEqual(getStoryOverlayPositionFromGrip({ ...grip, x: grip.x + 135, y: grip.y + 47 }, overlay), {
    x: 1135,
    y: 67
  })
})

test('拖动抓手从规范尺寸生成完整边界，避免 DPI 取整误差累积', () => {
  const manager = source('../electron/modules/window/manager.js')
  const gripMoveHandler = manager.slice(
    manager.indexOf("storyOverlayGripWindow.on('move'"),
    manager.indexOf("storyOverlayGripWindow.on('closed'")
  )
  const overlayMoveHandler = manager.slice(
    manager.indexOf("storyOverlayWindow.on('move'"),
    manager.indexOf("storyOverlayWindow.on('closed'")
  )
  assert.match(manager, /let storyOverlaySize = \{ width: 560, height: 360 \}/)
  assert.match(gripMoveHandler, /getStoryOverlayBoundsFromGrip\(gripBounds, overlayBounds, storyOverlaySize\)/)
  assert.match(gripMoveHandler, /storyOverlayWindow\.setBounds\(next\)/)
  assert.doesNotMatch(gripMoveHandler, /storyOverlayWindow\.setPosition/)
  assert.match(manager, /requestedHeight == null \? storyOverlaySize\.height/)
  assert.match(manager, /requestedWidth == null \? storyOverlaySize\.width/)
  assert.doesNotMatch(overlayMoveHandler, /syncStoryGripToOverlay/)
})

test('Windows DPI 取整后的原生尺寸不会反馈进下一次拖动', () => {
  const canonicalSize = { width: 560, height: 247 }
  const driftedNativeBounds = { x: 1308, y: 82, width: 561, height: 248 }
  const gripBounds = { x: 1563, y: 86, width: 53, height: 20 }
  assert.deepEqual(
    getStoryOverlayBoundsFromGrip(gripBounds, driftedNativeBounds, canonicalSize),
    { x: 1309, y: 82, width: 560, height: 247 }
  )
})

test('剧情浮窗宽度可输入并持久化，同组技能保持水平排列', () => {
  const view = source('../src/domains/story/StoryView.vue')
  const overlay = source('../src/domains/story/StoryOverlayView.vue')
  const settings = source('../src/domains/settings/settingsStore.js')
  assert.match(view, /浮窗宽度/)
  assert.match(view, /settings\.storyOverlayWidth/)
  assert.match(settings, /storyOverlayWidth: storyOverlayWidth\.value/)
  assert.match(overlay, /\.skill-tags \{ display: flex; flex-wrap: nowrap;/)
})

test('剧情章节和步骤界面通过稳定 ID 调用拖动排序', () => {
  const view = source('../src/domains/story/StoryView.vue')
  const store = source('../src/stores/story.js')
  assert.match(view, /startChapterDrag/)
  assert.match(view, /dropStep/)
  assert.match(store, /reorderItemsById\(chapters\.value/)
  assert.match(store, /reorderItemsById\(chapter\.steps/)
})

test('组合键捕获期间挂起全局快捷键并在提交前恢复', () => {
  const ipc = source('../electron/modules/ipc/shortcut.js')
  const preload = source('../electron/preload.cjs')
  const capture = source('../src/components/common/KeyCaptureInput.vue')
  assert.match(ipc, /begin-shortcut-capture/)
  assert.match(ipc, /end-shortcut-capture/)
  assert.match(preload, /beginShortcutCapture/)
  assert.ok(capture.indexOf('await stopCapture()') < capture.indexOf("emit('change', result.value)"))
})
