import { createServer } from 'vite'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { runManagedElectronSession } from './devProcess.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const DEV_SERVER_PORT = 3000
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`
const isDevelopmentPortConflict = (error) => (
  error?.code === 'EADDRINUSE' || error?.message === `Port ${DEV_SERVER_PORT} is already in use`
)

const start = async () => {
  // 1. 创建并启动 Vite 开发服务器
  const server = await createServer({
    configFile: 'vite.config.js',
    mode: 'development'
  })

  await server.listen()
  
  console.log(`Vite server running at: ${DEV_SERVER_URL}`)

  // 2. 获取 electron 可执行文件路径
  const electronPath = require('electron')
  const electronMainPath = path.join(__dirname, '../electron/main.js')
  const diagnosticArguments = process.argv.slice(2)
  const launchElectron = () => new Promise((resolve, reject) => {
    // 传递固定开发服务器地址；专用退出码会在同一 Vite 生命周期内重新拉起 Electron。
    const electronProcess = spawn(electronPath, [electronMainPath, ...diagnosticArguments], {
      env: {
        ...process.env,
        NODE_ENV: 'development',
        VITE_DEV_SERVER_URL: DEV_SERVER_URL
      },
      stdio: 'inherit'
    })
    electronProcess.once('error', reject)
    electronProcess.once('close', code => resolve(code ?? 1))
  })

  return runManagedElectronSession({
    launchElectron,
    closeServer: () => server.close()
  })
}

start().then((code) => {
  process.exitCode = code ?? 0
}).catch((error) => {
  if (isDevelopmentPortConflict(error)) {
    console.error(`开发端口 ${DEV_SERVER_PORT} 已被占用。请关闭旧的开发进程后重试，应用不会切换端口以免读取到另一份本地数据。`)
  } else {
    console.error(error)
  }
  process.exit(1)
})
