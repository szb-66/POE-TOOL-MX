import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const CURRENT_ELEVATION_SCRIPT = [
  'import ctypes, sys',
  'from ctypes import wintypes',
  'k = ctypes.windll.kernel32',
  'a = ctypes.windll.advapi32',
  'k.GetCurrentProcess.restype = wintypes.HANDLE',
  'token = wintypes.HANDLE()',
  'if not a.OpenProcessToken(k.GetCurrentProcess(), 0x0008, ctypes.byref(token)): sys.exit(2)',
  'elevated = wintypes.DWORD()',
  'needed = wintypes.DWORD()',
  'ok = a.GetTokenInformation(token, 20, ctypes.byref(elevated), ctypes.sizeof(elevated), ctypes.byref(needed))',
  'k.CloseHandle(token)',
  'print("1" if (ok and elevated.value) else "0")'
].join('\n')

const TARGET_GAME_ELEVATION_SCRIPT = [
  'import ctypes, json, os, sys',
  'from ctypes import wintypes',
  'u = ctypes.windll.user32',
  'k = ctypes.windll.kernel32',
  'a = ctypes.windll.advapi32',
  'u.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]',
  'u.GetWindowThreadProcessId.restype = wintypes.DWORD',
  'k.OpenProcess.restype = wintypes.HANDLE',
  'k.QueryFullProcessImageNameW.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]',
  'k.QueryFullProcessImageNameW.restype = wintypes.BOOL',
  'k.CloseHandle.argtypes = [wintypes.HANDLE]',
  'DEFAULT_TITLES = ("流放之路", "Path of Exile")',
  'DEFAULT_PROCESS_NAMES = ("pathofexile.exe", "pathofexile_x64.exe", "pathofexilesteam.exe", "pathofexile_x64steam.exe", "pathofexileegs.exe", "pathofexile_x64egs.exe")',
  'p = os.environ.get("POE_GAME_WINDOW_TITLES_FILE", "")',
  'titles, process_names = DEFAULT_TITLES, DEFAULT_PROCESS_NAMES',
  'if p:',
  ' try:',
  '  data = json.load(open(p, "r", encoding="utf-8"))',
  '  tv = data.get("titles") if isinstance(data, dict) else data',
  '  pv = data.get("processNames") if isinstance(data, dict) else None',
  '  if isinstance(tv, list) and tv: titles = tuple(str(v).strip() for v in tv if str(v).strip())',
  '  if isinstance(pv, list) and pv: process_names = tuple(os.path.basename(str(v).strip()).casefold() for v in pv if str(v).strip())',
  ' except Exception: pass',
  'def is_elevated(pid):',
  ' hproc = k.OpenProcess(0x1000, False, pid)',
  ' if not hproc: return None',
  ' token = wintypes.HANDLE()',
  ' try:',
  '  if not a.OpenProcessToken(hproc, 0x0008, ctypes.byref(token)):',
  '   return True if ctypes.get_last_error() == 5 else None',
  '  elevated = wintypes.DWORD()',
  '  needed = wintypes.DWORD()',
  '  ok = a.GetTokenInformation(token, 20, ctypes.byref(elevated), ctypes.sizeof(elevated), ctypes.byref(needed))',
  '  return bool(elevated.value) if ok else None',
  ' finally:',
  '  if token: k.CloseHandle(token)',
  '  k.CloseHandle(hproc)',
  'found = []',
  'cb = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)',
  'def visit(hwnd, _):',
  ' if not u.IsWindowVisible(hwnd): return True',
  ' length = u.GetWindowTextLengthW(hwnd)',
  ' buf = ctypes.create_unicode_buffer(length + 1)',
  ' u.GetWindowTextW(hwnd, buf, length + 1)',
  ' tf = buf.value.casefold()',
  ' if not any(t.casefold() in tf for t in titles if t): return True',
  ' pid = wintypes.DWORD()',
  ' u.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))',
  ' if not pid.value: return True',
  ' hproc = k.OpenProcess(0x1000, False, pid.value)',
  ' if not hproc: return True',
  ' pname = ""',
  ' try:',
  '  size = wintypes.DWORD(32768)',
  '  pbuf = ctypes.create_unicode_buffer(size.value)',
  '  if k.QueryFullProcessImageNameW(hproc, 0, pbuf, ctypes.byref(size)):',
  '   pname = os.path.basename(pbuf.value).casefold()',
  ' finally:',
  '  k.CloseHandle(hproc)',
  ' if pname in process_names: found.append(is_elevated(pid.value))',
  ' return True',
  'u.EnumWindows(cb(visit), 0)',
  'if not found: print("unknown")',
  'elif any(v is True or v is None for v in found): print("elevated")',
  'else: print("standard")'
].join('\n')

/**
 * 探测当前 Electron 进程是否已处于管理员权限。
 * 非 Windows 返回 false；探测失败返回 null。
 */
export async function probeCurrentProcessElevated({
  platform = process.platform,
  pythonPath = '',
  execFileImpl = execFileAsync
} = {}) {
  if (platform !== 'win32') return false
  if (!pythonPath) return null
  try {
    const { stdout } = await execFileImpl(pythonPath, ['-c', CURRENT_ELEVATION_SCRIPT], {
      windowsHide: true,
      timeout: 3000,
      encoding: 'utf8'
    })
    const trimmed = String(stdout || '').trim()
    if (trimmed === '1') return true
    if (trimmed === '0') return false
    return null
  } catch {
    return null
  }
}

/**
 * 探测目标游戏进程权限：
 * - 返回 'standard'：明确确认游戏以普通权限运行（免 UAC）
 * - 返回 'elevated'：游戏以管理员权限运行（需提权 Host）
 * - 返回 'unknown'：未找到游戏或无法确认（按安全策略视作需提权）
 */
export async function probeTargetGameElevation({
  platform = process.platform,
  pythonPath = '',
  env = process.env,
  execFileImpl = execFileAsync
} = {}) {
  if (platform !== 'win32') return 'standard'
  if (!pythonPath) return 'unknown'
  try {
    const { stdout } = await execFileImpl(pythonPath, ['-c', TARGET_GAME_ELEVATION_SCRIPT], {
      windowsHide: true,
      timeout: 3000,
      encoding: 'utf8',
      env
    })
    const value = String(stdout || '').trim()
    if (value === 'standard' || value === 'elevated' || value === 'unknown') return value
    return 'unknown'
  } catch {
    return 'unknown'
  }
}
