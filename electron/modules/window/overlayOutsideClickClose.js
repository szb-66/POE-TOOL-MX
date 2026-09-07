/**
 * Purpose: 管理制作浮窗"点击外部自动关闭"的布防，通过 Python 全局左键监听检测浮窗外点击，不依赖窗口焦点。
 * Inputs: onClose (function) - 点击浮窗外时执行的关闭回调；pythonPath/scriptPath - 监听脚本运行时；
 *         getCursorPoint (function) - 返回当前光标 DIP 坐标；spawnImpl (function) - 注入子进程创建。
 * Outputs: 返回 { arm, disarm, isArmed }，arm 接受窗口对象，幂等；disarm 幂等并终止监听进程。
 * Preconditions: Windows 平台；脚本通过 GetAsyncKeyState 轮询左键按下沿。
 * Edge cases: 已销毁窗口不布防；点击浮窗 bounds 内不触发关闭；监听进程异常退出时静默解除布防。
 */

import { spawn } from 'node:child_process'

export function isPointInsideBounds(point, bounds) {
  if (!point || !bounds) return false
  return point.x >= bounds.x && point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y && point.y <= bounds.y + bounds.height
}

export function createOverlayOutsideClickCloser({
  onClose,
  pythonPath = '',
  scriptPath = '',
  getCursorPoint,
  spawnImpl = spawn
} = {}) {
  let armedWindow = null
  let child = null
  let buffer = ''
  let stopping = false
  let runtime = { pythonPath, scriptPath }

  function configure(next = {}) {
    if ('pythonPath' in next) runtime.pythonPath = next.pythonPath
    if ('scriptPath' in next) runtime.scriptPath = next.scriptPath
  }

  function handleChunk(chunk) {
    buffer += String(chunk)
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''
    for (const line of lines) {
      try {
        if (JSON.parse(line)?.event !== 'click') continue
      } catch {
        continue
      }
      const win = armedWindow
      if (!win || win.isDestroyed()) continue
      if (isPointInsideBounds(getCursorPoint?.(), win.getBounds())) continue
      onClose()
      return
    }
  }

  function disarm() {
    if (!armedWindow && !child) return
    armedWindow = null
    stopping = true
    const running = child
    child = null
    buffer = ''
    running?.kill?.()
  }

  function arm(win) {
    if (!win || win.isDestroyed()) return
    disarm()
    if (!runtime.pythonPath || !runtime.scriptPath) return
    armedWindow = win
    stopping = false
    const running = spawnImpl(runtime.pythonPath, [runtime.scriptPath], {
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore']
    })
    child = running
    running.stdout?.setEncoding?.('utf8')
    running.stdout?.on?.('data', chunk => handleChunk(chunk))
    running.once?.('exit', () => {
      if (child !== running) return
      child = null
      buffer = ''
      if (!stopping) armedWindow = null
    })
  }

  return {
    arm,
    disarm,
    configure,
    isArmed: () => Boolean(armedWindow)
  }
}
