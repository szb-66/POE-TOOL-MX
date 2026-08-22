import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { CHAOS_ERROR_CODES, ChaosRecipeError } from '../chaosRecipe/errors.js'

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

function gameForegroundGuardLines() {
  return [
    'import ctypes, json, os, sys, time',
    'from ctypes import wintypes',
    'u = ctypes.windll.user32',
    'h = u.GetForegroundWindow()',
    'n = u.GetWindowTextLengthW(h)',
    'b = ctypes.create_unicode_buffer(n + 1)',
    'u.GetWindowTextW(h, b, n + 1)',
    'titles = ("流放之路", "Path of Exile")',
    'process_names = ("PathOfExile.exe", "PathOfExile_x64.exe", "PathOfExileSteam.exe", "PathOfExile_x64Steam.exe", "PathOfExileEGS.exe", "PathOfExile_x64EGS.exe")',
    'p = os.environ.get("POE_GAME_WINDOW_TITLES_FILE", "")',
    'try:',
    ' data = json.load(open(p, "r", encoding="utf-8")) if p else {}',
    ' values = data.get("titles") if isinstance(data, dict) else data',
    ' titles = tuple(str(v).strip() for v in values) if isinstance(values, list) and values else titles',
    ' pvalues = data.get("processNames") if isinstance(data, dict) else None',
    ' process_names = tuple(str(v).strip().rsplit("\\\\", 1)[-1].rsplit("/", 1)[-1] for v in pvalues) if isinstance(pvalues, list) and pvalues else process_names',
    'except Exception: pass',
    'u.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]',
    'u.GetWindowThreadProcessId.restype = wintypes.DWORD',
    'pid = wintypes.DWORD()',
    'u.GetWindowThreadProcessId(h, ctypes.byref(pid))',
    'proc_name = ""',
    'if pid.value:',
    ' k = ctypes.windll.kernel32',
    ' k.OpenProcess.restype = wintypes.HANDLE',
    ' hproc = k.OpenProcess(0x1000, False, pid.value)',
    ' if hproc:',
    '  size = wintypes.DWORD(32768)',
    '  buf = ctypes.create_unicode_buffer(size.value)',
    '  k.QueryFullProcessImageNameW.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]',
    '  k.QueryFullProcessImageNameW.restype = wintypes.BOOL',
    '  if k.QueryFullProcessImageNameW(hproc, 0, buf, ctypes.byref(size)):',
    '   proc_name = os.path.basename(buf.value).casefold()',
    '  k.CloseHandle.argtypes = [wintypes.HANDLE]',
    '  k.CloseHandle(hproc)',
    'ok = any(t.casefold() in b.value.casefold() for t in titles if t) and proc_name in tuple(n.casefold() for n in process_names)',
    'sys.exit(23) if not ok else None',
    'TokenElevation = 20',
    'def is_elevated(process_id):',
    ' hproc = k.OpenProcess(0x1000, False, process_id)',
    ' if not hproc: return None',
    ' token = wintypes.HANDLE()',
    ' a = ctypes.windll.advapi32',
    ' if not a.OpenProcessToken(hproc, 0x0008, ctypes.byref(token)):',
    '  k.CloseHandle(hproc); return None',
    ' elevated = wintypes.DWORD()',
    ' needed = wintypes.DWORD()',
    ' ok = a.GetTokenInformation(token, TokenElevation, ctypes.byref(elevated), ctypes.sizeof(elevated), ctypes.byref(needed))',
    ' k.CloseHandle(token); k.CloseHandle(hproc)',
    ' return bool(elevated.value) if ok else None',
    'target_elevated = is_elevated(pid.value)',
    'current_elevated = is_elevated(os.getpid())',
    'sys.exit(24) if target_elevated is True and current_elevated is False else None'
  ]
}

function gameFocusLines() {
  return [
    'import ctypes, json, os, sys, time',
    'from ctypes import wintypes',
    'u = ctypes.windll.user32',
    'k = ctypes.windll.kernel32',
    'titles = ("流放之路", "Path of Exile")',
    'process_names = ("PathOfExile.exe", "PathOfExile_x64.exe", "PathOfExileSteam.exe", "PathOfExile_x64Steam.exe", "PathOfExileEGS.exe", "PathOfExile_x64EGS.exe")',
    'p = os.environ.get("POE_GAME_WINDOW_TITLES_FILE", "")',
    'try:',
    ' data = json.load(open(p, "r", encoding="utf-8")) if p else {}',
    ' values = data.get("titles") if isinstance(data, dict) else data',
    ' titles = tuple(str(v).strip() for v in values) if isinstance(values, list) and values else titles',
    ' pvalues = data.get("processNames") if isinstance(data, dict) else None',
    ' process_names = tuple(str(v).strip().rsplit("\\\\", 1)[-1].rsplit("/", 1)[-1] for v in pvalues) if isinstance(pvalues, list) and pvalues else process_names',
    'except Exception: pass',
    'u.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]',
    'u.GetWindowThreadProcessId.restype = wintypes.DWORD',
    'k.OpenProcess.restype = wintypes.HANDLE',
    'k.QueryFullProcessImageNameW.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]',
    'k.QueryFullProcessImageNameW.restype = wintypes.BOOL',
    'k.CloseHandle.argtypes = [wintypes.HANDLE]',
    'def process_name_for_window(hwnd):',
    ' pid = wintypes.DWORD()',
    ' u.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))',
    ' if not pid.value: return ""',
    ' hproc = k.OpenProcess(0x1000, False, pid.value)',
    ' if not hproc: return ""',
    ' try:',
    '  size = wintypes.DWORD(32768)',
    '  buf = ctypes.create_unicode_buffer(size.value)',
    '  return os.path.basename(buf.value).casefold() if k.QueryFullProcessImageNameW(hproc, 0, buf, ctypes.byref(size)) else ""',
    ' finally:',
    '  k.CloseHandle(hproc)',
    'def window_matches_game(hwnd):',
    ' if not hwnd: return False',
    ' length = u.GetWindowTextLengthW(hwnd)',
    ' title = ctypes.create_unicode_buffer(length + 1)',
    ' u.GetWindowTextW(hwnd, title, length + 1)',
    ' title_ok = any(value.casefold() in title.value.casefold() for value in titles if value)',
    ' return title_ok and process_name_for_window(hwnd) in tuple(value.casefold() for value in process_names)',
    'matches = []',
    'callback_type = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)',
    'def visit(hwnd, _lparam):',
    ' if u.IsWindowVisible(hwnd) and window_matches_game(hwnd): matches.append(hwnd)',
    ' return True',
    'u.EnumWindows(callback_type(visit), 0)',
    'sys.exit(23) if not matches else None',
    'hwnd = matches[0]',
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
    'while time.monotonic() < deadline and u.GetForegroundWindow() != hwnd:',
    ' time.sleep(0.05)',
    'sys.exit(0 if u.GetForegroundWindow() == hwnd and window_matches_game(hwnd) else 25)'
  ]
}

function runWindowsInputScript(pythonPath, lines) {
  if (process.platform !== 'win32' || !pythonPath) {
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '当前环境无法向游戏发送复制按键')
  }
  return new Promise((resolve, reject) => {
    execFile(pythonPath, ['-c', lines.join('\n')], { windowsHide: true, timeout: 3000 }, (error) => {
      if (!error) return resolve()
      if (Number(error.code) === 23) {
        return reject(new ChaosRecipeError(CHAOS_ERROR_CODES.GAME_NOT_FOREGROUND, '游戏窗口当前不在前台'))
      }
      if (Number(error.code) === 24) {
        return reject(new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '游戏以管理员权限运行，请同样以管理员权限运行流放助手'))
      }
      reject(new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, `无法向游戏发送复制按键：${error.message}`))
    })
  })
}

export async function assertWindowsGameForeground(pythonPath) {
  return runWindowsInputScript(pythonPath, gameForegroundGuardLines())
}

export async function sendWindowsCopy(pythonPath) {
  const script = [
    ...gameForegroundGuardLines(),
    'u.keybd_event(0x11, 0, 0, 0)',
    'u.keybd_event(0x43, 0, 0, 0)',
    'time.sleep(0.02)',
    'u.keybd_event(0x43, 0, 2, 0)',
    'u.keybd_event(0x11, 0, 2, 0)'
  ]
  await runWindowsInputScript(pythonPath, script)
}

export async function restoreWindowsGameFocus(
  pythonPath,
  { platform = process.platform, execFileImpl = execFile } = {}
) {
  if (platform !== 'win32' || !pythonPath || typeof execFileImpl !== 'function') return false
  return new Promise((resolve) => {
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      resolve(value)
    }
    try {
      execFileImpl(
        pythonPath,
        ['-c', gameFocusLines().join('\n')],
        { windowsHide: true, timeout: 3000 },
        (error) => finish(!error)
      )
    } catch {
      finish(false)
    }
  })
}

export async function captureFreshClipboardText({
  clipboard,
  sendCopy,
  timeoutMs = 800,
  pollMs = 25,
  releaseDelayMs = 60
}) {
  const previous = clipboard.readText()
  const sentinel = `__poe_price_check_${randomUUID()}__`
  clipboard.writeText(sentinel)
  try {
    await wait(releaseDelayMs)
    await sendCopy()
    const deadline = Date.now() + timeoutMs
    do {
      const current = clipboard.readText()
      if (current && current !== sentinel) return current
      await wait(pollMs)
    } while (Date.now() < deadline)
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '没有从游戏捕获到物品，请确认鼠标正悬停在物品上')
  } catch (error) {
    if (clipboard.readText() === sentinel) clipboard.writeText(previous)
    throw error
  }
}

export async function capturePoeItemText(options) {
  await options.assertForeground?.()
  return captureFreshClipboardText({
    ...options,
    sendCopy: () => options.sendCopy()
  })
}
