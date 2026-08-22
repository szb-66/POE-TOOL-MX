import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { feedbackBaseUrl, isDailyUsageConfigured } from '../feedback/config.js'

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000
const DEFAULT_RETRY_DELAYS_MS = Object.freeze([15 * 60_000, 60 * 60_000, 6 * 60 * 60_000])
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function beijingDate(now = Date.now()) {
  return new Date(now + BEIJING_OFFSET_MS).toISOString().slice(0, 10)
}

export function millisecondsUntilNextBeijingReport(now = Date.now()) {
  const shifted = new Date(now + BEIJING_OFFSET_MS)
  const nextReportShifted = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() + 1,
    0,
    5
  )
  return Math.max(1, nextReportShifted - BEIJING_OFFSET_MS - now)
}

export class DailyUsageDateStore {
  constructor({ userDataPath, fs = { mkdir, readFile, rename, writeFile } }) {
    this.directory = path.join(userDataPath, 'feedback')
    this.filePath = path.join(this.directory, 'daily-usage-date')
    this.fs = fs
  }

  async read() {
    try {
      const value = (await this.fs.readFile(this.filePath, 'utf8')).trim()
      return DATE_PATTERN.test(value) ? value : null
    } catch {
      return null
    }
  }

  async write(value) {
    if (!DATE_PATTERN.test(value)) throw new TypeError('Invalid daily usage date')
    await this.fs.mkdir(this.directory, { recursive: true })
    const temporaryPath = `${this.filePath}.tmp-${process.pid}`
    await this.fs.writeFile(temporaryPath, `${value}\n`, { encoding: 'utf8', mode: 0o600 })
    await this.fs.rename(temporaryPath, this.filePath)
  }
}

async function safeResponseCode(response) {
  try {
    const payload = await response.json()
    return String(payload?.code || payload?.error || `HTTP_${response.status}`)
  } catch {
    return `HTTP_${response.status}`
  }
}

export class DailyUsageError extends Error {
  constructor(code, status = 0) {
    super('每日使用状态上报失败')
    this.name = 'DailyUsageError'
    this.code = code
    this.status = status
  }
}

export class DailyUsageService {
  constructor({
    config,
    auth,
    appVersion,
    runtimeMode,
    userDataPath,
    dateStore = new DailyUsageDateStore({ userDataPath }),
    platform = process.platform,
    arch = process.arch,
    fetchImpl = globalThis.fetch,
    now = () => Date.now(),
    scheduler = globalThis,
    retryDelaysMs = DEFAULT_RETRY_DELAYS_MS,
    requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    timers = globalThis
  }) {
    this.config = config
    this.auth = auth
    this.runtimeMode = runtimeMode
    this.dateStore = dateStore
    this.fetch = fetchImpl
    this.now = now
    this.scheduler = scheduler
    this.retryDelaysMs = [...retryDelaysMs]
    this.requestTimeoutMs = Number.isFinite(requestTimeoutMs) && requestTimeoutMs > 0
      ? requestTimeoutMs
      : DEFAULT_REQUEST_TIMEOUT_MS
    this.timers = timers
    this.payload = Object.freeze({
      app_version: String(appVersion || ''),
      platform: String(platform || ''),
      arch: String(arch || ''),
      runtime_mode: 'packaged'
    })
    this.started = false
    this.successfulDate = null
    this.retryDate = null
    this.retryIndex = 0
    this.rolloverTimer = null
    this.retryTimer = null
    this.inFlight = null
  }

  start() {
    if (this.started) return true
    if (this.runtimeMode !== 'packaged' || !isDailyUsageConfigured(this.config)) return false
    this.started = true
    this.scheduleRollover()
    void this.initialize()
    return true
  }

  async initialize() {
    const storedDate = await this.dateStore.read()
    if (!this.started) return
    const today = beijingDate(this.now())
    if (storedDate === today) {
      this.successfulDate = today
      return
    }
    this.runScheduledReport()
  }

  stop() {
    if (this.rolloverTimer !== null) this.scheduler.clearTimeout(this.rolloverTimer)
    if (this.retryTimer !== null) this.scheduler.clearTimeout(this.retryTimer)
    this.rolloverTimer = null
    this.retryTimer = null
    this.started = false
  }

  scheduleRollover() {
    if (!this.started) return
    if (this.rolloverTimer !== null) this.scheduler.clearTimeout(this.rolloverTimer)
    this.rolloverTimer = this.scheduler.setTimeout(() => {
      this.rolloverTimer = null
      if (!this.started) return
      if (this.retryTimer !== null) this.scheduler.clearTimeout(this.retryTimer)
      this.retryTimer = null
      this.retryDate = beijingDate(this.now())
      this.retryIndex = 0
      this.scheduleRollover()
      this.runScheduledReport()
    }, millisecondsUntilNextBeijingReport(this.now()))
    this.rolloverTimer?.unref?.()
  }

  runScheduledReport() {
    if (!this.started) return
    const reportDate = beijingDate(this.now())
    void this.report().catch(() => this.scheduleRetry(reportDate))
  }

  scheduleRetry(reportDate) {
    if (!this.started || this.successfulDate === reportDate) return
    const currentDate = beijingDate(this.now())
    if (this.retryDate !== currentDate) {
      this.retryDate = currentDate
      this.retryIndex = 0
    }
    if (this.retryIndex >= this.retryDelaysMs.length || this.retryTimer !== null) return
    const delay = this.retryDelaysMs[this.retryIndex]
    this.retryIndex += 1
    this.retryTimer = this.scheduler.setTimeout(() => {
      this.retryTimer = null
      this.runScheduledReport()
    }, delay)
    this.retryTimer?.unref?.()
  }

  report() {
    if (this.runtimeMode !== 'packaged' || !isDailyUsageConfigured(this.config)) return Promise.resolve(false)
    const reportDate = beijingDate(this.now())
    if (this.successfulDate === reportDate) return Promise.resolve(false)
    if (this.inFlight) return this.inFlight
    this.inFlight = this.performReport().then(async result => {
      this.successfulDate = reportDate
      this.retryDate = reportDate
      this.retryIndex = 0
      if (this.retryTimer !== null) this.scheduler.clearTimeout(this.retryTimer)
      this.retryTimer = null
      try { await this.dateStore.write(reportDate) } catch { /* remote success is authoritative */ }
      return result
    }).finally(() => {
      this.inFlight = null
    })
    return this.inFlight
  }

  async performReport() {
    const controller = new AbortController()
    let timeout = null
    const timeoutResult = new Promise((resolve, reject) => {
      timeout = this.timers.setTimeout(() => {
        reject(new DailyUsageError('DAILY_USAGE_TIMEOUT'))
        controller.abort()
      }, this.requestTimeoutMs)
      timeout?.unref?.()
    })
    try {
      return await Promise.race([this.performReportAttempt(controller.signal), timeoutResult])
    } finally {
      if (timeout !== null) this.timers.clearTimeout(timeout)
    }
  }

  async performReportAttempt(signal) {
    let session = await this.auth.getSession()
    if (signal.aborted) throw new DailyUsageError('DAILY_USAGE_TIMEOUT')
    let response = await this.send(session, signal)
    if (response.status === 401) {
      this.auth.invalidate()
      session = await this.auth.getSession({ force: true })
      if (signal.aborted) throw new DailyUsageError('DAILY_USAGE_TIMEOUT')
      response = await this.send(session, signal)
    }
    if (!response.ok) throw new DailyUsageError(await safeResponseCode(response), response.status)
    return true
  }

  send(session, signal) {
    return this.fetch(
      `${feedbackBaseUrl(this.config)}/v1/rdb/rest/${encodeURIComponent(this.config.dailyUsageTable)}`,
      {
        method: 'POST',
        signal,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(this.payload)
      }
    )
  }
}
