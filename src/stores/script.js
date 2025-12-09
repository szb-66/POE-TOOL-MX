import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useScriptStore = defineStore('script', () => {
  const isRunning = ref(false)
  const currentScript = ref(null)
  const processId = ref(null)

  function setRunning(running) {
    isRunning.value = running
  }

  function setCurrentScript(scriptPath) {
    currentScript.value = scriptPath
  }

  function setProcessId(pid) {
    processId.value = pid
  }

  function reset() {
    isRunning.value = false
    currentScript.value = null
    processId.value = null
  }

  return {
    isRunning,
    currentScript,
    processId,
    setRunning,
    setCurrentScript,
    setProcessId,
    reset
  }
})

