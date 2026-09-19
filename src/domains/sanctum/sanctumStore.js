import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { emptySanctumState } from '../../../shared/sanctum.js'

export const useSanctumStore = defineStore('sanctum', () => {
  const state = ref(emptySanctumState()), error = ref('')
  const toggling = ref(false)
  let unsubscribe = null
  async function call(name, ...args) {
    const api = globalThis.window?.electronAPI?.sanctum
    if (!api) { error.value = '请在流放助手中打开圣所'; throw new Error(error.value) }
    try {
      const result = await api[name](...JSON.parse(JSON.stringify(args)))
      if (!result?.success) throw new Error(result?.error || '圣所操作失败')
      error.value = ''
      return result.data
    } catch (failure) {
      error.value = failure?.message || '圣所操作失败'
      throw failure
    }
  }
  async function action(name, ...args) { const next = await call(name, ...args); state.value = next; return next }
  async function refresh() { return action('getState') }
  async function initialize() {
    if (!unsubscribe) unsubscribe = globalThis.window?.electronAPI?.onSanctumState(next => { state.value = next })
    await action('setModuleEnabled', true)
  }
  function disconnect() { unsubscribe?.(); unsubscribe = null }
  async function suspend() { await action('setModuleEnabled', false); disconnect(); return { success: true } }
  async function setEnabled(value) {
    if (toggling.value) return
    toggling.value = true
    try { await action('setEnabled', value) }
    catch {
      const failure = error.value
      try { await refresh() } catch { /* Keep the original save failure visible. */ }
      error.value = failure
    } finally { toggling.value = false }
  }
  const busy = computed(() => state.value.running || state.value.captureDraining)
  const readOnly = computed(() => !state.value.enabled || toggling.value)
  const strategyDraft = ref(null), strategySaveStatus = ref('idle'), strategySaveError = ref('')
  let strategyDirty = false, strategyVersion = 0, strategySaving = false, strategySaveTask = null
  const clone = value => JSON.parse(JSON.stringify(value))
  function syncStrategy(value) {
    strategyDraft.value = { ...clone(value), layoutPreference: { miniboss: 0, ...value.layoutPreference },
      toleratedAfflictions: [...(value.toleratedAfflictions || [])], bannedAfflictions: [...(value.bannedAfflictions || [])] }
  }
  watch(() => JSON.stringify(state.value.strategy), serialized => {
    // stop() publishes the old strategy before saveStrategy applies the new one.
    if (serialized && !strategyDirty && !strategySaving) syncStrategy(JSON.parse(serialized))
  }, { immediate: true, flush: 'sync' })

  async function drainStrategySaves() {
    strategySaving = true
    strategySaveStatus.value = 'saving'
    strategySaveError.value = ''
    try {
      while (strategyDirty) {
        if (readOnly.value) throw new Error('圣所已关闭或正在切换，修改尚未保存，请开启后重试')
        const version = strategyVersion
        const next = await action('saveStrategy', clone(strategyDraft.value))
        if (version === strategyVersion) {
          syncStrategy(next.strategy)
          strategyDirty = false
        }
      }
      strategySaveStatus.value = 'saved'
      return true
    } catch (failure) {
      strategySaveStatus.value = 'error'
      strategySaveError.value = failure?.message || '策略保存失败，请重试'
      return false
    } finally {
      strategySaving = false
    }
  }
  function saveStrategyDraft() {
    if (readOnly.value) return Promise.resolve(false)
    strategyDirty = true
    strategyVersion += 1
    if (!strategySaving) strategySaveTask = drainStrategySaves()
    return strategySaveTask
  }
  return { state, error, busy, readOnly, toggling, setEnabled, call, action, refresh, initialize, suspend, disconnect,
    strategyDraft, strategySaveStatus, strategySaveError, saveStrategyDraft }
})
