import { app } from 'electron'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CHAOS_ERROR_CODES, ChaosRecipeError } from './errors.js'
import { resolveStashGridLayout } from './layout.js'
import { pythonAutomationTiming } from '../../../src/utils/operationDelay.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

function parseEvents(onEvent, onLog) {
  let buffer = ''
  return (chunk) => {
    buffer += String(chunk)
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('EVENT ')) {
        if (line.trim()) onLog(line)
        continue
      }
      try { onEvent(JSON.parse(line.slice(6))) } catch { onLog(line) }
    }
  }
}

function stopChild(child) {
  if (!child || child.killed) return
  child.kill('SIGTERM')
  setTimeout(() => { if (child.exitCode === null) child.kill('SIGKILL') }, 1500)
}

export class ChaosRecipeAutomationManager {
  constructor({
    python, fileWatcher, getMainWindow, overlay, onItemPicked = null,
    automationLock = null, onStatusChange = null
  }) {
    this.python = python
    this.fileWatcher = fileWatcher
    this.getMainWindow = getMainWindow
    this.overlay = overlay
    this.onItemPicked = onItemPicked
    this.automationLock = automationLock
    this.onStatusChange = onStatusChange
    this.child = null
    this.plan = null
    this.config = null
    this.tabIndex = 0
    this.itemOffset = 0
    this.completedItems = 0
    this.status = 'idle'
    this.code = ''
    this.reason = ''
    this.intentionalStop = false
  }

  send(event) {
    const payload = {
      code: this.code,
      reason: this.reason,
      ...event,
      status: this.status,
      completedItems: this.completedItems,
      totalItems: this.plan?.itemCount || 0
    }
    const window = this.getMainWindow?.()
    if (window && !window.isDestroyed()) window.webContents.send('chaos-recipe-automation-event', payload)
    this.onStatusChange?.(payload)
  }

  scriptPath() {
    const candidates = app.isPackaged
      ? [path.join(process.resourcesPath, 'chaos_recipe_pick_template.py')]
      : [
          path.resolve(moduleDir, '../../../src/assets/scripts/chaos_recipe_pick_template.py'),
          path.join(app.getAppPath(), 'src/assets/scripts/chaos_recipe_pick_template.py')
        ]
    const found = candidates.find((candidate) => fs.existsSync(candidate))
    if (!found) throw new Error('混沌配方取件脚本不存在')
    return found
  }

  pythonPath() {
    const required = ['pyperclip', 'pynput']
    const found = this.python.detectPythonPathWithModules?.(required) || this.python.detectPythonPath?.()
    if (!found) throw new Error('未找到具备 pyperclip、pynput 的 Python 3')
    return found
  }

  currentTab() {
    return this.plan?.tabs?.[this.tabIndex] || null
  }

  clearCheckpoint() {
    this.plan = null
    this.config = null
    this.tabIndex = 0
    this.itemOffset = 0
    this.completedItems = 0
  }

  overlayCurrent(message = '') {
    const tab = this.currentTab()
    if (!tab) return
    const remaining = tab.items.slice(this.itemOffset)
    const { region } = resolveStashGridLayout(tab, this.config.calibration)
    this.overlay.create({
      region,
      tabId: tab.tabId,
      tabName: tab.tabName,
      columns: tab.columns,
      items: remaining,
      status: this.status,
      recipeId: this.plan?.recipeId,
      recipeLabel: this.plan?.recipeLabel,
      message
    })
  }

  start(plan, config = {}) {
    if (this.status !== 'idle' && this.status !== 'stopped' && this.status !== 'completed') {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.AUTOMATION_RUNNING, '商店配方取件正在运行')
    }
    const gate = this.automationLock?.acquire('混沌配方取件') || { success: true }
    if (!gate.success) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.AUTOMATION_RUNNING, gate.error)
    }
    this.plan = structuredClone(plan)
    this.config = structuredClone(config)
    this.tabIndex = 0
    this.itemOffset = 0
    this.completedItems = 0
    this.status = 'running'
    this.code = ''
    this.reason = ''
    this.overlayCurrent()
    try {
      return this.spawnCurrentTab()
    } catch (error) {
      this.status = 'stopped'
      this.code = error?.code || ''
      this.reason = error?.message || '启动自动取件失败'
      this.clearCheckpoint()
      this.automationLock?.release('混沌配方取件')
      throw error
    }
  }

  spawnCurrentTab() {
    const tab = this.currentTab()
    const items = tab?.items?.slice(this.itemOffset) || []
    if (!tab || !items.length) return this.advanceTab()
    const runtime = {
      items,
      templates: this.config.templates || {},
      match_threshold: Number(this.config.matchThreshold || 0.8),
      ...pythonAutomationTiming(this.config)
    }
    const configPath = path.join(this.fileWatcher.getFilePaths().tempDir, 'chaos_recipe_pick_config.json')
    fs.writeFileSync(configPath, JSON.stringify(runtime, null, 2), 'utf8')
    const child = spawn(this.pythonPath(), [this.scriptPath(), '--config', configPath], {
      shell: false,
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' }
    })
    this.child = child
    this.intentionalStop = false
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', parseEvents(
      (event) => this.handleEvent(child, event),
      (line) => console.log('[混沌配方取件]', line)
    ))
    child.stderr.on('data', (line) => console.error('[混沌配方取件]', String(line).trim()))
    child.on('error', (error) => {
      if (this.child === child) this.fail(error.message)
    })
    child.on('close', (code) => this.handleClose(child, code))
    this.send({ event: 'started', tabId: tab.tabId, tabName: tab.tabName, processId: child.pid })
    return { success: true, status: this.status, tabName: tab.tabName, processId: child.pid }
  }

  handleEvent(child, event) {
    if (this.child !== child) return
    if (event.event === 'item-picked') {
      this.itemOffset += 1
      this.completedItems += 1
      this.onItemPicked?.(event.itemId)
      this.overlayCurrent()
      this.send(event)
    } else if (event.event === 'completed') {
      this.intentionalStop = true
      this.child = null
      this.advanceTab()
    } else if (event.event === 'aborted' || event.event === 'error') {
      if (event.code === CHAOS_ERROR_CODES.INVENTORY_FULL) {
        this.pauseForInventoryFull(child, event)
      } else if (event.code === CHAOS_ERROR_CODES.GAME_NOT_FOREGROUND) {
        this.pauseForForegroundLoss(child, event)
      } else {
        this.fail(event.reason || '取件脚本停止', event.code)
      }
    }
  }

  pauseForInventoryFull(child, event = {}) {
    this.status = 'paused'
    this.code = CHAOS_ERROR_CODES.INVENTORY_FULL
    this.reason = event.reason || '背包空间不足，请清空背包后继续'
    this.intentionalStop = true
    this.child = null
    stopChild(child)
    this.overlayCurrent(this.reason)
    this.send({ event: 'paused', code: this.code, reason: this.reason })
  }

  pauseForForegroundLoss(child, event = {}) {
    this.status = 'paused'
    this.code = CHAOS_ERROR_CODES.GAME_NOT_FOREGROUND
    this.reason = event.reason || '游戏窗口运行中失去前台，请返回游戏后继续'
    this.intentionalStop = true
    this.child = null
    stopChild(child)
    this.overlayCurrent(this.reason)
    this.send({ event: 'paused', code: this.code, reason: this.reason })
  }

  handleClose(child, code) {
    if (this.child !== child) return
    this.child = null
    if (this.intentionalStop || this.status === 'paused' || this.status === 'stopped') return
    if (code !== 0) this.fail(`取件进程异常退出（${code}）`)
  }

  advanceTab() {
    this.tabIndex += 1
    this.itemOffset = 0
    if (this.tabIndex >= (this.plan?.tabs?.length || 0)) {
      this.status = 'completed'
      this.code = ''
      this.reason = ''
      this.overlay.close()
      this.automationLock?.release('混沌配方取件')
      this.send({ event: 'completed' })
      return { success: true, status: this.status }
    }
    this.status = 'paused'
    this.code = ''
    this.reason = 'tab-change'
    const tab = this.currentTab()
    this.overlayCurrent(`请切换到仓库页“${tab.tabName}”，然后继续`)
    this.send({ event: 'tab-change-required', tabId: tab.tabId, tabName: tab.tabName })
    return { success: true, status: this.status, tabName: tab.tabName }
  }

  pause() {
    if (this.status !== 'running') return { success: false, status: this.status }
    this.status = 'paused'
    this.code = ''
    this.reason = 'user'
    this.intentionalStop = true
    stopChild(this.child)
    this.child = null
    this.overlayCurrent('已暂停')
    this.send({ event: 'paused', reason: 'user' })
    return { success: true, status: this.status }
  }

  resume() {
    if (this.status !== 'paused') return { success: false, status: this.status }
    this.status = 'running'
    this.code = ''
    this.reason = ''
    this.overlayCurrent()
    return this.spawnCurrentTab()
  }

  stop(reason = 'user') {
    this.status = 'stopped'
    this.code = ''
    this.reason = reason
    this.intentionalStop = true
    const child = this.child
    this.child = null
    stopChild(child)
    this.overlay.close()
    this.automationLock?.release('混沌配方取件')
    this.clearCheckpoint()
    this.send({ event: 'stopped', reason })
    return { success: true, status: this.status }
  }

  fail(reason, code = CHAOS_ERROR_CODES.ITEM_MISMATCH) {
    this.status = 'stopped'
    this.code = code
    this.reason = reason
    this.intentionalStop = true
    const child = this.child
    this.child = null
    stopChild(child)
    this.overlay.close()
    this.automationLock?.release('混沌配方取件')
    this.clearCheckpoint()
    this.send({ event: 'error', reason, code })
  }

  reset(reason = 'reset') {
    if (this.child || ['running', 'paused'].includes(this.status)) return this.stop(reason)
    this.clearCheckpoint()
    this.automationLock?.release('混沌配方取件')
    return this.getStatus()
  }

  getStatus() {
    return {
      status: this.status,
      completedItems: this.completedItems,
      totalItems: this.plan?.itemCount || 0,
      tabIndex: this.tabIndex,
      tabName: this.currentTab()?.tabName || '',
      code: this.code,
      reason: this.reason
    }
  }

  cleanup() {
    this.reset('application-exit')
    this.overlay.close()
  }
}
