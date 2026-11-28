/** 战斗辅助 IPC：管理独立自动喝药进程、像素采样、安全区自动暂停与一键回城。 */
import { ipcMain } from 'electron'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import {
  createDefaultCombatAreaGate,
  evaluateCombatAreaGate,
  normalizeCombatAssist,
  validateLoopAssist,
  validatePortalAssist,
  validatePotionAssist
} from '../../../shared/combatAssist.js'
import { normalizeAutomationTiming, pythonAutomationTiming } from '../../../src/utils/operationDelay.js'
import { spawnOperationProcess } from '../elevatedAutomation/index.js'
import { stopPythonProcess } from '../python/process.js'

const COMBAT_SCRIPT_TEMPLATE = new URL('../../../src/assets/scripts/combat_assist_template.py', import.meta.url)
const AUTO_PAUSE_START_WAIT_MS = 800

let potionProcess = null
let loopProcess = null
let portalProcess = null
let processTools = null
let clientEventsService = null
let unsubscribeClientEvents = null
let potionConfigPath = ''
let potionConfigRevision = 0
let latestPotionConfig = null
let loopConfigPath = ''
let loopConfigRevision = 0
let latestLoopConfig = null
let latestAutomationTiming = pythonAutomationTiming()
let autoPauseInSafeZone = true
let latestAreaGate = createDefaultCombatAreaGate()

function isAlive(processRef) {
  return Boolean(processRef && !processRef.killed && processRef.exitCode === null)
}

function sendStatus(window, payload) {
  const mainWindow = window?.getMainWindow?.()
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('combat-status', payload)
  }
}

function areaGatesEqual(left, right) {
  return Boolean(left?.paused) === Boolean(right?.paused) &&
    String(left?.reason || '') === String(right?.reason || '') &&
    String(left?.areaId || '') === String(right?.areaId || '') &&
    String(left?.areaName || '') === String(right?.areaName || '') &&
    String(left?.warning || '') === String(right?.warning || '')
}

function readAreaGate(enabled = autoPauseInSafeZone) {
  const snapshot = clientEventsService?.snapshot?.() || null
  const context = clientEventsService?.currentContext?.() || null
  return evaluateCombatAreaGate({
    enabled,
    clientState: snapshot?.state || 'stopped',
    gameState: snapshot?.gameState || 'unknown',
    areaId: context?.areaId || ''
  })
}

async function ensureClientEventsForAutoPause({ waitMs = 0 } = {}) {
  if (!autoPauseInSafeZone || !clientEventsService?.ensureStarted) return
  const snapshot = clientEventsService.snapshot?.()
  if (snapshot?.enabled && ['started', 'resyncing'].includes(snapshot.state)) return
  const pending = Promise.resolve().then(() => clientEventsService.ensureStarted()).catch(() => null)
  if (waitMs > 0) {
    await Promise.race([
      pending,
      new Promise(resolve => {
        const timer = setTimeout(resolve, waitMs)
        timer.unref?.()
      })
    ])
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

function combatRuntimeConfig(config, timing = latestAutomationTiming, areaGate = latestAreaGate) {
  return {
    ...config,
    ...timing,
    paused_by_area: Boolean(areaGate?.paused)
  }
}

function writeActiveConfigsWithAreaGate(nextGate) {
  const targets = [
    [potionConfigPath, latestPotionConfig],
    [loopConfigPath, latestLoopConfig]
  ].filter(([configPath, config]) => configPath && config)
  for (const [configPath, config] of targets) {
    try {
      writeJsonAtomically(configPath, combatRuntimeConfig(config, latestAutomationTiming, nextGate))
    } catch {
      // 单次配置同步失败不中断主进程监听
    }
  }
}

function syncAreaGate({ forceEmit = false, rewriteConfigs = true } = {}) {
  const nextGate = readAreaGate(autoPauseInSafeZone)
  const changed = !areaGatesEqual(latestAreaGate, nextGate)
  latestAreaGate = nextGate
  if (changed && rewriteConfigs) {
    writeActiveConfigsWithAreaGate(nextGate)
  }
  if (changed || forceEmit) {
    sendStatus(processTools?.window, { event: 'area-gate', areaGate: nextGate })
  }
  return nextGate
}

function spawnCombatProcess({ mode, config, suffix, origin, onStatus, onFailed, onClosed }) {
  const pythonPath = processTools.python.detectPythonPath()
  if (!pythonPath) throw new Error('未找到Python可执行文件')
  const { scriptPath, configPath } = prepareFiles(processTools.fileWatcher, config, suffix)
  const child = spawnOperationProcess({
    operationId: 'combat.assist',
    pythonPath,
    scriptPath,
    args: ['--mode', mode, '--config', configPath],
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' },
    stdin: 'ignore',
    fallbackSpawn: spawn
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

async function stopCombatProcess(processRef, clear, statusPayload, errorMessage) {
  if (!isAlive(processRef)) {
    clear()
    return { success: true, stopped: false, alreadyStopped: true }
  }
  const target = processRef
  let success = await stopPythonProcess(target, {
    killTree: pid => processTools?.python?.killPythonProcessTree?.(pid)
  })
  if (!success && !isAlive(target)) success = true
  if (success) {
    clear()
    if (statusPayload) sendStatus(processTools?.window, statusPayload)
  }
  return success
    ? { success: true, stopped: true }
    : { success: false, stopped: false, error: errorMessage }
}

export function stopPotionAutomation() {
  return stopCombatProcess(
    potionProcess,
    () => { potionProcess = null },
    { running: false, event: 'stopped' },
    '停止自动喝药进程失败'
  )
}

export function stopLoopAutomation() {
  return stopCombatProcess(
    loopProcess,
    () => { loopProcess = null },
    { running: false, origin: 'loop', event: 'stopped' },
    '停止主动循环进程失败'
  )
}

export function stopPortalAutomation() {
  return stopCombatProcess(
    portalProcess,
    () => { portalProcess = null },
    null,
    '停止一键回城进程失败'
  )
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
      writeJsonAtomically(configPath, combatRuntimeConfig(config, candidate, latestAreaGate))
      written.push([configPath, config])
    }
    latestAutomationTiming = candidate
    if (targets.some(([configPath]) => configPath === potionConfigPath)) potionConfigRevision += 1
    if (targets.some(([configPath]) => configPath === loopConfigPath)) loopConfigRevision += 1
    return normalized
  } catch (error) {
    for (const [configPath, config] of written) {
      try { writeJsonAtomically(configPath, combatRuntimeConfig(config, previous, latestAreaGate)) } catch {}
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

function prepareFiles(fileWatcher, config, suffix) {
  const filePaths = fileWatcher.getFilePaths()
  const scriptPath = path.join(filePaths.tempDir, 'combat_assist.py')
  const configPath = path.join(filePaths.tempDir, `combat_${suffix}_config.json`)
  fs.mkdirSync(filePaths.tempDir, { recursive: true })
  // Even the read-only sampling IPC must never execute renderer-supplied Python.
  fs.writeFileSync(scriptPath, fs.readFileSync(COMBAT_SCRIPT_TEMPLATE, 'utf8'), 'utf8')
  writeJsonAtomically(configPath, config)
  return { scriptPath, configPath }
}

function runOnce(pythonPath, scriptPath, mode, configPath) {
  return new Promise((resolve) => {
    const child = mode === 'portal'
      ? spawnOperationProcess({
          operationId: 'combat.assist',
          pythonPath,
          scriptPath,
          args: ['--mode', mode, '--config', configPath],
          env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' },
          stdin: 'ignore',
          fallbackSpawn: spawn
        })
      : spawn(pythonPath, [scriptPath, '--mode', mode, '--config', configPath], {
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

export function registerCombatHandlers(python, window, fileWatcher, { clientEvents = null } = {}) {
  processTools = { python, window, fileWatcher }
  unsubscribeClientEvents?.()
  clientEventsService = clientEvents || null
  unsubscribeClientEvents = clientEventsService?.onSnapshot?.(() => {
    syncAreaGate()
  }) || null
  latestAreaGate = readAreaGate(autoPauseInSafeZone)

  ipcMain.handle('combat-start-potion', async (_event, payload) => {
    if (isAlive(potionProcess)) {
      return { success: true, alreadyRunning: true, processId: potionProcess.pid, areaGate: syncAreaGate({ rewriteConfigs: false }) }
    }
    try {
      const config = normalizeValidPotionConfig(payload.config)
      latestAutomationTiming = pythonAutomationTiming(payload.automationTiming)
      autoPauseInSafeZone = config.autoPauseInSafeZone !== false
      await ensureClientEventsForAutoPause({ waitMs: AUTO_PAUSE_START_WAIT_MS })
      const areaGate = syncAreaGate({ forceEmit: true, rewriteConfigs: false })
      const handle = spawnCombatProcess({
        mode: 'potion',
        config: combatRuntimeConfig(config, latestAutomationTiming, areaGate),
        suffix: 'potion',
        onStatus: status => sendStatus(window, status),
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
      sendStatus(window, { running: true, event: 'starting', processId: potionProcess.pid, areaGate })
      return { success: true, processId: potionProcess.pid, config, revision: potionConfigRevision, areaGate }
    } catch (error) {
      potionProcess = null
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('combat-stop-potion', stopPotionAutomation)

  ipcMain.handle('combat-get-potion-status', async () => ({
    running: isAlive(potionProcess),
    processId: isAlive(potionProcess) ? potionProcess.pid : null,
    revision: potionConfigRevision,
    areaGate: syncAreaGate({ rewriteConfigs: false })
  }))

  ipcMain.handle('combat-update-potion-config', async (_event, value) => {
    try {
      const config = normalizePotionConfig(value)
      const previousAutoPause = autoPauseInSafeZone
      autoPauseInSafeZone = config.autoPauseInSafeZone !== false
      if (autoPauseInSafeZone && (!previousAutoPause || isAlive(potionProcess) || isAlive(loopProcess))) {
        void ensureClientEventsForAutoPause({ waitMs: 0 })
      }
      const areaGate = readAreaGate(autoPauseInSafeZone)
      const gateChanged = !areaGatesEqual(latestAreaGate, areaGate)
      latestAreaGate = areaGate
      const configPath = potionConfigPath || path.join(fileWatcher.getFilePaths().tempDir, 'combat_potion_config.json')
      fs.mkdirSync(path.dirname(configPath), { recursive: true })
      writeJsonAtomically(configPath, combatRuntimeConfig(config, latestAutomationTiming, areaGate))
      potionConfigPath = configPath
      latestPotionConfig = config
      potionConfigRevision += 1
      if (gateChanged && loopConfigPath && latestLoopConfig) {
        try { writeJsonAtomically(loopConfigPath, combatRuntimeConfig(latestLoopConfig, latestAutomationTiming, areaGate)) } catch {}
      }
      if (gateChanged || autoPauseInSafeZone !== previousAutoPause) {
        sendStatus(window, { event: 'area-gate', areaGate })
      }
      return {
        success: true,
        config: structuredClone(latestPotionConfig),
        revision: potionConfigRevision,
        running: isAlive(potionProcess),
        areaGate
      }
    } catch (error) {
      return { success: false, error: error.message || String(error), revision: potionConfigRevision }
    }
  })

  ipcMain.handle('combat-start-loop', async (_event, payload) => {
    if (isAlive(loopProcess)) {
      return { success: true, alreadyRunning: true, processId: loopProcess.pid, areaGate: syncAreaGate({ rewriteConfigs: false }) }
    }
    try {
      const config = normalizeValidLoopConfig(payload.config)
      latestAutomationTiming = pythonAutomationTiming(payload.automationTiming)
      const validation = validateLoopAssist(config)
      if (!validation.isValid) throw new Error(validation.errors[0] || '循环按键配置无效')
      autoPauseInSafeZone = config.autoPauseInSafeZone !== false
      await ensureClientEventsForAutoPause({ waitMs: AUTO_PAUSE_START_WAIT_MS })
      const areaGate = syncAreaGate({ forceEmit: true, rewriteConfigs: false })
      const handle = spawnCombatProcess({
        mode: 'loop',
        config: combatRuntimeConfig(config, latestAutomationTiming, areaGate),
        suffix: 'loop',
        origin: 'loop',
        onStatus: status => sendStatus(window, status),
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
      sendStatus(window, { running: true, origin: 'loop', event: 'starting', processId: loopProcess.pid, areaGate })
      return { success: true, processId: loopProcess.pid, config, revision: loopConfigRevision, areaGate }
    } catch (error) {
      loopProcess = null
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('combat-stop-loop', stopLoopAutomation)

  ipcMain.handle('combat-get-loop-status', async () => ({
    running: isAlive(loopProcess),
    processId: isAlive(loopProcess) ? loopProcess.pid : null,
    revision: loopConfigRevision,
    areaGate: syncAreaGate({ rewriteConfigs: false })
  }))

  ipcMain.handle('combat-update-loop-config', async (_event, value) => {
    try {
      const config = normalizeValidLoopConfig(value)
      const previousAutoPause = autoPauseInSafeZone
      autoPauseInSafeZone = config.autoPauseInSafeZone !== false
      if (autoPauseInSafeZone && (!previousAutoPause || isAlive(potionProcess) || isAlive(loopProcess))) {
        void ensureClientEventsForAutoPause({ waitMs: 0 })
      }
      const areaGate = readAreaGate(autoPauseInSafeZone)
      const gateChanged = !areaGatesEqual(latestAreaGate, areaGate)
      latestAreaGate = areaGate
      const configPath = loopConfigPath || path.join(fileWatcher.getFilePaths().tempDir, 'combat_loop_config.json')
      fs.mkdirSync(path.dirname(configPath), { recursive: true })
      writeJsonAtomically(configPath, combatRuntimeConfig(config, latestAutomationTiming, areaGate))
      loopConfigPath = configPath
      latestLoopConfig = config
      loopConfigRevision += 1
      if (gateChanged && potionConfigPath && latestPotionConfig) {
        try { writeJsonAtomically(potionConfigPath, combatRuntimeConfig(latestPotionConfig, latestAutomationTiming, areaGate)) } catch {}
      }
      if (gateChanged || autoPauseInSafeZone !== previousAutoPause) {
        sendStatus(window, { event: 'area-gate', areaGate })
      }
      return {
        success: true,
        config: structuredClone(latestLoopConfig),
        revision: loopConfigRevision,
        running: isAlive(loopProcess),
        areaGate
      }
    } catch (error) {
      return { success: false, error: error.message || String(error), revision: loopConfigRevision }
    }
  })

  ipcMain.handle('combat-sample-pixel', async (_event, payload) => {
    try {
      const point = { x: Number(payload?.point?.x), y: Number(payload?.point?.y) }
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return { success: false, error: '采样坐标无效' }
      const pythonPath = python.detectPythonPath()
      if (!pythonPath) return { success: false, error: '未找到Python可执行文件' }
      const activation = await window.activateGameWindow('combat-sample-pixel')
      if (!activation.success) return { success: false, error: window.describeGameActivationFailure(activation.code), errorCode: activation.code }
      const { scriptPath, configPath } = prepareFiles(fileWatcher, { point }, 'sample')
      const { child: _child, ...result } = await runOnce(pythonPath, scriptPath, 'sample', configPath)
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('combat-execute-portal', async (_event, payload) => {
    if (isAlive(portalProcess)) return { success: false, busy: true, error: '回城流程正在执行' }
    try {
      const config = normalizeCombatAssist(payload.config)
      const validation = validatePortalAssist(config)
      if (!validation.isValid) return { success: false, error: validation.errors[0] || '回城配置无效' }
      const pythonPath = python.detectPythonPath()
      if (!pythonPath) return { success: false, error: '未找到Python可执行文件' }
      const activation = await window.activateGameWindow('combat-portal')
      if (!activation.success) return { success: false, error: window.describeGameActivationFailure(activation.code), errorCode: activation.code }
      const portalTiming = pythonAutomationTiming(payload.automationTiming)
      const { scriptPath, configPath } = prepareFiles(fileWatcher, combatRuntimeConfig(config, portalTiming, createDefaultCombatAreaGate()), 'portal')
      const { child: _child, ...result } = await runOnce(pythonPath, scriptPath, 'portal', configPath)
      portalProcess = null
      return result
    } catch (error) {
      portalProcess = null
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('combat-stop-portal', async () => stopPortalAutomation())
}

export async function cleanupCombatProcesses() {
  unsubscribeClientEvents?.()
  unsubscribeClientEvents = null
  const processes = [potionProcess, loopProcess, portalProcess].filter(isAlive)
  if (!processes.length) return
  await Promise.all([
    stopPotionAutomation(),
    stopLoopAutomation(),
    stopPortalAutomation()
  ])
}
