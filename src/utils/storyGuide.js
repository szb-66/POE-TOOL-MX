export const STORY_STORAGE_KEY = 'storyGuide:v1'
export const STORY_VERSION = 2
export const DEFAULT_STORY_PRESET_ID = 'default'
export const DEFAULT_SKILL_PRESET_ID = 'default'
export const SKILL_COLORS = ['red', 'green', 'blue', 'white']

export function reorderItemsById(items, movedId, targetId) {
  const sourceIndex = items.findIndex(item => item.id === movedId)
  const targetIndex = items.findIndex(item => item.id === targetId)
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return false
  const [moved] = items.splice(sourceIndex, 1)
  items.splice(targetIndex, 0, moved)
  return true
}

let fallbackId = 0

export function createStoryId(prefix = 'story') {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return `${prefix}-${uuid}`
  fallbackId += 1
  return `${prefix}-${Date.now().toString(36)}-${fallbackId.toString(36)}`
}

function normalizeName(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function normalizeStep(raw) {
  if (typeof raw === 'string') return { id: createStoryId('step'), text: raw }
  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : createStoryId('step'),
    text: typeof raw?.text === 'string' ? raw.text : ''
  }
}

export function normalizeSkill(raw) {
  const skill = {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : createStoryId('skill'),
    name: typeof raw?.name === 'string' ? raw.name : '',
    color: SKILL_COLORS.includes(raw?.color) ? raw.color : 'red'
  }
  const requiredLevel = Number(raw?.requiredLevel)
  if (
    typeof raw?.gemId === 'string' && raw.gemId
    && Number.isInteger(requiredLevel) && requiredLevel >= 1 && requiredLevel <= 100
    && ['active', 'support'].includes(raw?.kind)
  ) {
    skill.gemId = raw.gemId
    skill.requiredLevel = requiredLevel
    skill.kind = raw.kind
  }
  return skill
}

function normalizeSkillGroup(raw) {
  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : createStoryId('group'),
    name: typeof raw?.name === 'string' ? raw.name : '',
    skills: Array.isArray(raw?.skills) ? raw.skills.map(normalizeSkill) : []
  }
}

function normalizeChapter(raw, index) {
  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : createStoryId('chapter'),
    name: typeof raw?.name === 'string' ? raw.name : `章节 ${index + 1}`,
    steps: Array.isArray(raw?.steps) ? raw.steps.map(normalizeStep) : []
  }
}

function normalizeStoryProgress(preset) {
  const flow = buildStoryFlow(preset.chapters)
  const current = flow.find(item => item.step.id === preset.currentStepId)
  if (current) {
    preset.currentChapterId = current.chapter.id
    return preset
  }
  const selectedChapter = preset.chapters.find(chapter => chapter.id === preset.currentChapterId)
  const fallback = selectedChapter?.steps.length
    ? flow.find(item => item.chapter.id === selectedChapter.id)
    : flow[0]
  preset.currentChapterId = fallback?.chapter.id || selectedChapter?.id || preset.chapters[0]?.id || null
  preset.currentStepId = fallback?.step.id || null
  return preset
}

function normalizeStoryPreset(raw, index = 0) {
  return normalizeStoryProgress({
    id: typeof raw?.id === 'string' && raw.id ? raw.id : (index === 0 ? DEFAULT_STORY_PRESET_ID : createStoryId('story-preset')),
    name: normalizeName(raw?.name, index === 0 ? '默认剧情' : `剧情预设 ${index + 1}`),
    chapters: Array.isArray(raw?.chapters) ? raw.chapters.map(normalizeChapter) : [],
    currentChapterId: typeof raw?.currentChapterId === 'string' ? raw.currentChapterId : null,
    currentStepId: typeof raw?.currentStepId === 'string' ? raw.currentStepId : null
  })
}

function normalizeSkillPreset(raw, index = 0) {
  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : (index === 0 ? DEFAULT_SKILL_PRESET_ID : createStoryId('skill-preset')),
    name: normalizeName(raw?.name, index === 0 ? '默认技能' : `技能预设 ${index + 1}`),
    chapterSkills: Array.isArray(raw?.chapterSkills)
      ? raw.chapterSkills.map(slot => ({
          skillGroups: Array.isArray(slot?.skillGroups) ? slot.skillGroups.map(normalizeSkillGroup) : []
        }))
      : []
  }
}

export function createEmptyStoryData() {
  return {
    version: STORY_VERSION,
    storyPresets: [normalizeStoryPreset({ id: DEFAULT_STORY_PRESET_ID, name: '默认剧情' })],
    skillPresets: [normalizeSkillPreset({ id: DEFAULT_SKILL_PRESET_ID, name: '默认技能' })],
    currentStoryPresetId: DEFAULT_STORY_PRESET_ID,
    currentSkillPresetId: DEFAULT_SKILL_PRESET_ID
  }
}

function migrateLegacyStoryData(raw) {
  const chapters = Array.isArray(raw?.chapters) ? raw.chapters : []
  return {
    version: STORY_VERSION,
    storyPresets: [normalizeStoryPreset({
      id: DEFAULT_STORY_PRESET_ID,
      name: '默认剧情',
      chapters,
      currentChapterId: raw?.currentChapterId,
      currentStepId: raw?.currentStepId
    })],
    skillPresets: [normalizeSkillPreset({
      id: DEFAULT_SKILL_PRESET_ID,
      name: '默认技能',
      chapterSkills: chapters.map(chapter => ({ skillGroups: chapter?.skillGroups }))
    })],
    currentStoryPresetId: DEFAULT_STORY_PRESET_ID,
    currentSkillPresetId: DEFAULT_SKILL_PRESET_ID
  }
}

export function normalizeStoryData(raw) {
  if (Number(raw?.version) !== STORY_VERSION || !Array.isArray(raw?.storyPresets) || !Array.isArray(raw?.skillPresets)) {
    return migrateLegacyStoryData(raw)
  }
  const storyPresets = raw.storyPresets.length
    ? raw.storyPresets.map(normalizeStoryPreset)
    : createEmptyStoryData().storyPresets
  const skillPresets = raw.skillPresets.length
    ? raw.skillPresets.map(normalizeSkillPreset)
    : createEmptyStoryData().skillPresets
  return {
    version: STORY_VERSION,
    storyPresets,
    skillPresets,
    currentStoryPresetId: storyPresets.some(item => item.id === raw.currentStoryPresetId)
      ? raw.currentStoryPresetId
      : storyPresets[0].id,
    currentSkillPresetId: skillPresets.some(item => item.id === raw.currentSkillPresetId)
      ? raw.currentSkillPresetId
      : skillPresets[0].id
  }
}

export function readStoryData(storage = globalThis.localStorage) {
  if (!storage?.getItem) return createEmptyStoryData()
  try {
    const saved = storage.getItem(STORY_STORAGE_KEY)
    return saved ? normalizeStoryData(JSON.parse(saved)) : createEmptyStoryData()
  } catch {
    return createEmptyStoryData()
  }
}

export function writeStoryData(data, storage = globalThis.localStorage) {
  if (!storage?.setItem) return false
  try {
    storage.setItem(STORY_STORAGE_KEY, JSON.stringify(normalizeStoryData(data)))
    return true
  } catch {
    return false
  }
}

function cloneStep(step) {
  return { id: createStoryId('step'), text: step.text }
}

export function cloneSkillGroups(groups = []) {
  return groups.map(group => ({
    id: createStoryId('group'),
    name: group.name,
    skills: group.skills.map(skill => ({ ...skill, id: createStoryId('skill') }))
  }))
}

export function replaceChapterSkillGroups(chapterSkills, sourceIndex, targetIndex) {
  if (!Array.isArray(chapterSkills) || sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return false
  const source = chapterSkills[sourceIndex]?.skillGroups || []
  while (chapterSkills.length <= targetIndex) chapterSkills.push({ skillGroups: [] })
  chapterSkills[targetIndex] = { skillGroups: cloneSkillGroups(source) }
  return true
}

export function createStoryPreset(name, source = null) {
  const chapters = source?.chapters?.map(chapter => ({
    id: createStoryId('chapter'),
    name: chapter.name,
    steps: chapter.steps.map(cloneStep)
  })) || []
  const preset = {
    id: createStoryId('story-preset'),
    name: normalizeName(name, '新剧情预设'),
    chapters,
    currentChapterId: null,
    currentStepId: null
  }
  if (source?.currentStepId) {
    const sourceFlow = buildStoryFlow(source.chapters)
    const targetFlow = buildStoryFlow(chapters)
    const sourceIndex = sourceFlow.findIndex(item => item.step.id === source.currentStepId)
    const target = targetFlow[sourceIndex]
    preset.currentChapterId = target?.chapter.id || chapters[0]?.id || null
    preset.currentStepId = target?.step.id || null
  }
  return normalizeStoryProgress(preset)
}

export function createSkillPreset(name, source = null) {
  return {
    id: createStoryId('skill-preset'),
    name: normalizeName(name, '新技能预设'),
    chapterSkills: source?.chapterSkills?.map(slot => ({ skillGroups: cloneSkillGroups(slot.skillGroups) })) || []
  }
}

export function buildStoryFlow(chapters = []) {
  return chapters.flatMap((chapter, chapterIndex) =>
    chapter.steps.map((step, stepIndex) => ({ chapter, step, chapterIndex, stepIndex }))
  )
}

export function getStoryContext(chapters, currentStepId) {
  const flow = buildStoryFlow(chapters)
  const index = flow.findIndex(item => item.step.id === currentStepId)
  if (index < 0) return { previous: null, current: null, next: null, index: -1, flow }
  return {
    previous: flow[index - 1] || null,
    current: flow[index],
    next: flow[index + 1] || null,
    index,
    flow
  }
}

export function moveStoryStep(chapters, currentStepId, direction) {
  const context = getStoryContext(chapters, currentStepId)
  if (!context.flow.length) return null
  if (context.index < 0) return context.flow[0]
  const targetIndex = Math.max(0, Math.min(context.flow.length - 1, context.index + direction))
  return context.flow[targetIndex]
}

export function selectStoryEntryAfterRemoval(chapters, removedFlowIndex) {
  const flow = buildStoryFlow(chapters)
  if (!flow.length) return null
  return flow[Math.min(Math.max(removedFlowIndex, 0), flow.length - 1)]
}

export function buildStorySnapshot(
  chapters,
  currentStepId,
  currentSkillGroups = null,
  { currentChapterId = null, showRequiredLevel = false } = {}
) {
  const selectedContext = getStoryContext(chapters, currentStepId)
  const currentChapter = selectedContext.current?.chapter
    || chapters.find(chapter => chapter.id === currentChapterId)
    || null
  const legacyGroups = currentChapter?.skillGroups
  const skillGroups = Array.isArray(currentSkillGroups) ? currentSkillGroups : (legacyGroups || [])
  const serializeEntry = entry => entry ? {
    chapterId: entry.chapter.id,
    chapterName: entry.chapter.name,
    stepId: entry.step.id,
    text: entry.step.text
  } : null
  return {
    previous: serializeEntry(selectedContext.previous),
    current: serializeEntry(selectedContext.current),
    next: serializeEntry(selectedContext.next),
    chapter: currentChapter ? {
      id: currentChapter.id,
      name: currentChapter.name,
      skillGroups: skillGroups.map(group => ({
        id: group.id,
        name: group.name,
        skills: group.skills
          .filter(skill => skill.name.trim())
          .map(skill => ({
            id: skill.id,
            name: skill.name,
            color: skill.color,
            ...(showRequiredLevel && skill.gemId && Number.isInteger(skill.requiredLevel)
              ? { requiredLevel: skill.requiredLevel }
              : {})
          }))
      })).filter(group => group.skills.length)
    } : null
  }
}
