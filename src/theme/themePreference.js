export const THEME_STORAGE_KEY = 'app-theme-preference'
export const normalizeThemePreference = value => ['system', 'light', 'dark'].includes(value) ? value : 'system'

export function createThemeController(environment = globalThis) {
  let preference = 'system'
  let media
  try { preference = normalizeThemePreference(environment.localStorage?.getItem(THEME_STORAGE_KEY)) } catch {}
  try { media = environment.matchMedia?.('(prefers-color-scheme: dark)') } catch {}
  const listeners = new Set()
  const snapshot = () => ({ preference, resolved: preference === 'system' ? (media?.matches ? 'dark' : 'light') : preference })
  const notify = () => listeners.forEach(listener => listener(snapshot()))
  const changed = () => { if (preference === 'system') notify() }
  media?.addEventListener('change', changed)
  return {
    snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    setPreference(value) {
      preference = normalizeThemePreference(value)
      try { environment.localStorage?.setItem(THEME_STORAGE_KEY, preference) } catch {}
      notify()
    },
    toggle() { this.setPreference(snapshot().resolved === 'dark' ? 'light' : 'dark') },
    dispose() { media?.removeEventListener('change', changed); listeners.clear() }
  }
}
