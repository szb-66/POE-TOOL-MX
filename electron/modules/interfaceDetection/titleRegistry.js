import fs from 'node:fs'
import path from 'node:path'

export const TITLE_KEYS = ['sanctum-hud', 'sanctum-map-hud', 'sanctum-map', 'sanctum-map-entry', 'sanctum-altar', 'sanctum-locker']
export class InterfaceTitleRegistry {
  constructor(file) {
    this.file = file
    this.templates = {}
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'))
      for (const key of TITLE_KEYS) {
        const candidates = key === 'sanctum-map' ? [key, ...[1, 2, 3, 4].map(n => `sanctum-map-${n}`)] : [key]
        for (const candidate of candidates) {
          if (!data[candidate]) continue
          try { this.templates[key] = this.validate(key, data[candidate]); break }
          catch { /* One invalid template must not discard other valid captures. */ }
        }
      }
    } catch { /* Missing titles require capture, never import legacy anchors. */ }
  }
  validate(key, value) {
    if (!TITLE_KEYS.includes(key)) throw new Error('未知公共标题')
    if (typeof value?.png !== 'string' || !/^iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(value.png) || value.png.length > 1400000) throw new Error('公共标题截图无效')
    const env = value.environment
    if (!env || !Number.isInteger(env.width) || !Number.isInteger(env.height) || env.width < 100 || env.height < 100 || env.width > 16384 || env.height > 16384 || !Number.isFinite(env.dpi) || env.dpi < 48 || env.dpi > 768) throw new Error('公共标题环境无效')
    return structuredClone(value)
  }
  set(key, value) {
    if (!TITLE_KEYS.includes(key)) throw new Error('未知公共标题')
    const next = { ...this.templates }
    if (value) next[key] = this.validate(key, value)
    else delete next[key]
    fs.mkdirSync(path.dirname(this.file), { recursive: true })
    const temporary = `${this.file}.tmp`
    try {
      fs.writeFileSync(temporary, JSON.stringify(next), 'utf8')
      fs.renameSync(temporary, this.file)
    } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary) }
    this.templates = next
  }
}
