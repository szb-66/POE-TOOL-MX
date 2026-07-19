/**
 * Purpose: 背包模块 IPC 处理器，负责模板匹配检测和自动入库功能
 * Inputs: python (object) - Python 管理模块，window (object) - 窗口管理模块，fileWatcher (object) - 文件监听模块
 * Outputs: 注册 IPC 处理器，无返回值
 * Preconditions: Python 环境已配置，窗口已创建
 * Edge cases: 模板图片不存在时返回错误；检测线程已运行时返回警告
 * Errors: 模板匹配失败时返回错误；入库操作失败时返回错误
 */

import { ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { app } from 'electron'

let detectionProcess = null // 模板匹配检测进程
let stashProcess = null     // 自动入库进程

export function registerBagHandlers(python, window, fileWatcher) {
  const { detectPythonPath } = python
  const { getMainWindow, getAppDataPath } = window
  const { getFilePaths } = fileWatcher

  // IPC: 启动背包检测
  ipcMain.handle('start-bag-detection', async (event, config) => {
    try {
      console.log('[背包检测] 收到启动请求, config =', JSON.stringify(config))
      // 检查是否已有检测进程在运行
      if (detectionProcess) {
        return { success: false, error: '检测进程已在运行中' }
      }

      // 验证配置
      if (!config.templates.stashTitle || !config.templates.inventoryTitle) {
        console.log('[背包检测] 校验失败: 模板未配置')
        return { success: false, error: '请先配置模板图片' }
      }

      // 准备 Python 脚本参数
      const pythonPath = detectPythonPath()
      if (!pythonPath) {
        return { success: false, error: '未找到Python可执行文件' }
      }

      // 使用模板文件路径
      const templateScriptPath = path.join(process.cwd(), 'src/assets/scripts/bag_auto_stash_template.py')
      if (!fs.existsSync(templateScriptPath)) {
        return { success: false, error: '模板脚本不存在: ' + templateScriptPath }
      }

      // 准备配置 - 为检测模式
      const detectionConfig = {
        templates: {
          stash_title: config.templates.stashTitle,
          inventory_title: config.templates.inventoryTitle,
          stash_region: config.templates.stashRegion || {
            left: 0, top: 0, right: 1920, bottom: 1080
          },
          inventory_region: config.templates.inventoryRegion || {
            left: 0, top: 0, right: 1920, bottom: 1080
          }
        },
        match_threshold: config.matchThreshold || 0.8
      }

      // 将配置写入临时文件
      const configPath = path.join(getFilePaths().tempDir, 'bag_detection_config.json')
      fs.writeFileSync(configPath, JSON.stringify(detectionConfig, null, 2), 'utf8')
      console.log('[背包检测] 配置已写入:', configPath)

      // 启动检测进程，传递模式和配置文件路径
      detectionProcess = spawn(pythonPath, [templateScriptPath, '--mode', 'detect', '--config', configPath], {
        shell: true,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8'
        }
      })
      detectionProcess.stdout.setEncoding('utf8')
      detectionProcess.stderr.setEncoding('utf8')

      // 监听进程错误
      detectionProcess.on('error', (error) => {
        console.error('[背包检测] 进程启动错误:', error)
        detectionProcess = null
      })

      // 监听进程退出
      detectionProcess.on('close', (code) => {
        console.log('[背包检测] 进程退出，代码:', code)
        detectionProcess = null

        // 通知前端检测已停止
        const mainWindow = getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('bag-detection-stopped', { code })
        }
      })

      // 监听标准错误输出
      detectionProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString('utf8')
        console.error('[背包检测] 错误输出:', errorOutput)
      })

      // 监听检测结果
      detectionProcess.stdout.on('data', (data) => {
        const output = data.toString('utf8')
        console.log('[背包检测] 输出:', output)

        // 解析检测结果
        if (output.includes('MATCH_SUCCESS')) {
          // 模板匹配成功，通知前端
          const mainWindow = getMainWindow()
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('bag-detection-match', { matched: true })
          }
        } else if (output.includes('MATCH_FAILED')) {
          // 模板匹配失败，通知前端
          const mainWindow = getMainWindow()
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('bag-detection-match', { matched: false })
          }
        }
      })

      return { success: true, processId: detectionProcess.pid }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // IPC: 停止背包检测
  ipcMain.handle('stop-bag-detection', async () => {
    try {
      if (detectionProcess) {
        // 强制终止检测进程
        detectionProcess.kill('SIGTERM')

        // 等待一段时间后强制终止
        setTimeout(() => {
          if (detectionProcess) {
            detectionProcess.kill('SIGKILL')
          }
        }, 2000)

        detectionProcess = null
      }

      // 停止入库进程（如果正在运行）
      if (stashProcess) {
        stashProcess.kill('SIGTERM')
        setTimeout(() => {
          if (stashProcess) {
            stashProcess.kill('SIGKILL')
          }
        }, 2000)
        stashProcess = null
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // IPC: 启动自动入库
  ipcMain.handle('start-bag-stash', async (event, config) => {
    try {
      console.log('[自动入库] 收到启动请求, config =', JSON.stringify(config))

      // 检查是否已有入库进程在运行
      if (stashProcess) {
        return { success: false, error: '入库进程已在运行中' }
      }

      const pythonPath = detectPythonPath()
      if (!pythonPath) {
        return { success: false, error: '未找到Python可执行文件' }
      }

      // 使用模板文件路径
      const templateScriptPath = path.join(process.cwd(), 'src/assets/scripts/bag_auto_stash_template.py')
      if (!fs.existsSync(templateScriptPath)) {
        return { success: false, error: '模板脚本不存在: ' + templateScriptPath }
      }

      // 准备配置 - 为入库模式，包含背包参数
      const stashConfig = {
        templates: {
          stash_title: config.templates?.stashTitle || '',
          inventory_title: config.templates?.inventoryTitle || ''
        },
        inventory: config.inventory || {
          startPos: { x: 2658, y: 1199 },
          slotSize: { w: 100, h: 100 }
        }
      }

      // 将配置写入临时文件
      const configPath = path.join(getFilePaths().tempDir, 'bag_stash_config.json')
      fs.writeFileSync(configPath, JSON.stringify(stashConfig, null, 2), 'utf8')
      console.log('[自动入库] 配置已写入:', configPath)

      // 启动入库进程
      stashProcess = spawn(pythonPath, [templateScriptPath, '--mode', 'stash', '--config', configPath], {
        shell: true,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8'
        }
      })
      stashProcess.stdout.setEncoding('utf8')
      stashProcess.stderr.setEncoding('utf8')

      // 监听入库进度
      stashProcess.stdout.on('data', (data) => {
        const output = data.toString('utf8')
        console.log('[自动入库]', output)

        // 解析进度信息
        const progressMatch = output.match(/PROGRESS:(\d+)/)
        if (progressMatch) {
          const progress = parseInt(progressMatch[1])
          const mainWindow = getMainWindow()
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('bag-stash-progress', { progress })
          }
        }

        // 入库完成
        if (output.includes('STASH_COMPLETED')) {
          const mainWindow = getMainWindow()
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('bag-stash-completed')
          }
        }
      })

      stashProcess.stderr.on('data', (data) => {
        console.error('[自动入库错误]', data.toString('utf8'))
      })

      stashProcess.on('close', (code) => {
        console.log(`[自动入库进程退出] 代码: ${code}`)
        stashProcess = null

        // 通知前端入库已停止
        const mainWindow = getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('bag-stash-stopped', { code })
        }
      })

      stashProcess.on('error', (error) => {
        console.error('[自动入库] 进程错误:', error)
        stashProcess = null
      })

      return { success: true, processId: stashProcess.pid }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // IPC: 停止自动入库
  ipcMain.handle('stop-bag-stash', async () => {
    try {
      if (stashProcess) {
        stashProcess.kill('SIGTERM')
        setTimeout(() => {
          if (stashProcess) {
            stashProcess.kill('SIGKILL')
          }
        }, 2000)
        stashProcess = null
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // IPC: 上传模板图片
  ipcMain.handle('upload-bag-template', async (event, sourcePath, type) => {
    try {
      // 确保模板目录存在
      const userDataPath = app.getPath('userData')
      const templateDir = path.join(userDataPath, 'templates')
      if (!fs.existsSync(templateDir)) {
        fs.mkdirSync(templateDir, { recursive: true })
      }

      // 生成目标文件名
      const ext = path.extname(sourcePath)
      const fileName = type === 'stashTitle' ? `stash_title${ext}` : `inventory_title${ext}`
      const targetPath = path.join(templateDir, fileName)

      // 复制文件
      fs.copyFileSync(sourcePath, targetPath)

      return { success: true, path: targetPath }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}
