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
 * Purpose: 扫描并终止所有Python进程（用于清理残留进程）
 * Inputs: 无
 * Outputs: Promise<void> - 无返回值
 * Preconditions: 无
 * Edge cases: 没有找到 Python 进程时静默返回；跳过当前进程自身
 * Errors: 扫描失败时静默处理，不抛出异常
 */
export async function killAllPythonProcesses() {
  if (process.platform === 'win32') {
    try {
      // 查找所有python.exe进程
      const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq python.exe" /FO CSV /NH')
      
      if (!stdout) return

      const lines = stdout.trim().split('\n').filter(line => line.trim())
      
      for (const line of lines) {
        const match = line.match(/"python\.exe","(\d+)"/)
        if (match) {
          const pid = parseInt(match[1])
          if (pid && pid !== process.pid) {
            await killPythonProcessTree(pid)
          }
        }
      }
    } catch (error) {
      // 如果没有找到Python进程，这是正常的
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

/**
 * Purpose: 设置当前正在执行的脚本进程
 * Inputs: process (Process) - 进程对象
 * Outputs: 无
 */
export function setCurrentScriptProcess(process) {
  currentScriptProcess = process
}

/**
 * Purpose: 清除当前脚本进程引用
 * Inputs: 无
 * Outputs: 无
 */
export function clearCurrentScriptProcess() {
  currentScriptProcess = null
}

/**
 * Purpose: 清理所有Python进程和资源
 * Inputs: 无
 * Outputs: Promise<void> - 无返回值
 * Preconditions: 无
 * Edge cases: 进程不存在时静默处理
 * Errors: 清理失败时静默处理，不抛出异常
 */
export async function cleanup() {
  if (currentScriptProcess) {
    try {
      const pid = currentScriptProcess.pid
      await killPythonProcessTree(pid)
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (e) {
      // 终止脚本进程失败
    }
    currentScriptProcess = null
  }
  
  // 清理所有Python进程（防止残留）
  await killAllPythonProcesses()
}

