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
  const loopRunning = ref(false)
  const loopFocused = ref(false)
  const loopTriggers = ref(0)
  const loopProcessId = ref(null)
  const loopLastError = ref('')

  function applyStatus(status = {}) {
    const isLoop = status.origin === 'loop'
    if (status.event === 'starting' || status.event === 'started') {
      if (isLoop) loopLastError.value = ''
      else lastError.value = ''
      void reportDiagnosticRecovery('combat', 'script_runtime')
    }
    if (typeof status.running === 'boolean') {
      if (isLoop) loopRunning.value = status.running
      else running.value = status.running
    }
    if (status.processId !== undefined) {
      if (isLoop) loopProcessId.value = status.processId
      else processId.value = status.processId
    }
    if (status.event === 'focus') {
      if (isLoop) loopFocused.value = Boolean(status.active)
      else focused.value = Boolean(status.active)
    }
    if (status.event === 'protected' && !isLoop) protectedMode.value = true
    if (status.event === 'triggered') {
      if (isLoop) loopTriggers.value += 1
      else {
        protectedMode.value = false
        if (status.resource === 'health') healthTriggers.value += 1
        if (status.resource === 'mana') manaTriggers.value += 1
      }
    }
    if (status.event === 'error') {
      if (isLoop) {
        loopLastError.value = status.error || '主动循环发生错误'
        void reportDiagnosticFailure('combat', 'script_runtime', status, 'process_exit')
      } else {
        lastError.value = status.error || '战斗辅助发生错误'
        void reportDiagnosticFailure('combat', 'script_runtime', status, 'process_exit')
      }
    }
    if (isLoop) {
      if (!loopRunning.value) {
        loopFocused.value = false
        loopProcessId.value = null
      }
    } else if (!running.value) {
      focused.value = false
      protectedMode.value = false
      processId.value = null
    }
  }

  return {
    running, focused, protectedMode, processId, healthTriggers, manaTriggers, lastError,
    loopRunning, loopFocused, loopTriggers, loopProcessId, loopLastError,
    applyStatus
  }
})
