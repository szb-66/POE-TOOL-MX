import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from '../utils/diagnostics.js'

export const useCombatStore = defineStore('combat', () => {
  const running = ref(false)
  const focused = ref(false)
  const protectedMode = ref(false)
  const processId = ref(null)
  const healthTriggers = ref(0)
  const manaTriggers = ref(0)
  const lastError = ref('')

  function applyStatus(status = {}) {
    if (status.event === 'starting' || status.event === 'started') {
      lastError.value = ''
      void reportDiagnosticRecovery('combat', 'script_runtime')
    }
    if (typeof status.running === 'boolean') running.value = status.running
    if (status.processId !== undefined) processId.value = status.processId
    if (status.event === 'focus') focused.value = Boolean(status.active)
    if (status.event === 'protected') protectedMode.value = true
    if (status.event === 'triggered') {
      protectedMode.value = false
      if (status.resource === 'health') healthTriggers.value += 1
      if (status.resource === 'mana') manaTriggers.value += 1
    }
    if (status.event === 'error') {
      lastError.value = status.error || '战斗辅助发生错误'
      void reportDiagnosticFailure('combat', 'script_runtime', status, 'process_exit')
    }
    if (!running.value) {
      focused.value = false
      protectedMode.value = false
      processId.value = null
    }
  }

  return {
    running, focused, protectedMode, processId, healthTriggers, manaTriggers, lastError, applyStatus
  }
})
