import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildStoryFlow,
  buildStorySnapshot,
  createSkillPreset,
  createStoryPreset,
  moveStoryStep,
  normalizeStoryData,
  readStoryData,
  reorderItemsById,
  replaceChapterSkillGroups,
  selectStoryEntryAfterRemoval,
  STORY_STORAGE_KEY,
  writeStoryData
} from '../src/utils/storyGuide.js'

const chapters = [
  { id: 'c1', name: '第一章', steps: [{ id: 's1', text: '一步' }, { id: 's2', text: '二步' }] },
  { id: 'empty', name: '空章', steps: [] },
  { id: 'c2', name: '第二章', steps: [{ id: 's3', text: '三步' }] }
]

test('v1 剧情数据无损迁移为独立的默认剧情和技能预设', () => {
  const data = normalizeStoryData({
    version: 1,
    chapters: [{
      name: '章节',
      steps: ['说明'],
      skillGroups: [{ skills: [{ name: '白色技能', color: 'white' }, { name: '坏颜色', color: 'purple' }] }]
    }]
  })
  assert.equal(data.version, 2)
  assert.equal(data.storyPresets[0].chapters[0].steps[0].text, '说明')
  assert.equal(data.skillPresets[0].chapterSkills[0].skillGroups[0].skills[0].color, 'white')
  assert.equal(data.skillPresets[0].chapterSkills[0].skillGroups[0].skills[1].color, 'red')
  assert.equal(data.currentStoryPresetId, 'default')
  assert.equal(data.currentSkillPresetId, 'default')
})

test('迁移保留目录字段并兼容自由文本和无效目录元数据', () => {
  const data = normalizeStoryData({
    chapters: [{
      id: 'c1',
      steps: [{ id: 's1', text: '说明' }],
      skillGroups: [{ skills: [
        { name: '号召', color: 'white', gemId: 'gem:convocation', requiredLevel: 24, kind: 'active' },
        { name: '旧技能', color: 'blue' },
        { name: '损坏关联', color: 'blue', gemId: 'gem:bad', requiredLevel: 0, kind: 'active' }
      ] }]
    }],
    currentStepId: 's1'
  })
  const [catalogSkill, legacySkill, invalidSkill] = data.skillPresets[0].chapterSkills[0].skillGroups[0].skills
  assert.deepEqual(
    { gemId: catalogSkill.gemId, requiredLevel: catalogSkill.requiredLevel, kind: catalogSkill.kind, color: catalogSkill.color },
    { gemId: 'gem:convocation', requiredLevel: 24, kind: 'active', color: 'white' }
  )
  assert.equal('gemId' in legacySkill, false)
  assert.equal('gemId' in invalidSkill, false)
})

test('复制预设会重建实体 ID 且后续编辑相互隔离', () => {
  const sourceStory = {
    chapters: [{ id: 'c1', name: '第一章', steps: [{ id: 's1', text: '原步骤' }] }],
    currentStepId: 's1'
  }
  const storyCopy = createStoryPreset('副本', sourceStory)
  assert.notEqual(storyCopy.chapters[0].id, 'c1')
  assert.notEqual(storyCopy.chapters[0].steps[0].id, 's1')
  storyCopy.chapters[0].steps[0].text = '已修改'
  assert.equal(sourceStory.chapters[0].steps[0].text, '原步骤')

  const sourceSkill = {
    chapterSkills: [{ skillGroups: [{ id: 'g1', name: '组', skills: [{ id: 'a', name: '号召', color: 'white' }] }] }]
  }
  const skillCopy = createSkillPreset('副本', sourceSkill)
  assert.notEqual(skillCopy.chapterSkills[0].skillGroups[0].id, 'g1')
  assert.notEqual(skillCopy.chapterSkills[0].skillGroups[0].skills[0].id, 'a')
})

test('连续剧情导航跨章、跳过空章并在首尾停留', () => {
  assert.deepEqual(buildStoryFlow(chapters).map(item => item.step.id), ['s1', 's2', 's3'])
  assert.equal(moveStoryStep(chapters, 's2', 1).step.id, 's3')
  assert.equal(moveStoryStep(chapters, 's3', -1).step.id, 's2')
  assert.equal(moveStoryStep(chapters, 's1', -1).step.id, 's1')
  assert.equal(moveStoryStep(chapters, 's3', 1).step.id, 's3')
})

test('浮窗快照组合当前章节技能并按设置显示最低等级', () => {
  const groups = [{ id: 'g1', name: '召唤', skills: [
    { id: 'a', name: '号召', color: 'white', gemId: 'gem:convocation', requiredLevel: 24, kind: 'active' },
    { id: 'blank', name: '  ', color: 'red' }
  ] }]
  const shown = buildStorySnapshot(chapters, 's2', groups, { showRequiredLevel: true })
  assert.equal(shown.current.text, '二步')
  assert.equal(shown.next.chapterName, '第二章')
  assert.deepEqual(shown.chapter.skillGroups[0].skills[0], {
    id: 'a', name: '号召', color: 'white', requiredLevel: 24
  })
  const hidden = buildStorySnapshot(chapters, 's2', groups, { showRequiredLevel: false })
  assert.equal('requiredLevel' in hidden.chapter.skillGroups[0].skills[0], false)
})

test('整章技能覆盖复制会补齐目标槽并生成独立 ID', () => {
  const chapterSkills = [{ skillGroups: [{ id: 'g1', name: '召唤', skills: [{ id: 'a', name: '号召', color: 'white' }] }] }]
  assert.equal(replaceChapterSkillGroups(chapterSkills, 0, 1), true)
  assert.equal(chapterSkills.length, 2)
  assert.equal(chapterSkills[1].skillGroups[0].name, '召唤')
  assert.notEqual(chapterSkills[1].skillGroups[0].id, 'g1')
  assert.notEqual(chapterSkills[1].skillGroups[0].skills[0].id, 'a')
  chapterSkills[1].skillGroups[0].skills[0].name = '修改'
  assert.equal(chapterSkills[0].skillGroups[0].skills[0].name, '号召')
})

test('删除当前步骤后优先选择后继，无后继时选择前驱', () => {
  const middleRemoved = structuredClone(chapters)
  middleRemoved[0].steps.splice(1, 1)
  assert.equal(selectStoryEntryAfterRemoval(middleRemoved, 1).step.id, 's3')

  const lastRemoved = structuredClone(chapters)
  lastRemoved[2].steps.splice(0, 1)
  assert.equal(selectStoryEntryAfterRemoval(lastRemoved, 2).step.id, 's2')
  assert.equal(selectStoryEntryAfterRemoval([], 0), null)
})

test('剧情存储读写失败时安全降级并写入 v2', () => {
  const values = new Map()
  const storage = {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value)
  }
  assert.equal(writeStoryData({ chapters }, storage), true)
  assert.equal(JSON.parse(values.get(STORY_STORAGE_KEY)).version, 2)
  assert.equal(readStoryData(storage).storyPresets[0].chapters.length, 3)
  assert.equal(readStoryData({ getItem: () => '{bad' }).storyPresets[0].chapters.length, 0)
  assert.equal(writeStoryData({ chapters }, { setItem: () => { throw new Error('full') } }), false)
})

test('稳定 ID 排序按最终索引精确前移和后移且不替换对象', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
  const original = items[0]

  assert.equal(reorderItemsById(items, 'a', 1), true)
  assert.deepEqual(items.map(item => item.id), ['b', 'a', 'c', 'd'])
  assert.equal(items[1], original)

  assert.equal(reorderItemsById(items, 'd', 1), true)
  assert.deepEqual(items.map(item => item.id), ['b', 'd', 'a', 'c'])
  assert.equal(reorderItemsById(items, 'd', 0), true)
  assert.deepEqual(items.map(item => item.id), ['d', 'b', 'a', 'c'])
  assert.equal(reorderItemsById(items, 'd', 3), true)
  assert.deepEqual(items.map(item => item.id), ['b', 'a', 'c', 'd'])

  assert.equal(reorderItemsById(items, 'a', 2), true)
  assert.deepEqual(items.map(item => item.id), ['b', 'c', 'a', 'd'])
  assert.equal(reorderItemsById(items, 'a', 2), false)
  assert.equal(reorderItemsById(items, 'missing', 0), false)
  assert.equal(reorderItemsById(items, 'a', Number.NaN), false)
  assert.equal(items[2], original)
})
