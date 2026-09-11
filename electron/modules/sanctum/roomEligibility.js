// Missing graph evidence stays unknown; only explicit exclusions suppress input.
export function roomExclusions(floor) {
  const rooms = floor.rooms || [], edges = floor.edges || []
  const current = floor.positionStatus === 'confirmed' && !floor.initialSelection
    ? rooms.find(room => room.id === floor.currentRoomId) : null
  const starts = new Set(current ? [current.id] : floor.initialSelection ? floor.startRoomIds || [] : [])
  const reachable = new Map(), excluded = new Map()
  const startColumn = current?.column ?? Math.min(...rooms.filter(r => starts.has(r.id)).map(r => r.column))
  for (const room of [...rooms].sort((a, b) => a.column - b.column)) {
    if (current && Number.isInteger(room.column) && room.column <= current.column) excluded.set(room.id, 'completed')
    if (starts.size && Number.isInteger(startColumn)) {
      if (starts.has(room.id)) reachable.set(room.id, true)
      else if (room.column <= startColumn) reachable.set(room.id, false)
      else {
        const incoming = edges.filter(e => e.to === room.id)
        const states = incoming.map(edge => {
          if (edge.occluded || edge.status !== 'matched') return undefined
          if (edge.availability === 'unavailable' || edge.traversal === 'unavailable') return false
          if (edge.availability === 'unknown' || edge.traversal === 'unknown') return undefined
          return reachable.get(edge.from)
        })
        const state = states.includes(true) ? true : states.length && states.every(s => s === false) ? false : undefined
        reachable.set(room.id, state)
        if (state === false && !room.occluded) excluded.set(room.id, 'unreachable')
      }
    }
    if (!excluded.has(room.id) && room.contentStatus === 'empty' && !room.occluded) excluded.set(room.id, 'empty')
  }
  return excluded
}
