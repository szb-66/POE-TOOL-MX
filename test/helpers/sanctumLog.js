import { ClientEventsService } from '../../electron/modules/clientEvents/service.js'

export function sanctumLogEvents(areaId = 'SanctumCellar', areaLevel = 83) {
  const events = new ClientEventsService({ processProvider: async () => [{ id: 123, startedAt: '2026-09-01T00:00:00Z' }] })
  events.status = { ...events.status, enabled: true, state: 'started', logPath: 'Client.txt' }
  events.tailer = { stop() {} }
  let revision = 0
  const enter = (changes = {}) => events.push({ type: 'area-entered', areaId, areaLevel,
    seed: '123', processId: 123, sessionKey: 'session', eventId: `area:${++revision}`, loading: false, ...changes })
  enter()
  return { events, enter }
}
