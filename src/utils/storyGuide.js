export const STORY_STORAGE_KEY = 'storyGuide:v1'
export const STORY_VERSION = 1
export const SKILL_COLORS = ['red', 'green', 'blue']

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

export function createEmptyStoryData() {
  return {
    version: STORY_VERSION,
    chapters: [],
    currentChapterId: null,
    currentStepId: null
  }
}

function normalizeStep(raw) {
  if (typeof raw === 'string') {
    return { id: createStoryId('step'), text: raw }
  }
  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : createStoryId('step'),
    text: typeof raw?.text === 'string' ? raw.text : ''
  }
}

function normalizeSkill(raw) {
  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : createStoryId('skill'),
    name: typeof raw?.name === 'string' ? raw.name : '',
    color: SKILL_COLORS.includes(raw?.color) ? raw.color : 'red'
  }
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
    steps: Array.isArray(raw?.steps) ? raw.steps.map(normalizeStep) : [],
    skillGroups: Array.isArray(raw?.skillGroups) ? raw.skillGroups.map(normalizeSkillGroup) : []
  }
}

export function buildStoryFlow(chapters = []) {
  return chapters.flatMap((chapter, chapterIndex) =>
    chapter.steps.map((step, stepIndex) => ({ chapter, step, chapterIndex, stepIndex }))
  )
}

export function normalizeStoryData(raw) {
  const normalized = {
    version: STORY_VERSION,
    chapters: Array.isArray(raw?.chapters) ? raw.chapters.map(normalizeChapter) : [],
    currentChapterId: typeof raw?.currentChapterId === 'string' ? raw.currentChapterId : null,
    currentStepId: typeof raw?.currentStepId === 'string' ? raw.currentStepId : null
  }
  const flow = buildStoryFlow(normalized.chapters)
  const current = flow.find(item => item.step.id === normalized.currentStepId)
  if (current) {
    normalized.currentChapterId = current.chapter.id
    return normalized
  }
  const selectedChapter = normalized.chapters.find(chapter => chapter.id === normalized.currentChapterId)
  const fallback = selectedChapter?.steps.length
    ? flow.find(item => item.chapter.id === selectedChapter.id)
    : flow[0]
  normalized.currentChapterId = fallback?.chapter.id || null
  normalized.currentStepId = fallback?.step.id || null
  return normalized
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

export function buildStorySnapshot(chapters, currentStepId) {
  const context = getStoryContext(chapters, currentStepId)
  const currentChapter = context.current?.chapter || null
  const serializeEntry = entry => entry ? {
    chapterId: entry.chapter.id,
    chapterName: entry.chapter.name,
    stepId: entry.step.id,
    text: entry.step.text
  } : null
  return {
    previous: serializeEntry(context.previous),
    current: serializeEntry(context.current),
    next: serializeEntry(context.next),
    chapter: currentChapter ? {
      id: currentChapter.id,
      name: currentChapter.name,
      skillGroups: currentChapter.skillGroups.map(group => ({
        id: group.id,
        name: group.name,
        skills: group.skills.filter(skill => skill.name.trim()).map(skill => ({ ...skill }))
      })).filter(group => group.skills.length)
    } : null
  }
}
