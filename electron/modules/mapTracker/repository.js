import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { createMapRun, normalizeMapTrackerSettings } from './model.js'

const SCHEMA_VERSION = 1
const EDITABLE_FIELDS = new Set(['areaName'])

function safeSegment(value) {
  const result = String(value || 'standard').normalize('NFKC').replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^[.-]+|[.-]+$/g, '').slice(0, 80)
  return result || 'standard'
}

function monthOf(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('地图记录时间无效')
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

async function atomicWrite(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true })
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`)
  await writeFile(temporary, JSON.stringify(value, null, 2), 'utf8')
  try {
    await unlink(filePath).catch((error) => { if (error.code !== 'ENOENT') throw error })
    await rename(temporary, filePath)
  } catch (error) {
    await unlink(temporary).catch(() => {})
    throw error
  }
}

async function readJson(filePath, fallback) {
  try { return JSON.parse(await readFile(filePath, 'utf8')) } catch (error) {
    if (error.code === 'ENOENT') return fallback
    throw error
  }
}

function compareRuns(a, b, direction = 'desc') {
  const value = String(a.startedAt).localeCompare(String(b.startedAt)) || String(a.id).localeCompare(String(b.id))
  return direction === 'asc' ? value : -value
}

export function csvEscape(value) {
  const text = Array.isArray(value) ? value.join(' | ') : value == null ? '' : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function runsToCsv(runs) {
  const columns = ['startedAt', 'endedAt', 'areaName', 'areaId', 'areaLevel', 'mapTier', 'activeDurationMs', 'experienceEfficiency', 'deaths', 'portalsUsed', 'kills', 'loot', 'character', 'endReason']
  const rows = runs.map((run) => columns.map((key) => {
    const value = key === 'loot' ? run.loot?.map((item) => item.name || item.baseType || '').filter(Boolean) : key === 'character' ? run.character?.name || '' : run[key]
    return csvEscape(value)
  }).join(','))
  return `\uFEFF${columns.join(',')}\r\n${rows.join('\r\n')}${rows.length ? '\r\n' : ''}`
}

export class MapTrackerRepository {
  constructor(userDataPath) {
    this.root = path.join(path.resolve(userDataPath), 'map-tracker')
    this.settingsPath = path.join(this.root, 'settings.json')
    this.activePath = path.join(this.root, 'active-run.json')
  }
  shardPath(run) { return path.join(this.root, 'runs', safeSegment(run.league), `${monthOf(run.startedAt)}.json`) }
  relative(filePath) { return path.relative(this.root, filePath).replaceAll('\\', '/') }
  async getSettings() { return normalizeMapTrackerSettings(await readJson(this.settingsPath, {})) }
  async saveSettings(patch) { const value = normalizeMapTrackerSettings({ ...(await this.getSettings()), ...patch }); await atomicWrite(this.settingsPath, value); return value }
  async getActiveRun() { const value = await readJson(this.activePath, null); return value?.run ? createMapRun(value.run) : null }
  async saveActiveRun(run) { await atomicWrite(this.activePath, { schemaVersion: SCHEMA_VERSION, run: createMapRun(run) }); return createMapRun(run) }
  async clearActiveRun() { await unlink(this.activePath).catch((error) => { if (error.code !== 'ENOENT') throw error }) }
  async saveRun(run) {
    const normalized = createMapRun(run); const filePath = this.shardPath(normalized)
    const shard = await readJson(filePath, { schemaVersion: SCHEMA_VERSION, runs: [] })
    if (shard.schemaVersion !== SCHEMA_VERSION || !Array.isArray(shard.runs)) throw new Error(`地图记录分片损坏：${this.relative(filePath)}`)
    const runs = shard.runs.filter((item) => item.id !== normalized.id); runs.push(normalized)
    await atomicWrite(filePath, { schemaVersion: SCHEMA_VERSION, runs }); return normalized
  }
  async listShardPaths(filters = {}) {
    const base = path.join(this.root, 'runs'); const leagues = filters.league ? [safeSegment(filters.league)] : await readdir(base, { withFileTypes: true }).then((items) => items.filter((item) => item.isDirectory()).map((item) => item.name)).catch((error) => error.code === 'ENOENT' ? [] : Promise.reject(error))
    const paths = []
    for (const league of leagues) {
      const dir = path.join(base, league)
      const files = await readdir(dir, { withFileTypes: true }).catch((error) => error.code === 'ENOENT' ? [] : Promise.reject(error))
      for (const item of files) if (item.isFile() && /^\d{4}-\d{2}\.json$/.test(item.name)) paths.push(path.join(dir, item.name))
    }
    return paths
  }
  async all(filters = {}) {
    const errors = []; const runs = []
    for (const filePath of await this.listShardPaths(filters)) {
      try {
        const shard = await readJson(filePath, null)
        if (shard?.schemaVersion !== SCHEMA_VERSION || !Array.isArray(shard.runs)) throw new Error('schema')
        runs.push(...shard.runs.map(createMapRun))
      } catch { errors.push(`地图记录分片损坏：${this.relative(filePath)}`) }
    }
    const needle = String(filters.map || '').trim().toLocaleLowerCase()
    const filtered = runs.filter((run) => (!filters.league || run.league === filters.league) && (!filters.from || run.startedAt >= filters.from) && (!filters.to || run.startedAt <= filters.to) && (!needle || `${run.areaName} ${run.areaId}`.toLocaleLowerCase().includes(needle)))
    filtered.sort((a, b) => compareRuns(a, b, filters.direction))
    return { runs: filtered, errors }
  }
  async query(filters = {}) {
    const { runs, errors } = await this.all(filters); const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 25)); const page = Math.max(1, Number(filters.page) || 1)
    return { items: runs.slice((page - 1) * pageSize, page * pageSize), total: runs.length, page, pageSize, errors }
  }
  async findShard(id) {
    for (const filePath of await this.listShardPaths()) {
      let shard
      try { shard = await readJson(filePath, null) } catch { continue }
      if (shard?.schemaVersion !== SCHEMA_VERSION || !Array.isArray(shard.runs)) continue
      const index = shard.runs.findIndex((run) => run.id === id); if (index >= 0) return { filePath, shard, index }
    }
    throw new Error('未找到地图记录')
  }
  async editRun(id, patch = {}) {
    const found = await this.findShard(String(id || '')); const allowed = {}
    for (const [key, value] of Object.entries(patch || {})) if (EDITABLE_FIELDS.has(key)) allowed[key] = value
    found.shard.runs[found.index] = createMapRun({ ...found.shard.runs[found.index], ...allowed, id: found.shard.runs[found.index].id })
    await atomicWrite(found.filePath, found.shard); return found.shard.runs[found.index]
  }
  async deleteRun(id) { const found = await this.findShard(String(id || '')); const [removed] = found.shard.runs.splice(found.index, 1); await atomicWrite(found.filePath, found.shard); return createMapRun(removed) }
  async exportCsv(filters, filePath) { const { runs, errors } = await this.all(filters); if (errors.length) throw new Error('存在损坏分片，无法完整导出'); await writeFile(path.resolve(filePath), runsToCsv(runs), 'utf8'); return { count: runs.length } }
}

export { atomicWrite, safeSegment }
