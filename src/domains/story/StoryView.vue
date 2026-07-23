<template>
  <div class="story-page">
    <div class="page-header">
      <div>
        <h2>剧情攻略</h2>
        <p>章节按顺序连接；越过章末时会自动进入下一章。</p>
      </div>
      <div class="overlay-toggle">
        <label>上一步 <KeyCaptureInput :model-value="settings.globalShortcuts.storyPrevious" @change="saveShortcut('storyPrevious', $event)" /></label>
        <label>下一步 <KeyCaptureInput :model-value="settings.globalShortcuts.storyNext" @change="saveShortcut('storyNext', $event)" /></label>
        <span>游戏浮窗</span>
        <el-switch :model-value="story.overlayVisible" active-text="显示" inactive-text="隐藏" @change="toggleOverlay" />
      </div>
    </div>

    <div class="story-workspace">
      <el-card class="chapter-panel" shadow="never">
        <template #header>
          <div class="panel-header">
            <strong>章节</strong>
            <el-button type="primary" size="small" :icon="Plus" @click="story.addChapter">添加</el-button>
          </div>
        </template>
        <el-empty v-if="!story.chapters.length" description="还没有章节" :image-size="72" />
        <div v-else class="chapter-list">
          <div
            v-for="(chapter, index) in story.chapters"
            :key="chapter.id"
            class="chapter-item"
            :class="{ active: chapter.id === story.currentChapterId, dragging: chapter.id === draggingChapterId, 'drag-over': chapter.id === dragOverChapterId && chapter.id !== draggingChapterId }"
            @click="story.selectChapter(chapter.id)"
            @dragover.prevent="dragOverChapterId = chapter.id"
            @drop.prevent="dropChapter(chapter.id)"
          >
            <span class="drag-handle" draggable="true" title="拖动排序" @dragstart.stop="startChapterDrag($event, chapter.id)" @dragend="clearChapterDrag">⋮⋮</span>
            <span class="chapter-order">{{ index + 1 }}</span>
            <span class="chapter-name">{{ chapter.name || '未命名章节' }}</span>
            <el-button text type="danger" :icon="Delete" @click.stop="confirmDeleteChapter(chapter)" />
          </div>
        </div>
      </el-card>

      <template v-if="story.currentChapter">
        <el-card class="steps-panel" shadow="never">
          <template #header>
            <div class="panel-header">
              <el-input v-model="story.currentChapter.name" maxlength="40" placeholder="章节名称" />
            </div>
          </template>
          <el-empty v-if="!story.currentChapter.steps.length" description="添加本章的第一个步骤" :image-size="72" />
          <div v-else class="step-list">
            <div
              v-for="(step, index) in story.currentChapter.steps"
              :key="step.id"
              class="step-item"
              :class="{ active: step.id === story.currentStepId, dragging: step.id === draggingStepId, 'drag-over': step.id === dragOverStepId && step.id !== draggingStepId }"
              @click="story.selectStep(story.currentChapter.id, step.id)"
              @dragover.prevent="dragOverStepId = step.id"
              @drop.prevent="dropStep(step.id)"
            >
              <div class="step-title">
                <span class="drag-handle" draggable="true" title="拖动排序" @dragstart.stop="startStepDrag($event, step.id)" @dragend="clearStepDrag">⋮⋮</span>
                <span>步骤 {{ index + 1 }}</span>
                <el-tag v-if="step.id === story.currentStepId" size="small" type="success">当前</el-tag>
                <el-button text type="danger" :icon="Delete" @click.stop="story.deleteStep(story.currentChapter.id, step.id)" />
              </div>
              <el-input
                v-model="step.text"
                type="textarea"
                :rows="3"
                resize="vertical"
                placeholder="输入这一阶段需要执行的操作"
                :ref="el => { if (el) stepInputRefs[step.id] = el }"
                @focus="story.selectStep(story.currentChapter.id, step.id)"
              />
            </div>
          </div>
          <div class="add-step-row">
            <el-button type="primary" :icon="Plus" @click="addStepAndFocus">添加步骤</el-button>
          </div>
        </el-card>

        <el-card class="skills-panel" shadow="never">
          <template #header>
            <div class="panel-header">
              <strong>本章技能</strong>
              <el-button type="primary" size="small" :icon="Plus" @click="story.addSkillGroup(story.currentChapter.id)">技能组</el-button>
            </div>
          </template>
          <el-empty v-if="!story.currentChapter.skillGroups.length" description="本章未配置技能" :image-size="72" />
          <div v-else class="skill-groups">
            <div v-for="group in story.currentChapter.skillGroups" :key="group.id" class="skill-group">
              <div class="group-header">
                <el-input v-model="group.name" maxlength="30" placeholder="技能组名称" />
                <el-button :icon="Plus" circle @click="story.addSkill(story.currentChapter.id, group.id)" />
                <el-button :icon="Delete" circle type="danger" @click="confirmDeleteGroup(group)" />
              </div>
              <div v-if="group.skills.length" class="skills-list">
                <div v-for="skill in group.skills" :key="skill.id" class="skill-row">
                  <el-input v-model="skill.name" placeholder="技能名称" />
                  <el-select v-model="skill.color" class="color-select">
                    <el-option label="红色" value="red" />
                    <el-option label="绿色" value="green" />
                    <el-option label="蓝色" value="blue" />
                  </el-select>
                  <el-button text type="danger" :icon="Delete" @click="story.deleteSkill(story.currentChapter.id, group.id, skill.id)" />
                </div>
              </div>
              <div v-else class="empty-group">暂无技能</div>
            </div>
          </div>
        </el-card>
      </template>

      <el-card v-else class="empty-editor" shadow="never">
        <el-empty description="添加或选择章节后开始编辑" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useStoryStore } from '@/stores/story'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import KeyCaptureInput from '@/components/common/KeyCaptureInput.vue'
import { commitGlobalShortcut } from '@/utils/scriptService'

const story = useStoryStore()
const settings = useSettingsStore()
let saveTimer = null
const draggingChapterId = ref(null)
const dragOverChapterId = ref(null)
const draggingStepId = ref(null)
const dragOverStepId = ref(null)
const stepInputRefs = {}

function addStepAndFocus() {
  const step = story.addStep(story.currentChapter.id)
  if (!step) return
  nextTick(() => stepInputRefs[step.id]?.focus())
}

function prepareDrag(event, id) {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', id)
}

function startChapterDrag(event, chapterId) {
  draggingChapterId.value = chapterId
  prepareDrag(event, chapterId)
}

function clearChapterDrag() {
  draggingChapterId.value = null
  dragOverChapterId.value = null
}

function dropChapter(targetChapterId) {
  if (draggingChapterId.value) story.reorderChapter(draggingChapterId.value, targetChapterId)
  clearChapterDrag()
}

function startStepDrag(event, stepId) {
  draggingStepId.value = stepId
  prepareDrag(event, stepId)
}

function clearStepDrag() {
  draggingStepId.value = null
  dragOverStepId.value = null
}

function dropStep(targetStepId) {
  if (draggingStepId.value && story.currentChapter) {
    story.reorderStep(story.currentChapter.id, draggingStepId.value, targetStepId)
  }
  clearStepDrag()
}

watch(() => story.chapters, () => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => story.save(), 180)
}, { deep: true })

async function toggleOverlay(visible) {
  try {
    if (visible) await story.showOverlay()
    else await story.hideOverlay()
  } catch (error) {
    ElMessage.error(`剧情浮窗操作失败：${error.message}`)
  }
}

async function saveShortcut(key, value) {
  try {
    await commitGlobalShortcut(key, value)
  } catch (error) {
    ElMessage.error(error.message)
  }
}

async function confirmDeleteChapter(chapter) {
  try {
    await ElMessageBox.confirm(`删除“${chapter.name || '未命名章节'}”及其全部步骤和技能？`, '删除章节', { type: 'warning' })
    story.deleteChapter(chapter.id)
  } catch {}
}

async function confirmDeleteGroup(group) {
  try {
    await ElMessageBox.confirm(`删除技能组“${group.name || '未命名'}”？`, '删除技能组', { type: 'warning' })
    story.deleteSkillGroup(story.currentChapter.id, group.id)
  } catch {}
}
</script>

<style scoped lang="less">
.story-page { height: 100%; overflow: auto; padding: 20px; background: var(--bg-secondary); box-sizing: border-box; }
.page-header, .panel-header, .overlay-toggle, .group-header, .skill-row, .step-title { display: flex; align-items: center; }
.page-header { justify-content: space-between; gap: 20px; margin-bottom: 18px; h2 { margin: 0 0 6px; } p { margin: 0; color: var(--text-secondary); } }
.overlay-toggle { gap: 12px; flex-wrap: wrap; justify-content: flex-end; }
.overlay-toggle label { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.story-workspace { display: grid; grid-template-columns: 220px minmax(340px, 1.35fr) minmax(320px, 1fr); gap: 16px; align-items: start; }
.panel-header { justify-content: space-between; gap: 10px; }
.chapter-panel, .steps-panel, .skills-panel, .empty-editor { min-height: 280px; }
.chapter-list, .step-list, .skill-groups, .skills-list { display: flex; flex-direction: column; gap: 10px; }
.chapter-item { display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; }
.step-item.active { border-color: var(--primary-color); background: var(--primary-light-9); }
.chapter-item.active { border-color: var(--primary-color); background: var(--el-color-primary-light-8); box-shadow: inset 3px 0 0 var(--primary-color); }
.chapter-item.active .chapter-name { font-weight: 700; }
.chapter-order { flex: 0 0 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 50%; background: var(--fill-color-light); }
.chapter-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.drag-handle { flex: 0 0 auto; color: var(--text-placeholder); cursor: grab; user-select: none; font-weight: 700; letter-spacing: -3px; padding: 3px 5px 3px 1px; }
.drag-handle:active { cursor: grabbing; }
.chapter-item.dragging, .step-item.dragging { opacity: .45; }
.chapter-item.drag-over, .step-item.drag-over { border-color: var(--primary-color); box-shadow: 0 2px 0 var(--primary-color); }
.step-item, .skill-group { border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; }
.step-title { justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.step-title > span:nth-child(2) { flex: 1; font-weight: 600; }
.group-header { gap: 8px; margin-bottom: 10px; }
.skill-row { gap: 8px; }
.color-select { width: 92px; flex: 0 0 92px; }
.empty-group { color: var(--text-placeholder); font-size: 13px; text-align: center; padding: 8px; }
.empty-editor { grid-column: 2 / 4; }
.add-step-row { margin-top: 10px; }
.add-step-row :deep(.el-button) { width: 100%; }
@media (max-width: 1050px) { .story-workspace { grid-template-columns: 200px 1fr; } .skills-panel { grid-column: 2; } }
</style>
