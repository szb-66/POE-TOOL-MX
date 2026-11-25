import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { buildSkillGemCatalog as _m0_buildSkillGemCatalog, parseSkillGemPage as _m0_parseSkillGemPage } from '../scripts/skillGemCatalog.js'
import { applySkillCatalogSelection as _m0_applySkillCatalogSelection, searchSkillCatalog as _m0_searchSkillCatalog, skillSuggestionLabel as _m0_skillSuggestionLabel, updateSkillFreeText as _m0_updateSkillFreeText } from '../src/domains/story/skillCatalog.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFile as _m1_readFile } from 'node:fs/promises'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { buildStoryFlow as _m2_buildStoryFlow, buildStorySnapshot as _m2_buildStorySnapshot, createSkillPreset as _m2_createSkillPreset, createStoryPreset as _m2_createStoryPreset, moveStoryStep as _m2_moveStoryStep, normalizeStoryData as _m2_normalizeStoryData, readStoryData as _m2_readStoryData, reorderItemsById as _m2_reorderItemsById, replaceChapterSkillGroups as _m2_replaceChapterSkillGroups, selectStoryEntryAfterRemoval as _m2_selectStoryEntryAfterRemoval, STORY_STORAGE_KEY as _m2_STORY_STORAGE_KEY, writeStoryData as _m2_writeStoryData } from '../src/utils/storyGuide.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import _m3_fs from 'node:fs'
import { getStoryDividerGripBounds as _m3_getStoryDividerGripBounds, getStoryDividerRatioFromGrip as _m3_getStoryDividerRatioFromGrip, isPointInStoryDividerGrip as _m3_isPointInStoryDividerGrip, storyOverlayBoundsEqual as _m3_storyOverlayBoundsEqual } from '../electron/modules/window/storyGrip.js'
import { OVERLAY_DRAG_HIT_HEIGHT as _m3_OVERLAY_DRAG_HIT_HEIGHT, OVERLAY_DRAG_HIT_WIDTH as _m3_OVERLAY_DRAG_HIT_WIDTH, STORY_OVERLAY_DRAG_HIT_TOP as _m3_STORY_OVERLAY_DRAG_HIT_TOP, isPointInCenteredOverlayDragHandle as _m3_isPointInCenteredOverlayDragHandle } from '../electron/modules/window/overlayDrag.js'
import { createStoryOverlayGeometryReporter as _m3_createStoryOverlayGeometryReporter } from '../src/domains/story/storyOverlayGeometry.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { readFile as _m4_readFile } from 'node:fs/promises'
import { DEFAULT_STORY_OVERLAY_WIDTH as _m4_DEFAULT_STORY_OVERLAY_WIDTH, DEFAULT_STORY_OVERLAY_OPACITY as _m4_DEFAULT_STORY_OVERLAY_OPACITY, DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL as _m4_DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL, MAX_STORY_OVERLAY_WIDTH as _m4_MAX_STORY_OVERLAY_WIDTH, migrateStoryOverlayLayout as _m4_migrateStoryOverlayLayout, MIN_STORY_OVERLAY_WIDTH as _m4_MIN_STORY_OVERLAY_WIDTH, normalizeStoryOverlayOpacity as _m4_normalizeStoryOverlayOpacity, normalizeStoryOverlayWidth as _m4_normalizeStoryOverlayWidth, normalizeStoryShowSkillRequiredLevel as _m4_normalizeStoryShowSkillRequiredLevel } from '../src/domains/settings/storySkillSettings.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { readFileSync as _m5_readFileSync } from 'node:fs'
import { STORY_TIMER_PAUSE_REASON as _m5_STORY_TIMER_PAUSE_REASON, STORY_TIMER_PAGE_ACTION as _m5_STORY_TIMER_PAGE_ACTION, STORY_TIMER_STATUS as _m5_STORY_TIMER_STATUS, appendStoryTimerHistory as _m5_appendStoryTimerHistory, checkpointStoryTimer as _m5_checkpointStoryTimer, formatStoryTimerDuration as _m5_formatStoryTimerDuration, getStoryTimerPageAction as _m5_getStoryTimerPageAction, normalizeStoryTimerState as _m5_normalizeStoryTimerState, restoreStoryTimerState as _m5_restoreStoryTimerState, storyTimerElapsed as _m5_storyTimerElapsed } from '../src/utils/storyTimer.js'
import { getStoryOverlayRequestedWidth as _m5_getStoryOverlayRequestedWidth } from '../electron/modules/window/storyOverlayWidth.js'

// === Merged from skillGemCatalog.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const buildSkillGemCatalog = _m0_buildSkillGemCatalog
  const parseSkillGemPage = _m0_parseSkillGemPage
  const applySkillCatalogSelection = _m0_applySkillCatalogSelection
  const searchSkillCatalog = _m0_searchSkillCatalog
  const skillSuggestionLabel = _m0_skillSuggestionLabel
  const updateSkillFreeText = _m0_updateSkillFreeText
const page = (rows) => `
  <table class="filters"><tbody>${rows}</tbody></table>
`
const row = ({ color, path, name, level }) => `
  <tr><td><a class="gem_${color}" href="${path}"><img></a></td>
  <td><a class="gem_${color}" href="${path}">${name}</a> (${level})<div class="gem_tags">标签</div></td></tr>
`
const whiteRow = ({ path, name, level }) => `
  <tr><td><a class="gemitem" href="${path}"><img alt="${name}White"></a></td>
  <td><a class="gemitem" href="${path}">${name}</a> (${level})<div class="gem_tags">标签</div></td></tr>
`

test('技能页面解析名称、等级、颜色、类型并忽略无效行和重复项', () => {
  const cleave = row({ color: 'red', path: '/cn/Cleave', name: '劈砍', level: 1 })
  const parsed = parseSkillGemPage(page(`
    ${cleave}${cleave}
    ${row({ color: 'green', path: '/cn/Blade_Trap', name: 'Blade Trap', level: 12 })}
    <tr><td>无效记录</td></tr>
  `), { kind: 'active' })
  assert.equal(parsed.length, 2)
  assert.deepEqual(parsed.map(({ name, requiredLevel, color, kind, sourcePath }) => ({
    name, requiredLevel, color, kind, sourcePath
  })), [
    { name: '劈砍', requiredLevel: 1, color: 'red', kind: 'active', sourcePath: '/cn/Cleave' },
    { name: 'Blade Trap', requiredLevel: 12, color: 'green', kind: 'active', sourcePath: '/cn/Blade_Trap' }
  ])
  assert.ok(parsed.every(skill => skill.id.startsWith('gem:')))
})

test('规范化目录合并主动与辅助宝石并保留元数据', () => {
  const catalog = buildSkillGemCatalog({
    activeHtml: page(row({ color: 'red', path: '/cn/Cleave', name: '劈砍', level: 1 })),
    supportHtml: page(row({ color: 'blue', path: '/cn/Arcane_Surge_Support', name: '秘术增强(辅)', level: 1 })),
    patch: '3.28',
    generatedAt: '2026-07-27T00:00:00.000Z',
    sources: [{ id: 'gem:active' }]
  })
  assert.equal(catalog.schemaVersion, 1)
  assert.equal(catalog.locale, 'zh-CN')
  assert.deepEqual(new Set(catalog.skills.map(skill => skill.kind)), new Set(['active', 'support']))
})

test('白色技能按稳定来源去重并保留最低需求等级', () => {
  const parsed = parseSkillGemPage(page(`
    ${whiteRow({ path: '/cn/Convocation', name: '号召', level: 31 })}
    ${whiteRow({ path: '/cn/Convocation', name: '号召', level: 24 })}
  `), { kind: 'active' })
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].name, '号召')
  assert.equal(parsed[0].color, 'white')
  assert.equal(parsed[0].requiredLevel, 24)
})

test('联想支持中文和不区分大小写的英文子串并始终生成等级标签', () => {
  const skills = [
    { id: 'a', name: '劈砍', requiredLevel: 1, color: 'red', kind: 'active' },
    { id: 'b', name: 'Blade Trap', requiredLevel: 12, color: 'green', kind: 'active' }
  ]
  assert.equal(searchSkillCatalog(skills, '劈')[0].value, '劈砍(1)')
  assert.equal(searchSkillCatalog(skills, 'TRAP')[0].name, 'Blade Trap')
  assert.equal(skillSuggestionLabel(skills[1]), 'Blade Trap(12)')
})

test('选择目录技能补齐信息，自由编辑解除目录关联但保留颜色', () => {
  const skill = { id: 'story-skill', name: '劈', color: 'blue' }
  applySkillCatalogSelection(skill, {
    id: 'gem:cleave', name: '劈砍', requiredLevel: 1, color: 'red', kind: 'active'
  })
  assert.deepEqual(skill, {
    id: 'story-skill',
    name: '劈砍',
    color: 'red',
    gemId: 'gem:cleave',
    requiredLevel: 1,
    kind: 'active'
  })
  updateSkillFreeText(skill, '自定义劈砍')
  assert.deepEqual(skill, { id: 'story-skill', name: '自定义劈砍', color: 'red' })
})

test('英文技能目录使用真实英文来源且与中文技能保留相同稳定 ID', () => {
  const cn = parseSkillGemPage(page(row({ color: 'red', path: '/cn/Cleave', name: '劈砍', level: 1 })), { kind: 'active' })
  const en = parseSkillGemPage(page(row({ color: 'red', path: '/us/Cleave', name: 'Cleave', level: 1 })), { kind: 'active', locale: 'en' })
  assert.equal(en[0].id, cn[0].id)
  assert.equal(en[0].sourcePath, '/us/Cleave')
  assert.equal(parseSkillGemPage(page(row({ color: 'red', path: '/cn/Cleave', name: '劈砍', level: 1 })), { kind: 'active', locale: 'en' }).length, 0)
  assert.throws(() => parseSkillGemPage('', { kind: 'active', locale: 'invalid' }))
  const catalog = JSON.parse(readFileSync(new URL('../src/domains/story/skillCatalog.international.json', import.meta.url), 'utf8'))
  assert.equal(catalog.patch, '3.30.0')
  assert.equal(catalog.locale, 'en')
  assert.ok(catalog.sources.every(source => /^https:\/\/poedb.tw\/us\//.test(source.url) && /^[a-f0-9]{64}$/.test(source.sha256)))
  assert.ok(catalog.skills.length > 700)
  assert.equal(searchSkillCatalog(catalog.skills, 'CLEAVE').find(skill => skill.name === 'Cleave')?.requiredLevel, 1)
  assert.ok(catalog.skills.some(skill => skill.name === 'Holy Strike'))
  assert.ok(catalog.skills.some(skill => skill.name === 'Hallow Support'))
})
})()

// === Merged from skillGemSnapshot.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFile = _m1_readFile
const catalog = JSON.parse(await readFile(new URL('../src/domains/story/skillCatalog.json', import.meta.url), 'utf8'))

test('真实技能目录包含完整元数据、主动与辅助宝石哨兵', () => {
  assert.equal(catalog.schemaVersion, 1)
  assert.match(String(catalog.patch || ''), /^\d+\.\d+(?:\.\d+)?$/)
  assert.equal(catalog.locale, 'zh-CN')
  assert.ok(catalog.generatedAt)
  assert.equal(catalog.sources.length, 2)
  assert.ok(catalog.skills.length > 700)
  assert.ok(catalog.skills.every(skill =>
    skill.id && skill.name && Number.isInteger(skill.requiredLevel)
    && ['red', 'green', 'blue', 'white'].includes(skill.color)
    && ['active', 'support'].includes(skill.kind)
    && skill.sourcePath.startsWith('/cn/')
  ))
  assert.deepEqual(
    (({ name, requiredLevel, color, kind }) => ({ name, requiredLevel, color, kind }))(
      catalog.skills.find(skill => skill.name === '劈砍' && skill.kind === 'active')
    ),
    { name: '劈砍', requiredLevel: 1, color: 'red', kind: 'active' }
  )
  assert.deepEqual(
    (({ name, requiredLevel, color, kind }) => ({ name, requiredLevel, color, kind }))(
      catalog.skills.find(skill => skill.name === '号召' && skill.kind === 'active')
    ),
    { name: '号召', requiredLevel: 24, color: 'white', kind: 'active' }
  )
  assert.ok(catalog.skills.some(skill => /^无情[（(]辅[）)]$/.test(skill.name) && skill.kind === 'support'))
})
})()

// === Merged from storyGuide.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const buildStoryFlow = _m2_buildStoryFlow
  const buildStorySnapshot = _m2_buildStorySnapshot
  const createSkillPreset = _m2_createSkillPreset
  const createStoryPreset = _m2_createStoryPreset
  const moveStoryStep = _m2_moveStoryStep
  const normalizeStoryData = _m2_normalizeStoryData
  const readStoryData = _m2_readStoryData
  const reorderItemsById = _m2_reorderItemsById
  const replaceChapterSkillGroups = _m2_replaceChapterSkillGroups
  const selectStoryEntryAfterRemoval = _m2_selectStoryEntryAfterRemoval
  const STORY_STORAGE_KEY = _m2_STORY_STORAGE_KEY
  const writeStoryData = _m2_writeStoryData
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
  assert.equal(data.storyPresets[0].viewedChapterId, data.storyPresets[0].currentChapterId)
})

test('浏览章节与当前进度独立规范化并兼容缺失浏览字段', () => {
  const legacy = normalizeStoryData({
    version: 2,
    storyPresets: [{ id: 'default', chapters, currentChapterId: 'c1', currentStepId: 's2' }],
    skillPresets: [{ id: 'default', chapterSkills: [] }]
  })
  assert.equal(legacy.storyPresets[0].viewedChapterId, 'c1')
  assert.equal(legacy.storyPresets[0].currentStepId, 's2')

  const independent = normalizeStoryData({
    version: 2,
    storyPresets: [{ id: 'default', chapters, currentChapterId: 'c1', currentStepId: 's2', viewedChapterId: 'c2' }],
    skillPresets: [{ id: 'default', chapterSkills: [] }]
  })
  assert.equal(independent.storyPresets[0].viewedChapterId, 'c2')
  assert.equal(independent.storyPresets[0].currentChapterId, 'c1')
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
    currentStepId: 's1',
    viewedChapterId: 'c1'
  }
  const storyCopy = createStoryPreset('副本', sourceStory)
  assert.notEqual(storyCopy.chapters[0].id, 'c1')
  assert.notEqual(storyCopy.chapters[0].steps[0].id, 's1')
  assert.equal(storyCopy.viewedChapterId, storyCopy.chapters[0].id)
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
})()

// === Merged from storyIntegration.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const fs = _m3_fs
  const getStoryDividerGripBounds = _m3_getStoryDividerGripBounds
  const getStoryDividerRatioFromGrip = _m3_getStoryDividerRatioFromGrip
  const isPointInStoryDividerGrip = _m3_isPointInStoryDividerGrip
  const storyOverlayBoundsEqual = _m3_storyOverlayBoundsEqual
  const OVERLAY_DRAG_HIT_HEIGHT = _m3_OVERLAY_DRAG_HIT_HEIGHT
  const OVERLAY_DRAG_HIT_WIDTH = _m3_OVERLAY_DRAG_HIT_WIDTH
  const STORY_OVERLAY_DRAG_HIT_TOP = _m3_STORY_OVERLAY_DRAG_HIT_TOP
  const isPointInCenteredOverlayDragHandle = _m3_isPointInCenteredOverlayDragHandle
  const createStoryOverlayGeometryReporter = _m3_createStoryOverlayGeometryReporter
function source(path) {
  return fs.readFileSync(new URL(path, import.meta.url), 'utf8')
}

test('剧情浮窗使用独立窗口、路由和 IPC，不复用制作浮窗', () => {
  const manager = source('../electron/modules/window/manager.js')
  const router = source('../src/router/index.js')
  const ipc = source('../electron/modules/ipc/window.js')
  assert.match(manager, /let overlayWindow = null/)
  assert.match(manager, /let storyOverlayWindow = null/)
  assert.match(manager, /createStoryOverlayWindow/)
  assert.match(router, /path: '\/story-overlay'/)
  assert.match(ipc, /open-story-overlay/)
  assert.match(ipc, /update-story-overlay/)
})

test('覆盖层渲染进程不会重复初始化全局快捷键服务', () => {
  const app = source('../src/App.vue')
  assert.match(app, /if \(route\.meta\.noLayout\) return/)
})

test('剧情浮窗保存位置、恢复屏幕可见性并限制内容高度', () => {
  const manager = source('../electron/modules/window/manager.js')
  assert.match(manager, /storyOverlayBounds/)
  assert.match(manager, /screen\.getAllDisplays/)
  assert.match(manager, /display\.workArea\.height \* 0\.7/)
  assert.match(manager, /configuredWidth/)
  assert.match(manager, /requestedWidth/)
})

test('剧情浮窗使用统一指针拖动抓手且其余内容保持穿透', () => {
  const manager = source('../electron/modules/window/manager.js')
  const overlay = source('../src/domains/story/StoryOverlayView.vue')
  assert.doesNotMatch(manager, /storyOverlayGripWindow|createStoryGripWindow/)
  assert.match(manager, /storyOverlayWindow\.setIgnoreMouseEvents\(true, \{ forward: true \}\)/)
  assert.match(manager, /screen\.getCursorScreenPoint\(\)/)
  assert.match(manager, /new OverlayDragPassthroughController/)
  assert.match(manager, /isPointInCenteredOverlayDragHandle\(point, bounds, STORY_OVERLAY_DRAG_HIT_TOP\)/)
  assert.match(overlay, /class="story-position-grip"/)
  assert.match(overlay, /<div class="overlay-heading">[\s\S]*class="story-position-grip"[\s\S]*<\/div>/)
  assert.match(overlay, /createOverlayDrag/)
  assert.match(overlay, /@pointerdown="drag\.pointerDown"/)
  assert.match(overlay, /-webkit-app-region: no-drag/)
  assert.doesNotMatch(overlay, /setIgnoreMouseEvents|updatePositionGripHitTest/)
  assert.match(overlay, /cursor: grab/)
  assert.match(overlay, /cursor: grabbing/)
  assert.doesNotMatch(overlay, /drag-tip|拖动上方三点调整位置/)
})

test('主进程按屏幕坐标稳定命中位置抓手热区', () => {
  const bounds = { x: 100, y: 50, width: 460, height: 220 }
  assert.equal(OVERLAY_DRAG_HIT_WIDTH, 72)
  assert.equal(OVERLAY_DRAG_HIT_HEIGHT, 24)
  assert.equal(STORY_OVERLAY_DRAG_HIT_TOP, 4)
  assert.equal(isPointInCenteredOverlayDragHandle({ x: 330, y: 62 }, bounds), true)
  assert.equal(isPointInCenteredOverlayDragHandle({ x: 293, y: 62 }, bounds), false)
  assert.equal(isPointInCenteredOverlayDragHandle({ x: 330, y: 75 }, bounds), false)
})

test('位置抓手复用自动入库的固定起点拖动且始终恢复规范尺寸', () => {
  const manager = source('../electron/modules/window/manager.js')
  const preload = source('../electron/preload.cjs')
  const ipc = source('../electron/modules/ipc/window.js')
  const storyWindow = manager.slice(manager.indexOf('export function createStoryOverlayWindow'), manager.indexOf('export function resizeStoryOverlay'))
  assert.match(manager, /let storyOverlaySize = \{ width: 460, height: 220 \}/)
  assert.doesNotMatch(storyWindow, /setPosition|window-move|getStoryOverlayPositionFromGrip/)
  assert.doesNotMatch(manager, /storyOverlayGripWindow/)
  assert.match(manager, /requestedHeight == null \? storyOverlaySize\.height/)
  assert.match(manager, /desiredWidth = getStoryOverlayRequestedWidth\(storyOverlaySnapshot, storyOverlayContentWidth\)/)
  assert.match(manager, /export function setStoryOverlayDragging[\s\S]*storyOverlayDragPassthrough\.setDragging\(dragging\)/)
  assert.match(manager, /export function moveStoryOverlayTo[\s\S]*getFixedOverlayDragBounds\(point, display\.workArea, storyOverlaySize\)/)
  assert.match(ipc, /const storyOverlayDrag = new OverlayDragSession\(\)/)
  assert.match(ipc, /storyOverlayDrag\.begin/)
  assert.match(ipc, /window\.moveStoryOverlayTo\(requested\)/)
  assert.match(preload, /story-overlay-move/)
  assert.doesNotMatch(preload, /story-overlay-native-drag-ended/)
})

test('剧情浮窗几何上报会忽略未变化高度和布局', () => {
  const heights = []
  const layouts = []
  const report = createStoryOverlayGeometryReporter({
    resize: height => heights.push(height),
    updateLayout: layout => layouts.push(layout)
  })
  const geometry = { height: 201.4, layout: { stacked: false, left: 7, top: 30, width: 446, height: 160 } }

  report(geometry)
  report({ height: 201.49, layout: { ...geometry.layout } })
  assert.deepEqual(heights, [201])
  assert.equal(layouts.length, 1)

  report({ height: 203, layout: { ...geometry.layout, width: 440 } })
  assert.deepEqual(heights, [201, 203])
  assert.equal(layouts.length, 2)
})

test('剧情浮窗仅在原生边界实际改变时需要更新', () => {
  const current = { x: 100, y: 20, width: 460, height: 220 }
  assert.equal(storyOverlayBoundsEqual(current, { ...current }), true)
  assert.equal(storyOverlayBoundsEqual(current, { ...current, height: 221 }), false)
})

test('剧情浮窗布局上报不会回显分栏比例', () => {
  const manager = source('../electron/modules/window/manager.js')
  const handler = manager.slice(
    manager.indexOf('export function updateStoryOverlayLayout'),
    manager.indexOf('export function updateStoryOverlay(snapshot)')
  )
  assert.match(handler, /storyOverlayLayout\.width === nextLayout\.width/)
  assert.doesNotMatch(handler, /publishStoryDividerRatio/)
})

test('剧情浮窗宽度可输入并持久化，同组技能空间不足时换行', () => {
  const view = source('../src/domains/story/StoryView.vue')
  const overlay = source('../src/domains/story/StoryOverlayView.vue')
  const settings = source('../src/domains/settings/settingsStore.js')
  assert.match(view, /浮窗宽度/)
  assert.match(view, /settings\.storyOverlayWidth/)
  assert.match(settings, /storyOverlayWidth: storyOverlayWidth\.value/)
  assert.match(overlay, /\.skill-tags \{[^}]*flex-wrap: wrap;/)
  assert.doesNotMatch(overlay, /overflow-x: auto/)
})

test('剧情三类列表实时预览拖动位置并按最终索引提交', () => {
  const view = source('../src/domains/story/StoryView.vue')
  const store = source('../src/stores/story.js')
  assert.match(view, /const dragPreview = ref\(null\)/)
  assert.match(view, /displayedChapters = computed/)
  assert.match(view, /displayedSteps = computed/)
  assert.match(view, /displayedSkillGroups = computed/)
  assert.match(view, /event\.clientY >= bounds\.top \+ bounds\.height \/ 2/)
  assert.match(view, /nextIds\.splice\(destinationIndex, 0, preview\.movedId\)/)
  assert.match(view, /@dragend="clearDrag"/)
  assert.match(view, /story\.reorderChapter\(preview\.movedId, destinationIndex\)/)
  assert.match(view, /story\.reorderStep\(preview\.chapterId, preview\.movedId, destinationIndex\)/)
  assert.match(view, /story\.reorderSkillGroup\(preview\.chapterId, preview\.movedId, destinationIndex\)/)
  assert.match(view, /function clearDrag\(\) \{\s*dragPreview\.value = null/)
  assert.doesNotMatch(view, /dragOver|drag-over|startChapterDrag|startStepDrag|startSkillGroupDrag/)
  assert.match(store, /reorderItemsById\(chapters\.value, chapterId, destinationIndex\)/)
  assert.match(store, /reorderItemsById\(chapter\.steps, stepId, destinationIndex\)/)
  assert.match(store, /reorderItemsById\(groups, groupId, destinationIndex\)/)
  assert.match(view, /\.skill-group \{ cursor: pointer;/)
  assert.match(view, /\.drag-handle \{[^}]*cursor: grab;/)
  assert.match(view, /\.el-textarea__inner\), \.skill-group :deep\(\.el-input__inner\) \{ cursor: text; \}/)
})

test('剧情管理页合并章节模块并使用独立滚动区域', () => {
  const view = source('../src/domains/story/StoryView.vue')
  assert.match(view, /class="story-guide-panel"/)
  assert.match(view, /class="story-guide-layout"/)
  assert.match(view, /class="chapter-directory"/)
  assert.match(view, /class="chapter-details-scroll"/)
  assert.match(view, /\.chapter-directory \{[^}]*overflow-y: auto;/)
  assert.match(view, /\.chapter-details-scroll \{[^}]*overflow-y: auto;/)
  assert.match(view, /\.skills-panel :deep\(\.el-card__body\) \{ overflow-y: auto;/)
  assert.match(view, /\.story-workspace \{[^}]*overflow: hidden;/)
  assert.match(view, /\.story-workspace > \.el-col > \.el-card \{[^}]*height: 100%;[^}]*overflow: hidden;/)
  assert.match(view, /\.story-guide-panel :deep\(\.el-card__body\), \.skills-panel :deep\(\.el-card__body\) \{[^}]*flex: 1 1 0;/)
  assert.match(view, /\.story-guide-layout \{[^}]*grid-template-rows: minmax\(0, 1fr\);/)
  assert.match(view, /\.chapter-item:hover \{[^}]*background: var\(--surface-hover\);/)
  assert.doesNotMatch(view, /\.chapter-item:hover \{[^}]*transform:/)
  const directory = view.slice(view.indexOf('<aside class="chapter-directory">'), view.indexOf('</aside>'))
  const detailsHeader = view.slice(view.indexOf('<div class="chapter-details-header">'), view.indexOf('<div class="chapter-details-scroll">'))
  assert.doesNotMatch(directory, /confirmDeleteChapter/)
  assert.match(directory, /class="preset-bar chapter-preset-bar"/)
  assert.match(directory, /class="add-chapter-button"/)
  assert.doesNotMatch(directory, /class="add-chapter-button"[^>]*type="primary"/)
  assert.ok(directory.indexOf('chapter-preset-bar') < directory.indexOf('class="chapter-list"'))
  assert.ok(directory.indexOf('class="add-chapter-button"') > directory.indexOf('class="chapter-list"'))
  assert.doesNotMatch(view, /<strong>章节<\/strong>/)
  assert.doesNotMatch(view, /<template #header>[\s\S]*story\.currentStoryPresetId[\s\S]*<\/template>/)
  assert.match(view, /\.story-guide-layout \{[^}]*grid-template-columns: 240px minmax\(0, 1fr\);/)
  assert.match(view, /\.preset-bar :deep\(\.el-button \+ \.el-button\) \{ margin-left: 0; \}/)
  assert.match(detailsHeader, /@click="confirmDeleteChapter\(story\.viewedChapter\)"/)
  assert.match(detailsHeader, />删除章节<\/el-button>/)
})

test('浏览章节与步骤进度选择器解耦且快照使用进度技能', () => {
  const view = source('../src/domains/story/StoryView.vue')
  const store = source('../src/stores/story.js')
  const selectChapter = store.slice(store.indexOf('function selectChapter'), store.indexOf('function selectStep'))
  const addStep = store.slice(store.indexOf('function addStep'), store.indexOf('function deleteStep'))
  assert.match(view, /<el-radio/)
  assert.match(view, /@change="story\.selectStep/)
  assert.doesNotMatch(view, /@focus="story\.selectStep/)
  assert.doesNotMatch(selectChapter, /currentStepId/)
  assert.doesNotMatch(addStep, /selectStep/)
  assert.match(store, /viewedChapterId/)
  assert.match(store, /viewedSkillGroups/)
  assert.match(store, /buildStorySnapshot\([\s\S]*currentSkillGroups\.value/)
})

test('剧情浮窗使用紧凑默认尺寸和共享紧凑正文字号', () => {
  const manager = source('../electron/modules/window/manager.js')
  const overlay = source('../src/domains/story/StoryOverlayView.vue')
  const view = source('../src/domains/story/StoryView.vue')
  assert.match(manager, /Math\.max\(320, Math\.min\(1200/)
  assert.match(manager, /Math\.max\(150, Math\.min\(maxHeight/)
  assert.match(view, /:min="320"/)
  assert.match(overlay, /\.step\.current \{[^}]*font-size: var\(--overlay-font-size\);/)
  assert.match(overlay, /@media \(max-width: 380px\)/)
})

test('剧情技能编辑器使用离线联想并将等级设置同步到浮层', () => {
  const storyView = source('../src/domains/story/StoryView.vue')
  const overlayView = source('../src/domains/story/StoryOverlayView.vue')
  assert.match(storyView, /<el-autocomplete/)
  assert.match(storyView, /fetchSkillSuggestions/)
  assert.match(storyView, /skillCatalog\.skills/)
  assert.match(storyView, /显示最低购买等级/)
  assert.match(storyView, /settings\.storyShowSkillRequiredLevel/)
  assert.match(storyView, /skillSuggestionLabel\(\{ \.\.\.(?:resolved|skill), displayName \}\)/)
  assert.match(overlayView, /skill\.requiredLevel/)
})

test('剧情和技能预设独立管理并支持技能组排序与整章复制', () => {
  const view = source('../src/domains/story/StoryView.vue')
  const store = source('../src/stores/story.js')
  assert.match(view, /story\.currentStoryPresetId/)
  assert.match(view, /story\.currentSkillPresetId/)
  assert.match(view, /复制当前/)
  assert.match(view, /创建空白/)
  assert.match(view, /startDrag\(\$event, 'skill-group', group\.id\)/)
  assert.match(view, /复制到下一章/)
  assert.match(store, /reorderSkillGroup/)
  assert.match(store, /replaceChapterSkillGroups/)
})

test('剧情技能操作按层级放置复制和新增按钮', () => {
  const view = source('../src/domains/story/StoryView.vue')
  const panelHeader = view.slice(view.indexOf('<div class="panel-header">'), view.indexOf('</template>', view.indexOf('<div class="panel-header">')))
  const skillGroups = view.slice(view.indexOf('<div v-else class="skill-groups">'), view.indexOf('</el-card>', view.indexOf('<div v-else class="skill-groups">')))
  assert.match(panelHeader, /显示最低购买等级[\s\S]*复制到下一章/)
  assert.doesNotMatch(panelHeader, /story\.addSkillGroup/)
  assert.match(skillGroups, /class="add-skill-group-button"/)
  assert.match(skillGroups, /story\.addSkillGroup\(story\.viewedChapter\.id\)/)
  assert.doesNotMatch(skillGroups, /class="add-skill-group-button"[^>]*type="primary"/)
  assert.doesNotMatch(skillGroups, /class="add-skill-group-button"[^>]*size="small"/)
  assert.match(view, /\.panel-header \{ justify-content: space-between;/)
  assert.match(view, /\.add-skill-group-button \{ width: 100%; \}/)
})

test('原生分割抓手按规范布局计算比例并限制边界', () => {
  const overlay = { x: 100, y: 50, width: 560, height: 260 }
  const layout = { stacked: false, left: 10, top: 50, width: 540, height: 180 }
  assert.deepEqual(getStoryDividerGripBounds(overlay, layout, 0.64), {
    x: 449, y: 100, width: 14, height: 180
  })
  assert.equal(getStoryDividerGripBounds(overlay, { ...layout, stacked: true }, 0.64), null)
  assert.equal(getStoryDividerRatioFromGrip({ x: 0, y: 0, width: 14, height: 180 }, overlay, layout), 0.4)
  assert.equal(getStoryDividerRatioFromGrip({ x: 1000, y: 0, width: 14, height: 180 }, overlay, layout), 0.75)
  assert.equal(isPointInStoryDividerGrip({ x: 456, y: 150 }, overlay, layout, 0.64), true)
  assert.equal(isPointInStoryDividerGrip({ x: 448, y: 150 }, overlay, layout, 0.64), false)
})

test('分栏抓手与位置抓手共用剧情浮窗的指针拖动链路', () => {
  const manager = source('../electron/modules/window/manager.js')
  const ipc = source('../electron/modules/ipc/window.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const overlay = source('../src/domains/story/StoryOverlayView.vue')
  const mockStoryApi = api.slice(api.indexOf('storyOverlay: {'), api.indexOf('crafting: {', api.indexOf('storyOverlay: {')))
  assert.doesNotMatch(manager, /storyOverlayDividerWindow|createStoryDividerWindow|syncStoryDividerToOverlay/)
  assert.match(manager, /isPointInStoryDividerGrip\(point, bounds, storyOverlayLayout, storyOverlayDividerRatio\)/)
  assert.match(manager, /export function getStoryOverlayDividerBounds/)
  assert.match(manager, /export function moveStoryOverlayDividerTo/)
  assert.match(ipc, /const storyOverlayDividerDrag = new OverlayDragSession\(\)/)
  assert.match(ipc, /ipcMain\.on\('story-overlay-divider-drag'/)
  assert.match(ipc, /window\.setStoryOverlayDividerDragging\(true\)/)
  assert.match(ipc, /window\.moveStoryOverlayDividerTo\(requested\)/)
  assert.match(preload, /moveStoryOverlayDivider: \(drag\) => ipcRenderer\.send\('story-overlay-divider-drag'/)
  assert.match(api, /moveDivider: \(drag\) => window\.electronAPI\.moveStoryOverlayDivider/)
  assert.match(preload, /getStoryOverlayDividerRatio: \(\) => ipcRenderer\.invoke\('get-story-overlay-divider-ratio'\)/)
  assert.match(ipc, /ipcMain\.handle\('get-story-overlay-divider-ratio', \(\) => window\.getStoryOverlayDividerRatio\(\)\)/)
  assert.match(manager, /export function getStoryOverlayDividerRatio\(\) \{\s*return storyOverlayDividerRatio\s*\}/)
  assert.match(api, /getDividerRatio: \(\) => window\.electronAPI\.getStoryOverlayDividerRatio/)
  assert.match(mockStoryApi, /getDividerRatio: \(\) => Promise\.resolve\(0\.64\)/)
  assert.match(overlay, /electronApi\.storyOverlay\.getDividerRatio\?\.\(\)/)
  assert.match(overlay, /class="story-divider-grip"/)
  assert.match(overlay, /const dividerDrag = createOverlayDrag/)
})

test('内联分割抓手显示左右光标并在分割线两侧保留对称间距', () => {
  const manager = source('../electron/modules/window/manager.js')
  const preload = source('../electron/preload.cjs')
  const overlay = source('../src/domains/story/StoryOverlayView.vue')
  assert.match(overlay, /\.overlay-body \{[^}]*gap: 0;/)
  assert.match(overlay, /\.story-divider-grip \{[^}]*cursor: ew-resize;/)
  assert.match(overlay, /@pointerdown="dividerDrag\.pointerDown"/)
  assert.match(overlay, /\.steps \{[^}]*padding-right: var\(--overlay-space-2\);/)
  assert.match(overlay, /\.skills-section \{[^}]*padding: 5px var\(--overlay-space-2\) 1px;/)
  assert.match(overlay, /\.skills-section \{[^}]*border-left: 1px solid/)
  assert.doesNotMatch(overlay, /skills-title|本章技能/)
  assert.match(manager, /getStoryDividerRatioFromGrip/)
  assert.match(preload, /updateStoryOverlayLayout/)
  assert.match(preload, /onStoryOverlayDividerRatio/)
})

test('剧情浮窗关闭会原子销毁全部窗口且旧实例回调不会污染新窗口', () => {
  const manager = source('../electron/modules/window/manager.js')
  const closeHandler = manager.slice(
    manager.indexOf('export function closeStoryOverlayWindow()'),
    manager.indexOf('export function getStoryOverlayWindow()')
  )
  assert.match(manager, /const overlayWindow = storyOverlayWindow/)
  assert.match(manager, /storyOverlayWindow !== overlayWindow/)
  assert.doesNotMatch(manager, /storyOverlayDividerWindow|storyOverlayGripWindow|gripWindow/)
  assert.match(closeHandler, /const overlayWindow = storyOverlayWindow/)
  assert.ok(closeHandler.indexOf('storyOverlayWindow = null') < closeHandler.indexOf('destroyWindow\(overlayWindow\)'))
  assert.match(closeHandler, /destroyWindow\(overlayWindow\)/)
  assert.doesNotMatch(closeHandler, /\.close\(\)/)
})

test('浮层透明度以 0 到 100 数值持久化并实时同步', () => {
  const view = source('../src/domains/story/StoryView.vue')
  const settings = source('../src/domains/settings/settingsStore.js')
  const manager = source('../electron/modules/window/manager.js')
  assert.match(view, /透明度/)
  assert.match(view, /:min="0"/)
  assert.match(view, /:max="100"/)
  assert.match(settings, /storyOverlayOpacity: storyOverlayOpacity\.value/)
  assert.match(settings, /electronApi\.storyOverlay\.setOpacity/)
  assert.match(manager, /storyOverlayWindow\.setOpacity\(nativeOpacity\)/)
})

test('组合键捕获期间挂起全局快捷键并在提交前恢复', () => {
  const ipc = source('../electron/modules/ipc/shortcut.js')
  const preload = source('../electron/preload.cjs')
  const capture = source('../src/components/common/KeyCaptureInput.vue')
  assert.match(ipc, /begin-shortcut-capture/)
  assert.match(ipc, /end-shortcut-capture/)
  assert.match(preload, /beginShortcutCapture/)
  assert.ok(capture.indexOf('await stopCapture()') < capture.indexOf("emit('change', result.value)"))
})

test('快捷键捕获提供显式清空并允许紧急停止禁用清空', () => {
  const capture = source('../src/components/common/KeyCaptureInput.vue')
  const settings = source('../src/domains/settings/SettingsView.vue')
  const map = source('../src/domains/map/MapView.vue')
  assert.match(capture, /allowEmpty: \{ type: Boolean, default: true \}/)
  assert.match(capture, /aria-label="清空快捷键"/)
  assert.match(capture, /result\.type === 'clear' && !props\.allowEmpty/)
  assert.match(settings, /\{ key: 'end', label: '全局紧急停止' \}/)
  assert.match(settings, /:allow-empty="field\.key !== 'end'"/)
  assert.match(map, /:model-value="shortcuts\.end" :allow-empty="false"/)
})
})()

// === Merged from storySkillSettings.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const readFile = _m4_readFile
  const DEFAULT_STORY_OVERLAY_WIDTH = _m4_DEFAULT_STORY_OVERLAY_WIDTH
  const DEFAULT_STORY_OVERLAY_OPACITY = _m4_DEFAULT_STORY_OVERLAY_OPACITY
  const DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL = _m4_DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL
  const MAX_STORY_OVERLAY_WIDTH = _m4_MAX_STORY_OVERLAY_WIDTH
  const migrateStoryOverlayLayout = _m4_migrateStoryOverlayLayout
  const MIN_STORY_OVERLAY_WIDTH = _m4_MIN_STORY_OVERLAY_WIDTH
  const normalizeStoryOverlayOpacity = _m4_normalizeStoryOverlayOpacity
  const normalizeStoryOverlayWidth = _m4_normalizeStoryOverlayWidth
  const normalizeStoryShowSkillRequiredLevel = _m4_normalizeStoryShowSkillRequiredLevel
test('剧情技能等级显示默认开启并只接受布尔持久化值', () => {
  assert.equal(DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL, true)
  assert.equal(normalizeStoryShowSkillRequiredLevel(undefined), true)
  assert.equal(normalizeStoryShowSkillRequiredLevel('false'), true)
  assert.equal(normalizeStoryShowSkillRequiredLevel(false), false)
})

test('剧情浮层透明度使用 0 到 100 的整数范围', () => {
  assert.equal(DEFAULT_STORY_OVERLAY_OPACITY, 100)
  assert.equal(normalizeStoryOverlayOpacity(undefined), 100)
  assert.equal(normalizeStoryOverlayOpacity(-4), 0)
  assert.equal(normalizeStoryOverlayOpacity(45.6), 46)
  assert.equal(normalizeStoryOverlayOpacity(200), 100)
})

test('剧情浮窗宽度使用紧凑默认值并限制有效边界', () => {
  assert.equal(DEFAULT_STORY_OVERLAY_WIDTH, 460)
  assert.equal(MIN_STORY_OVERLAY_WIDTH, 320)
  assert.equal(MAX_STORY_OVERLAY_WIDTH, 1200)
  assert.equal(normalizeStoryOverlayWidth(undefined), 460)
  assert.equal(normalizeStoryOverlayWidth(100), 320)
  assert.equal(normalizeStoryOverlayWidth(1500), 1200)
})

test('旧默认浮窗宽度只迁移一次且保留自定义宽度', () => {
  assert.deepEqual(migrateStoryOverlayLayout({ width: 560 }), {
    width: 460, layoutVersion: 1, migrated: true
  })
  assert.deepEqual(migrateStoryOverlayLayout({ width: 680 }), {
    width: 680, layoutVersion: 1, migrated: true
  })
  assert.deepEqual(migrateStoryOverlayLayout({ width: 560, layoutVersion: 1 }), {
    width: 560, layoutVersion: 1, migrated: false
  })
})

test('设置存储保存、恢复和重置剧情技能等级显示开关', async () => {
  const source = await readFile(new URL('../src/domains/settings/settingsStore.js', import.meta.url), 'utf8')
  assert.match(source, /storyShowSkillRequiredLevel: storyShowSkillRequiredLevel\.value/)
  assert.match(source, /storyShowSkillRequiredLevel\.value = normalizeStoryShowSkillRequiredLevel\(data\.storyShowSkillRequiredLevel\)/)
  assert.match(source, /storyShowSkillRequiredLevel\.value = DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL/)
  assert.match(source, /storyOverlayOpacity: storyOverlayOpacity\.value/)
  assert.match(source, /storyOverlayOpacity\.value = normalizeStoryOverlayOpacity\(data\.storyOverlayOpacity\)/)
  assert.match(source, /storyOverlayOpacity\.value = DEFAULT_STORY_OVERLAY_OPACITY/)
  assert.match(source, /storyOverlayLayoutVersion: storyOverlayLayoutVersion\.value/)
  assert.match(source, /migrateStoryOverlayLayout/)
})
})()

// === Merged from storyTimer.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const readFileSync = _m5_readFileSync
  const STORY_TIMER_PAUSE_REASON = _m5_STORY_TIMER_PAUSE_REASON
  const STORY_TIMER_PAGE_ACTION = _m5_STORY_TIMER_PAGE_ACTION
  const STORY_TIMER_STATUS = _m5_STORY_TIMER_STATUS
  const appendStoryTimerHistory = _m5_appendStoryTimerHistory
  const checkpointStoryTimer = _m5_checkpointStoryTimer
  const formatStoryTimerDuration = _m5_formatStoryTimerDuration
  const getStoryTimerPageAction = _m5_getStoryTimerPageAction
  const normalizeStoryTimerState = _m5_normalizeStoryTimerState
  const restoreStoryTimerState = _m5_restoreStoryTimerState
  const storyTimerElapsed = _m5_storyTimerElapsed
  const getStoryOverlayRequestedWidth = _m5_getStoryOverlayRequestedWidth
const source = path => readFileSync(new URL(path, import.meta.url), 'utf8')

test('剧情计时按真实时间累计、检查点保存并格式化', () => {
  const running = {
    version: 1,
    status: STORY_TIMER_STATUS.running,
    pauseReason: '',
    elapsedMs: 2000,
    runningSince: 10000,
    activePreset: { id: 'default', name: '默认剧情' },
    history: []
  }
  assert.equal(storyTimerElapsed(running, 15500), 7500)
  assert.deepEqual(checkpointStoryTimer(running, 15500), { ...running, elapsedMs: 7500, runningSince: 15500 })
  assert.equal(formatStoryTimerDuration(3661000), '01:01:01')
  assert.equal(formatStoryTimerDuration(-1), '00:00:00')
})

test('运行状态在重启后恢复为暂停且不补算离线时间', () => {
  const restored = restoreStoryTimerState({
    version: 1,
    status: 'running',
    elapsedMs: 42000,
    runningSince: 1000,
    activePreset: { id: 'speedrun', name: '速通' },
    history: []
  })
  assert.equal(restored.status, STORY_TIMER_STATUS.paused)
  assert.equal(restored.pauseReason, STORY_TIMER_PAUSE_REASON.restart)
  assert.equal(restored.elapsedMs, 42000)
  assert.equal(restored.runningSince, null)
  assert.equal(normalizeStoryTimerState({ version: 99 }).status, STORY_TIMER_STATUS.idle)
})

test('历史记录只保留最近 100 条并支持稳定的单条标识', () => {
  let history = []
  for (let index = 0; index < 105; index += 1) {
    history = appendStoryTimerHistory(history, {
      id: `run-${index}`,
      presetId: 'default',
      presetName: '默认剧情',
      completedAt: index + 1,
      durationMs: 1000 + index
    })
  }
  assert.equal(history.length, 100)
  assert.equal(history[0].id, 'run-104')
  assert.equal(history.at(-1).id, 'run-5')
})

test('页面按钮在后台排队开始，再次点击可取消等待', () => {
  assert.equal(getStoryTimerPageAction({ status: STORY_TIMER_STATUS.idle }, false), STORY_TIMER_PAGE_ACTION.waitForForeground)
  assert.equal(getStoryTimerPageAction({
    status: STORY_TIMER_STATUS.paused,
    pauseReason: STORY_TIMER_PAUSE_REASON.background
  }, false), STORY_TIMER_PAGE_ACTION.cancelForegroundWait)
  assert.equal(getStoryTimerPageAction({
    status: STORY_TIMER_STATUS.paused,
    pauseReason: STORY_TIMER_PAUSE_REASON.manual
  }, true), STORY_TIMER_PAGE_ACTION.start)
  assert.equal(getStoryTimerPageAction({ status: STORY_TIMER_STATUS.running }, false), STORY_TIMER_PAGE_ACTION.pause)
})

test('浮窗宽度按启用模块组合计算', () => {
  assert.equal(getStoryOverlayRequestedWidth({}, 460), 460)
  assert.equal(getStoryOverlayRequestedWidth({ timer: { enabled: true } }, 460), 580)
  assert.equal(getStoryOverlayRequestedWidth({ modules: { story: false, skills: true } }, 460), 460)
  assert.equal(getStoryOverlayRequestedWidth({ modules: { story: false, skills: false }, timer: { enabled: true } }, 460), 160)
})

test('页面和状态源包含模块开关、后台提示及仅逐条删除历史', () => {
  const view = source('../src/domains/story/StoryView.vue')
  const overlay = source('../src/domains/story/StoryOverlayView.vue')
  const store = source('../src/stores/storyTimer.js')
  const settings = source('../src/domains/settings/settingsStore.js')
  assert.match(view, /storyOverlayStoryEnabled/)
  assert.match(view, /storyOverlaySkillsEnabled/)
  assert.match(view, /storyTimerOverlayEnabled/)
  assert.match(view, /confirmDeleteHistory/)
  assert.doesNotMatch(view, /清空历史|批量删除/)
  assert.match(view, /history-action-column/)
  assert.doesNotMatch(overlay, /timer-label|流程计时/)
  assert.match(overlay, /state\.timer\.status !== 'running'/)
  assert.match(overlay, /font-size: 22px/)
  assert.match(store, /STORY_TIMER_PAUSE_REASON\.background/)
  assert.match(store, /game-background/)
  assert.match(store, /toggleFromPage/)
  assert.match(settings, /storyOverlayStoryEnabled\.value = data\.storyOverlayStoryEnabled !== false/)
  assert.match(settings, /storyOverlaySkillsEnabled\.value = data\.storyOverlaySkillsEnabled !== false/)
  assert.match(settings, /storyTimerOverlayEnabled\.value = data\.storyTimerOverlayEnabled === true/)
  assert.match(settings, /storyTimerPauseInBackground\.value = data\.storyTimerPauseInBackground !== false/)
})
})()
