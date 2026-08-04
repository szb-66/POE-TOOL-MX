import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  DEFAULT_STORY_OVERLAY_WIDTH,
  DEFAULT_STORY_OVERLAY_OPACITY,
  DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL,
  MAX_STORY_OVERLAY_WIDTH,
  migrateStoryOverlayLayout,
  MIN_STORY_OVERLAY_WIDTH,
  normalizeStoryOverlayOpacity,
  normalizeStoryOverlayWidth,
  normalizeStoryShowSkillRequiredLevel
} from '../src/domains/settings/storySkillSettings.js'

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
