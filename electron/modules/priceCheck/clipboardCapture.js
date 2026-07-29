import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { CHAOS_ERROR_CODES, ChaosRecipeError } from '../chaosRecipe/errors.js'

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

export async function sendWindowsCopy(pythonPath, { advanced = false } = {}) {
  if (process.platform !== 'win32' || !pythonPath) {
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, '当前环境无法向游戏发送复制按键')
  }
  const script = [
    'import ctypes, time',
    'u = ctypes.windll.user32',
    'u.keybd_event(0x11, 0, 0, 0)',
    ...(advanced ? ['u.keybd_event(0x12, 0, 0, 0)'] : []),
    'u.keybd_event(0x43, 0, 0, 0)',
    'time.sleep(0.02)',
    'u.keybd_event(0x43, 0, 2, 0)',
    ...(advanced ? ['u.keybd_event(0x12, 0, 2, 0)'] : []),
    'u.keybd_event(0x11, 0, 2, 0)'
  ].join('; ')
  await new Promise((resolve, reject) => {
    execFile(pythonPath, ['-c', script], { windowsHide: true, timeout: 3000 }, (error) => {
      if (error) reject(new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, `无法向游戏发送复制按键：${error.message}`))
      else resolve()
    })
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
  try {
    return await captureFreshClipboardText({
      ...options,
      sendCopy: () => options.sendCopy({ advanced: true })
    })
  } catch (advancedError) {
    try {
      return await captureFreshClipboardText({
        ...options,
        sendCopy: () => options.sendCopy({ advanced: false })
      })
    } catch {
      throw advancedError
    }
  }
}
