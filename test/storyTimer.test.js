import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  STORY_TIMER_PAUSE_REASON,
  STORY_TIMER_PAGE_ACTION,
  STORY_TIMER_STATUS,
  appendStoryTimerHistory,
  checkpointStoryTimer,
  formatStoryTimerDuration,
  getStoryTimerPageAction,
  normalizeStoryTimerState,
  restoreStoryTimerState,
  storyTimerElapsed
} from '../src/utils/storyTimer.js'
import { getStoryOverlayRequestedWidth } from '../electron/modules/window/storyOverlayWidth.js'

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
