import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { runManagedElectronSession } from './devProcess.js'
import { createDevelopmentStartupTrace } from '../shared/developmentStartupTrace.js'
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

const start = async () => {
  const { createServer } = await trace.measure('vite-import', () => import('vite'))
  // 1. 创建并启动 Vite 开发服务器
  const server = await trace.measure('vite-create', () => createServer({
    configFile: 'vite.config.js',
    mode: 'development'
  }))

  try { await trace.measure('vite-listen', () => server.listen()) } catch (error) {
    await server.close()
    throw error
  }
  
  console.log(`Vite server running at: ${DEV_SERVER_URL}`)

  // 2. 获取 electron 可执行文件路径
  const electronPath = require('electron')
  const electronMainPath = path.join(__dirname, '../electron/devMain.js')
  const diagnosticArguments = process.argv.slice(2)
  const repeatArgument = diagnosticArguments.find(value => value.startsWith('--diagnostic-repeat='))
  const repeatCount = repeatArgument ? Number(repeatArgument.split('=')[1]) : 1
  if (!Number.isInteger(repeatCount) || repeatCount < 1 || repeatCount > 10 ||
      (repeatCount > 1 && !diagnosticArguments.includes('--diagnostic-exit-after-interactive'))) {
    await server.close()
    throw new Error('诊断重复次数须为 1–10，并配合 --diagnostic-exit-after-interactive')
  }
  let launches = 0
  const launchElectron = () => new Promise((resolve, reject) => {
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
        VITE_DEV_SERVER_URL: DEV_SERVER_URL
      },
      stdio: 'inherit'
    })
    electronProcess.once('spawn', () => trace.record('electron-spawn'))
    electronProcess.once('error', error => { trace.record('electron-spawn', 'failed', error.code); reject(error) })
    electronProcess.once('close', code => {
      trace.record('electron-exit', code === 0 ? 'succeeded' : 'stopped', String(code ?? 'signal'))
      resolve(code === 0 && launches < repeatCount ? DEVELOPMENT_RESTART_EXIT_CODE : (code ?? 1))
    })
  })

  return runManagedElectronSession({
    launchElectron,
    closeServer: () => server.close()
  })
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
