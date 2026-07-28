import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  DEFAULT_STORY_OVERLAY_OPACITY,
  DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL,
  normalizeStoryOverlayOpacity,
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

test('设置存储保存、恢复和重置剧情技能等级显示开关', async () => {
  const source = await readFile(new URL('../src/domains/settings/settingsStore.js', import.meta.url), 'utf8')
  assert.match(source, /storyShowSkillRequiredLevel: storyShowSkillRequiredLevel\.value/)
  assert.match(source, /storyShowSkillRequiredLevel\.value = normalizeStoryShowSkillRequiredLevel\(data\.storyShowSkillRequiredLevel\)/)
  assert.match(source, /storyShowSkillRequiredLevel\.value = DEFAULT_STORY_SHOW_SKILL_REQUIRED_LEVEL/)
  assert.match(source, /storyOverlayOpacity: storyOverlayOpacity\.value/)
  assert.match(source, /storyOverlayOpacity\.value = normalizeStoryOverlayOpacity\(data\.storyOverlayOpacity\)/)
  assert.match(source, /storyOverlayOpacity\.value = DEFAULT_STORY_OVERLAY_OPACITY/)
})
