import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

export function sanitizeClientEventSettings(value = {}) {
  const logPath = path.basename(String(value.logPath || '')).toLowerCase() === 'client.txt' ? path.resolve(String(value.logPath)) : ''
  return { version: 1, enabled: value.enabled === true, logPath }
}

export class ClientEventSettingsRepository {
  constructor(filePath) { this.filePath = path.resolve(filePath); this.value = null }
  async get() {
    if (!this.value) {
      try { this.value = sanitizeClientEventSettings(JSON.parse(await readFile(this.filePath, 'utf8'))) } catch { this.value = sanitizeClientEventSettings() }
    }
    return structuredClone(this.value)
  }
  async save(patch = {}) {
    this.value = sanitizeClientEventSettings({ ...(await this.get()), ...patch })
    await mkdir(path.dirname(this.filePath), { recursive: true })
    const temporary = `${this.filePath}.tmp`
    await writeFile(temporary, JSON.stringify(this.value, null, 2), 'utf8')
    await rename(temporary, this.filePath)
    return structuredClone(this.value)
  }
}

export function deriveClientLogPath(executablePath) {
  const value = String(executablePath || '').trim()
  return value ? path.join(path.dirname(value), 'logs', 'Client.txt') : ''
}
