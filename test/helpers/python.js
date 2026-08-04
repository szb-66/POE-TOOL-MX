import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const runtimePython = path.join(projectRoot, '.runtime', 'python-runtime', 'python.exe')

export const pythonPath = existsSync(runtimePython) ? runtimePython : 'python'

export function runPython(code, options = {}) {
  const result = spawnSync(pythonPath, ['-c', code], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' },
    ...options
  })
  if (result.status !== 0) throw new Error(result.stderr || result.stdout)
  return JSON.parse(result.stdout)
}
