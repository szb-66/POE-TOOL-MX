import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { electronApi } from '../api/electron.js'
import { usePresetStore } from './preset.js'
import { useScriptStore } from './script.js'

function normalizeScanOptimization(value = {}) {
  return {
    mode: value?.mode === 'model' ? 'model' : 'fallback',
    modelVersion: String(value?.modelVersion || ''),
    threshold: Number.isFinite(Number(value?.threshold)) ? Number(value.threshold) : 0.995,
    skippedModelEmpty: Math.max(0, Number(value?.skippedModelEmpty || 0)),
    skippedOccupied: Math.max(0, Number(value?.skippedOccupied || 0)),
    fallbackReason: String(value?.fallbackReason || '')
  }
}

export const useBatchCraftingStore = defineStore('batchCrafting', () => {
  const presets = usePresetStore()
  const snapshot = ref(null)
  const snapshotConsumed = ref(false)
  const excludedItemIds = ref([])
  const busy = ref(false)
  const progress = ref({ scanned: 0, total: 60, skippedOccupied: 0, skippedModelEmpty: 0 })
  const error = ref('')
  let scanPromise = null
  let disposeProgress = null

  const enabled = computed(() => Boolean(presets.currentItemPreset?.batchCrafting?.enabled))
  const selectedCategoryIds = computed(() => presets.currentItemPreset?.batchCrafting?.categoryIds || [])
  const categories = computed(() => snapshot.value?.categories || [])
  const scanOptimization = computed(() => normalizeScanOptimization(snapshot.value?.scanOptimization))
  const hasActiveSnapshot = computed(() => Boolean(snapshot.value?.scanId && !snapshotConsumed.value))
  const excludedSet = computed(() => new Set(excludedItemIds.value))
  const candidates = computed(() => {
    const selected = new Set(selectedCategoryIds.value)
    return (snapshot.value?.items || []).filter(item => (
      item.selectable !== false &&
      selected.has(item.categoryId) &&
      !excludedSet.value.has(String(item.id))
    ))
  })

  function clear() {
    useScriptStore().resetBatchRuntime()
    snapshot.value = null
    snapshotConsumed.value = false
    excludedItemIds.value = []
    progress.value = { scanned: 0, total: 60, skippedOccupied: 0, skippedModelEmpty: 0 }
    error.value = ''
  }

  function toggleExcludeItem(itemId) {
    const key = String(itemId || '')
    if (!key) return
    if (excludedItemIds.value.includes(key)) {
      excludedItemIds.value = excludedItemIds.value.filter(id => id !== key)
    } else {
      excludedItemIds.value = [...excludedItemIds.value, key]
    }
    if (snapshot.value?.scanId) snapshotConsumed.value = false
  }

  function isItemExcluded(itemId) {
    return excludedSet.value.has(String(itemId || ''))
  }

  function markSnapshotConsumed() {
    if (snapshot.value?.scanId) snapshotConsumed.value = true
  }

  async function scanInventory(config) {
    if (scanPromise) return scanPromise
    scanPromise = (async () => {
      await electronApi.batchCrafting.clearRecovery()
      useScriptStore().resetBatchRuntime()
      busy.value = true
      error.value = ''
      snapshot.value = null
      snapshotConsumed.value = false
      excludedItemIds.value = []
      // 重扫自动保留用户上次已勾选的物品类别，避免反复勾选。
      progress.value = { scanned: 0, total: 60, skippedOccupied: 0, skippedModelEmpty: 0 }
      try {
        const result = await electronApi.batchCrafting.scanInventory(config)
        if (!result?.success || !result.snapshot) {
          throw Object.assign(new Error(result?.error || '本地背包扫描失败'), {
            code: result?.errorCode || 'SCAN_FAILED',
            cancelled: Boolean(result?.cancelled)
          })
        }
        snapshot.value = {
          ...result.snapshot,
          scanOptimization: normalizeScanOptimization(result.snapshot.scanOptimization)
        }
        return snapshot.value
      } catch (caught) {
        if (!caught?.cancelled && caught?.code !== 'USER_STOPPED') {
          error.value = caught?.message || '本地背包扫描失败'
        }
        throw caught
      } finally {
        busy.value = false
      }
    })().finally(() => { scanPromise = null })
    return scanPromise
  }

  async function stopScan() {
    return electronApi.batchCrafting.stopScan()
  }

  function listen() {
    if (!disposeProgress) {
      disposeProgress = electronApi.batchCrafting.onScanProgress(value => {
        progress.value = {
          scanned: Number(value?.scanned || 0),
          total: Number(value?.total || 60),
          skippedOccupied: Number(value?.skippedOccupied || 0),
          skippedModelEmpty: Number(value?.skippedModelEmpty || 0)
        }
      })
    }
    return () => dispose()
  }

  function dispose() {
    disposeProgress?.()
    disposeProgress = null
    clear()
  }

  return {
    snapshot, snapshotConsumed, hasActiveSnapshot, excludedItemIds, busy, progress, error,
    enabled, selectedCategoryIds, categories, candidates, scanOptimization,
    clear, toggleExcludeItem, isItemExcluded, markSnapshotConsumed, scanInventory, stopScan, listen, dispose
  }
})
