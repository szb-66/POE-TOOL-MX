/**
 * Purpose: 注册 Python 脚本执行相关的 IPC 处理器
 * Inputs: python (object) - Python 管理模块，window (object) - 窗口管理模块，fileWatcher (object) - 文件监听模块
 * Outputs: 注册 IPC 处理器，无返回值
 * Preconditions: Python 环境已配置，窗口已创建
 * Edge cases: Python 未找到时返回错误；进程终止失败时静默处理
 * Errors: Python 路径未找到时抛出错误；进程启动失败时返回错误
 */

import { ipcMain } from 'electron'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { createPythonProcess, resolveCraftingPython } from '../python/launcher.js'

export function registerPythonHandlers(python, window, fileWatcher) {
  const { 
    detectPythonPath, 
    killPythonProcessTree, 
    getCurrentScriptProcess, 
    getCurrentScriptMode,
    setCurrentScriptProcess, 
    clearCurrentScriptProcess 
  } = python
  const { getMainWindow, getOverlayWindow } = window
  const intentionallyStopped = new WeakSet()

  const sendScriptStatus = (payload) => {
    const mainWindow = getMainWindow()
    if (!mainWindow || mainWindow.isDestroyed()) return
    mainWindow.webContents.send('script-status-changed', payload)
  }

  // IPC: 执行Python脚本
  ipcMain.handle('execute-python', async (event, scriptPath, args) => {
    return new Promise((resolve, reject) => {
      const pythonPath = detectPythonPath()
      
      if (!pythonPath) {
        reject(new Error('未找到Python可执行文件，请确保已安装Python 3'))
        return
      }

      const pythonProcess = spawn(pythonPath, [scriptPath, ...args], {
        shell: true,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8'
        }
      })

      setCurrentScriptProcess(pythonProcess)

      let output = ''
      let error = ''

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString('utf8')
      })

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString('utf8')
      })

      pythonProcess.on('close', (code) => {
        clearCurrentScriptProcess()
        if (code === 0) {
          resolve(output)
        } else {
          reject(new Error(error || `进程退出，代码：${code}`))
        }
      })

      pythonProcess.on('error', (err) => {
        clearCurrentScriptProcess()
        reject(err)
      })
    })
  })

  // 停止脚本执行
  ipcMain.handle('stop-script', async () => {
    const currentScriptProcess = getCurrentScriptProcess()
    if (currentScriptProcess) {
      try {
        const pid = currentScriptProcess.pid
        const mode = getCurrentScriptMode()
        intentionallyStopped.add(currentScriptProcess)
        
        // 使用进程树终止函数
        const success = await killPythonProcessTree(pid)
        
        if (!success) {
          // 如果进程树终止失败，尝试直接kill
          try {
            if (currentScriptProcess && !currentScriptProcess.killed) {
              currentScriptProcess.kill('SIGTERM')
              await new Promise(resolve => setTimeout(resolve, 500))
              if (currentScriptProcess && !currentScriptProcess.killed) {
                currentScriptProcess.kill('SIGKILL')
              }
            }
          } catch (e) {
            // 直接kill失败
          }
        }
        
        // 发送脚本停止事件到overlay（用于地图制作）
        const overlayWindow = getOverlayWindow()
        const filePaths = fileWatcher.getFilePaths()
        const currentConfig = fileWatcher.getCurrentConfig()
        
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          // 尝试读取脚本写入的统计信息
          let finalProcessedCount = 0
          let finalQualifiedCount = 0
          let finalBlacklistStats = {}
          let finalWhitelistStats = {}
          
          try {
            if (fs.existsSync(filePaths.itemInfoResultFile)) {
              const content = fs.readFileSync(filePaths.itemInfoResultFile, 'utf8')
              if (content) {
                const result = JSON.parse(content)
                if (result.processed_count !== undefined && result.processed_count !== null) {
                  finalProcessedCount = result.processed_count
                }
                if (result.qualified_count !== undefined && result.qualified_count !== null) {
                  finalQualifiedCount = result.qualified_count
                }
                if (result.blacklist_stats !== undefined && result.blacklist_stats !== null) {
                  finalBlacklistStats = result.blacklist_stats
                }
                if (result.whitelist_stats !== undefined && result.whitelist_stats !== null) {
                  finalWhitelistStats = result.whitelist_stats
                }
              }
            }
          } catch (e) {
            // 忽略读取错误
          }
          
          overlayWindow.webContents.send('script-stopped', {
            code: null,
            mapStats: currentConfig?.map ? {
              processedCount: finalProcessedCount,
              qualifiedCount: finalQualifiedCount,
              blacklistStats: finalBlacklistStats,
              whitelistStats: finalWhitelistStats
            } : null
          })
        }
        
        clearCurrentScriptProcess()
        fileWatcher.stopFileWatcher()
        sendScriptStatus({
          status: 'stopped',
          mode,
          processId: pid,
          exitCode: null
        })
        return { success: true }
      } catch (error) {
        const mode = getCurrentScriptMode()
        const processId = currentScriptProcess.pid
        clearCurrentScriptProcess()
        fileWatcher.stopFileWatcher()
        sendScriptStatus({
          status: 'error',
          mode,
          processId,
          exitCode: null,
          error: error.message
        })
        return { success: false, error: error.message }
      }
    }
    return { success: true, message: '没有正在执行的脚本', isRunning: false, processId: null, mode: null }
  })

  // 获取脚本执行状态
  ipcMain.handle('get-script-status', async () => {
    const currentScriptProcess = getCurrentScriptProcess()
    const mode = getCurrentScriptMode()
    // 检查进程是否真正存活
    if (currentScriptProcess) {
      // 检查进程是否已被终止
      if (currentScriptProcess.killed || currentScriptProcess.exitCode !== null) {
        clearCurrentScriptProcess()
        fileWatcher.stopFileWatcher()
        return {
          isRunning: false,
          processId: null,
          mode: null
        }
      }
      
      // 尝试发送信号0来检查进程是否存活（Windows不支持，但可以尝试）
      try {
        // 在Windows上，如果进程不存在，kill会抛出错误
        currentScriptProcess.kill(0) // 信号0用于检查进程是否存在
      } catch (error) {
        // 进程不存在，清理引用
        clearCurrentScriptProcess()
        fileWatcher.stopFileWatcher()
        return {
          isRunning: false,
          processId: null,
          mode: null
        }
      }
      
      return {
        isRunning: true,
        processId: currentScriptProcess.pid,
        mode
      }
    }
    
    return {
      isRunning: false,
      processId: null,
      mode: null
    }
  })

  // 检测Python路径
  ipcMain.handle('detect-python-path', async () => {
    const pythonPath = detectPythonPath()
    return {
      path: pythonPath,
      found: pythonPath !== null
    }
  })

  // 生成并执行脚本
  ipcMain.handle('generate-and-execute-script', async (event, config) => {
    try {
      const filePaths = fileWatcher.getFilePaths()
      const mainWindow = getMainWindow()
      const mode = config?.mode === 'items' || config?.mode === 'map' ? config.mode : null
      
      // 如果已有脚本在运行，先停止
      const currentScriptProcess = getCurrentScriptProcess()
      if (currentScriptProcess) {
        const previousMode = getCurrentScriptMode()
        const previousProcessId = currentScriptProcess.pid
        intentionallyStopped.add(currentScriptProcess)
        try {
          // 使用进程树终止函数确保完全终止
          const pid = currentScriptProcess.pid
          await killPythonProcessTree(pid)
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (killError) {
          try {
            currentScriptProcess.kill('SIGKILL')
          } catch (e) {
            // 强制终止失败
          }
        }
        clearCurrentScriptProcess()
        fileWatcher.stopFileWatcher()
        sendScriptStatus({
          status: 'stopped',
          mode: previousMode,
          processId: previousProcessId,
          exitCode: null
        })
      }

      // 接收渲染进程传递的脚本内容
      const scriptContent = config?.scriptContent
      if (typeof scriptContent !== 'string' || !scriptContent.trim()) {
        return { success: false, error: '生成的制作脚本为空，无法启动' }
      }
      const scriptPath = config.scriptPath || path.join(filePaths.tempDir, 'crafting.py')

      // 制作脚本同时依赖 pynput 与 pyperclip，不能回退到仅能执行 Python 的解释器。
      const pythonPath = resolveCraftingPython(python)
      if (!pythonPath) {
        return { success: false, error: '未找到同时具备 pynput 和 pyperclip 的 Python 3，请先安装制作脚本依赖' }
      }

      // 保存脚本到文件
      fs.writeFileSync(scriptPath, scriptContent, 'utf8')

      // 启动文件监听
      if (config.preset) {
        fileWatcher.startFileWatcher(config.preset)
      }

      const launch = createPythonProcess({ pythonPath, scriptPath })
      const pythonProcess = launch.process

      setCurrentScriptProcess(pythonProcess, mode)

      // 捕获标准输出
      let stdout = ''
      let stderr = ''
      
      // 确保输出事件在进程创建后立即绑定
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString('utf8')
        stdout += output
        
        // 发送到渲染进程控制台
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('python-script-output', {
            type: 'stdout',
            data: output
          })
        }

        // 如果有覆盖层，也发送到覆盖层，以便提取进度信息
        const currentOverlayWindow = getOverlayWindow()
        if (currentOverlayWindow && !currentOverlayWindow.isDestroyed()) {
          currentOverlayWindow.webContents.send('python-script-output', {
            type: 'stdout',
            data: output
          })
        }
      })

      pythonProcess.stderr.on('data', (data) => {
        const output = data.toString('utf8')
        stderr += output
        
        // 发送到渲染进程控制台（重要：确保错误信息也能看到）
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('python-script-output', {
            type: 'stderr',
            data: output
          })
        }
      })
      
      // 监听进程错误事件
      pythonProcess.on('error', (err) => {
        const errorMsg = `[错误] Python进程启动失败: ${err.message}`
        stderr += errorMsg
        const wasCurrent = getCurrentScriptProcess() === pythonProcess
        if (wasCurrent) clearCurrentScriptProcess()
        fileWatcher.stopFileWatcher()
        if (wasCurrent && !intentionallyStopped.has(pythonProcess)) {
          sendScriptStatus({
            status: 'error',
            mode,
            processId: pythonProcess.pid ?? null,
            exitCode: null,
            error: err.message
          })
        }
        
        // 发送错误到渲染进程
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('python-script-output', {
            type: 'stderr',
            data: errorMsg + '\n'
          })
        }
      })

      pythonProcess.on('close', (code) => {
        const wasCurrent = getCurrentScriptProcess() === pythonProcess
        if (wasCurrent) clearCurrentScriptProcess()
        fileWatcher.stopFileWatcher()
        if (wasCurrent && !intentionallyStopped.has(pythonProcess)) {
          sendScriptStatus({
            status: code === 0 ? 'stopped' : 'error',
            mode,
            processId: pythonProcess.pid ?? null,
            exitCode: code,
            error: code === 0 ? undefined : (stderr.trim() || `脚本异常退出，退出代码: ${code}`)
          })
        }
        
        // 发送脚本停止事件到overlay（用于地图制作）
        const currentOverlayWindow = getOverlayWindow()
        const currentConfig = fileWatcher.getCurrentConfig()
        
        if (currentOverlayWindow && !currentOverlayWindow.isDestroyed()) {
          // 尝试读取脚本写入的统计信息
          let finalProcessedCount = 0
          let finalQualifiedCount = 0
          let finalBlacklistStats = {}
          let finalWhitelistStats = {}
          
          try {
            if (fs.existsSync(filePaths.itemInfoResultFile)) {
              const content = fs.readFileSync(filePaths.itemInfoResultFile, 'utf8')
              if (content) {
                const result = JSON.parse(content)
                if (result.processed_count !== undefined && result.processed_count !== null) {
                  finalProcessedCount = result.processed_count
                }
                if (result.qualified_count !== undefined && result.qualified_count !== null) {
                  finalQualifiedCount = result.qualified_count
                }
                if (result.blacklist_stats !== undefined && result.blacklist_stats !== null) {
                  finalBlacklistStats = result.blacklist_stats
                }
                if (result.whitelist_stats !== undefined && result.whitelist_stats !== null) {
                  finalWhitelistStats = result.whitelist_stats
                }
              }
            }
          } catch (e) {
            // 忽略读取错误
          }
          
          currentOverlayWindow.webContents.send('script-stopped', {
            code,
            mapStats: currentConfig?.map ? {
              processedCount: finalProcessedCount,
              qualifiedCount: finalQualifiedCount,
              blacklistStats: finalBlacklistStats,
              whitelistStats: finalWhitelistStats
            } : null
          })
        }
        
        // 如果有错误输出，确保显示
        if (code !== 0) {
          if (stderr) {
            // 发送错误信息到渲染进程
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('python-script-output', {
                type: 'stderr',
                data: `[错误] 脚本异常退出，退出代码: ${code}\n错误信息:\n${stderr}\n`
              })
            }
          } else if (!stdout) {
            // 如果既没有stdout也没有stderr，可能是启动失败
            const errorMsg = `[错误] 脚本启动失败，退出代码: ${code}，没有任何输出\n可能原因：\n1. Python环境问题\n2. 缺少依赖包（pynput、pyperclip）\n3. 脚本文件路径错误\n`
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('python-script-output', {
                type: 'stderr',
                data: errorMsg
              })
            }
          }
        }
        
        // 通知渲染进程脚本已退出
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('python-script-output', {
            type: 'stdout',
            data: `[系统] Python脚本已退出，退出代码: ${code}\n`
          })
        }
      })

      try {
        await launch.started
      } catch (error) {
        if (getCurrentScriptProcess() === pythonProcess) clearCurrentScriptProcess()
        fileWatcher.stopFileWatcher()
        return { success: false, error: `Python进程启动失败: ${error.message}` }
      }

      sendScriptStatus({
        status: 'running',
        mode,
        processId: pythonProcess.pid,
        exitCode: null
      })

      // 进程已由操作系统确认创建后，再显示覆盖层并向 renderer 报告成功。
      let currentOverlayWindow = getOverlayWindow()
      if (!currentOverlayWindow) {
        currentOverlayWindow = window.createOverlayWindow()
      }

      if (currentOverlayWindow && !currentOverlayWindow.isDestroyed()) {
        currentOverlayWindow.webContents.send('update-overlay', { reset: true })
      }

      return { success: true, processId: pythonProcess.pid, mode }
    } catch (error) {
      fileWatcher.stopFileWatcher()
      clearCurrentScriptProcess()
      return { success: false, error: error.message }
    }
  })
}

