/**
 * 文件职责：统一激活可信游戏窗口并恢复助手主窗口。
 * 主要入口：activateWindowsGameWindow、WindowActivationService.activateGame/activateMain。
 * 关键依赖：Windows Win32 API、受控 Python 子进程、游戏标题/进程白名单与 Electron BrowserWindow。
 * 边界：不向 renderer 暴露窗口句柄；非 Windows 平台安全跳过游戏激活。
 */

import { execFile } from 'node:child_process'
import path from 'node:path'
import { selectGameWindowCandidate } from '../system/gameDpi.js'
import { restoreWindowToForeground, restoreWindowsNativeWindowFocus } from './foregroundRestore.js'

const WINDOWS_GAME_ACTIVATION_TIMEOUT_MS = 4000

export const WINDOW_ACTIVATION_CODES = Object.freeze({
  GAME_ACTIVATED: 'game-activated',
  MAIN_ACTIVATED: 'main-activated',
  PLATFORM_SKIPPED: 'platform-skipped',
  GAME_NOT_FOUND: 'game-not-found',
  PYTHON_UNAVAILABLE: 'python-unavailable',
  PRIVILEGE_MISMATCH: 'privilege-mismatch',
  FOCUS_REFUSED: 'focus-refused',
  TARGET_CHANGED: 'target-changed',
  MAIN_UNAVAILABLE: 'main-unavailable',
  ACTIVATION_ERROR: 'activation-error'
})

const WINDOWS_EXIT_CODE_MAP = Object.freeze({
  23: WINDOW_ACTIVATION_CODES.GAME_NOT_FOUND,
  24: WINDOW_ACTIVATION_CODES.PRIVILEGE_MISMATCH,
  25: WINDOW_ACTIVATION_CODES.FOCUS_REFUSED,
  26: WINDOW_ACTIVATION_CODES.TARGET_CHANGED
})

const GAME_FAILURE_MESSAGES = Object.freeze({
  [WINDOW_ACTIVATION_CODES.GAME_NOT_FOUND]: '未找到同时匹配窗口名称和客户端进程的游戏窗口',
  [WINDOW_ACTIVATION_CODES.PYTHON_UNAVAILABLE]: '本机自动化运行环境不可用，无法激活游戏窗口',
  [WINDOW_ACTIVATION_CODES.PRIVILEGE_MISMATCH]: '游戏权限高于助手，请以相同权限运行开发版助手',
  [WINDOW_ACTIVATION_CODES.FOCUS_REFUSED]: '系统拒绝将游戏窗口切换到前台',
  [WINDOW_ACTIVATION_CODES.TARGET_CHANGED]: '游戏窗口在激活过程中已关闭或身份发生变化',
  [WINDOW_ACTIVATION_CODES.ACTIVATION_ERROR]: '游戏窗口激活过程发生异常'
})

// Purpose: 将稳定激活原因码转为用户可读中文；未知码保留受限原因值。
export function gameActivationFailureMessage(code) {
  return GAME_FAILURE_MESSAGES[code] || `无法激活游戏窗口（${code || 'unknown'}）`
}

// Purpose: 从候选窗口中选出同时匹配标题与进程白名单的目标；无匹配时返回 null。
export function selectTrustedGameWindow(candidates, titles, processNames) {
  return selectGameWindowCandidate(candidates, titles, processNames)
}

function limitedTarget(target) {
  if (!target || typeof target !== 'object') return undefined
  const title = String(target.title || '').slice(0, 80)
  const processName = path.win32.basename(String(target.processName || '')).slice(0, 80)
  return title && processName ? { title, processName } : undefined
}

// Purpose: 构建固定的 Win32 激活脚本；输出受控 JSON，以专用退出码表示失败边界。
function windowsGameActivationScript() {
  return String.raw`
import ctypes, json, os, sys, time
from ctypes import wintypes
u = ctypes.windll.user32
k = ctypes.windll.kernel32
titles = tuple(str(v).strip() for v in json.loads(sys.argv[1]) if str(v).strip())
process_names = tuple(os.path.basename(str(v).strip()).casefold() for v in json.loads(sys.argv[2]) if str(v).strip())
u.GetForegroundWindow.restype = wintypes.HWND
u.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
u.GetWindowThreadProcessId.restype = wintypes.DWORD
k.OpenProcess.restype = wintypes.HANDLE
k.QueryFullProcessImageNameW.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]
k.QueryFullProcessImageNameW.restype = wintypes.BOOL
k.CloseHandle.argtypes = [wintypes.HANDLE]

def identity(hwnd):
    if not hwnd or not u.IsWindow(hwnd): return ("", "", 0)
    length = u.GetWindowTextLengthW(hwnd)
    title_buffer = ctypes.create_unicode_buffer(length + 1)
    u.GetWindowTextW(hwnd, title_buffer, length + 1)
    pid = wintypes.DWORD()
    u.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    process_name = ""
    handle = k.OpenProcess(0x1000, False, pid.value) if pid.value else None
    if handle:
        try:
            size = wintypes.DWORD(32768)
            process_buffer = ctypes.create_unicode_buffer(size.value)
            if k.QueryFullProcessImageNameW(handle, 0, process_buffer, ctypes.byref(size)):
                process_name = os.path.basename(process_buffer.value)
        finally:
            k.CloseHandle(handle)
    return (title_buffer.value, process_name, pid.value)

def title_priority(title):
    folded = title.casefold()
    for index, value in enumerate(titles):
        if value.casefold() in folded: return index
    return len(titles)

foreground = u.GetForegroundWindow()
candidates = []
callback_type = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
def visit(hwnd, _lparam):
    if not u.IsWindowVisible(hwnd): return True
    title, process_name, pid = identity(hwnd)
    if title_priority(title) >= len(titles) or process_name.casefold() not in process_names: return True
    rect = wintypes.RECT()
    area = 0
    if u.GetWindowRect(hwnd, ctypes.byref(rect)):
        area = max(0, rect.right - rect.left) * max(0, rect.bottom - rect.top)
    candidates.append((title_priority(title), bool(u.IsIconic(hwnd)), hwnd != foreground, -area, int(hwnd), title, process_name, pid))
    return True
u.EnumWindows(callback_type(visit), 0)
if not candidates: sys.exit(23)
candidates.sort(key=lambda item: item[:5])
_, _, _, _, hwnd_value, selected_title, selected_process, selected_pid = candidates[0]
hwnd = wintypes.HWND(hwnd_value)

TokenElevation = 20
def is_elevated(pid):
    process = k.OpenProcess(0x1000, False, pid)
    if not process: return None
    token = wintypes.HANDLE()
    try:
        if not ctypes.windll.advapi32.OpenProcessToken(process, 0x0008, ctypes.byref(token)): return None
        elevated = wintypes.DWORD()
        needed = wintypes.DWORD()
        ok = ctypes.windll.advapi32.GetTokenInformation(token, TokenElevation, ctypes.byref(elevated), ctypes.sizeof(elevated), ctypes.byref(needed))
        return bool(elevated.value) if ok else None
    finally:
        if token: k.CloseHandle(token)
        k.CloseHandle(process)
if is_elevated(selected_pid) is True and is_elevated(os.getpid()) is False: sys.exit(24)

current_thread = k.GetCurrentThreadId()
foreground_thread = u.GetWindowThreadProcessId(foreground, None) if foreground else 0
target_thread = u.GetWindowThreadProcessId(hwnd, None)
attached_foreground = bool(foreground_thread and foreground_thread != current_thread and u.AttachThreadInput(current_thread, foreground_thread, True))
attached_target = bool(target_thread and target_thread != current_thread and target_thread != foreground_thread and u.AttachThreadInput(current_thread, target_thread, True))
try:
    if u.IsIconic(hwnd): u.ShowWindow(hwnd, 9)
    u.BringWindowToTop(hwnd)
    u.SetForegroundWindow(hwnd)
    u.SetFocus(hwnd)
finally:
    if attached_target: u.AttachThreadInput(current_thread, target_thread, False)
    if attached_foreground: u.AttachThreadInput(current_thread, foreground_thread, False)
deadline = time.monotonic() + 2.0
while time.monotonic() < deadline and u.GetForegroundWindow() != hwnd_value: time.sleep(0.05)
if u.GetForegroundWindow() != hwnd_value: sys.exit(25)
actual_title, actual_process, _ = identity(hwnd)
if actual_title != selected_title or actual_process.casefold() != selected_process.casefold(): sys.exit(26)
print(json.dumps({"title": actual_title, "processName": actual_process}, ensure_ascii=False))
`.trim()
}

/**
 * Purpose: 在受控 Python 子进程中枚举并激活 Windows 游戏窗口。
 * Inputs: Python 路径、标题/进程白名单，可注入 execFile 供测试。
 * Outputs: 始终 resolve 结构化结果；不抛出子进程错误。
 * Edge cases: Python 缺失、权限不匹配、目标变化、超时均失败关闭。
 */
export function activateWindowsGameWindow({
  pythonPath,
  titles,
  processNames,
  execFileImpl = execFile
} = {}) {
  if (!pythonPath || typeof execFileImpl !== 'function') {
    return Promise.resolve({ success: false, code: WINDOW_ACTIVATION_CODES.PYTHON_UNAVAILABLE })
  }
  return new Promise(resolve => {
    const finish = (result) => resolve(result)
    try {
      execFileImpl(
        pythonPath,
        ['-c', windowsGameActivationScript(), JSON.stringify(titles || []), JSON.stringify(processNames || [])],
        { windowsHide: true, timeout: WINDOWS_GAME_ACTIVATION_TIMEOUT_MS, encoding: 'utf8' },
        (error, stdout = '') => {
          if (error) {
            return finish({
              success: false,
              code: WINDOWS_EXIT_CODE_MAP[Number(error.code)] || WINDOW_ACTIVATION_CODES.ACTIVATION_ERROR
            })
          }
          let target
          try { target = JSON.parse(String(stdout).trim() || '{}') } catch {}
          finish({ success: true, code: WINDOW_ACTIVATION_CODES.GAME_ACTIVATED, target })
        }
      )
    } catch {
      finish({ success: false, code: WINDOW_ACTIVATION_CODES.ACTIVATION_ERROR })
    }
  })
}

/**
 * Purpose: 为主进程业务提供唯一的游戏/助手窗口激活入口。
 * Preconditions: gameWindowRegistry 已初始化；主窗口恢复时 getMainWindow 可用。
 */
export class WindowActivationService {
  constructor({
    gameWindowRegistry,
    getMainWindow = () => null,
    pythonPathProvider = () => '',
    platform = process.platform,
    execFileImpl = execFile,
    activateWindowsGame = activateWindowsGameWindow,
    restoreMainWindow = restoreWindowToForeground,
    restoreWindowsMain = restoreWindowsNativeWindowFocus
  } = {}) {
    this.gameWindowRegistry = gameWindowRegistry
    this.getMainWindow = getMainWindow
    this.pythonPathProvider = pythonPathProvider
    this.platform = platform
    this.execFileImpl = execFileImpl
    this.activateWindowsGame = activateWindowsGame
    this.restoreMainWindow = restoreMainWindow
    this.restoreWindowsMain = restoreWindowsMain
  }

  // Outputs: Windows 返回受控成败码与可选目标摘要；非 Windows 返回安全跳过。
  async activateGame({ source = 'unknown' } = {}) {
    void source
    if (this.platform !== 'win32') {
      return { success: true, code: WINDOW_ACTIVATION_CODES.PLATFORM_SKIPPED }
    }
    const result = await this.activateWindowsGame({
      pythonPath: this.pythonPathProvider(),
      titles: this.gameWindowRegistry?.getTitles?.() || [],
      processNames: this.gameWindowRegistry?.getProcessNames?.() || [],
      execFileImpl: this.execFileImpl
    })
    const response = { success: Boolean(result?.success), code: result?.code || WINDOW_ACTIVATION_CODES.ACTIVATION_ERROR }
    const target = limitedTarget(result?.target)
    if (target) response.target = target
    return response
  }

  gameFailureMessage(code) {
    return gameActivationFailureMessage(code)
  }

  // Outputs: 恢复主窗口的结构化结果；窗口不可用或两次聚焦失败时关闭返回失败。
  async activateMain({ source = 'unknown' } = {}) {
    void source
    const window = this.getMainWindow()
    if (!window || window.isDestroyed?.()) {
      return { success: false, code: WINDOW_ACTIVATION_CODES.MAIN_UNAVAILABLE }
    }
    const success = await this.restoreMainWindow(window, {
      nativeFocusFn: this.platform === 'win32'
        ? target => this.restoreWindowsMain(target, {
            platform: this.platform,
            pythonPath: this.pythonPathProvider(),
            execFileImpl: this.execFileImpl
          })
        : null
    })
    return {
      success: Boolean(success),
      code: success ? WINDOW_ACTIVATION_CODES.MAIN_ACTIVATED : WINDOW_ACTIVATION_CODES.FOCUS_REFUSED
    }
  }
}
