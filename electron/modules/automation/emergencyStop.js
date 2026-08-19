/** 统一紧急停止协调器：并行停止全部游戏输入自动化，单项失败不阻塞其他项。 */

function failureFor(action, reason) {
  return {
    id: action.id,
    label: action.label,
    error: reason?.message || String(reason || '停止失败')
  }
}

export class EmergencyStopCoordinator {
  constructor(actions = []) {
    this.actions = actions
    this.inFlight = null
  }

  stopAll(reason = 'shortcut') {
    if (this.inFlight) return this.inFlight
    this.inFlight = this.run(reason).finally(() => {
      this.inFlight = null
    })
    return this.inFlight
  }

  async run(reason) {
    const results = await Promise.allSettled(
      this.actions.map(action => Promise.resolve().then(() => action.stop(reason)))
    )
    const stopped = []
    const failed = []

    results.forEach((result, index) => {
      const action = this.actions[index]
      if (result.status === 'rejected') {
        failed.push(failureFor(action, result.reason))
        return
      }
      const value = result.value || {}
      if (value.success === false) {
        failed.push(failureFor(action, value.error))
        return
      }
      if (value.stopped === true) stopped.push({ id: action.id, label: action.label })
      if (Array.isArray(value.stopped)) {
        for (const item of value.stopped) {
          stopped.push(typeof item === 'string' ? { id: item, label: item } : item)
        }
      }
      if (Array.isArray(value.failed)) failed.push(...value.failed)
    })

    return { success: failed.length === 0, stopped, failed }
  }
}
