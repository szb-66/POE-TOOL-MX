import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  DIAGNOSTIC_AREAS,
  DIAGNOSTIC_CAPTURE_DURATION_MS,
  DIAGNOSTIC_SYMPTOMS,
  sanitizeDiagnosticContext,
  sanitizeDiagnosticEvent
} from './diagnostics.js'

export const DIAGNOSTIC_EVENT_STORE_VERSION = 2
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
      if (![1, DIAGNOSTIC_EVENT_STORE_VERSION].includes(parsed?.schemaVersion) || !Array.isArray(parsed.events)) {
        return { events: [], activeCapture: null, lastCapture: null, corrupt: true }
      }
      return {
        events: parsed.events.map(sanitizeDiagnosticEvent).filter(Boolean),
        activeCapture: parsed.schemaVersion === DIAGNOSTIC_EVENT_STORE_VERSION
          ? this.sanitizeStoredCapture(parsed.activeCapture, 'active')
          : null,
        lastCapture: parsed.schemaVersion === DIAGNOSTIC_EVENT_STORE_VERSION
          ? this.sanitizeStoredCapture(parsed.lastCapture)
          : null,
        corrupt: false
      }
    } catch (error) {
      if (error?.code === 'ENOENT') return { events: [], activeCapture: null, lastCapture: null, corrupt: false }
      return { events: [], activeCapture: null, lastCapture: null, corrupt: true }
    }
  }

  sanitizeStoredCapture(value, requiredStatus = null) {
    const context = sanitizeDiagnosticContext(value)
    if (context.mode !== 'capture' || (requiredStatus && context.status !== requiredStatus)) return null
    return {
      ...context,
      expiresAt: Number.isFinite(Date.parse(value?.expiresAt)) ? new Date(value.expiresAt).toISOString() : null,
      ownerSessionId: typeof value?.ownerSessionId === 'string' ? value.ownerSessionId : 'unknown'
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
    return { ...document, events: this.prune(document.events) }
  }

  async write(events, state = {}) {
    await this.fileSystem.mkdir(this.directory, { recursive: true })
    await this.fileSystem.writeFile(this.temporaryPath, `${JSON.stringify({
      schemaVersion: DIAGNOSTIC_EVENT_STORE_VERSION,
      events: this.prune(events),
      activeCapture: state.activeCapture || null,
      lastCapture: state.lastCapture || null
    }, null, 2)}\n`, 'utf8')
    await this.fileSystem.rename(this.temporaryPath, this.filePath)
  }

  normalizeCaptureState(document, now = this.now()) {
    const active = document.activeCapture
    if (!active) return { ...document, changed: false }
    const expired = Number.isFinite(Date.parse(active.expiresAt)) && now >= Date.parse(active.expiresAt)
    const interrupted = active.ownerSessionId !== this.sessionId
    if (!expired && !interrupted) return { ...document, changed: false }
    const status = expired ? 'timed_out' : 'interrupted'
    return {
      ...document,
      activeCapture: null,
      lastCapture: { ...active, status, endedAt: new Date(Math.min(now, Date.parse(active.expiresAt) || now)).toISOString() },
      changed: true
    }
  }

  captureOperation(operation) {
    const result = this.queue.then(operation, operation)
    this.queue = result.catch(() => undefined)
    return result.catch(() => ({ success: false, errorCode: 'DIAGNOSTIC_CAPTURE_STORE_UNAVAILABLE' }))
  }

  getCaptureStatus() {
    return this.captureOperation(async () => {
      const document = this.normalizeCaptureState(await this.readDocument())
      if (document.changed) await this.write(document.events, document)
      return { success: true, activeCapture: document.activeCapture, lastCapture: document.lastCapture }
    })
  }

  startCapture(input = {}) {
    return this.captureOperation(async () => {
      if (!DIAGNOSTIC_AREAS.has(input.area) || !DIAGNOSTIC_SYMPTOMS.has(input.symptom)) {
        return { success: false, errorCode: 'DIAGNOSTIC_CAPTURE_INVALID_CONTEXT' }
      }
      const now = this.now()
      const document = this.normalizeCaptureState(await this.readDocument(), now)
      if (document.activeCapture) return { success: false, errorCode: 'DIAGNOSTIC_CAPTURE_ALREADY_ACTIVE' }
      const activeCapture = {
        mode: 'capture', captureId: randomUUID(), area: input.area, symptom: input.symptom,
        status: 'active', startedAt: new Date(now).toISOString(),
        expiresAt: new Date(now + DIAGNOSTIC_CAPTURE_DURATION_MS).toISOString(),
        ownerSessionId: this.sessionId
      }
      await this.write(document.events, { ...document, activeCapture, lastCapture: null })
      return { success: true, capture: activeCapture }
    })
  }

  finishCapture(input = {}) {
    return this.captureOperation(async () => {
      const now = this.now()
      const document = this.normalizeCaptureState(await this.readDocument(), now)
      if (!document.activeCapture || document.activeCapture.captureId !== input.captureId) {
        if (document.changed) await this.write(document.events, document)
        if (document.lastCapture?.captureId === input.captureId) {
          return { success: true, capture: document.lastCapture }
        }
        return { success: false, errorCode: 'DIAGNOSTIC_CAPTURE_NOT_ACTIVE' }
      }
      const completed = { ...document.activeCapture, status: 'completed', endedAt: new Date(now).toISOString() }
      await this.write(document.events, { ...document, activeCapture: null, lastCapture: completed })
      return { success: true, capture: completed }
    })
  }

  cancelCapture(input = {}) {
    return this.captureOperation(async () => {
      const document = this.normalizeCaptureState(await this.readDocument())
      const matchesActive = document.activeCapture?.captureId === input.captureId
      const matchesLast = document.lastCapture?.captureId === input.captureId
      if (!matchesActive && !matchesLast) return { success: false, errorCode: 'DIAGNOSTIC_CAPTURE_NOT_FOUND' }
      await this.write(document.events, {
        ...document,
        activeCapture: matchesActive ? null : document.activeCapture,
        lastCapture: matchesLast ? null : document.lastCapture
      })
      return { success: true }
    })
  }

  async resolveCapture(captureId) {
    const status = await this.getCaptureStatus()
    if (!status.success) return null
    return [status.activeCapture, status.lastCapture].find(item => item?.captureId === captureId) || null
  }

  record(input = {}) {
    const operation = async () => {
      const document = await this.readDocument()
      const now = this.now()
      const normalized = this.normalizeCaptureState(document, now)
      const timestamp = new Date(now).toISOString()
      const candidate = sanitizeDiagnosticEvent({
        ...input,
        timestamp,
        sessionId: this.sessionId,
        appVersion: this.appVersion,
        captureId: normalized.activeCapture?.captureId,
        repeatCount: 1
      })
      if (!candidate) return { recorded: false, reason: 'invalid_event' }

      const events = this.prune(normalized.events, now)
      const lastForOperation = [...events].reverse().find(event => (
        event.area === candidate.area && event.operation === candidate.operation
      ))
      if (candidate.outcome === 'recovered' && lastForOperation?.outcome !== 'failed') {
        return { recorded: false, reason: 'no_failure_to_recover' }
      }

      const last = events.at(-1)
      const duplicate = last && last.sessionId === candidate.sessionId &&
        last.captureId === candidate.captureId && last.stageCode === candidate.stageCode &&
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

      await this.write(events, normalized)
      return { recorded: true, corruptHistoryDiscarded: document.corrupt }
    }

    const result = this.queue.then(operation, operation)
    this.queue = result.catch(() => undefined)
    return result.catch(() => ({ recorded: false, reason: 'store_unavailable' }))
  }
}
