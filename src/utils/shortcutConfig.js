export const DEFAULT_GLOBAL_SHORTCUTS = Object.freeze({
  itemStart: 'Alt+1',
  mapStart: 'Alt+2',
  end: 'Alt+3',
  stashStart: 'Alt+4',
  potionStart: 'Numpad7',
  potionStop: 'Numpad8',
  portal: 'Numpad2',
  storyPrevious: 'PageUp',
  storyNext: 'PageDown'
})

export function mergeGlobalShortcutSettings(saved = {}, legacyBag = {}) {
  const filtered = {}
  for (const key of Object.keys(DEFAULT_GLOBAL_SHORTCUTS)) {
    if (typeof saved?.[key] === 'string') filtered[key] = saved[key]
  }
  if (!Object.prototype.hasOwnProperty.call(filtered, 'stashStart') && typeof legacyBag?.stashShortcut === 'string') {
    filtered.stashStart = legacyBag.stashShortcut
  }
  return { ...DEFAULT_GLOBAL_SHORTCUTS, ...filtered }
}

export function dispatchShortcutAction(id, handlers) {
  const handler = handlers?.[id]
  if (typeof handler !== 'function') return false
  handler()
  return true
}
