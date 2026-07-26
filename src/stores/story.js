import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '@/api/electron'
import {
  buildStoryFlow,
  buildStorySnapshot,
  createStoryId,
  moveStoryStep,
  readStoryData,
  reorderItemsById,
  selectStoryEntryAfterRemoval,
  writeStoryData
} from '@/utils/storyGuide'

export const useStoryStore = defineStore('story', () => {
  const initial = readStoryData()
  const chapters = ref(initial.chapters)
  const currentChapterId = ref(initial.currentChapterId)
  const currentStepId = ref(initial.currentStepId)
  const overlayVisible = ref(false)

  const currentChapter = computed(() => chapters.value.find(item => item.id === currentChapterId.value) || null)
  const currentStep = computed(() => currentChapter.value?.steps.find(item => item.id === currentStepId.value) || null)
  const snapshot = computed(() => buildStorySnapshot(chapters.value, currentStepId.value))

  function stateData() {
    return {
      version: 1,
      chapters: chapters.value,
      currentChapterId: currentChapterId.value,
      currentStepId: currentStepId.value
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

  function addChapter() {
    const chapter = {
      id: createStoryId('chapter'),
      name: `章节 ${chapters.value.length + 1}`,
      steps: [],
      skillGroups: []
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
      selectEntry(selectStoryEntryAfterRemoval(chapters.value, activeIndex))
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
      selectEntry(selectStoryEntryAfterRemoval(chapters.value, removedFlowIndex))
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

  function addSkillGroup(chapterId) {
    const chapter = chapters.value.find(item => item.id === chapterId)
    if (!chapter) return null
    const group = { id: createStoryId('group'), name: `技能组 ${chapter.skillGroups.length + 1}`, skills: [] }
    chapter.skillGroups.push(group)
    save()
    return group
  }

  function deleteSkillGroup(chapterId, groupId) {
    const chapter = chapters.value.find(item => item.id === chapterId)
    const index = chapter?.skillGroups.findIndex(item => item.id === groupId) ?? -1
    if (!chapter || index < 0) return
    chapter.skillGroups.splice(index, 1)
    save()
  }

  function addSkill(chapterId, groupId) {
    const group = chapters.value.find(item => item.id === chapterId)?.skillGroups.find(item => item.id === groupId)
    if (!group) return null
    const skill = { id: createStoryId('skill'), name: '', color: 'red' }
    group.skills.push(skill)
    save()
    return skill
  }

  function deleteSkill(chapterId, groupId, skillId) {
    const group = chapters.value.find(item => item.id === chapterId)?.skillGroups.find(item => item.id === groupId)
    const index = group?.skills.findIndex(item => item.id === skillId) ?? -1
    if (!group || index < 0) return
    group.skills.splice(index, 1)
    save()
  }

  function move(direction) {
    selectEntry(moveStoryStep(chapters.value, currentStepId.value, direction))
  }

  const previous = () => move(-1)
  const next = () => move(1)

  async function showOverlay(width) {
    const result = await electronApi.storyOverlay.open(JSON.parse(JSON.stringify(snapshot.value)), width)
    overlayVisible.value = result?.success !== false
    return result
  }

  async function hideOverlay() {
    await electronApi.storyOverlay.close()
    overlayVisible.value = false
  }

  return {
    chapters,
    currentChapterId,
    currentStepId,
    overlayVisible,
    currentChapter,
    currentStep,
    snapshot,
    save,
    syncOverlay,
    selectChapter,
    selectStep,
    addChapter,
    deleteChapter,
    addStep,
    deleteStep,
    reorderChapter,
    reorderStep,
    addSkillGroup,
    deleteSkillGroup,
    addSkill,
    deleteSkill,
    previous,
    next,
    showOverlay,
    hideOverlay
  }
})
