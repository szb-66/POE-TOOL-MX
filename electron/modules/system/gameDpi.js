import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import {
  DEFAULT_GAME_WINDOW_TITLES,
  gameWindowTitlePriority,
  isGameWindowTitle as matchesGameWindowTitle
} from '../../../shared/gameWindowTitles.js'

const execFileAsync = promisify(execFile)

export const GAME_WINDOW_TITLE_PARTS = DEFAULT_GAME_WINDOW_TITLES

export function isGameWindowTitle(title, configuredTitles = GAME_WINDOW_TITLE_PARTS) {
  return matchesGameWindowTitle(title, configuredTitles)
}

export function selectGameWindowCandidate(candidates = [], configuredTitles = GAME_WINDOW_TITLE_PARTS) {
  const valid = candidates
    .filter((candidate) => candidate && isGameWindowTitle(candidate.title, configuredTitles))
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
    if user32.GetWindowRect(hwnd, ctypes.byref(rect)):
        area = max(0, rect.right - rect.left) * max(0, rect.bottom - rect.top)
    dpi = int(get_dpi_for_window(hwnd)) if get_dpi_for_window else 0
    candidates.append({
        "title": title,
        "foreground": hwnd == foreground,
        "minimized": bool(user32.IsIconic(hwnd)),
        "area": area,
        "dpi": dpi
    })
    return True

user32.EnumWindows(visit, 0)
print(json.dumps(candidates, ensure_ascii=False))
`

export async function detectGameDpi({
  pythonPath,
  platform = process.platform,
  gameWindowTitles = GAME_WINDOW_TITLE_PARTS
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
    const selected = selectGameWindowCandidate(JSON.parse(stdout.trim() || '[]'), gameWindowTitles)
    const dpi = Number(selected?.dpi)
    if (!selected) return { found: false, error: '未找到匹配的游戏窗口' }
    if (!Number.isFinite(dpi) || dpi <= 0) return { found: false, windowTitle: selected.title, error: '无法读取游戏窗口 DPI' }
    return {
      found: true,
      dpi,
      scaleFactor: Number((dpi / 96).toFixed(4)),
      windowTitle: selected.title
    }
  } catch (error) {
    return { found: false, error: `识别游戏窗口 DPI 失败：${error.message}` }
  }
}
