import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { createMapRun, normalizeMapTrackerSettings } from './model.js'
import { runExperienceDelta } from '../../../shared/experienceStatistics.js'

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

const mutationQueues = new Map()
function serializeMutation(filePath, operation) {
  const absolute = path.resolve(filePath)
  const key = process.platform === 'win32' ? absolute.toLowerCase() : absolute
  const result = (mutationQueues.get(key) || Promise.resolve()).then(operation)
  const tail = result.catch(() => {}).finally(() => {
    if (mutationQueues.get(key) === tail) mutationQueues.delete(key)
  })
  mutationQueues.set(key, tail)
  return result
}

async function retryFileOperation(operation, sleep = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  const delays = [50, 100, 200]
  for (let attempt = 0; ; attempt++) {
    try { return await operation() } catch (error) {
      if (!['EPERM', 'EACCES', 'EBUSY'].includes(error.code) || attempt === delays.length) throw error
      await sleep(delays[attempt])
    }
  }
}

async function atomicWrite(filePath, value, { replace = rename, sleep } = {}) {
  const content = JSON.stringify(value, null, 2)
  await mkdir(path.dirname(filePath), { recursive: true })
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`)
  try {
    await writeFile(temporary, content, 'utf8')
    await retryFileOperation(() => replace(temporary, filePath), sleep)
  } catch (error) {
    await retryFileOperation(() => unlink(temporary)).catch(() => {})
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
  const columns = ['startedAt', 'endedAt', 'areaName', 'areaId', 'areaLevel', 'mapTier', 'activeDurationMs', 'experienceEfficiency', 'deaths', 'portalsUsed', 'character', 'endReason', 'experienceStart', 'experienceEnd', 'experienceSampleCount', 'experienceGrowth']
  const rows = runs.map((run) => columns.map((key) => {
    const value = key === 'character' ? run.character?.name || '' : key === 'experienceGrowth' ? runExperienceDelta(run) : run[key]
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
  async saveStashEvent(event) {
    const frozen = structuredClone(event)
    if (!frozen.id || !Number.isFinite(Date.parse(frozen.recordedAt))) throw new Error('入库事件标识或时间无效')
    const filePath = path.join(this.root, 'stash-events', `${monthOf(frozen.recordedAt)}.json`)
    return serializeMutation(filePath, async () => {
      const shard = await readJson(filePath, { schemaVersion: SCHEMA_VERSION, events: [] })
      if (shard.schemaVersion !== SCHEMA_VERSION || !Array.isArray(shard.events)) throw new Error('入库记录分片损坏')
      const existing = shard.events.find(item => item.id === frozen.id)
      if (existing) return existing
      shard.events.push(frozen)
      await atomicWrite(filePath, shard)
      return frozen
    })
  }
  async getStashEvents(now = Date.now()) {
    const start = new Date(now); start.setHours(0, 0, 0, 0)
    const from = Math.min(start.getTime(), now - 24 * 3600000)
    const months = new Set([monthOf(from), monthOf(now)])
    const events = []; const errors = []
    for (const month of months) {
      try {
        const shard = await readJson(path.join(this.root, 'stash-events', `${month}.json`), { schemaVersion: SCHEMA_VERSION, events: [] })
        if (shard.schemaVersion !== SCHEMA_VERSION || !Array.isArray(shard.events)) throw new Error('schema')
        events.push(...shard.events.filter(event => Date.parse(event.recordedAt) >= from && Date.parse(event.recordedAt) <= now))
      } catch { errors.push(`入库记录分片损坏：${month}`) }
    }
    return { events, errors }
  }
  async clearLegacyLoot() {
    const errors = []
    for (const filePath of [this.activePath, ...await this.listShardPaths()]) {
      try {
        await serializeMutation(filePath, async () => {
          const data = await readJson(filePath, null)
          if (!data) return
          const runs = filePath === this.activePath ? [data.run] : data.runs
          if (!Array.isArray(runs)) throw new Error('schema')
          let changed = false
          for (const run of runs) if (run && Object.hasOwn(run, 'loot')) { delete run.loot; changed = true }
          if (changed) await atomicWrite(filePath, data)
        })
      } catch { errors.push(`旧入库数据清理失败：${this.relative(filePath)}`) }
    }
    return errors
  }
  async getSettings() { return normalizeMapTrackerSettings(await readJson(this.settingsPath, {})) }
  async saveSettings(patch) {
    const frozen = structuredClone(patch)
    return serializeMutation(this.settingsPath, async () => {
      const value = normalizeMapTrackerSettings({ ...(await this.getSettings()), ...frozen })
      await atomicWrite(this.settingsPath, value); return value
    })
  }
  async getActiveRun() { const value = await readJson(this.activePath, null); return value?.run ? createMapRun(value.run) : null }
  async saveActiveRun(run) {
    const frozen = structuredClone(createMapRun(run))
    return serializeMutation(this.activePath, async () => {
      await atomicWrite(this.activePath, { schemaVersion: SCHEMA_VERSION, run: frozen }); return frozen
    })
  }
  async clearActiveRun() {
    return serializeMutation(this.activePath, () => retryFileOperation(() => unlink(this.activePath)).catch((error) => { if (error.code !== 'ENOENT') throw error }))
  }
  async saveRun(run) {
    const normalized = structuredClone(createMapRun(run)); const filePath = this.shardPath(normalized)
    return serializeMutation(filePath, async () => {
      const shard = await readJson(filePath, { schemaVersion: SCHEMA_VERSION, runs: [] })
      if (shard.schemaVersion !== SCHEMA_VERSION || !Array.isArray(shard.runs)) throw new Error(`地图记录分片损坏：${this.relative(filePath)}`)
      const runs = shard.runs.filter((item) => item.id !== normalized.id); runs.push(normalized)
      await atomicWrite(filePath, { schemaVersion: SCHEMA_VERSION, runs }); return normalized
    })
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
    patch = structuredClone(patch)
    const located = await this.findShard(String(id || ''))
    return serializeMutation(located.filePath, async () => {
      const found = await this.findShard(String(id || '')); const allowed = {}
      for (const [key, value] of Object.entries(patch || {})) if (EDITABLE_FIELDS.has(key)) allowed[key] = value
      found.shard.runs[found.index] = createMapRun({ ...found.shard.runs[found.index], ...allowed, id: found.shard.runs[found.index].id })
      await atomicWrite(found.filePath, found.shard); return found.shard.runs[found.index]
    })
  }
  async deleteRun(id) {
    const located = await this.findShard(String(id || ''))
    return serializeMutation(located.filePath, async () => {
      const found = await this.findShard(String(id || '')); const [removed] = found.shard.runs.splice(found.index, 1)
      await atomicWrite(found.filePath, found.shard); return createMapRun(removed)
    })
  }
  async exportCsv(filters, filePath) { const { runs, errors } = await this.all(filters); if (errors.length) throw new Error('存在损坏分片，无法完整导出'); await writeFile(path.resolve(filePath), runsToCsv(runs), 'utf8'); return { count: runs.length } }
}

export { atomicWrite, safeSegment }
