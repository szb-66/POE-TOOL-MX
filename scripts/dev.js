import { createServer } from 'vite'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

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

  // 3. 启动 Electron
  // 传递 VITE_DEV_SERVER_URL 环境变量
  const electronProcess = spawn(electronPath, [electronMainPath], {
    env: { 
      ...process.env, 
      NODE_ENV: 'development',
      VITE_DEV_SERVER_URL: DEV_SERVER_URL
    },
    stdio: 'inherit'
  })

  // 4. 监听 Electron 关闭事件
  electronProcess.on('close', async (code) => {
    await server.close()
    process.exit(code ?? 0)
  })
}

start().catch((error) => {
  if (isDevelopmentPortConflict(error)) {
    console.error(`开发端口 ${DEV_SERVER_PORT} 已被占用。请关闭旧的开发进程后重试，应用不会切换端口以免读取到另一份本地数据。`)
  } else {
    console.error(error)
  }
  process.exit(1)
})
