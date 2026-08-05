/**
 * Purpose: 前台监视器，持续运行 Python 脚本检测系统前台窗口是否为游戏窗口，
 *          并在状态变化时回调主进程以注册或注销游戏快捷键。
 * Inputs: pythonPath/scriptPath/onStateChange/onFailure
 * Outputs: 控制器（stop/getState）
 * Edge cases: 进程异常退出自动重启（最多 3 次、2s 退避）；Python 不可用时直接失败回调
 * Errors: 最终失败通过 onFailure 回调，不抛出异常
 */

import { spawn } from 'node:child_process'
import { killPythonProcessTree } from '../python/process.js'

const MAX_RESTARTS = 3
const RESTART_DELAY_MS = 2000

export function createEventLineParser(onEvent, onLog = () => {}) {
  let buffer = ''
  return (chunk) => {
    buffer += String(chunk)
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('EVENT ')) {
        if (line.trim()) onLog(line)
        continue
      }
      try {
        onEvent(JSON.parse(line.slice(6)))
      } catch {
        onLog(line)
      }
    }
  }
}

export function startForegroundWatcher({
  pythonPath,
  scriptPath,
  onStateChange = () => {},
  onFailure = () => {},
  maxRestarts = MAX_RESTARTS,
  restartDelayMs = RESTART_DELAY_MS
}) {
  if (!pythonPath || !scriptPath) {
    const error = new Error('前台监视器缺少 Python 路径或脚本路径')
    queueMicrotask(() => onFailure(error))
    return {
      stop: () => {},
      getState: () => ({ state: 'unavailable', game: false })
    }
  }

  let child = null
  let stopping = false
  let restarts = 0
  let restartTimer = null
  let state = { state: 'starting', game: false }

  function getState() {
    return { ...state }
  }

  function handleEvent(payload) {
    if (payload?.event !== 'foreground') return
    const game = Boolean(payload.game)
    state = { state: 'ready', game }
    onStateChange({ game, title: String(payload.title || '') })
  }

  function handleExit(error) {
    if (stopping || !child) return
    child = null
    state = { state: 'exited', game: false, error: error?.message || '前台监视进程退出' }
    if (restarts < maxRestarts) {
      restarts += 1
      restartTimer = setTimeout(spawnChild, restartDelayMs)
    } else {
      onFailure(state.error)
    }
  }

  function spawnChild() {
    restartTimer = null
    child = spawn(pythonPath, [scriptPath], {
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    })
    const parser = createEventLineParser(handleEvent)
    child.stdout?.on('data', parser)
    child.stderr?.on('data', () => {})
    child.once('error', handleExit)
    child.once('close', handleExit)
  }

  function stop() {
    if (stopping) return
    stopping = true
    if (restartTimer) {
      clearTimeout(restartTimer)
      restartTimer = null
    }
    if (child) {
      const pid = child.pid
      child = null
      if (pid) void killPythonProcessTree(pid)
    }
  }

  spawnChild()
  return { stop, getState }
}
