/**
 * 文件职责：协调应用/游戏两类加载反馈的延迟、优先级、并发与最短可见时间。
 * 主要入口：LoadingFeedbackCoordinator.begin/update/finish/handoff/setForeground/close。
 * 关键依赖：shared/loadingFeedback.js 受控目录、可注入时钟和 app/game 发布器。
 * 状态边界：令牌只在单协调器生命周期内有效；close 负责清理定时器和全部入口。
 */

import { emptyLoadingFeedbackSnapshot, loadingFeedbackOperation } from '../../../shared/loadingFeedback.js'

const TARGETS = Object.freeze(['app', 'game'])

function progressValues(progress = {}) {
  const current = Math.max(0, Number(progress.current) || 0)
  const total = Math.max(0, Number(progress.total) || 0)
  return total > 0 ? { current: Math.min(current, total), total } : { current: 0, total: 0 }
}

/**
 * Purpose: 将多个业务操作投影为每个目标唯一的安全显示快照。
 * Inputs: 可注入时钟/定时器与两个发布函数，便于确定性测试。
 * Outputs: 发布不含窗口句柄或进程信息的结构化快照。
 */
export class LoadingFeedbackCoordinator {
  constructor({
    now = () => Date.now(),
    setTimer = (callback, delay) => setTimeout(callback, delay),
    clearTimer = timer => clearTimeout(timer),
    publishApp = () => {},
    publishGame = () => {}
  } = {}) {
    this.now = now
    this.setTimer = setTimer
    this.clearTimer = clearTimer
    this.publishApp = publishApp
    this.publishGame = publishGame
    this.entries = new Map()
    this.sequence = 0
    this.timer = null
    this.foreground = { kind: 'other', gameBounds: null }
    this.lastSnapshots = new Map()
  }

  // Inputs: 受控操作 ID 和所有者；Outputs: 新令牌，未知操作返回 null。
  begin(operationId, { owner = 'main' } = {}) {
    const definition = loadingFeedbackOperation(operationId)
    if (!definition) return null
    const sequence = ++this.sequence
    const startedAt = this.now()
    const token = `loading-${sequence}`
    this.entries.set(token, {
      token,
      operationId: String(operationId),
      definition,
      owner,
      sequence,
      startedAt,
      eligibleAt: startedAt + definition.showDelayMs,
      label: definition.label,
      current: 0,
      total: 0,
      displayed: false,
      visibleSince: 0,
      ended: false,
      expiresAt: 0
    })
    this.recompute()
    return token
  }

  // Purpose: 仅允许 renderer 登记目录中显式标记可用的操作。
  beginFromRenderer(operationId, owner) {
    const definition = loadingFeedbackOperation(operationId)
    if (!definition?.renderer) return null
    return this.begin(operationId, { owner })
  }

  // Purpose: 更新阶段和有界进度；令牌无效或已结束时返回 false。
  update(token, { stage = '', current = 0, total = 0 } = {}) {
    const entry = this.entries.get(String(token || ''))
    if (!entry || entry.ended) return false
    const stageLabel = stage ? entry.definition.stages?.[String(stage)] : ''
    if (stageLabel) entry.label = stageLabel
    Object.assign(entry, progressValues({ current, total }))
    this.recompute()
    return true
  }

  // Purpose: 正常结束操作，已显示项保留到最短可见期满。
  finish(token) {
    const entry = this.entries.get(String(token || ''))
    if (!entry || entry.ended) return false
    const now = this.now()
    if (entry.displayed) {
      entry.ended = true
      entry.expiresAt = Math.max(now, entry.visibleSince + entry.definition.minimumVisibleMs)
      if (entry.expiresAt <= now) this.entries.delete(entry.token)
    } else {
      this.entries.delete(entry.token)
    }
    this.recompute()
    return true
  }

  // Purpose: 已有业务浮层接管时立即移除加载反馈，不受最短可见时间约束。
  handoff(token) {
    const entry = this.entries.get(String(token || ''))
    if (!entry) return false
    this.entries.delete(entry.token)
    this.recompute()
    return true
  }

  // Purpose: 按所有者验证并结束单令牌，防止 renderer 跨所有者操作。
  finishOwned(token, owner) {
    const entry = this.entries.get(String(token || ''))
    if (!entry || entry.owner !== owner) return false
    return this.finish(token)
  }

  // Purpose: sender 销毁时原子清理其全部令牌。
  finishOwner(owner) {
    let changed = false
    for (const entry of [...this.entries.values()]) {
      if (entry.owner !== owner) continue
      this.entries.delete(entry.token)
      changed = true
    }
    if (changed) this.recompute()
    return changed
  }

  // Inputs: app/game/other/unavailable 及可选游戏边界；更改后立即重算可见性。
  setForeground({ kind = 'other', gameBounds = null } = {}) {
    this.foreground = {
      kind: ['game', 'app', 'other', 'unavailable'].includes(kind) ? kind : 'other',
      gameBounds: kind === 'game' && gameBounds ? { ...gameBounds } : null
    }
    this.recompute()
  }

  // Outputs: 返回指定目标最新快照的深副本，避免外部修改内部状态。
  getSnapshot(target = 'app') {
    const normalized = target === 'game' ? 'game' : 'app'
    const serialized = this.lastSnapshots.get(normalized)
    return serialized ? JSON.parse(serialized) : emptyLoadingFeedbackSnapshot(normalized)
  }

  selected(target, now) {
    const activeCount = [...this.entries.values()].filter(entry => (
      entry.definition.target === target && !entry.ended
    )).length
    const available = [...this.entries.values()].filter(entry => (
      entry.definition.target === target && entry.eligibleAt <= now && (!entry.ended || entry.expiresAt > now)
    ))
    available.sort((left, right) => (
      right.definition.priority - left.definition.priority || right.sequence - left.sequence
    ))
    return { selected: available[0] || null, activeCount }
  }

  snapshot(target, now) {
    const { selected, activeCount } = this.selected(target, now)
    const focused = this.foreground.kind === target
    const canShow = Boolean(selected && focused && (target !== 'game' || this.foreground.gameBounds))
    for (const entry of this.entries.values()) {
      if (entry.definition.target !== target) continue
      entry.displayed = canShow && entry.token === selected?.token
      if (entry.displayed && !entry.visibleSince) entry.visibleSince = now
    }
    if (!canShow) return emptyLoadingFeedbackSnapshot(target)
    return {
      visible: true,
      target,
      label: selected.label,
      current: selected.current,
      total: selected.total,
      activeCount: Math.max(1, activeCount)
    }
  }

  schedule(now) {
    if (this.timer !== null) this.clearTimer(this.timer)
    this.timer = null
    const deadlines = []
    for (const entry of this.entries.values()) {
      if (!entry.ended && entry.eligibleAt > now) deadlines.push(entry.eligibleAt)
      if (entry.ended && entry.expiresAt > now) deadlines.push(entry.expiresAt)
    }
    if (!deadlines.length) return
    this.timer = this.setTimer(() => {
      this.timer = null
      this.recompute()
    }, Math.max(0, Math.min(...deadlines) - now))
  }

  recompute() {
    const now = this.now()
    for (const entry of [...this.entries.values()]) {
      if (entry.ended && entry.expiresAt <= now) this.entries.delete(entry.token)
    }
    for (const target of TARGETS) {
      const snapshot = this.snapshot(target, now)
      const serialized = JSON.stringify(snapshot)
      if (this.lastSnapshots.get(target) === serialized && target !== 'game') continue
      this.lastSnapshots.set(target, serialized)
      if (target === 'app') this.publishApp(snapshot)
      else this.publishGame(snapshot, this.foreground.gameBounds)
    }
    this.schedule(now)
  }

  // Purpose: 关闭协调器、取消定时器并向两个目标发布空快照；重复调用安全。
  close() {
    if (this.timer !== null) this.clearTimer(this.timer)
    this.timer = null
    this.entries.clear()
    this.publishApp(emptyLoadingFeedbackSnapshot('app'))
    this.publishGame(emptyLoadingFeedbackSnapshot('game'), null)
  }
}
