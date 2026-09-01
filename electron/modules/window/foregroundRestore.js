import { execFile } from 'node:child_process'

const yieldToWindowManager = () => new Promise(resolve => setTimeout(resolve, 0))
const MINIMIZE_SETTLE_CAP_MS = 300
const NATIVE_FOCUS_TIMEOUT_MS = 3000

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

function nativeWindowHandleValue(window) {
  const handle = window?.getNativeWindowHandle?.()
  if (!Buffer.isBuffer(handle) || handle.length < 4) return ''
  return (handle.length >= 8 ? handle.readBigUInt64LE(0) : BigInt(handle.readUInt32LE(0))).toString()
}

function windowsNativeFocusScript() {
  return [
    'import ctypes, sys, time',
    'from ctypes import wintypes',
    'u = ctypes.windll.user32',
    'k = ctypes.windll.kernel32',
    'hwnd_value = int(sys.argv[1])',
    'hwnd = wintypes.HWND(hwnd_value)',
    'u.GetForegroundWindow.restype = wintypes.HWND',
    'u.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]',
    'u.GetWindowThreadProcessId.restype = wintypes.DWORD',
    'foreground = u.GetForegroundWindow()',
    'current_thread = k.GetCurrentThreadId()',
    'foreground_thread = u.GetWindowThreadProcessId(foreground, None) if foreground else 0',
    'target_thread = u.GetWindowThreadProcessId(hwnd, None)',
    'attached_foreground = bool(foreground_thread and foreground_thread != current_thread and u.AttachThreadInput(current_thread, foreground_thread, True))',
    'attached_target = bool(target_thread and target_thread != current_thread and target_thread != foreground_thread and u.AttachThreadInput(current_thread, target_thread, True))',
    'try:',
    ' u.ShowWindow(hwnd, 9) if u.IsIconic(hwnd) else None',
    ' u.BringWindowToTop(hwnd)',
    ' u.SetForegroundWindow(hwnd)',
    ' u.SetFocus(hwnd)',
    'finally:',
    ' u.AttachThreadInput(current_thread, target_thread, False) if attached_target else None',
    ' u.AttachThreadInput(current_thread, foreground_thread, False) if attached_foreground else None',
    'deadline = time.monotonic() + 2.0',
    'while time.monotonic() < deadline and u.GetForegroundWindow() != hwnd_value:',
    ' time.sleep(0.05)',
    'sys.exit(0 if u.GetForegroundWindow() == hwnd_value else 25)'
  ].join('\n')
}

export function restoreWindowsNativeWindowFocus(window, {
  platform = process.platform,
  pythonPath = '',
  execFileImpl = execFile
} = {}) {
  const handle = nativeWindowHandleValue(window)
  if (platform !== 'win32' || !pythonPath || !handle || typeof execFileImpl !== 'function') {
    return Promise.resolve(false)
  }
  return new Promise(resolve => {
    try {
      execFileImpl(
        pythonPath,
        ['-c', windowsNativeFocusScript(), handle],
        { windowsHide: true, timeout: NATIVE_FOCUS_TIMEOUT_MS },
        error => resolve(!error)
      )
    } catch {
      resolve(false)
    }
  })
}

export async function restoreWindowToForeground(window, {
  yieldFn = yieldToWindowManager,
  nativeFocusFn = null
} = {}) {
  if (!usableWindow(window)) return false
  try {
    if (typeof nativeFocusFn === 'function') {
      const restored = await nativeFocusFn(window)
      await yieldFn()
      if (restored && usableWindow(window) && window.isFocused?.()) return true
    }

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
