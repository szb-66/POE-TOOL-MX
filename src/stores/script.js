import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useScriptStore = defineStore('script', () => {
  const isRunning = ref(false)
  const mode = ref(null)
  const processId = ref(null)
  const lastError = ref('')
  const lastMode = ref(null)

  function applyStatus(status = {}) {
    const running = status.isRunning === true || status.status === 'running'
    isRunning.value = running
    mode.value = running && (status.mode === 'items' || status.mode === 'map') ? status.mode : null
    if (status.mode === 'items' || status.mode === 'map') lastMode.value = status.mode
    processId.value = running ? (status.processId ?? null) : null
    if (status.status === 'error') lastError.value = status.error || '制作脚本异常退出'
    else if (running || status.status === 'stopped') lastError.value = ''
  }

  function reset() {
    isRunning.value = false
    mode.value = null
    processId.value = null
    lastError.value = ''
    lastMode.value = null
  }

  return {
    isRunning,
    mode,
    processId,
    lastError,
    lastMode,
    applyStatus,
    reset
  }
})

