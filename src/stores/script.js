import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from '../utils/diagnostics.js'
import { useBatchCraftingStore } from './batchCrafting.js'

function createEmptyBatchRuntime() {
  return {
    active: false,
    mode: 'snapshot',
    total: 0,
    completed: 0,
    skipped: 0,
    remaining: 0,
    currentItem: null,
    failedItem: null,
    stopReason: '',
    stopCode: '',
    completedIds: [],
    skippedIds: [],
    skippedItems: []
  }
}

export const useScriptStore = defineStore('script', () => {
  const isRunning = ref(false)
  const mode = ref(null)
  const craftingKind = ref(null)
  const processId = ref(null)
  const lastError = ref('')
  const lastMode = ref(null)
  const lastCraftingKind = ref(null)
  const itemRuntime = ref({ eldritchImplicitMatch: false, matchedEldritchTargetName: '', error: '' })
  const batchRuntime = ref(createEmptyBatchRuntime())

  function beginBatch(config, usageSessionId) {
    const completedIds = [...new Set((config.completedIds || []).map(String))]
    const skippedIds = [...new Set((config.skippedIds || []).map(String))]
    const total = config.mode === 'auto-scan' ? 0 : (config.targets?.length || 0)
    batchRuntime.value = {
      ...createEmptyBatchRuntime(),
      active: true,
      mode: config.mode === 'auto-scan' ? 'auto-scan' : 'snapshot',
      total,
      completed: completedIds.length,
      skipped: skippedIds.length,
      remaining: config.mode === 'auto-scan' ? 0 : Math.max(0, total - completedIds.length - skippedIds.length),
      usageSessionId,
      completedIds,
      skippedIds
    }
  }

  function applyItemResult(result = {}) {
    if (result.reset) return resetItemRuntime()
    if (String(result.event || '').startsWith('crafting-batch-')) {
      const failed = result.event === 'crafting-batch-preflight-failed'
      const completed = result.event === 'crafting-batch-completed'
      const completedIds = [...(batchRuntime.value.completedIds || [])]
      const skippedIds = [...(batchRuntime.value.skippedIds || [])]
      const completedId = result.event === 'crafting-batch-item-completed'
        ? String(result.currentItem?.id || '')
        : ''
      if (completedId && !completedIds.includes(completedId)) completedIds.push(completedId)
      const skippedId = result.event === 'crafting-batch-item-skipped'
        ? String(result.currentItem?.id || '')
        : ''
      if (skippedId && !skippedIds.includes(skippedId)) skippedIds.push(skippedId)
      const skippedItems = Array.isArray(result.skippedItems)
        ? result.skippedItems
        : (result.event === 'crafting-batch-item-skipped' && result.currentItem
            ? [...(batchRuntime.value.skippedItems || []), {
                id: skippedId,
                displayName: result.currentItem.displayName || result.currentItem.baseType || '未知物品',
                x: Number(result.currentItem.x || 0),
                y: Number(result.currentItem.y || 0),
                reason: String(result.reason || '已跳过'),
                code: String(result.code || '')
              }]
            : (batchRuntime.value.skippedItems || []))

      batchRuntime.value = {
        ...batchRuntime.value,
        active: !completed,
        mode: result.batchMode === 'auto-scan' ? 'auto-scan' : batchRuntime.value.mode,
        total: Number(result.total ?? batchRuntime.value.total),
        completed: Number(result.completed ?? completedIds.length),
        skipped: Number(result.skipped ?? skippedIds.length),
        remaining: Number(result.remaining ?? batchRuntime.value.remaining),
        currentItem: result.currentItem || null,
        failedItem: failed ? (result.currentItem || null) : batchRuntime.value.failedItem,
        stopReason: failed ? String(result.reason || '') : '',
        stopCode: failed ? String(result.code || '') : '',
        completedIds,
        skippedIds,
        skippedItems
      }
      if (completed) {
        try { useBatchCraftingStore().markSnapshotConsumed() } catch { /* 单测未挂载 batchCraftingStore 时忽略 */ }
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
    batchRuntime.value = createEmptyBatchRuntime()
  }

  function resetItemRuntime() {
    itemRuntime.value = { eldritchImplicitMatch: false, matchedEldritchTargetName: '', error: '' }
    resetBatchRuntime()
  }

  function applyStatus(status = {}) {
    const running = status.isRunning === true || status.status === 'running'
    isRunning.value = running
    mode.value = running && (status.mode === 'items' || status.mode === 'map') ? status.mode : null
    craftingKind.value = running && status.mode === 'items' ? (status.craftingKind || 'general') : null
    if (status.mode === 'items' || status.mode === 'map') lastMode.value = status.mode
    if (status.mode === 'items') lastCraftingKind.value = status.craftingKind || lastCraftingKind.value || 'general'
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
    craftingKind.value = null
    processId.value = null
    lastError.value = ''
    lastMode.value = null
    lastCraftingKind.value = null
    resetItemRuntime()
  }

  return {
    isRunning,
    mode,
    craftingKind,
    processId,
    lastError,
    lastMode,
    lastCraftingKind,
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
