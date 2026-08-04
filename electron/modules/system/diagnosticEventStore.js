import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { sanitizeDiagnosticEvent } from './diagnostics.js'

export const DIAGNOSTIC_EVENT_STORE_VERSION = 1
export const DIAGNOSTIC_EVENT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000
export const DIAGNOSTIC_EVENT_LIMIT = 200
export const DIAGNOSTIC_EVENT_DEDUPE_MS = 60 * 1000

export class DiagnosticEventStore {
  constructor({
    userDataPath,
    appVersion = 'unknown',
    sessionId = randomUUID(),
    fileSystem = fs,
    now = () => Date.now()
  } = {}) {
    this.directory = path.join(String(userDataPath || ''), 'diagnostics')
    this.filePath = path.join(this.directory, 'events.json')
    this.temporaryPath = path.join(this.directory, 'events.next.json')
    this.appVersion = String(appVersion)
    this.sessionId = sessionId
    this.fileSystem = fileSystem
    this.now = now
    this.queue = Promise.resolve()
  }

  async readDocument() {
    try {
      const parsed = JSON.parse(await this.fileSystem.readFile(this.filePath, 'utf8'))
      if (parsed?.schemaVersion !== DIAGNOSTIC_EVENT_STORE_VERSION || !Array.isArray(parsed.events)) {
        return { events: [], corrupt: true }
      }
      return { events: parsed.events.map(sanitizeDiagnosticEvent).filter(Boolean), corrupt: false }
    } catch (error) {
      if (error?.code === 'ENOENT') return { events: [], corrupt: false }
      return { events: [], corrupt: true }
    }
  }

  prune(events, now = this.now()) {
    const cutoff = now - DIAGNOSTIC_EVENT_RETENTION_MS
    return events
      .filter(event => Date.parse(event.timestamp) >= cutoff)
      .sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp))
      .slice(-DIAGNOSTIC_EVENT_LIMIT)
  }

  async read() {
    await this.queue
    const document = await this.readDocument()
    return { events: this.prune(document.events), corrupt: document.corrupt }
  }

  async write(events) {
    await this.fileSystem.mkdir(this.directory, { recursive: true })
    await this.fileSystem.writeFile(this.temporaryPath, `${JSON.stringify({
      schemaVersion: DIAGNOSTIC_EVENT_STORE_VERSION,
      events: this.prune(events)
    }, null, 2)}\n`, 'utf8')
    await this.fileSystem.rename(this.temporaryPath, this.filePath)
  }

  record(input = {}) {
    const operation = async () => {
      const document = await this.readDocument()
      const now = this.now()
      const timestamp = new Date(now).toISOString()
      const candidate = sanitizeDiagnosticEvent({
        ...input,
        timestamp,
        sessionId: this.sessionId,
        appVersion: this.appVersion,
        repeatCount: 1
      })
      if (!candidate) return { recorded: false, reason: 'invalid_event' }

      const events = this.prune(document.events, now)
      const lastForOperation = [...events].reverse().find(event => (
        event.area === candidate.area && event.operation === candidate.operation
      ))
      if (candidate.outcome === 'recovered' && lastForOperation?.outcome !== 'failed') {
        return { recorded: false, reason: 'no_failure_to_recover' }
      }

      const last = events.at(-1)
      const duplicate = last && last.sessionId === candidate.sessionId &&
        last.area === candidate.area && last.operation === candidate.operation &&
        last.outcome === candidate.outcome && last.reasonCode === candidate.reasonCode &&
        now - Date.parse(last.timestamp) <= DIAGNOSTIC_EVENT_DEDUPE_MS
      if (duplicate) {
        events[events.length - 1] = {
          ...last,
          timestamp,
          repeatCount: Math.max(1, Number(last.repeatCount) || 1) + 1,
          ...(candidate.metadata ? { metadata: candidate.metadata } : {})
        }
      } else {
        events.push(candidate)
      }

      await this.write(events)
      return { recorded: true, corruptHistoryDiscarded: document.corrupt }
    }

    const result = this.queue.then(operation, operation)
    this.queue = result.catch(() => undefined)
    return result.catch(() => ({ recorded: false, reason: 'store_unavailable' }))
  }
}
