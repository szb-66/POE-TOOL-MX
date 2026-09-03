export const STORY_TIMER_STORAGE_KEY = 'storyTimer:v1'
export const STORY_TIMER_VERSION = 1
export const STORY_TIMER_HISTORY_LIMIT = 100

export const STORY_TIMER_STATUS = Object.freeze({
  idle: 'idle',
  running: 'running',
  paused: 'paused'
})

export const STORY_TIMER_PAUSE_REASON = Object.freeze({
  manual: 'manual',
  background: 'background',
  featureDisabled: 'feature-disabled',
  restart: 'restart'
})

export const STORY_TIMER_PAGE_ACTION = Object.freeze({
  start: 'start',
  pause: 'pause',
  waitForForeground: 'wait-for-foreground',
  cancelForegroundWait: 'cancel-foreground-wait'
})

const finiteNonNegative = value => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0
}

const normalizePreset = value => {
  if (!value || typeof value !== 'object') return null
  const id = String(value.id || '').trim()
  const name = String(value.name || '').trim()
  return id || name ? { id, name: name || '未命名剧情预设' } : null
}

export function createEmptyStoryTimerState() {
  return {
    version: STORY_TIMER_VERSION,
    status: STORY_TIMER_STATUS.idle,
    pauseReason: '',
    elapsedMs: 0,
    runningSince: null,
    activePreset: null,
    history: []
  }
}

export function normalizeStoryTimerHistory(history) {
  if (!Array.isArray(history)) return []
  return history
    .map(item => ({
      id: String(item?.id || '').trim(),
      presetId: String(item?.presetId || '').trim(),
      presetName: String(item?.presetName || '').trim() || '未命名剧情预设',
      completedAt: finiteNonNegative(item?.completedAt),
      durationMs: finiteNonNegative(item?.durationMs)
    }))
    .filter(item => item.id && item.completedAt > 0 && item.durationMs > 0)
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, STORY_TIMER_HISTORY_LIMIT)
}

export function normalizeStoryTimerState(value = {}) {
  const base = createEmptyStoryTimerState()
  if (!value || Number(value.version) !== STORY_TIMER_VERSION) return base
  const status = Object.values(STORY_TIMER_STATUS).includes(value.status)
    ? value.status
    : STORY_TIMER_STATUS.idle
  return {
    ...base,
    status,
    pauseReason: typeof value.pauseReason === 'string' ? value.pauseReason : '',
    elapsedMs: finiteNonNegative(value.elapsedMs),
    runningSince: status === STORY_TIMER_STATUS.running ? finiteNonNegative(value.runningSince) || null : null,
    activePreset: normalizePreset(value.activePreset),
    history: normalizeStoryTimerHistory(value.history)
  }
}

export function restoreStoryTimerState(value = {}) {
  const state = normalizeStoryTimerState(value)
  if (state.status !== STORY_TIMER_STATUS.running) return state
  return {
    ...state,
    status: STORY_TIMER_STATUS.paused,
    pauseReason: STORY_TIMER_PAUSE_REASON.restart,
    runningSince: null
  }
}

export function storyTimerElapsed(state, now = Date.now()) {
  const elapsed = finiteNonNegative(state?.elapsedMs)
  if (state?.status !== STORY_TIMER_STATUS.running || !Number.isFinite(Number(state.runningSince))) return elapsed
  return elapsed + Math.max(0, Number(now) - Number(state.runningSince))
}

export function checkpointStoryTimer(state, now = Date.now()) {
  if (state?.status !== STORY_TIMER_STATUS.running) return { ...state }
  return {
    ...state,
    elapsedMs: storyTimerElapsed(state, now),
    runningSince: Number(now)
  }
}

export function getStoryTimerPageAction(state, canStart) {
  if (state?.status === STORY_TIMER_STATUS.running) return STORY_TIMER_PAGE_ACTION.pause
  if (state?.status === STORY_TIMER_STATUS.paused && state?.pauseReason === STORY_TIMER_PAUSE_REASON.background && !canStart) {
    return STORY_TIMER_PAGE_ACTION.cancelForegroundWait
  }
  return canStart ? STORY_TIMER_PAGE_ACTION.start : STORY_TIMER_PAGE_ACTION.waitForForeground
}

export function appendStoryTimerHistory(history, entry) {
  return normalizeStoryTimerHistory([entry, ...(Array.isArray(history) ? history : [])])
}

export function formatStoryTimerDuration(value) {
  const totalSeconds = Math.floor(finiteNonNegative(value) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map(part => String(part).padStart(2, '0')).join(':')
}
