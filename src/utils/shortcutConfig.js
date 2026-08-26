export const DEFAULT_GLOBAL_SHORTCUTS = Object.freeze({
  itemStart: 'Alt+1',
  mapStart: 'Alt+2',
  end: 'Alt+3',
  potionStart: 'Numpad7',
  potionStop: 'Numpad8',
  portal: 'Numpad2',
  storyPrevious: 'PageUp',
  storyNext: 'PageDown',
  chaosRecipeStart: 'Alt+4',
  chaosRecipePause: 'Alt+5',
  chaosRecipeStop: 'Alt+6',
  puzzleAnalyze: 'Alt+7',
  priceCheck: 'Ctrl+D'
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
