/**
 * Purpose: 统一注册所有 IPC 处理器
 * Inputs: dependencies (object) - 包含 window、python、fileWatcher、itemParser、itemMatcher、shortcut 等模块
 * Outputs: 注册所有 IPC 处理器，无返回值
 * Preconditions: 所有依赖模块已初始化
 * Edge cases: 无
 * Errors: 无
 */

import { registerWindowHandlers } from './window.js'
import { registerPythonHandlers } from './python.js'
import { registerFileHandlers } from './file.js'
import { registerShortcutHandlers } from './shortcut.js'
import { registerBagHandlers } from './bag.js'
import { registerCombatHandlers, updateCombatAutomationTiming } from './combat.js'
import { registerClipboardHandlers } from './clipboard.js'
import { registerCraftingHandlers } from './crafting.js'
import { registerSystemHandlers } from './system.js'
import { registerChaosRecipeHandlers } from './chaosRecipe.js'
import { registerPriceCheckHandlers } from './priceCheck.js'
import { registerPoeCnAccountHandlers } from './poeCnAccount.js'
import { registerStashPickupHandlers } from './stashPickup.js'
import { registerStashTabHandlers } from './stashTabs.js'
import { registerPuzzleHandlers } from './puzzle.js'
import { registerApplicationUpdateHandlers } from './update.js'
import { registerJunfengHandlers } from './junfeng.js'
import { registerAutomationTimingHandlers } from './automationTiming.js'
import { registerFeedbackHandlers } from './feedback.js'

export function registerIpcHandlers(dependencies) {
  const {
    window, python, fileWatcher, itemParser, itemMatcher, shortcut, crafting, chaosRecipe, priceCheck,
    poeCnAccount, stashPickup, junfeng,
    interfaceDetection, automationLock, puzzle, gameWindowTitles, diagnostics, startupDiagnostics,
    applicationUpdate, feedback, getMainWindow, enableJunfengTraining = false
  } = dependencies

  registerWindowHandlers(window)
  registerPythonHandlers(python, window, fileWatcher)
  registerStashTabHandlers(python, window, fileWatcher)
  registerFileHandlers(fileWatcher, itemParser, itemMatcher, window, crafting)
  registerShortcutHandlers(shortcut, window)
  registerBagHandlers(python, window, fileWatcher, { interfaceDetection, automationLock })
  registerCombatHandlers(python, window, fileWatcher)
  registerAutomationTimingHandlers({ stashPickup, junfeng, chaosRecipe, updateCombatTiming: updateCombatAutomationTiming })
  registerClipboardHandlers()
  const system = registerSystemHandlers(python, gameWindowTitles, diagnostics, startupDiagnostics)
  registerFeedbackHandlers(feedback, { buildDiagnostics: system?.buildSnapshot, getMainWindow })
  if (applicationUpdate) registerApplicationUpdateHandlers(applicationUpdate, getMainWindow)
  if (crafting) registerCraftingHandlers(crafting)
  if (chaosRecipe) registerChaosRecipeHandlers(chaosRecipe, window, { interfaceDetection, automationLock })
  if (priceCheck) registerPriceCheckHandlers(priceCheck)
  if (poeCnAccount) registerPoeCnAccountHandlers(poeCnAccount, window)
  if (stashPickup) registerStashPickupHandlers(stashPickup, window, { interfaceDetection })
  if (junfeng) registerJunfengHandlers(junfeng, window, { interfaceDetection, enableTraining: enableJunfengTraining })
  if (puzzle) registerPuzzleHandlers(puzzle)
}
