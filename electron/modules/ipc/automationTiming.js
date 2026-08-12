import { ipcMain } from 'electron'
import { normalizeAutomationTiming } from '../../../src/utils/operationDelay.js'
import { updateBagAutomationTiming } from './bag.js'

let appliedTiming = normalizeAutomationTiming()

export function registerAutomationTimingHandlers({ stashPickup, junfeng, chaosRecipe, updateCombatTiming } = {}) {
  const apply = async (timing) => {
    updateBagAutomationTiming(timing)
    stashPickup?.setRuntime(timing)
    junfeng?.setRuntime(timing)
    const control = chaosRecipe?.control
    if (control) control.setRuntime({ ...control.runtime, ...timing, enabled: control.enabled })
    await updateCombatTiming?.(timing)
  }

  ipcMain.handle('automation-timing-update', async (_event, value = {}) => {
    const previous = appliedTiming
    const timing = normalizeAutomationTiming(value)
    try {
      await apply(timing)
      appliedTiming = timing
      return { success: true, timing }
    } catch (error) {
      try { await apply(previous) } catch {}
      return { success: false, error: error.message || String(error), timing: previous }
    }
  })
}
