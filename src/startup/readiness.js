import { readonly, ref } from 'vue'

const runtimeState = ref({
  settled: typeof window === 'undefined' || !window.electronAPI,
  warnings: []
})

export const mainRuntimeState = readonly(runtimeState)

export function markMainRuntimeSettled(warnings = []) {
  runtimeState.value = { settled: true, warnings: [...warnings] }
}

export function resetMainRuntimeReadiness() {
  runtimeState.value = {
    settled: typeof window === 'undefined' || !window.electronAPI,
    warnings: []
  }
}
