<template>
  <div ref="content" class="story-overlay" @mouseenter="enableInteraction" @mouseleave="disableInteraction">
    <div class="drag-handle">
      <span>{{ state.chapter?.name || '剧情攻略' }}</span>
      <span class="drag-tip">拖动调整位置</span>
    </div>

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
          <span v-for="skill in group.skills" :key="skill.id" class="skill-tag" :class="skill.color">{{ skill.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { electronApi } from '@/api/electron'

const content = ref(null)
const state = reactive({ previous: null, current: null, next: null, chapter: null })
let removeStateListener = null
let observer = null

function enableInteraction() {
  electronApi.setIgnoreMouseEvents?.(false, { forward: false })
}

function disableInteraction() {
  electronApi.setIgnoreMouseEvents?.(true, { forward: true })
}

function applyState(snapshot = {}) {
  state.previous = snapshot.previous || null
  state.current = snapshot.current || null
  state.next = snapshot.next || null
  state.chapter = snapshot.chapter || null
  nextTick(reportHeight)
}

function reportHeight() {
  if (content.value) electronApi.storyOverlay.resize(content.value.scrollHeight + 8)
}

onMounted(async () => {
  removeStateListener = electronApi.storyOverlay.onState(applyState)
  const initialState = await electronApi.storyOverlay.getState?.()
  if (initialState) applyState(initialState)
  observer = new ResizeObserver(reportHeight)
  if (content.value) observer.observe(content.value)
  disableInteraction()
})

onBeforeUnmount(() => {
  removeStateListener?.()
  observer?.disconnect()
})
</script>

<style scoped lang="less">
.story-overlay { width: 100%; max-height: 70vh; overflow-y: auto; box-sizing: border-box; padding: 10px; color: #f5f7fa; background: linear-gradient(145deg, rgba(14, 18, 27, .94), rgba(31, 38, 52, .92)); border: 1px solid rgba(130, 170, 255, .36); border-radius: 14px; box-shadow: 0 12px 34px rgba(0, 0, 0, .45); font-family: "Microsoft YaHei", sans-serif; }
.drag-handle { -webkit-app-region: drag; cursor: move; display: flex; justify-content: space-between; align-items: center; padding: 4px 8px 10px; font-weight: 700; color: #a9c7ff; }
.drag-tip { font-size: 10px; font-weight: 400; opacity: .42; }
.steps { display: flex; flex-direction: column; gap: 7px; }
.step { display: grid; grid-template-columns: 68px 1fr; gap: 8px; align-items: start; border-radius: 9px; padding: 9px 11px; }
.step.neighbor { font-size: 12px; color: #a7afbf; background: rgba(255, 255, 255, .035); opacity: .72; }
.step.current { padding: 13px 12px; font-size: 16px; font-weight: 700; line-height: 1.55; background: rgba(71, 125, 230, .25); border: 1px solid rgba(109, 158, 255, .52); text-shadow: 0 1px 2px #000; }
.direction { white-space: nowrap; color: #83aefc; }
.step-text { white-space: pre-wrap; word-break: break-word; }
.step-text em { display: inline-block; margin-right: 6px; padding: 1px 5px; border-radius: 4px; font-style: normal; font-size: 10px; background: rgba(105, 148, 228, .25); color: #b8d1ff; }
.boundary { color: #727b8d; }
.empty-state { padding: 44px 12px; text-align: center; color: #8790a0; }
.skills-section { margin-top: 10px; padding: 10px 11px 4px; border-top: 1px solid rgba(255, 255, 255, .12); }
.skills-title { margin-bottom: 8px; font-size: 12px; color: #96a2b6; }
.skill-group { display: grid; grid-template-columns: 86px 1fr; gap: 8px; margin-bottom: 8px; align-items: start; }
.group-name { font-size: 12px; color: #c6cedb; padding-top: 3px; overflow: hidden; text-overflow: ellipsis; }
.skill-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.skill-tag { padding: 3px 8px; border-radius: 10px; font-size: 12px; border: 1px solid; }
.skill-tag.red { color: #ffb1b1; background: rgba(204, 50, 50, .22); border-color: rgba(255, 91, 91, .42); }
.skill-tag.green { color: #aef0b5; background: rgba(35, 151, 67, .22); border-color: rgba(72, 206, 100, .42); }
.skill-tag.blue { color: #acd4ff; background: rgba(45, 112, 201, .24); border-color: rgba(78, 149, 239, .46); }
</style>
