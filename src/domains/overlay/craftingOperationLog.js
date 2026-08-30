const OPERATION_LOG_LIMIT = 100
const OPERATION_MODES = new Set(['items', 'map'])
const OPERATION_OUTCOMES = new Set(['started', 'success', 'dispatched', 'confirmed', 'failed', 'cancelled'])

function limitedText(value, maximum) {
  return String(value || '').slice(0, maximum)
}

export function normalizeCraftingOperation(event) {
  if (!event || event.event !== 'crafting-operation' || !OPERATION_MODES.has(event.mode)) return null
  if (!OPERATION_OUTCOMES.has(event.outcome)) return null

  const timestamp = Number(event.timestamp)
  return {
    mode: event.mode,
    sessionId: limitedText(event.sessionId, 64),
    timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
    phase: limitedText(event.phase, 32),
    action: limitedText(event.action, 80),
    outcome: event.outcome,
    code: limitedText(event.code, 64),
    summary: limitedText(event.summary, 160)
  }
}

export function createCraftingOperationState() {
  return {
    sessions: { items: null, map: null },
    entries: { items: [], map: [] }
  }
}

export function appendCraftingOperation(state, rawEvent) {
  const event = normalizeCraftingOperation(rawEvent)
  if (!event || !event.sessionId) return state

  const next = state || createCraftingOperationState()
  const activeSession = next.sessions[event.mode]
  const startsSession = event.phase === 'session' && event.action === 'start'
  if (!activeSession || startsSession) {
    next.sessions[event.mode] = event.sessionId
  } else if (activeSession !== event.sessionId) {
    return next
  }

  next.entries[event.mode] = [...next.entries[event.mode], event].slice(-OPERATION_LOG_LIMIT)
  return next
}

export function visibleCraftingOperations(state, mode) {
  return state?.entries?.[OPERATION_MODES.has(mode) ? mode : 'items'] || []
}

export { OPERATION_LOG_LIMIT }
