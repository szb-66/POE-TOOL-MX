import { app } from 'electron'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
export const STASH_TAB_OCR_MODULES = Object.freeze(['rapidocr', 'onnxruntime', 'cv2', 'mss', 'numpy'])

export function resolveStashTabSelectorPath() {
  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath, 'stash_tab_selector.py')]
    : [
        path.resolve(moduleDir, '../../../src/assets/scripts/stash_tab_selector.py'),
        path.join(app.getAppPath(), 'src/assets/scripts/stash_tab_selector.py')
      ]
  const found = candidates.find(candidate => fs.existsSync(candidate))
  if (!found) throw new Error('仓库页识别脚本不存在')
  return found
}

function parseResult(output) {
  const line = String(output).split(/\r?\n/).reverse().find(value => value.startsWith('RESULT '))
  if (!line) throw new Error('仓库页识别器没有返回结构化结果')
  return JSON.parse(line.slice(7))
}

export function runStashTabSelector({ python, fileWatcher, mode, config }) {
  const pythonPath = python.detectPythonPathWithModules?.([...STASH_TAB_OCR_MODULES])
  if (!pythonPath) throw new Error('未找到具备 rapidocr、onnxruntime、cv2、mss、numpy 的 Python 3')
  const filePaths = fileWatcher.getFilePaths()
  fs.mkdirSync(filePaths.tempDir, { recursive: true })
  const configPath = path.join(filePaths.tempDir, `stash_tab_selector_${mode}.json`)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')
  return new Promise((resolve, reject) => {
    const child = spawn(pythonPath, [resolveStashTabSelectorPath(), '--mode', mode, '--config', configPath], {
      shell: false,
      windowsHide: true,
      env: { ...process.env, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.once('error', reject)
    child.once('close', () => {
      try { resolve(parseResult(stdout)) } catch (error) {
        reject(new Error(stderr.trim() || error.message))
      }
    })
  })
}
