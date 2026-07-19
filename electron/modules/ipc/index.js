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
import { registerCombatHandlers } from './combat.js'

export function registerIpcHandlers(dependencies) {
  const { window, python, fileWatcher, itemParser, itemMatcher, shortcut } = dependencies

  registerWindowHandlers(window)
  registerPythonHandlers(python, window, fileWatcher)
  registerFileHandlers(fileWatcher, itemParser, itemMatcher, window)
  registerShortcutHandlers(shortcut, window)
  registerBagHandlers(python, window, fileWatcher)
  registerCombatHandlers(python, window, fileWatcher)
}
