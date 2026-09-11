import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolvePythonRuntimeAsync } from '../python/detector.js'
import { bindSanctumCalibration } from '../../../shared/sanctumCalibration.js'

const execute = promisify(execFile)
const root = fileURLToPath(new URL('../../../', import.meta.url))
const sampleRoot = path.join(root, 'test/fixtures/sanctum')

export function listSanctumSamples() {
  const manifest = JSON.parse(fs.readFileSync(path.join(sampleRoot, 'supplied-samples.json'), 'utf8'))
  return manifest.samples.map(sample => ({ id: sample.file, title: sample.displayedTitle || sample.file,
    dpi: sample.dpi, sourceSize: sample.sourceSize, crop: sample.crop }))
}

export async function replaySanctumSample(id, { signal, calibration } = {}) {
  if (typeof id !== 'string' || path.basename(id) !== id || !listSanctumSamples().some(sample => sample.id === id)) throw new Error('未知圣所样本')
  const validated = calibration ? bindSanctumCalibration(calibration, listSanctumSamples().find(sample => sample.id === id)) : null
  const runtime = await resolvePythonRuntimeAsync(['cv2', 'numpy'])
  signal?.throwIfAborted()
  try {
    const args = [path.join(root, 'src/assets/scripts/sanctum_recognition.py'), path.join(sampleRoot, id)]
    if (validated) args.push('--calibration', JSON.stringify(validated))
    const { stdout } = await execute(runtime.path, args, {
      windowsHide: true, timeout: 30000, maxBuffer: 2 * 1024 * 1024, signal,
      env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
    })
    return JSON.parse(stdout)
  } catch (error) {
    if (signal?.aborted) throw new Error('样本回放已停止')
    throw new Error('样本回放失败，请检查 Python 运行时和样本文件')
  }
}
