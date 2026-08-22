import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  getStoryDividerGripBounds,
  getStoryDividerRatioFromGrip,
  isPointInStoryDividerGrip,
  storyOverlayBoundsEqual
} from '../electron/modules/window/storyGrip.js'
import {
  OVERLAY_DRAG_HIT_HEIGHT,
  OVERLAY_DRAG_HIT_WIDTH,
  STORY_OVERLAY_DRAG_HIT_TOP,
  isPointInCenteredOverlayDragHandle
} from '../electron/modules/window/overlayDrag.js'
import { createStoryOverlayGeometryReporter } from '../src/domains/story/storyOverlayGeometry.js'

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

test('剧情浮窗使用统一指针拖动抓手且其余内容保持穿透', () => {
  const manager = source('../electron/modules/window/manager.js')
  const overlay = source('../src/domains/story/StoryOverlayView.vue')
  assert.doesNotMatch(manager, /storyOverlayGripWindow|createStoryGripWindow/)
  assert.match(manager, /storyOverlayWindow\.setIgnoreMouseEvents\(true, \{ forward: true \}\)/)
  assert.match(manager, /screen\.getCursorScreenPoint\(\)/)
  assert.match(manager, /new OverlayDragPassthroughController/)
  assert.match(manager, /isPointInCenteredOverlayDragHandle\(point, bounds, STORY_OVERLAY_DRAG_HIT_TOP\)/)
  assert.match(overlay, /class="story-position-grip"/)
  assert.match(overlay, /<div class="overlay-heading">[\s\S]*class="story-position-grip"[\s\S]*<\/div>/)
  assert.match(overlay, /createOverlayDrag/)
  assert.match(overlay, /@pointerdown="drag\.pointerDown"/)
  assert.match(overlay, /-webkit-app-region: no-drag/)
  assert.doesNotMatch(overlay, /setIgnoreMouseEvents|updatePositionGripHitTest/)
  assert.match(overlay, /cursor: grab/)
  assert.match(overlay, /cursor: grabbing/)
  assert.doesNotMatch(overlay, /drag-tip|拖动上方三点调整位置/)
})

test('主进程按屏幕坐标稳定命中位置抓手热区', () => {
  const bounds = { x: 100, y: 50, width: 460, height: 220 }
  assert.equal(OVERLAY_DRAG_HIT_WIDTH, 72)
  assert.equal(OVERLAY_DRAG_HIT_HEIGHT, 24)
  assert.equal(STORY_OVERLAY_DRAG_HIT_TOP, 4)
  assert.equal(isPointInCenteredOverlayDragHandle({ x: 330, y: 62 }, bounds), true)
  assert.equal(isPointInCenteredOverlayDragHandle({ x: 293, y: 62 }, bounds), false)
  assert.equal(isPointInCenteredOverlayDragHandle({ x: 330, y: 75 }, bounds), false)
})

test('位置抓手复用自动入库的固定起点拖动且始终恢复规范尺寸', () => {
  const manager = source('../electron/modules/window/manager.js')
  const preload = source('../electron/preload.cjs')
  const ipc = source('../electron/modules/ipc/window.js')
  const storyWindow = manager.slice(manager.indexOf('export function createStoryOverlayWindow'), manager.indexOf('export function resizeStoryOverlay'))
  assert.match(manager, /let storyOverlaySize = \{ width: 460, height: 220 \}/)
  assert.doesNotMatch(storyWindow, /setPosition|window-move|getStoryOverlayPositionFromGrip/)
  assert.doesNotMatch(manager, /storyOverlayGripWindow/)
  assert.match(manager, /requestedHeight == null \? storyOverlaySize\.height/)
  assert.match(manager, /requestedWidth == null \? storyOverlaySize\.width/)
  assert.match(manager, /export function setStoryOverlayDragging[\s\S]*storyOverlayDragPassthrough\.setDragging\(dragging\)/)
  assert.match(manager, /export function moveStoryOverlayTo[\s\S]*getFixedOverlayDragBounds\(point, display\.workArea, storyOverlaySize\)/)
  assert.match(ipc, /const storyOverlayDrag = new OverlayDragSession\(\)/)
  assert.match(ipc, /storyOverlayDrag\.begin/)
  assert.match(ipc, /window\.moveStoryOverlayTo\(requested\)/)
  assert.match(preload, /story-overlay-move/)
  assert.doesNotMatch(preload, /story-overlay-native-drag-ended/)
})

test('剧情浮窗几何上报会忽略未变化高度和布局', () => {
  const heights = []
  const layouts = []
  const report = createStoryOverlayGeometryReporter({
    resize: height => heights.push(height),
    updateLayout: layout => layouts.push(layout)
  })
  const geometry = { height: 201.4, layout: { stacked: false, left: 7, top: 30, width: 446, height: 160 } }

  report(geometry)
  report({ height: 201.49, layout: { ...geometry.layout } })
  assert.deepEqual(heights, [201])
  assert.equal(layouts.length, 1)

  report({ height: 203, layout: { ...geometry.layout, width: 440 } })
  assert.deepEqual(heights, [201, 203])
  assert.equal(layouts.length, 2)
})

test('剧情浮窗仅在原生边界实际改变时需要更新', () => {
  const current = { x: 100, y: 20, width: 460, height: 220 }
  assert.equal(storyOverlayBoundsEqual(current, { ...current }), true)
  assert.equal(storyOverlayBoundsEqual(current, { ...current, height: 221 }), false)
})

test('剧情浮窗布局上报不会回显分栏比例', () => {
  const manager = source('../electron/modules/window/manager.js')
  const handler = manager.slice(
    manager.indexOf('export function updateStoryOverlayLayout'),
    manager.indexOf('export function updateStoryOverlay(snapshot)')
  )
  assert.match(handler, /storyOverlayLayout\.width === nextLayout\.width/)
  assert.doesNotMatch(handler, /publishStoryDividerRatio/)
})

test('剧情浮窗宽度可输入并持久化，同组技能空间不足时换行', () => {
  const view = source('../src/domains/story/StoryView.vue')
  const overlay = source('../src/domains/story/StoryOverlayView.vue')
  const settings = source('../src/domains/settings/settingsStore.js')
  assert.match(view, /浮窗宽度/)
  assert.match(view, /settings\.storyOverlayWidth/)
  assert.match(settings, /storyOverlayWidth: storyOverlayWidth\.value/)
  assert.match(overlay, /\.skill-tags \{[^}]*flex-wrap: wrap;/)
  assert.doesNotMatch(overlay, /overflow-x: auto/)
})

test('剧情三类列表实时预览拖动位置并按最终索引提交', () => {
  const view = source('../src/domains/story/StoryView.vue')
  const store = source('../src/stores/story.js')
  assert.match(view, /const dragPreview = ref\(null\)/)
  assert.match(view, /displayedChapters = computed/)
  assert.match(view, /displayedSteps = computed/)
  assert.match(view, /displayedSkillGroups = computed/)
  assert.match(view, /event\.clientY >= bounds\.top \+ bounds\.height \/ 2/)
  assert.match(view, /nextIds\.splice\(destinationIndex, 0, preview\.movedId\)/)
  assert.match(view, /@dragend="clearDrag"/)
  assert.match(view, /story\.reorderChapter\(preview\.movedId, destinationIndex\)/)
  assert.match(view, /story\.reorderStep\(preview\.chapterId, preview\.movedId, destinationIndex\)/)
  assert.match(view, /story\.reorderSkillGroup\(preview\.chapterId, preview\.movedId, destinationIndex\)/)
  assert.match(view, /function clearDrag\(\) \{\s*dragPreview\.value = null/)
  assert.doesNotMatch(view, /dragOver|drag-over|startChapterDrag|startStepDrag|startSkillGroupDrag/)
  assert.match(store, /reorderItemsById\(chapters\.value, chapterId, destinationIndex\)/)
  assert.match(store, /reorderItemsById\(chapter\.steps, stepId, destinationIndex\)/)
  assert.match(store, /reorderItemsById\(groups, groupId, destinationIndex\)/)
  assert.match(view, /\.skill-group \{ cursor: pointer;/)
  assert.match(view, /\.drag-handle \{[^}]*cursor: grab;/)
  assert.match(view, /\.el-textarea__inner\), \.skill-group :deep\(\.el-input__inner\) \{ cursor: text; \}/)
})

test('剧情管理页合并章节模块并使用独立滚动区域', () => {
  const view = source('../src/domains/story/StoryView.vue')
  assert.match(view, /class="story-guide-panel"/)
  assert.match(view, /class="story-guide-layout"/)
  assert.match(view, /class="chapter-directory"/)
  assert.match(view, /class="chapter-details-scroll"/)
  assert.match(view, /\.chapter-directory \{[^}]*overflow-y: auto;/)
  assert.match(view, /\.chapter-details-scroll \{[^}]*overflow-y: auto;/)
  assert.match(view, /\.skills-panel :deep\(\.el-card__body\) \{ overflow-y: auto;/)
  assert.match(view, /\.story-workspace \{[^}]*overflow: hidden;/)
  assert.match(view, /\.story-workspace > \.el-col > \.el-card \{[^}]*height: 100%;[^}]*overflow: hidden;/)
  assert.match(view, /\.story-guide-panel :deep\(\.el-card__body\), \.skills-panel :deep\(\.el-card__body\) \{[^}]*flex: 1 1 0;/)
  assert.match(view, /\.story-guide-layout \{[^}]*grid-template-rows: minmax\(0, 1fr\);/)
  assert.match(view, /\.chapter-item:hover \{[^}]*background: var\(--surface-hover\);/)
  assert.doesNotMatch(view, /\.chapter-item:hover \{[^}]*transform:/)
  const directory = view.slice(view.indexOf('<aside class="chapter-directory">'), view.indexOf('</aside>'))
  const detailsHeader = view.slice(view.indexOf('<div class="chapter-details-header">'), view.indexOf('<div class="chapter-details-scroll">'))
  assert.doesNotMatch(directory, /confirmDeleteChapter/)
  assert.match(directory, /class="preset-bar chapter-preset-bar"/)
  assert.match(directory, /class="add-chapter-button"/)
  assert.doesNotMatch(directory, /class="add-chapter-button"[^>]*type="primary"/)
  assert.ok(directory.indexOf('chapter-preset-bar') < directory.indexOf('class="chapter-list"'))
  assert.ok(directory.indexOf('class="add-chapter-button"') > directory.indexOf('class="chapter-list"'))
  assert.doesNotMatch(view, /<strong>章节<\/strong>/)
  assert.doesNotMatch(view, /<template #header>[\s\S]*story\.currentStoryPresetId[\s\S]*<\/template>/)
  assert.match(view, /\.story-guide-layout \{[^}]*grid-template-columns: 240px minmax\(0, 1fr\);/)
  assert.match(view, /\.preset-bar :deep\(\.el-button \+ \.el-button\) \{ margin-left: 0; \}/)
  assert.match(detailsHeader, /@click="confirmDeleteChapter\(story\.viewedChapter\)"/)
  assert.match(detailsHeader, />删除章节<\/el-button>/)
})

test('浏览章节与步骤进度选择器解耦且快照使用进度技能', () => {
  const view = source('../src/domains/story/StoryView.vue')
  const store = source('../src/stores/story.js')
  const selectChapter = store.slice(store.indexOf('function selectChapter'), store.indexOf('function selectStep'))
  const addStep = store.slice(store.indexOf('function addStep'), store.indexOf('function deleteStep'))
  assert.match(view, /<el-radio/)
  assert.match(view, /@change="story\.selectStep/)
  assert.doesNotMatch(view, /@focus="story\.selectStep/)
  assert.doesNotMatch(selectChapter, /currentStepId/)
  assert.doesNotMatch(addStep, /selectStep/)
  assert.match(store, /viewedChapterId/)
  assert.match(store, /viewedSkillGroups/)
  assert.match(store, /buildStorySnapshot\([\s\S]*currentSkillGroups\.value/)
})

test('剧情浮窗使用紧凑默认尺寸和共享紧凑正文字号', () => {
  const manager = source('../electron/modules/window/manager.js')
  const overlay = source('../src/domains/story/StoryOverlayView.vue')
  const view = source('../src/domains/story/StoryView.vue')
  assert.match(manager, /Math\.max\(320, Math\.min\(1200/)
  assert.match(manager, /Math\.max\(150, Math\.min\(maxHeight/)
  assert.match(view, /:min="320"/)
  assert.match(overlay, /\.step\.current \{[^}]*font-size: var\(--overlay-font-size\);/)
  assert.match(overlay, /@media \(max-width: 380px\)/)
})

test('剧情技能编辑器使用离线联想并将等级设置同步到浮层', () => {
  const storyView = source('../src/domains/story/StoryView.vue')
  const overlayView = source('../src/domains/story/StoryOverlayView.vue')
  assert.match(storyView, /<el-autocomplete/)
  assert.match(storyView, /fetchSkillSuggestions/)
  assert.match(storyView, /skillCatalog\.skills/)
  assert.match(storyView, /显示最低购买等级/)
  assert.match(storyView, /settings\.storyShowSkillRequiredLevel/)
  assert.match(storyView, /skillSuggestionLabel\(skill\)/)
  assert.match(overlayView, /skill\.requiredLevel/)
})

test('剧情和技能预设独立管理并支持技能组排序与整章复制', () => {
  const view = source('../src/domains/story/StoryView.vue')
  const store = source('../src/stores/story.js')
  assert.match(view, /story\.currentStoryPresetId/)
  assert.match(view, /story\.currentSkillPresetId/)
  assert.match(view, /复制当前/)
  assert.match(view, /创建空白/)
  assert.match(view, /startDrag\(\$event, 'skill-group', group\.id\)/)
  assert.match(view, /复制到下一章/)
  assert.match(store, /reorderSkillGroup/)
  assert.match(store, /replaceChapterSkillGroups/)
})

test('剧情技能操作按层级放置复制和新增按钮', () => {
  const view = source('../src/domains/story/StoryView.vue')
  const panelHeader = view.slice(view.indexOf('<div class="panel-header">'), view.indexOf('</template>', view.indexOf('<div class="panel-header">')))
  const skillGroups = view.slice(view.indexOf('<div v-else class="skill-groups">'), view.indexOf('</el-card>', view.indexOf('<div v-else class="skill-groups">')))
  assert.match(panelHeader, /显示最低购买等级[\s\S]*复制到下一章/)
  assert.doesNotMatch(panelHeader, /story\.addSkillGroup/)
  assert.match(skillGroups, /class="add-skill-group-button"/)
  assert.match(skillGroups, /story\.addSkillGroup\(story\.viewedChapter\.id\)/)
  assert.doesNotMatch(skillGroups, /class="add-skill-group-button"[^>]*type="primary"/)
  assert.doesNotMatch(skillGroups, /class="add-skill-group-button"[^>]*size="small"/)
  assert.match(view, /\.panel-header \{ justify-content: space-between;/)
  assert.match(view, /\.add-skill-group-button \{ width: 100%; \}/)
})

test('原生分割抓手按规范布局计算比例并限制边界', () => {
  const overlay = { x: 100, y: 50, width: 560, height: 260 }
  const layout = { stacked: false, left: 10, top: 50, width: 540, height: 180 }
  assert.deepEqual(getStoryDividerGripBounds(overlay, layout, 0.64), {
    x: 449, y: 100, width: 14, height: 180
  })
  assert.equal(getStoryDividerGripBounds(overlay, { ...layout, stacked: true }, 0.64), null)
  assert.equal(getStoryDividerRatioFromGrip({ x: 0, y: 0, width: 14, height: 180 }, overlay, layout), 0.4)
  assert.equal(getStoryDividerRatioFromGrip({ x: 1000, y: 0, width: 14, height: 180 }, overlay, layout), 0.75)
  assert.equal(isPointInStoryDividerGrip({ x: 456, y: 150 }, overlay, layout, 0.64), true)
  assert.equal(isPointInStoryDividerGrip({ x: 448, y: 150 }, overlay, layout, 0.64), false)
})

test('分栏抓手与位置抓手共用剧情浮窗的指针拖动链路', () => {
  const manager = source('../electron/modules/window/manager.js')
  const ipc = source('../electron/modules/ipc/window.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const overlay = source('../src/domains/story/StoryOverlayView.vue')
  const mockStoryApi = api.slice(api.indexOf('storyOverlay: {'), api.indexOf('crafting: {', api.indexOf('storyOverlay: {')))
  assert.doesNotMatch(manager, /storyOverlayDividerWindow|createStoryDividerWindow|syncStoryDividerToOverlay/)
  assert.match(manager, /isPointInStoryDividerGrip\(point, bounds, storyOverlayLayout, storyOverlayDividerRatio\)/)
  assert.match(manager, /export function getStoryOverlayDividerBounds/)
  assert.match(manager, /export function moveStoryOverlayDividerTo/)
  assert.match(ipc, /const storyOverlayDividerDrag = new OverlayDragSession\(\)/)
  assert.match(ipc, /ipcMain\.on\('story-overlay-divider-drag'/)
  assert.match(ipc, /window\.setStoryOverlayDividerDragging\(true\)/)
  assert.match(ipc, /window\.moveStoryOverlayDividerTo\(requested\)/)
  assert.match(preload, /moveStoryOverlayDivider: \(drag\) => ipcRenderer\.send\('story-overlay-divider-drag'/)
  assert.match(api, /moveDivider: \(drag\) => window\.electronAPI\.moveStoryOverlayDivider/)
  assert.match(preload, /getStoryOverlayDividerRatio: \(\) => ipcRenderer\.invoke\('get-story-overlay-divider-ratio'\)/)
  assert.match(ipc, /ipcMain\.handle\('get-story-overlay-divider-ratio', \(\) => window\.getStoryOverlayDividerRatio\(\)\)/)
  assert.match(manager, /export function getStoryOverlayDividerRatio\(\) \{\s*return storyOverlayDividerRatio\s*\}/)
  assert.match(api, /getDividerRatio: \(\) => window\.electronAPI\.getStoryOverlayDividerRatio/)
  assert.match(mockStoryApi, /getDividerRatio: \(\) => Promise\.resolve\(0\.64\)/)
  assert.match(overlay, /electronApi\.storyOverlay\.getDividerRatio\?\.\(\)/)
  assert.match(overlay, /class="story-divider-grip"/)
  assert.match(overlay, /const dividerDrag = createOverlayDrag/)
})

test('内联分割抓手显示左右光标并在分割线两侧保留对称间距', () => {
  const manager = source('../electron/modules/window/manager.js')
  const preload = source('../electron/preload.cjs')
  const overlay = source('../src/domains/story/StoryOverlayView.vue')
  assert.match(overlay, /\.overlay-body \{[^}]*gap: 0;/)
  assert.match(overlay, /\.story-divider-grip \{[^}]*cursor: ew-resize;/)
  assert.match(overlay, /@pointerdown="dividerDrag\.pointerDown"/)
  assert.match(overlay, /\.steps \{[^}]*padding-right: var\(--overlay-space-2\);/)
  assert.match(overlay, /\.skills-section \{[^}]*padding: 5px var\(--overlay-space-2\) 1px;/)
  assert.match(overlay, /\.skills-section \{[^}]*border-left: 1px solid/)
  assert.doesNotMatch(overlay, /skills-title|本章技能/)
  assert.match(manager, /getStoryDividerRatioFromGrip/)
  assert.match(preload, /updateStoryOverlayLayout/)
  assert.match(preload, /onStoryOverlayDividerRatio/)
})

test('剧情浮窗关闭会原子销毁全部窗口且旧实例回调不会污染新窗口', () => {
  const manager = source('../electron/modules/window/manager.js')
  const closeHandler = manager.slice(
    manager.indexOf('export function closeStoryOverlayWindow()'),
    manager.indexOf('export function getStoryOverlayWindow()')
  )
  assert.match(manager, /const overlayWindow = storyOverlayWindow/)
  assert.match(manager, /storyOverlayWindow !== overlayWindow/)
  assert.doesNotMatch(manager, /storyOverlayDividerWindow|storyOverlayGripWindow|gripWindow/)
  assert.match(closeHandler, /const overlayWindow = storyOverlayWindow/)
  assert.ok(closeHandler.indexOf('storyOverlayWindow = null') < closeHandler.indexOf('destroyWindow\(overlayWindow\)'))
  assert.match(closeHandler, /destroyWindow\(overlayWindow\)/)
  assert.doesNotMatch(closeHandler, /\.close\(\)/)
})

test('浮层透明度以 0 到 100 数值持久化并实时同步', () => {
  const view = source('../src/domains/story/StoryView.vue')
  const settings = source('../src/domains/settings/settingsStore.js')
  const manager = source('../electron/modules/window/manager.js')
  assert.match(view, /透明度/)
  assert.match(view, /:min="0"/)
  assert.match(view, /:max="100"/)
  assert.match(settings, /storyOverlayOpacity: storyOverlayOpacity\.value/)
  assert.match(settings, /electronApi\.storyOverlay\.setOpacity/)
  assert.match(manager, /storyOverlayWindow\.setOpacity\(nativeOpacity\)/)
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
