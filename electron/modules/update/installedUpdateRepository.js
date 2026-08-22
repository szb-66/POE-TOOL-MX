import fs from 'node:fs/promises'
import path from 'node:path'

const RECORD_FILE_NAME = 'pending-installed-update.json'
const MAX_RELEASE_NOTES_LENGTH = 50_000
const STABLE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/

function normalizeRecord(input) {
  const targetVersion = String(input?.targetVersion || '').trim()
  const releaseNotes = String(input?.releaseNotes || '').trim()
  if (!STABLE_VERSION_PATTERN.test(targetVersion)) throw new Error('更新记录版本无效')
  if (!releaseNotes || releaseNotes.length > MAX_RELEASE_NOTES_LENGTH) throw new Error('更新记录内容无效')
  return { targetVersion, releaseNotes }
}
export class InstalledUpdateRepository {
  constructor({ userDataPath, fileSystem = fs, now = () => Date.now() } = {}) {
    this.fileSystem = fileSystem
    this.now = now
    this.directory = path.join(String(userDataPath || ''), 'updates')
    this.filePath = path.join(this.directory, RECORD_FILE_NAME)
  }

  async save(input) {
    const record = normalizeRecord(input)
    const temporaryPath = `${this.filePath}.${process.pid}.${this.now()}.tmp`
    await this.fileSystem.mkdir(this.directory, { recursive: true })
    try {
      await this.fileSystem.writeFile(temporaryPath, `${JSON.stringify(record, null, 2)}\n`, {
        encoding: 'utf8',
        mode: 0o600
      })
      await this.fileSystem.rename(temporaryPath, this.filePath)
      return record
    } catch (error) {
      await this.fileSystem.unlink(temporaryPath).catch(() => {})
      throw error
    }
  }

  async read() {
    try {
      const content = await this.fileSystem.readFile(this.filePath, 'utf8')
      return normalizeRecord(JSON.parse(content))
    } catch {
      return null
    }
  }

  async loadForVersion(currentVersion) {
    const record = await this.read()
    return record?.targetVersion === String(currentVersion || '') ? record : null
  }

  async acknowledge(currentVersion) {
    const record = await this.loadForVersion(currentVersion)
    if (!record) return false
    try {
      await this.fileSystem.unlink(this.filePath)
      return true
    } catch (error) {
      if (error?.code === 'ENOENT') return true
      throw error
    }
  }
}
