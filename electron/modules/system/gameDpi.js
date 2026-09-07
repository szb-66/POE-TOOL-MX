import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import {
  DEFAULT_GAME_WINDOW_TITLES,
  DEFAULT_GAME_WINDOW_PROCESS_NAMES,
  gameWindowTitlePriority,
  isGameWindowCandidate,
  isGameWindowTitle as matchesGameWindowTitle
} from '../../../shared/gameWindowTitles.js'

const execFileAsync = promisify(execFile)

export const GAME_WINDOW_TITLE_PARTS = DEFAULT_GAME_WINDOW_TITLES

export function isGameWindowTitle(title, configuredTitles = GAME_WINDOW_TITLE_PARTS) {
  return matchesGameWindowTitle(title, configuredTitles)
}

export function selectGameWindowCandidate(
  candidates = [],
  configuredTitles = GAME_WINDOW_TITLE_PARTS,
  configuredProcessNames = DEFAULT_GAME_WINDOW_PROCESS_NAMES
) {
  const valid = candidates
    .filter((candidate) => candidate && isGameWindowCandidate(
      candidate.title,
      candidate.processName,
      configuredTitles,
      configuredProcessNames
    ))
    .map((candidate) => ({
      ...candidate,
      titlePriority: gameWindowTitlePriority(candidate.title, configuredTitles),
      area: Math.max(0, Number(candidate.area) || 0),
      foreground: Boolean(candidate.foreground),
      minimized: Boolean(candidate.minimized)
    }))

  if (valid.length === 0) return null
  return valid.sort((left, right) => left.titlePriority - right.titlePriority ||
    Number(left.minimized) - Number(right.minimized) ||
    Number(right.foreground) - Number(left.foreground) || right.area - left.area)[0]
}

const WS_CAPTION = 0x00C00000
const QUNS_RUNNING_D3D_FULL_SCREEN = 3
const MONITOR_COVERAGE_RATIO = 0.95

function windowCoverageRatio(windowRect, monitorRect) {
  if (!windowRect || !monitorRect) return null
  const windowArea = Math.max(0, windowRect.right - windowRect.left) * Math.max(0, windowRect.bottom - windowRect.top)
  const monitorArea = Math.max(0, monitorRect.right - monitorRect.left) * Math.max(0, monitorRect.bottom - monitorRect.top)
  if (monitorArea <= 0) return null
  return windowArea / monitorArea
}

// ponytail: 独占全屏判定依赖"前台+铺满+系统D3D全屏信号"同时成立，QUNS 信号仅前台可靠；
// 游戏后台铺满时按无边框处理（只漏报不误报），需更精确时在游戏前台轮询处复查 QUNS
export function classifyGameDisplayMode(candidate = null) {
  if (!candidate) return { mode: null, supported: false }
  if (candidate.minimized) return { mode: 'unknown', supported: false }
  if ((Number(candidate.style) & WS_CAPTION) !== 0) return { mode: 'windowed', supported: true }
  const coverage = windowCoverageRatio(candidate.windowRect, candidate.monitorRect)
  if (coverage !== null && coverage >= MONITOR_COVERAGE_RATIO) {
    if (candidate.foreground && Number(candidate.notificationState) === QUNS_RUNNING_D3D_FULL_SCREEN) {
      return { mode: 'exclusive', supported: false }
    }
    return { mode: 'fullscreen', supported: true }
  }
  return { mode: 'borderless', supported: true }
}

export function createCachedGameDpiDetector(detect, {
  cacheDurationMs = 2000,
  now = Date.now
} = {}) {
  let pending = null
  let cached = null
  let cachedAt = 0
  let hasCached = false
  return (...args) => {
    const currentTime = now()
    if (hasCached && currentTime - cachedAt <= cacheDurationMs) return Promise.resolve(cached)
    if (pending) return pending
    let operation
    try {
      operation = detect(...args)
    } catch (error) {
      operation = Promise.reject(error)
    }
    pending = Promise.resolve(operation)
      .then((result) => {
        cached = result
        cachedAt = now()
        hasCached = true
        return result
      })
      .finally(() => { pending = null })
    return pending
  }
}

const WINDOWS_DPI_PROBE = String.raw`
import ctypes
import json
from ctypes import wintypes

user32 = ctypes.windll.user32
user32.GetForegroundWindow.restype = wintypes.HWND
foreground = user32.GetForegroundWindow()
candidates = []

user32.GetWindowTextLengthW.argtypes = [wintypes.HWND]
user32.GetWindowTextLengthW.restype = ctypes.c_int
user32.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
user32.GetWindowTextW.restype = ctypes.c_int
user32.IsWindowVisible.argtypes = [wintypes.HWND]
user32.IsWindowVisible.restype = wintypes.BOOL
user32.IsIconic.argtypes = [wintypes.HWND]
user32.IsIconic.restype = wintypes.BOOL
user32.GetWindowRect.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.RECT)]
user32.GetWindowRect.restype = wintypes.BOOL
user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
user32.GetWindowThreadProcessId.restype = wintypes.DWORD
user32.GetWindowLongW.argtypes = [wintypes.HWND, ctypes.c_int]
user32.GetWindowLongW.restype = ctypes.c_long
user32.MonitorFromWindow.argtypes = [wintypes.HWND, wintypes.DWORD]
user32.MonitorFromWindow.restype = wintypes.HANDLE

class MONITORINFO(ctypes.Structure):
    _fields_ = [
        ("cbSize", wintypes.DWORD),
        ("rcMonitor", wintypes.RECT),
        ("rcWork", wintypes.RECT),
        ("dwFlags", wintypes.DWORD)
    ]

user32.GetMonitorInfoW.argtypes = [wintypes.HANDLE, ctypes.POINTER(MONITORINFO)]
user32.GetMonitorInfoW.restype = wintypes.BOOL


def query_notification_state():
    for dll_name in ("SHCore", "shell32"):
        try:
            fn = getattr(ctypes.WinDLL(dll_name), "SHQueryUserNotificationState")
            fn.argtypes = [ctypes.POINTER(ctypes.c_int)]
            fn.restype = ctypes.HRESULT
            state = ctypes.c_int(-1)
            if fn(ctypes.byref(state)) == 0:
                return state.value
            return -1
        except Exception:
            continue
    return -1


notification_state = query_notification_state()
enum_windows_proc = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
user32.EnumWindows.argtypes = [enum_windows_proc, wintypes.LPARAM]
user32.EnumWindows.restype = wintypes.BOOL

try:
    get_dpi_for_window = user32.GetDpiForWindow
    get_dpi_for_window.argtypes = [wintypes.HWND]
    get_dpi_for_window.restype = ctypes.c_uint
except Exception:
    get_dpi_for_window = None

@enum_windows_proc
def visit(hwnd, _lparam):
    if not user32.IsWindowVisible(hwnd):
        return True
    length = user32.GetWindowTextLengthW(hwnd)
    if length <= 0:
        return True
    buffer = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buffer, length + 1)
    title = buffer.value.strip()
    rect = wintypes.RECT()
    area = 0
    window_rect = None
    if user32.GetWindowRect(hwnd, ctypes.byref(rect)):
        area = max(0, rect.right - rect.left) * max(0, rect.bottom - rect.top)
        window_rect = {
            "left": rect.left, "top": rect.top, "right": rect.right, "bottom": rect.bottom
        }
    monitor_rect = None
    try:
        monitor = user32.MonitorFromWindow(hwnd, 2)
        if monitor:
            info = MONITORINFO()
            info.cbSize = ctypes.sizeof(MONITORINFO)
            if user32.GetMonitorInfoW(monitor, ctypes.byref(info)):
                rc = info.rcMonitor
                monitor_rect = {
                    "left": rc.left, "top": rc.top, "right": rc.right, "bottom": rc.bottom
                }
    except Exception:
        monitor_rect = None
    style = 0
    try:
        style = user32.GetWindowLongW(hwnd, -16)
    except Exception:
        style = 0
    dpi = int(get_dpi_for_window(hwnd)) if get_dpi_for_window else 0
    process_name = ""
    pid = wintypes.DWORD()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    if pid.value:
        kernel32 = ctypes.windll.kernel32
        kernel32.OpenProcess.restype = wintypes.HANDLE
        process_handle = kernel32.OpenProcess(0x1000, False, pid.value)
        if process_handle:
            image_size = wintypes.DWORD(32768)
            image_buffer = ctypes.create_unicode_buffer(image_size.value)
            kernel32.QueryFullProcessImageNameW.argtypes = [
                wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)
            ]
            kernel32.QueryFullProcessImageNameW.restype = wintypes.BOOL
            if kernel32.QueryFullProcessImageNameW(process_handle, 0, image_buffer, ctypes.byref(image_size)):
                process_name = image_buffer.value.rsplit("\\", 1)[-1].rsplit("/", 1)[-1]
            kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
            kernel32.CloseHandle(process_handle)
    candidates.append({
        "title": title,
        "processName": process_name,
        "foreground": hwnd == foreground,
        "minimized": bool(user32.IsIconic(hwnd)),
        "area": area,
        "dpi": dpi,
        "style": int(style),
        "windowRect": window_rect,
        "monitorRect": monitor_rect,
        "notificationState": int(notification_state)
    })
    return True

user32.EnumWindows(visit, 0)
print(json.dumps(candidates, ensure_ascii=False))
`

export async function detectGameDpi({
  pythonPath,
  platform = process.platform,
  gameWindowTitles = GAME_WINDOW_TITLE_PARTS,
  gameWindowProcessNames = DEFAULT_GAME_WINDOW_PROCESS_NAMES
} = {}) {
  if (platform !== 'win32') {
    return { found: false, error: '自动识别游戏 DPI 仅支持 Windows' }
  }
  if (!pythonPath) {
    return { found: false, error: '未找到 Python 3，无法识别游戏窗口 DPI' }
  }

  try {
    const { stdout } = await execFileAsync(pythonPath, ['-c', WINDOWS_DPI_PROBE], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 5000,
      maxBuffer: 1024 * 1024,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    })
    const selected = selectGameWindowCandidate(
      JSON.parse(stdout.trim() || '[]'),
      gameWindowTitles,
      gameWindowProcessNames
    )
    const dpi = Number(selected?.dpi)
    if (!selected) return { found: false, error: '未找到匹配的游戏窗口' }
    if (!Number.isFinite(dpi) || dpi <= 0) return { found: false, windowTitle: selected.title, error: '无法读取游戏窗口 DPI' }
    const displayMode = classifyGameDisplayMode(selected)
    return {
      found: true,
      dpi,
      scaleFactor: Number((dpi / 96).toFixed(4)),
      windowTitle: selected.title,
      displayMode: displayMode.mode,
      displayModeSupported: displayMode.supported
    }
  } catch (error) {
    return { found: false, error: `识别游戏窗口 DPI 失败：${error.message}` }
  }
}
