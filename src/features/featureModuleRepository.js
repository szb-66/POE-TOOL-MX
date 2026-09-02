import {
  FEATURE_MODULE_STORAGE_KEY,
  FEATURE_MODULE_STORAGE_VERSION,
  availableFeatureCatalog
} from './featureCatalog.js'

const emptyState = () => ({ version: FEATURE_MODULE_STORAGE_VERSION, disabledFeatureIds: [] })

export function normalizeFeatureModuleState(value, { development = false } = {}) {
  if (!value || value.version !== FEATURE_MODULE_STORAGE_VERSION || !Array.isArray(value.disabledFeatureIds)) {
    return emptyState()
  }
  const validIds = new Set(availableFeatureCatalog({ development }).map(item => item.id))
  const disabledFeatureIds = [...new Set(value.disabledFeatureIds
    .filter(id => typeof id === 'string')
    .map(id => id.trim())
    .filter(id => validIds.has(id)))]
  return { version: FEATURE_MODULE_STORAGE_VERSION, disabledFeatureIds }
}

export function readFeatureModuleState(storage = globalThis.localStorage, options = {}) {
  try {
    const raw = storage?.getItem?.(FEATURE_MODULE_STORAGE_KEY)
    if (raw == null) return emptyState()
    return normalizeFeatureModuleState(JSON.parse(raw), options)
  } catch {
    return emptyState()
  }
}

export function saveFeatureModuleState(state, storage = globalThis.localStorage, options = {}) {
  const normalized = normalizeFeatureModuleState(state, options)
  try {
    storage?.setItem?.(FEATURE_MODULE_STORAGE_KEY, JSON.stringify(normalized))
    return Boolean(storage)
  } catch {
    return false
  }
}

export function resetFeatureModuleState(storage = globalThis.localStorage) {
  try {
    storage?.removeItem?.(FEATURE_MODULE_STORAGE_KEY)
    return Boolean(storage)
  } catch {
    return false
  }
}
