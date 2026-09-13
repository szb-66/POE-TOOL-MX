import { randomUUID } from 'node:crypto'

/** Per-child state outlives coordinator.child, so delayed exits remain attributable. */
export function createDetectionProcessDiagnostics({ logger, getConsumers, now = Date.now }) {
  const instanceId = randomUUID()
  let child = null
  let lastEventAt = null
  let stopReason = ''
  function record(event) {
    try {
      const consumers = getConsumers().slice(0, 32).map(value => String(value).replace(/[^a-z0-9_-]/gi, '').slice(0, 64))
      logger?.record?.({
        ...event,
        message: `instanceId=${instanceId} childPid=${child?.pid ?? 'unknown'} lastEventAt=${lastEventAt ?? 'none'} stopReason=${stopReason || 'none'} consumers=${JSON.stringify(consumers)} ${event.message || ''}`
      })
    } catch { /* Diagnostics cannot break process lifecycle or state publication. */ }
  }
  function lifecycle(stage, message = '', outcome = 'info') {
    record({ phase: `interface-detection-${stage}`, outcome, reasonCode: stopReason || 'unexpected', message })
  }
  return {
    record,
    lifecycle,
    bind(value) { child = value },
    event() { lastEventAt = now() },
    stop(reason) {
      if (!stopReason) stopReason = reason
      lifecycle('stop-request', '', 'started')
    }
  }
}
