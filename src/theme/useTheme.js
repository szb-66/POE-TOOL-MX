import { computed, shallowRef } from 'vue'
import { createThemeController } from './themePreference.js'

export const themeController = createThemeController()
const state = shallowRef(themeController.snapshot())
themeController.subscribe(value => { state.value = value })
export function useTheme() {
  return {
    themePreference: computed(() => state.value.preference),
    resolvedTheme: computed(() => state.value.resolved),
    setThemePreference: value => themeController.setPreference(value),
    toggleTheme: () => themeController.toggle()
  }
}
if (import.meta.hot) import.meta.hot.dispose(() => themeController.dispose())
