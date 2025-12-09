import { createServer } from 'vite'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

async function start() {
  // 1. 创建并启动 Vite 开发服务器
  const server = await createServer({
    configFile: 'vite.config.js',
    mode: 'development'
  })

  await server.listen()
  
  // 获取实际监听的端口（避免端口冲突）
  const address = server.httpServer.address()
  const port = address.port
  const url = `http://localhost:${port}`
  
  console.log(`Vite server running at: ${url}`)

  // 2. 获取 electron 可执行文件路径
  const electronPath = require('electron')
  const electronMainPath = path.join(__dirname, '../electron/main.js')

  // 3. 启动 Electron
  // 传递 VITE_DEV_SERVER_URL 环境变量
  const electronProcess = spawn(electronPath, [electronMainPath], {
    env: { 
      ...process.env, 
      NODE_ENV: 'development',
      VITE_DEV_SERVER_URL: url
    },
    stdio: 'inherit'
  })

  // 4. 监听 Electron 关闭事件
  electronProcess.on('close', () => {
    server.close()
    process.exit()
  })
}

start()
