import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

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
