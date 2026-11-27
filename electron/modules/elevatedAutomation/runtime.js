import { spawn as defaultSpawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
import { PassThrough } from 'node:stream'
import { fileURLToPath } from 'node:url'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
let activeBroker = null

export function configureElevatedAutomation(broker) {
  activeBroker = broker || null
  return activeBroker
}

export function getElevatedAutomation() {
  return activeBroker
}

export function resolveBundledScriptPath(filename, { isPackaged = false, resourcesPath = process.resourcesPath } = {}) {
  const candidates = isPackaged
    ? [
        path.join(resourcesPath || '', filename),
        path.join(resourcesPath || '', 'elevated-automation-host', filename),
        path.join(resourcesPath || '', 'app.asar.unpacked', 'src', 'assets', 'scripts', filename)
      ]
    : [
        path.resolve(moduleDir, '../../../src/assets/elevated-automation-host', filename),
        path.resolve(moduleDir, '../../../src/assets/scripts', filename)
      ]
  return candidates.find(candidate => fs.existsSync(candidate)) || candidates[0]
}

export function resolveElevatedHostPath({ isPackaged = false, resourcesPath = process.resourcesPath } = {}) {
  return isPackaged
    ? path.join(resourcesPath || '', 'elevated-automation-host', 'host.py')
    : path.resolve(moduleDir, '../../../src/assets/elevated-automation-host/host.py')
}

export function resolveElevatedResourceRoot({ isPackaged = false, resourcesPath = process.resourcesPath } = {}) {
  return isPackaged
    ? path.resolve(resourcesPath || '')
    : path.resolve(moduleDir, '../../../src/assets/scripts')
}

/**
 * 同步兼容 ChildProcess 代理：先同步返回标准流与事件接口，后台异步完成权限判定并桥接到
 * 本地子进程或远程高权限 Host 子进程，避免同步调用点出现竞态或重写。
 */
export class SmartChildProxy extends EventEmitter {
  constructor(promise, { stdinMode = 'ignore' } = {}) {
    super()
    this.stdout = new PassThrough()
    this.stderr = new PassThrough()
    this.stdin = new PassThrough()
    this.stdin.on('error', () => {})
    this._stdinMode = stdinMode
    this._child = null
    this._killRequested = null
    this._terminated = false
    this._exitCode = null
    this._signalCode = null
    this.killed = false

    Promise.resolve(promise)
      .then(child => this._attach(child))
      .catch(error => this._fail(error))
  }

  get pid() {
    return this._child?.pid ?? null
  }

  get exitCode() {
    return this._exitCode
  }

  get signalCode() {
    return this._signalCode
  }

  get isRemoteElevated() {
    return Boolean(this._child?.isRemoteElevated)
  }

  kill(signal = 'SIGTERM') {
    if (signal === 0 || signal === '0') {
      if (this._terminated) throw Object.assign(new Error('ESRCH'), { code: 'ESRCH' })
      if (this._child) return this._child.kill(0)
      return true
    }
    if (this._terminated) return true
    this.killed = true
    this._killRequested = signal
    if (this._child) {
      try { return this._child.kill(signal) } catch { return false }
    }
    return true
  }

  async stop() {
    if (this._terminated) return true
    this.killed = true
    this._killRequested = 'SIGTERM'
    if (this._child?.stop) return this._child.stop()
    if (this._child) {
      try { this._child.kill('SIGTERM') } catch {}
    }
    return true
  }

  _attach(child) {
    if (this._terminated) {
      try { child?.kill?.('SIGTERM') } catch {}
      return
    }
    this._child = child
    if (this._killRequested) {
      try { child.kill(this._killRequested) } catch {}
    }
    if (this._stdinMode === 'pipe' && child.stdin) {
      this.stdin.pipe(child.stdin)
      child.stdin.on('error', () => {})
    } else {
      this.stdin.end()
    }
    if (child.stdout) {
      child.stdout.on('data', chunk => {
        if (!this._terminated) this.stdout.write(chunk)
      })
    }
    if (child.stderr) {
      child.stderr.on('data', chunk => {
        if (!this._terminated) this.stderr.write(chunk)
      })
    }
    child.once('spawn', () => {
      if (!this._terminated) this.emit('spawn')
    })
    child.on('error', error => {
      if (this._terminated) return
      if (this.listenerCount('error') > 0) this.emit('error', error)
    })
    child.once('exit', (code, signal) => {
      this._exitCode = code
      this._signalCode = signal
      this.emit('exit', code, signal)
    })
    child.once('close', (code, signal) => {
      if (this._terminated) return
      this._terminated = true
      if (this._exitCode === null) this._exitCode = code
      if (this._signalCode === null) this._signalCode = signal
      this.stdout.end()
      this.stderr.end()
      this.stdin.destroy()
      this.emit('close', code, signal)
    })
  }

  _fail(error) {
    if (this._terminated) return
    this._terminated = true
    this._exitCode = 1
    this.stdout.end()
    this.stderr.end()
    this.stdin.destroy()
    if (this.listenerCount('error') > 0) this.emit('error', error)
    this.emit('exit', 1, null)
    this.emit('close', 1, null)
  }
}

/**
 * 同步入口：已配置 broker 且属于高权限操作时经智能代理执行；未配置（如单测）时直连 fallbackSpawn。
 */
export function spawnOperationProcess({
  operationId,
  pythonPath,
  scriptPath,
  args = [],
  env = process.env,
  cwd = undefined,
  stdin = 'ignore',
  scriptContent = undefined,
  copyStashTabSelector = false,
  forceElevated = false,
  fallbackSpawn = defaultSpawn,
  broker = activeBroker
} = {}) {
  if (broker && broker.isElevatedOperation?.(operationId)) {
    return new SmartChildProxy(
      broker.spawnSmart({
        operationId,
        pythonPath,
        localScriptPath: scriptPath,
        args,
        env,
        cwd,
        stdin,
        scriptContent,
        copyStashTabSelector,
        forceElevated
      }),
      { stdinMode: stdin }
    )
  }
  return fallbackSpawn(pythonPath, [scriptPath, ...args], {
    shell: false,
    windowsHide: true,
    ...(cwd ? { cwd } : {}),
    env: {
      ...env,
      PYTHONUNBUFFERED: '1',
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1'
    },
    stdio: [stdin === 'pipe' ? 'pipe' : 'ignore', 'pipe', 'pipe']
  })
}

export async function execOperationProcess({
  operationId,
  pythonPath,
  scriptPath,
  args = [],
  env = process.env,
  timeoutMs = 5000,
  forceElevated = false,
  broker = activeBroker
} = {}) {
  if (!broker || !broker.isElevatedOperation?.(operationId)) return null
  return broker.execSmart({
    operationId,
    pythonPath,
    localScriptPath: scriptPath,
    args,
    env,
    timeoutMs,
    forceElevated
  })
}
