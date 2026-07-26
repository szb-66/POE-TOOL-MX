import { spawn } from 'node:child_process'

export const CRAFTING_PYTHON_MODULES = Object.freeze(['pynput', 'pyperclip'])

export function resolveCraftingPython(python) {
  if (typeof python?.detectPythonPathWithModules !== 'function') return null
  return python.detectPythonPathWithModules([...CRAFTING_PYTHON_MODULES])
}

export function createPythonProcess({ pythonPath, scriptPath, spawnProcess = spawn, env = process.env }) {
  const child = spawnProcess(pythonPath, [scriptPath], {
    shell: false,
    windowsHide: true,
    env: {
      ...env,
      PYTHONUNBUFFERED: '1',
      PYTHONIOENCODING: 'utf-8'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  const started = new Promise((resolve, reject) => {
    const onSpawn = () => {
      child.removeListener('error', onStartupError)
      resolve(child)
    }
    const onStartupError = (error) => {
      child.removeListener('spawn', onSpawn)
      reject(error)
    }
    child.once('spawn', onSpawn)
    child.once('error', onStartupError)
  })

  return { process: child, started }
}

export async function startPythonProcess(options) {
  const launch = createPythonProcess(options)
  await launch.started
  return launch.process
}
