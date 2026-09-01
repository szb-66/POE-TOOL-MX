import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from '../utils/diagnostics.js'

export const useScriptStore = defineStore('script', () => {
  const isRunning = ref(false)
  const mode = ref(null)
  const processId = ref(null)
  const lastError = ref('')
  const lastMode = ref(null)
  const itemRuntime = ref({ eldritchImplicitMatch: false, matchedEldritchTargetName: '', error: '' })
  const batchRuntime = ref({
    active: false, total: 0, completed: 0, remaining: 0, currentItem: null,
    failedItem: null, stopReason: '', stopCode: '', completedIds: []
  })

  function beginBatch(config, usageSessionId) {
    const completedIds = [...new Set((config.completedIds || []).map(String))]
    batchRuntime.value = {
      active: true,
      total: config.targets?.length || 0,
      completed: completedIds.length,
      remaining: Math.max(0, (config.targets?.length || 0) - completedIds.length),
      currentItem: null, failedItem: null, stopReason: '', stopCode: '',
      usageSessionId, completedIds
    }
  }

  function applyItemResult(result = {}) {
    if (result.reset) return resetItemRuntime()
    if (String(result.event || '').startsWith('crafting-batch-')) {
      const failed = result.event === 'crafting-batch-preflight-failed'
      const completed = result.event === 'crafting-batch-completed'
      const completedIds = [...(batchRuntime.value.completedIds || [])]
      const completedId = result.event === 'crafting-batch-item-completed'
        ? String(result.currentItem?.id || '')
        : ''
      if (completedId && !completedIds.includes(completedId)) completedIds.push(completedId)
      batchRuntime.value = {
        ...batchRuntime.value,
        active: !completed,
        total: Number(result.total ?? batchRuntime.value.total),
        completed: Number(result.completed ?? batchRuntime.value.completed),
        remaining: Number(result.remaining ?? batchRuntime.value.remaining),
        currentItem: result.currentItem || null,
        failedItem: failed ? (result.currentItem || null) : batchRuntime.value.failedItem,
        stopReason: failed ? String(result.reason || '') : '',
        stopCode: failed ? String(result.code || '') : '',
        completedIds
      }
      return
    }
    itemRuntime.value = {
      ...itemRuntime.value,
      eldritchImplicitMatch: Boolean(result.eldritchImplicitMatch),
      matchedEldritchTargetName: String(result.matchedEldritchTargetName || ''),
      error: String(result.error || '')
    }
  }

  function resetBatchRuntime() {
    batchRuntime.value = {
      active: false, total: 0, completed: 0, remaining: 0, currentItem: null,
      failedItem: null, stopReason: '', stopCode: '', completedIds: []
    }
  }

  function resetItemRuntime() {
    itemRuntime.value = { eldritchImplicitMatch: false, matchedEldritchTargetName: '', error: '' }
    resetBatchRuntime()
  }

  function applyStatus(status = {}) {
    const running = status.isRunning === true || status.status === 'running'
    isRunning.value = running
    mode.value = running && (status.mode === 'items' || status.mode === 'map') ? status.mode : null
    if (status.mode === 'items' || status.mode === 'map') lastMode.value = status.mode
    processId.value = running ? (status.processId ?? null) : null
    if (status.status === 'error') {
      lastError.value = status.error || '制作脚本异常退出'
      void reportDiagnosticFailure(lastMode.value || 'items', 'script_runtime', status, 'process_exit')
    } else if (running || status.status === 'stopped') {
      lastError.value = ''
      if (lastMode.value) void reportDiagnosticRecovery(lastMode.value, 'script_runtime')
    }
  }

  function reset() {
    isRunning.value = false
    mode.value = null
    processId.value = null
    lastError.value = ''
    lastMode.value = null
    resetItemRuntime()
  }

  return {
    isRunning,
    mode,
    processId,
    lastError,
    lastMode,
    itemRuntime,
    batchRuntime,
    beginBatch,
    resetBatchRuntime,
    applyItemResult,
    resetItemRuntime,
    applyStatus,
    reset
  }
})

