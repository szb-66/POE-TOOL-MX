import { themeController } from './useTheme.js'

export const MAIN_WINDOW_THEME_CLASS = 'main-window-theme'
export const SHARED_DARK_THEME_CLASS = 'app-dark-theme'
export const BUSINESS_OVERLAY_THEME_CLASS = 'business-overlay-theme'

export const BUSINESS_OVERLAY_ROUTES = Object.freeze([
  '/loading-feedback-overlay',
  '/puzzle-overlay',
  '/chart-recognition-feedback',
  '/overlay',
  '/story-overlay',
  '/bag-stash-overlay',
  '/chaos-recipe-overlay',
  '/chaos-recipe-control-overlay',
  '/price-check-overlay',
  '/map-tracker-overlay'
])

export function resolveWindowTheme(route) {
  if (!route?.meta?.noLayout) return 'main'
  return BUSINESS_OVERLAY_ROUTES.includes(route.path) ? 'overlay' : 'none'
}

let currentRoute
const unsubscribe = themeController.subscribe(() => {
  if (currentRoute) syncMainWindowTheme(currentRoute)
})
if (import.meta.hot) import.meta.hot.dispose(unsubscribe)

export function syncMainWindowTheme(route) {
  currentRoute = route
  const theme = resolveWindowTheme(route)
  const root = document.documentElement
  const dark = theme === 'overlay' || (theme === 'main' && themeController.snapshot().resolved === 'dark')
  root.classList.toggle(SHARED_DARK_THEME_CLASS, dark)
  root.classList.toggle('app-light-theme', theme === 'main' && !dark)
  root.classList.toggle(MAIN_WINDOW_THEME_CLASS, theme === 'main')
  root.classList.toggle(BUSINESS_OVERLAY_THEME_CLASS, theme === 'overlay')
  return theme
}
