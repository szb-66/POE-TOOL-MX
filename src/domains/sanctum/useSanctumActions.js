import { useSanctumStore } from './sanctumStore.js'

export function useSanctumActions() {
  const store = useSanctumStore()
  async function perform(name, ...args) {
    try { return await store.action(name, ...args) } catch { /* The store exposes the failure to the page. */ }
  }
  return { store, perform }
}
