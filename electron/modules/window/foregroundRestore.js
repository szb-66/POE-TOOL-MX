const yieldToWindowManager = () => new Promise(resolve => setTimeout(resolve, 0))
const MINIMIZE_SETTLE_CAP_MS = 300

function usableWindow(window) {
  return Boolean(window && !window.isDestroyed?.())
}

function requestForeground(window) {
  if (window.isMinimized?.()) window.restore()
  window.show()
  window.moveTop?.()
  window.focus()
}

function waitForWindowMinimized(window, capMs = MINIMIZE_SETTLE_CAP_MS) {
  if (window.isMinimized?.() || typeof window.once !== 'function') return Promise.resolve()
  return new Promise(resolve => {
    const finish = () => {
      clearTimeout(timer)
      window.removeListener?.('minimize', finish)
      resolve()
    }
    const timer = setTimeout(finish, capMs)
    window.once('minimize', finish)
  })
}

export async function restoreWindowToForeground(window, { yieldFn = yieldToWindowManager } = {}) {
  if (!usableWindow(window)) return false
  try {
    requestForeground(window)
    await yieldFn()
    if (!usableWindow(window)) return false
    if (window.isFocused?.()) return true

    const minimized = waitForWindowMinimized(window)
    window.minimize()
    await minimized
    if (!usableWindow(window)) return false
    window.restore()
    requestForeground(window)
    await yieldFn()
    return usableWindow(window) && Boolean(window.isFocused?.())
  } catch {
    return false
  }
}
