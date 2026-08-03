/** 战斗辅助 IPC：管理独立自动喝药进程、像素采样和一键回城。 */
import { ipcMain } from 'electron'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { normalizeCombatAssist, validateCombatAssist } from '../../../shared/combatAssist.js'

let potionProcess = null
let portalProcess = null
let processTools = null
let potionConfigPath = ''
let potionConfigRevision = 0
let latestPotionConfig = null

function isAlive(processRef) {
  return Boolean(processRef && !processRef.killed && processRef.exitCode === null)
}

function sendStatus(window, payload) {
  const mainWindow = window?.getMainWindow?.()
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('combat-status', payload)
  }
}

function writeJsonAtomically(filePath, value) {
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
  try {
    fs.writeFileSync(temporaryPath, JSON.stringify(value, null, 2), 'utf8')
    fs.renameSync(temporaryPath, filePath)
  } catch (error) {
    try { fs.unlinkSync(temporaryPath) } catch {}
    throw error
  }
}

function normalizeValidPotionConfig(value) {
  const config = normalizeCombatAssist(value)
  const validation = validateCombatAssist(config)
  if (!validation.isValid) throw new Error(validation.errors[0] || '战斗辅助配置无效')
  return config
}

function prepareFiles(fileWatcher, scriptContent, config, suffix) {
  const filePaths = fileWatcher.getFilePaths()
  const scriptPath = path.join(filePaths.tempDir, 'combat_assist.py')
  const configPath = path.join(filePaths.tempDir, `combat_${suffix}_config.json`)
  fs.mkdirSync(filePaths.tempDir, { recursive: true })
  fs.writeFileSync(scriptPath, scriptContent, 'utf8')
  writeJsonAtomically(configPath, config)
  return { scriptPath, configPath }
}

function runOnce(pythonPath, scriptPath, mode, configPath) {
  return new Promise((resolve) => {
    const child = spawn(pythonPath, [scriptPath, '--mode', mode, '--config', configPath], {
      shell: false,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', data => { stdout += data.toString('utf8') })
    child.stderr.on('data', data => { stderr += data.toString('utf8') })
    child.on('error', error => resolve({ success: false, error: error.message, child }))
    child.on('close', code => {
      const lines = stdout.trim().split(/\r?\n/).filter(Boolean)
      let result = null
      try {
        result = lines.length ? JSON.parse(lines.at(-1)) : null
      } catch {
        result = null
      }
      resolve({ ...(result || {}), success: result?.success ?? code === 0, error: result?.error || stderr.trim(), child })
    })
    if (mode === 'portal') portalProcess = child
  })
}

export function registerCombatHandlers(python, window, fileWatcher) {
  processTools = { python, window }

  ipcMain.handle('combat-start-potion', async (_event, payload) => {
    if (isAlive(potionProcess)) {
      return { success: true, alreadyRunning: true, processId: potionProcess.pid }
    }
    try {
      const pythonPath = python.detectPythonPath()
      if (!pythonPath) return { success: false, error: '未找到Python可执行文件' }
      const config = normalizeValidPotionConfig(payload.config)
      const { scriptPath, configPath } = prepareFiles(fileWatcher, payload.scriptContent, config, 'potion')
      potionConfigPath = configPath
      latestPotionConfig = config
      potionConfigRevision += 1
      potionProcess = spawn(pythonPath, [scriptPath, '--mode', 'potion', '--config', configPath], {
        shell: false,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' },
        stdio: ['ignore', 'pipe', 'pipe']
      })
      const processId = potionProcess.pid
      let outputBuffer = ''
      potionProcess.stdout.on('data', data => {
        outputBuffer += data.toString('utf8')
        const lines = outputBuffer.split(/\r?\n/)
        outputBuffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('EVENT ')) continue
          try {
            sendStatus(window, { running: true, ...JSON.parse(line.slice(6)) })
          } catch {
            // 忽略单行格式错误，进程继续运行
          }
        }
      })
      potionProcess.stderr.on('data', data => {
        sendStatus(window, { running: true, event: 'error', error: data.toString('utf8').trim() })
      })
      potionProcess.on('error', error => {
        potionProcess = null
        sendStatus(window, { running: false, event: 'error', error: error.message })
      })
      potionProcess.on('close', code => {
        potionProcess = null
        sendStatus(window, { running: false, event: 'stopped', code })
      })
      sendStatus(window, { running: true, event: 'starting', processId })
      return { success: true, processId, config, revision: potionConfigRevision }
    } catch (error) {
      potionProcess = null
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('combat-stop-potion', async () => {
    if (!isAlive(potionProcess)) {
      potionProcess = null
      return { success: true, alreadyStopped: true }
    }
    const target = potionProcess
    potionProcess = null
    const success = await python.killPythonProcessTree(target.pid)
    sendStatus(window, { running: false, event: 'stopped' })
    return success ? { success: true } : { success: false, error: '停止自动喝药进程失败' }
  })

  ipcMain.handle('combat-get-potion-status', async () => ({
    running: isAlive(potionProcess),
    processId: isAlive(potionProcess) ? potionProcess.pid : null,
    revision: potionConfigRevision
  }))

  ipcMain.handle('combat-update-potion-config', async (_event, value) => {
    try {
      const config = normalizeValidPotionConfig(value)
      const configPath = potionConfigPath || path.join(fileWatcher.getFilePaths().tempDir, 'combat_potion_config.json')
      fs.mkdirSync(path.dirname(configPath), { recursive: true })
      writeJsonAtomically(configPath, config)
      potionConfigPath = configPath
      latestPotionConfig = config
      potionConfigRevision += 1
      return {
        success: true,
        config: structuredClone(latestPotionConfig),
        revision: potionConfigRevision,
        running: isAlive(potionProcess)
      }
    } catch (error) {
      return { success: false, error: error.message || String(error), revision: potionConfigRevision }
    }
  })

  ipcMain.handle('combat-sample-pixel', async (_event, payload) => {
    try {
      const pythonPath = python.detectPythonPath()
      if (!pythonPath) return { success: false, error: '未找到Python可执行文件' }
      const { scriptPath, configPath } = prepareFiles(fileWatcher, payload.scriptContent, { point: payload.point }, 'sample')
      const { child: _child, ...result } = await runOnce(pythonPath, scriptPath, 'sample', configPath)
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('combat-execute-portal', async (_event, payload) => {
    if (isAlive(portalProcess)) return { success: false, busy: true, error: '回城流程正在执行' }
    try {
      const pythonPath = python.detectPythonPath()
      if (!pythonPath) return { success: false, error: '未找到Python可执行文件' }
      const { scriptPath, configPath } = prepareFiles(fileWatcher, payload.scriptContent, payload.config, 'portal')
      const { child: _child, ...result } = await runOnce(pythonPath, scriptPath, 'portal', configPath)
      portalProcess = null
      return result
    } catch (error) {
      portalProcess = null
      return { success: false, error: error.message }
    }
  })
}

export async function cleanupCombatProcesses() {
  const processes = [potionProcess, portalProcess].filter(isAlive)
  potionProcess = null
  portalProcess = null
  if (!processTools?.python) return
  await Promise.all(processes.map(child => processTools.python.killPythonProcessTree(child.pid)))
}
