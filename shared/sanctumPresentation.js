import { sanctumPhaseLabel } from './sanctumProgress.js'
import { sanctumDisplay, sanctumRoomDetail } from './sanctumDisplay.js'

// Presentation only; never feeds recognition, reachability or strategy scoring.
// 实时识别身份优先；停止、未读到地图或重启恢复时才用保存/历史快照展示。
export function sanctumDisplayFloors(state) {
  const live = state?.floor?.identityConfirmed === true ? state.floor : null
  const history = live ? null : state?.savedRoute || null
  return { live, history, floor: live || history?.floor || state?.floor || null }
}
export function sanctumPageDisplay(floor, recommendation, marks, progress) {
  const columns = new Map()
  for (const room of floor?.rooms || []) {
    const column = Number.isFinite(room.column) ? room.column : 0
    if (!columns.has(column)) columns.set(column, [])
    columns.get(column).push(room)
  }
  const count = Math.max(1, ...[...columns.values()].map(rooms => rooms.length))
  const rooms = [...columns].sort(([a], [b]) => a - b).flatMap(([column, items], index) =>
    [...items].sort((a, b) => a.y - b.y).map((room, row) => ({ ...room, x: index * 240 + 30,
      y: ((count - items.length) / 2 + row) * 160 + 50, width: 190, height: 96 })))
  return { ...sanctumDisplay(floor ? { ...floor, rooms } : null, recommendation, marks, progress), minWidth: Math.max(540, columns.size * 140) }
}
export const roomTypeLabels = { boss: '首领', fountain: '喷泉', merchant: '商人', pact: '契约', reward: '奖励', treasure: '宝藏' }
export const layoutLabels = { exit: '寻找出口', guards: '击败守卫', arena: '竞技场', trap: '穿越陷阱', miniboss: '击败小首领', boss: '楼层首领' }
export const timingLabels = { unknown: '尚未确认', immediate: '立即领取', floor: '楼层结束', run: '整轮结束' }
export const roomTitle = room => room?.name || roomTypeLabels[room?.type] || layoutLabels[room?.layout] || '待识别房间'
export const rewardSummary = room => (room?.rewards || []).map(r => r.currency || '未知奖励').join(' / ')
export const roomEntrySummary = room => [...new Set((room?.recognition?.matches || [])
  .map(match => match.descriptions?.join('；') || match.matchedText || match.name || match.rawText).filter(Boolean))].join('；')
export const roomCardSummary = room => `${room.id} · ${rewardSummary(room) || roomEntrySummary(room) || sanctumRoomDetail(room)}`
export function rewardDetail(reward) {
  const quantity = Number.isFinite(reward.quantity) ? ` × ${reward.quantity}` : reward.quantityStatus === 'failed' ? ' · 数量读取失败' : ' · 具体数量通过房间后确认'
  const timing = timingLabels[reward.timing]
  return `${reward.currency || '未知奖励'}${quantity}${timing && reward.timing !== 'unknown' ? ` · ${timing}` : ''}`
}
export function calibrationIssues(state) {
  const issues = []
  if (!state.liveCalibration?.captures?.mapRegion) issues.push('地图范围截图')
  if (!state.publicTitles?.templates?.['sanctum-map']) issues.push('地图标题截图')
  return issues
}
export function observationBinding(floor) {
  return JSON.stringify([floor?.sanctumRunId || floor?.runId, floor?.floorId, floor?.mapKey || null, floor?.currentRoomId || (floor?.initialSelection ? '__entry__' : null)])
}
export function resourceSummary(state) {
  const current = state.floor?.identityConfirmed === true && state.runObservation?.status === 'confirmed' && state.runObservation?.key === observationBinding(state.floor)
  const saved = state.restoredFromSave === true && state.runObservation?.savedStatus === 'confirmed'
    && state.runObservation?.savedKey === observationBinding(state.floor)
  const value = key => (current || saved) && Number.isFinite(state.runObservation?.[key]) ? state.runObservation[key] : null
  const resolve = value('resolve'), maxResolve = value('maxResolve')
  return { resolve, maxResolve, inspiration: value('inspiration'), coins: value('coins'),
    percent: resolve !== null && maxResolve > 0 ? Math.max(0, Math.min(100, resolve / maxResolve * 100)) : null }
}
export function sanctumSavedLabel(savedAt) {
  return Number.isFinite(savedAt) ? `上次保存：${new Date(savedAt).toLocaleString('zh-CN')}` : '上次保存：时间未知'
}
export function captureButton(state, { locked = false } = {}) {
  if (state.captureDraining) return { label: state.progress?.stage === 'stopped' ? '正在结束' : '正在完成', disabled: true }
  if (state.running) {
    const progress = state.progress || {}
    const count = Number.isFinite(progress.current) && Number.isFinite(progress.total) ? ` ${progress.current}/${progress.total}` : ''
    const label = progress.analysis ? sanctumPhaseLabel(progress) : progress.stage === 'rooms' ? `截图房间${count}` : progress.stage === 'recognizing' ? `分析中${count}` : progress.stage === 'effects' ? '检测效果'
      : progress.stage === 'map' ? '读取地图' : progress.stage === 'completing' ? '正在完成' : '正在准备'
    return { label, disabled: true }
  }
  if (state.solving) return { label: '正在计算搭配', disabled: true }
  if (!state.liveCalibration) return { label: '请先完成校准', disabled: true }
  if (state.publicTitles && calibrationIssues(state).length) return { label: '请补充地图校准', disabled: true }
  if (locked) return { label: '其他任务运行中', disabled: true }
  if (state.status === 'error') return { label: '分析失败·重试', disabled: false }
  const labels = { complete: '分析完成·再次采集', partial: '部分完成·再次采集', timeout: '采集超时·重试', stopped: '已停止·再次采集' }
  return { label: labels[state.progress?.stage] || '开始采集', disabled: false }
}
