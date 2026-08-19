/** 全局紧急停止 IPC：组合所有会产生游戏输入的自动化停止入口。 */

import { ipcMain } from 'electron'
import { EmergencyStopCoordinator } from '../automation/emergencyStop.js'
import { stopCurrentScript } from './python.js'
import { stopBagStashAutomation } from './bag.js'
import { stopPotionAutomation, stopLoopAutomation, stopPortalAutomation } from './combat.js'

function managerAction(id, label, manager, activeStatuses = ['running']) {
  return {
    id,
    label,
    stop: reason => {
      const status = manager?.getStatus?.()?.status
      if (!activeStatuses.includes(status)) return { success: true, stopped: false }
      manager.stop(reason)
      return { success: true, stopped: true }
    }
  }
}

export function createEmergencyStopCoordinator({ chaosRecipe, stashPickup, junfeng, puzzle }) {
  return new EmergencyStopCoordinator([
    { id: 'script', label: '制作/地图', stop: stopCurrentScript },
    { id: 'bag-stash', label: '自动入库', stop: stopBagStashAutomation },
    managerAction('stash-pickup', '仓库取件', stashPickup),
    managerAction('junfeng', '君锋镇取件', junfeng),
    managerAction('chaos-recipe', '混沌配方取件', chaosRecipe?.automation, ['running', 'paused']),
    { id: 'potion', label: '自动喝药', stop: stopPotionAutomation },
    { id: 'combat-loop', label: '主动循环', stop: stopLoopAutomation },
    { id: 'portal', label: '一键回城', stop: stopPortalAutomation },
    { id: 'puzzle', label: '海图自动化', stop: reason => puzzle?.emergencyStop?.(reason) || { success: true, stopped: false } }
  ])
}

function assertMainWindowSender(event, getMainWindow) {
  const mainWindow = getMainWindow?.()
  if (!mainWindow || mainWindow.isDestroyed() || event.sender !== mainWindow.webContents) {
    throw new Error('全局紧急停止只允许主窗口调用')
  }
}

export function registerEmergencyStopHandlers({ getMainWindow, ...dependencies }) {
  const coordinator = createEmergencyStopCoordinator(dependencies)
  ipcMain.handle('emergency-stop-all', (event) => {
    assertMainWindowSender(event, getMainWindow)
    return coordinator.stopAll('shortcut')
  })
  return coordinator
}
