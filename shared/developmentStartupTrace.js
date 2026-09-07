import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// Both processes use the launcher's epoch; never mix process-relative clocks.
export function createDevelopmentStartupTrace({ env = process.env, now = Date.now, write = fs.appendFileSync } = {}) {
  const runId = env.POE_STARTUP_RUN_ID
  const startedAt = Number(env.POE_STARTUP_STARTED_AT)
  const enabled = /^[a-zA-Z0-9-]{1,100}$/.test(runId || '') && Number.isFinite(startedAt) && startedAt > 0
  const filePath = enabled ? path.join(os.tmpdir(), `poe-startup-${runId}.jsonl`) : null
  function record(phase, outcome = 'succeeded', reasonCode = 'none') {
    if (!enabled) return
    const timestamp = now()
    const event = { runId, pid: process.pid, timestamp: new Date(timestamp).toISOString(), elapsedMs: Math.max(0, timestamp - startedAt), phase, outcome, reasonCode }
    try { write(filePath, `${JSON.stringify(event)}\n`, 'utf8') } catch { /* Diagnostics must not block startup. */ }
    return event
  }
  async function measure(phase, operation) {
    record(phase, 'started')
    try {
      const result = await operation()
      record(phase)
      return result
    } catch (error) {
      record(phase, 'failed', String(error?.code || 'operation_failed'))
      throw error
    }
  }
  return { record, measure, filePath }
}
