<template>
  <div ref="content" class="story-overlay">
    <div class="overlay-heading">
      <span>{{ hasContent ? (state.chapter?.name || '剧情攻略') : '剧情计时' }}</span>
      <div class="story-position-grip" title="拖动剧情浮窗"
        @pointerdown="drag.pointerDown"
        @pointermove="drag.pointerMove"
        @pointerup="drag.pointerUp"
        @pointercancel="drag.pointerUp">
        <span></span><span></span><span></span>
      </div>
    </div>

    <div class="overlay-modules" :class="{ 'has-timer': state.timer.enabled, 'has-content': hasContent }">
      <section v-if="state.timer.enabled" class="timer-section">
        <strong>{{ formattedTimer }}</strong>
        <span v-if="state.timer.status !== 'running'" class="timer-state">{{ timerStatusLabel }}</span>
      </section>

      <div v-if="hasContent" ref="body" class="overlay-body" :class="{ single: !showDivider }" :style="bodyStyle">
      <div v-if="state.modules.story && state.current" class="steps">
        <div class="step neighbor">
          <span class="direction">上一步</span>
          <span v-if="state.previous" class="step-text">
            <em v-if="state.previous.chapterId !== state.current.chapterId">{{ state.previous.chapterName }}</em>
            {{ state.previous.text || '未填写步骤' }}
          </span>
          <span v-else class="boundary">已经是第一步</span>
        </div>
        <div class="step current">
          <span class="direction">当前步骤</span>
          <span class="step-text">{{ state.current.text || '未填写步骤' }}</span>
        </div>
        <div class="step neighbor">
          <span class="direction">下一步</span>
          <span v-if="state.next" class="step-text">
            <em v-if="state.next.chapterId !== state.current.chapterId">{{ state.next.chapterName }}</em>
            {{ state.next.text || '未填写步骤' }}
          </span>
          <span v-else class="boundary">已经是最后一步</span>
        </div>
      </div>
      <div v-else-if="state.modules.story" class="empty-state">暂无剧情步骤</div>

      <div v-if="state.modules.skills && state.chapter?.skillGroups?.length" class="skills-section">
        <div v-for="group in state.chapter.skillGroups" :key="group.id" class="skill-group">
          <span class="group-name">{{ group.name || '未命名技能组' }}</span>
          <div class="skill-tags">
            <span v-for="skill in group.skills" :key="skill.id" class="skill-tag" :class="skill.color">
              {{ skill.name }}<template v-if="Number.isInteger(skill.requiredLevel)">({{ skill.requiredLevel }})</template>
            </span>
          </div>
        </div>
      </div>
      <div v-else-if="state.modules.skills" class="skills-section empty-state">本章暂无技能</div>
      <div v-if="showDivider" class="story-divider-grip" :style="dividerStyle" title="拖动调整剧情与技能栏宽"
        @pointerdown="dividerDrag.pointerDown"
        @pointermove="dividerDrag.pointerMove"
        @pointerup="dividerDrag.pointerUp"
        @pointercancel="dividerDrag.pointerUp"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { electronApi } from '@/api/electron'
import { createOverlayDrag } from '@/utils/useOverlayDrag'
import { createStoryOverlayGeometryReporter } from './storyOverlayGeometry.js'
import { formatStoryTimerDuration } from '@/utils/storyTimer'

const content = ref(null)
const body = ref(null)
const dividerRatio = ref(0.64)
const state = reactive({
  previous: null,
  current: null,
  next: null,
  chapter: null,
  modules: { story: true, skills: true },
  timer: { enabled: false, status: 'idle', elapsedMs: 0 }
})
const hasContent = computed(() => state.modules.story || state.modules.skills)
const showDivider = computed(() => state.modules.story && state.modules.skills)
const formattedTimer = computed(() => formatStoryTimerDuration(state.timer.elapsedMs))
const timerStatusLabel = computed(() => state.timer.status === 'running' ? '计时中' : state.timer.status === 'paused' ? '已暂停' : '未开始')
const bodyStyle = computed(() => ({
  gridTemplateColumns: showDivider.value ? `${dividerRatio.value}fr ${1 - dividerRatio.value}fr` : '1fr'
}))
const dividerStyle = computed(() => ({ left: `${dividerRatio.value * 100}%` }))
const drag = createOverlayDrag((message) => electronApi.storyOverlay.move(message))
const dividerDrag = createOverlayDrag((message) => electronApi.storyOverlay.moveDivider(message))
let removeStateListener = null
let removeDividerListener = null
let observer = null
let geometryFrame = null
const reportGeometry = createStoryOverlayGeometryReporter({
  resize: height => electronApi.storyOverlay.resize(height),
  updateLayout: layout => electronApi.storyOverlay.updateLayout(layout)
})

function applyState(snapshot = {}) {
  state.previous = snapshot.previous || null
  state.current = snapshot.current || null
  state.next = snapshot.next || null
  state.chapter = snapshot.chapter || null
  state.modules = {
    story: snapshot.modules?.story !== false,
    skills: snapshot.modules?.skills !== false
  }
  state.timer = {
    enabled: snapshot.timer?.enabled === true,
    status: ['idle', 'running', 'paused'].includes(snapshot.timer?.status) ? snapshot.timer.status : 'idle',
    elapsedMs: Math.max(0, Number(snapshot.timer?.elapsedMs) || 0)
  }
  nextTick(scheduleGeometryReport)
}

function applyDividerRatio(value) {
  const ratio = Number(value)
  if (!Number.isFinite(ratio)) return
  const normalized = Math.max(0.4, Math.min(0.75, ratio))
  if (normalized === dividerRatio.value) return
  dividerRatio.value = normalized
  nextTick(scheduleGeometryReport)
}

function measureGeometry() {
  if (!content.value) return
  if (!body.value) {
    reportGeometry({
      height: content.value.scrollHeight + 4,
      layout: { stacked: true, left: 0, top: 0, width: 0, height: 0 }
    })
    return
  }
  const contentRect = content.value.getBoundingClientRect()
  const bodyRect = body.value.getBoundingClientRect()
  const columns = getComputedStyle(body.value).gridTemplateColumns.trim().split(/\s+/)
  reportGeometry({
    height: content.value.scrollHeight + 4,
    layout: {
      stacked: !showDivider.value || columns.length < 2,
      left: bodyRect.left - contentRect.left,
      top: bodyRect.top - contentRect.top,
      width: bodyRect.width,
      height: bodyRect.height
    }
  })
}

function scheduleGeometryReport() {
  if (geometryFrame != null) return
  geometryFrame = requestAnimationFrame(() => {
    geometryFrame = null
    measureGeometry()
  })
}

onMounted(async () => {
  removeStateListener = electronApi.storyOverlay.onState(applyState)
  removeDividerListener = electronApi.storyOverlay.onDividerRatio(applyDividerRatio)
  const [initialState, initialDividerRatio] = await Promise.all([
    electronApi.storyOverlay.getState?.(),
    electronApi.storyOverlay.getDividerRatio?.()
  ])
  applyDividerRatio(initialDividerRatio)
  if (initialState) applyState(initialState)
  observer = new ResizeObserver(scheduleGeometryReport)
  if (content.value) observer.observe(content.value)
  if (body.value) observer.observe(body.value)
  nextTick(scheduleGeometryReport)
})

onBeforeUnmount(() => {
  removeStateListener?.()
  removeDividerListener?.()
  observer?.disconnect()
  if (geometryFrame != null) cancelAnimationFrame(geometryFrame)
})
</script>

<style scoped lang="less">
.story-overlay { position: relative; width: 100%; box-sizing: border-box; padding: var(--overlay-space-2); color: var(--text-primary); background: linear-gradient(145deg, var(--overlay-surface), var(--overlay-surface-raised)); border: 1px solid var(--overlay-border); border-radius: var(--overlay-radius-md); box-shadow: var(--overlay-shadow); font: var(--overlay-font-size)/1.4 var(--font-ui); }
.story-position-grip { position: absolute; top: 4px; left: 50%; z-index: 2; display: flex; width: 72px; height: 24px; align-items: center; justify-content: center; gap: 5px; transform: translateX(-50%); cursor: grab; pointer-events: auto; touch-action: none; user-select: none; -webkit-app-region: no-drag; }
.story-position-grip::before { position: absolute; width: 46px; height: 16px; box-sizing: border-box; border: 1px solid var(--overlay-border); border-radius: var(--overlay-radius-md); background: var(--surface-2); box-shadow: var(--overlay-shadow); content: ''; }
.story-position-grip:active { cursor: grabbing; }
.story-position-grip span { z-index: 1; width: 4px; height: 4px; border-radius: 50%; background: var(--brand-color); box-shadow: 0 0 4px color-mix(in srgb, var(--brand-color) 70%, transparent); }
.overlay-heading { display: flex; min-height: 24px; align-items: center; padding: 0 var(--overlay-space-1) var(--overlay-space-1); font-size: var(--overlay-font-size); font-weight: 700; color: color-mix(in srgb, var(--brand-color) 78%, white); }
.overlay-modules { min-width: 0; }
.overlay-modules.has-timer.has-content { display: grid; grid-template-columns: 120px minmax(0, 1fr); align-items: stretch; }
.timer-section { display: flex; min-width: 0; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: var(--overlay-space-2); box-sizing: border-box; text-align: center; }
.overlay-modules.has-content .timer-section { border-right: 1px solid rgba(255, 255, 255, .12); }
.timer-section strong { font-family: Consolas, monospace; font-size: 22px; line-height: 1.15; color: color-mix(in srgb, var(--brand-color) 82%, white); }
.timer-state { font-size: 10px; color: #a7afbf; }
.overlay-body { position: relative; display: grid; gap: 0; align-items: start; }
.story-divider-grip { position: absolute; top: 0; bottom: 0; z-index: 3; width: 14px; transform: translateX(-50%); cursor: ew-resize; touch-action: none; user-select: none; -webkit-app-region: no-drag; }
.steps { display: flex; min-width: 0; flex-direction: column; gap: 4px; padding-right: var(--overlay-space-2); }
.step { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 5px; align-items: start; border-radius: 6px; padding: 5px 7px; line-height: 1.4; }
.step.neighbor { font-size: 11px; color: #a7afbf; background: rgba(255, 255, 255, .035); opacity: .72; }
.step.current { padding: var(--overlay-space-2) var(--overlay-space-3); font-size: var(--overlay-font-size); font-weight: 700; line-height: 1.45; background: color-mix(in srgb, var(--brand-color) 16%, var(--surface-2)); border: 1px solid var(--overlay-border); text-shadow: 0 1px 2px #000; }
.direction { white-space: nowrap; color: color-mix(in srgb, var(--brand-color) 78%, white); }
.step-text { min-width: 0; white-space: pre-wrap; word-break: break-word; }
.step-text em { display: inline-block; margin-right: 4px; padding: 0 4px; border-radius: 3px; font-style: normal; font-size: 9px; background: color-mix(in srgb, var(--brand-color) 16%, var(--surface-2)); color: color-mix(in srgb, var(--brand-color) 72%, white); }
.boundary { color: #727b8d; }
.empty-state { padding: 24px 8px; text-align: center; font-size: 11px; color: #8790a0; }
.skills-section { min-width: 0; padding: 5px var(--overlay-space-2) 1px; border-left: 1px solid rgba(255, 255, 255, .12); container-type: inline-size; }
.overlay-body.single .skills-section { border-left: 0; }
.skill-group { display: grid; grid-template-columns: minmax(48px, 70px) minmax(0, 1fr); gap: 5px; margin-bottom: 5px; align-items: start; }
.group-name { min-width: 0; padding-top: 2px; overflow: hidden; color: #c6cedb; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.skill-tags { display: flex; min-width: 0; flex-wrap: wrap; gap: 3px; overflow-x: visible; }
.skill-tag { flex: 0 1 auto; max-width: 100%; padding: 2px 5px; border: 1px solid; border-radius: 7px; font-size: 10px; line-height: 1.25; overflow-wrap: anywhere; }
.skill-tag.red { color: #ffb1b1; background: rgba(204, 50, 50, .22); border-color: rgba(255, 91, 91, .42); }
.skill-tag.green { color: #aef0b5; background: rgba(35, 151, 67, .22); border-color: rgba(72, 206, 100, .42); }
.skill-tag.blue { color: #acd4ff; background: rgba(45, 112, 201, .24); border-color: rgba(78, 149, 239, .46); }
.skill-tag.white { color: #fff; background: rgba(230, 234, 242, .16); border-color: rgba(245, 247, 250, .62); }
@container (max-width: 140px) {
  .skill-group { grid-template-columns: minmax(0, 1fr); gap: 3px; }
  .group-name { white-space: normal; }
}
@media (max-width: 380px) {
  .overlay-body { grid-template-columns: 1fr !important; }
  .story-divider-grip { display: none; }
  .steps { padding-right: 0; }
  .skills-section { border-top: 1px solid rgba(255, 255, 255, .12); border-left: 0; }
}
@media (max-width: 439px) {
  .overlay-modules.has-timer.has-content { grid-template-columns: 1fr; }
  .overlay-modules.has-content .timer-section { border-right: 0; border-bottom: 1px solid rgba(255, 255, 255, .12); }
}
</style>
