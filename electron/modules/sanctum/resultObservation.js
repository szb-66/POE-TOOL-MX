// Reuse the shared title detector after the input/OCR session has exited.
export function sanctumResultEnvironmentMatches(observation, detection, environment) {
  const bounds = detection?.gameBounds, previous = observation?.clientBounds
  return Boolean(previous && environment && bounds && bounds.left === previous.x && bounds.top === previous.y
    && bounds.width === previous.width && bounds.height === previous.height && bounds.dpi === environment.dpi)
}
export function sanctumResultTitle(observation, detection, environment, now = Date.now()) {
  if (!sanctumResultEnvironmentMatches(observation, detection, environment) || !detection?.running || !detection.foreground || detection.reloading
    || !Number.isFinite(detection.receivedAt) || now < detection.receivedAt || now - detection.receivedAt > 1500) return null
  const matched = detection.interfaces?.['sanctum-map']?.matched
  return typeof matched === 'boolean' ? matched : null
}

export function sanctumResultObservation(observation, detection, environment, now = Date.now()) {
  if (sanctumResultTitle(observation, detection, environment, now) !== true) return null
  return { ...observation, foreground: true, interfaceMatched: true, mapOpen: true, receivedAt: detection.receivedAt }
}

export function sanctumPenultimateRoom(floor, nextRoomId) {
  // The recognizer uses eight zero-based columns, with a template-confirmed exit.
  // A cropped or incomplete map must never redefine its rightmost visible column as the exit.
  const columns = new Set(floor.rooms.map(room => room.column))
  const complete = columns.size === 8 && Array.from({ length: 8 }, (_, column) => column).every(column => columns.has(column))
    && floor.rooms.some(room => room.column === 7 && floor.exitRoomIds?.includes(room.id) && ['matched', 'manual'].includes(room.status))
  return complete && floor.rooms.some(room => room.id === nextRoomId && room.column === 6)
}
