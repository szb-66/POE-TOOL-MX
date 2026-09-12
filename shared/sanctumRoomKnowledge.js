// A graph node is not evidence of its contents. Historical facts need an
// explicit observation and the same map incarnation; graph geometry is separate.
export function roomFact(room, field, floor, effects = {}) {
  const fact = room.knowledge?.[field]
  if (field === 'layoutPreferenceKey' && !fact && !room.roomProfile) return roomFact(room, 'layout', floor, effects)
  const gameplay = ['layout','traps','layoutPreferenceKey','roomProfile'].includes(field)
  const hidden = effects.roomsHidden || (['rewards','recovery','recoveryCost'].includes(field) && effects.rewardsHidden)
    || (['afflictions','effects'].includes(field) && effects.afflictionsHidden) || ((gameplay || field === 'type') && effects.typesHidden)
  if (fact) {
    if (gameplay && fact.source === 'observed' && fact.mapKey != null && (fact.mapKey !== floor.mapKey || floor.rerolled)) return { status:'failed' }
    const validHistory = fact.source === 'observed' && fact.mapKey != null && fact.mapKey === floor.mapKey && !floor.rerolled
    if (fact.status === 'known' && (!hidden && room.revealed !== false || validHistory || fact.source === 'manual')) return { status: 'known', value: room[field] }
    return { status: hidden ? 'hidden' : room.revealed === false ? 'unrevealed' : fact.status, value: undefined }
  }
  if (room.revealed === false || hidden) return { status: hidden ? 'hidden' : 'unrevealed' }
  if (['matched', 'manual'].includes(room.detailsStatus)) return { status: 'known', value: room[field] }
  return { status: 'failed' }
}

export const isMechanicUnknown = status => ['hidden', 'unrevealed', 'not-shown'].includes(status)

export function knownRoom(room, floor, effects = {}, reportFields = ['rewards', 'afflictions', 'layout']) {
  const result = { id: room.id, column: room.column, row: room.row, knowledge: {}, missing: [], limitations: [] }
  for (const field of ['layout', 'traps', 'layoutPreferenceKey', 'roomProfile', 'type', 'rewards', 'afflictions', 'effects', 'recovery', 'recoveryCost', 'relicScore']) {
    const fact = roomFact(room, field, floor, effects)
    result.knowledge[field] = fact.status
    if (fact.status === 'known') result[field] = fact.value
    else if (['rewards', 'afflictions', 'layout'].includes(field)) {
      if (!isMechanicUnknown(fact.status) && !reportFields.includes(field)) continue
      const messages = isMechanicUnknown(fact.status) ? result.limitations : result.missing
      messages.push(`${room.id}：${{rewards:'奖励',afflictions:'痛苦',layout:'战斗布局'}[field]}${{hidden:'被效果隐藏',unrevealed:'未揭示',failed:'未读全','not-shown':'游戏未展示'}[fact.status] || '未知'}`)
    }
  }
  if (result.layout && room.knowledge?.layoutPreferenceKey && result.knowledge.layoutPreferenceKey !== 'known') result.missing.push(`${room.id}：房型偏好分类未确认，未计入偏好分`)
  return result
}

export function rewardReadingGaps(room) {
  return (room.rewards || []).flatMap(item => {
    const fields = []
    if (!Number.isFinite(item.quantity) && item.quantityStatus !== 'not-shown') fields.push('数量')
    if (!item.timing && item.timingStatus !== 'not-shown') fields.push('领取时机')
    return fields.length ? [`${room.id}：${item.currency || '奖励种类'}${fields.join('或')}未读取`] : []
  })
}
