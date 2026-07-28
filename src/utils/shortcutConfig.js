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
  chaosRecipeStop: 'Alt+6'
})

export const mergeGlobalShortcutSettings = (saved = {}) => {
  const filtered = {}
  for (const key of Object.keys(DEFAULT_GLOBAL_SHORTCUTS)) {
    if (typeof saved?.[key] === 'string') filtered[key] = saved[key]
  }
  return { ...DEFAULT_GLOBAL_SHORTCUTS, ...filtered }
}

export const dispatchShortcutAction = (id, handlers) => {
  const handler = handlers?.[id]
  if (typeof handler !== 'function') return false
  handler()
  return true
}
