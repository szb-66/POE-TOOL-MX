import { knownRoom } from './knowledge.js'

export const boundaryReason = '按当前可见信息推荐，路线止于已知部分'
export const withRecommendationNotes = (reason, notes) => [...new Set([reason, ...notes])].join('；')

// A frontier is a route boundary, not in itself a reading failure.
export function routeBoundary(frontier, rooms, floor, effects) {
  const unknown = [], limitations = [], unreadRoomIds = []
  for (const id of frontier) {
    const room = rooms.get(id), observed = knownRoom(room, floor, effects)
    if (observed.missing.length) {
      unreadRoomIds.push(id)
      unknown.push(`${id}：${room.failureReason || ({ partial: '部分正文未读全', failed: '正文读取失败', reading: '正文读取中' }[room.detailsStatus] || '房间尚未读取')}`)
    } else if (observed.limitations.length) limitations.push(`${id}：房间内容尚未揭示或被效果隐藏`)
    else { unreadRoomIds.push(id); unknown.push(`${id}：房间正文尚未完整确认`) }
  }
  return { unknown, limitations, unreadRoomIds }
}

export function pendingTargetMessages(pending, boundary, adjacency, legal) {
  // An unread side branch cannot turn a target behind a mechanic boundary
  // into a reading problem. Only consider gaps that can lead to that target.
  const reachable = new Set(), queue = [...boundary.unreadRoomIds]
  while (queue.length) {
    const id = queue.pop()
    if (reachable.has(id) || !legal(id)) continue
    reachable.add(id)
    queue.push(...(adjacency.get(id) || []))
  }
  return {
    unknown: pending.filter(id => reachable.has(id)).map(id => `目标 ${id} 尚在未识别路径之后，待确认`),
    limitations: pending.filter(id => !reachable.has(id)).map(id => `目标 ${id} 位于当前可知边界之外，尚未达成`)
  }
}

export function noKnownRoomReason(boundaries, fallback) {
  if (boundaries.some(boundary => boundary.unknown.length)) return '暂无满足约束的已识别下一房，请先识别房间'
  if (boundaries.some(boundary => boundary.limitations.length)) return '下一房内容尚未由游戏揭示或被效果隐藏，暂无可推荐的已知下一房'
  return fallback
}

// Targets beyond the reading frontier remain pending, but must still fit on
// one legal structural route. Sorting by column also rejects mutually exclusive targets.
export function pendingRouteTargets(ids, targets, adjacency, rooms, legal, frontier) {
  const pending = [...targets].filter(id => !ids.includes(id))
    .sort((a, b) => rooms.get(a).column - rooms.get(b).column)
  if (!pending.length) return []
  if (!frontier.length) return null
  let from = ids.at(-1)
  let first = true
  for (const target of pending) {
    const seen = new Set(), queue = [...(first ? frontier : adjacency.get(from) || [])]
    while (queue.length) {
      const id = queue.pop()
      if (seen.has(id) || !legal(id)) continue
      seen.add(id)
      queue.push(...(adjacency.get(id) || []))
    }
    if (!seen.has(target)) return null
    from = target
    first = false
  }
  return pending
}
