function validOptions(options) {
  return new Set(Array.isArray(options) ? options.map(value => String(value)) : [])
}

function safeDefault(options, fallback) {
  const allowed = validOptions(options)
  const normalizedFallback = String(fallback ?? '')
  return allowed.has(normalizedFallback) ? normalizedFallback : (allowed.values().next().value || '')
}

function normalizeTab(value, options, fallback) {
  const allowed = validOptions(options)
  const normalized = String(value ?? '')
  return allowed.has(normalized) ? normalized : safeDefault(options, fallback)
}

export function readPersistentTab(key, options, fallback, storage = globalThis.localStorage) {
  try {
    return normalizeTab(storage?.getItem?.(String(key)), options, fallback)
  } catch {
    return safeDefault(options, fallback)
  }
}

export function writePersistentTab(key, value, options, fallback, storage = globalThis.localStorage) {
  const normalized = normalizeTab(value, options, fallback)
  try { storage?.setItem?.(String(key), normalized) } catch {}
  return normalized
}

export function readPersistentTabMap(key, groupIds, options, fallback, storage = globalThis.localStorage) {
  let stored = {}
  try {
    const parsed = JSON.parse(storage?.getItem?.(String(key)) || '{}')
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) stored = parsed
  } catch {}
  return Object.fromEntries((groupIds || []).map(groupId => {
    const id = String(groupId)
    return [id, normalizeTab(stored[id], options, fallback)]
  }))
}

export function writePersistentTabMap(key, values, groupIds, options, fallback, storage = globalThis.localStorage) {
  const normalized = Object.fromEntries((groupIds || []).map(groupId => {
    const id = String(groupId)
    return [id, normalizeTab(values?.[id], options, fallback)]
  }))
  try { storage?.setItem?.(String(key), JSON.stringify(normalized)) } catch {}
  return normalized
}
