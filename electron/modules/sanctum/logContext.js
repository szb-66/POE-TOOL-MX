const floorAreas = ['sanctumcellar', 'sanctumvaults', 'sanctumnave', 'sanctumcrypt']

export function sanctumLogFloor(context) {
  const areaId = String(context?.areaId || '').trim().toLowerCase()
  const foyer = /^sanctumfoyer_([1-4])(?:_[1-9]\d*)?$/.exec(areaId)
  const index = foyer ? Number(foyer[1]) - 1 : floorAreas.indexOf(areaId)
  return {
    floorId: index < 0 ? null : `floor:${index}`,
    floorNumber: index < 0 ? null : index + 1,
    areaLevel: index >= 0 && Number.isInteger(context?.areaLevel) && context.areaLevel >= 1 && context.areaLevel <= 100 ? context.areaLevel : null,
    identitySource: 'client-log'
  }
}

const contextKey = context => JSON.stringify([
  context.eventId, context.sessionKey, context.processId, context.areaId, context.seed, context.areaLevel
])

// A log context stays valid without new lines; transitions, not its age, revoke it.
export class SanctumLogContext {
  constructor(clientEvents, processId, onInvalid) {
    this.clientEvents = clientEvents
    this.processId = processId
    this.onInvalid = onInvalid
    this.failure = null
    this.context = this.read()
    this.key = contextKey(this.context)
    this.unsubscribe = clientEvents.onEvent(event => {
      if (['area-entered', 'game-state', 'client-state'].includes(event.type)) {
        try { this.assertCurrent() } catch { /* Failure is latched and published below. */ }
      }
    })
  }
  read() {
    const status = this.clientEvents?.snapshot()
    if (status?.state === 'resyncing') throw new Error('游戏日志文件已变化，正在重新同步区域记录；采集已停止，请同步完成后重新开始')
    if (!status?.enabled || status.state !== 'started') throw new Error('游戏日志监听不可用，请在设置中配置 Client.txt')
    const context = this.clientEvents.currentContext()
    if (status.gameState === 'disconnected') throw new Error(status.gameStateReason === 'process-exit'
      ? '已确认游戏进程退出，当前区域记录已失效'
      : '游戏日志记录了断线，尚未确认进入新的区域')
    if (status.gameStateReason === 'process-session-changed') throw new Error('游戏进程会话已变化，旧区域记录已失效，请重新开始')
    if (status.gameState === 'loading') throw new Error('游戏日志显示区域仍在加载，尚未确认已进入区域，请加载完成后手动重新开始')
    if (!context || status.gameState !== 'in-game' || context.loading) throw new Error('游戏日志尚无可用的当前区域记录，请核对 Client.txt 的区域生成与加载完成记录')
    if (!Number.isInteger(this.processId) || this.processId <= 0 || context.processId !== this.processId) throw new Error('游戏日志与前台游戏进程不一致，请核对 Client.txt')
    if (!context.eventId || !context.sessionKey) throw new Error('游戏日志缺少当前会话证据，请重新同步 Client.txt')
    if (!sanctumLogFloor(context).floorId) throw new Error('游戏日志未确认圣所楼层，请进入第 1–4 层或对应编号入口')
    return context
  }
  assertCurrent(processId = this.processId) {
    if (this.failure) throw this.failure
    try {
      if (processId !== this.processId || contextKey(this.read()) !== this.key) throw new Error('游戏日志区域或进程已变化，请手动重新开始')
      return sanctumLogFloor(this.context)
    } catch (error) {
      this.failure = error
      this.close()
      this.onInvalid(error)
      throw error
    }
  }
  close() { this.unsubscribe?.(); this.unsubscribe = null }
}
