/** 战斗辅助 IPC：管理独立自动喝药进程、像素采样和一键回城。 */
import { ipcMain } from 'electron'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { normalizeCombatAssist, validateLoopAssist, validatePotionAssist } from '../../../shared/combatAssist.js'
import { normalizeAutomationTiming, pythonAutomationTiming } from '../../../src/utils/operationDelay.js'

let potionProcess = null
let loopProcess = null
let portalProcess = null
let processTools = null
let potionConfigPath = ''
let potionConfigRevision = 0
let latestPotionConfig = null
let loopConfigPath = ''
let loopConfigRevision = 0
let latestLoopConfig = null
let latestAutomationTiming = pythonAutomationTiming()

function isAlive(processRef) {
  return Boolean(processRef && !processRef.killed && processRef.exitCode === null)
}

function sendStatus(window, payload) {
  const mainWindow = window?.getMainWindow?.()
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('combat-status', payload)
  }
}

function spawnCombatProcess({ mode, config, suffix, scriptContent, origin, onStatus, onFailed, onClosed }) {
  const pythonPath = processTools.python.detectPythonPath()
  if (!pythonPath) throw new Error('未找到Python可执行文件')
  const { scriptPath, configPath } = prepareFiles(processTools.fileWatcher, scriptContent, config, suffix)
  const child = spawn(pythonPath, [scriptPath, '--mode', mode, '--config', configPath], {
    shell: false,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  const send = payload => onStatus(origin ? { ...payload, origin } : payload)
  let outputBuffer = ''
  child.stdout.on('data', data => {
    outputBuffer += data.toString('utf8')
    const lines = outputBuffer.split(/\r?\n/)
    outputBuffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('EVENT ')) continue
      try {
        send({ running: true, ...JSON.parse(line.slice(6)) })
      } catch {
        // 忽略单行格式错误，进程继续运行
      }
    }
  })
  child.stderr.on('data', data => {
    send({ running: true, event: 'error', error: data.toString('utf8').trim() })
  })
  child.on('error', error => onFailed(error))
  child.on('close', code => onClosed(code))
  return { child, configPath }
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

function combatRuntimeConfig(config, timing = latestAutomationTiming) {
  return { ...config, ...timing }
}

export function updateCombatAutomationTiming(value = {}) {
  const normalized = normalizeAutomationTiming(value)
  const candidate = pythonAutomationTiming(normalized)
  const previous = latestAutomationTiming
  const written = []
  const targets = [
    [potionConfigPath, latestPotionConfig],
    [loopConfigPath, latestLoopConfig]
  ].filter(([configPath, config]) => configPath && config)
  try {
    for (const [configPath, config] of targets) {
      writeJsonAtomically(configPath, combatRuntimeConfig(config, candidate))
      written.push([configPath, config])
    }
    latestAutomationTiming = candidate
    if (targets.some(([configPath]) => configPath === potionConfigPath)) potionConfigRevision += 1
    if (targets.some(([configPath]) => configPath === loopConfigPath)) loopConfigRevision += 1
    return normalized
  } catch (error) {
    for (const [configPath, config] of written) {
      try { writeJsonAtomically(configPath, combatRuntimeConfig(config, previous)) } catch {}
    }
    throw error
  }
}

function normalizeValidPotionConfig(value) {
  const config = normalizeCombatAssist(value)
  const validation = validatePotionAssist(config)
  if (!validation.isValid) throw new Error(validation.errors[0] || '战斗辅助配置无效')
  return config
}

function normalizePotionConfig(value) {
  return normalizeCombatAssist(value)
}

function normalizeValidLoopConfig(value) {
  return normalizeCombatAssist(value)
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
  processTools = { python, window, fileWatcher }

  ipcMain.handle('combat-start-potion', async (_event, payload) => {
    if (isAlive(potionProcess)) {
      return { success: true, alreadyRunning: true, processId: potionProcess.pid }
    }
    try {
      const config = normalizeValidPotionConfig(payload.config)
      latestAutomationTiming = pythonAutomationTiming(payload.automationTiming)
      const handle = spawnCombatProcess({
        mode: 'potion',
        config: combatRuntimeConfig(config),
        suffix: 'potion',
        scriptContent: payload.scriptContent,
        onStatus: payload => sendStatus(window, payload),
        onFailed: error => {
          potionProcess = null
          sendStatus(window, { running: false, event: 'error', error: error.message })
        },
        onClosed: code => {
          potionProcess = null
          sendStatus(window, { running: false, event: 'stopped', code })
        }
      })
      potionProcess = handle.child
      potionConfigPath = handle.configPath
      latestPotionConfig = config
      potionConfigRevision += 1
      sendStatus(window, { running: true, event: 'starting', processId: potionProcess.pid })
      return { success: true, processId: potionProcess.pid, config, revision: potionConfigRevision }
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
      const config = normalizePotionConfig(value)
      const configPath = potionConfigPath || path.join(fileWatcher.getFilePaths().tempDir, 'combat_potion_config.json')
      fs.mkdirSync(path.dirname(configPath), { recursive: true })
      writeJsonAtomically(configPath, combatRuntimeConfig(config))
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

  ipcMain.handle('combat-start-loop', async (_event, payload) => {
    if (isAlive(loopProcess)) {
      return { success: true, alreadyRunning: true, processId: loopProcess.pid }
    }
    try {
      const config = normalizeValidLoopConfig(payload.config)
      latestAutomationTiming = pythonAutomationTiming(payload.automationTiming)
      const validation = validateLoopAssist(config)
      if (!validation.isValid) throw new Error(validation.errors[0] || '循环按键配置无效')
      const handle = spawnCombatProcess({
        mode: 'loop',
        config: combatRuntimeConfig(config),
        suffix: 'loop',
        scriptContent: payload.scriptContent,
        origin: 'loop',
        onStatus: payload => sendStatus(window, payload),
        onFailed: error => {
          loopProcess = null
          sendStatus(window, { running: false, origin: 'loop', event: 'error', error: error.message })
        },
        onClosed: code => {
          loopProcess = null
          sendStatus(window, { running: false, origin: 'loop', event: 'stopped', code })
        }
      })
      loopProcess = handle.child
      loopConfigPath = handle.configPath
      latestLoopConfig = config
      loopConfigRevision += 1
      sendStatus(window, { running: true, origin: 'loop', event: 'starting', processId: loopProcess.pid })
      return { success: true, processId: loopProcess.pid, config, revision: loopConfigRevision }
    } catch (error) {
      loopProcess = null
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('combat-stop-loop', async () => {
    if (!isAlive(loopProcess)) {
      loopProcess = null
      return { success: true, alreadyStopped: true }
    }
    const target = loopProcess
    loopProcess = null
    const success = await python.killPythonProcessTree(target.pid)
    sendStatus(window, { running: false, origin: 'loop', event: 'stopped' })
    return success ? { success: true } : { success: false, error: '停止主动循环进程失败' }
  })

  ipcMain.handle('combat-get-loop-status', async () => ({
    running: isAlive(loopProcess),
    processId: isAlive(loopProcess) ? loopProcess.pid : null,
    revision: loopConfigRevision
  }))

  ipcMain.handle('combat-update-loop-config', async (_event, value) => {
    try {
      const config = normalizeValidLoopConfig(value)
      const configPath = loopConfigPath || path.join(fileWatcher.getFilePaths().tempDir, 'combat_loop_config.json')
      fs.mkdirSync(path.dirname(configPath), { recursive: true })
      writeJsonAtomically(configPath, combatRuntimeConfig(config))
      loopConfigPath = configPath
      latestLoopConfig = config
      loopConfigRevision += 1
      return {
        success: true,
        config: structuredClone(latestLoopConfig),
        revision: loopConfigRevision,
        running: isAlive(loopProcess)
      }
    } catch (error) {
      return { success: false, error: error.message || String(error), revision: loopConfigRevision }
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
      const portalTiming = pythonAutomationTiming(payload.automationTiming)
      const { scriptPath, configPath } = prepareFiles(fileWatcher, payload.scriptContent, combatRuntimeConfig(payload.config, portalTiming), 'portal')
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
  const processes = [potionProcess, loopProcess, portalProcess].filter(isAlive)
  potionProcess = null
  loopProcess = null
  portalProcess = null
  if (!processTools?.python) return
  await Promise.all(processes.map(child => processTools.python.killPythonProcessTree(child.pid)))
}
