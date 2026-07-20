const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta'])

const GLOBAL_KEY_ALIASES = {
  ' ': 'Space',
  Spacebar: 'Space',
  Escape: 'Esc',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  Enter: 'Enter',
  Tab: 'Tab',
  Home: 'Home',
  End: 'End',
  Insert: 'Insert'
}

const ACTION_KEY_ALIASES = {
  ...GLOBAL_KEY_ALIASES,
  Escape: 'Esc'
}

function keyFromEvent(event, aliases) {
  if (/^Numpad[0-9]$/.test(event.code || '')) return event.code
  if (/^F(?:[1-9]|1[0-9]|2[0-4])$/.test(event.key || '')) return event.key.toUpperCase()
  if (aliases[event.key]) return aliases[event.key]
  if (typeof event.key === 'string' && event.key.length === 1 && /[a-z0-9]/i.test(event.key)) {
    return event.key.toUpperCase()
  }
  return null
}

export function isModifierKey(event) {
  return MODIFIER_KEYS.has(event.key)
}

export function keyboardEventToAccelerator(event, activeModifiers = []) {
  if (isModifierKey(event)) return null
  const key = keyFromEvent(event, GLOBAL_KEY_ALIASES)
  if (!key) return null
  const parts = []
  const modifiers = new Set(activeModifiers)
  if (event.ctrlKey || modifiers.has('Control')) parts.push('Ctrl')
  if (event.altKey || modifiers.has('Alt')) parts.push('Alt')
  if (event.shiftKey || modifiers.has('Shift')) parts.push('Shift')
  if (event.metaKey || modifiers.has('Meta')) parts.push('Meta')
  parts.push(key)
  return parts.join('+')
}

export function keyboardEventToActionKey(event) {
  if (isModifierKey(event) || event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return null
  const key = keyFromEvent(event, ACTION_KEY_ALIASES)
  if (!key) return null
  return /^[A-Z]$/.test(key) ? key.toLowerCase() : key
}

export function interpretCaptureEvent(event, mode = 'shortcut', activeModifiers = []) {
  if (event.key === 'Escape') return { type: 'cancel' }
  if (event.key === 'Backspace' || event.key === 'Delete') return { type: 'clear', value: '' }
  const value = mode === 'action'
    ? keyboardEventToActionKey(event)
    : keyboardEventToAccelerator(event, activeModifiers)
  return value ? { type: 'commit', value } : { type: 'pending' }
}
