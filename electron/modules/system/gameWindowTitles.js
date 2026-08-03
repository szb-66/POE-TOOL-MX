import fs from 'node:fs'
import path from 'node:path'
import {
  DEFAULT_GAME_WINDOW_TITLES,
  normalizeGameWindowTitles,
  validateGameWindowTitles
} from '../../../shared/gameWindowTitles.js'

export const GAME_WINDOW_TITLES_ENV = 'POE_GAME_WINDOW_TITLES_FILE'

export class GameWindowTitleRegistry {
  constructor({ userDataPath, fileSystem = fs, environment = process.env } = {}) {
    this.fileSystem = fileSystem
    this.environment = environment
    this.filePath = path.join(String(userDataPath || ''), 'game-window-titles.json')
    this.titles = [...DEFAULT_GAME_WINDOW_TITLES]
  }

  initialize() {
    this.fileSystem.mkdirSync(path.dirname(this.filePath), { recursive: true })
    this.environment[GAME_WINDOW_TITLES_ENV] = this.filePath
    this.write(this.titles)
    return this.getTitles()
  }

  update(value) {
    const result = validateGameWindowTitles(value)
    if (!result.valid) throw new Error(result.error)
    this.write(result.titles)
    this.titles = result.titles
    return this.getTitles()
  }

  write(value) {
    const titles = normalizeGameWindowTitles(value)
    const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`
    try {
      this.fileSystem.writeFileSync(
        temporaryPath,
        `${JSON.stringify({ version: 1, titles }, null, 2)}\n`,
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
}
