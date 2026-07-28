import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '@/api/electron'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import {
  buildStoryFlow,
  buildStorySnapshot,
  createSkillPreset,
  createStoryId,
  createStoryPreset,
  DEFAULT_SKILL_PRESET_ID,
  DEFAULT_STORY_PRESET_ID,
  moveStoryStep,
  readStoryData,
  replaceChapterSkillGroups,
  reorderItemsById,
  selectStoryEntryAfterRemoval,
  STORY_VERSION,
  writeStoryData
} from '@/utils/storyGuide'

export const useStoryStore = defineStore('story', () => {
  const initial = readStoryData()
  const settings = useSettingsStore()
  const storyPresets = ref(initial.storyPresets)
  const skillPresets = ref(initial.skillPresets)
  const currentStoryPresetId = ref(initial.currentStoryPresetId)
  const currentSkillPresetId = ref(initial.currentSkillPresetId)
  const overlayVisible = ref(false)

  const currentStoryPreset = computed(() =>
    storyPresets.value.find(item => item.id === currentStoryPresetId.value) || storyPresets.value[0]
  )
  const currentSkillPreset = computed(() =>
    skillPresets.value.find(item => item.id === currentSkillPresetId.value) || skillPresets.value[0]
  )
  const chapters = computed(() => currentStoryPreset.value?.chapters || [])
  const currentChapterId = computed({
    get: () => currentStoryPreset.value?.currentChapterId || null,
    set: value => { if (currentStoryPreset.value) currentStoryPreset.value.currentChapterId = value }
  })
  const currentStepId = computed({
    get: () => currentStoryPreset.value?.currentStepId || null,
    set: value => { if (currentStoryPreset.value) currentStoryPreset.value.currentStepId = value }
  })
  const currentChapter = computed(() => chapters.value.find(item => item.id === currentChapterId.value) || null)
  const currentChapterIndex = computed(() => chapters.value.findIndex(item => item.id === currentChapterId.value))
  const currentStep = computed(() => currentChapter.value?.steps.find(item => item.id === currentStepId.value) || null)
  const currentSkillGroups = computed(() =>
    currentSkillPreset.value?.chapterSkills?.[currentChapterIndex.value]?.skillGroups || []
  )
  const snapshot = computed(() => buildStorySnapshot(
    chapters.value,
    currentStepId.value,
    currentSkillGroups.value,
    {
      currentChapterId: currentChapterId.value,
      showRequiredLevel: settings.storyShowSkillRequiredLevel
    }
  ))
  const canCopySkillsToNextChapter = computed(() =>
    currentChapterIndex.value >= 0 && currentChapterIndex.value < chapters.value.length - 1
  )

  function stateData() {
    return {
      version: STORY_VERSION,
      storyPresets: storyPresets.value,
      skillPresets: skillPresets.value,
      currentStoryPresetId: currentStoryPresetId.value,
      currentSkillPresetId: currentSkillPresetId.value
    }
  }

  function syncOverlay() {
    if (overlayVisible.value) electronApi.storyOverlay.update(JSON.parse(JSON.stringify(snapshot.value)))
  }

  function save({ sync = true } = {}) {
    writeStoryData(stateData())
    if (sync) syncOverlay()
  }

  function selectEntry(entry) {
    currentChapterId.value = entry?.chapter.id || null
    currentStepId.value = entry?.step.id || null
    save()
  }

  function selectChapter(chapterId) {
    const chapter = chapters.value.find(item => item.id === chapterId)
    currentChapterId.value = chapter?.id || null
    currentStepId.value = chapter?.steps[0]?.id || null
    save()
  }

  function selectStep(chapterId, stepId) {
    const chapter = chapters.value.find(item => item.id === chapterId)
    const step = chapter?.steps.find(item => item.id === stepId)
    if (!chapter || !step) return
    currentChapterId.value = chapter.id
    currentStepId.value = step.id
    save()
  }

  function addStoryPreset(name, copyCurrent = false) {
    const preset = createStoryPreset(name, copyCurrent ? currentStoryPreset.value : null)
    storyPresets.value.push(preset)
    currentStoryPresetId.value = preset.id
    save()
    return preset
  }

  function addSkillPreset(name, copyCurrent = false) {
    const preset = createSkillPreset(name, copyCurrent ? currentSkillPreset.value : null)
    skillPresets.value.push(preset)
    currentSkillPresetId.value = preset.id
    save()
    return preset
  }

  function renameStoryPreset(id, name) {
    const preset = storyPresets.value.find(item => item.id === id)
    if (!preset || !String(name || '').trim()) return false
    preset.name = String(name).trim()
    save()
    return true
  }

  function renameSkillPreset(id, name) {
    const preset = skillPresets.value.find(item => item.id === id)
    if (!preset || !String(name || '').trim()) return false
    preset.name = String(name).trim()
    save()
    return true
  }

  function switchStoryPreset(id) {
    if (!storyPresets.value.some(item => item.id === id)) return false
    currentStoryPresetId.value = id
    save()
    return true
  }

  function switchSkillPreset(id) {
    if (!skillPresets.value.some(item => item.id === id)) return false
    currentSkillPresetId.value = id
    save()
    return true
  }

  function deleteStoryPreset(id) {
    if (id === DEFAULT_STORY_PRESET_ID) return false
    const index = storyPresets.value.findIndex(item => item.id === id)
    if (index < 0) return false
    storyPresets.value.splice(index, 1)
    if (currentStoryPresetId.value === id) currentStoryPresetId.value = storyPresets.value[0]?.id || DEFAULT_STORY_PRESET_ID
    save()
    return true
  }

  function deleteSkillPreset(id) {
    if (id === DEFAULT_SKILL_PRESET_ID) return false
    const index = skillPresets.value.findIndex(item => item.id === id)
    if (index < 0) return false
    skillPresets.value.splice(index, 1)
    if (currentSkillPresetId.value === id) currentSkillPresetId.value = skillPresets.value[0]?.id || DEFAULT_SKILL_PRESET_ID
    save()
    return true
  }

  function addChapter() {
    const chapter = {
      id: createStoryId('chapter'),
      name: `章节 ${chapters.value.length + 1}`,
      steps: []
    }
    chapters.value.push(chapter)
    currentChapterId.value = chapter.id
    currentStepId.value = null
    save()
    return chapter
  }

  function deleteChapter(chapterId) {
    const oldFlow = buildStoryFlow(chapters.value)
    const activeIndex = oldFlow.findIndex(item => item.step.id === currentStepId.value)
    const removedIndex = chapters.value.findIndex(item => item.id === chapterId)
    if (removedIndex < 0) return
    const removingCurrent = currentChapterId.value === chapterId
    chapters.value.splice(removedIndex, 1)
    if (removingCurrent) {
      const entry = selectStoryEntryAfterRemoval(chapters.value, activeIndex)
      if (entry) selectEntry(entry)
      else {
        currentChapterId.value = chapters.value[Math.min(removedIndex, chapters.value.length - 1)]?.id || null
        currentStepId.value = null
        save()
      }
    } else {
      save()
    }
  }

  function addStep(chapterId) {
    const chapter = chapters.value.find(item => item.id === chapterId)
    if (!chapter) return null
    const step = { id: createStoryId('step'), text: '' }
    chapter.steps.push(step)
    selectStep(chapter.id, step.id)
    return step
  }

  function deleteStep(chapterId, stepId) {
    const oldFlow = buildStoryFlow(chapters.value)
    const removedFlowIndex = oldFlow.findIndex(item => item.step.id === stepId)
    const chapter = chapters.value.find(item => item.id === chapterId)
    const index = chapter?.steps.findIndex(item => item.id === stepId) ?? -1
    if (!chapter || index < 0) return
    const removingCurrent = currentStepId.value === stepId
    chapter.steps.splice(index, 1)
    if (removingCurrent) {
      const entry = selectStoryEntryAfterRemoval(chapters.value, removedFlowIndex)
      if (entry) selectEntry(entry)
      else {
        currentChapterId.value = chapter.id
        currentStepId.value = null
        save()
      }
    } else {
      save()
    }
  }

  function reorderChapter(chapterId, targetChapterId) {
    if (!reorderItemsById(chapters.value, chapterId, targetChapterId)) return false
    save()
    return true
  }

  function reorderStep(chapterId, stepId, targetStepId) {
    const chapter = chapters.value.find(item => item.id === chapterId)
    if (!chapter || !reorderItemsById(chapter.steps, stepId, targetStepId)) return false
    save()
    return true
  }

  function ensureSkillSlot(chapterIndex = currentChapterIndex.value) {
    if (!currentSkillPreset.value || chapterIndex < 0) return null
    while (currentSkillPreset.value.chapterSkills.length <= chapterIndex) {
      currentSkillPreset.value.chapterSkills.push({ skillGroups: [] })
    }
    return currentSkillPreset.value.chapterSkills[chapterIndex]
  }

  function addSkillGroup(chapterId) {
    const chapterIndex = chapters.value.findIndex(item => item.id === chapterId)
    const slot = ensureSkillSlot(chapterIndex)
    if (!slot) return null
    const group = { id: createStoryId('group'), name: `技能组 ${slot.skillGroups.length + 1}`, skills: [] }
    slot.skillGroups.push(group)
    save()
    return group
  }

  function deleteSkillGroup(chapterId, groupId) {
    const chapterIndex = chapters.value.findIndex(item => item.id === chapterId)
    const slot = currentSkillPreset.value?.chapterSkills?.[chapterIndex]
    const index = slot?.skillGroups.findIndex(item => item.id === groupId) ?? -1
    if (!slot || index < 0) return false
    slot.skillGroups.splice(index, 1)
    save()
    return true
  }

  function reorderSkillGroup(chapterId, groupId, targetGroupId) {
    const chapterIndex = chapters.value.findIndex(item => item.id === chapterId)
    const groups = currentSkillPreset.value?.chapterSkills?.[chapterIndex]?.skillGroups
    if (!groups || !reorderItemsById(groups, groupId, targetGroupId)) return false
    save()
    return true
  }

  function addSkill(chapterId, groupId) {
    const chapterIndex = chapters.value.findIndex(item => item.id === chapterId)
    const group = currentSkillPreset.value?.chapterSkills?.[chapterIndex]?.skillGroups.find(item => item.id === groupId)
    if (!group) return null
    const skill = { id: createStoryId('skill'), name: '', color: 'red' }
    group.skills.push(skill)
    save()
    return skill
  }

  function deleteSkill(chapterId, groupId, skillId) {
    const chapterIndex = chapters.value.findIndex(item => item.id === chapterId)
    const group = currentSkillPreset.value?.chapterSkills?.[chapterIndex]?.skillGroups.find(item => item.id === groupId)
    const index = group?.skills.findIndex(item => item.id === skillId) ?? -1
    if (!group || index < 0) return false
    group.skills.splice(index, 1)
    save()
    return true
  }

  function copyCurrentChapterSkillsToNext() {
    if (!canCopySkillsToNextChapter.value) return false
    replaceChapterSkillGroups(
      currentSkillPreset.value.chapterSkills,
      currentChapterIndex.value,
      currentChapterIndex.value + 1
    )
    save()
    return true
  }

  function move(direction) {
    selectEntry(moveStoryStep(chapters.value, currentStepId.value, direction))
  }

  const previous = () => move(-1)
  const next = () => move(1)

  async function showOverlay(width = settings.storyOverlayWidth, opacity = settings.storyOverlayOpacity) {
    const result = await electronApi.storyOverlay.open(
      JSON.parse(JSON.stringify(snapshot.value)),
      { width, opacity }
    )
    overlayVisible.value = result?.success !== false
    return result
  }

  async function hideOverlay() {
    await electronApi.storyOverlay.close()
    overlayVisible.value = false
  }

  watch(snapshot, syncOverlay, { deep: true })

  return {
    storyPresets,
    skillPresets,
    currentStoryPresetId,
    currentSkillPresetId,
    currentStoryPreset,
    currentSkillPreset,
    chapters,
    currentChapterId,
    currentStepId,
    currentChapter,
    currentChapterIndex,
    currentStep,
    currentSkillGroups,
    overlayVisible,
    snapshot,
    canCopySkillsToNextChapter,
    save,
    syncOverlay,
    selectChapter,
    selectStep,
    addStoryPreset,
    addSkillPreset,
    renameStoryPreset,
    renameSkillPreset,
    switchStoryPreset,
    switchSkillPreset,
    deleteStoryPreset,
    deleteSkillPreset,
    addChapter,
    deleteChapter,
    addStep,
    deleteStep,
    reorderChapter,
    reorderStep,
    addSkillGroup,
    deleteSkillGroup,
    reorderSkillGroup,
    addSkill,
    deleteSkill,
    copyCurrentChapterSkillsToNext,
    previous,
    next,
    showOverlay,
    hideOverlay
  }
})
