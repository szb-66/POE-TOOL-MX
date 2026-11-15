import { SHARED_SETTINGS_FIELDS, serverStorageKey } from '../../shared/serverMode.js'

export function createServerStorage(storage, serverId = 'cn') {
  const readObject = key => {
    try { return JSON.parse(storage.getItem(key) || '{}') || {} } catch { return {} }
  }
  const keyFor = key => serverStorageKey(String(key), serverId)
  return {
    getItem(key) {
      if (key !== 'settings' || serverId === 'cn') return storage?.getItem(keyFor(key)) ?? null
      const shared = readObject('settings')
      const own = readObject(keyFor(key))
      return JSON.stringify({ ...own, ...Object.fromEntries(SHARED_SETTINGS_FIELDS.filter(k => Object.hasOwn(shared, k)).map(k => [k, shared[k]])) })
    },
    setItem(key, value) {
      if (!storage) return
      if (key !== 'settings' || serverId === 'cn') return storage.setItem(keyFor(key), value)
      const settings = JSON.parse(value)
      const shared = readObject('settings')
      for (const field of SHARED_SETTINGS_FIELDS) if (Object.hasOwn(settings, field)) shared[field] = settings[field]
      storage.setItem('settings', JSON.stringify(shared))
      storage.setItem(keyFor(key), JSON.stringify(Object.fromEntries(Object.entries(settings).filter(([k]) => !SHARED_SETTINGS_FIELDS.includes(k)))))
    },
    removeItem(key) { storage?.removeItem(keyFor(key)) }
  }
}

// 延迟读取，模块加载期间也能安全使用，所有窗口均使用 preload 提供的同一上下文。
const current = () => createServerStorage(globalThis.localStorage, globalThis.window?.electronAPI?.serverContext?.id || 'cn')
export const serverStorage = {
  available: () => Boolean(globalThis.localStorage),
  getItem: key => current().getItem(key),
  setItem: (key, value) => current().setItem(key, value),
  removeItem: key => current().removeItem(key)
}
