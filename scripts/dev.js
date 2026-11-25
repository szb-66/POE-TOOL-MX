import { spawn } from 'child_process'
import net from 'node:net'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { runManagedElectronSession } from './devProcess.js'
import { createDevelopmentStartupTrace } from '../shared/developmentStartupTrace.js'
import { createDevServerReadySignal } from '../shared/devServerReady.js'
import { DEVELOPMENT_RESTART_EXIT_CODE } from '../electron/modules/lifecycle/restart.js'

process.env.POE_STARTUP_RUN_ID ||= `${Date.now()}-${process.pid}`
process.env.POE_STARTUP_STARTED_AT ||= String(Math.floor(performance.timeOrigin))
let trace = createDevelopmentStartupTrace()
const initialRunId = process.env.POE_STARTUP_RUN_ID
trace.record('dev-entry', 'started')
console.log(`启动计时日志：${trace.filePath}`)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const DEV_SERVER_PORT = 3000
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`
const isDevelopmentPortConflict = (error) => (
  error?.code === 'EADDRINUSE' || error?.message === `Port ${DEV_SERVER_PORT} is already in use`
)

const assertDevelopmentPortAvailable = (port) => new Promise((resolve, reject) => {
  const probe = net.createServer()
  probe.unref()
  probe.once('error', reject)
  probe.listen({ port, host: '127.0.0.1', exclusive: true }, () => {
    probe.close((closeError) => (closeError ? reject(closeError) : resolve()))
  })
})

const start = async () => {
  const diagnosticArguments = process.argv.slice(2)
  const repeatArgument = diagnosticArguments.find(value => value.startsWith('--diagnostic-repeat='))
  const repeatCount = repeatArgument ? Number(repeatArgument.split('=')[1]) : 1
  if (!Number.isInteger(repeatCount) || repeatCount < 1 || repeatCount > 10 ||
      (repeatCount > 1 && !diagnosticArguments.includes('--diagnostic-exit-after-interactive'))) {
    throw new Error('诊断重复次数须为 1–10，并配合 --diagnostic-exit-after-interactive')
  }

  // 并行启动前先做毫秒级端口预检，避免端口已被占用时白白拉起 Electron 与 Vite。
  await assertDevelopmentPortAvailable(DEV_SERVER_PORT)

  const readySignal = createDevServerReadySignal({ runId: initialRunId })
  const electronPath = require('electron')
  const electronMainPath = path.join(__dirname, '../electron/devMain.js')

  let server = null
  let viteFailure = null
  let activeElectronProcess = null
  let launches = 0

  const stopActiveElectron = () => {
    const child = activeElectronProcess
    if (!child || child.exitCode !== null || child.signalCode !== null) return
    try { child.kill() } catch {}
  }

  // 1. 并行启动 Vite 开发服务器与首轮 Electron，将两者的冷启动磁盘 I/O 重叠。
  const viteReadyPromise = (async () => {
    const { createServer } = await trace.measure('vite-import', () => import('vite'))
    const createdServer = await trace.measure('vite-create', () => createServer({
      configFile: 'vite.config.js',
      mode: 'development'
    }))
    server = createdServer
    try {
      await trace.measure('vite-listen', () => createdServer.listen())
    } catch (error) {
      server = null
      await createdServer.close().catch(() => {})
      throw error
    }
    readySignal.markReady()
    console.log(`Vite server running at: ${DEV_SERVER_URL}`)
    return createdServer
  })().catch(error => {
    viteFailure = error
    readySignal.markFailed(error?.code || 'vite_startup_failed')
    stopActiveElectron()
    throw error
  })
  // 避免 Electron 先退出时产生未处理拒绝警告；真正错误由会话层统一抛出。
  void viteReadyPromise.catch(() => {})

  const spawnElectron = () => new Promise((resolve, reject) => {
    launches += 1
    if (launches > 1) {
      process.env.POE_STARTUP_RUN_ID = `${initialRunId}-${launches}`
      process.env.POE_STARTUP_STARTED_AT = String(Date.now())
      trace = createDevelopmentStartupTrace()
      trace.record('electron-restart', 'started')
      console.log(`启动计时日志：${trace.filePath}`)
    }
    trace.record('electron-spawn', 'started')
    // 传递固定开发服务器地址；专用退出码会在同一 Vite 生命周期内重新拉起 Electron。
    const electronProcess = spawn(electronPath, [electronMainPath, ...diagnosticArguments], {
      env: {
        ...process.env,
        NODE_ENV: 'development',
        VITE_DEV_SERVER_URL: DEV_SERVER_URL,
        POE_DEV_SERVER_READY_FILE: readySignal.filePath,
        POE_DEV_PARENT_PID: String(process.pid)
      },
      stdio: 'inherit'
    })
    activeElectronProcess = electronProcess
    electronProcess.once('spawn', () => trace.record('electron-spawn'))
    electronProcess.once('error', error => {
      if (activeElectronProcess === electronProcess) activeElectronProcess = null
      trace.record('electron-spawn', 'failed', error.code)
      reject(error)
    })
    electronProcess.once('close', code => {
      if (activeElectronProcess === electronProcess) activeElectronProcess = null
      trace.record('electron-exit', code === 0 ? 'succeeded' : 'stopped', String(code ?? 'signal'))
      resolve(code === 0 && launches < repeatCount ? DEVELOPMENT_RESTART_EXIT_CODE : (code ?? 1))
    })
  })

  // 2. 立即拉起首轮 Electron，窗口加载前由主进程等待 Vite 就绪信号。
  let pendingInitialElectron = spawnElectron()

  const launchElectron = async () => {
    const electronRun = pendingInitialElectron || spawnElectron()
    pendingInitialElectron = null
    const exitCode = await electronRun
    if (viteFailure) throw viteFailure
    return exitCode
  }

  const closeServer = async () => {
    stopActiveElectron()
    try {
      const startedServer = await viteReadyPromise.catch(() => server)
      if (startedServer) await startedServer.close()
    } finally {
      readySignal.cleanup()
    }
  }

  const exitCode = await runManagedElectronSession({
    launchElectron,
    closeServer
  })
  if (viteFailure) throw viteFailure
  return exitCode
}

start().then((code) => {
  process.exitCode = code ?? 0
}).catch((error) => {
  trace.record('dev-entry', 'failed', error.code || 'startup_failed')
  if (isDevelopmentPortConflict(error)) {
    console.error(`开发端口 ${DEV_SERVER_PORT} 已被占用。请关闭旧的开发进程后重试，应用不会切换端口以免读取到另一份本地数据。`)
  } else {
    console.error(error)
  }
  process.exit(1)
})
