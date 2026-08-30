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
  const lastFailure = ref({ failureCode: '', configurationIssueId: '' })
  const loopRunning = ref(false)
  const loopFocused = ref(false)
  const loopTriggers = ref(0)
  const loopProcessId = ref(null)
  const loopLastError = ref('')
  const loopLastFailure = ref({ failureCode: '', configurationIssueId: '' })
  const portalLastError = ref('')
  const portalLastFailure = ref({ failureCode: '', configurationIssueId: '' })

  function applyStatus(status = {}) {
    const isLoop = status.origin === 'loop'
    if (status.event === 'starting' || status.event === 'started') {
      if (isLoop) {
        loopLastError.value = ''
        loopLastFailure.value = { failureCode: '', configurationIssueId: '' }
      } else {
        lastError.value = ''
        lastFailure.value = { failureCode: '', configurationIssueId: '' }
      }
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
        loopLastFailure.value = {
          failureCode: status.failureCode || status.code || '',
          configurationIssueId: status.configurationIssueId || ''
        }
        void reportDiagnosticFailure('combat', 'script_runtime', status, 'process_exit')
      } else {
        lastError.value = status.error || '战斗辅助发生错误'
        lastFailure.value = {
          failureCode: status.failureCode || status.code || '',
          configurationIssueId: status.configurationIssueId || ''
        }
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

  function applyPortalFailure(failure = null) {
    portalLastError.value = failure ? String(failure.error || failure.message || '一键回城执行失败') : ''
    portalLastFailure.value = failure ? {
      failureCode: String(failure.failureCode || failure.code || ''),
      configurationIssueId: String(failure.configurationIssueId || '')
    } : { failureCode: '', configurationIssueId: '' }
  }

  return {
    running, focused, protectedMode, processId, healthTriggers, manaTriggers, lastError, lastFailure,
    loopRunning, loopFocused, loopTriggers, loopProcessId, loopLastError, loopLastFailure,
    portalLastError, portalLastFailure, applyStatus, applyPortalFailure
  }
})
