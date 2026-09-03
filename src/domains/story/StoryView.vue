<template>
  <div class="story-page primary-page primary-page__content">
    <div class="page-header">
      <div>
        <h2>剧情攻略</h2>
        <p>剧情路线与技能方案可独立切换，并按章节顺序组合。</p>
      </div>
      <div class="overlay-toggle">
        <label>上一步 <KeyCaptureInput :model-value="settings.globalShortcuts.storyPrevious" @change="saveShortcut('storyPrevious', $event)" /></label>
        <label>下一步 <KeyCaptureInput :model-value="settings.globalShortcuts.storyNext" @change="saveShortcut('storyNext', $event)" /></label>
        <label>浮窗宽度 <el-input-number :model-value="settings.storyOverlayWidth" :min="320" :max="1200" :step="20" controls-position="right" @change="settings.updateStoryOverlayWidth" /></label>
        <label>透明度 <el-input-number :model-value="settings.storyOverlayOpacity" :min="0" :max="100" :step="5" controls-position="right" @change="settings.updateStoryOverlayOpacity" />%</label>
        <span>游戏浮窗</span>
        <el-switch :model-value="story.overlayVisible" :disabled="!story.hasOverlayModule" active-text="显示" inactive-text="隐藏" @change="toggleOverlay" />
      </div>
    </div>

    <el-row class="story-workspace app-grid" :gutter="16">
      <el-col :xs="24" :lg="16" class="story-left-column"><el-card class="story-guide-panel" shadow="never">
        <div class="module-title-row story-module-title">
          <strong>剧情路线</strong>
          <label class="module-switch">浮窗显示 <el-switch :model-value="settings.storyOverlayStoryEnabled" @change="setOverlayModule('story', $event)" /></label>
        </div>
        <div class="story-guide-layout">
          <aside class="chapter-directory">
            <div class="preset-bar chapter-preset-bar">
              <el-select :model-value="story.currentStoryPresetId" size="small" @change="switchPreset('story', $event)">
                <el-option v-for="preset in story.storyPresets" :key="preset.id" :label="preset.name" :value="preset.id" />
              </el-select>
              <el-button size="small" :icon="Plus" circle title="新建剧情预设" @click="createPreset('story')" />
              <el-button size="small" :icon="Edit" circle title="重命名剧情预设" @click="renamePreset('story')" />
              <el-button size="small" :icon="Delete" circle type="danger" title="删除剧情预设" :disabled="story.currentStoryPresetId === 'default'" @click="deletePreset('story')" />
            </div>
            <el-empty v-if="!story.chapters.length" description="还没有章节" :image-size="64" />
            <div v-else class="chapter-list">
              <div
                v-for="(chapter, index) in displayedChapters"
                :key="chapter.id"
                class="chapter-item"
                :class="{
                  active: chapter.id === story.viewedChapterId,
                  progress: chapter.id === story.currentChapterId,
                  dragging: isDragging('chapter', chapter.id)
                }"
                @click="story.selectChapter(chapter.id)"
                @dragover.prevent="previewDrag($event, 'chapter', chapter.id)"
                @drop.prevent="dropDrag('chapter')"
              >
                <span class="drag-handle" draggable="true" title="拖动排序" @dragstart.stop="startDrag($event, 'chapter', chapter.id)" @dragend="clearDrag">⋮⋮</span>
                <span class="chapter-order">{{ index + 1 }}</span>
                <span class="chapter-name">{{ chapter.name || '未命名章节' }}</span>
                <span v-if="chapter.id === story.currentChapterId" class="progress-dot" title="当前进度章节"></span>
              </div>
            </div>
            <el-button class="add-chapter-button" :icon="Plus" @click="story.addChapter">添加章节</el-button>
          </aside>

          <section v-if="story.viewedChapter" class="chapter-details">
            <div class="chapter-details-header">
              <el-input v-model="story.viewedChapter.name" maxlength="40" placeholder="章节名称" />
              <el-button type="danger" :icon="Delete" title="删除章节" @click="confirmDeleteChapter(story.viewedChapter)">删除章节</el-button>
            </div>
            <div class="chapter-details-scroll">
              <el-empty v-if="!story.viewedChapter.steps.length" description="添加本章的第一个步骤" :image-size="64" />
              <div v-else class="step-list">
                <div
                  v-for="(step, index) in displayedSteps"
                  :key="step.id"
                  class="step-item"
                  :class="{ active: step.id === story.currentStepId, dragging: isDragging('step', step.id) }"
                  @dragover.prevent="previewDrag($event, 'step', step.id)"
                  @drop.prevent="dropDrag('step')"
                >
                  <div class="step-title">
                    <span class="drag-handle" draggable="true" title="拖动排序" @dragstart.stop="startDrag($event, 'step', step.id)" @dragend="clearDrag">⋮⋮</span>
                    <span>步骤 {{ index + 1 }}</span>
                    <el-radio
                      class="progress-selector"
                      :model-value="story.currentStepId"
                      :label="step.id"
                      @change="story.selectStep(story.viewedChapter.id, step.id)"
                    >设为当前</el-radio>
                    <el-button text type="danger" :icon="Delete" @click="story.deleteStep(story.viewedChapter.id, step.id)" />
                  </div>
                  <el-input
                    v-model="step.text"
                    type="textarea"
                    :rows="3"
                    resize="vertical"
                    placeholder="输入这一阶段需要执行的操作"
                    :ref="el => { if (el) stepInputRefs[step.id] = el }"
                  />
                </div>
              </div>
              <div class="add-step-row">
                <el-button type="primary" :icon="Plus" @click="addStepAndFocus">添加步骤</el-button>
              </div>
            </div>
          </section>
          <div v-else class="chapter-details empty-details">
            <el-empty description="添加或选择章节后开始编辑" />
          </div>
        </div>
      </el-card>

      <el-card class="story-timer-panel" shadow="never">
        <template #header>
          <div class="module-title-row">
            <strong>流程计时</strong>
            <label class="module-switch">浮窗显示 <el-switch :model-value="settings.storyTimerOverlayEnabled" @change="setOverlayModule('timer', $event)" /></label>
          </div>
        </template>
        <div class="timer-content">
          <div class="timer-display">
            <span class="timer-value">{{ timer.formattedElapsed }}</span>
            <span class="timer-status">{{ timer.statusLabel }}</span>
          </div>
          <div class="timer-actions">
            <el-button type="primary" :disabled="!settings.storyTimerOverlayEnabled" @click="toggleTimer">{{ timer.status === 'running' || timer.awaitingForeground ? '停止' : timer.currentElapsedMs > 0 ? '继续' : '开始' }}</el-button>
            <el-button :disabled="timer.currentElapsedMs <= 0" @click="timer.reset">重置</el-button>
            <el-button @click="historyVisible = true">历史记录</el-button>
          </div>
          <div class="timer-settings">
            <label><el-checkbox :model-value="settings.storyTimerPauseInBackground" @change="settings.updateStoryTimerPauseInBackground">游戏后台停止计时</el-checkbox></label>
            <label class="timer-shortcut">启停快捷键 <KeyCaptureInput :model-value="settings.globalShortcuts.storyTimerToggle" @change="saveShortcut('storyTimerToggle', $event)" /></label>
          </div>
          <el-alert v-if="timer.foregroundWarning" class="timer-warning" :title="timer.foregroundWarning" type="warning" :closable="false" show-icon />
        </div>
      </el-card></el-col>

      <el-col :xs="24" :lg="8"><el-card class="skills-panel" shadow="never">
          <template #header>
            <div class="preset-panel-header">
              <div class="preset-bar">
                <strong>技能方案</strong>
                <el-select :model-value="story.currentSkillPresetId" size="small" @change="switchPreset('skill', $event)">
                  <el-option v-for="preset in story.skillPresets" :key="preset.id" :label="preset.name" :value="preset.id" />
                </el-select>
                <el-button size="small" :icon="Plus" circle title="新建技能预设" @click="createPreset('skill')" />
                <el-button size="small" :icon="Edit" circle title="重命名技能预设" @click="renamePreset('skill')" />
                <el-button size="small" :icon="Delete" circle type="danger" title="删除技能预设" :disabled="story.currentSkillPresetId === 'default'" @click="deletePreset('skill')" />
              </div>
              <div class="panel-header">
                <label class="module-switch">浮窗显示 <el-switch :model-value="settings.storyOverlaySkillsEnabled" @change="setOverlayModule('skills', $event)" /></label>
                <label class="level-toggle">
                  <span>显示最低购买等级</span>
                  <el-switch :model-value="settings.storyShowSkillRequiredLevel" @change="settings.updateStoryShowSkillRequiredLevel" />
                </label>
                <el-button size="small" :icon="CopyDocument" :disabled="!story.canCopySkillsToNextChapter" @click="copySkillsToNext">复制到下一章</el-button>
              </div>
            </div>
          </template>
          <el-empty v-if="!story.viewedChapter" description="请先选择章节" :image-size="72" />
          <div v-else class="skill-groups">
            <el-empty v-if="!story.viewedSkillGroups.length" description="本章未配置技能" :image-size="72" />
            <div
              v-for="group in displayedSkillGroups"
              :key="group.id"
              class="skill-group"
              :class="{ dragging: isDragging('skill-group', group.id) }"
              @dragover.prevent="previewDrag($event, 'skill-group', group.id)"
              @drop.prevent="dropDrag('skill-group')"
            >
              <div class="group-header">
                <span class="drag-handle" draggable="true" title="拖动技能组排序" @dragstart.stop="startDrag($event, 'skill-group', group.id)" @dragend="clearDrag">⋮⋮</span>
                <el-input v-model="group.name" maxlength="30" placeholder="技能组名称" />
                <el-button :icon="Plus" circle @click="story.addSkill(story.viewedChapter.id, group.id)" />
                <el-button :icon="Delete" circle type="danger" @click="confirmDeleteGroup(group)" />
              </div>
              <div v-if="group.skills.length" class="skills-list">
                <div v-for="skill in group.skills" :key="skill.id" class="skill-row">
                  <el-autocomplete
                    class="skill-autocomplete"
                    :model-value="skillDisplayValue(skill)"
                    :fetch-suggestions="fetchSkillSuggestions"
                    :trigger-on-focus="false"
                    clearable
                    placeholder="输入技能名称，如：劈"
                    @input="updateSkillName(skill, $event)"
                    @select="selectSkillSuggestion(skill, $event)"
                  >
                    <template #default="{ item }">
                      <div class="skill-suggestion">
                        <span class="suggestion-name">{{ item.value }}</span>
                        <span class="suggestion-meta">
                          <i class="color-dot" :class="item.color"></i>
                          {{ skillKindLabel(item.kind) }} · {{ skillColorLabel(item.color) }}
                        </span>
                      </div>
                    </template>
                  </el-autocomplete>
                  <el-select v-model="skill.color" class="color-select">
                    <el-option label="红色" value="red" />
                    <el-option label="绿色" value="green" />
                    <el-option label="蓝色" value="blue" />
                    <el-option label="白色" value="white" />
                  </el-select>
                  <el-button text type="danger" :icon="Delete" @click="story.deleteSkill(story.viewedChapter.id, group.id, skill.id)" />
                </div>
              </div>
              <div v-else class="empty-group">暂无技能</div>
            </div>
            <el-button class="add-skill-group-button" :icon="Plus" @click="story.addSkillGroup(story.viewedChapter.id)">技能组</el-button>
          </div>
      </el-card></el-col>
    </el-row>

    <el-dialog v-model="historyVisible" title="剧情计时历史" width="620px">
      <el-empty v-if="!timer.history.length" description="暂无历史记录" :image-size="72" />
      <el-table v-else :data="timer.history" max-height="420">
        <el-table-column prop="presetName" label="剧情预设" min-width="180" />
        <el-table-column label="完成时间" min-width="180"><template #default="{ row }">{{ formatCompletedAt(row.completedAt) }}</template></el-table-column>
        <el-table-column label="总用时" width="110"><template #default="{ row }">{{ formatDuration(row.durationMs) }}</template></el-table-column>
        <el-table-column class-name="history-action-column" label="操作" width="96" align="center"><template #default="{ row }"><el-button text type="danger" @click="confirmDeleteHistory(row)">删除</el-button></template></el-table-column>
      </el-table>
    </el-dialog>

    <PageHelpDrawer :topics="helpTopics" />
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { CopyDocument, Delete, Edit, Plus } from '@element-plus/icons-vue'
import PageHelpDrawer from '@/domains/help/PageHelpDrawer.vue'
import { moduleHelpTopicsById } from '@/domains/help/helpContent.js'
import { useStoryStore } from '@/stores/story'
import { useStoryTimerStore } from '@/stores/storyTimer'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import KeyCaptureInput from '@/components/common/KeyCaptureInput.vue'
import { commitGlobalShortcut } from '@/utils/scriptService'
import { formatStoryTimerDuration } from '@/utils/storyTimer'
import skillCatalog from './skillCatalog.json'
import {
  applySkillCatalogSelection,
  searchSkillCatalog,
  SKILL_COLOR_LABELS,
  SKILL_KIND_LABELS,
  skillSuggestionLabel,
  updateSkillFreeText
} from './skillCatalog'

const story = useStoryStore()
const timer = useStoryTimerStore()
const settings = useSettingsStore()
const helpTopics = moduleHelpTopicsById('story')
let saveTimer = null
const dragPreview = ref(null)
const historyVisible = ref(false)
const stepInputRefs = {}
const displayedChapters = computed(() => orderPreviewItems('chapter', story.chapters))
const displayedSteps = computed(() => orderPreviewItems('step', story.viewedChapter?.steps || []))
const displayedSkillGroups = computed(() => orderPreviewItems('skill-group', story.viewedSkillGroups))

function fetchSkillSuggestions(query, callback) {
  callback(searchSkillCatalog(skillCatalog.skills, query))
}

function selectSkillSuggestion(skill, selected) {
  applySkillCatalogSelection(skill, selected)
  story.save()
}

function updateSkillName(skill, value) {
  updateSkillFreeText(skill, value)
}

function skillDisplayValue(skill) {
  if (settings.storyShowSkillRequiredLevel && skill.gemId && Number.isInteger(skill.requiredLevel)) {
    return skillSuggestionLabel(skill)
  }
  return skill.name
}

function skillKindLabel(kind) {
  return SKILL_KIND_LABELS[kind] || '技能'
}

function skillColorLabel(color) {
  return SKILL_COLOR_LABELS[color] || color
}

function addStepAndFocus() {
  if (!story.viewedChapter) return
  const step = story.addStep(story.viewedChapter.id)
  if (!step) return
  nextTick(() => stepInputRefs[step.id]?.focus())
}

function prepareDrag(event, id) {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', id)
}

function dragItems(type) {
  if (type === 'chapter') return story.chapters
  if (type === 'step') return story.viewedChapter?.steps || []
  return story.viewedSkillGroups
}

function orderPreviewItems(type, items) {
  const preview = dragPreview.value
  if (!preview || preview.type !== type) return items
  const itemsById = new Map(items.map(item => [item.id, item]))
  const ordered = preview.ids.map(id => itemsById.get(id)).filter(Boolean)
  const previewIds = new Set(preview.ids)
  return ordered.concat(items.filter(item => !previewIds.has(item.id)))
}

function startDrag(event, type, movedId) {
  const items = dragItems(type)
  if (!items.some(item => item.id === movedId)) return
  dragPreview.value = {
    type,
    movedId,
    chapterId: type === 'chapter' ? null : story.viewedChapter?.id,
    ids: items.map(item => item.id)
  }
  prepareDrag(event, movedId)
}

function isDragging(type, id) {
  return dragPreview.value?.type === type && dragPreview.value.movedId === id
}

function previewDrag(event, type, targetId) {
  const preview = dragPreview.value
  if (!preview || preview.type !== type || preview.movedId === targetId) return
  const target = event.currentTarget
  const bounds = target.getBoundingClientRect()
  const insertAfter = event.clientY >= bounds.top + bounds.height / 2
  const idsWithoutMoved = preview.ids.filter(id => id !== preview.movedId)
  const targetIndex = idsWithoutMoved.indexOf(targetId)
  if (targetIndex < 0) return
  const destinationIndex = targetIndex + (insertAfter ? 1 : 0)
  const nextIds = [...idsWithoutMoved]
  nextIds.splice(destinationIndex, 0, preview.movedId)
  if (nextIds.every((id, index) => id === preview.ids[index])) return
  dragPreview.value = { ...preview, ids: nextIds }
}

function dropDrag(type) {
  const preview = dragPreview.value
  if (!preview || preview.type !== type) return
  const destinationIndex = preview.ids.indexOf(preview.movedId)
  if (destinationIndex < 0) {
    clearDrag()
    return
  }
  if (type === 'chapter') story.reorderChapter(preview.movedId, destinationIndex)
  else if (type === 'step' && preview.chapterId) {
    story.reorderStep(preview.chapterId, preview.movedId, destinationIndex)
  } else if (type === 'skill-group' && preview.chapterId) {
    story.reorderSkillGroup(preview.chapterId, preview.movedId, destinationIndex)
  }
  clearDrag()
}

function clearDrag() {
  dragPreview.value = null
}

function currentPreset(type) {
  return type === 'story' ? story.currentStoryPreset : story.currentSkillPreset
}

async function createPreset(type) {
  try {
    const label = type === 'story' ? '剧情' : '技能'
    const { value } = await ElMessageBox.prompt(`输入${label}预设名称`, `新建${label}预设`, {
      inputPattern: /\S+/,
      inputErrorMessage: '预设名称不能为空'
    })
    let copyCurrent = false
    try {
      await ElMessageBox.confirm('请选择新预设的初始内容', '初始内容', {
        confirmButtonText: '复制当前',
        cancelButtonText: '创建空白',
        distinguishCancelAndClose: true
      })
      copyCurrent = true
    } catch (action) {
      if (action !== 'cancel') return
    }
    const preset = type === 'story'
      ? story.addStoryPreset(value, copyCurrent)
      : story.addSkillPreset(value, copyCurrent)
    ElMessage.success(`已创建“${preset.name}”`)
  } catch {}
}

async function renamePreset(type) {
  const preset = currentPreset(type)
  if (!preset) return
  try {
    const { value } = await ElMessageBox.prompt('输入新的预设名称', '重命名预设', {
      inputValue: preset.name,
      inputPattern: /\S+/,
      inputErrorMessage: '预设名称不能为空'
    })
    if (type === 'story') story.renameStoryPreset(preset.id, value)
    else story.renameSkillPreset(preset.id, value)
  } catch {}
}

async function deletePreset(type) {
  const preset = currentPreset(type)
  if (!preset || preset.id === 'default') return
  try {
    await ElMessageBox.confirm(`删除预设“${preset.name}”？`, '删除预设', { type: 'warning' })
    if (type === 'story') story.deleteStoryPreset(preset.id)
    else story.deleteSkillPreset(preset.id)
  } catch {}
}

function switchPreset(type, id) {
  const switched = type === 'story' ? story.switchStoryPreset(id) : story.switchSkillPreset(id)
  if (switched) ElMessage.success(`已切换到：${currentPreset(type).name}`)
}

async function copySkillsToNext() {
  if (!story.canCopySkillsToNextChapter) return
  const targetGroups = story.currentSkillPreset.chapterSkills[story.viewedChapterIndex + 1]?.skillGroups || []
  try {
    if (targetGroups.length) {
      await ElMessageBox.confirm('下一章已有技能配置，确认完整覆盖？', '复制章节技能', { type: 'warning' })
    }
    story.copyCurrentChapterSkillsToNext()
    ElMessage.success('已复制到下一章')
  } catch {}
}

watch([() => story.storyPresets, () => story.skillPresets], () => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => story.save(), 180)
}, { deep: true })

async function toggleOverlay(visible) {
  try {
    if (visible) await story.showOverlay(settings.storyOverlayWidth, settings.storyOverlayOpacity)
    else await story.hideOverlay()
  } catch (error) {
    ElMessage.error(`剧情浮窗操作失败：${error.message}`)
  }
}

function setOverlayModule(module, enabled) {
  settings.updateStoryOverlayModule(module, enabled)
  if (!story.hasOverlayModule) ElMessage.info('请至少开启一个浮窗模块')
}

function toggleTimer() {
  const result = timer.toggleFromPage(story.currentStoryPreset)
  if (result?.reason === 'game-background') ElMessage.warning('请切换到游戏前台后开始或继续计时')
  if (result?.reason === 'feature-disabled') ElMessage.warning('请先开启计时浮窗模块')
}

function formatDuration(durationMs) {
  return formatStoryTimerDuration(durationMs)
}

function formatCompletedAt(timestamp) {
  return new Date(timestamp).toLocaleString('zh-CN', { hour12: false })
}

async function confirmDeleteHistory(record) {
  try {
    await ElMessageBox.confirm(`删除“${record.presetName}”的计时记录？`, '删除历史记录', { type: 'warning' })
    timer.deleteHistory(record.id)
  } catch {}
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
    await ElMessageBox.confirm(`删除“${chapter.name || '未命名章节'}”及其全部步骤？技能预设槽位会保留。`, '删除章节', { type: 'warning' })
    story.deleteChapter(chapter.id)
  } catch {}
}

async function confirmDeleteGroup(group) {
  if (!story.viewedChapter) return
  try {
    await ElMessageBox.confirm(`删除技能组“${group.name || '未命名'}”？`, '删除技能组', { type: 'warning' })
    story.deleteSkillGroup(story.viewedChapter.id, group.id)
  } catch {}
}
</script>

<style scoped lang="less">
.story-page { display: flex; height: 100%; min-height: 0; flex-direction: column; overflow: hidden; padding: 20px; background: var(--bg-secondary); box-sizing: border-box; }
.page-header, .panel-header, .overlay-toggle, .group-header, .skill-row, .step-title, .level-toggle, .preset-bar { display: flex; align-items: center; }
.page-header { flex: 0 0 auto; justify-content: space-between; gap: 20px; margin-bottom: 18px; h2 { margin: 0 0 6px; } p { margin: 0; color: var(--text-secondary); } }
.overlay-toggle { gap: 12px; flex-wrap: wrap; justify-content: flex-end; }
.overlay-toggle label { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.overlay-toggle :deep(.el-input-number) { width: 118px; }
.story-workspace { min-height: 0; flex: 1; align-items: stretch; overflow: hidden; }
.story-workspace > .el-col { display: flex; min-height: 0; }
.story-workspace > .el-col > .el-card { width: 100%; height: 100%; overflow: hidden; }
.story-left-column { flex-direction: column; gap: 16px; }
.story-workspace > .story-left-column > .story-guide-panel { height: auto; flex: 1 1 0; }
.story-workspace > .story-left-column > .story-timer-panel { height: auto; flex: 0 0 auto; }
.story-guide-panel, .skills-panel { display: flex; min-height: 0; flex-direction: column; }
.story-guide-panel :deep(.el-card__header), .skills-panel :deep(.el-card__header) { flex: 0 0 auto; }
.story-guide-panel :deep(.el-card__body), .skills-panel :deep(.el-card__body) { min-height: 0; flex: 1 1 0; }
.story-guide-panel :deep(.el-card__body) { display: flex; flex-direction: column; overflow: hidden; padding: 0; }
.skills-panel :deep(.el-card__body) { overflow-y: auto; }
.story-module-title { flex: 0 0 auto; padding: 10px 12px; border-bottom: 1px solid var(--border-color); }
.story-guide-layout { display: grid; height: auto; min-height: 0; flex: 1 1 0; padding: 12px; gap: 12px; box-sizing: border-box; grid-template-columns: 240px minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); }
.chapter-directory, .chapter-details {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--border-base);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface-2) 30%, var(--surface-1));
  box-shadow: 0 4px 12px rgba(0, 0, 0, .12), inset 0 1px rgba(255, 255, 255, .025);
}
.chapter-directory { overflow-y: auto; padding: 12px; }
.chapter-details { display: flex; flex-direction: column; }
.chapter-details-header { display: flex; flex: 0 0 auto; align-items: center; gap: 10px; padding: 12px; border-bottom: 1px solid var(--border-color); }
.chapter-details-header :deep(.el-input) { min-width: 0; flex: 1; }
.chapter-details-scroll { min-height: 0; flex: 1; overflow-y: auto; padding: 12px; }
.empty-details { align-items: center; justify-content: center; }
.preset-panel-header { display: grid; gap: 9px; }
.module-title-row, .module-switch { display: flex; align-items: center; }
.module-title-row { justify-content: space-between; gap: 12px; }
.module-switch { gap: 7px; color: var(--text-secondary); font-size: 12px; white-space: nowrap; }
.timer-content { display: grid; grid-template-columns: minmax(150px, .7fr) auto minmax(245px, 1fr); align-items: center; gap: 18px; }
.timer-display { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.timer-value { color: var(--primary-color); font-family: Consolas, monospace; font-size: 28px; font-weight: 700; letter-spacing: 1px; }
.timer-status { color: var(--text-secondary); font-size: 12px; }
.timer-actions { display: flex; gap: 8px; }
.timer-actions :deep(.el-button + .el-button) { margin-left: 0; }
.timer-settings { display: flex; flex-direction: column; gap: 8px; }
.timer-shortcut { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 12px; }
.timer-warning { grid-column: 1 / -1; }
:deep(.history-action-column .cell) { overflow: visible; }
.preset-bar { gap: 6px; min-width: 0; }
.preset-bar strong { margin-right: auto; white-space: nowrap; }
.preset-bar :deep(.el-select) { min-width: 0; flex: 1; }
.preset-bar :deep(.el-button + .el-button) { margin-left: 0; }
.chapter-preset-bar { margin-bottom: 10px; }
.add-chapter-button { width: 100%; margin-top: 10px; }
.panel-header { justify-content: space-between; gap: 10px; }
.level-toggle { gap: 7px; color: var(--text-secondary); font-size: 12px; white-space: nowrap; }
.chapter-list, .step-list, .skill-groups, .skills-list { display: flex; flex-direction: column; gap: 10px; }
.add-skill-group-button { width: 100%; }
.chapter-item { display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; transition: border-color .15s ease, background-color .15s ease; }
.chapter-item:hover { border-color: var(--control-hover-border); background: var(--surface-hover); }
.step-item.active { border-color: var(--primary-color); background: var(--primary-light-9); }
.chapter-item.active { border-color: var(--primary-color); background: var(--el-color-primary-light-8); box-shadow: inset 3px 0 0 var(--primary-color); }
.chapter-item.active .chapter-name { font-weight: 700; }
.chapter-item.progress:not(.active) { border-color: var(--el-color-success-light-5); }
.progress-dot { flex: 0 0 8px; width: 8px; height: 8px; border-radius: 50%; background: var(--el-color-success); box-shadow: 0 0 0 3px var(--el-color-success-light-8); }
.chapter-order { flex: 0 0 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 50%; background: var(--fill-color-light); }
.chapter-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.drag-handle { flex: 0 0 auto; color: var(--text-placeholder); cursor: grab; user-select: none; font-weight: 700; letter-spacing: -3px; padding: 3px 5px 3px 1px; }
.drag-handle:active { cursor: grabbing; }
.chapter-item.dragging, .step-item.dragging, .skill-group.dragging { opacity: .45; }
.step-item, .skill-group { border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; }
.skill-group { cursor: pointer; }
.step-item :deep(.el-textarea__inner), .skill-group :deep(.el-input__inner) { cursor: text; }
.step-title { justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.step-title > span:nth-child(2) { flex: 1; font-weight: 600; }
.progress-selector { flex: 0 0 auto; margin-right: 0; }
.progress-selector :deep(.el-radio__label) { padding-left: 5px; font-size: 12px; }
.group-header { gap: 8px; margin-bottom: 10px; }
.skill-row { gap: 8px; }
.skill-autocomplete { min-width: 0; flex: 1; }
.skill-suggestion { display: flex; align-items: center; justify-content: space-between; gap: 18px; min-width: 280px; }
.suggestion-name { color: var(--text-primary); }
.suggestion-meta { display: flex; align-items: center; flex: 0 0 auto; color: var(--text-secondary); font-size: 12px; }
.color-dot { width: 8px; height: 8px; margin-right: 5px; border-radius: 50%; border: 1px solid rgba(128, 128, 128, .5); }
.color-dot.red { background: #e95a5a; }
.color-dot.green { background: #49b86a; }
.color-dot.blue { background: #4f8fdf; }
.color-dot.white { background: #f5f5f5; }
.color-select { width: 92px; flex: 0 0 92px; }
.empty-group { color: var(--text-placeholder); font-size: 13px; text-align: center; padding: 8px; }
.add-step-row { margin-top: 10px; }
.add-step-row :deep(.el-button) { width: 100%; }
@media (max-width: 1100px) {
  .story-page { overflow-y: auto; }
  .story-workspace { min-height: auto; flex: 0 0 auto; overflow: visible; }
  .story-workspace > .el-col > .el-card { height: auto; }
  .story-workspace > .el-col > .story-guide-panel { height: 560px; }
  .skills-panel { min-height: 360px; }
  .timer-content { grid-template-columns: minmax(150px, .7fr) auto minmax(245px, 1fr); }
}
@media (max-width: 720px) {
  .story-page { padding: 14px; }
  .page-header { align-items: flex-start; flex-direction: column; }
  .overlay-toggle { justify-content: flex-start; }
  .story-workspace > .el-col > .story-guide-panel { height: auto; }
  .story-guide-panel :deep(.el-card__body) { flex: 0 0 auto; overflow: visible; }
  .story-guide-layout { height: auto; grid-template-columns: 1fr; }
  .chapter-directory { max-height: 240px; }
  .chapter-details-scroll { max-height: 520px; }
  .timer-content { grid-template-columns: 1fr; }
  .timer-actions { justify-content: center; }
}
</style>
