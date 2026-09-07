import fs from 'node:fs'
import { readFile } from 'node:fs/promises'
import { webcrypto } from 'node:crypto'

const preparing = () => ({ ready: false, reason: '模型准备中' })

export async function validateModelFiles(paths) {
  let manifest
  try { manifest = JSON.parse(await readFile(paths.manifest, 'utf8')) } catch (error) {
    return { ready: false, reason: error.code === 'ENOENT' ? '君锋镇高亮模型清单不存在' : '君锋镇高亮模型清单损坏' }
  }
  if (manifest?.schemaVersion !== 1 || manifest.architectureVersion !== 1 ||
      JSON.stringify(manifest.classes) !== JSON.stringify(['highlighted', 'dimmed', 'empty'])) {
    return { ready: false, reason: '君锋镇高亮模型契约不兼容' }
  }
  let bytes
  try { bytes = await readFile(paths.model) } catch (error) {
    return { ready: false, reason: error.code === 'ENOENT' ? '君锋镇高亮模型文件不存在' : '君锋镇高亮模型文件读取失败' }
  }
  const hash = Buffer.from(await webcrypto.subtle.digest('SHA-256', bytes)).toString('hex')
  if (hash !== String(manifest.sha256 || '').toLowerCase()) {
    return { ready: false, reason: '君锋镇高亮模型校验失败' }
  }
  return { ready: true, reason: '', modelVersion: String(manifest.modelVersion || '') }
}

export class ModelAvailability {
  constructor(paths, { onChange = () => {}, validate = validateModelFiles, log = () => {} } = {}) {
    Object.assign(this, { paths, onChange, validate, log })
    this.state = preparing()
    this.enabled = false
    this.generation = 0
    this.pending = null
    this.listeners = []
  }

  setEnabled(enabled) {
    if (this.enabled === enabled) return
    this.enabled = enabled
    this.generation++
    this.state = preparing()
    if (enabled) {
      for (const file of Object.values(this.paths)) {
        const listener = () => this.invalidate()
        fs.watchFile(file, { persistent: false, interval: 1000 }, listener)
        this.listeners.push([file, listener])
      }
      void this.refresh()
    } else {
      for (const [file, listener] of this.listeners) fs.unwatchFile(file, listener)
      this.listeners = []
    }
  }

  getState() { return { ...this.state } }

  invalidate() {
    this.generation++
    this.state = preparing()
    if (this.enabled) {
      this.onChange()
      void this.refresh()
    }
  }

  refresh() {
    if (this.pending) return this.pending
    if (!this.enabled) return Promise.resolve(this.getState())
    const generation = this.generation
    const started = performance.now()
    this.pending = Promise.resolve().then(() => this.validate(this.paths))
      .catch(error => ({ ready: false, reason: `君锋镇高亮模型校验失败：${error.message}` }))
      .then(state => {
        if (this.enabled && generation === this.generation) {
          this.state = state
          this.onChange()
        }
        this.log({ phase: 'model-validation', durationMs: performance.now() - started, ready: state.ready })
        return this.getState()
      }).finally(() => {
        this.pending = null
        if (this.enabled && generation !== this.generation) void this.refresh()
      })
    return this.pending
  }

  dispose() { this.setEnabled(false) }
}
