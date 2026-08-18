import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const PUZZLE_CALIBRATION_FEATURE_VERSION = 1
export const PUZZLE_CALIBRATION_FEATURE_LENGTH = 128

function emptyIndex() {
  return { schemaVersion: 1, samples: [] }
}

function readIndex(filePath) {
  try {
    const value = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return Array.isArray(value?.samples) ? value : emptyIndex()
  } catch {
    return emptyIndex()
  }
}

function decodePng(dataUrl) {
  const match = String(dataUrl || '').match(/^data:image\/png;base64,(.+)$/)
  if (!match) throw new Error('校准图块不是 PNG')
  const png = Buffer.from(match[1], 'base64')
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (png.length < signature.length || png.length > 1024 * 1024 || !png.subarray(0, signature.length).equals(signature)) {
    throw new Error('校准图块大小无效')
  }
  return png
}

function validVector(value) {
  return Array.isArray(value) && value.length === PUZZLE_CALIBRATION_FEATURE_LENGTH &&
    value.every(item => Number.isFinite(Number(item)))
}

export class PuzzleCalibrationRepository {
  constructor(root) {
    this.root = path.resolve(root)
    this.sampleRoot = path.join(this.root, 'samples')
    this.indexPath = path.join(this.root, 'index.json')
  }

  ensure() {
    fs.mkdirSync(this.sampleRoot, { recursive: true })
  }

  list() {
    return readIndex(this.indexPath).samples.filter(sample => {
      const labelMask = Number(sample?.labelMask)
      const filePath = path.resolve(this.root, sample?.relativePath || '')
      return Number.isInteger(labelMask) && labelMask >= 0 && labelMask <= 15 &&
        Number(sample?.featureVersion) === PUZZLE_CALIBRATION_FEATURE_VERSION &&
        validVector(sample?.featureVector) && filePath.startsWith(`${this.sampleRoot}${path.sep}`) &&
        fs.existsSync(filePath)
    }).map(sample => ({
      ...sample,
      labelMask: Number(sample.labelMask),
      featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION,
      featureVector: sample.featureVector.map(Number)
    }))
  }

  listWithImages() {
    return this.list().map(sample => ({
      ...sample,
      tileDataUrl: `data:image/png;base64,${fs.readFileSync(path.resolve(this.root, sample.relativePath)).toString('base64')}`
    }))
  }

  save({ tileDataUrl, labelMask, featureVector, featureVersion, page, row, column } = {}) {
    const mask = Number(labelMask)
    if (!Number.isInteger(mask) || mask < 0 || mask > 15) throw new Error('校准标签无效')
    if (Number(featureVersion) !== PUZZLE_CALIBRATION_FEATURE_VERSION || !validVector(featureVector)) {
      throw new Error('校准特征无效')
    }
    const png = decodePng(tileDataUrl)
    this.ensure()
    const id = crypto.createHash('sha256').update(png).digest('hex').slice(0, 24)
    const relativePath = path.join('samples', `${id}.png`)
    fs.writeFileSync(path.join(this.root, relativePath), png)
    const index = readIndex(this.indexPath)
    const sample = {
      id,
      labelMask: mask,
      featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION,
      featureVector: featureVector.map(Number),
      page: Number(page) || 1,
      row: Number(row) || 0,
      column: Number(column) || 0,
      relativePath,
      capturedAt: new Date().toISOString()
    }
    index.samples = [...index.samples.filter(item => item.id !== id), sample]
    index.schemaVersion = 1
    fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2), 'utf8')
    return sample
  }

  remove(id) {
    const index = readIndex(this.indexPath)
    const target = index.samples.find(sample => sample.id === String(id))
    if (!target) return false
    const filePath = path.resolve(this.root, target.relativePath || '')
    if (filePath.startsWith(`${this.sampleRoot}${path.sep}`)) {
      try { fs.unlinkSync(filePath) } catch {}
    }
    this.ensure()
    index.samples = index.samples.filter(sample => sample.id !== target.id)
    fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2), 'utf8')
    return true
  }

  reset() {
    this.ensure()
    for (const name of fs.readdirSync(this.sampleRoot)) {
      const filePath = path.join(this.sampleRoot, name)
      try { if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath) } catch {}
    }
    fs.writeFileSync(this.indexPath, JSON.stringify(emptyIndex(), null, 2), 'utf8')
    return []
  }
}
