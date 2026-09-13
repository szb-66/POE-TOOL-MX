import { computed, ref } from 'vue'
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
  return { state, error, busy, readOnly, toggling, setEnabled, call, action, refresh, initialize, suspend, disconnect }
})
