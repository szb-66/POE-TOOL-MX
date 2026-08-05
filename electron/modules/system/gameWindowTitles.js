import fs from 'node:fs'
import path from 'node:path'
import {
  DEFAULT_GAME_WINDOW_TITLES,
  DEFAULT_GAME_WINDOW_PROCESS_NAMES,
  normalizeGameWindowProcessNames,
  normalizeGameWindowTitles,
  validateGameWindowProcessNames,
  validateGameWindowTitles
} from '../../../shared/gameWindowTitles.js'

export const GAME_WINDOW_TITLES_ENV = 'POE_GAME_WINDOW_TITLES_FILE'

export class GameWindowTitleRegistry {
  constructor({ userDataPath, fileSystem = fs, environment = process.env } = {}) {
    this.fileSystem = fileSystem
    this.environment = environment
    this.filePath = path.join(String(userDataPath || ''), 'game-window-titles.json')
    this.titles = [...DEFAULT_GAME_WINDOW_TITLES]
    this.processNames = [...DEFAULT_GAME_WINDOW_PROCESS_NAMES]
  }

  initialize() {
    this.fileSystem.mkdirSync(path.dirname(this.filePath), { recursive: true })
    this.environment[GAME_WINDOW_TITLES_ENV] = this.filePath
    try {
      const payload = JSON.parse(this.fileSystem.readFileSync(this.filePath, 'utf8'))
      const stored = Array.isArray(payload) ? { titles: payload } : payload
      if (Array.isArray(stored?.titles)) this.titles = normalizeGameWindowTitles(stored.titles)
      if (Array.isArray(stored?.processNames)) this.processNames = normalizeGameWindowProcessNames(stored.processNames)
    } catch {
      // 首次启动或配置损坏：沿用默认列表，并在下方写回可读配置
    }
    this.write()
    return { titles: this.getTitles(), processNames: this.getProcessNames() }
  }

  update(value) {
    const result = validateGameWindowTitles(value)
    if (!result.valid) throw new Error(result.error)
    this.write({ titles: result.titles })
    this.titles = result.titles
    return { titles: this.getTitles(), processNames: this.getProcessNames() }
  }

  updateProcessNames(value) {
    const result = validateGameWindowProcessNames(value)
    if (!result.valid) throw new Error(result.error)
    this.write({ processNames: result.processNames })
    this.processNames = result.processNames
    return { titles: this.getTitles(), processNames: this.getProcessNames() }
  }

  write(value) {
    const titles = normalizeGameWindowTitles(value?.titles ?? this.titles)
    const processNames = normalizeGameWindowProcessNames(value?.processNames ?? this.processNames)
    const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`
    try {
      this.fileSystem.writeFileSync(
        temporaryPath,
        `${JSON.stringify({
          version: 2,
          titles,
          processNames
        }, null, 2)}\n`,
        'utf8'
      )
      this.fileSystem.renameSync(temporaryPath, this.filePath)
    } catch (error) {
      try { this.fileSystem.unlinkSync(temporaryPath) } catch {}
      throw error
    }
  }

  getTitles() {
    return [...this.titles]
  }

  getProcessNames() {
    return [...this.processNames]
  }
}
