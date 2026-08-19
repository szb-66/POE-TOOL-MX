import { feedbackBaseUrl, isPresenceConfigured } from '../feedback/config.js'

const DEFAULT_INTERVAL_MS = 60_000
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000

async function safeResponseCode(response) {
  try {
    const payload = await response.json()
    return String(payload?.code || payload?.error || `HTTP_${response.status}`)
  } catch {
    return `HTTP_${response.status}`
  }
}

export class AppPresenceError extends Error {
  constructor(code, status = 0) {
    super('在线状态上报失败')
    this.name = 'AppPresenceError'
    this.code = code
    this.status = status
  }
}

export class AppPresenceService {
  constructor({
    config,
    auth,
    appVersion,
    runtimeMode,
    platform = process.platform,
    arch = process.arch,
    fetchImpl = globalThis.fetch,
    scheduler = globalThis,
    intervalMs = DEFAULT_INTERVAL_MS,
    requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    timers = globalThis
  }) {
    this.config = config
    this.auth = auth
    this.fetch = fetchImpl
    this.scheduler = scheduler
    this.intervalMs = intervalMs
    this.requestTimeoutMs = Number.isFinite(requestTimeoutMs) && requestTimeoutMs > 0
      ? requestTimeoutMs
      : DEFAULT_REQUEST_TIMEOUT_MS
    this.timers = timers
    this.payload = Object.freeze({
      app_version: String(appVersion || ''),
      platform: String(platform || ''),
      arch: String(arch || ''),
      runtime_mode: runtimeMode === 'packaged' ? 'packaged' : 'development'
    })
    this.started = false
    this.timer = null
    this.inFlight = null
  }

  start() {
    if (this.started) return true
    if (!isPresenceConfigured(this.config)) return false
    this.started = true
    this.runScheduledReport()
    this.timer = this.scheduler.setInterval(() => this.runScheduledReport(), this.intervalMs)
    this.timer?.unref?.()
    return true
  }

  stop() {
    if (this.timer !== null) this.scheduler.clearInterval(this.timer)
    this.timer = null
    this.started = false
  }

  runScheduledReport() {
    void this.report().catch(() => {})
  }

  report() {
    if (!isPresenceConfigured(this.config)) return Promise.resolve(false)
    if (this.inFlight) return this.inFlight
    this.inFlight = this.performReport().finally(() => {
      this.inFlight = null
    })
    return this.inFlight
  }

  async performReport() {
    const controller = new AbortController()
    let timeout = null
    const timeoutResult = new Promise((resolve, reject) => {
      timeout = this.timers.setTimeout(() => {
        reject(new AppPresenceError('PRESENCE_TIMEOUT'))
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
    if (signal.aborted) throw new AppPresenceError('PRESENCE_TIMEOUT')
    let response = await this.send(session, signal)
    if (response.status === 401) {
      this.auth.invalidate()
      session = await this.auth.getSession({ force: true })
      if (signal.aborted) throw new AppPresenceError('PRESENCE_TIMEOUT')
      response = await this.send(session, signal)
    }
    if (!response.ok) throw new AppPresenceError(await safeResponseCode(response), response.status)
    return true
  }

  send(session, signal) {
    return this.fetch(
      `${feedbackBaseUrl(this.config)}/v1/rdb/rest/${encodeURIComponent(this.config.presenceTable)}`,
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
