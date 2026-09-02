const runtimeAdapters = new Map()
let shortcutSynchronizer = null

const ok = result => result !== false && result?.success !== false

export function registerFeatureRuntimeAdapter(featureId, adapter = {}) {
  runtimeAdapters.set(featureId, adapter)
  return () => { if (runtimeAdapters.get(featureId) === adapter) runtimeAdapters.delete(featureId) }
}

export function setFeatureShortcutSynchronizer(synchronizer) {
  shortcutSynchronizer = typeof synchronizer === 'function' ? synchronizer : null
}

export async function isFeatureRuntimeBusy(featureId) {
  return Boolean(await runtimeAdapters.get(featureId)?.isBusy?.())
}

export async function disableFeatureModule(featureId, { store, router } = {}) {
  const adapter = runtimeAdapters.get(featureId)
  let suspendAttempted = false
  try {
    suspendAttempted = Boolean(adapter?.suspend)
    const result = await adapter?.suspend?.()
    if (!ok(result)) throw new Error(result?.error || '模块未能安全停止')
    store.disable(featureId)
    if (shortcutSynchronizer) await shortcutSynchronizer()
    if (store.moduleForRoute(router?.currentRoute?.value?.path)?.id === featureId) await router.push('/')
    return { success: true }
  } catch (error) {
    if (!store.isEnabled(featureId)) store.enable(featureId)
    if (suspendAttempted) {
      try { await adapter?.resume?.() } catch {}
      try { await shortcutSynchronizer?.() } catch {}
    }
    return { success: false, error: error?.message || String(error) }
  }
}

export async function enableFeatureModule(featureId, { store } = {}) {
  store.enable(featureId)
  const warnings = []
  try {
    const result = await runtimeAdapters.get(featureId)?.resume?.()
    if (!ok(result)) warnings.push(result?.error || '后台能力恢复失败')
  } catch (error) { warnings.push(error?.message || String(error)) }
  try { await shortcutSynchronizer?.() } catch (error) { warnings.push(`快捷键恢复失败：${error?.message || error}`) }
  return { success: true, warnings }
}
