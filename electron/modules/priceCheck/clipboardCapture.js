import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { CHAOS_ERROR_CODES, ChaosRecipeError } from '../chaosRecipe/errors.js'

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

function gameForegroundGuardLines() {
  return [
    'import ctypes, json, os, sys, time',
    'u = ctypes.windll.user32',
    'h = u.GetForegroundWindow()',
    'n = u.GetWindowTextLengthW(h)',
    'b = ctypes.create_unicode_buffer(n + 1)',
    'u.GetWindowTextW(h, b, n + 1)',
    'titles = ("流放之路", "Path of Exile")',
    'p = os.environ.get("POE_GAME_WINDOW_TITLES_FILE", "")',
    'try:',
    ' data = json.load(open(p, "r", encoding="utf-8")) if p else {}',
    ' values = data.get("titles") if isinstance(data, dict) else data',
    ' titles = tuple(str(v).strip() for v in values) if isinstance(values, list) and values else titles',
    'except Exception: pass',
    'ok = any(t.casefold() in b.value.casefold() for t in titles if t)',
    'sys.exit(23) if not ok else None'
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
