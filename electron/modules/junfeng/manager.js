import { app, screen } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { pythonFixedTiming } from '../../../src/utils/operationDelay.js'
import { normalizeJunfengRegion } from '../../../src/utils/junfengConfig.js'
import { validateTemplateCaptureEnvironment } from '../../../src/utils/bagConfig.js'
import { getDisplayPhysicalBounds } from '../window/coordinates.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const OWNER = '君锋镇取出高亮'
const MODEL_CLASSES = ['highlighted', 'dimmed', 'empty']
const TRAINING_PROFILES = {
  junfeng: { columns: 12, rows: 11 },
  'small-stash': { columns: 12, rows: 12 },
  'large-stash': { columns: 24, rows: 24 }
}

function fileSha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function stopChild(child) {
  if (!child || child.killed) return
  child.kill('SIGTERM')
  setTimeout(() => { if (child.exitCode === null) child.kill('SIGKILL') }, 1200)
}

function parser(onEvent, onLog) {
  let buffer = ''
  return chunk => {
    buffer += String(chunk)
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('EVENT ')) { if (line.trim()) onLog(line); continue }
      try { onEvent(JSON.parse(line.slice(6))) } catch { onLog(line) }
    }
  }
}

export class JunfengHighlightManager {
  constructor({ python, fileWatcher, getMainWindow, interfaceDetection, automationLock, calibration, onStatusChange }) {
    this.python = python
    this.fileWatcher = fileWatcher
    this.getMainWindow = getMainWindow
    this.interfaceDetection = interfaceDetection
    this.automationLock = automationLock
    this.calibration = calibration
    this.onStatusChange = onStatusChange
    this.runtime = { enabled: false, gridRegion: null, grid: { columns: 12, rows: 11 }, operationDelayMs: 80 }
    this.child = null
    this.lastPreview = new Map()
    this.lastPreviewId = ''
    this.lastTrainingPreview = null
    this.trainingChild = null
    this.trainingStatus = { status: 'idle', stage: '', reason: '', report: null, modelVersion: '' }
    this.status = this.initialStatus()
    this.disposeDetection = interfaceDetection?.subscribe(state => {
      if (this.status.status === 'running' && (!state.foreground || !state.junfengReady)) {
        this.stop(!state.foreground ? 'game-not-foreground' : 'reward-interface-lost')
      }
    })
  }

  initialStatus() {
    return { status: 'idle', candidateItems: 0, remainingItems: 0, pickedItems: 0, uncertainCells: 0, reason: '', modelVersion: '' }
  }

  scriptPath() {
    const candidates = app.isPackaged
      ? [path.join(process.resourcesPath, 'junfeng_highlight_pickup.py')]
      : [path.resolve(moduleDir, '../../../src/assets/scripts/junfeng_highlight_pickup.py')]
    const found = candidates.find(fs.existsSync)
    if (!found) throw new Error('君锋镇取件脚本不存在')
    return found
  }

  modelPaths() {
    const root = app.isPackaged
      ? path.join(process.resourcesPath, 'junfeng-highlight-model')
      : path.resolve(moduleDir, '../../../src/assets/models/junfeng-highlight')
    return { model: path.join(root, 'model.onnx'), manifest: path.join(root, 'manifest.json') }
  }

  pythonPath() {
    const found = this.python.detectPythonPathWithModules?.(['cv2', 'mss', 'numpy', 'onnxruntime', 'pynput']) || this.python.detectPythonPath?.()
    if (!found) throw new Error('未找到君锋镇识别所需 Python 运行时')
    return found
  }

  setRuntime(runtime = {}) {
    const previousGrid = JSON.stringify(this.runtime.gridRegion || null)
    this.runtime = { ...this.runtime, ...structuredClone(runtime) }
    if (this.status.status === 'running' && previousGrid !== JSON.stringify(this.runtime.gridRegion || null)) {
      this.stop('grid-changed')
    }
    this.onStatusChange?.()
    return this.getStatus()
  }

  ensureReady({ modelRequired = true, requireReward = true } = {}) {
    const detection = this.interfaceDetection?.getState?.() || {}
    if (!this.runtime.enabled) throw new Error('君锋镇模块未启用')
    const configuration = this.getConfigurationAvailability()
    if (!configuration.ready) throw new Error(configuration.reason)
    if (requireReward && !detection.rewardDetected) throw new Error('未检测到君锋镇奖励标题')
    if (modelRequired) {
      const availability = this.getAvailability()
      if (!availability.ready) throw new Error(availability.reason)
    }
  }

  getAvailability() {
    const configuration = this.getConfigurationAvailability()
    if (!configuration.ready) return configuration
    const paths = this.modelPaths()
    if (!fs.existsSync(paths.manifest)) return { ready: false, reason: '君锋镇高亮模型清单不存在' }
    try {
      const manifest = JSON.parse(fs.readFileSync(paths.manifest, 'utf8'))
      if (manifest.schemaVersion !== 1 || manifest.architectureVersion !== 1 ||
          JSON.stringify(manifest.classes) !== JSON.stringify(MODEL_CLASSES)) {
        return { ready: false, reason: '君锋镇高亮模型契约不兼容' }
      }
      if (!fs.existsSync(paths.model)) return { ready: false, reason: '君锋镇高亮模型文件不存在' }
      if (!/^[a-f0-9]{64}$/i.test(String(manifest.sha256 || '')) || fileSha256(paths.model) !== String(manifest.sha256).toLowerCase()) {
        return { ready: false, reason: '君锋镇高亮模型校验失败' }
      }
      return { ready: true, reason: '', modelVersion: String(manifest.modelVersion || '') }
    } catch {
      return { ready: false, reason: '君锋镇高亮模型清单损坏' }
    }
  }

  currentDisplays() {
    return screen.getAllDisplays().map(display => {
      const physicalBounds = getDisplayPhysicalBounds(
        display,
        process.platform,
        point => screen.dipToScreenPoint?.(point) || point
      )
      return {
        id: String(display.id),
        scaleFactor: Number(display.scaleFactor || 1),
        physicalSize: { width: physicalBounds.width, height: physicalBounds.height },
        physicalBounds
      }
    })
  }

  getConfigurationAvailability(runtime = this.runtime) {
    const gridAvailability = this.getGridAvailability(runtime)
    if (!gridAvailability.ready) return gridAvailability
    const templates = runtime.templates || {}
    const displays = this.currentDisplays()
    const definitions = [
      ['背包标题', 'inventoryTitle', 'inventoryRegion', 'inventoryCapture'],
      ['君锋镇奖励标题', 'junfengRewardTitle', 'junfengRewardRegion', 'junfengRewardCapture']
    ]
    for (const [label, pathKey, regionKey, captureKey] of definitions) {
      const result = validateTemplateCaptureEnvironment(
        label,
        templates[pathKey],
        templates[regionKey],
        templates[captureKey],
        displays
      )
      if (result.error) return { ready: false, reason: result.error }
    }
    return { ready: true, reason: '' }
  }

  getGridAvailability(runtime = this.runtime) {
    const region = runtime.gridRegion
    if (!region) return { ready: false, reason: '请先框选完整的 12×11 奖励区域' }
    if (region.displayId) {
      const display = screen.getAllDisplays().find(item => String(item.id) === String(region.displayId))
      if (!display) return { ready: false, reason: '奖励网格所在显示器已变化，请重新框选' }
      if (region.scaleFactor && Math.abs(Number(display.scaleFactor) - Number(region.scaleFactor)) > 0.01) {
        return { ready: false, reason: '奖励网格所在显示器 DPI 已变化，请重新框选' }
      }
      if (region.displayPhysicalBounds) {
        const current = getDisplayPhysicalBounds(
          display,
          process.platform,
          point => screen.dipToScreenPoint?.(point) || point
        )
        const saved = region.displayPhysicalBounds
        const savedX = Number(saved.x ?? saved.left)
        const savedY = Number(saved.y ?? saved.top)
        const changed = Number(saved.width) !== Number(current.width) ||
          Number(saved.height) !== Number(current.height) ||
          (Number.isFinite(savedX) && savedX !== Number(current.x)) ||
          (Number.isFinite(savedY) && savedY !== Number(current.y))
        if (changed) return { ready: false, reason: '奖励网格所在显示器分辨率或位置已变化，请重新框选' }
      }
    }
    return { ready: true, reason: '' }
  }

  writeConfig(overrides = {}) {
    const configPath = path.join(this.fileWatcher.getFilePaths().tempDir, 'junfeng_highlight_config.json')
    const model = this.modelPaths()
    const templates = this.runtime.templates || {}
    fs.writeFileSync(configPath, JSON.stringify({
      grid_region: normalizeJunfengRegion(overrides.gridRegion || this.runtime.gridRegion),
      grid: overrides.grid || this.runtime.grid || { columns: 12, rows: 11 },
      interface_mode: 'reward',
      templates: {
        stash_title: String(templates.stashTitle || ''),
        inventory_title: String(templates.inventoryTitle || ''),
        junfeng_reward_title: String(templates.junfengRewardTitle || ''),
        stash_region: templates.stashRegion || {},
        inventory_region: templates.inventoryRegion || {},
        junfeng_reward_region: templates.junfengRewardRegion || {}
      },
      match_threshold: Number(this.runtime.matchThreshold ?? 0.8),
      highlight_threshold: 0.995,
      abort_on_uncertain: true,
      calibration_similarity: 0.965,
      calibration_index: overrides.disableCalibration ? '' : this.calibration.indexPath,
      calibration_root: overrides.disableCalibration ? '' : this.calibration.root,
      model_path: model.model,
      manifest_path: model.manifest,
      operation_delay_ms: Number(this.runtime.operationDelayMs || 80),
      fixed_timing: pythonFixedTiming(this.runtime.fixedTiming)
    }, null, 2), 'utf8')
    return configPath
  }

  spawn(args, onEvent) {
    const child = spawn(this.pythonPath(), [this.scriptPath(), ...args], {
      shell: false, windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' }
    })
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', parser(onEvent, line => console.log('[君锋镇高亮取件]', line)))
    child.stderr.on('data', line => console.error('[君锋镇高亮取件]', String(line).trim()))
    return child
  }

  preview() {
    this.ensureReady({ modelRequired: false, requireReward: false })
    return new Promise((resolve, reject) => {
      let settled = false
      const child = this.spawn(['--config', this.writeConfig(), '--preview'], event => {
        if (event.event === 'preview') {
          settled = true
          this.lastPreviewId = crypto.createHash('sha256').update(String(event.imageDataUrl || '')).digest('hex').slice(0, 24)
          this.lastPreview = new Map((event.cells || []).map(cell => [`${cell.column}:${cell.row}`, cell]))
          resolve(event)
        } else if (event.event === 'error') { settled = true; reject(new Error(event.reason || '君锋镇预览失败')) }
      })
      child.on('error', reject)
      child.on('close', code => { if (!settled) reject(new Error(`君锋镇预览进程异常退出（${code}）`)) })
    })
  }

  previewTraining({ domain, gridRegion, partition = 'train' } = {}) {
    if (app.isPackaged) throw new Error('训练工作台仅在开发版可用')
    const grid = TRAINING_PROFILES[String(domain || '')]
    if (!grid) throw new Error('训练来源无效')
    if (!gridRegion) throw new Error('请先框选当前训练来源的完整网格')
    return new Promise((resolve, reject) => {
      let settled = false
      const child = this.spawn(['--config', this.writeConfig({ gridRegion, grid, disableCalibration: true }), '--preview'], event => {
        if (event.event === 'preview') {
          settled = true
          const previewId = crypto.createHash('sha256').update(String(event.imageDataUrl || '')).digest('hex').slice(0, 24)
          const blind = ['validation', 'test'].includes(String(partition))
          this.lastTrainingPreview = { previewId, domain: String(domain), partition: String(partition), grid,
            cells: event.cells || [], rawImageDataUrl: event.rawImageDataUrl || event.imageDataUrl }
          resolve({ ...event, cells: blind ? (event.cells || []).map(cell => ({ ...cell, label: 'unknown', probability: 0 })) : event.cells,
            previewId, domain: String(domain), partition: String(partition), grid, blind })
        } else if (event.event === 'error') { settled = true; reject(new Error(event.reason || '训练采集预览失败')) }
      })
      child.on('error', reject)
      child.on('close', code => { if (!settled) reject(new Error(`训练采集进程异常退出（${code}）`)) })
    })
  }

  saveTrainingSession({ previewId, labels, partition } = {}) {
    const preview = this.lastTrainingPreview
    if (!preview || preview.previewId !== String(previewId || '')) throw new Error('训练预览已失效，请重新采集')
    const labelMap = new Map(Object.entries(labels || {}))
    const cells = preview.cells.map(cell => ({ ...cell, label: labelMap.get(`${cell.column}:${cell.row}`) || cell.label }))
    if (cells.some(cell => !MODEL_CLASSES.includes(cell.label))) throw new Error('仍有未标注格子，无法保存训练会话')
    return this.calibration.saveTrainingSession({ ...preview, cells, partition: partition || preview.partition,
      columns: preview.grid.columns, rows: preview.grid.rows })
  }

  listTrainingSessions() { return this.calibration.listTrainingSessions() }
  getTrainingSession(id) { return this.calibration.getTrainingSession(id) }
  updateTrainingSession(value) { return this.calibration.updateTrainingSession(value || {}) }
  deleteTrainingSession(id) { return this.calibration.deleteTrainingSession(id) }

  getTrainingStatus() {
    let persisted = {}
    if (!this.trainingStatus.report) {
      try {
        const manifest = JSON.parse(fs.readFileSync(this.modelPaths().manifest, 'utf8'))
        persisted = { report: manifest.benchmark || null, modelVersion: manifest.modelVersion || '' }
      } catch {}
    }
    return { ...structuredClone(this.trainingStatus), ...persisted, summary: this.calibration.trainingSummary(),
      available: !app.isPackaged }
  }

  trainingPaths() {
    const projectRoot = path.resolve(moduleDir, '../../..')
    const artifacts = path.join(projectRoot, 'artifacts', 'junfeng')
    return {
      projectRoot, artifacts,
      python: path.join(projectRoot, '.runtime', 'junfeng-training', 'Scripts', 'python.exe'),
      base: path.join(artifacts, 'combined.npz'),
      local: path.join(artifacts, 'workbench-local.npz'),
      merged: path.join(artifacts, 'workbench-combined.npz'),
      build: path.join(projectRoot, 'scripts', 'junfeng', 'build_calibration_dataset.py'),
      merge: path.join(projectRoot, 'scripts', 'junfeng', 'merge_datasets.py'),
      train: path.join(projectRoot, 'scripts', 'junfeng', 'train_model.py'),
      benchmark: path.join(projectRoot, 'scripts', 'junfeng', 'benchmark_model.py')
    }
  }

  publishTraining(patch) {
    this.trainingStatus = { ...this.trainingStatus, ...patch }
    const window = this.getMainWindow?.()
    if (window && !window.isDestroyed()) window.webContents.send('junfeng-training-event', this.getTrainingStatus())
  }

  runTrainingCommand(executable, args, { acceptedCodes = [0], onEvent = null } = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(executable, args, { shell: false, windowsHide: true, cwd: this.trainingPaths().projectRoot,
        env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' } })
      this.trainingChild = child
      let output = ''
      child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8')
      const eventParser = parser(event => onEvent?.(event), line => console.log('[高亮模型训练]', line))
      child.stdout.on('data', chunk => { output += chunk; eventParser(chunk) })
      child.stderr.on('data', chunk => { output += chunk; console.error('[高亮模型训练]', String(chunk).trim()) })
      child.on('error', reject)
      child.on('close', code => {
        if (this.trainingChild === child) this.trainingChild = null
        if (acceptedCodes.includes(code)) resolve(output)
        else reject(new Error(output.trim().split(/\r?\n/).pop() || `训练子进程退出（${code}）`))
      })
    })
  }

  publishCandidateModel(candidate) {
    const model = this.modelPaths()
    const targets = [
      [candidate.model, model.model],
      [candidate.split, path.join(path.dirname(model.model), 'split.json')],
      [candidate.manifest, model.manifest]
    ]
    const token = `${process.pid}-${Date.now()}`
    const prepared = targets.map(([source, target]) => ({ source, target,
      next: `${target}.${token}.next`, backup: `${target}.${token}.backup`, existed: fs.existsSync(target), replaced: false }))
    try {
      for (const entry of prepared) {
        if (!fs.existsSync(entry.source)) throw new Error(`候选模型文件缺失：${path.basename(entry.source)}`)
        fs.copyFileSync(entry.source, entry.next)
        if (entry.existed) fs.copyFileSync(entry.target, entry.backup)
      }
      for (const entry of prepared) {
        fs.renameSync(entry.next, entry.target)
        entry.replaced = true
      }
      for (const entry of prepared) if (entry.existed && fs.existsSync(entry.backup)) fs.unlinkSync(entry.backup)
    } catch (error) {
      for (const entry of prepared.reverse()) {
        try {
          if (entry.replaced && entry.existed && fs.existsSync(entry.backup)) fs.copyFileSync(entry.backup, entry.target)
          else if (entry.replaced && !entry.existed && fs.existsSync(entry.target)) fs.unlinkSync(entry.target)
          if (fs.existsSync(entry.next)) fs.unlinkSync(entry.next)
          if (fs.existsSync(entry.backup)) fs.unlinkSync(entry.backup)
        } catch {}
      }
      throw error
    }
  }

  async trainModel({ epochs = 100 } = {}) {
    if (app.isPackaged) throw new Error('训练工作台仅在开发版可用')
    if (this.trainingChild || this.trainingStatus.status === 'running') throw new Error('模型训练正在进行')
    if (this.child) throw new Error('自动取件运行中，不能训练模型')
    const paths = this.trainingPaths()
    if (!fs.existsSync(paths.python)) throw new Error('未找到 .runtime/junfeng-training GPU 训练环境')
    if (!fs.existsSync(paths.base)) throw new Error('缺少基础训练数据 artifacts/junfeng/combined.npz')
    const modelVersion = `junfeng-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`
    this.publishTraining({ status: 'running', stage: '导出本机标注', reason: '', report: null, modelVersion })
    try {
      await this.runTrainingCommand(paths.python, [paths.build, '--root', this.calibration.root, '--output', paths.local])
      this.publishTraining({ stage: '合并多来源数据集' })
      await this.runTrainingCommand(paths.python, [paths.merge, '--dataset', paths.base, '--dataset', paths.local, '--output', paths.merged])
      this.publishTraining({ stage: '使用 GPU 训练候选模型' })
      const candidateRoot = path.join(paths.artifacts, 'workbench-candidate')
      fs.mkdirSync(candidateRoot, { recursive: true })
      const candidate = { model: path.join(candidateRoot, 'model.onnx'), manifest: path.join(candidateRoot, 'manifest.json'),
        split: path.join(candidateRoot, 'split.json') }
      await this.runTrainingCommand(paths.python, [paths.train, '--dataset', paths.merged, '--output', candidate.model,
        '--epochs', String(Math.max(1, Math.min(500, Number(epochs) || 100))), '--model-version', modelVersion,
        '--device', 'cuda', '--validation-domain', 'junfeng', '--events'], { onEvent: event =>
          this.publishTraining({ stage: `GPU 训练 ${event.epoch}/${event.epochs}`, epoch: event.epoch,
            epochs: event.epochs, loss: event.loss }) })
      this.publishTraining({ stage: '独立验证候选模型' })
      await this.runTrainingCommand(paths.python, [paths.benchmark, '--dataset', paths.merged, '--model', candidate.model,
        '--split', candidate.split, '--manifest', candidate.manifest], { acceptedCodes: [0, 2] })
      const report = JSON.parse(fs.readFileSync(candidate.manifest, 'utf8')).benchmark || null
      this.publishTraining({ stage: '发布当前取件模型' })
      this.publishCandidateModel(candidate)
      this.publishTraining({ status: 'completed', stage: '当前取件模型已更新', report,
        reason: report?.passed ? '' : '验证结果未达到建议标准，请人工复核后使用' })
      return this.getTrainingStatus()
    } catch (error) {
      this.publishTraining({ status: 'failed', stage: '训练失败', reason: error.message })
      throw error
    }
  }

  async evaluateModel() {
    if (app.isPackaged) throw new Error('最终测试仅在开发版可用')
    if (this.trainingChild) throw new Error('模型训练正在进行')
    const paths = this.trainingPaths(); const model = this.modelPaths()
    if (!fs.existsSync(paths.merged)) throw new Error('没有可测试的最近训练结果')
    await this.runTrainingCommand(paths.python, [paths.benchmark, '--dataset', paths.merged, '--model', model.model,
      '--split', path.join(path.dirname(model.model), 'split.json'), '--manifest', model.manifest,
      '--partition', 'test'], { acceptedCodes: [0, 2] })
    const report = JSON.parse(fs.readFileSync(model.manifest, 'utf8')).benchmark || null
    this.publishTraining({ status: 'evaluated', stage: '最终测试完成', report, reason: '' })
    return this.getTrainingStatus()
  }

  addCorrection({ column, row, label, tileDataUrl, embedding, modelVersion, previewId,
    domain = 'junfeng', columns = 12, rows = 11 } = {}) {
    const cell = tileDataUrl
      ? { column, row, tileDataUrl, embedding, modelVersion }
      : this.lastPreview.get(`${Number(column)}:${Number(row)}`)
    if (!cell?.tileDataUrl) throw new Error('请先运行检测预览')
    return this.calibration.save({ ...cell, label, domain, columns, rows,
      modelVersion: cell.modelVersion || modelVersion || '', previewId: previewId || this.lastPreviewId })
  }

  start() {
    if (this.trainingChild) throw new Error('模型训练正在进行，不能启动自动取件')
    if (this.child) throw new Error('君锋镇高亮取件正在运行')
    this.ensureReady()
    const gate = this.automationLock?.acquire(OWNER) || { success: true }
    if (!gate.success) throw new Error(gate.error)
    this.status = { ...this.initialStatus(), status: 'running' }
    try {
      const child = this.spawn(['--config', this.writeConfig()], event => this.handleEvent(child, event))
      this.child = child
      child.on('error', error => this.fail(error.message))
      child.on('close', code => { if (this.child === child && this.status.status === 'running') this.fail(`君锋镇取件进程异常退出（${code}）`) })
      this.publish({ event: 'starting' })
      return this.getStatus()
    } catch (error) {
      this.automationLock?.release(OWNER)
      throw error
    }
  }

  handleEvent(child, event) {
    if (this.child !== child) return
    Object.assign(this.status, {
      status: event.event === 'completed' ? 'completed' : ['aborted', 'error'].includes(event.event) ? 'stopped' : 'running',
      candidateItems: Number(event.candidateItems ?? this.status.candidateItems),
      remainingItems: Number(event.remainingItems ?? this.status.remainingItems),
      pickedItems: Number(event.pickedItems ?? this.status.pickedItems),
      uncertainCells: Number(event.uncertainCells ?? this.status.uncertainCells),
      reason: event.reason || '', modelVersion: event.modelVersion || this.status.modelVersion
    })
    this.publish(event)
    if (['completed', 'aborted', 'error'].includes(event.event)) {
      this.child = null
      this.automationLock?.release(OWNER)
    }
  }

  publish(event) {
    const payload = { ...this.status, ...event }
    const window = this.getMainWindow?.()
    if (window && !window.isDestroyed()) window.webContents.send('junfeng-highlight-event', payload)
    this.onStatusChange?.()
  }

  stop(reason = 'user') {
    stopChild(this.child)
    this.child = null
    this.status = { ...this.status, status: 'stopped', reason }
    this.automationLock?.release(OWNER)
    this.publish({ event: 'stopped', reason })
    return this.getStatus()
  }

  fail(reason) {
    stopChild(this.child)
    this.child = null
    this.status = { ...this.status, status: 'stopped', reason }
    this.automationLock?.release(OWNER)
    this.publish({ event: 'error', reason })
  }
  getStatus() { return structuredClone(this.status) }
  listCorrections() { return this.calibration.listWithImages() }
  removeCorrection(id) { return this.calibration.remove(id) }
  resetCorrections() { this.calibration.reset(); return [] }
  rebuildCorrections() {
    let modelVersion = ''
    try { modelVersion = JSON.parse(fs.readFileSync(this.modelPaths().manifest, 'utf8')).modelVersion || '' } catch {}
    return this.calibration.markForReembed(modelVersion)
  }
  cleanup() { if (this.child) this.stop('application-exit'); stopChild(this.trainingChild); this.disposeDetection?.() }
}
