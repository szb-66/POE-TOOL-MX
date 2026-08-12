import { EventEmitter } from 'node:events'
import { runStrictCleanup } from '../lifecycle/strictCleanup.js'

export const UPDATE_MODE_MANUAL = 'manual'
export const UPDATE_MODE_AUTOMATIC = 'automatic'
export const UPDATE_MODES = new Set([UPDATE_MODE_MANUAL, UPDATE_MODE_AUTOMATIC])
export const UPDATE_SOURCE_CNB = 'cnb'
export const UPDATE_SOURCE_GITHUB = 'github'
export const UPDATE_SOURCES = new Set([UPDATE_SOURCE_CNB, UPDATE_SOURCE_GITHUB])

const UPDATE_SOURCE_URLS = {
  [UPDATE_SOURCE_CNB]: 'https://cnb.cool/Auto-Tool-MX/POE-TOOL-MX/-/releases/latest/download',
  [UPDATE_SOURCE_GITHUB]: 'https://github.com/szb-66/POE-TOOL-MX/releases/latest/download'
}

const DEFAULT_FIRST_CHECK_DELAY_MS = 30_000
const DEFAULT_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

function normalizedMode(mode) {
  return mode === UPDATE_MODE_AUTOMATIC ? UPDATE_MODE_AUTOMATIC : UPDATE_MODE_MANUAL
}

function normalizedSource(source) {
  return source === UPDATE_SOURCE_GITHUB ? UPDATE_SOURCE_GITHUB : UPDATE_SOURCE_CNB
}

function versionParts(version) {
  const match = String(version || '').match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/)
  if (!match) return null
  return { numbers: match.slice(1, 4).map(Number), prerelease: match[4] || '' }
}

export function isStableNewerVersion(candidate, current) {
  const next = versionParts(candidate)
  const installed = versionParts(current)
  if (!next || !installed || next.prerelease) return false
  for (let index = 0; index < 3; index += 1) {
    if (next.numbers[index] !== installed.numbers[index]) {
      return next.numbers[index] > installed.numbers[index]
    }
  }
  return false
}

export function normalizeReleaseNotes(notes) {
  if (Array.isArray(notes)) {
    return notes
      .map(note => typeof note === 'string' ? note : note?.note)
      .filter(Boolean)
      .join('\n\n')
      .trim()
  }
  return typeof notes === 'string' ? notes.trim() : ''
}

export function sanitizeUpdateError(error) {
  let message = String(error?.message || error || '更新操作失败')
  message = message
    .replace(/https?:\/\/[^\s?#]+(?:\?[^\s#]*)?/gi, '[update-source]')
    .replace(/(?:[A-Za-z]:\\|\\\\)[^\r\n"']+/g, '[local-path]')
    .replace(/\b(token|authorization|bearer|password)=?\s*[^\s,;]+/gi, '$1=[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
  return message.slice(0, 240) || '更新操作失败'
}

function updateInfo(info = {}) {
  return {
    availableVersion: String(info.version || ''),
    releaseName: String(info.releaseName || ''),
    releaseDate: String(info.releaseDate || ''),
    releaseNotes: normalizeReleaseNotes(info.releaseNotes)
  }
}

function defaultScheduler() {
  return { setTimeout, clearTimeout, setInterval, clearInterval }
}

export class ApplicationUpdateService extends EventEmitter {
  constructor({
    updater,
    currentVersion,
    isPackaged,
    cleanup,
    scheduler = defaultScheduler(),
    firstCheckDelayMs = DEFAULT_FIRST_CHECK_DELAY_MS,
    checkIntervalMs = DEFAULT_CHECK_INTERVAL_MS,
    cleanupTimeoutMs = 8000,
    markCleanupComplete = () => {},
    requestShutdown = () => {}
  }) {
    super()
    this.updater = updater
    this.cleanup = cleanup
    this.scheduler = scheduler
    this.firstCheckDelayMs = firstCheckDelayMs
    this.checkIntervalMs = checkIntervalMs
    this.cleanupTimeoutMs = cleanupTimeoutMs
    this.markCleanupComplete = markCleanupComplete
    this.requestShutdown = requestShutdown
    this.firstCheckTimer = null
    this.intervalTimer = null
    this.operation = null
    this.installing = false
    this.downloadReady = false
    this.state = {
      mode: UPDATE_MODE_MANUAL,
      source: UPDATE_SOURCE_CNB,
      currentVersion: String(currentVersion || ''),
      status: 'idle',
      availableVersion: '',
      releaseName: '',
      releaseDate: '',
      releaseNotes: '',
      progress: null,
      error: '',
      supported: Boolean(isPackaged)
    }

    this.updater.autoDownload = false
    this.updater.autoInstallOnAppQuit = false
    this.updater.allowDowngrade = false
    this.updater.allowPrerelease = false
    this.bindUpdaterEvents()
  }

  bindUpdaterEvents() {
    this.listeners = {
      checking: () => this.patch({ status: 'checking', error: '' }),
      available: info => {
        if (!isStableNewerVersion(info?.version, this.state.currentVersion)) {
          this.operation = null
          this.patch({ status: 'not-available', progress: null, error: '' })
          return
        }
        this.patch({ status: 'available', ...updateInfo(info), progress: null, error: '' })
        if (this.state.mode === UPDATE_MODE_MANUAL) this.operation = null
      },
      notAvailable: info => {
        this.operation = null
        this.patch({ status: 'not-available', ...updateInfo(info), progress: null, error: '' })
      },
      progress: progress => {
        this.operation = 'download'
        this.patch({
          status: 'downloading',
          progress: {
            percent: Math.max(0, Math.min(100, Number(progress?.percent) || 0)),
            transferred: Math.max(0, Number(progress?.transferred) || 0),
            total: Math.max(0, Number(progress?.total) || 0),
            bytesPerSecond: Math.max(0, Number(progress?.bytesPerSecond) || 0)
          },
          error: ''
        })
      },
      downloaded: info => {
        this.operation = null
        this.downloadReady = true
        this.patch({ status: 'downloaded', ...updateInfo(info), progress: { ...(this.state.progress || {}), percent: 100 }, error: '' })
      },
      error: error => {
        const failedOperation = this.operation
        this.operation = null
        this.patch({
          status: this.downloadReady ? 'downloaded' : failedOperation === 'download' ? 'available' : 'error',
          error: sanitizeUpdateError(error)
        })
      }
    }
    this.updater.on('checking-for-update', this.listeners.checking)
    this.updater.on('update-available', this.listeners.available)
    this.updater.on('update-not-available', this.listeners.notAvailable)
    this.updater.on('download-progress', this.listeners.progress)
    this.updater.on('update-downloaded', this.listeners.downloaded)
    this.updater.on('error', this.listeners.error)
  }

  snapshot() {
    return JSON.parse(JSON.stringify(this.state))
  }

  patch(patch) {
    this.state = { ...this.state, ...patch }
    const snapshot = this.snapshot()
    this.emit('state-changed', snapshot)
    return snapshot
  }

  configure(input = {}) {
    const mode = normalizedMode(input.mode)
    const source = normalizedSource(input.source)
    if (source !== this.state.source && (this.operation || this.installing)) {
      throw new Error('更新操作进行中，无法切换下载源')
    }
    if (source !== this.state.source) {
      this.updater.setFeedURL({ provider: 'generic', url: UPDATE_SOURCE_URLS[source] })
      this.downloadReady = false
      this.updater.downloadedUpdateHelper?.clear()?.catch?.(() => {})
      this.state = {
        ...this.state,
        source,
        status: 'idle',
        availableVersion: '',
        releaseName: '',
        releaseDate: '',
        releaseNotes: '',
        progress: null,
        error: ''
      }
    }
    this.state.mode = mode
    this.updater.autoDownload = mode === UPDATE_MODE_AUTOMATIC
    this.clearSchedule()
    if (mode === UPDATE_MODE_AUTOMATIC && this.state.supported) this.scheduleAutomaticChecks()
    return this.patch({ mode, source })
  }

  scheduleAutomaticChecks() {
    this.firstCheckTimer = this.scheduler.setTimeout(() => {
      this.firstCheckTimer = null
      void this.check({ automatic: true })
    }, this.firstCheckDelayMs)
    this.intervalTimer = this.scheduler.setInterval(() => {
      void this.check({ automatic: true })
    }, this.checkIntervalMs)
  }

  clearSchedule() {
    if (this.firstCheckTimer != null) this.scheduler.clearTimeout(this.firstCheckTimer)
    if (this.intervalTimer != null) this.scheduler.clearInterval(this.intervalTimer)
    this.firstCheckTimer = null
    this.intervalTimer = null
  }

  async check({ automatic = false } = {}) {
    if (!this.state.supported) return this.patch({ status: 'idle', error: '更新检查仅在已安装的正式客户端中可用' })
    if (this.operation || this.installing) return { success: false, busy: true, state: this.snapshot() }
    this.operation = 'check'
    this.updater.autoDownload = automatic || this.state.mode === UPDATE_MODE_AUTOMATIC
    this.patch({ status: 'checking', error: '' })
    try {
      await this.updater.checkForUpdates()
      return { success: true, state: this.snapshot() }
    } catch (error) {
      this.operation = null
      return { success: false, state: this.patch({ status: 'error', error: sanitizeUpdateError(error) }) }
    }
  }

  async download() {
    if (!this.state.supported) return { success: false, state: this.snapshot() }
    if (this.operation || this.installing) return { success: false, busy: true, state: this.snapshot() }
    if (this.state.status !== 'available') return { success: false, state: this.snapshot() }
    this.operation = 'download'
    this.patch({ status: 'downloading', error: '', progress: { percent: 0, transferred: 0, total: 0, bytesPerSecond: 0 } })
    try {
      await this.updater.downloadUpdate()
      return { success: true, state: this.snapshot() }
    } catch (error) {
      this.operation = null
      return { success: false, state: this.patch({ status: 'available', error: sanitizeUpdateError(error) }) }
    }
  }

  async restartAndInstall() {
    if (this.installing) return { success: false, busy: true, reason: 'install-in-progress', state: this.snapshot() }
    if (!this.downloadReady) return { success: false, reason: 'update-not-downloaded', state: this.snapshot() }
    this.installing = true
    try {
      await runStrictCleanup(this.cleanup, this.cleanupTimeoutMs)
      this.markCleanupComplete()
      this.updater.quitAndInstall(false, true)
      return { success: true, state: this.snapshot() }
    } catch (error) {
      const reason = error?.name === 'StrictCleanupTimeoutError' ? 'cleanup-timeout' : 'cleanup-failed'
      const state = this.patch({ status: 'error', error: sanitizeUpdateError(error) })
      try {
        this.requestShutdown({ reason, error })
      } catch {
        // 退出请求本身失败时仍返回原始清理错误，避免覆盖根因。
      }
      return { success: false, reason, state }
    }
  }

  dispose() {
    this.clearSchedule()
    if (this.listeners) {
      this.updater.removeListener('checking-for-update', this.listeners.checking)
      this.updater.removeListener('update-available', this.listeners.available)
      this.updater.removeListener('update-not-available', this.listeners.notAvailable)
      this.updater.removeListener('download-progress', this.listeners.progress)
      this.updater.removeListener('update-downloaded', this.listeners.downloaded)
      this.updater.removeListener('error', this.listeners.error)
    }
  }
}
