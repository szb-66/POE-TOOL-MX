import { randomUUID } from 'node:crypto'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, rmdirSync, existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const keys = ['runId', 'floorId', 'roomId']
const targetKey = value => JSON.stringify([value.floorId,value.roomId])
export function evidenceRegion(region, width, height) {
  if (!region || ['x','y','width','height'].some(key => !Number.isInteger(region[key]))
    || region.x < 0 || region.y < 0 || region.width < 1 || region.height < 1
    || region.x+region.width > width || region.y+region.height > height) throw new Error('识别区域越界或无效')
  return Object.fromEntries(['x','y','width','height'].map(key => [key,region[key]]))
}

export class SanctumEvidenceStore {
  constructor({ maxCount = 20, maxBytes = 64*1024*1024, directory = null } = {}) {
    this.records = new Map(); this.maxCount = maxCount; this.maxBytes = maxBytes; this.bytes = 0
    this.directory = directory; this.persistent = Boolean(directory); this.committed = new Set()
  }
  clear() {
    for (const id of [...this.records.keys()]) if (!this.committed.has(id)) this.delete(id)
    if (this.directory && !this.persistent) { rmdirSync(this.directory); this.directory = null }
  }
  reset() { this.committed.clear(); this.clear() }
  restore(records = []) {
    if (!Array.isArray(records)) return
    for (const record of records) {
      if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(record?.evidenceId || '')
        || keys.some(key=>typeof record[key] !== 'string') || !Number.isInteger(record.width) || !Number.isInteger(record.height)
        || record.width < 1 || record.height < 1 || record.width*record.height > 40_000_000) continue
      if (existsSync(join(this.directory, `${record.evidenceId}.png`))) {
        const safe = Object.fromEntries([...keys,'evidenceId','region','width','height','kind','sourceRegion','sourceWidth','sourceHeight','createdAt'].filter(key=>Object.hasOwn(record,key)).map(key=>[key,record[key]]))
        this.records.set(safe.evidenceId,safe); this.committed.add(safe.evidenceId)
      }
    }
    // Only generated UUID image files inside our own directory are eligible.
    // These are abandoned candidates from an interrupted atomic save.
    if (this.directory && existsSync(this.directory)) for (const name of readdirSync(this.directory)) {
      if (/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}\.png$/i.test(name) && !this.committed.has(name.slice(0,-4))) {
        try { unlinkSync(join(this.directory,name)) } catch { this.cleanupError='旧截图清理失败，将在下次启动重试' }
      }
    }
  }
  snapshot(value) {
    const ids = new Set()
    const visit = item => {
      if (!item || typeof item !== 'object') return
      if (item.previousCapture) { visit(item.previousCapture); return }
      if (['queued','reading','capturing'].includes(item.stage) || item.detailsStatus === 'reading') return
      if (typeof item.evidenceId === 'string') ids.add(item.evidenceId)
      Object.values(item).forEach(visit)
    }
    visit(value.lastCapture); visit(value.savedRoute); visit(value.savedOverlay)
    const latest = new Map()
    for (const id of ids) {
      const record=this.records.get(id)
      if (record && (!latest.has(targetKey(record)) || latest.get(targetKey(record)).createdAt < record.createdAt)) latest.set(targetKey(record),record)
    }
    // Long-term correction provenance can refer to older crops of the same
    // target. Keep those exact evidence versions rather than only the latest.
    const retained=new Map([...latest.values()].map(record=>[record.evidenceId,record]))
    ids.clear();visit(value.effectCorrectionMemory)
    for (const id of ids) if (this.records.has(id)) retained.set(id,this.records.get(id))
    return [...retained.values()].flatMap(record=> {
      if (!record) return []
      const {buffer,sessionId,...metadata}=record
      return [metadata]
    })
  }
  commit(records) {
    const next = new Set(records.map(record=>record.evidenceId))
    for (const id of this.committed) if (!next.has(id)) {
      try { this.delete(id) } catch { this.cleanupError='旧截图清理失败，将在下次启动重试' }
    }
    this.committed = next
  }
  add(context, frame) {
    if (keys.some(key => typeof context?.[key] !== 'string') || typeof context.sessionId !== 'string') throw new Error('截图目标身份无效')
    if (typeof frame?.png !== 'string' || frame.png.length > 24*1024*1024) throw new Error('冻结截图过大或无效')
    const buffer = Buffer.from(frame.png, 'base64')
    if (buffer.length < 24 || !buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error('冻结截图格式无效')
    const width = buffer.readUInt32BE(16), height = buffer.readUInt32BE(20)
    if (!width || !height || width*height > 40_000_000 || width !== frame.width || height !== frame.height) throw new Error('冻结截图尺寸无效')
    const region = frame.region ? evidenceRegion(frame.region, width, height) : null
    let source = {}
    if (['effect-crop','room-crop'].includes(frame.kind)) {
      if (!Number.isInteger(frame.sourceWidth) || !Number.isInteger(frame.sourceHeight) || frame.sourceWidth*frame.sourceHeight > 40_000_000) throw new Error('原图尺寸无效')
      const sourceRegion = evidenceRegion(frame.sourceRegion, frame.sourceWidth, frame.sourceHeight)
      if (!region || region.x !== 0 || region.y !== 0 || region.width !== width || region.height !== height
        || sourceRegion.width !== width || sourceRegion.height !== height) throw new Error('效果裁剪坐标不一致')
      source = {kind:frame.kind, sourceRegion, sourceWidth:frame.sourceWidth, sourceHeight:frame.sourceHeight}
    }
    const id = randomUUID(), record = { ...Object.fromEntries([...keys,'sessionId'].map(key => [key,context[key]])), evidenceId: id, createdAt:Date.now(), region, width, height, buffer, ...source }
    this.directory ||= mkdtempSync(join(tmpdir(), 'sanctum-evidence-'))
    mkdirSync(this.directory,{recursive:true})
    try { writeFileSync(join(this.directory, `${id}.png`), buffer, {flag:'wx'}) }
    catch { throw new Error('截图保存失败，请检查保存目录空间和访问权限') }
    // Publish only after the durable copy exists. Cache eviction must never
    // invalidate an ID still displayed by the current capture.
    if (!this.persistent) for (const [oldId, previous] of this.records) if (targetKey(previous) === targetKey(context)) this.delete(oldId)
    this.records.set(id, record); this.bytes += buffer.length
    let cached = [...this.records.values()].filter(value => value.buffer).length
    for (const value of this.records.values()) {
      if (cached <= this.maxCount && this.bytes <= this.maxBytes) break
      if (value.buffer) { this.bytes -= value.buffer.length; delete value.buffer; cached-- }
    }
    return id
  }
  delete(id) {
    const value = this.records.get(id)
    if (!value) return
    try { unlinkSync(join(this.directory, `${id}.png`)) } catch (error) { if (error.code !== 'ENOENT') throw error }
    this.bytes -= value.buffer?.length || 0; this.records.delete(id)
  }
  get(binding) {
    const record = this.records.get(binding?.evidenceId)
    if (!record || keys.some(key => record[key] !== binding[key])) throw new Error('截图已过期：结果已替换或未保存截图，请重新采集该房间')
    return record
  }
  image(binding) {
    const { buffer: cached, ...metadata } = this.get(binding)
    let buffer
    try { buffer = cached || readFileSync(join(this.directory, `${metadata.evidenceId}.png`)) }
    catch { throw new Error('截图不可用：图片文件读取失败，请重新采集该房间') }
    return { ...metadata, dataUrl: `data:image/png;base64,${buffer.toString('base64')}` }
  }
}
