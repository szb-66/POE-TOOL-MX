import { spawn as defaultSpawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'

import { connectNamedPipeHost } from './pipeClient.js'
import { probeCurrentProcessElevated, probeTargetGameElevation } from './privilege.js'
import { RemoteElevatedChild } from './remoteChild.js'
import { buildRunAsInvocation, createSessionPipeName, launchElevatedHostWithPowerShell } from './runAs.js'

export const ELEVATED_OPERATION_IDS = Object.freeze([
  'window.activate-game',
  'price.copy-item',
  'crafting.items',
  'crafting.maps',
  'combat.assist',
  'bag.auto-stash',
  'chaos-recipe.pickup',
  'stash-tabs.select',
  'stash-pickup.run',
  'junfeng.pickup',
  'puzzle.analyze',
  'puzzle.chart-mods',
  'puzzle.auto-place',
  'faustus.repricing',
  'sanctum.native',
  'map-tracker.loot-click'
])

export const READ_ONLY_OPERATION_IDS = Object.freeze([
  'game.dpi-probe',
  'game.foreground-watch',
  'game.interface-detect',
  'combat.pixel-sample',
  'stash-tabs.preview',
  'overlay.outside-click'
])

const ELEVATED_SET = new Set(ELEVATED_OPERATION_IDS)
const ALLOWED_FORWARDED_ENV_KEYS = new Set([
  'POE_GAME_WINDOW_TITLES_FILE',
  'POE_PARSE_TRANSPORT',
  'FAUSTUS_TIMING',
  'OC_DISABLE_DOT_ACCESS_WARNING',
  'PYTHONUNBUFFERED',
  'PYTHONIOENCODING',
  'PYTHONUTF8'
])

export class ElevatedAutomationError extends Error {
  constructor(code, message, details = undefined) {
    super(message)
    this.name = 'ElevatedAutomationError'
    this.code = code
    if (details !== undefined) this.details = details
  }
}

function usable(connection) {
  return Boolean(connection) && connection.closed !== true && typeof connection.send === 'function'
}

function filterForwardedEnv(env = {}) {
  const result = {}
  for (const key of ALLOWED_FORWARDED_ENV_KEYS) {
    const value = env?.[key]
    if (value !== undefined && value !== null) result[key] = String(value)
  }
  return result
}

/**
 * 统一的高权限自动化代理：
 * - 非 Windows、当前主进程已提权、或明确确认目标游戏为普通权限时：直接本地普通权限执行（零 UAC）；
 * - 主进程为普通权限且游戏为管理员（或无法确认）时：按需通过 RunAs 拉起单会话薄 Python Host 并复用。
 */
export class ElevatedAutomationBroker {
  constructor({
    platform = process.platform,
    resolveRuntime,
    launchHost,
    connectHost,
    createPipeName = createSessionPipeName,
    createRequestId = randomUUID,
    parentProcessId = process.pid,
    spawnLocal = defaultSpawn,
    probeCurrentElevated = probeCurrentProcessElevated,
    probeGameElevation = probeTargetGameElevation,
    standardElevationCacheTtlMs = 3000,
    now = () => Date.now()
  } = {}) {
    this.platform = platform
    this.resolveRuntime = resolveRuntime
    this.launchHost = launchHost
    this.connectHost = connectHost
    this.createPipeName = createPipeName
    this.createRequestId = createRequestId
    this.parentProcessId = parentProcessId
    this.spawnLocal = spawnLocal
    this.probeCurrentElevated = probeCurrentElevated
    this.probeGameElevation = probeGameElevation
    this.standardElevationCacheTtlMs = Math.max(0, Number(standardElevationCacheTtlMs) || 0)
    this.now = now

    this.connection = null
    this.startupPromise = null
    this.active = new Map()
    this.accepting = true
    this.currentElevatedCache = null
    this.standardGameElevationExpiresAt = 0
    this.gameElevationPending = null
  }

  isElevatedOperation(operationId) {
    return ELEVATED_SET.has(operationId)
  }

  hasActiveConnection() {
    return usable(this.connection)
  }

  async isCurrentProcessElevated(pythonPath = '') {
    if (this.platform !== 'win32') return false
    if (this.currentElevatedCache !== null) return this.currentElevatedCache
    const resolvedPython = pythonPath || (await this.resolveRuntime?.())?.pythonPath || ''
    const elevated = await this.probeCurrentElevated({ platform: this.platform, pythonPath: resolvedPython })
    if (elevated === true || elevated === false) this.currentElevatedCache = elevated
    return elevated === true
  }

  /**
   * 智能按需判断是否需要通过高权限 Host 执行。
   * 返回 false 表示可直接本地运行（零 UAC）；返回 true 表示应走提权 Host。
   */
  async shouldUseElevatedHost({ pythonPath = '', env = process.env, forceElevated = false } = {}) {
    if (this.platform !== 'win32') return false
    if (await this.isCurrentProcessElevated(pythonPath)) return false
    if (forceElevated) {
      this.standardGameElevationExpiresAt = 0
      return true
    }
    if (usable(this.connection)) {
      this.standardGameElevationExpiresAt = 0
      return true
    }
    if (this.standardElevationCacheTtlMs > 0 && this.now() < this.standardGameElevationExpiresAt) {
      return false
    }
    if (!this.gameElevationPending) {
      const pending = (async () => {
        const resolvedPython = pythonPath || (await this.resolveRuntime?.())?.pythonPath || ''
        const gameLevel = await this.probeGameElevation({ platform: this.platform, pythonPath: resolvedPython, env })
        if (gameLevel === 'standard' && this.standardElevationCacheTtlMs > 0) {
          this.standardGameElevationExpiresAt = this.now() + this.standardElevationCacheTtlMs
        } else {
          this.standardGameElevationExpiresAt = 0
        }
        return gameLevel
      })().finally(() => {
        if (this.gameElevationPending === pending) this.gameElevationPending = null
      })
      this.gameElevationPending = pending
    }
    const gameLevel = await this.gameElevationPending
    return gameLevel !== 'standard'
  }

  async ensureConnected() {
    if (!this.accepting) {
      throw new ElevatedAutomationError('ELEVATED_BROKER_CLOSED', '高权限自动化通道已关闭')
    }
    if (usable(this.connection)) return this.connection
    if (this.startupPromise) return this.startupPromise

    const task = (async () => {
      const runtime = await this.resolveRuntime?.()
      if (!runtime?.pythonPath || !runtime?.hostPath || !runtime?.resourceRoot) {
        throw new ElevatedAutomationError('ELEVATED_RUNTIME_UNAVAILABLE', '内置高权限自动化运行时不完整')
      }
      const pipeName = this.createPipeName()
      const launched = await this.launchHost({
        pythonPath: runtime.pythonPath,
        hostPath: runtime.hostPath,
        resourceRoot: runtime.resourceRoot,
        pipeName,
        parentProcessId: this.parentProcessId
      })
      const connection = await this.connectHost({
        pipeName,
        expectedHostProcessId: launched.processId
      })
      this._attachConnection(connection)
      return connection
    })()

    this.startupPromise = task
    try {
      return await task
    } finally {
      if (this.startupPromise === task) this.startupPromise = null
    }
  }

  _attachConnection(connection) {
    if (connection.closed) {
      this._handleConnectionLost(connection)
      return
    }
    this.connection = connection
    connection.on('message', message => {
      const child = this.active.get(message?.requestId)
      if (child) child.accept(message)
    })
    connection.on('error', error => this._handleConnectionLost(connection, error))
    connection.on('close', () => this._handleConnectionLost(connection))
  }

  _handleConnectionLost(connection, error = null) {
    if (this.connection === connection) this.connection = null
    const pending = [...this.active.values()]
    this.active.clear()
    const message = error?.message || '高权限自动化 Host 连接已断开'
    for (const child of pending) {
      child.fail('HOST_DISCONNECTED', message)
    }
  }

  /**
   * 同步返回兼容 ChildProcess 的对象（远程模式下异步完成 UAC/握手后立即发 spawn，
   * 与本地 spawn 的事件模型完全一致，调用方无需重写回调逻辑）。
   */
  spawnElevated({
    operationId,
    args = [],
    env = process.env,
    stdin = 'ignore',
    scriptContent = undefined,
    copyStashTabSelector = false
  } = {}) {
    if (!this.isElevatedOperation(operationId)) {
      throw new ElevatedAutomationError('UNKNOWN_OPERATION', `未注册的高权限操作：${operationId}`)
    }
    if (!this.accepting) {
      throw new ElevatedAutomationError('ELEVATED_BROKER_CLOSED', '高权限自动化通道已关闭')
    }
    const requestId = this.createRequestId()
    const child = new RemoteElevatedChild({
      requestId,
      operationId,
      writeStdin: async (id, data) => {
        const connection = this.connection || await this.startupPromise?.catch(() => null)
        if (!usable(connection)) throw new ElevatedAutomationError('HOST_DISCONNECTED', '高权限 Host 未连接')
        await connection.send({ type: 'stdin', requestId: id, data })
      },
      endStdin: async (id) => {
        const connection = this.connection || await this.startupPromise?.catch(() => null)
        if (!usable(connection)) return
        await connection.send({ type: 'stdin-end', requestId: id }).catch(() => {})
      },
      stop: async (id) => {
        const connection = this.connection || await this.startupPromise?.catch(() => null)
        if (!usable(connection)) return false
        try {
          await connection.send({ type: 'stop', requestId: id })
          return true
        } catch (error) {
          this._handleConnectionLost(connection, error)
          return false
        }
      },
      onTerminal: current => {
        if (this.active.get(current.requestId) === current) this.active.delete(current.requestId)
      }
    })
    this.active.set(requestId, child)

    const payload = {
      type: 'spawn',
      requestId,
      operationId,
      args: args.map(String),
      env: filterForwardedEnv(env),
      stdin: stdin === 'pipe' ? 'pipe' : 'ignore',
      ...(scriptContent !== undefined ? { scriptContent } : {}),
      ...(copyStashTabSelector ? { copyStashTabSelector: true } : {})
    }

    void this.ensureConnected()
      .then(connection => {
        if (child.terminated) return
        return connection.send(payload)
      })
      .catch(error => {
        child.fail(error?.code || 'ELEVATION_FAILED', error?.message || '无法启动高权限自动化操作')
      })

    return child
  }

  /**
   * 智能按需启动：游戏为普通权限时本地运行，游戏为管理员（或无法确认）时自动走高权限 Host。
   */
  async spawnSmart({
    operationId,
    pythonPath,
    localScriptPath,
    args = [],
    env = process.env,
    cwd = undefined,
    stdin = 'ignore',
    scriptContent = undefined,
    copyStashTabSelector = false,
    forceElevated = false
  } = {}) {
    if (!this.isElevatedOperation(operationId)) {
      throw new ElevatedAutomationError('UNKNOWN_OPERATION', `未注册的高权限操作：${operationId}`)
    }
    const useElevated = await this.shouldUseElevatedHost({ pythonPath, env, forceElevated })
    if (useElevated) {
      return this.spawnElevated({ operationId, args, env, stdin, scriptContent, copyStashTabSelector })
    }
    return this.spawnLocal(pythonPath, [localScriptPath, ...args], {
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

  /**
   * 一次性短命令执行（如激活游戏窗口、单次复制按键），带超时与退出码。
   */
  async execSmart({
    operationId,
    pythonPath,
    localScriptPath,
    args = [],
    env = process.env,
    timeoutMs = 5000,
    forceElevated = false
  } = {}) {
    const child = await this.spawnSmart({
      operationId,
      pythonPath,
      localScriptPath,
      args,
      env,
      stdin: 'ignore',
      forceElevated
    })
    return new Promise((resolve, reject) => {
      let stdout = ''
      let stderr = ''
      let settled = false
      const finish = (error, value) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        if (error) reject(error)
        else resolve(value)
      }
      const timer = setTimeout(() => {
        try { child.kill() } catch {}
        finish(Object.assign(new Error('高权限操作执行超时'), { code: 'ETIMEDOUT' }))
      }, timeoutMs)
      child.stdout?.setEncoding?.('utf8')
      child.stderr?.setEncoding?.('utf8')
      child.stdout?.on?.('data', chunk => { stdout += String(chunk) })
      child.stderr?.on?.('data', chunk => { stderr += String(chunk) })
      child.once('error', error => finish(error))
      child.once('close', code => finish(null, { exitCode: code ?? 1, stdout, stderr }))
    })
  }

  async stopAll() {
    const connection = this.connection || await this.startupPromise?.catch(() => null)
    if (!usable(connection)) return { success: true, stopped: false }
    try {
      await connection.send({ type: 'stop-all' })
      return { success: true, stopped: true }
    } catch (error) {
      this._handleConnectionLost(connection, error)
      return { success: false, stopped: false, error: error?.message || '停止高权限自动化失败' }
    }
  }

  async shutdown() {
    this.accepting = false
    this.standardGameElevationExpiresAt = 0
    this.gameElevationPending = null
    const connection = this.connection || await this.startupPromise?.catch(() => null)
    if (usable(connection)) {
      try {
        await connection.send({ type: 'shutdown' })
      } catch {
        // 关闭阶段忽略断连错误
      }
      connection.close()
    }
    this.connection = null
    const pending = [...this.active.values()]
    this.active.clear()
    for (const child of pending) {
      child.fail('HOST_SHUTDOWN', '应用正在退出')
    }
    return true
  }
}

export function createWindowsElevatedAutomation({
  resolveRuntime,
  powershellPath,
  execFileImpl,
  connectTimeoutMs = 15_000,
  createConnection,
  createPipeName = createSessionPipeName,
  createRequestId = randomUUID,
  parentProcessId = process.pid,
  platform = process.platform
} = {}) {
  return new ElevatedAutomationBroker({
    platform,
    resolveRuntime,
    createPipeName,
    createRequestId,
    parentProcessId,
    launchHost: async descriptor => {
      const invocation = buildRunAsInvocation({ ...descriptor, powershellPath })
      return launchElevatedHostWithPowerShell(invocation, { execFileImpl })
    },
    connectHost: options => connectNamedPipeHost({
      ...options,
      timeoutMs: connectTimeoutMs,
      ...(createConnection ? { createConnection } : {})
    })
  })
}
