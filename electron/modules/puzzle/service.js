import { app, screen } from 'electron'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDisplayPhysicalBounds } from '../window/coordinates.js'
import { validatePuzzleRegionEnvironment } from '../../../src/utils/puzzleConfig.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function codedError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function currentDisplays() {
  return screen.getAllDisplays().map(display => ({
    id: String(display.id),
    scaleFactor: Number(display.scaleFactor || 1),
    physicalBounds: getDisplayPhysicalBounds(
      display,
      process.platform,
      point => screen.dipToScreenPoint(point)
    )
  }))
}

function restoreWindow(window) {
  if (!window || window.isDestroyed()) return
  if (window.isMinimized()) window.restore()
  window.show()
  window.focus()
}

export class PuzzleAnalysisService {
  constructor({ python, window, fileWatcher, getMainWindow }) {
    this.python = python
    this.window = window
    this.fileWatcher = fileWatcher
    this.getMainWindow = getMainWindow
    this.child = null
    this.busy = false
  }

  scriptPath() {
    const candidates = app.isPackaged
      ? [path.join(process.resourcesPath, 'puzzle_analyzer.py')]
      : [path.resolve(moduleDir, '../../../src/assets/scripts/puzzle_analyzer.py')]
    const found = candidates.find(candidate => fs.existsSync(candidate))
    if (!found) throw codedError('ANALYZER_MISSING', '九宫格识别脚本不存在')
    return found
  }

  templatesPath() {
    const candidates = app.isPackaged
      ? [path.join(process.resourcesPath, 'puzzle_templates.json')]
      : [path.resolve(moduleDir, '../../assets/puzzle/templates.json')]
    const found = candidates.find(candidate => fs.existsSync(candidate))
    if (!found) throw codedError('TEMPLATES_MISSING', '九宫格识别模板不存在')
    return found
  }

  pythonPath() {
    const found = this.python.detectPythonPathWithModules?.(['cv2', 'mss', 'numpy'])
    if (!found) throw codedError('PYTHON_RUNTIME_MISSING', '未找到具备 cv2、mss、numpy 的内置 Python 运行时')
    return found
  }

  async pickRegion() {
    const mainWindow = this.getMainWindow?.()
    try {
      mainWindow?.minimize()
      await sleep(500)
      const result = await this.window.pickScreenRegion({
        purpose: 'puzzle-inventory',
        minimumSize: { width: 120, height: 200 }
      })
      if (result?.canceled) return result
      return {
        canceled: false,
        selectedRegion: result.selectedRegion,
        displayId: result.displayId,
        scaleFactor: result.scaleFactor,
        displayPhysicalBounds: result.displayPhysicalBounds,
        capturedAt: new Date().toISOString()
      }
    } finally {
      restoreWindow(mainWindow)
    }
  }

  validateRegion(regionMetadata) {
    const validation = validatePuzzleRegionEnvironment(regionMetadata, currentDisplays())
    if (!validation.valid) throw codedError(validation.code, validation.message)
    return validation.metadata
  }

  tempConfigPath() {
    const directory = this.fileWatcher?.getFilePaths?.().tempDir || os.tmpdir()
    fs.mkdirSync(directory, { recursive: true })
    return path.join(directory, `puzzle-analysis-${process.pid}-${Date.now()}.json`)
  }

  runAnalyzer(config) {
    return new Promise((resolve, reject) => {
      const configPath = this.tempConfigPath()
      fs.writeFileSync(configPath, JSON.stringify(config), 'utf8')
      const child = spawn(this.pythonPath(), [this.scriptPath(), '--config', configPath], {
        shell: false,
        windowsHide: true,
        env: { ...process.env, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
        stdio: ['ignore', 'pipe', 'pipe']
      })
      this.child = child
      let stdout = ''
      let stderr = ''
      child.stdout.setEncoding('utf8')
      child.stderr.setEncoding('utf8')
      child.stdout.on('data', chunk => { stdout += chunk })
      child.stderr.on('data', chunk => { stderr += chunk })
      child.once('error', reject)
      child.once('close', code => {
        this.child = null
        try { fs.unlinkSync(configPath) } catch {}
        const resultLine = stdout.split(/\r?\n/).find(line => line.startsWith('RESULT '))
        if (!resultLine) {
          reject(codedError('ANALYZER_OUTPUT_INVALID', stderr.trim() || `识别进程异常退出（${code}）`))
          return
        }
        try {
          resolve(JSON.parse(resultLine.slice(7)))
        } catch {
          reject(codedError('ANALYZER_OUTPUT_INVALID', '九宫格识别结果无法解析'))
        }
      })
    })
  }

  publish(payload) {
    const mainWindow = this.getMainWindow?.()
    restoreWindow(mainWindow)
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('puzzle-analysis-updated', payload)
  }

  async analyze({ regionMetadata } = {}) {
    if (this.busy) return { success: false, error: { code: 'ANALYSIS_BUSY', message: '九宫格识别正在进行，请稍候' } }
    this.busy = true
    const mainWindow = this.getMainWindow?.()
    try {
      const metadata = this.validateRegion(regionMetadata)
      const result = await this.runAnalyzer({
        region: metadata.selectedRegion,
        templatesPath: this.templatesPath(),
        requireGameForeground: true
      })
      const payload = result.success ? { ...result, regionMetadata: metadata } : result
      this.publish(payload)
      return payload
    } catch (error) {
      const payload = { success: false, error: { code: error.code || 'PUZZLE_ANALYSIS_FAILED', message: error.message || String(error) } }
      this.publish(payload)
      return payload
    } finally {
      this.busy = false
      restoreWindow(mainWindow)
    }
  }

  cleanup() {
    if (this.child && !this.child.killed) this.child.kill('SIGTERM')
    this.child = null
    this.busy = false
  }
}
