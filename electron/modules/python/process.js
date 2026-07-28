/**
 * Purpose: Python 进程管理模块，负责启动、终止和清理 Python 脚本进程
 * Inputs: 进程 ID、进程对象
 * Outputs: 进程状态、清理结果
 * Preconditions: Python 环境已正确配置
 * Edge cases: 进程不存在时静默处理；跨平台兼容（Windows/Linux/Mac）
 * Errors: 终止失败返回 false，不抛出异常
 */

import { spawn, exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

let currentScriptProcess = null
let currentScriptMode = null

/**
 * Purpose: 强制终止Python进程及其所有子进程
 * Inputs: pid (number) - 进程 ID
 * Outputs: Promise<boolean> - 成功返回 true，失败返回 false
 * Preconditions: pid 必须是有效的进程 ID
 * Edge cases: 进程不存在时返回 true（视为已清理）；跨平台使用不同命令
 * Errors: 命令执行失败返回 false，不抛出异常
 */
export async function killPythonProcessTree(pid) {
  if (process.platform === 'win32') {
    try {
      // 使用 taskkill 强制终止进程树
      await execAsync(`taskkill /F /T /PID ${pid}`)
      return true
    } catch (error) {
      // 如果进程不存在或已终止，这是正常的
      if (error.code === 128 || error.message.includes('not found')) {
        return true
      }
      return false
    }
  } else {
    // Linux/Mac 使用 kill 终止进程树
    try {
      await execAsync(`pkill -P ${pid}`)
      await execAsync(`kill -9 ${pid}`)
      return true
    } catch (error) {
      return false
    }
  }
}

/**
 * Purpose: 获取当前正在执行的脚本进程
 * Inputs: 无
 * Outputs: Process 对象或 null
 */
export function getCurrentScriptProcess() {
  return currentScriptProcess
}

export function getCurrentScriptMode() {
  return currentScriptMode
}

/**
 * Purpose: 设置当前正在执行的脚本进程
 * Inputs: process (Process) - 进程对象
 * Outputs: 无
 */
export function setCurrentScriptProcess(process, mode = null) {
  currentScriptProcess = process
  currentScriptMode = mode === 'items' || mode === 'map' ? mode : null
}

/**
 * Purpose: 清除当前脚本进程引用
 * Inputs: 无
 * Outputs: 无
 */
export function clearCurrentScriptProcess() {
  currentScriptProcess = null
  currentScriptMode = null
}

/**
 * Purpose: 清理本应用当前跟踪的 Python 进程和资源
 * Inputs: 无
 * Outputs: Promise<void> - 无返回值
 * Preconditions: 无
 * Edge cases: 进程不存在时静默处理
 * Errors: 清理失败时静默处理，不抛出异常
 */
export async function cleanup() {
  if (!currentScriptProcess) return

  const pid = currentScriptProcess.pid
  try {
    const stopped = await killPythonProcessTree(pid)
    if (!stopped) throw new Error(`无法终止 Python 进程树：${pid}`)
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    clearCurrentScriptProcess()
  }
}

