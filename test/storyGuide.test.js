import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildStoryFlow,
  buildStorySnapshot,
  moveStoryStep,
  normalizeStoryData,
  readStoryData,
  reorderItemsById,
  selectStoryEntryAfterRemoval,
  STORY_STORAGE_KEY,
  writeStoryData
} from '../src/utils/storyGuide.js'

const chapters = [
  { id: 'c1', name: '第一章', steps: [{ id: 's1', text: '一步' }, { id: 's2', text: '二步' }], skillGroups: [] },
  { id: 'empty', name: '空章', steps: [], skillGroups: [] },
  { id: 'c2', name: '第二章', steps: [{ id: 's3', text: '三步' }], skillGroups: [] }
]

test('剧情数据规范化补齐结构、修复进度并约束技能颜色', () => {
  const data = normalizeStoryData({
    chapters: [{ name: '章节', steps: ['说明'], skillGroups: [{ skills: [{ name: '技能', color: 'purple' }] }] }],
    currentStepId: 'missing'
  })
  assert.equal(data.version, 1)
  assert.equal(data.chapters[0].steps[0].text, '说明')
  assert.equal(data.chapters[0].skillGroups[0].skills[0].color, 'red')
  assert.equal(data.currentStepId, data.chapters[0].steps[0].id)
})

test('剧情数据保留完整目录字段并兼容旧技能和无效目录元数据', () => {
  const data = normalizeStoryData({
    version: 1,
    chapters: [{
      name: '章节',
      steps: ['说明'],
      skillGroups: [{ skills: [
        { name: '劈砍', color: 'red', gemId: 'gem:cleave', requiredLevel: 1, kind: 'active' },
        { name: '旧技能', color: 'green' },
        { name: '损坏关联', color: 'blue', gemId: 'gem:bad', requiredLevel: 0, kind: 'active' }
      ] }]
    }]
  })
  const [catalogSkill, legacySkill, invalidSkill] = data.chapters[0].skillGroups[0].skills
  assert.equal(data.version, 1)
  assert.deepEqual(
    { gemId: catalogSkill.gemId, requiredLevel: catalogSkill.requiredLevel, kind: catalogSkill.kind },
    { gemId: 'gem:cleave', requiredLevel: 1, kind: 'active' }
  )
  assert.equal('gemId' in legacySkill, false)
  assert.equal('gemId' in invalidSkill, false)
})

test('连续剧情导航跨章、跳过空章并在首尾停留', () => {
  assert.deepEqual(buildStoryFlow(chapters).map(item => item.step.id), ['s1', 's2', 's3'])
  assert.equal(moveStoryStep(chapters, 's2', 1).step.id, 's3')
  assert.equal(moveStoryStep(chapters, 's3', -1).step.id, 's2')
  assert.equal(moveStoryStep(chapters, 's1', -1).step.id, 's1')
  assert.equal(moveStoryStep(chapters, 's3', 1).step.id, 's3')
})

test('浮窗快照包含三步上下文和当前章节的有效技能', () => {
  const source = structuredClone(chapters)
  source[0].skillGroups = [{ id: 'g1', name: '位移', skills: [
    { id: 'a', name: '冲刺', color: 'green', gemId: 'gem:dash', requiredLevel: 4, kind: 'active' },
    { id: 'b', name: ' ', color: 'red' }
  ] }]
  const snapshot = buildStorySnapshot(source, 's2')
  assert.equal(snapshot.previous.text, '一步')
  assert.equal(snapshot.current.text, '二步')
  assert.equal(snapshot.next.text, '三步')
  assert.deepEqual(snapshot.chapter.skillGroups[0].skills.map(skill => skill.name), ['冲刺'])
  assert.deepEqual(snapshot.chapter.skillGroups[0].skills[0], { id: 'a', name: '冲刺', color: 'green' })
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

test('剧情存储读写失败时安全降级', () => {
  const values = new Map()
  const storage = {
    getItem: key => values.get(key),
    setItem: (key, value) => values.set(key, value)
  }
  assert.equal(writeStoryData({ chapters }, storage), true)
  assert.equal(JSON.parse(values.get(STORY_STORAGE_KEY)).chapters.length, 3)
  assert.equal(readStoryData(storage).chapters.length, 3)
  assert.deepEqual(readStoryData({ getItem: () => '{bad' }).chapters, [])
})

test('稳定 ID 排序可前移和后移且不替换对象', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const original = items[0]
  assert.equal(reorderItemsById(items, 'a', 'c'), true)
  assert.deepEqual(items.map(item => item.id), ['b', 'c', 'a'])
  assert.equal(items[2], original)
  assert.equal(reorderItemsById(items, 'missing', 'b'), false)
  assert.equal(reorderItemsById(items, 'c', 'b'), true)
  assert.deepEqual(items.map(item => item.id), ['c', 'b', 'a'])
})
