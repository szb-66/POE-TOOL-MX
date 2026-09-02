export const DEFAULT_GLOBAL_SHORTCUTS = Object.freeze({
  itemStart: '',
  mapStart: '',
  end: 'Alt+3',
  portal: '',
  storyPrevious: '',
  storyNext: '',
  priceCheck: ''
})

export const normalizeGlobalShortcutValue = (value) => (
  typeof value === 'string' ? value.trim() : ''
)

export const normalizeGlobalShortcutSettings = (settings = {}) => {
  const normalized = {}
  for (const key of Object.keys(DEFAULT_GLOBAL_SHORTCUTS)) {
    normalized[key] = normalizeGlobalShortcutValue(settings?.[key])
  }
  return normalized
}

export const mergeGlobalShortcutSettings = (saved = {}) => {
  const merged = { ...DEFAULT_GLOBAL_SHORTCUTS }
  for (const key of Object.keys(DEFAULT_GLOBAL_SHORTCUTS)) {
    if (!Object.hasOwn(saved || {}, key)) continue
    const normalized = normalizeGlobalShortcutValue(saved[key])
    merged[key] = key === 'end' && !normalized
      ? DEFAULT_GLOBAL_SHORTCUTS.end
      : normalized
  }
  return merged
}

export const dispatchShortcutAction = (id, handlers) => {
  const handler = handlers?.[id]
  if (typeof handler !== 'function') return false
  handler()
  return true
}

export const resolveShortcutScopeHealth = (state = {}) => {
  const failed = Array.isArray(state.failed)
    ? state.failed.map(value => String(value || '').trim()).filter(Boolean)
    : []
  if (!failed.length) return { status: 'ready', error: '', failed: [] }

  const names = failed.join('、')
  const registered = Array.isArray(state.registered) ? state.registered : []
  return state.partialFailure === true || registered.length > 0
    ? { status: 'attention', error: `部分快捷键注册失败：${names}；其余快捷键可用`, failed }
    : { status: 'error', error: `全局快捷键注册失败：${names}`, failed }
}
