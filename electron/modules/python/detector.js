/**
 * Purpose: 为正式包和开发环境解析、探测并描述可用的 Python 运行时。
 * Production: 只允许 process.resourcesPath/python-runtime/python.exe。
 * Development: 显式覆盖 -> 已准备的仓库运行时 -> 满足依赖的系统 Python。
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(moduleDir, '../../..')
const preparedRuntimePath = path.join(projectRoot, '.runtime', 'python-runtime', 'python.exe')
const runtimeCache = new Map()

let runtimeContext = {
  isPackaged: false,
  resourcesPath: process.resourcesPath || '',
  env: process.env
}

export function configurePythonRuntime(context = {}) {
  runtimeContext = {
    ...runtimeContext,
    ...context,
    env: context.env || runtimeContext.env || process.env
  }
  runtimeCache.clear()
}

export function resetPythonRuntimeCache() {
  runtimeCache.clear()
}

function commonPythonPaths() {
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
    paths.push(...fs.readdirSync(userRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^Python\d+$/i.test(entry.name))
      .sort((left, right) => right.name.localeCompare(left.name, undefined, { numeric: true }))
      .map((entry) => path.join(userRoot, entry.name, 'python.exe')))
  } catch { /* 用户目录中没有独立 Python */ }
  return [...new Set(paths)]
}

function normalizeOverride(value) {
  const input = String(value || '').trim()
  if (!input) return null
  try {
    if (fs.statSync(input).isDirectory()) return path.join(input, 'python.exe')
  } catch { /* 允许命令名或尚不可访问的显式路径进入统一探测 */ }
  return input
}

function probeRuntime(candidate, modules) {
  const probe = [
    'import json, platform, struct',
    ...modules.map((name) => `import ${name}`),
    `print(json.dumps({"version": platform.python_version(), "bits": struct.calcsize("P") * 8}))`
  ].join('; ')
  const output = execFileSync(candidate, ['-I', '-c', probe], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 10000,
    stdio: ['ignore', 'pipe', 'pipe']
  })
  const info = JSON.parse(output.trim().split(/\r?\n/).at(-1))
  if (Number(info.bits) !== 64 && runtimeContext.isPackaged) {
    throw new Error(`正式版只支持 x64 Python，当前为 ${info.bits} bit`)
  }
  return info
}

function candidateList() {
  const bundled = path.join(runtimeContext.resourcesPath || '', 'python-runtime', 'python.exe')
  if (runtimeContext.isPackaged) return [{ path: bundled, source: 'bundled' }]

  const override = normalizeOverride(runtimeContext.env?.POE_PYTHON_RUNTIME)
  const candidates = [
    override && { path: override, source: 'override' },
    { path: preparedRuntimePath, source: 'prepared' },
    { path: 'python3', source: 'system' },
    { path: 'python', source: 'system' },
    ...commonPythonPaths().map((pythonPath) => ({ path: pythonPath, source: 'system' }))
  ].filter(Boolean)
  return candidates.filter((entry, index, all) => (
    all.findIndex((candidate) => candidate.path.toLowerCase() === entry.path.toLowerCase()) === index
  ))
}

export function resolvePythonRuntime(requiredModules = []) {
  const modules = [...new Set(requiredModules.map((name) => String(name).trim()).filter(Boolean))].sort()
  const cacheKey = `${runtimeContext.isPackaged ? 'packaged' : 'development'}:${modules.join(',')}`
  if (runtimeCache.has(cacheKey)) return runtimeCache.get(cacheKey)

  const failures = []
  for (const candidate of candidateList()) {
    try {
      const info = probeRuntime(candidate.path, modules)
      const result = {
        ready: true,
        found: true,
        source: candidate.source,
        path: candidate.path,
        version: info.version,
        modules,
        error: null
      }
      runtimeCache.set(cacheKey, result)
      return result
    } catch (error) {
      failures.push(`${candidate.source}: ${error?.message || '不可用'}`)
    }
  }

  const source = runtimeContext.isPackaged ? 'bundled' : 'unavailable'
  const result = {
    ready: false,
    found: false,
    source,
    path: null,
    version: null,
    modules,
    error: runtimeContext.isPackaged
      ? '内置 Python 运行时缺失或损坏，请重新安装应用'
      : `未找到满足依赖的 Python 3${failures.length ? `（已检查 ${failures.length} 个候选）` : ''}`
  }
  runtimeCache.set(cacheKey, result)
  return result
}

export const detectPythonPathWithModules = (requiredModules = []) => (
  resolvePythonRuntime(requiredModules).path
)

export const detectPythonPath = () => resolvePythonRuntime().path
