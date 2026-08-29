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
  const target = resolveSettingsTab(tab)
  return target ? { path: '/settings', query: { tab: target } } : { path: '/settings' }
}

export function settingsTabForHealth(items) {
  const issue = Array.isArray(items) ? items.find(item => item?.status !== 'ready') : null
  if (!issue) return null
  return issue.id === 'shortcuts' ? 'general' : 'system'
}

export function settingsRouteForHealth(items) {
  return settingsRoute(settingsTabForHealth(items))
}
