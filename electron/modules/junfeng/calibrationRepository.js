import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const LABELS = new Set(['highlighted', 'dimmed', 'empty'])
const PARTITIONS = new Set(['train', 'validation', 'test'])

function readIndex(indexPath) {
  try {
    const value = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
    return Array.isArray(value.samples)
      ? { ...value, samples: value.samples, sessions: Array.isArray(value.sessions) ? value.sessions : [] }
      : { schemaVersion: 1, samples: [], sessions: [] }
  } catch {
    return { schemaVersion: 1, samples: [], sessions: [] }
  }
}

function decodePng(dataUrl, message) {
  const match = String(dataUrl || '').match(/^data:image\/png;base64,(.+)$/)
  if (!match) throw new Error(message)
  const png = Buffer.from(match[1], 'base64')
  if (!png.length || png.length > 20 * 1024 * 1024) throw new Error(message)
  return png
}

function pngDataUrl(filePath) {
  return `data:image/png;base64,${fs.readFileSync(filePath).toString('base64')}`
}

function reconstructedGridDataUrl(root, samples, columns, rows) {
  const cellSize = 64
  const images = samples.map(sample => {
    const filePath = path.resolve(root, sample.relativePath || '')
    if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath)) return ''
    const href = pngDataUrl(filePath)
    return `<image href="${href}" x="${sample.column * cellSize}" y="${sample.row * cellSize}" width="${cellSize}" height="${cellSize}" preserveAspectRatio="none"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${columns * cellSize}" height="${rows * cellSize}" viewBox="0 0 ${columns * cellSize} ${rows * cellSize}">${images}</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export class JunfengCalibrationRepository {
  constructor(root) {
    this.root = path.resolve(root)
    this.sampleRoot = path.join(this.root, 'samples')
    this.indexPath = path.join(this.root, 'index.json')
    this.trainingRoot = path.join(this.root, 'training-samples')
    this.trainingSessionRoot = path.join(this.root, 'training-sessions')
    this.trainingIndexPath = path.join(this.root, 'training-index.json')
  }

  ensure() {
    fs.mkdirSync(this.sampleRoot, { recursive: true })
    fs.mkdirSync(this.trainingRoot, { recursive: true })
    fs.mkdirSync(this.trainingSessionRoot, { recursive: true })
  }

  listTrainingSamples() {
    const index = readIndex(this.trainingIndexPath)
    return index.samples.filter(sample => {
      const filePath = path.resolve(this.root, sample.relativePath || '')
      return filePath.startsWith(`${this.root}${path.sep}`) && fs.existsSync(filePath) && LABELS.has(sample.label)
    })
  }

  trainingSummary() {
    const samples = this.listTrainingSamples()
    const sessions = new Set(samples.map(sample => sample.previewId).filter(Boolean))
    const domains = {}
    const labels = {}
    for (const sample of samples) {
      domains[sample.domain] = (domains[sample.domain] || 0) + 1
      labels[sample.label] = (labels[sample.label] || 0) + 1
    }
    const partitions = {}
    for (const sample of samples) partitions[sample.partition || 'legacy'] = (partitions[sample.partition || 'legacy'] || 0) + 1
    return { samples: samples.length, sessions: sessions.size, domains, labels, partitions }
  }

  listTrainingSessions() {
    const index = readIndex(this.trainingIndexPath)
    const samples = this.listTrainingSamples()
    const explicitIds = new Set(index.sessions.map(session => session.id))
    const derived = [...new Set(samples.map(sample => sample.previewId))].filter(id => !explicitIds.has(id)).map(id => {
      const grouped = samples.filter(sample => sample.previewId === id)
      return { id, domain: grouped[0]?.domain || 'junfeng', columns: grouped[0]?.columns || 0,
        rows: grouped[0]?.rows || 0, partition: grouped[0]?.partition || 'legacy', audited: false,
        capturedAt: grouped[0]?.capturedAt || '', relativePath: '' }
    })
    const sessions = [...index.sessions, ...derived]
    return sessions.map(session => {
      const grouped = samples.filter(sample => sample.previewId === session.id)
      const labels = {}
      for (const sample of grouped) labels[sample.label] = (labels[sample.label] || 0) + 1
      return { ...session, sampleCount: grouped.length, labels }
    }).sort((left, right) => String(right.capturedAt).localeCompare(String(left.capturedAt)))
  }

  getTrainingSession(id) {
    const session = this.listTrainingSessions().find(item => item.id === String(id))
    if (!session) throw new Error('训练会话不存在')
    const imagePath = path.resolve(this.root, session.relativePath || '')
    const sessionSamples = this.listTrainingSamples().filter(sample => sample.previewId === session.id)
    const hasOriginal = Boolean(session.relativePath && imagePath.startsWith(`${this.root}${path.sep}`) && fs.existsSync(imagePath))
    const imageDataUrl = hasOriginal ? pngDataUrl(imagePath)
      : reconstructedGridDataUrl(this.root, sessionSamples, session.columns, session.rows)
    const cells = sessionSamples
      .sort((left, right) => left.row - right.row || left.column - right.column)
      .map(sample => ({ column: sample.column, row: sample.row, label: sample.label }))
    return { ...session, previewId: session.id, imageDataUrl, rawImageDataUrl: imageDataUrl, reconstructed: !hasOriginal,
      grid: { columns: session.columns, rows: session.rows }, cells }
  }

  saveTrainingSession({ previewId, domain, columns, rows, cells, rawImageDataUrl, partition = 'train' }) {
    const sessionId = String(previewId || '')
    const sourceDomain = String(domain || '')
    const targetPartition = String(partition || 'train')
    if (!sessionId || !sourceDomain) throw new Error('训练会话信息不完整')
    if (!PARTITIONS.has(targetPartition)) throw new Error('训练数据用途无效')
    if (!Array.isArray(cells) || !cells.length) throw new Error('训练会话没有可保存的格子')
    if (cells.length !== Number(columns) * Number(rows)) throw new Error('训练会话格子数量不完整')
    this.ensure()
    const index = readIndex(this.trainingIndexPath)
    const previous = index.samples.filter(sample => sample.previewId === sessionId)
    const next = index.samples.filter(sample => sample.previewId !== sessionId)
    for (const cell of cells) {
      if (!LABELS.has(cell.label)) throw new Error('训练标签无效')
      const existing = previous.find(sample => sample.column === Number(cell.column) && sample.row === Number(cell.row))
      const existingPath = existing ? path.resolve(this.root, existing.relativePath || '') : ''
      const png = cell.tileDataUrl ? decodePng(cell.tileDataUrl, '训练图块不是 PNG')
        : (existingPath && fs.existsSync(existingPath) ? fs.readFileSync(existingPath) : null)
      if (!png) throw new Error('训练图块缺失，请重新采集该会话')
      const column = Number(cell.column)
      const row = Number(cell.row)
      const id = crypto.createHash('sha256').update(sessionId).update(`${column}:${row}`).digest('hex').slice(0, 24)
      const relativePath = path.join('training-samples', `${id}.png`)
      fs.writeFileSync(path.join(this.root, relativePath), png)
      next.push({ id, previewId: sessionId, domain: sourceDomain, label: cell.label, column, row,
        columns: Number(columns), rows: Number(rows), partition: targetPartition, audited: true,
        relativePath, capturedAt: new Date().toISOString() })
    }
    const retainedPaths = new Set(next.filter(sample => sample.previewId === sessionId).map(sample => sample.relativePath))
    for (const sample of previous) {
      if (retainedPaths.has(sample.relativePath)) continue
      const previousPath = path.resolve(this.root, sample.relativePath || '')
      if (previousPath.startsWith(`${this.trainingRoot}${path.sep}`)) try { fs.unlinkSync(previousPath) } catch {}
    }
    const previousSession = index.sessions.find(session => session.id === sessionId)
    let imageRelativePath = previousSession?.relativePath || ''
    if (rawImageDataUrl) {
      const imageFile = `${sessionId}.png`
      fs.writeFileSync(path.join(this.trainingSessionRoot, imageFile), decodePng(rawImageDataUrl, '训练会话原图无效'))
      imageRelativePath = path.join('training-sessions', imageFile)
    }
    if (!imageRelativePath && !previous.length) throw new Error('训练会话缺少原图，请重新采集')
    index.samples = next
    index.schemaVersion = 2
    const session = { id: sessionId, domain: sourceDomain, columns: Number(columns), rows: Number(rows),
      partition: targetPartition, audited: true, locked: targetPartition === 'test', relativePath: imageRelativePath,
      capturedAt: previousSession?.capturedAt || previous[0]?.capturedAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
      revision: Number(previousSession?.revision || 0) + 1 }
    index.sessions = [...index.sessions.filter(item => item.id !== sessionId), session]
    fs.writeFileSync(this.trainingIndexPath, JSON.stringify(index, null, 2), 'utf8')
    return this.trainingSummary()
  }

  updateTrainingSession({ id, labels, partition }) {
    const session = this.getTrainingSession(id)
    const labelMap = new Map(Object.entries(labels || {}))
    const samples = this.listTrainingSamples().filter(sample => sample.previewId === session.id)
    const cells = samples.map(sample => ({ ...sample, label: labelMap.get(`${sample.column}:${sample.row}`) || sample.label }))
    return this.saveTrainingSession({ previewId: session.id, domain: session.domain, columns: session.columns,
      rows: session.rows, partition: partition || session.partition, cells })
  }

  deleteTrainingSession(id) {
    const sessionId = String(id || '')
    const index = readIndex(this.trainingIndexPath)
    const session = index.sessions.find(item => item.id === sessionId)
    for (const sample of index.samples.filter(item => item.previewId === sessionId)) {
      const filePath = path.resolve(this.root, sample.relativePath || '')
      if (filePath.startsWith(`${this.trainingRoot}${path.sep}`)) try { fs.unlinkSync(filePath) } catch {}
    }
    if (session?.relativePath) {
      const imagePath = path.resolve(this.root, session.relativePath)
      if (imagePath.startsWith(`${this.trainingSessionRoot}${path.sep}`)) try { fs.unlinkSync(imagePath) } catch {}
    }
    index.samples = index.samples.filter(item => item.previewId !== sessionId)
    index.sessions = index.sessions.filter(item => item.id !== sessionId)
    this.ensure()
    fs.writeFileSync(this.trainingIndexPath, JSON.stringify(index, null, 2), 'utf8')
    return this.trainingSummary()
  }

  list() {
    const index = readIndex(this.indexPath)
    return index.samples.filter(sample => {
      const filePath = path.resolve(this.root, sample.relativePath || '')
      return filePath.startsWith(`${this.root}${path.sep}`) && fs.existsSync(filePath) && LABELS.has(sample.label)
    }).map(sample => ({ domain: 'junfeng', columns: 12, rows: 11, ...sample }))
  }

  listWithImages() {
    return this.list().map(sample => {
      const filePath = path.resolve(this.root, sample.relativePath)
      return { ...sample, tileDataUrl: pngDataUrl(filePath) }
    })
  }

  save({ dataUrl, tileDataUrl, label, column, row, modelVersion = '', previewId = '', embedding = [],
    domain = 'junfeng', columns = 12, rows = 11 }) {
    if (!LABELS.has(label)) throw new Error('校准标签无效')
    const match = String(dataUrl || tileDataUrl || '').match(/^data:image\/png;base64,(.+)$/)
    if (!match) throw new Error('校准图块不是 PNG')
    const png = Buffer.from(match[1], 'base64')
    if (!png.length || png.length > 1024 * 1024) throw new Error('校准图块大小无效')
    this.ensure()
    const sourceDomain = String(domain || 'junfeng')
    const id = crypto.createHash('sha256').update(png).update(label)
      .update(sourceDomain === 'junfeng' ? '' : sourceDomain).digest('hex').slice(0, 24)
    const fileName = `${id}.png`
    const target = path.join(this.sampleRoot, fileName)
    fs.writeFileSync(target, png)
    const index = readIndex(this.indexPath)
    const sample = {
      id, label, column: Number(column), row: Number(row), modelVersion: String(modelVersion || ''),
      previewId: String(previewId || ''),
      domain: sourceDomain, columns: Number(columns) || 12, rows: Number(rows) || 11,
      relativePath: path.join('samples', fileName), capturedAt: new Date().toISOString(),
      featureVector: Array.isArray(embedding) && embedding.length === 32
        ? embedding.map(value => Number(value))
        : []
    }
    index.samples = [...index.samples.filter(item => item.id !== id), sample]
    fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2), 'utf8')
    return sample
  }

  remove(id) {
    const index = readIndex(this.indexPath)
    const target = index.samples.find(item => item.id === String(id))
    if (!target) return false
    const filePath = path.resolve(this.root, target.relativePath || '')
    if (filePath.startsWith(`${this.root}${path.sep}`)) {
      try { fs.unlinkSync(filePath) } catch {}
    }
    index.samples = index.samples.filter(item => item.id !== target.id)
    this.ensure()
    fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2), 'utf8')
    return true
  }

  reset() {
    for (const sample of this.list()) {
      const filePath = path.resolve(this.root, sample.relativePath)
      try { fs.unlinkSync(filePath) } catch {}
    }
    this.ensure()
    fs.writeFileSync(this.indexPath, JSON.stringify({ schemaVersion: 1, samples: [] }, null, 2), 'utf8')
  }

  markForReembed(modelVersion = '') {
    this.ensure()
    const index = readIndex(this.indexPath)
    index.samples = index.samples.map(sample => ({
      ...sample,
      modelVersion: String(modelVersion || ''),
      featureVector: []
    }))
    fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2), 'utf8')
    return this.listWithImages()
  }
}
