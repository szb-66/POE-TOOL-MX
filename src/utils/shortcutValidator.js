/**
 * Purpose: 快捷键验证工具，检查快捷键是否重复或冲突
 * Inputs: shortcuts (object) - 快捷键对象
 * Outputs: { isValid: boolean, error: string } - 验证结果
 * Preconditions: shortcuts 必须包含 itemStart, mapStart, end 字段
 * Edge cases: 空快捷键视为有效；重复时返回错误
 * Errors: 验证失败返回错误信息，不抛出异常
 */

/**
 * Purpose: 验证快捷键是否重复
 * Inputs: shortcuts (object) - 快捷键对象
 * Outputs: { isValid: boolean, error: string } - 验证结果
 */
export function validateShortcuts(shortcuts) {
  const shortcutValues = [
    shortcuts.itemStart,
    shortcuts.mapStart,
    shortcuts.end
  ].filter(s => s && s.trim())

  const uniqueShortcuts = new Set(shortcutValues)

  if (shortcutValues.length !== uniqueShortcuts.size) {
    return {
      isValid: false,
      error: '不同功能的快捷键不能重复，请修改'
    }
  }

  return { isValid: true }
}

/**
 * 检查快捷键是否与其他快捷键冲突
 * @param {string} shortcut - 要检查的快捷键
 * @param {Object} allShortcuts - 所有快捷键对象
 * @param {string} excludeKey - 排除的键（当前正在编辑的键）
 * @returns {boolean} - 是否冲突
 */
export function isShortcutConflict(shortcut, allShortcuts, excludeKey) {
  if (!shortcut || !shortcut.trim()) {
    return false
  }

  for (const [key, value] of Object.entries(allShortcuts)) {
    if (key !== excludeKey && value === shortcut) {
      return true
    }
  }

  return false
}
