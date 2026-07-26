/**
 * Purpose: 检测系统中 Python 可执行文件的路径
 * Inputs: 无
 * Outputs: Python 可执行文件路径（string）或 null（未找到）
 * Preconditions: 系统已安装 Python 3
 * Edge cases: 多版本 Python 时返回第一个找到的；跨平台兼容（Windows/Linux/Mac）
 * Errors: 检测失败返回 null，不抛出异常
 */

import { execFileSync, execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Python路径缓存
let cachedPythonPath = null
const compatiblePythonPathCache = new Map()

const commonPythonPaths = () => {
  const paths = [
    'C:\\Python3\\python.exe',
    'C:\\Python39\\python.exe',
    'C:\\Python310\\python.exe',
    'C:\\Python311\\python.exe',
    'C:\\Python312\\python.exe',
    'C:\\Python313\\python.exe',
    'C:\\Python314\\python.exe',
    'C:\\Program Files\\Python3\\python.exe',
    'C:\\Program Files (x86)\\Python3\\python.exe'
  ]
  const userRoot = path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python')
  try {
    const installed = fs.readdirSync(userRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^Python\d+$/i.test(entry.name))
      .sort((left, right) => right.name.localeCompare(left.name, undefined, { numeric: true }))
      .map((entry) => path.join(userRoot, entry.name, 'python.exe'))
    paths.push(...installed)
  } catch { /* 用户目录下没有独立 Python 安装 */ }
  return [...new Set(paths)]
}

const pythonCandidates = () => ['python3', 'python', ...commonPythonPaths()]

export const detectPythonPathWithModules = (requiredModules = []) => {
  const modules = [...new Set(requiredModules.map((name) => String(name).trim()).filter(Boolean))]
  const cacheKey = modules.slice().sort().join(',')
  if (compatiblePythonPathCache.has(cacheKey)) return compatiblePythonPathCache.get(cacheKey)
  const probe = modules.map((name) => `import ${name}`).join('; ') || 'import sys'
  for (const candidate of pythonCandidates()) {
    try {
      execFileSync(candidate, ['-c', probe], { stdio: 'ignore', windowsHide: true, timeout: 5000 })
      compatiblePythonPathCache.set(cacheKey, candidate)
      return candidate
    } catch { /* 继续查找具备全部依赖的解释器 */ }
  }
  return null
}

/**
 * Purpose: 检测Python可执行文件路径
 * Inputs: 无
 * Outputs: Python路径（string），如果未找到返回 null
 * Preconditions: 无
 * Edge cases: 多版本时返回第一个找到的；使用缓存避免重复检测
 * Errors: 检测失败返回 null，不抛出异常
 */
export const detectPythonPath = () => {
  if (cachedPythonPath) {
    return cachedPythonPath
  }

  // 尝试的命令列表（按优先级）
  const possibleCommands = ['python3', 'python']
  
  // Windows常见安装路径
  const possiblePaths = commonPythonPaths()

  // 先尝试在PATH中查找命令（跨平台兼容）
  for (const cmd of possibleCommands) {
    try {
      // Windows 使用 where，Linux/Mac 使用 which
      const command = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`
      execSync(command, { stdio: 'ignore' })
      cachedPythonPath = cmd
      return cmd
    } catch (e) {
      // 继续尝试下一个命令
    }
  }

  // 尝试检查常见安装路径（仅 Windows）
  if (process.platform === 'win32') {
    for (const pythonPath of possiblePaths) {
      try {
        if (fs.existsSync(pythonPath)) {
          cachedPythonPath = pythonPath
          return pythonPath
        }
      } catch (error) {
        // 继续尝试下一个路径
      }
    }
  }

  return null
}

