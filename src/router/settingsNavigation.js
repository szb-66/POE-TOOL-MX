export const SETTINGS_TABS = Object.freeze([
  'general',
  'automation',
  'detection',
  'overlay',
  'system',
  'feedback',
  'about'
])

const SETTINGS_TAB_SET = new Set(SETTINGS_TABS)

export function resolveSettingsTab(value) {
  return typeof value === 'string' && SETTINGS_TAB_SET.has(value) ? value : null
}

export function settingsRoute(tab) {
  if (tab === 'localization') return { path: '/localization' }
  const target = resolveSettingsTab(tab)
  return target ? { path: '/settings', query: { tab: target } } : { path: '/settings' }
}
