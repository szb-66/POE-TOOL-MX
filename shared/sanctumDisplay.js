import { hasSanctumRoomContents } from './sanctumRecommendation.js'
// Presentation only: never use display states as capture exclusions or planner input.
const confirmed = value => !value?.occluded && ['matched', 'manual'].includes(value?.status)
const blocked = edge => edge.availability === 'unavailable' || edge.traversal === 'unavailable'
const knownEdge = edge => confirmed(edge) && edge.availability !== 'unknown' && edge.traversal !== 'unknown'
const labels = { completed: '✓ 已完成', unreachable: '× 不可达', reachable: '可达', unknown: '未知' }
const detailLabels = { manual: '已修正', matched: '已识别', partial: '部分成功', queued: '等待识别', reading: '读取中', failed: '读取失败' }

// 最近一次实时识别已确认身份、且不是入口待选，却没有确认当前位置。
export const sanctumPositionUnconfirmed = floor => floor?.identityConfirmed === true
  && floor.initialSelection !== true && !(floor.positionStatus === 'confirmed' && Boolean(floor.currentRoomId))

export function sanctumRoomLabel(room) {
  return [room.current ? '当前' : room.next ? '推荐' : room.recommended ? '推荐路径' : labels[room.displayState],
    room.target ? '目标' : '', room.avoided ? '避让' : ''].filter(Boolean).join(' · ')
}

export function sanctumRoomDetail(room) {
  return room.reading ? '读取中' : detailLabels[room.detailsStatus] || '待读取'
}

export function sanctumDisplay(floor, recommendation, marks = {}, progress = null) {
  const sourceRooms = floor?.rooms || [], sourceEdges = floor?.edges || []
  const byId = new Map(sourceRooms.map(room => [room.id, room]))
  const edges = sourceEdges.filter(edge => byId.has(edge.from) && byId.has(edge.to)
    && byId.get(edge.to).column > byId.get(edge.from).column)
  const current = floor?.positionStatus === 'confirmed' && !floor.initialSelection ? byId.get(floor.currentRoomId) : null
  const starts = new Set(current ? [current.id] : floor?.initialSelection ? (floor.startRoomIds || []).filter(id => byId.has(id)) : [])
  const completedRooms = new Set(), completedEdges = new Set()
  // Walk backwards only through an unambiguous, confirmed chain ending at current.
  let cursor = current?.id
  while (cursor) {
    const incoming = edges.filter(edge => edge.to === cursor && knownEdge(edge) && !blocked(edge) && edge.traversal === 'visited')
    if (incoming.length !== 1) break
    const edge = incoming[0]
    if (!confirmed(byId.get(edge.from)) || !confirmed(byId.get(edge.to))
      || edges.filter(other => other.from === edge.from && knownEdge(other) && !blocked(other) && other.traversal === 'visited').length !== 1) break
    completedEdges.add(edge)
    completedRooms.add(edge.from)
    cursor = edge.from
  }
  const reach = new Map()
  const startColumn = current?.column ?? Math.min(...sourceRooms.filter(room => starts.has(room.id)).map(room => room.column))
  for (const room of [...sourceRooms].sort((a, b) => a.column - b.column)) {
    let value
    if (starts.size && confirmed(room)) {
      if (starts.has(room.id)) value = true
      else if (room.column <= startColumn) value = false
      else {
        const incoming = edges.filter(edge => edge.to === room.id)
        const values = incoming.map(edge => !confirmed(edge) ? undefined : blocked(edge) ? false
          : !knownEdge(edge) ? undefined : reach.get(edge.from))
        value = values.includes(true) ? true : values.length && values.every(item => item === false) ? false : undefined
      }
    }
    reach.set(room.id, value)
  }
  const displayState = id => completedRooms.has(id) ? 'completed'
    : reach.get(id) === true ? 'reachable' : reach.get(id) === false ? 'unreachable' : 'unknown'
  const edgeState = edge => completedEdges.has(edge) ? 'completed'
    : !confirmed(edge) || !confirmed(byId.get(edge.from)) || !confirmed(byId.get(edge.to)) ? 'unknown'
      : blocked(edge) ? 'unreachable' : !knownEdge(edge) ? 'unknown'
      : reach.get(edge.from) === false || reach.get(edge.to) === false ? 'unreachable'
        : reach.get(edge.from) === true && reach.get(edge.to) === true ? 'reachable' : 'unknown'
  const sameContext = floor?.identityConfirmed === true && floor.runId && floor.floorId && Number.isInteger(floor.revision)
    && ['runId', 'floorId', 'revision'].every(key => recommendation?.[key] === floor[key])
  let route = sameContext && ['ready', 'partial'].includes(recommendation?.status) ? recommendation.paths?.[0]?.rooms || [] : []
  if (!starts.has(route[0]) || route.some(id => reach.get(id) !== true)
    || route.some((id, index) => index > 0 && !edges.some(edge => edge.from === route[index - 1] && edge.to === id && edgeState(edge) === 'reachable'))) route = []
  const boundary = route.findIndex(id => id !== current?.id && !hasSanctumRoomContents(byId.get(id), floor))
  if (boundary >= 0) route = route.slice(0, boundary)
  const nextRoomId = floor?.initialSelection ? route[0] || null : current ? route[1] || null : null
  const recommendedRooms = new Set(nextRoomId ? route : [])
  const rooms = sourceRooms.map(room => ({ ...room, displayState: displayState(room.id),
    current: room.id === current?.id, recommended: recommendedRooms.has(room.id), next: room.id === nextRoomId,
    target: (marks.targets || []).includes(room.id), avoided: (marks.avoid || []).includes(room.id),
    reading: progress?.stage === 'rooms' && progress.targetId === room.id }))
  const lines = edges.map(edge => {
    const from = byId.get(edge.from), to = byId.get(edge.to)
    const a = { x: from.x + from.width / 2, y: from.y + from.height / 2 }
    const b = { x: to.x + to.width / 2, y: to.y + to.height / 2 }
    const dx = b.x - a.x, dy = b.y - a.y
    // End at card boundaries so arrows remain visible instead of hiding under cards.
    const inset = room => Math.min((room.width / 2 + 6) / Math.abs(dx), (room.height / 2 + 6) / Math.abs(dy), .49)
    const startInset = inset(from), endInset = inset(to)
    return { from: edge.from, to: edge.to, x1: a.x + dx * startInset, y1: a.y + dy * startInset,
      x2: b.x - dx * endInset, y2: b.y - dy * endInset, displayState: edgeState(edge),
      recommended: Boolean(nextRoomId) && edgeState(edge) === 'reachable'
        && route.some((id, index) => id === edge.from && route[index + 1] === edge.to) }
  })
  const positioned = rooms.filter(room => [room.x, room.y, room.width, room.height].every(Number.isFinite) && room.width > 0 && room.height > 0)
  const left = Math.min(...positioned.map(room => room.x)) - 36
  const top = Math.min(...positioned.map(room => room.y)) - 40
  const right = Math.max(...positioned.map(room => room.x + room.width)) + 36
  const bottom = Math.max(...positioned.map(room => room.y + room.height)) + 40
  return { rooms, lines, nextRoomId, viewBox: positioned.length ? `${left} ${top} ${right - left} ${bottom - top}` : '0 0 2200 1500' }
}
