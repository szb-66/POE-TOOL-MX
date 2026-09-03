import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import {
  STORY_TIMER_PAUSE_REASON,
  STORY_TIMER_PAGE_ACTION,
  STORY_TIMER_STATUS,
  STORY_TIMER_STORAGE_KEY,
  appendStoryTimerHistory,
  checkpointStoryTimer,
  createEmptyStoryTimerState,
  formatStoryTimerDuration,
  getStoryTimerPageAction,
  restoreStoryTimerState,
  storyTimerElapsed
} from '@/utils/storyTimer'

function readState() {
  try {
    return restoreStoryTimerState(JSON.parse(localStorage.getItem(STORY_TIMER_STORAGE_KEY) || '{}'))
  } catch {
    return createEmptyStoryTimerState()
  }
}

export const useStoryTimerStore = defineStore('storyTimer', () => {
  const settings = useSettingsStore()
  const initial = readState()
  const status = ref(initial.status)
  const pauseReason = ref(initial.pauseReason)
  const elapsedMs = ref(initial.elapsedMs)
  const runningSince = ref(initial.runningSince)
  const activePreset = ref(initial.activePreset)
  const history = ref(initial.history)
  const displayNow = ref(Date.now())
  let tickTimer = null

  const currentElapsedMs = computed(() => storyTimerElapsed({
    status: status.value,
    elapsedMs: elapsedMs.value,
    runningSince: runningSince.value
  }, displayNow.value))
  const formattedElapsed = computed(() => formatStoryTimerDuration(currentElapsedMs.value))
  const awaitingForeground = computed(() => (
    status.value === STORY_TIMER_STATUS.paused && pauseReason.value === STORY_TIMER_PAUSE_REASON.background
  ))
  const statusLabel = computed(() => {
    if (status.value === STORY_TIMER_STATUS.running) return '计时中'
    if (status.value === STORY_TIMER_STATUS.paused) return '已暂停'
    return '未开始'
  })
  const foregroundWarning = computed(() => {
    if (!settings.storyTimerPauseInBackground) return ''
    if (!settings.shortcutScopeAvailable) return '无法检测游戏前台，后台停止暂不可用'
    if (!settings.gameForeground) return '请切换到游戏前台后开始或继续计时'
    return ''
  })

  function stateData() {
    return {
      version: 1,
      status: status.value,
      pauseReason: pauseReason.value,
      elapsedMs: elapsedMs.value,
      runningSince: runningSince.value,
      activePreset: activePreset.value,
      history: history.value
    }
  }

  function persist() {
    try { localStorage.setItem(STORY_TIMER_STORAGE_KEY, JSON.stringify(stateData())) } catch {}
  }

  function stopTicker() {
    if (tickTimer != null) clearInterval(tickTimer)
    tickTimer = null
  }

  function checkpoint(now = Date.now()) {
    if (status.value !== STORY_TIMER_STATUS.running) return
    const next = checkpointStoryTimer(stateData(), now)
    elapsedMs.value = next.elapsedMs
    runningSince.value = next.runningSince
    displayNow.value = now
    persist()
  }

  function startTicker() {
    stopTicker()
    tickTimer = setInterval(() => checkpoint(Date.now()), 1000)
  }

  function canStart() {
    return !settings.storyTimerPauseInBackground || !settings.shortcutScopeAvailable || settings.gameForeground
  }

  function bindPreset(preset) {
    if (activePreset.value) return
    activePreset.value = {
      id: String(preset?.id || ''),
      name: String(preset?.name || '').trim() || '未命名剧情预设'
    }
  }

  function start(preset) {
    if (status.value === STORY_TIMER_STATUS.running) return { success: true }
    if (!settings.storyTimerOverlayEnabled) return { success: false, reason: 'feature-disabled' }
    if (!canStart()) return { success: false, reason: 'game-background' }
    bindPreset(preset)
    status.value = STORY_TIMER_STATUS.running
    pauseReason.value = ''
    runningSince.value = Date.now()
    displayNow.value = runningSince.value
    persist()
    startTicker()
    return { success: true }
  }

  function pause(reason = STORY_TIMER_PAUSE_REASON.manual) {
    if (status.value !== STORY_TIMER_STATUS.running) return false
    checkpoint(Date.now())
    status.value = STORY_TIMER_STATUS.paused
    pauseReason.value = reason
    runningSince.value = null
    stopTicker()
    persist()
    return true
  }

  function toggle(preset) {
    if (status.value === STORY_TIMER_STATUS.running) {
      pause(STORY_TIMER_PAUSE_REASON.manual)
      return { success: true, running: false }
    }
    return { ...start(preset), running: status.value === STORY_TIMER_STATUS.running }
  }

  function toggleFromPage(preset) {
    if (!settings.storyTimerOverlayEnabled) return { success: false, reason: 'feature-disabled' }
    const action = getStoryTimerPageAction(stateData(), canStart())
    if (action === STORY_TIMER_PAGE_ACTION.pause) {
      pause(STORY_TIMER_PAUSE_REASON.manual)
      return { success: true, running: false }
    }
    if (action === STORY_TIMER_PAGE_ACTION.cancelForegroundWait) {
      pauseReason.value = STORY_TIMER_PAUSE_REASON.manual
      persist()
      return { success: true, running: false }
    }
    if (action === STORY_TIMER_PAGE_ACTION.waitForForeground) {
      bindPreset(preset)
      status.value = STORY_TIMER_STATUS.paused
      pauseReason.value = STORY_TIMER_PAUSE_REASON.background
      runningSince.value = null
      persist()
      return { success: true, running: false, queued: true, reason: 'game-background' }
    }
    return { ...start(preset), running: status.value === STORY_TIMER_STATUS.running }
  }

  function reset() {
    if (status.value === STORY_TIMER_STATUS.running) checkpoint(Date.now())
    const durationMs = elapsedMs.value
    if (durationMs > 0) {
      history.value = appendStoryTimerHistory(history.value, {
        id: `story-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        presetId: activePreset.value?.id || '',
        presetName: activePreset.value?.name || '未命名剧情预设',
        completedAt: Date.now(),
        durationMs
      })
    }
    status.value = STORY_TIMER_STATUS.idle
    pauseReason.value = ''
    elapsedMs.value = 0
    runningSince.value = null
    activePreset.value = null
    displayNow.value = Date.now()
    stopTicker()
    persist()
  }

  function deleteHistory(id) {
    const index = history.value.findIndex(item => item.id === id)
    if (index < 0) return false
    history.value.splice(index, 1)
    persist()
    return true
  }

  watch(() => settings.storyTimerOverlayEnabled, enabled => {
    if (!enabled) pause(STORY_TIMER_PAUSE_REASON.featureDisabled)
  })

  watch([
    () => settings.gameForeground,
    () => settings.shortcutScopeAvailable,
    () => settings.storyTimerPauseInBackground,
    () => settings.storyTimerOverlayEnabled
  ], ([foreground, available, pauseInBackground, enabled]) => {
    if (!enabled) return
    if (!pauseInBackground || !available) {
      if (status.value === STORY_TIMER_STATUS.paused && pauseReason.value === STORY_TIMER_PAUSE_REASON.background) {
        start(activePreset.value)
      }
      return
    }
    if (!foreground && status.value === STORY_TIMER_STATUS.running) {
      pause(STORY_TIMER_PAUSE_REASON.background)
    } else if (foreground && status.value === STORY_TIMER_STATUS.paused && pauseReason.value === STORY_TIMER_PAUSE_REASON.background) {
      start(activePreset.value)
    }
  }, { immediate: true })

  if (status.value === STORY_TIMER_STATUS.running) startTicker()
  persist()

  return {
    status,
    pauseReason,
    elapsedMs,
    activePreset,
    history,
    currentElapsedMs,
    formattedElapsed,
    awaitingForeground,
    statusLabel,
    foregroundWarning,
    start,
    pause,
    toggle,
    toggleFromPage,
    reset,
    deleteHistory
  }
})
