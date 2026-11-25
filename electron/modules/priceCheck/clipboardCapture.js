import { execFile, spawn } from 'node:child_process'
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

function mapGuardExitCode(code, message = '') {
  if (Number(code) === 23) {
    return new ChaosRecipeError(CHAOS_ERROR_CODES.GAME_NOT_FOREGROUND, '游戏窗口当前不在前台')
  }
  if (Number(code) === 24) {
    return new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '游戏以管理员权限运行，请同样以管理员权限运行流放助手')
  }
  return new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, `无法向游戏发送复制按键：${message || code || 'unknown'}`)
}

function runWindowsInputScript(pythonPath, lines) {
  if (process.platform !== 'win32' || !pythonPath) {
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '当前环境无法向游戏发送复制按键')
  }
  return new Promise((resolve, reject) => {
    execFile(pythonPath, ['-c', lines.join('\n')], { windowsHide: true, timeout: 3000 }, (error) => {
      if (!error) return resolve()
      reject(mapGuardExitCode(error.code, error.message))
    })
  })
}

function buildOneShotWindowsCopyScript() {
  return [
    ...gameForegroundGuardLines(),
    'u.keybd_event(0x11, 0, 0, 0)',
    'u.keybd_event(0x43, 0, 0, 0)',
    'time.sleep(0.02)',
    'u.keybd_event(0x43, 0, 2, 0)',
    'u.keybd_event(0x11, 0, 2, 0)'
  ]
}

function residentWindowsInputScript() {
  return [
    'import ctypes, json, os, sys, time',
    'from ctypes import wintypes',
    'u = ctypes.windll.user32',
    'k = ctypes.windll.kernel32',
    'a = ctypes.windll.advapi32',
    'u.GetForegroundWindow.restype = wintypes.HWND',
    'u.GetWindowTextLengthW.argtypes = [wintypes.HWND]',
    'u.GetWindowTextLengthW.restype = ctypes.c_int',
    'u.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]',
    'u.GetWindowTextW.restype = ctypes.c_int',
    'u.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]',
    'u.GetWindowThreadProcessId.restype = wintypes.DWORD',
    'u.GetAsyncKeyState.argtypes = [ctypes.c_int]',
    'u.GetAsyncKeyState.restype = ctypes.c_short',
    'k.OpenProcess.restype = wintypes.HANDLE',
    'k.QueryFullProcessImageNameW.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]',
    'k.QueryFullProcessImageNameW.restype = wintypes.BOOL',
    'k.CloseHandle.argtypes = [wintypes.HANDLE]',
    'DEFAULT_TITLES = ("流放之路", "Path of Exile")',
    'DEFAULT_PROCESS_NAMES = ("pathofexile.exe", "pathofexile_x64.exe", "pathofexilesteam.exe", "pathofexile_x64steam.exe", "pathofexileegs.exe", "pathofexile_x64egs.exe")',
    'cache_key = None',
    'cached_titles = DEFAULT_TITLES',
    'cached_process_names = DEFAULT_PROCESS_NAMES',
    'TokenElevation = 20',
    'def load_targets():',
    ' global cache_key, cached_titles, cached_process_names',
    ' p = os.environ.get("POE_GAME_WINDOW_TITLES_FILE", "")',
    ' if not p: return DEFAULT_TITLES, DEFAULT_PROCESS_NAMES',
    ' try:',
    '  mtime_ns = os.stat(p).st_mtime_ns',
    '  key = (p, mtime_ns)',
    '  if key != cache_key:',
    '   with open(p, "r", encoding="utf-8") as stream:',
    '    data = json.load(stream)',
    '   values = data.get("titles") if isinstance(data, dict) else data',
    '   titles = tuple(str(v).strip() for v in values if str(v).strip()) if isinstance(values, list) else ()',
    '   pvalues = data.get("processNames") if isinstance(data, dict) else None',
    '   pnames = tuple(str(v).strip().rsplit("\\\\", 1)[-1].rsplit("/", 1)[-1].casefold() for v in pvalues if str(v).strip()) if isinstance(pvalues, list) else ()',
    '   cached_titles = titles or DEFAULT_TITLES',
    '   cached_process_names = pnames or DEFAULT_PROCESS_NAMES',
    '   cache_key = key',
    '  return cached_titles, cached_process_names',
    ' except Exception:',
    '  return DEFAULT_TITLES, DEFAULT_PROCESS_NAMES',
    'def is_elevated(process_id):',
    ' if not process_id: return None',
    ' hproc = k.OpenProcess(0x1000, False, process_id)',
    ' if not hproc: return None',
    ' token = wintypes.HANDLE()',
    ' try:',
    '  if not a.OpenProcessToken(hproc, 0x0008, ctypes.byref(token)): return None',
    '  elevated = wintypes.DWORD()',
    '  needed = wintypes.DWORD()',
    '  ok = a.GetTokenInformation(token, TokenElevation, ctypes.byref(elevated), ctypes.sizeof(elevated), ctypes.byref(needed))',
    '  return bool(elevated.value) if ok else None',
    ' finally:',
    '  if token: k.CloseHandle(token)',
    '  k.CloseHandle(hproc)',
    'current_elevated = is_elevated(os.getpid())',
    'def check_foreground():',
    ' h = u.GetForegroundWindow()',
    ' if not h: return 23',
    ' n = u.GetWindowTextLengthW(h)',
    ' b = ctypes.create_unicode_buffer(n + 1)',
    ' u.GetWindowTextW(h, b, n + 1)',
    ' titles, process_names = load_targets()',
    ' title_folded = b.value.casefold()',
    ' if not any(t.casefold() in title_folded for t in titles if t): return 23',
    ' pid = wintypes.DWORD()',
    ' u.GetWindowThreadProcessId(h, ctypes.byref(pid))',
    ' proc_name = ""',
    ' if pid.value:',
    '  hproc = k.OpenProcess(0x1000, False, pid.value)',
    '  if hproc:',
    '   try:',
    '    size = wintypes.DWORD(32768)',
    '    buf = ctypes.create_unicode_buffer(size.value)',
    '    if k.QueryFullProcessImageNameW(hproc, 0, buf, ctypes.byref(size)):',
    '     proc_name = os.path.basename(buf.value).casefold()',
    '   finally:',
    '    k.CloseHandle(hproc)',
    ' if proc_name not in process_names: return 23',
    ' if is_elevated(pid.value) is True and current_elevated is False: return 24',
    ' return 0',
    'def release_conflicting_modifiers():',
    ' for vk in (0xA0, 0xA1, 0x10, 0xA4, 0xA5, 0x12, 0x5B, 0x5C):',
    '  if u.GetAsyncKeyState(vk) & 0x8000:',
    '   u.keybd_event(vk, 0, 2, 0)',
    'def send_copy():',
    ' code = check_foreground()',
    ' if code: return code',
    ' release_conflicting_modifiers()',
    ' u.keybd_event(0x11, 0, 0, 0)',
    ' u.keybd_event(0x43, 0, 0, 0)',
    ' time.sleep(0.01)',
    ' u.keybd_event(0x43, 0, 2, 0)',
    ' u.keybd_event(0x11, 0, 2, 0)',
    ' return 0',
    'for raw in sys.stdin:',
    ' raw = raw.strip()',
    ' if not raw: continue',
    ' try:',
    '  req = json.loads(raw)',
    ' except Exception:',
    '  continue',
    ' action = req.get("action")',
    ' if action == "quit": break',
    ' req_id = req.get("id")',
    ' try:',
    '  code = check_foreground() if action == "check" else (send_copy() if action == "copy" else 1)',
    '  reply = {"id": req_id, "ok": code == 0, "code": code}',
    ' except Exception as exc:',
    '  reply = {"id": req_id, "ok": False, "code": 1, "message": str(exc)}',
    ' sys.stdout.write(json.dumps(reply, ensure_ascii=False) + "\\n")',
    ' sys.stdout.flush()'
  ].join('\n')
}

export class WindowsClipboardInputHelper {
  constructor({ spawnImpl = spawn, platform = process.platform } = {}) {
    this.spawnImpl = spawnImpl
    this.platform = platform
    this.child = null
    this.pythonPath = ''
    this.buffer = ''
    this.nextId = 1
    this.pending = new Map()
  }

  isRunningFor(pythonPath) {
    return Boolean(this.child && !this.child.killed && this.pythonPath === pythonPath)
  }

  warm(pythonPath) {
    if (this.platform !== 'win32' || !pythonPath) return false
    if (this.isRunningFor(pythonPath)) return true
    this.dispose()
    try {
      const child = this.spawnImpl(pythonPath, ['-u', '-c', residentWindowsInputScript()], {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'ignore']
      })
      this.child = child
      this.pythonPath = pythonPath
      this.buffer = ''
      child.stdout?.on('data', (chunk) => this.handleStdout(chunk))
      const onStop = (reason) => {
        if (this.child === child) {
          this.child = null
          this.pythonPath = ''
          this.buffer = ''
        }
        this.rejectAll(reason instanceof Error ? reason : new Error('复制助手进程已退出'))
      }
      child.once('error', onStop)
      child.once('close', () => onStop())
      child.unref?.()
      return true
    } catch {
      this.child = null
      this.pythonPath = ''
      return false
    }
  }

  handleStdout(chunk) {
    this.buffer += String(chunk)
    const lines = this.buffer.split(/\r?\n/)
    this.buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.trim()) continue
      let message
      try {
        message = JSON.parse(line)
      } catch {
        continue
      }
      const entry = this.pending.get(message.id)
      if (!entry) continue
      this.pending.delete(message.id)
      clearTimeout(entry.timer)
      if (message.ok) entry.resolve()
      else entry.reject(mapGuardExitCode(message.code, message.message))
    }
  }

  rejectAll(error) {
    for (const entry of this.pending.values()) {
      clearTimeout(entry.timer)
      entry.reject(error)
    }
    this.pending.clear()
  }

  request(pythonPath, action, { timeoutMs = 2000 } = {}) {
    if (this.platform !== 'win32' || !pythonPath) {
      return Promise.reject(new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '当前环境无法向游戏发送复制按键'))
    }
    if (!this.isRunningFor(pythonPath) && !this.warm(pythonPath)) {
      return Promise.reject(new Error('无法启动常驻复制助手'))
    }
    const child = this.child
    if (!child?.stdin || child.stdin.destroyed) {
      this.dispose()
      return Promise.reject(new Error('常驻复制助手输入管道不可用'))
    }
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        this.dispose()
        reject(new Error('常驻复制助手响应超时'))
      }, timeoutMs)
      timer.unref?.()
      this.pending.set(id, { resolve, reject, timer })
      try {
        child.stdin.write(`${JSON.stringify({ id, action })}\n`)
      } catch (error) {
        this.pending.delete(id)
        clearTimeout(timer)
        this.dispose()
        reject(error)
      }
    })
  }

  dispose() {
    const child = this.child
    this.child = null
    this.pythonPath = ''
    this.buffer = ''
    this.rejectAll(new Error('复制助手已关闭'))
    if (!child) return
    try {
      if (child.stdin && !child.stdin.destroyed) {
        child.stdin.write('{"action":"quit"}\n')
        child.stdin.end()
      }
    } catch { /* ignore */ }
    try {
      if (!child.killed) child.kill()
    } catch { /* ignore */ }
  }
}

const sharedWindowsHelper = new WindowsClipboardInputHelper()

export function warmWindowsClipboardHelper(pythonPath) {
  return sharedWindowsHelper.warm(pythonPath)
}

export function disposeWindowsClipboardHelper() {
  sharedWindowsHelper.dispose()
}

export async function assertWindowsGameForeground(pythonPath) {
  if (process.platform !== 'win32' || !pythonPath) {
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '当前环境无法向游戏发送复制按键')
  }
  try {
    return await sharedWindowsHelper.request(pythonPath, 'check')
  } catch (error) {
    if (error instanceof ChaosRecipeError) throw error
    return runWindowsInputScript(pythonPath, gameForegroundGuardLines())
  }
}

export async function sendWindowsCopy(pythonPath) {
  if (process.platform !== 'win32' || !pythonPath) {
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '当前环境无法向游戏发送复制按键')
  }
  try {
    return await sharedWindowsHelper.request(pythonPath, 'copy')
  } catch (error) {
    if (error instanceof ChaosRecipeError) throw error
    await runWindowsInputScript(pythonPath, buildOneShotWindowsCopyScript())
  }
}

export async function captureFreshClipboardText({
  clipboard,
  sendCopy,
  timeoutMs = 800,
  pollMs = 10,
  releaseDelayMs = 0,
  retryCopyAfterMs = 0
}) {
  const previous = clipboard.readText()
  const sentinel = `__poe_price_check_${randomUUID()}__`
  clipboard.writeText(sentinel)
  try {
    if (releaseDelayMs > 0) await wait(releaseDelayMs)
    await sendCopy()
    const startedAt = Date.now()
    const deadline = startedAt + timeoutMs
    let retried = false
    do {
      const current = clipboard.readText()
      if (current && current !== sentinel) {
        if (clipboard.readText() === current) clipboard.writeText(previous)
        return current
      }
      if (!retried && retryCopyAfterMs > 0 && Date.now() - startedAt >= retryCopyAfterMs && Date.now() < deadline) {
        retried = true
        await sendCopy()
        const afterRetry = clipboard.readText()
        if (afterRetry && afterRetry !== sentinel) {
          if (clipboard.readText() === afterRetry) clipboard.writeText(previous)
          return afterRetry
        }
      }
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
