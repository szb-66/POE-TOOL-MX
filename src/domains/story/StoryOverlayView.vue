<template>
  <div ref="content" class="story-overlay">
    <div class="story-position-grip" title="拖动剧情浮窗"
      @pointerdown="drag.pointerDown"
      @pointermove="drag.pointerMove"
      @pointerup="drag.pointerUp"
      @pointercancel="drag.pointerUp">
      <span></span><span></span><span></span>
    </div>
    <div class="overlay-heading">
      <span>{{ state.chapter?.name || '剧情攻略' }}</span>
      <span class="drag-tip">拖动上方三点调整位置</span>
    </div>

    <div ref="body" class="overlay-body" :style="bodyStyle">
      <div v-if="state.current" class="steps">
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
      <div v-else class="empty-state">暂无剧情步骤</div>

      <div v-if="state.chapter?.skillGroups?.length" class="skills-section">
        <div class="skills-title">本章技能</div>
        <div v-for="group in state.chapter.skillGroups" :key="group.id" class="skill-group">
          <span class="group-name">{{ group.name || '未命名技能组' }}</span>
          <div class="skill-tags">
            <span v-for="skill in group.skills" :key="skill.id" class="skill-tag" :class="skill.color">
              {{ skill.name }}<template v-if="Number.isInteger(skill.requiredLevel)">({{ skill.requiredLevel }})</template>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { electronApi } from '@/api/electron'
import { createOverlayDrag } from '@/utils/useOverlayDrag'
import { createStoryOverlayGeometryReporter } from './storyOverlayGeometry.js'

const content = ref(null)
const body = ref(null)
const dividerRatio = ref(0.64)
const state = reactive({ previous: null, current: null, next: null, chapter: null })
const bodyStyle = computed(() => ({
  gridTemplateColumns: `${dividerRatio.value}fr ${1 - dividerRatio.value}fr`
}))
const drag = createOverlayDrag((message) => electronApi.storyOverlay.move(message))
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
    reportGeometry({ height: content.value.scrollHeight + 4 })
    return
  }
  const contentRect = content.value.getBoundingClientRect()
  const bodyRect = body.value.getBoundingClientRect()
  const columns = getComputedStyle(body.value).gridTemplateColumns.trim().split(/\s+/)
  reportGeometry({
    height: content.value.scrollHeight + 4,
    layout: {
      stacked: columns.length < 2,
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
  const initialState = await electronApi.storyOverlay.getState?.()
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
.story-overlay { position: relative; width: 100%; box-sizing: border-box; padding: 20px 7px 7px; color: #f5f7fa; background: linear-gradient(145deg, rgba(14, 18, 27, .94), rgba(31, 38, 52, .92)); border: 1px solid rgba(130, 170, 255, .36); border-radius: 10px; box-shadow: 0 8px 22px rgba(0, 0, 0, .42); font-family: "Microsoft YaHei", sans-serif; }
.story-position-grip { position: absolute; top: 0; left: 50%; z-index: 2; display: flex; width: 72px; height: 24px; align-items: center; justify-content: center; gap: 5px; transform: translateX(-50%); cursor: grab; pointer-events: auto; touch-action: none; user-select: none; -webkit-app-region: no-drag; }
.story-position-grip::before { position: absolute; width: 46px; height: 16px; box-sizing: border-box; border: 1px solid rgba(169, 199, 255, .86); border-radius: 9px; background: rgba(42, 63, 96, .96); box-shadow: 0 2px 8px rgba(0, 0, 0, .48); content: ''; }
.story-position-grip:active { cursor: grabbing; }
.story-position-grip span { z-index: 1; width: 4px; height: 4px; border-radius: 50%; background: #d9e7ff; box-shadow: 0 0 4px rgba(169, 199, 255, .9); }
.overlay-heading { display: flex; justify-content: space-between; align-items: center; padding: 0 5px 6px; font-size: 12px; font-weight: 700; color: #a9c7ff; }
.drag-tip { font-size: 9px; font-weight: 400; opacity: .42; }
.overlay-body { display: grid; gap: 6px; align-items: start; }
.steps { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
.step { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 5px; align-items: start; border-radius: 6px; padding: 5px 7px; line-height: 1.4; }
.step.neighbor { font-size: 11px; color: #a7afbf; background: rgba(255, 255, 255, .035); opacity: .72; }
.step.current { padding: 7px 8px; font-size: 14px; font-weight: 700; line-height: 1.45; background: rgba(71, 125, 230, .25); border: 1px solid rgba(109, 158, 255, .52); text-shadow: 0 1px 2px #000; }
.direction { white-space: nowrap; color: #83aefc; }
.step-text { min-width: 0; white-space: pre-wrap; word-break: break-word; }
.step-text em { display: inline-block; margin-right: 4px; padding: 0 4px; border-radius: 3px; font-style: normal; font-size: 9px; background: rgba(105, 148, 228, .25); color: #b8d1ff; }
.boundary { color: #727b8d; }
.empty-state { padding: 24px 8px; text-align: center; font-size: 11px; color: #8790a0; }
.skills-section { min-width: 0; padding: 5px 7px 1px; border-left: 1px solid rgba(255, 255, 255, .12); container-type: inline-size; }
.skills-title { margin-bottom: 5px; font-size: 10px; color: #96a2b6; }
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
  .skills-section { border-top: 1px solid rgba(255, 255, 255, .12); border-left: 0; }
}
</style>
