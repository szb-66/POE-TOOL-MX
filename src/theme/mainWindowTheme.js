export const MAIN_WINDOW_THEME_CLASS = 'main-window-theme'
export const SHARED_DARK_THEME_CLASS = 'app-dark-theme'
export const BUSINESS_OVERLAY_THEME_CLASS = 'business-overlay-theme'

export const BUSINESS_OVERLAY_ROUTES = Object.freeze([
  '/puzzle-overlay',
  '/overlay',
  '/story-overlay',
  '/bag-stash-overlay',
  '/chaos-recipe-overlay',
  '/chaos-recipe-control-overlay',
  '/price-check-overlay'
])

export function resolveWindowTheme(route) {
  if (!route?.meta?.noLayout) return 'main'
  return BUSINESS_OVERLAY_ROUTES.includes(route.path) ? 'overlay' : 'none'
}

export function syncMainWindowTheme(route) {
  const theme = resolveWindowTheme(route)
  const root = document.documentElement
  root.classList.toggle(SHARED_DARK_THEME_CLASS, theme !== 'none')
  root.classList.toggle(MAIN_WINDOW_THEME_CLASS, theme === 'main')
  root.classList.toggle(BUSINESS_OVERLAY_THEME_CLASS, theme === 'overlay')
  return theme
}

export function clearMainWindowTheme() {
  document.documentElement.classList.remove(
    SHARED_DARK_THEME_CLASS,
    MAIN_WINDOW_THEME_CLASS,
    BUSINESS_OVERLAY_THEME_CLASS
  )
}
